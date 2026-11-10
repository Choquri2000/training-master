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
const actionListeners = new Set();
const undoStack = [];
function snapshot(label) {
  undoStack.push(JSON.stringify(store.get()));
  if (undoStack.length > 30) undoStack.shift();
  if (label) actionListeners.forEach(f => f(label));
}
function save(fromRemote = false) {
  if (!fromRemote) state.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
  if (!fromRemote) listeners.forEach(f => f(state));
}

export const store = {
  get: () => state || load(),
  set(patch) { Object.assign(store.get(), patch); save(); },
  // Pass a label for user actions: it shows an Undo toast.
  update(fn, label) { snapshot(label); fn(store.get()); save(); },
  undo() {
    const prev = undoStack.pop(); if (!prev) return false;
    state = JSON.parse(prev); save(); return true;
  },
  onAction(f) { actionListeners.add(f); },
  export: () => JSON.stringify(store.get(), null, 2),
  import(json) { const next = JSON.parse(json); snapshot('Data imported'); state = { ...DEFAULTS, ...next }; save(); },
  reset() { snapshot('Everything was reset'); state = { ...DEFAULTS }; save(); },
  onChange(f) { listeners.add(f); },
  // Replace local state with merged cloud data without triggering another upload.
  replace(next) { state = { ...DEFAULTS, ...next }; save(true); },
};
