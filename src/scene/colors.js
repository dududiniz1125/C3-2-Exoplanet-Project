import * as THREE from 'three';

// Approximate colour of a black body at temperature T (Kelvin), as an sRGB
// THREE.Color. Fit by Tanner Helland, valid for 1000 K to 40 000 K.
// `saturation` > 1 exaggerates the hue a little so a 4300 K star clearly reads
// as orange on screen rather than pale peach.
export function blackbodyColor(T, saturation = 1) {
  const t = T / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp = (v) => Math.min(255, Math.max(0, v)) / 255;
  const color = new THREE.Color().setRGB(clamp(r), clamp(g), clamp(b), THREE.SRGBColorSpace);
  if (saturation !== 1) {
    const hsl = {};
    color.getHSL(hsl, THREE.SRGBColorSpace);
    color.setHSL(hsl.h, Math.min(1, hsl.s * saturation), hsl.l, THREE.SRGBColorSpace);
  }
  return color;
}

// Colours used to *draw* the stars. A black-body curve gives a 4300 K star a
// pale peach and the Sun almost pure white on screen, which hides the very
// difference the Star view is about, so each temperature gets a display
// colour that reads clearly as its colour class: K6V orange, G2V
// yellow-white. `limb` is the darker, redder edge colour.
const STAR_DISPLAY = [
  { T: 4300, core: '#ff7a18', limb: '#b83a06' },
  { T: 5778, core: '#fff1c2', limb: '#ffb44a' },
];
export function starDisplayColors(T) {
  const best = STAR_DISPLAY.reduce((a, b) => (Math.abs(b.T - T) < Math.abs(a.T - T) ? b : a));
  return { core: new THREE.Color(best.core), limb: new THREE.Color(best.limb), coreHex: best.core };
}

export const PALETTE = {
  bg: '#05060f',
  teal: '#4fd1c5',
  orange: '#ff9a3c',
  text: '#e8ecff',
};
