// composables/useTyping.ts
import { ref, computed, readonly } from 'vue';
import { kanaToRomanMap, validateInput } from '../utils/typingLogic';

// 問題の形式
export interface Problem {
  word: string; // 表示用（漢字など）
  kana: string; // 判定用（かな）
}

// 問題の各文字の状態を定義
interface CharInfo {
  kana: string;
  romaji: string;
  typed: boolean;
}

export function useTyping(initialProblem: Problem) {
  const currentDisplayWord = ref(initialProblem.word);
  const problemKana = ref<CharInfo[]>([]);
  const currentIndex = ref(0);
  const currentInput = ref('');
  const isFinished = ref(false);

  // 現在のターゲット文字
  const currentTarget = computed(() => problemKana.value[currentIndex.value] ?? null);

  // 問題全体のローマ字表記
  const fullRomaji = computed(() => problemKana.value.map(p => p.romaji).join(''));

  // 表示用の入力済みローマ字
  const typedRomaji = computed(() => {
    return problemKana.value.slice(0, currentIndex.value).map(p => p.romaji).join('');
  });

  // 未入力のローマ字全体
  const remainingRomaji = computed(() => {
    if (!currentTarget.value) return '';
    const untypedCurrent = currentTarget.value.romaji.substring(currentInput.value.length);
    const future = problemKana.value.slice(currentIndex.value + 1).map(p => p.romaji).join('');
    return untypedCurrent + future;
  });

  /**
   * 新しい単語でタイピング状態を初期化する
   * @param newProblem 新しい問題オブジェクト
   */
  function setProblem(newProblem: Problem) {
    currentDisplayWord.value = newProblem.word;
    const chars = newProblem.kana.split('');
    const newProblemKana: CharInfo[] = [];
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
      
      // 撥音「ん」の特別処理
      if (kana === 'ん' && i + 1 < chars.length) {
        const nextKana = chars[i + 1];
        if (['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(kanaToRomanMap[nextKana]?.[0]?.charAt(0) ?? '')) {
            romaji = 'nn';
        }
      }

      newProblemKana.push({ kana, romaji, typed: false });
      i++;
    }

    problemKana.value = newProblemKana;
    currentIndex.value = 0;
    currentInput.value = '';
    isFinished.value = false;
  }

  /**
   * ユーザーのキー入力を処理する
   * @param key 入力されたキー
   */
  function handleKeyInput(key: string): boolean {
    if (isFinished.value) return true;

    const targetRomaji = currentTarget.value?.romaji ?? '';
    const newTyped = currentInput.value + key;

    const validationResult = validateInput(newTyped, [targetRomaji]);

    if (validationResult === 'correct') {
      problemKana.value[currentIndex.value].typed = true;
      currentInput.value = '';
      currentIndex.value++;
      if (currentIndex.value >= problemKana.value.length) {
        isFinished.value = true;
      }
      return true;
    } else if (validationResult === 'in-progress') {
      currentInput.value = newTyped;
      return true;
    } else {
      // Incorrect input
      return false;
    }
  }

  // 初期化
  setProblem(initialProblem);

  return {
    currentDisplayWord: readonly(currentDisplayWord),
    fullRomaji,
    typedRomaji,
    currentInput: readonly(currentInput),
    remainingRomaji,
    isFinished: readonly(isFinished),
    setProblem,
    handleKeyInput,
  };
}
