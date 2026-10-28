'use client';

import { type SyntheticEvent, useCallback, useState, useEffect } from 'react';

import {
  AuthApiError,
  useAuthPages,
  useResetPassword,
  useVerifyResetToken,
} from '@mysamyr/react';

import type { MessageKey } from '../../i18n/en.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import type { ResetPasswordProps } from '../../types';
import {
  getAppearanceStyles,
  getElementClass,
} from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';
import { useFocusOnChange } from '../../utils/focus.js';
import { useRouting } from '../../utils/routing.js';
import { useUrlToken } from '../../utils/token.js';
import { Alert, Button, Card, Input } from '../shared';

export function ResetPassword(props: ResetPasswordProps) {
  const token = useUrlToken(props.token);
  return <ResetPasswordForm key={token} {...props} token={token} />;
}

function ResetPasswordForm({
  appearance,
  routing,
  className,
  signInUrl: signInUrlProp,
  forgotPasswordUrl: forgotPasswordUrlProp,
  afterResetUrl,
  token,
}: ResetPasswordProps & { token: string }) {
  const pages = useAuthPages();
  const signInUrl = signInUrlProp ?? pages.signIn;
  const forgotPasswordUrl = forgotPasswordUrlProp ?? pages.forgotPassword;
  const { t, errorMessage, fieldError } = useTranslation();
  const { navigate } = useRouting({ routing });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<MessageKey | null>(
    null
  );

  const { status, error: apiError, resetPassword } = useResetPassword();
  const headingRef = useFocusOnChange<HTMLHeadingElement>(status === 'success');
  const verification = useVerifyResetToken(token);
  const rejectedOnSubmit =
    apiError instanceof AuthApiError && apiError.code === 'TOKEN_INVALID';

  const error = validationError
    ? t[validationError]
    : apiError
      ? errorMessage(apiError)
      : null;

  useEffect(() => {
    if (status === 'success' && afterResetUrl) {
      navigate(afterResetUrl);
    }
  }, [status, afterResetUrl, navigate]);

  const handleSubmit = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!verification.isValid || rejectedOnSubmit || status === 'loading') {
        return;
      }
      setValidationError(null);

      if (password !== confirmPassword) {
        setValidationError('passwordsMismatch');
        return;
      }

      if (password.length < 8) {
        setValidationError('passwordTooShort');
        return;
      }

      void resetPassword({ token, password });
    },
    [
      password,
      confirmPassword,
      token,
      resetPassword,
      verification.isValid,
      rejectedOnSubmit,
      status,
    ]
  );

  const style = getAppearanceStyles(appearance);

  if (status === 'success') {
    return (
      <Card className={cn(className)} style={style}>
        <div className="kc:space-y-4 kc:text-center">
          <div className="kc:mx-auto kc:flex kc:h-12 kc:w-12 kc:items-center kc:justify-center kc:rounded-full kc:bg-positive-light">
            <svg
              className="kc:h-6 kc:w-6 kc:text-positive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="kc:text-xl kc:font-semibold kc:text-gray-900 kc:outline-none"
          >
            {t.passwordReset}
          </h1>
          <p className="kc:text-sm kc:text-gray-500">
            {t.passwordResetDescription}
          </p>
          {signInUrl && (
            <a
              href={signInUrl}
              onClick={e => {
                e.preventDefault();
                navigate(signInUrl);
              }}
              className="kc:inline-block kc:text-sm kc:font-medium kc:text-accent kc:hover:text-accent-hover"
            >
              {t.backToSignIn}
            </a>
          )}
        </div>
      </Card>
    );
  }

  if (verification.isLoading && !rejectedOnSubmit) {
    return (
      <Card className={cn(className)} style={style}>
        <p role="status">{t.loading}</p>
      </Card>
    );
  }

  if (!verification.isValid || rejectedOnSubmit) {
    return (
      <Card className={cn(className)} style={style}>
        <div className="kc:space-y-4 kc:text-center">
          <Alert
            variant="error"
            message={
              verification.error
                ? errorMessage(verification.error)
                : rejectedOnSubmit
                  ? errorMessage(apiError)
                  : t.invalidResetToken
            }
          />
          {verification.error && (
            <Button onClick={() => void verification.retry()}>{t.retry}</Button>
          )}
          {forgotPasswordUrl && (
            <a
              href={forgotPasswordUrl}
              onClick={e => {
                e.preventDefault();
                navigate(forgotPasswordUrl);
              }}
              className="kc:inline-block kc:text-sm kc:font-medium kc:text-accent kc:hover:text-accent-hover"
            >
              {t.forgotPassword}
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
            {t.resetPasswordTitle}
          </h1>
          <p className="kc:mt-1 kc:text-sm kc:text-gray-500">
            {t.resetPasswordSubtitle}
          </p>
        </div>

        {error && <Alert variant="error" message={error} />}

        <form onSubmit={handleSubmit} className="kc:space-y-4">
          <Input
            label={t.newPassword}
            type="password"
            autoComplete="new-password"
            placeholder={t.newPasswordPlaceholder}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={status === 'loading'}
            error={fieldError(apiError, 'password')}
            className={getElementClass(appearance, 'formFieldInput')}
          />

          <Input
            label={t.confirmPassword}
            type="password"
            autoComplete="new-password"
            placeholder={t.confirmNewPassword}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={status === 'loading'}
            className={getElementClass(appearance, 'formFieldInput')}
          />

          <Button
            type="submit"
            loading={status === 'loading'}
            className={cn(
              'kc:w-full',
              getElementClass(appearance, 'formButtonPrimary')
            )}
          >
            {t.resetPassword}
          </Button>
        </form>

        {signInUrl && (
          <p className="kc:text-center kc:text-sm kc:text-gray-500">
            {t.rememberPassword}{' '}
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
