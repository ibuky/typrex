// composables/useTyping.ts
import { ref, computed, readonly } from 'vue';
import { kanaToRomanMap } from '../constants/kanaToRomanMap';
import { validateInput } from '../utils/typingLogic';

// 問題の形式
export interface Problem {
  word: string; // 表示用（漢字など）
  kana: string; // 判定用（かな）
}

export function useTyping(initialProblem: Problem) {
  const currentDisplayWord = ref(initialProblem.word);
  const problemKana = ref<CharInfo[]>([]);
  const currentIndex = ref(0);
  const currentInput = ref('');
  const isFinished = ref(false);

  // Performance tracking for a single problem
  const mistakeCount = ref(0);
  const startTime = ref(0);
  const elapsedTime = ref(0); // in milliseconds

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
    
    let untypedCurrent = '';
    if (currentInput.value === '') {
        untypedCurrent = currentTarget.value.romaji;
    } else {
        const currentOptions = currentTarget.value.romajiOptions;
        const inProgressOption = currentOptions.find(opt => opt.startsWith(currentInput.value));
        if (inProgressOption) {
            untypedCurrent = inProgressOption.substring(currentInput.value.length);
        } else {
            untypedCurrent = ''; 
        }
    }

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
      if (i + 1 < chars.length) {
        const combinedKana = chars[i] + chars[i + 1];
        if (kanaToRomanMap[combinedKana]) {
          kana = combinedKana;
          i++;
        }
      }

      const romajiOptions = kanaToRomanMap[kana] ? [...kanaToRomanMap[kana]] : [kana];
      let romaji = romajiOptions[0];

      if (kana === 'っ' && i + 1 < chars.length) {
        const nextKanaChars = (chars[i + 1] + (chars[i + 2] || '')).slice(0, 2);
        const nextKana = kanaToRomanMap[nextKanaChars] ? nextKanaChars : chars[i + 1];
        const nextRomajiOptions = kanaToRomanMap[nextKana] || [''];
        romaji = nextRomajiOptions[0].charAt(0);
        romajiOptions.push(...nextRomajiOptions.map(r => r.charAt(0)));
      }
      
      if (kana === 'ん' && i + 1 < chars.length) {
        const nextKana = chars[i + 1];
        const nextRomajiOptions = kanaToRomanMap[nextKana] || [''];
        if (nextRomajiOptions.some(r => ['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(r.charAt(0)))) {
            romaji = 'nn';
        }
      }

      newProblemKana.push({ kana, romaji, romajiOptions, typed: false });
      i++;
    }

    problemKana.value = newProblemKana;
    currentIndex.value = 0;
    currentInput.value = '';
    isFinished.value = false;
    
    // Reset performance stats
    mistakeCount.value = 0;
    startTime.value = 0;
    elapsedTime.value = 0;
  }

  function finishProblem() {
    isFinished.value = true;
    if (startTime.value > 0) {
      elapsedTime.value = Date.now() - startTime.value;
    }
  }

  /**
   * ユーザーのキー入力を処理する
   * @param key 入力されたキー
   */
  function handleKeyInput(key: string): boolean {
    if (isFinished.value) return true;

    if (startTime.value === 0) {
      startTime.value = Date.now();
    }

    const targetOptions = currentTarget.value?.romajiOptions ?? [];
    const newTyped = currentInput.value + key;

    let validationResult = validateInput(newTyped, targetOptions);

    if (validationResult === 'incorrect' && currentTarget.value?.kana === 'ん' && currentInput.value === 'n') {
      const nextKanaInfo = problemKana.value[currentIndex.value + 1];
      if (nextKanaInfo) {
        const nextKanaOptions = nextKanaInfo.romajiOptions;
        const isStartOfNext = nextKanaOptions.some(opt => opt.startsWith(key));
        const isNnRequired = nextKanaOptions.some(r => ['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(r.charAt(0)));

        if (isStartOfNext && !isNnRequired) {
          problemKana.value[currentIndex.value].romaji = 'n';
          problemKana.value[currentIndex.value].typed = true;
          currentIndex.value++;
          currentInput.value = '';
          return handleKeyInput(key);
        }
      }
    }
    
    if (validationResult === 'correct') {
      problemKana.value[currentIndex.value].romaji = newTyped;
      problemKana.value[currentIndex.value].typed = true;
      currentInput.value = '';
      currentIndex.value++;
      if (currentIndex.value >= problemKana.value.length) {
        finishProblem();
      }
      return true;
    } else if (validationResult === 'in-progress') {
      currentInput.value = newTyped;
      if (
        currentIndex.value === problemKana.value.length - 1 &&
        currentTarget.value?.kana === 'ん' &&
        newTyped === 'n'
      ) {
        problemKana.value[currentIndex.value].romaji = newTyped;
        problemKana.value[currentIndex.value].typed = true;
        currentInput.value = '';
        currentIndex.value++;
        finishProblem();
      }
      return true;
    } else {
      mistakeCount.value++;
      return false;
    }
  }

  setProblem(initialProblem);

  return {
    currentDisplayWord: readonly(currentDisplayWord),
    fullRomaji,
    typedRomaji,
    currentInput: readonly(currentInput),
    remainingRomaji,
    isFinished: readonly(isFinished),
    mistakeCount: readonly(mistakeCount),
    elapsedTime: readonly(elapsedTime),
    setProblem,
    handleKeyInput,
  };
}