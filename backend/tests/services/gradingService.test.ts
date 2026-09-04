import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gradeAnswer } from '../../src/services/gradingService';
import { FaqQuestion } from '../../src/types';
import Groq from 'groq-sdk';

vi.mock('../../src/config/env', () => ({
  getConfig: vi.fn().mockReturnValue({ GROQ_API_KEY: 'test-key' }),
}));

// Mock Groq SDK
vi.mock('groq-sdk');

describe('GradingService', () => {
  const mockFaq: FaqQuestion = {
    id: 'test-1',
    question: 'What is the virtual DOM?',
    ideal_answer: 'A lightweight JS representation of the real DOM used for efficient updates.',
    key_points: ['Lightweight JS object', 'Diffing algorithm', 'Efficient updates'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse valid JSON response from LLM and return a ContentGrading object', async () => {
    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              band: 'comfortable',
              keyPointsCovered: ['Efficient updates'],
              keyPointsMissed: ['Lightweight JS object', 'Diffing algorithm'],
              reasoning: 'Mentioned efficiency but missed the underlying mechanism.',
            }),
          },
        },
      ],
    };

    // @ts-ignore
    Groq.prototype.chat = {
      completions: {
        create: vi.fn().mockResolvedValue(mockGroqResponse),
      },
    };

    const result = await gradeAnswer('It makes updates fast.', mockFaq);
    expect(result.band).toBe('comfortable');
    expect(result.keyPointsCovered).toContain('Efficient updates');
    expect(result.keyPointsMissed).toContain('Diffing algorithm');
    expect(result.reasoning).toBeTruthy();
  });

  it('should handle markdown fenced JSON from LLM', async () => {
    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: `\`\`\`json
{
  "band": "strong",
  "keyPointsCovered": ["Lightweight JS object", "Diffing algorithm", "Efficient updates"],
  "keyPointsMissed": [],
  "reasoning": "Excellent answer."
}
\`\`\``,
          },
        },
      ],
    };

    // @ts-ignore
    Groq.prototype.chat = {
      completions: {
        create: vi.fn().mockResolvedValue(mockGroqResponse),
      },
    };

    const result = await gradeAnswer('It is a JS object that diffs for efficiency.', mockFaq);
    expect(result.band).toBe('strong');
    expect(result.keyPointsCovered.length).toBe(3);
  });

  it('should fallback gracefully if LLM returns invalid JSON', async () => {
    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: 'I think the band is strong because they said good things.',
          },
        },
      ],
    };

    // @ts-ignore
    Groq.prototype.chat = {
      completions: {
        create: vi.fn().mockResolvedValue(mockGroqResponse),
      },
    };

    const result = await gradeAnswer('Good things.', mockFaq);
    expect(result.band).toBe('developing'); // Fallback band
    expect(result.keyPointsMissed).toEqual(mockFaq.key_points); // Assume all missed
    expect(result.reasoning).toContain('error');
  });

  it('should fallback gracefully if LLM call throws an error', async () => {
    // @ts-ignore
    Groq.prototype.chat = {
      completions: {
        create: vi.fn().mockRejectedValue(new Error('API Error')),
      },
    };

    const result = await gradeAnswer('Some answer.', mockFaq);
    expect(result.band).toBe('developing');
    expect(result.reasoning).toContain('error');
  });
});
