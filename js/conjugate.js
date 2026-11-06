'use strict';
/* Verb & adjective conjugation engine */
const Conj = (() => {
  // ending: [a, i, e, o, te, ta]
  const GODAN = {
    'う': ['わ', 'い', 'え', 'お', 'って', 'った'], 'く': ['か', 'き', 'け', 'こ', 'いて', 'いた'], 'ぐ': ['が', 'ぎ', 'げ', 'ご', 'いで', 'いだ'],
    'す': ['さ', 'し', 'せ', 'そ', 'して', 'した'], 'つ': ['た', 'ち', 'て', 'と', 'って', 'った'], 'ぬ': ['な', 'に', 'ね', 'の', 'んで', 'んだ'],
    'ぶ': ['ば', 'び', 'べ', 'ぼ', 'んで', 'んだ'], 'む': ['ま', 'み', 'め', 'も', 'んで', 'んだ'], 'る': ['ら', 'り', 'れ', 'ろ', 'って', 'った']
  };
  const FORMS = [
    { id: 'dict', label: 'צורת מילון (פשוט, הווה)', short: 'מילון', tag: 'る/う' },
    { id: 'masu', label: 'מנומס – הווה / עתיד', short: 'ます', tag: 'ます' },
    { id: 'masen', label: 'מנומס – שלילה', short: 'ません', tag: 'ません' },
    { id: 'mashita', label: 'מנומס – עבר', short: 'ました', tag: 'ました' },
    { id: 'masendeshita', label: 'מנומס – עבר שלילי', short: 'ませんでした', tag: 'ませんでした' },
    { id: 'mashou', label: 'הצעה: "בוא נ..."', short: 'ましょう', tag: 'ましょう' },
    { id: 'te', label: 'צורת て (חיבור / בקשה)', short: 'て', tag: 'て' },
    { id: 'ta', label: 'פשוט – עבר', short: 'た', tag: 'た' },
    { id: 'nai', label: 'פשוט – שלילה', short: 'ない', tag: 'ない' },
    { id: 'nakatta', label: 'פשוט – עבר שלילי', short: 'なかった', tag: 'なかった' },
    { id: 'tai', label: 'רוצה ל...', short: 'たい', tag: 'たい' },
    { id: 'teiru', label: 'פעולה מתמשכת / מצב', short: 'ている', tag: 'ている' },
    { id: 'pot', label: 'יכולת: "יכול ל..."', short: 'יכולת', tag: 'える/られる' },
    { id: 'vol', label: 'פשוט – "בוא נ..." (כוונה)', short: 'よう/おう', tag: 'よう' }
  ];
  const FORM_BY_ID = Object.fromEntries(FORMS.map(f => [f.id, f]));

  function build(stem, nai, te, ta, pot, vol, dict) {
    return {
      dict, masu: stem + 'ます', masen: stem + 'ません', mashita: stem + 'ました', masendeshita: stem + 'ませんでした', mashou: stem + 'ましょう',
      te, ta, nai, nakatta: nai.replace(/ない$/, 'なかった'), tai: stem + 'たい', teiru: te + 'いる', pot, vol, _stem: stem
    };
  }
  /** returns kana forms. g: 'u' | 'ru' | 'irr' */
  function verb(jp, g) {
    if (g === 'irr') {
      if (jp.endsWith('する')) {
        const p = jp.slice(0, -2);
        return build(p + 'し', p + 'しない', p + 'して', p + 'した', p + 'できる', p + 'しよう', jp);
      }
      if (jp.endsWith('くる')) {
        const p = jp.slice(0, -2);
        return build(p + 'き', p + 'こない', p + 'きて', p + 'きた', p + 'こられる', p + 'こよう', jp);
      }
    }
    if (g === 'ru') {
      const b = jp.slice(0, -1);
      return build(b, b + 'ない', b + 'て', b + 'た', b + 'られる', b + 'よう', jp);
    }
    const b = jp.slice(0, -1), end = jp.slice(-1);
    const [a, i, e, o, te, ta] = GODAN[end];
    let T = b + te, TA = b + ta;
    if (jp === 'いく' || jp.endsWith('いく') && jp.length <= 3) { T = b + 'って'; TA = b + 'った'; }
    let nai = b + a + 'ない';
    if (jp === 'ある') nai = 'ない';
    return build(b + i, nai, T, TA, b + e + 'る', b + o + 'う', jp);
  }
  /** kanji version of a kana form, if the word has kanji */
  function kanjiOf(w, form) {
    if (!w.kanji) return '';
    if (w.g === 'irr' && w.jp.endsWith('くる')) return w.kanji.slice(0, -1).replace(/る$/, '') + form.slice(w.jp.length - 1);
    const k = (w.g === 'irr') ? 2 : 1;
    return w.kanji.slice(0, w.kanji.length - k) + form.slice(w.jp.length - k);
  }
  function verbForms(w) {
    const f = verb(w.jp, w.g);
    const out = {};
    FORMS.forEach(F => {
      let kana = f[F.id];
      if (F.id === 'pot' && ['ある', 'わかる', 'できる', 'しる'].includes(w.jp)) kana = null;
      out[F.id] = kana ? { kana, kanji: kanjiOf(w, kana) } : null;
    });
    return out;
  }
  /** plausible wrong answers (for multiple choice) */
  function wrongForms(w, formId) {
    const right = verb(w.jp, w.g)[formId];
    const alts = [];
    const other = w.g === 'ru' ? 'u' : w.g === 'u' ? 'ru' : null;
    if (other && !(other === 'u' && !GODAN[w.jp.slice(-1)])) { try { alts.push(verb(w.jp, other)[formId]); } catch (e) { } }
    // naive mistakes
    if (formId === 'te' || formId === 'ta') {
      const b = w.jp.slice(0, -1), suf = formId === 'te' ? ['て', 'って', 'いて', 'んで', 'して'] : ['た', 'った', 'いた', 'んだ', 'した'];
      suf.forEach(s => alts.push(b + s));
      alts.push(w.jp + (formId === 'te' ? 'て' : 'た'));
    }
    if (formId === 'nai') { const b = w.jp.slice(0, -1); alts.push(w.jp + 'ない', b + 'ない', b + 'いない', b + 'あない'); }
    if (['masu', 'masen', 'mashita', 'masendeshita', 'mashou', 'tai'].includes(formId)) {
      const suf = { masu: 'ます', masen: 'ません', mashita: 'ました', masendeshita: 'ませんでした', mashou: 'ましょう', tai: 'たい' }[formId];
      alts.push(w.jp + suf, w.jp.slice(0, -1) + suf);
    }
    const f = verb(w.jp, w.g);
    ['masu', 'masen', 'mashita', 'te', 'ta', 'nai'].forEach(id => { if (id !== formId) alts.push(f[id]); });
    return uniq(alts.filter(x => x && x !== right));
  }
  function verbRule(w) {
    if (w.g === 'irr') return w.jp.endsWith('くる') ? 'פועל חריג (くる) – יש לשנן את הצורות.' : 'פועל חריג (する) – する → し / しない / して. כל "שם עצם + する" מוטה בדיוק כמו する.';
    if (w.g === 'ru') return `פועל る (ichidan): מורידים את る ומוסיפים סיומת. ${w.jp} → ${w.jp.slice(0, -1)} + ます / ない / て`;
    const end = w.jp.slice(-1), r = GODAN[end];
    let s = `פועל う (godan) שמסתיים ב-${end}: לפני ます הופך ל-${r[1]}, לפני ない הופך ל-${r[0]}, ובצורת て: ${r[4]}.`;
    if (w.jp === 'いく') s += ' יוצא דופן: いく → いって / いった.';
    if (w.jp === 'ある') s += ' יוצא דופן: השלילה של ある היא פשוט ない.';
    if (['かえる', 'はいる', 'はしる', 'しる'].includes(w.jp)) s += ' ⚠️ נראה כמו פועל る אבל הוא בעצם פועל う!';
    return s;
  }

  /* ---- adjectives ---- */
  const ADJ_FORMS = [
    { id: 'plain', label: 'הווה (פשוט)' }, { id: 'polite', label: 'הווה (מנומס)' }, { id: 'neg', label: 'שלילה' },
    { id: 'past', label: 'עבר' }, { id: 'pastneg', label: 'עבר שלילי' }, { id: 'te', label: 'צורת חיבור (て)' },
    { id: 'adv', label: 'תואר הפועל (באופן...)' }, { id: 'noun', label: 'לפני שם עצם' }
  ];
  function adj(w) {
    if (w.type === 'i-adj') {
      const b = w.jp === 'いい' ? 'よ' : w.jp.slice(0, -1);
      return { plain: w.jp, polite: w.jp + 'です', neg: b + 'くない', past: b + 'かった', pastneg: b + 'くなかった', te: b + 'くて', adv: b + 'く', noun: w.jp + ' + ' };
    }
    const j = w.jp;
    return { plain: j + 'だ', polite: j + 'です', neg: j + 'じゃない', past: j + 'だった', pastneg: j + 'じゃなかった', te: j + 'で', adv: j + 'に', noun: j + 'な + ' };
  }
  function adjWrong(w, formId) {
    const right = adj(w)[formId];
    const fake = Object.assign({}, w, { type: w.type === 'i-adj' ? 'na-adj' : 'i-adj' });
    const alts = [];
    try { alts.push(adj(fake)[formId]); } catch (e) { }
    if (w.jp === 'いい') { const b = 'い'; alts.push(b + 'くない', b + 'かった', b + 'くなかった', b + 'くて'); }
    const f = adj(w);
    Object.keys(f).forEach(k => { if (k !== formId && k !== 'noun') alts.push(f[k]); });
    return uniq(alts.filter(x => x && x !== right));
  }
  return { verb, verbForms, wrongForms, verbRule, FORMS, FORM_BY_ID, kanjiOf, adj, adjWrong, ADJ_FORMS, GODAN };
})();
