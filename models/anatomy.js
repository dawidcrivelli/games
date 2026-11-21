// Klinika Zoo — wnętrze pacjenta w rentgenie: kości (świecące, z niebieską poświatą), organy (kreskówkowe, kolorowe),
// przełyk, połknięte rzeczy, gips, „duch” = półprzezroczysty cień miejsca, gdzie coś ma wrócić.
// Wszystko w płaszczyźnie x-y (widok z boku), grubość wzdłuż z, środek części w (0, 0) — gra ustawia pozycję.
// Kości: anKosc(L, r) · anKoscP(rodzic, [x0,y0], [x1,y1], r) · anKreg(r) · anCzaszka(obrys, oko) · anZebraBok · anZebraPrzod · anPlaska(obrys, gł.)
// Organy: anSerce · anPluca · anZoladek · anJelita · anMozg · anWatroba · anNerki · anPecherz (s) · anOrgan(nazwa, s) · anPrzelyk(punkty, r) · anJelitaTrasa(punkty, r, iGrube)
// Rzeczy: anRzecz('kaczka'|'budzik'|'skarpetka'|'klucz'|'rybka'|'pilka'|'klocek'|'lod', s) · anGips(L, r, kolor) · anDuch(obiekt)
// anZadrapanie(r) · anPlaster(r, kolor) — zadrapania do zaklejania na skórze · anLizak(s) — nagroda · anLupa() · anGwiazda() — ikony
// anTik(obiekt, t) — bicie serca, oddech płuc, bulgot żołądka (gdy organ jest na swoim miejscu: userData.zywy)
// wymaga: lib/3d/comic.js, lib/ui/comic.js (brPart, brExt, brCyl, brMat), THREE

const AN_KOSC = 0xf2fbff, AN_POSWIATA = 0x56cfff;
const AN_ORGANY = { serce: 0xff3d5e, pluca: 0xff9cbc, zoladek: 0xffa45c, jelita: 0xffc79e, mozg: 0xffb0d6, watroba: 0xb5503c, nerki: 0xc0395a, pecherz: 0xffe27a, grube: 0xf2a98a };

/* --- kości --- */
const anKoscMat = () => brMat(AN_KOSC, 'glow');
const anK = (par, geo, x, y, z, o = {}) => brPart(par, geo, anKoscMat(), x, y, z, { ol: .035, olc: AN_POSWIATA, ...o });
// Kość „psia”: trzon wzdłuż +y od 0 do L, na końcach po dwie gałki
function anKosc(L, r = .07) {
  const g = new THREE.Group(), kn = new THREE.SphereGeometry(r * 1.25, 10, 8);
  anK(g, brCyl(r, r, L, 10), 0, L / 2, 0);
  for (const y of [0, L]) for (const s of [-1, 1]) anK(g, kn, s * r * .8, y, 0, { ol: .03 });
  g.userData.L = L; return g;
}
// Kość od punktu do punktu (w układzie rodzica)
function anKoscP(par, p0, p1, r) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy), k = anKosc(L, r);
  k.position.set(p0[0], p0[1], p0[2] || 0); k.rotation.z = Math.atan2(-dx, dy);
  par.add(k); return k;
}
// Krąg (kręg kręgosłupa): zaokrąglony klocek z wypustką u góry
function anKreg(r = .14) {
  const g = new THREE.Group();
  anK(g, brExt([[-r, -r * .7], [r, -r * .7], [r * 1.1, r * .5], [r * .3, r * .8], [0, r * 1.5, 1], [-r * .3, r * .8], [-r * 1.1, r * .5]], r * 1.4, r * .2, 1), 0, 0, 0, { ol: Math.min(.035, r * .15) });
  return g;
}
// Płaska kość z obrysu (łopatka, miednica, mostek…)
function anPlaska(pts, depth = .12, smooth = 2) {
  const g = new THREE.Group(); anK(g, brExt(pts, depth, .03, smooth), 0, 0, 0); return g;
}
// Czaszka z obrysu, z ciemnym oczodołem (oko = [x, y, r])
function anCzaszka(pts, oko, depth = .3) {
  const g = new THREE.Group(); anK(g, brExt(pts, depth, .05, 2), 0, 0, 0);
  if (oko) brPart(g, new THREE.CylinderGeometry(oko[2], oko[2], depth + .04, 14).rotateX(Math.PI / 2), brMat(0x16304f, 'glow'), oko[0], oko[1], 0, { ol: 0 });
  return g;
}
// Żebra z boku: n łuków od kręgosłupa (y0) w dół, od x0 do x1, wysokość h
function anZebraBok(x0, x1, y0, h, n = 6, r = .045) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (n > 1 ? i / (n - 1) : .5), hh = h * (1 - Math.abs(i / (n - 1) - .45) * .5);
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y0, 0), new THREE.Vector3(x + .35, y0 - hh * .4, 0), new THREE.Vector3(x + .18, y0 - hh, 0));
    anK(g, new THREE.TubeGeometry(c, 10, r, 6), 0, 0, 0, { ol: .02 });
  }
  return g;
}
// Żebra z przodu (człowiek): n par łuków od mostka (x = 0) na boki
function anZebraPrzod(w, y0, dy, n = 5, r = .04) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
    const y = y0 - i * dy, ww = w * (1 - Math.abs(i - n * .4) * .06);
    const c = new THREE.CubicBezierCurve3(new THREE.Vector3(s * .08, y, 0), new THREE.Vector3(s * ww * .6, y + .18, 0), new THREE.Vector3(s * ww * 1.05, y - .05, 0), new THREE.Vector3(s * ww * .85, y - .32, 0));
    anK(g, new THREE.TubeGeometry(c, 14, r, 6), 0, 0, 0, { ol: .02 });
  }
  return g;
}

