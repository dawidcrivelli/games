'use strict';
// Dzikie Bryki — wyścig 4 groźnych pojazdów na 4 pasach, widok z boku (2.5D). Gracz kontra 3 auta komputera.
// Modele: models/pojazdy.bryki.js (auta, pozy), models/trasy.bryki.js (motywy, przeszkody); dźwięki: dzwieki.js.
// Świat w „s” = metry wzdłuż trasy; na ekranie x = s − camS (kamera jedzie za graczem). Wysokość drogi: H(s) (górki).
const T = THREE, $ = id => document.getElementById(id);
const PAS = 3.5, LANES = [-1.5, -.5, .5, 1.5].map(k => k * PAS), ROAD = 4 * PAS + .6;
const KINDS = ['rekin', 'ptak', 'osmiornica', 'krab', 'nietoperz', 'zaba'];
const IC = { rekin: '🦈', ptak: '🐦', osmiornica: '🐙', krab: '🦀', nietoperz: '🦇', zaba: '🐸' };
const MOC_IC = { rekin: '🌊', ptak: '🪽', osmiornica: '🐙', krab: '🛡️', nietoperz: '🦇', zaba: '🦿' };
const WORD_ATAK = { rekin: 'CHAP!', ptak: 'DZIOB!', osmiornica: 'PLUM!', krab: 'SZCZYP!', nietoperz: 'PIIISK!', zaba: 'MLASK!' };
const WORD_MOC = { rekin: 'PŁETWA!', ptak: 'FRUU!', osmiornica: 'CHWYT!', krab: 'KOLCE!', nietoperz: 'RÓJ!', zaba: 'HOPSA!' };
const SND_ATAK = { rekin: 'chap', ptak: 'dziob', osmiornica: 'tusz', krab: 'szczyp', nietoperz: 'pisk', zaba: 'jezyk' };
const SND_MOC = { rekin: 'plum', ptak: 'trzepot', osmiornica: 'slurp', krab: 'klang', nietoperz: 'roj', zaba: 'sprezyna' };
const NAZWY = { rekin: 'Rekin', ptak: 'Ptak', osmiornica: 'Ośmiornica', krab: 'Krab', nietoperz: 'Nietoperz', zaba: 'Żaba',
  pustynia: 'Pustynia', zlomowisko: 'Złomowisko', wulkan: 'Wulkan', lodowiec: 'Lodowiec' };
const BUB_COL = ['#ffd23f', '#ff4d3a', '#3ad1ff', '#ff7ae0', '#7dff6a'];
const LEN = 1150, CRUISE = 15, PX = -8, G = 24;              // długość trasy [m], prędkość [m/s], gracz na ekranie (x), grawitacja
const ATAK_T = .7, ATAK_CD = 1.1, TURBO_T = 1.4, TURBO_CD = 5, MOC_FILL = 9, HIT_T = 1.0, BLINK_T = 1.4, SPIN_T = .7, GHOST_T = 1.6;
const MOC_T = { rekin: 3, ptak: 3.2, osmiornica: 1.1, krab: 4, nietoperz: 1.4, zaba: 3 };
const MOC_V = { rekin: 1.3, ptak: 1.25, osmiornica: 1, krab: 1.15, nietoperz: 1.1, zaba: 1.2 };
const DIFF = {
  latwy: { cruise: .9, think: .55, react: .6, aggro: .3, aggroP: .06, look: 11, turbo: .06, band: .03, gap: [-12, 10] },
  trudny: { cruise: 1.0, think: .28, react: .92, aggro: .7, aggroP: .28, look: 20, turbo: .25, band: .02, gap: [-6, 16] },
};
const HAZ = ['twarda', 'lawa', 'slisko', 'tusz', 'jajo'];
const TRASY = brykiTrasy(), TRASY_KEYS = Object.keys(TRASY);
const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.random() * a.length | 0];
const mod = (v, w) => ((v % w) + w) % w;
function mulberry(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SET = Object.assign({ car: 'rekin', trasa: 'pustynia', diff: 'latwy', best: {} }, JSON.parse(localStorage.getItem('bryki') || '{}'));
const save = () => localStorage.setItem('bryki', JSON.stringify(SET));

/* ---------- górki: gładkie garby wzdłuż trasy ---------- */
let HILLS = [], SEGS = [];          // SEGS: tunel i most {typ, s0, s1}
function H(s) { let h = 0; for (const q of HILLS) { const u = (s - q.s) / q.L; if (u > 0 && u < 1) h += q.A * (1 - Math.cos(u * 2 * Math.PI)) / 2; } return h; }
function Hd(s) { let d = 0; for (const q of HILLS) { const u = (s - q.s) / q.L; if (u > 0 && u < 1) d += q.A * Math.PI / q.L * Math.sin(u * 2 * Math.PI); } return d; }

/* ---------- renderer, światło, kamera z boku (30°) ---------- */
const renderer = new T.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new T.Scene(); scene.fog = new T.Fog(0xffffff, 45, 130);
const hemi = new T.HemisphereLight(), sun = new T.DirectionalLight(); sun.position.set(-4, 10, 7); scene.add(hemi, sun);
const cam = new T.PerspectiveCamera(32, 1, .5, 400), camBase = new T.Vector3();
let camY = 0;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h;
  // kamera „3” z porównania: skos 8° (widać przody aut), nachylenie 38°, pasy 3,5 m
  const d = Math.max(1, 2.1 / cam.aspect), pit = 38 * Math.PI / 180, yaw = 8 * Math.PI / 180, tz = .3;
  const D = .95 * 24.2 * d * (ROAD * Math.sin(pit) + 2.5 * Math.cos(pit)) / 8.47;
  camBase.set(D * Math.cos(pit) * Math.sin(yaw), D * Math.sin(pit), tz + D * Math.cos(pit) * Math.cos(yaw)); cam.position.copy(camBase); cam.lookAt(0, .2, tz); cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
const V3 = new T.Vector3();
function toScreen(x, y, z) { V3.set(x, y, z).project(cam); return [(V3.x + 1) / 2 * innerWidth, (1 - V3.y) / 2 * innerHeight]; }

/* ---------- świat: motyw trasy, droga z górkami ---------- */
let world = null, deco = [], strips = [], TH = null;
const NSEG = 160, XW = 160;
// Pas siatki wzdłuż x; zs = [[z, udział wysokości górki, dodatek y]]
function strip(zs, col) {
  const nz = zs.length, pos = new Float32Array((NSEG + 1) * nz * 3), idx = [];
  for (let i = 0; i <= NSEG; i++) for (let j = 0; j < nz; j++) { const k = (i * nz + j) * 3; pos[k] = -XW / 2 + i * XW / NSEG; pos[k + 1] = zs[j][2]; pos[k + 2] = zs[j][0]; }
  for (let i = 0; i < NSEG; i++) for (let j = 0; j < nz - 1; j++) { const a = i * nz + j, b = a + nz; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, new T.MeshLambertMaterial({ color: col })); m.userData.zs = zs; world.add(m); strips.push(m); return m;
}
function updStrips() {
  const hs = []; for (let i = 0; i <= NSEG; i++) hs.push(H(camS - XW / 2 + i * XW / NSEG));
  const most = SEGS.find(q => q.typ === 'most');
  for (const m of strips) {
    const zs = m.userData.zs, nz = zs.length, p = m.geometry.attributes.position.array;
    for (let i = 0; i <= NSEG; i++) {
      const s = camS - XW / 2 + i * XW / NSEG, f = m.userData.bank && most && s > most.s0 + 1 && s < most.s1 - 1 ? 0 : 1;   // na moście bez nasypu: pod spodem woda
      for (let j = 0; j < nz; j++) p[(i * nz + j) * 3 + 1] = hs[i] * zs[j][1] * f + zs[j][2] - (f ? 0 : .3);
    }
    m.geometry.attributes.position.needsUpdate = true; if (HILLS.length) m.geometry.computeVertexNormals();
  }
}
function setTheme(name) {
  TH = TRASY[name];
  if (world) scene.remove(world);
  world = new T.Group(); scene.add(world); deco = []; strips = [];
  scene.background = new T.Color(TH.sky); scene.fog.color.set(TH.fog);
  hemi.color.set(TH.hemi[0]); hemi.groundColor.set(TH.hemi[1]); hemi.intensity = TH.hemi[2];
  sun.color.set(TH.sun[0]); sun.intensity = TH.sun[1];
  const r = mulberry(TH.seed), lam = c => new T.MeshLambertMaterial({ color: c });
  const gnd = new T.Mesh(new T.PlaneGeometry(600, 400), lam(TH.ground)); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -.03; world.add(gnd);
  const bank = new T.Color(TH.ground).multiplyScalar(.88).getHex();
  strip([[-ROAD / 2, 1, .01], [ROAD / 2, 1, .01]], TH.road);
  strip([[-ROAD / 2 - 3.5, 0, -.02], [-ROAD / 2, 1, 0]], bank).userData.bank = 1;
  strip([[ROAD / 2, 1, 0], [ROAD / 2 + 3.5, 0, -.02]], bank).userData.bank = 1;
  const dash = new T.BoxGeometry(2.2, .04, .16), dashM = new T.MeshBasicMaterial({ color: TH.line }), curb = new T.BoxGeometry(2, .18, .5);
  const curbM = TH.curb.map(c => lam(c));
  const sc = (o, s0, f, w, road) => { world.add(o); deco.push({ o, s0, f, w, road, y0: o.position.y }); };
  for (let x = 0; x < 120; x += 5) for (const z of [-PAS, 0, PAS]) { const m = new T.Mesh(dash, dashM); m.position.set(0, .03, z); sc(m, x, 1, 120, 1); }
  for (let x = 0, i = 0; x < 120; x += 2, i++) for (const z of [-ROAD / 2 - .25, ROAD / 2 + .25]) { const m = new T.Mesh(curb, curbM[i % 2]); m.position.set(0, .09, z); sc(m, x, 1, 120, 1); }
  for (let i = 0; i < 24; i++) {                     // rekwizyty: za drogą i kilka małych z przodu
    const p = brProp(TH.props[i % TH.props.length]), front = i % 6 === 0;
    p.position.z = front ? ROAD / 2 + 4.5 + r() * 2 : -ROAD / 2 - 4 - r() * 22; p.rotation.y = r() * 6;
    if (front) p.scale.setScalar(.7);
    sc(p, r() * 140, 1, 140, 0);
  }
  for (let i = 0; i < 7; i++) { const p = brProp(TH.far[i % TH.far.length]); p.position.z = -70 - r() * 40; p.rotation.y = r() * 6; sc(p, r() * 300, .15, 300, 0); }
}
function placeDeco() {
  for (const d of deco) {
    const x = mod(d.s0 - camS * d.f, d.w) - d.w / 2; d.o.position.x = x;
    if (d.road) { d.o.position.y = d.y0 + H(camS + x); d.o.rotation.z = Math.atan(Hd(camS + x)); }
  }
  updStrips();
}

/* ---------- auta: 5 rodzajów, w wyścigu 4 ---------- */
const blobG = new T.CircleGeometry(1, 20), blobM = new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: .25, depthWrite: false });
const starG = new T.ExtrudeGeometry(new T.Shape(brGwiazdaPts(.22, .1).map(([x, y]) => new T.Vector2(x, y))), { depth: .06, bevelEnabled: false });
const ALL = KINDS.map(kind => {
  const b = buildBryka(kind); scene.add(b.g);
  const sh = new T.Mesh(blobG, blobM); sh.rotation.x = -Math.PI / 2; sh.scale.set(b.len * .5, 1.3, 1); scene.add(sh);
  const dz = new T.Group(); scene.add(dz);                 // gwiazdki nad głową po trafieniu
  for (let i = 0; i < 4; i++) { const m = new T.Mesh(starG, brMat(0xffd23f, 'glow')); m.position.set(Math.cos(i * 1.57) * .8, 0, Math.sin(i * 1.57) * .8); dz.add(m); }
  return { kind, b, sh, dz, len: b.len * .8, s: 0, lane: 0, z: 0, y: 0, ya: 0, vy: 0, v: 0, ai: {} };
});
let cars = ALL.slice(0, 4), P = ALL[0];
// Obrazki aut (z przodu, z ukosa) do menu, paska postępu, podium — zamiast emotek
const THUMB = (() => {
  const W = 200, Hh = 130, r = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }), out = {};
  r.setPixelRatio(1); r.setSize(W, Hh);
  const sc = new T.Scene(), cm = new T.PerspectiveCamera(28, W / Hh, .1, 100);
  sc.add(new T.HemisphereLight(0xffffff, 0x8a7a66, .85)); const l = new T.DirectionalLight(0xffffff, .8); l.position.set(4, 6, 5); sc.add(l);
  for (const k of KINDS) {
    const b = buildBryka(k); brykaPose(b, 'jazda', 0); sc.add(b.g);
    const box = new T.Box3().setFromObject(b.g), c = box.getCenter(new T.Vector3()), R = box.getSize(new T.Vector3()).length() / 2;
    cm.position.copy(c).add(new T.Vector3(1.15, .5, 1).normalize().multiplyScalar(R / Math.sin(14 * Math.PI / 180) * .6)); cm.lookAt(c);
    r.render(sc, cm); out[k] = r.domElement.toDataURL(); sc.remove(b.g);
  }
  r.dispose(); r.forceContextLoss?.();
  return out;
})();
const img = (k, cls = '') => `<img class="${cls}" src="${THUMB[k]}" alt="${k}">`;
// celownik: czerwone koło pod autem, które mój atak teraz trafi
const aims = [0, 1, 2].map(() => { const m = new T.Mesh(new T.RingGeometry(1.5, 2.0, 28), new T.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: .85, depthWrite: false })); m.rotation.x = -Math.PI / 2; scene.add(m); return m; });
const marker = new T.Group(); scene.add(marker);           // strzałka nad autem gracza: zawsze widać, które jest moje
brPart(marker, new T.ConeGeometry(.45, .8, 4), brMat(0xffd23f), 0, 0, 0, { r: [Math.PI, Math.PI / 4, 0], ol: .05 });
// Skład wyścigu: gracz + 3 losowe z pozostałych
function lineup() {
  P = ALL.find(c => c.kind === SET.car);
  const rest = ALL.filter(c => c !== P).sort(() => Math.random() - .5).slice(0, 3);
  cars = [P, ...rest].sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
  for (const c of ALL) { const on = cars.includes(c); c.b.g.visible = on; c.sh.visible = on; c.dz.visible = false; }
  buildHud();
}

