# Combat Coach

A personal skills trainer for boxing, Muay Thai, kickboxing and MMA fundamentals. It is a static web app: no server, no account, free to host on GitHub Pages, and installable on a phone as an app that works offline.

Running is tracked in a separate app. This app shows the full weekly plan (run, strength, combat) for context, but only guides and logs the combat skill work.

## What it does

- **Today:** today's session, ready to start, with a coach's note. Also a round timer for bag, pads or sparring.
- **Practical drills:** footwork box, band shadowboxing, light dumbbell rounds, reaction cues, balance and kicking base, a fight conditioning circuit and "last 30 seconds" finishes. The plan adds one to each session as the drill of the day.
- **Sparring partner, corner coach, voice control and career:** a 3D motion-captured opponent can attack you on screen (speeds set from real fight timing, scaled by partner level). A corner coach speaks one tip in each rest. Say "pause", "go", "next" or "again" to control a session hands-free. Fighter career mode turns training into fight camps and fight nights on a ranked ladder.
- **Plan:** your profile-based plan (days, length, level, goal, limits, stance), in two stages: learn your skills, then long-term fighter training. Can be built around a fighting style.
- **Learn:** advanced strikes (unlock after phase 3), feints and traps, signature moves of great fighters, self-defence, and a 3D figure of the targets on the body; every technique and 21 combinations with motion-capture animation and step-by-step coaching captions; fighting styles (13, with comparison, a style quiz and matchup game plans); Fight IQ lessons; your own combinations.
- **Progress:** sessions, minutes, skill ratings and monthly skill tests.
- **Settings** (gear icon): profile, cloud save, language (English/Georgian), export/import.

## Run locally

```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Publish (GitHub Pages)

Settings → Pages → Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`.

## Adding content

- Techniques, combos and animations: `js/data/techniques.js`
- Advanced strikes, setups, signature moves, self-defence: `js/data/advanced.js`; body targets: `js/targets.js`
- Phases, session templates, the weekly plan and strength days: `js/data/plan.js`
- UI text: `js/i18n.js`

Every text field is `{ en: '...' }`. Georgian is added by putting a `ka` value next to each `en` and enabling `ka` in `LANGS`. Anything not yet translated falls back to English.

After changing files, bump `VERSION` in `sw.js` so installed copies update.

## 3D motion capture
`assets/fighter.glb` holds one character and 27 motion-capture clips from Adobe Mixamo (cut, combined or mirrored per technique in js/mocap.js; every technique has one), plus `assets/mannequin.glb` (Mixamo X Bot), (free, royalty-free for use in projects), converted with three.js and compressed with gltf-transform (meshopt, WebP textures). `vendor/three` is three.js r170 (MIT). Techniques without a clip use the built-in 3D stick figure.
