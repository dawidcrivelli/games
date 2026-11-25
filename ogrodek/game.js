'use strict';
// Łakome Zwierzaki — obrona ogródka: sadzisz rośliny na grządkach 9×5, zwierzaki z lasu (z prawej) przychodzą je zjeść.
// Stuknij zwierzaka — ręka dziadka z widłami spada z nieba i go szturcha; dziadek sam też goni i zbiera plony.
// ?test — bez pętli rAF (testy: TEST.step(s), TEST.render()); ?lite — tryb słabej grafiki; ?zw=cow,beaver — te zwierzaki od razu.
if (!window.THREE) { $('err').style.display = 'grid'; $('menu').hidden = true; throw new Error('brak three.js'); }

const Q = new URLSearchParams(location.search), IS_TEST = Q.has('test');
const COLS = 9, ROWS = 5, TS = 2, X0 = -COLS*TS/2, Z0 = -ROWS*TS/2;
const cxOf = c => X0 + TS*(c + .5), czOf = r => Z0 + TS*(r + .5);
const SPAWN_X = 15, EXIT_X = -16, PORCH = { x: -10.7, z: 2.2 };
const V3 = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
seed = 2024;

/* =====================================================================
   RENDERER, SCENA, ŚWIATŁO (słaba grafika: SwiftShader / ?lite — bez cieni, mniej pikseli)
   ===================================================================== */
const GL_NAME = (() => { try { const g = document.createElement('canvas').getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { return ''; } })();
const LITE = !Q.has('hq') && (Q.has('lite') || /swiftshader|llvmpipe|software/i.test(GL_NAME));   // ?hq — pełna grafika także w teście (zrzut jak na telefonie)
const renderer = new T.WebGLRenderer({ canvas: $('c'), antialias: !LITE, powerPreference: 'high-performance' });
renderer.setPixelRatio(LITE ? (IS_TEST ? 1 : .6) : Math.min(devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = !LITE; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene(); scene.fog = new T.Fog(0xcfe8f3, 70, 260);
const camera = new T.PerspectiveCamera(34, 1, .5, 900); scene.add(camera);
const hemi = new T.HemisphereLight(0xdff1ff, 0x7d7040, .6); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff1d0, .75); sun.castShadow = !LITE; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 14, bottom: -14, near: 1, far: 120 }); sun.shadow.bias = -.0006;
scene.add(sun, sun.target); sun.target.position.set(0, 0, 0);
const SUN_DIR = V3(26, 46, 20);
ZOO.cfg.cast = !LITE;

/* ---------- paleta (modele „miasta”: traktor, dom) ---------- */
const grassTex = tex(256, 256, (g, w, h) => { g.fillStyle = '#6fae4c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4200; i++) { g.strokeStyle = ['#5f9e42', '#7cbc58', '#548f3a', '#8bc864'][i & 3]; g.globalAlpha = .55; const x = rnd()*w, y = rnd()*h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2, 2), y - rr(2, 6)); g.stroke(); } }, 60, 60);
const soilTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#8a5a32'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(60,35,15,.35)'; g.fillRect(0, r*32 + 20, w, 7); g.fillStyle = 'rgba(190,140,90,.35)'; g.fillRect(0, r*32 + 8, w, 6); }
  for (let i = 0; i < 900; i++) { g.fillStyle = ['#6e4424', '#a5703f', '#5a3a1e', '#b88452'][i & 3]; g.globalAlpha = .6; g.fillRect(rnd()*w, rnd()*h, rr(2, 5), rr(1, 3)); } });
const woodTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#c98a4a'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) { g.fillStyle = ['#b87a3e', '#d39552', '#c2843f', '#cf9150'][(y/16) & 3]; g.fillRect(0, y + 1, w, 14); g.fillStyle = '#7a4a22'; g.fillRect(0, y, w, 1.5); } }, 2, 1);
const M = {
  tire: pho(0x1f1d1c, { roughness: .93, metalness: 0, envMapIntensity: .25 }), dark: lam(0x2e3034), steel: pho(0x8f989f, { metalness: .7, roughness: .38 }), steelL: pho(0xc7ced3, { metalness: .7, roughness: .3 }),
  chrome: pho(0xe6eaee, { metalness: .95, roughness: .12 }), cRed: pho(0xd8301f), cYel: pho(0xf5c41f), uRed: pho(0xdc452a), uRedD: pho(0xb0351f), uGray: pho(0x5f6367), uGrayD: pho(0x3d4144), uCream: pho(0xeee2c4),
  skin: lam(0xf1c7a0), hat: lam(0xe8c56a), shirt: lam(0x3c8a4a), pants: lam(0x34446a), hair: lam(0x4a3524), boot: lam(0x2a221c), seat: lam(0x23201e), flagR: lam(0xdc143c),
  lamp: new T.MeshBasicMaterial({ color: 0xfff3b0 }), red: new T.MeshBasicMaterial({ color: 0xd81f1f }), amber: new T.MeshBasicMaterial({ color: 0xff9a1a }),
  gaugeW: new T.MeshBasicMaterial({ color: 0xf6f2e2 }), gaugeR: new T.MeshBasicMaterial({ color: 0xe23b2b }), gaugeG: new T.MeshBasicMaterial({ color: 0x49c24f }),
  uPlate: lam(0xffffff, { map: tex(192, 64, (g, w, h) => { g.fillStyle = '#f7f7f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d3f9c'; g.fillRect(0, 0, 22, h); g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#111'; g.font = 'bold 40px Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('OGR 0D3K', 30, h/2 + 2); }) }),
  badge: lam(0xffffff, { map: tex(160, 48, (g, w, h) => { g.fillStyle = '#eee2c4'; g.fillRect(0, 0, w, h); g.fillStyle = '#b0351f'; g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#eee2c4'; g.font = 'bold 32px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C-330', w/2, h/2 + 2); }) }),
  grass: lam(0xffffff, { map: grassTex }), soil: lam(0xffffff, { map: soilTex }), soilD: lam(0xd8c8b8, { map: soilTex }), soilEdge: lam(0x6e4626),
  wood: lam(0xffffff, { map: woodTex }), woodD: lam(0x8a5a2e), wall: lam(0xfff4df), roof: lam(0xc8402c), roofD: lam(0x8e2a1c), door: lam(0x7a4a22), winF: lam(0xffffff),
  win: pho(0x35506e, { roughness: .1, metalness: .4, emissive: 0x000000 }), barn: lam(0xb8382a), hill: lam(0x7fb85a), hill2: lam(0x6aa64c), path: lam(0xd9b98a),
  cloud: new T.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: .93 }),
};

/* =====================================================================
   NIEBO I PORA DNIA (lib/3d/sky.js + weather.js): rano różowo, w południe słońce, deszcz, złote popołudnie, zachód
   ===================================================================== */
const WEATHERS = {
  dawn:   { top: 0x7a9ad8, hor: 0xffc8b0, fog: 0xf4d6cc, fn: 80, ff: 300, sun: 0xffd0b0, si: .62, sd: [-46, 18, 26], hs: 0xffe0d8, hg: 0x6f6a50, hi: .62, cloud: 0xffd8e0, co: .92, sunVis: 1, sunCol: 0xffc8a0, wind: .6, lamp: 0 },
  sun:    { top: 0x4f9fe6, hor: 0xe2f3f8, fog: 0xcfe8f3, fn: 80, ff: 300, sun: 0xfff1d0, si: .78, sd: [8, 50, 22], hs: 0xdff1ff, hg: 0x7d7040, hi: .6, cloud: 0xffffff, co: .93, sunVis: 1, wind: 1, lamp: 0 },
  rain:   { top: 0x6f7b88, hor: 0xb9c2c8, fog: 0xaab5bb, fn: 50, ff: 220, sun: 0xdfe8f0, si: .3, sd: [20, 50, 10], hs: 0xd8e0e6, hg: 0x60605a, hi: .82, cloud: 0x8a939a, co: .97, sunVis: 0, wind: 2, lamp: 0, rain: 1 },
  gold:   { top: 0x5a7cc0, hor: 0xffb85a, fog: 0xf2c588, fn: 90, ff: 320, sun: 0xffa050, si: .95, sd: [44, 16, 24], hs: 0xffd59a, hg: 0x7a5530, hi: .48, cloud: 0xffc27e, co: .9, sunVis: 1, sunCol: 0xffa53a, wind: .8, lamp: 0 },
  dusk:   { top: 0x4a4f98, hor: 0xff9a8a, fog: 0xd89aa0, fn: 70, ff: 260, sun: 0xff8a70, si: .6, sd: [52, 8, 18], hs: 0xd8b0d0, hg: 0x4f4050, hi: .52, cloud: 0xffa0b0, co: .9, sunVis: 1, sunCol: 0xff7a50, wind: .5, lamp: .4, moon: 1 },
};
skyInit(scene, WEATHERS.dawn);
let wxNow = '';
function setWeather(id) { if (id === wxNow) return; wxNow = id; applyWeather(WEATHERS[id], { scene, renderer, sun, hemi, sunDir: SUN_DIR, cloud: M.cloud, win: M.win });
  sun.position.copy(SUN_DIR); sun.target.position.set(0, 0, 0); M.grass.color.setHex(id === 'rain' ? 0xb8c4b0 : 0xffffff); }

/* =====================================================================
   ŚWIAT: łąka, grządki, dom dziadka, stodoła, traktor, las (stąd idą zwierzaki), wzgórza, chmury
   ===================================================================== */
const ground = mesh(new T.PlaneGeometry(400, 400), M.grass, 0, 0, 0, scene); ground.rotation.x = -PI/2; ground.receiveShadow = true;
const fieldBed = box(COLS*TS + .7, .1, ROWS*TS + .7, M.soilEdge, 0, .02, 0, scene); fieldBed.receiveShadow = true;
const tiles = [], tileGeo = rboxGeo(TS - .14, .2, TS - .14, .06), hlMat = new T.MeshBasicMaterial({ color: 0xfff36a, transparent: true, opacity: .4, depthWrite: false });
const hlGeo = new T.PlaneGeometry(TS - .3, TS - .3); hlGeo.rotateX(-PI/2);
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const m = new T.Mesh(tileGeo, (r + c) % 2 ? M.soilD : M.soil); m.position.set(cxOf(c), .02, czOf(r)); m.receiveShadow = true; scene.add(m);
  const hl = new T.Mesh(hlGeo, hlMat); hl.position.set(cxOf(c), .14, czOf(r)); hl.visible = false; hl.renderOrder = 2; scene.add(hl);
  tiles.push({ r, c, x: cxOf(c), z: czOf(r), plant: null, hl });
}
const tileAt = (c, r) => (c >= 0 && c < COLS && r >= 0 && r < ROWS) ? tiles[r*COLS + c] : null;
const colOf = x => Math.floor((x - X0)/TS), rowOf = z => Math.floor((z - Z0)/TS);

function buildWorld() {
  // płotek z tyłu i z przodu grządek
  const fence = new T.Group(); for (const z of [-ROWS - 1.1, ROWS + 1.1]) { for (let x = X0 - .4; x <= -X0 + .5; x += 1.6) box(.14, .7, .14, M.wood, x, .35, z, fence); box(-X0*2 + 1, .1, .06, M.wood, 0, .5, z, fence); box(-X0*2 + 1, .1, .06, M.wood, 0, .25, z, fence); }
  fence.traverse(o => { if (o.isMesh) { o.castShadow = !LITE; o.material = M.wood; } }); scene.add(fence);
  // ścieżka od domu do pola
  const path = mesh(new T.PlaneGeometry(8, 2.2), M.path, -14, .015, PORCH.z, scene); path.rotation.x = -PI/2; path.receiveShadow = true;
  // dom dziadka (z lewej), stodoła z tyłu, traktor
  const house = new T.Group(); house.position.set(-19.5, 0, -1.5); house.rotation.y = .5; scene.add(house);
  gableHouse(house, 6, 3.4, 5, M.wall, M.roof, .62, M.wall);
  box(1.2, 2.1, .1, M.door, 0, 1.05, 2.55, house); for (const x of [-1.9, 1.9]) { box(1.1, 1, .08, M.winF, x, 1.9, 2.53, house); box(.9, .8, .1, M.win, x, 1.9, 2.55, house); }
  box(.6, 1.4, .6, M.roofD, 1.4, 4.6, -.6, house); box(6.6, .14, 1.6, M.woodD, 0, .07, 3.3, house);
  const barn = new T.Group(); barn.position.set(-24, 0, -19); barn.rotation.y = .35; scene.add(barn);
  gableHouse(barn, 8, 5, 7, M.barn, M.roofD, .7, M.barn); box(3, 3.8, .1, M.wall, 0, 1.9, 3.55, barn); box(2.6, 3.4, .12, M.barn, 0, 1.9, 3.57, barn);
  [house, barn].forEach(g => g.traverse(o => { if (o.isMesh) { o.castShadow = !LITE; o.receiveShadow = true; } }));
  const tr = buildTractor(); tr.driver.visible = false; tr.g.position.set(-16.5, 0, 7.5); tr.g.rotation.y = -.9; tr.g.scale.setScalar(.9); scene.add(tr.g);
  const bk = PLANTS.basket(true); bk.position.set(-11.4, 0, 4); bk.scale.setScalar(1.2); scene.add(bk);
  // las z prawej (zwierzaki wychodzą między drzewami), krzaki, drzewa z tyłu
  for (let i = 0; i < 46; i++) {
    const x = 17 + rnd()*20, z = -24 + rnd()*36, t = rnd() < .55 ? PLANTS.pine() : PLANTS.leafy();
    if (x < 21 && Math.abs(z) < ROWS + 1) continue;
    t.position.set(x, 0, z); t.scale.setScalar(rr(1.1, 1.8)); t.rotation.y = rnd()*6; scene.add(t);
  }
  for (let i = 0; i < 10; i++) { const b = PLANTS.bush(); b.position.set(14 + rnd()*4, 0, (i % 2 ? -1 : 1)*(ROWS + 1.5 + rnd()*4)); b.scale.setScalar(rr(.9, 1.5)); scene.add(b); }
  for (let i = 0; i < 14; i++) { const t = rnd() < .4 ? PLANTS.pine() : PLANTS.leafy(); t.position.set(-34 + i*5 + rr(-1, 1), 0, -26 - rnd()*8); t.scale.setScalar(rr(1.2, 2)); scene.add(t); }
  for (let i = 0; i < 6; i++) { const b = PLANTS.bush(); b.position.set(-10 + i*4.5 + rr(-1, 1), 0, ROWS + 3 + rnd()*2.5); b.scale.setScalar(rr(.7, 1.1)); scene.add(b); }
  // łan zboża za płotem (kępki z models/grass.js)
  if (!LITE) { const g = tuftGeo('wheat'), n = 700, im = new T.InstancedMesh(g, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }), n), d = new T.Object3D();
    for (let i = 0; i < n; i++) { d.position.set(-12 + (i % 35)*.75 + rr(-.2, .2), 0, -8.6 - Math.floor(i/35)*.75 + rr(-.2, .2)); d.rotation.y = rnd()*6; d.scale.setScalar(rr(.8, 1.05)); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
    im.castShadow = true; scene.add(im); }
  // wzgórza i chmury
  for (let i = 0; i < 7; i++) { const h = mesh(new T.SphereGeometry(1, 24, 12), i % 2 ? M.hill : M.hill2, -90 + i*32, -6, -95 - (i % 3)*20, scene); h.scale.set(rr(30, 48), rr(14, 24), rr(18, 26)); }
  for (let i = 0; i < 9; i++) { const c = new T.Group(); for (let k = 0; k < 5; k++) mesh(new T.SphereGeometry(1, 12, 8), M.cloud, k*2.2 - 4.4, Math.sin(k)*.8, rr(-1, 1), c).scale.set(rr(2.4, 3.6), rr(1.6, 2.4), rr(2, 3));
    c.position.set(-120 + i*30, rr(40, 70), -140 - rnd()*60); c.userData.v = rr(.6, 1.4); clouds.push(c); scene.add(c); }
}
const clouds = [];
buildWorld();
particlesInit(scene, LITE ? 300 : 900);

/* =====================================================================
   STAN GRY
   ===================================================================== */
const G = { day: Math.max(0, Math.min(4, (+Q.get('dzien') || 1) - 1)), t: 0, queue: [], run: false, paused: false, seeds: 4, basket: 0, sel: null, cd: {}, unlocked: new Set(['beanstalk', 'carrot']), script: 0, rain: false, ended: false, tut: 0, firsts: new Set(), muted: false };
try { G.muted = localStorage.getItem('ogrodek-cisza') === '1'; } catch (e) {}
AU.muted = () => G.muted;
const DAY = () => DAYS[G.day];
const plants = [], animals = [], drops = [];
G.stats = { eaten: 0, crops: 0, fled: 0, spawned: 0 };

/* =====================================================================
   PASKI ŻYCIA (rośliny, uparte zwierzaki) — dwie płaskie belki zwrócone do kamery
   ===================================================================== */
const barGeo = new T.PlaneGeometry(1, 1), barMat = c => new T.MeshBasicMaterial({ color: c, depthTest: false, transparent: true });
const barFrame = barMat(0xfffaf0), barBg = barMat(0x3a2414);   // jasna ramka — widać na ziemi, trawie i zbożu
function makeBar(w) { const g = new T.Group(), fr = new T.Mesh(barGeo, barFrame), bg = new T.Mesh(barGeo, barBg), fg = new T.Mesh(barGeo, barMat(0x5fd34a));
  fr.scale.set(w + .22, .44, 1); bg.scale.set(w + .06, .28, 1); fg.scale.set(w, .22, 1); bg.position.z = .01; fg.position.z = .02;
  fr.renderOrder = 8; bg.renderOrder = 9; fg.renderOrder = 10; g.add(fr, bg, fg); g.userData = { fg, w }; g.visible = false; scene.add(g); return g; }
function setBar(b, k, x, y, z) { const { fg, w } = b.userData; k = clamp(k, 0, 1); fg.scale.x = Math.max(.001, w*k); fg.position.x = -w*(1 - k)/2;
  fg.material.color.setHSL(k*.33, 1, .5); b.position.set(x, y, z); b.quaternion.copy(camera.quaternion); }

/* =====================================================================
   ROŚLINY: sadzenie, wzrost, plon, ziarenka ze słonecznika, jabłka z jabłonki, lew
   ===================================================================== */
function plantAt(tile, k) {
  const card = CARD[k], P = { k, card, tile, grow: 0, hp: card.hp, max: card.hp, ripeT: 0, prodT: 4, eaten: 0, bar: makeBar(1.3) };
  if (k === 'lion') {
    const a = ZOO.MK.lion(), w = new T.Group(); w.add(a.root); a.root.position.x = -a.cx; w.scale.setScalar(2.1/a.dims.h);
    P.a = a; P.g = w; P.roarT = 1; P.grow = 1; SFX.call('lion');
    P.ring = laneMark(tile, LION_R, 0xff9a3a);
  } else if (k === 'scarecrow') {
    const sc = ZOO.scarecrow(); P.sc = sc; P.g = new T.Group(); P.g.add(sc.g); P.g.scale.setScalar(1.05); P.grow = 1; P.scT = 1; P.flap = 0;
    P.ring = auraRing(tile, SCARE_R, 0xffd23f);
  } else if (k === 'mouse') {
    const a = ZOO.MK.mouse(), w = new T.Group(); w.add(a.root); a.root.position.x = -a.cx; w.scale.setScalar(.75/a.dims.h); a.moving = true;
    P.a = a; P.g = new T.Group(); P.g.add(w); P.mw = w; P.grow = 1; SFX.call('mouse'); P.ring = auraRing(tile, MOUSE_R, 0xc9a8ff);
  } else { P.p = PLANTS.make(k); P.g = new T.Group(); P.g.add(P.p.g); P.g.scale.setScalar(k === 'tree' ? 1 : PLANT_K); PLANTS.set(P.p, 0, 1); }
  if (k === 'onion') { P.ring = auraRing(tile, ONION_R, 0x8ee04a); P.charge = 2; }
  P.g.position.set(tile.x, .12, tile.z); scene.add(P.g); tile.plant = P; plants.push(P);
  for (let i = 0; i < 14; i++) emit(tile.x + rr(-.6, .6), .3, tile.z + rr(-.6, .6), rr(-1, 1), rr(1.5, 3), rr(-1, 1), .7, .45, .3, .15, 8);
  SFX.plant(); return P;
}
function removePlant(P, eaten) {
  if (P.tile.plant === P) P.tile.plant = null; const i = plants.indexOf(P); if (i < 0) return; plants.splice(i, 1); scene.remove(P.bar); if (P.ring) scene.remove(P.ring);
  if (eaten && P.k === 'tree') { falling.push({ g: P.g, t: 0 }); SFX.timber(); } else scene.remove(P.g);       // ścięta jabłonka przewraca się („Bęc!”)
  if (eaten) { for (let i = 0; i < 18; i++) emit(P.tile.x + rr(-.5, .5), rr(.3, 1.2), P.tile.z + rr(-.5, .5), rr(-2, 2), rr(1, 4), rr(-2, 2), 1, .35, .7, .25, 6); }
  if (P.saw) { P.saw.stop(); P.saw = null; }
}
const PLANT_K = 1.45, falling = [];
function updateFalling(dt) { for (const F of falling.slice()) { F.t += dt; F.g.rotation.z = -Math.min(PI/2, F.t*F.t*3); if (F.t > .9 && !F.hit) { F.hit = 1; for (let i = 0; i < 20; i++) emit(F.g.position.x - 2, .3, F.g.position.z, rr(-2, 2), rr(1, 3), rr(-1, 1), .8, .6, .45, .25, 8); }
  if (F.t > 2) { F.g.position.y -= dt*2; } if (F.t > 2.6) { scene.remove(F.g); falling.splice(falling.indexOf(F), 1); } } }
const isRipe = P => P.card.crop > 0 && P.grow >= 1;
function harvest(P, byFarmer) {
  if (!isRipe(P) || !plants.includes(P)) return false;
  const pos = toScreen(P.tile.x, 1, P.tile.z), icon = ICONS[P.k];
  removePlant(P, false); SFX.harvest();
  for (let i = 0; i < 16; i++) emit(P.tile.x, 1, P.tile.z, rr(-2, 2), rr(2, 5), rr(-2, 2), .8, 1, .9, .3, 6);
  const n = P.card.crop, b = P.card.beans || 0; flyTo(icon, pos, $('basketIco'), () => { G.basket += n; hudBasket(); });
  for (let i = 0; i < b; i++) setTimeout(() => flyTo(ICONS.seed, { X: pos.X + i*20, Y: pos.Y - 10 }, $('seedIco'), () => { addSeeds(1); SFX.seed(); }), IS_TEST ? 0 : 250 + i*180);
  G.stats.crops++;
  if (!byFarmer) bubble(n > 1 ? 'Super!' : 'Mniam!', P.tile.x, 1.5, P.tile.z, 'small');
  return true;
}
function updatePlants(dt) {
  const rainK = G.rain ? 2 : 1;
  for (const P of plants.slice()) {
    if (P.k === 'lion') { updateLion(P, dt); continue; }
    if (P.k === 'scarecrow') { updateScarecrow(P, dt); continue; }
    if (P.k === 'mouse') { updateMouse(P, dt); continue; }
    const wasRipe = P.grow >= 1;
    if (P.grow < 1) P.grow = Math.min(1, P.grow + dt*rainK/P.card.grow);
    if (P.k === 'tree' && P.grow >= 1 && P.max < 30) { P.max = 30; P.hp = Math.min(30, P.hp + 20); }
    if (!P.biting && P.hp < P.max) P.hp = Math.min(P.max, P.hp + dt*.35);
    P.biting = false;
    PLANTS.set(P.p, P.grow, P.hp/P.max);
    P.p.ripe = isRipe(P); P.p.fear = Math.max(0, (P.p.fear || 0) - dt*2);
    PLANTS.anim(P.p, G.t, dt);
    if (P.grow >= 1 && !wasRipe && isRipe(P)) { SFX.seed(); for (let i = 0; i < 20; i++) emit(P.tile.x, 1, P.tile.z, rr(-1.5, 1.5), rr(1, 3), rr(-1.5, 1.5), 1, 1, .95, .4, 2);
      if (!G.firsts.has('ripe')) { G.firsts.add('ripe'); say('Urosło! Stuknij, żeby zebrać do kosza.'); pointAt({ x: P.tile.x, y: 1.2, z: P.tile.z }, 'ripe'); } }
    if (isRipe(P)) P.ripeT += dt;
    if (P.k === 'beanstalk' && P.grow >= 1 && (P.prodT -= dt) <= 0) { P.prodT = 11; dropSeed(P.tile.x, 3, P.tile.z + .2, true); }
    if (P.k === 'onion' && P.grow > .25) onionAura(P, dt);
    if (P.k === 'tree' && P.grow >= 1 && (P.prodT -= dt) <= 0) { P.prodT = 11; dropApple(P.tile.x + rr(-.8, .8), 2.2, P.tile.z + rr(-.3, .8)); }
    if (P.k === 'onion') { P.charge = Math.min(2, P.charge + dt/ONION_RECHARGE); P.p.stink = Math.floor(P.charge)/2; P.ring.children[0].material.opacity = .15 + .12*Math.floor(P.charge); }
    if (P.k === 'onion' && P.grow > .25 && P.charge >= 1 && rnd() < dt*3*P.charge) { const a = rnd()*6.28, r = rnd()*ONION_R*.8; emit(P.tile.x + Math.cos(a)*r, .4, P.tile.z + Math.sin(a)*r, rr(-.2, .2), rr(.3, .8), rr(-.2, .2), 1.8, .55, .85, .25, -.05); }
    const show = P.hp < P.max - .05; P.bar.visible = show; if (show) setBar(P.bar, P.hp/P.max, P.tile.x, P.k === 'tree' ? 4.4 : P.k === 'beanstalk' ? 3.8 : 2.4, P.tile.z);
  }
}
// ---------- obrońcy: zasięg widać na ziemi (kółko cebuli i stracha, pas lwa)
const isBig = A => A.sp.brave >= 4 && !A.sp.boss;   // duży uparciuch (krowa, słoń, hipopotam): widły i dziadek ledwo go ruszają — na niego obrona; bóbr (szef) — szturchać!
const HAND_POWER = .7, FARMER_POWER = .7, FARMER_SPEED = 1.8, FARMER_CD = 3;   // widły i dziadek płoszą słabiej niż obrona — obrona ma się opłacać
const ONION_R = 2.3, SCARE_R = 3.6, LION_R = 8, MOUSE_R = 5, ONION_RECHARGE = 8, SCARE_CD = 5, LION_CD = 7;
function auraRing(tile, r, col) { const g = new T.Group(), m1 = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .5, depthWrite: false }), m2 = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .1, depthWrite: false });
  const a = new T.Mesh(new T.RingGeometry(r - .14, r, 48), m1), b = new T.Mesh(new T.CircleGeometry(r, 48), m2); a.rotation.x = b.rotation.x = -PI/2; a.position.y = .16; b.position.y = .15; a.renderOrder = b.renderOrder = 3;
  g.add(a, b); g.position.set(tile.x, 0, tile.z); scene.add(g); return g; }
