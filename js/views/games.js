'use strict';
/* ===== Games: match, memory, kana sprint, particle rush; mixed daily quiz ===== */
function catSelect(cur) {
  return `<select id="gcat"><option value="mix" ${cur === 'mix' ? 'selected' : ''}>🎲 מילים שלמדתי / מעורב</option>${VOCAB_CATS.map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`;
}
function gamePool(cat) {
  const c = VOCAB_CATS.find(x => x.id === cat);
  if (c) return c.items;
  const seen = VOCAB.filter(w => SRS.status(w.id) !== 'new');
  return seen.length >= 16 ? seen : VOCAB.filter(w => NEW_WORD_ORDER.slice(0, 4).includes(w.cat));
}
function uniqBy(arr, f) { const s = new Set(); return arr.filter(x => { const k = f(x); if (s.has(k)) return false; s.add(k); return true; }); }

Views.games = root => {
  const st = Store.s.stats;
  root.innerHTML = `
  <h1 class="page-title">🎮 משחקים</h1>
  <p class="muted">לומדים תוך כדי משחק. כל משחק נותן XP.</p>
  <div class="grid cols-2">
    <a class="card game-card" href="#/game/match"><div class="gc-i">🔗</div><div><div class="action-t">התאמה</div><div class="action-s">חברו כל מילה יפנית לפירוש שלה, מהר ככל האפשר.</div></div></a>
    <a class="card game-card" href="#/game/memory"><div class="gc-i">🃏</div><div><div class="action-t">משחק זיכרון</div><div class="action-s">הפכו קלפים ומצאו זוגות של יפנית ועברית.</div></div></a>
    <a class="card game-card" href="#/game/sprint"><div class="gc-i">⚡</div><div><div class="action-t">ספרינט קאנה</div><div class="action-s">כמה אותיות תקלידו ב-60 שניות? <span class="badge gold">שיא: ${st.bestSprint || 0}</span></div></div></a>
    <a class="card game-card" href="#/game/rush"><div class="gc-i">⏱️</div><div><div class="action-t">מירוץ חלקיקים</div><div class="action-s">60 שניות של חלקיקים, עם בונוס רצף. <span class="badge gold">שיא: ${st.bestRush || 0}</span></div></div></a>
    <a class="card game-card" href="#/mix"><div class="gc-i">🌀</div><div><div class="action-t">אימון מעורב</div><div class="action-s">12 שאלות מכל הנושאים: מילים, חלקיקים, הטיות ומשפטים.</div></div></a>
    <a class="card game-card" href="#/quiz/all?mode=listen"><div class="gc-i">🎧</div><div><div class="action-t">אתגר האזנה</div><div class="action-s">שומעים מילה ובוחרים את הפירוש.</div></div></a>
  </div>`;
};

Views.game = (root, parts, params) => {
  const g = parts[0];
  ({ match: gameMatch, memory: gameMemory, sprint: gameSprint, rush: gameRush }[g] || (() => { location.hash = '#/games'; }))(root, params);
};

