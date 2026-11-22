'use strict';
// Klinika Zoo — zabiegi bez rentgena (w 3D, kamera z ukosa); na wizycie jeden losowy, przed plasterkami:
//   drzazga (chwyć i pociągnij) · stetoskop (szukaj serca: im bliżej, tym szybciej bije; potem stukaj w rytm) ·
//   termometr i syrop (zanieś termometr do pyszczka, wybierz syrop z obrazkiem pacjenta) · pchły (złap 5, liczymy) ·
//   bandaż (kręć palcem w kółko: łapa, szyja żyrafy, cała mumia) · mycie kłów / zębów / dzioba (słoń — kły, tygrys i lew — dorobione kły, żyrafa i doktor — zęby, pingwin — dziób).
// Każdy zabieg: { typ, ic, w3d: true, objaw, prep(), kotwice(), widok(), start(), down/move/up(x, y) — piksele ekranu, step(dt), hint(), done }
// hint() → [świat, świat] albo { ekran: true, a: [x, y], b: [x, y] } (rączka-podpowiedź).
// wymaga z gry (klinika/game.js):  P, scene, camGo, widok3D, dopasujPkt, naroza, wPozie, rozmiar, toScreen, swiat, glowaW, dymek, img, IKONA,
//   NAZWY, KINDS, LICZ, czas, idleT, UI3D, KIER3D, naWierzch, lupa; klinika/dzwieki.js (snd, mow); models/anatomy.js; lib/3d/three.js (T, V, rnd, pick)

/* --- pomocnicze --- */
// Pudło obiektu w jego własnym układzie (tylko widoczne siatki skóry, bez konturów, kości i rentgena)
function pudloLok(obj) {
  obj.updateMatrixWorld(true);
  const b = new T.Box3(), inv = obj.matrixWorld.clone().invert(), mm = new T.Matrix4();
  obj.traverse(m => { if (!m.isMesh || !(m.layers.mask & 1) || m.material.side === T.BackSide || m.userData.nd) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(mm.multiplyMatrices(inv, m.matrixWorld))); });
  return b;
}
const siatkiSkory = root => { const ms = []; root.traverse(o => { if (o.isMesh && (o.layers.mask & 1) && !o.userData.nd && o.material.side !== T.BackSide) ms.push(o); }); return ms; };
// Punkty na skórze widoczne z kamery 3D: promienie z oka w losowe punkty pudła b (świat); fn(trafienie, normalna) w pozie pacjenta
function skora(n, ms, b, odstep, fn) {
  const rc = new T.Raycaster(), out = [];
  wPozie(() => {
    const oko = widok3D().pos;
    for (let i = 0; i < 260 && out.length < n; i++) {
      const cel = V(rnd(b.min.x, b.max.x), rnd(b.min.y, b.max.y), rnd(b.min.z, b.max.z));
      rc.set(oko, cel.sub(oko).normalize()); const h = rc.intersectObjects(ms, false)[0];
      if (!h || !h.face || out.some(q => q.p.distanceTo(h.point) < odstep)) continue;
      const nn = h.face.normal.clone().transformDirection(h.object.matrixWorld); if (nn.dot(rc.ray.direction) > -.3) continue;
      const q = { p: h.point.clone(), n: nn, o: h.object }; out.push(q); if (fn) fn(q);
    }
  });
  return out;
}
// Kadr 3D na obszar (środek c, promień R), nie ciaśniej niż ~ 1/3 pacjenta
function widokNa(c, R) { R = Math.max(R, rozmiar() * .3); return dopasujPkt(naroza(c.x - R, c.x + R, c.y - R, c.y + R, c.z - R, c.z + R), KIER3D, UI3D(), .05); }
const konczynaW = () => { const b = pudloLok(P.konczyna), h = b.max.y - b.min.y; return { b, c: P.konczyna.localToWorld(V((b.min.x + b.max.x) / 2, b.min.y + h * .35, (b.min.z + b.max.z) / 2)), R: b.getSize(V()).length() / 2 * P.k }; };
// Narzędzie (obrazek DOM) przesuwane palcem
const NARZ = { el: () => $('narz'), pokaz(ic, x, y) { const e = this.el(); e.innerHTML = img(ic); e.hidden = false; this.at(x, y); }, at(x, y) { const e = this.el(); e.style.left = x + 'px'; e.style.top = y + 'px'; }, schowaj() { this.el().hidden = true; } };
const DOP = { zyrafa: 'żyrafy', slon: 'słonia', pingwin: 'pingwina', doktor: 'doktora', tygrys: 'tygrysa', lew: 'lwa' };

