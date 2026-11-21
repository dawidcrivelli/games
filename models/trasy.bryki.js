// Trasy Dzikich Bryk: motywy (niebo, ziemia, droga, rekwizyty), przeszkody na pasach, gwiazdki, rampa, pole turbo, meta.
// Wszystko w tym samym kreskówkowym stylu co pojazdy. Początek modelu = środek podstawy na ziemi, przód toru = +x.
// brykiTrasy() → motywy · brProp(nazwa) → Group · brObst(typ) → Group z userData { rodzaj, col }
// wymaga: lib/komiks.bryki-klinika.js (brPart, brMat, brExt, brBox, brCyl, brGwiazdaPts), models/pojazdy.bryki.js (brRivets), THREE

// rodzaje przeszkód: twarda = trafienie (mruganie), skrzynia = rozbija się i daje gwiazdkę, miekka = odbija się,
// slisko = poślizg, lawa = trafienie, rampa = skok, turbo = przyspieszenie, gwiazda = ładuje moc
const BRYKI_RODZAJ = () => ({
  glaz: 'twarda', beczki: 'twarda', opony: 'twarda', wrak: 'twarda', bryla: 'twarda',
  skrzynia: 'skrzynia', balwan: 'skrzynia', pacholki: 'miekka',
  olej: 'slisko', lod: 'slisko', lawa: 'lawa', rampa: 'rampa', turbo: 'turbo', gwiazda: 'gwiazda',
  // ruchome: przez pasy (biegacz, beczka_tocz, pingwin), toczą się pod prąd (glaz_tocz, sniezka), kula na dźwigu, meteor z nieba
  biegacz: 'miekka', pingwin: 'miekka', beczka_tocz: 'twarda', glaz_tocz: 'twarda', sniezka: 'twarda', kula_burzaca: 'twarda', meteor: 'twarda',
});
// jak się porusza przeszkoda ruchoma
const BRYKI_RUCH = () => ({ biegacz: 'cross', pingwin: 'cross', beczka_tocz: 'cross', glaz_tocz: 'roll', sniezka: 'roll', kula_burzaca: 'swing', meteor: 'fall' });

function brykiTrasy() {
  return {
    pustynia: { ic: '🏜️', sky: 0x8fd3f4, fog: 0xf6d9a8, ground: 0xe8b56a, road: 0x4b4747, curb: [0xd8342a, 0xf2efe6], line: 0xf2efe6,
      hemi: [0xffffff, 0xb08850, .75], sun: [0xffffff, .75], props: ['kaktus', 'kamien', 'opony', 'beczka', 'kaktus'], far: ['plaskowyz'],
      twarde: ['glaz', 'beczki'], miekkie: ['skrzynia', 'skrzynia'], slisko: 'olej', seed: 11,
      ruchome: ['biegacz', 'glaz_tocz'], tunel: 0xc07a48, woda: 0x3aa0d0, luk: 0xd8342a },
    zlomowisko: { ic: '🏭', sky: 0xa9c3d3, fog: 0xb8c2c6, ground: 0x7d7566, road: 0x3c3a3a, curb: [0xf2c12e, 0x2b2a2e], line: 0xf2c12e,
      hemi: [0xffffff, 0x6a6458, .75], sun: [0xfff2dd, .7], props: ['zlom', 'wrak', 'opony', 'beczka', 'zlom'], far: ['dzwig', 'fabryka'],
      twarde: ['wrak', 'opony'], miekkie: ['skrzynia', 'pacholki'], slisko: 'olej', seed: 23,
      ruchome: ['beczka_tocz', 'kula_burzaca'], tunel: 0x8a8580, woda: 0x5f8a4a, luk: 0xf2c12e },
    wulkan: { ic: '🌋', sky: 0x4a2232, fog: 0x6a2e24, ground: 0x3a3030, road: 0x352d2d, curb: [0xff7a1a, 0x1e1a1a], line: 0xffb04a,
      hemi: [0xffd0b0, 0x5a2a20, .7], sun: [0xffb070, .8], props: ['skala', 'dym', 'skala', 'kamien'], far: ['wulkan'],
      twarde: ['glaz', 'beczki'], miekkie: ['skrzynia'], slisko: 'lawa', seed: 37,
      ruchome: ['meteor', 'glaz_tocz'], tunel: 0x2a2222, woda: 0xff6a1a, lawa: 1, luk: 0x5a5560 },
    lodowiec: { ic: '❄️', sky: 0xcfe9ff, fog: 0xe6f2fb, ground: 0xf4f8ff, road: 0x7f98ad, curb: [0x2f7fbf, 0xf2f6fa], line: 0xffffff,
      hemi: [0xffffff, 0x9fb8cc, .8], sun: [0xffffff, .65], props: ['sosna', 'balwan', 'lodblok', 'sosna'], far: ['gora'],
      twarde: ['bryla', 'glaz'], miekkie: ['balwan', 'skrzynia'], slisko: 'lod', seed: 51,
      ruchome: ['pingwin', 'sniezka'], tunel: 0x9fd2ee, woda: 0x6ab8e8, luk: 0x2f7fbf },
  };
}

