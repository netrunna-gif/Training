// Übungsbibliothek – ausgelegt auf typische McFit-Ausstattung
// (Freihantelbereich, Kabelzüge, Gym80/Maschinen, Beinpresse, Multipresse).
//
// reps: Wiederholungsbereich [min, max] für die doppelte Progression
// inc:  Gewichtssprung in kg, wenn alle Sätze das obere Ende erreichen (0 = nur Wdh./Zeit steigern)
// start: Vorschlag für das erste Training (kg) – wird beim ersten Mal ohnehin von dir angepasst
// unit: 'Wdh' oder 'Sek'

const EXERCISES = {
  // ---------- Beine: Kniebeuge-Muster ----------
  legpress:   { name: 'Beinpresse', sets: 3, reps: [8, 12], inc: 5, start: 60, unit: 'Wdh',
                tip: 'Füße schulterbreit, Knie folgen den Zehen. Unten nicht mit dem Becken abrollen.' },
  squat_smith:{ name: 'Kniebeuge (Multipresse)', sets: 3, reps: [6, 10], inc: 2.5, start: 30, unit: 'Wdh',
                tip: 'Füße leicht vor der Stange, mindestens bis Oberschenkel parallel. Rumpf fest.' },
  goblet:     { name: 'Goblet Squat (Kurzhantel)', sets: 3, reps: [10, 15], inc: 2, start: 14, unit: 'Wdh',
                tip: 'Hantel vor der Brust, Ellbogen zwischen die Knie, aufrechter Oberkörper.' },
  squat_bb:   { name: 'Kniebeuge (Langhantel)', sets: 3, reps: [6, 10], inc: 2.5, start: 30, unit: 'Wdh',
                tip: 'Stange auf dem oberen Trapez, Bauch anspannen, Knie nach außen drücken.' },

  // ---------- Beine: Hüftstreckung ----------
  rdl_bb:     { name: 'Rumänisches Kreuzheben (Langhantel)', sets: 3, reps: [8, 12], inc: 2.5, start: 30, unit: 'Wdh',
                tip: 'Knie leicht gebeugt, Hüfte nach hinten schieben, Stange nah am Bein. Rücken gerade!' },
  rdl_db:     { name: 'Rumänisches Kreuzheben (Kurzhantel)', sets: 3, reps: [10, 12], inc: 2, start: 14, unit: 'Wdh',
                tip: 'Wie mit der Langhantel – Hanteln an den Oberschenkeln entlang führen.' },
  hipthrust:  { name: 'Hip Thrust (Langhantel/Maschine)', sets: 3, reps: [8, 12], inc: 5, start: 40, unit: 'Wdh',
                tip: 'Schulterblätter auf der Bank, oben Po fest anspannen, Kinn zur Brust.' },
  deadlift:   { name: 'Kreuzheben (Langhantel)', sets: 3, reps: [5, 8], inc: 5, start: 40, unit: 'Wdh',
                tip: 'Stange über Mittelfuß, Brust raus, Rücken neutral. Mit den Beinen wegdrücken.' },

  // ---------- Beine: einbeinig / Quadrizeps ----------
  lunge_db:   { name: 'Ausfallschritte (Kurzhantel)', sets: 3, reps: [8, 12], inc: 2, start: 8, unit: 'Wdh',
                tip: 'Wdh. pro Bein. Großer Schritt, hinteres Knie Richtung Boden.' },
  bulgarian:  { name: 'Bulgarian Split Squat', sets: 3, reps: [8, 12], inc: 2, start: 6, unit: 'Wdh',
                tip: 'Wdh. pro Bein. Hinterer Fuß auf der Bank, Gewicht auf dem vorderen Bein.' },
  legext:     { name: 'Beinstrecker (Maschine)', sets: 3, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                tip: 'Oben 1 Sek. halten, langsam ablassen.' },

  // ---------- Beinbeuger ----------
  legcurl_ly: { name: 'Beinbeuger liegend (Maschine)', sets: 3, reps: [10, 15], inc: 5, start: 25, unit: 'Wdh',
                tip: 'Hüfte auf das Polster drücken, kontrolliert ablassen.' },
  legcurl_sit:{ name: 'Beinbeuger sitzend (Maschine)', sets: 3, reps: [10, 15], inc: 5, start: 30, unit: 'Wdh',
                tip: 'Oberschenkelpolster fest, volle Bewegung ausnutzen.' },

  // ---------- Brust / horizontales Drücken ----------
  bench_bb:   { name: 'Bankdrücken (Langhantel)', sets: 3, reps: [6, 10], inc: 2.5, start: 30, unit: 'Wdh',
                tip: 'Schulterblätter zusammen, Füße fest am Boden, Stange zur unteren Brust.' },
  incline_db: { name: 'Schrägbankdrücken (Kurzhantel)', sets: 3, reps: [8, 12], inc: 2, start: 14, unit: 'Wdh',
                tip: 'Bank ca. 30°, Ellbogen ca. 45° vom Körper.' },
  chestpress: { name: 'Brustpresse (Maschine)', sets: 3, reps: [8, 12], inc: 5, start: 30, unit: 'Wdh',
                tip: 'Griffe auf Brusthöhe, Schultern unten lassen.' },
  bench_db:   { name: 'Bankdrücken (Kurzhantel)', sets: 3, reps: [8, 12], inc: 2, start: 16, unit: 'Wdh',
                tip: 'Hanteln unten auf Brusthöhe, oben nicht zusammenschlagen.' },

  // ---------- Rücken / vertikales Ziehen ----------
  latpull:    { name: 'Latzug breit', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                tip: 'Zur oberen Brust ziehen, Brust raus, nicht mit Schwung arbeiten.' },
  latpull_cg: { name: 'Latzug eng (Untergriff/V-Griff)', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                tip: 'Ellbogen nah am Körper nach unten ziehen.' },
  pullup_ass: { name: 'Klimmzug (assistiert)', sets: 3, reps: [6, 10], inc: -5, start: 40, unit: 'Wdh',
                tip: 'Gewicht = Unterstützung. Weniger kg ist schwerer – die App senkt es automatisch.' },

  // ---------- Rücken / horizontales Ziehen ----------
  row_cable:  { name: 'Rudern am Kabel sitzend', sets: 3, reps: [8, 12], inc: 5, start: 35, unit: 'Wdh',
                tip: 'Aufrecht sitzen, Schulterblätter zuerst zusammenziehen.' },
  row_db:     { name: 'Rudern einarmig (Kurzhantel)', sets: 3, reps: [8, 12], inc: 2, start: 16, unit: 'Wdh',
                tip: 'Wdh. pro Seite. Hand und Knie auf der Bank, Hantel zur Hüfte ziehen.' },
  row_machine:{ name: 'Rudern (Maschine / T-Bar)', sets: 3, reps: [8, 12], inc: 5, start: 30, unit: 'Wdh',
                tip: 'Brust ans Polster, Ellbogen nach hinten führen.' },

  // ---------- Schultern ----------
  ohp_db:     { name: 'Schulterdrücken (Kurzhantel)', sets: 3, reps: [8, 12], inc: 2, start: 10, unit: 'Wdh',
                tip: 'Sitzend mit Lehne, Hanteln bis Ohrhöhe absenken.' },
  shoulderpress:{ name: 'Schulterpresse (Maschine)', sets: 3, reps: [8, 12], inc: 5, start: 20, unit: 'Wdh',
                tip: 'Rücken an die Lehne, Griffe auf Schulterhöhe starten.' },
  ohp_bb:     { name: 'Schulterdrücken stehend (Langhantel)', sets: 3, reps: [6, 10], inc: 2.5, start: 20, unit: 'Wdh',
                tip: 'Po und Bauch anspannen, Stange in gerader Linie über den Kopf.' },
  reverse_fly:{ name: 'Reverse Butterfly (Maschine)', sets: 3, reps: [12, 15], inc: 5, start: 20, unit: 'Wdh',
                tip: 'Brust ans Polster, Arme fast gestreckt nach hinten führen.' },
  lateral_db: { name: 'Seitheben (Kurzhantel)', sets: 3, reps: [12, 15], inc: 1, start: 6, unit: 'Wdh',
                tip: 'Leicht vorgebeugt, bis Schulterhöhe, kein Schwung.' },
  lateral_cable:{ name: 'Seitheben am Kabel', sets: 3, reps: [12, 15], inc: 2.5, start: 5, unit: 'Wdh',
                tip: 'Einarmig, Kabel hinter dem Körper führen.' },
  facepull:   { name: 'Face Pulls (Kabel)', sets: 3, reps: [12, 15], inc: 2.5, start: 15, unit: 'Wdh',
                tip: 'Seil zur Stirn ziehen, Ellbogen hoch – gut für die Schultergesundheit.' },

  // ---------- Arme ----------
  curl_db:    { name: 'Bizeps-Curls (Kurzhantel)', sets: 2, reps: [10, 12], inc: 1, start: 10, unit: 'Wdh',
                tip: 'Ellbogen bleiben am Körper.' },
  curl_cable: { name: 'Bizeps-Curls am Kabel', sets: 2, reps: [10, 15], inc: 2.5, start: 15, unit: 'Wdh',
                tip: 'Gerade Stange oder Seil, oben kurz anspannen.' },
  hammer:     { name: 'Hammer-Curls (Kurzhantel)', sets: 2, reps: [10, 12], inc: 1, start: 10, unit: 'Wdh',
                tip: 'Neutraler Griff, Daumen zeigen nach oben.' },
  pushdown:   { name: 'Trizepsdrücken am Kabel', sets: 2, reps: [10, 15], inc: 2.5, start: 20, unit: 'Wdh',
                tip: 'Ellbogen fixiert, unten komplett strecken.' },
  overhead_tri:{ name: 'Trizeps Überkopf (Kabel/Seil)', sets: 2, reps: [10, 15], inc: 2.5, start: 15, unit: 'Wdh',
                tip: 'Mit dem Rücken zum Kabel, Ellbogen zeigen nach vorne-oben.' },
  dips_ass:   { name: 'Dips (assistiert)', sets: 2, reps: [8, 12], inc: -5, start: 40, unit: 'Wdh',
                tip: 'Gewicht = Unterstützung. Weniger kg ist schwerer.' },

  // ---------- Rumpf / Sonstiges ----------
  plank:      { name: 'Plank', sets: 3, reps: [30, 60], inc: 0, start: 0, unit: 'Sek',
                tip: 'Körper in einer Linie, Po und Bauch anspannen. Gewicht = optional Zusatzlast.' },
  crunch_m:   { name: 'Bauchmaschine / Kabel-Crunch', sets: 3, reps: [10, 15], inc: 5, start: 20, unit: 'Wdh',
                tip: 'Wirbelsäule einrollen, nicht aus der Hüfte ziehen.' },
  kneeraise:  { name: 'Knieheben hängend / am Gerät', sets: 3, reps: [10, 15], inc: 0, start: 0, unit: 'Wdh',
                tip: 'Becken einrollen, langsam ablassen.' },
  backext:    { name: 'Rückenstrecker (Hyperextension)', sets: 3, reps: [12, 15], inc: 2.5, start: 0, unit: 'Wdh',
                tip: 'Bis zur geraden Linie hochkommen, nicht überstrecken.' },
  calf:       { name: 'Wadenheben (Maschine/Beinpresse)', sets: 3, reps: [12, 15], inc: 5, start: 40, unit: 'Wdh',
                tip: 'Unten dehnen, oben 1 Sek. halten.' },
};

