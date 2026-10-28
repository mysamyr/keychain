'use client';

import { useContext } from 'react';

import { AuthContext } from '../context/AuthContext.js';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    locale: context.locale,
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    error: context.error,
    userId: context.user?.id ?? null,
    signOut: context.signOut,
  };
}
