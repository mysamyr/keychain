'use client';

import { useCallback, useContext, useState } from 'react';

import { AuthApiError, type RegisterDTO } from '@mysamyr/client';

import { AuthContext } from '../context/AuthContext.js';

type SignUpStep = 'form' | 'verification';

export function useSignUp() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useSignUp must be used within an AuthProvider');
  }

  const [step, setStep] = useState<SignUpStep>('form');
  const [error, setError] = useState<AuthApiError | Error | null>(null);
  const [email, setEmail] = useState<string>('');

  const signUp = useCallback(
    async (input: RegisterDTO) => {
      setError(null);

      try {
        await context.client.signUp(input);
        setEmail(input.email);
        setStep('verification');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Sign up failed'));
      }
    },
    [context]
  );

  const resendVerification = useCallback(async () => {
    setError(null);

    try {
      await context.client.resendVerification(email);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to resend verification link')
      );
    }
  }, [context, email]);

  return {
    step,
    error,
    signUp,
    resendVerification,
  };
}
