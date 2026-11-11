// Realistic 3D player. assets/fighter.glb = a skinned fighter + motion-capture clips;
// assets/mannequin.glb = a smooth mannequin that plays the same clips (lead side tinted).
// Each technique is a sequence of clip pieces (cut, held, reversed, mirrored, or with an
// added layer) so every technique is shown with real motion. Same API as figure.js.

// [clip, from, to, opts] - from/to are fractions of the clip; to < from plays backwards.
// opts: hold (seconds, freeze at `from`), mirror (southpaw version), add (procedural layer).
import { tr } from './i18n.js';
import { COMBO_SEQ } from './data/combos.js';
import { coachPhase, techCat } from './data/coach.js';

const SEQ = {
  stance: [['stance', 0, 1]],
  check: [['knee', 0, 0.36], ['knee', 0.36, 0.36, { hold: 0.6 }], ['knee', 0.36, 0]],
  switchstance: [['stance', 0, 0.25], ['stance', 0.25, 0.7, { mirror: true }], ['stance', 0.7, 0.7, { mirror: true, hold: 0.5 }], ['stance', 0.7, 1]],
  sprawl: [['burpee', 0.7, 1], ['burpee', 1, 1, { hold: 0.5 }], ['burpee', 0, 0.3]],
  roll: [['stance', 0, 0.75, { add: 'roll' }]],
  levelchange: [['doubleleg', 0, 0.13], ['doubleleg', 0.13, 0.13, { hold: 0.5 }], ['doubleleg', 0.13, 0]],
  slipcounter: [['slip', 0, 0.5], ['cross', 0.12, 1]],
  angleout: [['sidestep', 0, 1], ['pivot', 0, 1]],
  catchkick: [['bodyblock', 0, 0.45], ['bodyblock', 0.45, 0.45, { hold: 0.4 }], ['stepback', 0, 1]],
  clinch: [['clinchknee', 0, 1]],
  sprawlstrike: [['burpee', 0.7, 1], ['burpee', 1, 1, { hold: 0.3 }], ['burpee', 0, 0.3], ['cross', 0.12, 1]],
  standup: [['standup', 0, 1]],
};
const DIRECT = ['jab', 'cross', 'onetwo', 'leadhook', 'leaduppercut', 'block', 'slip', 'pullcounter', 'teep', 'roundhouse',
  'knee', 'elbow', 'doubleleg', 'step', 'pivot', 'parry', 'rearhook', 'rearuppercut', 'leadkick'];
DIRECT.forEach(k => { SEQ[k] = [[k, 0, 1]]; });
Object.assign(SEQ, COMBO_SEQ); // combinations: chained captures, each piece captioned (opts.lab)
export const MOCAP = new Set(Object.keys(SEQ));
// Your own combinations (built in the app) are registered at run time.
export function registerSeq(id, seq) { SEQ[id] = seq; MOCAP.add(id); }

// Procedural layers (degrees / cm), keyed over 0..1 of the piece: [time, value].
const ADD = {
  // Duck in a U under a hook: bend the knees, drop, sway the torso across and come up.
  roll: {
    'Hips.y': [[0, 0], [0.25, -14], [0.5, -20], [0.75, -14], [1, 0]],
    'Spine.x': [[0, 0], [0.25, -14], [0.5, 0], [0.75, 14], [1, 0]],
    'Spine1.z': [[0, 0], [0.25, -14], [0.5, -20], [0.75, -14], [1, 0]],
    'LeftUpLeg.x': [[0, 0], [0.5, 24], [1, 0]], 'RightUpLeg.x': [[0, 0], [0.5, 24], [1, 0]],
    'LeftLeg.x': [[0, 0], [0.5, -40], [1, 0]], 'RightLeg.x': [[0, 0], [0.5, -40], [1, 0]],
    'LeftFoot.x': [[0, 0], [0.5, 16], [1, 0]], 'RightFoot.x': [[0, 0], [0.5, 16], [1, 0]],
  },
};

