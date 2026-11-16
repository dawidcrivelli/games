// zwierzeta — pojazdy w żniwach: modele z Pralni (ZOO) + siedzisko i kierowca
// wymaga z gry: M, T, scene, rbox, box, makeFarmer
'use strict';
// Grupa w układzie pojazdu, przyczepiona do tułowia (kołysze się z nim); top = grzbiet {y, z}
function saddle(v, a) {
  v.updateMatrixWorld(true);
  const s = new T.Group(), b = new T.Box3().setFromObject(a.body.children[0]);
  s.applyMatrix4(a.body.matrixWorld.clone().invert()); a.body.add(s);
  return { s, top:{ y:b.max.y, z:(b.min.z + b.max.z)/2 } };
}
function rideAnimal(type, h) {
  const { g:v, a } = ZOO.fit(type, h); scene.add(v);
  return { g:v, inner:v, a, wheels:[], steerNodes:[], x:0, z:0, h:0, v:0, steer:0, rpm:0, walk:0, stepN:0, maxR:2.2, turnK:.5 };
}
function buildGiraffe() {
  const G = rideAnimal('giraffe', 5.6), { s, top } = saddle(G.g, G.a);
  rbox(.9, .08, 1.0, M.blanket, 0, top.y - .04, top.z, s, .03);
  const driver = makeFarmer(.2); driver.position.set(0, top.y - .02, top.z); s.add(driver);
  return Object.assign(G, { P:{ basket:s }, driver, eat:0, chew:0, lastCrunch:0, maxF:5.7, turnRate:2.4, radius:1.9, yaw:0, ta:0, td:3, tx:0, tz:0,
    eye:new T.Vector3(0, top.y + .7, top.z - .15), look:new T.Vector3(0, 3.3, 8), chase:[11.5, 7], lookY:2.6, dust:[[.33, .85], [-.33, -.9]],
    baleFrom:new T.Vector3(0, 2.2, -1.5), baleTo:new T.Vector3(0, .32, -3) });
}
function buildElephant() {
  const E = rideAnimal('elephant', 3.6), { s, top } = saddle(E.g, E.a), y = top.y, z = top.z;
  // derka i kosz na słomę
  rbox(2.0, .1, 2.3, M.blanket, 0, y - .05, z - .35, s, .05);
  [1.1, -1.1].forEach(x => { rbox(.08, .95, 2.1, M.blanket, x, y - .49, z - .35, s, .03); box(.09, .1, 2.1, M.impY, x, y - .93, z - .35, s); });
  const basket = new T.Group(); basket.position.set(0, y + .03, z - .72); s.add(basket);
  rbox(2.4, .1, 2.3, M.woodL, 0, 0, 0, basket, .03); [1.15, -1.15].forEach(q => box(2.4, .3, .06, M.woodL, 0, .2, q, basket)); [1.2, -1.2].forEach(x => box(.06, .3, 2.3, M.woodL, x, .2, 0, basket));
  const driver = makeFarmer(.3); driver.position.set(0, y - .03, z + 1.2); s.add(driver);
  return Object.assign(E, { P:{ basket }, driver, grab:0, maxF:5.4, maxR:2.0, turnRate:2.2, radius:2.4,
    eye:new T.Vector3(0, y + 1.15, z + 1.4), look:new T.Vector3(0, 3.5, 9), chase:[13.5, 7.5], lookY:2.4, dust:[[.62, .95], [-.62, -1.05]] });
}
