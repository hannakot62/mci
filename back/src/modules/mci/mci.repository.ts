import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../infrastructure/db/prisma';
import { createManyInBatches } from '../../infrastructure/db/batchInsert';
import { MCI_MARK_BATCH_SIZE } from '../../shared/constants/limits';

const prisma = getPrismaClient();

export type MciEntityType = 'packaging' | 'goods';

export interface MciPackagingRow {
  id: string;
}

export interface MciGoodsRow {
  id: string;
  productId: string;
}

/**
 * All maximal packaging MCIs: subtree is route-consistent, and no ancestor is also a candidate.
 */
export async function findPackagingMciCandidates(
  transportUnitId: string
): Promise<MciPackagingRow[]> {
  return prisma.$queryRaw<MciPackagingRow[]>(Prisma.sql`
    WITH candidates AS (
      SELECT
        pu.id,
        pu.path
      FROM "PackagingUnit" pu
      LEFT JOIN "PackagingUnit" subtree
        ON subtree."transportUnitId" = pu."transportUnitId"
        AND (subtree.id = pu.id OR subtree.path LIKE pu.path || '%')
      LEFT JOIN "GoodsItem" gi ON gi."packagingUnitId" = subtree.id
      WHERE pu."transportUnitId" = ${transportUnitId}
      GROUP BY pu.id, pu.path
      HAVING COUNT(gi.id) >= 1
        AND COUNT(DISTINCT gi."productId") = 1
        AND COUNT(DISTINCT gi."firstLocationId") = 1
        AND COUNT(DISTINCT gi."lastLocationId") = 1
        AND COUNT(DISTINCT subtree."firstLocationId") = 1
        AND COUNT(DISTINCT subtree."lastLocationId") = 1
    )
    SELECT c1.id
    FROM candidates c1
    WHERE NOT EXISTS (
      SELECT 1
      FROM candidates c2
      JOIN "PackagingUnit" pu1 ON pu1.id = c1.id
      JOIN "PackagingUnit" pu2 ON pu2.id = c2.id
      WHERE c2.id != c1.id
        AND pu1.path LIKE pu2.path || '%'
        AND LENGTH(pu1.path) > LENGTH(pu2.path)
    )
  `);
}

/**
 * Goods-level MCI when leaf packaging cannot be MCI (e.g. conflicting siblings in the same box).
 */
export async function findGoodsMciCandidates(
  transportUnitId: string
): Promise<MciGoodsRow[]> {
  return prisma.$queryRaw<MciGoodsRow[]>(Prisma.sql`
    WITH candidates AS (
      SELECT
        pu.id,
        pu.path
      FROM "PackagingUnit" pu
      LEFT JOIN "PackagingUnit" subtree
        ON subtree."transportUnitId" = pu."transportUnitId"
        AND (subtree.id = pu.id OR subtree.path LIKE pu.path || '%')
      LEFT JOIN "GoodsItem" gi ON gi."packagingUnitId" = subtree.id
      WHERE pu."transportUnitId" = ${transportUnitId}
      GROUP BY pu.id, pu.path
      HAVING COUNT(gi.id) >= 1
        AND COUNT(DISTINCT gi."productId") = 1
        AND COUNT(DISTINCT gi."firstLocationId") = 1
        AND COUNT(DISTINCT gi."lastLocationId") = 1
        AND COUNT(DISTINCT subtree."firstLocationId") = 1
        AND COUNT(DISTINCT subtree."lastLocationId") = 1
    ),
    maximal_packaging AS (
      SELECT c1.id
      FROM candidates c1
      WHERE NOT EXISTS (
        SELECT 1
        FROM candidates c2
        JOIN "PackagingUnit" pu1 ON pu1.id = c1.id
        JOIN "PackagingUnit" pu2 ON pu2.id = c2.id
        WHERE c2.id != c1.id
          AND pu1.path LIKE pu2.path || '%'
          AND LENGTH(pu1.path) > LENGTH(pu2.path)
      )
    )
    SELECT gi.id, gi."productId"
    FROM "GoodsItem" gi
    JOIN "PackagingUnit" pu ON gi."packagingUnitId" = pu.id
    WHERE pu."transportUnitId" = ${transportUnitId}
      AND NOT EXISTS (
        SELECT 1 FROM "PackagingUnit" child WHERE child."parentId" = pu.id
      )
      AND pu.id NOT IN (SELECT id FROM maximal_packaging)
      AND NOT EXISTS (
        SELECT 1
        FROM maximal_packaging mp
        JOIN "PackagingUnit" anc ON anc.id = mp.id
        WHERE anc."transportUnitId" = pu."transportUnitId"
          AND pu.path LIKE anc.path || '%'
          AND anc.id != pu.id
      )
      AND EXISTS (
        SELECT 1
        FROM "GoodsItem" other
        WHERE other."packagingUnitId" = pu.id
          AND other.id != gi.id
          AND (
            other."firstLocationId" != gi."firstLocationId"
            OR other."lastLocationId" != gi."lastLocationId"
          )
      )
  `);
}

export async function unmarkAllMci(transportUnitId: string): Promise<void> {
  await prisma.$transaction([
    prisma.packagingUnit.updateMany({
      where: { transportUnitId },
      data: { isMci: false },
    }),
    prisma.goodsItem.updateMany({
      where: { packagingUnit: { transportUnitId } },
      data: { isMci: false },
    }),
  ]);
}

