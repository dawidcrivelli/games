// Rośliny ogródka w stylu „słodziaków”: rosną, więdną gryzione, trzęsą się ze strachu. Obiekt globalny PLANTS.
// p = PLANTS.make(rodzaj) — 'carrot' marchewka, 'cabbage' kapusta, 'sunflower' słonecznik (z buzią), 'onion' cebula, 'garlic' czosnek,
//   'thorns' kolczasty krzak jeżyn, 'tree' jabłonka (sadzonka → drzewo z jabłkami). p.g → Group (środek na ziemi, przód +z).
// PLANTS.set(p, wzrost 0..1, życie 0..1) — wzrost: kiełek → dojrzała; życie: gryziona traci liście, brązowieje, oklapuje, owoc maleje.
// PLANTS.anim(p, t, dt) — kołysanie, dojrzała podskakuje (p.ripe), p.fear 0..1 — drży ze strachu.
// Krajobraz (wspólne materiały, bez stanu): PLANTS.pine(), PLANTS.leafy(), PLANTS.bush() → Group.
// Drobiazgi: PLANTS.seed() — ziarenko słonecznika (do zbierania), PLANTS.apple() — jabłko, PLANTS.basket(pełny) — wiklinowy kosz.
// wymaga: models/animals.js (ZOO: pomocniki brył)
'use strict';
const PLANTS = (() => {
const { M, cg, mesh, ball, box, grp, flat, G, mK, mW, merge } = ZOO;
const T = THREE, PI = Math.PI, BROWN = new T.Color(0x9a7a3a);
const own = c => new T.MeshStandardMaterial({ color: c, roughness: .7 });   // materiał tej jednej rośliny (barwienie przy gryzieniu)
let spikes = null;

function leafG(par, x, y, z, ry, tilt) { const l = grp(par, x, y, z); l.rotation.order = 'YZX'; l.rotation.y = ry; l.rotation.z = tilt; l.userData.tilt = tilt; return l; }

const BUILD = {
  carrot(p) {
    const or = own(0xff8a1e), lf = own(0x4fae3a); p.mats.push([or, .5], [lf, 1]);
    const root = grp(p.g, 0, 0, 0); p.fruit.push(root);
    mesh(cg(.2, .03, .8, 12), or, root, 0, -.02, 0); ball(or, root, 0, .38, 0, .2, .08, .2);
    for (let i = 0; i < 4; i++) box(own(0xd96a10), root, 0, .15 - i*.15, 0, .37 - i*.08, .015, .37 - i*.08).rotation.y = i;
    for (let i = 0; i < 6; i++) { const l = leafG(p.g, 0, .4, 0, i*PI/3 + .3, .3 + (i % 2)*.2); p.leaves.push(l);
      mesh(cg(.018, .028, .75, 5), lf, l, 0, .37, 0); for (let k = 0; k < 4; k++) ball(lf, l, (k % 2 ? .08 : -.08), .3 + k*.15, 0, .12, .05, .07).rotation.z = k % 2 ? -.6 : .6; }
  },
  cabbage(p) {
    const hd = own(0xa6d877), lf = own(0x5fb043), vein = M(0xe8f6c8); p.mats.push([hd, .6], [lf, 1]);
    const head = grp(p.g, 0, 0, 0); p.fruit.push(head);
    ball(hd, head, 0, .42, 0, .43, .4, .43);
    for (let i = 0; i < 5; i++) { const q = grp(head, 0, .42, 0); q.rotation.y = i*1.26; const w = ball(hd, q, .3, -.02, 0, .2, .36, .34); w.rotation.z = -.25; }
    for (let i = 0; i < 4; i++) box(vein, head, 0, .42, 0, .87, .015, .03).rotation.set(0, i*.8, 1.2 + i*.2);
    for (let i = 0; i < 8; i++) { const l = leafG(p.g, 0, .18, 0, i*PI/4 + .2, -.45 - (i % 2)*.15); p.leaves.push(l);
      ball(lf, l, .45, 0, 0, .42, .06, .3); box(vein, l, .45, .05, 0, .6, .015, .03); }
  },
  sunflower(p) {
    const st = own(0x58a83a), pe = own(0xffcf1f), dk = own(0x6a3a1a); p.mats.push([st, 1], [pe, .6], [dk, .4]);
    mesh(cg(.05, .07, 1.9, 8), st, p.g, 0, .95, 0);
    const lg = flat('pl_sfL', [[0, 0], [.22, .12], [.42, .06], [.5, -.04], [.3, -.14], [.1, -.08]], .03, .01);
    for (let i = 0; i < 4; i++) { const l = leafG(p.g, 0, .45 + i*.33, 0, i*2.2 + .5, -.25); p.leaves.push(l); mesh(lg, st, l).scale.setScalar(1.1 - i*.12); }
    const h = grp(p.g, 0, 1.95, .08); p.fruit.push(h); h.rotation.x = .25;
    mesh(cg(.36, .36, .12, 22), dk, h, 0, 0, 0).rotation.x = PI/2;
    for (let i = 0; i < 16; i++) { const q = grp(h, 0, 0, 0); q.rotation.z = i/16*PI*2; const l = ball(pe, q, 0, .52, i % 2 ? -.02 : .02, .13, .25, .04); p.leaves.push(q); q.userData.tilt = q.rotation.z; q.userData.petal = 1; }
    for (const s of [1, -1]) { ball(mK, h, s*.12, .07, .07, .05, .065, .03); ball(mW, h, s*.12 + .015, .09, .095, .015); ball(M(0xff8a7a), h, s*.21, -.05, .065, .05, .03, .02); }
    const sm = mesh(new T.TorusGeometry(.1, .018, 6, 14, PI), mK, h, 0, -.04, .07); sm.rotation.z = PI;
    p.face = h;
  },
  onion(p, garlic) {
    const bu = own(garlic ? 0xf6f1e4 : 0xd9864a), lf = own(garlic ? 0x8fcf6a : 0x5fb84a), ln = M(garlic ? 0xd8cdb8 : 0xa8582a); p.mats.push([bu, .5], [lf, 1]);
    const b = grp(p.g, 0, 0, 0); p.fruit.push(b);
    if (garlic) { for (let i = 0; i < 6; i++) { const q = grp(b, 0, .26, 0); q.rotation.y = i*1.05; ball(bu, q, .1, 0, 0, .16, .24, .14); } ball(bu, b, 0, .26, 0, .2, .25, .2); }
    else { ball(bu, b, 0, .27, 0, .32, .3, .32); for (let i = 0; i < 4; i++) box(ln, b, 0, .27, 0, .01, .58, .66).rotation.y = i*.8; }
    mesh(G.cone, bu, b, 0, .6, 0, .12, .2, .12);
    for (let i = 0; i < 5; i++) { const l = leafG(p.g, 0, .62, 0, i*1.25, .12 + (i % 2)*.12); p.leaves.push(l); mesh(cg(.02, .05, 1.1, 6), lf, l, 0, .55, 0); }
  },
  thorns(p) {
    const bu = own(0x3f7e3a), bu2 = own(0x4f9442), th = M(0xa8553a, { roughness: .5 }), be = M(0x3a1640, { roughness: .3 }), red = M(0xd8304a, { roughness: .3 }); p.mats.push([bu, 1], [bu2, 1]);
    if (!spikes) { const ps = []; for (let i = 0; i < 60; i++) { const a = i*2.399, yy = 1 - (i/59)*1.6, r = Math.sqrt(Math.max(0, 1 - yy*yy)), n = new T.Vector3(Math.cos(a)*r, yy, Math.sin(a)*r);
        const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), n), e = new T.Euler().setFromQuaternion(q);
        ps.push({ g: G.cone, p: [n.x*.62, .45 + n.y*.45, n.z*.62], s: [.05, .18, .05], r: [e.x, e.y, e.z] }); } spikes = merge(ps); }
    const parts = [[0, .45, 0, .55, .45, .55], [.35, .32, .15, .38, .32, .38], [-.35, .34, -.1, .4, .34, .4], [.05, .3, .4, .36, .3, .36], [-.1, .32, -.42, .36, .3, .36], [.2, .72, -.05, .32, .26, .32], [-.22, .65, .18, .3, .25, .3]];
    parts.forEach((q, i) => { const l = grp(p.g, q[0], q[1], q[2]); l.userData.tilt = 0; ball(i % 2 ? bu2 : bu, l, 0, 0, 0, q[3], q[4], q[5]); p.leaves.push(l); });
    mesh(spikes, th, p.g);
    const fr = grp(p.g, 0, 0, 0); p.fruit.push(fr);
    for (let i = 0; i < 7; i++) { const a = i*.9, y = .45 + Math.sin(i*1.7)*.3, r = .56*Math.sqrt(1 - ((y - .45)/.5)**2) + .04;
      const c = grp(fr, Math.cos(a)*r, y, Math.sin(a)*r); for (let k = 0; k < 4; k++) ball(i % 3 ? be : red, c, (k % 2)*.05 - .025, (k >> 1)*.05, .02, .045); }
  },
  tree(p) {
    const tr = own(0x8a5a32), lf = own(0x4fa83e), lf2 = own(0x68c050), ap = M(0xe2352c, { roughness: .35 }), apL = M(0x6a3a1a); p.mats.push([lf, 1], [lf2, 1], [tr, .3]);
    mesh(cg(.12, .2, 1.7, 9), tr, p.g, 0, .85, 0);
    for (const [x, y, z, r] of [[0, 2.1, 0, .85], [.55, 1.85, .2, .6], [-.55, 1.9, -.1, .62], [.1, 2.55, -.2, .62], [-.2, 2.3, .45, .55], [.35, 2.4, -.45, .5]]) {
      const l = grp(p.g, x, y, z); l.userData.tilt = 0; ball(r > .6 ? lf : lf2, l, 0, 0, 0, r, r*.9, r); p.leaves.push(l); }
    const fr = grp(p.g, 0, 0, 0); p.fruit.push(fr);
    for (let i = 0; i < 9; i++) { const a = i*2.1, y = 1.7 + (i % 3)*.35, r = .8 + (i % 2)*.1; const c = grp(fr, Math.cos(a)*r, y, Math.sin(a)*r + .15);
      ball(ap, c, 0, 0, 0, .13); mesh(cg(.01, .012, .08, 4), apL, c, 0, .14, 0); }
  },
};
BUILD.garlic = p => BUILD.onion(p, true);

