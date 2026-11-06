'use strict';
/* ===== Verb & adjective conjugation explorer and drills ===== */
const GROUP_NAME = { u: 'פועל う (godan)', ru: 'פועל る (ichidan)', irr: 'חריג' };
const VerbUI = { forms: ['masu', 'masen', 'mashita', 'te', 'nai', 'ta'], g: 'all', mode: 'mc', adjForms: ['neg', 'past', 'pastneg'], adjMode: 'mc' };

Views.verbs = (root, parts, params) => {
  const run = params.get('run');
  if (run === 'drill') return verbDrill(root, params);
  if (run === 'groups') return groupDrill(root);
  if (run === 'adj') return adjDrill(root, params);
  const tab = params.get('tab') || 'table';
  const tabs = [['table', '📋 טבלת הטיות'], ['drill', '🏋️ תרגול הטיות'], ['groups', '🗂️ קבוצות פעלים'], ['adj', '🌶️ שמות תואר']];
  root.innerHTML = `
  <h1 class="page-title">🔄 הטיות פעלים ושמות תואר</h1>
  <div class="tabs">${tabs.map(([id, n]) => `<a class="tab ${tab === id ? 'active' : ''}" href="#/verbs?tab=${id}">${n}</a>`).join('')}</div>
  <div id="vtab"></div>`;
  const el = $('#vtab', root);
  if (tab === 'table') verbTable(el, params.get('v'));
  else if (tab === 'drill') drillSetup(el);
  else if (tab === 'groups') el.innerHTML = `<section class="card center-text"><div class="big-emo">🗂️</div><h2>לאיזו קבוצה שייך הפועל?</h2>
      <p class="muted">מקבלים פועל ומחליטים: פועל る, פועל う, או חריג. זה הצעד הראשון לכל הטיה! שימו לב למתחזים (かえる, はいる, はしる, しる).</p>
      <a class="btn primary lg" href="#/verbs?run=groups">התחילו ▶</a> <a class="btn ghost" href="#/lesson/v1">📖 לשיעור</a></section>`;
  else adjTab(el, params.get('a'));
};

function verbTable(el, vjp) {
  const w = VERBS.find(v => v.jp === vjp) || VERBS[0];
  const forms = Conj.verbForms(w);
  const s = Store.s.settings;
  el.innerHTML = `
  <div class="verb-layout">
    <section class="card verb-pick">
      <input id="vfilter" placeholder="🔍 חיפוש פועל…" autocomplete="off">
      <div class="verb-list">${VERBS.map(v => `<a class="vchip ${v.id === w.id ? 'on' : ''} g-${v.g}" href="#/verbs?tab=table&v=${encodeURIComponent(v.jp)}" data-s="${esc(v.jp + ' ' + v.he + ' ' + v.romaji)}"><span lang="ja">${esc(v.jp)}</span><small>${esc(v.he)}</small></a>`).join('')}</div>
    </section>
    <section class="card verb-card">
      <div class="vc-head">
        <div class="vc-emo">${w.emoji || ''}</div>
        <div><div class="vc-jp">${UI.jp(w.jp)} ${UI.sayBtn(w.jp)}</div>${w.kanji && s.kanji ? `<span class="kanji-sm" lang="ja">${esc(w.kanji)}</span>` : ''}
          <div class="ro" dir="ltr">${esc(w.romaji)}</div><div class="vc-he">${esc(w.he)}</div></div>
        <span class="badge ${w.g}">${GROUP_NAME[w.g]}</span>
      </div>
      <div class="banner">💡 ${UI.rich(esc(Conj.verbRule(w)))}</div>
      <div class="tbl-wrap"><table class="tbl conj"><thead><tr><th>צורה</th><th>קאנה</th>${s.kanji && w.kanji ? '<th>קאנג׳י</th>' : ''}${s.romaji ? '<th>רומאג׳י</th>' : ''}</tr></thead><tbody>
      ${Conj.FORMS.map(F => { const f = forms[F.id]; if (!f) return ''; return `<tr><td>${esc(F.label)}<div class="tag" lang="ja">${esc(F.tag)}</div></td><td>${UI.jp(f.kana)} ${UI.sayBtn(f.kana, 'sm')}</td>${s.kanji && w.kanji ? `<td lang="ja">${esc(f.kanji)}</td>` : ''}${s.romaji ? `<td dir="ltr" class="ro">${esc(Kana.toRomaji(f.kana))}</td>` : ''}</tr>`; }).join('')}
      </tbody></table></div>
    </section>
  </div>`;
  const inp = $('#vfilter', el);
  inp.oninput = () => { const q = inp.value.trim().toLowerCase(); const qh = Kana.toHira(Kana.romajiToHira(q)); $$('.vchip', el).forEach(c => c.hidden = q && !(c.dataset.s.toLowerCase().includes(q) || c.dataset.s.includes(qh))); };
}

