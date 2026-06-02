import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.goodsItem.deleteMany();
  await prisma.packagingUnit.deleteMany();
  await prisma.transportUnit.deleteMany();
  await prisma.product.deleteMany();
  await prisma.packagingType.deleteMany();
  await prisma.location.deleteMany();

  const locations = await Promise.all([
    prisma.location.create({
      data: { code: 'AMS', name: 'Amsterdam', type: 'warehouse' },
    }),
    prisma.location.create({
      data: { code: 'RTM', name: 'Rotterdam', type: 'port' },
    }),
    prisma.location.create({
      data: { code: 'HAM', name: 'Hamburg', type: 'port' },
    }),
    prisma.location.create({
      data: { code: 'BER', name: 'Berlin', type: 'warehouse' },
    }),
  ]);

  await Promise.all([
    prisma.packagingType.create({
      data: { name: 'pallet', maxWeightKg: 1000, maxVolumeLiters: 5000 },
    }),
    prisma.packagingType.create({
      data: { name: 'box', maxWeightKg: 30, maxVolumeLiters: 80 },
    }),
    prisma.packagingType.create({
      data: { name: 'crate', maxWeightKg: 50, maxVolumeLiters: 120 },
    }),
  ]);

  await Promise.all([
    prisma.product.create({
      data: { name: 'Steel Bolts', sku: 'SKU-BOLT-001', allowedPackagingTypes: 'box,crate' },
    }),
    prisma.product.create({
      data: { name: 'Industrial Valves', sku: 'SKU-VALVE-002', allowedPackagingTypes: 'crate,pallet' },
    }),
    prisma.product.create({
      data: { name: 'Hydraulic Fluid', sku: 'SKU-FLUID-003', allowedPackagingTypes: 'box' },
    }),
    prisma.product.create({
      data: { name: 'Control Panels', sku: 'SKU-PANEL-004', allowedPackagingTypes: 'crate,pallet' },
    }),
    prisma.product.create({
      data: { name: 'Copper Wire', sku: 'SKU-WIRE-005', allowedPackagingTypes: 'box,crate,pallet' },
    }),
  ]);

  console.log(`Seeded ${locations.length} locations, 3 packaging types, 5 products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
