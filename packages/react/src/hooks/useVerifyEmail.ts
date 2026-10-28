'use client';

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AuthContext } from '../context/AuthContext.js';

export function useVerifyEmail(token: string) {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useVerifyEmail must be used within an AuthProvider');
  }

  const { client } = context;
  const [attempt, setAttempt] = useState(0);
  const request = useMemo(
    () => ({ client, token, attempt }),
    [client, token, attempt]
  );
  const pending = useRef<{
    request: typeof request;
    promise: ReturnType<typeof client.verifyEmail>;
  } | null>(null);
  const [result, setResult] = useState<{
    request: typeof request;
    error: Error | null;
  } | null>(null);

  useEffect(() => {
    if (!request.token) return;
    let cancelled = false;

    // A locale/client change or StrictMode replay must not consume the token twice.
    if (
      pending.current?.request.token !== request.token ||
      pending.current.request.attempt !== request.attempt
    ) {
      pending.current = {
        request,
        promise: request.client.verifyEmail({ token: request.token }),
      };
    }
    void pending.current.promise.then(
      () => {
        if (!cancelled) setResult({ request, error: null });
      },
      (error: unknown) => {
        if (!cancelled) {
          setResult({
            request,
            error:
              error instanceof Error
                ? error
                : new Error('Email verification failed'),
          });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [request]);

  const resendVerification = useCallback(
    (email: string) => client.resendVerification(email),
    [client]
  );
  const currentResult = result?.request === request ? result : null;

  return {
    isVerified: !!token && currentResult !== null && !currentResult.error,
    isLoading: !!token && currentResult === null,
    error: currentResult?.error ?? null,
    retry: () => setAttempt(value => value + 1),
    resendVerification,
  };
}
