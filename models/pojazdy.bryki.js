// Bryki — groźne pojazdy inspirowane zwierzętami, „zespawane” z blach, z nitami i spawami. Bez zwierząt w środku.
// Widok z boku (2.5D): przód = +x, góra = +y, szerokość wzdłuż z. Kreskówkowe cieniowanie + czarny kontur.
// buildBryka('rekin'|'ptak'|'osmiornica'|'krab'|'nietoperz'|'zaba', kolory?) → { g, body, kind, p: części, wheels, len }
// brykaPose(b, 'jazda'|'atak'|'moc'|'oberwal', k 0..1) · brykaTick(b, dt, prędkość) — koła, bujanie, macki, pióra
// wymaga z gry: THREE

const BRYKI_KOLORY = () => ({
  rekin: { a: 0x5d7f9e, b: 0xdfe3e6, c: 0x2f4a63 },
  ptak: { a: 0xe2a417, b: 0xfbe8b0, c: 0xf06a14 },
  osmiornica: { a: 0x8a3fb8, b: 0x3e2357, c: 0xf28cc8 },
  krab: { a: 0xdd4426, b: 0x5a1f14, c: 0xffb04a },
  nietoperz: { a: 0x4d4063, b: 0x1d1a24, c: 0xd8342a },
  zaba: { a: 0x3f9a34, b: 0xe6e08a, c: 0xff5a8a },
});

/* --- materiały i proste bryły --- */
function brMat(color, kind = 'toon') {
  const C = brMat.c || (brMat.c = {}), key = kind + color;
  if (!C[key]) C[key] = kind === 'glow' ? new THREE.MeshBasicMaterial({ color })
    : kind === 'line' ? new THREE.MeshBasicMaterial({ color, side: THREE.BackSide })
    : new THREE.MeshToonMaterial({ color });
  return C[key];
}
// Kontur „odwróconą skorupą”: czarna kopia powiększona wokół środka geometrii
function brOutline(m, w = .03) {
  const g = m.geometry; g.computeBoundingBox();
  const c = g.boundingBox.getCenter(new THREE.Vector3()), s = g.boundingBox.getSize(new THREE.Vector3());
  const o = new THREE.Mesh(g, brMat(0x17110c, 'line'));
  o.scale.set(1 + 2 * w / Math.max(s.x, .02), 1 + 2 * w / Math.max(s.y, .02), 1 + 2 * w / Math.max(s.z, .02));
  o.position.set(c.x * (1 - o.scale.x), c.y * (1 - o.scale.y), c.z * (1 - o.scale.z));
  m.add(o); return m;
}
// Część: geometria + kolor (liczba = toon, materiał = jak jest), pozycja, o: { r:[rx,ry,rz], s:[sx,sy,sz], ol: grubość konturu, 0 = bez }
function brPart(par, geo, color, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? brMat(color) : color);
  m.position.set(x, y, z);
  if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
  if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  if (o.ol !== 0) brOutline(m, o.ol ?? .03);
  par.add(m); return m;
}
// Ścinanie narożników (Chaikin); punkt [x, y, 1] zostaje ostry
function brChaikin(p) {
  const r = [];
  p.forEach((v, i) => {
    if (v[2]) { r.push(v); return; }
    const u = p[(i + p.length - 1) % p.length], w = p[(i + 1) % p.length];
    r.push([v[0] * .75 + u[0] * .25, v[1] * .75 + u[1] * .25], [v[0] * .75 + w[0] * .25, v[1] * .75 + w[1] * .25]);
  });
  return r;
}
// Blacha z obrysu (x, y) wyciągnięta wzdłuż z, wyśrodkowana na z = 0
function brExt(pts, depth, bev = .03, smooth = 0) {
  for (let i = 0; i < smooth; i++) pts = brChaikin(pts);
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const d = Math.max(.01, depth - 2 * bev);
  const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -d / 2); return g;
}
const brBox = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function brCyl(r0, r1, h, n = 10, axis = 'y') {
  const g = new THREE.CylinderGeometry(r0, r1, h, n);
  if (axis === 'z') g.rotateX(Math.PI / 2); else if (axis === 'x') g.rotateZ(-Math.PI / 2);
  return g;
}
// Nity: rząd od (x0,y0) do (x1,y1), po obu bokach ±z
function brRivets(par, x0, y0, x1, y1, n, z, col = 0x7b8289) {
  const geo = brRivets.g || (brRivets.g = new THREE.SphereGeometry(.045, 6, 4));
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : .5;
    for (const s of [-1, 1]) brPart(par, geo, col, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, s * z, { s: [1, 1, .55], ol: 0 });
  }
}
// Spaw: gruba nierówna kreska z kropel, po obu bokach
function brWeld(par, x0, y0, x1, y1, z, col = 0x4d4741) {
  const geo = brWeld.g || (brWeld.g = new THREE.SphereGeometry(.04, 5, 3));
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / .06));
  for (let i = 0; i <= n; i++) for (const s of [-1, 1])
    brPart(par, geo, col, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, s * z, { s: [1.3, 1 + (i % 2) * .3, .5], ol: 0 });
}
// Łata z blachy w innym kolorze, z nitami w rogach
function brPatch(par, x, y, w, h, z, col, rot = 0) {
  for (const s of [-1, 1]) {
    const m = brPart(par, brBox(w, h, .03), col, x, y, s * z, { r: [0, 0, rot], ol: .015 });
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) brPart(m, brRivets.g || new THREE.SphereGeometry(.045, 6, 4), 0xa9b1b8, a * (w / 2 - .06), b * (h / 2 - .06), s * .02, { s: [.8, .8, .5], ol: 0 });
  }
}
// Rura wydechowa: od (x,y,z) pod kątem a (od pionu, dodatni = do tyłu), długość L
function brPipe(par, x, y, z, a, L, r = .08) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.z = a; par.add(g);
  brPart(g, brCyl(r, r * 1.1, L), 0xb7bec6, 0, L / 2, 0, { ol: .02 });
  brPart(g, brCyl(r * 1.25, r * 1.25, .1), 0x2b2724, 0, L, 0, { ol: .02 });
  return g;
}
// Kończyna: walec od p0 do p1 (tablice [x,y,z])
function brLimb(par, p0, p1, r0, r1, col) {
  const a = new THREE.Vector3(...p0), d = new THREE.Vector3(...p1).sub(a), L = d.length();
  const m = brPart(par, brCyl(r1, r0, L, 7), col, a.x + d.x / 2, a.y + d.y / 2, a.z + d.z / 2, { ol: .02 });
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
}
// Koło: gruba opona z klockami, felga, śruby; s = strona (±1), kolce opcjonalnie
function brWheel(r, w, s, rim = 0x8d949b, spikes = false) {
  const g = new THREE.Group();
  brPart(g, brCyl(r, r, w, 18, 'z'), 0x2b2a2e, 0, 0, 0, { ol: .04 });
  const lug = brBox(.16, .13, w * 1.04);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; brPart(g, lug, 0x222126, Math.cos(a) * r, Math.sin(a) * r, 0, { r: [0, 0, a], ol: 0 }); }
  brPart(g, brCyl(r * .58, r * .58, w + .04, 12, 'z'), rim, 0, 0, 0, { ol: .02 });
  brPart(g, brCyl(r * .22, r * .22, w + .1, 8, 'z'), 0x3a3633, 0, 0, 0, { ol: .02 });
  const bolt = new THREE.SphereGeometry(.05, 5, 3);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; brPart(g, bolt, 0xd8dde2, Math.cos(a) * r * .38, Math.sin(a) * r * .38, s * (w / 2 + .03), { ol: 0 }); }
  if (spikes) brPart(g, new THREE.ConeGeometry(.12, .45, 6), 0xc9ced3, 0, 0, s * (w / 2 + .25), { r: [s * Math.PI / 2, 0, 0], ol: .02 });
  return g;
}
// Oko-reflektor na boku: świecąca tarcza, źrenica, groźna brew (w dół ku przodowi)
function brEye(par, x, y, z, r, s, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); par.add(g);
  brPart(g, brCyl(r * 1.15, r * 1.15, .06, 14, 'z'), 0x3b3633, 0, 0, 0, { ol: .02 });
  brPart(g, brCyl(r, r, .08, 14, 'z'), brMat(o.glow ?? 0xffe04a, 'glow'), 0, 0, s * .01, { ol: 0 });
  brPart(g, brCyl(r * .42, r * .42, .1, 10, 'z'), brMat(0x111111, 'glow'), r * .3, -r * .05, s * .02, { ol: 0, s: o.slit ? [1.6, .45, 1] : [1, 1, 1] });
  brPart(g, brBox(r * 3, r * .55, .1), o.brow ?? 0x2b2724, 0, r * 1.05, s * .03, { r: [0, 0, -.42], ol: .015 });
  return g;
}

