import {
  Attempt,
  SessionReport,
  ConfidenceBand,
  QuestionBreakdown,
  SessionQuestion,
} from '../types';
import * as faqRepository from '../repositories/faqRepository';
import { logger } from '../middleware/requestLogger';

// ─── Band Weights ──────────────────────────────────────────────────────────────
const BAND_VALUES: Record<ConfidenceBand, number> = {
  developing: 1,
  comfortable: 2,
  strong: 3,
};

function valueToBand(value: number): ConfidenceBand {
  if (value >= 2.5) return 'strong';
  if (value >= 1.5) return 'comfortable';
  return 'developing';
}

// ─── Delivery Pattern Detection ────────────────────────────────────────────────
function detectDeliveryPatternFlag(attempts: Attempt[]): { flag: boolean; note: string } {
  if (attempts.length === 0) {
    return { flag: false, note: '' };
  }

  // Check for consistently high disfluency rate
  const avgDisfluencyRate =
    attempts.reduce((sum, a) => sum + a.disfluencyMetrics.disfluencyRate, 0) / attempts.length;

  // Check for consistently low gaze scores
  const avgGazeScore =
    attempts.reduce((sum, a) => sum + a.visualMetrics.averageGazeScore, 0) / attempts.length;

  if (avgDisfluencyRate > 0.15) {
    return {
      flag: true,
      note: 'We noticed a pattern of frequent verbal fillers across your responses. This is common in impromptu speaking and tends to decrease with practice and preparation.',
    };
  }

  if (avgGazeScore < 0.3) {
    return {
      flag: true,
      note: 'We observed that your eye contact tended to drift during responses. Maintaining steady eye contact can help convey confidence — this is something that improves naturally with practice.',
    };
  }

  return { flag: false, note: '' };
}

// ─── Strength & Growth Area Generation ─────────────────────────────────────────
function generateStrengths(attempts: Attempt[]): string[] {
  const strengths: string[] = [];

  // Content strengths
  const strongAnswers = attempts.filter((a) => a.contentGrading.band === 'strong');
  if (strongAnswers.length > 0) {
    strengths.push('Demonstrated thorough knowledge of key concepts in your responses');
  }

  const comfortableOrStrong = attempts.filter(
    (a) => a.contentGrading.band === 'comfortable' || a.contentGrading.band === 'strong'
  );
  if (comfortableOrStrong.length === attempts.length && attempts.length > 0) {
    strengths.push('Consistently addressed the core requirements across all questions');
  }

  // Delivery strengths
  const avgDisfluency =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.disfluencyMetrics.disfluencyRate, 0) / attempts.length
      : 0;
  if (avgDisfluency < 0.05) {
    strengths.push('Notably clear and fluent verbal delivery');
  }

  // Visual strengths
  const avgPosture =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.visualMetrics.postureScore, 0) / attempts.length
      : 0;
  if (avgPosture > 0.7) {
    strengths.push('Maintained confident and professional posture throughout');
  }

  const avgGaze =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.visualMetrics.averageGazeScore, 0) / attempts.length
      : 0;
  if (avgGaze > 0.7) {
    strengths.push('Strong eye contact indicating engagement and confidence');
  }

  // Sentiment strengths
  const positiveCount = attempts.filter(
    (a) => a.sentimentProfile.dominant === 'positive' || a.sentimentProfile.dominant === 'POSITIVE'
  ).length;
  if (positiveCount > attempts.length / 2) {
    strengths.push('Conveyed a positive and enthusiastic tone in your responses');
  }

  // Ensure at least one strength
  if (strengths.length === 0) {
    strengths.push('Showed willingness to engage with challenging interview questions');
  }

  return strengths;
}

function generateGrowthAreas(attempts: Attempt[]): string[] {
  const areas: string[] = [];

  // Content growth
  const developingAnswers = attempts.filter((a) => a.contentGrading.band === 'developing');
  if (developingAnswers.length > 1) {
    areas.push(
      'Some responses could benefit from more specific examples and deeper exploration of key concepts'
    );
  }

  // Disfluency observations
  const avgDisfluency =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.disfluencyMetrics.disfluencyRate, 0) / attempts.length
      : 0;
  if (avgDisfluency > 0.1) {
    areas.push(
      'Verbal fluency could be enhanced — pausing briefly before answering can help organize thoughts'
    );
  }

  // Visual observations
  const avgGaze =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.visualMetrics.averageGazeScore, 0) / attempts.length
      : 0;
  if (avgGaze < 0.5) {
    areas.push(
      'Eye contact engagement has room for growth — practicing with a camera can help build comfort'
    );
  }

  // Speech rate
  const avgSpeechRate =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.audioMetrics.speechRate, 0) / attempts.length
      : 0;
  if (avgSpeechRate > 180) {
    areas.push(
      'Pacing tended toward a faster rhythm — slowing slightly can improve clarity and emphasis'
    );
  } else if (avgSpeechRate < 100 && avgSpeechRate > 0) {
    areas.push(
      'Pacing was on the slower side — varying your rhythm can help maintain listener engagement'
    );
  }

  return areas;
}

