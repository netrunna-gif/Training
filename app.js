'use strict';

/* ================= Speicher ================= */
const STORE_KEY = 'gymplan.v1';

const defaultState = () => ({
  version: 1,
  sessions: [],            // abgeschlossene Trainings
  current: null,           // laufendes Training
  blocks: { A: 0, B: 0 },  // aktueller Block je Einheit
  blockSessions: { A: 0, B: 0 }, // Trainings im aktuellen Block
  overrides: {},           // slotId -> exId (manueller Tausch, gilt bis Blockende)
  exSettings: {},          // exId -> { inc }
  bodyweight: [],          // { date, kg }
  settings: { rest: 90, blockLen: 6 },
  notice: null,
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return defaultState();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Speichern fehlgeschlagen – bitte Backup exportieren!'); }
}

// Safari darum bitten, die Daten dauerhaft zu behalten
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ================= Hilfen ================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtKg = (n) => (n == null || isNaN(n)) ? '–' : (Math.round(n * 100) / 100).toString().replace('.', ',');
const parseNum = (v) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const fmtDate = (iso, opts = { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }) => new Date(iso).toLocaleDateString('de-DE', opts);
const ex = (id) => EXERCISES[id];
const incOf = (id) => state.exSettings[id]?.inc ?? ex(id).inc;
const e1rm = (w, r) => (w > 0 && r > 0) ? w * (1 + Math.min(r, 15) / 30) : 0; // Epley

function weekKey(d) {
  const date = new Date(d); date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const w1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + '-' + String(1 + Math.round(((date - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7)).padStart(2, '0');
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ================= Planlogik ================= */
function slotExercise(w, slot) {
  if (state.overrides[slot.id]) return state.overrides[slot.id];
  const b = state.blocks[w] || 0;
  return slot.options[Math.floor(b / (slot.every || 1)) % slot.options.length];
}

function nextWorkout() {
  const last = state.sessions[state.sessions.length - 1];
  return last ? (last.workout === 'A' ? 'B' : 'A') : 'A';
}

// alle Einträge einer Übung, neueste zuerst
function historyOf(exId) {
  const out = [];
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const s = state.sessions[i];
    for (const e of s.exercises) if (e.exId === exId) {
      const sets = e.sets.filter((x) => x.done && x.r > 0);
      if (sets.length) out.push({ date: s.date, sets });
    }
  }
  return out;
}

function topWeight(sets) {
  // das am häufigsten verwendete Arbeitsgewicht (bei Gleichstand das schwerere)
  const c = {};
  sets.forEach((s) => { const k = s.w ?? 0; c[k] = (c[k] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1] || b[0] - a[0]).map((x) => +x[0])[0] ?? 0;
}

function sessionScore(exId, sets) {
  const e = ex(exId);
  if (e.inc < 0) return Math.max(...sets.map((s) => s.r * 2 - (s.w || 0))); // assistiert: weniger Hilfe = besser
  if (e.inc === 0 && !sets.some((s) => s.w > 0)) return Math.max(...sets.map((s) => s.r));
  return Math.max(...sets.map((s) => e1rm(s.w || 0, s.r)));
}

const roundTo = (v, step) => { step = Math.abs(step) || 1; return Math.round(v / step) * step; };

/**
 * Doppelte Progression:
 *  - Alle Sätze am oberen Ende des Wdh.-Bereichs -> Gewicht + Steigerung
 *  - Sonst gleiches Gewicht, Ziel: +1 Wdh.
 *  - Zweimal hintereinander unter dem Bereich -> ca. 10 % leichter (Deload)
 */
function suggestion(exId) {
  const e = ex(exId);
  const [lo, hi] = e.reps;
  const inc = incOf(exId);
  const hist = historyOf(exId);
  if (!hist.length) {
    return { weight: e.start, reps: lo, status: 'new',
      note: 'Erstes Mal: Gewicht so wählen, dass du ' + lo + '–' + hi + ' saubere ' + e.unit + '. schaffst und noch ~2 im Tank hast.' };
  }
  const last = hist[0];
  const w = topWeight(last.sets);
  const atW = last.sets.filter((s) => (s.w ?? 0) === w);
  const minReps = Math.min(...atW.map((s) => s.r));
  const allTop = atW.length >= e.sets && atW.every((s) => s.r >= hi);

  if (allTop) {
    if (inc === 0) {
      if (e.unit === 'Sek') return { weight: w, reps: hi + 10, status: 'up', note: 'Ziel erreicht! Länger halten oder Zusatzgewicht nehmen.' };
      return { weight: w, reps: hi, status: 'up', note: 'Oberes Ende erreicht – Zusatzgewicht nehmen oder langsamer ausführen.' };
    }
    const nw = Math.max(0, roundTo(w + inc, inc));
    return { weight: nw, reps: lo, status: 'up',
      note: inc > 0 ? `Stark! Gewicht erhöht: ${fmtKg(w)} → ${fmtKg(nw)} kg` : `Stark! Weniger Unterstützung: ${fmtKg(w)} → ${fmtKg(nw)} kg` };
  }

  // Deload-Prüfung
  if (hist[1] && minReps < lo) {
    const prev = hist[1];
    const pw = topWeight(prev.sets);
    const pMin = Math.min(...prev.sets.filter((s) => (s.w ?? 0) === pw).map((s) => s.r));
    if (pw === w && pMin < lo && inc !== 0) {
      const nw = inc > 0 ? roundTo(w * 0.9, inc) : roundTo(w * 1.1, inc);
      return { weight: nw, reps: hi, status: 'down', note: `Zweimal unter ${lo} Wdh. – kurz leichter (${fmtKg(nw)} kg) und neu aufbauen.` };
    }
  }

  const target = Math.min(hi, Math.max(lo, minReps + 1));
  return { weight: w, reps: target, status: 'hold', note: `Gleiches Gewicht – Ziel: ${target} ${e.unit}. pro Satz (bis ${hi}, dann wird erhöht).` };
}

// Plateau: in den letzten 3 Einheiten kein neuer Bestwert
function plateau(exId) {
  const hist = historyOf(exId);
  if (hist.length < 4) return false;
  const scores = hist.map((h) => sessionScore(exId, h.sets));
  const recentBest = Math.max(...scores.slice(0, 3));
  const before = Math.max(...scores.slice(3));
  return recentBest <= before;
}

/* ================= Training starten / beenden ================= */
function startWorkout(w) {
  const plan = WORKOUTS[w];
  state.current = {
    id: uid(), workout: w, startedAt: new Date().toISOString(), block: state.blocks[w],
    exercises: plan.slots.map((slot) => buildExercise(slot, slotExercise(w, slot))),
  };
  save(); go('workout');
}

function buildExercise(slot, exId) {
  const e = ex(exId); const s = suggestion(exId);
  return {
    slot: slot.id, exId, suggestion: s,
    sets: Array.from({ length: e.sets }, () => ({ w: s.weight, r: null, done: false })),
  };
}

function finishWorkout() {
  const cur = state.current; if (!cur) return;
  cur.exercises.forEach((e) => { e.sets = e.sets.filter((s) => s.done); });
  const done = cur.exercises.filter((e) => e.sets.length);
  if (!done.length) { if (confirm('Keine Sätze abgehakt. Training verwerfen?')) { state.current = null; save(); stopRest(); go('home'); } return; }

  // Bestleistungen ermitteln, bevor die Session gespeichert wird
  const prs = [];
  done.forEach((e) => {
    const prev = historyOf(e.exId);
    const now = sessionScore(e.exId, e.sets);
    if (prev.length && now > Math.max(...prev.map((h) => sessionScore(e.exId, h.sets))) + 0.01) prs.push(e.exId);
  });

  const session = {
    id: cur.id, workout: cur.workout, date: cur.startedAt, block: cur.block,
    durationMin: Math.round((Date.now() - new Date(cur.startedAt)) / 60000),
    exercises: done.map((e) => ({ slot: e.slot, exId: e.exId, sets: e.sets.map(({ w, r }) => ({ w, r, done: true })) })),
    prs,
  };
  state.sessions.push(session);
  state.current = null;

  // Blockfortschritt
  const w = session.workout;
  state.blockSessions[w] = (state.blockSessions[w] || 0) + 1;
  let blockChanged = false;
  if (state.blockSessions[w] >= state.settings.blockLen) {
    state.blocks[w] = (state.blocks[w] || 0) + 1;
    state.blockSessions[w] = 0;
    WORKOUTS[w].slots.forEach((s) => delete state.overrides[s.id]);
    blockChanged = true;
    state.notice = `Neuer Trainingsblock für ${WORKOUTS[w].name}! Einige Übungen wurden gewechselt, damit dein Körper neue Reize bekommt.`;
  }
  save(); stopRest();
  go('summary', { id: session.id, blockChanged });
}

/* ================= Pausen-Timer ================= */
let restTimer = null;
let restEnd = 0;
function startRest(sec = state.settings.rest) {
  stopRest();
  const end = restEnd = Date.now() + sec * 1000;
  const bar = $('#rest'); bar.classList.add('show');
  const tick = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    $('#rest-time').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    $('#rest-fill').style.width = (100 * left / sec) + '%';
    if (left <= 0) { beep(); stopRest(); toast('Pause vorbei – nächster Satz!'); }
  };
  restTimer = setInterval(tick, 250); tick();
}
function stopRest() { clearInterval(restTimer); restTimer = null; $('#rest').classList.remove('show'); }

let audioCtx;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.2);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
    });
  } catch (e) { /* kein Audio */ }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

