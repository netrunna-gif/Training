'use strict';
/* Oberfläche im iOS-Stil: Large Titles, gruppierte Listen, Systemfarben, SF-ähnliche Symbole */

/* ================= Symbole ================= */
const svg = (d, cls = '') => `<svg class="sym ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  chevron: svg('<path d="M9.5 5.5 16 12l-6.5 6.5"/>', 'chev'),
  swap: svg('<path d="M4 8h14.5M15 4.5 18.5 8 15 11.5M20 16H5.5M9 12.5 5.5 16 9 19.5"/>'),
  check: svg('<path d="m5.5 12.5 4 4 9-9.5"/>'),
  up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>'),
  sparkle: svg('<path d="M12 3.5 13.8 10 20.5 12 13.8 14 12 20.5 10.2 14 3.5 12 10.2 10z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  flame: svg('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.4 3.7-8.8 1.9 1.3 2.6 3 2.6 4.6 1.3-.6 2.1-1.8 2.3-3.1 2.4 2 3.4 4.5 3.4 7.3 0 3.6-2.6 6.2-5.5 6.2z"/>'),
  repeat: svg('<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19M16 3l3 3-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5M8 21l-3-3 3-3"/>'),
  trend: svg('<path d="M3.5 17 9 11.5l3.5 3.5L20.5 7M15 7h5.5v5.5"/>'),
  scale: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 13"/>'),
  share: svg('<path d="M12 15V3.5M8 7.5l4-4 4 4M6.5 11H5.5v9.5h13V11h-1"/>'),
  doc: svg('<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M12 11v6M9 14l3 3 3-3"/>'),
  trophy: svg('<path d="M8 4.5h8v5a4 4 0 0 1-8 0zM8 6.5H5v1.5a3 3 0 0 0 3 3M16 6.5h3v1.5a3 3 0 0 1-3 3M12 13.5V17M8.5 20h7M9.5 17h5v3h-5z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
};

/* ================= Router ================= */
let route = { name: 'home', params: {} };
const ROUTES = {
  home:     { title: 'Training', view: () => viewHome() },
  workout:  { title: () => WORKOUTS[state.current?.workout]?.name || 'Training', view: () => viewWorkout(),
              action: { label: 'Fertig', action: 'finish' } },
  summary:  { title: 'Zusammenfassung', view: () => viewSummary(), action: { label: 'Fertig', action: 'nav', to: 'home' } },
  history:  { title: 'Verlauf', view: () => viewHistory() },
  session:  { title: () => { const s = state.sessions.find((x) => x.id === route.params.id); return s ? WORKOUTS[s.workout].name : 'Training'; },
              view: () => viewSession(), back: { label: 'Verlauf', to: 'history' } },
  progress: { title: 'Fortschritt', view: () => viewProgress() },
  plan:     { title: 'Plan', view: () => viewPlan() },
  settings: { title: 'Mehr', view: () => viewSettings() },
};
const TAB_OF = { workout: 'home', summary: 'home', session: 'history' };

function go(name, params = {}) {
  route = { name, params };
  render();
  window.scrollTo(0, 0);
  onScroll();
}

function render() {
  const r = ROUTES[route.name] || ROUTES.home;
  const title = typeof r.title === 'function' ? r.title() : r.title;
  const tab = TAB_OF[route.name] || route.name;
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $('#nav-title').textContent = title;
  const back = $('#nav-back');
  back.hidden = !r.back;
  if (r.back) { back.dataset.to = r.back.to; back.querySelector('span').textContent = r.back.label; }
  const act = $('#nav-action');
  act.hidden = !r.action;
  if (r.action) { act.textContent = r.action.label; act.dataset.action = r.action.action; act.dataset.to = r.action.to || ''; }
  $('#view').innerHTML = `<h1 class="large-title">${esc(title)}</h1>` + r.view();
  if (route.name === 'progress') drawCharts();
}

function onScroll() { $('#navbar').classList.toggle('scrolled', window.scrollY > 38); }
window.addEventListener('scroll', onScroll, { passive: true });

/* ================= Bausteine ================= */
const section = (header, body, footer) =>
  `<section class="section">${header ? `<h2 class="section-header">${header}</h2>` : ''}${body}${footer ? `<p class="section-footer">${footer}</p>` : ''}</section>`;
const list = (cells, cls = '') => `<div class="list ${cls}">${cells}</div>`;

function badge(status) {
  return { up: `<span class="badge green">${ICON.up}mehr</span>`, down: `<span class="badge red">${ICON.down}leichter</span>`,
           new: '<span class="badge blue">Neu</span>', hold: '' }[status] || '';
}

function ring(v, max) {
  const r = 26, c = 2 * Math.PI * r, p = Math.min(1, v / max);
  return `<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${r}" class="ring-bg"/>
    <circle cx="32" cy="32" r="${r}" class="ring-fg" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)" ${p === 0 ? 'opacity="0"' : ''}/></svg>`;
}

