'use strict';
/* ===== Numbers & counting trainer: 0 – 999,999 ===== */
const Num = (() => {
  const DIG = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
  const KJ = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const ALT = { 'よん': ['よん', 'し'], 'なな': ['なな', 'しち'], 'きゅう': ['きゅう', 'く'] };
  const SPECIAL = {
    'さんびゃく': '3 × 100: ひゃく הופך ל-びゃく', 'ろっぴゃく': '6 × 100: ろく + ひゃく → ろっぴゃく', 'はっぴゃく': '8 × 100: はち + ひゃく → はっぴゃく',
    'さんぜん': '3 × 1000: せん הופך ל-ぜん', 'はっせん': '8 × 1000: はち + せん → はっせん',
    'ひゃく': '100 לבד = ひゃく (בלי いち)', 'せん': '1000 לבד = せん (בלי いち)', 'じゅう': '10 לבד = じゅう (בלי いち)'
  };
  /** parts of a number 0–9999: [{kana, val, alts?}] */
  function block(n) {
    const out = [];
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
    if (th) out.push({ kana: { 1: 'せん', 3: 'さんぜん', 8: 'はっせん' }[th] || DIG[th] + 'せん', val: th * 1000 });
    if (h) out.push({ kana: { 1: 'ひゃく', 3: 'さんびゃく', 6: 'ろっぴゃく', 8: 'はっぴゃく' }[h] || DIG[h] + 'ひゃく', val: h * 100 });
    if (t) out.push({ kana: t === 1 ? 'じゅう' : DIG[t] + 'じゅう', val: t * 10, alts: t === 7 ? ['ななじゅう', 'しちじゅう'] : null });
    if (o) out.push({ kana: DIG[o], val: o, alts: ALT[DIG[o]] || null });
    return out;
  }
  function parts(n) {
    if (n === 0) return [{ kana: 'ゼロ', val: 0, alts: ['ゼロ', 'れい'] }];
    const man = Math.floor(n / 10000), rest = n % 10000;
    const ps = [];
    if (man) {
      const mp = block(man);
      // in the 万 group, 1 alone is いちまん
      ps.push(...mp.map(p => ({ ...p, val: p.val * 10000, inMan: true })));
      ps.push({ kana: 'まん', val: 0, unit: true });
    }
    ps.push(...block(rest));
    return ps;
  }
  const read = n => parts(n).map(p => p.kana).join('');
  /** every accepted spelling (4/7/9 variants) */
  function variants(n) {
    let acc = [''];
    for (const p of parts(n)) {
      const opts = p.alts || [p.kana];
      const nx = [];
      acc.forEach(a => opts.forEach(o => nx.push(a + o)));
      acc = nx.slice(0, 64);
    }
    return uniq(acc);
  }
  function kanji(n) {
    if (n === 0) return '〇';
    const b = m => {
      let s = '';
      const th = Math.floor(m / 1000), h = Math.floor(m / 100) % 10, t = Math.floor(m / 10) % 10, o = m % 10;
      if (th) s += (th > 1 ? KJ[th] : '') + '千';
      if (h) s += (h > 1 ? KJ[h] : '') + '百';
      if (t) s += (t > 1 ? KJ[t] : '') + '十';
      if (o) s += KJ[o];
      return s;
    };
    const man = Math.floor(n / 10000), rest = n % 10000;
    return (man ? b(man) + '万' : '') + b(rest);
  }
  /** plausible wrong readings, for multiple choice */
  function wrong(n) {
    const r = read(n), out = new Set();
    const swaps = [['さんびゃく', 'さんひゃく'], ['ろっぴゃく', 'ろくひゃく'], ['はっぴゃく', 'はちひゃく'], ['さんぜん', 'さんせん'], ['はっせん', 'はちせん'],
      ['ひゃく', 'いちひゃく'], ['せん', 'いっせん'], ['じゅう', 'いちじゅう']];
    swaps.forEach(([a, b]) => { if (r.includes(a)) out.add(r.replace(a, b)); });
    if (Math.floor(n / 10000) === 1 && r.startsWith('いちまん')) out.add(r.replace('いちまん', 'まん'));
    const near = [n + 1, n - 1, n + 10, n - 10, n + 100, n - 100, n + 1000, n * 10, Math.floor(n / 10)].filter(x => x > 0 && x < 1e6 && x !== n);
    const digits = String(n).split('');
    if (digits.length > 1) { const d = [...digits]; [d[0], d[1]] = [d[1], d[0]]; const x = +d.join(''); if (x !== n && x > 0) near.push(x); }
    shuffle(near).forEach(x => out.add(read(x)));
    out.delete(r);
    return [...out];
  }
  return { parts, read, variants, kanji, wrong, SPECIAL };
})();

