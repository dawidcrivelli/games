// przechylanie telefonu (żyroskop) — wspólne dla: taxi, zniwa, rafa
// wymaga z gry: onTilt, tilt = { on, x, y, cal, r0, f0, events, listening }
'use strict';

// --- ui
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
