// Klinika Zoo — pacjenci: zwierzaki z ZOO (models/animals.js: żyrafa, słoń) i ludzik z Piratów (models/pirates.js: Pan Weterynarz),
// a w nich wnętrze z models/anatomy.js. Dwie warstwy kamery: 0 = model jak w innych grach, 1 = rentgen (świecący zarys
// tych samych siatek, kości, organy). Wszyscy z boku, przód = +x. P.g = grupa w świecie (bez skali), P.w = korzeń modelu (układ pracy,
// jednostki modelu, skala P.k) — tu leżą organy, przełyk, kawałki kości.
// klPacjent('zyrafa'|'slon'|'doktor'|'pingwin') — P.przod: wyprostowani (doktor, pingwin) w rentgenie od przodu, P.w wtedy obrócone (klPrzod) → P = { g, w, k, a, kind, glowa, organy, przelyk(), jelita, ukladanki, kosc, rzeczS, box (w świecie) }
//   przelyk() = linia od żołądka do pyszczka, wezyk = amplituda zakrętów trasy · jelita = trasa od żołądka do pupy · siecKrew() / siecNerwy() = linie naczyń i nerwów (organy płyną naczyniami, kość nerwami)
//   ukladanki = [{ id, grupa, sloty, kawalek, ustaw, … }] — kości do wkładania z liczeniem (szyja, ogon, palce, żebra)
//   organy[n] = { o, dom: [x,y,z], zle: [[x,y], …] } · kosc = { grupa, dol, dom, zle, gips, konczyna, start, skad }
// klAnim(P, dt, idzie) — chód i oddech (ZOO.anim dla zwierząt, prosty chód dla ludzika; P.taniec = taniec radości)
// wymaga: models/animals.js (ZOO), models/pirates.js (mkHuman), models/anatomy.js, THREE

/* --- warstwy i materiał rentgena --- */
function klXMat() {
  return klXMat.m || (klXMat.m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 p = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); gl_Position = projectionMatrix * p; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4); gl_FragColor = vec4(mix(vec3(.2,.45,.85), vec3(.65,.92,1.0), f), .12 + .6 * f); }',
  }));
}
const klX = o => { o.traverse(c => c.layers.set(1)); return o; };            // tylko w rentgenie
const klObie = o => { o.traverse(c => { c.layers.enable(0); c.layers.enable(1); }); return o; };   // w obu widokach
function klPoz(o, x, y, z, rz = 0) { o.position.set(x, y, z); o.rotation.z = rz; return o; }
const klKrz = pts => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2] || 0)));
// Bliźniaki w rentgenie: każda siatka modelu dostaje kopię (ta sama geometria) z materiałem rentgena na warstwie 1
function klRentgenSkory(root) {
  const ms = []; root.traverse(o => { if (o.isMesh) ms.push(o); });
  for (const m of ms) {
    const x = new THREE.Mesh(m.geometry, klXMat()); x.position.copy(m.position); x.quaternion.copy(m.quaternion); x.scale.copy(m.scale);
    x.layers.set(1); x.renderOrder = 5; x.castShadow = false; m.parent.add(x);
  }
}
// Złamana kość: dolna część przesunięta o (dx, dy) i obrócona o drz względem miejsca; gips = { y0, L, r } w grupie kończyny
function klZlamana(grupa, dol, dx, dy, drz, gips) {
  const dom = { x: dol.position.x, y: dol.position.y, rz: dol.rotation.z };
  return { grupa, dol, dom, zle: { x: dom.x + dx, y: dom.y + dy, rz: dom.rz + drz }, gips };
}
// Punkt z układu grupy g do układu pracy P.w
function klPkt(P, g, x, y) { P.g.updateMatrixWorld(true); const v = P.w.worldToLocal(g.localToWorld(new THREE.Vector3(x, y, 0))); return [v.x, v.y]; }
function klOrgan(P, n, x, y, z, s, zle) {
  const o = klX(anOrgan(n, s)); o.position.set(x, y, z); P.w.add(o); o.userData.zywy = true;
  P.organy[n] = { o, dom: [x, y, z], zle };
}
// Jelita: cienkie w zakosach (rows rzędów w prostokącie b) od żołądka, potem grube po punktach gr aż do pupy (ostatni punkt = wyjście)
function klJelita(P, start, b, rows, gr, r) {
  const pts = [start];
  for (let i = 0; i < rows; i++) { const y = b.y1 - i * (b.y1 - b.y0) / (rows - 1), xs = i % 2 ? [b.x1, b.x0] : [b.x0, b.x1]; pts.push([xs[0], y], [xs[1], y]); }
  const iGrube = pts.length - 1; pts.push(...gr);
  const o = klX(anJelitaTrasa(pts, r, iGrube)); o.position.z = -.02; P.w.add(o);
  P.jelita = pts; P.jelitaO = o;
}
// Układanka kości (wkładanie po kolei z liczeniem): kości stoją w slotach grupy, zabieg je wyjmuje i rozsypuje
// U = { id, grupa, sloty: [{x, y, z, rz}], kawalek: () → obiekt, ustaw?(k 0..1 = jak bardzo „opadło”), ic, objaw, znalezione, start, fakt }
function klUkladanka(P, U) {
  U.kosci = U.sloty.map(sl => { const o = klX(U.kawalek()); klPoz(o, sl.x, sl.y, sl.z || 0, sl.rz || 0); U.grupa.add(o); return o; });
  (P.ukladanki = P.ukladanki || []).push(U);
}
function klKosci(par, list) { for (const [o, x, y, z, rz] of list) par.add(klX(klPoz(o, x, y, z, rz || 0))); }
function klNogaKosci(L, y0, Ln, r) {           // kości nogi zwierzęcia w jej grupie (biodro w 0, w dół)
  return [klX(anKoscP(L.p, [0, -y0], [0, -Ln * .5], r)), klX(anKoscP(L.p, [0, -Ln * .53], [0, -Ln + .1], r * .85))];
}

