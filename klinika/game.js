'use strict';
// Klinika Zoo — weterynarz dla dzieci 4–6 lat. Pacjent wchodzi (3D, kamera z ukosa), pokazuje, co boli, dziecko włącza rentgen:
// kamera obraca się na bok (2.5D; wyprostowani — doktor, pingwin — stają przodem), lupą szuka problemów („!”), potem lupa rośnie
// na cały ekran i leczymy palcem:
//   połknięta rzecz → przeciągnij przełykiem do pyszczka (dotknięcie ścianki = czkawka, nie przegrana) · BEEEK!
//   organ nie na miejscu → przenieś na świecący cień · krzywa szyja żyrafy → włóż 7 kręgów (liczymy) · złamana kość → złóż + kolorowy gips.
//   Na koniec w 3D: plasterki na rany (stuknij), radość pacjenta (poza „cheer” z ZOO / taniec doktora) i lizak dla dzielnego pacjenta.
// Bez przegranej i bez czasu. Pacjenci = modele z innych gier (ZOO z models/animals.js, ludzik z Piratów jako Pan Weterynarz) + wnętrze z models/anatomy.js
// (klinika/patients.js); budynek kliniki w przekroju (klinika/office.js), światło jak w Arce Noego; dźwięk i lektor: dzwieki.js.
// Rentgen: dwie warstwy kamery (0 skóra, 1 wnętrze); warstwa 1 renderowana do tekstury i nakładana w kole lupy.
const KINDS = ['zyrafa', 'slon', 'pingwin', 'doktor'];
const NAZWY = { zyrafa: 'Żyrafa', slon: 'Słoń', pingwin: 'Pingwin', doktor: 'Pan Doktor' };
const RZECZY = ['kaczka', 'budzik', 'skarpetka', 'klucz', 'rybka', 'pilka', 'klocek', 'lod'];
const RZ_MOWA = { kaczka: 'Gumowa kaczka! Kaczek się nie je!', budzik: 'Budzik! To on dzwonił w brzuchu!', skarpetka: 'Skarpetka! Fuj, to nie do jedzenia!',
  klucz: 'Klucz! Kluczy się nie połyka!', rybka: 'Rybka! Ale z plastiku, nie do jedzenia!', pilka: 'Piłka! Piłka jest do grania, nie do jedzenia!', klocek: 'Klocek! Klocki są do budowania!', lod: 'Kostka lodu! Brrr, ale zimna!' };
const ORG_MOWA = { serce: 'Serce! Bije cały czas: bum, bum!', pluca: 'Płuca! Nimi oddychamy.', zoladek: 'Żołądek! Tu wpada jedzenie.', mozg: 'Mózg! Nim myślimy.',
  watroba: 'Wątroba! Pomaga trawić jedzenie.', nerki: 'Nerki! Z nich robi się siusiu.', pecherz: 'Pęcherz! Tu czeka siusiu, zanim pójdziesz do toalety.' };
