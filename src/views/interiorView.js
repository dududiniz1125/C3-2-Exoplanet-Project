import * as THREE from 'three';
import gsap from 'gsap';
import { INTERIOR, PLANET } from '../data/c32.js';
import { interiorVertex, interiorFragment } from '../shaders/interior.js';
import { makeLabel } from '../scene/labels.js';
import { PLANET_STAGE } from './planetView.js';

// Interior view: a ~90° wedge is cut out of C3-2 (like a sliced orange) and
// the story steps from the atmosphere down to the core.
//
// How the cut works: two clipping planes through the planet's centre, with
// clipIntersection = true, remove only the region on the "wrong" side of
// both, i.e. the wedge between angle 0 and angle θ around the vertical axis.
// The flat faces of the cut are two half-discs drawn with interior.js, which
// colours each pixel by the layer its radius falls in.
const WEDGE = Math.PI / 2;

const LAYER_COLORS = [
  ['#ffd2a8', '#fff1e2'], // atmosphere: orange-white
  ['#04313f', '#20b3ad'], // ocean: deep teal -> bright teal at the top
  ['#7fb2d9', '#d8f0ff'], // ice VII: pale blue
  ['#3a2a6e', '#5e6fc4'], // mantle: purple-blue
  ['#5a1406', '#ff7a2a'], // core: dark red -> glowing orange
];

// Where each layer label sits on the first cut face (elevation in degrees)
const LABEL_ELEVATION = [60, 46, 30, 12, -8];

