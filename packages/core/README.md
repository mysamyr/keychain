# @mysamyr/core

Framework-agnostic authentication services: registration, login, profiles,
password resets, sessions, sensitive-action confirmation, and optional Google
OAuth.

**Requires:** Node.js 24+, a database adapter (`IDatabaseAdapter`), and an email
adapter (`IEmailAdapter`).

```sh
npm install @mysamyr/core
```

```ts
import { AuthCore } from '@mysamyr/core';

const auth = new AuthCore({
  db, // e.g. new PrismaAdapter(prisma)
  email, // e.g. new NodemailerAdapter({ host, port })
  appName: 'My App',
  senderAddress: 'My App <accounts@example.com>',
  supportContact: 'support@example.com',
  secret: process.env.AUTH_SECRET!,
});

process.on('SIGTERM', () => void auth.close());
```

Emails are queued in the database and delivered in the background by the same
process. Call `auth.close()` on shutdown.

## Options

| Option                                                    | Default                                        |
| --------------------------------------------------------- | ---------------------------------------------- |
| `db`, `email`                                             | required                                       |
| `appName`, `senderAddress`, `supportContact`              | required                                       |
| `secret`                                                  | required, 32+ characters                       |
| `sessionTtlMs` / `rememberMeTtlMs`                        | 24 hours / 30 days                             |
| `emailTokenTtlMs`                                         | 1 hour                                         |
| `passwordResetTokenTtlMs`                                 | 20 minutes (15–30)                             |
| `passwordScryptN` / `passwordScryptR` / `passwordScryptP` | 32768 / 8 / 1                                  |
| `requireEmailVerification`                                | `false`                                        |
| `google`                                                  | `{ clientId, clientSecret, redirectUri }`, off |
| `delivery.autoStart`                                      | `true`; set `false` to run delivery elsewhere  |
| `delivery.pollIntervalMs` / `batchSize` / `maxAttempts`   | 5 s / 10 / 8                                   |
| `delivery.leaseMs`                                        | 60 s; keep above the email adapter's timeouts  |
| `delivery.cleanupIntervalMs` / `outboxRetentionMs`        | 1 hour / 7 days                                |
| `logger`                                                  | console; any `{ debug, info, warn, error }`    |
| `onEvent`                                                 | none; receives typed `AuthEvent`s              |

With `delivery.autoStart: false`, call `auth.start()` in the process that should
deliver emails and remove expired records.

## Custom adapters

Implement the contracts exported as `IDatabaseAdapter` and `IEmailAdapter`.
`IEmailAdapter.send(notification)` receives the recipient, `locale`,
`appName`, `senderAddress`, `supportContact`, and an `event` with its payload;
rendering and localization belong to the adapter. Throw from `send` to retry.

Errors thrown by core extend `AuthError` and carry a stable `code` and HTTP
`statusCode`. See [architecture](../../ARCHITECTURE.md) for the adapter contract
and the [stability policy](../../ARCHITECTURE.md#stability-policy).