/* --- drzazgi w łapie: chwyć i pociągnij (110 px) --- */
function zDrzazga() {
  const kol = []; let drag = null, gotowe = 0;
  const Z = { typ: 'drzazga', ic: 'drzazga', w3d: true, done: false, objaw: 'coś mnie kłuje w ' + P.lapa[1], znalezione: '' };
  Z.prep = () => {
    const ms = siatkiSkory(P.konczyna), L = P.box.y1 * .15;
    wPozie(() => P.konczyna.updateMatrixWorld(true));
    const bl = pudloLok(P.konczyna), h = bl.max.y - bl.min.y, dol = new T.Box3(V(bl.min.x, bl.min.y + h * .1, bl.min.z), V(bl.max.x, bl.min.y + h * .6, bl.max.z));
    let bw; wPozie(() => { bw = dol.clone().applyMatrix4(P.konczyna.matrixWorld); });
    skora(3, ms, bw, L * .9, q => {
      const d = anDrzazga(L); d.position.copy(q.p); d.quaternion.setFromUnitVectors(V(0, 0, 1), q.n); d.rotateX(rnd(-.35, .35)); d.rotateY(rnd(-.35, .35));
      scene.add(d); q.o.attach(d); kol.push({ d, p0: d.position.clone(), wy: 0, out: null, L });
    });
  };
  Z.kotwice = () => [];
  Z.widok = () => { const k = konczynaW(); return widokNa(k.c, k.R * .7); };
  Z.start = () => { kol.forEach(k => naWierzch(k.d)); lupa.cel = 0; camGo(Z.widok(), 1.2); mow('Drzazgi w ' + (P.lapa[0] === 'noga' ? 'nodze' : P.lapa[0] === 'łapka' ? 'łapce' : 'łapie') + '! Chwyć każdą i pociągnij.'); if (!kol.length) Z.done = true; };
  const ekr = k => toScreen(swiat(k.d));
  Z.down = (x, y) => {
    const c = kol.filter(k => !k.out).map(k => { const [X, Y] = ekr(k); return { k, d: Math.hypot(X - x, Y - y) }; }).sort((a, b) => a.d - b.d)[0];
    if (c && c.d < 80) { drag = { k: c.k, x, y }; snd('pyk'); if (P.a.tickle !== undefined) P.a.tickle = .5; }
  };
  Z.move = (x, y) => {
    if (!drag) return; const k = drag.k; k.wy = clamp(Math.hypot(x - drag.x, y - drag.y) / 110, 0, 1);
    if (k.wy >= 1) {                                         // wyszła!
      k.out = { t: 0, a: swiat(k.d) }; naWierzch(k.d, false); scene.attach(k.d); drag = null; gotowe++;
      snd('pyk'); snd('gwiazda'); dymek(pick(['PYK!', 'Wyszła!', 'Uff!']), k.out.a, 'small'); if (P.a.tickle !== undefined) P.a.tickle = .7;
      if (gotowe === kol.length) { setTimeout(() => mow('Wszystkie drzazgi wyjęte! Już nie kłuje.'), 500); setTimeout(() => { Z.done = true; }, 1800); }
    }
  };
  Z.up = () => { if (drag) { snd('oj'); dymek('Mocniej!', ekrW(drag.k), 'small'); drag = null; } };
  const ekrW = k => swiat(k.d);
  Z.step = dt => {
    for (const k of kol) {
      if (k.out) { k.out.t += dt; k.d.position.y += dt * 2.5 * P.k; k.d.rotation.z += dt * 8; k.d.scale.setScalar(Math.max(.01, 1 - k.out.t * 1.3)); if (k.out.t > .8 && k.d.parent) k.d.parent.remove(k.d); continue; }
      if (!drag || drag.k !== k) k.wy = Math.max(0, k.wy - dt * 3);          // puszczona wraca
      k.d.position.copy(k.p0); k.d.translateZ(k.wy * k.L * .9 + Math.sin(czas * 20) * k.L * .02 * (drag && drag.k === k ? 1 : 0));
    }
  };
  Z.hint = () => { const k = kol.find(k => !k.out); if (!k) return null; const w = swiat(k.d), n = V(0, 0, 1).applyQuaternion(k.d.getWorldQuaternion(new T.Quaternion())); return [w, w.clone().addScaledVector(n, k.L * 2.5)]; };
  return Z;
}