/* ---------- Match ---------- */
function gameMatch(root, params) {
  const cat = params.get('cat') || 'mix';
  const pool = uniqBy(uniqBy(gamePool(cat), w => w.he), w => w.jp);
  const ROUNDS = 3, PAIRS = 6;
  let round = 0, mistakes = 0, matched = 0, t0 = Date.now(), sel = null;
  const total = Math.min(ROUNDS * PAIRS, pool.length - (pool.length % PAIRS || 0) || pool.length);
  const words = sample(pool, Math.min(ROUNDS * PAIRS, pool.length));
  const rounds = []; for (let i = 0; i < words.length; i += PAIRS) rounds.push(words.slice(i, i + PAIRS));
  const head = () => `<div class="game-top"><a class="btn ghost sm" href="#/games">✕</a><span>סבב ${round + 1}/${rounds.length}</span><span>❌ ${mistakes}</span><span id="gtime">⏱️ 0</span>${catSelect(cat)}</div>`;
  const draw = () => {
    if (round >= rounds.length) return finish();
    const rw = rounds[round];
    root.innerHTML = `${head()}
    <div class="match-board">
      <div class="match-col">${shuffle(rw).map(w => `<button class="mtile jp-t" data-id="${w.id}" data-side="jp" lang="ja">${esc(w.jp)}</button>`).join('')}</div>
      <div class="match-col">${shuffle(rw).map(w => `<button class="mtile" data-id="${w.id}" data-side="he">${w.emoji ? w.emoji + ' ' : ''}${esc(w.he)}</button>`).join('')}</div>
    </div>`;
    $('#gcat', root).onchange = e => location.hash = `#/game/match?cat=${e.target.value}`;
    let left = rw.length;
    $$('.mtile', root).forEach(b => b.onclick = () => {
      if (b.classList.contains('done')) return;
      if (b.dataset.side === 'jp') TTS.speak(VOCAB_BY_ID[b.dataset.id].jp);
      if (!sel || sel.dataset.side === b.dataset.side) { $$('.mtile.sel', root).forEach(x => x.classList.remove('sel')); sel = b; b.classList.add('sel'); return; }
      if (sel.dataset.id === b.dataset.id) {
        [sel, b].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); });
        SFX.play('good'); matched++; left--; SRS.quiz(b.dataset.id, true);
        sel = null;
        if (!left) { round++; App.after(draw, 500); }
      } else {
        const a = sel; [a, b].forEach(x => x.classList.add('wrong')); SFX.play('bad'); mistakes++;
        setTimeout(() => [a, b].forEach(x => x.classList.remove('wrong', 'sel')), 450); sel = null;
      }
    });
  };
  const finish = () => {
    const secs = Math.round((Date.now() - t0) / 1000);
    const xp = Math.max(5, matched * 2 - mistakes);
    Prog.addXP(xp); Store.s.stats.games++; Store.save(); SFX.play('done'); if (mistakes <= 2) UI.confetti();
    root.innerHTML = `<div class="card summary"><div class="big-emo">🔗</div><h2>${mistakes === 0 ? 'かんぺき！ בלי טעויות!' : 'よくできました！ כל הכבוד!'}</h2>
      <div class="sum-score">${matched} זוגות · ${secs} שניות · ${mistakes} טעויות</div><div class="sum-xp">+${xp} XP</div>
      <div class="row center gap"><button class="btn primary" id="again">🔄 שוב</button><a class="btn ghost" href="#/games">למשחקים</a></div></div>`;
    $('#again', root).onclick = () => gameMatch(root, params);
  };
  App.every(() => { const e = $('#gtime'); if (e) e.textContent = '⏱️ ' + Math.round((Date.now() - t0) / 1000); }, 1000);
  draw();
}

