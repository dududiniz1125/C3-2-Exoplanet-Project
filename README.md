# C3-2 Explorer

An interactive 3D web experience about **C3-2**, a fictional but data-based
exoplanet, made for a Grade 10 astrophysics project. Fly from deep space into
the C3-2 system, look at the planet and its orange K6V star, compare sizes and
orbits with the Solar System, and slice the planet open to see a hypothetical
interior.

The design is original (inspired by the *idea* of NASA/JPL's Eyes on
Exoplanets; no NASA names, logos, textures or code are used). Every texture is
generated procedurally in shaders, so there are no image files at all.

## Run it

You need [Node.js](https://nodejs.org) 20.19 or newer.

```bash
npm install && npm run dev
```

Then open the address Vite prints (usually http://localhost:5173). To try it
on an iPad on the same Wi-Fi, open the "Network" address it prints.

```bash
npm run build      # static site in dist/
npm run preview    # serve dist/ locally to check the build
```

`dist/` uses relative paths, so it can be uploaded to any static host
(GitHub Pages, Netlify, a school web server, a sub-folder, …). Browsers block
ES modules on `file://`, so to open the build from your disk use
`npm run preview` (or any local web server) rather than double-clicking
`index.html`.

## What's inside

| View | What you can do |
| --- | --- |
| **Home** | Procedural starfield, title, "Explore" flies you into the system |
| **System** | Orbit drawn with e = 0.03 (star at a focus), habitable-zone band toggle, RATE slider (1 sec/sec to 30 days/sec) with a "Day N of 105" counter, "Compare to our Solar System" overlay (Mercury, Venus, Earth orbits and the Sun's habitable zone) |
| **Planet** | Ocean world with island chains, seasonal polar ice caps, drifting clouds, orange-tinted atmosphere glow, day/night terminator, spin of 26.5 h around a 25.8° axis (axis toggle), "Compare size" with Earth, Mars and Neptune |
| **Star** | Animated granulation, limb darkening, star spots and corona, "Compare to Sun" (1 R☉ vs 0.56 R☉, 5778 K vs 4300 K colours) |
| **Inside** | Zoom right into the planet (or press "Inside C3-2"): a 90° wedge is cut away and you scroll, swipe or use the arrows to travel through five hypothetical layers with a depth gauge |
| **Habitability** | "Could you live here?" scorecard, verdict, human adaptations and a hypothetical "Meet the locals" card |

Also: "Learn more +" drawer with a data table for every view (value, unit and
how it was worked out), an animated transit light curve in the Planet drawer,
"Did you know?" facts, settings (labels, bloom glow, quality) and fullscreen.

### Controls

- **Mouse / trackpad:** drag to orbit, scroll to zoom, right-drag to pan (System view).
- **Touch:** one finger orbits, pinch zooms, two fingers pan.
- **Inside view:** scroll, swipe up/down, arrow keys or the ▲ ▼ buttons.

## Project structure

```
index.html            page shell and UI containers
src/main.js           wires views, camera flights, UI and the frame loop
src/data/c32.js       ALL numbers and text shown in the app (single source of truth)
src/scene/            renderer + bloom, camera rig and flights, starfield,
                      orbit maths (Kepler's equation), colours, textures, labels
src/views/            system, planet, star and interior views
src/shaders/          GLSL: noise, planet surface/clouds/atmosphere, star, interior, rings
src/ui/               HUD, Learn-more drawer, light curve, habitability, facts, styles
```

Dependencies are kept minimal: **three** (3D) and **gsap** (camera tweens),
plus **vite** for development and building. Fonts are Inter and Space Grotesk
from Google Fonts.

## Data sources

All values come from the project data sheet and live in `src/data/c32.js`.
They are shown exactly as given there; the app never re-rounds them. The 3D
scene uses the same numbers (orbit size and shape, period, spin, tilt, radii).

### Reference values

R⊕ = 6.36 × 10⁶ m, M⊕ = 6.0 × 10²⁴ kg, R☉ = 6.96 × 10⁸ m,
M☉ = 2.0 × 10³⁰ kg, L☉ = 3.8 × 10²⁶ W, G = 6.67 × 10⁻¹¹ N·m²/kg²,
g⊕ = 9.8 m/s².

### Star (K6V)

| Quantity | Value | How |
| --- | --- | --- |
| Surface temperature | 4300 K (orange) | From its spectrum / colour |
| Mass | 0.64 M☉ = 1.28 × 10³⁰ kg | 0.64 × M☉ |
| Radius | 0.56 R☉ = 3.90 × 10⁸ m | 0.56 × R☉ |
| Luminosity | 0.14 L☉ = 5.32 × 10²⁵ W | 0.14 × L☉ |
| Main-sequence lifetime | ~30–45 billion years | ≈ 10 Gy × M/L = 10 × 0.64 / 0.14 |
| Peak wavelength | ≈ 674 nm (orange-red) | Wien's law: λ = 2.9 × 10⁻³ / 4300 |
| Brightness seen from Earth | 7.86 × 10⁻¹² W/m² | b = L / 4πd² |

### Distance

| Quantity | Value | How |
| --- | --- | --- |
| Parallax | 0.0420″ | Measured |
| Distance | 23.8 pc = 77.6 ly = 7.34 × 10¹⁷ m | d (pc) = 1 / p (arcsec), then converted |
| Travel time at 6.12 × 10⁴ km/h | 1.37 million years | t = d / v |
| Travel time at 10% of light speed | 776 years | t = d / 0.1c |

### Orbit

| Quantity | Value | How |
| --- | --- | --- |
| Period | 105 days | Time between transits in the light curve |
| Orbital radius | 5.63 × 10¹⁰ m = 0.376 AU | Kepler's Third Law: r³ = GMT² / 4π² |
| Eccentricity | 0.03 | Nearly circular; the star sits at one focus |
| Habitable zone | ≈ 0.36–0.51 AU | Sun's zone (~0.95–1.37 AU) scaled by √(L/L☉) |
| Starlight received | 1.34 × 10³ W/m² (Earth: 1361 W/m²) | F = L / 4πr² |
| Star's apparent size | ≈ 1.5× the Sun's from Earth | (R★/R☉) ÷ (r / 1 AU) = 0.56 / 0.376 |

### Planet

| Quantity | Value | How |
| --- | --- | --- |
| Transit depth | 0.12% (intensity drops to 99.880%) | Measured dip |
| Radius | 1.35 × 10⁷ m = 2.1 R⊕ | R = √Z × R★ = √0.0012 × 3.90 × 10⁸ m |
| Mass | 7.08 × 10²⁴ kg = 1.18 M⊕ | Star's wobble (radial velocity) |
| Surface gravity | 2.6 m/s² (0.27 g) | g = GM / R² |
| Mean density | ≈ 690 kg/m³ = 0.69 g/cm³ | ρ = M / (4/3 πR³) |
| Day length | 26.5 hours | Project data |
| Axial tilt | 25.8° | Project data |
| Seasons | ~26 days each | 105 ÷ 4 |
| Bond albedo | 0.52 | Project data (thick clouds) |
| Equilibrium temperature | 211 K (−62 °C) | T = T★ √(R★ / 2r) (1 − A)^¼ |
| Surface temperature | ~10 °C | **Hypothetical** greenhouse warming |

### Atmosphere

1.5 atm; 80% N₂, 14% O₂, 4% CO₂, 2% Ar. O₂ partial pressure
14% × 1.5 atm = 0.21 atm (same as Earth); CO₂ partial pressure
4% × 1.5 atm = 0.06 atm (~150× Earth's, toxic, strong greenhouse).

### Hypothetical interior

The layer model (atmosphere ~150 km, ocean ~500 km, ice VII ~3000 km,
mantle ~6000 km, core ~3500 km radius) is **hypothetical**, based on the low
density of 0.69 g/cm³. The brief's thicknesses add up to 13,150 km, but the
planet's radius is 13,500 km, so `src/data/c32.js` scales every layer by the
same factor (13,500 / 13,150 ≈ 1.027). The model uses 154 + 513 + 3080 + 6160
+ 3593 = 13,500 km. The depth gauge shows depth only; it doesn't give pressure
numbers.

### Other values used for comparisons

- Sun: 1 R☉, 5778 K. Solar System orbits: Mercury 0.39 AU, Venus 0.72 AU,
  Earth 1 AU; the Sun's habitable zone is ~0.95–1.37 AU (all from the brief).
- Compare size: Earth 1 R⊕, Mars 0.532 R⊕, Neptune 3.88 R⊕ (standard values,
  not part of the C3-2 data).

### What is drawn bigger than real

- **System view:** distances are to scale (1 AU = 100 units), but the star and
  planet are enlarged so you can see them ("Sizes not to scale").
- **Light curve:** the dips are drawn wider than a real transit (a few hours)
  so they are visible on a 365-day axis. Their depth (99.880%) and spacing
  (every 105 days, starting around day 7) are exact.
- **Colours:** star colours come from a black-body approximation for 4300 K
  and 5778 K, with the saturation boosted slightly so the difference is easy to
  see.

Anything imagined (interior, surface temperature with greenhouse, life) is
labelled **Hypothetical** in the app.