// Zwei Ganzkörper-Einheiten mit unterschiedlichen Bewegungsmustern.
// Jeder "Slot" ist ein Bewegungsmuster mit mehreren Varianten.
// every: nach wie vielen Blöcken die Variante gewechselt wird
//        (Grundübungen länger behalten = bessere Progression, Zubehör öfter wechseln = Abwechslung)
const WORKOUTS = {
  A: {
    name: 'Ganzkörper A',
    focus: 'Kniebeuge · Bankdrücken · Latzug',
    slots: [
      { id: 'A1', label: 'Beine – Kniebeuge', every: 2, options: ['legpress', 'squat_smith', 'goblet', 'squat_bb'] },
      { id: 'A2', label: 'Brust – Drücken',   every: 2, options: ['chestpress', 'bench_bb', 'incline_db', 'bench_db'] },
      { id: 'A3', label: 'Rücken – Ziehen vertikal', every: 2, options: ['latpull', 'latpull_cg', 'pullup_ass'] },
      { id: 'A4', label: 'Beinbeuger',        every: 1, options: ['legcurl_ly', 'legcurl_sit'] },
      { id: 'A5', label: 'Schultern seitlich', every: 1, options: ['lateral_db', 'lateral_cable'] },
      { id: 'A6', label: 'Trizeps',           every: 1, options: ['pushdown', 'overhead_tri', 'dips_ass'] },
      { id: 'A7', label: 'Bauch',             every: 1, options: ['plank', 'crunch_m', 'kneeraise'] },
    ],
  },
  B: {
    name: 'Ganzkörper B',
    focus: 'Hüftstreckung · Schulterdrücken · Rudern',
    slots: [
      { id: 'B1', label: 'Beine – Hüftstreckung', every: 2, options: ['rdl_bb', 'hipthrust', 'rdl_db', 'deadlift'] },
      { id: 'B2', label: 'Schultern – Drücken', every: 2, options: ['shoulderpress', 'ohp_db', 'ohp_bb'] },
      { id: 'B3', label: 'Rücken – Rudern',   every: 2, options: ['row_cable', 'row_db', 'row_machine'] },
      { id: 'B4', label: 'Beine – einbeinig/Quad', every: 1, options: ['lunge_db', 'legext', 'bulgarian'] },
      { id: 'B5', label: 'Hintere Schulter',  every: 1, options: ['facepull', 'reverse_fly'] },
      { id: 'B6', label: 'Bizeps',            every: 1, options: ['curl_db', 'curl_cable', 'hammer'] },
      { id: 'B7', label: 'Waden / unterer Rücken', every: 1, options: ['calf', 'backext'] },
    ],
  },
};
