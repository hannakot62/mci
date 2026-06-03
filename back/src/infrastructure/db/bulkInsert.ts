import { Prisma } from '@prisma/client';
import type { getPrismaClient } from './prisma';

type PrismaClient = ReturnType<typeof getPrismaClient>;

export type GoodsInsertRow = {
  id: string;
  packagingUnitId: string;
  productId: string;
  firstLocationId: string;
  lastLocationId: string;
  isMci: boolean;
};

export type PackagingInsertRow = {
  id: string;
  transportUnitId: string;
  parentId: string | null;
  path: string;
  depth: number;
  packagingTypeId: string;
  firstLocationId: string;
  lastLocationId: string;
  isMci: boolean;
};

/**
 * Faster than repeated createMany — one INSERT per batch via raw SQL.
 */
export async function bulkInsertGoods(
  prisma: PrismaClient,
  rows: GoodsInsertRow[],
  batches: GoodsInsertRow[][]
): Promise<void> {
  if (rows.length === 0) return;

  await prisma.$transaction(
    batches.map((batch) => {
      const values = batch.map(
        (row) =>
          Prisma.sql`(${row.id}, ${row.id}, ${row.packagingUnitId}, ${row.productId}, ${row.firstLocationId}, ${row.lastLocationId}, ${row.isMci})`
      );
      return prisma.$executeRaw`
        INSERT INTO "GoodsItem" (
          id,
          "serialNumber",
          "packagingUnitId",
          "productId",
          "firstLocationId",
          "lastLocationId",
          "isMci"
        )
        VALUES ${Prisma.join(values)}
      `;
    })
  );
}

export async function bulkInsertPackaging(
  prisma: PrismaClient,
  rows: PackagingInsertRow[],
  batches: PackagingInsertRow[][]
): Promise<void> {
  if (rows.length === 0) return;

  await prisma.$transaction(
    batches.map((batch) => {
      const values = batch.map(
        (row) =>
          Prisma.sql`(${row.id}, ${row.transportUnitId}, ${row.parentId}, ${row.path}, ${row.depth}, ${row.packagingTypeId}, ${row.firstLocationId}, ${row.lastLocationId}, ${row.isMci})`
      );
      return prisma.$executeRaw`
        INSERT INTO "PackagingUnit" (
          id,
          "transportUnitId",
          "parentId",
          path,
          depth,
          "packagingTypeId",
          "firstLocationId",
          "lastLocationId",
          "isMci"
        )
        VALUES ${Prisma.join(values)}
      `;
    })
  );
}
