'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';

import { AuthApiError, useAuthPages, useVerifyEmail } from '@mysamyr/react';

import type { MessageKey } from '../../i18n/en.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import type { VerifyEmailProps } from '../../types/index.js';
import { getAppearanceStyles } from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';
import { useRouting } from '../../utils/routing.js';
import { useUrlToken } from '../../utils/token.js';
import { validateEmail } from '../../utils/validation.js';
import { Alert, Button, Card, Input } from '../shared/index.js';

export function VerifyEmail(props: VerifyEmailProps) {
  const token = useUrlToken(props.token);
  return <VerifyEmailForm key={token} {...props} token={token} />;
}

function VerifyEmailForm({
  appearance,
  routing,
  className,
  signInUrl: signInUrlProp,
  afterVerificationUrl: afterVerificationUrlProp,
  token,
}: VerifyEmailProps & { token: string }) {
  const pages = useAuthPages();
  const signInUrl = signInUrlProp ?? pages.signIn;
  const afterVerificationUrl =
    afterVerificationUrlProp ?? `${pages.signIn}?email_verified=true`;
  const { t, errorMessage, fieldError } = useTranslation();
  const { navigate } = useRouting({ routing });
  const { isLoading, isVerified, error, retry, resendVerification } =
    useVerifyEmail(token);
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [resendError, setResendError] = useState<Error | null>(null);
  const [localError, setLocalError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (isVerified && afterVerificationUrl) {
      navigate(afterVerificationUrl);
    }
  }, [isVerified, afterVerificationUrl, navigate]);

  const handleResend = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendError(null);
    setLinkSent(false);
    const emailError = validateEmail(email);
    setLocalError(emailError);
    if (emailError) return;

    setIsResending(true);
    try {
      await resendVerification(email);
      setLinkSent(true);
    } catch (err: unknown) {
      setResendError(
        err instanceof Error
          ? err
          : new Error('Failed to resend verification link')
      );
    } finally {
      setIsResending(false);
    }
  };

  const invalidToken =
    !token || (error instanceof AuthApiError && error.code === 'TOKEN_INVALID');

  return (
    <Card className={cn(className)} style={getAppearanceStyles(appearance)}>
      <div className="kc:space-y-4">
        <h1 className="kc:text-center kc:text-xl kc:font-semibold kc:text-gray-900">
          {t.verifyEmailTitle}
        </h1>
        {isLoading ? (
          <p role="status">{t.loading}</p>
        ) : isVerified ? (
          <Alert variant="success" message={t.accountCreatedDescription} />
        ) : (
          <>
            <Alert
              variant="error"
              message={
                invalidToken ? t.invalidVerificationToken : errorMessage(error)
              }
            />
            {!invalidToken && <Button onClick={retry}>{t.retry}</Button>}
            {linkSent && (
              <Alert variant="info" message={t.verificationLinkRequested} />
            )}
            {(localError || resendError) && (
              <Alert
                variant="error"
                message={localError ? t[localError] : errorMessage(resendError)}
              />
            )}
            <form
              onSubmit={event => void handleResend(event)}
              className="kc:space-y-4"
            >
              <Input
                label={t.email}
                type="email"
                autoComplete="email"
                value={email}
                placeholder={t.emailPlaceholder}
                onChange={event => setEmail(event.target.value)}
                required
                disabled={isResending}
                error={fieldError(resendError, 'email')}
              />
              <Button type="submit" loading={isResending} className="kc:w-full">
                {t.resend}
              </Button>
            </form>
          </>
        )}
        {signInUrl && (
          <a
            href={signInUrl}
            onClick={event => {
              event.preventDefault();
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
