// Star surface (granulation + limb darkening + star spots) and corona shell.
import { noiseGLSL } from './noise.js';

export const starVertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const starFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uLimbColor;
uniform float uTime;
uniform float uIntensity;
uniform float uGranScale;
uniform float uDetail;     // 0 = cheap (System view), 1 = full (Star view)
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
${noiseGLSL}
void main() {
  vec3 p = normalize(vObj);
  vec3 V = normalize(cameraPosition - vPosW);
  float mu = clamp(dot(normalize(vNormalW), V), 0.0, 1.0);

  // Convection cells: two drifting Worley fields cross-faded over time
  float t = uTime;
  float gran = 0.0;
  if (uDetail > 0.5) {
    float w1 = worley(p * uGranScale + vec3(0.0, t * 0.03, t * 0.02));
    float w2 = worley(p * uGranScale * 1.04 + vec3(5.2, -t * 0.025, 1.3));
    float fade = 0.5 + 0.5 * sin(t * 0.35);
    gran = 1.0 - mix(w1, w2, fade);
    gran = smoothstep(0.15, 0.85, gran);
  } else {
    gran = 0.5 + 0.5 * snoise(p * 9.0 + vec3(t * 0.05));
  }
  float big = fbm(p * 2.5 + vec3(0.0, t * 0.015, 0.0), 4);
  float spots = smoothstep(0.62, 0.72, snoise(p * 2.1 + vec3(11.0, 3.0, t * 0.004)));

  // Limb darkening: I(mu) = 1 - u(1 - mu), stronger for cool K stars
  float limb = 1.0 - 0.72 * (1.0 - pow(mu, 0.9));
  vec3 base = mix(uLimbColor, uColor, smoothstep(0.0, 0.8, mu));
  vec3 col = base * (0.72 + 0.42 * gran + 0.25 * big) * limb;
  col *= 1.0 - 0.65 * spots;
  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

export const coronaVertex = /* glsl */ `
varying vec3 vNormalV;
void main() {
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const coronaFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uLimb;
uniform float uStrength;
varying vec3 vNormalV;
${noiseGLSL}
void main() {
  vec3 n = normalize(vNormalV);
  float k = -n.z;
  float glow = pow(smoothstep(0.0, uLimb, k), 2.6);
  float ang = atan(n.y, n.x);
  float rays = 0.75 + 0.45 * snoise(vec3(cos(ang) * 2.5, sin(ang) * 2.5, uTime * 0.12))
                    + 0.2 * snoise(vec3(cos(ang) * 9.0, sin(ang) * 9.0, uTime * 0.3));
  gl_FragColor = vec4(uColor * glow * rays * uStrength, 1.0);
}
`;
