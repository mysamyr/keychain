'use client';

import { useState } from 'react';

import { useAuth, useUser } from '@mysamyr/react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Settings, X } from 'lucide-react';

import { useTranslation } from '../../i18n/useTranslation.js';
import type { UserButtonProps } from '../../types';
import { getAppearanceStyles } from '../../utils/appearance.js';
import { cn } from '../../utils/cn.js';
import { UserProfile } from '../UserProfile';

function UserAvatar({
  email,
  avatarUrl,
  size = 'md',
}: {
  email: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'kc:h-7 kc:w-7 kc:text-xs',
    md: 'kc:h-9 kc:w-9 kc:text-sm',
    lg: 'kc:h-12 kc:w-12 kc:text-base',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={email}
        className={cn('kc:rounded-full kc:object-cover', sizeClasses[size])}
      />
    );
  }

  const initial = email.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'kc:flex kc:items-center kc:justify-center kc:rounded-full kc:bg-accent kc:font-medium kc:text-white',
        sizeClasses[size]
      )}
    >
      {initial}
    </div>
  );
}

export function UserButton({
  appearance,
  className,
  afterSignOutUrl,
  showName = false,
}: UserButtonProps) {
  const { t, languageTag } = useTranslation();
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!isLoaded || !user) {
    return (
      <div
        data-kc=""
        aria-hidden="true"
        className={cn(
          'kc:h-9 kc:w-9 kc:animate-pulse kc:rounded-full kc:bg-gray-200',
          className
        )}
      />
    );
  }

  const handleSignOut = () => {
    void signOut().then(() => {
      if (afterSignOutUrl) {
        window.location.href = afterSignOutUrl;
      }
    });
  };

  const style = getAppearanceStyles(appearance);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            data-kc=""
            type="button"
            aria-label={t.userMenu}
            lang={languageTag}
            className={cn(
              'kc:flex kc:items-center kc:gap-2 kc:rounded-full kc:p-0.5 kc:transition-opacity kc:hover:opacity-80 kc:focus-visible:outline-2 kc:focus-visible:outline-offset-2 kc:focus-visible:outline-accent',
              className
            )}
            style={style}
          >
            <UserAvatar email={user.email} avatarUrl={user.avatarUrl} />
            {showName && (
              <span className="kc:text-sm kc:font-medium kc:text-gray-700">
                {user.email}
              </span>
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            data-kc=""
            lang={languageTag}
            className="kc:z-50 kc:min-w-[220px] kc:rounded-card kc:border kc:border-gray-200 kc:bg-white kc:p-1.5 kc:shadow-lg"
            sideOffset={8}
            align="end"
          >
            <div className="kc:px-3 kc:py-2">
              <p className="kc:text-sm kc:font-medium kc:text-gray-900">
                {user.email}
              </p>
              {!user.isEmailVerified && (
                <p className="kc:text-xs kc:text-amber-600">
                  {t.emailNotVerified}
                </p>
              )}
            </div>

            <DropdownMenu.Separator className="kc:my-1 kc:h-px kc:bg-gray-100" />

            <DropdownMenu.Item
              className="kc:flex kc:cursor-pointer kc:items-center kc:gap-2 kc:rounded-md kc:px-3 kc:py-2 kc:text-sm kc:text-gray-700 kc:outline-none kc:transition-colors kc:hover:bg-gray-50 kc:focus:bg-gray-50"
              onSelect={() => setProfileOpen(true)}
            >
              <Settings className="kc:h-4 kc:w-4" />
              {t.manageAccount}
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="kc:my-1 kc:h-px kc:bg-gray-100" />

            <DropdownMenu.Item
              className="kc:flex kc:cursor-pointer kc:items-center kc:gap-2 kc:rounded-md kc:px-3 kc:py-2 kc:text-sm kc:text-critical kc:outline-none kc:transition-colors kc:hover:bg-critical-light kc:focus:bg-critical-light"
              onSelect={handleSignOut}
            >
              <LogOut className="kc:h-4 kc:w-4" />
              {t.signOut}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog.Root open={profileOpen} onOpenChange={setProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="kc:fixed kc:inset-0 kc:z-50 kc:bg-black/50" />
          <Dialog.Content
            data-kc=""
            lang={languageTag}
            aria-describedby={undefined}
            className="kc:fixed kc:left-1/2 kc:top-1/2 kc:z-50 kc:flex kc:max-h-[calc(100dvh-2rem)] kc:w-[calc(100%-2rem)] kc:max-w-2xl kc:-translate-x-1/2 kc:-translate-y-1/2 kc:flex-col kc:overflow-hidden kc:rounded-card kc:bg-white kc:p-0 kc:shadow-xl"
            style={style}
          >
            <div className="kc:flex kc:shrink-0 kc:items-center kc:justify-between kc:gap-4 kc:border-b kc:border-gray-200 kc:px-4 kc:py-2 kc:sm:px-6">
              <Dialog.Title className="kc:min-w-0 kc:text-lg kc:font-medium kc:text-gray-900">
                {t.accountSettings}
              </Dialog.Title>
              <Dialog.Close className="kc:flex kc:h-11 kc:w-11 kc:shrink-0 kc:items-center kc:justify-center kc:rounded-md kc:text-gray-400 kc:transition-colors kc:hover:bg-gray-100 kc:hover:text-gray-600 kc:focus-visible:outline-2 kc:focus-visible:outline-offset-2 kc:focus-visible:outline-accent">
                <X className="kc:h-5 kc:w-5" />
                <span className="kc:sr-only">{t.close}</span>
              </Dialog.Close>
            </div>
            <div className="kc:flex kc:min-h-0 kc:overflow-hidden">
              <UserProfile
                appearance={appearance}
                className="kc:sm:h-[480px] kc:sm:max-h-[calc(100dvh-2rem)]"
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
