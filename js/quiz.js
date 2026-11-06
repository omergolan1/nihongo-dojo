'use strict';
/* =========================================================
   Generic quiz runner: multiple choice, typing, word order
   ========================================================= */
const Quiz = {
  run(root, cfg) {
    const qs = cfg.questions.filter(Boolean);
    const st = { i: 0, correct: 0, wrong: [], xp: 0, answered: false };
    const xpPer = cfg.xpPer ?? 2;

    const finishQ = (q, ok, userAns) => {
      if (st.answered) return; st.answered = true;
      Prog.answer(ok);
      if (ok) { st.correct++; SFX.play('good'); Prog.addXP(xpPer); st.xp += xpPer; }
      else { SFX.play('bad'); st.wrong.push({ q, userAns }); }
      try { q.after && q.after(ok); } catch (e) { console.error(e); }
      try { cfg.onAnswer && cfg.onAnswer(q, ok); } catch (e) { console.error(e); }
      const card = $('#qcard', root);
      card.classList.add(ok ? 'is-good' : 'is-bad');
      if (!ok) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 500); }
      const fb = $('.q-feedback', root);
      fb.hidden = false;
      fb.className = 'q-feedback ' + (ok ? 'good' : 'bad');
      fb.innerHTML = `<div class="fb-title">${ok ? pick(['✓ せいかい！ נכון!', '✓ すごい！ מעולה!', '✓ いいね！ יפה!', '✓ נכון!']) : '✗ לא בדיוק…'}</div>
        ${q.reveal ? `<div class="fb-reveal">${q.reveal}</div>` : ''}
        ${q.explain ? `<div class="fb-explain">💡 ${q.explain}</div>` : ''}`;
      if (q.sayAfter && Store.s.settings.autoplay) TTS.speak(q.sayAfter);
      const nx = $('#qnext', root); nx.hidden = false; nx.focus();
      $$('.q-actions-pre', root).forEach(e => e.hidden = true);
    };

    const render = () => {
      if (st.i >= qs.length) return summary();
      const q = qs[st.i]; st.answered = false;
      root.innerHTML = `
      <div class="quiz">
        <div class="quiz-top">
          <a class="btn ghost sm" href="${cfg.back || '#/'}">✕</a>
          ${UI.pbar(st.i / qs.length * 100)}
          <span class="quiz-count">${st.i + 1} / ${qs.length}</span>
        </div>
        ${cfg.title ? `<div class="quiz-title">${cfg.title}</div>` : ''}
        <div class="card quiz-card" id="qcard">
          ${q.label ? `<div class="q-label">${q.label}</div>` : ''}
          <div class="q-prompt">${q.prompt || ''}</div>
          ${q.say ? `<div class="q-say"><button class="say-btn big" data-say="${esc(Kana.strip(q.say))}">🔊</button></div>` : ''}
          <div class="q-body"></div>
          <div class="q-feedback" hidden></div>
        </div>
        <div class="quiz-actions"><button class="btn primary lg" id="qnext" hidden>הבא ←</button></div>
      </div>`;
      const body = $('.q-body', root);
      if (q.say && q.autoSay !== false && (q.autoSay || Store.s.settings.autoplay)) setTimeout(() => TTS.speak(q.say), 150);
      $('#qnext', root).onclick = () => { st.i++; render(); };

      if (q.type === 'mc') {
        const opts = q.noShuffle ? q.options : shuffle(q.options);
        body.innerHTML = `<div class="opts ${q.optCls || ''}">${opts.map((o, i) =>
          `<button class="opt ${o.cls || ''}" data-k="${esc(o.key)}"><span class="opt-n">${i + 1}</span><span class="opt-t">${o.html}</span></button>`).join('')}</div>`;
        const choose = btn => {
          if (st.answered) return;
          const ok = btn.dataset.k === String(q.answer);
          $$('.opt', body).forEach(b => { b.disabled = true; if (b.dataset.k === String(q.answer)) b.classList.add('correct'); });
          if (!ok) btn.classList.add('wrong');
          finishQ(q, ok, btn.innerText);
        };
        $$('.opt', body).forEach(b => b.onclick = e => { if (e.target.closest('[data-say]') && !e.target.closest('.opt-t')) return; choose(b); });
        App.onKey = e => {
          if (st.answered) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#qnext', root).click(); } return; }
          const n = parseInt(e.key, 10); const bs = $$('.opt', body);
          if (n >= 1 && n <= bs.length) choose(bs[n - 1]);
        };
      }

      else if (q.type === 'type') {
        const kata = !!q.kata;
        body.innerHTML = `
          <div class="type-wrap">
            <input class="kana-input ${q.latin ? 'latin' : ''}" id="qin" autocomplete="off" autocorrect="off" spellcheck="false" dir="ltr"
              placeholder="${q.latin ? 'הקלידו ברומאג׳י…' : 'הקלידו ברומאג׳י – יהפוך לקאנה'}" lang="${q.latin ? 'en' : 'ja'}">
            ${q.latin ? '' : `<button class="btn ghost sm" id="qkata" title="החלפה הירגנה / קטקנה">${kata ? 'ア' : 'あ'}</button>`}
          </div>
          <div class="row center q-actions-pre">
            <button class="btn ghost" id="qskip">לא יודע/ת</button>
            <button class="btn primary" id="qcheck">בדיקה</button>
          </div>`;
        const inp = $('#qin', body);
        let isKata = kata;
        if (q.numeric) { inp.setAttribute('inputmode', 'numeric'); inp.placeholder = 'הקלידו בספרות, למשל 1250'; }
        if (!q.latin) UI.bindKanaInput(inp, () => isKata);
        const kb = $('#qkata', body);
        if (kb) kb.onclick = () => { isKata = !isKata; kb.textContent = isKata ? 'ア' : 'あ'; inp.focus(); };
        setTimeout(() => inp.focus(), 50);
        const check = () => {
          if (st.answered) return;
          const v = q.latin ? inp.value.trim() : UI.finalizeKana(inp, isKata);
          if (!v) { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); return; }
          const ok = q.check ? q.check(v) : Kana.matches(v, q.answers);
          inp.classList.add(ok ? 'good' : 'bad'); inp.disabled = true;
          finishQ(q, ok, v);
        };
        $('#qcheck', body).onclick = check;
        $('#qskip', body).onclick = () => { inp.disabled = true; finishQ(q, false, '—'); };
        App.onKey = e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (st.answered) $('#qnext', root).click(); else check();
        };
      }

      else if (q.type === 'order') {
        const toks = shuffle([...q.tokens.map((t, i) => ({ t, id: 'c' + i })), ...(q.distractors || []).map((t, i) => ({ t, id: 'd' + i }))]);
        let placed = [];
        body.innerHTML = `
          <div class="order-answer" id="oa"><span class="oa-ph">לחצו על המילים לפי הסדר הנכון…</span></div>
          <div class="order-bank" id="ob"></div>
          <div class="row center q-actions-pre">
            <button class="btn ghost sm" id="ohint">💡 רמז</button>
            <button class="btn ghost sm" id="oclear">↺ ניקוי</button>
            <button class="btn primary" id="ocheck">בדיקה</button>
          </div>`;
        const oa = $('#oa', body), ob = $('#ob', body);
        const tokHTML = (o, where) => `<button class="tok ${PARTICLES.includes(o.t) ? 'pt-tok' : ''}" data-id="${o.id}" data-where="${where}" lang="ja">${esc(o.t)}</button>`;
        const draw = () => {
          oa.innerHTML = placed.length ? placed.map(o => tokHTML(o, 'a')).join('') : '<span class="oa-ph">לחצו על המילים לפי הסדר הנכון…</span>';
          ob.innerHTML = toks.filter(o => !placed.includes(o)).map(o => tokHTML(o, 'b')).join('');
        };
        draw();
        body.addEventListener('click', e => {
          const b = e.target.closest('.tok'); if (!b || st.answered) return;
          const o = toks.find(x => x.id === b.dataset.id);
          if (b.dataset.where === 'b') { placed.push(o); SFX.play('tick'); } else placed = placed.filter(x => x !== o);
          draw();
        });
        const accepted = [q.tokens, ...(q.alts || [])].map(a => a.join(' '));
        const check = () => {
          if (st.answered) return;
          if (!placed.length) return;
          const ans = placed.map(o => o.t).join(' ');
          const ok = accepted.includes(ans);
          oa.classList.add(ok ? 'good' : 'bad');
          finishQ(q, ok, ans);
        };
        $('#ocheck', body).onclick = check;
        $('#oclear', body).onclick = () => { placed = []; draw(); };
        $('#ohint', body).onclick = () => {
          // keep the correct prefix, add the next correct token
          let k = 0; while (k < placed.length && placed[k].t === q.tokens[k]) k++;
          placed = placed.slice(0, k);
          const next = toks.find(o => !placed.includes(o) && o.t === q.tokens[k]);
          if (next) placed.push(next);
          draw();
        };
        App.onKey = e => {
          if (e.key === 'Enter') { e.preventDefault(); if (st.answered) $('#qnext', root).click(); else check(); }
          if (e.key === 'Backspace' && !st.answered) { placed.pop(); draw(); }
        };
      }
    };

    const summary = () => {
      App.onKey = null;
      const n = qs.length, c = st.correct, pct = n ? Math.round(c / n * 100) : 0;
      if (c === n && n >= 5) { Prog.addXP(10); st.xp += 10; Store.s.stats.perfect++; Store.save(); Prog.checkAch(); }
      SFX.play('done');
      if (pct >= 80) UI.confetti();
      const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
      const msg = pct === 100 ? 'かんぺき！ מושלם!' : pct >= 80 ? 'すごい！ מצוין!' : pct >= 60 ? 'いいね！ יפה מאוד!' : pct >= 40 ? 'がんばって！ ממשיכים להתאמן!' : 'だいじょうぶ！ כל טעות היא שיעור.';
      root.innerHTML = `
      <div class="quiz">
        <div class="card summary">
          <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>
          <h2>${msg}</h2>
          <div class="sum-score"><b>${c}</b> / ${n} <small>(${pct}%)</small></div>
          <div class="sum-xp">+${st.xp} XP ${c === n && n >= 5 ? '<span class="badge gold">בונוס מושלם +10</span>' : ''}</div>
          ${st.wrong.length ? `<div class="sum-wrong"><h3>כדאי לחזור על:</h3>${st.wrong.map(w => `<div class="sw-item">${w.q.review || w.q.reveal || w.q.prompt}</div>`).join('')}</div>` : ''}
          <div class="row center gap">
            ${cfg.retry ? '<button class="btn primary" id="sretry">🔄 עוד סבב</button>' : ''}
            <a class="btn ghost" href="${cfg.back || '#/'}">חזרה</a>
            ${cfg.extraBtn || ''}
          </div>
        </div>
      </div>`;
      const r = $('#sretry', root); if (r) r.onclick = cfg.retry;
      try { cfg.onFinish && cfg.onFinish({ correct: c, total: n, pct }); } catch (e) { console.error(e); }
    };
    render();
  }
};

