import type { PackagingTreeNode } from './packagingTree.types';

type FlatPackagingUnit = {
  id: string;
  status: string;
  isMci: boolean;
  path: string;
  depth: number;
  parentId: string | null;
  packagingType: { id: string; name: string };
  firstLocation: PackagingTreeNode['firstLocation'];
  lastLocation: PackagingTreeNode['lastLocation'];
  goods: PackagingTreeNode['goods'];
  goodsCount: number;
  goodsTruncated: boolean;
};

export function buildPackagingTree(units: FlatPackagingUnit[]): PackagingTreeNode[] {
  const byParent = new Map<string | null, FlatPackagingUnit[]>();
  for (const unit of units) {
    const key = unit.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(unit);
  }

  const build = (parentId: string | null): PackagingTreeNode[] => {
    const nodes = byParent.get(parentId) ?? [];
    return nodes.map((node) => ({
      id: node.id,
      status: node.status,
      isMci: node.isMci,
      path: node.path,
      depth: node.depth,
      packagingType: node.packagingType,
      firstLocation: node.firstLocation,
      lastLocation: node.lastLocation,
      goods: node.goods,
      goodsCount: node.goodsCount,
      goodsTruncated: node.goodsTruncated,
      children: build(node.id),
    }));
  };

  return build(null);
}
