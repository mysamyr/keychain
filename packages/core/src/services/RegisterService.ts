import type { EmailOutbox, EnqueueEmail } from '../delivery/EmailOutbox.js';
import type { IDatabaseAdapter, User } from '../interfaces/adapter-db.js';
import type { PasswordManager } from '../managers/PasswordManager.js';
import type { TokenManager } from '../managers/TokenManager.js';
import type { AuthEvents } from '../observability/events.js';
import type { RegisterDTO, ResendVerificationDTO } from '../schemas/auth.js';
import { registerSchema, resendVerificationSchema } from '../schemas/auth.js';
import { hashToken } from '../utils/crypto.js';
import {
  UniqueConstraintError,
  UserAlreadyExistsError,
} from '../utils/errors.js';
import { parseInput } from '../utils/validation.js';

const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export class RegisterService {
  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly outbox: EmailOutbox,
    private readonly tokenManager: TokenManager,
    private readonly passwordManager: PasswordManager,
    private readonly emailTokenTtlMs: number,
    private readonly events: AuthEvents
  ) {}

  async execute(
    input: RegisterDTO,
    verificationLinkBaseUrl: string,
    locale?: string
  ): Promise<User> {
    const { email, password } = parseInput(registerSchema, input);
    const verificationLink = new URL(verificationLinkBaseUrl);
    const passwordHash = await this.passwordManager.hash(password);

    let user: User;
    try {
      user = await this.outbox.transaction(this.db, async (tx, enqueue) => {
        if (await tx.getUserByEmail(email)) {
          throw new UserAlreadyExistsError();
        }
        const created = await tx.createUser({
          email,
          passwordHash,
          isEmailVerified: false,
        });
        await this.issueVerification(
          tx,
          enqueue,
          created,
          verificationLink,
          locale
        );
        return created;
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new UserAlreadyExistsError();
      }
      throw error;
    }

    this.events.emit({
      type: 'user.registered',
      userId: user.id,
      method: 'password',
    });
    return user;
  }

  async resend(
    input: ResendVerificationDTO,
    verificationLinkBaseUrl: string,
    locale?: string
  ): Promise<void> {
    const { email } = parseInput(resendVerificationSchema, input);
    const verificationLink = new URL(verificationLinkBaseUrl);
    const user = await this.db.getUserByEmail(email);
    if (!user || user.isEmailVerified) {
      return;
    }
    if (
      user.lastVerificationEmailSentAt &&
      Date.now() - user.lastVerificationEmailSentAt.getTime() <
        RESEND_COOLDOWN_MS
    ) {
      return;
    }

    await this.outbox.transaction(this.db, (tx, enqueue) =>
      this.issueVerification(tx, enqueue, user, verificationLink, locale)
    );
  }

  private async issueVerification(
    db: IDatabaseAdapter,
    enqueue: EnqueueEmail,
    user: User,
    verificationLink: URL,
    locale?: string
  ): Promise<void> {
    const token = this.tokenManager.generateRandomToken();
    const tokenHash = hashToken(token);

    await db.updateUser(user.id, {
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: new Date(Date.now() + this.emailTokenTtlMs),
      lastVerificationEmailSentAt: new Date(),
    });

    verificationLink.searchParams.set('token', token);
    await enqueue(
      {
        to: user.email,
        event: 'verification',
        locale,
        payload: { link: verificationLink.toString() },
      },
      tokenHash
    );
  }
}
