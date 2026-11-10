// Keyframes for the 3D figure (see figure.js). World units are roughly centimetres.
// x = toward the target, y = up, z = the fighter's right. Orthodox stance (left side leads).
// Each keyframe overrides fields of GUARD:
//   p: pelvis [x,y,z]   py: pelvis yaw (deg)   cy: chest yaw   ln: lean forward (deg)   tl: lean sideways (+ = right)
//   lh/rh: lead/rear fist [x,y,z]   lf/rf: lead/rear ankle [x,y,z]   lfy/rfy: foot direction (deg)
//   pole: { le, re, lk, rk } bend direction hints for elbows/knees   ms: duration   label: step-mode caption

export const GUARD = {
  p: [0, 88, 0], py: 40, cy: 45, ln: 6, tl: 0,
  lh: [30, 148, -6], rh: [15, 146, 9],
  lf: [28, 9, -13], rf: [-30, 12, 15], lfy: 12, rfy: 50,
  pole: {},
};

const K = (ms, o = {}, label) => ({ ms, label, ...o });

// Reusable pieces
const guard = (ms = 300, label = 'Back to guard') => K(ms, {}, label);
const MMA = { p: [0, 80, 0], lf: [32, 9, -17], rf: [-33, 12, 19], lh: [36, 138, -8], rh: [22, 136, 9] };
const CROSS = { p: [6, 88, 0], py: 5, cy: -25, ln: 10, rh: [74, 146, -2], lh: [24, 151, -4], rf: [-28, 18, 14], rfy: 85 };
const JAB = { p: [3, 88, 0], cy: 62, ln: 8, lh: [80, 146, -8] };
const SPRAWL = { p: [-35, 32, 0], py: 0, cy: 0, ln: 72, lf: [-112, 6, -20], rf: [-112, 6, 20], lfy: 0, rfy: 0,
  lh: [42, 20, -16], rh: [42, 20, 16], pole: { lk: [0, -1, 0], rk: [0, -1, 0] } };

