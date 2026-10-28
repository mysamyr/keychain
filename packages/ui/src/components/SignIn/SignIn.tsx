'use client';

import { type SyntheticEvent, useCallback, useState } from 'react';

import { useAuthPages, useSignIn } from '@mysamyr/react';

import type { MessageKey } from '../../i18n/en.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import type { SignInProps } from '../../types';
import {
  getAppearanceStyles,
  getElementClass,
} from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';
import { useRouting } from '../../utils/routing.js';
import { validateEmail } from '../../utils/validation.js';
import { Alert, Button, Card, Divider, Input, OAuthButton } from '../shared';

export function SignIn({
  appearance,
  routing,
  className,
  signUpUrl: signUpUrlProp,
  forgotPasswordUrl: forgotPasswordUrlProp,
  afterSignInUrl,
}: SignInProps) {
  const pages = useAuthPages();
  const signUpUrl = signUpUrlProp ?? pages.signUp;
  const forgotPasswordUrl = forgotPasswordUrlProp ?? pages.forgotPassword;
  const { t, errorMessage, fieldError } = useTranslation();
  const { status, error, signInWithCredentials, signInWithGoogle } =
    useSignIn();
  const { navigate } = useRouting({ routing });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<MessageKey | null>(null);

  const isLoading = status === 'loading';

  const handleSubmit = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLocalError(null);

      const emailError = validateEmail(email);
      if (emailError) {
        setLocalError(emailError);
        return;
      }

      void signInWithCredentials({ email, password, rememberMe });
    },
    [email, password, rememberMe, signInWithCredentials]
  );

  if (status === 'success' && afterSignInUrl) {
    navigate(afterSignInUrl);
  }

  const style = getAppearanceStyles(appearance);

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
            {t.signIn}
          </h1>
          <p className="kc:mt-1 kc:text-sm kc:text-gray-500">
            {t.signInSubtitle}
          </p>
        </div>

        <OAuthButton
          provider="google"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className={getElementClass(appearance, 'socialButton')}
        />

        <Divider text={t.or} />

        {(localError || error) && (
          <Alert
            variant="error"
            message={localError ? t[localError] : errorMessage(error)}
          />
        )}

        <form onSubmit={handleSubmit} className="kc:space-y-4">
          <Input
            label={t.email}
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
            error={fieldError(error, 'email')}
            className={getElementClass(appearance, 'formFieldInput')}
          />

          <Input
            label={t.password}
            type="password"
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
            error={fieldError(error, 'password')}
            className={getElementClass(appearance, 'formFieldInput')}
          />

          <div className="kc:flex kc:items-center kc:justify-between">
            <label className="kc:flex kc:items-center kc:gap-2 kc:text-sm kc:text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="kc:h-4 kc:w-4 kc:rounded kc:border-gray-300 kc:text-accent kc:focus:ring-accent"
              />
              {t.rememberMe}
            </label>

            {forgotPasswordUrl && (
              <a
                href={forgotPasswordUrl}
                onClick={e => {
                  e.preventDefault();
                  navigate(forgotPasswordUrl);
                }}
                className={cn(
                  'kc:text-sm kc:font-medium kc:text-accent kc:hover:text-accent-hover',
                  getElementClass(appearance, 'footerActionLink')
                )}
              >
                {t.forgotPassword}
              </a>
            )}
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className={cn(
              'kc:w-full',
              getElementClass(appearance, 'formButtonPrimary')
            )}
          >
            {t.signIn}
          </Button>
        </form>

        {signUpUrl && (
          <p className="kc:text-center kc:text-sm kc:text-gray-500">
            {t.noAccount}{' '}
            <a
              href={signUpUrl}
              onClick={e => {
                e.preventDefault();
                navigate(signUpUrl);
              }}
              className={cn(
                'kc:font-medium kc:text-accent kc:hover:text-accent-hover',
                getElementClass(appearance, 'footerActionLink')
              )}
            >
              {t.signUp}
            </a>
          </p>
        )}
      </div>
    </Card>
  );
}