const setsTxt = (sets) => sets.map((x) => x.w ? `${fmtKg(x.w)}×${x.r}` : `${x.r}`).join(' · ');
const volume = (s) => s.exercises.reduce((n, e) => n + e.sets.reduce((m, x) => m + (x.w || 0) * x.r, 0), 0);
const setCount = (s) => s.exercises.reduce((n, e) => n + e.sets.length, 0);

/* ================= Views ================= */
function viewHome() {
  let out = '';
  if (state.notice) {
    out += section('', list(`<div class="cell"><span class="cell-icon tint-orange">${ICON.sparkle}</span>
      <div class="grow"><div class="body">${esc(state.notice)}</div></div></div>
      <button class="cell cell-button" data-action="dismiss-notice">Verstanden</button>`));
  }

  if (state.current) {
    const c = state.current;
    const done = c.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
    const total = c.exercises.reduce((n, e) => n + e.sets.length, 0);
    out += section('Läuft gerade', list(`<div class="cell"><div class="grow">
        <div class="headline">${esc(WORKOUTS[c.workout].name)}</div>
        <div class="sub">${done} von ${total} Sätzen erledigt</div>
        <div class="progress"><span style="width:${(100 * done / total) || 0}%"></span></div></div></div>`)
      + `<button class="btn-filled" data-action="resume">Weiter trainieren</button>`);
    return out;
  }

  const w = nextWorkout();
  const plan = WORKOUTS[w];
  const thisWeek = state.sessions.filter((s) => weekKey(s.date) === weekKey(new Date())).length;
  out += section('Diese Woche', list(`<div class="cell summary-cell">${ring(thisWeek, 2)}
      <div class="grow"><div class="title3">${Math.min(thisWeek, 9)} von 2 Trainings</div>
      <div class="sub">${thisWeek >= 2 ? 'Wochenziel erreicht 🎉' : 'Wochenziel: 2× Ganzkörper'}</div>
      <div class="mini-stats"><div><b>${state.sessions.length}</b><span>Gesamt</span></div>
      <div><b>${weekStreak()}</b><span>Wochen in Folge</span></div></div></div></div>`));

  const rows = plan.slots.map((slot) => {
    const id = slotExercise(w, slot); const e = ex(id); const s = suggestion(id);
    const wt = s.weight ? fmtKg(s.weight) + ' kg' : (e.unit === 'Sek' ? 'Körper' : '–');
    return `<div class="cell"><div class="grow"><div class="body">${esc(e.name)} ${badge(s.status)}</div>
      <div class="sub">${esc(slot.label)}</div></div>
      <div class="value"><div>${wt}</div><div class="sub">${e.sets} × ${e.reps[0]}–${e.reps[1]}</div></div></div>`;
  }).join('');
  const other = w === 'A' ? 'B' : 'A';
  out += section('Nächstes Training', list(`<div class="cell"><div class="grow">
        <div class="title2">${esc(plan.name)}</div><div class="sub">${esc(plan.focus)}</div></div>
        <span class="pill">Block ${(state.blocks[w] || 0) + 1} · ${(state.blockSessions[w] || 0) + 1}/${state.settings.blockLen}</span></div>${rows}`)
    + `<button class="btn-filled" data-action="start" data-w="${w}">Training starten</button>
       <button class="btn-plain" data-action="start" data-w="${other}">Stattdessen ${esc(WORKOUTS[other].name)}</button>`,
    'Aufwärmen: 5–8 Min. Crosstrainer oder Rad, dann bei der ersten Übung 1–2 leichte Sätze. Dauer ca. 55–60 Min.');
  return out;
}

function weekStreak() {
  if (!state.sessions.length) return 0;
  const weeks = new Set(state.sessions.map((s) => weekKey(s.date)));
  let n = 0; const d = new Date();
  if (!weeks.has(weekKey(d))) d.setDate(d.getDate() - 7);
  while (weeks.has(weekKey(d))) { n++; d.setDate(d.getDate() - 7); }
  return n;
}

