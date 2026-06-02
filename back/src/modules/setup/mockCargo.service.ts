import { randomUUID } from 'crypto';
import { getPrismaClient } from '../../infrastructure/db/prisma';
import { createManyInBatches } from '../../infrastructure/db/batchInsert';
import { SETUP_GOODS_INSERT_BATCH_SIZE } from '../../shared/constants/limits';
import { recordTiming } from '../metrics/timer.service';
import { markMci } from '../mci/mci.service';
import type { MockSummary } from './mockCargo.types';

const prisma = getPrismaClient();

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

  const { packagingCount, leafId } = await recordTiming('create:packaging_tree', async () => {
    const unitIds: string[] = [];
    const packagingRows: Array<{
      id: string;
      transportUnitId: string;
      parentId: string | null;
      path: string;
      depth: number;
      packagingTypeId: string;
      firstLocationId: string;
      lastLocationId: string;
    }> = [];

    let parentPath = '';
    for (let depth = 0; depth < packingDepth; depth++) {
      const id = randomUUID();
      unitIds.push(id);
      const parentId = depth === 0 ? null : unitIds[depth - 1];
      const path = depth === 0 ? `/${id}/` : `${parentPath}${id}/`;
      parentPath = path;

      packagingRows.push({
        id,
        transportUnitId: transport.id,
        parentId,
        path,
        depth,
        packagingTypeId: packagingTypes[depth % packagingTypes.length].id,
        firstLocationId: departure.id,
        lastLocationId: arrival.id,
      });
    }

    await prisma.packagingUnit.createMany({ data: packagingRows });

    return {
      packagingCount: packagingRows.length,
      leafId: unitIds[packingDepth - 1],
    };
  });

  await recordTiming('create:goods_items', async () => {
    const productIds = products.map((p) => p.id);
    const goodsRows = Array.from({ length: options.goodsCount }, (_, index) => ({
      packagingUnitId: leafId,
      productId: productIds[index % productIds.length],
      firstLocationId: departure.id,
      lastLocationId: arrival.id,
    }));

    await createManyInBatches(goodsRows, SETUP_GOODS_INSERT_BATCH_SIZE, (batch) =>
      prisma.goodsItem.createMany({ data: batch })
    );
  });

  await markMci(transport.id);

  return {
    transportUnitId: transport.id,
    summary: {
      transportCode: options.transportCode,
      packagingCount,
      goodsCount: options.goodsCount,
      packingDepth,
    },
  };
}
