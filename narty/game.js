'use strict';
// Narty — pingwin zjeżdża ze stoku na brzuchu i nartach. Sterowanie przechylaniem telefonu (żyroskop, lib/input/tilt.js):
// w lewo / w prawo = skręt, do przodu = szybciej, do tyłu = wolniej. Bez żyroskopu: guziki ◀ ▶ + „szybciej” albo klawiatura (strzałki, WASD).
// Bez przegranej: drzewo i kamień tylko przewracają pingwina (zwalniają), bałwan się rozpada, skocznia daje salto, rybki to wynik (1–3 gwiazdki).
// ?test — bez pętli rAF (testy: TEST.step(s), TEST.render(), tools/quick.mjs); ?lite — słaba grafika; ?s=123 — ziarno trasy; ?ctrl=buttons.
if (!window.THREE) { $('err').style.display = 'flex'; $('load').hidden = true; throw new Error('brak three.js'); }

const Q = new URLSearchParams(location.search), IS_TEST = Q.has('test');
const BASE_V = 13, MAX_V = 22, MIN_V = 7, GRAV = 16, MAX_PSI = .8, COUNT_S = 2.7;

/* =====================================================================
   RENDERER, SCENA, ŚWIATŁO (słaba grafika: SwiftShader / ?lite — mniej pikseli, bez wygładzania)
   ===================================================================== */
