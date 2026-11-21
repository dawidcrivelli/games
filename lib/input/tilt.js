// przechylanie telefonu (żyroskop) — wspólne dla: taxi, zniwa, rafa
'use strict';

async function enableTilt() {
  try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return false; } } catch (e) { return false; }
  if (!window.DeviceOrientationEvent) return false;
  if (!tilt.listening) { addEventListener('deviceorientation', onTilt); tilt.listening = true; }
  tilt.cal = true; tilt.events = 0;
  return new Promise(res => setTimeout(() => res(tilt.events > 0), 900));
}

// przechył urządzenia → tilt.x (w prawo) i tilt.y (górna krawędź od siebie), od -1 do 1; sens: ile stopni to pełne wychylenie
function tiltFromEvent(e, sens) {
  if (e.beta == null || e.gamma == null) return; tilt.events++;
  const so = screen.orientation, ang = so && typeof so.angle === 'number' ? so.angle : (window.orientation || 0);
  let right, fwd;
  if (ang === 90) { right = e.beta; fwd = e.gamma; }
  else if (ang === 270 || ang === -90) { right = -e.beta; fwd = -e.gamma; }
  else if (ang === 180) { right = -e.gamma; fwd = e.beta; }
  else { right = e.gamma; fwd = -e.beta; }
  if (tilt.cal) { tilt.r0 = right; tilt.f0 = fwd; tilt.cal = false; }
  tilt.x = clamp((right - tilt.r0)/sens, -1, 1); tilt.y = clamp((fwd - tilt.f0)/sens, -1, 1);
}

// krzywa czułości: mały przechył (do `dead`) nic nie robi, potem łagodnie (smoothstep) aż do pełnego wychylenia przy `full`
function tiltCurve(v, dead, full) { const a = Math.abs(v); if (a <= dead) return 0; const u = Math.min(1, (a - dead)/(full - dead)); return Math.sign(v)*u*u*(3 - 2*u); }
