import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pushTiming } from './timer.store';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

export async function registerTimerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.startTime = performance.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const start = request.startTime;
    if (start === undefined) return;

    pushTiming({
      route: request.routeOptions?.url ?? request.url,
      method: request.method,
      durationMs: Math.round(performance.now() - start),
      statusCode: reply.statusCode,
    });
  });
}