/* --- rekwizyty przy drodze --- */
function brProp(kind) {
  const g = new THREE.Group(), P = (geo, c, x, y, z, o) => brPart(g, geo, c, x, y, z, o);
  if (kind === 'kaktus') {
    const c = 0x4f9a43;
    P(brCyl(.33, .4, 3, 9), c, 0, 1.5, 0); P(new THREE.SphereGeometry(.33, 9, 6), c, 0, 3, 0, { ol: 0 });
    P(brCyl(.2, .2, .7, 7), c, .45, 1.4, 0, { r: [0, 0, Math.PI / 2] }); P(brCyl(.2, .2, 1.1, 7), c, .75, 1.9, 0);
    P(brCyl(.18, .18, .6, 7), c, -.4, 1.9, 0, { r: [0, 0, Math.PI / 2] }); P(brCyl(.18, .18, .8, 7), c, -.65, 2.2, 0);
  }
  if (kind === 'kamien') P(new THREE.DodecahedronGeometry(1), 0xb47a4a, 0, .35, 0, { s: [1.4, .75, 1.1] });
  if (kind === 'opony') for (let i = 0; i < 3; i++) P(new THREE.TorusGeometry(.55, .26, 6, 14), 0x2b2a2e, 0, .26 + i * .48, 0, { r: [Math.PI / 2, 0, 0] });
  if (kind === 'beczka') brBeczka(g, 0, 0, [0xc0392b, 0x2f7fbf, 0x3f9b4a][Math.random() * 3 | 0]);
  if (kind === 'plaskowyz') { const h = 9 + Math.random() * 6; P(brCyl(8, 12, h, 7), 0xd08a52, 0, h / 2, 0, { ol: .15 }); P(brCyl(8.3, 8.3, .8, 7), 0xb9703f, 0, h - .3, 0, { ol: 0 }); }
  if (kind === 'zlom') {
    const cols = [0x8a4a2a, 0x5d7f9e, 0x9a9a8a, 0xb5651d, 0x6b7c3a];
    for (let i = 0; i < 6; i++) P(brBox(.8 + Math.random(), .5 + Math.random() * .6, .8 + Math.random()), cols[i % 5], (Math.random() - .5) * 1.6, .3 + i * .28, (Math.random() - .5) * 1.2, { r: [Math.random() * .5, Math.random() * 3, Math.random() * .5] });
    P(brCyl(.5, .5, .3, 12, 'z'), 0x2b2a2e, .9, .5, .6, { r: [.3, 0, .2] });
    P(brCyl(.08, .08, 2, 6), 0xb7bec6, -.3, 1.8, 0, { r: [0, 0, .6] });
  }
  if (kind === 'wrak') brWrak(g, 0x8a4a2a);
  if (kind === 'dzwig') {
    const c = 0xe8b31c, H = 14;
    for (const [x, z] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) P(brCyl(.08, .08, H, 5), c, x, H / 2, z, { ol: .05 });
    for (let y = 1; y < H; y += 1.6) P(brBox(1.1, .1, 1.1), c, 0, y, 0, { ol: .04 });
    P(brBox(11, .5, .5), c, 3, H, 0, { ol: .06 }); P(brBox(2, 1.4, 1.4), 0x5a5a5a, -2.2, H - .3, 0, { ol: .06 });
    P(brCyl(.03, .03, 5, 4), 0x2b2a2e, 7.5, H - 2.5, 0, { ol: 0 }); P(brBox(.6, .5, .6), 0x2b2a2e, 7.5, H - 5.2, 0, { ol: .04 });
  }
  if (kind === 'fabryka') {
    P(brBox(12, 6, 6), 0x8a7f74, 0, 3, 0, { ol: .1 }); P(brBox(6, 8, 5), 0x9b8f83, -6, 4, 1, { ol: .1 });
    for (const x of [2, 4.5]) { P(brCyl(.7, .9, 9, 10), 0xa0522d, x, 10, 0, { ol: .08 }); P(new THREE.SphereGeometry(1.4, 8, 6), 0xcfcfcf, x + .6, 15.2, 0, { ol: 0 }); }
  }
  if (kind === 'skala') {
    P(new THREE.DodecahedronGeometry(1.1), 0x2a2222, 0, .5, 0, { s: [1.3, .9, 1] });
    for (let i = 0; i < 3; i++) P(brBox(.08, .7, .9), brMat(0xff6a1a, 'glow'), -.4 + i * .4, .5, .55, { r: [0, 0, .5 - i * .4], ol: 0 });
  }
  if (kind === 'dym') {
    P(new THREE.ConeGeometry(1, 1.2, 8), 0x3a2e2e, 0, .6, 0); P(brCyl(.35, .35, .1, 8), brMat(0xffa030, 'glow'), 0, 1.18, 0, { ol: 0 });
    for (let i = 0; i < 4; i++) P(new THREE.SphereGeometry(.45 + i * .2, 8, 6), 0x8c8080, i * .25, 1.6 + i * .7, 0, { ol: 0 });
  }
  if (kind === 'wulkan') {
    P(brCyl(5, 26, 22, 10), 0x3a2a2a, 0, 11, 0, { ol: .2 });
    P(brCyl(5.2, 5.6, 1.2, 10), brMat(0xff6a1a, 'glow'), 0, 21.8, 0, { ol: 0 });
    for (let i = 0; i < 3; i++) P(brBox(.8, 9, .8), brMat(0xff5a10, 'glow'), -2 + i * 2.2, 16, 4.6 + i * .5, { r: [.25, 0, .3 - i * .3], ol: 0 });
    for (let i = 0; i < 4; i++) P(new THREE.SphereGeometry(3 + i, 8, 6), 0x5a4a4a, i * 2, 26 + i * 4, 0, { ol: 0 });
  }
  if (kind === 'sosna') {
    P(brCyl(.18, .22, 1, 6), 0x6b4a2a, 0, .5, 0);
    for (let i = 0; i < 3; i++) { const r = 1.3 - i * .35, y = 1 + i * .9; P(new THREE.ConeGeometry(r, 1.4, 8), 0x2f6b3f, 0, y + .7, 0); P(new THREE.ConeGeometry(r * .55, .5, 8), 0xffffff, 0, y + 1.2, 0, { ol: 0 }); }
  }
  if (kind === 'balwan') brBalwan(g);
  if (kind === 'lodblok') P(brBox(1.6, 1.2, 1.4), 0xbfe6ff, 0, .6, 0, { r: [0, .4, .1] });
  if (kind === 'gora') { P(new THREE.ConeGeometry(18, 22, 9), 0x8fa6bd, 0, 11, 0, { ol: .2 }); P(new THREE.ConeGeometry(7.5, 9, 9), 0xffffff, 0, 18.5, 0, { ol: 0 }); }
  return g;
}
function brBeczka(g, x, z, col) {
  brPart(g, brCyl(.5, .5, 1.3, 12), col, x, .65, z);
  for (const y of [.3, 1.0]) brPart(g, brCyl(.52, .52, .1, 12), 0x2b2724, x, y, z, { ol: 0 });
  brPart(g, brCyl(.12, .12, .05, 8), 0x2b2724, x + .2, 1.31, z, { ol: 0 });
}
function brWrak(g, col) {
  brPart(g, brExt([[-1.6, .35], [1.5, .35], [1.6, .8], [.7, .9], [.3, 1.4], [-1.0, 1.4], [-1.4, .95], [-1.65, .9]], 1.5, .04), col, 0, 0, 0, { r: [0, 0, .06] });
  for (const s of [-1, 1]) brPart(g, brBox(1.0, .4, .02), 0x2b3540, -.35, 1.1, s * .76, { ol: 0 });
  brPart(g, brCyl(.38, .38, .3, 12, 'z'), 0x2b2a2e, -1.0, .38, .75);
  brPatch(g, .6, .62, .5, .3, .77, 0x6b7c8a, .1);
}
function brBalwan(g) {
  brPart(g, new THREE.SphereGeometry(.7, 12, 9), 0xffffff, 0, .65, 0); brPart(g, new THREE.SphereGeometry(.5, 12, 9), 0xffffff, 0, 1.55, 0);
  brPart(g, new THREE.SphereGeometry(.36, 12, 9), 0xffffff, 0, 2.2, 0);
  brPart(g, new THREE.ConeGeometry(.08, .45, 6), 0xff7a1a, .5, 2.2, 0, { r: [0, 0, -Math.PI / 2], ol: .015 });
  for (const z of [-.13, .13]) brPart(g, new THREE.SphereGeometry(.05, 6, 4), 0x111111, .3, 2.32, z, { ol: 0 });
  brPart(g, brCyl(.26, .26, .38, 10), 0x2b2724, 0, 2.6, 0); brPart(g, brCyl(.4, .4, .05, 12), 0x2b2724, 0, 2.43, 0);
  brPart(g, new THREE.TorusGeometry(.42, .08, 6, 14), 0xd8342a, 0, 1.95, 0, { r: [Math.PI / 2, 0, 0], ol: 0 });
}

