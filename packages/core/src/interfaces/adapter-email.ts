export interface EmailContext {
  appName: string;
  senderAddress: string;
  supportContact: string;
}

export type EmailMessage = {
  to: string;
  locale: string;
} & (
  | {
      event: 'reauthentication';
      payload: { code: string; action: 'delete-account' | 'set-password' };
    }
  | {
      event: 'verification' | 'passwordReset' | 'emailChangeVerification';
      payload: { link: string };
    }
  | {
      event: 'accountLinked' | 'accountUnlinked';
      payload: { provider: string };
    }
  | {
      event: 'passwordChanged' | 'accountDeleted' | 'emailChangeNotification';
      payload?: never;
    }
);

export type EmailEvent = EmailMessage['event'];

export type EmailNotification = EmailContext & EmailMessage;

export interface IEmailAdapter {
  /** Throw on failure; the outbox retries with backoff. */
  send(notification: EmailNotification): Promise<void>;
}