const GL_NAME = (() => { try { const g = document.createElement('canvas').getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { return ''; } })();
const LITE = !Q.has('hq') && (Q.has('lite') || /swiftshader|llvmpipe|software/i.test(GL_NAME));
const renderer = new T.WebGLRenderer({ canvas: $('c'), antialias: !LITE, powerPreference: 'high-performance' });
renderer.setPixelRatio(LITE ? (IS_TEST ? 1 : .6) : Math.min(devicePixelRatio || 1, 1.75));
const scene = new T.Scene(); scene.background = new T.Color(0xa9d8f5); scene.fog = new T.Fog(0xcfe6f5, 60, 240);
const camera = new T.PerspectiveCamera(58, 1, .3, 700); scene.add(camera);
scene.add(new T.HemisphereLight(0xe4f1ff, 0x8fa9cc, .62));
const sunL = new T.DirectionalLight(0xfff0d0, 1.1); sunL.position.set(-40, 80, -30); scene.add(sunL);
const resize = fitView(renderer, camera); addEventListener('resize', resize); resize();
ZOO.cfg.cast = false;
particlesInit(scene, LITE ? 260 : 700);
const V3 = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const dummy = new T.Object3D();

/* =====================================================================
   STAN
   ===================================================================== */
const S = { mode: 'menu', ctrl: Q.get('ctrl') === 'buttons' ? 'buttons' : 'tilt', muted: false, seed: 1, t: 0, runT: 0, cd: 0, cdN: 9, got: 0, hits: 0, tricks: 0, paused: false, camSnap: true, finT: 0, force: null, best: null, first: true };
const P = { x: 0, y: 0, s: 0, psi: 0, v: 0, vy: 0, air: false, airT: 0, trick: false, flip: 0, rampT: 0, hit: 0, inv: 0, camYaw: 0, pitch: 0, roll: 0, pts: 0 };
const keys = { left: 0, right: 0, fast: 0, up: 0, down: 0 };
try { const sv = JSON.parse(localStorage.getItem('narty') || 'null'); if (sv) { if (!Q.has('ctrl') && (sv.ctrl === 'tilt' || sv.ctrl === 'buttons')) S.ctrl = sv.ctrl; S.muted = !!sv.muted; S.best = sv.best || null; } } catch (e) {}
const save = () => { try { localStorage.setItem('narty', JSON.stringify({ ctrl: S.ctrl, muted: S.muted, best: S.best })); } catch (e) {} };
AU.muted = () => S.muted;

/* =====================================================================
   PINGWIN (model ze wspólnych „słodziaków”, leży na brzuchu na nartach)
   ===================================================================== */
const C0 = .55;                                                   // środek obrotu salta nad ziemią
const rig = new T.Group(); rig.rotation.order = 'YXZ'; scene.add(rig);
const spinG = new T.Group(); spinG.rotation.order = 'YXZ'; spinG.position.y = C0; rig.add(spinG);
const peng = ZOO.fit('penguin', 1.9), body = new T.Group(); body.rotation.x = PI/2; body.position.set(0, .56 - C0, -.72); body.add(peng.g); spinG.add(body);
{ const mSki = lam(0xff5a3c), mTip = lam(0x1d2b3c);
  for (const s of [-1, 1]) { const ski = mesh(new T.BoxGeometry(.16, .07, 2.3), mSki, s*.3, .07 - C0, -.05, spinG); mesh(new T.BoxGeometry(.16, .06, .3), mTip, s*.3, .1 - C0, 1.18, spinG).rotation.x = -.35; ski.userData.s = s; } }
ZOO.pose(peng.a, { wing: .9, head: 1.85 });
const shadow = new T.Mesh(new T.CircleGeometry(1, 18).rotateX(-PI/2), new T.MeshBasicMaterial({ color: 0x24456e, transparent: true, opacity: .3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); scene.add(shadow);

/* =====================================================================
   ŚWIAT: teren, drzewa, kamienie, bałwany, skocznie, rybki, łuki, góry
   ===================================================================== */
let WG = null, fishB = null, fishT = null, snowmen = [], debris = [], mCount = 0;
const mTrunk = lam(0x7a4e2c), mLeaf = lam(0xffffff), mSnowW = lam(0xf4fbff), mRock = lam(0x8d9bb0, { flatShading: true });
const TREE_COL = [0x2f7d46, 0x3a8f4f, 0x2a6e44, 0x4a9a55].map(c => new T.Color(c));
const GEO = {
  trunk: new T.CylinderGeometry(.22, .3, 1.4, 6).translate(0, .7, 0), c1: new T.ConeGeometry(1.8, 2.8, 8).translate(0, 2.7, 0), c2: new T.ConeGeometry(1.3, 2.3, 8).translate(0, 3.85, 0),
  cap: new T.ConeGeometry(.78, 1.1, 8).translate(0, 4.65, 0), rock: new T.DodecahedronGeometry(1, 0),
  fishB: new T.SphereGeometry(.5, 10, 8).scale(1.1, .55, .38), fishT: new T.ConeGeometry(.3, .45, 6).rotateZ(-PI/2).scale(1, 1, .3).translate(-.72, 0, 0),
};

function terrainMesh() {
  const s0 = -40, s1 = CRS.L + 90, st = COURSE.STEP, nr = Math.round((s1 - s0)/st) + 1, nc = Math.round(COURSE.HALF*2/st) + 1;
  const pos = new Float32Array(nr*nc*3), col = new Float32Array(nr*nc*3), idx = [];
  for (let i = 0; i < nr; i++) { const s = s0 + i*st, cx = centerX(s);
    for (let j = 0; j < nc; j++) { const dx = -COURSE.HALF + j*st, x = cx + dx, k = (i*nc + j)*3, e = Math.max(0, Math.abs(dx) - COURSE.W);
      pos[k] = x; pos[k + 1] = terrainY(s, x); pos[k + 2] = s;
      const n = .5 + .5*Math.sin(s*.9 + x*.7)*Math.sin(s*.37 - x*.5), c = .93 + .07*n - Math.min(.1, e*.006);
      col[k] = c*.95; col[k + 1] = c*.98; col[k + 2] = c; } }
  for (let i = 0; i < nr - 1; i++) for (let j = 0; j < nc - 1; j++) { const a = i*nc + j, b = a + 1, c = a + nc, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true }));
}
function instanced(geo, mat, list, fn) {
  const m = new T.InstancedMesh(geo, mat, Math.max(1, list.length));
  list.forEach((o, i) => { fn(dummy, o, i, m); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
  m.count = list.length; m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; return m;
}
function addTrees(g) {
  const list = CRS.trees.concat(CRS.obst.filter(o => o.k === 'tree'));
  const place = (d, o) => { d.position.set(o.x, terrainY(o.s, o.x) - .1, o.s); d.rotation.set(0, o.a, 0); d.scale.set(o.sc, o.sc*(.9 + (o.a % 1)*.3), o.sc); };
  g.add(instanced(GEO.trunk, mTrunk, list, place));
  for (const k of ['c1', 'c2']) { const m = instanced(GEO[k], mLeaf, list, (d, o, i, mm) => { place(d, o); mm.setColorAt(i, TREE_COL[Math.floor((o.c !== undefined ? o.c*4 : o.a) % 4)] || TREE_COL[0]); }); g.add(m); }
  g.add(instanced(GEO.cap, mSnowW, list, place));
  const rocks = CRS.obst.filter(o => o.k === 'rock');
  if (rocks.length) g.add(instanced(GEO.rock, mRock, rocks, (d, o) => { d.position.set(o.x, terrainY(o.s, o.x) + .15, o.s); d.rotation.set(o.a, o.a*2, 0); d.scale.set(o.sc*1.05, o.sc*.75, o.sc*.9); }));
}
function snowman(o) {
  const g = new T.Group(), w = lam(0xffffff), add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new T.SphereGeometry(.78, 14, 10), w, 0, .7, 0); add(new T.SphereGeometry(.56, 12, 9), w, 0, 1.68, 0); add(new T.SphereGeometry(.42, 12, 9), w, 0, 2.42, 0);
  add(new T.ConeGeometry(.07, .4, 6), lam(0xff8a1c), 0, 2.42, -.5).rotation.x = -PI/2;
  for (const s of [-1, 1]) { add(new T.SphereGeometry(.06, 6, 5), lam(0x111111), s*.15, 2.52, -.38); add(new T.SphereGeometry(.07, 6, 5), lam(0x111111), 0, 1.7 + s*.28, -.54); }
  add(new T.CylinderGeometry(.3, .3, .34, 10), lam(0x222a36), 0, 2.98, 0); add(new T.CylinderGeometry(.5, .5, .06, 10), lam(0x222a36), 0, 2.82, 0);
  g.position.set(o.x, terrainY(o.s, o.x) - .05, o.s); g.scale.setScalar(o.sc); g.rotation.y = (o.a - PI)*.15; o.g = g; return g;
}
function rampMesh(r) {
  const NS = 6, NW = 2, pos = [], col = [], top = (i, j) => { const s = r.s0 + r.len*i/NS, x = r.x - r.wid/2 + r.wid*j/NW; return [x, terrainY(s, x) + r.h*i/NS + .04, s]; };
  const low = p => [p[0], terrainY(p[2], p[0]) - .3, p[2]], quad = (a, b, c, d, cl) => { for (const p of [a, b, c, a, c, d]) { pos.push(...p); col.push(cl[0], cl[1], cl[2]); } };
  for (let i = 0; i < NS; i++) for (let j = 0; j < NW; j++) quad(top(i, j), top(i + 1, j), top(i + 1, j + 1), top(i, j + 1), i % 2 ? [.55, .78, 1] : [.85, .94, 1]);
  for (let i = 0; i < NS; i++) { quad(top(i, 0), low(top(i, 0)), low(top(i + 1, 0)), top(i + 1, 0), [.5, .62, .8]); quad(top(i, NW), top(i + 1, NW), low(top(i + 1, NW)), low(top(i, NW)), [.5, .62, .8]); }
  for (let j = 0; j < NW; j++) quad(top(NS, j), low(top(NS, j)), low(top(NS, j + 1)), top(NS, j + 1), [.5, .62, .8]);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }));
  for (const s of [-1, 1]) { const p = top(NS, s > 0 ? NW : 0); mesh(new T.CylinderGeometry(.05, .05, 1.6, 5), lam(0xff7a2c), p[0], p[1] + .8, p[2], m); mesh(new T.ConeGeometry(.35, .8, 6), lam(0xff7a2c), p[0], p[1] + 1.9, p[2], m); }
  return m;
}
function archMesh(text, s, col) {
  const g = new T.Group(), cx = centerX(s), y = terrainY(s, cx), half = COURSE.W + 1, h = 5.2;
  for (const k of [-1, 1]) { const x = cx + k*half; mesh(new T.CylinderGeometry(.22, .22, h, 8), lam(0xffffff), x, terrainY(s, x) + h/2 - .3, s, g); mesh(new T.CylinderGeometry(.24, .24, .6, 8), lam(col), x, terrainY(s, x) + 1.1, s, g); }
  const t = tex(512, 128, (c, w, hh) => { c.fillStyle = '#' + col.toString(16).padStart(6, '0'); c.fillRect(0, 0, w, hh); c.fillStyle = '#fff';
    for (let i = 0; i < 32; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) c.fillRect(i*16, j*16 + (j ? hh - 32 : 0), 16, 16);
    c.font = '800 78px "Baloo 2",Arial Rounded MT Bold,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = '#14385c'; c.strokeText(text, w/2, hh/2 + 4); c.fillStyle = '#fff'; c.fillText(text, w/2, hh/2 + 4); });
  const ban = new T.Mesh(new T.PlaneGeometry(half*2, 2.4), new T.MeshBasicMaterial({ map: t, side: T.DoubleSide, fog: true })); ban.position.set(cx, y + h - 1, s); g.add(ban);
  return g;
}
function buildWorld(sd) {
  if (WG) { scene.remove(WG); WG.traverse(o => { if (o.geometry && o.geometry !== GEO.fishB && o.geometry !== GEO.fishT && !Object.values(GEO).includes(o.geometry)) o.geometry.dispose(); }); }
  courseBuild(sd); S.seed = sd; WG = new T.Group(); scene.add(WG); snowmen = []; debris.length = 0;
  WG.add(terrainMesh()); addTrees(WG);
  for (const o of CRS.obst) if (o.k === 'snowman') { WG.add(snowman(o)); snowmen.push(o); }
  for (const r of CRS.ramps) WG.add(rampMesh(r));
  WG.add(archMesh('START', 4, 0xff6a4a), archMesh('META', CRS.goals.finish, 0x2fa8ff));
  // rybki: instancje, co klatkę obracane (updFish)
  for (const f of CRS.fish) f.y = groundY(f.s, f.x) + f.up;
  fishB = new T.InstancedMesh(GEO.fishB, lam(0x3aa8ff), CRS.fish.length); fishT = new T.InstancedMesh(GEO.fishT, lam(0xff9f1c), CRS.fish.length);
  fishB.frustumCulled = fishT.frustumCulled = false; WG.add(fishB, fishT);
  // góry w oddali
  const mt = [], L = CRS.L; for (let s = -60; s < L + 260; s += 85) for (const k of [-1, 1]) mt.push({ s, x: centerX(Math.min(s, L)) + k*(115 + rr(0, 40)), sc: rr(.8, 1.4), a: 0 });
  for (let x = -160; x <= 160; x += 80) mt.push({ s: L + 300, x: centerX(L) + x, sc: 1.5, a: 0 });
  WG.add(instanced(new T.ConeGeometry(70, 110, 7).translate(0, 55, 0), lam(0xd5e5f3, { flatShading: true }), mt, (d, o) => { d.position.set(o.x, baseAt(Math.min(o.s, L)) + 8, o.s); d.rotation.set(0, o.sc*3, 0); d.scale.set(o.sc, o.sc, o.sc); }));
  updFish(0); hud();
}
function updFish(t) {
  CRS.fish.forEach((f, i) => { const k = f.got ? 0 : 1; dummy.position.set(f.x, f.y + Math.sin(t*3 + i)*.12, f.s); dummy.rotation.set(0, t*1.8 + i, Math.sin(t*2 + i)*.15); dummy.scale.setScalar(k*1.5); dummy.updateMatrix(); fishB.setMatrixAt(i, dummy.matrix); fishT.setMatrixAt(i, dummy.matrix); });
  fishB.instanceMatrix.needsUpdate = fishT.instanceMatrix.needsUpdate = true;
}

/* =====================================================================
   DŹWIĘK
   ===================================================================== */
let wind = null;
function audioInit() {
  critAudioInit(); if (AU.master) AU.master.gain.value = S.muted ? 0 : .8;
  if (!wind && AU.ctx && AU.noiseBuf) { const c = AU.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = AU.noiseBuf; src.loop = true; f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = .6; g.gain.value = 0; src.connect(f); f.connect(g); g.connect(AU.master); src.start(); wind = { f, g }; }
}
const snd = {
  fish() { tone(880, .1, 'sine', .22, 1320); tone(1320, .14, 'triangle', .18, 1760, .07); },
  bonk() { burst(260, .22, .5, 0, 1, 'lowpass'); tone(160, .22, 'sine', .4, 70); },
  smash() { burst(1800, .25, .35, 0, .8); burst(500, .3, .3, .05); },
  jump() { tone(300, .28, 'sine', .25, 760); SFX.call('penguin'); },
  land() { burst(700, .18, .28, 0, .8, 'lowpass'); },
  trick() { [660, 880, 1100].forEach((f, i) => tone(f, .14, 'triangle', .22, f*1.2, i*.08)); },
  fin() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .28, 'triangle', .28, f, i*.14)); },
  tick(go) { tone(go ? 880 : 440, go ? .3 : .15, 'square', .12); },
};
function windUpd() { if (!wind || !AU.ctx) return; const k = S.mode === 'run' || S.mode === 'finish' ? P.v/MAX_V : 0, t = AU.ctx.currentTime; wind.g.gain.setTargetAtTime(S.muted ? 0 : (P.air ? .03 : .015 + .09*k*k), t, .1); wind.f.frequency.setTargetAtTime(350 + k*1300, t, .1); }