const ORG_SND = { serce: 'bum', pluca: 'wdech', zoladek: 'bulg', mozg: 'mysl', watroba: 'bulg', nerki: 'chlup', pecherz: 'chlup' };
const ORG_NAZWA = { serce: 'serce', pluca: 'płuca', zoladek: 'żołądek', mozg: 'mózg', watroba: 'wątroba', nerki: 'nerki', pecherz: 'pęcherz' };
const ORG_BIERNIK = { ...ORG_NAZWA, watroba: 'wątrobę' };
const FAKT = { zyrafa: 'Żyrafa ma w szyi siedem kości. Tyle samo co ty!', slon: 'Trąba słonia nie ma ani jednej kości!', doktor: 'Nawet doktor czasem choruje! Twoje serce jest takie duże jak twoja pięść.', pingwin: 'Pingwin ma skrzydła, ale nie lata. Za to świetnie pływa!' };
const LICZ = ['Jeden', 'Dwa', 'Trzy', 'Cztery', 'Pięć', 'Sześć', 'Siedem'];
const GIPS_KOL = ['#ff5a8a', '#3ab0ff', '#ffd23f', '#6ad66a', '#b07aff'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t * t * (3 - 2 * t);
const SET = Object.assign({ wyleczeni: {}, kind: 'zyrafa' }, JSON.parse(localStorage.getItem('klinika') || '{}'));
const save = () => localStorage.setItem('klinika', JSON.stringify(SET));

/* ---------- renderer, światło, kamera, rentgen w lupie ---------- */
const renderer = new T.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;   // cienie raz na klatkę (nie w przebiegu rentgena)
const scene = new T.Scene(), XBG = new T.Color(0x0a1830);
// światło jak w Arce Noego: niebo + słońce z cieniem
const hemi = new T.HemisphereLight(0xffffff, 0xb08a5a, .7), sun = new T.DirectionalLight(0xfff3d6, .8);
sun.position.set(2, 18, 14); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.002;
{ const sc = sun.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -6; sc.near = 1; sc.far = 60; sc.updateProjectionMatrix(); }
hemi.layers.enableAll(); sun.layers.enableAll(); scene.add(hemi, sun, sun.target);
const cam = new T.PerspectiveCamera(32, 1, .5, 200), camLook = V(0, 2, 0);
const rt = new T.WebGLRenderTarget(4, 4);
const lupaMat = new T.ShaderMaterial({
  uniforms: { tx: { value: rt.texture }, c: { value: new T.Vector2(.5, .5) }, r: { value: 0 }, asp: { value: 1 }, t: { value: 0 } },
  transparent: true, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D tx; uniform vec2 c; uniform float r, asp, t; varying vec2 vUv;
    void main(){ vec2 d = vUv - c; d.x *= asp; float L = length(d);
      vec3 col = texture2D(tx, vUv).rgb + .035 * (1.0 - smoothstep(.3, .8, r)) * sin(vUv.y * 700.0 + t * 5.0);
      float inside = 1.0 - smoothstep(r - .004, r, L);
      float ring = smoothstep(r - .022, r - .012, L) * (1.0 - smoothstep(r + .004, r + .012, L));
      gl_FragColor = vec4(mix(col, vec3(1.0, .8, .25), ring), max(inside, ring)); }`,
});
const lupaScene = new T.Scene(), lupaCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
lupaScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), lupaMat));
const lupa = { c: new T.Vector2(.5, .5), cc: new T.Vector2(.5, .5), r: 0, cel: 0 };   // c: środek (uv), cc: cel środka

const GAB = klGabinet(); scene.add(GAB.g); const BG = GAB.niebo;
const MENU_P = KINDS.map((k, i) => { const p = klPacjent(k); p.g.position.set([-5.6, -2.6, -.2, 1.7][i], 0, [-1.6, -.4, 1.4, 2.4][i]); scene.add(p.g); return p; });

// Ikony przycisków = małe rysunki prawdziwych modeli z gry (lib/3d/icons.js), bez emoji
const IKONA = {}, img = (k, cls = '') => `<img class="ik ${cls}" src="${IKONA[k]}" alt="">`;
function budujIkony() {
  for (const k of KINDS) { const p = klPacjent(k); IKONA['p_' + k] = ikonaModelu(p.g, { ry: p.przod ? -PI / 2 + .4 : -.5 }); }
  for (const r of RZECZY) IKONA['r_' + r] = ikonaModelu(anRzecz(r, 1), { ry: -.35, rx: .15 });
  for (const n of ['serce', 'pluca', 'zoladek', 'mozg', 'watroba', 'nerki', 'pecherz']) IKONA['o_' + n] = ikonaModelu(anOrgan(n, 1), { ry: -.3 });
  const kr = new T.Group(); for (let i = 0; i < 3; i++) kr.add(klPoz(anKreg(.2), 0, i * .4, 0)); IKONA.kregi = ikonaModelu(kr, { rz: -.35 });
  const og = new T.Group(); for (let i = 0; i < 5; i++) og.add(klPoz(anKreg(.2 - i * .025), i * .38, -i * i * .03, 0, -1.4)); IKONA.ogon = ikonaModelu(og, { rz: -.2 });
  const pa = new T.Group(); for (let i = 0; i < 5; i++) { const t = (i - 2) * .32; pa.add(klPoz(anKosc(.8 - Math.abs(i - 2) * .12, .1), Math.sin(t) * .3, 0, 0, -t)); } IKONA.palce = ikonaModelu(pa);
  IKONA.zebra = ikonaModelu(anZebraPrzod(.5, 0, .2, 3, .05));
  IKONA.kosc = ikonaModelu(anKosc(1, .12), { rz: -.8 });
  IKONA.plaster = ikonaModelu(anPlaster(.3, 0xff8fb1), { rz: .5 });
  IKONA.lizak = ikonaModelu(anLizak(1), { rz: -.3 });
  IKONA.lupa = ikonaModelu(anLupa());
  IKONA.gwiazda = ikonaModelu(anGwiazda(), { ry: .3 });
  $('bRtg').innerHTML = img('lupa'); $('bLizak').innerHTML = img('lizak'); $('bDom').innerHTML = SVG_IKONY.dom;
  $('bNext').innerHTML = SVG_IKONY.dalej + 'Następny pacjent'; $('bHome').innerHTML = SVG_IKONY.dom + 'Menu';
}
budujIkony();
let lezace = [];                                         // wyciągnięte rzeczy w misce (zostają w gabinecie do końca wizyty)
let ostatni = 0, state = 'menu', stT = 0, czas = 0, P = null, zadania = [], zi = -1, problemy = [], zadT = 0, idleT = 0, nastepny = 0;
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = h > w ? 46 : 32; cam.updateProjectionMatrix();
  const s = renderer.getDrawingBufferSize(new T.Vector2()); rt.setSize(s.x, s.y); lupaMat.uniforms.asp.value = w / h;
  if (camK >= 1) { const v = widok(); cam.position.copy(v.pos); camLook.copy(v.look); camTo = v; }
  else camTo = widok();
}
addEventListener('resize', () => resize());

/* ---------- widoki kamery: 3D z ukosa / prosto z boku (2.5D) ---------- */
// Kamera mieści prostokąt [x0..x1]×[y0..y1] (płaszczyzna z = 0) w wolnej części ekranu; ui = ułamki ekranu zajęte przez przyciski {l, r, t, b}
function dopasuj(x0, x1, y0, y1, kier, ui = {}) {
  const tn = Math.tan(cam.fov / 2 * PI / 180), asp = cam.aspect, l = ui.l || 0, r = ui.r || 0, t = ui.t || 0, b = ui.b || 0;
  const D = Math.max((y1 - y0) / 2 / (tn * (1 - t - b)), (x1 - x0) / 2 / (tn * asp * (1 - l - r))), hh = D * tn, hw = hh * asp;
  const look = V((x0 + x1) / 2 - (l - r) * hw, (y0 + y1) / 2 - (b - t) * hh, 0);
  return { pos: look.clone().add(kier.clone().normalize().multiplyScalar(D)), look };
}
const pion = () => innerHeight > innerWidth;
// menu: cała klinika z szyldem; karta wyboru zajmuje dół (pion) albo prawą połowę (poziom)
function widokMenu() { return dopasuj(-8, 8, -.4, 10.4, V(.3, .28, 1), pion() ? { b: .4, t: .03 } : { r: .5, t: .04 }); }
const rozmiar = () => Math.max(P.box.x1 - P.box.x0, P.box.y1);
// 3D z ukosa: pacjent blisko, wyśrodkowany; at = gdzie stoi (kamera idzie za nim, gdy wchodzi i wychodzi)
function widok3D(at) {
  const b = P.box, m = rozmiar() * .12, v = dopasuj(b.x0 - m, b.x1 + m, -.2, b.y1 + m, V(.42, .24, .88), pion() ? { t: .1, b: .12 } : { t: .14, b: .04, r: .1 });
  if (at) { const d = V(at.x, 0, at.z); v.pos.add(d); v.look.add(d); }
  return v;
}
// z boku (2.5D) do szukania lupą: sam pacjent na cały ekran
function widokBok() { const b = P.box, m = rozmiar() * .1; return dopasuj(b.x0 - m, b.x1 + m, b.y0 - m, b.y1 + m, V(0, .05, 1), { t: pion() ? .09 : .14, b: .02 }); }
// z boku razem z miską (wyciągnięta rzecz leci do miski)
function widokMiska() { const b = P.box, m = rozmiar() * .1; return dopasuj(Math.min(b.x0 - m, GAB.miska.position.x - 1), b.x1 + m, b.y0 - m, b.y1 + m, V(0, .05, 1), { t: pion() ? .09 : .14, b: .02 }); }
// zabieg: zbliżenie na jego obszar (trasa, cel, kupka kości) — punkty świata z.roi; kadr co najmniej 0,7 pacjenta
function widokZad(z) {
  if (!z || !z.roi || !z.roi.length) return widokBok();
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of z.roi) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const S = rozmiar() * .7, m = Math.max(x1 - x0, y1 - y0) * .15 + rozmiar() * .05;
  x0 -= m; x1 += m; y0 -= m; y1 += m;
  if (x1 - x0 < S) { const c = (x0 + x1) / 2; x0 = c - S / 2; x1 = c + S / 2; }
  if (y1 - y0 < S) { const c = (y0 + y1) / 2; y0 = c - S / 2; y1 = c + S / 2; }
  return dopasuj(x0, x1, y0, y1, V(0, .05, 1), pion() ? { t: .09, b: .1 } : { t: .14, b: .02, r: .09 });
}
function widok() {
  if (!P || state === 'menu') return widokMenu();
  if (state === 'operacja' && zadania[zi] && !zadania[zi].w3d) return widokZad(zadania[zi]);
  if (state === 'wejscie' || state === 'wyjscie') return widok3D(P.g.position);
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
  return P.w.worldToLocal(hit);
}
// piksele ekranu → jednostki pacjenta (P.w) w widoku z boku: tolerancje palca nie zależą od wielkości pacjenta
function px2lok(px) { return px / innerHeight * 2 * Math.abs((camTo || { pos: cam.position }).pos.z) * Math.tan(cam.fov / 2 * PI / 180) / P.k; }
const swiat = o => o.getWorldPosition(V());
const wLok = p => P.w.localToWorld(p.clone());
function glowaW() { return swiat(P.glowa).add(V(0, P.box.y1 * .1, 0)); }
function dymek(txt, w, cls = '') { if (!w) return; const [X, Y] = toScreen(w); komiksDymek($('fx'), txt, X, Y, cls); }

/* ---------- zabiegi ---------- */
// Każdy zabieg: { typ, ic, objaw (słowa pacjenta), znalezione (lektor przy „!”), prep() przed wejściem, kotwice() → [() → punkt świata],
//   start(), down(p), move(p), up(p), step(dt), hint() → [skąd, dokąd] w świecie, done }

// Problemy świecą na wierzchu (przez organy i kości) pomarańczową poświatą; on = false przywraca zwykły wygląd
const WIERZCH = [];
function naWierzch(obj, on = true) {
  obj.traverse(m => {
    if (!m.isMesh) return;
    if (on && !m.userData.mat0) {                         // przezroczysty przebieg: rysowany po trasie (renderOrder działa tylko w obrębie przebiegu)
      m.userData.mat0 = m.material; m.material = m.material.clone(); m.material.depthTest = false; m.material.transparent = true; m.material.depthWrite = false;
      const bs = m.material.side === T.BackSide; m.userData.poswiata = bs; m.renderOrder = bs ? 30 : 31;
      if (bs) { m.userData.ol0 = { s: m.scale.clone(), p: m.position.clone() }; obrys(m, 2.6); }   // obrys ~2,6× grubszy
    } else if (!on && m.userData.mat0) {
      m.material = m.userData.mat0; m.userData.mat0 = null; m.userData.poswiata = false; m.renderOrder = 0;
      if (m.userData.ol0) { m.scale.copy(m.userData.ol0.s); m.position.copy(m.userData.ol0.p); m.userData.ol0 = null; }
    }
  });
  const i = WIERZCH.indexOf(obj); if (on && i < 0) WIERZCH.push(obj); if (!on && i >= 0) WIERZCH.splice(i, 1);
}
// Kontur (BackSide z brOutline: powiększona kopia) k razy grubszy, środek bez zmian
function obrys(m, k) {
  const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const c = g.boundingBox.getCenter(V());
  m.scale.set(1 + (m.scale.x - 1) * k, 1 + (m.scale.y - 1) * k, 1 + (m.scale.z - 1) * k); m.position.set(c.x * (1 - m.scale.x), c.y * (1 - m.scale.y), c.z * (1 - m.scale.z));
}
// Pudło obiektu (bez konturów): w świecie
function pudlo(obj) {
  obj.updateMatrixWorld(true); const b = new T.Box3();
  obj.traverse(m => { if (!m.isMesh || m.material.side === T.BackSide) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)); });
  return b;
}
function pulsWierzch() {
  const k = .5 + .5 * Math.sin(czas * 6);
  for (const o of WIERZCH) o.traverse(m => { if (m.userData.poswiata) m.material.color.setRGB(1, .72 + .23 * k, .08 + .3 * k); });   // złoty, pulsuje
  for (let i = RURY.length - 1; i >= 0; i--) { const g = RURY[i]; let a = g; while (a.parent) a = a.parent; if (a !== scene) { RURY.splice(i, 1); continue; } g.userData.krok(czas); }
}
// Trasa po punktach [[x,y],…] w układzie pacjenta: długość L, punkt at(s), rzut proj(p, s0) → {s, d} (szuka w okolicy s0)
function Trasa(pts2) {
  const krz = klKrz(pts2), N = 400, P3 = [], cum = [0];
  for (let i = 0; i <= N; i++) P3.push(krz.getPointAt(i / N));
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + P3[i].distanceTo(P3[i - 1]));
  const L = cum[N];
  const at = s => { s = clamp(s, 0, L); let i = 1; while (i < N && cum[i] < s) i++; const u = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return P3[i - 1].clone().lerp(P3[i], u); };
  const proj = (p, s0) => {
    let best = { s: s0, d: 1e9 };
    for (let i = 1; i <= N; i++) {
      if (cum[i] < s0 - L * .2 || cum[i - 1] > s0 + L * .25) continue;
      const a = P3[i - 1], b = P3[i], abx = b.x - a.x, aby = b.y - a.y, L2 = abx * abx + aby * aby || 1e-6;
      const u = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / L2, 0, 1), d = Math.hypot(a.x + abx * u - p.x, a.y + aby * u - p.y);
      if (d < best.d) best = { s: cum[i - 1] + u * (cum[i] - cum[i - 1]), d };
    }
    return best;
  };
  return { krz, L, at, proj };
}
// Kręta trasa (wężyk): linia [[x,y],…] wygięta na boki falą o amplitudzie amp (jednostki pacjenta), łagodnie od zera na końcach;
// pół fali ~ 3,2 × amp (droga ~1,3 × dłuższa). Dłuższa i ciekawsza droga dla palca, ale cały czas w tym samym miejscu ciała.
function wezyk(pts, amp) {
  if (!amp || pts.length < 2) return pts;
  const krz = klKrz(pts), L = krz.getLength(), fal = Math.max(2, Math.round(L / (amp * 3.2))), n = Math.max(40, fal * 16), out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, p = krz.getPointAt(u), t = krz.getTangentAt(u), k = Math.min(1, u / .1, (1 - u) / .1);
    const a = amp * ease(clamp(k, 0, 1)) * Math.sin(u * fal * PI);
    out.push([p.x - t.y * a, p.y + t.x * a]);
  }
  return out;
}
// Widoczna trasa: jaskrawa rura z ciemnym obrysem (widać ją na każdym organie), kropki płyną do celu, zielone kółko na końcu
const RURY = [];
function rysujTrase(tr, r, col) {
  const g = new T.Group(), mk = (rr, c, o, ro) => { const t = new T.Mesh(new T.TubeGeometry(tr.krz, 600, rr, 8), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthTest: false, depthWrite: false })); t.renderOrder = ro; g.add(t); };
  mk(r * 1.6, 0x0b1a33, .9, 20); mk(r, col, 1, 21);
  const dm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false }), dg = new T.SphereGeometry(r * .42, 8, 6), krok = r * 5, n = Math.max(6, Math.floor(tr.L / krok)), kropki = [];
  for (let i = 0; i < n; i++) { const d = new T.Mesh(dg, dm); d.renderOrder = 22; g.add(d); kropki.push(d); }
  const ring = new T.Mesh(new T.TorusGeometry(r * 3, r * .7, 8, 28), new T.MeshBasicMaterial({ color: 0x7dff6a, transparent: true, depthTest: false }));
  ring.position.copy(tr.at(tr.L)); ring.renderOrder = 23; g.add(ring); g.userData.ring = ring;
  g.userData.krok = t => { const off = (t * r * 6) % krok; kropki.forEach((d, i) => { const s = i * krok + off; d.visible = s < tr.L - r * 3; d.position.copy(tr.at(s)); }); };
  g.userData.krok(0); RURY.push(g);
  return klX(g);
}
// Punkty trasy w świecie (do kadru zabiegu)
function probki(tr, n = 40) { const o = []; for (let i = 0; i <= n; i++) o.push(wLok(tr.at(tr.L * i / n))); return o; }
function rogi(obj) { const b = pudlo(obj); return [b.min, b.max]; }   // cały obiekt w kadrze
// Prowadzenie palcem po trasie: chwyć obiekt, ciągnij wzdłuż; zjazd ze ścieżki (dalej niż W) = puszcza i cofa kawałek
function Prowadz(o) {
  const c = { s: o.s0 || 0, grab: false, wob: 0, koniec: false };
  c.down = p => { if (c.koniec || !p) return false; if (Math.hypot(p.x - o.obj.position.x, p.y - o.obj.position.y) < o.R) { c.grab = true; return true; } return false; };
  c.move = p => {
    if (!c.grab || !p) return;
    const q = o.tr.proj(p, c.s);
    if (q.d > o.W) { c.grab = false; c.s = Math.max(o.s0 || 0, c.s - o.tr.L * .04); c.wob = 1; if (o.wall) o.wall(); return; }
    c.s = clamp(q.s, c.s - o.tr.L * .04, c.s + o.W * 1.5);          // do przodu po kawałku: nie przeskakuje na sąsiedni zakręt
    if (c.s >= o.tr.L * .97) { c.koniec = true; c.grab = false; if (o.end) o.end(); }
  };
  c.up = () => { c.grab = false; };
  c.step = dt => { if (c.koniec) return; const tg = o.tr.at(c.s); tg.z = o.z; o.obj.position.lerp(tg, Math.min(1, dt * 14)); c.wob = Math.max(0, c.wob - dt * 2); };
  c.hint = () => { const a = o.tr.at(Math.min(o.tr.L, c.s + o.tr.L * .22)); a.z = o.z; return [swiat(o.obj), wLok(a)]; };
  return c;
}
// Obłoczek (PRRT!): kilka zielonkawych kulek rośnie i znika
const OBLOKI = [];
function oblok(w) {
  for (let i = 0; i < 7; i++) {
    const m = new T.Mesh(new T.SphereGeometry(.18 * P.k, 8, 6), new T.MeshBasicMaterial({ color: pick([0xc8f0a0, 0xe0f5c0, 0xb5e38a]), transparent: true, opacity: .8, depthTest: false }));
    m.position.copy(w).add(V(rnd(-.3, .3), rnd(-.2, .3), .3)); m.renderOrder = 40; klObie(m); scene.add(m); OBLOKI.push({ m, t: 0, v: V(rnd(-.8, -.2), rnd(.2, .9), 0) });
  }
}
function krokObloki(dt) {
  for (let i = OBLOKI.length - 1; i >= 0; i--) {
    const o = OBLOKI[i]; o.t += dt; o.m.position.addScaledVector(o.v, dt); o.m.scale.setScalar(1 + o.t * 2.2); o.m.material.opacity = Math.max(0, .8 - o.t * .65);
    if (o.t > 1.3) { scene.remove(o.m); OBLOKI.splice(i, 1); }
  }
}

// Połknięta rzecz: losowo do buzi krętym przełykiem albo przez jelita do pupy (PRRT!)
function zPolkniete(kind, tryb) {
  const S = P.rzeczS, pupa = tryb === 'pupa'; let tr = null, ctl = null, item, rura = null, out = null, ringT = 1.5, gigT = 1;
  const Z = { typ: 'polkniete', ic: 'r_' + kind, done: false, rzecz: kind, tryb,
    objaw: kind === 'budzik' ? 'w brzuchu coś dzwoni' : pupa ? 'brzuch burczy' : 'brzuch boli', znalezione: pupa ? 'Coś utknęło w jelitach!' : 'Coś jest w brzuchu!' };
  const sciezka = () => pupa ? P.jelita : wezyk(P.przelyk(), P.wezyk), s0 = () => pupa ? tr.L * .1 : 0;
  Z.prep = () => { tr = Trasa(sciezka()); item = klX(anRzecz(kind, S * .85)); const p0 = tr.at(s0()); item.position.set(p0.x, p0.y, .6 * S); P.w.add(item); naWierzch(item); };
  Z.kotwice = () => [() => swiat(item)];
  Z.fokus = () => { tr = Trasa(sciezka()); return [...probki(tr), ...rogi(item)]; };
  Z.start = () => {
    rura = rysujTrase(tr, px2lok(pupa ? 8 : 9), pupa ? 0xffa53a : 0xff4f9a); P.w.add(rura);
    ctl = Prowadz({ tr, obj: item, z: .6 * S, s0: s0(), W: px2lok(58), R: px2lok(80), end: wyjdz,
      wall: () => { if (P.a.tickle !== undefined) P.a.tickle = 1; snd('hik'); if (kind === 'kaczka') snd('kwa'); dymek('HIK!', swiat(item), 'small'); P.trzes = .5; } });
    mow(pupa ? 'Przeciągnij to przez jelita, aż do pupy!' : 'Wyciągnij to krętym przełykiem do buzi!');
  };
  Z.down = p => { if (ctl && ctl.down(p)) snd(kind === 'kaczka' ? 'kwa' : 'pyk'); };
  Z.move = p => { if (ctl) ctl.move(p); };
  Z.up = () => { if (ctl) ctl.up(); };
  function wyjdz() {
    out = { t: 0, a: item.position.clone(), b: P.w.worldToLocal(GAB.miska.localToWorld(V(0, .5, 0))) }; naWierzch(item, false); klObie(item); idleT = 0;
    if (rura) { P.w.remove(rura); rura = null; } camGo(widokMiska(), 1);              // kamera odjeżdża: widać, jak rzecz wpada do miski
    if (pupa) { snd('prrt'); dymek('PRRT!', swiat(item), 'big'); oblok(swiat(item)); setTimeout(() => mow(RZ_MOWA[kind] + ' Wyszło pupą!'), 800); }
    else { snd('bek'); dymek('BEEEK!', glowaW(), 'big'); P.bek = 1; setTimeout(() => mow(RZ_MOWA[kind]), 700); }
  }
  Z.step = dt => {
    if (rura) rura.userData.ring.scale.setScalar(1 + .25 * Math.sin(czas * 6));
    if (!out) {
      if (ctl) ctl.step(dt);
      const wob = ctl ? ctl.wob : 0, grab = ctl && ctl.grab; item.rotation.z = Math.sin(czas * 9) * (.1 + .3 * wob + (grab ? .12 : 0));
      if (kind === 'budzik' && (ringT -= dt) < 0) { ringT = 3.2; snd('dzwon'); if (ctl) ctl.wob = 1; dymek('DRRR!', swiat(item), 'small'); }
      if (grab && (gigT -= dt) < 0) { gigT = rnd(1.4, 2.6); snd('chichot'); dymek('hi hi', glowaW(), 'small'); if (P.a.tickle !== undefined) P.a.tickle = .7; }
    } else if (!Z.done) {
      out.t = Math.min(1, out.t + dt / 1.1); const e = out.t;
      item.position.lerpVectors(out.a, out.b, e); item.position.y += Math.sin(e * Math.PI) * 2.2 / P.k; item.rotation.z += dt * 9 * (1 - e);
      if (out.t >= 1) { item.rotation.z = 0; snd('lad'); GAB.g.attach(item); lezace.push(item); if (rura) { P.w.remove(rura); rura = null; } Z.done = true; }
    }
  };
  Z.hint = () => out || !ctl ? null : ctl.hint();
  return Z;
}
// Kręta droga organu: od złego miejsca do tułowia, zakosami przez tułów, na koniec na swoje miejsce
function drogaOrganu(a, b) {
  const t = P.tulow, w = t.x1 - t.x0, pts = [a], wnetrze = a[0] > t.x0 && a[0] < t.x1 && a[1] > t.y0 && a[1] < t.y1;
  const wej = wnetrze ? a : [clamp(a[0], t.x0 + w * .1, t.x1 - w * .1), clamp(a[1], t.y0, t.y1)];
  if (!wnetrze) pts.push(wej);
  const n = 3, lewo = Math.random() < .5;
  for (let i = 1; i <= n; i++) {
    const y = wej[1] + (b[1] - wej[1]) * i / (n + 1) + (i % 2 ? .08 : -.08) * (t.y1 - t.y0);
    pts.push([(i % 2) === (lewo ? 1 : 0) ? t.x0 + w * .12 : t.x1 - w * .12, clamp(y, t.y0, t.y1)]);
  }
  pts.push([b[0], b[1]]);
  return pts;
}
function zOrgan(names) {
  const L = names.map(n => ({ n, d: P.organy[n], duch: null, ok: false, snap: null, tr: null, ctl: null, rura: null })); let akt = null;
  const Z = { typ: 'organ', ic: 'o_' + names[0], done: false, objaw: 'kręci mi się w głowie', znalezione: names.map(n => ORG_NAZWA[n]).join(' i ') + ' nie na miejscu!' };
  Z.prep = () => {
    const used = new Set();
    for (const x of L) {                                   // złe miejsce z dalszej połowy (dłuższa droga)
      const opt = x.d.zle.filter(z => !used.has(z + '')).sort((a, b) => Math.hypot(b[0] - x.d.dom[0], b[1] - x.d.dom[1]) - Math.hypot(a[0] - x.d.dom[0], a[1] - x.d.dom[1]));
      const sp = pick(opt.slice(0, Math.max(1, Math.ceil(opt.length / 2)))); used.add(sp + ''); x.d.o.position.set(sp[0], sp[1], x.d.dom[2] + .3); x.d.o.userData.zywy = false; naWierzch(x.d.o);
    }
  };
  Z.kotwice = () => L.map(x => () => swiat(x.d.o));
  let siec = null, naczynia = null;
  Z.fokus = () => {
    siec = P.siecKrew ? Siec(P.siecKrew()) : null;
    const pts = [];
    for (const x of L) {
      const o = x.d.o, droga = siec ? drogaSiecia(siec, [o.position.x, o.position.y], x.d.dom) : drogaOrganu([o.position.x, o.position.y], x.d.dom);
      x.tr = Trasa(wezyk(droga, P.wezyk * .7)); pts.push(...probki(x.tr), ...rogi(o));
    }
    return pts;
  };
  Z.start = () => {
    if (siec) { naczynia = rysujSiec(siec, 'krew', px2lok(5)); P.w.add(naczynia); }
    for (const x of L) {
      const o = x.d.o; x.duch = klX(anDuch(o)); x.duch.position.set(...x.d.dom); x.duch.rotation.z = 0; x.duch.scale.copy(o.scale); P.w.add(x.duch);
      x.rura = rysujTrase(x.tr, px2lok(8), 0xffe03a); x.rura.position.z = x.d.dom[2] + .2; P.w.add(x.rura);
      x.ctl = Prowadz({ tr: x.tr, obj: o, z: x.d.dom[2] + .5, W: px2lok(58), R: px2lok(75) + .35 * o.scale.x, end: () => { x.snap = { a: o.position.clone(), t: 0 }; },
        wall: () => { snd('oj'); dymek('OJ!', swiat(o), 'small'); P.trzes = .3; } });
    }
    mow('Zaprowadź ' + names.map(n => ORG_BIERNIK[n]).join(' i ') + ' naczyniami na swoje miejsce!');
  };
  Z.down = p => { for (const x of L) if (!x.ok && !x.snap && x.ctl && x.ctl.down(p)) { akt = x; snd('pyk'); return; } };
  Z.move = p => { if (akt) akt.ctl.move(p); };
  Z.up = () => { if (akt) akt.ctl.up(); akt = null; };
  Z.step = dt => {
    anDuch.m && (anDuch.m.opacity = .3 + .2 * Math.sin(czas * 5));
    for (const x of L) {
      const o = x.d.o, s0 = o.userData.s0 || o.scale.x;
      if (x.rura) x.rura.userData.ring.scale.setScalar(1 + .25 * Math.sin(czas * 6));
      if (!x.ok && !x.snap) { if (x.ctl) x.ctl.step(dt); o.scale.setScalar(s0 * (x.ctl && x.ctl.grab ? 1.12 : 1)); o.rotation.z = Math.sin(czas * 3 + x.n.length) * .12; }
      if (x.snap) {
        x.snap.t = Math.min(1, x.snap.t + dt / .35); o.position.lerpVectors(x.snap.a, V(...x.d.dom), ease(x.snap.t)); o.rotation.z *= .8; o.scale.setScalar(s0);
        if (x.snap.t >= 1) {
          x.snap = null; x.ok = true; o.rotation.z = 0; o.userData.zywy = true; naWierzch(o, false); P.w.remove(x.duch); P.w.remove(x.rura);
          snd('pyk'); setTimeout(() => snd(ORG_SND[x.n]), 250); mow(ORG_MOWA[x.n]); dymek(img('o_' + x.n, 'dym'), swiat(o), 'emoji');
          if (L.every(y => y.ok)) { if (naczynia) P.w.remove(naczynia); setTimeout(() => { Z.done = true; }, 1800); }
        }
      }
    }
  };
  Z.hint = () => { const x = L.find(x => !x.ok && !x.snap); return x && x.ctl && x.ctl.hint(); };
  return Z;
}
// Pacjent na chwilę w pozycji do zabiegu (w środku gabinetu, przodem lub bokiem) — do liczenia miejsc w jego układzie
function wPozie(fn) {
  const x0 = P.g.position.clone(), ry = P.g.rotation.y;
  P.g.position.set(0, 0, 0); P.g.rotation.y = P.przod ? -PI / 2 : 0; P.g.updateMatrixWorld(true);
  const r = fn(); P.g.position.copy(x0); P.g.rotation.y = ry; P.g.updateMatrixWorld(true); return r;
}
// Sieć (naczynia, nerwy) z linii [[x,y],…]: węzły co kawałek, krawędzie wzdłuż linii; wspólne punkty łączą linie
function Siec(linie) {
  const nodes = [], adj = [], krok = (P.tulow.x1 - P.tulow.x0) * .12;
  const id = p => { for (let i = 0; i < nodes.length; i++) if (Math.hypot(nodes[i][0] - p[0], nodes[i][1] - p[1]) < 1e-3) return i; nodes.push([p[0], p[1]]); adj.push([]); return nodes.length - 1; };
  const lacz = (a, b) => { const d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); adj[a].push([b, d]); adj[b].push([a, d]); };
  for (const l of linie) for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / krok)); let prev = id(a);
    for (let k = 1; k <= n; k++) { const c = id([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); lacz(prev, c); prev = c; }
  }
  return { linie, nodes, adj };
}
// Najkrótsza droga siecią od punktu a do punktu b (Dijkstra; wejście i wyjście przez najbliższe węzły)
function drogaSiecia(S, a, b) {
  const near = p => { let bi = 0, bd = 1e9; S.nodes.forEach((n, i) => { const d = Math.hypot(n[0] - p[0], n[1] - p[1]); if (d < bd) { bd = d; bi = i; } }); return bi; };
  const s = near(a), t = near(b), dist = S.nodes.map(() => 1e9), prev = S.nodes.map(() => -1), done = S.nodes.map(() => false); dist[s] = 0;
  for (;;) {
    let u = -1; for (let i = 0; i < dist.length; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] >= 1e9 || u === t) break; done[u] = true;
    for (const [v, w] of S.adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  const sciezka = []; for (let u = t; u >= 0; u = prev[u]) { sciezka.unshift(S.nodes[u]); if (u === s) break; }
  const pts = [a, ...sciezka, b], out = [pts[0]];                   // bez punktów sklejonych w jedno miejsce
  for (const p of pts.slice(1)) if (Math.hypot(p[0] - out[out.length - 1][0], p[1] - out[out.length - 1][1]) > 1e-3) out.push(p);
  return out;
}
// Rysunek sieci w rentgenie: naczynia = czerwona tętnica + niebieska żyła obok, nerwy = żółte nitki
function rysujSiec(S, rodzaj, r) {
  const g = new T.Group(), kol = rodzaj === 'krew' ? [[0xff4a5a, r * .7], [0x4a7dff, -r * .7]] : [[0xffd23f, 0]];
  for (const l of S.linie) if (l.length > 1) for (const [c, dx] of kol) {
    const m = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .4, depthWrite: false });
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(l.map(p => V(p[0] + dx, p[1] + dx * .5, 0)), false, 'catmullrom', .1), Math.max(8, l.length * 10), r * .55, 6), m));
  }
  g.position.z = -.05; return klX(g);
}
// Układanka kości: kości wysypane obok pacjenta, włóż je po kolei (liczymy na głos); szyja/ogon prostują się z każdą kością
function zUkladanka(U) {
  const DUZY = 1.5, kaw = [], duchy = [], N = U.sloty.length; let n = 0, drag = null, opad = 1;
  const Z = { typ: 'ukladanka', ic: U.ic, done: false, objaw: U.objaw, znalezione: U.znalezione };
  const slotW = i => U.grupa.localToWorld(V(U.sloty[i].x, U.sloty[i].y, U.sloty[i].z || 0));
  const katGrupy = () => new T.Euler().setFromQuaternion(P.w.getWorldQuaternion(new T.Quaternion()).invert().multiply(U.grupa.getWorldQuaternion(new T.Quaternion()))).z;
  Z.prep = () => {
    U.kosci.forEach(o => { o.visible = false; }); if (U.ustaw) U.ustaw(1);
    wPozie(() => { for (let i = 0; i < N; i++) {                     // kupka kości na podłodze, z lewej przed pacjentem
      const k = klX(U.kawalek()); k.position.copy(P.w.worldToLocal(V(P.box.x0 - .4 - (i % 3) * .45, .4 + Math.floor(i / 3) * .45 + (i % 2) * .1, 1))); k.rotation.z = rnd(-1, 1);
      k.scale.setScalar(DUZY); P.w.add(k); kaw.push({ k, ok: false, fly: null });          // na kupce większe: łatwiej chwycić
    } });
  };
  Z.kotwice = () => [() => slotW(N >> 1)];
  Z.fokus = () => [...U.sloty.map((_, i) => slotW(i)), ...kaw.map(c => swiat(c.k))];
  Z.start = () => {
    U.sloty.forEach(sl => { const d = klX(anDuch(U.kawalek())); klPoz(d, sl.x, sl.y, sl.z || 0, sl.rz || 0); U.grupa.add(d); duchy.push(d); });
    mow(U.start);
  };
  Z.down = p => {
    if (!p) return;
    const c = kaw.filter(c => !c.ok && !c.fly).sort((a, b) => a.k.position.distanceTo(p) - b.k.position.distanceTo(p))[0];
    if (c && Math.hypot(p.x - c.k.position.x, p.y - c.k.position.y) < px2lok(75)) { drag = c; snd('stuk'); }
  };
  Z.move = p => { if (drag && p) drag.k.position.set(p.x, p.y, 1.2); };
  Z.up = () => {
    if (!drag) return; const c = drag; drag = null;
    const pk = c.k.position; let best = 1e9;
    for (let i = 0; i < N; i++) { const q = P.w.worldToLocal(slotW(i)); best = Math.min(best, Math.hypot(q.x - pk.x, q.y - pk.y)); }
    if (best < px2lok(120) && n < N) c.fly = { a: c.k.position.clone(), r: c.k.rotation.z, t: 0, i: n++ };
    else c.k.position.z = 1;
  };
  Z.step = dt => {
    const cel = 1 - kaw.filter(c => c.ok).length / N;
    opad += (cel - opad) * Math.min(1, dt * 4); if (U.ustaw) U.ustaw(opad + Math.sin(czas * 2.2) * .05 * cel);
    anDuch.m && (anDuch.m.opacity = .3 + .2 * Math.sin(czas * 5));
    for (const c of kaw) if (c.fly) {
      const f = c.fly, sl = U.sloty[f.i]; f.t = Math.min(1, f.t + dt / .4);
      c.k.position.lerpVectors(f.a, P.w.worldToLocal(slotW(f.i)), ease(f.t)); c.k.rotation.z = f.r + (katGrupy() + (sl.rz || 0) - f.r) * ease(f.t); c.k.scale.setScalar(DUZY + (1 - DUZY) * ease(f.t));
      if (f.t >= 1) {
        c.fly = null; c.ok = true; c.k.scale.setScalar(1); U.grupa.add(c.k); klPoz(c.k, sl.x, sl.y, sl.z || 0, sl.rz || 0); U.grupa.remove(duchy[f.i]);
        const ile = kaw.filter(c => c.ok).length; snd('stuk'); snd('pyk'); mow(LICZ[ile - 1]); dymek(String(ile), swiat(c.k), 'small');
        if (ile === N) { setTimeout(() => { snd('sukces'); mow(U.fakt); dymek('SUPER!', glowaW(), 'big'); }, 900); setTimeout(() => { Z.done = true; }, 3800); }
      }
    }
  };
  Z.hint = () => { const c = kaw.find(c => !c.ok && !c.fly); return c && n < N && [swiat(c.k), slotW(n)]; };
  return Z;
}
// Złamana kość uciekła w inne miejsce ciała; wraca nerwami do swojej kończyny, potem kolorowy gips
function zKosc() {
  const B = P.kosc, k = B.dol, Lk = k.userData.L; let ok = false, snap = null, duch = null, gips = null, tr = null, ctl = null, siec = null, rura = null, nos = null;
  const Z = { typ: 'kosc', ic: 'kosc', done: false, objaw: B.objaw || 'noga boli', znalezione: 'Kość uciekła ' + (B.skad || 'z nogi') + '!' };
  const srodek = (x, y, rz) => V(x - Math.sin(rz) * Lk / 2, y + Math.cos(rz) * Lk / 2, 0);   // środek kości w układzie kończyny
  const domW = () => B.grupa.localToWorld(srodek(B.dom.x, B.dom.y, B.dom.rz));
  Z.prep = () => {                                                   // kość wisi w „nosidełku” (środek kości = środek nosidełka)
    nos = new T.Group(); nos.position.set(B.start[0], B.start[1], .5); P.w.add(nos);
    nos.add(k); const rz = .9; k.rotation.set(0, 0, rz); k.position.set(Math.sin(rz) * Lk / 2, -Math.cos(rz) * Lk / 2, 0);
    P.kulawy = B.konczyna || B.grupa; naWierzch(k);
  };
  Z.kotwice = () => [() => swiat(nos)];
  Z.fokus = () => {
    P.kulawy = null; B.grupa.updateMatrixWorld(true);
    const cel = P.w.worldToLocal(domW());
    siec = Siec(P.siecNerwy()); tr = Trasa(wezyk(drogaSiecia(siec, [nos.position.x, nos.position.y], [cel.x, cel.y]), P.wezyk * .7));
    return [...probki(tr), ...rogi(nos)];
  };
  Z.start = () => {
    duch = klX(anDuch(k)); duch.position.set(B.dom.x, B.dom.y, 0); duch.rotation.set(0, 0, B.dom.rz); B.grupa.add(duch);
    rura = rysujSiec(siec, 'nerwy', px2lok(5)); P.w.add(rura);
    const trasa = rysujTrase(tr, px2lok(8), 0xffe03a); trasa.position.z = .3; rura.add(trasa); rura.userData.ring = trasa.userData.ring;
    ctl = Prowadz({ tr, obj: nos, z: .5, W: px2lok(58), R: px2lok(80), end: () => { B.grupa.attach(k); snap = { a: k.position.clone(), r: k.rotation.z, t: 0 }; },
      wall: () => { snd('oj'); dymek('OJ!', swiat(nos), 'small'); P.trzes = .3; } });
    mow('Kość uciekła ' + (B.skad || 'z nogi') + '! Zaprowadź ją nerwami z powrotem.');
  };
  Z.down = p => { if (!ok && !snap && ctl && ctl.down(p)) snd('pyk'); };
  Z.move = p => { if (ctl) ctl.move(p); };
  Z.up = () => { if (ctl) ctl.up(); };
  Z.step = dt => {
    anDuch.m && (anDuch.m.opacity = .3 + .2 * Math.sin(czas * 5));
    if (rura && rura.userData.ring) rura.userData.ring.scale.setScalar(1 + .25 * Math.sin(czas * 6));
    if (ctl && !snap && !ok) { ctl.step(dt); nos.rotation.z = Math.sin(czas * 3) * .15; }
    if (snap) {
      snap.t = Math.min(1, snap.t + dt / .35); const e = ease(snap.t);
      k.position.lerpVectors(snap.a, V(B.dom.x, B.dom.y, 0), e); k.rotation.z = snap.r + (B.dom.rz - snap.r) * e; k.rotation.x = k.rotation.y = 0;
      if (snap.t >= 1) {
        snap = null; ok = true; B.grupa.remove(duch); P.w.remove(rura); P.w.remove(nos); naWierzch(k, false); snd('chrup'); dymek('CHRUP!', domW(), 'big');
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
  Z.hint = () => ok || snap || !ctl ? null : ctl.hint();
  return Z;
}
// Plasterki (w 3D, bez rentgena): 3 rany na skórze od strony kamery; stuknięcie = kolorowy plaster
function zPlastry() {
  const rany = [], KOL = [0xff8fb1, 0x8fd3ff, 0xffd96a, 0x9be38f, 0xc9a6ff];
  const Z = { typ: 'plastry', ic: 'plaster', done: false, w3d: true, objaw: 'mam zadrapania', znalezione: '' };
  Z.prep = () => {                                         // rany szukamy promieniami z miejsca kamery 3D na pacjenta stojącego w gabinecie
    const B = P.box, rc = new T.Raycaster(), ms = [];
    wPozie(() => {
    P.a.root.traverse(o => { if (o.isMesh && (o.layers.mask & 1) && !o.userData.nd) ms.push(o); });
    const oko = widok3D().pos;
    for (let i = 0; i < 120 && rany.length < 3; i++) {
      const cel = V(rnd(B.x0, B.x1), rnd(B.y1 * .2, B.y1 * .85), 0);
      rc.set(oko, cel.sub(oko).normalize()); const h = rc.intersectObjects(ms, false)[0];
      if (!h || !h.face || rany.some(q => q.w.distanceTo(h.point) < B.y1 * .16)) continue;
      const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); if (n.dot(rc.ray.direction) > -.35) continue;
      const r = B.y1 * .05, b = anZadrapanie(1); b.scale.setScalar(r); b.position.copy(h.point).addScaledVector(n, r * .15); b.quaternion.setFromUnitVectors(V(0, 0, 1), n);
      scene.add(b); h.object.attach(b); rany.push({ b, w: h.point.clone(), s: b.scale.x, ok: false });
    }
    });
  };
  Z.kotwice = () => [];
  Z.start = () => { lupa.cel = 0; camGo(widok3D(), 1.2); mow('Na koniec plasterki! Stuknij w każde zadrapanie.'); if (!rany.length) Z.done = true; };
  Z.tap = (x, y) => {
    const c = rany.filter(q => !q.ok).map(q => { const [X, Y] = toScreen(swiat(q.b)); return { q, d: Math.hypot(X - x, Y - y) }; }).sort((a, b) => a.d - b.d)[0];
    if (!c || c.d > 80) { snd('oj'); return; }
    const q = c.q, pl = anPlaster(1, pick(KOL)); q.ok = true;
    pl.scale.setScalar(q.s); pl.position.copy(q.b.position); pl.quaternion.copy(q.b.quaternion); pl.rotateZ(rnd(-.9, .9)); q.b.parent.add(pl); q.b.visible = false;
    snd('gips'); snd('pyk'); dymek(pick(['PAC!', 'Au… już!', 'Dzięki!']), swiat(pl), 'small'); if (P.a.tickle !== undefined) P.a.tickle = .6;
    if (rany.every(q => q.ok)) { setTimeout(() => mow('Wszystkie zadrapania zaklejone!'), 500); setTimeout(() => { Z.done = true; }, 1600); }
  };
  Z.down = Z.move = Z.up = () => {};
  Z.step = () => { for (const q of rany) if (!q.ok) q.b.scale.setScalar(q.s * (1 + .12 * Math.sin(czas * 7))); };
  Z.hint = () => { const q = rany.find(q => !q.ok); if (!q) return null; const w = swiat(q.b); return [w.clone().add(V(P.box.y1 * .12, P.box.y1 * .18, 0)), w]; };
  return Z;
}
const ORGANY_DO_ZGUBIENIA = { zyrafa: ['serce', 'watroba', 'nerki'], slon: ['mozg', 'watroba', 'pecherz'], pingwin: ['serce', 'mozg', 'watroba', 'nerki', 'pecherz'],
  doktor: ['serce', 'zoladek', 'pluca', 'mozg', 'watroba', 'nerki', 'pecherz'] };
// Wizyta: 3 losowe zabiegi z puli pacjenta (układanka kości, połknięta rzecz, organ, złamana kość) + plasterki na koniec
function zabiegi(kind) {
  const rz = kind === 'slon' && Math.random() < .6 ? 'budzik' : kind === 'pingwin' && Math.random() < .5 ? 'lod' : pick(RZECZY), tryb = Math.random() < .5 ? 'pupa' : 'buzia';
  const organy = ORGANY_DO_ZGUBIENIA[kind].filter(o => P.organy[o] && P.organy[o].zle.length).sort(() => Math.random() - .5).slice(0, kind === 'doktor' ? 2 : 1);
  const pula = [], test = new URLSearchParams(location.search).get('zabiegi');   // ?zabiegi=ukladanka,kosc — do testów
  if (P.ukladanki && P.ukladanki.length) { const U = pick(P.ukladanki); pula.push({ t: 'ukladanka', f: () => zUkladanka(U) }); }
  pula.push({ t: 'polkniete', f: () => zPolkniete(rz, tryb) }, { t: 'organ', f: () => zOrgan(organy) });
  if (P.kosc) pula.push({ t: 'kosc', f: () => zKosc() });
  const wybor = test ? pula.filter(p => test.split(',').includes(p.t)) : pula.map((p, i) => ({ ...p, i, r: Math.random() })).sort((a, b) => a.r - b.r).slice(0, 3).sort((a, b) => a.i - b.i);
  return [...wybor.map(w => w.f()), zPlastry()];
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
  $('pick').innerHTML = KINDS.map(k => `<button class="btn" data-k="${k}">${img('p_' + k, 'ico')}${NAZWY[k]}<span class="gw">${img('gwiazda').repeat(Math.min(5, SET.wyleczeni[k] || 0))}</span></button>`).join('');
  $('bSnd').innerHTML = $('bSnd2').innerHTML = SVG_IKONY[AUD.on ? 'glos' : 'cisza'];
}
function czysc() { WIERZCH.length = 0; OBLOKI.forEach(o => scene.remove(o.m)); OBLOKI.length = 0; lezace.forEach(o => GAB.g.remove(o)); lezace = []; $('bLizak').hidden = true; $('znaki').innerHTML = ''; $('fx').innerHTML = ''; paleta(false); $('bRtg').hidden = true; $('lupa').hidden = true; $('raczka').hidden = true; }
function startWizyta(kind) {
  audInit(); obrotPelny(); snd('klik');
  SET.kind = kind; save();
  if (P) scene.remove(P.g);
  MENU_P.forEach(p => p.g.visible = false);
  P = klPacjent(kind); P.g.position.set(-11, 0, 6.1); P.droga = [[0, 6.1], [0, 0]];   // chodnikiem z lewej, potem do gabinetu (kamera idzie za nim)
  scene.add(P.g);
  GAB.miska.position.set(P.box.x0 - 1.0, .06, 1.2);
  czysc();                                                  // najpierw sprzątanie (czyści też listę podświetlonych), potem przygotowanie zabiegów
  zadania = zabiegi(kind); zi = -1; zadania.forEach(z => z.prep());
  $('menu').hidden = true; $('end').hidden = true; $('hud').hidden = false; $('confetti').innerHTML = '';
  $('zad').innerHTML = zadania.map(z => `<b>${img(z.ic)}</b>`).join('');
  lupa.r = lupa.cel = 0;
  setState('wejscie'); camGo(widok3D(P.g.position), 1.2);
}
function rentgen() {
  if (state !== 'objaw') return;
  snd('rtg'); $('bRtg').hidden = true; setState('skan'); ostatni = 0; camGo(widokBok(), 1.3); P.g.rotation.y = P.przod ? -PI / 2 : 0;
  problemy = zadania.flatMap((z, i) => z.kotwice().map(f => ({ f, z, t: 0, found: false, el: null })));
  setTimeout(() => {
    const [X, Y] = toScreen(V(P.box.x1, P.box.y1 * .12, 0));          // lupa zaczyna przy łapach z przodu, nie na problemach
    lupa.cc.set(clamp(X / innerWidth, .15, .85), clamp(1 - Y / innerHeight, .15, .85)); lupa.c.copy(lupa.cc); lupa.cel = pion() ? .13 : .2;
    mow('Szukaj lupą! Co jest w środku?');
  }, 1300);
}
function nastepneZadanie() {
  zi++; idleT = 0;
  [...$('zad').children].forEach((b, i) => { b.classList.toggle('ok', i < zi); b.classList.toggle('teraz', i === zi); });
  if (zi >= zadania.length) { zdrowy(); return; }
  const z = zadania[zi];
  if (!z.w3d) { if (lupa.cel < 1) lupa.cel = 3; z.roi = z.fokus ? z.fokus() : null; camGo(widokZad(z), 1); }   // zbliżenie na miejsce zabiegu
  z.start();
}
function zdrowy() {
  setState('zdrowy'); lupa.cel = 0; camGo(widok3D(), 1.4); snd('sukces'); P.lizakT = null;
  if (P.a.human) P.taniec = true; else { P.a.jumpT = 2.4; ZOO.pose(P.a, 'cheer', 6); }
  setTimeout(() => { if (state === 'zdrowy' && P.lizakT == null) { $('bLizak').hidden = false; mow('Daj lizaka dzielnemu pacjentowi!'); } }, 4200);
  SET.wyleczeni[P.kind] = (SET.wyleczeni[P.kind] || 0) + 1; save();
  setTimeout(() => { mow('Zdrowy! ' + FAKT[P.kind]); if (GLOS[P.kind]) snd(GLOS[P.kind]); }, 900);
  const cf = $('confetti'); cf.innerHTML = '';
  for (let i = 0; i < 30; i++) { const d = document.createElement('i'); d.innerHTML = img(pick(['gwiazda', 'gwiazda', 'plaster', 'lizak', 'o_serce'])); Object.assign(d.style, { left: rnd(0, 100) + '%', animationDuration: rnd(2, 4) + 's', animationDelay: rnd(0, 1.2) + 's' }); cf.append(d); }
}
function koniec() {
  setState('koniec'); $('hud').hidden = true; $('end').hidden = false;
  $('endIc').innerHTML = img('p_' + P.kind); $('endNakl').innerHTML = img('gwiazda').repeat(Math.min(5, SET.wyleczeni[P.kind]));
  nastepny = (KINDS.indexOf(P.kind) + 1) % KINDS.length;
}
function dajLizaka() {
  if (state !== 'zdrowy' || P.lizakT != null) return;
  $('bLizak').hidden = true; P.lizakT = stT;
  const l = anLizak(P.box.y1 * .2), w = glowaW().add(P.przod ? V(.15 * P.box.y1, -.12 * P.box.y1, .25 * P.box.y1) : V(.2 * P.box.y1, -.1 * P.box.y1, .2 * P.box.y1));
  l.position.copy(w); l.rotation.z = -.4; scene.add(l); P.glowa.attach(l);
  snd('mniam'); dymek('MNIAM!', w, 'big'); setTimeout(() => mow('Mniam! Dziękuję!'), 300);
  if (P.a.human) P.taniec = true; else P.a.jumpT = 2;
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
  else if (state === 'operacja' && zadania[zi]) { if (zadania[zi].w3d) zadania[zi].tap(e.clientX, e.clientY); else zadania[zi].down(lokal(e.clientX, e.clientY)); }
  else if (state === 'objaw' && P) { dymek(pick(['Au!', 'Ojej!', 'Hi hi!']), glowaW(), 'small'); snd('oj'); }
  else if (state === 'menu') {                             // poczekalnia: stuknięty pacjent woła i podskakuje
    const c = MENU_P.map(p => { const [X, Y] = toScreen(swiat(p.glowa)); return { p, d: Math.hypot(X - e.clientX, Y - e.clientY) }; }).sort((a, b) => a.d - b.d)[0];
    if (c && c.d < 150) { const p = c.p; if (GLOS[p.kind]) snd(GLOS[p.kind]); else mow('Dzień dobry!', false); if (p.a.human) p.g.position.y = .4; else p.a.jumpT = 1; komiksDymek($('fx'), pick(['Hej!', 'Cześć!', 'To ja!']), ...toScreen(swiat(p.glowa)), 'small'); }
  }
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
$('bLizak').onclick = () => { audInit(); dajLizaka(); };
$('paleta').addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (b && zadania[zi] && zadania[zi].kolor) zadania[zi].kolor(b.dataset.c); });
$('bDom').onclick = () => { if (window.speechSynthesis) speechSynthesis.cancel(); showMenu(); };
$('bHome').onclick = showMenu;
$('bNext').onclick = () => startWizyta(KINDS[nastepny]);
$('bSnd').onclick = $('bSnd2').onclick = () => { audInit(); audMute(!AUD.on); if (!AUD.on && window.speechSynthesis) speechSynthesis.cancel(); buildMenu(); };
addEventListener('keydown', e => { if (e.code === 'Enter' && state === 'menu') startWizyta(SET.kind); if (e.code === 'Space' && state === 'objaw') rentgen(); });

/* ---------- pętla ---------- */
// Marsz po punktach P.droga ([x, z] w świecie); zwraca true po dojściu do ostatniego; P.ryCel = kierunek patrzenia
function idzDroga(v) {
  const cel = P.droga && P.droga[0]; if (!cel) return true;
  const dx = cel[0] - P.g.position.x, dz = cel[1] - P.g.position.z, d = Math.hypot(dx, dz);
  if (d > 1e-4) P.ryCel = Math.atan2(-dz, dx);
  if (d <= v) { P.g.position.x = cel[0]; P.g.position.z = cel[1]; P.droga.shift(); return !P.droga.length; }
  P.g.position.x += dx / d * v; P.g.position.z += dz / d * v; return false;
}
const STOPA = { zyrafa: 'krok', slon: 'krok_slon', doktor: 'krok', pingwin: 'czlap' };
const GLOS = { zyrafa: 'mruk', slon: 'trab', pingwin: 'pingwin' };
function animPacjent(p, dt, idzie) {
  klAnim(p, dt, idzie ? 1 : 0);
  for (const n in p.organy) anTik(p.organy[n].o, p.t);
  if (p.mozgGlowy) anTik(p.mozgGlowy, p.t);
}
function step(dt) {
  czas += dt; stT += dt;
  if (state === 'menu') {
    MENU_P.forEach(p => { animPacjent(p, dt, false); if (p.a.human) { p.a.armOn.rotation.z = 2.6 + Math.sin(czas * 7) * .35; p.g.position.y = Math.max(0, p.g.position.y - dt * 1.6); } });   // doktor macha
  }
  if (P) {
    const idzie = state === 'wejscie' || state === 'wyjscie';
    animPacjent(P, dt, idzie);
    if (P.kulawy && (state === 'wejscie' || state === 'objaw')) { if (P.kosc.unies) P.kosc.unies(P.kulawy, czas); else P.kulawy.rotation.z = (P.a.human ? 1.1 : .6) + Math.sin(czas * 3) * .05; }   // oszczędza chorą nogę / rękę / skrzydło
    // obrót: idąc patrzy w stronę marszu; na miejscu wyprostowani stają przodem do dziecka, czworonogi bokiem
    const ry = idzie && P.ryCel !== undefined ? P.ryCel : P.przod ? -PI / 2 : 0, dr = ((ry - P.g.rotation.y) % (2 * PI) + 3 * PI) % (2 * PI) - PI;
    P.g.rotation.y += dr * Math.min(1, dt * 6);
    P.trzes = Math.max(0, (P.trzes || 0) - dt); P.g.rotation.z = Math.sin(czas * 40) * .03 * P.trzes;
    if (P.bek > 0) { P.bek = Math.max(0, P.bek - dt * 1.2); P.glowa.rotation.z += Math.sin(P.bek * 20) * .12 * P.bek; }
    if (state === 'objaw' && zadania.some(z => z.typ === 'organ')) P.g.rotation.z += Math.sin(czas * 2.2) * .03;
    if (idzie) {
      P.doszedl = idzDroga((P.kind === 'slon' ? 3.6 : 4.4) * dt);
      if (Math.floor(P.t * 7 / Math.PI) !== Math.floor((P.t - dt) * 7 / Math.PI)) snd(STOPA[P.kind]);
    }
  }
  switch (state) {
    case 'wejscie':
      if (P.doszedl) {
        P.doszedl = false; setState('objaw');
        if (GLOS[P.kind]) snd(GLOS[P.kind]);
        const sl = zadania.map(z => z.objaw), zd = sl.slice(0, -1).join(', ') + ' i ' + sl[sl.length - 1]; mow('Ojej! ' + zd[0].toUpperCase() + zd.slice(1) + '!');
        setTimeout(() => { if (state === 'objaw') $('bRtg').hidden = false; }, 1500);
      }
      break;
    case 'objaw':
      if (stT % 2.4 < dt && stT > .5) { const z = zadania[Math.floor(stT / 2.4) % zadania.length]; dymek({ polkniete: 'BRZUCH!', organ: 'OJ, OJ!', kregi: 'SZYJA!', kosc: 'AUĆ!', plastry: 'AUĆ!' }[z.typ], glowaW(), 'small'); }
      break;
    case 'skan': {
      if (lupa.cel <= 0) break;
      const asp = innerWidth / innerHeight;
      for (const q of problemy) {
        if (q.found) continue;
        const [X, Y] = toScreen(q.f()), d = Math.hypot((X / innerWidth - lupa.c.x) * asp, (1 - Y / innerHeight) - lupa.c.y);
        if (d < lupa.r * .85 && ptr) { q.t += dt; if (q.t > .6) { q.found = true; ostatni = stT; snd('znalazl'); mow(q.z.znalezione); q.el = document.createElement('div'); q.el.className = 'znak'; q.el.textContent = '!'; $('znaki').append(q.el); } }
      }
      if (problemy.every(q => q.found) && stT > ostatni + 1.6 && stT > 5) { setState('otwieranie'); }   // chwila, żeby obejrzeć rentgen
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
      if (P.a.human) P.g.position.y = stT < 2.6 ? Math.abs(Math.sin(stT * 6)) * .6 * (1 - stT / 2.6) : 0;
      if (P.lizakT != null ? stT > P.lizakT + 3.2 : stT > 11) {     // po lizaku (albo bez niego) zawraca i wychodzi drzwiami
        setState('wyjscie'); $('bLizak').hidden = true; P.taniec = false; if (!P.a.human) ZOO.pose(P.a, null); P.droga = [[0, 6.1], [12, 6.1]]; P.doszedl = false;
      }
      break;
    case 'wyjscie':
      if (P.doszedl) koniec();
      break;
  }
  if (P && (state === 'wejscie' || state === 'wyjscie')) {      // kamera idzie za pacjentem
    const v = widok3D(P.g.position);
    if (camK < 1) camTo = v; else { const k = Math.min(1, dt * 3); cam.position.lerp(v.pos, k); camLook.lerp(v.look, k); }
  }
  pulsWierzch(); krokObloki(dt);
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
  cam.layers.set(0); scene.background = BG; renderer.setRenderTarget(null); renderer.shadowMap.needsUpdate = true; renderer.render(scene, cam);
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
  problemy: () => problemy.map(q => ({ xy: toScreen(q.f()), found: q.found })), paleta: () => !$('paleta').hidden, lizak: () => !$('bLizak').hidden, rentgen };
showMenu();
requestAnimationFrame(frame);
