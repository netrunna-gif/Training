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

