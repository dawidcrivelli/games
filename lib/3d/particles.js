// Cząsteczki (iskry, kurz, krople, plewy): jedna chmura punktów w scenie, bufor cykliczny.
// particlesInit(scene, n) raz → emit(x, y, z, vx, vy, vz, życie, r, g, b, grawitacja) · updateParticles(dt) co klatkę.
// dotTex: miękka kropka (też dla dymu z lib/3d/smoke.js).
// wymaga: lib/3d/three.js, tex (lib/3d/shapes.js)
'use strict';
let PN = 0, pPos, pCol, pVel, pLife, pGrav, pNext = 0, pGeo, dotTex;
function particlesInit(scene, n) {
  PN = n; pPos = new Float32Array(PN*3); pCol = new Float32Array(PN*3); pVel = new Float32Array(PN*3); pLife = new Float32Array(PN); pGrav = new Float32Array(PN);
  for (let i = 0; i < PN; i++) pPos[i*3 + 1] = -99;
  pGeo = new T.BufferGeometry();
  pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(pCol, 3));
  dotTex = tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 2, 16, 16, 15); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.6, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
  const points = new T.Points(pGeo, new T.PointsMaterial({ size:.42, map:dotTex, vertexColors:true, transparent:true, opacity:.9, depthWrite:false }));
  points.frustumCulled = false; scene.add(points);
}
function emit(x, y, z, vx, vy, vz, life, r, g, b, grav) {
  const i = pNext; pNext = (pNext + 1) % PN;
  pPos[i*3] = x; pPos[i*3+1] = y; pPos[i*3+2] = z; pVel[i*3] = vx; pVel[i*3+1] = vy; pVel[i*3+2] = vz;
  pCol[i*3] = r; pCol[i*3+1] = g; pCol[i*3+2] = b; pLife[i] = life; pGrav[i] = grav;
}
function updateParticles(dt) {
  for (let i = 0; i < PN; i++) { if (pLife[i] <= 0) continue;
    pLife[i] -= dt; if (pLife[i] <= 0) { pPos[i*3+1] = -99; continue; }
    pVel[i*3+1] -= pGrav[i]*dt;
    pPos[i*3] += pVel[i*3]*dt; pPos[i*3+1] += pVel[i*3+1]*dt; pPos[i*3+2] += pVel[i*3+2]*dt;
    if (pPos[i*3+1] < .05 && pGrav[i] > 0) { pPos[i*3+1] = .05; pVel[i*3] *= .5; pVel[i*3+2] *= .5; pVel[i*3+1] = 0; } }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}
