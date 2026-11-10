# Combat Coach

A personal skills trainer for boxing, Muay Thai, kickboxing and MMA fundamentals. It is a static web app: no server, no account, free to host on GitHub Pages, and installable on a phone as an app that works offline.

Running is tracked in a separate app. This app shows the full weekly plan (run, strength, combat) for context, but only guides and logs the combat skill work.

## What it does

- **Today:** what's planned for today, with the combat session ready to start.
- **Week:** the whole week across running, strength and combat.
- **Pathway:** a 12-week, 3-phase learning path. Each phase ends with a video checkpoint that unlocks the next one.
- **Library:** each technique has an animated stick figure, key points, common mistakes with fixes, drills and your own notes.
- **Session player:** a round timer with bells, a 10-second warning, and spoken combo callouts that only use techniques you've unlocked.
- **Log:** sessions, minutes and load (minutes x RPE).
- **Settings:** voice on/off, plan start date (every 4th week is a deload), export/import of your data.

## Run locally

```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Publish (GitHub Pages)

Settings → Pages → Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`.

## Adding content

- Techniques, combos and animations: `js/data/techniques.js`
- Phases, session templates, the weekly plan and strength days: `js/data/plan.js`
- UI text: `js/i18n.js`

Every text field is `{ en: '...' }`. Georgian is added by putting a `ka` value next to each `en` and enabling `ka` in `LANGS`. Anything not yet translated falls back to English.

After changing files, bump `VERSION` in `sw.js` so installed copies update.