function laneMark(tile, len, col) { const m = new T.Mesh(new T.PlaneGeometry(len, TS*.8), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .16, depthWrite: false }));
  m.rotation.x = -PI/2; m.position.set(tile.x + len/2, .16, tile.z); m.renderOrder = 3; scene.add(m); return m; }
function animalsNear(x, z, r) { return animals.filter(A => A.alive && !A.leaving && A.state !== 'under' && Math.hypot(A.x - x, A.z - z) < r); }
function onionAura(P, dt) {      // smród cebuli: 3 chmurki, każda odbiera wrażliwemu zwierzakowi 1 odwagi i odpycha (pierd!); nowa chmurka co 6 s.
  for (const A of animalsNear(P.tile.x, P.tile.z, ONION_R)) {   // bez smell (krowa, koza, bóbr, słoń…) — nie czują, cebulę zjadają
    if (!A.sp.smell || P.charge < 1 || (A.stinkT || 0) > G.t) continue;
    P.charge -= 1; A.stinkT = G.t + 1.5; stinkPuff(A); scare(A, .5, 'onion');
  }
}
function stinkPuff(A) { for (let i = 0; i < 16; i++) emit(A.x + rr(-.5, .5), A.sp.h*.6, A.z + rr(-.5, .5), rr(-1.5, 1.5), rr(.5, 2), rr(-1.5, 1.5), 1.2, .5, .85, .2, -.2); }
function updateScarecrow(P, dt) {                  // strach: co 3 s macha rękami — wszystko w kółku traci 2 odwagi, kury uciekają od razu
  P.scT -= dt; P.flap = Math.max(0, P.flap - dt);
  const f = P.flap > 0 ? Math.sin(P.flap*28)*.5 : Math.sin(G.t*1.3)*.04; P.sc.arms.rotation.x = f; P.sc.head.rotation.z = f*.4; P.sc.g.rotation.y = P.flap > 0 ? Math.sin(P.flap*14)*.5 : 0;
  if (P.scT > 0) return;
  const near = animalsNear(P.tile.x, P.tile.z, SCARE_R);
  if (!near.length) { P.scT = .3; return; }
  P.scT = SCARE_CD; P.flap = .9; SFX.scare(); bubble('Uuu-uuu!', P.tile.x, 3.2, P.tile.z, '');
  for (let i = 0; i < 20; i++) emit(P.tile.x + rr(-.8, .8), 2, P.tile.z, rr(-3, 3), rr(1, 3), rr(-2, 2), 1, 1, .85, .3, 6);
  near.forEach(A => A.sp.bird ? flee(A, 'scarecrow') : scare(A, 1, 'scarecrow'));
}
function updateMouse(P, dt) {                      // mysz biega w kółko po grządce; słoń w kółku — ucieka z trąbieniem
  ZOO.anim(P.a, dt); const a = G.t*2.5; P.mw.position.set(Math.cos(a)*.5, 0, Math.sin(a)*.5); P.mw.rotation.y = -a - PI/2;
  for (const A of animalsNear(P.tile.x, P.tile.z, MOUSE_R)) if (A.sp.mouseFear) { SFX.call('elephant'); bubble('Mysz!!!', A.x, A.sp.h + .6, A.z, 'big'); ZOO.pose(A.a, 'rear'); flee(A, 'mouse'); }
}
function updateLion(P, dt) {
  ZOO.anim(P.a, dt); P.roarT -= dt;
  if (P.roarT <= 0) {
    const prey = animals.filter(A => A.alive && !A.leaving && A.row === P.tile.r && A.x > P.tile.x - .5 && A.x - P.tile.x < LION_R && (A.state !== 'under'));
    if (prey.length) { P.roarT = LION_CD; ZOO.pose(P.a, 'rear'); P.a.jumpT = 0; SFX.roar(); bubble('RAAAU!', P.tile.x, 2.4, P.tile.z, 'big');
      setTimeout(() => P.a && ZOO.pose(P.a, null), 1100);
      prey.forEach(A => scare(A, A.sp.boss ? 1 : 3, 'lion')); }
    else P.roarT = .4;
  }
}

