'use strict';
/* =========================================================
   にほんご道場 – core: utils, kana conversion, storage,
   progress/XP, SRS, TTS, sound effects, UI helpers
   ========================================================= */

/* registry of page views (filled by js/views/*.js) */
const Views = {};

/* ---------- utils ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const pick = a => a[Math.floor(Math.random() * a.length)];
const uniq = a => [...new Set(a)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dateStr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayStr = () => dateStr(new Date());
const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); };
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function deepMerge(base, over) {
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return over === undefined ? base : over;
  const out = { ...base };
  if (over && typeof over === 'object') for (const k in over) out[k] = (k in base) ? deepMerge(base[k], over[k]) : over[k];
  return out;
}

/* ---------- Kana conversion ---------- */
const Kana = (() => {
  const V = 'aiueo';
  const R2H = {};
  'あいうえお'.split('').forEach((h, i) => R2H[V[i]] = h);
  const rows = { k: 'かきくけこ', g: 'がぎぐげご', s: 'さしすせそ', z: 'ざじずぜぞ', t: 'たちつてと', d: 'だぢづでど', n: 'なにぬねの', h: 'はひふへほ', b: 'ばびぶべぼ', p: 'ぱぴぷぺぽ', m: 'まみむめも', r: 'らりるれろ' };
  for (const c in rows) V.split('').forEach((v, i) => R2H[c + v] = rows[c][i]);
  const yi = { k: 'き', g: 'ぎ', n: 'に', h: 'ひ', b: 'び', p: 'ぴ', m: 'み', r: 'り' };
  const ys = { a: 'ゃ', u: 'ゅ', o: 'ょ' };
  for (const c in yi) for (const v in ys) R2H[c + 'y' + v] = yi[c] + ys[v];
  Object.assign(R2H, {
    ya: 'や', yu: 'ゆ', yo: 'よ', ye: 'いぇ', wa: 'わ', wo: 'を', wi: 'うぃ', we: 'うぇ',
    shi: 'し', chi: 'ち', tsu: 'つ', fu: 'ふ', ji: 'じ',
    sha: 'しゃ', shu: 'しゅ', sho: 'しょ', she: 'しぇ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
    ja: 'じゃ', ju: 'じゅ', jo: 'じょ', je: 'じぇ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ', zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
    cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', che: 'ちぇ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ', cya: 'ちゃ', cyu: 'ちゅ', cyo: 'ちょ',
    dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',
    fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', fyu: 'ふゅ',
    thi: 'てぃ', dhi: 'でぃ', thu: 'てゅ', dhu: 'でゅ', twu: 'とぅ', dwu: 'どぅ', tsa: 'つぁ',
    va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
    xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', la: 'ぁ', li: 'ぃ', lu: 'ぅ', le: 'ぇ', lo: 'ぉ',
    xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ', xtu: 'っ', xtsu: 'っ', ltu: 'っ', ltsu: 'っ', xwa: 'ゎ',
    '-': 'ー', ',': '、', '.': '。', '?': '？', '!': '！', '~': '〜'
  });
  const KEYS = Object.keys(R2H);
  const isPrefix = s => KEYS.some(k => k.length > s.length && k.startsWith(s));

  const toKata = s => String(s).replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  const toHira = s => String(s).replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const isKata = s => /[ァ-ヺ]/.test(s) && !/[ぁ-ゖ]/.test(s);

  /** romaji -> hiragana. final=false keeps an unfinished tail (for live typing). */
  function romajiToHira(input, final = true) {
    const s = String(input);
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i], lc = c.toLowerCase();
      if (!/[a-z'\-.,?!~]/i.test(c)) { out += c; i++; continue; }
      const rest = s.slice(i).toLowerCase();
      if (lc === 'n') {
        const nx = rest[1];
        if (nx === undefined) { out += final ? 'ん' : c; i++; continue; }
        if (nx === "'") { out += 'ん'; i += 2; continue; }
        if (nx === 'n') {
          const nx2 = rest[2];
          if (nx2 === undefined && !final) { out += s.slice(i); break; } // wait: "nn" + vowel means ん + な-row
          if (nx2 !== undefined && /[aiueo]/.test(nx2)) { out += 'ん'; i += 1; continue; }
          out += 'ん'; i += 2; continue;
        }
        if (!/[aiueoy]/.test(nx)) { out += 'ん'; i++; continue; }
      }
      if (/[bcdfghjkmpqrstvwyz]/.test(lc) && rest[1] === lc) { out += 'っ'; i++; continue; }
      if (lc === 't' && rest.startsWith('tch')) { out += 'っ'; i++; continue; }
      let matched = false;
      for (let L = 4; L >= 1; L--) {
        const sub = rest.slice(0, L);
        if (sub.length === L && R2H[sub]) { out += R2H[sub]; i += L; matched = true; break; }
      }
      if (matched) continue;
      if (!final && isPrefix(rest)) { out += s.slice(i); break; }
      out += c; i++;
    }
    return out;
  }

  /* hiragana -> romaji (Hepburn) */
  const H2R = {}, H2R2 = {};
  'あいうえお'.split('').forEach((h, i) => H2R[h] = V[i]);
  for (const c in rows) V.split('').forEach((v, i) => H2R[rows[c][i]] = c + v);
  Object.assign(H2R, {
    'し': 'shi', 'ち': 'chi', 'つ': 'tsu', 'ふ': 'fu', 'じ': 'ji', 'ぢ': 'ji', 'づ': 'zu', 'を': 'o', 'わ': 'wa',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo', 'ゔ': 'vu', 'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'ゎ': 'wa', 'ん': 'n',
    '。': '.', '、': ',', '？': '?', '！': '!', '「': '"', '」': '"', '・': ' ', '　': ' ', '〜': '~', '＿': '___'
  });
  for (const c in yi) for (const v in ys) H2R2[yi[c] + ys[v]] = c + 'y' + v;
  Object.assign(H2R2, {
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho', 'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo', 'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo', 'てぃ': 'ti', 'でぃ': 'di', 'てゅ': 'tyu', 'でゅ': 'dyu', 'とぅ': 'tu', 'どぅ': 'du',
    'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo', 'ふゅ': 'fyu', 'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo',
    'しぇ': 'she', 'じぇ': 'je', 'ちぇ': 'che', 'いぇ': 'ye', 'つぁ': 'tsa', 'ゔぁ': 'va', 'ゔぃ': 'vi', 'ゔぇ': 've', 'ゔぉ': 'vo'
  });

  function hiraToRomaji(str) {
    const s = toHira(str);
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const two = s.substr(i, 2);
      if (two.length === 2 && H2R2[two]) { out += H2R2[two]; i++; continue; }
      const c = s[i];
      if (c === 'っ') {
        const r = H2R2[s.substr(i + 1, 2)] || H2R[s[i + 1]] || '';
        if (r && /^[a-z]/.test(r)) out += r.startsWith('ch') ? 't' : r[0];
        continue;
      }
      if (c === 'ー') { const lv = out.slice(-1); out += 'aiueo'.includes(lv) ? lv : '-'; continue; }
      if (c === 'ん') {
        const nx = s[i + 1]; const r = nx ? (H2R2[s.substr(i + 1, 2)] || H2R[nx] || '') : '';
        out += (r && /^[aiueoy]/.test(r)) ? "n'" : 'n'; continue;
      }
      out += H2R[c] !== undefined ? H2R[c] : c;
    }
    return out;
  }
  function particleRomaji(p) {
    if (p === 'は') return 'wa'; if (p === 'へ') return 'e'; if (p === 'を') return 'o';
    if (p.length > 1 && p.endsWith('は')) return hiraToRomaji(p.slice(0, -1)) + 'wa';
    return hiraToRomaji(p);
  }
  /** Markup aware: [は] = particle, | = soft word boundary */
  function toRomaji(str) {
    const parts = String(str).replace(/[{}]/g, '').split(/(\[[^\]]*\]|\|)/);
    const out = parts.map(p => {
      if (p === '|') return ' ';
      if (p.startsWith('[') && p.endsWith(']')) return ' ' + particleRomaji(p.slice(1, -1)) + ' ';
      return hiraToRomaji(p);
    }).join('');
    return out.replace(/\s+/g, ' ').replace(/ ([.,?!])/g, '$1').replace(/,(?=\S)/g, ', ').replace(/konnichiha/g, 'konnichiwa').replace(/konbanha/g, 'konbanwa').trim();
  }
  const VK = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };
  function norm(s) {
    let h = toHira(romajiToHira(String(s).trim(), true));
    h = h.replace(/[\s　。、．，！？!?.,・「」\[\]|~〜]/g, '');
    let o = '';
    for (const c of h) {
      if (c === 'ー' || c === '-') { const r = H2R[o.slice(-1)] || ''; o += VK[r.slice(-1)] || ''; }
      else o += c;
    }
    return o;
  }
  const loose = h => h.replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/ぢ/g, 'じ').replace(/づ/g, 'ず');
  function matches(input, targets) {
    const a = norm(input); if (!a) return false;
    return [].concat(targets).some(t => { const b = norm(t); return a === b || loose(a) === loose(b); });
  }
  const strip = s => String(s).replace(/[\[\]|{}]/g, '');
  return { romajiToHira, hiraToRomaji, toRomaji, toKata, toHira, isKata, norm, matches, strip, H2R };
})();

