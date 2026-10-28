import type { AuthConfig } from './config/types.js';
import { AuthConfigSchema } from './config/types.js';
import { EmailDispatcher } from './delivery/EmailDispatcher.js';
import { EmailOutbox } from './delivery/EmailOutbox.js';
import { OAuthManager } from './managers/OAuthManager.js';
import { PasswordManager } from './managers/PasswordManager.js';
import { ReauthenticationManager } from './managers/ReauthenticationManager.js';
import { SessionManager } from './managers/SessionManager.js';
import { TokenManager } from './managers/TokenManager.js';
import { AuthEvents } from './observability/events.js';
import { type AuthLogger, createLogger } from './observability/logger.js';
import { LoginService } from './services/LoginService.js';
import { MaintenanceService } from './services/MaintenanceService.js';
import { PasswordResetService } from './services/PasswordResetService.js';
import { ProfileService } from './services/ProfileService.js';
import { RegisterService } from './services/RegisterService.js';

export class AuthCore {
  public readonly register: RegisterService;
  public readonly login: LoginService;
  public readonly profile: ProfileService;
  public readonly passwordReset: PasswordResetService;
  public readonly session: SessionManager;
  public readonly oauth: OAuthManager | null;
  public readonly reauthentication: ReauthenticationManager;
  /** Delivers queued emails; started automatically unless `delivery.autoStart` is false. */
  public readonly outbox: EmailDispatcher;
  public readonly maintenance: MaintenanceService;
  public readonly logger: AuthLogger;
  public readonly events: AuthEvents;
  private readonly cleanupIntervalMs: number;

  constructor(config: AuthConfig) {
    const parsed = AuthConfigSchema.parse(config);
    const { db, delivery } = parsed;

    this.logger = createLogger(parsed.logger);
    this.events = new AuthEvents(parsed.onEvent, this.logger);

    const outbox = new EmailOutbox(
      parsed.secret,
      {
        appName: parsed.appName,
        senderAddress: parsed.senderAddress,
        supportContact: parsed.supportContact,
      },
      () => this.outbox.kick()
    );
    this.outbox = new EmailDispatcher(
      db,
      parsed.email,
      outbox,
      delivery,
      this.logger,
      this.events
    );
    this.maintenance = new MaintenanceService(
      db,
      delivery.outboxRetentionMs,
      this.logger
    );
    this.cleanupIntervalMs = delivery.cleanupIntervalMs;

    const passwordManager = new PasswordManager(
      parsed.passwordScryptN,
      parsed.passwordScryptR,
      parsed.passwordScryptP
    );
    const tokenManager = new TokenManager(parsed.secret);

    this.session = new SessionManager(
      db,
      parsed.sessionTtlMs,
      parsed.rememberMeTtlMs,
      this.events
    );
    this.reauthentication = new ReauthenticationManager(
      db,
      outbox,
      passwordManager
    );
    this.register = new RegisterService(
      db,
      outbox,
      tokenManager,
      passwordManager,
      parsed.emailTokenTtlMs,
      this.events
    );
    this.login = new LoginService(
      db,
      passwordManager,
      this.session,
      parsed.requireEmailVerification,
      this.events
    );
    this.profile = new ProfileService(
      db,
      passwordManager,
      outbox,
      tokenManager,
      parsed.emailTokenTtlMs,
      this.reauthentication,
      this.events
    );
    this.passwordReset = new PasswordResetService(
      db,
      outbox,
      tokenManager,
      passwordManager,
      parsed.passwordResetTokenTtlMs,
      this.events
    );
    this.oauth = parsed.google
      ? new OAuthManager(
          parsed.google,
          db,
          this.session,
          outbox,
          this.reauthentication,
          this.events
        )
      : null;

    if (delivery.autoStart) this.start();
  }

  /** Start email dispatch and periodic cleanup in this process. */
  start(): void {
    this.outbox.start();
    this.maintenance.start(this.cleanupIntervalMs);
  }

  /** Stop background work and wait for in-flight deliveries. */
  async close(): Promise<void> {
    this.maintenance.stop();
    await this.outbox.stop();
  }
}
