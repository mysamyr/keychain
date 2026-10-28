import type {
  UserDTO,
  SessionDTO,
  LoginDTO,
  RegisterDTO,
  VerifyEmailDTO,
  ResendVerificationDTO,
  ChangePasswordDTO,
  ConfirmEmailChangeDTO,
  UpdateProfileDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  VerifyResetTokenDTO,
  AuthResponseDTO,
  RegisterResponseDTO,
  SensitiveActionDTO,
  ReauthenticationDTO,
  ReauthenticationAction,
  VerifyReauthenticationDTO,
} from '@mysamyr/core/schemas';

export type {
  UserDTO,
  SessionDTO,
  LoginDTO,
  RegisterDTO,
  VerifyEmailDTO,
  ResendVerificationDTO,
  ChangePasswordDTO,
  ConfirmEmailChangeDTO,
  UpdateProfileDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  VerifyResetTokenDTO,
  AuthResponseDTO,
  RegisterResponseDTO,
  SensitiveActionDTO,
  ReauthenticationDTO,
  ReauthenticationAction,
  VerifyReauthenticationDTO,
};

/**
 * A failed API call. `statusCode` is `0` for transport failures, with `code`
 * `NETWORK_ERROR` or `TIMEOUT`; otherwise `code` is the server's error code.
 */
export class AuthApiError extends Error {
  public readonly code: string;
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    public readonly statusCode: number,
    message: string,
    code: string = 'UNKNOWN_ERROR',
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
