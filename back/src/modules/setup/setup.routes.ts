import type { FastifyInstance } from 'fastify';
import { getTimings } from '../metrics/timer.store';
import { getMciForTransport } from '../mci/mci.service';
import { SETUP_MAX_GOODS_COUNT, SETUP_MAX_PACKING_DEPTH, SETUP_MIN_GOODS_COUNT, SETUP_MIN_PACKING_DEPTH, SETUP_DEFAULT_PACKING_DEPTH } from '../../shared/constants/limits';
import { generateMockCargo } from './mockCargo.service';
import type { SetupBody } from './setup.types';
import { listAllLocations } from '../transport/transport.service';

export function registerSetupRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/locations', async () => listAllLocations());

  fastify.post<{ Body: SetupBody }>('/api/setup', async (request, reply) => {
    const { transportCode, transportType, departureCode, arrivalCode, goodsCount, packingDepth } =
      request.body;

    if (!transportCode || !transportType || !departureCode || !arrivalCode) {
      reply.code(400);
      return { error: 'Missing required fields' };
    }

    const depth = Math.min(
      SETUP_MAX_PACKING_DEPTH,
      Math.max(SETUP_MIN_PACKING_DEPTH, packingDepth ?? SETUP_DEFAULT_PACKING_DEPTH)
    );
    const count = Math.min(
      SETUP_MAX_GOODS_COUNT,
      Math.max(SETUP_MIN_GOODS_COUNT, goodsCount ?? SETUP_MIN_GOODS_COUNT)
    );

    try {
      const { transportUnitId, summary } = await generateMockCargo({
        transportCode,
        transportType,
        departureLocationCode: departureCode,
        arrivalLocationCode: arrivalCode,
        goodsCount: count,
        packingDepth: depth,
      });

      const mciId = await getMciForTransport(transportUnitId);

      reply.code(200);
      return {
        transportUnitId,
        mciId,
        summary,
        timings: getTimings(),
      };
    } catch (err) {
      reply.code(400);
      return { error: err instanceof Error ? err.message : 'Setup failed' };
    }
  });
}

