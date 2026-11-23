import { store } from './store.js';
import { CALLS } from './data/calls.js';
// Georgian voice. Phones have no Georgian text-to-speech, so every phrase the coach says is
// pre-recorded with a natural Georgian neural voice (tools/make_voice_ka.py) into voice/ka/<hash>.mp3.
// Lookup order: a clip for the whole phrase, clips for each part, then a Georgian system voice if
// the device has one (e.g. Microsoft Edge on Windows). If none works, the caller falls back to English.

// English call words -> Georgian, longest phrase first (used for combo calls like "one two, kick").
export const CALL_KA = {
  'spinning back fist': 'ბრუნვით ბექფისტი', 'spinning back kick': 'ბრუნვით წიხლი უკან', 'question mark kick': 'კითხვის ნიშანი',
  'last thirty all out': 'ბოლო ოცდაათი წამი, მაქსიმუმი!', 'superman punch': 'სუპერმენი', 'switch sides': 'მხარე შეცვალე',
  'in and out': 'შედი და გამოდი', 'step forward': 'ნაბიჯი წინ', 'step back': 'ნაბიჯი უკან', 'step left': 'ნაბიჯი მარცხნივ', 'step right': 'ნაბიჯი მარჯვნივ',
  'switch kick': 'სვიჩ-წიხლი', 'level change': 'დონის შეცვლა', 'stand up': 'ადექი', 'clinch knee': 'კლინჩი, მუხლი', 'calf kick': 'წიხლი წვივში',
  'liver shot': 'ღვიძლში', 'flying knee': 'მფრინავი მუხლი', 'fake shot': 'ფინტი ფეხებზე', 'fake kick': 'ფინტი წიხლით', 'fake one': 'ფინტი ჯებით',
  'double jab': 'ორმაგი ჯები', 'low kick': 'ლოუ-კიკი', 'keep going': 'გააგრძელე!', 'hands back': 'ხელები სახესთან',
  one: 'ერთი', two: 'ორი', three: 'სამი', four: 'ოთხი', five: 'ხუთი', six: 'ექვსი',
  step: 'ნაბიჯი', pivot: 'შემობრუნება', slip: 'სლიპი', parry: 'პარირება', block: 'ბლოკი', teep: 'ტიპი', kick: 'წიხლი', check: 'ჩეკი',
  switch: 'სტოიკის შეცვლა', sprawl: 'სპრაული', roll: 'როლი', knee: 'მუხლი', move: 'იმოძრავე', elbow: 'იდაყვი', catch: 'დაიჭირე',
  shoot: 'ფეხებზე გადასვლა', shot: 'ფეხებზე გადასვლა', jab: 'ჯები', hook: 'ჰუკი', body: 'ტანში', head: 'თავში', uppercut: 'აპერკოტი',
  overhand: 'ოვერჰენდი', clinch: 'კლინჩი', now: 'ახლა!', pull: 'გაწევა', ready: 'მზად', go: 'დაიწყე!', next: 'შემდეგი',
};
const KEYS = Object.keys(CALL_KA).sort((a, b) => b.length - a.length);

// English call -> list of parts in a language ("one two, kick" -> ["ერთი", "ორი", "წიხლი"]). null if a word is unknown.
export function callParts(en, dict = CALL_KA) {
  let s = ` ${String(en).toLowerCase().replace(/\.\.\.|[,!.]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  const out = [];
  while (s.trim()) {
    s = s.replace(/^\s+/, '');
    const k = KEYS.find(k => s.startsWith(k + ' '));
    if (!k) return null;
    out.push(dict[k]); s = s.slice(k.length);
  }
  return out;
}
// Whole call in Georgian, as one phrase (this is what gets recorded).
export const callKa = en => { const p = callParts(en); return p && p.join(', '); };
// Same for the other languages (spoken by the device's own voice).
export const callIn = (en, code) => { const p = CALLS[code] && callParts(en, CALLS[code]); return p && p.join(', '); };

// Same hash in tools/make_voice_ka.py (FNV-1a over UTF-16 code units).
export function hashKa(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

let clips = null; // Set of recorded hashes
fetch('voice/ka/index.json').then(r => (r.ok ? r.json() : [])).then(a => { clips = new Set(a); warm(); }).catch(() => { clips = new Set(); });
// Georgian users: quietly download every clip once so sessions also speak offline (the service worker keeps them).
async function warm() {
  if (store.get().lang !== 'ka' || !clips.size) return;
  for (const h of clips) { try { await fetch(`voice/ka/${h}.mp3`); } catch { return; } }
}
const audio = typeof Audio !== 'undefined' ? new Audio() : null;
let queue = [];
if (audio) audio.addEventListener('ended', () => playNext());
function playNext() {
  const h = queue.shift(); if (!h) return;
  audio.src = `voice/ka/${h}.mp3`;
  audio.play().catch(() => { queue = []; });
}
export function stopVoice() { queue = []; try { audio?.pause(); } catch { /* ignore */ } }

const has = t => !!t && !!clips?.has(hashKa(t));
// Returns true if it is speaking Georgian.
export function sayKa(what) {
  const items = (Array.isArray(what) ? what : [what]).filter(Boolean);
  if (!items.length) return false;
  // English call words get translated first.
  const ka = items.map(t => (/[Ⴀ-ჿ]/.test(t) ? t : callKa(t))).filter(Boolean);
  if (!ka.length) return false;
  // 1) recorded clips
  if (audio && clips) {
    const seq = [];
    for (const t of ka) {
      if (has(t)) { seq.push(hashKa(t)); continue; }
      const parts = /[Ⴀ-ჿ]/.test(t) ? t.split(/,\s*/) : [];
      if (parts.length > 1 && parts.every(has)) seq.push(...parts.map(hashKa)); else { seq.length = 0; break; }
    }
    if (seq.length) { stopVoice(); queue = seq; playNext(); return true; }
  }
  // 2) a Georgian voice on the device
  if ('speechSynthesis' in window) {
    const v = speechSynthesis.getVoices().find(x => /^ka/i.test(x.lang));
    if (v) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(ka.join('. ')); u.voice = v; u.lang = v.lang; u.rate = 1.05;
      speechSynthesis.speak(u); return true;
    }
  }
  return false;
}
// iPhones only let a page play sound it started from a tap: call this from the Start tap.
export function unlockVoice() {
  if (!audio || audio.dataset.unlocked) return;
  try { audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; audio.play().catch(() => {}); audio.dataset.unlocked = '1'; } catch { /* ignore */ }
}
