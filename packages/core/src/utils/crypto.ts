import { createHash, randomBytes } from 'node:crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 256-bit random token in base64url form (43 characters). */
export function generateBearerToken(): string {
  return randomBytes(32).toString('base64url');
}

export const BEARER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const HEX_TOKEN_PATTERN = /^[a-f0-9]{64}$/;
