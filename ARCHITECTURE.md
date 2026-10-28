# Keychain Architecture

Keychain is a self-hosted authentication system maintained as an npm-workspaces monorepo (Node.js 24+). The core is
independent of storage and email vendors; React packages provide an optional client experience. All packages are
ESM-only.

## Workspace

```text
packages/
  core/             Authentication logic, contracts, schemas, email outbox, and endpoint definitions
  db-prisma/        Prisma implementation of the database adapter
  email-nodemailer/ Nodemailer implementation of the email adapter
  express/          Express 5 router and middleware
  client/           Fetch-based HTTP client and client-side error type
  react/            Auth provider, state, hooks, and localization
  ui/               React authentication and profile components
apps/
  api-example/      Express API wired with Prisma and Nodemailer
  web-example/      React example using the provider and UI
```

## Server-side architecture

`AuthCore` validates its configuration and composes registration, login, profile, password-reset, session, and optional
Google OAuth services. Core services depend on `IDatabaseAdapter` and `IEmailAdapter`, not vendor implementations.
`@mysamyr/db-prisma` and `@mysamyr/email-nodemailer` provide the included adapters. Emails are normalized (trimmed and
lowercased) before lookup and storage.

The database stores users and sessions. Login creates a database-backed session and sets an HTTP-only
`keychain_session` cookie (the prefix is configurable; `SameSite=Lax`, `Secure` in production) whose expiry matches the
session. Session records have configurable lifetimes (24 hours by default; 30 days with “Remember me”). The cookie
contains a cryptographically random 256-bit token, not the public session ID. Only its SHA-256 hash is stored.
Middleware hashes the cookie for lookup and exposes the validated record's public ID for session management; list
responses contain neither tokens nor hashes.

`SessionManager.create` returns `{ session, token }`; login and OAuth results expose `sessionToken` separately from
`sessionId`. Set only the token in the cookie and pass it to `SessionManager.validate`. Custom adapters must accept
`tokenHash` on creation and implement `getSessionByTokenHash`. The example ships a single initial migration; the
library never applies migrations.

Registration queues a verification link containing a random token. Only its SHA-256 hash and expiry are stored, and
verification consumes the token once. Resending is limited by a two-minute cooldown. Password reset uses the same
hashed-token pattern; successful reset updates the password and revokes existing sessions. Email-change tokens are
stored as hashes and atomically consumed only when the exact stored token and unexpired database expiry match. The link
opens a frontend page that requires an explicit click, which sends `POST /me/confirm-email-change` with `{ token }`, so link
scanners cannot change the address. Confirmation updates the address and revokes sessions. Password login allows
unverified accounts by default; set `requireEmailVerification` to `true` to require verification.

Password hashes use a versioned Scrypt format with explicit configurable work factors; malformed stored hashes fail
closed. Password changes and password resets revoke all sessions, clear reset tokens and reauthentication grants, and
invalidate pending email changes; the current session cookie is cleared so the user must sign in again. Google unlinking
applies the same invalidation policy. Email changes also revoke all sessions.

Google OAuth uses PKCE, bounded provider requests, response validation, and stable provider-subject lookup. A verified
Google email is not automatically linked to an existing account: the user must sign in to that account and explicitly
link Google after password confirmation. Linking preserves existing password credentials, sessions, and reset tokens.
Unlinking requires a password-backed account and revokes all sessions and outstanding confirmation state.

The Prisma adapter expects `User`, `Session`, `ReauthenticationGrant`, and `EmailOutbox` models;
`packages/db-prisma/schema.prisma` provides a schema template. It uses no raw SQL and supports PostgreSQL (reference),
MySQL/MariaDB, and SQLite. SQL Server is unsupported because it allows only one `NULL` per unique index; MongoDB is
unsupported because of its id mapping.

## Adapter contract

Custom adapters implement `IDatabaseAdapter` and `IEmailAdapter` from `@mysamyr/core`.

