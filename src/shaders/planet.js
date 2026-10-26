// Shaders for C3-2 itself: a one-off "bake" pass that paints the ocean world
// into a data texture, then the surface, cloud and atmosphere materials that
// read it every frame. Everything is procedural (no image files).
import { noiseGLSL } from './noise.js';

// Every material that may be sliced in Interior view supports clipping planes.
const clipVertPars = '#include <clipping_planes_pars_vertex>';
const clipVert = '#include <clipping_planes_vertex>';
const clipFragPars = '#include <clipping_planes_pars_fragment>';
const clipFrag = '#include <clipping_planes_fragment>';

// ---------------------------------------------------------------------------
// Bake pass: equirectangular data texture
//   r = land mask (island chains)   g = shallow water halo
//   b = large-scale cloud field     a = small-scale detail
// The direction is rebuilt from the UV exactly the way THREE.SphereGeometry
// lays its UVs out, so the texture wraps without seams.
// ---------------------------------------------------------------------------
export const bakeVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const bakeFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uSeed;
${noiseGLSL}
void main() {
  float phi = vUv.x * 6.28318530718;
  float theta = (1.0 - vUv.y) * 3.14159265359;
  vec3 dir = vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));
  vec3 s = vec3(uSeed, uSeed * 1.7, uSeed * 0.3);

  // Island chains: small round islands (Worley blobs) strung along the
  // thin bands where a low-frequency noise field crosses zero.
  float chain = snoise(dir * 1.25 + s);
  float chain2 = snoise(dir * 1.9 + s * 2.1 + 5.0);
  float band = max(1.0 - smoothstep(0.0, 0.07, abs(chain)),
                   0.8 * (1.0 - smoothstep(0.0, 0.05, abs(chain2))));
  float blobs = 1.0 - worley(dir * 26.0 + s);
  float size = 0.5 + 0.5 * snoise(dir * 6.0 + s);
  float land = band * smoothstep(0.62 - 0.12 * size, 0.78 - 0.12 * size, blobs);
  float halo = max(1.0 - smoothstep(0.0, 0.16, abs(chain)),
                   0.7 * (1.0 - smoothstep(0.0, 0.12, abs(chain2))));
  halo *= smoothstep(0.35, 0.75, blobs) * 0.9;

  // Clouds: domain-warped fbm with weak zonal banding
  // stretched east-west (like weather bands) and domain-warped into swirls
  vec3 q = dir * vec3(1.0, 2.4, 1.0);
  vec3 w = q * 1.5 + vec3(fbm(q * 1.2 + 11.0, 4), fbm(q * 1.2 + 23.0, 4), fbm(q * 1.2 + 37.0, 4)) * 1.3;
  float lat = asin(clamp(dir.y, -1.0, 1.0));
  float clouds = 0.5 + 0.6 * fbm(w * 1.7 + s, 7) + 0.07 * sin(lat * 6.0);
  float detail = 0.5 + 0.5 * fbm(w * 5.0 + dir * 4.0 + s * 3.0, 5);

  gl_FragColor = vec4(clamp(land, 0.0, 1.0), clamp(halo, 0.0, 1.0), clamp(clouds, 0.0, 1.0), detail);
}
`;

// ---------------------------------------------------------------------------
// Surface
// ---------------------------------------------------------------------------
export const surfaceVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObj;
${clipVertPars}
void main() {
  vUv = uv;
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${clipVert}
}
`;

export const surfaceFragment = /* glsl */ `
uniform sampler2D uData;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uSeason;      // sin(sub-stellar latitude): + means northern summer
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uLand;
uniform vec3 uBeach;
uniform vec3 uIce;
uniform vec3 uNight;
uniform vec3 uAtmo;
uniform float uDim;       // < 1 while the planet is cut open
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObj;
${clipFragPars}
void main() {
  ${clipFrag}
  vec4 d = texture2D(uData, vUv);
  vec3 n = normalize(vNormalW);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(cameraPosition - vPosW);
  float lat = asin(clamp(normalize(vObj).y, -1.0, 1.0));

  float land = smoothstep(0.45, 0.6, d.r);
  vec3 ocean = mix(uDeep, uShallow, d.g * 0.85);
  ocean *= 0.85 + 0.3 * d.a;
  vec3 ground = mix(uBeach, uLand, smoothstep(0.6, 0.85, d.r));
  vec3 col = mix(ocean, ground, land);

  // Polar ice caps: the summer hemisphere's cap shrinks
  float edgeN = radians(67.0) + radians(10.0) * uSeason;
  float edgeS = radians(67.0) - radians(10.0) * uSeason;
  float jitter = (d.a - 0.5) * 0.22;
  float ice = max(smoothstep(edgeN - 0.03, edgeN + 0.03, lat + jitter),
                  smoothstep(edgeS - 0.03, edgeS + 0.03, -lat + jitter));
  col = mix(col, uIce, ice);

  float ndl = dot(n, L);
  float day = smoothstep(-0.12, 0.22, ndl);
  vec3 lit = col * uLightColor * (0.06 + 1.05 * max(ndl, 0.0));

  vec3 H = normalize(L + V);
  float spec = pow(max(dot(n, H), 0.0), 140.0) * (1.0 - land) * (1.0 - ice) * step(0.0, ndl);
  lit += uLightColor * spec * 0.35;

  vec3 night = col * uNight;
  vec3 c = mix(night, lit, day);

  // warm band along the terminator (thick atmosphere scattering orange light)
  float term = smoothstep(-0.12, 0.05, ndl) * (1.0 - smoothstep(0.05, 0.35, ndl));
  c += uAtmo * term * 0.10;

  // Fresnel rim
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  c += uAtmo * fres * (0.08 + 0.9 * smoothstep(-0.25, 0.5, ndl)) * 0.75;

  gl_FragColor = vec4(c * uDim, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Clouds: separate, slightly larger sphere
// ---------------------------------------------------------------------------
export const cloudFragment = /* glsl */ `
uniform sampler2D uData;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uDrift;
uniform float uCoverage;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObj;
${clipFragPars}
void main() {
  ${clipFrag}
  vec4 a = texture2D(uData, vUv + vec2(uDrift, 0.0));
  vec4 b = texture2D(uData, vUv * vec2(1.0, 1.0) + vec2(-uDrift * 0.6 + 0.37, 0.0));
  float field = a.b * 0.8 + (a.a - 0.5) * 0.35 + (b.a - 0.5) * 0.12;
  float cover = smoothstep(uCoverage - 0.06, uCoverage + 0.1, field);
  cover = pow(cover, 0.8);
  vec3 n = normalize(vNormalW);
  float ndl = dot(n, normalize(uLightDir));
  vec3 V = normalize(cameraPosition - vPosW);
  float fres = 1.0 - max(dot(n, V), 0.0);
  // clouds are bright white: only partly tinted by the orange light
  vec3 col = mix(uLightColor, vec3(1.0), 0.45) * (0.03 + 1.0 * max(ndl, 0.0));
  float alpha = cover * uOpacity * (1.0 - 0.6 * pow(fres, 4.0));
  gl_FragColor = vec4(col, alpha);
}
`;

// ---------------------------------------------------------------------------
// Atmosphere glow: back-faces of a larger shell, brightest just above the limb
// ---------------------------------------------------------------------------
export const atmoVertex = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vNormalW;
${clipVertPars}
void main() {
  vNormalV = normalize(normalMatrix * normal);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  ${clipVert}
}
`;

