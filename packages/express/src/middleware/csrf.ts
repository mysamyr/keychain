import { CsrfOriginRejectedError } from '@mysamyr/core';
import type { Request, Response, NextFunction } from 'express';

function parseHttpUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    return null;
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash ||
    url.hostname.includes('*')
  ) {
    return null;
  }
  return url;
}

export function createCsrfMiddleware(
  trustedOrigins: readonly string[],
  requireHttps: boolean
) {
  if (trustedOrigins.length === 0) {
    throw new Error('trustedOrigins must contain at least one HTTP(S) origin');
  }

  const allowedOrigins = new Set(
    trustedOrigins.map(origin => {
      const url = parseHttpUrl(origin);
      if (
        !url ||
        (origin !== url.origin && origin !== `${url.origin}/`) ||
        (requireHttps && url.protocol !== 'https:')
      ) {
        throw new Error(
          'trustedOrigins must contain exact HTTP(S) origins without paths, credentials, or wildcards; HTTPS is required with secure cookies'
        );
      }
      return url.origin;
    })
  );

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    const origin = req.get('Origin');
    const referer = req.get('Referer');
    // An explicitly invalid Origin must never fall back to Referer.
    const url =
      origin !== undefined
        ? parseHttpUrl(origin)
        : referer !== undefined
          ? parseHttpUrl(referer)
          : null;

    const requestOrigin = parseHttpUrl(
      `${req.protocol}://${req.get('host') ?? ''}`
    );
    const sameOrigin =
      requestOrigin !== null && requestOrigin.origin === url?.origin;
    if (
      !url ||
      (origin !== undefined && origin !== url.origin) ||
      (!allowedOrigins.has(url.origin) && !sameOrigin)
    ) {
      next(new CsrfOriginRejectedError());
      return;
    }

    next();
  };
}
