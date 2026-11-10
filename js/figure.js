// 3D figure animator. Keyframes (data/poses.js) give the pelvis, torso rotation and the
// fist/ankle targets; elbows and knees are solved with two-bone IK so limb lengths stay
// constant. The skeleton is projected for the chosen camera and drawn back to front.
import { techById } from './data/techniques.js';
import { POSES, GUARD } from './data/poses.js';

const LEN = { torso: 54, thigh: 46, shin: 45, upper: 30, fore: 28, sh: 19, hip: 10 };
export const VIEWS = { side: 0, three: -38, front: -90 };

const rad = d => d * Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a) || 1; return mul(a, 1 / l); };
const right = yaw => [-Math.sin(rad(yaw)), 0, Math.cos(rad(yaw))]; // body's right-hand side

// Two-bone IK: joint between root and target, bent toward the pole direction.
function ik(root, target, l1, l2, pole) {
  let d = sub(target, root);
  const dist = Math.min(Math.max(Math.hypot(...d), Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.01);
  const dir = norm(d);
  let p = sub(pole, mul(dir, dot(pole, dir)));
  if (Math.hypot(...p) < 1e-3) p = [0, 1, 0];
  p = norm(p);
  const a = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const mid = add(root, add(mul(dir, l1 * a), mul(p, l1 * Math.sqrt(Math.max(0, 1 - a * a)))));
  const end = add(root, mul(dir, dist));
  return [mid, end];
}

const DEFAULT_POLES = { le: [0, -1, -0.5], re: [0, -1, 0.5], lk: [1, 0, -0.25], rk: [1, 0, 0.25] };

// Pose parameters -> joint positions.
function skeleton(q) {
  const P = q.p;
  const lean = rad(q.ln), tilt = rad(q.tl);
  const up = norm([Math.sin(lean), Math.cos(lean) * Math.cos(tilt), Math.sin(tilt)]);
  const neck = add(P, mul(up, LEN.torso));
  const shC = add(neck, mul(up, -6));
  const rc = right(q.cy), rp = right(q.py);
  const lsh = add(shC, mul(rc, -LEN.sh)), rsh = add(shC, mul(rc, LEN.sh));
  const lhip = add(P, mul(rp, -LEN.hip)), rhip = add(P, mul(rp, LEN.hip));
  const head = add(neck, add(mul(up, 15), [3, 0, 0]));
  const poles = { ...DEFAULT_POLES, ...q.pole };
  const [le, lh] = ik(lsh, q.lh, LEN.upper, LEN.fore, poles.le);
  const [re, rh] = ik(rsh, q.rh, LEN.upper, LEN.fore, poles.re);
  const [lk, la] = ik(lhip, q.lf, LEN.thigh, LEN.shin, poles.lk);
  const [rk, ra] = ik(rhip, q.rf, LEN.thigh, LEN.shin, poles.rk);
  const toe = (ankle, knee, yaw) => ankle[1] > 30
    ? add(ankle, mul(norm(sub(ankle, knee)), 14))
    : [ankle[0] + Math.cos(rad(yaw)) * 17, 1, ankle[2] + Math.sin(rad(yaw)) * 17];
  return { neck, head, lsh, rsh, lhip, rhip, P, le, lh, re, rh, lk, la, rk, ra, lt: toe(la, lk, q.lfy), rt: toe(ra, rk, q.rfy) };
}

// Interpolate two parameter sets.
const lerp = (a, b, t) => a + (b - a) * t;
const lv = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function mixPose(a, b, t) {
  const pole = {};
  for (const k of ['le', 're', 'lk', 'rk']) pole[k] = lv(a.pole[k] || DEFAULT_POLES[k], b.pole[k] || DEFAULT_POLES[k], t);
  return {
    p: lv(a.p, b.p, t), py: lerp(a.py, b.py, t), cy: lerp(a.cy, b.cy, t), ln: lerp(a.ln, b.ln, t), tl: lerp(a.tl, b.tl, t),
    lh: lv(a.lh, b.lh, t), rh: lv(a.rh, b.rh, t), lf: lv(a.lf, b.lf, t), rf: lv(a.rf, b.rf, t),
    lfy: lerp(a.lfy, b.lfy, t), rfy: lerp(a.rfy, b.rfy, t), pole,
  };
}
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function framesFor(id) {
  if (POSES[id]) return POSES[id];
  const tech = techById[id];
  if (tech?.animOf) return tech.animOf.flatMap(framesFor);
  return POSES.stance;
}

const NS = 'http://www.w3.org/2000/svg';
const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

// Parts: [class, joints..., width]. Lead side = fighter's left.
const PARTS = [
  ['rear', 'rhip', 'rk', 15], ['rear', 'rk', 'ra', 12], ['rear-foot', 'ra', 'rt', 8],
  ['lead', 'lhip', 'lk', 15], ['lead', 'lk', 'la', 12], ['lead-foot', 'la', 'lt', 8],
  ['rear', 'rsh', 're', 11], ['rear', 're', 'rh', 10],
  ['lead', 'lsh', 'le', 11], ['lead', 'le', 'lh', 10],
];

export function createFigure(container, techId, { speed = 1, view = 'three', step = false, onLabel } = {}) {
  const svg = el('svg', { viewBox: '-125 -200 250 215', class: 'figure', role: 'img', 'aria-label': 'Animated technique demonstration' });
  svg.append(el('ellipse', { cx: 0, cy: 2, rx: 110, ry: 8, class: 'fig-ground' }));
  const layer = el('g');
  svg.append(layer);
  container.replaceChildren(svg);

  let frames, total, raf = 0, t0 = 0, paused = false, last = -1;
  let yaw = VIEWS[view] ?? VIEWS.three;
  const HOLD = 650;

  function load() {
    frames = framesFor(techId).map(f => ({ ...GUARD, ...f, pole: { ...(f.pole || {}) } }));
    total = frames.reduce((s, f) => s + f.ms + (step ? HOLD : 0), 0) + 450;
  }
  load();

  function project(v) {
    const c = Math.cos(rad(yaw)), s = Math.sin(rad(yaw));
    return [v[0] * c + v[2] * s, -v[1], -v[0] * s + v[2] * c];
  }

  function draw(q) {
    const j = skeleton(q);
    const pj = {}; for (const k in j) pj[k] = project(j[k]);
    // Centre the figure horizontally on the pelvis so steps stay in frame.
    const cx = pj.P[0] * 0.6;
    const X = k => (pj[k][0] - cx).toFixed(1), Y = k => pj[k][1].toFixed(1);
    const items = [];
    for (const [cls, a, b, w] of PARTS) {
      items.push({ z: (pj[a][2] + pj[b][2]) / 2, node: el('line', { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), 'stroke-width': w, class: 'fig-' + cls }) });
    }
    items.push({ z: (pj.lsh[2] + pj.rsh[2] + pj.lhip[2] + pj.rhip[2]) / 4, node: el('path', {
      d: `M${X('lsh')},${Y('lsh')} L${X('rsh')},${Y('rsh')} L${X('rhip')},${Y('rhip')} L${X('lhip')},${Y('lhip')}Z`, class: 'fig-torso' }) });
    items.push({ z: (pj.lhip[2] + pj.rhip[2]) / 2 + 0.1, node: el('path', {
      d: `M${X('lhip')},${Y('lhip')} L${X('rhip')},${Y('rhip')}`, class: 'fig-shorts', 'stroke-width': 18 }) });
    items.push({ z: pj.head[2], node: el('circle', { cx: X('head'), cy: Y('head'), r: 11, class: 'fig-head' }) });
    items.push({ z: pj.lh[2] + 2, node: el('circle', { cx: X('lh'), cy: Y('lh'), r: 8.5, class: 'fig-glove-lead' }) });
    items.push({ z: pj.rh[2] + 2, node: el('circle', { cx: X('rh'), cy: Y('rh'), r: 8.5, class: 'fig-glove-rear' }) });
    items.sort((a, b) => a.z - b.z);
    layer.replaceChildren(...items.map(i => i.node));
  }

  function at(ms) {
    let t = ms % total, prev = frames[frames.length - 1];
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (t <= f.ms) { label(i); return mixPose(prev, f, ease(Math.min(1, t / f.ms))); }
      t -= f.ms;
      if (step) { if (t <= HOLD) { label(i); return f; } t -= HOLD; }
      prev = f;
    }
    label(frames.length - 1);
    return frames[frames.length - 1];
  }
  function label(i) {
    if (i === last || !onLabel) return;
    last = i;
    onLabel(frames[i].label || '', i + 1, frames.length);
  }

  function tick(now) {
    if (!t0) t0 = now;
    draw(at((now - t0) * speed));
    raf = requestAnimationFrame(tick);
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Reduced motion: show the most important keyframe still.
  draw(reduce ? frames[Math.min(1, frames.length - 1)] : frames[0]);
  if (!reduce) raf = requestAnimationFrame(tick);

  return {
    setSpeed(s) { speed = s; t0 = 0; },
    setView(v) { yaw = VIEWS[v] ?? yaw; },
    setStep(on) { step = on; load(); t0 = 0; last = -1; },
    pause() { cancelAnimationFrame(raf); paused = true; },
    play() { if (paused) { paused = false; t0 = 0; raf = requestAnimationFrame(tick); } },
    destroy() { cancelAnimationFrame(raf); },
  };
}
