'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { KeyRound, Monitor, User } from 'lucide-react';

import { useTranslation } from '../../i18n/useTranslation.js';
import type { UserProfileProps } from '../../types';
import { getAppearanceStyles } from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';

import { ProfileSection } from './ProfileSection.js';
import { SecuritySection } from './SecuritySection.js';
import { SessionsSection } from './SessionsSection.js';

export function UserProfile({ appearance, className }: UserProfileProps) {
  const { t, languageTag } = useTranslation();
  const style = getAppearanceStyles(appearance);

  return (
    <div
      data-kc=""
      lang={languageTag}
      className={cn(
        'kc:flex kc:h-[480px] kc:max-h-[calc(100dvh-2rem)] kc:min-h-0 kc:min-w-0 kc:w-full kc:flex-col kc:rounded-card kc:bg-white kc:text-gray-900 kc:font-body kc:[overflow-wrap:anywhere] kc:sm:h-full kc:sm:max-h-none',
        className
      )}
      style={style}
    >
      <Tabs.Root
        defaultValue="profile"
        className="kc:flex kc:min-h-0 kc:min-w-0 kc:flex-1 kc:flex-col kc:overflow-hidden kc:sm:flex-row"
      >
        <Tabs.List
          aria-label={t.accountSettings}
          className="kc:flex kc:shrink-0 kc:gap-1 kc:border-b kc:border-gray-200 kc:p-2 kc:sm:w-52 kc:sm:flex-col kc:sm:border-r kc:sm:border-b-0 kc:sm:p-4"
        >
          <Tabs.Trigger
            value="profile"
            className="kc:flex kc:min-h-11 kc:min-w-0 kc:flex-1 kc:flex-col kc:items-center kc:justify-center kc:gap-1 kc:rounded-md kc:px-2 kc:py-2 kc:text-sm kc:text-gray-600 kc:transition-colors kc:data-[state=active]:bg-gray-100 kc:data-[state=active]:font-medium kc:data-[state=active]:text-gray-900 kc:sm:min-h-0 kc:sm:flex-none kc:sm:flex-row kc:sm:justify-start kc:sm:gap-2 kc:sm:px-3 kc:sm:text-left"
          >
            <User className="kc:h-4 kc:w-4 kc:shrink-0" />
            {t.profile}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="security"
            className="kc:flex kc:min-h-11 kc:min-w-0 kc:flex-1 kc:flex-col kc:items-center kc:justify-center kc:gap-1 kc:rounded-md kc:px-2 kc:py-2 kc:text-sm kc:text-gray-600 kc:transition-colors kc:data-[state=active]:bg-gray-100 kc:data-[state=active]:font-medium kc:data-[state=active]:text-gray-900 kc:sm:min-h-0 kc:sm:flex-none kc:sm:flex-row kc:sm:justify-start kc:sm:gap-2 kc:sm:px-3 kc:sm:text-left"
          >
            <KeyRound className="kc:h-4 kc:w-4 kc:shrink-0" />
            {t.security}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="sessions"
            className="kc:flex kc:min-h-11 kc:min-w-0 kc:flex-1 kc:flex-col kc:items-center kc:justify-center kc:gap-1 kc:rounded-md kc:px-2 kc:py-2 kc:text-sm kc:text-gray-600 kc:transition-colors kc:data-[state=active]:bg-gray-100 kc:data-[state=active]:font-medium kc:data-[state=active]:text-gray-900 kc:sm:min-h-0 kc:sm:flex-none kc:sm:flex-row kc:sm:justify-start kc:sm:gap-2 kc:sm:px-3 kc:sm:text-left"
          >
            <Monitor className="kc:h-4 kc:w-4 kc:shrink-0" />
            {t.sessions}
          </Tabs.Trigger>
        </Tabs.List>

        <div className="kc:min-h-0 kc:min-w-0 kc:flex-1 kc:overflow-y-auto kc:overscroll-contain kc:p-4 kc:sm:p-6">
          <Tabs.Content value="profile">
            <ProfileSection />
          </Tabs.Content>
          <Tabs.Content value="security">
            <SecuritySection />
          </Tabs.Content>
          <Tabs.Content value="sessions">
            <SessionsSection />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