/* helpers for building questions */
const QB = {
  jpOpt(text, key) { return { html: `<span class="jp" lang="ja">${UI.jpHTML(text)}</span>`, key: key ?? text }; },
  heOpt(text, key) { return { html: esc(text), key: key ?? text }; },
  /** pick n distractor words, preferring same category/type, unique by field */
  distractors(word, n, field = 'he', pool) {
    const p = pool || VOCAB;
    const same = shuffle(p.filter(w => w.id !== word.id && w.cat === word.cat));
    const other = shuffle(p.filter(w => w.id !== word.id && w.cat !== word.cat && w.type === word.type));
    const rest = shuffle(p.filter(w => w.id !== word.id));
    const out = [], seen = new Set([word[field]]);
    for (const w of [...same, ...other, ...rest]) {
      if (seen.has(w[field])) continue;
      seen.add(w[field]); out.push(w);
      if (out.length >= n) break;
    }
    return out;
  },
  wordReveal(w, withEx = true) {
    return `<div class="reveal-word">${UI.jp(w.jp, 'big')} ${w.kanji && Store.s.settings.kanji ? `<span class="kanji-sm" lang="ja">${esc(w.kanji)}</span>` : ''}
      ${Store.s.settings.romaji ? `<span class="ro" dir="ltr">${esc(w.romaji)}</span>` : ''} <span class="he-m">= ${esc(w.he)}</span> ${w.emoji ? `<span class="emo">${w.emoji}</span>` : ''}</div>${withEx && typeof WordCard !== 'undefined' ? WordCard.firstExample(w) : ''}`;
  },
  sentenceReveal(jp, he) {
    return `<div class="reveal-sent">${UI.jp(jp, 'big')} ${UI.sayBtn(jp)}<div>${UI.ro(jp)}</div>${he ? `<div class="he-m">${esc(he)}</div>` : ''}</div>`;
  },
  /** vocab question in a given mode */
  vocab(w, mode) {
    const after = ok => SRS.quiz(w.id, ok);
    const reveal = this.wordReveal(w);
    const review = this.wordReveal(w, false);
    if (mode === 'context') {
      const c = wordContext(w);
      if (!c || !c.ex.length) return this.vocab(w, 'jp2he');
      const [jp, he] = pick(c.ex);
      const blanked = jp.replace(/\{[^}]*\}/, '＿');
      const inflects = ['verb', 'i-adj', 'na-adj'].includes(w.type);
      return { type: 'mc', label: 'איזו מילה חסרה במשפט?', prompt: `<div class="he-prompt">${esc(he)}</div><div class="big-jp" lang="ja">${UI.jpHTML(blanked)}</div>${inflects ? '<div class="small muted">💡 במשפט המילה עשויה להופיע בצורה מוטית</div>' : ''}`,
        options: [this.jpOpt(w.jp, 'ok'), ...this.distractors(w, 3, 'jp').map(d => this.jpOpt(d.jp, d.id))], answer: 'ok', optCls: 'jp-opts',
        reveal: this.sentenceReveal(jp, he) + `<div class="reveal-word">${UI.jp(w.jp)} <span class="he-m">= ${esc(w.he)}</span> <button class="btn ghost sm" data-word="${esc(w.id)}">📖 הסבר ודוגמאות</button></div>`,
        review: this.sentenceReveal(jp, he), sayAfter: jp, after };
    }
    if (mode === 'jp2he') {
      return { type: 'mc', label: 'מה הפירוש?', prompt: `<div class="big-jp">${UI.jp(w.jp)}</div>${w.kanji && Store.s.settings.kanji ? `<div class="kanji-sm" lang="ja">${esc(w.kanji)}</div>` : ''}`,
        say: w.jp, options: [this.heOpt(w.he, 'ok'), ...this.distractors(w, 3, 'he').map(d => this.heOpt(d.he, d.id))], answer: 'ok', reveal, review, after };
    }
    if (mode === 'he2jp') {
      return { type: 'mc', label: 'איך אומרים ביפנית?', prompt: `<div class="big-he">${esc(w.he)} ${w.emoji ? `<span class="emo">${w.emoji}</span>` : ''}</div>`,
        options: [this.jpOpt(w.jp, 'ok'), ...this.distractors(w, 3, 'jp').map(d => this.jpOpt(d.jp, d.id))], answer: 'ok', optCls: 'jp-opts', reveal, review, sayAfter: w.jp, after };
    }
    if (mode === 'listen') {
      return { type: 'mc', label: '🎧 מה שמעתם?', prompt: '<div class="listen-hint">לחצו להשמעה חוזרת</div>', say: w.jp, autoSay: true,
        options: [this.heOpt(w.he, 'ok'), ...this.distractors(w, 3, 'he').map(d => this.heOpt(d.he, d.id))], answer: 'ok', reveal, review, after };
    }
    if (mode === 'type') {
      return { type: 'type', label: 'כתבו ביפנית (ברומאג׳י → קאנה)', prompt: `<div class="big-he">${esc(w.he)} ${w.emoji ? `<span class="emo">${w.emoji}</span>` : ''}</div>`,
        answers: [w.jp, w.romaji], kata: Kana.isKata(w.jp), reveal, review, sayAfter: w.jp, after };
    }
    return this.vocab(w, pick(['jp2he', 'he2jp', 'listen', 'type', 'context']));
  }
};
