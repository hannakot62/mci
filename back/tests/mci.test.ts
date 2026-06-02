import { beforeEach, describe, expect, it } from 'vitest';
import { getPrismaClient } from '../src/infrastructure/db/prisma';
import {
  findMci,
  findMcis,
  markMci,
  updateStatusViaMci,
} from '../src/modules/mci/mci.service';
import {
  createGoods,
  createPackaging,
  createTransport,
  ensureBaseSeed,
  resetCargoData,
} from './helpers';

const prisma = getPrismaClient();

describe('MCI algorithm', () => {
  beforeEach(async () => {
    await resetCargoData();
  });

  it('happy path — flat structure, all goods same location → MCI = root packaging', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const root = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    await createGoods({
      packagingUnitId: root.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    await createGoods({
      packagingUnitId: root.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciId = await findMci(transportId);
    expect(mciId).toBe(root.id);
  });

  it('nested happy path — 3 levels deep, all same location → MCI = top-level packaging', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const root = await createPackaging({
      transportId,
      typeId: seed.palletTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      depth: 0,
    });

    const mid = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      parentId: root.id,
      parentPath: root.path,
      depth: 1,
    });

    const leaf = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      parentId: mid.id,
      parentPath: mid.path,
      depth: 2,
    });

    await createGoods({
      packagingUnitId: leaf.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciId = await findMci(transportId);
    expect(mciId).toBe(root.id);
  });

  it('mixed locations in same box — packaging not MCI, each goods item is MCI', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const root = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    await createGoods({
      packagingUnitId: root.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    await createGoods({
      packagingUnitId: root.id,
      productId: seed.productId,
      firstLocationId: seed.altLocationId,
      lastLocationId: seed.arrivalId,
    });

    const mciIds = await markMci(transportId);
    expect(mciIds).toHaveLength(2);
    expect(mciIds).not.toContain(root.id);
  });

  it('empty packaging — packaging with no goods → not selected as MCI', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciId = await findMci(transportId);
    expect(mciId).toBeNull();
  });

  it('multiple candidates — two sibling subtrees, each qualifies → both marked as MCI', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const subtreeA = await createPackaging({
      transportId,
      typeId: seed.palletTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    const subtreeB = await createPackaging({
      transportId,
      typeId: seed.palletTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const leafA = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      parentId: subtreeA.id,
      parentPath: subtreeA.path,
      depth: 1,
    });
    const leafB = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      parentId: subtreeB.id,
      parentPath: subtreeB.path,
      depth: 1,
    });

    await createGoods({
      packagingUnitId: leafA.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    await createGoods({
      packagingUnitId: leafA.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    await createGoods({
      packagingUnitId: leafA.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    await createGoods({
      packagingUnitId: leafB.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciIds = await findMcis(transportId);
    expect(mciIds).toContain(subtreeA.id);
    expect(mciIds).toContain(subtreeB.id);
    expect(mciIds).toHaveLength(2);
  });

  it('parent inconsistent route — two child pallets with consistent subtrees → both pallets are MCI', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const crate = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.arrivalId,
      lastLocationId: seed.departureId,
      depth: 0,
    });

    const palletA = await createPackaging({
      transportId,
      typeId: seed.palletTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      parentId: crate.id,
      parentPath: crate.path,
      depth: 1,
    });
    const palletB = await createPackaging({
      transportId,
      typeId: seed.palletTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      parentId: crate.id,
      parentPath: crate.path,
      depth: 1,
    });

    await createGoods({
      packagingUnitId: palletA.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    await createGoods({
      packagingUnitId: palletB.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciIds = await markMci(transportId);
    expect(mciIds).toContain(palletA.id);
    expect(mciIds).toContain(palletB.id);
    expect(mciIds).not.toContain(crate.id);

    const crateRow = await prisma.packagingUnit.findUnique({ where: { id: crate.id } });
    expect(crateRow?.isMci).toBe(false);
  });

  it('conflicting goods in same leaf box → each goods item becomes MCI', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const box = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const goodA = await createGoods({
      packagingUnitId: box.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });
    await createGoods({
      packagingUnitId: box.id,
      productId: seed.productId,
      firstLocationId: seed.altLocationId,
      lastLocationId: seed.arrivalId,
    });

    const mciIds = await markMci(transportId);
    expect(mciIds).toHaveLength(2);
    expect(mciIds).toContain(goodA.id);
    expect(mciIds).not.toContain(box.id);

    const boxRow = await prisma.packagingUnit.findUnique({ where: { id: box.id } });
    expect(boxRow?.isMci).toBe(false);
  });

  it('single goods item — one item in one box → MCI = that box', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const box = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    await createGoods({
      packagingUnitId: box.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciId = await findMci(transportId);
    expect(mciId).toBe(box.id);
  });

  it('after dispatch — status update propagates to all descendants', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport();

    const root = await createPackaging({
      transportId,
      typeId: seed.palletTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const leaf = await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
      parentId: root.id,
      parentPath: root.path,
      depth: 1,
    });

    await createGoods({
      packagingUnitId: leaf.id,
      productId: seed.productId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciIds = await markMci(transportId);
    expect(mciIds).toContain(root.id);

    await updateStatusViaMci(root.id, 'in_transit');

    const packagingStatuses = await prisma.packagingUnit.findMany({
      where: { transportUnitId: transportId },
      select: { status: true },
    });
    const goodsStatuses = await prisma.goodsItem.findMany({
      where: { packagingUnit: { transportUnitId: transportId } },
      select: { status: true },
    });

    expect(packagingStatuses.every((p) => p.status === 'in_transit')).toBe(true);
    expect(goodsStatuses.every((g) => g.status === 'in_transit')).toBe(true);
  });
});
