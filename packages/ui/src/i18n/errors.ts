import { AuthApiError } from '@mysamyr/react';

import type { MessageKey, Messages } from './en.js';

export const errorMessages = new Map<string, MessageKey>([
  ['USER_ALREADY_EXISTS', 'errorUserExists'],
  ['INVALID_CREDENTIALS', 'errorCredentials'],
  ['REAUTHENTICATION_REQUIRED', 'errorReauthentication'],
  ['REAUTHENTICATION_COOLDOWN', 'errorReauthenticationCooldown'],
  ['SESSION_EXPIRED', 'errorSessionExpired'],
  ['TOKEN_INVALID', 'errorTokenInvalid'],
  ['USER_NOT_FOUND', 'errorUserNotFound'],
  ['EMAIL_NOT_VERIFIED', 'errorEmailNotVerified'],
  ['NOT_AUTHENTICATED', 'errorNotAuthenticated'],
  ['OAUTH_NOT_CONFIGURED', 'errorOAuthNotConfigured'],
  ['MISSING_AUTHORIZATION_CODE', 'errorMissingAuthorizationCode'],
  ['VALIDATION_ERROR', 'errorValidation'],
  ['PASSWORD_REQUIRED', 'errorPasswordRequired'],
  ['EMAIL_CHANGE_CONFLICT', 'errorEmailChangeConflict'],
  ['EMAIL_CHANGE_PENDING', 'errorEmailChangePending'],
  ['RATE_LIMITED', 'errorRateLimited'],
  ['SERVICE_UNAVAILABLE', 'errorServiceUnavailable'],
  ['NETWORK_ERROR', 'errorNetwork'],
  ['TIMEOUT', 'errorNetwork'],
  ['INTERNAL_ERROR', 'errorGeneric'],
  ['UNKNOWN_ERROR', 'errorGeneric'],
]);

export function translateError(error: unknown, messages: Messages): string {
  const key =
    error instanceof AuthApiError ? errorMessages.get(error.code) : undefined;
  return messages[key ?? 'errorGeneric'];
}

export function translateFieldError(
  error: unknown,
  field: string,
  messages: Messages
): string | undefined {
  if (error instanceof AuthApiError && error.fieldErrors?.[field]?.length) {
    return messages.invalidField;
  }
  return undefined;
}
