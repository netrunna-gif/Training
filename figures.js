'use strict';
/*
 * Animierte Strichfiguren für jede Übung (eigene Zeichnungen, keine fremden Bilder).
 * Eine Figur wird über Gelenkpositionen beschrieben; Arme und Beine werden per
 * Zwei-Gelenk-Kinematik berechnet. Jede Übung hat eine Start- und eine Endposition,
 * zwischen denen die Animation hin und her läuft.
 * Koordinaten: viewBox 0 0 200 160, Boden bei y = 150, Figur schaut nach rechts.
 */
const FIG = (() => {
  const L = { torso: 40, neck: 5, head: 9, ua: 23, fa: 21, th: 29, sh: 29, ft: 9 };
  const rad = (d) => (d * Math.PI) / 180;
  const from = (p, len, deg) => [p[0] + len * Math.cos(rad(deg)), p[1] - len * Math.sin(rad(deg))];

  function pick(a, b, how) {
    switch (how) {
      case 'f': return a[0] >= b[0] ? a : b;
      case 'b': return a[0] <= b[0] ? a : b;
      case 'u': return a[1] <= b[1] ? a : b;
      default: return a[1] >= b[1] ? a : b; // 'd'
    }
  }
  function ik(a, target, l1, l2, how) {
    const dx = target[0] - a[0], dy = target[1] - a[1];
    let d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.05, d));
    const base = Math.atan2(dy, dx);
    const c = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    const j1 = [a[0] + l1 * Math.cos(base + c), a[1] + l1 * Math.sin(base + c)];
    const j2 = [a[0] + l1 * Math.cos(base - c), a[1] + l1 * Math.sin(base - c)];
    const j = pick(j1, j2, how);
    const ang = Math.atan2(target[1] - j[1], target[0] - j[0]);
    return [j, [j[0] + l2 * Math.cos(ang), j[1] + l2 * Math.sin(ang)]];
  }
  const resolve = (spec, ref) => (typeof spec[0] === 'string' ? [ref[spec[0]][0] + spec[1], ref[spec[0]][1] + spec[2]] : spec);

  // ---------- Posen berechnen ----------
  function sidePose(P) {
    const hip = P.hip;
    const sh = from(hip, L.torso, P.torso);
    const head = from(sh, L.neck + L.head, P.torso + (P.headTilt || 0));
    const ref = { s: sh, h: hip };
    const [elb, hnd] = ik(sh, resolve(P.hand, ref), L.ua, L.fa, P.elbow || 'd');
    const [knee, ank] = ik(hip, resolve(P.ankle, ref), L.th, L.sh, P.knee || 'f');
    const toe = from(ank, L.ft, P.foot ?? 0);
    const out = { hip, sh, head, elb, hnd, knee, ank, toe };
    if (P.ankle2) {
      const [k2, a2] = ik(hip, resolve(P.ankle2, ref), L.th, L.sh, P.knee2 || 'f');
      out.knee2 = k2; out.ank2 = a2; out.toe2 = from(a2, L.ft, P.foot2 ?? 0);
    }
    if (P.hand2) {
      const [e2, h2] = ik(sh, resolve(P.hand2, ref), L.ua, L.fa, P.elbow2 || P.elbow || 'd');
      out.elb2 = e2; out.hnd2 = h2;
    }
    return out;
  }
  function frontPose(P) {
    const [x, y] = P.hip; const sw = P.sw ?? 13;
    const shL = [x - sw, y - 40], shR = [x + sw, y - 40];
    const neck = [x, y - 42], head = [x, y - 56];
    const hipL = [x - 7, y], hipR = [x + 7, y];
    const [elbL, hndL] = ik(shL, P.handL, L.ua, L.fa, P.elbow === 'in' ? 'f' : (P.elbow || 'b'));
    const [elbR, hndR] = ik(shR, P.handR, L.ua, L.fa, P.elbow === 'in' ? 'b' : (P.elbow === 'b' ? 'b' : 'f'));
    const [kneeL, ankL] = ik(hipL, P.ankleL, L.th, L.sh, 'b');
    const [kneeR, ankR] = ik(hipR, P.ankleR, L.th, L.sh, 'f');
    return { front: true, hip: [x, y], neck, head, shL, shR, hipL, hipR, elbL, hndL, elbR, hndR, kneeL, ankL, kneeR, ankR,
      hnd: hndR, elb: elbR, sh: shR, knee: kneeR, ank: ankR };
  }

  // ---------- Interpolation ----------
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function lerp(a, b, t) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
    if (Array.isArray(a)) return a.map((v, i) => lerp(v, b ? b[i] : v, t));
    if (a && typeof a === 'object') {
      const o = {}; for (const k in a) o[k] = lerp(a[k], b ? b[k] : a[k], t); return o;
    }
    return a;
  }

  // ---------- Zeichnen ----------
  const f1 = (n) => Math.round(n * 10) / 10;
  const ln = (a, b, cls, w) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" class="${cls}"${w ? ` stroke-width="${w}"` : ''}/>`;
  function drawProps(props, p, layer) {
    let s = '';
    for (const pr of props) {
      if ((pr.layer || 'back') !== layer) continue;
      const at = pr.at ? [p[pr.at][0] + (pr.dx || 0), p[pr.at][1] + (pr.dy || 0)] : null;
      switch (pr.t) {
        case 'rect': s += `<rect x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="${pr.rx ?? 3}" class="eq"/>`; break;
        case 'line': s += `<line x1="${pr.x1}" y1="${pr.y1}" x2="${pr.x2}" y2="${pr.y2}" class="eq-line"${pr.w ? ` stroke-width="${pr.w}"` : ''}/>`; break;
        case 'plate': s += `<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${pr.r || 12}" class="wt"/><circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="2.5" class="wt-hub"/>`; break;
        case 'db': s += `<rect x="${f1(at[0] - 7)}" y="${f1(at[1] - 4.5)}" width="14" height="9" rx="3" class="wt"/>`; break;
        case 'handle': s += ln([at[0] - (pr.hx ?? 0), at[1] - (pr.hy ?? 7)], [at[0] + (pr.hx ?? 0), at[1] + (pr.hy ?? 7)], 'wt-line'); break;
        case 'cable': s += `<circle cx="${pr.from[0]}" cy="${pr.from[1]}" r="4" class="eq"/>` + ln(pr.from, at || p.hnd, 'cable'); break;
        case 'cable2': s += ln(pr.from, p[pr.to], 'cable'); break;
        case 'pad': s += `<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${pr.r || 5}" class="eq"/>`; break;
        case 'platform': {
          const a = rad(pr.ang ?? 0), h = (pr.len || 30) / 2;
          s += ln([at[0] - h * Math.cos(a), at[1] + h * Math.sin(a)], [at[0] + h * Math.cos(a), at[1] - h * Math.sin(a)], 'eq-line', 6); break;
        }
        case 'backpad': {
          const ang = Math.atan2(p.sh[1] - p.hip[1], p.sh[0] - p.hip[0]); const nx = Math.sin(ang) * 8, ny = -Math.cos(ang) * 8;
          s += ln([p.hip[0] + nx * (pr.side || 1), p.hip[1] + ny * (pr.side || 1)], [p.sh[0] + nx * (pr.side || 1) + (pr.ext || 0) * Math.cos(ang), p.sh[1] + ny * (pr.side || 1) + (pr.ext || 0) * Math.sin(ang)], 'eq-line', 7); break;
        }
        case 'stack': s += `<rect x="${pr.x}" y="${pr.y}" width="${pr.w || 14}" height="${pr.h || 40}" rx="2" class="eq"/>`; break;
        case 'rail': s += `<line x1="${pr.x}" y1="12" x2="${pr.x}" y2="150" class="eq-line" stroke-width="3"/>`; break;
        case 'bar': s += ln([at[0] - (pr.len || 12), at[1]], [at[0] + (pr.len || 12), at[1]], 'wt-line'); break;
      }
    }
    return s;
  }
  function drawBody(p) {
    let s = '';
    if (p.front) {
      s += ln(p.hipL, p.kneeL, 'limb') + ln(p.kneeL, p.ankL, 'limb') + ln(p.hipR, p.kneeR, 'limb') + ln(p.kneeR, p.ankR, 'limb');
      s += ln([p.ankL[0], p.ankL[1]], [p.ankL[0] - 6, p.ankL[1]], 'limb') + ln(p.ankR, [p.ankR[0] + 6, p.ankR[1]], 'limb');
      s += ln(p.neck, p.hip, 'limb') + ln(p.shL, p.shR, 'limb') + ln(p.hipL, p.hipR, 'limb');
      s += ln(p.shL, p.elbL, 'limb') + ln(p.elbL, p.hndL, 'limb') + ln(p.shR, p.elbR, 'limb') + ln(p.elbR, p.hndR, 'limb');
      s += `<circle cx="${f1(p.head[0])}" cy="${f1(p.head[1])}" r="${L.head}" class="head"/>`;
      return s;
    }
    if (p.knee2) s += ln(p.hip, p.knee2, 'limb far') + ln(p.knee2, p.ank2, 'limb far') + ln(p.ank2, p.toe2, 'limb far');
    if (p.elb2) s += ln(p.sh, p.elb2, 'limb far') + ln(p.elb2, p.hnd2, 'limb far');
    s += ln(p.hip, p.knee, 'limb') + ln(p.knee, p.ank, 'limb') + ln(p.ank, p.toe, 'limb');
    s += ln(p.hip, p.sh, 'limb torso');
    s += `<circle cx="${f1(p.head[0])}" cy="${f1(p.head[1])}" r="${L.head}" class="head"/>`;
    s += ln(p.sh, p.elb, 'limb') + ln(p.elb, p.hnd, 'limb');
    return s;
  }

  // Gemischte Angaben (absolut vs. relativ zur Schulter/Hüfte) vor dem Überblenden vereinheitlichen
  function normalize(def) {
    if (def._norm) return def._norm;
    const a = { ...def.a }, b = { ...def.b };
    if (a.view !== 'front') {
      const pa = sidePose(a), pb = sidePose(b);
      const abs = (spec, p) => (typeof spec[0] === 'string' ? resolve(spec, { s: p.sh, h: p.hip }) : spec);
      for (const k of ['hand', 'hand2', 'ankle', 'ankle2']) {
        if (!a[k] || !b[k]) continue;
        const sa = typeof a[k][0] === 'string', sb = typeof b[k][0] === 'string';
        if (sa !== sb || (sa && a[k][0] !== b[k][0])) { a[k] = abs(a[k], pa); b[k] = abs(b[k], pb); }
      }
    }
    return (def._norm = { a, b });
  }
  function poseAt(def, t) {
    const n = normalize(def);
    const spec = lerp(n.a, n.b, ease(t));
    return def.a.view === 'front' ? frontPose(spec) : sidePose(spec);
  }
  function svgFor(def, t) {
    const p = poseAt(def, t);
    const props = def.props || [];
    return `<line x1="-60" y1="151" x2="260" y2="151" class="ground"/>` + drawProps(props, p, 'back') + drawBody(p) + drawProps(props, p, 'front');
  }

  // ---------- Muster (Bewegungen) ----------
  const STAND = { hip: [100, 92], torso: 90, ankle: [100, 150], foot: 0 };
  const P = {
    squat: {
      a: { ...STAND, hand: ['s', -6, -3], elbow: 'd' },
      b: { hip: [82, 121], torso: 58, ankle: [100, 150], foot: 0, hand: ['s', -6, -3], elbow: 'd' },
      muscles: 'Oberschenkel vorne, Po, Rumpf',
      steps: ['Füße etwa schulterbreit, Zehen leicht nach außen.', 'Hüfte nach hinten-unten, Knie folgen den Zehen, Rücken bleibt gerade.', 'Mindestens bis die Oberschenkel waagerecht sind, dann über die ganze Fußsohle hochdrücken.'],
    },
    legpress: {
      a: { hip: [72, 112], torso: 128, ankle: [104, 92], foot: 45, hand: [80, 120], elbow: 'd', knee: 'u' },
      b: { hip: [72, 112], torso: 128, ankle: [124, 76], foot: 45, hand: [80, 120], elbow: 'd', knee: 'u' },
      props: [{ t: 'line', x1: 30, y1: 78, x2: 70, y2: 120, w: 7 }, { t: 'rect', x: 56, y: 118, w: 36, h: 6 }, { t: 'line', x1: 74, y1: 124, x2: 74, y2: 150, w: 4 }, { t: 'platform', at: 'ank', dx: 6, dy: -4, ang: 135, len: 34, layer: 'front' }],
      muscles: 'Oberschenkel vorne, Po',
      steps: ['Rücken und Po fest an die Lehne, Füße schulterbreit mittig auf die Platte.', 'Platte kontrolliert zu dir kommen lassen, bis die Knie etwa 90° gebeugt sind.', 'Über die Fersen wegdrücken – Knie oben nicht ganz durchdrücken.'],
    },
    hack: {
      a: { hip: [96, 93], torso: 80, ankle: [108, 150], foot: 10, hand: ['s', 2, -6], elbow: 'd' },
      b: { hip: [84, 120], torso: 66, ankle: [108, 150], foot: 10, hand: ['s', 2, -6], elbow: 'd' },
      props: [{ t: 'backpad', side: -1, ext: 6 }, { t: 'pad', at: 'sh', dx: 4, dy: -4, r: 6, layer: 'front' }, { t: 'line', x1: 96, y1: 152, x2: 130, y2: 146, w: 5 }],
      muscles: 'Oberschenkel vorne, Po',
      steps: ['Rücken ans Polster, Schultern unter die Pads, Füße mittig auf die Plattform.', 'Langsam tief in die Knie gehen, Rücken bleibt am Polster.', 'Über die ganze Fußsohle hochdrücken.'],
    },
    hinge: {
      a: { ...STAND, hand: ['s', 2, 43], elbow: 'b' },
      b: { hip: [86, 92], torso: 22, ankle: [100, 150], foot: 0, hand: ['s', 0, 43], elbow: 'b', knee: 'f' },
      muscles: 'Beinbeuger, Po, unterer Rücken',
      steps: ['Hüftbreit stehen, Knie leicht gebeugt, Gewicht nah am Körper.', 'Hüfte weit nach hinten schieben, Oberkörper neigt sich mit geradem Rücken nach vorne.', 'Wenn du die Dehnung hinten im Bein spürst: Po anspannen und aufrichten.'],
    },
    deadlift: {
      a: { hip: [86, 112], torso: 36, ankle: [100, 150], foot: 0, hand: ['s', -4, 43], elbow: 'b' },
      b: { ...STAND, hand: ['s', 2, 43], elbow: 'b' },
      muscles: 'Po, Beinbeuger, Rücken, Oberschenkel',
      steps: ['Stange über der Fußmitte, schulterbreit greifen, Brust raus, Rücken gerade.', 'Mit den Beinen den Boden wegdrücken, Stange bleibt am Bein.', 'Oben Po anspannen, dann kontrolliert mit geradem Rücken ablassen.'],
    },
    hipthrust: {
      a: { hip: [95, 136], torso: 145, ankle: [128, 150], foot: 0, hand: ['h', 0, -8], elbow: 'u', knee: 'u', headTilt: -30 },
      b: { hip: [104, 108], torso: 178, ankle: [128, 150], foot: 0, hand: ['h', 0, -8], elbow: 'u', knee: 'u', headTilt: -60 },
      props: [{ t: 'rect', x: 22, y: 112, w: 46, h: 38 }, { t: 'plate', at: 'hip', dy: -11, r: 11, layer: 'front' }],
      muscles: 'Po, Beinbeuger',
      steps: ['Schulterblätter an die Bank, Stange mit Polster auf die Hüfte, Füße hüftbreit.', 'Hüfte hochdrücken, bis Knie, Hüfte und Schultern eine Linie bilden.', 'Oben 1 Sek. Po fest anspannen, Kinn zur Brust, dann kontrolliert absenken.'],
    },
    lunge: {
      a: { hip: [98, 95], torso: 90, ankle: [124, 150], foot: 0, ankle2: [70, 148], foot2: -60, knee2: 'f', hand: ['s', 1, 43], elbow: 'b' },
      b: { hip: [96, 120], torso: 88, ankle: [124, 150], foot: 0, ankle2: [70, 148], foot2: -60, knee2: 'f', hand: ['s', 1, 43], elbow: 'b' },
      muscles: 'Oberschenkel vorne, Po',
      steps: ['Großer Schritt, Oberkörper aufrecht, Hanteln seitlich am Körper.', 'Senkrecht nach unten gehen, bis das hintere Knie fast den Boden berührt.', 'Über die vordere Ferse hochdrücken. Wiederholungen pro Bein.'],
    },
    bulgarian: {
      a: { hip: [100, 95], torso: 86, ankle: [124, 150], foot: 0, ankle2: [66, 116], foot2: -10, knee2: 'f', hand: ['s', 1, 43], elbow: 'b' },
      b: { hip: [96, 120], torso: 80, ankle: [124, 150], foot: 0, ankle2: [66, 116], foot2: -10, knee2: 'f', hand: ['s', 1, 43], elbow: 'b' },
      props: [{ t: 'rect', x: 36, y: 118, w: 34, h: 32 }],
      muscles: 'Oberschenkel vorne, Po',
      steps: ['Hinteren Fuß mit dem Spann auf die Bank, vorderer Fuß ein großer Schritt davor.', 'Gerade nach unten gehen, Gewicht auf dem vorderen Bein.', 'Über die vordere Ferse hochdrücken. Wiederholungen pro Bein.'],
    },
    legext: {
      a: { hip: [80, 108], torso: 98, ankle: [110, 138], foot: 70, hand: [78, 118], elbow: 'd', knee: 'f' },
      b: { hip: [80, 108], torso: 98, ankle: [137, 100], foot: 80, hand: [78, 118], elbow: 'd', knee: 'f' },
      props: [{ t: 'rect', x: 62, y: 112, w: 46, h: 6 }, { t: 'line', x1: 70, y1: 112, x2: 64, y2: 62, w: 7 }, { t: 'line', x1: 84, y1: 118, x2: 84, y2: 150, w: 4 }, { t: 'pad', at: 'ank', dx: 3, dy: 3, r: 6, layer: 'front' }],
      muscles: 'Oberschenkel vorne',
      steps: ['Rücken an die Lehne, Knie auf Höhe der Drehachse, Polster vorne über dem Sprunggelenk.', 'Beine strecken, oben 1 Sek. halten und anspannen.', 'Langsam wieder ablassen.'],
    },
    legcurl: {
      a: { hip: [78, 106], torso: 104, ankle: [137, 104], foot: 80, hand: [80, 116], elbow: 'd', knee: 'f' },
      b: { hip: [78, 106], torso: 104, ankle: [104, 136], foot: 70, hand: [80, 116], elbow: 'd', knee: 'f' },
      props: [{ t: 'rect', x: 60, y: 110, w: 46, h: 6 }, { t: 'line', x1: 66, y1: 110, x2: 56, y2: 62, w: 7 }, { t: 'line', x1: 84, y1: 116, x2: 84, y2: 150, w: 4 }, { t: 'pad', at: 'knee', dx: -6, dy: -9, r: 6, layer: 'front' }, { t: 'pad', at: 'ank', dx: 2, dy: 7, r: 6, layer: 'front' }],
      muscles: 'Beinbeuger (hinterer Oberschenkel)',
      steps: ['Knie auf Höhe der Drehachse, Oberschenkelpolster fest einstellen.', 'Oberkörper leicht nach vorne lehnen, Fersen kraftvoll nach unten-hinten ziehen.', 'Langsam zurück, bis die Beine fast gestreckt sind – die Dehnung macht die Übung so effektiv.'],
    },
    calf: {
      a: { hip: [100, 92], torso: 90, ankle: [100, 148], foot: 0, hand: ['s', 6, -4], elbow: 'd' },
      b: { hip: [100, 82], torso: 90, ankle: [100, 138], foot: -50, hand: ['s', 6, -4], elbow: 'd' },
      props: [{ t: 'rect', x: 104, y: 148, w: 22, h: 6, rx: 2 }, { t: 'pad', at: 'sh', dx: 3, dy: -5, r: 6, layer: 'front' }],
      muscles: 'Waden',
      steps: ['Fußballen auf die Kante, Schultern unter die Polster.', 'Fersen tief absenken und unten 1–2 Sek. dehnen.', 'So hoch wie möglich auf die Zehenspitzen drücken, oben kurz halten.'],
    },
    calf_seated: {
      a: { hip: [80, 108], torso: 96, ankle: [110, 146], foot: 10, hand: [104, 106], elbow: 'd', knee: 'u' },
      b: { hip: [80, 102], torso: 96, ankle: [110, 136], foot: -35, hand: [104, 100], elbow: 'd', knee: 'u' },
      props: [{ t: 'rect', x: 62, y: 112, w: 34, h: 6 }, { t: 'line', x1: 80, y1: 118, x2: 80, y2: 150, w: 4 }, { t: 'rect', x: 112, y: 146, w: 18, h: 6, rx: 2 }, { t: 'pad', at: 'knee', dx: 0, dy: -7, r: 6, layer: 'front' }],
      muscles: 'Waden (vor allem der tiefe Wadenmuskel)',
      steps: ['Fußballen auf die Kante, Knie unter das Polster.', 'Fersen tief absenken, unten kurz dehnen.', 'Fersen so hoch wie möglich drücken, oben 1 Sek. halten.'],
    },
    calf_lp: {
      a: { hip: [72, 112], torso: 128, ankle: [123, 78], foot: 75, hand: [80, 120], elbow: 'd', knee: 'u' },
      b: { hip: [72, 112], torso: 128, ankle: [123, 78], foot: 20, hand: [80, 120], elbow: 'd', knee: 'u' },
      props: [{ t: 'line', x1: 30, y1: 78, x2: 70, y2: 120, w: 7 }, { t: 'rect', x: 56, y: 118, w: 36, h: 6 }, { t: 'line', x1: 74, y1: 124, x2: 74, y2: 150, w: 4 }, { t: 'platform', at: 'toe', dx: 4, dy: -3, ang: 135, len: 34, layer: 'front' }],
      muscles: 'Waden',
      steps: ['Wie bei der Beinpresse hinsetzen, Beine fast gestreckt, nur die Fußballen auf der Plattenkante.', 'Platte mit den Zehen wegdrücken.', 'Langsam zurück und unten 1–2 Sek. dehnen.'],
    },
    bench: {
      a: { hip: [112, 106], torso: 180, ankle: [130, 150], foot: 0, hand: [72, 60], elbow: 'd', knee: 'u', headTilt: 0 },
      b: { hip: [112, 106], torso: 180, ankle: [130, 150], foot: 0, hand: [76, 92], elbow: 'd', knee: 'u', headTilt: 0 },
      props: [{ t: 'rect', x: 40, y: 111, w: 80, h: 7 }, { t: 'line', x1: 50, y1: 118, x2: 50, y2: 150, w: 4 }, { t: 'line', x1: 110, y1: 118, x2: 110, y2: 150, w: 4 }],
      muscles: 'Brust, vordere Schulter, Trizeps',
      steps: ['Auf die Bank legen, Füße fest am Boden, Schulterblätter zusammen und nach unten.', 'Gewicht kontrolliert zur unteren Brust absenken, Ellbogen ca. 45° vom Körper.', 'Kraftvoll nach oben drücken, ohne den Po abzuheben.'],
    },
    incline: {
      a: { hip: [100, 110], torso: 138, ankle: [130, 150], foot: 0, hand: ['s', 10, -40], elbow: 'd', knee: 'u' },
      b: { hip: [100, 110], torso: 138, ankle: [130, 150], foot: 0, hand: ['s', 10, -6], elbow: 'd', knee: 'u' },
      props: [{ t: 'backpad', side: -1, ext: 10 }, { t: 'rect', x: 84, y: 114, w: 30, h: 6 }, { t: 'line', x1: 96, y1: 120, x2: 96, y2: 150, w: 4 }],
      muscles: 'Obere Brust, vordere Schulter, Trizeps',
      steps: ['Bank auf ca. 30° einstellen, Schulterblätter zusammen.', 'Gewicht zur oberen Brust absenken.', 'Nach oben drücken, bis die Arme fast gestreckt sind.'],
    },
    chestpress: {
      a: { hip: [80, 108], torso: 94, ankle: [112, 150], foot: 0, hand: ['s', 12, 4], elbow: 'b', knee: 'u' },
      b: { hip: [80, 108], torso: 94, ankle: [112, 150], foot: 0, hand: ['s', 42, 4], elbow: 'd', knee: 'u' },
      props: [{ t: 'rect', x: 62, y: 112, w: 34, h: 6 }, { t: 'backpad', side: -1, ext: 6 }, { t: 'line', x1: 80, y1: 118, x2: 80, y2: 150, w: 4 }, { t: 'handle', at: 'hnd', layer: 'front' }],
      muscles: 'Brust, vordere Schulter, Trizeps',
      steps: ['Sitz so einstellen, dass die Griffe auf Brusthöhe sind. Rücken an die Lehne.', 'Griffe nach vorne drücken, Schultern bleiben unten.', 'Langsam zurück, bis du eine Dehnung in der Brust spürst.'],
    },
    ohp_seated: {
      a: { hip: [90, 108], torso: 92, ankle: [122, 150], foot: 0, hand: ['s', 8, -8], elbow: 'd', knee: 'u' },
      b: { hip: [90, 108], torso: 92, ankle: [122, 150], foot: 0, hand: ['s', 4, -44], elbow: 'd', knee: 'u' },
      props: [{ t: 'rect', x: 72, y: 112, w: 32, h: 6 }, { t: 'backpad', side: -1, ext: 8 }, { t: 'line', x1: 88, y1: 118, x2: 88, y2: 150, w: 4 }],
      muscles: 'Schultern, Trizeps',
      steps: ['Aufrecht sitzen, Rücken an die Lehne, Gewicht auf Schulterhöhe.', 'Senkrecht nach oben drücken, bis die Arme fast gestreckt sind.', 'Kontrolliert bis etwa Ohrhöhe absenken.'],
    },
    ohp_stand: {
      a: { ...STAND, hand: ['s', 10, -4], elbow: 'd' },
      b: { ...STAND, hand: ['s', 3, -44], elbow: 'd' },
      muscles: 'Schultern, Trizeps, Rumpf',
      steps: ['Schulterbreit greifen, Stange vor den Schultern, Po und Bauch fest.', 'Stange gerade nach oben drücken, Kopf kurz nach hinten.', 'Oben Arme strecken, dann kontrolliert zurück zu den Schultern.'],
    },
    latpull: {
      a: { hip: [92, 110], torso: 98, ankle: [124, 150], foot: 0, hand: [104, 20], elbow: 'b', knee: 'u' },
      b: { hip: [92, 110], torso: 102, ankle: [124, 150], foot: 0, hand: ['s', 12, 2], elbow: 'b', knee: 'u' },
      props: [{ t: 'rect', x: 74, y: 114, w: 34, h: 6 }, { t: 'line', x1: 92, y1: 120, x2: 92, y2: 150, w: 4 }, { t: 'pad', at: 'knee', dx: 2, dy: -8, r: 6, layer: 'front' }, { t: 'cable', from: [104, 6] }, { t: 'bar', at: 'hnd', len: 10, layer: 'front' }],
      muscles: 'Breiter Rückenmuskel (Lat), Bizeps',
      steps: ['Knie unter das Polster, Griff etwas breiter als schulterbreit.', 'Brust raus, Griff zur oberen Brust ziehen – Ellbogen nach unten führen.', 'Langsam nach oben, bis die Arme gestreckt sind und der Rücken gedehnt ist.'],
    },
    pullup_ass: {
      a: { hip: [100, 106], torso: 92, ankle: [80, 140], foot: -70, hand: [104, 22], elbow: 'b', knee: 'f' },
      b: { hip: [100, 80], torso: 92, ankle: [80, 114], foot: -70, hand: [104, 22], elbow: 'b', knee: 'f' },
      props: [{ t: 'line', x1: 80, y1: 22, x2: 130, y2: 22, w: 5 }, { t: 'pad', at: 'knee', dx: 0, dy: 7, r: 7 }, { t: 'line', x1: 140, y1: 22, x2: 140, y2: 150, w: 5 }],
      muscles: 'Breiter Rückenmuskel (Lat), Bizeps',
      steps: ['Knie auf das Polster, Griff etwas breiter als schulterbreit.', 'Brust zur Stange ziehen, Ellbogen nach unten führen.', 'Langsam ablassen, bis die Arme gestreckt sind. Mehr kg = mehr Hilfe.'],
    },
    pullover: {
      a: { hip: [88, 110], torso: 96, ankle: [120, 150], foot: 0, hand: ['s', 6, -40], elbow: 'f', knee: 'u' },
      b: { hip: [88, 110], torso: 96, ankle: [120, 150], foot: 0, hand: ['s', 30, 26], elbow: 'f', knee: 'u' },
      props: [{ t: 'rect', x: 70, y: 114, w: 34, h: 6 }, { t: 'backpad', side: -1, ext: 8 }, { t: 'line', x1: 88, y1: 120, x2: 88, y2: 150, w: 4 }, { t: 'pad', at: 'elb', r: 6, layer: 'front' }],
      muscles: 'Breiter Rückenmuskel (Lat)',
      steps: ['Schulter auf Höhe der Drehachse, Ellbogen gegen die Polster.', 'Arme in einem großen Bogen nach unten bis zum Bauch führen.', 'Langsam zurück nach oben, bis der Lat gut gedehnt ist.'],
    },
    row_seated: {
      a: { hip: [78, 112], torso: 94, ankle: [126, 128], foot: 80, hand: ['s', 44, 18], elbow: 'd', knee: 'u' },
      b: { hip: [78, 112], torso: 98, ankle: [126, 128], foot: 80, hand: ['s', 14, 30], elbow: 'b', knee: 'u' },
      props: [{ t: 'rect', x: 56, y: 116, w: 40, h: 6 }, { t: 'line', x1: 132, y1: 112, x2: 132, y2: 150, w: 6 }, { t: 'handle', at: 'hnd', hx: 0, hy: 5, layer: 'front' }],
      muscles: 'Oberer und mittlerer Rücken, Lat, Bizeps',
      steps: ['Aufrecht hinsetzen, Füße gegen die Platte, Arme gestreckt.', 'Griff zum Bauch ziehen, Schulterblätter zusammendrücken.', 'Langsam nach vorne, bis die Arme gestreckt sind – nicht mit dem Oberkörper schwingen.'],
    },
    row_bent: {
      a: { hip: [88, 96], torso: 32, ankle: [100, 150], foot: 0, hand: ['s', 2, 43], elbow: 'u' },
      b: { hip: [88, 96], torso: 32, ankle: [100, 150], foot: 0, hand: ['s', -12, 22], elbow: 'u' },
      muscles: 'Oberer und mittlerer Rücken, Lat, Bizeps',
      steps: ['Hüfte nach hinten, Oberkörper ca. 45° nach vorne, Rücken gerade, Knie leicht gebeugt.', 'Gewicht zum Bauchnabel ziehen, Ellbogen nach hinten-oben.', 'Langsam ablassen, bis die Arme gestreckt sind.'],
    },
    row_db: {
      a: { hip: [84, 98], torso: 12, ankle: [92, 150], foot: 0, hand: ['s', 2, 43], elbow: 'u', hand2: [126, 112], elbow2: 'd', ankle2: [104, 150] },
      b: { hip: [84, 98], torso: 12, ankle: [92, 150], foot: 0, hand: ['s', -12, 18], elbow: 'u', hand2: [126, 112], elbow2: 'd', ankle2: [104, 150] },
      props: [{ t: 'rect', x: 110, y: 112, w: 40, h: 7 }, { t: 'line', x1: 140, y1: 119, x2: 140, y2: 150, w: 4 }],
      muscles: 'Oberer Rücken, Lat, Bizeps',
      steps: ['Eine Hand auf die Bank, Rücken gerade und fast waagerecht.', 'Hantel Richtung Hüfte ziehen, Ellbogen nah am Körper.', 'Langsam ablassen, bis der Arm gestreckt ist. Wiederholungen pro Seite.'],
    },
    lateral: {
      a: { view: 'front', hip: [100, 92], sw: 13, handL: [84, 96], handR: [116, 96], ankleL: [93, 150], ankleR: [107, 150], elbow: 'out' },
      b: { view: 'front', hip: [100, 92], sw: 13, handL: [56, 58], handR: [144, 58], ankleL: [93, 150], ankleR: [107, 150], elbow: 'out' },
      muscles: 'Seitliche Schulter',
      steps: ['Aufrecht stehen, Gewicht seitlich am Körper, Arme leicht gebeugt.', 'Arme seitlich bis Schulterhöhe heben – die Ellbogen führen.', 'Langsam absenken, ohne Schwung.'],
    },
    rearfly: {
      a: { view: 'front', hip: [100, 92], sw: 13, handL: [94, 68], handR: [106, 68], ankleL: [93, 150], ankleR: [107, 150], elbow: 'out' },
      b: { view: 'front', hip: [100, 92], sw: 13, handL: [56, 56], handR: [144, 56], ankleL: [93, 150], ankleR: [107, 150], elbow: 'out' },
      muscles: 'Hintere Schulter, oberer Rücken',
      steps: ['Arme vor dem Körper, Ellbogen leicht gebeugt (Ansicht von hinten).', 'Arme in einem weiten Bogen nach hinten-außen führen, Schulterblätter zusammen.', 'Langsam zurück nach vorne.'],
    },
    facepull: {
      a: { hip: [96, 92], torso: 94, ankle: [100, 150], foot: 0, hand: ['s', 42, -6], elbow: 'd', ankle2: [80, 150] },
      b: { hip: [96, 92], torso: 96, ankle: [100, 150], foot: 0, hand: ['s', 10, -16], elbow: 'u', ankle2: [80, 150] },
      props: [{ t: 'cable', from: [186, 38] }],
      muscles: 'Hintere Schulter, oberer Rücken, Rotatoren',
      steps: ['Seil auf Kopfhöhe, mit beiden Händen greifen, einen Schritt zurück.', 'Seil zur Stirn ziehen, Hände auseinander, Ellbogen hoch.', 'Langsam zurück, bis die Arme gestreckt sind.'],
    },
    curl: {
      a: { ...STAND, hand: ['s', 4, 43], elbow: 'd' },
      b: { ...STAND, hand: ['s', 14, 4], elbow: 'd' },
      muscles: 'Bizeps, Unterarme',
      steps: ['Aufrecht stehen, Ellbogen seitlich am Körper.', 'Gewicht nach oben beugen, Ellbogen bleiben an Ort und Stelle.', 'Langsam ganz ablassen – ohne Schwung aus dem Rücken.'],
    },
    curl_incline: {
      a: { hip: [96, 112], torso: 118, ankle: [132, 150], foot: 0, hand: ['s', -4, 43], elbow: 'd', knee: 'u' },
      b: { hip: [96, 112], torso: 118, ankle: [132, 150], foot: 0, hand: ['s', 10, 6], elbow: 'd', knee: 'u' },
      props: [{ t: 'backpad', side: -1, ext: 12 }, { t: 'rect', x: 80, y: 116, w: 30, h: 6 }, { t: 'line', x1: 94, y1: 122, x2: 94, y2: 150, w: 4 }],
      muscles: 'Bizeps (in gedehnter Position)',
      steps: ['Bank auf ca. 60°, zurücklehnen, Arme hängen senkrecht nach unten.', 'Hanteln nach oben beugen, Oberarme bleiben hinter dem Körper.', 'Langsam ganz ablassen und die Dehnung spüren.'],
    },
    curl_machine: {
      a: { hip: [80, 110], torso: 80, ankle: [110, 150], foot: 0, hand: [134, 100], elbow: 'd', knee: 'u' },
      b: { hip: [80, 110], torso: 80, ankle: [110, 150], foot: 0, hand: [110, 58], elbow: 'd', knee: 'u' },
      props: [{ t: 'rect', x: 64, y: 114, w: 32, h: 6 }, { t: 'line', x1: 80, y1: 120, x2: 80, y2: 150, w: 4 }, { t: 'line', x1: 96, y1: 72, x2: 124, y2: 96, w: 7 }],
      muscles: 'Bizeps',
      steps: ['Oberarme flach auf das Polster, Ellbogen auf Höhe der Drehachse.', 'Griffe nach oben beugen und kurz anspannen.', 'Langsam ablassen, bis die Arme fast gestreckt sind.'],
    },
    pushdown: {
      a: { hip: [98, 92], torso: 84, ankle: [100, 150], foot: 0, hand: ['s', 18, 8], elbow: 'b' },
      b: { hip: [98, 92], torso: 84, ankle: [100, 150], foot: 0, hand: ['s', 10, 43], elbow: 'b' },
      props: [{ t: 'cable', from: [124, 8] }],
      muscles: 'Trizeps',
      steps: ['Aufrecht vor den Kabelzug stellen, Ellbogen seitlich am Körper.', 'Griff nach unten drücken, bis die Arme ganz gestreckt sind.', 'Langsam zurück bis etwa Brusthöhe – die Ellbogen bleiben fixiert.'],
    },
    tri_overhead_cable: {
      a: { hip: [100, 94], torso: 70, ankle: [122, 150], foot: 0, ankle2: [80, 150], foot2: -20, hand: ['s', -12, -6], elbow: 'u' },
      b: { hip: [100, 94], torso: 70, ankle: [122, 150], foot: 0, ankle2: [80, 150], foot2: -20, hand: ['s', 30, -32], elbow: 'u' },
      props: [{ t: 'cable', from: [40, 34] }],
      muscles: 'Trizeps (vor allem der lange Kopf)',
      steps: ['Rücken zum Kabelzug, Seil hinter dem Kopf, Schrittstellung.', 'Arme nach vorne-oben strecken, Ellbogen zeigen nach vorne.', 'Langsam zurück, bis du eine starke Dehnung im Trizeps spürst.'],
    },
    tri_overhead_db: {
      a: { hip: [90, 108], torso: 92, ankle: [122, 150], foot: 0, hand: ['s', -10, -6], elbow: 'u', knee: 'u' },
      b: { hip: [90, 108], torso: 92, ankle: [122, 150], foot: 0, hand: ['s', 2, -44], elbow: 'u', knee: 'u' },
      props: [{ t: 'rect', x: 72, y: 112, w: 32, h: 6 }, { t: 'backpad', side: -1, ext: 4 }, { t: 'line', x1: 88, y1: 118, x2: 88, y2: 150, w: 4 }],
      muscles: 'Trizeps (vor allem der lange Kopf)',
      steps: ['Aufrecht sitzen, Hantel mit beiden Händen über dem Kopf.', 'Hantel hinter dem Kopf absenken, Ellbogen zeigen nach oben.', 'Wieder nach oben strecken.'],
    },
    skull: {
      a: { hip: [112, 106], torso: 180, ankle: [130, 150], foot: 0, hand: [70, 60], elbow: 'u', knee: 'u' },
      b: { hip: [112, 106], torso: 180, ankle: [130, 150], foot: 0, hand: [54, 86], elbow: 'u', knee: 'u' },
      props: [{ t: 'rect', x: 40, y: 111, w: 80, h: 7 }, { t: 'line', x1: 50, y1: 118, x2: 50, y2: 150, w: 4 }, { t: 'line', x1: 110, y1: 118, x2: 110, y2: 150, w: 4 }],
      muscles: 'Trizeps',
      steps: ['Auf die Bank legen, SZ-Stange mit gestreckten Armen über der Brust.', 'Nur die Unterarme bewegen: Stange Richtung Stirn bzw. hinter den Kopf absenken.', 'Wieder strecken – die Oberarme bleiben ruhig.'],
    },
    tri_machine: {
      a: { hip: [88, 108], torso: 92, ankle: [120, 150], foot: 0, hand: ['s', 10, 14], elbow: 'b', knee: 'u' },
      b: { hip: [88, 108], torso: 92, ankle: [120, 150], foot: 0, hand: ['s', 6, 44], elbow: 'b', knee: 'u' },
      props: [{ t: 'rect', x: 70, y: 112, w: 34, h: 6 }, { t: 'backpad', side: -1, ext: 6 }, { t: 'line', x1: 88, y1: 118, x2: 88, y2: 150, w: 4 }, { t: 'handle', at: 'hnd', hx: 6, hy: 0, layer: 'front' }],
      muscles: 'Trizeps, Brust',
      steps: ['Aufrecht sitzen, Griffe seitlich auf Brusthöhe.', 'Griffe nach unten drücken, bis die Arme gestreckt sind.', 'Langsam zurück – Ellbogen bleiben nah am Körper.'],
    },
    cable_crunch: {
      a: { hip: [100, 121], torso: 90, ankle: [72, 149], foot: 180, knee: 'f', hand: ['s', 6, -10], elbow: 'd' },
      b: { hip: [100, 121], torso: 30, ankle: [72, 149], foot: 180, knee: 'f', hand: ['s', 6, -10], elbow: 'd', headTilt: -50 },
      props: [{ t: 'cable', from: [110, 6] }],
      muscles: 'Gerade Bauchmuskeln',
      steps: ['Vor dem Kabelzug knien, Seil neben dem Kopf halten.', 'Oberkörper einrollen, Ellbogen Richtung Knie – die Hüfte bleibt ruhig.', 'Langsam wieder aufrichten.'],
    },
    torso_rot: {
      a: { view: 'front', hip: [100, 106], sw: 13, handL: [92, 70], handR: [108, 70], ankleL: [88, 150], ankleR: [112, 150], elbow: 'out' },
      b: { view: 'front', hip: [100, 106], sw: 6, handL: [116, 72], handR: [126, 72], ankleL: [88, 150], ankleR: [112, 150], elbow: 'out' },
      props: [{ t: 'rect', x: 80, y: 108, w: 40, h: 6 }],
      muscles: 'Schräge Bauchmuskeln',
      steps: ['Aufrecht hinsetzen, Beine fixiert, Arme an die Polster.', 'Oberkörper langsam zur Seite drehen – die Hüfte bleibt fest.', 'Kontrolliert zurück. Wiederholungen pro Seite.'],
    },
    backext: {
      a: { hip: [88, 108], torso: 55, ankle: [122, 150], foot: 0, hand: ['s', 10, 14], elbow: 'd', knee: 'u' },
      b: { hip: [88, 108], torso: 98, ankle: [122, 150], foot: 0, hand: ['s', 10, 14], elbow: 'd', knee: 'u' },
      props: [{ t: 'rect', x: 70, y: 112, w: 34, h: 6 }, { t: 'line', x1: 88, y1: 118, x2: 88, y2: 150, w: 4 }, { t: 'pad', at: 'sh', dx: -9, dy: 2, r: 7 }],
      muscles: 'Unterer Rücken',
      steps: ['Hinsetzen, Polster an den oberen Rücken, Füße fest.', 'Langsam nach hinten aufrichten.', 'Kontrolliert nach vorne zurück – nicht ins Hohlkreuz drücken.'],
    },
    pullthrough: {
      a: { hip: [96, 92], torso: 90, ankle: [102, 150], foot: 0, hand: ['s', 2, 40], elbow: 'b', ankle2: [92, 150] },
      b: { hip: [80, 94], torso: 24, ankle: [102, 150], foot: 0, hand: ['s', -16, 38], elbow: 'b', ankle2: [92, 150] },
      props: [{ t: 'cable', from: [20, 146] }],
      muscles: 'Po, Beinbeuger',
      steps: ['Mit dem Rücken zum Kabelzug, Seil zwischen den Beinen greifen, zwei Schritte vor.', 'Hüfte weit nach hinten schieben, Rücken gerade.', 'Hüfte nach vorne bringen und oben den Po fest anspannen.'],
    },
    // ---------- Fitness ----------
    thruster: {
      a: { hip: [84, 120], torso: 60, ankle: [100, 150], foot: 0, hand: ['s', 10, -4], elbow: 'd' },
      b: { ...STAND, hand: ['s', 3, -44], elbow: 'd' },
      muscles: 'Ganzer Körper: Beine, Po, Schultern, Herz-Kreislauf',
      steps: ['Hanteln auf Schulterhöhe, Füße schulterbreit.', 'Tief in die Kniebeuge gehen.', 'Kraftvoll aufstehen und den Schwung nutzen, um die Hanteln über den Kopf zu drücken.'],
    },
    push_press: {
      a: { hip: [96, 102], torso: 86, ankle: [100, 150], foot: 0, hand: ['s', 10, -4], elbow: 'd' },
      b: { ...STAND, hand: ['s', 3, -44], elbow: 'd' },
      muscles: 'Schultern, Trizeps, Beine',
      steps: ['Hanteln auf Schulterhöhe, aufrecht stehen.', 'Kurz in die Knie federn.', 'Explosiv strecken und die Hanteln über den Kopf drücken.'],
    },
    swing: {
      a: { hip: [86, 96], torso: 30, ankle: [100, 150], foot: 0, hand: ['s', -10, 40], elbow: 'd' },
      b: { ...STAND, hand: ['s', 42, 4], elbow: 'd' },
      muscles: 'Po, Beinbeuger, Rumpf, Herz-Kreislauf',
      steps: ['Hantel mit beiden Händen, Füße etwas breiter als hüftbreit.', 'Hüfte nach hinten schieben, Hantel zwischen die Beine schwingen lassen.', 'Hüfte explosiv nach vorne strecken – die Hantel schwingt bis Brusthöhe.'],
    },
    walk: {
      a: { hip: [100, 94], torso: 88, ankle: [116, 150], foot: 0, ankle2: [84, 148], foot2: -30, hand: ['s', -8, 42], hand2: ['s', 10, 40], elbow: 'd' },
      b: { hip: [100, 94], torso: 88, ankle: [84, 148], foot: -30, ankle2: [116, 150], foot2: 0, hand: ['s', 10, 40], hand2: ['s', -8, 42], elbow: 'd' },
      muscles: 'Beine, Herz-Kreislauf',
      steps: ['Aufrecht gehen, nicht festhalten.', 'Zügiges Tempo wählen.', 'Atmung: etwas außer Puste, aber Sprechen ist noch möglich.'],
    },
    farmer: {
      a: { hip: [100, 94], torso: 90, ankle: [114, 150], foot: 0, ankle2: [86, 148], foot2: -30, hand: ['s', 1, 43], elbow: 'd' },
      b: { hip: [100, 94], torso: 90, ankle: [86, 148], foot: -30, ankle2: [114, 150], foot2: 0, hand: ['s', 1, 43], elbow: 'd' },
      muscles: 'Griffkraft, Rumpf, Schultern, Beine',
      steps: ['Zwei schwere Kurzhanteln greifen, aufrecht hinstellen.', 'Mit kurzen, kontrollierten Schritten gehen.', 'Schultern zurück, Bauch fest, nicht zur Seite kippen.'],
    },
    row_stand: {
      a: { hip: [98, 96], torso: 84, ankle: [104, 150], foot: 0, ankle2: [90, 150], hand: ['s', 42, 14], elbow: 'd' },
      b: { hip: [98, 96], torso: 88, ankle: [104, 150], foot: 0, ankle2: [90, 150], hand: ['s', 12, 30], elbow: 'b' },
      props: [{ t: 'cable', from: [186, 70] }],
      muscles: 'Rücken, Bizeps, Rumpf',
      steps: ['Vor den Kabelzug stellen, Knie leicht gebeugt.', 'Griff zum Bauch ziehen, Schulterblätter zusammen.', 'Kontrolliert zurück, Rumpf bleibt stabil.'],
    },
    pallof: {
      a: { hip: [100, 94], torso: 90, ankle: [106, 150], foot: 0, ankle2: [94, 150], hand: ['s', 10, 16], elbow: 'd' },
      b: { hip: [100, 94], torso: 90, ankle: [106, 150], foot: 0, ankle2: [94, 150], hand: ['s', 42, 14], elbow: 'd' },
      props: [{ t: 'cable', from: [186, 70] }],
      muscles: 'Rumpf (gegen Verdrehung), Bauch',
      steps: ['Seitlich zum Kabelzug stellen, Griff mit beiden Händen vor der Brust.', 'Arme gerade nach vorne drücken – der Zug will dich verdrehen, halte dagegen.', '2 Sek. halten, zurück zur Brust. Wiederholungen pro Seite.'],
    },
    woodchop: {
      a: { view: 'front', hip: [100, 92], sw: 13, handL: [66, 30], handR: [72, 34], ankleL: [88, 150], ankleR: [112, 150], elbow: 'out' },
      b: { view: 'front', hip: [100, 92], sw: 13, handL: [126, 106], handR: [132, 102], ankleL: [88, 150], ankleR: [112, 150], elbow: 'out' },
      props: [{ t: 'cable', from: [34, 14], at: 'hndL' }],
      muscles: 'Schräge Bauchmuskeln, Rumpf',
      steps: ['Seitlich zum Kabelzug, Griff oben mit beiden Händen.', 'Diagonal nach unten zur anderen Seite ziehen – Drehung aus Hüfte und Rumpf.', 'Kontrolliert zurück. Wiederholungen pro Seite.'],
    },
    bike: {
      a: { hip: [86, 98], torso: 66, ankle: [112, 142], foot: 0, ankle2: [100, 120], foot2: 0, hand: [128, 78], elbow: 'd', knee: 'f', knee2: 'f' },
      b: { hip: [86, 98], torso: 66, ankle: [100, 120], foot: 0, ankle2: [112, 142], foot2: 0, hand: [128, 78], elbow: 'd', knee: 'f', knee2: 'f' },
      props: [{ t: 'rect', x: 76, y: 100, w: 18, h: 5 }, { t: 'line', x1: 86, y1: 104, x2: 100, y2: 148, w: 5 }, { t: 'line', x1: 106, y1: 132, x2: 130, y2: 80, w: 5 }, { t: 'line', x1: 84, y1: 150, x2: 136, y2: 150, w: 6 }, { t: 'pad', at: 'ank', r: 3 }],
      muscles: 'Beine, Herz-Kreislauf',
      steps: ['Sattel so hoch, dass das Knie unten leicht gebeugt ist.', 'Schnelle Phasen: hoher Widerstand oder hohe Trittfrequenz.', 'Lockere Phasen: ganz leicht weitertreten und durchatmen.'],
    },
    rower: {
      a: { hip: [76, 132], torso: 66, ankle: [118, 140], foot: 70, hand: [120, 112], elbow: 'd', knee: 'u' },
      b: { hip: [54, 132], torso: 108, ankle: [118, 140], foot: 70, hand: ['s', 18, 20], elbow: 'b', knee: 'u' },
      props: [{ t: 'line', x1: 24, y1: 140, x2: 150, y2: 140, w: 5 }, { t: 'pad', at: 'hip', dy: 4, r: 6 }, { t: 'cable', from: [146, 118] }, { t: 'handle', at: 'hnd', hx: 0, hy: 5, layer: 'front' }],
      muscles: 'Beine, Rücken, Arme, Herz-Kreislauf',
      steps: ['Füße festschnallen, Griff mit gestreckten Armen.', 'Zuerst mit den Beinen abdrücken, dann Oberkörper leicht zurück, zuletzt Griff zum Bauch.', 'Zurück in umgekehrter Reihenfolge: Arme, Oberkörper, Beine.'],
    },
    cross: {
      a: { hip: [100, 88], torso: 88, ankle: [116, 140], foot: 0, ankle2: [86, 146], foot2: 0, hand: ['s', 20, 18], hand2: ['s', 4, 30], elbow: 'd' },
      b: { hip: [100, 88], torso: 88, ankle: [86, 146], foot: 0, ankle2: [116, 140], foot2: 0, hand: ['s', 4, 30], hand2: ['s', 20, 18], elbow: 'd' },
      props: [{ t: 'line', x1: 70, y1: 150, x2: 140, y2: 150, w: 6 }, { t: 'line', x1: 130, y1: 150, x2: 130, y2: 60, w: 4 }],
      muscles: 'Ganzer Körper, Herz-Kreislauf',
      steps: ['Aufrecht auf die Pedale stellen, Griffe locker halten.', 'Gleichmäßig treten, Arme schieben und ziehen aktiv mit.', 'Tempo so, dass du noch in ganzen Sätzen sprechen kannst.'],
    },
  };

  // ---------- Übung -> Muster + Geräte ----------
  const plate = (at = 'hnd', r = 12, extra = {}) => ({ t: 'plate', at, r, layer: 'front', ...extra });
  const db = (at = 'hnd') => ({ t: 'db', at, layer: 'front' });
  const MAP = {
    squat_bb: ['squat', [plate()]],
    squat_smith: ['squat', [{ t: 'rail', x: 84 }, plate('hnd', 4)]],
    goblet: ['squat', [db()], { hand: ['s', 12, 10] }],
    belt_squat: ['squat', [{ t: 'cable2', from: [100, 150], to: 'hip' }, { t: 'rect', x: 88, y: 148, w: 24, h: 5 }], { hand: ['s', 28, 10] }],
    hack_squat: ['hack'],
    legpress: ['legpress'],
    rdl_bb: ['hinge', [plate()]],
    rdl_db: ['hinge', [db()]],
    deadlift: ['deadlift', [plate()]],
    hipthrust: ['hipthrust'],
    pullthrough: ['pullthrough'],
    lunge_db: ['lunge', [db()]],
    bulgarian: ['bulgarian', [db()]],
    legext: ['legext'],
    legcurl_sit: ['legcurl'],
    legcurl_uni: ['legcurl'],
    legcurl_ly: ['legcurl'],
    calf_m: ['calf'],
    calf_seated: ['calf_seated'],
    calf_legpress: ['calf_lp'],
    bench_bb: ['bench', [plate()]],
    bench_db: ['bench', [db()]],
    chestpress: ['chestpress'],
    incline_db: ['incline', [db()]],
    incline_smith: ['incline', [{ t: 'rail', x: 72 }, plate('hnd', 4)]],
    shoulderpress: ['ohp_seated', [{ t: 'handle', at: 'hnd', layer: 'front' }]],
    ohp_db: ['ohp_seated', [db()]],
    ohp_smith: ['ohp_seated', [{ t: 'rail', x: 100 }, plate('hnd', 4)]],
    ohp_bb: ['ohp_stand', [plate()]],
    latpull: ['latpull'],
    latpull_cg: ['latpull'],
    latpull_m: ['latpull'],
    pullup_ass: ['pullup_ass'],
    pullover_m: ['pullover'],
    row_cable: ['row_seated', [{ t: 'cable', from: [176, 112] }]],
    row_machine: ['row_seated', [{ t: 'rect', x: 116, y: 60, w: 7, h: 40 }]],
    row_bb: ['row_bent', [plate()]],
    tbar: ['row_bent', [{ t: 'cable2', from: [170, 150], to: 'hnd' }, plate('hnd', 10)]],
    row_db: ['row_db', [db()]],
    lateral_db: ['lateral', [db('hndL'), db('hndR')]],
    lateral_cable: ['lateral', [{ t: 'cable', from: [60, 146], at: 'hndR' }]],
    lateral_m: ['lateral', [{ t: 'pad', at: 'elbL', r: 6, layer: 'front' }, { t: 'pad', at: 'elbR', r: 6, layer: 'front' }]],
    reverse_fly: ['rearfly', [{ t: 'handle', at: 'hndL', layer: 'front' }, { t: 'handle', at: 'hndR', layer: 'front' }]],
    rear_db: ['rearfly', [db('hndL'), db('hndR')]],
    facepull: ['facepull'],
    curl_db: ['curl', [db()]],
    hammer: ['curl', [{ t: 'handle', at: 'hnd', hx: 0, hy: 7, layer: 'front' }]],
    curl_sz: ['curl', [plate('hnd', 9)]],
    curl_cable: ['curl', [{ t: 'cable', from: [124, 148] }]],
    curl_incline: ['curl_incline', [db()]],
    curl_m: ['curl_machine', [{ t: 'handle', at: 'hnd', layer: 'front' }]],
    pushdown: ['pushdown'],
    overhead_tri: ['tri_overhead_cable'],
    oh_tri_db: ['tri_overhead_db', [db()]],
    skull_sz: ['skull', [plate('hnd', 8)]],
    tri_m: ['tri_machine'],
    cable_crunch: ['cable_crunch'],
    torso_m: ['torso_rot'],
    crunch_m: ['cable_crunch'],
    backext_m: ['backext'],
    pallof: ['pallof', [{ t: 'handle', at: 'hnd', layer: 'front' }]],
    woodchop: ['woodchop'],
    // Fitness
    thruster: ['thruster', [db()]],
    db_push_press: ['push_press', [db()]],
    db_swing: ['swing', [db()]],
    farmer: ['farmer', [db()]],
    cable_row_stand: ['row_stand', [{ t: 'handle', at: 'hnd', hx: 0, hy: 5, layer: 'front' }]],
    goblet_fit: ['squat', [db()], { hand: ['s', 12, 10] }],
    pallof_fit: ['pallof', [{ t: 'handle', at: 'hnd', layer: 'front' }]],
    woodchop_fit: ['woodchop'],
    rdl_fit: ['hinge', [db()]],
    db_row_bent: ['row_bent', [db()]],
  };

  const cache = {};
  function def(exId) {
    if (cache[exId]) return cache[exId];
    const m = MAP[exId]; if (!m) return null;
    const base = P[m[0]];
    const d = {
      a: m[2] ? { ...base.a, ...m[2] } : base.a,
      b: m[2] ? { ...base.b, ...m[2] } : base.b,
      props: [...(base.props || []), ...(m[1] || [])],
      muscles: base.muscles, steps: base.steps,
    };
    return (cache[exId] = d);
  }

  // Ausschnitt um Figur + Geräte (über die ganze Bewegung), damit kleine Bilder gut erkennbar sind
  function viewBox(d) {
    if (d._vb) return d._vb;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    [0, 0.5, 1].forEach((t) => {
      const p = poseAt(d, t);
      Object.values(p).forEach((v) => { if (Array.isArray(v) && typeof v[0] === 'number') add(v[0], v[1]); });
      add(p.head[0] - 10, p.head[1] - 10); add(p.head[0] + 10, p.head[1] + 10);
    });
    (d.props || []).forEach((pr) => {
      if (pr.t === 'rect') { add(pr.x, pr.y); add(pr.x + pr.w, pr.y + pr.h); }
      if (pr.t === 'line') { add(pr.x1, pr.y1); add(pr.x2, pr.y2); }
      if (pr.from) add(pr.from[0], pr.from[1]);
    });
    y1 = Math.max(y1, 152);
    const pad = 10; x0 -= pad; y0 -= pad; x1 += pad; y1 += 4;
    // Mindestbreite, damit schmale Figuren nicht riesig werden
    const w = Math.max(x1 - x0, (y1 - y0) * 0.9), cx = (x0 + x1) / 2;
    return (d._vb = `${Math.round(cx - w / 2)} ${Math.round(y0)} ${Math.round(w)} ${Math.round(y1 - y0)}`);
  }

  function svg(exId, { anim = false, cls = '' } = {}) {
    const d = def(exId); if (!d) return '';
    return `<svg class="fig ${cls}" viewBox="${viewBox(d)}" ${anim ? 'data-anim="1"' : ''} data-fig="${exId}" aria-hidden="true">${svgFor(d, 0.55)}</svg>`;
  }

  // Animationsschleife: zeichnet alle sichtbaren animierten Figuren (~30 fps)
  let last = 0; const T = 3200;
  function phase(now) {
    // 0..1..0 mit kurzen Pausen oben/unten
    const x = (now % T) / T;
    if (x < 0.1) return 0; if (x < 0.45) return (x - 0.1) / 0.35; if (x < 0.6) return 1; if (x < 0.95) return 1 - (x - 0.6) / 0.35; return 0;
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if (now - last < 33 || document.hidden) return; last = now;
    const t = phase(now);
    document.querySelectorAll('svg.fig[data-anim]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const d = def(el.dataset.fig); if (d) el.innerHTML = svgFor(d, t);
    });
  }
  requestAnimationFrame(loop);

  const frame = (exId, t) => { const d = def(exId); return d ? svgFor(d, t) : ''; };
  return { svg, def, frame, has: (id) => !!MAP[id] };
})();
