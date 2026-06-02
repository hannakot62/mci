import type { PackagingTreeNode } from '../api/client';

export type MciProductPalette = {
  accent: string;
  soft: string;
  label: string;
};

export const MCI_PRODUCT_PALETTE: MciProductPalette[] = [
  { accent: '#38e8ff', soft: 'rgba(56, 232, 255, 0.34)', label: 'cyan' },
  { accent: '#c4b5fd', soft: 'rgba(196, 181, 253, 0.34)', label: 'violet' },
  { accent: '#ff8fa3', soft: 'rgba(255, 143, 163, 0.34)', label: 'rose' },
  { accent: '#6ee7a0', soft: 'rgba(110, 231, 160, 0.34)', label: 'green' },
  { accent: '#fcd34d', soft: 'rgba(252, 211, 77, 0.34)', label: 'amber' },
  { accent: '#f9a8d4', soft: 'rgba(249, 168, 212, 0.34)', label: 'pink' },
];

export const MCI_STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  loading: '#60a5fa',
  in_transit: '#fbbf24',
  delivered: '#4ade80',
  idle: '#64748b',
};

export function resolveProductSkuInSubtree(node: PackagingTreeNode): string {
  const counts = new Map<string, number>();

  const walk = (n: PackagingTreeNode): void => {
    for (const g of n.goods) {
      counts.set(g.product.sku, (counts.get(g.product.sku) ?? 0) + 1);
    }
    n.children.forEach(walk);
  };

  walk(node);

  let best = '—';
  let max = 0;
  for (const [sku, count] of counts) {
    if (count > max) {
      max = count;
      best = sku;
    }
  }
  return best;
}

export function collectMciProductSkus(roots: PackagingTreeNode[]): string[] {
  const skus: string[] = [];

  const walk = (nodes: PackagingTreeNode[]): void => {
    for (const n of nodes) {
      if (n.isMci) skus.push(resolveProductSkuInSubtree(n));
      for (const g of n.goods) {
        if (g.isMci) skus.push(g.product.sku);
      }
      walk(n.children);
    }
  };

  walk(roots);
  return skus;
}

export function buildProductPaletteMap(skus: string[]): Map<string, MciProductPalette> {
  const unique = [...new Set(skus.filter((s) => s !== '—'))].sort();
  return new Map(
    unique.map((sku, index) => [sku, MCI_PRODUCT_PALETTE[index % MCI_PRODUCT_PALETTE.length]])
  );
}

export function shortSku(sku: string): string {
  if (sku.length <= 14) return sku;
  return `${sku.slice(0, 12)}…`;
}
