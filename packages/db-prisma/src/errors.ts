import {
  AuthError,
  ServiceUnavailableError,
  UniqueConstraintError,
} from '@mysamyr/core';

const UNAVAILABLE_PRISMA_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server timed out
  'P1008', // Operation timed out
  'P1017', // Server closed the connection
  'P2024', // Timed out fetching a connection from the pool
  'P2028', // Transaction API error (e.g. expired interactive transaction)
]);

const UNAVAILABLE_NETWORK_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
]);

function uniqueField(meta: unknown): string {
  const description = JSON.stringify(meta ?? '');
  if (description.includes('googleId')) return 'googleId';
  if (description.includes('dedupeKey')) return 'dedupeKey';
  if (/(^|[^A-Za-z])email([^A-Za-z]|$)/.test(description)) return 'email';
  return 'unknown';
}

/** Translate Prisma/driver failures into core errors; other errors pass through. */
export function mapPrismaError(error: unknown): unknown {
  if (error instanceof AuthError || !(error instanceof Error)) return error;

  const { code, meta } = error as { code?: unknown; meta?: unknown };
  if (code === 'P2002') {
    return new UniqueConstraintError(uniqueField(meta));
  }
  if (
    error.name === 'PrismaClientInitializationError' ||
    (typeof code === 'string' &&
      (UNAVAILABLE_PRISMA_CODES.has(code) ||
        UNAVAILABLE_NETWORK_CODES.has(code)))
  ) {
    const unavailable = new ServiceUnavailableError('Database is unavailable');
    unavailable.cause = error;
    return unavailable;
  }
  return error;
}