/* =====================================================================
   STEROWANIE
   ===================================================================== */
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'fast' };
addEventListener('keydown', e => { const k = KEYMAP[e.code]; if (k) { keys[k] = 1; e.preventDefault(); } if (e.code === 'Escape' && (S.mode === 'run')) pauseGame(); });
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = 0; });
holdBtn('pL', 'left', keys); holdBtn('pR', 'right', keys); holdBtn('pF', 'fast', keys);
addEventListener('orientationchange', () => { tilt.cal = true; });
function readInput() {
  if (S.force) return S.force;
  let u = keys.right - keys.left, sy = keys.up ? 1 : keys.down ? -1 : keys.fast ? 1 : 0;
  if (tilt.on) { u = tiltCurve(tilt.x, .07, .85); sy = tiltCurve(tilt.y, .12, .85); }
  return { u, sy };
}
// autopilot do testów: omija przeszkody i zbiera rybki
function botInput() {
  const cx = centerX(P.s); let best = 0, bc = 1e9;
  for (let l = -8; l <= 8; l += 1) { let c = Math.abs(cx + l - P.x)*.35 + Math.abs(l)*.04;
    for (const o of CRS.obst) { const ds = o.s - P.s; if (ds < 1 || ds > 30) continue; const d = Math.abs(o.x - (cx + l)); if (d < 2.6) c += (3 - d)*40/(1 + ds*.15); }
    for (const f of CRS.fish) { const ds = f.s - P.s; if (f.got || ds < 2 || ds > 18) continue; if (Math.abs(f.x - (cx + l)) < 1.6) c -= 1.2; }
    if (c < bc) { bc = c; best = l; } }
  const tx = cx + best, psiT = clamp((tx - P.x)*.16, -MAX_PSI, MAX_PSI); return { u: psiT/MAX_PSI, sy: 0 };
}

