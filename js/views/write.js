'use strict';
/* ===== Handwriting practice (katakana first, hiragana too) with stroke order checking =====
   Stroke data: KanjiVG (CC BY-SA 3.0). Coordinates live in a 109×109 box. */

const StrokeMath = {
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]),
  len(pts) { let l = 0; for (let i = 1; i < pts.length; i++) l += this.dist(pts[i - 1], pts[i]); return l; },
  resample(pts, n) {
    if (pts.length === 1) return Array(n).fill(pts[0]);
    const total = this.len(pts); if (!total) return Array(n).fill(pts[0]);
    const step = total / (n - 1), out = [pts[0]];
    let acc = 0, i = 1, prev = pts[0];
    while (out.length < n - 1 && i < pts.length) {
      const d = this.dist(prev, pts[i]);
      if (acc + d >= step) {
        const t = (step - acc) / d;
        const q = [prev[0] + t * (pts[i][0] - prev[0]), prev[1] + t * (pts[i][1] - prev[1])];
        out.push(q); prev = q; acc = 0;
      } else { acc += d; prev = pts[i]; i++; }
    }
    while (out.length < n) out.push(pts[pts.length - 1]);
    return out;
  },
  /** compare a drawn stroke to a template stroke (both arrays of [x,y] in 109-space) */
  compare(user, tmpl) {
    const N = tmpl.length, U = this.resample(user, N);
    const ulen = this.len(user), tlen = this.len(tmpl);
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const avg = mean(U.map((p, i) => this.dist(p, tmpl[i])));
    const cu = [mean(U.map(p => p[0])), mean(U.map(p => p[1]))], ct = [mean(tmpl.map(p => p[0])), mean(tmpl.map(p => p[1]))];
    const offset = this.dist(cu, ct);
    const shape = mean(U.map((p, i) => this.dist([p[0] - cu[0], p[1] - cu[1]], [tmpl[i][0] - ct[0], tmpl[i][1] - ct[1]])));
    const d0 = this.dist(U[0], tmpl[0]), d1 = this.dist(U[N - 1], tmpl[N - 1]);
    const r = this.dist(U[0], tmpl[N - 1]) + this.dist(U[N - 1], tmpl[0]);
    if (tlen < 18) { // tiny strokes: dots, dakuten marks
      const ok = offset < 15 && ulen < 40;
      return { ok, reason: ok ? '' : (ulen >= 40 ? 'long' : 'place'), avg: offset };
    }
    const lenOk = ulen > tlen * 0.35 && ulen < tlen * 2.6;
    // direction: the overall start→end vector must point the same way as the template's
    const tv = [tmpl[N - 1][0] - tmpl[0][0], tmpl[N - 1][1] - tmpl[0][1]], uv = [U[N - 1][0] - U[0][0], U[N - 1][1] - U[0][1]];
    const tvl = Math.hypot(...tv), uvl = Math.hypot(...uv);
    const reversedDir = tvl > 8 && uvl > 4 && (tv[0] * uv[0] + tv[1] * uv[1]) / (tvl * uvl) < -0.3;
    const ok = lenOk && !reversedDir && d0 < 24 && d1 < 26 && (avg < 14 || (shape < 9.5 && offset < 20));
    let reason = '';
    if (!ok) {
      if (reversedDir || (r + 8 < d0 + d1 && avg > 12)) reason = 'reversed';
      else if (ulen <= tlen * 0.35) reason = 'short';
      else if (ulen >= tlen * 2.6) reason = 'long';
      else if (shape < 10) reason = 'place';
      else reason = 'shape';
    }
    return { ok, reason, avg };
  }
};
const STROKE_MSG = {
  reversed: '↩️ הכיוון הפוך – התחילו מהצד השני',
  short: '📏 המשיכה קצרה מדי', long: '📏 המשיכה ארוכה מדי',
  place: '📍 הצורה נכונה, אבל המיקום לא – שימו לב איפה המשיכה מתחילה',
  shape: '✏️ זו לא המשיכה הבאה – בדקו את סדר המשיכות',
  order: '🔢 סדר המשיכות לא נכון – זו משיכה שבאה מאוחר יותר'
};

