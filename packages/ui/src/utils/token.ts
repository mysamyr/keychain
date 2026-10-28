import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

const readUrlToken = () =>
  new URLSearchParams(window.location.search).get('token') ?? '';

/** The explicit token, or `?token=` from the current URL (empty during SSR). */
export function useUrlToken(token: string | undefined): string {
  const fromUrl = useSyncExternalStore(subscribe, readUrlToken, () => '');
  return (token ?? fromUrl).trim();
}
