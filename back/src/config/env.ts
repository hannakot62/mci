import dotenv from 'dotenv';

dotenv.config();

export type AppConfig = {
  nodeEnv: string;
  port: number;
  host: string;
  databaseUrl: string;
  logLevel: string | 'silent';
  /** Allowed browser origins for CORS; empty = allow all (dev-friendly). */
  corsOrigins: string[];
};

const parseIntOr = (value: string | undefined, fallback: number): number => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCorsOrigins = (value: string | undefined): string[] => {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseIntOr(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
};