function viewWorkout() {
  const c = state.current;
  if (!c) return viewHome();
  const mins = Math.round((Date.now() - new Date(c.startedAt)) / 60000);
  const done = c.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const total = c.exercises.reduce((n, e) => n + e.sets.length, 0);
  let out = section('', list(`<div class="cell"><span class="cell-icon tint-blue">${ICON.clock}</span><div class="grow">
      <div class="body">${done} von ${total} Sätzen</div><div class="progress"><span style="width:${(100 * done / total) || 0}%"></span></div></div>
      <div class="value">${mins} Min.</div></div>`), 'Haken setzen = Satz fertig. Danach startet automatisch die Pause.');

  out += c.exercises.map((e, i) => {
    const E = ex(e.exId); const s = e.suggestion;
    const slot = WORKOUTS[c.workout].slots.find((x) => x.id === e.slot);
    const complete = e.sets.length && e.sets.every((x) => x.done);
    const last = historyOf(e.exId)[0];
    const hintIcon = { up: ICON.up, down: ICON.down, new: ICON.info, hold: ICON.trend }[s.status];
    const rows = e.sets.map((set, j) => `
      <div class="set ${set.done ? 'done' : ''}">
        <span class="set-no">${j + 1}</span>
        <input type="text" inputmode="decimal" value="${set.w ?? ''}" placeholder="–" data-field="w" data-i="${i}" data-j="${j}" aria-label="Gewicht Satz ${j + 1}">
        <input type="text" inputmode="numeric" value="${set.r ?? ''}" placeholder="${s.reps}" data-field="r" data-i="${i}" data-j="${j}" aria-label="${E.unit} Satz ${j + 1}">
        <button class="check" data-action="toggle-set" data-i="${i}" data-j="${j}" aria-label="Satz abhaken">${ICON.check}</button>
      </div>`).join('');
    return `<section class="section" id="ex-${i}"><h2 class="section-header">${i + 1}. ${esc(slot?.label || '')}</h2>
      <div class="list ${complete ? 'complete' : ''}">
        <div class="cell"><div class="grow"><div class="headline">${esc(E.name)}${complete ? ` <span class="done-mark">${ICON.check}</span>` : ''}</div>
          <div class="sub">Ziel ${E.sets} × ${E.reps[0]}–${E.reps[1]} ${E.unit}.${last ? ' · Zuletzt ' + esc(setsTxt(last.sets)) : ''}</div></div>
          <button class="circle-btn" data-action="swap" data-i="${i}" aria-label="Übung tauschen">${ICON.swap}</button></div>
        <div class="cell hint ${s.status}">${hintIcon}<span>${esc(s.note)}</span></div>
        ${plateau(e.exId) ? `<div class="cell hint down">${ICON.repeat}<span>3 Einheiten ohne Fortschritt – probier eine andere Übung (⇄).</span></div>` : ''}
        <div class="set-head"><span>Satz</span><span>kg</span><span>${E.unit}.</span><span></span></div>
        ${rows}
        <div class="cell cell-actions">
          <button class="btn-link" data-action="add-set" data-i="${i}">${ICON.plus}Satz</button>
          <button class="btn-link" data-action="tip" data-i="${i}">${ICON.info}Technik</button></div>
        <div class="cell tech hidden" id="tip-${i}"><span class="sub">${esc(E.tip)}</span></div>
      </div></section>`;
  }).join('');
  out += `<button class="btn-filled" data-action="finish">Training beenden</button>
    <button class="btn-plain destructive" data-action="discard">Training verwerfen</button>`;
  return out;
}

