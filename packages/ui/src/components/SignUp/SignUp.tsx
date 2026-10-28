'use client';

import { type SyntheticEvent, useCallback, useEffect, useState } from 'react';

import { useAuthPages, useSignIn, useSignUp } from '@mysamyr/react';

import type { MessageKey } from '../../i18n/en.js';
import { HighlightedMessage } from '../../i18n/HighlightedMessage.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import type { SignUpProps } from '../../types';
import {
  getAppearanceStyles,
  getElementClass,
} from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';
import { useFocusOnChange } from '../../utils/focus.js';
import { useRouting } from '../../utils/routing.js';
import { validateEmail } from '../../utils/validation.js';
import { Alert, Button, Card, Divider, Input, OAuthButton } from '../shared';

export function SignUp({
  appearance,
  routing,
  className,
  signInUrl: signInUrlProp,
  afterSignUpUrl,
}: SignUpProps) {
  const pages = useAuthPages();
  const signInUrl = signInUrlProp ?? pages.signIn;
  const { t, errorMessage, fieldError } = useTranslation();
  const { step, error, signUp, resendVerification } = useSignUp();
  const headingRef = useFocusOnChange<HTMLHeadingElement>(step);
  const { signInWithGoogle } = useSignIn();
  const { navigate } = useRouting({ routing });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<MessageKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLocalError(null);

      const emailError = validateEmail(email);
      if (emailError) {
        setLocalError(emailError);
        return;
      }

      if (password !== confirmPassword) {
        setLocalError('passwordsMismatch');
        return;
      }

      if (password.length < 8) {
        setLocalError('passwordTooShort');
        return;
      }

      setIsSubmitting(true);
      void signUp({ email, password }).finally(() => setIsSubmitting(false));
    },
    [email, password, confirmPassword, signUp]
  );

  const handleResend = useCallback(() => {
    setIsSubmitting(true);
    void resendVerification().finally(() => setIsSubmitting(false));
  }, [resendVerification]);

  useEffect(() => {
    if (step === 'verification' && afterSignUpUrl) {
      navigate(afterSignUpUrl);
    }
  }, [step, afterSignUpUrl, navigate]);

  const style = getAppearanceStyles(appearance);
  const displayError = localError
    ? t[localError]
    : error
      ? errorMessage(error)
      : null;

  if (step === 'verification') {
    return (
      <Card className={cn(className)} style={style}>
        <div className="kc:space-y-6">
          <div className="kc:text-center">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="kc:text-xl kc:font-semibold kc:text-gray-900 kc:outline-none"
            >
              {t.verifyEmailTitle}
            </h1>
            <p className="kc:mt-1 kc:text-sm kc:text-gray-500">
              <HighlightedMessage
                message={t.verificationSent(email)}
                value={email}
              />
            </p>
          </div>

          {error && <Alert variant="error" message={errorMessage(error)} />}

          <p className="kc:text-center kc:text-sm kc:text-gray-500">
            {t.noVerificationLink}{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
              className="kc:font-medium kc:text-accent kc:hover:text-accent-hover"
            >
              {t.resend}
            </button>
          </p>
          {signInUrl && (
            <a
              href={signInUrl}
              onClick={e => {
                e.preventDefault();
                navigate(signInUrl);
              }}
              className="kc:block kc:text-center kc:text-sm kc:font-medium kc:text-accent kc:hover:text-accent-hover"
            >
              {t.backToSignIn}
            </a>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(className)} style={style}>
      <div className="kc:space-y-6">
        <div className="kc:text-center">
          <h1
            className={cn(
              'kc:text-xl kc:font-semibold kc:text-gray-900',
              getElementClass(appearance, 'headerTitle')
            )}
          >
            {t.createAccount}
          </h1>
          <p className="kc:mt-1 kc:text-sm kc:text-gray-500">
            {t.signUpSubtitle}
          </p>
        </div>

        <OAuthButton
          provider="google"
          onClick={signInWithGoogle}
          disabled={isSubmitting}
          className={getElementClass(appearance, 'socialButton')}
        />

        <Divider text={t.or} />

        {displayError && <Alert variant="error" message={displayError} />}

        <form onSubmit={handleSignUp} className="kc:space-y-4">
          <Input
            label={t.email}
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            error={fieldError(error, 'email')}
            className={getElementClass(appearance, 'formFieldInput')}
          />

          <Input
            label={t.password}
            type="password"
            autoComplete="new-password"
            placeholder={t.createPassword}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            error={fieldError(error, 'password')}
            className={getElementClass(appearance, 'formFieldInput')}
          />

          <Input
            label={t.confirmPassword}
            type="password"
            autoComplete="new-password"
            placeholder={t.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={isSubmitting}
            className={getElementClass(appearance, 'formFieldInput')}
          />

          <Button
            type="submit"
            loading={isSubmitting}
            className={cn(
              'kc:w-full',
              getElementClass(appearance, 'formButtonPrimary')
            )}
          >
            {t.signUp}
          </Button>
        </form>

        {signInUrl && (
          <p className="kc:text-center kc:text-sm kc:text-gray-500">
            {t.haveAccount}{' '}
            <a
              href={signInUrl}
              onClick={e => {
                e.preventDefault();
                navigate(signInUrl);
              }}
              className={cn(
                'kc:font-medium kc:text-accent kc:hover:text-accent-hover',
                getElementClass(appearance, 'footerActionLink')
              )}
            >
              {t.signIn}
            </a>
          </p>
        )}
      </div>
    </Card>
  );
}
