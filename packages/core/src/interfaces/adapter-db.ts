export interface User {
  id: string;
  email: string;
  passwordHash?: string | undefined;
  isEmailVerified: boolean;
  verificationTokenHash?: string | undefined;
  verificationTokenExpiresAt?: Date | undefined;
  googleId?: string | undefined;
  lastVerificationEmailSentAt?: Date;
  pendingEmail?: string | undefined;
  pendingEmailTokenHash?: string | undefined;
  pendingEmailTokenExpiresAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  userAgent: string;
  ip: string;
  createdAt: Date;
}

export interface ReauthenticationGrant {
  tokenHash: string;
  userId: string;
  sessionId: string;
  action: string;
  kind: string;
  codeHash: string | null;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface ConsumeReauthenticationGrant {
  tokenHash: string;
  userId: string;
  sessionId: string;
  kind: 'challenge' | 'authorization';
  action: string;
}

export interface ConsumeEmailChangeToken {
  userId: string;
  newEmail: string;
  tokenHash: string;
}

export type OutboxEmailStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface OutboxEmail {
  id: string;
  dedupeKey: string;
  event: string;
  /** Encrypted notification; cleared once the message is sent or dead. */
  payload: string | null;
  status: OutboxEmailStatus;
  attempts: number;
  nextAttemptAt: Date;
  lockedUntil: Date | null;
  lastError: string | null;
  createdAt: Date;
  sentAt: Date | null;
}

export type NewOutboxEmail = Pick<
  OutboxEmail,
  'dedupeKey' | 'event' | 'payload' | 'nextAttemptAt'
>;

export interface ClaimOutboxEmails {
  now: Date;
  limit: number;
  lockedUntil: Date;
}

export interface FailOutboxEmail {
  attempts: number;
  lastError: string;
  /** `null` marks the message as permanently failed. */
  nextAttemptAt: Date | null;
}

export interface DeleteExpiredRecords {
  now: Date;
  /** Delete sent/failed outbox rows created before this date. */
  outboxBefore: Date;
}

export interface DeletedRecords {
  sessions: number;
  reauthenticationGrants: number;
  outboxEmails: number;
}

/**
 * Storage contract for `AuthCore`.
 *
 * - Unique: user `email`, `googleId`, and every token-hash column
 *   (`verificationTokenHash`, `pendingEmailTokenHash`, password-reset and session
 *   `tokenHash`), plus outbox `dedupeKey`. Violations of `email` or `googleId` must
 *   throw `UniqueConstraintError`; unavailable storage must throw `ServiceUnavailableError`.
 * - Methods documented as atomic must be safe under concurrent calls at READ COMMITTED
 *   or stricter (conditional updates or a transaction).
 * - `transaction` must commit or roll back every write made through `tx`, and calls
 *   on `tx` (including nested `transaction`) must reuse the same transaction.
 */
export interface IDatabaseAdapter {
  /** Insert a message; a duplicate `dedupeKey` is silently ignored. */
  enqueueEmail(email: NewOutboxEmail): Promise<void>;
  /**
   * Atomically lease up to `limit` due messages: pending with `nextAttemptAt <= now`,
   * or processing with an expired lease. Claimed rows become `processing` until `lockedUntil`.
   */
  claimEmails(input: ClaimOutboxEmails): Promise<OutboxEmail[]>;
  markEmailSent(id: string, sentAt: Date): Promise<void>;
  markEmailFailed(id: string, input: FailOutboxEmail): Promise<void>;
  deleteExpiredRecords(input: DeleteExpiredRecords): Promise<DeletedRecords>;
  /** Atomically enforce a per-session 60s cooldown, replace its grants, and create a challenge. */
  createReauthenticationChallenge(
    data: ReauthenticationGrant
  ): Promise<boolean>;
  /** Atomically count an attempt (maximum five) and consume a valid code; commit failed attempts. */
  verifyReauthenticationChallenge(
    input: ConsumeReauthenticationGrant & { codeHash: string }
  ): Promise<boolean>;
  createReauthenticationGrant(data: ReauthenticationGrant): Promise<void>;
  /** Atomically delete and return one matching, unexpired grant, or null. */
  consumeReauthenticationGrant(
    input: ConsumeReauthenticationGrant
  ): Promise<ReauthenticationGrant | null>;
  /** Atomically consume an unexpired token hash and mark the email verified. */
  consumeEmailVerificationToken(tokenHash: string): Promise<User | null>;
  /** Atomically consume the current, unexpired email-change token and update the email. */
  consumeEmailChangeToken(input: ConsumeEmailChangeToken): Promise<User | null>;
  /** Atomically clear a pending email change only when its address still matches. */
  cancelPendingEmailChange(
    userId: string,
    expectedEmail: string
  ): Promise<boolean>;
  /** Delete all pending reauthentication challenges and authorization grants for a user. */
  clearReauthenticationGrants(userId: string): Promise<void>;
  /** Replace the user's previous reset token; never store the raw token. */
  replacePasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void>;
  /** Clear the user's reset token hash and expiry after successful password login. */
  clearPasswordResetToken(userId: string): Promise<void>;
  getUserByPasswordResetTokenHash(tokenHash: string): Promise<User | null>;
  /** Atomically consume an unexpired token, update password, clear pending email change, and revoke all sessions. */
  consumePasswordResetToken(
    tokenHash: string,
    passwordHash: string
  ): Promise<boolean>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByGoogleId(googleId: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  /** Explicitly undefined verification fields or googleId clear the stored value. */
  updateUser(
    id: string,
    data: Partial<
      Pick<
        User,
        | 'email'
        | 'passwordHash'
        | 'isEmailVerified'
        | 'verificationTokenHash'
        | 'verificationTokenExpiresAt'
        | 'googleId'
        | 'lastVerificationEmailSentAt'
        | 'pendingEmail'
        | 'pendingEmailTokenHash'
        | 'pendingEmailTokenExpiresAt'
      >
    >
  ): Promise<User>;
  /** Store only the token hash; never the raw bearer token. */
  createSession(
    data: Omit<Session, 'id' | 'createdAt'> & { tokenHash: string }
  ): Promise<Session>;
  getSessionById(id: string): Promise<Session | null>;
  getSessionByTokenHash(tokenHash: string): Promise<Session | null>;
  getUserSessions(userId: string): Promise<Session[]>;
  /** Delete a session; a missing session is not an error. */
  revokeSession(id: string): Promise<void>;
  /** Delete every session of the user except `keepSessionId`. */
  revokeOtherUserSessions(userId: string, keepSessionId: string): Promise<void>;
  /** Atomically delete only the matching owner's session; false if missing or not owned. */
  revokeUserSession(userId: string, sessionId: string): Promise<boolean>;
  revokeAllUserSessions(userId: string): Promise<void>;
  /** Delete the user; their sessions and grants must be deleted with them. */
  deleteUser(id: string): Promise<void>;
  /** Run `action` in one transaction; inside it, `tx.transaction` reuses that transaction. */
  transaction<T>(action: (tx: IDatabaseAdapter) => Promise<T>): Promise<T>;
}
