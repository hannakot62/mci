export type TransportType = 'truck' | 'container' | 'van';

export interface SetupBody {
  transportCode: string;
  transportType: TransportType;
  departureCode: string;
  arrivalCode: string;
  goodsCount: number;
  packingDepth: number;
}

