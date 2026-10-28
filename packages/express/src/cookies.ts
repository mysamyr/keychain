import type {
  CookieOptions as ExpressCookieOptions,
  Request,
  Response,
} from 'express';

export interface CookieOptions {
  /** Prefix for every cookie name, e.g. `keychain_session`. */
  prefix: string;
  domain?: string | undefined;
  path: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

const COOKIE_SUFFIXES = {
  session: 'session',
  reauthentication: 'reauth',
  reauthenticationChallenge: 'reauth_challenge',
  oauthState: 'oauth_state',
  oauthVerifier: 'oauth_pkce',
  oauthLinkUser: 'oauth_link',
} as const;

export type CookieName = keyof typeof COOKIE_SUFFIXES;

function parseCookieHeader(header: string | undefined, name: string) {
  for (const pair of header?.split(';') ?? []) {
    const index = pair.indexOf('=');
    if (index === -1 || pair.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(pair.slice(index + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function createCookies(overrides?: Partial<CookieOptions>) {
  const options: CookieOptions = {
    prefix: 'keychain',
    path: '/',
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    ...overrides,
  };
  if (options.sameSite === 'none' && !options.secure) {
    throw new Error('SameSite=None cookies require secure: true');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(options.prefix)) {
    throw new Error('Cookie prefix may contain only letters, digits, _ and -');
  }

  const base: ExpressCookieOptions = {
    httpOnly: true,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    ...(options.domain && { domain: options.domain }),
  };
  const nameOf = (name: CookieName) =>
    `${options.prefix}_${COOKIE_SUFFIXES[name]}`;

  return {
    secure: options.secure,
    read(req: Request, name: CookieName): string | undefined {
      const parsed = req.cookies as Record<string, unknown> | undefined;
      const value = parsed
        ? parsed[nameOf(name)]
        : parseCookieHeader(req.headers.cookie, nameOf(name));
      return typeof value === 'string' && value ? value : undefined;
    },
    set(res: Response, name: CookieName, value: string, maxAgeMs: number) {
      res.cookie(nameOf(name), value, { ...base, maxAge: maxAgeMs });
    },
    setSession(res: Response, token: string, expiresAt: Date) {
      res.cookie(nameOf('session'), token, { ...base, expires: expiresAt });
    },
    clear(res: Response, ...names: CookieName[]) {
      for (const name of names) res.clearCookie(nameOf(name), base);
    },
  };
}

export type Cookies = ReturnType<typeof createCookies>;
