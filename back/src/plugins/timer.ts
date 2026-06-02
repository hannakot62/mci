import { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';

export interface TimingEntry {
  id: string;
  route: string;
  method: string;
  durationMs: number;
  statusCode: number;
  timestamp: string;
  label?: string;
}

const MAX_ENTRIES = 100;
const timingLog: TimingEntry[] = [];

export function pushTiming(entry: Omit<TimingEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): void {
  timingLog.push({
    id: entry.id ?? randomUUID(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    route: entry.route,
    method: entry.method,
    durationMs: entry.durationMs,
    statusCode: entry.statusCode,
    label: entry.label,
  });
  while (timingLog.length > MAX_ENTRIES) {
    timingLog.shift();
  }
}

export function getTimings(): TimingEntry[] {
  return [...timingLog];
}

export function clearTimings(): void {
  timingLog.length = 0;
}

export async function recordTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    pushTiming({
      route: label,
      method: 'INTERNAL',
      durationMs: Math.round(performance.now() - start),
      statusCode: 200,
      label,
    });
  }
}

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
