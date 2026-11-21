'use strict';
function planeBody(col) {
  const out = new T.Group(), g = new T.Group(), W = pho(0xf4f4f0), R = pho(col), D = pho(0x1b2f55, { roughness:.1 });
  ell(.75, .8, 3.3, W, 0, 0, 0, g); ell(.62, .62, .8, R, 0, 0, 2.9, g); ell(.6, .5, 1.1, D, 0, .48, .7, g); box(11, .14, 1.6, W, 0, .9, .6, g);
  [-1, 1].forEach(s => { box(1.1, .16, 1.62, R, s*5, .9, .6, g); const st = box(.07, 1.3, .12, M.steel, s*1.6, .3, .7, g); st.rotation.z = s*.9; cylX(.26, .14, M.dark, s*.9, -1.05, 1, g, 10); box(.07, .6, .07, M.steel, s*.9, -.75, 1, g); });
  box(3.8, .1, .9, W, 0, .2, -3, g); box(.1, 1.4, 1, R, 0, .85, -3, g); box(.9, .08, .3, R, 0, .9, -3.2, g); cylX(.12, .1, M.dark, 0, -.75, -2.9, g, 8);
  out.add(bake(g)); out.userData.prop = box(.14, 2.6, .06, M.dark, 0, 0, 3.55, out); return out;
}
function buildPlane() {
  const car = mkAuto({ eye:new T.Vector3(0, 2.1, 1.2), look:new T.Vector3(0, 1.6, 12), chase:[13, 5.2], lookY:2, lamp:new T.Vector3(0, 1.3, 3.6) }), pb = planeBody(0xf7c81a); pb.position.y = 1.31; car.inner.add(pb); car.prop = pb.userData.prop; car.driver = new T.Group(); return car;
}
