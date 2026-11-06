'use strict';
/* Kana chart data. Romaji is generated automatically. */
const KANA = (() => {
  const GOJUON = [
    ['あ', 'い', 'う', 'え', 'お'], ['か', 'き', 'く', 'け', 'こ'], ['さ', 'し', 'す', 'せ', 'そ'], ['た', 'ち', 'つ', 'て', 'と'],
    ['な', 'に', 'ぬ', 'ね', 'の'], ['は', 'ひ', 'ふ', 'へ', 'ほ'], ['ま', 'み', 'む', 'め', 'も'], ['や', '', 'ゆ', '', 'よ'],
    ['ら', 'り', 'る', 'れ', 'ろ'], ['わ', '', '', '', 'を'], ['ん', '', '', '', '']
  ];
  const DAKUTEN = [
    ['が', 'ぎ', 'ぐ', 'げ', 'ご'], ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], ['だ', 'ぢ', 'づ', 'で', 'ど'], ['ば', 'び', 'ぶ', 'べ', 'ぼ'], ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']
  ];
  const YOON = [
    ['きゃ', 'きゅ', 'きょ'], ['しゃ', 'しゅ', 'しょ'], ['ちゃ', 'ちゅ', 'ちょ'], ['にゃ', 'にゅ', 'にょ'], ['ひゃ', 'ひゅ', 'ひょ'], ['みゃ', 'みゅ', 'みょ'],
    ['りゃ', 'りゅ', 'りょ'], ['ぎゃ', 'ぎゅ', 'ぎょ'], ['じゃ', 'じゅ', 'じょ'], ['びゃ', 'びゅ', 'びょ'], ['ぴゃ', 'ぴゅ', 'ぴょ']
  ];
  const EXT_KATA = [
    ['ファ', 'フィ', 'フェ', 'フォ'], ['ティ', 'ディ', 'トゥ', 'ドゥ'], ['ウィ', 'ウェ', 'ウォ', 'ヴ'], ['シェ', 'ジェ', 'チェ', 'イェ']
  ];
  const mk = (rows, group, kata) => rows.flat().filter(Boolean).map(h => {
    const k = kata ? Kana.toKata(h) : h;
    return { k, r: Kana.hiraToRomaji(h), group };
  });
  const hira = [...mk(GOJUON, 'basic'), ...mk(DAKUTEN, 'dakuten'), ...mk(YOON, 'yoon')];
  const kata = [...mk(GOJUON, 'basic', true), ...mk(DAKUTEN, 'dakuten', true), ...mk(YOON, 'yoon', true),
  ...EXT_KATA.flat().map(k => ({ k, r: Kana.hiraToRomaji(k), group: 'ext' }))];
  // ぢ/づ duplicate sounds - mark so typing accepts either
  const CONFUSE = {
    hira: [['さ', 'ち'], ['き', 'さ'], ['ぬ', 'め'], ['ね', 'れ', 'わ'], ['る', 'ろ'], ['は', 'ほ', 'け'], ['い', 'り'], ['こ', 'に', 'た'], ['あ', 'お', 'め'], ['ま', 'も'], ['う', 'つ', 'ら'], ['く', 'へ'], ['し', 'つ', 'も'], ['ゆ', 'よ']],
    kata: [['シ', 'ツ'], ['ソ', 'ン'], ['ク', 'ケ', 'タ'], ['ウ', 'ワ', 'フ'], ['ア', 'マ', 'ヤ'], ['コ', 'ユ', 'ロ'], ['ノ', 'メ', 'ヌ'], ['チ', 'テ', 'ナ'], ['ル', 'レ'], ['ヲ', 'ラ', 'ヨ'], ['セ', 'ヤ'], ['エ', 'ニ', 'コ'], ['ハ', 'ル'], ['オ', 'ホ', 'キ']]
  };
  return {
    GOJUON, DAKUTEN, YOON, EXT_KATA, hira, kata, CONFUSE,
    hiraBasic: hira.filter(x => x.group === 'basic'),
    kataBasic: kata.filter(x => x.group === 'basic'),
    GROUPS: { basic: 'בסיס (46)', dakuten: 'ניקוד דאקוטן ゛゜', yoon: 'צירופים (ゃゅょ)', ext: 'קטקנה מורחבת' }
  };
})();
