import type { AuthCore } from '@mysamyr/core';
import { json, Router } from 'express';

import type { RouteContext } from './context.js';
import { registerAuthRoutes } from './controller/auth.js';
import { registerMeRoutes } from './controller/me.js';
import { registerOAuthRoutes } from './controller/oauth.js';
import { registerSessionRoutes } from './controller/session.js';
import { createCookies } from './cookies.js';
import { createCsrfMiddleware } from './middleware/csrf.js';
import { createErrorHandler } from './middleware/error-handler.js';
import {
  createRateLimitMiddleware,
  InMemoryRateLimitStore,
} from './middleware/rate-limit.js';
import { createSessionMiddleware } from './middleware/session.js';
import {
  createPageUrls,
  resolveEndpoints,
  type AuthRouterOptions,
} from './options.js';

export function createAuthRouter(
  authCore: AuthCore,
  options: AuthRouterOptions
): Router {
  const cookies = createCookies(options.cookies);
  const pageUrl = createPageUrls(options.appUrl, options.pages, cookies.secure);
  const rateLimitStore = options.rateLimitStore ?? new InMemoryRateLimitStore();

  const ctx: RouteContext = {
    authCore,
    endpoints: resolveEndpoints(options.endpoints),
    cookies,
    pageUrl,
    rateLimit: (scope, limits) =>
      createRateLimitMiddleware(rateLimitStore, scope, limits),
  };

  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(
    createCsrfMiddleware(
      options.trustedOrigins ?? [new URL(options.appUrl).origin],
      cookies.secure
    )
  );
  router.use(json());
  router.use(createSessionMiddleware(authCore, cookies));

  registerAuthRoutes(router, ctx);
  registerMeRoutes(router, ctx);
  registerSessionRoutes(router, ctx);
  registerOAuthRoutes(router, ctx);

  router.use(createErrorHandler(authCore.logger));
  return router;
}
