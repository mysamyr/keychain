// All environment variables are loaded from .env via the --env-file=.env flag
// passed to the tsx / node process (see package.json scripts).
// This module reads process.env once at startup and re-exports typed constants,
// so the rest of the codebase never accesses process.env directly.

export const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// Server
export const PORT = Number(process.env['PORT'] ?? 3000);

// Frontend
export const APP_URL = process.env['APP_URL'] ?? 'http://localhost:5173';

// Database
export const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://keychain:keychain@localhost:5432/keychain';

// Auth
export const AUTH_SECRET =
  process.env['AUTH_SECRET'] ??
  'default-dev-secret-change-in-production-please';

// Email (SMTP)
export const APP_NAME = process.env['APP_NAME'] ?? 'Keychain';
export const SUPPORT_CONTACT =
  process.env['SUPPORT_CONTACT'] ?? 'support@keychain.test';
export const SMTP_HOST = process.env['SMTP_HOST'] ?? 'localhost';
export const SMTP_PORT = Number(process.env['SMTP_PORT'] ?? 1025);
export const SMTP_USER = process.env['SMTP_USER'] ?? '';
export const SMTP_PASS = process.env['SMTP_PASS'] ?? '';
export const EMAIL_FROM =
  process.env['EMAIL_FROM'] ?? 'Keychain <noreply@keychain.test>';

// Google OAuth (optional — both must be set to enable OAuth)
export const GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID'];
export const GOOGLE_CLIENT_SECRET = process.env['GOOGLE_CLIENT_SECRET'];
export const GOOGLE_REDIRECT_URI =
  process.env['GOOGLE_REDIRECT_URI'] ??
  'http://localhost:3000/api/auth/oauth/google/callback';