const VIEW_AZ = { front: 0, three: 40, side: 90 }; // camera angle; 0 = the opponent's view
const BLEND = 0.22, REST = 0.9; // seconds: blend between pieces, guard pause before repeating
let libs; const models = {};

async function loadLibs() {
  if (libs) return libs;
  const [THREE, { GLTFLoader }, { MeshoptDecoder }, { OrbitControls }, { clone }] = await Promise.all([
    import('three'),
    import('../vendor/three/examples/jsm/loaders/GLTFLoader.js'),
    import('../vendor/three/examples/jsm/libs/meshopt_decoder.module.js'),
    import('../vendor/three/examples/jsm/controls/OrbitControls.js'),
    import('../vendor/three/examples/jsm/utils/SkeletonUtils.js'),
  ]);
  return (libs = { THREE, GLTFLoader, MeshoptDecoder, OrbitControls, clone });
}
function load(L, name) {
  if (!models[name]) {
    const loader = new L.GLTFLoader().setMeshoptDecoder(L.MeshoptDecoder);
    models[name] = loader.loadAsync(new URL(`../assets/${name}.glb`, import.meta.url).href).catch(e => { delete models[name]; throw e; });
  }
  return models[name];
}

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

// Southpaw copy of a clip: swap Left/Right tracks and reflect across the body's mid-plane.
function mirrorClip(THREE, clip) {
  const swap = n => n.replace(/^(Left|Right)/, m => (m === 'Left' ? 'Right' : 'Left'));
  const tracks = clip.tracks.map(t => {
    const [bone, prop] = t.name.split('.');
    const v = t.values.slice();
    if (prop === 'quaternion') for (let i = 0; i < v.length; i += 4) { v[i + 1] = -v[i + 1]; v[i + 2] = -v[i + 2]; }
    if (prop === 'position') for (let i = 0; i < v.length; i += 3) v[i] = -v[i];
    return new t.constructor(`${swap(bone)}.${prop}`, t.times, v);
  });
  return new THREE.AnimationClip(clip.name + '~', clip.duration, tracks);
}

// Procedural layer -> additive clip (identity = no change).
function addClip(THREE, name, dur, hipsScale) {
  const def = ADD[name], tracks = [];
  const eul = new THREE.Euler(), q = new THREE.Quaternion();
  for (const [key, keys] of Object.entries(def)) {
    const [bone, ax] = key.split('.');
    const times = keys.map(k => k[0] * dur);
    if (bone === 'Hips') {
      tracks.push(new THREE.VectorKeyframeTrack('Hips.position', times, keys.flatMap(k => [0, k[1] * hipsScale, 0])));
    } else {
      const vals = keys.flatMap(k => { eul.set(0, 0, 0); eul[ax] = THREE.MathUtils.degToRad(k[1]); return q.setFromEuler(eul).toArray(); });
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, times, vals));
    }
  }
  const clip = new THREE.AnimationClip(name, dur, tracks);
  clip.blendMode = THREE.AdditiveAnimationBlendMode;
  return clip;
}

function tintMannequin(THREE, root) {
  const lead = new THREE.Color('#3b82f6'), rear = new THREE.Color('#d9d4cc'), joint = new THREE.Color('#5b6270');
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    const isJoint = /Joint/i.test(o.name);
    const leftIdx = new Set(o.skeleton.bones.map((b, i) => (/^Left/.test(b.name) ? i : -1)).filter(i => i >= 0));
    const sk = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight, n = sk.count;
    const col = new Float32Array(n * 3), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      let w = 0; for (let j = 0; j < 4; j++) if (leftIdx.has(sk.getComponent(i, j))) w += sw.getComponent(i, j);
      c.copy(isJoint ? joint : rear).lerp(lead, isJoint ? w * 0.6 : w); c.toArray(col, i * 3);
    }
    o.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: isJoint ? 0.45 : 0.6, metalness: isJoint ? 0.3 : 0.05 });
  });
}

