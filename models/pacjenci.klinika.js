// Klinika Zoo — pacjenci w stylu Dzikich Bryk (toon + czarny kontur, bryły wyciągane z obrysu): żyrafa, słoń, opiekun zoo.
// Dwie warstwy kamery: 0 = skóra (zwykły widok), 1 = rentgen (świecący zarys ciała, kości, organy, przełyk).
// Zwierzęta z boku (przód = +x), opiekun przodem do kamery (+z). Początek = środek między stopami na podłodze.
// klPacjent('zyrafa'|'slon'|'opiekun') → P = { g, kind, nogi, rece, szyja, glowa, organy, przelyk, kregi, kosc, rzecz, box }
//   organy[n] = { o: grupa organu, dom: [x,y,z], zle: [[x,y], …] miejsca, gdzie może się zgubić }
//   przelyk = punkty od żołądka do pyszczka · kregi = { grupa, sloty, opad } · kosc = { grupa, dol, dom, zle, gips }
// klKrok(P, t, k) — chód (k = 0..1 siła) · klOddech(P, t) — spokojne bujanie
// wymaga: lib/komiks.bryki-klinika.js (brPart, brExt, brCyl, brBox, brMat), models/anatomia.klinika.js, THREE

/* --- warstwy i materiał rentgena --- */
function klXMat() {
  return klXMat.m || (klXMat.m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 p = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); gl_Position = projectionMatrix * p; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4); gl_FragColor = vec4(mix(vec3(.2,.45,.85), vec3(.65,.92,1.0), f), .2 + .7 * f); }',
  }));
}
const klX = o => { o.traverse(c => c.layers.set(1)); return o; };            // tylko w rentgenie
const klObie = o => { o.traverse(c => { c.layers.enable(0); c.layers.enable(1); }); return o; };   // w obu widokach
// Skóra: część w zwykłym widoku + jej bliźniak w rentgenie (świecący zarys)
function klSkora(par, geo, col, x = 0, y = 0, z = 0, o = {}) {
  const m = brPart(par, geo, col, x, y, z, { ol: .04, ...o });
  const xm = new THREE.Mesh(geo, klXMat()); xm.position.copy(m.position); xm.rotation.copy(m.rotation); xm.scale.copy(m.scale);
  xm.layers.set(1); xm.renderOrder = 5; par.add(xm);
  return m;
}
// Rura zwężająca się od r0 do r1 wzdłuż krzywej (trąba, ogon, szyja)
function klRura(curve, r0, r1, n = 40, rs = 12) {
  const g = new THREE.TubeGeometry(curve, n, 1, rs), p = g.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    curve.getPointAt(i / n, c); const r = r0 + (r1 - r0) * i / n;
    for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); }
  }
  g.computeVertexNormals(); return g;
}
// Ustaw pozycję (i obrót wokół z) i zwróć obiekt
function klPoz(o, x, y, z, rz = 0) { o.position.set(x, y, z); o.rotation.z = rz; return o; }
const klKrz = pts => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2] || 0)));
// Oko kreskówkowe (tylko skóra): białko, źrenica, błysk; s = +1 patrzy w +z, −1 w −z
function klOko(par, x, y, z, r, s = 1, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); par.add(g);
  brPart(g, new THREE.SphereGeometry(r, 14, 10), 0xffffff, 0, 0, 0, { s: [1, 1.1, .5], ol: .025 });
  brPart(g, new THREE.SphereGeometry(r * .55, 10, 8), brMat(0x1b1410, 'glow'), (o.dx || 0) * r, (o.dy || 0) * r, s * r * .35, { s: [1, 1.1, .5], ol: 0 });
  brPart(g, new THREE.SphereGeometry(r * .18, 6, 4), brMat(0xffffff, 'glow'), (o.dx || 0) * r + r * .18, (o.dy || 0) * r + r * .22, s * r * .55, { ol: 0 });
  if (o.powieka) brPart(g, new THREE.SphereGeometry(r * 1.05, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), o.powieka, 0, r * .25, 0, { s: [1, .5, .55], ol: .02 });
  return g;
}
// Łaty / plamy na obu bokach (tylko skóra)
function klLaty(par, list, z, col) {
  for (const [x, y, r, a] of list) {
    const pts = []; for (let i = 0; i < 7; i++) { const t = i / 7 * Math.PI * 2 + a, rr = r * (.75 + .25 * Math.sin(i * 2.3 + a * 5)); pts.push([Math.cos(t) * rr * 1.2, Math.sin(t) * rr]); }
    const geo = brExt(pts, .02, 0, 1);
    for (const s of [-1, 1]) brPart(par, geo, col, x, y, s * z, { ol: 0 });
  }
}
// Noga zwierzęcia: grupa w biodrze, skóra od 0 do −L, kopyto, dwie kości
function klNoga(P, x, y, z, L, w0, w1, col, cKop, r, faza) {
  const g = new THREE.Group(); g.position.set(x, y, z); P.g.add(g);
  klSkora(g, brExt([[-w0 / 2, .15], [w0 / 2, .15], [w1 / 2, -L + .2], [-w1 / 2, -L + .2]], w0 * .9, .05, 1), col);
  klSkora(g, brExt([[-w1 / 2 - .03, -L + .22], [w1 / 2 + .03, -L + .22], [w1 / 2 + .05, -L], [-w1 / 2 - .05, -L]], w1 * 1.05, .03, 0), cKop);
  const n = { g, L, faza, os: 'z', k1: klX(anKoscP(g, [0, -.08], [0, -L * .47], r)), k2: klX(anKoscP(g, [0, -L * .53], [0, -L + .14], r * .85)) };
  P.nogi.push(n); return n;
}
// Złamana kość: dolna część przesunięta o (dx, dy) i obrócona o drz względem miejsca; gips = { y0, L, r } w grupie kończyny
function klZlamana(grupa, dol, dx, dy, drz, gips) {
  const dom = { x: dol.position.x, y: dol.position.y, rz: dol.rotation.z };
  return { grupa, dol, dom, zle: { x: dom.x + dx, y: dom.y + dy, rz: dom.rz + drz }, gips };
}
function klNowy(kind) {
  const g = new THREE.Group();
  return { g, kind, nogi: [], rece: [], organy: {}, kosci: [], t: Math.random() * 9 };
}
function klOrgan(P, par, n, x, y, z, s, zle) {
  const o = klX(anOrgan(n, s)); o.position.set(x, y, z); par.add(o); o.userData.zywy = true;
  P.organy[n] = { o, dom: [x, y, z], zle, par };
}