/* --- konstrukcja --- */
function buildBryka(kind, kol) {
  const C = { ...BRYKI_KOLORY()[kind], ...(kol || {}) };
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = { g, body, kind, C, p: {}, wheels: [], t: 0, len: 4.6, pose: {} };
  ({ rekin: brRekin, ptak: brPtak, osmiornica: brOsmiornica, krab: brKrab, nietoperz: brNietoperz, zaba: brZaba })[kind](b);
  g.userData.bryka = kind;
  return b;
}
function brWheels(b, xs, z, r, w, rim, spikes) {
  for (const x of xs) for (const s of [-1, 1]) {
    const wh = brWheel(r, w, s, rim, spikes); wh.position.set(x, r, s * z); b.g.add(wh); b.wheels.push(wh); wh.userData.r = r;
  }
}

// REKIN: niski klin z płetwą, cały przód to paszcza na zawiasach — górna i dolna szczęka z zębami
function brRekin(b) {
  const B = b.body, C = b.C, W = 1.9, Z = W / 2;
  brPart(B, brExt([[-2.2, .55, 1], [-2.25, 1.2], [-1.6, 1.45], [-.4, 1.62], [.7, 1.56], [1.15, 1.38, 1], [1.15, .55, 1]], W, .05, 1), C.a);
  brPart(B, brExt([[-2.15, .5], [1.12, .5], [1.12, .86], [-2.1, .8]], W + .12, .03), C.b);
  brPart(B, brBox(.6, .62, W - .2), 0x5a0f12, 1.3, .9, 0, { ol: 0 });              // gardło, widać przy otwartej paszczy
  // szczęki na zawiasach
  const tooth = new THREE.ConeGeometry(.075, .24, 4);
  const up = new THREE.Group(); up.position.set(1.1, 1.3, 0); B.add(up); b.p.jawU = up;
  brPart(up, brExt([[-.1, .16], [.5, .09], [1.1, -.14], [1.38, -.32, 1], [1.15, -.4], [-.1, -.38]], W, .05, 1), C.a);
  brPart(up, brBox(1.3, .07, W - .04), 0xc8303c, .55, -.4, 0, { ol: 0 });
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) brPart(up, tooth, 0xf3f0e4, .02 + i * .17, -.5, s * (Z + .01), { r: [0, 0, Math.PI], ol: .012 });
  brEye(up, .42, -.1, Z + .03, .12, 1); brEye(up, .42, -.1, -Z - .03, .12, -1);
  brRivets(up, -.05, .08, .9, -.08, 5, Z + .01);
  const lo = new THREE.Group(); lo.position.set(1.1, .75, 0); B.add(lo); b.p.jawL = lo;
  brPart(lo, brExt([[-.1, .15], [1.05, .13], [.95, -.09, 1], [.5, -.2], [-.1, -.23]], W, .05, 1), C.b);
  brPart(lo, brBox(1.1, .06, W - .04), 0xc8303c, .45, .16, 0, { ol: 0 });
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) brPart(lo, tooth, 0xf3f0e4, .1 + i * .17, .24, s * (Z + .01), { ol: .012 });
  // płetwy
  const fin = brPart(B, brExt([[-.7, 1.5], [.35, 1.5], [-.15, 2.0], [-.55, 2.5, 1], [-.6, 1.95]], .16, .03, 1), C.c);
  b.p.fin = fin;
  brRivets(B, -.6, 1.62, .2, 1.62, 5, .09);
  brPart(B, brExt([[-2.0, 1.15], [-1.75, 1.3], [-2.45, 2.2, 1], [-2.62, 2.08], [-2.3, 1.5], [-2.8, .95, 1], [-2.58, .86], [-2.1, 1.0]], .16, .03), C.c);
  for (const s of [-1, 1]) brPart(B, brExt([[.25, .98], [-.15, .98], [-.7, .5, 1]], .1, .02), C.c, 0, 0, s * (Z + .06));
  // skrzela, łata, spawy, rury
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) brPart(B, brBox(.07, .42, .04), 0x1c2733, .35 + i * .2, 1.12, s * (Z + .02), { r: [0, 0, .18], ol: 0 });
  brPatch(B, -1.25, 1.05, .6, .38, Z + .02, 0xa4532c, .08);
  brWeld(B, -.35, .86, -.4, 1.58, Z + .01); brWeld(B, -2.1, .83, 1.1, .88, Z + .07);
  brRivets(B, -2.0, 1.25, -.5, 1.5, 6, Z + .01);
  brPipe(B, -1.55, 1.38, .5, .7, .75); brPipe(B, -1.55, 1.38, -.5, .7, .75);
  brWheels(b, [.75, -1.5], Z + .12, .56, .5, 0x8d949b);
  b.len = 5.4;
}

