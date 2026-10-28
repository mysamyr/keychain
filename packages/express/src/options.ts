import {
  type AuthEndpoints,
  type AuthPages,
  DEFAULT_ENDPOINTS,
  DEFAULT_PAGES,
} from '@mysamyr/core/endpoints';

import type { CookieOptions } from './cookies.js';
import type { RateLimitStore } from './middleware/rate-limit.js';

export interface AuthRouterOptions {
  /** Public frontend URL used for email links and redirects. */
  appUrl: string;
  /** Frontend pages, relative to `appUrl` (or absolute URLs). */
  pages?: Partial<AuthPages>;
  /** Exact origins allowed to send unsafe requests; defaults to the `appUrl` origin. */
  trustedOrigins?: readonly string[];
  cookies?: Partial<CookieOptions>;
  endpoints?: Partial<AuthEndpoints>;
  /** Shared atomic store; required when running several API instances. */
  rateLimitStore?: RateLimitStore;
}

export type PageUrls = (
  page: keyof AuthPages,
  query?: Record<string, string>
) => string;

function validatePageUrl(url: URL, name: string, requireHttps: boolean) {
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    (requireHttps && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error(
      `${name} must be an HTTP(S) URL without credentials or a fragment; HTTPS is required with secure cookies`
    );
  }
}

export function createPageUrls(
  appUrl: string,
  overrides: Partial<AuthPages> | undefined,
  requireHttps: boolean
): PageUrls {
  const base = new URL(appUrl);
  validatePageUrl(base, 'appUrl', requireHttps);

  const pages = { ...DEFAULT_PAGES, ...overrides };
  const resolved = Object.fromEntries(
    Object.entries(pages).map(([name, path]) => {
      const url = new URL(path, base);
      validatePageUrl(url, `pages.${name}`, requireHttps);
      return [name, url.toString()];
    })
  ) as Record<keyof AuthPages, string>;

  return (page, query) => {
    const url = new URL(resolved[page]);
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  };
}

export function resolveEndpoints(
  endpoints: Partial<AuthEndpoints> | undefined
): AuthEndpoints {
  return { ...DEFAULT_ENDPOINTS, ...endpoints };
}
