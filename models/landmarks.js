// Budynki Ciuchciowa: dworce (CIUCHCIOWO, BOCIANOWO), domki, kopalnia, tartak, las, zoo, staw z przystankiem, elektrownia.
// buildLandmarks(PLACES, anims, tileX, tileZ) stawia je w scenie: PLACES[klucz] = [x, z, strona rampy]; anims — tablica gry
// na ruchy zwierząt (f(t) co klatkę); tileX/tileZ — kratka → metry (domyślnie bez zmiany). Zwraca spinners (śmigła, koła do obracania co klatkę). ROT[strona] — obrót budynku do rampy.
// Zużywa rnd()/rr() (ten sam świat z ziarna). wymaga: lib/3d/three.js, lib/3d/shapes.js, models/buildings.js,
// lib/common/random.js; od gry: scene, paleta M
'use strict';
const ROT = [Math.PI, Math.PI/2, 0, -Math.PI/2];      // obrót budynku według strony z rampą
function buildLandmarks(PLACES, anims, tileX = v => v, tileZ = v => v) {
const spinners = [];
function placeAt(g, key, keep) {                   // przód budynku (+Z) zwrócony do swojej rampy
  const p = PLACES[key], out = keep ? g : bake(g);
  out.position.set(tileX(p[0]), 0, tileZ(p[1])); out.rotation.y = ROT[p[2]]; scene.add(out); return out;
}
function buildStation(key, name, wallC, roofC) {
  const b = new T.Group(), hb = new T.Group(), wall = lam(wallC);
  gableHouse(hb, 5.6, 4.1, 10.6, wall, lam(roofC), .72, lam(wallC, { side:T.DoubleSide })); hb.rotation.y = Math.PI/2; hb.position.set(0, .4, 1.4); b.add(hb);
  box(11.2, .5, 6.2, M.stone, 0, .25, 1.4, b); box(.8, 1.5, .8, M.brick, 3.2, 7.2, 1.4, b);
  box(1.3, 2.3, .1, M.woodL, 0, 1.7, 4.23, b); box(1.5, .14, .14, M.white, 0, 2.9, 4.24, b);
  [-3.6, -1.9, 1.9, 3.6].forEach(x => { box(1.05, 1.25, .08, M.win, x, 2.6, 4.22, b); box(1.2, .1, .1, M.white, x, 2.6, 4.24, b); box(.1, 1.35, .1, M.white, x, 2.6, 4.24, b); box(1.3, .12, .16, M.white, x, 1.92, 4.25, b); });
  [-3.6, 0, 3.6].forEach(x => { box(1.05, 1.25, .08, M.win, x, 2.6, -1.42, b); });
  groundPad(b, M.pad, 13, 4.2, 7.1);
  ramp(b, 13);
  // wiata nad peronem
  [-4.5, 0, 4.5].forEach(x => cylY(.08, 2.9, M.steel, x, 2.0, 8.3, b, 8));
  const cn = box(11.5, .14, 3.6, lam(roofC), 0, 3.5, 8.6, b); cn.rotation.x = .1;
  // ławka, lampy, zegar
  box(2.2, .1, .5, M.woodL, -2.6, 1.05, 7.6, b); box(2.2, .5, .08, M.woodL, -2.6, 1.4, 7.38, b); [-3.5, -1.7].forEach(x => box(.1, .5, .45, M.dark, x, .8, 7.6, b));
  [-5.9, 5.9].forEach(x => { cylY(.07, 3.6, M.dark, x, 2.35, 10.6, b, 8); mesh(new T.SphereGeometry(.26, 10, 8), M.lamp, x, 4.25, 10.6, b); cylY(.3, .06, M.dark, x, 4.5, 10.6, b, 10); });
  cylY(.07, 3.2, M.dark, 3.4, 2.15, 10.9, b, 8); cylX(.52, .22, M.dark, 3.4, 3.9, 10.9, b, 18); cylX(.45, .24, M.gaugeW, 3.4, 3.9, 10.9, b, 18);
  [-1, 1].forEach(s => { box(.02, .34, .05, M.dark, 3.4 + s*.125, 4.04, 10.9, b); const h = box(.02, .05, .24, M.dark, 3.4 + s*.125, 3.9, 10.99, b); h.rotation.x = .2; });
  nameBoard(b, name, -3.6, 10.9);
  placeAt(b, key);
}
buildStation('station', 'CIUCHCIOWO', 0xf3e6c8, 0xa6432f); buildStation('town', 'BOCIANOWO', 0xe8eef2, 0x3f6f9a);
['housesA', 'housesB'].forEach((key, n) => {       // domki Bocianowa
  const b = new T.Group(), cols = [[0xf6d9a8, 0x9a4a36], [0xd9e8c8, 0x5a6f7a], [0xf2c9c0, 0x7a4a36], [0xe6e0f2, 0xa6432f]];
  [[-3.2, -2.5, 0], [3, -3, 1], [n ? -2.6 : 2.6, 3.2, 2]].forEach((q, k) => { const h = new T.Group(), c = cols[(k + n*2) % 4];
    gableHouse(h, 4.6, 3, 5.2, lam(c[0]), lam(c[1]), .75, lam(c[0], { side:T.DoubleSide })); box(.9, 1.7, .08, M.woodL, 0, .85, 2.63, h); [-1.4, 1.4].forEach(x => box(.9, .9, .08, M.win, x, 1.8, 2.63, h)); box(.6, 1.2, .6, M.brick, 1.2, 4.6, -1, h);
    h.position.set(q[0], 0, q[1]); h.rotation.y = q[2]*.5 - .3; b.add(h); });
  for (let k = 0; k < 4; k++) { const x = rr(-6, 6), z = rr(-6, 6); cone(.2, .14, 1.6, lam(0x6d4b2c), x, .8, z, b, 6); ell(1.1, 1.2, 1.1, lam(k % 2 ? 0x4f9a48 : 0x6fae49), x, 2.3, z, b, 10); }
  if (n) { const nest = new T.Group(); cylY(.12, 6, M.woodD, 5.2, 3, 4.8, nest, 6); cylY(.7, .25, lam(0x8a6a3a), 5.2, 6.1, 4.8, nest, 10); ell(.22, .3, .4, M.flagW, 5.2, 6.6, 4.8, nest, 8); cone(.03, .03, .5, lam(0xd8301f), 5.2, 6.3, 4.8, nest, 4); ell(.09, .09, .09, M.flagW, 5.2, 6.95, 5.1, nest, 6); const bk = cone(.03, .005, .4, lam(0xd8301f), 5.2, 6.9, 5.35, nest, 4); bk.rotation.x = Math.PI/2; b.add(nest); }   // bocian na gnieździe
  placeAt(b, key);
});
{ // kopalnia
  const b = new T.Group(), st = pho(0x4a5560, { metalness:.5, roughness:.5 });
  groundPad(b, M.pad, 13.4, -6.8, 12);
  box(6, 4.2, 5, M.brick, -3.4, 2.1, -1.5, b); box(6.5, .3, 5.5, M.dark, -3.4, 4.35, -1.5, b);
  [-5, -3.4, -1.8].forEach(x => box(.9, 1.3, .08, M.win, x, 2.6, 1.02, b)); box(.9, .9, .9, M.brick, -5.2, 5, -2.6, b);
  box(4.3, .85, .1, signMat('KOPALNIA', '#1c1c1e', '#f2c230'), -3.4, 3.72, 1.04, b);
  // wieża szybowa
  const tx = 2.6, tz = -2.2;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => box(.32, 10, .32, st, tx + p[0]*1.25, 5, tz + p[1]*1.25, b));
  [2.6, 5.4, 8.2].forEach(y => { [-1, 1].forEach(s => { box(2.8, .2, .2, st, tx, y, tz + s*1.25, b); box(.2, .2, 2.8, st, tx + s*1.25, y, tz, b); });
    const d = box(.16, 3.9, .16, st, tx, y - 1.4, tz + 1.25, b); d.rotation.z = .73; });
  box(3.4, .25, 3.4, st, tx, 10.1, tz, b); box(3.9, .2, 3.9, lam(0x7a2f25), tx, 12.9, tz, b); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => box(.16, 2.7, .16, st, tx + p[0]*1.5, 11.5, tz + p[1]*1.5, b));
  const strut = box(.34, 11.6, .34, st, tx - 3.1, 5.2, tz, b); strut.rotation.z = -.56;
  // zasobnik węgla nad rampą i hałda
  [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(p => box(.26, 3.7, .26, st, 3.2 + p[0], 2.4, 9 + p[1], b));
  box(3.2, 2.2, 3.2, st, 3.2, 5.2, 9, b); const ch = box(1.1, .16, 2.4, st, 3.2, 3.7, 11.2, b); ch.rotation.x = .5;
  const cv = box(.9, .3, 9.4, M.dark, 3, 3.5, 3.6, b); cv.rotation.x = -.58;
  const heap = mesh(new T.ConeGeometry(3.3, 2.8, 9), M.coal, -3.3, 1.4, 7.6, b); heap.rotation.y = .4;
  mesh(new T.ConeGeometry(1.6, 1.3, 7), M.coal, -.6, .65, 9.6, b);
  box(13.4, .55, 2.4, M.concrete, 0, .275, 10.8, b);
  placeAt(b, 'mine');
  const p = PLACES.mine;
  [-.55, .55].forEach(o => { const w = new T.Group(); const t = mesh(new T.TorusGeometry(1.05, .1, 6, 22), st, 0, 0, 0, w); t.castShadow = true;
    for (let i = 0; i < 3; i++) { const s = box(2, .1, .08, st, 0, 0, 0, w); s.rotation.z = i*Math.PI/3; }
    w.position.set(tileX(p[0]) + tx, 11.5, tileZ(p[1]) + tz + o); scene.add(w); spinners.push({ m:w, ax:'z', sp:o > 0 ? 1.1 : -1.1 }); });
}
{ // tartak
  const b = new T.Group(), log = lam(0x8a5a33), cut = lam(0xdcbc8c), rf = lam(0x4d7a4a);
  groundPad(b, lam(0xc2a877, { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }), 13.4, -6.8, 12);
  [[-4.4, -4.6], [4.4, -4.6], [-4.4, .6], [4.4, .6]].forEach(p => box(.34, 3.8, .34, M.woodD, p[0], 1.9, p[1], b));
  const r = box(10.4, .26, 7, rf, 0, 4.1, -2, b); r.rotation.x = .13; box(9.2, 2.6, .16, M.wood, 0, 2.2, -4.7, b);
  box(3.6, .95, 1.5, M.woodL, -1, .5, -2, b);
  for (let i = 0; i < 3; i++) box(2.4, .16, .8, cut, 3.1, .12 + i*.18, -2 + (i%2)*.1, b); for (let i = 0; i < 4; i++) box(2.4, .16, .8, cut, 3.1, .66 + i*.17, -2.1 + (i%2)*.12, b);
  box(4.3, .85, .1, signMat('TARTAK', '#2f6a43', '#fff'), 0, 3.4, 1.05, b); box(9.2, .3, .3, M.woodD, 0, 3.6, .6, b);
  // stosy kłód przy rampie
  const pile = (x, z) => { [[0, 0], [.8, 0], [1.6, 0], [.4, .68], [1.2, .68], [.8, 1.36]].forEach(q => { cylX(.38, 5, log, x, .4 + q[1], z + q[0], b, 10); cylX(.33, 5.03, cut, x, .4 + q[1], z + q[0], b, 10); }); };
  pile(-3.4, 4.2); pile(3.4, 3.4);
  box(13.4, .55, 4.4, M.concrete, 0, .275, 9.8, b); box(13.4, .03, .28, M.flagW, 0, .56, 11.7, b);
  [[-3, 8.6], [-3, 9.4], [-3, 10.2], [-3, 9], [-3, 9.8]].forEach((q, i) => { cylX(.36, 4.6, log, q[0], .95 + (i > 2 ? .64 : 0), q[1], b, 10); cylX(.31, 4.63, cut, q[0], .95 + (i > 2 ? .64 : 0), q[1], b, 10); });
  placeAt(b, 'sawmill');
  const p = PLACES.sawmill, saw = new T.Group(); cylX(.95, .05, M.steelL, 0, 0, 0, saw, 20); for (let i = 0; i < 10; i++) { const tt = box(.05, .16, .16, M.steelL, 0, Math.cos(i*.628)*.95, Math.sin(i*.628)*.95, saw); tt.rotation.x = i*.628 + .8; }
  const sk = bake(saw); sk.position.set(tileX(p[0]) + 1, 1.05, tileZ(p[1]) + 2); scene.add(sk); spinners.push({ m:sk, ax:'x', sp:9 });
}
{ // las
  const b = new T.Group(), tr = lam(0x6d4b2c), f1 = lam(0x2f6b3a), f2 = lam(0x3d7d44), f3 = lam(0x275c33);
  for (let i = 0; i < 17; i++) { const x = rr(-5.8, 5.8), z = rr(-5.8, 5.8), s = rr(.75, 1.35), fm = [f1, f2, f3][i%3];
    mesh(new T.CylinderGeometry(.2*s, .34*s, 2.4*s, 6), tr, x, 1.2*s, z, b);
    for (let k = 0; k < 3; k++) { const c = mesh(new T.ConeGeometry((1.9 - k*.45)*s, 2.6*s, 7), fm, x, (2.6 + k*1.5)*s, z, b); c.rotation.y = rnd()*6; } }
  for (let i = 0; i < 9; i++) { const m = mesh(new T.SphereGeometry(rr(.14, .22), 7, 5), lam(0xc8382c), rr(-6, 6), .2, rr(-6, 6), b); m.scale.y = .7; cylY(.05, .2, M.flagW, m.position.x, .08, m.position.z, b, 5); }
  placeAt(b, 'forest');
}
{ // zoo
  const b = new T.Group(), PO = { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }, PO2 = { polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 };
  const COL = [0xe8452f, 0xf2a81f, 0x2f7fd8, 0x3f9a4a, 0x8e4fc2], wht = lam(0xfafafa), grn = lam(0x3f9a4a);
  groundPad(b, lam(0xe2cf98, PO), 13.4, -6.8, 7);
  [[-3.3, -1.6, 3.2, 0x7fbf5a], [3.3, -1.9, 3.1, 0x8cc765], [0, -5, 1.9, 0xc9b27c]].forEach(q => { const c = mesh(new T.CircleGeometry(q[2], 22), lam(q[3], PO2), q[0], .045, q[1], b); c.rotation.x = -Math.PI/2; });
  // brama: pasiaste słupy, tablica z uszami, chorągiewki i balony
  const zooSign = lam(0xffffff, { map:tex(512, 128, (g, w, h) => { g.fillStyle = '#fff4d6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3f9a4a'; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16);
    g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = 'bold 96px "Arial Rounded MT Bold", Arial, sans-serif'; ['Z', 'O', 'O'].forEach((c, k) => { g.fillStyle = ['#e8452f', '#f2a81f', '#2f7fd8'][k]; g.fillText(c, w/2 + (k - 1)*96, h/2 + 6); });
    g.font = '64px sans-serif'; g.fillText('🦁', 70, h/2 + 4); g.fillText('🐘', w - 70, h/2 + 4); }) });
  [-3.1, 3.1].forEach(x => { for (let k = 0; k < 5; k++) cone(.5, .5, .9, k % 2 ? wht : lam(0xe8452f), x, .45 + k*.9, 5.6, b, 16); ell(.62, .62, .62, lam(0xf2c230), x, 4.95, 5.6, b); ell(.52, .52, .16, lam(0xf2c230), x*.95, 6.75, 5.6, b); });
  box(7.4, 1.75, .3, zooSign, 0, 5.75, 5.6, b);
  for (let k = 0; k < 9; k++) { const f = mesh(new T.ConeGeometry(.24, .55, 3), lam(COL[k % 5]), -2.2 + k*.55, 4.5 - Math.sin(k/8*Math.PI)*.3, 5.6, b); f.rotation.x = Math.PI; f.scale.z = .2; }
  [[-4.0, 0], [-4.6, 2], [4.0, 1], [4.6, 4]].forEach((q, k) => { const y = 3.3 + (k % 2)*.6; ell(.4, .48, .4, pho(COL[q[1]], { roughness:.25 }), q[0], y, 5.9, b); cylY(.014, y - 1.2, M.dark, q[0], (y - 1.2)/2 + .8, 5.9, b, 4); });
  // biały płotek z zielonymi poprzeczkami
  const fence = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), n = Math.round(L/.5), a = Math.atan2(x2 - x1, z2 - z1);
    for (let i = 0; i <= n; i++) { const u = i/n, p = box(.2, .95, .07, wht, x1 + (x2 - x1)*u, .55, z1 + (z2 - z1)*u, b); p.rotation.y = a + Math.PI/2; const c = mesh(new T.ConeGeometry(.14, .2, 4), wht, x1 + (x2 - x1)*u, 1.12, z1 + (z2 - z1)*u, b); c.rotation.y = a + Math.PI/4; c.scale.z = .4; }
    [.35, .8].forEach(y => { const r = box(.06, .1, L, grn, (x1 + x2)/2, y, (z1 + z2)/2, b); r.rotation.y = a; }); };
  fence(-6.6, 5.6, -3.8, 5.6); fence(3.8, 5.6, 6.6, 5.6); fence(-6.6, -6.5, -6.6, 5.6); fence(6.6, -6.5, 6.6, 5.6); fence(-6.6, -6.5, 6.6, -6.5);
  // akacja, palmy, skałki, basen pingwinów
  cone(.3, .2, 3.4, lam(0x7a5a38), -5.3, 1.7, -4.6, b, 8); ell(2.2, .55, 2.2, lam(0x5f9a3e), -5.3, 3.7, -4.6, b); ell(1.4, .4, 1.4, lam(0x6fae49), -4.6, 4.15, -4.2, b);
  const palm = (x, z, h, lean) => { for (let k = 0; k < 5; k++) cone(.22 - k*.02, .2 - k*.02, h/5 + .05, lam(k % 2 ? 0x8a6a3a : 0x9a7a46), x + lean*k*k*.05, h/10 + k*h/5, z, b, 8);
    const tx = x + lean*.8; for (let i = 0; i < 7; i++) { const a = i/7*6.283, lf = ell(.3, .06, 1.25, lam(i % 2 ? 0x3f9a4a : 0x4fae52), tx + Math.sin(a)*1.0, h - .15, z + Math.cos(a)*1.0, b, 8); lf.rotation.set(-.45, a, 0, 'YXZ'); }
    [0, 2.1, 4.2].forEach(a => ell(.14, .14, .14, lam(0x6b4a2a), tx + Math.sin(a)*.2, h - .2, z + Math.cos(a)*.2, b, 8)); };
  palm(5.4, -5, 4.6, -1); palm(-1.6, 3.6, 3.6, 1);
  [[0, .5, -5, 1.5, .9], [-1.1, .35, -4.6, .9, .6], [1.2, .4, -5.3, 1, .7], [.2, .25, -3.9, .7, .4]].forEach(q => { const r = mesh(new T.IcosahedronGeometry(1, 1), lam(0x9a968e), q[0], q[1], q[2], b); r.scale.set(q[3], q[4], q[3]*.9); r.rotation.y = q[0]*2; });
  { const pl = mesh(new T.CircleGeometry(1.7, 20), pho(0x5fb6dd, Object.assign({ metalness:.5, roughness:.08, envMapIntensity:1.5 }, PO2)), 4.1, .06, 2.9, b); pl.rotation.x = -Math.PI/2; pl.scale.set(1.2, 1, 1);
    const ic = mesh(new T.IcosahedronGeometry(1, 0), lam(0xf4fbff), 5.3, .25, 3.9, b); ic.scale.set(1.1, .4, .9); }
  ramp(b, 11); groundPad(b, M.pad, 5.4, 5, 7.1);
  placeAt(b, 'zoo');
  // zwierzęta stoją osobno, bo się ruszają
  const P = PLACES.zoo, zx = tileX(P[0]), zz = tileZ(P[1]), put = (g, x, z, ry, sc) => { g.position.set(zx - x, 0, zz - z); g.rotation.y = Math.PI + ry; if (sc) g.scale.setScalar(sc); scene.add(g); };
  { // żyrafa
    const gTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#f3c456'; g.fillRect(0, 0, w, h); g.fillStyle = '#a8621f';
      for (let i = 0; i < 30; i++) { const x = rnd()*w, y = rnd()*h, r = rr(7, 13); g.beginPath(); for (let k = 0; k < 6; k++) { const a = k/6*6.283 + rr(-.3, .3), q = r*rr(.7, 1.1); g.lineTo(x + Math.cos(a)*q, y + Math.sin(a)*q); } g.fill(); } }, 2, 2);
    const gy = lam(0xffffff, { map:gTex }), gd = lam(0xa8621f), cr = lam(0xf7e3a8), G = new T.Group(), st = new T.Group(), nk = new T.Group(), neck = new T.Group();
    ell(.5, .55, 1.0, gy, 0, 2.75, 0, st);
    [[-.27, -.62], [.27, -.62], [-.27, .62], [.27, .62]].forEach(q => { cone(.085, .13, 2.35, gy, q[0], 1.25, q[1], st, 8); cone(.11, .1, .14, gd, q[0], .07, q[1], st, 8); });
    const tl = cone(.02, .035, 1.2, gy, 0, 2.4, -1.1, st, 5); tl.rotation.x = -.25; ell(.07, .14, .07, gd, 0, 1.8, -1.27, st);
    G.add(bake(st));
    cone(.3, .17, 2.7, gy, 0, 1.25, 0, nk, 10); box(.05, 2.4, .12, gd, 0, 1.3, -.22, nk);
    ell(.21, .23, .42, gy, 0, 2.72, .22, nk); ell(.15, .14, .2, cr, 0, 2.66, .56, nk);
    [-1, 1].forEach(s => { cone(.03, .03, .3, gd, s*.1, 3.02, .1, nk, 6); ell(.055, .055, .055, gd, s*.1, 3.19, .1, nk, 8); ell(.05, .09, .14, gy, s*.26, 2.86, .02, nk, 8); ell(.04, .045, .04, M.dark, s*.19, 2.8, .36, nk, 8); ell(.02, .02, .02, M.dark, s*.07, 2.68, .75, nk, 6); });
    neck.add(bake(nk)); neck.position.set(0, 3.0, .75); G.add(neck);
    anims.push(t => { neck.rotation.x = .32 + Math.sin(t*.7)*.1; neck.rotation.z = Math.sin(t*.45)*.05; });
    put(G, -3.3, -1.6, .6);
  }
  { // słoń
    const ge = lam(0x9aa3ad), geD = lam(0x7f8891), E = new T.Group(), es = new T.Group(), trunk = new T.Group(), tr = new T.Group();
    ell(1.0, .95, 1.45, ge, 0, 1.9, 0, es); ell(.72, .75, .7, ge, 0, 2.3, 1.5, es);
    [[-.55, -.8], [.55, -.8], [-.55, .75], [.55, .75]].forEach(q => { cone(.3, .3, 1.3, ge, q[0], .65, q[1], es, 12); cone(.33, .31, .14, geD, q[0], .07, q[1], es, 12); });
    [-1, 1].forEach(s => { const tk = cone(.085, .02, .8, M.flagW, s*.34, 1.8, 2.2, es, 8); tk.rotation.x = Math.PI/2 - .3; ell(.06, .07, .05, M.dark, s*.45, 2.55, 2.05, es, 8); });
    const tl = cone(.02, .04, .9, geD, 0, 1.75, -1.5, es, 5); tl.rotation.x = -.2;
    E.add(bake(es));
    [-1, 1].forEach(s => { const ear = new T.Group(), eg = new T.Group(); ell(.09, .75, .6, ge, s*.5, -.1, -.15, eg); ell(.05, .55, .42, lam(0xc9a9a6), s*.5, -.12, -.09, eg);
      ear.add(bake(eg)); ear.position.set(s*.55, 2.5, 1.3); E.add(ear); anims.push(t => { ear.rotation.y = s*(.35 + Math.sin(t*1.3 + s)*.28); }); });
    { let y = 0, z = 0; for (let k = 0; k < 13; k++) { const r = .27 - k*.014; ell(r, r, r, ge, 0, y, z, tr, 10); if (k < 8) { y -= r*.75; z += .03; } else { y -= r*.3; z += r*.7; } } }
    trunk.add(bake(tr)); trunk.position.set(0, 2.2, 2.1); E.add(trunk); anims.push(t => { trunk.rotation.x = Math.sin(t*.9)*.2 - .05; trunk.rotation.z = Math.sin(t*.6)*.08; });
    put(E, 3.3, -1.9, -.5);
  }
  { // lew na skałkach
    const tan = lam(0xdba54a), mane = lam(0x9a5a1e), cr = lam(0xf3ddb0), L = new T.Group(), ls = new T.Group(), hd = new T.Group(), hg = new T.Group(), tail = new T.Group(), tg = new T.Group();
    ell(.45, .38, .9, tan, 0, .4, 0, ls); [-1, 1].forEach(s => { ell(.13, .1, .32, tan, s*.25, .12, .95, ls); ell(.16, .18, .3, tan, s*.36, .22, -.5, ls); });
    L.add(bake(ls));
    ell(.56, .56, .42, mane, 0, 0, 0, hg); ell(.34, .34, .3, tan, 0, 0, .25, hg); ell(.17, .13, .15, cr, 0, -.09, .5, hg); ell(.06, .045, .04, M.dark, 0, -.02, .63, hg, 8);
    [-1, 1].forEach(s => { ell(.1, .1, .06, tan, s*.3, .34, .1, hg, 8); ell(.04, .045, .03, M.dark, s*.13, .08, .52, hg, 8); });
    hd.add(bake(hg)); hd.position.set(0, .82, .78); L.add(hd);
    const tc = cone(.035, .03, 1, tan, 0, .5, 0, tg, 5); ell(.09, .13, .09, mane, 0, 1.05, 0, tg, 8); tail.add(bake(tg)); tail.position.set(0, .45, -.85); tail.rotation.x = -1; L.add(tail);
    anims.push(t => { hd.rotation.y = Math.sin(t*.5)*.5; tail.rotation.z = Math.sin(t*2.2)*.35; });
    put(L, 0, -5, 0, 1.15); L.position.y = 1.32;
  }
  { // pingwiny
    const bk = lam(0x1f2328), wh = lam(0xfafafa), og = lam(0xf29a1f), pg = new T.Group();
    ell(.2, .33, .2, bk, 0, .36, 0, pg); ell(.16, .27, .12, wh, 0, .33, .1, pg); ell(.15, .15, .15, bk, 0, .74, 0, pg); ell(.09, .08, .05, wh, 0, .72, .12, pg, 8);
    const bkk = mesh(new T.ConeGeometry(.045, .16, 6), og, 0, .72, .2, pg); bkk.rotation.x = Math.PI/2;
    [-1, 1].forEach(s => { ell(.04, .2, .1, bk, s*.21, .38, 0, pg, 8); ell(.08, .03, .12, og, s*.09, .03, .07, pg, 8); ell(.022, .022, .022, wh, s*.06, .78, .13, pg, 6); });
    const tp = bake(pg);
    [[3.2, 4.3, .4], [5.2, 3.8, -1.2], [4.6, 1.5, 2.6], [5.6, 2.3, -2]].forEach((q, k) => { const g = new T.Group(), c = cloneTpl(tp, true); g.add(c); put(g, q[0], q[1], q[2], 1.35); if (k === 1) g.position.y = .42;
      anims.push(t => { c.rotation.z = Math.sin(t*4.5 + k*1.9)*.13; c.position.y = Math.abs(Math.sin(t*4.5 + k*1.9))*.03; }); });
  }
}
{ // staw z kaczkami
  const g = new T.Group();
  const pond = mesh(new T.CircleGeometry(5.3, 28), pho(0x4f8fb5, { metalness:.55, roughness:.06, envMapIntensity:1.5, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }), 0, .035, 0, g); pond.rotation.x = -Math.PI/2; pond.scale.set(1.15, 1, 1);
  const shore = mesh(new T.RingGeometry(5, 6, 28), lam(0xb7a273, { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }), 0, .03, 0, g); shore.rotation.x = -Math.PI/2; shore.scale.set(1.15, 1, 1);
  const pg = new T.Group(), dk = lam(0xfaf8f0), or = lam(0xf29a1f), rd = lam(0x4f7d32);
  [[-2, 1, .5], [1.5, -1.5, 2], [2.6, 1.8, 4]].forEach(d => { const k = new T.Group(); const bd = mesh(new T.SphereGeometry(.3, 10, 8), dk, 0, .12, 0, k); bd.scale.set(.8, .6, 1.2);
    mesh(new T.SphereGeometry(.14, 8, 6), dk, 0, .42, .3, k); box(.08, .04, .14, or, 0, .4, .46, k); k.position.set(d[0], 0, d[1]); k.rotation.y = d[2]; pg.add(k); });
  for (let i = 0; i < 24; i++) { const a = rr(2.2, 4.8), r = rr(5, 6); cylY(.03, rr(1, 1.9), rd, Math.cos(a)*r*1.15, .7, Math.sin(a)*r, pg, 4); }
  g.add(bake(pg)); placeAt(g, 'pond', true);
}