export function createInteriorView({ planetView, rig, ui }) {
  const R = PLANET.radius_km;
  const layers = INTERIOR.layers;
  const radii = [1, ...layers.map((l) => l.innerRadius_km / R)]; // 6 values, last = 0

  const group = new THREE.Group();
  group.visible = false;
  planetView.group.add(group);

  const sharedUniforms = {
    uR: { value: radii },
    uColA: { value: LAYER_COLORS.map((c) => new THREE.Color(c[0])) },
    uColB: { value: LAYER_COLORS.map((c) => new THREE.Color(c[1])) },
    uActive: { value: -1 },
    uTime: { value: 0 },
    uReveal: { value: 0 },
  };
  const faceMaterial = (shade) =>
    new THREE.ShaderMaterial({
      vertexShader: interiorVertex,
      fragmentShader: interiorFragment,
      uniforms: { ...sharedUniforms, uShade: { value: shade } },
      side: THREE.DoubleSide,
      transparent: true,
    });
  const faceGeo = new THREE.CircleGeometry(1, 192, -Math.PI / 2, Math.PI); // half-disc, x >= 0
  const faceA = new THREE.Mesh(faceGeo, faceMaterial(1.0));
  const faceB = new THREE.Mesh(faceGeo, faceMaterial(0.78));
  faceA.renderOrder = 1;
  faceB.renderOrder = 1;
  group.add(faceA, faceB);

  // Layer labels
  const labelObjs = layers.map((l, i) => {
    const rMid = i === layers.length - 1 ? radii[4] * 0.45 : (radii[i] + radii[i + 1]) / 2;
    const e = THREE.MathUtils.degToRad(LABEL_ELEVATION[i]);
    const label = makeLabel(l.name.replace(/ \(.*\)$/, ''), { className: 'label-layer' });
    label.position.set(rMid * Math.cos(e), rMid * Math.sin(e), 0.002);
    label.userData = { rMid, e };
    group.add(label);
    return label;
  });

  // Clipping planes (world space, updated each frame)
  const planeA = new THREE.Plane();
  const planeB = new THREE.Plane();
  const planes = [planeA, planeB];
  for (const m of planetView.clippable) {
    m.clippingPlanes = planes;
    m.clipIntersection = true;
    m.clipping = true;
    m.needsUpdate = true;
  }

  const state = { theta: 0, active: false, step: 0, busy: false, depth: 0 };
  const q = new THREE.Quaternion();
  const n = new THREE.Vector3();
  const center = new THREE.Vector3();

  function updatePlanes() {
    group.updateWorldMatrix(true, false);
    group.getWorldQuaternion(q);
    group.getWorldPosition(center);
    n.set(0, 0, -1).applyQuaternion(q);
    planeA.setFromNormalAndCoplanarPoint(n, center);
    n.set(-Math.sin(state.theta), 0, Math.cos(state.theta)).applyQuaternion(q);
    planeB.setFromNormalAndCoplanarPoint(n, center);
    faceB.rotation.y = -state.theta;
  }

  // ---- camera poses for each story step (local to `group`) ------------------
  const toWorld = (v) => group.localToWorld(v.clone());
  const bis = new THREE.Vector3(Math.cos(WEDGE / 2), 0, Math.sin(WEDGE / 2));

  function stepPose(step) {
    if (step === 0) {
      const d = rig.fitDistance(1.05, 1.15);
      const local = bis.clone().multiplyScalar(d * 0.92).add(new THREE.Vector3(0, d * 0.38, 0));
      return { position: toWorld(local), target: toWorld(new THREE.Vector3(0.08, -0.05, 0.08)) };
    }
    const i = step - 1;
    const l = layers[i];
    const thick = (l.outerRadius_km - l.innerRadius_km) / R;
    const rMid = i === layers.length - 1 ? radii[4] * 0.35 : (radii[i] + radii[i + 1]) / 2;
    const e = THREE.MathUtils.degToRad(i < 2 ? 22 : i === 4 ? 0 : 16);
    const target = new THREE.Vector3(rMid * Math.cos(e), rMid * Math.sin(e), 0);
    const dist = Math.max(0.11, Math.min(1.6, thick * 3.2));
    // look at the first cut face from inside the wedge, slightly from above/outside
    const off = new THREE.Vector3(0.28, 0.2, 1).normalize().multiplyScalar(dist);
    return { position: toWorld(target.clone().add(off)), target: toWorld(target) };
  }

  function depthForStep(step) {
    if (step === 0) return 0;
    const l = layers[step - 1];
    return step === layers.length ? R : (l.depthTop_km + l.depthBottom_km) / 2;
  }

  function goToStep(step, duration = 1.5) {
    step = THREE.MathUtils.clamp(step, 0, layers.length);
    state.step = step;
    // the glow shell would wash out the view from inside the planet
    gsap.to(planetView.materials.atmo.uniforms.uStrength, { value: step === 0 ? 0.5 : 0, duration: 0.8 });
    gsap.to(planetView.materials.clouds.uniforms.uOpacity, { value: step === 0 ? 0.92 : 0.25, duration: 0.8 });
    state.busy = true;
    sharedUniforms.uActive.value = step === 0 ? -1 : step - 1;
    labelObjs.forEach((lab, i) => lab.element.classList.toggle('is-active', i === step - 1));
    ui.setStep(step, step === 0 ? null : layers[step - 1]);
    const p = stepPose(step);
    gsap.to(state, {
      depth: depthForStep(step),
      duration,
      ease: 'power2.inOut',
      onUpdate: () => ui.setDepth(state.depth, step === 0 ? null : layers[step - 1]),
    });
    return rig.flyTo(p.position, p.target, { duration, arc: 0.05, keepControls: true }).then(() => {
      state.busy = false;
    });
  }

  // ---- enter / exit ----------------------------------------------------------
  async function enter() {
    if (state.active) return;
    state.active = true;
    state.busy = true;
    // open the wedge towards the camera so the flight is short
    const cam = rig.camera.position.clone().sub(PLANET_STAGE);
    const phiCam = Math.atan2(cam.z, cam.x);
    group.rotation.y = WEDGE / 2 - phiCam;
    group.visible = true;
    planetView.setSpinScale(0.05);
    rig.controls.enabled = false;
    ui.show();
    gsap.to(state, { theta: WEDGE, duration: 1.6, ease: 'power2.inOut', delay: 0.15 });
    gsap.to(sharedUniforms.uReveal, { value: 1, duration: 1.0, delay: 0.25 });
    await goToStep(0, 1.7);
  }

  // fly = false: close the wedge in place while another flight takes over
  async function exit({ fly = true } = {}) {
    if (!state.active) return;
    state.busy = true;
    ui.hide();
    sharedUniforms.uActive.value = -1;
    labelObjs.forEach((lab) => lab.element.classList.remove('is-active'));
    gsap.to(state, { theta: 0, duration: 1.4, ease: 'power2.inOut', delay: fly ? 0.3 : 0 });
    gsap.to(sharedUniforms.uReveal, { value: 0, duration: 0.8, delay: fly ? 1.0 : 0.5 });
    gsap.to(planetView.materials.atmo.uniforms.uStrength, { value: 1.25, duration: 1.4 });
    gsap.to(planetView.materials.clouds.uniforms.uOpacity, { value: 0.92, duration: 1.0 });
    const finish = () => {
      group.visible = false;
      state.theta = 0;
      state.active = false;
      state.busy = false;
      state.step = 0;
      planetView.setSpinScale(1);
    };
    if (!fly) {
      gsap.delayedCall(1.45, finish);
      return;
    }
    const p = planetView.pose();
    await rig.flyTo(p.position, p.target, { duration: 1.8, arc: 0.1 });
    finish();
  }

  // ---- scroll / swipe / keys drive the story ------------------------------------
  let wheelAcc = 0;
  let lastStepAt = 0;
  function nudge(dir) {
    if (!state.active || state.busy) return;
    const now = performance.now();
    if (now - lastStepAt < 700) return;
    const next = state.step + dir;
    if (next < 0) return; // "Back to surface" is explicit
    if (next > layers.length) return;
    lastStepAt = now;
    goToStep(next);
  }
  window.addEventListener(
    'wheel',
    (e) => {
      if (!state.active) return;
      if (e.target.closest && e.target.closest('.drawer, .panel')) return;
      e.preventDefault();
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) > 60) {
        nudge(Math.sign(wheelAcc));
        wheelAcc = 0;
      }
    },
    { passive: false },
  );
  let touchY = null;
  window.addEventListener('touchstart', (e) => {
    if (state.active && e.touches.length === 1) touchY = e.touches[0].clientY;
  });
  window.addEventListener('touchend', (e) => {
    if (!state.active || touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) > 40) nudge(dy > 0 ? 1 : -1);
  });
  window.addEventListener('keydown', (e) => {
    if (!state.active) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) nudge(1);
    if (['ArrowUp', 'PageUp'].includes(e.key)) nudge(-1);
  });

  function update(realTime) {
    sharedUniforms.uTime.value = realTime;
    if (state.theta > 0.0001 || group.visible) updatePlanes();
  }
  updatePlanes();

  return {
    id: 'interior',
    enter,
    exit,
    update,
    next: () => nudge(1),
    prev: () => nudge(-1),
    goToStep: (s) => !state.busy && goToStep(s),
    get active() {
      return state.active;
    },
    get busy() {
      return state.busy;
    },
    get step() {
      return state.step;
    },
    stepCount: layers.length + 1,
  };
}
