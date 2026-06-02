import dotenv from 'dotenv';

dotenv.config();

export type AppConfig = {
  nodeEnv: string;
  port: number;
  host: string;
  databaseUrl: string;
  logLevel: string | 'silent';
};

const parseIntOr = (value: string | undefined, fallback: number): number => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseIntOr(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
};

