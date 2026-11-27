// Zwierzęta z gospodarstwa w stylu „słodziaków” (dopisane do ZOO.MK): królik, kura, krowa, koza, mysz.
// Użycie jak w models/animals.js: a = ZOO.MK.rabbit(); scene.add(a.root); ZOO.anim(a, dt); ZOO.pose(a, 'hurt').
// Głowa w +x, stopy na y = 0. Materiały z teksturą (łaty krowy) robione przy pierwszym modelu, nie przy ładowaniu.
// wymaga: models/animals.js (ZOO i jego budulec: loft, legs, eye, base, finish…)
'use strict';
(() => {
const { M, MT, MV, G, cg, mesh, ball, box, grp, flat, loft, legs, LEGS4, FOOT, eye, base, finish, whiskers, canvasTex, mW, mK, rnd } = ZOO;
const PI = Math.PI;
const smallWhiskers = (par, x, y, k) => { const g = grp(par, x, y, 0); g.scale.setScalar(k); whiskers(g, 0, 0); return g; };

// ---------- królik: długie uszy, puszysty ogonek, duże tylne łapy (skacze: hopH)
function mkRabbit() {
  const a = base('rabbit'), C = 0xc3a68a, Cl = 0xf8efdf, fur = M(C, { roughness: .9 }), lt = M(Cl, { roughness: .9 }), pk = M(0xf3a2b4), b = a.body;
  mesh(loft('raB', [[-.62, .66, .05, .05], [-.55, .7, .34, .34, .3], [-.3, .74, .48, .44, .4], [0, .74, .45, .4, .38], [.26, .8, .36, .33, .3], [.4, .88, .24, .24], [.46, .92, .05, .05]], C, Cl), MV, b);
  legs(a, b, [[.26, .15, 0], [.26, -.15, .3], [-.32, .27, PI], [-.32, -.27, PI + .3]], .46, (p, s, front) => {
    if (front) { mesh(cg(.065, .08, .4), fur, p, 0, -.2, 0); ball(lt, p, .06, -.42, 0, .11, .055, .085); }
    else { ball(fur, p, 0, -.06, 0, .3, .3, .14); ball(fur, p, .06, -.3, 0, .14, .16, .1); ball(lt, p, .12, -.41, 0, .26, .07, .11); ball(pk, p, .34, -.41, 0, .04, .03, .05); }
  });
  const h = a.head = grp(b, .5, 1.06, 0);
  mesh(loft('raH', [[-.28, 0, .05, .05], [-.2, 0, .26, .26, .24], [0, .02, .3, .3, .27], [.2, -.02, .24, .25, .22], [.31, -.06, .15, .17, .14], [.36, -.07, .04, .04]], C, Cl), MV, h);
  for (const s of [1, -1]) {
    ball(lt, h, .26, -.1, s*.09, .1, .09, .1);                              // policzki
    box(mW, h, .33, -.19, s*.024, .022, .08, .04);                           // zęby
    eye(a, h, .13, .09, s*.2, .08);
    const e = grp(h, -.1, .2, s*.1); e.rotation.x = s*.22; e.rotation.z = -.22;
    const eg = flat('raE', [[0, 0], [.11, .25], [.09, .62], [0, .78], [-.09, .62], [-.11, .25]], .05, .02);
    mesh(eg, fur, e); mesh(eg, pk, e, .01, .07, s*.028, .62, .82, .5);
    a.ears.push({ p: e, base: 0, bx: s*.22, s, ax: 'x', fast: 4 });
  }
  ball(pk, h, .36, -.03, 0, .045, .035, .055); smallWhiskers(h, .31, -.08, .62);
  a.tail = grp(b, -.62, .76, 0); ball(lt, a.tail, -.04, 0, 0, .14);
  a.hat = grp(h, -.05, .3, 0); a.hatS = .45; a.gait = 8; a.swing = .7; a.hopH = .32; return finish(a, 1);
}

// ---------- kura: rdzawa, czerwony grzebień, korale, wachlarz ogona, skrzydła (pose wing), żółte łapki
function mkChicken() {
  const a = base('chicken'), C = 0xc8692e, Cd = 0x7a3412, Cl = 0xf1c28a, fe = M(C, { roughness: .85 }), dk = M(Cd, { roughness: .85 }), cr = M(Cl, { roughness: .85 }),
    rd = M(0xe2302a, { roughness: .5 }), ye = M(0xf7b62a, { roughness: .5 }), b = a.body;
  mesh(loft('chB', [[-.5, .88, .05, .05], [-.44, .92, .3, .3, .33], [-.2, .92, .44, .38, .47], [.1, .94, .42, .36, .45], [.3, 1.02, .32, .3], [.42, 1.12, .05, .05]], C, Cl), MV, b);
  ball(fe, b, .3, 1.2, 0, .21, .27, .2);                                       // szyja
  const h = a.head = grp(b, .36, 1.42, 0);
  ball(fe, h, 0, 0, 0, .2, .2, .18);
  for (let i = 0; i < 3; i++) ball(rd, h, -.06 + i*.07, .19 + (i === 1 ? .04 : 0), 0, .065, .085 + (i === 1 ? .02 : 0), .035);
  ball(rd, h, .15, -.17, 0, .05, .08, .035);
  const bk = mesh(G.cone, ye, h, .24, -.02, 0, .065, .15, .055); bk.rotation.z = -PI/2;
  for (const s of [1, -1]) { eye(a, h, .09, .05, s*.15, .05); ball(cr, h, .1, -.05, s*.14, .05, .04, .02); }
  a.tail = grp(b, -.42, 1.02, 0);
  const tf = flat('chT', [[0, 0], [.1, .3], [0, .58], [-.13, .3]], .04, .02);
  for (let i = 0; i < 5; i++) { const f = mesh(tf, i % 2 ? fe : dk, a.tail, 0, 0, (i - 2)*.05); f.rotation.z = .35 + i*.17; f.rotation.x = (i - 2)*.12; }
  const wg = flat('chW', [[.25, 0], [.18, -.2], [0, -.34], [-.28, -.3], [-.38, -.12], [-.15, .04]], .07, .03);
  for (const s of [1, -1]) { const e = grp(b, .05, 1.08, s*.4); e.rotation.x = s*.12; mesh(wg, dk, e); mesh(wg, fe, e, .04, .03, s*.02, .85, .8, .7);
    a.ears.push({ p: e, base: 0, bx: s*.12, s, ax: 'x', fast: 3 }); }
  const fg = flat('crF', FOOT, .05, .02, 1);
  for (const s of [1, -1]) { const p = grp(b, 0, .52, s*.15); mesh(cg(.035, .035, .46, 8), ye, p, 0, -.23, 0); const f = mesh(fg, ye, p, 0, -.49, 0, .6); f.rotation.x = -PI/2;
    a.legs.push({ p, ph: s > 0 ? 0 : PI, front: false, s }); }
  a.hat = grp(h, -.02, .26, 0); a.hatS = .38; a.waddle = .1; a.gait = 13; a.swing = .55; a.hopH = .06; return finish(a, 1);
}

// ---------- krowa: łaty, różowy pysk, wymię, różki, dzwonek na szyi
let cowMat = null;
function mkCow() {
  const a = base('cow'); cowMat = cowMat || MT(canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2428';
    for (let i = 0; i < 8; i++) { const cx = rnd(w), cy = rnd(h), r = rnd(14, 24); for (let k = 0; k < 5; k++) { const x = cx + rnd(-r, r), y = cy + rnd(-r, r)*.7, q = r*rnd(.6, 1); for (const ox of [0, -w, w]) { g.beginPath(); g.ellipse(x + ox, y, q, q*.8, rnd(3), 0, 6.283); g.fill(); } } } }), 0xfbfaf5, { vertexColors: true });
  cowMat.userData.tx = 'cow';
  const W = undefined, Cl = 0xf5efe4, pk = M(0xf2aab5), pkD = M(0xd77f8e), hoof = M(0x3a3034), horn = M(0xf4ead2, { roughness: .4 }), gold = M(0xf2c230, { roughness: .3, metalness: .5 }), lea = M(0x8a4a22), b = a.body;
  mesh(loft('coB', [[-1.45, 1.72, .05, .05], [-1.35, 1.76, .55, .5, .55], [-.9, 1.8, .68, .62, .75], [0, 1.76, .66, .62, .78], [.8, 1.8, .68, .6, .75], [1.15, 1.88, .55, .5, .6], [1.3, 1.92, .05, .05]], W, Cl, { uvs: [1, 1.4] }), cowMat, b);
  ball(pk, b, -.62, 1.06, 0, .3, .2, .27); for (const x of [-.72, -.52]) for (const z of [-.1, .1]) mesh(cg(.04, .03, .16, 8), pkD, b, x, .86, z);
  const lg = loft('coL', [[0, .25, .05, .05], [0, .05, .27, .22], [0, -.5, .18, .15], [0, -.85, .13, .12], [0, -1.12, .12, .12], [0, -1.18, .05, .05]], W, W, { uvs: [.6, .6] });
  legs(a, b, LEGS4(.8, -.95, .36), 1.32, p => { mesh(lg, cowMat, p); mesh(cg(.13, .15, .16), hoof, p, 0, -1.24, 0); });
  const nk = a.neck = grp(b, 1.02, 1.98, 0); a.neckBase = -.95; nk.rotation.z = -.95;
  mesh(loft('coN', [[0, -.4, .05, .05], [0, -.25, .45, .4], [0, .15, .4, .34], [0, .5, .34, .3], [0, .66, .05, .05]], W, Cl, { uvs: [.6, .5] }), cowMat, nk);
  mesh(cg(.37, .38, .09, 16), lea, nk, 0, .02, 0); const bell = grp(nk, .38, -.05, 0); bell.rotation.z = .95; mesh(cg(.05, .13, .2, 12), gold, bell, 0, -.12, 0); ball(gold, bell, 0, -.24, 0, .04);
  const h = a.head = grp(nk, 0, .58, 0); a.headBase = .55;
  mesh(loft('coH', [[-.3, .05, .05, .05], [-.2, .06, .3, .28], [.1, .06, .34, .3, .3], [.42, 0, .29, .27, .27], [.6, -.04, .27, .28], [.64, -.04, .05, .05]], W, Cl, { uvs: [.5, .4] }), cowMat, h);
  mesh(loft('coZ', [[.46, -.04, .05, .05], [.54, -.04, .28, .31, .27], [.72, -.06, .27, .31, .26], [.82, -.06, .05, .05]], 0xf2aab5, 0xf2aab5), MV, h);
  for (const s of [1, -1]) {
    ball(mK, h, .8, .02, s*.12, .035, .045, .03);
    const hr = grp(h, -.1, .28, s*.2); hr.rotation.x = -s*.55; mesh(cg(.03, .06, .28, 8), horn, hr, 0, .12, 0);
    const e = grp(h, -.08, .12, s*.3); e.rotation.x = s*1.25; const eg = flat('coE', [[0, 0], [.12, .14], [.08, .36], [-.08, .36], [-.12, .14]], .05, .02);
    mesh(eg, cowMat, e); mesh(eg, pk, e, .0, .04, s*.02, .65, .75, .5); a.ears.push({ p: e, base: 0, bx: s*1.25, s, ax: 'x', fast: 5 });
    eye(a, h, .18, .14, s*.27, .09, { lash: 1 });
  }
  ball(M(0x2a2428), h, -.1, .3, 0, .14, .07, .16);                               // grzywka
  a.tail = grp(b, -1.42, 1.88, 0); a.tail.rotation.z = -.15; mesh(cg(.04, .03, 1.05, 6), M(0xf5efe4), a.tail, 0, -.52, 0); ball(M(0x2a2428), a.tail, 0, -1.08, 0, .09, .2, .09);
  a.hat = grp(h, .05, .38, 0); a.hatS = .75; a.gait = 6; a.swing = .3; return finish(a, .95);
}

