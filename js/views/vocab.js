'use strict';
/* ===== Vocabulary, flashcards (SRS), vocab quizzes ===== */
const catStats = cat => {
  const items = cat.items;
  const known = items.filter(w => SRS.status(w.id) === 'known').length;
  const learning = items.filter(w => SRS.status(w.id) === 'learning').length;
  return { known, learning, total: items.length, pct: known / items.length * 100 };
};
const STATUS_BADGE = { new: '<span class="badge">חדש</span>', learning: '<span class="badge blue">בלמידה</span>', known: '<span class="badge green">יודע ✓</span>' };

function wordRow(w) {
  const s = Store.s.settings;
  return `<div class="word-row clickable" data-word="${esc(w.id)}" title="לחצו להסבר ודוגמאות במשפט">
    <div class="wr-emo">${w.emoji || ''}</div>
    <div class="wr-jp"><span class="jp" lang="ja">${esc(w.jp)}</span>${w.kanji && s.kanji ? `<span class="kanji-sm" lang="ja">${esc(w.kanji)}</span>` : ''}${s.romaji ? `<div class="ro" dir="ltr">${esc(w.romaji)}</div>` : ''}</div>
    <div class="wr-he">${esc(w.he)}${w.g ? ` <span class="badge ${w.g}">${{ u: 'פועל う', ru: 'פועל る', irr: 'חריג' }[w.g]}</span>` : ''}</div>
    <div class="wr-st">${STATUS_BADGE[SRS.status(w.id)]}</div>
    <div class="wr-act">${UI.sayBtn(w.jp)}<span class="wr-more" aria-hidden="true">📖</span></div>
  </div>`;
}

function catCard(c) {
  const st = catStats(c);
  return `<a class="card cat ${c.genki ? 'genki' : ''}" href="#/vocab/${c.id}">
    <div class="cat-i" lang="ja">${c.icon}</div><div class="cat-body"><div class="cat-n">${esc(c.name)}</div>
    <div class="small muted">${st.total} מילים · ${st.known} נלמדו</div>${UI.pbar(st.pct, 'thin')}</div></a>`;
}
Views.vocab = (root, parts, params) => {
  const catId = parts[0];
  if (catId) return vocabCategory(root, catId);
  const total = VOCAB.length, known = SRS.learnedCount();
  root.innerHTML = `
  <h1 class="page-title">📚 אוצר מילים</h1>
  <p class="muted">${total} מילים ב-${VOCAB_CATS.length} קטגוריות. למדתם <b>${known}</b>. בחרו קטגוריה כדי לראות את המילים ולתרגל.</p>
  <div class="search-box"><input id="vsearch" placeholder="🔍 חיפוש מילה (עברית / קאנה / רומאג׳י)…" autocomplete="off"></div>
  <div id="vresults"></div>
  <div id="vcats">
    <h2 class="sec-title">📘 לפי הספר: Genki I (מהדורה 3)</h2>
    <div class="grid cols-3 cats">${VOCAB_CATS.filter(c => c.genki).map(catCard).join('')}</div>
    <h2 class="sec-title">🗂️ לפי נושא</h2>
    <div class="grid cols-3 cats">${VOCAB_CATS.filter(c => !c.genki).map(catCard).join('')}</div>
  </div>
  <section class="card">
    <div class="card-h">🎲 תרגול מכל המילים</div>
    <div class="row gap wrap">
      <a class="btn" href="#/quiz/all?mode=jp2he">יפנית → עברית</a><a class="btn" href="#/quiz/all?mode=he2jp">עברית → יפנית</a>
      <a class="btn" href="#/quiz/all?mode=listen">🎧 האזנה</a><a class="btn" href="#/quiz/all?mode=type">⌨️ הקלדה</a><a class="btn" href="#/quiz/all?mode=context">🧩 מילה בהקשר</a><a class="btn" href="#/quiz/all?mode=mix">🔀 מעורב</a>
    </div>
  </section>`;
  const inp = $('#vsearch', root), res = $('#vresults', root);
  inp.oninput = () => {
    const q = inp.value.trim().toLowerCase();
    if (!q) { res.innerHTML = ''; $('#vcats').hidden = false; return; }
    const qh = Kana.toHira(Kana.romajiToHira(q));
    const hits = VOCAB.filter(w => w.he.includes(q) || w.jp.includes(q) || Kana.toHira(w.jp).includes(qh) || w.romaji.includes(q) || (w.kanji && w.kanji.includes(q))).slice(0, 40);
    $('#vcats').hidden = true;
    res.innerHTML = `<div class="card word-list" data-ids="${hits.map(w => w.id).join(',')}">${hits.length ? hits.map(wordRow).join('') : '<p class="muted">לא נמצאו מילים.</p>'}</div>`;
  };
};

