'use strict';
function buildKombajn() {
  const g = new T.Group(), C = pho(0xf1ede0), Bl = pho(0x2f6fb0), R = pho(0xd8301f), out = new T.Group();
  rbox(2.9, 2.0, 4.6, C, 0, 2.3, -.5, g, .15); box(2.94, .34, 4.64, Bl, 0, 1.7, -.5, g); rbox(1.5, 1.5, 1.4, C, -.6, 3.05, 1.9, g, .1); box(1.3, .9, .05, GLD, -.6, 3.2, 2.62, g);
  [-1, 1].forEach(s => { box(.05, .9, 1.1, GLD, -.6 + s*.76, 3.2, 1.95, g); cylX(.95, .7, M.tire, s*1.55, .95, 1.3, g, 18); cylX(.5, .2, C, s*1.92, .95, 1.3, g, 12); cylX(.5, .4, M.tire, s*1.2, .5, -2.2, g, 14); });
  box(1.4, .6, 1.8, C, 0, 1.25, 2.5, g); box(5.6, .55, 1.3, R, 0, .7, 3.7, g); box(5.6, .9, .1, R, 0, 1.1, 3.1, g); const a = cylZ(.17, 3.4, C, 1.25, 3.55, -1.3, g, 10); a.rotation.z = .2;
  const hd = box(2.5, 1.2, 1.5, C, 0, 1.9, -3.2, g); hd.rotation.x = -.5; cylY(.08, .9, M.dark, .9, 3.7, .6, g, 8); box(1.2, .25, .04, sgn('BIZON', '#2f6fb0', '#fff'), 1.48, 2.6, -.5, g).rotation.y = Math.PI/2;
  const d = makeFarmer(.7); d.scale.setScalar(.8); d.position.set(-.6, 2.75, 1.75); g.add(d);
  out.add(vc(g)); const reel = new T.Group(); cylX(.07, 5.4, M.steel, 0, 0, 0, reel, 6); for (let i = 0; i < 6; i++) { const a2 = i/6*6.283; box(5.3, .07, .07, C, 0, Math.cos(a2)*.72, Math.sin(a2)*.72, reel); }
  [-2.65, 2.65].forEach(x => cylX(.74, .05, R, x, 0, 0, reel, 12)); const rb = vc(reel); rb.position.set(0, 1.45, 4.1); out.add(rb); out.userData.reel = rb; return out;
}
