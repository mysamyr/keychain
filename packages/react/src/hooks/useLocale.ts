'use client';

import { useContext } from 'react';

import { AuthContext } from '../context/AuthContext.js';
import { i18nConfig, normalizeLocale } from '../i18n/config.js';

export function useLocale() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useLocale must be used within an AuthProvider');
  }
  return normalizeLocale(context.locale) ?? i18nConfig.fallbackLocale;
}
