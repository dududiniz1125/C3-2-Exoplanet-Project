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

export const PALETTE = {
  bg: '#05060f',
  teal: '#4fd1c5',
  orange: '#ff9a3c',
  text: '#e8ecff',
};
