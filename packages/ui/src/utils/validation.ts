const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailValidationError = 'emailRequired' | 'emailInvalid';

export function validateEmail(email: string): EmailValidationError | null {
  if (!email.trim()) {
    return 'emailRequired';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'emailInvalid';
  }
  return null;
}
