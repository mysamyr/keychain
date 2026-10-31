'use client';

import { type SyntheticEvent, useCallback, useState } from 'react';

import { AuthApiError, useUser } from '@mysamyr/react';

import type { MessageKey } from '../../i18n/en.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import { cn } from '../../utils/cn.js';
import { validateEmail } from '../../utils/validation.js';
import { Alert, Badge, Button, Input } from '../shared';
import { Modal } from '../shared/Modal.js';

export function ProfileSection({ className }: { className?: string }) {
  const { t, languageTag, errorMessage, fieldError } = useTranslation();
  const { user, updateUser, resendVerification, cancelEmailChange } = useUser();
  const [isResending, setIsResending] = useState(false);
  const [verificationError, setVerificationError] = useState<Error | null>(
    null
  );
  const [linkSent, setLinkSent] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<Error | AuthApiError | null>(null);
  const [localError, setLocalError] = useState<MessageKey | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [expectedPendingEmail, setExpectedPendingEmail] = useState('');
  const [cancelStatus, setCancelStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [cancelError, setCancelError] = useState<Error | null>(null);

  const handleSubmit = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!user?.hasPassword || user.pendingEmail || email === user.email)
        return;

      setLocalError(null);
      setError(null);
      const emailError = validateEmail(email);
      if (emailError) {
        setLocalError(emailError);
        setStatus('error');
        return;
      }

      setConfirmOpen(true);
    },
    [email, user]
  );

  const handleConfirmChange = useCallback(() => {
    if (!user?.hasPassword || user.pendingEmail || status === 'loading') return;
    setStatus('loading');
    setError(null);

    void (async () => {
      try {
        const updated = await updateUser({ email, password });
        setEmail(updated.email);
        setPassword('');
        setConfirmOpen(false);
        setStatus('success');
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err : new Error('Failed to update profile')
        );
        setStatus('error');
        setPassword('');
      }
    })();
  }, [email, password, status, updateUser, user]);

  const hasPendingEmail = !!user?.pendingEmail;

  const handleCancelEmailChange = () => {
    if (!expectedPendingEmail) return;
    setCancelStatus('loading');
    setCancelError(null);
    void (async () => {
      try {
        await cancelEmailChange(expectedPendingEmail);
        setEmail(user?.email ?? '');
        setStatus('idle');
        setError(null);
        setCancelStatus('success');
        setCancelOpen(false);
        setExpectedPendingEmail('');
      } catch (err: unknown) {
        setCancelError(
          err instanceof Error
            ? err
            : new Error('Failed to cancel email change')
        );
        setCancelStatus('error');
      }
    })();
  };

  const handleResend = async () => {
    setIsResending(true);
    setVerificationError(null);
    setLinkSent(false);
    try {
      await resendVerification();
      setLinkSent(true);
    } catch (err: unknown) {
      setVerificationError(
        err instanceof Error ? err : new Error('Email verification failed')
      );
    } finally {
      setIsResending(false);
    }
  };

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString(languageTag) : '—';

  return (
    <div className={cn('kc:space-y-6', className)}>
      <div>
        <h3 className="kc:text-lg kc:font-medium kc:text-gray-900">
          {t.profile}
        </h3>
        <p className="kc:text-sm kc:text-gray-500">{t.profileSubtitle}</p>
      </div>

      {status === 'success' && (
        <Alert variant="success" message={t.emailChangeSent} />
      )}
      {cancelStatus === 'success' && (
        <Alert variant="success" message={t.emailChangeCancelled} />
      )}
      {(localError || error) && (
        <Alert
          variant="error"
          message={localError ? t[localError] : errorMessage(error)}
        />
      )}

      {hasPendingEmail && (
        <div className="kc:space-y-3">
          {status !== 'success' && (
            <Alert
              variant="info"
              message={t.pendingEmailDescription(user.pendingEmail ?? '')}
            />
          )}
          <div className="kc:flex kc:flex-col kc:items-stretch kc:gap-2 kc:sm:flex-row kc:sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="kc:min-h-11 kc:w-full kc:sm:min-h-0 kc:sm:w-auto"
              disabled={cancelStatus === 'loading'}
              onClick={() => {
                setExpectedPendingEmail(user.pendingEmail ?? '');
                setCancelError(null);
                setCancelStatus('idle');
                setCancelOpen(true);
              }}
            >
              {t.cancelEmailChangeButton}
            </Button>
          </div>
        </div>
      )}

      {user && !user.isEmailVerified && (
        <div className="kc:space-y-4 kc:rounded-md kc:border kc:border-gray-200 kc:p-4">
          <h4 className="kc:font-medium kc:text-gray-900">
            {t.verifyEmailTitle}
          </h4>
          <p className="kc:text-sm kc:text-gray-500">{user.email}</p>
          {verificationError && (
            <Alert variant="error" message={errorMessage(verificationError)} />
          )}
          {linkSent && (
            <Alert variant="info" message={t.verificationSent(user.email)} />
          )}
          <Button
            type="button"
            variant="secondary"
            loading={isResending}
            disabled={isResending}
            onClick={() => void handleResend()}
            className="kc:min-h-11 kc:sm:min-h-0"
          >
            {t.resend}
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="kc:space-y-4">
        {user && !user.hasPassword && (
          <Alert variant="info" message={t.setPasswordBeforeChangingEmail} />
        )}
        <Input
          label={t.email}
          labelAdornment={
            user && (
              <Badge variant={user.isEmailVerified ? 'success' : 'warning'}>
                {user.isEmailVerified
                  ? t.emailVerifiedBadge
                  : t.emailUnverifiedBadge}
              </Badge>
            )
          }
          type="email"
          className="kc:text-base kc:sm:text-sm"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={
            !user?.hasPassword || hasPendingEmail || status === 'loading'
          }
          error={fieldError(error, 'email')}
        />

        <div className="kc:flex kc:justify-end">
          <Button
            type="submit"
            loading={status === 'loading'}
            disabled={
              !user?.hasPassword || hasPendingEmail || email === user.email
            }
            size="sm"
            className="kc:min-h-11 kc:w-full kc:sm:min-h-0 kc:sm:w-auto"
          >
            {t.saveChanges}
          </Button>
        </div>
      </form>

      <div className="kc:space-y-3 kc:border-t kc:border-gray-200 kc:pt-4">
        <h4 className="kc:text-sm kc:font-medium kc:text-gray-900">
          {t.signInMethods}
        </h4>
        <div className="kc:flex kc:flex-wrap kc:gap-2">
          {user?.hasPassword && <Badge>{t.password}</Badge>}
          {user?.hasGoogleAccount && <Badge>{t.googleMethod}</Badge>}
        </div>
      </div>

      <div className="kc:space-y-3 kc:border-t kc:border-gray-200 kc:pt-4">
        <h4 className="kc:text-sm kc:font-medium kc:text-gray-900">
          {t.accountDetails}
        </h4>
        <dl className="kc:space-y-3 kc:text-sm">
          {hasPendingEmail && (
            <div className="kc:flex kc:flex-col kc:gap-1 kc:sm:flex-row kc:sm:justify-between kc:sm:gap-4">
              <dt className="kc:shrink-0 kc:text-gray-500">{t.pendingEmail}</dt>
              <dd className="kc:min-w-0 kc:font-medium kc:text-gray-900 kc:sm:text-right">
                {user.pendingEmail}
              </dd>
            </div>
          )}
          <div className="kc:flex kc:flex-col kc:gap-1 kc:sm:flex-row kc:sm:justify-between kc:sm:gap-4">
            <dt className="kc:text-gray-500">{t.memberSince}</dt>
            <dd className="kc:font-medium kc:text-gray-900">
              {formatDate(user?.createdAt)}
            </dd>
          </div>
          <div className="kc:flex kc:flex-col kc:gap-1 kc:sm:flex-row kc:sm:justify-between kc:sm:gap-4">
            <dt className="kc:text-gray-500">{t.lastUpdated}</dt>
            <dd className="kc:font-medium kc:text-gray-900">
              {formatDate(user?.updatedAt)}
            </dd>
          </div>
          <div className="kc:flex kc:flex-col kc:gap-1 kc:sm:flex-row kc:sm:justify-between kc:sm:gap-4">
            <dt className="kc:shrink-0 kc:text-gray-500">{t.userId}</dt>
            <dd className="kc:min-w-0 kc:select-all kc:font-mono kc:text-xs kc:text-gray-900 kc:sm:text-right">
              {user?.id}
            </dd>
          </div>
        </dl>
      </div>

      <Modal
        open={confirmOpen}
        onOpenChange={open => {
          if (status === 'loading') return;
          setConfirmOpen(open);
          if (!open) setPassword('');
        }}
        title={t.changeEmail}
        description={t.changeEmailDescription(email)}
      >
        {error && <Alert variant="error" message={errorMessage(error)} />}
        <Input
          label={t.currentPassword}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          disabled={status === 'loading'}
          required
        />
        <div className="kc:flex kc:flex-col-reverse kc:gap-3 kc:sm:flex-row kc:sm:justify-end">
          <Button
            variant="secondary"
            size="sm"
            className="kc:min-h-11 kc:sm:min-h-0"
            disabled={status === 'loading'}
            onClick={() => {
              setConfirmOpen(false);
              setPassword('');
            }}
          >
            {t.cancel}
          </Button>
          <Button
            size="sm"
            className="kc:min-h-11 kc:sm:min-h-0"
            onClick={handleConfirmChange}
            loading={status === 'loading'}
            disabled={!password || status === 'loading'}
          >
            {t.confirm}
          </Button>
        </div>
      </Modal>

      <Modal
        open={cancelOpen}
        onOpenChange={open => {
          if (cancelStatus === 'loading') return;
          setCancelOpen(open);
          if (!open) {
            setExpectedPendingEmail('');
            setCancelError(null);
          }
        }}
        title={t.cancelEmailChangeTitle}
        description={t.cancelEmailChangeDescription(expectedPendingEmail)}
      >
        {cancelError && (
          <Alert variant="error" message={errorMessage(cancelError)} />
        )}
        <div className="kc:mt-4 kc:flex kc:flex-col-reverse kc:gap-3 kc:sm:flex-row kc:sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="kc:min-h-11 kc:sm:min-h-0"
            disabled={cancelStatus === 'loading'}
            onClick={() => setCancelOpen(false)}
          >
            {t.keepEmailChange}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="kc:min-h-11 kc:sm:min-h-0"
            loading={cancelStatus === 'loading'}
            onClick={handleCancelEmailChange}
          >
            {t.confirmCancelEmailChange}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
