// "My plan": the skills you picked, turned into a repeating 4-week combat program
// for the garage days (Mon technique, Wed technique without hard kicks, Fri main session).
import { TECHNIQUES, techById, COMBOS } from './data/techniques.js';
import { store } from './store.js';

// Kicks, knees and level changes stay off Wednesday (legs day in the gym).
const LEGGY = new Set(['teep', 'roundhouse', 'leadkick', 'knee', 'check', 'sprawl', 'sprawlstrike', 'doubleleg', 'levelchange', 'catchkick', 'clinch', 'standup']);

export const PRESETS = {
  allround: { name: 'All-round (recommended)', ids: ['stance', 'step', 'pivot', 'jab', 'cross', 'slip', 'parry', 'block', 'leadhook', 'rearhook', 'leaduppercut', 'rearuppercut', 'roll', 'slipcounter', 'pullcounter', 'angleout', 'teep', 'roundhouse', 'check', 'leadkick', 'knee', 'elbow', 'catchkick', 'clinch', 'sprawl', 'levelchange', 'doubleleg', 'sprawlstrike', 'standup'] },
  boxing: { name: 'Boxing', ids: ['stance', 'step', 'pivot', 'jab', 'cross', 'slip', 'parry', 'block', 'leadhook', 'rearhook', 'leaduppercut', 'rearuppercut', 'roll', 'slipcounter', 'pullcounter', 'angleout'] },
  muaythai: { name: 'Muay Thai / Kickboxing', ids: ['stance', 'step', 'jab', 'cross', 'block', 'teep', 'roundhouse', 'check', 'switchstance', 'leadhook', 'leadkick', 'knee', 'elbow', 'catchkick', 'clinch'] },
  mma: { name: 'MMA', ids: ['stance', 'step', 'jab', 'cross', 'slip', 'teep', 'roundhouse', 'sprawl', 'levelchange', 'standup', 'doubleleg', 'sprawlstrike', 'leadhook', 'pullcounter'] },
  all: { name: 'Everything', ids: TECHNIQUES.map(x => x.id) },
};

// Week of the 4-week block -> session volume. Week 4 is the deload.
const VOLUME = [
  { label: 'Build: learn it slow', techSets: 3, rounds: 3, roundSecs: 120, rest: 60, pace: 'easy' },
  { label: 'Build: add speed', techSets: 2, rounds: 4, roundSecs: 150, rest: 60, pace: 'medium' },
  { label: 'Peak: pressure rounds', techSets: 2, rounds: 5, roundSecs: 180, rest: 60, pace: 'fast' },
  { label: 'Deload: technique only', techSets: 2, rounds: 0, roundSecs: 0, rest: 60, pace: 'easy' },
];
export const blockWeek = week => ((week - 1) % 4) + 1;
export function volume(week) {
  const v = { ...VOLUME[blockWeek(week) - 1] };
  if (week > 4 && v.rounds) v.roundSecs = Math.min(180, v.roundSecs + 30); // later blocks: longer rounds
  return v;
}

export const picks = () => (store.get().program?.picks || []).filter(id => techById[id]);

// The plan never ends: each 4-week block has a theme that gets most of the time,
// themes rotate (boxing -> kicks -> MMA -> defence and counters), and every block
// still revisits the other skills, so all of them keep improving.
const DEFENCE = new Set(['slip', 'parry', 'block', 'roll', 'check', 'catchkick', 'slipcounter', 'pullcounter', 'angleout', 'sprawl']);
export const THEMES = [
  { name: 'Hands', has: t => t.discipline === 'boxing' && !DEFENCE.has(t.id) },
  { name: 'Kicks, knees and elbows', has: t => t.discipline === 'muaythai' && !DEFENCE.has(t.id) },
  { name: 'MMA: level changes and the ground', has: t => t.discipline === 'mma' && !DEFENCE.has(t.id) },
  { name: 'Defence and counters', has: t => DEFENCE.has(t.id) },
];
export const blockNo = week => Math.floor((week - 1) / 4);
export function themeOf(week) {
  const p = picks();
  for (let i = 0; i < THEMES.length; i++) { // skip themes you picked nothing for
    const th = THEMES[(blockNo(week) + i) % THEMES.length];
    if (p.some(id => th.has(techById[id]))) return th;
  }
  return null;
}

// Which picked skills each garage day works on: theme skills first, plus a rotating
// "keep sharp" skill from the rest, so every pick comes up regularly.
const SLOT = { 0: 0, 2: 1, 4: 2 }; // Mon, Wed, Fri
export function programFocus(day, week) {
  const p = picks().filter(id => id !== 'stance');
  if (!p.length || !(day in SLOT)) return [];
  const okDay = id => day !== 2 || !LEGGY.has(id);
  const th = themeOf(week);
  const theme = p.filter(id => th?.has(techById[id]) && okDay(id));
  const rest = p.filter(id => !theme.includes(id) && okDay(id));
  const n = day === 4 ? 3 : 2, k = (week - 1) * 3 + SLOT[day];
  const take = (list, m, off) => (list.length ? Array.from({ length: Math.min(m, list.length) }, (_, i) => list[(off + i) % list.length]) : []);
  const nTheme = rest.length ? n - 1 : n;
  const out = [...take(theme, nTheme, k * nTheme), ...take(rest, n - Math.min(nTheme, theme.length), k)];
  let res = [...new Set(out)].slice(0, n);
  if (!res.length) res = take(p, n, k);
  // Skills you rated "felt off" come back sooner: the oldest one takes the last slot.
  const feel = store.get().feel || {};
  const off = p.filter(id => feel[id]?.r === 3 && okDay(id) && !res.includes(id)).sort((x, y) => feel[x].date.localeCompare(feel[y].date));
  if (off.length && res.length) res[res.length - 1] = off[0];
  return res;
}

// Combos the timer calls: only ones built from what you picked (plus stance/step).
export function programCombos() {
  const p = new Set([...picks(), 'stance', 'step']);
  const list = COMBOS.filter(c => c.uses.every(id => p.has(id)));
  return list.length >= 2 ? list : null;
}
