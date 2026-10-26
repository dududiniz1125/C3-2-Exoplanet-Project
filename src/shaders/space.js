// Starfield points and soft-edged rings (habitable zones).

export const starfieldVertex = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.7 + 0.3 * sin(uTime * (0.5 + aPhase * 1.8) + aPhase * 40.0);
  vAlpha = twinkle;
  vColor = aColor;
  gl_PointSize = aSize * uPixelRatio;
}
`;

export const starfieldFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

export const ringVertex = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ringFragment = /* glsl */ `
uniform float uInner;
uniform float uOuter;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vP;
void main() {
  float r = length(vP);
  float w = (uOuter - uInner) * 0.12;
  float band = smoothstep(uInner, uInner + w, r) * (1.0 - smoothstep(uOuter - w, uOuter, r));
  float edges = (1.0 - smoothstep(0.0, w * 0.18, abs(r - uInner))) + (1.0 - smoothstep(0.0, w * 0.18, abs(r - uOuter)));
  float a = uOpacity * (0.8 * band + 1.6 * edges);
  gl_FragColor = vec4(uColor, a);
}
`;
