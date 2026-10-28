import type { EmailEvent } from '../interfaces/adapter-email.js';

import type { AuthLogger } from './logger.js';

export type AuthEvent =
  | { type: 'user.registered'; userId: string; method: 'password' | 'google' }
  | {
      type: 'user.signedIn';
      userId: string;
      sessionId: string;
      method: 'password' | 'google';
    }
  | {
      type: 'user.signInFailed';
      reason: 'invalid_credentials' | 'email_not_verified';
    }
  | {
      type: 'session.revoked';
      userId: string;
      scope: 'single' | 'others';
      sessionId?: string;
    }
  | { type: 'password.changed'; userId: string }
  | { type: 'password.reset'; userId: string }
  | { type: 'email.verified'; userId: string }
  | { type: 'email.changed'; userId: string }
  | { type: 'account.deleted'; userId: string }
  | { type: 'oauth.linked'; userId: string; provider: 'google' }
  | { type: 'oauth.unlinked'; userId: string; provider: 'google' }
  | {
      type: 'email.deliveryFailed';
      messageId: string;
      event: EmailEvent;
      attempts: number;
    };

export type AuthEventPayload = AuthEvent & { occurredAt: Date };

export type AuthEventHandler = (
  event: AuthEventPayload
) => void | Promise<void>;

export class AuthEvents {
  /** @internal */
  constructor(
    private readonly handler: AuthEventHandler | undefined,
    private readonly logger: AuthLogger
  ) {}

  /** Fire-and-forget; handler failures are logged and never thrown. */
  emit(event: AuthEvent): void {
    const handler = this.handler;
    if (!handler) return;
    const payload: AuthEventPayload = { ...event, occurredAt: new Date() };
    void Promise.resolve()
      .then(() => handler(payload))
      .catch((error: unknown) => {
        this.logger.error('Auth event handler failed', {
          event: event.type,
          error,
        });
      });
  }
}