/* --- ŻYRAFA (ZOO.MK.giraffe): szyja w a.neck opada, gdy brakuje kręgów --- */
function klZyrafa(P) {
  const a = P.a;
  for (const L of a.legs) L.kosci = klNogaKosci(L, .08, 2.55, .07);
  const sp = []; for (let i = 0; i < 10; i++) { const x = -1.1 + i * .23; sp.push([anKreg(.1), x, 3.5 + (x + 1.1) * .17, -.1]); }
  klKosci(P.w, sp);
  klKosci(P.w, [[anZebraBok(-.35, .85, 3.65, .95, 6, .05), 0, 0, -.25], [anPlaska([[-.4, .1], [.25, .3], [.35, -.05], [-.1, -.3]]), -.85, 3.2, -.15], [anPlaska([[-.2, .35], [.2, .35], [.1, -.4], [-.05, -.4]]), .75, 3.35, -.15]]);
  a.head.add(klX(klPoz(anCzaszka([[-.3, 0], [-.2, .25], [.1, .3], [.45, .2], [.75, .1], [.95, .03], [.95, -.13], [.7, -.18], [.35, -.2], [0, -.24], [-.22, -.2]], [.18, .12, .08], .32), 0, 0, 0)));
  const mz = klX(anMozg(.3)); mz.position.set(-.02, .1, .1); mz.userData.zywy = true; a.head.add(mz); P.mozgGlowy = mz;
  // układanki: 7 kręgów szyi (szyja opada), 6 kręgów ogona (ogon opada)
  const nb = a.neckBase, hb = a.headBase, tb = a.tail.rotation.z;
  klUkladanka(P, { id: 'szyja', grupa: a.neck, sloty: [...Array(7)].map((_, i) => ({ x: -.05, y: .02 + i * .34 })), kawalek: () => anKreg(.14),
    ustaw: k => { a.neckBase = nb - 1.05 * k; a.headBase = hb - .25 * k; }, ic: 'kregi', objaw: 'szyja mi się chwieje', znalezione: 'W szyi brakuje kości!',
    start: 'Szyja się chwieje! Włóż kości do szyi.', fakt: 'Żyrafa ma w szyi siedem kości. Tyle samo co ty!' });
  klUkladanka(P, { id: 'ogon', grupa: a.tail, sloty: [...Array(6)].map((_, i) => ({ x: 0, y: -.12 - i * .19 })), kawalek: () => anKreg(.088),
    ustaw: k => { a.tail.rotation.z = tb - 1.0 * k; }, ic: 'ogon', objaw: 'ogon mi opadł', znalezione: 'W ogonie brakuje kostek!',
    start: 'Ogon opadł! Włóż kostki do ogona.', fakt: 'Żyrafa macha ogonem i odgania muchy!' });
  klOrgan(P, 'pluca', .35, 3.2, 0, .95, []);
  klOrgan(P, 'serce', .72, 2.78, .25, .7, [[-.85, 1.25], [.75, 1.25], [-1.58, 1.75]]);
  klOrgan(P, 'zoladek', -.28, 3.05, .1, .95, []);
  klOrgan(P, 'watroba', .3, 2.62, .15, .62, [[-.85, 1.25], [.75, 1.25], [-1.58, 1.75]]);
  klOrgan(P, 'nerki', -.55, 3.42, -.05, .55, [[-.85, 1.25], [.75, 1.25], [-1.58, 1.75]]);
  klOrgan(P, 'pecherz', -.95, 2.62, .1, .65, []);
  klJelita(P, [-.32, 2.78], { x0: -.95, x1: -.08, y0: 2.4, y1: 2.82 }, 4, [[-1.08, 2.42], [-1.15, 2.75], [-1.24, 2.98], [-1.42, 3.0]], .055);
  // przełyk (do buzi): z dna żołądka środkiem szyi do pyszczka; gra wygina go w wężyk (P.wezyk = amplituda)
  P.przelyk = () => [[-.3, 2.82], [.15, 3.2], [.55, 3.4], klPkt(P, a.neck, 0, -.2), klPkt(P, a.neck, 0, .6), klPkt(P, a.neck, 0, 1.4), klPkt(P, a.neck, 0, 2.1), klPkt(P, a.head, .3, -.02), klPkt(P, a.head, .97, -.1)];
  P.wezyk = .14;
  P.tulow = { x0: -1.0, x1: .95, y0: 2.45, y1: 3.6 };
  // naczynia krwionośne: od serca do szyi i głowy, nóg, ogona
  P.siecKrew = () => {
    const FL = a.legs.find(L => L.front && L.s > 0), BL = a.legs.find(L => !L.front && L.s > 0), H = [.72, 2.78], A3 = [-1.0, 3.3], B0 = [-.85, 2.75];
    return [[H, [.5, 3.35], [-.3, 3.45], A3, klPkt(P, a.tail, 0, -.35), klPkt(P, a.tail, 0, -.95)],
      [H, [.85, 3.15], klPkt(P, a.neck, .15, .1), klPkt(P, a.neck, .15, .9), klPkt(P, a.neck, .12, 1.7), klPkt(P, a.neck, .1, 2.3), klPkt(P, a.head, .3, .05)],
      [H, [.75, 2.6], klPkt(P, FL.p, 0, -.7), klPkt(P, FL.p, 0, -1.5), klPkt(P, FL.p, 0, -2.3)],
      [A3, B0, klPkt(P, BL.p, 0, -.7), klPkt(P, BL.p, 0, -1.5), klPkt(P, BL.p, 0, -2.3)],
      [H, [.4, 2.45], [-.4, 2.5], B0]];
  };
  P.rzeczS = 1.3;
}

