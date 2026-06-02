import { randomUUID } from 'crypto';
import type { PackagingUnit } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { recordTiming } from '../plugins/timer';
import { markMci } from './mci.service';

const prisma = getPrismaClient();

export interface MockSummary {
  transportCode: string;
  packagingCount: number;
  goodsCount: number;
  packingDepth: number;
}

export async function generateMockCargo(options: {
  transportCode: string;
  transportType: string;
  departureLocationCode: string;
  arrivalLocationCode: string;
  goodsCount: number;
  packingDepth?: number;
}): Promise<{ transportUnitId: string; summary: MockSummary }> {
  const packingDepth = options.packingDepth ?? 2;

  const [departure, arrival] = await Promise.all([
    prisma.location.findUnique({ where: { code: options.departureLocationCode } }),
    prisma.location.findUnique({ where: { code: options.arrivalLocationCode } }),
  ]);

  if (!departure || !arrival) {
    throw new Error('Departure or arrival location not found');
  }

  const packagingTypes = await prisma.packagingType.findMany();
  if (packagingTypes.length === 0) {
    throw new Error('No packaging types configured');
  }

  const products = await prisma.product.findMany();
  if (products.length === 0) {
    throw new Error('No products configured');
  }

  const transport = await recordTiming('create:transport', () =>
    prisma.transportUnit.create({
      data: {
        code: options.transportCode,
        type: options.transportType,
        departureLocationId: departure.id,
        arrivalLocationId: arrival.id,
      },
    })
  );

  const { packagingUnits, leafIds } = await recordTiming('create:packaging_tree', async () => {
    const units: { id: string; depth: number }[] = [];
    const leaves: string[] = [];
    let parentId: string | null = null;
    let parentPath = '';

    for (let depth = 0; depth < packingDepth; depth++) {
      const packagingType = packagingTypes[depth % packagingTypes.length];
      const id = randomUUID();
      const path = parentId ? `${parentPath}${id}/` : `/${id}/`;
      const isLeaf = depth === packingDepth - 1;

      const unit: PackagingUnit = await prisma.packagingUnit.create({
        data: {
          id,
          transportUnitId: transport.id,
          parentId,
          path,
          depth,
          packagingTypeId: packagingType.id,
          firstLocationId: departure.id,
          lastLocationId: arrival.id,
        },
      });

      units.push({ id: unit.id, depth });
      if (isLeaf) {
        leaves.push(unit.id);
      }

      parentId = unit.id;
      parentPath = path;
    }

    return { packagingUnits: units, leafIds: leaves };
  });

  await recordTiming('create:goods_items', async () => {
    const itemsPerLeaf = Math.max(1, Math.floor(options.goodsCount / leafIds.length));
    let remaining = options.goodsCount;
    let created = 0;

    for (let i = 0; i < leafIds.length && remaining > 0; i++) {
      const leafId = leafIds[i];
      const count =
        i === leafIds.length - 1 ? remaining : Math.min(itemsPerLeaf, remaining);

      for (let g = 0; g < count; g++) {
        const product = products[created % products.length];
        await prisma.goodsItem.create({
          data: {
            packagingUnitId: leafId,
            productId: product.id,
            firstLocationId: departure.id,
            lastLocationId: arrival.id,
          },
        });
        created++;
        remaining--;
      }
    }
  });

  await markMci(transport.id);

  return {
    transportUnitId: transport.id,
    summary: {
      transportCode: options.transportCode,
      packagingCount: packagingUnits.length,
      goodsCount: options.goodsCount,
      packingDepth,
    },
  };
}
