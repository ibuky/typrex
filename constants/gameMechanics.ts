// constants/gameMechanics.ts
export interface Level {
  name: string;
  minScore: number;
  color: string; // UIでレベル名に色を付けるためのクラス
}

// スコアに基づいたレベル定義（昇順）
export const levels: Level[] = [
  { name: '見習い', minScore: 0, color: 'text-gray-400' },
  { name: '初級者', minScore: 2000, color: 'text-green-400' },
  { name: '中級者', minScore: 10000, color: 'text-blue-400' },
  { name: '上級者', minScore: 25000, color: 'text-purple-400' },
  { name: '熟練者', minScore: 50000, color: 'text-yellow-400' },
  { name: '達人', minScore: 80000, color: 'text-orange-400' },
  { name: '超人', minScore: 120000, color: 'text-red-500' },
  { name: '神', minScore: 150000, color: 'text-fuchsia-500' },
];

/**
 * スコアから対応するレベルを判定する
 * @param score 計算されたスコア
 * @returns 対応するLevelオブジェクト
 */
export const getLevelFromScore = (score: number): Level => {
  // levels配列がminScoreでソートされていることを前提とする
  let currentLevel = levels[0];
  for (const level of levels) {
    if (score >= level.minScore) {
      currentLevel = level;
    } else {
      // スコアが次のレベルの閾値に満たないため、ループを抜ける
      break;
    }
  }
  return currentLevel;
};
