import {
  REAUTHENTICATION_CHALLENGE_TTL_MS,
  REAUTHENTICATION_GRANT_TTL_MS,
  type AuthCore,
  type User,
} from '@mysamyr/core';
import {
  changePasswordSchema,
  confirmEmailChangeSchema,
  confirmPasswordSchema,
  reauthenticationSchema,
  sensitiveActionSchema,
  updateProfileSchema,
  verifyReauthenticationSchema,
  type ChangePasswordDTO,
  type ConfirmEmailChangeDTO,
  type ConfirmPasswordDTO,
  type ReauthenticationDTO,
  type SensitiveActionDTO,
  type UpdateProfileDTO,
  type UserDTO,
  type VerifyReauthenticationDTO,
} from '@mysamyr/core/schemas';
import type { Request, Response, Router } from 'express';

import type { JsonRequest, RouteContext } from '../context.js';
import { getAuth, requireAuth } from '../middleware/session.js';
import { validateBody } from '../middleware/validation.js';
import { resolveRequestLocale } from '../utils.js';

const MINUTE = 60_000;

export function toUserDTO(authCore: AuthCore, user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    hasPassword: !!user.passwordHash,
    hasGoogleAccount: !!user.googleId,
    canLinkGoogle: !!authCore.oauth,
    pendingEmail: user.pendingEmail ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function registerMeRoutes(router: Router, ctx: RouteContext): void {
  const { authCore, endpoints, cookies, pageUrl, rateLimit } = ctx;

  router.get(endpoints.me, requireAuth, async (req: Request, res: Response) => {
    const user = await authCore.profile.getProfile(getAuth(req).userId);
    res.status(200).json(toUserDTO(authCore, user));
  });

  router.patch(
    endpoints.me,
    requireAuth,
    rateLimit('email-change', { account: 5, ip: 15, windowMs: 15 * MINUTE }),
    validateBody(updateProfileSchema),
    async (req: JsonRequest<UpdateProfileDTO>, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      let user = await authCore.profile.getProfile(userId);
      if (req.body.email && req.body.email !== user.email) {
        user = await authCore.profile.initiateEmailChange(
          userId,
          req.body.email,
          pageUrl('confirmEmailChange'),
          { sessionId, password: req.body.password },
          resolveRequestLocale(req)
        );
      }
      res.status(200).json(toUserDTO(authCore, user));
    }
  );

  router.post(
    endpoints.confirmEmailChange,
    rateLimit('confirm-email-change', {
      account: 10,
      ip: 30,
      windowMs: 15 * MINUTE,
    }),
    validateBody(confirmEmailChangeSchema),
    async (req: JsonRequest<ConfirmEmailChangeDTO>, res: Response) => {
      await authCore.profile.confirmEmailChange(
        req.body.token,
        resolveRequestLocale(req)
      );
      cookies.clear(res, 'session', 'reauthentication');
      res.sendStatus(204);
    }
  );

  router.post(
    endpoints.changePassword,
    requireAuth,
    rateLimit('change-password', { account: 5, ip: 20, windowMs: 15 * MINUTE }),
    validateBody(changePasswordSchema),
    async (req: JsonRequest<ChangePasswordDTO>, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      await authCore.profile.changePassword(
        userId,
        req.body.newPassword,
        {
          sessionId,
          password: req.body.oldPassword,
          reauthenticationToken: cookies.read(req, 'reauthentication'),
        },
        resolveRequestLocale(req)
      );
      cookies.clear(res, 'session', 'reauthentication');
      res.sendStatus(204);
    }
  );

  router.delete(
    endpoints.unlinkGoogle,
    requireAuth,
    rateLimit('unlink-google', { account: 5, ip: 20, windowMs: 15 * MINUTE }),
    validateBody(confirmPasswordSchema),
    async (req: JsonRequest<ConfirmPasswordDTO>, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      await authCore.profile.unlinkGoogle(
        userId,
        { sessionId, password: req.body.password },
        resolveRequestLocale(req)
      );
      cookies.clear(res, 'session', 'reauthentication');
      res.sendStatus(204);
    }
  );

  router.delete(
    endpoints.me,
    requireAuth,
    rateLimit('delete-account', { account: 5, ip: 20, windowMs: 15 * MINUTE }),
    validateBody(sensitiveActionSchema),
    async (req: JsonRequest<SensitiveActionDTO>, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      await authCore.profile.deleteAccount(
        userId,
        {
          sessionId,
          password: req.body.password,
          reauthenticationToken: cookies.read(req, 'reauthentication'),
        },
        resolveRequestLocale(req)
      );
      cookies.clear(res, 'session', 'reauthentication');
      res.sendStatus(204);
    }
  );

  router.post(
    endpoints.requestReauthentication,
    requireAuth,
    rateLimit('request-reauthentication', {
      account: 5,
      ip: 15,
      windowMs: 15 * MINUTE,
    }),
    validateBody(reauthenticationSchema),
    async (req: JsonRequest<ReauthenticationDTO>, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      const token = await authCore.reauthentication.request(
        userId,
        sessionId,
        req.body.action,
        resolveRequestLocale(req)
      );
      cookies.clear(res, 'reauthentication');
      cookies.set(
        res,
        'reauthenticationChallenge',
        token,
        REAUTHENTICATION_CHALLENGE_TTL_MS
      );
      res.sendStatus(204);
    }
  );

  router.post(
    endpoints.verifyReauthentication,
    requireAuth,
    rateLimit('verify-reauthentication', {
      account: 5,
      ip: 20,
      windowMs: 15 * MINUTE,
    }),
    validateBody(verifyReauthenticationSchema),
    async (req: JsonRequest<VerifyReauthenticationDTO>, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      const token = await authCore.reauthentication.verify(
        userId,
        sessionId,
        req.body.action,
        cookies.read(req, 'reauthenticationChallenge') ?? '',
        req.body.code
      );
      cookies.clear(res, 'reauthenticationChallenge');
      cookies.set(
        res,
        'reauthentication',
        token,
        REAUTHENTICATION_GRANT_TTL_MS
      );
      res.sendStatus(204);
    }
  );
}
