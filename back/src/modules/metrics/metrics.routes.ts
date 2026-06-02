import type { FastifyInstance } from 'fastify';
import { clearTimings, getTimings } from './timer.store';

export function registerMetricsRoutes(fastify: FastifyInstance): void {
  fastify.get(
    '/api/metrics',
    { logLevel: 'silent' },
    async () => {
    return getTimings();
    }
  );

  fastify.delete(
    '/api/metrics',
    { logLevel: 'silent' },
    async (_request, reply) => {
    clearTimings();
    reply.code(204);
    return null;
    }
  );
}

