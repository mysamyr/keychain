# Coding Guidelines

## Project Overview

Keychain is a privacy-first, self-hosted authentication monorepo utilizing `npm workspaces` (Node >= 24, npm v11). It
features a framework-agnostic core and a plugin-driven architecture for databases and email providers.

## Stack

React 19, TypeScript 6, Vite, Tailwind, tsdown, zod, Radix UI

## Monorepo Structure

- **`packages/core`**: Core business logic and TypeScript interfaces (Auth, Sessions, Tokens). **Never** import external
  services, databases, or UI libraries here.
- **`packages/db-prisma`**: Database adapter implementing core interfaces for session/user storage.
- **`packages/email-nodemailer`**: Email adapter implementing core logic for transactional emails.
- **`packages/react`**: Headless UI abstractions (Context, Hooks like `useAuth`, `useUser`).
- **`packages/ui`**: Stylized React components (`<SignIn />`, `<SignUp />`) consuming `@mysamyr/react`.
- **`apps/api-example`**: Node.js backend example demonstrating Dependency Injection (wiring core with
  Prisma/Nodemailer).
- **`apps/web-example`**: Example React frontend consuming the UI and React packages.

## Architecture & Code Conventions

- **Dependency Injection**: Features in `core` must exclusively rely on `IDatabaseAdapter` and `IEmailAdapter`. Adapter
  packages provide the concrete implementations.
- **Session Management**: We use Database-backed sessions, not purely stateless JWTs. Operations should create/revoke
  session records via the database adapter.
- **TypeScript Strictness**: `NodeNext` module resolution is strictly enforced. Ensure proper ES Modules usage and type
  exports.

## Essential Workflows & Commands

Run these scripts from the project root after significant changes to ensure workspace integrity:

- **`npm run typecheck`**: Validates TS compilation across all workspaces (crucial for verifying inter-package type
  safety).
- **`npm run lint`** / **`npm run lint:fix`**: Checks for code quality and auto-fixes standard eslint issues.
- **`npm run format`**: Formats all files using Prettier.
- Don't create or run any tests.
- Don't update root README.md file.
