import React from 'react';
import { MCI_STATUS_COLORS, shortSku, type MciProductPalette } from './mciGraphTheme';

export type MciLegendEntry = {
  sku: string;
  palette: MciProductPalette;
  status: string;
};

interface MciLegendProps {
  entries: MciLegendEntry[];
}

export function MciLegend({ entries }: MciLegendProps): React.ReactElement | null {
  if (entries.length === 0) return null;

  return (
    <div className="mci-legend" aria-label="MCI legend">
      <span className="mci-legend__title">MCI по товарам</span>
      <ul className="mci-legend__list">
        {entries.map(({ sku, palette, status }) => (
          <li key={sku} className="mci-legend__item">
            <span
              className="mci-legend__swatch"
              style={{ backgroundColor: palette.accent, boxShadow: `0 0 8px ${palette.soft}` }}
            />
            <span className="mci-legend__sku">{shortSku(sku)}</span>
            <span
              className={`mci-legend__status mci-legend__status--${status}`}
              style={{ borderColor: MCI_STATUS_COLORS[status] ?? '#94a3b8' }}
            >
              {status.replace('_', ' ')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
