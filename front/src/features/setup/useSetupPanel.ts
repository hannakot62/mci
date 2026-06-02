import { useCallback, useEffect, useState } from 'react';
import {
  listProducts,
  setup,
  type NestingLevelConfig,
  type ProductCatalogItem,
  type ProductGroupConfig,
} from '@/api/client';
import { defaultGroup, nextTransportCode } from './setup.utils';
import type { TransportType } from './setup.types';

export function useSetupPanel(onGenerated: (transportId: string) => void) {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [transportCode, setTransportCode] = useState(nextTransportCode);
  const [transportType, setTransportType] = useState<TransportType>('truck');
  const [groups, setGroups] = useState<ProductGroupConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then((data) => {
        setProducts(data);
        if (data.length > 0) {
          setGroups([defaultGroup(data[0])]);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const updateGroup = useCallback((index: number, patch: Partial<ProductGroupConfig>): void => {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }, []);

  const updateNestingLevel = useCallback(
    (groupIndex: number, levelIndex: number, patch: Partial<NestingLevelConfig>): void => {
      setGroups((prev) =>
        prev.map((g, i) => {
          if (i !== groupIndex) return g;
          const nestingLevels = g.nestingLevels.map((l, li) =>
            li === levelIndex ? { ...l, ...patch } : l
          );
          return { ...g, nestingLevels };
        })
      );
    },
    []
  );

  const addNestingLevel = useCallback((groupIndex: number): void => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, nestingLevels: [...g.nestingLevels, { childCount: 1 }] } : g
      )
    );
  }, []);

  const removeNestingLevel = useCallback((groupIndex: number, levelIndex: number): void => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, nestingLevels: g.nestingLevels.filter((_, li) => li !== levelIndex) }
          : g
      )
    );
  }, []);

  const addProductGroup = useCallback((): void => {
    setGroups((prev) => {
      const used = new Set(prev.map((g) => g.productSku));
      const next = products.find((p) => !used.has(p.sku));
      if (!next) return prev;
      return [...prev, defaultGroup(next)];
    });
  }, [products]);

  const removeProductGroup = useCallback((index: number): void => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (groups.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const result = await setup({
          transportCode,
          transportType,
          productGroups: groups,
        });
        onGenerated(result.transportUnitId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Setup failed');
      } finally {
        setLoading(false);
      }
    },
    [groups, onGenerated, transportCode, transportType]
  );

  return {
    products,
    transportCode,
    setTransportCode,
    transportType,
    setTransportType,
    groups,
    loading,
    error,
    updateGroup,
    updateNestingLevel,
    addNestingLevel,
    removeNestingLevel,
    addProductGroup,
    removeProductGroup,
    handleSubmit,
  };
}
