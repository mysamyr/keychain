import { AuthCore } from '@mysamyr/core';
import { PrismaAdapter } from '@mysamyr/db-prisma';
import { NodemailerAdapter } from '@mysamyr/email-nodemailer';
import { PrismaPg } from '@prisma/adapter-pg';

import {
  APP_NAME,
  AUTH_SECRET,
  DATABASE_URL,
  EMAIL_FROM,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
  SUPPORT_CONTACT,
} from './config/index.js';
import { PrismaClient } from './generated/prisma/index.js';

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5_000,
});
const prisma = new PrismaClient({ adapter });
try {
  // The PostgreSQL pool is lazy; a query verifies connectivity before the server starts.
  await prisma.$queryRaw`SELECT 1`;
} catch (cause) {
  throw new Error(
    'Failed to start API: unable to connect to PostgreSQL. ' +
      'Check DATABASE_URL and ensure the database is running and reachable.',
    { cause }
  );
}
const dbAdapter = new PrismaAdapter(prisma);

const emailAdapter = new NodemailerAdapter({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const googleConfig =
  GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
    ? {
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        redirectUri: GOOGLE_REDIRECT_URI,
      }
    : undefined;

export const auth = new AuthCore({
  db: dbAdapter,
  email: emailAdapter,
  appName: APP_NAME,
  senderAddress: EMAIL_FROM,
  supportContact: SUPPORT_CONTACT,
  secret: AUTH_SECRET,
  google: googleConfig,
});

/** Stop outbox dispatch, then release SMTP and database connections. */
export async function closeAuth(): Promise<void> {
  await auth.close();
  emailAdapter.close();
  await prisma.$disconnect();
}
