export { createAuthRouter } from './router.js';
export type { AuthRouterOptions } from './options.js';
export type { AuthPages } from '@mysamyr/core/endpoints';
export { DEFAULT_PAGES } from '@mysamyr/core/endpoints';
export type { CookieOptions } from './cookies.js';
export { authenticate, getAuth, requireAuth } from './middleware/session.js';
export type {
  AuthenticateOptions,
  AuthIdentity,
} from './middleware/session.js';
export {
  createRateLimitMiddleware,
  InMemoryRateLimitStore,
} from './middleware/rate-limit.js';
export type {
  RateLimitDecision,
  RateLimitStore,
} from './middleware/rate-limit.js';