const NUM_RANGES = [
  { id: 'r1', name: '1–10', min: 1, max: 10 }, { id: 'r2', name: '11–99', min: 11, max: 99 }, { id: 'r3', name: '100–999', min: 100, max: 999 },
  { id: 'r4', name: '1,000–9,999', min: 1000, max: 9999 }, { id: 'r5', name: '10,000–999,999', min: 10000, max: 999999 },
  { id: 'tricky', name: '🌀 שינויי צליל (300, 600, 800, 3000, 8000)', tricky: true }, { id: 'all', name: '🎲 הכול (1–999,999)', all: true }
];
function randNum(rid) {
  const r = NUM_RANGES.find(x => x.id === rid) || NUM_RANGES[6];
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  if (r.all) { const len = ri(1, 6); return len === 1 ? ri(1, 9) : ri(10 ** (len - 1), 10 ** len - 1); }
  if (r.tricky) {
    const h = pick([3, 6, 8]), th = pick([0, 3, 8]), man = pick([0, 0, 3, 8, 13, 36]);
    return man * 10000 + th * 1000 + h * 100 + ri(0, 99);
  }
  return ri(r.min, r.max);
}
const fmtN = n => n.toLocaleString('en-US');
const ITEMS = [['🍎', 'りんご', 'התפוח'], ['☕', 'コーヒー', 'הקפה'], ['📕', 'ほん', 'הספר'], ['👕', 'Tシャツ', 'חולצת הטי'], ['⌚', 'とけい', 'השעון'], ['👜', 'かばん', 'התיק'],
  ['🍣', 'すし', 'הסושי'], ['🚲', 'じてんしゃ', 'האופניים'], ['💻', 'パソコン', 'המחשב'], ['👟', 'くつ', 'הנעליים'], ['👛', 'さいふ', 'הארנק'], ['🍱', 'べんとう', 'הבנטו'], ['🧢', 'ぼうし', 'הכובע'], ['📙', 'じしょ', 'המילון']];

function numBreakdown(n) {
  const ps = Num.parts(n);
  return `<div class="num-parts" dir="ltr">${ps.map(p => {
    const sp = Num.SPECIAL[p.kana] && !p.unit ? Num.SPECIAL[p.kana] : '';
    const val = p.unit ? '× 10,000' : fmtN(p.inMan ? p.val / 10000 : p.val);
    return `<div class="np ${p.unit ? 'unit' : ''} ${sp ? 'special' : ''}" ${sp ? `title="${esc(sp)}"` : ''}><span class="np-v">${val}</span><span class="np-k jp say" data-say="${p.kana}" lang="ja">${p.kana}</span></div>`;
  }).join('')}</div>`;
}

