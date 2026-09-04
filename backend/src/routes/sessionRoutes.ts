import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { createSessionLimiter, createAnswerLimiter } from '../middleware/rateLimiter';
import { createSessionSchema, submitAnswerSchema } from '../schemas';
import { AuthenticatedRequest, CreateSessionResponse, SubmitAnswerResponse } from '../types';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import * as questionService from '../services/questionService';
import * as sessionRepository from '../repositories/sessionRepository';
import * as transcriptionService from '../services/transcriptionService';
import * as disfluencyService from '../services/disfluencyService';
import * as sentimentService from '../services/sentimentService';
import * as gradingService from '../services/gradingService';
import * as fusionService from '../services/fusionService';
import * as faqRepository from '../repositories/faqRepository';
import { logger } from '../middleware/requestLogger';
import { FieldValue } from 'firebase-admin/firestore';

export default function createSessionRoutes(): Router {
const router = Router();

// Multer for audio upload — 10MB limit, restricted to audio/video types
const ALLOWED_MIMETYPES = new Set([
  'audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/mpeg',
  'video/webm', 'video/mp4',
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Unsupported file type: ${file.mimetype}. Only audio/video files are accepted.`) as any);
    }
  },
});

/**
 * POST /sessions
 * Creates a new interview session
 */
router.post(
  '/',
  authMiddleware,
  createSessionLimiter(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          `Invalid request body: ${parsed.error.issues.map((e: any) => e.message).join(', ')}`
        );
      }

      const uid = (req as AuthenticatedRequest).uid;
      const { domainId } = parsed.data;

      // Verify domain exists
      const domain = faqRepository.getDomain(domainId);
      if (!domain) {
        throw new NotFoundError(`Domain not found: ${domainId}`);
      }

      // Select and rephrase questions
      const questions = await questionService.selectAndRephraseQuestions(domainId, 3);

      // Create session in Firestore
      const sessionId = await sessionRepository.create(uid, {
        domainId,
        status: 'in_progress',
        questions,
        attempts: [],
        report: null,
        startedAt: FieldValue.serverTimestamp(),
        completedAt: null,
      });

      const response: CreateSessionResponse = {
        sessionId,
        firstQuestion: {
          questionId: questions[0].faqQuestionId,
          questionText: questions[0].rephrasedText,
        },
      };

      logger.info({ sessionId, uid, domainId }, 'Session created');
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /sessions
 * Get all completed sessions for the user
 */
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as AuthenticatedRequest).uid;
      const sessions = await sessionRepository.getCompletedByUser(uid);
      res.json({ sessions });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /sessions/:id
 * Get session details (for the Interview page)
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as AuthenticatedRequest).uid;
      const sessionId = req.params.id as string;

      const session = await sessionRepository.getById(sessionId, uid);
      res.json(session);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /sessions/:id/answers
 * Submit an answer for the current question
 */
router.post(
  '/:id/answers',
  authMiddleware,
  createAnswerLimiter(),
  upload.single('audioBlob'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as AuthenticatedRequest).uid;
      const sessionId = req.params.id as string;

      // Parse JSON fields from form data (safe parsing)
      let parsedVisualMetrics;
      let parsedAudioProsodyMetrics;
      try {
        parsedVisualMetrics = typeof req.body.visualMetrics === 'string'
          ? JSON.parse(req.body.visualMetrics)
          : req.body.visualMetrics;
        parsedAudioProsodyMetrics = typeof req.body.audioProsodyMetrics === 'string'
          ? JSON.parse(req.body.audioProsodyMetrics)
          : req.body.audioProsodyMetrics;
      } catch {
        throw new ValidationError('Malformed JSON in visualMetrics or audioProsodyMetrics');
      }

      const bodyData = {
        questionId: req.body.questionId,
        visualMetrics: parsedVisualMetrics,
        audioProsodyMetrics: parsedAudioProsodyMetrics,
      };

      const parsed = submitAnswerSchema.safeParse(bodyData);
      if (!parsed.success) {
        throw new ValidationError(
          `Invalid request body: ${parsed.error.issues.map((e: any) => e.message).join(', ')}`
        );
      }

      // Verify session ownership and status
      const session = await sessionRepository.getById(sessionId, uid);

      if (session.status === 'completed') {
        throw new ValidationError('This session is already completed. No more answers can be submitted.');
      }

      // Answer deduplication — ensure questionId matches the expected next question
      const expectedIndex = session.attempts.length;
      if (expectedIndex >= session.questions.length) {
        throw new ValidationError('All questions in this session have already been answered.');
      }
      const expectedQuestionId = session.questions[expectedIndex].faqQuestionId;
      if (parsed.data.questionId !== expectedQuestionId) {
        throw new ValidationError(`Unexpected question ID. Expected: ${expectedQuestionId}`);
      }

      // Get audio file
      const audioFile = req.file;
      if (!audioFile) {
        throw new ValidationError('Audio file (audioBlob) is required');
      }

      const { questionId, visualMetrics, audioProsodyMetrics } = parsed.data;

      // 1. Transcribe audio
      const transcript = await transcriptionService.transcribeAudio(audioFile.buffer, audioFile.mimetype);

      // 2. Analyze disfluency
      const disfluencyMetrics = disfluencyService.analyzeDisfluency(transcript);

      // 3. Analyze sentiment
      const sentimentProfile = await sentimentService.analyzeSentiment(transcript);

      // 4. Grade against FAQ
      const faqQuestion = faqRepository.getQuestion(session.domainId, questionId);
      if (!faqQuestion) {
        throw new NotFoundError(`Question not found: ${questionId}`);
      }
      const contentGrading = await gradingService.gradeAnswer(transcript, faqQuestion);

      // 5. Build attempt
      const attempt = {
        questionId,
        transcript,
        audioMetrics: audioProsodyMetrics,
        visualMetrics,
        sentimentProfile,
        contentGrading,
        disfluencyMetrics,
      };

      // 6. Append attempt to session
      await sessionRepository.appendAttempt(sessionId, uid, attempt);

      // 7. Check if session is complete
      const updatedSession = await sessionRepository.getById(sessionId, uid);
      const currentAttemptIndex = updatedSession.attempts.length;
      const totalQuestions = updatedSession.questions.length;

      if (currentAttemptIndex >= totalQuestions) {
        // Generate report and complete session
        const report = fusionService.generateReport(
          updatedSession.attempts,
          updatedSession.questions,
          updatedSession.domainId
        );
        await sessionRepository.completeSession(sessionId, uid, report);

        const response: SubmitAnswerResponse = { sessionComplete: true };
        res.json(response);
      } else {
        // Return next question
        const nextQ = updatedSession.questions[currentAttemptIndex];
        const response: SubmitAnswerResponse = {
          sessionComplete: false,
          nextQuestion: {
            questionId: nextQ.faqQuestionId,
            questionText: nextQ.rephrasedText,
          },
        };
        res.json(response);
      }
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /sessions/:id/report
 * Get the report for a completed session
 */
router.get(
  '/:id/report',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as AuthenticatedRequest).uid;
      const sessionId = req.params.id as string;

      const session = await sessionRepository.getById(sessionId, uid);

      // If report hasn't been generated yet, generate it
      if (!session.report && session.attempts.length > 0) {
        const report = fusionService.generateReport(
          session.attempts,
          session.questions,
          session.domainId
        );
        await sessionRepository.setReport(sessionId, uid, report);
        res.json({ report });
        return;
      }

      res.json({ report: session.report });
    } catch (err) {
      next(err);
    }
  }
);

return router;
}
