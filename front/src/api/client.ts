export interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface ProductCatalogItem {
  id: string;
  sku: string;
  name: string;
  allowedPackagingTypes: string;
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

export interface NestingLevelConfig {
  childCount: number;
  packagingTypeName?: string;
}

export interface ProductGroupConfig {
  productSku: string;
  goodsCount: number;
  rootPackagingCount: number;
  nestingLevels: NestingLevelConfig[];
}

export interface SetupPayload {
  transportCode: string;
  transportType: 'truck' | 'container' | 'van';
  productGroups: ProductGroupConfig[];
}

export interface SetupResponse {
  transportUnitId: string;
  mciIds: string[];
  mciId: string | null;
  summary: {
    transportCode: string;
    packagingCount: number;
    goodsCount: number;
    productGroupCount: number;
    mciCount: number;
  };
  timings: TimingEntry[];
}

export interface TransportSummary {
  id: string;
  code: string;
  type: string;
  status: string;
  departureLocation?: { code: string; name: string } | null;
  arrivalLocation?: { code: string; name: string } | null;
}

export interface GoodsNode {
  id: string;
  serialNumber: string;
  status: string;
  isMci: boolean;
  product: { id: string; name: string; sku: string };
  firstLocation: Location;
  lastLocation: Location;
}

export interface PackagingTreeNode {
  id: string;
  status: string;
  isMci: boolean;
  path: string;
  depth: number;
  packagingType: { id: string; name: string };
  firstLocation: Location;
  lastLocation: Location;
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
  departureLocation?: Location | null;
  arrivalLocation?: Location | null;
  packagingTree: PackagingTreeNode[];
  treeMeta?: TransportTreeMeta;
}

export interface StatusUpdateResponse {
  mciIds: string[];
  mciId: string | null;
  updatedPackaging: number;
  updatedGoods: number;
  timings: TimingEntry[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const hasJsonBody = init?.body != null && init.body !== '';
  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
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

export function listProducts(): Promise<ProductCatalogItem[]> {
  return request<ProductCatalogItem[]>('/api/products');
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
