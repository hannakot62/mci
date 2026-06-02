import type { FastifyInstance } from 'fastify';
import { getTimings } from '../metrics/timer.store';
import { TRANSPORT_UNIT_STATUS } from '../../shared/constants/status';
import { getMcisForTransport, updateAllMcisStatus } from '../mci/mci.service';
import { getTransportWithTree, listTransports } from './transport.service';

export interface TransportParams {
  id: string;
}

export function registerTransportRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/transport', async () => {
    const transports = await listTransports();
    return transports;
  });

  fastify.get<{ Params: TransportParams }>('/api/transport/:id', async (request, reply) => {
    const transport = await getTransportWithTree(request.params.id);
    if (!transport) {
      reply.code(404);
      return { error: 'Transport not found' };
    }
    return transport;
  });

  fastify.post<{ Params: TransportParams }>(
    '/api/transport/:id/dispatch',
    async (request, reply) => {
      const transportUnitId = request.params.id;
      const mcis = await getMcisForTransport(transportUnitId);
      if (mcis.length === 0) {
        reply.code(400);
        return { error: 'No MCI found for transport' };
      }

      const status = TRANSPORT_UNIT_STATUS.inTransit;
      const result = await updateAllMcisStatus(transportUnitId, status);

      return {
        ...result,
        timings: getTimings(),
      };
    }
  );

  fastify.post<{ Params: TransportParams }>(
    '/api/transport/:id/deliver',
    async (request, reply) => {
      const transportUnitId = request.params.id;
      const mcis = await getMcisForTransport(transportUnitId);
      if (mcis.length === 0) {
        reply.code(400);
        return { error: 'No MCI found for transport' };
      }

      const status = TRANSPORT_UNIT_STATUS.delivered;
      const result = await updateAllMcisStatus(transportUnitId, status);

      return {
        ...result,
        timings: getTimings(),
      };
    }
  );
}
