# @mysamyr/ui

Ready-to-use React authentication components built on `@mysamyr/react`.

**Requires:** React and React DOM `^19.3.1`.

```sh
npm install @mysamyr/ui @mysamyr/react
```

```tsx
import '@mysamyr/ui/styles.css';
import { AuthProvider } from '@mysamyr/react';
import { AuthNotifications, SignIn } from '@mysamyr/ui';

export function App() {
  return (
    <AuthProvider apiBaseUrl="https://api.example.com">
      <AuthNotifications />
      <SignIn />
    </AuthProvider>
  );
}
```

Import the stylesheet once. It contains only `kc:`-prefixed classes and no global
reset, so it does not affect the rest of your app. In frameworks with server and
client components, render the provider and components from a client component.

## Components

| Component            | Page (`pages` key)                    |
| -------------------- | ------------------------------------- |
| `SignIn`             | `signIn` (`/sign-in`)                 |
| `SignUp`             | `signUp` (`/sign-up`)                 |
| `VerifyEmail`        | `verifyEmail` (`/verify-email`)       |
| `ForgotPassword`     | `forgotPassword` (`/forgot-password`) |
| `ResetPassword`      | `resetPassword` (`/reset-password`)   |
| `ConfirmEmailChange` | `confirmEmailChange`                  |
| `UserProfile`        | `profile` (`/profile`)                |
| `UserButton`         | anywhere                              |
| `AuthNotifications`  | once, anywhere inside the provider    |

Links between components use the provider's `pages`; per-component URL props
override them. Serve `VerifyEmail`, `ResetPassword`, and `ConfirmEmailChange` at
the pages configured in `@mysamyr/express`, because email links point to them;
they read `?token=` from the URL. Components use the provider's `locale` (`en` or
`uk`, falling back to English).

## Theming

Pass `appearance={{ variables, elements }}` to a component, or set CSS variables
in your own CSS, loaded after the stylesheet: `--kc-color-primary`, `--kc-color-primary-hover`,
`--kc-color-primary-light`, `--kc-color-danger`, `--kc-color-danger-hover`,
`--kc-color-danger-light`, `--kc-color-success`, `--kc-color-success-light`,
`--kc-border-radius`, `--kc-input-radius`, `--kc-font-family`, and the gray scale
`--kc-color-gray-50` … `--kc-color-gray-900`.
