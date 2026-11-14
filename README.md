# Gym Plan – Ganzkörper-Trainings-App fürs iPhone

Web-App (PWA) für 2× Ganzkörpertraining pro Woche (~60 Min.), abgestimmt auf McFit-Geräte – Freihanteln (Lang-/Kurzhantel, SZ-Stange), geführte Maschinen und Kabelzug.
Läuft im Safari, lässt sich auf den Home-Bildschirm legen und funktioniert offline.

## Trainingsprinzipien
Muskelaufbau **und** Fitness in 2× 60 Min. pro Woche:
- **Aufwärmen** (5–7 Min.) mit Mobilität und leichten Hantel-/Kabelübungen
- **Kraft** (ca. 40 Min.): jeder Muskel 2× pro Woche, ca. 6–10 Sätze pro Muskel und Woche, 2–3 Wdh. Reserve
  (nicht bis zum Muskelversagen), Übungen mit Dehnung unter Last, inspiriert von Jeff Nippard, Brad Schoenfeld, Mike Israetel
- **Fitness** (ca. 12 Min.) ohne Cardio-Geräte im Wechsel: Kraftausdauer-Zirkel, EMOM, Tabata, Kurzhantel-Komplex, Tragen & Rumpf
- **Rumpfstabilität**: Pallof Press, Holzhacker, Farmer's Walk

## Funktionen
- **Zwei Pläne A/B** im Wechsel – Ganzkörper, aber unterschiedliche Bewegungsmuster und Übungen
- **Satz-Tracking** mit Gewicht/Wiederholungen, Pausen-Timer (mit Ton), Technik-Tipps
- **Automatische Progression** (doppelte Progression): alle Sätze am oberen Ende des Wdh.-Bereichs → Gewicht rauf; zweimal unter dem Bereich → 10 % Deload
- **Jede Woche Abwechslung**: Ergänzungsübungen wechseln wöchentlich, Grundübungen versetzt alle 4 Wochen (einstellbar); Gewichte bleiben je Übung gespeichert
- **Plateau-Erkennung** und Übungstausch (nur heute oder bis zum nächsten Wechsel, z. B. wenn ein Gerät besetzt ist)
- **Fortschritt**: Diagramme (geschätztes 1RM), Sätze pro Woche, Körpergewicht, Bestleistungen
- **Übungen ausblenden**, die du nicht magst oder die dein Studio nicht hat (Plan → Varianten)
- **Animierte Figuren und Anleitungen** zu jeder Übung, inkl. YouTube-Suche
- **Fitness-Block** mit Wert zum Steigern (Runden, Meter, Minuten)
- **Backup** als JSON exportieren/importieren (Daten liegen lokal auf dem iPhone)

## Aufs iPhone bringen
1. Repository auf GitHub → **Settings → Pages** → Source: *Deploy from a branch*, Branch `main` / `(root)` → Save.
2. Nach ~1 Min. die angezeigte URL (`https://<user>.github.io/<repo>/`) in **Safari** öffnen.
3. **Teilen → „Zum Home-Bildschirm“**.

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

## Anpassen
Übungen, Wiederholungsbereiche und Steigerungen stehen in `data.js`.
Nach Änderungen in `sw.js` die `CACHE`-Version erhöhen, damit das iPhone das Update lädt.
