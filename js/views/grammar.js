'use strict';
/* ===== Grammar lessons, sentence builder, particle trainer ===== */

/** tokens -> markup string (particles bracketed, | between plain words) */
function tokensToJp(tokens) {
  let out = '';
  tokens.forEach((t, i) => {
    const isP = PARTICLES.includes(t);
    const prevP = i > 0 && PARTICLES.includes(tokens[i - 1]);
    if (i > 0 && !isP && !prevP) out += '|';
    out += isP ? `[${t}] ` : t;
  });
  return out.trim() + '。';
}
function orderDistractors(tokens, n = 2) {
  const has = t => tokens.includes(t);
  const conflict = { 'に': ['へ'], 'へ': ['に'], 'は': ['が', 'も'], 'が': ['は', 'も', 'を'], 'を': ['が', 'も'], 'も': ['は', 'が', 'を'], 'と': ['や'], 'や': ['と'] };
  const banned = new Set(tokens.flatMap(t => conflict[t] || []));
  const cands = CORE_P.filter(p => !has(p) && !banned.has(p));
  return sample(cands, tokens.length >= 4 ? n : 1);
}

function lessonQuestions(L) {
  return L.quiz.map(q => {
    if (q.t === 'fill') {
      const full = q.s.replace('＿', '[' + q.a + ']');
      return { type: 'mc', label: 'השלימו את החסר', prompt: `<div class="he-prompt">${esc(q.he)}</div><div class="big-jp" lang="ja">${UI.jpHTML(q.s)}</div>`,
        options: q.o.map(o => QB.jpOpt(o)), answer: q.a, optCls: 'jp-opts', reveal: QB.sentenceReveal(full, q.he), explain: q.ex ? UI.rich(esc(q.ex)) : '', sayAfter: full };
    }
    if (q.t === 'mc') return { type: 'mc', label: 'שאלה', prompt: `<div class="rich-q">${UI.rich(q.q)}</div>`, options: q.o.map((o, i) => ({ html: UI.rich(o.includes('{{') ? o : esc(o)), key: String(i) })),
      answer: String(q.a), noShuffle: q.o.length === 3 && /קבוצה/.test(q.q), explain: q.ex ? UI.rich(q.ex) : '', reveal: '' };
    if (q.t === 'order') {
      const jp = tokensToJp(q.w);
      return { type: 'order', label: 'סדרו את המשפט', prompt: `<div class="he-prompt">${esc(q.he)}</div>`, tokens: q.w, alts: q.alt, distractors: orderDistractors(q.w, 1),
        reveal: QB.sentenceReveal(jp, q.he), sayAfter: jp, explain: q.ex || '' };
    }
    if (q.t === 'type') return { type: 'type', label: 'כתבו ביפנית', prompt: `<div class="rich-q">${UI.rich(q.q)}</div>`, answers: q.a,
      reveal: `<div class="reveal-word">${UI.jp(q.a[0], 'big')} <span class="ro" dir="ltr">${esc(Kana.toRomaji(q.a[0]))}</span></div>`, sayAfter: q.a[0], explain: q.ex ? UI.rich(q.ex) : '' };
  });
}

Views.grammar = root => {
  const s = Store.s;
  const done = lessonsDone(s);
  root.innerHTML = `
  <h1 class="page-title">📖 דקדוק</h1>
  <p class="muted">${LESSONS.length} שיעורים קצרים ואינטראקטיביים. כל שיעור כולל הסבר, דוגמאות עם הקראה, ותרגול בסוף. השלמתם <b>${done}</b>.</p>
  ${UI.pbar(done / LESSONS.length * 100)}
  ${UNITS.map(u => {
    const ls = LESSONS.filter(l => l.unit === u.id);
    return `<section class="unit">
      <div class="unit-h"><span class="unit-i">${u.icon}</span><div><h2>${esc(u.name)}</h2><div class="small muted">${esc(u.desc)}</div></div></div>
      <div class="grid cols-2">${ls.map(l => { const r = s.lessons[l.id]; return `<a class="card lesson-card ${r && r.done ? 'done' : ''}" href="#/lesson/${l.id}">
        <div class="lc-i">${l.icon}</div><div class="lc-b"><div class="lc-t">${UI.rich(esc(l.title)).replace(/data-say="[^"]*"/g, '')}</div><div class="small muted">${esc(l.sum)}</div></div>
        <div class="lc-s">${r && r.done ? `<span class="badge green">✓ ${r.best}%</span>` : ''}</div></a>`; }).join('')}</div>
    </section>`;
  }).join('')}`;
};

