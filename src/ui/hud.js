import { DISTANCE, C32 } from '../data/c32.js';
import { ICONS } from './icons.js';
import { sliderToRate, rateToSlider, formatRate } from '../scene/clock.js';

const $ = (sel) => document.querySelector(sel);

// Small DOM builders for the per-view tool panel
export function toggle(label, checked, onChange, { swatch } = {}) {
  const el = document.createElement('label');
  el.className = 'toggle';
  el.innerHTML = `<span>${swatch ? `<span class="swatch" style="background:${swatch}"></span>` : ''}${label}</span><input type="checkbox" ${checked ? 'checked' : ''}/><span class="switch" aria-hidden="true"></span>`;
  const input = el.querySelector('input');
  input.addEventListener('change', () => onChange(input.checked));
  el.input = input;
  return el;
}

export function button(label, onClick, { className = '' } = {}) {
  const el = document.createElement('button');
  el.className = `btn ${className}`;
  el.innerHTML = label;
  el.addEventListener('click', onClick);
  return el;
}

export function segmented(title, options, value, onChange) {
  const el = document.createElement('div');
  el.className = 'select-row';
  el.innerHTML = `<span>${title}</span><div class="segmented" role="radiogroup">${options
    .map(([v, l]) => `<button role="radio" data-v="${v}" aria-checked="${v === value}" class="${v === value ? 'is-on' : ''}">${l}</button>`)
    .join('')}</div>`;
  const btns = [...el.querySelectorAll('button')];
  btns.forEach((b) =>
    b.addEventListener('click', () => {
      btns.forEach((x) => {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
      onChange(b.dataset.v);
    }),
  );
  el.set = (v) => btns.forEach((x) => x.classList.toggle('is-on', x.dataset.v === v));
  return el;
}

export function infoList(rows) {
  const el = document.createElement('dl');
  el.className = 'info-list';
  el.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  return el;
}

export function title(text) {
  const el = document.createElement('p');
  el.className = 'tools-title';
  el.textContent = text;
  return el;
}

export function createHUD({ onNav, onLearnMore, onRate, onSettings }) {
  const ui = $('#ui');
  $('#distance').innerHTML = `<span>You are</span><strong>${DISTANCE.lyText}</strong><span>from Earth</span>`;
  $('#intro-title').textContent = C32.name;
  $('#intro-subtitle').textContent = C32.tagline;

  // nav + logo
  document.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => onNav(b.dataset.nav)));
  $('#explore-btn').addEventListener('click', () => onNav('system'));

  // view tiles
  const tiles = $('#view-tiles');
  tiles.innerHTML = ['planet', 'system', 'star']
    .map((v) => `<button class="tile" data-tile="${v}" aria-label="${v} view">${ICONS[v]}<span>${v[0].toUpperCase() + v.slice(1)}</span></button>`)
    .join('');
  tiles.querySelectorAll('[data-tile]').forEach((b) => b.addEventListener('click', () => onNav(b.dataset.tile)));

  $('#learn-more').addEventListener('click', onLearnMore);

  // rate slider
  const slider = $('#rate-slider');
  const out = $('#rate-value');
  slider.addEventListener('input', () => {
    const r = sliderToRate(Number(slider.value));
    out.textContent = formatRate(r);
    onRate(r);
  });

  // settings popover
  const gearBtn = $('#settings-btn');
  const pop = $('#settings-pop');
  gearBtn.innerHTML = ICONS.gear;
  const settings = { labels: true, bloom: true, quality: 'high' };
  const labelsT = toggle('Labels', true, (v) => {
    settings.labels = v;
    document.body.classList.toggle('labels-hidden', !v);
    onSettings(settings);
  });
  const bloomT = toggle('Bloom glow', true, (v) => {
    settings.bloom = v;
    onSettings(settings);
  });
  const quality = segmented('QUALITY', [['high', 'High'], ['low', 'Low']], 'high', (v) => {
    settings.quality = v;
    onSettings(settings);
  });
  quality.querySelector('.segmented').style.gridTemplateColumns = '1fr 1fr';
  pop.append(title('SETTINGS'), labelsT, bloomT, quality);
  gearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pop.hidden = !pop.hidden;
    gearBtn.setAttribute('aria-expanded', String(!pop.hidden));
  });
  document.addEventListener('pointerdown', (e) => {
    if (!pop.hidden && !pop.contains(e.target) && e.target !== gearBtn && !gearBtn.contains(e.target)) {
      pop.hidden = true;
      gearBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // fullscreen (hidden where unsupported, e.g. iPhone Safari)
  const fsBtn = $('#fullscreen-btn');
  fsBtn.innerHTML = ICONS.fullscreen;
  const root = document.documentElement;
  const canFs = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!canFs) fsBtn.hidden = true;
  fsBtn.addEventListener('click', () => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
  });

  const toolsEl = $('#tools');
  const nameEl = $('#view-name');
  const descEl = $('#view-desc');
  const noteEl = $('#note');
  const dateEl = $('#sim-date');
  const rateEl = $('#rate');
  const hintEl = $('#zoom-hint');

  return {
    setView(view, { name, desc, note = '', rate = false }) {
      ui.className = `view-${view}`;
      nameEl.textContent = name;
      nameEl.classList.toggle('is-long', name.length > 10);
      descEl.textContent = desc;
      noteEl.textContent = note;
      rateEl.hidden = !rate;
      document.querySelectorAll('.nav [data-nav]').forEach((b) => b.classList.toggle('is-active', b.dataset.nav === view));
      tiles.querySelectorAll('[data-tile]').forEach((b) => b.classList.toggle('is-active', b.dataset.tile === view));
    },
    setTools(children) {
      toolsEl.replaceChildren(...children);
    },
    setRate(rate) {
      slider.value = String(rateToSlider(rate));
      out.textContent = formatRate(rate);
    },
    setDate(text) {
      dateEl.textContent = text;
    },
    setNote(text) {
      noteEl.textContent = text;
    },
    setHint(on) {
      hintEl.classList.toggle('is-visible', on);
    },
    setActiveNav(key) {
      document.querySelectorAll('.nav [data-nav]').forEach((b) => b.classList.toggle('is-active', b.dataset.nav === key));
    },
    doneLoading() {
      $('#loading').classList.add('is-done');
    },
    settings,
  };
}