/* ---------- Memory ---------- */
function gameMemory(root, params) {
  const cat = params.get('cat') || 'mix';
  const pool = uniqBy(uniqBy(gamePool(cat), w => w.he), w => w.jp);
  const words = sample(pool, Math.min(8, pool.length));
  const cards = shuffle(words.flatMap(w => [{ id: w.id, side: 'jp', w }, { id: w.id, side: 'he', w }]));
  let open = [], moves = 0, found = 0, lock = false;
  const t0 = Date.now();
  root.innerHTML = `<div class="game-top"><a class="btn ghost sm" href="#/games">✕</a><span id="mmoves">מהלכים: 0</span><span id="mfound">זוגות: 0/${words.length}</span>${catSelect(cat)}</div>
  <div class="mem-grid">${cards.map((c, i) => `<button class="mem" data-i="${i}"><div class="mem-in"><div class="mem-f mem-back">？</div>
    <div class="mem-f mem-front ${c.side}">${c.side === 'jp' ? `<span lang="ja">${esc(c.w.jp)}</span>` : `${c.w.emoji ? `<span class="emo">${c.w.emoji}</span>` : ''}<span>${esc(c.w.he)}</span>`}</div></div></button>`).join('')}</div>`;
  $('#gcat', root).onchange = e => location.hash = `#/game/memory?cat=${e.target.value}`;
  $$('.mem', root).forEach(b => b.onclick = () => {
    if (lock || b.classList.contains('up')) return;
    const c = cards[+b.dataset.i];
    b.classList.add('up'); SFX.play('flip');
    if (c.side === 'jp') TTS.speak(c.w.jp);
    open.push(b);
    if (open.length < 2) return;
    moves++; $('#mmoves').textContent = 'מהלכים: ' + moves;
    const [a, d] = open.map(x => cards[+x.dataset.i]);
    if (a.id === d.id) {
      open.forEach(x => x.classList.add('done')); open = []; found++; SFX.play('good');
      $('#mfound').textContent = `זוגות: ${found}/${words.length}`;
      if (found === words.length) setTimeout(finish, 600);
    } else {
      lock = true; setTimeout(() => { open.forEach(x => x.classList.remove('up')); open = []; lock = false; }, 900);
    }
  });
  const finish = () => {
    const xp = Math.max(5, 30 - Math.max(0, moves - words.length) * 2);
    Prog.addXP(xp); Store.s.stats.games++; Store.save(); SFX.play('done'); UI.confetti();
    root.innerHTML = `<div class="card summary"><div class="big-emo">🃏</div><h2>すごい！ מצאתם את כל הזוגות!</h2>
      <div class="sum-score">${moves} מהלכים · ${Math.round((Date.now() - t0) / 1000)} שניות</div><div class="sum-xp">+${xp} XP</div>
      <div class="row center gap"><button class="btn primary" id="again">🔄 שוב</button><a class="btn ghost" href="#/games">למשחקים</a></div></div>`;
    $('#again', root).onclick = () => gameMemory(root, params);
  };
}

/* ---------- Kana sprint ---------- */
function gameSprint(root, params) {
  const set = params.get('set') || '';
  if (!set) {
    root.innerHTML = `<a class="back" href="#/games">→ משחקים</a><section class="card center-text"><div class="big-emo">⚡</div><h2>ספרינט קאנה</h2>
      <p class="muted">60 שניות. מופיעה אות – מקלידים את הצליל שלה ברומאג׳י (למשל ka). תשובה נכונה עוברת אוטומטית. Enter = דילוג.</p>
      <div class="row center gap wrap"><a class="btn primary lg" href="#/game/sprint?set=hira">הירגנה</a><a class="btn primary lg" href="#/game/sprint?set=kata">קטקנה</a><a class="btn lg" href="#/game/sprint?set=both">שתיהן</a></div>
      <p>השיא שלכם: <b>${Store.s.stats.bestSprint || 0}</b></p></section>`;
    return;
  }
  const pool = (set === 'hira' ? KANA.hira : set === 'kata' ? KANA.kata.filter(k => k.group !== 'ext') : [...KANA.hira, ...KANA.kata.filter(k => k.group !== 'ext')]);
  let score = 0, skips = 0, cur = null, end = Date.now() + 60000, over = false, last = null;
  root.innerHTML = `<div class="game-top"><a class="btn ghost sm" href="#/games">✕</a><span class="sprint-score">✓ <b id="ssc">0</b></span><span id="stime" class="sprint-time">60</span></div>
    <div class="card sprint-card"><div class="huge-kana" id="skana" lang="ja"></div><div id="sprev" class="small muted"></div>
    <input class="sprint-in kana-input latin" id="sin" autocomplete="off" spellcheck="false" dir="ltr" placeholder="romaji…"></div>`;
  const inp = $('#sin', root);
  const next = () => { do { cur = pick(pool); } while (cur === last); last = cur; $('#skana').textContent = cur.k; inp.value = ''; };
  const ok = v => { const x = v.toLowerCase(); return x === cur.r || Kana.toHira(Kana.romajiToHira(x)) === Kana.toHira(cur.k); };
  inp.oninput = () => {
    if (over) return;
    if (ok(inp.value.trim())) {
      score++; $('#ssc').textContent = score; SFX.play('tick');
      const rec = Store.s.kana[cur.k] || { r: 0, w: 0 }; rec.r++; Store.s.kana[cur.k] = rec;
      $('#sprev').textContent = `${cur.k} = ${cur.r} ✓`;
      $('.sprint-card').classList.add('flash-good'); setTimeout(() => $('.sprint-card') && $('.sprint-card').classList.remove('flash-good'), 150);
      next();
    }
  };
  inp.onkeydown = e => {
    if (e.key === 'Enter' && !over) {
      skips++; const rec = Store.s.kana[cur.k] || { r: 0, w: 0 }; rec.w++; Store.s.kana[cur.k] = rec;
      $('#sprev').textContent = `${cur.k} = ${cur.r} (דילוג)`; SFX.play('bad'); next();
    }
  };
  next(); inp.focus();
  App.every(() => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    const el = $('#stime'); if (el) { el.textContent = left; el.classList.toggle('low', left <= 10); }
    if (left <= 0 && !over) {
      over = true; Store.save();
      const best = Store.s.stats.bestSprint || 0, isBest = score > best;
      if (isBest) Store.s.stats.bestSprint = score;
      Store.s.stats.games++; Store.save(); Prog.addXP(Math.max(3, score)); SFX.play('done'); if (isBest) UI.confetti();
      root.innerHTML = `<div class="card summary"><div class="big-emo">⚡</div><h2>${isBest ? '🏆 שיא חדש!' : 'הזמן נגמר!'}</h2>
        <div class="sum-score"><b>${score}</b> אותיות · ${skips} דילוגים</div><div class="sum-xp">+${Math.max(3, score)} XP · שיא: ${Store.s.stats.bestSprint}</div>
        <div class="row center gap"><button class="btn primary" id="again">🔄 שוב</button><a class="btn ghost" href="#/games">למשחקים</a></div></div>`;
      $('#again', root).onclick = () => gameSprint(root, params);
    }
  }, 250);
}

