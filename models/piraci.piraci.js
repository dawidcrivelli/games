// piraci (ludziki, czapki, opaski, wojownicy) — tylko: piraci
// wymaga z gry: T, PI, G, cg, mergeC, grp, clamp, rnd, MK, M, MVC, mkWeapon
'use strict';
function lo8() { return lo8.g || (lo8.g = new T.SphereGeometry(1, 9, 7)); }
// czapka piracka: 0 trójgraniasta, 1 kapitańska (dwurożna z czaszką), 2 marynarska pończocha z pomponem. Rondo ~1 szer., spód w y=0, przód +x
function mkHat(style, col) { const p = [], bk = col || 0x1d1d24, go = 0xffc93c, wh = 0xf4f1e6, S = lo8();
  if (style === 2) { const a = col || 0xd63b3b; p.push({ g:cg(.33, .33, .1, 12), p:[0, .05, 0], c:wh });
    for (let i = 0; i < 5; i++) p.push({ g:cg(.3 - i*.045 - .04, .3 - i*.045, .1, 12), p:[-i*i*.012, .15 + i*.095, 0], c:i % 2 ? wh : a });
    p.push({ g:S, p:[-.3, .56, 0], s:[.13, .1, .1], r:[0, 0, .6], c:a }, { g:S, p:[-.42, .47, 0], s:.1, c:wh }); }
  else if (style === 1) { p.push({ g:S, p:[0, .12, 0], s:[.3, .26, .3], c:bk });
    for (const s of [1, -1]) { p.push({ g:S, p:[s*.17, .27, 0], s:[.07, .34, .68], r:[0, 0, -s*.32], c:bk }, { g:new T.TorusGeometry(.5, .028, 4, 12, PI), p:[s*.21, .18, 0], s:[1.32, .92, 1], r:[0, PI/2, 0], c:go }); }
    p.push({ g:S, p:[.27, .33, 0], s:[.05, .1, .1], c:wh }, { g:G.box, p:[.265, .22, 0], s:[.04, .07, .09], c:wh });
    for (const s of [1, -1]) p.push({ g:G.box, p:[.25, .25, 0], s:[.03, .035, .34], r:[s*.6, 0, 0], c:wh }, { g:S, p:[.3, .34, s*.035], s:.022, c:0x111111 }); }
  else { p.push({ g:cg(.6, .6, .05, 3), p:[0, .03, 0], r:[0, PI/2, 0], c:bk }, { g:S, p:[0, .12, 0], s:[.3, .25, .3], c:bk }, { g:cg(.305, .305, .05, 12), p:[0, .1, 0], c:go });
    for (let i = 0; i < 3; i++) { const a = PI/3 + i*2*PI/3 + PI/2, x = Math.sin(a)*.33, z = Math.cos(a)*.33;
      p.push({ g:G.box, p:[x, .16, z], s:[.92, .26, .05], r:[0, a, 0], c:bk }, { g:G.box, p:[x*1.02, .29, z*1.02], s:[.9, .035, .06], r:[0, a, 0], c:go }); }
    p.push({ g:S, p:[.3, .22, 0], s:[.05, .08, .08], c:wh }, { g:G.cone, p:[-.1, .5, .26], s:[.05, .55, .1], r:[.45, 0, .25], c:0xe2483d }); }
  return new T.Mesh(mergeC(p), MVC); }
// czapka + opaska na oko dla zwierzaka z ZOO (a = MK.x(), jeszcze bez rodzica; głowa +x). side: po której stronie (z) opaska
function pirateGear(a, side, style) { if (!a.head) return; const top = a.root; top.updateMatrixWorld(true);
  const b = new T.Box3().setFromObject(a.head), c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3()), hq = a.head.getWorldQuaternion(new T.Quaternion()).invert(), ws = a.head.getWorldScale(new T.Vector3()).x;
  const mx = a.dims.h*.42, w = clamp(Math.min(sz.x, sz.z)*.95, mx*.7, mx*1.15), hat = mkHat(style);
  let hx = c.x, hy = b.max.y - sz.y*.1, e = null;
  for (const q of a.eyes || []) { const z = q.getWorldPosition(new T.Vector3()).z*side; if (!e || z > e.z) e = { q, z }; }
  if (e) { const q = e.q, ep = q.getWorldPosition(new T.Vector3()), r = q.children[0].getWorldScale(new T.Vector3()).x, par = q.parent, ps = par.getWorldScale(new T.Vector3()).x, bk = M(0x15151a);
    hx = clamp(ep.x - r*1.2, c.x - sz.x*.2, c.x + sz.x*.25); q.visible = false;
    const pm = new T.Mesh(lo8(), bk); pm.position.copy(par.worldToLocal(ep.clone().add(new T.Vector3(r*.25, 0, side*r*.3)))); pm.scale.set(r*.75/ps, r*1.5/ps, r*1.4/ps); pm.quaternion.copy(par.getWorldQuaternion(new T.Quaternion()).invert()); par.add(pm);
    // pasek: pierścień przez oko, ukośnie przez czoło
    const R = Math.min(sz.y, sz.z)*.5, cc = new T.Vector3(ep.x - R*.2, ep.y - R*.55, c.z), d = ep.clone().sub(cc), rad = d.length(); d.normalize();
    const n = new T.Vector3().crossVectors(d, new T.Vector3(-.75, .65, 0).normalize()).normalize();
    const st = new T.Mesh(new T.TorusGeometry(rad, r*.2, 5, 22), bk); st.position.copy(a.head.worldToLocal(cc.clone())); st.scale.setScalar(1/ws);
    st.quaternion.copy(hq).multiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), n)); a.head.add(st); }
  hat.position.copy(a.head.worldToLocal(new T.Vector3(hx, hy, c.z))); hat.scale.setScalar(w/ws); hat.quaternion.copy(hq); a.head.add(hat); }
