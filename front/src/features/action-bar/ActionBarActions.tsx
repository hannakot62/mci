import React from 'react';
import { Button } from '@/components/common';
import type { MciChipData } from './actionBar.types';

interface ActionBarActionsProps {
  chips: MciChipData[];
  loading: boolean;
  error: string | null;
  onDispatch: () => void;
  onDeliver: () => void;
}

export function ActionBarActions({
  chips,
  loading,
  error,
  onDispatch,
  onDeliver,
}: ActionBarActionsProps): React.ReactElement {
  const allDelivered = chips.length > 0 && chips.every((m) => m.status === 'delivered');
  const anyInTransit = chips.some((m) => m.status === 'in_transit');

  return (
    <div className="action-bar__actions">
      <Button
        type="button"
        variant="outline"
        disabled={loading || chips.length === 0 || allDelivered || anyInTransit}
        onClick={onDispatch}
      >
        dispatch all
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={loading || chips.length === 0 || allDelivered || !anyInTransit}
        onClick={onDeliver}
      >
        deliver all
      </Button>
      {error && <span className="error-text action-bar__error">{error}</span>}
    </div>
  );
}