/* ---------- stan gry ---------- */
let state = 'menu', diff = SET.diff, camS = 0, raceT = 0, countT = 0, endT = 0, shake = 0, items = [], eggs = [], shots = [], finOrder = [];
const laneOf = c => clamp(Math.round(c.z / PAS + 1.5), 0, 3);
const near = c => Math.abs(c.s - camS) < 16;
const mocOn = c => c.act === 'moc';
const under = c => mocOn(c) && c.kind === 'rekin';            // rekin pod asfaltem
const spiky = c => mocOn(c) && c.kind === 'krab';             // krab w kolcach
const high = c => mocOn(c) && c.kind === 'zaba' && c.at > .25; // żaba na szczudłach: inne auta jadą pod nią
const immune = c => c.blinkT > 0 || (mocOn(c) && ['rekin', 'ptak', 'krab', 'zaba'].includes(c.kind)) || c.fin;

function resetCar(c, i, lane) {
  Object.assign(c, { s: -c.len / 2 - [0, 3, 1.5, 4.5][i], lane, z: LANES[lane], y: 0, ya: 0, vy: 0, v: 0, hitT: 0, blinkT: 0, spinT: 0, spinD: SPIN_T, slipT: 0,
    turboT: 0, turboCd: 1.5, atakCd: 0, moc: 1, ghostT: 0, mocFill: 0, act: null, at: 0, done: false, lungeT: 0, eggT: 0, fin: false, finT: 0, player: c === P, tilt: 0, bonkT: 0,
    ai: { t: rnd(.2, .6), gap: 0, gapT: 0 } });
}
function setLane(c, n) { n = clamp(n, 0, 3); if (n === c.lane) return false; c.lane = n; return true; }

