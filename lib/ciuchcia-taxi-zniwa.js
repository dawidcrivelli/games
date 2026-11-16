// silnik — wspólne dla: ciuchcia, taxi, zniwa
// wymaga z gry: AU, PN, RAIN_N, T, birds, camera, draw, pCol, pGeo, pGrav, pLife, pNext, pPos, pVel, rain, rainOff, renderer, skyGeo
'use strict';

// --- util
const wrap = a => { while (a > Math.PI) a -= 2*Math.PI; while (a < -Math.PI) a += 2*Math.PI; return a; };

// --- three
function tex(w, h, draw, rx, ry) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
  t.anisotropy = 4; return t;
}
const lam = (c, o) => new T.MeshLambertMaterial(Object.assign({ color:c }, o));
const pho = (c, o) => new T.MeshStandardMaterial(Object.assign({ color:c, roughness:.34, metalness:.25, envMapIntensity:.85 }, o));
function mesh(geo, mat, x, y, z, parent) {
  const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
  if (parent) parent.add(m); return m;
}
const box = (w, h, d, mat, x, y, z, p) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z, p);
const cylY = (r, len, mat, x, y, z, p, seg) => mesh(new T.CylinderGeometry(r, r, len, seg || 12), mat, x, y, z, p);
const cylX = (r, len, mat, x, y, z, p, seg) => { const m = cylY(r, len, mat, x, y, z, p, seg || 14); m.rotation.z = Math.PI/2; return m; };
const cylZ = (r, len, mat, x, y, z, p, seg) => { const m = cylY(r, len, mat, x, y, z, p, seg || 12); m.rotation.x = Math.PI/2; return m; };
function rboxGeo(w, h, d, r) {                   // pudełko z zaokrąglonymi krawędziami (blachy, maski, dachy)
  r = Math.min(r, w/2 - .002, h/2 - .002, d/2 - .002); const b = r/2, x = w/2 - b, y = h/2 - b, s = new T.Shape();
  s.moveTo(-x + b, -y); s.lineTo(x - b, -y); s.quadraticCurveTo(x, -y, x, -y + b); s.lineTo(x, y - b); s.quadraticCurveTo(x, y, x - b, y);
  s.lineTo(-x + b, y); s.quadraticCurveTo(-x, y, -x, y - b); s.lineTo(-x, -y + b); s.quadraticCurveTo(-x, -y, -x + b, -y);
  const g = new T.ExtrudeGeometry(s, { depth:d - 2*b, bevelEnabled:true, bevelThickness:b, bevelSize:b, bevelSegments:2, curveSegments:3 }); g.translate(0, 0, -(d - 2*b)/2); return g; }
const rbox = (w, h, d, mat, x, y, z, p, r) => mesh(rboxGeo(w, h, d, r || .08), mat, x, y, z, p);
function hose(pts, r, mat, parent) { const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))); return mesh(new T.TubeGeometry(c, pts.length*5, r, 5, false), mat, 0, 0, 0, parent); }
function mergeGeos(gs) {
  let n = 0; gs.forEach(g => n += g.attributes.position.count);
  const P = new Float32Array(n*3), N = new Float32Array(n*3), U = new Float32Array(n*2); let o = 0;
  gs.forEach(g => { P.set(g.attributes.position.array, o*3); N.set(g.attributes.normal.array, o*3);
    if (g.attributes.uv) U.set(g.attributes.uv.array, o*2); o += g.attributes.position.count; });
  const G = new T.BufferGeometry();
  G.setAttribute('position', new T.BufferAttribute(P, 3)); G.setAttribute('normal', new T.BufferAttribute(N, 3)); G.setAttribute('uv', new T.BufferAttribute(U, 2));
  return G;
}
function bake(src) {
  src.updateMatrixWorld(true);
  const inv = new T.Matrix4().copy(src.matrixWorld).invert(), by = new Map();
  src.traverse(o => { if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(g); });
  const out = new T.Group();
  by.forEach((gs, mat) => { const m = new T.Mesh(mergeGeos(gs), mat); m.castShadow = !mat.transparent; m.receiveShadow = !mat.transparent; out.add(m); });
  return out;
}

// --- scena
function setSky(topHex, horHex) { const p = skyGeo.attributes.position, c = skyGeo.attributes.color, top = new T.Color(topHex), hor = new T.Color(horHex), k = new T.Color();
  for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i)/700, 0, 1); k.copy(hor).lerp(top, Math.pow(t, .55)); c.setXYZ(i, k.r, k.g, k.b); } c.needsUpdate = true; }
function updateRain(dt) { if (!rain.visible) return; const p = rain.geometry.attributes.position.array, cx = camera.position.x, cz = camera.position.z;
  for (let i = 0; i < RAIN_N; i++) { let y = rainOff[i*3+1] - 32*dt; if (y < 0) y += 26; rainOff[i*3+1] = y; const x = cx + rainOff[i*3], z = cz + rainOff[i*3+2], o = i*6;
    p[o] = x; p[o+1] = y; p[o+2] = z; p[o+3] = x + .3; p[o+4] = y + 1.2; p[o+5] = z; }
  rain.geometry.attributes.position.needsUpdate = true; }
function updateBirds(t) { birds.forEach(b => { const a = b.ph + t*b.sp; b.g.position.set(b.cx + Math.sin(a)*b.r, b.y + Math.sin(t*.6 + b.ph)*1.5, b.cz + Math.cos(a)*b.r);
  b.g.rotation.y = a + (b.sp > 0 ? Math.PI/2 : -Math.PI/2); const f = Math.sin(t*7 + b.ph)*.75; b.L.rotation.z = f; b.R.rotation.z = -f; }); }
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

// --- audio
function tone(f, dur, type, vol, f2, delay) {
  if (!AU.ctx) return; const c = AU.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .3, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + .05);
}

// --- ui
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix(); }