/* --- stetoskop: szukaj serca (bije szybciej, gdy blisko), potem 4 stuknięcia w rytm --- */
function zStetoskop() {
  let poz = null, grab = false, beatT = 0, trzym = 0, faza = 'szukaj', stuk = 0, rytmT = 0;
  const Z = { typ: 'stetoskop', ic: 'stetoskop', w3d: true, done: false, objaw: 'serce mi mocno bije', znalezione: '' };
  Z.prep = () => {}; Z.kotwice = () => [];
  Z.widok = () => widok3D();
  const serceE = () => toScreen(swiat(P.organy.serce.o));
  Z.start = () => { lupa.cel = 0; camGo(Z.widok(), 1.2); poz = [80, innerHeight - 150]; NARZ.pokaz('stetoskop', ...poz); mow('Posłuchaj serca! Przesuwaj słuchawkę, aż usłyszysz bum, bum.'); };
  const naPalcu = (x, y) => { poz = [x, y - 70]; NARZ.at(...poz); };
  Z.down = (x, y) => {
    if (faza === 'szukaj') { grab = true; naPalcu(x, y); return; }
    if (faza === 'rytm' && stuk < 4) {
      stuk++; snd('bum'); dymek(LICZ[stuk - 1] + '!', swiat(P.organy.serce.o), 'small'); mow(LICZ[stuk - 1], false); $('bicie').classList.remove('bij'); void $('bicie').offsetWidth; $('bicie').classList.add('bij');
      if (stuk === 4) { setTimeout(() => { snd('sukces'); mow('Serce bije zdrowo!'); $('bicie').hidden = true; }, 500); setTimeout(() => { Z.done = true; }, 2200); }
    }
  };
  Z.move = (x, y) => { if (grab && faza === 'szukaj') naPalcu(x, y); };
  Z.up = () => { grab = false; };
  Z.step = dt => {
    const [hx, hy] = serceE();
    if (faza === 'szukaj') {
      const d = Math.hypot(poz[0] - hx, poz[1] - hy), per = clamp(.28 + d / 320, .28, 1.4);
      if ((beatT += dt) > per) { beatT = 0; if (d < 320) { snd('bum'); const e = $('narz'); e.classList.remove('bij'); void e.offsetWidth; e.classList.add('bij'); } }
      if (d < 60) { if ((trzym += dt) > 1.2) {
        faza = 'rytm'; NARZ.schowaj(); snd('znalazl'); mow('Słychać serce! Stukaj razem z sercem: bum, bum!');
        const b = $('bicie'); b.innerHTML = img('o_serce'); b.hidden = false; b.style.left = hx + 'px'; b.style.top = hy + 'px';
      } } else trzym = Math.max(0, trzym - dt);
    } else if (faza === 'rytm' && stuk < 4) {
      const b = $('bicie'); b.style.left = hx + 'px'; b.style.top = hy + 'px';
      if ((rytmT += dt) > .8) { rytmT = 0; b.classList.remove('bij'); void b.offsetWidth; b.classList.add('bij'); }
    }
  };
  Z.koniec = () => { NARZ.schowaj(); $('bicie').hidden = true; };
  Z.hint = () => { const h = serceE(); return faza === 'szukaj' ? { ekran: true, a: poz, b: h } : { ekran: true, a: [h[0] + 60, h[1] - 60], b: h }; };
  return Z;
}

/* --- termometr do pyszczka, potem syrop z obrazkiem pacjenta --- */
function zTermometr() {
  let poz = null, grab = false, faza = 'nies', mierz = 0;
  const Z = { typ: 'termometr', ic: 'termometr', w3d: true, done: false, objaw: 'jestem cały gorący', znalezione: '' };
  Z.prep = () => {}; Z.kotwice = () => [];
  Z.widok = () => widok3D();
  const buzia = () => { const pr = P.przelyk(), m = pr[pr.length - 1]; return toScreen(P.w.localToWorld(V(m[0], m[1], 0))); };   // koniec przełyku = pyszczek
  Z.start = () => { lupa.cel = 0; camGo(Z.widok(), 1.2); poz = [80, innerHeight - 150]; NARZ.pokaz('termometr', ...poz); mow('Zmierz temperaturę! Zanieś termometr do pyszczka.'); };
  Z.down = (x, y) => { if (faza === 'nies' && Math.hypot(x - poz[0], y - poz[1]) < 110) { grab = true; snd('pyk'); } };
  Z.move = (x, y) => { if (!grab || faza !== 'nies') return; poz = [x, y - 50]; NARZ.at(...poz); const b = buzia(); if (Math.hypot(poz[0] - b[0], poz[1] - b[1]) < 90) { faza = 'mierz'; grab = false; snd('stuk'); } };
  Z.up = () => { grab = false; };
  function syropy() {
    const inne = KINDS.filter(k => k !== P.kind).sort(() => Math.random() - .5).slice(0, 2), k3 = [P.kind, ...inne].sort(() => Math.random() - .5), el = $('syropy');
    el.innerHTML = k3.map((k, i) => `<button class="btn" data-k="${k}">${img('syrop' + i)}<span>${img('p_' + k)}</span></button>`).join(''); el.hidden = false;
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b || faza !== 'syrop') return;
      if (b.dataset.k === P.kind) { faza = 'koniec'; el.hidden = true; snd('syrop'); setTimeout(() => snd('mniam'), 400); dymek('MNIAM!', glowaW(), 'big'); mow('Mniam! Gorączka zaraz minie.'); setTimeout(() => { Z.done = true; }, 2000); }
      else { snd('oj'); mow('To syrop dla ' + DOP[b.dataset.k] + '!'); b.classList.remove('nie'); void b.offsetWidth; b.classList.add('nie'); }
    };
  }
  Z.step = dt => {
    if (faza === 'mierz') {
      const b = buzia(); poz = [b[0], b[1]]; NARZ.at(...poz); mierz += dt;
      if (mierz > 1.6) { faza = 'syrop'; NARZ.schowaj(); dymek('39°!', glowaW(), 'big'); snd('oj'); mow('Gorączka! Daj syrop. Który jest dla ' + DOP[P.kind] + '?'); syropy(); idleT = 1; }
      else if (Math.floor(mierz * 3) !== Math.floor((mierz - dt) * 3)) snd('skan');
    }
  };
  Z.koniec = () => { NARZ.schowaj(); $('syropy').hidden = true; };
  Z.hint = () => {
    if (faza === 'nies') return { ekran: true, a: poz, b: buzia() };
    if (faza === 'syrop') { const b = $('syropy').querySelector(`[data-k="${P.kind}"]`); if (!b) return null; const r = b.getBoundingClientRect(); return { ekran: true, a: [r.left + r.width / 2, r.top - 60], b: [r.left + r.width / 2, r.top + r.height / 2] }; }
    return null;
  };
  return Z;
}

