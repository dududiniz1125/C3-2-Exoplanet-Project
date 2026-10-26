import * as THREE from 'three';
import { ORBIT, SOLAR, STAR, C32 } from '../data/c32.js';
import { orbitState, orbitPoints } from '../scene/orbit.js';
import { makeLabel } from '../scene/labels.js';
import { createPlanetMaterials } from '../scene/planetMaterials.js';
import { starVertex, starFragment } from '../shaders/star.js';
import { ringVertex, ringFragment } from '../shaders/space.js';
import { DAY } from '../scene/clock.js';

// System view: distances to scale (1 AU = 100 scene units), bodies enlarged.
export const AU = 100;
const STAR_SIZE = 2.6; // exaggerated (true radius would be 0.26 units)
const PLANET_SIZE = 1.15; // exaggerated (true radius would be 0.009 units)

function ring(inner, outer, color, opacity) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: ringVertex,
    fragmentShader: ringFragment,
    uniforms: {
      uInner: { value: inner },
      uOuter: { value: outer },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pad = (outer - inner) * 0.1;
  const mesh = new THREE.Mesh(new THREE.RingGeometry(inner - pad, outer + pad, 256, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function circleLine(radius, color, opacity, dashed = false) {
  const pts = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: radius * 0.04, gapSize: radius * 0.03 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(g, m);
  if (dashed) line.computeLineDistances();
  return line;
}

export function createSystemView({ scene, planetTexture, glowTexture, starColor, starLimbColor, lightColor, rig }) {
  const group = new THREE.Group();
  group.name = 'system-stage';
  scene.add(group);

  // --- Star -----------------------------------------------------------------
  const starUniforms = {
    uColor: { value: starColor.clone() },
    uLimbColor: { value: starLimbColor.clone() },
    uTime: { value: 0 },
    uIntensity: { value: 1.3 },
    uGranScale: { value: 14 },
    uDetail: { value: 0 },
  };
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(STAR_SIZE, 64, 32),
    new THREE.ShaderMaterial({ vertexShader: starVertex, fragmentShader: starFragment, uniforms: starUniforms }),
  );
  group.add(star);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: starColor,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.scale.setScalar(STAR_SIZE * 8);
  group.add(glow);
  const starLabel = makeLabel(STAR.name, { className: 'label-star' });
  starLabel.position.set(STAR_SIZE * 1.3, STAR_SIZE * 1.1, 0);
  group.add(starLabel);

  // --- Orbit (e = 0.03, star at a focus) ------------------------------------
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(
    orbitPoints(512).map(([x, z]) => new THREE.Vector3(x * AU, 0, z * AU)),
  );
  const orbitLine = new THREE.Line(
    orbitGeo,
    new THREE.LineBasicMaterial({ color: 0xffc58a, transparent: true, opacity: 0.55 }),
  );
  group.add(orbitLine);
  // tiny cross at the ellipse centre, so the star's offset focus is visible
  const c = ORBIT.radius_AU * ORBIT.eccentricity * AU;
  const crossGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-c - 0.6, 0, 0),
    new THREE.Vector3(-c + 0.6, 0, 0),
    new THREE.Vector3(-c, 0, -0.6),
    new THREE.Vector3(-c, 0, 0.6),
  ]);
  const cross = new THREE.LineSegments(crossGeo, new THREE.LineBasicMaterial({ color: 0xffc58a, transparent: true, opacity: 0.35 }));
  group.add(cross);

  // --- Habitable zone -------------------------------------------------------
  const hz = ring(ORBIT.hz_AU[0] * AU, ORBIT.hz_AU[1] * AU, '#4fd1c5', 0.16);
  group.add(hz);
  const hzLabel = makeLabel('Habitable zone', { className: 'label-hz', sub: ORBIT.hzText });
  hz.add(hzLabel);
  // ring is rotated (local -y = world +z): put the label on the far side
  hzLabel.position.set(-ORBIT.hz_AU[1] * AU * 0.55, ORBIT.hz_AU[1] * AU * 0.83, 0);

  // --- Planet ---------------------------------------------------------------
  const mats = createPlanetMaterials(planetTexture, lightColor);
  mats.atmo.uniforms.uStrength.value = 0.9;
  const planet = new THREE.Group();
  const surface = new THREE.Mesh(new THREE.SphereGeometry(PLANET_SIZE, 64, 32), mats.surface);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(PLANET_SIZE * 1.01, 64, 32), mats.clouds);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(PLANET_SIZE * 1.12, 48, 24), mats.atmo);
  mats.atmo.uniforms.uLimb.value = Math.sqrt(1 - (1 / 1.12) ** 2);
  planet.add(surface, clouds, atmo);
  group.add(planet);
  const planetLabel = makeLabel(C32.name, { className: 'label-planet' });
  planetLabel.position.set(PLANET_SIZE * 1.6, PLANET_SIZE * 1.4, 0);
  planet.add(planetLabel);

  // --- Solar System comparison overlay -------------------------------------
  const solar = new THREE.Group();
  solar.visible = false;
  for (const o of SOLAR.orbits) {
    const line = circleLine(o.au * AU, 0xbfd0ff, 0.6, true);
    solar.add(line);
    const l = makeLabel(o.name, { className: 'label-solar', sub: `${o.au} AU` });
    // labels on the far side of each orbit, clear of the bottom UI
    l.position.set(o.au * AU * Math.cos(-2.2), 0, o.au * AU * Math.sin(-2.2));
    solar.add(l);
  }
  const sunHz = ring(SOLAR.hz_AU[0] * AU, SOLAR.hz_AU[1] * AU, '#9be27f', 0.035);
  solar.add(sunHz);
  const sunHzLabel = makeLabel('Sun’s habitable zone', { className: 'label-solar-hz', sub: SOLAR.hzText });
  sunHzLabel.position.set(SOLAR.hz_AU[1] * AU * Math.cos(-0.75), 0, SOLAR.hz_AU[1] * AU * Math.sin(-0.75));
  solar.add(sunHzLabel);
  group.add(solar);

  // --- State ----------------------------------------------------------------
  const st = {};
  const tmp = new THREE.Vector3();

  function update(simTime, realTime) {
    starUniforms.uTime.value = realTime;
    orbitState(simTime, st);
    planet.position.set(st.x * AU, 0, st.z * AU);
    // spin is invisible at this size but keeps the clouds moving
    surface.rotation.y = (simTime / (26.5 * 3600)) * Math.PI * 2;
    clouds.rotation.y = surface.rotation.y * 1.04;
    mats.clouds.uniforms.uDrift.value = (simTime / (40 * DAY)) % 1;
    tmp.copy(planet.position).negate().normalize();
    mats.light.value.copy(tmp);
  }

  // Frame the habitable zone (or Earth's orbit when comparing), seen from
  // about 35° above the orbital plane
  function pose(compare = false) {
    const target = new THREE.Vector3(0, 0, 0);
    const radius = compare ? SOLAR.hz_AU[1] * AU : ORBIT.hz_AU[1] * AU;
    const d = rig.fitDistance(radius, 1.3);
    const dir = new THREE.Vector3(0.15, compare ? 1.0 : 0.85, 1).normalize();
    return { position: dir.multiplyScalar(d), target };
  }

  return {
    id: 'system',
    group,
    update,
    pose,
    setHabitableZone(on) {
      hz.visible = on;
    },
    setSolarCompare(on) {
      solar.visible = on;
    },
    get solarCompare() {
      return solar.visible;
    },
    controlsLimits: { minDistance: 12, maxDistance: 900, enablePan: true },
  };
}
