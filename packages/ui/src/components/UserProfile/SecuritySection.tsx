'use client';

import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AuthApiError,
  useAuth,
  useUser,
  type ReauthenticationAction,
} from '@mysamyr/react';

import type { MessageKey } from '../../i18n/en.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import { cn } from '../../utils/cn.js';
import { Alert, Button, Input, OAuthButton } from '../shared';
import { Modal } from '../shared/Modal.js';

import { ActionConfirmation } from './ActionConfirmation.js';

export function SecuritySection({ className }: { className?: string }) {
  const { t, errorMessage, fieldError } = useTranslation();
  const { signOut } = useAuth();
  const {
    user,
    deleteAccount,
    changePassword,
    unlinkGoogle,
    linkGoogle,
    requestReauthentication,
    verifyReauthentication,
  } = useUser();
  const [unlinkStatus, setUnlinkStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [unlinkError, setUnlinkError] = useState<Error | null>(null);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [unlinkPassword, setUnlinkPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkStatus, setLinkStatus] = useState<'idle' | 'loading' | 'error'>(
    'idle'
  );
  const [linkError, setLinkError] = useState<Error | AuthApiError | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<Error | AuthApiError | null>(null);
  const [localError, setLocalError] = useState<MessageKey | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<
    'idle' | 'loading' | 'error'
  >('idle');
  const [deleteError, setDeleteError] = useState<Error | AuthApiError | null>(
    null
  );
  const [confirmationAction, setConfirmationAction] =
    useState<ReauthenticationAction>('set-password');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationStage, setConfirmationStage] = useState<
    'idle' | 'sending' | 'verifying' | 'executing'
  >('idle');
  const [challenge, setChallenge] = useState<{
    action: ReauthenticationAction;
    expiresAt: number;
  } | null>(null);
  const [code, setCode] = useState('');
  const [confirmationError, setConfirmationError] = useState<Error | null>(
    null
  );
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const confirmationLock = useRef(false);
  const mounted = useRef(false);
  const confirmationBusy = confirmationStage !== 'idle';
  const confirmationPending =
    confirmationStage === 'verifying' || confirmationStage === 'executing';
  const sendingAction =
    confirmationStage === 'sending' ? confirmationAction : undefined;
  const busy =
    confirmationBusy ||
    status === 'loading' ||
    deleteStatus === 'loading' ||
    unlinkStatus === 'loading' ||
    linkStatus === 'loading';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!cooldownUntil) return;
    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((cooldownUntil - Date.now()) / 1000)
      );
      setCooldown(remaining);
      if (remaining === 0) setCooldownUntil(0);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  const requestCode = async (action: ReauthenticationAction) => {
    if (confirmationLock.current || cooldownUntil > Date.now()) return;
    confirmationLock.current = true;
    setConfirmationStage('sending');
    setConfirmationError(null);
    setChallenge(null);
    setCode('');
    try {
      await requestReauthentication(action);
      if (!mounted.current) return;
      setChallenge({ action, expiresAt: Date.now() + 5 * 60_000 });
      setCooldownUntil(Date.now() + 60_000);
      setCooldown(60);
    } catch (error) {
      if (!mounted.current) return;
      setConfirmationError(
        error instanceof Error ? error : new Error('Confirmation failed')
      );
      if (
        error instanceof AuthApiError &&
        error.code === 'REAUTHENTICATION_COOLDOWN'
      ) {
        setCooldownUntil(Date.now() + 60_000);
        setCooldown(60);
      }
    } finally {
      confirmationLock.current = false;
      if (mounted.current) setConfirmationStage('idle');
    }
  };

  const openConfirmation = (action: ReauthenticationAction) => {
    if (sendingAction === action) {
      setConfirmationOpen(true);
      return;
    }
    if (confirmationLock.current || busy) return;
    setConfirmationAction(action);
    setConfirmationOpen(true);
    setCode('');
    setConfirmationError(null);
    if (challenge?.action !== action || challenge.expiresAt <= Date.now()) {
      setChallenge(null);
      void requestCode(action);
    }
  };

  const closeConfirmation = () => {
    if (confirmationPending) return;
    setConfirmationOpen(false);
    setCode('');
  };

  const confirmAction = async () => {
    if (
      confirmationLock.current ||
      challenge?.action !== confirmationAction ||
      !/^\d{8}$/.test(code)
    ) {
      return;
    }
    confirmationLock.current = true;
    setConfirmationStage('verifying');
    setConfirmationError(null);
    try {
      await verifyReauthentication(confirmationAction, code);
      if (!mounted.current) return;
      // Verification consumes the challenge, even if the mutation fails.
      setChallenge(null);
      setCode('');
      setConfirmationStage('executing');
      if (confirmationAction === 'set-password') {
        await changePassword('', newPassword);
        if (!mounted.current) return;
        setNewPassword('');
        setConfirmPassword('');
        setStatus('success');
      } else {
        await deleteAccount({});
      }
      if (mounted.current) setConfirmationOpen(false);
    } catch (error) {
      if (!mounted.current) return;
      setConfirmationError(
        error instanceof Error ? error : new Error('Confirmation failed')
      );
      setCode('');
    } finally {
      confirmationLock.current = false;
      if (mounted.current) setConfirmationStage('idle');
    }
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sendingAction === 'set-password') {
      setConfirmationOpen(true);
      return;
    }
    if (busy || confirmationLock.current) return;
    setError(null);
    setLocalError(null);
    setStatus('idle');

    if (newPassword !== confirmPassword) {
      setLocalError('passwordsMismatch');
      return;
    }

    if (newPassword.length < 8) {
      setLocalError('passwordTooShort');
      return;
    }

    if (!user?.hasPassword) {
      openConfirmation('set-password');
      return;
    }

    setStatus('loading');
    void (async () => {
      try {
        await changePassword(currentPassword, newPassword);
        if (!mounted.current) return;
        setStatus('success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err: unknown) {
        if (!mounted.current) return;
        setError(
          err instanceof Error ? err : new Error('Failed to update password')
        );
        setStatus('error');
        setCurrentPassword('');
      }
    })();
  };

  const handleSignOutAll = useCallback(() => {
    void signOut();
  }, [signOut]);

  return (
    <div className={cn('kc:space-y-6', className)}>
      <div>
        <h3 className="kc:text-lg kc:font-medium kc:text-gray-900">
          {t.security}
        </h3>
        <p className="kc:text-sm kc:text-gray-500">
          {user?.hasPassword ? t.securitySubtitle : t.passwordSetupSubtitle}
        </p>
      </div>

      {status === 'success' && (
        <Alert variant="success" message={t.passwordUpdated} />
      )}
      {(localError || error) && (
        <Alert
          variant="error"
          message={localError ? t[localError] : errorMessage(error)}
        />
      )}

      <form onSubmit={handleSubmit} className="kc:space-y-4">
        {user?.hasPassword && (
          <Input
            label={t.currentPassword}
            className="kc:text-base kc:sm:text-sm"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            placeholder={t.currentPasswordPlaceholder}
            error={fieldError(error, 'oldPassword')}
            disabled={busy}
          />
        )}

        <Input
          label={t.newPassword}
          className="kc:text-base kc:sm:text-sm"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          placeholder={t.newPasswordPlaceholder}
          error={fieldError(error, 'newPassword')}
          disabled={busy}
        />

        <Input
          label={t.confirmNewPassword}
          className="kc:text-base kc:sm:text-sm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          placeholder={t.confirmNewPassword}
          error={fieldError(error, 'confirmPassword')}
          disabled={busy}
        />

        <div className="kc:flex kc:justify-end">
          <Button
            type="submit"
            loading={status === 'loading'}
            disabled={busy && sendingAction !== 'set-password'}
            size="sm"
            className="kc:min-h-11 kc:w-full kc:sm:min-h-0 kc:sm:w-auto"
          >
            {user?.hasPassword ? t.updatePassword : t.setPassword}
          </Button>
        </div>
      </form>

      {unlinkStatus === 'success' && (
        <Alert variant="success" message={t.googleUnlinked} />
      )}
      {unlinkError && (
        <Alert variant="error" message={errorMessage(unlinkError)} />
      )}
      {user?.hasGoogleAccount && (
        <div className="kc:border-t kc:border-gray-200 kc:pt-4">
          <div className="kc:flex kc:flex-col kc:items-start kc:gap-4 kc:sm:flex-row kc:sm:items-center kc:sm:justify-between">
            <div>
              <h4 className="kc:text-sm kc:font-medium kc:text-gray-900">
                {t.unlinkGoogle}
              </h4>
              <p className="kc:text-xs kc:text-gray-500">
                {t.unlinkGoogleDescription}
              </p>
              {!user.hasPassword && (
                <p className="kc:mt-1 kc:text-xs kc:text-gray-500">
                  {t.setPasswordBeforeUnlinking}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="kc:min-h-11 kc:w-full kc:shrink-0 kc:whitespace-nowrap kc:sm:min-h-0 kc:sm:w-auto"
              disabled={!user.hasPassword || busy}
              loading={unlinkStatus === 'loading'}
              onClick={() => {
                setUnlinkOpen(true);
                setUnlinkPassword('');
                setUnlinkError(null);
                setUnlinkStatus('idle');
              }}
            >
              {t.unlinkGoogle}
            </Button>
          </div>
        </div>
      )}

      {user?.canLinkGoogle && !user.hasGoogleAccount && (
        <div className="kc:border-t kc:border-gray-200 kc:pt-4">
          <div className="kc:flex kc:flex-col kc:items-start kc:gap-4 kc:sm:flex-row kc:sm:items-center kc:sm:justify-between">
            <div>
              <h4 className="kc:text-sm kc:font-medium kc:text-gray-900">
                {t.linkGoogle}
              </h4>
              <p className="kc:text-xs kc:text-gray-500">
                {t.linkGoogleDescription}
              </p>
              {!user.isEmailVerified && (
                <p className="kc:mt-1 kc:text-xs kc:text-gray-500">
                  {t.linkGoogleVerifiesEmail}
                </p>
              )}
            </div>
            <OAuthButton
              provider="google"
              label={t.linkGoogle}
              onClick={() => {
                setLinkOpen(true);
                setLinkPassword('');
                setLinkStatus('idle');
                setLinkError(null);
              }}
              disabled={busy}
              className="kc:min-h-11 kc:w-full kc:shrink-0 kc:whitespace-nowrap kc:sm:min-h-0 kc:sm:w-auto"
            />
          </div>
        </div>
      )}

      <div className="kc:border-t kc:border-gray-200 kc:pt-4">
        <div className="kc:flex kc:flex-col kc:items-start kc:gap-4 kc:sm:flex-row kc:sm:items-center kc:sm:justify-between">
          <div>
            <h4 className="kc:text-sm kc:font-medium kc:text-gray-900">
              {t.signOutEverywhere}
            </h4>
            <p className="kc:text-xs kc:text-gray-500">
              {t.signOutEverywhereDescription}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOutAll}
            disabled={busy}
            className="kc:min-h-11 kc:w-full kc:shrink-0 kc:whitespace-nowrap kc:sm:min-h-0 kc:sm:w-auto"
          >
            {t.signOut}
          </Button>
        </div>
      </div>

      <div className="kc:border-t kc:border-critical/30 kc:pt-4">
        <div className="kc:flex kc:flex-col kc:items-start kc:gap-4 kc:sm:flex-row kc:sm:items-center kc:sm:justify-between">
          <div>
            <h4 className="kc:text-sm kc:font-medium kc:text-critical">
              {t.deleteAccount}
            </h4>
            <p className="kc:text-xs kc:text-gray-500">
              {t.deleteAccountDescription}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            disabled={busy && sendingAction !== 'delete-account'}
            className="kc:min-h-11 kc:w-full kc:shrink-0 kc:whitespace-nowrap kc:sm:min-h-0 kc:sm:w-auto"
            onClick={() => {
              if (!user?.hasPassword) {
                openConfirmation('delete-account');
                return;
              }
              setDeleteOpen(true);
              setDeletePassword('');
              setDeleteStatus('idle');
              setDeleteError(null);
            }}
          >
            {t.deleteAccount}
          </Button>
        </div>
      </div>

      <Modal
        open={unlinkOpen}
        onOpenChange={open => {
          if (unlinkStatus === 'loading') return;
          setUnlinkOpen(open);
          if (!open) setUnlinkPassword('');
        }}
        title={t.unlinkGoogle}
        description={t.unlinkGoogleDescription}
      >
        <form
          className="kc:space-y-4"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            setUnlinkStatus('loading');
            setUnlinkError(null);
            void (async () => {
              try {
                await unlinkGoogle(unlinkPassword);
                setUnlinkStatus('success');
                setUnlinkOpen(false);
              } catch (error) {
                setUnlinkError(
                  error instanceof Error
                    ? error
                    : new Error('Failed to unlink Google')
                );
                setUnlinkStatus('error');
              } finally {
                setUnlinkPassword('');
              }
            })();
          }}
        >
          {unlinkError && (
            <Alert variant="error" message={errorMessage(unlinkError)} />
          )}
          <Input
            label={t.currentPassword}
            type="password"
            autoComplete="current-password"
            value={unlinkPassword}
            onChange={event => setUnlinkPassword(event.target.value)}
            required
            disabled={unlinkStatus === 'loading'}
          />
          <Button
            type="submit"
            variant="danger"
            loading={unlinkStatus === 'loading'}
            disabled={!unlinkPassword || unlinkStatus === 'loading'}
          >
            {t.confirm}
          </Button>
        </form>
      </Modal>

      <Modal
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title={t.linkGoogle}
        description={t.linkGoogleConfirmation}
      >
        <form
          className="kc:space-y-4"
          onSubmit={(e: SyntheticEvent<HTMLFormElement>) => {
            e.preventDefault();
            setLinkStatus('loading');
            setLinkError(null);
            void (async () => {
              try {
                await linkGoogle(linkPassword);
              } catch (err: unknown) {
                setLinkError(
                  err instanceof Error
                    ? err
                    : new Error('Failed to link Google')
                );
                setLinkStatus('error');
              }
            })();
          }}
        >
          {linkError && (
            <Alert variant="error" message={errorMessage(linkError)} />
          )}
          <Input
            label={t.currentPassword}
            className="kc:text-base kc:sm:text-sm"
            type="password"
            autoComplete="current-password"
            value={linkPassword}
            onChange={e => setLinkPassword(e.target.value)}
            placeholder={t.currentPasswordPlaceholder}
            required
          />
          <div className="kc:flex kc:flex-col-reverse kc:gap-3 kc:sm:flex-row kc:sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="kc:min-h-11 kc:sm:min-h-0"
              onClick={() => setLinkOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="kc:min-h-11 kc:sm:min-h-0"
              loading={linkStatus === 'loading'}
              disabled={!linkPassword}
            >
              {t.confirm}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmationOpen}
        onOpenChange={open => {
          if (!open) closeConfirmation();
        }}
        title={
          confirmationAction === 'set-password'
            ? t.setPassword
            : t.deleteAccount
        }
        description={
          confirmationAction === 'set-password'
            ? t.setPasswordConfirmation
            : t.deleteAccountConfirmation
        }
      >
        <ActionConfirmation
          email={user?.email ?? ''}
          label={
            confirmationAction === 'set-password'
              ? t.setPassword
              : t.deleteMyAccount
          }
          destructive={confirmationAction === 'delete-account'}
          sent={challenge?.action === confirmationAction}
          sending={confirmationStage === 'sending'}
          pending={confirmationPending}
          cooldown={cooldown}
          code={code}
          error={confirmationError}
          onCodeChange={setCode}
          onRequest={() => void requestCode(confirmationAction)}
          onConfirm={() => void confirmAction()}
          onCancel={closeConfirmation}
        />
      </Modal>

      <Modal
        open={deleteOpen}
        onOpenChange={open => {
          if (deleteStatus === 'loading') return;
          setDeleteOpen(open);
          if (!open) setDeletePassword('');
        }}
        title={t.deleteAccount}
        description={t.deleteAccountConfirmation}
      >
        <form
          className="kc:space-y-4"
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!deletePassword || deleteStatus === 'loading') return;
            setDeleteStatus('loading');
            setDeleteError(null);
            void (async () => {
              try {
                await deleteAccount({ password: deletePassword });
                if (mounted.current) setDeleteOpen(false);
              } catch (err: unknown) {
                if (!mounted.current) return;
                setDeleteError(
                  err instanceof Error
                    ? err
                    : new Error('Failed to delete account')
                );
                setDeleteStatus('error');
              } finally {
                if (mounted.current) setDeletePassword('');
              }
            })();
          }}
        >
          {deleteError && (
            <Alert variant="error" message={errorMessage(deleteError)} />
          )}
          <Input
            label={t.currentPassword}
            type="password"
            autoComplete="current-password"
            value={deletePassword}
            onChange={event => setDeletePassword(event.target.value)}
            disabled={deleteStatus === 'loading'}
            required
          />
          <div className="kc:flex kc:flex-col-reverse kc:gap-3 kc:sm:flex-row kc:sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="kc:min-h-11 kc:sm:min-h-0"
              disabled={deleteStatus === 'loading'}
              onClick={() => {
                setDeleteOpen(false);
                setDeletePassword('');
              }}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              className="kc:min-h-11 kc:sm:min-h-0"
              disabled={!deletePassword || deleteStatus === 'loading'}
              loading={deleteStatus === 'loading'}
            >
              {t.deleteMyAccount}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
