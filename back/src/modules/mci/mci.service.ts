import { recordTiming } from '../metrics/timer.service';
import {
  findGoodsMciCandidates,
  findPackagingMciCandidates,
  getMcisForTransport,
  getMciEntity,
  markGoodsMciById,
  markPackagingMciById,
  unmarkAllMci,
  updateGoodsInSubtreeStatus,
  updatePackagingSubtreeStatus,
  updateSingleGoodsStatus,
} from './mci.repository';

export async function findMcis(transportUnitId: string): Promise<string[]> {
  const packaging = await findPackagingMciCandidates(transportUnitId);
  const goods = await findGoodsMciCandidates(transportUnitId);
  return [...packaging.map((p) => p.id), ...goods.map((g) => g.id)];
}

export async function markMci(transportUnitId: string): Promise<string[]> {
  return recordTiming('markMci', async () => {
    await unmarkAllMci(transportUnitId);

    const packagingCandidates = await findPackagingMciCandidates(transportUnitId);
    for (const { id } of packagingCandidates) {
      await markPackagingMciById(id);
    }

    const goodsCandidates = await findGoodsMciCandidates(transportUnitId);
    for (const { id } of goodsCandidates) {
      await markGoodsMciById(id);
    }

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
  const mcis = await getMcisForTransport(transportUnitId);
  if (mcis.length === 0) {
    return { mciIds: [], updatedPackaging: 0, updatedGoods: 0 };
  }

  let updatedPackaging = 0;
  let updatedGoods = 0;

  for (const { id } of mcis) {
    const result = await updateStatusViaMci(id, status);
    updatedPackaging += result.updatedPackaging;
    updatedGoods += result.updatedGoods;
  }

  return { mciIds: mcis.map((m) => m.id), updatedPackaging, updatedGoods };
}

export { getMcisForTransport };
