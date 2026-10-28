'use client';

import { type SyntheticEvent, useCallback, useState } from 'react';

import { useAuthPages, useForgotPassword } from '@mysamyr/react';

import { HighlightedMessage } from '../../i18n/HighlightedMessage.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import type { ForgotPasswordProps } from '../../types';
import {
  getAppearanceStyles,
  getElementClass,
} from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';
import { useFocusOnChange } from '../../utils/focus.js';
import { useRouting } from '../../utils/routing.js';
import { Alert, Button, Card, Input } from '../shared';

export function ForgotPassword({
  appearance,
  routing,
  className,
  signInUrl: signInUrlProp,
}: ForgotPasswordProps) {
  const pages = useAuthPages();
  const signInUrl = signInUrlProp ?? pages.signIn;
  const { t, errorMessage, fieldError } = useTranslation();
  const { navigate } = useRouting({ routing });
  const [email, setEmail] = useState('');
  const { status, error, forgotPassword } = useForgotPassword();
  const headingRef = useFocusOnChange<HTMLHeadingElement>(status === 'success');

  const handleSubmit = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      void forgotPassword({ email });
    },
    [email, forgotPassword]
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="kc:text-xl kc:font-semibold kc:text-gray-900 kc:outline-none"
          >
            {t.checkEmail}
          </h1>
          <p className="kc:text-sm kc:text-gray-500">
            <HighlightedMessage
              message={t.resetLinkSent(email)}
              value={email}
            />
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
            {t.forgotPassword}
          </h1>
          <p className="kc:mt-1 kc:text-sm kc:text-gray-500">
            {t.forgotPasswordSubtitle}
          </p>
        </div>

        {error && <Alert variant="error" message={errorMessage(error)} />}

        <form onSubmit={handleSubmit} className="kc:space-y-4">
          <Input
            label={t.email}
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
            error={fieldError(error, 'email')}
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
            {t.sendResetLink}
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
