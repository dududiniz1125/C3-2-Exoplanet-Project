import * as THREE from 'three';
import { starfieldVertex, starfieldFragment } from '../shaders/space.js';

// Procedural starfield: two shells of points that travel with the camera.
// The near shell lags slightly behind, which gives a subtle parallax during
// camera flights.
function makeShell(count, radius, sizeRange, seed) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const tints = [
    [1, 1, 1],
    [0.75, 0.85, 1],
    [1, 0.85, 0.65],
    [1, 0.7, 0.5],
    [0.85, 0.9, 1],
  ];
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    // concentrate a few extra stars along a faint "galactic" band
    const band = rand() < 0.35 ? 0.25 : 1;
    pos[i * 3] = radius * r * Math.cos(th);
    pos[i * 3 + 1] = radius * u * band;
    pos[i * 3 + 2] = radius * r * Math.sin(th);
    const t = tints[Math.floor(rand() * tints.length)];
    const b = 0.45 + rand() * 0.55;
    col[i * 3] = t[0] * b;
    col[i * 3 + 1] = t[1] * b;
    col[i * 3 + 2] = t[2] * b;
    const big = rand();
    size[i] = sizeRange[0] + Math.pow(big, 6) * (sizeRange[1] - sizeRange[0]);
    phase[i] = rand();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  return g;
}

export function createStarfield() {
  const uniforms = { uTime: { value: 0 }, uPixelRatio: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: starfieldVertex,
    fragmentShader: starfieldFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const far = new THREE.Points(makeShell(3200, 20000, [1.2, 3.6], 7), material);
  const near = new THREE.Points(makeShell(900, 6000, [1.6, 4.2], 99), material);
  for (const p of [far, near]) {
    p.frustumCulled = false;
    p.renderOrder = -10;
  }
  const group = new THREE.Group();
  group.add(far, near);

  return {
    group,
    update(camera, time, pixelRatio) {
      uniforms.uTime.value = time;
      uniforms.uPixelRatio.value = pixelRatio;
      far.position.copy(camera.position);
      near.position.copy(camera.position).multiplyScalar(0.97);
    },
  };
}
