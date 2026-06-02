import React, { useMemo } from 'react';
import { Button, PanelToggle } from '@/components/common';
import { averageDuration, filterVisibleEntries } from './timingLog.utils';
import { TimingLogTable } from './TimingLogTable';
import { useTimingLog } from './useTimingLog';

interface TimingLogProps {
  expanded: boolean;
  onToggleExpanded: () => void;
}

export function TimingLog({ expanded, onToggleExpanded }: TimingLogProps): React.ReactElement {
  const { entries, error, clearedAfter, clear } = useTimingLog();

  const visibleEntries = useMemo(
    () => filterVisibleEntries(entries, clearedAfter),
    [entries, clearedAfter]
  );
  const avg = useMemo(() => averageDuration(visibleEntries), [visibleEntries]);

  return (
    <footer className="timing-log">
      <div className="timing-log-header">
        <strong>Timing Log</strong>
        <span className="timing-log-header__meta">
          {visibleEntries.length} ops · avg {avg} ms
        </span>
        <div className="timing-log-header__end">
          <PanelToggle
            expanded={expanded}
            onToggle={onToggleExpanded}
            label={expanded ? 'Hide timing log' : 'Show timing log'}
            edge="timing"
          />
          <Button type="button" variant="outline" onClick={clear}>
            clear
          </Button>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="timing-log-body">
        <TimingLogTable entries={visibleEntries} />
      </div>
    </footer>
  );
}
