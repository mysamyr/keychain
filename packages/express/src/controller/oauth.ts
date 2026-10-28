import { createHash, randomBytes } from 'node:crypto';

import {
  AuthError,
  LINK_AUTHORIZATION_TTL_MS,
  MissingAuthorizationCodeError,
  NotAuthenticatedError,
  OAuthNotConfiguredError,
  OAuthStateInvalidError,
  type OAuthManager,
} from '@mysamyr/core';
import {
  confirmPasswordSchema,
  type ConfirmPasswordDTO,
} from '@mysamyr/core/schemas';
import type { Request, Response, Router } from 'express';

import type { JsonRequest, RouteContext } from '../context.js';
import type { Cookies } from '../cookies.js';
import { getAuth, requireAuth } from '../middleware/session.js';
import { validateBody } from '../middleware/validation.js';
import { requestMetadata, resolveRequestLocale } from '../utils.js';

const STATE_TTL_MS = 10 * 60_000;
const VERIFIER_PATTERN = /^[A-Za-z0-9_-]{43}$/;

interface Callback {
  code: string;
  codeVerifier: string;
  locale: string;
  isLink: boolean;
}

function readCallback(req: Request, cookies: Cookies): Callback {
  const state = req.query['state'];
  if (typeof state !== 'string' || state !== cookies.read(req, 'oauthState')) {
    throw new OAuthStateInvalidError();
  }
  const code = req.query['code'];
  if (typeof code !== 'string' || !code) {
    throw new MissingAuthorizationCodeError();
  }
  const codeVerifier = cookies.read(req, 'oauthVerifier');
  if (!codeVerifier || !VERIFIER_PATTERN.test(codeVerifier)) {
    throw new OAuthStateInvalidError();
  }
  const [, stateLocale, mode] = state.split('.');
  return {
    code,
    codeVerifier,
    locale:
      stateLocale === 'en' || stateLocale === 'uk'
        ? stateLocale
        : resolveRequestLocale(req),
    isLink: mode === 'link',
  };
}

function startAuthorization(
  req: Request,
  res: Response,
  cookies: Cookies,
  oauth: OAuthManager,
  mode?: 'link'
): string {
  const state = [
    randomBytes(16).toString('hex'),
    resolveRequestLocale(req),
    ...(mode ? [mode] : []),
  ].join('.');
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  cookies.set(res, 'oauthState', state, STATE_TTL_MS);
  cookies.set(res, 'oauthVerifier', codeVerifier, STATE_TTL_MS);
  return oauth.getGoogleAuthUrl(state, codeChallenge);
}

function errorQuery(error: unknown, isLink: boolean): string {
  const code = error instanceof AuthError ? error.code : undefined;
  if (code === 'OAUTH_ACCOUNT_LINK_REQUIRED') return 'google_link_required';
  if (code === 'OAUTH_EMAIL_MISMATCH') return 'oauth_email_mismatch';
  return isLink ? 'google_link_failed' : 'oauth_failed';
}

export function registerOAuthRoutes(router: Router, ctx: RouteContext): void {
  const { authCore, endpoints, cookies, pageUrl, rateLimit } = ctx;
  const logger = authCore.logger;

  router.get(endpoints.googleOAuth, (req: Request, res: Response) => {
    if (!authCore.oauth) {
      res.redirect(302, pageUrl('signIn', { error: 'oauth_not_configured' }));
      return;
    }
    res.redirect(302, startAuthorization(req, res, cookies, authCore.oauth));
  });

  router.post(
    endpoints.googleOAuthLink,
    requireAuth,
    rateLimit('link-google', { account: 5, ip: 15, windowMs: 15 * 60_000 }),
    validateBody(confirmPasswordSchema),
    async (req: JsonRequest<ConfirmPasswordDTO>, res: Response) => {
      if (!authCore.oauth) throw new OAuthNotConfiguredError();
      const { userId, sessionId } = getAuth(req);
      const token = await authCore.reauthentication.issuePasswordAuthorization(
        userId,
        sessionId,
        'link-google',
        req.body.password
      );
      const url = startAuthorization(req, res, cookies, authCore.oauth, 'link');
      cookies.set(res, 'oauthLinkUser', userId, STATE_TTL_MS);
      cookies.set(res, 'reauthentication', token, LINK_AUTHORIZATION_TTL_MS);
      res.json({ url });
    }
  );

  router.get(
    endpoints.googleOAuthCallback,
    async (req: Request, res: Response) => {
      const oauth = authCore.oauth;
      if (!oauth) {
        res.redirect(302, pageUrl('signIn', { error: 'oauth_not_configured' }));
        return;
      }

      const linkUser = cookies.read(req, 'oauthLinkUser');
      const reauthenticationToken = cookies.read(req, 'reauthentication');
      const rawState = req.query['state'];
      let isLink = typeof rawState === 'string' && rawState.endsWith('.link');
      cookies.clear(
        res,
        'oauthState',
        'oauthVerifier',
        'oauthLinkUser',
        'reauthentication'
      );

      try {
        const callback = readCallback(req, cookies);
        isLink = callback.isLink;

        if (isLink) {
          if (!req.keychain) throw new NotAuthenticatedError();
          const { userId, sessionId } = req.keychain;
          if (linkUser !== userId) throw new OAuthStateInvalidError();
          await oauth.linkGoogleAccount(
            userId,
            callback.code,
            callback.codeVerifier,
            { sessionId, reauthenticationToken },
            callback.locale
          );
          res.redirect(302, pageUrl('profile', { google_linked: 'true' }));
          return;
        }

        const { userAgent, ip } = requestMetadata(req);
        const result = await oauth.handleGoogleCallback(
          callback.code,
          userAgent,
          ip,
          callback.codeVerifier
        );
        cookies.setSession(res, result.sessionToken, result.expiresAt);
        res.redirect(302, pageUrl('afterSignIn'));
      } catch (error) {
        const meta = { flow: isLink ? 'link' : 'sign-in', error };
        if (error instanceof AuthError && error.statusCode < 500) {
          logger.warn('Google OAuth callback rejected', meta);
        } else {
          logger.error('Google OAuth callback failed', meta);
        }
        res.redirect(
          302,
          pageUrl(isLink ? 'profile' : 'signIn', {
            error: errorQuery(error, isLink),
          })
        );
      }
    }
  );
}