// PTAK: obły kadłub, dziób na tłoku (dziobnięcie), czub, skrzydła z blaszanych piór (lot), szpony nad kołem
function brPtak(b) {
  const B = b.body, C = b.C, W = 1.8, Z = W / 2;
  brPart(B, brExt([[-2.0, .55, 1], [-2.15, 1.15], [-1.7, 1.65], [-.7, 1.95], [.4, 1.95], [1.15, 1.7], [1.5, 1.25], [1.45, .55, 1]], W, .05, 2), C.a);
  brPart(B, brExt([[-1.95, .5], [1.4, .5], [1.42, .86], [-1.95, .8]], W + .12, .03), C.b);
  brPart(B, brExt([[-2.12, 1.08], [1.52, 1.08], [1.5, 1.27], [-2.1, 1.25]], W + .1, .03), 0x6f767d);   // stalowy pas
  brRivets(B, -1.9, 1.17, 1.3, 1.17, 9, Z + .06, 0xb7bec6);
  // dziób na tłoku
  const bk = new THREE.Group(); bk.position.set(1.4, 1.2, 0); B.add(bk); b.p.beak = bk;
  brPart(bk, brCyl(.1, .1, 1.0, 8, 'x'), 0xb7bec6, -.45, 0, 0, { ol: .02 });
  const bu = new THREE.Group(); bk.add(bu); b.p.beakU = bu;
  brPart(bu, brExt([[0, .34], [.6, .24], [1.25, .03], [1.6, -.2, 1], [1.42, -.22], [1.1, -.06], [0, -.02]], 1.0, .04, 1), C.c);
  brPart(bu, brBox(.18, .06, 1.04), 0x2b2724, .45, .2, 0, { ol: 0 });
  const bl = new THREE.Group(); bk.add(bl); b.p.beakL = bl;
  brPart(bl, brExt([[0, -.02], [1.1, -.06], [.95, -.22, 1], [0, -.32]], .9, .04, 1), 0xc4500e);
  brRivets(bu, .1, .1, .7, .02, 3, .52);
  brEye(B, .82, 1.45, Z + .02, .24, 1, { glow: 0xfffbe8 }); brEye(B, .82, 1.45, -Z - .02, .24, -1, { glow: 0xfffbe8 });
  // czub
  const crest = brExt([[0, 0], [.13, .06], [-.05, .8, 1], [-.13, .06]], .1, .02, 1);
  for (let i = 0; i < 4; i++) brPart(B, crest, i % 2 ? 0xb52a22 : 0xe23b2b, .55 - i * .26, 1.85, 0, { r: [0, 0, .25 + i * .2] });
  // skrzydła: grupa na barku, pióra opadają do tyłu; moc = skrzydła w górę
  b.p.wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(.35, 1.55, s * (Z + .07)); B.add(w); b.p.wings.push(w); w.userData.s = s;
    for (let i = 0; i < 4; i++) {
      const L = 1.9 - i * .32;
      brPart(w, brExt([[0, .12], [-L, .06], [-L - .2, -.04, 1], [-L, -.12], [0, -.12]], .07, .02, 1), i % 2 ? 0xb5651d : C.c, 0, -.08 - i * .15, s * i * .015, { r: [0, 0, .1 + i * .06] });
    }
    brRivets(w, -.1, -.08, -.1, -.5, 3, .05);
  }
  // ogon, szpony, komin
  const tail = brExt([[0, 0], [.16, .06], [0, 1.05, 1], [-.16, .06]], .08, .02, 1);
  for (let i = 0; i < 3; i++) brPart(B, tail, i % 2 ? C.c : 0xb5651d, -1.95, 1.3, (i - 1) * .3, { r: [0, 0, 1.05 + i * .22] });
  const claw = new THREE.ConeGeometry(.07, .42, 5);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) brPart(B, claw, 0x3a3a3a, 1.05 + i * .14, 1.0 - i * .06, s * (Z + .2), { r: [0, 0, -2.0 - i * .25], ol: .015 });
  const ch = brPipe(B, -1.15, 1.8, 0, .25, .7, .1); brPart(ch, brCyl(.02, .2, .12, 8), 0x3a3633, 0, .82, 0, { ol: .02 });
  brPatch(B, -1.35, 1.05, .55, .35, Z + .02, 0x7a8a3a, -.06);
  brWeld(B, -.45, .86, -.55, 1.9, Z + .01);
  brWheels(b, [.85, -1.35], Z + .12, .56, .5, 0x9aa1a8);
  b.len = 5.2;
}

