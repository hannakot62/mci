import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../config/database';
import { getTimings } from '../plugins/timer';
import { getMciForTransport, updateStatusViaMci } from '../services/mci.service';
import { getTransportWithTree, listTransports } from '../services/transport.service';

const prisma = getPrismaClient();

interface TransportParams {
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
      const mciId = await getMciForTransport(request.params.id);
      if (!mciId) {
        reply.code(400);
        return { error: 'No MCI found for transport' };
      }

      const result = await updateStatusViaMci(mciId, 'in_transit');
      await prismaUpdateTransportStatus(request.params.id, 'in_transit');

      return {
        mciId,
        ...result,
        timings: getTimings(),
      };
    }
  );

  fastify.post<{ Params: TransportParams }>(
    '/api/transport/:id/deliver',
    async (request, reply) => {
      const mciId = await getMciForTransport(request.params.id);
      if (!mciId) {
        reply.code(400);
        return { error: 'No MCI found for transport' };
      }

      const result = await updateStatusViaMci(mciId, 'delivered');
      await prismaUpdateTransportStatus(request.params.id, 'delivered');

      return {
        mciId,
        ...result,
        timings: getTimings(),
      };
    }
  );
}

async function prismaUpdateTransportStatus(id: string, status: string): Promise<void> {
  await prisma.transportUnit.update({
    where: { id },
    data: { status },
  });
}
