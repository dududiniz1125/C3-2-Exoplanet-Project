import * as THREE from 'three';
import gsap from 'gsap';
import { INTERIOR, PLANET } from '../data/c32.js';
import { interiorVertex, interiorFragment } from '../shaders/interior.js';
import { makeLabel } from '../scene/labels.js';
import { PLANET_STAGE } from './planetView.js';

// Interior view: C3-2 is sliced through its centre and the story steps from
// the atmosphere down to the core.
//
// How the cut works: one clipping plane faces the camera and removes the
// near half of the planet. The reveal slides that plane from the front
// surface in to the centre, like a knife going through an orange. The cut
// face is a disc in the same plane (interior.js colours it by true 3D
// radius), and the camera always looks at it square-on, so every layer
// boundary is a perfect circle, at every step and during the animation.
const OFFSET_HIDDEN = 1.2; // plane beyond the atmosphere glow: nothing clipped

const LAYER_COLORS = [
  ['#f0b98a', '#f7dcc4'], // atmosphere: orange-white
  ['#04313f', '#20b3ad'], // ocean: deep teal -> bright teal at the top
  ['#4a7fae', '#a6cfec'], // ice VII: pale blue (kept under the bloom threshold)
  ['#3a2a6e', '#5e6fc4'], // mantle: purple-blue
  ['#5a1406', '#ff7a2a'], // core: dark red -> glowing orange
];

// Where each layer's label and close-up sit on the cut face: angle around
// the disc (degrees, 0 = right, 90 = up). The labels are centred pills inside
// the disc, spread round it so they never meet and never reach the side panels.
const LABEL_ANGLE = [50, 130, -60, 225, 0];
// Camera distance from the face for each layer's close-up (planet radii)
const CLOSE_UP = [0.13, 0.18, 0.75, 1.3, 0.95];

