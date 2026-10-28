import type { LoginMetadata } from '@mysamyr/core';
import type { Request } from 'express';

export function requestMetadata(req: Request): LoginMetadata {
  return {
    userAgent: req.get('user-agent') ?? 'unknown',
    ip: req.ip || req.socket.remoteAddress || 'unknown',
  };
}

export function resolveRequestLocale(req: {
  get(name: string): string | undefined;
}): string {
  let preferredLocale = 'en';
  let preferredQuality = 0;

  for (const entry of (req.get('Accept-Language') ?? '').split(',')) {
    const match =
      /^([a-z]{1,8}(?:-[a-z0-9]{1,8})*|\*)(?:\s*;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?$/i.exec(
        entry.trim()
      );
    if (!match || !match[1]) {
      continue;
    }

    const quality = Number(match[2] ?? 1);
    if (quality <= preferredQuality) {
      continue;
    }

    const candidate = match[1];
    if (candidate === '*') {
      preferredLocale = 'en';
      preferredQuality = quality;
      continue;
    }

    try {
      const [locale] = Intl.getCanonicalLocales(candidate);
      const language = locale?.split('-')[0];
      if (language === 'en' || language === 'uk') {
        preferredLocale = language;
        preferredQuality = quality;
      }
    } catch (error) {
      if (!(error instanceof RangeError)) {
        throw error;
      }
      // Malformed language tags do not participate in negotiation.
    }
  }

  return preferredLocale;
}
