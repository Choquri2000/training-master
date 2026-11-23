// UI strings. English and Georgian are written in the code; the other languages are maps from the
// English text to the translation (js/data/lang/<code>.js), loaded on demand. Anything missing stays English.
import { store } from './store.js';

export const STRINGS = {
  en: {
    appName: 'Combat Coach',
    today: 'Today', train: 'Train', me: 'Me', week: 'Week', pathway: 'Pathway', library: 'Learn', learn: 'Learn', plan: 'Plan', log: 'Progress', settings: 'Settings',
    run: 'Run', strength: 'Strength', combat: 'Combat',
    rest: 'Rest', start: 'Start session', noCombatToday: 'No combat session today. Rest the skills, or do 10 min of easy shadowboxing if you feel fresh.',
    focusToday: 'Today\'s focus techniques', keyPoints: 'Key points', mistakes: 'Common mistakes and fixes',
    drills: 'Drills', phase: 'Phase', locked: 'Locked', learning: 'Learning', done: 'Done', notStarted: 'Not started',
    markLearning: 'Start learning', markDone: 'Mark as solid', markReset: 'Reset',
    checkpoint: 'Checkpoint', passCheckpoint: 'I passed this checkpoint on video', unlockNext: 'Next phase unlocked',
    pause: 'Pause', resume: 'Resume', skip: 'Skip', stop: 'Stop', finish: 'Finish',
    howHard: 'How hard was it? (RPE 1-10)', save: 'Save', saved: 'Saved',
    minutes: 'min', sessions: 'sessions', thisWeek: 'This week', noLog: 'No sessions logged yet.',
    voice: 'Spoken callouts', language: 'Language', exportData: 'Export my data', importData: 'Import data', resetData: 'Reset everything',
    speed: 'Speed', slow: 'Slow', normal: 'Normal',
    weekRules: 'How the week fits together', viewTech: 'Open', notes: 'My notes',
    deloadNote: 'Deload week: technique only, no hard rounds.',
    filterAll: 'All',
    howFelt: 'How did each skill feel?', feltEasy: 'Easy', feltOk: 'OK', feltOff: 'Felt off', rateHint: '"Felt off" skills come back sooner in your plan.',
    streak: 'Streak', weeks: 'weeks', skillsSolid: 'Skills solid', minutesPerWeek: 'Combat minutes per week',
    needsWork: 'Needs work', needsWorkHint: 'You rated these "felt off". Your plan brings them back sooner.',
    feelsEasy: 'Feels easy', feelsEasyHint: 'Ready to mark as solid? Open one and tap "Mark as solid".',
    history: 'History', date: 'Date', session: 'Session', techniques: 'Skills',
  },
  ka: {
    appName: 'Combat Coach',
    today: 'დღეს', train: 'ვარჯიში', me: 'ჩემი', week: 'კვირა', pathway: 'გზა', library: 'სწავლა', learn: 'სწავლა', plan: 'გეგმა', log: 'პროგრესი', settings: 'ოფციები',
    run: 'სირბილი', strength: 'ძალა', combat: 'ორთაბრძოლა',
    rest: 'დასვენება', start: 'დაწყება', noCombatToday: 'დღეს ორთაბრძოლის ვარჯიში არ არის. დაასვენე უნარები, ან თუ თავს კარგად გრძნობ, 10 წთ მსუბუქი ჩრდილთან ბრძოლა გააკეთე.',
    focusToday: 'დღევანდელი ფოკუს-ტექნიკები', keyPoints: 'მთავარი პუნქტები', mistakes: 'ხშირი შეცდომები და გამოსწორება',
    drills: 'დრილები', phase: 'ფაზა', locked: 'დაბლოკილი', learning: 'სწავლობ', done: 'ათვისებული', notStarted: 'დასაწყები',
    markLearning: 'სწავლის დაწყება', markDone: 'ათვისებულად მონიშვნა', markReset: 'გადატვირთვა',
    checkpoint: 'საკონტროლო', passCheckpoint: 'ეს საკონტროლო ვიდეოზე გავიარე', unlockNext: 'შემდეგი ფაზა გაიხსნა',
    pause: 'პაუზა', resume: 'გაგრძელება', skip: 'გამოტოვება', stop: 'შეჩერება', finish: 'დასრულება',
    howHard: 'რამდენად რთული იყო? (RPE 1-10)', save: 'შენახვა', saved: 'შენახულია',
    minutes: 'წთ', sessions: 'ვარჯიში', thisWeek: 'ეს კვირა', noLog: 'ჯერ ვარჯიში არ ჩაწერილა.',
    voice: 'ხმოვანი ბრძანებები', language: 'ენა', exportData: 'მონაცემების ექსპორტი', importData: 'მონაცემების იმპორტი', resetData: 'ყველაფრის წაშლა',
    speed: 'სიჩქარე', slow: 'ნელა', normal: 'ნორმალური',
    weekRules: 'როგორ ეწყობა კვირა', viewTech: 'გახსნა', notes: 'ჩემი ჩანაწერები',
    deloadNote: 'განტვირთვის კვირა: მხოლოდ ტექნიკა, მძიმე რაუნდების გარეშე.',
    filterAll: 'ყველა',
    howFelt: 'როგორ იყო თითოეული უნარი?', feltEasy: 'ადვილი', feltOk: 'კარგი', feltOff: 'ვერ გამოვიდა', rateHint: '„ვერ გამოვიდა“ უნარები გეგმაში უფრო მალე დაბრუნდება.',
    streak: 'სერია', weeks: 'კვირა', skillsSolid: 'ათვისებული', minutesPerWeek: 'ორთაბრძოლის წუთები კვირაში',
    needsWork: 'სამუშაოა', needsWorkHint: 'ეს შეაფასე როგორც „ვერ გამოვიდა“. გეგმა მათ უფრო მალე დააბრუნებს.',
    feelsEasy: 'ადვილად გამოდის', feelsEasyHint: 'მზად ხარ ათვისებულად მოსანიშნად? გახსენი და დააჭირე „ათვისებულად მონიშვნა“.',
    history: 'ისტორია', date: 'თარიღი', session: 'ვარჯიში', techniques: 'უნარები',
  },
};