// OŚMIORNICA: wielka nitowana kopuła z bulajami-oczami (prostokątne źrenice), macki z przyssawkami, armatka z tuszem z tyłu
function brOsmiornica(b) {
  const B = b.body, C = b.C, W = 2.0, Z = W / 2;
  brPart(B, brExt([[-2.0, .5, 1], [-2.1, 1.0, 1], [1.6, 1.0, 1], [1.9, .75], [1.7, .5, 1]], W, .04), C.b);
  const D = { x: -.4, y: 1.55, a: 1.55, b: 1.05, c: .95 };
  brPart(B, new THREE.SphereGeometry(1, 20, 14), C.a, D.x, D.y, 0, { s: [D.a, D.b, D.c], ol: .03 });
  // punkt i normalna na kopule (kąt poziomy az, pionowy el)
  const onDome = (az, el, out = 0) => {
    const n = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    const p = new THREE.Vector3(D.x + n.x * D.a, D.y + n.y * D.b, n.z * D.c);
    const nn = new THREE.Vector3(n.x / D.a, n.y / D.b, n.z / D.c).normalize();
    return { p: p.addScaledVector(nn, out), n: nn };
  };
  const f = Math.sqrt(1 - (.25 / D.b) ** 2);
  brPart(B, new THREE.TorusGeometry(1, .045, 6, 28), 0x5e2c7a, D.x, D.y + .25, 0, { r: [Math.PI / 2, 0, 0], s: [D.a * f, D.c * f, 1], ol: 0 });
  const rv = new THREE.SphereGeometry(.05, 6, 4);
  for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; brPart(B, rv, 0x5e2c7a, D.x + Math.cos(t) * D.a * f * 1.02, D.y + .25, Math.sin(t) * D.c * f * 1.02, { ol: 0 }); }
  const spot = new THREE.SphereGeometry(.17, 8, 6);
  for (const [az, el] of [[2.2, .6], [3.0, .9], [-2.4, .5], [1.7, 1.1], [-1.6, .9], [3.6, .35]]) { const { p } = onDome(az, el, -.06); brPart(B, spot, 0x6e2f93, p.x, p.y, p.z, { ol: 0 }); }
  // bulaje
  for (const s of [-1, 1]) {
    const { p, n } = onDome(s * .85, .22, .02), e = new THREE.Group(); e.position.copy(p);
    e.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); B.add(e);
    brPart(e, new THREE.TorusGeometry(.27, .07, 8, 18), 0xc9a24a, 0, 0, 0, { ol: .02 });
    brPart(e, new THREE.CircleGeometry(.26, 18), brMat(0xfff4c8, 'glow'), 0, 0, .01, { ol: 0 });
    brPart(e, brBox(.3, .09, .02), brMat(0x111111, 'glow'), .04, 0, .03, { ol: 0 });
    brPart(e, brBox(.62, .13, .1), 0x2b2724, 0, .36, .04, { r: [0, 0, s * .35], ol: .015 });
  }
  // macki: łańcuch segmentów, każdy dziecko poprzedniego
  b.p.tent = [];
  const tent = (x, y, z, ry, n, r0, ph) => {
    const root = new THREE.Group(); root.position.set(x, y, z); root.rotation.y = ry; B.add(root);
    const segs = []; let par = root, r = r0, L = 0;
    const line = brMat(0x17110c, 'line');
    for (let i = 0; i < n; i++) {
      const sg = new THREE.Group(); par.add(sg); sg.position.x = L; L = r * 1.15;
      const r1 = i === n - 1 ? r * .35 : r * .87;
      brPart(sg, brCyl(r1, r, L, 9, 'x'), C.a, L / 2, 0, 0, { ol: 0 });
      brPart(sg, new THREE.SphereGeometry(r, 9, 7), C.a, 0, 0, 0, { ol: 0 });
      brPart(sg, brCyl(r1 + .03, r + .03, L, 9, 'x'), line, L / 2, 0, 0, { ol: 0 });     // kontur bez szwów między segmentami
      brPart(sg, new THREE.SphereGeometry(r + .03, 9, 7), line, 0, 0, 0, { ol: 0 });
      brPart(sg, brCyl(r * .42, r * .42, .05, 8), C.c, L / 2, -r * .92, 0, { ol: 0 });
      segs.push(sg); par = sg; r *= .87;
    }
    const t = { root, segs, ph, ry, s: Math.sign(z) || 1 }; b.p.tent.push(t); return t;
  };
  for (const s of [-1, 1]) {
    tent(.2, .95, s * Z, -s * 2.75, 8, .27, s);                // boczne: wzdłuż boku do tyłu
    tent(-1.95, .8, s * .55, Math.PI - s * .3, 8, .25, 2 + s); // tylne: ciągną się za autem
    tent(1.6, .95, s * .55, -s * .3, 5, .15, 4 + s);           // przednie wąsy
  }
  b.p.grab = b.p.tent[3];                                       // macka do łapania (strona +z)
  // armatka z tuszem
  const gun = new THREE.Group(); gun.position.set(-2.1, 1.2, 0); B.add(gun); b.p.gun = gun;
  brPart(gun, brCyl(.3, .24, .7, 12, 'x'), 0x2e2e36, -.2, 0, 0, { ol: .03 });
  brPart(gun, new THREE.TorusGeometry(.3, .07, 6, 14), 0xc9a24a, -.55, 0, 0, { r: [0, Math.PI / 2, 0], ol: .02 });
  brPart(gun, new THREE.SphereGeometry(.12, 6, 5), brMat(0x0b0b10), -.5, -.22, 0, { ol: 0, s: [1, 1.5, 1] });
  const ink = new THREE.Group(); ink.position.set(-2.8, 1.2, 0); B.add(ink); ink.visible = false; b.p.ink = ink;
  for (const [x, y, z, r] of [[0, 0, 0, .45], [-.55, .2, .3, .55], [-.5, -.15, -.35, .5], [-1.1, .1, 0, .65], [-.9, .45, -.2, .4]])
    brPart(ink, new THREE.SphereGeometry(r, 10, 8), brMat(0x101018), x, y, z, { ol: .03 });
  brPatch(B, .7, .76, .5, .3, Z + .02, 0x6b7c8a, .05);
  brRivets(B, -1.9, .9, 1.5, .9, 10, Z + .01);
  brPipe(B, -1.3, 1.6, .55, .5, .8); brPipe(B, -1.3, 1.6, -.55, .5, .8);
  brWheels(b, [1.05, -1.3], Z + .12, .55, .5, 0xc9a24a);
  b.len = 5.0;
}

