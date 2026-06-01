import { createApp } from './app';
import { config } from './config/environment';
import { disconnectDatabase } from './config/database';

const start = async (): Promise<void> => {
  try {
    const fastify = createApp();
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`✅ Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await disconnectDatabase();
  process.exit(0);
});
