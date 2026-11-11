// Your profile: who you are as a fighter. Everything the plan does adapts to it:
// where you start, which days you train, how long, how hard, what you avoid, and your stance.
import { store } from './store.js';
import { TECHNIQUES, techById } from './data/techniques.js';

export const DEFAULT_PROFILE = { level: 'some', stance: 'orth', days: [0, 2, 4], minutes: 0, goal: 'skills', kit: 'none', limits: [], other: false };
export const profile = () => ({ ...DEFAULT_PROFILE, ...(store.get().profile || {}) });
export const hasProfile = () => !!store.get().profile;

// Choices shown in the profile form. [value, English, Georgian, hint]
export const CHOICES = {
  level: [['new', 'New to it', 'ახალბედა', 'Never trained, or only a little'], ['some', 'Some experience', 'მაქვს გამოცდილება', 'Know the basics: stance, jab, cross'], ['exp', 'Experienced', 'გამოცდილი', 'Trained for a year or more']],
  stance: [['orth', 'Orthodox (left foot forward)', 'ორთოდოქსი (მარცხენა ფეხი წინ)'], ['south', 'Southpaw (right foot forward)', 'საუთპოუ (მარჯვენა ფეხი წინ)']],
  minutes: [[20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '60 min'], [0, 'Standard (30 to 60)', 'სტანდარტული (30-60)']],
  goal: [['skills', 'All-round skills', 'ყოვლისმომცველი უნარები'], ['fitness', 'Fitness', 'ფიზიკური ფორმა'], ['selfdef', 'Self-defence', 'თავდაცვა'], ['compete', 'Competition', 'შეჯიბრი']],
  kit: [['none', 'Nothing (shadowboxing)', 'არაფერი (ჩრდილთან ბრძოლა)'], ['bag', 'Heavy bag', 'ტომარა'], ['partner', 'Partner with pads', 'პარტნიორი ლაპებით']],
  limits: [['knees', 'Knees', 'მუხლები'], ['back', 'Lower back', 'წელი'], ['shoulder', 'Shoulders', 'მხრები']],
};

// ---------- which days, which session ----------
// Session patterns by number of training days. Learning stage, then fighter stage.
const LEARN = { 2: ['technique', 'main'], 3: ['technique', 'technique', 'main'], 4: ['technique', 'technique', 'main', 'footwork'], 5: ['technique', 'technique', 'main', 'technique', 'footwork'], 6: ['technique', 'technique', 'main', 'technique', 'technique', 'footwork'] };
const FIGHT = { 2: ['fcombo', 'ffight'], 3: ['fcombo', 'fdefence', 'ffight'], 4: ['fcombo', 'fdefence', 'ffight', 'footwork'], 5: ['fcombo', 'fdefence', 'ffight', 'fcombo', 'footwork'], 6: ['fcombo', 'fdefence', 'ffight', 'fcombo', 'fdefence', 'footwork'] };
export function weekDays(fighter) {
  const d = [...new Set(profile().days)].sort((a, b) => a - b);
  const pat = (fighter ? FIGHT : LEARN)[Math.min(6, Math.max(2, d.length))];
  return d.map((day, slot) => ({ day, slot, key: pat[slot] || pat[pat.length - 1] }));
}
export const dayPlan = (day, fighter) => weekDays(fighter).find(x => x.day === day) || null;
// The day kicks and knees stay off: the gym legs day, for people who also lift (shown plan).
export const legsDay = () => (profile().other ? 2 : -1);

// ---------- what to leave out ----------
const AVOID = {
  knees: ['sprawl', 'sprawlstrike', 'doubleleg', 'levelchange'],
  back: ['sprawl', 'sprawlstrike', 'doubleleg', 'levelchange', 'roll'],
  shoulder: [],
};
export function avoided() {
  const base = new Set(profile().limits.flatMap(l => AVOID[l] || []));
  const out = new Set(base);
  TECHNIQUES.forEach(x => { if (x.uses?.some(u => base.has(u))) out.add(x.id); });
  return out;
}
export const suitable = id => !!techById[id] && !avoided().has(id);

// ---------- how much ----------
// Adjust a week's volume for level, goal and how recent sessions felt.
export function tune(v, fighter) {
  const p = profile(), o = { ...v };
  if (!o.rounds) return o;
  let r = o.rounds;
  if (p.level === 'new') { r -= 1; o.roundSecs = Math.min(o.roundSecs, 120); }
  if (p.level === 'exp') r += 1;
  if (p.goal === 'compete') { r += 1; if (fighter && o.burst) o.burst += 2; }
  if (p.goal === 'fitness' && fighter && o.burst) o.burst += 2;
  r += effortShift();
  o.rounds = Math.max(2, Math.min(8, r));
  if (p.limits.includes('shoulder')) o.burst = 0;
  return o;
}
// Last 3 sessions: all very hard (RPE 9+) -> one round less; all easy (RPE 4-) -> one more.
export function effortShift() {
  const log = store.get().log.filter(e => e.type !== 'drill').slice(-3);
  if (log.length < 3) return 0;
  if (log.every(e => e.rpe >= 9)) return -1;
  if (log.every(e => e.rpe <= 4)) return 1;
  return 0;
}

