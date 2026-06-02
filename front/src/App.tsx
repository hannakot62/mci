import React, { useCallback, useState } from 'react';
import { getTransport, type TransportDetail } from './api/client';
import { ActionBar } from './components/ActionBar';
import { CargoTree } from './components/CargoTree';
import { SetupPanel } from './components/SetupPanel';
import { TimingLog } from './components/TimingLog';
import './styles/cargo.scss';

function App(): React.ReactElement {
  const [transport, setTransport] = useState<TransportDetail | null>(null);

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

  return (
    <div className="app-shell">
      <SetupPanel onGenerated={handleGenerated} />
      <main className="main-area">
        <ActionBar transport={transport} onUpdated={() => void loadTransport(transport!.id)} />
        <CargoTree transport={transport} />
      </main>
      <TimingLog />
    </div>
  );
}

export default App;