// ─── Per-Question Breakdown ────────────────────────────────────────────────────
function buildPerQuestionBreakdown(
  attempts: Attempt[],
  questions: SessionQuestion[],
  domainId: string
): QuestionBreakdown[] {
  return attempts.map((attempt) => {
    const sessionQ = questions.find((q) => q.faqQuestionId === attempt.questionId);
    const faqQ = faqRepository.getQuestion(domainId, attempt.questionId);

    // Compute correctness percentage from key points
    const totalKeyPoints = faqQ ? faqQ.key_points.length : 1;
    const coveredCount = attempt.contentGrading.keyPointsCovered.length;
    const correctnessPercent = Math.round((coveredCount / Math.max(totalKeyPoints, 1)) * 100);

    const breakdown: QuestionBreakdown = {
      questionId: attempt.questionId,
      questionText: sessionQ?.rephrasedText || faqQ?.question || 'Unknown question',
      contentBand: attempt.contentGrading.band,
      correctnessPercent,
      keyStrengths: [],
      observations: [],
      reasoning: attempt.contentGrading.reasoning || '',
    };

    // Key strengths for this question
    if (attempt.contentGrading.keyPointsCovered.length > 0) {
      breakdown.keyStrengths.push(
        `Covered ${attempt.contentGrading.keyPointsCovered.length} of ${totalKeyPoints} key points`
      );
      // Include which points were covered
      attempt.contentGrading.keyPointsCovered.slice(0, 3).forEach((pt) => {
        breakdown.keyStrengths.push(pt);
      });
    }

    if (attempt.disfluencyMetrics.disfluencyRate < 0.05) {
      breakdown.keyStrengths.push('Delivered this answer with notable fluency');
    }

    if (breakdown.keyStrengths.length === 0) {
      breakdown.keyStrengths.push('Engaged with the question and provided a response');
    }

    // Observations (never "bad" or "poor")
    if (attempt.contentGrading.keyPointsMissed.length > 0) {
      breakdown.observations.push(
        `Could further explore: ${attempt.contentGrading.keyPointsMissed.slice(0, 2).join(', ')}`
      );
    }

    if (attempt.disfluencyMetrics.fillerWordCount > 5) {
      breakdown.observations.push(
        'This response included some filler patterns — a natural part of impromptu speaking'
      );
    }

    return breakdown;
  });
}

// ─── Main Fusion ───────────────────────────────────────────────────────────────
export function generateReport(
  attempts: Attempt[],
  questions: SessionQuestion[],
  domainId: string
): SessionReport {
  logger.info(
    { attemptCount: attempts.length, domainId },
    'Generating fusion report'
  );

  // 1. Build per-question breakdown first (we need scores from it)
  const perQuestionBreakdown = buildPerQuestionBreakdown(attempts, questions, domainId);

  // 2. Overall score — average of per-question correctness percentages
  const overallScore = perQuestionBreakdown.length > 0
    ? Math.round(perQuestionBreakdown.reduce((sum, q) => sum + q.correctnessPercent, 0) / perQuestionBreakdown.length)
    : 0;

  // 3. Overall confidence band — aggregate content grading across all attempts
  const contentValues = attempts.map((a) => BAND_VALUES[a.contentGrading.band]);
  const avgContentValue =
    contentValues.length > 0
      ? contentValues.reduce((sum, v) => sum + v, 0) / contentValues.length
      : 1;

  // Factor in delivery quality (disfluency, prosody)
  const avgDisfluency =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.disfluencyMetrics.disfluencyRate, 0) / attempts.length
      : 0;
  const deliveryModifier = avgDisfluency < 0.05 ? 0.3 : avgDisfluency > 0.15 ? -0.3 : 0;

  const overallValue = Math.max(1, Math.min(3, avgContentValue + deliveryModifier));
  const confidenceBand = valueToBand(overallValue);

  // 4. Strengths (lead with these)
  const strengths = generateStrengths(attempts);

  // 5. Growth areas (observations, never negative)
  const growthAreas = generateGrowthAreas(attempts);

  // 6. Delivery pattern flag (soft signal, neutral text)
  const { flag: deliveryPatternFlag, note: deliveryPatternNote } =
    detectDeliveryPatternFlag(attempts);

  const report: SessionReport = {
    confidenceBand,
    overallScore,
    strengths,
    growthAreas,
    perQuestionBreakdown,
    deliveryPatternFlag,
    deliveryPatternNote: deliveryPatternNote || '',
  };

  logger.info(
    { confidenceBand, overallScore, strengthCount: strengths.length, growthAreaCount: growthAreas.length },
    'Report generated'
  );

  return report;
}
