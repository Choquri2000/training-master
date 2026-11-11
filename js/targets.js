// Targets on the body: a 3D figure (the mannequin from the motion captures, in a fighting
// stance and facing you) with the places strikes should land. Tap a target on the figure or
// in the list to see why it works and which strikes reach it.
import { loadLibs, load } from './mocap.js';

// anchor: bones (averaged, or lerped with `at`), off: offset in the figure's own frame
// (x = its left, y = up, z = towards you), in cm. The figure stands orthodox: its left side leads.
export const TARGETS = [
  { id: 'chin', bones: ['Head'], off: [0, -7, 10],
    en: ['Chin and jaw', 'A strike to the point of the chin or the side of the jaw turns the head sharply. The brain lags behind the skull, which is what causes a knockout. The jaw is the target of most finishing punches.', 'Hook or cross to the side of the jaw; uppercut under the chin when the head comes forward.'],
    ka: ['ნიკაპი და ყბა', 'დარტყმა ნიკაპის წვერზე ან ყბის გვერდზე თავს მკვეთრად ატრიალებს. ტვინი თავის ქალას ჩამორჩება, სწორედ ეს იწვევს ნოკაუტს. ყბა დამასრულებელი დარტყმების უმეტესობის სამიზნეა.', 'ჰუკი ან კროსი ყბის გვერდზე; აპერკოტი ნიკაპის ქვეშ, როცა თავი წინ მოდის.'],
    strikes: ['cross', 'leadhook', 'rearhook', 'leaduppercut', 'rearuppercut', 'spinbackfist', 'superman', 'flyingknee'] },
  { id: 'temple', bones: ['Head'], off: [-9, 7, 3],
    en: ['Temple', 'The side of the head above the ear, where the skull is thinnest. Kicks and hooks that land here are very dangerous, which is why the guard covers it with the gloves.', 'High roundhouse or question mark kick over the guard; hooks around it; spinning backfist.'],
    ka: ['საფეთქელი', 'თავის გვერდი ყურის ზემოთ, სადაც თავის ქალა ყველაზე თხელია. აქ მოხვედრილი წიხლები და ჰუკები ძალიან საშიშია, ამიტომაც ფარავს დაცვა ხელთათმანებით.', 'მაღალი წრიული წიხლი ან „კითხვის ნიშანი“ დაცვის ზემოდან; ჰუკები გარშემო; მბრუნავი ბექფისტი.'],
    strikes: ['roundhouse', 'questionmark', 'leadhook', 'rearhook', 'spinbackfist'] },
  { id: 'solar', bones: ['Spine2'], at: 0, off: [0, -6, 13],
    en: ['Solar plexus', 'The soft spot under the breastbone, above the stomach. A straight shot here pushes into the diaphragm and knocks the wind out: the opponent cannot breathe for a few seconds.', 'Straight shots: the cross to the body, the teep, the spinning back kick, a straight knee in the clinch.'],
    ka: ['მზის წნული', 'რბილი ადგილი მკერდის ძვლის ქვეშ, კუჭის ზემოთ. პირდაპირი დარტყმა აქ დიაფრაგმაში აღწევს და სუნთქვას უკრავს: მეტოქეს რამდენიმე წამი სუნთქვა არ შეუძლია.', 'პირდაპირი დარტყმები: კროსი ტანში, თიპი, მბრუნავი უკანა წიხლი, პირდაპირი მუხლი კლინჩში.'],
    strikes: ['cross', 'teep', 'spinbackkick', 'knee', 'clinch'] },
  { id: 'liver', bones: ['Spine', 'Spine1'], off: [-12, -4, 7],
    en: ['Liver', 'Under the lowest ribs on the opponent\'s right side, in front of your lead hand (orthodox against orthodox). A clean shot causes a delayed, overwhelming pain that drops fighters while they are still conscious.', 'Lead hook to the body, lead (switch) body kick, a straight knee; dip your level to reach it.'],
    ka: ['ღვიძლი', 'ქვედა ნეკნების ქვეშ მეტოქის მარჯვენა მხარეს, შენი წინა ხელის წინ (ორთოდოქსი ორთოდოქსის წინააღმდეგ). სუფთა დარტყმა იწვევს დაგვიანებულ, აუტანელ ტკივილს, რომელიც მებრძოლს აქცევს მაშინაც, როცა ის გონზეა.', 'წინა ჰუკი ტანში, წინა (ფეხის შეცვლით) ტანის წიხლი, პირდაპირი მუხლი; მისასვლელად დონე დაწიე.'],
    strikes: ['livershot', 'fdownup', 'leadkick', 'knee', 'leadhook'] },
  { id: 'ribs', bones: ['Spine', 'Spine1'], off: [12, -2, 5],
    en: ['Ribs and spleen', 'The opponent\'s left side, open to your rear kick and rear hand. The floating ribs at the bottom are not joined to the breastbone and break or bruise easily; the spleen sits behind them.', 'Rear roundhouse kick to the body, rear hook or uppercut to the body.'],
    ka: ['ნეკნები და ელენთა', 'მეტოქის მარცხენა მხარე, ღიაა შენი უკანა წიხლისა და უკანა ხელისთვის. ქვედა „მცურავი“ ნეკნები მკერდის ძვალს არ უერთდება და ადვილად ზიანდება; მათ უკან ელენთაა.', 'უკანა წრიული წიხლი ტანში, უკანა ჰუკი ან აპერკოტი ტანში.'],
    strikes: ['roundhouse', 'rearhook', 'rearuppercut', 'fjabkick', 'sigbuakaw'] },
  { id: 'thigh', bones: ['LeftUpLeg', 'LeftLeg'], at: 0.4, off: [9, 0, 2],
    en: ['Thigh (lead leg)', 'The big muscle on the outside of the lead thigh. Repeated low kicks there deaden the leg: the opponent cannot push off it, so their punches and movement lose power.', 'Rear low roundhouse with the shin, a few centimetres above the knee; set it up with punches to the head.'],
    ka: ['ბარძაყი (წინა ფეხი)', 'დიდი კუნთი წინა ბარძაყის გარე მხარეს. იქ განმეორებითი დაბალი წიხლები ფეხს აბუჟებს: მეტოქე მას ვეღარ ეყრდნობა, ამიტომ მისი დარტყმები და მოძრაობა ძალას კარგავს.', 'უკანა დაბალი წრიული წიხლი წვივით, მუხლიდან რამდენიმე სანტიმეტრით ზემოთ; მოამზადე თავში დარტყმებით.'],
    strikes: ['roundhouse', 'calfkick', 'cdutch'] },
  { id: 'calf', bones: ['LeftLeg', 'LeftFoot'], at: 0.35, off: [5, 0, -6],
    en: ['Calf (lead leg)', 'The back and outside of the lead calf, just below the knee. It is hard to check because it lands below the knee, and a few clean kicks take away the opponent\'s stance and footwork.', 'The calf kick: a short low roundhouse when their weight is on the lead leg.'],
    ka: ['წვივი (წინა ფეხი)', 'წინა წვივის უკანა და გარე მხარე, მუხლის ზუსტად ქვემოთ. დაბლოკვა ძნელია, რადგან მუხლს ქვემოთ ხვდება, და რამდენიმე სუფთა წიხლი მეტოქეს დგომას და ფეხის მოძრაობას ართმევს.', 'წვივის წიხლი: მოკლე დაბალი წრიული წიხლი, როცა მათი წონა წინა ფეხზეა.'],
    strikes: ['calfkick'] },
];
export const targetById = Object.fromEntries(TARGETS.map(x => [x.id, x]));

