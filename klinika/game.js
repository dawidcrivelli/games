'use strict';
// Klinika Zoo — weterynarz dla dzieci 4–6 lat. Pacjent wchodzi (3D, kamera z ukosa), pokazuje, co boli, dziecko włącza rentgen:
// kamera obraca się na bok (2.5D), lupą szuka problemów („!”), potem lupa rośnie na cały ekran i leczymy palcem:
//   połknięta rzecz → przeciągnij przełykiem do pyszczka (dotknięcie ścianki = czkawka, nie przegrana) · BEEEK!
//   organ nie na miejscu → przenieś na świecący cień · krzywa szyja żyrafy → włóż 7 kręgów (liczymy) · złamana kość → złóż + kolorowy gips.
// Bez przegranej i bez czasu. Modele: models/pacjenci.klinika.js, anatomia.klinika.js, gabinet.klinika.js; dźwięk i lektor: dzwieki.js.
// Rentgen: dwie warstwy kamery (0 skóra, 1 wnętrze); warstwa 1 renderowana do tekstury i nakładana w kole lupy.
const T = THREE, $ = id => document.getElementById(id);
const KINDS = ['zyrafa', 'slon', 'opiekun'];
const IC = { zyrafa: '🦒', slon: '🐘', opiekun: '🤠' };
const NAZWY = { zyrafa: 'Żyrafa', slon: 'Słoń', opiekun: 'Opiekun' };
const RZECZY = ['kaczka', 'budzik', 'skarpetka', 'klucz', 'rybka', 'pilka', 'klocek'];
const RZ_IC = { kaczka: '🦆', budzik: '⏰', skarpetka: '🧦', klucz: '🔑', rybka: '🐟', pilka: '⚽', klocek: '🧱' };
const RZ_MOWA = { kaczka: 'Gumowa kaczka! Kaczek się nie je!', budzik: 'Budzik! To on dzwonił w brzuchu!', skarpetka: 'Skarpetka! Fuj, to nie do jedzenia!',
  klucz: 'Klucz! Kluczy się nie połyka!', rybka: 'Rybka! Ale z plastiku, nie do jedzenia!', pilka: 'Piłka! Piłka jest do grania, nie do jedzenia!', klocek: 'Klocek! Klocki są do budowania!' };
const ORG_IC = { serce: '❤️', pluca: '🫁', zoladek: '🍲', mozg: '🧠' };
const ORG_MOWA = { serce: 'Serce! Bije cały czas: bum, bum!', pluca: 'Płuca! Nimi oddychamy.', zoladek: 'Żołądek! Tu wpada jedzenie.', mozg: 'Mózg! Nim myślimy.' };
const ORG_SND = { serce: 'bum', pluca: 'wdech', zoladek: 'bulg', mozg: 'mysl' };
const ORG_NAZWA = { serce: 'serce', pluca: 'płuca', zoladek: 'żołądek', mozg: 'mózg' };
const FAKT = { zyrafa: 'Żyrafa ma w szyi siedem kości. Tyle samo co ty!', slon: 'Trąba słonia nie ma ani jednej kości!', opiekun: 'Twoje serce jest takie duże jak twoja pięść!' };
const LICZ = ['Jeden', 'Dwa', 'Trzy', 'Cztery', 'Pięć', 'Sześć', 'Siedem'];
const GIPS_KOL = ['#ff5a8a', '#3ab0ff', '#ffd23f', '#6ad66a', '#b07aff'];
const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.random() * a.length | 0];
const ease = t => t * t * (3 - 2 * t), V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const SET = Object.assign({ wyleczeni: {}, kind: 'zyrafa' }, JSON.parse(localStorage.getItem('klinika') || '{}'));
const save = () => localStorage.setItem('klinika', JSON.stringify(SET));

