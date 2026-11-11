// Learning pathway phases and the weekly plan (all three training types).
// Running and strength are shown for context only; the app tracks combat skills.

export const PHASES = [
  {
    phase: 1, weeks: '1-4',
    name: { en: 'Foundations' },
    goal: { en: 'Stance, footwork, the two straight punches, basic defense, the teep and the body kick.' },
    checkpoint: { en: 'Film 3 rounds of shadowboxing: guard stays up, feet never cross or close, every punch returns to the face.' },
  },
  {
    phase: 2, weeks: '5-8',
    name: { en: 'Combinations' },
    goal: { en: 'Hooks, uppercuts, rolling, the switch kick and knees, plus level changes and getting up.' },
    checkpoint: { en: 'Film 1-2-3 + kick at full speed: the rear hand never leaves the chin, and you land balanced in stance.' },
  },
  {
    phase: 3, weeks: '9-12',
    name: { en: 'Counters & range' },
    goal: { en: 'Counter-punching, angles, elbows, the clinch, catching kicks and takedown entries.' },
    checkpoint: { en: 'Film 3 rounds mixing ranges, where every combo ends with defense or an angle.' },
  },
  {
    phase: 4, weeks: '13+',
    name: { en: 'Advanced weapons' },
    goal: { en: 'Calf kicks, liver shots, the superman punch, spinning strikes, the flying knee and the question mark kick, once the basics are solid.' },
    checkpoint: { en: 'Film 3 rounds where each advanced strike appears at least twice, set up by a basic one, and you land balanced every time.' },
  },
];

