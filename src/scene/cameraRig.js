import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

// One camera for the whole experience. Views never cut: they call flyTo(),
// which eases the camera along a gentle arc to a new position and target.
export function createCameraRig(domElement) {
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 60000);
  camera.position.set(0, 600, 2400);

  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.6;
  controls.screenSpacePanning = true;
  // Touch: one finger orbits, two fingers pinch-zoom and pan
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  let flight = null;

  // Keep depth precision good from 0.05 planet radii up to the outer system
  function updateClipping() {
    const d = camera.position.distanceTo(controls.target);
    const near = THREE.MathUtils.clamp(d * 0.01, 0.0004, 2);
    if (Math.abs(near - camera.near) / camera.near > 0.05) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  }

  /**
   * Fly to a new pose.
   * @param {THREE.Vector3} position  end camera position
   * @param {THREE.Vector3} target    end look-at point
   * @param {object} opts duration (s), arc (0..1 lift), ease, onComplete
   */
  function flyTo(position, target, opts = {}) {
    const { duration = 1.6, arc = 0.15, ease = 'power2.inOut', onComplete, keepControls = false } = opts;
    if (flight) flight.kill();
    controls.enabled = false;

    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const p1 = position.clone();
    const t1 = target.clone();
    // Control point: midpoint pushed back away from both targets for an arc
    const mid = p0.clone().lerp(p1, 0.5);
    const dist = p0.distanceTo(p1);
    const away = mid.clone().sub(t0.clone().lerp(t1, 0.5));
    if (away.lengthSq() < 1e-6) away.set(0, 1, 0);
    away.normalize().multiplyScalar(dist * arc);
    mid.add(away).add(new THREE.Vector3(0, dist * arc * 0.3, 0));

    const state = { t: 0 };
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    return new Promise((resolve) => {
      flight = gsap.to(state, {
        t: 1,
        duration,
        ease,
        onUpdate: () => {
          const t = state.t;
          // quadratic Bézier for the position, straight lerp for the target
          a.copy(p0).lerp(mid, t);
          b.copy(mid).lerp(p1, t);
          camera.position.copy(a.lerp(b, t));
          controls.target.copy(t0).lerp(t1, t);
          camera.lookAt(controls.target);
          updateClipping();
        },
        onComplete: () => {
          flight = null;
          if (!keepControls) controls.enabled = true;
          controls.update();
          onComplete?.();
          resolve();
        },
      });
    });
  }

  // Distance at which a sphere of `radius` fits the viewport (with margin)
  function fitDistance(radius, margin = 1.25) {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const fov = Math.min(vFov, hFov);
    return (radius * margin) / Math.sin(fov / 2);
  }

  // Shift the picture sideways (in pixels) so a side panel doesn't cover
  // the subject. Uses a view offset, so labels and picking stay correct.
  const shift = { x: 0 };
  let shiftTween = null;
  function applyShift() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (Math.abs(shift.x) < 0.5) camera.clearViewOffset();
    else camera.setViewOffset(w, h, shift.x, 0, w, h);
    camera.updateProjectionMatrix();
  }
  function setShift(px) {
    if (shiftTween) shiftTween.kill();
    shiftTween = gsap.to(shift, { x: px, duration: 1.2, ease: 'power2.inOut', onUpdate: applyShift });
  }
  window.addEventListener('resize', applyShift);

  function update() {
    if (!flight && controls.enabled) controls.update();
    updateClipping();
  }

  return {
    camera,
    controls,
    flyTo,
    fitDistance,
    update,
    setShift,
    get flying() {
      return !!flight;
    },
  };
}
