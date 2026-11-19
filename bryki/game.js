'use strict';
// Dzikie Bryki — MOCKUP: 4 pasy, widok z boku (2.5D), 4 bryki jadą, zmieniają pasy, atakują (💥) i używają mocy (⭐).
// Modele i pozy: models/pojazdy.bryki.js. Tu: scena, przewijana droga, proste zasady trafień i mrugania.
const T = THREE, $ = id => document.getElementById(id);
// kamera do porównań z adresu: ?kat=8 (skos [°], + widać przody aut) &wys=40 (nachylenie [°], więcej = bardziej z góry) &pas=3.5 (szerokość pasa [m])
const Q = new URLSearchParams(location.search), KAT = +(Q.get('kat') ?? 0), WYS = +(Q.get('wys') ?? 30), PAS = +(Q.get('pas') ?? 3), ZOOM = +(Q.get('zoom') ?? 1);   // &zoom=.8 bliżej, &ui=0 bez paska przycisków
const LANES = [-1.5, -.5, .5, 1.5].map(k => k * PAS), ROAD = 4 * PAS + .6, V = 20, XMAX = 9.5;
const KINDS = [['rekin', '🦈'], ['ptak', '🐦'], ['osmiornica', '🐙'], ['krab', '🦀']];
const ACT = { atak: .9, moc: 2.6, oberwal: .45 };          // czas trwania [s]
const rnd = (a, b) => a + Math.random() * (b - a);

/* --- renderer, światło, kamera z boku --- */
const renderer = new T.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new T.Scene();
scene.background = new T.Color(0x8fd3f4); scene.fog = new T.Fog(0xf6d9a8, 45, 120);
scene.add(new T.HemisphereLight(0xffffff, 0xb08850, .75));
const sun = new T.DirectionalLight(0xffffff, .75); sun.position.set(-4, 10, 7); scene.add(sun);
const cam = new T.PerspectiveCamera(32, 1, .5, 300);
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h;
  const d = Math.max(1, 2.1 / cam.aspect);                   // wąski ekran: kamera dalej, żeby zmieścić drogę
  const yaw = KAT * Math.PI / 180, pit = WYS * Math.PI / 180;
  // odległość tak, żeby droga i wysokość aut zajmowały na ekranie tyle co przy 30° i pasach 3 m
  const D = ZOOM * 24.2 * d * (ROAD * Math.sin(pit) + 2.5 * Math.cos(pit)) / 8.47, tz = Q.get('ui') === '0' ? 0 : ROAD * .13;
  cam.position.set(D * Math.cos(pit) * Math.sin(yaw), D * Math.sin(pit), tz + D * Math.cos(pit) * Math.cos(yaw));
  cam.lookAt(0, .2, tz); cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* --- świat: piasek, droga, przewijane pasy i złomowisko przy drodze --- */
const mat = c => new T.MeshLambertMaterial({ color: c });
const add = (geo, m, x, y, z, par = scene) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
add(new T.PlaneGeometry(400, 200), mat(0xe8b56a), 0, 0, 0).rotation.x = -Math.PI / 2;
add(new T.PlaneGeometry(400, ROAD), mat(0x4b4747), 0, .01, 0).rotation.x = -Math.PI / 2;
const scroll = [];                                          // obiekty przesuwane z drogą: {o, w (okres), f (paralaksa)}
const dash = new T.BoxGeometry(2.2, .04, .16), dashM = new T.MeshBasicMaterial({ color: 0xf2efe6 });
for (let x = -60; x < 60; x += 5) for (const z of [-PAS, 0, PAS]) scroll.push({ o: add(dash, dashM, x, .03, z), w: 120, f: 1 });
const curb = new T.BoxGeometry(2, .18, .5);
for (let x = -60, i = 0; x < 60; x += 2, i++) for (const z of [-ROAD / 2 - .25, ROAD / 2 + .25]) scroll.push({ o: add(curb, mat(i % 2 ? 0xf2efe6 : 0xd8342a), x, .09, z), w: 120, f: 1 });
// rekwizyty: opony, beczki, kaktusy, kamienie — z tyłu i trochę z przodu
function prop(kind) {
  const g = new T.Group();
  if (kind === 0) for (let i = 0; i < 3; i++) add(new T.TorusGeometry(.55, .25, 6, 12), mat(0x2b2a2e), 0, .25 + i * .45, 0, g).rotation.x = Math.PI / 2;
  if (kind === 1) { add(new T.CylinderGeometry(.5, .5, 1.3, 10), mat([0xc0392b, 0x2f7fbf, 0x3f9b4a][Math.random() * 3 | 0]), 0, .65, 0, g); add(new T.TorusGeometry(.5, .05, 4, 12), mat(0x333333), 0, .9, 0, g).rotation.x = Math.PI / 2; }
  if (kind === 2) { const m = mat(0x4f9a43); add(new T.CylinderGeometry(.35, .4, 3, 8), m, 0, 1.5, 0, g); const a = add(new T.CylinderGeometry(.22, .22, 1.2, 6), m, .6, 1.9, 0, g); a.rotation.z = .1; add(new T.CylinderGeometry(.22, .22, .7, 6), m, .35, 1.4, 0, g).rotation.z = Math.PI / 2; }
  if (kind === 3) add(new T.DodecahedronGeometry(rnd(.6, 1.4)), mat(0xb47a4a), 0, .3, 0, g).scale.y = .6;
  return g;
}
for (let i = 0; i < 26; i++) { const p = prop(i % 4); p.position.set(rnd(-60, 60), 0, i % 5 ? rnd(-ROAD / 2 - 22, -ROAD / 2 - 2) : rnd(ROAD / 2 + 3, ROAD / 2 + 5)); p.rotation.y = rnd(0, 6); scene.add(p); scroll.push({ o: p, w: 120, f: 1 }); }
for (let i = 0; i < 9; i++) {                               // płaskowyże w oddali, wolniej (paralaksa)
  const h = rnd(6, 14), m = add(new T.CylinderGeometry(rnd(6, 12), rnd(9, 15), h, 7), mat(0xd08a52), rnd(-110, 110), h / 2, rnd(-95, -70));
  scroll.push({ o: m, w: 220, f: .12 });
}

