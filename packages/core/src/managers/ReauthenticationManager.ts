import { createHash, randomInt } from 'node:crypto';

import type { EmailOutbox } from '../delivery/EmailOutbox.js';
import type { IDatabaseAdapter, User } from '../interfaces/adapter-db.js';
import {
  reauthenticationSchema,
  verifyReauthenticationSchema,
  type ReauthenticationAction,
} from '../schemas/auth.js';
import {
  BEARER_TOKEN_PATTERN,
  generateBearerToken,
  hashToken,
} from '../utils/crypto.js';
import {
  InvalidCredentialsError,
  NotAuthenticatedError,
  ReauthenticationCooldownError,
  ReauthenticationRequiredError,
} from '../utils/errors.js';
import { parseInput } from '../utils/validation.js';

import type { PasswordManager } from './PasswordManager.js';

export const REAUTHENTICATION_CHALLENGE_TTL_MS = 5 * 60_000;
export const REAUTHENTICATION_GRANT_TTL_MS = 5 * 60_000;
export const LINK_AUTHORIZATION_TTL_MS = 10 * 60_000;

export type SensitiveAction =
  | 'delete-account'
  | 'set-password'
  | 'change-email'
  | 'unlink-google'
  | 'link-google';

export interface SensitiveActionAuthorization {
  sessionId: string;
  password?: string | undefined;
  reauthenticationToken?: string | undefined;
}

function hashCode(challengeToken: string, code: string): string {
  return createHash('sha256').update(`${challengeToken}:${code}`).digest('hex');
}

export class ReauthenticationManager {
  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly outbox: EmailOutbox,
    private readonly passwordManager: PasswordManager
  ) {}

  private async assertLiveSession(
    db: IDatabaseAdapter,
    userId: string,
    sessionId: string
  ): Promise<void> {
    const session = await db.getSessionById(sessionId);
    if (
      !session ||
      session.userId !== userId ||
      session.expiresAt <= new Date()
    ) {
      throw new NotAuthenticatedError();
    }
  }

  private async getEligibleUser(
    userId: string,
    sessionId: string
  ): Promise<User> {
    await this.assertLiveSession(this.db, userId, sessionId);
    const user = await this.db.getUserById(userId);
    if (!user?.googleId || user.passwordHash || !user.isEmailVerified) {
      throw new ReauthenticationRequiredError(
        'Use your current password to confirm this action'
      );
    }
    return user;
  }

  async request(
    userId: string,
    sessionId: string,
    action: ReauthenticationAction,
    locale?: string
  ): Promise<string> {
    parseInput(reauthenticationSchema, { action });
    const user = await this.getEligibleUser(userId, sessionId);
    const token = generateBearerToken();
    const code = randomInt(0, 100_000_000).toString().padStart(8, '0');
    const tokenHash = hashToken(token);

    await this.outbox.transaction(this.db, async (tx, enqueue) => {
      const created = await tx.createReauthenticationChallenge({
        tokenHash,
        userId,
        sessionId,
        action,
        kind: 'challenge',
        codeHash: hashCode(token, code),
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + REAUTHENTICATION_CHALLENGE_TTL_MS),
      });
      if (!created) {
        throw new ReauthenticationCooldownError();
      }
      await enqueue(
        {
          to: user.email,
          locale,
          event: 'reauthentication',
          payload: { code, action },
        },
        tokenHash
      );
    });
    return token;
  }

  async verify(
    userId: string,
    sessionId: string,
    action: ReauthenticationAction,
    challengeToken: string,
    code: string
  ): Promise<string> {
    parseInput(verifyReauthenticationSchema, { action, code });
    await this.getEligibleUser(userId, sessionId);
    if (!BEARER_TOKEN_PATTERN.test(challengeToken)) {
      throw new ReauthenticationRequiredError(
        'Request a new confirmation code'
      );
    }
    const valid = await this.db.verifyReauthenticationChallenge({
      tokenHash: hashToken(challengeToken),
      userId,
      sessionId,
      action,
      kind: 'challenge',
      codeHash: hashCode(challengeToken, code),
    });
    if (!valid) {
      throw new ReauthenticationRequiredError(
        'Invalid or expired confirmation code; request a new code after five attempts'
      );
    }
    return this.issueGrant(
      userId,
      sessionId,
      action,
      REAUTHENTICATION_GRANT_TTL_MS
    );
  }

  /** @internal Used by transports to authorize Google linking after a password check. */
  async issuePasswordAuthorization(
    userId: string,
    sessionId: string,
    action: 'link-google',
    password: string
  ): Promise<string> {
    await this.assertLiveSession(this.db, userId, sessionId);
    const user = await this.db.getUserById(userId);
    if (!user) throw new NotAuthenticatedError();
    if (
      !user.passwordHash ||
      !(await this.passwordManager.verify(password, user.passwordHash))
    ) {
      throw new InvalidCredentialsError();
    }
    return this.issueGrant(
      userId,
      sessionId,
      action,
      LINK_AUTHORIZATION_TTL_MS
    );
  }

  /** @internal Must run inside the transaction that performs the sensitive mutation. */
  async authorize(
    db: IDatabaseAdapter,
    user: User,
    action: SensitiveAction,
    authorization: SensitiveActionAuthorization
  ): Promise<void> {
    await this.assertLiveSession(db, user.id, authorization.sessionId);

    if (user.passwordHash && authorization.password) {
      if (
        !(await this.passwordManager.verify(
          authorization.password,
          user.passwordHash
        ))
      ) {
        throw new InvalidCredentialsError();
      }
      return;
    }

    const token = authorization.reauthenticationToken;
    if (
      (!user.passwordHash && (!user.googleId || !user.isEmailVerified)) ||
      !token ||
      !BEARER_TOKEN_PATTERN.test(token)
    ) {
      throw new ReauthenticationRequiredError();
    }
    const grant = await db.consumeReauthenticationGrant({
      tokenHash: hashToken(token),
      userId: user.id,
      sessionId: authorization.sessionId,
      action,
      kind: 'authorization',
    });
    if (!grant) {
      throw new ReauthenticationRequiredError(
        'Authentication confirmation is invalid or expired'
      );
    }
  }

  private async issueGrant(
    userId: string,
    sessionId: string,
    action: SensitiveAction,
    ttlMs: number
  ): Promise<string> {
    const token = generateBearerToken();
    await this.db.createReauthenticationGrant({
      tokenHash: hashToken(token),
      userId,
      sessionId,
      action,
      kind: 'authorization',
      codeHash: null,
      attempts: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttlMs),
    });
    return token;
  }
}
