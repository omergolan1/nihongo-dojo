'use strict';
/* ===== Word detail card (modal): meaning, usage note, pattern, example sentences ===== */
const WordCard = {
  list: null, idx: 0, timers: [], key: null,

  typeBadge(w) {
    if (w.g) return `<span class="badge ${w.g}">${{ u: 'פועל う', ru: 'פועל る', irr: 'פועל חריג' }[w.g]}</span>`;
    if (w.type === 'i-adj') return '<span class="badge u">תואר い</span>';
    if (w.type === 'na-adj') return '<span class="badge ru">תואר な</span>';
    if (w.type === 'question') return '<span class="badge gold">מילת שאלה</span>';
    return '';
  },

  /** example sentence block */
  exHTML([jp, he]) {
    return `<div class="ex"><div class="ex-jp">${UI.jp(jp)} ${UI.sayBtn(jp)}</div>${UI.ro(jp)}<div class="ex-he">${esc(he)}</div></div>`;
  },

  /** compact "first example" used in quizzes, flashcards and home */
  firstExample(w, withBtn = true) {
    const c = wordContext(w); if (!c || !c.ex.length) return '';
    return `<div class="mini-ex"><div class="ex-jp">${UI.jp(c.ex[0][0])} ${UI.sayBtn(c.ex[0][0], 'sm')}</div>${UI.ro(c.ex[0][0])}<div class="ex-he">${esc(c.ex[0][1])}</div>
      ${withBtn ? `<button class="btn ghost sm" data-word="${esc(w.id)}">📖 הסבר ועוד דוגמאות</button>` : ''}</div>`;
  },

  body(w) {
    const c = wordContext(w), s = Store.s.settings;
    const links = [];
    if (w.type === 'verb') links.push(`<a class="btn sm" href="#/verbs?tab=table&v=${encodeURIComponent(w.jp)}">🔄 כל ההטיות של הפועל</a>`);
    if (w.type === 'i-adj' || w.type === 'na-adj') links.push(`<a class="btn sm" href="#/verbs?tab=adj&a=${encodeURIComponent(w.jp)}">🔄 הטיות שם התואר</a>`);
    if (w.type === 'question') links.push('<a class="btn sm" href="#/lesson/q1">📖 שיעור מילות שאלה</a>');
    if (w.cat === 'demo') links.push('<a class="btn sm" href="#/lesson/a2">📖 שיעור こそあど</a>');
    if (w.cat === 'numbers') links.push('<a class="btn sm" href="#/lesson/a3">📖 שיעור מספרים ומונים</a>');
    return `
    <div class="wc-head">
      <div class="wc-emo">${w.emoji || ''}</div>
      <div class="wc-main">
        <div class="wc-jp">${UI.jp(w.jp)} ${UI.sayBtn(w.jp)}</div>
        ${w.kanji && s.kanji ? `<span class="kanji-sm" lang="ja">${esc(w.kanji)}</span>` : ''}
        <div class="ro" dir="ltr">${esc(w.romaji)}</div>
        <div class="wc-he">${esc(w.he)}</div>
      </div>
      <div class="wc-badges">${this.typeBadge(w)}${STATUS_BADGE[SRS.status(w.id)]}</div>
    </div>
    ${c ? `
    <section class="wc-sec">
      <div class="wc-h">💡 הסבר והקשר</div>
      <p class="wc-note">${UI.rich(c.note)}</p>
      ${c.pattern ? `<div class="wc-pattern"><span class="wc-pl">מבנה</span><span class="wc-pv" dir="ltr">${esc(c.pattern)}</span></div>` : ''}
    </section>
    <section class="wc-sec">
      <div class="wc-h">📝 דוגמאות במשפט <button class="btn ghost sm" id="wc-playall">▶ השמעת כל הדוגמאות</button></div>
      <div class="examples">${c.ex.map(e => this.exHTML(e)).join('')}</div>
      <p class="small muted">המילה מודגשת באדום, החלקיקים בכחול. לחצו על משפט כדי לשמוע אותו.</p>
    </section>` : ''}
    ${links.length ? `<div class="row gap wrap">${links.join('')}</div>` : ''}`;
  },

  open(w, list) {
    if (!w) return;
    this.close();
    this.list = (list && list.length) ? list : [w];
    this.idx = Math.max(0, this.list.findIndex(x => x.id === w.id));
    const back = document.createElement('div');
    back.className = 'modal-back'; back.id = 'wc-modal';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <button class="modal-x" aria-label="סגירה">✕</button>
      <div class="modal-body"></div>
      <div class="modal-nav"></div></div>`;
    document.body.appendChild(back);
    document.body.classList.add('modal-open');
    back.addEventListener('click', e => {
      if (e.target === back || e.target.closest('.modal-x')) return this.close();
      if (e.target.closest('a[href^="#"]')) return this.close();
      const nav = e.target.closest('[data-nav]');
      if (nav) this.go(+nav.dataset.nav);
    });
    this.key = e => {
      if (!$('#wc-modal')) return;
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.go(-1); }
    };
    document.addEventListener('keydown', this.key, true);
    this.render();
  },

  go(d) {
    const n = this.idx + d;
    if (!this.list || n < 0 || n >= this.list.length) return;
    this.idx = n; this.render();
  },

  render() {
    const m = $('#wc-modal'); if (!m) return;
    this.stopAudio();
    const w = this.list[this.idx];
    $('.modal-body', m).innerHTML = this.body(w);
    $('.modal-body', m).scrollTop = 0; $('.modal', m).scrollTop = 0;
    const many = this.list.length > 1;
    $('.modal-nav', m).innerHTML = many ? `
      <button class="btn ghost sm" data-nav="-1" ${this.idx === 0 ? 'disabled' : ''}>→ הקודמת</button>
      <span class="muted small">${this.idx + 1} / ${this.list.length}</span>
      <button class="btn ghost sm" data-nav="1" ${this.idx === this.list.length - 1 ? 'disabled' : ''}>הבאה ←</button>` : '';
    const pa = $('#wc-playall', m);
    if (pa) pa.onclick = () => this.playAll(w);
    if (Store.s.settings.autoplay) TTS.speak(w.jp);
  },

  playAll(w) {
    this.stopAudio();
    const c = wordContext(w); if (!c) return;
    const rows = $$('#wc-modal .examples .ex');
    let t = 100;
    c.ex.forEach(([jp], i) => {
      this.timers.push(setTimeout(() => {
        rows.forEach(r => r.classList.remove('playing'));
        if (rows[i]) { rows[i].classList.add('playing'); rows[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        TTS.speak(jp);
      }, t));
      t += 900 + Kana.strip(jp).length * 190 / (Store.s.settings.rate || 0.85);
    });
    this.timers.push(setTimeout(() => rows.forEach(r => r.classList.remove('playing')), t));
  },

  stopAudio() { this.timers.forEach(clearTimeout); this.timers = []; },

  close() {
    this.stopAudio();
    const m = $('#wc-modal'); if (m) m.remove();
    document.body.classList.remove('modal-open');
    if (this.key) document.removeEventListener('keydown', this.key, true);
    this.key = null;
  }
};

/* Any element with data-word opens the card. A container with data-ids="id,id,..." gives prev/next navigation. */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-word]');
  if (!el || e.target.closest('[data-say]')) return;
  const w = VOCAB_BY_ID[el.dataset.word]; if (!w) return;
  const holder = el.closest('[data-ids]');
  const list = holder ? holder.dataset.ids.split(',').map(id => VOCAB_BY_ID[id]).filter(Boolean) : null;
  WordCard.open(w, list);
});
window.addEventListener('hashchange', () => WordCard.close());
