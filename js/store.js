// Tiny persistence layer on localStorage. Everything the app remembers lives under one key,
// so export/import is a single JSON blob.
const KEY = 'combat-coach-v1';

const DEFAULTS = {
  lang: 'en',
  voice: true,
  status: {},       // techId -> 'learning' | 'done'
  phaseUnlocked: 1, // highest phase open
  checkpoints: {},  // phase -> ISO date passed
  log: [],          // { date, type, minutes, rpe, techs[], note }
  notes: {},        // techId -> free text
};

let state;
function load() {
  try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { state = { ...DEFAULTS }; }
  return state;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
}

export const store = {
  get: () => state || load(),
  set(patch) { Object.assign(store.get(), patch); save(); },
  update(fn) { fn(store.get()); save(); },
  export: () => JSON.stringify(store.get(), null, 2),
  import(json) { state = { ...DEFAULTS, ...JSON.parse(json) }; save(); },
  reset() { state = { ...DEFAULTS }; save(); },
};