function make(kind) {
  const p = { kind, g: new T.Group(), leaves: [], fruit: [], mats: [], grow: -1, hp: -1, ripe: false, fear: 0, t: Math.random()*9 };
  BUILD[kind](p);
  p.mats.forEach(m => m.push(m[0].color.clone()));
  p.g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  set(p, 0, 1); return p;
}
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x*x*(3 - 2*x);
function set(p, grow, hp) {
  if (Math.abs(grow - p.grow) < .004 && Math.abs(hp - p.hp) < .004) return;
  p.grow = grow; p.hp = hp;
  const tree = p.kind === 'tree', base = tree ? .22 + .78*ease(grow) : .25 + .75*ease(grow/.8);
  p.g.scale.setScalar(base);
  const fk = tree ? (grow >= 1 ? 1 : 0) : ease((grow - .35)/.6);
  p.fruit.forEach(f => { f.visible = fk > .02; f.scale.setScalar(Math.max(.02, fk)*(.55 + .45*hp)); });
  const keep = Math.ceil(p.leaves.length*(.25 + .75*hp));
  p.leaves.forEach((l, i) => { const order = (i*7) % p.leaves.length; l.visible = order < keep; });   // znikają liście „na wyrywki”
  const k = (1 - hp)*.8; p.mats.forEach(([m, w, c0]) => m.color.copy(c0).lerp(BROWN, k*w));
  p.droop = 1 - hp;
}
function anim(p, t, dt) {
  p.t += dt; const sway = Math.sin(p.t*1.6)*.04, shake = p.fear > 0 ? Math.sin(p.t*45)*.06*p.fear : 0;
  p.leaves.forEach((l, i) => { if (l.userData.petal) return; l.rotation.z = l.userData.tilt + sway*(i % 2 ? 1 : -1) + (p.droop || 0)*.7*Math.sign(l.userData.tilt || 1) + shake; });
  p.g.rotation.z = shake*.5;
  const hop = p.ripe ? Math.abs(Math.sin(p.t*4))*.12 : 0; p.g.position.y = hop*(p.kind === 'tree' ? 0 : 1);
  if (p.face) p.face.rotation.y = Math.sin(p.t*.7)*.2;
}

