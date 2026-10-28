import { AuthError } from '@mysamyr/core';
import type { NextFunction, Request, Response } from 'express';

import { IS_PRODUCTION } from '../config/index.js';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ code: err.code, message: err.message });
    return;
  }

  const requestPath = req.originalUrl.split('?', 1)[0];
  console.error(`[ERROR] ${req.method} ${requestPath}:`, err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    code: 'INTERNAL_ERROR',
    message: IS_PRODUCTION ? 'Internal server error' : err.message,
  });
}