/* --- bryki --- */
const blobG = new T.CircleGeometry(1, 20), blobM = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .25, depthWrite: false });
const cars = KINDS.map(([kind, ic], i) => {
  const b = buildBryka(kind); scene.add(b.g);
  const sh = add(blobG, blobM, 0, .02, 0); sh.rotation.x = -Math.PI / 2; sh.scale.set(b.len * .5, 1.25, 1);
  return { b, kind, ic, i, lane: i, x: -6 + i * 4, z: LANES[i], tx: rnd(-6, 6), act: null, at: 0, hitT: 0, sh, cd: 0, shield: 0 };
});
brykaPose(cars[0].b, 'jazda', 0);

/* --- cząsteczki: kurz, gwiazdki trafienia --- */
const parts = [];
function puff(x, y, z, c = 0xd9c39a, s = .2, vy = .5) {
  const m = add(new T.SphereGeometry(1, 6, 4), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .7, depthWrite: false }), x, y, z);
  m.scale.setScalar(s); parts.push({ m, vx: -V * .6 + rnd(-1, 1), vy, life: .45, t: 0, s });
}
function stars(x, y, z) {
  for (let i = 0; i < 7; i++) {
    const m = add(new T.OctahedronGeometry(.22), new T.MeshBasicMaterial({ color: 0xffd23f, transparent: true }), x, y, z);
    const a = i / 7 * Math.PI * 2; parts.push({ m, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 + 2, life: .7, t: 0, s: 1, star: 1 });
  }
}

/* --- akcje: atak / moc / oberwanie --- */
const front = c => c.x + c.b.len / 2, back = c => c.x - c.b.len / 2;
function start(c, act) {
  if (c.act && c.act !== 'oberwal' || c.cd > 0 || c.hitT > 0) return false;
  c.act = act; c.at = 0; c.done = false; c.cd = ACT[act] + .4;
  if (act === 'moc' && c.kind === 'osmiornica') {          // macka chwyta auto z sąsiedniego pasa
    const t = cars.find(o => o !== c && Math.abs(o.lane - c.lane) === 1 && Math.abs(o.x - c.x) < 4);
    c.grabT = t; c.b.p.grab = c.b.p.tent[t && t.lane < c.lane ? 0 : 3];
  }
  return true;
}
function hit(o, by) {
  if (o.hitT > 0 || o.shield > 0 || (o.act === 'moc' && (o.kind === 'rekin' || o.kind === 'ptak'))) return;
  o.hitT = 1.6; o.act = 'oberwal'; o.at = 0; o.x -= 1.5; o.tx = Math.min(o.tx, by.x - 4);
  stars(o.x, 1.8, o.z);
}
function resolve(c) {                                       // w połowie animacji: kogo trafiliśmy
  const k = c.kind;
  for (const o of cars) {
    if (o === c) continue;
    const same = o.lane === c.lane, dx = o.x - c.x;
    if (c.act === 'atak') {
      if ((k === 'rekin' || k === 'ptak') && same && back(o) - front(c) < 1.6 && dx > 0) hit(o, c);
      if (k === 'osmiornica' && same && dx < 0 && front(o) > back(c) - 6) hit(o, c);
      if (k === 'krab' && Math.abs(o.lane - c.lane) === 1 && Math.abs(dx) < 3.2) hit(o, c);
    }
  }
  if (c.act === 'moc' && k === 'osmiornica' && c.grabT) { hit(c.grabT, c); c.grabT.x -= 2; }
}

