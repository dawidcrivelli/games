// Klinika Zoo — śmieszny budynek weterynarza w przekroju (jak domek dla lalek, przód otwarty do kamery) przy ulicy w stylu Taxi:
// kafelki, tapeta w łapki, okno, markiza w paski i szyld „KLINIKA ZOO” na dachu; pacjent przychodzi chodnikiem i wchodzi od frontu.
// W środku: półka leków dla zwierząt (wielki syrop dla słonia, malutki dla myszki, słoik kostek, wielkie tabletki), maskotki = małe
// zwierzaki z ZOO na półce, tablica do badania wzroku ze zwierzątkami, podświetlany rentgen, termometr, miarka wzrostu do 7 m,
// lampa, apteczka, kaczuszka, kwiatek, miska na wyciągnięte rzeczy. Na zewnątrz: jezdnia z pasami i zebrą, chodniki, kamienice
// ze sklepami i markizami, latarnie, drzewka w donicach (przyroda.pralnia-klinika.js), hydrant, zaparkowana taksówka.
// klGabinet() → { g, miska, tloX, niebo }  ·  pacjent stoi w (0, 0, 0) bokiem do kamery (+z); ściana w z = −4.6, chodnik z ≈ 6.1
// wymaga: models/zwierzeta.js (ZOO), models/przyroda.pralnia-klinika.js (tree, palm, duck), models/pacjenci.klinika.js (klObie), THREE
// wymaga z gry (dla przyroda.pralnia-klinika.js): scene, grp, M, ball, mesh, cg, mK

