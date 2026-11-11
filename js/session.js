// Session player: runs a list of segments with a countdown, bell sounds and spoken callouts.
import { COMBOS, FOOTWORK_CALLS, techById } from './data/techniques.js';
import { store } from './store.js';
import { programCombos, stage, offenceCombos, defenceCalls } from './program.js';

let audio;
function ctx() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  return audio;
}

// Boxing-style bell: a few decaying sine partials.
export function bell(times = 1) {
  try {
    const ac = ctx();
    for (let n = 0; n < times; n++) {
      const t0 = ac.currentTime + n * 0.35;
      [880, 1320, 1760].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0.25 / (i + 1), t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.2);
        o.connect(g).connect(ac.destination);
        o.start(t0); o.stop(t0 + 1.25);
      });
    }
  } catch { /* audio not available */ }
}
function clack() {
  try {
    const ac = ctx(), o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = 2200; o.type = 'square';
    g.gain.setValueAtTime(0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.1);
  } catch { /* ignore */ }
}

export function say(text) {
  if (!store.get().voice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 1.15;
  speechSynthesis.speak(u);
}

// A technique is "available" for callouts once you started learning it, or its phase is behind you.
export function isAvailable(t) {
  const s = store.get();
  return t.phase < s.phaseUnlocked || !!s.status[t.id];
}
export function availableCombos() {
  const mine = programCombos(); if (mine) return mine;
  const list = COMBOS.filter(c => c.uses.every(id => isAvailable(techById[id])));
  return list.length ? list : COMBOS.slice(0, 3);
}

const PACE = { easy: 6000, medium: 4200, fast: 3000 };

export class Player {
  constructor(segments, onTick) {
    this.segs = segments;
    this.i = 0;
    this.left = segments[0]?.secs ?? 0;
    this.running = false;
    this.onTick = onTick;
    this.elapsed = 0;
    this.nextCall = 0;
  }
  get seg() { return this.segs[this.i]; }
  start() {
    if (this.running) return;
    this.running = true;
    if (this.elapsed === 0) this.enter();
    this.timer = setInterval(() => this.step(), 250);
    this.onTick(this);
  }
  pause() { this.running = false; clearInterval(this.timer); speechSynthesis?.cancel?.(); this.onTick(this); }
  toggle() { this.running ? this.pause() : this.start(); }
  enter() {
    const s = this.seg; if (!s) return;
    if (s.kind === 'work') bell(1);
    if (s.kind === 'rest') bell(2);
    if (s.tech) setTimeout(() => say(techById[s.tech].name.en), 900);
    this.nextCall = Date.now() + 3500;
  }
  step() {
    this.elapsed += 0.25;
    this.left -= 0.25;
    const s = this.seg;
    if (s && s.kind === 'work' && this.left > 3 && Date.now() >= this.nextCall && (s.callouts || s.footwork || s.calls || s.repeat || s.pool)) {
      const pool = [];
      const off = () => (stage() === 'fighter' ? offenceCombos(s.noKicks) : availableCombos()).map(c => c.say);
      if (s.callouts || s.calls === 'combos') pool.push(...off());
      if (s.calls === 'defence') pool.push(...defenceCalls(s.noKicks).map(c => c.say));
      if (s.calls === 'fight') pool.push(...off(), ...defenceCalls(false).map(c => c.say), 'move', 'move');
      if (s.repeat) pool.push(s.repeat);
      if (s.pool) pool.push(...s.pool);
      if (s.footwork) pool.push(...FOOTWORK_CALLS);
      if (!pool.length) pool.push(...availableCombos().map(c => c.say));
      this.lastCall = pool[Math.floor(Math.random() * pool.length)];
      say(this.lastCall);
      const base = PACE[s.pace || 'medium'];
      this.nextCall = Date.now() + base * (0.8 + Math.random() * 0.4);
    }
    if (s && s.kind === 'work' && Math.abs(this.left - 10) < 0.01) clack();
    if (this.left <= 0) this.next();
    this.onTick(this);
  }
  next() {
    this.i++;
    this.lastCall = null;
    if (this.i >= this.segs.length) { this.pause(); bell(3); this.done = true; this.onTick(this); return; }
    this.left = this.seg.secs;
    this.enter();
  }
  stop() { this.pause(); }
  totalSecs() { return this.segs.reduce((a, s) => a + s.secs, 0); }
}