/* ---------- Storage ---------- */
const Store = {
  KEY: 'nihongo-dojo-v1',
  s: null,
  defaults() {
    return {
      v: 1, xp: 0, created: todayStr(),
      streak: { count: 0, last: '', best: 0 },
      daily: { date: '', xp: 0 },
      history: {},
      srs: {}, kana: {}, lessons: {}, write: {},
      stats: { answers: 0, correct: 0, sentences: 0, conj: 0, particles: 0, games: 0, cards: 0, perfect: 0, bestSprint: 0, bestRush: 0, numbers: 0, written: 0 },
      ach: {},
      newToday: { date: '', n: 0 },
      settings: { romaji: true, kanji: true, newPerDay: 10, rate: 0.85, voice: '', sound: true, theme: 'auto', dailyGoal: 50, autoplay: true }
    };
  },
  load() {
    try { const raw = localStorage.getItem(this.KEY); this.s = raw ? deepMerge(this.defaults(), JSON.parse(raw)) : this.defaults(); }
    catch (e) { this.s = this.defaults(); }
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.s)); } catch (e) { /* ignore */ } },
  reset() { this.s = this.defaults(); this.save(); }
};

/* ---------- Ranks / XP / streak / achievements ---------- */
const RANKS = [
  { min: 1, name: 'חגורה לבנה', jp: 'しろおび', color: '#d9d4c7' },
  { min: 3, name: 'חגורה צהובה', jp: 'きおび', color: '#e8c23a' },
  { min: 5, name: 'חגורה כתומה', jp: 'オレンジおび', color: '#e8833a' },
  { min: 8, name: 'חגורה ירוקה', jp: 'みどりおび', color: '#3e9a5d' },
  { min: 11, name: 'חגורה כחולה', jp: 'あおおび', color: '#3a6fc4' },
  { min: 15, name: 'חגורה סגולה', jp: 'むらさきおび', color: '#7a4bb5' },
  { min: 20, name: 'חגורה חומה', jp: 'ちゃおび', color: '#7a5233' },
  { min: 26, name: 'חגורה שחורה', jp: 'くろおび', color: '#1d1b19' }
];
const Prog = {
  levelInfo(xp = Store.s.xp) {
    let l = 1; while (xp >= 50 * (l + 1) * l) l++;
    const cur = 50 * l * (l - 1), next = 50 * (l + 1) * l;
    const rank = [...RANKS].reverse().find(r => l >= r.min);
    return { level: l, cur, next, pct: (xp - cur) / (next - cur) * 100, rank };
  },
  touchStreak() {
    const s = Store.s, t = todayStr();
    if (s.streak.last === t) return;
    s.streak.count = (s.streak.last === yesterdayStr()) ? s.streak.count + 1 : 1;
    s.streak.last = t;
    s.streak.best = Math.max(s.streak.best || 0, s.streak.count);
  },
  addXP(n, silent) {
    if (!n) return;
    const s = Store.s, t = todayStr();
    const lvBefore = this.levelInfo().level;
    if (s.daily.date !== t) s.daily = { date: t, xp: 0 };
    const goalBefore = s.daily.xp >= s.settings.dailyGoal;
    s.xp += n; s.daily.xp += n;
    s.history[t] = (s.history[t] || 0) + n;
    this.touchStreak();
    Store.save();
    if (!silent) UI.xpPop(n);
    const lv = this.levelInfo().level;
    if (lv > lvBefore) { SFX.play('level'); UI.toast(`🎉 עליתם לרמה ${lv}!`, 'gold'); UI.confetti(); }
    if (!goalBefore && s.daily.xp >= s.settings.dailyGoal) { UI.toast('🎯 היעד היומי הושג! すごい！', 'good'); UI.confetti(); }
    UI.updateSidebar();
    this.checkAch();
  },
  answer(ok) { const st = Store.s.stats; st.answers++; if (ok) st.correct++; },
  todayXP() { const s = Store.s; return s.daily.date === todayStr() ? s.daily.xp : 0; },
  streak() { const s = Store.s; return (s.streak.last === todayStr() || s.streak.last === yesterdayStr()) ? s.streak.count : 0; },
  kanaMastered(ch) { const k = Store.s.kana[ch]; return !!k && k.r >= 3 && k.r / (k.r + k.w) >= 0.75; },
  checkAch() {
    const s = Store.s; let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (s.ach[a.id]) continue;
      let ok = false; try { ok = a.test(s); } catch (e) { }
      if (ok) { s.ach[a.id] = todayStr(); changed = true; setTimeout(() => UI.toast(`🏅 הישג חדש: ${a.icon} ${a.name}`, 'gold'), 600); }
    }
    if (changed) Store.save();
  }
};
const lessonsDone = s => Object.values(s.lessons).filter(l => l.done).length;
const ACHIEVEMENTS = [
  { id: 'first', icon: '🌱', name: 'צעד ראשון', desc: 'צברו את ה-XP הראשון', test: s => s.xp > 0 },
  { id: 'lesson1', icon: '📖', name: 'תלמיד/ה', desc: 'סיימו שיעור דקדוק ראשון', test: s => lessonsDone(s) >= 1 },
  { id: 'lesson10', icon: '🎓', name: 'חוקר/ת דקדוק', desc: 'סיימו 10 שיעורי דקדוק', test: s => lessonsDone(s) >= 10 },
  { id: 'lessonAll', icon: '🏯', name: 'סֵנְסֵיי', desc: 'סיימו את כל שיעורי הדקדוק', test: s => lessonsDone(s) >= LESSONS.length },
  { id: 'words25', icon: '🗂️', name: '25 מילים', desc: 'למדו 25 מילים (רמה 3+ בחזרה המרווחת)', test: () => SRS.learnedCount() >= 25 },
  { id: 'words100', icon: '📚', name: '100 מילים', desc: 'למדו 100 מילים', test: () => SRS.learnedCount() >= 100 },
  { id: 'words250', icon: '🏆', name: '250 מילים', desc: 'למדו 250 מילים', test: () => SRS.learnedCount() >= 250 },
  { id: 'hira', icon: 'あ', name: 'אדון ההירגנה', desc: 'שלטו בכל 46 אותיות ההירגנה הבסיסיות', test: () => KANA.hiraBasic.every(k => Prog.kanaMastered(k.k)) },
  { id: 'kata', icon: 'ア', name: 'אדון הקטקנה', desc: 'שלטו בכל 46 אותיות הקטקנה הבסיסיות', test: () => KANA.kataBasic.every(k => Prog.kanaMastered(k.k)) },
  { id: 'streak3', icon: '🔥', name: 'שלושה ברצף', desc: 'למדו 3 ימים ברצף', test: s => s.streak.best >= 3 },
  { id: 'streak7', icon: '🔥', name: 'שבוע שלם', desc: 'למדו 7 ימים ברצף', test: s => s.streak.best >= 7 },
  { id: 'streak30', icon: '🌋', name: 'חודש של אש', desc: 'למדו 30 ימים ברצף', test: s => s.streak.best >= 30 },
  { id: 'xp1000', icon: '⭐', name: '1,000 XP', desc: 'צברו 1,000 נקודות ניסיון', test: s => s.xp >= 1000 },
  { id: 'xp5000', icon: '🌟', name: '5,000 XP', desc: 'צברו 5,000 נקודות ניסיון', test: s => s.xp >= 5000 },
  { id: 'sent25', icon: '🧩', name: 'בנאי/ת משפטים', desc: 'בנו 25 משפטים נכונים', test: s => s.stats.sentences >= 25 },
  { id: 'conj50', icon: '🔄', name: 'מטה הפעלים', desc: '50 הטיות פעלים נכונות', test: s => s.stats.conj >= 50 },
  { id: 'part50', icon: '🎯', name: 'צלף חלקיקים', desc: '50 חלקיקים נכונים', test: s => s.stats.particles >= 50 },
  { id: 'perfect', icon: '💯', name: 'מושלם!', desc: 'סיימו תרגול בלי אף טעות', test: s => s.stats.perfect > 0 },
  { id: 'sprint30', icon: '⚡', name: 'ברק', desc: 'קבלו 30+ בספרינט הקאנה', test: s => s.stats.bestSprint >= 30 },
  { id: 'write46', icon: '✍️', name: 'קליגרף', desc: 'כתבו בלי טעויות את כל 46 אותיות הקטקנה הבסיסיות', test: s => KANA.kataBasic.every(k => s.write && s.write[k.k] && s.write[k.k].r > 0) },
  { id: 'write100', icon: '🖌️', name: 'יד מאומנת', desc: 'כתבו 100 אותיות בתרגול הכתיבה', test: s => (s.stats.written || 0) >= 100 },
  { id: 'num50', icon: '🔢', name: 'מחשבון אנושי', desc: '50 תשובות נכונות במאמן המספרים', test: s => (s.stats.numbers || 0) >= 50 },
  { id: 'cards200', icon: '🃏', name: 'מאסטר כרטיסיות', desc: 'חזרו על 200 כרטיסיות', test: s => s.stats.cards >= 200 }
];

