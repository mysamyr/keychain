# @mysamyr/react

Headless React provider and hooks for Keychain. Renders no UI.

**Requires:** React and React DOM `^19.3.1`.

```sh
npm install @mysamyr/react
```

```tsx
import { AuthProvider, useUser } from '@mysamyr/react';

function Account() {
  const { user } = useUser();
  return <p>{user ? `Signed in as ${user.email}` : 'Signed out'}</p>;
}

export function App() {
  return (
    <AuthProvider apiBaseUrl="https://api.example.com" locale="en">
      <Account />
    </AuthProvider>
  );
}
```

## Provider props

| Prop           | Default                                                  |
| -------------- | -------------------------------------------------------- |
| `apiBaseUrl`   | required unless `client` is passed; `''` for same origin |
| `authBasePath` | `/api/auth`                                              |
| `endpoints`    | `DEFAULT_ENDPOINTS`                                      |
| `client`       | none; a preconfigured `KeychainClient`                   |
| `locale`       | `en`; the host owns language state                       |
| `pages`        | `DEFAULT_PAGES`; frontend paths used by UI links         |
| `navigate`     | none; pass your router's navigate function               |
| `initialState` | none; pass `{ user }` from the server                    |

With `initialState`, the first render is already loaded and the initial `/me`
request is skipped, so server and client output match. Without it, `isLoaded` is
`false` until the request finishes. Only a `401` means signed out; other
failures are exposed as `error` and keep the last known user.

## Hooks

`useAuth`, `useUser`, `useSignIn`, `useSignUp`, `useVerifyEmail`, `useSession`,
`useForgotPassword`, `useResetPassword`, `useVerifyResetToken`,
`useConfirmEmailChange`, `useAuthNotifications`, `useAuthPages`, `useLocale`,
`useAuthNavigate`.

`useAuthNotifications()` returns OAuth and email-change redirect results
(`{ notifications, dismiss }`) for your own toasts; `@mysamyr/ui` provides a
ready `<AuthNotifications />`.

Render the provider in a client component when your framework separates server
and client components.
