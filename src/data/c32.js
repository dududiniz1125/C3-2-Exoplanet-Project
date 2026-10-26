// ---------------------------------------------------------------------------
// C3-2 Explorer: single source of truth for every number shown in the app.
//
// All values come from the project data sheet (Section 3 of the brief).
// Display strings are written out exactly as given so nothing gets rounded
// differently by the UI. Numeric fields are only used to drive the 3D scene
// (orbit shape, spin rate, sizes) and are never re-formatted for display.
// ---------------------------------------------------------------------------

// Reference values used in the calculations
export const REF = {
  earthRadius_m: 6.36e6,
  earthRadiusText: '6.36 × 10⁶ m',
  earthMass_kg: 6.0e24,
  earthMassText: '6.0 × 10²⁴ kg',
  sunRadius_m: 6.96e8,
  sunRadiusText: '6.96 × 10⁸ m',
  sunMass_kg: 2.0e30,
  sunMassText: '2.0 × 10³⁰ kg',
  sunLuminosity_W: 3.8e26,
  sunLuminosityText: '3.8 × 10²⁶ W',
  G: 6.67e-11,
  GText: '6.67 × 10⁻¹¹ N·m²/kg²',
  gEarth: 9.8,
  gEarthText: '9.8 m/s²',
};

export const C32 = {
  name: 'C3-2',
  tagline: 'A temperate water world orbiting an orange dwarf star',
  verdict: 'Potentially habitable, with major challenges.',
};

// Host star
export const STAR = {
  name: 'Host star (K6V)',
  spectralClass: 'K6V',
  classDescription: 'orange main-sequence dwarf',
  temperature_K: 4300,
  temperatureText: '4300 K',
  colorName: 'orange',
  mass_Msun: 0.64,
  massText: '0.64 M☉ = 1.28 × 10³⁰ kg',
  radius_Rsun: 0.56,
  radiusText: '0.56 R☉ = 3.90 × 10⁸ m',
  luminosity_Lsun: 0.14,
  luminosityText: '0.14 L☉ = 5.32 × 10²⁵ W',
  lifetimeText: '~30–45 billion years',
  lifetimeFormula: '≈ 10 Gy × M/L',
  peakWavelength_nm: 674,
  peakWavelengthText: '≈ 674 nm (orange-red)',
  wienText: "Wien's law: λ = 2.9 × 10⁻³ / 4300",
  brightnessText: '7.86 × 10⁻¹² W/m²',
};

// Distance from Earth
export const DISTANCE = {
  parallaxText: '0.0420 arcseconds',
  pcText: '23.8 pc',
  ly: 77.6,
  lyText: '77.6 light-years',
  mText: '7.34 × 10¹⁷ m',
  probeSpeedText: '6.12 × 10⁴ km/h',
  probeTravelText: '1.37 million years',
  lightFractionText: '10% of light speed',
  lightTravelText: '776 years',
};

// Orbit of C3-2
export const ORBIT = {
  period_days: 105,
  periodText: '105 days',
  radius_AU: 0.376,
  radiusText: '5.63 × 10¹⁰ m = 0.376 AU',
  eccentricity: 0.03,
  eccentricityText: '0.03 (nearly circular)',
  hz_AU: [0.36, 0.51],
  hzText: '≈ 0.36–0.51 AU',
  fluxText: '1.34 × 10³ W/m²',
  earthFluxText: '1361 W/m²',
  apparentStarSizeText: '≈ 1.5× the Sun’s apparent size from Earth',
};

// The planet
export const PLANET = {
  transitDepthText: '0.12%',
  transitDepth: 0.0012,
  transitDepthZText: '0.0012',
  minIntensity_pct: 99.88,
  minIntensityText: '99.880%',
  radius_km: 13500,
  radiusText: '1.35 × 10⁷ m = 2.1 R⊕',
  radiusShortText: '1.35 × 10⁷ m',
  radius_Rearth: 2.1,
  radiusKmText: '13,500 km',
  massText: '7.08 × 10²⁴ kg = 1.18 M⊕',
  gravityText: '2.6 m/s² (0.27 g)',
  gravity_g: 0.27,
  densityText: '≈ 690 kg/m³ = 0.69 g/cm³',
  density_gcm3: 0.69,
  earthDensityText: '5.5 g/cm³',
  day_h: 26.5,
  dayText: '26.5 hours',
  tilt_deg: 25.8,
  tiltText: '25.8°',
  earthTiltText: '23.4°',
  seasonText: '~26 days each (105 ÷ 4)',
  albedoText: '0.52',
  eqTempText: '211 K (−62 °C)',
  surfaceTempText: '~10 °C (hypothetical)',
};