/* --- SŁOŃ (ZOO.MK.elephant): trąba bez kości, złamana przednia noga --- */
function klSlon(P) {
  const a = P.a;
  for (const L of a.legs) L.kosci = klNogaKosci(L, .05, 1.58, .11);
  const sp = []; for (let i = 0; i < 12; i++) { const x = -1.75 + i * .29; sp.push([anKreg(.13), x, 3.05 + Math.sin(i / 11 * Math.PI) * .18, -.2]); }
  klKosci(P.w, sp);
  klKosci(P.w, [[anZebraBok(-.6, .9, 3.15, 1.45, 7, .07), 0, 0, -.35], [anPlaska([[-.5, .15], [.35, .35], [.45, -.1], [-.15, -.4]]), -1.3, 2.6, -.3], [anPlaska([[-.25, .45], [.3, .45], [.18, -.45], [-.05, -.45]]), .95, 2.7, -.3]]);
  const tb = a.tail.rotation.z;
  klUkladanka(P, { id: 'ogon', grupa: a.tail, sloty: [...Array(6)].map((_, i) => ({ x: 0, y: -.1 - i * .17 })), kawalek: () => anKreg(.1),
    ustaw: k => { a.tail.rotation.z = tb - .9 * k; }, ic: 'ogon', objaw: 'ogon mi opadł', znalezione: 'W ogonie brakuje kostek!',
    start: 'Ogon opadł! Włóż kostki do ogona.', fakt: 'Na końcu ogona słoń ma włoski jak pędzelek!' });
  const hd = []; for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; hd.push([.15 + Math.cos(t) * .72, Math.sin(t) * .62]); }
  a.head.add(klX(klPoz(anCzaszka(hd, [.5, .2, .13], .55), 0, 0, 0)));
  const przod = a.legs.find(L => L.front && L.s > 0);
  P.kosc = klZlamana(przod.p, przod.kosci[1], .5, .08, .75, { y0: -1.62, L: .95, r: .5 });
  Object.assign(P.kosc, { objaw: 'noga boli', skad: 'z nogi', start: [-1.2, 3.2] });
  klOrgan(P, 'pluca', .4, 2.6, 0, 1.15, []);
  klOrgan(P, 'serce', .78, 1.95, .35, .9, []);
  klOrgan(P, 'zoladek', -.4, 2.25, .1, 1.1, []);
  klOrgan(P, 'watroba', .3, 1.72, .2, .85, [[2.55, 1.0], [-2.2, 1.45], [-1.15, .9]]);
  klOrgan(P, 'nerki', -.75, 2.95, -.1, .8, []);
  klOrgan(P, 'pecherz', -1.45, 1.62, .1, .9, [[2.55, 1.0], [-2.2, 1.45], [-1.15, .9]]);
  klJelita(P, [-.45, 1.85], { x0: -1.35, x1: -.15, y0: 1.38, y1: 1.88 }, 4, [[-1.6, 1.32], [-1.72, 1.95], [-1.78, 2.4], [-1.95, 2.5], [-2.15, 2.5]], .085);
  P.tulow = { x0: -1.5, x1: 1.3, y0: 1.4, y1: 3.0 };
  const FL = przod, BL = a.legs.find(L => !L.front && L.s > 0);
  P.siecKrew = () => {
    const H = [.78, 1.95], A3 = [-1.4, 2.85], B0 = [-1.15, 2.0];
    return [[H, [.5, 2.9], [-.4, 3.05], A3, klPkt(P, a.tail, 0, -.3), klPkt(P, a.tail, 0, -.95)],
      [H, [1.15, 2.4], klPkt(P, a.head, 0, 0), klPkt(P, a.trunk[1], 0, .16), klPkt(P, a.trunk[4], 0, .16), klPkt(P, a.trunk[8], 0, .3)],
      [H, [.95, 1.75], klPkt(P, FL.p, 0, -.5), klPkt(P, FL.p, 0, -1.0), klPkt(P, FL.p, 0, -1.45)],
      [A3, B0, klPkt(P, BL.p, 0, -.5), klPkt(P, BL.p, 0, -1.0), klPkt(P, BL.p, 0, -1.45)],
      [H, [.2, 1.45], [-.8, 1.45], B0]];
  };
  // nerwy: od mózgu wzdłuż kręgosłupa do nóg i ogona
  P.siecNerwy = () => {
    const S1 = [.6, 3.25], S3 = [-1.5, 3.1];
    return [[klPkt(P, a.head, 0, .15), [1.2, 3.0], S1, [-.4, 3.35], S3, klPkt(P, a.tail, .04, -.35), klPkt(P, a.tail, .04, -.95)],
      [S1, [.9, 2.6], klPkt(P, FL.p, .06, -.5), klPkt(P, FL.p, .06, -1.0), klPkt(P, FL.p, .06, -1.45)],
      [S3, [-1.15, 2.4], klPkt(P, BL.p, .06, -.5), klPkt(P, BL.p, .06, -1.0), klPkt(P, BL.p, .06, -1.45)]];
  };
  klOrgan(P, 'mozg', 1.6, 2.92, .3, .55, [[2.55, 1.0], [-2.2, 1.45], [-1.15, .9]]);
  P.przelyk = () => [[-.45, 1.9], [0, 2.4], [.6, 2.6], [1.1, 2.7], klPkt(P, a.head, .05, -.1), klPkt(P, a.head, .35, -.45), klPkt(P, a.head, .5, -.78)];
  P.wezyk = .22;
  P.rzeczS = 1.5;
}

