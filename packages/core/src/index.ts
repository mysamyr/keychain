export { AuthCore } from './AuthCore.js';

export type {
  IDatabaseAdapter,
  Session,
  User,
  ReauthenticationGrant,
  ConsumeReauthenticationGrant,
  ConsumeEmailChangeToken,
  OutboxEmail,
  OutboxEmailStatus,
  NewOutboxEmail,
  ClaimOutboxEmails,
  FailOutboxEmail,
  DeleteExpiredRecords,
  DeletedRecords,
} from './interfaces/adapter-db.js';
export type {
  EmailContext,
  EmailEvent,
  EmailMessage,
  EmailNotification,
  IEmailAdapter,
} from './interfaces/adapter-email.js';

export type { AuthConfig, DeliveryConfig } from './config/types.js';

export type { AuthLogger, LogMeta } from './observability/logger.js';
export { consoleLogger, redact } from './observability/logger.js';
export type {
  AuthEvent,
  AuthEventHandler,
  AuthEventPayload,
} from './observability/events.js';
export type { AuthEvents } from './observability/events.js';
export type { EmailDispatcher } from './delivery/EmailDispatcher.js';
export type { MaintenanceService } from './services/MaintenanceService.js';

export type {
  CreatedSession,
  SessionManager,
} from './managers/SessionManager.js';
export type { OAuthManager, OAuthResult } from './managers/OAuthManager.js';
export type { ReauthenticationManager } from './managers/ReauthenticationManager.js';
export type { RegisterService } from './services/RegisterService.js';
export type { LoginService } from './services/LoginService.js';
export type { ProfileService } from './services/ProfileService.js';
export type { PasswordResetService } from './services/PasswordResetService.js';
export type {
  SensitiveAction,
  SensitiveActionAuthorization,
} from './managers/ReauthenticationManager.js';
export {
  REAUTHENTICATION_CHALLENGE_TTL_MS,
  REAUTHENTICATION_GRANT_TTL_MS,
  LINK_AUTHORIZATION_TTL_MS,
} from './managers/ReauthenticationManager.js';
export type { LoginMetadata, LoginResult } from './services/LoginService.js';

export type { ApiErrorDTO, FieldErrors } from './utils/errors.js';
export {
  AuthError,
  ValidationError,
  UniqueConstraintError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  SessionExpiredError,
  SessionNotFoundError,
  TokenInvalidError,
  UserNotFoundError,
  EmailNotVerifiedError,
  NotAuthenticatedError,
  PasswordRequiredError,
  ReauthenticationRequiredError,
  ReauthenticationCooldownError,
  OAuthNotConfiguredError,
  MissingAuthorizationCodeError,
  OAuthStateInvalidError,
  OAuthAccountLinkRequiredError,
  OAuthEmailMismatchError,
  OAuthAccountMismatchError,
  OAuthProviderError,
  RateLimitedError,
  CsrfOriginRejectedError,
  UnsupportedMediaTypeError,
  ServiceUnavailableError,
} from './utils/errors.js';
export { parseInput } from './utils/validation.js';
