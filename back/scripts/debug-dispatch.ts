import { createApp } from '../src/app';
import { disconnectDatabase } from '../src/infrastructure/db/prisma';
import { getMcisForTransport, updateAllMcisStatus } from '../src/modules/mci/mci.service';
import { TRANSPORT_UNIT_STATUS } from '../src/shared/constants/status';

async function main(): Promise<void> {
  const app = await createApp();
  const products = await app.inject({ method: 'GET', url: '/api/products' });
  const catalog = products.json() as Array<{ sku: string }>;
  if (catalog.length === 0) {
    throw new Error('No products in catalog');
  }

  const setup = await app.inject({
    method: 'POST',
    url: '/api/setup',
    payload: {
      transportCode: `TRK-DBG-${Date.now()}`,
      transportType: 'truck',
      productGroups: [
        {
          productSku: catalog[0].sku,
          goodsCount: 25,
          rootPackagingCount: 1,
          nestingLevels: [{ childCount: 1 }],
        },
      ],
    },
  });

  console.log('setup status', setup.statusCode);
  const { transportUnitId } = setup.json() as { transportUnitId: string };
  const mcis = await getMcisForTransport(transportUnitId);
  console.log('mcis', mcis);

  try {
    const result = await updateAllMcisStatus(transportUnitId, TRANSPORT_UNIT_STATUS.inTransit);
    console.log('updateAllMcisStatus ok', result);
  } catch (err) {
    console.error('ERROR', err);
  }

  const dispatch = await app.inject({
    method: 'POST',
    url: `/api/transport/${transportUnitId}/dispatch`,
  });
  console.log('dispatch inject', dispatch.statusCode, dispatch.body);

  await app.close();
  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