/* --- PAN WETERYNARZ (mkHuman z Piratów w białym fartuchu): stetoskop, lusterko na czole; skala 1.6; złamana bliższa ręka --- */
function klStroj(a) {
  const { M, mesh, cg } = ZOO, srebro = M(0xcfd8dc, { metalness: .7, roughness: .25 }), guma = M(0x2b3a67);
  const opaska = mesh(new THREE.TorusGeometry(.255, .018, 6, 24), M(0xeeeeee), a.head, 0, .1, 0); opaska.rotation.x = Math.PI / 2;
  mesh(cg(.085, .085, .02, 18), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfe6ff, emissiveIntensity: .6, metalness: .3, roughness: .1 }), a.head, .245, .22, 0).rotation.z = Math.PI / 2;   // lusterko na czole
  for (const s of [1, -1]) mesh(new THREE.TubeGeometry(klKrz([[.02, 1.13, s * .14], [.2, 1.02, s * .2], [.29, .9, s * .08], [.3, .84, 0]]), 12, .016, 5), guma, a.body);
  mesh(cg(.06, .06, .03, 14), srebro, a.body, .31, .82, 0).rotation.z = Math.PI / 2;              // słuchawka stetoskopu
  mesh(new THREE.BoxGeometry(.02, .07, .12), M(0x3ab0ff), a.body, .27, 1.0, -.13);                 // plakietka
}
// Układ „od przodu” w grupie par: oś x = w bok (na ekranie), y = w górę, z = do kamery, gdy pacjent stoi przodem (P.g obrócone o −90°)
function klPrzod(par) { const g = new THREE.Group(); g.rotation.y = Math.PI / 2; par.add(g); return g; }
// Czaszka od przodu: owal z dwoma oczodołami
function klCzaszkaPrzod(rx, ry, oko, depth) {
  const pts = []; for (let i = 0; i < 18; i++) { const t = i / 18 * Math.PI * 2; pts.push([Math.cos(t) * rx * (Math.sin(t) < 0 ? .85 : 1), Math.sin(t) * ry]); }
  const g = anCzaszka(pts, null, depth);
  for (const s of [-1, 1]) brPart(g, new THREE.CylinderGeometry(oko[2], oko[2], depth + .04, 14).rotateX(Math.PI / 2), brMat(0x16304f, 'glow'), s * oko[0], oko[1], 0, { ol: 0 });
  return g;
}
function klDoktor(P) {
  const a = P.a, k = c => klX(c);
  // nogi: kości wzdłuż osi (z każdej strony wyglądają tak samo)
  a.legs.forEach(l => { k(anKoscP(l, [0, -.03], [0, -.27], .032)); k(anKoscP(l, [0, -.3], [0, -.52], .028)); });
  // ręce: kości w układzie od przodu (złamana kość przesuwa się w płaszczyźnie ekranu)
  const reka = [a.armOn, a.armOff].map(r => { const f = klPrzod(r); return { f, k: [k(anKoscP(f, [0, -.03], [0, -.2], .026)), k(anKoscP(f, [0, -.23], [0, -.37], .023))] }; });
  for (let i = 0; i < 3; i++) k(anKoscP(reka[0].f, [(i - 1) * .025, -.4], [(i - 1) * .035, -.47], .009));
  // układanka: 5 kostek palców w drugiej dłoni
  klUkladanka(P, { id: 'palce', grupa: reka[1].f, sloty: [...Array(5)].map((_, i) => { const t = (i - 2) * .32; return { x: Math.sin(t) * .03, y: -.4 - Math.cos(t) * .005, rz: Math.PI + t }; }),
    kawalek: () => anKosc(.085, .012), ic: 'palce', objaw: 'nie mogę ruszać palcami', znalezione: 'W dłoni brakuje kostek palców!',
    start: 'Włóż kostki palców! Policzymy do pięciu.', fakt: 'Masz pięć palców, tak jak doktor!' });
  const sp = []; for (let i = 0; i < 7; i++) sp.push([anKreg(.03), 0, .64 + i * .072, -.12]);
  klKosci(P.w, sp);
  klKosci(P.w, [[anZebraPrzod(.2, 1.06, .065, 5, .013), 0, 0, -.06], [anPlaska([[-.03, .14], [.03, .14], [.025, -.12], [-.025, -.12]]), 0, .95, -.03],
    [anPlaska([[0, .02], [.1, .07], [.2, .03], [.18, -.07], [.06, -.09], [0, -.05], [-.06, -.09], [-.18, -.07], [-.2, .03], [-.1, .07]]), 0, .58, -.08]]);
  for (const s of [-1, 1]) P.w.add(k(klPoz(anKosc(.2, .014), s * .02, 1.1, -.04, -s * 1.35)));
  const hp = klPrzod(a.head); hp.add(k(klPoz(klCzaszkaPrzod(.22, .23, [.09, .03, .05], .3), 0, 0, -.02)));
  P.kosc = klZlamana(reka[0].f, reka[0].k[1], .09, .02, -.9, { y0: -.4, L: .21, r: .1 });
  Object.assign(P.kosc, { konczyna: a.armOn, objaw: 'ręka boli', skad: 'z ręki', start: [.13, .3] });
  // organy od przodu: serce po LEWEJ stronie pacjenta = po prawej na ekranie
  klOrgan(P, 'pluca', 0, .98, .02, .36, [[-.14, .12], [.14, .12]]);
  klOrgan(P, 'serce', .07, .9, .16, .26, [[-.14, .12], [.14, .12], [-.42, .62], [.42, .62]]);
  klOrgan(P, 'zoladek', .07, .77, .12, .28, [[-.14, .12], [.14, .12], [-.42, .62], [.42, .62]]);
  klOrgan(P, 'mozg', 0, 1.42, .14, .34, [[-.14, .12], [.14, .12], [-.42, .62], [.42, .62]]);
  klOrgan(P, 'watroba', -.1, .82, .14, .24, [[-.14, .12], [.14, .12], [-.42, .62], [.42, .62]]);
  klOrgan(P, 'nerki', 0, .74, -.06, .26, [[-.14, .12], [.14, .12], [-.42, .62], [.42, .62]]);
  klOrgan(P, 'pecherz', 0, .58, .1, .24, [[-.14, .12], [.14, .12], [-.42, .62], [.42, .62]]);
  klJelita(P, [.07, .72], { x0: -.13, x1: .13, y0: .62, y1: .7 }, 3, [[.19, .61], [.2, .77], [-.2, .77], [-.19, .61], [0, .53], [0, .4]], .014);
  P.przelyk = () => [[.07, .74], [0, .95], [0, 1.12], [0, 1.27]];
  P.wezyk = .07;
  P.tulow = { x0: -.22, x1: .22, y0: .6, y1: 1.08 };
  const ramie = r => [[0, 1.05], klPkt(P, r, 0, 0), klPkt(P, r, .02, -.2), klPkt(P, r, .04, -.42)], noga = l => [[0, .6], klPkt(P, l, 0, -.05), klPkt(P, l, 0, -.3), klPkt(P, l, 0, -.5)];
  P.siecKrew = () => [[[.07, .9], [0, 1.05], [0, 1.2], [0, 1.4]], [[.07, .9], [0, .75], [0, .6]], ramie(a.armOn), ramie(a.armOff), noga(a.legs[0]), noga(a.legs[1])];
  P.siecNerwy = () => [[[0, 1.42], [0, 1.22], [0, 1.05], [0, .8], [0, .6]], ramie(a.armOn), ramie(a.armOff), noga(a.legs[0]), noga(a.legs[1])];
  P.rzeczS = .5;
}

