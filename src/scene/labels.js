import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Screen-space labels: plain DOM, so they stay crisp and readable at any zoom.
export function makeLabel(text, { className = '', sub = '' } = {}) {
  const el = document.createElement('div');
  el.className = `scene-label ${className}`;
  el.innerHTML = `<span class="scene-label-dot"></span><span class="scene-label-text">${text}${
    sub ? `<small>${sub}</small>` : ''
  }</span>`;
  const obj = new CSS2DObject(el);
  obj.center.set(0, 0.5);
  return obj;
}
