export interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface TimingEntry {
  id: string;
  route: string;
  method: string;
  durationMs: number;
  statusCode: number;
  timestamp: string;
  label?: string;
}

export interface SetupPayload {
  transportCode: string;
  transportType: 'truck' | 'container' | 'van';
  departureCode: string;
  arrivalCode: string;
  goodsCount: number;
  packingDepth: number;
}

export interface SetupResponse {
  transportUnitId: string;
  mciId: string | null;
  summary: {
    transportCode: string;
    packagingCount: number;
    goodsCount: number;
    packingDepth: number;
  };
  timings: TimingEntry[];
}

export interface TransportSummary {
  id: string;
  code: string;
  type: string;
  status: string;
  departureLocation: { code: string; name: string };
  arrivalLocation: { code: string; name: string };
}

export interface GoodsNode {
  id: string;
  serialNumber: string;
  status: string;
  product: { id: string; name: string; sku: string };
}

export interface PackagingTreeNode {
  id: string;
  status: string;
  isMci: boolean;
  path: string;
  depth: number;
  packagingType: { id: string; name: string };
  goods: GoodsNode[];
  goodsCount: number;
  goodsTruncated?: boolean;
  children: PackagingTreeNode[];
}

export interface TransportTreeMeta {
  totalGoods: number;
  goodsInline: boolean;
}

export interface TransportDetail {
  id: string;
  code: string;
  type: string;
  status: string;
  departureLocation: Location;
  arrivalLocation: Location;
  packagingTree: PackagingTreeNode[];
  treeMeta?: TransportTreeMeta;
}

export interface StatusUpdateResponse {
  mciId: string;
  updatedPackaging: number;
  updatedGoods: number;
  timings: TimingEntry[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listLocations(): Promise<Location[]> {
  return request<Location[]>('/api/locations');
}

export function setup(payload: SetupPayload): Promise<SetupResponse> {
  return request<SetupResponse>('/api/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listTransports(): Promise<TransportSummary[]> {
  return request<TransportSummary[]>('/api/transport');
}

export function getTransport(id: string): Promise<TransportDetail> {
  return request<TransportDetail>(`/api/transport/${id}`);
}

export function dispatch(id: string): Promise<StatusUpdateResponse> {
  return request<StatusUpdateResponse>(`/api/transport/${id}/dispatch`, {
    method: 'POST',
  });
}

export function deliver(id: string): Promise<StatusUpdateResponse> {
  return request<StatusUpdateResponse>(`/api/transport/${id}/deliver`, {
    method: 'POST',
  });
}

export function getMetrics(): Promise<TimingEntry[]> {
  return request<TimingEntry[]>('/api/metrics');
}

export function clearMetrics(): Promise<void> {
  return request<void>('/api/metrics', { method: 'DELETE' });
}
