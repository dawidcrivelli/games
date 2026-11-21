// Maszyny rolnicze (Żniwa): makeScrew (ślimak), buildCombine (kombajn z hederem zbożowym / do kukurydzy), buildPlough, buildSeeder,
// buildBaler (prasa), buildSlurryTank (beczkowóz), buildBigTractor, buildTrailer. Mały traktor: models/tractor.js.
// wymaga: lib/3d/three.js, lib/3d/shapes.js, models/vehicle-parts.js, models/people.js; od gry: scene, paleta M
'use strict';
function makeScrew(len, r0, r1, mat) {            // stożkowy ślimak: oś Y, grubszy koniec na dole
  const g = new T.Group(); mesh(new T.CylinderGeometry(r1, r0, len, 8), M.steel, 0, 0, 0, g);
  const n = Math.round(len/.055);
  for (let k = 0; k < n; k++) { const t = k/(n - 1), r = r0 + (r1 - r0)*t; const f = box((r + .05)*2, .028, .05, mat, 0, -len/2 + t*len, 0, g); f.rotation.y = k*.62; }
  return bake(g);
}
function buildCombine() {
  const v = new T.Group(), st = new T.Group(), P = {};
  // ---------- kadłub
  rbox(2.7, 1.9, 4.6, M.cBlue, 0, 2.05, -.3, st, .2);
  box(1.6, .4, 4.4, M.dark, 0, .95, -.5, st);
  [1.36, -1.36].forEach(x => {
    box(.03, .5, 4.4, M.white, x, 2.7, -.3, st); box(.032, .09, 4.4, M.cRed, x, 2.41, -.3, st);
    box(.036, .06, 4.56, M.cBlueD, x, 1.13, -.3, st); box(.036, .06, 4.56, M.cBlueD, x, 2.97, -.3, st);
    [-1.75, -.55, .65].forEach(z => box(.036, 1.36, .05, M.cBlueD, x, 1.83, z, st));
    [[-1.15, 1.75], [.05, 1.75]].forEach(p => { box(.04, .62, .95, M.cBlueD, x, p[1], p[0], st); box(.06, .05, .16, M.steelL, x, p[1] + .12, p[0] + .36, st); });
    rbox(.74, .09, 1.6, M.cBlueD, x*1.27, 2.02, 1.2, st, .04); { const f1 = rbox(.74, .08, .5, M.cBlueD, x*1.27, 1.87, 2.17, st, .035); f1.rotation.x = .7; const f2 = rbox(.74, .08, .5, M.cBlueD, x*1.27, 1.87, .23, st, .035); f2.rotation.x = -.7; }                       // błotnik nad dużym kołem
    box(.06, .1, .2, M.red, x*.94, 2.0, -3.72, st); box(.06, .1, .2, M.amber, x*.94, 2.14, -3.72, st);
  });
  // zbiornik ziarna (otwarty) z poprzeczką
  box(2.5, .9, .07, M.cBlueD, 0, 3.45, -1.5, st); box(2.5, .9, .07, M.cBlueD, 0, 3.45, .7, st);
  box(.07, .9, 2.2, M.cBlueD, 1.25, 3.45, -.4, st); box(.07, .9, 2.2, M.cBlueD, -1.25, 3.45, -.4, st);
  [-1.5, .7].forEach(z => box(2.56, .05, .1, M.cRed, 0, 3.91, z, st)); [-1.25, 1.25].forEach(x => box(.1, .05, 2.26, M.cRed, x, 3.91, -.4, st));
  cylX(.03, 2.5, M.steel, 0, 3.8, -.4, st, 6);
  // silnik: maska, żaluzje, komin z kolankiem, filtr powietrza, poręcz
  rbox(2.3, .72, 1.12, M.white, 0, 3.35, -2.1, st, .14);
  for (let i = 0; i < 6; i++) box(1.7, .03, .06, M.dark, 0, 3.71, -2.5 + i*.16, st);
  box(1.9, .46, .04, M.dark, 0, 3.35, -2.66, st); for (let i = 0; i < 5; i++) box(1.9, .025, .06, M.steel, 0, 3.17 + i*.09, -2.67, st);
  cylY(.07, 1.2, M.dark, .85, 4.2, -2.1, st); const tip = cylY(.07, .25, M.dark, .85, 4.85, -2.17, st); tip.rotation.x = -.7;
  cylY(.1, .3, M.steel, .85, 3.95, -2.1, st);
  cylY(.15, .5, M.cRed, -.8, 3.95, -2.1, st); cylY(.22, .1, M.dark, -.8, 4.25, -2.1, st);
  cylZ(.022, 1.1, M.cRed, 1.3, 3.55, -2.1, st, 6); [-2.62, -1.58].forEach(z => cylY(.022, .55, M.cRed, 1.3, 3.28, z, st, 6));
  cylZ(.24, 1.3, M.uGrayD, 1.08, .86, -.9, st, 12);                             // zbiornik paliwa
  // tylna osłona wytrząsaczy + trójkąt i pasy ostrzegawcze
  const hg = new T.Group(); hg.position.set(0, 2.4, -3.2); hg.rotation.x = -.3; st.add(hg);
  rbox(2.5, 1.2, 1.6, M.cBlue, 0, 0, 0, hg, .22); box(2.52, .06, 1.62, M.cBlueD, 0, .6, 0, hg);
  { const tri = s => { const sh = new T.Shape(); sh.moveTo(-.34*s, -.26*s); sh.lineTo(.34*s, -.26*s); sh.lineTo(0, .33*s); sh.lineTo(-.34*s, -.26*s); return new T.ShapeGeometry(sh); };
    const t1 = mesh(tri(1.3), M.red, 0, .05, -.812, hg); t1.rotation.y = Math.PI; const t2 = mesh(tri(.9), M.amber, 0, .05, -.818, hg); t2.rotation.y = Math.PI;
    [-.9, .9].forEach(x => { const h = mesh(new T.PlaneGeometry(.45, .45), M.hazard, x, -.3, -.812, hg); h.rotation.y = Math.PI; }); }
  // rura wyładowcza z wysypem
  box(.4, .4, .4, M.cBlue, -1.35, 3.7, .35, st);
  // ---------- kabina
  box(1.9, .1, 1.6, M.dark, 0, 2.5, 2.1, st);
  rbox(2.16, .2, 1.98, M.white, 0, 4.23, 2.12, st, .09); box(2.0, .05, 1.75, M.dark, 0, 4.13, 2.12, st);
  [[-.92, 1.34], [.92, 1.34], [-.92, 2.86], [.92, 2.86]].forEach(p => box(.09, 1.65, .09, M.dark, p[0], 3.35, p[1], st));
  box(1.9, .1, .07, M.dark, 0, 2.6, 2.88, st); cylX(.09, 2.1, M.white, 0, 4.2, 3.03, st, 10); cylX(.09, 2.1, M.white, 0, 4.2, 1.2, st, 10);
  box(1.9, 1.65, .07, M.cBlue, 0, 3.35, 1.3, st);
  box(.07, .5, 1.5, M.cBlue, .93, 2.8, 2.1, st); box(.07, .5, 1.5, M.cBlue, -.93, 2.8, 2.1, st);
  box(1.76, 1.5, .03, M.glass, 0, 3.4, 2.88, st);
  box(.03, 1.1, 1.44, M.glass, .94, 3.6, 2.1, st); box(.03, 1.1, 1.44, M.glass, -.94, 3.6, 2.1, st);
  { const mo = mesh(new T.PlaneGeometry(.28, .195), M.monitor, -.7, 3.26, 2.74, st); mo.rotation.y = Math.PI - .55; const bk = box(.32, .23, .04, M.dark, -.712, 3.26, 2.762, st); bk.rotation.y = -.55; cylY(.015, .5, M.dark, -.7, 3.0, 2.78, st, 5); }
  box(.05, .06, .18, M.steelL, -.99, 3.0, 2.6, st);                              // klamka
  [-.75, -.3, .3, .75].forEach(x => { box(.2, .14, .12, M.dark, x, 4.33, 3.0, st); box(.16, .1, .02, M.lamp, x, 4.33, 3.065, st); });
  // wnętrze: fotel, konsola, zegary, dźwignie, pedały
  box(.6, .12, .55, M.seat, 0, 2.95, 1.75, st); box(.6, .62, .1, M.seat, 0, 3.3, 1.48, st); box(.3, .16, .1, M.seat, 0, 3.7, 1.47, st);
  cylY(.06, .4, M.dark, 0, 2.72, 1.75, st, 8);
  box(1.0, .22, .24, M.dark, 0, 2.82, 2.72, st);
  [-.3, -.08].forEach(x => { const g = cylY(.085, .02, M.gaugeW, x, 2.94, 2.72, st, 14); g.rotation.x = -.5; const r = cylY(.095, .012, M.steelL, x, 2.937, 2.722, st, 14); r.rotation.x = -.5; });
  [.14, .24, .34].forEach((x, i) => box(.05, .03, .05, [M.gaugeR, M.gaugeG, M.amber][i], x, 2.94, 2.72, st));
  const col = cylY(.03, .5, M.steel, 0, 3.0, 2.63, st, 6); col.rotation.x = -.55;
  box(.3, .5, 1.0, M.dark, .72, 2.78, 2.05, st);
  [[.66, 2.35, M.gaugeR], [.78, 2.2, M.cRed], [.66, 2.0, M.gaugeG], [.78, 1.82, M.gaugeW]].forEach(l => { const c = cylY(.014, .26, M.steel, l[0], 3.13, l[1], st, 5); c.rotation.x = .25; mesh(new T.SphereGeometry(.036, 8, 6), l[2], l[0], 3.27, l[1] + .035, st); });
  [-.22, .22].forEach(x => { const p = box(.14, .03, .22, M.steel, x, 2.62, 2.7, st); p.rotation.x = -.6; });
  // drabinka z poręczą, lusterka, kogut, reflektory
  box(.06, 1.5, .06, M.steel, -1.45, 1.8, 1.7, st); box(.06, 1.5, .06, M.steel, -1.45, 1.8, 2.3, st);
  [1.2, 1.6, 2.0, 2.4].forEach(y => box(.06, .05, .6, M.steel, -1.45, y, 2.0, st));
  const hr = cylY(.02, 1.5, M.cRed, -1.5, 3.1, 1.5, st, 6); box(.5, .05, .7, M.steel, -1.2, 2.5, 2.0, st);
  [1, -1].forEach(s => { box(.5, .04, .04, M.dark, s*1.2, 3.9, 2.9, st); box(.05, .38, .22, M.dark, s*1.45, 3.8, 2.9, st); box(.02, .32, .18, M.chrome, s*1.45, 3.8, 2.875, st); });
  cylY(.1, .08, M.dark, .6, 4.3, 2.1, st, 10);
  // osie, pasy
  cylX(.13, 3.5, M.dark, 0, .95, 1.2, st); cylX(.09, 2.6, M.dark, 0, .55, -2.2, st); box(.3, .5, .3, M.dark, 0, .8, -2.2, st);
  const b1 = box(.04, .06, 1.75, M.dark, -1.42, 1.9, -.1, st); b1.rotation.x = .4;
  const b2 = box(.04, .06, 1.3, M.dark, -1.42, 2.05, -1.25, st); b2.rotation.x = -.75;
  // przenośnik pochyły i wanna hedera (wspólna)
  const fh = rbox(1.3, .7, 2.1, M.cBlueD, 0, 1.4, 2.85, st, .1); fh.rotation.x = .52;
  [.5, -.5].forEach(x => { const h = cylZ(.05, 1.3, M.chrome, x, .95, 2.9, st, 8); h.rotation.x = Math.PI/2 + .4; });
  box(5.6, 1.0, .08, M.cBlue, 0, .85, 3.75, st);
  box(5.6, .08, 1.3, M.cBlue, 0, .33, 4.38, st);
  box(.08, 1.0, 1.7, M.cBlue, 2.8, .8, 4.5, st); box(.08, 1.0, 1.7, M.cBlue, -2.8, .8, 4.5, st);
  cylX(.06, 5.6, M.cBlue, 0, 1.36, 3.75, st, 8);
  [-1.9, 1.9].forEach(x => { const h = mesh(new T.PlaneGeometry(.5, .5), M.hazard, x, .95, 3.705, st); h.rotation.y = Math.PI; });
  // ---------- detale: rozdrabniacz, gaśnica, GPS, antena, węże, rama hedera, odblaski, poręcz
  rbox(2.2, .55, .8, M.dark, 0, 1.32, -3.5, st, .08); box(2.3, .05, .5, M.cBlueD, 0, 1.0, -3.75, st);
  cylY(.09, .46, M.cRed, -1.44, 1.5, -2.25, st, 12); cylY(.035, .1, M.dark, -1.44, 1.78, -2.25, st, 6); box(.03, .3, .22, M.dark, -1.38, 1.5, -2.25, st);
  rbox(.55, .3, .34, M.dark, 1.08, 1.3, .0, st, .04); box(.06, .04, .1, M.chrome, 1.37, 1.36, 0, st);
  mesh(new T.SphereGeometry(.17, 14, 8, 0, 6.283, 0, 1.571), M.white, 0, 4.32, 2.5, st); cylY(.008, .95, M.dark, -.85, 4.8, 1.4, st, 4); mesh(new T.SphereGeometry(.03, 6, 5), M.dark, -.85, 5.28, 1.4, st);
  mesh(new T.SphereGeometry(.12, 10, 8), M.beacon, -.6, 4.44, 2.1, st); cylY(.1, .08, M.dark, -.6, 4.33, 2.1, st, 10);
  hose([[.4, 2.45, 2.7], [.46, 2.0, 3.05], [.52, 1.55, 3.32], [.95, 1.3, 3.7]], .026, M.dark, st); hose([[.55, 2.45, 2.7], [.64, 2.0, 3.1], [.72, 1.55, 3.36], [1.3, 1.33, 3.7]], .026, M.dark, st);
  hose([[-.45, 2.45, 2.7], [-.52, 1.95, 3.06], [-.6, 1.5, 3.36], [-1.4, 1.3, 3.7]], .02, M.cRed, st);
  hose([[.9, 3.0, -1.5], [1.15, 3.2, -1.75], [1.0, 3.5, -1.62]], .03, M.dark, st);
  cylX(.05, 5.5, M.dark, 0, .5, 3.68, st, 8); [-2.1, -1.05, 1.05, 2.1].forEach(x => box(.07, .9, .07, M.dark, x, .86, 3.69, st));
  [-2.2, -.75, .75, 2.2].forEach(x => { const sk = rbox(.32, .05, .95, M.steel, x, .27, 4.32, st, .02); });
  [-1.37, 1.37].forEach(x => { [-2.2, -1.0, .2].forEach(z => box(.02, .06, .16, M.amber, x, 1.22, z, st)); box(.022, .4, .9, M.hazardY, x, 1.5, -1.9, st); });
  hose([[-1.02, 2.62, 1.42], [-1.24, 3.0, 1.44], [-1.24, 3.6, 1.44], [-1.02, 3.95, 1.42]], .02, M.white, st);
  box(.02, 1.45, .035, M.dark, -.96, 3.4, 1.5, st); box(.02, 1.45, .035, M.dark, -.96, 3.4, 2.72, st); box(.02, .035, 1.25, M.dark, -.96, 2.68, 2.1, st);
  [1.72, -1.72].forEach(x => { const fl = rbox(.66, .5, .04, M.dark, x, 1.1, .2, st, .015); });                                         // chlapacze
  { const pl = mesh(new T.PlaneGeometry(.5, .16), M.plate, 0, 1.75, -4.02, st); pl.rotation.y = Math.PI; }
  v.add(bake(st));
  P.spreaders = [-.6, .6].map((x, i) => { const g = new T.Group(); cylY(.44, .04, M.steel, 0, 0, 0, g, 16);
    for (let k = 0; k < 4; k++) { const f = box(.84, .1, .03, M.cRed, 0, -.07, 0, g); f.rotation.y = k*Math.PI/4; }
    const b = bake(g); b.position.set(x, .96, -3.78); b.userData.d = i ? 1 : -1; v.add(b); return b; });

  { const pg = new T.Group(); cylZ(.17, 3.6, M.cBlue, -.15, .1, -1.75, pg); cylY(.17, .35, M.white, -.15, -.08, -3.45, pg); [-2.75, -1.55, -.35].forEach(z => cylZ(.185, .06, M.dark, -.15, .1, z, pg));
    P.pipe = bake(pg); P.pipe.position.set(-1.35, 3.7, .35); v.add(P.pipe); }
  // ziarno w zbiorniku
  P.grain = box(2.42, .06, 2.1, M.grain, 0, 3.05, -.4, v); P.grain.castShadow = false;
  // obrotowe sito chłodnicy
  { const g = new T.Group(); cylX(.3, .04, M.dark, 0, 0, 0, g, 16); cylX(.32, .02, M.steelL, -.01, 0, 0, g, 16);
    for (let i = 0; i < 4; i++) { const s = box(.05, .58, .04, M.steelL, .01, 0, 0, g); s.rotation.x = i*Math.PI/4; }
    P.screen = bake(g); P.screen.position.set(1.17, 3.35, -2.1); v.add(P.screen); }

  // ---------- heder zbożowy: rozdzielacze, ramiona, siłowniki, nagarniacz, listwa tnąca
  { const gh = new T.Group();
    [2.8, -2.8].forEach(x => { const c = mesh(new T.ConeGeometry(.2, 1.0, 6), M.cRed, x, .5, 5.75, gh); c.rotation.x = Math.PI/2;
      const a = box(.08, .08, 1.7, M.cBlue, x*.97, 1.48, 4.3, gh); a.rotation.x = -.1;
      const h1 = cylZ(.05, .5, M.dark, x*.93, 1.18, 4.0, gh, 8); h1.rotation.x = Math.PI/2 - .5; const h2 = cylZ(.025, .5, M.chrome, x*.93, 1.38, 4.36, gh, 6); h2.rotation.x = Math.PI/2 - .5; });
    for (let i = 0; i < 10; i++) { const l = box(.028, .028, .62, M.steel, -2.43 + i*.54, .35, 5.32, gh); l.rotation.x = .14; }          // podnośniki łanu
    rbox(.14, .5, .9, M.cBlueD, -2.9, 1.25, 4.45, gh, .04); cylX(.16, .05, M.cRed, -2.99, 1.55, 4.95, gh, 12);                              // osłona napędu nagarniacza
    P.grainHead = bake(gh); v.add(P.grainHead); }
  { const g = new T.Group(); cylX(.06, 5.4, M.steel, 0, 0, 0, g, 8);
    for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2, cy = Math.cos(a), sz = Math.sin(a);
      const bt = box(5.2, .05, .1, M.cRed, 0, cy*.72, sz*.72, g); bt.rotation.x = a;
      for (let k = 0; k < 14; k++) { const t = box(.025, .32, .025, M.steel, -2.5 + k*.385, cy*.9, sz*.9, g); t.rotation.x = a + .25; }
      [-2.62, 0, 2.62].forEach(x => { const s = box(.05, .72, .07, M.cRed, x, cy*.36, sz*.36, g); s.rotation.x = a; }); }
    [-2.62, 2.62].forEach(x => cylX(.2, .04, M.cRed, x, 0, 0, g, 12));
    P.reel = bake(g); P.reel.position.set(0, 1.55, 5.0); v.add(P.reel); }
  { const g = new T.Group(); cylX(.2, 5.36, M.steel, 0, 0, 0, g, 12);
    for (let i = 0; i <= 52; i++) { const x = -2.6 + i*.1; const f = box(.04, .74, .15, M.steelL, x, 0, 0, g); f.rotation.x = i*.42*(x < 0 ? 1 : -1); }
    [-.3, -.1, .1, .3].forEach((x, i) => { const f = cylY(.015, .62, M.steel, x, 0, 0, g, 5); f.rotation.x = i*.8; });
    P.auger = bake(g); P.auger.position.set(0, .74, 4.08); v.add(P.auger); }
  { const g = new T.Group(); box(5.5, .03, .09, M.steel, 0, 0, 0, g);
    for (let i = 0; i < 30; i++) { const c = mesh(new T.ConeGeometry(.055, .2, 4), M.steelL, -2.66 + i*.1835, 0, .12, g); c.rotation.x = Math.PI/2; }
    P.knife = bake(g); P.knife.position.set(0, .38, 5.02); v.add(P.knife); }

  // ---------- przystawka do kukurydzy: stożkowe rozdzielacze, ślimaki, łańcuchy
  { const ch = new T.Group(), cs = new T.Group(); P.screws = [];
    for (let i = 0; i < 7; i++) { const x = -3 + i, outer = i === 0 || i === 6, R = outer ? .36 : .27, th = Math.PI/2 + .2;
      box(R*2, .34, 1.15, M.cBlue, x, .66, 4.42, cs);
      const c = mesh(new T.ConeGeometry(R, 1.7, 12), M.cBlue, x, .47, 5.82, cs); c.rotation.x = th; c.scale.z = .62;
      const y = mesh(new T.ConeGeometry(R*.34, .52, 10), M.cRed, x, .352, 6.41, cs); y.rotation.x = th; y.scale.z = .7;
      box(.04, .03, 1.2, M.cBlueD, x, .835, 4.45, cs); }
    box(6.6, .12, .16, M.cBlueD, 0, .9, 3.95, cs);
    [-3.38, 3.38].forEach(x => { box(.06, .8, 1.3, M.cBlue, x, .7, 4.4, cs); const h = mesh(new T.PlaneGeometry(.5, .5), M.hazard, x*.75, .97, 3.86, cs); h.rotation.y = Math.PI; });
    ch.add(bake(cs));
    const addScrew = (s, x, y, z, tilt, dir) => { const w = new T.Group(); w.position.set(x, y, z); w.rotation.x = Math.PI/2 + tilt; w.add(s); ch.add(w); P.screws.push({ n:s, dir }); };
    for (let gi = 0; gi < 6; gi++) { const gx = -2.5 + gi;                         // walce wciągające w każdym rzędzie
      addScrew(makeScrew(1.35, .075, .02, M.steelL), gx - .1, .36, 5.1, .1, 1); addScrew(makeScrew(1.35, .075, .02, M.steelL), gx + .1, .36, 5.1, .1, -1); }
    addScrew(makeScrew(1.5, .12, .035, M.cRed), -3, .93, 5.35, .26, 1); addScrew(makeScrew(1.5, .12, .035, M.cRed), 3, .93, 5.35, .26, -1);   // boczne ślimaki
    P.lugs = new T.InstancedMesh(new T.BoxGeometry(.07, .05, .1), M.cRed, 72); P.lugs.frustumCulled = false; P.lugs.castShadow = true; ch.add(P.lugs);
    P.cornHead = ch; ch.visible = false; v.add(ch); }

  // wytrząsacze
  P.walkers = [-.9, -.3, .3, .9].map(x => { const w = box(.52, .08, 1.4, M.steelL, x, 1.5, -3.3, v); w.castShadow = true; return w; });
  // koła pasowe
  P.pulleys = [[2.2, .6, .4], [1.6, -.8, .3], [2.5, -1.7, .22]].map(p => { const g = new T.Group();
    cylX(p[2], .07, M.cRed, 0, 0, 0, g, 16); cylX(p[2]*.3, .1, M.dark, 0, 0, 0, g, 8);
    for (let i = 0; i < 3; i++) { const s = box(.09, p[2]*1.7, .07, M.dark, 0, 0, 0, g); s.rotation.x = i*Math.PI/3; }
    const b = bake(g); b.position.set(-1.43, p[0], p[1]); b.userData.k = .4/p[2]; v.add(b); return b; });
  P.beacon = mesh(new T.SphereGeometry(.12, 10, 8), M.beacon, .6, 4.42, 2.1, v);
  { const tilt = new T.Group(); tilt.position.set(0, 3.22, 2.5); tilt.rotation.x = -.55;
    P.sw = makeSteeringWheel(.19); tilt.add(P.sw); v.add(tilt); }
  P.needles = [gaugeNeedle(v, -.3, 2.95, 2.715, -.5, .075), gaugeNeedle(v, -.08, 2.95, 2.715, -.5, .075)];
  // koła
  const wheels = [], steerNodes = [];
  [1.72, -1.72].forEach(x => { const w = makeWheel(.95, .62, M.cRed, 20); w.position.set(x, .95, 1.2); v.add(w); wheels.push({ n:w, r:.95 }); });
  [1.25, -1.25].forEach(x => { const pv = new T.Group(); pv.position.set(x, .55, -2.2); const w = makeWheel(.55, .4, M.cRed, 14); pv.add(w); v.add(pv);
    wheels.push({ n:w, r:.55 }); steerNodes.push({ n:pv, s:-1 }); });
  const driver = makeFarmer(.75); driver.position.set(0, 3.02, 1.75); v.add(driver);
  scene.add(v);
  return { g:v, inner:v, P, wheels, steerNodes, driver, baleFrom:new T.Vector3(0, 1.7, -3.7), baleTo:new T.Vector3(0, .32, -5.3), x:0, z:0, h:0, v:0, steer:0, rpm:0,
    maxF:5.6, maxR:2.6, turnK:.31, turnRate:1.7, radius:3.3, eye:new T.Vector3(0, 3.74, 1.92), look:new T.Vector3(0, 2.55, 9),
    chase:[13.5, 6.6], dust:[[1.72, -.2], [-1.72, -.2]] };
}
function buildPlough() { const g = new T.Group();
  box(.1, .7, .1, M.imp, .35, 1.0, -.15, g); box(.1, .7, .1, M.imp, -.35, 1.0, -.15, g); box(.9, .1, .1, M.imp, 0, 1.3, -.15, g); box(.1, .1, .9, M.imp, 0, 1.0, -.55, g);
  const beam = rbox(.16, .16, 3.6, M.imp, 0, 1.0, -2.1, g, .04); beam.rotation.y = .62;
  for (let i = 0; i < 4; i++) { const t = i/3, x = 1.0 - t*2.0, z = -.85 - t*2.55;
    box(.09, .75, .09, M.imp, x, .62, z, g);
    const m = rbox(.62, .5, .05, M.steelL, x + .12, .28, z - .12, g, .02); m.rotation.set(.35, -.95, 0);
    const s = box(.5, .05, .12, M.steel, x + .2, .05, z + .12, g); s.rotation.y = -.95; }
  const w = makeWheel(.32, .14, M.impY, 0, true); w.position.set(-1.45, .32, -2.6); const b = bake(g); b.add(w); return b; }
