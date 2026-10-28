import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

import type { IDatabaseAdapter } from '../interfaces/adapter-db.js';
import type {
  EmailContext,
  EmailMessage,
  EmailNotification,
} from '../interfaces/adapter-email.js';
import { hashToken } from '../utils/crypto.js';

export type OutgoingEmail = Omit<EmailMessage, 'locale'> & {
  locale?: string | undefined;
};

/**
 * Queue an email in the current transaction. `discriminator` identifies the
 * state change; the same event, recipient, and discriminator are delivered once.
 */
export type EnqueueEmail = (
  email: OutgoingEmail,
  discriminator: string
) => Promise<void>;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export class EmailOutbox {
  private readonly key: Buffer;

  constructor(
    secret: string,
    private readonly context: EmailContext,
    private readonly onCommitted: () => void
  ) {
    this.key = Buffer.from(
      hkdfSync('sha256', secret, '', 'keychain:email-outbox', 32)
    );
  }

  /** Run `action` in a transaction; queued emails are dispatched after commit. */
  async transaction<T>(
    db: IDatabaseAdapter,
    action: (tx: IDatabaseAdapter, enqueue: EnqueueEmail) => Promise<T>
  ): Promise<T> {
    let queued = false;
    const result = await db.transaction(tx =>
      action(tx, async (email, discriminator) => {
        await tx.enqueueEmail({
          dedupeKey: hashToken(`${email.event}:${email.to}:${discriminator}`),
          event: email.event,
          payload: this.seal({
            ...this.context,
            ...email,
            locale: email.locale ?? 'en',
          } as EmailNotification),
          nextAttemptAt: new Date(),
        });
        queued = true;
      })
    );
    if (queued) this.onCommitted();
    return result;
  }

  open(payload: string): EmailNotification {
    const data = Buffer.from(payload, 'base64url');
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      data.subarray(0, IV_LENGTH)
    );
    decipher.setAuthTag(data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
    const plaintext = Buffer.concat([
      decipher.update(data.subarray(IV_LENGTH + TAG_LENGTH)),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8')) as EmailNotification;
  }

  private seal(notification: EmailNotification): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(notification), 'utf8'),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
      'base64url'
    );
  }
}
