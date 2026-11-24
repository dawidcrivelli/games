// Rolnik-dziadek w stylu „słodziaków” (dopisany do ZOO.MK.farmer): słomkowy kapelusz, siwe wąsy, okrągłe okulary,
// koszula w kratę, ogrodniczki, gumiaki. Chodzi jak zwierzaki ZOO (a.moving), ręce = przednie „nogi” (pozy ZOO: 'cheer' — ręce w górę).
// a.hand — prawa dłoń (tu można włożyć narzędzie: ZOO.pitchfork()); głowa w +x, stopy na y = 0.
// ZOO.pitchfork() → Group: widły, czubki zębów w (0, 0, 0), trzonek w górę (+y).
// ZOO.skyHand() → { g, fork, fingers }: wielka ręka dziadka z chmury (rękaw w kratę) trzyma widły zębami w dół; czubki w (0, 0, 0).
// wymaga: models/animals.js (ZOO i jego budulec)
'use strict';
(() => {
const { M, MT, MV, cg, mesh, ball, box, grp, flat, loft, eye, base, finish, canvasTex, mW, mK } = ZOO;
const PI = Math.PI;
let plaid = null, straw = null;
function mkFarmer() {
  const a = base('farmer');
  plaid = plaid || MT(canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#c8342c'; g.fillRect(0, 0, w, h); g.globalAlpha = .55; g.fillStyle = '#7a1612';
    for (let i = 0; i < 4; i++) { g.fillRect(i*32 + 10, 0, 10, h); g.fillRect(0, i*32 + 10, w, 10); } g.globalAlpha = .5; g.fillStyle = '#ffe8c8'; for (let i = 0; i < 4; i++) { g.fillRect(i*32 + 26, 0, 2, h); g.fillRect(0, i*32 + 26, w, 2); } }), 0xc8342c, { roughness: .9 });
  straw = straw || MT(canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#ecc96a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.fillStyle = (x + y) % 16 ? '#d9b04e' : '#f6dc8a'; g.fillRect(x, y, 7, 7); } }), 0xecc96a, { roughness: .9 });
  const den = M(0x3f6db0, { roughness: .85 }), denD = M(0x2f5590), skin = M(0xf2c09c, { roughness: .7 }), rose = M(0xf08f8a, { roughness: .7 }), hair = M(0xf4f4f2, { roughness: .9 }),
    boot = M(0x2f6b3a, { roughness: .5 }), btn = M(0xf2c230, { metalness: .5, roughness: .3 }), band = M(0xc8342c), b = a.body;
  // nogi w ogrodniczkach + gumiaki
  const lg = loft('fmL', [[0, .08, .05, .05], [0, 0, .17, .17], [0, -.45, .14, .14], [0, -.8, .13, .13], [0, -.84, .05, .05]], 0x3f6db0);
  for (const s of [1, -1]) { const p = grp(b, 0, 1.02, s*.17); mesh(lg, MV, p); mesh(cg(.15, .15, .34, 12), boot, p, 0, -.78, 0); ball(boot, p, .08, -.94, 0, .22, .1, .15);
    a.legs.push({ p, ph: s > 0 ? 0 : PI, front: false, s }); }
  // tułów: koszula w kratę z brzuszkiem, na to ogrodniczki
  mesh(loft('fmT', [[0, .9, .05, .05], [0, .98, .34, .3, .36], [0, 1.3, .36, .32, .44], [0, 1.6, .34, .3, .38], [0, 1.82, .26, .24, .28], [0, 1.92, .05, .05]], undefined, undefined, { uvs: [2, 1] }), plaid, b);
  mesh(loft('fmO', [[0, .88, .05, .05], [0, .95, .36, .32, .38], [0, 1.25, .38, .335, .46], [0, 1.36, .37, .33, .45], [0, 1.37, .05, .05]], 0x3f6db0), MV, b);
  box(den, b, .37, 1.5, 0, .1, .34, .38); box(denD, b, .4, 1.5, 0, .03, .16, .2);          // śliniak z kieszonką
  for (const s of [1, -1]) { const st = box(den, b, .05, 1.68, s*.2, .66, .08, .08); st.rotation.z = -.1; ball(btn, b, .43, 1.64, s*.14, .035); }
  // ręce (przednie „nogi”): rękaw w kratę, dłoń; prawa trzyma narzędzie (a.hand)
  const ag = loft('fmA', [[0, .05, .05, .05], [0, 0, .13, .13], [0, -.35, .11, .11], [0, -.62, .1, .1], [0, -.66, .05, .05]]);
  for (const s of [1, -1]) { const p = grp(b, 0, 1.76, s*.42); p.rotation.x = s*.12; mesh(ag, plaid, p); const hd = grp(p, .02, -.74, 0); ball(skin, hd, 0, 0, 0, .12, .13, .11);
    ball(skin, hd, .08, .04, -s*.07, .05, .07, .045); if (s < 0) a.hand = hd; a.legs.push({ p, ph: s > 0 ? PI : 0, front: true, s }); }
  // głowa: duży nos, rumieńce, siwe wąsy i brwi, okulary, uszy, słomkowy kapelusz
  const h = a.head = grp(b, .02, 2.2, 0);
  ball(skin, b, .02, 1.95, 0, .13, .12, .13);
  ball(skin, h, 0, 0, 0, .33, .34, .32);
  ball(M(0xeaa58a), h, .33, -.03, 0, .1, .09, .1);
  for (const s of [1, -1]) {
    ball(rose, h, .25, -.08, s*.17, .07, .05, .06);
    const m = ball(hair, h, .3, -.15, s*.1, .13, .06, .1); m.rotation.x = s*.5; m.rotation.z = -.3;
    const br = ball(hair, h, .26, .15, s*.12, .07, .03, .06); br.rotation.x = s*.3;
    eye(a, h, .27, .06, s*.12, .05);
    const gl = mesh(new THREE.TorusGeometry(.075, .012, 6, 18), mK, h, .31, .06, s*.12); gl.rotation.y = PI/2; gl.userData.nd = 1;
    box(mK, h, .18, .07, s*.25, .2, .015, .015).rotation.y = s*.2;
    ball(skin, h, 0, -.02, s*.32, .06, .1, .05);
    ball(hair, h, -.12, -.06, s*.24, .12, .14, .1);
  }
  box(mK, h, .32, .07, 0, .02, .015, .09);
  ball(hair, h, -.22, -.04, 0, .14, .16, .22);
  const hat = grp(h, -.02, .2, 0); hat.rotation.z = .08;
  mesh(cg(.6, .62, .05, 24), straw, hat, 0, 0, 0); mesh(cg(.29, .33, .3, 18), straw, hat, 0, .16, 0); mesh(cg(.335, .335, .09, 18), band, hat, 0, .07, 0); ball(straw, hat, 0, .3, 0, .29, .06, .29);
  a.hat = grp(h, 0, .55, 0); a.hatS = .5; a.headBase = 0; a.lookA = .2; a.gait = 8; a.swing = .55; return finish(a, 1);
}
function pitchfork() {
  const g = new THREE.Group(), wood = M(0xb07a45, { roughness: .7 }), steel = M(0xb9c2c8, { metalness: .8, roughness: .3 });
  mesh(cg(.045, .05, 2.1, 10), wood, g, 0, 1.55, 0); mesh(cg(.07, .055, .18, 10), steel, g, 0, .5, 0);
  box(steel, g, 0, .42, 0, .05, .06, .56);
  for (let i = 0; i < 4; i++) { const z = -.24 + i*.16; mesh(cg(.025, .022, .38, 6), steel, g, 0, .22, z); mesh(cg(.022, .001, .1, 6), steel, g, 0, .0, z).rotation.x = PI; }
  return g;
}
function skyHand() {
  const g = new THREE.Group(), fork = pitchfork(); g.add(fork);
  plaid || mkFarmer();                                           // tekstura kraty
  const skin = M(0xf2c09c, { roughness: .7 }), cloudM = M(0xffffff, { roughness: 1 }), fist = grp(g, 0, 1.55, 0), fingers = []; fist.scale.setScalar(1.6);
  ball(skin, fist, -.12, 0, 0, .3, .34, .26);
  for (let i = 0; i < 4; i++) { const f = grp(fist, .08, .2 - i*.13, 0); ball(skin, f, .1, 0, .12, .11, .075, .1); ball(skin, f, .12, 0, -.02, .1, .07, .1); fingers.push(f); }
  const th = ball(skin, fist, .04, .3, .2, .09, .16, .09); th.rotation.x = -.6;
  mesh(cg(.24, .3, 1.6, 14), plaid, g, -.15, 2.4, 0);
  for (let i = 0; i < 9; i++) { const an = i/9*PI*2; ball(cloudM, g, -.15 + Math.cos(an)*.5, 3.2 + Math.sin(i*1.7)*.12, Math.sin(an)*.5, .42, .32, .42); }
  ball(cloudM, g, -.15, 3.45, 0, .7, .4, .7);
  return { g, fork, fingers };
}
Object.assign(ZOO.MK, { farmer: mkFarmer });
Object.assign(ZOO, { pitchfork, skyHand });
})();
