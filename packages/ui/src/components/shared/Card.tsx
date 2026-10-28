'use client';

import { i18nConfig, useLocale } from '@mysamyr/react';

import { cn } from '../../utils/cn.js';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  const locale = useLocale();
  return (
    <div
      data-kc=""
      lang={i18nConfig.languageTags[locale]}
      style={style}
      className={cn(
        'kc:w-full kc:max-w-md kc:rounded-card kc:border kc:border-gray-200 kc:bg-white kc:p-5 kc:text-gray-900 kc:shadow-sm kc:sm:p-8',
        'kc:font-body',
        className
      )}
    >
      {children}
    </div>
  );
}
