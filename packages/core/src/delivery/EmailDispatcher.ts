import type {
  IDatabaseAdapter,
  OutboxEmail,
} from '../interfaces/adapter-db.js';
import type { EmailEvent, IEmailAdapter } from '../interfaces/adapter-email.js';
import type { AuthEvents } from '../observability/events.js';
import type { AuthLogger } from '../observability/logger.js';

import type { EmailOutbox } from './EmailOutbox.js';

export interface DispatcherConfig {
  pollIntervalMs: number;
  batchSize: number;
  maxAttempts: number;
  leaseMs: number;
}

const MIN_RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 60 * 60_000;

export class EmailDispatcher {
  private timer: NodeJS.Timeout | undefined;
  private running: Promise<void> | undefined;
  private rerun = false;

  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly email: IEmailAdapter,
    private readonly outbox: EmailOutbox,
    private readonly config: DispatcherConfig,
    private readonly logger: AuthLogger,
    private readonly events: AuthEvents
  ) {}

  get isRunning(): boolean {
    return this.timer !== undefined;
  }

  /** Poll the outbox in this process until `stop()`. */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.kick(), this.config.pollIntervalMs);
    this.timer.unref();
    this.kick();
  }

  async stop(): Promise<void> {
    clearInterval(this.timer);
    this.timer = undefined;
    this.rerun = false;
    await this.running;
  }

  /** Request an immediate dispatch round; no-op unless started. */
  kick(): void {
    if (!this.timer) return;
    if (this.running) {
      this.rerun = true;
      return;
    }
    this.running = this.drain()
      .then(() => undefined)
      .catch((error: unknown) => {
        this.logger.error('Email outbox dispatch failed', { error });
      })
      .finally(() => {
        this.running = undefined;
        if (this.rerun) {
          this.rerun = false;
          this.kick();
        }
      });
  }

  /** Deliver due messages until none remain; returns the number processed. */
  async drain(): Promise<number> {
    let processed = 0;
    for (;;) {
      const now = new Date();
      const batch = await this.db.claimEmails({
        now,
        limit: this.config.batchSize,
        lockedUntil: new Date(now.getTime() + this.config.leaseMs),
      });
      await Promise.all(batch.map(message => this.deliver(message)));
      processed += batch.length;
      if (batch.length < this.config.batchSize) return processed;
    }
  }

  private async deliver(message: OutboxEmail): Promise<void> {
    try {
      if (!message.payload) throw new Error('Outbox message has no payload');
      await this.email.send(this.outbox.open(message.payload));
    } catch (error) {
      await this.fail(message, error);
      return;
    }
    await this.db.markEmailSent(message.id, new Date());
  }

  private async fail(message: OutboxEmail, error: unknown): Promise<void> {
    const attempts = message.attempts + 1;
    const dead = !message.payload || attempts >= this.config.maxAttempts;
    const delay = Math.min(
      MIN_RETRY_DELAY_MS * 2 ** (attempts - 1),
      MAX_RETRY_DELAY_MS
    );
    const lastError = (
      error instanceof Error ? error.message : String(error)
    ).slice(0, 500);

    await this.db.markEmailFailed(message.id, {
      attempts,
      lastError,
      nextAttemptAt: dead ? null : new Date(Date.now() + delay),
    });

    const meta = { messageId: message.id, event: message.event, attempts };
    if (!dead) {
      this.logger.warn('Email delivery failed; will retry', { ...meta, error });
      return;
    }
    this.logger.error('Email delivery permanently failed', { ...meta, error });
    this.events.emit({
      type: 'email.deliveryFailed',
      messageId: message.id,
      event: message.event as EmailEvent,
      attempts,
    });
  }
}