function buildSeeder() { const g = new T.Group();
  box(.1, .7, .1, M.dark, .35, 1.0, -.15, g); box(.1, .7, .1, M.dark, -.35, 1.0, -.15, g); box(.1, .1, 1.0, M.dark, .35, .75, -.6, g); box(.1, .1, 1.0, M.dark, -.35, .75, -.6, g);
  rbox(3.7, .7, .85, M.imp, 0, 1.35, -1.3, g, .1); rbox(3.74, .08, .9, M.impY, 0, 1.74, -1.3, g, .03); box(3.7, .1, .12, M.dark, 0, .82, -1.3, g);
  for (let i = 0; i < 13; i++) { const x = -1.68 + i*.28; const t = cylY(.022, .75, M.dark, x, .62, -1.55, g, 5); t.rotation.x = -.5; cylX(.2, .02, M.steelL, x, .2, -1.78, g, 12); box(.04, .3, .04, M.dark, x, .38, -1.75, g); }
  box(3.5, .04, .34, M.steel, 0, .78, -2.05, g); [-1.7, 0, 1.7].forEach(x => box(.04, .45, .04, M.steel, x, 1.0, -2.2, g)); cylX(.02, 3.5, M.impY, 0, 1.22, -2.2, g, 5);
  const b = bake(g); [1.95, -1.95].forEach(x => { const w = makeWheel(.38, .18, M.impY, 0, true); w.position.set(x, .38, -1.3); b.add(w); }); return b; }
