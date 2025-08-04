// composables/useTyping.ts
import { ref, computed, readonly } from 'vue';
import { kanaToRomanMap, validateInput } from '../utils/typingLogic';

// 問題の各文字の状態を定義
interface CharInfo {
  kana: string;
  romaji: string;
  typed: boolean;
}

export function useTyping(word: string) {
  const problem = ref<CharInfo[]>([]);
  const currentIndex = ref(0);
  const currentInput = ref('');
  const isFinished = ref(false);

  // 現在のターゲット文字
  const currentTarget = computed(() => problem.value[currentIndex.value] ?? null);

  // 表示用の残りかな
  const remainingKana = computed(() => {
    return problem.value.map(p => p.kana).join('').substring(currentIndex.value);
  });

  // 表示用の入力済みローマ字
  const typedRomaji = computed(() => {
    return problem.value.slice(0, currentIndex.value).map(p => p.romaji).join('');
  });

  /**
   * 新しい単語でタイピング状態を初期化する
   * @param newWord 新しい日本語の単語
   */
  function setProblem(newWord: string) {
    const chars = newWord.split('');
    const newProblem: CharInfo[] = [];
    let i = 0;

    while (i < chars.length) {
      let kana = chars[i];
      // 拗音（きゃ、きゅ、きょなど）の処理
      if (i + 1 < chars.length && ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'].includes(chars[i + 1])) {
        const combined = chars[i] + chars[i + 1];
        if (kanaToRomanMap[combined]) {
          kana = combined;
          i++;
        }
      }

      let romaji = kanaToRomanMap[kana]?.[0] ?? '';

      // 促音「っ」の処理
      if (kana === 'っ' && i + 1 < chars.length) {
        const nextKana = chars[i + 1];
        const nextRomaji = kanaToRomanMap[nextKana]?.[0];
        if (nextRomaji) {
          romaji = nextRomaji.charAt(0);
        }
      }
      
      // 撥音「ん」の特別処理（nが1つの場合）
      if (kana === 'ん' && i + 1 < chars.length) {
        const nextKana = chars[i + 1];
        // 次が母音、やゆよ、な行の場合、'n'を2回続ける必要がある
        if (['a', 'i', 'u', 'e', 'o', 'y'].includes(kanaToRomanMap[nextKana]?.[0]?.charAt(0) ?? '') || nextKana === 'な' || nextKana === 'に' || nextKana === 'ぬ' || nextKana === 'ね' || nextKana === 'の') {
            romaji = 'nn';
        }
      }


      newProblem.push({ kana, romaji, typed: false });
      i++;
    }

    problem.value = newProblem;
    currentIndex.value = 0;
    currentInput.value = '';
    isFinished.value = false;
  }

  /**
   * ユーザーのキー入力を処理する
   * @param key 入力されたキー
   */
  function handleKeyInput(key: string) {
    if (isFinished.value) return;

    const targetRomaji = currentTarget.value?.romaji ?? '';
    const newTyped = currentInput.value + key;

    const validationResult = validateInput(newTyped, [targetRomaji]);

    if (validationResult === 'correct') {
      problem.value[currentIndex.value].typed = true;
      currentInput.value = '';
      currentIndex.value++;
      if (currentIndex.value >= problem.value.length) {
        isFinished.value = true;
      }
    } else if (validationResult === 'in-progress') {
      currentInput.value = newTyped;
    } else {
      // 不正解の場合、入力をリセット（または効果音など）
      currentInput.value = '';
    }
  }

  // 初期化
  setProblem(word);

  return {
    problem: readonly(problem),
    currentIndex: readonly(currentIndex),
    currentInput: readonly(currentInput),
    isFinished: readonly(isFinished),
    remainingKana,
    typedRomaji,
    setProblem,
    handleKeyInput,
  };
}
