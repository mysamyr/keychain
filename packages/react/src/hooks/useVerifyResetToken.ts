'use client';

import { useContext, useEffect, useMemo, useState } from 'react';

import { AuthContext } from '../context/AuthContext.js';

export function useVerifyResetToken(token: string) {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useVerifyResetToken must be used within an AuthProvider');
  }

  const { client } = context;
  const [attempt, setAttempt] = useState(0);
  const request = useMemo(
    () => ({ client, token, attempt }),
    [client, token, attempt]
  );
  const [result, setResult] = useState<{
    request: typeof request;
    error: Error | null;
  } | null>(null);

  useEffect(() => {
    if (!request.token) {
      return;
    }
    let cancelled = false;

    void request.client.verifyResetToken({ token: request.token }).then(
      () => {
        if (!cancelled) {
          setResult({ request, error: null });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setResult({
            request,
            error:
              error instanceof Error
                ? error
                : new Error('Failed to verify reset token'),
          });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [request]);

  const currentResult = result?.request === request ? result : null;

  return {
    isValid: !!token && currentResult !== null && !currentResult.error,
    isLoading: !!token && currentResult === null,
    error: currentResult?.error ?? null,
    retry: () => setAttempt(value => value + 1),
  };
}