/* ================= Router ================= */
let route = { name: 'home', params: {} };
function go(name, params = {}) {
  route = { name, params };
  render();
  window.scrollTo(0, 0);
}

function render() {
  const view = $('#view');
  const tabName = ['workout', 'summary'].includes(route.name) ? 'home' : route.name;
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));
  const titles = { home: 'Training', workout: state.current ? WORKOUTS[state.current.workout].name : 'Training', summary: 'Geschafft!', history: 'Verlauf', progress: 'Fortschritt', plan: 'Plan', settings: 'Einstellungen' };
  $('#title').textContent = titles[route.name] || '';
  const fn = { home: viewHome, workout: viewWorkout, summary: viewSummary, history: viewHistory, progress: viewProgress, plan: viewPlan, settings: viewSettings }[route.name];
  view.innerHTML = fn();
  if (route.name === 'progress') drawCharts();
}

/* ================= Views ================= */
function viewHome() {
  if (state.current) {
    const c = state.current;
    const done = c.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
    const total = c.exercises.reduce((n, e) => n + e.sets.length, 0);
    return `
      <div class="card hero">
        <div class="eyebrow">Läuft gerade</div>
        <h2>${esc(WORKOUTS[c.workout].name)}</h2>
        <p class="muted">${done} von ${total} Sätzen erledigt</p>
        <button class="btn primary big" data-action="resume">Weiter trainieren</button>
      </div>`;
  }
  const w = nextWorkout();
  const plan = WORKOUTS[w];
  const thisWeek = state.sessions.filter((s) => weekKey(s.date) === weekKey(new Date())).length;
  const total = state.sessions.length;
  const blockNo = (state.blocks[w] || 0) + 1;
  const inBlock = (state.blockSessions[w] || 0) + 1;

  const list = plan.slots.map((slot) => {
    const id = slotExercise(w, slot); const e = ex(id); const s = suggestion(id);
    const badge = { up: '<span class="badge up">↑</span>', down: '<span class="badge down">↓</span>', new: '<span class="badge new">neu</span>', hold: '' }[s.status];
    return `<li><div><div class="ex-name">${esc(e.name)} ${badge}</div><div class="muted small">${esc(slot.label)}</div></div>
      <div class="right small">${e.sets} × ${e.reps[0]}–${e.reps[1]}<br><b>${s.weight ? fmtKg(s.weight) + ' kg' : (e.unit === 'Sek' ? 'Körpergewicht' : '–')}</b></div></li>`;
  }).join('');

  const other = w === 'A' ? 'B' : 'A';
  return `
    ${state.notice ? `<div class="card notice"><p>${esc(state.notice)}</p><button class="btn small" data-action="dismiss-notice">OK</button></div>` : ''}
    <div class="stats">
      <div class="stat"><div class="num">${thisWeek}<span>/2</span></div><div class="lbl">diese Woche</div></div>
      <div class="stat"><div class="num">${total}</div><div class="lbl">Trainings gesamt</div></div>
      <div class="stat"><div class="num">${weekStreak()}</div><div class="lbl">Wochen in Folge</div></div>
    </div>
    <div class="card hero">
      <div class="eyebrow">Nächstes Training · Block ${blockNo}, Einheit ${inBlock}/${state.settings.blockLen}</div>
      <h2>${esc(plan.name)}</h2>
      <p class="muted">${esc(plan.focus)} · ca. 55–60 Min.</p>
      <ul class="plan-list">${list}</ul>
      <button class="btn primary big" data-action="start" data-w="${w}">Training starten</button>
      <button class="btn ghost" data-action="start" data-w="${other}">Stattdessen ${esc(WORKOUTS[other].name)}</button>
    </div>
    <div class="card tip">
      <b>Aufwärmen (5–8 Min.):</b> Crosstrainer/Rad, dann bei der ersten Übung 1–2 leichte Aufwärmsätze. Pausen: 90–120 Sek. bei Grundübungen, 60 Sek. bei kleinen Übungen.
    </div>`;
}

