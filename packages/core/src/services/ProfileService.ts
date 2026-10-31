import type { EmailOutbox } from '../delivery/EmailOutbox.js';
import type { IDatabaseAdapter, User } from '../interfaces/adapter-db.js';
import type { PasswordManager } from '../managers/PasswordManager.js';
import type {
  ReauthenticationManager,
  SensitiveActionAuthorization,
} from '../managers/ReauthenticationManager.js';
import type { TokenManager } from '../managers/TokenManager.js';
import type { AuthEvents } from '../observability/events.js';
import {
  changePasswordSchema,
  cancelEmailChangeSchema,
  confirmEmailChangeSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../schemas/auth.js';
import { HEX_TOKEN_PATTERN, hashToken } from '../utils/crypto.js';
import {
  EmailChangeConflictError,
  EmailChangePendingError,
  InvalidCredentialsError,
  PasswordRequiredError,
  TokenInvalidError,
  UniqueConstraintError,
  UserAlreadyExistsError,
  UserNotFoundError,
  ValidationError,
} from '../utils/errors.js';
import { parseInput } from '../utils/validation.js';

interface EmailChangeClaims extends Record<string, unknown> {
  sub: string;
  newEmail: string;
  purpose: string;
}

export class ProfileService {
  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly passwordManager: PasswordManager,
    private readonly outbox: EmailOutbox,
    private readonly tokenManager: TokenManager,
    private readonly emailTokenTtlMs: number,
    private readonly reauthentication: ReauthenticationManager,
    private readonly events: AuthEvents
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  }

  async changePassword(
    userId: string,
    newPassword: string,
    authorization: SensitiveActionAuthorization,
    locale?: string
  ): Promise<void> {
    parseInput(changePasswordSchema, { newPassword });
    await this.getProfile(userId);

    const newHash = await this.passwordManager.hash(newPassword);
    await this.outbox.transaction(this.db, async (tx, enqueue) => {
      const current = await this.getCurrent(tx, userId);
      await this.reauthentication.authorize(
        tx,
        current,
        'set-password',
        authorization
      );
      await tx.updateUser(userId, {
        passwordHash: newHash,
        pendingEmail: undefined,
        pendingEmailTokenHash: undefined,
        pendingEmailTokenExpiresAt: undefined,
      });
      await tx.clearPasswordResetToken(userId);
      await tx.clearReauthenticationGrants(userId);
      await tx.revokeAllUserSessions(userId);
      await enqueue(
        { to: current.email, event: 'passwordChanged', locale },
        current.updatedAt.toISOString()
      );
    });
    this.events.emit({ type: 'password.changed', userId });
  }

  async verifyPassword(userId: string, password: string): Promise<void> {
    const user = await this.getProfile(userId);
    if (
      !user.passwordHash ||
      !(await this.passwordManager.verify(password, user.passwordHash))
    ) {
      throw new InvalidCredentialsError();
    }
  }

  async unlinkGoogle(
    userId: string,
    authorization: SensitiveActionAuthorization,
    locale?: string
  ): Promise<void> {
    const user = await this.getProfile(userId);
    if (!user.passwordHash) {
      throw new PasswordRequiredError();
    }
    await this.outbox.transaction(this.db, async (tx, enqueue) => {
      const current = await this.getCurrent(tx, userId);
      if (!current.passwordHash) {
        throw new PasswordRequiredError();
      }
      await this.reauthentication.authorize(
        tx,
        current,
        'unlink-google',
        authorization
      );
      await tx.updateUser(userId, {
        googleId: undefined,
        pendingEmail: undefined,
        pendingEmailTokenHash: undefined,
        pendingEmailTokenExpiresAt: undefined,
      });
      await tx.clearPasswordResetToken(userId);
      await tx.clearReauthenticationGrants(userId);
      await tx.revokeAllUserSessions(userId);
      if (current.googleId) {
        await enqueue(
          {
            to: current.email,
            event: 'accountUnlinked',
            locale,
            payload: { provider: 'Google' },
          },
          current.updatedAt.toISOString()
        );
      }
    });
    if (user.googleId) {
      this.events.emit({ type: 'oauth.unlinked', userId, provider: 'google' });
    }
  }

  async initiateEmailChange(
    userId: string,
    newEmail: string,
    confirmationPageUrl: string,
    authorization: SensitiveActionAuthorization,
    locale?: string
  ): Promise<User> {
    const { email } = parseInput(updateProfileSchema, {
      email: newEmail,
      password: authorization.password,
    });
    if (!email) {
      throw new ValidationError({ email: ['Email is required'] });
    }
    const confirmationLink = new URL(confirmationPageUrl);

    const user = await this.getProfile(userId);
    if (!user.passwordHash) {
      throw new PasswordRequiredError();
    }
    this.assertNoPendingEmailChange(user);
    if (await this.db.getUserByEmail(email)) {
      throw new UserAlreadyExistsError();
    }

    const token = await this.tokenManager.generateJwt(
      { sub: userId, newEmail: email, purpose: 'email-change' },
      this.emailTokenTtlMs
    );
    const tokenHash = hashToken(token);
    confirmationLink.searchParams.set('token', token);

    return this.outbox.transaction(this.db, async (tx, enqueue) => {
      const current = await this.getCurrent(tx, userId);
      if (!current.passwordHash) {
        throw new PasswordRequiredError();
      }
      this.assertNoPendingEmailChange(current);
      await this.reauthentication.authorize(
        tx,
        current,
        'change-email',
        authorization
      );
      const updated = await tx.updateUser(userId, {
        pendingEmail: email,
        pendingEmailTokenHash: tokenHash,
        pendingEmailTokenExpiresAt: new Date(Date.now() + this.emailTokenTtlMs),
      });
      await enqueue(
        { to: current.email, event: 'emailChangeNotification', locale },
        tokenHash
      );
      await enqueue(
        {
          to: email,
          event: 'emailChangeVerification',
          locale,
          payload: { link: confirmationLink.toString() },
        },
        tokenHash
      );
      return updated;
    });
  }

  async cancelEmailChange(
    userId: string,
    expectedPendingEmail: string
  ): Promise<void> {
    const { expectedEmail } = parseInput(cancelEmailChangeSchema, {
      expectedEmail: expectedPendingEmail,
    });
    const user = await this.getProfile(userId);
    if (!user.pendingEmail) return;
    if (user.pendingEmail !== expectedEmail) {
      throw new EmailChangeConflictError();
    }
    if (!(await this.db.cancelPendingEmailChange(userId, expectedEmail))) {
      throw new EmailChangeConflictError();
    }
  }

  async confirmEmailChange(token: string, locale?: string): Promise<User> {
    parseInput(confirmEmailChangeSchema, { token });
    let claims: EmailChangeClaims;
    try {
      claims = await this.tokenManager.verifyJwt<EmailChangeClaims>(token);
    } catch {
      throw new TokenInvalidError();
    }
    if (claims.purpose !== 'email-change') {
      throw new TokenInvalidError();
    }

    const user = await this.db.getUserById(claims.sub);
    if (!user?.passwordHash) {
      throw new TokenInvalidError();
    }

    const tokenHash = hashToken(token);
    let updated: User;
    try {
      updated = await this.outbox.transaction(this.db, async (tx, enqueue) => {
        const result = await tx.consumeEmailChangeToken({
          userId: claims.sub,
          newEmail: claims.newEmail,
          tokenHash,
        });
        if (!result) throw new TokenInvalidError();
        if (user.googleId) {
          await enqueue(
            {
              to: result.email,
              event: 'accountUnlinked',
              locale,
              payload: { provider: 'Google' },
            },
            tokenHash
          );
        }
        return result;
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new UserAlreadyExistsError();
      }
      throw error;
    }

    this.events.emit({ type: 'email.changed', userId: updated.id });
    return updated;
  }

  async verifyEmail(token: string): Promise<User> {
    parseInput(verifyEmailSchema, { token });
    if (!HEX_TOKEN_PATTERN.test(token)) {
      throw new TokenInvalidError();
    }

    const user = await this.db.consumeEmailVerificationToken(hashToken(token));
    if (!user) {
      throw new TokenInvalidError();
    }

    this.events.emit({ type: 'email.verified', userId: user.id });
    return user;
  }

  async deleteAccount(
    userId: string,
    authorization: SensitiveActionAuthorization,
    locale?: string
  ): Promise<void> {
    await this.getProfile(userId);
    await this.outbox.transaction(this.db, async (tx, enqueue) => {
      const current = await this.getCurrent(tx, userId);
      await this.reauthentication.authorize(
        tx,
        current,
        'delete-account',
        authorization
      );
      await tx.deleteUser(userId);
      await enqueue(
        { to: current.email, event: 'accountDeleted', locale },
        userId
      );
    });
    this.events.emit({ type: 'account.deleted', userId });
  }

  private assertNoPendingEmailChange(user: User): void {
    if (
      user.pendingEmail &&
      user.pendingEmailTokenExpiresAt &&
      user.pendingEmailTokenExpiresAt.getTime() > Date.now()
    ) {
      throw new EmailChangePendingError();
    }
  }

  private async getCurrent(
    db: IDatabaseAdapter,
    userId: string
  ): Promise<User> {
    const current = await db.getUserById(userId);
    if (!current) throw new UserNotFoundError();
    return current;
  }
}