/* ---------- trasa: górki, przeszkody, bonusy ---------- */
function genTrack(th) {
  const r = mulberry(th.seed * 7 + (diff === 'trudny' ? 3 : 0)), R = a => a[Math.floor(r() * a.length)], out = [];
  const add = (typ, s, lane, y = 0) => out.push({ typ, s, lane, y, rodzaj: BRYKI_RODZAJ()[typ], len: typ === 'rampa' || typ === 'turbo' ? 3 : 1.6, alive: true, g: null, hitBy: new Set() });
  // górki: łagodny garb (podskok tylko z turbo), skocznia (zawsze podrzuca, nad nią gwiazdki), fala (dwa małe garby)
  HILLS = []; SEGS = [];
  const most = { typ: 'most', s0: Math.round(LEN * .55), s1: Math.round(LEN * .55) + 36 };
  SEGS.push(most); HILLS.push({ s: most.s0, L: 36, A: 1.8, most: 1 });
  out.push({ typ: 'most', s: (most.s0 + most.s1) / 2, half: 18, lane: 1, y: 0, rodzaj: '', len: 0, alive: true, g: null, hitBy: new Set(), zMid: true });
  const inSeg = (a, b) => SEGS.some(q => b > q.s0 - 6 && a < q.s1 + 6);
  for (let s = 80 + r() * 30; s < LEN - 90; s += 55 + r() * 45) {
    if (inSeg(s, s + 25)) continue;
    const t = r();
    if (t < .4) HILLS.push({ s, L: 16 + r() * 6, A: .8 + r() * .5 });
    else if (t < .75) { const q = { s, L: 10 + r() * 2, A: 1.3 + r() * .4 }; HILLS.push(q); const l = R([0, 1, 2, 3]); for (let i = 0; i < 3; i++) add('gwiazda', s + q.L * .55 + i * 2.4, l, 2.1 + (i === 1) * .4); }
    else { HILLS.push({ s, L: 8, A: .7 }); HILLS.push({ s: s + 9, L: 8, A: .7 }); }
  }
  const onHill = s => HILLS.some(q => s > q.s - 4 && s < q.s + q.L + 4);
  const pats = ['jedna', 'jedna', 'dwie', 'skrzynie', 'gwiazdy', 'gwiazdy', 'rampa', 'turbo', 'slisko', 'slalom', 'mix', 'ruch', 'ruch', 'ruch'];
  let s = 55;
  while (s < LEN - 70) {
    const L = [0, 1, 2, 3].sort(() => r() - .5);
    let p = R(pats); if (onHill(s) && ['rampa', 'turbo', 'slisko', 'slalom'].includes(p)) p = 'gwiazdy';
    switch (p) {
      case 'jedna': add(R(th.twarde), s, L[0]); break;
      case 'dwie': add(R(th.twarde), s, L[0]); add(R(th.twarde), s + r() * 3, L[1]); break;
      case 'skrzynie': add(R(th.miekkie), s, L[0]); add(R(th.miekkie), s + 2, L[1]); if (r() < .5) add(R(th.miekkie), s + 4, L[2]); break;
      case 'gwiazdy': for (let i = 0; i < 4; i++) add('gwiazda', s + i * 2.5, L[0]); break;
      case 'rampa': add('rampa', s, L[0]); for (let i = 0; i < 3; i++) add('gwiazda', s + 5 + i * 2.6, L[0], 1.3 + Math.sin((i + 1) / 4 * Math.PI) * .7); add(R(th.twarde), s + 8, L[0]); break;
      case 'turbo': add('turbo', s, L[0]); add('turbo', s + 9, L[1]); break;
      case 'slisko': add(th.slisko, s, L[0]); if (r() < .5) add(th.slisko, s + 4, L[1]); break;
      case 'slalom': for (let i = 0; i < 3; i++) add(R(th.twarde), s + i * 8, L[i]); s += 14; break;
      case 'mix': add(R(th.twarde), s, L[0]); add('gwiazda', s, L[1]); add(R(th.miekkie), s + 3, L[2]); break;
      case 'ruch': {                                      // ruchoma przeszkoda motywu
        const typ = R(th.ruchome), m = BRYKI_RUCH()[typ];
        if (m === 'swing' && onHill(s)) break;
        add(typ, s, m === 'swing' ? 1 : L[0]);
        const it = out[out.length - 1]; it.move = { type: m, t: 0, dir: r() < .5 ? -1 : 1, ph: r() * 6, sp: { biegacz: 3.5, pingwin: 4, beczka_tocz: 3, glaz_tocz: 7, sniezka: 6 }[typ] || 0 };
        if (m === 'cross') it.z = LANES[L[0]];
        if (m === 'swing') it.zMid = true;
        break;
      }
    }
    s += (diff === 'trudny' ? 14 : 17) + r() * 12;
  }
  return out;
}
function itemMesh(it) {
  if (it.typ === 'tusz') return inkMesh();
  if (it.typ === 'jajo') return eggSplatMesh();
  if (it.typ === 'start' || it.typ === 'meta') return brMeta(ROAD, it.typ === 'meta', it.typ === 'meta');
  if (it.typ === 'tunel') return brTunel(it.half * 2, TH.tunel, ROAD);
  if (it.typ === 'most') return brMost(it.half * 2, 1.8, ROAD, TH.woda, TH.lawa, TH.luk);
  return brObst(it.typ);
}
function inkMesh() {
  const g = new T.Group();
  for (const [x, z, r] of [[0, 0, 1.3], [1.2, .4, .8], [-1.3, -.3, .9], [.4, -.7, .6], [-.5, .8, .5]]) brPart(g, new T.CircleGeometry(r, 14), brMat(0x101018), x, .05, z, { r: [-Math.PI / 2, 0, 0], ol: 0 });
  for (let i = 0; i < 4; i++) brPart(g, new T.SphereGeometry(.25 + i * .05, 8, 6), brMat(0x101018), rnd(-1.2, 1.2), .1, rnd(-.6, .6), { s: [1, .4, 1], ol: 0 });
  return g;
}
function eggSplatMesh() {
  const g = new T.Group();
  brPart(g, new T.CircleGeometry(1.1, 14), brMat(0xffffff), 0, .05, 0, { r: [-Math.PI / 2, 0, 0], ol: 0 });
  brPart(g, new T.CircleGeometry(.5, 12), brMat(0xffc21a), .1, .06, .1, { r: [-Math.PI / 2, 0, 0], ol: 0 });
  for (let i = 0; i < 4; i++) brPart(g, new T.ConeGeometry(.12, .25, 4), brMat(0xf4efe0), rnd(-.9, .9), .1, rnd(-.7, .7), { r: [rnd(-1, 1), 0, rnd(-1, 1)], ol: .01 });
  return g;
}
function newItem(o) { const it = Object.assign({ y: 0, len: 1.6, alive: true, g: null, hitBy: new Set() }, o); items.push(it); return it; }
function syncItems(dt) {
  for (const it of items) {
    const x = it.s - camS;
    if (it.ttl !== undefined) { it.ttl -= dt; if (it.ttl < 0) it.alive = false; else if (it.g && it.ttl < .6) it.g.scale.setScalar(it.ttl / .6); }
    const hf = it.half || 0, show = it.alive && x > -30 - hf && x < 45 + hf;
    if (show && !it.g) { it.g = itemMesh(it); world.add(it.g); if (it.move?.type === 'fall') { it.g.userData.rock.visible = false; it.g.userData.ring.visible = false; } }
    if (!show && it.g) { world.remove(it.g); it.g = null; }
    if (it.g) {
      const seg = it.typ === 'tunel' || it.typ === 'most';
      it.g.position.set(x, seg ? 0 : H(it.s) + it.y, it.zMid ? 0 : it.z ?? LANES[it.lane]); if (!it.y && !seg) it.g.rotation.z = Math.atan(Hd(it.s));
      if (it.g.userData.spin) it.g.userData.spin.rotation.y += dt * 3;
    }
  }
  if (items.length > 400) items = items.filter(it => it.alive || it.g);
}
const flyers = [];
function destroy(it, by) {
  if (!it.alive) return; it.alive = false;
  const z = it.z ?? LANES[it.lane];
  if ((it.typ === 'pingwin' || it.typ === 'biegacz') && it.g) {      // pingwina nie rozbijamy: odlatuje łukiem
    flyers.push({ g: it.g, s: it.s, y: H(it.s), z, vy: 9, vz: rnd(-4, 4), t: 0 }); it.g = null;
    if (Math.abs(it.s - camS) < 16) { snd(it.typ === 'pingwin' ? 'pip' : 'boing'); bubbleAt(it.typ === 'pingwin' ? 'PIIIP!' : 'HOPLA!', it.s, 1.8, z, 'small'); }
    return;
  }
  const col = it.g?.userData.col ?? 0x8a6a4a;
  for (let i = 0; i < 9; i++) part({ s: it.s, y: .6 + Math.random(), z: z + rnd(-.6, .6), vs: rnd(-2, 9), vy: rnd(3, 8), vz: rnd(-3, 3), col, size: rnd(.15, .32), life: 1, grav: 1, box: 1 });
  if (it.rodzaj === 'skrzynia') { sparkle(it.s, 1.2, z); if (by) addMoc(by, 1); }
  if (Math.abs(it.s - camS) < 16) { snd(it.rodzaj === 'skrzynia' ? 'trzask' : 'lup'); bubbleAt(it.rodzaj === 'skrzynia' ? 'KRAK!' : 'ŁUP!', it.s, 1.8, z, 'small'); }
}

// Ruchome przeszkody: przez pasy, pod prąd, wahadło, meteor; ruszają, gdy są blisko ekranu
function stepMovers(dt) {
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i]; f.t += dt; f.vy -= 20 * dt; f.y += f.vy * dt; f.z += f.vz * dt; f.s += 4 * dt;
    f.g.position.set(f.s - camS, f.y, f.z); f.g.rotation.x += dt * 9; f.g.rotation.z += dt * 5;
    if (f.t > 1.6) { world.remove(f.g); flyers.splice(i, 1); }
  }
  for (const it of items) {
    const m = it.move; if (!m || !it.alive) continue;
    const x = it.s - camS; if (x > 40 || x < -25) continue;
    m.t += dt; const R = it.g?.userData.roll;
    if (m.type === 'cross') {
      it.z += m.dir * m.sp * dt;
      if (Math.abs(it.z) > LANES[3]) { it.z = clamp(it.z, LANES[0], LANES[3]); m.dir *= -1; }
      it.lane = laneOf(it);
      if (R) {
        if (it.typ === 'pingwin') R.rotation.y = m.dir > 0 ? 0 : Math.PI;
        else R.rotation.x -= m.dir * m.sp * dt / .6;
        if (it.typ === 'biegacz') R.position.y = .7 + Math.abs(Math.sin(m.t * 5)) * 1.1;
      }
    }
    if (m.type === 'roll' && x < 30) { it.s -= m.sp * dt; if (R) R.rotation.z += m.sp * dt / .9; }
    if (m.type === 'swing') {
      const th = 1.0 * Math.sin(m.t * 2.4 + m.ph), L = 6.6, bz = -L * Math.sin(th), by = 8.3 - L * Math.cos(th);
      if (it.g) it.g.userData.pivot.rotation.x = th;
      for (const c of cars) if (Math.abs(c.s - it.s) < c.len / 2 + .8 && Math.abs(c.z - bz) < 1.4 && by < 2.6 + c.y && !high(c) && !under(c))
        if (hit(c, null)) bubbleAt('BAM!', it.s, by + 1, bz, 'big');
    }
    if (m.type === 'fall') {
      if (!m.on && cars.some(c => it.s - c.s > 0 && it.s - c.s < 24)) { m.on = true; m.y = 24; if (Math.abs(x) < 25) snd('swist'); }
      if (m.on && it.g) {
        m.y -= 22 * dt; const rk = it.g.userData.rock, ring = it.g.userData.ring;
        rk.visible = true; rk.position.y = Math.max(0, m.y) + .8; ring.visible = Math.floor(m.t * 8) % 2 === 0; ring.scale.setScalar(1 + m.y / 24);
        if (m.y <= 0) {                                    // uderzenie: trafia auta na pasie, zostawia lawę
          it.alive = false;
          for (const c of cars) if (laneOf(c) === it.lane && Math.abs(c.s - it.s) < c.len / 2 + 1.5 && c.y < 1.5 && !high(c)) hit(c, null, 'pop');
          for (let k = 0; k < 14; k++) part({ s: it.s, y: .5, z: LANES[it.lane] + rnd(-1, 1), vs: rnd(-5, 5), vy: rnd(4, 10), vz: rnd(-3, 3), col: pick([0xff7a1a, 0x3a2a2a, 0xffd23f]), size: rnd(.2, .4), life: 1, grav: 1, box: 1 });
          if (TH.lawa) newItem({ typ: 'lawa', s: it.s, lane: it.lane, rodzaj: 'lawa', ttl: 6 });
          if (Math.abs(x) < 16) { snd('bum'); bubbleAt('BUUUM!', it.s, 2, LANES[it.lane], 'big'); if (Math.abs(P.s - it.s) < 12) shake = .35; }
        }
      }
    }
  }
}

