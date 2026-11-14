# Gym Plan – Ganzkörper-Trainings-App fürs iPhone

Web-App (PWA) für 2× Ganzkörpertraining pro Woche (~60 Min.), abgestimmt auf McFit-Geräte – Freihanteln (Lang-/Kurzhantel, SZ-Stange), geführte Maschinen und Kabelzug.
Läuft im Safari, lässt sich auf den Home-Bildschirm legen und funktioniert offline.

## Trainingsprinzipien
Inspiriert von evidenzbasierten Coaches (Jeff Nippard, Brad Schoenfeld, Mike Israetel):
jeder Muskel 2× pro Woche, ca. 6–10 harte Sätze pro Muskel und Woche, Sätze nahe am Muskelversagen,
Übungen mit Dehnung unter Last (Beinbeuger sitzend, Trizeps über Kopf, Schrägbank-Curls, RDL),
längere Pausen bei Grundübungen und ein optionaler Cardio-Finisher.

## Funktionen
- **Zwei Pläne A/B** im Wechsel – Ganzkörper, aber unterschiedliche Bewegungsmuster und Übungen
- **Satz-Tracking** mit Gewicht/Wiederholungen, Pausen-Timer (mit Ton), Technik-Tipps
- **Automatische Progression** (doppelte Progression): alle Sätze am oberen Ende des Wdh.-Bereichs → Gewicht rauf; zweimal unter dem Bereich → 10 % Deload
- **Jede Woche Abwechslung**: Ergänzungsübungen wechseln wöchentlich, Grundübungen versetzt alle 4 Wochen (einstellbar); Gewichte bleiben je Übung gespeichert
- **Plateau-Erkennung** und Übungstausch (nur heute oder bis zum nächsten Wechsel, z. B. wenn ein Gerät besetzt ist)
- **Fortschritt**: Diagramme (geschätztes 1RM), Sätze pro Woche, Körpergewicht, Bestleistungen
- **Übungen ausblenden**, die du nicht magst oder die dein Studio nicht hat (Plan → Varianten)
- **Cardio-Finisher** (optional, ~10 Min.) und Aufwärmsätze für die erste Übung
- **Backup** als JSON exportieren/importieren (Daten liegen lokal auf dem iPhone)

## Aufs iPhone bringen
1. Repository auf GitHub → **Settings → Pages** → Source: *Deploy from a branch*, Branch `main` / `(root)` → Save.
2. Nach ~1 Min. die angezeigte URL (`https://<user>.github.io/<repo>/`) in **Safari** öffnen.
3. **Teilen → „Zum Home-Bildschirm“**.

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

## Anpassen
Übungen, Wiederholungsbereiche und Steigerungen stehen in `data.js`.
Nach Änderungen in `sw.js` die `CACHE`-Version erhöhen, damit das iPhone das Update lädt.