/* --- ŻYRAFA: długa szyja na zawiasie w barku (opada, gdy brakuje kręgów) --- */
function klZyrafa() {
  const P = klNowy('zyrafa'), g = P.g, Z = 0xf3c25a, Zc = 0xd9a640, L = 0xb8642a, K = 0x4a3020;
  P.box = { x0: -1.7, x1: 3.1, y0: 0, y1: 5.6 };
  // nogi: daleka para ciemniejsza
  klNoga(P, -.68, 2.05, -.3, 2.05, .3, .2, Zc, K, .06, Math.PI);
  klNoga(P, .98, 2.05, -.3, 2.05, .3, .2, Zc, K, .06, 0);
  klNoga(P, -.88, 2.05, .3, 2.05, .3, .2, Z, K, .06, 0);
  klNoga(P, .78, 2.05, .3, 2.05, .3, .2, Z, K, .06, Math.PI);
  P.nogi.forEach(n => klLaty(n.g, [[0, -.5, .1, 1], [.02, -1.1, .08, 2]], .14, L));
  // tułów
  const body = brExt([[-1.25, 2.05], [-1.15, 2.6], [-.4, 2.8], [.5, 2.88], [1.18, 2.78], [1.38, 2.3], [1.12, 1.85], [.2, 1.76], [-.85, 1.8]], 1.0, .1, 3);
  klSkora(g, body, Z);
  klLaty(g, [[-.8, 2.35, .18, 0], [-.3, 2.55, .2, 1], [.25, 2.3, .19, 2], [.75, 2.55, .18, 3], [-.35, 2.05, .15, 4], [.6, 2.05, .14, 5], [1.1, 2.35, .12, 6]], .52, L);
  // ogon z chwostem
  const ogon = klKrz([[-1.18, 2.55], [-1.42, 2.3], [-1.5, 1.85]]);
  klSkora(g, klRura(ogon, .06, .04, 12, 6), Z);
  klSkora(g, new THREE.SphereGeometry(.13, 8, 6), K, -1.5, 1.72, 0, { s: [.8, 1.4, .8] });
  // szyja: grupa w barku
  const sz = new THREE.Group(); sz.position.set(1.0, 2.6, 0); g.add(sz); P.szyja = sz;
  klSkora(sz, brExt([[-.32, -.15], [.38, -.3], [.86, 2.3], [.3, 2.45]], .55, .08, 2), Z);
  klLaty(sz, [[.12, .35, .12, 1], [.25, .9, .11, 2], [.38, 1.45, .1, 3], [.5, 1.95, .09, 4]], .29, L);
  for (let i = 0; i < 9; i++) brPart(sz, brBox(.12, .2, .12), K, -.2 + i * .065, .1 + i * .27, 0, { r: [0, 0, -.25], ol: .02 });   // grzywa
  // głowa
  const gl = new THREE.Group(); gl.position.set(.6, 2.5, 0); sz.add(gl); P.glowa = gl;
  const glPts = [[-.3, -.05], [-.25, .25], [.1, .32], [.55, .16], [.72, -.04], [.62, -.2], [.2, -.24], [-.2, -.2]];
  klSkora(gl, brExt(glPts, .52, .08, 2), Z);
  brPart(gl, brExt([[.4, .1], [.74, -.02], [.66, -.2], [.38, -.2]], .5, .06, 2), 0xe0a85a, 0, 0, 0, { ol: .02 });   // pyszczek
  for (const s of [-1, 1]) {
    klSkora(gl, brCyl(.04, .05, .3), Z, -.12, .42, s * .12, { r: [0, 0, -.2] });
    brPart(gl, new THREE.SphereGeometry(.07, 8, 6), K, -.15, .58, s * .12);
    brPart(gl, brExt([[0, 0], [-.3, .12], [-.38, 0], [-.2, -.08]], .06, .02, 1), Z, -.18, .18, s * .26, { r: [s * .3, 0, 0] });
    klOko(gl, .12, .12, s * .31, .1, s, { dx: .3, powieka: brMat(Z) });
    brPart(gl, new THREE.SphereGeometry(.03, 6, 4), brMat(0x3a2414, 'glow'), .66, .02, s * .14, { ol: 0 });
  }
  // kości
  const kr = new THREE.Group(); kr.position.z = -.15; g.add(kr); klX(kr);
  for (let i = 0; i < 9; i++) kr.add(klPoz(anKreg(.09), -1.1 + i * .25, 2.58 + Math.sin(i / 8 * Math.PI) * .12, 0));
  kr.add(klPoz(anZebraBok(-.3, .85, 2.62, .72, 6), 0, 0, -.15));
  kr.add(klPoz(anPlaska([[-.35, .1], [.2, .25], [.3, -.05], [-.1, -.25]]), -.85, 2.3, .2));
  kr.add(klPoz(anPlaska([[-.15, .3], [.2, .3], [.1, -.35], [-.05, -.35]]), .8, 2.35, .2));
  for (let i = 0; i < 5; i++) kr.add(klPoz(anKreg(.045), -1.22 - i * .07, 2.48 - i * .14, 0));
  klX(kr);
  const cz = klX(anCzaszka(glPts.map(([x, y]) => [x * .85 + .04, y * .8]), [.12, .1, .07], .28)); gl.add(cz);
  // kręgi szyi: 7 miejsc wzdłuż szyi (gra je wypełnia)
  P.kregi = { grupa: sz, opad: -.85, glowaOpad: -.7, sloty: [] };
  for (let i = 0; i < 7; i++) { const t = (i + .5) / 7; P.kregi.sloty.push({ x: .05 + t * .52, y: .15 + t * 2.15, rz: -.235 }); }
  // organy
  klOrgan(P, g, 'pluca', .4, 2.42, 0, .85, []);
  klOrgan(P, g, 'serce', .8, 2.05, .25, .78, [[-.88, .95], [-1.5, 1.95], [.78, .9]]);
  klOrgan(P, g, 'zoladek', -.28, 2.25, .1, .95, []);
  klOrgan(P, g, 'jelita', -.85, 2.25, 0, .7, []);
  const mz = klX(anMozg(.32)); mz.position.set(-.05, .1, 0); mz.userData.zywy = true; gl.add(mz); P.mozgGlowy = mz;
  // przełyk (przy prostej szyi), od żołądka do pyszczka
  P.przelyk = [[-.25, 2.42], [.45, 2.62], [1.05, 2.82], [1.25, 3.55], [1.42, 4.25], [1.56, 4.85], [1.8, 5.0], [2.2, 4.96]];
  P.rzeczS = 1.35;
  return P;
}