// KRAB: szeroki pancerz z kolcami, oczy na peryskopach, dwie wielkie szczypce na siłownikach, 6 kół
function brKrab(b) {
  const B = b.body, C = b.C, W = 2.4, Z = W / 2;
  brPart(B, brExt([[-1.8, .45, 1], [1.5, .45], [1.75, .75], [1.5, 1.0], [-1.8, 1.0, 1]], W - .2, .04), C.b);
  const S = { x: -.1, y: .95, a: 1.95, b: .78, c: 1.35 };
  brPart(B, new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), C.a, S.x, S.y, 0, { s: [S.a, S.b, S.c], ol: .035 });
  brPart(B, new THREE.TorusGeometry(1, .07, 6, 30), 0x9a2d16, S.x, S.y, 0, { r: [Math.PI / 2, 0, 0], s: [S.a, S.c, 1], ol: 0 });
  b.p.spikes = [];
  const spike = new THREE.ConeGeometry(.12, .42, 6);
  for (let i = 0; i < 18; i++) {
    const t = i / 18 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(t), Math.cos(t))) < .55) continue;
    const d = new THREE.Vector3(Math.cos(t) / S.a, 0, Math.sin(t) / S.c).normalize();
    const m = brPart(B, spike, 0xf1e6cf, S.x + Math.cos(t) * S.a, S.y, Math.sin(t) * S.c, { ol: .015 });
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); b.p.spikes.push(m);
  }
  // nity w rzędach na pancerzu, właz
  const rv = new THREE.SphereGeometry(.05, 6, 4);
  for (const el of [.5]) for (let i = 0; i < 16; i++) {
    const t = i / 16 * Math.PI * 2, c = Math.cos(el);
    brPart(B, rv, 0xa8321a, S.x + Math.cos(t) * c * S.a * 1.01, S.y + Math.sin(el) * S.b * 1.01, Math.sin(t) * c * S.c * 1.01, { ol: 0 });
  }
  brPart(B, brCyl(.32, .36, .12, 12), 0x8a2a14, -.5, S.y + S.b - .02, 0, { ol: .02 });
  brPart(B, brBox(.4, .06, .08), 0xb7bec6, -.5, S.y + S.b + .08, 0, { ol: .015 });
  // żuwaczki z przodu
  for (let i = 0; i < 5; i++) brPart(B, new THREE.ConeGeometry(.07, .22, 4), 0xf1e6cf, 1.72, .62, (i - 2) * .3, { r: [0, 0, -Math.PI / 2], ol: .012 });
  // oczy na peryskopach
  b.p.stalks = [];
  for (const s of [-1, 1]) {
    const st = new THREE.Group(); st.position.set(1.0 + s * .14, 1.3, s * .42); B.add(st); b.p.stalks.push(st);
    brPart(st, brCyl(.06, .08, .75), 0x8d949b, 0, .37, 0, { ol: .02 });
    brPart(st, new THREE.SphereGeometry(.2, 12, 8), brMat(0xfff4c8, 'glow'), 0, .8, 0, { ol: .03 });
    brPart(st, new THREE.SphereGeometry(.09, 8, 6), brMat(0x111111, 'glow'), .14, .8, 0, { ol: 0 });
    brPart(st, brBox(.36, .08, .14), 0x2b2724, .05, 1.0, 0, { r: [0, 0, -.4], ol: .015 });
  }
  // szczypce: ramię na zawiasie (obrót y = na boki), szczypce otwierane w pionie (widać z boku)
  b.p.arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(1.15, .95, s * 1.0); B.add(arm); arm.userData.s = s; b.p.arms.push(arm);
    brPart(arm, new THREE.SphereGeometry(.2, 10, 8), 0x3a3633, 0, 0, 0, { ol: .02 });
    brPart(arm, brCyl(.12, .12, .8, 8, 'x'), C.a, .4, 0, 0, { ol: .025 });
    brPart(arm, brCyl(.06, .06, .7, 6, 'x'), 0xb7bec6, .4, .14, 0, { ol: .015 });
    const cl = new THREE.Group(); cl.position.set(.8, .05, 0); cl.rotation.z = .15; arm.add(cl); arm.userData.claw = cl;
    brPart(cl, brExt([[0, -.28], [.35, -.36], [.95, -.25], [1.18, -.05, 1], [.82, -.1], [.42, .04], [0, .28]], .45, .05, 1), C.a);
    brPart(cl, brExt([[.95, -.25], [1.18, -.05, 1], [.82, -.1]], .47, .02), 0x2b2724, 0, 0, 0, { ol: 0 });
    const fg = new THREE.Group(); fg.position.set(.38, .12, 0); cl.add(fg); arm.userData.finger = fg;
    brPart(fg, brExt([[0, .02], [.42, .14], [.86, .04], [1.02, -.1, 1], [.6, -.03], [0, -.13]], .36, .04, 1), C.a);
    brPart(fg, brExt([[.86, .04], [1.02, -.1, 1], [.6, -.03]], .38, .02), 0x2b2724, 0, 0, 0, { ol: 0 });
    for (let i = 0; i < 3; i++) {
      brPart(fg, new THREE.ConeGeometry(.045, .12, 4), 0xf1e6cf, .25 + i * .18, -.1, 0, { r: [0, 0, Math.PI], ol: 0 });
      brPart(cl, new THREE.ConeGeometry(.045, .12, 4), 0xf1e6cf, .55 + i * .16, -.06, 0, { ol: 0 });
    }
    brRivets(cl, .15, -.15, .15, .12, 2, .24);
    // nogi kraba między kołami
    for (const x of [-.75, .42]) {
      brLimb(B, [x, 1.0, s * 1.15], [x + .1, 1.45, s * 1.6], .1, .08, C.a);
      brLimb(B, [x + .1, 1.45, s * 1.6], [x + .3, .55, s * 1.75], .08, .02, C.a);
    }
  }
  brPipe(B, -1.6, 1.0, .6, .9, .6); brPipe(B, -1.6, 1.0, -.6, .9, .6);
  brWheels(b, [1.0, -.15, -1.3], Z - .05, .45, .42, 0x8d949b, true);
  b.len = 4.6;
}