/* ---------- Particle rush ---------- */
function gameRush(root, params) {
  if (!params.get('go')) {
    root.innerHTML = `<a class="back" href="#/games">→ משחקים</a><section class="card center-text"><div class="big-emo">⏱️</div><h2>מירוץ חלקיקים</h2>
      <p class="muted">60 שניות. בחרו את החלקיק החסר (מקשים 1-4). כל תשובה נכונה ברצף מגדילה את הבונוס! טעות מורידה 3 שניות.</p>
      <a class="btn primary lg" href="#/game/rush?go=1">התחילו ▶</a><p>השיא שלכם: <b>${Store.s.stats.bestRush || 0}</b></p></section>`;
    return;
  }
  let score = 0, combo = 0, end = Date.now() + 60000, over = false, deck = shuffle(PDRILL), di = 0, correct = 0;
  root.innerHTML = `<div class="game-top"><a class="btn ghost sm" href="#/games">✕</a><span>נקודות: <b id="rsc">0</b></span><span id="rcombo" class="combo"></span><span id="rtime" class="sprint-time">60</span></div><div id="rq"></div>`;
  const ask = () => {
    if (over) return;
    if (di >= deck.length) { deck = shuffle(PDRILL); di = 0; }
    const d = deck[di++]; const q = particleQuestion(d);
    const opts = shuffle(q.options);
    $('#rq').innerHTML = `<div class="card quiz-card">${q.prompt}<div class="opts jp-opts">${opts.map((o, i) => `<button class="opt" data-k="${esc(o.key)}"><span class="opt-n">${i + 1}</span><span class="opt-t">${o.html}</span></button>`).join('')}</div></div>`;
    const choose = b => {
      if (over) return;
      const ok = b.dataset.k === q.answer;
      Prog.answer(ok);
      if (ok) { combo++; correct++; const pts = 1 + Math.floor(combo / 3); score += pts; SFX.play('good'); b.classList.add('correct'); Store.s.stats.particles++; }
      else { combo = 0; end -= 3000; SFX.play('bad'); b.classList.add('wrong'); $$('.opt', $('#rq')).forEach(x => { if (x.dataset.k === q.answer) x.classList.add('correct'); }); }
      $('#rsc').textContent = score; $('#rcombo').textContent = combo >= 3 ? `🔥 x${1 + Math.floor(combo / 3)}` : '';
      $$('.opt', $('#rq')).forEach(x => x.disabled = true);
      setTimeout(ask, ok ? 350 : 1100);
    };
    $$('.opt', $('#rq')).forEach(b => b.onclick = () => choose(b));
    App.onKey = e => { const n = parseInt(e.key, 10); const bs = $$('.opt', $('#rq')); if (n >= 1 && n <= bs.length && !bs[0].disabled) choose(bs[n - 1]); };
  };
  ask();
  App.every(() => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    const el = $('#rtime'); if (el) { el.textContent = left; el.classList.toggle('low', left <= 10); }
    if (left <= 0 && !over) {
      over = true; App.onKey = null;
      const isBest = score > (Store.s.stats.bestRush || 0); if (isBest) Store.s.stats.bestRush = score;
      Store.s.stats.games++; Store.save(); Prog.addXP(Math.max(3, score)); SFX.play('done'); if (isBest) UI.confetti();
      root.innerHTML = `<div class="card summary"><div class="big-emo">⏱️</div><h2>${isBest ? '🏆 שיא חדש!' : 'הזמן נגמר!'}</h2>
        <div class="sum-score"><b>${score}</b> נקודות · ${correct} תשובות נכונות</div><div class="sum-xp">+${Math.max(3, score)} XP · שיא: ${Store.s.stats.bestRush}</div>
        <div class="row center gap"><button class="btn primary" id="again">🔄 שוב</button><a class="btn ghost" href="#/particles">למאמן החלקיקים</a></div></div>`;
      $('#again', root).onclick = () => gameRush(root, params);
    }
  }, 250);
}