export async function markPackagingMciByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  await createManyInBatches(ids, MCI_MARK_BATCH_SIZE, async (batch) => {
    await prisma.packagingUnit.updateMany({
      where: { id: { in: batch } },
      data: { isMci: true },
    });
    return { count: batch.length };
  });
}

export async function markGoodsMciByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  await createManyInBatches(ids, MCI_MARK_BATCH_SIZE, async (batch) => {
    await prisma.goodsItem.updateMany({
      where: { id: { in: batch } },
      data: { isMci: true },
    });
    return { count: batch.length };
  });
}

export type MciEntityRef = {
  id: string;
  type: MciEntityType;
  status: string;
  productId: string | null;
};

export async function getMcisForTransport(transportUnitId: string): Promise<MciEntityRef[]> {
  const [packaging, goods] = await Promise.all([
    prisma.packagingUnit.findMany({
      where: { transportUnitId, isMci: true },
      select: {
        id: true,
        status: true,
        goods: { select: { productId: true }, take: 1 },
      },
      orderBy: { depth: 'asc' },
    }),
    prisma.goodsItem.findMany({
      where: { packagingUnit: { transportUnitId }, isMci: true },
      select: { id: true, status: true, productId: true },
    }),
  ]);

  return [
    ...packaging.map((m) => ({
      id: m.id,
      type: 'packaging' as const,
      status: m.status,
      productId: m.goods[0]?.productId ?? null,
    })),
    ...goods.map((m) => ({
      id: m.id,
      type: 'goods' as const,
      status: m.status,
      productId: m.productId,
    })),
  ];
}

export async function getMciEntity(
  id: string
): Promise<
  | { type: 'packaging'; id: string; path: string; transportUnitId: string }
  | { type: 'goods'; id: string; transportUnitId: string }
  | null
> {
  const packaging = await prisma.packagingUnit.findUnique({
    where: { id },
    select: { id: true, path: true, transportUnitId: true, isMci: true },
  });
  if (packaging?.isMci && packaging.transportUnitId) {
    return {
      type: 'packaging',
      id: packaging.id,
      path: packaging.path,
      transportUnitId: packaging.transportUnitId,
    };
  }

  const goods = await prisma.goodsItem.findUnique({
    where: { id },
    select: { id: true, isMci: true, packagingUnit: { select: { transportUnitId: true } } },
  });
  if (goods?.isMci && goods.packagingUnit.transportUnitId) {
    return {
      type: 'goods',
      id: goods.id,
      transportUnitId: goods.packagingUnit.transportUnitId,
    };
  }

  return null;
}

export async function updatePackagingSubtreeStatus(
  transportUnitId: string,
  mciId: string,
  pathPrefix: string,
  status: string
): Promise<number> {
  const result = await prisma.packagingUnit.updateMany({
    where: {
      transportUnitId,
      OR: [{ id: mciId }, { path: { startsWith: pathPrefix } }],
    },
    data: { status },
  });
  return result.count;
}

export async function updateGoodsInSubtreeStatus(
  transportUnitId: string,
  mciId: string,
  pathPrefix: string,
  status: string
): Promise<number> {
  const result = await prisma.goodsItem.updateMany({
    where: {
      packagingUnit: {
        transportUnitId,
        OR: [{ id: mciId }, { path: { startsWith: pathPrefix } }],
      },
    },
    data: { status },
  });
  return result.count;
}

export async function updateSingleGoodsStatus(goodsId: string, status: string): Promise<number> {
  const result = await prisma.goodsItem.updateMany({
    where: { id: goodsId },
    data: { status },
  });
  return result.count;
}

/**
 * Updates every packaging/goods unit covered by any packaging MCI subtree or goods-level MCI.
 * Two SQL statements regardless of MCI count (used by dispatch/deliver all).
 */
export async function updateAllMciSubtreesStatus(
  transportUnitId: string,
  status: string
): Promise<{ updatedPackaging: number; updatedGoods: number }> {
  const updatedPackaging = await prisma.$executeRaw(Prisma.sql`
    UPDATE "PackagingUnit" AS pu
    SET status = ${status}
    WHERE pu."transportUnitId" = ${transportUnitId}
      AND (
        pu."isMci" = 1
        OR EXISTS (
          SELECT 1
          FROM "PackagingUnit" AS mci
          WHERE mci."transportUnitId" = pu."transportUnitId"
            AND mci."isMci" = 1
            AND (pu.id = mci.id OR pu.path LIKE mci.path || '%')
        )
      )
  `);

  const updatedGoods = await prisma.$executeRaw(Prisma.sql`
    UPDATE "GoodsItem" AS gi
    SET status = ${status}
    WHERE EXISTS (
      SELECT 1
      FROM "PackagingUnit" AS pu
      WHERE pu.id = gi."packagingUnitId"
        AND pu."transportUnitId" = ${transportUnitId}
        AND (
          gi."isMci" = 1
          OR pu."isMci" = 1
          OR EXISTS (
            SELECT 1
            FROM "PackagingUnit" AS mci
            WHERE mci."transportUnitId" = pu."transportUnitId"
              AND mci."isMci" = 1
              AND (pu.id = mci.id OR pu.path LIKE mci.path || '%')
          )
        )
    )
  `);

  return {
    updatedPackaging: Number(updatedPackaging),
    updatedGoods: Number(updatedGoods),
  };
}