function buildBaler(P) { const g = new T.Group();
  box(.12, .12, 1.0, M.dark, 0, .75, -.5, g);
  rbox(1.7, 1.25, 1.1, M.imp, 0, 1.15, -1.5, g, .12); cylX(.92, 1.72, M.imp, 0, 1.25, -2.5, g, 22); cylX(.94, .06, M.impY, .87, 1.25, -2.5, g, 22); cylX(.94, .06, M.impY, -.87, 1.25, -2.5, g, 22);
  box(1.74, .06, .06, M.dark, 0, 2.05, -2.0, g); [.875, -.875].forEach(x => { for (let i = 0; i < 5; i++) { const a = i*.7 + .3; cylX(.07, .04, M.steelL, x*1.01, 1.25 + Math.sin(a)*.6, -2.5 + Math.cos(a)*.6, g, 8); } });
  box(1.5, .3, .5, M.dark, 0, .55, -1.0, g);
  const b = bake(g); [1.0, -1.0].forEach(x => { const w = makeWheel(.42, .22, M.impY, 0, true); w.position.set(x, .42, -2.3); b.add(w); });
  const pk = new T.Group(); cylX(.12, 1.5, M.dark, 0, 0, 0, pk, 8);
  for (let i = 0; i < 6; i++) for (let k = 0; k < 9; k++) { const a = i/6*6.283, t = box(.02, .2, .02, M.steelL, -.68 + k*.17, Math.cos(a)*.2, Math.sin(a)*.2, pk); t.rotation.x = a; }
  P.pick = bake(pk); P.pick.position.set(0, .34, -.95); b.add(P.pick); return b; }
