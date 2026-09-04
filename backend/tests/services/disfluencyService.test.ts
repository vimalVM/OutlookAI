import { describe, it, expect } from 'vitest';
import { analyzeDisfluency } from '../../src/services/disfluencyService';

describe('DisfluencyService', () => {
  describe('analyzeDisfluency', () => {
    it('should return zero metrics for empty input', () => {
      const result = analyzeDisfluency('');
      expect(result.fillerWordCount).toBe(0);
      expect(result.repetitionCount).toBe(0);
      expect(result.totalWords).toBe(0);
      expect(result.disfluencyRate).toBe(0);
    });

    it('should return zero metrics for whitespace-only input', () => {
      const result = analyzeDisfluency('   ');
      expect(result.fillerWordCount).toBe(0);
      expect(result.totalWords).toBe(0);
    });

    it('should detect single-word fillers', () => {
      const result = analyzeDisfluency('So um I think the um answer is basically that we should like refactor it');
      expect(result.fillerWordCount).toBeGreaterThan(0);
      expect(result.fillerWords['um']).toBe(2);
      expect(result.fillerWords['basically']).toBe(1);
      expect(result.fillerWords['like']).toBe(1);
    });

    it('should detect multi-word fillers', () => {
      const result = analyzeDisfluency('I think you know the best approach is you know to use a framework');
      expect(result.fillerWords['you know']).toBe(2);
    });

    it('should detect consecutive word repetitions', () => {
      const result = analyzeDisfluency('I I think the the best approach is is to refactor');
      expect(result.repetitionCount).toBe(2); // 'I I' is ignored (length 1). 'the the', 'is is' are counted.
    });

    it('should not count single-character repetitions', () => {
      const result = analyzeDisfluency('I think a a good approach is needed');
      // 'a a' → both are length 1, should NOT count
      expect(result.repetitionCount).toBe(0);
    });

    it('should calculate disfluency rate correctly', () => {
      // 10 words, 2 fillers, 1 repetition → rate = 3/10 = 0.3
      const result = analyzeDisfluency('um like I think the the answer is very clear');
      expect(result.disfluencyRate).toBeGreaterThan(0);
      expect(result.disfluencyRate).toBeLessThanOrEqual(1);
    });

    it('should handle clean transcript with no disfluencies', () => {
      const result = analyzeDisfluency(
        'The virtual DOM is a lightweight JavaScript representation of the real DOM that enables efficient updates through a diffing algorithm'
      );
      expect(result.fillerWordCount).toBe(0);
      expect(result.repetitionCount).toBe(0);
      expect(result.disfluencyRate).toBe(0);
    });

    it('should handle transcript with many fillers', () => {
      const result = analyzeDisfluency(
        'um uh so basically like you know I mean sort of kind of well honestly actually right'
      );
      expect(result.fillerWordCount).toBeGreaterThan(5);
      expect(result.disfluencyRate).toBeGreaterThan(0.3);
    });

    it('should report total word count accurately', () => {
      const result = analyzeDisfluency('one two three four five');
      expect(result.totalWords).toBe(5);
    });
  });
});