function weekStreak() {
  if (!state.sessions.length) return 0;
  const weeks = new Set(state.sessions.map((s) => weekKey(s.date)));
  let n = 0; const d = new Date();
  if (!weeks.has(weekKey(d))) d.setDate(d.getDate() - 7); // laufende Woche noch offen
  while (weeks.has(weekKey(d))) { n++; d.setDate(d.getDate() - 7); }
  return n;
}

function viewWorkout() {
  const c = state.current;
  if (!c) return viewHome();
  const mins = Math.round((Date.now() - new Date(c.startedAt)) / 60000);
  const cards = c.exercises.map((e, i) => {
    const E = ex(e.exId); const s = e.suggestion;
    const slot = WORKOUTS[c.workout].slots.find((x) => x.id === e.slot);
    const allDone = e.sets.length && e.sets.every((x) => x.done);
    const pl = plateau(e.exId);
    const rows = e.sets.map((set, j) => `
      <div class="set ${set.done ? 'done' : ''}">
        <span class="set-no">${j + 1}</span>
        <label><input type="text" inputmode="decimal" value="${set.w ?? ''}" placeholder="kg" data-field="w" data-i="${i}" data-j="${j}"><small>kg</small></label>
        <label><input type="text" inputmode="numeric" value="${set.r ?? ''}" placeholder="${s.reps}" data-field="r" data-i="${i}" data-j="${j}"><small>${E.unit}</small></label>
        <button class="check" data-action="toggle-set" data-i="${i}" data-j="${j}" aria-label="Satz abhaken">${set.done ? '✓' : ''}</button>
      </div>`).join('');
    const last = historyOf(e.exId)[0];
    const lastTxt = last ? last.sets.map((x) => `${fmtKg(x.w)}×${x.r}`).join(', ') : '';
    return `
      <div class="card exercise ${allDone ? 'complete' : ''}" id="ex-${i}">
        <div class="ex-head">
          <div>
            <div class="muted small">${esc(slot?.label || '')}</div>
            <h3>${esc(E.name)}</h3>
            <div class="small">Ziel: ${E.sets} × ${E.reps[0]}–${E.reps[1]} ${E.unit}.</div>
          </div>
          <button class="icon-btn" data-action="swap" data-i="${i}" aria-label="Übung tauschen">⇄</button>
        </div>
        <div class="hint ${s.status}">${esc(s.note)}</div>
        ${pl ? `<div class="hint down">Seit 3 Einheiten kein Fortschritt – Tipp: Übung tauschen (⇄) für einen neuen Reiz.</div>` : ''}
        ${lastTxt ? `<div class="muted small">Letztes Mal: ${esc(lastTxt)}</div>` : ''}
        <div class="sets">${rows}</div>
        <div class="row">
          <button class="btn small ghost" data-action="add-set" data-i="${i}">+ Satz</button>
          <button class="btn small ghost" data-action="tip" data-i="${i}">Technik</button>
        </div>
        <div class="tech hidden" id="tip-${i}">${esc(E.tip)}</div>
      </div>`;
  }).join('');
  return `
    <div class="muted small center">Gestartet vor ${mins} Min. · Tipp: Haken = Satz fertig, startet die Pause</div>
    ${cards}
    <button class="btn primary big" data-action="finish">Training beenden & speichern</button>
    <button class="btn ghost danger" data-action="discard">Training verwerfen</button>`;
}

