import {
  type AuthEndpoints,
  DEFAULT_ENDPOINTS,
  compilePath,
} from '@mysamyr/core/endpoints';

import type {
  ChangePasswordDTO,
  CancelEmailChangeDTO,
  ConfirmEmailChangeDTO,
  ConfirmPasswordDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  VerifyResetTokenDTO,
  SessionDTO,
  LoginDTO,
  AuthResponseDTO,
  RegisterDTO,
  RegisterResponseDTO,
  UpdateProfileDTO,
  UserDTO,
  VerifyEmailDTO,
  SensitiveActionDTO,
  ReauthenticationDTO,
  VerifyReauthenticationDTO,
} from '@mysamyr/core/schemas';

import { AuthApiError } from './types.js';

export interface KeychainClientOptions {
  /**
   * The path prefix for all auth routes, relative to `baseUrl`.
   * @default '/api/auth'
   */
  authBasePath?: string;
  /**
   * Override individual endpoint paths (relative to `authBasePath`).
   * Merged with DEFAULT_ENDPOINTS.
   */
  endpoints?: Partial<AuthEndpoints>;
  /**
   * Locale sent in Accept-Language.
   * @default 'en'
   */
  locale?: string;
  /**
   * Abort requests that take longer than this.
   * @default 15000
   */
  timeoutMs?: number;
  /** Custom `fetch`, e.g. for server-side rendering or proxies. */
  fetch?: typeof fetch;
  /** Extra headers for every request, e.g. a forwarded `cookie` on the server. */
  headers?: Record<string, string>;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(
      messages =>
        Array.isArray(messages) &&
        messages.every(message => typeof message === 'string')
    )
  );
}

function toApiError(response: Response, body: unknown): AuthApiError {
  const data =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {};
  return new AuthApiError(
    response.status,
    typeof data['message'] === 'string'
      ? data['message']
      : response.statusText || 'Request failed',
    typeof data['code'] === 'string' ? data['code'] : 'UNKNOWN_ERROR',
    isFieldErrors(data['fieldErrors']) ? data['fieldErrors'] : undefined
  );
}

export class KeychainClient {
  /** Absolute or same-origin URL of the auth API, without a trailing slash. */
  readonly apiUrl: string;
  private readonly endpoints: AuthEndpoints;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly headers: Record<string, string>;
  private locale: string;

