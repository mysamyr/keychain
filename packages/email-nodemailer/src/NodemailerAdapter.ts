import type { EmailNotification, IEmailAdapter } from '@mysamyr/core';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';

import {
  getEmailMessage,
  resolveEmailLocale,
  type EmailMessage,
} from './messages.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderHtml(
  notification: EmailNotification,
  message: EmailMessage
): string {
  const content = message.paragraphs
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join('\n');
  const action = message.action
    ? `<p><a href="${escapeHtml(message.action.link)}">${escapeHtml(message.action.label)}</a></p>`
    : '';

  return `<!doctype html>
<html lang="${resolveEmailLocale(notification.locale)}">
  <head><meta charset="utf-8"><title>${escapeHtml(message.subject)}</title></head>
  <body>
    <header><h1>${escapeHtml(notification.appName)}</h1></header>
    <main>
      ${content}
      ${action}
    </main>
    <footer><p>${escapeHtml(notification.appName)} &middot; ${escapeHtml(notification.supportContact)}</p></footer>
  </body>
</html>`;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export interface NodemailerConfig {
  host: string;
  port: number;
  secure?: boolean;
  /** Fail instead of sending in plain text when STARTTLS is unavailable. */
  requireTLS?: boolean;
  /** Node TLS options, e.g. a custom `ca` or `servername`. */
  tls?: SMTPTransport.Options['tls'];
  auth?: {
    user: string;
    pass: string;
  };
  /** Keep the total below the outbox `delivery.leaseMs` (60s by default). */
  timeouts?: {
    connectionMs?: number;
    greetingMs?: number;
    socketMs?: number;
  };
  verificationSubject?: string;
  resetSubject?: string;
}

export class NodemailerAdapter implements IEmailAdapter {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly verificationSubject?: string;
  private readonly resetSubject?: string;

  constructor(config: NodemailerConfig) {
    const secure = config.secure ?? config.port === 465;
    const options: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure,
      requireTLS:
        config.requireTLS ?? (!secure && !LOCAL_HOSTS.has(config.host)),
      tls: config.tls,
      auth: config.auth?.user ? config.auth : undefined,
      connectionTimeout: config.timeouts?.connectionMs ?? 10_000,
      greetingTimeout: config.timeouts?.greetingMs ?? 10_000,
      socketTimeout: config.timeouts?.socketMs ?? 20_000,
    };
    this.transporter = createTransport(options);

    this.verificationSubject = config.verificationSubject;
    this.resetSubject = config.resetSubject;
  }

  /** Close pooled SMTP connections. */
  close(): void {
    this.transporter.close();
  }

  async send(notification: EmailNotification): Promise<void> {
    const message = getEmailMessage(notification);
    const customSubject =
      notification.event === 'verification'
        ? this.verificationSubject
        : notification.event === 'passwordReset'
          ? this.resetSubject
          : undefined;
    if (customSubject !== undefined) {
      message.subject = `[${notification.appName}] ${customSubject}`;
    }

    const text = [
      ...message.paragraphs,
      ...(message.action ? [message.action.link] : []),
      `${notification.appName} - ${notification.supportContact}`,
    ].join('\n\n');

    await this.transporter.sendMail({
      from: notification.senderAddress,
      to: notification.to,
      subject: message.subject,
      text,
      html: renderHtml(notification, message),
    });
  }
}