export function createInteriorView({ planetView, rig, ui }) {
  const R = PLANET.radius_km;
  const layers = INTERIOR.layers;
  const radii = [1, ...layers.map((l) => l.innerRadius_km / R)]; // 6 values, last = 0

  const group = new THREE.Group();
  group.visible = false;
  planetView.group.add(group);

  const uniforms = {
    uR: { value: radii },
    uColA: { value: LAYER_COLORS.map((c) => new THREE.Color(c[0])) },
    uColB: { value: LAYER_COLORS.map((c) => new THREE.Color(c[1])) },
    uActive: { value: -1 },
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uOffset: { value: OFFSET_HIDDEN },
    uShade: { value: 1 },
  };
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(1, 256),
    new THREE.ShaderMaterial({
      vertexShader: interiorVertex,
      fragmentShader: interiorFragment,
      uniforms,
      side: THREE.DoubleSide,
      transparent: true,
    }),
  );
  face.renderOrder = 1;
  group.add(face);

  // Point on the cut face for layer i (local coordinates, z = 0)
  function layerPoint(i) {
    // the core label sits at the centre; the mantle's halfway down its band
    const rMid = i === layers.length - 1 ? 0 : (radii[i] + radii[i + 1]) / 2;
    const a = THREE.MathUtils.degToRad(LABEL_ANGLE[i]);
    return new THREE.Vector3(rMid * Math.cos(a), rMid * Math.sin(a), 0);
  }

  const labelObjs = layers.map((l, i) => {
    const label = makeLabel(l.name.replace(/ \(.*\)$/, ''), { className: 'label-layer' });
    label.center.set(0.5, 0.5);
    label.position.copy(layerPoint(i)).setZ(0.003);
    label.element.classList.add('is-hidden');
    group.add(label);
    return label;
  });

  // One clipping plane shared by the surface, clouds and atmosphere
  const plane = new THREE.Plane();
  for (const m of planetView.clippable) {
    m.clippingPlanes = [plane];
    m.clipIntersection = false;
    m.clipping = true;
    m.needsUpdate = true;
  }

  const state = { offset: OFFSET_HIDDEN, active: false, step: 0, busy: false, depth: 0 };
  const u = new THREE.Vector3();
  const center = new THREE.Vector3();
  const q = new THREE.Quaternion();

  function updatePlane() {
    group.updateWorldMatrix(true, false);
    group.getWorldPosition(center);
    u.set(0, 0, 1).applyQuaternion(group.getWorldQuaternion(q));
    // keep the half of the planet behind the plane (away from the camera)
    plane.setFromNormalAndCoplanarPoint(u.clone().negate(), center.clone().addScaledVector(u, state.offset));
    face.position.z = state.offset;
    uniforms.uOffset.value = state.offset;
  }

  // ---- camera poses (local to `group`, always square-on to the face) ---------
  const toWorld = (v) => group.localToWorld(v.clone());
  function stepPose(step) {
    if (step === 0) {
      // leave room for the depth gauge (left) and layer card (right)
      const d = rig.fitDistance(1.05, window.innerWidth < 1200 ? 1.6 : 1.35);
      return { position: toWorld(new THREE.Vector3(0, 0, d)), target: toWorld(new THREE.Vector3()) };
    }
    const p = layerPoint(step - 1);
    return { position: toWorld(p.clone().setZ(CLOSE_UP[step - 1])), target: toWorld(p) };
  }

  function depthForStep(step) {
    if (step === 0) return 0;
    const l = layers[step - 1];
    return step === layers.length ? R : (l.depthTop_km + l.depthBottom_km) / 2;
  }

  // At the overview every label shows; in a close-up only the current one
  function showLabels(step) {
    labelObjs.forEach((lab, i) => {
      lab.element.classList.toggle('is-active', i === step - 1);
      lab.element.classList.toggle('is-hidden', !(step === 0 || i === step - 1));
    });
  }

  function goToStep(step, duration = 1.5) {
    step = THREE.MathUtils.clamp(step, 0, layers.length);
    state.step = step;
    state.busy = true;
    // the glow shell and clouds would wash out the view inside the planet
    gsap.to(planetView.materials.atmo.uniforms.uStrength, { value: step === 0 ? 0.6 : 0, duration: 0.8 });
    gsap.to(planetView.materials.clouds.uniforms.uOpacity, { value: step === 0 ? 0.6 : 0.2, duration: 0.8 });
    gsap.to(planetView.materials.surface.uniforms.uDim, { value: step === 0 ? 0.7 : 0.3, duration: 0.8 });
    uniforms.uActive.value = step === 0 ? -1 : step - 1;
    if (state.offset < 0.01) showLabels(step);
    ui.setStep(step, step === 0 ? null : layers[step - 1]);
    const p = stepPose(step);
    gsap.to(state, {
      depth: depthForStep(step),
      duration,
      ease: 'power2.inOut',
      onUpdate: () => ui.setDepth(state.depth, step === 0 ? null : layers[step - 1]),
    });
    return rig.flyTo(p.position, p.target, { duration, arc: 0.04, keepControls: true }).then(() => {
      state.busy = false;
    });
  }

  // ---- enter / exit ----------------------------------------------------------
  async function enter() {
    if (state.active) return;
    state.active = true;
    state.busy = true;
    // face the cut towards where the camera already is (elevation capped) so
    // the flight is short and the rings face the viewer
    const dir = rig.camera.position.clone().sub(PLANET_STAGE).normalize();
    dir.y = THREE.MathUtils.clamp(dir.y, -0.4, 0.4);
    dir.normalize();
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    group.visible = true;
    state.offset = 1.0;
    planetView.setSpinScale(0.05);
    rig.controls.enabled = false;
    ui.show();
    gsap.to(uniforms.uReveal, { value: 1, duration: 0.6 });
    gsap.to(state, {
      offset: 0,
      duration: 1.7,
      ease: 'power2.inOut',
      delay: 0.1,
      onComplete: () => showLabels(state.step),
    });
    await goToStep(0, 1.8);
  }

  // fly = false: close the cut in place while another flight takes over
  async function exit({ fly = true } = {}) {
    if (!state.active) return;
    state.busy = true;
    ui.hide();
    uniforms.uActive.value = -1;
    labelObjs.forEach((lab) => lab.element.classList.add('is-hidden'));
    gsap.to(state, { offset: 1.0, duration: 1.3, ease: 'power2.inOut', delay: fly ? 0.3 : 0 });
    gsap.to(uniforms.uReveal, { value: 0, duration: 0.4, delay: fly ? 1.3 : 1.0 });
    gsap.to(planetView.materials.atmo.uniforms.uStrength, { value: 1.25, duration: 1.4 });
    gsap.to(planetView.materials.clouds.uniforms.uOpacity, { value: 0.92, duration: 1.0 });
    gsap.to(planetView.materials.surface.uniforms.uDim, { value: 1, duration: 1.0 });
    const finish = () => {
      group.visible = false;
      state.offset = OFFSET_HIDDEN;
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
    if (next < 0 || next > layers.length) return; // "Back to surface" is explicit
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
    if (['ArrowDown', 'PageDown'].includes(e.key)) nudge(1);
    if (['ArrowUp', 'PageUp'].includes(e.key)) nudge(-1);
  });

  // Safety net for small screens: if two visible labels still touch, hide the
  // later one (the current layer's label always wins)
  let overlapTimer = 0;
  function resolveOverlaps() {
    const shown = labelObjs
      .map((lab, i) => ({ el: lab.element, i, active: lab.element.classList.contains('is-active') }))
      .filter(({ el }) => !el.classList.contains('is-hidden'));
    shown.sort((a, b) => Number(b.active) - Number(a.active) || a.i - b.i);
    shown.forEach(({ el }) => el.classList.remove('is-crowded'));
    const kept = [];
    for (const { el } of shown) {
      const r = el.getBoundingClientRect();
      const hit = kept.some((k) => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 4 && r.bottom > k.top - 4);
      if (hit) el.classList.add('is-crowded');
      else kept.push(r);
    }
  }

  function update(realTime, dt = 0) {
    uniforms.uTime.value = realTime;
    if (group.visible || state.offset < OFFSET_HIDDEN) updatePlane();
    overlapTimer -= dt;
    if (state.active && overlapTimer <= 0) {
      overlapTimer = 0.25;
      resolveOverlaps();
    }
  }
  updatePlane();

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