  /** Pass `''` as `baseUrl` when the API is served from the page's origin. */
  constructor(baseUrl: string, options?: KeychainClientOptions) {
    const basePath = trimSlashes(options?.authBasePath ?? '/api/auth');
    const url = [baseUrl.replace(/\/+$/, ''), basePath]
      .filter(Boolean)
      .join('/');
    const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(url);
    this.apiUrl = isAbsolute || !url ? url : `/${trimSlashes(url)}`;
    this.endpoints = { ...DEFAULT_ENDPOINTS, ...options?.endpoints };
    this.locale = options?.locale ?? 'en';
    this.timeoutMs = options?.timeoutMs ?? 15_000;
    this.fetchImpl = options?.fetch ?? ((...args) => fetch(...args));
    this.headers = options?.headers ?? {};
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  // Auth
  async signIn(
    credentials: LoginDTO,
    options?: RequestOptions
  ): Promise<AuthResponseDTO> {
    return this.request('POST', this.endpoints.signIn, credentials, options);
  }

  async signUp(
    data: RegisterDTO,
    options?: RequestOptions
  ): Promise<RegisterResponseDTO> {
    return this.request('POST', this.endpoints.signUp, data, options);
  }

  async signOut(options?: RequestOptions): Promise<void> {
    await this.request('POST', this.endpoints.signOut, undefined, options);
  }

  async verifyEmail(
    data: VerifyEmailDTO,
    options?: RequestOptions
  ): Promise<AuthResponseDTO> {
    return this.request('POST', this.endpoints.verifyEmail, data, options);
  }

  async resendVerification(
    email: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.request(
      'POST',
      this.endpoints.resendVerification,
      { email },
      options
    );
  }

  async forgotPassword(
    data: ForgotPasswordDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request('POST', this.endpoints.forgotPassword, data, options);
  }

  async resetPassword(
    data: ResetPasswordDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request('POST', this.endpoints.resetPassword, data, options);
  }

  async verifyResetToken(
    data: VerifyResetTokenDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request('POST', this.endpoints.verifyResetToken, data, options);
  }

  // Session / User
  async getMe(options?: RequestOptions): Promise<UserDTO> {
    return this.request('GET', this.endpoints.me, undefined, options);
  }

  async updateMe(
    data: UpdateProfileDTO,
    options?: RequestOptions
  ): Promise<UserDTO> {
    return this.request('PATCH', this.endpoints.me, data, options);
  }

  async deleteMe(
    data: SensitiveActionDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request('DELETE', this.endpoints.me, data, options);
  }

  async confirmEmailChange(
    data: ConfirmEmailChangeDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request(
      'POST',
      this.endpoints.confirmEmailChange,
      data,
      options
    );
  }

  async cancelEmailChange(
    data: CancelEmailChangeDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request(
      'DELETE',
      this.endpoints.cancelEmailChange,
      data,
      options
    );
  }

  async changePassword(
    data: ChangePasswordDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request('POST', this.endpoints.changePassword, data, options);
  }

  async unlinkGoogle(
    data: ConfirmPasswordDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request('DELETE', this.endpoints.unlinkGoogle, data, options);
  }

  // Sessions
  async getSessions(options?: RequestOptions): Promise<SessionDTO[]> {
    return this.request('GET', this.endpoints.getSessions, undefined, options);
  }

  async revokeSession(id: string, options?: RequestOptions): Promise<void> {
    await this.request(
      'DELETE',
      compilePath(this.endpoints.revokeSession, { id: encodeURIComponent(id) }),
      undefined,
      options
    );
  }

  async revokeOtherSessions(options?: RequestOptions): Promise<void> {
    await this.request(
      'POST',
      this.endpoints.revokeOtherSessions,
      undefined,
      options
    );
  }

  // OAuth
  getGoogleOAuthUrl(): string {
    return this.buildUrl(this.endpoints.googleOAuth);
  }

  async startGoogleLink(
    data: ConfirmPasswordDTO,
    options?: RequestOptions
  ): Promise<{ url: string }> {
    return this.request('POST', this.endpoints.googleOAuthLink, data, options);
  }

  async requestReauthentication(
    data: ReauthenticationDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request(
      'POST',
      this.endpoints.requestReauthentication,
      data,
      options
    );
  }

  async verifyReauthentication(
    data: VerifyReauthenticationDTO,
    options?: RequestOptions
  ): Promise<void> {
    await this.request(
      'POST',
      this.endpoints.verifyReauthentication,
      data,
      options
    );
  }

  private buildUrl(path: string): string {
    return `${this.apiUrl}/${trimSlashes(path)}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    options: RequestOptions | undefined
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...this.headers,
      Accept: 'application/json',
      'Accept-Language': this.locale,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const timeout = AbortSignal.timeout(this.timeoutMs);
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout;

    let response: Response;
    let text: string;
    try {
      response = await this.fetchImpl(this.buildUrl(path), {
        method,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });
      text = await response.text();
    } catch (error) {
      if (options?.signal?.aborted) throw error;
      if (timeout.aborted) {
        throw new AuthApiError(0, 'Request timed out', 'TIMEOUT');
      }
      throw new AuthApiError(0, 'Network request failed', 'NETWORK_ERROR');
    }

    const isJson = /\bjson\b/i.test(response.headers.get('content-type') ?? '');
    const data = text && isJson ? parseJson(text) : undefined;

    if (!response.ok) throw toApiError(response, data);
    if (text && data === undefined) {
      throw new AuthApiError(
        response.status,
        'Invalid JSON response',
        'INVALID_RESPONSE'
      );
    }
    return data as T;
  }
}