/* =====================================================================
   ZIARENKA I JABŁKA: spadają z nieba / ze słonecznika / z jabłonki — stuknij, żeby zebrać (same się zbiorą po chwili)
   ===================================================================== */
const seedTpl = PLANTS.bean(), appleTpl = PLANTS.apple();
const glowTex = tex(64, 64, g => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(255,250,190,1)'); r.addColorStop(.5, 'rgba(255,230,120,.5)'); r.addColorStop(1, 'rgba(255,230,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
function makeDrop(kind, x, y, z, vy) {
  const g = new T.Group(), m = (kind === 'seed' ? seedTpl : appleTpl).clone(); g.add(m); m.scale.setScalar(kind === 'seed' ? 2.2 : 1.6);
  const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, depthWrite: false, transparent: true })); s.scale.setScalar(2.2); g.add(s);
  g.position.set(x, y, z); scene.add(g); const D = { kind, g, x, y, z, vy: vy || 0, vx: 0, vz: 0, t: 0, landed: false }; drops.push(D); return D;
}
function dropSeed(x, y, z, pop) { const D = makeDrop('seed', x, y, z, pop ? 4 : -1.2); if (pop) { D.vx = rr(-1, 1); D.vz = rr(.4, 1.4); } else D.sky = 1;
  if (!G.firsts.has('seed') && !pop) { G.firsts.add('seed'); say('Złap magiczną fasolkę! Stuknij ją.'); } return D; }
function dropApple(x, y, z) { const D = makeDrop('apple', x, y, z, 1.5); D.vx = rr(-.5, .5); D.vz = rr(.2, .8); }
function updateDrops(dt) {
  for (const D of drops.slice()) {
    D.t += dt;
    if (!D.landed) { if (D.sky) { D.y -= dt*1.6; D.x += Math.sin(D.t*2.2)*dt*.8; } else { D.vy -= 12*dt; D.x += D.vx*dt; D.z += D.vz*dt; D.y += D.vy*dt; }
      if (D.y <= .5) { D.y = .5; D.landed = true; D.t = 0; } }
    D.g.position.set(D.x, D.y + (D.landed ? Math.abs(Math.sin(D.t*3))*.15 : 0), D.z); D.g.children[0].rotation.y += dt*2;
    if (D.landed && D.t > (D.kind === 'apple' ? 6 : 7)) collect(D);
  }
}
function collect(D) {
  drops.splice(drops.indexOf(D), 1); scene.remove(D.g); const pos = toScreen(D.x, D.y, D.z);
  if (D.kind === 'seed') { SFX.seed(); flyTo(ICONS.seed, pos, $('seedIco'), () => addSeeds(1)); clearPoint('seed'); }
  else { SFX.harvest(); flyTo(ICONS.apple, pos, $('basketIco'), () => { G.basket += 1; hudBasket(); }); }
}

/* =====================================================================
   ZWIERZAKI: wychodzą z lasu, idą rzędem w lewo, jedzą pierwszą roślinę; cebula płoszy, kolce zatrzymują,
   szturchnięcie (ręka, dziadek, lew) odbiera odwagę — przy zera uciekają. Najedzone (full) wracają z brzuszkiem do lasu.
   ===================================================================== */