/** Builds a writing pad for one character. opt: {mode:'trace'|'guided'|'recall', onDone, onStroke} */
function makeWriter(host, ch, opt = {}) {
  const data = STROKES[ch];
  const N = data.p.length;
  const showTmpl = opt.mode === 'trace';
  host.innerHTML = `<svg class="wr-svg ${showTmpl ? 'show-tmpl' : ''}" viewBox="0 0 109 109" aria-label="משטח כתיבה">
    <g class="wr-grid"><rect x="1.5" y="1.5" width="106" height="106" rx="7"/><line x1="54.5" y1="4" x2="54.5" y2="105"/><line x1="4" y1="54.5" x2="105" y2="54.5"/></g>
    <g class="wr-tmpl">${data.p.map(d => `<path d="${d}"/>`).join('')}</g>
    <g class="wr-nums">${data.n.map(([x, y], i) => `<text x="${x}" y="${y}">${i + 1}</text>`).join('')}</g>
    <g class="wr-done"></g><g class="wr-hint"></g><g class="wr-bad"></g>
    <polyline class="wr-live" points=""/>
  </svg>`;
  const svg = host.firstElementChild;
  const tEls = [...svg.querySelectorAll('.wr-tmpl path')];
  const samples = tEls.map(p => { const L = p.getTotalLength(); return Array.from({ length: 32 }, (_, i) => { const q = p.getPointAtLength(L * i / 31); return [q.x, q.y]; }); });
  const live = svg.querySelector('.wr-live'), doneG = svg.querySelector('.wr-done'), hintG = svg.querySelector('.wr-hint'), badG = svg.querySelector('.wr-bad');
  let idx = 0, pts = null, mistakes = 0, here = 0, finished = false;
  const timers = [];
  const toBox = e => { const m = svg.getScreenCTM().inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [p.x, p.y]; };
  const ns = 'http://www.w3.org/2000/svg';
  const pathEl = (d, cls) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); return p; };

  function hint(i = idx, dur = 900) {
    if (i >= N) return;
    const p = pathEl(data.p[i], 'hint');
    const L = tEls[i].getTotalLength();
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    hintG.appendChild(p);
    requestAnimationFrame(() => { p.style.transition = `stroke-dashoffset ${dur}ms ease`; p.style.strokeDashoffset = 0; });
    timers.push(setTimeout(() => p.remove(), dur + 900));
  }
  function demo() {
    hintG.innerHTML = '';
    for (let i = 0; i < N; i++) timers.push(setTimeout(() => hint(i, 650), i * 800));
  }
  function update() { opt.onStroke && opt.onStroke({ idx, N, mistakes }); }
  function finishStroke() {
    if (!pts) return;
    const u = pts.length === 1 ? [pts[0], [pts[0][0] + 0.5, pts[0][1] + 0.5]] : pts;
    pts = null; live.setAttribute('points', '');
    const res = StrokeMath.compare(u, samples[idx]);
    // stroke order: reject when the line clearly fits a later stroke better than the expected one
    if (res.ok) {
      for (let j = idx + 1; j < N; j++) {
        const other = StrokeMath.compare(u, samples[j]);
        if (other.ok && other.avg < res.avg - 2.5) { res.ok = false; res.reason = 'order'; break; }
      }
    }
    if (res.ok) {
      doneG.appendChild(pathEl(data.p[idx], 'ink'));
      idx++; here = 0; SFX.play('tick');
      opt.onMsg && opt.onMsg('');
      update();
      if (idx >= N) { finished = true; svg.classList.add('complete'); opt.onDone && opt.onDone({ mistakes }); }
    } else {
      mistakes++; here++;
      const bad = document.createElementNS(ns, 'polyline');
      bad.setAttribute('points', u.map(p => p.join(',')).join(' ')); bad.setAttribute('class', 'bad');
      badG.appendChild(bad); timers.push(setTimeout(() => bad.remove(), 650));
      SFX.play('bad');
      opt.onMsg && opt.onMsg(STROKE_MSG[res.reason] || STROKE_MSG.shape);
      if (opt.mode !== 'recall' || here >= 2) hint(idx);
      update();
    }
  }
  svg.addEventListener('pointerdown', e => {
    if (finished) return;
    e.preventDefault(); svg.setPointerCapture(e.pointerId);
    pts = [toBox(e)]; live.setAttribute('points', pts[0].join(','));
  });
  svg.addEventListener('pointermove', e => {
    if (!pts) return;
    const q = toBox(e), last = pts[pts.length - 1];
    if (StrokeMath.dist(q, last) < 0.6) return;
    pts.push(q); live.setAttribute('points', pts.map(p => p.join(',')).join(' '));
  });
  ['pointerup', 'pointercancel'].forEach(t => svg.addEventListener(t, finishStroke));
  update();
  return {
    demo, hint: () => { mistakes++; hint(idx); update(); },
    undo() { if (idx > 0 && !finished) { idx--; doneG.lastElementChild && doneG.lastElementChild.remove(); update(); } },
    reset() { idx = 0; finished = false; doneG.innerHTML = ''; svg.classList.remove('complete'); update(); },
    stop() { timers.forEach(clearTimeout); },
    get mistakes() { return mistakes; }, N
  };
}