/* --- przeszkody i bonusy na pasie --- */
function brObst(typ) {
  const g = new THREE.Group(), P = (geo, c, x, y, z, o) => brPart(g, geo, c, x, y, z, o);
  let col = 0x8a6a4a;
  if (typ === 'glaz') { P(new THREE.DodecahedronGeometry(1), 0x8a6a4a, 0, .75, 0, { s: [1, .85, 1.05] }); P(new THREE.DodecahedronGeometry(.5), 0x9c7c5a, .6, .35, .5); }
  if (typ === 'beczki') {
    col = 0xd8342a;
    for (const [x, z] of [[0, -.6], [0, .6], [.7, 0]]) { brBeczka(g, x, z, 0xd8342a); brPart(g, brCyl(.52, .52, .18, 12), 0xffd23f, x, .65, z, { ol: 0 }); }
  }
  if (typ === 'opony') { col = 0x2b2a2e; for (const z of [-.6, .6]) for (let i = 0; i < 3; i++) P(new THREE.TorusGeometry(.5, .24, 6, 14), 0x2b2a2e, 0, .24 + i * .44, z, { r: [Math.PI / 2, 0, 0] }); }
  if (typ === 'wrak') { col = 0x5d7f9e; brWrak(g, 0x5d7f9e); g.children.forEach(c => c.scale.multiplyScalar(.85)); }
  if (typ === 'bryla') { col = 0xbfe6ff; P(brBox(1.5, 1.4, 1.8), 0xbfe6ff, 0, .7, 0, { r: [0, .3, .08] }); P(brBox(.8, .7, .8), 0xd9f1ff, .5, 1.5, .2, { r: [.3, .5, 0] }); }
  if (typ === 'skrzynia') {
    col = 0xb07a3a;
    P(brBox(1.3, 1.3, 1.3), 0xc68a45, 0, .65, 0);
    for (const s of [-1, 1]) {
      P(brBox(1.34, .16, .05), 0x8a5a2a, 0, .1, s * .66, { ol: 0 }); P(brBox(1.34, .16, .05), 0x8a5a2a, 0, 1.2, s * .66, { ol: 0 });
      P(brBox(.16, 1.5, .05), 0x8a5a2a, 0, .65, s * .66, { r: [0, 0, .78], ol: 0 });
      P(brExt(brGwiazdaPts(.32, .14), .04, 0), brMat(0xffd23f), .32, .9, s * .69, { ol: 0, s: [1, 1, s] });
    }
  }
  if (typ === 'balwan') { col = 0xffffff; brBalwan(g); }
  if (typ === 'pacholki') {
    col = 0xff7a1a;
    for (const z of [-.8, 0, .8]) { P(new THREE.ConeGeometry(.3, .9, 10), 0xff7a1a, 0, .45, z); P(brCyl(.2, .23, .14, 10), 0xffffff, 0, .45, z, { ol: 0 }); P(brBox(.7, .06, .7), 0xff7a1a, 0, .03, z, { ol: 0 }); }
  }
  if (typ === 'olej' || typ === 'lod' || typ === 'lawa') {
    const c = { olej: 0x15131a, lod: 0xa8dcff, lawa: 0xff6a1a }[typ]; col = c;
    const plama = (r, x, z, cc, y) => P(new THREE.CircleGeometry(r, 14), typ === 'lawa' ? brMat(cc, 'glow') : brMat(cc), x, y, z, { r: [-Math.PI / 2, 0, 0], ol: 0 });
    plama(1.2, 0, 0, c, .03); plama(.8, .9, .4, c, .031); plama(.7, -.9, -.3, c, .032);
    if (typ === 'olej') { plama(.35, -.2, .3, 0x5a3a8a, .04); plama(.25, .4, -.2, 0x2a6a6a, .04); }
    if (typ === 'lod') { plama(.4, .3, .2, 0xffffff, .04); plama(.2, -.5, -.3, 0xffffff, .04); }
    if (typ === 'lawa') for (let i = 0; i < 4; i++) P(new THREE.DodecahedronGeometry(.25), 0x2a1a1a, Math.cos(i * 1.7) * .9, .08, Math.sin(i * 1.7) * .7, { s: [1, .4, 1], ol: 0 });
  }
  if (typ === 'rampa') {
    col = 0xffd23f;
    P(brExt([[-1.6, 0, 1], [1.4, 0, 1], [1.4, .95, 1]], 2.4, .03), 0xffd23f);
    for (let i = 0; i < 3; i++) P(brBox(.35, .04, 2.42), 0x2b2724, -.6 + i * .8, (i * .8 + 1) * .95 / 3 + .03, 0, { r: [0, 0, Math.atan2(.95, 3)], ol: 0 });
    P(brBox(.15, .95, 2.2), 0x6f767d, 1.35, .47, 0, { ol: .02 });
  }
  if (typ === 'turbo') {
    col = 0x29d3ff;
    P(brBox(3, .05, 2.2), 0x2b2a2e, 0, .03, 0, { ol: 0 });
    const chev = brExt([[0, .5], [.5, 0], [0, -.5], [-.25, -.5], [.25, 0], [-.25, .5]], .04, 0);
    for (let i = 0; i < 3; i++) P(chev, brMat(0x29d3ff, 'glow'), -.9 + i * .8, .07, 0, { r: [-Math.PI / 2, 0, 0], s: [1, 1.8, 1], ol: 0 });
  }
  if (typ === 'gwiazda') {
    col = 0xffd23f;
    const s = new THREE.Group(); s.position.y = 1.2; g.add(s); g.userData.spin = s;
    brPart(s, brExt(brGwiazdaPts(.55, .24), .22, .05), 0xffd23f, 0, 0, 0, { ol: .035 });
    brPart(s, brExt(brGwiazdaPts(.3, .13), .26, 0), brMat(0xfff4a8, 'glow'), 0, .02, 0, { ol: 0 });
  }
  if (typ === 'biegacz') {                   // biegacz pustyni: kula splątanych gałązek
    col = 0xa07a4a; const r = new THREE.Group(); r.position.y = .7; g.add(r); g.userData.roll = r;
    for (let i = 0; i < 7; i++) brPart(r, new THREE.TorusGeometry(.6 - i * .03, .05, 5, 14), i % 2 ? 0xa07a4a : 0x7a5a32, 0, 0, 0, { r: [i * .9, i * 1.7, i * .4], ol: 0 });
  }
  if (typ === 'glaz_tocz' || typ === 'sniezka') {
    const sn = typ === 'sniezka'; col = sn ? 0xe8f3ff : 0x8a6a4a;
    const r = new THREE.Group(); r.position.y = .9; g.add(r); g.userData.roll = r;
    brPart(r, sn ? new THREE.SphereGeometry(.9, 14, 10) : new THREE.DodecahedronGeometry(.95, 1), col);
    for (let i = 0; i < 5; i++) brPart(r, new THREE.SphereGeometry(.18, 6, 4), sn ? 0xb9d6f0 : 0x6e5236, Math.cos(i * 1.3) * .8, Math.sin(i * 2.1) * .5, Math.sin(i * 1.3) * .5, { ol: 0 });
  }
  if (typ === 'beczka_tocz') {               // beczka leży na boku (oś wzdłuż x), toczy się w poprzek pasów
    col = 0xd8342a; const r = new THREE.Group(); r.position.y = .55; g.add(r); g.userData.roll = r;
    brPart(r, brCyl(.55, .55, 1.3, 12, 'x'), 0xd8342a); brPart(r, brCyl(.57, .57, .2, 12, 'x'), 0xffd23f, 0, 0, 0, { ol: 0 });
    for (const x of [-.45, .45]) brPart(r, brCyl(.57, .57, .08, 12, 'x'), 0x2b2724, x, 0, 0, { ol: 0 });
  }
  if (typ === 'pingwin') {                   // pingwin sunie na brzuchu w poprzek pasów
    col = 0x1d1d24; const r = new THREE.Group(); g.add(r); g.userData.roll = r;
    brPart(r, new THREE.SphereGeometry(.5, 12, 9), 0x1d1d24, 0, .45, 0, { s: [.9, .8, 1.5] });
    brPart(r, new THREE.SphereGeometry(.42, 12, 9), 0xffffff, 0, .3, .05, { s: [.85, .6, 1.4], ol: 0 });
    brPart(r, new THREE.SphereGeometry(.3, 10, 8), 0x1d1d24, 0, .62, .72);
    brPart(r, new THREE.ConeGeometry(.08, .25, 6), 0xff9a1a, 0, .6, 1.05, { r: [Math.PI / 2, 0, 0], ol: .01 });
    for (const x of [-.13, .13]) { brPart(r, new THREE.SphereGeometry(.06, 6, 4), 0xffffff, x, .72, .95, { ol: 0 }); brPart(r, new THREE.SphereGeometry(.03, 5, 4), 0x111111, x, .73, 1.0, { ol: 0 }); }
    for (const x of [-.45, .45]) brPart(r, new THREE.SphereGeometry(.2, 8, 6), 0x1d1d24, x, .4, -.1, { s: [.3, .4, 1.4], r: [0, 0, x > 0 ? -.6 : .6] });
    for (const x of [-.15, .15]) brPart(r, new THREE.SphereGeometry(.12, 6, 4), 0xff9a1a, x, .25, -.75, { s: [1, .4, 1.4], ol: .01 });
  }
  if (typ === 'kula_burzaca') {              // dźwig za drogą, belka nad pasami, kula na łańcuchu (wahadło w poprzek drogi)
    col = 0x3a3633; const Y = 8.3, L = 6.6;
    for (const [x, z] of [[-.5, -9], [.5, -9], [-.5, -8], [.5, -8]]) brPart(g, brCyl(.09, .09, Y + .5, 5), 0xf2c12e, x, (Y + .5) / 2, z, { ol: .03 });
    for (let y = 1; y < Y; y += 1.5) brPart(g, brBox(1.1, .1, 1.1), 0xf2c12e, 0, y, -8.5, { ol: .02 });
    brPart(g, brBox(.6, .6, 17.5), 0xf2c12e, 0, Y + .3, -.5, { ol: .04 });
    for (let i = 0; i < 7; i++) brPart(g, brBox(.62, .62, .5), 0x2b2724, 0, Y + .3, -8 + i * 2.2, { ol: 0 });
    const pv = new THREE.Group(); pv.position.set(0, Y, 0); g.add(pv); g.userData.pivot = pv; g.userData.arm = L;
    for (let i = 0; i < 9; i++) brPart(pv, new THREE.TorusGeometry(.14, .04, 5, 10), 0x6f767d, 0, -i * (L - .8) / 9 - .3, 0, { r: [0, i % 2 ? Math.PI / 2 : 0, 0], ol: 0 });
    brPart(pv, new THREE.SphereGeometry(.85, 16, 12), 0x3a3633, 0, -L, 0, { ol: .04 });
    for (let i = 0; i < 6; i++) brPart(pv, new THREE.SphereGeometry(.09, 6, 4), 0x8a8f96, Math.cos(i) * .82, -L + Math.sin(i * 2) * .3, Math.sin(i) * .82, { ol: 0 });
  }
  if (typ === 'meteor') {                    // kamień z ognistym ogonem + czerwone koło ostrzegawcze na drodze
    col = 0x3a2a2a;
    const rk = new THREE.Group(); g.add(rk); g.userData.rock = rk; rk.position.y = 3;
    brPart(rk, new THREE.DodecahedronGeometry(.8), 0x3a2a2a, 0, 0, 0, { ol: .03 });
    for (let i = 0; i < 3; i++) brPart(rk, brBox(.08, .9, .08), brMat(0xff7a1a, 'glow'), -.3 + i * .3, 0, .78, { r: [0, 0, .4 - i * .4], ol: 0 });
    for (let i = 0; i < 4; i++) brPart(rk, new THREE.SphereGeometry(.6 - i * .1, 8, 6), brMat([0xffd23f, 0xff9a1a, 0xff5a1a, 0x8a3a2a][i]), 0, 1 + i * .8, 0, { ol: 0 });
    const ring = brPart(g, new THREE.RingGeometry(1.0, 1.4, 20), brMat(0xff2a1a, 'glow'), 0, .06, 0, { r: [-Math.PI / 2, 0, 0], ol: 0 });
    g.userData.ring = ring;
  }
  g.userData.rodzaj = BRYKI_RODZAJ()[typ]; g.userData.col = col; g.userData.typ = typ;
  return g;
}
// Tunel w przekroju: tylna ściana, strop nad dalszymi pasami, lampy, portale; nad nim skały (środek = 0, długość len)
function brTunel(len, col, w) {
  const g = new THREE.Group(), dark = new THREE.Color(col).multiplyScalar(.7).getHex(), Zb = -(w / 2 + 1.6);
  brPart(g, brBox(len, 7.4, 1.2), col, 0, 3.7, Zb, { ol: .05 });
  brPart(g, brBox(len, .8, 7.2), dark, 0, 7, Zb + 3.4, { ol: .05 });
  for (let x = -len / 2 + 3; x < len / 2; x += 5) {
    brPart(g, brBox(1.4, .2, .5), brMat(0xfff1b0, 'glow'), x, 6.5, Zb + 3.5, { ol: 0 });
    brPart(g, brBox(.5, 2.6, .1), brMat(0xfff1b0, 'glow'), x, 2.5, Zb + .62, { ol: 0 });
  }
  for (const sd of [-1, 1]) {
    const x = sd * len / 2;
    brPart(g, brBox(1.4, 7.6, 1.6), dark, x, 3.8, Zb + .2, { ol: .05 });
    brPart(g, brBox(1.4, 1.3, w + 5), dark, x, 7.4, -.3, { ol: .05 });
    brPart(g, brBox(.9, 7.6, .9), dark, x, 3.8, w / 2 + 1.8, { ol: .05 });
    for (let i = 0; i < 6; i++) brPart(g, brBox(1.42, 1.32, .7), i % 2 ? 0x2b2724 : 0xffd23f, x, 7.4, -w / 2 - 2 + i * 2.4, { ol: 0 });
  }
  const r = (i, m) => (Math.sin(i * 12.9898 + m) * 43758.5453) % 1;
  for (let i = 0; i < len / 3; i++) brPart(g, new THREE.DodecahedronGeometry(2 + Math.abs(r(i, 1)) * 2.5), dark, -len / 2 + i * 3 + 1.5, 8.4 + Math.abs(r(i, 2)) * 2, Zb - 1 + r(i, 3) * 2, { ol: .06 });
  return g;
}
// Most nad rzeką (lub lawą): deska jedzie po garbie wysokości A; balustrady, filary, łuk po dalszej stronie
function brMost(len, A, w, woda, lawa, luk) {
  const g = new THREE.Group(), h = x => A * (1 - Math.cos(2 * Math.PI * (x + len / 2) / len)) / 2;
  brPart(g, new THREE.PlaneGeometry(len - 6, 150), lawa ? brMat(woda, 'glow') : brMat(woda), 0, .04, -45, { r: [-Math.PI / 2, 0, 0], ol: 0 });
  for (let i = 0; i < 14; i++) brPart(g, brBox(rnd2(i) * 3 + 1, .03, .25), lawa ? brMat(0xffd23f, 'glow') : brMat(0xffffff), (rnd2(i + 7) - .5) * (len - 12), .06, -40 + rnd2(i + 3) * 70, { ol: 0 });
  for (const sd of [-1, 1]) for (const [z, d] of [[-w / 2 - 4 - 60, 120], [w / 2 + 4 + 15, 30]]) brPart(g, brBox(3, .5, d), lawa ? 0x2a1a1a : 0x7a5a3a, sd * (len / 2 - 3), .1, z, { ol: 0 });   // brzegi rzeki poza drogą
  const step = 2.5, n = Math.round(len / step);
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + i * step, y = h(x);
    for (const sd of [-1, 1]) {
      brPart(g, brBox(.18, 1.1, .18), 0x6f767d, x, y + .55, sd * (w / 2 + .45), { ol: .015 });
      if (i < n) {
        const x2 = x + step, y2 = h(x2), a = Math.atan2(y2 - y, step), L = Math.hypot(step, y2 - y);
        brPart(g, brBox(L, .12, .12), luk, (x + x2) / 2, (y + y2) / 2 + 1.05, sd * (w / 2 + .45), { r: [0, 0, a], ol: .015 });
        brPart(g, brBox(L, .7, .25), 0x5a5560, (x + x2) / 2, (y + y2) / 2 - .3, sd * (w / 2 + .2), { r: [0, 0, a], ol: .015 });
      }
    }
  }
  for (const x of [-len / 4, 0, len / 4]) for (const z of [-w / 2 + 1, w / 2 - 1]) brPart(g, brCyl(.45, .55, h(x)), 0x8a8580, x, h(x) / 2, z, { ol: .03 });
  const arch = x => h(x) + 3.2 * Math.sin(Math.PI * (x + len / 2) / len);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + i * step, x2 = x + step, y = arch(x), y2 = arch(x2);
    brPart(g, brBox(Math.hypot(step, y2 - y), .3, .3), luk, (x + x2) / 2, (y + y2) / 2, -(w / 2 + .8), { r: [0, 0, Math.atan2(y2 - y, step)], ol: .02 });
    if (i % 2 && i < n - 1) brPart(g, brBox(.08, arch(x2) - h(x2), .08), 0x6f767d, x2, (arch(x2) + h(x2)) / 2, -(w / 2 + .8), { ol: 0 });
  }
  return g;
}
function rnd2(i) { return Math.abs(Math.sin(i * 91.7 + 3.1) * 1234.5) % 1; }
// Brama start/meta nad drogą (szerokość drogi w), z szachownicą na asfalcie; brama = false: tylko linia
function brMeta(w, meta = true, brama = true) {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const x = cv.getContext('2d');
  for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 32, j * 32, 32, 32); }
  const tex = new THREE.CanvasTexture(cv);
  brPart(g, new THREE.PlaneGeometry(1.2, w), new THREE.MeshBasicMaterial({ map: tex }), 0, .04, 0, { r: [-Math.PI / 2, 0, 0], ol: 0 });
  if (!brama) return g;
  const H = 5.2, col = meta ? 0xd8342a : 0x2f7fbf;
  for (const s of [-1, 1]) { brPart(g, brCyl(.18, .22, H, 10), 0xb7bec6, 0, H / 2, s * (w / 2 + .6)); brRivets(g, 0, .5, 0, H - .5, 5, w / 2 + .82); }
  brPart(g, brBox(.5, 1.1, w + 1.6), col, 0, H, 0, { ol: .05 });
  const cv2 = document.createElement('canvas'); cv2.width = 256; cv2.height = 32; const y = cv2.getContext('2d');
  for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { y.fillStyle = (i + j) % 2 ? '#111' : '#fff'; y.fillRect(i * 16, j * 16, 16, 16); }
  const t2 = new THREE.CanvasTexture(cv2);
  for (const s of [-1, 1]) brPart(g, new THREE.PlaneGeometry(w + 1.4, .5), new THREE.MeshBasicMaterial({ map: t2 }), s * .26, H + .1, 0, { r: [0, s * Math.PI / 2, 0], ol: 0 });
  return g;
}
