type Route = { firstLocationId: string; lastLocationId: string };

type PackagingNode = {
  id: string;
  parentId: string | null;
  depth: number;
} & Route;

type GoodsNode = {
  packagingUnitId: string;
  productId: string;
} & Route;

type SubtreeStats = {
  goodsCount: number;
  productIds: Set<string>;
  goodsFirstLocs: Set<string>;
  goodsLastLocs: Set<string>;
  pkgFirstLocs: Set<string>;
  pkgLastLocs: Set<string>;
};

export type MockCargoMciResult = {
  packagingMciIds: Set<string>;
  goodsMciIndices: Set<number>;
};

function emptyStats(): SubtreeStats {
  return {
    goodsCount: 0,
    productIds: new Set(),
    goodsFirstLocs: new Set(),
    goodsLastLocs: new Set(),
    pkgFirstLocs: new Set(),
    pkgLastLocs: new Set(),
  };
}

function mergeStats(into: SubtreeStats, from: SubtreeStats): void {
  into.goodsCount += from.goodsCount;
  for (const v of from.productIds) into.productIds.add(v);
  for (const v of from.goodsFirstLocs) into.goodsFirstLocs.add(v);
  for (const v of from.goodsLastLocs) into.goodsLastLocs.add(v);
  for (const v of from.pkgFirstLocs) into.pkgFirstLocs.add(v);
  for (const v of from.pkgLastLocs) into.pkgLastLocs.add(v);
}

function isPackagingCandidate(stats: SubtreeStats): boolean {
  return (
    stats.goodsCount >= 1 &&
    stats.productIds.size === 1 &&
    stats.goodsFirstLocs.size === 1 &&
    stats.goodsLastLocs.size === 1 &&
    stats.pkgFirstLocs.size === 1 &&
    stats.pkgLastLocs.size === 1
  );
}

/**
 * Computes MCI flags from an in-memory mock cargo tree (same rules as SQL markMci).
 */
export function computeMockCargoMci(
  packagingRows: PackagingNode[],
  goodsRows: GoodsNode[]
): MockCargoMciResult {
  const rowById = new Map(packagingRows.map((row) => [row.id, row]));
  const childrenByParent = new Map<string | null, string[]>();
  const goodsByPackaging = new Map<string, Array<{ index: number; good: GoodsNode }>>();

  for (const row of packagingRows) {
    const siblings = childrenByParent.get(row.parentId);
    if (siblings) {
      siblings.push(row.id);
    } else {
      childrenByParent.set(row.parentId, [row.id]);
    }
  }

  goodsRows.forEach((good, index) => {
    const list = goodsByPackaging.get(good.packagingUnitId);
    const entry = { index, good };
    if (list) {
      list.push(entry);
    } else {
      goodsByPackaging.set(good.packagingUnitId, [entry]);
    }
  });

  const statsById = new Map<string, SubtreeStats>();
  const maxDepth = packagingRows.reduce((max, row) => Math.max(max, row.depth), 0);

  for (let depth = maxDepth; depth >= 0; depth -= 1) {
    for (const row of packagingRows) {
      if (row.depth !== depth) continue;

      const stats = emptyStats();
      stats.pkgFirstLocs.add(row.firstLocationId);
      stats.pkgLastLocs.add(row.lastLocationId);

      for (const { good } of goodsByPackaging.get(row.id) ?? []) {
        stats.goodsCount += 1;
        stats.productIds.add(good.productId);
        stats.goodsFirstLocs.add(good.firstLocationId);
        stats.goodsLastLocs.add(good.lastLocationId);
      }

      for (const childId of childrenByParent.get(row.id) ?? []) {
        const childStats = statsById.get(childId);
        if (childStats) mergeStats(stats, childStats);
      }

      statsById.set(row.id, stats);
    }
  }

  const packagingCandidates = new Set<string>();
  for (const row of packagingRows) {
    const stats = statsById.get(row.id);
    if (stats && isPackagingCandidate(stats)) {
      packagingCandidates.add(row.id);
    }
  }

  const packagingMciIds = new Set<string>();
  for (const id of packagingCandidates) {
    let blocked = false;
    let current = rowById.get(id);
    while (current?.parentId) {
      if (packagingCandidates.has(current.parentId)) {
        blocked = true;
        break;
      }
      current = rowById.get(current.parentId);
    }
    if (!blocked) packagingMciIds.add(id);
  }

  const hasPackagingAncestorMci = (packagingId: string): boolean => {
    let current = rowById.get(packagingId);
    while (current?.parentId) {
      if (packagingMciIds.has(current.parentId)) return true;
      current = rowById.get(current.parentId);
    }
    return false;
  };

  const goodsMciIndices = new Set<number>();
  for (const row of packagingRows) {
    const childIds = childrenByParent.get(row.id);
    if (childIds && childIds.length > 0) continue;
    if (packagingMciIds.has(row.id) || hasPackagingAncestorMci(row.id)) continue;

    const entries = goodsByPackaging.get(row.id) ?? [];
    for (let i = 0; i < entries.length; i++) {
      const { index, good } = entries[i];
      const hasConflict = entries.some(
        ({ good: other }, j) =>
          j !== i &&
          (other.firstLocationId !== good.firstLocationId ||
            other.lastLocationId !== good.lastLocationId)
      );
      if (hasConflict) goodsMciIndices.add(index);
    }
  }

  return { packagingMciIds, goodsMciIndices };
}
