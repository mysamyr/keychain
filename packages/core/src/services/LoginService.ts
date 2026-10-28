import type { IDatabaseAdapter, User } from '../interfaces/adapter-db.js';
import type { PasswordManager } from '../managers/PasswordManager.js';
import type { SessionManager } from '../managers/SessionManager.js';
import type { AuthEvents } from '../observability/events.js';
import type { LoginDTO } from '../schemas/auth.js';
import { loginSchema } from '../schemas/auth.js';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from '../utils/errors.js';
import { parseInput } from '../utils/validation.js';

export interface LoginMetadata {
  userAgent: string;
  ip: string;
}

export interface LoginResult {
  user: User;
  sessionId: string;
  sessionToken: string;
  expiresAt: Date;
}

export class LoginService {
  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly passwordManager: PasswordManager,
    private readonly sessionManager: SessionManager,
    private readonly requireEmailVerification: boolean,
    private readonly events: AuthEvents
  ) {}

  async execute(
    input: LoginDTO,
    metadata: LoginMetadata
  ): Promise<LoginResult> {
    const { email, password, rememberMe } = parseInput(loginSchema, input);

    const user = await this.db.getUserByEmail(email);
    if (
      !user?.passwordHash ||
      !(await this.passwordManager.verify(password, user.passwordHash))
    ) {
      this.events.emit({
        type: 'user.signInFailed',
        reason: 'invalid_credentials',
      });
      throw new InvalidCredentialsError();
    }
    if (this.requireEmailVerification && !user.isEmailVerified) {
      this.events.emit({
        type: 'user.signInFailed',
        reason: 'email_not_verified',
      });
      throw new EmailNotVerifiedError();
    }

    if (this.passwordManager.needsRehash(user.passwordHash)) {
      const passwordHash = await this.passwordManager.hash(password);
      await this.db.updateUser(user.id, { passwordHash });
    }

    await this.db.clearPasswordResetToken(user.id);

    const { session, token } = await this.sessionManager.create(
      user.id,
      metadata.userAgent,
      metadata.ip,
      rememberMe
    );
    this.events.emit({
      type: 'user.signedIn',
      userId: user.id,
      sessionId: session.id,
      method: 'password',
    });

    return {
      user,
      sessionId: session.id,
      sessionToken: token,
      expiresAt: session.expiresAt,
    };
  }
}
