// rolnicze — wspólne dla: ciuchcia, taxi
// wymaga z gry: M, T, scene, v
'use strict';
function buildTractor() {
  const v = new T.Group(), inner = new T.Group(), st = new T.Group(), P = {};
  inner.scale.setScalar(1.35); v.add(inner);
  // ---------- silnik i napęd (szary odlew)
  box(.4, .5, .95, M.uGray, 0, .8, .95, st);
  box(.44, .1, .5, M.uGrayD, 0, .56, .95, st);                                   // miska olejowa
  cylZ(.06, .42, M.dark, -.25, .86, 1.05, st, 8); cylZ(.045, .3, M.uGrayD, .25, .92, .8, st, 8);
  cylY(.05, .2, M.cYel, .25, .72, 1.15, st, 8);                                   // filtr oleju
  box(.06, .3, .5, M.uGrayD, -.22, .98, .7, st);                                  // pompa wtryskowa
  rbox(.4, .5, 1.3, M.uGray, 0, .75, -.05, st, .06);
  box(.3, .3, .5, M.uGray, 0, .9, -.5, st);
  cylX(.13, 1.3, M.uGray, 0, .68, -.55, st, 10);
  [.47, -.47].forEach(x => box(.2, .34, .34, M.uGray, x, .66, -.55, st));        // zwolnice
  box(.5, .2, .16, M.uGray, 0, .68, 1.5, st);
  // ---------- maska z atrapą
  rbox(.575, .42, 1.22, M.uRed, 0, 1.28, .82, st, .07);
  cylZ(.28, 1.2, M.uRed, 0, 1.44, .82, st, 18);
  rbox(.585, .66, .14, M.uRed, 0, 1.22, 1.45, st, .05); cylZ(.28, .1, M.uRed, 0, 1.44, 1.46, st, 18);
  box(.4, .5, .04, M.dark, 0, 1.2, 1.515, st);
  for (let i = 0; i < 7; i++) box(.022, .5, .03, M.steelL, -.165 + i*.055, 1.2, 1.53, st);
  box(.44, .03, .04, M.chrome, 0, 1.47, 1.525, st);
  [.283, -.283].forEach(x => { for (let i = 0; i < 5; i++) box(.012, .022, .62, M.uRedD, x, 1.16 + i*.05, .8, st);
    const b = mesh(new T.PlaneGeometry(.3, .09), M.badge, x*1.012, 1.42, 1.12, st); b.rotation.y = x > 0 ? Math.PI/2 : -Math.PI/2;
    box(.03, .04, .06, M.chrome, x, 1.12, .3, st); });
  [.4, -.4].forEach(x => { box(.14, .03, .03, M.dark, x*.8, 1.3, 1.36, st); cylZ(.1, .14, M.uRed, x, 1.3, 1.4, st, 14); cylZ(.105, .02, M.chrome, x, 1.3, 1.47, st, 14); cylZ(.085, .02, M.lamp, x, 1.3, 1.482, st, 14); });
  // zbiornik, deska z zegarami
  rbox(.575, .52, .32, M.uRed, 0, 1.33, .1, st, .08); cylY(.035, .03, M.chrome, .12, 1.595, .1, st, 10);
  box(.5, .3, .04, M.dark, 0, 1.42, -.06, st);
  [-.13, .13].forEach(x => { const g = cylY(.065, .02, M.gaugeW, x, 1.45, -.085, st, 12); g.rotation.x = Math.PI/2; const r = cylY(.074, .012, M.steelL, x, 1.45, -.082, st, 12); r.rotation.x = Math.PI/2; });
  box(.04, .04, .02, M.gaugeR, -.04, 1.33, -.085, st); box(.04, .04, .02, M.gaugeG, .04, 1.33, -.085, st);
  const col = cylY(.022, .34, M.steel, 0, 1.6, -.03, st, 6); col.rotation.x = -.6;
  // wydech z klapką, filtr powietrza
  cylY(.06, .32, M.dark, .2, 1.8, 1.0, st, 8); cylY(.032, .5, M.dark, .2, 2.15, 1.0, st, 8);
  const flap = cylY(.045, .012, M.dark, .2, 2.42, .98, st, 8); flap.rotation.x = .6;
  cylY(.028, .16, M.dark, -.2, 1.72, .5, st, 8); cylY(.07, .1, M.steelL, -.2, 1.84, .5, st, 10); cylY(.075, .03, M.dark, -.2, 1.9, .5, st, 10);
  // siedzisko na sprężynie, dźwignie, pedały, podnóżki
  rbox(.46, .1, .42, M.seat, 0, 1.13, -.6, st, .045); rbox(.46, .32, .09, M.seat, 0, 1.31, -.82, st, .04);
  [.22, -.22].forEach(x => box(.04, .12, .36, M.seat, x, 1.18, -.62, st));
  cylY(.05, .22, M.steel, 0, .99, -.62, st, 8);
  const gl = cylY(.016, .4, M.steel, 0, 1.12, -.2, st, 5); gl.rotation.x = .25; mesh(new T.SphereGeometry(.04, 8, 6), M.dark, 0, 1.32, -.15, st);
  const hl = cylY(.014, .34, M.steel, .34, 1.2, -.5, st, 5); hl.rotation.x = -.3; mesh(new T.SphereGeometry(.035, 8, 6), M.gaugeR, .34, 1.36, -.55, st);
  const hb = cylY(.014, .34, M.steel, -.34, 1.05, -.3, st, 5); hb.rotation.x = .5; mesh(new T.SphereGeometry(.03, 8, 6), M.dark, -.34, 1.2, -.22, st);
  [.42, -.42].forEach(x => { box(.3, .03, .56, M.uGrayD, x, .62, .15, st); const p = box(.09, .02, .12, M.steel, x*.75, .78, .36, st); p.rotation.x = -.7; });
  { const p = box(.09, .02, .12, M.steel, .14, .78, .36, st); p.rotation.x = -.7; }
  // łukowe błotniki z lampami i tablicą
  [.72, -.72].forEach(x => {
    for (let i = 0; i < 8; i++) { const a = (22 + i*19)*Math.PI/180; const f = box(.38, .035, .275, M.uRed, x, .68 + Math.sin(a)*.79, -.55 + Math.cos(a)*.79, st); f.rotation.x = Math.PI/2 - a; }
    box(.035, .56, 1.25, M.uRed, x*.74, 1.1, -.55, st);
    box(.1, .08, .03, M.red, x, 1.08, -1.28, st); box(.1, .05, .03, M.amber, x, 1.16, -1.275, st);
    box(.06, .1, .05, M.lamp, x*1.2, 1.3, .12, st); });
  { const pl = mesh(new T.PlaneGeometry(.36, .12), M.uPlate, 0, .98, -.96, st); pl.rotation.y = Math.PI; box(.4, .16, .02, M.dark, 0, .98, -.945, st); }
  // przednia oś z drążkiem, TUZ, zaczep
  box(1.14, .07, .09, M.uGray, 0, .36, 1.35, st); box(.14, .5, .14, M.uGray, 0, .55, 1.35, st); cylX(.016, 1.05, M.dark, 0, .3, 1.2, st, 5);
  [.28, -.28].forEach(x => { const a = box(.045, .045, .7, M.dark, x, .46, -1.05, st); a.rotation.x = .12; const l = box(.03, .5, .03, M.steel, x, .72, -1.05, st); l.rotation.x = -.35;
    const u = box(.04, .04, .4, M.uGray, x, .98, -.86, st); u.rotation.x = -.3; });
  const tl = box(.035, .035, .6, M.steel, 0, .92, -1.0, st); tl.rotation.x = -.35;
  box(.1, .08, .5, M.uGray, 0, .5, -1.1, st); cylY(.02, .14, M.chrome, 0, .56, -1.3, st, 6);
  // ---------- detale: kolektor i rura wydechowa, przewody, alternator, obciążniki, skrzynka, lusterko
  hose([[.21, .98, .72], [.3, 1.02, .9], [.315, 1.2, 1.0], [.26, 1.5, 1.0], [.2, 1.66, 1.0]], .032, M.uGrayD, st);
  [.62, .82, 1.02, 1.22].forEach(z => box(.1, .05, .06, M.uGrayD, .22, .98, z, st));
  hose([[-.22, 1.05, .6], [-.3, 1.18, .45], [-.3, 1.4, .25], [-.24, 1.5, .12]], .012, M.dark, st);
  hose([[.1, 1.0, 1.4], [.19, 1.14, 1.44], [.12, 1.3, 1.42]], .028, M.dark, st);
  hose([[-.1, 1.35, -.07], [-.2, 1.0, .1], [-.21, .9, .5]], .01, M.cRed, st);
  cylZ(.055, .12, M.uGrayD, .25, .98, 1.36, st, 10); cylZ(.07, .02, M.steel, .25, .98, 1.435, st, 10); cylY(.03, .1, M.chrome, -.25, 1.12, .44, st, 8);
  [0, 1, 2].forEach(i => rbox(.5, .22, .055, M.uGrayD, 0, .68, 1.61 + i*.06, st, .02));
  rbox(.3, .13, .18, M.uGrayD, -.72, 1.53, -.72, st, .02); box(.05, .02, .04, M.chrome, -.72, 1.56, -.62, st);
  cylY(.009, .34, M.dark, .72, 1.62, .02, st, 4); rbox(.15, .11, .025, M.dark, .78, 1.8, .02, st, .01); box(.125, .085, .006, M.chrome, .78, 1.8, .005, st);
  [.42, -.42].forEach(x => { for (let i = 0; i < 5; i++) box(.28, .008, .02, M.steel, x, .64, -.06 + i*.1, st); });
  cylY(.02, .26, M.steel, 0, 1.0, 1.36, st, 6);
  inner.add(bake(st));
  // wentylator (kręci się za atrapą)
  { const g = new T.Group(); cylZ(.05, .05, M.dark, 0, 0, 0, g, 8); for (let i = 0; i < 4; i++) { const b = box(.34, .07, .012, M.cYel, 0, 0, 0, g); b.rotation.z = i*Math.PI/4; b.rotation.x = .3; }
    P.fan = bake(g); P.fan.position.set(0, .98, 1.45); inner.add(P.fan); }
  { const tilt = new T.Group(); tilt.position.set(0, 1.7, -.12); tilt.rotation.x = -.6;
    P.sw = makeSteeringWheel(.16); tilt.add(P.sw); inner.add(tilt); }
  P.needles = [gaugeNeedle(inner, -.13, 1.45, -.09, -Math.PI/2, .055), gaugeNeedle(inner, .13, 1.45, -.09, -Math.PI/2, .055)];
  const wheels = [], steerNodes = [];
  [.72, -.72].forEach(x => { const w = makeWheel(.68, .34, M.uCream, 18); w.position.set(x, .68, -.55); inner.add(w); wheels.push({ n:w, r:.68*1.35 }); });
  [.6, -.6].forEach(x => { const pv = new T.Group(); pv.position.set(x, .36, 1.35); const w = makeWheel(.36, .18, M.uCream, 0, true); pv.add(w); inner.add(pv);
    wheels.push({ n:w, r:.36*1.35 }); steerNodes.push({ n:pv, s:1 }); });
  const driver = makeFarmer(.85); driver.position.set(0, 1.18, -.6); inner.add(driver);
  scene.add(v);
  return { g:v, inner, P, wheels, steerNodes, driver, x:0, z:0, h:0, v:0, steer:0, rpm:0,
    maxF:8.2, maxR:3.4, turnK:.3, turnRate:2.3, radius:2.0, eye:new T.Vector3(0, 1.98, -.52), look:new T.Vector3(0, 1.55, 6),
    chase:[12.5, 6.2], hitch:new T.Vector3(0, .5, -1.32), exhaust:new T.Vector3(.2, 2.46, 1.0), dust:[[.72, -.9], [-.72, -.9]] };
}
