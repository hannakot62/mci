import cors from '@fastify/cors';
import Fastify, { type FastifyInstance, type FastifyLoggerOptions } from 'fastify';
import { config } from '../config/env';
import { errorHandler } from '../middleware/errorHandler';
import { registerTimerPlugin } from '../modules/metrics/timer.plugin';
import { registerMetricsRoutes } from '../modules/metrics/metrics.routes';
import { registerSetupRoutes } from '../modules/setup/setup.routes';
import { registerTransportRoutes } from '../modules/transport/transport.routes';

const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export const createApp = async (): Promise<FastifyInstance> => {
  const loggerConfig: FastifyLoggerOptions | boolean =
    config.logLevel === 'silent' ? false : { level: config.logLevel };

  const fastify = Fastify({ logger: loggerConfig });

  const corsOrigins =
    config.corsOrigins.length > 0
      ? config.corsOrigins
      : config.nodeEnv === 'production'
        ? false
        : defaultDevOrigins;

  await fastify.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  fastify.removeContentTypeParser('application/json');
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_request, body, done) => {
      if (body === '' || body === undefined) {
        done(null, undefined);
        return;
      }
      try {
        done(null, JSON.parse(body.toString()) as unknown);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  fastify.get('/health', async () => {
    return { success: true, data: { status: 'ok' } };
  });

  void registerTimerPlugin(fastify);
  registerMetricsRoutes(fastify);
  registerSetupRoutes(fastify);
  registerTransportRoutes(fastify);

  fastify.setErrorHandler(errorHandler);

  return fastify;
};