/* =====================================================================
   FIZYKA I ZASADY
   ===================================================================== */
const showBig = txt => { const b = $('big'); b.textContent = txt; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); };
function resetPlayer() {
  Object.assign(P, { s: 4, x: centerX(4), psi: 0, v: 0, vy: 0, air: false, airT: 0, trick: false, flip: 0, rampT: 0, hit: 0, inv: 0, pitch: 0, roll: 0, camYaw: 0 });
  P.y = groundY(P.s, P.x); S.got = 0; S.hits = 0; S.tricks = 0; S.runT = 0; S.finT = 0; poseRig(0); S.camSnap = true;
}
function puff(x, y, z, n, sp, r = 1, g = 1, b = 1) { for (let i = 0; i < n; i++) emit(x + rr(-.4, .4), y + .2, z + rr(-.4, .4), rr(-sp, sp), rr(sp*.4, sp*1.2), rr(-sp, sp), rr(.4, .9), r, g, b, 7); }
function hitObst(o) {
  if (o.k === 'snowman') { o.hit = true; S.hits++; P.v *= .85; P.inv = .35; snd.smash(); puff(o.x, groundY(o.s, o.x) + 1.4, o.s, 24, 3.4);
    for (const m of o.g.children.slice()) { scene.attach(m); debris.push({ m, vx: (m.position.x - P.x)*1.2 + rr(-1.5, 1.5), vy: rr(3, 7), vz: rr(2, 6) + P.v*.25, spin: rr(-6, 6), t: 2.2 }); }
    scene.remove(o.g); return; }
  S.hits++; P.hit = 1.1; P.inv = 1.8; P.v *= .35; P.psi = (P.x >= o.x ? 1 : -1)*.5; snd.bonk(); puff(P.x, P.y + .5, P.s + .6, 18, 3);
  if (S.first || S.hits === 3) { lektor('Ups!', { pilne: true }); toast('Ups! Omijaj drzewa i kamienie', 2200); }
  S.first = false;
}
function takeFish(f) { f.got = true; S.got++; P.pts++; snd.fish(); puff(f.x, f.y, f.s, 8, 2, 1, .85, .3); const e = $('sFish'); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); hud(); }
function hud() { $('nFish').textContent = S.got; $('tFish').textContent = '/' + (CRS ? CRS.total : 0); }
function physics(dt) {
  const fin = S.mode === 'finish', run = S.mode === 'run', count = S.mode === 'count';
  const inp = count ? { u: 0, sy: 0 } : fin ? { u: 0, sy: -1 } : readInput();
  P.hit = Math.max(0, P.hit - dt); P.inv = Math.max(0, P.inv - dt); P.rampT = Math.max(0, P.rampT - dt);
  let vt = inp.sy >= 0 ? lerp(BASE_V, MAX_V, inp.sy) : lerp(BASE_V, MIN_V, -inp.sy); if (count) vt = 0; if (fin) vt = 0;
  if (P.air) vt = Math.max(vt, P.v*.97);
  P.v += (vt - P.v)*Math.min(1, dt*(count ? 9 : vt > P.v ? .9 : fin ? 1.1 : 2.2));
  if (count) P.v = 0;
  if (run && P.v < 5) P.v = 5;
  const cx = centerX(P.s), dx = P.x - cx; let psiT = inp.u*MAX_PSI*(P.hit > 0 ? .3 : 1);
  if (Math.abs(dx) > 9 && !fin) psiT -= Math.sign(dx)*(Math.abs(dx) - 9)*.12;
  P.psi += (psiT - P.psi)*Math.min(1, dt*(P.air ? 2 : 5.5));
  P.x += P.v*Math.sin(P.psi)*dt; P.s += P.v*Math.cos(P.psi)*dt;
  const ex = P.x - centerX(P.s); if (Math.abs(ex) > 14.5) { P.x = centerX(P.s) + Math.sign(ex)*14.5; P.psi -= Math.sign(ex)*.05; P.v *= .995; }
  if (dt > 1e-4) {
    const gh = groundY(P.s, P.x); if (rampLift(P.s, P.x) > .3) P.rampT = .5;
    if (!P.air) { const yb = P.y + P.vy*dt - .5*GRAV*dt*dt;
      if (gh >= yb - .03) { P.vy = clamp((gh - P.y)/dt, -22, 22); P.y = gh; }
      else { P.air = true; P.airT = 0; P.y = yb; P.vy -= GRAV*dt; P.trick = P.rampT > 0 && P.y - gh > .1; if (P.trick) { P.flip = 0; snd.jump(); } } }
    else { P.vy -= GRAV*dt; P.y += P.vy*dt; P.airT += dt; if (P.trick && P.flip < TAU) P.flip = Math.min(TAU, P.flip + dt*7.2);
      if (P.y <= gh) { P.air = false; P.y = gh; P.vy = 0; snd.land(); puff(P.x, P.y, P.s, 12, 3); if (P.trick && P.flip >= TAU - .6) { S.tricks++; snd.trick(); showBig('Super!'); lektor('Super!', { pilne: true }); } P.trick = false; } }
  }
  if (!P.air && P.flip > 0) P.flip = P.flip > PI ? Math.min(TAU, P.flip + dt*9) : Math.max(0, P.flip - dt*9);
  if (P.flip >= TAU && !P.air) P.flip = 0;
  if (run && P.inv <= 0) for (const o of CRS.obst) { if (Math.abs(o.s - P.s) > 3 || (o.hit && o.k === 'snowman')) continue;
    if (Math.hypot(o.s - P.s, o.x - P.x) < o.r + .6 && !(P.air && P.y - groundY(o.s, o.x) > 1.5)) { hitObst(o); break; } }
  if (run || fin) for (const f of CRS.fish) { if (f.got || Math.abs(f.s - P.s) > 2) continue; if (Math.hypot(f.s - P.s, f.x - P.x) < 1.7 && Math.abs(f.y - (P.y + .5)) < 1.9) takeFish(f); }
  if (run) { S.runT += dt; if (P.s >= CRS.goals.finish) finishRun(); }
  if (fin) { S.finT += dt; if (P.v < .6 || S.finT > 4.5) endRun(); }
  // ślad za pingwinem
  if (!P.air && P.v > 3 && (run || fin)) { const n = Math.min(3, Math.ceil(P.v*dt*1.4 + Math.random())); for (let i = 0; i < n; i++) emit(P.x - Math.sin(P.psi)*1.2 + rr(-.5, .5), P.y + .15, P.s - Math.cos(P.psi)*1.2, rr(-1.2, 1.2) - Math.sin(P.psi)*P.v*.12, rr(.8, 2.4), rr(-1, 1) - Math.cos(P.psi)*P.v*.12, rr(.35, .7), 1, 1, 1, 6); }
}
function poseRig(dt) {
  const f = V3(Math.sin(P.psi), 0, Math.cos(P.psi)), r = V3(Math.cos(P.psi), 0, -Math.sin(P.psi)), d = 1.1;
  const gA = groundY(P.s + f.z*d, P.x + f.x*d), gB = groundY(P.s - f.z*d, P.x - f.x*d), gR = groundY(P.s + r.z*d, P.x + r.x*d), gL = groundY(P.s - r.z*d, P.x - r.x*d);
  let pt = Math.atan2(gA - gB, 2*d), rl = Math.atan2(gR - gL, 2*d);
  if (P.air) pt = clamp(Math.atan2(P.vy, Math.max(4, P.v)), -.9, .9);
  const k = dt ? Math.min(1, dt*(P.air ? 4 : 10)) : 1; P.pitch += (pt - P.pitch)*k; P.roll += (rl - P.roll)*k;
  const lean = -P.psi*.35; rig.position.set(P.x, P.y, P.s);
  rig.rotation.set(-P.pitch, P.psi, P.roll + lean);
  const hitK = P.hit > 0 ? 1 - P.hit/1.1 : 0; spinG.rotation.set(P.flip + (P.hit > 0 ? Math.sin(hitK*PI)*.5 : 0), hitK*TAU, 0);
  const g0 = groundY(P.s, P.x), nx = (groundY(P.s, P.x - 1) - groundY(P.s, P.x + 1))/2, nz = (groundY(P.s - 1, P.x) - groundY(P.s + 1, P.x))/2;
  shadow.position.set(P.x, g0 + .08, P.s); shadow.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(nx, 1, nz).normalize());
  const h = clamp(1 - (P.y - g0)/6, .25, 1); shadow.scale.set(.75*h, 1, 1.25*h);
  const cheer = S.mode === 'finish' || P.air; ZOO.pose(peng.a, cheer ? { wing: 1.4, head: 1.6, jaw: .6 } : { wing: .9 + Math.abs(P.psi)*.5, head: 1.85 });
  peng.a.moving = false; ZOO.anim(peng.a, dt);
}
function updDebris(dt) { for (let i = debris.length - 1; i >= 0; i--) { const d = debris[i]; d.t -= dt; d.m.position.x += d.vx*dt; d.m.position.z += d.vz*dt; d.vy -= GRAV*dt; d.m.position.y += d.vy*dt; d.m.rotation.x += d.spin*dt;
  const gy = terrainY(d.m.position.z, d.m.position.x) + .3; if (d.m.position.y < gy) { d.m.position.y = gy; d.vy *= -.3; d.vx *= .7; d.vz *= .7; d.spin *= .6; }
  if (d.t < .5) d.m.scale.multiplyScalar(1 - dt*2); if (d.t <= 0) { scene.remove(d.m); debris.splice(i, 1); } } }