// ---------- fit a built session to the person ----------
const SWAP = { en: [['Shadowbox', 'Heavy bag'], ['shadowbox', 'bag work'], ['on call', 'on call, on the bag']], ka: [['ჩრდილთან ბრძოლა', 'ტომარაზე მუშაობა'], ['ბრძანებით', 'ბრძანებით, ტომარაზე']] };
const SWAP_P = { en: [['Shadowbox', 'Pads'], ['shadowbox', 'pad work'], ['on call', 'on call, partner holds pads']], ka: [['ჩრდილთან ბრძოლა', 'ლაპებზე მუშაობა'], ['ბრძანებით', 'ბრძანებით, პარტნიორი ლაპებით']] };
const repl = (lab, table) => Object.fromEntries(Object.entries(lab).map(([k, s]) => [k, (table[k] || []).reduce((a, [x, y]) => a.split(x).join(y), s)]));
export function adaptSession(segs) {
  const p = profile(), noFloor = p.limits.includes('knees') || p.limits.includes('back');
  let out = segs.map(s => ({ ...s }));
  if (p.kit !== 'none') out.forEach(s => { if (s.kind !== 'warm' && s.kind !== 'cool' && !(s.footwork && !s.callouts)) s.label = repl(s.label, p.kit === 'bag' ? SWAP : SWAP_P); });
  if (noFloor) out.forEach(s => {
    if (/Sprawls: 30 s/.test(s.label.en)) s.label = { en: 'Fast feet: 30 s quick steps in stance, hands up', ka: 'სწრაფი ფეხები: 30 წმ სწრაფი ნაბიჯები დგომაში, ხელები ზევით' };
    if (/Core: dead bug, side plank, sprawls/.test(s.label.en)) s.label = { en: 'Core: dead bug, side plank, bird dog', ka: 'კორი: dead bug, გვერდითი პლანკი, bird dog' };
  });
  if (p.goal === 'fitness' && !out.some(s => /Punch-out/.test(s.label.en)) && out.some(s => s.callouts || s.calls)) {
    const i = out.findIndex(s => s.kind === 'cool');
    const fin = Array.from({ length: 6 }, (_, k) => [{ label: { en: `Finisher ${k + 1} of 6: fast straight punches`, ka: `ფინიში ${k + 1} / 6: სწრაფი პირდაპირი დარტყმები` }, kind: 'work', secs: 20 }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 10 }]).flat();
    if (!p.limits.includes('shoulder')) out.splice(i < 0 ? out.length : i, 0, ...fin);
  }
  if (p.minutes) out = fitTime(out, p.minutes * 60);
  return out;
}
// Fit the session to the chosen length: drop rounds (with their rest) from the end, or
// shorten warm-up and cool-down a little. Never drops the warm-up or every round.
function fitTime(segs, budget) {
  const total = a => a.reduce((s, x) => s + x.secs, 0);
  const out = [...segs];
  const warm = out.find(s => s.kind === 'warm'), cool = out.find(s => s.kind === 'cool');
  if (total(out) > budget) { if (warm) warm.secs = Math.min(warm.secs, 300); if (cool) cool.secs = Math.min(cool.secs, 180); }
  while (total(out) > budget * 1.05) {
    const works = out.map((s, i) => [s, i]).filter(([s]) => s.kind === 'work');
    if (works.length <= 2) break;
    const [, i] = works[works.length - 1 - (works.length > 3 ? 1 : 0)]; // keep the last (finisher/core) when we can
    out.splice(i, out[i + 1]?.kind === 'rest' ? 2 : 1);
  }
  return out;
}

