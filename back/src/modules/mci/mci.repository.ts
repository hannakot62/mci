import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../infrastructure/db/prisma';

const prisma = getPrismaClient();

interface MciRow {
  id: string;
}

/**
 * Picks MCI using path-prefix subtree joins (no recursive CTE, no `%id%` path scans).
 */
export async function findMciCandidate(transportUnitId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<MciRow[]>(Prisma.sql`
    SELECT pu.id
    FROM "PackagingUnit" pu
    LEFT JOIN "PackagingUnit" subtree
      ON subtree."transportUnitId" = pu."transportUnitId"
      AND (subtree.id = pu.id OR subtree.path LIKE pu.path || '%')
    LEFT JOIN "GoodsItem" gi ON gi."packagingUnitId" = subtree.id
    WHERE pu."transportUnitId" = ${transportUnitId}
    GROUP BY pu.id, pu.depth
    HAVING COUNT(gi.id) >= 1
      AND COUNT(DISTINCT gi."firstLocationId") = 1
      AND COUNT(DISTINCT gi."lastLocationId") = 1
    ORDER BY COUNT(gi.id) DESC, pu.depth ASC
    LIMIT 1
  `);

  if (rows.length === 0) return null;
  return rows[0].id;
}

export async function unmarkAllMci(transportUnitId: string): Promise<void> {
  await prisma.packagingUnit.updateMany({
    where: { transportUnitId },
    data: { isMci: false },
  });
}

export async function markMciById(mciId: string): Promise<void> {
  await prisma.packagingUnit.update({
    where: { id: mciId },
    data: { isMci: true },
  });
}

export async function getMarkedMciId(transportUnitId: string): Promise<string | null> {
  const mci = await prisma.packagingUnit.findFirst({
    where: { transportUnitId, isMci: true },
    select: { id: true },
  });
  return mci?.id ?? null;
}

export async function getPackagingUnitById(
  id: string
): Promise<{ id: string; path: string; transportUnitId: string | null } | null> {
  return prisma.packagingUnit.findUnique({
    where: { id },
    select: { id: true, path: true, transportUnitId: true },
  });
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
