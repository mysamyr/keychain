import {
  NotAuthenticatedError,
  SessionExpiredError,
  type AuthCore,
} from '@mysamyr/core';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

import { createCookies, type CookieOptions, type Cookies } from '../cookies.js';

export interface AuthIdentity {
  userId: string;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by `authenticate` (or the auth router) for a valid session cookie. */
      keychain?: AuthIdentity;
    }
  }
}

export interface AuthenticateOptions {
  /** Must match the `cookies` options passed to `createAuthRouter`. */
  cookies?: Partial<CookieOptions>;
}

const resolved = new WeakSet<Request>();

/** Only an expired/unknown session clears the cookie; storage failures propagate. */
export function createSessionMiddleware(
  authCore: AuthCore,
  cookies: Cookies
): RequestHandler {
  return async function sessionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (resolved.has(req)) {
      next();
      return;
    }
    resolved.add(req);

    const sessionToken = cookies.read(req, 'session');
    if (!sessionToken) {
      next();
      return;
    }

    try {
      const session = await authCore.session.validate(sessionToken);
      req.keychain = { userId: session.userId, sessionId: session.id };
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) {
        next(error);
        return;
      }
      cookies.clear(res, 'session');
    }
    next();
  };
}

/** Resolve the session cookie into `req.keychain` for every request. */
export function authenticate(
  authCore: AuthCore,
  options: AuthenticateOptions = {}
): RequestHandler {
  return createSessionMiddleware(authCore, createCookies(options.cookies));
}

/** Reject requests without a valid session with 401 `NOT_AUTHENTICATED`. */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(req.keychain ? undefined : new NotAuthenticatedError());
}

/** The authenticated identity; call only after `requireAuth`. */
export function getAuth(req: Request): AuthIdentity {
  if (!req.keychain) throw new NotAuthenticatedError();
  return req.keychain;
}
