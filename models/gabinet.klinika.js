// Klinika Zoo — gabinet weterynarza w stylu Dzikich Bryk: podłoga w kafelki, ściana z lamperią, drzwi, okno,
// miarka wzrostu (dla żyrafy!), plakat z łapką, kwiatek, miska na wyciągnięte rzeczy; tło rentgena (siatka) na warstwie 1.
// klGabinet() → { g, miska, tloX }  ·  ściana w z = −3.2, podłoga y = 0, drzwi po lewej (x ≈ −9)
// wymaga: lib/komiks.bryki-klinika.js (brPart, brBox, brCyl, brExt, brMat), models/pacjenci.klinika.js (klObie), THREE

function klTekstura(w, h, rys, rep) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; rys(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
function klGabinet() {
  const g = new THREE.Group(), Z = -3.2;
  // podłoga: miętowo-białe kafle
  const kafle = klTekstura(128, 128, (x, w, h) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#bfe8d6' : '#f4fbf6'; x.fillRect(i * 64, j * 64, 64, 64); } x.strokeStyle = 'rgba(60,110,90,.25)'; x.lineWidth = 3; x.strokeRect(0, 0, 128, 128); }, [20, 8]);
  brPart(g, new THREE.PlaneGeometry(48, 20), new THREE.MeshToonMaterial({ map: kafle }), 0, 0, 5, { r: [-Math.PI / 2, 0, 0], ol: 0 });
  // ściana z lamperią i listwą
  brPart(g, brBox(48, 10, .3), 0xfff0c8, 0, 5, Z - .15, { ol: 0 });
  brPart(g, brBox(48, 1.5, .1), 0x8fd3c1, 0, .75, Z + .05, { ol: 0 });
  brPart(g, brBox(48, .14, .2), 0xffffff, 0, 1.55, Z + .1, { ol: .02 });
  brPart(g, brBox(48, .25, .3), 0x6cb8a4, 0, .12, Z + .1, { ol: .02 });
  // drzwi z okrągłym okienkiem
  brPart(g, brBox(2.6, 4.6, .2), 0xffffff, -9, 2.3, Z + .1, { ol: .04 });
  brPart(g, brBox(2.2, 4.3, .2), 0x58a9e8, -9, 2.15, Z + .2, { ol: .03 });
  brPart(g, brCyl(.45, .45, .1, 20, 'z'), brMat(0xcff0ff, 'glow'), -9, 3.3, Z + .32, { ol: .03 });
  brPart(g, new THREE.SphereGeometry(.13, 10, 8), 0xffc93c, -8.2, 2.1, Z + .35, { ol: .02 });
  // okno z niebem i chmurką
  brPart(g, brBox(3.4, 2.6, .2), 0xffffff, 6.5, 4.6, Z + .1, { ol: .04 });
  brPart(g, brBox(3.0, 2.2, .1), brMat(0x8fdcff, 'glow'), 6.5, 4.6, Z + .2, { ol: 0 });
  for (const [x, y, r] of [[6.0, 4.9, .3], [6.4, 5.0, .38], [6.8, 4.88, .28]]) brPart(g, new THREE.SphereGeometry(r, 10, 8), brMat(0xffffff, 'glow'), x, y, Z + .3, { s: [1, .7, .3], ol: 0 });
  brPart(g, brBox(.12, 2.2, .14), 0xffffff, 6.5, 4.6, Z + .28, { ol: .02 });
  brPart(g, brBox(3.0, .12, .14), 0xffffff, 6.5, 4.6, Z + .28, { ol: .02 });
  // miarka wzrostu: kolorowe pasy co metr
  const kol = [0xff5a5a, 0xffa53a, 0xffd23f, 0x6ad66a, 0x3ab0ff, 0x9a6aff];
  kol.forEach((c, i) => brPart(g, brBox(.5, 1, .08), c, 3.4, .5 + i, Z + .15, { ol: .02 }));
  for (let i = 1; i < 6; i++) brPart(g, brBox(.7, .06, .1), 0x3a2412, 3.4, i, Z + .2, { ol: 0 });
  // plakat z łapką
  brPart(g, brBox(2, 2.4, .1), 0xffffff, -4.5, 4.6, Z + .1, { ol: .04 });
  brPart(g, brBox(1.8, 2.2, .1), 0xffe6a8, -4.5, 4.6, Z + .15, { ol: 0 });
  brPart(g, new THREE.SphereGeometry(.42, 14, 10), 0xd9643a, -4.5, 4.3, Z + .25, { s: [1.1, .9, .3], ol: .02 });
  for (const [x, y] of [[-.5, .35], [-.18, .62], [.18, .62], [.5, .35]]) brPart(g, new THREE.SphereGeometry(.17, 10, 8), 0xd9643a, -4.5 + x, 4.3 + y + .1, Z + .25, { s: [1, 1.2, .3], ol: .02 });
  // kwiatek w doniczce
  brPart(g, brCyl(.45, .32, .8, 12), 0xe0794a, 9.5, .4, -2, { ol: .03 });
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; brPart(g, brExt([[0, 0], [.25, .5], [0, 1.2], [-.25, .5]], .06, .02, 1), 0x4fb84a, 9.5 + Math.cos(a) * .15, .8, -2 + Math.sin(a) * .15, { r: [Math.sin(a) * .5, a, Math.cos(a) * .5], ol: .02 }); }
  // miska na wyciągnięte rzeczy (widać ją też w rentgenie)
  const miska = new THREE.Group(); g.add(miska);
  brPart(miska, brCyl(.8, .55, .3, 20), 0xc9d3dc, 0, .15, 0, { ol: .03 });
  brPart(miska, brCyl(.68, .68, .05, 20), 0x9aa7b3, 0, .29, 0, { ol: 0 });
  klObie(miska);
  // tło rentgena: granatowa siatka za pacjentem
  const siatka = klTekstura(128, 128, (x, w, h) => { x.fillStyle = '#0a1830'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(90,190,255,.22)'; x.lineWidth = 2; x.strokeRect(0, 0, w, h); x.strokeStyle = 'rgba(90,190,255,.08)'; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.moveTo(0, 64); x.lineTo(128, 64); x.stroke(); }, [30, 15]);
  const tloX = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: siatka }));
  tloX.position.set(0, 8, -3); tloX.layers.set(1); g.add(tloX);
  return { g, miska, tloX };
}