// Session templates. Durations in seconds.
export const SESSION_TYPES = {
  technique: {
    name: { en: 'Technique session', ka: 'ტექნიკის ვარჯიში' },
    blurb: { en: '30 min, RPE 4 to 5. Learn and polish 2 to 3 techniques.', ka: '30 წთ, RPE 4-5. ისწავლე და დახვეწე 2-3 ტექნიკა.' },
    build: ({ focus, v = {} }) => [
      { label: { en: 'Warm-up: light bounce, arm circles, shadowbox easy', ka: 'გახურება: მსუბუქი ხტუნვა, ხელების ბრუნვა, მსუბუქი ჩრდილთან ბრძოლა' }, kind: 'warm', secs: 300 },
      ...focus.flatMap(id => Array.from({ length: v.techSets || 2 }, (_, k) => [
        { label: { en: `Technique, set ${k + 1}${k === 0 ? ' (slow)' : ''}`, ka: `ტექნიკა, სეტი ${k + 1}${k === 0 ? ' (ნელა)' : ''}` }, kind: 'work', secs: 120, tech: id, slow: k === 0 },
        { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 45 },
      ]).flat()),
      { label: { en: 'Shadowbox: mix what you practised, light', ka: 'ჩრდილთან ბრძოლა: შეურიე ნავარჯიშები, მსუბუქად' }, kind: 'work', secs: 180, callouts: true, pace: 'easy' },
      { label: { en: 'Cool-down: hips, shoulders, calves', ka: 'გაგრილება: თეძოები, მხრები, წვივები' }, kind: 'cool', secs: 240 },
    ],
  },
  main: {
    name: { en: 'Main session', ka: 'მთავარი ვარჯიში' },
    blurb: { en: '50 to 60 min. Technique first, then rounds at RPE 6 to 7.', ka: '50-60 წთ. ჯერ ტექნიკა, შემდეგ რაუნდები RPE 6-7-ზე.' },
    build: ({ focus, v = {} }) => [
      { label: { en: 'Warm-up: skipping in place, mobility, easy shadowbox', ka: 'გახურება: ადგილზე ხტუნვა, მოქნილობა, მსუბუქი ჩრდილთან ბრძოლა' }, kind: 'warm', secs: 480 },
      ...focus.flatMap(id => [
        { label: { en: 'Technique', ka: 'ტექნიკა' }, kind: 'work', secs: 120, tech: id },
        { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 45 },
      ]),
      ...Array.from({ length: v.rounds ?? 5 }, (_, i) => [
        { label: { en: `Round ${i + 1} of ${v.rounds ?? 5}: combos on call`, ka: `რაუნდი ${i + 1} / ${v.rounds ?? 5}: კომბინაციები ბრძანებით` }, kind: 'work', secs: v.roundSecs || 180, callouts: true, pace: v.pace && i >= 2 ? v.pace : (i < 2 ? 'medium' : 'fast') },
        { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: v.rest || 60 },
      ]).flat(),
      { label: { en: 'Core: dead bug, side plank, sprawls', ka: 'კორი: dead bug, გვერდითი პლანკი, სპრაულები' }, kind: 'work', secs: 240 },
      { label: { en: 'Cool-down and stretch', ka: 'გაგრილება და გაჭიმვა' }, kind: 'cool', secs: 300 },
    ],
  },
  footwork: {
    name: { en: 'Footwork (optional)', ka: 'ფეხის მოძრაობა (არასავალდებულო)' },
    blurb: { en: '15 min, easy. Movement only, no hard punching.', ka: '15 წთ, მსუბუქად. მხოლოდ მოძრაობა, ძლიერი დარტყმების გარეშე.' },
    build: () => [
      { label: { en: 'Warm-up bounce', ka: 'გახურება: ხტუნვა' }, kind: 'warm', secs: 120 },
      { label: { en: 'Footwork on call', ka: 'ფეხის მოძრაობა ბრძანებით' }, kind: 'work', secs: 180, footwork: true },
      { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 45 },
      { label: { en: 'Footwork + jab on call', ka: 'ფეხის მოძრაობა + ჯები ბრძანებით' }, kind: 'work', secs: 180, footwork: true, callouts: true, pace: 'easy' },
      { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 45 },
      { label: { en: 'Footwork on call', ka: 'ფეხის მოძრაობა ბრძანებით' }, kind: 'work', secs: 180, footwork: true },
      { label: { en: 'Cool-down', ka: 'გაგრილება' }, kind: 'cool', secs: 120 },
    ],
  },
  // ---- Stage 2: fighter training (the long-term routine) ----
  fcombo: {
    name: { en: 'Combinations and technique', ka: 'კომბინაციები და ტექნიკა' },
    blurb: { en: 'Shadowbox, drill the combos of the week until they are automatic, sharpen two skills.', ka: 'ჩრდილთან ბრძოლა, კვირის კომბინაციების დამუშავება ავტომატიზმამდე, ორი უნარის დახვეწა.' },
    build: ({ focus, v = {}, combos = [] }) => [
      { label: { en: 'Warm-up: skipping in place, mobility, easy shadowbox', ka: 'გახურება: ადგილზე ხტუნვა, მოქნილობა, მსუბუქი ჩრდილთან ბრძოლა' }, kind: 'warm', secs: 360 },
      ...[1, 2].flatMap(n => [{ label: { en: `Shadowbox round ${n}: combos on call`, ka: `ჩრდილთან ბრძოლა, რაუნდი ${n}: კომბინაციები ბრძანებით` }, kind: 'work', secs: v.roundSecs || 180, calls: 'combos', pace: 'easy' }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: v.rest || 60 }]),
      ...combos.flatMap(c => [1, 2].flatMap(n => [{ label: { en: `Combo drill: "${c.say}". Every rep clean, reset to guard`, ka: `კომბინაციის დრილი: „${c.say}“. ყოველი გამეორება სუფთად, დაბრუნდი დაცვაში` }, kind: 'work', secs: v.roundSecs || 180, repeat: c.say, pace: n === 1 ? 'easy' : 'medium' }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: v.rest || 60 }])),
      ...focus.flatMap(id => [{ label: { en: 'Sharpen', ka: 'დახვეწა' }, kind: 'work', secs: 120, tech: id }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 30 }]),
      { label: { en: 'Cool-down and stretch', ka: 'გაგრილება და გაჭიმვა' }, kind: 'cool', secs: 240 },
    ],
  },
  fdefence: {
    name: { en: 'Defence, footwork and counters', ka: 'დაცვა, ფეხის მოძრაობა და კონტრები' },
    blurb: { en: 'Easy on the legs: no hard kicks. Move, defend on call and counter straight away.', ka: 'ფეხებისთვის მსუბუქი: ძლიერი წიხლების გარეშე. იმოძრავე, დაიცავი ბრძანებით და მაშინვე კონტრი.' },
    build: ({ focus, v = {} }) => [
      { label: { en: 'Warm-up: light bounce, arm circles, shadowbox easy', ka: 'გახურება: მსუბუქი ხტუნვა, ხელების ბრუნვა, მსუბუქი ჩრდილთან ბრძოლა' }, kind: 'warm', secs: 300 },
      { label: { en: 'Footwork on call', ka: 'ფეხის მოძრაობა ბრძანებით' }, kind: 'work', secs: 180, footwork: true },
      { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 45 },
      ...Array.from({ length: Math.max(2, (v.rounds || 4) - 1) }, (_, i) => [{ label: { en: `Defence round ${i + 1} of ${Math.max(2, (v.rounds || 4) - 1)}: defend, then counter`, ka: `დაცვის რაუნდი ${i + 1} / ${Math.max(2, (v.rounds || 4) - 1)}: დაიცავი, შემდეგ კონტრი` }, kind: 'work', secs: v.roundSecs || 180, calls: 'defence', noKicks: true, pace: v.pace }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: v.rest || 60 }]).flat(),
      { label: { en: 'Hands only: combos on call', ka: 'მხოლოდ ხელები: კომბინაციები ბრძანებით' }, kind: 'work', secs: v.roundSecs || 180, calls: 'combos', noKicks: true, pace: v.pace },
      { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 45 },
      ...focus.flatMap(id => [{ label: { en: 'Sharpen', ka: 'დახვეწა' }, kind: 'work', secs: 120, tech: id }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 30 }]),
      { label: { en: 'Cool-down: hips, shoulders, calves', ka: 'გაგრილება: თეძოები, მხრები, წვივები' }, kind: 'cool', secs: 240 },
    ],
  },
  ffight: {
    name: { en: 'Fight rounds and conditioning', ka: 'საბრძოლო რაუნდები და გამძლეობა' },
    blurb: { en: 'The hard day: full rounds mixing attack, defence and movement, then a conditioning finisher.', ka: 'რთული დღე: სრული რაუნდები შეტევით, დაცვით და მოძრაობით, ბოლოს გამძლეობის ფინიში.' },
    build: ({ v = {} }) => [
      { label: { en: 'Warm-up: skipping in place, mobility, easy shadowbox', ka: 'გახურება: ადგილზე ხტუნვა, მოქნილობა, მსუბუქი ჩრდილთან ბრძოლა' }, kind: 'warm', secs: 480 },
      ...Array.from({ length: v.rounds || 4 }, (_, i) => [{ label: { en: `Fight round ${i + 1} of ${v.rounds || 4}: attack, defend, move`, ka: `საბრძოლო რაუნდი ${i + 1} / ${v.rounds || 4}: შეტევა, დაცვა, მოძრაობა` }, kind: 'work', secs: v.roundSecs || 180, calls: 'fight', pace: i === 0 ? 'medium' : (v.pace || 'medium') }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: v.rest || 60 }]).flat(),
      ...Array.from({ length: v.burst || 0 }, (_, i) => [{ label: { en: `Punch-out ${i + 1} of ${v.burst}: straight punches, all-out`, ka: `სწრაფი დარტყმები ${i + 1} / ${v.burst}: პირდაპირი დარტყმები, მაქსიმუმი` }, kind: 'work', secs: 20 }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 10 }]).flat(),
      ...(v.burst ? [{ label: { en: 'Sprawls: 30 s, as many as you can with good form', ka: 'სპრაულები: 30 წმ, რაც შეიძლება მეტი, სწორი ტექნიკით' }, kind: 'work', secs: 30 }, { label: { en: 'Rest', ka: 'დასვენება' }, kind: 'rest', secs: 30 }] : []),
      { label: { en: 'Core: dead bug, side plank, sprawls', ka: 'კორი: dead bug, გვერდითი პლანკი, სპრაულები' }, kind: 'work', secs: 240 },
      { label: { en: 'Cool-down and stretch', ka: 'გაგრილება და გაჭიმვა' }, kind: 'cool', secs: 300 },
    ],
  },
};