export const POSES = {
  stance: [K(500, {}, 'Stance and guard'), K(500, { p: [0, 85, 0], rf: [-30, 10, 15] }, 'Stay light, knees soft')],

  step: [
    guard(300, 'Stance'),
    K(220, { lf: [44, 13, -13] }, 'Lead foot steps first'),
    K(260, { p: [14, 88, 0], lf: [44, 9, -13], rf: [-14, 12, 15], lh: [44, 148, -6], rh: [29, 146, 9] }, 'Rear foot drags in: same width'),
    K(300, { p: [14, 88, 0], lf: [44, 9, -13], rf: [-30, 13, 15], lh: [44, 148, -6], rh: [29, 146, 9] }, 'Rear foot steps back first'),
    K(260, {}, 'Lead foot follows'),
  ],

  pivot: [
    guard(300, 'Stance'),
    K(380, { py: 0, cy: 5, rf: [-12, 12, 40], rfy: 10, lfy: -20, lh: [28, 148, 8], rh: [18, 146, 24] }, 'Spin on the lead ball of foot, rear foot swings round'),
    K(400, { py: 0, cy: 5, rf: [-12, 12, 40], rfy: 10, lfy: -20, lh: [28, 148, 8], rh: [18, 146, 24] }, 'New angle, hands still up'),
    guard(400),
  ],

  jab: [guard(300, 'Guard'), K(130, JAB, 'Fist turns over, shoulder covers chin'), guard(220, 'Snap back on the same line')],

  cross: [
    guard(300, 'Guard'),
    K(160, CROSS, 'Rear heel turns out, hip drives, shoulder to chin'),
    guard(260, 'Back to guard'),
  ],

  slip: [
    guard(300, 'Guard'),
    K(220, { p: [4, 82, 9], ln: 12, tl: 12, cy: 30, lh: [32, 142, 2], rh: [18, 140, 16], pole: {} }, 'Bend the knees, head moves just off the line'),
    guard(260, 'Back to centre'),
  ],

  parry: [
    guard(300, 'Guard'),
    K(140, { rh: [34, 147, -4] }, 'Rear hand taps the jab'),
    K(140, { rh: [26, 138, -2] }, 'Small movement, close to the face'),
    guard(260),
  ],

  block: [
    guard(300, 'Guard'),
    K(200, { p: [0, 84, 0], lh: [14, 160, -14], rh: [8, 160, 13], pole: { le: [0.3, -1, -0.4], re: [0.3, -1, 0.4] } }, 'Gloves to temples, elbows tight'),
    K(400, { p: [0, 84, 0], lh: [14, 160, -14], rh: [8, 160, 13], pole: { le: [0.3, -1, -0.4], re: [0.3, -1, 0.4] } }, 'Chin tucked, eyes open'),
    guard(300),
  ],

  teep: [
    guard(300, 'Guard'),
    K(200, { p: [-2, 92, 0], ln: -4, lf: [30, 62, -12], lfy: 0, pole: { lk: [1, 0.4, 0] } }, 'Chamber: knee up first'),
    K(180, { p: [-6, 92, 0], ln: -16, lf: [86, 94, -10], lfy: 0, pole: { lk: [1, 0.6, 0] } }, 'Push the foot through the belly'),
    K(160, { p: [-2, 92, 0], ln: -4, lf: [30, 62, -12], lfy: 0, pole: { lk: [1, 0.4, 0] } }, 'Pull back to chamber'),
    guard(260),
  ],

  roundhouse: [
    guard(300, 'Guard'),
    K(180, { lf: [34, 9, -24], lfy: -40, py: 25 }, 'Step out, lead toes turned out'),
    K(160, { p: [6, 91, 0], py: -10, cy: 0, ln: -6, tl: -8, lf: [34, 14, -24], lfy: -100, rf: [10, 60, 30], rfy: 0,
      pole: { rk: [0.5, 0.6, 0.4] } }, 'Rise on the ball of the foot, hip starts to turn'),
    K(200, { p: [8, 92, -2], py: -55, cy: -30, ln: -14, tl: -18, lf: [34, 15, -24], lfy: -150, rf: [86, 110, -26], rfy: -90,
      lh: [22, 152, -12], rh: [-24, 104, 22], pole: { rk: [0.2, 1, 0], re: [0, -1, 1] } }, 'Hip turns over, shin lands, rear arm swings back'),
    K(200, { lf: [34, 9, -24], lfy: -40, py: 25 }, 'Same path back'),
    guard(300),
  ],

  check: [
    guard(300, 'Guard'),
    K(200, { p: [-2, 90, 0], lf: [26, 54, -20], lfy: 0, lh: [28, 136, -12], pole: { lk: [0.6, 1, -0.5] } }, 'Knee up and out, shin faces the kick'),
    K(400, { p: [-2, 90, 0], lf: [26, 54, -20], lfy: 0, lh: [28, 136, -12], pole: { lk: [0.6, 1, -0.5] } }, 'Elbow and knee close together'),
    guard(300),
  ],

  switchstance: [
    K(400, MMA, 'MMA stance: lower, wider, hands forward'),
    K(240, { ...MMA, p: [0, 84, 0], lf: [8, 20, -17], rf: [-6, 20, 19] }, 'Small hop'),
    K(240, { ...MMA, py: -40, cy: -45, lf: [-33, 12, -19], rf: [32, 9, 17], lfy: -50, rfy: -12, lh: [22, 136, -9], rh: [36, 138, 8] }, 'Land in the other stance'),
    K(500, { ...MMA, py: -40, cy: -45, lf: [-33, 12, -19], rf: [32, 9, 17], lfy: -50, rfy: -12, lh: [22, 136, -9], rh: [36, 138, 8] }, 'Balanced, hands up'),
    K(400, MMA, 'Switch back'),
  ],

  sprawl: [
    K(300, MMA, 'MMA stance'),
    K(240, SPRAWL, 'Legs fly back, hips drop to the floor'),
    K(400, SPRAWL, 'Chest heavy, head up'),
    K(400, MMA, 'Pop straight back up'),
  ],

  leadhook: [
    guard(300, 'Guard'),
    K(180, { p: [2, 88, 0], py: 10, cy: -5, ln: 8, lh: [42, 149, -2], lfy: 60, rf: [-30, 12, 15], pole: { le: [0, 0.3, -1] } }, 'Lead foot pivots, elbow up level with the fist'),
    guard(260),
  ],

  rearhook: [
    guard(300, 'Guard'),
    K(180, { p: [5, 88, 0], py: 0, cy: -30, ln: 8, rh: [44, 148, 2], lh: [24, 151, -4], rf: [-28, 18, 14], rfy: 85, pole: { re: [0, 0.3, 1] } }, 'Rear heel turns, arm stays bent'),
    guard(260),
  ],

  leaduppercut: [
    guard(260, 'Guard'),
    K(180, { p: [2, 80, -4], cy: 55, ln: 12, tl: -6, lh: [30, 126, -10], pole: { le: [-0.3, -1, 0] } }, 'Dip onto the lead leg'),
    K(160, { p: [3, 90, 0], cy: 25, ln: 6, lh: [44, 160, -4], pole: { le: [-0.5, -1, 0] } }, 'Drive up, palm facing you'),
    guard(260),
  ],

  rearuppercut: [
    guard(260, 'Guard'),
    K(180, { p: [0, 80, 4], cy: 55, ln: 12, tl: 6, rh: [18, 122, 10], pole: { re: [-0.3, -1, 0] } }, 'Dip and load the rear hip'),
    K(160, { p: [5, 90, 0], py: 10, cy: -5, ln: 6, rh: [44, 158, 2], rf: [-28, 18, 14], rfy: 85, pole: { re: [-0.5, -1, 0] } }, 'Rear heel turns, fist rises'),
    guard(260),
  ],

  roll: [
    guard(260, 'Guard'),
    K(220, { p: [-2, 72, -8], ln: 18, tl: -12, lh: [28, 128, -12], rh: [16, 126, 4] }, 'Drop with the legs'),
    K(220, { p: [2, 72, 8], ln: 18, tl: 12, lh: [32, 128, 0], rh: [20, 126, 16] }, 'Move under in a U shape'),
    guard(260, 'Come up ready to punch'),
  ],

  leadkick: [
    guard(300, 'Guard'),
    K(170, { p: [-2, 88, 0], py: 20, lf: [6, 12, -15], rf: [6, 9, 15], lfy: 20, rfy: 30 }, 'Small, quick switch of the feet'),
    K(200, { p: [6, 92, 2], py: 110, cy: 80, ln: -14, tl: 18, rf: [6, 15, 15], rfy: 160, lf: [86, 110, 22], lfy: 90,
      rh: [20, 152, 12], lh: [-22, 104, -22], pole: { lk: [0.2, 1, 0], le: [0, -1, -1] } }, 'Kick straight out of the switch'),
    K(200, { p: [-2, 88, 0], py: 20, lf: [6, 12, -15], rf: [6, 9, 15], lfy: 20, rfy: 30 }, 'Same path back'),
    guard(300),
  ],

  knee: [
    guard(300, 'Guard'),
    K(160, { lh: [56, 152, -8], rh: [54, 152, 8], cy: 20 }, 'Reach for the head'),
    K(200, { p: [8, 92, 0], py: 10, cy: 10, ln: -14, lh: [46, 136, -8], rh: [44, 136, 8], lf: [28, 15, -13],
      rf: [30, 66, 8], rfy: 0, pole: { rk: [1, 0.5, 0] } }, 'Pull down, hips forward, knee drives'),
    guard(300),
  ],

  levelchange: [
    guard(300, 'Guard'),
    K(260, { p: [-2, 64, 0], ln: 22, lf: [36, 9, -15], rf: [-34, 12, 17], lh: [42, 118, -9], rh: [36, 116, 9] }, 'Hips drop, back upright, head up'),
    K(300, { p: [-2, 64, 0], ln: 22, lf: [36, 9, -15], rf: [-34, 12, 17], lh: [42, 118, -9], rh: [36, 116, 9] }, 'Hands ready'),
    guard(300),
  ],

  standup: [
    K(500, { p: [0, 18, 0], py: 30, cy: 30, ln: -25, rh: [-32, 6, 20], lh: [20, 74, -10], lf: [36, 9, -16], rf: [-4, 8, 20], lfy: 0, rfy: 0,
      pole: { lk: [0.3, 1, 0], rk: [0, -1, 0], re: [-1, 0, 0.5] } }, 'Seated: post hand behind, other hand guards'),
    K(320, { p: [-6, 44, 0], py: 30, cy: 30, ln: 5, rh: [-32, 6, 20], lh: [22, 96, -10], lf: [36, 9, -16], rf: [-50, 9, 10], lfy: 0, rfy: 40,
      pole: { lk: [1, 0.4, 0], rk: [0, -1, 0] } }, 'Lift the hips, swing the leg back through'),
    K(320, { p: [-24, 80, 0], lf: [8, 9, -13], rf: [-54, 12, 15], lh: [8, 146, -6], rh: [-8, 144, 9] }, 'Land in stance, away from them'),
    K(500, { p: [-24, 88, 0], lf: [4, 9, -13], rf: [-54, 12, 15], lh: [6, 148, -6], rh: [-9, 146, 9] }, 'Guard up'),
  ],

  pullcounter: [
    guard(260, 'Guard'),
    K(220, { p: [-10, 85, 0], ln: -8, cy: 50, lh: [24, 148, -8], rh: [8, 146, 9], rf: [-30, 9, 15] }, 'Weight back over the rear leg'),
    K(170, CROSS, 'Spring forward into the cross'),
    guard(280),
  ],

  elbow: [
    guard(260, 'Guard'),
    K(180, { p: [5, 88, 0], py: 0, cy: -40, ln: 8, rh: [20, 152, -6], lh: [24, 151, -4], rf: [-28, 18, 14], rfy: 85, pole: { re: [1, 0.2, 0] } }, 'Elbow at shoulder height slices across'),
    guard(280),
  ],

  catchkick: [
    guard(260, 'Guard'),
    K(220, { cy: 60, lh: [22, 104, -8], pole: { le: [0, -0.4, -1] } }, 'Absorb and scoop the leg'),
    K(180, { ...CROSS, lh: [18, 104, -8], pole: { le: [0, -0.4, -1] } }, 'Hold it and fire the cross'),
    guard(300),
  ],

  clinch: [
    K(300, { lh: [50, 166, -5], rh: [48, 168, 5], cy: 20, pole: { le: [0, -1, 0.2], re: [0, -1, -0.2] } }, 'Hands stacked behind the head'),
    K(200, { p: [8, 92, 0], py: 10, cy: 10, ln: -14, lh: [44, 146, -5], rh: [42, 148, 5], lf: [28, 15, -13], rf: [30, 66, 8], rfy: 0,
      pole: { rk: [1, 0.5, 0], le: [0, -1, 0.2], re: [0, -1, -0.2] } }, 'Pull the head down, knee up'),
    K(300, { lh: [50, 166, -5], rh: [48, 168, 5], cy: 20, pole: { le: [0, -1, 0.2], re: [0, -1, -0.2] } }, 'Reset posture'),
  ],

  doubleleg: [
    guard(260, 'Guard'),
    K(220, { p: [-2, 64, 0], ln: 22, lf: [36, 9, -15], rf: [-34, 12, 17], lh: [42, 118, -9], rh: [36, 116, 9] }, 'Level change'),
    K(260, { p: [36, 52, 0], py: 20, cy: 15, ln: 40, lf: [76, 9, -12], rf: [-16, 6, 14], rfy: 0, lh: [100, 62, -16], rh: [98, 60, 16],
      pole: { rk: [0, -1, 0], lk: [1, 0.3, 0] } }, 'Penetration step, rear knee touches down'),
    K(300, { p: [50, 70, 0], py: 0, cy: 0, ln: 35, lf: [80, 9, -12], rf: [30, 9, 14], rfy: 20, lh: [108, 70, -16], rh: [106, 70, 16] }, 'Bring the rear leg up and drive through'),
    K(400, {}, 'Reset'),
  ],
};