function drillSetup(el) {
  const o = VerbUI;
  el.innerHTML = `
  <section class="card practice-panel">
    <div class="card-h">אילו צורות לתרגל?</div>
    <div class="chips">${Conj.FORMS.filter(f => f.id !== 'dict').map(f => `<button class="chip ${o.forms.includes(f.id) ? 'on' : ''}" data-f="${f.id}"><span lang="ja">${esc(f.tag)}</span> · ${esc(f.short === f.tag ? f.label : f.short)}</button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">קבוצה:</span>${[['all', 'הכול'], ['ru', 'פעלי る'], ['u', 'פעלי う'], ['irr', 'חריגים']].map(([g, n]) => `<button class="chip ${o.g === g ? 'on' : ''}" data-g="${g}">${n}</button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">סוג תשובה:</span>${[['mc', 'בחירה מרובה'], ['type', 'הקלדה (קשה יותר)']].map(([m, n]) => `<button class="chip ${o.mode === m ? 'on' : ''}" data-m="${m}">${n}</button>`).join('')}</div>
    <div class="row center"><button class="btn primary lg" id="dgo">התחילו ▶</button></div>
  </section>
  <div class="row gap"><a class="btn ghost" href="#/lesson/v2">📖 שיעור ます</a><a class="btn ghost" href="#/lesson/v4">📖 שיעור て</a><a class="btn ghost" href="#/lesson/v6">📖 שיעור ない/た</a></div>`;
  $$('[data-f]', el).forEach(b => b.onclick = () => { const f = b.dataset.f; o.forms = o.forms.includes(f) ? o.forms.filter(x => x !== f) : [...o.forms, f]; if (!o.forms.length) o.forms = [f]; drillSetup(el); });
  $$('[data-g]', el).forEach(b => b.onclick = () => { o.g = b.dataset.g; drillSetup(el); });
  $$('[data-m]', el).forEach(b => b.onclick = () => { o.mode = b.dataset.m; drillSetup(el); });
  $('#dgo', el).onclick = () => { location.hash = `#/verbs?run=drill&forms=${o.forms.join(',')}&g=${o.g}&mode=${o.mode}`; };
}

function verbDrill(root, params) {
  const forms = (params.get('forms') || 'masu').split(','), g = params.get('g') || 'all', mode = params.get('mode') || 'mc';
  const pool = VERBS.filter(v => g === 'all' || v.g === g);
  const qs = [];
  let guard = 0;
  while (qs.length < 15 && guard++ < 200) {
    const w = pick(pool), fid = pick(forms);
    const all = Conj.verbForms(w), f = all[fid]; if (!f) continue;
    if (qs.some(q => q._k === w.id + fid)) continue;
    const F = Conj.FORM_BY_ID[fid];
    const prompt = `<div class="big-jp">${UI.jp(w.jp)}</div><div class="muted">${esc(w.he)} · <span class="badge ${w.g}">${GROUP_NAME[w.g]}</span></div>
      <div class="form-ask">← ${esc(F.label)} <span class="tag" lang="ja">${esc(F.tag)}</span></div>`;
    const reveal = `<div class="reveal-word">${UI.jp(f.kana, 'big')} ${f.kanji ? `<span class="kanji-sm" lang="ja">${esc(f.kanji)}</span>` : ''} <span class="ro" dir="ltr">${esc(Kana.toRomaji(f.kana))}</span></div>`;
    const explain = UI.rich(esc(Conj.verbRule(w)));
    const after = ok => { if (ok) { Store.s.stats.conj++; Store.save(); } };
    if (mode === 'type') qs.push({ _k: w.id + fid, type: 'type', label: 'הטו את הפועל', prompt, answers: [f.kana, f.kanji].filter(Boolean), reveal, explain, sayAfter: f.kana, after });
    else {
      let wrong = shuffle(Conj.wrongForms(w, fid)).slice(0, 3);
      qs.push({ _k: w.id + fid, type: 'mc', label: 'בחרו את ההטיה הנכונה', prompt, options: [QB.jpOpt(f.kana, 'ok'), ...wrong.map(x => QB.jpOpt(x))], answer: 'ok', optCls: 'jp-opts', reveal, explain, sayAfter: f.kana, after });
    }
  }
  Quiz.run(root, { title: '🔄 תרגול הטיות', questions: qs, back: '#/verbs?tab=drill', xpPer: 3, retry: () => verbDrill(root, params) });
}