// Weekly plan. day: 0 = Monday ... 6 = Sunday.
// run / strength are plain text (shown only). combat names a SESSION_TYPES key.
export const WEEK = [
  { day: 0, type: 'garage', run: { en: 'Easy 5 km (6:30-7:14 /km)' }, strength: 'A', combat: 'technique' },
  { day: 1, type: 'hard', run: { en: 'Intervals: 3 x 1000 m (5:13-5:26 /km)' }, strength: null, combat: null },
  { day: 2, type: 'garage', run: { en: 'Easy 6 km + 5 x 20 s strides' }, strength: 'B', combat: 'technique' },
  { day: 3, type: 'hard', run: { en: 'Threshold 2 x 11 min, or Tempo 3.5 km on alternate weeks' }, strength: null, combat: null },
  { day: 4, type: 'garage', run: null, strength: 'C', combat: 'main' },
  { day: 5, type: 'easy', run: { en: 'Easy 5-6 km' }, strength: null, combat: 'footwork' },
  { day: 6, type: 'long', run: { en: 'Long run 12 km' }, strength: null, combat: null },
];

export const DAY_NAMES = { en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };

export const STRENGTH = {
  A: {
    name: { en: 'Strength A: upper body' },
    items: [
      ['Dumbbell bench press (flat)', '3 x 8-12'],
      ['Single-arm dumbbell row', '3 x 8-10 each'],
      ['Seated overhead press', '3 x 8-12'],
      ['Bent-over reverse flys', '2 x 15'],
      ['Hammer curls', '2 x 10-12'],
      ['Lying skullcrushers', '2 x 10-12'],
    ],
  },
  B: {
    name: { en: 'Strength B: legs and core' },
    items: [
      ['Goblet squat', '3 x 10-12'],
      ['Dumbbell Romanian deadlift', '3 x 10-12'],
      ['Reverse lunge', '2 x 10 each leg'],
      ['Single-leg calf raise', '3 x 15 each'],
      ['Dead bug', '3 x 10 each side'],
    ],
  },
  C: {
    name: { en: 'Strength C: upper body and core (after Friday combat)' },
    items: [
      ['Incline dumbbell press', '3 x 8-12'],
      ['Double-arm bent-over row', '3 x 10-12'],
      ['Dumbbell pullover', '2 x 10-12'],
      ['Lateral raises', '3 x 12-15'],
      ['Push-ups (deficit or diamond)', '2 x close to failure'],
      ['Russian twists + side plank', '2 x 20 / 2 x 30 s each'],
    ],
  },
};