/* --- PINGWIN (ZOO.MK.penguin): przodem, trochę większy (skala 1.15); złamane skrzydło --- */
function klPingwin(P) {
  const a = P.a, k = c => klX(c);
  for (const L of a.legs) { const f = klPrzod(L.p); k(anKoscP(f, [0, 0], [0, -.2], .045)); for (const dx of [-.1, 0, .1]) k(anKoscP(f, [0, -.22], [dx, -.32], .02)); }
  const skr = a.ears.map(e => { const f = klPrzod(e.p); return { e, f, k: [k(anKoscP(f, [0, -.05], [0, -.48], .045)), k(anKoscP(f, [0, -.53], [0, -.92], .038))] }; });
  const sp = []; for (let i = 0; i < 12; i++) sp.push([anKreg(.07), 0, .4 + i * .12, -.3]);
  klKosci(P.w, sp);
  // układanka: 5 par żeber w klatce piersiowej
  klUkladanka(P, { id: 'zebra', grupa: P.w, sloty: [...Array(5)].map((_, i) => ({ x: 0, y: 1.5 - i * .12, z: -.2 })), kawalek: () => anZebraPrzod(.42, 0, 0, 1, .026),
    ic: 'zebra', objaw: 'boli mnie w piersi', znalezione: 'Brakuje żeber!', start: 'Brakuje żeber! Włóż je. Liczymy do pięciu.', fakt: 'Żebra chronią serce i płuca jak kask!' });
  klKosci(P.w, [[anPlaska([[-.06, .3], [.06, .3], [.05, -.25], [-.05, -.25]]), 0, 1.3, -.12],
    [anPlaska([[0, .05], [.2, .15], [.4, .06], [.36, -.14], [.12, -.18], [0, -.1], [-.12, -.18], [-.36, -.14], [-.4, .06], [-.2, .15]]), 0, .45, -.15]]);
  const hp = klPrzod(a.head); hp.add(k(klPoz(klCzaszkaPrzod(.36, .36, [.17, .28, .08], .45), 0, .2, -.05)));
  const sk = skr.find(x => x.e.s > 0) || skr[0];
  P.kosc = klZlamana(sk.f, sk.k[1], .22, .06, .8, { y0: -.98, L: .5, r: .12 });
  Object.assign(P.kosc, { konczyna: sk.e.p, objaw: 'skrzydło boli', skad: 'ze skrzydła', start: [.25, .15], unies: (g, t) => { g.rotation.x = sk.e.s * (1.2 + Math.sin(t * 3) * .1); } });
  klOrgan(P, 'pluca', 0, 1.3, .05, .72, []);
  klOrgan(P, 'serce', .15, 1.08, .3, .5, [[-.28, .1], [.28, .1], [-.64, .72], [.64, .72]]);
  klOrgan(P, 'zoladek', .14, .82, .22, .6, []);
  klOrgan(P, 'mozg', 0, 2.12, .22, .45, [[-.28, .1], [.28, .1], [-.64, .72], [.64, .72]]);
  klOrgan(P, 'watroba', -.2, .92, .22, .48, [[-.28, .1], [.28, .1], [-.64, .72], [.64, .72]]);
  klOrgan(P, 'nerki', 0, .78, -.12, .5, [[-.28, .1], [.28, .1], [-.64, .72], [.64, .72]]);
  klOrgan(P, 'pecherz', 0, .3, .15, .5, [[-.28, .1], [.28, .1], [-.64, .72], [.64, .72]]);
  klJelita(P, [.12, .68], { x0: -.32, x1: .32, y0: .4, y1: .62 }, 4, [[.42, .36], [.46, .78], [-.46, .78], [-.42, .36], [0, .2], [0, .02]], .04);
  P.przelyk = () => [[.12, .72], [0, 1.0], [0, 1.5], [0, 1.88], [0, 2.07]];
  P.wezyk = .17;
  P.tulow = { x0: -.45, x1: .45, y0: .35, y1: 1.55 };
  const skrz = e => [[0, 1.45], klPkt(P, e.p, 0, -.05), klPkt(P, e.p, 0, -.5), klPkt(P, e.p, 0, -.95)], lapa = L => [[0, .45], klPkt(P, L.p, 0, 0), klPkt(P, L.p, 0, -.22)];
  P.siecKrew = () => [[[.15, 1.08], [0, 1.45], [0, 1.75], [0, 2.0], [0, 2.15]], [[.15, 1.08], [0, .75], [0, .45]], ...a.ears.map(skrz), ...a.legs.map(lapa)];
  P.siecNerwy = () => [[[0, 2.1], [0, 1.75], [0, 1.45], [0, .9], [0, .45]], ...a.ears.map(skrz), ...a.legs.map(lapa)];
  P.rzeczS = 1.0;
}

