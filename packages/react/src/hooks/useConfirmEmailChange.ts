'use client';

import { useCallback, useContext, useState } from 'react';

import type { AuthApiError } from '@mysamyr/client';

import { AuthContext } from '../context/AuthContext.js';

type ConfirmEmailChangeStatus = 'idle' | 'loading' | 'error' | 'success';

/** Confirmation is explicit so link scanners cannot change the email. */
export function useConfirmEmailChange() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useConfirmEmailChange must be used within an AuthProvider'
    );
  }

  const [status, setStatus] = useState<ConfirmEmailChangeStatus>('idle');
  const [error, setError] = useState<AuthApiError | Error | null>(null);

  const confirmEmailChange = useCallback(
    async (token: string) => {
      setStatus('loading');
      setError(null);

      try {
        await context.client.confirmEmailChange({ token });
        await context.mutateUser(null);
        setStatus('success');
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to change email')
        );
        setStatus('error');
      }
    },
    [context]
  );

  return { status, error, confirmEmailChange };
}
