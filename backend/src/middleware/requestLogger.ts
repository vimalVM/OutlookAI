import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { randomUUID } from 'crypto';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();

  logger.info(
    {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    },
    'Incoming request'
  );

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
      },
      'Request completed'
    );
  });

  next();
}
