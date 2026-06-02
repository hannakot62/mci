import React from 'react';
import { formatMciStatus, MCI_STATUS_COLORS } from '@/features/mci/mciGraphTheme';
import type { MciChipData } from './actionBar.types';

interface MciChipProps {
  mci: MciChipData;
}

export function MciChip({ mci }: MciChipProps): React.ReactElement {
  const statusColor = MCI_STATUS_COLORS[mci.status] ?? '#94a3b8';

  return (
    <article
      className={`mci-chip mci-chip--${mci.status.replace(/[^a-z0-9_-]/gi, '_')}`}
      style={
        {
          '--chip-accent': mci.palette.accent,
          '--chip-soft': mci.palette.soft,
          '--chip-status': statusColor,
        } as React.CSSProperties
      }
      title={`${mci.title} · ${mci.route}`}
    >
      <div className="mci-chip__row mci-chip__row--meta">
        <span className="mci-chip__tag">MCI</span>
        <span className="mci-chip__kind">{mci.kind === 'goods' ? 'goods' : 'packaging'}</span>
      </div>
      <div className="mci-chip__row mci-chip__title">{mci.title.toUpperCase()}</div>
      <div className="mci-chip__row mci-chip__route">{mci.route}</div>
      <div className="mci-chip__row">
        <span className="mci-chip__status">{formatMciStatus(mci.status)}</span>
      </div>
    </article>
  );
}
