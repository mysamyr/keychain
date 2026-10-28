'use client';

import { useCallback, useContext } from 'react';

import type { SessionDTO } from '@mysamyr/client';
import useSWR from 'swr';

import { AuthContext } from '../context/AuthContext.js';
import { sessionsKey, SWR_OPTIONS } from '../context/swr.js';

export function useSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useSession must be used within an AuthProvider');
  }

  const {
    data: sessions,
    error,
    isLoading,
    mutate,
  } = useSWR<SessionDTO[], Error>(
    context.isSignedIn ? sessionsKey(context.client.apiUrl) : null,
    () => context.client.getSessions(),
    SWR_OPTIONS
  );

  const revokeSession = useCallback(
    async (sessionId: string) => {
      await context.client.revokeSession(sessionId);
      if (
        sessions?.some(session => session.id === sessionId && session.isCurrent)
      ) {
        await context.mutateUser(null);
        return;
      }
      await mutate();
    },
    [context, mutate, sessions]
  );

  const revokeAllOtherSessions = useCallback(async () => {
    await context.client.revokeOtherSessions();
    await mutate();
  }, [context, mutate]);

  return {
    sessions: sessions ?? [],
    isLoading,
    error: error ?? null,
    revokeSession,
    revokeAllOtherSessions,
  };
}
