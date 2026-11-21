// Übungsbibliothek – Freihanteln (Langhantel, Kurzhantel, SZ-Stange), geführte Maschinen
// (Steckgewicht-/Scheibenmaschinen, Multipresse) und Kabelzug, wie bei McFit vorhanden.
// Keine reinen Körpergewichtsübungen.
//
// reps:  Wiederholungsbereich [min, max] für die doppelte Progression
// inc:   Gewichtssprung in kg, wenn alle Sätze das obere Ende erreichen
//        (negativ = Unterstützungsmaschine: weniger kg ist schwerer)
// start: Vorschlag für das erste Training (kg) – passt du beim ersten Mal ohnehin an
// type:  'free' = Freihantel, 'machine' = geführte Maschine, 'cable' = Kabelzug

const EXERCISES = {
  // ---------- Beine: Kniebeuge-Muster ----------
  legpress:    { name: 'Beinpresse', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 60, unit: 'Wdh',
                 tip: 'Füße schulterbreit, Knie folgen den Zehen. Unten nicht mit dem Becken abrollen.' },
  squat_smith: { name: 'Kniebeuge (Multipresse)', type: 'machine', sets: 3, reps: [6, 10], inc: 2.5, start: 30, unit: 'Wdh',
                 tip: 'Füße leicht vor der Stange, mindestens bis Oberschenkel parallel. Rumpf fest.' },
  hack_squat:  { name: 'Hackenschmidt-Kniebeuge (Maschine)', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 40, unit: 'Wdh',
                 tip: 'Rücken flach ans Polster, kontrolliert tief gehen, über die ganze Fußsohle drücken.' },
  squat_bb:    { name: 'Kniebeuge (Langhantel)', type: 'free', sets: 3, reps: [6, 10], inc: 2.5, start: 30, unit: 'Wdh',
                 tip: 'Stange auf dem oberen Trapez, Bauch anspannen, Knie nach außen drücken.' },
  goblet:      { name: 'Goblet Squat (Kurzhantel)', type: 'free', sets: 3, reps: [10, 15], inc: 2, start: 14, unit: 'Wdh',
                 tip: 'Hantel vor der Brust, Ellbogen zwischen die Knie, aufrechter Oberkörper.' },

  belt_squat:  { name: 'Belt Squat (Maschine)', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 40, unit: 'Wdh',
                 tip: 'Gurt um die Hüfte, aufrechter Oberkörper, tief und kontrolliert – schont den Rücken.' },

  // ---------- Beine: Hüftstreckung ----------
  rdl_bb:      { name: 'Rumänisches Kreuzheben (Langhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2.5, start: 30, unit: 'Wdh',
                 tip: 'Knie leicht gebeugt, Hüfte nach hinten schieben, Stange nah am Bein. Rücken gerade!' },
  hipthrust:   { name: 'Hip Thrust (Langhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 5, start: 40, unit: 'Wdh',
                 tip: 'Schulterblätter auf der Bank, oben Po fest anspannen, Kinn zur Brust.' },
  rdl_db:      { name: 'Rumänisches Kreuzheben (Kurzhantel)', type: 'free', sets: 3, reps: [10, 12], inc: 2, start: 14, unit: 'Wdh',
                 tip: 'Wie mit der Langhantel – Hanteln an den Oberschenkeln entlang führen.' },
  deadlift:    { name: 'Kreuzheben (Langhantel)', type: 'free', sets: 3, reps: [5, 8], inc: 5, start: 40, unit: 'Wdh',
                 tip: 'Stange über Mittelfuß, Brust raus, Rücken neutral. Mit den Beinen wegdrücken.' },

  // ---------- Beine: einbeinig / Quadrizeps ----------
  legext:      { name: 'Beinstrecker (Maschine)', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Oben 1 Sek. halten, langsam ablassen.' },
  lunge_db:    { name: 'Ausfallschritte (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 8, unit: 'Wdh',
                 tip: 'Wdh. pro Bein. Großer Schritt, hinteres Knie Richtung Boden.' },
  bulgarian:   { name: 'Bulgarian Split Squat (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 6, unit: 'Wdh',
                 tip: 'Wdh. pro Bein. Hinterer Fuß auf der Bank, Gewicht auf dem vorderen Bein.' },

  // ---------- Beinbeuger ----------
  legcurl_ly:  { legacy: true, name: 'Beinbeuger liegend (Maschine)', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 25, unit: 'Wdh',
                 tip: 'Hüfte auf das Polster drücken, kontrolliert ablassen.' },
  legcurl_sit: { name: 'Beinbeuger sitzend (Maschine)', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Oberschenkelpolster fest, volle Bewegung ausnutzen.' },

  legcurl_uni: { name: 'Beinbeuger sitzend einbeinig (Maschine)', type: 'machine', sets: 3, reps: [10, 12], inc: 2.5, start: 15, unit: 'Wdh',
                 tip: 'Wdh. pro Bein. Oberkörper leicht nach vorne lehnen – das dehnt den Beinbeuger stärker.' },

  // ---------- Brust ----------
  bench_bb:    { name: 'Bankdrücken (Langhantel)', type: 'free', sets: 3, reps: [6, 10], inc: 2.5, start: 30, unit: 'Wdh',
                 tip: 'Schulterblätter zusammen, Füße fest am Boden, Stange zur unteren Brust.' },
  chestpress:  { name: 'Brustpresse (Maschine)', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Griffe auf Brusthöhe, Schultern unten lassen.' },
  incline_db:  { name: 'Schrägbankdrücken (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 14, unit: 'Wdh',
                 tip: 'Bank ca. 30°, Ellbogen ca. 45° vom Körper.' },
  bench_db:    { name: 'Bankdrücken (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 16, unit: 'Wdh',
                 tip: 'Hanteln unten auf Brusthöhe, oben nicht zusammenschlagen.' },
  incline_smith:{ name: 'Schrägbankdrücken (Multipresse)', type: 'machine', sets: 3, reps: [8, 12], inc: 2.5, start: 20, unit: 'Wdh',
                 tip: 'Bank ca. 30°, Stange zur oberen Brust absenken.' },

  // ---------- Rücken: vertikal ----------
  latpull_m:   { name: 'Latzug-Maschine (geführt)', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                 tip: 'Brust raus, Griffe zur oberen Brust ziehen, Ellbogen nach unten führen.' },
  pullup_ass:  { name: 'Klimmzug-Maschine (assistiert)', type: 'machine', sets: 3, reps: [6, 10], inc: -5, start: 40, unit: 'Wdh',
                 tip: 'Gewicht = Unterstützung. Weniger kg ist schwerer – die App senkt es automatisch.' },
  pullover_m:  { name: 'Pullover-Maschine', type: 'machine', sets: 3, reps: [10, 12], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Ellbogen gegen die Polster, Arme in einem Bogen nach unten führen.' },

  // ---------- Rücken: Rudern ----------
  row_machine: { name: 'Rudermaschine', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Brust ans Polster, Ellbogen nach hinten führen, Schulterblätter zusammen.' },
  row_db:      { name: 'Rudern einarmig (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 16, unit: 'Wdh',
                 tip: 'Wdh. pro Seite. Hand und Knie auf der Bank, Hantel zur Hüfte ziehen.' },
  row_bb:      { name: 'Rudern vorgebeugt (Langhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2.5, start: 30, unit: 'Wdh',
                 tip: 'Oberkörper ca. 45° vorgebeugt, Rücken gerade, Stange zum Bauchnabel ziehen.' },
  tbar:        { name: 'T-Bar-Rudern (Maschine)', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Brust aufs Polster, Rücken gerade, Griffe zum Bauch ziehen.' },

  // ---------- Schultern ----------
  shoulderpress:{ name: 'Schulterpresse (Maschine)', type: 'machine', sets: 3, reps: [8, 12], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Rücken an die Lehne, Griffe auf Schulterhöhe starten.' },
  ohp_db:      { name: 'Schulterdrücken (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 10, unit: 'Wdh',
                 tip: 'Sitzend mit Lehne, Hanteln bis Ohrhöhe absenken.' },
  ohp_smith:   { name: 'Schulterdrücken (Multipresse)', type: 'machine', sets: 3, reps: [8, 12], inc: 2.5, start: 20, unit: 'Wdh',
                 tip: 'Sitzend, Bank senkrecht, Stange bis kurz unter das Kinn absenken.' },
  ohp_bb:      { name: 'Schulterdrücken stehend (Langhantel)', type: 'free', sets: 3, reps: [6, 10], inc: 2.5, start: 20, unit: 'Wdh',
                 tip: 'Po und Bauch anspannen, Stange in gerader Linie über den Kopf.' },
  lateral_db:  { name: 'Seitheben (Kurzhantel)', type: 'free', sets: 2, reps: [12, 15], inc: 1, start: 6, unit: 'Wdh',
                 tip: 'Leicht vorgebeugt, bis Schulterhöhe, kein Schwung.' },
  lateral_m:   { name: 'Seitheben-Maschine', type: 'machine', sets: 2, reps: [12, 15], inc: 5, start: 15, unit: 'Wdh',
                 tip: 'Schulter auf Höhe der Drehachse, Ellbogen führen die Bewegung.' },
  reverse_fly: { name: 'Reverse Butterfly (Maschine)', type: 'machine', sets: 2, reps: [12, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Brust ans Polster, Arme fast gestreckt nach hinten führen.' },
  rear_db:     { name: 'Vorgebeugtes Seitheben (Kurzhantel)', type: 'free', sets: 2, reps: [12, 15], inc: 1, start: 5, unit: 'Wdh',
                 tip: 'Oberkörper fast waagerecht, Arme seitlich anheben, Schulterblätter nicht hochziehen.' },

  // ---------- Arme ----------
  curl_db:     { name: 'Bizeps-Curls (Kurzhantel)', type: 'free', sets: 2, reps: [10, 12], inc: 1, start: 10, unit: 'Wdh',
                 tip: 'Ellbogen bleiben am Körper.' },
  curl_sz:     { name: 'Bizeps-Curls (SZ-Stange)', type: 'free', sets: 2, reps: [8, 12], inc: 2.5, start: 15, unit: 'Wdh',
                 tip: 'Ellbogen fixiert, ohne Schwung aus dem Rücken.' },
  curl_m:      { name: 'Bizepsmaschine', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 15, unit: 'Wdh',
                 tip: 'Oberarme flach auf dem Polster, unten fast komplett strecken.' },
  curl_incline:{ name: 'Schrägbank-Curls (Kurzhantel)', type: 'free', sets: 2, reps: [10, 12], inc: 1, start: 8, unit: 'Wdh',
                 tip: 'Bank ca. 60°, Arme hängen hinter dem Körper – starke Dehnung im Bizeps.' },
  hammer:      { name: 'Hammer-Curls (Kurzhantel)', type: 'free', sets: 2, reps: [10, 12], inc: 1, start: 10, unit: 'Wdh',
                 tip: 'Neutraler Griff, Daumen zeigen nach oben.' },
  tri_m:       { name: 'Trizepsmaschine / Dip-Maschine', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 25, unit: 'Wdh',
                 tip: 'Ellbogen nah am Körper, unten komplett strecken.' },
  skull_sz:    { name: 'French Press (SZ-Stange)', type: 'free', sets: 2, reps: [8, 12], inc: 2.5, start: 10, unit: 'Wdh',
                 tip: 'Auf der Bank liegend, Stange Richtung Stirn absenken, Ellbogen zeigen nach oben.' },
  oh_tri_db:   { name: 'Trizeps Überkopf (Kurzhantel)', type: 'free', sets: 2, reps: [10, 12], inc: 2, start: 12, unit: 'Wdh',
                 tip: 'Sitzend, eine Hantel mit beiden Händen hinter dem Kopf absenken.' },

  // ---------- Rumpf / Waden ----------
  crunch_m:    { legacy: true, name: 'Bauchmaschine', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Wirbelsäule einrollen, nicht aus den Armen ziehen.' },
  torso_m:     { name: 'Rotationsmaschine (schräge Bauchmuskeln)', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Wdh. pro Seite. Langsam drehen, Hüfte bleibt fest.' },
  backext_m:   { name: 'Rückenstrecker-Maschine', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Langsam aufrichten, nicht ins Hohlkreuz überstrecken.' },
  calf_m:      { name: 'Wadenmaschine stehend', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 40, unit: 'Wdh',
                 tip: 'Unten dehnen, oben 1 Sek. halten.' },
  calf_legpress:{ name: 'Wadendrücken an der Beinpresse', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 60, unit: 'Wdh',
                 tip: 'Nur die Fußballen auf der Platte, unten 2 Sek. dehnen, oben anspannen.' },
  calf_seated: { name: 'Wadenmaschine sitzend', type: 'machine', sets: 2, reps: [12, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Volle Bewegung, oben kurz halten.' },

  // ---------- Kabelzug ----------
  latpull:      { name: 'Latzug breit (Kabel)', type: 'cable', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                  tip: 'Zur oberen Brust ziehen, Brust raus, nicht mit Schwung arbeiten.' },
  latpull_cg:   { name: 'Latzug eng / Untergriff (Kabel)', type: 'cable', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                  tip: 'Ellbogen nah am Körper nach unten ziehen.' },
  row_cable:    { name: 'Rudern am Kabel sitzend', type: 'cable', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                  tip: 'Aufrecht sitzen, Schulterblätter zuerst zusammenziehen, nicht nach hinten lehnen.' },
  lateral_cable:{ name: 'Seitheben am Kabel', type: 'cable', sets: 2, reps: [12, 15], inc: 2.5, start: 5, unit: 'Wdh',
                  tip: 'Wdh. pro Seite. Einarmig, Kabel hinter dem Körper führen.' },
  facepull:     { name: 'Face Pulls (Kabel)', type: 'cable', sets: 2, reps: [12, 15], inc: 2.5, start: 15, unit: 'Wdh',
                  tip: 'Seil zur Stirn ziehen, Ellbogen hoch – gut für die Schultergesundheit.' },
  curl_cable:   { name: 'Bizeps-Curls am Kabel', type: 'cable', sets: 2, reps: [10, 15], inc: 2.5, start: 15, unit: 'Wdh',
                  tip: 'Gerade Stange oder Seil, Ellbogen fixiert, oben kurz anspannen.' },
  pushdown:     { name: 'Trizepsdrücken am Kabel', type: 'cable', sets: 2, reps: [10, 15], inc: 2.5, start: 20, unit: 'Wdh',
                  tip: 'Ellbogen am Körper fixiert, unten komplett strecken.' },
  overhead_tri: { name: 'Trizeps Überkopf (Kabel/Seil)', type: 'cable', sets: 2, reps: [10, 15], inc: 2.5, start: 15, unit: 'Wdh',
                  tip: 'Mit dem Rücken zum Kabel, Ellbogen zeigen nach vorne-oben.' },
  cable_crunch: { name: 'Kabel-Crunch (kniend)', type: 'cable', sets: 2, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                  tip: 'Seil neben dem Kopf, Wirbelsäule einrollen – die Hüfte bleibt still.' },
  pallof:       { name: 'Pallof Press (Kabel)', type: 'cable', sets: 2, reps: [10, 12], inc: 2.5, start: 10, unit: 'Wdh',
                  tip: 'Wdh. pro Seite. Seitlich zum Kabel, Griff vor der Brust nach vorne drücken – der Rumpf darf sich nicht mitdrehen.' },
  woodchop:     { name: 'Holzhacker (Kabel)', type: 'cable', sets: 2, reps: [10, 12], inc: 2.5, start: 10, unit: 'Wdh',
                  tip: 'Wdh. pro Seite. Kabel von oben diagonal nach unten ziehen, Drehung aus Hüfte und Rumpf.' },
  pullthrough:  { name: 'Pull-Through (Kabel)', type: 'cable', sets: 3, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                  tip: 'Rücken zum Kabel, Seil zwischen den Beinen, Hüfte nach hinten schieben und Po anspannen.' },

  // ---------- Nicht mehr im Plan (nur für alte Verlaufseinträge) ----------
  dips_ass:     { legacy: true, name: 'Dips (assistiert)', sets: 2, reps: [8, 12], inc: -5, start: 40, unit: 'Wdh', tip: '' },
  plank:        { legacy: true, name: 'Plank', sets: 3, reps: [30, 60], inc: 0, start: 0, unit: 'Sek', tip: '' },
  kneeraise:    { legacy: true, name: 'Knieheben hängend', sets: 3, reps: [10, 15], inc: 0, start: 0, unit: 'Wdh', tip: '' },
  backext:      { legacy: true, name: 'Rückenstrecker (Hyperextension)', sets: 3, reps: [12, 15], inc: 2.5, start: 0, unit: 'Wdh', tip: '' },
  calf:         { legacy: true, name: 'Wadenheben', sets: 3, reps: [12, 15], inc: 5, start: 40, unit: 'Wdh', tip: '' },
  lunge:        { legacy: true, name: 'Ausfallschritte', sets: 3, reps: [8, 12], inc: 2, start: 8, unit: 'Wdh', tip: '' },
};

// Zwei Ganzkörper-Einheiten (A und B) im Wechsel – jede kommt einmal pro Woche dran.
// Aufbau nach evidenzbasierten Prinzipien (u. a. Brad Schoenfeld, Jeff Nippard, Mike Israetel):
//  - jeder große Muskel 2× pro Woche, ca. 6–10 harte Sätze pro Muskel und Woche
//  - Grundübung zuerst, dann Isolation; Übungen mit Dehnung unter Last bevorzugt
//    (z. B. Beinbeuger sitzend statt liegend, Trizeps über Kopf, Schrägbank-Curls, RDL)
//  - Sätze anstrengend, aber mit 2–3 Wdh. Reserve (nicht bis zum Versagen), doppelte Progression
//  - jedes Training: Aufwärmen mit Mobilität + Fitness-Block (Zirkel, Intervalle oder Ausdauer)
// main: true  = Grundübung, wechselt alle paar Wochen (versetzt über shift)
// main: false = Ergänzungsübung, wechselt jede Woche
const WORKOUTS = {
  A: {
    name: 'Ganzkörper A',
    focus: 'Beine vorne · Brust · Latzug · Arme',
    slots: [
      { id: 'A1', label: 'Beine – Kniebeuge', main: true, shift: 0, options: ['hack_squat', 'legpress', 'squat_smith', 'belt_squat', 'squat_bb'] },
      { id: 'A2', label: 'Brust – Drücken',   main: true, shift: 2, options: ['bench_db', 'chestpress', 'bench_bb', 'incline_smith'] },
      { id: 'A3', label: 'Rücken – Ziehen von oben', main: true, shift: 1, options: ['latpull', 'latpull_m', 'latpull_cg', 'pullup_ass'] },
      { id: 'A4', label: 'Beinbeuger',        options: ['legcurl_sit', 'legcurl_uni'] },
      { id: 'A5', label: 'Schultern seitlich', options: ['lateral_cable', 'lateral_db', 'lateral_m'] },
      { id: 'A6', label: 'Trizeps',           options: ['overhead_tri', 'oh_tri_db', 'skull_sz', 'pushdown', 'tri_m'] },
      { id: 'A7', label: 'Waden',             options: ['calf_m', 'calf_legpress', 'calf_seated'] },
    ],
  },
  B: {
    name: 'Ganzkörper B',
    focus: 'Po & Beinbeuger · Rudern · Schulter/Schrägbank · Arme',
    slots: [
      { id: 'B1', label: 'Beine – Hüftstreckung', main: true, shift: 1, options: ['rdl_bb', 'rdl_db', 'hipthrust', 'deadlift'] },
      { id: 'B2', label: 'Rücken – Rudern',   main: true, shift: 0, options: ['row_cable', 'row_machine', 'tbar', 'row_db', 'row_bb'] },
      { id: 'B3', label: 'Schräg-/Schulterdrücken', main: true, shift: 3, options: ['incline_db', 'shoulderpress', 'incline_smith', 'ohp_db', 'ohp_smith'] },
      { id: 'B4', label: 'Beine – Oberschenkel vorne', options: ['legext', 'bulgarian', 'lunge_db'] },
      { id: 'B5', label: 'Hintere Schulter',  options: ['reverse_fly', 'facepull', 'rear_db'] },
      { id: 'B6', label: 'Bizeps',            options: ['curl_incline', 'curl_cable', 'curl_sz', 'hammer', 'curl_m'] },
      { id: 'B7', label: 'Rumpf / Bauch',     options: ['pallof', 'cable_crunch', 'woodchop', 'torso_m'] },
    ],
  },
};

// ---------- Fitness ----------
// Übungen für Zirkel/Kraftausdauer und Cardio-Geräte (nur für Anleitung & Figur, ohne Gewichtsprogression)
const FIT_EX = {
  thruster:  { name: 'Thruster (Kurzhanteln)', type: 'free', tip: 'Aus der Kniebeuge mit Schwung direkt über den Kopf drücken – eine fließende Bewegung.' },
  db_swing:  { name: 'Kurzhantel-Swing', type: 'free', tip: 'Hantel mit beiden Händen, Kraft kommt aus der Hüfte – nicht aus den Armen. Rücken gerade.' },
  farmer:    { name: "Farmer's Walk (Kurzhanteln)", type: 'free', tip: 'Schwere Hanteln, aufrecht gehen, Schultern nach hinten-unten, Bauch fest.' },
  cable_row_stand: { name: 'Rudern stehend am Kabel', type: 'cable', tip: 'Leicht in die Knie, Griff zum Bauch ziehen, Schulterblätter zusammen.' },
  db_push_press: { name: 'Push Press (Kurzhanteln)', type: 'free', tip: 'Kurz in die Knie federn und den Schwung nutzen, um die Hanteln nach oben zu drücken.' },
  goblet_fit:{ name: 'Goblet Squat (Kurzhantel)', type: 'free', tip: 'Hantel vor der Brust, tief und aufrecht in die Hocke.' },
  pallof_fit:{ name: 'Pallof Press (Kabel)', type: 'cable', tip: 'Griff vor die Brust, nach vorne drücken, Rumpf bleibt stabil.' },
  woodchop_fit: { name: 'Holzhacker (Kabel)', type: 'cable', tip: 'Diagonal von oben nach unten ziehen, Kraft aus Hüfte und Rumpf.' },
  rdl_fit:   { name: 'Rumänisches Kreuzheben (Kurzhanteln)', type: 'free', tip: 'Hüfte nach hinten, Rücken gerade, Hanteln am Bein entlang.' },
  db_row_bent: { name: 'Rudern vorgebeugt (Kurzhanteln)', type: 'free', tip: 'Oberkörper nach vorne geneigt, Hanteln zum Bauch ziehen.' },
};

// Fitness-Block am Ende jedes Trainings (ca. 12 Min.) – ohne Cardio-Geräte, nur Kurzhanteln und Kabelzug.
// Wechselt jedes Training. value: was du einträgst, um dich zu verbessern.
const FITNESS = [
  { id: 'circuit1', kind: 'Zirkel', name: 'Kraft-Ausdauer-Zirkel', value: 'Runden',
    detail: '3–4 Runden: je 40 Sek. Arbeit, 20 Sek. Pause. Nach jeder Runde 1 Min. Pause.',
    items: [{ id: 'thruster', dose: '40 Sek.' }, { id: 'cable_row_stand', dose: '40 Sek.' }, { id: 'db_swing', dose: '40 Sek.' }, { id: 'farmer', dose: '40 Sek.' }] },
  { id: 'emom', kind: 'Intervalle', name: 'EMOM 12 Minuten', value: 'Runden geschafft',
    detail: 'Jede volle Minute startest du neu: Minute 1 Swings, Minute 2 Thruster, immer im Wechsel. Rest der Minute = Pause.',
    items: [{ id: 'db_swing', dose: '12 Wdh. (ungerade Minuten)' }, { id: 'thruster', dose: '8 Wdh. (gerade Minuten)' }] },
  { id: 'circuit2', kind: 'Zirkel', name: 'Rumpf- und Ganzkörper-Zirkel', value: 'Runden',
    detail: '3 Runden: 10–12 Wdh. pro Übung, möglichst ohne Pause, 1 Min. Pause nach jeder Runde.',
    items: [{ id: 'goblet_fit', dose: '12 Wdh.' }, { id: 'db_push_press', dose: '10 Wdh.' }, { id: 'pallof_fit', dose: '10 je Seite' }, { id: 'woodchop_fit', dose: '10 je Seite' }] },
  { id: 'complex', kind: 'Hantel-Komplex', name: 'Kurzhantel-Komplex', value: 'Runden',
    detail: 'Die 4 Übungen direkt hintereinander, ohne die Hanteln abzulegen = 1 Runde. 1 Min. Pause, 4–5 Runden. Leichte Hanteln!',
    items: [{ id: 'rdl_fit', dose: '8 Wdh.' }, { id: 'db_row_bent', dose: '8 Wdh.' }, { id: 'db_push_press', dose: '8 Wdh.' }, { id: 'goblet_fit', dose: '8 Wdh.' }] },
  { id: 'tabata', kind: 'Intervalle', name: 'Tabata-Intervalle', value: 'Wdh. gesamt',
    detail: '2 Blöcke à 4 Min.: 8 × (20 Sek. Vollgas / 10 Sek. Pause), dazwischen 1 Min. Pause. Zähl deine Wiederholungen.',
    items: [{ id: 'db_swing', dose: 'Block 1: 8 × 20 Sek.' }, { id: 'thruster', dose: 'Block 2: 8 × 20 Sek.' }] },
  { id: 'carry', kind: 'Rumpf & Griff', name: 'Tragen & Rumpf-Zirkel', value: 'Runden',
    detail: '3–4 Runden ohne lange Pausen, 1 Min. Pause nach jeder Runde.',
    items: [{ id: 'farmer', dose: '40 m bzw. 45 Sek.' }, { id: 'woodchop_fit', dose: '10 je Seite' }, { id: 'cable_row_stand', dose: '15 Wdh.' }, { id: 'pallof_fit', dose: '10 je Seite' }] },
  // ältere Blöcke (nur für alte Verlaufseinträge)
  { id: 'bike_int', legacy: true, kind: 'Intervalle', name: 'Intervalle auf dem Rad', value: 'Intervalle', detail: '', items: [] },
  { id: 'cross', legacy: true, kind: 'Ausdauer', name: 'Crosstrainer', value: 'Minuten', detail: '', items: [] },
  { id: 'row_int', legacy: true, kind: 'Intervalle', name: 'Rudergerät-Intervalle', value: 'Meter gesamt', detail: '', items: [] },
  { id: 'incline', legacy: true, kind: 'Ausdauer', name: 'Steigung gehen', value: 'Minuten', detail: '', items: [] },
];

// Aufwärmen (ca. 5–7 Min.) – ohne Cardio-Geräte: Mobilität und leichte Aktivierung
const WARMUP = [
  'Armkreisen vor und zurück, je 10×',
  'Hüftkreisen und Ausfallschritt mit Rotation, je 5 pro Seite',
  '15 leichte Goblet Squats mit einer leichten Kurzhantel',
  '15 leichte Face Pulls oder Rudern am Kabel',
  '1–2 leichte Sätze bei der ersten Übung (siehe Hinweis)',
];


// =====================================================================
// ZUHAUSE-TRAINING – nur Körpergewicht und Yogamatte
// =====================================================================
// Steigerung über Stufen (ladder: true): Schaffst du in allen Sätzen das obere Ende
// des Wiederholungsbereichs, kommt beim nächsten Mal die schwierigere Variante.
const bw = (name, reps, unit, tip, sets = 3) => ({ name, type: 'bw', sets, reps, inc: 0, start: 0, unit, tip });
Object.assign(EXERCISES, {
  // Beine
  squat_bw:      bw('Kniebeuge', [15, 25], 'Wdh', 'Arme nach vorne für Balance, tief und kontrolliert, Fersen bleiben am Boden.'),
  squat_pause:   bw('Kniebeuge mit 3 Sek. Pause unten', [12, 20], 'Wdh', 'Unten 3 Sek. halten, dann kraftvoll hoch – viel schwerer als es klingt.'),
  split_squat:   bw('Split Squat (Standwaage-Kniebeuge)', [10, 15], 'Wdh', 'Wdh. pro Bein. Schrittstellung, senkrecht nach unten, hinteres Knie fast am Boden.'),
  jump_squat:    bw('Sprung-Kniebeuge', [10, 15], 'Wdh', 'Aus der Kniebeuge explosiv hochspringen, weich landen und direkt wieder runter.'),
  reverse_lunge: bw('Ausfallschritt rückwärts', [10, 15], 'Wdh', 'Wdh. pro Bein. Großer Schritt nach hinten, Oberkörper aufrecht.'),
  lateral_lunge: bw('Seitlicher Ausfallschritt', [10, 15], 'Wdh', 'Wdh. pro Seite. Großer Schritt zur Seite, Po nach hinten, anderes Bein gestreckt.'),
  jump_lunge:    bw('Sprung-Ausfallschritt', [8, 12], 'Wdh', 'Wdh. pro Bein. Im Sprung die Beine wechseln, weich landen.'),
  glute_bridge:  bw('Glute Bridge (Becken heben)', [15, 25], 'Wdh', 'Rückenlage, Füße nah am Po, Becken hochdrücken und oben Po fest anspannen.'),
  bridge_sl:     bw('Glute Bridge einbeinig', [10, 15], 'Wdh', 'Wdh. pro Bein. Ein Bein gestreckt in der Luft, Becken bleibt gerade.'),
  bridge_sl_hold:bw('Glute Bridge einbeinig mit 3 Sek. Halten', [8, 12], 'Wdh', 'Wdh. pro Bein. Oben 3 Sek. halten und Po maximal anspannen.'),
  sl_rdl:        bw('Einbeiniges Kreuzheben', [10, 15], 'Wdh', 'Wdh. pro Bein. Auf einem Bein, Oberkörper nach vorne, anderes Bein streckt nach hinten. Langsam!'),
  good_morning:  bw('Good Morning (Körpergewicht)', [15, 20], 'Wdh', 'Hände am Kopf, Hüfte nach hinten schieben, Rücken gerade.'),
  calf_bw:       bw('Wadenheben einbeinig', [12, 20], 'Wdh', 'Wdh. pro Bein. Langsam ganz hoch auf die Zehen, oben 1 Sek. halten.'),
  // Drücken
  pushup_knee:   bw('Liegestütze auf Knien', [8, 20], 'Wdh', 'Knie auf der Matte, Körper von Knie bis Kopf gerade, Brust bis kurz über den Boden.'),
  pushup:        bw('Liegestütze', [8, 20], 'Wdh', 'Hände etwas breiter als schulterbreit, Körper bretthart, Ellbogen ca. 45° vom Körper.'),
  pushup_tempo:  bw('Liegestütze langsam (3 Sek. runter)', [6, 15], 'Wdh', '3 Sek. absenken, 1 Sek. Pause, dann hochdrücken.'),
  pushup_diamond:bw('Diamant-Liegestütze', [6, 15], 'Wdh', 'Hände eng unter der Brust (Daumen und Zeigefinger bilden ein Dreieck) – mehr Trizeps.'),
  pike_pushup:   bw('Pike Push-up (Schulter-Liegestütz)', [6, 12], 'Wdh', 'Po hoch (umgedrehtes V), Kopf Richtung Boden zwischen die Hände senken.'),
  shoulder_taps: bw('Schulter-Taps im Liegestütz', [16, 30], 'Wdh', 'Im hohen Liegestütz abwechselnd die gegenüberliegende Schulter antippen, Hüfte ruhig.'),
  sphinx:        bw('Sphinx-Liegestütz (Trizeps)', [8, 15], 'Wdh', 'Aus dem Unterarmstütz auf die Hände hochdrücken und zurück – Trizeps brennt!'),
  // Ziehen / Rücken (in Bauchlage)
  superman_pull: bw('Superman-Latzug (Bauchlage)', [12, 20], 'Wdh', 'Bauchlage, Arme und Brust leicht anheben, Ellbogen zur Hüfte ziehen wie beim Latzug.'),
  ytw:           bw('Y-T-W-Heben (Bauchlage)', [8, 12], 'Wdh', 'Arme als Y, T und W anheben = 1 Wdh. Daumen nach oben, Schulterblätter zusammen.'),
  snow_angel:    bw('Reverse Snow Angels (Bauchlage)', [10, 15], 'Wdh', 'Arme knapp über dem Boden von den Hüften in einem Bogen über den Kopf führen.'),
  // Rumpf
  plank:         bw('Unterarmstütz (Plank)', [30, 60], 'Sek', 'Unterarme unter den Schultern, Körper gerade, Po und Bauch fest anspannen.'),
  side_plank:    bw('Seitstütz', [20, 45], 'Sek', 'Sekunden pro Seite. Unterarm unter der Schulter, Hüfte hoch, Körper in einer Linie.'),
  dead_bug:      bw('Dead Bug', [10, 16], 'Wdh', 'Rückenlage, unterer Rücken bleibt am Boden, gegengleich Arm und Bein strecken.'),
  hollow_hold:   bw('Hollow Hold', [20, 40], 'Sek', 'Rückenlage, Schultern und Beine leicht anheben, unterer Rücken fest auf der Matte.'),
  bird_dog:      bw('Bird Dog (Vierfüßlerstand)', [10, 16], 'Wdh', 'Gegengleich Arm und Bein strecken, 2 Sek. halten, Rücken bleibt gerade.'),
});

Object.assign(WORKOUTS, {
  HA: {
    name: 'Zuhause A', home: true,
    focus: 'Kraft & Mobilität · Beine, Brust, Rücken, Po, Schultern, Rumpf',
    slots: [
      { id: 'HA1', label: 'Beine – Kniebeuge', ladder: true, mobility: { id: 'deep_squat', dose: '30 Sek. halten' }, options: ['squat_bw', 'squat_pause', 'split_squat', 'jump_squat'] },
      { id: 'HA2', label: 'Brust – Liegestütze', ladder: true, mobility: { id: 't_spine', dose: '5 je Seite' }, options: ['pushup_knee', 'pushup', 'pushup_tempo', 'pushup_diamond'] },
      { id: 'HA3', label: 'Rücken (Bauchlage)', mobility: { id: 'childs_pose', dose: '30 Sek.' }, options: ['superman_pull', 'ytw', 'snow_angel'] },
      { id: 'HA4', label: 'Po', ladder: true, mobility: { id: 'hip_flexor', dose: '30 Sek. je Seite' }, options: ['glute_bridge', 'bridge_sl', 'bridge_sl_hold'] },
      { id: 'HA5', label: 'Schultern', mobility: { id: 'down_dog', dose: '30 Sek.' }, options: ['pike_pushup', 'shoulder_taps'] },
      { id: 'HA6', label: 'Rumpf', mobility: { id: 'cat_cow', dose: '8 ×' }, options: ['plank', 'dead_bug', 'hollow_hold'] },
    ],
  },
  HB: {
    name: 'Zuhause B', home: true,
    focus: 'Kraft & Mobilität · Beine einbeinig, Brust, Rücken, Beinbeuger, Rumpf',
    slots: [
      { id: 'HB1', label: 'Beine – Ausfallschritte', ladder: true, mobility: { id: 'ankle_rock', dose: '10 je Seite' }, options: ['reverse_lunge', 'split_squat', 'jump_lunge'] },
      { id: 'HB2', label: 'Brust/Trizeps – Liegestütze', ladder: true, mobility: { id: 'cobra', dose: '5 × 3 Sek.' }, options: ['pushup_knee', 'pushup', 'pushup_diamond'] },
      { id: 'HB3', label: 'Rücken (Bauchlage)', mobility: { id: 't_spine', dose: '5 je Seite' }, options: ['ytw', 'snow_angel', 'superman_pull'] },
      { id: 'HB4', label: 'Beinbeuger & Po', ladder: true, mobility: { id: 'fwd_fold', dose: '30 Sek.' }, options: ['good_morning', 'sl_rdl'] },
      { id: 'HB5', label: 'Beine seitlich / Waden', mobility: { id: 'hip_9090', dose: '8 Wechsel' }, options: ['lateral_lunge', 'calf_bw'] },
      { id: 'HB6', label: 'Rumpf', mobility: { id: 'pigeon', dose: '30 Sek. je Seite' }, options: ['side_plank', 'bird_dog', 'sphinx'] },
    ],
  },
});

Object.assign(FIT_EX, {
  jumping_jack: { name: 'Hampelmann', type: 'bw', tip: 'Locker auf den Fußballen, Arme über den Kopf.' },
  mountain_climber: { name: 'Mountain Climber', type: 'bw', tip: 'Hoher Liegestütz, Knie abwechselnd schnell zur Brust ziehen, Hüfte tief.' },
  burpee: { name: 'Burpee', type: 'bw', tip: 'Hocke – Füße nach hinten in den Liegestütz – zurück in die Hocke – hochspringen. Leichter: ohne Sprung und Schritt für Schritt.' },
  squat_fit: { name: 'Kniebeuge', type: 'bw', tip: 'Zügig, aber sauber.' },
  pushup_fit: { name: 'Liegestütze (oder auf Knien)', type: 'bw', tip: 'Körper gerade halten, bei Bedarf auf die Knie.' },
  jump_squat_fit: { name: 'Sprung-Kniebeuge', type: 'bw', tip: 'Explosiv hoch, weich landen.' },
  plank_fit: { name: 'Unterarmstütz', type: 'bw', tip: 'Körper gerade, Bauch fest.' },
  lunge_fit: { name: 'Ausfallschritt rückwärts', type: 'bw', tip: 'Abwechselnd links und rechts.' },
});

// Fitness-Block zuhause (ca. 12–15 Min.) – nur Körpergewicht
// Mobilitäts-Übungen (Matte, ohne Hilfsmittel)
Object.assign(FIT_EX, {
  cat_cow:     { name: 'Katze-Kuh', type: 'mob', tip: 'Langsam im Atemrhythmus: ausatmen = Rücken rund, einatmen = Brust nach vorne.' },
  wgs:         { name: "World's Greatest Stretch", type: 'mob', tip: 'Tiefer Ausfallschritt, Hand innen neben den Fuß, dann den anderen Arm zur Decke drehen.' },
  hip_flexor:  { name: 'Hüftbeuger-Dehnung kniend', type: 'mob', tip: 'Hinteres Knie auf der Matte, Po anspannen und Hüfte nach vorne schieben.' },
  t_spine:     { name: 'Thread the Needle (Brustwirbelsäule)', type: 'mob', tip: 'Vierfüßlerstand, einen Arm zur Decke aufdrehen, dann unter dem Körper durchfädeln.' },
  down_dog:    { name: 'Herabschauender Hund', type: 'mob', tip: 'Po hoch, Rücken lang, Fersen abwechselnd Richtung Boden drücken.' },
  childs_pose: { name: 'Kindhaltung', type: 'mob', tip: 'Po zu den Fersen, Arme lang nach vorne, ruhig in den Rücken atmen.' },
  deep_squat:  { name: 'Tiefe Hocke halten', type: 'mob', tip: 'So tief wie möglich, Fersen am Boden, Ellbogen schieben die Knie sanft nach außen.' },
  fwd_fold:    { name: 'Vorbeuge im Sitzen', type: 'mob', tip: 'Beine gestreckt, mit langem Rücken aus der Hüfte nach vorne neigen.' },
  cobra:       { name: 'Kobra', type: 'mob', tip: 'Bauchlage, Hände unter den Schultern, Brust sanft anheben, Becken bleibt am Boden.' },
  pigeon:      { name: 'Taube (Hüftöffner)', type: 'mob', tip: 'Vorderes Bein angewinkelt vor dem Körper, hinteres Bein lang, Oberkörper sinkt nach vorne.' },
  arm_circles: { name: 'Große Armkreise', type: 'mob', tip: 'Gestreckte Arme, große langsame Kreise vor und zurück.' },
  hip_9090:    { name: '90/90 Hüftwechsel', type: 'mob', tip: 'Im Sitzen beide Knie 90° gebeugt, Knie langsam von einer Seite zur anderen kippen.' },
  ankle_rock:  { name: 'Sprunggelenk-Mobilisation', type: 'mob', tip: 'Halber Kniestand, vorderes Knie langsam über die Zehen schieben, Ferse bleibt unten.' },
});

// Zuhause = Kraft & Mobilität: Abschluss mit Mobilitäts-Flow (ca. 15 Min., wechselt jedes Mal)
const MOBILITY_HOME = [
  { id: 'm_hips', kind: 'Mobilität', name: 'Hüft-Flow', value: 'Minuten', minutes: 15,
    detail: '2 Durchgänge, ruhig atmen, nichts erzwingen – Dehnung ja, Schmerz nein.',
    items: [{ id: 'hip_9090', dose: '1 Min.' }, { id: 'hip_flexor', dose: '45 Sek. je Seite' }, { id: 'pigeon', dose: '45 Sek. je Seite' }, { id: 'deep_squat', dose: '1 Min.' }] },
  { id: 'm_spine', kind: 'Mobilität', name: 'Rücken & Schultern', value: 'Minuten', minutes: 15,
    detail: '2 Durchgänge, langsam und kontrolliert.',
    items: [{ id: 'cat_cow', dose: '1 Min.' }, { id: 't_spine', dose: '6 je Seite' }, { id: 'arm_circles', dose: '10 vor / 10 zurück' }, { id: 'cobra', dose: '5 × 5 Sek.' }, { id: 'childs_pose', dose: '1 Min.' }] },
  { id: 'm_yoga', kind: 'Mobilität', name: 'Yoga-Flow', value: 'Runden', minutes: 15,
    detail: '4–5 Runden fließend hintereinander, jede Position 3 tiefe Atemzüge.',
    items: [{ id: 'down_dog', dose: '3 Atemzüge' }, { id: 'wgs', dose: '3 Atemzüge je Seite' }, { id: 'cobra', dose: '3 Atemzüge' }, { id: 'childs_pose', dose: '3 Atemzüge' }] },
  { id: 'm_legs', kind: 'Mobilität', name: 'Beine & Rückseite', value: 'Minuten', minutes: 15,
    detail: '2 Durchgänge, Dehnungen sanft halten.',
    items: [{ id: 'ankle_rock', dose: '10 je Seite' }, { id: 'fwd_fold', dose: '1 Min.' }, { id: 'hip_flexor', dose: '45 Sek. je Seite' }, { id: 'down_dog', dose: '45 Sek.' }] },
];

// ältere Zuhause-Fitnessblöcke (nur für Verlaufseinträge)
const FITNESS_HOME = [
  { id: 'h_circuit', kind: 'Zirkel', name: 'Körpergewicht-Zirkel', value: 'Runden',
    detail: '4 Runden: je 40 Sek. Arbeit, 20 Sek. Pause. Nach jeder Runde 1 Min. Pause.',
    items: [{ id: 'jump_squat_fit', dose: '40 Sek.' }, { id: 'pushup_fit', dose: '40 Sek.' }, { id: 'mountain_climber', dose: '40 Sek.' }, { id: 'burpee', dose: '40 Sek.' }] },
  { id: 'h_tabata', kind: 'Intervalle', name: 'Tabata zuhause', value: 'Wdh. gesamt',
    detail: '3 Blöcke à 4 Min.: 8 × (20 Sek. Vollgas / 10 Sek. Pause), 1 Min. Pause zwischen den Blöcken.',
    items: [{ id: 'jumping_jack', dose: 'Block 1' }, { id: 'mountain_climber', dose: 'Block 2' }, { id: 'squat_fit', dose: 'Block 3' }] },
  { id: 'h_emom', kind: 'Intervalle', name: 'EMOM 15 Minuten', value: 'Runden geschafft',
    detail: 'Jede volle Minute neu starten, die 3 Übungen im Wechsel. Rest der Minute = Pause.',
    items: [{ id: 'burpee', dose: '8 Wdh.' }, { id: 'squat_fit', dose: '20 Wdh.' }, { id: 'mountain_climber', dose: '30 Wdh.' }] },
  { id: 'h_ladder', kind: 'Leiter', name: 'Burpee-Kniebeuge-Leiter', value: 'Stufe erreicht',
    detail: '1 Burpee + 2 Kniebeugen, dann 2 + 4, dann 3 + 6 … so weit du in 12 Min. kommst.',
    items: [{ id: 'burpee', dose: '1, 2, 3 …' }, { id: 'squat_fit', dose: '2, 4, 6 …' }] },
  { id: 'h_core', kind: 'Rumpf-Zirkel', name: 'Rumpf & Kondition', value: 'Runden',
    detail: '3–4 Runden: je 45 Sek. Arbeit, 15 Sek. Pause.',
    items: [{ id: 'plank_fit', dose: '45 Sek.' }, { id: 'jumping_jack', dose: '45 Sek.' }, { id: 'lunge_fit', dose: '45 Sek.' }, { id: 'mountain_climber', dose: '45 Sek.' }] },
];

// Mobilitäts-Warm-up zuhause (ca. 8 Min.)
const WARMUP_HOME = [
  { id: 'jumping_jack', dose: '1 Min. locker' },
  { id: 'cat_cow', dose: '8 ×' },
  { id: 'wgs', dose: '5 je Seite' },
  { id: 'hip_9090', dose: '8 Wechsel' },
  { id: 'arm_circles', dose: '10 vor / 10 zurück' },
  { id: 'squat_fit', dose: '10 langsam' },
];
