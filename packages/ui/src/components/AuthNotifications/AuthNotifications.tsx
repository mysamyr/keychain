'use client';

import { useEffect } from 'react';

import {
  useAuthNotifications,
  type AuthNotificationCode,
} from '@mysamyr/react';
import { X } from 'lucide-react';

import type { MessageKey } from '../../i18n/en.js';
import { useTranslation } from '../../i18n/useTranslation.js';
import type { AuthNotificationsProps } from '../../types';
import { getAppearanceStyles } from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';

const MESSAGES: Record<AuthNotificationCode, MessageKey> = {
  email_changed: 'emailChanged',
  google_linked: 'googleLinked',
  oauth_failed: 'oauthFailed',
  oauth_not_configured: 'oauthNotConfigured',
  google_link_failed: 'googleLinkFailed',
  oauth_email_mismatch: 'oauthEmailMismatch',
  google_link_required: 'googleLinkRequired',
};

export function AuthNotifications({
  appearance,
  className,
  durationMs = 6000,
}: AuthNotificationsProps) {
  const { t, languageTag } = useTranslation();
  const { notifications, dismiss } = useAuthNotifications();
  const notification = notifications[0];

  useEffect(() => {
    if (!notification || durationMs <= 0) return;
    const timer = window.setTimeout(() => dismiss(notification), durationMs);
    return () => window.clearTimeout(timer);
  }, [notification, durationMs, dismiss]);

  return (
    <div
      data-kc=""
      lang={languageTag}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={getAppearanceStyles(appearance)}
      className={cn(
        'kc:fixed kc:inset-x-4 kc:bottom-4 kc:z-[70] kc:font-body kc:sm:left-auto kc:sm:w-96',
        className
      )}
    >
      {notification && (
        <div
          className={cn(
            'kc:flex kc:items-start kc:gap-3 kc:rounded-input kc:border kc:p-4 kc:text-sm kc:shadow-lg kc:[overflow-wrap:anywhere]',
            notification.variant === 'success'
              ? 'kc:border-positive kc:bg-positive-light kc:text-positive'
              : 'kc:border-critical kc:bg-critical-light kc:text-critical'
          )}
        >
          <p className="kc:flex-1">{t[MESSAGES[notification.code]]}</p>
          <button
            type="button"
            aria-label={t.dismiss}
            onClick={() => dismiss(notification)}
            className="kc:-m-2 kc:flex kc:h-11 kc:w-11 kc:shrink-0 kc:items-center kc:justify-center kc:rounded-md kc:hover:opacity-80 kc:focus-visible:outline-2 kc:focus-visible:outline-current"
          >
            <X className="kc:h-4 kc:w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
