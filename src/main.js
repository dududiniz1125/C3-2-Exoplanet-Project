import './ui/styles.css';
import * as THREE from 'three';
import { STAR, ORBIT, SOLAR, C32, INTERIOR, PLANET } from './data/c32.js';
import { createRenderer } from './scene/renderer.js';
import { createCameraRig } from './scene/cameraRig.js';
import { createStarfield } from './scene/starfield.js';
import { makeGlowTexture, bakePlanetTexture } from './scene/textures.js';
import { blackbodyColor } from './scene/colors.js';
import { SimClock, DAY, HOUR } from './scene/clock.js';
import { orbitState } from './scene/orbit.js';
import { createSystemView } from './views/systemView.js';
import { createPlanetView } from './views/planetView.js';
import { createStarView } from './views/starView.js';
import { createInteriorView } from './views/interiorView.js';
import { createHUD, toggle, button, segmented, infoList, title } from './ui/hud.js';
import { createDrawer } from './ui/drawer.js';
import { createHabitability } from './ui/habitability.js';
import { createFacts } from './ui/facts.js';
import { createInteriorUI } from './ui/interiorUI.js';

const $ = (s) => document.querySelector(s);

// ---------------------------------------------------------------------------
// Scene setup
// ---------------------------------------------------------------------------
const canvas = $('#scene');
const scene = new THREE.Scene();
// A scene background (rather than the renderer's clear colour) is converted to
// the composer's linear render target correctly.
scene.background = new THREE.Color('#05060f');
const rig = createCameraRig(canvas);
const gfx = createRenderer({ canvas, labelHost: $('#labels'), scene, camera: rig.camera });

const starfield = createStarfield();
scene.add(starfield.group);

const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 900;
const glowTexture = makeGlowTexture();
const planetTexture = bakePlanetTexture(gfx.renderer, smallScreen ? { width: 1024, height: 512 } : {});

// Colours derived from temperature (exaggerated saturation for the star discs)
const starColor = blackbodyColor(STAR.temperature_K, 2.2);
const starLimbColor = blackbodyColor(STAR.temperature_K - 1200, 2.2);
const lightColor = blackbodyColor(STAR.temperature_K, 1.35);
const sunColor = blackbodyColor(SOLAR.sunTemperature_K, 1.8);
const sunLimbColor = blackbodyColor(SOLAR.sunTemperature_K - 1200, 1.8);

const views = {
  system: createSystemView({ scene, planetTexture, glowTexture, starColor, starLimbColor, lightColor }),
  planet: createPlanetView({ scene, planetTexture, lightColor, rig }),
  star: createStarView({ scene, glowTexture, starColor, starLimbColor, sunColor, sunLimbColor, rig }),
};

const clock = new SimClock();
const rates = { intro: 2 * DAY, system: 2 * DAY, planet: HOUR, star: HOUR, interior: HOUR };

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const hud = createHUD({
  onNav: (v) => go(v),
  onLearnMore: () => drawer.toggle(state.view),
  onRate: (r) => {
    rates[state.view] = r;
    clock.rate = r;
  },
  onSettings: (s) => {
    gfx.setBloom(s.bloom);
    gfx.setQuality(s.quality);
  },
});
const drawer = createDrawer({ el: $('#drawer'), title: $('#drawer-title'), body: $('#drawer-body'), closeBtn: $('#drawer-close') });
const habit = createHabitability($('#habit'));
createFacts($('#facts-btn'), $('#fact-toast'));

const interiorUI = createInteriorUI(
  { root: $('#interior-ui'), gauge: $('#gauge'), card: $('#layer-card'), body: $('#layer-card-body'), nav: $('#interior-nav') },
  {
    onBack: () => go('planet'),
    onPrev: () => interior.prev(),
    onNext: () => interior.next(),
    onStep: (s) => interior.goToStep(s),
  },
);
const interior = createInteriorView({ planetView: views.planet, rig, ui: interiorUI });

const VIEW_TEXT = {
  intro: { name: C32.name, desc: C32.tagline },
  system: {
    name: 'C3-2 System',
    desc: `An ${STAR.colorName} ${STAR.spectralClass} dwarf, with C3-2 orbiting at ${ORBIT.radius_AU} AU every ${ORBIT.periodText}.`,
    note: 'Sizes not to scale · distances in AU',
    rate: true,
  },
  planet: { name: C32.name, desc: C32.tagline, note: 'Hypothetical visualization', rate: true },
  star: { name: STAR.name, desc: `An ${STAR.classDescription} at ${STAR.temperatureText}: cooler, smaller and dimmer than the Sun.` },
  interior: { name: 'Inside C3-2', desc: INTERIOR.label, note: 'Hypothetical visualization' },
};

