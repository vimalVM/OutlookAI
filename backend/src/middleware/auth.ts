import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from '../config/firebase';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError } from './errorHandler';
import { logger } from './requestLogger';

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  if (!token) {
    next(new UnauthorizedError('No token provided'));
    return;
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    (req as AuthenticatedRequest).uid = decodedToken.uid;
    logger.info({ uid: decodedToken.uid, requestId: (req as any).requestId }, 'User authenticated');
    next();
  } catch (error) {
    logger.warn({ error, requestId: (req as any).requestId }, 'Token verification failed');
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