// NIETOPERZ: niski czarny klin z uszami, czerwone oczy-szparki, kły i paszcza (pisk), skrzydła z błony na żebrach, dysze odrzutowe
function brNietoperz(b) {
  const B = b.body, C = b.C, W = 1.9, Z = W / 2;
  brPart(B, brExt([[-2.25, .55, 1], [-2.35, 1.1], [-1.5, 1.35], [-.4, 1.72], [.55, 1.68], [1.3, 1.28], [2.15, 1.0, 1], [2.25, .62, 1]], W, .05, 1), C.a);
  brPart(B, brExt([[-2.2, .5], [2.2, .5], [2.2, .8], [-2.2, .78]], W + .12, .03), C.b);
  for (const sd of [-1, 1]) brPart(B, brBox(3.2, .08, .03), C.c, -.2, 1.05, sd * (Z + .02), { r: [0, 0, .05], ol: 0 });
  b.p.ears = [];
  for (const sd of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(.25, 1.6, sd * .5); B.add(e); b.p.ears.push(e);
    brPart(e, brExt([[-.32, 0], [.26, 0], [-.18, 1.05, 1]], .14, .03), C.a);
    brPart(e, brExt([[-.18, .12], [.12, .12], [-.14, .72, 1]], .17, 0), 0xb0303a, 0, 0, 0, { ol: 0 });
  }
  brEye(B, 1.25, 1.18, Z + .02, .19, 1, { glow: 0xff2a2a, slit: true }); brEye(B, 1.25, 1.18, -Z - .02, .19, -1, { glow: 0xff2a2a, slit: true });
  const fang = new THREE.ConeGeometry(.07, .3, 5);
  for (const z of [-Z + .12, Z - .12]) for (const x of [2.0, 2.18]) brPart(B, fang, 0xf3f0e4, x, .5, z, { r: [0, 0, Math.PI], ol: .012, s: x > 2.1 ? [1, 1.3, 1] : [.8, .8, .8] });
  const jaw = new THREE.Group(); jaw.position.set(1.75, .5, 0); B.add(jaw); b.p.jaw = jaw;
  brPart(jaw, brExt([[-.3, .04], [.85, .02], [.8, -.13, 1], [-.3, -.18]], W - .2, .03), C.b);
  for (const z of [-Z + .2, Z - .2]) for (const x of [.35, .6]) brPart(jaw, new THREE.ConeGeometry(.05, .2, 5), 0xf3f0e4, x, .12, z, { ol: .01 });
  brPart(B, brBox(.6, .25, W - .3), 0x5a0f12, 1.9, .48, 0, { ol: 0 });            // gardło, widać przy otwartej paszczy
  // skrzydła: żebra i błona z wcięciami; moc = rozpostarte w górę
  b.p.wings = [];
  const tips = [[-1.7, .22], [-1.95, -.25], [-1.65, -.62], [-1.05, -.82]];
  const memb = brExt([[0, .1], tips[0], [-1.5, -.04], tips[1], [-1.5, -.36], tips[2], [-1.15, -.52], tips[3], [-.3, -.35]], .05, .01);
  for (const sd of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(.15, 1.42, sd * (Z + .1)); B.add(w); b.p.wings.push(w); w.userData.s = sd;
    brPart(w, memb, 0x2a2233, 0, 0, 0, { ol: .025 });
    for (const [x, y] of tips) brLimb(w, [0, 0, sd * .04], [x, y, sd * .04], .045, .025, C.a);
    brPart(w, new THREE.ConeGeometry(.05, .2, 5), 0xf3f0e4, tips[0][0] - .05, tips[0][1] + .1, sd * .04, { r: [0, 0, .6], ol: .01 });
  }
  // spojler w kształcie skrzydła, dysze
  brPart(B, brExt([[-1.4, 1.33], [-1.9, 1.72], [-2.15, 1.92, 1], [-2.22, 1.7], [-2.45, 1.86, 1], [-2.5, 1.6], [-2.75, 1.7, 1], [-2.55, 1.22]], .16, .03), C.b, 0, 0, .55);
  brPart(B, brExt([[-1.4, 1.33], [-1.9, 1.72], [-2.15, 1.92, 1], [-2.22, 1.7], [-2.45, 1.86, 1], [-2.5, 1.6], [-2.75, 1.7, 1], [-2.55, 1.22]], .16, .03), C.b, 0, 0, -.55);
  brPart(B, brBox(.9, .1, 1.3), C.b, -2.2, 1.6, 0, { r: [0, 0, .3] });
  for (const z of [-.45, .45]) {
    brPart(B, brCyl(.24, .2, .55, 12, 'x'), 0x5a5560, -2.3, .95, z, { ol: .025 });
    brPart(B, new THREE.CircleGeometry(.17, 12), brMat(0xff7a1a, 'glow'), -2.58, .95, z, { r: [0, -Math.PI / 2, 0], ol: 0 });
  }
  brPatch(B, -.9, .95, .5, .3, Z + .02, 0x6b4a7a, -.05);
  brWeld(B, .1, .82, .05, 1.65, Z + .01);
  brRivets(B, -2.0, .65, 1.9, .65, 11, Z + .07, 0x8a8494);
  brWheels(b, [1.2, -1.45], Z + .12, .55, .5, 0xb0303a);
  b.len = 5.2;
}

