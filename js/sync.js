// Cloud sync with Firebase (email + password sign-in, Firestore).
// Local storage stays the instant copy; every change is also written to users/{uid} in Firestore.
// Firestore keeps its own offline queue, so changes made without signal upload later.
import { FIREBASE_CONFIG } from './firebase-config.js';
import { store } from './store.js';

const V = '10.12.2';
const CDN = `https://www.gstatic.com/firebasejs/${V}`;
let fb = null, auth, db, docRef, user = null, timer = 0;
const status = { state: FIREBASE_CONFIG ? 'signed-out' : 'off', at: null, error: null };
const subs = new Set();
const emit = () => subs.forEach(f => f({ ...status, email: user?.email }));
export const onSync = f => { subs.add(f); f({ ...status, email: user?.email }); };
export const syncAvailable = () => !!FIREBASE_CONFIG;

// Merge two saves: newest wins for settings and progress, but no logged session is ever dropped.
function merge(a, b) {
  const [older, newer] = (a.updatedAt || 0) > (b.updatedAt || 0) ? [b, a] : [a, b];
  const key = e => [e.date, e.type, e.minutes, e.rpe, e.at || ''].join('|');
  const log = new Map();
  [...(older.log || []), ...(newer.log || [])].forEach(e => log.set(key(e), e));
  return {
    ...older, ...newer,
    status: { ...(older.status || {}), ...(newer.status || {}) },
    notes: { ...(older.notes || {}), ...(newer.notes || {}) },
    checkpoints: { ...(older.checkpoints || {}), ...(newer.checkpoints || {}) },
    phaseUnlocked: Math.max(older.phaseUnlocked || 1, newer.phaseUnlocked || 1),
    log: [...log.values()].sort((x, y) => (x.date + (x.at || '')).localeCompare(y.date + (y.at || ''))),
    updatedAt: Math.max(older.updatedAt || 0, newer.updatedAt || 0),
  };
}

async function upload() {
  if (!user) return;
  try {
    status.state = 'saving'; emit();
    await fb.setDoc(docRef, { data: JSON.stringify(store.get()), updatedAt: Date.now() });
    status.state = 'saved'; status.at = Date.now(); status.error = null;
  } catch (e) { status.state = 'error'; status.error = e.message; }
  emit();
}

async function pull() {
  const snap = await fb.getDoc(docRef);
  const remote = snap.exists() ? JSON.parse(snap.data().data) : null;
  if (remote) store.replace(merge(remote, store.get()));
  await upload();
}

export async function initSync(onDataChanged) {
  if (!FIREBASE_CONFIG) return;
  const [app, a, f] = await Promise.all([
    import(`${CDN}/firebase-app.js`), import(`${CDN}/firebase-auth.js`), import(`${CDN}/firebase-firestore.js`),
  ]);
  fb = { ...a, ...f };
  const appI = app.initializeApp(FIREBASE_CONFIG);
  auth = a.getAuth(appI);
  await a.setPersistence(auth, a.indexedDBLocalPersistence).catch(() => {});
  db = f.initializeFirestore(appI, { localCache: f.persistentLocalCache() });
  a.onAuthStateChanged(auth, async u => {
    user = u;
    if (!u) { status.state = 'signed-out'; emit(); return; }
    docRef = f.doc(db, 'users', u.uid);
    try { await pull(); onDataChanged?.(); } catch (e) { status.state = 'error'; status.error = e.message; emit(); }
  });
  store.onChange(() => { clearTimeout(timer); timer = setTimeout(upload, 800); });
  window.addEventListener('online', () => upload());
}

export async function signIn(email, password, create) {
  const fn = create ? fb.createUserWithEmailAndPassword : fb.signInWithEmailAndPassword;
  await fn(auth, email, password);
}
export async function signInGoogle() {
  await fb.signInWithPopup(auth, new fb.GoogleAuthProvider());
}
export const signOut = () => fb.signOut(auth);
export const resetPassword = email => fb.sendPasswordResetEmail(auth, email);