/* =====================================================================
   KAMERA
   ===================================================================== */
function updCam(dt) {
  if (S.mode === 'menu') { const a = S.t*.3, tx = P.x + Math.sin(a)*3.4 + 1.2, ty = P.y + 1.6, tz = P.s + 6.6 + Math.cos(a)*.6; camera.position.set(tx, Math.max(ty, terrainY(tz, tx) + 1), tz); camera.lookAt(P.x, P.y + .8, P.s); camera.fov = 52; camera.updateProjectionMatrix(); return; }
  P.camYaw += (P.psi*.5 - P.camYaw)*Math.min(1, dt*2.5);
  const fx = Math.sin(P.camYaw), fz = Math.cos(P.camYaw), back = 6.6, tx = P.x - fx*back, tz = P.s - fz*back, ty = P.y + 2.9;
  const k = S.camSnap ? 1 : 1 - Math.exp(-dt*5), ky = S.camSnap ? 1 : 1 - Math.exp(-dt*3);
  camera.position.x += (tx - camera.position.x)*k; camera.position.z += (tz - camera.position.z)*k; camera.position.y += (ty - camera.position.y)*ky;
  camera.position.y = Math.max(camera.position.y, terrainY(camera.position.z, camera.position.x) + 1.7);
  const lx = P.x + fx*9, lz = P.s + fz*9, ly = groundY(lz, lx) + 1.2;
  camera.lookAt(lx, ly, lz); S.camSnap = false;
  const fov = 56 + (P.v/MAX_V)*10 + (P.air ? 3 : 0); if (Math.abs(camera.fov - fov) > .05) { camera.fov += (fov - camera.fov)*Math.min(1, dt*3); camera.updateProjectionMatrix(); }
}

