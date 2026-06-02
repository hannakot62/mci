import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { disconnectDatabase } from '../src/config/database';
import { clearTimings } from '../src/plugins/timer';
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
        departureCode: 'AMS',
        arrivalCode: 'RTM',
        goodsCount: 10,
        packingDepth: 2,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { mciId: string | null; transportUnitId: string };
    expect(body.transportUnitId).toBeTruthy();
    expect(body.mciId).toBeTruthy();
  });

  it('GET /api/transport/:id → tree contains isMci=true on exactly one node', async () => {
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-INT-002',
        transportType: 'container',
        departureCode: 'AMS',
        arrivalCode: 'BER',
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

    expect(countMci(transport.packagingTree)).toBe(1);
  });

  it('POST /api/transport/:id/dispatch → all goods status = in_transit', async () => {
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup',
      payload: {
        transportCode: 'TRK-INT-003',
        transportType: 'van',
        departureCode: 'HAM',
        arrivalCode: 'RTM',
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
        status: string;
        goods: Array<{ status: string }>;
        children: unknown[];
      }>;
    };

    const collectGoods = (
      nodes: Array<{
        goods: Array<{ status: string }>;
        children: unknown[];
      }>
    ): string[] =>
      nodes.flatMap((node) => {
        const childNodes = node.children as typeof nodes;
        return [
          ...node.goods.map((g) => g.status),
          ...collectGoods(childNodes),
        ];
      });

    const statuses = collectGoods(transport.packagingTree);
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
        departureCode: 'AMS',
        arrivalCode: 'RTM',
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
