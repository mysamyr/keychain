import type { AuthCore } from '@mysamyr/core';
import type { AuthEndpoints } from '@mysamyr/core/endpoints';
import type { Request, RequestHandler } from 'express';

import type { Cookies } from './cookies.js';
import type { PageUrls } from './options.js';

/** A request whose JSON body was validated by `validateBody`. */
export type JsonRequest<T> = Request<Record<string, string>, unknown, T>;

export interface RouteContext {
  authCore: AuthCore;
  endpoints: AuthEndpoints;
  cookies: Cookies;
  pageUrl: PageUrls;
  rateLimit: (
    scope: string,
    limits: { account?: number; ip: number; windowMs: number }
  ) => RequestHandler;
}