/* --- SŁOŃ: wielki, z trąbą (bez kości!) i uszami --- */
function klSlon() {
  const P = klNowy('slon'), g = P.g, S = 0x9aa8bf, Sd = 0x7f8ca5, R = 0xf2b3c4, Pz = 0xf4efe2;
  P.box = { x0: -2.0, x1: 2.9, y0: 0, y1: 3.4 };
  klNoga(P, -.82, 1.55, -.45, 1.55, .58, .54, Sd, Pz, .1, Math.PI);
  klNoga(P, .98, 1.55, -.45, 1.55, .58, .54, Sd, Pz, .1, 0);
  klNoga(P, -1.02, 1.55, .45, 1.55, .58, .54, S, Pz, .1, 0);
  const przod = klNoga(P, .78, 1.55, .45, 1.55, .58, .54, S, Pz, .1, Math.PI);
  for (const n of P.nogi) for (const dx of [-.15, 0, .15]) brPart(n.g, new THREE.SphereGeometry(.07, 8, 6), Pz, dx, -1.45, .25, { s: [1, .8, .5], ol: .015 });
  klSkora(g, brExt([[-1.6, 2.0], [-1.45, 2.75], [-.6, 3.08], [.4, 3.08], [1.1, 2.85], [1.38, 2.25], [1.12, 1.35], [0, 1.12], [-1.2, 1.3]], 1.6, .14, 3), S);
  // ogon
  klSkora(g, klRura(klKrz([[-1.55, 2.5], [-1.85, 2.1], [-1.9, 1.6]]), .07, .045, 12, 6), S);
  brPart(g, new THREE.ConeGeometry(.1, .25, 6), 0x4e5566, -1.9, 1.45, 0, { r: [0, 0, Math.PI] });
  // głowa, trąba, kły, uszy
  const hd = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; hd.push([1.5 + Math.cos(a) * .78, 2.5 + Math.sin(a) * .7]); }
  klSkora(g, brExt(hd, 1.15, .14, 1), S);
  const traba = klKrz([[2.0, 2.35], [2.3, 1.95], [2.4, 1.4], [2.38, 1.0], [2.55, .82], [2.68, .95]]);
  klSkora(g, klRura(traba, .3, .12, 40, 12), S);
  for (let i = 1; i < 9; i++) { const p = traba.getPointAt(i / 11); brPart(g, new THREE.TorusGeometry(.3 - i * .018, .012, 4, 16, Math.PI), brMat(0x6f7b93), p.x, p.y, 0, { r: [Math.PI / 2, 0, -.3], ol: 0 }); }
  for (const s of [-1, 1]) {
    const ucho = brExt([[0, .5], [-.55, .45], [-.75, -.1], [-.45, -.65], [-.05, -.55], [.1, 0]], .08, .04, 2);
    klSkora(g, ucho, Sd, 1.3, 2.55, s * .66, { r: [0, s * .25, 0] });
    brPart(g, brExt([[-.05, .38], [-.45, .33], [-.6, -.05], [-.38, -.48], [-.08, -.4], [.02, 0]], .02, 0, 2), R, 1.3, 2.55, s * .7 + s * .03, { r: [0, s * .25, 0], ol: 0 });
    klOko(g, 1.9, 2.75, s * .64, .11, s, { dx: .3, powieka: brMat(S) });
    const kiel = klKrz([[1.95, 2.0, s * .3], [2.2, 1.85, s * .35], [2.42, 1.92, s * .33]]);
    klSkora(g, klRura(kiel, .08, .025, 10, 8), Pz);
  }
  // kości
  const kr = new THREE.Group(); kr.position.z = -.25; g.add(kr);
  for (let i = 0; i < 10; i++) kr.add(klPoz(anKreg(.12), -1.45 + i * .27, 2.72 + Math.sin(i / 9 * Math.PI) * .14, 0));
  kr.add(klPoz(anZebraBok(-.5, .85, 2.75, 1.15, 7, .06), 0, 0, -.2));
  kr.add(klPoz(anPlaska([[-.45, .15], [.3, .3], [.4, -.1], [-.15, -.35]]), -1.05, 2.25, .3));
  kr.add(klPoz(anPlaska([[-.2, .4], [.25, .4], [.15, -.4], [-.05, -.4]]), .85, 2.35, .3));
  for (let i = 0; i < 5; i++) kr.add(klPoz(anKreg(.05), -1.62 - i * .06, 2.4 - i * .16, 0));
  kr.add(klPoz(anCzaszka(hd.map(([x, y]) => [(x - 1.5) * .82, (y - 2.5) * .8]), [.32, .2, .13], .5), 1.5, 2.5, .25));
  klX(kr);
  // złamana noga (przednia bliższa): dolna kość wyskoczyła w bok
  const L = przod.L;
  P.kosc = klZlamana(przod.g, przod.k2, .42, .05, .75, { y0: -L + .05, L: L * .62, r: .36 });
  // organy
  klOrgan(P, g, 'pluca', .35, 2.42, 0, .95, []);
  klOrgan(P, g, 'serce', .7, 1.75, .3, .85, []);
  klOrgan(P, g, 'zoladek', -.35, 1.92, .1, 1.0, []);
  klOrgan(P, g, 'jelita', -1.0, 1.95, 0, .9, []);
  klOrgan(P, g, 'mozg', 1.45, 2.78, .3, .6, [[2.4, 1.25], [-1.85, 1.75], [-1.02, .75]]);
  P.przelyk = [[-.35, 2.15], [.15, 2.45], [.75, 2.68], [1.3, 2.45], [1.6, 2.12], [1.98, 2.02]];
  P.rzeczS = 1.5;
  return P;
}