// zwierzak-pirat ustawiony przodem +z, wysokość h (jak ZOO.fit) — do stania na statku
function fitPirate(kind, h, side, style) { const a = MK[kind](); pirateGear(a, side, style); const g = new T.Group(), w = grp(g), k = h/a.dims.h; w.add(a.root); a.root.position.x = -a.cx; w.rotation.y = -PI/2; w.scale.setScalar(k); return { g, a, k }; }
// ludzik-pirat: przód +x, stopy y=0, wysokość ~2.05 (z czapką). opt: {side: strona opaski (+1/-1), arm: false = bez ręki po stronie side (dorabia ją mkFighter)}
function mkHuman(kind, opt) { opt = opt || {}; const HUM = {
    human:{ coat:0xd63b3b, pants:0x2b3a67, skin:0xf2c39a, hair:0x6b3f1c, stripe:0xffffff, hat:2, hatC:0xd63b3b, smile:1 },
    majtek:{ coat:0x2f6fb5, pants:0x3b2a1a, skin:0xe9b48a, hair:0x2b1d12, stripe:0xffffff, hat:2, hatC:0x2f6fb5, beard:1 },
    majtek2:{ coat:0x3a3f47, pants:0x6b4424, skin:0xc98f62, hair:0x111116, stripe:0xf2d99a, hat:0, smile:1 },
    rudy:{ coat:0x2f8f4e, pants:0x3b2a1a, skin:0xf0b890, hair:0xe0701c, beard:2, hat:0, sash:0xe2483d },
    baska:{ coat:0x7a3fa8, pants:0x222233, skin:0xf4cfae, hair:0x1b1b22, long:1, hat:0, ring:1, sash:0xffc93c, smile:1 },
    czarny:{ coat:0x23232b, pants:0x4a1f1f, skin:0xd9a47c, hair:0x111116, beard:2, hat:1, peg:1, hook:1, epau:1, sash:0xb02a2a } },
    o = HUM[kind] || HUM.human, sd = opt.side || 1, S = lo8(), p = [], hp = [], bk = 0x1d1d24, go = 0xffc93c, wh = 0xf4f1e6;
  // nogi, buty
  for (const s of [1, -1]) { if (o.peg && s === -sd) { p.push({ g:cg(.1, .08, .2, 8), p:[0, .47, s*.13], c:o.pants }, { g:cg(.05, .032, .4, 6), p:[0, .2, s*.13], c:0x9a6b3c }); continue; }
    p.push({ g:cg(.105, .095, .36, 8), p:[0, .4, s*.13], c:o.pants }, { g:cg(.1, .11, .22, 8), p:[0, .13, s*.13], c:bk }, { g:cg(.13, .115, .07, 8), p:[0, .26, s*.13], c:0xa9773f }, { g:S, p:[.07, .06, s*.13], s:[.17, .07, .105], c:bk }); }
  // tułów
  if (o.stripe) for (let i = 0; i < 6; i++) p.push({ g:cg(.25 + (i > 3 ? -.03*(i - 3) : .015*i), .25 + .015*i - (i > 4 ? .03 : 0), .085, 10), p:[0, .6 + i*.085, 0], c:i % 2 ? o.stripe : o.coat });
  else { p.push({ g:S, p:[0, .86, 0], s:[.29, .34, .26], c:o.coat }, { g:cg(.25, .37, .36, 10), p:[0, .6, 0], c:o.coat }, { g:S, p:[.13, .9, 0], s:[.17, .26, .13], c:wh });
    for (let i = 0; i < 3; i++) p.push({ g:S, p:[.27 - i*.012, .95 - i*.11, .11], s:.028, c:go }, { g:S, p:[.27 - i*.012, .95 - i*.11, -.11], s:.028, c:go }); }
  p.push({ g:cg(.275, .285, .075, 10), p:[0, .6, 0], c:0x3b2414 }, { g:G.box, p:[.27, .6, 0], s:[.05, .1, .12], c:go });
  if (o.sash) p.push({ g:cg(.285, .28, .09, 10), p:[0, .69, 0], c:o.sash }, { g:G.box, p:[.05, .52, -sd*.28], s:[.08, .3, .05], r:[.2*sd, 0, 0], c:o.sash });
  p.push({ g:cg(.085, .1, .12, 8), p:[0, 1.13, 0], c:o.skin });
  for (const s of [1, -1]) { p.push({ g:S, p:[0, 1.03, s*.27], s:o.epau ? [.13, .06, .12] : [.105, .1, .1], c:o.epau ? go : o.coat });
    if (opt.arm === false && s === sd) continue;
    p.push({ g:cg(.075, .07, .36, 7), p:[.02, .85, s*.36], r:[s*.22, 0, .1], c:o.coat }, { g:cg(.085, .085, .06, 7), p:[.04, .69, s*.4], r:[s*.22, 0, .1], c:wh });
    if (o.hook && s === -sd) p.push({ g:cg(.07, .05, .08, 6), p:[.045, .63, s*.41], c:0x3b2414 }, { g:new T.TorusGeometry(.07, .022, 5, 10, PI*1.4), p:[.05, .53, s*.41], r:[0, 0, 2.2], c:0xaab2bd });
    else p.push({ g:S, p:[.045, .61, s*.41], s:.085, c:o.skin }); }
  // głowa (osobna siatka, środek w 0)
  hp.push({ g:S, p:[0, 0, 0], s:.25, c:o.skin }, { g:S, p:[.25, -.035, 0], s:[.065, .055, .055], c:o.skin });
  for (const s of [1, -1]) { hp.push({ g:S, p:[-.01, -.01, s*.245], s:[.05, .07, .035], c:o.skin });
    if (s !== sd) hp.push({ g:S, p:[.2, .05, s*.105], s:[.045, .06, .055], c:wh }, { g:S, p:[.235, .05, s*.112], s:.03, c:0x15110e }, { g:G.box, p:[.225, .125, s*.11], s:[.03, .025, .1], r:[s*.25, 0, 0], c:o.hair });
    if (o.ring && s !== sd) hp.push({ g:new T.TorusGeometry(.045, .012, 4, 10), p:[-.01, -.11, s*.25], c:go }); }
  hp.push({ g:S, p:[.218, .05, sd*.108], s:[.035, .078, .075], c:bk }, { g:new T.TorusGeometry(.254, .016, 4, 20), p:[0, .075, 0], r:[PI/2 - sd*.42, 0, 0], c:bk });
  if (o.beard) { hp.push({ g:S, p:[.09, -.17, 0], s:[.2, o.beard > 1 ? .24 : .17, .215], c:o.hair }); for (const s of [1, -1]) hp.push({ g:S, p:[.235, -.085, s*.075], s:[.05, .035, .09], r:[s*.3, 0, 0], c:o.hair }); }
  else hp.push({ g:S, p:[.225, -.12, 0], s:[.03, o.smile ? .035 : .02, .085], c:0x9c3b34 });
  hp.push({ g:S, p:[-.06, .03, 0], s:[.235, .235, .255], c:o.hair }); if (o.long) hp.push({ g:S, p:[-.13, -.16, 0], s:[.19, .36, .28], c:o.hair });
  const root = new T.Group(), body = grp(root); body.add(new T.Mesh(mergeC(p), MVC));
  const head = grp(body, 0, 1.38, 0); head.add(new T.Mesh(mergeC(hp), MVC)); const hat = mkHat(o.hat, o.hatC); hat.position.set(-.02, .16, 0); hat.scale.setScalar(.76); head.add(hat);
  return { root, body, head, human:true, coat:o.coat, skin:o.skin, dims:{ h:2.05, len:.7, hw:.32 }, cx:0, t:rnd(9) }; }