const moundGeo = new T.SphereGeometry(.55, 12, 8, 0, PI*2, 0, PI/2);
function spawn(k, row) {
  const sp = SPECIES[k]; if (!sp || !ZOO.MK[k]) return null;
  if (row === undefined || row === null) { const rows = [0, 1, 2, 3, 4].filter(r => tiles.some(t => t.r === r && t.plant && t.plant.k !== 'lion'));
    row = rows.length && rnd() < .8 ? rows[Math.floor(rnd()*rows.length)] : Math.floor(rnd()*ROWS); }
  const a = ZOO.MK[k](), w = new T.Group(), inner = new T.Group(); inner.add(a.root); a.root.position.x = -a.cx; w.add(inner);
  const kk = sp.h/a.dims.h; inner.scale.setScalar(kk); scene.add(w);
  const A = { k, sp, a, w, inner, kk, x: SPAWN_X + rr(0, 1.5), z: czOf(row) + rr(-.25, .25), row, dir: -1, state: 'walk', t: 0, brave: sp.brave, eaten: 0, alive: true, leaving: false,
    len: a.dims.len*kk, bar: sp.brave > 1 ? makeBar(1.2) : null, stun: 0, chompT: 0, fat: 0, jumpT: 0, ouchT: 0 };
  if (sp.under) { A.state = 'under'; A.mound = mesh(moundGeo, M.soilEdge, 0, 0, 0, scene); A.mound.scale.set(1, .6, 1); a.root.visible = false; pickMoleTarget(A); }
  if (sp.boss) { A.x += 1; }
  animals.push(A); a.moving = true; SFX.call(k); G.stats.spawned++;
  if (!G.firsts.has(k)) { G.firsts.add(k); if (k === 'rabbit') setTimeout(() => A.alive && pointAt(A, 'rabbit'), 2500); }
  return A;
}
function edible(A, P) {
  if (!P || P.card.cat === 'guard' && P.k !== 'onion' && P.k !== 'thorns') return false; const sp = A.sp;
  if (P.k === 'thorns') return !!sp.thorns;
  if (P.k === 'tree' && P.grow >= 1) return !!sp.trees;
  if (sp.young && P.grow > .6) return false;
  if ((P.k === 'onion' || P.k === 'garlic') && sp.smell) return false;
  return true;
}
function pickMoleTarget(A) {
  const ok = tiles.filter(t => t.plant && edible(A, t.plant) && !tiles.some(o => o.plant && (o.plant.k === 'onion' || o.plant.k === 'garlic') && o.plant.grow > .25 && Math.abs(o.r - t.r) <= 1 && Math.abs(o.c - t.c) <= 1));
  const t = ok.length ? ok[Math.floor(rnd()*ok.length)] : tiles[Math.floor(rnd()*tiles.length)];
  A.target = t; A.row = t.r;
}
function scare(A, power, by) {
  if (!A.alive || A.leaving) return;
  if (isBig(A) && (by === 'hand' || by === 'farmer')) {   // duży uparciuch: nie przestaje jeść, tylko się krzywi
    A.brave -= power/2; if (A.brave <= 0) return flee(A, by); bubble('Hmpf!', A.x, A.sp.h + .6, A.z, 'small'); return; }
  A.brave -= power; A.stun = .8; ZOO.pose(A.a, 'hurt'); A.a.jumpT = 0;
  if (A.state === 'eat' && A.saw) { A.saw.stop(); A.saw = null; }
  if (A.k === 'beaver') { SFX.slap(); for (let i = 0; i < 10; i++) emit(A.x, .3, A.z, rr(-2, 2), rr(1, 3), rr(-2, 2), .6, .6, .45, .25, 8); }
  if (A.brave <= 0) flee(A, by);
  else { if (!A.sp.under) A.x = Math.min(A.x + 1.6, SPAWN_X); A.state = A.sp.under ? 'up' : 'walk'; bubble(by === 'onion' ? 'Fuj!' : A.brave <= 1 ? 'Ojej!' : 'Auć!', A.x, A.sp.h + .6, A.z, 'small'); if (by === 'onion') SFX.fart(.4); }
}
const GUARD_BY = new Set(['onion', 'thorns', 'scarecrow', 'lion', 'mouse']);
function flee(A, by) {
  A.leaving = true; A.dir = 1; A.state = A.sp.under ? 'dive' : 'flee'; G.stats.fled++; A.t = 0; A.stun = .5; ZOO.pose(A.a, 'hurt');
  if (A.saw) { A.saw.stop(); A.saw = null; }
  if (A.target && A.target.plant) A.target.plant.biting = false;
  bubble(by === 'onion' ? 'Fuj!' : by === 'lion' ? 'Ratunku!' : by === 'thorns' ? 'Auuuć!' : by === 'scarecrow' ? 'Aaa!' : 'Kysz!', A.x, A.sp.h + .7, A.z, '');
  if (by === 'onion') SFX.fart(); else if (by === 'thorns') SFX.ouch(); else SFX.call(A.k);
  if (GUARD_BY.has(by)) dropSeed(A.x, Math.max(.6, A.sp.h*.6), A.z, true);   // obrona się zwraca: przegoniony zwierzak gubi fasolkę
  if (!G.firsts.has('flee')) { G.firsts.add('flee'); clearPoint('rabbit'); }
  if (farmer && farmer.chase === A) farmer.chase = null;
}
function faceDir(A) { A.w.rotation.y = A.dir < 0 ? PI : 0; }
function updateAnimals(dt) {
  for (const A of animals.slice()) {
    const sp = A.sp, a = A.a; A.t += dt;
    if (A.stun > 0) { A.stun -= dt; if (A.stun <= 0) ZOO.pose(a, null); }
    a.moving = false; a.eat = false;
    if (A.state === 'under' || A.state === 'dive') {                       // kret pod ziemią: kopiec jedzie do celu (albo z powrotem)
      const tx = A.state === 'dive' ? SPAWN_X + 3 : A.target.x, tz = A.state === 'dive' ? A.z : A.target.z, dx = tx - A.x, dz = tz - A.z, d = Math.hypot(dx, dz);
      if (A.state === 'under' && A.target && (!A.target.plant || !edible(A, A.target.plant))) pickMoleTarget(A);
      if (d < .2) { if (A.state === 'dive') { kill(A); continue; } A.state = 'rise'; A.t = 0; a.root.visible = true; SFX.call('mole'); }
      else { const s = sp.sp*(A.state === 'dive' ? 1.8 : 1)*dt/d; A.x += dx*Math.min(1, s); A.z += dz*Math.min(1, s); if (rnd() < dt*20) emit(A.x, .3, A.z, rr(-1, 1), rr(1, 2.5), rr(-1, 1), .6, .45, .3, .15, 8); }
      A.mound.position.set(A.x, 0, A.z); A.mound.visible = true; A.w.position.set(A.x, -2, A.z); ZOO.anim(a, dt); continue;
    }
    if (A.state === 'rise') { A.w.position.set(A.x, -sp.h*.6*(1 - Math.min(1, A.t/.5)), A.z); A.mound.position.set(A.x, 0, A.z); A.w.rotation.y = PI/2 + .6; ZOO.anim(a, dt); if (A.t > .5) { A.state = 'up'; A.t = 0; } continue; }
    if (A.state === 'up') {                                                 // kret wystawił głowę i podgryza korzonki
      A.w.rotation.y = PI/2 + .6; A.w.position.set(A.x, -.12, A.z); A.mound.position.set(A.x, 0, A.z);
      const P = A.target && A.target.plant;
      if (P && edible(A, P) && A.stun <= 0) eatTick(A, P, dt);
      else if (A.t > 1.2) { A.state = A.eaten >= sp.full ? 'dive' : 'under'; A.leaving = A.eaten >= sp.full; a.root.visible = false; if (!A.leaving) pickMoleTarget(A); }
      ZOO.anim(a, dt); continue;
    }
    // naziemne
    if (A.stun > 0) { A.x += A.dir < 0 ? dt*1.5 : 0; }
    else if (A.state === 'walk') {
      a.moving = true; A.x -= sp.sp*dt*(1 - A.fat*.12);
      const mouthX = A.x - A.len*.45, c = colOf(mouthX), T0 = tileAt(c, A.row), P = T0 && T0.plant;
      if (P && Math.abs(mouthX - T0.x) < .75) {
        if (edible(A, P)) { A.state = 'eat'; A.eatP = P; A.target = T0; if (sp.saw) { A.saw = SFX.chainsaw(); } bubble(sp.bub, A.x, sp.h + .6, A.z, 'small'); }
        else if (P.k === 'thorns' || P.k === 'lion' || P.k === 'scarecrow') { if (sp.jump && P.k !== 'lion') { A.state = 'jump'; A.jumpT = 0; A.jx = A.x; } else { A.state = 'blocked'; A.ouchT = .3; } }
      }
      // wystraszone rośliny przed zwierzakiem
      for (let k = 0; k < 2; k++) { const t = tileAt(c - k, A.row); if (t && t.plant && t.plant.p) t.plant.p.fear = Math.max(t.plant.p.fear, .6); }
      if (A.x < EXIT_X) { kill(A); continue; }
    } else if (A.state === 'jump') {
      a.moving = true; A.jumpT += dt; const k = Math.min(1, A.jumpT/.7); A.x = A.jx - k*(TS + A.len*.6); A.jy = Math.sin(k*PI)*1.3; if (k >= 1) { A.state = 'walk'; A.jy = 0; }
    } else if (A.state === 'blocked') {
      A.ouchT -= dt; const T0 = tileAt(colOf(A.x - A.len*.45), A.row);
      const B = T0 && T0.plant;
      if (!B || !(B.k === 'thorns' || B.k === 'lion' || B.k === 'scarecrow') || edible(A, B)) A.state = 'walk';
      else if (B.k !== 'thorns') { /* stoi przed lwem / strachem i czeka (oni sami straszą) */ }
      else if (A.ouchT <= 0) { A.ouchT = 1.2; SFX.ouch(); A.brave -= 1; A.x += .5; B.hp -= 2; B.biting = true; if (B.hp <= 0) removePlant(B, true); ZOO.pose(a, 'hurt'); A.stun = .4; bubble('Auć!', A.x, sp.h + .5, A.z, 'small');
        for (let i = 0; i < 8; i++) emit(A.x - .4, sp.h*.4, A.z, rr(-1, 1), rr(1, 2), rr(-1, 1), .5, 1, .3, .3, 6); if (A.brave <= 0) flee(A, 'thorns'); }
    } else if (A.state === 'eat') {
      const P = A.eatP; if (!P || !plants.includes(P)) { A.state = 'walk'; stopSaw(A); }
      else eatTick(A, P, dt);
    } else if (A.state === 'flee' || A.state === 'home') {
      a.moving = true; A.x += sp.sp*(A.state === 'flee' ? 2.2 : .8)*dt;
      if (A.x > SPAWN_X + 3) { kill(A); continue; }
    }
    a.poseRate = 10;
    faceDir(A);
    const fat = 1 + A.fat*.2; A.inner.scale.set(A.kk, A.kk*(1 + A.fat*.06), A.kk*fat);
    A.w.position.set(A.x, (A.jy || 0) + .12, A.z);
    ZOO.anim(a, dt); if (A.state === 'eat') a.eat = true;
    if (A.bar) { A.bar.visible = !A.leaving; setBar(A.bar, A.brave/sp.brave, A.x, sp.h + .55, A.z); }
  }
}
function stopSaw(A) { if (A.saw) { A.saw.stop(); A.saw = null; } }
function eatTick(A, P, dt) {
  const sp = A.sp; A.a.eat = true; P.biting = true; P.hp -= sp.bite*dt; if (P.p) P.p.fear = 1;
  if (A.saw) A.saw.set(.6 + .4*Math.sin(G.t*9));
  if ((A.chompT -= dt) <= 0) { A.chompT = sp.saw ? .12 : .4; if (!sp.saw) SFX.chomp(); emit(P.tile.x + rr(-.4, .4), rr(.4, 1), P.tile.z + rr(-.3, .5), rr(-1.5, 1.5), rr(1, 3), rr(-1, 1), .7, sp.saw ? .8 : .35, sp.saw ? .6 : .75, sp.saw ? .35 : .25, 7); }
  if (P.hp <= 0) {
    removePlant(P, true); stopSaw(A); A.eaten++; G.stats.eaten++; A.fat = Math.min(3, A.fat + 1); A.state = A.sp.under ? 'up' : 'walk'; A.t = 0;
    if (P.k === 'tree') bubble('Bęc!', P.tile.x, 2.5, P.tile.z, 'big');
    if (A.eaten >= sp.full) { setTimeout(SFX.burp, 300); bubble('Bek!', A.x, sp.h + .6, A.z, 'small'); if (!sp.under) { A.leaving = true; A.dir = 1; A.state = 'home'; } }
  }
}
function kill(A) { A.alive = false; stopSaw(A); scene.remove(A.w); if (A.mound) scene.remove(A.mound); if (A.bar) scene.remove(A.bar); animals.splice(animals.indexOf(A), 1); if (farmer.chase === A) farmer.chase = null; }

/* =====================================================================
   DZIADEK: goni jedzące zwierzaki („A kysz!”), zbiera dojrzałe plony, potem wraca na ganek
   ===================================================================== */
const farmer = (() => { const a = ZOO.MK.farmer(), w = new T.Group(), inner = new T.Group(); inner.add(a.root); a.root.position.x = -a.cx; w.add(inner); inner.scale.setScalar(2.1/a.dims.h);
  const f = ZOO.pitchfork(); f.scale.setScalar(.75); f.rotation.z = PI; f.position.set(0, .9, 0); a.hand.add(f);
  w.position.set(PORCH.x, .12, PORCH.z); scene.add(w); return { a, w, x: PORCH.x, z: PORCH.z, chase: null, job: null, t: 0, hitT: 0, think: 0 }; })();