/* --- organy (kreskówkowe, kolorowe; s = skala) --- */
const anO = (par, geo, col, x = 0, y = 0, z = 0, o = {}) => brPart(par, geo, col, x, y, z, { ol: .03, ...o });
function anBlask(par, x, y, z, r) {        // biały odblask — wygląda „mięciutko”, nie krwiście
  brPart(par, new THREE.SphereGeometry(r, 8, 6), brMat(0xffffff, 'glow'), x, y, z, { s: [1.4, .8, .4], ol: 0 });
}
function anSerce(s = 1) {
  const g = new THREE.Group(), sh = new THREE.Shape();
  sh.moveTo(0, -.32); sh.bezierCurveTo(-.5, .02, -.36, .42, 0, .2); sh.bezierCurveTo(.36, .42, .5, .02, 0, -.32);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: .18, bevelEnabled: true, bevelThickness: .07, bevelSize: .06, bevelSegments: 3, curveSegments: 10 }); geo.translate(0, 0, -.09);
  anO(g, geo, AN_ORGANY.serce); anBlask(g, -.14, .14, .18, .06);
  g.scale.setScalar(s); g.userData.organ = 'serce'; return g;
}
function anPluca(s = 1) {
  const g = new THREE.Group();
  for (const k of [-1, 1]) {
    const pts = [[0, .5], [.12 * k, .55], [.36 * k, .3], [.42 * k, -.2], [.3 * k, -.45], [.08 * k, -.35], [.06 * k, .1]];
    const p = new THREE.Group(); p.position.x = k * .07; g.add(p);
    anO(p, brExt(k < 0 ? pts.slice().reverse() : pts, .3, .08, 2), AN_ORGANY.pluca); anBlask(p, .2 * k, .2, .2, .05);
    p.userData.k = k;
  }
  anO(g, brCyl(.05, .05, .4, 8), 0xffd2de, 0, .62, 0);               // tchawica
  g.scale.setScalar(s); g.userData.organ = 'pluca'; return g;
}
function anZoladek(s = 1) {
  const g = new THREE.Group();
  anO(g, brExt([[-.15, .45], [.02, .45], [.05, .15], [.35, .05], [.42, -.2], [.2, -.36], [-.2, -.28], [-.32, -.05], [-.18, .15]], .28, .08, 2), AN_ORGANY.zoladek);
  anBlask(g, .15, -.05, .2, .06);
  g.scale.setScalar(s); g.userData.organ = 'zoladek'; return g;
}
function anJelita(s = 1) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * Math.PI * 7; pts.push(new THREE.Vector3(Math.sin(a) * .32 * (1 - t * .3), .3 - t * .6, Math.cos(a) * .05)); }
  anO(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .065, 8), AN_ORGANY.jelita, 0, 0, 0, { ol: .015 });
  g.scale.setScalar(s); g.userData.organ = 'jelita'; return g;
}
function anMozg(s = 1) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = .38 + .045 * Math.cos(i * Math.PI); pts.push([Math.cos(a) * r * 1.2, Math.sin(a) * r * .8 + (Math.sin(a) < 0 ? Math.sin(a) * .06 : 0)]); }
  anO(g, brExt(pts, .34, .1, 1), AN_ORGANY.mozg);
  const fal = brMat(0xd9649a, 'glow');                                // zakręty mózgu: falowane kreski
  for (const [y, w] of [[.12, .32], [-.06, .36], [-.2, .24]]) {
    const c = []; for (let i = 0; i <= 12; i++) c.push(new THREE.Vector3(-w + i * 2 * w / 12, y + Math.sin(i * 1.6) * .045, .24));
    brPart(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c), 24, .016, 4), fal, 0, 0, 0, { ol: 0 });
  }
  anBlask(g, -.2, .18, .22, .05);
  g.scale.setScalar(s); g.userData.organ = 'mozg'; return g;
}
// Wątroba: duży brązowo-czerwony płat (trochę jak klin)
function anWatroba(s = 1) {
  const g = new THREE.Group();
  anO(g, brExt([[-.5, .18], [-.1, .3], [.42, .24], [.55, .05], [.3, -.12], [-.1, -.2], [-.45, -.05]], .26, .08, 2), AN_ORGANY.watroba);
  anBlask(g, -.2, .15, .18, .05);
  g.scale.setScalar(s); g.userData.organ = 'watroba'; return g;
}
// Nerki: dwie fasolki (środek między nimi)
function anNerki(s = 1) {
  const g = new THREE.Group(), fas = [[0, .22], [.13, .18], [.16, 0], [.13, -.18], [0, -.22], [-.06, -.12], [-.03, 0], [-.06, .12]];
  for (const k of [-1, 1]) { anO(g, brExt(fas.map(([x, y]) => [x * -k, y]), .14, .05, 2), AN_ORGANY.nerki, k * .26, 0, 0); anBlask(g, k * .3, .1, .1, .03); }
  g.scale.setScalar(s); g.userData.organ = 'nerki'; return g;
}
// Pęcherz: żółty baloniko-woreczek
function anPecherz(s = 1) {
  const g = new THREE.Group();
  anO(g, new THREE.SphereGeometry(.2, 14, 10), AN_ORGANY.pecherz, 0, 0, 0, { s: [1, .9, .8] }); anO(g, brCyl(.04, .05, .14, 8), AN_ORGANY.pecherz, 0, -.22, 0);
  anBlask(g, -.07, .08, .14, .04);
  g.scale.setScalar(s); g.userData.organ = 'pecherz'; return g;
}
function anOrgan(n, s = 1) { return ({ serce: anSerce, pluca: anPluca, zoladek: anZoladek, jelita: anJelita, mozg: anMozg, watroba: anWatroba, nerki: anNerki, pecherz: anPecherz })[n](s); }
// Jelita jako trasa: cienkie (zwinięte) i grube (szersze) — jedna rura po punktach [[x,y],…], od żołądka do pupy; grube od indeksu iGrube
function anJelitaTrasa(pts, r, iGrube) {
  const g = new THREE.Group(), V = p => new THREE.Vector3(p[0], p[1], p[2] || 0);
  const cz = (a, b, rr, col) => { if (b - a < 1) return; brPart(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(a, b + 1).map(V)), (b - a) * 10, rr, 10), col, 0, 0, 0, { ol: .015 }); };
  cz(0, iGrube, r, AN_ORGANY.jelita); cz(iGrube, pts.length - 1, r * 1.5, AN_ORGANY.grube);
  g.userData.organ = 'jelita'; return g;
}
// Przełyk: miękka różowa rura przez punkty [[x,y],…] (od żołądka do pyszczka)
function anPrzelyk(pts, r = .14) {
  const g = new THREE.Group(), c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)));
  const m = new THREE.MeshBasicMaterial({ color: 0xff7aa6, transparent: true, opacity: .45, depthWrite: false });
  brPart(g, new THREE.TubeGeometry(c, Math.max(24, pts.length * 12), r, 10), m, 0, 0, 0, { ol: .025, olc: 0xff4f8a });
  g.userData.krzywa = c; return g;
}