// wojownik do pojedynku: side +1 patrzy w +x (gracz), -1 w -x (wróg); kamera z +z
function mkFighter(kind, side, weapon) { const g = new T.Group(), body = grp(g); let a, k, arm = null;
  if (MK[kind]) { a = MK[kind](); pirateGear(a, side, kind === 'penguin' || kind === 'panda' ? 2 : kind === 'lion' || kind === 'elephant' || kind === 'hippo' ? 1 : 0); k = Math.min(3/a.dims.h, 3.8/a.dims.len); const w = grp(body); w.scale.setScalar(k); w.add(a.root); a.root.position.x = -a.cx; }
  else { a = mkHuman(kind, { side, arm:false }); k = 2.8/1.9; a.root.scale.setScalar(k); body.add(a.root);
    arm = new T.Mesh(cg(.07, .085, 1, 7).clone().translate(0, .5, 0), M(a.coat)); arm.scale.set(k, 1, k); g.add(arm); }
  const h = a.dims.h*k, len = a.dims.len*k, sw = grp(g); sw.add(mkWeapon(weapon)); const hand = new T.Mesh(lo8(), M(a.human ? a.skin : 0x3b2414)); hand.scale.setScalar(.15); sw.add(hand);
  if (side < 0) g.rotation.y = PI;
  return { g, body, a, sw, arm, sh:new T.Vector3(0, 1.03*k, side*.27*k), h, len, side, swx:len*.28 + .1, swz:side*(a.dims.hw*k + .28), bx:-side*(1.25 + len/2), lx:0, py:.7, rz:-.4, px:0, tilt:0, st:'idle', t:0, guard:'hi', atk:'hi', en:0, kind }; }