export const RULES = { en: [
  'Garage days are Monday, Wednesday and Friday: combat and strength in one visit.',
  'Combat first, strength second. Skill work needs a fresh body; lifting tired is safer than learning tired.',
  'Monday and Wednesday: run in the morning (easy), garage later in the day.',
  'Wednesday is legs day, so keep that combat session to technique and footwork, no hard kicking.',
  'Hard combat rounds only on Friday, the day without a run. Strength C after it is upper body and core only.',
  'Tuesday, Thursday and Sunday are run-only days, so the key runs stay fresh. Saturday footwork is optional.',
  'Every 4th week is a deload: technique only, no hard rounds, half the strength sets.',
] };

// ---------- Georgian ----------
const KA_PHASES = [
  ['საფუძვლები', 'დგომა, ფეხის მოძრაობა, ორი პირდაპირი დარტყმა, საბაზისო დაცვა, თიპი და ტანის წიხლი.', 'გადაიღე 3 რაუნდი ჩრდილთან ბრძოლა: დაცვა მაღლაა, ფეხები არ ჯვარედინდება და არ ერთდება, ყოველი დარტყმა სახეს უბრუნდება.'],
  ['კომბინაციები', 'ჰუკები, აპერკოტები, როლი, წიხლი ფეხის შეცვლით და მუხლები, ასევე დონის შეცვლა და წამოდგომა.', 'გადაიღე 1-2-3 + წიხლი სრული სიჩქარით: უკანა ხელი ნიკაპს არ შორდება და დგომაში წონასწორულად ეშვები.'],
  ['კონტრები და მანძილი', 'კონტრ-დარტყმები, კუთხეები, იდაყვები, კლინჩი, წიხლის დაჭერა და ჩამოგდების შესვლები.', 'გადაიღე 3 რაუნდი სხვადასხვა მანძილზე, სადაც ყოველი კომბინაცია დაცვით ან კუთხით მთავრდება.'],
  ['მოწინავე იარაღი', 'წვივის წიხლი, ღვიძლზე დარტყმა, სუპერმენ-დარტყმა, მბრუნავი დარტყმები, მფრინავი მუხლი და „კითხვის ნიშანი“ წიხლი, როცა საფუძვლები მყარია.', 'გადაიღე 3 რაუნდი, სადაც ყოველი მოწინავე დარტყმა მინიმუმ ორჯერ ჩნდება, საბაზისო დარტყმით მომზადებული, და ყოველ ჯერზე წონასწორულად დგები.'],
];
PHASES.forEach((p, i) => { [p.name.ka, p.goal.ka, p.checkpoint.ka] = KA_PHASES[i]; });
const KA_RUN = ['მსუბუქი 5 კმ (6:30-7:14 /კმ)', 'ინტერვალები: 3 x 1000 მ (5:13-5:26 /კმ)', 'მსუბუქი 6 კმ + 5 x 20 წმ აჩქარება',
  'ზღვრული 2 x 11 წთ, ან ტემპი 3.5 კმ მონაცვლე კვირებში', null, 'მსუბუქი 5-6 კმ', 'გრძელი სირბილი 12 კმ'];