export const atmoFragment = /* glsl */ `
uniform vec3 uLightDir;
uniform vec3 uColor;
uniform float uLimb;       // -normal.z at the planet's limb
uniform float uStrength;
varying vec3 vNormalV;
varying vec3 vNormalW;
${clipFragPars}
void main() {
  ${clipFrag}
  float k = -normalize(vNormalV).z;
  float glow = pow(smoothstep(0.0, uLimb, k), 2.2) * (1.0 - smoothstep(uLimb, uLimb + 0.25, k) * 0.6);
  float lit = smoothstep(-0.4, 0.6, dot(normalize(vNormalW), normalize(uLightDir)));
  vec3 c = uColor * glow * (0.06 + lit) * uStrength;
  gl_FragColor = vec4(c, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Simple procedural planets for "Compare size" (Earth, Mars, Neptune)
// ---------------------------------------------------------------------------
export const comparePlanetFragment = /* glsl */ `
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform int uKind;   // 0 Earth, 1 Mars, 2 Neptune
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObj;
${noiseGLSL}
void main() {
  vec3 p = normalize(vObj);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  vec3 col;
  float cloud = 0.0;
  if (uKind == 0) {
    float c = fbm(p * 1.7 + 3.0, 5);
    vec3 ocean = vec3(0.03, 0.12, 0.35);
    vec3 landC = mix(vec3(0.16, 0.32, 0.10), vec3(0.45, 0.36, 0.22), smoothstep(0.0, 0.4, fbm(p * 5.0, 3) + abs(lat) * 0.3));
    col = mix(ocean, landC, smoothstep(0.02, 0.06, c));
    col = mix(col, vec3(0.95), smoothstep(1.2, 1.28, abs(lat)));
    cloud = smoothstep(0.1, 0.45, fbm(p * 3.0 + 9.0, 5));
  } else if (uKind == 1) {
    float c = fbm(p * 2.2 + 1.0, 5);
    col = mix(vec3(0.55, 0.24, 0.10), vec3(0.32, 0.14, 0.07), smoothstep(-0.1, 0.3, c));
    col = mix(col, vec3(0.75, 0.5, 0.32), smoothstep(0.2, 0.5, fbm(p * 6.0, 3)) * 0.4);
    col = mix(col, vec3(0.92), smoothstep(1.33, 1.38, abs(lat)));
  } else {
    float bands = sin(lat * 9.0 + fbm(p * vec3(1.0, 6.0, 1.0) + 2.0, 4) * 1.6);
    col = mix(vec3(0.12, 0.24, 0.62), vec3(0.24, 0.42, 0.85), 0.5 + 0.5 * bands);
    float spot = 1.0 - smoothstep(0.08, 0.16, length(vec2(atan(p.z, p.x) - 1.0, (lat + 0.35) * 1.8)));
    col = mix(col, vec3(0.05, 0.09, 0.3), spot);
  }
  col = mix(col, vec3(1.0), cloud * 0.8);
  vec3 n = normalize(vNormalW);
  float ndl = dot(n, normalize(uLightDir));
  vec3 V = normalize(cameraPosition - vPosW);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  vec3 rim = uKind == 1 ? vec3(0.6, 0.35, 0.2) : vec3(0.35, 0.55, 1.0);
  vec3 c = col * uLightColor * (0.03 + 1.05 * max(ndl, 0.0)) + rim * fres * smoothstep(-0.2, 0.5, ndl) * 0.5;
  gl_FragColor = vec4(c, 1.0);
}
`;
