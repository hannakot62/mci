import type { MciLegendEntry } from '@/features/mci/MciLegend';
import type { MciProductPalette } from '@/features/mci/mciGraphTheme';

/** One legend row per product SKU (avoids duplicates at high goods volume). */
export function trackMciLegendEntry(
  legendBySku: Map<string, MciLegendEntry>,
  sku: string,
  palette: MciProductPalette | undefined,
  status: string
): void {
  if (!palette || !sku || sku === '—') return;
  legendBySku.set(sku, { sku, palette, status });
}

export function mciLegendEntries(legendBySku: Map<string, MciLegendEntry>): MciLegendEntry[] {
  return [...legendBySku.values()];
}
