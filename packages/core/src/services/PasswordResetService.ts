import type { EmailOutbox } from '../delivery/EmailOutbox.js';
import type { IDatabaseAdapter, User } from '../interfaces/adapter-db.js';
import type { PasswordManager } from '../managers/PasswordManager.js';
import type { TokenManager } from '../managers/TokenManager.js';
import type { AuthEvents } from '../observability/events.js';
import type { ForgotPasswordDTO, ResetPasswordDTO } from '../schemas/auth.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.js';
import { HEX_TOKEN_PATTERN, hashToken } from '../utils/crypto.js';
import { TokenInvalidError } from '../utils/errors.js';
import { parseInput } from '../utils/validation.js';

export class PasswordResetService {
  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly outbox: EmailOutbox,
    private readonly tokenManager: TokenManager,
    private readonly passwordManager: PasswordManager,
    private readonly tokenTtlMs: number,
    private readonly events: AuthEvents
  ) {}

  async request(
    input: ForgotPasswordDTO,
    resetLinkBaseUrl: string,
    locale?: string
  ): Promise<void> {
    const { email } = parseInput(forgotPasswordSchema, input);
    const resetLink = new URL(resetLinkBaseUrl);

    const user = await this.db.getUserByEmail(email);
    if (!user) {
      return;
    }

    const token = this.tokenManager.generateRandomToken();
    const tokenHash = hashToken(token);
    resetLink.searchParams.set('token', token);

    await this.outbox.transaction(this.db, async (tx, enqueue) => {
      await tx.replacePasswordResetToken(
        user.id,
        tokenHash,
        new Date(Date.now() + this.tokenTtlMs)
      );
      await enqueue(
        {
          to: user.email,
          event: 'passwordReset',
          locale,
          payload: { link: resetLink.toString() },
        },
        tokenHash
      );
    });
  }

  async reset(input: ResetPasswordDTO, locale?: string): Promise<void> {
    const { token, password } = parseInput(resetPasswordSchema, input);

    const user = await this.validateToken(token);
    const passwordHash = await this.passwordManager.hash(password);
    const tokenHash = hashToken(token);

    await this.outbox.transaction(this.db, async (tx, enqueue) => {
      if (!(await tx.consumePasswordResetToken(tokenHash, passwordHash))) {
        throw new TokenInvalidError();
      }
      await enqueue(
        { to: user.email, event: 'passwordChanged', locale },
        tokenHash
      );
    });
    this.events.emit({ type: 'password.reset', userId: user.id });
  }

  async validateToken(token: string): Promise<User> {
    if (!HEX_TOKEN_PATTERN.test(token)) {
      throw new TokenInvalidError();
    }

    const user = await this.db.getUserByPasswordResetTokenHash(
      hashToken(token)
    );
    if (!user) {
      throw new TokenInvalidError();
    }

    return user;
  }
}