- **Transactions:** `transaction(fn)` commits or rolls back every write made through its `tx` adapter. Calls on `tx`,
  including a nested `transaction`, reuse the same transaction. Isolation must be READ COMMITTED or stricter.
- **Atomic methods:** token consumption (verification, password reset, email change), reauthentication challenge
  creation (cooldown plus replacement), attempt counting, grant consumption, and outbox claiming must be safe under
  concurrent calls through conditional updates or a transaction. Failed verification attempts must be committed.
- **Uniqueness:** user `email` and `googleId`, every token-hash column, and outbox `dedupeKey` are unique. A duplicate
  `dedupeKey` is ignored silently. Violations of `email` or `googleId` throw `UniqueConstraintError`; unavailable
  storage throws `ServiceUnavailableError`. Anything else becomes a 500.
- **Cleanup:** `deleteExpiredRecords` removes expired sessions and grants, and sent or failed outbox rows older than
  the retention cutoff. Deleting a user or session cascades to its sessions and grants.
- **Email:** `IEmailAdapter.send` renders and delivers one notification and throws on failure. It never retries; the
  outbox owns retries.

## Email delivery

Every email is written to an outbox table in the same database transaction as the state change that causes it, so a
committed change always has its email and a rolled-back change never sends one. Each message has a deterministic
`dedupeKey`, so retried requests do not queue duplicates. Payloads (links and codes) are encrypted with a key derived
from `secret` and erased once the message is sent or abandoned.

`AuthCore` starts a dispatcher by default. It wakes immediately after a commit and also polls the table. Each claimed
message is leased (`delivery.leaseMs`), so several API instances can share the table without double delivery. Failed
sends retry with exponential backoff (30 seconds doubling, capped at one hour); after `delivery.maxAttempts` the
message is marked failed and an `email.deliveryFailed` event is emitted. A failed delivery never fails the HTTP request.

Set `delivery.autoStart: false` to run delivery in a dedicated worker process that calls `auth.start()`. Call
`auth.close()` on shutdown to stop timers and finish the in-flight batch.

## Errors

Every expected failure is an `AuthError` subclass with a stable `code` and HTTP `statusCode`, serialized as
`{ code, message, fieldErrors? }`. Input validation returns 400 `VALIDATION_ERROR` with per-field messages. Adapters
signal uniqueness races with `UniqueConstraintError`, which services translate into domain errors (for example
`USER_ALREADY_EXISTS`), and unavailable storage with `ServiceUnavailableError` (503 `SERVICE_UNAVAILABLE`). Unknown
errors are logged and returned as 500 `INTERNAL_ERROR` without details.

## Sensitive actions

Email changes, Google unlinking, account deletion, and password changes require confirmation, not just a valid
session. Password-backed users supply their current password on each request. Google-only users must confirm an
emailed code before setting their first password or deleting their account. Setting a password remains a prerequisite
for email changes and Google unlinking. Ordinary Google login/linking and session revocation/sign-out are unchanged.

`auth.reauthentication.request(userId, sessionId, action, locale?)` queues an eight-digit random code and returns an
opaque challenge token. `verify(userId, sessionId, action, challengeToken, code)` returns a single-use authorization
token. Challenges expire after five minutes, allow five attempts, and have a per-session 60-second resend cooldown.
Resending replaces that session's earlier challenges and grants. Code hashes include the secret challenge token; only
token hashes are persisted.

Adapters must atomically reserve the cooldown and replace challenges, and atomically count verification attempts,
including failed attempts. Successful verification consumes the challenge. Authorization grants expire after five
minutes, are bound to user/session/action, and are consumed in the same transaction as the sensitive mutation.
Session ownership and expiry are checked again at use. Session deletion cascades to its grants. Custom email adapters
must handle the `reauthentication` event with `{ code, action }`.

