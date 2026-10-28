# @mysamyr/email-nodemailer

SMTP email adapter for Keychain with English and Ukrainian messages.

**Requires:** Node.js 24+ and an SMTP server.

```sh
npm install @mysamyr/email-nodemailer
```

```ts
import { NodemailerAdapter } from '@mysamyr/email-nodemailer';

const email = new NodemailerAdapter({
  host: process.env.SMTP_HOST!,
  port: 587,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});
```

Pass `email` to `AuthCore`. The sender, application name, and support contact
come from the `AuthCore` configuration. Call `email.close()` on shutdown.

## Options

| Option                                              | Default                                      |
| --------------------------------------------------- | -------------------------------------------- |
| `host`, `port`                                      | required                                     |
| `secure`                                            | `true` for port 465 (implicit TLS)           |
| `requireTLS`                                        | `true` unless `secure` or the host is local  |
| `tls`                                               | none; Node TLS options such as a custom `ca` |
| `auth`                                              | none (unauthenticated SMTP)                  |
| `timeouts.connectionMs` / `greetingMs` / `socketMs` | 10 s / 10 s / 20 s                           |
| `verificationSubject`, `resetSubject`               | localized defaults                           |

Mail is never sent in plain text to a remote host: without implicit TLS, the
connection must upgrade with STARTTLS. Local servers (`localhost`, `127.0.0.1`)
such as Mailpit work without configuration.

The adapter does not retry. A failed send throws, and the `AuthCore` outbox
retries with backoff. Keep the combined timeouts below `delivery.leaseMs` (60 s
by default). Locales other than English and Ukrainian fall back to English.
