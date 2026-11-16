// rafa — wspólne dla: rafa
// wymaga z gry: C, M, T, TAU, UP, V3, _m4, _q, ball, merge, mix3, mul3, sweep
'use strict';
function branchGeo(o) {
  const parts = [];
  (function br(p, d, len, rad, lv) {
    const g = new T.CylinderGeometry(lv >= o.depth && !o.tips ? rad*.25 : rad*.66, rad, len, 5, 1, true); g.translate(0, len/2, 0);
    g.applyMatrix4(_m4.makeRotationFromQuaternion(_q.setFromUnitVectors(UP, d))); g.translate(p.x, p.y, p.z); parts.push(g);
    const e = p.clone().addScaledVector(d, len);
    if (lv >= o.depth) { if (o.tips) parts.push(tf(new T.IcosahedronGeometry(rad*o.tips, 0), e.x, e.y, e.z, rnd(), rnd(), 0)); return; }
    const n = lv === 0 ? o.kids + 1 : o.kids;
    for (let k = 0; k < n; k++) br(e, d.clone().add(new V3(rr(-1, 1), rr(.15, .9), rr(-1, 1)).multiplyScalar(o.spread)).normalize(), len*rr(.66, .86), rad*.7, lv + 1);
  })(new V3(), new V3(0, 1, 0), o.len, o.rad, 0);
  const g = merge(parts); g.computeBoundingBox(); const H = g.boundingBox.max.y;
  return setCol(g, (x, y) => { const s = .5 + .85*Math.pow(clamp(y/H, 0, 1), 1.4); return [s, s, s]; });
}
function brainGeo() { const g = new T.SphereGeometry(1, 14, 9), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + .16*(vnoise(x*2 + 3, z*2 + y*2) - .5); p.setXYZ(i, x*k, y*.74*k + .42, z*k); }
  g.computeVertexNormals(); return setCol(g, (x, y) => { const s = .62 + .5*clamp(y, 0, 1); return [s, s, s]; }); }
function tableGeo() { const parts = [tf(new T.CylinderGeometry(.16, .3, .7, 6, 1, true), 0, .35, 0)];
  for (const [r, y, ox] of [[1, .72, 0], [.6, .98, .22]]) { const g = new T.CylinderGeometry(r, r*.3, .16, 20, 1), p = g.attributes.position, a0 = rr(0, 9);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), rad = Math.hypot(x, z), k = 1 + .2*Math.sin(a*3 + a0) + .08*Math.sin(a*7 + a0);
      p.setXYZ(i, x*k + ox, p.getY(i) + y + rad*.1*Math.sin(a*2 + a0), z*k); }
    g.computeVertexNormals(); parts.push(g); }
  return setCol(merge(parts), (x, y, z) => { const s = .5 + .65*sstep(.2, 1.1, Math.hypot(x, z)) + (y > .9 ? .1 : 0); return [s, s, s]; }); }
function tubesGeo() { const parts = [], n = 5;
  for (let i = 0; i < n; i++) { const r = rr(.13, .2), h = rr(.6, 1.35), a = i/n*TAU + rr(-.3, .3), d = i === 0 ? 0 : rr(.2, .38);
    const g = new T.LatheGeometry([new T.Vector2(r*.7, 0), new T.Vector2(r, h*.5), new T.Vector2(r*1.08, h), new T.Vector2(r*.8, h), new T.Vector2(r*.7, h*.35)], 6);
    setCol(g, (x, y) => { const s = .5 + .8*Math.pow(y/h, 1.5); return Math.hypot(x, 0) < 0 ? [s, s, s] : [s, s, s]; });
    parts.push(tf(g, Math.cos(a)*d, 0, Math.sin(a)*d, Math.sin(a)*d*.9, 0, -Math.cos(a)*d*.9)); }
  return merge(parts); }
function platesGeo() { const parts = [];
  for (let i = 0; i < 4; i++) { const r = rr(.6, 1) - i*.08, g = new T.CylinderGeometry(r, r*.72, .07, 12, 1), p = g.attributes.position, a0 = rr(0, 9);
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), z = p.getZ(k), a = Math.atan2(z, x), rad = Math.hypot(x, z)/r; p.setY(k, p.getY(k) + rad*rad*(.16 + .1*Math.sin(a*4 + a0))); }
    g.computeVertexNormals(); setCol(g, (x, y, z) => { const s = .5 + .75*sstep(.25*r, r, Math.hypot(x, z)); return [s, s, s]; });
    const a = i*2.2; parts.push(tf(g, Math.cos(a)*.28, .15 + i*.2, Math.sin(a)*.28, rr(-.15, .15), 0, rr(-.15, .15))); }
  return merge(parts); }
