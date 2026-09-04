import { DisfluencyMetrics } from '../types';

// ─── Filler Word Lists ─────────────────────────────────────────────────────────
const FILLER_WORDS = new Set([
  'um', 'uh', 'uhh', 'umm', 'erm', 'er',
  'like', 'basically', 'literally', 'actually', 'honestly',
  'you know', 'i mean', 'sort of', 'kind of', 'right',
  'so yeah', 'you see', 'well',
]);

// Single-word fillers for fast lookup
const SINGLE_FILLERS = new Set([
  'um', 'uh', 'uhh', 'umm', 'erm', 'er',
  'like', 'basically', 'literally', 'actually', 'honestly',
  'right', 'well',
]);

// Multi-word fillers
const MULTI_FILLERS = [
  'you know', 'i mean', 'sort of', 'kind of', 'so yeah', 'you see',
];

export function analyzeDisfluency(transcript: string): DisfluencyMetrics {
  if (!transcript || transcript.trim().length === 0) {
    return {
      fillerWordCount: 0,
      fillerWords: {},
      repetitionCount: 0,
      totalWords: 0,
      disfluencyRate: 0,
    };
  }

  const lowerTranscript = transcript.toLowerCase();
  const words = lowerTranscript.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      fillerWordCount: 0,
      fillerWords: {},
      repetitionCount: 0,
      totalWords: 0,
      disfluencyRate: 0,
    };
  }

  const fillerCounts: Record<string, number> = {};
  let fillerWordCount = 0;

  // Count single-word fillers
  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, '');
    if (SINGLE_FILLERS.has(cleaned)) {
      fillerCounts[cleaned] = (fillerCounts[cleaned] || 0) + 1;
      fillerWordCount++;
    }
  }

  // Count multi-word fillers
  for (const phrase of MULTI_FILLERS) {
    let searchFrom = 0;
    while (true) {
      const idx = lowerTranscript.indexOf(phrase, searchFrom);
      if (idx === -1) break;
      fillerCounts[phrase] = (fillerCounts[phrase] || 0) + 1;
      fillerWordCount++;
      searchFrom = idx + phrase.length;
    }
  }

  // Count repetitions (consecutive identical words)
  let repetitionCount = 0;
  for (let i = 1; i < words.length; i++) {
    const prev = words[i - 1].replace(/[^a-z]/g, '');
    const curr = words[i].replace(/[^a-z]/g, '');
    if (prev === curr && prev.length > 1) {
      repetitionCount++;
    }
  }

  const disfluencyRate = totalWords > 0 ? (fillerWordCount + repetitionCount) / totalWords : 0;

  return {
    fillerWordCount,
    fillerWords: fillerCounts,
    repetitionCount,
    totalWords,
    disfluencyRate: Math.round(disfluencyRate * 1000) / 1000,
  };
}
