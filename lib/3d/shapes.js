// Bryły „miasta” (Ciuchcia, Taxi, Żniwa): tex(w, h, rysuj) — tekstura z płótna, lam/pho — materiały, mesh/box/cylX/Y/Z/rbox/ell/cone
// (geometria, materiał, x, y, z, rodzic), hose — wąż, mergeGeos/bake — sklejanie w jedną siatkę na materiał, signMat — tablica
// z napisem, cloneTpl — tania kopia szablonu. Konflikt nazw z lib/3d/zoo-kit.js (inne mesh/box) — nie ładować obu.
// wymaga: lib/3d/three.js
'use strict';
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
function signMat(txt, bg, fg) {                    // emaliowana tablica z napisem
  return lam(0xffffff, { map:tex(256, 64, (g, w, h) => { g.fillStyle = bg || '#1f4e8c'; g.fillRect(0, 0, w, h); g.strokeStyle = fg || '#fff'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = fg || '#fff'; g.font = 'bold 34px Arial, sans-serif'; const tw = g.measureText(txt).width; if (tw > 226) g.font = 'bold ' + Math.floor(34*226/tw) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w/2, h/2 + 2); }) });
}
const ell = (rx, ry, rz, mat, x, y, z, p, seg) => { const m = mesh(new T.SphereGeometry(1, seg || 14, 10), mat, x, y, z, p); m.scale.set(rx, ry, rz); return m; };
const cone = (r0, r1, h, mat, x, y, z, p, seg) => mesh(new T.CylinderGeometry(r1, r0, h, seg || 10), mat, x, y, z, p);
function cloneTpl(tpl, shadow) {                   // tania kopia sklejonej bryły (wspólna geometria)
  const g = new T.Group();
  tpl.children.forEach(m => { const c = new T.Mesh(m.geometry, m.material); c.castShadow = !!shadow && !m.material.transparent; c.receiveShadow = true; g.add(c); });
  return g;
}
