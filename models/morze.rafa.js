// morze — wspólne dla: rafa
// wymaga z gry: C, K, M, SP, T, TAU, UP, V3, _m4, _q, ball, fishGeoC, fishMat, fl, flat, merge, mix3, mul3, setAT, sweep, tmpC
'use strict';
function fishGeo(o) {
  const L = o.L, h = o.h, w = o.w, hl = L/2, parts = [], taper = o.taper == null ? .35 : o.taper, nose = o.nose || 0;
  const k = zn => zn < 0 ? 1 - taper*(-zn) : 1 - nose*zn*zn;
  const body = new T.SphereGeometry(1, o.sw || 10, o.sh || 7); body.rotateX(Math.PI/2);
  const p = body.attributes.position, col = new Float32Array(p.count*3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), kk = k(z), c = o.col(z, y, x);
    col[i*3] = c[0]; col[i*3 + 1] = c[1]; col[i*3 + 2] = c[2]; p.setXYZ(i, x*w*kk, y*h*kk, z*hl); }
  body.setAttribute('color', new T.BufferAttribute(col, 3)); body.computeVertexNormals(); parts.push(body);
  const top = zn => h*Math.sqrt(Math.max(0, 1 - zn*zn))*k(zn);
  const fc = o.finC, fe = o.finE || o.finC, tl = o.tail || {}, tz = -hl*.9, ts = tl.s == null ? h*1.1 : tl.s, tlen = tl.l == null ? L*.28 : tl.l, r0 = top(-.9);
  let tp;
  if (tl.t === 'round') tp = [[tz, r0*.8], [tz - tlen*.55, ts], [tz - tlen*.92, ts*.6], [tz - tlen, 0], [tz - tlen*.92, -ts*.6], [tz - tlen*.55, -ts], [tz, -r0*.8]];
  else if (tl.t === 'shark') tp = [[tz, r0], [tz - tlen, ts*1.55], [tz - tlen*.45, .02], [tz - tlen*.7, -ts*.75], [tz, -r0]];
  else tp = [[tz, r0], [tz - tlen, ts], [tz - tlen*.5, 0], [tz - tlen, -ts], [tz, -r0]];
  { const tg = flat(tp, tl.c || fc, tl.e || fe); if (tl.fluke) tg.rotateZ(Math.PI/2); parts.push(tg); }
  if (o.dorsal) { const d = o.dorsal, pk = lerp(d.a, d.b, d.pk == null ? .35 : d.pk), q = lerp(pk, d.b, .55);
    parts.push(flat([[d.a*hl, top(d.a)*.8], [pk*hl, top(pk) + d.h], [q*hl, top(q) + d.h*.72], [d.b*hl, top(d.b)*.8]], d.c || fc, d.e || fe)); }
  if (o.anal) { const d = o.anal, pk = lerp(d.a, d.b, .4);
    parts.push(flat([[d.a*hl, -top(d.a)*.8], [d.b*hl, -top(d.b)*.8], [pk*hl, -top(pk) - d.h]], d.c || fc, d.e || fe)); }
  if (o.pect) { const s = o.pect, zz = hl*(o.pectZ == null ? .22 : o.pectZ);
    for (const sd of [-1, 1]) parts.push(tf(flat([[0, .1*s], [-.9*s, .5*s], [-1.1*s, -.1*s], [-.7*s, -.45*s], [0, -.12*s]], fc, fe), sd*w*.82, -h*.3, zz, 0, sd*-.55, sd*.5)); }
  const e = o.eye || 0;
  if (e) { const zn = o.eyeZ == null ? .56 : o.eyeZ, yn = o.eyeY == null ? .2 : o.eyeY, sx = w*k(zn)*Math.sqrt(Math.max(.05, 1 - zn*zn - yn*yn));
    for (const sd of [-1, 1]) {
      if (o.dot) parts.push(ball(e, [.02, .02, .03], sd*sx*.9, yn*h, zn*hl, 5, 3, .6, 1, 1));
      else { parts.push(ball(e, [1, 1, 1], sd*(sx - e*.35), yn*h, zn*hl, o.hi ? 12 : 6, o.hi ? 9 : 4));
        parts.push(ball(e*.62, [.02, .02, .04], sd*(sx + e*.18), yn*h + e*.03, zn*hl + e*.2, o.hi ? 10 : 5, o.hi ? 7 : 3));
        if (o.hi) parts.push(ball(e*.2, [3, 3, 3], sd*(sx + e*.66), yn*h + e*.3, zn*hl + e*.42, 6, 4)); } } }
  return merge(parts);
}
const band = (zn, c, w) => { const d = Math.abs(zn - c); return d < w ? 2 : d < w + .05 ? 1 : 0; };
const clownCol = (zn, yn) => { const b = Math.max(band(zn, .34 - yn*yn*.08, .09), band(zn, -.17, .1 + .05*Math.cos(yn*2.4)), band(zn, -.74, .07)); return b === 2 ? K.wh : b === 1 ? K.bk : mix3(K.or, C(0xff8a1a), yn*.5 + .5); };
function speciesGeo(k) { if (!fishGeoC[k]) { fishGeoC[k] = fishGeo(SP[k]); fishGeoC[k].userData.keep = true; } return fishGeoC[k]; }
function speciesMat(k) { return fishMat[k] || (fishMat[k] = M({ side:T.DoubleSide, glow:.3, phase:'attr', wig:[SP[k].wig, SP[k].L, 9 + 2/SP[k].L] })); }
function makeClown() {
  const g = new T.Group(), inner = new T.Group(); g.add(inner);
  const mat = M({ phong:true, shin:70, spec:0x777777, side:T.DoubleSide, glow:.3, wig:[.05, .62, 0] });
  const body = new T.Mesh(fishGeo({ L:.62, h:.19, w:.115, col:clownCol, tail:{ t:'round', s:.15, l:.18 }, dorsal:{ a:.38, b:-.62, h:.085, pk:.3 }, anal:{ a:-.2, b:-.62, h:.07 },
    eye:.044, eyeY:.26, hi:1, finC:K.or, finE:K.bk, sw:26, sh:18 }), mat);
  body.frustumCulled = false; inner.add(body);
  const fins = [-1, 1].map(sd => { const pv = new T.Group(); pv.position.set(sd*.1, -.06, .07);
    const f = new T.Mesh(flat([[0, .03], [-.13, .1], [-.2, .02], [-.15, -.08], [0, -.03]], K.or, K.bk), mat); f.rotation.z = sd*.5; pv.add(f); inner.add(pv); return pv; });
  return { g, inner, len:.62, camBack:3.6, camUp:.9, eye:.34, swim(ph, k) { mat.userData.uPh.value = ph; fins[0].rotation.y = .9 + Math.sin(ph*1.3)*.5*k; fins[1].rotation.y = -.9 - Math.sin(ph*1.3 + .6)*.5*k; } };
}
function makeTurtle() {
  const g = new T.Group(), inner = new T.Group(); g.add(inner);
  const mat = M({ phong:true, shin:25, spec:0x333333, side:T.DoubleSide, glow:.24 });
  const sA = C(0x6b4a16), sB = C(0xd9a441), sL = C(0x241505), cream = C(0xf6e3a1), skA = C(0x2f6b3a), skB = C(0xe9e2a8);
  const sh = new T.SphereGeometry(1, 34, 22), p = sh.attributes.position, col = new Float32Array(p.count*3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); let c;
    if (y < -.05) c = cream; else { const [e, d] = hexCell(x, z, 2.35), rim = Math.hypot(x, z);
      c = e < .09 ? sL : mix3(sB, sA, sstep(0, .5, d) + .25*Math.sin(Math.atan2(z, x)*30)*d); if (rim > .9) c = mix3(c, sB, .5); }
    col.set(c, i*3); const tp = 1 - .28*sstep(0, 1, -z);
    p.setXYZ(i, x*.5*tp, (y > 0 ? y*.24 : y*.1), z*.62); }
  sh.setAttribute('color', new T.BufferAttribute(col, 3)); sh.computeVertexNormals();
  const skin = (x, y, z, f = 9) => { const [e] = hexCell(x + y*.7, z, f); return y < -.02 ? cream : e < .12 ? skB : skA; };
  const head = new T.SphereGeometry(1, 16, 12); setCol(head, (x, y, z) => skin(x*.15, y*.12, z*.2, 14)); tf(head, 0, .03, .8, 0, 0, 0, .13, .115, .18);
  const neck = setCol(tf(new T.CylinderGeometry(.09, .11, .22, 8, 1, true).rotateX(Math.PI/2), 0, .0, .64), skA);
  const tail = setCol(tf(new T.ConeGeometry(.05, .2, 6).rotateX(-Math.PI/2), 0, -.02, -.68), skA);
  const eyes = []; for (const sd of [-1, 1]) eyes.push(ball(.042, [1, 1, 1], sd*.098, .07, .87, 10, 8), ball(.027, K.bk, sd*.125, .075, .885, 8, 6), ball(.009, [3, 3, 3], sd*.143, .09, .9, 5, 4));
  const bodyM = new T.Mesh(merge([sh, head, neck, tail, ...eyes]), mat); bodyM.frustumCulled = false; inner.add(bodyM);
  const flip = (sd, len, wd, front) => { const f = new T.SphereGeometry(1, 14, 8), q = f.attributes.position, cc = new Float32Array(q.count*3);
    for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i), z = q.getZ(i), u = (x + 1)/2; cc.set(skin(x*len, y, z*wd, 11), i*3);
      q.setXYZ(i, sd*(u*len), y*.022*(1.2 - u*.6), z*wd*(.5 + .6*Math.sin(u*2.6)) - (front ? u*u*len*.55 : u*len*.3)); }
    f.setAttribute('color', new T.BufferAttribute(cc, 3)); f.computeVertexNormals(); const m = new T.Mesh(f, mat); m.frustumCulled = false; const pv = new T.Group(); pv.add(m); inner.add(pv); return pv; };
  const fl = flip(1, .72, .15, true), frr = flip(-1, .72, .15, true), bl = flip(1, .3, .1, false), brr = flip(-1, .3, .1, false);
  fl.position.set(.36, -.02, .34); frr.position.set(-.36, -.02, .34); bl.position.set(.3, -.03, -.46); brr.position.set(-.3, -.03, -.46);
  return { g, inner, len:1.35, camBack:5.2, camUp:1.5, eye:.95, swim(ph, k) { const a = Math.sin(ph*.55), b = Math.cos(ph*.55);
    fl.rotation.set(0, b*.3*k - .1, a*.55*k + .05); frr.rotation.set(0, -b*.3*k + .1, -a*.55*k - .05);
    bl.rotation.set(0, -.5 + a*.15*k, b*.15*k); brr.rotation.set(0, .5 - a*.15*k, -b*.15*k); } };
}
function makeManta() {
  const g = new T.Group(), top = C(0x0c1838), mark = C(0xdfe9f5);
  const b = new T.SphereGeometry(1, 30, 12), p = b.attributes.position, col = new Float32Array(p.count*3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.abs(x), ch = Math.pow(Math.max(0, 1 - a), .7);
    col.set(y < -.02 ? [.95, .97, 1] : (a > .12 && a < .42 && z > .15 && z < .75) ? mark : top, i*3);
    p.setXYZ(i, x*2.1, y*.13*ch*(1 + 1.6*Math.pow(1 - a, 3)), z*ch*.95 - a*a*.75 + (1 - a)*.1); }
  b.setAttribute('color', new T.BufferAttribute(col, 3)); b.computeVertexNormals();
  const parts = [b, sweep([[0, 0, -.7], [0, .02, -1.6], [0, 0, -2.6], [0, -.03, -3.4]], t => .045*(1 - t) + .006, 10, 5, () => top)];
  for (const sd of [-1, 1]) { parts.push(sweep([[sd*.28, 0, .85], [sd*.33, -.03, 1.15], [sd*.27, -.1, 1.38]], t => .075*(1 - t*.5), 6, 6, () => top));
    parts.push(ball(.035, K.bk, sd*.47, .03, .78, 6, 5)); }
  const mat = M({ side:T.DoubleSide, glow:.2, flap:[.2, 0] }), m = new T.Mesh(merge(parts), mat); m.frustumCulled = false; g.add(m);
  return { g, swim(ph) { mat.userData.uPh.value = ph; } };
}
function makeShark() {
  const g = new T.Group(), gr = C(0x5d7890), mat = M({ side:T.DoubleSide, glow:.16, wig:[.22, 3.4, 0] });
  const m = new T.Mesh(fishGeo({ L:3.4, h:.36, w:.3, taper:.55, nose:.55, col:(zn, yn) => mix3([.96, .97, 1], gr, sstep(-.25, .1, yn)),
    tail:{ t:'shark', s:.42, l:.75 }, dorsal:{ a:.15, b:-.2, h:.48, pk:.75 }, anal:{ a:-.45, b:-.62, h:.12 }, pect:.6, pectZ:.25, eye:.035, eyeZ:.72, eyeY:.15, dot:1, finC:gr, finE:mul3(gr, .7), sw:18, sh:12 }), mat);
  m.frustumCulled = false; g.add(m);
  return { g, swim(ph) { mat.userData.uPh.value = ph; } };
}
function makePuffer() {
  const g = new T.Group(), body = new T.Group(); g.add(body);
  const mat = M({ side:T.DoubleSide, glow:.26, wig:[.02, .5, 7] });
  const m = new T.Mesh(fishGeo({ L:.5, h:.17, w:.16, taper:.5, col:(zn, yn) => yn < -.15 ? [1, 1, .95] : (hash2(Math.round(zn*7), Math.round(yn*7)) > .6 ? C(0x5a3a12) : C(0xf2c230)),
    tail:{ t:'round', s:.07, l:.09 }, dorsal:{ a:-.35, b:-.7, h:.05 }, pect:.07, eye:.045, eyeY:.3, eyeZ:.5, hi:1, finC:C(0xf2c230), finE:C(0xb07a10), sw:16, sh:12 }), mat);
  m.frustumCulled = false; body.add(m);
  const sp = []; for (let i = 0; i < 46; i++) { const y = 1 - (i + .5)/46*2, r = Math.sqrt(1 - y*y), a = i*2.39996, d = new V3(Math.cos(a)*r, y, Math.sin(a)*r); if (d.z > .55) continue;
    const c = new T.ConeGeometry(.012, .07, 4, 1, true); c.translate(0, .035, 0); c.applyMatrix4(_m4.makeRotationFromQuaternion(_q.setFromUnitVectors(UP, d))); c.translate(d.x*.15, d.y*.16, d.z*.22 - .02); sp.push(setCol(c, [1, 1, .9])); }
  const spikes = new T.Mesh(merge(sp), mat); spikes.frustumCulled = false; body.add(spikes); let k = 0;
  return { g, puff(target, dt) { k += (target - k)*Math.min(1, dt*5); const s = 1 + k*.9; body.scale.set(s*(1 + k*.25), s*(1 + k*.3), 1 + k*.25); spikes.visible = k > .08; } };
}
function seahorseGeo() {
  const cA = C(0xffc21a), cB = C(0xff8a00);
  const body = sweep([[0, -.3, .1], [0, -.42, .03], [0, -.44, -.08], [0, -.34, -.13], [0, -.24, -.06], [0, -.12, .0], [0, .08, .02], [0, .28, -.05], [0, .42, -.03], [0, .52, .05]],
    t => t < .4 ? .018 + .07*(t/.4) : t < .68 ? .088 + .05*Math.sin((t - .4)/.28*Math.PI) : .088 - .035*((t - .68)/.32), 34, 7, t => mix3(cA, cB, .5 + .5*Math.sin(t*95)));
  const parts = [body, ball(.075, cA, 0, .57, .1, 8, 6, .85, 1, 1.15), setCol(tf(new T.CylinderGeometry(.022, .034, .17, 6).rotateX(Math.PI/2), 0, .54, .24, .35, 0, 0), cB),
    setCol(tf(new T.ConeGeometry(.035, .08, 5), 0, .66, .07), cB), flat([[-.1, .32], [-.19, .22], [-.17, .08], [-.08, .04]], cA, cB)];
  for (const sd of [-1, 1]) parts.push(ball(.022, [1, 1, 1], sd*.055, .59, .13, 6, 5), ball(.013, K.bk, sd*.07, .59, .14, 5, 4));
  return merge(parts);
}
function makeCrab() {
  const g = new T.Group(), red = C(0xff4a26), dk = C(0xb02410), mat = M({ glow:.26 });
  const parts = [setCol(tf(new T.SphereGeometry(1, 12, 8), 0, .2, 0, 0, 0, 0, .34, .15, .24), (x, y, z) => y > .26 && hash2(Math.round(x*14), Math.round(z*14)) > .7 ? [1, .8, .6] : y < .15 ? [1, .85, .7] : red)];
  for (const sd of [-1, 1]) { parts.push(setCol(tf(new T.CylinderGeometry(.012, .012, .12, 5), sd*.1, .36, .2), dk), ball(.03, [1, 1, 1], sd*.1, .43, .2, 6, 5), ball(.017, K.bk, sd*.1, .435, .222, 5, 4));
    parts.push(ball(.07, red, sd*.36, .2, .22, 7, 5, 1.2, .8, 1), ball(.1, red, sd*.43, .22, .36, 8, 6, .75, .7, 1.1));
    parts.push(setCol(tf(new T.ConeGeometry(.04, .16, 5), sd*.4, .26, .5, 1.3, 0, 0), [1, .9, .8]), setCol(tf(new T.ConeGeometry(.035, .14, 5), sd*.46, .18, .5, 1.75, 0, 0), [1, .9, .8])); }
  const b = new T.Mesh(merge(parts), mat); g.add(b);
  const legs = [-1, 1].map(sd => { const lp = []; for (let i = 0; i < 4; i++) { const z = .14 - i*.11;
      lp.push(setCol(tf(new T.CylinderGeometry(.018, .022, .26, 5), sd*.4, .22, z, 0, 0, sd*-1.05), red), setCol(tf(new T.CylinderGeometry(.006, .018, .28, 5), sd*.57, .14, z, 0, 0, sd*.35), dk)); }
    const m = new T.Mesh(merge(lp), mat); g.add(m); return m; });
  return { g, walk(t) { legs[0].rotation.x = Math.sin(t)*.14; legs[1].rotation.x = -Math.sin(t)*.14; legs[0].position.y = Math.abs(Math.sin(t))*.015; b.position.y = Math.sin(t*2)*.01; } };
}
function makeOcto() {
  const g = new T.Group(), mat = M({ glow:.24, waveY:[.3, 7], color:0xffffff }), matH = M({ glow:.24, color:0xffffff });
  const hd = new T.SphereGeometry(1, 18, 14), p = hd.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + .08*vnoise(x*4, y*4 + z*4); p.setXYZ(i, x*.36*k, y*.34*k + .5, z*.5*k - .22 + y*-.12); }
  hd.computeVertexNormals(); setCol(hd, (x, y, z) => { const s = hash2(Math.round(x*16), Math.round(z*16 + y*9)) > .72 ? 1.5 : .9; return [s, s, s]; });
  const parts = [hd, ball(.3, [.95, .95, .95], 0, .3, .05, 12, 8, 1, .6, 1)];
  for (const sd of [-1, 1]) parts.push(ball(.085, [3, 3, 2.6], sd*.2, .62, .1, 10, 8), ball(.05, [.0, .0, .0], sd*.245, .63, .14, 8, 6, .6, .45, 1.2));
  const head = new T.Mesh(merge(parts), matH); g.add(head);
  const arms = []; for (let i = 0; i < 8; i++) { const a = i/8*TAU + .2, c = Math.cos(a), s = Math.sin(a), cu = (i % 2 ? 1 : -1)*.5;
    arms.push(sweep([[c*.18, .28, s*.18 + .02], [c*.6, .14, s*.6], [c*1.1, .06, s*1.1], [c*1.5 - s*cu*.3, .05, s*1.5 + c*cu*.3], [c*1.62 - s*cu*.75, .08, s*1.62 + c*cu*.75], [c*1.42 - s*cu*.95, .12, s*1.42 + c*cu*.95]],
      t => .115*(1 - t)*(1 - t*.3) + .014, 18, 7, (t, an) => { const k = Math.sin(an) < -.3 ? 1.6 : .9; return [k, k, k*(k > 1 ? .9 : 1)]; })); }
  const am = new T.Mesh(merge(arms, true), mat); am.frustumCulled = false; g.add(am);
  const pal = [0xc26a4a, 0xff4a3d, 0xb44dff, 0x18d6c0, 0xffb300, 0xff4fa0].map(h => new T.Color(h).convertSRGBToLinear()); let ci = 0, cf = 0, ex = 0;
  return { g, react(near, dt, t) { ex += ((near ? 1 : 0) - ex)*Math.min(1, dt*3);
      if (near) { cf += dt*1.1; if (cf >= 1) { cf = 0; ci = 1 + (ci % (pal.length - 1)); } tmpC.copy(pal[ci]).lerp(pal[1 + (ci % (pal.length - 1))], cf); } else { tmpC.copy(pal[0]); ci = 0; cf = 0; }
      mat.color.lerp(tmpC, Math.min(1, dt*4)); matH.color.copy(mat.color); const br = 1 + Math.sin(t*2.2)*.05*(1 + ex); head.scale.set(br, 2 - br, br); head.position.y = ex*.12 + Math.sin(t*1.4)*.02; } };
}
function jellyGeos() {
  const bell = new T.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI/2), p = bell.attributes.position;
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), y = p.getY(i); p.setXYZ(i, p.getX(i)*.5*(1 + .05*Math.sin(a*8)*(1 - y)), y*.42, p.getZ(i)*.5*(1 + .05*Math.sin(a*8)*(1 - y))); }
  bell.computeVertexNormals(); setCol(bell, (x, y) => { const s = 1.5 - y*1.6; return [s, s, s]; });
  const tn = []; for (let i = 0; i < 10; i++) { const a = i/10*TAU, c = Math.cos(a)*.42, s = Math.sin(a)*.42, L = 1.2 + (i % 3)*.35;
    tn.push(sweep([[c, 0, s], [c*1.05, -L*.33, s*1.05], [c*.95, -L*.66, s*.95], [c, -L, s]], t => .018*(1 - t*.7), 6, 3, t => [1.3 - t*.6, 1.3 - t*.6, 1.3 - t*.6])); }
  for (let i = 0; i < 4; i++) { const a = i/4*TAU + .4, c = Math.cos(a)*.12, s = Math.sin(a)*.12;
    tn.push(sweep([[c, .1, s], [c*1.6, -.25, s*1.6], [c*.6, -.55, s*.6], [c*1.4, -.85, s*1.4]], t => .06*(1 - t*.6), 6, 5, t => [1.6, 1.6, 1.6])); }
  return [merge([bell]), merge(tn, true)];
}
function makeWhale() {
  const g = new T.Group(), top = C(0x2c5275), mat = M({ side:T.DoubleSide, glow:.17, wigY:[.55, 14, 0] });
  const m = new T.Mesh(fishGeo({ L:14, h:1.55, w:1.45, taper:.74, nose:.3,
    col:(zn, yn, xn) => yn < -.3 && zn > -.25 ? (Math.sin(xn*24) > .15 ? [.94, .96, 1] : [.62, .68, .76]) : mix3(top, mul3(top, .55), vnoise(zn*7 + 2, yn*7)*.7),
    tail:{ fluke:1, s:2.4, l:2 }, dorsal:{ a:-.32, b:-.52, h:.4 }, pect:2.3, pectZ:.32, eye:.1, eyeZ:.58, eyeY:-.12, dot:1, finC:top, finE:[.85, .9, .95], sw:24, sh:14 }), mat);
  m.frustumCulled = false; g.add(m); return { g, swim(ph) { mat.userData.uPh.value = ph; } };
}
function makeDolphin() {
  const g = new T.Group(), gr = C(0x6d93b8), mat = M({ side:T.DoubleSide, glow:.2, wigY:[.13, 2.3, 0] });
  const geo = merge([fishGeo({ L:2.3, h:.27, w:.25, taper:.62, nose:.3, col:(zn, yn) => mix3([.95, .97, 1], gr, sstep(-.35, .05, yn)),
    tail:{ fluke:1, s:.42, l:.38 }, dorsal:{ a:.02, b:-.28, h:.3, pk:.75 }, pect:.4, pectZ:.3, eye:.032, eyeZ:.6, eyeY:.05, dot:1, finC:gr, finE:mul3(gr, .7), sw:18, sh:11 }),
    ball(.075, gr, 0, -.05, 1.18, 8, 6, .85, .65, 2.4)]);
  const m = new T.Mesh(geo, mat); m.frustumCulled = false; g.add(m); return { g, swim(ph) { mat.userData.uPh.value = ph; } };
}
function makeMoray() {
  const g = new T.Group(), cA = C(0xa8cc3a), cB = C(0x3f5f18), mat = M({ glow:.26, wave:[.1, 5] }), matR = M({ glow:.12 });
  const body = sweep([[0, -1.3, 0], [0, -.6, 0], [0, -.05, .08], [0, .3, .4], [0, .38, .8], [0, .36, 1.0]], t => t > .96 ? .05 : t > .8 ? .13 + .03*Math.sin((t - .8)/.16*Math.PI) : .12, 22, 8,
    (t, a) => Math.sin(a) < -.5 ? [.95, .92, .6] : (hash2(Math.round(t*30), Math.round(a*3)) > .6 ? cB : cA));
  const parts = [body]; for (const sd of [-1, 1]) parts.push(setAT(ball(.04, [2.5, 2.5, 2], sd*.1, .46, .86, 7, 5), .85), setAT(ball(.022, K.bk, sd*.125, .465, .88, 6, 4), .85));
  const fin = flat([[-.1, .1], [.3, .52], [.8, .56], [.3, .44]], cB, cB); parts.push(setAT(fin, .6));
  const bm = new T.Mesh(merge(parts, true), mat); bm.frustumCulled = false; g.add(bm);
  const ring = new T.TorusGeometry(.34, .16, 6, 12); ring.rotateX(Math.PI/2);
  g.add(new T.Mesh(merge([setCol(ring, (x, y, z) => { const s = .35 + .3*vnoise(x*6, z*6); return [s, s*.95, s*1.05]; }), setCol(tf(new T.CircleGeometry(.34, 12).rotateX(-Math.PI/2), 0, .03, 0), [.01, .01, .02])]), matR));
  let k = 0; return { g, upd(near, dt, t) { k += ((near ? 1 : 0) - k)*Math.min(1, dt*2.2); bm.position.y = -1.05 + k*1.05; bm.rotation.y = Math.sin(t*.6)*.35*k; } };
}
