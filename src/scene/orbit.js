import { ORBIT } from '../data/c32.js';
import { DAY } from './clock.js';

// Position of C3-2 on its (slightly) elliptical orbit, star at the origin
// (one focus). Solves Kepler's equation M = E − e·sin E by Newton iteration.
// Returns coordinates in AU in the orbital (x–z) plane.
export function orbitState(timeSec, out = {}) {
  const e = ORBIT.eccentricity;
  const a = ORBIT.radius_AU;
  const b = a * Math.sqrt(1 - e * e);
  const M = ((2 * Math.PI * timeSec) / (ORBIT.period_days * DAY)) % (2 * Math.PI);
  let E = M;
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  out.x = a * (Math.cos(E) - e);
  out.z = -b * Math.sin(E);
  out.r = a * (1 - e * Math.cos(E));
  out.meanAnomaly = M;
  return out;
}

// Points along the full ellipse (for drawing the orbit line), in AU
export function orbitPoints(segments = 256) {
  const e = ORBIT.eccentricity;
  const a = ORBIT.radius_AU;
  const b = a * Math.sqrt(1 - e * e);
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const E = (i / segments) * Math.PI * 2;
    pts.push([a * (Math.cos(E) - e), -b * Math.sin(E)]);
  }
  return pts;
}
