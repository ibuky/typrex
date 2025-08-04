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
  romaji: string; // 実際にタイプされた、またはタイプの基準となるローマ字
  romajiOptions: string[]; // 有効なローマ字の選択肢
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
    
    let untypedCurrent = '';
    if (currentInput.value === '') {
        // If nothing is typed for the current char, show its canonical romaji.
        untypedCurrent = currentTarget.value.romaji;
    } else {
        // If user is typing, find the best matching option and show the rest of it.
        const currentOptions = currentTarget.value.romajiOptions;
        const inProgressOption = currentOptions.find(opt => opt.startsWith(currentInput.value));
        if (inProgressOption) {
            untypedCurrent = inProgressOption.substring(currentInput.value.length);
        } else {
            // This case should not happen if input validation is correct, but as a fallback:
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
      // 拗音（きゃ、きゅ、きょなど）の処理
      if (i + 1 < chars.length && ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'].includes(chars[i + 1])) {
        const combined = chars[i] + chars[i + 1];
        if (kanaToRomanMap[combined]) {
          kana = combined;
          i++;
        }
      }

      const romajiOptions = kanaToRomanMap[kana] ? [...kanaToRomanMap[kana]] : [''];
      let romaji = romajiOptions[0];

      // 促音「っ」の処理
      if (kana === 'っ' && i + 1 < chars.length) {
        const nextKanaChars = (chars[i + 1] + (chars[i + 2] || '')).slice(0, 2);
        const nextKana = kanaToRomanMap[nextKanaChars] ? nextKanaChars : chars[i + 1];
        const nextRomajiOptions = kanaToRomanMap[nextKana] || [''];
        romaji = nextRomajiOptions[0].charAt(0);
        // 促音のタイピングバリエーションを追加
        romajiOptions.push(...nextRomajiOptions.map(r => r.charAt(0)));
      }
      
      // 撥音「ん」の特別処理
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
  }

  /**
   * ユーザーのキー入力を処理する
   * @param key 入力されたキー
   */
  function handleKeyInput(key: string): boolean {
    if (isFinished.value) return true;

    const targetOptions = currentTarget.value?.romajiOptions ?? [];
    const newTyped = currentInput.value + key;

    let validationResult = validateInput(newTyped, targetOptions);

    // `n`の後の入力で不正解になった場合、次の文字の開始とみなすか判定
    if (validationResult === 'incorrect' && currentTarget.value?.kana === 'ん' && currentInput.value === 'n') {
      const nextKanaInfo = problemKana.value[currentIndex.value + 1];
      if (nextKanaInfo) {
        const nextKanaOptions = nextKanaInfo.romajiOptions;
        const isStartOfNext = nextKanaOptions.some(opt => opt.startsWith(key));
        // nnが必要なケース（あいうえお、やゆよ、な行で始まる）
        const isNnRequired = nextKanaOptions.some(r => ['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(r.charAt(0)));

        if (isStartOfNext && !isNnRequired) {
          // 'ん'を'n'で確定
          problemKana.value[currentIndex.value].romaji = 'n';
          problemKana.value[currentIndex.value].typed = true;
          currentIndex.value++;
          
          // 入力をリセットして、新しい文字の処理をやり直す
          currentInput.value = '';
          return handleKeyInput(key); // 再帰呼び出しで新しいキーを処理
        }
      }
    }
    
    if (validationResult === 'correct') {
      // どの有効なローマ字で入力完了したかを設定
      problemKana.value[currentIndex.value].romaji = newTyped;
      problemKana.value[currentIndex.value].typed = true;
      currentInput.value = '';
      currentIndex.value++;
      if (currentIndex.value >= problemKana.value.length) {
        isFinished.value = true;
      }
      return true;
    } else if (validationResult === 'in-progress') {
      currentInput.value = newTyped;
      // EDGE CASE: 単語末尾の「ん」は「n」一文字で即時確定させる
      if (
        currentIndex.value === problemKana.value.length - 1 &&
        currentTarget.value?.kana === 'ん' &&
        newTyped === 'n'
      ) {
        problemKana.value[currentIndex.value].romaji = newTyped;
        problemKana.value[currentIndex.value].typed = true;
        currentInput.value = '';
        currentIndex.value++;
        isFinished.value = true;
      }
      return true;
    } else {
      // 不正解入力: ここで入力をリセットするかどうかは仕様による
      // 今回はリセットしない
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