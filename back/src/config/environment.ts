import dotenv from 'dotenv';

dotenv.config();

export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  database_url: process.env.DATABASE_URL || 'file:./dev.db',
  log_level: process.env.LOG_LEVEL || 'info',
};