export const ATMOSPHERE = {
  pressureText: '1.5 atm',
  composition: [
    { gas: 'N₂', pct: 80 },
    { gas: 'O₂', pct: 14 },
    { gas: 'CO₂', pct: 4 },
    { gas: 'Ar', pct: 2 },
  ],
  compositionText: '80% N₂, 14% O₂, 4% CO₂, 2% Ar',
  o2Text: '0.21 atm (same as Earth, so breathable oxygen)',
  co2Text: '0.06 atm (~150× Earth’s, toxic to humans, strong greenhouse)',
};

// Comparison values supplied in the brief (Solar System overlay, Sun compare)
export const SOLAR = {
  sunTemperature_K: 5778,
  sunTemperatureText: '5778 K',
  orbits: [
    { name: 'Mercury', au: 0.39 },
    { name: 'Venus', au: 0.72 },
    { name: 'Earth', au: 1 },
  ],
  hz_AU: [0.95, 1.37],
  hzText: '~0.95–1.37 AU',
};

// "Compare size" in Planet view. Earth is the reference (1 R⊕).
// Mars and Neptune radii are standard Solar System values, used only for the
// size comparison and not part of the C3-2 data set.
export const COMPARE_PLANETS = {
  earth: { name: 'Earth', radius_Rearth: 1, radiusText: '1 R⊕' },
  mars: { name: 'Mars', radius_Rearth: 0.532, radiusText: '0.532 R⊕' },
  neptune: { name: 'Neptune', radius_Rearth: 3.88, radiusText: '3.88 R⊕' },
};

// ---------------------------------------------------------------------------
// Hypothetical interior (Section 4.5)
//
// The brief's approximate thicknesses (150 + 500 + 3000 + 6000 + 3500 km)
// add up to 13,150 km, but the planet radius is 13,500 km. Every layer is
// therefore scaled by the same factor (13,500 / 13,150 ≈ 1.0266) so that the
// stack fills the planet exactly. The cards still show the brief's "~"
// values, the drawer shows both.
// ---------------------------------------------------------------------------
const RAW_LAYERS = [
  {
    id: 'atmosphere',
    name: 'Atmosphere',
    approx_km: 150,
    approxText: '~150 km',
    look: 'Thin translucent orange-white shell',
    text: '1.5 atm, 80% N₂, 14% O₂, 4% CO₂, 2% Ar. CO₂ traps heat: −62 °C → ~10 °C.',
    pressure: 'Low: 1.5 atm at the surface',
  },
  {
    id: 'ocean',
    name: 'Global ocean',
    approx_km: 500,
    approxText: '~500 km deep',
    look: 'Deep teal, light rays fading with depth',
    text: 'Liquid water kept warm by the greenhouse effect. No continents, just island chains.',
    pressure: 'Rising',
  },
  {
    id: 'ice',
    name: 'High-pressure ice (ice VII)',
    approx_km: 3000,
    approxText: '~3000 km',
    look: 'Pale blue crystalline layer',
    text: 'Pressure is so high that water becomes hot, solid “ice” even above 0 °C.',
    pressure: 'Very high',
  },
  {
    id: 'mantle',
    name: 'Volatile-rich mantle (water, ammonia, light gases)',
    approx_km: 6000,
    approxText: '~6000 km',
    look: 'Hazy purple-blue swirling layer',
    text: 'Explains why the planet is less dense than water overall.',
    pressure: 'Extreme',
  },
  {
    id: 'core',
    name: 'Small rocky/iron core',
    approx_km: 3500,
    approxText: '~3500 km radius',
    look: 'Glowing dark red-orange',
    text: 'A small core, much less rock than Earth. Its heat may power a magnetic field.',
    pressure: 'Crushing',
  },
];

const RAW_TOTAL_KM = RAW_LAYERS.reduce((s, l) => s + l.approx_km, 0); // 13,150
export const INTERIOR_SCALE = PLANET.radius_km / RAW_TOTAL_KM; // ≈ 1.0266

export const INTERIOR = (() => {
  let top = PLANET.radius_km; // radius of the top of the current layer (km)
  const layers = RAW_LAYERS.map((l, i) => {
    let thickness = Math.round(l.approx_km * INTERIOR_SCALE);
    // the core takes whatever is left so the stack is exactly 13,500 km
    if (i === RAW_LAYERS.length - 1) thickness = top;
    const layer = {
      ...l,
      model_km: thickness,
      outerRadius_km: top,
      innerRadius_km: top - thickness,
      depthTop_km: PLANET.radius_km - top,
      depthBottom_km: PLANET.radius_km - (top - thickness),
    };
    top -= thickness;
    return layer;
  });
  return {
    label: 'Hypothetical: based on C3-2’s low density of 0.69 g/cm³',
    rawTotal_km: RAW_TOTAL_KM,
    layers,
  };
})();

