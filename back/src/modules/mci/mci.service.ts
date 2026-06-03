import { recordTiming, TIMING_LABEL_FIND_MCI } from '../metrics/timer.service';
import {
  findGoodsMciCandidates,
  findPackagingMciCandidates,
  getMcisForTransport,
  getMciEntity,
  markGoodsMciByIds,
  markPackagingMciByIds,
  unmarkAllMci,
  updateAllMciSubtreesStatus,
  updateGoodsInSubtreeStatus,
  updatePackagingSubtreeStatus,
  updateSingleGoodsStatus,
} from './mci.repository';

export async function findMcis(transportUnitId: string): Promise<string[]> {
  return recordTiming(TIMING_LABEL_FIND_MCI, async () => {
    const [packaging, goods] = await Promise.all([
      findPackagingMciCandidates(transportUnitId),
      findGoodsMciCandidates(transportUnitId),
    ]);
    return [...packaging.map((p) => p.id), ...goods.map((g) => g.id)];
  });
}

export async function markMci(transportUnitId: string): Promise<string[]> {
  return recordTiming('markMci', async () => {
    await unmarkAllMci(transportUnitId);

    const [packagingCandidates, goodsCandidates] = await recordTiming(
      TIMING_LABEL_FIND_MCI,
      async () =>
        Promise.all([
          findPackagingMciCandidates(transportUnitId),
          findGoodsMciCandidates(transportUnitId),
        ])
    );

    await Promise.all([
      markPackagingMciByIds(packagingCandidates.map((p) => p.id)),
      markGoodsMciByIds(goodsCandidates.map((g) => g.id)),
    ]);

    return [...packagingCandidates.map((p) => p.id), ...goodsCandidates.map((g) => g.id)];
  });
}

export async function updateStatusViaMci(
  mciId: string,
  status: string
): Promise<{ updatedPackaging: number; updatedGoods: number }> {
  return recordTiming('updateStatusViaMci', async () => {
    const entity = await getMciEntity(mciId);
    if (!entity) {
      return { updatedPackaging: 0, updatedGoods: 0 };
    }

    if (entity.type === 'goods') {
      const updatedGoods = await updateSingleGoodsStatus(entity.id, status);
      return { updatedPackaging: 0, updatedGoods };
    }

    const updatedPackaging = await updatePackagingSubtreeStatus(
      entity.transportUnitId,
      entity.id,
      entity.path,
      status
    );
    const updatedGoods = await updateGoodsInSubtreeStatus(
      entity.transportUnitId,
      entity.id,
      entity.path,
      status
    );

    return { updatedPackaging, updatedGoods };
  });
}

export async function updateAllMcisStatus(
  transportUnitId: string,
  status: string
): Promise<{ mciIds: string[]; updatedPackaging: number; updatedGoods: number }> {
  return recordTiming('UPDATE ALL MCIS', async () => {
    const mcis = await getMcisForTransport(transportUnitId);
    if (mcis.length === 0) {
      return { mciIds: [], updatedPackaging: 0, updatedGoods: 0 };
    }

    const { updatedPackaging, updatedGoods } = await updateAllMciSubtreesStatus(
      transportUnitId,
      status
    );

    return { mciIds: mcis.map((m) => m.id), updatedPackaging, updatedGoods };
  });
}

export { getMcisForTransport };
