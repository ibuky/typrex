// utils/typingLogic.ts

/**
 * かな-ローマ字変換テーブル
 * キー: かな (例: 'あ', 'きゃ', 'ん')
 * バリュー: 対応するローマ字表記の配列 (例: ['a'], ['ka', 'ca'])
 */
export const kanaToRomanMap: Record<string, string[]> = {
  // 基本五十音
  'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
  'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
  'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
  'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo'],

  // 撥音と促音 (単体)
  'ん': ['n', 'nn', 'xn'], // 例: かん -> kan, さん -> san
  'っ': ['xtu', 'xtsu'],   // 例: かった -> katta (ka + xtu + ta)
  'ー': ['-'], // 長音符

  // 拗音
  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
  'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
  'ちゃ': ['cha', 'tya', 'cya'], 'ちゅ': ['chu', 'tyu', 'cyu'], 'ちょ': ['cho', 'tyo', 'cyo'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],

  // 濁音・半濁音 (基本五十音 + 拗音)
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'だ': ['da'], 'ぢ': ['di', 'dzi'], 'づ': ['du', 'dzu'], 'で': ['de'], 'ど': ['do'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],

  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'],
  'ぢゃ': ['dya'], 'ぢゅ': ['dyu'], 'ぢょ': ['dyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],

  // 特殊音・外来音 (例示)
  'うぃ': ['wi', 'uxi'], 'うぇ': ['we', 'uxe'], 'うぉ': ['wo', 'uxo'],
  'てぃ': ['thi', 'texi'], 'でぃ': ['dhi', 'dexi'],
  'ふぁ': ['fa', 'fwa', 'huxa'], 'ふぃ': ['fi', 'fwi', 'huxi'], 'ふぇ': ['fe', 'fwe', 'huxe'], 'ふぉ': ['fo', 'fwo', 'huxo'],
  'ゔぁ': ['va'], 'ゔぃ': ['vi'], 'ゔ': ['vu'], 'ゔぇ': ['ve'], 'ゔぉ': ['vo'],
  'いぇ': ['ye', 'ixe'],
  // 他にも多数あるが、主要なものを記載
};

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
