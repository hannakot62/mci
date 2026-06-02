import type { PackagingTreeNode } from '@/api/client';
import {
  buildProductPaletteMap,
  collectMciProductSkus,
  MCI_FALLBACK_PALETTE,
  resolveProductSkuInSubtree,
  shortSku,
  type MciProductPalette,
} from '@/features/mci/mciGraphTheme';
import type { MciChipData } from './actionBar.types';

function collectFromNodes(
  nodes: PackagingTreeNode[],
  paletteMap: Map<string, MciProductPalette>
): MciChipData[] {
  return nodes.flatMap((n) => {
    const packaging: MciChipData[] = n.isMci
      ? [
          {
            id: n.id,
            status: n.status,
            route: `${n.firstLocation.code} → ${n.lastLocation.code}`,
            kind: 'packaging',
            title: n.packagingType.name,
            productSku: resolveProductSkuInSubtree(n),
            palette: paletteMap.get(resolveProductSkuInSubtree(n)) ?? MCI_FALLBACK_PALETTE,
          },
        ]
      : [];

    const goods: MciChipData[] = n.goods
      .filter((g) => g.isMci)
      .map((g) => ({
        id: g.id,
        status: g.status,
        route: `${g.firstLocation.code} → ${g.lastLocation.code}`,
        kind: 'goods' as const,
        title: shortSku(g.product.sku),
        productSku: g.product.sku,
        palette: paletteMap.get(g.product.sku) ?? MCI_FALLBACK_PALETTE,
      }));

    return [...packaging, ...goods, ...collectFromNodes(n.children, paletteMap)];
  });
}

export function collectMciChips(roots: PackagingTreeNode[]): MciChipData[] {
  const paletteMap = buildProductPaletteMap(collectMciProductSkus(roots));
  return collectFromNodes(roots, paletteMap);
}