WEEK.forEach((d, i) => { if (d.run) d.run.ka = KA_RUN[i]; });
DAY_NAMES.ka = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა'];
STRENGTH.A.name.ka = 'ძალა A: ზედა ტანი';
STRENGTH.B.name.ka = 'ძალა B: ფეხები და კორი';
STRENGTH.C.name.ka = 'ძალა C: ზედა ტანი და კორი (პარასკევის ორთაბრძოლის შემდეგ)';
RULES.ka = [
  'ავტოფარეხის დღეებია ორშაბათი, ოთხშაბათი და პარასკევი: ორთაბრძოლა და ძალა ერთ ვიზიტში.',
  'ჯერ ორთაბრძოლა, შემდეგ ძალა. უნარს ახალი სხეული სჭირდება; დაღლილმა აწიო უფრო უსაფრთხოა, ვიდრე დაღლილმა ისწავლო.',
  'ორშაბათი და ოთხშაბათი: დილით სირბილი (მსუბუქი), ავტოფარეხი დღის ბოლოს.',
  'ოთხშაბათი ფეხების დღეა, ამიტომ იმ დღის ორთაბრძოლა მხოლოდ ტექნიკა და ფეხის მოძრაობაა, ძლიერი წიხლების გარეშე.',
  'მძიმე რაუნდები მხოლოდ პარასკევს, სირბილის გარეშე დღეს. მის შემდეგ ძალა C მხოლოდ ზედა ტანი და კორია.',
  'სამშაბათი, ხუთშაბათი და კვირა მხოლოდ სირბილის დღეებია, რომ მთავარი სირბილები ახალი ძალით გაიარო. შაბათის ფეხის მოძრაობა არასავალდებულოა.',
  'ყოველი მე-4 კვირა განტვირთვაა: მხოლოდ ტექნიკა, მძიმე რაუნდების გარეშე, ძალის სეტების ნახევარი.',
];
