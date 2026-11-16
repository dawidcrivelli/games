// zwierzeta — wspólne dla: zniwa
// wymaga z gry: M, T, scene
'use strict';
function buildGiraffe() {
  const v = new T.Group(), P = {}, sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const sph = (mat, x, y, z, sx, sy, sz, p) => { const m = sh(mesh(new T.SphereGeometry(1, 18, 14), mat, x, y, z, p)); m.scale.set(sx, sy, sz); return m; };
  const body = new T.Group(); v.add(body); P.body = body;
  const torso = sph(M.gir, 0, 2.55, 0, .62, .7, 1.3, body); torso.rotation.x = -.16;
  sph(M.gir, 0, 2.78, .82, .55, .74, .62, body); sph(M.gir, 0, 2.38, -.95, .56, .6, .55, body); sph(M.girL, 0, 2.05, 0, .45, .3, 1.0, body);
  // szyja z grzywą
  const neck = new T.Group(); neck.position.set(0, 3.0, 1.0); neck.rotation.order = 'YXZ'; body.add(neck); P.neck = neck;
  sh(mesh(new T.CylinderGeometry(.17, .31, 2.55, 14), M.gir, 0, 1.2, 0, neck));
  sh(box(.07, 2.35, .12, M.girD, 0, 1.3, -.23, neck));
  // głowa
  const head = new T.Group(); head.position.set(0, 2.45, 0); neck.add(head); P.head = head;
  sph(M.gir, 0, .1, .1, .2, .21, .3, head); sph(M.girL, 0, .04, .47, .145, .13, .3, head); sph(M.girD, 0, .05, .74, .1, .085, .06, head);
  [-.09, .09].forEach(x => { sh(cylY(.03, .24, M.girL, x, .37, .0, head, 8)); sph(M.girD, x, .5, 0, .05, .05, .05, head);
    sph(M.girD, x*1.9, .14, .22, .05, .05, .05, head); const w = mesh(new T.SphereGeometry(.016, 6, 5), M.eyeW, x*2.15, .16, .25, head);
    sph(M.girD, x*.6, .08, .76, .02, .02, .02, head); });
  P.ears = [-1, 1].map(s => { const e = sh(mesh(new T.ConeGeometry(.075, .3, 6), M.girL, s*.3, .24, -.04, head)); e.rotation.z = -s*1.25; e.scale.z = .45; return e; });
  P.jaw = new T.Group(); P.jaw.position.set(0, -.07, .18); head.add(P.jaw);
  sh(box(.2, .06, .44, M.girL, 0, 0, .22, P.jaw)); box(.08, .025, .24, M.tongue, 0, .035, .42, P.jaw);
  // nogi: biodro → kolano → kopyto
  P.legs = [[.33, 2.25, .85, 1.15, 1.1], [-.33, 2.25, .85, 1.15, 1.1], [.33, 2.1, -.9, 1.08, 1.02], [-.33, 2.1, -.9, 1.08, 1.02]].map(L => {
    const hip = new T.Group(); hip.position.set(L[0], L[1], L[2]); body.add(hip);
    sh(mesh(new T.CylinderGeometry(.16, .1, L[3], 10), M.gir, 0, -L[3]/2, 0, hip)); sph(M.gir, 0, -L[3], 0, .11, .11, .11, hip);
    const knee = new T.Group(); knee.position.y = -L[3]; hip.add(knee);
    sh(mesh(new T.CylinderGeometry(.09, .075, L[4] - .14, 10), M.girL, 0, -(L[4] - .14)/2, 0, knee)); sh(mesh(new T.CylinderGeometry(.085, .11, .14, 10), M.hoof, 0, -L[4] + .07, 0, knee));
    return { hip, knee }; });
  // ogon
  P.tail = new T.Group(); P.tail.position.set(0, 2.6, -1.4); P.tail.rotation.x = -.25; body.add(P.tail);
  sh(cylY(.03, .95, M.girL, 0, -.47, 0, P.tail, 6)); sh(mesh(new T.ConeGeometry(.09, .4, 6), M.girD, 0, -1.1, 0, P.tail));
  const driver = makeFarmer(.2); driver.position.set(0, 3.24, -.1); body.add(driver);
  scene.add(v);
  return { g:v, inner:v, P, wheels:[], steerNodes:[], driver, x:0, z:0, h:0, v:0, steer:0, rpm:0, walk:0, stepN:0, eat:0, chew:0, lastCrunch:0,
    maxF:5.7, maxR:2.2, turnK:.5, turnRate:2.4, radius:1.9, yaw:0, ta:0, td:3, tx:0, tz:0, eye:new T.Vector3(0, 3.95, -.25), look:new T.Vector3(0, 3.3, 8),
    chase:[11.5, 7], lookY:2.6, dust:[[.33, .85], [-.33, -.9]], baleFrom:new T.Vector3(0, 2.2, -1.5), baleTo:new T.Vector3(0, .32, -3) };
}
function buildElephant() {
  const v = new T.Group(), P = {}, sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const sph = (mat, x, y, z, sx, sy, sz, p, seg) => { const m = sh(mesh(new T.SphereGeometry(1, seg || 18, seg ? 6 : 14), mat, x, y, z, p)); m.scale.set(sx, sy, sz); return m; };
  const body = new T.Group(); v.add(body); P.body = body;
  sph(M.eleph, 0, 2.25, -.1, 1.15, 1.1, 1.7, body); sph(M.eleph, 0, 2.42, .95, 1.02, 1.02, .85, body); sph(M.eleph, 0, 2.2, -1.1, 1.05, 1.0, .8, body);
  const head = new T.Group(); head.position.set(0, 2.75, 1.8); body.add(head); P.head = head;
  sph(M.eleph, 0, 0, 0, .72, .8, .72, head); sph(M.eleph, 0, .48, -.08, .52, .36, .5, head);
  [-1, 1].forEach(s => { sph(M.girD, s*.44, .12, .5, .06, .07, .06, head, 8); sh(hose([[s*.3, -.35, .42], [s*.38, -.78, .72], [s*.42, -.9, 1.15], [s*.37, -.74, 1.5]], .07, M.ivory, head)); });
  P.ears = [-1, 1].map(s => { const e = new T.Group(); e.position.set(s*.58, .15, -.15); sph(M.elephD, s*.58, -.12, 0, .62, .85, .07, e); head.add(e); return e; });
  P.trunk = []; { let par = head; const lens = [.5, .48, .46, .44, .42], rs = [.3, .25, .21, .17, .13, .1];
    for (let i = 0; i < 5; i++) { const g = new T.Group(); g.position.set(0, i ? -lens[i - 1] : -.32, i ? 0 : .52); par.add(g);
      sh(mesh(new T.CylinderGeometry(rs[i], rs[i + 1], lens[i] + .08, 10), M.eleph, 0, -lens[i]/2, 0, g)); P.trunk.push(g); par = g; } }
  P.legs = [[.62, 1.65, .95], [-.62, 1.65, .95], [.62, 1.6, -1.05], [-.62, 1.6, -1.05]].map(L => { const hip = new T.Group(); hip.position.set(L[0], L[1], L[2]); body.add(hip);
    sh(mesh(new T.CylinderGeometry(.37, .3, L[1], 12), M.eleph, 0, -L[1]/2, 0, hip)); sh(mesh(new T.CylinderGeometry(.32, .35, .16, 12), M.elephD, 0, -L[1] + .08, 0, hip));
    [-1, 0, 1].forEach(a => sph(M.ivory, a*.15, -L[1] + .07, .3 - Math.abs(a)*.04, .07, .07, .05, hip, 8)); return hip; });
  P.tail = new T.Group(); P.tail.position.set(0, 2.5, -1.85); P.tail.rotation.x = -.2; body.add(P.tail);
  sh(cylY(.05, 1.0, M.eleph, 0, -.5, 0, P.tail, 6)); sh(mesh(new T.ConeGeometry(.1, .32, 6), M.girD, 0, -1.1, 0, P.tail));
  // derka i kosz na słomę
  sh(rbox(2.0, .1, 2.3, M.blanket, 0, 3.3, -.35, body, .05)); [1.1, -1.1].forEach(x => { sh(rbox(.08, .95, 2.1, M.blanket, x, 2.86, -.35, body, .03)); box(.09, .1, 2.1, M.impY, x, 2.42, -.35, body); });
  P.basket = new T.Group(); P.basket.position.set(0, 3.38, -.72); body.add(P.basket);
  sh(rbox(2.4, .1, 2.3, M.woodL, 0, 0, 0, P.basket, .03)); [1.15, -1.15].forEach(z => box(2.4, .3, .06, M.woodL, 0, .2, z, P.basket)); [1.2, -1.2].forEach(x => box(.06, .3, 2.3, M.woodL, x, .2, 0, P.basket));
  const driver = makeFarmer(.3); driver.position.set(0, 3.32, .85); body.add(driver);
  scene.add(v);
  return { g:v, inner:v, P, wheels:[], steerNodes:[], driver, x:0, z:0, h:0, v:0, steer:0, rpm:0, walk:0, stepN:0, grab:0,
    maxF:5.4, maxR:2.0, turnK:.5, turnRate:2.2, radius:2.4, eye:new T.Vector3(0, 4.5, .3), look:new T.Vector3(0, 3.5, 9),
    chase:[13.5, 7.5], lookY:2.4, dust:[[.62, .95], [-.62, -1.05]] };
}
