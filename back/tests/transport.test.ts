import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { disconnectDatabase } from '../src/infrastructure/db/prisma';
import { clearTimings } from '../src/modules/metrics/timer.store';
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

  it('POST /api/setup with goodsCount=10 → returns 200, mciId is not null', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-INT-001',
        transportType: 'truck',
        goodsCount: 10,
        packingDepth: 2,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { mciId: string | null; transportUnitId: string };
    expect(body.transportUnitId).toBeTruthy();
    expect(body.mciId).toBeTruthy();
  });

  it('GET /api/transport/:id → tree contains at least one isMci node', async () => {
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-INT-002',
        transportType: 'container',
        goodsCount: 5,
        packingDepth: 3,
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
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-INT-003B',
        transportType: 'van',
        goodsCount: 4,
        packingDepth: 2,
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
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-INT-003',
        transportType: 'van',
        goodsCount: 8,
        packingDepth: 2,
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

    const findMcis = (nodes: TreeNode[]): TreeNode[] =>
      nodes.flatMap((n) => [...(n.isMci ? [n] : []), ...findMcis(n.children)]);

    const statuses = findMcis(transport.packagingTree as TreeNode[]).flatMap(
      collectSubtreeStatuses
    );
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((s) => s === 'in_transit')).toBe(true);
  });

  it('timing entries appear in GET /api/metrics after each operation', async () => {
    clearTimings();

    await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-INT-004',
        transportType: 'truck',
        goodsCount: 3,
        packingDepth: 2,
      },
    });

    const metrics = await app.inject({
      method: 'GET',
      url: '/api/metrics',
    });

    expect(metrics.statusCode).toBe(200);
    const entries = metrics.json() as Array<{ durationMs: number }>;
    expect(entries.length).toBeGreaterThan(0);
  });
});
