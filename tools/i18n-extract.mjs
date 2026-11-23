// Lists every English text the app shows or says, for translators: writes tools/i18n/en.json.
// Run: node tools/i18n-extract.mjs   (then add the translations, see tools/i18n-build.mjs)
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const mem = {};
globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
globalThis.fetch = async () => ({ ok: false, json: async () => [] });
globalThis.window = globalThis; globalThis.document = { addEventListener() {}, readyState: 'complete' };
const root = new URL('../', import.meta.url);
const out = new Set();
const add = s => {
  if (typeof s !== 'string') return;
  s = s.trim();
  if (!/[A-Za-z]{2}/.test(s) || /^[a-z0-9_-]+$/.test(s) && !s.includes(' ') && s.length < 3) return;
  if (/^(https?:|#\/|[a-z]+\.(js|html|mp3))/.test(s)) return;
  out.add(norm(s));
};
// Same slots as X() in js/i18n.js: numbers, and quoted calls in templates.
export const norm = s => { let i = 0; return s.replace(/"\u0000"|\d+(?:[.,]\d+)?/g, () => `{${i++}}`); };
const leaves = v => { if (typeof v === 'string') add(v); else if (Array.isArray(v)) v.forEach(leaves); else if (v && typeof v === 'object') Object.values(v).forEach(leaves); };
const seen = new WeakSet();
const walk = v => {
  if (!v || typeof v !== 'object' || seen.has(v)) return; seen.add(v);
  if (!Array.isArray(v) && 'en' in v && typeof v.en !== 'function') leaves(v.en);
  for (const [k, x] of Object.entries(v)) if (k !== 'ka' && !/^[a-z]{2}$/.test(k)) walk(x);
};
const files = ['js/i18n.js', 'js/profile.js', 'js/program.js', 'js/targets.js', ...readdirSync(new URL('js/data/', root)).filter(f => f.endsWith('.js')).map(f => 'js/data/' + f)];
for (const f of files) { try { const m = await import(new URL(f, root)); Object.values(m).forEach(walk); } catch (e) { console.error('skip', f, e.message); } }
const { STRINGS } = await import(new URL('js/i18n.js', root)); Object.values(STRINGS.en).forEach(add);
const { KA, EN_LONG } = await import(new URL('js/data/ka-ui.js', root)); Object.keys(KA).forEach(k => add(EN_LONG[k] || k)); Object.values(EN_LONG).forEach(add);
// Text written inline in the code: an English literal right before its Georgian twin, and tr('...') calls.
const lit = String.raw`'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|\x60((?:\\.|[^\x60\\])*)\x60`;
const pair = new RegExp(`(?:${lit})\\s*,\\s*(?:['"\x60])[^'"\x60]*[\u10A0-\u10FF]`, 'g');
const trc = new RegExp(`\\btr\\(\\s*(?:${lit})`, 'g');
const unq = s => s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
const tmpl = s => (/\$\{[^}]*\.(en|ka|label)\b/.test(s) ? null : s.replace(/"\$\{[^}]*\}"/g, '"\u0000"').replace(/\$\{[^}]*\}/g, '0'));
for (const f of [...files, 'js/app.js', 'js/session.js', 'js/mocap.js', 'js/figure.js', 'js/pro.js', 'js/sync.js']) {
  const src = readFileSync(new URL(f, root), 'utf8');
  for (const re of [pair, trc]) for (const m of src.matchAll(re)) {
    const s = m[1] ?? m[2] ?? (m[3] != null ? tmpl(m[3]) : null);
    if (s != null && !/[\u10A0-\u10FF]/.test(s)) add(unq(s));
  }
}
// Pieces of joined labels (see X(): "Circuit 1/3: Push-ups", "Drill of the day · ...").
['Circuit {0}/{1}', 'Drill of the day', 'Technique, set {0}', 'Technique, set {0} (slow)', '{0} min', 'Round {0}', 'Drill {0}'].forEach(add);
// Spoken calls ("one two, kick") are translated word by word in js/data/calls.js instead.
const { callParts } = await import(new URL('js/voice.js', root));
const list = [...out].filter(s => !/^\{\d+\}$/.test(s) && !/^[A-Z_]+$/.test(s) && !(s === s.toLowerCase() && callParts(s.replace(/\{\d+\}/g, 'one'))));
mkdirSync(new URL('tools/i18n/', root), { recursive: true });
writeFileSync(new URL('tools/i18n/en.json', root), JSON.stringify(list, null, 0).replace(/","/g, '",\n"'));
console.log(list.length, 'texts,', list.join('').length, 'characters');
