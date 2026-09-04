import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import * as sessionRepository from '../repositories/sessionRepository';

const router = Router();

/**
 * GET /candidates/me/reports
 * Returns all completed session summaries for the authenticated user
 */
router.get(
  '/me/reports',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as AuthenticatedRequest).uid;
      const reports = await sessionRepository.getCompletedByUser(uid);
      res.json({ reports });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
