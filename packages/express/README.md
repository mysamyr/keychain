# @mysamyr/express

Express router and middleware for the Keychain authentication API.

**Requires:** Node.js 24+, Express `^5.3.0`, and a configured `AuthCore`.

```sh
npm install @mysamyr/express express cors
```

```ts
import cors from 'cors';
import express from 'express';
import {
  authenticate,
  createAuthRouter,
  getAuth,
  requireAuth,
} from '@mysamyr/express';

const appUrl = 'https://app.example.com';

const app = express();
app.use(cors({ origin: appUrl, credentials: true }));
app.use('/api/auth', createAuthRouter(auth, { appUrl }));

// Protect your own routes
app.use(authenticate(auth));
app.get('/api/projects', requireAuth, (req, res) => {
  const { userId } = getAuth(req);
  res.json(listProjects(userId));
});
```

The router parses JSON bodies and cookies itself. CORS is needed only when the
frontend runs on a different origin. `authenticate` sets `req.keychain` for a
valid session cookie; `requireAuth` responds `401` without one. Pass the same
`cookies` options to `authenticate` and `createAuthRouter`.

## Options

| Option                                               | Default                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `appUrl`                                             | required; frontend URL for email links and redirects          |
| `pages`                                              | `DEFAULT_PAGES`, paths relative to `appUrl`                   |
| `trustedOrigins`                                     | `[origin of appUrl]`; exact origins allowed to mutate         |
| `cookies.prefix`                                     | `keychain` (cookies are `keychain_session`, …)                |
| `cookies.secure`                                     | `true` when `NODE_ENV=production`                             |
| `cookies.sameSite`, `cookies.domain`, `cookies.path` | `lax`, host-only, `/`                                         |
| `endpoints`                                          | `DEFAULT_ENDPOINTS` from `@mysamyr/core/endpoints`            |
| `rateLimitStore`                                     | in-memory; pass a shared store when running several instances |

`DEFAULT_PAGES`: `signIn` `/sign-in`, `signUp` `/sign-up`, `profile` `/profile`,
`afterSignIn` `/`, `verifyEmail` `/verify-email`, `forgotPassword`
`/forgot-password`, `resetPassword` `/reset-password`, `confirmEmailChange`
`/confirm-email-change`. The frontend must serve these pages; `@mysamyr/ui`
provides matching components.

Behind a reverse proxy, set Express `trust proxy` to your exact hop
configuration so rate limits and session metadata use the client IP.