function vocabCategory(root, catId) {
  const cat = VOCAB_CATS.find(c => c.id === catId);
  if (!cat) { location.hash = '#/vocab'; return; }
  const st = catStats(cat);
  root.innerHTML = `
  <a class="back" href="#/vocab">→ כל הקטגוריות</a>
  <h1 class="page-title"><span lang="ja">${cat.icon}</span> ${esc(cat.name)}</h1>
  <p class="muted">${st.total} מילים · ${st.known} נלמדו · ${st.learning} בלמידה</p>
  <div class="grid cols-3 practice-btns">
    <a class="card action sm" href="#/cards/${cat.id}"><div class="action-i">🃏</div><div class="action-t">כרטיסיות</div></a>
    <a class="card action sm" href="#/quiz/${cat.id}?mode=jp2he"><div class="action-i">🇯🇵→🇮🇱</div><div class="action-t">יפנית → עברית</div></a>
    <a class="card action sm" href="#/quiz/${cat.id}?mode=he2jp"><div class="action-i">🇮🇱→🇯🇵</div><div class="action-t">עברית → יפנית</div></a>
    <a class="card action sm" href="#/quiz/${cat.id}?mode=listen"><div class="action-i">🎧</div><div class="action-t">האזנה</div></a>
    <a class="card action sm" href="#/quiz/${cat.id}?mode=type"><div class="action-i">⌨️</div><div class="action-t">הקלדה</div></a>
    <a class="card action sm" href="#/quiz/${cat.id}?mode=context"><div class="action-i">🧩</div><div class="action-t">מילה בהקשר</div></a>
    <a class="card action sm" href="#/game/match?cat=${cat.id}"><div class="action-i">🔗</div><div class="action-t">משחק התאמה</div></a>
  </div>
  ${cat.id === 'verbs' ? '<div class="banner">💡 רוצים לראות את כל ההטיות של פועל? <a href="#/verbs">לטבלת ההטיות ←</a></div>' : ''}
  ${cat.type === 'i-adj' || cat.type === 'na-adj' ? '<div class="banner">💡 הטיות שמות תואר (שלילה, עבר) – <a href="#/verbs?tab=adj">בעמוד ההטיות ←</a></div>' : ''}
  <div class="row gap"><button class="btn ghost sm" id="playall">▶ השמעת כל המילים</button></div>
  <p class="muted small">💡 לחצו על מילה כדי לראות הסבר על השימוש בה ודוגמאות במשפט, עם תרגום והקראה.</p>
  <div class="card word-list" data-ids="${cat.items.map(w => w.id).join(',')}">${cat.items.map(wordRow).join('')}</div>`;
  $('#playall', root).onclick = () => {
    let i = 0; const rows = $$('.word-row', root);
    const step = () => { if (i >= cat.items.length || !document.body.contains(root.firstChild)) return; rows.forEach(r => r.classList.remove('playing')); rows[i].classList.add('playing'); rows[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); TTS.speak(cat.items[i].jp); i++; App.after(step, 1700); };
    step();
  };
}

/* ---------- Vocab quiz ---------- */
Views.quiz = (root, parts, params) => {
  const catId = parts[0] || 'all';
  const mode = params.get('mode') || 'mix';
  const cat = VOCAB_CATS.find(c => c.id === catId);
  let pool = cat ? cat.items : VOCAB.filter(w => SRS.status(w.id) !== 'new');
  if (!cat && pool.length < 12) pool = VOCAB.filter(w => NEW_WORD_ORDER.slice(0, 4).includes(w.cat));
  const words = sample(pool, Math.min(15, pool.length));
  const names = { jp2he: 'יפנית → עברית', he2jp: 'עברית → יפנית', listen: 'האזנה', type: 'הקלדה', context: 'מילה בהקשר', mix: 'מעורב' };
  Quiz.run(root, {
    title: `${cat ? cat.name : 'כל המילים'} · ${names[mode] || ''}`,
    questions: words.map(w => QB.vocab(w, mode)),
    back: cat ? `#/vocab/${cat.id}` : '#/vocab',
    retry: () => Views.quiz(root, parts, params)
  });
};

