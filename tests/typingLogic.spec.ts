// tests/typingLogic.spec.ts

import { describe, it, expect } from 'vitest';
import { kanaToRomanMap } from '../constants/kanaToRomanMap';
import { validateInput } from '../utils/typingLogic';

describe('validateInput', () => {
  // 「ん」以外のすべてのエントリをテスト
  Object.entries(kanaToRomanMap)
    .filter(([kana]) => kana !== 'ん')
    .forEach(([kana, romanizations]) => {
      describe(`Kana: ${kana}`, () => {
        it(`should return 'correct' for all valid romanizations: ${romanizations.join(', ')}`, () => {
          romanizations.forEach(roman => {
            expect(validateInput(roman, romanizations), `Failed on: ${roman}`).toBe('correct');
          });
        });

        it('should return "in-progress" for partial inputs', () => {
          romanizations.forEach(roman => {
            for (let i = 1; i < roman.length; i++) {
              const partialInput = roman.substring(0, i);
              expect(validateInput(partialInput, romanizations), `Failed on partial: ${partialInput}`).toBe('in-progress');
            }
          });
        });

        it('should return "incorrect" for invalid inputs', () => {
          expect(validateInput('123', romanizations)).toBe('incorrect');
        });

        it('should return "incorrect" for inputs longer than any valid romanization', () => {
          romanizations.forEach(roman => {
            const longInput = roman + 'z';
            expect(validateInput(longInput, romanizations), `Failed on long input: ${longInput}`).toBe('incorrect');
          });
        });
      });
    });

  // 「ん」の特殊なケースを専門にテスト
  describe('Kana: ん', () => {
    const romanizations = kanaToRomanMap['ん'];

    it('should return "in-progress" for "n" as it can be part of "nn"', () => {
      expect(validateInput('n', romanizations)).toBe('in-progress');
    });

    it('should return "correct" for "nn" and "xn"', () => {
      expect(validateInput('nn', romanizations)).toBe('correct');
      expect(validateInput('xn', romanizations)).toBe('correct');
    });

    it('should return "in-progress" for "x" as it is part of "xn"', () => {
      expect(validateInput('x', romanizations)).toBe('in-progress');
    });

    it('should return "incorrect" for invalid inputs', () => {
      expect(validateInput('z', romanizations)).toBe('incorrect');
      expect(validateInput('123', romanizations)).toBe('incorrect');
    });
  });

  // 他の特殊ケースのテスト
  describe('Special Cases', () => {
    it('should handle "っ" correctly', () => {
        const romanizations = kanaToRomanMap['っ'];
        expect(validateInput('xtu', romanizations)).toBe('correct');
        expect(validateInput('xtsu', romanizations)).toBe('correct');
        expect(validateInput('xt', romanizations)).toBe('in-progress');
    });
  });
});
