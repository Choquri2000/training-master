// "My plan": the skills you picked, turned into a repeating 4-week combat program
// for your training days (see profile.js: which days, which session, what to avoid).
import { TECHNIQUES, techById, COMBOS } from './data/techniques.js';
import { store } from './store.js';
import { stepsKick, stepsDefFirst } from './data/combos.js';
import { weekDays, dayPlan, legsDay, suitable, tune, profile } from './profile.js';

// Kicks, knees and level changes stay off the legs day (only when the running/strength plan is shown).
const LEGGY = new Set(['teep', 'roundhouse', 'leadkick', 'knee', 'check', 'sprawl', 'sprawlstrike', 'doubleleg', 'levelchange', 'catchkick', 'clinch', 'standup']);
const leggy = id => LEGGY.has(id) || !!techById[id]?.uses?.some(u => LEGGY.has(u)); // combinations with a kick or knee too
const ofDisc = d => TECHNIQUES.filter(x => x.discipline === d).map(x => x.id);
const ATTACK = ofDisc('combos'), COUNTER = ofDisc('counters');
// The family a combination belongs to, for the themes: kicks/knees/elbows -> kicks, shots -> MMA, else hands.
const family = t => (t.uses.includes('doubleleg') ? 'mma' : t.uses.some(u => techById[u].discipline === 'muaythai') ? 'muaythai' : 'boxing');

export const PRESETS = {
  allround: { name: 'All-round (recommended)', ids: ['stance', 'step', 'pivot', 'jab', 'cross', 'slip', 'parry', 'block', 'leadhook', 'rearhook', 'leaduppercut', 'rearuppercut', 'roll', 'slipcounter', 'pullcounter', 'angleout', 'teep', 'roundhouse', 'check', 'leadkick', 'knee', 'elbow', 'catchkick', 'clinch', 'sprawl', 'levelchange', 'doubleleg', 'sprawlstrike', 'standup', ...ATTACK, ...COUNTER] },
  boxing: { name: 'Boxing', ids: ['stance', 'step', 'pivot', 'jab', 'cross', 'slip', 'parry', 'block', 'leadhook', 'rearhook', 'leaduppercut', 'rearuppercut', 'roll', 'slipcounter', 'pullcounter', 'angleout', 'c12', 'c112', 'c123', 'c1232', 'c232', 'c34', 'c52', 'c632', 'dslip23', 'droll32', 'dblock32', 'dparry12', 'dpull23'] },
  muaythai: { name: 'Muay Thai / Kickboxing', ids: ['stance', 'step', 'jab', 'cross', 'block', 'teep', 'roundhouse', 'check', 'switchstance', 'leadhook', 'leadkick', 'knee', 'elbow', 'catchkick', 'clinch', 'c12', 'c123', 'c1teep', 'c1switch', 'cdutch', 'c12knee', 'c3elbow', 'dblock32', 'dcheckkick', 'dcatch2kick'] },
  mma: { name: 'MMA', ids: ['stance', 'step', 'jab', 'cross', 'slip', 'teep', 'roundhouse', 'sprawl', 'levelchange', 'standup', 'doubleleg', 'sprawlstrike', 'leadhook', 'pullcounter', 'c12', 'c123', 'c12shoot', 'c1teep', 'dslip23', 'dparry12'] },
  basics: { name: 'Beginner basics', ids: [...TECHNIQUES.filter(x => x.phase === 1 && !x.uses).map(x => x.id), 'c12', 'c112'] },
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
  return tune(v, false);
}

export const picks = () => (store.get().program?.picks || []).filter(suitable); // minus what your limits rule out

// The plan never ends: each 4-week block has a theme that gets most of the time,
// themes rotate (boxing -> kicks -> MMA -> defence and counters), and every block
// still revisits the other skills, so all of them keep improving.
const DEFENCE = new Set(['slip', 'parry', 'block', 'roll', 'check', 'catchkick', 'slipcounter', 'pullcounter', 'angleout', 'sprawl']);
export const THEMES = [
  { name: 'Hands', has: t => (t.discipline === 'boxing' || (t.discipline === 'combos' && family(t) === 'boxing')) && !DEFENCE.has(t.id) },
  { name: 'Kicks, knees and elbows', has: t => (t.discipline === 'muaythai' || (t.discipline === 'combos' && family(t) === 'muaythai')) && !DEFENCE.has(t.id) },
  { name: 'MMA: level changes and the ground', has: t => (t.discipline === 'mma' || (t.discipline === 'combos' && family(t) === 'mma')) && !DEFENCE.has(t.id) },
  { name: 'Defence and counters', has: t => DEFENCE.has(t.id) || t.discipline === 'counters' },
];
export const blockNo = week => Math.floor((week - 1) / 4);
export function themeOf(week) {
  const p = picks();
  for (let i = 0; i < THEMES.length; i++) { // skip themes you picked nothing for
    const th = THEMES[(blockNo(week) + i + (profile().goal === 'selfdef' ? 3 : 0)) % THEMES.length]; // self-defence starts with defence
    if (p.some(id => th.has(techById[id]))) return th;
  }
  return null;
}

