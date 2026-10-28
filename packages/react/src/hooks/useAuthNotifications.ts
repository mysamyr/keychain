'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { AuthContext } from '../context/AuthContext.js';

export type AuthNotification =
  | { code: 'email_changed' | 'google_linked'; variant: 'success' }
  | {
      code:
        | 'oauth_failed'
        | 'oauth_not_configured'
        | 'google_link_failed'
        | 'oauth_email_mismatch'
        | 'google_link_required';
      variant: 'error';
    };

export type AuthNotificationCode = AuthNotification['code'];

const ERROR_CODES = new Set<string>([
  'oauth_failed',
  'oauth_not_configured',
  'google_link_failed',
  'oauth_email_mismatch',
  'google_link_required',
]);

function parseAuthRedirect(search: string) {
  const params = new URLSearchParams(search);
  const notifications: AuthNotification[] = [];
  if (params.get('email_changed') === 'true') {
    notifications.push({ code: 'email_changed', variant: 'success' });
    params.delete('email_changed');
  }
  if (params.get('google_linked') === 'true') {
    notifications.push({ code: 'google_linked', variant: 'success' });
    params.delete('google_linked');
  }

  const error = params.get('error');
  if (error && ERROR_CODES.has(error)) {
    notifications.push({
      code: error as Extract<AuthNotification, { variant: 'error' }>['code'],
      variant: 'error',
    });
    params.delete('error');
  }

  const query = params.toString();
  return {
    notifications,
    search: notifications.length ? (query ? `?${query}` : '') : search,
  };
}

/** Consumes auth redirect query parameters once; used by `AuthProvider`. */
export function useRedirectNotifications() {
  const [notifications, setNotifications] = useState<AuthNotification[]>([]);
  const consumedSearch = useRef<string | null>(null);

  useEffect(() => {
    function consume(currentSearch: string) {
      if (consumedSearch.current === currentSearch) return;

      const { notifications: pending, search: cleanedSearch } =
        parseAuthRedirect(currentSearch);
      if (!pending.length) {
        consumedSearch.current = null;
        return;
      }

      const url = `${window.location.pathname}${cleanedSearch}${window.location.hash}`;
      window.history.replaceState(window.history.state, '', url);
      consumedSearch.current = currentSearch;
      setNotifications(previous => [...previous, ...pending]);
    }

    consume(window.location.search);
    const onPopState = () => consume(window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const dismissNotification = useCallback((notification: AuthNotification) => {
    setNotifications(previous =>
      previous.filter(item => item !== notification)
    );
  }, []);

  return { notifications, dismissNotification };
}

/** Pending OAuth and email-change redirect results, for rendering in your own UI. */
export function useAuthNotifications() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthNotifications must be used within an AuthProvider');
  }
  return {
    notifications: context.notifications,
    dismiss: context.dismissNotification,
  };
}
