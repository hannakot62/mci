import Fastify, { FastifyLoggerOptions } from 'fastify';
import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { registerTimerPlugin } from './plugins/timer';
import { registerMetricsRoutes } from './routes/metrics';
import { registerSetupRoutes } from './routes/setup';
import { registerTransportRoutes } from './routes/transport';

export const createApp = () => {
  let loggerConfig: FastifyLoggerOptions | boolean;

  if (config.log_level === 'silent') {
    loggerConfig = false;
  } else {
    loggerConfig = {
      level: config.log_level,
    };
  }

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
