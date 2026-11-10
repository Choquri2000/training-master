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
];

// Session templates. Durations in seconds.
export const SESSION_TYPES = {
  technique: {
    name: { en: 'Technique session' },
    blurb: { en: '30 min, RPE 4 to 5. Learn and polish 2 to 3 techniques. Counts as easy.' },
    build: ({ focus }) => [
      { label: { en: 'Warm-up: light bounce, arm circles, shadowbox easy' }, kind: 'warm', secs: 300 },
      ...focus.flatMap(id => [
        { label: { en: 'Technique' }, kind: 'work', secs: 120, tech: id, slow: true },
        { label: { en: 'Rest' }, kind: 'rest', secs: 45 },
        { label: { en: 'Technique' }, kind: 'work', secs: 120, tech: id },
        { label: { en: 'Rest' }, kind: 'rest', secs: 45 },
      ]),
      { label: { en: 'Shadowbox: mix what you practised, light' }, kind: 'work', secs: 180, callouts: true, pace: 'easy' },
      { label: { en: 'Cool-down: hips, shoulders, calves' }, kind: 'cool', secs: 240 },
    ],
  },
  main: {
    name: { en: 'Main session (Friday)' },
    blurb: { en: '50 to 60 min. Technique first, then rounds at RPE 6 to 7.' },
    build: ({ focus }) => [
      { label: { en: 'Warm-up: skipping in place, mobility, easy shadowbox' }, kind: 'warm', secs: 480 },
      ...focus.flatMap(id => [
        { label: { en: 'Technique' }, kind: 'work', secs: 120, tech: id },
        { label: { en: 'Rest' }, kind: 'rest', secs: 45 },
      ]),
      ...Array.from({ length: 5 }, (_, i) => [
        { label: { en: `Round ${i + 1} of 5: combos on call` }, kind: 'work', secs: 180, callouts: true, pace: i < 2 ? 'medium' : 'fast' },
        { label: { en: 'Rest' }, kind: 'rest', secs: 60 },
      ]).flat(),
      { label: { en: 'Core: dead bug, side plank, sprawls' }, kind: 'work', secs: 240 },
      { label: { en: 'Cool-down and stretch' }, kind: 'cool', secs: 300 },
    ],
  },
  footwork: {
    name: { en: 'Footwork (Saturday, optional)' },
    blurb: { en: '15 min, easy. Movement only, no hard punching.' },
    build: () => [
      { label: { en: 'Warm-up bounce' }, kind: 'warm', secs: 120 },
      { label: { en: 'Footwork on call' }, kind: 'work', secs: 180, footwork: true },
      { label: { en: 'Rest' }, kind: 'rest', secs: 45 },
      { label: { en: 'Footwork + jab on call' }, kind: 'work', secs: 180, footwork: true, callouts: true, pace: 'easy' },
      { label: { en: 'Rest' }, kind: 'rest', secs: 45 },
      { label: { en: 'Footwork on call' }, kind: 'work', secs: 180, footwork: true },
      { label: { en: 'Cool-down' }, kind: 'cool', secs: 120 },
    ],
  },
};

// Weekly plan. day: 0 = Monday ... 6 = Sunday.
// run / strength are plain text (shown only). combat names a SESSION_TYPES key.
export const WEEK = [
  { day: 0, type: 'easy', run: { en: 'Easy 5 km (6:30-7:14 /km)' }, strength: 'A', combat: null },
  { day: 1, type: 'hard', run: { en: 'Intervals: 3 x 1000 m (5:13-5:26 /km)' }, strength: null, combat: 'technique' },
  { day: 2, type: 'easy', run: { en: 'Easy 6 km + 5 x 20 s strides' }, strength: 'B', combat: null },
  { day: 3, type: 'hard', run: { en: 'Threshold 2 x 11 min, or Tempo 3.5 km on alternate weeks' }, strength: null, combat: 'technique' },
  { day: 4, type: 'combat', run: null, strength: null, combat: 'main' },
  { day: 5, type: 'easy', run: { en: 'Easy 5-6 km' }, strength: 'C', combat: 'footwork' },
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
    name: { en: 'Strength C: upper body and core' },
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
  'Lift only on easy-run days, a few hours after the run.',
  'Combat technique goes after the Tuesday and Thursday runs: keep it at RPE 4 to 5.',
  'Hard combat rounds only on Friday, the day without a run.',
  'Every 4th week is a deload: technique only, no hard rounds.',
] };
