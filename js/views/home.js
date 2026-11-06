'use strict';
/* ===== Home, Progress & Settings, Cheat sheet ===== */

const TIPS = [
  'לחצו על כל טקסט יפני באתר כדי לשמוע אותו 🔊 – הקשבה חוזרת היא הדרך הכי טובה לשפר הגייה.',
  'עדיף 15 דקות כל יום מאשר שעתיים פעם בשבוע. החזרה המרווחת עובדת הכי טוב כשמגיעים כל יום.',
  'אל תפחדו מטעויות! כל טעות בתרגול נכנסת לרשימת "כדאי לחזור על" ותופיע שוב בחזרה היומית.',
  'כשלומדים פועל חדש – למדו מיד את הקבוצה שלו (る / う / חריג). זה יחסוך לכם המון בלבול בהטיות.',
  'נסו לבנות משפט משלכם עם כל מילה חדשה. אפילו {{これ[は] ＿|です}} פשוט עוזר לזכור.',
  'בקטקנה, הקו הארוך ー מאריך את התנועה: {{コーヒー}} = kōhī. כשמקלידים אצלנו, אפשר להקליד "-".',
  'は כחלקיק נקרא wa, へ נקרא e, ו-を נקרא o. בכל מקום אחר הם נקראים כרגיל.',
  'יפנים משמיטים את "אני" ו"אתה" כשזה ברור מההקשר. {{たべました[か]。}} = "אכלת?"',
  'ביפנית הפועל תמיד בסוף. אם הבנתם את הסוף – הבנתם את המשפט!',
  'מילות שאלה לא זזות: מחליפים את התשובה במילת השאלה ומוסיפים か. {{これ[は] なん|です[か]。}}',
  'כדי לשמוע הגייה יפנית מעולה, פתחו את האתר ב-Microsoft Edge – יש בו קולות יפניים טבעיים (Nanami).',
  'שימו לב לאותיות הדומות: さ/ち, ぬ/め, シ/ツ, ソ/ン. במאמן הקאנה יש מצב מיוחד "זוגות מבלבלים".',
  'ね בסוף משפט = "נכון?", よ = "תאמין לי!". יפנים משתמשים בהם כל הזמן – נסו גם אתם.',
  'צורת て היא המפתח לדקדוק מתקדם: בקשות, פעולה מתמשכת, רשות ואיסור. שווה להשקיע בה!',
  'בטלפון או במחשב, נסו להפעיל מקלדת יפנית ולהקליד ברומאג׳י – זו תוספת תרגול נהדרת.'
];

function voiceWarning() {
  if (!TTS.ok) return `<div class="banner warn">⚠️ הדפדפן הזה לא תומך בהקראה. מומלץ להשתמש ב-Chrome או Edge.</div>`;
  if (TTS.hasJa()) return '';
  if (TTS.native) return `<div class="banner warn">🔇 לא נמצא קול יפני בטלפון, אז ההקראה לא תעבוד.<br>
    התקינו אותו: <b>הגדרות → מערכת → שפות וקלט → פלט טקסט לדיבור → מנוע Google → התקנת נתוני קול → יפנית (日本語)</b>.<br>
    <button class="btn sm" onclick="AndroidBridge.installVoice()">⬇️ פתיחת הגדרות הקול</button></div>`;
  if (/Linux/i.test(navigator.userAgent)) return `<div class="banner warn">🔇 לא נמצא קול יפני אמיתי במחשב (ב-Linux יש בדרך כלל רק eSpeak, שאומר "Japanese letter" במקום המילה).<br>
    <b>הפתרון:</b> בתיקיית הפרויקט הריצו בטרמינל: <code dir="ltr">bash tools/linux-japanese-voice.sh</code><br>
    הסקריפט מתקין את הקול היפני Open JTalk ומחבר אותו ל-Firefox. אחר כך סגרו את Firefox לגמרי ופתחו מחדש.<br>
    <span class="small">ב-Chrome/Chromium על Linux הקולות של Google לא זמינים, לכן ההקראה עובדת דרך אותו מנגנון.</span></div>`;
  return `<div class="banner warn">🔇 לא נמצא קול יפני במחשב, אז ההקראה עלולה לא לעבוד.<br>
    <b>הפתרון המהיר:</b> פתחו את האתר ב-<b>Microsoft Edge</b> או <b>Chrome</b> (יש בהם קולות יפניים מובנים).<br>
    <b>או:</b> הגדרות Windows → זמן ושפה → דיבור → "הוסף קולות" → 日本語 (יפנית).</div>`;
}