/* ---------- cząsteczki (w układzie trasy; y podane względem drogi) ---------- */
const parts = [], sphG = new T.SphereGeometry(1, 6, 4), boxG = new T.BoxGeometry(1, 1, 1), octG = new T.OctahedronGeometry(1);
function part(o) {
  const m = new T.Mesh(o.box ? boxG : o.oct ? octG : sphG, new T.MeshBasicMaterial({ color: o.col, transparent: true, opacity: o.op ?? .8, depthWrite: false }));
  m.scale.setScalar(o.size); scene.add(m); o.y += H(o.s); parts.push(Object.assign({ m, t: 0, vs: 0, vy: 0, vz: 0, grow: 0 }, o));
}
const puff = (s, y, z, col = 0xd9c39a, size = .2, vy = .6) => part({ s, y, z, col, size, vy, vs: rnd(-1, 1), life: .45, grow: 2, op: .6 });
function sparkle(s, y, z) { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; part({ s, y, z, vs: Math.cos(a) * 4, vy: Math.sin(a) * 4 + 3, col: 0xffd23f, size: .2, life: .7, grav: 1, oct: 1, op: 1 }); } }
function stepParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt;
    p.s += p.vs * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.grav) p.vy -= 16 * dt;
    const gy = H(p.s); if (p.y < gy && p.grav) { p.y = gy; p.vy *= -.3; p.vs *= .6; }
    p.m.position.set(p.s - camS, p.y, p.z); p.m.scale.setScalar(p.size * (1 + p.t * p.grow)); p.m.rotation.x += dt * 5;
    p.m.material.opacity = Math.max(0, 1 - p.t / p.life) * (p.op ?? .8);
    if (p.t > p.life) { scene.remove(p.m); p.m.material.dispose(); parts.splice(i, 1); }
  }
}

/* ---------- komiksowe napisy (gwiazda w tle jak w starych komiksach), kleks na ekranie ---------- */
function bubbleAt(txt, s, y, z, cls = '') {
  if (state === 'menu' || Math.abs(s - camS) > 16) return;
  const [X, Y] = toScreen(s - camS, H(s) + y, z), d = document.createElement('div');
  d.className = 'bub ' + cls; d.innerHTML = `<i></i><b>${txt}</b>`;
  d.style.cssText = `left:${X}px;top:${Y}px;--c:${pick(BUB_COL)};--r:${rnd(-14, 14).toFixed(0)}deg`;
  $('fx').append(d); setTimeout(() => d.remove(), 1050);
}
const bubble = (txt, c, cls) => bubbleAt(txt, c.s, 2.6 + c.y, c.z, cls);
function splat(how) {
  const cols = how === 'jajo' ? ['#fffdf3', '#ffc21a'] : ['#0d0b14', '#24123a'];
  for (let i = 0; i < 7; i++) {
    const d = document.createElement('i'), r = rnd(70, 190);
    Object.assign(d.style, { left: rnd(15, 85) + '%', top: rnd(15, 85) + '%', width: r + 'px', height: r * rnd(.7, 1.1) + 'px',
      background: `radial-gradient(circle at 40% 40%, ${cols[1]} 0 ${how === 'jajo' ? 30 : 60}%, ${cols[0]} 61% 100%)`, animationDelay: i * .03 + 's' });
    $('splat').append(d); setTimeout(() => d.remove(), 2200);
  }
}

