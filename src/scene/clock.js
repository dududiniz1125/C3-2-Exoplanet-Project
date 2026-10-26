// Simulation clock. Real time is multiplied by a rate (simulated seconds per
// real second) that the RATE slider controls.
export const DAY = 86400;
export const HOUR = 3600;

export const RATE_MIN = 1; // 1 sec/sec
export const RATE_MAX = 30 * DAY; // 30 days/sec

export class SimClock {
  constructor() {
    this.time = 0; // simulated seconds since "Day 1, 00:00"
    this.rate = DAY;
  }

  tick(dtReal) {
    // clamp long frames (e.g. after a hidden tab) so orbits don't jump
    this.time += Math.min(dtReal, 0.1) * this.rate;
  }
}

// Slider position (0..1) <-> rate on a log scale
export const sliderToRate = (s) => Math.exp(Math.log(RATE_MIN) + s * (Math.log(RATE_MAX) - Math.log(RATE_MIN)));
export const rateToSlider = (r) => (Math.log(r) - Math.log(RATE_MIN)) / (Math.log(RATE_MAX) - Math.log(RATE_MIN));

export function formatRate(rate) {
  if (rate < 59.5) return `${Math.round(rate)} sec/sec`;
  if (rate < HOUR - 30) return `${Math.round(rate / 60)} min/sec`;
  if (rate < DAY - 1800) return `${Math.round(rate / HOUR)} h/sec`;
  const d = rate / DAY;
  return `${d < 9.95 ? d.toFixed(1).replace(/\.0$/, '') : Math.round(d)} ${d < 1.05 ? 'day' : 'days'}/sec`;
}
