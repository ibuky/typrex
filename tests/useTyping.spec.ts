// tests/useTyping.spec.ts
import { describe, it, expect } from 'vitest';
import { useTyping, type Problem } from '../composables/useTyping';
import { nextTick } from 'vue';

describe('useTyping Composable', () => {
  it('should initialize with a simple word', () => {
    const problem: Problem = { word: '桜', kana: 'さくら' };
    const { currentDisplayWord, fullRomaji } = useTyping(problem);
    expect(currentDisplayWord.value).toBe('桜');
    expect(fullRomaji.value).toBe('sakura');
  });

  it('should handle correct typing for a simple word', async () => {
    const problem: Problem = { word: '桜', kana: 'さくら' };
    const { handleKeyInput, typedRomaji, remainingRomaji, isFinished } = useTyping(problem);

    'sakura'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('sakura');
    expect(remainingRomaji.value).toBe('');
    expect(isFinished.value).toBe(true);
  });

  it('should handle sokuon (促音 "っ") correctly for "かった"', async () => {
    const problem: Problem = { word: '買った', kana: 'かった' };
    const { handleKeyInput, typedRomaji, fullRomaji, isFinished } = useTyping(problem);
    
    expect(fullRomaji.value).toBe('katta');

    'katta'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('katta');
    expect(isFinished.value).toBe(true);
  });

  it('should handle hatsuon (撥音 "ん") correctly for "にっぽん"', async () => {
    const problem: Problem = { word: '日本', kana: 'にっぽん' };
    const { handleKeyInput, typedRomaji, fullRomaji, isFinished } = useTyping(problem);

    expect(fullRomaji.value).toBe('nippon');

    'nippon'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('nippon');
    expect(isFinished.value).toBe(true);
  });
  
  it('should handle hatsuon (撥音 "ん") before a vowel for "けんい"', async () => {
    const problem: Problem = { word: '権威', kana: 'けんい' };
    const { handleKeyInput, typedRomaji, fullRomaji, isFinished } = useTyping(problem);

    expect(fullRomaji.value).toBe('kenni');

    'kenni'.split('').forEach(handleKeyInput);
    await nextTick();

    expect(typedRomaji.value).toBe('kenni');
    expect(isFinished.value).toBe(true);
  });

  it('should handle incorrect input and return false', async () => {
    const problem: Problem = { word: '桜', kana: 'さくら' };
    const { handleKeyInput, typedRomaji, currentInput } = useTyping(problem);

    handleKeyInput('s');
    handleKeyInput('a');
    await nextTick();
    
    expect(typedRomaji.value).toBe('sa');

    const result = handleKeyInput('z'); // Incorrect input for 'ku'
    await nextTick();

    expect(result).toBe(false);
    expect(typedRomaji.value).toBe('sa');
    expect(currentInput.value).toBe(''); // currentInput should be reset on incorrect input
  });

  it('should handle combined kana (拗音)', () => {
    const problem: Problem = { word: '茶', kana: 'ちゃ' };
    const { fullRomaji } = useTyping(problem);
    expect(fullRomaji.value).toBe('cha');
  });

  it('should handle chouonpu (長音符 "ー") correctly', () => {
    const problem: Problem = { word: 'ゲーム', kana: 'げーむ' };
    const { fullRomaji } = useTyping(problem);
    expect(fullRomaji.value).toBe('ge-mu');
  });
});