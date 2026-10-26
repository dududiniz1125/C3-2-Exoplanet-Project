import * as THREE from 'three';
import { surfaceVertex, surfaceFragment, cloudFragment, atmoVertex, atmoFragment } from '../shaders/planet.js';

// Colours of the ocean world (sRGB; THREE.Color converts them to linear)
const COLORS = {
  deep: '#0a5566',
  shallow: '#2bb5ad',
  land: '#2a0c10', // dark red/black vegetation (see "Meet the locals")
  beach: '#7c5b43',
  ice: '#e6f1fb',
  atmo: '#f2b38a',
};

// Surface + clouds + atmosphere glow for C3-2. Each call returns fresh
// uniforms so the System and Planet views can be lit independently.
export function createPlanetMaterials(dataTexture, lightColor) {
  const light = { value: new THREE.Vector3(1, 0, 0) };
  const lightCol = { value: lightColor.clone() };
  const surface = new THREE.ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    uniforms: {
      uData: { value: dataTexture },
      uLightDir: light,
      uLightColor: lightCol,
      uSeason: { value: 0 },
      uDeep: { value: new THREE.Color(COLORS.deep) },
      uShallow: { value: new THREE.Color(COLORS.shallow) },
      uLand: { value: new THREE.Color(COLORS.land) },
      uBeach: { value: new THREE.Color(COLORS.beach) },
      uIce: { value: new THREE.Color(COLORS.ice) },
      uNight: { value: new THREE.Vector3(0.025, 0.035, 0.06) },
      uAtmo: { value: new THREE.Color(COLORS.atmo) },
      uDim: { value: 1 },
    },
  });
  const clouds = new THREE.ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: cloudFragment,
    uniforms: {
      uData: { value: dataTexture },
      uLightDir: light,
      uLightColor: lightCol,
      uDrift: { value: 0 },
      uCoverage: { value: 0.53 },
      uOpacity: { value: 0.92 },
    },
    transparent: true,
    depthWrite: false,
  });
  const atmo = new THREE.ShaderMaterial({
    vertexShader: atmoVertex,
    fragmentShader: atmoFragment,
    uniforms: {
      uLightDir: light,
      uColor: { value: new THREE.Color(COLORS.atmo) },
      uLimb: { value: 0.33 },
      uStrength: { value: 1.25 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { surface, clouds, atmo, light, lightColor: lightCol };
}

// Limb parameter for an atmosphere shell of radius `shell` around a planet of
// radius `planet`: −normal.z where the line of sight grazes the surface.
export const limbFor = (planet, shell) => Math.sqrt(1 - (planet / shell) ** 2);