function updateFarmer(dt) {
  const F = farmer, a = F.a; F.t += dt; F.hitT -= dt; F.think -= dt;
  if (F.think <= 0) { F.think = .4;
    const hungry = animals.filter(A => A.alive && !A.leaving && (A.state === 'eat' || A.state === 'up') && A.x < -X0 + 1);
    if (hungry.length) { hungry.sort((p, q) => Math.hypot(p.x - F.x, p.z - F.z) - Math.hypot(q.x - F.x, q.z - F.z)); F.chase = hungry[0]; F.job = null; }
    else if (!F.chase) { const ripe = plants.filter(P => isRipe(P) && P.ripeT > 7).sort((p, q) => q.ripeT - p.ripeT); F.job = ripe[0] || null; }
  }
  let tx = PORCH.x, tz = PORCH.z, near = .3;
  if (F.chase && F.chase.alive && !F.chase.leaving) { tx = F.chase.x - 1.1; tz = F.chase.z + 1; near = .5; }
  else if (F.job && plants.includes(F.job) && isRipe(F.job)) { tx = F.job.tile.x - .9; tz = F.job.tile.z + .9; near = .4; F.chase = null; }
  else { F.chase = null; F.job = null; }
  const dx = tx - F.x, dz = tz - F.z, d = Math.hypot(dx, dz);
  a.moving = d > near;
  if (a.moving) { const s = Math.min(d, FARMER_SPEED*dt); F.x += dx/d*s; F.z += dz/d*s; F.w.rotation.y = Math.atan2(-dz, dx); }
  else if (F.chase && F.hitT <= 0) { F.hitT = FARMER_CD; ZOO.pose(a, 'swipe'); setTimeout(() => ZOO.pose(a, null), 450); SFX.poke(); bubble('A kysz!', F.x, 2.6, F.z, 'small'); F.w.rotation.y = 0; scare(F.chase, FARMER_POWER, 'farmer'); }
  else if (F.job) { ZOO.pose(a, 'crouch'); setTimeout(() => ZOO.pose(a, null), 500); harvest(F.job, true); F.job = null; }
  else if (!F.chase) F.w.rotation.y += (-.4 - F.w.rotation.y)*Math.min(1, dt*3);
  F.w.position.set(F.x, .12, F.z); ZOO.anim(a, dt);
}

/* =====================================================================
   RĘKA Z NIEBA Z WIDŁAMI (stuknięcie zwierzaka albo dojrzałej rośliny)
   ===================================================================== */
const HAND = (() => { const h = ZOO.skyHand(); h.g.scale.setScalar(1.6); h.g.visible = false; scene.add(h.g); return h; })();
const strikes = [];                       // każde stuknięcie trafia (szybkie stuknięcia jedno po drugim też); widać rękę ostatniego
function poke(x, y, z, onHit) { const L = strikes[strikes.length - 1]; if (L && L.t < .3) return false; SFX.whoosh(); strikes.push({ t: 0, to: { x, y, z }, hit: onHit, done: false }); return true; }
function updateHand(dt) {
  for (const S of strikes) { S.t += dt; if (!S.done && S.t >= .22) { S.done = true; S.hit && S.hit(); } }
  while (strikes.length && strikes[0].t > .85) strikes.shift();
  const S = strikes[strikes.length - 1]; HAND.g.visible = !!S; if (!S) return;
  const t = S.t, to = S.to; let y;
  if (t < .22) y = to.y + 14*(1 - t/.22)**2; else if (t < .4) y = to.y - .1*Math.sin((t - .22)/.18*PI); else y = to.y + 16*((t - .4)/.45)**2;
  HAND.g.position.set(to.x + .25, y, to.z + .35); HAND.g.rotation.set(-.15, 0, -.12);
}

/* =====================================================================
   DOTYK: ziarenko > zwierzak > dojrzała roślina > sadzenie wybranej karty
   ===================================================================== */
const ray = new T.Raycaster(), ndc = new T.Vector2(), plane0 = new T.Plane(V3(0, 1, 0), -.15), hitV = V3();
function toScreen(x, y, z) { const v = V3(x, y, z).project(camera); return { X: (v.x + 1)/2*innerWidth, Y: (1 - v.y)/2*innerHeight }; }
function pxRadius(x, y, z, r) { const a = toScreen(x, y, z), b = toScreen(x + r, y, z); return Math.hypot(b.X - a.X, b.Y - a.Y); }
function onTap(X, Y) {
  if (!G.run || G.paused || G.ended) return;
  critAudioInit();
  let best = null, bd = 1e9;
  for (const D of drops) { const s = toScreen(D.x, D.y, D.z), d = Math.hypot(s.X - X, s.Y - Y), r = Math.max(44, pxRadius(D.x, D.y, D.z, .9)); if (d < r && d < bd) { bd = d; best = D; } }
  if (best) { collect(best); return; }
  let bestA = null; bd = 1e9;
  for (const A of animals) { if (!A.alive || A.leaving) continue; const y = A.state === 'under' ? .3 : A.state === 'up' || A.state === 'rise' ? .35 : A.sp.h*.5 + (A.jy || 0);
    const s = toScreen(A.x, y, A.z), d = Math.hypot(s.X - X, s.Y - Y), r = Math.max(48, pxRadius(A.x, y, A.z, Math.max(.8, A.sp.h*.55)));
    if (d < r && d < bd) { bd = d; bestA = A; } }
  if (bestA) { const A = bestA, y = A.state === 'under' ? .3 : A.sp.h*.75;
    poke(A.x, y, A.z, () => { if (!A.alive) return; SFX.poke(); for (let i = 0; i < 10; i++) emit(A.x, y, A.z, rr(-3, 3), rr(1, 4), rr(-3, 3), .5, 1, .95, .5, 6);
      if (A.state === 'under') { A.state = 'rise'; A.t = .3; A.a.root.visible = true; A.brave = 0; setTimeout(() => A.alive && flee(A, 'hand'), 350); bubble('Bęc!', A.x, 1, A.z, 'small'); }
      else scare(A, HAND_POWER, 'hand'); });
    return; }
  ndc.set(X/innerWidth*2 - 1, -(Y/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(plane0, hitV)) return;
  const t = tileAt(colOf(hitV.x), rowOf(hitV.z));
  if (!t) { setSel(null); return; }
  if (t.plant && isRipe(t.plant)) { const P = t.plant; poke(t.x, 1, t.z, () => harvest(P)); clearPoint('ripe'); return; }
  if (G.sel && !t.plant) {
    const card = CARD[G.sel];
    if (G.seeds < card.cost) { noSeeds(); return; }
    if ((G.cd[G.sel] || 0) > 0) return;
    addSeeds(-card.cost); G.cd[G.sel] = card.cd; plantAt(t, G.sel);
    bubble(['Hop!', 'Rośnij!', 'Jest!'][Math.floor(rnd()*3)], t.x, 1.4, t.z, 'small');
    tutorialPlanted(G.sel); setSel(null); return;
  }
  if (G.sel && t.plant) { setSel(null); }
}
function noSeeds() { const e = $('seeds'); e.classList.remove('no'); void e.offsetWidth; e.classList.add('no'); SFX.ouch(); if (!G.firsts.has('poor')) { G.firsts.add('poor'); say('Brakuje fasolek. Posadź magiczną fasolę i zbieraj plony!'); } }
$('c').addEventListener('pointerdown', e => { e.preventDefault(); onTap(e.clientX, e.clientY); });
// przeciągnij kartę na grządkę (jak stuknięcie karty i grządki)
let dragK = null;
addEventListener('pointerup', e => { if (dragK && e.target === $('c') && G.sel === dragK) onTap(e.clientX, e.clientY); dragK = null; });

/* =====================================================================
   HUD: karty z rysunkami z modeli 3D, ziarenka, kosz, słońce na niebie, dymki, lecące ikonki, palec-podpowiedź
   ===================================================================== */
const ICONS = {};
function makeIcons() {
  for (const c of CARDS) {
    if (c.k === 'scarecrow') { ICONS.scarecrow = ikonaModelu(ZOO.scarecrow().g, { ry: .2 }); continue; }
    if (c.k === 'lion') { const a = ZOO.MK.lion(); ZOO.anim(a, 1); ICONS.lion = ikonaModelu(a.root, { ry: -.5 }); continue; }
    if (c.k === 'mouse') { const a = ZOO.MK.mouse(); ZOO.anim(a, 1); ICONS.mouse = ikonaModelu(a.root, { ry: -.6 }); continue; }
    const p = PLANTS.make(c.k); PLANTS.set(p, 1, 1); ICONS[c.k] = ikonaModelu(p.g, { ry: .3, rx: .15 });
  }
  ICONS.seed = ikonaModelu(PLANTS.bean(), {}); ICONS.apple = ikonaModelu(PLANTS.apple(), {}); ICONS.basket = ikonaModelu(PLANTS.basket(true), { rx: .35 });
  for (const k of ['farmer', 'rabbit', 'cow', 'beaver', 'elephant', 'chicken', 'deer', 'zebra', 'giraffe', 'kangaroo', 'hippo', 'panda', 'penguin', 'goat', 'mole', 'lion']) { const a = ZOO.MK[k](); if (k === 'farmer') ZOO.pose(a, 'cheer'); ZOO.anim(a, 1); ZOO.anim(a, 1); ICONS[k] = ikonaModelu(a.root, { ry: k === 'farmer' ? -1.2 : -.6 }); }
}
makeIcons();
$('seedIco').src = ICONS.seed; $('basketIco').src = ICONS.basket; $('endBasketIco').src = ICONS.basket;
$('crew').innerHTML = ['rabbit', 'farmer', 'cow', 'beaver'].map(k => `<img src="${ICONS[k]}" alt="">`).join('');
const STAR = on => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="${on ? '#ffd23f' : '#d8c8a8'}" stroke="#3b2a17" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const SVG = {
  again: '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M17.5 2.5v5h-5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  againD: '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="#3b2a17" stroke-width="2.6" stroke-linecap="round"/><path d="M17.5 2.5v5h-5" fill="none" stroke="#3b2a17" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  days: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3" fill="#fff3d6" stroke="#3b2a17" stroke-width="1.6"/><rect x="3" y="4" width="18" height="5" rx="2" fill="#e8574a" stroke="#3b2a17" stroke-width="1.6"/><g fill="#4fae3a"><circle cx="8" cy="13" r="1.6"/><circle cx="12" cy="13" r="1.6"/><circle cx="16" cy="13" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="12" cy="17" r="1.6"/></g></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M4 9h9V4l8 8-8 8v-5H4z" fill="#fff" stroke="#7a1e10" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" fill="#c9a35a" stroke="#3b2a17" stroke-width="1.6"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#3b2a17" stroke-width="2"/></svg>',
  finger: '<svg viewBox="0 0 64 64"><path d="M22 30V9a5 5 0 0 1 10 0v17l3-1a5 5 0 0 1 6 3l1 1a5 5 0 0 1 6 3l1 1a5 5 0 0 1 7 4v10c0 9-6 15-15 15h-6c-6 0-10-3-13-8L13 41a5 5 0 0 1 8-6z" fill="#fff" stroke="#3b2a17" stroke-width="3" stroke-linejoin="round"/></svg>',
};
$('bAgain').innerHTML = SVG.againD; $('bRestart').innerHTML = SVG.againD; $('bHome').innerHTML = $('bHome2').innerHTML = SVG.days; $('bGames').innerHTML = SVG_IKONY.dom; $('bNext').innerHTML = SVG.next;
function sndIcons() { $('bSnd').innerHTML = $('bSnd2').innerHTML = G.muted ? SVG_IKONY.cisza : SVG_IKONY.glos; }
sndIcons();

// grupy kart: fasolki (fiolet), plony do kosza (zieleń), obrona (czerwień) — każda z własnym znaczkiem
const CAT_BADGE = {
  bean: '<svg viewBox="0 0 24 24"><path d="M5 12c0-5 6-7 9-4 2 2 6 0 6 4 0 5-6 7-9 5-3-2-6 1-6-5z" fill="#a63ad0" stroke="#3b2a17" stroke-width="1.6"/><circle cx="9" cy="10" r="1.3" fill="#f4e6ff"/><circle cx="15" cy="13" r="1.1" fill="#f4e6ff"/></svg>',
  crop: '<svg viewBox="0 0 24 24"><path d="M3 10h18l-2.5 10h-13z" fill="#d9a45a" stroke="#3b2a17" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 10a5 5 0 0 1 10 0" fill="none" stroke="#3b2a17" stroke-width="1.8"/><circle cx="9" cy="9" r="2.4" fill="#ff8a1e" stroke="#3b2a17" stroke-width="1.2"/><circle cx="14.5" cy="8.6" r="2.4" fill="#e2352c" stroke="#3b2a17" stroke-width="1.2"/></svg>',
  guard: '<svg viewBox="0 0 24 24"><path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z" fill="#e8574a" stroke="#3b2a17" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6v12M7 11h10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
};
function buildCards() {
  $('cards').innerHTML = ['bean', 'crop', 'guard'].map(cat => `<div class="grp g-${cat}" data-cat="${cat}"><span class="badge">${CAT_BADGE[cat]}</span>` +
    CARDS.filter(c => c.cat === cat).map(c => `<button class="card c-${cat}" data-k="${c.k}" aria-label="${c.name}" hidden><img src="${ICONS[c.k]}" alt=""><span class="cost">${'<i></i>'.repeat(c.cost)}</span><span class="cd"></span></button>`).join('') + '</div>').join('');
  $('cards').querySelectorAll('.card').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); critAudioInit(); const k = b.dataset.k;
    if (G.seeds < CARD[k].cost) { noSeeds(); return; }
    setSel(G.sel === k ? null : k); dragK = G.sel; tutorialSelected(k); }));
}
buildCards();
function setSel(k) { G.sel = k; $('cards').querySelectorAll('.card').forEach(b => b.classList.toggle('sel', b.dataset.k === k)); if (k) SFX.seed && tone(660, .06, 'sine', .1); }
function hudCards(dt) {
  $('cards').querySelectorAll('.card').forEach(b => { const k = b.dataset.k, c = CARD[k]; b.hidden = !G.unlocked.has(k);
    if (G.cd[k] > 0) G.cd[k] = Math.max(0, G.cd[k] - dt); b.style.setProperty('--cd', ((G.cd[k] || 0)/c.cd).toFixed(3)); b.classList.toggle('poor', G.seeds < c.cost); });
  $('cards').querySelectorAll('.grp').forEach(g => { g.hidden = !CARDS.some(c => c.cat === g.dataset.cat && G.unlocked.has(c.k)); });
}
function unlock(k) { G.unlocked.add(k); const b = $('cards').querySelector(`[data-k="${k}"]`); if (b) { b.hidden = false; b.classList.add('new'); setTimeout(() => b.classList.remove('new'), 2600); } SFX.harvest(); }
function addSeeds(n, from) { G.seeds = Math.max(0, G.seeds + n); $('seedN').textContent = G.seeds; if (n > 0) { const e = $('seeds'); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } }
function hudBasket() { $('basketN').textContent = G.basket; const e = $('basket'); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); $('stars').innerHTML = DAY().stars.map(n => STAR(G.basket >= n)).join(''); }
function hudSun() { const k = clamp(G.t/DAY().len, 0, 1); $('dayFill').style.width = (k*100).toFixed(1) + '%'; $('daySun').style.left = (k*100).toFixed(1) + '%'; $('daySun').classList.toggle('late', k > .85); }
function bubble(txt, x, y, z, cls) { const s = toScreen(x, y, z); if (s.Y < 80) s.Y = 80; komiksDymek($('fx'), txt, s.X, s.Y, cls || ''); }
function flyTo(src, from, toEl, done) {
  if (IS_TEST) { done && done(); return; }
  const im = document.createElement('img'); im.className = 'fly'; im.src = src; im.style.left = from.X + 'px'; im.style.top = from.Y + 'px'; $('fx').append(im);
  const r = toEl.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => { im.style.transform = `translate(${r.left + r.width/2 - from.X}px,${r.top + r.height/2 - from.Y}px) scale(.6)`; }));
  setTimeout(() => { im.remove(); done && done(); }, IS_TEST ? 0 : 720);
}
// lektor + napis na dole ekranu (przy wyciszonym telefonie rodzic może przeczytać)
let subT = null;
function say(txt, pilne) { lektor(txt, { pilne }); const e = $('sub'); e.textContent = txt; e.hidden = false; clearTimeout(subT); subT = setTimeout(() => { e.hidden = true; }, IS_TEST ? 0 : 5500); }
function banner(txt) { const d = document.createElement('div'); d.id = 'banner'; d.textContent = txt; $('fx').append(d); setTimeout(() => d.remove(), 2500); }

