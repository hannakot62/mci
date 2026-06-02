import type { FastifyInstance } from 'fastify';
import { getTimings } from '../metrics/timer.store';
import { getMcisForTransport } from '../mci/mci.service';
import {
  SETUP_MAX_GOODS_COUNT,
  SETUP_MAX_PACKING_DEPTH,
  SETUP_MIN_GOODS_COUNT,
  SETUP_MIN_PACKING_DEPTH,
  SETUP_DEFAULT_PACKING_DEPTH,
} from '../../shared/constants/limits';
import { generateMockCargo, legacyToProductGroups } from './mockCargo.service';
import type { ProductGroupConfig, SetupBody } from './setup.types';
import { listAllLocations } from '../transport/transport.service';
import { getPrismaClient } from '../../infrastructure/db/prisma';

const prisma = getPrismaClient();

function normalizeProductGroups(
  body: SetupBody,
  products: { sku: string }[]
): ProductGroupConfig[] {
  if (body.productGroups && body.productGroups.length > 0) {
    return body.productGroups.map((g) => ({
      productSku: g.productSku,
      goodsCount: Math.min(
        SETUP_MAX_GOODS_COUNT,
        Math.max(SETUP_MIN_GOODS_COUNT, g.goodsCount)
      ),
      rootPackagingCount: Math.max(1, g.rootPackagingCount ?? 1),
      nestingLevels: (g.nestingLevels ?? []).map((l) => ({
        childCount: Math.max(0, Math.min(20, l.childCount)),
        packagingTypeName: l.packagingTypeName,
      })),
    }));
  }

  const depth = Math.min(
    SETUP_MAX_PACKING_DEPTH,
    Math.max(SETUP_MIN_PACKING_DEPTH, body.packingDepth ?? SETUP_DEFAULT_PACKING_DEPTH)
  );
  const count = Math.min(
    SETUP_MAX_GOODS_COUNT,
    Math.max(SETUP_MIN_GOODS_COUNT, body.goodsCount ?? SETUP_MIN_GOODS_COUNT)
  );

  return legacyToProductGroups(products, count, depth);
}

export function registerSetupRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/locations', async () => listAllLocations());

  fastify.get('/api/products', async () =>
    prisma.product.findMany({
      select: { id: true, sku: true, name: true, allowedPackagingTypes: true },
      orderBy: { name: 'asc' },
    })
  );

  fastify.post<{ Body: SetupBody }>('/api/setup', async (request, reply) => {
    const { transportCode, transportType } = request.body;

    if (!transportCode || !transportType) {
      reply.code(400);
      return { error: 'Missing required fields' };
    }

    const products = await prisma.product.findMany();
    if (products.length === 0) {
      reply.code(400);
      return { error: 'No products configured' };
    }

    let productGroups: ProductGroupConfig[];
    try {
      productGroups = normalizeProductGroups(request.body, products);
    } catch {
      reply.code(400);
      return { error: 'Invalid product groups' };
    }

    if (productGroups.length === 0) {
      reply.code(400);
      return { error: 'At least one product group required' };
    }

    try {
      const { transportUnitId, summary } = await generateMockCargo({
        transportCode,
        transportType,
        productGroups,
      });

      const mcis = await getMcisForTransport(transportUnitId);

      reply.code(200);
      return {
        transportUnitId,
        mciIds: mcis.map((m) => m.id),
        mciId: mcis[0]?.id ?? null,
        summary,
        timings: getTimings(),
      };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : 'Setup failed' };
    }
  });
}
