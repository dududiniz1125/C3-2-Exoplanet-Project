import { INTERIOR, PLANET } from '../data/c32.js';
import { ICONS } from './icons.js';

// DOM side of the Interior view: depth gauge, layer card, step navigation.
const SWATCH = ['#ffd2a8', '#20b3ad', '#a9d4f2', '#5e6fc4', '#ff7a2a'];

export function createInteriorUI({ root, gauge, card, body, nav }, { onBack, onPrev, onNext, onStep }) {
  const layers = INTERIOR.layers;
  const R = PLANET.radius_km;

  // gauge track coloured with the real layer proportions
  const stops = [];
  layers.forEach((l, i) => {
    const a = ((l.depthTop_km / R) * 100).toFixed(2);
    const b = ((l.depthBottom_km / R) * 100).toFixed(2);
    stops.push(`${SWATCH[i]} ${a}%`, `${SWATCH[i]} ${b}%`);
  });
  gauge.innerHTML = `
    <span class="gauge-title">DEPTH GAUGE</span>
    <div class="gauge-track" style="background:linear-gradient(180deg, ${stops.join(', ')})">
      <span class="gauge-marker" id="gauge-marker"></span>
    </div>
    <span class="gauge-value" id="gauge-value">Depth: 0 km</span>
    <span class="gauge-pressure" id="gauge-pressure">Pressure: <b>${layers[0].pressure}</b></span>
    <span class="hypo-tag">Hypothetical</span>`;
  const marker = gauge.querySelector('#gauge-marker');
  const value = gauge.querySelector('#gauge-value');
  const pressure = gauge.querySelector('#gauge-pressure');

  nav.innerHTML = `
    <div class="interior-steps">
      <button class="btn btn-icon" data-prev aria-label="Previous layer">${ICONS.up}</button>
      <div class="step-dots">${Array.from({ length: layers.length + 1 }, (_, i) => `<button data-step="${i}" aria-label="${i === 0 ? 'Overview' : layers[i - 1].name}"></button>`).join('')}</div>
      <button class="btn btn-icon" data-next aria-label="Next layer">${ICONS.down}</button>
    </div>
    <button class="btn btn-back" data-back>↑ Back to surface</button>`;
  nav.querySelector('[data-back]').addEventListener('click', onBack);
  nav.querySelector('[data-prev]').addEventListener('click', onPrev);
  nav.querySelector('[data-next]').addEventListener('click', onNext);
  const dots = [...nav.querySelectorAll('[data-step]')];
  dots.forEach((d) => d.addEventListener('click', () => onStep(Number(d.dataset.step))));

  function cardHTML(step, layer) {
    if (!layer) {
      return `<span class="step">CUTAWAY</span>
        <h3>Inside C3-2</h3>
        <p><span class="hypo-tag">${INTERIOR.label}</span></p>
        <p>A quarter of the planet has been sliced away to show five layers, from the thin atmosphere down to a small core.</p>
        <p class="look">Scroll, swipe or use the arrows to travel inward.</p>`;
    }
    return `<span class="step">LAYER ${step} OF ${layers.length}</span>
      <h3>${layer.name}</h3>
      <p class="thick">${layer.approxText}</p>
      <p>${layer.text}</p>
      <p class="look">${layer.look}</p>
      <span class="hypo-tag">Hypothetical</span>
      <div class="swatch-bar" style="background:${SWATCH[step - 1]}"></div>`;
  }

  let cardTimer = null;
  return {
    show() {
      root.classList.add('is-visible');
      root.setAttribute('aria-hidden', 'false');
    },
    hide() {
      root.classList.remove('is-visible');
      root.setAttribute('aria-hidden', 'true');
      card.classList.remove('is-in');
    },
    setStep(step, layer) {
      dots.forEach((d, i) => d.classList.toggle('is-on', i === step));
      card.classList.add('is-in');
      body.classList.remove('is-in');
      clearTimeout(cardTimer);
      cardTimer = setTimeout(() => {
        body.innerHTML = cardHTML(step, layer);
        body.classList.add('is-in');
      }, 260);
    },
    setDepth(km, layer) {
      const d = Math.round(km / 10) * 10;
      value.textContent = `Depth: ${d.toLocaleString('en-US')} km`;
      marker.style.top = `${(km / R) * 100}%`;
      pressure.innerHTML = `Pressure: <b>${(layer || layers[0]).pressure}</b>`;
    },
  };
}
