import type {
  DeletedRecords,
  IDatabaseAdapter,
} from '../interfaces/adapter-db.js';
import type { AuthLogger } from '../observability/logger.js';

export class MaintenanceService {
  private timer: NodeJS.Timeout | undefined;

  /** @internal */
  constructor(
    private readonly db: IDatabaseAdapter,
    private readonly outboxRetentionMs: number,
    private readonly logger: AuthLogger
  ) {}

  /** Delete expired sessions and grants, and outbox rows past retention. */
  async cleanup(): Promise<DeletedRecords> {
    const now = new Date();
    const deleted = await this.db.deleteExpiredRecords({
      now,
      outboxBefore: new Date(now.getTime() - this.outboxRetentionMs),
    });
    this.logger.debug('Expired records cleaned up', { ...deleted });
    return deleted;
  }

  start(intervalMs: number): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.cleanup().catch((error: unknown) => {
        this.logger.error('Expired record cleanup failed', { error });
      });
    }, intervalMs);
    this.timer.unref();
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
