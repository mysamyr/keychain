import { useCallback } from 'react';

import { useAuthNavigate } from '@mysamyr/react';

export type RoutingStrategy = 'path' | 'hash' | 'virtual';

export interface RoutingOptions {
  routing?: RoutingStrategy;
  path?: string;
}

export function useRouting(options: RoutingOptions = {}) {
  const { routing = 'virtual' } = options;
  const contextNavigate = useAuthNavigate();

  const navigate = useCallback(
    (url: string) => {
      if (contextNavigate) {
        contextNavigate(url);
        return;
      }

      switch (routing) {
        case 'path':
          window.location.href = url;
          break;
        case 'hash':
          window.location.hash = url;
          break;
        case 'virtual':
          break;
      }
    },
    [routing, contextNavigate]
  );

  return { navigate };
}