Views.home = root => {
  const s = Store.s;
  const h = new Date().getHours();
  const greet = h < 11 ? ['おはよう！', 'בוקר טוב'] : h < 18 ? ['こんにちは！', 'צהריים טובים'] : ['こんばんは！', 'ערב טוב'];
  const li = Prog.levelInfo();
  const due = SRS.dueIds().length;
  const next = LESSONS.find(l => !(s.lessons[l.id] && s.lessons[l.id].done));
  const wotd = VOCAB[hashStr(todayStr()) % VOCAB.length];
  const tip = TIPS[hashStr(todayStr() + 't') % TIPS.length];
  const goalPct = clamp(Prog.todayXP() / s.settings.dailyGoal * 100, 0, 100);
  const isNew = s.xp === 0;
  const hiraM = KANA.hiraBasic.filter(k => Prog.kanaMastered(k.k)).length;
  const kataM = KANA.kataBasic.filter(k => Prog.kanaMastered(k.k)).length;
  const unitPct = u => { const ls = LESSONS.filter(l => l.unit === u); return ls.filter(l => s.lessons[l.id] && s.lessons[l.id].done).length / ls.length * 100; };
  const path = [
    { icon: 'あ', name: 'הירגנה', pct: hiraM / 46 * 100, href: '#/kana', sub: `${hiraM}/46` },
    { icon: 'ア', name: 'קטקנה', pct: kataM / 46 * 100, href: '#/kana?set=kata', sub: `${kataM}/46` },
    { icon: '📚', name: '100 מילים ראשונות', pct: Math.min(100, SRS.learnedCount()), href: '#/review', sub: `${Math.min(100, SRS.learnedCount())}/100` },
    ...UNITS.map(u => ({ icon: u.icon, name: u.name, pct: unitPct(u.id), href: '#/grammar', sub: Math.round(unitPct(u.id)) + '%' }))
  ];

  root.innerHTML = `
  <section class="hero">
    <div class="hero-main">
      <div class="hero-jp jp say" data-say="${greet[0]}" lang="ja">${greet[0]}</div>
      <div class="hero-he">${greet[1]}! ${isNew ? 'ברוכים הבאים לדוג׳ו היפני שלכם 🏯' : 'מוכנים לאימון של היום?'}</div>
      ${isNew ? '<p class="muted">מומלץ להתחיל מחזרה על הקאנה, ואז מהשיעור הראשון בדקדוק ומהחזרה היומית של המילים.</p>' : ''}
    </div>
    <div class="hero-stats">
      <div class="stat"><div class="stat-v">🔥 ${Prog.streak()}</div><div class="stat-l">ימים ברצף</div></div>
      <div class="stat"><div class="stat-v"><span class="belt" style="--belt:${li.rank.color}"></span>${li.level}</div><div class="stat-l">${esc(li.rank.name)}</div></div>
      <div class="stat"><div class="stat-v">${SRS.learnedCount()}</div><div class="stat-l">מילים נלמדו</div></div>
      <div class="ring" style="--p:${goalPct}"><div><b>${Prog.todayXP()}</b><small>/${s.settings.dailyGoal} XP</small></div></div>
    </div>
  </section>
  <div id="voice-warn"></div>

  <h2 class="sec-title">מה עושים עכשיו?</h2>
  <div class="grid cols-3 actions">
    <a class="card action ${due ? 'hot' : ''}" href="#/review">
      <div class="action-i">🔁</div><div class="action-t">חזרה יומית</div>
      <div class="action-s">${due ? `<b>${due}</b> כרטיסים מחכים לכם` : 'אין חזרות כרגע – אפשר ללמוד מילים חדשות'}</div></a>
    ${next ? `<a class="card action" href="#/lesson/${next.id}">
      <div class="action-i">${next.icon}</div><div class="action-t">השיעור הבא</div>
      <div class="action-s">${UI.rich(esc(next.title))}</div></a>` : `<a class="card action" href="#/grammar"><div class="action-i">🏯</div><div class="action-t">סיימתם את כל השיעורים!</div><div class="action-s">אפשר לחזור ולשפר ציונים</div></a>`}
    <a class="card action" href="#/mix">
      <div class="action-i">⚡</div><div class="action-t">אימון מהיר מעורב</div>
      <div class="action-s">מילים, חלקיקים, הטיות ומשפטים – 12 שאלות</div></a>
    <a class="card action" href="#/kana"><div class="action-i" lang="ja">あ</div><div class="action-t">מאמן קאנה</div><div class="action-s">זיהוי, הקלדה, שמיעה וקריאת מילים</div></a>
    <a class="card action" href="#/builder"><div class="action-i">🧩</div><div class="action-t">בונה משפטים</div><div class="action-s">סדרו מילים למשפט נכון</div></a>
    <a class="card action" href="#/games"><div class="action-i">🎮</div><div class="action-t">משחקים</div><div class="action-s">התאמה, זיכרון, ספרינט ומירוץ חלקיקים</div></a>
    <a class="card action" href="#/write"><div class="action-i">✍️</div><div class="action-t">כתיבה בקטקנה</div><div class="action-s">כתיבה ביד עם בדיקת סדר משיכות</div></a>
    <a class="card action" href="#/numbers"><div class="action-i">🔢</div><div class="action-t">ספירה ומספרים</div><div class="action-s">1 עד 999,999 – קריאה, שמיעה ומחירים</div></a>
    <a class="card action" href="#/vocab"><div class="action-i">📗</div><div class="action-t">Genki I – שיעורים 1–4</div><div class="action-s">אוצר המילים והדקדוק מהספר</div></a>
  </div>

  <div class="grid cols-2">
    <section class="card wotd">
      <div class="card-h">🌸 מילת היום</div>
      <div class="wotd-body">
        <div class="wotd-emo">${wotd.emoji || '🈁'}</div>
        <div>
          <div class="wotd-jp">${UI.jp(wotd.jp)} ${UI.sayBtn(wotd.jp)}</div>
          ${wotd.kanji ? `<div class="kanji-sm" lang="ja">${esc(wotd.kanji)}</div>` : ''}
          <div class="ro" dir="ltr">${esc(wotd.romaji)}</div>
          <div class="wotd-he">${esc(wotd.he)}</div>
        </div>
      </div>
      ${WordCard.firstExample(wotd)}
    </section>
    <section class="card tip">
      <div class="card-h">💡 טיפ של היום</div>
      <p>${UI.rich(tip)}</p>
    </section>
  </div>

  <h2 class="sec-title">מסלול הלמידה</h2>
  <div class="path">
    ${path.map((p, i) => `<a class="path-step ${p.pct >= 100 ? 'done' : ''}" href="${p.href}">
      <div class="ps-n">${p.pct >= 100 ? '✓' : i + 1}</div>
      <div class="ps-body"><div class="ps-t"><span ${/[ぁ-ヿ]/.test(p.icon) ? 'lang="ja"' : ''}>${p.icon}</span> ${esc(p.name)} <small>${p.sub}</small></div>${UI.pbar(p.pct, 'thin')}</div></a>`).join('')}
  </div>`;
  setTimeout(() => { const w = $('#voice-warn'); if (w) w.innerHTML = voiceWarning(); }, 1200);
};