/* --- pchły: 5 skacze po sierści, stuknij, żeby złapać (liczymy) --- */
function zPchly() {
  const N = 5, pchly = [], miejsca = []; let zlapane = 0;
  const Z = { typ: 'pchly', ic: 'pchla', w3d: true, done: false, objaw: 'wszystko mnie swędzi', znalezione: '' };
  Z.prep = () => {}; Z.kotwice = () => [];
  Z.widok = () => widok3D();
  const posadz = (f, q) => { f.q = q; f.m.position.copy(q.p).addScaledVector(q.n, f.s * .15); f.m.quaternion.setFromUnitVectors(V(0, 0, 1), q.n); f.m.rotateZ(rnd(0, 6.3)); };
  Z.start = () => {
    lupa.cel = 0; camGo(Z.widok(), 1.2);
    const b = new T.Box3(V(P.box.x0, P.box.y1 * .15, P.box.z0), V(P.box.x1, P.box.y1 * .9, P.box.z1));
    skora(24, siatkiSkory(P.a.root), b, P.box.y1 * .08, q => miejsca.push(q));
    const s = P.box.y1 * .05;
    for (let i = 0; i < Math.min(N, miejsca.length); i++) { const f = { m: anPchla(s), s, hop: null, t: rnd(.6, 1.8), ok: false }; posadz(f, miejsca[i]); scene.add(f.m); pchly.push(f); }
    mow('Pchły! Złap wszystkie, stukaj w nie palcem.'); if (!pchly.length) Z.done = true;
  };
  Z.down = (x, y) => {
    const c = pchly.filter(f => !f.ok).map(f => { const [X, Y] = toScreen(f.m.position); return { f, d: Math.hypot(X - x, Y - y) }; }).sort((a, b) => a.d - b.d)[0];
    if (!c || c.d > 75) { snd('skok'); return; }
    const f = c.f; f.ok = true; f.hop = null; f.zl = 0; zlapane++; snd('zlap'); mow(LICZ[zlapane - 1], false); dymek(zlapane + '', f.m.position, 'small'); if (P.a.tickle !== undefined) P.a.tickle = .6;
    if (zlapane === pchly.length) { setTimeout(() => { snd('sukces'); mow('Wszystkie pchły złapane! Już nie swędzi.'); }, 500); setTimeout(() => { Z.done = true; }, 2200); }
  };
  Z.move = Z.up = () => {};
  Z.step = dt => {
    for (const f of pchly) {
      if (f.ok) { f.zl += dt; f.m.position.y += dt * P.box.y1 * .6; f.m.scale.setScalar(f.s * Math.max(.01, 1 - f.zl * 1.5)); if (f.zl > .7 && f.m.parent) scene.remove(f.m); continue; }
      if (f.hop) {
        f.hop.t = Math.min(1, f.hop.t + dt / .45); const u = f.hop.t;
        f.m.position.lerpVectors(f.hop.a, f.hop.b, u); f.m.position.y += Math.sin(u * Math.PI) * P.box.y1 * .12;
        if (u >= 1) { posadz(f, f.hop.q); f.hop = null; }
      } else if ((f.t -= dt) < 0) {
        f.t = rnd(1.1, 2.2); const q = pick(miejsca); if (q === f.q) continue;
        f.hop = { a: f.m.position.clone(), b: q.p.clone().addScaledVector(q.n, f.s * .15), q, t: 0 }; if (Math.random() < .5) snd('skok');
      } else f.m.position.addScaledVector(f.q.n, Math.sin(czas * 30 + f.s) * f.s * .004);   // drży
    }
  };
  Z.koniec = () => pchly.forEach(f => scene.remove(f.m));
  Z.hint = () => { const f = pchly.find(f => !f.ok); if (!f) return null; const w = f.m.position.clone(); return [w.clone().add(V(P.box.y1 * .1, P.box.y1 * .15, 0)), w]; };
  return Z;
}

/* --- owijanie bandażem: kręć palcem w kółko wokół części ciała, gaza owija się spiralą ---
   łapa (spuchnięta, 3 kółka) · szyja żyrafy (4 kółka) · mumia: całe zwierzę (8 kółek), potem „Uuuu!” i odwijanie */