function viewSummary() {
  const s = state.sessions.find((x) => x.id === route.params.id);
  if (!s) return viewHome();
  const rows = s.exercises.map((e) => {
    const sug = suggestion(e.exId); const E = ex(e.exId); const pr = s.prs?.includes(e.exId);
    const arrow = { up: `<span class="tint-green">${ICON.up}</span>`, down: `<span class="tint-red">${ICON.down}</span>` }[sug.status] || '';
    return `<div class="cell"><div class="grow"><div class="body">${esc(E.name)} ${pr ? `<span class="badge orange">${ICON.trophy}Rekord</span>` : ''}</div>
      <div class="sub">${esc(setsTxt(e.sets))}</div></div>
      <div class="value">${arrow}${sug.weight ? fmtKg(sug.weight) + ' kg' : ''}<div class="sub">Ziel ${sug.reps} ${E.unit}.</div></div></div>`;
  }).join('');
  return `
    <div class="done-hero"><div class="done-circle">${ICON.check}</div>
      <div class="title1">Gut gemacht!</div><div class="sub">${esc(WORKOUTS[s.workout].name)} · ${fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
    <div class="tiles">
      <div class="tile"><span class="tile-label">Dauer</span><span class="tile-value tint-blue">${s.durationMin}<small> Min.</small></span></div>
      <div class="tile"><span class="tile-label">Sätze</span><span class="tile-value tint-green">${setCount(s)}</span></div>
      <div class="tile"><span class="tile-label">Volumen</span><span class="tile-value tint-orange">${(volume(s) / 1000).toFixed(1).replace('.', ',')}<small> t</small></span></div>
    </div>
    ${s.prs?.length ? section('', list(`<div class="cell"><span class="cell-icon tint-orange">${ICON.trophy}</span><div class="grow"><div class="body">${s.prs.length} neue Bestleistung${s.prs.length > 1 ? 'en' : ''}!</div></div></div>`)) : ''}
    ${route.params.blockChanged ? section('', list(`<div class="cell"><span class="cell-icon tint-blue">${ICON.repeat}</span><div class="grow"><div class="body">Block abgeschlossen</div><div class="sub">Beim nächsten ${esc(WORKOUTS[s.workout].name)} warten neue Übungsvarianten.</div></div></div>`)) : ''}
    ${section('Nächstes Mal', list(rows), 'Die App passt Gewicht und Ziel-Wiederholungen automatisch an deine Leistung an.')}
    <button class="btn-filled" data-action="nav" data-to="home">Fertig</button>`;
}

