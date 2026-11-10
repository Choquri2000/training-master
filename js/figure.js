// Stick-figure animator. A pose is a set of 2D joint positions (side view, facing right,
// orthodox stance). Frames override joints from the base guard pose and are
// interpolated linearly. "Lead" limbs are drawn in the accent colour, "rear" limbs muted.
import { techById } from './data/techniques.js';

const GUARD = {
  neck: [100, 62], pelvis: [96, 122],
  le: [116, 92], lh: [124, 56],
  re: [100, 92], rh: [112, 54],
  lk: [118, 160], lf: [128, 200],
  rk: [82, 162], rf: [70, 200],
  dx: 0,
};

function framesFor(tech) {
  if (tech.anim) return tech.anim;
  if (tech.animOf) return tech.animOf.flatMap(id => framesFor(techById[id]));
  return [[{}, 600]];
}

const full = o => ({ ...GUARD, ...o });
const lerp = (a, b, t) => a + (b - a) * t;
function mix(p, q, t) {
  const out = {};
  for (const k in GUARD) {
    out[k] = Array.isArray(GUARD[k])
      ? [lerp(p[k][0], q[k][0], t), lerp(p[k][1], q[k][1], t)]
      : lerp(p[k], q[k], t);
  }
  return out;
}

const NS = 'http://www.w3.org/2000/svg';
function el(name, attrs) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

export function createFigure(container, techId, { speed = 1 } = {}) {
  const svg = el('svg', { viewBox: '0 0 200 215', class: 'figure', role: 'img', 'aria-label': 'Animated demonstration' });
  svg.append(el('line', { x1: 0, y1: 203, x2: 200, y2: 203, class: 'fig-ground' }));
  const g = el('g', {});
  svg.append(g);
  const rear = el('path', { class: 'fig-rear' });
  const body = el('path', { class: 'fig-body' });
  const lead = el('path', { class: 'fig-lead' });
  const head = el('circle', { r: 12, class: 'fig-head' });
  const lfist = el('circle', { r: 5, class: 'fig-lead-fist' });
  const rfist = el('circle', { r: 5, class: 'fig-rear-fist' });
  g.append(rear, body, lead, head, rfist, lfist);
  container.replaceChildren(svg);

  let frames = framesFor(techById[techId]).map(([o, ms]) => [full(o), ms]);
  let raf = 0, start = 0, paused = false, pauseAt = 0;
  let total = frames.reduce((s, f) => s + f[1], 0) + 500;

  function draw(p) {
    const d = p.dx;
    const P = ([x, y]) => `${x + d},${y}`;
    const ls = [p.neck[0] + 6, p.neck[1] + 4], rs = [p.neck[0] - 6, p.neck[1] + 4];
    const lhip = [p.pelvis[0] + 4, p.pelvis[1]], rhip = [p.pelvis[0] - 4, p.pelvis[1]];
    rear.setAttribute('d', `M${P(rs)} L${P(p.re)} L${P(p.rh)} M${P(rhip)} L${P(p.rk)} L${P(p.rf)}`);
    body.setAttribute('d', `M${P(p.neck)} L${P(p.pelvis)}`);
    lead.setAttribute('d', `M${P(ls)} L${P(p.le)} L${P(p.lh)} M${P(lhip)} L${P(p.lk)} L${P(p.lf)}`);
    // Head continues the line of the torso, so it follows leans, sprawls and shots.
    const vx = p.neck[0] - p.pelvis[0], vy = p.neck[1] - p.pelvis[1];
    const len = Math.hypot(vx, vy) || 1;
    head.setAttribute('cx', p.neck[0] + d + (vx / len) * 15 + 2);
    head.setAttribute('cy', p.neck[1] + (vy / len) * 15);
    lfist.setAttribute('cx', p.lh[0] + d); lfist.setAttribute('cy', p.lh[1]);
    rfist.setAttribute('cx', p.rh[0] + d); rfist.setAttribute('cy', p.rh[1]);
  }

  function poseAt(ms) {
    let t = ms % total;
    let prev = frames[frames.length - 1][0];
    if (t >= total - 500) return frames[frames.length - 1][0]; // hold between loops
    for (const [pose, dur] of frames) {
      if (t <= dur) return mix(prev, pose, Math.min(1, t / dur));
      t -= dur; prev = pose;
    }
    return prev;
  }

  function tick(now) {
    if (!start) start = now;
    draw(poseAt((now - start) * speed));
    raf = requestAnimationFrame(tick);
  }
  draw(full({}));
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) raf = requestAnimationFrame(tick);

  return {
    setSpeed(s) { speed = s; start = 0; },
    pause() { if (!paused) { cancelAnimationFrame(raf); paused = true; } },
    play() { if (paused || reduce) { paused = false; start = 0; raf = requestAnimationFrame(tick); } },
    toggle() { paused ? this.play() : this.pause(); return !paused; },
    destroy() { cancelAnimationFrame(raf); },
  };
}
