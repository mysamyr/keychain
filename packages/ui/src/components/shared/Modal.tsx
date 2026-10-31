'use client';

import type { ReactNode } from 'react';

import { i18nConfig, useLocale } from '@mysamyr/react';
import * as Dialog from '@radix-ui/react-dialog';

import { cn } from '../../utils/cn.js';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const locale = useLocale();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="kc:fixed kc:inset-0 kc:z-[60] kc:bg-black/50" />
        <Dialog.Content
          data-kc=""
          lang={i18nConfig.languageTags[locale]}
          className={cn(
            'kc:fixed kc:left-1/2 kc:top-1/2 kc:z-[60] kc:max-h-[calc(100dvh-2rem)] kc:w-[calc(100%-2rem)] kc:max-w-md kc:-translate-x-1/2 kc:-translate-y-1/2 kc:overflow-y-auto kc:rounded-card kc:bg-white kc:p-4 kc:shadow-xl kc:[overflow-wrap:anywhere] kc:sm:p-6',
            className
          )}
        >
          <Dialog.Title className="kc:text-lg kc:font-medium kc:text-gray-900">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="kc:mt-2 kc:text-sm kc:text-gray-500">
              {description}
            </Dialog.Description>
          )}
          <div className="kc:mt-4 kc:space-y-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
