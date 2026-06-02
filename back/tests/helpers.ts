import { randomUUID } from 'crypto';
import { getPrismaClient } from '../src/config/database';

const prisma = getPrismaClient();

export async function resetCargoData(): Promise<void> {
  await prisma.goodsItem.deleteMany();
  await prisma.packagingUnit.deleteMany();
  await prisma.transportUnit.deleteMany();
}

export async function ensureBaseSeed(): Promise<{
  departureId: string;
  arrivalId: string;
  altLocationId: string;
  palletTypeId: string;
  boxTypeId: string;
  productId: string;
}> {
  const departure =
    (await prisma.location.findUnique({ where: { code: 'AMS' } })) ??
    (await prisma.location.create({
      data: { code: 'AMS', name: 'Amsterdam', type: 'warehouse' },
    }));

  const arrival =
    (await prisma.location.findUnique({ where: { code: 'RTM' } })) ??
    (await prisma.location.create({
      data: { code: 'RTM', name: 'Rotterdam', type: 'port' },
    }));

  const alt =
    (await prisma.location.findUnique({ where: { code: 'BER' } })) ??
    (await prisma.location.create({
      data: { code: 'BER', name: 'Berlin', type: 'warehouse' },
    }));

  const pallet =
    (await prisma.packagingType.findUnique({ where: { name: 'pallet' } })) ??
    (await prisma.packagingType.create({ data: { name: 'pallet' } }));

  const box =
    (await prisma.packagingType.findUnique({ where: { name: 'box' } })) ??
    (await prisma.packagingType.create({ data: { name: 'box' } }));

  const product =
    (await prisma.product.findFirst()) ??
    (await prisma.product.create({
      data: { name: 'Test Product', sku: `SKU-TEST-${randomUUID().slice(0, 8)}` },
    }));

  return {
    departureId: departure.id,
    arrivalId: arrival.id,
    altLocationId: alt.id,
    palletTypeId: pallet.id,
    boxTypeId: box.id,
    productId: product.id,
  };
}

export async function createTransport(
  departureId: string,
  arrivalId: string
): Promise<{ transportId: string }> {
  const transport = await prisma.transportUnit.create({
    data: {
      code: `TST-${randomUUID().slice(0, 8)}`,
      type: 'truck',
      departureLocationId: departureId,
      arrivalLocationId: arrivalId,
    },
  });
  return { transportId: transport.id };
}

export async function createPackaging(options: {
  transportId: string;
  typeId: string;
  firstLocationId: string;
  lastLocationId: string;
  parentId?: string | null;
  parentPath?: string;
  depth?: number;
}): Promise<{ id: string; path: string }> {
  const id = randomUUID();
  const parentId = options.parentId ?? null;
  const path = parentId
    ? `${options.parentPath ?? '/'}${id}/`
    : `/${id}/`;

  const unit = await prisma.packagingUnit.create({
    data: {
      id,
      transportUnitId: options.transportId,
      parentId,
      path,
      depth: options.depth ?? 0,
      packagingTypeId: options.typeId,
      firstLocationId: options.firstLocationId,
      lastLocationId: options.lastLocationId,
    },
  });

  return { id: unit.id, path: unit.path };
}

export async function createGoods(options: {
  packagingUnitId: string;
  productId: string;
  firstLocationId: string;
  lastLocationId: string;
}): Promise<{ id: string }> {
  const item = await prisma.goodsItem.create({
    data: {
      packagingUnitId: options.packagingUnitId,
      productId: options.productId,
      firstLocationId: options.firstLocationId,
      lastLocationId: options.lastLocationId,
    },
  });
  return { id: item.id };
}