// ---------- koza: biała, bródka, różki wygięte do tyłu, sterczący ogonek
function mkGoat() {
  const a = base('goat'), C = 0xf4f0e6, Cl = 0xe6dcc8, wh = M(C, { roughness: .9 }), gr = M(0xb9b2a4), hoof = M(0x4a4248), horn = M(0xb8a17a, { roughness: .5 }), pk = M(0xf2b4bd), b = a.body;
  mesh(loft('goB', [[-.95, 1.38, .05, .05], [-.86, 1.42, .38, .34, .4], [-.5, 1.45, .5, .42, .55], [.1, 1.42, .48, .4, .55], [.55, 1.48, .48, .4, .52], [.8, 1.55, .35, .32, .4], [.92, 1.58, .05, .05]], C, Cl), MV, b);
  const lg = loft('goL', [[0, .2, .05, .05], [0, .05, .15, .12], [0, -.4, .1, .085], [0, -.75, .07, .065], [0, -.98, .07, .07], [0, -1.02, .04, .04]], C);
  legs(a, b, LEGS4(.6, -.68, .26), 1.08, p => { mesh(lg, MV, p); mesh(cg(.075, .085, .12), hoof, p, 0, -1.08, 0); });
  const nk = a.neck = grp(b, .72, 1.65, 0); a.neckBase = -.35; nk.rotation.z = -.35;
  mesh(loft('goN', [[0, -.3, .05, .05], [0, -.15, .3, .26], [0, .25, .24, .2], [0, .55, .2, .18], [0, .66, .05, .05]], C, Cl), MV, nk);
  const h = a.head = grp(nk, 0, .6, 0); a.headBase = .1;
  mesh(loft('goH', [[-.22, .03, .05, .05], [-.15, .04, .22, .2], [.08, .04, .24, .21, .21], [.32, -.02, .17, .16], [.5, -.07, .12, .12, .11], [.56, -.08, .04, .04]], C), MV, h);
  ball(pk, h, .56, -.06, 0, .04, .035, .07);
  const bd = mesh(G.cone, gr, h, .32, -.3, 0, .07, .26, .06); bd.rotation.z = PI;   // bródka
  for (const s of [1, -1]) {
    let par = grp(h, -.08, .2, s*.1); par.rotation.x = -s*.15; for (let i = 0; i < 5; i++) { const q = grp(par, 0, i ? .1 : 0, 0); q.rotation.z = .32; mesh(cg(.035 - i*.005, .045 - i*.005, .12, 8), horn, q, 0, .05, 0); par = q; }
    const e = grp(h, -.04, .08, s*.2); e.rotation.x = s*1.35; const eg = flat('goE', [[0, 0], [.1, .12], [.06, .32], [-.06, .32], [-.1, .12]], .04, .02);
    mesh(eg, wh, e); mesh(eg, pk, e, 0, .04, s*.015, .6, .7, .5); a.ears.push({ p: e, base: 0, bx: s*1.35, s, ax: 'x', fast: 6 });
    eye(a, h, .12, .1, s*.18, .07, { col: 0xf2d27a });
  }
  a.tail = grp(b, -.92, 1.6, 0); a.tail.rotation.z = .7; ball(wh, a.tail, 0, .12, 0, .07, .16, .06);
  a.hat = grp(h, -.02, .3, 0); a.hatS = .5; a.gait = 9; a.swing = .42; a.hopH = .08; return finish(a, .95);
}

