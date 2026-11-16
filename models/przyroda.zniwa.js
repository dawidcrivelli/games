// przyroda — wspólne dla: zniwa
// wymaga z gry: T
'use strict';
function tuftGeo(kind) {
  const P = [], N = [], C = [], col = new T.Color(), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  const add = (g, hex, px, py, pz, rx, ry, rz) => {
    g = g.index ? g.toNonIndexed() : g; e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); q.setFromEuler(e);
    m4.compose(v.set(px, py, pz), q, one); g.applyMatrix4(m4); col.setHex(hex);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) { P.push(p[i], p[i+1], p[i+2]); N.push(n[i], n[i+1], n[i+2]); C.push(col.r, col.g, col.b); }
  };
  if (kind === 'wheat') {
    // cień w głębi łanu, źdźbła, pochylone kłosy z ośćmi, suche liście
    const cv = new T.PlaneGeometry(1.3, 1.3); cv.rotateX(-Math.PI/2); add(cv, 0xc4962f, 0, .56, 0);
    for (let i = 0; i < 10; i++) {
      const x = rr(-.5, .5), z = rr(-.5, .5), h = rr(.8, 1.02), tx = rr(-.16, .16), tz = rr(-.16, .16), ry = rnd()*6.28;
      const X = x - tz*h*.5, Z = z + tx*h*.5;
      add(new T.CylinderGeometry(.013, .02, h, 3, 1, true), i%4 ? 0xcfa23a : 0xbfa244, x, h/2, z, tx, 0, tz);
      add(new T.CylinderGeometry(.014, .036, .24, 4, 1, true), [0xf1c653, 0xe7b942, 0xf6d168, 0xdfae3a][i&3], X - tz*.1, h + .09, Z + tx*.1, tx*2.6, ry, tz*2.6);
      add(new T.ConeGeometry(.05, .2, 4, 1, true), 0xf7e6a6, X - tz*.3, h + .29, Z + tx*.3, Math.PI + tx, ry, tz);
      if (i%3 === 0) add(new T.PlaneGeometry(.04, .42), 0xb4a244, x + .05, h*.42, z, rr(.5, 1), ry, 0);
    }
  } else {
    // rząd kukurydzy: 2 rośliny, łukowate liście, kolby w liściach okrywowych, wiecha
    const sh = new T.PlaneGeometry(1.02, 1.02); sh.rotateX(-Math.PI/2); add(sh, 0x57492a, 0, .04, 0);
    for (let p = 0; p < 2; p++) {
      const x = rr(-.07, .07), z = -.25 + p*.5 + rr(-.08, .08), h = rr(2.05, 2.5);
      add(new T.CylinderGeometry(.027, .046, h, 5, 1, true), 0x74a240, x, h/2, z);
      for (let k = 0; k < 8; k++) {
        const a = (k%2 ? 1.57 : -1.57) + rr(-.55, .55), y = .32 + k*(h - .8)/8, L = rr(.42, .6), f1 = rr(.6, .85), f2 = rr(1.75, 2.1);
        const c1 = k < 2 ? 0xb9aa52 : (k%3 ? 0x3d8a2e : 0x58a43b), sx = Math.sin(a), cz = Math.cos(a);
        add(new T.PlaneGeometry(.14, L), c1, x + sx*Math.sin(f1)*L/2, y + Math.cos(f1)*L/2, z + cz*Math.sin(f1)*L/2, f1, a, 0);
        const ex = x + sx*Math.sin(f1)*L, ey = y + Math.cos(f1)*L, ez = z + cz*Math.sin(f1)*L, L2 = L*.9;
        add(new T.PlaneGeometry(.1, L2), k < 2 ? 0xa89a48 : 0x4c9a35, ex + sx*Math.sin(f2)*L2/2, ey + Math.cos(f2)*L2/2, ez + cz*Math.sin(f2)*L2/2, f2, a, 0);
      }
      const nc = rnd() < .45 ? 2 : 1;
      for (let k = 0; k < nc; k++) { const a = (k ? 1.57 : -1.57) + rr(-.4, .4), f = .42, y = rr(.95, 1.2) + k*.3, sx = Math.sin(a)*Math.sin(f), cz = Math.cos(a)*Math.sin(f), cy = Math.cos(f);
        const bx = x + Math.sin(a)*.07, bz = z + Math.cos(a)*.07;
        add(new T.CylinderGeometry(.05, .066, .3, 6), 0xa5c463, bx + sx*.15, y + cy*.15, bz + cz*.15, f, a, 0);
        add(new T.CylinderGeometry(.036, .052, .13, 6), 0xf4c81e, bx + sx*.33, y + cy*.33, bz + cz*.33, f, a, 0);
        add(new T.ConeGeometry(.04, .13, 4), 0x7d4d24, bx + sx*.45, y + cy*.45, bz + cz*.45, f, a, 0); }
      for (let k = 0; k < 5; k++) add(new T.ConeGeometry(.022, .34, 3, 1, true), 0xdcc88c, x + Math.sin(k*1.26)*.07, h + .13, z + Math.cos(k*1.26)*.07, k ? rr(.3, .7) : 0, k*1.26, 0);
    }
  }
  const G = new T.BufferGeometry();
  G.setAttribute('position', new T.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); G.setAttribute('color', new T.Float32BufferAttribute(C, 3));
  return G;
}