// Which picked skills each garage day works on: theme skills first, plus a rotating
// "keep sharp" skill from the rest, so every pick comes up regularly.
export function programFocus(day, week) {
  const p = picks().filter(id => id !== 'stance');
  const dp = dayPlan(day, false);
  if (!p.length || !dp || dp.key === 'footwork') return [];
  const okDay = id => day !== legsDay() || !leggy(id);
  const th = themeOf(week);
  const theme = p.filter(id => th?.has(techById[id]) && okDay(id));
  const rest = p.filter(id => !theme.includes(id) && okDay(id));
  const n = dp.key === 'main' ? 3 : 2, k = (week - 1) * weekDays(false).length + dp.slot;
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
// Combinations you built yourself (My combos): the timer calls them like any other.
export const myCombos = () => (store.get().myCombos || []).filter(c => c.steps?.length).map(c => ({ say: c.say, uses: [], kick: stepsKick(c.steps), def: stepsDefFirst(c.steps), mine: true }));
export function programCombos() {
  const p = known();
  const list = [...COMBOS.filter(c => c.uses.every(id => p.has(id))), ...myCombos()];
  return list.length >= 2 ? list : null;
}

// ---------- Stage 2: fighter training ----------
// Once your skills are learned (all marked solid, or you start it yourself), the plan
// stops teaching new skills and becomes the routine a fighter repeats for years:
// combination work, defence and counters, fight rounds and conditioning.
export function stage() {
  const p = store.get().program;
  if (!p?.picks?.length) return 'none';
  if (p.fighter) return 'fighter';
  return picks().every(id => store.get().status[id] === 'done') ? 'fighter' : 'learn';
}
export const learnedCount = () => picks().filter(id => store.get().status[id] === 'done').length;


// 4-week wave, repeated forever. Week 4 is the deload.
const FVOL = [
  { label: 'Base: clean and sharp', rounds: 4, roundSecs: 180, rest: 60, pace: 'medium', burst: 4 },
  { label: 'Build: more rounds', rounds: 5, roundSecs: 180, rest: 60, pace: 'medium', burst: 6 },
  { label: 'Peak: fight pace', rounds: 6, roundSecs: 180, rest: 60, pace: 'fast', burst: 8 },
  { label: 'Deload: light and technical', rounds: 3, roundSecs: 120, rest: 60, pace: 'easy', burst: 0 },
];
export const fighterVolume = week => tune({ ...FVOL[blockWeek(week) - 1] }, true);

// Defence calls: you react with the defence, then the counter.
export const DEFENCE_CALLS = [
  { say: 'slip', uses: ['slip'] }, { say: 'slip, two', uses: ['slip', 'cross'] },
  { say: 'roll', uses: ['roll'] }, { say: 'roll, three', uses: ['roll', 'leadhook'] },
  { say: 'block, one two', uses: ['block', 'jab', 'cross'] }, { say: 'parry, one', uses: ['parry', 'jab'] },
  { say: 'pull, two', uses: ['pullcounter'] }, { say: 'slip two, move', uses: ['slipcounter', 'angleout'] },
  { say: 'check', uses: ['check'], kick: true }, { say: 'check, kick', uses: ['check', 'roundhouse'], kick: true },
  { say: 'catch, two', uses: ['catchkick'], kick: true }, { say: 'sprawl', uses: ['sprawl'], kick: true },
  { say: 'sprawl, one two', uses: ['sprawlstrike'], kick: true },
];
const KICKY = new Set([...LEGGY]);
const known = () => new Set([...picks(), ...picks().flatMap(id => techById[id].uses || []), 'stance', 'step']);
const usable = (list, noKicks) => {
  const p = known();
  return list.filter(c => c.uses.every(id => p.has(id)) && !(noKicks && (c.kick || c.uses.some(id => KICKY.has(id)))));
};
// Picked defend-and-counter combinations are called in the defence rounds too.
const counterCalls = () => COUNTER.filter(id => picks().includes(id)).map(id => ({ say: techById[id].callout.en, uses: techById[id].uses }));
export const defenceCalls = noKicks => usable([...DEFENCE_CALLS, ...counterCalls().filter(c => !DEFENCE_CALLS.some(d => d.say === c.say)), ...myCombos().filter(c => c.def)], noKicks);
export const offenceCombos = noKicks => usable([...COMBOS, ...myCombos().filter(c => !c.def)], noKicks);

// Two "combos of the week" to drill on combination day, rotating through everything you know.
export function weekCombos(week) {
  // The combinations you picked come first: two of them each week, in turn.
  const mine = [...ATTACK.filter(id => picks().includes(id)).map(id => ({ say: techById[id].callout.en, uses: techById[id].uses })), ...myCombos().filter(c => !c.def)];
  if (mine.length >= 2) { const a = (week * 2) % mine.length, b = (week * 2 + 1) % mine.length; return [...new Set([mine[a], mine[b]])]; }
  const DEF = new Set(['slip', 'parry', 'block', 'roll', 'check', 'catchkick', 'sprawl', 'sprawlstrike', 'pullcounter', 'slipcounter']);
  let list = offenceCombos(false).filter(c => c.uses.length >= 2 && !c.uses.some(id => DEF.has(id)));
  if (!list.length) list = offenceCombos(false).filter(c => c.uses.length >= 2);
  if (!list.length) return [];
  const a = (week * 2) % list.length, b = (week * 2 + 1) % list.length;
  return [...new Set([list[a], list[b]])];
}
// Two learned skills to sharpen each fighter session, rotating.
export function sharpenSkills(day, week) {
  const p = picks().filter(id => id !== 'stance' && (day !== legsDay() || !leggy(id)));
  if (!p.length) return [];
  const k = ((week - 1) * weekDays(true).length + (dayPlan(day, true)?.slot ?? 0)) * 2;
  return [...new Set([p[k % p.length], p[(k + 1) % p.length]])];
}