// palec-podpowiedź: nad elementem HUD albo nad punktem / zwierzakiem w świecie
let finger = null;
function pointAt(target, tag) { clearPoint(); finger = { target, tag, el: document.createElement('div') }; finger.el.id = 'finger'; finger.el.innerHTML = SVG.finger; $('fx').append(finger.el); placeFinger(); }
function clearPoint(tag) { if (finger && (!tag || finger.tag === tag)) { finger.el.remove(); finger = null; } }
function placeFinger() { if (!finger) return; const t = finger.target; let X, Y;
  if (t instanceof Element) { const r = t.getBoundingClientRect(); X = r.left + r.width/2; Y = r.bottom - 8; }
  else if (t.a) { if (!t.alive) { clearPoint(); return; } const s = toScreen(t.x, t.sp.h*.5, t.z); X = s.X; Y = s.Y; }
  else { const s = toScreen(t.x, t.y, t.z); X = s.X; Y = s.Y; }
  finger.el.style.left = X + 'px'; finger.el.style.top = Y + 'px'; }
// samouczek: słonecznik → grządka → marchewka → grządka
function tutorialSelected(k) { if (G.tut === 1 && k === 'beanstalk') { G.tut = 2; const t = tileAt(1, 2); pointAt({ x: t.x, y: .2, z: t.z }, 'tut'); }
  else if (G.tut === 3 && k === 'carrot') { G.tut = 4; const t = tileAt(3, 2); pointAt({ x: t.x, y: .2, z: t.z }, 'tut'); } }
function tutorialPlanted(k) { if (G.tut <= 2 && k === 'beanstalk') { G.tut = 3; say('Brawo! Teraz posadź marchewkę.', 1); pointAt(cardEl('carrot'), 'tut'); }
  else if (G.tut >= 3 && G.tut <= 4 && k === 'carrot') { G.tut = 5; clearPoint('tut'); say('Super! Marchewka rośnie. Uważaj na głodne zwierzaki!', 1); } }
const cardEl = k => $('cards').querySelector(`[data-k="${k}"]`);

/* =====================================================================
   SCENARIUSZ DNIA, NIEBO, KONIEC
   ===================================================================== */