{ // przystanek Staw
  const b = new T.Group(); ramp(b, 9);
  [-2.6, 2.6].forEach(x => cylY(.08, 2.5, M.steel, x, 1.8, 7.7, b, 8)); const rf = box(6.4, .12, 2.2, lam(0x2f7fd8), 0, 3.1, 8.2, b); rf.rotation.x = .12; box(5.2, 1.5, .08, M.glass, 0, 1.6, 7.6, b);
  box(2.4, .1, .5, M.woodL, 0, 1.05, 8, b); [-1, 1].forEach(x => box(.1, .5, .45, M.dark, x, .8, 8, b));
  nameBoard(b, 'STAW', 0, 11);
  placeAt(b, 'pond');
}
{ // elektrownia
  const b = new T.Group(), st = pho(0x6f7a84, { metalness:.5, roughness:.5 }), rd = lam(0xc8382c);
  groundPad(b, M.pad, 13.4, -6.8, 12);
  box(7.4, 5.6, 5.6, M.brick, -2.6, 2.8, -3.2, b); box(7.8, .3, 6, M.dark, -2.6, 5.75, -3.2, b);
  [-5.2, -3.5, -1.8, -.1].forEach(x => box(.95, 2.4, .08, M.win, x, 3, -.38, b));
  box(5.4, .9, .1, signMat('ELEKTROWNIA', '#f2c230', '#1c1c1e'), -2.6, 5, -.36, b);
  for (let k = 0; k < 6; k++) cylY(.82 - k*.045, 2.3, k % 2 ? M.flagW : rd, 4.2, 1.15 + k*2.3, -4.4, b, 14);                // komin w pasy
  { const pts = []; for (let k = 0; k <= 10; k++) { const u = k/10; pts.push(new T.Vector2(1.75 + (u - .68)*(u - .68)*3.1, u*7.6)); }
    mesh(new T.LatheGeometry(pts, 22), lam(0xd3d6d3, { side:T.DoubleSide }), 3.3, 0, 1.2, b); }                               // chłodnia kominowa
  [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(q => box(.24, 2.6, .24, st, -3.6 + q[0], 1.85, 8.6 + q[1], b));
  box(3, 1.6, 3, st, -3.6, 3.9, 8.6, b); const cv = box(.9, .28, 7.6, M.dark, -3.6, 4.4, 3.4, b); cv.rotation.x = .2;
  mesh(new T.ConeGeometry(2, 1.6, 8), M.coal, .9, .8, 6.3, b);
  box(.26, 8.5, .26, st, -6, 4.25, 3.4, b); [6.4, 7.8].forEach(y => box(.2, .2, 3.4, st, -6, y, 3.4, b));
  box(13.4, .55, 2.4, M.concrete, 0, .275, 10.8, b);
  placeAt(b, 'power');
}
  return spinners;
}
