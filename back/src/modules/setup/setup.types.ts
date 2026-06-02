export type TransportType = 'truck' | 'container' | 'van';

/** Child packaging units per parent at this depth (index 0 = under each root). */
export type NestingLevelConfig = {
  childCount: number;
  packagingTypeName?: string;
};

export type ProductGroupConfig = {
  productSku: string;
  goodsCount: number;
  /** Top-level packaging trees for this product (minimum 1). */
  rootPackagingCount: number;
  /** Nesting below each root; empty = goods go directly into roots. */
  nestingLevels: NestingLevelConfig[];
};

export interface SetupBody {
  transportCode: string;
  transportType: TransportType;
  productGroups?: ProductGroupConfig[];
  /** Legacy single-group setup */
  goodsCount?: number;
  packingDepth?: number;
}
