export type FieldErrors = Record<string, string[]>;

export interface ApiErrorDTO {
  code: string;
  message: string;
  fieldErrors?: FieldErrors;
}

export class AuthError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }

  toJSON(): ApiErrorDTO {
    return { code: this.code, message: this.message };
  }
}

export class ValidationError extends AuthError {
  public readonly fieldErrors: FieldErrors | undefined;

  constructor(fieldErrors?: FieldErrors, message: string = 'Validation error') {
    super(message, 400, 'VALIDATION_ERROR');
    this.fieldErrors = fieldErrors;
  }

  override toJSON(): ApiErrorDTO {
    return {
      ...super.toJSON(),
      ...(this.fieldErrors && { fieldErrors: this.fieldErrors }),
    };
  }
}

/** Thrown by database adapters when a write violates a unique constraint. */
export class UniqueConstraintError extends AuthError {
  constructor(public readonly field: string) {
    super('Resource already exists', 409, 'CONFLICT');
  }
}

export class UserAlreadyExistsError extends AuthError {
  constructor() {
    super('User with this email already exists', 409, 'USER_ALREADY_EXISTS');
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
}

export class SessionExpiredError extends AuthError {
  constructor() {
    super('Session has expired', 401, 'SESSION_EXPIRED');
  }
}

export class SessionNotFoundError extends AuthError {
  constructor() {
    super('Session not found', 404, 'SESSION_NOT_FOUND');
  }
}

export class TokenInvalidError extends AuthError {
  constructor() {
    super('Token is invalid or has expired', 400, 'TOKEN_INVALID');
  }
}

export class UserNotFoundError extends AuthError {
  constructor() {
    super('User not found', 404, 'USER_NOT_FOUND');
  }
}

export class EmailNotVerifiedError extends AuthError {
  constructor() {
    super('Email address has not been verified', 403, 'EMAIL_NOT_VERIFIED');
  }
}

export class NotAuthenticatedError extends AuthError {
  constructor() {
    super('Not authenticated', 401, 'NOT_AUTHENTICATED');
  }
}

export class PasswordRequiredError extends AuthError {
  constructor() {
    super('Set a password before this action', 409, 'PASSWORD_REQUIRED');
  }
}

export class ReauthenticationRequiredError extends AuthError {
  constructor(message: string = 'Fresh authentication required') {
    super(message, 403, 'REAUTHENTICATION_REQUIRED');
  }
}

export class ReauthenticationCooldownError extends AuthError {
  constructor() {
    super(
      'Wait one minute before requesting another code',
      429,
      'REAUTHENTICATION_COOLDOWN'
    );
  }
}

export class OAuthNotConfiguredError extends AuthError {
  constructor(provider: string = 'Google') {
    super(`${provider} OAuth is not configured`, 404, 'OAUTH_NOT_CONFIGURED');
  }
}

export class MissingAuthorizationCodeError extends AuthError {
  constructor() {
    super('Missing authorization code', 400, 'MISSING_AUTHORIZATION_CODE');
  }
}

export class OAuthStateInvalidError extends AuthError {
  constructor() {
    super('Invalid OAuth state', 400, 'OAUTH_STATE_INVALID');
  }
}

export class OAuthAccountLinkRequiredError extends AuthError {
  constructor() {
    super(
      'Sign in to the existing account and link Google from profile settings',
      409,
      'OAUTH_ACCOUNT_LINK_REQUIRED'
    );
  }
}

export class OAuthEmailMismatchError extends AuthError {
  constructor() {
    super('Google account email does not match', 403, 'OAUTH_EMAIL_MISMATCH');
  }
}

export class OAuthAccountMismatchError extends AuthError {
  constructor() {
    super(
      'Google account is already linked to another account',
      409,
      'OAUTH_ACCOUNT_MISMATCH'
    );
  }
}

export class OAuthProviderError extends AuthError {
  constructor(
    message: string,
    code: 'OAUTH_PROVIDER_ERROR' | 'OAUTH_PROVIDER_INVALID_RESPONSE'
  ) {
    super(message, 502, code);
  }
}

export class RateLimitedError extends AuthError {
  constructor() {
    super('Too many requests. Try again later.', 429, 'RATE_LIMITED');
  }
}

export class CsrfOriginRejectedError extends AuthError {
  constructor() {
    super('Request origin rejected', 403, 'CSRF_ORIGIN_REJECTED');
  }
}

export class UnsupportedMediaTypeError extends AuthError {
  constructor() {
    super(
      'Content-Type must be application/json',
      415,
      'UNSUPPORTED_MEDIA_TYPE'
    );
  }
}

export class ServiceUnavailableError extends AuthError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}
