'use strict';
function mkAuto(o) { const g = new T.Group(), inner = new T.Group(); g.add(inner); g.visible = false; scene.add(g);
  return Object.assign({ g, inner, wheels:[], steerNodes:[], x:0, z:0, h:0, v:0, steer:0 }, AUTO_CAM, o); }
function autoWheels(car, tpl, r, track, zs) { zs.forEach((z, n) => [-1, 1].forEach(s => { const pv = new T.Group(), w = cloneTpl(tpl, true); pv.position.set(s*track/2, r, z); pv.add(w); car.inner.add(pv);
  car.wheels.push({ n:w, r }); if (!n) car.steerNodes.push({ n:pv, s:1 }); })); }
function autoSW(car, r, x, y, z, tilt) { const p = new T.Group(), sw = makeSteeringWheel(r); p.position.set(x, y, z); p.rotation.x = tilt; p.add(sw); car.inner.add(p); car.sw = sw; }
const paint = c => pho(c, { roughness:.2, metalness:.4, envMapIntensity:1.1 });
function profGeo(top, yb, w, bev, arch) {          // top: punkty [z, y] od przodu do tyłu; arch: [środek z, promień] od tyłu do przodu
  const s = new T.Shape(); s.moveTo(top[0][0], yb); top.forEach(p => s.lineTo(p[0], p[1])); s.lineTo(top[top.length - 1][0], yb);
  (arch || []).forEach(a => { s.lineTo(a[0] - a[1], yb); s.absarc(a[0], yb, a[1], Math.PI, 0, true); }); s.lineTo(top[0][0], yb);
  const g = new T.ExtrudeGeometry(s, { depth:w - 2*bev, bevelEnabled:true, bevelThickness:bev, bevelSize:bev, bevelSegments:2, curveSegments:8 }); g.translate(0, 0, -(w - 2*bev)/2); g.rotateY(-Math.PI/2); return g;
}
function pane(p, q, w, th, mat, parent, x) {       // pochyła szyba albo słupek między punktami [z, y]
  const dz = q[0] - p[0], dy = q[1] - p[1], m = box(w, Math.hypot(dz, dy), th, mat, x || 0, (p[1] + q[1])/2, (p[0] + q[0])/2, parent); m.rotation.x = Math.atan2(dz, dy); return m;
}
function sideWin(pts, x, mat, parent) { const s = new T.Shape(); pts.forEach((p, i) => { if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]); }); const g = new T.ShapeGeometry(s); g.rotateY(-Math.PI/2); return mesh(g, mat, x, 0, 0, parent); }
function autoWheelTpl(r, w, rim, ring) {
  const g = new T.Group(); cylX(r, w*.72, M.tire, 0, 0, 0, g, 22); cylX(r*.93, w, M.tire, 0, 0, 0, g, 22); cylX(r*.66, w + .02, M.dark, 0, 0, 0, g, 16);
  if (ring) cylX(r*.7, w + .012, ring, 0, 0, 0, g, 18);
  for (let i = 0; i < 5; i++) { const a = i/5*Math.PI*2, s = box(w + .05, r*.56, r*.15, rim, 0, Math.cos(a)*r*.34, Math.sin(a)*r*.34, g); s.rotation.x = a; }
  cylX(r*.2, w + .08, rim, 0, 0, 0, g, 10); cylX(r*.09, w + .11, M.dark, 0, 0, 0, g, 8); return bake(g);
}
function carSides(g, w, seams, y) { [-1, 1].forEach(s => { seams.forEach(z => { box(.012, .56, .02, PLA, s*(w/2 + .004), y, z, g); box(.03, .03, .13, M.chrome, s*(w/2 + .01), y + .2, z - .16, g); });
  box(.14, .1, .07, PLA, s*(w/2 + .09), y + .27, seams[0] + .95, g); }); }