// ---------- professional touches ----------
// Why today's session looks the way it does: one or two sentences from the coach.
export function coachNote({ key, bw, fighter, deload }) {
  const p = profile();
  const parts = [];
  if (deload) parts.push(['Deload week: lighter on purpose. Your body absorbs the last three weeks now; keep it crisp, not hard.', 'განტვირთვის კვირა: მიზანმიმართულად მსუბუქი. სხეული ახლა ბოლო სამი კვირის შედეგს ითვისებს; იმუშავე სუფთად, არა მძიმედ.']);
  else if (bw === 1) parts.push(['New block: start slow and exact. Speed comes from clean repetitions.', 'ახალი ბლოკი: დაიწყე ნელა და ზუსტად. სისწრაფე სუფთა გამეორებებიდან მოდის.']);
  else if (bw === 2) parts.push(['Build week: same skills, a bit more speed and volume.', 'ზრდის კვირა: იგივე უნარები, ცოტა მეტი სისწრაფე და მოცულობა.']);
  else if (bw === 3) parts.push(['Peak week: the hardest of the block. Push the pace but keep your form; next week is lighter.', 'პიკის კვირა: ბლოკის ყველაზე რთული. მოუმატე ტემპს, მაგრამ შეინარჩუნე ტექნიკა; შემდეგი კვირა მსუბუქია.']);
  if (key === 'technique') parts.push(['Technique day: quality over quantity. Stop a set if your form breaks.', 'ტექნიკის დღე: ხარისხი რაოდენობაზე მეტად. შეაჩერე სეტი, თუ ტექნიკა ირღვევა.']);
  if (key === 'main' || key === 'ffight') parts.push(['Rounds day: breathe out on every strike and return to guard after every combination.', 'რაუნდების დღე: ყოველ დარტყმაზე ამოისუნთქე და ყოველი კომბინაციის შემდეგ დაბრუნდი დაცვაში.']);
  if (key === 'fdefence') parts.push(['Defence day: react, defend, counter at once. Defence without a counter is only half the job.', 'დაცვის დღე: რეაქცია, დაცვა, მაშინვე კონტრი. დაცვა კონტრის გარეშე მხოლოდ ნახევარი საქმეა.']);
  if (key === 'fcombo') parts.push(['Combination day: drill the combos of the week until they come out without thinking.', 'კომბინაციების დღე: იმუშავე კვირის კომბინაციებზე, სანამ ფიქრის გარეშე არ გამოგივა.']);
  const sh = effortShift();
  if (sh < 0) parts.push(['Your last sessions felt very hard, so today has one round less.', 'ბოლო ვარჯიშები ძალიან რთული იყო, ამიტომ დღეს ერთი რაუნდით ნაკლებია.']);
  if (sh > 0) parts.push(['Your last sessions felt easy, so today has one round more.', 'ბოლო ვარჯიშები მსუბუქი იყო, ამიტომ დღეს ერთი რაუნდით მეტია.']);
  if (p.level === 'new' && !deload) parts.push(['Rounds are shorter while you are new. Learn to relax and breathe.', 'სანამ ახალბედა ხარ, რაუნდები უფრო მოკლეა. ისწავლე მოდუნება და სუნთქვა.']);
  const ka = store.get().lang === 'ka';
  return parts.slice(0, 2).map(x => x[ka ? 1 : 0]).join(' ');
}

// Safety note for a technique, by what it involves.
export function safetyNote(t) {
  const u = new Set([t.id, ...(t.uses || [])]);
  const has = (...ids) => ids.some(i => u.has(i));
  if (has('doubleleg', 'sprawl', 'sprawlstrike', 'levelchange')) return { en: 'Use a mat or carpet for anything that touches the floor. Warm up the hips and knees first; stop if a knee hurts.', ka: 'იატაკთან შეხებისთვის გამოიყენე მატი ან ხალიჩა. ჯერ გაახურე თეძოები და მუხლები; შეჩერდი, თუ მუხლი გტკივა.' };
  if (has('roundhouse', 'leadkick', 'teep', 'check', 'catchkick')) return { en: 'Warm up the hips before kicking and kick at half power until the shape is right. Pivot on the ball of the standing foot to protect the knee.', ka: 'წიხლამდე გაახურე თეძოები და ნახევარი ძალით დაარტყი, სანამ ფორმა სწორი არ იქნება. ბურჯ ფეხზე ტერფის წინა ნაწილით მოტრიალდი, რომ მუხლი დაიცვა.' };
  if (has('knee', 'clinch', 'elbow')) return { en: 'Elbows and knees are for very close range only. Drill them slowly and never at full power on a partner.', ka: 'იდაყვები და მუხლები მხოლოდ ძალიან ახლო მანძილისთვისაა. ივარჯიშე ნელა და პარტნიორზე არასდროს სრული ძალით.' };
  if (has('jab', 'cross', 'leadhook', 'rearhook', 'leaduppercut', 'rearuppercut', 'onetwo')) return { en: 'Never lock the elbow fully when punching the air; stop just short. On a bag, wrap your hands and wear gloves.', ka: 'ჰაერში დარტყმისას იდაყვი ბოლომდე არ გაშალო; ცოტა ადრე გააჩერე. ტომარაზე შეიხვიე ხელები და ჩაიცვი ხელთათმანები.' };
  return { en: 'Move at a pace you can control. Sharp pain means stop; muscle tiredness is normal.', ka: 'იმოძრავე იმ ტემპით, რომელსაც აკონტროლებ. მკვეთრი ტკივილი ნიშნავს შეჩერებას; კუნთების დაღლა ნორმალურია.' };
}

// Level by phase, shown on every skill.
export const LEVELS = { 1: { en: 'Beginner', ka: 'დამწყები' }, 2: { en: 'Intermediate', ka: 'საშუალო' }, 3: { en: 'Advanced', ka: 'მოწინავე' } };
