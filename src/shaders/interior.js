// Cut faces of the sliced planet. One half-disc mesh per face; the fragment
// shader works out which layer a pixel belongs to from its radius, so the
// layer boundaries come straight from data/c32.js (passed in as uR).
import { noiseGLSL } from './noise.js';

export const interiorVertex = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const interiorFragment = /* glsl */ `
uniform float uR[6];      // layer boundary radii, outside -> in, as fraction of planet radius
uniform vec3 uColA[5];
uniform vec3 uColB[5];
uniform float uActive;    // highlighted layer index, -1 = none
uniform float uTime;
uniform float uShade;
uniform float uReveal;
varying vec2 vP;
${noiseGLSL}

float boundaryLine(float r, float b) {
  float w = fwidth(r) * 1.2;
  return 1.0 - smoothstep(0.0, w, abs(r - b));
}

void main() {
  float r = length(vP);
  if (r > uR[0]) discard;
  float ang = atan(vP.y, vP.x);

  int idx = 4;
  if (r > uR[1]) idx = 0;
  else if (r > uR[2]) idx = 1;
  else if (r > uR[3]) idx = 2;
  else if (r > uR[4]) idx = 3;

  vec3 col;
  float alpha = 1.0;
  if (idx == 0) {
    // Atmosphere: translucent orange-white
    float t = (r - uR[1]) / (uR[0] - uR[1]);
    col = mix(uColA[0], uColB[0], t);
    alpha = 0.85 - 0.5 * t;
  } else if (idx == 1) {
    // Ocean: deep teal, light rays fading with depth
    float t = (r - uR[2]) / (uR[1] - uR[2]);
    col = mix(uColA[1], uColB[1], pow(t, 1.6));
    float ray = snoise(vec3(ang * 140.0, t * 1.5, uTime * 0.25));
    col += uColB[1] * 0.45 * smoothstep(0.2, 1.0, ray) * pow(t, 2.5);
  } else if (idx == 2) {
    // High-pressure ice VII: pale blue crystals
    float w = worley(vec3(vP * 38.0, 0.5));
    col = mix(uColA[2], uColB[2], smoothstep(0.05, 0.75, w));
    // glints on the crystal edges
    float glint = smoothstep(0.55, 0.62, w) * (0.5 + 0.5 * snoise(vec3(vP * 60.0, uTime * 0.6)));
    col += vec3(0.9, 0.97, 1.0) * glint * 0.25;
  } else if (idx == 3) {
    // Volatile-rich mantle: hazy, swirling purple-blue
    vec3 q = vec3(vP * 4.0, uTime * 0.04);
    float warp = fbm(q, 4);
    float f = fbm(q + vec3(warp * 1.6, -warp * 1.2, uTime * 0.03), 4);
    col = mix(uColA[3], uColB[3], 0.5 + 0.6 * f);
    col += vec3(0.25, 0.2, 0.45) * smoothstep(0.2, 0.7, warp) * 0.35;
  } else {
    // Small rocky/iron core: glowing dark red-orange
    float t = r / uR[4];
    float n = snoise(vec3(vP * 14.0, uTime * 0.35));
    col = mix(uColA[4], uColB[4], pow(1.0 - t, 1.4));
    col *= 0.85 + 0.25 * n;
    col *= 1.0 + 0.12 * sin(uTime * 1.6);
  }

  // Boundaries between layers and around the rim
  float lines = 0.0;
  for (int i = 1; i < 5; i++) lines = max(lines, boundaryLine(r, uR[i]));
  col = mix(col, vec3(0.03, 0.03, 0.06), lines * 0.75);
  col += vec3(1.0, 0.85, 0.7) * boundaryLine(r, uR[0]) * 0.4;

  // Highlight the layer the story is on, dim the others
  if (uActive > -0.5) {
    bool on = abs(float(idx) - uActive) < 0.5;
    col *= on ? 1.08 : 0.38;
    if (on) alpha = max(alpha, 0.9);
  }

  col *= uShade;
  gl_FragColor = vec4(col, alpha * uReveal);
}
`;