/* ---------- Progress & settings ---------- */
Views.progress = root => {
  const s = Store.s, st = s.stats, li = Prog.levelInfo();
  const acc = st.answers ? Math.round(st.correct / st.answers * 100) : 0;
  const days = [];
  for (let i = 34; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dateStr(d); days.push({ k, xp: s.history[k] || 0, d }); }
  const maxXp = Math.max(1, ...days.map(d => d.xp));
  const good = TTS.goodVoices(), voices = good.length ? good : TTS.voices.slice(0, 5);
  root.innerHTML = `
  <h1 class="page-title">📊 התקדמות והגדרות</h1>
  <div class="grid cols-4 tiles">
    <div class="card tile"><div class="tile-v">${s.xp}</div><div class="tile-l">XP סה״כ</div></div>
    <div class="card tile"><div class="tile-v"><span class="belt" style="--belt:${li.rank.color}"></span>${li.level}</div><div class="tile-l">${esc(li.rank.name)} <span lang="ja">(${li.rank.jp})</span></div></div>
    <div class="card tile"><div class="tile-v">🔥 ${Prog.streak()}</div><div class="tile-l">רצף נוכחי (שיא: ${s.streak.best || 0})</div></div>
    <div class="card tile"><div class="tile-v">${acc}%</div><div class="tile-l">דיוק (${st.correct}/${st.answers})</div></div>
    <div class="card tile"><div class="tile-v">${SRS.learnedCount()}</div><div class="tile-l">מילים נלמדו (מתוך ${VOCAB.length})</div></div>
    <div class="card tile"><div class="tile-v">${lessonsDone(s)}/${LESSONS.length}</div><div class="tile-l">שיעורי דקדוק</div></div>
    <div class="card tile"><div class="tile-v">${KANA.hiraBasic.filter(k => Prog.kanaMastered(k.k)).length + KANA.kataBasic.filter(k => Prog.kanaMastered(k.k)).length}/92</div><div class="tile-l">קאנה בשליטה</div></div>
    <div class="card tile"><div class="tile-v">${st.sentences}</div><div class="tile-l">משפטים נבנו</div></div>
  </div>

  <section class="card">
    <div class="card-h">רמה ${li.level} → ${li.level + 1}</div>
    ${UI.pbar(li.pct)}<div class="muted small">${s.xp - li.cur} / ${li.next - li.cur} XP</div>
  </section>

  <section class="card">
    <div class="card-h">🗓️ פעילות ב-5 השבועות האחרונים</div>
    <div class="cal">${days.map(d => `<div class="cal-d" title="${d.k}: ${d.xp} XP" style="--a:${d.xp ? 0.25 + 0.75 * d.xp / maxXp : 0}"><span>${d.d.getDate()}</span></div>`).join('')}</div>
  </section>

  <section class="card">
    <div class="card-h">🏅 הישגים (${Object.keys(s.ach).length}/${ACHIEVEMENTS.length})</div>
    <div class="ach-grid">${ACHIEVEMENTS.map(a => `<div class="ach ${s.ach[a.id] ? 'got' : ''}"><div class="ach-i" lang="ja">${a.icon}</div><div><b>${esc(a.name)}</b><div class="small muted">${esc(a.desc)}</div></div></div>`).join('')}</div>
  </section>

  <section class="card settings">
    <div class="card-h">⚙️ הגדרות</div>
    <label class="set-row"><span>הצגת רומאג׳י (אותיות לטיניות)</span><input type="checkbox" data-set="romaji" ${s.settings.romaji ? 'checked' : ''}></label>
    <label class="set-row"><span>הצגת קאנג׳י (כשיש)</span><input type="checkbox" data-set="kanji" ${s.settings.kanji ? 'checked' : ''}></label>
    <label class="set-row"><span>השמעה אוטומטית</span><input type="checkbox" data-set="autoplay" ${s.settings.autoplay ? 'checked' : ''}></label>
    <label class="set-row"><span>צלילי משוב</span><input type="checkbox" data-set="sound" ${s.settings.sound ? 'checked' : ''}></label>
    <label class="set-row"><span>ערכת צבעים</span><select data-set="theme">
      ${[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']].map(([v, n]) => `<option value="${v}" ${s.settings.theme === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="set-row"><span>יעד XP יומי</span><select data-set="dailyGoal" data-num>
      ${[20, 50, 100, 150, 250].map(v => `<option value="${v}" ${s.settings.dailyGoal === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="set-row"><span>מילים חדשות ביום (בחזרה היומית)</span><select data-set="newPerDay" data-num>
      ${[5, 10, 15, 20, 30].map(v => `<option value="${v}" ${s.settings.newPerDay === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="set-row"><span>קול יפני</span><select data-set="voice">
      <option value="">אוטומטי</option>${voices.map(v => `<option value="${esc(v.name)}" ${s.settings.voice === v.name ? 'selected' : ''}>${esc(v.name)}${TTS.isRobot(v) ? ' (eSpeak – לא קורא יפנית)' : ''}</option>`).join('')}</select></label>
    <label class="set-row"><span>מהירות דיבור: <b id="rate-v">${s.settings.rate}</b></span><input type="range" min="0.5" max="1.3" step="0.05" data-set="rate" data-num value="${s.settings.rate}"></label>
    <div class="row"><button class="btn ghost" data-say="こんにちは。にほんご[を] べんきょうしましょう！">🔊 בדיקת קול</button></div>
    ${voiceWarning()}
  </section>

  <section class="card">
    <div class="card-h">💾 גיבוי ושחזור</div>
    <p class="muted small">ההתקדמות נשמרת בדפדפן הזה. אפשר לייצא קובץ גיבוי ולייבא אותו בדפדפן אחר.</p>
    <div class="row gap">
      <button class="btn" id="exp">⬇️ ייצוא גיבוי</button>
      <label class="btn">⬆️ ייבוא גיבוי<input type="file" id="imp" accept=".json" hidden></label>
      <button class="btn danger" id="reset">🗑️ איפוס כל ההתקדמות</button>
    </div>
  </section>`;

  $$('[data-set]', root).forEach(el => el.addEventListener('change', () => {
    const k = el.dataset.set;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.hasAttribute('data-num')) v = parseFloat(v);
    s.settings[k] = v; Store.save();
    if (k === 'theme') UI.applyTheme();
    if (k === 'dailyGoal') UI.updateSidebar();
    if (k === 'rate') $('#rate-v').textContent = v;
    UI.toast('✓ נשמר');
  }));
  $('#exp', root).onclick = () => {
    if (TTS.native) {
      const where = window.AndroidBridge.saveBackup(`nihongo-backup-${todayStr()}.json`, JSON.stringify(Store.s, null, 1));
      UI.toast(where ? `✓ נשמר: ${esc(where)}` : '✗ השמירה נכשלה', where ? 'good' : 'bad');
      return;
    }
    const blob = new Blob([JSON.stringify(Store.s, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `nihongo-backup-${todayStr()}.json`; a.click();
  };
  $('#imp', root).onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { Store.s = deepMerge(Store.defaults(), JSON.parse(t)); Store.save(); UI.applyTheme(); UI.updateSidebar(); UI.toast('✓ הגיבוי שוחזר', 'good'); App.route(); })
      .catch(() => UI.toast('✗ הקובץ לא תקין', 'bad'));
  };
  let armed = false;
  $('#reset', root).onclick = e => {
    if (!armed) { armed = true; e.target.textContent = '⚠️ לחצו שוב לאישור האיפוס'; setTimeout(() => { armed = false; e.target.textContent = '🗑️ איפוס כל ההתקדמות'; }, 4000); return; }
    Store.reset(); UI.applyTheme(); UI.updateSidebar(); UI.toast('ההתקדמות אופסה'); App.route();
  };
};

/* ---------- Cheat sheet ---------- */
Views.cheat = root => {
  const P = [
    ['は', 'wa', 'נושא המשפט ("לגבי...")', 'わたし[は] がくせい|です。', 'אני סטודנט.'],
    ['が', 'ga', 'הסובייקט / מידע חדש; עם すき, わかる, ある', 'だれ[が] きました[か]。', 'מי בא?'],
    ['を', 'o', 'מושא ישיר ("את")', 'みず[を] のみます。', 'אני שותה מים.'],
    ['に', 'ni', 'זמן מדויק, יעד, מקום קיום, נמען', 'がっこう[に] いきます。', 'אני הולך לבית הספר.'],
    ['で', 'de', 'מקום הפעולה, אמצעי', 'バス[で] いきます。', 'אני נוסע באוטובוס.'],
    ['へ', 'e', 'כיוון ("אל")', 'にほん[へ] いきます。', 'אני נוסע ליפן.'],
    ['と', 'to', '"עם" / "ו-" (רשימה מלאה) / ציטוט', 'ともだち[と] いきます。', 'אני הולך עם חבר.'],
    ['も', 'mo', '"גם" (מחליף は/が/を)', 'わたし[も] いきます。', 'גם אני הולך.'],
    ['の', 'no', '"של" / מחבר שמות עצם', 'わたし[の] ほん', 'הספר שלי'],
    ['から', 'kara', '"מ-" (זמן/מקום) / "כי"', 'とうきょう[から] きました。', 'באתי מטוקיו.'],
    ['まで', 'made', '"עד"', 'えき[まで] あるきます。', 'אני הולך עד התחנה.'],
    ['や', 'ya', '"ו-" (רשימה חלקית)', 'りんご[や] バナナ', 'תפוחים, בננות ועוד'],
    ['より', 'yori', '"מ..." בהשוואה', 'いぬ[は] ねこ[より] おおきい。', 'כלבים גדולים מחתולים.']
  ];
  const E = [
    ['か', 'שאלה', 'たべます[か]。', 'אתה אוכל?'], ['ね', '"נכון?" / הסכמה', 'いい てんき|です[ね]。', 'מזג אוויר נעים, נכון?'],
    ['よ', 'מידע חדש / הדגשה', 'おいしい|です[よ]。', 'זה טעים, תאמין לי!'], ['よね', '"נכון, לא?"', 'あした|です[よね]。', 'זה מחר, נכון?'],
    ['でしょう', 'כנראה / "נכון?"', 'あめ|でしょう。', 'כנראה ירד גשם.'], ['かな', '"מעניין אם..."', 'くる[かな]。', 'מעניין אם הוא יבוא.'],
    ['の / んです', 'הסבר / שאלה רכה', 'どうした[の]？', 'מה קרה?'], ['な / なあ', 'רגש (דיבורי)', 'いい[な]あ。', 'איזה כיף...']
  ];
  const Q = VOCAB.filter(w => w.cat === 'q');
  const sample = Conj.verbForms(VOCAB_BY_ID['verbs:のむ']);
  root.innerHTML = `
  <h1 class="page-title">📋 דף עזר</h1>
  <p class="muted">לחצו על כל טקסט יפני כדי לשמוע אותו.</p>
  <nav class="chips"><a class="chip" href="#cs-p" data-jump>חלקיקים</a><a class="chip" href="#cs-e" data-jump>סופי משפט</a><a class="chip" href="#cs-q" data-jump>מילות שאלה</a>
    <a class="chip" href="#cs-v" data-jump>פעלים</a><a class="chip" href="#cs-a" data-jump>שמות תואר</a><a class="chip" href="#cs-k" data-jump>こそあど</a><a class="chip" href="#cs-s" data-jump>מבנה משפט</a></nav>

  <section class="card" id="cs-s"><div class="card-h">🧱 מבנה המשפט</div>
    <div class="formula">[זמן] → נושא<span class="pt">は</span> → [עם מי<span class="pt">と</span>] → [מקום<span class="pt">で/に</span>] → מושא<span class="pt">を</span> → <b>פועל</b> → [סוף משפט]</div>
    <ul class="clean">
      <li>הפועל (או です) <b>תמיד בסוף</b>.</li>
      <li>אין "ה-", בדרך כלל אין רבים, ומשמיטים את הנושא כשהוא ברור.</li>
      <li>שאלה = מוסיפים {{[か]}} בסוף. מילת השאלה עומדת במקום התשובה.</li>
      <li>המתאר בא <b>לפני</b> המתואר: {{わたし[の] ほん}} (הספר שלי), {{たかい やま}} (הר גבוה).</li>
    </ul>
    ${UI.rich('<div class="ex-line">{{わたし[は] あした ともだち[と] としょかん[で] にほんご[を] べんきょうします。}}</div><div class="muted">מחר אני אלמד יפנית עם חבר בספרייה.</div>')}
  </section>

  <section class="card" id="cs-p"><div class="card-h">🧷 חלקיקים</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>חלקיק</th><th>תפקיד</th><th>דוגמה</th></tr></thead><tbody>
    ${P.map(p => `<tr><td>${UI.jp('[' + p[0] + ']', 'big')}<div class="ro" dir="ltr">${p[1]}</div></td><td>${esc(p[2])}</td><td>${UI.jp(p[3])}<div class="muted small">${esc(p[4])}</div></td></tr>`).join('')}
    </tbody></table></div></section>

  <section class="card" id="cs-e"><div class="card-h">💬 סופי משפט</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>סוף</th><th>משמעות</th><th>דוגמה</th></tr></thead><tbody>
    ${E.map(p => `<tr><td>${UI.jp('[' + p[0] + ']', 'big')}</td><td>${esc(p[1])}</td><td>${UI.jp(p[2])}<div class="muted small">${esc(p[3])}</div></td></tr>`).join('')}
    </tbody></table></div></section>

  <section class="card" id="cs-q"><div class="card-h">❓ מילות שאלה</div>
    <div class="qgrid">${Q.map(w => `<div class="qcell">${UI.jp(w.jp, 'big')}<div class="ro" dir="ltr">${esc(w.romaji)}</div><div>${esc(w.he)}</div></div>`).join('')}</div>
    <p class="small muted">+か = משהו/מישהו ({{なにか}}, {{だれか}}) · +も + שלילה = כלום/אף אחד ({{なにも}}, {{だれも}}) · {{いつも}} = תמיד</p>
  </section>

  <section class="card" id="cs-v"><div class="card-h">🔄 פעלים – תקציר</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>צורה</th><th>פועל る<br>${UI.jp('たべる')}</th><th>פועל う<br>${UI.jp('のむ')}</th><th>חריג<br>${UI.jp('する')} / ${UI.jp('くる')}</th></tr></thead><tbody>
    ${['masu', 'masen', 'mashita', 'masendeshita', 'te', 'ta', 'nai', 'tai', 'pot'].map(f => {
      const r = Conj.verb('たべる', 'ru')[f], u = sample[f].kana, s1 = Conj.verb('する', 'irr')[f], k = Conj.verb('くる', 'irr')[f];
      return `<tr><td>${esc(Conj.FORM_BY_ID[f].label)}</td><td>${UI.jp(r)}</td><td>${UI.jp(u)}</td><td>${UI.jp(s1)} / ${UI.jp(k)}</td></tr>`;
    }).join('')}
    </tbody></table></div>
    <div class="card-sub">🎵 צורת て לפעלי う</div>
    <div class="te-song">${[['う つ る', 'って'], ['む ぶ ぬ', 'んで'], ['く', 'いて'], ['ぐ', 'いで'], ['す', 'して'], ['いく', 'いって ⚠️']].map(([a, b]) => `<div><span lang="ja">${a}</span> → <b lang="ja">${b}</b></div>`).join('')}</div>
  </section>

  <section class="card" id="cs-a"><div class="card-h">🌶️ שמות תואר</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>い – ${UI.jp('たかい')}</th><th>な – ${UI.jp('しずか')}</th></tr></thead><tbody>
    ${[['הווה', 'plain'], ['שלילה', 'neg'], ['עבר', 'past'], ['עבר שלילי', 'pastneg'], ['חיבור (て)', 'te'], ['תואר הפועל', 'adv']].map(([n, f]) =>
      `<tr><td>${n}</td><td>${UI.jp(Conj.adj({ jp: 'たかい', type: 'i-adj' })[f])}</td><td>${UI.jp(Conj.adj({ jp: 'しずか', type: 'na-adj' })[f])}</td></tr>`).join('')}
    <tr><td>לפני שם עצם</td><td>${UI.jp('たかい やま')}</td><td>${UI.jp('しずか[な] へや')}</td></tr>
    </tbody></table></div>
    <p class="small muted">⚠️ {{いい}} → {{よくない}}, {{よかった}} · {{きれい}} ו-{{きらい}} הם תוארי な.</p>
  </section>

  <section class="card" id="cs-k"><div class="card-h">👉 こそあど</div>
    <div class="tbl-wrap"><table class="tbl center"><thead><tr><th></th><th>こ (אצלי)</th><th>そ (אצלך)</th><th>あ (רחוק)</th><th>ど (?)</th></tr></thead><tbody>
    ${[['דבר', 'これ', 'それ', 'あれ', 'どれ'], ['+ שם עצם', 'この', 'その', 'あの', 'どの'], ['מקום', 'ここ', 'そこ', 'あそこ', 'どこ'], ['כיוון', 'こちら', 'そちら', 'あちら', 'どちら'], ['סוג', 'こんな', 'そんな', 'あんな', 'どんな']]
      .map(r => `<tr><td>${r[0]}</td>${r.slice(1).map(x => `<td>${UI.jp(x)}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div></section>`;
  // rich {{}} inside static html
  $$('.card', root).forEach(c => { c.innerHTML = c.innerHTML.replace(/\{\{(.+?)\}\}/g, (m, j) => UI.jp(j.replace(/&amp;/g, '&'), 'inline')); });
  $$('[data-jump]', root).forEach(a => a.onclick = e => { e.preventDefault(); $(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' }); });
};
