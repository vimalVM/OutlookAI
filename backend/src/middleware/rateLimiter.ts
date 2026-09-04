import rateLimit from 'express-rate-limit';
import { getConfig } from '../config/env';

export function createSessionLimiter() {
  const config = getConfig();
  return rateLimit({
    windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(config.RATE_LIMIT_MAX_REQUESTS, 10),
    message: {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many session creation requests. Please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req as any).uid || 'unknown';
    },
    validate: { xForwardedForHeader: false },
  });
}

export function createAnswerLimiter() {
  const config = getConfig();
  return rateLimit({
    windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(config.RATE_LIMIT_MAX_REQUESTS, 10) * 3, // More lenient for answers (multiple per session)
    message: {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many answer submissions. Please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req as any).uid || 'unknown';
    },
    validate: { xForwardedForHeader: false },
  });
}
