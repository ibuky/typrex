// utils/typingLogic.ts

import { kanaToRomanMap } from '../constants/kanaToRomanMap';

/**
 * 入力判定ロジック
 * @param currentInput 現在の音に対してユーザーが入力した文字列 (例: 'k', 'ka')
 * @param targetRomanizations 変換テーブルから取得した、正解となるローマ字表記の配列 (例: ['ka', 'ca'])
 * @returns 'correct' | 'in-progress' | 'incorrect'
 */
export function validateInput(currentInput: string, targetRomanizations: string[]): 'correct' | 'in-progress' | 'incorrect' {
  // 1. 入力された文字列で前方一致する候補をすべて見つける
  const partialMatches = targetRomanizations.filter(roman => roman.startsWith(currentInput));

  // 2. 前方一致するものがなければ、明らかに不正解
  if (partialMatches.length === 0) {
    return 'incorrect';
  }

  // 3. 前方一致候補の中に、入力と完全一致するものがあるか
  const isExactMatch = partialMatches.includes(currentInput);

  if (isExactMatch) {
    // 4. 完全一致しても、それより長い候補が他にある場合は「入力途中」
    // (例: 'n' と 'nn' の関係)
    const hasLongerMatch = partialMatches.some(roman => roman.length > currentInput.length);
    if (hasLongerMatch) {
      return 'in-progress';
    }
    // 5. 他に長い候補がなければ「正解」
    return 'correct';
  }

  // 6. 完全一致はないが、前方一致候補がある場合は「入力途中」
  return 'in-progress';
}
