// budynki — wspólne dla: ciuchcia, taxi, zniwa
// wymaga z gry: T
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
