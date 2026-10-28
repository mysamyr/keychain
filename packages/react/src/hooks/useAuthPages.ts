'use client';

import { useContext } from 'react';

import type { AuthPages } from '@mysamyr/core/endpoints';

import { AuthContext } from '../context/AuthContext.js';

/** Frontend page paths from `AuthProvider`'s `pages`, merged with the defaults. */
export function useAuthPages(): AuthPages {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthPages must be used within an AuthProvider');
  }
  return context.pages;
}