function pillarsGeo() { const parts = [];
  for (let i = 0; i < 6; i++) { const r = rr(.11, .19), h = rr(.7, 2.0), a = rnd()*TAU, d = i === 0 ? 0 : rr(.15, .5);
    const c = merge([tf(new T.CylinderGeometry(r*.85, r, h, 6, 1, true), 0, h/2, 0), tf(new T.SphereGeometry(r*.85, 6, 3, 0, TAU, 0, Math.PI/2), 0, h, 0)]);
    setCol(c, (x, y) => { const s = .5 + .7*Math.pow(y/(h + r), 2); return [s, s, s]; });
    parts.push(tf(c, Math.cos(a)*d, 0, Math.sin(a)*d, rr(-.12, .12), 0, rr(-.12, .12))); }
  return merge(parts); }
function anemoneGeo() { const parts = [setCol(tf(new T.CylinderGeometry(.5, .62, .4, 10, 1), 0, .2, 0), [.42, .3, .34])];
  for (let i = 0; i < 52; i++) { const a = i*2.39996, d = Math.sqrt((i + .5)/52)*.5, h = rr(.55, .85);
    const g = tf(new T.CylinderGeometry(.03, .058, h, 4, 1, true), 0, h/2, 0).toNonIndexed();
    setCol(g, (x, y) => { const s = y > h - .06 ? 1.9 : .55 + .6*y/h; return [s, s, s]; });
    parts.push(tf(g, Math.cos(a)*d, .36, Math.sin(a)*d, Math.sin(a)*d*1.3, 0, -Math.cos(a)*d*1.3)); }
  return merge(parts); }
function kelpGeo() { const parts = [];
  for (let i = 0; i < 4; i++) { const h = rr(2.2, 3.8), g = new T.PlaneGeometry(.24, h, 1, 8), p = g.attributes.position; g.translate(0, h/2, 0);
    for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setX(k, p.getX(k)*(1 - .6*y/h) + Math.sin(y*1.8 + i)*.12); p.setZ(k, Math.cos(y*1.4 + i*2)*.1); }
    g.computeVertexNormals(); setCol(g, (x, y) => mix3([.1, .42, .12], [.55, 1.0, .25], y/h));
    parts.push(tf(g, rr(-.25, .25), 0, rr(-.25, .25), 0, rnd()*TAU, 0)); }
  return merge(parts); }
function grassGeo() { const parts = [];
  for (let i = 0; i < 3; i++) { const h = rr(.5, .95), g = new T.PlaneGeometry(.07, h, 1, 2); g.translate(0, h/2, 0); setCol(g, (x, y) => mix3([.12, .5, .2], [.5, .95, .35], y/h));
    parts.push(tf(g, rr(-.12, .12), 0, rr(-.12, .12), rr(-.2, .2), rnd()*TAU, rr(-.2, .2))); }
  return merge(parts); }
function nubGeo() { const parts = [];
  for (let i = 0; i < 3; i++) { const r = rr(.14, .26), a = rnd()*TAU, d = i ? rr(.15, .4) : 0; parts.push(tf(new T.IcosahedronGeometry(r, 0), Math.cos(a)*d, r*.6, Math.sin(a)*d, rnd(), rnd(), 0, 1, rr(.7, 1.3), 1)); }
  return setCol(merge(parts), (x, y) => { const s = .6 + 1.6*y; return [s, s, s]; }); }
function rockGeo() { const g = new T.IcosahedronGeometry(1, 1), p = g.attributes.position, s0 = rr(0, 50);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = .75 + .5*vnoise(x*1.7 + s0, z*1.7 + y*1.3); p.setXYZ(i, x*k, y*k*.7 + .2, z*k); }
  g.computeVertexNormals(); return setCol(g, (x, y, z) => { const s = .55 + .5*vnoise(x*3 + s0, z*3 + y*2); return [s, s*.95, s]; }); }