// ---------- krajobraz: sosna, drzewo liściaste, krzak (wspólne materiały)
function pine() { const g = new T.Group(), tr = M(0x7a4e2c), n1 = M(0x2f6e3a), n2 = M(0x3c8446);
  mesh(cg(.16, .24, 1.4, 8), tr, g, 0, .7, 0); for (let i = 0; i < 4; i++) mesh(G.cone, i % 2 ? n1 : n2, g, 0, 1.4 + i*.85, 0, 1.5 - i*.3, 1.6, 1.5 - i*.3);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function leafy() { const g = new T.Group(), tr = M(0x8a5a32), l1 = M(0x4c9a3a), l2 = M(0x5fb048), l3 = M(0x3f8a34);
  mesh(cg(.2, .3, 2.2, 9), tr, g, 0, 1.1, 0); [[0, 2.9, 0, 1.3, l1], [.9, 2.5, .3, .9, l2], [-.9, 2.6, -.2, 1, l3], [.2, 3.6, .3, .8, l2]].forEach(([x, y, z, r, m]) => ball(m, g, x, y, z, r, r*.9, r));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function bush() { const g = new T.Group(), l1 = M(0x4c9a3a), l2 = M(0x5fb048);
  [[0, .4, 0, .6], [.5, .3, .2, .42], [-.5, .32, -.1, .45], [.1, .3, .5, .4]].forEach(([x, y, z, r], i) => ball(i % 2 ? l2 : l1, g, x, y, z, r, r*.85, r));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }

function seed() { const g = new T.Group(), s = grp(g, 0, 0, 0); s.rotation.z = .5; ball(M(0x3a2c26, { roughness: .35 }), s, 0, 0, 0, .16, .3, .1);
  for (const x of [-.06, .06]) ball(M(0xf4efe0, { roughness: .4 }), s, x, 0, .07, .025, .24, .04); ball(M(0xfff3a8), s, -.05, .12, .08, .03, .06, .02); return g; }
function apple() { const g = new T.Group(); ball(M(0xe2352c, { roughness: .35 }), g, 0, 0, 0, .3, .28, .3); mesh(cg(.02, .025, .16, 5), M(0x6a3a1a), g, 0, .3, 0);
  const l = ball(M(0x58a83a), g, .1, .34, 0, .12, .03, .06); l.rotation.z = -.4; ball(M(0xffffff, { roughness: .2 }), g, -.12, .12, .2, .06, .08, .04); return g; }
function basket(full) { const g = new T.Group(), wk = M(0xc8904a, { roughness: .9 }), wd = M(0x9a6630, { roughness: .9 });
  mesh(cg(.62, .46, .55, 16), wk, g, 0, .28, 0); mesh(cg(.57, .57, .02, 16), M(0x5a3a1a), g, 0, .555, 0);
  for (let i = 0; i < 3; i++) mesh(cg(.63 - i*.07, .63 - i*.07, .04, 16), wd, g, 0, .1 + i*.18, 0);
  const h = mesh(new T.TorusGeometry(.55, .05, 6, 20, PI), wd, g, 0, .55, 0);
  if (full) { [[0xff8a1e, -.2, .1], [0xbfe58a, .2, -.05], [0xe2352c, 0, .25], [0xd9864a, .25, .22], [0xff8a1e, -.25, -.22]].forEach(([c, x, z]) => ball(M(c), g, x, .58, z, .2)); }
  return g; }
return { make, set, anim, pine, leafy, bush, seed, apple, basket, KINDS: Object.keys(BUILD) };
})();
