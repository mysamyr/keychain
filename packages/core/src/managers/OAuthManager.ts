import { z } from 'zod/v4';

import type { EmailOutbox } from '../delivery/EmailOutbox.js';
import type { IDatabaseAdapter, User } from '../interfaces/adapter-db.js';
import type { AuthEvents } from '../observability/events.js';
import { normalizeEmail } from '../schemas/auth.js';
import {
  EmailNotVerifiedError,
  OAuthAccountLinkRequiredError,
  OAuthAccountMismatchError,
  OAuthEmailMismatchError,
  OAuthProviderError,
  UniqueConstraintError,
  UserNotFoundError,
} from '../utils/errors.js';

import type {
  ReauthenticationManager,
  SensitiveActionAuthorization,
} from './ReauthenticationManager.js';
import type { SessionManager } from './SessionManager.js';

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().refine(value => value.toLowerCase() === 'bearer'),
  expires_in: z.number().positive(),
});

const profileSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
  picture: z.url().optional(),
});

type GoogleProfile = z.output<typeof profileSchema>;

export interface OAuthResult {
  user: User;
  sessionId: string;
  sessionToken: string;
  expiresAt: Date;
}

export class OAuthManager {
  private static readonly GOOGLE_AUTH_URL =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly GOOGLE_TOKEN_URL =
    'https://oauth2.googleapis.com/token';
  private static readonly GOOGLE_USERINFO_URL =
    'https://www.googleapis.com/oauth2/v3/userinfo';

  /** @internal */
  constructor(
    private readonly config: GoogleConfig,
    private readonly db: IDatabaseAdapter,
    private readonly sessionManager: SessionManager,
    private readonly outbox: EmailOutbox,
    private readonly reauthentication: ReauthenticationManager,
    private readonly events: AuthEvents
  ) {}

  getGoogleAuthUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${OAuthManager.GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async handleGoogleCallback(
    code: string,
    userAgent: string,
    ip: string,
    codeVerifier: string
  ): Promise<OAuthResult> {
    const profile = await this.fetchVerifiedProfile(code, codeVerifier);
    const user =
      (await this.db.getUserByGoogleId(profile.sub)) ??
      (await this.createGoogleUser(profile));

    const { session, token } = await this.sessionManager.create(
      user.id,
      userAgent,
      ip,
      true
    );
    this.events.emit({
      type: 'user.signedIn',
      userId: user.id,
      sessionId: session.id,
      method: 'google',
    });

    return {
      user,
      sessionId: session.id,
      sessionToken: token,
      expiresAt: session.expiresAt,
    };
  }

  async linkGoogleAccount(
    userId: string,
    code: string,
    codeVerifier: string,
    authorization: SensitiveActionAuthorization,
    locale?: string
  ): Promise<User> {
    const profile = await this.fetchVerifiedProfile(code, codeVerifier);

    const user = await this.db.getUserById(userId);
    if (!user) throw new UserNotFoundError();
    if (user.email !== profile.email) {
      throw new OAuthEmailMismatchError();
    }

    const linkedUser = await this.db.getUserByGoogleId(profile.sub);
    if (linkedUser && linkedUser.id !== userId) {
      throw new OAuthAccountMismatchError();
    }

    try {
      const updated = await this.outbox.transaction(
        this.db,
        async (tx, enqueue) => {
          const current = await tx.getUserById(userId);
          if (!current) throw new UserNotFoundError();
          await this.reauthentication.authorize(
            tx,
            current,
            'link-google',
            authorization
          );
          const result = await tx.updateUser(userId, {
            googleId: profile.sub,
            isEmailVerified: true,
            verificationTokenHash: undefined,
            verificationTokenExpiresAt: undefined,
          });
          if (!current.googleId) {
            await enqueue(
              {
                to: result.email,
                locale,
                event: 'accountLinked',
                payload: { provider: 'Google' },
              },
              profile.sub
            );
          }
          return result;
        }
      );
      this.events.emit({ type: 'oauth.linked', userId, provider: 'google' });
      return updated;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new OAuthAccountMismatchError();
      }
      throw error;
    }
  }

  private async createGoogleUser(profile: GoogleProfile): Promise<User> {
    if (await this.db.getUserByEmail(profile.email)) {
      throw new OAuthAccountLinkRequiredError();
    }
    try {
      const user = await this.db.createUser({
        email: profile.email,
        isEmailVerified: true,
        googleId: profile.sub,
      });
      this.events.emit({
        type: 'user.registered',
        userId: user.id,
        method: 'google',
      });
      return user;
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) throw error;
      if (error.field === 'email') throw new OAuthAccountLinkRequiredError();
      const existing = await this.db.getUserByGoogleId(profile.sub);
      if (!existing) throw error;
      return existing;
    }
  }

  private async fetchVerifiedProfile(
    code: string,
    codeVerifier: string
  ): Promise<GoogleProfile> {
    const tokenData = await this.exchangeCodeForToken(code, codeVerifier);
    const profile = await this.fetchGoogleProfile(tokenData.access_token);
    if (!profile.email_verified) {
      throw new EmailNotVerifiedError();
    }
    return { ...profile, email: normalizeEmail(profile.email) };
  }

  private async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<z.output<typeof tokenResponseSchema>> {
    const body = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    const response = await this.fetchProvider(OAuthManager.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const parsed = tokenResponseSchema.safeParse(
      await this.providerJson(response)
    );
    if (!parsed.success) {
      throw new OAuthProviderError(
        'Google returned an invalid token response',
        'OAUTH_PROVIDER_INVALID_RESPONSE'
      );
    }
    return parsed.data;
  }

  private async fetchGoogleProfile(
    accessToken: string
  ): Promise<GoogleProfile> {
    const response = await this.fetchProvider(
      OAuthManager.GOOGLE_USERINFO_URL,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const parsed = profileSchema.safeParse(await this.providerJson(response));
    if (!parsed.success) {
      throw new OAuthProviderError(
        'Google returned an invalid profile response',
        'OAUTH_PROVIDER_INVALID_RESPONSE'
      );
    }
    return parsed.data;
  }

  private async fetchProvider(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (!(error instanceof TypeError || error instanceof DOMException)) {
        throw error;
      }
      throw new OAuthProviderError(
        'Google OAuth provider request failed',
        'OAUTH_PROVIDER_ERROR'
      );
    }
    if (!response.ok) {
      throw new OAuthProviderError(
        `Google OAuth provider returned ${response.status}`,
        'OAUTH_PROVIDER_ERROR'
      );
    }
    return response;
  }

  private async providerJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch (error) {
      if (!(error instanceof SyntaxError || error instanceof TypeError)) {
        throw error;
      }
      throw new OAuthProviderError(
        'Google returned an invalid JSON response',
        'OAUTH_PROVIDER_INVALID_RESPONSE'
      );
    }
  }
}
