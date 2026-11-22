'use strict';
// Klinika Zoo — zabiegi bez rentgena (w 3D, kamera z ukosa); na wizycie jeden losowy, przed plasterkami:
//   drzazga (chwyć i pociągnij) · stetoskop (szukaj serca: im bliżej, tym szybciej bije; potem stukaj w rytm) ·
//   termometr i syrop (zanieś termometr do pyszczka, wybierz syrop z obrazkiem pacjenta) · pchły (złap 5, liczymy) ·
//   bandaż (kręć palcem w kółko wokół spuchniętej łapy, 3 zwoje).
// Każdy zabieg: { typ, ic, w3d: true, objaw, prep(), kotwice(), widok(), start(), down/move/up(x, y) — piksele ekranu, step(dt), hint(), done }
// hint() → [świat, świat] albo { ekran: true, a: [x, y], b: [x, y] } (rączka-podpowiedź).
// wymaga z gry (klinika/game.js): P, scene, camGo, widok3D, dopasujPkt, naroza, wPozie, rozmiar, toScreen, swiat, glowaW, dymek, img, IKONA,
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

/* --- bandaż: łapa spuchła; kręć palcem w kółko wokół niej — każde kółko = jeden zwój (3) --- */
function zBandaz() {
  const ZW = 3, kon = P.konczyna; let lb = null, r = 0, yTop = 0, hs = 0, cx = 0, cz = 0, zwoje = [], kat = 0, prev = null, sr = null, R = 90;
  const Z = { typ: 'bandaz', ic: 'bandaz', w3d: true, done: false, objaw: P.lapa[0] + ' mi spuchła', znalezione: '' };
  Z.prep = () => {
    lb = pudloLok(kon); const s = lb.getSize(V()), h = s.y;
    r = Math.max(s.x, s.z) / 2 * 1.08; yTop = lb.min.y + h * .7; hs = h * .55 / ZW; cx = (lb.min.x + lb.max.x) / 2; cz = (lb.min.z + lb.max.z) / 2;
    kon.scale.set(1.18, 1, 1.18);                       // spuchnięta
  };
  Z.kotwice = () => [];
  const srodekW = () => kon.localToWorld(V(cx, yTop - hs * ZW / 2, cz));
  Z.widok = () => widokNa(srodekW(), (hs * ZW + r * 2) * P.k * .9);
  Z.start = () => { lupa.cel = 0; camGo(Z.widok(), 1.2); mow((P.lapa[0] === 'noga' ? 'Noga spuchła' : P.lapa[0] === 'łapka' ? 'Łapka spuchła' : 'Łapa spuchła') + '! Owiń ją bandażem: kręć palcem w kółko.'); $('krag').hidden = false; };
  Z.down = (x, y) => { prev = Math.atan2(y - sr[1], x - sr[0]); };
  Z.move = (x, y) => {
    if (prev === null || zwoje.length >= ZW) return;
    const d = Math.hypot(x - sr[0], y - sr[1]); if (d < R * .25 || d > R * 3.5) { prev = Math.atan2(y - sr[1], x - sr[0]); return; }
    const a = Math.atan2(y - sr[1], x - sr[0]); let da = a - prev; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; prev = a;
    kat += Math.abs(da);
    if (kat > Math.PI * 1.7) { kat = 0; zwoj(); }
  };
  Z.up = () => { prev = null; };
  function zwoj() {
    const i = zwoje.length, b = anBandaz(r, hs * 1.05); b.position.set(cx, yTop - (i + 1) * hs, cz); b.scale.set(.01, 1, .01); kon.add(b); zwoje.push(b);
    snd('gips'); dymek(['Raz!', 'Dwa!', 'Trzy!'][i], kon.localToWorld(b.position.clone()), 'small'); if (P.a.tickle !== undefined) P.a.tickle = .5;
    if (zwoje.length === ZW) { $('krag').hidden = true; setTimeout(() => { snd('sukces'); mow('Bandaż gotowy! Opuchlizna znika.'); }, 400); setTimeout(() => { Z.done = true; }, 2200); }
  }
  Z.step = dt => {
    sr = toScreen(srodekW()); const kr = toScreen(kon.localToWorld(V(cx + r, yTop - hs * ZW / 2, cz)));
    R = Math.max(70, Math.hypot(kr[0] - sr[0], kr[1] - sr[1]) * 1.8, Math.abs(toScreen(kon.localToWorld(V(cx, yTop, cz)))[1] - sr[1]) * 1.2);
    const k = $('krag'); k.style.left = sr[0] + 'px'; k.style.top = sr[1] + 'px'; k.style.width = k.style.height = 2 * R + 'px';
    for (const b of zwoje) if (b.scale.x < 1) { const s = Math.min(1, b.scale.x + dt * 4); b.scale.set(s, 1, s); }
    if (zwoje.length === ZW) { const s = Math.max(1, kon.scale.x - dt * .4); kon.scale.set(s, 1, s); }
  };
  Z.koniec = () => { $('krag').hidden = true; kon.scale.set(1, 1, 1); };
  Z.hint = () => sr && zwoje.length < ZW ? { ekran: true, a: [sr[0], sr[1] - R], b: [sr[0] + R, sr[1]] } : null;
  return Z;
}

// Pula zabiegów bez rentgena (gra losuje jeden na wizytę)
const NOWE_ZABIEGI = [{ t: 'drzazga', f: zDrzazga }, { t: 'stetoskop', f: zStetoskop }, { t: 'termometr', f: zTermometr }, { t: 'pchly', f: zPchly }, { t: 'bandaz', f: zBandaz }];
