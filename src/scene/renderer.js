import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

// WebGL renderer + bloom + CSS label layer, with a quality switch and a
// simple frame-rate watchdog that lowers the pixel ratio if a device struggles.
export function createRenderer({ canvas, labelHost, scene, camera }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x05060f, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.localClippingEnabled = true;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.5, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'labels-root';
  labelHost.appendChild(labels.domElement);

  const settings = { quality: 'high', bloom: true };
  let pixelRatio = 1;

  function applySize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxPR = settings.quality === 'high' ? 2 : 1;
    pixelRatio = Math.min(window.devicePixelRatio || 1, maxPR);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Frame-rate watchdog: if the average stays well under 60 fps for a few
  // seconds on "high", drop to "low" once.
  let slowTime = 0;
  let autoLowered = false;
  function watch(dt, onAutoLower) {
    if (autoLowered || settings.quality !== 'high') return;
    const fps = 1 / Math.max(dt, 1e-4);
    slowTime = fps < 40 ? slowTime + dt : Math.max(0, slowTime - dt * 2);
    if (slowTime > 4) {
      autoLowered = true;
      settings.quality = 'low';
      applySize();
      onAutoLower?.();
    }
  }

  function render() {
    // Always go through the composer: OutputPass does the linear -> sRGB
    // conversion that the custom ShaderMaterials rely on.
    composer.render();
    labels.render(scene, camera);
  }

  window.addEventListener('resize', applySize);
  applySize();

  return {
    renderer,
    composer,
    bloom,
    labels,
    settings,
    get pixelRatio() {
      return pixelRatio;
    },
    setQuality(q) {
      settings.quality = q;
      applySize();
    },
    setBloom(on) {
      settings.bloom = on;
      bloom.enabled = on;
    },
    resize: applySize,
    watch,
    render,
  };
}
