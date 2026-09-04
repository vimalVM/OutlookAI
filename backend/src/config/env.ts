import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, 'FIREBASE_CLIENT_EMAIL is required'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),

  // Groq API
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),

  // CORS
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('20'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

export function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const missing = Object.entries(formatted)
      .filter(([key, val]) => key !== '_errors' && val && typeof val === 'object' && '_errors' in val && (val as { _errors: string[] })._errors.length > 0)
      .map(([key, val]) => `  - ${key}: ${(val as { _errors: string[] })._errors.join(', ')}`)
      .join('\n');

    console.error(`\n❌ Environment validation failed:\n${missing}\n`);
    console.error('Copy .env.example to .env and fill in the required values.\n');
    process.exit(1);
  }

  config = result.data;
  return config;
}

export function getConfig(): EnvConfig {
  if (!config) {
    throw new Error('Config not loaded. Call loadEnv() first.');
  }
  return config;
}
