import { z, type ZodType } from 'zod/v4';

import { type FieldErrors, ValidationError } from './errors.js';

export function parseInput<S extends ZodType>(
  schema: S,
  input: unknown
): z.output<S> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    throw new ValidationError(
      fieldErrors as FieldErrors,
      formErrors[0] ?? 'Validation error'
    );
  }
  return parsed.data;
}
