import { createHash } from 'node:crypto';

import { RateLimitedError, ServiceUnavailableError } from '@mysamyr/core';
import type { Request, Response, NextFunction } from 'express';

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
}

export interface RateLimitStore {
  /** Atomically increment a key for its window and return whether the limit permits the request. */
  consume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitDecision>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();
  private static readonly MAX_ENTRIES = 100_000;

  consume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitDecision> {
    const now = Date.now();
    let entry = this.entries.get(key);
    if (!entry || entry.resetAt <= now) {
      if (this.entries.size >= InMemoryRateLimitStore.MAX_ENTRIES) {
        for (const [storedKey, storedEntry] of this.entries) {
          if (storedEntry.resetAt <= now) this.entries.delete(storedKey);
        }
        if (this.entries.size >= InMemoryRateLimitStore.MAX_ENTRIES) {
          throw new ServiceUnavailableError('Rate-limit storage is full');
        }
      }
      entry = { count: 0, resetAt: now + windowMs };
      this.entries.set(key, entry);
    }

    entry.count += 1;
    return Promise.resolve({
      allowed: entry.count <= limit,
      retryAfterMs: Math.max(0, entry.resetAt - now),
    });
  }
}

function hashKey(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function accountKey(req: Request): string | undefined {
  if (req.keychain) return `user:${req.keychain.userId}`;
  if (req.body && typeof req.body === 'object') {
    const body = req.body as Record<string, unknown>;
    if (typeof body['email'] === 'string') {
      return `email:${body['email'].trim().toLowerCase()}`;
    }
    if (typeof body['token'] === 'string') {
      return `token:${body['token']}`;
    }
  }
  const queryToken = req.query['token'];
  if (typeof queryToken === 'string') return `token:${queryToken}`;
  return undefined;
}

export function createRateLimitMiddleware(
  store: RateLimitStore,
  scope: string,
  limits: { account?: number; ip: number; windowMs: number }
) {
  return async function rateLimit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const account = accountKey(req);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const buckets = [
      { key: `${scope}:ip:${hashKey(ip)}`, limit: limits.ip },
      ...(account && limits.account
        ? [
            {
              key: `${scope}:account:${hashKey(account)}`,
              limit: limits.account,
            },
          ]
        : []),
    ];

    try {
      for (const bucket of buckets) {
        const result = await store.consume(
          bucket.key,
          bucket.limit,
          limits.windowMs
        );
        if (!result.allowed) {
          res.set(
            'Retry-After',
            String(Math.max(1, Math.ceil(result.retryAfterMs / 1000)))
          );
          next(new RateLimitedError());
          return;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