/* =====================================================================
   PRZEBIEG GRY I MENU
   ===================================================================== */
function update(dt) {
  S.t += dt;
  if (S.mode === 'count') { S.cd -= dt; const n = Math.ceil(S.cd - .15);
    if (n !== S.cdN) { S.cdN = n; if (n > 0) { showBig(String(n)); snd.tick(false); } else { showBig('Jazda!'); snd.tick(true); lektor('Jazda!', { pilne: true }); } }
    if (S.cd <= .15) { S.mode = 'run'; tilt.cal = true; } }
  if (S.mode === 'count' || S.mode === 'run' || S.mode === 'finish') { physics(dt); updDebris(dt); }
  poseRig(dt); updFish(S.t); updateParticles(dt); windUpd(); updCam(dt);
  const fr = clamp(P.s/CRS.goals.finish, 0, 1); $('progI').style.left = fr*100 + '%';
}
function finishRun() { S.mode = 'finish'; S.finT = 0; snd.fin(); showBig('Meta!'); lektor('Meta! Brawo!', { pilne: true }); for (let i = 0; i < 40; i++) emit(P.x + rr(-5, 5), P.y + rr(2, 6), P.s + rr(-2, 4), rr(-2, 2), rr(1, 4), rr(-2, 2), rr(1, 2), Math.random(), Math.random(), Math.random(), 2); }
function endRun() {
  if (S.mode === 'end') return; S.mode = 'end'; const pct = S.got/Math.max(1, CRS.total), stars = pct >= .6 ? 3 : pct >= .3 ? 2 : 1;
  const b = S.best || {}; const nw = !b.stars || stars > b.stars || (stars === b.stars && S.got > (b.fish || 0)); if (nw) { S.best = { stars, fish: S.got, time: Math.round(S.runT) }; save(); }
  $('stars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= stars ? '' : 'off'}">⭐</span>`).join('');
  $('eFish').textContent = `🐟 ${S.got} z ${CRS.total} rybek`; $('eTime').textContent = `⏱️ ${Math.round(S.runT)} s` + (S.tricks ? `  ·  🤸 ${S.tricks}` : '');
  $('eBest').textContent = nw ? 'Nowy rekord!' : `Najlepiej: ${'⭐'.repeat(b.stars)}  ${b.fish} 🐟`;
  $('end').hidden = false; $('hud').hidden = true; lektor(stars === 3 ? 'Wspaniale! Trzy gwiazdki!' : 'Brawo!');
}
function newRun(sd) { buildWorld(sd || (Q.has('s') ? +Q.get('s') : (Math.random()*9000 | 0) + 1)); resetPlayer(); }
function syncMenu() {
  document.querySelectorAll('[data-ctrl]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ctrl === S.ctrl));
  $('sndIco').textContent = S.muted ? '🔇' : '🔊'; if (window.lektorWl) lektorWl(!S.muted);
  $('mFoot').textContent = S.ctrl === 'tilt' ? 'Pochyl telefon w lewo albo w prawo, żeby skręcić. Do przodu — szybciej, do tyłu — wolniej.' : 'Trzymaj ◀ ▶, żeby skręcać, i 💨, żeby jechać szybciej. Na komputerze: strzałki.';
  const b = S.best; $('mSub').textContent = b ? `Najlepiej: ${'⭐'.repeat(b.stars)}  ${b.fish} 🐟` : 'Pingwin zjeżdża ze stoku! Zbieraj rybki i omijaj drzewa.';
}
function showMenu(paused) { S.paused = !!paused; if (!paused) { S.mode = 'menu'; newRun(); } $('menu').hidden = false; $('end').hidden = true; $('hud').hidden = !paused; $('bBack').hidden = !paused; $('bGo').textContent = paused ? 'Od nowa' : 'Zjeżdżamy!'; syncMenu(); }
function pauseGame() { if (S.mode !== 'run' && S.mode !== 'count') return; S.paused = true; S.prev = S.mode; S.mode = 'pause'; for (const k in keys) keys[k] = 0; showMenu(true); }
async function go() {
  audioInit(); goFS(); $('bGo').disabled = true;
  if (S.ctrl === 'tilt') { const ok = await enableTilt(22); tilt.on = ok; if (!ok) { S.ctrl = 'buttons'; toast('Przechylanie nie działa na tym urządzeniu. Włączam guziki.', 4500); } } else tilt.on = false;
  $('bGo').disabled = false; document.body.classList.toggle('tilt', tilt.on); save();
  newRun();
  S.mode = 'count'; S.cd = COUNT_S; S.cdN = 9; S.paused = false; tilt.cal = true;
  $('menu').hidden = true; $('end').hidden = true; $('hud').hidden = false;
  toast(tilt.on ? 'Przechyl telefon w lewo i w prawo, żeby skręcać!' : 'Trzymaj ◀ albo ▶, żeby skręcać!', 4200);
  lektor(tilt.on ? 'Przechylaj telefon w lewo i w prawo!' : 'Naciskaj strzałki, żeby skręcać!');
}
document.querySelectorAll('[data-ctrl]').forEach(b => b.addEventListener('click', () => { S.ctrl = b.dataset.ctrl; save(); syncMenu(); audioInit(); }));
tap('bGo', go); tap('bAgain', go); tap('bHome', () => showMenu(false));
tap('bBack', () => { $('menu').hidden = true; S.mode = S.prev || 'run'; S.paused = false; audioInit(); });
tap('bMenu', pauseGame); tap('bCal', () => { tilt.cal = true; toast('Środek ustawiony'); });
tap('bSnd', () => { S.muted = !S.muted; audioInit(); save(); syncMenu(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S.mode === 'run') pauseGame(); if (AU.ctx) { if (document.hidden) AU.ctx.suspend(); else AU.ctx.resume(); } });

/* =====================================================================
   PĘTLA
   ===================================================================== */
let last = performance.now();
function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.05, Math.max(.001, (now - last)/1000)); last = now; update(S.mode === 'pause' ? 0 : dt); renderer.render(scene, camera); }
showMenu(false); $('load').hidden = true;
if (IS_TEST) {
  window.TEST = { S, P, keys, get CRS() { return CRS; }, newRun, go, botInput, physics,
    start(skip = true) { S.first = false; newRun(Q.has('s') ? +Q.get('s') : 7); $('menu').hidden = $('end').hidden = true; $('hud').hidden = false; S.mode = skip ? 'run' : 'count'; S.cd = COUNT_S; S.cdN = 9; },
    step(sec, dt = 1/30, bot = false) { for (let t = 0; t < sec; t += dt) { if (bot) S.force = botInput(); update(dt); } if (bot) S.force = null; },
    render() { renderer.render(scene, camera); } };
  renderer.render(scene, camera);
} else requestAnimationFrame(t => { last = t; frame(t); });
