'use client';

import { useContext } from 'react';

import { AuthContext } from '../context/AuthContext.js';

export function useAuthNavigate(): ((url: string) => void) | undefined {
  return useContext(AuthContext)?.navigate;
}
