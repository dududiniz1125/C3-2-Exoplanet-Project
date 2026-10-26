import { LIGHT_CURVE, ORBIT, PLANET } from '../data/c32.js';

// Animated transit light curve (Learn more drawer, Planet view): relative
// intensity vs time over one Earth year, with a synced mini view of C3-2
// crossing its star's disc during each dip.
const HALF_WIDTH = 1.6; // days; dips are drawn wider than real so they are visible
const INGRESS = 0.5;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createLightCurve() {
  const root = document.createElement('div');
  root.className = 'lightcurve';
  root.innerHTML = `
    <div class="lightcurve-row">
      <canvas class="lc-chart" height="170" aria-label="Transit light curve"></canvas>
      <canvas class="lc-disc" width="84" height="84" aria-hidden="true"></canvas>
    </div>
    <p class="lc-caption">${LIGHT_CURVE.caption}</p>
    <p class="lc-caption" style="opacity:.7">Dips every ${ORBIT.periodText}, first around day ${LIGHT_CURVE.firstTransit_day}. Dip widths are drawn wider than real so they are visible.</p>`;
  const chart = root.querySelector('.lc-chart');
  const disc = root.querySelector('.lc-disc');
  const [yMin, yMax] = LIGHT_CURVE.yRange_pct;
  const [xMin, xMax] = LIGHT_CURVE.xRange_days;
  const depth = 100 - PLANET.minIntensity_pct; // 0.12 percentage points
  const transits = [];
  for (let c = LIGHT_CURVE.firstTransit_day; c <= xMax; c += ORBIT.period_days) transits.push(c);

  // baseline noise, sampled every 0.25 day
  const rand = seeded(42);
  const step = 0.25;
  const samples = [];
  for (let t = xMin; t <= xMax; t += step) {
    const g = (rand() + rand() + rand() - 1.5) * 0.008; // light, roughly gaussian
    samples.push([t, flux(t) + g]);
  }

  function shape(t) {
    let s = 0;
    for (const c of transits) {
      const dt = Math.abs(t - c);
      if (dt < HALF_WIDTH) s = Math.max(s, Math.min(1, (HALF_WIDTH - dt) / INGRESS));
    }
    return s;
  }
  function flux(t) {
    return 100 - depth * shape(t);
  }

  let cursor = 0;
  let raf = 0;
  let last = 0;
  let ctx;
  let W = 0;
  let H = 170;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = chart.clientWidth || 300;
    chart.width = W * dpr;
    chart.height = H * dpr;
    ctx = chart.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const m = { l: 54, r: 8, t: 10, b: 24 };
  const X = (t) => m.l + ((t - xMin) / (xMax - xMin)) * (W - m.l - m.r);
  const Y = (f) => m.t + ((yMax - f) / (yMax - yMin)) * (H - m.t - m.b);

  function drawChart() {
    ctx.clearRect(0, 0, W, H);
    ctx.font = '10px Inter, sans-serif';
    ctx.textBaseline = 'middle';
    // grid + y labels
    for (let f = yMin; f <= yMax + 1e-6; f += 0.05) {
      const y = Y(f);
      ctx.strokeStyle = 'rgba(232,236,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(m.l, y);
      ctx.lineTo(W - m.r, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(232,236,255,0.55)';
      ctx.textAlign = 'right';
      ctx.fillText(`${f.toFixed(2)}%`, m.l - 6, y);
    }
    // x labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const d of [0, 100, 200, 300, 365]) {
      ctx.fillText(`${d}`, X(d), H - m.b + 6);
    }
    ctx.textAlign = 'right';
    ctx.fillText('days', W - m.r, H - m.b + 6);
    // 99.880% guide
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(255,154,60,0.45)';
    ctx.beginPath();
    ctx.moveTo(m.l, Y(PLANET.minIntensity_pct));
    ctx.lineTo(W - m.r, Y(PLANET.minIntensity_pct));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,154,60,0.85)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(PLANET.minIntensityText, m.l + 4, Y(PLANET.minIntensity_pct) - 2);

    // curve: observed part bright, rest faint
    for (const pass of [0, 1]) {
      ctx.beginPath();
      let started = false;
      for (const [t, f] of samples) {
        if (pass === 1 && t > cursor) break;
        const x = X(t);
        const y = Y(f);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = pass === 0 ? 'rgba(79,209,197,0.15)' : '#4fd1c5';
      ctx.lineWidth = pass === 0 ? 1 : 1.5;
      ctx.stroke();
    }
    // cursor
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(cursor), m.t);
    ctx.lineTo(X(cursor), H - m.b);
    ctx.stroke();
  }

  function drawDisc() {
    const d = disc.getContext('2d');
    const s = disc.width;
    const R = s * 0.4;
    d.clearRect(0, 0, s, s);
    const g = d.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, R);
    g.addColorStop(0, '#ffd09a');
    g.addColorStop(0.7, '#ff9a3c');
    g.addColorStop(1, '#b8501a');
    d.fillStyle = g;
    d.beginPath();
    d.arc(s / 2, s / 2, R, 0, Math.PI * 2);
    d.fill();
    // planet position across the disc for the nearest transit
    let near = null;
    for (const c of transits) if (Math.abs(cursor - c) < HALF_WIDTH) near = c;
    if (near !== null) {
      const u = (cursor - near) / HALF_WIDTH; // -1 .. 1
      const x = s / 2 + u * (R + R * 0.16);
      d.fillStyle = '#05060f';
      d.beginPath();
      d.arc(x, s / 2 + R * 0.15, R * 0.16, 0, Math.PI * 2);
      d.fill();
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    // ~14 s per year, slowing down during each transit
    const slow = shape(cursor) > 0 || transits.some((c) => Math.abs(cursor - c) < HALF_WIDTH + 1) ? 0.18 : 1;
    cursor += dt * 26 * slow;
    if (cursor > xMax) cursor = xMin;
    drawChart();
    drawDisc();
    raf = requestAnimationFrame(frame);
  }

  return {
    element: root,
    start() {
      resize();
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
    },
    resize,
  };
}