/* --- połknięte rzeczy (kolorowe, widać je i w rentgenie, i na zewnątrz) --- */
function anRzecz(kind, s = 1) {
  const g = new THREE.Group(), P = (geo, c, x, y, z, o) => brPart(g, geo, c, x, y, z, { ol: .025, ...o });
  const sph = (r, n = 12) => new THREE.SphereGeometry(r, n, n * 3 / 4 | 0);
  switch (kind) {
    case 'kaczka':
      P(sph(.22), 0xffd52e, 0, 0, 0, { s: [1.25, .85, .9] }); P(sph(.14), 0xffd52e, .17, .2, 0);
      P(new THREE.ConeGeometry(.06, .14, 8), 0xff7b1c, .33, .18, 0, { r: [0, 0, -Math.PI / 2] });
      for (const z of [-.1, .1]) brPart(g, sph(.025, 6), brMat(0x111111, 'glow'), .24, .25, z, { ol: 0 });
      P(new THREE.ConeGeometry(.08, .16, 6), 0xffd52e, -.26, .1, 0, { r: [0, 0, .9] });
      break;
    case 'budzik':
      P(brCyl(.22, .22, .12, 18, 'z'), 0xe8412f, 0, 0, 0);
      brPart(g, brCyl(.17, .17, .13, 18, 'z'), brMat(0xfff8e6, 'glow'), 0, 0, .01, { ol: 0 });
      brPart(g, brBox(.025, .12, .02), brMat(0x222222, 'glow'), 0, .05, .08, { ol: 0 });
      brPart(g, brBox(.09, .022, .02), brMat(0x222222, 'glow'), .04, 0, .08, { ol: 0 });
      for (const k of [-1, 1]) { P(sph(.08, 8), 0xffc21a, k * .15, .2, 0, { s: [1, .7, 1] }); P(brCyl(.02, .02, .1), 0x333333, k * .14, -.24, 0, { r: [0, 0, k * .4] }); }
      P(brBox(.04, .06, .04), 0x333333, 0, .25, 0);
      break;
    case 'skarpetka':
      P(brExt([[-.1, .32], [.1, .32], [.1, -.05], [.32, -.1], [.32, -.26], [-.1, -.26]], .1, .04, 1), 0x58b7ff, 0, 0, 0);
      for (const y of [.22, .1]) brPart(g, brBox(.22, .05, .13), brMat(0xffffff), 0, y, 0, { ol: 0 });
      brPart(g, brBox(.12, .1, .13), brMat(0xff5a8a), .26, -.18, 0, { ol: 0 });
      break;
    case 'klucz':
      P(new THREE.TorusGeometry(.11, .04, 8, 16), 0xf2c23a, -.2, 0, 0);
      P(brBox(.36, .06, .05), 0xf2c23a, .07, 0, 0);
      for (const x of [.14, .22]) P(brBox(.04, .1, .05), 0xf2c23a, x, -.06, 0);
      break;
    case 'rybka':
      P(brExt([[-.28, 0], [-.4, .14], [-.38, 0, 1], [-.4, -.14], [-.25, 0, 1], [0, -.16], [.22, -.08], [.3, 0], [.22, .1], [0, .17]], .12, .04, 1), 0xff8a24, 0, 0, 0);
      brPart(g, sph(.035, 6), brMat(0x111111, 'glow'), .17, .04, .08, { ol: 0 });
      brPart(g, brBox(.04, .26, .13), brMat(0xffffff), -.06, 0, 0, { ol: 0 });
      break;
    case 'pilka':
      P(sph(.22, 14), 0xff4d6d, 0, 0, 0);
      brPart(g, new THREE.TorusGeometry(.222, .035, 6, 24), brMat(0xffffff), 0, 0, 0, { ol: 0, r: [0, .5, 0] });
      brPart(g, new THREE.TorusGeometry(.222, .035, 6, 24), brMat(0x3ad1ff), 0, 0, 0, { ol: 0, r: [Math.PI / 2, 0, 0] });
      break;
    case 'lod':                                                          // kostka lodu (dla pingwina!)
      P(new THREE.BoxGeometry(.34, .34, .34), new THREE.MeshStandardMaterial({ color: 0xbff0ff, roughness: .1, transparent: true, opacity: .8 }), 0, 0, 0, { r: [.3, .4, .2] });
      brPart(g, new THREE.BoxGeometry(.06, .2, .02), brMat(0xffffff, 'glow'), -.06, .04, .18, { ol: 0, r: [.3, .4, .2] });
      break;
    case 'klocek':
      P(brBox(.44, .2, .22), 0x37c45a, 0, 0, 0);
      for (const x of [-.11, .11]) for (const z of [-.055, .055]) P(brCyl(.045, .045, .06, 10), 0x37c45a, x, .13, z, { ol: .015 });
      break;
  }
  g.scale.setScalar(s); g.userData.rzecz = kind; return g;
}
// Gips: gruby walec wzdłuż +y od 0 do L, w kropki
function anGips(L, r, col) {
  const g = new THREE.Group();
  brPart(g, brCyl(r, r, L, 14), col, 0, L / 2, 0, { ol: .03 });
  for (const y of [.05, L - .05]) brPart(g, brCyl(r * 1.08, r * 1.08, .08, 14), 0xffffff, 0, y, 0, { ol: .015 });
  const dot = new THREE.SphereGeometry(r * .16, 6, 4), dc = brMat(0xffffff);
  for (let i = 0; i < 9; i++) { const a = i * 2.4, y = .15 + (i / 8) * (L - .3); brPart(g, dot, dc, Math.cos(a) * r, y, Math.sin(a) * r, { ol: 0, s: [1, 1, .4] }); }
  return g;
}
// Zadrapanie (do zaklejenia plastrem): trzy różowe kreski jak od pazurka, bez krwi; leży na powierzchni, oś +z = na zewnątrz
function anZadrapanie(r) {
  const g = new THREE.Group(), m = brMat(0xff6f9a, 'glow');
  for (let i = -1; i <= 1; i++) {
    const k = brPart(g, brCyl(r * .09, r * .09, r * 1.6 - Math.abs(i) * r * .3, 8), m, i * r * .38, 0, 0, { r: [0, 0, .5], ol: 0 });
    brPart(k, new THREE.SphereGeometry(r * .09, 8, 6), m, 0, (r * 1.6 - Math.abs(i) * r * .3) / 2, 0, { ol: 0 });
    brPart(k, new THREE.SphereGeometry(r * .09, 8, 6), m, 0, -(r * 1.6 - Math.abs(i) * r * .3) / 2, 0, { ol: 0 });
  }
  brPart(g, new THREE.SphereGeometry(r * 1.05, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffb3c8, transparent: true, opacity: .35, depthWrite: false }), 0, 0, -r * .05, { s: [1, 1, .15], ol: 0 });
  return g;
}
// Plaster: zaokrąglony beżowy pasek z kropkami w kolorze col, płasko na powierzchni (oś +z = na zewnątrz)
function anPlaster(r, col) {
  const g = new THREE.Group(), w = r * 3.4, h = r * 1.3;
  brPart(g, brExt([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r * .25, r * .1, 2), col, 0, 0, 0, { ol: .01 });
  brPart(g, brBox(w * .32, h * .78, r * .3), 0xfff3e0, 0, 0, 0, { ol: 0 });
  const k = new THREE.SphereGeometry(r * .07, 6, 4);
  for (const x of [-1, 1]) for (const y of [-1, 1]) brPart(g, k, brMat(0xffffff, 'glow'), x * w * .32, y * h * .2, r * .14, { ol: 0 });
  return g;
}
// Lizak dla dzielnego pacjenta: patyczek + kolorowy krążek w spiralę (płasko w x-y), wysokość ~ s
function anLizak(s) {
  const g = new THREE.Group();
  brPart(g, brCyl(.04, .04, 1.1, 8), 0xffffff, 0, -.55, 0, { ol: .02 });
  brPart(g, brCyl(.45, .45, .16, 24, 'z'), 0xff5c8a, 0, .3, 0, { ol: .03 });
  for (const [r, c] of [[.34, 0xffffff], [.22, 0xffd23f], [.1, 0x3ab0ff]]) brPart(g, new THREE.TorusGeometry(r, .045, 6, 24), brMat(c), 0, .3, .085, { ol: 0 });
  g.scale.setScalar(s); return g;
}
// Lupa rentgena (ikona przycisku): złota obręcz, niebieskie szkło z kośćmi, rączka
function anLupa() {
  const g = new THREE.Group();
  brPart(g, new THREE.TorusGeometry(.5, .09, 10, 32), 0xffc93c, 0, 0, 0, { ol: .03 });
  brPart(g, brCyl(.46, .46, .05, 28, 'z'), new THREE.MeshStandardMaterial({ color: 0x5ad1ff, emissive: 0x1a6aa0, emissiveIntensity: .6, roughness: .1 }), 0, 0, 0, { ol: 0 });
  const k = anKosc(.5, .05); k.position.set(-.08, -.25, .06); k.rotation.z = -.6; g.add(k);
  brPart(g, brCyl(.09, .11, .75, 10), 0xc46a2a, .62, -.62, 0, { r: [0, 0, Math.PI / 4], ol: .03 });
  return g;
}
// Złota gwiazdka-naklejka
function anGwiazda() { const g = new THREE.Group(); brPart(g, brExt(brGwiazdaPts(.5, .23), .16, .05, 0), 0xffc93c, 0, 0, 0, { ol: .03 }); return g; }
// Cień miejsca: ten sam kształt jako biała, półprzezroczysta poświata (bez konturów)
function anDuch(obj) {
  const m = anDuch.m || (anDuch.m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .28, depthWrite: false, depthTest: false }));
  const c = obj.clone(true), drop = [];
  c.traverse(o => { if (o.isMesh) { if (o.material.side === THREE.BackSide) drop.push(o); else { o.material = m; o.renderOrder = 25; } } });
  drop.forEach(o => o.parent.remove(o));
  c.userData = { duch: true }; return c;
}
// Organ na swoim miejscu żyje: serce bije, płuca oddychają, żołądek bulgocze, mózg błyszczy
function anTik(o, t) {
  const n = o.userData.organ, s0 = o.userData.s0 || (o.userData.s0 = o.scale.x);
  if (!o.userData.zywy) { o.scale.setScalar(s0); return; }
  if (n === 'serce') { const b = (t * 1.3) % 1, k = b < .12 ? Math.sin(b / .12 * Math.PI) : b > .2 && b < .32 ? .6 * Math.sin((b - .2) / .12 * Math.PI) : 0; o.scale.setScalar(s0 * (1 + .14 * k)); }
  else if (n === 'pluca') { const k = Math.sin(t * 1.6) * .5 + .5; o.children.forEach(p => { if (p.userData.k) p.scale.set(1 + .08 * k, 1 + .05 * k, 1); }); }
  else if (n === 'zoladek') o.scale.set(s0 * (1 + Math.sin(t * 3) * .03), s0 * (1 - Math.sin(t * 3) * .03), s0);
  else if (n === 'mozg') o.rotation.z = Math.sin(t * 2) * .04;
  else if (n === 'jelita') o.rotation.z = Math.sin(t * 1.4) * .05;
  else if (n === 'pecherz') o.scale.setScalar(s0 * (1 + Math.sin(t * 2) * .04));
  else if (n === 'nerki') o.rotation.z = Math.sin(t * 1.7) * .03;
}
