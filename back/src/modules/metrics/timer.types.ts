export interface TimingEntry {
  id: string;
  route: string;
  method: string;
  durationMs: number;
  statusCode: number;
  timestamp: string;
  label?: string;
}

