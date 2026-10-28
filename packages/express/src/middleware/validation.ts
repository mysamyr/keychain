import { parseInput, UnsupportedMediaTypeError } from '@mysamyr/core';
import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod/v4';

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.is('application/json')) {
      next(new UnsupportedMediaTypeError());
      return;
    }
    try {
      req.body = parseInput(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