/* ---------- SRS (Leitner-style spaced repetition) ---------- */
const SRS = {
  MIN: 60e3, DAY: 864e5,
  IV: [0, 10 * 60e3, 864e5, 2 * 864e5, 4 * 864e5, 8 * 864e5, 16 * 864e5, 35 * 864e5, 90 * 864e5],
  get(id) { return Store.s.srs[id]; },
  status(id) { const c = this.get(id); if (!c) return 'new'; if (c.b >= 3) return 'known'; return 'learning'; },
  isDue(id) { const c = this.get(id); return !!c && c.due <= Date.now(); },
  dueIds() { const now = Date.now(); return Object.keys(Store.s.srs).filter(id => Store.s.srs[id].due <= now && VOCAB_BY_ID[id]); },
  learnedCount() { return Object.values(Store.s.srs).filter(c => c.b >= 3).length; },
  /** q: 0 again, 1 hard, 2 good, 3 easy */
  grade(id, q) {
    const s = Store.s; const now = Date.now();
    const c = s.srs[id] || { b: 0, due: 0, r: 0, w: 0, seen: now };
    if (q === 0) { c.b = Math.max(1, Math.min(c.b, 2) - 1) ; c.w++; c.due = now + this.MIN; }
    else {
      if (q === 1) c.b = Math.max(1, c.b);
      if (q === 2) c.b = Math.min(8, c.b + 1);
      if (q === 3) c.b = Math.min(8, c.b + 2);
      c.r++;
      const iv = this.IV[c.b] * (q === 1 ? 0.6 : 1);
      c.due = now + iv;
    }
    s.srs[id] = c; Store.save();
  },
  preview(id, q) {
    const c = this.get(id) || { b: 0 };
    if (q === 0) return '1 דק׳';
    let b = c.b; if (q === 1) b = Math.max(1, b); if (q === 2) b = Math.min(8, b + 1); if (q === 3) b = Math.min(8, b + 2);
    const ms = this.IV[b] * (q === 1 ? 0.6 : 1);
    return fmtDur(ms);
  },
  /** light-touch update from quizzes */
  quiz(id, ok) {
    const c = this.get(id);
    if (ok) { if (!c || c.due <= Date.now()) this.grade(id, 2); }
    else this.grade(id, 0);
  }
};
function fmtDur(ms) {
  if (ms < 3600e3) return Math.max(1, Math.round(ms / 60e3)) + ' דק׳';
  if (ms < 864e5) return Math.round(ms / 3600e3) + ' שע׳';
  const d = Math.round(ms / 864e5); return d === 1 ? 'יום' : d + ' ימים';
}

