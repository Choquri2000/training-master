// Practical solo drills for a garage: floor footwork, bands, light dumbbells, reaction cues,
// balance, fight conditioning and strong finishes. Each one has a how-to and a timed session.
// build({ short, p }) returns timer segments. short = the "drill of the day" slice inside a plan session.
// Segment extras the player understands: cont (no bell, speak cue), silent (show, don't speak),
// colors (cue word -> colour), legend (shown under the clock), hints (call -> on-screen answer).
const B = (en, ka) => ({ en, ka });
const REST = B('Rest', 'დასვენება');
const work = (label, secs, extra = {}) => ({ label, kind: 'work', secs, ...extra });
const rest = secs => ({ label: REST, kind: 'rest', secs });
const rounds = (n, fn, restSecs) => Array.from({ length: n }, (_, i) => [...[fn(i, n)].flat(), ...(i < n - 1 ? [rest(restSecs)] : [])]).flat();

const FOOT = {
  'in out': B('Step in, step straight back out. Same distance both ways.', 'ნაბიჯი შიგნით, მაშინვე უკან. ორივე მიმართულებით ერთი მანძილი.'),
  'L step': B('Step back, then sideways: an L shape that leaves the line.', 'ნაბიჯი უკან, შემდეგ გვერდზე: L ფორმა, ხაზიდან გასვლა.'),
  'pivot left': B('Pivot on the lead foot, swing the rear foot round.', 'მოტრიალდი წინა ფეხზე, უკანა ფეხი შემოატრიალე.'),
  'pivot right': B('Step the lead foot out, then pivot to face the new line.', 'წინა ფეხი გაიტანე, შემდეგ მოტრიალდი ახალ ხაზზე.'),
  'circle left': B('Small steps along the tape, lead foot first.', 'პატარა ნაბიჯები ლენტის გასწვრივ, ჯერ წინა ფეხი.'),
  'circle right': B('Small steps the other way, rear foot first.', 'პატარა ნაბიჯები მეორე მხარეს, ჯერ უკანა ფეხი.'),
  'cut off': B('Step across the corner of the box to trap the space.', 'გადაკვეთე ყუთის კუთხე, ჩაკეტე სივრცე.'),
  'step in, one two': B('Step in behind the jab, land the 2, step out.', 'შედი ჯებით, ჩაარტყი 2, გამოდი.'),
  'angle out': B('Throw a 2, then step off at 45 degrees.', 'ჩაარტყი 2, შემდეგ გადი 45 გრადუსით.'),
};
const SNAP = ['one', 'one two', 'one one two', 'two three two', 'one two three', 'one two, roll'];
const STRAIGHT = ['one', 'one two', 'one one two', 'one two one two', 'two', 'one, one'];
const REACT = { 1: B('Jab', 'ჯები'), 2: B('Cross', 'ქროსი'), 3: B('Slip', 'სლიპი'), 4: B('Roll', 'როლი') };
const COLOR = { red: B('Block, then 3-2', 'ბლოკი, შემდეგ 3-2'), blue: B('Pivot out', 'მოტრიალდი გარეთ'), green: B('1-2 forward', '1-2 წინ'), yellow: B('Kick', 'წიხლი') };
const legendNums = B(Object.entries(REACT).map(([k, v]) => `${k} = ${v.en}`).join(' · '), Object.entries(REACT).map(([k, v]) => `${k} = ${v.ka}`).join(' · '));
const legendCols = B('Red = block, 3-2 · Blue = pivot out · Green = 1-2 forward · Yellow = kick', 'წითელი = ბლოკი, 3-2 · ლურჯი = მოტრიალება · მწვანე = 1-2 წინ · ყვითელი = წიხლი');

