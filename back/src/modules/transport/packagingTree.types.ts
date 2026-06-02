export type PackagingTreeGoodsItem = {
  id: string;
  serialNumber: string;
  status: string;
  product: { id: string; name: string; sku: string };
};

export type PackagingTreeNode = {
  id: string;
  status: string;
  isMci: boolean;
  path: string;
  depth: number;
  packagingType: { id: string; name: string };
  goods: PackagingTreeGoodsItem[];
  goodsCount: number;
  goodsTruncated: boolean;
  children: PackagingTreeNode[];
};

export type TransportTreeMeta = {
  totalGoods: number;
  goodsInline: boolean;
};