/* ---------- Text to speech ---------- */
const TTS = {
  /* inside the Android app, speech goes through the native bridge (WebView has no speechSynthesis) */
  native: typeof window.AndroidBridge !== 'undefined',
  ok: typeof window.AndroidBridge !== 'undefined' || 'speechSynthesis' in window,
  voices: [],
  init() {
    if (this.native || !this.ok) return;
    const load = () => { this.voices = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang) || /japan|日本/i.test(v.name)); };
    load(); speechSynthesis.onvoiceschanged = load;
    setTimeout(load, 500); setTimeout(load, 2000);
  },
  /** eSpeak's "Japanese" voices (Linux) can't read kana – they just say "Japanese letter" */
  isRobot(v) { return !!v && (/espeak/i.test(v.name) || /^japanese(\+.*)?$/i.test(v.name.trim())); },
  goodVoices() { return this.voices.filter(v => !this.isRobot(v)); },
  pickVoice() {
    const pref = Store.s.settings.voice, good = this.goodVoices();
    return this.voices.find(v => v.name === pref)
      || good.find(v => /natural|online|nanami|keita/i.test(v.name))
      || good.find(v => /google/i.test(v.name))
      || good.find(v => /jtalk|nitech|kyoko|otoya|haruka|ayumi|ichiro|sayaka/i.test(v.name))
      || good[0] || null;
  },
  warned: false,
  speak(text, rate) {
    if (!this.ok || !text) return;
    const t = Kana.strip(text).replace(/＿+/g, '、');
    if (this.native) { try { window.AndroidBridge.speak(t, rate || Store.s.settings.rate || 0.85); } catch (e) { } return; }
    speechSynthesis.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'ja-JP';
      const v = this.pickVoice();
      if (v) u.voice = v;
      else if (this.voices.length && this.voices.every(x => this.isRobot(x))) {
        /* only eSpeak is installed: it would whisper "Japanese letter" instead of the word */
        if (!this.warned) { this.warned = true; UI.toast('🔇 אין במחשב קול יפני אמיתי (רק eSpeak). ההוראות להתקנה – בדף הבית.', 'bad'); }
        return;
      }
      u.rate = rate || Store.s.settings.rate || 0.85;
      speechSynthesis.speak(u);
    }, 30);
  },
  hasJa() { if (this.native) { try { return window.AndroidBridge.hasJa(); } catch (e) { return false; } } return this.goodVoices().length > 0; },
  stop() { if (this.native) { try { window.AndroidBridge.stop(); } catch (e) { } } else if (window.speechSynthesis) speechSynthesis.cancel(); }
};

