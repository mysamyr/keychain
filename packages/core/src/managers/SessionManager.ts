import type { IDatabaseAdapter, Session } from '../interfaces/adapter-db.js';
import type { AuthEvents } from '../observability/events.js';
import {
  BEARER_TOKEN_PATTERN,
  generateBearerToken,
  hashToken,
} from '../utils/crypto.js';
import { SessionExpiredError, SessionNotFoundError } from '../utils/errors.js';

export interface CreatedSession {
  session: Session;
  token: string;
}

export class SessionManager {
  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly sessionTtlMs: number,
    private readonly rememberMeTtlMs: number,
    private readonly events: AuthEvents
  ) {}

  async create(
    userId: string,
    userAgent: string,
    ip: string,
    rememberMe: boolean
  ): Promise<CreatedSession> {
    const ttl = rememberMe ? this.rememberMeTtlMs : this.sessionTtlMs;
    const token = generateBearerToken();
    const session = await this.db.createSession({
      userId,
      expiresAt: new Date(Date.now() + ttl),
      userAgent,
      ip,
      tokenHash: hashToken(token),
    });
    return { session, token };
  }

  /** Throws `SessionExpiredError` only for missing/expired sessions; storage errors propagate. */
  async validate(token: string): Promise<Session> {
    if (typeof token !== 'string' || !BEARER_TOKEN_PATTERN.test(token)) {
      throw new SessionExpiredError();
    }

    const session = await this.db.getSessionByTokenHash(hashToken(token));
    if (!session) {
      throw new SessionExpiredError();
    }

    if (session.expiresAt <= new Date()) {
      await this.db.revokeUserSession(session.userId, session.id);
      throw new SessionExpiredError();
    }

    return session;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return this.db.getUserSessions(userId);
  }

  async revoke(sessionId: string): Promise<void> {
    await this.db.revokeSession(sessionId);
  }

  async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    const revoked = await this.db.revokeUserSession(userId, sessionId);
    if (!revoked) {
      throw new SessionNotFoundError();
    }
    this.events.emit({
      type: 'session.revoked',
      userId,
      sessionId,
      scope: 'single',
    });
  }

  async revokeOthers(userId: string, currentSessionId: string): Promise<void> {
    await this.db.revokeOtherUserSessions(userId, currentSessionId);
    this.events.emit({ type: 'session.revoked', userId, scope: 'others' });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.db.revokeAllUserSessions(userId);
  }
}
