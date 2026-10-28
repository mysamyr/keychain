import type { SWRConfiguration } from 'swr';

/** Fixed options so a host `SWRConfig` cannot change auth state behavior. */
export const SWR_OPTIONS = {
  suspense: false,
  keepPreviousData: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  refreshInterval: 0,
  shouldRetryOnError: false,
  dedupingInterval: 2000,
  onSuccess: () => undefined,
  onError: () => undefined,
} satisfies SWRConfiguration;

export const meKey = (apiUrl: string) => [apiUrl, 'me'] as const;
export const sessionsKey = (apiUrl: string) => [apiUrl, 'sessions'] as const;