function urchinGeo() { const parts = [ball(.22, [.5, .4, .55], 0, .2, 0, 8, 6)];
  for (let i = 0; i < 30; i++) { const y = 1 - (i + .5)/30*1.5, r = Math.sqrt(Math.max(0, 1 - y*y)), a = i*2.39996, d = new V3(Math.cos(a)*r, y, Math.sin(a)*r);
    const g = new T.ConeGeometry(.022, .55, 3, 1, true); g.translate(0, .42, 0); setCol(g, (x, yy) => { const s = .6 + 1.2*yy; return [s, s, s]; });
    g.applyMatrix4(_m4.makeRotationFromQuaternion(_q.setFromUnitVectors(UP, d))); g.translate(0, .2, 0); parts.push(g); }
  return merge(parts); }
function clamGeo() {
  const sh = new T.SphereGeometry(1, 20, 8, 0, TAU, Math.PI/2, Math.PI/2), p = sh.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), rim = 1 + y; p.setXYZ(i, x*(1 + .07*Math.sin(a*10)*rim), y*.62 + .1*Math.sin(a*10)*rim + .6, z*.66*(1 + .07*Math.sin(a*10)*rim)); }
  sh.computeVertexNormals(); setCol(sh, (x, y, z) => { const s = .75 + .25*Math.sin(Math.atan2(z, x)*10); return [s*.95, s*.9, s*.8]; });
  const mt = new T.TorusGeometry(.6, .26, 7, 26); mt.rotateX(Math.PI/2); const q = mt.attributes.position;
  for (let i = 0; i < q.count; i++) { const x = q.getX(i), z = q.getZ(i), a = Math.atan2(z, x); q.setXYZ(i, x*1.2, q.getY(i)*.55 + .62 + .07*Math.sin(a*10), z*.72); }
  mt.computeVertexNormals();
  const cA = C(0x1b4dff), cB = C(0x12e0c8), cD = C(0x2a0a66);
  setCol(mt, (x, y, z) => { const a = Math.atan2(z, x), sp = Math.sin(a*26)*Math.sin((x*x + z*z)*30); return sp > .35 ? mul3(cB, 1.5) : mix3(cD, cA, .5 + .5*Math.sin(a*5)); });
  return merge([sh, mt, setCol(tf(new T.CircleGeometry(.5, 12).rotateX(-Math.PI/2), 0, .58, 0, 0, 0, 0, 1.2, 1, .7), [.05, .02, .12])]);
}
function starGeo() { const s = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = i/10*TAU + Math.PI/2, r = i % 2 ? .36 : 1; i ? s.lineTo(Math.cos(a)*r, Math.sin(a)*r) : s.moveTo(Math.cos(a)*r, Math.sin(a)*r); }
  s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth:.08, bevelEnabled:true, bevelThickness:.09, bevelSize:.1, bevelSegments:2, curveSegments:1 }); g.rotateX(-Math.PI/2);
  const m = merge([g]); return setCol(m, (x, y, z) => { const sp = hash2(Math.round(x*9), Math.round(z*9)); const k = (y > .1 && sp > .6) ? 1.7 : .85 + .25*y; return [k, k, k]; }); }
function shellGeo() { const pts = []; for (let i = 0; i <= 26; i++) { const t = i/26, a = t*TAU*3.3, r = .2*(1 - t)*(1 - t) + .004; pts.push(new V3(Math.cos(a)*r, t*.5 + (1 - t)*(1 - t)*-.02, Math.sin(a)*r)); }
  const cA = C(0xfff3e0), cB = C(0xff9a5c), cP = C(0xffb7d0);
  const g = sweep(pts, t => .2*(1 - t)*(1 - t*.3) + .012, 30, 6, (t, a) => mix3(mix3(cA, cP, t), cB, Math.sin(t*90) > .35 ? .75 : 0));
  return merge([tf(g, 0, .14, 0, 1.25, 0, 0)]); }
