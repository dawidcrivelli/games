// Zwierzęta z lasu i łąki w stylu „słodziaków” (dopisane do ZOO.MK): sarenka, kret, bóbr.
// Użycie jak w models/animals.js: a = ZOO.MK.beaver(); scene.add(a.root); ZOO.anim(a, dt).
// Kret: a.paws — wielkie łapy do kopania (gra może nimi machać); bóbr: a.tail — płaski ogon-wiosło (klaps: rotation.z).
// wymaga: models/animals.js (ZOO i jego budulec), models/farm-animals.js nie jest potrzebny
'use strict';
(() => {
const { M, MT, MV, G, cg, mesh, ball, box, grp, flat, loft, legs, LEGS4, FOOT, eye, base, finish, whiskers, canvasTex, mW, mK } = ZOO;
const PI = Math.PI;
const smallWhiskers = (par, x, y, k) => { const g = grp(par, x, y, 0); g.scale.setScalar(k); whiskers(g, 0, 0); return g; };

// ---------- sarenka: smukła, rudobrązowa, białe kropki na grzbiecie, duże uszy, biały „lusterko” z tyłu
function mkDeer() {
  const a = base('deer'), C = 0xb8693a, Cl = 0xf4dfc4, fur = M(C, { roughness: .85 }), lt = M(Cl, { roughness: .85 }), wh = M(0xfffaf0), hoof = M(0x3a2a24), nose = M(0x2a1e1c, { roughness: .3 }), b = a.body;
  mesh(loft('deB', [[-.98, 1.6, .05, .05], [-.9, 1.63, .36, .32, .4], [-.5, 1.66, .48, .38, .52], [.1, 1.63, .44, .36, .5], [.55, 1.7, .46, .36, .5], [.84, 1.8, .34, .3, .38], [.96, 1.84, .05, .05]], C, Cl), MV, b);
  for (let i = 0; i < 9; i++) { const x = -.6 + (i % 5)*.3 + (i > 4 ? .15 : 0), s = i % 2 ? 1 : -1; ball(wh, b, x, 1.98 - (i > 4 ? .08 : 0), s*(i > 4 ? .3 : .2), .055, .035, .045).userData.nd = 1; }
  const lg = loft('deL', [[0, .2, .05, .05], [0, .05, .19, .14], [0, -.45, .11, .095], [0, -.8, .065, .06], [0, -.9, .07, .065], [0, -1.27, .05, .05], [0, -1.31, .03, .03]], C);
  legs(a, b, LEGS4(.68, -.75, .24), 1.38, p => { mesh(lg, MV, p); mesh(cg(.055, .07, .1), hoof, p, 0, -1.33, 0); });
  ball(wh, b, -.93, 1.72, 0, .1, .24, .28);
  const nk = a.neck = grp(b, .76, 1.86, 0); a.neckBase = -.3; nk.rotation.z = -.3;
  mesh(loft('deN', [[0, -.3, .05, .05], [0, -.15, .3, .24], [0, .3, .21, .18], [0, .7, .17, .15], [0, .84, .05, .05]], C, Cl), MV, nk);
  const h = a.head = grp(nk, 0, .78, 0); a.headBase = .3;
  mesh(loft('deH', [[-.22, .03, .05, .05], [-.15, .04, .21, .2], [.08, .05, .24, .21, .21], [.3, 0, .16, .15], [.48, -.05, .1, .1, .09], [.55, -.06, .03, .03]], C, Cl), MV, h);
  ball(nose, h, .54, -.03, 0, .055, .045, .06);
  const eg = flat('deE', [[0, 0], [.13, .14], [.13, .38], [0, .5], [-.13, .38], [-.13, .14]], .04, .02);
  for (const s of [1, -1]) {
    const e = grp(h, -.08, .2, s*.13); e.rotation.x = s*.75; mesh(eg, fur, e); mesh(eg, M(0x6a3c22), e, 0, .05, s*.016, .7, .75, .5); ball(wh, e, 0, .1, s*.022, .07, .11, .01);
    a.ears.push({ p: e, base: 0, bx: s*.75, s, ax: 'x', fast: 6 });
    eye(a, h, .12, .08, s*.17, .085, { lash: 1 });
  }
  a.tail = grp(b, -.96, 1.82, 0); ball(fur, a.tail, -.02, 0, 0, .06, .1, .06);
  a.hat = grp(h, -.02, .28, 0); a.hatS = .5; a.gait = 9; a.swing = .5; a.hopH = .14; return finish(a, .95);
}

// ---------- kret: czarny aksamit, różowy ryjek, malutkie oczka, wielkie różowe łapy-łopaty (a.paws)
function mkMole() {
  const a = base('mole'), C = 0x2e2c38, Cl = 0x4a4756, vel = M(C, { roughness: .95 }), pk = M(0xf4a2b6, { roughness: .6 }), pkD = M(0xd97a92), b = a.body;
  mesh(loft('mlB', [[-.55, .42, .05, .05], [-.46, .44, .3, .32, .26], [-.15, .48, .42, .42, .34], [.18, .47, .38, .38, .32], [.38, .45, .26, .27, .22], [.48, .43, .05, .05]], C, Cl), MV, b);
  const h = a.head = grp(b, .42, .46, 0);
  mesh(loft('mlS', [[0, 0, .05, .05], [.04, 0, .1, .1, .09], [.16, -.01, .08, .08, .07], [.24, -.02, .05, .05], [.27, -.02, .02, .02]], 0xf4a2b6, 0xf4a2b6, { seg: 10 }), MV, h);
  ball(pkD, h, .27, -.02, 0, .04, .035, .045); smallWhiskers(h, .18, -.03, .5);
  for (const s of [1, -1]) { const e = grp(h, -.04, .1, s*.18); ball(mK, e, 0, 0, 0, .028); ball(mW, e, .012, .012, s*.012, .009); e.traverse(q => { q.userData.nd = 1; }); a.eyes.push(e); }
  a.paws = [];
  const pg = flat('mlP', [[0, .13], [.12, .14], [.2, .08], [.24, 0], [.2, -.08], [.12, -.14], [0, -.13], [-.06, 0]], .05, .02);
  for (const s of [1, -1]) {
    const p = grp(b, .3, .32, s*.34); p.rotation.x = s*.4; mesh(cg(.08, .09, .18, 8), vel, p, 0, -.06, 0); const paw = mesh(pg, pk, p, .02, -.16, 0); paw.rotation.x = PI/2; paw.rotation.y = -.3*s;
    for (let i = 0; i < 5; i++) ball(M(0xfff0d6), p, .2 + Math.cos((i - 2)*.4)*.06, -.16, Math.sin((i - 2)*.4)*.13, .035, .02, .02);
    a.legs.push({ p, ph: s > 0 ? 0 : PI, front: true, s }); a.paws.push(p);
    const q = grp(b, -.3, .2, s*.2); ball(pk, q, .05, -.15, 0, .1, .04, .07); mesh(cg(.06, .06, .12, 6), vel, q, 0, -.06, 0); a.legs.push({ p: q, ph: s > 0 ? PI : 0, front: false, s });
  }
  a.tail = grp(b, -.54, .46, 0); a.tail.rotation.z = .5; mesh(cg(.03, .015, .2, 6), pk, a.tail, 0, .1, 0);
  a.hat = grp(h, -.15, .34, 0); a.hatS = .4; a.gait = 12; a.swing = .6; a.waddle = .08; return finish(a, 1);
}

// ---------- bóbr: pulchny, wielkie pomarańczowe zęby, okrągłe uszka, płaski łuskowaty ogon (a.tail)
let tailMat = null;
function mkBeaver() {
  const a = base('beaver'), C = 0x8b5a33, Cl = 0xc99c6e, fur = M(C, { roughness: .9 }), lt = M(Cl, { roughness: .9 }), dk = M(0x4d2f1b), tooth = M(0xf39a2c, { roughness: .35 }), b = a.body;
  tailMat = tailMat || MT(canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#4a3a3e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2c2226'; g.lineWidth = 3;
    for (let i = -w; i < w*2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); } }), 0x4a3a3e, { roughness: .6 });
  mesh(loft('bvB', [[-.72, .62, .05, .05], [-.64, .66, .4, .4, .36], [-.3, .7, .54, .5, .48], [.1, .72, .5, .48, .45], [.36, .78, .38, .38, .34], [.5, .82, .05, .05]], C, Cl), MV, b);
  const h = a.head = grp(b, .5, 1.0, 0);
  mesh(loft('bvH', [[-.26, 0, .05, .05], [-.18, 0, .28, .3, .26], [.06, .01, .3, .3, .28], [.24, -.05, .22, .24, .2], [.36, -.09, .14, .16, .14], [.4, -.1, .04, .04]], C, Cl), MV, h);
  ball(dk, h, .39, -.05, 0, .06, .045, .08); ball(lt, h, .3, -.14, 0, .1, .07, .14);
  for (const s of [1, -1]) { box(tooth, h, .33, -.25, s*.034, .035, .13, .06); ball(fur, h, -.08, .22, s*.2, .075, .075, .04); ball(dk, h, -.07, .22, s*.215, .045, .045, .02); eye(a, h, .12, .1, s*.23, .065); }
  smallWhiskers(h, .32, -.1, .62);
  const fg = flat('crF', FOOT, .05, .02, 1);
  for (const s of [1, -1]) {
    const p = grp(b, .3, .55, s*.26); mesh(cg(.06, .07, .3, 8), fur, p, 0, -.15, 0); ball(dk, p, .04, -.32, 0, .08, .05, .07); a.legs.push({ p, ph: s > 0 ? 0 : PI, front: true, s });
    const q = grp(b, -.35, .36, s*.3); ball(fur, q, 0, 0, 0, .22, .22, .13); ball(fur, q, .04, -.2, 0, .09, .14, .08); const f = mesh(fg, dk, q, .02, -.34, 0, .7); f.rotation.x = -PI/2; a.legs.push({ p: q, ph: s > 0 ? PI : 0, front: false, s });
  }
  a.tail = grp(b, -.66, .48, 0); a.tail.rotation.z = .15; mesh(cg(.12, .14, .2, 10), fur, a.tail, -.08, 0, 0).rotation.z = PI/2; ball(tailMat, a.tail, -.55, -.03, 0, .48, .07, .28);
  a.hat = grp(h, -.05, .3, 0); a.hatS = .55; a.gait = 9; a.swing = .5; a.waddle = .1; return finish(a, 1);
}

Object.assign(ZOO.MK, { deer: mkDeer, mole: mkMole, beaver: mkBeaver });
})();
