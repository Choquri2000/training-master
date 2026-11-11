// UI strings. Add a `ka` block (Georgian) later with the same keys; anything missing falls back to English.
import { store } from './store.js';

const STRINGS = {
  en: {
    appName: 'Combat Coach',
    today: 'Today', week: 'Week', pathway: 'Pathway', library: 'Library', log: 'Progress', settings: 'Settings',
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
    today: 'დღეს', week: 'კვირა', pathway: 'გზა', library: 'ტექნიკა', log: 'შედეგი', settings: 'ოფციები',
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

export function t(key) {
  const lang = store.get().lang;
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}

// Pick the current language from a content object like { en, ka }.
export function L(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[store.get().lang] ?? obj.en;
}

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ka', label: 'ქართული' },
];

// Phrase translation for UI text written inline in the code: tr('English', {vars}).
import { KA, EN_LONG } from './data/ka-ui.js';
export function tr(en, vars) {
  let out = (store.get().lang === 'ka' && KA[en]) || EN_LONG[en] || en;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return out;
}