Views.numbers = (root, parts, params) => {
  const run = params.get('run');
  if (run) return numbersQuiz(root, run, params.get('range') || 'all');
  let cur = parseInt(params.get('n') || '0', 10) || 365;
  root.innerHTML = `
  <h1 class="page-title">🔢 ספירה ומספרים</h1>
  <p class="muted">תרגול מספרים מ-1 ועד 999,999 – קריאה, שמיעה, כתיבה ומחירים בחנות.</p>

  <section class="card num-explorer">
    <div class="card-h">🔍 חוקר המספרים – הקלידו מספר וראו איך אומרים אותו</div>
    <div class="row gap wrap">
      <input id="nin" class="num-in" inputmode="numeric" maxlength="7" value="${cur}" dir="ltr" autocomplete="off">
      <button class="btn" id="nrand">🎲 מספר אקראי</button>
      <button class="btn" id="nsay">🔊 השמעה</button>
    </div>
    <div id="nout"></div>
  </section>

  <section class="card practice-panel">
    <div class="card-h">🎯 תרגול</div>
    <div class="opt-row"><span class="opt-l">טווח:</span>${NUM_RANGES.map((r, i) => `<button class="chip ${i === 6 ? 'on' : ''}" data-range="${r.id}">${r.name}</button>`).join('')}</div>
    <div class="grid cols-2" style="margin-top:12px">
      <button class="card action sm" data-run="read"><div class="action-i">👁️</div><div class="action-t">קריאה</div><div class="action-s">רואים מספר – בוחרים איך אומרים אותו</div></button>
      <button class="card action sm" data-run="type"><div class="action-i">⌨️</div><div class="action-t">כתיבה</div><div class="action-s">רואים מספר – כותבים אותו ביפנית</div></button>
      <button class="card action sm" data-run="listen"><div class="action-i">🎧</div><div class="action-t">שמיעה</div><div class="action-s">שומעים מספר – כותבים אותו בספרות</div></button>
      <button class="card action sm" data-run="shop"><div class="action-i">🛍️</div><div class="action-t">בחנות</div><div class="action-s">שומעים מחיר בין – כמה זה עולה?</div></button>
    </div>
  </section>

  <section class="card">
    <div class="card-h">📏 החוקים</div>
    <ul class="clean">
      <li>ביפנית סופרים ב<b>קבוצות של 4 ספרות</b>: {{まん}} = 10,000. לכן 120,000 = 12 × 10,000 = {{じゅうにまん}}.</li>
      <li>מספר בונים מגדול לקטן: 2,345 = {{にせん}} + {{さんびゃく}} + {{よんじゅう}} + {{ご}}.</li>
      <li>10, 100, 1000 לבד – בלי "אחת": {{じゅう}}, {{ひゃく}}, {{せん}}. אבל 10,000 = {{いちまん}}!</li>
      <li>4, 7, 9: בספירה רגילה {{よん}}, {{なな}}, {{きゅう}} (יש גם {{し}}, {{しち}}, {{く}} – נקבל את שתיהן).</li>
    </ul>
    <div class="tbl-wrap"><table class="tbl center"><thead><tr><th>מספר</th><th>קריאה</th><th>מה קורה</th></tr></thead><tbody>
      ${[[300, 'ひゃく → びゃく'], [600, 'ろく + ひゃく → ろっぴゃく'], [800, 'はち + ひゃく → はっぴゃく'], [3000, 'せん → ぜん'], [8000, 'はち + せん → はっせん'], [10000, 'いち + まん (חובה いち)']]
        .map(([n, d]) => `<tr><td dir="ltr">${fmtN(n)}</td><td>${UI.jp(Num.read(n))}</td><td>${UI.rich(esc(d))}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="card-sub">דוגמאות</div>
    <div class="examples">${[11, 45, 99, 108, 1964, 25000, 123456, 999999].map(n => `<div class="ex"><div class="ex-jp"><b dir="ltr">${fmtN(n)}</b> = ${UI.jp(Num.read(n))} ${UI.sayBtn(Num.read(n))}</div>${UI.ro(Num.read(n))}</div>`).join('')}</div>
  </section>`;
  $$('.card', root).forEach(c => { c.innerHTML = c.innerHTML.replace(/\{\{(.+?)\}\}/g, (m, j) => UI.jp(j, 'inline')); });

  const inp = $('#nin', root), out = $('#nout', root);
  const show = () => {
    const v = parseInt(inp.value.replace(/\D/g, ''), 10);
    if (isNaN(v) || v < 0 || v > 999999) { out.innerHTML = '<p class="muted">הקלידו מספר בין 0 ל-999,999</p>'; return; }
    cur = v;
    const r = Num.read(v);
    out.innerHTML = `
      <div class="num-big" dir="ltr">${fmtN(v)}</div>
      <div class="num-read">${UI.jp(r)}</div>
      ${UI.ro(r)}
      <div class="small muted">בקאנג׳י: <span lang="ja" class="num-kanji">${Num.kanji(v)}</span></div>
      ${numBreakdown(v)}
      ${Num.parts(v).some(p => Num.SPECIAL[p.kana] && !p.unit) ? `<div class="banner">💡 ${Num.parts(v).filter(p => Num.SPECIAL[p.kana]).map(p => esc(Num.SPECIAL[p.kana])).join(' · ')}</div>` : ''}`;
  };
  inp.oninput = show;
  $('#nrand', root).onclick = () => { inp.value = randNum('all'); show(); TTS.speak(Num.read(cur)); };
  $('#nsay', root).onclick = () => TTS.speak(Num.read(cur));
  let range = 'all';
  $$('[data-range]', root).forEach(b => b.onclick = () => { range = b.dataset.range; $$('[data-range]', root).forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-run]', root).forEach(b => b.onclick = () => { location.hash = `#/numbers?run=${b.dataset.run}&range=${range}`; });
  show();
};

