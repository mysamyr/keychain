# @mysamyr/client

Typed `fetch` client for the Keychain authentication API.

**Requires:** a modern browser, or Node.js 24+.

```sh
npm install @mysamyr/client
```

```ts
import { AuthApiError, KeychainClient } from '@mysamyr/client';

const client = new KeychainClient('https://api.example.com', { locale: 'en' });

try {
  const user = await client.signIn({ email, password, rememberMe: true });
} catch (error) {
  if (error instanceof AuthApiError) console.log(error.code, error.fieldErrors);
}
```

Pass `''` as the base URL when the API is served from the page's origin. Every
method accepts a final `{ signal }` argument for cancellation.

## Options

| Option         | Default                                              |
| -------------- | ---------------------------------------------------- |
| `authBasePath` | `/api/auth`                                          |
| `endpoints`    | `DEFAULT_ENDPOINTS`; must match the server overrides |
| `locale`       | `en`; change later with `client.setLocale()`         |
| `timeoutMs`    | `15000`                                              |
| `fetch`        | global `fetch`                                       |
| `headers`      | none; extra headers for every request                |

Failures throw `AuthApiError` with the server's `code`, or `statusCode` `0` and
code `NETWORK_ERROR` / `TIMEOUT`. Browsers send cookies automatically
(`credentials: 'include'`); on the server, forward the incoming `cookie` header
through `headers`.
