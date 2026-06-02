import { randomUUID } from 'crypto';
import type { PackagingType, Product } from '@prisma/client';
import { getPrismaClient } from '../../infrastructure/db/prisma';
import { createManyInBatches } from '../../infrastructure/db/batchInsert';
import { SETUP_GOODS_INSERT_BATCH_SIZE } from '../../shared/constants/limits';
import { recordTiming } from '../metrics/timer.service';
import { markMci } from '../mci/mci.service';
import type { MockSummary } from './mockCargo.types';
import { maybeAlternateRoute, pickRandomRoute, type LocationRef } from './randomLocations';
import type { ProductGroupConfig } from './setup.types';

const prisma = getPrismaClient();

type PackagingRow = {
  id: string;
  transportUnitId: string;
  parentId: string | null;
  path: string;
  depth: number;
  packagingTypeId: string;
  firstLocationId: string;
  lastLocationId: string;
};

function resolvePackagingType(
  types: PackagingType[],
  product: Product,
  depth: number,
  preferredName?: string
): PackagingType {
  if (preferredName) {
    const match = types.find((t) => t.name === preferredName);
    if (match) return match;
  }
  const allowed = product.allowedPackagingTypes.split(',').map((s) => s.trim());
  const allowedTypes = types.filter((t) => allowed.includes(t.name));
  const pool = allowedTypes.length > 0 ? allowedTypes : types;
  return pool[depth % pool.length];
}

function expandPackagingChildren(
  transportId: string,
  parentId: string,
  parentPath: string,
  parentDepth: number,
  levelIndex: number,
  nestingLevels: ProductGroupConfig['nestingLevels'],
  types: PackagingType[],
  product: Product,
  route: { firstLocationId: string; lastLocationId: string },
  locations: LocationRef[],
  rows: PackagingRow[],
  leaves: string[]
): void {
  const levelConfig = nestingLevels[levelIndex];
  if (!levelConfig || levelConfig.childCount <= 0) {
    leaves.push(parentId);
    return;
  }

  for (let i = 0; i < levelConfig.childCount; i++) {
    const id = randomUUID();
    const path = `${parentPath}${id}/`;
    const depth = parentDepth + 1;
    const loc = maybeAlternateRoute(route, locations);
    const packagingType = resolvePackagingType(types, product, depth, levelConfig.packagingTypeName);

    rows.push({
      id,
      transportUnitId: transportId,
      parentId,
      path,
      depth,
      packagingTypeId: packagingType.id,
      firstLocationId: loc.firstLocationId,
      lastLocationId: loc.lastLocationId,
    });

    const nextLevel = nestingLevels[levelIndex + 1];
    if (nextLevel && nextLevel.childCount > 0) {
      expandPackagingChildren(
        transportId,
        id,
        path,
        depth,
        levelIndex + 1,
        nestingLevels,
        types,
        product,
        route,
        locations,
        rows,
        leaves
      );
    } else {
      leaves.push(id);
    }
  }
}

function buildProductGroup(
  transportId: string,
  group: ProductGroupConfig,
  product: Product,
  types: PackagingType[],
  locations: LocationRef[],
  rows: PackagingRow[],
  goodsRows: Array<{
    packagingUnitId: string;
    productId: string;
    firstLocationId: string;
    lastLocationId: string;
  }>
): void {
  const route = pickRandomRoute(locations);
  const leaves: string[] = [];
  const roots = Math.max(1, group.rootPackagingCount);

  for (let r = 0; r < roots; r++) {
    const rootId = randomUUID();
    const path = `/${rootId}/`;
    const rootLoc = maybeAlternateRoute(route, locations);
    const rootType = resolvePackagingType(types, product, 0, group.nestingLevels[0]?.packagingTypeName);

    rows.push({
      id: rootId,
      transportUnitId: transportId,
      parentId: null,
      path,
      depth: 0,
      packagingTypeId: rootType.id,
      firstLocationId: rootLoc.firstLocationId,
      lastLocationId: rootLoc.lastLocationId,
    });

    const hasChildren = group.nestingLevels.some((l) => l.childCount > 0);
    if (!hasChildren) {
      leaves.push(rootId);
    } else {
      expandPackagingChildren(
        transportId,
        rootId,
        path,
        0,
        0,
        group.nestingLevels,
        types,
        product,
        route,
        locations,
        rows,
        leaves
      );
    }
  }

  if (leaves.length === 0) {
    throw new Error(`No leaf packaging for product ${group.productSku}`);
  }

  for (let g = 0; g < group.goodsCount; g++) {
    const leafId = leaves[g % leaves.length];
    const leafRow = rows.find((row) => row.id === leafId);
    const loc = leafRow
      ? { firstLocationId: leafRow.firstLocationId, lastLocationId: leafRow.lastLocationId }
      : route;

    goodsRows.push({
      packagingUnitId: leafId,
      productId: product.id,
      firstLocationId: loc.firstLocationId,
      lastLocationId: loc.lastLocationId,
    });
  }
}

export async function generateMockCargo(options: {
  transportCode: string;
  transportType: string;
  productGroups: ProductGroupConfig[];
}): Promise<{ transportUnitId: string; summary: MockSummary }> {
  const locations = await prisma.location.findMany({
    select: { id: true, code: true },
  });
  if (locations.length < 2) {
    throw new Error('At least two locations required');
  }

  const packagingTypes = await prisma.packagingType.findMany();
  if (packagingTypes.length === 0) {
    throw new Error('No packaging types configured');
  }

  const products = await prisma.product.findMany();
  if (products.length === 0) {
    throw new Error('No products configured');
  }

  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const transport = await recordTiming('create:transport', () =>
    prisma.transportUnit.create({
      data: {
        code: options.transportCode,
        type: options.transportType,
      },
    })
  );

  const packagingRows: PackagingRow[] = [];
  const goodsRows: Array<{
    packagingUnitId: string;
    productId: string;
    firstLocationId: string;
    lastLocationId: string;
  }> = [];

  for (const group of options.productGroups) {
    const product = productBySku.get(group.productSku);
    if (!product) {
      throw new Error(`Product not found: ${group.productSku}`);
    }
    buildProductGroup(
      transport.id,
      group,
      product,
      packagingTypes,
      locations,
      packagingRows,
      goodsRows
    );
  }

  await recordTiming('create:packaging_tree', async () => {
    if (packagingRows.length > 0) {
      await prisma.packagingUnit.createMany({ data: packagingRows });
    }
  });

  await recordTiming('create:goods_items', async () => {
    await createManyInBatches(goodsRows, SETUP_GOODS_INSERT_BATCH_SIZE, (batch) =>
      prisma.goodsItem.createMany({ data: batch })
    );
  });

  const mciIds = await markMci(transport.id);

  const goodsCount = goodsRows.length;

  return {
    transportUnitId: transport.id,
    summary: {
      transportCode: options.transportCode,
      packagingCount: packagingRows.length,
      goodsCount,
      productGroupCount: options.productGroups.length,
      mciCount: mciIds.length,
    },
  };
}
