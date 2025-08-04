// constants/problems.ts
export interface Problem {
  word: string;
  kana: string;
}

export interface ProblemCategory {
  [categoryName: string]: Problem[];
}

export const problems: ProblemCategory = {
  'ことわざ': [
    { word: '光陰矢の如し', kana: 'こういんやのごとし' },
    { word: '能ある鷹は爪を隠す', kana: 'のうあるたかはつめをかくす' },
    { word: '塵も積もれば山となる', kana: 'ちりもつもればやまとなる' },
    { word: '継続は力なり', kana: 'けいぞくはちからなり' },
    { word: '石の上にも三年', kana: 'いしのうえにもさんねん' },
    { word: '青は藍より出でて藍より青し', kana: 'あおはあいよりいでてあいよりあおし' },
    { word: '明日は明日の風が吹く', kana: 'あしたはあしたのかぜがふく' },
  ],
  '文章': [
    { word: 'タイピングは正確さと速さが重要です。', kana: 'たいぴんぐはせいかくさとはやさがじゅうようです。' },
    { word: '今日の天気は晴れ、絶好の洗濯日和です！', kana: 'きょうのてんきははれ、ぜっこうのせんたくびよりです！' },
    { word: 'このプロジェクトの成功を心から願っています。', kana: 'このぷろじぇくとのせいこうをこころからねがっています。' },
    { word: '「こんにちは！」と彼は言った。', kana: '「こんにちは！」とかれはいった。' },
    { word: 'これは本当に正しいのでしょうか？', kana: 'これはほんとうにただしいのでしょうか？' },
    { word: 'メールアドレスは example@example.com です。', kana: 'めーるあどれすは example@example.com です。' },
  ],
  '単語': [
    { word: '寿司', kana: 'すし' },
    { word: '日本', kana: 'にっぽん' },
    { word: '桜', kana: 'さくら' },
    { word: '切符', kana: 'きっぷ' },
    { word: '権威', kana: 'けんい' },
    { word: 'ゲーム', kana: 'げーむ' },
    { word: 'インターネット', kana: 'いんたーねっと' },
    { word: '新幹線', kana: 'しんかんせん' },
  ],
  '記号と数字': [
    { word: 'ABCDEFG', kana: 'ABCDEFG' },
    { word: '1234567890', kana: '1234567890' },
    { word: 'ＨＥＬＬＯ　ＷＯＲＬＤ！', kana: 'ＨＥＬＬＯ　ＷＯＲＬＤ！' },
    { word: '１２３＋４５６＝５７９', kana: '１２３＋４５６＝５７９' },
    { word: '価格は$1,000です。', kana: 'かかくは$1,000です。' },
  ],
};