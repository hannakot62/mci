import React, { useEffect, useState } from 'react';
import { listLocations, setup, type Location, type SetupPayload } from '../api/client';

interface SetupPanelProps {
  onGenerated: (transportId: string) => void;
}

function nextTransportCode(): string {
  const n = Math.floor(Math.random() * 900) + 100;
  return `TRK-${n}`;
}

export function SetupPanel({ onGenerated }: SetupPanelProps): React.ReactElement {
  const [locations, setLocations] = useState<Location[]>([]);
  const [transportCode, setTransportCode] = useState(nextTransportCode());
  const [transportType, setTransportType] = useState<SetupPayload['transportType']>('truck');
  const [departureCode, setDepartureCode] = useState('');
  const [arrivalCode, setArrivalCode] = useState('');
  const [goodsCount, setGoodsCount] = useState(25);
  const [packingDepth, setPackingDepth] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listLocations()
      .then((data) => {
        setLocations(data);
        if (data.length >= 2) {
          setDepartureCode(data[0].code);
          setArrivalCode(data[1].code);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await setup({
        transportCode,
        transportType,
        departureCode,
        arrivalCode,
        goodsCount,
        packingDepth,
      });
      onGenerated(result.transportUnitId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="setup-panel">
      <h2>Cargo Setup</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Transport code
          <input
            value={transportCode}
            onChange={(e) => setTransportCode(e.target.value)}
            required
          />
        </label>

        <label>
          Transport type
          <select
            value={transportType}
            onChange={(e) =>
              setTransportType(e.target.value as SetupPayload['transportType'])
            }
          >
            <option value="truck">Truck</option>
            <option value="container">Container</option>
            <option value="van">Van</option>
          </select>
        </label>

        <label>
          Departure
          <select value={departureCode} onChange={(e) => setDepartureCode(e.target.value)}>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.code}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          Arrival
          <select value={arrivalCode} onChange={(e) => setArrivalCode(e.target.value)}>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.code}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          Number of goods
          <input
            type="number"
            min={1}
            max={50000}
            value={goodsCount}
            onChange={(e) => setGoodsCount(Number(e.target.value))}
          />
        </label>

        <label>
          Nesting levels: {packingDepth}
          <input
            type="range"
            min={1}
            max={20}
            value={packingDepth}
            onChange={(e) => setPackingDepth(Number(e.target.value))}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Generating…' : 'Generate & Load'}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </aside>
  );
}
