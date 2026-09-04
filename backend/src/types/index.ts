import { Request } from 'express';

// ─── Extend Express Request ────────────────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  uid: string;
}

// ─── Confidence Bands ──────────────────────────────────────────────────────────
export type ConfidenceBand = 'developing' | 'comfortable' | 'strong';

// ─── FAQ Data Model (file-based, unchanged) ────────────────────────────────────
export interface FaqQuestion {
  id: string;
  question: string;
  ideal_answer: string;
  key_points: string[];
}

export interface FaqDomain {
  domain: string;
  type: 'technical' | 'non_technical';
  questions: FaqQuestion[];
}

// ─── Domain List Response ──────────────────────────────────────────────────────
export interface DomainInfo {
  id: string;
  domain: string;
  type: 'technical' | 'non_technical';
  questionCount: number;
}

// ─── Audio & Visual Metrics (from client) ──────────────────────────────────────
export interface AudioProsodyMetrics {
  averagePitch: number;
  pitchVariability: number;
  averageLoudness: number;
  loudnessVariability: number;
  speechRate: number;
  pauseCount: number;
  totalPauseDuration: number;
}

export interface VisualMetrics {
  averageGazeScore: number;
  postureScore: number;
  fidgetingScore: number;
  smileFrequency: number;
  headMovementScore: number;
}

// ─── Sentiment Profile ─────────────────────────────────────────────────────────
export interface SentimentProfile {
  dominant: string;
  scores: Record<string, number>;
}

// ─── Disfluency Metrics ────────────────────────────────────────────────────────
export interface DisfluencyMetrics {
  fillerWordCount: number;
  fillerWords: Record<string, number>;
  repetitionCount: number;
  totalWords: number;
  disfluencyRate: number;
}

// ─── Content Grading ───────────────────────────────────────────────────────────
export interface ContentGrading {
  band: ConfidenceBand;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  reasoning: string;
}

// ─── Session Attempt ───────────────────────────────────────────────────────────
export interface Attempt {
  questionId: string;
  transcript: string;
  audioMetrics: AudioProsodyMetrics;
  visualMetrics: VisualMetrics;
  sentimentProfile: SentimentProfile;
  contentGrading: ContentGrading;
  disfluencyMetrics: DisfluencyMetrics;
}

// ─── Per-Question Breakdown (in Report) ────────────────────────────────────────
export interface QuestionBreakdown {
  questionId: string;
  questionText: string;
  contentBand: ConfidenceBand;
  keyStrengths: string[];
  observations: string[];
}

// ─── Session Report ────────────────────────────────────────────────────────────
export interface SessionReport {
  confidenceBand: ConfidenceBand;
  strengths: string[];
  growthAreas: string[];
  perQuestionBreakdown: QuestionBreakdown[];
  deliveryPatternFlag: boolean;
  deliveryPatternNote: string;
}

// ─── Session Question ──────────────────────────────────────────────────────────
export interface SessionQuestion {
  faqQuestionId: string;
  rephrasedText: string;
}

// ─── Session Status ────────────────────────────────────────────────────────────
export type SessionStatus = 'in_progress' | 'completed';

// ─── Firestore Session Document ────────────────────────────────────────────────
export interface SessionDocument {
  uid: string;
  domainId: string;
  status: SessionStatus;
  questions: SessionQuestion[];
  attempts: Attempt[];
  report: SessionReport | null;
  startedAt: any;
  completedAt: any | null;
}

// ─── API Response Types ────────────────────────────────────────────────────────
export interface CreateSessionResponse {
  sessionId: string;
  firstQuestion: {
    questionId: string;
    questionText: string;
  };
}

export interface SubmitAnswerResponse {
  sessionComplete: boolean;
  nextQuestion?: {
    questionId: string;
    questionText: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// ─── Report Summary (for dashboard/history) ────────────────────────────────────
export interface ReportSummary {
  sessionId: string;
  domainId: string;
  confidenceBand: ConfidenceBand;
  completedAt: string;
  questionCount: number;
}