/* ---------- akcje: atak, moc, turbo, trafienie ---------- */
function addMoc(c, n) {
  const was = c.moc; c.moc = Math.min(3, c.moc + n);
  if (c.player && c.moc > was) { snd(c.moc === 3 ? 'moc' : 'gwiazda'); if (c.moc === 3) bubble('⭐⭐⭐', c, 'emoji'); }
}
function act(c, a) {
  if (c.act || c.hitT > 0 || (c.fin && state !== 'menu')) return false;
  if (a === 'atak') { if (c.atakCd > 0) return false; c.atakCd = ATAK_CD; }
  if (a === 'moc') { if (c.moc < 3 && state !== 'menu') return false; if (state !== 'menu') c.moc = 0; }
  c.act = a; c.at = 0; c.done = false; c.eggT = 0; c.landed = false;
  if (c.kind === 'zaba' && a === 'atak') {                 // język celuje w najbliższe auto przed sobą, też na skos
    const t = state === 'menu' ? null : cars.filter(o => inReach(c, o)).sort((p, q) => p.s - q.s)[0];
    c.tgt = t; const dx = t ? Math.max(1, t.s - c.s - c.len / 2) : 6.5, dz = t ? t.z - c.z : 0;
    c.b.tongueYaw = -Math.atan2(dz, dx); c.b.tongueLen = Math.min(8, Math.hypot(dx, dz));
  }
  if (state === 'menu') snd(a === 'atak' ? SND_ATAK[c.kind] : SND_MOC[c.kind]);
  return true;
}
function turbo(c) {
  if (c.turboCd > 0 || c.fin || c.hitT > 0) return false;
  c.turboT = TURBO_T; c.turboCd = TURBO_CD; if (c.player) { snd('turbo'); bubble('WRUUM!', c, 'small'); }
  return true;
}
// Trafienie: auto kręci się, mocno zwalnia (zostaje w tyle) i przez chwilę jest „duchem” — inne auta przejeżdżają obok bez zderzeń.
// Atakujący dostaje gwiazdkę do mocy. Zderzenia aut nigdy nie karzą.
function hit(o, by, how) {
  if (immune(o)) return false;
  o.hitT = HIT_T; o.blinkT = BLINK_T; o.ghostT = GHOST_T; o.spinT = o.spinD = SPIN_T; o.v *= .3; o.slipT = 0;
  if (o.act === 'moc' || o.act === 'atak') o.act = null;
  if (how === 'pop') o.vy = Math.max(o.vy, 7);
  sparkle(o.s, 1.6 + o.y, o.z);
  if (near(o)) snd(how === 'tusz' || how === 'jajo' ? 'chlup' : 'boing');
  bubble(how === 'tusz' ? 'PLASK!' : how === 'jajo' ? 'CHLUP!' : how === 'macka' ? 'CHWYT!' : pick(['BUM!', 'ŁUP!', 'BAM!', 'TRACH!']), o);
  if (o.player) {
    shake = .4; if (how === 'tusz' || how === 'jajo') splat(how);
    if (by) setTimeout(() => bubbleAt(`<img src="${THUMB[by.kind]}">`, o.s, 4.2, o.z, 'emoji pic'), 120);   // kto mnie trafił
  }
  if (by) addMoc(by, 1);
  return true;
}
// Czy atak auta c sięga auta o? Każde auto atakuje w inną stronę: rekin i ptak do przodu, ośmiornica do tyłu, krab na boki, nietoperz daleko przed siebie
function inReach(c, o) {
  if (o === c || o.fin) return false;
  const dl = Math.abs(laneOf(o) - laneOf(c)), ds = o.s - c.s, gap = Math.abs(ds) - (c.len + o.len) / 2;
  if (o.y > 1.4 || under(o) || high(o)) return false;
  switch (c.kind) {
    case 'rekin': return dl === 0 && ds > 0 && gap < 5;
    case 'ptak': return dl === 0 && ds > 0 && gap < 6.5;
    case 'osmiornica': return dl === 0 && ds < 0 && gap < 7;
    case 'krab': return (dl === 1 && Math.abs(ds) < 4.5) || (dl === 0 && ds > 0 && gap < 2.5);
    case 'nietoperz': return dl === 0 && ds > 0 && gap < 12;
    case 'zaba': return ds > 0 && ((dl === 0 && gap < 7) || (dl === 1 && ds < 8.5));
  }
}
function itemInReach(c, it) {
  if (!it.alive || !['twarda', 'skrzynia', 'miekka'].includes(it.rodzaj)) return false;
  const dl = Math.abs(it.lane - laneOf(c)), ds = it.s - c.s, gap = Math.abs(ds) - (c.len + it.len) / 2;
  if (c.kind === 'rekin') return dl === 0 && ds > 0 && gap < 5;
  if (c.kind === 'ptak') return dl === 0 && ds > 0 && gap < 6.5;
  if (c.kind === 'krab') return (dl === 1 && Math.abs(ds) < 4.5) || (dl === 0 && ds > 0 && gap < 2.5);
  if (c.kind === 'nietoperz') return dl === 0 && ds > 0 && gap < 12;
  if (c.kind === 'zaba') return it.rodzaj === 'skrzynia' && ds > 0 && dl <= 1 && gap < 7;
  return false;
}
// Pociski: fala dźwiękowa nietoperza (leci pasem do przodu), rój małych nietoperzy (każdy goni auto)
const ringG = new T.TorusGeometry(.7, .07, 6, 20);
function shootWave(c) {
  const g = new T.Group(); scene.add(g);
  for (let i = 0; i < 3; i++) { const m = new T.Mesh(ringG, new T.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: .85, depthWrite: false })); m.rotation.y = Math.PI / 2; m.position.x = -i * .55; m.scale.setScalar(.6 + i * .25); g.add(m); }
  shots.push({ typ: 'fala', g, s: c.s + c.len / 2, z: c.z, lane: laneOf(c), y: 1.1 + c.y, vs: c.v + 22, left: 13, owner: c });
}
function miniBat() {
  const g = new T.Group();
  brPart(g, new T.SphereGeometry(.22, 8, 6), 0x1d1a24, 0, 0, 0, { s: [1.3, .9, .9], ol: .02 });
  for (const s of [-1, 1]) {
    const w = new T.Group(); w.position.z = s * .15; g.add(w);
    brPart(w, brExt([[.15, 0], [-.25, 0], [-.05, .5, 1]], .03, 0), 0x2a2233, 0, 0, 0, { r: [s * -Math.PI / 2, 0, 0], ol: .015 });
    g.userData[s > 0 ? 'w1' : 'w2'] = w;
    brPart(g, new T.SphereGeometry(.05, 5, 4), brMat(0xff2a2a, 'glow'), .25, .06, s * .09, { ol: 0 });
  }
  return g;
}
function swarm(c) {
  const tg = cars.filter(o => o !== c && !o.fin && o.s > c.s - 3 && o.s - c.s < 35).sort((a, b) => a.s - b.s).slice(0, 3);
  for (let i = 0; i < 8; i++) {
    const g = miniBat(); scene.add(g);
    shots.push({ typ: 'bat', g, s: c.s + rnd(-1, 1), z: c.z + rnd(-1, 1), lane: laneOf(c), y: 1.6 + c.y + rnd(0, 1), target: tg.length ? tg[i % tg.length] : null, t: 0, owner: c, ph: rnd(0, 6) });
  }
}
function stepShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const p = shots[i]; let done = false;
    if (p.typ === 'fala') {
      p.s += p.vs * dt; p.left -= (p.vs - p.owner.v) * dt; p.g.children.forEach(m => { m.scale.multiplyScalar(1 + dt * 1.2); m.material.opacity = clamp(p.left / 13, 0, 1) * .85; });
      for (const o of cars) if (o !== p.owner && laneOf(o) === p.lane && Math.abs(o.s - p.s) < o.len / 2 && o.y < 1.4 && !under(o)) { hit(o, p.owner); done = true; break; }
      for (const it of items) if (it.alive && it.lane === p.lane && ['twarda', 'skrzynia', 'miekka'].includes(it.rodzaj) && Math.abs(it.s - p.s) < 1) destroy(it, p.owner);
      if (p.left < 0) done = true;
      p.g.position.set(p.s - camS, H(p.s) + p.y, p.z);
    } else {
      p.t += dt; const o = p.target;
      if (o && !o.fin && p.t > .25) {
        const k = Math.min(1, dt * 4);
        p.s += (p.owner.v + 20) * dt * Math.sign(o.s - p.s) * Math.min(1, Math.abs(o.s - p.s) / 2 + .2); p.y += (o.y + 1.2 - p.y) * k; p.z += (o.z - p.z) * k;
        if (Math.abs(o.s - p.s) < 1 && Math.abs(o.z - p.z) < 1) { if (hit(o, p.owner, 'pop')) bubble('PIK!', o, 'small'); done = true; }
      } else { p.s += (p.owner.v + 14) * dt; p.y += dt * (p.t > .25 ? 2 : 0); }
      if (p.t > 2.2) done = true;
      const f = Math.sin(p.t * 30 + p.ph) * .9; p.g.userData.w1.rotation.x = f; p.g.userData.w2.rotation.x = -f;
      p.g.position.set(p.s - camS, H(p.s) + p.y + Math.sin(p.t * 9 + p.ph) * .15, p.z);
    }
    if (done) { scene.remove(p.g); shots.splice(i, 1); }
  }
}
// Moment trafienia (ok. 1/3 animacji)
function resolveAct(c) {
  if (state === 'menu') return;
  const k = c.kind, loud = near(c);
  if (c.act === 'atak') {
    if (loud) snd(SND_ATAK[k]);
    bubble(WORD_ATAK[k], c, 'big');
    if (k === 'rekin') c.lungeT = .4;                       // rekin rzuca się do przodu z otwartą paszczą
    if (k === 'ptak') for (let i = 0; i < 5; i++) part({ s: c.s + c.len / 2 + 1, y: 1.2 + c.y, z: c.z, vs: rnd(-2, 4), vy: rnd(1, 4), vz: rnd(-2, 2), col: pick([0xf06a14, 0xb5651d, 0xe2a417]), size: .15, life: .8, grav: 1, box: 1 });
    if (k === 'osmiornica') newItem({ typ: 'tusz', s: c.s - c.len / 2 - 3, lane: laneOf(c), rodzaj: 'tusz', len: 4, hitBy: new Set([c]), owner: c, ttl: 5 });
    if (k === 'nietoperz') { shootWave(c); return; }
    if (k === 'zaba') {                                    // język: trafia cel, po drodze zjada gwiazdki i skrzynie, żaba podciąga się do przodu
      if (c.tgt && inReach(c, c.tgt)) hit(c.tgt, c);
      for (const it of items) if (it.alive && (it.rodzaj === 'gwiazda' || it.rodzaj === 'skrzynia') && Math.abs(it.lane - laneOf(c)) <= 1 && it.s > c.s && it.s - c.s < 8.5 && !it.move) {
        if (it.rodzaj === 'gwiazda') { it.alive = false; sparkle(it.s, 1.2, LANES[it.lane]); addMoc(c, 1); } else destroy(it, c);
      }
      c.lungeT = .25; return;
    }
    for (const o of cars) if (inReach(c, o)) hit(o, c, k === 'osmiornica' ? 'tusz' : null);
    for (const it of items) if (itemInReach(c, it)) destroy(it, c);
  } else {
    if (loud) snd(SND_MOC[k]);
    bubble(WORD_MOC[k], c, 'big');
    if (k === 'rekin') for (let i = 0; i < 12; i++) part({ s: c.s, y: .2, z: c.z + rnd(-1, 1), vs: rnd(-3, 6), vy: rnd(3, 7), vz: rnd(-2, 2), col: 0x6b6560, size: .22, life: .7, grav: 1, box: 1 });
    if (k === 'osmiornica') {                              // macka łapie najbliższe auto obok i ciągnie je w tył, sama strzela do przodu
      const t = cars.filter(o => o !== c && !o.fin && Math.abs(laneOf(o) - laneOf(c)) <= 1 && Math.abs(o.s - c.s) < 9 && !immune(o))
        .sort((a, b) => Math.abs(a.s - c.s) - Math.abs(b.s - c.s))[0];
      c.b.p.grab = c.b.p.tent[t && laneOf(t) < laneOf(c) ? 0 : 3];
      if (t && hit(t, c, 'macka')) { t.s -= 5; t.v *= .3; }
      c.turboT = Math.max(c.turboT, 1.8);
    }
    if (k === 'nietoperz') swarm(c);
  }
}
// Moc trwa: rekin pod asfaltem podrzuca auta, ptak zrzuca jajka, krab w kolcach taranuje
function mocTick(c, dt) {
  if (state === 'menu') return;
  if (c.kind === 'rekin' && Math.random() < dt * 35) part({ s: c.s + rnd(-1, 2), y: .2, z: c.z + rnd(-.9, .9), vs: rnd(-2, 2), vy: rnd(2, 4), col: TH.road === 0x7f98ad ? 0xffffff : 0x6b6560, size: .16, life: .5, grav: 1, box: 1 });
  if (c.kind === 'ptak' && c.at > .4 && (c.eggT -= dt) < 0) {
    c.eggT = .4;
    const m = brPart(scene, new T.SphereGeometry(.28, 10, 8), 0xfffbea, 0, 0, 0, { s: [1, 1.3, 1], ol: .02 });
    eggs.push({ m, s: c.s - .5, y: c.ya + .8, vy: 0, z: c.z, lane: laneOf(c), owner: c, vs: c.v * .55 });
    if (near(c)) snd('jajo');
  }
  if (c.kind === 'krab' && Math.random() < dt * 12) sparkle(c.s, 1.2, c.z);
  if (c.kind === 'zaba' && !c.landed && c.at > MOC_T.zaba - .3) {   // lądowanie ze szczudeł: ŁUBUDU! podrzuca auta obok
    c.landed = true;
    for (const o of cars) if (o !== c && Math.abs(laneOf(o) - laneOf(c)) <= 1 && Math.abs(o.s - c.s) < 4.5) hit(o, c, 'pop');
    for (const it of items) if (it.alive && ['twarda', 'skrzynia', 'miekka'].includes(it.rodzaj) && Math.abs(it.lane - laneOf(c)) <= 1 && Math.abs(it.s - c.s) < 3.5) destroy(it, c);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; part({ s: c.s, y: .3, z: c.z, vs: Math.cos(a) * 7, vy: 1.5, vz: Math.sin(a) * 4, col: 0xd9c39a, size: .35, life: .6, grow: 1.5, op: .7 }); }
    if (near(c)) { snd('lubudu'); bubble('ŁUBUDU!', c, 'big'); if (c.player || Math.abs(P.s - c.s) < 8) shake = .45; }
  }
  if (c.kind === 'rekin' || c.kind === 'krab') for (const o of cars) {
    if (o === c || immune(o) || o.y > 1.4) continue;
    const dl = Math.abs(laneOf(o) - laneOf(c)), gap = Math.abs(o.s - c.s) - (c.len + o.len) / 2;
    if ((dl === 0 && gap < .2) || (c.kind === 'krab' && dl === 1 && Math.abs(o.s - c.s) < 2.5))
      if (hit(o, c, 'pop')) o.s += Math.sign(o.s - c.s || 1) * 2.5;
  }
}
function stepEggs(dt) {
  for (let i = eggs.length - 1; i >= 0; i--) {
    const e = eggs[i]; e.vy -= 20 * dt; e.y += e.vy * dt; e.s += e.vs * dt;
    e.m.position.set(e.s - camS, e.y, e.z); e.m.rotation.z += dt * 6;
    if (e.y > H(e.s) + .2) continue;
    scene.remove(e.m); eggs.splice(i, 1);
    newItem({ typ: 'jajo', s: e.s, lane: e.lane, rodzaj: 'jajo', len: 2.2, hitBy: new Set([e.owner]), owner: e.owner, ttl: 3 });
    for (let k = 0; k < 6; k++) part({ s: e.s, y: .3, z: e.z, vs: rnd(-3, 3), vy: rnd(2, 5), vz: rnd(-2, 2), col: k % 2 ? 0xffc21a : 0xffffff, size: .14, life: .6, grav: 1 });
    if (Math.abs(e.s - camS) < 16) snd('chlup');
  }
}
// Najazd na przedmiot na pasie
function touch(c, it) {
  if (it.hitBy.has(c)) return; it.hitBy.add(c);
  const shield = spiky(c);
  switch (it.rodzaj) {
    case 'gwiazda': it.alive = false; sparkle(it.s, it.y + 1.2, LANES[it.lane]); addMoc(c, 1); break;
    case 'twarda': if (!immune(c)) hit(c, null); destroy(it, shield ? c : null); break;
    case 'skrzynia': destroy(it, c); if (!shield) c.v *= .85; break;
    case 'miekka': destroy(it, null); if (!shield) c.v *= .9; break;
    case 'slisko': if (!shield && !immune(c) && c.y < .1) { c.slipT = 1; c.spinT = c.spinD = 1; if (near(c)) { snd('poslizg'); bubble('ŚLIIIZG!', c, 'small'); } } break;
    case 'lawa': if (!shield) hit(c, null, 'lawa'); break;
    case 'rampa': if (c.y < .1) { c.vy = Hd(c.s) * c.v + 9.5; if (c.player) { snd('skok'); bubble('HOP!', c, 'small'); } } break;
    case 'turbo': c.turboT = Math.max(c.turboT, 1.3); if (c.player) { snd('turbo'); bubble('WRUUM!', c, 'small'); } break;
    case 'tusz': case 'jajo': if (!shield) hit(c, it.owner, it.rodzaj); break;
  }
}