function makeWreck() {
  const g = new T.Group(), wood = C(0xa9743f), dark = C(0x4a2e14), alg = C(0x4fa868), mat = M({ side:T.DoubleSide, glow:.3, det:1, rim:.3 });
  const wc = (x, y, z) => { const n = vnoise(z*.9 + 4, y*2.2 + x), pl = Math.sin(y*10.5) > .86 ? .3 : 1; return mul3(mix3(wood, alg, sstep(.55, .8, vnoise(x*.7 + 9, z*.5 + y))*.75), pl*(.7 + .45*n)); };
  const hull = new T.SphereGeometry(1, 24, 10, 0, TAU, Math.PI/2, Math.PI/2), p = hull.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nz = Math.abs(z); p.setXYZ(i, x*2.1*(1 - .25*nz*nz), y*2.2 + 2.2 + nz*nz*.5*(1 + y), z*6.2); }
  hull.computeVertexNormals(); const parts = [setCol(hull, wc)];
  for (let i = 0; i < 6; i++) { const z = -4.4 + i*1.75, w = 2*2.0*Math.sqrt(Math.max(.1, 1 - (z/6.2)*(z/6.2))); if (i === 2 || i === 4) continue; parts.push(setCol(tf(new T.BoxGeometry(w, .14, 1.2), 0, 2.15, z), wc)); }
  parts.push(setCol(tf(new T.CylinderGeometry(.15, .22, 8, 8), .2, 5.6, .9, 0, 0, -.06), wc), setCol(tf(new T.CylinderGeometry(.09, .09, 4.4, 6), .5, 8.2, .9, 0, 0, Math.PI/2), wc),
    setCol(tf(new T.CylinderGeometry(.55, .42, .45, 9, 1, true), .32, 9.3, .9), wc), setCol(tf(new T.CylinderGeometry(.09, .13, 3.6, 6), 0, 3.3, 7.4, 1.15, 0, 0), wc),
    setCol(tf(new T.CylinderGeometry(.12, .16, 4.5, 6), -.3, 3.6, -3.2, .5, 0, .35), wc));
  for (let i = 0; i < 9; i++) { const z = -4.6 + i*1.15, w = 2.05*Math.sqrt(Math.max(.05, 1 - (z/6.2)*(z/6.2))); const rib = new T.TorusGeometry(w, .07, 4, 10, Math.PI); rib.rotateZ(Math.PI); parts.push(setCol(tf(rib, 0, 2.2, z, 0, 0, 0, 1, 1.02, 1), dark)); }
  const m = new T.Mesh(merge(parts), mat); m.frustumCulled = false; g.add(m);
  const sg = new T.PlaneGeometry(3.8, 2.8, 7, 5); sg.translate(0, 1.4, 0); const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) { const y = sp.getY(i), x = sp.getX(i); if (y > 2.3) sp.setY(i, y - Math.abs(Math.sin(x*3.1))*.9*hash2(Math.round(x*3), 1)); sp.setZ(i, Math.sin(x*1.6)*.25*y/2.8); }
  sg.computeVertexNormals(); setCol(sg, (x, y) => mul3([.92, .88, .74], .55 + .4*vnoise(x*2, y*2) - y*.08));
  const sail = new T.Mesh(sg, M({ side:T.DoubleSide, glow:.2, sway:.1 })); sail.frustumCulled = false; sail.position.set(.5, 8.15, .9); sail.rotation.z = Math.PI; g.add(sail);
  return g;
}
function makeChest() {
  const g = new T.Group(), wood = C(0x8a5a2c), gold = [1.6, 1.15, .25], mat = M({ side:T.DoubleSide, glow:.3 }), matG = M({ phong:true, shin:90, spec:0xffffff, glow:.9 });
  const cc = x => Math.abs(Math.abs(x) - .38) < .06 || Math.abs(x) < .05 ? gold : mul3(wood, .8 + .4*hash2(Math.round(x*40), 3));
  g.add(new T.Mesh(merge([setCol(tf(new T.BoxGeometry(1, .55, .66), 0, .275, 0), x => cc(x))]), mat));
  const lg = new T.CylinderGeometry(.33, .33, 1, 10, 1, false, 0, Math.PI); lg.rotateZ(Math.PI/2); lg.translate(0, 0, .33);
  const lid = new T.Mesh(merge([setCol(lg, x => cc(x))]), mat), pv = new T.Group(); pv.position.set(0, .55, -.33); pv.add(lid); g.add(pv);
  const coins = [ball(.42, gold, 0, .5, 0, 12, 6, 1, .32, .66)]; for (let i = 0; i < 14; i++) coins.push(setCol(tf(new T.CylinderGeometry(.07, .07, .02, 8), rr(-.36, .36), .62 + rr(0, .06), rr(-.2, .2), rr(-.6, .6), 0, rr(-.6, .6)), gold));
  const cm = new T.Mesh(merge(coins), matG); g.add(cm);
  let k = 0, opened = false; return { g, upd(near, dt) { k += ((near ? 1 : 0) - k)*Math.min(1, dt*3); pv.rotation.x = -k*1.95; if (near && !opened) { opened = true; return true; } return false; } };
}