/* ---------- Flashcards ---------- */
Views.review = root => {
  const s = Store.s;
  if (s.newToday.date !== todayStr()) s.newToday = { date: todayStr(), n: 0 };
  const due = shuffle(SRS.dueIds());
  const newLeft = Math.max(0, s.settings.newPerDay - s.newToday.n);
  const newWords = [];
  for (const c of NEW_WORD_ORDER) {
    for (const w of VOCAB_CATS.find(x => x.id === c).items) { if (newWords.length >= newLeft) break; if (!s.srs[w.id] && !newWords.includes(w.id)) newWords.push(w.id); }
    if (newWords.length >= newLeft) break;
  }
  const upcoming = Object.values(s.srs).filter(c => c.due > Date.now()).sort((a, b) => a.due - b.due)[0];
  if (!due.length && !newWords.length) {
    root.innerHTML = `<div class="card empty-state"><div class="big-emo">🎉</div><h2>אין כרטיסים לחזרה כרגע!</h2>
      <p class="muted">${upcoming ? `החזרה הבאה בעוד ${fmtDur(upcoming.due - Date.now())}.` : ''} הגעתם למכסת המילים החדשות של היום (${s.settings.newPerDay}).</p>
      <div class="row center gap"><a class="btn primary" href="#/vocab">ללמוד קטגוריה ספציפית</a><a class="btn" href="#/mix">אימון מהיר מעורב</a><a class="btn ghost" href="#/progress">שינוי מכסה יומית</a></div></div>`;
    return;
  }
  root.innerHTML = `
  <h1 class="page-title">🔁 חזרה יומית</h1>
  <div class="grid cols-3 tiles">
    <div class="card tile"><div class="tile-v">${due.length}</div><div class="tile-l">לחזרה</div></div>
    <div class="card tile"><div class="tile-v">${newWords.length}</div><div class="tile-l">מילים חדשות</div></div>
    <div class="card tile"><div class="tile-v">${SRS.learnedCount()}</div><div class="tile-l">נלמדו עד היום</div></div>
  </div>
  <section class="card">
    <p>החזרה המרווחת מציגה כל מילה בדיוק כשאתם עומדים לשכוח אותה. דרגו כל כרטיס בכנות – כך המערכת לומדת מה קשה לכם.</p>
    <div class="row gap wrap">
      <button class="btn primary lg" id="go-jp">התחלה: יפנית → עברית</button>
      <button class="btn lg" id="go-he">עברית → יפנית</button>
    </div>
  </section>`;
  const start = dir => runCards(root, [...due, ...newWords], { dir, back: '#/review', isReview: true });
  $('#go-jp', root).onclick = () => start('jp');
  $('#go-he', root).onclick = () => start('he');
};

Views.cards = (root, parts) => {
  const cat = VOCAB_CATS.find(c => c.id === parts[0]);
  if (!cat) { location.hash = '#/review'; return; }
  // unseen first, then due, then rest
  const items = cat.items.map(w => w.id);
  const order = [...items.filter(id => !Store.s.srs[id]), ...shuffle(items.filter(id => SRS.isDue(id))), ...shuffle(items.filter(id => Store.s.srs[id] && !SRS.isDue(id)))];
  root.innerHTML = `<a class="back" href="#/vocab/${cat.id}">→ ${esc(cat.name)}</a>
   <section class="card center-text"><h2>🃏 כרטיסיות: ${esc(cat.name)}</h2><p class="muted">${items.length} כרטיסים</p>
   <div class="row center gap"><button class="btn primary lg" id="go-jp">יפנית → עברית</button><button class="btn lg" id="go-he">עברית → יפנית</button></div></section>`;
  $('#go-jp', root).onclick = () => runCards(root, order.slice(0, 20), { dir: 'jp', back: `#/vocab/${cat.id}` });
  $('#go-he', root).onclick = () => runCards(root, order.slice(0, 20), { dir: 'he', back: `#/vocab/${cat.id}` });
};