function viewSummary() {
  const s = state.sessions.find((x) => x.id === route.params.id);
  if (!s) return viewHome();
  const vol = s.exercises.reduce((n, e) => n + e.sets.reduce((m, x) => m + (x.w || 0) * x.r, 0), 0);
  const items = s.exercises.map((e) => {
    const sug = suggestion(e.exId); const E = ex(e.exId);
    const pr = s.prs?.includes(e.exId);
    return `<li><div><div class="ex-name">${esc(E.name)} ${pr ? '<span class="badge pr">Bestwert</span>' : ''}</div>
      <div class="muted small">${e.sets.map((x) => `${fmtKg(x.w)}×${x.r}`).join(' · ')}</div>
      <div class="small hint-inline ${sug.status}">Nächstes Mal: ${sug.weight ? fmtKg(sug.weight) + ' kg' : ''} ${sug.status === 'up' ? '↑' : sug.status === 'down' ? '↓' : '→'} Ziel ${sug.reps} ${E.unit}.</div></div></li>`;
  }).join('');
  return `
    <div class="card hero center">
      <div class="big-emoji">💪</div>
      <h2>${esc(WORKOUTS[s.workout].name)} erledigt</h2>
      <p class="muted">${s.durationMin} Min. · ${s.exercises.reduce((n, e) => n + e.sets.length, 0)} Sätze · ${Math.round(vol).toLocaleString('de-DE')} kg bewegt</p>
      ${s.prs?.length ? `<p><b>${s.prs.length} neue Bestleistung${s.prs.length > 1 ? 'en' : ''}!</b></p>` : ''}
      ${route.params.blockChanged ? `<p class="hint up">Block abgeschlossen – beim nächsten ${esc(WORKOUTS[s.workout].name)} warten neue Übungsvarianten.</p>` : ''}
    </div>
    <div class="card"><h3>So geht's weiter</h3><ul class="plan-list">${items}</ul></div>
    <button class="btn primary big" data-action="nav" data-to="home">Fertig</button>`;
}

function viewHistory() {
  if (!state.sessions.length) return empty('Noch keine Trainings gespeichert.', 'Starte dein erstes Training im Tab „Training“.');
  return state.sessions.slice().reverse().map((s) => {
    const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
    const vol = s.exercises.reduce((n, e) => n + e.sets.reduce((m, x) => m + (x.w || 0) * x.r, 0), 0);
    const open = route.params.open === s.id;
    return `<div class="card">
      <button class="list-head" data-action="open-session" data-id="${s.id}">
        <div><b>${esc(WORKOUTS[s.workout].name)}</b> ${s.prs?.length ? `<span class="badge pr">${s.prs.length} PR</span>` : ''}
        <div class="muted small">${fmtDate(s.date)} · ${s.durationMin} Min. · ${sets} Sätze · ${Math.round(vol).toLocaleString('de-DE')} kg</div></div>
        <span class="chev">${open ? '▾' : '▸'}</span>
      </button>
      ${open ? `<ul class="plan-list">${s.exercises.map((e) => `<li><div><div class="ex-name">${esc(ex(e.exId)?.name || e.exId)}</div>
        <div class="muted small">${e.sets.map((x) => `${fmtKg(x.w)} kg × ${x.r}`).join(' · ')}</div></div></li>`).join('')}</ul>
        <button class="btn small ghost danger" data-action="delete-session" data-id="${s.id}">Training löschen</button>` : ''}
    </div>`;
  }).join('');
}