/* ---------- komputer ---------- */
function aiThink(c) {
  const D = DIFF[diff], L = laneOf(c);
  const hazard = (l, a, b) => items.some(it => it.alive && it.lane === l && HAZ.includes(it.rodzaj) && it.owner !== c && it.s - c.s > a && it.s - c.s < b);
  const carIn = l => cars.some(o => o !== c && laneOf(o) === l && Math.abs(o.s - c.s) < (o.len + c.len) / 2 + 1);
  const free = l => l >= 0 && l < 4 && !hazard(l, -2, D.look) && !carIn(l);
  if (hazard(L, 0, D.look)) {
    const it = items.find(it => it.alive && it.lane === L && it.rodzaj === 'twarda' && it.s > c.s && itemInReach(c, it));
    if (it && c.atakCd <= 0 && Math.random() < .6) { act(c, 'atak'); return; }
    if (c.moc >= 3 && ['rekin', 'ptak', 'krab', 'zaba'].includes(c.kind) && Math.random() < .5) { act(c, 'moc'); return; }
    if (Math.random() < D.react) { const o = [L - 1, L + 1].filter(free); if (o.length) setLane(c, pick(o)); }
    return;
  }
  const tgt = cars.find(o => inReach(c, o) && !immune(o));
  if (tgt && c.atakCd <= 0 && Math.random() < (tgt.player ? D.aggroP : D.aggro)) { act(c, 'atak'); return; }
  if (c.moc >= 3) {
    const useful = c.kind === 'osmiornica' ? cars.some(o => o !== c && !o.fin && Math.abs(laneOf(o) - L) <= 1 && Math.abs(o.s - c.s) < 8)
      : c.kind === 'krab' ? cars.some(o => o !== c && Math.abs(laneOf(o) - L) <= 1 && Math.abs(o.s - c.s) < 6)
      : c.kind === 'nietoperz' ? cars.some(o => o !== c && !o.fin && o.s > c.s && o.s - c.s < 30)
      : c.kind === 'zaba' ? cars.some(o => o !== c && Math.abs(laneOf(o) - L) <= 1 && Math.abs(o.s - c.s) < 10)
      : cars.some(o => o !== c && laneOf(o) === L && o.s > c.s && o.s - c.s < 14) || Math.random() < .1;
    if (useful && Math.random() < .5) { act(c, 'moc'); return; }
  }
  const good = l => items.some(it => it.alive && it.lane === l && ['gwiazda', 'turbo', 'skrzynia', 'rampa'].includes(it.rodzaj) && !it.y && it.s - c.s > 3 && it.s - c.s < 18);
  if (!good(L) && Math.random() < D.react * .5) { const o = [L - 1, L + 1].filter(l => free(l) && good(l)); if (o.length) { setLane(c, pick(o)); return; } }
  if (Math.random() < D.aggro * .3) {                       // poluje: zmienia pas na auto przed sobą
    const pr = cars.find(o => o !== c && !o.fin && o.s > c.s && o.s - c.s < 10 && Math.abs(laneOf(o) - L) === 1);
    if (pr && free(laneOf(pr))) { setLane(c, laneOf(pr)); return; }
  }
  if (c.turboCd <= 0 && Math.random() < D.turbo && !hazard(L, 0, 25)) turbo(c);
}