export const DRILLS = [
  {
    id: 'box', kit: B('Tape or chalk on the floor', 'ლენტი ან ცარცი იატაკზე'),
    name: B('Footwork box', 'ფეხის მუშაობის ყუთი'),
    why: B('Footwork that holds up under pressure comes from patterns drilled until they need no thought. The tape keeps you honest about distance and lines.', 'ზეწოლის ქვეშ ფეხის მუშაობა მაშინ მუშაობს, როცა მოძრაობები ფიქრის გარეშე ხდება. ლენტი მანძილსა და ხაზებს ზუსტად გაკონტროლებს.'),
    how: [B('Tape a square about 1 m wide on the floor, with a line through the middle.', 'იატაკზე დააწებე დაახლოებით 1 მ კვადრატი და შუაზე ხაზი.'),
      B('Stand in stance on the centre line. The timer calls a pattern; do it once, sharply, and return to stance.', 'დადექი დგომაში შუა ხაზზე. ტაიმერი ასახელებს მოძრაობას; გააკეთე ერთხელ, მკვეთრად, და დაბრუნდი დგომაში.'),
      B('Feet never cross, never closer than shoulder width. Hands stay up the whole time.', 'ფეხები არასდროს გადაიკვეთება და მხრებზე ვიწროდ არ დგება. ხელები მუდამ ზევით.')],
    mistakes: [B('Crossing the feet on circles', 'წრეზე ფეხების გადაკვეთა'), B('Bouncing high instead of gliding', 'მაღლა ხტუნვა სრიალის ნაცვლად'), B('Dropping the hands while moving', 'მოძრაობისას ხელების დაშვება')],
    build: ({ short }) => rounds(short ? 2 : 4, (i, n) => work(B(`Footwork box ${i + 1} of ${n}`, `ფეხის მუშაობის ყუთი ${i + 1} / ${n}`), short ? 90 : 120, { pool: Object.keys(FOOT), hints: FOOT, pace: i ? 'fast' : 'medium' }), 40),
  },
  {
    id: 'bands', kit: B('Light resistance band', 'მსუბუქი რეზინი'),
    name: B('Band shadowboxing', 'ჩრდილთან ბრძოლა რეზინით'),
    why: B('The band pulls your hands back to guard and makes every punch work against resistance. The last round without it makes your hands feel fast.', 'რეზინი ხელებს დაცვაში აბრუნებს და ყოველ დარტყმას წინააღმდეგობით ამუშავებს. ბოლო რაუნდი რეზინის გარეშე ხელებს აჩქარებს.'),
    how: [B('Anchor a light band behind you at chest height (a door anchor or a solid post), or loop it across your upper back and hold one end in each hand.', 'მსუბუქი რეზინი მიამაგრე უკან, მკერდის სიმაღლეზე (კარზე ან მყარ ბოძზე), ან ზურგზე შემოიხვიე და ბოლოები ხელებში დაიჭირე.'),
      B('Throw what the timer calls at about 70 percent. Return each punch to the chin under control.', 'დაარტყი ტაიმერის ბრძანებები დაახლოებით 70%-ით. ყოველი დარტყმის შემდეგ ხელი კონტროლით დააბრუნე ნიკაპთან.'),
      B('The last round is without the band: same combinations, full speed.', 'ბოლო რაუნდი რეზინის გარეშეა: იგივე კომბინაციები, სრული სისწრაფით.')],
    mistakes: [B('A band so strong it changes your form', 'იმდენად მძიმე რეზინი, რომ ტექნიკა იცვლება'), B('Snapping the elbow straight', 'იდაყვის ბოლომდე გაშლა დარტყმით'), B('Letting the band yank the hand back', 'რეზინის მიერ ხელის უკან მოქაჩვა')],
    build: ({ short }) => [
      ...rounds(short ? 1 : 3, (i, n) => work(B(`With band ${i + 1} of ${n}: snap and return`, `რეზინით ${i + 1} / ${n}: სწრაფად და დაბრუნება`), short ? 90 : 120, { pool: SNAP, pace: 'medium' }), 45),
      rest(short ? 30 : 45),
      work(B('No band: same combinations, full speed', 'რეზინის გარეშე: იგივე კომბინაციები, სრული სისწრაფით'), short ? 60 : 120, { pool: SNAP, pace: 'fast' }),
    ],
  },
  {
    id: 'bells', kit: B('Very light dumbbells (0.5-1 kg) or water bottles', 'ძალიან მსუბუქი ჰანტელები (0.5-1 კგ) ან წყლის ბოთლები'), noShoulder: true,
    name: B('Light dumbbell rounds', 'რაუნდები მსუბუქი ჰანტელებით'),
    why: B('Shoulder endurance is why hands drop in the last round. Short rounds with very light weight train the shoulders to hold the guard when tired.', 'მხრების გამძლეობის ნაკლებობის გამო ეცემა ხელები ბოლო რაუნდში. მოკლე რაუნდები ძალიან მსუბუქი წონით მხრებს დაღლილობისას დაცვის შენარჩუნებას ასწავლის.'),
    how: [B('Use the lightest weight you have, no more than 1 kg (or two small water bottles). Heavier weight hurts the elbows and slows the punch.', 'გამოიყენე ყველაზე მსუბუქი წონა, მაქსიმუმ 1 კგ (ან ორი პატარა წყლის ბოთლი). მძიმე წონა იდაყვებს აზიანებს და დარტყმას ანელებს.'),
      B('Straight punches only. Stop just short of full extension and bring the hand straight back to the chin.', 'მხოლოდ პირდაპირი დარტყმები. სრულ გაშლამდე ცოტა ადრე გაჩერდი და ხელი პირდაპირ ნიკაპთან დააბრუნე.'),
      B('Between calls keep the hands at the chin. Stop at once if a shoulder or elbow hurts.', 'ბრძანებებს შორის ხელები ნიკაპთან გეჭიროს. მხარში ან იდაყვში ტკივილზე მაშინვე გაჩერდი.')],
    mistakes: [B('Hooks or uppercuts with weights', 'ჰუკები ან აპერკოტები წონით'), B('Locking the elbow at the end', 'იდაყვის ბოლომდე ჩაკეტვა'), B('Weight too heavy', 'ზედმეტად მძიმე წონა')],
    build: ({ short }) => rounds(short ? 2 : 4, (i, n) => work(B(`Dumbbell round ${i + 1} of ${n}: straight punches, hands home`, `ჰანტელების რაუნდი ${i + 1} / ${n}: პირდაპირი დარტყმები, ხელები ადგილზე`), 60, { pool: STRAIGHT, pace: 'medium' }), 30),
  },
  {
    id: 'react', kit: B('Nothing; keep the phone where you can see it', 'არაფერი; ტელეფონი დადე ისე, რომ ხედავდე'),
    name: B('Reaction cues', 'რეაქციის ნიშნები'),
    why: B('Fights are decisions under time pressure. Cues mean you react to what you see, not to a plan, so you train the decision as well as the speed.', 'ბრძოლა დროის წნეხში მიღებული გადაწყვეტილებებია. ნიშნები გაიძულებს რეაგირებას იმაზე, რასაც ხედავ, და არა გეგმაზე: ასე ვარჯიშობს გადაწყვეტილებაც და სისწრაფეც.'),
    how: [B('Put the phone at eye height, about 2 m away. Stand in stance facing it.', 'ტელეფონი დადე თვალის სიმაღლეზე, დაახლოებით 2 მ-ში. დადექი დგომაში მისკენ.'),
      B('Round 1: numbers are spoken. Round 2: numbers only appear on screen. Round 3: colours on screen.', 'რაუნდი 1: ციფრები ხმამაღლა ითქმის. რაუნდი 2: ციფრები მხოლოდ ეკრანზე ჩანს. რაუნდი 3: ფერები ეკრანზე.'),
      B('React the moment you see it, then reset to stance. A clean answer beats a fast wrong one.', 'რეაგირება დაინახვისთანავე, შემდეგ დაბრუნდი დგომაში. სწორი პასუხი სწრაფ შეცდომას სჯობს.')],
    mistakes: [B('Guessing before the cue', 'ნიშნამდე გამოცნობა'), B('Looking down at the floor', 'იატაკზე ყურება'), B('Not resetting to stance', 'დგომაში არდაბრუნება')],
    build: ({ short }) => {
      const nums = { pool: ['1', '2', '3', '4'], gap: 1900, legend: legendNums };
      const r = [
        work(B('Reaction 1: spoken numbers', 'რეაქცია 1: ნათქვამი ციფრები'), short ? 60 : 90, nums),
        rest(30),
        work(B('Reaction 2: watch the screen', 'რეაქცია 2: უყურე ეკრანს'), short ? 60 : 90, { ...nums, silent: true }),
      ];
      if (!short) r.push(rest(30), work(B('Reaction 3: colours on screen', 'რეაქცია 3: ფერები ეკრანზე'), 90, { pool: Object.keys(COLOR), gap: 2100, silent: true, colors: true, legend: legendCols }));
      return r;
    },
  },
  {
    id: 'balance', kit: B('Nothing (a wall nearby helps at first)', 'არაფერი (თავიდან ახლოს კედელი დაგეხმარება)'),
    name: B('Balance and kicking base', 'წონასწორობა და წიხლის საყრდენი'),
    why: B('A kick is only as good as the leg you stand on. Holding positions at full extension builds the balance and hip strength that make kicks powerful and safe to throw.', 'წიხლი იმდენადაა კარგი, რამდენადაც ფეხი, რომელზეც დგახარ. სრულ გაშლაში გაჩერება ავითარებს წონასწორობას და მენჯის ძალას, რაც წიხლს ძლიერს და უსაფრთხოს ხდის.'),
    how: [B('Single-leg stands: knee of the free leg up, hands in guard, eyes on a point in front.', 'ცალ ფეხზე დგომა: თავისუფალი ფეხის მუხლი ზევით, ხელები დაცვაში, თვალი წინ ერთ წერტილზე.'),
      B('Slow kicks: 3 seconds up, hold 2 seconds at full extension, 3 seconds back to stance.', 'ნელი წიხლები: 3 წამი ზევით, 2 წამი გაჩერება სრულ გაშლაში, 3 წამი დგომაში დაბრუნება.'),
      B('Check and kick: when called, check or kick and land straight back in stance, hands up.', 'ჩეკი და წიხლი: ბრძანებაზე გააკეთე ჩეკი ან წიხლი და დაეშვი პირდაპირ დგომაში, ხელები ზევით.')],
    mistakes: [B('Leaning back to get the leg higher', 'უკან გადახრა ფეხის ასაწევად'), B('Hands dropping during the kick', 'წიხლისას ხელების დაშვება'), B('Standing on a flat, locked knee', 'დაჭიმულ, ჩაკეტილ მუხლზე დგომა')],
    build: ({ short }) => [
      work(B('Stand on the left leg, right knee up, guard up', 'დადექი მარცხენა ფეხზე, მარჯვენა მუხლი ზევით, დაცვა'), 30),
      work(B('Stand on the right leg, left knee up, guard up', 'დადექი მარჯვენა ფეხზე, მარცხენა მუხლი ზევით, დაცვა'), 30, { cont: 'switch' }),
      rest(15),
      work(B('Slow-motion kicks, rear leg: 3 s up, hold 2 s, 3 s down', 'ნელი წიხლები, უკანა ფეხი: 3 წმ ზევით, 2 წმ გაჩერება, 3 წმ დაბლა'), short ? 45 : 60),
      work(B('Slow-motion kicks, lead leg: 3 s up, hold 2 s, 3 s down', 'ნელი წიხლები, წინა ფეხი: 3 წმ ზევით, 2 წმ გაჩერება, 3 წმ დაბლა'), short ? 45 : 60, { cont: 'switch' }),
      ...(short ? [] : [rest(20), work(B('Check and kick: land back in stance every time', 'ჩეკი და წიხლი: ყოველ ჯერზე დაეშვი დგომაში'), 90, { pool: ['check', 'check', 'kick', 'switch kick', 'check, kick', 'teep'], pace: 'medium' })]),
    ],
  },
  {
    id: 'circuit', kit: B('Bench, dumbbells', 'სკამი, ჰანტელები'),
    name: B('Fight conditioning circuit', 'საბრძოლო გამძლეობის წრე'),
    why: B('A round is bursts of work with short recoveries, not a steady jog. This circuit copies that rhythm with moves that build the engine a fight needs, using kit you have.', 'რაუნდი მოკლე აფეთქებებია მცირე შესვენებებით და არა თანაბარი სირბილი. ეს წრე იმეორებს ამ რიტმს და იმ გამძლეობას ავითარებს, რაც ბრძოლას სჭირდება, შენი ინვენტარით.'),
    how: [B('Five stations of 30 seconds each, straight after one another, then a rest. That is one round.', 'ხუთი სადგური, თითო 30 წამი, ერთმანეთის მიყოლებით, შემდეგ დასვენება. ეს ერთი რაუნდია.'),
      B('Work hard but keep form: good technique tired is what this drill trains.', 'იმუშავე ძლიერად, მაგრამ შეინარჩუნე ტექნიკა: სწორედ დაღლილ მდგომარეობაში კარგ ტექნიკას ავარჯიშებს ეს დრილი.'),
      B('On strength days use moderate dumbbells for the rows, not your heaviest.', 'ძალის დღეებში რიგებისთვის ზომიერი ჰანტელები გამოიყენე, არა ყველაზე მძიმე.')],
    mistakes: [B('Sloppy sprawls with the hips high', 'ცუდი სპრაული მაღლა აწეული მენჯით'), B('Rounding the back on rows', 'ზურგის მოხრა რიგებზე'), B('Going all-out in round 1 and dying', 'პირველივე რაუნდში მთელი ძალის დახარჯვა')],
    build: ({ short, p }) => {
      const noFloor = p?.limits?.includes('knees') || p?.limits?.includes('back');
      const st = [
        B('Punch-out: fast straight punches', 'სწრაფი პირდაპირი დარტყმები'),
        noFloor ? B('Fast feet in stance, hands up', 'სწრაფი ფეხები დგომაში, ხელები ზევით') : B('Sprawls, back to stance each time', 'სპრაულები, ყოველ ჯერზე დგომაში დაბრუნება'),
        p?.limits?.includes('knees') ? B('Shadowbox moving: in, out, angles', 'ჩრდილთან ბრძოლა მოძრაობით: შიგნით, გარეთ, კუთხეები') : B('Bench step-ups, alternate legs', 'სკამზე ასვლა, ფეხების მონაცვლეობით'),
        p?.limits?.includes('back') ? B('Band rows, squeeze the shoulder blades', 'რეზინის რიგები, ბეჭების მოჭერა') : B('Dumbbell rows, one hand on the bench', 'ჰანტელის რიგები, ერთი ხელი სკამზე'),
        B('Easy shadowbox: breathe, hands up', 'მსუბუქი ჩრდილთან ბრძოლა: ისუნთქე, ხელები ზევით'),
      ];
      return rounds(short ? 1 : 3, (i, n) => st.map((s, k) => work(B(`Circuit ${i + 1}/${n}: ${s.en}`, `წრე ${i + 1}/${n}: ${s.ka}`), 30, k ? { cont: 'next' } : {})), 60);
    },
  },
  {
    id: 'last30', kit: B('Nothing', 'არაფერი'),
    name: B('Last 30 seconds', 'ბოლო 30 წამი'),
    why: B('Judges remember how a round ends, and tired fighters fade. Training an all-out finish when you are already tired teaches you to win the end of every round.', 'მსაჯებს ახსოვთ, როგორ მთავრდება რაუნდი, დაღლილი მებრძოლი კი ქრება. დაღლილობისას მაქსიმალური ფინიშის ვარჯიში გასწავლის ყოველი რაუნდის ბოლოს მოგებას.'),
    how: [B('Each round starts technical: clean combinations on call, at a steady pace.', 'ყოველი რაუნდი ტექნიკურად იწყება: სუფთა კომბინაციები ბრძანებით, თანაბარ ტემპში.'),
      B('At 30 seconds to go the timer shouts: go all-out with your best combinations until the bell.', 'ბოლომდე 30 წამით ადრე ტაიმერი გეტყვის: დაარტყი შენი საუკეთესო კომბინაციები მაქსიმუმით ზარამდე.'),
      B('All-out still means hands back to guard and moving the head.', 'მაქსიმუმიც ნიშნავს, რომ ხელები დაცვაში ბრუნდება და თავი მოძრაობს.')],
    mistakes: [B('Saving energy in the first two minutes so the finish is easy', 'პირველ ორ წუთში ძალის დაზოგვა, რომ ფინიში ადვილი იყოს'), B('Arm punching without the legs', 'მხოლოდ ხელით დარტყმა ფეხების გარეშე'), B('Dropping the guard when tired', 'დაღლილობისას დაცვის დაშვება')],
    build: ({ short }) => rounds(short ? 2 : 3, (i, n) => [
      work(B(`Round ${i + 1} of ${n}: technical, on call`, `რაუნდი ${i + 1} / ${n}: ტექნიკურად, ბრძანებით`), short ? 90 : 150, { calls: 'combos', pace: 'medium' }),
      work(B('LAST 30 SECONDS: all-out to the bell', 'ბოლო 30 წამი: მაქსიმუმი ზარამდე'), 30, { cont: 'last thirty, all out', pool: ['go', 'one two', 'one two three two', 'keep going', 'hands back'], gap: 2200 }),
    ], 60),
  },
];
export const drillById = Object.fromEntries(DRILLS.map(d => [d.id, d]));
export const COLORS = { red: '#d33', blue: '#2a6fdb', green: '#2b9a4a', yellow: '#e0b000' };