export function createMocap(container, techId, { speed = 1, view = 'three', step = false, model = 'fighter', mirror = false, onLabel, onFail } = {}) {
  let dead = false, raf = 0, api = {};
  const st = { speed, view, step, paused: false };
  container.classList.add('mocap', 'loading');
  const bar = document.createElement('input');
  Object.assign(bar, { type: 'range', min: 0, max: 1000, value: 0, className: 'scrub', hidden: !step });
  bar.setAttribute('aria-label', tr('Move through the technique'));

  (async () => {
    const L = await loadLibs();
    const [gltf, body] = await Promise.all([load(L, 'fighter'), model === 'mannequin' ? load(L, 'mannequin') : null]);
    if (dead) return;
    const { THREE, OrbitControls } = L;
    container.classList.remove('loading');

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    container.replaceChildren(renderer.domElement, bar);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(120, 300, 160); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 800 });
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(160, 48), new THREE.ShadowMaterial({ opacity: 0.25 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(158, 160, 64), new THREE.MeshBasicMaterial({ color: 0x8a8f99, transparent: true, opacity: 0.35 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; scene.add(ring);

    const fighter = L.clone((body || gltf).scene);
    if (body) tintMannequin(THREE, fighter);
    fighter.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    // Southpaw: show the whole body mirrored (right foot forward).
    const holder = new THREE.Group(); if (mirror) holder.scale.x = -1; holder.add(fighter); scene.add(holder);
    let hips = null; fighter.traverse(o => { if (!hips && o.isBone && o.name === 'Hips') hips = o; });

    // Build the sequence: one action per piece (clips cloned so pieces never share state).
    const mixer = new THREE.AnimationMixer(fighter);
    const byName = n => gltf.animations.find(c => c.name === n);
    const hipsScale = hips ? 1 / hips.getWorldScale(new THREE.Vector3()).y : 1;
    const piece = ([name, from, to, o = {}]) => {
      let clip = byName(name).clone();
      if (o.mirror) clip = mirrorClip(THREE, clip);
      const a = mixer.clipAction(clip); a.play(); a.paused = true; a.setEffectiveWeight(0);
      const d = clip.duration, dur = o.hold || Math.abs(to - from) * d;
      let add = null;
      if (o.add) { add = mixer.clipAction(addClip(THREE, o.add, dur, hipsScale)); add.play(); add.paused = true; add.setEffectiveWeight(0); }
      return { a, add, from: from * d, to: to * d, dur, hold: !!o.hold, lab: o.lab, clip: name, d };
    };
    const pieces = SEQ[techId].map(piece);
    // Combination captions: consecutive pieces with the same caption are one numbered step.
    let nLab = 0; pieces.forEach((p, i) => { if (p.lab) p.no = p.lab === pieces[i - 1]?.lab ? pieces[i - 1].no : ++nLab; });
    let cur = 0, coach = null; // coach: step-by-step caption for the current moment
    const idle = piece(['stance', 0, 1]);
    const isStance = techId === 'stance';
    const total = pieces.reduce((s, p) => s + p.dur, 0);
    const cycle = isStance ? total : total + REST;
    const at = (p, u) => (p.hold ? p.from : p.from + Math.sign(p.to - p.from) * Math.min(u, p.dur));

    let T = 0;
    const pose = t => {
      [...pieces, idle].forEach(p => { p.a.setEffectiveWeight(0); p.add?.setEffectiveWeight(0); });
      const set = (p, u, w) => { p.a.time = at(p, u); p.a.setEffectiveWeight(w); if (p.add) { p.add.time = Math.min(u, p.dur); p.add.setEffectiveWeight(w); } };
      if (t >= total && !isStance) { // guard pause, blending out of the last piece
        const u = t - total, w = Math.min(1, u / BLEND), last = pieces[pieces.length - 1];
        set(last, last.dur, 1 - w); set(idle, u, w);
      } else {
        let i = 0, s = 0; while (i < pieces.length - 1 && t >= s + pieces[i].dur) s += pieces[i++].dur;
        const u = t - s, w = Math.min(1, u / BLEND), p = pieces[i]; cur = i;
        coach = st.step && !p.hold ? coachPhase(p.clip, at(p, u) / p.d, techCat(techId)) : null;
        const prev = i > 0 ? pieces[i - 1] : (isStance ? null : idle);
        const seamless = prev && prev.a.getClip() === p.a.getClip() && Math.abs(at(prev, prev.dur) - p.from) < 0.02;
        if (prev && w < 1 && !seamless) { set(prev, i > 0 ? prev.dur : REST, 1 - w); set(p, u, w); } else set(p, u, 1);
      }
      mixer.update(0);
    };

    const camera = new THREE.PerspectiveCamera(32, 1, 10, 3000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 95, 0);
    controls.enablePan = false; controls.enableDamping = true;
    controls.minDistance = 200; controls.maxDistance = 800;
    controls.maxPolarAngle = Math.PI * 0.55;
    const setView = v => {
      st.view = v; const a = THREE.MathUtils.degToRad(VIEW_AZ[v] ?? 40);
      camera.position.set(controls.target.x + Math.sin(a) * 400, 135, controls.target.z + Math.cos(a) * 400); controls.update();
    };
    setView(st.view);
    const hp = new THREE.Vector3(), shift = new THREE.Vector3();

    const label = () => (coach ? (nLab ? onLabel?.(`${tr(pieces[cur].lab || 'Technique')} · ${coach.name}: ${coach.text}`, pieces[cur].no || 1, nLab) : onLabel?.(`${coach.name}: ${coach.text}`, coach.i, 4))
      : nLab && T < total ? onLabel?.(tr(pieces[cur].lab || 'Technique'), pieces[cur].no || 1, nLab) : onLabel?.(tr(st.step ? 'Drag the slider, or drag the figure to turn it' : (T < total || isStance ? 'Technique' : 'Back to guard')), 1, 1));
    let lastLabel = '';
    const size = () => {
      const w = container.clientWidth, h = container.clientHeight || w * 0.86;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(size); ro.observe(container); size();
    bar.addEventListener('input', () => { T = (bar.value / 1000) * total; pose(T); });

    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!st.paused && !st.step) { T = (T + dt * st.speed) % cycle; pose(T); }
      if (T >= total) coach = null;
      const phase = coach ? 'c' + cur + coach.i + coach.name : nLab && T < total ? 'p' + cur : T < total || isStance ? 'a' : 'b';
      if (phase !== lastLabel) { lastLabel = phase; label(); }
      if (hips) { // keep the fighter centred when a move travels (takedowns, steps)
        hips.getWorldPosition(hp);
        shift.set((hp.x - controls.target.x) * 0.1, 0, (hp.z - controls.target.z) * 0.1);
        controls.target.add(shift); camera.position.add(shift);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    pose(0); tick();

    Object.assign(api, {
      setView,
      setSpeed: s => { st.speed = s; },
      setStep: on => {
        st.step = on; bar.hidden = !on; lastLabel = ''; label();
        if (on) { bar.value = 400; T = 0.4 * total; pose(T); } else T = 0;
      },
      pause: () => { st.paused = true; }, play: () => { st.paused = false; },
      cleanup: () => { ro.disconnect(); controls.dispose(); mixer.stopAllAction(); renderer.dispose(); renderer.forceContextLoss?.(); },
    });
    if (st.step) api.setStep(true);
  })().catch(err => { console.error(err); if (!dead) { container.classList.remove('loading'); onFail?.(err); } });

  return {
    setView: v => api.setView ? api.setView(v) : (st.view = v),
    setSpeed: s => api.setSpeed ? api.setSpeed(s) : (st.speed = s),
    setStep: on => api.setStep ? api.setStep(on) : (st.step = on, bar.hidden = !on),
    pause: () => api.pause?.(), play: () => api.play?.(),
    destroy: () => { dead = true; cancelAnimationFrame(raf); api.cleanup?.(); container.replaceChildren(); container.classList.remove('mocap', 'loading'); },
  };
}