function numbersQuiz(root, mode, range) {
  const used = new Set(), nums = [];
  let guard = 0;
  while (nums.length < 10 && guard++ < 500) {
    let n = randNum(range);
    if (mode === 'shop') n = range === 'all' ? pick([randNum('r3'), randNum('r4'), randNum('r4'), randNum('r5')]) : n;
    if (mode === 'shop' && n >= 100) n = Math.round(n / 10) * 10;
    if (used.has(n)) continue;
    used.add(n); nums.push(n);
  }
  const reveal = n => `<div class="reveal-word"><b dir="ltr" class="num-mid">${fmtN(n)}</b> = ${UI.jp(Num.read(n), 'big')} ${UI.sayBtn(Num.read(n))}</div>${UI.ro(Num.read(n))}${numBreakdown(n)}`;
  const after = ok => { if (ok) { Store.s.stats.numbers = (Store.s.stats.numbers || 0) + 1; Store.save(); } };
  const qs = nums.map(n => {
    const r = Num.read(n);
    if (mode === 'read') return { type: 'mc', label: 'איך אומרים את המספר?', prompt: `<div class="num-big" dir="ltr">${fmtN(n)}</div>`,
      options: [QB.jpOpt(r, 'ok'), ...shuffle(Num.wrong(n)).slice(0, 3).map(x => QB.jpOpt(x))], answer: 'ok', optCls: 'jp-opts num-opts', reveal: reveal(n), sayAfter: r, after };
    if (mode === 'type') return { type: 'type', label: 'כתבו את המספר ביפנית (ברומאג׳י → קאנה)', prompt: `<div class="num-big" dir="ltr">${fmtN(n)}</div>`,
      answers: Num.variants(n), reveal: reveal(n), sayAfter: r, after };
    const [emo, item, heItem] = pick(ITEMS);
    const say = mode === 'shop' ? `${item}[は] ${r}えん|です。` : r;
    return { type: 'type', latin: true, label: mode === 'shop' ? '🛍️ כמה זה עולה? כתבו את המחיר בספרות' : '🎧 איזה מספר שמעתם? כתבו בספרות',
      prompt: mode === 'shop' ? `<div class="shop-item">${emo}</div><div class="muted">${UI.jp(item)}</div>` : '<div class="listen-hint">לחצו על הרמקול לשמוע שוב</div>',
      say, autoSay: true, check: v => parseInt(v.replace(/[^\d]/g, ''), 10) === n,
      reveal: (mode === 'shop' ? QB.sentenceReveal(say, `${heItem} עולה ${fmtN(n)} ין.`) : '') + reveal(n), sayAfter: null, after, numeric: true };
  });
  const names = { read: 'קריאה', type: 'כתיבה', listen: 'שמיעה', shop: 'בחנות' };
  Quiz.run(root, { title: `🔢 מספרים · ${names[mode]} · ${(NUM_RANGES.find(r => r.id === range) || {}).name || ''}`, questions: qs, back: '#/numbers', retry: () => numbersQuiz(root, mode, range) });
}
