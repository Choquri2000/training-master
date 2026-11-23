// The app's languages. To add one (e.g. Arabic):
// 1. Add a row here: { code: 'ar', label: 'العربية', speech: 'ar-SA', dir: 'rtl' }.
// 2. Put numbered translations of tools/i18n/en.json in tools/i18n/<code>/*.txt and run
//    node tools/i18n-build.mjs (it builds js/data/lang/<code>.js for every folder it finds).
// 3. Add the spoken call words to js/data/calls.js (CALLS.<code>).
// Anything not translated falls back to English, so a language can go live part-done.
export const LANGS = [
  { code: 'en', label: 'English', speech: 'en-US' },
  { code: 'es', label: 'Español', speech: 'es-ES' },
  { code: 'de', label: 'Deutsch', speech: 'de-DE' },
  { code: 'fr', label: 'Français', speech: 'fr-FR' },
  { code: 'it', label: 'Italiano', speech: 'it-IT' },
  { code: 'ka', label: 'ქართული', speech: 'ka-GE' },
  { code: 'ru', label: 'Русский', speech: 'ru-RU' },
];
export const langDir = code => (LANGS.find(l => l.code === code) || {}).dir || 'ltr';