function empty(icon, title, sub) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><div class="title3">${esc(title)}</div><p class="sub">${esc(sub)}</p></div>`;
}

function viewHistory() {
  if (!state.sessions.length) return empty(ICON.clock, 'Noch keine Trainings', 'Starte dein erstes Training im Tab „Training“.');
  const groups = {};
  state.sessions.slice().reverse().forEach((s) => {
    const k = fmtDate(s.date, { month: 'long', year: 'numeric' });
    (groups[k] = groups[k] || []).push(s);
  });
  return Object.entries(groups).map(([month, ss]) => section(esc(month), list(ss.map((s) => `
    <button class="cell cell-link" data-action="nav" data-to="session" data-id="${s.id}">
      <span class="cell-icon tint-${s.workout === 'A' ? 'blue' : 'green'} letter">${s.workout}</span>
      <div class="grow"><div class="body">${esc(WORKOUTS[s.workout].name)} ${s.prs?.length ? `<span class="badge orange">${ICON.trophy}${s.prs.length}</span>` : ''}</div>
      <div class="sub">${fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
      <div class="value">${setCount(s)} Sätze<div class="sub">${s.durationMin} Min.</div></div>${ICON.chevron}</button>`).join('')))).join('');
}

function viewSession() {
  const s = state.sessions.find((x) => x.id === route.params.id);
  if (!s) return empty(ICON.info, 'Nicht gefunden', '');
  return `<p class="subtitle">${fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <div class="tiles">
      <div class="tile"><span class="tile-label">Dauer</span><span class="tile-value tint-blue">${s.durationMin}<small> Min.</small></span></div>
      <div class="tile"><span class="tile-label">Sätze</span><span class="tile-value tint-green">${setCount(s)}</span></div>
      <div class="tile"><span class="tile-label">Volumen</span><span class="tile-value tint-orange">${(volume(s) / 1000).toFixed(1).replace('.', ',')}<small> t</small></span></div>
    </div>` +
    s.exercises.map((e) => section(esc(ex(e.exId)?.name || e.exId) + (s.prs?.includes(e.exId) ? ' 🏆' : ''),
      list(e.sets.map((x, j) => `<div class="cell"><div class="grow"><div class="body">Satz ${j + 1}</div></div>
        <div class="value strong">${x.w ? fmtKg(x.w) + ' kg × ' : ''}${x.r} ${ex(e.exId)?.unit || ''}.</div></div>`).join('')))).join('') +
    section('', list(`<button class="cell cell-button destructive" data-action="delete-session" data-id="${s.id}">Training löschen</button>`));
}

function viewProgress() {
  const used = [...new Set(state.sessions.flatMap((s) => s.exercises.map((e) => e.exId)))].filter((id) => EXERCISES[id]);
  const bw = state.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
  const bwLast = bw[bw.length - 1];
  const bwDiff = bw.length > 1 ? bwLast.kg - bw[0].kg : null;
  const bwSection = section('Körpergewicht', list(`
      ${bw.length ? `<div class="cell"><span class="cell-icon tint-purple">${ICON.scale}</span><div class="grow"><div class="body">${fmtKg(bwLast.kg)} kg</div>
        <div class="sub">${fmtDate(bwLast.date, { day: 'numeric', month: 'long' })}</div></div>
        ${bwDiff != null ? `<div class="value">${bwDiff > 0 ? '+' : ''}${fmtKg(Math.round(bwDiff * 10) / 10)} kg<div class="sub">seit Start</div></div>` : ''}</div>` : ''}
      ${bw.length >= 2 ? '<div class="cell chart-cell"><canvas class="chart" id="chart-bw"></canvas></div>' : ''}
      <div class="cell"><input type="text" inputmode="decimal" id="bw-input" class="inline-input grow" placeholder="Heutiges Gewicht in kg">
        <button class="btn-small" data-action="add-bw">Eintragen</button></div>`));
  if (!used.length) return empty(ICON.trend, 'Noch keine Daten', 'Nach deinem ersten Training siehst du hier deine Entwicklung.') + bwSection;

  const sel = route.params.ex && used.includes(route.params.ex) ? route.params.ex : used[0];
  const E = ex(sel);
  const hist = historyOf(sel).reverse();
  const first = hist[0], last = hist[hist.length - 1];
  const best = Math.max(...hist.map((h) => sessionScore(sel, h.sets)));
  const metric = E.inc < 0 ? 'Unterstützung in kg' : (E.inc === 0 ? 'Beste Wiederholungen / Sekunden' : 'Geschätztes Maximalgewicht (1RM) in kg');

  return section('', list(`
      <label class="cell cell-select"><div class="grow body">Übung</div>
        <select id="ex-select" data-action="select-ex">${used.map((id) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(ex(id).name)}</option>`).join('')}</select>${ICON.chevron}</label>
      <div class="cell chart-cell"><canvas class="chart" id="chart-ex"></canvas></div>`), esc(metric))
    + `<div class="tiles">
        <div class="tile"><span class="tile-label">Einheiten</span><span class="tile-value tint-blue">${hist.length}</span></div>
        <div class="tile"><span class="tile-label">Gewicht</span><span class="tile-value tint-green">${fmtKg(topWeight(last.sets))}<small> kg</small></span>
          <span class="tile-foot">Start ${fmtKg(topWeight(first.sets))} kg</span></div>
        <div class="tile"><span class="tile-label">Bestes 1RM</span><span class="tile-value tint-orange">${E.inc <= 0 ? '–' : fmtKg(Math.round(best))}${E.inc > 0 ? '<small> kg</small>' : ''}</span></div>
      </div>`
    + (plateau(sel) ? section('', list(`<div class="cell hint down">${ICON.repeat}<span>Plateau erkannt – im Tab „Plan“ kannst du eine Alternative wählen.</span></div>`)) : '')
    + section('Letzte Einheiten', list(hist.slice().reverse().slice(0, 6).map((h) => `<div class="cell"><div class="grow body">${fmtDate(h.date, { day: 'numeric', month: 'short' })}</div>
        <div class="value">${esc(setsTxt(h.sets))}</div></div>`).join('')))
    + section('Sätze pro Woche', list('<div class="cell chart-cell"><canvas class="chart" id="chart-vol"></canvas></div>'),
      'Für Muskelaufbau sind etwa 10 harte Sätze pro Muskelgruppe und Woche ideal – mit 2× Ganzkörper kommst du gut dahin.')
    + bwSection;
}

