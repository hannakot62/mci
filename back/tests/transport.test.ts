import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { disconnectDatabase } from '../src/infrastructure/db/prisma';
import { clearTimings } from '../src/modules/metrics/timer.store';
import type { ProductGroupConfig } from '../src/modules/setup/setup.types';
import { resetCargoData } from './helpers';

describe('Transport API integration', () => {
  const app = createApp();

  beforeEach(async () => {
    clearTimings();
    await resetCargoData();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  async function firstProductSku(): Promise<string> {
    const products = await app.inject({ method: 'GET', url: '/api/products' });
    const catalog = products.json() as Array<{ sku: string }>;
    expect(catalog.length).toBeGreaterThan(0);
    return catalog[0].sku;
  }

  function singleGroup(sku: string, goodsCount: number, nestingLevels: ProductGroupConfig['nestingLevels'] = [{ childCount: 1 }]) {
    return {
      transportCode: `TRK-${Date.now()}`,
      transportType: 'truck' as const,
      productGroups: [
        {
          productSku: sku,
          goodsCount,
          rootPackagingCount: 1,
          nestingLevels,
        },
      ],
    };
  }

  it('POST /api/setup with productGroups → returns 200 and mciIds', async () => {
    const sku = await firstProductSku();
    const response = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: singleGroup(sku, 10),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { mciIds: string[]; transportUnitId: string };
    expect(body.transportUnitId).toBeTruthy();
    expect(body.mciIds.length).toBeGreaterThan(0);
  });

  it('GET /api/transport/:id → tree contains at least one isMci node', async () => {
    const sku = await firstProductSku();
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        ...singleGroup(sku, 5),
        transportCode: 'TRK-INT-002',
        transportType: 'container',
        productGroups: [
          {
            productSku: sku,
            goodsCount: 5,
            rootPackagingCount: 1,
            nestingLevels: [{ childCount: 1 }, { childCount: 1 }],
          },
        ],
      },
    });

    const { transportUnitId } = setup.json() as { transportUnitId: string };

    const response = await app.inject({
      method: 'GET',
      url: `/api/transport/${transportUnitId}`,
    });

    expect(response.statusCode).toBe(200);
    const transport = response.json() as {
      packagingTree: Array<{ isMci: boolean; children: unknown[] }>;
    };

    const countMci = (nodes: Array<{ isMci: boolean; children: unknown[] }>): number =>
      nodes.reduce((acc, node) => {
        const childNodes = node.children as Array<{ isMci: boolean; children: unknown[] }>;
        return acc + (node.isMci ? 1 : 0) + countMci(childNodes);
      }, 0);

    expect(countMci(transport.packagingTree)).toBeGreaterThanOrEqual(1);
  });

  it('multi-product setup → one MCI per product group', async () => {
    const products = await app.inject({ method: 'GET', url: '/api/products' });
    const catalog = products.json() as Array<{ sku: string }>;
    expect(catalog.length).toBeGreaterThanOrEqual(2);

    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-MULTI',
        transportType: 'truck',
        productGroups: [
          {
            productSku: catalog[0].sku,
            goodsCount: 4,
            rootPackagingCount: 1,
            nestingLevels: [{ childCount: 1 }],
          },
          {
            productSku: catalog[1].sku,
            goodsCount: 3,
            rootPackagingCount: 1,
            nestingLevels: [{ childCount: 2 }],
          },
        ],
      },
    });

    expect(setup.statusCode).toBe(200);
    const { transportUnitId, mciIds } = setup.json() as {
      transportUnitId: string;
      mciIds: string[];
    };
    expect(mciIds.length).toBeGreaterThanOrEqual(2);

    const detail = await app.inject({
      method: 'GET',
      url: `/api/transport/${transportUnitId}`,
    });
    const transport = detail.json() as {
      packagingTree: Array<{ isMci: boolean; children: unknown[] }>;
    };

    const countMci = (nodes: Array<{ isMci: boolean; children: unknown[] }>): number =>
      nodes.reduce((acc, node) => {
        const childNodes = node.children as Array<{ isMci: boolean; children: unknown[] }>;
        return acc + (node.isMci ? 1 : 0) + countMci(childNodes);
      }, 0);

    expect(countMci(transport.packagingTree)).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/transport/:id/dispatch with empty JSON body → 200', async () => {
    const sku = await firstProductSku();
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        ...singleGroup(sku, 4),
        transportCode: 'TRK-INT-003B',
        transportType: 'van',
      },
    });

    const { transportUnitId } = setup.json() as { transportUnitId: string };

    const dispatch = await app.inject({
      method: 'POST',
      url: `/api/transport/${transportUnitId}/dispatch`,
      headers: { 'content-type': 'application/json' },
    });

    expect(dispatch.statusCode).toBe(200);
  });

  it('POST /api/transport/:id/dispatch → goods under MCI become in_transit', async () => {
    const sku = await firstProductSku();
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        ...singleGroup(sku, 8),
        transportCode: 'TRK-INT-003',
        transportType: 'van',
      },
    });

    const { transportUnitId } = setup.json() as { transportUnitId: string };

    const dispatch = await app.inject({
      method: 'POST',
      url: `/api/transport/${transportUnitId}/dispatch`,
    });

    expect(dispatch.statusCode).toBe(200);

    const detail = await app.inject({
      method: 'GET',
      url: `/api/transport/${transportUnitId}`,
    });

    const transport = detail.json() as {
      packagingTree: Array<{
        isMci: boolean;
        status: string;
        goods: Array<{ status: string }>;
        children: unknown[];
      }>;
    };

    type TreeNode = {
      isMci: boolean;
      status: string;
      goods: Array<{ status: string }>;
      children: TreeNode[];
    };

    const collectSubtreeStatuses = (node: TreeNode): string[] => [
      node.status,
      ...node.goods.map((g) => g.status),
      ...node.children.flatMap(collectSubtreeStatuses),
    ];

    const collectMciNodes = (nodes: TreeNode[]): TreeNode[] =>
      nodes.flatMap((n) => [...(n.isMci ? [n] : []), ...collectMciNodes(n.children)]);

    const statuses = collectMciNodes(transport.packagingTree as TreeNode[]).flatMap(
      collectSubtreeStatuses
    );
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((s) => s === 'in_transit')).toBe(true);
  });

  it('timing entries appear in GET /api/metrics after each operation', async () => {
    clearTimings();

    const sku = await firstProductSku();
    await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        ...singleGroup(sku, 3),
        transportCode: 'TRK-INT-004',
      },
    });

    const metrics = await app.inject({
      method: 'GET',
      url: '/api/metrics',
    });

    expect(metrics.statusCode).toBe(200);
    const entries = metrics.json() as Array<{ durationMs: number; label?: string }>;
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.label === 'FIND MCI')).toBe(true);
  });

  it('POST /api/setup without productGroups → 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-NO-GROUPS',
        transportType: 'truck',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /api/setup with excessive packaging estimate → 400', async () => {
    const sku = await firstProductSku();
    const response = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-TOO-BIG',
        transportType: 'truck',
        productGroups: [
          {
            productSku: sku,
            goodsCount: 100,
            rootPackagingCount: 100,
            nestingLevels: [{ childCount: 32 }, { childCount: 47 }],
          },
        ],
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json() as { error: string };
    expect(body.error).toMatch(/packaging units exceeds/i);
  });
});
