// zwierzeta — wspólne dla: taxi
// wymaga z gry: M, T, anims
'use strict';
function mkGiraffe() {
    const gTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#f3c456'; g.fillRect(0, 0, w, h); g.fillStyle = '#a8621f';
      for (let i = 0; i < 30; i++) { const x = rnd()*w, y = rnd()*h, r = rr(7, 13); g.beginPath(); for (let k = 0; k < 6; k++) { const a = k/6*6.283 + rr(-.3, .3), q = r*rr(.7, 1.1); g.lineTo(x + Math.cos(a)*q, y + Math.sin(a)*q); } g.fill(); } }, 2, 2);
    const gy = lam(0xffffff, { map:gTex }), gd = lam(0xa8621f), cr = lam(0xf7e3a8), G = new T.Group(), st = new T.Group(), nk = new T.Group(), neck = new T.Group();
    ell(.5, .55, 1.0, gy, 0, 2.75, 0, st);
    [[-.27, -.62], [.27, -.62], [-.27, .62], [.27, .62]].forEach(q => { cone(.085, .13, 2.35, gy, q[0], 1.25, q[1], st, 8); cone(.11, .1, .14, gd, q[0], .07, q[1], st, 8); });
    const tl = cone(.02, .035, 1.2, gy, 0, 2.4, -1.1, st, 5); tl.rotation.x = -.25; ell(.07, .14, .07, gd, 0, 1.8, -1.27, st);
    G.add(bake(st));
    cone(.3, .17, 2.7, gy, 0, 1.25, 0, nk, 10); box(.05, 2.4, .12, gd, 0, 1.3, -.22, nk);
    ell(.21, .23, .42, gy, 0, 2.72, .22, nk); ell(.15, .14, .2, cr, 0, 2.66, .56, nk);
    [-1, 1].forEach(s => { cone(.03, .03, .3, gd, s*.1, 3.02, .1, nk, 6); ell(.055, .055, .055, gd, s*.1, 3.19, .1, nk, 8); ell(.05, .09, .14, gy, s*.26, 2.86, .02, nk, 8); ell(.04, .045, .04, M.dark, s*.19, 2.8, .36, nk, 8); ell(.02, .02, .02, M.dark, s*.07, 2.68, .75, nk, 6); });
    neck.add(bake(nk)); neck.position.set(0, 3.0, .75); G.add(neck);
    anims.push(t => { neck.rotation.x = .32 + Math.sin(t*.7)*.1; neck.rotation.z = Math.sin(t*.45)*.05; });
    return G;
}
function mkElephant() {
    const ge = lam(0x9aa3ad), geD = lam(0x7f8891), E = new T.Group(), es = new T.Group(), trunk = new T.Group(), tr = new T.Group();
    ell(1.0, .95, 1.45, ge, 0, 1.9, 0, es); ell(.72, .75, .7, ge, 0, 2.3, 1.5, es);
    [[-.55, -.8], [.55, -.8], [-.55, .75], [.55, .75]].forEach(q => { cone(.3, .3, 1.3, ge, q[0], .65, q[1], es, 12); cone(.33, .31, .14, geD, q[0], .07, q[1], es, 12); });
    [-1, 1].forEach(s => { const tk = cone(.085, .02, .8, M.flagW, s*.34, 1.8, 2.2, es, 8); tk.rotation.x = Math.PI/2 - .3; ell(.06, .07, .05, M.dark, s*.45, 2.55, 2.05, es, 8); });
    const tl = cone(.02, .04, .9, geD, 0, 1.75, -1.5, es, 5); tl.rotation.x = -.2;
    E.add(bake(es));
    [-1, 1].forEach(s => { const ear = new T.Group(), eg = new T.Group(); ell(.09, .75, .6, ge, s*.5, -.1, -.15, eg); ell(.05, .55, .42, lam(0xc9a9a6), s*.5, -.12, -.09, eg);
      ear.add(bake(eg)); ear.position.set(s*.55, 2.5, 1.3); E.add(ear); anims.push(t => { ear.rotation.y = s*(.35 + Math.sin(t*1.3 + s)*.28); }); });
    { let y = 0, z = 0; for (let k = 0; k < 13; k++) { const r = .27 - k*.014; ell(r, r, r, ge, 0, y, z, tr, 10); if (k < 8) { y -= r*.75; z += .03; } else { y -= r*.3; z += r*.7; } } }
    trunk.add(bake(tr)); trunk.position.set(0, 2.2, 2.1); E.add(trunk); anims.push(t => { trunk.rotation.x = Math.sin(t*.9)*.2 - .05; trunk.rotation.z = Math.sin(t*.6)*.08; });
    return E;
}
function mkLion() {
    const tan = lam(0xdba54a), mane = lam(0x9a5a1e), cr = lam(0xf3ddb0), L = new T.Group(), ls = new T.Group(), hd = new T.Group(), hg = new T.Group(), tail = new T.Group(), tg = new T.Group();
    ell(.45, .38, .9, tan, 0, .4, 0, ls); [-1, 1].forEach(s => { ell(.13, .1, .32, tan, s*.25, .12, .95, ls); ell(.16, .18, .3, tan, s*.36, .22, -.5, ls); });
    L.add(bake(ls));
    ell(.56, .56, .42, mane, 0, 0, 0, hg); ell(.34, .34, .3, tan, 0, 0, .25, hg); ell(.17, .13, .15, cr, 0, -.09, .5, hg); ell(.06, .045, .04, M.dark, 0, -.02, .63, hg, 8);
    [-1, 1].forEach(s => { ell(.1, .1, .06, tan, s*.3, .34, .1, hg, 8); ell(.04, .045, .03, M.dark, s*.13, .08, .52, hg, 8); });
    hd.add(bake(hg)); hd.position.set(0, .82, .78); L.add(hd);
    const tc = cone(.035, .03, 1, tan, 0, .5, 0, tg, 5); ell(.09, .13, .09, mane, 0, 1.05, 0, tg, 8); tail.add(bake(tg)); tail.position.set(0, .45, -.85); tail.rotation.x = -1; L.add(tail);
    anims.push(t => { hd.rotation.y = Math.sin(t*.5)*.5; tail.rotation.z = Math.sin(t*2.2)*.35; });
    return L;
}
function mkPenguin() {
    const bk = lam(0x1f2328), wh = lam(0xfafafa), og = lam(0xf29a1f), pg = new T.Group();
    ell(.2, .33, .2, bk, 0, .36, 0, pg); ell(.16, .27, .12, wh, 0, .33, .1, pg); ell(.15, .15, .15, bk, 0, .74, 0, pg); ell(.09, .08, .05, wh, 0, .72, .12, pg, 8);
    const bkk = mesh(new T.ConeGeometry(.045, .16, 6), og, 0, .72, .2, pg); bkk.rotation.x = Math.PI/2;
    [-1, 1].forEach(s => { ell(.04, .2, .1, bk, s*.21, .38, 0, pg, 8); ell(.08, .03, .12, og, s*.09, .03, .07, pg, 8); ell(.022, .022, .022, wh, s*.06, .78, .13, pg, 6); });
    const tp = bake(pg);
    const g = new T.Group(), c = cloneTpl(tp, true); g.add(c); anims.push(t => { c.rotation.z = Math.sin(t*4.5)*.13; }); return g;
}