function runCards(root, ids, cfg) {
  const queue = [...ids];
  let flipped = false, done = 0, xp = 0, again = 0;
  const total = ids.length;
  const draw = () => {
    if (!queue.length) return finish();
    const w = VOCAB_BY_ID[queue[0]]; flipped = false;
    const isNew = !Store.s.srs[w.id];
    const s = Store.s.settings;
    const front = cfg.dir === 'jp'
      ? `<div class="fc-jp ${w.jp.length > 6 ? 'long' : ''}" lang="ja">${esc(w.jp)}</div>${w.kanji && s.kanji ? `<div class="kanji-sm" lang="ja">${esc(w.kanji)}</div>` : ''}`
      : `<div class="fc-he">${esc(w.he)}</div>`;
    const back = `<div class="fc-emo">${w.emoji || ''}</div><div class="fc-jp ${w.jp.length > 6 ? 'long' : ''}" lang="ja">${esc(w.jp)}</div>
      ${w.kanji && s.kanji ? `<div class="kanji-sm" lang="ja">${esc(w.kanji)}</div>` : ''}<div class="ro" dir="ltr">${esc(w.romaji)}</div><div class="fc-he">${esc(w.he)}</div>
      ${w.g ? `<span class="badge ${w.g}">${{ u: 'פועל う', ru: 'פועל る', irr: 'חריג' }[w.g]}</span>` : ''}`;
    root.innerHTML = `
    <div class="quiz">
      <div class="quiz-top"><a class="btn ghost sm" href="${cfg.back}">✕</a>${UI.pbar(done / (total + again) * 100)}<span class="quiz-count">${queue.length} נותרו</span></div>
      <div class="flash-wrap">
        <div class="flash" id="flash" tabindex="0">
          <div class="flash-face front">${isNew ? '<span class="badge gold fc-new">✨ מילה חדשה</span>' : ''}${front}<div class="fc-hint">לחצו כדי להפוך (רווח)</div></div>
          <div class="flash-face back">${back}</div>
        </div>
      </div>
      <div class="row center"><button class="say-btn big" data-say="${esc(w.jp)}">🔊</button></div>
      <div id="fc-ex" hidden>${WordCard.firstExample(w)}</div>
      <div class="grade" id="grade" hidden>
        ${[['again', 0, 'שוב', 'bad'], ['hard', 1, 'קשה', 'warn'], ['good', 2, 'טוב', 'good'], ['easy', 3, 'קל', 'blue']].map(([k, q, n, c], i) =>
          `<button class="gbtn ${c}" data-q="${q}"><b>${n}</b><small>${SRS.preview(w.id, q)}</small><span class="opt-n">${i + 1}</span></button>`).join('')}
      </div>
    </div>`;
    if (cfg.dir === 'jp' && s.autoplay) TTS.speak(w.jp);
    const flip = () => {
      if (flipped) return; flipped = true;
      $('#flash', root).classList.add('flipped'); $('#grade', root).hidden = false; SFX.play('flip');
      if (cfg.dir === 'he' && s.autoplay) TTS.speak(w.jp);
      const fx = $('#fc-ex', root); if (fx) fx.hidden = false;
    };
    $('#flash', root).onclick = flip;
    const grade = q => {
      if (!flipped) return;
      if (isNew && cfg.isReview) { Store.s.newToday.n++; }
      SRS.grade(w.id, q);
      Store.s.stats.cards++;
      queue.shift();
      if (q === 0) { queue.splice(Math.min(queue.length, 3), 0, w.id); again++; }
      else { done++; const g = q === 1 ? 1 : 2; Prog.addXP(g); xp += g; }
      Store.save();
      draw();
    };
    $$('.gbtn', root).forEach(b => b.onclick = () => grade(parseInt(b.dataset.q, 10)));
    App.onKey = e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!flipped) flip(); else grade(2); }
      const n = parseInt(e.key, 10); if (flipped && n >= 1 && n <= 4) grade(n - 1);
    };
  };
  const finish = () => {
    App.onKey = null; SFX.play('done'); UI.confetti(); Prog.checkAch();
    root.innerHTML = `<div class="card summary"><div class="big-emo">🎴</div><h2>おつかれさま！ כל הכבוד!</h2>
      <div class="sum-score"><b>${total}</b> כרטיסים</div><div class="sum-xp">+${xp} XP</div>
      <div class="row center gap"><a class="btn primary" href="${cfg.back}">חזרה</a><a class="btn" href="#/mix">אימון מעורב</a></div></div>`;
    App.renderNav('review');
  };
  draw();
}
