import type { SessionDTO } from '@mysamyr/core/schemas';
import type { Request, Response, Router } from 'express';

import type { RouteContext } from '../context.js';
import { getAuth, requireAuth } from '../middleware/session.js';

export function registerSessionRoutes(router: Router, ctx: RouteContext): void {
  const { authCore, endpoints, cookies } = ctx;

  router.get(
    endpoints.getSessions,
    requireAuth,
    async (req: Request, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      const sessions = await authCore.session.getUserSessions(userId);
      const response: SessionDTO[] = sessions.map(session => ({
        id: session.id,
        userAgent: session.userAgent,
        ip: session.ip,
        createdAt: session.createdAt.toISOString(),
        isCurrent: session.id === sessionId,
      }));
      res.status(200).json(response);
    }
  );

  router.post(
    endpoints.revokeOtherSessions,
    requireAuth,
    async (req: Request, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      await authCore.session.revokeOthers(userId, sessionId);
      res.sendStatus(204);
    }
  );

  router.delete(
    endpoints.revokeSession,
    requireAuth,
    async (req: Request<{ id: string }>, res: Response) => {
      const { userId, sessionId } = getAuth(req);
      await authCore.session.revokeUserSession(userId, req.params.id);
      if (req.params.id === sessionId) {
        cookies.clear(res, 'session', 'reauthentication');
      }
      res.sendStatus(204);
    }
  );
}