// Tool panels per view (built once, kept so toggles remember their state)
let planetCompareControl = null;
const tools = {
  system: (() => {
    const compareBtn = button('Compare to our Solar System', async () => {
      if (busy) return;
      const on = !views.system.solarCompare;
      views.system.setSolarCompare(on);
      compareBtn.classList.toggle('is-on', on);
      hud.setNote(on ? 'Dashed: Mercury, Venus, Earth · green: Sun’s habitable zone' : VIEW_TEXT.system.note);
      const p = views.system.pose(on);
      rig.flyTo(p.position, p.target, { duration: 1.6 });
    });
    return [
      title('SYSTEM VIEW'),
      toggle('Habitable Zone', true, (v) => views.system.setHabitableZone(v), { swatch: '#4fd1c5' }),
      compareBtn,
    ];
  })(),
  planet: (() => {
    const cmp = segmented(
      'COMPARE SIZE',
      [['none', 'Off'], ['earth', 'Earth'], ['mars', 'Mars'], ['neptune', 'Neptune']],
      'none',
      (key) => {
        const p = views.planet.setCompare(key);
        applyLimits('planet', p);
        rig.flyTo(p.position, p.target, { duration: 1.5, arc: 0.08 });
      },
    );
    planetCompareControl = cmp;
    return [
      title('PLANET VIEW'),
      cmp,
      toggle(`Spin axis (${PLANET.tiltText})`, false, (v) => views.planet.setAxis(v)),
      button('Inside C3-2 <span aria-hidden="true">↓</span>', () => go('interior')),
      button('Could you live here?', () => habit.open()),
    ];
  })(),
  star: (() => {
    const chips = document.createElement('div');
    chips.className = 'temp-compare';
    chips.hidden = true;
    chips.innerHTML = `
      <div class="temp-chip" style="background:#${starColor.getHexString(THREE.SRGBColorSpace)}">${STAR.spectralClass}<small>${STAR.temperatureText} · ${STAR.radius_Rsun} R☉</small></div>
      <div class="temp-chip" style="background:#${sunColor.getHexString(THREE.SRGBColorSpace)}">Sun<small>${SOLAR.sunTemperatureText} · 1 R☉</small></div>`;
    const t = toggle('Compare to Sun', false, (on) => {
      chips.hidden = !on;
      const p = views.star.setCompare(on);
      applyLimits('star', p);
      rig.flyTo(p.position, p.target, { duration: 1.5, arc: 0.08 });
    });
    return [
      title('HOST STAR'),
      t,
      chips,
      infoList([
        ['Class', STAR.spectralClass],
        ['Temperature', STAR.temperatureText],
        ['Mass', STAR.massText],
        ['Radius', STAR.radiusText],
        ['Luminosity', STAR.luminosityText],
        ['Lifetime', STAR.lifetimeText],
        ['Peak wavelength', STAR.peakWavelengthText],
      ]),
    ];
  })(),
};

// ---------------------------------------------------------------------------
// Navigation between views: always a camera flight, never a cut
// ---------------------------------------------------------------------------
const state = { view: 'intro' };
let busy = false;
const INTRO_POSE = { position: new THREE.Vector3(-260, 900, 2900), target: new THREE.Vector3(0, 0, 0) };

const stageOf = (v) => (v === 'intro' ? 'system' : v === 'interior' ? 'planet' : v);

function showStages(...ids) {
  for (const [id, v] of Object.entries(views)) v.group.visible = ids.includes(id);
}

function applyLimits(view, pose) {
  const c = rig.controls;
  if (view === 'intro') {
    c.enabled = false;
    return;
  }
  const lim = views[stageOf(view)].controlsLimits;
  c.minDistance = lim.minDistance;
  c.maxDistance = lim.maxDistance;
  if (pose) {
    const d = pose.position.distanceTo(pose.target);
    c.maxDistance = Math.max(lim.maxDistance, d * 1.6);
    c.minDistance = Math.min(lim.minDistance, d * 0.8);
  }
  c.enablePan = lim.enablePan;
}

// Move the subject left of centre when a panel sits on the right
function updateShift() {
  const w = window.innerWidth;
  const panel = state.view === 'interior' ? $('#layer-card') : $('#tools');
  const hasPanel = state.view !== 'intro' && (state.view === 'interior' || (tools[state.view] || []).length > 0);
  const portrait = w < 900 && window.innerHeight > w;
  const px = hasPanel && !portrait ? Math.min(220, (panel.offsetWidth || 300) * 0.5) : 0;
  rig.setShift(px);
}
window.addEventListener('resize', updateShift);