/* ---------- ruch aut ---------- */
const place = c => 1 + cars.filter(o => o !== c && (o.fin && (!c.fin || o.finT < c.finT) || (!o.fin && !c.fin && o.s > c.s))).length;
function stepCar(c, dt, racing) {
  for (const k of ['atakCd', 'turboCd', 'turboT', 'hitT', 'blinkT', 'spinT', 'slipT', 'lungeT', 'bonkT', 'ghostT']) c[k] -= dt;
  if (racing && !c.fin && (c.mocFill += dt) > MOC_FILL) { c.mocFill = 0; addMoc(c, 1); }
  if (c.act) {
    c.at += dt; const d = c.act === 'atak' ? ATAK_T : MOC_T[c.kind];
    if (!c.done && c.at > (c.act === 'atak' ? .22 : .2)) { c.done = true; resolveAct(c); }
    if (c.act === 'moc') mocTick(c, dt);
    if (c.at >= d) c.act = null;
  }
  let vt = 0;
  if (racing) {
    vt = CRUISE * (c.player ? 1 : DIFF[diff].cruise);
    if (!c.player && !c.fin && c.s < LEN * .85) vt *= 1 + clamp((P.s + c.ai.gap - c.s) * DIFF[diff].band, -.3, .35);
    if (c.player && !c.fin && place(c) === 4) vt *= 1.1;                 // ostatni dostaje lekkie wsparcie
    if (c.fin) vt *= .7;
    if (c.turboT > 0) vt *= 1.5;
    if (mocOn(c)) vt *= MOC_V[c.kind];
    if (c.hitT > 0) vt *= .4;
    if (c.slipT > 0) vt *= .65;
    if (c.lungeT > 0) vt += 14;
    if (c.y < .1) vt *= 1 - clamp(Hd(c.s), -.3, .3) * .4;              // pod górkę trochę wolniej, z górki szybciej
  }
  const acc = vt > c.v ? (c.turboT > 0 || c.lungeT > 0 ? 16 : 7) : 18;
  c.v += clamp(vt - c.v, -acc * dt, acc * dt); c.s += c.v * dt;
  // zmiana pasa; gdy obok jedzie auto — tylko odbicie z powrotem, bez kary
  const pz = c.z; c.z += (LANES[c.lane] - c.z) * Math.min(1, dt * 9);
  if (racing && Math.abs(LANES[c.lane] - c.z) > .3 && !spiky(c) && !under(c)) {
    const dir = Math.sign(LANES[c.lane] - c.z);
    const o = c.ghostT <= 0 && cars.find(o => o !== c && o.ghostT <= 0 && !under(o) && !high(o) && !high(c) && Math.abs(o.s - c.s) < (c.len + o.len) / 2 - .5 && Math.sign(o.z - c.z) === dir && Math.abs(o.z - c.z) < PAS * .75 && Math.abs(o.y - c.y) < 1.2);
    if (o) {
      if (spiky(o)) hit(c, o, 'pop');
      else { c.lane = laneOf({ z: c.z - dir * PAS * .45 }); if (c.bonkT <= 0 && c.player) { c.bonkT = .5; snd('bonk'); } }   // brak miejsca: wracam na swój pas
    }
  }
  c.tilt = clamp((c.z - pz) / Math.max(dt, 1e-3) * -.025, -.15, .15);
  // pion: wysokość bezwzględna ya; na ziemi auto trzyma się drogi, na grzbiecie górki samo wyskakuje
  const gy = H(c.s), sl = Hd(c.s);
  if (mocOn(c) && c.kind === 'ptak') { c.ya += (gy + 1.9 - c.ya) * Math.min(1, dt * 4); c.vy = 0; }
  else {
    c.vy -= G * dt; c.ya += c.vy * dt;
    if (c.ya <= gy) {
      const rel = c.vy - sl * c.v;
      if (rel < -5 && near(c) && racing) { snd('lad'); for (let i = 0; i < 5; i++) puff(c.s + rnd(-2, 2), .2, c.z + rnd(-1, 1), 0xd9c39a, .3, 1); }
      c.ya = gy; c.vy = sl * c.v;
    }
  }
  const wasAir = c.y > .35; c.y = c.ya - gy;
  if (!wasAir && c.y > .35 && c.player && racing && !mocOn(c)) bubble('HOP!', c, 'small');
  if (racing && !c.fin && c.s >= LEN) { c.fin = true; c.finT = raceT; finOrder.push(c); if (c.player) finish(); }
  if (racing && !c.player && !c.fin) {
    if ((c.ai.gapT -= dt) < 0) { c.ai.gapT = rnd(3, 7); c.ai.gap = rnd(...DIFF[diff].gap); }
    if ((c.ai.t -= dt) < 0) { c.ai.t = DIFF[diff].think * rnd(.7, 1.3); aiThink(c); }
  }
  // przedmioty pod kołami
  if (racing && !under(c)) {
    const L = laneOf(c), hi = high(c);
    for (const it of items) if (it.alive && it.rodzaj && (!hi || it.rodzaj === 'gwiazda') && it.move?.type !== 'swing' && it.move?.type !== 'fall' && it.lane === L && Math.abs(it.s - c.s) < (c.len + it.len) / 2 && Math.abs(c.z - (it.z ?? LANES[it.lane])) < 1.2
      && (it.rodzaj === 'gwiazda' ? Math.abs(c.y - it.y) < 1.5 : c.y < .9)) touch(c, it);
  }
}
// Auta na tym samym pasie się odbijają: tylne zwalnia
function collide() {
  for (const a of cars) for (const o of cars) {
    if (a === o || a.ghostT > 0 || o.ghostT > 0 || a.s > o.s || Math.abs(a.z - o.z) > 1.6 || Math.abs(a.y - o.y) > 1.2) continue;
    if (under(a) || under(o) || spiky(a) || spiky(o) || high(a) || high(o)) continue;   // te zderzenia liczy mocTick / żaba nad autami
    const ov = (a.len + o.len) / 2 - (o.s - a.s);
    if (ov > 0) {
      a.s -= ov * .7; o.s += ov * .3; a.v = Math.min(a.v, o.v * .95);
      if (ov > .3 && a.bonkT <= 0 && near(a)) { a.bonkT = .5; puff((a.s + o.s) / 2, 1, a.z, 0xffffff, .3, 1.5); snd('bonk'); }
    }
  }
}
// Wygląd: poza z osi czasu akcji, pochylenie na górce, obrót po trafieniu, mruganie
function drawCar(c, dt) {
  let pose = 'jazda', k = 0;
  if (c.spinT > 0 && c.hitT > 0) { pose = 'oberwal'; k = 1; }
  else if (c.act) {
    const d = c.act === 'atak' ? ATAK_T : MOC_T[c.kind];
    pose = c.act; k = c.act === 'atak' ? Math.min(1, c.at / .2, (d - c.at) / .3) : Math.min(1, c.at / .25, (d - c.at) / .3);
  }
  brykaPose(c.b, pose, clamp(k, 0, 1)); brykaTick(c.b, dt, c.v);
  const g = c.b.g, x = c.s - camS, gy = H(c.s);
  const pitch = c.y < .05 ? Math.atan(Hd(c.s)) : (mocOn(c) && c.kind === 'ptak') ? 0 : clamp(Math.atan2(c.vy, Math.max(c.v, 4)), -.45, .45);
  g.position.set(x, c.ya, c.z);
  g.rotation.set(c.tilt, c.spinT > 0 ? (1 - c.spinT / c.spinD) * Math.PI * 2 : 0, pitch);
  g.visible = !(c.blinkT > 0 && c.blinkT < BLINK_T - .2 && Math.floor(c.blinkT * 12) % 2);
  c.sh.position.set(x, gy + .03, c.z); c.sh.scale.set(c.b.len * .5 / (1 + c.y * .15), 1.3 / (1 + c.y * .15), 1);
  c.dz.visible = c.hitT > 0; c.dz.position.set(x, 2.6 + c.ya, c.z); c.dz.rotation.y += dt * 6;
  if (c.turboT > 0 && Math.random() < .8) part({ s: c.s - c.len / 2 - .3, y: 1 + c.y + rnd(0, .4), z: c.z + rnd(-.4, .4), vs: -6, vy: rnd(0, 1), col: pick([0xff7a1a, 0xffd23f, 0xff3a1a]), size: .22, life: .3, grow: 1, op: .9 });
  else if (c.v > 6 && c.y < .05 && Math.random() < dt * 5 && !under(c)) puff(c.s - c.len / 2, .3, c.z + rnd(-.5, .5));
}

/* ---------- silniki ---------- */
// Obroty z prostą skrzynią biegów: rosną w biegu, spadają przy zmianie
function rpmOf(v) {
  const fr = clamp(v / (CRUISE * 1.5), 0, 1.2), G4 = [0, .2, .42, .68, 1.2];
  let i = 1; while (i < 4 && fr > G4[i]) i++;
  return clamp(.25 + .75 * (fr - G4[i - 1]) / (G4[i] - G4[i - 1]), 0, 1);
}
function engines() {
  if (!AUD.ctx) return;
  const on = state === 'race' || state === 'count' || state === 'end';
  for (const c of ALL) {
    const V = audVoice(c.kind); if (!V) continue;
    if (!on || !cars.includes(c)) { V.set(.2, false, 0); continue; }
    const x = c.s - camS - PX, vol = c.player ? .11 : .07 * clamp(1 - Math.abs(x) / 22, 0, 1);
    const r = state === 'count' ? .25 + .5 * Math.abs(Math.sin(raceT * 3 + KINDS.indexOf(c.kind))) * (c.player ? 1 : .6) : rpmOf(c.v);
    V.set(r, c.turboT > 0, under(c) ? vol * .4 : vol, clamp(x / 14, -.8, .8));
  }
}

/* ---------- HUD ---------- */
let progIc = [], edges = [], lastPlace = 0;
function buildHud() {
  $('prog').querySelectorAll('span').forEach(e => e.remove()); $('edges').innerHTML = '';
  progIc = cars.map(c => { const s = document.createElement('span'); s.innerHTML = img(c.kind); s.classList.toggle('me', c === P); $('prog').append(s); return s; });
  edges = cars.map(() => { const d = document.createElement('div'); d.className = 'edge'; d.hidden = true; $('edges').append(d); return d; });
}
function hud() {
  cars.forEach((c, i) => { progIc[i].style.left = clamp(c.s / LEN, 0, 1) * 100 + '%'; });
  const pl = place(P); if (pl !== lastPlace) { $('place').textContent = ['🥇', '🥈', '🥉', '4️⃣'][pl - 1]; $('place').classList.add('pop'); setTimeout(() => $('place').classList.remove('pop'), 200); lastPlace = pl; }
  cars.forEach((c, i) => {                               // auta poza ekranem: strzałka przy krawędzi
    const x = c.s - camS, e = edges[i], [X] = toScreen(x, 1, c.z), out = c !== P && (X < 30 || X > innerWidth - 30);
    e.hidden = !out; if (e.hidden) return;
    const [, Y] = toScreen(0, 1, c.z), right = x > 0;
    e.innerHTML = right ? `${img(c.kind)}<b>▶</b>` : `<b>◀</b>${img(c.kind)}`;
    e.style.left = (right ? innerWidth - 150 : 150) + 'px'; e.style.top = Y + 'px';
  });
  $('bAtak').querySelector('.cd').style.height = clamp(P.atakCd / ATAK_CD, 0, 1) * 100 + '%';
  $('bTurbo').querySelector('.cd').style.height = clamp(P.turboCd / TURBO_CD, 0, 1) * 100 + '%';
  [...$('bMoc').querySelectorAll('.pips b')].forEach((b, i) => b.classList.toggle('on', P.moc > i));
  $('bMoc').classList.toggle('full', P.moc >= 3 && !P.act);
}

