'use client';

import { useCallback, useContext, useState } from 'react';

import { AuthApiError, type ResetPasswordDTO } from '@mysamyr/client';

import { AuthContext } from '../context/AuthContext.js';

type ResetPasswordStatus = 'idle' | 'loading' | 'error' | 'success';

export function useResetPassword() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useResetPassword must be used within an AuthProvider');
  }

  const [status, setStatus] = useState<ResetPasswordStatus>('idle');
  const [error, setError] = useState<AuthApiError | Error | null>(null);

  const resetPassword = useCallback(
    async (input: ResetPasswordDTO) => {
      setStatus('loading');
      setError(null);

      try {
        await context.client.resetPassword(input);
        await context.mutateUser();
        setStatus('success');
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to reset password')
        );
        setStatus('error');
      }
    },
    [context]
  );

  return {
    status,
    error,
    resetPassword,
  };
}
