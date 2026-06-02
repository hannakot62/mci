export type LocationBrief = { id: string; code: string; name: string };

export type PackagingTreeGoodsItem = {
  id: string;
  serialNumber: string;
  status: string;
  isMci: boolean;
  product: { id: string; name: string; sku: string };
  firstLocation: LocationBrief;
  lastLocation: LocationBrief;
};

export type PackagingTreeNode = {
  id: string;
  status: string;
  isMci: boolean;
  path: string;
  depth: number;
  packagingType: { id: string; name: string };
  firstLocation: LocationBrief;
  lastLocation: LocationBrief;
  goods: PackagingTreeGoodsItem[];
  goodsCount: number;
  goodsTruncated: boolean;
  children: PackagingTreeNode[];
};

export type TransportTreeMeta = {
  totalGoods: number;
  goodsInline: boolean;
};