function klPacjent(kind) {
  const g = new THREE.Group(), P = { g, kind, organy: {}, t: Math.random() * 9 };
  let a;
  if (kind === 'doktor') { a = mkHuman('weterynarz', { side: 1 }); a.root.scale.setScalar(1.6); klStroj(a); }
  else { a = ZOO.MK[{ zyrafa: 'giraffe', slon: 'elephant', pingwin: 'penguin' }[kind]](); if (kind === 'pingwin') a.root.scale.setScalar(1.15); }
  P.przod = kind === 'doktor' || kind === 'pingwin';                // wyprostowani: rentgen od przodu, zwierzęta czworonożne z boku
  P.a = a; P.w = P.przod ? klPrzod(a.root) : a.root; P.k = a.root.scale.x; P.glowa = a.head; g.add(a.root);
  a.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  klRentgenSkory(a.root);
  if (P.przod) g.rotation.y = -Math.PI / 2;                          // wymiary liczymy w pozycji do zabiegu
  g.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(g);
  P.box = { x0: b.min.x, x1: b.max.x, y0: 0, y1: b.max.y };
  ({ zyrafa: klZyrafa, slon: klSlon, doktor: klDoktor, pingwin: klPingwin })[kind](P);
  g.rotation.y = 0; g.userData.pacjent = kind;
  return P;
}
// Chód i oddech; idzie = 0..1
function klAnim(P, dt, idzie) {
  const a = P.a; P.t += dt;
  if (!a.human) { a.moving = idzie > .5; ZOO.anim(a, dt); return; }
  a.t += dt; const ph = P.t * 8, k = idzie;
  a.legs[0].rotation.z = Math.sin(ph) * .55 * k; a.legs[1].rotation.z = -Math.sin(ph) * .55 * k;
  a.armOn.rotation.z = -Math.sin(ph) * .5 * k; a.armOff.rotation.z = Math.sin(ph) * .5 * k;
  if (P.taniec) { const t = P.t * 9; a.armOn.rotation.z = 2.7 + Math.sin(t) * .4; a.armOff.rotation.z = 2.7 - Math.sin(t) * .4; a.root.rotation.x = Math.sin(t / 2) * .12; }   // taniec radości
  else a.root.rotation.x = 0;
  a.body.position.y = k ? Math.abs(Math.sin(ph)) * .04 : Math.sin(P.t * 2.2) * .008;
  a.head.rotation.z = (P.glowaRz || 0) + Math.sin(P.t * 1.3) * .05;
}