/* ---------- character sets ---------- */
const WriteSets = (() => {
  const conv = (set, h) => set === 'kata' ? Kana.toKata(h) : h;
  const rowsOf = (set, rows) => rows.flat().filter(Boolean).map(h => conv(set, h));
  return {
    rows(set) { return KANA.GOJUON.map(r => ({ head: conv(set, r[0]), chars: r.filter(Boolean).map(h => conv(set, h)) })); },
    group(set, g) {
      if (g === 'basic') return rowsOf(set, KANA.GOJUON);
      if (g === 'dakuten') return rowsOf(set, KANA.DAKUTEN);
      if (g === 'small') return set === 'kata' ? ['ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ッ', 'ャ', 'ュ', 'ョ', 'ー'] : ['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'っ', 'ゃ', 'ゅ', 'ょ'];
      if (g === 'confuse') return uniq(KANA.CONFUSE[set].flat());
      return [];
    },
    romaji(ch) { if (ch === 'ー') return 'ー (הארכה)'; const small = 'ァィゥェォッャュョぁぃぅぇぉっゃゅょ'.includes(ch); return (small ? 'קטנה: ' : '') + Kana.hiraToRomaji(Kana.toHira(ch)); },
    words(set) {
      const re = set === 'kata' ? /^[ァ-ーー]+$/ : /^[ぁ-ゖ]+$/;
      return VOCAB.filter(w => re.test(w.jp) && w.jp.length >= 2 && w.jp.length <= 6 && [...w.jp].every(c => STROKES[c]));
    }
  };
})();
const WGROUPS = { basic: 'בסיס (46)', dakuten: 'דאקוטן ゛゜', small: 'קטנות + ー', confuse: '🔀 מבלבלות' };
const WMODES = [
  ['trace', '✍️ עקיבה', 'האות מופיעה – עוקבים אחריה'], ['guided', '🧭 מודרך', 'רואים דוגמה בצד, כותבים לבד'], ['recall', '🧠 מהזיכרון', 'רק הצליל – כותבים מהזיכרון']
];
const WriteUI = { set: 'kata', mode: 'guided', groups: ['basic'], rows: [], n: 10 };

Views.write = (root, parts, params) => {
  const run = params.get('run'), single = params.get('ch');
  if (single && STROKES[single]) return writeSession(root, { chars: [single, single, single], modes: ['trace', 'guided', 'recall'], set: Kana.isKata(single) ? 'kata' : 'hira', title: `לומדים לכתוב ${single}` });
  if (run === 'words') return writeWords(root, params.get('set') || 'kata');
  if (run) {
    const o = WriteUI;
    let pool = [];
    o.groups.forEach(g => pool.push(...WriteSets.group(o.set, g)));
    if (o.rows.length && o.groups.includes('basic')) {
      const keep = WriteSets.rows(o.set).filter(r => o.rows.includes(r.head)).flatMap(r => r.chars);
      const basic = WriteSets.group(o.set, 'basic');
      pool = pool.filter(c => !basic.includes(c) || keep.includes(c));
    }
    pool = uniq(pool).filter(c => STROKES[c]);
    if (!pool.length) pool = WriteSets.group(o.set, 'basic');
    const weak = c => { const r = (Store.s.write || {})[c]; return r ? r.w - r.r : 1; };
    const chars = [];
    let base = shuffle(pool).sort((a, b) => weak(b) - weak(a) + (Math.random() - 0.5));
    while (chars.length < o.n) { chars.push(...base); base = shuffle(pool); }
    return writeSession(root, { chars: chars.slice(0, o.n), modes: Array(o.n).fill(o.mode), set: o.set, title: o.set === 'kata' ? 'כתיבת קטקנה' : 'כתיבת הירגנה' });
  }
  const o = WriteUI;
  const set = params.get('set') === 'hira' ? 'hira' : (params.get('set') === 'kata' ? 'kata' : o.set);
  o.set = set;
  const W = Store.s.write || {};
  const cell = c => { const r = W[c]; const cls = !r ? 'm0' : (r.r >= 2 && r.r > r.w ? 'm2' : r.w > r.r ? 'mbad' : 'm1'); return `<a class="kcell ${cls}" href="#/write?ch=${encodeURIComponent(c)}" lang="ja"><span class="kc-k">${c}</span><span class="kc-r" dir="ltr">${STROKES[c].p.length}✎</span></a>`; };
  root.innerHTML = `
  <h1 class="page-title">✍️ תרגול כתיבה</h1>
  <div class="tabs">
    <a class="tab ${set === 'kata' ? 'active' : ''}" href="#/write?set=kata"><span lang="ja">カタカナ</span> קטקנה</a>
    <a class="tab ${set === 'hira' ? 'active' : ''}" href="#/write?set=hira"><span lang="ja">ひらがな</span> הירגנה</a>
  </div>
  <p class="muted">כותבים עם העכבר, האצבע או עט. כל משיכה נבדקת מיד – גם הצורה, גם הכיוון וגם <b>סדר המשיכות</b>. משיכה נכונה "ננעלת" בדיו, ומשיכה שגויה מסומנת באדום עם רמז.</p>

  <section class="card practice-panel">
    <div class="card-h">🎯 אימון</div>
    <div class="mode-grid">${WMODES.map(([id, n, d]) => `<button class="mode ${o.mode === id ? 'active' : ''}" data-wmode="${id}"><b>${n}</b><small>${d}</small></button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">קבוצות:</span>${Object.entries(WGROUPS).map(([g, n]) => `<button class="chip ${o.groups.includes(g) ? 'on' : ''}" data-wgroup="${g}">${n}</button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">שורות:</span><button class="chip ${!o.rows.length ? 'on' : ''}" data-wrow="all">כולן</button>${WriteSets.rows(set).map(r => `<button class="chip ${o.rows.includes(r.head) ? 'on' : ''}" data-wrow="${r.head}" lang="ja">${r.head}</button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">אותיות:</span><select id="wn">${[5, 10, 15, 20].map(n => `<option ${o.n === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="row center gap wrap">
      <button class="btn primary lg" id="wstart">התחילו ▶</button>
      <a class="btn lg" href="#/write?run=words&set=${set}">📝 כתיבת מילים שלמות</a>
    </div>
  </section>

  <section class="card">
    <div class="card-h">📖 לחצו על אות כדי ללמוד אותה בשלושה שלבים (עקיבה ← מודרך ← מהזיכרון)</div>
    <div class="legend"><span><i class="m0"></i>עוד לא</span><span><i class="m1"></i>בתרגול</span><span><i class="mbad"></i>צריך חיזוק</span><span><i class="m2"></i>שולטים</span><span>✎ = מספר משיכות</span></div>
    <div class="card-sub">בסיס</div>
    <div class="kgrid" style="--cols:5">${KANA.GOJUON.map(r => r.map(h => h ? cell(set === 'kata' ? Kana.toKata(h) : h) : '<div class="kcell empty"></div>').join('')).join('')}</div>
    <div class="card-sub">דאקוטן</div>
    <div class="kgrid" style="--cols:5">${KANA.DAKUTEN.flat().map(h => cell(set === 'kata' ? Kana.toKata(h) : h)).join('')}</div>
    <div class="card-sub">אותיות קטנות${set === 'kata' ? ' וסימן ההארכה' : ''}</div>
    <div class="kgrid" style="--cols:5">${WriteSets.group(set, 'small').map(cell).join('')}</div>
    <p class="small muted">נתוני סדר המשיכות: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> (Ulrich Apel, CC BY-SA 3.0).</p>
  </section>`;
  const refresh = () => Views.write(root, parts, new URLSearchParams('set=' + set));
  $$('[data-wmode]', root).forEach(b => b.onclick = () => { o.mode = b.dataset.wmode; refresh(); });
  $$('[data-wgroup]', root).forEach(b => b.onclick = () => { const g = b.dataset.wgroup; o.groups = o.groups.includes(g) ? o.groups.filter(x => x !== g) : [...o.groups, g]; if (!o.groups.length) o.groups = [g]; refresh(); });
  $$('[data-wrow]', root).forEach(b => b.onclick = () => { const r = b.dataset.wrow; o.rows = r === 'all' ? [] : (o.rows.includes(r) ? o.rows.filter(x => x !== r) : [...o.rows, r]); refresh(); });
  $('#wn', root).onchange = e => { o.n = +e.target.value; };
  $('#wstart', root).onclick = () => { location.hash = `#/write?run=1&set=${set}&t=${Date.now()}`; };
};

function recordWrite(ch, mistakes) {
  const W = Store.s.write = Store.s.write || {};
  const r = W[ch] || { r: 0, w: 0 };
  if (mistakes === 0) r.r++; else r.w++;
  W[ch] = r;
  Store.s.stats.written = (Store.s.stats.written || 0) + 1;
  Store.save();
}

function writeSession(root, cfg) {
  let i = 0, totalMist = 0, perfect = 0, xp = 0, pad = null;
  const back = `#/write?set=${cfg.set}`;
  const draw = () => {
    if (pad) pad.stop();
    if (i >= cfg.chars.length) return finish();
    const ch = cfg.chars[i], mode = cfg.modes[i];
    const ro = WriteSets.romaji(ch);
    root.innerHTML = `
    <div class="quiz">
      <div class="quiz-top"><a class="btn ghost sm" href="${back}">✕</a>${UI.pbar(i / cfg.chars.length * 100)}<span class="quiz-count">${i + 1} / ${cfg.chars.length}</span></div>
      <div class="quiz-title">${esc(cfg.title)} · ${WMODES.find(m => m[0] === mode)[1]}</div>
      <div class="card wr-card">
        <div class="wr-prompt">
          <div><div class="wr-ro" dir="ltr">${esc(ro)}</div><div class="small muted">${{ trace: 'עקבו אחרי האות האפורה לפי המספרים', guided: 'כתבו את האות שבדוגמה', recall: 'כתבו את האות מהזיכרון' }[mode]}</div></div>
          ${mode === 'guided' ? `<div class="wr-model" lang="ja">${ch}</div>` : ''}
          <button class="say-btn big" data-say="${ch === 'ー' ? 'ー' : ch}">🔊</button>
        </div>
        <div class="wr-status"><span id="wst"></span></div>
        <div class="wr-box" id="wbox"></div>
        <div class="wr-msg" id="wmsg"></div>
        <div class="row center gap wrap">
          <button class="btn ghost sm" id="wundo">↶ ביטול משיכה</button>
          <button class="btn ghost sm" id="wreset">↺ מחדש</button>
          <button class="btn ghost sm" id="whint">💡 רמז</button>
          <button class="btn ghost sm" id="wdemo">▶ סדר המשיכות</button>
        </div>
      </div>
      <div class="quiz-actions"><button class="btn primary lg" id="wnext" hidden>הבא ←</button></div>
    </div>`;
    const st = $('#wst', root), msg = $('#wmsg', root);
    pad = makeWriter($('#wbox', root), ch, {
      mode,
      onStroke: ({ idx, N, mistakes }) => { st.innerHTML = `משיכה <b>${Math.min(idx + 1, N)}</b> מתוך ${N}${mistakes ? ` · <span class="bad-t">${mistakes} טעויות</span>` : ''}`; },
      onMsg: m => { msg.textContent = m; msg.className = 'wr-msg' + (m ? ' show' : ''); },
      onDone: ({ mistakes }) => {
        totalMist += mistakes; if (!mistakes) perfect++;
        const g = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1; xp += g; Prog.addXP(g); Prog.answer(mistakes === 0);
        recordWrite(ch, mistakes);
        msg.className = 'wr-msg show good';
        msg.innerHTML = mistakes === 0 ? `✓ מושלם! <span lang="ja">${ch}</span>` : `✓ סיימתם (${mistakes} טעויות) – <span lang="ja">${ch}</span>`;
        SFX.play('good'); TTS.speak(ch);
        $('#wnext', root).hidden = false; $('#wnext', root).focus();
      }
    });
    if (mode === 'trace') setTimeout(() => pad.demo(), 300);
    $('#wundo', root).onclick = () => pad.undo();
    $('#wreset', root).onclick = () => pad.reset();
    $('#whint', root).onclick = () => pad.hint();
    $('#wdemo', root).onclick = () => pad.demo();
    $('#wnext', root).onclick = () => { i++; draw(); };
    App.onKey = e => { if (e.key === 'Enter' && !$('#wnext', root).hidden) { e.preventDefault(); i++; draw(); } };
  };
  const finish = () => {
    App.onKey = null; SFX.play('done'); if (perfect >= cfg.chars.length * 0.7) UI.confetti(); Prog.checkAch();
    root.innerHTML = `<div class="card summary"><div class="big-emo">✍️</div><h2>${perfect === cfg.chars.length ? 'かんぺき！ כתב יד מושלם!' : 'よくできました！ כל הכבוד!'}</h2>
      <div class="sum-score"><b>${perfect}</b> / ${cfg.chars.length} בלי טעויות</div><div class="sum-xp">+${xp} XP</div>
      <div class="wr-recap" lang="ja">${uniq(cfg.chars).map(c => `<span>${c}</span>`).join('')}</div>
      <div class="row center gap"><button class="btn primary" id="wagain">🔄 עוד סבב</button><a class="btn ghost" href="${back}">חזרה</a></div></div>`;
    $('#wagain', root).onclick = () => writeSession(root, cfg);
  };
  draw();
}

function writeWords(root, set) {
  const words = sample(WriteSets.words(set), 6);
  let wi = 0, ci = 0, pad = null, xp = 0, clean = 0;
  const back = `#/write?set=${set}`;
  const draw = () => {
    if (pad) pad.stop();
    if (wi >= words.length) {
      App.onKey = null; SFX.play('done'); UI.confetti(); Prog.checkAch();
      root.innerHTML = `<div class="card summary"><div class="big-emo">📝</div><h2>すごい！ כתבתם ${words.length} מילים!</h2>
        <div class="sum-score"><b>${clean}</b> מילים בלי טעויות</div><div class="sum-xp">+${xp} XP</div>
        <div class="wr-recap" lang="ja">${words.map(w => `<span>${esc(w.jp)}</span>`).join('')}</div>
        <div class="row center gap"><button class="btn primary" id="wagain">🔄 מילים נוספות</button><a class="btn ghost" href="${back}">חזרה</a></div></div>`;
      $('#wagain', root).onclick = () => writeWords(root, set);
      return;
    }
    const w = words[wi], chars = [...w.jp], ch = chars[ci];
    root.innerHTML = `
    <div class="quiz">
      <div class="quiz-top"><a class="btn ghost sm" href="${back}">✕</a>${UI.pbar(wi / words.length * 100)}<span class="quiz-count">${wi + 1} / ${words.length}</span></div>
      <div class="quiz-title">📝 כתיבת מילים ${set === 'kata' ? 'בקטקנה' : 'בהירגנה'}</div>
      <div class="card wr-card">
        <div class="wr-word-q"><span class="emo">${w.emoji || ''}</span> <b>${esc(w.he)}</b> <span class="ro" dir="ltr">${esc(w.romaji)}</span> ${UI.sayBtn(w.jp)}</div>
        <div class="wr-word" dir="ltr" lang="ja">${chars.map((c, k) => `<span class="${k < ci ? 'done' : k === ci ? 'cur' : ''}">${k < ci ? c : k === ci ? '?' : '・'}</span>`).join('')}</div>
        <div class="wr-status">אות ${ci + 1} מתוך ${chars.length}: <b dir="ltr">${esc(WriteSets.romaji(ch))}</b> · <span id="wst"></span></div>
        <div class="wr-box" id="wbox"></div>
        <div class="wr-msg" id="wmsg"></div>
        <div class="row center gap wrap">
          <button class="btn ghost sm" id="wundo">↶ ביטול</button><button class="btn ghost sm" id="wreset">↺ מחדש</button>
          <button class="btn ghost sm" id="whint">💡 רמז</button><button class="btn ghost sm" id="wshow">👁️ הצג אות</button>
        </div>
      </div>
      <div class="quiz-actions"><button class="btn primary lg" id="wnext" hidden>הבא ←</button></div>
    </div>`;
    if (ci === 0) { w._m = 0; TTS.speak(w.jp); }
    const st = $('#wst', root), msg = $('#wmsg', root);
    pad = makeWriter($('#wbox', root), ch, {
      mode: 'recall',
      onStroke: ({ idx, N }) => { st.textContent = `משיכה ${Math.min(idx + 1, N)}/${N}`; },
      onMsg: m => { msg.textContent = m; msg.className = 'wr-msg' + (m ? ' show' : ''); },
      onDone: ({ mistakes }) => {
        w._m += mistakes; recordWrite(ch, mistakes);
        if (ci < chars.length - 1) { ci++; setTimeout(draw, 350); return; }
        const g = w._m === 0 ? 5 : 3; xp += g; Prog.addXP(g); if (!w._m) clean++;
        Prog.answer(w._m === 0);
        msg.className = 'wr-msg show good'; msg.innerHTML = `✓ <span lang="ja">${esc(w.jp)}</span> = ${esc(w.he)}`;
        $('.wr-word', root).innerHTML = chars.map(c => `<span class="done">${c}</span>`).join('');
        SFX.play('good'); TTS.speak(w.jp);
        $('#wnext', root).hidden = false; $('#wnext', root).focus();
      }
    });
    $('#wundo', root).onclick = () => pad.undo();
    $('#wreset', root).onclick = () => pad.reset();
    $('#whint', root).onclick = () => pad.hint();
    $('#wshow', root).onclick = () => { w._m += 2; pad.demo(); };
    $('#wnext', root).onclick = () => { wi++; ci = 0; draw(); };
    App.onKey = e => { if (e.key === 'Enter' && !$('#wnext', root).hidden) { e.preventDefault(); wi++; ci = 0; draw(); } };
  };
  if (!words.length) { root.innerHTML = '<p>אין מילים זמינות.</p>'; return; }
  draw();
}
