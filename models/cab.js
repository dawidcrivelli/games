// Taksówka i radiowóz: carFace (światła, zderzaki, atrapa, tablice), buildTaxi, buildPolice.
// wymaga: models/cars.js, lib/3d/shapes.js, models/people.js; od gry: paleta M
'use strict';
function carFace(g, w, zf, zr, y) {                // światła, zderzaki, atrapa, tablice
  [-1, 1].forEach(s => { rbox(.36, .16, .08, M.chrome, s*(w/2 - .3), y, zf, g, .04); box(.28, .1, .04, M.lamp, s*(w/2 - .3), y, zf + .045, g); box(.1, .1, .04, LAMPO, s*(w/2 - .08), y, zf + .02, g);
    rbox(.34, .14, .06, M.red, s*(w/2 - .28), y + .06, zr, g, .03); });
  box(w*.42, .13, .05, PLA, 0, y, zf + .02, g); for (let k = -2; k <= 2; k++) box(.02, .11, .02, M.chrome, k*w*.07, y, zf + .05, g);
  rbox(w + .2, .18, .3, PLA, 0, y - .33, zf + .04, g, .05); rbox(w + .2, .18, .3, PLA, 0, y - .33, zr - .04, g, .05);
  box(.5, .12, .02, M.white, 0, y - .33, zf + .2, g); box(.52, .13, .03, M.uPlate, 0, y - .14, zr - .11, g); box(.58, .19, .02, PLA, 0, y - .14, zr - .09, g);
}
function buildTaxi() {
  const car = mkAuto({ eye:new T.Vector3(.4, 1.45, -.28), look:new T.Vector3(.35, 1.31, 8), chase:[8.6, 3.9], lookY:1.3, lamp:new T.Vector3(0, .8, 2.3) }), b = new T.Group(), Y = paint(0xf7c81a), w = 1.86;
  const chk = lam(0xffffff, { map:tex(64, 16, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#1c1c1e' : '#f5f5f0'; g.fillRect(k*8, 0, 8, 8); g.fillStyle = k % 2 ? '#f5f5f0' : '#1c1c1e'; g.fillRect(k*8, 8, 8, 8); } }, 3, 1) });
  mesh(profGeo([[2.12, .62], [2.06, .85], [1.1, 1], [.9, 1.04], [-1.44, 1.04], [-2, .99], [-2.14, .62]], .34, w, .08, [[-1.35, .43], [1.4, .43]]), Y, 0, 0, 0, b);
  rbox(1.58, .09, 1.72, Y, 0, 1.69, -.36, b, .045);
  [-1, 1].forEach(s => { pane([.9, 1.04], [.48, 1.66], .06, .07, Y, b, s*.76); pane([-1.44, 1.04], [-1.18, 1.66], .09, .09, Y, b, s*.75); box(.08, .64, .09, Y, s*.76, 1.36, -.3, b);
    sideWin([[.84, 1.06], [.5, 1.63], [-1.2, 1.63], [-1.4, 1.06]], s*.78, GLT, b); box(.014, .15, 3.1, chk, s*(w/2 + .005), .86, 0, b); });
  pane([.92, 1.05], [.5, 1.66], 1.42, .03, GLT, b); pane([-1.46, 1.05], [-1.2, 1.66], 1.42, .03, GLT, b);
  box(.74, .22, .26, signMat('TAXI', '#f7c81a', '#1c1c1e'), 0, 1.86, -.3, b); box(.78, .03, .3, PLA, 0, 1.985, -.3, b); [-1, 1].forEach(s => box(.03, .24, .3, PLA, s*.385, 1.86, -.3, b)); cylY(.012, .5, M.dark, .6, 1.95, -1, b, 4);
  carFace(b, w, 2.14, -2.16, .8); carSides(b, w, [-.3, .78], .82);
  box(1.56, .24, .3, M.dark, 0, 1.13, .6, b); box(.34, .1, .02, M.screen, -.2, 1.2, .44, b);
  [-.4, .4].forEach(x => { box(.5, .14, .5, M.seat, x, .98, -.3, b); box(.5, .5, .12, M.seat, x, 1.24, -.58, b); box(.24, .14, .1, M.seat, x, 1.56, -.58, b); }); box(1.4, .5, .14, M.seat, 0, 1.24, -1.12, b);
  car.inner.add(bake(b)); autoWheels(car, autoWheelTpl(.36, .25, M.steelL), .36, 1.62, [1.4, -1.35]); autoSW(car, .16, .4, 1.19, .42, -1.15);
  const d = makeFarmer(.7); d.scale.setScalar(.72); d.position.set(.4, 1.02, -.3); car.inner.add(d); car.driver = d;
  return car;
}
function buildPolice() {
  const car = mkAuto({ eye:new T.Vector3(.4, 1.45, -.28), look:new T.Vector3(.35, 1.31, 8), chase:[8.6, 3.9], lookY:1.3, lamp:new T.Vector3(0, .8, 2.3) }), b = new T.Group(), W = paint(0xf2f4f6), Bl = paint(0x1f4fb0), w = 1.86, sg = signMat('POLICJA', '#1f4fb0', '#fff');
  mesh(profGeo([[2.12, .62], [2.06, .85], [1.1, 1], [.9, 1.04], [-1.44, 1.04], [-2, .99], [-2.14, .62]], .34, w, .08, [[-1.35, .43], [1.4, .43]]), W, 0, 0, 0, b); rbox(1.58, .09, 1.72, W, 0, 1.69, -.36, b, .045);
  [-1, 1].forEach(s => { pane([.9, 1.04], [.48, 1.66], .06, .07, W, b, s*.76); pane([-1.44, 1.04], [-1.18, 1.66], .09, .09, W, b, s*.75); box(.08, .64, .09, W, s*.76, 1.36, -.3, b);
    sideWin([[.84, 1.06], [.5, 1.63], [-1.2, 1.63], [-1.4, 1.06]], s*.78, GLT, b); box(.014, .24, 3.9, Bl, s*(w/2 + .09), .8, 0, b); box(.016, .2, 1.25, sg, s*(w/2 + .1), .8, -.25, b); });
  pane([.92, 1.05], [.5, 1.66], 1.42, .03, GLT, b); pane([-1.46, 1.05], [-1.2, 1.66], 1.42, .03, GLT, b); box(1.5, .06, 1.1, Bl, 0, 1.03, 1.55, b);
  box(1.3, .1, .34, M.dark, 0, 1.79, -.3, b); cylY(.012, .7, M.dark, -.6, 2.05, -1, b, 4);
  carFace(b, w, 2.14, -2.16, .8); carSides(b, w, [-.3, .78], .82); box(1.56, .24, .3, M.dark, 0, 1.13, .6, b); box(.34, .1, .02, M.screen, -.2, 1.2, .44, b);
  [-.4, .4].forEach(x => { box(.5, .14, .5, M.seat, x, .98, -.3, b); box(.5, .5, .12, M.seat, x, 1.24, -.58, b); box(.24, .14, .1, M.seat, x, 1.56, -.58, b); }); box(1.4, .5, .14, M.seat, 0, 1.24, -1.12, b);
  car.inner.add(bake(b)); autoWheels(car, autoWheelTpl(.36, .25, M.steelL), .36, 1.62, [1.4, -1.35]); autoSW(car, .16, .4, 1.19, .42, -1.15);
  car.lights = [0xff2a1a, 0x2a6bff].map((c, i) => rbox(.52, .2, .3, new T.MeshBasicMaterial({ color:c }), (i ? .34 : -.34), 1.92, -.3, car.inner, .06));
  const d = makeFarmer(.7); d.scale.setScalar(.72); d.position.set(.4, 1.02, -.3); car.inner.add(d); car.driver = d; return car;
}
