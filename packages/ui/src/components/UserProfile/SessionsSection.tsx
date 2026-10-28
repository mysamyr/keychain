'use client';

import { useCallback } from 'react';

import { type SessionDTO, useSession } from '@mysamyr/react';
import { Monitor, Smartphone, Trash2 } from 'lucide-react';

import { useTranslation } from '../../i18n/useTranslation.js';
import { cn } from '../../utils/cn.js';
import { Badge, Button } from '../shared';

function parseUserAgent(userAgent: string) {
  if (/mobile|android|iphone/i.test(userAgent)) {
    return { icon: Smartphone, label: 'mobileDevice' as const };
  }
  return { icon: Monitor, label: 'desktopDevice' as const };
}

function SessionItem({
  session,
  onRevoke,
}: {
  session: SessionDTO;
  onRevoke: (id: string) => void;
}) {
  const { t, languageTag } = useTranslation();
  const { icon: DeviceIcon, label } = parseUserAgent(session.userAgent);

  return (
    <div
      className={cn(
        'kc:flex kc:items-center kc:justify-between kc:gap-2 kc:rounded-lg kc:border kc:p-3 kc:sm:p-4',
        session.isCurrent
          ? 'kc:border-accent/30 kc:bg-accent-light'
          : 'kc:border-gray-200'
      )}
    >
      <div className="kc:flex kc:min-w-0 kc:items-center kc:gap-2 kc:sm:gap-3">
        <DeviceIcon className="kc:h-5 kc:w-5 kc:shrink-0 kc:text-gray-500" />
        <div className="kc:min-w-0">
          <p className="kc:flex kc:flex-wrap kc:items-center kc:gap-x-2 kc:gap-y-1 kc:text-sm kc:font-medium kc:text-gray-900">
            {t[label]}
            {session.isCurrent && (
              <Badge variant="primary">{t.currentSession}</Badge>
            )}
          </p>
          <p className="kc:text-xs kc:text-gray-500">
            {session.ip} &middot;{' '}
            {new Date(session.createdAt).toLocaleDateString(languageTag)}
          </p>
        </div>
      </div>

      {!session.isCurrent && (
        <button
          type="button"
          onClick={() => onRevoke(session.id)}
          className="kc:flex kc:h-11 kc:w-11 kc:shrink-0 kc:items-center kc:justify-center kc:rounded-md kc:text-gray-400 kc:transition-colors kc:hover:bg-gray-100 kc:hover:text-critical kc:focus-visible:outline-2 kc:focus-visible:outline-offset-2 kc:focus-visible:outline-accent kc:sm:h-7 kc:sm:w-7"
          aria-label={t.revokeSession}
          title={t.revokeSession}
        >
          <Trash2 className="kc:h-4 kc:w-4" />
        </button>
      )}
    </div>
  );
}

export function SessionsSection({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { sessions, isLoading, revokeSession, revokeAllOtherSessions } =
    useSession();

  const handleRevoke = useCallback(
    (sessionId: string) => {
      void revokeSession(sessionId);
    },
    [revokeSession]
  );

  const handleRevokeAll = useCallback(() => {
    void revokeAllOtherSessions();
  }, [revokeAllOtherSessions]);

  if (isLoading) {
    return (
      <div className={cn('kc:space-y-4', className)}>
        <div className="kc:h-6 kc:w-48 kc:max-w-full kc:animate-pulse kc:rounded kc:bg-gray-200" />
        <div className="kc:space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="kc:h-16 kc:animate-pulse kc:rounded-lg kc:bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('kc:space-y-6', className)}>
      <div className="kc:flex kc:flex-col kc:items-start kc:gap-4 kc:sm:flex-row kc:sm:items-center kc:sm:justify-between">
        <div>
          <h3 className="kc:text-lg kc:font-medium kc:text-gray-900">
            {t.activeSessions}
          </h3>
          <p className="kc:text-sm kc:text-gray-500">{t.sessionsSubtitle}</p>
        </div>
        {sessions && sessions.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            className="kc:min-h-11 kc:w-full kc:shrink-0 kc:sm:min-h-0 kc:sm:w-auto"
            onClick={handleRevokeAll}
          >
            {t.revokeOthers}
          </Button>
        )}
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="kc:space-y-3">
          {sessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      ) : (
        <p className="kc:text-sm kc:text-gray-500">{t.noSessions}</p>
      )}
    </div>
  );
}
