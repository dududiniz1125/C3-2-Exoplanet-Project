import * as THREE from 'three';
import { STAR, SOLAR } from '../data/c32.js';
import { starVertex, starFragment, coronaVertex, coronaFragment } from '../shaders/star.js';
import { makeLabel } from '../scene/labels.js';
import { limbFor } from '../scene/planetMaterials.js';

// Star view. Scene units: 1 = the host star's radius (0.56 R☉),
// so the Sun in "Compare to Sun" has radius 1 / 0.56.
export const STAR_STAGE = new THREE.Vector3(6000, 0, 0);
const SUN_RADIUS = 1 / STAR.radius_Rsun;

function makeStar({ color, limbColor, radius, glowTexture, intensity }) {
  const g = new THREE.Group();
  const uniforms = {
    uColor: { value: color.clone() },
    uLimbColor: { value: limbColor.clone() },
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uGranScale: { value: 30 },
    uDetail: { value: 1 },
  };
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 128, 64),
    new THREE.ShaderMaterial({ vertexShader: starVertex, fragmentShader: starFragment, uniforms }),
  );
  g.add(body);
  const shell = radius * 1.45;
  const coronaUniforms = {
    uColor: { value: color.clone() },
    uTime: { value: 0 },
    uLimb: { value: limbFor(radius, shell) },
    uStrength: { value: 0.45 },
  };
  const corona = new THREE.Mesh(
    new THREE.SphereGeometry(shell, 96, 48),
    new THREE.ShaderMaterial({
      vertexShader: coronaVertex,
      fragmentShader: coronaFragment,
      uniforms: coronaUniforms,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  g.add(corona);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.scale.setScalar(radius * 6);
  g.add(glow);
  return {
    group: g,
    tick(t) {
      uniforms.uTime.value = t;
      coronaUniforms.uTime.value = t;
      body.rotation.y = t * 0.01;
    },
  };
}

export function createStarView({ scene, glowTexture, starColor, starLimbColor, sunColor, sunLimbColor, rig }) {
  const group = new THREE.Group();
  group.name = 'star-stage';
  group.position.copy(STAR_STAGE);
  scene.add(group);

  const star = makeStar({ color: starColor, limbColor: starLimbColor, radius: 1, glowTexture, intensity: 1.35 });
  group.add(star.group);
  const starLabel = makeLabel(STAR.name, { className: 'label-compare', sub: `${STAR.radius_Rsun} R☉ · ${STAR.temperatureText}` });
  starLabel.center.set(0.5, 0);
  starLabel.position.set(0, -1.25, 0);
  starLabel.visible = false;
  group.add(starLabel);

  const sun = makeStar({ color: sunColor, limbColor: sunLimbColor, radius: SUN_RADIUS, glowTexture, intensity: 0.98 });
  sun.group.visible = false;
  group.add(sun.group);
  const sunLabel = makeLabel('Sun', { className: 'label-compare', sub: `1 R☉ · ${SOLAR.sunTemperatureText}` });
  sunLabel.center.set(0.5, 0);
  sunLabel.position.set(0, -SUN_RADIUS - 0.25, 0);
  sun.group.add(sunLabel);

  let comparing = false;

  function update(_simTime, realTime) {
    star.tick(realTime);
    if (comparing) sun.tick(realTime + 40);
  }

  function pose() {
    if (comparing) {
      const gap = 0.9;
      // star on the left, Sun on the right
      const left = -1;
      const right = 1 + gap + 2 * SUN_RADIUS;
      const cx = (left + right) / 2;
      sun.group.position.set(1 + gap + SUN_RADIUS, 0, 0);
      const target = STAR_STAGE.clone().add(new THREE.Vector3(cx, 0, 0));
      const d = rig.fitDistance((right - left) / 2, 1.2);
      return { position: target.clone().add(new THREE.Vector3(0, d * 0.08, d)), target };
    }
    const d = rig.fitDistance(1.25, 1.15);
    return {
      position: STAR_STAGE.clone().add(new THREE.Vector3(d * 0.35, d * 0.12, d * 0.93)),
      target: STAR_STAGE.clone(),
    };
  }

  return {
    id: 'star',
    group,
    update,
    pose,
    setCompare(on) {
      comparing = on;
      sun.group.visible = on;
      starLabel.visible = on;
      return pose();
    },
    get comparing() {
      return comparing;
    },
    controlsLimits: { minDistance: 1.6, maxDistance: 14, enablePan: false },
  };
}
