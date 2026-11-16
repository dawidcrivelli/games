// broń biała i pociski — tylko: piraci
// wymaga z gry: T, PI, G, cg, mesh, ball, box, M
'use strict';
// płaskie ostrze z obrysu [[x,y]...] (grubość w z)
function bladeGeo(pts, th) { const s = new T.Shape(); pts.forEach((q, i) => s[i ? 'lineTo' : 'moveTo'](q[0], q[1])); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth:th, bevelEnabled:true, bevelThickness:th*.45, bevelSize:.012, bevelSegments:1 }); g.translate(0, 0, -th/2); return g; }
// broń: rękojeść w (0,0,0), ostrze wzdłuż +y, „przód” (krawędź tnąca) w +x
function mkWeapon(id) { const g = new T.Group(), st = M(0xdfe6ee, { metalness:.65, roughness:.28 }), go = M(0xffc93c, { metalness:.5, roughness:.35 }), wd = M(0x8a5a2b), gr = M(0x6b7480, { metalness:.5, roughness:.4 }), lt = M(0x3b2414), rd = M(0xb02a2a);
  const grip = (m, l) => mesh(cg(.045, .05, l || .34, 8), m || lt, g, 0, 0, 0);
  if (id === 'wood') { grip(wd); box(wd, g, 0, .2, 0, .36, .07, .09); mesh(bladeGeo([[-.07, .22], [.07, .22], [.07, 1.35], [0, 1.52], [-.07, 1.35]], .05), M(0xc9975a), g); }
  else if (id === 'saber') { grip(); ball(go, g, 0, -.2, 0, .06); const pts = [], n = 10; for (let i = 0; i <= n; i++) { const t = i/n; pts.push([.075 + t*t*.3 - t*.02, .2 + t*1.3]); } for (let i = n; i >= 0; i--) { const t = i/n; pts.push([-.06 + t*t*.36 + (t > .8 ? (t - .8)*.5 : 0), .2 + t*1.3]); }
    mesh(bladeGeo(pts, .03), st, g); const b = mesh(new T.TorusGeometry(.17, .022, 5, 12, PI), go, g, .0, .02, 0); b.rotation.z = -PI/2; box(go, g, 0, .19, 0, .3, .05, .08); }
  else if (id === 'sword') { grip(rd, .4); ball(go, g, 0, -.24, 0, .075); box(go, g, 0, .2, 0, .52, .06, .08); for (const s of [1, -1]) ball(go, g, s*.27, .2, 0, .05);
    mesh(bladeGeo([[-.085, .23], [.085, .23], [.075, 1.45], [0, 1.68], [-.075, 1.45]], .035), st, g); box(gr, g, 0, .8, 0, .025, 1.05, .05); }
  else if (id === 'katana') { grip(M(0x15151a), .5); for (let i = 0; i < 4; i++) box(rd, g, 0, -.18 + i*.11, 0, .11, .025, .11).rotation.y = PI/4; mesh(cg(.14, .14, .03, 10), go, g, 0, .27, 0);
    const pts = [], n = 10; for (let i = 0; i <= n; i++) { const t = i/n; pts.push([.045 - t*t*.16, .29 + t*1.45]); } pts.push([-.2, 1.78]); for (let i = n; i >= 0; i--) { const t = i/n; pts.push([-.035 - t*t*.17, .29 + t*1.45]); }
    mesh(bladeGeo(pts, .022), st, g); }
  else if (id === 'rapier') { grip(); ball(go, g, 0, -.2, 0, .055); const c = mesh(new T.SphereGeometry(.17, 12, 6, 0, PI*2, 0, PI/2), go, g, 0, .2, 0); c.rotation.x = PI; mesh(cg(.01, .03, 1.85, 6), st, g, 0, 1.13, 0);
    const b = mesh(new T.TorusGeometry(.19, .016, 5, 12, PI), go, g, 0, 0, 0); b.rotation.z = -PI/2; }
  else if (id === 'axe') { mesh(cg(.045, .055, 1.5, 8), wd, g, 0, .55, 0); for (const y of [-.15, .1, .95]) mesh(cg(.06, .06, .05, 8), lt, g, 0, y, 0);
    const pts = [[.03, 1.0], [.2, .92]]; for (let i = 0; i <= 8; i++) { const a = -.75 + i*1.5/8; pts.push([.2 + Math.cos(a)*.36, 1.13 + Math.sin(a)*.5]); } pts.push([.2, 1.34], [.03, 1.26]);
    mesh(bladeGeo(pts, .05), st, g); mesh(bladeGeo([[-.03, 1.04], [-.03, 1.22], [-.3, 1.13]], .04), st, g); box(gr, g, 0, 1.13, 0, .13, .3, .1); mesh(G.cone, st, g, 0, 1.42, 0, .04, .22, .04); }
  else if (id === 'bow') { const r = .82, a = mesh(new T.TorusGeometry(r, .035, 6, 18, PI*.74), wd, g, -r + .05, 0, 0); a.rotation.z = -PI*.37; mesh(cg(.05, .05, .26, 8), rd, g, .05, 0, 0);
    const ey = Math.sin(PI*.37)*r, ex = -r + .05 + Math.cos(PI*.37)*r; mesh(cg(.008, .008, ey*2, 4), M(0xf4f1e6), g, ex, 0, 0); for (const s of [1, -1]) ball(go, g, ex, s*ey, 0, .045);
    const ar = mkArrow(); ar.position.x = ex + .55; g.add(ar); g.userData.arrow = ar; }
  else if (id === 'anchor') { mesh(cg(.06, .06, 1.5, 8), gr, g, 0, .9, 0); mesh(new T.TorusGeometry(.13, .035, 5, 10), gr, g, 0, .22, 0); box(gr, g, 0, .5, 0, .6, .08, .08);
    const t = mesh(new T.TorusGeometry(.44, .075, 6, 14, PI), gr, g, 0, 1.7, 0); t.rotation.z = 0; for (const s of [1, -1]) mesh(G.cone, gr, g, s*.46, 1.82, 0, .14, .32, .1).rotation.z = s*.45; }
  else if (id === 'trident') { mesh(cg(.045, .045, 1.5, 8), go, g, 0, .85, 0); ball(go, g, 0, .08, 0, .07); box(go, g, 0, 1.5, 0, .64, .07, .07);
    for (const s of [-1, 0, 1]) { mesh(cg(.035, .04, .32, 6), go, g, s*.28, 1.66 + (s ? 0 : .06), 0); mesh(G.cone, go, g, s*.28, 1.95 + (s ? 0 : .12), 0, .075, .3, .05); } }
  else { const bl = M(0x3f8fd6); ball(bl, g, 0, .72, 0, .15, .5, .11); ball(M(0xe8f4ff), g, .06, .7, 0, .1, .42, .09); mesh(G.cone, M(0xcfd8e0), g, 0, 1.75, 0, .035, 1.15, .035);
    for (const s of [1, -1]) mesh(G.cone, bl, g, s*.14, .2, 0, .07, .36, .03).rotation.z = PI + s*-.5; mesh(G.cone, bl, g, -.2, .8, 0, .05, .4, .03).rotation.z = 1.1; ball(M(0x111111), g, .11, 1.05, .08, .03); }
  return g; }
// strzała wzdłuż +x (grot w +x), środek w 0
function mkArrow() { const g = new T.Group(); mesh(cg(.014, .014, 1.1, 5), M(0xc9975a), g, 0, 0, 0).rotation.z = PI/2; mesh(G.cone, M(0xaab2bd), g, .6, 0, 0, .04, .14, .04).rotation.z = -PI/2;
  for (const r of [0, PI/2]) box(M(0xe2483d), g, -.47, 0, 0, .18, .09, .012).rotation.x = r; return g; }
function starGeo() { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i/10*PI*2, r = i % 2 ? .2 : .5; s[i ? 'lineTo' : 'moveTo'](Math.cos(a)*r, Math.sin(a)*r); } s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth:.14, bevelEnabled:true, bevelThickness:.05, bevelSize:.05, bevelSegments:1 }); g.translate(0, 0, -.07); return g; }
function mkStar() { return new T.Mesh(mkStar.g || (mkStar.g = starGeo()), M(0xff7a3d, { roughness:.6 })); }
