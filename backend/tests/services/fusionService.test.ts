import { describe, it, expect } from 'vitest';
import { generateReport } from '../../src/services/fusionService';
import { Attempt, SessionQuestion, ConfidenceBand } from '../../src/types';

// Helper to create a mock attempt
function createMockAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    questionId: 'test-q1',
    transcript: 'Test transcript response about the topic.',
    audioMetrics: {
      averagePitch: 150,
      pitchVariability: 20,
      averageLoudness: 60,
      loudnessVariability: 10,
      speechRate: 140,
      pauseCount: 3,
      totalPauseDuration: 2.5,
    },
    visualMetrics: {
      averageGazeScore: 0.75,
      postureScore: 0.8,
      fidgetingScore: 0.2,
      smileFrequency: 0.3,
      headMovementScore: 0.4,
    },
    sentimentProfile: {
      dominant: 'positive',
      scores: { positive: 0.8, negative: 0.2 },
    },
    contentGrading: {
      band: 'comfortable',
      keyPointsCovered: ['point1', 'point2'],
      keyPointsMissed: ['point3'],
      reasoning: 'Covered core concepts well.',
    },
    disfluencyMetrics: {
      fillerWordCount: 2,
      fillerWords: { um: 1, like: 1 },
      repetitionCount: 0,
      totalWords: 50,
      disfluencyRate: 0.04,
    },
    ...overrides,
  };
}

const mockQuestions: SessionQuestion[] = [
  { faqQuestionId: 'test-q1', rephrasedText: 'Tell me about virtual DOM' },
  { faqQuestionId: 'test-q2', rephrasedText: 'Explain closures' },
  { faqQuestionId: 'test-q3', rephrasedText: 'What is the event loop?' },
];

