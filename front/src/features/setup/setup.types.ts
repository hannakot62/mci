import type { ProductCatalogItem, ProductGroupConfig } from '@/api/client';

export type TransportType = 'truck' | 'container' | 'van';

export interface SetupPanelProps {
  onGenerated: (transportId: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export type { ProductCatalogItem, ProductGroupConfig };
