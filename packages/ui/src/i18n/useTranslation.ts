'use client';

import { useCallback } from 'react';

import { i18nConfig, useLocale, type Locale } from '@mysamyr/react';

import { en, type Messages } from './en.js';
import { translateError, translateFieldError } from './errors.js';
import { uk } from './uk.js';

const catalogs: Record<Locale, Messages> = { en, uk };

export function useTranslation() {
  const locale = useLocale();
  const t = catalogs[locale];
  const errorMessage = useCallback(
    (error: unknown) => translateError(error, t),
    [t]
  );
  const fieldError = useCallback(
    (error: unknown, field: string) => translateFieldError(error, field, t),
    [t]
  );
  return {
    locale,
    languageTag: i18nConfig.languageTags[locale],
    t,
    errorMessage,
    fieldError,
  };
}