function setView(view) {
  state.view = view;
  hud.setView(view, VIEW_TEXT[view]);
  hud.setTools(tools[view] || []);
  hud.setHint(false);
  clock.rate = rates[view];
  hud.setRate(clock.rate);
  drawer.sync(view);
  requestAnimationFrame(updateShift);
}

function poseFor(view) {
  if (view === 'intro') return INTRO_POSE;
  if (view === 'system') return views.system.pose(views.system.solarCompare);
  if (view === 'planet') return views.planet.compareKey === 'none' ? views.planet.pose() : views.planet.setCompare(views.planet.compareKey);
  return views[view].pose();
}

async function flyToView(view) {
  const from = stageOf(state.view);
  const to = stageOf(view);
  showStages(from, to);
  setView(view);
  const pose = poseFor(view);
  // set the new limits first: the controls update once as the flight lands
  applyLimits(view, pose);
  const long = from !== to;
  const duration = state.view === 'intro' || view === 'intro' ? 3.2 : long ? 2.0 : 1.4;
  await rig.flyTo(pose.position, pose.target, {
    duration,
    arc: long ? 0.12 : 0.05,
    ease: view === 'system' && duration > 3 ? 'power3.inOut' : 'power2.inOut',
    keepControls: view === 'intro',
  });
  showStages(to);
}

async function go(target) {
  if (target === 'habitability') {
    drawer.close();
    habit.open();
    return;
  }
  if (target === 'home') target = 'intro';
  if (busy || target === state.view) return;
  busy = true;
  habit.close();
  try {
    if (state.view === 'interior') {
      if (target === 'planet') {
        setView('planet');
        await interior.exit();
        applyLimits('planet');
        return;
      }
      interior.exit({ fly: false });
      setView('planet');
    }
    if (target === 'interior') {
      if (views.planet.compareKey !== 'none') {
        views.planet.setCompare('none');
        planetCompareControl.set('none');
      }
      if (state.view !== 'planet') await flyToView('planet');
      setView('interior');
      await interior.enter();
      return;
    }
    await flyToView(target);
  } finally {
    busy = false;
  }
}

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------
let last = performance.now();
let realTime = 0;
let uiTimer = 0;
const orbit = {};

function seasonText(simTime) {
  orbitState(simTime, orbit);
  const L = new THREE.Vector3(-orbit.x, 0, -orbit.z).normalize();
  const s = L.x * Math.sin(THREE.MathUtils.degToRad(PLANET.tilt_deg));
  if (s > 0.2) return 'northern summer';
  if (s < -0.2) return 'southern summer';
  return 'equinox season';
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  realTime += dt;
  const before = clock.time;
  clock.tick(dt);
  const dtSim = clock.time - before;

  starfield.update(rig.camera, realTime, gfx.pixelRatio);
  if (views.system.group.visible) views.system.update(clock.time, realTime);
  // the planet's light direction also sets up Planet-view camera poses
  views.planet.update(clock.time, dtSim);
  if (views.planet.group.visible) interior.update(realTime);
  if (views.star.group.visible) views.star.update(clock.time, realTime);
  rig.update();

  // Zoom far enough into the planet and you fall inside it
  if (state.view === 'planet' && !busy && rig.controls.enabled && views.planet.compareKey === 'none') {
    const d = rig.camera.position.distanceTo(rig.controls.target);
    hud.setHint(d < 1.9);
    if (d < views.planet.interiorTriggerDistance) go('interior');
  }

  uiTimer -= dt;
  if (uiTimer <= 0) {
    uiTimer = 0.2;
    const day = Math.floor((clock.time / DAY) % ORBIT.period_days) + 1;
    const extra = state.view === 'planet' ? ` · ${seasonText(clock.time)}` : '';
    hud.setDate(`Day ${day} of ${ORBIT.period_days}${extra}`);
  }

  gfx.watch(dt, () => {
    hud.settings.quality = 'low';
    document.querySelector('#settings-pop .segmented button[data-v="low"]')?.click();
  });
  gfx.render();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
// Compile every shader up front so the first visit to a view doesn't stall
showStages('system', 'planet', 'star');
gfx.renderer.compile(scene, rig.camera);

rig.camera.position.copy(INTRO_POSE.position);
rig.controls.target.copy(INTRO_POSE.target);
rig.camera.lookAt(INTRO_POSE.target);
showStages('system');
setView('intro');
applyLimits('intro');
requestAnimationFrame((t) => {
  last = t;
  frame(t);
  hud.doneLoading();
});

// Deep links for testing / sharing: #system, #planet, #star, #interior
const hash = location.hash.replace('#', '');
if (['system', 'planet', 'star', 'interior', 'habitability'].includes(hash)) setTimeout(() => go(hash), 300);

// Exposed for debugging in the console
window.__c32 = { go, views, rig, clock, interior, gfx, state, get busy() { return busy; } };