Views.lesson = (root, parts) => {
  const L = LESSON_BY_ID[parts[0]];
  if (!L) { location.hash = '#/grammar'; return; }
  const idx = LESSONS.indexOf(L), prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const unit = UNITS.find(u => u.id === L.unit);
  const rec = Store.s.lessons[L.id];
  const exHTML = ex => `<div class="examples">${ex.map(([jp, he]) => `<div class="ex">
      <div class="ex-jp">${UI.jp(jp)} ${UI.sayBtn(jp)}</div>${/[぀-ヿ]/.test(jp) && !jp.includes('→') ? UI.ro(jp) : ''}<div class="ex-he">${esc(he)}</div></div>`).join('')}</div>`;
  const tableHTML = t => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${t.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${UI.rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const draw = () => {
    root.innerHTML = `
    <a class="back" href="#/grammar">→ כל השיעורים</a>
    <div class="lesson-head">
      <div class="lh-i">${L.icon}</div>
      <div><div class="small muted">${unit.icon} ${esc(unit.name)} · שיעור ${idx + 1}/${LESSONS.length}</div>
      <h1>${UI.rich(esc(L.title))}</h1>${rec && rec.done ? `<span class="badge green">✓ הושלם · ${rec.best}%</span>` : ''}</div>
    </div>
    <section class="card lesson-intro"><p>${UI.rich(L.intro)}</p></section>
    ${L.sections.map((sec, i) => `<section class="card lesson-sec">
      <h2><span class="sec-n">${i + 1}</span>${UI.rich(esc(sec.h))}</h2>
      ${sec.p ? `<div class="sec-p">${UI.rich(sec.p)}</div>` : ''}
      ${sec.table ? tableHTML(sec.table) : ''}
      ${sec.ex ? exHTML(sec.ex) : ''}
    </section>`).join('')}
    <section class="card lesson-cta">
      <div class="big-emo">🥋</div>
      <h2>בדקו את עצמכם</h2>
      <p class="muted">${L.quiz.length} שאלות. ציון 60% ומעלה משלים את השיעור.</p>
      <button class="btn primary lg" id="lstart">התחילו תרגול ▶</button>
    </section>
    <div class="row spread lesson-nav">
      ${prev ? `<a class="btn ghost" href="#/lesson/${prev.id}">→ ${UI.rich(esc(prev.title)).replace(/data-say="[^"]*"/g, '')}</a>` : '<span></span>'}
      ${next ? `<a class="btn ghost" href="#/lesson/${next.id}">${UI.rich(esc(next.title)).replace(/data-say="[^"]*"/g, '')} ←</a>` : '<span></span>'}
    </div>`;
    $('#lstart', root).onclick = startQuiz;
  };
  const startQuiz = () => {
    Quiz.run(root, {
      title: `${L.icon} ${L.title}`,
      questions: lessonQuestions(L),
      back: `#/lesson/${L.id}`,
      xpPer: 3,
      retry: startQuiz,
      extraBtn: next ? `<a class="btn" href="#/lesson/${next.id}">לשיעור הבא ←</a>` : '',
      onFinish: ({ pct }) => {
        const r = Store.s.lessons[L.id] || { done: false, best: 0 };
        const first = !r.done && pct >= 60;
        r.best = Math.max(r.best || 0, pct);
        if (pct >= 60) r.done = true;
        Store.s.lessons[L.id] = r; Store.save();
        if (first) { Prog.addXP(15); UI.toast(`📖 השיעור הושלם! +15 XP`, 'good'); }
        Prog.checkAch();
      }
    });
  };
  draw();
};

/* ---------- Sentence builder ---------- */
Views.builder = (root, parts, params) => {
  const lvl = params.get('lvl');
  if (lvl) {
    const pool = lvl === 'all' ? SENTENCES : SENTENCES.filter(s => String(s.lvl) === lvl);
    const chosen = sample(pool, Math.min(10, pool.length));
    Quiz.run(root, {
      title: '🧩 בונה משפטים',
      questions: chosen.map(s => {
        const jp = tokensToJp(s.w);
        return { type: 'order', label: 'סדרו את המילים למשפט', prompt: `<div class="he-prompt big">${esc(s.he)}</div>`, tokens: s.w, alts: s.alt,
          distractors: orderDistractors(s.w), reveal: QB.sentenceReveal(jp, s.he), sayAfter: jp };
      }),
      back: '#/builder', xpPer: 3,
      onAnswer: (q, ok) => { if (ok) { Store.s.stats.sentences++; Store.save(); } },
      retry: () => Views.builder(root, parts, params)
    });
    return;
  }
  root.innerHTML = `
  <h1 class="page-title">🧩 בונה משפטים</h1>
  <p class="muted">מקבלים משפט בעברית ומסדרים את המילים היפניות בסדר הנכון. שימו לב – לפעמים יש מילה מיותרת שלא שייכת! החלקיקים צבועים בכחול.</p>
  <div class="grid cols-2">
    ${SENT_LEVELS.map(l => `<a class="card action" href="#/builder?lvl=${l.lvl}"><div class="action-i">${l.icon}</div><div class="action-t">שלב ${l.lvl}: ${esc(l.name)}</div><div class="action-s">${esc(l.desc)} · ${SENTENCES.filter(s => s.lvl === l.lvl).length} משפטים</div></a>`).join('')}
    <a class="card action" href="#/builder?lvl=all"><div class="action-i">🎲</div><div class="action-t">ערבוב מכל השלבים</div><div class="action-s">10 משפטים אקראיים</div></a>
  </div>
  <section class="card"><div class="card-h">💡 טיפים</div><ul class="clean">
    <li>הפועל (או です) תמיד בסוף. סופי משפט כמו か / ね / よ באים אחריו.</li>
    <li>חלקיק בא <b>אחרי</b> המילה שהוא מסמן: {{わたし[は]}}, {{みず[を]}}.</li>
    <li>מקלדת: Enter לבדיקה, Backspace להסרת המילה האחרונה.</li>
  </ul></section>`;
  $$('.card', root).forEach(c => { c.innerHTML = c.innerHTML.replace(/\{\{(.+?)\}\}/g, (m, j) => UI.jp(j, 'inline')); });
};

/* ---------- Particle trainer ---------- */
function particleQuestion(d) {
  const isEnd = ENDERS.includes(d.a) || ['よね', 'かな'].includes(d.a);
  const pool = isEnd ? ['か', 'ね', 'よ', 'の', 'な'] : ['は', 'が', 'を', 'に', 'で', 'の', 'も', 'と', 'へ', 'から', 'まで'];
  const bad = new Set([d.a, ...(d.ok || [])]);
  const opts = [d.a, ...sample(pool.filter(p => !bad.has(p)), 3)];
  const full = d.s.replace('＿', '[' + d.a + ']');
  return { type: 'mc', label: 'איזה חלקיק חסר?', prompt: `<div class="he-prompt">${esc(d.he)}</div><div class="big-jp" lang="ja">${UI.jpHTML(d.s)}</div>`,
    options: opts.map(o => QB.jpOpt(o)), answer: d.a, optCls: 'jp-opts particle-opts', reveal: QB.sentenceReveal(full, d.he) + (d.ok ? `<div class="small muted">גם ${d.ok.join(' / ')} אפשרי כאן.</div>` : ''),
    explain: d.ex ? UI.rich(esc(d.ex)) : '', sayAfter: full };
}
function pdrillPool(f) {
  if (!f || f === 'all') return PDRILL;
  if (f === 'end') return PDRILL.filter(d => ENDERS.includes(d.a));
  if (f === 'other') return PDRILL.filter(d => ['と', 'も', 'へ', 'から', 'まで', 'や', 'より'].includes(d.a));
  return PDRILL.filter(d => d.a === f);
}
Views.particles = (root, parts, params) => {
  const f = params.get('f');
  if (f) {
    const pool = pdrillPool(f);
    Quiz.run(root, {
      title: '🎯 מאמן חלקיקים',
      questions: sample(pool, Math.min(15, pool.length)).map(particleQuestion),
      back: '#/particles', onAnswer: (q, ok) => { if (ok) { Store.s.stats.particles++; Store.save(); } },
      retry: () => Views.particles(root, parts, params)
    });
    return;
  }
  const P = [['は', 'נושא'], ['が', 'סובייקט / מידע חדש'], ['を', 'מושא ישיר'], ['に', 'זמן, יעד, קיום, נמען'], ['で', 'מקום פעולה, אמצעי'], ['へ', 'כיוון'], ['と', 'עם / ו-'], ['も', 'גם'], ['の', 'של'], ['から', 'מ-'], ['まで', 'עד'], ['や', 'ו- (חלקי)']];
  root.innerHTML = `
  <h1 class="page-title">🎯 מאמן חלקיקים</h1>
  <p class="muted">${PDRILL.length} משפטים עם חלקיק חסר. בחרו נושא או תרגלו הכול. ההסבר מופיע אחרי כל תשובה.</p>
  <div class="pgrid">${P.map(([p, d]) => `<div class="pcell"><div class="pc-p jp say" data-say="${p}" lang="ja">${p}</div><div class="small">${d}</div></div>`).join('')}</div>
  <section class="card"><div class="card-h">בחרו תרגול</div>
    <div class="chips">${PDRILL_FILTERS.map(x => `<a class="chip big" href="#/particles?f=${encodeURIComponent(x.id)}"><span lang="ja">${esc(x.name)}</span> <small>(${pdrillPool(x.id).length})</small></a>`).join('')}</div>
  </section>
  <div class="row gap"><a class="btn" href="#/lesson/p1">📖 לשיעורי החלקיקים</a><a class="btn" href="#/cheat">📋 טבלת חלקיקים</a><a class="btn" href="#/game/rush">⏱️ מירוץ חלקיקים (משחק)</a></div>`;
};
