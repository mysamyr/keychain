'use client';

import { useCallback, useContext, useState } from 'react';

import { AuthApiError, type LoginDTO } from '@mysamyr/client';

import { AuthContext } from '../context/AuthContext.js';

type SignInStatus = 'idle' | 'loading' | 'error' | 'success';

export function useSignIn() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useSignIn must be used within an AuthProvider');
  }

  const [status, setStatus] = useState<SignInStatus>('idle');
  const [error, setError] = useState<AuthApiError | Error | null>(null);

  const signInWithCredentials = useCallback(
    async (credentials: LoginDTO) => {
      setStatus('loading');
      setError(null);

      try {
        await context.client.signIn(credentials);
        await context.mutateUser();
        setStatus('success');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Sign in failed'));
        setStatus('error');
      }
    },
    [context]
  );

  const signInWithGoogle = useCallback(() => {
    window.location.href = context.client.getGoogleOAuthUrl();
  }, [context]);

  return {
    status,
    error,
    signInWithCredentials,
    signInWithGoogle,
  };
}
