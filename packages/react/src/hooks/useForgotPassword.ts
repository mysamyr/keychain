'use client';

import { useCallback, useContext, useState } from 'react';

import { AuthApiError, type ForgotPasswordDTO } from '@mysamyr/client';

import { AuthContext } from '../context/AuthContext.js';

type ForgotPasswordStatus = 'idle' | 'loading' | 'error' | 'success';

export function useForgotPassword() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useForgotPassword must be used within an AuthProvider');
  }

  const [status, setStatus] = useState<ForgotPasswordStatus>('idle');
  const [error, setError] = useState<AuthApiError | Error | null>(null);

  const forgotPassword = useCallback(
    async (input: ForgotPasswordDTO) => {
      setStatus('loading');
      setError(null);

      try {
        await context.client.forgotPassword(input);
        setStatus('success');
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to send reset email')
        );
        setStatus('error');
      }
    },
    [context]
  );

  return {
    status,
    error,
    forgotPassword,
  };
}
