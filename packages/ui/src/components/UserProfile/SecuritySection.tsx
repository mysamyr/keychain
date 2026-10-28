'use client';

import { type SyntheticEvent, useCallback, useState } from 'react';

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
  const { user, deleteAccount, changePassword, unlinkGoogle, linkGoogle } =
    useUser();
  const [unlinkStatus, setUnlinkStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [unlinkError, setUnlinkError] = useState<Error | null>(null);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [unlinkPassword, setUnlinkPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [readyAction, setReadyAction] = useState<ReauthenticationAction>();
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
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<
    'idle' | 'loading' | 'error'
  >('idle');
  const [deleteError, setDeleteError] = useState<Error | AuthApiError | null>(
    null
  );

  const handleSubmit = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLocalError(null);

      if (newPassword !== confirmPassword) {
        setLocalError('passwordsMismatch');
        return;
      }

      if (newPassword.length < 8) {
        setLocalError('passwordTooShort');
        return;
      }

      setStatus('loading');

      void (async () => {
        try {
          await changePassword(currentPassword, newPassword);
          setStatus('success');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setReadyAction(undefined);
        } catch (err: unknown) {
          setError(
            err instanceof Error ? err : new Error('Failed to update password')
          );
          setStatus('error');
          setCurrentPassword('');
          if (!user?.hasPassword) setReadyAction(undefined);
        }
      })();
    },
    [
      currentPassword,
      newPassword,
      confirmPassword,
      changePassword,
      user?.hasPassword,
    ]
  );

  const handleSignOutAll = useCallback(() => {
    void signOut();
  }, [signOut]);

  return (
    <div className={cn('kc:space-y-6', className)}>
      <div>
        <h3 className="kc:text-lg kc:font-medium kc:text-gray-900">
          {t.security}
        </h3>
        <p className="kc:text-sm kc:text-gray-500">{t.securitySubtitle}</p>
      </div>

      {status === 'success' && (
        <Alert variant="success" message={t.passwordUpdated} />
      )}
      {user && !user.hasPassword && (
        <ActionConfirmation
          action="set-password"
          confirmed={readyAction === 'set-password'}
          onRequested={() => setReadyAction(undefined)}
          onConfirmed={() => setReadyAction('set-password')}
        />
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
            disabled={status === 'loading'}
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
          disabled={status === 'loading'}
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
          disabled={status === 'loading'}
        />

        <div className="kc:flex kc:justify-end">
          <Button
            type="submit"
            loading={status === 'loading'}
            disabled={
              status === 'loading' ||
              (!user?.hasPassword && readyAction !== 'set-password')
            }
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
              disabled={!user.hasPassword || status === 'loading'}
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
              disabled={status === 'loading'}
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
            className="kc:min-h-11 kc:w-full kc:shrink-0 kc:whitespace-nowrap kc:sm:min-h-0 kc:sm:w-auto"
            onClick={() => {
              setDeleteOpen(true);
              setDeleteConfirmEmail('');
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
        open={deleteOpen}
        onOpenChange={open => {
          if (deleteStatus === 'loading') return;
          setDeleteOpen(open);
          if (!open) {
            setDeletePassword('');
            if (readyAction === 'delete-account') setReadyAction(undefined);
          }
        }}
        title={t.deleteAccount}
        description={t.deleteAccountConfirmation}
      >
        <div className="kc:space-y-4">
          {deleteError && (
            <Alert variant="error" message={errorMessage(deleteError)} />
          )}
          {user?.hasPassword ? (
            <Input
              label={t.currentPassword}
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={event => setDeletePassword(event.target.value)}
              disabled={deleteStatus === 'loading'}
              required
            />
          ) : (
            <ActionConfirmation
              action="delete-account"
              confirmed={readyAction === 'delete-account'}
              onRequested={() => setReadyAction(undefined)}
              onConfirmed={() => setReadyAction('delete-account')}
            />
          )}
          <Input
            label={t.confirmEmail(user?.email ?? '')}
            className="kc:text-base kc:sm:text-sm"
            type="email"
            value={deleteConfirmEmail}
            onChange={e => setDeleteConfirmEmail(e.target.value)}
            placeholder={user?.email ?? ''}
          />
          <div className="kc:flex kc:flex-col-reverse kc:gap-3 kc:sm:flex-row kc:sm:justify-end">
            <Button
              variant="secondary"
              size="sm"
              className="kc:min-h-11 kc:sm:min-h-0"
              disabled={deleteStatus === 'loading'}
              onClick={() => {
                setDeleteOpen(false);
                setDeletePassword('');
                if (readyAction === 'delete-account') setReadyAction(undefined);
              }}
            >
              {t.cancel}
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="kc:min-h-11 kc:sm:min-h-0"
              disabled={
                deleteConfirmEmail !== user?.email ||
                deleteStatus === 'loading' ||
                (user?.hasPassword
                  ? !deletePassword
                  : readyAction !== 'delete-account')
              }
              loading={deleteStatus === 'loading'}
              onClick={() => {
                setDeleteStatus('loading');
                setDeleteError(null);
                void (async () => {
                  try {
                    await deleteAccount({ password: deletePassword });
                  } catch (err: unknown) {
                    setDeleteError(
                      err instanceof Error
                        ? err
                        : new Error('Failed to delete account')
                    );
                    setDeleteStatus('error');
                    setDeletePassword('');
                    if (!user?.hasPassword) setReadyAction(undefined);
                  }
                })();
              }}
            >
              {t.deleteMyAccount}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
