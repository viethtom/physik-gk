# Physik GK — Interaktive Lernwebsite

Statische, interaktive Lernwebsite zum schulinternen Kernlehrplan Physik (Grundkurs, Qualifikationsphase
Q1/Q2, gymnasiale Oberstufe NRW). Reines HTML/CSS/JavaScript ohne Build-Schritt und ohne externe
Abhängigkeiten — direkt auf Netlify hostbar.

## Aktueller Stand (Phase 1 + 2)

Vollständig ausgebaut sind die Inhaltsfelder **Quantenobjekte** und **Strahlung und Materie**:

**Quantenobjekte** (Q1):
- 5 interaktive Simulationen (Größen einstellen → messen → Tabelle & Diagramm → geführte Auswertung):
  Beugung/Interferenz, Photoeffekt, Millikan-Versuch, Fadenstrahlrohr, Elektronenbeugung
- 1 Seite zur Wahrscheinlichkeitsdeutung (Quanten-Doppelspalt, ohne Formel-Herleitung, reflexiv)
- 18 gestufte Übungsaufgaben mit Lösungen (nur auf Klick sichtbar)

**Strahlung und Materie** (Q2):
- 5 interaktive Simulationen: Linienspektren (Balmer-Serie → Rydberg-Konstante), Franck-Hertz-Versuch,
  Röntgenstrahlung (Bremsspektrum → h), Radioaktiver Zerfall (→ Halbwertszeit), Absorption/Reichweite
  ionisierender Strahlung
- 1 Konzeptseite Standardmodell &amp; Kernphysik (interaktive Teilchentafel, Bindungsenergiekurve, ohne
  Realexperiment — lt. Lehrplan für diesen Bereich nicht vorgesehen)
- 15 gestufte Übungsaufgaben, davon 5 vollständige, mehrteilige **Abitur-Aufgaben** im Stil echter
  NRW-Zentralabiturprüfungen (mit Punktzahlen, gegebenen Werten, Operatoren) — kalibriert an echten
  Abiturklausuren

Beide Themenfelder zusammen: 4 web-native Erklär-Animationen im 3Blue1Brown-Stil (szenenbasiert, SVG, ohne
Videodatei).

Die übrigen Inhaltsfelder (Elektrodynamik, Relativität von Raum und Zeit) sind auf der Startseite als „in
Vorbereitung“ angelegt und folgen nach demselben Muster in weiteren Ausbaustufen.

## Projektstruktur

```
index.html                     Startseite
assets/css/style.css           Design-System (Farben, Typografie, Komponenten, responsive, dark mode)
assets/js/common.js            DataTable, StepGuide, ScenePlayer, physikalische Konstanten, Helper
assets/js/chart.js             ScatterChart (Canvas-Diagramm mit Ausgleichsgerade)
themen/index.html              Themenübersicht (alle Inhaltsfelder)
themen/quantenobjekte/         5 Simulationsseiten + Themenübersicht
themen/strahlung-materie/      5 Simulationsseiten + 1 Konzeptseite + Themenübersicht
erklaervideos/                 4 Erklär-Animationen + Übersicht
aufgaben/                      Übungsaufgaben je Inhaltsfeld mit Lösungen + Übersicht
```

Jede neue Simulationsseite kann nach demselben Muster gebaut werden: `assets/js/common.js` und
`assets/js/chart.js` einbinden, `DataTable` für die Messwerttabelle, `ScatterChart` für das Diagramm und
`StepGuide` für die geführte Auswertung verwenden (siehe z. B. `themen/quantenobjekte/photoeffekt.html` als
Vorlage). Neue Erklär-Animationen orientieren sich an `erklaervideos/photoeffekt-erklaerung.html` und nutzen
die `ScenePlayer`-Komponente.

## Lokale Vorschau

Die Website besteht nur aus statischen Dateien — jeder lokale Webserver reicht aus, z. B.:

```bash
npx serve .
# oder
python -m http.server 8000
```

