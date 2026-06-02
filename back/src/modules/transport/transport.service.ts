import { buildPackagingTree } from './packagingTree.builder';
import type { TransportTreeMeta } from './packagingTree.types';
import {
  countGoodsByPackagingUnit,
  countGoodsForTransport,
  getTransportUnitById,
  listAllGoodsForTransport,
  listGoodsPreviewForTransport,
  listPackagingUnitsForTransport,
  listLocations,
  listTransportUnits,
  shouldInlineGoodsInTree,
} from './transport.repository';

function groupGoodsByPackaging<T extends { packagingUnitId: string }>(
  rows: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.packagingUnitId);
    if (list) {
      list.push(row);
    } else {
      map.set(row.packagingUnitId, [row]);
    }
  }
  return map;
}

export async function listTransports() {
  return listTransportUnits();
}

export async function getTransportWithTree(id: string) {
  const transport = await getTransportUnitById(id);
  if (!transport) return null;

  const [packagingUnits, totalGoods, goodsCountByPackaging] = await Promise.all([
    listPackagingUnitsForTransport(id),
    countGoodsForTransport(id),
    countGoodsByPackagingUnit(id),
  ]);

  const goodsInline = shouldInlineGoodsInTree(totalGoods);

  const goodsRows = goodsInline
    ? await listAllGoodsForTransport(id)
    : await listGoodsPreviewForTransport(id);

  const goodsByPackaging = groupGoodsByPackaging(goodsRows);

  const tree = buildPackagingTree(
    packagingUnits.map((pu) => {
      const goodsCount = goodsCountByPackaging.get(pu.id) ?? 0;
      const nodeGoods = (goodsByPackaging.get(pu.id) ?? []).map(({ packagingUnitId: _, ...g }) => g);

      return {
        id: pu.id,
        status: pu.status,
        isMci: pu.isMci,
        path: pu.path,
        depth: pu.depth,
        parentId: pu.parentId,
        packagingType: pu.packagingType,
        goods: nodeGoods,
        goodsCount,
        goodsTruncated: !goodsInline && goodsCount > nodeGoods.length,
      };
    })
  );

  const treeMeta: TransportTreeMeta = {
    totalGoods,
    goodsInline,
  };

  return {
    ...transport,
    packagingTree: tree,
    treeMeta,
  };
}

export async function listAllLocations() {
  return listLocations();
}
