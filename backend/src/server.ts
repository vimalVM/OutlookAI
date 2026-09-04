import * as dotenv from 'dotenv';

// Load .env BEFORE anything else
dotenv.config();

import { loadEnv, getConfig } from './config/env';
import { initializeFirebase } from './config/firebase';
import { loadFaqs } from './repositories/faqRepository';
import { createApp } from './app';
import { logger } from './middleware/requestLogger';

async function main(): Promise<void> {
  // 1. Validate environment — fail fast
  logger.info('Validating environment...');
  loadEnv();

  // 2. Initialize Firebase Admin SDK
  logger.info('Initializing Firebase...');
  initializeFirebase();

  // 3. Load FAQ data into memory
  logger.info('Loading FAQ data...');
  loadFaqs();

  // 4. Create and start Express app
  const app = createApp();
  const config = getConfig();
  const port = parseInt(config.PORT, 10);

  app.listen(port, () => {
    logger.info(
      {
        port,
        env: config.NODE_ENV,
        frontendOrigin: config.FRONTEND_ORIGIN,
      },
      `🚀 OutlookAI server running on port ${port}`
    );
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

// ─── Global Error Handlers ──────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
