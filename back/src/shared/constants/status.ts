export const TRANSPORT_UNIT_STATUS = {
  inTransit: 'in_transit',
  delivered: 'delivered',
} as const;

export type TransportUnitStatus =
  (typeof TRANSPORT_UNIT_STATUS)[keyof typeof TRANSPORT_UNIT_STATUS];