// Przekroje części ciała z wierzchołków jej siatek (układ grupy g): oś = dłuższy z wymiarów x/y, co kawałek środek i promienie (90. centyl)
function przekroje(g, ms) {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), mm = new T.Matrix4(), v = V(), pts = [];
  for (const m of ms) { mm.multiplyMatrices(inv, m.matrixWorld); const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(mm); pts.push([v.x, v.y, v.z]); } }
  const b = new T.Box3().setFromPoints(pts.map(p => V(...p))), sz = b.getSize(V()), os = sz.x > sz.y * 1.15 ? 'x' : 'y', iu = os === 'x' ? 0 : 1, ip = os === 'x' ? 1 : 0;
  const u0 = os === 'x' ? b.min.x : b.min.y, u1 = os === 'x' ? b.max.x : b.max.y, N = 14, sl = [];
  const cent = (a, k) => { a.sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(a.length * k))]; };
  for (let i = 0; i < N; i++) {
    const lo = u0 + (u1 - u0) * i / N, hi = u0 + (u1 - u0) * (i + 1) / N, w = pts.filter(p => p[iu] >= lo && p[iu] <= hi);
    if (w.length < 3) continue;
    const ps = w.map(p => p[ip]), qs = w.map(p => p[2]), cp = (cent(ps, .05) + cent(ps, .95)) / 2, cq = (cent(qs, .05) + cent(qs, .95)) / 2;
    sl.push({ u: (lo + hi) / 2, cp, cq, rp: cent(ps.map(x => Math.abs(x - cp)), .9), rq: cent(qs.map(x => Math.abs(x - cq)), .9) });
  }
  return { os, u0, u1, sl };
}
// Siatki skóry grupy g bez podgrup z listy bez (np. szyja bez głowy, tułów bez nóg)
const siatkiBez = (g, bez = []) => { const ms = []; g.traverse(o => { if (o.isMesh && (o.layers.mask & 1) && !o.userData.nd && o.material.side !== T.BackSide) { let a = o.parent; while (a && a !== g && !bez.includes(a)) a = a.parent; if (a === g) ms.push(o); } }); return ms; };
const dzieci = g => g.children.filter(c => !c.isMesh);
// Części do owinięcia: { g, ms, od, do } (od/do = ułamek osi)
function czesciMumii() {
  const a = P.a, c = [];
  for (const L of a.legs) { const g = L.p || L; c.push({ g, ms: siatkiBez(g), od: .06, do: .85 }); }
  if (a.armOn) for (const g of [a.armOn, a.armOff]) c.push({ g, ms: siatkiBez(g), od: .1, do: .9 });
  c.push({ g: a.body, ms: siatkiBez(a.body, dzieci(a.body)), od: .05, do: .95 });
  if (a.neck) c.push({ g: a.neck, ms: siatkiBez(a.neck, dzieci(a.neck)), od: .12, do: .9 });
  c.push({ g: a.head, ms: siatkiBez(a.head, dzieci(a.head)), od: .08, do: .92 });
  return c.filter(x => x.ms.length);
}
function zOwijanie(o) {
  const kaw = []; let kat = 0, prev = null, sr = null, R = 90, f = 0, cel = 0, koniecT = null, oczy = [], odwin = null, szur = 0;
  const Z = { typ: o.typ, ic: o.ic, w3d: true, done: false, objaw: o.objaw, znalezione: '' };
  Z.prep = () => { if (o.puchnie) o.puchnie.scale.set(1.18, 1, 1.18); };
  Z.kotwice = () => [];
  Z.start = () => {
    lupa.cel = 0;
    wPozie(() => { for (const c of o.czesci()) {
      const pr = przekroje(c.g, c.ms); if (pr.sl.length < 2) continue;
      const L = pr.u1 - pr.u0, u0 = pr.u0 + L * c.od, u1 = pr.u0 + L * c.do, rs = pr.sl.reduce((a, s) => a + (s.rp + s.rq) / 2, 0) / pr.sl.length;
      const n = Math.max(3, Math.round((u1 - u0) / (rs * .7))), ow = anOwijka(pr, u0, u1, n), sc = pr.sl[pr.sl.length >> 1];
      c.g.add(ow); kaw.push({ g: c.g, ow, n, sr: pr.os === 'x' ? V((u0 + u1) / 2, sc.cp, sc.cq) : V(sc.cp, (u0 + u1) / 2, sc.cq), r: Math.max(sc.rp, sc.rq) });
    } });
    let s = 0; const N = kaw.reduce((a, k) => a + k.n, 0); for (const k of kaw) { k.a = s / N; s += k.n; k.b = s / N; }
    camGo(Z.widok(), 1.2); mow(o.mowStart); $('krag').hidden = false; if (!kaw.length) Z.done = true;
  };
  Z.widok = () => o.widok ? o.widok() : widok3D();
  const teraz = () => kaw.find(k => cel < k.b - 1e-6) || kaw[kaw.length - 1];
  Z.down = (x, y) => { if (sr) prev = Math.atan2(y - sr[1], x - sr[0]); };
  Z.move = (x, y) => {
    if (prev === null || !sr || cel >= 1) return;
    const d = Math.hypot(x - sr[0], y - sr[1]); if (d < R * .2 || d > R * 4) { prev = Math.atan2(y - sr[1], x - sr[0]); return; }
    const a = Math.atan2(y - sr[1], x - sr[0]); let da = a - prev; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; prev = a;
    const przed = cel; kat += Math.abs(da); cel = Math.min(1, kat / (2 * Math.PI * o.kolka));
    if ((szur += Math.abs(da)) > 2.2) { szur = 0; snd('szur'); if (P.a.tickle !== undefined) P.a.tickle = .4; }
    for (const k of kaw) if (przed < k.b - 1e-6 && cel >= k.b - 1e-6 && o.dymki) dymek(pick(o.dymki), k.g.localToWorld(k.sr.clone()), 'small');
    if (cel >= 1 && koniecT === null) { koniecT = 0; $('krag').hidden = true; prev = null; if (o.gotowe) o.gotowe(Z); }
  };
  Z.up = () => { prev = null; };
  Z.step = dt => {
    f += (cel - f) * Math.min(1, dt * 8); if (odwin) { odwin.t += dt; f = Math.max(0, 1 - odwin.t / 1.3); }
    for (const k of kaw) k.ow.userData.pokaz((f - k.a) / (k.b - k.a));
    const k = teraz(); if (k && cel < 1) {
      const c = k.g.localToWorld(k.sr.clone()); sr = toScreen(c);
      const e = toScreen(c.clone().add(V(0, k.r * k.g.getWorldScale(V()).y * 1.1, 0)));
      R = clamp(Math.hypot(e[0] - sr[0], e[1] - sr[1]) * 1.6, 60, Math.min(innerWidth, innerHeight) * .32);
      const el = $('krag'); el.style.left = sr[0] + 'px'; el.style.top = sr[1] + 'px'; el.style.width = el.style.height = 2 * R + 'px';
    }
    if (o.puchnie && cel >= 1) { const s = Math.max(1, o.puchnie.scale.x - dt * .4); o.puchnie.scale.set(s, 1, s); }
    if (koniecT !== null && (koniecT += dt) > (o.trzymaj || 2.2)) {
      if (o.odwin && !odwin) { odwin = { t: 0 }; snd('szur'); snd('chichot'); oczy.forEach(e => e.parent && e.parent.remove(e)); if (o.odwin.mow) mow(o.odwin.mow); }
      else if (!o.odwin || odwin.t > 1.6) Z.done = true;
    }
  };
  Z.oczy = l => { oczy = l; };
  Z.koniec = () => { $('krag').hidden = true; if (o.puchnie) o.puchnie.scale.set(1, 1, 1); if (o.odwin) for (const k of kaw) k.g.remove(k.ow); oczy.forEach(e => e.parent && e.parent.remove(e)); };
  Z.hint = () => sr && cel < 1 ? { ekran: true, a: [sr[0], sr[1] - R], b: [sr[0] + R, sr[1]] } : null;
  return Z;
}
// Łapa spuchła → bandaż (3 kółka)
function zBandaz() {
  const kon = P.konczyna, Lm = P.lapa[0], Lw = Lm === 'noga' ? 'Noga' : Lm === 'łapka' ? 'Łapka' : 'Łapa';
  return zOwijanie({ typ: 'bandaz', ic: 'bandaz', objaw: Lm + ' mi spuchła', kolka: 3, puchnie: kon, czesci: () => [{ g: kon, ms: siatkiBez(kon), od: .08, do: .8 }],
    widok: () => { const k = konczynaW(); return widokNa(k.c, k.R * .7); }, dymki: ['Raz!', 'Szuru!'], mowStart: Lw + ' spuchła! Owiń ją bandażem: kręć palcem w kółko.',
    gotowe: () => { setTimeout(() => { snd('sukces'); mow('Bandaż gotowy! Opuchlizna znika.'); }, 300); } });
}
// Szyja żyrafy: bardzo długi bandaż (4 kółka) — „żyrafa w szaliku”
function zSzyja() {
  const a = P.a;
  return zOwijanie({ typ: 'szyja', ic: 'bandaz', objaw: 'szyja mnie boli', kolka: 4, czesci: () => [{ g: a.neck, ms: siatkiBez(a.neck, dzieci(a.neck)), od: .1, do: .92 }],
    widok: () => { const b = pudloLok(a.neck); return widokNa(a.neck.localToWorld(b.getCenter(V())), b.getSize(V()).y * P.k * .6); },
    dymki: ['Szuru!', 'Jeszcze!', 'Kręć!'], mowStart: 'Szyja boli! Owiń ją bandażem. Szyja żyrafy jest bardzo długa, kręć i kręć!',
    gotowe: () => { setTimeout(() => { snd('sukces'); mow('Gotowe! Żyrafa w najdłuższym szaliku świata!'); a.jumpT = 1.5; }, 300); } });
}
// Mumia: owijamy całego pacjenta (8 kółek), na koniec oczy na bandażu i „Uuuu!”, potem odwijamy
function zMumia() {
  return zOwijanie({ typ: 'mumia', ic: 'mumia', objaw: 'wszystko mnie boli', kolka: 8, czesci: czesciMumii, trzymaj: 3.6,
    dymki: ['Szuru!', 'Buru!', 'Jeszcze!', 'Hi hi!'], mowStart: 'Wszystko boli? To owiniemy wszystko! Kręć palcem w kółko.',
    gotowe: Z => {
      Z.oczy(oczyMumii()); snd('sukces'); setTimeout(() => { mow('Uuuu! Jestem mumią!'); snd('oj'); }, 400);
      if (P.a.human) P.taniec = true; else P.a.jumpT = 2; setTimeout(() => { if (P) P.taniec = false; }, 3200);
    },
    odwin: { mow: 'Ta-dam! A teraz odwijamy!' } });
}
// Wielkie oczy na bandażu mumii (tam, gdzie oczy pacjenta, albo z przodu głowy)
function oczyMumii() {
  const a = P.a, h = a.head, out = [], hw = h.getWorldPosition(V()), r = P.box.y1 * .035;
  const miejsca = a.eyes && a.eyes.length ? a.eyes.map(e => e.getWorldPosition(V())) : [1, -1].map(s => h.localToWorld(V(.24, .05, s * .09)));
  for (const w of miejsca) {
    const d = w.clone().sub(hw).normalize(), g = new T.Group(); g.position.copy(h.worldToLocal(w.clone().addScaledVector(d, r * .9)));
    brPart(g, new T.SphereGeometry(1, 14, 10), 0xffffff, 0, 0, 0, { ol: .08 }); brPart(g, new T.SphereGeometry(.5, 10, 8), 0x1d1d24, .55, .1, 0, { ol: 0 });
    g.scale.setScalar(r / h.getWorldScale(V()).x); g.lookAt(w.clone().addScaledVector(d, 10)); g.rotateY(-Math.PI / 2); h.add(g); out.push(g);
  }
  return out;
}

