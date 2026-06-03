import React from 'react';
import { Button, CloseIcon, FieldLabel, IconButton } from '@/components/common';
import type { ProductCatalogItem, ProductGroupConfig } from '@/api/client';
import { NestingLevelRow } from './NestingLevelRow';
 import {
  SETUP_MAX_GOODS_COUNT,
  SETUP_MAX_NESTING_LEVELS,
  SETUP_MAX_PACKAGING_UNITS,
  SETUP_MAX_ROOT_PACKAGING_COUNT,
} from './setup.limits';
import { clampInt, estimatePackagingCount } from './setup.utils';

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
  const packagingEstimate = estimatePackagingCount(group);
  const packagingOverLimit = packagingEstimate > SETUP_MAX_PACKAGING_UNITS;

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
          max={SETUP_MAX_GOODS_COUNT}
          value={group.goodsCount}
          onChange={(e) =>
            onUpdate({ goodsCount: clampInt(Number(e.target.value), 1, SETUP_MAX_GOODS_COUNT) })
          }
        />
      </FieldLabel>

      <FieldLabel label="Root packaging units">
        <input
          type="number"
          min={1}
          max={SETUP_MAX_ROOT_PACKAGING_COUNT}
          value={group.rootPackagingCount}
          onChange={(e) =>
            onUpdate({
              rootPackagingCount: clampInt(
                Number(e.target.value),
                1,
                SETUP_MAX_ROOT_PACKAGING_COUNT
              ),
            })
          }
        />
      </FieldLabel>

      <p
        className={`setup-estimate${packagingOverLimit ? ' setup-estimate--error' : ''}`}
        role="status"
      >
        Est. packaging units: {packagingEstimate.toLocaleString('en-US')} /{' '}
        {SETUP_MAX_PACKAGING_UNITS.toLocaleString('en-US')}
        {packagingOverLimit ? ' — too many, reduce nesting or roots' : ''}
      </p>

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
        {group.nestingLevels.length < SETUP_MAX_NESTING_LEVELS && (
          <Button type="button" variant="outline" onClick={onAddNesting}>
            + nesting level
          </Button>
        )}
      </div>
    </fieldset>
  );
}