/* ---------- renderer, światło, kamera, rentgen w lupie ---------- */
const renderer = new T.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new T.Scene(), BG = new T.Color(0xfff0c8), XBG = new T.Color(0x0a1830);
const hemi = new T.HemisphereLight(0xffffff, 0xd8c8a8, .72), sun = new T.DirectionalLight(0xffffff, .5); sun.position.set(-4, 10, 7);
hemi.layers.enableAll(); sun.layers.enableAll(); scene.add(hemi, sun);
const cam = new T.PerspectiveCamera(32, 1, .5, 200), camLook = V(0, 2, 0);
const rt = new T.WebGLRenderTarget(4, 4);
const lupaMat = new T.ShaderMaterial({
  uniforms: { tx: { value: rt.texture }, c: { value: new T.Vector2(.5, .5) }, r: { value: 0 }, asp: { value: 1 }, t: { value: 0 } },
  transparent: true, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D tx; uniform vec2 c; uniform float r, asp, t; varying vec2 vUv;
    void main(){ vec2 d = vUv - c; d.x *= asp; float L = length(d);
      vec3 col = texture2D(tx, vUv).rgb + .035 * sin(vUv.y * 700.0 + t * 5.0);
      float inside = 1.0 - smoothstep(r - .004, r, L);
      float ring = smoothstep(r - .022, r - .012, L) * (1.0 - smoothstep(r + .004, r + .012, L));
      gl_FragColor = vec4(mix(col, vec3(1.0, .8, .25), ring), max(inside, ring)); }`,
});
const lupaScene = new T.Scene(), lupaCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
lupaScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), lupaMat));
const lupa = { c: new T.Vector2(.5, .5), cc: new T.Vector2(.5, .5), r: 0, cel: 0 };   // c: środek (uv), cc: cel środka

const GAB = klGabinet(); scene.add(GAB.g);
const MENU_P = KINDS.map((k, i) => { const p = klPacjent(k); p.g.position.set([-6.4, -3.2, -.4][i], 0, [-.8, .3, .9][i]); scene.add(p.g); return p; });

let lezace = [];                                         // wyciągnięte rzeczy w misce (zostają w gabinecie do końca wizyty)
let state = 'menu', stT = 0, czas = 0, P = null, zadania = [], zi = -1, problemy = [], zadT = 0, idleT = 0, nastepny = 0;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  const s = renderer.getDrawingBufferSize(new T.Vector2()); rt.setSize(s.x, s.y); lupaMat.uniforms.asp.value = w / h;
  if (camK >= 1) { const v = widok(); cam.position.copy(v.pos); camLook.copy(v.look); camTo = v; }
  else camTo = widok();
}
addEventListener('resize', () => resize());

/* ---------- widoki kamery: 3D z ukosa / prosto z boku (2.5D) ---------- */
function widokMenu() { return { pos: V(4.6, 4.6, 17), look: V(.2, 2.3, 0) }; }
function widok3D() {
  const h = P.box.y1, look = V(0, h * .42, 0), D = Math.max(12, h * 2.9);
  return { pos: look.clone().add(V(.42, .24, .88).normalize().multiplyScalar(D)), look };
}
function widokBok() {
  const b = P.box, x0 = b.x0 - 1.6, x1 = b.x1 + .3, y0 = b.y0 - .3, y1 = b.y1 + .7;   // miejsce po lewej na kawałki, u góry na ikonki
  const tn = Math.tan(cam.fov / 2 * Math.PI / 180), D = Math.max((y1 - y0) / 2 / tn, (x1 - x0) / 2 / (tn * cam.aspect));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return { pos: V(cx, cy + D * .05, D), look: V(cx, cy, 0) };
}
function widok() {
  if (!P || state === 'menu') return widokMenu();
  return ['skan', 'otwieranie', 'operacja'].includes(state) ? widokBok() : widok3D();
}
let camFrom = null, camTo = widokMenu(), camK = 1, camDur = 1.2;
function camGo(v, dur = 1.3) { camFrom = { pos: cam.position.clone(), look: camLook.clone() }; camTo = v; camK = 0; camDur = dur; }
function camStep(dt) {
  if (camK < 1) { camK = Math.min(1, camK + dt / camDur); const e = ease(camK); cam.position.lerpVectors(camFrom.pos, camTo.pos, e); camLook.lerpVectors(camFrom.look, camTo.look, e); }
  cam.lookAt(camLook);
}
cam.position.copy(camTo.pos); camLook.copy(camTo.look); resize();

/* ---------- ekran ↔ świat ---------- */
const V3 = V(), ray = new T.Raycaster(), ndc = new T.Vector2(), plaszcz = new T.Plane(V(0, 0, 1), 0);
function toScreen(w) { V3.copy(w).project(cam); return [(V3.x + 1) / 2 * innerWidth, (1 - V3.y) / 2 * innerHeight]; }
function lokal(x, y) {                                   // punkt palca na płaszczyźnie pacjenta (z = 0), w układzie pacjenta
  ndc.set(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1); ray.setFromCamera(ndc, cam);
  const hit = V(); if (!ray.ray.intersectPlane(plaszcz, hit)) return null;
  return P.g.worldToLocal(hit);
}
const swiat = o => o.getWorldPosition(V());
const wLok = p => P.g.localToWorld(p.clone());
function glowaW() {
  if (P.glowa) return P.glowa.localToWorld(V(.1, .45, 0));
  return P.g.localToWorld(V(1.6, 3.3, 0));
}
function dymek(txt, w, cls = '') { if (!w) return; const [X, Y] = toScreen(w); komiksDymek($('fx'), txt, X, Y, cls); }

/* ---------- zabiegi ---------- */
// Każdy zabieg: { typ, ic, objaw (słowa pacjenta), znalezione (lektor przy „!”), prep() przed wejściem, kotwice() → [() → punkt świata],
//   start(), down(p), move(p), up(p), step(dt), hint() → [skąd, dokąd] w świecie, done }
function zPolkniete(kind) {
  const S = P.rzeczS, W = .48 + .12 * S, krz = klKrz(P.przelyk), N = 90, pts = [], cum = [0];
  for (let i = 0; i <= N; i++) pts.push(krz.getPointAt(i / N));
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const Lt = cum[N];
  const at = s => { s = clamp(s, 0, Lt); let i = 1; while (i < N && cum[i] < s) i++; const u = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return pts[i - 1].clone().lerp(pts[i], u); };
  function proj(p, s0) {                                  // najbliższy punkt przełyku w okolicy s0
    let best = { s: s0, d: 1e9 };
    for (let i = 1; i <= N; i++) {
      if (cum[i] < s0 - 1.2 || cum[i - 1] > s0 + 1.6) continue;
      const a = pts[i - 1], b = pts[i], ab = V(b.x - a.x, b.y - a.y, 0), L2 = ab.lengthSq() || 1e-6;
      const u = clamp(((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / L2, 0, 1), d = Math.hypot(a.x + ab.x * u - p.x, a.y + ab.y * u - p.y);
      if (d < best.d) best = { s: cum[i - 1] + u * (cum[i] - cum[i - 1]), d };
    }
    return best;
  }
  let item, rura, s = 0, grab = false, out = null, ringT = 1.5, gigT = 1, wob = 0;
  const Z = { typ: 'polkniete', ic: RZ_IC[kind], done: false, rzecz: kind,
    objaw: kind === 'budzik' ? 'w brzuchu coś dzwoni' : 'brzuch boli', znalezione: 'Coś jest w brzuchu!' };
  Z.prep = () => { item = klX(anRzecz(kind, S * .85)); item.position.copy(at(0)).setZ(.6); P.g.add(item); };
  Z.kotwice = () => [() => swiat(item)];
  Z.start = () => { rura = klX(anPrzelyk(P.przelyk, .12 + .05 * S)); rura.position.z = .45; P.g.add(rura); mow('Wyciągnij to przez przełyk do buzi!'); };
  Z.down = p => { if (out || !p) return; if (Math.hypot(p.x - item.position.x, p.y - item.position.y) < .45 + .3 * S) { grab = true; snd(kind === 'kaczka' ? 'kwa' : 'pyk'); } };
  Z.move = p => {
    if (!grab || !p) return;
    const q = proj(p, s);
    if (q.d > W) { grab = false; s = Math.max(0, s - .9); wob = 1; snd('hik'); if (kind === 'kaczka') snd('kwa'); dymek('HIK!', swiat(item), 'small'); P.trzes = .5; return; }
    s = Math.max(s - .3, q.s);
    if (s >= Lt - .12) wyplun();
  };
  Z.up = () => { grab = false; };
  function wyplun() {
    grab = false; out = { t: 0, a: item.position.clone(), b: P.g.worldToLocal(GAB.miska.localToWorld(V(0, .5, 0))) };
    klObie(item); snd('bek'); dymek('BEEEK!', glowaW(), 'big'); P.bek = 1; idleT = 0;
    setTimeout(() => mow(RZ_MOWA[kind]), 700);
  }
  Z.step = dt => {
    if (!out) {
      const tg = at(s); tg.z = .6; item.position.lerp(tg, Math.min(1, dt * 14));
      wob = Math.max(0, wob - dt * 2); item.rotation.z = Math.sin(czas * 9) * (.1 + .3 * wob + (grab ? .12 : 0));
      if (kind === 'budzik' && (ringT -= dt) < 0) { ringT = 3.2; snd('dzwon'); wob = 1; dymek('DRRR!', swiat(item), 'small'); }
      if (grab && (gigT -= dt) < 0) { gigT = rnd(1.4, 2.6); snd('chichot'); dymek('hi hi', glowaW(), 'small'); }
    } else if (!Z.done) {
      out.t = Math.min(1, out.t + dt / 1.1); const e = out.t;
      item.position.lerpVectors(out.a, out.b, e); item.position.y += Math.sin(e * Math.PI) * 2.2; item.rotation.z += dt * 9 * (1 - e);
      if (out.t >= 1) { item.rotation.z = 0; snd('lad'); GAB.g.attach(item); lezace.push(item); if (rura) { P.g.remove(rura); rura = null; } Z.done = true; }
    }
  };
  Z.hint = () => out ? null : [swiat(item), wLok(at(Math.min(Lt, s + 1.8)))];
  return Z;
}
function zOrgan(names) {
  const L = names.map(n => ({ n, d: P.organy[n], duch: null, ok: false, snap: null })); let drag = null, off = V();
  const Z = { typ: 'organ', ic: ORG_IC[names[0]], done: false, objaw: 'kręci mi się w głowie', znalezione: names.map(n => ORG_NAZWA[n]).join(' i ') + ' nie na miejscu!' };
  Z.prep = () => {
    const used = new Set();
    for (const x of L) { const opt = x.d.zle.filter(z => !used.has(z + '')); const sp = pick(opt); used.add(sp + ''); x.d.o.position.set(sp[0], sp[1], .5); x.d.o.userData.zywy = false; }
  };
  Z.kotwice = () => L.map(x => () => swiat(x.d.o));
  Z.start = () => {
    for (const x of L) { x.duch = klX(anDuch(x.d.o)); x.duch.position.set(...x.d.dom); x.duch.rotation.z = 0; x.duch.scale.copy(x.d.o.scale); P.g.add(x.duch); }
    mow('Połóż ' + names.map(n => ORG_NAZWA[n]).join(' i ') + ' na swoje miejsce!');
  };
  const r = x => .35 + .45 * x.d.o.scale.x;
  Z.down = p => {
    if (!p) return;
    const x = L.filter(x => !x.ok && !x.snap).sort((a, b) => a.d.o.position.distanceTo(p) - b.d.o.position.distanceTo(p))[0];
    if (x && Math.hypot(p.x - x.d.o.position.x, p.y - x.d.o.position.y) < r(x)) { drag = x; off.set(x.d.o.position.x - p.x, x.d.o.position.y - p.y, 0); snd('pyk'); }
  };
  Z.move = p => { if (drag && p) drag.d.o.position.set(p.x + off.x, p.y + off.y, .7); };
  Z.up = () => {
    if (!drag) return; const x = drag, o = x.d.o; drag = null;
    if (Math.hypot(o.position.x - x.d.dom[0], o.position.y - x.d.dom[1]) < .5 + .25 * o.scale.x) x.snap = { a: o.position.clone(), t: 0 };
    else o.position.z = .5;
  };
  Z.step = dt => {
    anDuch.m && (anDuch.m.opacity = .22 + .14 * Math.sin(czas * 5));
    for (const x of L) {
      const o = x.d.o; if (drag === x) o.scale.setScalar((o.userData.s0 || o.scale.x) * 1.12); else if (!x.ok) o.scale.setScalar(o.userData.s0 || o.scale.x);
      if (!x.ok && !x.snap && drag !== x) o.rotation.z = Math.sin(czas * 3 + x.n.length) * .12;
      if (x.snap) {
        x.snap.t = Math.min(1, x.snap.t + dt / .35); o.position.lerpVectors(x.snap.a, V(...x.d.dom), ease(x.snap.t)); o.rotation.z *= .8;
        if (x.snap.t >= 1) {
          x.snap = null; x.ok = true; o.rotation.z = 0; o.userData.zywy = true; P.g.remove(x.duch);
          snd('pyk'); setTimeout(() => snd(ORG_SND[x.n]), 250); mow(ORG_MOWA[x.n]); dymek(ORG_IC[x.n], swiat(o), 'emoji');
          if (L.every(y => y.ok)) setTimeout(() => { Z.done = true; }, 1800);
        }
      }
    }
  };
  Z.hint = () => { const x = L.find(x => !x.ok && !x.snap); return x && [swiat(x.d.o), wLok(V(...x.d.dom))]; };
  return Z;
}
function zKregi() {
  const K = P.kregi, kaw = [], duchy = []; let n = 0, drag = null, rot = K.opad, gRot = K.glowaOpad;
  const Z = { typ: 'kregi', ic: '🦴', done: false, objaw: 'szyja mi się chwieje', znalezione: 'W szyi brakuje kości!' };
  const slotW = i => K.grupa.localToWorld(V(K.sloty[i].x, K.sloty[i].y, 0));
  Z.prep = () => {
    K.grupa.rotation.z = rot; P.glowaRz = gRot;
    for (let i = 0; i < 7; i++) {
      const k = klX(anKreg(.14)); k.position.set(P.box.x0 - .45 - (i % 3) * .5, .45 + Math.floor(i / 3) * .5 + (i % 2) * .1, .6); k.rotation.z = rnd(-1, 1);
      P.g.add(k); kaw.push({ k, ok: false, fly: null });
    }
  };
  Z.kotwice = () => [() => slotW(3)];
  Z.start = () => {
    K.sloty.forEach(s => { const d = klX(anDuch(anKreg(.14))); d.position.set(s.x, s.y, 0); d.rotation.z = s.rz; K.grupa.add(d); duchy.push(d); });
    mow('Szyja się chwieje! Włóż kości do szyi.');
  };
  Z.down = p => {
    if (!p) return;
    const c = kaw.filter(c => !c.ok && !c.fly).sort((a, b) => a.k.position.distanceTo(p) - b.k.position.distanceTo(p))[0];
    if (c && Math.hypot(p.x - c.k.position.x, p.y - c.k.position.y) < .5) { drag = c; snd('stuk'); }
  };
  Z.move = p => { if (drag && p) drag.k.position.set(p.x, p.y, .7); };
  Z.up = p => {
    if (!drag) return; const c = drag; drag = null;
    const pk = P.g.worldToLocal(swiat(c.k)); let best = 9;
    for (let i = 0; i < 7; i++) best = Math.min(best, P.g.worldToLocal(slotW(i)).distanceTo(pk));
    if (best < 1.1 && n < 7) { c.fly = { a: c.k.position.clone(), r: c.k.rotation.z, t: 0, i: n++ }; }
    else c.k.position.z = .6;
  };
  Z.step = dt => {
    const cel = K.opad * (1 - kaw.filter(c => c.ok).length / 7), gcel = K.glowaOpad * (1 - kaw.filter(c => c.ok).length / 7);
    rot += (cel - rot) * Math.min(1, dt * 4); gRot += (gcel - gRot) * Math.min(1, dt * 4);
    K.grupa.rotation.z = rot + Math.sin(czas * 2.2) * .05 * (cel / K.opad || 0); P.glowaRz = gRot;
    anDuch.m && (anDuch.m.opacity = .22 + .14 * Math.sin(czas * 5));
    for (const c of kaw) if (c.fly) {
      const f = c.fly, s = K.sloty[f.i]; f.t = Math.min(1, f.t + dt / .4);
      const b = P.g.worldToLocal(slotW(f.i)); c.k.position.lerpVectors(f.a, b, ease(f.t)); c.k.rotation.z = f.r + (K.grupa.rotation.z + s.rz - f.r) * ease(f.t);
      if (f.t >= 1) {
        c.fly = null; c.ok = true; K.grupa.add(c.k); c.k.position.set(s.x, s.y, 0); c.k.rotation.z = s.rz; K.grupa.remove(duchy[f.i]);
        const ile = kaw.filter(c => c.ok).length; snd('stuk'); snd('pyk'); mow(LICZ[ile - 1]); dymek(String(ile), swiat(c.k), 'small');
        if (ile === 7) setTimeout(() => { snd('sukces'); mow(FAKT.zyrafa); dymek('PROSTO!', glowaW(), 'big'); }, 900);
        if (ile === 7) setTimeout(() => { Z.done = true; }, 3800);
      }
    }
  };
  Z.hint = () => { const c = kaw.find(c => !c.ok && !c.fly); return c && n < 7 && [swiat(c.k), slotW(n)]; };
  return Z;
}
function zKosc() {
  const B = P.kosc, k = B.dol, Lk = k.userData.L; let drag = false, ok = false, snap = null, duch = null, gips = null, off = V();
  const Z = { typ: 'kosc', ic: '🩹', done: false, objaw: P.kind === 'opiekun' ? 'ręka boli' : 'noga boli', znalezione: 'Złamana kość!' };
  const srodek = (x, y, rz) => V(x - Math.sin(rz) * Lk / 2, y + Math.cos(rz) * Lk / 2, 0);   // środek kości w układzie kończyny
  const srW = () => B.grupa.localToWorld(srodek(k.position.x, k.position.y, k.rotation.z));
  const domW = () => B.grupa.localToWorld(srodek(B.dom.x, B.dom.y, B.dom.rz));
  Z.prep = () => { k.position.set(B.zle.x, B.zle.y, .1); k.rotation.z = B.zle.rz; P.kulawy = B.grupa; };
  Z.kotwice = () => [srW];
  Z.start = () => {
    P.kulawy = null; B.grupa.rotation.set(0, 0, B.grupa.userData.rz0 ?? B.grupa.rotation.z);
    duch = klX(anDuch(k)); duch.position.set(B.dom.x, B.dom.y, 0); duch.rotation.z = B.dom.rz; B.grupa.add(duch);
    mow('Kość się złamała! Złóż ją z powrotem.');
  };
  Z.down = p => {
    if (ok || snap || !p) return; const w = wLok(p), c = srW();
    if (Math.hypot(w.x - c.x, w.y - c.y) < .6) { drag = true; off.set(c.x - w.x, c.y - w.y, 0); snd('pyk'); }
  };
  Z.move = p => {
    if (!drag || !p) return;
    const g = B.grupa.worldToLocal(wLok(p).add(off)), dh = srodek(B.dom.x, B.dom.y, B.dom.rz).distanceTo(V(g.x, g.y, 0));
    const rz = B.dom.rz + (B.zle.rz - B.dom.rz) * clamp((dh - .1) / .9, 0, 1);       // im bliżej, tym bardziej się prostuje
    k.rotation.z = rz; k.position.set(g.x + Math.sin(rz) * Lk / 2, g.y - Math.cos(rz) * Lk / 2, .15);
  };
  Z.up = () => {
    if (!drag) return; drag = false;
    if (srW().distanceTo(domW()) < .45) snap = { a: k.position.clone(), r: k.rotation.z, t: 0 };
  };
  Z.step = dt => {
    anDuch.m && (anDuch.m.opacity = .22 + .14 * Math.sin(czas * 5));
    if (!ok && !snap && !drag) k.rotation.z += Math.sin(czas * 6) * .004;
    if (snap) {
      snap.t = Math.min(1, snap.t + dt / .3); const e = ease(snap.t);
      k.position.lerpVectors(snap.a, V(B.dom.x, B.dom.y, 0), e); k.rotation.z = snap.r + (B.dom.rz - snap.r) * e;
      if (snap.t >= 1) {
        snap = null; ok = true; B.grupa.remove(duch); snd('chrup'); dymek('CHRUP!', srW(), 'big');
        setTimeout(() => { mow('Wybierz kolor gipsu!'); paleta(true); }, 700);
      }
    }
    if (gips && gips.scale.x < 1) { const s = Math.min(1, gips.scale.x + dt * 3); gips.scale.set(s, 1, s); }
  };
  Z.kolor = c => {
    if (gips) return; paleta(false);
    gips = klObie(anGips(B.gips.L, B.gips.r, new T.Color(c).getHex())); gips.position.set(B.dom.x, B.gips.y0, .02); gips.scale.set(.01, 1, .01); B.grupa.add(gips);
    snd('gips'); dymek('PAC!', swiat(gips), 'big'); setTimeout(() => { snd('gwiazda'); mow('Gips gotowy! Kość się zrośnie.'); }, 400);
    setTimeout(() => { Z.done = true; }, 2400);
  };
  Z.hint = () => ok ? null : [srW(), domW()];
  return Z;
}
function zabiegi(kind) {
  const rz = kind === 'slon' && Math.random() < .6 ? 'budzik' : pick(RZECZY);
  if (kind === 'zyrafa') return [zKregi(), zPolkniete(rz), zOrgan(['serce'])];
  if (kind === 'slon') return [zPolkniete(rz), zOrgan(['mozg']), zKosc()];
  const o = ['serce', 'zoladek', 'pluca', 'mozg'].sort(() => Math.random() - .5).slice(0, 2);
  return [zOrgan(o), zPolkniete(rz), zKosc()];
}

/* ---------- przebieg wizyty ---------- */
function setState(s) { state = s; stT = 0; }
function showMenu() {
  if (P) { scene.remove(P.g); P = null; }
  setState('menu'); ['hud', 'end'].forEach(id => $(id).hidden = true); $('menu').hidden = false; $('confetti').innerHTML = '';
  MENU_P.forEach(p => p.g.visible = true); lupa.cel = lupa.r = 0; czysc();
  camGo(widokMenu(), 1); buildMenu();
}
function buildMenu() {
  $('pick').innerHTML = KINDS.map(k => `<button class="btn" data-k="${k}"><span class="ico">${IC[k]}</span>${NAZWY[k]}<span class="gw">${'⭐'.repeat(Math.min(5, SET.wyleczeni[k] || 0))}</span></button>`).join('');
  $('bSnd').textContent = $('bSnd2').textContent = AUD.on ? '🔊' : '🔇';
}
function czysc() { lezace.forEach(o => GAB.g.remove(o)); lezace = []; $('znaki').innerHTML = ''; $('fx').innerHTML = ''; paleta(false); $('bRtg').hidden = true; $('lupa').hidden = true; $('raczka').hidden = true; }
function startWizyta(kind) {
  audInit(); obrotPelny(); snd('klik');
  SET.kind = kind; save();
  if (P) scene.remove(P.g);
  MENU_P.forEach(p => p.g.visible = false);
  P = klPacjent(kind); P.g.position.set(-12, 0, 0); if (kind === 'opiekun') P.g.rotation.y = Math.PI / 2;
  scene.add(P.g); P.nogi.concat(P.rece).forEach(n => n.g.userData.rz0 = n.g.rotation.z);
  GAB.miska.position.set(P.box.x0 - 1.0, 0, .8);
  zadania = zabiegi(kind); zi = -1; zadania.forEach(z => z.prep());
  $('menu').hidden = true; $('end').hidden = true; $('hud').hidden = false; $('confetti').innerHTML = ''; czysc();
  $('zad').innerHTML = zadania.map(z => `<b>${z.ic}</b>`).join('');
  lupa.r = lupa.cel = 0;
  setState('wejscie'); camGo(widok3D(), 1.2);
}
function rentgen() {
  if (state !== 'objaw') return;
  snd('rtg'); $('bRtg').hidden = true; setState('skan'); camGo(widokBok(), 1.3);
  problemy = zadania.flatMap((z, i) => z.kotwice().map(f => ({ f, z, t: 0, found: false, el: null })));
  setTimeout(() => {
    const [X, Y] = toScreen(P.g.localToWorld(V((P.box.x0 + P.box.x1) / 2, P.box.y1 * .45, 0)));
    lupa.cc.set(X / innerWidth, 1 - Y / innerHeight); lupa.c.copy(lupa.cc); lupa.cel = .2;
    mow('Szukaj lupą! Co jest w środku?');
  }, 1300);
}
function nastepneZadanie() {
  zi++; idleT = 0;
  [...$('zad').children].forEach((b, i) => { b.classList.toggle('ok', i < zi); b.classList.toggle('teraz', i === zi); });
  if (zi >= zadania.length) { zdrowy(); return; }
  zadania[zi].start();
}
function zdrowy() {
  setState('zdrowy'); lupa.cel = 0; camGo(widok3D(), 1.4); snd('sukces');
  SET.wyleczeni[P.kind] = (SET.wyleczeni[P.kind] || 0) + 1; save();
  setTimeout(() => { mow('Zdrowy! ' + FAKT[P.kind]); if (P.kind === 'slon') snd('trab'); else if (P.kind === 'zyrafa') snd('mruk'); }, 900);
  const cf = $('confetti'); cf.innerHTML = '';
  for (let i = 0; i < 30; i++) { const d = document.createElement('i'); d.textContent = pick(['⭐', '✨', '🎉', '💖', '🩹']); Object.assign(d.style, { left: rnd(0, 100) + '%', animationDuration: rnd(2, 4) + 's', animationDelay: rnd(0, 1.2) + 's' }); cf.append(d); }
}
function koniec() {
  setState('koniec'); $('hud').hidden = true; $('end').hidden = false;
  $('endIc').textContent = IC[P.kind]; $('endNakl').textContent = '⭐'.repeat(Math.min(5, SET.wyleczeni[P.kind]));
  nastepny = (KINDS.indexOf(P.kind) + 1) % KINDS.length;
}
function paleta(on) {
  const el = $('paleta'); el.hidden = !on;
  el.innerHTML = on ? GIPS_KOL.map((c, i) => `<button data-c="${c}" style="background:${c};animation-delay:${i * .07}s"></button>`).join('') : '';
}

/* ---------- sterowanie: palec ---------- */
let ptr = null;
function lupaZa(x, y) {           // lupa tuż nad palcem (palec nie zasłania środka, a sięga też do samego dołu ekranu)
  lupa.cc.set(clamp(x / innerWidth, 0, 1), clamp(1 - y / innerHeight + lupa.r * .45, 0, 1));
}
$('c').addEventListener('pointerdown', e => {
  audInit(); idleT = 0; $('raczka').hidden = true;
  ptr = { id: e.pointerId }; try { $('c').setPointerCapture(e.pointerId); } catch (er) {}
  if (state === 'skan' && lupa.cel > 0) lupaZa(e.clientX, e.clientY);
  else if (state === 'operacja' && zadania[zi]) zadania[zi].down(lokal(e.clientX, e.clientY));
  else if (state === 'objaw' && P) { dymek(pick(['Au!', 'Ojej!', 'Hi hi!']), glowaW(), 'small'); snd('oj'); }
});
$('c').addEventListener('pointermove', e => {
  if (!ptr || e.pointerId !== ptr.id) return; idleT = 0;
  if (state === 'skan' && lupa.cel > 0) lupaZa(e.clientX, e.clientY);
  else if (state === 'operacja' && zadania[zi]) zadania[zi].move(lokal(e.clientX, e.clientY));
});
function koniecPalca(e) {
  if (!ptr || e.pointerId !== ptr.id) return; ptr = null;
  if (state === 'operacja' && zadania[zi]) zadania[zi].up(lokal(e.clientX, e.clientY));
}
$('c').addEventListener('pointerup', koniecPalca); $('c').addEventListener('pointercancel', koniecPalca);
$('pick').addEventListener('click', e => { const b = e.target.closest('button'); if (b) startWizyta(b.dataset.k); });
$('bGo').onclick = () => startWizyta(SET.kind);
$('bRtg').onclick = () => { audInit(); rentgen(); };
$('paleta').addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (b && zadania[zi] && zadania[zi].kolor) zadania[zi].kolor(b.dataset.c); });
$('bDom').onclick = () => { if (window.speechSynthesis) speechSynthesis.cancel(); showMenu(); };
$('bHome').onclick = showMenu;
$('bNext').onclick = () => startWizyta(KINDS[nastepny]);
$('bSnd').onclick = $('bSnd2').onclick = () => { audInit(); audMute(!AUD.on); if (!AUD.on && window.speechSynthesis) speechSynthesis.cancel(); buildMenu(); };
addEventListener('keydown', e => { if (e.code === 'Enter' && state === 'menu') startWizyta(SET.kind); if (e.code === 'Space' && state === 'objaw') rentgen(); });

/* ---------- pętla ---------- */
const STOPA = { zyrafa: 'krok', slon: 'krok_slon', opiekun: 'krok' };
function animPacjent(p, dt, idzie) {
  p.t += dt; klKrok(p, p.t, idzie ? 1 : 0); klOddech(p, p.t);
  for (const n in p.organy) anTik(p.organy[n].o, p.t);
  if (p.mozgGlowy) anTik(p.mozgGlowy, p.t);
}
function step(dt) {
  czas += dt; stT += dt;
  if (state === 'menu') {
    MENU_P.forEach((p, i) => { animPacjent(p, dt, false); p.g.position.y = Math.abs(Math.sin(czas * 2 + i * 2)) * .12; if (p.rece[0]) p.rece[0].g.rotation.z = -.12 - (1 + Math.sin(czas * 6)) * .6; });
  }
  if (P) {
    const idzie = state === 'wejscie' || state === 'wyjscie';
    animPacjent(P, dt, idzie);
    if (P.kulawy && (state === 'wejscie' || state === 'objaw')) P.kulawy.rotation.z = (P.kulawy.userData.rz0 || 0) + (P.kind === 'opiekun' ? .5 : .55) + Math.sin(czas * 3) * .05;
    P.trzes = Math.max(0, (P.trzes || 0) - dt); P.g.rotation.z = Math.sin(czas * 40) * .03 * P.trzes;
    if (P.bek > 0) { P.bek = Math.max(0, P.bek - dt * 1.2); if (P.glowa) P.glowa.rotation.z = (P.glowaRz || 0) + Math.sin(P.bek * 20) * .12 * P.bek; }
    if (state === 'objaw' && zadania.some(z => z.typ === 'organ')) P.g.rotation.z += Math.sin(czas * 2.2) * .03;
    if (idzie) {
      const v = P.kind === 'slon' ? 3.2 : 3.8; P.g.position.x += v * dt;
      if (Math.floor(P.t * 7 / Math.PI) !== Math.floor((P.t - dt) * 7 / Math.PI)) snd(STOPA[P.kind]);
      if (P.kind === 'opiekun') P.g.rotation.y += (Math.PI / 2 - P.g.rotation.y) * Math.min(1, dt * 6);
    } else if (P.kind === 'opiekun') P.g.rotation.y += (0 - P.g.rotation.y) * Math.min(1, dt * 5);
  }
  switch (state) {
    case 'wejscie':
      if (P.g.position.x >= 0) {
        P.g.position.x = 0; setState('objaw');
        if (P.kind === 'slon') snd('trab'); else if (P.kind === 'zyrafa') snd('mruk');
        const sl = zadania.map(z => z.objaw), zd = sl.slice(0, -1).join(', ') + ' i ' + sl[sl.length - 1]; mow('Ojej! ' + zd[0].toUpperCase() + zd.slice(1) + '!');
        setTimeout(() => { if (state === 'objaw') $('bRtg').hidden = false; }, 1500);
      }
      break;
    case 'objaw':
      if (stT % 2.4 < dt && stT > .5) { const z = zadania[Math.floor(stT / 2.4) % zadania.length]; dymek({ polkniete: '🤢', organ: '😵', kregi: '🥴', kosc: '🤕' }[z.typ], glowaW(), 'emoji'); }
      break;
    case 'skan': {
      if (lupa.cel <= 0) break;
      const asp = innerWidth / innerHeight;
      for (const q of problemy) {
        if (q.found) continue;
        const [X, Y] = toScreen(q.f()), d = Math.hypot((X / innerWidth - lupa.c.x) * asp, (1 - Y / innerHeight) - lupa.c.y);
        if (d < lupa.r * .85) { q.t += dt; if (q.t > .3) { q.found = true; snd('znalazl'); mow(q.z.znalezione); q.el = document.createElement('div'); q.el.className = 'znak'; q.el.textContent = '!'; $('znaki').append(q.el); } }
      }
      if (problemy.every(q => q.found)) { setState('otwieranie'); }
      break;
    }
    case 'otwieranie':
      if (stT > 1.2 && lupa.cel < 1) { lupa.cel = 3; snd('rtg'); }
      if (stT > 2.2) { $('znaki').innerHTML = ''; problemy = []; setState('operacja'); nastepneZadanie(); }
      break;
    case 'operacja': {
      const z = zadania[zi]; if (!z) break;
      z.step(dt); if (!ptr) idleT += dt;
      if (z.done) { snd('gwiazda'); nastepneZadanie(); }
      break;
    }
    case 'zdrowy':
      P.g.position.y = stT < 2.6 ? Math.abs(Math.sin(stT * 6)) * .6 * (1 - stT / 2.6) : 0;
      if (stT > 4.6) { setState('wyjscie'); }
      break;
    case 'wyjscie':
      if (P.g.position.x > 13) koniec();
      break;
  }
  // znaczniki „!” nad znalezionymi problemami
  for (const q of problemy) if (q.el) { const [X, Y] = toScreen(q.f()); q.el.style.left = X + 'px'; q.el.style.top = (Y - 34) + 'px'; }
  // lupa
  lupa.c.lerp(lupa.cc, Math.min(1, dt * 12)); lupa.r += (lupa.cel - lupa.r) * Math.min(1, dt * (lupa.cel > 1 ? 2.5 : 6));
  lupaMat.uniforms.c.value.copy(lupa.c); lupaMat.uniforms.r.value = lupa.r; lupaMat.uniforms.t.value = czas;
  const lu = $('lupa'), widac = state === 'skan' && lupa.r > .05;
  lu.hidden = !widac;
  if (widac) { const asp = innerWidth / innerHeight, R = lupa.r * innerHeight; lu.style.left = (lupa.c.x * innerWidth + R * .7 - 15) + 'px'; lu.style.top = ((1 - lupa.c.y) * innerHeight + R * .7) + 'px'; lu.style.transform = 'rotate(-45deg)'; }
  // rączka-podpowiedź po kilku sekundach bez ruchu
  let h = null;
  if (state === 'operacja' && zadania[zi] && idleT > 4) h = zadania[zi].hint();
  else if (state === 'skan' && lupa.r > .1 && stT > 6 && !ptr) { const q = problemy.find(q => !q.found); if (q) h = [P.g.localToWorld(V((P.box.x0 + P.box.x1) / 2, P.box.y1 * .45, 0)), q.f()]; }
  const ra = $('raczka'); ra.hidden = !h;
  if (h) { const a = toScreen(h[0]), b = toScreen(h[1]), u = ease(Math.min(1, (czas % 1.8) / 1.3)); ra.style.left = (a[0] + (b[0] - a[0]) * u) + 'px'; ra.style.top = (a[1] + (b[1] - a[1]) * u) + 'px'; }
  camStep(dt);
}
function render() {
  cam.layers.set(0); scene.background = BG; renderer.setRenderTarget(null); renderer.render(scene, cam);
  if (lupa.r > .003) {
    cam.layers.set(1); scene.background = XBG; renderer.setRenderTarget(rt); renderer.render(scene, cam);
    renderer.setRenderTarget(null); renderer.autoClear = false; renderer.render(lupaScene, lupaCam); renderer.autoClear = true; cam.layers.set(0);
  }
}
let prev = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - prev) / 1000); prev = now;
  step(dt); render(); requestAnimationFrame(frame);
}
// do testów (tools/): stan gry i podpowiedź w pikselach ekranu
window.KL = { stan: () => state, zad: () => zadania[zi] && zadania[zi].typ, hint: () => { const z = zadania[zi], h = z && z.hint(); return h && [toScreen(h[0]), toScreen(h[1])]; },
  problemy: () => problemy.map(q => ({ xy: toScreen(q.f()), found: q.found })), paleta: () => !$('paleta').hidden, rentgen };
showMenu();
requestAnimationFrame(frame);
