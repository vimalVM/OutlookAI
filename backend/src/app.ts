import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { getConfig } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import domainRoutes from './routes/domainRoutes';
import createSessionRoutes from './routes/sessionRoutes';
import candidateRoutes from './routes/candidateRoutes';

export function createApp(): express.Application {
  const app = express();
  const config = getConfig();

  // ─── Security ────────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginOpenerPolicy: false,
  }));

  // ─── CORS — locked to actual frontend origin ────────────────────────────────
  app.use(
    cors({
      origin: config.FRONTEND_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Body Parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ─── Request Logging ─────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ─── Health Check ────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── Routes ──────────────────────────────────────────────────────────────────
  app.use('/domains', domainRoutes);
  app.use('/sessions', createSessionRoutes());
  app.use('/candidates', candidateRoutes);

  // ─── Centralized Error Handler ───────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
