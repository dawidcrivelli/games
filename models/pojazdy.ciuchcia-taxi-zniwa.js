// pojazdy — wspólne dla: ciuchcia, taxi, zniwa
// wymaga z gry: M, T
'use strict';
function makeWheel(r, w, rimMat, nLug, rib) {
  const g = new T.Group();
  cylX(r*.93, w, M.tire, 0, 0, 0, g, 28); cylX(r*.86, w + .03, M.tire, 0, 0, 0, g, 28);   // opona z wypukłym bokiem
  cylX(r*.6, w + .045, rimMat, 0, 0, 0, g, 20);                                          // obręcz
  cylX(r*.5, w + .05, M.dark, 0, 0, 0, g, 20); cylX(r*.46, w + .055, rimMat, 0, 0, 0, g, 20);   // rant tarczy
  cylX(r*.2, w + .11, rimMat, 0, 0, 0, g, 12); cylX(r*.1, w + .16, M.dark, 0, 0, 0, g, 8);
  for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2; cylX(r*.03, w + .13, M.steelL, 0, Math.cos(a)*r*.15, Math.sin(a)*r*.15, g, 6);
    const h = box(w + .065, r*.1, r*.16, M.dark, 0, Math.cos(a + .5)*r*.34, Math.sin(a + .5)*r*.34, g); h.rotation.x = a + .5; }
  if (rib) [-.3, 0, .3].forEach(x => cylX(r*.975, w*.16, M.tire, x*w, 0, 0, g, 28));
  for (let i = 0; i < nLug; i++) { const a = i/nLug*Math.PI*2, sd = i%2 ? 1 : -1;        // jodełka
    const l = box(w*.6, r*.15, r*.13, M.tire, sd*w*.22, Math.cos(a)*r*.95, Math.sin(a)*r*.95, g); l.rotation.set(a, sd*.5, 0); }
  return bake(g);
}
function makeSteeringWheel(r) {
  const g = new T.Group();
  const t = mesh(new T.TorusGeometry(r, r*.11, 8, 20), M.dark, 0, 0, 0, g); t.rotation.x = Math.PI/2;
  for (let i = 0; i < 3; i++) { const a = i/3*Math.PI*2; const s = box(r*.14, r*.08, r, M.dark, Math.sin(a)*r/2, 0, Math.cos(a)*r/2, g); s.rotation.y = a; }
  cylY(r*.2, r*.16, M.steel, 0, 0, 0, g, 10);
  return bake(g);
}
function gaugeNeedle(parent, x, y, z, tiltX, len) {
  const o = new T.Group(); o.position.set(x, y, z); o.rotation.x = tiltX; const n = new T.Group();
  box(len*.18, .006, len, M.gaugeR, 0, .016, len*.42, n); o.add(n); parent.add(o); return n;
}