let skySeedT = 6;
function runScript() {
  const S = DAY().script;
  while (G.script < S.length && S[G.script].t <= G.t) {
    const e = S[G.script++];
    if (e.unlock) unlock(e.unlock);
    if (e.spawn) { const n = e.n || 1; for (let i = 0; i < n; i++) G.queue.push({ t: G.t + (e.gap || 1)*i, k: e.spawn, row: e.row }); }
    if (e.rain !== undefined) { G.rain = !!e.rain; }
    if (e.horde) { SFX.drum(); banner(e.horde); }
    if (e.boss) { SFX.drum(); banner(e.boss); }
    if (e.say) say(e.say, !!e.spawn || !!e.horde || !!e.boss);
    if (e.tut) { G.tut = 1; pointAt(cardEl('beanstalk'), 'tut'); }
  }
}
function updateSky() { const k = G.t/DAY().len; setWeather(G.rain ? 'rain' : k < .12 ? 'dawn' : k < .55 ? 'sun' : k < .85 ? 'gold' : 'dusk'); }
function endDay() {
  G.ended = true; setSel(null); clearPoint();
  plants.filter(isRipe).forEach(P => { G.basket += P.card.crop; });
  hudBasket(); SFX.win(); ZOO.pose(farmer.a, 'cheer');
  const stars = DAY().stars.filter(n => G.basket >= n).length || 1, last = G.day === DAYS.length - 1;
  PROG[G.day] = Math.max(PROG[G.day] || 0, stars); saveProg();
  $('endStars').innerHTML = [0, 1, 2].map(i => STAR(i < stars).replace('<svg', `<svg class="${i < stars ? 'on' : ''}"`)).join('');
  $('endN').textContent = G.basket; $('bNext').hidden = last; $('endTitle').textContent = last ? 'Ogródek uratowany!' : 'Koniec dnia!';
  $('parade').hidden = !last; if (last) $('parade').innerHTML = ['rabbit', 'chicken', 'deer', 'mole', 'cow', 'goat', 'beaver', 'zebra', 'kangaroo', 'giraffe', 'elephant', 'hippo', 'panda', 'penguin', 'lion', 'farmer'].map((k, i) => `<img src="${ICONS[k]}" alt="" style="animation-delay:${(i*.12).toFixed(2)}s">`).join('');
  setTimeout(() => { $('end').hidden = false; $('hud').hidden = true; $('sub').hidden = true; confetti();
    lektor(last ? `Hura! Ogródek uratowany! Wszystkie zwierzaki są najedzone i idą spać. W koszu jest ${G.basket} ${plural(G.basket, 'warzywo', 'warzywa', 'warzyw')}. Jesteś super ogrodnikiem!`
      : `Koniec dnia! W koszu jest ${G.basket} ${plural(G.basket, 'warzywo', 'warzywa', 'warzyw')}. Brawo!`, { pilne: 1 }); }, IS_TEST ? 0 : 1200);
}
function confetti() { const c = $('confetti'); c.innerHTML = ''; for (let i = 0; i < 40; i++) { const im = document.createElement('img'); im.src = [ICONS.carrot, ICONS.wheat, ICONS.apple, ICONS.seed][i % 4];
  im.style.cssText = `position:absolute;top:-80px;left:${Math.random()*100}vw;width:${40 + Math.random()*30}px;animation:fall ${2.5 + Math.random()*2}s linear ${Math.random()*1.5}s forwards`; c.append(im); } setTimeout(() => c.innerHTML = '', 6000); }

/* =====================================================================
   PĘTLA
   ===================================================================== */
function update(dt) {
  if (G.run && !G.paused && !G.ended) {
    G.t += dt; runScript();
    for (const q of G.queue.slice()) if (q.t <= G.t) { G.queue.splice(G.queue.indexOf(q), 1); spawn(q.k, q.row); }
    if ((skySeedT -= dt) <= 0) { skySeedT = rr(11, 14); dropSeed(X0 + 1 + rnd()*(COLS*TS - 2), 9, Z0 + 1 + rnd()*(ROWS*TS - 2)); }
    updatePlants(dt); updateFalling(dt); updateAnimals(dt); updateFarmer(dt); updateHand(dt); updateDrops(dt); hudCards(dt);
    if (G.t >= DAY().len && (!animals.length || G.t > DAY().len + 30)) endDay();
  } else if (!G.run || G.ended) { updateFarmer(dt); }
  updateSky(); updateParticles(dt); updateRain(dt, camera);
  for (const c of clouds) { c.position.x += c.userData.v*dt; if (c.position.x > 160) c.position.x = -160; }
  tiles.forEach(t => { t.hl.visible = !!G.sel && !t.plant && G.run; }); hlMat.opacity = .25 + .2*Math.sin(G.t*6);
  placeFinger();
}
let hudT = 0;
function frame(dt) { update(dt); if ((hudT -= dt) <= 0) { hudT = .5; hudSun(); } renderer.render(scene, camera); }
const CAM = { el: 45, fov: 24, top: .22 };   // kąt kamery nad polem, kąt widzenia, górny brzeg pola (ułamek ekranu)
function fitCamera() {                 // pole od CAM.top do 98,5% wysokości ekranu (prawie z góry, wąski obiektyw = mało perspektywy), od ganku dziadka po skraj lasu; ?el= ?fov= ?top= do prób
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.clearViewOffset();
  const el = (+Q.get('el') || CAM.el)*PI/180, tgt = V3(1.4, 0, 0), top = +Q.get('top') || CAM.top, bot = .985;
  camera.fov = +Q.get('fov') || CAM.fov;
  const place = d => { camera.position.set(tgt.x, Math.sin(el)*d, tgt.z + Math.cos(el)*d); camera.lookAt(tgt); camera.updateProjectionMatrix(); camera.updateMatrixWorld(); };
  const fits = d => { place(d); const b = V3(0, 0, Z0 - 1.2).project(camera).y, f = V3(0, 0, -Z0 + 1.6).project(camera).y, xr = V3(tgt.x + 11.6, 0, -Z0 + 1.2).project(camera).x, xl = V3(PORCH.x - 1.2, 0, PORCH.z).project(camera).x;
    return b - f <= 2*(bot - top) && xr <= 1 && xl >= -1; };
  let lo = 5, hi = 120; for (let i = 0; i < 30; i++) { const m = (lo + hi)/2; if (fits(m)) hi = m; else lo = m; }
  place(hi);
  const b = V3(0, 0, Z0 - 1.2).project(camera).y, f = V3(0, 0, -Z0 + 1.6).project(camera).y, want = 1 - (top + bot), dy = want - (b + f)/2;
  camera.setViewOffset(w, h, 0, dy*h/2, w, h); camera.updateProjectionMatrix();
}
addEventListener('resize', fitCamera); fitCamera();
let last = performance.now();
function loop(now) { const dt = Math.min(.05, (now - last)/1000); last = now; frame(G.paused ? 0 : dt); requestAnimationFrame(loop); }
setWeather('dawn'); hudSun(); hudBasket(); addSeeds(0);

function startGame(day) {
  critAudioInit(); goFS(); if (typeof day === 'number') G.day = day; const D = DAY();
  // sprzątanie poprzedniego dnia
  animals.slice().forEach(kill); plants.slice().forEach(P => removePlant(P)); drops.slice().forEach(D => { scene.remove(D.g); }); drops.length = 0;
  Object.assign(G, { t: 0, run: true, paused: false, ended: false, seeds: D.seeds, basket: 0, sel: null, cd: {}, unlocked: new Set(D.start), script: 0, queue: [], rain: false, tut: 0, firsts: new Set(G.day ? ['ripe', 'seed', 'poor'] : []), stats: { eaten: 0, crops: 0, fled: 0, spawned: 0 } });
  farmer.x = PORCH.x; farmer.z = PORCH.z; ZOO.pose(farmer.a, null); skySeedT = 6;
  $('menu').hidden = $('end').hidden = $('pause').hidden = true; $('hud').hidden = false; buildCards(); hudBasket(); addSeeds(0); hudSun(); clearPoint(); setWeather('dawn');
  banner(`Dzień ${G.day + 1}`);
  (Q.get('zw') || '').split(',').filter(Boolean).forEach((k, i) => G.queue.push({ t: 2 + i*1.5, k }));
}
tap('bAgain', () => startGame()); tap('bRestart', () => startGame()); tap('bNext', () => startGame(Math.min(DAYS.length - 1, G.day + 1)));
// menu: dni z gwiazdkami (zapis w przeglądarce); następny dzień otwiera się po ukończeniu poprzedniego
const PROG = (() => { try { return JSON.parse(localStorage.getItem('ogrodek-postep')) || []; } catch (e) { return []; } })();
if (Q.has('wszystkie')) DAYS.forEach((d, i) => PROG[i] = PROG[i] || 1);
function saveProg() { try { localStorage.setItem('ogrodek-postep', JSON.stringify(PROG)); } catch (e) {} }
const dayOpen = i => i === 0 || (PROG[i - 1] || 0) > 0;
function showMenu() {
  G.run = false; G.ended = false; G.paused = false; animals.slice().forEach(kill); $('end').hidden = $('pause').hidden = $('hud').hidden = true; $('menu').hidden = false;
  if (window.speechSynthesis) speechSynthesis.cancel();
  $('days').innerHTML = DAYS.map((d, i) => `<button class="day${dayOpen(i) ? '' : ' locked'}" data-i="${i}" aria-label="Dzień ${i + 1}: ${d.name}"><img src="${ICONS[d.hero]}" alt=""><b>${i + 1}</b>` +
    `<span class="st">${[0, 1, 2].map(k => STAR(k < (PROG[i] || 0))).join('')}</span>${dayOpen(i) ? '' : `<span class="lk">${SVG.lock}</span>`}</button>`).join('');
  $('days').querySelectorAll('.day').forEach(b => b.addEventListener('click', e => { e.preventDefault(); const i = +b.dataset.i; if (!dayOpen(i)) { SFX.ouch && critAudioInit(); SFX.ouch(); return; } startGame(i); }));
}
showMenu();
tap('bPause', () => { G.paused = true; $('pause').hidden = false; if (window.speechSynthesis) speechSynthesis.cancel(); });
tap('bResume', () => { G.paused = false; $('pause').hidden = true; });
const toggleSnd = () => { G.muted = !G.muted; try { localStorage.setItem('ogrodek-cisza', G.muted ? '1' : '0'); } catch (e) {} lektorWl(!G.muted); if (AU.master) AU.master.gain.value = G.muted ? 0 : .8; sndIcons(); };
tap('bSnd', toggleSnd); tap('bSnd2', toggleSnd); lektorWl(!G.muted);
tap('bHome', showMenu); tap('bHome2', showMenu); tap('bGames', () => { location.href = '../'; });

if (IS_TEST) { window.TEST = { G, animals, plants, tiles, spawn, plantAt, onTap, toScreen, startGame, harvest, showMenu, PROG,
  step(sec, dt = 1/30) { for (let t = 0; t < sec; t += dt) update(dt); hudSun(); }, render() { renderer.render(scene, camera); } }; renderer.render(scene, camera); }
else requestAnimationFrame(loop);
