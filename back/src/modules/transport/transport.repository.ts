import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../infrastructure/db/prisma';
import {
  TRANSPORT_TREE_GOODS_PREVIEW_PER_NODE,
  TRANSPORT_TREE_INLINE_GOODS_MAX,
} from '../../shared/constants/limits';
import { NotFoundError } from '../../core/errors/AppError';

const prisma = getPrismaClient();

const locationSelect = { select: { id: true, code: true, name: true } } as const;

const goodsSelect = {
  id: true,
  serialNumber: true,
  status: true,
  isMci: true,
  product: { select: { id: true, name: true, sku: true } },
  firstLocation: locationSelect,
  lastLocation: locationSelect,
} as const;

type GoodsPreviewRow = {
  packagingUnitId: string;
  id: string;
  serialNumber: string;
  status: string;
  isMci: boolean;
  product_id: string;
  product_name: string;
  product_sku: string;
  first_loc_id: string;
  first_loc_code: string;
  first_loc_name: string;
  last_loc_id: string;
  last_loc_code: string;
  last_loc_name: string;
};

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
      firstLocation: locationSelect,
      lastLocation: locationSelect,
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
 * Loads a capped preview per packaging node (for large transports) in one query.
 */
export async function listGoodsPreviewForTransport(transportUnitId: string) {
  const rows = await prisma.$queryRaw<GoodsPreviewRow[]>(Prisma.sql`
    WITH ranked AS (
      SELECT
        gi.id,
        gi."serialNumber",
        gi.status,
        gi."isMci",
        gi."packagingUnitId",
        gi."createdAt",
        ROW_NUMBER() OVER (
          PARTITION BY gi."packagingUnitId"
          ORDER BY gi."createdAt" ASC
        ) AS rn
      FROM "GoodsItem" gi
      INNER JOIN "PackagingUnit" pu ON gi."packagingUnitId" = pu.id
      WHERE pu."transportUnitId" = ${transportUnitId}
    )
    SELECT
      r."packagingUnitId",
      r.id,
      r."serialNumber",
      r.status,
      r."isMci",
      p.id AS product_id,
      p.name AS product_name,
      p.sku AS product_sku,
      fl.id AS first_loc_id,
      fl.code AS first_loc_code,
      fl.name AS first_loc_name,
      ll.id AS last_loc_id,
      ll.code AS last_loc_code,
      ll.name AS last_loc_name
    FROM ranked r
    INNER JOIN "GoodsItem" gi ON gi.id = r.id
    INNER JOIN "Product" p ON gi."productId" = p.id
    INNER JOIN "Location" fl ON gi."firstLocationId" = fl.id
    INNER JOIN "Location" ll ON gi."lastLocationId" = ll.id
    WHERE r.rn <= ${TRANSPORT_TREE_GOODS_PREVIEW_PER_NODE}
    ORDER BY r."packagingUnitId", r."createdAt"
  `);

  return rows.map((row) => ({
    packagingUnitId: row.packagingUnitId,
    id: row.id,
    serialNumber: row.serialNumber,
    status: row.status,
    isMci: row.isMci,
    product: {
      id: row.product_id,
      name: row.product_name,
      sku: row.product_sku,
    },
    firstLocation: {
      id: row.first_loc_id,
      code: row.first_loc_code,
      name: row.first_loc_name,
    },
    lastLocation: {
      id: row.last_loc_id,
      code: row.last_loc_code,
      name: row.last_loc_name,
    },
  }));
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
