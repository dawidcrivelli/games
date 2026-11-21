// Miasto Taxi: kamienice (bldg) z elewacjami, dachy (roofPrism), sklepy z markizami, stodoły, domy — zderzenia przez addSolid.
// Tylko dla Taxi (stałe FAC, BAY, FLOOR, AWN, DISP, HMAT, BILL, ROTK i addSolid są w taxi/game.js). Budynki Ciuchciowa: models/landmarks.js.
'use strict';
function roofPrism(g, x, y, z, w, d, rise, mat) { const along = w >= d, a = along ? d : w, L = along ? w : d, sh = new T.Shape(); sh.moveTo(-a/2 - .35, 0); sh.lineTo(a/2 + .35, 0); sh.lineTo(0, rise); sh.lineTo(-a/2 - .35, 0);
  const geo = new T.ExtrudeGeometry(sh, { depth:L + .7, bevelEnabled:false }); geo.translate(0, 0, -(L + .7)/2); if (along) geo.rotateY(Math.PI/2); mesh(geo, mat, x, y, z, g); }
function bldg(g, x, z, w, d, fl, st, roof) {
  const h = fl*FLOOR, geo = new T.BoxGeometry(w, h, d), uv = geo.attributes.uv, ru = Math.max(1, Math.round(w/BAY))/2, rd = Math.max(1, Math.round(d/BAY))/2;
  for (let i = 0; i < 24; i++) { const f = i >> 2; if (f === 2 || f === 3) uv.setXY(i, .02, .02); else uv.setXY(i, uv.getX(i)*(f < 2 ? rd : ru), uv.getY(i)*fl/2); }
  mesh(geo, FAC[st], x, h/2, z, g); box(w + .25, .55, d + .25, M.stone, x, .27, z, g);
  if (!roof && fl <= 3 && rnd() < .6) { box(w + .6, .25, d + .6, M.cream, x, h + .12, z, g); roofPrism(g, x, h + .24, z, w, d, Math.min(w, d)*.32, rnd() < .6 ? M.roof : ROOF2); if (rnd() < .7) box(.7, 1.5, .7, M.brick, x + rr(-w/4, w/4), h + Math.min(w, d)*.2 + .7, z + rr(-1, 1), g); }
  else { box(w + .5, .35, d + .5, roof || M.dark, x, h + .17, z, g); box(w + .7, .22, d + .7, M.cream, x, h - .35, z, g);
    if (rnd() < .6) box(2.2, 1.4, 2.2, M.concrete, x + rr(-w/4, w/4), h + 1, z + rr(-d/4, d/4), g);
    if (rnd() < .55) { const ax = x + rr(-w/3, w/3), az = z + rr(-d/3, d/3); cylY(.04, 3.2, M.steel, ax, h + 1.9, az, g, 5); box(1.3, .05, .05, M.steel, ax, h + 3.2, az, g); box(.8, .05, .05, M.steel, ax, h + 2.7, az, g); }
    if (rnd() < .5) for (let k = 0; k < 2; k++) box(.9, .6, .6, M.steelL, x + rr(-w/3, w/3), h + .65, z + rr(-d/3, d/3), g);
    if (fl > 6) cylY(1.1, 1.6, M.cRoof, x + w/4, h + 1.15, z, g, 12);
    if (fl > 3 && BILL.length && rnd() < .3) { const hz = w >= d, t = BILL.pop(), bb = box(hz ? 7.5 : .2, 1.9, hz ? .2 : 7.5, M.dark, x, h + 2.6, z, g), sg = box(7.3, 1.7, .08, sgn(t, ['#b3241b', '#1f4e8c', '#2f6a43'][BILL.length % 3], '#fff'), x + (hz ? 0 : .15), h + 2.6, z + (hz ? .15 : 0), g); if (!hz) sg.rotation.y = Math.PI/2;
      [-2.5, 2.5].forEach(o => cylY(.08, 1.7, M.steel, x + (hz ? o : 0), h + .95, z + (hz ? 0 : o), g, 6)); } }
  addSolid(x - w/2, z - d/2, x + w/2, z + d/2, h); return h;
}
function shop(g, x, z, w, k, name, ico) {
  const s = new T.Group(), a = (rnd()*4) | 0; s.position.set(x, 0, z); s.rotation.y = ROTK[k];
  box(w, 2.3, .14, GLD, 0, 1.3, .05, s); box(1.1, 2.2, .18, M.woodD, w*.28, 1.1, .06, s);
  if (name) box(Math.min(w, 7.5), .85, .18, sgn(name, ['#1f4e8c', '#8c2f1f', '#2f6a43', '#5a3a7a'][a], '#fff'), 0, 3.1, .12, s);
  for (let i = -1; i <= 1; i++) box(w*.16, rr(.4, .95), .22, DISP[(rnd()*5) | 0], i*w*.22 - w*.08, .75, .2, s);
  if (ico) { box(.12, 1, 1, emo(ico), -w/2 + .25, 3.45, .75, s); box(.06, .06, .8, M.dark, -w/2 + .25, 4, .4, s); }
  const aw = box(w + .3, .1, 1.6, AWN[a], 0, 2.5, .85, s); aw.rotation.x = .3; g.add(s);
}
function barn(g, x, z, k) {
  const b = new T.Group(); gableHouse(b, 11, 5, 15, M.wood, M.roof, .62, lam(0x9b6a3c, { side:T.DoubleSide })); box(4.2, 4, .2, M.inside, 0, 2, 7.55, b); box(4.6, .3, .25, M.white, 0, 4.1, 7.6, b);
  [-1, 1].forEach(s => { const d = box(.25, 4.7, .12, M.white, s*1.05, 2, 7.62, b); d.rotation.z = s*.45; });
  b.position.set(x, 0, z); b.rotation.y = ROTK[k]; g.add(b); if (k % 2) addSolid(x - 7.5, z - 5.5, x + 7.5, z + 5.5); else addSolid(x - 5.5, z - 7.5, x + 5.5, z + 7.5);
}
function house(g, x, z, k) {
  const h = new T.Group(), c = HMAT[(rnd()*HMAT.length) | 0]; gableHouse(h, 6.4, 3.1, 8, c[0], c[1], .72, c[2]); box(1, 1.9, .1, M.woodL, 0, .95, 4.03, h); [-1.9, 1.9].forEach(xx => box(1, 1, .1, M.win, xx, 1.8, 4.03, h)); box(.6, 1.2, .6, M.brick, 1.4, 4.9, -1.5, h);
  h.position.set(x, 0, z); h.rotation.y = ROTK[k]; g.add(h); if (k % 2) addSolid(x - 4, z - 3.2, x + 4, z + 3.2); else addSolid(x - 3.2, z - 4, x + 3.2, z + 4);
}
