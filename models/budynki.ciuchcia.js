// budynki — wspólne dla: ciuchcia
// wymaga z gry: M, T
'use strict';
function groundPad(b, mat, w, z0, z1) { const m = mesh(new T.PlaneGeometry(w, z1 - z0), mat, 0, .025, (z0 + z1)/2, b); m.rotation.x = -Math.PI/2; return m; }
function ramp(b, len) {                            // peron albo rampa: sięga 2 m od osi toru na sąsiedniej kratce
  box(len, .55, 5, M.concrete, 0, .275, 9.5, b); box(len, .03, .28, M.flagW, 0, .56, 11.7, b);
}
function nameBoard(b, txt, x, z, bg, fg) {
  [-1.9, 1.9].forEach(o => cylY(.07, 2.6, M.steel, x + o, 1.85, z, b, 8)); box(4.3, 1.05, .1, signMat(txt, bg, fg), x, 2.75, z, b);
}