/* --- OPIEKUN ZOO: przodem do kamery, w kapeluszu, z wąsem --- */
function klOpiekun() {
  const P = klNowy('opiekun'), g = P.g, Sk = 0xf6c49b, Ko = 0xa4b05e, Sp = 0x4f6b3a, Bu = 0x7a4a26;
  P.box = { x0: -1.35, x1: 1.35, y0: 0, y1: 3.75 };
  // nogi (grupy w biodrach, kołyszą się w osi x)
  for (const s of [-1, 1]) {
    const n = new THREE.Group(); n.position.set(s * .26, 1.42, 0); g.add(n);
    klSkora(n, brExt([[-.2, .1], [.2, .1], [.17, -1.15], [-.17, -1.15]], .36, .06, 1), Sp);
    klSkora(n, brExt([[-.2, -1.12], [.2, -1.12], [.24 + s * .06, -1.42], [-.24 + s * .06, -1.42]], .5, .06, 1), Bu, 0, 0, .06);
    P.nogi.push({ g: n, faza: s > 0 ? 0 : Math.PI, os: 'x', L: 1.42 });
    klX(anKoscP(n, [0, -.05], [0, -.66], .06)); klX(anKoscP(n, [0, -.72], [0, -1.28], .055));
  }
  // tułów: koszula khaki z kieszeniami i paskiem
  klSkora(g, brExt([[-.58, 1.35], [.58, 1.35], [.62, 2.45], [.4, 2.62], [-.4, 2.62], [-.62, 2.45]], .55, .08, 1), Ko);
  brPart(g, brBox(1.22, .12, .6), 0x5a3a20, 0, 1.42, 0, { ol: .02 });
  brPart(g, brBox(.18, .12, .62), 0xf2c23a, 0, 1.42, 0, { ol: .02 });
  for (const s of [-1, 1]) brPart(g, brBox(.28, .26, .04), 0x8e9a4c, s * .28, 2.2, .3, { ol: .015 });
  for (const y of [1.65, 1.9, 2.15, 2.4]) brPart(g, new THREE.SphereGeometry(.03, 6, 4), 0x5a3a20, 0, y, .3, { ol: 0 });
  // ręce (grupy w barkach)
  for (const s of [-1, 1]) {
    const r = new THREE.Group(); r.position.set(s * .64, 2.45, 0); r.rotation.z = s * .12; g.add(r);
    klSkora(r, brExt([[-.16, .12], [.16, .12], [.15, -.42], [-.15, -.42]], .32, .06, 1), Ko);
    klSkora(r, brCyl(.11, .1, .58, 10), Sk, 0, -.68, 0);
    klSkora(r, new THREE.SphereGeometry(.15, 10, 8), Sk, 0, -1.05, 0);
    const k1 = klX(anKoscP(r, [0, -.04], [0, -.42], .05)), k2 = klX(anKoscP(r, [0, -.48], [0, -.92], .045));
    for (let i = 0; i < 3; i++) klX(anKoscP(r, [(i - 1) * .06, -.98], [(i - 1) * .08, -1.14], .02));
    P.rece.push({ g: r, faza: s > 0 ? Math.PI : 0, os: 'x', s, k1, k2 });
  }
  // głowa: duża, z kapeluszem i wąsem
  klSkora(g, brCyl(.15, .17, .2, 10), Sk, 0, 2.7, 0);
  const gl = new THREE.Group(); gl.position.set(0, 3.08, 0); g.add(gl); P.glowa = gl;
  const glPts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; glPts.push([Math.cos(a) * .44, Math.sin(a) * .47 - (Math.sin(a) < 0 ? Math.sin(a) * .05 : 0)]); }
  klSkora(gl, brExt(glPts, .7, .14, 1), Sk);
  for (const s of [-1, 1]) {
    klSkora(gl, new THREE.SphereGeometry(.1, 8, 6), Sk, s * .46, 0, 0, { s: [.6, 1, .8] });
    klOko(gl, s * .16, .08, .4, .085, 1, { dy: -.1 });
    brPart(gl, brBox(.16, .035, .04), 0x5a3418, s * .16, .22, .44, { r: [0, 0, -s * .15], ol: 0 });
    brPart(gl, new THREE.SphereGeometry(.09, 8, 6), 0x6b4022, s * .09, -.14, .45, { s: [1.3, .6, .5], ol: .015 });   // wąs
    brPart(gl, new THREE.SphereGeometry(.07, 8, 6), 0xff9c8a, s * .28, -.08, .38, { s: [1, .7, .3], ol: 0 });          // rumieńce
  }
  brPart(gl, new THREE.SphereGeometry(.08, 8, 6), 0xf0a77e, 0, -.02, .47, { ol: .015 });
  brPart(gl, new THREE.TorusGeometry(.09, .02, 4, 10, Math.PI), brMat(0x5a2a18, 'glow'), 0, -.24, .43, { r: [0, 0, Math.PI], ol: 0 });
  brPart(gl, brCyl(.62, .66, .06, 20), 0xc9b26a, 0, .38, 0, { ol: .03 });
  brPart(gl, brCyl(.36, .42, .32, 16), 0xc9b26a, 0, .55, 0, { ol: .03 });
  brPart(gl, brCyl(.425, .425, .08, 16), 0x5a3a20, 0, .44, 0, { ol: 0 });
  // kości tułowia i czaszka
  const kr = new THREE.Group(); kr.position.z = -.2; g.add(kr);
  for (let i = 0; i < 8; i++) kr.add(klPoz(anKreg(.07), 0, 1.5 + i * .15, -.05));
  kr.add(klPoz(anZebraPrzod(.5, 2.45, .15, 5), 0, 0, -.1));
  kr.add(klPoz(anPlaska([[-.12, .3], [.12, .3], [.1, -.32], [-.1, -.32]]), 0, 2.15, -.08));
  kr.add(klPoz(anPlaska([[0, .05], [.25, .2], [.5, .1], [.45, -.2], [.15, -.25], [0, -.15], [-.15, -.25], [-.45, -.2], [-.5, .1], [-.25, .2]]), 0, 1.38, .1));
  for (const s of [-1, 1]) kr.add(klPoz(anKosc(.5, .035), s * .08, 2.52, .45, -s * 1.45));
  klX(kr);
  gl.add(klX(klPoz(anCzaszka([[-.36, .05], [-.3, .35], [0, .44], [.3, .35], [.36, .05], [.25, -.2], [.15, -.38], [-.15, -.38], [-.25, -.2]], null, .4), 0, 0, -.05)));
  for (const s of [-1, 1]) gl.add(klX(brPart(new THREE.Group(), new THREE.CylinderGeometry(.09, .09, .45, 12).rotateX(Math.PI / 2), brMat(0x16304f, 'glow'), s * .15, .05, -.03, { ol: 0 }).parent));
  // złamana ręka (prawa na ekranie)
  const rk = P.rece[1];
  P.kosc = klZlamana(rk.g, rk.k2, .3, .08, -.8, { y0: -1.0, L: .62, r: .17 });
  // organy
  klOrgan(P, g, 'pluca', 0, 2.1, 0, .78, [[-.32, .35], [.3, .35], [.8, 1.38]]);
  klOrgan(P, g, 'serce', .16, 1.95, .25, .5, [[-.32, .35], [.3, .35], [-.8, 1.38], [.8, 1.38]]);
  klOrgan(P, g, 'zoladek', .14, 1.68, .15, .55, [[.3, .35], [-.32, .35], [.8, 1.38]]);
  klOrgan(P, g, 'jelita', -.05, 1.5, .05, .52, []);
  klOrgan(P, g, 'mozg', 0, 3.14, .2, .68, [[-.32, .35], [.3, .35], [-.8, 1.38], [.8, 1.38]]);
  P.przelyk = [[.1, 1.8], [-.05, 2.15], [-.03, 2.5], [0, 2.78], [0, 2.92]];
  P.rzeczS = 1.0;
  return P;
}

function klPacjent(kind) {
  const P = ({ zyrafa: klZyrafa, slon: klSlon, opiekun: klOpiekun })[kind]();
  P.g.userData.pacjent = kind;
  return P;
}
// Chód: nogi (i ręce) wahają się na zmianę, ciało podskakuje; k = 0 stoi, 1 idzie
function klKrok(P, t, k) {
  for (const n of P.nogi) { const a = Math.sin(t * 7 + n.faza) * .45 * k; if (n.os === 'x') n.g.rotation.x = a; else n.g.rotation.z = a; }
  for (const r of P.rece) r.g.rotation.x = Math.sin(t * 7 + r.faza) * .5 * k;
}
// Oddech: delikatne bujanie głowy (i szyi żyrafy)
function klOddech(P, t) {
  if (P.glowa) P.glowa.rotation.z = (P.glowaRz || 0) + Math.sin(t * 1.3) * .04;
}
