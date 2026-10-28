import { AuthError, type ApiErrorDTO, type AuthLogger } from '@mysamyr/core';
import type { NextFunction, Request, Response } from 'express';

/** Serializes every error raised under the auth router as `{ code, message, fieldErrors? }`. */
export function createErrorHandler(logger: AuthLogger) {
  return function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (res.headersSent) {
      next(err);
      return;
    }

    const meta = {
      method: req.method,
      path: req.originalUrl.split('?', 1)[0],
      error: err,
    };
    if (err instanceof AuthError) {
      if (err.statusCode >= 500) logger.error('Auth request failed', meta);
      else logger.debug('Auth request rejected', meta);
      res.status(err.statusCode).json(err.toJSON());
      return;
    }

    logger.error('Unhandled auth request error', meta);
    const response: ApiErrorDTO = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };
    res.status(500).json(response);
  };
}
