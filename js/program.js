// "My plan": the skills you picked, turned into a repeating 4-week combat program
// for your training days (see profile.js: which days, which session, what to avoid).
import { TECHNIQUES, techById, COMBOS } from './data/techniques.js';
import { store } from './store.js';
import { stepsKick, stepsDefFirst } from './data/combos.js';
import { styleById } from './data/styles.js';
// Your chosen fighting style (profile): its skills get a slot most days and its combinations are called.
const myStyle = () => styleById[profile().style] || null;
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
// ---------- Fight or test date ----------
// With a date set, the last three weeks before it become build -> peak -> taper.
const DAY = 864e5;
const d0 = iso => new Date(iso + 'T00:00:00');
function weekStart(week) { const s = d0(store.get().startDate || '2026-11-16'); s.setDate(s.getDate() + (week - 1) * 7); return s; }
export function eventInfo() {
  const e = store.get().event; if (!e?.date) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.round((d0(e.date) - now) / DAY);
  return days >= 0 ? { ...e, days } : null;
}
// The block week that sets the volume: 1-4 as usual, or 5 = taper week before the date.
export function phaseWeek(week) {
  const e = eventInfo();
  if (e) {
    const left = Math.floor((d0(e.date) - weekStart(week)) / DAY / 7);
    if (left === 0) return 5;
    if (left === 1) return 3;
    if (left === 2) return 2;
  }
  return blockWeek(week);
}
const TAPER = { label: 'Taper: sharp and fresh', techSets: 2, rounds: 2, roundSecs: 120, rest: 60, pace: 'medium' };
const FTAPER = { label: 'Taper: sharp and fresh', rounds: 3, roundSecs: 120, rest: 60, pace: 'fast', burst: 0 };

export function volume(week) {
  const pw = phaseWeek(week);
  const v = { ...(pw === 5 ? TAPER : VOLUME[pw - 1]) };
  if (week > 4 && v.rounds) v.roundSecs = Math.min(180, v.roundSecs + 30); // later blocks: longer rounds
  return tune(v, false);
}

// ---------- Fix-it block ----------
// Two weeks where your weakest skills get a slot in every session (see Progress).
export function fixActive() {
  const f = store.get().fix; if (!f?.skills?.length) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const day = Math.floor((now - d0(f.start)) / DAY) + 1;
  return day >= 1 && day <= 14 ? { ...f, day } : null;
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
  const fx = fixActive();
  if (fx) { // fix-it block: one of your weak skills leads every session
    const fs = fx.skills.filter(id => techById[id] && suitable(id) && okDay(id));
    if (fs.length && !res.some(id => fs.includes(id))) res[0] = fs[k % fs.length];
  }
  const sty = myStyle();
  if (sty) { // one slot per day goes to your style, rotating through its skills
    const ss = sty.skills.filter(id => p.includes(id) && okDay(id));
    if (ss.length && !res.some(id => ss.includes(id))) { const pick = ss[k % ss.length]; if (res.length >= n) res[res.length - 1] = pick; else res.push(pick); }
  }
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
  const list = [...COMBOS.filter(c => c.uses.every(id => p.has(id))), ...myCombos(), ...(myStyle()?.calls || []).map(say => ({ say, uses: [] }))];
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
export const fighterVolume = week => { const pw = phaseWeek(week); return tune({ ...(pw === 5 ? FTAPER : FVOL[pw - 1]) }, true); };

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
  const sty = myStyle();
  if (sty) { // one combination of the week comes from your style
    const sc = sty.calls[week % sty.calls.length], rest = weekCombos0(week).filter(c => c.say !== sc);
    return [{ say: sc, uses: [] }, ...rest.slice(0, 1)];
  }
  return weekCombos0(week);
}
function weekCombos0(week) {
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
  const out = [...new Set([p[k % p.length], p[(k + 1) % p.length]])];
  const fx = fixActive()?.skills.filter(id => techById[id] && suitable(id));
  if (fx?.length && !out.some(id => fx.includes(id))) out[0] = fx[(week + (dayPlan(day, true)?.slot ?? 0)) % fx.length];
  const ss = (myStyle()?.skills || []).filter(id => p.includes(id));
  if (ss.length && !out.some(id => ss.includes(id))) out[out.length - 1] = ss[(week + (dayPlan(day, true)?.slot ?? 0)) % ss.length];
  return out;
}

// What to fix: skills you rated "felt off" (most recent first), plus areas your monthly
// tests point to. Returns { skills: [ids], why: [[en, ka]] }.
export function findWeak() {
  const s = store.get(), feel = s.feel || {}, why = [];
  const off = Object.keys(feel).filter(id => feel[id].r === 3 && techById[id] && suitable(id)).sort((a, b) => feel[b].date.localeCompare(feel[a].date));
  if (off.length) why.push(['Skills you rated "felt off"', 'უნარები, რომლებიც შეაფასე „არ გამოდის“']);
  const tests = s.tests || [], last = k => tests.filter(x => x.k === k).slice(-2);
  const worse = (k, up) => { const [a, b] = last(k); return a && b && (up ? b.v < a.v : b.v > a.v); };
  const add = [];
  const react = last('react').pop();
  if (react && (react.v >= 450 || worse('react', false))) { add.push('slip', 'parry', 'block'); why.push(['Reaction time: defend sooner', 'რეაქციის დრო: უფრო ადრე დაცვა']); }
  const form = last('form').pop();
  if (form && (form.v < 16 || worse('form', true))) { add.push('stance', 'step', 'jab'); why.push(['Form under fatigue: back to fundamentals', 'ტექნიკა დაღლილობისას: საფუძვლებთან დაბრუნება']); }
  if (worse('punch', true)) { add.push('jab', 'cross'); why.push(['Punch output dropped: speed work', 'დარტყმების რაოდენობა დაეცა: სისწრაფეზე მუშაობა']); }
  const skills = [...new Set([...off, ...add])].filter(id => techById[id] && suitable(id)).slice(0, 3);
  return { skills, why };
}
