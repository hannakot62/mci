import Fastify, { type FastifyLoggerOptions } from 'fastify';
import { config } from '../config/env';
import { errorHandler } from '../middleware/errorHandler';
import { registerTimerPlugin } from '../modules/metrics/timer.plugin';
import { registerMetricsRoutes } from '../modules/metrics/metrics.routes';
import { registerSetupRoutes } from '../modules/setup/setup.routes';
import { registerTransportRoutes } from '../modules/transport/transport.routes';

export const createApp = () => {
  const loggerConfig: FastifyLoggerOptions | boolean =
    config.logLevel === 'silent' ? false : { level: config.logLevel };

  const fastify = Fastify({ logger: loggerConfig });

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

