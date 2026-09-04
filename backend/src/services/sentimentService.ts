import { SentimentProfile } from '../types';
import { logger } from '../middleware/requestLogger';

// Lazy-loaded pipeline
let classifier: any = null;
let pipelineLoading: Promise<any> | null = null;

async function getClassifier(): Promise<any> {
  if (classifier) return classifier;

  if (!pipelineLoading) {
    pipelineLoading = (async () => {
      try {
        // Dynamic import for @xenova/transformers
        const { pipeline } = await import('@xenova/transformers');
        classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
          topk: null,
        } as any);
        logger.info('Sentiment classifier loaded');
        return classifier;
      } catch (err) {
        logger.error({ err }, 'Failed to load sentiment classifier');
        pipelineLoading = null;
        throw err;
      }
    })();
  }

  return pipelineLoading;
}

export async function analyzeSentiment(text: string): Promise<SentimentProfile> {
  if (!text || text.trim().length === 0) {
    return {
      dominant: 'neutral',
      scores: { neutral: 1.0 },
    };
  }

  try {
    const pipe = await getClassifier();

    // Truncate very long text to avoid model limits
    const truncated = text.length > 512 ? text.substring(0, 512) : text;

    const results = await pipe(truncated);

    if (!Array.isArray(results) || results.length === 0) {
      return { dominant: 'neutral', scores: { neutral: 1.0 } };
    }

    // Parse results — handle both flat and nested arrays
    const labels = Array.isArray(results[0]) ? results[0] : results;

    const scores: Record<string, number> = {};
    let dominant = 'neutral';
    let maxScore = 0;

    for (const item of labels) {
      const label = (item.label || '').toLowerCase();
      const score = item.score || 0;
      scores[label] = Math.round(score * 1000) / 1000;

      if (score > maxScore) {
        maxScore = score;
        dominant = label;
      }
    }

    return { dominant, scores };
  } catch (err) {
    logger.warn({ err }, 'Sentiment analysis failed, returning neutral');
    return {
      dominant: 'neutral',
      scores: { neutral: 1.0 },
    };
  }
}