/* --- przyciski: emotka auta, 💥 atak, ⭐ moc --- */
let lastUser = -9;
$('cars').innerHTML = cars.map(c => `<div class="car"><div class="ic">${c.ic}</div><div class="b"><button data-i="${c.i}" data-a="atak">💥</button><button data-i="${c.i}" data-a="moc">⭐</button></div></div>`).join('');
$('cars').addEventListener('pointerdown', e => {
  const bt = e.target.closest('button'); if (!bt) return; e.preventDefault();
  lastUser = clock; start(cars[bt.dataset.i], bt.dataset.a);
});
let running = false;
$('bGo').onclick = () => { $('menu').hidden = true; $('ui').hidden = Q.get('ui') === '0'; running = true; };

/* --- pętla --- */
let clock = 0, prev = performance.now(), aiT = 1;
function step(dt) {
  clock += dt;
  for (const s of scroll) { s.o.position.x -= V * s.f * dt; if (s.o.position.x < -s.w / 2) s.o.position.x += s.w; }
  // demo: auta same atakują i zmieniają pas, gdy nikt nie dotyka
  if ((aiT -= dt) < 0) {
    aiT = rnd(.7, 1.6);
    const c = cars[Math.random() * 4 | 0];
    if (Math.random() < .45) {
      const nl = c.lane + (Math.random() < .5 ? -1 : 1);
      if (nl >= 0 && nl < 4 && !cars.some(o => o !== c && o.lane === nl && Math.abs(o.x - c.x) < 5)) c.lane = nl;
    } else if (clock - lastUser > 4 || !running) start(c, Math.random() < .65 ? 'atak' : 'moc');
    c.tx = rnd(-7, 7);
  }
  for (const c of cars) {
    const b = c.b;
    c.cd = Math.max(0, c.cd - dt); c.shield = Math.max(0, c.shield - dt);
    // jazda: zbliżaj się do celu x, ukarany zostaje w tyle
    const fast = c.act === 'moc' && (c.kind === 'rekin' || c.kind === 'ptak') ? 4 : 0;
    c.x += ((c.hitT > 0 ? -XMAX : c.tx + fast) - c.x) * Math.min(1, dt * (c.hitT > 0 ? .7 : .9));
    c.x = Math.max(-XMAX, Math.min(XMAX, c.x));
    const pz = c.z; c.z += (LANES[c.lane] - c.z) * Math.min(1, dt * 5);
    // poza z osi czasu akcji
    let pose = 'jazda', k = 0;
    if (c.act) {
      c.at += dt; const d = ACT[c.act], u = c.at / d;
      if (u >= 1) { if (c.act === 'moc' && c.kind === 'krab') c.shield = 0; c.act = null; }
      else {
        pose = c.act; k = Math.min(1, u / .2, (1 - u) / .25);
        if (!c.done && u > (c.act === 'moc' ? .3 : .35)) { c.done = true; resolve(c); if (c.act === 'moc' && c.kind === 'krab') c.shield = d; }
      }
    }
    brykaPose(b, pose, k);
    brykaTick(b, dt, V);
    b.g.position.set(c.x, 0, c.z);
    b.g.rotation.x = Math.max(-.12, Math.min(.12, (c.z - pz) / Math.max(dt, 1e-3) * -.03));   // przechył przy zmianie pasa
    // mruganie po trafieniu, jak w starych platformówkach
    if (c.hitT > 0) { c.hitT -= dt; b.g.visible = c.hitT <= 0 || Math.floor(c.hitT * 12) % 2 === 0; }
    else b.g.visible = true;
    c.sh.position.set(c.x, .02, c.z);
    if (Math.random() < dt * 5 && pose !== 'moc') puff(c.x - c.b.len / 2, .3, c.z + rnd(-.5, .5));
    if (pose === 'moc' && c.kind === 'rekin' && Math.random() < dt * 30) puff(c.x + rnd(-1, 1), .25, c.z + rnd(-.8, .8), 0x6b6560, .3, 2.5);
  }
  // zderzenia na tym samym pasie: auto z tyłu odbija się i zwalnia
  for (const a of cars) for (const o of cars) {
    if (a === o || Math.abs(a.z - o.z) > 1.8 || a.x > o.x) continue;
    const gap = (a.b.len + o.b.len) / 2 - .3 - (o.x - a.x);
    if (gap > 0) { a.x -= gap * .8; o.x += gap * .2; a.tx = Math.min(a.tx, o.x - 5); if (gap > .4) puff((a.x + o.x) / 2, 1, a.z, 0xffffff, .3, 1.5); }
  }
  for (const c of cars) { c.b.g.position.x = c.x; c.sh.position.x = c.x; }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt;
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; if (p.star) p.vy -= 12 * dt;
    p.m.scale.setScalar(p.s * (p.star ? 1 : 1 + p.t * 2)); p.m.material.opacity = Math.max(0, 1 - p.t / p.life) * (p.star ? 1 : .7);
    if (p.t > p.life) { scene.remove(p.m); p.m.material.dispose(); parts.splice(i, 1); }
  }
  [...$('cars').querySelectorAll('button')].forEach(bt => bt.classList.toggle('cd', cars[bt.dataset.i].cd > 0));
}
function frame(now) {
  const dt = Math.min(.05, (now - prev) / 1000); prev = now;
  step(dt); renderer.render(scene, cam); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