/* ---------- przebieg: menu → odliczanie → wyścig → wyniki ---------- */
function clearRace() { flyers.forEach(f => world.remove(f.g)); flyers.length = 0; SEGS = []; items = []; eggs.forEach(e => scene.remove(e.m)); eggs = []; shots.forEach(p => scene.remove(p.g)); shots = []; HILLS = []; finOrder = []; }
function menuLayout() {
  clearRace(); setTheme(SET.trasa); camS = 0; lineup();
  cars.forEach((c, i) => { resetCar(c, i, i); c.s = -14 + i * 3.6; });           // auta po lewej, karta menu po prawej
}
function buildMenu() {
  $('pickCar').innerHTML = KINDS.map(k => `<button class="btn pick car" data-k="${k}">${img(k)}${NAZWY[k]}</button>`).join('');
  $('pickTrack').innerHTML = TRASY_KEYS.map(k => `<button class="btn pick" data-t="${k}"><span class="ico">${TRASY[k].ic}</span>${NAZWY[k]}${SET.best[k + diff] ? `<span class="med">${['🥇', '🥈', '🥉', '🏅'][SET.best[k + diff] - 1]}</span>` : ''}</button>`).join('');
  [...$('pickCar').children].forEach(b => b.classList.toggle('on', b.dataset.k === SET.car));
  [...$('pickTrack').children].forEach(b => b.classList.toggle('on', b.dataset.t === SET.trasa));
  [...$('pickDiff').children].forEach(b => b.classList.toggle('on', b.dataset.d === diff));
  $('bSnd').textContent = AUD.on ? '🔊' : '🔇';
}
// Karta menu zawsze mieści się na ekranie (niski telefon z paskiem przeglądarki): zmniejszamy ją w całości
function fitMenu() {
  const c = document.querySelector('#menu .card'); if (!c || $('menu').hidden) return;
  c.style.transform = ''; const k = Math.min(1, (innerHeight - 14) / c.offsetHeight, (innerWidth - 20) / c.offsetWidth);
  c.style.transform = `scale(${k.toFixed(3)})`;
}
addEventListener('resize', () => setTimeout(fitMenu, 50));
function showMenu() {
  state = 'menu'; ['hud', 'end', 'pause'].forEach(id => $(id).hidden = true); $('menu').hidden = false; $('confetti').innerHTML = '';
  menuLayout(); buildMenu(); fitMenu();
}
function startRace() {
  audInit(); snd('klik');
  obrotPelny();
  clearRace(); setTheme(SET.trasa); if (P.kind !== SET.car) lineup();
  const lanes = [1, 0, 2]; let li = 0;
  cars.forEach((c, i) => resetCar(c, i, c === P ? 3 : lanes[li++]));
  items = genTrack(TH);
  newItem({ typ: 'start', s: 0, lane: 1, rodzaj: '', len: 0, zMid: true }); newItem({ typ: 'meta', s: LEN, lane: 1, rodzaj: '', len: 0, zMid: true });
  $('bMoc').querySelector('.i').textContent = MOC_IC[P.kind];
  camS = P.s - PX; raceT = 0; lastPlace = 0; shake = 0;
  $('menu').hidden = true; $('end').hidden = true; $('hud').hidden = false; $('confetti').innerHTML = '';
  state = 'count'; countT = 3.2; $('count').hidden = false; $('count').textContent = '';
}
function finish() { state = 'end'; endT = 2.4; snd('meta'); bubble('META!', P, 'big'); }
function showEnd() {
  state = 'done';
  const order = [...finOrder, ...cars.filter(c => !c.fin).sort((a, b) => b.s - a.s)], pl = order.indexOf(P) + 1;
  const key = SET.trasa + diff; if (!SET.best[key] || pl < SET.best[key]) SET.best[key] = pl; save();
  const med = ['🥇', '🥈', '🥉', '🏅'], show = [1, 0, 2, 3].map(i => order[i]);   // podium: 2 · 1 · 3 · 4
  $('podium').innerHTML = show.map((c, j) => { const i = order.indexOf(c); return `<div class="${c === P ? 'me' : ''}" style="padding-top:${[22, 40, 10, 2][j]}px">${img(c.kind)}<b>${med[i]}</b></div>`; }).join('');
  $('hud').hidden = true; $('end').hidden = false;
  const cf = $('confetti'); cf.innerHTML = '';
  for (let i = 0; i < (pl === 1 ? 40 : 18); i++) { const d = document.createElement('i'); d.textContent = pick(pl === 1 ? ['🎉', '⭐', '🏆', '✨'] : ['⭐', '✨', '🎈']); Object.assign(d.style, { left: rnd(0, 100) + '%', animationDuration: rnd(2, 4) + 's', animationDelay: rnd(0, 1.5) + 's' }); cf.append(d); }
}

/* ---------- sterowanie ---------- */
function lane(d) { if (state !== 'race' || P.fin) return; if (setLane(P, P.lane + d)) snd('klik'); }
function press(a) {
  if (state !== 'race' || P.fin) return;
  if (a === 'up') lane(-1); else if (a === 'dn') lane(1);
  else if (a === 'turbo') turbo(P);
  else if (a === 'moc') { if (!act(P, 'moc') && P.moc < 3) bubble('⭐?', P, 'emoji'); }
  else if (a === 'trab') snd('klakson_' + P.kind);
  else act(P, 'atak');
}
const BTN = { bUp: 'up', bDn: 'dn', bAtak: 'atak', bMoc: 'moc', bTurbo: 'turbo' };
for (const id in BTN) {
  const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); audInit(); b.classList.add('dn'); press(BTN[id]); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => b.classList.remove('dn'));
}
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'dn', KeyS: 'dn', Space: 'atak', KeyX: 'atak', KeyZ: 'moc', KeyC: 'moc', ShiftLeft: 'turbo', ShiftRight: 'turbo', KeyB: 'turbo', KeyH: 'trab' };
addEventListener('keydown', e => {
  if (KEYS[e.code] && !e.repeat) { e.preventDefault(); press(KEYS[e.code]); }
  if (e.code === 'Escape' && state === 'race') pause(true);
  if (e.code === 'Enter' && state === 'menu') startRace();
});
let swipe = null;                                         // przesunięcie palcem po drodze w górę/dół = zmiana pasa; stuknięcie = klakson
$('c').addEventListener('pointerdown', e => { audInit(); swipe = { y: e.clientY, id: e.pointerId, t: performance.now(), moved: false }; });
$('c').addEventListener('pointermove', e => { if (swipe && e.pointerId === swipe.id && Math.abs(e.clientY - swipe.y) > 35) { lane(e.clientY < swipe.y ? -1 : 1); swipe.y = e.clientY; swipe.moved = true; } });
addEventListener('pointerup', e => {
  if (swipe && !swipe.moved && performance.now() - swipe.t < 300 && e.target === $('c')) { if (state === 'race') press('trab'); else if (state === 'menu') snd('klakson_' + P.kind); }
  swipe = null;
});
$('pickCar').addEventListener('pointerdown', e => {
  const b = e.target.closest('button'); if (!b) return; audInit();
  SET.car = b.dataset.k; save(); menuLayout(); buildMenu();
  act(P, Math.random() < .5 ? 'atak' : 'moc');
});
$('pickTrack').addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; audInit(); snd('klik'); SET.trasa = b.dataset.t; save(); menuLayout(); buildMenu(); });
$('pickDiff').addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; audInit(); snd('klik'); diff = SET.diff = b.dataset.d; save(); buildMenu(); });
$('bGo').onclick = startRace;
$('bSnd').onclick = () => { audInit(); audMute(!AUD.on); buildMenu(); };
let pausedFrom = 'race';
function pause(on) { if (on && state !== 'race' && state !== 'count') return; if (on) { pausedFrom = state; state = 'pause'; } else state = pausedFrom; $('pause').hidden = !on; engines(); }
$('bPause').onclick = () => pause(true);
$('bResume').onclick = () => pause(false);
$('bQuit').onclick = showMenu;
$('bAgain').onclick = startRace;
$('bNext').onclick = () => { SET.trasa = TRASY_KEYS[(TRASY_KEYS.indexOf(SET.trasa) + 1) % TRASY_KEYS.length]; save(); startRace(); };
$('bHome').onclick = showMenu;
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });

/* ---------- pętla ---------- */
let prev = performance.now(), menuT = 0;
function step(dt) {
  if (state === 'pause') return;
  const racing = state === 'race' || state === 'end' || state === 'done';
  if (state === 'count') {
    const n = Math.ceil(countT - .2); countT -= dt; raceT += dt;
    const m = Math.ceil(countT - .2), el = $('count');
    if (m !== n || !el.textContent) {
      if (m > 0) { el.className = ''; el.textContent = ['🟢', '🟡', '🔴'][m - 1] + m; snd('beep'); }
      else { el.textContent = '🏁'; el.className = 'go'; snd('start'); state = 'race'; raceT = 0; setTimeout(() => { el.hidden = true; el.textContent = ''; }, 700); }
    }
  }
  if (racing) raceT += dt;
  for (const c of cars) stepCar(c, dt, racing);
  if (racing) { collide(); stepEggs(dt); stepShots(dt); stepMovers(dt); }
  if (state === 'menu') {                                  // menu: wybrane auto podskakuje
    menuT += dt; P.ya = P.y = Math.abs(Math.sin(menuT * 4)) * .5; P.vy = 0;
    camS = 0;
  } else camS += (P.s - PX - camS) * Math.min(1, dt * 5);
  if (state === 'end' && (endT -= dt) < 0) showEnd();
  placeDeco(); syncItems(dt); stepParts(dt);
  for (const c of cars) drawCar(c, dt);
  const tg = state === 'race' && !P.fin ? cars.filter(o => inReach(P, o) && !immune(o)) : [];   // celownik i świecący przycisk ataku
  aims.forEach((m, i) => { const o = tg[i]; m.visible = !!o && P.atakCd <= 0; if (o) { m.position.set(o.s - camS, H(o.s) + .06, o.z); m.scale.setScalar(1 + .12 * Math.sin(performance.now() / 90)); } });
  $('bAtak').classList.toggle('hot', tg.length > 0 && P.atakCd <= 0);
  marker.visible = state !== 'menu' && state !== 'done';
  marker.position.set(P.s - camS, P.ya + 3.4 + Math.abs(Math.sin(performance.now() / 180)) * .4, P.z); marker.rotation.y += dt * 3;
  shake = Math.max(0, shake - dt);
  camY += (H(P.s + 4) * .6 - camY) * Math.min(1, dt * 3);   // kamera lekko podąża za górką
  cam.position.copy(camBase).add(V3.set(rnd(-1, 1) * shake * .5, camY + rnd(-1, 1) * shake * .5, 0));
  if (state !== 'menu' && state !== 'done') hud();
  engines();
}
function frame(now) {
  const dt = Math.min(.05, (now - prev) / 1000); prev = now;
  step(dt); renderer.render(scene, cam); requestAnimationFrame(frame);
}
showMenu();
requestAnimationFrame(frame);
