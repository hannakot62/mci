import { beforeEach, describe, expect, it } from 'vitest';
import { getPrismaClient } from '../src/infrastructure/db/prisma';
import {
  findMci,
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
    const { transportId } = await createTransport(seed.departureId, seed.arrivalId);

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
    const { transportId } = await createTransport(seed.departureId, seed.arrivalId);

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

  it('mixed locations — goods have different firstLocationId → no MCI', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport(seed.departureId, seed.arrivalId);

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

    const mciId = await findMci(transportId);
    expect(mciId).toBeNull();
  });

  it('empty packaging — packaging with no goods → not selected as MCI', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport(seed.departureId, seed.arrivalId);

    await createPackaging({
      transportId,
      typeId: seed.boxTypeId,
      firstLocationId: seed.departureId,
      lastLocationId: seed.arrivalId,
    });

    const mciId = await findMci(transportId);
    expect(mciId).toBeNull();
  });

  it('multiple candidates — two subtrees, each qualifies → MCI = the one with more goods', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport(seed.departureId, seed.arrivalId);

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

    const mciId = await findMci(transportId);
    expect(mciId).toBe(subtreeA.id);
  });

  it('single goods item — one item in one box → MCI = that box', async () => {
    const seed = await ensureBaseSeed();
    const { transportId } = await createTransport(seed.departureId, seed.arrivalId);

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
    const { transportId } = await createTransport(seed.departureId, seed.arrivalId);

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

    const mciId = await markMci(transportId);
    expect(mciId).toBe(root.id);

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
