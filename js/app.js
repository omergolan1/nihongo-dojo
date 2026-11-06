'use strict';
/* =========================================================
   App shell & router
   ========================================================= */

const App = {
  onKey: null,
  timers: [],
  NAV: [
    { r: 'home', icon: '🏠', name: 'בית' },
    { r: 'kana', icon: 'あ', name: 'הירגנה וקטקנה' },
    { r: 'write', icon: '✍️', name: 'כתיבה בקטקנה' },
    { r: 'vocab', icon: '📚', name: 'אוצר מילים' },
    { r: 'review', icon: '🔁', name: 'חזרה יומית', badge: () => SRS.dueIds().length },
    { r: 'grammar', icon: '📖', name: 'דקדוק' },
    { r: 'builder', icon: '🧩', name: 'בונה משפטים' },
    { r: 'particles', icon: '🎯', name: 'מאמן חלקיקים' },
    { r: 'verbs', icon: '🔄', name: 'הטיות' },
    { r: 'numbers', icon: '🔢', name: 'ספירה ומספרים' },
    { r: 'games', icon: '🎮', name: 'משחקים' },
    { r: 'cheat', icon: '📋', name: 'דף עזר' },
    { r: 'progress', icon: '📊', name: 'התקדמות והגדרות' }
  ],
  every(fn, ms) { const t = setInterval(fn, ms); this.timers.push(t); return t; },
  after(fn, ms) { const t = setTimeout(fn, ms); this.timers.push(t); return t; },
  renderNav(active) {
    $('#nav').innerHTML = this.NAV.map(n => {
      const b = n.badge ? n.badge() : 0;
      return `<a href="#/${n.r === 'home' ? '' : n.r}" class="nav-a ${active === n.r ? 'active' : ''}">
        <span class="nav-i" ${n.r === 'kana' ? 'lang="ja"' : ''}>${n.icon}</span><span class="nav-t">${n.name}</span>${b ? `<span class="nav-badge">${b}</span>` : ''}</a>`;
    }).join('');
  },
  route() {
    this.timers.forEach(t => { clearInterval(t); clearTimeout(t); }); this.timers = [];
    this.onKey = null;
    TTS.stop();
    const hash = location.hash.replace(/^#\/?/, '');
    const [path, qs] = hash.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const name = parts[0] || 'home';
    const params = new URLSearchParams(qs || '');
    const view = Views[name] || Views.home;
    const root = $('#view');
    root.innerHTML = '';
    root.className = 'view view-' + name;
    const navName = { lesson: 'grammar', cards: 'review', quiz: 'vocab', game: 'games', kanaquiz: 'kana' }[name] || name;
    this.renderNav(navName);
    document.body.classList.remove('nav-open');
    try { view(root, parts.slice(1), params); }
    catch (e) { console.error(e); root.innerHTML = `<div class="card"><h2>אופס, משהו השתבש 😅</h2><pre dir="ltr">${esc(e.stack || e)}</pre><a class="btn" href="#/">חזרה הביתה</a></div>`; }
    window.scrollTo(0, 0);
  },
  init() {
    Store.load();
    UI.applyTheme();
    TTS.init();
    UI.updateSidebar();
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select') && !e.target.matches('#qin, .kana-input, .sprint-in')) return;
      if (this.onKey) this.onKey(e);
    });
    $('#menu-btn').onclick = () => document.body.classList.toggle('nav-open');
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => UI.applyTheme());
    this.route();
    Prog.checkAch();
  }
};
document.addEventListener('DOMContentLoaded', () => App.init());
