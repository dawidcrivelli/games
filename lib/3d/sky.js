'use strict';
function setSky(topHex, horHex) { const p = skyGeo.attributes.position, c = skyGeo.attributes.color, top = new T.Color(topHex), hor = new T.Color(horHex), k = new T.Color();
  for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i)/700, 0, 1); k.copy(hor).lerp(top, Math.pow(t, .55)); c.setXYZ(i, k.r, k.g, k.b); } c.needsUpdate = true; }
function updateRain(dt) { if (!rain.visible) return; const p = rain.geometry.attributes.position.array, cx = camera.position.x, cz = camera.position.z;
  for (let i = 0; i < RAIN_N; i++) { let y = rainOff[i*3+1] - 32*dt; if (y < 0) y += 26; rainOff[i*3+1] = y; const x = cx + rainOff[i*3], z = cz + rainOff[i*3+2], o = i*6;
    p[o] = x; p[o+1] = y; p[o+2] = z; p[o+3] = x + .3; p[o+4] = y + 1.2; p[o+5] = z; }
  rain.geometry.attributes.position.needsUpdate = true; }
function updateBirds(t) { birds.forEach(b => { const a = b.ph + t*b.sp; b.g.position.set(b.cx + Math.sin(a)*b.r, b.y + Math.sin(t*.6 + b.ph)*1.5, b.cz + Math.cos(a)*b.r);
  b.g.rotation.y = a + (b.sp > 0 ? Math.PI/2 : -Math.PI/2); const f = Math.sin(t*7 + b.ph)*.75; b.L.rotation.z = f; b.R.rotation.z = -f; }); }
