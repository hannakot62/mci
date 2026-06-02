import { FastifyInstance } from 'fastify';
import { clearTimings, getTimings } from '../plugins/timer';

export function registerMetricsRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/metrics', async () => {
    return getTimings();
  });

  fastify.delete('/api/metrics', async (_request, reply) => {
    clearTimings();
    reply.code(204);
    return null;
  });
}
