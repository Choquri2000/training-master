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
const listeners = new Set();
function save(fromRemote = false) {
  if (!fromRemote) state.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
  if (!fromRemote) listeners.forEach(f => f(state));
}

export const store = {
  get: () => state || load(),
  set(patch) { Object.assign(store.get(), patch); save(); },
  update(fn) { fn(store.get()); save(); },
  export: () => JSON.stringify(store.get(), null, 2),
  import(json) { state = { ...DEFAULTS, ...JSON.parse(json) }; save(); },
  reset() { state = { ...DEFAULTS }; save(); },
  onChange(f) { listeners.add(f); },
  // Replace local state with merged cloud data without triggering another upload.
  replace(next) { state = { ...DEFAULTS, ...next }; save(true); },
};
