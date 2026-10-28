import { SessionNotFoundError } from '@mysamyr/core';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyResetTokenSchema,
  type AuthResponseDTO,
  type ForgotPasswordDTO,
  type LoginDTO,
  type RegisterDTO,
  type RegisterResponseDTO,
  type ResendVerificationDTO,
  type ResetPasswordDTO,
  type VerifyEmailDTO,
  type VerifyResetTokenDTO,
} from '@mysamyr/core/schemas';
import type { Request, Response, Router } from 'express';

import type { JsonRequest, RouteContext } from '../context.js';
import { validateBody } from '../middleware/validation.js';
import { requestMetadata, resolveRequestLocale } from '../utils.js';

const MINUTE = 60_000;

export function registerAuthRoutes(router: Router, ctx: RouteContext): void {
  const { authCore, endpoints, cookies, pageUrl, rateLimit } = ctx;

  router.post(
    endpoints.signUp,
    rateLimit('sign-up', { account: 3, ip: 10, windowMs: 60 * MINUTE }),
    validateBody(registerSchema),
    async (req: JsonRequest<RegisterDTO>, res: Response) => {
      const user = await authCore.register.execute(
        req.body,
        pageUrl('verifyEmail'),
        resolveRequestLocale(req)
      );
      const response: RegisterResponseDTO = { id: user.id, email: user.email };
      res.status(201).json(response);
    }
  );

  router.post(
    endpoints.signIn,
    rateLimit('sign-in', { account: 10, ip: 30, windowMs: 15 * MINUTE }),
    validateBody(loginSchema),
    async (req: JsonRequest<LoginDTO>, res: Response) => {
      const result = await authCore.login.execute(
        req.body,
        requestMetadata(req)
      );
      cookies.setSession(res, result.sessionToken, result.expiresAt);
      const response: AuthResponseDTO = {
        id: result.user.id,
        email: result.user.email,
        isEmailVerified: result.user.isEmailVerified,
      };
      res.status(200).json(response);
    }
  );

  router.post(endpoints.signOut, async (req: Request, res: Response) => {
    if (req.keychain) {
      const { userId, sessionId } = req.keychain;
      try {
        await authCore.session.revokeUserSession(userId, sessionId);
      } catch (error) {
        if (!(error instanceof SessionNotFoundError)) throw error;
      }
    }
    cookies.clear(
      res,
      'session',
      'reauthentication',
      'reauthenticationChallenge'
    );
    res.sendStatus(204);
  });

  router.post(
    endpoints.verifyEmail,
    rateLimit('verify-email', { account: 10, ip: 30, windowMs: 15 * MINUTE }),
    validateBody(verifyEmailSchema),
    async (req: JsonRequest<VerifyEmailDTO>, res: Response) => {
      const user = await authCore.profile.verifyEmail(req.body.token);
      const response: AuthResponseDTO = {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      };
      res.status(200).json(response);
    }
  );

  router.post(
    endpoints.resendVerification,
    rateLimit('resend-verification', {
      account: 3,
      ip: 10,
      windowMs: 60 * MINUTE,
    }),
    validateBody(resendVerificationSchema),
    async (req: JsonRequest<ResendVerificationDTO>, res: Response) => {
      await authCore.register.resend(
        req.body,
        pageUrl('verifyEmail'),
        resolveRequestLocale(req)
      );
      res.sendStatus(204);
    }
  );

  router.post(
    endpoints.forgotPassword,
    rateLimit('forgot-password', { account: 3, ip: 10, windowMs: 60 * MINUTE }),
    validateBody(forgotPasswordSchema),
    async (req: JsonRequest<ForgotPasswordDTO>, res: Response) => {
      await authCore.passwordReset.request(
        req.body,
        pageUrl('resetPassword'),
        resolveRequestLocale(req)
      );
      res.sendStatus(204);
    }
  );

  router.post(
    endpoints.verifyResetToken,
    rateLimit('verify-reset-token', {
      account: 10,
      ip: 30,
      windowMs: 15 * MINUTE,
    }),
    validateBody(verifyResetTokenSchema),
    async (req: JsonRequest<VerifyResetTokenDTO>, res: Response) => {
      await authCore.passwordReset.validateToken(req.body.token);
      res.sendStatus(204);
    }
  );

  router.post(
    endpoints.resetPassword,
    rateLimit('reset-password', { account: 8, ip: 30, windowMs: 15 * MINUTE }),
    validateBody(resetPasswordSchema),
    async (req: JsonRequest<ResetPasswordDTO>, res: Response) => {
      await authCore.passwordReset.reset(req.body, resolveRequestLocale(req));
      res.sendStatus(204);
    }
  );
}