Alle Seiten verlinken sich über **relative Pfade** (`../assets/...`, `../../index.html` usw.). Dadurch läuft die
Website unter jedem Unterpfad (GitHub Pages `https://<user>.github.io/<repo>/`, Netlify, lokaler Server) und
lässt sich sogar direkt per Doppelklick auf `index.html` im Browser öffnen. Beim Anlegen neuer Seiten die
Pfade entsprechend der Ordnertiefe relativ halten (Ebene 1: `../`, Ebene 2: `../../`).

## Deployment auf GitHub Pages

1. Auf [github.com/new](https://github.com/new) ein neues, **öffentliches** Repository anlegen (z. B. `physik-gk`),
   ohne README/.gitignore/Lizenz (das Projekt bringt bereits alles mit).
2. Im Projektordner:
   ```bash
   git remote add origin https://github.com/<DEIN-NAME>/physik-gk.git
   git push -u origin main
   ```
3. Im Repository: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“ → Branch `main`,
   Ordner `/ (root)` → Save.**
4. Nach ca. 1–2 Minuten ist die Seite unter `https://<DEIN-NAME>.github.io/physik-gk/` erreichbar.

Spätere Änderungen: `git add -A`, `git commit -m "…"`, `git push` — GitHub Pages aktualisiert sich automatisch.
Die Datei `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert (ohne Jekyll-Verarbeitung);
der lokale Ordner `.claude/` ist per `.gitignore` vom Upload ausgeschlossen.

## Deployment auf Netlify

**Option A — Drag & Drop (am schnellsten):**
1. Bei [app.netlify.com](https://app.netlify.com) einloggen.
2. „Add new site“ → „Deploy manually“.
3. Diesen gesamten Projektordner per Drag & Drop in das Upload-Feld ziehen.
4. Netlify vergibt automatisch eine URL (z. B. `https://zufälliger-name.netlify.app`) — diese kann in den
   Site-Einstellungen auf einen sprechenderen Namen geändert werden.

**Option B — über ein Git-Repository (empfohlen für spätere Updates):**
1. Dieses Verzeichnis in ein Git-Repository packen (z. B. auf GitHub) und pushen.
2. Bei Netlify „Add new site“ → „Import an existing project“ → das Repository auswählen.
3. Build-Einstellungen: **kein Build-Command**, Publish-Verzeichnis: `.` (Projekt-Wurzel). Die Datei
   `netlify.toml` ist bereits entsprechend vorkonfiguriert.
4. Jeder weitere `git push` aktualisiert die Live-Seite automatisch.

Die Website benötigt keine Server-seitige Logik, keine Datenbank und keine Umgebungsvariablen.

## Technische Hinweise

- Keine externen CDN-Abhängigkeiten (funktioniert auch in Schulnetzen mit eingeschränktem Internetzugang).
- Diagramme werden mit einer selbst geschriebenen, minimalen Canvas-2D-Bibliothek gezeichnet
  (`assets/js/chart.js`) statt mit einer externen Chart-Bibliothek.
- Erklär-Animationen sind reine SVG/CSS/JavaScript-Animationen (kein Manim, keine Videodatei) — leichtgewichtig,
  interaktiv steuerbar und ohne Rendering-Pipeline direkt im Browser lauffähig.
- Alle Simulationen verwenden echte physikalische Formeln und SI-Konstanten (`PHYS` in `common.js`); die
  Messwerte enthalten eine kleine realistische Zufallsabweichung, wie beim echten Ablesen eines Messgeräts.
- **Wichtiges Muster für neue Canvas-Animationen:** Der erste Zeichenaufruf muss immer **synchron** erfolgen
  (`draw();` bzw. `draw(performance.now());`), nicht über `requestAnimationFrame(draw)` als Einstiegspunkt.
  In manchen Browser-/Tab-Zuständen (z. B. Hintergrund-Tab) feuert `requestAnimationFrame` nicht zuverlässig,
  wodurch die Canvas sonst leer bliebe. Die Animationsschleife selbst (`draw()` ruft am eigenen Ende erneut
  `requestAnimationFrame(draw)` auf) ist davon nicht betroffen — nur der allererste Aufruf muss synchron sein.