function buildSlurryTank(P) { const g = new T.Group();     // beczkowóz z gnojówką: zielona beczka, koła, rozbryzgowy talerz z tyłu
  box(.12, .12, 1.0, M.dark, 0, .75, -.5, g); box(.9, .1, .1, M.dark, 0, .75, -.15, g); [.4, -.4].forEach(x => box(.08, .6, .08, M.dark, x, 1.0, -.15, g));
  const L = 2.5, zc = -1.85;
  cylZ(.82, L, M.tankG, 0, 1.45, zc, g, 20); [zc + L/2, zc - L/2].forEach(z => { const d = mesh(new T.SphereGeometry(.82, 20, 10, 0, 6.283, 0, Math.PI/2), M.tankG, 0, 1.45, z, g); d.rotation.x = z > zc ? Math.PI/2 : -Math.PI/2; d.scale.y = .28; });
  [zc + .75, zc - .75].forEach(z => cylZ(.84, .1, M.impY, 0, 1.45, z, g, 20));       // obręcze
  cylY(.26, .2, M.dark, 0, 2.3, zc - .2, g, 14); cylY(.3, .05, M.steelL, 0, 2.41, zc - .2, g, 14);   // właz
  box(1.9, .1, 2.2, M.dark, 0, .62, zc, g);                                            // rama
  cylY(.06, .9, M.steelL, .86, 1.5, zc + .5, g, 6);                                     // wskaźnik poziomu
  for (let i = 0; i < 5; i++) box(.4, .03, .03, M.steel, .62, .8 + i*.28, zc - L/2 - .05, g);   // drabinka
  [.44, .8].forEach(x => box(.03, 1.3, .03, M.steel, x, 1.4, zc - L/2 - .03, g));
  cylY(.12, .7, M.dark, 0, .85, zc - L/2 - .15, g, 10);                                 // rura w dół do talerza
  const plate = rbox(1.1, .06, .5, M.steelL, 0, .5, zc - L/2 - .35, g, .02); plate.rotation.x = -.45;
  const b = bake(g); [1.12, -1.12].forEach(x => { const w = makeWheel(.62, .3, M.impY, 0, true); w.position.set(x, .62, zc); b.add(w); });
  P.splash = new T.Vector3(0, .55, zc - L/2 - .55);                                    // skąd tryska (w układzie narzędzia)
  return b; }