// ŻABA: podniesione nadwozie na odsłoniętych sprężynach, wyłupiaste oczy-reflektory, długi język (atak), szczudła ze sprężyn (moc)
function brZaba(b) {
  const B = b.body, C = b.C, W = 2.1, Z = W / 2, TOP = 1.15;           // TOP: wysokość mocowania sprężyn pod nadwoziem
  brPart(B, brExt([[-2.0, 1.0, 1], [-2.15, 1.45], [-1.6, 1.85], [-.4, 2.0], [.8, 1.95], [1.55, 1.7], [2.0, 1.35], [1.95, 1.0, 1]], W, .05, 1), C.a);
  brPart(B, brExt([[-1.95, .92], [1.9, .92], [1.98, 1.24], [-1.98, 1.2]], W + .1, .03), C.b);
  brPart(B, brBox(.95, .08, W + .08), 0x1f3a1a, 1.5, 1.32, 0, { r: [0, 0, -.12], ol: 0 });     // szeroki pysk
  for (const [x, y] of [[-1.2, 1.55], [-.5, 1.75], [.3, 1.6], [-1.6, 1.3], [.9, 1.45]]) for (const sd of [-1, 1]) brPart(B, new THREE.SphereGeometry(.16, 8, 6), 0x2e6b26, x, y, sd * (Z - .02), { s: [1, 1, .35], ol: 0 });
  // wyłupiaste oczy na dachu
  for (const sd of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(.95, 2.0, sd * .62); B.add(e);
    brPart(e, new THREE.SphereGeometry(.42, 14, 10), C.a, 0, 0, 0, { ol: .03 });
    brPart(e, new THREE.SphereGeometry(.33, 14, 10), brMat(0xfff2a0, 'glow'), .14, .05, sd * .12, { ol: 0 });
    brPart(e, brBox(.08, .1, .3), brMat(0x111111, 'glow'), .45, .06, sd * .2, { r: [0, sd * .5, 0], ol: 0 });
    brPart(e, brBox(.6, .12, .14), 0x1f3a1a, .1, .4, sd * .15, { r: [0, 0, -.4], ol: .015 });
  }
  // język: walec skalowany wzdłuż x, lepka kulka na końcu; obrót w y = na skos na sąsiedni pas
  const tg = new THREE.Group(); tg.position.set(1.95, 1.3, 0); B.add(tg); b.p.tongueG = tg;
  const tgeo = brCyl(.11, .13, 1, 8, 'x'); tgeo.translate(.5, 0, 0);
  b.p.tongue = brPart(tg, tgeo, C.c, 0, 0, 0, { ol: 0 }); b.p.tongue.visible = false;
  b.p.tongueTip = brPart(tg, new THREE.SphereGeometry(.24, 10, 8), 0xff3a6a, 0, 0, 0, { ol: .025 }); b.p.tongueTip.visible = false;
  // uda tylnych nóg, wydech, nity
  brPipe(B, -1.6, 1.8, .55, .6, .7); brPipe(B, -1.6, 1.8, -.55, .6, .7);
  brPatch(B, -.6, 1.15, .5, .28, Z + .07, 0xb5651d, .05);
  brWeld(B, .35, 1.25, .3, 1.95, Z + .01);
  brRivets(B, -1.9, 1.07, 1.8, 1.07, 11, Z + .07, 0x8a8f6a);
  brWheels(b, [-1.4], Z + .15, .62, .55, 0xffd23f); brWheels(b, [1.25], Z + .12, .5, .45, 0xffd23f);
  // sprężyny przy każdym kole: od piasty do mocowania pod nadwoziem; moc rozciąga je jak szczudła
  b.p.springs = [];
  const coil = new THREE.TorusGeometry(.15, .045, 6, 12);
  for (const w of b.wheels) {
    const r = w.userData.r, hc = TOP - r, sd = Math.sign(w.position.z);
    const sp = new THREE.Group(); sp.position.set(w.position.x, r, sd * (Z + .52)); b.g.add(sp); sp.userData.hc = hc; b.p.springs.push(sp);
    sp.userData.coils = []; for (let i = 0; i < 11; i++) sp.userData.coils.push(brPart(sp, coil, 0xc9ced3, 0, (i + .5) * hc / 11, 0, { r: [Math.PI / 2, 0, .2], ol: .012 }));
    const rg = brCyl(.05, .05, 1, 6); rg.translate(0, .5, 0); sp.userData.rod = brPart(sp, rg, 0x5a5560, 0, 0, 0, { ol: 0, s: [1, hc, 1] });
    brPart(B, brBox(.36, .12, .5), 0x5a5560, w.position.x, TOP, sd * (Z + .3), { ol: .015 });
  }
  b.len = 4.9;
}