function empty(title, sub) {
  return `<div class="empty"><div class="big-emoji">🏋️</div><h3>${esc(title)}</h3><p class="muted">${esc(sub)}</p></div>`;
}

function viewProgress() {
  const used = [...new Set(state.sessions.flatMap((s) => s.exercises.map((e) => e.exId)))].filter((id) => EXERCISES[id]);
  const bw = state.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
  const bwCard = `
    <div class="card">
      <h3>Körpergewicht</h3>
      <div class="row">
        <input type="text" inputmode="decimal" id="bw-input" placeholder="kg, z. B. 78,5" class="grow">
        <button class="btn small primary" data-action="add-bw">Eintragen</button>
      </div>
      ${bw.length >= 2 ? '<canvas class="chart" id="chart-bw"></canvas>' : ''}
      ${bw.length ? `<p class="muted small">Zuletzt: ${fmtKg(bw[bw.length - 1].kg)} kg am ${fmtDate(bw[bw.length - 1].date)}${bw.length > 1 ? ` · Veränderung: ${(bw[bw.length - 1].kg - bw[0].kg > 0 ? '+' : '') + fmtKg(bw[bw.length - 1].kg - bw[0].kg)} kg` : ''}</p>` : ''}
    </div>`;
  if (!used.length) return empty('Noch keine Daten.', 'Nach deinem ersten Training siehst du hier deine Entwicklung.') + bwCard;

  const sel = route.params.ex && used.includes(route.params.ex) ? route.params.ex : used[0];
  const E = ex(sel);
  const hist = historyOf(sel).reverse();
  const first = hist[0], last = hist[hist.length - 1];
  const best = Math.max(...hist.map((h) => sessionScore(sel, h.sets)));
  const metric = E.inc < 0 ? 'Unterstützung (kg)' : 'Geschätztes 1RM (kg)';

  return `
    <div class="card">
      <label class="muted small" for="ex-select">Übung</label>
      <select id="ex-select" data-action="select-ex">${used.map((id) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(ex(id).name)}</option>`).join('')}</select>
      <canvas class="chart" id="chart-ex"></canvas>
      <div class="muted small center">${esc(metric)}${E.inc === 0 ? ' / Wdh.' : ''}</div>
      <div class="stats compact">
        <div class="stat"><div class="num">${hist.length}</div><div class="lbl">Einheiten</div></div>
        <div class="stat"><div class="num">${fmtKg(topWeight(first.sets))}→${fmtKg(topWeight(last.sets))}</div><div class="lbl">Gewicht (kg)</div></div>
        <div class="stat"><div class="num">${E.inc < 0 || E.inc === 0 ? '–' : fmtKg(Math.round(best))}</div><div class="lbl">bestes 1RM</div></div>
      </div>
      ${plateau(sel) ? '<div class="hint down">Plateau erkannt – im Tab „Plan“ kannst du eine Alternative wählen.</div>' : ''}
      <ul class="plan-list">${hist.slice().reverse().slice(0, 8).map((h) => `<li><div class="small">${fmtDate(h.date)}</div><div class="right small">${h.sets.map((x) => `${fmtKg(x.w)}×${x.r}`).join(' · ')}</div></li>`).join('')}</ul>
    </div>
    <div class="card">
      <h3>Sätze pro Woche</h3>
      <canvas class="chart" id="chart-vol"></canvas>
      <p class="muted small">Für Muskelaufbau sind ca. 10+ harte Sätze pro Muskelgruppe und Woche ideal – mit 2× Ganzkörper kommst du gut dahin.</p>
    </div>
    ${bwCard}`;
}

function drawCharts() {
  const sel = $('#ex-select')?.value;
  if (sel) {
    const E = ex(sel);
    const hist = historyOf(sel).reverse();
    const pts = hist.map((h) => ({ x: new Date(h.date), y: E.inc < 0 ? topWeight(h.sets) : (E.inc === 0 && !h.sets.some((s) => s.w > 0) ? Math.max(...h.sets.map((s) => s.r)) : sessionScore(sel, h.sets)) }));
    lineChart($('#chart-ex'), pts);
  }
  const weeks = {};
  state.sessions.forEach((s) => { const k = weekKey(s.date); weeks[k] = (weeks[k] || 0) + s.exercises.reduce((n, e) => n + e.sets.length, 0); });
  const keys = Object.keys(weeks).sort().slice(-12);
  if ($('#chart-vol')) barChart($('#chart-vol'), keys.map((k) => ({ label: 'KW' + k.split('-')[1], y: weeks[k] })));
  const bw = state.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
  if ($('#chart-bw')) lineChart($('#chart-bw'), bw.map((b) => ({ x: new Date(b.date), y: b.kg })));
}

function setupCanvas(cv) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  return { ctx, w, h, accent: css.getPropertyValue('--accent').trim(), muted: css.getPropertyValue('--muted').trim(), line: css.getPropertyValue('--line').trim() };
}

function lineChart(cv, pts) {
  if (!cv) return;
  const { ctx, w, h, accent, muted, line } = setupCanvas(cv);
  const pad = { l: 36, r: 10, t: 12, b: 22 };
  if (pts.length < 2) { ctx.fillStyle = muted; ctx.font = '13px -apple-system, system-ui'; ctx.textAlign = 'center'; ctx.fillText('Ab 2 Einheiten siehst du hier eine Kurve', w / 2, h / 2); return; }
  let ymin = Math.min(...pts.map((p) => p.y)), ymax = Math.max(...pts.map((p) => p.y));
  const span = (ymax - ymin) || ymax * 0.1 || 1; ymin -= span * 0.15; ymax += span * 0.15;
  const x0 = +pts[0].x, x1 = +pts[pts.length - 1].x || x0 + 1;
  const X = (x) => pad.l + ((+x - x0) / ((x1 - x0) || 1)) * (w - pad.l - pad.r);
  const Y = (y) => pad.t + (1 - (y - ymin) / (ymax - ymin)) * (h - pad.t - pad.b);
  ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.fillStyle = muted; ctx.font = '11px -apple-system, system-ui'; ctx.textAlign = 'right';
  for (let i = 0; i <= 3; i++) {
    const v = ymin + (ymax - ymin) * i / 3; const y = Y(v);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    ctx.fillText((ymax - ymin) < 6 ? fmtKg(Math.round(v * 10) / 10) : Math.round(v), pad.l - 6, y + 4);
  }
  ctx.textAlign = 'left'; ctx.fillText(fmtDate(pts[0].x, { day: '2-digit', month: '2-digit' }), pad.l, h - 6);
  ctx.textAlign = 'right'; ctx.fillText(fmtDate(pts[pts.length - 1].x, { day: '2-digit', month: '2-digit' }), w - pad.r, h - 6);
  // Fläche
  const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  grad.addColorStop(0, accent + '55'); grad.addColorStop(1, accent + '00');
  ctx.beginPath(); ctx.moveTo(X(pts[0].x), h - pad.b);
  pts.forEach((p) => ctx.lineTo(X(p.x), Y(p.y))); ctx.lineTo(X(pts[pts.length - 1].x), h - pad.b); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  // Linie
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)));
  ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = accent; pts.forEach((p) => { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 3.5, 0, Math.PI * 2); ctx.fill(); });
}

function barChart(cv, data) {
  if (!cv) return;
  const { ctx, w, h, accent, muted } = setupCanvas(cv);
  const pad = { l: 8, r: 8, t: 16, b: 22 };
  if (!data.length) return;
  const max = Math.max(...data.map((d) => d.y), 1);
  const bw = Math.min(56, (w - pad.l - pad.r) / data.length);
  ctx.font = '10px -apple-system, system-ui'; ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const bh = (d.y / max) * (h - pad.t - pad.b);
    const x = pad.l + i * bw + bw * 0.18, y = h - pad.b - bh;
    ctx.fillStyle = accent; roundRect(ctx, x, y, bw * 0.64, bh, 4); ctx.fill();
    ctx.fillStyle = muted; ctx.fillText(d.y, x + bw * 0.32, y - 4);
    ctx.fillText(d.label, x + bw * 0.32, h - 6);
  });
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function viewPlan() {
  const blocks = ['A', 'B'].map((w) => {
    const plan = WORKOUTS[w];
    const slots = plan.slots.map((slot) => {
      const cur = slotExercise(w, slot);
      const opts = slot.options.map((id) => `<option value="${id}" ${id === cur ? 'selected' : ''}>${esc(ex(id).name)}${id === cur && state.overrides[slot.id] ? ' (manuell)' : ''}</option>`).join('');
      return `<li class="slot">
        <div class="grow"><div class="muted small">${esc(slot.label)} · Wechsel alle ${slot.every * state.settings.blockLen} Wochen</div>
        <select data-action="override" data-slot="${slot.id}">${opts}</select>
        <div class="row small muted">${ex(cur).sets} × ${ex(cur).reps[0]}–${ex(cur).reps[1]} ${ex(cur).unit}. · Steigerung
          <input class="inc" type="text" inputmode="decimal" value="${fmtKg(incOf(cur))}" data-action="inc" data-ex="${cur}"> kg</div></div>
      </li>`;
    }).join('');
    return `<div class="card">
      <h3>${esc(plan.name)}</h3>
      <p class="muted small">Block ${(state.blocks[w] || 0) + 1} · ${state.blockSessions[w] || 0}/${state.settings.blockLen} Einheiten absolviert</p>
      <ul class="plan-list">${slots}</ul>
    </div>`;
  }).join('');
  return `
    <div class="card tip">
      <b>So passt sich dein Plan an</b>
      <ul class="bullets">
        <li><b>Abwechselnd A und B:</b> zwei Ganzkörpertrainings mit unterschiedlichen Übungen – jede Muskelgruppe wird 2× pro Woche trainiert.</li>
        <li><b>Doppelte Progression:</b> Schaffst du in allen Sätzen das obere Ende des Wdh.-Bereichs, erhöht die App das Gewicht. Sonst bleibt es gleich und das Ziel ist +1 Wdh.</li>
        <li><b>Deload:</b> Zweimal hintereinander unter dem Bereich → ca. 10 % leichter und neu aufbauen.</li>
        <li><b>Blöcke à ${state.settings.blockLen} Wochen:</b> Danach wechseln die kleineren Übungen, die Grundübungen alle ${state.settings.blockLen * 2} Wochen. Kommt eine Übung wieder, startet sie bei deinem letzten Gewicht.</li>
        <li><b>Plateau-Erkennung:</b> 3 Einheiten ohne Bestwert → Vorschlag zum Tauschen.</li>
      </ul>
    </div>
    ${blocks}`;
}

function viewSettings() {
  return `
    <div class="card">
      <h3>Training</h3>
      <label class="field">Pausenzeit (Sekunden)
        <input type="text" inputmode="numeric" value="${state.settings.rest}" data-action="setting" data-key="rest"></label>
      <label class="field">Blocklänge (Einheiten je Plan, bevor Übungen wechseln)
        <input type="text" inputmode="numeric" value="${state.settings.blockLen}" data-action="setting" data-key="blockLen"></label>
    </div>
    <div class="card">
      <h3>Daten sichern</h3>
      <p class="muted small">Deine Daten liegen nur auf diesem iPhone. Exportiere ab und zu ein Backup (z. B. in iCloud Drive über „In Dateien sichern“).</p>
      <button class="btn" data-action="export">Backup exportieren</button>
      <label class="btn">Backup importieren<input type="file" accept="application/json,.json" id="import-file" hidden></label>
    </div>
    <div class="card">
      <h3>Installation auf dem iPhone</h3>
      <ol class="bullets small">
        <li>Diese Seite in <b>Safari</b> öffnen.</li>
        <li>Unten auf <b>Teilen</b> (Quadrat mit Pfeil) tippen.</li>
        <li><b>„Zum Home-Bildschirm“</b> wählen – fertig. Die App läuft dann im Vollbild und offline.</li>
      </ol>
    </div>
    <div class="card">
      <button class="btn ghost danger" data-action="reset">Alle Daten löschen</button>
    </div>
    <p class="muted small center">Gym Plan · ${state.sessions.length} Trainings gespeichert</p>`;
}

/* ================= Events ================= */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-action], .tabbar button');
  if (!t) return;
  if (t.dataset.tab) { go(t.dataset.tab); return; }
  const a = t.dataset.action; const i = +t.dataset.i; const j = +t.dataset.j;
  const cur = state.current;
  switch (a) {
    case 'start': startWorkout(t.dataset.w); break;
    case 'resume': go('workout'); break;
    case 'dismiss-notice': state.notice = null; save(); render(); break;
    case 'nav': go(t.dataset.to); break;
    case 'toggle-set': {
      const set = cur.exercises[i].sets[j];
      syncInputs();
      if (!set.done && (set.r == null)) set.r = cur.exercises[i].suggestion.reps;
      set.done = !set.done; save();
      const scrollY = window.scrollY; render(); window.scrollTo(0, scrollY);
      if (set.done) {
        const exDone = cur.exercises[i].sets.every((s) => s.done);
        if (exDone && i + 1 < cur.exercises.length) {
          startRest(Math.max(state.settings.rest, 120));
          setTimeout(() => $('#ex-' + (i + 1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        } else if (!exDone) startRest();
      }
      break;
    }
    case 'add-set': {
      syncInputs();
      const sets = cur.exercises[i].sets; const lastSet = sets[sets.length - 1];
      sets.push({ w: lastSet ? lastSet.w : cur.exercises[i].suggestion.weight, r: null, done: false });
      save(); const y = window.scrollY; render(); window.scrollTo(0, y); break;
    }
    case 'tip': $('#tip-' + i).classList.toggle('hidden'); break;
    case 'swap': openSwap(i); break;
    case 'finish': syncInputs(); if (confirm('Training beenden und speichern?')) finishWorkout(); break;
    case 'discard': if (confirm('Training wirklich verwerfen? Die Sätze gehen verloren.')) { state.current = null; save(); stopRest(); go('home'); } break;
    case 'rest-skip': stopRest(); break;
    case 'rest-add': { const left = Math.max(0, restEnd - Date.now()); startRest(Math.round(left / 1000) + 30); break; }
    case 'open-session': go('history', { open: route.params.open === t.dataset.id ? null : t.dataset.id }); break;
    case 'delete-session':
      if (confirm('Dieses Training löschen?')) { state.sessions = state.sessions.filter((s) => s.id !== t.dataset.id); save(); go('history'); }
      break;
    case 'add-bw': {
      const kg = parseNum($('#bw-input').value);
      if (!kg || kg < 30 || kg > 300) { toast('Bitte ein gültiges Gewicht eingeben'); break; }
      const today = new Date().toISOString().slice(0, 10);
      state.bodyweight = state.bodyweight.filter((b) => b.date !== today).concat({ date: today, kg });
      save(); render(); toast('Gespeichert'); break;
    }
    case 'export': exportData(); break;
    case 'reset':
      if (confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.') && confirm('Sicher? Vorher besser ein Backup exportieren.')) {
        state = defaultState(); save(); go('home');
      }
      break;
    case 'pick-swap': {
      const { i: idx, ex: exId } = t.dataset; const e = cur.exercises[+idx];
      const slot = WORKOUTS[cur.workout].slots.find((s) => s.id === e.slot);
      if (t.dataset.keep === '1') state.overrides[slot.id] = exId;
      cur.exercises[+idx] = buildExercise(slot, exId);
      closeSheet(); save(); render(); $('#ex-' + idx)?.scrollIntoView({ block: 'start' });
      break;
    }
    case 'close-sheet': closeSheet(); break;
  }
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'import-file') return importData(t.files[0]);
  const a = t.dataset.action;
  if (a === 'select-ex') go('progress', { ex: t.value });
  if (a === 'override') {
    const slot = Object.values(WORKOUTS).flatMap((w) => w.slots).find((s) => s.id === t.dataset.slot);
    const w = slot.id[0];
    delete state.overrides[slot.id];
    if (slotExercise(w, slot) !== t.value) state.overrides[slot.id] = t.value;
    save(); render(); toast('Übung für diesen Block geändert');
  }
  if (a === 'inc') {
    const v = parseNum(t.value); if (v == null) return;
    const base = ex(t.dataset.ex).inc;
    state.exSettings[t.dataset.ex] = { inc: base < 0 ? -Math.abs(v) : Math.abs(v) };
    save(); toast('Steigerung gespeichert');
  }
  if (a === 'setting') {
    const v = parseInt(t.value, 10);
    if (!v || v < 1) return;
    state.settings[t.dataset.key] = t.dataset.key === 'blockLen' ? Math.min(Math.max(v, 2), 20) : Math.min(Math.max(v, 15), 600);
    save(); toast('Gespeichert');
  }
});

// Eingaben im Training sofort übernehmen
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.dataset.field && state.current) {
    const set = state.current.exercises[+t.dataset.i].sets[+t.dataset.j];
    set[t.dataset.field] = parseNum(t.value);
    save();
  }
});
function syncInputs() {
  document.querySelectorAll('[data-field]').forEach((inp) => {
    const set = state.current?.exercises[+inp.dataset.i]?.sets[+inp.dataset.j];
    if (set) set[inp.dataset.field] = parseNum(inp.value);
  });
}

function openSwap(i) {
  const cur = state.current; const e = cur.exercises[i];
  const slot = WORKOUTS[cur.workout].slots.find((s) => s.id === e.slot);
  const opts = slot.options.filter((id) => id !== e.exId);
  $('#sheet-body').innerHTML = `
    <h3>Übung tauschen</h3>
    <p class="muted small">Gerät besetzt oder Lust auf Abwechslung? Wähle eine Alternative für „${esc(slot.label)}“.</p>
    ${opts.map((id) => `<div class="swap-opt">
      <div><b>${esc(ex(id).name)}</b><div class="muted small">${ex(id).sets} × ${ex(id).reps[0]}–${ex(id).reps[1]} · Vorschlag ${fmtKg(suggestion(id).weight)} kg</div></div>
      <div class="col"><button class="btn small" data-action="pick-swap" data-i="${i}" data-ex="${id}">Nur heute</button>
      <button class="btn small primary" data-action="pick-swap" data-i="${i}" data-ex="${id}" data-keep="1">Für den Block</button></div>
    </div>`).join('')}
    <button class="btn ghost" data-action="close-sheet">Abbrechen</button>`;
  $('#sheet').classList.add('show');
}
function closeSheet() { $('#sheet').classList.remove('show'); }
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });

/* ================= Backup ================= */
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const name = `gymplan-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'Gym Plan Backup' }).catch(() => {});
    return;
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!Array.isArray(data.sessions)) throw new Error('format');
      if (!confirm(`Backup mit ${data.sessions.length} Trainings laden? Aktuelle Daten werden ersetzt.`)) return;
      state = Object.assign(defaultState(), data); save(); go('home'); toast('Backup geladen');
    } catch (e) { toast('Datei ist kein gültiges Backup'); }
  };
  r.readAsText(file);
}

/* ================= Start ================= */
window.addEventListener('resize', () => { if (route.name === 'progress') drawCharts(); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

render();