// ---------- mysz: szara, duże różowe uszy, długi ogonek (słoń się jej boi)
function mkMouse() {
  const a = base('mouse'), C = 0xa8a3b2, Cl = 0xe9e5ef, fu = M(C, { roughness: .85 }), pk = M(0xf5a8bc), b = a.body;
  mesh(loft('moB', [[-.42, .22, .05, .05], [-.36, .24, .2, .2, .17], [-.1, .28, .27, .26, .2], [.14, .27, .22, .22, .17], [.3, .25, .14, .15, .12], [.4, .22, .05, .05]], C, Cl), MV, b);
  legs(a, b, [[.18, .12, 0], [.18, -.12, PI], [-.2, .15, PI], [-.2, -.15, 0]], .11, p => { mesh(cg(.03, .035, .1, 6), pk, p, 0, -.05, 0); ball(pk, p, .04, -.1, 0, .06, .02, .04); });
  const h = a.head = grp(b, .3, .29, 0);
  mesh(loft('moH', [[-.12, 0, .05, .05], [-.06, 0, .15, .15, .13], [.08, -.01, .14, .14, .12], [.2, -.04, .07, .08, .06], [.25, -.05, .02, .02]], C, Cl), MV, h);
  ball(pk, h, .25, -.04, 0, .035); smallWhiskers(h, .2, -.05, .45);
  for (const s of [1, -1]) { const e = grp(h, -.02, .14, s*.1); e.rotation.x = s*.45; ball(fu, e, 0, .06, 0, .13, .13, .03); ball(pk, e, .01, .06, s*.012, .09, .09, .02);
    a.ears.push({ p: e, base: 0, bx: s*.45, s, ax: 'x', fast: 7 }); eye(a, h, .08, .05, s*.1, .045); }
  a.tail = grp(b, -.4, .21, 0); mesh(loft('moT', [[0, 0, .03, .03], [-.25, -.1, .025, .025], [-.5, -.05, .02, .02], [-.7, .12, .016, .016], [-.78, .3, .012, .012], [-.72, .4, .004, .004]], 0xf5a8bc, 0xf5a8bc, { seg: 6 }), MV, a.tail);
  a.hat = grp(h, 0, .16, 0); a.hatS = .22; a.gait = 16; a.swing = .6; return finish(a, 1);
}

Object.assign(ZOO.MK, { rabbit: mkRabbit, chicken: mkChicken, cow: mkCow, goat: mkGoat, mouse: mkMouse });
})();
