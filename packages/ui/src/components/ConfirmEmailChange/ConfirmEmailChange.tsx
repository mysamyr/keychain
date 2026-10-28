'use client';

import { useEffect } from 'react';

import {
  AuthApiError,
  useAuthPages,
  useConfirmEmailChange,
} from '@mysamyr/react';

import { useTranslation } from '../../i18n/useTranslation.js';
import type { ConfirmEmailChangeProps } from '../../types/index.js';
import { getAppearanceStyles } from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';
import { useRouting } from '../../utils/routing.js';
import { useUrlToken } from '../../utils/token.js';
import { Alert, Button, Card } from '../shared/index.js';

export function ConfirmEmailChange({
  appearance,
  routing,
  className,
  signInUrl: signInUrlProp,
  profileUrl: profileUrlProp,
  afterConfirmUrl: afterConfirmUrlProp,
  token: tokenProp,
}: ConfirmEmailChangeProps) {
  const { t, errorMessage } = useTranslation();
  const { navigate } = useRouting({ routing });
  const { status, error, confirmEmailChange } = useConfirmEmailChange();
  const token = useUrlToken(tokenProp);
  const pages = useAuthPages();
  const signInUrl = signInUrlProp ?? pages.signIn;
  const profileUrl = profileUrlProp ?? pages.profile;
  const afterConfirmUrl =
    afterConfirmUrlProp ?? `${pages.signIn}?email_changed=true`;

  useEffect(() => {
    if (status === 'success' && afterConfirmUrl) {
      navigate(afterConfirmUrl);
    }
  }, [status, afterConfirmUrl, navigate]);

  const invalidToken =
    !token || (error instanceof AuthApiError && error.code === 'TOKEN_INVALID');

  return (
    <Card className={cn(className)} style={getAppearanceStyles(appearance)}>
      <div className="kc:space-y-4">
        <h1 className="kc:text-center kc:text-xl kc:font-semibold kc:text-gray-900">
          {t.confirmEmailChangeTitle}
        </h1>
        {invalidToken ? (
          <Alert variant="error" message={t.invalidEmailChangeToken} />
        ) : (
          <>
            <p className="kc:text-sm kc:text-gray-600">
              {t.confirmEmailChangeDescription}
            </p>
            {error && <Alert variant="error" message={errorMessage(error)} />}
            <Button
              className="kc:w-full"
              loading={status === 'loading'}
              disabled={status === 'success'}
              onClick={() => void confirmEmailChange(token)}
            >
              {t.confirmEmailChangeButton}
            </Button>
          </>
        )}
        <a
          href={invalidToken ? profileUrl : signInUrl}
          onClick={event => {
            event.preventDefault();
            navigate(invalidToken ? profileUrl : signInUrl);
          }}
          className="kc:inline-block kc:text-sm kc:font-medium kc:text-accent kc:hover:text-accent-hover"
        >
          {invalidToken ? t.profile : t.backToSignIn}
        </a>
      </div>
    </Card>
  );
}
