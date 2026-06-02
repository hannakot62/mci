import React, { useEffect, useState } from 'react';
import {
  listProducts,
  setup,
  type NestingLevelConfig,
  type ProductCatalogItem,
  type ProductGroupConfig,
} from '../api/client';

interface SetupPanelProps {
  onGenerated: (transportId: string) => void;
}

function nextTransportCode(): string {
  const n = Math.floor(Math.random() * 900) + 100;
  return `TRK-${n}`;
}

function defaultGroup(product: ProductCatalogItem): ProductGroupConfig {
  return {
    productSku: product.sku,
    goodsCount: 10,
    rootPackagingCount: 1,
    nestingLevels: [{ childCount: 1 }],
  };
}

export function SetupPanel({ onGenerated }: SetupPanelProps): React.ReactElement {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [transportCode, setTransportCode] = useState(nextTransportCode());
  const [transportType, setTransportType] = useState<'truck' | 'container' | 'van'>('truck');
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

  const updateGroup = (index: number, patch: Partial<ProductGroupConfig>): void => {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const updateNestingLevel = (
    groupIndex: number,
    levelIndex: number,
    patch: Partial<NestingLevelConfig>
  ): void => {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIndex) return g;
        const nestingLevels = g.nestingLevels.map((l, li) =>
          li === levelIndex ? { ...l, ...patch } : l
        );
        return { ...g, nestingLevels };
      })
    );
  };

  const addNestingLevel = (groupIndex: number): void => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, nestingLevels: [...g.nestingLevels, { childCount: 1 }] }
          : g
      )
    );
  };

  const removeNestingLevel = (groupIndex: number, levelIndex: number): void => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, nestingLevels: g.nestingLevels.filter((_, li) => li !== levelIndex) }
          : g
      )
    );
  };

  const addProductGroup = (): void => {
    const used = new Set(groups.map((g) => g.productSku));
    const next = products.find((p) => !used.has(p.sku));
    if (!next) return;
    setGroups((prev) => [...prev, defaultGroup(next)]);
  };

  const removeProductGroup = (index: number): void => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
  };

  return (
    <aside className="setup-panel">
      <h2>Cargo Setup</h2>
      <p className="setup-hint">
        Routes are assigned to packaging and goods (randomly on generation). MCI is calculated
        separately for each product.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Transport code
          <input
            value={transportCode}
            onChange={(e) => setTransportCode(e.target.value)}
            required
          />
        </label>

        <label>
          Transport type
          <select
            value={transportType}
            onChange={(e) => setTransportType(e.target.value as typeof transportType)}
          >
            <option value="truck">Truck</option>
            <option value="container">Container</option>
            <option value="van">Van</option>
          </select>
        </label>

        {groups.map((group, gi) => (
          <fieldset key={`${group.productSku}-${gi}`} className="product-group-fieldset">
            <legend>Product {gi + 1}</legend>
            {groups.length > 1 && (
              <button type="button" className="link-btn" onClick={() => removeProductGroup(gi)}>
                Remove group
              </button>
            )}

            <label>
              Product
              <select
                value={group.productSku}
                onChange={(e) => updateGroup(gi, { productSku: e.target.value })}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.sku}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Goods count
              <input
                type="number"
                min={1}
                max={50000}
                value={group.goodsCount}
                onChange={(e) => updateGroup(gi, { goodsCount: Number(e.target.value) })}
              />
            </label>

            <label>
              Root packaging units
              <input
                type="number"
                min={1}
                max={10}
                value={group.rootPackagingCount}
                onChange={(e) =>
                  updateGroup(gi, { rootPackagingCount: Number(e.target.value) })
                }
              />
            </label>

            <div className="nesting-levels">
              <span>Nesting per level (children under each parent)</span>
              {group.nestingLevels.map((level, li) => (
                <div key={li} className="nesting-row">
                  <label>
                    Level {li + 1}: {level.childCount}
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={level.childCount}
                      onChange={(e) =>
                        updateNestingLevel(gi, li, { childCount: Number(e.target.value) })
                      }
                    />
                  </label>
                  <button type="button" onClick={() => removeNestingLevel(gi, li)}>
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addNestingLevel(gi)}>
                + nesting level
              </button>
            </div>
          </fieldset>
        ))}

        {groups.length < products.length && (
          <button type="button" onClick={addProductGroup}>
            + product to truck
          </button>
        )}

        <button type="submit" disabled={loading || groups.length === 0}>
          {loading ? 'Generating…' : 'Generate & Load'}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </aside>
  );
}
