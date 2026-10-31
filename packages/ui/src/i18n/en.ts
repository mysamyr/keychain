export const en = {
  language: 'Language',
  signIn: 'Sign in',
  signUp: 'Sign up',
  signOut: 'Sign out',
  signInSubtitle: 'Welcome back! Please sign in to continue.',
  createAccount: 'Create an account',
  signUpSubtitle: 'Enter your details to get started.',
  continueWithGoogle: 'Continue with Google',
  or: 'or',
  email: 'Email address',
  emailPlaceholder: 'Enter your email',
  password: 'Password',
  passwordPlaceholder: 'Enter your password',
  createPassword: 'Create a password',
  confirmPassword: 'Confirm password',
  confirmPasswordPlaceholder: 'Confirm your password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot password?',
  noAccount: "Don't have an account?",
  haveAccount: 'Already have an account?',
  verifyEmailTitle: 'Verify your email',
  verificationSent: (email: string) =>
    `We sent a verification link to ${email}. Open it to verify your email.`,
  verifyEmail: 'Verify email',
  noVerificationLink: "Didn't receive a link?",
  invalidVerificationToken:
    'The verification link is missing, invalid, or expired. Request a new link below.',
  verificationLinkRequested:
    'If the account exists and needs verification, a verification link has been sent. Check your email.',
  resend: 'Resend',
  accountCreated: 'Account created!',
  accountCreatedDescription:
    'Your email has been verified. Please sign in with your credentials.',
  checkEmail: 'Check your email',
  resetLinkSent: (email: string) =>
    `If an account exists for ${email}, we sent a password reset link.`,
  backToSignIn: 'Back to sign in',
  forgotPasswordSubtitle: "Enter your email and we'll send you a reset link.",
  sendResetLink: 'Send reset link',
  rememberPassword: 'Remember your password?',
  passwordReset: 'Password reset!',
  passwordResetDescription: 'Your password has been successfully updated.',
  invalidResetToken:
    'Invalid or missing reset token. Please request a new password reset link.',
  retry: 'Try again',
  resetPasswordTitle: 'Reset your password',
  resetPasswordSubtitle: 'Enter your new password below.',
  newPassword: 'New password',
  newPasswordPlaceholder: 'Enter new password',
  confirmNewPassword: 'Confirm new password',
  resetPassword: 'Reset password',
  emailRequired: 'Email is required',
  emailInvalid: 'Please enter a valid email address',
  passwordsMismatch: 'Passwords do not match',
  passwordTooShort: 'Password must be at least 8 characters',
  invalidField: 'Please check this field.',
  errorGeneric: 'Something went wrong. Please try again.',
  errorValidation: 'Please check the information you entered.',
  errorUserExists: 'An account with this email already exists.',
  errorCredentials: 'Invalid email or password.',
  errorSessionExpired: 'Your session has expired. Please sign in again.',
  errorTokenInvalid: 'The code or link is invalid or has expired.',
  errorUserNotFound: 'Account not found.',
  errorEmailNotVerified: 'Please verify your email address.',
  errorNotAuthenticated: 'Please sign in to continue.',
  errorOAuthNotConfigured: 'Google sign-in is not available.',
  errorMissingAuthorizationCode:
    'Authorization code is missing. Please try signing in again.',
  errorOAuth: 'OAuth authentication failed. Please try again.',
  errorPasswordRequired: 'Set a password before doing this.',
  errorEmailChangeConflict:
    'This pending email has changed. Review the current request and try again.',
  errorEmailChangePending:
    'An email change is already pending. Confirm or cancel it before requesting another.',
  errorRateLimited: 'Too many attempts. Please try again later.',
  errorServiceUnavailable:
    'The service is temporarily unavailable. Please try again shortly.',
  confirmEmailChangeTitle: 'Confirm email change',
  confirmEmailChangeDescription:
    'Confirm that you want to use this email address for your account. You will be signed out on all devices.',
  confirmEmailChangeButton: 'Confirm email change',
  invalidEmailChangeToken:
    'The email change link is missing, invalid, or expired. Request a new change from your profile.',
  accountSettings: 'Account settings',
  profile: 'Profile',
  security: 'Security',
  sessions: 'Sessions',
  profileSubtitle: 'Manage your account information.',
  emailChangeSent:
    'Verification email sent. Check your inbox to complete the change.',
  pendingEmailDescription: (email: string) =>
    `A verification link has been sent to ${email}. Please check your inbox to complete the change.`,
  cancelEmailChangeButton: 'Cancel email change',
  cancelEmailChangeTitle: 'Cancel this email change?',
  cancelEmailChangeDescription: (email: string) =>
    `Your current email will stay active. The verification link sent to ${email} will stop working.`,
  keepEmailChange: 'Keep pending change',
  confirmCancelEmailChange: 'Cancel email change',
  emailChangeCancelled:
    'Email change canceled. Your current email is unchanged.',
  saveChanges: 'Save changes',
  emailVerifiedBadge: 'Verified',
  emailUnverifiedBadge: 'Unverified',
  signInMethods: 'Sign-in methods',
  googleMethod: 'Google',
  accountDetails: 'Account details',
  lastUpdated: 'Last updated',
  userId: 'User ID',
  pendingEmail: 'Pending email',
  memberSince: 'Member since',
  changeEmail: 'Change email address',
  setPasswordBeforeChangingEmail:
    'Set a password in Security before changing your email. After confirming the new email, Google will be unlinked. Use your new email and password to sign in.',
  changeEmailDescription: (email: string) =>
    `We'll send a verification link to ${email}. Your current email will remain active until you verify the new one. A notification will also be sent to your current email. Once confirmed, Google will be unlinked and all sessions will end. Sign in with your new email and password.`,
  cancel: 'Cancel',
  confirm: 'Confirm',
  securitySubtitle: 'Update your password to keep your account secure.',
  passwordSetupSubtitle: 'Set your password to keep your account secure.',
  passwordUpdated: 'Password updated successfully.',
  currentPassword: 'Current password',
  sendConfirmationCode: 'Email a confirmation code',
  resendConfirmationCode: 'Resend code',
  confirmationSending: 'Sending a confirmation code...',
  confirmationCompleting: 'Confirming and completing your action...',
  confirmationSent: (email: string) =>
    `A confirmation code has been sent to ${email}. Enter it below to complete this action.`,
  confirmationRequestRequired:
    'Request a new confirmation code to complete this action.',
  confirmationCode: 'Eight-digit confirmation code',
  confirmationResendIn: (seconds: number) => `Resend in ${seconds}s`,
  reauthenticationDescription:
    'The code expires in five minutes and allows five attempts. Wait one minute before requesting another.',
  errorReauthenticationCooldown:
    'Wait one minute before requesting another code.',
  errorReauthentication:
    'Confirmation is missing, invalid, expired, or has reached five attempts. Request a new code to continue.',
  currentPasswordPlaceholder: 'Enter current password',
  updatePassword: 'Update password',
  setPassword: 'Set password',
  setPasswordConfirmation:
    'Confirm with an email code to set your password. All sessions will end. Sign in again to continue.',
  googleAccount: 'Google account',
  unlinkGoogle: 'Unlink Google',
  unlinkGoogleDescription:
    'Remove Google as a login method. You will need your email and password to sign in. Signing in with Google again will reconnect it.',
  googleUnlinked: 'Google account unlinked.',
  setPasswordBeforeUnlinking: 'Set a password before unlinking Google.',
  linkGoogle: 'Link Google',
  linkGoogleDescription:
    'Add Google as a login method. The Google account must use the same email as this account.',
  linkGoogleConfirmation:
    'Enter your password to continue to Google and link it to this account.',
  linkGoogleVerifiesEmail:
    'Your email is not verified. Linking Google will verify it.',
  signOutEverywhere: 'Sign out everywhere',
  signOutEverywhereDescription: 'Sign out of all devices including this one.',
  deleteAccount: 'Delete account',
  deleteAccountDescription:
    'Permanently delete your account and all associated data. This action cannot be undone.',
  deleteAccountConfirmation:
    'This action is permanent and cannot be undone. All your data will be deleted.',
  deleteMyAccount: 'Delete my account',
  mobileDevice: 'Mobile device',
  desktopDevice: 'Desktop device',
  currentSession: 'Current',
  revokeSession: 'Revoke session',
  activeSessions: 'Active sessions',
  sessionsSubtitle: 'Manage your active sessions across devices.',
  revokeOthers: 'Revoke others',
  noSessions: 'No active sessions found.',
  emailNotVerified: 'Email not verified',
  manageAccount: 'Manage account',
  close: 'Close',
  userMenu: 'User menu',
  home: 'Home',
  loading: 'Loading...',
  exampleTitle: 'Keychain Web Example',
  welcome: (email: string) => `Welcome, ${email}! You are logged in.`,
  notSignedIn: 'You are not logged in.',
  signInPrompt: 'You are not logged in. Please sign in or sign up.',
  emailChanged:
    'Your email has been changed successfully. Please sign in with your new email and password.',
  oauthFailed: 'Google sign-in failed. Please try again.',
  oauthNotConfigured: 'Google sign-in is not available.',
  googleLinked: 'Google account linked.',
  googleLinkFailed: 'Failed to link Google account. Please try again.',
  oauthEmailMismatch: 'The Google account email must match your account email.',
  googleLinkRequired:
    'An account already uses this email. Sign in with that account, then link Google from profile settings.',
  dismiss: 'Dismiss',
  errorNetwork:
    'Unable to reach the server. Check your connection and try again.',
} as const;

export type Messages = {
  [K in keyof typeof en]: (typeof en)[K] extends (...args: infer P) => string
    ? (...args: P) => string
    : string;
};

export type MessageKey = {
  [K in keyof Messages]: Messages[K] extends string ? K : never;
}[keyof Messages];
