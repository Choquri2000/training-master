// Realistic 3D player: a skinned character with motion-capture clips (assets/fighter.glb).
// three.js is loaded only when a technique with a clip is opened. Same API as figure.js.
export const MOCAP = new Set(['stance', 'jab', 'cross', 'onetwo', 'leadhook', 'leaduppercut', 'block',
  'slip', 'pullcounter', 'teep', 'roundhouse', 'knee', 'elbow', 'doubleleg']);

// Camera angle around the fighter (degrees). 0 = the opponent's view.
const VIEW_AZ = { front: 0, three: 40, side: 90 };
let libs, model; // cached across pages

async function loadLibs() {
  if (libs) return libs;
  const [THREE, { GLTFLoader }, { MeshoptDecoder }, { OrbitControls }] = await Promise.all([
    import('three'),
    import('../vendor/three/examples/jsm/loaders/GLTFLoader.js'),
    import('../vendor/three/examples/jsm/libs/meshopt_decoder.module.js'),
    import('../vendor/three/examples/jsm/controls/OrbitControls.js'),
  ]);
  return (libs = { THREE, GLTFLoader, MeshoptDecoder, OrbitControls });
}

function loadModel({ GLTFLoader, MeshoptDecoder }) {
  if (!model) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    model = loader.loadAsync(new URL('../assets/fighter.glb', import.meta.url).href).catch(e => { model = null; throw e; });
  }
  return model;
}

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function createMocap(container, techId, { speed = 1, view = 'three', step = false, onLabel, onFail } = {}) {
  let dead = false, raf = 0, api = {};
  const st = { speed, view, step, paused: false };
  container.classList.add('mocap', 'loading');
  const bar = document.createElement('input');
  Object.assign(bar, { type: 'range', min: 0, max: 1000, value: 0, className: 'scrub', hidden: !step });
  bar.setAttribute('aria-label', 'Move through the technique');

  (async () => {
    const L = await loadLibs();
    const gltf = await loadModel(L);
    if (dead) return;
    const { THREE, OrbitControls } = L;
    const { clone } = await import('../vendor/three/examples/jsm/utils/SkeletonUtils.js');
    if (dead) return;
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

    const fighter = clone(gltf.scene);
    fighter.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    scene.add(fighter);

    let hips = null; fighter.traverse(o => { if (!hips && o.isBone && /Hips$/.test(o.name)) hips = o; });
    const hp = new THREE.Vector3(), shift = new THREE.Vector3();
    const camera = new THREE.PerspectiveCamera(32, 1, 10, 3000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 95, 0);
    controls.enablePan = false; controls.enableDamping = true;
    controls.minDistance = 200; controls.maxDistance = 800;
    controls.maxPolarAngle = Math.PI * 0.55;
    const setView = v => {
      st.view = v; const a = THREE.MathUtils.degToRad(VIEW_AZ[v] ?? 40);
      camera.position.set(Math.sin(a) * 400, 135, Math.cos(a) * 400); controls.update();
    };
    setView(st.view);

    const mixer = new THREE.AnimationMixer(fighter);
    const clip = n => gltf.animations.find(c => c.name === n);
    const idle = mixer.clipAction(clip('stance'));
    const main = techId === 'stance' ? idle : mixer.clipAction(clip(techId));
    const dur = main.getClip().duration;
    if (main !== idle) { main.setLoop(THREE.LoopOnce); main.clampWhenFinished = true; }
    main.play();
    let phase = 'tech', holdT = 0; // tech -> hold (guard) -> tech ...
    const label = () => onLabel?.(st.step ? 'Drag the slider or the figure' : (phase === 'tech' ? 'Technique' : 'Back to guard'), 1, 1);
    label();
    mixer.addEventListener('finished', () => {
      if (st.step) return;
      phase = 'hold'; holdT = 0; idle.reset().play(); idle.crossFadeFrom(main, 0.3, false); label();
    });

    const size = () => {
      const w = container.clientWidth, h = container.clientHeight || w * 0.86;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(size); ro.observe(container); size();

    const scrubTo = f => { idle.stop(); main.stopFading(); main.reset().play(); main.setEffectiveWeight(1); main.time = f * dur; mixer.update(0); };
    bar.addEventListener('input', () => scrubTo(bar.value / 1000));

    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!st.paused && !st.step) {
        mixer.update(dt * st.speed);
        if (phase === 'hold' && (holdT += dt * st.speed) > 0.9 && main !== idle) {
          phase = 'tech'; main.reset().play(); main.crossFadeFrom(idle, 0.25, false); label();
        }
      }
      if (hips) { // keep the fighter centred when a move travels (takedowns, steps)
        hips.getWorldPosition(hp);
        shift.set((hp.x - controls.target.x) * 0.12, 0, (hp.z - controls.target.z) * 0.12);
        controls.target.add(shift); camera.position.add(shift);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    Object.assign(api, {
      setView,
      setSpeed: s => { st.speed = s; },
      setStep: on => {
        st.step = on; bar.hidden = !on; label();
        if (on) { bar.value = 400; scrubTo(0.4); } else { phase = 'tech'; main.reset().play(); }
      },
      pause: () => { st.paused = true; }, play: () => { st.paused = false; },
      cleanup: () => { ro.disconnect(); controls.dispose(); renderer.dispose(); renderer.forceContextLoss?.(); },
    });
    if (st.step) api.setStep(true);
  })().catch(err => { if (!dead) { container.classList.remove('loading'); onFail?.(err); } });

  return {
    setView: v => api.setView ? api.setView(v) : (st.view = v),
    setSpeed: s => api.setSpeed ? api.setSpeed(s) : (st.speed = s),
    setStep: on => api.setStep ? api.setStep(on) : (st.step = on, bar.hidden = !on),
    pause: () => api.pause?.(), play: () => api.play?.(),
    destroy: () => { dead = true; cancelAnimationFrame(raf); api.cleanup?.(); container.replaceChildren(); container.classList.remove('mocap', 'loading'); },
  };
}