function klGabinet() {
  const { M, MT, ball, box, cg, mesh, grp, canvasTex, G, rnd, pick } = ZOO, PI = Math.PI, g = new THREE.Group();
  const niebo = canvasTex(8, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4fb7ec'); gr.addColorStop(.55, '#a8e4fa'); gr.addColorStop(1, '#e6f9ff'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
  const cien = o => { o.castShadow = false; o.receiveShadow = true; return o; };
  const napis = (txt, w, h, bg, fg, font) => canvasTex(w, h, x => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + h * .04); });
  const plansza = (tex, w, h, par, x, y, z, ry = 0) => { const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: .7 }), par, x, y, z); m.rotation.y = ry; m.castShadow = false; return m; };
  const X0 = -7.5, X1 = 7.5, ZB = -4.6, H = 7.6;
  // ulica jak w Taxi: asfalt, chodniki z krawężnikiem, przerywana linia, zebra
  const asf = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#5a5d63'; x.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { x.fillStyle = pick(['#53565c', '#62656b', '#4d5056']); x.fillRect(rnd(w), rnd(h), 2, 2); } }, { repeat: [60, 60] });
  const gr = cien(new THREE.Mesh(new THREE.PlaneGeometry(300, 300), MT(asf, 0x5a5d63, { roughness: 1 }))); gr.rotation.x = -PI / 2; g.add(gr);
  const plyty = canvasTex(64, 64, x => { x.fillStyle = '#d9d4cb'; x.fillRect(0, 0, 64, 64); x.strokeStyle = '#b9b3a8'; x.lineWidth = 3; x.strokeRect(0, 0, 64, 64); }, { repeat: [50, 2] });
  for (const z of [6.1, 18.6]) { cien(box(MT(plyty, 0xd9d4cb, { roughness: .9 }), g, 0, .07, z, 100, .14, 3)); box(M(0x9a9690), g, 0, .1, z + (z < 10 ? 1.55 : -1.55), 100, .2, .2).castShadow = false; }
  for (let x = -48; x <= 48; x += 4) box(M(0xffffff), g, x, .02, 12.85, 2, .02, .2).castShadow = false;
  for (let i = 0; i < 6; i++) box(M(0xffffff), g, -13.5 + i * 1.1, .02, 12.85, .6, .02, 9.4).castShadow = false;
  // kamienice obok kliniki: elewacje z oknami, gzyms, sklep z markizą na parterze
  const fasada = (kol, okn) => canvasTex(128, 128, x => { x.fillStyle = kol; x.fillRect(0, 0, 128, 128); x.fillStyle = okn; x.fillRect(20, 28, 32, 44); x.fillRect(76, 28, 32, 44);
    x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(23, 31, 10, 16); x.fillRect(79, 31, 10, 16); x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(16, 72, 40, 5); x.fillRect(72, 72, 40, 5); });
  const pasy = canvasTex(64, 16, x => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : pick(['#e8574a', '#35c2a1', '#3a8fd8', '#f2b632']); x.fillRect(i * 8, 0, 8, 16); } });
  [[-8, -15, 9, '#d9743f'], [-15, -22.5, 12.5, '#c9a35a'], [-22.5, -31, 8, '#b55346'], [8, 14.5, 10.5, '#e0b45a'], [14.5, 21, 7, '#7aa6c2'], [21, 30, 11.5, '#c2674d']].forEach(([a, b, h, kol]) => {
    const w = Math.abs(b - a), cx = (a + b) / 2, t = fasada(kol, '#3d5a73'); t.repeat.set(Math.round(w / 3), Math.round(h / 3.2));
    cien(box(MT(t, 0xffffff, { roughness: .9 }), g, cx, h / 2, -.8, w - .1, h, 10.4));
    box(M(0xfff3d6), g, cx, h + .15, -.8, w + .3, .3, 10.8); box(M(0x8a8178), g, cx, .5, 4.45, w - .1, 1, .2).castShadow = false;
    box(M(0x23313d, { roughness: .2, metalness: .3 }), g, cx - w * .12, 1.5, 4.42, w * .45, 1.6, .1); box(M(0x8d5a3b), g, cx + w * .28, 1.2, 4.42, 1.1, 2.3, .12);
    const aw = box(MT(pasy, 0xffffff, {}), g, cx - w * .12, 2.75, 5.05, w * .55, .08, 1.3); aw.rotation.x = .35;
  });
  // latarnie, drzewka w donicach, hydrant, ławka
  for (const x of [-18, -9.5, 9.5, 18]) { const l = grp(g, x, 0, 7.2); mesh(cg(.08, .12, 4.6, 8), M(0x2f4f3f), l, 0, 2.3, 0); mesh(cg(.05, .05, .9, 6), M(0x2f4f3f), l, 0, 4.55, -.35).rotation.x = PI / 2; ball(new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffe082, emissiveIntensity: .7 }), l, 0, 4.4, -.75, .22); }
  for (const x of [-12, 12]) { mesh(cg(.5, .4, .6, 12), M(0x8a8178), g, x, .44, 6.4); tree(x, 6.4, .55); }
  const hy = grp(g, 7.9, .14, 6.9); mesh(cg(.16, .18, .6, 10), M(0xe8402f), hy, 0, .3, 0); ball(M(0xe8402f), hy, 0, .62, 0, .17); mesh(cg(.06, .06, .5, 6), M(0xe8402f), hy, 0, .38, 0).rotation.z = PI / 2;
  const law = grp(g, -10.5, .14, 5.3); box(M(0x8d5a3b), law, 0, .5, 0, 2, .1, .5); box(M(0x8d5a3b), law, 0, .85, -.22, 2, .4, .08); for (const s of [-.8, .8]) box(M(0x37474f), law, s, .25, 0, .1, .5, .5);
  // zaparkowana taksówka (pacjenci przyjeżdżają taxi!)
  const tx = grp(g, 10.5, 0, 10); tx.rotation.y = .05;
  box(M(0xffd23f, { roughness: .35 }), tx, 0, .75, 0, 4.2, .9, 1.9); box(M(0xffd23f, { roughness: .35 }), tx, -.2, 1.55, 0, 2.3, .8, 1.75);
  box(M(0x23313d, { roughness: .1, metalness: .3 }), tx, -.2, 1.58, 0, 2.15, .55, 1.8); box(M(0x111111), tx, 0, .85, 0, 4.22, .14, 1.92);
  const szach = canvasTex(64, 16, x => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 8, j * 8, 8, 8); } });
  for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(3.6, .25), new THREE.MeshStandardMaterial({ map: szach }), tx, 0, 1.05, s * .961).rotation.y = s < 0 ? PI : 0;
  const tsz = napis('TAXI', 128, 48, '#ffd23f', '#111', 'bold 36px sans-serif'); for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(.9, .32), new THREE.MeshStandardMaterial({ map: tsz }), tx, -.2, 2.17, s * .26).rotation.y = s < 0 ? PI : 0;
  box(M(0xfff3d6), tx, -.2, 2.17, 0, .95, .34, .5);
  for (const [x, z] of [[1.35, .9], [1.35, -.9], [-1.35, .9], [-1.35, -.9]]) { mesh(cg(.42, .42, .32, 16), M(0x222222), tx, x, .42, z).rotation.x = PI / 2; mesh(cg(.2, .2, .34, 10), M(0xcfd8dc, { metalness: .6, roughness: .3 }), tx, x, .42, z).rotation.x = PI / 2; }
  for (const s of [-1, 1]) ball(new THREE.MeshStandardMaterial({ color: 0xfff8d6, emissive: 0xffe082, emissiveIntensity: .5 }), tx, 2.1, .85, s * .6, .14);
  // wycieraczka z łapką przed wejściem
  box(M(0x35c2a1), g, 0, .16, 5.5, 2.4, .04, 1.2).castShadow = false;
  // podłoga: miętowo-biała szachownica
  const kafle = canvasTex(128, 128, (x, w, h) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#7fcfb4' : '#e9f6f1'; x.fillRect(i * 64, j * 64, 64, 64); } }, { repeat: [10, 5] });
  cien(box(MT(kafle, 0xffffff, { roughness: .8 }), g, 0, .05, -.1, X1 - X0, .1, 9.2));
  // ściany: tapeta w łapki, lamperia, listwa
  const tapeta = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#ffe3c8'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(232,150,110,.35)';
    for (const [cx, cy] of [[32, 36], [96, 100]]) { x.beginPath(); x.ellipse(cx, cy, 11, 9, 0, 0, 7); x.fill(); for (const [dx, dy] of [[-11, -12], [-4, -17], [4, -17], [11, -12]]) { x.beginPath(); x.arc(cx + dx, cy + dy, 4, 0, 7); x.fill(); } } }, { repeat: [8, 3] });
  const scM = MT(tapeta, 0xffe3c8, { roughness: .9 }), lam = M(0x7fd8c4), list = M(0xffffff);
  cien(box(scM, g, 0, H / 2, ZB, X1 - X0, H, .3));
  box(lam, g, 0, .7, ZB + .17, X1 - X0, 1.4, .05).castShadow = false; box(list, g, 0, 1.42, ZB + .2, X1 - X0, .1, .1);
  // lewa ściana pełna (z łapką), prawa z oknem; wchodzi się od frontu, z chodnika
  cien(box(scM, g, X0, H / 2, -.1, .3, H, 9));
  plansza(napis('🐾', 128, 128, '#ff8fb1', '#fff', '90px serif'), 1.2, 1.2, g, X0 + .2, 5.2, -.5, PI / 2);
  cien(box(scM, g, X1, H / 2, -2.6, .3, H, 4)); cien(box(scM, g, X1, H / 2, 3.3, .3, H, 2.2)); cien(box(scM, g, X1, 1, .45, .3, 2, 3.7)); cien(box(scM, g, X1, 6.2, .45, .3, 2.8, 3.7));
  box(M(0xffffff), g, X1 - .1, 3.4, .45, .2, .2, 3.7); box(M(0xffffff), g, X1 - .1, 4.8, .45, .25, .15, 3.7);
  // dach: belka, markiza w paski z ząbkami, szyld z maskotkami
  box(M(0xff7e5f), g, 0, H + .2, ZB + 4.5, X1 - X0 + .8, .4, 9.6).castShadow = false;
  for (let i = 0; i < 20; i++) { const x = X0 - .2 + i * (X1 - X0 + .4) / 19; const k = box(M(i % 2 ? 0xffffff : 0xff5c6c), g, x, H - .25, 4.6, .98, .7, .12); k.castShadow = false; ball(M(i % 2 ? 0xffffff : 0xff5c6c), g, x, H - .62, 4.6, .48, .22, .08).castShadow = false; }
  const szyld = grp(g, 0, H + 1.5, -1);
  box(M(0xffd23f), szyld, 0, 0, 0, 8.4, 2, .4); box(M(0xffffff), szyld, 0, 0, .1, 8, 1.6, .4);
  plansza(napis('KLINIKA ZOO', 512, 96, '#ffffff', '#ff5c6c', 'bold 70px "Baloo 2", sans-serif'), 7.6, 1.42, szyld, 0, 0, .32);
  const maskotka = (typ, par, x, y, z, h, ry = .5) => { const f = ZOO.fit(typ, h); f.g.position.set(x, y, z); f.g.rotation.y = ry; par.add(f.g); return f; };
  maskotka('giraffe', szyld, -4.9, -.9, .2, 3.2, .9); maskotka('elephant', szyld, 4.9, -.9, .2, 1.9, -.6);
  // półka leków dla zwierząt
  const polka = (par, x, y, w) => { box(M(0xb07a4a), par, x, y, ZB + .45, w, .12, .7); for (const s of [-1, 1]) box(M(0x8d5a3b), par, x + s * (w / 2 - .1), y - .3, ZB + .45, .1, .5, .6); };
  polka(g, -4.6, 2.3, 4.6); polka(g, -4.6, 3.7, 4.6);
  const etyk = em => canvasTex(64, 64, x => { x.fillStyle = '#fffdf2'; x.fillRect(0, 0, 64, 64); x.font = '44px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(em, 32, 36); });
  const butla = (x, y, r, h, col, em) => {
    const b = grp(g, x, y, ZB + .45); mesh(cg(r, r * 1.05, h, 16), M(col, { roughness: .25 }), b, 0, h / 2, 0); mesh(cg(r * .45, r * .55, h * .18, 12), M(col, { roughness: .25 }), b, 0, h + h * .09, 0);
    mesh(cg(r * .5, r * .5, h * .14, 12), M(0xffffff), b, 0, h * 1.22, 0);
    if (em) { const l = mesh(new THREE.PlaneGeometry(r * 1.3, r * 1.3), new THREE.MeshStandardMaterial({ map: etyk(em) }), b, 0, h * .45, r * 1.06); l.castShadow = false; }
    return b;
  };
  butla(-6.4, 2.36, .42, 1.0, 0xff7eb6, '🐘');                        // wielki syrop dla słonia
  butla(-5.6, 2.36, .14, .3, 0x7ed957, '🐭');                          // malutki dla myszki
  butla(-5.0, 2.36, .24, .6, 0xffa53a, '🦒'); butla(-4.3, 2.36, .22, .5, 0x5cc6ff, '🐧'); butla(-3.6, 2.36, .26, .55, 0x9b6bff, '🦁');
  const sloj = grp(g, -2.85, 2.36, ZB + .45);                          // słoik smakołyków-kostek
  mesh(cg(.36, .36, .8, 16), new THREE.MeshStandardMaterial({ color: 0xdff6ff, transparent: true, opacity: .55, roughness: .1 }), sloj, 0, .4, 0).castShadow = false;
  mesh(cg(.38, .38, .12, 16), M(0xff5c6c), sloj, 0, .86, 0);
  for (let i = 0; i < 6; i++) { const k = grp(sloj, rnd(-.18, .18), .15 + i * .1, rnd(-.15, .15)); k.rotation.z = rnd(-1, 1); mesh(cg(.04, .04, .3, 6), M(0xfff4d6), k).rotation.z = PI / 2; for (const s of [-1, 1]) ball(M(0xfff4d6), k, s * .15, 0, 0, .06); }
  for (const [x, c1, c2] of [[-6.2, 0xff5c6c, 0xffffff], [-5.2, 0x3ab0ff, 0xffd23f], [-4.2, 0x7ed957, 0xffffff]]) {   // wielkie tabletki
    const t = grp(g, x, 3.95, ZB + .45); t.rotation.z = rnd(-.3, .3);
    mesh(cg(.16, .16, .3, 14), M(c1, { roughness: .3 }), t, -.15, 0, 0).rotation.z = PI / 2; mesh(cg(.16, .16, .3, 14), M(c2, { roughness: .3 }), t, .15, 0, 0).rotation.z = PI / 2;
    ball(M(c1, { roughness: .3 }), t, -.3, 0, 0, .16); ball(M(c2, { roughness: .3 }), t, .3, 0, 0, .16);
  }
  butla(-3.2, 3.76, .2, .5, 0xffd23f, '🐒'); butla(-2.7, 3.76, .18, .42, 0x35c2a1, '🐢');
  // półka z maskotkami (małe zwierzaki z ZOO)
  polka(g, 4.1, 4.3, 4.4);
  [['lion', 2.4, .75], ['penguin', 3.25, .75], ['panda', 4.1, .7], ['hippo', 5.0, .6], ['zebra', 5.8, .75]].forEach(([t, x, h]) => maskotka(t, g, x, 4.36, ZB + .5, h, .45));
  // tablica do badania wzroku: zwierzątka coraz mniejsze
  const tw = canvasTex(256, 384, x => { x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 384); x.textAlign = 'center'; x.textBaseline = 'middle';
    [['🐘', 90, 70], ['🦒 🦁', 56, 170], ['🐧 🐒 🐢', 36, 250], ['🐭 🐞 🐝 🐜', 22, 315], ['🦠 🦠 🦠 🦠 🦠', 12, 355]].forEach(([t, f, y]) => { x.font = f + 'px serif'; x.fillText(t, 128, y); }); });
  box(M(0x35c2a1), g, 1.0, 2.9, ZB + .17, 1.75, 2.55, .06); plansza(tw, 1.6, 2.4, g, 1.0, 2.9, ZB + .22);
  // podświetlany rentgen (świecąca tablica z kośćmi)
  const rx = canvasTex(256, 192, x => { x.fillStyle = '#123a5c'; x.fillRect(0, 0, 256, 192); x.strokeStyle = '#dff6ff'; x.lineWidth = 9; x.lineCap = 'round';
    x.beginPath(); x.moveTo(40, 110); x.lineTo(150, 110); x.moveTo(150, 110); x.lineTo(200, 60); x.moveTo(70, 110); x.lineTo(70, 160); x.moveTo(130, 110); x.lineTo(130, 160); x.stroke();
    x.beginPath(); x.arc(212, 50, 22, 0, 7); x.stroke(); x.fillStyle = '#dff6ff'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(60 + i * 20, 100, 6, 0, 7); x.fill(); } });
  box(M(0xffffff), g, 5.4, 5.9, ZB + .17, 2.5, 1.95, .1);
  mesh(new THREE.PlaneGeometry(2.3, 1.75), new THREE.MeshBasicMaterial({ map: rx }), g, 5.4, 5.9, ZB + .24).castShadow = false;
  // wielki termometr
  const tm = grp(g, 2.6, 5.6, ZB + .3); mesh(cg(.13, .13, 3, 12), M(0xffffff, { roughness: .2 }), tm, 0, 0, 0); mesh(cg(.07, .07, 1.9, 8), M(0xff3a4a), tm, 0, -.4, .06); ball(M(0xff3a4a), tm, 0, -1.65, 0, .28);
  for (let i = 0; i < 8; i++) box(M(0x37474f), tm, .14, -1 + i * .3, .1, .1, .03, .02);
  // miarka wzrostu: kolorowe pasy co metr, aż do 7 m (dla żyrafy)
  [0xff5a5a, 0xffa53a, 0xffd23f, 0x6ad66a, 0x3ab0ff, 0x9a6aff, 0xff7eb6].forEach((c, i) => box(M(c), g, 7.0, .55 + i, ZB + .22, .6, .96, .08));
  // lampa zabiegowa na wysięgniku, apteczka z serduszkiem, kwiatek, kaczuszka
  const lmp = grp(g, 3.3, 0, -3.4); mesh(cg(.35, .45, .2, 14), M(0x90a4ae, { metalness: .5, roughness: .4 }), lmp, 0, .1, 0); mesh(cg(.06, .06, 5.6, 8), M(0xcfd8dc, { metalness: .6, roughness: .3 }), lmp, 0, 2.9, 0);
  const ram = mesh(cg(.05, .05, 1.6, 8), M(0xcfd8dc, { metalness: .6, roughness: .3 }), lmp, .7, 5.7, 0); ram.rotation.z = PI / 2;
  mesh(new THREE.SphereGeometry(.55, 16, 8, 0, PI * 2, 0, PI / 2), M(0xff7eb6, { side: THREE.DoubleSide }), lmp, 1.5, 5.5, 0).rotation.x = PI;
  mesh(cg(.3, .3, .05, 14), new THREE.MeshStandardMaterial({ color: 0xfff8d6, emissive: 0xffe082, emissiveIntensity: 1 }), lmp, 1.5, 5.48, 0).castShadow = false;
  const ap = grp(g, -6.6, 0, -2.4); box(M(0x35c2a1), ap, 0, .5, 0, 1.2, 1, .8); box(M(0xffffff), ap, 0, 1.03, 0, 1.25, .08, .85);
  plansza(napis('🤍', 64, 64, '#35c2a1', '#fff', '44px serif'), .6, .6, ap, 0, .5, .41);
  mesh(cg(.5, .36, .8, 12), M(0xe0794a), g, 6.6, .45, 3.4); for (let i = 0; i < 6; i++) ball(M(pick([0x4caf50, 0x66bb6a, 0x43a047])), g, 6.6 + rnd(-.35, .35), 1.2 + rnd(0, .7), 3.4 + rnd(-.35, .35), rnd(.3, .45));
  duck(g, 3.6, .1, 2.9, 1.0).rotation.y = -2.2;
  // miska na wyciągnięte rzeczy (widać ją też w rentgenie)
  const miska = grp(g);
  mesh(cg(.8, .55, .35, 22), M(0xcfd8dc, { metalness: .6, roughness: .3 }), miska, 0, .18, 0);
  mesh(cg(.7, .7, .04, 22), M(0x90a4ae, { metalness: .5, roughness: .4 }), miska, 0, .34, 0);
  klObie(miska);
  // tło rentgena: granatowa siatka za pacjentem
  const siatka = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#0a1830'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(90,190,255,.22)'; x.lineWidth = 2; x.strokeRect(0, 0, w, h); x.strokeStyle = 'rgba(90,190,255,.08)'; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.moveTo(0, 64); x.lineTo(128, 64); x.stroke(); }, { repeat: [30, 15] });
  const tloX = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: siatka }));
  tloX.position.set(0, 8, -3); tloX.layers.set(1); g.add(tloX);
  return { g, miska, tloX, niebo };
}
