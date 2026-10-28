import {
  authenticate,
  createAuthRouter,
  getAuth,
  requireAuth,
} from '@mysamyr/express';
import cors from 'cors';
import express from 'express';

import { auth } from './auth.js';
import { APP_URL } from './config/index.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { loggerMiddleware } from './middleware/logger.js';
import { notFoundMiddleware } from './middleware/not-found.js';

export const app = express();

app.use(loggerMiddleware);
app.use(cors({ origin: new URL(APP_URL).origin, credentials: true }));

app.use('/api/auth', createAuthRouter(auth, { appUrl: APP_URL }));

app.use(authenticate(auth));
app.get('/api/whoami', requireAuth, (req, res) => {
  res.json(getAuth(req));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
