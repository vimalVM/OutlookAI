import { z } from 'zod';

// ─── Create Session ────────────────────────────────────────────────────────────
export const createSessionSchema = z.object({
  domainId: z.string().min(1, 'domainId is required'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ─── Submit Answer ─────────────────────────────────────────────────────────────
export const audioProsodyMetricsSchema = z.object({
  averagePitch: z.number().min(0).max(1000),
  pitchVariability: z.number().min(0).max(500),
  averageLoudness: z.number().min(0).max(200),
  loudnessVariability: z.number().min(0).max(200),
  speechRate: z.number().min(0).max(500),
  pauseCount: z.number().int().min(0).max(500),
  totalPauseDuration: z.number().min(0).max(3600),
});

export const visualMetricsSchema = z.object({
  averageGazeScore: z.number().min(0).max(1),
  postureScore: z.number().min(0).max(1),
  fidgetingScore: z.number().min(0).max(1),
  smileFrequency: z.number().min(0).max(1),
  headMovementScore: z.number().min(0).max(1),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'questionId is required').max(200),
  visualMetrics: visualMetricsSchema,
  audioProsodyMetrics: audioProsodyMetricsSchema,
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
