import { recordTiming } from '../metrics/timer.service';
import {
  findMciCandidate,
  getMarkedMciId,
  getPackagingUnitById,
  markMciById,
  unmarkAllMci,
  updateGoodsInSubtreeStatus,
  updatePackagingSubtreeStatus,
} from './mci.repository';

export async function findMci(transportUnitId: string): Promise<string | null> {
  return findMciCandidate(transportUnitId);
}

export async function markMci(transportUnitId: string): Promise<string | null> {
  return recordTiming('markMci', async () => {
    const mciId = await findMci(transportUnitId);

    await unmarkAllMci(transportUnitId);

    if (mciId) {
      await markMciById(mciId);
    }

    return mciId;
  });
}

export async function updateStatusViaMci(
  mciId: string,
  status: string
): Promise<{ updatedPackaging: number; updatedGoods: number }> {
  return recordTiming('updateStatusViaMci', async () => {
    const mci = await getPackagingUnitById(mciId);
    if (!mci?.transportUnitId) {
      return { updatedPackaging: 0, updatedGoods: 0 };
    }

    const transportUnitId = mci.transportUnitId;

    const updatedPackaging = await updatePackagingSubtreeStatus(
      transportUnitId,
      mciId,
      mci.path,
      status
    );
    const updatedGoods = await updateGoodsInSubtreeStatus(
      transportUnitId,
      mciId,
      mci.path,
      status
    );

    return { updatedPackaging, updatedGoods };
  });
}

export async function getMciForTransport(transportUnitId: string): Promise<string | null> {
  return getMarkedMciId(transportUnitId);
}