function viewPlan() {
  const w = route.params.w || nextWorkout();
  const plan = WORKOUTS[w];
  const seg = `<div class="segmented" role="tablist">${['A', 'B'].map((k) =>
    `<button role="tab" class="${k === w ? 'active' : ''}" data-action="seg" data-w="${k}">${esc(WORKOUTS[k].name)}</button>`).join('')}</div>`;
  const rows = plan.slots.map((slot) => {
    const cur = slotExercise(w, slot); const E = ex(cur);
    const opts = slot.options.map((id) => `<option value="${id}" ${id === cur ? 'selected' : ''}>${esc(ex(id).name)}</option>`).join('');
    return `<div class="cell slot-cell"><div class="grow">
        <div class="sub">${esc(slot.label)}${state.overrides[slot.id] ? ' · manuell gewählt' : ''}</div>
        <label class="slot-select"><select data-action="override" data-slot="${slot.id}">${opts}</select>${ICON.chevron}</label>
        <div class="sub">${E.sets} × ${E.reps[0]}–${E.reps[1]} ${E.unit}. · Steigerung
          <input class="inc" type="text" inputmode="decimal" value="${fmtKg(Math.abs(incOf(cur)))}" data-action="inc" data-ex="${cur}" aria-label="Steigerung in kg"> kg</div>
      </div></div>`;
  }).join('');
  const feat = (icon, tint, title, text) => `<div class="cell feature"><span class="cell-icon tint-${tint}">${icon}</span><div class="grow"><div class="body strong">${title}</div><div class="sub">${text}</div></div></div>`;
  return seg
    + section(`Block ${(state.blocks[w] || 0) + 1} · ${state.blockSessions[w] || 0} von ${state.settings.blockLen} Einheiten`, list(rows),
      `Grundübungen wechseln alle ${state.settings.blockLen * 2}, die übrigen alle ${state.settings.blockLen} Einheiten. Tippe auf eine Übung, um sie für den aktuellen Block zu tauschen.`)
    + section('So passt sich dein Plan an', list(
      feat(ICON.repeat, 'blue', 'A und B im Wechsel', 'Zwei Ganzkörpertrainings mit unterschiedlichen Übungen – jeder Muskel wird 2× pro Woche trainiert.')
      + feat(ICON.up, 'green', 'Automatisch schwerer', 'Schaffst du in allen Sätzen das obere Ende des Wiederholungsbereichs, steigt das Gewicht. Sonst ist das Ziel +1 Wiederholung.')
      + feat(ICON.down, 'red', 'Deload', 'Zweimal hintereinander unter dem Bereich → ca. 10 % leichter und neu aufbauen.')
      + feat(ICON.sparkle, 'orange', 'Neue Reize', `Nach jedem Block (${state.settings.blockLen} Einheiten) wechseln Übungen. Kommt eine zurück, startet sie bei deinem letzten Gewicht.`)
      + feat(ICON.trend, 'purple', 'Plateau-Erkennung', '3 Einheiten ohne Bestwert → die App schlägt einen Tausch vor.')));
}

function viewSettings() {
  const stepper = (key, label, value, unit, d) => `<div class="cell"><div class="grow"><div class="body">${label}</div><div class="sub">${value} ${unit}</div></div>
    <div class="stepper"><button data-action="step" data-key="${key}" data-d="${-d}" aria-label="weniger">${ICON.minus}</button><span></span>
    <button data-action="step" data-key="${key}" data-d="${d}" aria-label="mehr">${ICON.plus}</button></div></div>`;
  return section('Training', list(
      stepper('rest', 'Pausenzeit', state.settings.rest, 'Sekunden', 15)
      + stepper('blockLen', 'Blocklänge', state.settings.blockLen, 'Einheiten je Plan', 1)),
      'Nach einer Übung ist die Pause automatisch mindestens 2 Minuten. Nach jedem Block wechseln die Übungen.')
    + section('Daten', list(`
      <button class="cell cell-link" data-action="export"><span class="cell-icon tint-blue">${ICON.share}</span><div class="grow body">Backup exportieren</div>${ICON.chevron}</button>
      <label class="cell cell-link"><span class="cell-icon tint-green">${ICON.doc}</span><div class="grow body">Backup importieren</div>${ICON.chevron}
        <input type="file" accept="application/json,.json" id="import-file" hidden></label>`),
      'Deine Daten liegen nur auf diesem iPhone. Sichere ab und zu ein Backup, z. B. über „In Dateien sichern“ in iCloud Drive.')
    + section('Auf dem iPhone installieren', list(`
      <div class="cell"><span class="step-no">1</span><div class="grow body">Diese Seite in <b>Safari</b> öffnen</div></div>
      <div class="cell"><span class="step-no">2</span><div class="grow body">Unten auf <b>Teilen</b> tippen</div></div>
      <div class="cell"><span class="step-no">3</span><div class="grow body"><b>Zum Home-Bildschirm</b> wählen</div></div>`))
    + section('', list(`<button class="cell cell-button destructive" data-action="reset">Alle Daten löschen</button>`),
      `Gym Plan · ${state.sessions.length} Trainings gespeichert`);
}

/* ================= Diagramme ================= */
function drawCharts() {
  const sel = $('#ex-select')?.value;
  if (sel) {
    const E = ex(sel);
    const hist = historyOf(sel).reverse();
    const pts = hist.map((h) => ({ x: new Date(h.date),
      y: E.inc < 0 ? topWeight(h.sets) : (E.inc === 0 && !h.sets.some((s) => s.w > 0) ? Math.max(...h.sets.map((s) => s.r)) : sessionScore(sel, h.sets)) }));
    lineChart($('#chart-ex'), pts, 'blue');
  }
  const weeks = {};
  state.sessions.forEach((s) => { const k = weekKey(s.date); weeks[k] = (weeks[k] || 0) + setCount(s); });
  const keys = Object.keys(weeks).sort().slice(-10);
  if ($('#chart-vol')) barChart($('#chart-vol'), keys.map((k) => ({ label: 'KW ' + +k.split('-')[1], y: weeks[k] })));
  const bw = state.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
  if ($('#chart-bw')) lineChart($('#chart-bw'), bw.map((b) => ({ x: new Date(b.date), y: b.kg })), 'purple');
}

