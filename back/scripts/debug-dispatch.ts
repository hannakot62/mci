import { createApp } from '../src/app';
import { disconnectDatabase } from '../src/infrastructure/db/prisma';
import { getMciForTransport, updateStatusViaMci } from '../src/modules/mci/mci.service';
import { TRANSPORT_UNIT_STATUS } from '../src/shared/constants/status';
import { updateTransportUnitStatus } from '../src/modules/transport/transport.repository';

const app = createApp();

async function main(): Promise<void> {
  const setup = await app.inject({
    method: 'POST',
    url: '/api/setup',
    payload: {
      transportCode: `TRK-DBG-${Date.now()}`,
      transportType: 'truck',
      departureCode: 'AMS',
      arrivalCode: 'RTM',
      goodsCount: 25,
      packingDepth: 2,
    },
  });

  console.log('setup status', setup.statusCode);
  const { transportUnitId } = setup.json() as { transportUnitId: string };
  const mciId = await getMciForTransport(transportUnitId);
  console.log('mciId', mciId);

  try {
    const result = await updateStatusViaMci(mciId!, TRANSPORT_UNIT_STATUS.inTransit);
    console.log('updateStatusViaMci ok', result);
    await updateTransportUnitStatus(transportUnitId, TRANSPORT_UNIT_STATUS.inTransit);
    console.log('updateTransportUnitStatus ok');
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
