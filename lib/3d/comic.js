// Styl „komiks”: kreskówkowe cieniowanie (toon) + czarny kontur odwróconą skorupą, bryły wyciągane z obrysu 2D.
// Wspólne dla Dzikich Bryk (pojazdy, trasy) i Kliniki Zoo (pacjenci, kości, organy).
// brMat(kolor, 'toon'|'glow'|'line') · brPart(rodzic, geo, kolor|materiał, x, y, z, {r, s, ol}) · brExt(obrys, głębokość, fazka, wygładzenie)
// brBox · brCyl(r0, r1, h, n, oś) · brLimb(rodzic, p0, p1, r0, r1, kolor) · brGwiazdaPts(R, r) · komiksDymek(rodzic, tekst, X, Y, klasa)
// wymaga: THREE
function brMat(color, kind = 'toon') {
  const C = brMat.c || (brMat.c = {}), key = kind + color;
  if (!C[key]) C[key] = kind === 'glow' ? new THREE.MeshBasicMaterial({ color })
    : kind === 'line' ? new THREE.MeshBasicMaterial({ color, side: THREE.BackSide })
    : new THREE.MeshToonMaterial({ color });
  return C[key];
}
// Kontur „odwróconą skorupą”: czarna (albo w kolorze col) kopia powiększona wokół środka geometrii
function brOutline(m, w = .03, col = 0x17110c) {
  const g = m.geometry; g.computeBoundingBox();
  const c = g.boundingBox.getCenter(new THREE.Vector3()), s = g.boundingBox.getSize(new THREE.Vector3());
  const o = new THREE.Mesh(g, brMat(col, 'line'));
  o.scale.set(1 + 2 * w / Math.max(s.x, .02), 1 + 2 * w / Math.max(s.y, .02), 1 + 2 * w / Math.max(s.z, .02));
  o.position.set(c.x * (1 - o.scale.x), c.y * (1 - o.scale.y), c.z * (1 - o.scale.z));
  m.add(o); return m;
}
// Część: geometria + kolor (liczba = toon, materiał = jak jest), pozycja, o: { r:[rx,ry,rz], s:[sx,sy,sz], ol: grubość konturu, 0 = bez, olc: kolor konturu }
function brPart(par, geo, color, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? brMat(color) : color);
  m.position.set(x, y, z);
  if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
  if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  if (o.ol !== 0) brOutline(m, o.ol ?? .03, o.olc);
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
// Kończyna: walec od p0 do p1 (tablice [x,y,z])
function brLimb(par, p0, p1, r0, r1, col) {
  const a = new THREE.Vector3(...p0), d = new THREE.Vector3(...p1).sub(a), L = d.length();
  const m = brPart(par, brCyl(r1, r0, L, 7), col, a.x + d.x / 2, a.y + d.y / 2, a.z + d.z / 2, { ol: .02 });
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
}
function brGwiazdaPts(R, r) {
  const p = [];
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push([Math.cos(a) * rr, Math.sin(a) * rr, 1]); }
  return p;
}
