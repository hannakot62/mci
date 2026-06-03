import type { PackagingTreeNode } from '@/api/client';
import type { CargoNodeData } from '@/features/cargo-flow/cargoNode.types';
import type { MciProductPalette } from '@/features/mci/mciGraphTheme';
import { MCI_STATUS_COLORS, resolveProductSkuInSubtree, shortSku } from '@/features/mci/mciGraphTheme';

export type MciWalkContext = {
  /** True when an ancestor packaging node is the external MCI for this branch. */
  insideMciSubtree: boolean;
  branchAccent?: string;
};

export function packagingDisplayAsMci(pkg: PackagingTreeNode, ctx: MciWalkContext): boolean {
  return pkg.isMci && !ctx.insideMciSubtree;
}

export function goodsDisplayAsMci(goodIsMci: boolean, ctx: MciWalkContext): boolean {
  return goodIsMci && !ctx.insideMciSubtree;
}

export function buildPackagingMciExtras(
  pkg: PackagingTreeNode,
  productPalette: Map<string, MciProductPalette>
): Partial<CargoNodeData> {
  const statusColor = MCI_STATUS_COLORS[pkg.status] ?? '#94a3b8';
  const sku = resolveProductSkuInSubtree(pkg);
  const palette = productPalette.get(sku);
  const accent = palette?.accent ?? '#eab308';
  const soft = palette?.soft ?? 'rgba(252, 211, 77, 0.34)';

  return {
    isMci: true,
    mciProductSku: shortSku(sku),
    mciAccent: accent,
    mciSoft: soft,
    mciStatusColor: statusColor,
  };
}

export function childWalkContext(
  pkg: PackagingTreeNode,
  ctx: MciWalkContext,
  mciExtras: Partial<CargoNodeData>
): MciWalkContext {
  const displayAsMci = packagingDisplayAsMci(pkg, ctx);
  return {
    insideMciSubtree: ctx.insideMciSubtree || pkg.isMci,
    branchAccent: displayAsMci ? mciExtras.mciAccent : ctx.branchAccent,
  };
}
