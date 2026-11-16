// silnik — wspólne dla: zniwa, rafa
// wymaga z gry: onTilt, tilt
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