function setupCanvas(cv) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue('--' + n).trim();
  return { ctx, w, h, v, font: '600 11px -apple-system, BlinkMacSystemFont, system-ui' };
}

function lineChart(cv, pts, color) {
  if (!cv) return;
  const { ctx, w, h, v, font } = setupCanvas(cv);
  const accent = v(color), muted = v('label3'), line = v('sep');
  const pad = { l: 8, r: 34, t: 12, b: 22 };
  ctx.font = font;
  if (pts.length < 2) { ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.fillText('Ab 2 Einheiten siehst du hier eine Kurve', w / 2, h / 2); return; }
  let ymin = Math.min(...pts.map((p) => p.y)), ymax = Math.max(...pts.map((p) => p.y));
  const span = (ymax - ymin) || ymax * 0.1 || 1; ymin -= span * 0.2; ymax += span * 0.2;
  const x0 = +pts[0].x, x1 = +pts[pts.length - 1].x;
  const X = (x) => pad.l + ((+x - x0) / ((x1 - x0) || 1)) * (w - pad.l - pad.r);
  const Y = (y) => pad.t + (1 - (y - ymin) / (ymax - ymin)) * (h - pad.t - pad.b);
  ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.fillStyle = muted; ctx.textAlign = 'left';
  ctx.setLineDash([2, 3]);
  for (let i = 0; i <= 3; i++) {
    const val = ymin + (ymax - ymin) * i / 3; const y = Y(val);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    ctx.fillText((ymax - ymin) < 6 ? fmtKg(Math.round(val * 10) / 10) : Math.round(val), w - pad.r + 6, y + 4);
  }
  ctx.setLineDash([]);
  ctx.textAlign = 'left'; ctx.fillText(fmtDate(pts[0].x, { day: 'numeric', month: 'short' }), pad.l, h - 4);
  ctx.textAlign = 'right'; ctx.fillText(fmtDate(pts[pts.length - 1].x, { day: 'numeric', month: 'short' }), w - pad.r, h - 4);
  const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  grad.addColorStop(0, accent + '40'); grad.addColorStop(1, accent + '00');
  ctx.beginPath(); ctx.moveTo(X(pts[0].x), h - pad.b);
  pts.forEach((p) => ctx.lineTo(X(p.x), Y(p.y))); ctx.lineTo(X(pts[pts.length - 1].x), h - pad.b); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)));
  ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  const lp = pts[pts.length - 1];
  ctx.fillStyle = v('bg2'); ctx.beginPath(); ctx.arc(X(lp.x), Y(lp.y), 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(X(lp.x), Y(lp.y), 4, 0, Math.PI * 2); ctx.fill();
}

