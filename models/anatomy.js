// Klinika Zoo — wnętrze pacjenta w rentgenie: kości (świecące, z niebieską poświatą), organy (kreskówkowe, kolorowe),
// przełyk, połknięte rzeczy, gips, „duch” = półprzezroczysty cień miejsca, gdzie coś ma wrócić.
// Wszystko w płaszczyźnie x-y (widok z boku), grubość wzdłuż z, środek części w (0, 0) — gra ustawia pozycję.
// Kości: anKosc(L, r) · anKoscP(rodzic, [x0,y0], [x1,y1], r) · anKreg(r) · anCzaszka(obrys, oko) · anZebraBok · anZebraPrzod · anPlaska(obrys, gł.)
// Organy: anSerce · anPluca · anZoladek · anJelita · anMozg · anWatroba · anNerki · anPecherz (s) · anOrgan(nazwa, s) · anPrzelyk(punkty, r) · anJelitaTrasa(punkty, r, iGrube)
// Rzeczy: anRzecz('kaczka'|'budzik'|'skarpetka'|'klucz'|'rybka'|'pilka'|'klocek'|'lod', s) · anGips(L, r, kolor) · anDuch(obiekt)
// anZadrapanie(r) · anPlaster(r, kolor) — zadrapania do zaklejania na skórze · anLizak(s) — nagroda · anLupa() · anGwiazda() — ikony
// anDrzazga(L) · anPchla(s) · anBandaz(r, h) · anStetoskop() · anTermometr() · anSyrop(kolor) — narzędzia i kłopoty do zabiegów bez rentgena
// anOwijka(przekroje, u0, u1, zwoje) — bandaż z gazy owijany spiralą wokół części ciała · anSzczoteczka() — do mycia kłów
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
// Drzazga (kolec): brązowy patyczek z ostrym końcem wzdłuż +z (wbity końcem w 0, wystaje na zewnątrz), długość L
function anDrzazga(L) {
  const g = new THREE.Group(), r = L * .09;
  brPart(g, brCyl(r, r * .3, L * .8, 8, 'z'), 0x9b5a2a, 0, 0, L * .4 + L * .2, { ol: L * .02 });
  brPart(g, new THREE.ConeGeometry(r * .3, L * .25, 8).rotateX(-Math.PI / 2), 0x6e3d1a, 0, 0, L * .1, { ol: 0 });
  brPart(g, new THREE.SphereGeometry(r, 8, 6), 0xb06a34, 0, 0, L, { ol: L * .02 });
  return g;
}
// Pchła: ciemnobrązowa kropka z nóżkami i czułkami, oczka; leży na powierzchni (oś +z = na zewnątrz), wielkość ~ s
function anPchla(s) {
  const g = new THREE.Group(), K = 0x4a2a14;
  brPart(g, new THREE.SphereGeometry(.5, 12, 8), K, 0, 0, .3, { s: [1.2, .8, .7], ol: .05 });
  brPart(g, new THREE.SphereGeometry(.28, 10, 6), K, .55, .05, .35, { ol: .04 });
  for (const y of [-1, 1]) {
    brPart(g, new THREE.SphereGeometry(.1, 8, 6), brMat(0xffffff, 'glow'), .72, y * .12, .5, { ol: 0 });
    brPart(g, brCyl(.025, .02, .5, 5), K, .75, y * .25, .45, { r: [0, 0, -y * .9], ol: 0 });
    for (const x of [-.3, 0, .3]) brPart(g, brCyl(.04, .03, .55, 5), K, x, y * .45, .15, { r: [y * .6, 0, 0], ol: 0 });
  }
  g.scale.setScalar(s); return g;
}
// Bandaż: biały walec (opaska) wzdłuż +y od 0 do h, promień r, z delikatnymi liniami zwojów
function anBandaz(r, h) {
  const g = new THREE.Group();
  brPart(g, brCyl(r, r, h, 18), 0xfbfaf2, 0, h / 2, 0, { ol: .015 });
  for (let i = 1; i < 3; i++) brPart(g, new THREE.TorusGeometry(r * 1.01, r * .04, 4, 24).rotateX(Math.PI / 2), 0xd9d4c4, 0, h * i / 3, 0, { r: [.15, 0, .1], ol: 0 });
  return g;
}
// Stetoskop (ikona i słuchawka): srebrna główka, gumowy wąż do słuchawek
function anStetoskop() {
  const g = new THREE.Group(), guma = 0x2b3a67;
  brPart(g, brCyl(.32, .32, .14, 22, 'z'), new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: .7, roughness: .25 }), -.35, -.4, 0, { ol: .03 });
  brPart(g, brCyl(.24, .24, .16, 22, 'z'), 0xeeeeee, -.35, -.4, .02, { ol: 0 });
  brPart(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-.35, -.1], [-.2, .3], [.15, .5], [.3, .2], [.35, -.1]].map(p => new THREE.Vector3(p[0], p[1], 0))), 24, .05, 6), guma, 0, 0, 0, { ol: .02 });
  for (const x of [.3, .42]) brPart(g, new THREE.SphereGeometry(.07, 8, 6), 0x222222, x, -.12, 0, { ol: 0 });
  return g;
}
// Termometr: biała pałeczka z czerwonym słupkiem i kulką na dole (wzdłuż +y), wysokość ~1
function anTermometr() {
  const g = new THREE.Group();
  brPart(g, brCyl(.09, .09, .9, 12), 0xffffff, 0, .45, 0, { ol: .025 });
  brPart(g, brCyl(.04, .04, .6, 8), brMat(0xff3a4a, 'glow'), 0, .38, .06, { ol: 0 });
  brPart(g, new THREE.SphereGeometry(.13, 12, 8), brMat(0xff3a4a, 'glow'), 0, 0, 0, { ol: .025 });
  return g;
}
// Syrop: butelka w kolorze col z białą etykietą i nakrętką (wzdłuż +y), wysokość ~1
function anSyrop(col) {
  const g = new THREE.Group();
  brPart(g, brCyl(.3, .32, .65, 18), col, 0, .33, 0, { ol: .03 });
  brPart(g, brCyl(.13, .18, .16, 14), col, 0, .73, 0, { ol: .025 });
  brPart(g, brCyl(.15, .15, .14, 14), 0xffffff, 0, .86, 0, { ol: .025 });
  brPart(g, brCyl(.305, .305, .3, 18), 0xfffdf2, 0, .33, 0, { ol: 0 });
  return g;
}
// Opaska z gazy owinięta spiralą wokół części ciała. prof = { os: 'x'|'y', sl: [{ u, cp, cq, rp, rq }, …] } — przekroje wzdłuż osi
// (u = położenie na osi, cp/cq = środek, rp/rq = promienie w dwóch pozostałych osiach, rosnąco po u), u0..u1 = owijany odcinek,
// n = liczba zwojów. Zwoje zachodzą na siebie (każdy trochę wyżej), lekko krzywo jak owinięte ręką; brzeg podkreślony kreską.
// Zwraca grupę z userData.pokaz(f) — owinięte f = 0..1 (do animacji owijania palcem i odwijania).
function anOwijka(prof, u0, u1, n) {
  const sl = prof.sl, M = Math.max(24, Math.round(n * 44)), w = (u1 - u0) / n * 1.45, pos = [], uv = [], idx = [], brzeg = [];
  const przekroj = u => { let i = 0; while (i < sl.length - 2 && sl[i + 1].u < u) i++; const a = sl[i], b = sl[i + 1] || a, k = b.u === a.u ? 0 : Math.max(0, Math.min(1, (u - a.u) / (b.u - a.u)));
    return { cp: a.cp + (b.cp - a.cp) * k, cq: a.cq + (b.cq - a.cq) * k, rp: a.rp + (b.rp - a.rp) * k, rq: a.rq + (b.rq - a.rq) * k }; };
  const pkt = (u, th, f) => { const s = przekroj(u), p = s.cp + Math.cos(th) * s.rp * f, q = s.cq + Math.sin(th) * s.rq * f; return prof.os === 'x' ? [u, p, q] : [p, u, q]; };
  for (let i = 0; i <= M; i++) {
    const t = i / M, th = t * n * Math.PI * 2, uc = u0 + w / 2 + (u1 - u0 - w) * t, f = 1.07 + .018 * n * t, kr = Math.sin(th * .5 + 1) * w * .08;
    for (const e of [-.5, .5]) { pos.push(...pkt(uc + e * w + kr, th, f + (e > 0 ? .01 : 0))); uv.push(t * n * 3, e + .5); }
    brzeg.push(new THREE.Vector3(...pkt(uc - .5 * w + kr, th, f + .012)));
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const tex = anOwijka.tex || (anOwijka.tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#f7f1df'; x.fillRect(0, 0, 64, 64); x.strokeStyle = 'rgba(185,170,135,.35)'; x.lineWidth = 1.5;
    for (let k = 0; k < 64; k += 8) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 64); x.moveTo(0, k); x.lineTo(64, k); x.stroke(); }
    x.fillStyle = 'rgba(160,140,100,.25)'; x.fillRect(0, 0, 64, 4); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })());
  const grp = new THREE.Group(), m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color: 0xffffff, map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }));
  const kr = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(brzeg), M, w * .035, 5), brMat(0xb9aa86));
  grp.add(m, kr); m.castShadow = true;
  grp.userData.pokaz = f => { f = Math.max(0, Math.min(1, f)); const k = Math.floor(f * M); m.geometry.setDrawRange(0, k * 6); kr.geometry.setDrawRange(0, k * 5 * 6); grp.visible = k > 0; };
  grp.userData.pokaz(0); return grp;
}
// Szczoteczka do zębów: rączka w paski, główka z białym włosiem (wzdłuż +x), długość ~1
function anSzczoteczka() {
  const g = new THREE.Group();
  brPart(g, brCyl(.07, .09, .8, 10, 'x'), 0x3ab0ff, -.1, 0, 0, { ol: .025 });
  brPart(g, brCyl(.075, .075, .12, 10, 'x'), 0xffffff, -.2, 0, 0, { ol: 0 });
  brPart(g, brBox(.32, .06, .14), 0x3ab0ff, .4, .02, 0, { ol: .02 });
  for (let i = 0; i < 4; i++) brPart(g, brBox(.05, .14, .12), 0xffffff, .3 + i * .07, .12, 0, { ol: .01 });
  brPart(g, new THREE.SphereGeometry(.09, 10, 8), brMat(0x9be8ff, 'glow'), .38, .26, 0, { ol: .015 });
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
