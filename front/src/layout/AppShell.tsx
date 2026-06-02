import React, { useCallback, useState } from 'react';
import { getTransport, type TransportDetail } from '@/api/client';
import { ActionBar } from '@/features/action-bar/ActionBar';
import { CargoTree } from '@/features/cargo-tree/CargoTree';
import { SetupPanel } from '@/features/setup/SetupPanel';
import { TimingLog } from '@/features/timing-log/TimingLog';

export function AppShell(): React.ReactElement {
  const [transport, setTransport] = useState<TransportDetail | null>(null);
  const [setupOpen, setSetupOpen] = useState(true);
  const [timingOpen, setTimingOpen] = useState(true);

  const loadTransport = useCallback(async (id: string) => {
    const data = await getTransport(id);
    setTransport(data);
  }, []);

  const handleGenerated = useCallback(
    (transportId: string) => {
      void loadTransport(transportId);
    },
    [loadTransport]
  );

  const shellClass = [
    'app-shell',
    setupOpen ? '' : 'app-shell--setup-collapsed',
    timingOpen ? '' : 'app-shell--log-collapsed',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <SetupPanel
        onGenerated={handleGenerated}
        expanded={setupOpen}
        onToggleExpanded={() => setSetupOpen((v) => !v)}
      />
      <main className="main-area">
        {transport && (
          <ActionBar
            transport={transport}
            onUpdated={() => void loadTransport(transport.id)}
          />
        )}
        <CargoTree transport={transport} />
      </main>
      <TimingLog expanded={timingOpen} onToggleExpanded={() => setTimingOpen((v) => !v)} />
    </div>
  );
}
