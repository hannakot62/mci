import React from 'react';
import { Button, CloseIcon, FieldLabel, IconButton } from '@/components/common';
import type { ProductCatalogItem, ProductGroupConfig } from '@/api/client';
import { NestingLevelRow } from './NestingLevelRow';

interface ProductGroupFieldsetProps {
  groupIndex: number;
  group: ProductGroupConfig;
  products: ProductCatalogItem[];
  canRemoveGroup: boolean;
  onUpdate: (patch: Partial<ProductGroupConfig>) => void;
  onRemoveGroup: () => void;
  onNestingChange: (levelIndex: number, childCount: number) => void;
  onAddNesting: () => void;
  onRemoveNesting: (levelIndex: number) => void;
}

export function ProductGroupFieldset({
  groupIndex,
  group,
  products,
  canRemoveGroup,
  onUpdate,
  onRemoveGroup,
  onNestingChange,
  onAddNesting,
  onRemoveNesting,
}: ProductGroupFieldsetProps): React.ReactElement {
  return (
    <fieldset className="product-group-fieldset">
      {canRemoveGroup && (
        <IconButton
          className="product-group-fieldset__remove"
          label="Remove product group"
          onClick={onRemoveGroup}
        >
          <CloseIcon />
        </IconButton>
      )}
      <legend>Product {groupIndex + 1}</legend>

      <FieldLabel label="Product">
        <select value={group.productSku} onChange={(e) => onUpdate({ productSku: e.target.value })}>
          {products.map((p) => (
            <option key={p.id} value={p.sku}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </FieldLabel>

      <FieldLabel label="Goods count">
        <input
          type="number"
          min={1}
          max={50000}
          value={group.goodsCount}
          onChange={(e) => onUpdate({ goodsCount: Number(e.target.value) })}
        />
      </FieldLabel>

      <FieldLabel label="Root packaging units">
        <input
          type="number"
          min={1}
          max={10}
          value={group.rootPackagingCount}
          onChange={(e) => onUpdate({ rootPackagingCount: Number(e.target.value) })}
        />
      </FieldLabel>

      <div className="nesting-levels">
        <span>Nesting per level (children under each parent)</span>
        {group.nestingLevels.map((level, li) => (
          <NestingLevelRow
            key={li}
            levelIndex={li}
            childCount={level.childCount}
            onChange={(childCount) => onNestingChange(li, childCount)}
            onRemove={() => onRemoveNesting(li)}
          />
        ))}
        <Button type="button" variant="outline" onClick={onAddNesting}>
          + nesting level
        </Button>
      </div>
    </fieldset>
  );
}