/* --- pozy i animacja --- */
// k = 0..1; każda poza liczona od zera (neutralnej)
function brykaPose(b, pose, k = 1) {
  const P = b.p, B = b.body;
  b.pose = { pose, k };
  B.rotation.set(0, 0, 0); B.position.set(0, 0, 0);
  b.wheels.forEach(w => w.visible = true);
  if (b.kind === 'rekin') {
    const a = pose === 'atak' ? k : 0;
    P.jawU.rotation.z = .65 * a; P.jawL.rotation.z = -.38 * a;
    P.fin.scale.setScalar(1 + (pose === 'moc' ? .7 * k : 0));                    // pod asfaltem widać dużą płetwę
    if (pose === 'moc') { B.position.y = -1.5 * k; b.wheels.forEach(w => w.visible = k < .5); }
  }
  if (b.kind === 'ptak') {
    const a = pose === 'atak' ? k : 0, m = pose === 'moc' ? k : 0;
    P.beak.position.x = 1.4 + .8 * a; P.beakU.rotation.z = .3 * a; P.beakL.rotation.z = -.25 * a;
    P.wings.forEach(w => { w.rotation.x = -w.userData.s * .45 * m; w.rotation.z = -1.5 * m; });
    B.position.y = .9 * m; b.wheels.forEach(w => w.position.y = w.userData.r + .9 * m);
  }
  if (b.kind === 'osmiornica') {
    P.ink.visible = pose === 'atak' && k > .05; P.ink.scale.setScalar(Math.max(.01, k));
    P.gun.scale.x = 1 + (pose === 'atak' ? .25 * Math.sin(k * Math.PI) : 0);
    b.grabK = pose === 'moc' ? k : 0;
  }
  if (b.kind === 'krab') {
    const a = pose === 'atak' ? k : 0, m = pose === 'moc' ? k : 0;
    P.arms.forEach(arm => {
      arm.rotation.y = -arm.userData.s * (.25 + 1.15 * a);
      arm.userData.claw.rotation.z = .15 + .25 * a;
      arm.userData.finger.rotation.z = .65 * Math.sin(Math.min(1, a * 1.3) * Math.PI) + .08;
    });
    P.spikes.forEach(s => s.scale.setScalar(1 + .9 * m));
  }
  if (b.kind === 'nietoperz') {
    const a = pose === 'atak' ? k : 0, m = pose === 'moc' ? k : 0;
    P.jaw.rotation.z = -.5 * a; P.ears.forEach(e => e.rotation.z = .6 * a);
    P.wings.forEach(w => { w.rotation.x = -w.userData.s * .5 * m; w.rotation.z = -1.4 * m; });
  }
  if (b.kind === 'zaba') {
    const a = pose === 'atak' ? k : 0, lift = pose === 'moc' ? 2.3 * k : 0;
    B.position.y = lift;
    P.springs.forEach(sp => { const h = sp.userData.hc + lift, n = sp.userData.coils.length; sp.userData.coils.forEach((c, i) => c.position.y = (i + .5) * h / n); sp.userData.rod.scale.y = h; });
    const L = (b.tongueLen || 6.5) * a;
    P.tongue.scale.x = Math.max(.01, L); P.tongueTip.position.x = L; P.tongue.visible = P.tongueTip.visible = a > .03;
    P.tongueG.rotation.y = a > 0 ? (b.tongueYaw || 0) : 0;
  }
  if (pose === 'oberwal') { B.rotation.z = .22 * k; B.rotation.x = .12 * k; B.position.y = .25 * k; }
  b.baseY = B.position.y;
  brykaTick(b, 0, 0);
}
// dt [s], v prędkość [m/s]
function brykaTick(b, dt, v) {
  b.t += dt; const t = b.t, P = b.p;
  b.wheels.forEach(w => w.rotation.z -= v * dt / w.userData.r);
  b.body.position.y = (b.baseY || 0) + Math.sin(t * 17) * .025 * Math.min(1, v / 8);   // bujanie na resorach
  if (b.kind === 'osmiornica') P.tent.forEach((tn, j) => {
    const grab = tn === P.grab ? (b.grabK || 0) : 0;
    tn.root.rotation.y = tn.ry + (-tn.s * Math.PI / 2 - tn.ry) * grab;
    tn.root.scale.setScalar(1 + .9 * grab);
    tn.segs.forEach((sg, i) => {
      const wave = Math.sin(t * 5 + tn.ph + i * .8) * .18;
      const curl = j % 3 === 2 ? .35 : j % 3 === 0 ? (i < 3 ? -.12 : .3) : (i < 2 ? -.3 : .28);   // wąsy w górę, reszta faluje i podwija się
      sg.rotation.z = (curl + wave) * (1 - grab);
      sg.rotation.y = Math.sin(t * 3 + tn.ph + i) * .12 * (1 - grab);
    });
  });
  if (b.kind === 'nietoperz') P.wings.forEach(w => { w.rotation.z = b.pose.pose === 'moc' ? -(1.4 + Math.sin(t * 16) * .45) * b.pose.k : Math.sin(t * 3 + w.userData.s) * .05; });
  if (b.kind === 'krab') P.stalks.forEach((s, i) => { s.rotation.z = Math.sin(t * 4 + i * 2) * .12; s.rotation.x = Math.sin(t * 3 + i) * .1; });
  if (b.kind === 'ptak' && b.pose.pose === 'moc') P.wings.forEach(w => { w.rotation.z = -(1.5 + Math.sin(t * 14) * .4) * b.pose.k; });
  if (b.kind === 'rekin') P.fin.rotation.x = b.pose.pose === 'moc' ? Math.sin(t * 9) * .08 : 0;
}
