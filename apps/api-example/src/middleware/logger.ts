import type { NextFunction, Request, Response } from 'express';

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl.split('?', 1)[0]} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}
