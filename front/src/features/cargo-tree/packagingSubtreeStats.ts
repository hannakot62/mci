import type { PackagingTreeNode } from '@/api/client';
import { resolveProductSkuInSubtree } from '@/features/mci/mciGraphTheme';

export type SubtreeStats = {
  /** Includes this node. */
  packagingCount: number;
  /** Excludes this node. */
  descendantCount: number;
  packagingMciCount: number;
  goodsMciCount: number;
  maxChildDepth: number;
};

export function getSubtreeStats(node: PackagingTreeNode): SubtreeStats {
  let packagingMciCount = node.isMci ? 1 : 0;
  let goodsMciCount = node.goods.filter((g) => g.isMci).length;
  let descendantCount = 0;
  let maxChildDepth = 0;

  for (const child of node.children) {
    const childStats = getSubtreeStats(child);
    descendantCount += childStats.packagingCount;
    packagingMciCount += childStats.packagingMciCount;
    goodsMciCount += childStats.goodsMciCount;
    maxChildDepth = Math.max(maxChildDepth, 1 + childStats.maxChildDepth);
  }

  return {
    packagingCount: 1 + descendantCount,
    descendantCount,
    packagingMciCount,
    goodsMciCount,
    maxChildDepth,
  };
}

export function getDescendantMciStats(node: PackagingTreeNode): {
  descendantCount: number;
  packagingMciCount: number;
  goodsMciCount: number;
  maxChildDepth: number;
} {
  const full = getSubtreeStats(node);
  return {
    descendantCount: full.descendantCount,
    packagingMciCount: full.packagingMciCount - (node.isMci ? 1 : 0),
    goodsMciCount: full.goodsMciCount - node.goods.filter((g) => g.isMci).length,
    maxChildDepth: full.maxChildDepth,
  };
}

export function findFirstMciSkuInDescendants(node: PackagingTreeNode): string | null {
  for (const child of node.children) {
    const sku = findFirstMciSku(child);
    if (sku) return sku;
  }
  return null;
}

export function findFirstMciSku(node: PackagingTreeNode): string | null {
  if (node.isMci) {
    const sku = resolveProductSkuInSubtree(node);
    return sku === '—' ? null : sku;
  }

  for (const good of node.goods) {
    if (good.isMci) return good.product.sku;
  }

  for (const child of node.children) {
    const sku = findFirstMciSku(child);
    if (sku) return sku;
  }

  return null;
}
