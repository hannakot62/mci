import type { ProductCatalogItem, ProductGroupConfig } from '@/api/client';

export function nextTransportCode(): string {
  const n = Math.floor(Math.random() * 900) + 100;
  return `TRK-${n}`;
}

export function defaultGroup(product: ProductCatalogItem): ProductGroupConfig {
  return {
    productSku: product.sku,
    goodsCount: 10,
    rootPackagingCount: 1,
    nestingLevels: [{ childCount: 1 }],
  };
}
