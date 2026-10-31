/**
 * Centralized API route endpoint configuration.
 *
 * AuthEndpoints defines the relative path segments for every auth API route
 * (relative to the auth router mount point). Parameterized segments use
 * Express colon syntax (e.g. `/sessions/:id`).
 *
 * Use DEFAULT_ENDPOINTS for the built-in defaults and compilePath to resolve
 * parameterized paths before making HTTP requests.
 */

export interface AuthEndpoints {
  /** POST – create a new user account */
  signUp: string;
  /** POST – authenticate with email + password */
  signIn: string;
  /** POST – destroy the current session */
  signOut: string;
  /** POST – verify email address with a one-time code */
  verifyEmail: string;
  /** POST – resend the email verification code */
  resendVerification: string;
  /** POST – request a password-reset email */
  forgotPassword: string;
  /** POST – set a new password using a reset token */
  resetPassword: string;
  /** POST – check a reset token without consuming it */
  verifyResetToken: string;
  /** GET / PATCH / DELETE – current user profile */
  me: string;
  /** POST – set a first password or change an existing password */
  changePassword: string;
  /** DELETE – unlink Google (requires a password login method) */
  unlinkGoogle: string;
  /** POST – atomically confirm an email change with `{ token }` */
  confirmEmailChange: string;
  /** DELETE – cancel the matching pending email change */
  cancelEmailChange: string;
  /** GET – list all active sessions for the current user */
  getSessions: string;
  /** DELETE – revoke a specific session by id (`:id` param) */
  revokeSession: string;
  /** POST – revoke all sessions except the current one */
  revokeOtherSessions: string;
  /** GET – redirect to Google OAuth consent screen */
  googleOAuth: string;
  /** POST – confirm the password and get the Google URL for linking it as a login method */
  googleOAuthLink: string;
  /** POST – email a code for a sensitive action */
  requestReauthentication: string;
  /** POST – verify a sensitive-action code */
  verifyReauthentication: string;
  /** GET – handle the OAuth redirect-back from Google */
  googleOAuthCallback: string;
}

/**
 * Default route segments used by both `@mysamyr/express` (as Express route
 * patterns) and `@mysamyr/client` (appended to the auth base path).
 */
export const DEFAULT_ENDPOINTS: AuthEndpoints = {
  signUp: '/sign-up',
  signIn: '/sign-in',
  signOut: '/sign-out',
  verifyEmail: '/verify-email',
  resendVerification: '/resend-verification',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyResetToken: '/verify-reset-token',
  me: '/me',
  changePassword: '/me/change-password',
  unlinkGoogle: '/me/google',
  confirmEmailChange: '/me/confirm-email-change',
  cancelEmailChange: '/me/email-change',
  getSessions: '/sessions',
  revokeSession: '/sessions/:id',
  revokeOtherSessions: '/sessions/revoke-others',
  googleOAuth: '/oauth/google',
  googleOAuthLink: '/oauth/google/link',
  requestReauthentication: '/me/reauthentication',
  verifyReauthentication: '/me/reauthentication/verify',
  googleOAuthCallback: '/oauth/google/callback',
};

/**
 * Frontend page paths. The server builds email links and OAuth redirects from
 * them (relative to `appUrl`); the UI uses them for navigation links.
 */
export interface AuthPages {
  signIn: string;
  signUp: string;
  profile: string;
  afterSignIn: string;
  verifyEmail: string;
  forgotPassword: string;
  resetPassword: string;
  confirmEmailChange: string;
}

export const DEFAULT_PAGES: AuthPages = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  profile: '/profile',
  afterSignIn: '/',
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  confirmEmailChange: '/confirm-email-change',
};

/**
 * Replace every `:param` placeholder in `path` with the matching value from
 * `params`.
 *
 * @example
 * compilePath('/sessions/:id', { id: 'abc123' })
 * // → '/sessions/abc123'
 */
export function compilePath(
  path: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(`:${key}`, String(value)),
    path
  );
}
