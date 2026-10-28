import type { NextFunction, Request, Response } from 'express';

export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res
    .status(404)
    .json({ error: 'Not Found', path: req.originalUrl.split('?', 1)[0] });
}