function groupDrill(root) {
  const fakers = VERBS.filter(v => ['かえる', 'はいる', 'はしる', 'しる'].includes(v.jp));
  const chosen = shuffle([...sample(VERBS, 13), ...sample(fakers, 2)]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 15);
  const qs = chosen.map(w => ({
    type: 'mc', label: 'לאיזו קבוצה שייך הפועל?', prompt: `<div class="big-jp">${UI.jp(w.jp)}</div><div class="muted">${esc(w.he)}</div>`,
    options: [{ html: 'פועל る', key: 'ru' }, { html: 'פועל う', key: 'u' }, { html: 'חריג', key: 'irr' }], noShuffle: true, answer: w.g,
    reveal: `<div><b lang="ja">${esc(w.jp)}</b> → ${GROUP_NAME[w.g]} · ${UI.jp(Conj.verb(w.jp, w.g).masu)}</div>`, explain: UI.rich(esc(Conj.verbRule(w))), sayAfter: w.jp
  }));
  Quiz.run(root, { title: '🗂️ קבוצות פעלים', questions: qs, back: '#/verbs?tab=groups', retry: () => groupDrill(root) });
}

function adjTab(el, ajp) {
  const w = ADJS.find(a => a.jp === ajp) || ADJS[0];
  const f = Conj.adj(w);
  const o = VerbUI;
  el.innerHTML = `
  <div class="verb-layout">
    <section class="card verb-pick">
      <input id="afilter" placeholder="🔍 חיפוש…" autocomplete="off">
      <div class="verb-list">${ADJS.map(a => `<a class="vchip ${a.id === w.id ? 'on' : ''} ${a.type === 'i-adj' ? 'g-i' : 'g-na'}" href="#/verbs?tab=adj&a=${encodeURIComponent(a.jp)}" data-s="${esc(a.jp + ' ' + a.he + ' ' + a.romaji)}"><span lang="ja">${esc(a.jp)}</span><small>${esc(a.he)}</small></a>`).join('')}</div>
    </section>
    <section class="card verb-card">
      <div class="vc-head"><div class="vc-emo">${w.emoji || ''}</div>
        <div><div class="vc-jp">${UI.jp(w.jp)} ${UI.sayBtn(w.jp)}</div><div class="ro" dir="ltr">${esc(w.romaji)}</div><div class="vc-he">${esc(w.he)}</div></div>
        <span class="badge ${w.type === 'i-adj' ? 'u' : 'ru'}">${w.type === 'i-adj' ? 'תואר い' : 'תואר な'}</span></div>
      ${w.jp === 'いい' ? '<div class="banner">⚠️ いい הוא יוצא דופן: מטים אותו מהצורה よい.</div>' : ''}
      ${['きれい', 'きらい'].includes(w.jp) ? '<div class="banner">⚠️ נגמר ב-い אבל זה תואר な!</div>' : ''}
      <div class="tbl-wrap"><table class="tbl conj"><tbody>
        ${Conj.ADJ_FORMS.map(F => { const t = F.id === 'noun' ? (w.type === 'i-adj' ? w.jp : w.jp + '[な]') + ' ひと' : f[F.id];
          return `<tr><td>${esc(F.label)}</td><td>${UI.jp(t)} ${UI.sayBtn(t, 'sm')}</td>${Store.s.settings.romaji ? `<td class="ro" dir="ltr">${esc(Kana.toRomaji(t))}</td>` : ''}</tr>`; }).join('')}
      </tbody></table></div>
      <p class="small muted">בשורה "לפני שם עצם" הדוגמה היא עם ${UI.jp('ひと')} (אדם).</p>
    </section>
  </div>
  <section class="card practice-panel">
    <div class="card-h">🏋️ תרגול הטיות שמות תואר</div>
    <div class="chips">${Conj.ADJ_FORMS.filter(F => !['plain', 'noun'].includes(F.id)).map(F => `<button class="chip ${o.adjForms.includes(F.id) ? 'on' : ''}" data-af="${F.id}">${esc(F.label)}</button>`).join('')}</div>
    <div class="opt-row"><span class="opt-l">סוג תשובה:</span>${[['mc', 'בחירה מרובה'], ['type', 'הקלדה']].map(([m, n]) => `<button class="chip ${o.adjMode === m ? 'on' : ''}" data-am="${m}">${n}</button>`).join('')}</div>
    <div class="row center"><a class="btn primary lg" id="ago" href="#/verbs?run=adj&forms=${o.adjForms.join(',')}&mode=${o.adjMode}">התחילו ▶</a></div>
  </section>`;
  const inp = $('#afilter', el);
  inp.oninput = () => { const q = inp.value.trim().toLowerCase(); const qh = Kana.toHira(Kana.romajiToHira(q)); $$('.vchip', el).forEach(c => c.hidden = q && !(c.dataset.s.toLowerCase().includes(q) || c.dataset.s.includes(qh))); };
  $$('[data-af]', el).forEach(b => b.onclick = () => { const x = b.dataset.af; o.adjForms = o.adjForms.includes(x) ? o.adjForms.filter(y => y !== x) : [...o.adjForms, x]; if (!o.adjForms.length) o.adjForms = [x]; adjTab(el, ajp); });
  $$('[data-am]', el).forEach(b => b.onclick = () => { o.adjMode = b.dataset.am; adjTab(el, ajp); });
}