describe('FusionService', () => {
  describe('generateReport', () => {
    it('should generate a report with all required fields', () => {
      const attempts = [createMockAttempt()];
      const report = generateReport(attempts, mockQuestions, 'frontend-development');

      expect(report).toHaveProperty('confidenceBand');
      expect(report).toHaveProperty('strengths');
      expect(report).toHaveProperty('growthAreas');
      expect(report).toHaveProperty('perQuestionBreakdown');
      expect(report).toHaveProperty('deliveryPatternFlag');
      expect(report).toHaveProperty('deliveryPatternNote');
    });

    it('should return valid confidence band values only', () => {
      const attempts = [createMockAttempt()];
      const report = generateReport(attempts, mockQuestions, 'frontend-development');

      const validBands: ConfidenceBand[] = ['developing', 'comfortable', 'strong'];
      expect(validBands).toContain(report.confidenceBand);
    });

    it('should return "strong" band when all attempts are strong with clean delivery', () => {
      const attempts = [
        createMockAttempt({
          questionId: 'test-q1',
          contentGrading: {
            band: 'strong',
            keyPointsCovered: ['p1', 'p2', 'p3'],
            keyPointsMissed: [],
            reasoning: 'Excellent.',
          },
          disfluencyMetrics: {
            fillerWordCount: 0,
            fillerWords: {},
            repetitionCount: 0,
            totalWords: 60,
            disfluencyRate: 0,
          },
        }),
        createMockAttempt({
          questionId: 'test-q2',
          contentGrading: {
            band: 'strong',
            keyPointsCovered: ['p1', 'p2'],
            keyPointsMissed: [],
            reasoning: 'Great.',
          },
          disfluencyMetrics: {
            fillerWordCount: 1,
            fillerWords: { um: 1 },
            repetitionCount: 0,
            totalWords: 55,
            disfluencyRate: 0.018,
          },
        }),
      ];

      const report = generateReport(attempts, mockQuestions, 'frontend-development');
      expect(report.confidenceBand).toBe('strong');
    });

    it('should return "developing" band when all attempts are developing with high disfluency', () => {
      const attempts = [
        createMockAttempt({
          questionId: 'test-q1',
          contentGrading: {
            band: 'developing',
            keyPointsCovered: [],
            keyPointsMissed: ['p1', 'p2'],
            reasoning: 'Needs improvement.',
          },
          disfluencyMetrics: {
            fillerWordCount: 10,
            fillerWords: { um: 5, uh: 3, like: 2 },
            repetitionCount: 3,
            totalWords: 40,
            disfluencyRate: 0.325,
          },
        }),
      ];

      const report = generateReport(attempts, mockQuestions, 'frontend-development');
      expect(report.confidenceBand).toBe('developing');
    });

    it('should always lead with strengths', () => {
      const attempts = [createMockAttempt()];
      const report = generateReport(attempts, mockQuestions, 'frontend-development');

      expect(report.strengths.length).toBeGreaterThan(0);
    });

    it('should never use negative words in growth areas', () => {
      const attempts = [
        createMockAttempt({
          contentGrading: {
            band: 'developing',
            keyPointsCovered: [],
            keyPointsMissed: ['all points'],
            reasoning: 'Needs work.',
          },
          disfluencyMetrics: {
            fillerWordCount: 15,
            fillerWords: { um: 8, uh: 7 },
            repetitionCount: 5,
            totalWords: 30,
            disfluencyRate: 0.67,
          },
          visualMetrics: {
            averageGazeScore: 0.1,
            postureScore: 0.2,
            fidgetingScore: 0.8,
            smileFrequency: 0.05,
            headMovementScore: 0.1,
          },
        }),
      ];

      const report = generateReport(attempts, mockQuestions, 'frontend-development');

      for (const area of report.growthAreas) {
        const lower = area.toLowerCase();
        expect(lower).not.toContain('failed');
        expect(lower).not.toContain('bad');
        expect(lower).not.toContain('poor');
      }
    });

    it('should set deliveryPatternFlag with neutral text for high disfluency', () => {
      const attempts = [
        createMockAttempt({
          disfluencyMetrics: {
            fillerWordCount: 10,
            fillerWords: { um: 5, uh: 5 },
            repetitionCount: 3,
            totalWords: 40,
            disfluencyRate: 0.325,
          },
        }),
      ];

      const report = generateReport(attempts, mockQuestions, 'frontend-development');
      expect(report.deliveryPatternFlag).toBe(true);
      expect(report.deliveryPatternNote).toBeTruthy();
      // Should NOT be an accusation
      expect(report.deliveryPatternNote.toLowerCase()).not.toContain('accusation');
      expect(report.deliveryPatternNote.toLowerCase()).not.toContain('you failed');
    });

    it('should not set deliveryPatternFlag for clean delivery', () => {
      const attempts = [
        createMockAttempt({
          disfluencyMetrics: {
            fillerWordCount: 1,
            fillerWords: { um: 1 },
            repetitionCount: 0,
            totalWords: 60,
            disfluencyRate: 0.017,
          },
          visualMetrics: {
            averageGazeScore: 0.8,
            postureScore: 0.9,
            fidgetingScore: 0.1,
            smileFrequency: 0.4,
            headMovementScore: 0.3,
          },
        }),
      ];

      const report = generateReport(attempts, mockQuestions, 'frontend-development');
      expect(report.deliveryPatternFlag).toBe(false);
    });

    it('should generate per-question breakdown for each attempt', () => {
      const attempts = [
        createMockAttempt({ questionId: 'test-q1' }),
        createMockAttempt({ questionId: 'test-q2' }),
        createMockAttempt({ questionId: 'test-q3' }),
      ];

      const report = generateReport(attempts, mockQuestions, 'frontend-development');
      expect(report.perQuestionBreakdown).toHaveLength(3);

      for (const breakdown of report.perQuestionBreakdown) {
        expect(breakdown).toHaveProperty('questionId');
        expect(breakdown).toHaveProperty('questionText');
        expect(breakdown).toHaveProperty('contentBand');
        expect(breakdown).toHaveProperty('keyStrengths');
        expect(breakdown).toHaveProperty('observations');
      }
    });
  });
});
