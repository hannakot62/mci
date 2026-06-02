import { createApp } from './createApp';
import { config } from '../config/env';
import { disconnectDatabase } from '../infrastructure/db/prisma';

export const startServer = async (): Promise<void> => {
  try {
    const fastify = createApp();
    await fastify.listen({ port: config.port, host: config.host });
    // eslint-disable-next-line no-console
    console.log(`✅ Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('\n🛑 Shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('\n🛑 Shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