The Express request/verify routes are `POST /me/reauthentication` and `POST /me/reauthentication/verify`, relative to the
auth mount. They accept `{ action }` and `{ action, code }`, require authentication, JSON, and a trusted origin, and
return 204. Challenge/authorization tokens stay in HttpOnly cookies, never URLs or browser storage. Core callers pass
`SensitiveActionAuthorization` containing the live public `sessionId` and either `password` or `reauthenticationToken`.
`PATCH /me` and `DELETE /me/google` require `{ password, ... }`; `DELETE /me` accepts `{ password? }`; password
updates use `{ oldPassword?, newPassword }`.

The profile UI requests passwords in confirmation dialogs. Google-only users request and enter a code in place;
verification enables the selected action but never submits it automatically. Deletion still requires typing the email
and explicitly clicking the final delete button.

## Security policies

| Change                       | Confirmation              | Sessions revoked | Also invalidated                           |
| ---------------------------- | ------------------------- | ---------------- | ------------------------------------------ |
| Password change or reset     | current password or token | all              | reset tokens, grants, pending email change |
| Email change                 | password, then email link | all              | pending email-change token                 |
| Google unlink                | password                  | all              | reset tokens, grants, pending email change |
| Account deletion             | password or emailed code  | all              | everything owned by the user               |
| Google link                  | password                  | none             | none                                       |
| First password (Google-only) | emailed code              | none             | none                                       |
| Sign-out, session revocation | none                      | selected         | grants bound to those sessions             |

Email verification is optional for password login unless `requireEmailVerification` is set. Google sign-in never links
by email.

## Stability policy

Stable within a major version (and kept as stable as possible during the beta): `AuthCore` configuration, `start`,
`close`, and the public methods of its service instances; the adapter interfaces; errors and their codes; events;
the `./schemas` and `./endpoints` subpath exports; and every export of the express, client, react, and ui packages.
Members tagged `@internal` (service and manager constructors, and transport-only methods such as
`reauthentication.authorize` and `issuePasswordAuthorization`) may change in any release.

## HTTP API

Mount `createAuthRouter(authCore, { appUrl })` from `@mysamyr/express` in an Express app. `appUrl` is the frontend URL
used to build email links and OAuth redirects; `pages` overrides individual page paths. The router validates request
bodies with the core Zod schemas and supports sign-up/sign-in/out, email verification, password reset, profile and
password management, session listing/revocation, and optional Google OAuth. The router parses JSON bodies and
cookies itself (reusing `req.body` and `req.cookies` when the host already parsed them) and sends
`Cache-Control: no-store` on every response. The host app provides only CORS.

`authenticate(auth, { cookies })` validates the session cookie for host routes and sets
`req.keychain = { userId, sessionId }`; `requireAuth` rejects with 401 when it is absent, and `getAuth(req)` returns it
or throws. Pass the same `cookies` options to `authenticate` and the router. A request already resolved by
`authenticate` is not validated again inside the router.

Before session loading, unsafe methods require an exact trusted `Origin`, falling back to the `Referer` origin only
when `Origin` is absent. Missing, malformed, opaque, or untrusted origins return 403 `CSRF_ORIGIN_REJECTED`.
`trustedOrigins` defaults to the `appUrl` origin; keep credentialed CORS aligned. Production origins must use HTTPS.
Endpoints with validated bodies require `application/json` (415 otherwise). GET/HEAD/OPTIONS bypass origin checks;
Google callbacks retain OAuth state validation. CSRF protection does not defend against trusted-origin XSS.

The router applies per-account and per-IP rate limits to authentication and sensitive-action routes (429
`RATE_LIMITED`). The default store is process-local; multiple instances must supply a shared atomic `RateLimitStore`.
A failing store rejects the request rather than disabling limits.

`AuthEndpoints` and `DEFAULT_ENDPOINTS` in `@mysamyr/core/endpoints` define shared relative route paths;
`compilePath` resolves parameterized paths. Pass endpoint overrides to both `createAuthRouter` and the client/provider.
Request and response schemas and DTO types are exported from `@mysamyr/core/schemas`. The core root entry point
includes server-side code and should not be runtime-imported in a browser.

