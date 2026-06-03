import type { PackagingTreeNode } from '@/api/client';

export function countPackagingNodes(nodes: PackagingTreeNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countPackagingNodes(node.children), 0);
}