// Which drills fit which plan session (drill of the day, rotates weekly).
const FIT = { technique: ['react', 'balance', 'box'], main: ['box', 'bands', 'balance'], footwork: ['box', 'balance'], fcombo: ['bands', 'bells', 'react'], fdefence: ['react', 'box'], ffight: ['last30', 'circuit'] };
export function drillOfDay(kind, week, p) {
  if (!FIT[kind]) return null;
  const list = (FIT[kind] || []).filter(id => !(drillById[id].noShoulder && p?.limits?.includes('shoulder')));
  return list.length ? drillById[list[week % list.length]] : null;
}

// Put the drill of the day into a built plan session. "Last 30 seconds" on fight day turns the
// end of every fight round into a finish; the others go in as a short block before the core or cool-down.
export function withDrill(segs, kind, week, p) {
  const d = drillOfDay(kind, week, p); if (!d) return segs;
  if (d.id === 'last30' && segs.some(s => s.calls === 'fight')) return segs.flatMap(s => s.calls === 'fight' && s.secs > 90
    ? [{ ...s, secs: s.secs - 30, drill: d.id }, { label: B('Last 30 seconds: all-out to the bell', 'ბოლო 30 წამი: მაქსიმუმი ზარამდე'), kind: 'work', secs: 30, cont: 'last thirty, all out', calls: 'fight', gap: 2200, drill: d.id }]
    : [s]);
  const block = d.build({ short: true, p }).map(s => ({ ...s, drill: d.id, label: s.kind === 'rest' ? s.label : B(`Drill of the day · ${s.label.en}`, `დღის დრილი · ${s.label.ka}`) }));
  let i = segs.findIndex(s => /^Core/.test(s.label.en)); if (i < 0) i = segs.findIndex(s => s.kind === 'cool'); if (i < 0) i = segs.length;
  return [...segs.slice(0, i), { label: REST, kind: 'rest', secs: 30 }, ...block, { label: REST, kind: 'rest', secs: 30 }, ...segs.slice(i)];
}