export function createTargetFigure(container, { selected, onPick, onFail } = {}) {
  let dead = false, raf = 0, api = {};
  container.classList.add('mocap', 'loading');
  (async () => {
    const L = await loadLibs();
    const [gltf, body] = await Promise.all([load(L, 'fighter'), load(L, 'mannequin')]);
    if (dead) return;
    const { THREE, OrbitControls } = L;
    container.classList.remove('loading');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.replaceChildren(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(120, 300, 220); scene.add(sun);

    const fig = L.clone(body.scene);
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9d4cc, roughness: 0.6, metalness: 0.05 });
    const joint = new THREE.MeshStandardMaterial({ color: 0x5b6270, roughness: 0.45, metalness: 0.3 });
    fig.traverse(o => { if (o.isMesh) { o.material = /Joint/i.test(o.name) ? joint : skin; o.frustumCulled = false; } });
    scene.add(fig);
    // Freeze in the guard from the stance capture.
    const mixer = new THREE.AnimationMixer(fig);
    const a = mixer.clipAction(gltf.animations.find(c => c.name === 'stance')); a.play(); a.paused = true; a.time = 0.4; mixer.update(0);
    fig.updateMatrixWorld(true);
    const bone = {}; fig.traverse(o => { if (o.isBone) bone[o.name] = o; });
    const hips = bone.Hips;
    // The figure's own frame: forward from its hips' facing, left = up x forward.
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(hips.getWorldQuaternion(new THREE.Quaternion())); fwd.y = 0; fwd.normalize();
    const up = new THREE.Vector3(0, 1, 0), left = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const pos = t => {
      const ps = t.bones.map(n => bone[n].getWorldPosition(new THREE.Vector3()));
      const p = ps.length === 1 ? ps[0] : ps[0].clone().lerp(ps[1], t.at ?? 0.5);
      return p.addScaledVector(left, t.off[0]).addScaledVector(up, t.off[1]).addScaledVector(fwd, t.off[2]);
    };

    const geo = new THREE.SphereGeometry(4.2, 20, 14), ringGeo = new THREE.RingGeometry(5.5, 7, 32);
    const markers = TARGETS.map(t => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xe0563b, depthTest: false, transparent: true }));
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xe0563b, depthTest: false, transparent: true, side: THREE.DoubleSide }));
      m.position.copy(pos(t)); ring.position.copy(m.position); m.renderOrder = ring.renderOrder = 10; m.userData.id = t.id;
      scene.add(m, ring); return { t, m, ring };
    });

    const center = hips.getWorldPosition(new THREE.Vector3());
    const camera = new THREE.PerspectiveCamera(30, 1, 10, 3000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(center.x, 100, center.z); controls.enablePan = false; controls.enableDamping = true;
    controls.minDistance = 200; controls.maxDistance = 700; controls.maxPolarAngle = Math.PI * 0.6;
    const az = THREE.MathUtils.degToRad(20); // slightly from your lead side, so liver and lead leg both show
    const eye = fwd.clone().applyAxisAngle(up, -az).multiplyScalar(430);
    camera.position.set(center.x + eye.x, 140, center.z + eye.z); controls.update();

    let sel = selected;
    const focus = () => markers.forEach(({ t, m, ring }) => {
      const on = t.id === sel;
      m.material.color.set(on ? 0xffb020 : 0xe0563b); ring.material.color.set(on ? 0xffb020 : 0xe0563b);
      m.scale.setScalar(on ? 1.35 : 1);
    });
    focus();

    const size = () => { const w = container.clientWidth, h = container.clientHeight || w * 1.1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(size); ro.observe(container); size();

    // Tap a target (generous radius so it works with a finger).
    const sp = new THREE.Vector3();
    let down = null;
    renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return; // a drag turns the figure
      const r = renderer.domElement.getBoundingClientRect();
      let best = null, bd = 30;
      markers.forEach(({ t, m }) => {
        sp.copy(m.position).project(camera);
        const d = Math.hypot((sp.x + 1) / 2 * r.width - (e.clientX - r.left), (1 - sp.y) / 2 * r.height - (e.clientY - r.top));
        if (d < bd) { bd = d; best = t.id; }
      });
      if (best) { sel = best; focus(); onPick?.(best); }
    });

    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const s = 1 + 0.25 * Math.sin(clock.getElapsedTime() * 4);
      markers.forEach(({ t, ring }) => { ring.lookAt(camera.position); ring.scale.setScalar(t.id === sel ? s * 1.3 : s); });
      controls.update(); renderer.render(scene, camera);
    };
    tick();
    Object.assign(api, {
      select: id => { sel = id; focus(); },
      cleanup: () => { ro.disconnect(); controls.dispose(); mixer.stopAllAction(); renderer.dispose(); renderer.forceContextLoss?.(); },
    });
  })().catch(err => { console.error(err); if (!dead) { container.classList.remove('loading'); onFail?.(err); } });
  return {
    select: id => api.select?.(id),
    destroy: () => { dead = true; cancelAnimationFrame(raf); api.cleanup?.(); container.replaceChildren(); container.classList.remove('mocap', 'loading'); },
  };
}
