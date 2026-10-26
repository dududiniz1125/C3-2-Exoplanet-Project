import * as THREE from 'three';
import { PLANET, COMPARE_PLANETS, INTERIOR, C32 } from '../data/c32.js';
import { createPlanetMaterials, limbFor } from '../scene/planetMaterials.js';
import { surfaceVertex, comparePlanetFragment } from '../shaders/planet.js';
import { orbitState } from '../scene/orbit.js';
import { makeLabel } from '../scene/labels.js';
import { DAY, HOUR } from '../scene/clock.js';

// Planet view: C3-2 at its true size ratio to the comparison planets.
// Scene units: 1 = planet radius (13,500 km = 2.1 R⊕).
export const PLANET_STAGE = new THREE.Vector3(0, 0, -6000);

// The ocean surface sits under the atmosphere layer of the interior model
export const R_SURFACE = INTERIOR.layers[0].innerRadius_km / PLANET.radius_km;
const R_CLOUDS = R_SURFACE + (1 - R_SURFACE) * 0.45;
const R_GLOW = 1.06;

const TILT = THREE.MathUtils.degToRad(PLANET.tilt_deg);
const KIND = { earth: 0, mars: 1, neptune: 2 };

export function createPlanetView({ scene, planetTexture, lightColor, rig }) {
  const group = new THREE.Group();
  group.name = 'planet-stage';
  group.position.copy(PLANET_STAGE);
  scene.add(group);

  // Axis tilt: the spin axis leans 25.8° from the orbit's normal
  const tilt = new THREE.Group();
  tilt.rotation.z = -TILT;
  group.add(tilt);
  const spin = new THREE.Group();
  tilt.add(spin);

  const mats = createPlanetMaterials(planetTexture, lightColor);
  mats.atmo.uniforms.uLimb.value = limbFor(1, R_GLOW);
  const surface = new THREE.Mesh(new THREE.SphereGeometry(R_SURFACE, 160, 80), mats.surface);
  spin.add(surface);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R_CLOUDS, 128, 64), mats.clouds);
  clouds.renderOrder = 2;
  tilt.add(clouds);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R_GLOW, 96, 48), mats.atmo);
  atmo.renderOrder = 3;
  group.add(atmo);

  // --- Spin axis + 25.8° marker ---------------------------------------------
  const axis = new THREE.Group();
  axis.visible = false;
  const axisLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.6, 0), new THREE.Vector3(0, 1.6, 0)]),
    new THREE.LineBasicMaterial({ color: 0x4fd1c5 }),
  );
  tilt.add(axisLine);
  axisLine.visible = false;
  const vertical = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.45, 0), new THREE.Vector3(0, 1.45, 0)]),
    new THREE.LineDashedMaterial({ color: 0xe8ecff, transparent: true, opacity: 0.5, dashSize: 0.05, gapSize: 0.04 }),
  );
  vertical.computeLineDistances();
  axis.add(vertical);
  const arcPts = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * TILT;
    arcPts.push(new THREE.Vector3(Math.sin(a) * 1.35, Math.cos(a) * 1.35, 0));
  }
  axis.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), new THREE.LineBasicMaterial({ color: 0xff9a3c })));
  const tiltLabel = makeLabel(PLANET.tiltText, { className: 'label-tilt', sub: 'axial tilt' });
  tiltLabel.position.set(Math.sin(TILT / 2) * 1.42, Math.cos(TILT / 2) * 1.42, 0);
  axis.add(tiltLabel);
  group.add(axis);

  // --- Compare size -----------------------------------------------------------
  const compareGroup = new THREE.Group();
  group.add(compareGroup);
  const compareMeshes = {};
  for (const [key, info] of Object.entries(COMPARE_PLANETS)) {
    const r = info.radius_Rearth / PLANET.radius_Rearth;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 96, 48),
      new THREE.ShaderMaterial({
        vertexShader: surfaceVertex,
        fragmentShader: comparePlanetFragment,
        uniforms: { uLightDir: mats.light, uLightColor: mats.lightColor, uKind: { value: KIND[key] } },
      }),
    );
    m.visible = false;
    m.userData.radius = r;
    const label = makeLabel(info.name, { className: 'label-compare', sub: info.radiusText });
    label.center.set(0.5, 0);
    label.position.set(0, -r - 0.12, 0);
    m.add(label);
    compareGroup.add(m);
    compareMeshes[key] = m;
  }
  const selfLabel = makeLabel(C32.name, { className: 'label-compare', sub: `${PLANET.radius_Rearth} R⊕` });
  selfLabel.center.set(0.5, 0);
  selfLabel.position.set(0, -1.18, 0);
  selfLabel.visible = false;
  group.add(selfLabel);
  let compareKey = 'none';

  // --- Per-frame -------------------------------------------------------------
  const st = {};
  const L = new THREE.Vector3();
  const axisW = new THREE.Vector3();
  let spinScale = 1;
  let spinAngle = 0;
  let cloudAngle = 0;

  function update(simTime, dtSim) {
    orbitState(simTime, st);
    L.set(-st.x, 0, -st.z).normalize(); // towards the star
    mats.light.value.copy(L);
    axisW.set(Math.sin(TILT), Math.cos(TILT), 0);
    mats.surface.uniforms.uSeason.value = L.dot(axisW);
    // one turn per 26.5 h of simulated time; clouds drift a little faster
    const turn = (dtSim / (PLANET.day_h * HOUR)) * Math.PI * 2 * spinScale;
    spinAngle = (spinAngle + turn) % (Math.PI * 2);
    cloudAngle = (cloudAngle + turn * 1.03) % (Math.PI * 2);
    spin.rotation.y = spinAngle;
    clouds.rotation.y = cloudAngle;
    mats.clouds.uniforms.uDrift.value = (simTime / (60 * DAY)) % 1;
  }

  // Default pose: looking at the day side with the terminator in view
  function pose() {
    const dir = L.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.95);
    dir.y = 0.32;
    dir.normalize();
    const d = rig.fitDistance(1.0, 1.7);
    return { position: PLANET_STAGE.clone().add(dir.multiplyScalar(d)), target: PLANET_STAGE.clone() };
  }

  function setCompare(key) {
    compareKey = key;
    for (const [k, m] of Object.entries(compareMeshes)) m.visible = k === key;
    selfLabel.visible = key !== 'none';
    if (key === 'none') return pose();
    const m = compareMeshes[key];
    const r = m.userData.radius;
    // put the other planet to the right of C3-2 as seen from the camera
    const cam = rig.camera;
    const viewDir = cam.position.clone().sub(PLANET_STAGE).setY(0).normalize();
    if (viewDir.lengthSq() < 0.1) viewDir.set(0, 0, 1);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), viewDir).normalize();
    const gap = 0.35 + 0.15 * Math.max(1, r);
    m.position.copy(right).multiplyScalar(1 + gap + r);
    // frame the pair: from C3-2's left edge to the other planet's right edge
    const leftEdge = -1;
    const rightEdge = 1 + gap + 2 * r;
    const centerLocal = right.clone().multiplyScalar((leftEdge + rightEdge) / 2);
    const halfWidth = (rightEdge - leftEdge) / 2;
    const target = PLANET_STAGE.clone().add(centerLocal);
    const d = rig.fitDistance(halfWidth, 1.25);
    const position = target.clone().add(viewDir.clone().multiplyScalar(d)).add(new THREE.Vector3(0, d * 0.12, 0));
    return { position, target };
  }

  update(0, 0);

  return {
    id: 'planet',
    group,
    update,
    pose,
    setCompare,
    get compareKey() {
      return compareKey;
    },
    setAxis(on) {
      axis.visible = on;
      axisLine.visible = on;
    },
    setSpinScale(s) {
      spinScale = s;
    },
    materials: mats,
    clippable: [mats.surface, mats.clouds, mats.atmo],
    controlsLimits: { minDistance: 1.2, maxDistance: 9, enablePan: false },
    interiorTriggerDistance: 1.34,
  };
}
