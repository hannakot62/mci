import Fastify, { FastifyLoggerOptions } from 'fastify';
import { config } from './config/environment';
import { registerPostRoutes } from './modules/posts';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  let loggerConfig: FastifyLoggerOptions | boolean;

  console.log(config);

  if (config.log_level === 'silent') {
    loggerConfig = false;
  } else {
    loggerConfig = {
      level: config.log_level,
    };
  }

  const fastify = Fastify({ logger: loggerConfig });

  // Health check
  fastify.get('/health', async () => {
    console.log('aaaa');
    return { success: true, data: { status: 'ok' } };
  });

  // Register all routes
  registerPostRoutes(fastify);

  // Error handler hook (runs after all handlers)
  fastify.setErrorHandler(errorHandler);

  return fastify;
};
