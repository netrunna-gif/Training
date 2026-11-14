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
  legext:      { name: 'Beinstrecker (Maschine)', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Oben 1 Sek. halten, langsam ablassen.' },
  lunge_db:    { name: 'Ausfallschritte (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 8, unit: 'Wdh',
                 tip: 'Wdh. pro Bein. Großer Schritt, hinteres Knie Richtung Boden.' },
  bulgarian:   { name: 'Bulgarian Split Squat (Kurzhantel)', type: 'free', sets: 3, reps: [8, 12], inc: 2, start: 6, unit: 'Wdh',
                 tip: 'Wdh. pro Bein. Hinterer Fuß auf der Bank, Gewicht auf dem vorderen Bein.' },

  // ---------- Beinbeuger ----------
  legcurl_ly:  { name: 'Beinbeuger liegend (Maschine)', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 25, unit: 'Wdh',
                 tip: 'Hüfte auf das Polster drücken, kontrolliert ablassen.' },
  legcurl_sit: { name: 'Beinbeuger sitzend (Maschine)', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Oberschenkelpolster fest, volle Bewegung ausnutzen.' },

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
  lateral_db:  { name: 'Seitheben (Kurzhantel)', type: 'free', sets: 3, reps: [12, 15], inc: 1, start: 6, unit: 'Wdh',
                 tip: 'Leicht vorgebeugt, bis Schulterhöhe, kein Schwung.' },
  lateral_m:   { name: 'Seitheben-Maschine', type: 'machine', sets: 3, reps: [12, 15], inc: 5, start: 15, unit: 'Wdh',
                 tip: 'Schulter auf Höhe der Drehachse, Ellbogen führen die Bewegung.' },
  reverse_fly: { name: 'Reverse Butterfly (Maschine)', type: 'machine', sets: 3, reps: [12, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Brust ans Polster, Arme fast gestreckt nach hinten führen.' },
  rear_db:     { name: 'Vorgebeugtes Seitheben (Kurzhantel)', type: 'free', sets: 3, reps: [12, 15], inc: 1, start: 5, unit: 'Wdh',
                 tip: 'Oberkörper fast waagerecht, Arme seitlich anheben, Schulterblätter nicht hochziehen.' },

  // ---------- Arme ----------
  curl_db:     { name: 'Bizeps-Curls (Kurzhantel)', type: 'free', sets: 2, reps: [10, 12], inc: 1, start: 10, unit: 'Wdh',
                 tip: 'Ellbogen bleiben am Körper.' },
  curl_sz:     { name: 'Bizeps-Curls (SZ-Stange)', type: 'free', sets: 2, reps: [8, 12], inc: 2.5, start: 15, unit: 'Wdh',
                 tip: 'Ellbogen fixiert, ohne Schwung aus dem Rücken.' },
  curl_m:      { name: 'Bizepsmaschine', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 15, unit: 'Wdh',
                 tip: 'Oberarme flach auf dem Polster, unten fast komplett strecken.' },
  hammer:      { name: 'Hammer-Curls (Kurzhantel)', type: 'free', sets: 2, reps: [10, 12], inc: 1, start: 10, unit: 'Wdh',
                 tip: 'Neutraler Griff, Daumen zeigen nach oben.' },
  tri_m:       { name: 'Trizepsmaschine / Dip-Maschine', type: 'machine', sets: 2, reps: [10, 15], inc: 5, start: 25, unit: 'Wdh',
                 tip: 'Ellbogen nah am Körper, unten komplett strecken.' },
  skull_sz:    { name: 'French Press (SZ-Stange)', type: 'free', sets: 2, reps: [8, 12], inc: 2.5, start: 10, unit: 'Wdh',
                 tip: 'Auf der Bank liegend, Stange Richtung Stirn absenken, Ellbogen zeigen nach oben.' },
  oh_tri_db:   { name: 'Trizeps Überkopf (Kurzhantel)', type: 'free', sets: 2, reps: [10, 12], inc: 2, start: 12, unit: 'Wdh',
                 tip: 'Sitzend, eine Hantel mit beiden Händen hinter dem Kopf absenken.' },

  // ---------- Rumpf / Waden ----------
  crunch_m:    { name: 'Bauchmaschine', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Wirbelsäule einrollen, nicht aus den Armen ziehen.' },
  torso_m:     { name: 'Rotationsmaschine (schräge Bauchmuskeln)', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Wdh. pro Seite. Langsam drehen, Hüfte bleibt fest.' },
  backext_m:   { name: 'Rückenstrecker-Maschine', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                 tip: 'Langsam aufrichten, nicht ins Hohlkreuz überstrecken.' },
  calf_m:      { name: 'Wadenmaschine stehend', type: 'machine', sets: 3, reps: [10, 15], inc: 5, start: 40, unit: 'Wdh',
                 tip: 'Unten dehnen, oben 1 Sek. halten.' },
  calf_seated: { name: 'Wadenmaschine sitzend', type: 'machine', sets: 3, reps: [12, 15], inc: 5, start: 20, unit: 'Wdh',
                 tip: 'Volle Bewegung, oben kurz halten.' },

  // ---------- Kabelzug ----------
  latpull:      { name: 'Latzug breit (Kabel)', type: 'cable', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                  tip: 'Zur oberen Brust ziehen, Brust raus, nicht mit Schwung arbeiten.' },
  latpull_cg:   { name: 'Latzug eng / Untergriff (Kabel)', type: 'cable', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                  tip: 'Ellbogen nah am Körper nach unten ziehen.' },
  row_cable:    { name: 'Rudern am Kabel sitzend', type: 'cable', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                  tip: 'Aufrecht sitzen, Schulterblätter zuerst zusammenziehen, nicht nach hinten lehnen.' },
  lateral_cable:{ name: 'Seitheben am Kabel', type: 'cable', sets: 3, reps: [12, 15], inc: 2.5, start: 5, unit: 'Wdh',
                  tip: 'Wdh. pro Seite. Einarmig, Kabel hinter dem Körper führen.' },
  facepull:     { name: 'Face Pulls (Kabel)', type: 'cable', sets: 3, reps: [12, 15], inc: 2.5, start: 15, unit: 'Wdh',
                  tip: 'Seil zur Stirn ziehen, Ellbogen hoch – gut für die Schultergesundheit.' },
  curl_cable:   { name: 'Bizeps-Curls am Kabel', type: 'cable', sets: 2, reps: [10, 15], inc: 2.5, start: 15, unit: 'Wdh',
                  tip: 'Gerade Stange oder Seil, Ellbogen fixiert, oben kurz anspannen.' },
  pushdown:     { name: 'Trizepsdrücken am Kabel', type: 'cable', sets: 2, reps: [10, 15], inc: 2.5, start: 20, unit: 'Wdh',
                  tip: 'Ellbogen am Körper fixiert, unten komplett strecken.' },
  overhead_tri: { name: 'Trizeps Überkopf (Kabel/Seil)', type: 'cable', sets: 2, reps: [10, 15], inc: 2.5, start: 15, unit: 'Wdh',
                  tip: 'Mit dem Rücken zum Kabel, Ellbogen zeigen nach vorne-oben.' },
  cable_crunch: { name: 'Kabel-Crunch (kniend)', type: 'cable', sets: 3, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                  tip: 'Seil neben dem Kopf, Wirbelsäule einrollen – die Hüfte bleibt still.' },
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
// main: true  = Grundübung, wechselt alle paar Wochen (Einstellung "Grundübungen wechseln alle …")
//               shift versetzt den Wechsel, damit nicht alle Grundübungen in derselben Woche wechseln
// main: false = Ergänzungsübung, wechselt jede Woche
const WORKOUTS = {
  A: {
    name: 'Ganzkörper A',
    focus: 'Kniebeuge · Brust · Latzug',
    slots: [
      { id: 'A1', label: 'Beine – Kniebeuge', main: true, shift: 0, options: ['legpress', 'squat_smith', 'hack_squat', 'goblet', 'squat_bb'] },
      { id: 'A2', label: 'Brust – Drücken',   main: true, shift: 2, options: ['chestpress', 'bench_bb', 'incline_db', 'bench_db', 'incline_smith'] },
      { id: 'A3', label: 'Rücken – Ziehen von oben', main: true, shift: 1, options: ['latpull_m', 'latpull', 'pullup_ass', 'latpull_cg', 'pullover_m'] },
      { id: 'A4', label: 'Beinbeuger',        options: ['legcurl_ly', 'legcurl_sit'] },
      { id: 'A5', label: 'Schultern seitlich', options: ['lateral_db', 'lateral_cable', 'lateral_m'] },
      { id: 'A6', label: 'Trizeps',           options: ['tri_m', 'pushdown', 'skull_sz', 'overhead_tri', 'oh_tri_db'] },
      { id: 'A7', label: 'Bauch',             options: ['crunch_m', 'cable_crunch', 'torso_m'] },
    ],
  },
  B: {
    name: 'Ganzkörper B',
    focus: 'Hüfte/Po · Schultern · Rudern',
    slots: [
      { id: 'B1', label: 'Beine – Hüftstreckung', main: true, shift: 1, options: ['rdl_bb', 'hipthrust', 'rdl_db', 'deadlift'] },
      { id: 'B2', label: 'Schultern – Drücken', main: true, shift: 3, options: ['shoulderpress', 'ohp_db', 'ohp_smith', 'ohp_bb'] },
      { id: 'B3', label: 'Rücken – Rudern',   main: true, shift: 0, options: ['row_machine', 'row_cable', 'row_db', 'tbar', 'row_bb'] },
      { id: 'B4', label: 'Beine – Oberschenkel vorne', options: ['legext', 'lunge_db', 'bulgarian'] },
      { id: 'B5', label: 'Hintere Schulter',  options: ['reverse_fly', 'facepull', 'rear_db'] },
      { id: 'B6', label: 'Bizeps',            options: ['curl_db', 'curl_cable', 'curl_m', 'curl_sz', 'hammer'] },
      { id: 'B7', label: 'Waden / unterer Rücken', options: ['calf_m', 'backext_m', 'calf_seated', 'pullthrough'] },
    ],
  },
};