/* ---------- Sound effects (WebAudio) ---------- */
const SFX = {
  ctx: null,
  play(type) {
    if (!Store.s.settings.sound) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.ctx, t0 = ctx.currentTime;
      const seq = {
        good: [[784, 0, .08], [1047, .08, .16]],
        bad: [[196, 0, .14], [165, .12, .2]],
        done: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .3]],
        level: [[523, 0, .08], [784, .08, .08], [1047, .16, .08], [1319, .24, .35]],
        flip: [[620, 0, .05]],
        tick: [[1200, 0, .03]]
      }[type] || [];
      seq.forEach(([f, st, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type === 'bad' ? 'triangle' : 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + st);
        g.gain.exponentialRampToValueAtTime(type === 'bad' ? 0.18 : 0.14, t0 + st + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + d);
        o.connect(g).connect(ctx.destination);
        o.start(t0 + st); o.stop(t0 + st + d + 0.02);
      });
    } catch (e) { }
  }
};

/* ---------- UI helpers ---------- */
const UI = {
  /** Japanese text with markup -> html. [x] = particle highlight, | = invisible boundary */
  jpHTML(str) {
    return esc(str).replace(/\{([^}]*)\}/g, '<span class="tw">$1</span>').replace(/\[([^\]]*)\]/g, '<span class="pt">$1</span>').replace(/\|/g, '').replace(/＿+/g, '<span class="blank">＿＿</span>');
  },
  /** clickable Japanese span */
  jp(str, cls = '') { return `<span class="jp say ${cls}" data-say="${esc(Kana.strip(str))}" lang="ja">${this.jpHTML(str)}</span>`; },
  ro(str, override) { return Store.s.settings.romaji ? `<span class="ro" dir="ltr">${esc(override || Kana.toRomaji(str))}</span>` : ''; },
  /** Hebrew rich text: {{jp}} becomes clickable Japanese, **b** bold */
  rich(text) {
    return String(text).replace(/\{\{(.+?)\}\}/g, (m, j) => this.jp(j, 'inline'));
  },
  sayBtn(text, cls = '') { return `<button class="say-btn ${cls}" data-say="${esc(Kana.strip(text))}" title="השמע">🔊</button>`; },
  pbar(pct, cls = '') { return `<div class="pbar ${cls}"><div style="width:${clamp(pct, 0, 100)}%"></div></div>`; },
  toast(msg, type = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + type; el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  },
  xpPop(n) {
    const el = document.createElement('div');
    el.className = 'xp-pop'; el.textContent = '+' + n + ' XP';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  },
  confetti() {
    const c = document.createElement('canvas'); c.className = 'confetti';
    c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const colors = ['#d1462f', '#e8c23a', '#2f8a57', '#2f4f86', '#e88aa8', '#7a4bb5'];
    const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.4, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - .5) * .3, col: pick(colors), sh: Math.random() < .3 ? 'c' : 'r' }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.col;
        if (p.sh === 'c') { ctx.beginPath(); ctx.arc(0, 0, p.r * .6, 0, 7); ctx.fill(); } else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if (++f < 170) requestAnimationFrame(tick); else c.remove();
    })();
  },
  updateSidebar() {
    const s = Store.s; if (!s) return;
    const li = Prog.levelInfo();
    const el = $('#side-stats'); if (!el) return;
    const goalPct = Prog.todayXP() / s.settings.dailyGoal * 100;
    el.innerHTML = `
      <div class="ss-row"><span class="ss-fire ${Prog.streak() ? 'on' : ''}">🔥 ${Prog.streak()}</span><span class="ss-lv" style="--belt:${li.rank.color}">רמה ${li.level}</span></div>
      <div class="ss-label">${esc(li.rank.name)} · ${s.xp} XP</div>
      ${this.pbar(li.pct, 'thin')}
      <div class="ss-label">יעד יומי: ${Prog.todayXP()}/${s.settings.dailyGoal}</div>
      ${this.pbar(goalPct, 'thin gold')}`;
  },
  applyTheme() {
    const t = Store.s.settings.theme;
    if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  },
  /** Bind live romaji -> kana conversion on an input. getKata() decides katakana output. */
  bindKanaInput(input, getKata = () => false) {
    input.addEventListener('input', e => {
      if (e.isComposing) return;
      const v = input.value;
      if (!/[a-z\-]/i.test(v)) return;
      let conv = Kana.romajiToHira(v, false);
      if (getKata()) conv = conv.replace(/[ぁ-ゖ]+/g, m => Kana.toKata(m));
      if (conv !== v) { input.value = conv; input.setSelectionRange(conv.length, conv.length); }
    });
  },
  finalizeKana(input, kata) {
    let v = Kana.romajiToHira(input.value, true);
    if (kata) v = v.replace(/[ぁ-ゖ]+/g, m => Kana.toKata(m));
    input.value = v; return v;
  }
};

/* global click handler for any [data-say] element */
document.addEventListener('click', e => {
  const s = e.target.closest('[data-say]');
  if (s && !s.closest('[data-nosay]')) { TTS.speak(s.dataset.say); s.classList.add('speaking'); setTimeout(() => s.classList.remove('speaking'), 600); }
});
