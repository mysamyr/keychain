'use client';

import { useCallback, useContext } from 'react';

import type {
  UpdateProfileDTO,
  SensitiveActionDTO,
  ReauthenticationAction,
} from '@mysamyr/client';

import { AuthContext } from '../context/AuthContext.js';

export function useUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useUser must be used within an AuthProvider');
  }

  const updateUser = useCallback(
    async (data: UpdateProfileDTO) => {
      const updated = await context.client.updateMe(data);
      await context.mutateUser(updated);
      return updated;
    },
    [context]
  );

  const cancelEmailChange = useCallback(
    async (expectedEmail: string) => {
      try {
        await context.client.cancelEmailChange({ expectedEmail });
      } catch (error: unknown) {
        await context.mutateUser().catch(() => undefined);
        throw error;
      }
      await context.mutateUser();
    },
    [context]
  );

  const deleteAccount = useCallback(
    async (data: SensitiveActionDTO) => {
      await context.client.deleteMe(data);
      await context.mutateUser(null);
    },
    [context]
  );

  const verifyEmail = useCallback(
    async (token: string) => {
      await context.client.verifyEmail({ token });
      await context.mutateUser();
    },
    [context]
  );

  const resendVerification = useCallback(async () => {
    if (!context.user) {
      throw new Error('Cannot resend verification without a signed-in user');
    }
    await context.client.resendVerification(context.user.email);
  }, [context]);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      await context.client.changePassword({ oldPassword, newPassword });
      await context.mutateUser();
    },
    [context]
  );

  const unlinkGoogle = useCallback(
    async (password: string) => {
      await context.client.unlinkGoogle({ password });
      await context.mutateUser();
    },
    [context]
  );

  const linkGoogle = useCallback(
    async (password: string) => {
      const { url } = await context.client.startGoogleLink({ password });
      window.location.href = url;
    },
    [context]
  );

  const requestReauthentication = useCallback(
    async (action: ReauthenticationAction) => {
      await context.client.requestReauthentication({
        action,
      });
    },
    [context]
  );

  const verifyReauthentication = useCallback(
    async (action: ReauthenticationAction, code: string) => {
      await context.client.verifyReauthentication({ action, code });
    },
    [context]
  );

  return {
    user: context.user,
    isLoaded: context.isLoaded,
    updateUser,
    cancelEmailChange,
    deleteAccount,
    verifyEmail,
    resendVerification,
    changePassword,
    unlinkGoogle,
    linkGoogle,
    requestReauthentication,
    verifyReauthentication,
  };
}
