import { z } from 'zod/v4';

import type { IDatabaseAdapter } from '../interfaces/adapter-db.js';
import type { IEmailAdapter } from '../interfaces/adapter-email.js';
import type { AuthEventHandler } from '../observability/events.js';
import type { AuthLogger } from '../observability/logger.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const DeliveryConfigSchema = z.object({
  /** Start the outbox dispatcher and cleanup timers in this process. */
  autoStart: z.boolean().default(true),
  pollIntervalMs: z.number().int().min(100).default(5000),
  batchSize: z.number().int().min(1).max(100).default(10),
  maxAttempts: z.number().int().min(1).max(50).default(8),
  /** Lease per claimed message; keep longer than the email adapter's timeouts. */
  leaseMs: z.number().int().min(1000).default(60_000),
  cleanupIntervalMs: z.number().int().min(60_000).default(HOUR_MS),
  outboxRetentionMs: z
    .number()
    .int()
    .min(HOUR_MS)
    .default(7 * DAY_MS),
});

export const AuthConfigSchema = z.object({
  db: z.custom<IDatabaseAdapter>(val => val != null),
  email: z.custom<IEmailAdapter>(val => val != null),
  appName: z.string().trim().min(1),
  senderAddress: z.string().trim().min(1),
  supportContact: z.string().trim().min(1),
  /** Signs email-change tokens and encrypts queued emails. */
  secret: z.string().min(32),
  sessionTtlMs: z.number().positive().default(DAY_MS),
  rememberMeTtlMs: z
    .number()
    .positive()
    .default(30 * DAY_MS),
  emailTokenTtlMs: z.number().positive().default(HOUR_MS),
  passwordResetTokenTtlMs: z
    .number()
    .int()
    .min(15 * 60 * 1000)
    .max(30 * 60 * 1000)
    .default(20 * 60 * 1000),
  passwordScryptN: z
    .number()
    .int()
    .min(16384)
    .max(65536)
    .refine(value => (value & (value - 1)) === 0)
    .default(32768),
  passwordScryptR: z.number().int().min(1).max(16).default(8),
  passwordScryptP: z.number().int().min(1).max(4).default(1),
  requireEmailVerification: z.boolean().default(false),
  google: z
    .object({
      clientId: z.string(),
      clientSecret: z.string(),
      redirectUri: z.url(),
    })
    .optional(),
  delivery: DeliveryConfigSchema.prefault({}),
  logger: z
    .custom<AuthLogger>(
      val =>
        val != null &&
        typeof val === 'object' &&
        ['debug', 'info', 'warn', 'error'].every(
          level => typeof (val as Record<string, unknown>)[level] === 'function'
        )
    )
    .optional(),
  onEvent: z
    .custom<AuthEventHandler>(val => typeof val === 'function')
    .optional(),
});

export type AuthConfig = z.input<typeof AuthConfigSchema>;
export type DeliveryConfig = z.input<typeof DeliveryConfigSchema>;
