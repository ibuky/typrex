// tests/useTyping.spec.ts
import { describe, it, expect } from 'vitest';
import { useTyping } from '../composables/useTyping';
import { nextTick } from 'vue';

describe('useTyping Composable', () => {
  it('should initialize with a simple word', () => {
    const { problem, remainingKana } = useTyping('さくら');
    expect(problem.value.map(p => p.kana)).toEqual(['さ', 'く', 'ら']);
    expect(problem.value.map(p => p.romaji)).toEqual(['sa', 'ku', 'ra']);
    expect(remainingKana.value).toBe('さくら');
  });

  it('should handle correct typing for a simple word', async () => {
    const { handleKeyInput, typedRomaji, remainingKana, isFinished } = useTyping('さくら');

    'sakura'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('sakura');
    expect(remainingKana.value).toBe('');
    expect(isFinished.value).toBe(true);
  });

  it('should handle sokuon (促音 "っ") correctly for "かった"', async () => {
    const { problem, handleKeyInput, typedRomaji, remainingKana, isFinished } = useTyping('かった');
    
    expect(problem.value.map(p => p.kana)).toEqual(['か', 'っ', 'た']);
    // "っ" is converted to the first consonant of the next character "た" (ta) -> "t"
    expect(problem.value.map(p => p.romaji)).toEqual(['ka', 't', 'ta']);

    'katta'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('katta');
    expect(remainingKana.value).toBe('');
    expect(isFinished.value).toBe(true);
  });

  it('should handle hatsuon (撥音 "ん") correctly for "にっぽん"', async () => {
    const { problem, handleKeyInput, typedRomaji, isFinished } = useTyping('にっぽん');

    expect(problem.value.map(p => p.kana)).toEqual(['に', 'っ', 'ぽ', 'ん']);
    // 'ん' at the end of a word is just 'n'
    expect(problem.value.map(p => p.romaji)).toEqual(['ni', 'p', 'po', 'n']);

    'nippon'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('nippon');
    expect(isFinished.value).toBe(true);
  });
  
  it('should handle hatsuon (撥音 "ん") before a vowel for "けんい"', async () => {
    const { problem, handleKeyInput, typedRomaji, isFinished } = useTyping('けんい');

    expect(problem.value.map(p => p.kana)).toEqual(['け', 'ん', 'い']);
    // 'ん' before a vowel sound 'i' should become 'nn'
    expect(problem.value.map(p => p.romaji)).toEqual(['ke', 'nn', 'i']);

    'kenni'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('kenni');
    expect(isFinished.value).toBe(true);
  });

  it('should handle incorrect input', async () => {
    const { handleKeyInput, typedRomaji, remainingKana, currentInput } = useTyping('さくら');

    handleKeyInput('s');
    handleKeyInput('a');
    await nextTick();
    
    expect(typedRomaji.value).toBe('sa');
    expect(remainingKana.value).toBe('くら');

    handleKeyInput('z'); // Incorrect input for 'ku'
    await nextTick();

    expect(typedRomaji.value).toBe('sa');
    expect(remainingKana.value).toBe('くら');
    expect(currentInput.value).toBe(''); // Input should be reset
  });

  it('should handle combined kana (拗音)', () => {
    const { problem } = useTyping('ちゃ');
    expect(problem.value.map(p => p.kana)).toEqual(['ちゃ']);
    expect(problem.value.map(p => p.romaji)).toEqual(['cha']);
  });
});
