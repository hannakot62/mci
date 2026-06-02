import { FastifyInstance } from 'fastify';
import { getTimings } from '../plugins/timer';
import { getMciForTransport } from '../services/mci.service';
import { generateMockCargo } from '../services/mock.service';
import { listLocations } from '../services/transport.service';

interface SetupBody {
  transportCode: string;
  transportType: 'truck' | 'container' | 'van';
  departureCode: string;
  arrivalCode: string;
  goodsCount: number;
  packingDepth: number;
}

export function registerSetupRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/locations', async () => listLocations());

  fastify.post<{ Body: SetupBody }>('/api/setup', async (request, reply) => {
    const {
      transportCode,
      transportType,
      departureCode,
      arrivalCode,
      goodsCount,
      packingDepth,
    } = request.body;

    if (!transportCode || !transportType || !departureCode || !arrivalCode) {
      reply.code(400);
      return { error: 'Missing required fields' };
    }

    const depth = Math.min(4, Math.max(1, packingDepth ?? 2));
    const count = Math.min(500, Math.max(1, goodsCount ?? 1));

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
