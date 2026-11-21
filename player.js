'use strict';
/*
 * Geführtes Training mit Timer (Zuhause-Training).
 * Baut aus dem laufenden Training eine Abfolge von Schritten:
 *   Aufwärmen (zeitgesteuert) → je Übung: "Bereit?" (wartet auf dich) → Satz → Pause → Satz …
 *   → Mobilitäts-Flow (zeitgesteuert) → Geschafft.
 * Zeitmessung über Zeitstempel, damit sie auch stimmt, wenn das iPhone kurz gesperrt war.
 */
const PLAYER = (() => {
  let steps = [];
  let idx = 0;
  let running = false;
  let endAt = 0;
  let remain = 0;
  let ticker = null;
  let wakeLock = null;
  let lastBeep = null;
  let sideSwitched = false;

  const el = () => document.getElementById('player');

  // ---------- Töne ----------
  function unlockAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* kein Audio */ }
  }
  function tone(freq, dur = 0.15, delay = 0) {
    try {
      if (!audioCtx) return;
      const t = audioCtx.currentTime + delay;
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* kein Audio */ }
  }
  const tick3 = () => tone(660, 0.12);
  const endTone = () => { tone(880, 0.18); tone(1175, 0.3, 0.2); };
  const sideTone = () => { tone(990, 0.12); tone(990, 0.12, 0.18); };

  // ---------- Bildschirm anlassen ----------
  async function keepAwake() {
    try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); wakeLock?.addEventListener?.('release', () => { wakeLock = null; }); } catch (e) { /* nicht unterstützt */ }
  }
  function releaseAwake() { try { wakeLock?.release(); } catch (e) { /* egal */ } wakeLock = null; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && el()?.classList.contains('show')) keepAwake(); });

  // ---------- Schritte bauen ----------
  const perSide = (E) => /pro (Bein|Seite)|je Seite/.test(E.tip || '');
  function workSeconds(E, target) {
    if (E.unit === 'Sek') return target * (perSide(E) ? 2 : 1);
    const reps = target * (perSide(E) ? 2 : 1);
    return Math.max(30, Math.min(120, Math.round(reps * 3 + 5)));
  }

  function build() {
    const c = state.current; const out = [];
    // 1. Aufwärmen
    out.push({ kind: 'ready', block: 'Aufwärmen', title: 'Mobilitäts-Warm-up', sub: `${WARMUP_HOME.length} Übungen · ca. ${Math.round(WARMUP_HOME.reduce((n, w) => n + w.sec, 0) / 60)} Min. – läuft automatisch durch`, ex: WARMUP_HOME[0].id });
    WARMUP_HOME.forEach((w, k) => out.push({ kind: 'work', block: 'Aufwärmen', title: exInfo(w.id).name, sub: `${k + 1} von ${WARMUP_HOME.length} · ${w.dose}`, ex: w.id, sec: w.sec, sides: !!w.sides }));

    // 2. Kraft mit Mobilität in der Pause
    c.exercises.forEach((e, i) => {
      const E = ex(e.exId);
      const slot = WORKOUTS[c.workout].slots.find((x) => x.id === e.slot);
      const target = e.suggestion.reps;
      const unitTxt = E.unit === 'Sek' ? 'Sek.' : 'Wdh.';
      out.push({ kind: 'ready', block: 'Kraft', title: E.name, ex: e.exId,
        sub: `Übung ${i + 1} von ${c.exercises.length} · ${e.sets.length} Sätze · Ziel ${target} ${unitTxt}${perSide(E) ? ' pro Seite' : ''}`,
        mob: slot?.mobility, prevSet: i > 0 ? lastSetRef(i - 1) : null });
      e.sets.forEach((set, j) => {
        out.push({ kind: 'work', block: 'Kraft', title: E.name, ex: e.exId, set: { i, j },
          sub: `Satz ${j + 1} von ${e.sets.length} · Ziel ${target} ${unitTxt}${perSide(E) ? ' pro Seite' : ''}`,
          sec: workSeconds(E, target), repsBased: E.unit !== 'Sek', sides: E.unit === 'Sek' && perSide(E) });
        if (j < e.sets.length - 1) {
          out.push({ kind: 'rest', block: 'Pause', title: 'Pause', ex: slot?.mobility?.id || e.exId,
            sub: slot?.mobility ? `In der Pause: ${exInfo(slot.mobility.id).name} (${slot.mobility.dose})` : 'Durchatmen, gleich geht es weiter',
            sec: restFor(e.slot), prevSet: { i, j }, nextTitle: `Satz ${j + 2}: ${E.name}` });
        }
      });
    });

    // 3. Mobilitäts-Flow
    const fb = fitnessById(c.fitness?.id);
    if (fb) {
      const rounds = fb.rounds || 1;
      out.push({ kind: 'ready', block: 'Mobilität', title: fb.name, ex: fb.items[0].id,
        sub: `${rounds} ${rounds > 1 ? 'Durchgänge' : 'Durchgang'} · ${fb.items.length} Übungen – läuft automatisch durch`,
        prevSet: c.exercises.length ? lastSetRef(c.exercises.length - 1) : null, flow: true });
      for (let r = 0; r < rounds; r++) {
        fb.items.forEach((it, k) => out.push({ kind: 'work', block: 'Mobilität', title: exInfo(it.id).name, ex: it.id,
          sub: `${rounds > 1 ? `Durchgang ${r + 1} von ${rounds} · ` : ''}${it.dose}`, sec: it.sec || 45, sides: !!it.sides, flowRound: r + 1 }));
      }
    }
    out.push({ kind: 'done', block: 'Fertig', title: 'Geschafft!', sub: 'Super gemacht. Speichere dein Training.', ex: null });
    return out;

    function lastSetRef(i) { return { i, j: c.exercises[i].sets.length - 1 }; }
  }

  // ---------- Steuerung ----------
  function open() {
    if (!state.current) return;
    unlockAudio();
    steps = build();
    idx = Math.min(state.current.player?.idx || 0, steps.length - 1);
    // Ein Schritt mitten im Satz wird beim Fortsetzen neu gestartet
    running = false; remain = steps[idx].sec || 0;
    el().classList.add('show'); document.body.classList.add('player-open');
    keepAwake();
    draw();
    clearInterval(ticker); ticker = setInterval(tick, 200);
  }
  function close() {
    running = false; clearInterval(ticker); ticker = null; releaseAwake();
    el().classList.remove('show'); document.body.classList.remove('player-open');
    save(); render();
  }
  function persist() { if (state.current) { state.current.player = { idx }; save(); } }

  function go(n) {
    idx = Math.max(0, Math.min(steps.length - 1, n));
    const s = steps[idx];
    remain = s.sec || 0; lastBeep = null; sideSwitched = false;
    // zeitgesteuerte Schritte starten automatisch, "Bereit?"-Schritte warten auf dich
    running = s.kind === 'work' || s.kind === 'rest';
    if (running) endAt = Date.now() + remain * 1000;
    persist(); draw();
  }
  function start() {
    unlockAudio();
    const s = steps[idx];
    if (s.kind === 'ready') { go(idx + 1); return; }
    if (s.kind === 'done') { finish(); return; }
    if (!running) { running = true; endAt = Date.now() + remain * 1000; drawControls(); }
  }
  function pause() {
    if (!running) return;
    running = false; remain = Math.max(0, (endAt - Date.now()) / 1000); drawControls(); drawTime();
  }
  function toggle() { const s = steps[idx]; if (s.kind === 'ready' || s.kind === 'done' || !running) start(); else pause(); }

  function complete() {
    const s = steps[idx];
    if (s.set) logSet(s.set);
    endTone();
    go(idx + 1);
  }
  function logSet({ i, j }) {
    const set = state.current?.exercises[i]?.sets[j];
    if (!set) return;
    if (set.r == null) set.r = state.current.exercises[i].suggestion.reps;
    set.done = true;
    save();
  }
  function adjustReps(d) {
    const ref = steps[idx].prevSet; if (!ref) return;
    const set = state.current.exercises[ref.i].sets[ref.j];
    if (!set.done) return;
    set.r = Math.max(0, (set.r || 0) + d); save(); drawPrevSet();
  }
  function finish() {
    const c = state.current; if (!c) return close();
    const fb = fitnessById(c.fitness?.id);
    if (fb && c.fitness) {
      const flowSteps = steps.filter((x) => x.flowRound);
      const doneFlow = flowSteps.filter((x) => steps.indexOf(x) < idx);
      if (doneFlow.length) {
        c.fitness.done = true;
        if (c.fitness.value == null) {
          c.fitness.value = /Runde/.test(fb.value) ? Math.max(...doneFlow.map((x) => x.flowRound))
            : Math.round(doneFlow.reduce((n, x) => n + x.sec, 0) / 60);
        }
      }
    }
    running = false; clearInterval(ticker); ticker = null; releaseAwake();
    el().classList.remove('show'); document.body.classList.remove('player-open');
    delete c.player;
    finishWorkout();
  }

  function tick() {
    if (!running) return;
    const s = steps[idx];
    const left = (endAt - Date.now()) / 1000;
    remain = Math.max(0, left);
    const whole = Math.ceil(remain);
    if (whole <= 3 && whole >= 1 && lastBeep !== whole) { lastBeep = whole; tick3(); }
    if (s.sides && !sideSwitched && remain <= s.sec / 2) { sideSwitched = true; sideTone(); drawSide(); }
    drawTime();
    if (left <= 0) complete();
  }

  // ---------- Zeichnen ----------
  const fmt = (sec) => { const t = Math.ceil(sec); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const R = 120, CIRC = 2 * Math.PI * R;

  function draw() {
    const s = steps[idx]; const next = steps[idx + 1];
    const total = steps.length;
    const color = { work: 'var(--orange)', rest: 'var(--green)', ready: 'var(--blue)', done: 'var(--green)' }[s.kind];
    const label = { work: s.block === 'Kraft' ? 'Satz läuft' : 'Los geht\'s', rest: 'Pause', ready: 'Bereit?', done: 'Fertig' }[s.kind];
    el().innerHTML = `
      <div class="pl-top">
        <button class="btn-link" data-pl="close">${ICON.chevron.replace('chev', 'chev back')}Liste</button>
        <div class="pl-block">${esc(s.block)}</div>
        <div class="pl-count">${idx + 1}/${total}</div>
      </div>
      <div class="pl-progress"><span style="width:${(100 * idx) / (total - 1)}%"></span></div>
      <div class="pl-main">
        <div class="pl-ring" style="--c:${color}">
          <svg viewBox="0 0 280 280" aria-hidden="true"><circle cx="140" cy="140" r="${R}" class="pl-track"/>
            <circle cx="140" cy="140" r="${R}" class="pl-arc" id="pl-arc" stroke-dasharray="${CIRC}" stroke-dashoffset="0" transform="rotate(-90 140 140)"/></svg>
          <div class="pl-ring-in">
            ${s.ex ? `<div class="pl-fig">${FIG.svg(s.ex, { anim: true })}</div>` : `<div class="pl-check">${ICON.check}</div>`}
            <div class="pl-time" id="pl-time">${s.sec ? fmt(remain) : ''}</div>
            <div class="pl-label" style="color:${color}">${label}</div>
          </div>
        </div>
        <div class="pl-title">${esc(s.title)}</div>
        <div class="pl-sub">${esc(s.sub || '')}</div>
        <div class="pl-side" id="pl-side">${s.sides ? (sideSwitched ? '↔ Seite wechseln!' : '1. Seite') : ''}</div>
        ${s.mob ? `<div class="pl-note">${ICON.sparkle} In den Satzpausen: ${esc(exInfo(s.mob.id).name)}</div>` : ''}
        <div id="pl-prev"></div>
        ${s.kind === 'ready' ? '<div class="pl-note muted">Der Timer wartet, bis du startest – Zeit zum Vorbereiten.</div>' : ''}
      </div>
      <div class="pl-controls" id="pl-controls"></div>
      ${next ? `<div class="pl-next">Danach: <b>${esc(next.kind === 'rest' ? 'Pause' : next.kind === 'ready' ? 'Neue Übung – ' + next.title : next.title)}</b>${next.sec ? ' · ' + fmt(next.sec) : ''}</div>` : ''}`;
    drawControls(); drawTime(); drawPrevSet();
  }
  function drawControls() {
    const s = steps[idx]; const c = document.getElementById('pl-controls'); if (!c) return;
    const main = s.kind === 'ready' ? `<button class="pl-big" data-pl="toggle">${ICON.play}<span>Los</span></button>`
      : s.kind === 'done' ? `<button class="pl-big done" data-pl="toggle">${ICON.check}<span>Speichern</span></button>`
      : `<button class="pl-big ${running ? 'pause' : ''}" data-pl="toggle" aria-label="${running ? 'Pause' : 'Weiter'}">${running ? ICON.pause : ICON.play}</button>`;
    c.innerHTML = `
      <button class="pl-small" data-pl="back" aria-label="Zurück" ${idx === 0 ? 'disabled' : ''}>${ICON.back}</button>
      ${main}
      <button class="pl-small" data-pl="skip" aria-label="Überspringen" ${s.kind === 'done' ? 'disabled' : ''}>${ICON.skip}</button>
      ${s.repsBased && s.kind === 'work' ? `<button class="btn-filled pl-setdone" data-pl="setdone">${ICON.check} Satz fertig</button>` : ''}
      ${s.kind === 'rest' ? `<button class="btn-plain pl-add" data-pl="add30">+30 Sek.</button>` : ''}`;
  }
  function drawTime() {
    const s = steps[idx]; const t = document.getElementById('pl-time'); const arc = document.getElementById('pl-arc');
    if (t && s.sec) t.textContent = fmt(remain);
    if (arc) arc.setAttribute('stroke-dashoffset', s.sec ? String(CIRC * (1 - remain / s.sec)) : '0');
  }
  function drawSide() { const d = document.getElementById('pl-side'); if (d) { d.textContent = '↔ Seite wechseln!'; d.classList.add('flash'); } }
  function drawPrevSet() {
    const s = steps[idx]; const box = document.getElementById('pl-prev'); if (!box) return;
    const ref = s.prevSet; const set = ref && state.current?.exercises[ref.i]?.sets[ref.j];
    if (!set || !set.done) { box.innerHTML = ''; return; }
    const E = ex(state.current.exercises[ref.i].exId);
    box.innerHTML = `<div class="pl-reps"><span>Geschafft im letzten Satz${s.kind === 'ready' ? ` (${esc(E.name)})` : ''}:</span>
      <div class="stepper"><button data-pl="minus" aria-label="weniger">${ICON.minus}</button><span></span><button data-pl="plus" aria-label="mehr">${ICON.plus}</button></div>
      <b>${set.r} ${E.unit === 'Sek' ? 'Sek.' : 'Wdh.'}</b></div>`;
  }

  // ---------- Bedienung ----------
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-pl]'); if (!b || !el()?.classList.contains('show')) return;
    ev.stopPropagation();
    switch (b.dataset.pl) {
      case 'toggle': toggle(); break;
      case 'skip': { const s = steps[idx]; if (s.set && s.kind === 'work') logSet(s.set); go(idx + 1); break; }
      case 'back': // zurück zum vorherigen Schritt – wartet dann auf Start
        go(idx - 1); running = false; remain = steps[idx].sec || 0; draw(); break;
      case 'setdone': complete(); break;
      case 'add30': if (running) endAt += 30000; else remain += 30; steps[idx].sec += 30; drawTime(); break;
      case 'minus': adjustReps(-1); break;
      case 'plus': adjustReps(1); break;
      case 'close': close(); break;
    }
  }, true);

  return { open, isOpen: () => el()?.classList.contains('show') };
})();