function buildBigTractor() {
  const v = new T.Group(), st = new T.Group(), P = {};
  rbox(.9, .7, 3.7, M.uGrayD, 0, 1.0, .45, st, .08); cylX(.15, 2.3, M.uGrayD, 0, 1.0, -.75, st, 10); cylX(.1, 2.0, M.uGrayD, 0, .7, 1.9, st, 8); box(.3, .5, .3, M.uGrayD, 0, .85, 1.9, st);
  // maska
  rbox(1.02, .78, 2.25, M.bBlue, 0, 1.76, 1.45, st, .18); rbox(1.0, .52, .1, M.dark, 0, 1.68, 2.56, st, .03);
  for (let i = 0; i < 5; i++) box(.86, .022, .03, M.steelL, 0, 1.5 + i*.09, 2.62, st);
  [.32, -.32].forEach(x => { rbox(.24, .12, .05, M.chrome, x, 2.0, 2.57, st, .02); box(.2, .08, .02, M.lamp, x, 2.0, 2.6, st); });
  [.515, -.515].forEach(x => { box(.02, .09, 2.1, M.white, x, 2.0, 1.45, st); box(.02, .24, .9, M.dark, x, 1.66, 1.7, st); for (let i = 0; i < 4; i++) box(.025, .02, .86, M.bBlueD, x, 1.58 + i*.055, 1.7, st); });
  rbox(.5, .22, .08, M.uGrayD, 0, .78, 2.62, st, .03); [0, 1, 2, 3].forEach(i => rbox(.2, .3, .3, M.uGrayD, -.36 + i*.24, .62, 2.72, st, .03));     // obciążniki
  // kabina
  rbox(1.74, .16, 1.72, M.dark, 0, 1.46, -.55, st, .04); rbox(1.94, .22, 2.0, M.white, 0, 3.16, -.55, st, .1);
  [[.8, .26], [-.8, .26], [.8, -1.36], [-.8, -1.36]].forEach(p => box(.08, 1.6, .08, M.dark, p[0], 2.3, p[1], st));
  box(1.56, 1.5, .03, M.glass, 0, 2.3, .275, st); box(1.56, 1.5, .03, M.glass, 0, 2.3, -1.375, st); box(.03, 1.5, 1.56, M.glass, .825, 2.3, -.55, st); box(.03, 1.5, 1.56, M.glass, -.825, 2.3, -.55, st);
  [.83, -.83].forEach(x => { rbox(.06, .46, 1.58, M.bBlue, x, 1.76, -.55, st, .02); box(.05, .05, .16, M.chrome, x*1.03, 2.0, -.1, st); });
  [.62, -.62].forEach(x => { [.44, -1.54].forEach(z => { box(.2, .1, .1, M.dark, x, 3.3, z, st); box(.16, .07, .02, M.lamp, x, 3.3, z + (z > 0 ? .055 : -.055), st); }); });
  cylY(.09, .07, M.dark, .65, 3.3, -.9, st, 10); mesh(new T.SphereGeometry(.11, 10, 8), M.beacon, .65, 3.41, -.9, st);
  // błotniki, schodki, zbiornik, wydech, lusterka
  [1.15, -1.15].forEach(x => { for (let i = 0; i < 8; i++) { const a = (16 + i*21)*Math.PI/180; const f = rbox(.66, .06, .46, M.bBlue, x, 1.0 + Math.sin(a)*1.14, -.75 + Math.cos(a)*1.14, st, .025); f.rotation.x = Math.PI/2 - a; }
    box(.05, .1, .2, M.red, x, 1.55, -1.87, st); box(.05, .08, .2, M.amber, x, 1.66, -1.86, st);
    rbox(.5, .06, 1.0, M.bBlueD, x*.87, 1.48, 1.9, st, .025); });
  [.8, .5].forEach((y, i) => box(.36, .04, .32, M.steel, 1.02, y, .25 + i*.02, st)); box(.04, .5, .04, M.steel, 1.2, .72, .1, st);
  cylZ(.26, 1.2, M.uGrayD, -.66, .95, .35, st, 12); cylY(.055, 1.75, M.dark, -.74, 2.75, .44, st, 8); cylY(.08, .5, M.chrome, -.74, 2.3, .44, st, 10);
  [1, -1].forEach(s => { box(.4, .03, .03, M.dark, s*1.02, 2.9, .3, st); rbox(.05, .34, .2, M.dark, s*1.24, 2.76, .3, st, .02); box(.02, .28, .15, M.chrome, s*1.24, 2.76, .27, st); });
  // wnętrze
  rbox(.56, .12, .52, M.seat, 0, 1.92, -.8, st, .05); rbox(.56, .6, .1, M.seat, 0, 2.26, -1.06, st, .04); cylY(.06, .34, M.dark, 0, 1.7, -.8, st, 8);
  rbox(.9, .2, .22, M.dark, 0, 2.0, .1, st, .04); [.15, -.15].forEach(x => { const g = cylY(.07, .02, M.gaugeW, x, 2.11, .1, st, 12); g.rotation.x = -.5; });
  { const col = cylY(.025, .4, M.steel, 0, 2.12, -.08, st, 6); col.rotation.x = -.55; const mo = mesh(new T.PlaneGeometry(.26, .18), M.monitor, -.6, 2.4, .12, st); mo.rotation.y = Math.PI - .5; }
  // TUZ
  [.4, -.4].forEach(x => { box(.07, .07, 1.0, M.dark, x, .72, -2.0, st); box(.05, .5, .05, M.steel, x, 1.0, -1.9, st); }); box(.05, .05, .9, M.steel, 0, 1.3, -1.95, st);
  v.add(bake(st));
  { const tilt = new T.Group(); tilt.position.set(0, 2.28, -.22); tilt.rotation.x = -.55; P.sw = makeSteeringWheel(.18); tilt.add(P.sw); v.add(tilt); }
  P.needles = [gaugeNeedle(v, -.15, 2.12, .095, -.5, .06), gaugeNeedle(v, .15, 2.12, .095, -.5, .06)];
  const wheels = [], steerNodes = [];
  [1.15, -1.15].forEach(x => { const w = makeWheel(1.0, .6, M.white, 22); w.position.set(x, 1.0, -.75); v.add(w); wheels.push({ n:w, r:1.0 }); });
  [1.0, -1.0].forEach(x => { const pv = new T.Group(); pv.position.set(x, .7, 1.9); const w = makeWheel(.7, .44, M.white, 18); pv.add(w); v.add(pv); wheels.push({ n:w, r:.7 }); steerNodes.push({ n:pv, s:1 }); });
  P.tools = { plough:buildPlough(), seeder:buildSeeder(), baler:buildBaler(P), slurry:buildSlurryTank(P) };
  Object.keys(P.tools).forEach(k => { P.tools[k].position.set(0, 0, -2.3); P.tools[k].visible = k === 'plough'; v.add(P.tools[k]); });
  const driver = makeFarmer(.75); driver.position.set(0, 1.98, -.8); v.add(driver);
  scene.add(v);
  return { g:v, inner:v, P, wheels, steerNodes, driver, x:0, z:0, h:0, v:0, steer:0, rpm:0, tool:'plough',
    maxF:6.4, maxR:2.8, turnK:.3, turnRate:1.9, radius:2.6, eye:new T.Vector3(0, 2.72, -.72), look:new T.Vector3(0, 2.2, 7),
    chase:[14.5, 7], lookY:1.8, exhaust:new T.Vector3(-.74, 3.7, .44), dust:[[1.15, -1.5], [-1.15, -1.5]] };
}
function buildTrailer() {
  const g = new T.Group(), st = new T.Group();
  box(2.4, .12, 4.6, M.bedWood, 0, 1.1, 0, st);
  for (let i = 0; i < 9; i++) box(.02, .125, 4.6, M.woodD, -1.06 + i*.265, 1.1, 0, st);        // deski podłogi
  box(.12, .16, 4.5, M.dark, .45, .96, 0, st); box(.12, .16, 4.5, M.dark, -.45, .96, 0, st);
  [-2, -1, 0, 1, 2].forEach(z => box(2.3, .1, .1, M.dark, 0, .99, z, st));
  box(.07, .42, 4.6, M.trGreen, 1.2, 1.36, 0, st); box(.07, .42, 4.6, M.trGreen, -1.2, 1.36, 0, st);
  box(2.4, .42, .07, M.trGreen, 0, 1.36, 2.3, st); box(2.4, .42, .07, M.trGreen, 0, 1.36, -2.3, st);
  [1.21, -1.21].forEach(x => { box(.075, .03, 4.6, M.trGreenD, x, 1.36, 0, st);
    [-1.5, 0, 1.5].forEach(z => { box(.1, .5, .1, M.dark, x*1.03, 1.36, z, st); box(.05, .1, .14, M.uCream, x*1.045, 1.5, z, st); }); });
  box(2.4, .03, .075, M.trGreenD, 0, 1.36, -2.31, st);
  // dyszel A, stopka, resory, oś
  [.3, -.3].forEach(x => { const d = box(.08, .1, 1.95, M.dark, x*.5, .78, 3.2, st); d.rotation.y = -x*.3; });
  box(.14, .1, .25, M.dark, 0, .76, 4.05, st); cylY(.03, .5, M.steel, .25, .5, 2.9, st, 6); box(.14, .03, .14, M.steel, .25, .26, 2.9, st);
  cylX(.07, 2.3, M.dark, 0, .5, -.3, st, 8);
  [.8, -.8].forEach(x => { box(.08, .05, 1.1, M.uGrayD, x, .68, -.3, st); box(.08, .04, .8, M.uGrayD, x, .63, -.3, st); box(.08, .04, .5, M.uGrayD, x, .585, -.3, st); });
  // tył: lampy, pasy, tablica
  [.95, -.95].forEach(x => { box(.22, .12, .05, M.red, x, 1.0, -2.33, st); const h = mesh(new T.PlaneGeometry(.38, .38), M.hazard, x*.92, 1.37, -2.35, st); h.rotation.y = Math.PI; });
  { const pl = mesh(new T.PlaneGeometry(.46, .15), M.plate, 0, 1.0, -2.34, st); pl.rotation.y = Math.PI; }
  [.62, -.62].forEach(x => { const sh = new T.Shape(); sh.moveTo(-.13, -.11); sh.lineTo(.13, -.11); sh.lineTo(0, .12); sh.lineTo(-.13, -.11);
    const t = mesh(new T.ShapeGeometry(sh), M.red, x, 1.0, -2.34, st); t.rotation.y = Math.PI; });
  [1.25, -1.25].forEach(x => { [-1.9, 1.9].forEach(z => box(.02, .06, .14, M.amber, x, 1.2, z, st)); rbox(.34, .06, 1.2, M.dark, x*.92, 1.06, -.3, st, .02); });
  g.add(bake(st));
  const wheels = [];
  [1.12, -1.12].forEach(x => { const w = makeWheel(.5, .3, M.uCream, 0, true); w.position.set(x, .5, -.3); g.add(w); wheels.push(w); });
  const heap = box(2.26, 1, 4.46, M.grain, 0, 1.17, 0, g); heap.visible = false; heap.castShadow = false;
  scene.add(g);
  return { g, wheels, heap, grain:0, x:0, z:0, h:0 };
}
