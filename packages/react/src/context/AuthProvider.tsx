'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { AuthApiError, KeychainClient, type UserDTO } from '@mysamyr/client';
import {
  type AuthEndpoints,
  type AuthPages,
  DEFAULT_PAGES,
} from '@mysamyr/core/endpoints';
import useSWR, { SWRConfig, useSWRConfig, type Cache } from 'swr';

import { useRedirectNotifications } from '../hooks/useAuthNotifications.js';

import { AuthContext, type AuthContextValue } from './AuthContext.js';
import { meKey, sessionsKey, SWR_OPTIONS } from './swr.js';

interface CommonProps {
  /** @default 'en'; the host owns language state. */
  locale?: string;
  /** Frontend page paths used by UI links; merged with `DEFAULT_PAGES`. */
  pages?: Partial<AuthPages>;
  navigate?: (url: string) => void;
  /**
   * Known user from server rendering. When provided (including `{ user: null }`),
   * the first render is loaded and the initial `/me` request is skipped.
   */
  initialState?: { user: UserDTO | null };
  children: ReactNode;
}

interface UrlProps {
  /** Origin of the API, or `''` for the page's origin. */
  apiBaseUrl: string;
  /** @default '/api/auth' */
  authBasePath?: string;
  endpoints?: Partial<AuthEndpoints>;
  client?: never;
}

interface ClientProps {
  /** A preconfigured client, instead of `apiBaseUrl`. */
  client: KeychainClient;
  apiBaseUrl?: never;
  authBasePath?: never;
  endpoints?: never;
}

export type AuthProviderProps = CommonProps & (UrlProps | ClientProps);

export function AuthProvider(props: AuthProviderProps) {
  const [cache] = useState<Cache>(() => new Map());
  const config = useMemo(
    () => ({ ...SWR_OPTIONS, provider: () => cache }),
    [cache]
  );

  return (
    <SWRConfig value={config}>
      <AuthStateProvider {...props} />
    </SWRConfig>
  );
}

function AuthStateProvider({
  apiBaseUrl,
  authBasePath,
  endpoints,
  client: providedClient,
  locale = 'en',
  pages,
  navigate,
  initialState,
  children,
}: AuthProviderProps) {
  const endpointsKey = JSON.stringify(endpoints ?? {});
  const client = useMemo(
    () =>
      providedClient ??
      new KeychainClient(apiBaseUrl ?? '', {
        authBasePath,
        endpoints: JSON.parse(endpointsKey) as Partial<AuthEndpoints>,
        locale,
      }),
    // Locale changes update the existing client in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [providedClient, apiBaseUrl, authBasePath, endpointsKey]
  );

  useEffect(() => {
    client.setLocale(locale);
  }, [client, locale]);

  const {
    data,
    error,
    mutate: mutateMe,
  } = useSWR<UserDTO | null, Error>(
    meKey(client.apiUrl),
    async () => {
      try {
        return await client.getMe();
      } catch (err) {
        if (err instanceof AuthApiError && err.statusCode === 401) return null;
        throw err;
      }
    },
    {
      ...SWR_OPTIONS,
      ...(initialState && {
        fallbackData: initialState.user,
        revalidateOnMount: false,
      }),
    }
  );

  const user = data ?? null;
  const { mutate } = useSWRConfig();
  useEffect(() => {
    if (user === null) {
      void mutate(sessionsKey(client.apiUrl), undefined, {
        revalidate: false,
      });
    }
  }, [user, client, mutate]);

  const signOut = useCallback(async () => {
    await client.signOut();
    await mutateMe(null, { revalidate: false });
  }, [client, mutateMe]);

  const mutateUser = useCallback(
    async (next?: UserDTO | null) => {
      if (next !== undefined) {
        await mutateMe(next, { revalidate: false });
      } else {
        await mutateMe();
      }
    },
    [mutateMe]
  );

  const pagesKey = JSON.stringify(pages ?? {});
  const resolvedPages = useMemo<AuthPages>(
    () => ({
      ...DEFAULT_PAGES,
      ...(JSON.parse(pagesKey) as Partial<AuthPages>),
    }),
    [pagesKey]
  );

  const { notifications, dismissNotification } = useRedirectNotifications();
  const isLoaded = data !== undefined || error !== undefined;

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      locale,
      user,
      isLoaded,
      isSignedIn: user !== null,
      error: error ?? null,
      client,
      pages: resolvedPages,
      signOut,
      mutateUser,
      navigate,
      notifications,
      dismissNotification,
    }),
    [
      locale,
      user,
      isLoaded,
      error,
      client,
      resolvedPages,
      signOut,
      mutateUser,
      navigate,
      notifications,
      dismissNotification,
    ]
  );

  return <AuthContext value={contextValue}>{children}</AuthContext>;
}
