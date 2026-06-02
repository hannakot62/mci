import type { TransportUnitStatus } from '../constants/status';

export type TransportUnitId = string;
export type PackagingUnitId = string;

export type TransportUnitSummary = {
  id: TransportUnitId;
  code: string;
  type: string;
  status: TransportUnitStatus | string;
  createdAt: Date;
  departureLocation: { code: string; name: string };
  arrivalLocation: { code: string; name: string };
};

