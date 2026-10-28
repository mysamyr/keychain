'use client';

import { createContext } from 'react';

import type { KeychainClient, UserDTO } from '@mysamyr/client';
import type { AuthPages } from '@mysamyr/core/endpoints';

import type { AuthNotification } from '../hooks/useAuthNotifications.js';

export interface AuthState {
  user: UserDTO | null;
  /** True once the first `/me` request settled, or `initialState` was provided. */
  isLoaded: boolean;
  isSignedIn: boolean;
  /** The last `/me` failure other than "not signed in"; the previous user is kept. */
  error: Error | null;
}

export interface AuthContextValue extends AuthState {
  locale: string;
  client: KeychainClient;
  pages: AuthPages;
  signOut: () => Promise<void>;
  mutateUser: (data?: UserDTO | null) => Promise<void>;
  navigate?: ((url: string) => void) | undefined;
  notifications: AuthNotification[];
  dismissNotification: (notification: AuthNotification) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