## Client-side architecture

`KeychainClient` uses `fetch`, includes credentials for cookie sessions, and sends `Accept-Language` (default `en`);
`setLocale` updates subsequent requests. Every request has a timeout (15 seconds by default) combined with an optional
caller `signal`. API failures throw `AuthApiError` with the server's `code` and validated `fieldErrors`; transport
failures use status 0 with `NETWORK_ERROR`, `TIMEOUT`, or `INVALID_RESPONSE`, and caller aborts rethrow the native
`AbortError`. Browsers are supported natively; on Node.js the caller forwards cookies through `headers`.

The host owns language state and passes it through `AuthProvider`'s `locale` prop. `AuthProvider` loads the current
user with SWR in a cache it creates once and owns, so a host `SWRConfig` cannot change its behavior. Keys include the
API URL, so several providers stay isolated. Only a 401 from `/me` means signed out; other failures surface as `error`
and keep the last known user. The sessions cache is cleared when the user becomes signed out. With `initialState`
(including `{ user: null }`), the first render uses it and skips the mount request, so server and client output match;
without it, `isLoaded` is `false` on both. The provider consumes OAuth and confirmation redirect query parameters once
and exposes them as codes through `useAuthNotifications`; it renders no DOM.

`@mysamyr/ui` builds on those hooks and provides sign-in, sign-up, email verification, password recovery,
email-change confirmation, user-button, profile, and notification components in English and Ukrainian. Page links
come from the provider's `pages`. Its stylesheet is built with Tailwind's `kc` prefix and no preflight; a minimal
reset is scoped to elements under `[data-kc]`, which marks every component root and portal, so the stylesheet never
restyles host markup or collides with host Tailwind classes.

The examples in `apps/api-example` and `apps/web-example` show server wiring and React integration.

## Operations

- **Logging:** pass `logger` (any object with `debug`, `info`, `warn`, `error`, such as pino) to `AuthCore`. Keys such
  as passwords, tokens, codes, and cookies are redacted, and a throwing logger never breaks a request.
- **Events:** pass `onEvent` to receive typed `AuthEvent`s (sign-in, failed sign-in, registration, password and email
  changes, session revocation, OAuth linking, account deletion, failed email delivery) for audit logs or metrics.
  Handlers run after the change and cannot block or fail it.
- **Cleanup:** the background job deletes expired sessions and reauthentication grants every
  `delivery.cleanupIntervalMs`, and sent or failed outbox rows older than `delivery.outboxRetentionMs`. Indexes on
  `expiresAt`, outbox status, and creation time keep these queries cheap.
- **Shutdown:** call `auth.close()`, then close the email adapter and database client.

## Production checklist

- Generate `secret` with at least 32 random characters and keep it stable; rotating it invalidates queued emails and
  email-change links.
- Serve the frontend and API over HTTPS with `NODE_ENV=production` so cookies are `Secure`.
- Set `appUrl` to the public frontend URL and list every additional frontend origin in `trustedOrigins`.
- Configure Express `trust proxy` for your exact proxy hops.
- Use a shared `rateLimitStore` when running more than one API instance.
- Apply the Prisma migration, including the `email_outbox` table, before starting the API.
- Keep the email adapter's timeouts below `delivery.leaseMs`, and alert on `email.deliveryFailed` events.
- Handle `SIGTERM` by calling `auth.close()`.

## Releasing

Packages are versioned together with Changesets in `beta` pre mode and published by `.github/workflows/release.yml`
through npm trusted publishing with provenance. `npm run pack:check` validates package contents with publint, attw,
and an `npm pack` dry run. Before the first release, the maintainer must own the `@mysamyr` npm scope with 2FA
enabled and create the protected `npm-release` GitHub environment. npm accepts trusted publishers only for existing
packages, so the first release uses a granular `NPM_TOKEN` secret in that environment; afterwards register
`release.yml` as the trusted publisher for each package and delete the token.
