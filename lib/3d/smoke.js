// Dym i para (kłęby z komina, rury wydechowej): 48 duszków, rosną i bledną, znosi je wiatr z pogody (WX.wind).
// smokeInit(scene, mapa) raz → puff(x, y, z, vx, vy, vz, życie, rozmiar, szarość, krycie) · updatePuffs(dt) co klatkę.
// wymaga: lib/3d/three.js, WX (lib/3d/sky.js)
'use strict';
const puffs = [];
let puffNext = 0;
function smokeInit(scene, map) {
  for (let i = 0; i < 48; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map, color:0xffffff, transparent:true, opacity:0, depthWrite:false })); s.visible = false; scene.add(s); puffs.push({ s, life:0, max:1, vx:0, vy:0, vz:0, size:1 }); }
}
function puff(x, y, z, vx, vy, vz, life, size, gray, a) {
  const p = puffs[puffNext]; puffNext = (puffNext + 1) % puffs.length;
  p.s.position.set(x, y, z); p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.size = size; p.a = a || 1; p.s.material.color.setScalar(gray); p.s.visible = true;
}
function updatePuffs(dt) {
  for (let i = 0; i < puffs.length; i++) { const p = puffs[i]; if (p.life <= 0) continue;
    p.life -= dt; if (p.life <= 0) { p.s.visible = false; continue; }
    const t = 1 - p.life/p.max; p.vy *= 1 - dt*.6; p.vx += (.9*WX.wind - p.vx)*dt*.5;
    p.s.position.x += p.vx*dt; p.s.position.y += p.vy*dt; p.s.position.z += p.vz*dt;
    p.s.scale.setScalar(p.size*(.45 + t*2.4)); p.s.material.opacity = ((1 - t)*(1 - t)*.8 + (1 - t)*.1)*p.a; }
}
