'use strict';
/* ===== Kana charts & trainer ===== */
const KanaUI = {
  opts: { mode: 'rec', groups: ['basic'], rows: [], special: '', n: 20 },
  level(ch) {
    const k = Store.s.kana[ch]; if (!k) return 'm0';
    if (Prog.kanaMastered(ch)) return 'm2';
    if (k.w > k.r) return 'mbad';
    return 'm1';
  },
  cell(k, r) { if (!k) return '<div class="kcell empty"></div>'; return `<button class="kcell ${this.level(k)}" data-say="${k}" lang="ja"><span class="kc-k">${k}</span><span class="kc-r" dir="ltr">${r}</span></button>`; },
  conv(set, h) { return set === 'kata' ? Kana.toKata(h) : h; }
};
const ROW_NAMES = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];

Views.kana = (root, parts, params) => {
  const set = params.get('set') === 'kata' ? 'kata' : 'hira';
  const o = KanaUI.opts;
  const cv = h => KanaUI.conv(set, h);
  const grid = (rows, cols) => `<div class="kgrid" style="--cols:${cols}">${rows.map(r => r.map(h => h ? KanaUI.cell(cv(h), Kana.hiraToRomaji(h)) : KanaUI.cell('')).join('')).join('')}</div>`;
  const all = set === 'kata' ? KANA.kata : KANA.hira;
  const mastered = all.filter(k => Prog.kanaMastered(k.k)).length;
  const groups = set === 'kata' ? ['basic', 'dakuten', 'yoon', 'ext'] : ['basic', 'dakuten', 'yoon'];
  o.groups = o.groups.filter(g => groups.includes(g)); if (!o.groups.length) o.groups = ['basic'];
  const MODES = [
    ['rec', '👁️ זיהוי', 'רואים אות – בוחרים צליל'], ['rev', '🔤 הפוך', 'רואים צליל – בוחרים אות'], ['type', '⌨️ הקלדה', 'רואים אות – מקלידים רומאג׳י'],
    ['listen', '🎧 שמיעה', 'שומעים – בוחרים אות'], ['words', '📖 קריאת מילים', 'קוראים מילים אמיתיות']
  ];
  root.innerHTML = `
  <h1 class="page-title"><span lang="ja">あ</span> הירגנה וקטקנה</h1>
  <div class="tabs">
    <a class="tab ${set === 'hira' ? 'active' : ''}" href="#/kana?set=hira"><span lang="ja">ひらがな</span> הירגנה</a>
    <a class="tab ${set === 'kata' ? 'active' : ''}" href="#/kana?set=kata"><span lang="ja">カタカナ</span> קטקנה</a>
  </div>
  <p class="muted">${set === 'hira' ? 'הירגנה היא הכתב הבסיסי – למילים יפניות, חלקיקים וסיומות של פעלים.' : 'קטקנה משמשת בעיקר למילים לועזיות (コーヒー = קפה), שמות זרים והדגשה.'}
   שלטתם ב-<b>${mastered}</b> מתוך ${all.length}. לחצו על אות כדי לשמוע אותה.</p>

  <section class="card practice-panel">
    <div class="card-h">🎯 אימון</div>
    <div class="mode-grid">${MODES.map(([id, n, d]) => `<button class="mode ${o.mode === id ? 'active' : ''}" data-mode="${id}"><b>${n}</b><small>${d}</small></button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">קבוצות:</span>${groups.map(g => `<button class="chip ${o.groups.includes(g) ? 'on' : ''}" data-group="${g}">${KANA.GROUPS[g]}</button>`).join('')}</div>
    <div class="opt-row" id="rows-row"><span class="opt-l">שורות (בסיס):</span><button class="chip ${!o.rows.length ? 'on' : ''}" data-row="all">כולן</button>${ROW_NAMES.map(r => `<button class="chip ${o.rows.includes(r) ? 'on' : ''}" data-row="${r}" lang="ja">${cv(r)}</button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">מיקוד:</span>
      <button class="chip ${!o.special ? 'on' : ''}" data-special="">רגיל</button>
      <button class="chip ${o.special === 'confuse' ? 'on' : ''}" data-special="confuse">🔀 זוגות מבלבלים</button>
      <button class="chip ${o.special === 'weak' ? 'on' : ''}" data-special="weak">🎯 החלשים שלי</button>
      <span class="opt-l" style="margin-inline-start:auto">שאלות:</span>
      <select id="kn">${[10, 20, 30, 46].map(n => `<option ${o.n === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
    </div>
    <div class="row center"><button class="btn primary lg" id="kstart">התחילו ▶</button></div>
  </section>

  <section class="card">
    <div class="legend"><span><i class="m0"></i>חדש</span><span><i class="m1"></i>בלמידה</span><span><i class="mbad"></i>צריך חיזוק</span><span><i class="m2"></i>בשליטה</span></div>
    <div class="card-sub">בסיס</div>
    <div class="kgrid-head" lang="en" dir="ltr"><span>a</span><span>i</span><span>u</span><span>e</span><span>o</span></div>
    ${grid(KANA.GOJUON, 5)}
    <div class="card-sub">ניקוד דאקוטן ゛ והנדאקוטן ゜</div>
    <p class="small muted">שני קווים קטנים ゛ הופכים צליל ל"קולי": か(ka)→が(ga). עיגול קטן ゜ הופך ה→פ: は(ha)→ぱ(pa).</p>
    ${grid(KANA.DAKUTEN, 5)}
    <div class="card-sub">צירופים (よう-on)</div>
    <p class="small muted">אות מהעמודה i + や/ゆ/よ קטנה = הברה אחת: き + ゃ = きゃ (kya).</p>
    ${grid(KANA.YOON, 3)}
    ${set === 'kata' ? `<div class="card-sub">קטקנה מורחבת (לצלילים לועזיים)</div><div class="kgrid" style="--cols:4">${KANA.EXT_KATA.flat().map(k => KanaUI.cell(k, Kana.hiraToRomaji(k))).join('')}</div>` : ''}
    <div class="card-sub">סימנים מיוחדים</div>
    <ul class="clean small">
      <li><b lang="ja">っ / ッ</b> קטנה = הכפלת העיצור הבא: ${UI.jp('きって')} (kitte – בול), ${UI.jp('ベッド')} (beddo – מיטה).</li>
      <li><b lang="ja">ー</b> (קטקנה) = הארכת התנועה: ${UI.jp('コーヒー')} (kōhī). בהירגנה מאריכים עם אות תנועה: ${UI.jp('おかあさん')}.</li>
      <li><b lang="ja">ん</b> = n בסוף הברה: ${UI.jp('ほん')} (hon).</li>
    </ul>
  </section>`;

  const refresh = () => Views.kana(root, parts, params);
  $$('[data-mode]', root).forEach(b => b.onclick = () => { o.mode = b.dataset.mode; refresh(); });
  $$('[data-group]', root).forEach(b => b.onclick = () => {
    const g = b.dataset.group; o.groups = o.groups.includes(g) ? o.groups.filter(x => x !== g) : [...o.groups, g];
    if (!o.groups.length) o.groups = [g]; refresh();
  });
  $$('[data-row]', root).forEach(b => b.onclick = () => {
    const r = b.dataset.row;
    if (r === 'all') o.rows = []; else o.rows = o.rows.includes(r) ? o.rows.filter(x => x !== r) : [...o.rows, r];
    refresh();
  });
  $$('[data-special]', root).forEach(b => b.onclick = () => { o.special = b.dataset.special; refresh(); });
  $('#kn', root).onchange = e => { o.n = parseInt(e.target.value, 10); };
  $('#kstart', root).onclick = () => {
    location.hash = `#/kanaquiz?set=${set}&mode=${o.mode}&groups=${o.groups.join(',')}&rows=${encodeURIComponent(o.rows.join(','))}&special=${o.special}&n=${o.n}`;
  };
};

Views.kanaquiz = (root, parts, params) => {
  const set = params.get('set') === 'kata' ? 'kata' : 'hira';
  const mode = params.get('mode') || 'rec';
  const groups = (params.get('groups') || 'basic').split(',');
  const rows = (params.get('rows') || '').split(',').filter(Boolean);
  const special = params.get('special') || '';
  const n = parseInt(params.get('n') || '20', 10);
  const back = `#/kana?set=${set}`;
  const retry = () => Views.kanaquiz(root, parts, params);

  if (mode === 'words') return kanaWordsQuiz(root, set, n, back, retry);

  const all = set === 'kata' ? KANA.kata : KANA.hira;
  let pool = all.filter(k => groups.includes(k.group));
  if (rows.length) {
    const rowSets = rows.map(r => KANA.GOJUON.find(row => row[0] === r)).filter(Boolean).flat().filter(Boolean).map(h => KanaUI.conv(set, h));
    pool = pool.filter(k => k.group !== 'basic' || rowSets.includes(k.k));
  }
  const conf = KANA.CONFUSE[set];
  if (special === 'confuse') pool = all.filter(k => conf.some(g => g.includes(k.k)));
  if (special === 'weak') {
    const weak = pool.filter(k => { const s = Store.s.kana[k.k]; return !s || s.r < 3 || s.w / (s.r + s.w) > 0.2; });
    if (weak.length >= 4) pool = weak;
  }
  if (pool.length < 2) pool = all.filter(k => k.group === 'basic');

  // weighted selection – weaker kana appear more
  const weight = k => { const s = Store.s.kana[k.k] || { r: 0, w: 0 }; return Math.max(0.3, 1.5 + 2 * s.w - 0.3 * Math.min(s.r, 6)); };
  const chosen = [];
  const base = shuffle(pool);
  for (let i = 0; i < n; i++) {
    if (i < base.length && chosen.length < pool.length && i < n) { chosen.push(base[i]); continue; }
    const tot = pool.reduce((a, k) => a + weight(k), 0); let r = Math.random() * tot;
    let pickK = pool[0]; for (const k of pool) { r -= weight(k); if (r <= 0) { pickK = k; break; } }
    if (chosen.length && chosen[chosen.length - 1] === pickK && pool.length > 1) { i--; continue; }
    chosen.push(pickK);
  }
  const record = (k, ok) => { const s = Store.s.kana[k] || { r: 0, w: 0 }; ok ? s.r++ : s.w++; Store.s.kana[k] = s; Store.save(); };
  const distract = (item, field, nD = 3) => {
    const grp = conf.find(g => g.includes(item.k)) || [];
    const fromConf = all.filter(k => grp.includes(k.k) && k.k !== item.k);
    const fromPool = shuffle(pool.filter(k => k.k !== item.k));
    const fromAll = shuffle(all.filter(k => k.k !== item.k && k.group === item.group));
    const out = [], seen = new Set([item[field]]);
    for (const k of [...shuffle(fromConf), ...fromPool, ...fromAll]) { if (seen.has(k[field])) continue; seen.add(k[field]); out.push(k); if (out.length >= nD) break; }
    return out;
  };
  const questions = chosen.map(item => {
    const after = ok => record(item.k, ok);
    const reveal = `<div class="reveal-word"><span class="big-jp jp say" data-say="${item.k}" lang="ja">${item.k}</span> = <b dir="ltr">${item.r}</b></div>`;
    if (mode === 'rec') return { type: 'mc', label: 'איך קוראים את האות?', prompt: `<div class="huge-kana" lang="ja">${item.k}</div>`, options: [{ html: `<b dir="ltr">${item.r}</b>`, key: 'ok' }, ...distract(item, 'r').map(d => ({ html: `<b dir="ltr">${d.r}</b>`, key: d.k }))], answer: 'ok', reveal, sayAfter: item.k, after };
    if (mode === 'rev') return { type: 'mc', label: 'איזו אות היא…', prompt: `<div class="huge-ro" dir="ltr">${item.r}</div>`, options: [{ html: `<span class="opt-kana" lang="ja">${item.k}</span>`, key: 'ok' }, ...distract(item, 'k').map(d => ({ html: `<span class="opt-kana" lang="ja">${d.k}</span>`, key: d.k }))], answer: 'ok', optCls: 'kana-opts', reveal, sayAfter: item.k, after };
    if (mode === 'listen') return { type: 'mc', label: '🎧 איזו אות שמעתם?', prompt: '', say: item.k, autoSay: true, options: [{ html: `<span class="opt-kana" lang="ja">${item.k}</span>`, key: 'ok' }, ...distract(item, 'k').map(d => ({ html: `<span class="opt-kana" lang="ja">${d.k}</span>`, key: d.k }))], answer: 'ok', optCls: 'kana-opts', reveal, after };
    return { type: 'type', latin: true, label: 'הקלידו את הצליל ברומאג׳י', prompt: `<div class="huge-kana" lang="ja">${item.k}</div>`,
      check: v => { const x = v.toLowerCase().replace(/\s/g, ''); return x === item.r || Kana.toHira(Kana.romajiToHira(x)) === Kana.toHira(item.k); }, reveal, sayAfter: item.k, after };
  });
  Quiz.run(root, { title: (set === 'kata' ? 'קטקנה' : 'הירגנה') + ' – ' + { rec: 'זיהוי', rev: 'הפוך', type: 'הקלדה', listen: 'שמיעה' }[mode], questions, back, retry, xpPer: 1 });
};

function kanaWordsQuiz(root, set, n, back, retry) {
  const re = set === 'kata' ? /^[ァ-ヺー]+$/ : /^[ぁ-ゖ]+$/;
  const words = shuffle(VOCAB.filter(w => re.test(w.jp) && w.jp.length >= 2)).slice(0, n);
  const pool = VOCAB.filter(w => re.test(w.jp));
  const questions = words.map((w, i) => {
    const reveal = QB.wordReveal(w);
    if (i % 2 === 0) return { type: 'mc', label: 'קראו את המילה – מה הפירוש?', prompt: `<div class="big-jp" lang="ja">${esc(w.jp)}</div>`,
      options: [QB.heOpt(w.he, 'ok'), ...QB.distractors(w, 3, 'he', pool).map(d => QB.heOpt(d.he, d.id))], answer: 'ok', reveal, sayAfter: w.jp };
    return { type: 'type', latin: true, label: 'הקלידו איך קוראים את המילה (ברומאג׳י)', prompt: `<div class="big-jp" lang="ja">${esc(w.jp)}</div>`,
      check: v => Kana.matches(v, [w.jp]) || v.toLowerCase().replace(/\s/g, '') === w.romaji.replace(/\s/g, ''), reveal, sayAfter: w.jp };
  });
  Quiz.run(root, { title: 'קריאת מילים ב' + (set === 'kata' ? 'קטקנה' : 'הירגנה'), questions, back, retry });
}
