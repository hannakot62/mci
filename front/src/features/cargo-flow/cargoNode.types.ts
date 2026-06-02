export type CargoNodeKind = 'transport' | 'packaging' | 'goods' | 'goods-summary';

export type CargoNodeData = {
  kind: CargoNodeKind;
  title: string;
  subtitle?: string;
  route?: string;
  status?: string;
  statusColor?: string;
  isMci?: boolean;
  mciProductSku?: string;
  mciAccent?: string;
  mciSoft?: string;
  mciStatusColor?: string;
};
