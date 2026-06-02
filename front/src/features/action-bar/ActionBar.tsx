import React, { useMemo } from 'react';
import type { TransportDetail } from '@/api/client';
import { ActionBarActions } from './ActionBarActions';
import { collectMciChips } from './collectMciChips';
import { MciChipSlider } from './MciChipSlider';
import { useTransportActions } from './useTransportActions';

interface ActionBarProps {
  transport: TransportDetail;
  onUpdated: () => void;
}

export function ActionBar({ transport, onUpdated }: ActionBarProps): React.ReactElement {
  const mcis = useMemo(
    () => collectMciChips(transport.packagingTree),
    [transport.packagingTree]
  );
  const { loading, error, runAction } = useTransportActions(transport.id, onUpdated);

  return (
    <header className="action-bar">
      {mcis.length === 0 ? (
        <div className="action-bar__slider-wrap">
          <span className="action-bar__slider-label">MCI</span>
          <p className="action-bar__empty">No MCI found — check routes in subtrees</p>
        </div>
      ) : (
        <MciChipSlider chips={mcis} />
      )}

      <ActionBarActions
        chips={mcis}
        loading={loading}
        error={error}
        onDispatch={() => void runAction('dispatch')}
        onDeliver={() => void runAction('deliver')}
      />
    </header>
  );
}
