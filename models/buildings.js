// Budynki: gableHouse (dom z dwuspadowym dachem), groundPad (płyta), ramp (peron/rampa), nameBoard (tablica z nazwą na słupkach).
// wymaga: lib/3d/three.js, lib/3d/shapes.js; od gry: paleta M
'use strict';
function gableHouse(b, w, h, d, wallMat, roofMat, pitch, gMat) {
  box(w, h, d, wallMat, 0, h/2, 0, b);
  const rise = Math.tan(pitch)*w/2, sl = w/2/Math.cos(pitch) + .5;
  const r1 = box(sl, .28, d + 1.4, roofMat, w/4 + .05, h + rise/2, 0, b); r1.rotation.z = -pitch;
  const r2 = box(sl, .28, d + 1.4, roofMat, -w/4 - .05, h + rise/2, 0, b); r2.rotation.z = pitch;
  const sh = new T.Shape(); sh.moveTo(-w/2, h); sh.lineTo(w/2, h); sh.lineTo(0, h + rise); sh.lineTo(-w/2, h);
  mesh(new T.ShapeGeometry(sh), gMat, 0, 0, d/2, b); mesh(new T.ShapeGeometry(sh), gMat, 0, 0, -d/2, b);
  return rise;
}
function groundPad(b, mat, w, z0, z1) { const m = mesh(new T.PlaneGeometry(w, z1 - z0), mat, 0, .025, (z0 + z1)/2, b); m.rotation.x = -Math.PI/2; return m; }
function ramp(b, len) {                            // peron albo rampa: sięga 2 m od osi toru na sąsiedniej kratce
  box(len, .55, 5, M.concrete, 0, .275, 9.5, b); box(len, .03, .28, M.flagW, 0, .56, 11.7, b);
}
function nameBoard(b, txt, x, z, bg, fg) {
  [-1.9, 1.9].forEach(o => cylY(.07, 2.6, M.steel, x + o, 1.85, z, b, 8)); box(4.3, 1.05, .1, signMat(txt, bg, fg), x, 2.75, z, b);
}
