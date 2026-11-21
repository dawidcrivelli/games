'use strict';
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