function barChart(cv, data) {
  if (!cv || !data.length) return;
  const { ctx, w, h, v, font } = setupCanvas(cv);
  const pad = { l: 8, r: 8, t: 18, b: 22 };
  const max = Math.max(...data.map((d) => d.y), 1);
  const slot = (w - pad.l - pad.r) / Math.max(data.length, 4);
  const bw = Math.min(28, slot * 0.6);
  ctx.font = font; ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const bh = Math.max(4, (d.y / max) * (h - pad.t - pad.b));
    const cx = pad.l + slot * i + slot / 2, y = h - pad.b - bh;
    ctx.fillStyle = v('green'); roundRect(ctx, cx - bw / 2, y, bw, bh, 5); ctx.fill();
    ctx.fillStyle = v('label2'); ctx.fillText(d.y, cx, y - 5);
    ctx.fillStyle = v('label3'); ctx.fillText(d.label, cx, h - 4);
  });
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ================= Events ================= */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-action], .tabbar button');
  if (!t) return;
  if (t.dataset.tab) { go(t.dataset.tab); return; }
  const a = t.dataset.action; const i = +t.dataset.i; const j = +t.dataset.j;
  const cur = state.current;
  const keepScroll = (fn) => { const y = window.scrollY; fn(); render(); window.scrollTo(0, y); };
  switch (a) {
    case 'start': startWorkout(t.dataset.w); break;
    case 'resume': go('workout'); break;
    case 'dismiss-notice': state.notice = null; save(); render(); break;
    case 'nav': go(t.dataset.to, t.dataset.id ? { id: t.dataset.id } : {}); break;
    case 'seg': go('plan', { w: t.dataset.w }); break;
    case 'toggle-set': {
      syncInputs();
      const set = cur.exercises[i].sets[j];
      if (!set.done && set.r == null) set.r = cur.exercises[i].suggestion.reps;
      set.done = !set.done; save();
      keepScroll(() => {});
      if (set.done) {
        const exDone = cur.exercises[i].sets.every((s) => s.done);
        if (exDone && i + 1 < cur.exercises.length) {
          startRest(Math.max(state.settings.rest, 120));
          setTimeout(() => { const el = $('#ex-' + (i + 1)); if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' }); }, 300);
        } else if (!exDone) startRest();
      }
      break;
    }
    case 'add-set': {
      syncInputs();
      const sets = cur.exercises[i].sets; const lastSet = sets[sets.length - 1];
      sets.push({ w: lastSet ? lastSet.w : cur.exercises[i].suggestion.weight, r: null, done: false });
      save(); keepScroll(() => {}); break;
    }
    case 'tip': $('#tip-' + i).classList.toggle('hidden'); break;
    case 'swap': openSwap(i); break;
    case 'finish': syncInputs(); if (confirm('Training beenden und speichern?')) finishWorkout(); break;
    case 'discard': if (confirm('Training wirklich verwerfen? Die Sätze gehen verloren.')) { state.current = null; save(); stopRest(); go('home'); } break;
    case 'rest-skip': stopRest(); break;
    case 'rest-add': startRest(Math.round(Math.max(0, restEnd - Date.now()) / 1000) + 30); break;
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
    case 'step': {
      const k = t.dataset.key; const d = +t.dataset.d;
      const lim = k === 'rest' ? [30, 300] : [2, 20];
      state.settings[k] = Math.min(lim[1], Math.max(lim[0], state.settings[k] + d));
      save(); keepScroll(() => {}); break;
    }
    case 'export': exportData(); break;
    case 'reset':
      if (confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.') && confirm('Sicher? Vorher besser ein Backup exportieren.')) {
        state = defaultState(); save(); go('home');
      }
      break;
    case 'pick-swap': {
      const idx = +t.dataset.i; const e = cur.exercises[idx];
      const slot = WORKOUTS[cur.workout].slots.find((s) => s.id === e.slot);
      if (t.dataset.keep === '1') state.overrides[slot.id] = t.dataset.ex;
      cur.exercises[idx] = buildExercise(slot, t.dataset.ex);
      closeSheet(); save(); render();
      const el = $('#ex-' + idx); if (el) window.scrollTo(0, el.offsetTop - 60);
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
    const val = parseNum(t.value); if (val == null) return;
    const base = ex(t.dataset.ex).inc;
    state.exSettings[t.dataset.ex] = { inc: base < 0 ? -Math.abs(val) : Math.abs(val) };
    save(); toast('Steigerung gespeichert');
  }
});

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
    <div class="grabber"></div>
    <div class="sheet-nav"><span></span><div class="headline">Übung tauschen</div><button class="btn-link strong" data-action="close-sheet">Abbrechen</button></div>
    <p class="sub center">Gerät besetzt oder Lust auf Abwechslung? Alternative für „${esc(slot.label)}“:</p>
    ${list(opts.map((id) => `<div class="cell"><div class="grow"><div class="body">${esc(ex(id).name)}</div>
      <div class="sub">${ex(id).sets} × ${ex(id).reps[0]}–${ex(id).reps[1]} · Vorschlag ${fmtKg(suggestion(id).weight)} kg</div></div>
      <div class="swap-btns"><button class="btn-small gray" data-action="pick-swap" data-i="${i}" data-ex="${id}">Heute</button>
      <button class="btn-small" data-action="pick-swap" data-i="${i}" data-ex="${id}" data-keep="1">Ganzer Block</button></div></div>`).join(''))}
    <p class="section-footer">„Heute“ tauscht nur für dieses Training. „Ganzer Block“ behält die Übung, bis der Plan wechselt.</p>`;
  $('#sheet').classList.add('show');
}
function closeSheet() { $('#sheet').classList.remove('show'); }
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });

/* ================= Start ================= */
window.addEventListener('resize', () => { if (route.name === 'progress') drawCharts(); });
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
render();
