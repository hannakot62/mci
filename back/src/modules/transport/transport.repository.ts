import { getPrismaClient } from '../../infrastructure/db/prisma';
import {
  TRANSPORT_TREE_GOODS_PREVIEW_PER_NODE,
  TRANSPORT_TREE_INLINE_GOODS_MAX,
} from '../../shared/constants/limits';
import { NotFoundError } from '../../core/errors/AppError';

const prisma = getPrismaClient();

const goodsSelect = {
  id: true,
  serialNumber: true,
  status: true,
  product: { select: { id: true, name: true, sku: true } },
} as const;

export async function listTransportUnits() {
  return prisma.transportUnit.findMany({
    select: {
      id: true,
      code: true,
      type: true,
      status: true,
      createdAt: true,
      departureLocation: { select: { code: true, name: true } },
      arrivalLocation: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTransportUnitById(id: string) {
  return prisma.transportUnit.findUnique({
    where: { id },
    include: {
      departureLocation: true,
      arrivalLocation: true,
    },
  });
}

export async function countGoodsForTransport(transportUnitId: string): Promise<number> {
  return prisma.goodsItem.count({
    where: { packagingUnit: { transportUnitId } },
  });
}

export async function listPackagingUnitsForTransport(transportUnitId: string) {
  return prisma.packagingUnit.findMany({
    where: { transportUnitId },
    include: {
      packagingType: { select: { id: true, name: true } },
    },
    orderBy: { depth: 'asc' },
  });
}

export async function countGoodsByPackagingUnit(
  transportUnitId: string
): Promise<Map<string, number>> {
  const rows = await prisma.goodsItem.groupBy({
    by: ['packagingUnitId'],
    where: { packagingUnit: { transportUnitId } },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.packagingUnitId, row._count._all]));
}

export async function listAllGoodsForTransport(transportUnitId: string) {
  return prisma.goodsItem.findMany({
    where: { packagingUnit: { transportUnitId } },
    select: {
      packagingUnitId: true,
      ...goodsSelect,
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Loads a capped preview per packaging node (for large transports).
 */
export async function listGoodsPreviewForTransport(transportUnitId: string) {
  const packagingIds = await prisma.packagingUnit.findMany({
    where: {
      transportUnitId,
      goods: { some: {} },
    },
    select: { id: true },
  });

  const previews = await Promise.all(
    packagingIds.map(({ id }) =>
      prisma.goodsItem.findMany({
        where: { packagingUnitId: id },
        select: {
          packagingUnitId: true,
          ...goodsSelect,
        },
        take: TRANSPORT_TREE_GOODS_PREVIEW_PER_NODE,
        orderBy: { createdAt: 'asc' },
      })
    )
  );

  return previews.flat();
}

export function shouldInlineGoodsInTree(totalGoods: number): boolean {
  return totalGoods <= TRANSPORT_TREE_INLINE_GOODS_MAX;
}

export async function updateTransportUnitStatus(id: string, status: string): Promise<void> {
  const result = await prisma.transportUnit.updateMany({
    where: { id },
    data: { status },
  });

  if (result.count === 0) {
    throw new NotFoundError('Transport not found');
  }
}

export async function listLocations() {
  return prisma.location.findMany({
    orderBy: { name: 'asc' },
  });
}