// ---------------------------------------------------------------------------
// "Learn more" drawer tables: value + unit + how we got it
// ---------------------------------------------------------------------------
export const TABLES = {
  overview: [
    {
      title: 'At a glance',
      rows: [
        ['Distance from Earth', `${DISTANCE.lyText} (${DISTANCE.pcText})`, 'Parallax: d (pc) = 1 / p (arcsec), p = 0.0420″'],
        ['Host star', `${STAR.spectralClass}, ${STAR.classDescription}`, 'Spectrum + surface temperature (4300 K)'],
        ['Orbital period', ORBIT.periodText, 'Time between transits in the light curve'],
        ['Planet radius', PLANET.radiusText, 'R = √Z × R★ from the transit depth'],
        ['Verdict', C32.verdict, 'See “Could you live here?”'],
      ],
    },
  ],
  system: [
    {
      title: 'Distance',
      rows: [
        ['Parallax', DISTANCE.parallaxText, 'Star’s apparent shift as Earth orbits the Sun'],
        ['Distance', `${DISTANCE.pcText} = ${DISTANCE.lyText} = ${DISTANCE.mText}`, 'd (pc) = 1 / p (arcsec), then converted to ly and m'],
        [`Travel time at ${DISTANCE.probeSpeedText}`, DISTANCE.probeTravelText, 't = d / v (today’s fastest probes)'],
        [`Travel time at ${DISTANCE.lightFractionText}`, DISTANCE.lightTravelText, 't = d / (0.1 c)'],
      ],
    },
    {
      title: 'Orbit',
      rows: [
        ['Orbital period', ORBIT.periodText, 'Time between dips in the transit light curve'],
        ['Orbital radius', ORBIT.radiusText, 'Kepler’s Third Law: r³ = GMT² / 4π²'],
        ['Eccentricity', ORBIT.eccentricityText, 'Orbit shape (0 = perfect circle); star sits at one focus'],
        ['Habitable zone', `${ORBIT.hzText} (planet is inside, near the warm inner edge)`, 'Sun’s zone (~0.95–1.37 AU) scaled by √(L/L☉)'],
        ['Starlight received', `${ORBIT.fluxText} (Earth: ${ORBIT.earthFluxText})`, 'F = L / 4πr²'],
        ['Star’s apparent size', ORBIT.apparentStarSizeText, '(R★/R☉) ÷ (r / 1 AU)'],
      ],
    },
  ],
  planet: [
    {
      title: 'Size and mass',
      rows: [
        ['Transit depth', `${PLANET.transitDepthText} (relative intensity drops to ${PLANET.minIntensityText})`, 'Measured dip in the star’s brightness'],
        ['Radius', PLANET.radiusText, 'R = √Z × R★'],
        ['Mass', PLANET.massText, 'From the star’s wobble (radial velocity)'],
        ['Surface gravity', PLANET.gravityText, 'g = GM / R²'],
        ['Mean density', `${PLANET.densityText} (Earth: ${PLANET.earthDensityText})`, 'ρ = M / (4/3 πR³): too low for rock, so volatile-rich'],
      ],
    },
    {
      title: 'Spin, seasons and temperature',
      rows: [
        ['Day length (rotation)', PLANET.dayText, 'Project data (not tidally locked)'],
        ['Axial tilt (obliquity)', `${PLANET.tiltText} (Earth: ${PLANET.earthTiltText})`, 'Project data'],
        ['Seasons', PLANET.seasonText, 'Orbital period ÷ 4'],
        ['Bond albedo', PLANET.albedoText, 'Fraction of starlight reflected (thick clouds)'],
        ['Equilibrium temperature', `${PLANET.eqTempText} without greenhouse effect`, 'T = T★ √(R★ / 2r) (1 − A)^¼'],
        ['Surface temperature', `${PLANET.surfaceTempText} with greenhouse warming`, 'Hypothetical: CO₂ greenhouse warming'],
      ],
    },
    {
      title: 'Atmosphere',
      rows: [
        ['Surface pressure', ATMOSPHERE.pressureText, 'Project data'],
        ['Composition', ATMOSPHERE.compositionText, 'Project data (transmission spectrum)'],
        ['O₂ partial pressure', ATMOSPHERE.o2Text, 'p(O₂) = 14% × 1.5 atm'],
        ['CO₂ partial pressure', ATMOSPHERE.co2Text, 'p(CO₂) = 4% × 1.5 atm'],
      ],
    },
  ],
  star: [
    {
      title: 'Host star',
      rows: [
        ['Spectral class', `${STAR.spectralClass} (${STAR.classDescription})`, 'From its spectrum'],
        ['Surface temperature', `${STAR.temperatureText}; colour: ${STAR.colorName}`, 'From its colour / spectrum'],
        ['Mass', STAR.massText, 'M = 0.64 × M☉'],
        ['Radius', STAR.radiusText, 'R = 0.56 × R☉'],
        ['Luminosity', STAR.luminosityText, 'L = 0.14 × L☉'],
        ['Main-sequence lifetime', `${STAR.lifetimeText} (${STAR.lifetimeFormula})`, 'Fuel (M) ÷ burn rate (L)'],
        ['Peak wavelength', STAR.peakWavelengthText, STAR.wienText],
        ['Brightness seen from Earth', STAR.brightnessText, 'b = L / 4πd²'],
      ],
    },
  ],
  interior: [
    {
      title: 'Hypothetical layer model',
      note: `Brief’s thicknesses add up to ${RAW_TOTAL_KM.toLocaleString('en-US')} km; each is scaled by the same factor so the model fills the ${PLANET.radiusKmText} radius exactly.`,
      rows: INTERIOR.layers.map((l) => [
        l.name,
        `${l.approxText} → ${l.model_km.toLocaleString('en-US')} km in the model`,
        l.look,
      ]),
    },
  ],
  reference: [
    {
      title: 'Reference values',
      rows: [
        ['Earth radius R⊕', REF.earthRadiusText, ''],
        ['Earth mass M⊕', REF.earthMassText, ''],
        ['Sun radius R☉', REF.sunRadiusText, ''],
        ['Sun mass M☉', REF.sunMassText, ''],
        ['Sun luminosity L☉', REF.sunLuminosityText, ''],
        ['Gravitational constant G', REF.GText, ''],
        ['Earth gravity g⊕', REF.gEarthText, ''],
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Habitability scorecard (Section 4.6). status: good | challenge | problem
// ---------------------------------------------------------------------------
export const HABITABILITY = {
  title: 'Could you live here?',
  items: [
    { status: 'good', label: 'Star type K6V', detail: 'Long-lived and stable' },
    { status: 'good', label: 'In habitable zone', detail: '0.376 AU, zone 0.36–0.51 AU' },
    { status: 'good', label: 'Eccentricity 0.03', detail: 'Nearly circular, steady climate' },
    { status: 'good', label: 'Tilt 25.8°', detail: 'Earth-like seasons' },
    { status: 'good', label: 'Day 26.5 h', detail: 'Not tidally locked' },
    { status: 'challenge', label: 'Radius 2.1 R⊕', detail: 'Above the 1.8 R⊕ guideline' },
    { status: 'challenge', label: 'Gravity 0.27 g', detail: 'Below 0.5 g' },
    { status: 'problem', label: 'CO₂ 4% at 1.5 atm', detail: 'Toxic to humans' },
    { status: 'challenge', label: 'Temperature −62 °C', detail: 'Without greenhouse warming' },
  ],
  verdict: C32.verdict,
  adaptations: [
    'CO₂-filter masks',
    'Weighted suits plus resistance exercise for low gravity',
    'Floating ocean cities',
    'Orange-spectrum-corrected indoor lighting',
  ],
};

export const LOCALS = {
  title: 'Meet the locals',
  creature: 'Tall, thin and long-legged, with wide membrane wings: in 0.27 g, flying and gliding take very little effort.',
  plants: 'Dark red to black leaves soak up the orange-red light (peak ≈ 674 nm) and the CO₂-rich air.',
};

// ---------------------------------------------------------------------------
// "Did you know?" facts (Section 6)
// ---------------------------------------------------------------------------
export const FACTS = [
  'A year on C3-2 lasts just 105 days, so a 15-year-old would be 52 C3-2 years old.',
  'C3-2 gets 1340 W/m² of starlight, almost exactly what Earth gets (1361 W/m²).',
  'Its star will shine for 30+ billion years, more than twice the current age of the universe.',
  'You’d weigh about a quarter of your Earth weight and could jump almost 4× higher.',
  'The light from C3-2’s star that reaches us tonight left it 77.6 years ago.',
  'C3-2 is less dense than water: 0.69 g/cm³ vs Earth’s 5.5 g/cm³.',
  'Its star peaks at ~674 nm, so daylight looks like a permanent golden hour.',
  'The oxygen is breathable (0.21 atm, same as Earth), but the CO₂ is not.',
];

// ---------------------------------------------------------------------------
// Transit light curve widget (Section 7)
// ---------------------------------------------------------------------------
export const LIGHT_CURVE = {
  yRange_pct: [99.85, 100.05],
  xRange_days: [0, 365],
  firstTransit_day: 7,
  caption: 'Depth Z = 0.0012 → R_planet = √Z × R_star = 1.35 × 10⁷ m',
};