/* --- mycie kłów / zębów / dzioba: brud, szoruj szczoteczką („mycie trwa godzinę… żart!”) --- */
// Co myjemy: słoń — swoje kły; tygrys i lew — kreskówkowe kły pod nosem; żyrafa — dwa wielkie przednie zęby; doktor — biały uśmiech;
// pingwin — dziób (nie ma zębów!). Dorobione części zostają do końca wizyty.
const MYCIE = { slon: ['kły', 'kłów'], tygrys: ['kły', 'kłów'], lew: ['kły', 'kłów'], zyrafa: ['zęby', 'zębów'], doktor: ['zęby', 'zębów'], pingwin: ['dziób', 'dzioba'] };
function klyPacjenta() {
  const h = P.a.head, zab = (geo, x, y, z) => brPart(h, geo, 0xfffbe8, x, y, z, { ol: .012 });
  switch (P.kind) {
    case 'slon': return h.children.filter(m => m.isMesh && (m.layers.mask & 1) && Math.abs(m.position.x - .62) < .02 && Math.abs(m.position.y + .5) < .02);
    case 'tygrys': case 'lew': { const x = P.kind === 'lew' ? .7 : .66; return [1, -1].map(s => zab(new T.ConeGeometry(.055, .26, 10).rotateX(Math.PI), x, -.4, s * .1)); }
    case 'zyrafa': return [1, -1].map(s => zab(brBox(.05, .13, .075), .93, -.24, s * .042));
    case 'doktor': return [zab(brBox(.03, .045, .13), .236, -.11, 0)];
    case 'pingwin': return h.children.filter(m => m.isMesh && (m.layers.mask & 1) && m.material.side !== T.BackSide && (m.geometry.boundingBox || m.geometry.computeBoundingBox() || m.geometry.boundingBox).max.x > .7);
  }
  return [];
}
function zKly() {
  const plamy = []; let kly = [], poz = null, grab = false, last = null, szur = 0, pol = false, gotowe = false;
  const [co, czego] = MYCIE[P.kind], imie = { slon: 'słonia', tygrys: 'tygrysa', lew: 'lwa', zyrafa: 'żyrafy', doktor: 'doktora', pingwin: 'pingwina' }[P.kind];
  const Z = { typ: 'kly', ic: 'szczotka', w3d: true, done: false, objaw: co === 'dziób' ? 'dziób mnie swędzi' : co + ' mnie bolą', znalezione: '' };
  let bx = null;
  Z.prep = () => {
    kly = klyPacjenta(); const b = new T.Box3(); wPozie(() => { kly.forEach(k => b.expandByObject(k)); bx = P.a.head.worldToLocal(b.getCenter(V())); });
    const r = clamp(b.getSize(V()).length() * .07, P.box.y1 * .008, P.box.y1 * .024);
    skora(8, kly, b, r * 1.4, q => { const m = brPart(scene, new T.SphereGeometry(1, 10, 8), new T.MeshToonMaterial({ color: pick([0x9a7b3c, 0x7a8a3a, 0xb08a4a]), transparent: true }), 0, 0, 0, { ol: 0, s: [1, 1, .35] });
      m.scale.set(r * rnd(.8, 1.2), r * rnd(.8, 1.2), r * .35); m.position.copy(q.p); m.quaternion.setFromUnitVectors(V(0, 0, 1), q.n); q.o.attach(m); plamy.push({ m, brud: 1, s0: m.scale.clone() }); });
  };
  Z.kotwice = () => [];
  const pysk = () => bx ? P.a.head.localToWorld(bx.clone()) : P.a.head.getWorldPosition(V());                  // środek tego, co myjemy
  Z.widok = () => { const c = pysk(), R = rozmiar() * (P.kind === 'slon' ? .16 : .1); return dopasujPkt(naroza(c.x - R, c.x + R, c.y - R, c.y + R, c.z - R, c.z + R), KIER3D, UI3D(), .05); };   // zoom na kły / zęby / dziób
  Z.start = () => { lupa.cel = 0; camGo(Z.widok(), 1.2); poz = [90, innerHeight - 140]; NARZ.pokaz('szczotka', ...poz); mow((co === 'dziób' ? 'Pingwin nie ma zębów! Umyjemy dziób. ' : '') + 'Mycie ' + czego + ' ' + imie + ' trwa około godziny. Powodzenia!'); if (!plamy.length) Z.done = true; };
  const szczota = () => [poz[0] + 30, poz[1] - 20];                     // główka szczoteczki
  Z.down = (x, y) => { grab = true; last = [x, y]; poz = [x - 20, y - 50]; NARZ.at(...poz); };
  Z.move = (x, y) => {
    if (!grab || gotowe) return; const dl = Math.hypot(x - last[0], y - last[1]); last = [x, y]; poz = [x - 20, y - 50]; NARZ.at(...poz);
    const [bx, by] = szczota(); let tarl = false;
    for (const p of plamy) if (p.brud > 0) { const [X, Y] = toScreen(swiat(p.m)); if (Math.hypot(X - bx, Y - by) < 75) { p.brud = Math.max(0, p.brud - dl / 520); tarl = true; } }
    if (tarl && (szur += dl) > 90) { szur = 0; snd('szczotka'); piana(bx, by); }
    const zost = plamy.reduce((a, p) => a + p.brud, 0) / plamy.length;
    if (!pol && zost < .55) { pol = true; mow('Żartowałam, wcale nie godzinę! Szoruj dalej!'); }
    if (zost <= 0 && !gotowe) { gotowe = true; NARZ.schowaj(); snd('gwiazda'); setTimeout(() => snd('sukces'), 300); dymek('BŁYSZCZY!', pysk(), 'big'); mow(co === 'dziób' ? 'Dziób błyszczy jak nowy!' : co[0].toUpperCase() + co.slice(1) + ' błyszczą jak nowe!'); setTimeout(() => { Z.done = true; }, 2200); }
  };
  Z.up = () => { grab = false; };
  Z.step = () => { for (const p of plamy) { if (p.brud <= 0 && p.m.parent) { p.m.parent.remove(p.m); continue; } p.m.material.opacity = .25 + .75 * p.brud; p.m.scale.set(p.s0.x * (.5 + .5 * p.brud), p.s0.y * (.5 + .5 * p.brud), p.s0.z); } };
  Z.koniec = () => { NARZ.schowaj(); plamy.forEach(p => p.m.parent && p.m.parent.remove(p.m)); };
  Z.hint = () => { const p = plamy.find(p => p.brud > 0); if (!p || !poz) return null; const [X, Y] = toScreen(swiat(p.m)); return { ekran: true, a: [X - 40, Y + 10], b: [X + 40, Y - 10] }; };
  return Z;
}
// Piana z bąbelków (DOM) w miejscu szorowania
function piana(x, y) {
  for (let i = 0; i < 4; i++) { const b = document.createElement('i'); b.className = 'banka'; const r = rnd(10, 22); Object.assign(b.style, { left: x + rnd(-25, 25) + 'px', top: y + rnd(-20, 20) + 'px', width: r + 'px', height: r + 'px' }); $('fx').append(b); setTimeout(() => b.remove(), 900); }
}

// Pula zabiegów bez rentgena (gra losuje jeden na wizytę; dla = tylko ci pacjenci, bez = wszyscy oprócz)
const NOWE_ZABIEGI = [{ t: 'drzazga', f: zDrzazga }, { t: 'stetoskop', f: zStetoskop }, { t: 'termometr', f: zTermometr }, { t: 'pchly', f: zPchly },
  { t: 'bandaz', f: zBandaz, bez: ['zyrafa'] }, { t: 'szyja', f: zSzyja, dla: ['zyrafa'] }, { t: 'mumia', f: zMumia }, { t: 'kly', f: zKly }];
