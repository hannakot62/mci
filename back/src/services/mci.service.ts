import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { recordTiming } from '../plugins/timer';

const prisma = getPrismaClient();

interface MciRow {
  id: string;
}

export async function findMci(transportUnitId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<MciRow[]>(Prisma.sql`
    WITH RECURSIVE descendants AS (
      SELECT id, path, "firstLocationId", "lastLocationId", "parentId"
      FROM "PackagingUnit"
      WHERE "transportUnitId" = ${transportUnitId}

      UNION ALL

      SELECT p.id, p.path, p."firstLocationId", p."lastLocationId", p."parentId"
      FROM "PackagingUnit" p
      JOIN descendants d ON p."parentId" = d.id
    ),
    goods_per_node AS (
      SELECT pu.id, pu.depth,
        COUNT(gi.id) AS goods_count,
        COUNT(DISTINCT gi."firstLocationId") AS distinct_first,
        COUNT(DISTINCT gi."lastLocationId") AS distinct_last
      FROM "PackagingUnit" pu
      LEFT JOIN descendants d ON d.id = pu.id OR d.path LIKE '%' || pu.id || '%'
      LEFT JOIN "GoodsItem" gi ON gi."packagingUnitId" = d.id
      WHERE pu."transportUnitId" = ${transportUnitId}
      GROUP BY pu.id, pu.depth
    )
    SELECT id FROM goods_per_node
    WHERE goods_count >= 1
      AND distinct_first = 1
      AND distinct_last = 1
    ORDER BY goods_count DESC, depth ASC
    LIMIT 1
  `);

  if (rows.length === 0) return null;
  return rows[0].id;
}

export async function markMci(transportUnitId: string): Promise<string | null> {
  return recordTiming('markMci', async () => {
    const mciId = await findMci(transportUnitId);

    await prisma.packagingUnit.updateMany({
      where: { transportUnitId },
      data: { isMci: false },
    });

    if (mciId) {
      await prisma.packagingUnit.update({
        where: { id: mciId },
        data: { isMci: true },
      });
    }

    return mciId;
  });
}

export async function updateStatusViaMci(
  mciId: string,
  status: string
): Promise<{ updatedPackaging: number; updatedGoods: number }> {
  return recordTiming('updateStatusViaMci', async () => {
    const mci = await prisma.packagingUnit.findUnique({ where: { id: mciId } });
    if (!mci) {
      return { updatedPackaging: 0, updatedGoods: 0 };
    }

    const pathPrefix = mci.path;

    const packagingUnits = await prisma.packagingUnit.findMany({
      where: {
        OR: [{ id: mciId }, { path: { startsWith: pathPrefix } }],
      },
      select: { id: true },
    });

    const packagingIds = packagingUnits.map((p) => p.id);

    const packagingResult = await prisma.packagingUnit.updateMany({
      where: { id: { in: packagingIds } },
      data: { status },
    });

    const goodsResult = await prisma.goodsItem.updateMany({
      where: { packagingUnitId: { in: packagingIds } },
      data: { status },
    });

    return {
      updatedPackaging: packagingResult.count,
      updatedGoods: goodsResult.count,
    };
  });
}

export async function getMciForTransport(transportUnitId: string): Promise<string | null> {
  const mci = await prisma.packagingUnit.findFirst({
    where: { transportUnitId, isMci: true },
    select: { id: true },
  });
  return mci?.id ?? null;
}