function aiModel(col, kind) {                      // 0 sedan, 1 kombi, 2 furgonetka, 3 autobus
  const g = new T.Group(), P = paint(col);
  if (!TPL_W.car) { TPL_W.car = autoWheelTpl(.36, .24, M.steelL); TPL_W.bus = autoWheelTpl(.5, .32, M.cream); }
  const wheels = (tp, r, x, zs) => zs.forEach(z => [-1, 1].forEach(s => { const q = cloneTpl(tp); q.position.set(s*x, r, z); g.add(q); }));
  if (kind === 3) { const w = 2.36;
    mesh(profGeo([[3.82, .7], [3.82, 1.9], [3.55, 2.78], [3.3, 2.86], [-3.7, 2.86], [-3.82, 2.7], [-3.82, .7]], .42, w, .1, [[-2.3, .56], [2.5, .56]]), P, 0, 0, 0, g);
    [-1, 1].forEach(s => { sideWin([[3.4, 1.55], [3.2, 2.55], [-3.5, 2.55], [-3.5, 1.55]], s*(w/2 + .004), GLD, g); box(.012, .1, 7.4, M.cream, s*(w/2 + .006), 1.4, 0, g); for (let z = -2.6; z < 3; z += 1.15) box(.016, 1, .07, P, s*(w/2 + .008), 2.05, z, g); });
    pane([3.84, 1.5], [3.6, 2.6], 2.1, .03, GLD, g); box(1.5, .2, .04, signMat('ZOO', '#1c1c1e', '#f2c230'), 0, 2.74, 3.62, g); box(2.1, .9, .03, GLD, 0, 2.1, -3.84, g);
    carFace(g, w, 3.86, -3.86, .95); box(1.3, .3, .3, M.cRoof, 0, 3, -1.5, g); wheels(TPL_W.bus, .5, w/2 - .16, [2.5, -2.3]); return bake(g); }
  const D = [
    { w:1.82, top:[[2.08, .62], [2.02, .84], [1.05, .98], [.5, 1.43], [-.72, 1.45], [-1.32, 1.03], [-2, .99], [-2.1, .62]], ws:[[1.0, 1.01], [.5, 1.41]], rw:[[-.76, 1.43], [-1.3, 1.05]], win:[[[.88, 1.05], [.44, 1.39], [-.2, 1.39], [-.2, 1.05]], [[-.3, 1.05], [-.3, 1.39], [-.7, 1.39], [-1.18, 1.05]]], seam:[-.25] },
    { w:1.8, top:[[2, .62], [1.94, .86], [1.08, 1], [.6, 1.47], [-1.5, 1.5], [-1.95, 1.04], [-2.02, .62]], ws:[[1.03, 1.03], [.6, 1.45]], rw:[[-1.54, 1.48], [-1.93, 1.08]], win:[[[.92, 1.07], [.54, 1.42], [-.15, 1.43], [-.15, 1.07]], [[-.25, 1.07], [-.25, 1.43], [-1.42, 1.44], [-1.72, 1.07]]], seam:[-.2] },
    { w:1.96, top:[[2.14, .62], [2.1, 1.02], [1.7, 1.16], [1.3, 1.93], [1.1, 1.98], [-2.1, 1.98], [-2.2, 1.9], [-2.2, .62]], ws:[[1.66, 1.2], [1.32, 1.9]], rw:null, win:[[[1.52, 1.22], [1.22, 1.86], [.55, 1.86], [.55, 1.22]]], seam:[.45] } ][kind], w = D.w;
  mesh(profGeo(D.top, .34, w, .08, [[-1.3, .43], [1.3, .43]]), P, 0, 0, 0, g);
  [-1, 1].forEach(s => D.win.forEach(q => sideWin(q, s*(w/2 + .004), GLD, g)));
  pane(D.ws[0], D.ws[1], w - .28, .03, GLD, g).position.y += .02; if (D.rw) pane(D.rw[0], D.rw[1], w - .28, .03, GLD, g).position.y += .02;
  if (kind === 2) [-1, 1].forEach(s => box(.012, .3, 2.4, M.white, s*(w/2 + .005), 1.35, -.9, g));
  carFace(g, w, D.top[0][0] + .02, D.top[D.top.length - 1][0] - .02, .8); carSides(g, w, D.seam, .82); wheels(TPL_W.car, .36, w/2 - .13, [1.3, -1.3]);
  return bake(g);
}
function buildBus() {
  const car = mkAuto({ eye:new T.Vector3(.62, 2.34, 3.05), look:new T.Vector3(.5, 2.12, 12), chase:[13.5, 6.2], lookY:2, lamp:new T.Vector3(0, 1, 4.2) }), b = new T.Group(), R = paint(0xd8452f), C = pho(0xf4ecd6, { roughness:.3 }), w = 2.4;
  mesh(profGeo([[4.12, .62], [4.1, 1.5], [-4.1, 1.5], [-4.12, .62]], .44, w, .09, [[-2.5, .57], [2.7, .57]]), R, 0, 0, 0, b);
  rbox(2.38, .16, 8.16, C, 0, 2.9, 0, b, .08); rbox(1.3, .26, 2, M.cRoof, 0, 3.08, -1.6, b, .08); [1.2, 2.8].forEach(z => rbox(.8, .08, .7, M.cRoof, 0, 3, z, b, .03));
  [-1, 1].forEach(s => { for (let z = -3.95; z <= 4; z += 1.32) box(.1, 1.36, .1, C, s*1.13, 2.18, z, b);
    sideWin([[4, 1.52], [4, 2.82], [-4, 2.82], [-4, 1.52]], s*1.16, GLT, b); box(.014, .13, 8.1, C, s*(w/2 + .006), 1.38, 0, b); box(.014, .06, 8.1, C, s*(w/2 + .006), .8, 0, b);
    box(.06, .5, .06, PLA, s*1.32, 2.5, 4.02, b); box(.05, .36, .2, PLA, s*1.4, 2.3, 4.02, b); });
  [3, -.7].forEach(z => { box(.02, 1.9, .06, PLA, -(w/2 + .008), 1.6, z + .55, b); box(.02, 1.9, .06, PLA, -(w/2 + .008), 1.6, z - .55, b); box(.02, .06, 1.1, PLA, -(w/2 + .008), 2.56, z, b); box(.02, 1.9, .03, PLA, -(w/2 + .008), 1.6, z, b); });   // drzwi po prawej
  [4.04, -4.04].forEach(z => box(2.2, 1.3, .03, GLT, 0, 2.18, z, b));
  box(1.7, .24, .06, signMat('CIUCHCIOWO', '#1c1c1e', '#f2c230'), 0, 2.76, 4.1, b); [-.5, .5].forEach(x => { const wp = box(.03, .7, .03, PLA, x, 1.86, 4.07, b); wp.rotation.z = .5; });
  carFace(b, w, 4.13, -4.13, 1); box(1.5, .5, .04, PLA, 0, 1.1, -4.15, b);
  box(2.2, .3, .42, M.dark, 0, 1.66, 3.62, b); box(.5, .2, .03, M.screen, .1, 1.82, 3.44, b); box(.6, .14, .5, M.seat, .62, 1.62, 2.9, b); box(.6, .6, .12, M.seat, .62, 1.95, 2.62, b);
  for (let r = 0; r < 4; r++) [-.68, .68].forEach(x => { box(.8, .12, .5, M.seatB, x, 1.6, 1.5 - r*1.3, b); box(.8, .6, .1, M.seatB, x, 1.94, 1.26 - r*1.3, b); });
  for (let z = -3; z <= 2; z += 1.6) cylY(.03, 1.3, M.cYel, 0, 2.2, z, b, 6);
  car.inner.add(bake(b)); autoWheels(car, autoWheelTpl(.52, .34, M.cream), .52, 2.04, [2.7, -2.5]); autoSW(car, .27, .62, 1.98, 3.36, -.7);
  const d = makeFarmer(.75); d.scale.setScalar(.85); d.position.set(.62, 1.76, 2.88); car.inner.add(d); car.driver = d;
  return car;
}
function buildRacer() {
  const car = mkAuto({ eye:new T.Vector3(0, 1.1, -.5), look:new T.Vector3(0, .96, 8), chase:[7.6, 3.1], lookY:1, lamp:new T.Vector3(0, .5, 2.6) }), b = new T.Group(), R = paint(0xe0261c), W = M.white, K = pho(0x17181b, { roughness:.35, metalness:.5 });
  mesh(profGeo([[2.78, .36], [2.74, .45], [1.5, .6], [.42, .77], [.26, .77], [.2, .6], [-.74, .6], [-.82, 1.17], [-1.02, 1.17], [-2, .62], [-2.06, .36]], .3, .64, .1), R, 0, 0, 0, b);
  box(1.5, .05, 3.3, K, 0, .25, -.35, b); box(.5, .22, .04, K, 0, 1, -.82, b);
  [-1, 1].forEach(s => { rbox(.54, .38, 1.55, R, s*.6, .5, -.62, b, .15); box(.36, .24, .04, K, s*.6, .52, .17, b);
    box(.05, .34, .56, R, s*.98, .42, 2.6, b); box(.05, .66, .6, R, s*.86, .98, -1.9, b); box(.08, .5, .08, K, s*.26, .9, -1.82, b);
    [1.55, 1.75].forEach((z, k) => { const a = cylX(.022, .62, K, s*.6, .38 + k*.16, z - k*.25, b, 5); a.rotation.y = s*.2; }); cylX(.022, .5, K, s*.62, .4, -1.3, b, 5);
    box(.12, .08, .06, R, s*.44, .9, .2, b); cylZ(.06, .4, M.chrome, s*.2, .6, -2.05, b, 8); });
  box(1.96, .05, .46, W, 0, .27, 2.62, b); const fl = box(1.9, .04, .26, R, 0, .38, 2.5, b); fl.rotation.x = -.3;
  box(1.74, .06, .46, W, 0, 1.26, -1.92, b); const rf = box(1.7, .05, .3, R, 0, 1.12, -1.84, b); rf.rotation.x = -.25;
  cylY(.26, .02, W, 0, .69, 1.05, b, 18).rotation.x = .13; box(.1, .02, 1.5, W, 0, .56, 1.9, b).rotation.x = .12;
  const halo = mesh(new T.TorusGeometry(.36, .04, 6, 14, Math.PI), K, 0, .92, -.28, b); halo.rotation.x = -Math.PI/2 + .25;
  car.inner.add(bake(b)); autoWheels(car, autoWheelTpl(.4, .42, M.brass, M.lRed), .4, 1.8, [1.55, -1.3]); autoSW(car, .12, 0, .9, .3, -1.25);
  const d = new T.Group(); mesh(new T.SphereGeometry(.2, 14, 10), M.cYel, 0, 1.04, -.5, d); box(.3, .1, .08, K, 0, 1.06, -.33, d); box(.46, .3, .3, R, 0, .78, -.52, d); car.inner.add(d); car.driver = d;
  return car;
}