function adjDrill(root, params) {
  const forms = (params.get('forms') || 'neg,past').split(','), mode = params.get('mode') || 'mc';
  const qs = [];
  let guard = 0;
  while (qs.length < 15 && guard++ < 200) {
    const w = pick(ADJS), fid = pick(forms);
    if (qs.some(q => q._k === w.id + fid)) continue;
    const right = Conj.adj(w)[fid];
    const F = Conj.ADJ_FORMS.find(x => x.id === fid);
    const prompt = `<div class="big-jp">${UI.jp(w.jp)}</div><div class="muted">${esc(w.he)} · ${w.type === 'i-adj' ? 'תואר い' : 'תואר な'}</div><div class="form-ask">← ${esc(F.label)}</div>`;
    const reveal = `<div class="reveal-word">${UI.jp(right, 'big')} <span class="ro" dir="ltr">${esc(Kana.toRomaji(right))}</span></div>`;
    const explain = w.jp === 'いい' ? 'いい מוטה מ-よい.' : ['きれい', 'きらい'].includes(w.jp) ? 'זהירות – זה תואר な!' : (w.type === 'i-adj' ? 'תואר い: מורידים את い ומוסיפים くない / かった / くなかった / くて / く.' : 'תואר な: מוסיפים じゃない / だった / じゃなかった / で / に.');
    if (mode === 'type') qs.push({ _k: w.id + fid, type: 'type', label: 'הטו את שם התואר', prompt, answers: [right], reveal, explain, sayAfter: right });
    else qs.push({ _k: w.id + fid, type: 'mc', label: 'בחרו את ההטיה הנכונה', prompt, options: [QB.jpOpt(right, 'ok'), ...shuffle(Conj.adjWrong(w, fid)).slice(0, 3).map(x => QB.jpOpt(x))], answer: 'ok', optCls: 'jp-opts', reveal, explain, sayAfter: right });
  }
  Quiz.run(root, { title: '🌶️ הטיות שמות תואר', questions: qs, back: '#/verbs?tab=adj', xpPer: 2, retry: () => adjDrill(root, params), onAnswer: (q, ok) => { if (ok) { Store.s.stats.conj++; Store.save(); } } });
}