export const LANGS = [
  { code: 'en', label: 'English', speech: 'en-US' },
  { code: 'es', label: 'Español', speech: 'es-ES' },
  { code: 'de', label: 'Deutsch', speech: 'de-DE' },
  { code: 'fr', label: 'Français', speech: 'fr-FR' },
  { code: 'it', label: 'Italiano', speech: 'it-IT' },
  { code: 'ka', label: 'ქართული', speech: 'ka-GE' },
  { code: 'ru', label: 'Русский', speech: 'ru-RU' },
];
export const lang = () => store.get().lang || 'en';
export const speechLang = () => (LANGS.find(l => l.code === lang()) || LANGS[0]).speech;
// Languages that use the English-keyed maps.
const mapped = () => { const l = lang(); return l !== 'en' && l !== 'ka' && MAPLANG === l; };

let MAP = {}, MAPLANG = 'en', cache = new Map(), deepCache = new WeakMap();
// Load a language's map before rendering in it. English and Georgian need nothing.
export async function loadLang(code = lang()) {
  if (code === 'en' || code === 'ka' || code === MAPLANG) return;
  try { MAP = (await import(`./data/lang/${code}.js`)).default; MAPLANG = code; cache = new Map(); deepCache = new WeakMap(); } catch { /* offline: stays English */ }
}

// English text -> current language. Exact match first, then the same text with its numbers and
// quoted calls as slots ("Round 2 of 5" uses "Round {0} of {1}"), then piece by piece.
function X(s, depth = 0) {
  if (typeof s !== 'string' || !/[A-Za-z]/.test(s)) return s;
  const hit = MAP[s]; if (hit != null) return hit;
  if (cache.has(s)) return cache.get(s);
  let out = s;
  const slot = re => { const vals = []; const key = s.replace(re, m => { vals.push(m); return `{${vals.length - 1}}`; }); return vals.length && MAP[key] != null ? MAP[key].replace(/\{(\d+)\}/g, (_, i) => vals[i] ?? '') : null; };
  const hit2 = slot(/\d+(?:[.,]\d+)?/g) ?? slot(/"[a-z0-9 ,'-]*"|\d+(?:[.,]\d+)?/g);
  if (hit2 != null) out = hit2;
  else if (depth < 4) {
    for (const sep of [' · ', /(?<=[.!?…])\s+/, ': ', ', ']) {
      const parts = s.split(sep);
      if (parts.length > 1) { out = parts.map(x => X(x, depth + 1)).join(typeof sep === 'string' ? sep : ' '); if (out !== s) break; }
    }
  }
  cache.set(s, out);
  return out;
}
// Translate any English value: a string, or arrays/objects of strings.
function deep(v) {
  if (typeof v === 'string') return X(v);
  if (!v || typeof v !== 'object') return v;
  if (deepCache.has(v)) return deepCache.get(v);
  const out = Array.isArray(v) ? v.map(deep) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)]));
  deepCache.set(v, out);
  return out;
}

export function t(key) {
  const l = lang();
  if (STRINGS[l]?.[key]) return STRINGS[l][key];
  const en = STRINGS.en[key];
  return en ? (mapped() ? X(en) : en) : key;
}

// Pick the current language from a content object like { en, ka }.
export function L(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return mapped() ? X(obj) : obj;
  const l = lang();
  if (obj[l] != null) return obj[l];
  return mapped() ? deep(obj.en) : obj.en;
}
// Same, from the two versions written in the code.
export const P = (en, ka) => L({ en, ka });

// Phrase translation for UI text written inline in the code: tr('English', {vars}).
import { KA, EN_LONG } from './data/ka-ui.js';
export function tr(en, vars) {
  const base = EN_LONG[en] || en, l = lang();
  let out = l === 'ka' ? KA[en] || base : mapped() ? X(base) : base;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return out;
}
