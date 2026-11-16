// pociagi — wspólne dla: ciuchcia, taxi
// wymaga z gry: AXLE_Y, CRANK, GAUGE, M, RAIL_TOP, ROD_L, R_DRV, T, TR, TRAINS, TRAIN_L, TRkey, VMAX, WH, cars, lead, plateEU, sc, scene, signMatPKP
'use strict';
function makeRailWheel(r, n, driver) {
  const g = new T.Group();
  cylX(r, .15, M.steelL, 0, 0, 0, g, 26); cylX(r + .06, .035, M.steelL, -.075, 0, 0, g, 26);       // obręcz i obrzeże od środka toru
  cylX(r*.86, .16, M.matte, 0, 0, 0, g, 22);
  for (let i = 0; i < n; i++) { const s = box(.17, r*1.7, r*.13, M.lRed, 0, 0, 0, g); s.rotation.x = i/n*Math.PI; }
  cylX(r*.26, .2, M.lRed, 0, 0, 0, g, 12); cylX(r*.1, .24, M.steelL, 0, 0, 0, g, 8);
  if (driver) { box(.18, r*.34, r*.95, M.lRed, 0, -r*.6, 0, g); cylX(.07, .4, M.steelL, .22, CRANK, 0, g, 8); }   // przeciwwaga i czop korby
  return bake(g);
}
function addWheels(car, tpl, r, zs, ph) {          // para kół na każdej osi
  zs.forEach(z => [-1, 1].forEach(s => { const w = new T.Group(), f = cloneTpl(tpl, true); if (s < 0) f.rotation.y = Math.PI; w.add(f);
    w.position.set(s*GAUGE/2, RAIL_TOP + r, z); car.inner.add(w); car.wheels.push({ w, r, ph:ph && s < 0 ? Math.PI/2 : 0 }); }));
}
function coupler(b, z) { box(.22, .2, .8, M.matte, 0, 1.3, z, b); }
function buffers(b, z, dir) { [-1, 1].forEach(s => { cylZ(.1, .42, M.steel, s*.87, 1.32, z + dir*.2, b, 10); cylZ(.25, .07, M.steel, s*.87, 1.32, z + dir*.43, b, 14); }); }
function mkCar(len, wb, fo) {                      // len: długość pudła, wb: rozstaw wózków, fo: od czoła do pierwszego wózka
  const g = new T.Group(), inner = new T.Group(); g.add(inner); g.visible = false; scene.add(g);
  return { g, inner, wheels:[], len, wb, fo:fo === undefined ? (len - wb)/2 : fo, off:0, x:0, z:0, h:0, steer:0, tilt:0 };
}
function buildLoco() {
  const car = mkCar(8.42, 4.6, 2.4), inner = car.inner, b = new T.Group(), K = M.lBlack, R = M.lRed;
  // ostoja i pomost
  box(1.25, .34, 7.8, R, 0, 1.32, .3, b);
  box(2.6, .07, 5.8, M.matte, 0, 2.03, 1.4, b); [-1, 1].forEach(s => box(.035, .1, 5.8, M.white, s*1.3, 2.02, 1.4, b));
  // kocioł i dymnica
  cylZ(.82, 4.9, K, 0, 2.95, 1.0, b, 26); cylZ(.85, .7, M.matte, 0, 2.95, 3.75, b, 26);
  [-.9, .2, 1.3, 2.4, 3.38].forEach(z => cylZ(.835, .06, M.brass, 0, 2.95, z, b, 26));
  const door = mesh(new T.SphereGeometry(.74, 20, 10), M.matte, 0, 2.95, 4.08, b); door.scale.z = .22;
  cylZ(.1, .12, M.chrome, 0, 2.95, 4.26, b, 10); box(.5, .05, .04, M.chrome, 0, 2.95, 4.3, b);
  box(1.3, .8, 1.0, M.matte, 0, 2.0, 3.7, b);
  // komin, zbieralnik pary, piasecznica, gwizdawka
  mesh(new T.CylinderGeometry(.27, .21, .8, 16), M.matte, 0, 4.15, 3.7, b); cylY(.3, .09, M.brass, 0, 4.56, 3.7, b, 16);
  mesh(new T.SphereGeometry(.42, 16, 10), K, 0, 3.72, 2.35, b); cylY(.42, .3, K, 0, 3.6, 2.35, b, 16);
  mesh(new T.SphereGeometry(.36, 16, 10), M.brass, 0, 3.74, .75, b); cylY(.36, .26, M.brass, 0, 3.62, .75, b, 16);
  cylY(.05, .5, M.brass, .3, 4.0, -.85, b, 8); cylY(.09, .16, M.brass, .3, 4.3, -.85, b, 8);
  [-1, 1].forEach(s => {
    cylZ(.03, 4.6, M.steelL, s*.84, 3.35, 1.1, b, 6);                                               // poręcz
    box(.05, 1.55, 1.8, K, s*1.24, 2.85, 3.35, b); box(.07, .06, 1.8, M.white, s*1.24, 3.64, 3.35, b);   // wiatrownice
    cylZ(.34, 1.15, K, s*1.17, AXLE_Y, 3.3, b, 16); cylZ(.36, .08, M.steelL, s*1.17, AXLE_Y, 3.9, b, 16); cylZ(.36, .08, M.steelL, s*1.17, AXLE_Y, 2.72, b, 16);   // cylindry
    box(.34, .55, .9, K, s*1.0, 1.72, 3.3, b);
    cylZ(.17, .2, M.chrome, s*.85, 1.85, 4.2, b, 12); cylZ(.13, .03, M.lamp, s*.85, 1.85, 4.31, b, 12);   // reflektory
    box(.5, .06, .5, M.matte, s*1.25, 1.3, -2.5, b); box(.5, .06, .5, M.matte, s*1.25, .8, -2.5, b);      // stopnie do budki
  });
  cylZ(.17, .2, M.chrome, 0, 3.95, 4.0, b, 12); cylZ(.13, .03, M.lamp, 0, 3.95, 4.11, b, 12);
  box(2.6, .46, .2, R, 0, 1.32, 4.25, b); box(2.6, .06, .22, M.white, 0, 1.52, 4.25, b); buffers(b, 4.25, 1);
  box(2.6, .46, .2, R, 0, 1.32, -3.65, b);
  // budka maszynisty
  const cz = -2.5;
  box(2.6, .1, 2.1, M.matte, 0, 2.03, cz, b);
  box(2.6, .75, .08, K, 0, 2.42, -1.45, b); box(.9, 1.35, .08, K, 0, 3.47, -1.45, b); box(2.6, .2, .08, K, 0, 4.05, -1.45, b);
  [-1, 1].forEach(s => { box(.08, 1.2, .08, K, s*1.26, 3.4, -1.45, b); box(.78, 1.15, .03, M.glass, s*.84, 3.375, -1.45, b);
    box(.08, 1.15, 2.1, K, s*1.3, 2.62, cz, b); box(.08, .2, 2.1, K, s*1.3, 4.05, cz, b); box(.08, .78, .12, K, s*1.3, 3.57, -3.5, b); box(.08, .78, .12, K, s*1.3, 3.57, -1.5, b);
    box(.03, .1, 2.1, M.white, s*1.345, 2.12, cz, b); box(.02, .36, 1.0, M.plate, s*1.345, 2.72, cz, b); });
  rbox(2.9, .16, 2.7, M.matte, 0, 4.22, cz - .1, b, .07);
  cylZ(.8, .1, M.matte, 0, 2.95, -1.52, b, 20); box(.55, .42, .05, M.fire, 0, 2.55, -1.58, b);
  [-.3, .3].forEach(x => { cylZ(.14, .05, M.brass, x, 3.5, -1.56, b, 14); cylZ(.115, .055, M.gaugeW, x, 3.5, -1.565, b, 14); const n = box(.015, .1, .01, M.gaugeR, x + .02, 3.53, -1.6, b); n.rotation.z = x > 0 ? -.6 : .5; });
  const lv = box(.05, .5, .05, R, .45, 3.05, -1.72, b); lv.rotation.x = -.4; mesh(new T.SphereGeometry(.06, 8, 6), M.brass, .45, 3.28, -1.82, b);
  box(.5, .5, .45, M.seat, .85, 2.33, -2.95, b);
  inner.add(bake(b));
  // koła: toczne z przodu, trzy osie napędne, toczne pod budką
  addWheels(car, WH.sm, .45, [3.25]); addWheels(car, WH.drv, R_DRV, [-1.5, .15, 1.8], true); addWheels(car, WH.md, .5, [-2.9]);
  // wiązary i korbowody
  car.rods = [-1, 1].map(s => { const x = s*1.0, o = { s, ph:s < 0 ? Math.PI/2 : 0 };
    o.cpl = box(.06, .13, 3.65, M.steelL, x, AXLE_Y, .15, inner); o.main = box(.06, .12, ROD_L, M.steelL, s*1.1, AXLE_Y, 1.3, inner);
    o.head = box(.14, .22, .26, M.steel, s*1.12, AXLE_Y, 2.3, inner); o.pist = cylZ(.035, 1.0, M.steelL, s*1.14, AXLE_Y, 2.8, inner, 6);
    [o.cpl, o.main, o.head, o.pist].forEach(m => { m.castShadow = true; }); return o; });
  const drv = makeFarmer(.25); drv.position.set(.85, 2.62, -2.95); inner.add(drv); car.driver = drv;
  car.eye = new T.Vector3(0, 5.05, 2.75); car.look = new T.Vector3(0, 3.3, 14);
  car.chim = new T.Vector3(0, 4.75, 3.7); car.chase = [14.5, 6.2]; car.chaseYaw = .5; car.lookY = 2.2; car.lamp = new T.Vector3(0, 3.9, 4.3);
  return car;
}
function buildTender() {
  const car = mkCar(4.6, 2.8), inner = car.inner, b = new T.Group();
  box(1.3, .32, 4.4, M.lRed, 0, 1.25, 0, b); rbox(2.6, 1.75, 4.3, M.lBlack, 0, 2.3, 0, b, .12);
  [-1, 1].forEach(s => { box(.03, .1, 4.2, M.white, s*1.31, 1.62, 0, b); box(.02, .5, 1.5, signMatPKP, s*1.315, 2.45, 0, b); });
  box(2.3, .5, 2.4, M.matte, 0, 3.1, .7, b);
  for (let i = 0; i < 16; i++) { const m = mesh(new T.IcosahedronGeometry(rr(.28, .46), 0), M.coal, rr(-.85, .85), 3.34 + rr(0, .22), .7 + rr(-.95, .95), b); m.rotation.set(rnd()*6, rnd()*6, 0); }
  cylY(.3, .14, M.brass, 0, 3.24, -1.5, b, 12);
  box(2.6, .4, .2, M.lRed, 0, 1.32, -2.2, b); buffers(b, -2.2, -1); coupler(b, 2.45);
  inner.add(bake(b)); addWheels(car, WH.md, .5, [-1.5, 0, 1.5]);
  return car;
}
function buildCoach() {
  const car = mkCar(6.4, 4.0), inner = car.inner, b = new T.Group(); car.pax = true;
  box(2.3, .36, 5.9, M.matte, 0, 1.3, 0, b); rbox(2.7, 2.25, 6.2, M.cGreen, 0, 2.6, 0, b, .18); rbox(2.56, .4, 6.3, M.cRoof, 0, 3.8, 0, b, .17);
  [-1, 1].forEach(s => { for (let k = -2; k <= 2; k++) { box(.04, .82, .78, M.win, s*1.352, 2.95, k*1.02, b); box(.05, .06, .86, M.cream, s*1.355, 2.5, k*1.02, b); }
    box(.03, .12, 6.1, M.cream, s*1.352, 2.3, 0, b); box(.03, .06, 6.1, M.cream, s*1.352, 3.5, 0, b);
    [-2.75, 2.75].forEach(z => box(.05, 1.75, .5, M.cGreenD, s*1.353, 2.5, z, b));
    [-2, 2].forEach(z => box(.14, .3, 1.6, M.dark, s*.86, .92, z, b)); });
  [-1, 1].forEach(d => { box(2.5, .36, .16, M.matte, 0, 1.3, d*3.05, b); box(1.0, 1.9, .06, M.cGreenD, 0, 2.55, d*3.11, b); });
  [1.2, -1.2].forEach(z => cylY(.14, .14, M.cRoof, 0, 4.04, z, b, 10));
  buffers(b, -3.05, -1); coupler(b, 3.3);
  inner.add(bake(b)); addWheels(car, WH.sm, .45, [-2.55, -1.45, 1.45, 2.55]);
  return car;
}
function buildWagon() {
  const car = mkCar(6.4, 3.8), inner = car.inner, b = new T.Group(), wd = M.wagonWood; car.cargo = 0; car.shown = 0; car.fill = 0;
  box(2.3, .36, 6.0, M.matte, 0, 1.3, 0, b); box(2.6, .12, 6.1, M.woodD, 0, 1.54, 0, b);
  [-1, 1].forEach(s => { box(.12, 1.35, 6.1, wd, s*1.26, 2.25, 0, b); box(.14, .1, 6.2, M.dark, s*1.26, 2.95, 0, b); [-2.9, -1, 1, 2.9].forEach(z => box(.16, 1.4, .14, M.dark, s*1.3, 2.25, z, b));
    box(2.5, 1.35, .12, wd, 0, 2.25, s*3.0, b); });
  const cg = new T.Group(), heap = mesh(new T.SphereGeometry(1, 12, 8), M.coal, 0, .9, 0, cg); heap.scale.set(1.15, .75, 2.8);           // ładunki: węgiel albo kłody
  for (let i = 0; i < 14; i++) { const m = mesh(new T.IcosahedronGeometry(rr(.24, .4), 0), M.coal, rr(-.8, .8), 1.45 + rr(0, .2), rr(-2.3, 2.3), cg); m.rotation.set(rnd()*6, rnd()*6, 0); }
  const lg = new T.Group(); [[-.84, .3], [-.28, .3], [.28, .3], [.84, .3], [-.56, .79], [0, .79], [.56, .79], [-.28, 1.28], [.28, 1.28]].forEach(q => { cylZ(.27, 5.5, M.log, q[0], q[1], 0, lg, 10); cylZ(.23, 5.53, M.cut, q[0], q[1], 0, lg, 10); });
  car.coalG = bake(cg); car.wood = bake(lg); [car.coalG, car.wood].forEach(m => { m.position.y = 1.6; m.visible = false; inner.add(m); });
  box(2.5, .36, .16, M.matte, 0, 1.3, -3.05, b); buffers(b, -3.05, -1); coupler(b, 3.3);
  [-1, 1].forEach(s => cylZ(.11, .06, M.red, s*.95, 1.75, -3.14, b, 10));                          // czerwone światła końca pociągu
  inner.add(bake(b)); addWheels(car, WH.md, .5, [-1.9, 1.9]);
  return car;
}
function buildEU07() {                             // elektrowóz: zielone pudło, żółte czoło, dwa pantografy
  const car = mkCar(8.4, 5.0), inner = car.inner, b = new T.Group(), G = M.euG, Y = M.euY;
  box(2.4, .4, 7.9, M.matte, 0, 1.3, 0, b);
  rbox(2.75, 2.25, 6.75, G, 0, 2.62, -.65, b, .2); rbox(2.6, .3, 8.0, M.cRoof, 0, 3.86, 0, b, .14);
  // przednia kabina jest pusta w środku, żeby było z niej widać tory
  box(2.7, .1, 1.35, M.matte, 0, 1.55, 3.35, b); box(2.7, .05, 1.35, M.cream, 0, 3.7, 3.35, b);
  box(2.75, 1.2, .08, Y, 0, 2.1, 4.0, b); box(2.75, .2, .1, G, 0, 3.64, 4.0, b); box(.1, .86, .06, G, 0, 3.12, 4.0, b); box(2.5, .86, .03, M.glass, 0, 3.12, 4.0, b);
  [-1, 1].forEach(s => { box(.12, .9, .12, G, s*1.31, 3.12, 3.97, b); box(.08, 1.2, 1.35, G, s*1.335, 2.1, 3.35, b); box(.08, .2, 1.35, G, s*1.335, 3.64, 3.35, b); box(.03, .84, 1.2, M.glass, s*1.34, 3.12, 3.33, b);
    box(.03, .16, 7.9, M.cream, s*1.386, 2.22, 0, b); box(.02, .3, 1.2, plateEU, s*1.388, 2.62, -.6, b);
    [-2.3, -1.1, .1, 1.3].forEach(z => box(.04, .62, .78, M.win, s*1.38, 3.08, z, b)); box(.04, .84, .9, M.win, s*1.38, 3.1, -3.3, b);
    [-2.5, 2.5].forEach(z => box(.16, .5, 2.7, M.dark, s*.98, .95, z, b));
    cylZ(.15, .06, M.lamp, s*.85, 1.85, 4.05, b, 12); cylZ(.12, .06, M.red, s*.85, 1.85, -4.07, b, 10); });
  const dk = box(2.4, .12, .6, M.dark, 0, 2.6, 3.62, b); dk.rotation.x = .25; box(2.4, .9, .1, M.dark, 0, 2.1, 3.36, b);
  [-.95, -.6, -.25].forEach(x => { const gg = cylY(.11, .03, M.gaugeW, x, 2.68, 3.64, b, 12); gg.rotation.x = .25; });
  const whl = mesh(new T.TorusGeometry(.13, .025, 6, 16), M.matte, -.6, 2.7, 3.46, b); whl.rotation.x = -1.2; box(.3, .2, .03, M.screen, .5, 2.74, 3.7, b);
  box(.5, .5, .45, M.seat, -.6, 1.85, 2.98, b);
  box(2.5, 1.1, .06, Y, 0, 2.1, -4.04, b); box(2.4, .8, .05, M.win, 0, 3.12, -4.04, b);
  cylZ(.13, .06, M.lamp, 0, 3.74, 4.06, b, 12); buffers(b, 3.95, 1); buffers(b, -3.95, -1);
  [-2.3, 2.3].forEach(z => { box(1.3, .12, 1.4, M.dark, 0, 4.07, z, b);
    [-1, 1].forEach(s => { const lo = box(.06, 1.15, .06, M.steel, s*.35, 4.58, z - .18, b); lo.rotation.x = -.55; const up = box(.06, 1.15, .06, M.steel, s*.35, 5.5, z - .18, b); up.rotation.x = .55; });
    box(1.7, .07, .34, M.steel, 0, 5.98, z + .12, b); });
  box(1.2, .32, 2.2, M.cRoof, 0, 4.15, 0, b);
  inner.add(bake(b)); addWheels(car, WH.md, .5, [-3.25, -1.75, 1.75, 3.25]);
  const drv = makeFarmer(.3); drv.position.set(-.6, 2.25, 2.98); inner.add(drv); car.driver = drv;
  car.eye = new T.Vector3(-.6, 3.08, 2.95); car.look = new T.Vector3(-.35, 2.9, 12); car.chase = [15, 6.4]; car.chaseYaw = .5; car.lookY = 2.2; car.lamp = new T.Vector3(0, 2, 4.3);
  return car;
}
function buildPend(kind) {                         // 1 czoło, 0 środek, -1 koniec składu
  const car = mkCar(8.6, 5.6), inner = car.inner, p = new T.Group(), b = new T.Group(), W = M.pW, N = M.pN; p.add(b); if (kind < 0) b.rotation.y = Math.PI; car.pax = true;
  box(2.5, .55, kind ? 6.6 : 8.4, N, 0, 1.32, kind ? -1 : 0, b);
  if (kind) { rbox(2.8, 2.3, 6.4, W, 0, 2.62, -1.1, b, .3);
    const nose = mesh(new T.SphereGeometry(1, 24, 14), W, 0, 2.54, 1.9, b); nose.scale.set(1.39, 1.14, 2.45);
    const chin = mesh(new T.SphereGeometry(1, 20, 10), N, 0, 1.78, 1.9, b); chin.scale.set(1.3, .66, 2.3);
    const ws = mesh(new T.SphereGeometry(1, 20, 12), M.pGlass, 0, 3.0, 2.55, b); ws.scale.set(1.04, .55, 1.25); ws.rotation.x = .3;
    [-1, 1].forEach(s => mesh(new T.SphereGeometry(.14, 10, 8), kind > 0 ? M.lamp : M.red, s*.62, 2.02, 4.02, b));
    const dk = box(1.9, .14, .8, M.dark, 0, 2.42, 3.2, b); dk.rotation.x = .22; [-.42, .42].forEach(x => { const sc = box(.36, .2, .03, M.screen, x, 2.52, 3.42, b); sc.rotation.x = -.6; });
  } else { rbox(2.8, 2.3, 8.5, W, 0, 2.62, 0, b, .3); box(1.3, .12, 1.4, M.dark, 0, 3.83, 1.5, b);
    [-1, 1].forEach(s => { const lo = box(.06, 1.1, .06, M.steel, s*.35, 4.3, 1.35, b); lo.rotation.x = -.55; const up = box(.06, 1.1, .06, M.steel, s*.35, 5.2, 1.35, b); up.rotation.x = .55; }); box(1.7, .07, .34, M.steel, 0, 5.66, 1.65, b); }
  box(1.6, .2, kind ? 4 : 6, M.cRoof, 0, 3.8, kind ? -1.6 : -1.2, b);
  [-1, 1].forEach(s => { const z0 = kind ? -1.35 : 0, L = kind ? 5.5 : 8.2; box(.03, .72, L, N, s*1.405, 3.02, z0, b); box(.03, .18, L, N, s*1.405, 2.02, z0, b);
    for (let z = z0 - L/2 + .75; z < z0 + L/2 - .4; z += 1.12) box(.04, .5, .82, M.win, s*1.41, 3.04, z, b); });
  inner.add(bake(p)); addWheels(car, WH.sm, .45, [-3.4, -2.2, 2.2, 3.4]);
  car.driver = new T.Group(); car.eye = new T.Vector3(0, 3.05, 2.5); car.look = new T.Vector3(0, 2.86, 12); car.chase = [16, 6.6]; car.chaseYaw = .5; car.lookY = 2.2; car.lamp = new T.Vector3(0, 2, 4.4);
  return car;
}
function setConsist(key) {
  cars.forEach(c => { c.g.visible = false; }); TRkey = key; TR = TRAINS[key]; cars = TR.cars; lead = cars[0]; VMAX = TR.vmax;
  let c = 0; cars.forEach(k => { k.off = c + k.fo; c += k.len + .35; k.g.visible = true; }); TRAIN_L = c;
}