/* ---------- Mixed quick workout ---------- */
Views.mix = root => {
  let words = VOCAB.filter(w => SRS.status(w.id) !== 'new');
  if (words.length < 8) words = VOCAB.filter(w => NEW_WORD_ORDER.slice(0, 5).includes(w.cat));
  const vq = sample(words, 5).map(w => QB.vocab(w, pick(['jp2he', 'he2jp', 'listen', 'type', 'context'])));
  const pq = sample(PDRILL, 3).map(d => { const q = particleQuestion(d); q.after = ok => { if (ok) Store.s.stats.particles++; }; return q; });
  const cq = sample(VERBS, 2).map(w => {
    const fid = pick(['masu', 'masen', 'mashita', 'te', 'nai', 'ta']); const f = Conj.verbForms(w)[fid]; const F = Conj.FORM_BY_ID[fid];
    return { type: 'mc', label: 'הטיית פועל', prompt: `<div class="big-jp">${UI.jp(w.jp)}</div><div class="muted">${esc(w.he)}</div><div class="form-ask">← ${esc(F.label)} <span class="tag" lang="ja">${F.tag}</span></div>`,
      options: [QB.jpOpt(f.kana, 'ok'), ...shuffle(Conj.wrongForms(w, fid)).slice(0, 3).map(x => QB.jpOpt(x))], answer: 'ok', optCls: 'jp-opts',
      reveal: `<div class="reveal-word">${UI.jp(f.kana, 'big')}</div>`, explain: UI.rich(esc(Conj.verbRule(w))), sayAfter: f.kana, after: ok => { if (ok) Store.s.stats.conj++; } };
  });
  const sq = sample(SENTENCES.filter(s => s.lvl <= 2 || SRS.learnedCount() > 40), 2).map(s => {
    const jp = tokensToJp(s.w);
    return { type: 'order', label: 'סדרו את המשפט', prompt: `<div class="he-prompt big">${esc(s.he)}</div>`, tokens: s.w, alts: s.alt, distractors: orderDistractors(s.w, 1), reveal: QB.sentenceReveal(jp, s.he), sayAfter: jp, after: ok => { if (ok) Store.s.stats.sentences++; } };
  });
  Quiz.run(root, { title: '⚡ אימון מהיר מעורב', questions: shuffle([...vq, ...pq, ...cq, ...sq]), back: '#/', retry: () => Views.mix(root) });
};
