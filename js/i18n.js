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
  // { code: 'ka', label: 'ქართული' },  // coming later
];
