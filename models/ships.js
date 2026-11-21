'use strict';
// --- kształt kadłuba: t = -1 (rufa) … 1 (dziób)
function sstep01(a, b, x) { const k = clamp((x - a)/(b - a), 0, 1); return k*k*(3 - 2*k); }
function hullW(t) { return t > 0 ? 1 - Math.pow(t, 2.6) : 1 - .2*t*t; }
function sheer(t) { return t > 0 ? .6*t*t + SH.FC*sstep01(.52, .66, t) : .25*t*t + SH.QD*sstep01(.3, .44, -t); }
function hullTop(t, rail) { return SH.H + rail + sheer(t); }
function hullX(t, y, rail) { const u = clamp((y + SH.D)/(hullTop(t, rail) + SH.D), 0, 1); return hullW(t)*SH.W/2*(1 - Math.pow(1 - u, 2.4))*(1 + .05*sstep01(-.3, -1, t)); }
function plankTex() { return plankTex.t || (plankTex.t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(40,20,5,' + (.03 + Math.random()*.13) + ')'; g.fillRect(0, i*32, w, 32); g.fillStyle = 'rgba(30,15,5,.42)'; g.fillRect(0, i*32, w, 3);
    const x = Math.random()*w; g.fillRect(x, i*32, 3, 32); g.fillRect((x + 120) % w, i*32, 3, 32); g.fillStyle = 'rgba(20,10,0,.5)'; g.fillRect(x + 7, i*32 + 9, 3, 3); g.fillRect(x + 7, i*32 + 22, 3, 3); }
  for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(50,25,5,.1)'; g.fillRect(Math.random()*w, Math.random()*h, 20 + Math.random()*50, 1.5); } }, { repeat:[1, 1] })); }
function hullMat() { return hullMat.m || (hullMat.m = new T.MeshLambertMaterial({ vertexColors:true, map:plankTex(), side:T.DoubleSide })); }
// kadłub z pasami kolorów + pokłady (główny, rufowy, dziobowy) w jednej geometrii z UV pod deski
function hullGeo(rail, cH, cT, cB) { const { L, D, H } = SH, NS = 30, pos = [], col = [], uv = [], idx = [];
  const C = c => new T.Color(c), bot = C(cB), hull = C(cH), trim = C(cT), up = C(cH).multiplyScalar(.82), dk = C(0xd9b27a);
  const rows = (t) => { const top = hullTop(t, rail); return [[-D, bot], [-D*.5, bot], [.22, bot], [.22, hull], [H - .5, hull], [H - .5, trim], [H - .2, trim], [H - .2, up], [top - .13, up], [top - .13, trim], [top, trim]]; };
  const NR = 11;
  for (let i = 0; i <= NS; i++) { const t = -1 + 2*i/NS, r = rows(t);
    for (const sd of [1, -1]) for (const [y, c] of r) { pos.push(sd*hullX(t, y, rail), y, t*L/2); col.push(c.r, c.g, c.b); uv.push(t*L/2/3.2, y/1.3); } }
  for (let i = 0; i < NS; i++) for (let s = 0; s < 2; s++) for (let j = 0; j < NR - 1; j++) { const a = i*NR*2 + s*NR + j, b = a + NR*2; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  for (let j = 0; j < NR - 1; j++) { const a = j, b = NR + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }             // pawęż
  const deck = (t0, t1, y, n) => { const d0 = pos.length/3; for (let i = 0; i <= n; i++) { const t = lerp(t0, t1, i/n), x = hullX(t, y, rail)*.995;
      for (const sd of [1, -1]) { pos.push(sd*x, y, t*L/2); col.push(dk.r, dk.g, dk.b); uv.push(t*L/2/2.2, sd*x/1.1); } }
    for (let i = 0; i < n; i++) { const a = d0 + i*2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
  deck(-.46, .68, H, 14); deck(-1, -.42, H + SH.QD, 8); deck(.62, 1, H + SH.FC, 6);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// --- armata na lawecie: lufa wzdłuż osi x, wylot w stronę s (+1/-1); (x,y,z) = środek lawety na pokładzie
function barrelGeo() { return barrelGeo.g || (barrelGeo.g = new T.LatheGeometry([[0, -.8], [.06, -.78], [.075, -.72], [.045, -.67], [.19, -.63], [.205, -.5], [.205, -.46], [.225, -.45], [.225, -.4], [.19, -.39],
  [.172, 0], [.19, .01], [.19, .06], [.165, .07], [.145, .5], [.185, .53], [.185, .63], [.11, .63], [.1, .4]].map(p => new T.Vector2(p[0], p[1])), 12)); }
function cannonParts(p, x, y, z, s, col) { const wd = 0x6b4424, ir = 0x1c1f24, bx = x + s*.28;
  p.push({ g:barrelGeo(), p:[bx, y + .43, z], r:[0, 0, -s*PI/2], c:col || 0x2b3038 }, { g:cg(.04, .04, .56, 6), p:[bx - s*.02, y + .43, z], r:[PI/2, 0, 0], c:ir });
  p.push({ g:G.box, p:[x - s*.12, y + .2, z], s:[1.05, .09, .46], c:wd });
  for (const k of [1, -1]) { p.push({ g:G.box, p:[x - s*.02, y + .33, z + k*.22], s:[.86, .22, .07], c:wd }, { g:G.box, p:[x - s*.32, y + .48, z + k*.22], s:[.34, .12, .07], c:wd });
    for (const q of [.24, -.42]) p.push({ g:cg(.13, .13, .08, 10), p:[x + s*q, y + .13, z + k*.29], r:[PI/2, 0, 0], c:0x3b2414 }, { g:cg(.035, .035, .1, 6), p:[x + s*q, y + .13, z + k*.29], r:[PI/2, 0, 0], c:ir }); }
  return [x + s*.95, y + .43, z]; }
function mkCannon(col) { const p = []; cannonParts(p, 0, 0, 0, 1, col); return new T.Mesh(mergeC(p), MVC); }
// --- żagle
function sailTex(col, stripe, emb) { const k = col + '|' + stripe + '|' + emb; sailTex.c = sailTex.c || {}; return sailTex.c[k] || (sailTex.c[k] = canvasTex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h);
  if (stripe) { g.fillStyle = stripe; for (let i = 0; i < 4; i++) g.fillRect(i*64 + 32, 0, 32, h); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.16)'); gr.addColorStop(.25, 'rgba(255,255,255,.06)'); gr.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,.13)'; for (let i = 1; i < 8; i++) g.fillRect(i*32 - 1, 0, 2, h); g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
  g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(40, 170, 34, 30); g.fillRect(180, 50, 26, 36);
  if (emb) { g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '150px serif'; g.fillText(emb, 128, 138); } })); }
function sailMesh(w, h, tex) { const g = new T.PlaneGeometry(w, h, 8, 5), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i)/(w/2), y = p.getY(i)/(h/2);
    p.setZ(i, .85*(1 - x*x)*(1 - .45*y*y)); p.setX(i, p.getX(i)*(1 - .06*(y + 1)*.5)); p.setY(i, p.getY(i) + (y < 0 ? .22*x*x*-y : 0)); }
  g.computeVertexNormals(); return new T.Mesh(g, new T.MeshLambertMaterial({ map:tex, side:T.DoubleSide })); }
// żagiel skośny (trójkąt/czworokąt w płaszczyźnie symetrii, wybrzuszony w bok): pts = [[y,z],...] 3 lub 4 narożniki
function foreAftSail(pts, tex, belly) { const n = pts.length, cy = pts.reduce((s, p) => s + p[0], 0)/n, cz = pts.reduce((s, p) => s + p[1], 0)/n, pos = [], uv = [];
  const ys = pts.map(p => p[0]), zs = pts.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const V = (y, z, b) => { pos.push(b, y, z); uv.push((z - z0)/(z1 - z0), (y - y0)/(y1 - y0)); };
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], m = [(a[0] + b[0])/2, (a[1] + b[1])/2], q = [(m[0] + cy)/2, (m[1] + cz)/2];
    V(a[0], a[1], 0); V(m[0], m[1], belly*.25); V(cy, cz, belly); V(m[0], m[1], belly*.25); V(b[0], b[1], 0); V(cy, cz, belly); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  return new T.Mesh(g, new T.MeshLambertMaterial({ map:tex, side:T.DoubleSide })); }
function flagTex(col, emb) { const k = col + emb; flagTex.c = flagTex.c || {}; return flagTex.c[k] || (flagTex.c[k] = canvasTex(128, 80, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h);
  if (emb) { g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '58px serif'; g.fillText(emb, 64, 44); } })); }
// --- cały statek. o: {hull,trim,bot,sail,stripe,emb,flag (css),flagEmb,guns,masts,rail,gunCol,fig,cap,capStyle,crew:[z..],arena}
function buildShip(o) { const { L, W, H } = SH, rail = o.rail == null ? .72 : o.rail, g = new T.Group(), tilt = grp(g), p = [], wood = 0x7a4a22, dk = 0x3b2414, rope = 0x2b1d12, QD = H + SH.QD, FC = H + SH.FC;
  tilt.add(new T.Mesh(hullGeo(rail, o.hull, o.trim, o.bot || 0xe9e2cf), hullMat()));
  const stat = z => z/(L/2);
  // nadburcie: listwa górna po obu burtach
  for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 30; i++) { const t = -1 + 2*i/30; pts.push(new T.Vector3(s*hullX(t, hullTop(t, rail), rail), hullTop(t, rail), t*L/2)); }
    p.push({ g:new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, .085, 5), c:o.trim }); }
  // rufa: okna, galeryjka, latarnie, ster
  { const zt = -L/2 - .04, yw = H + .78, wx = hullX(-1, yw, rail);
    p.push({ g:G.box, p:[0, yw - .42, zt - .12], s:[wx*1.9, .1, .34], c:o.trim }, { g:G.box, p:[0, yw + .45, zt - .05], s:[wx*1.8, .08, .16], c:o.trim });
    for (const x of [-1, 0, 1]) { p.push({ g:G.box, p:[x*wx*.56, yw, zt], s:[wx*.46, .62, .05], c:dk }, { g:G.box, p:[x*wx*.56, yw, zt - .03], s:[wx*.36, .5, .05], c:0xffe27a });
      p.push({ g:G.box, p:[x*wx*.56, yw, zt - .06], s:[.035, .5, .03], c:dk }, { g:G.box, p:[x*wx*.56, yw, zt - .06], s:[wx*.36, .035, .03], c:dk }); }
    for (const s of [1, -1]) { const lx = s*hullX(-1, hullTop(-1, rail), rail)*.85, ly = hullTop(-1, rail);
      p.push({ g:cg(.03, .03, .5, 5), p:[lx, ly + .25, zt], c:dk }, { g:G.lo, p:[lx, ly + .6, zt], s:[.15, .19, .15], c:0xffe9a0 }, { g:G.cone, p:[lx, ly + .84, zt], s:[.17, .16, .17], c:dk }, { g:cg(.17, .17, .04, 8), p:[lx, ly + .42, zt], c:dk }); }
    p.push({ g:G.box, p:[0, -.15, -L/2 - .28], s:[.1, 1.9, .7], c:dk }); }
  // dziób: bukszpryt, galion
  const bs = [0, FC + 1.25, L/2 + 1.2], bt = [0, bs[1] + Math.cos(1.2)*2.4, bs[2] + Math.sin(1.2)*2.4];
  p.push({ g:cg(.07, .13, 4.8, 6), p:bs, r:[1.2, 0, 0], c:wood });
  if (o.fig === 'skull') p.push({ g:G.lo, p:[0, FC + .55, L/2 + .12], s:[.3, .32, .3], c:0xf4f1e6 }, { g:G.lo, p:[.12, FC + .6, L/2 + .37], s:.07, c:0x111111 }, { g:G.lo, p:[-.12, FC + .6, L/2 + .37], s:.07, c:0x111111 }, { g:G.box, p:[0, FC + .36, L/2 + .32], s:[.22, .12, .1], c:0xf4f1e6 });
  else p.push({ g:G.lo, p:[0, FC + .62, L/2 + .2], s:[.2, .22, .2], c:0xffc93c }, { g:G.cone, p:[0, FC + .2, L/2 + .02], s:[.24, .7, .24], r:[.5, 0, 0], c:0xffc93c }, { g:G.lo, p:[0, FC + .5, L/2 - .05], s:[.34, .1, .3], r:[.5, 0, 0], c:0xffc93c });
  // ścianki pokładów, schodki, balustradki
  { const wq = hullX(-.44, QD, rail), wf = hullX(.64, FC, rail);
    p.push({ g:G.box, p:[0, H + SH.QD/2, -.44*L/2], s:[wq*2, SH.QD, .1], c:o.hull }, { g:G.box, p:[-.5, H + .42, -.44*L/2 + .06], s:[.5, .84, .05], c:dk }, { g:G.lo, p:[-.36, H + .42, -.44*L/2 + .1], s:.04, c:0xffc93c });
    p.push({ g:G.box, p:[.55, H + .55, -.44*L/2 + .06], s:[.4, .34, .05], c:0xffe27a }, { g:G.box, p:[0, H + SH.FC/2, .64*L/2], s:[wf*2, SH.FC, .1], c:o.hull });
    for (let i = 0; i < 4; i++) p.push({ g:G.box, p:[wq - .55, H + (i + .5)*SH.QD/4, -.44*L/2 + .62 - i*.17], s:[.8, .07, .2], c:0xb98a55 });
    p.push({ g:G.box, p:[0, QD + .5, -.44*L/2], s:[wq*2, .07, .09], c:o.trim }); for (let i = -4; i <= 4; i++) if (Math.abs(i*wq/4.4 - (wq - .55)) > .45) p.push({ g:cg(.035, .045, .5, 5), p:[i*wq/4.4, QD + .25, -.44*L/2], c:o.trim }); }
  // koło sterowe
  { const wz = -L*.3, wy = QD + .78; p.push({ g:G.box, p:[0, QD + .35, wz - .12], s:[.16, .7, .16], c:dk }, { g:new T.TorusGeometry(.34, .04, 6, 14), p:[0, wy, wz], c:wood }, { g:G.lo, p:[0, wy, wz], s:.08, c:0xffc93c });
    for (let i = 0; i < 4; i++) p.push({ g:G.box, p:[0, wy, wz], s:[.86, .045, .045], r:[0, 0, i*PI/4], c:wood }); }
  // maszty, reje, bocianie gniazda
  const A = o.arena, mz = A ? [{ z:5.9, h:10 }, { z:-4.9, h:9, q:1 }] : o.masts === 3 ? [{ z:3.5, h:9.6 }, { z:.3, h:10.8 }, { z:-3.9, h:7.4, q:1 }] : o.masts === 1 ? [{ z:.9, h:9.4 }] : [{ z:2.9, h:9.8 }, { z:-1.3, h:9.4 }];
  const sails = [], lines = [], ln = (a, b) => lines.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  const stex = e => sailTex(o.sail, o.stripe, e), aft = mz[mz.length - 1];
  mz.forEach((m, i) => { const by = m.q ? QD : H, hl = m.h*.6, ty = by + m.h;
    p.push({ g:cg(.13, .2, hl, 8), p:[0, by + hl/2, m.z], c:wood }, { g:cg(.075, .12, m.h*.45, 7), p:[0, by + hl + m.h*.2, m.z], c:wood }, { g:G.lo, p:[0, ty + .06, m.z], s:.1, c:0xffc93c });
    p.push({ g:cg(.6, .46, .12, 10), p:[0, by + hl - .1, m.z], c:wood }, { g:new T.TorusGeometry(.6, .035, 5, 12), p:[0, by + hl + .4, m.z], r:[PI/2, 0, 0], c:wood });
    for (let j = 0; j < 6; j++) p.push({ g:cg(.025, .025, .45, 4), p:[Math.cos(j*PI/3)*.6, by + hl + .18, m.z + Math.sin(j*PI/3)*.6], c:wood });
    for (const s of [.3, .55, .8]) p.push({ g:cg(.2 - s*.06 + .02, .2 - s*.06 + .02, .06, 8), p:[0, by + hl*s, m.z], c:dk });
    const sl = m.q && mz.length > 1 && !A ? [{ y:m.h*.62, w:W*.8, h:m.h*.26 }] : [{ y:2.2, w:W*1.26, h:m.h*.37 }, { y:2.5 + m.h*.38, w:W*.9, h:m.h*.26 }, ...(o.masts === 3 && i === 1 ? [{ y:2.75 + m.h*.65, w:W*.6, h:m.h*.16 }] : [])];
    sl.forEach((s, j) => { const yy = by + s.y + s.h; p.push({ g:cg(.05, .085, s.w/2 + .3, 6), p:[s.w/4 + .15, yy, m.z + .14], r:[0, 0, -PI/2], c:wood }, { g:cg(.05, .085, s.w/2 + .3, 6), p:[-s.w/4 - .15, yy, m.z + .14], r:[0, 0, PI/2], c:wood });
      const sm = sailMesh(s.w, s.h, stex(i === 0 && j === 0 ? o.emb : '')); sm.position.set(0, by + s.y + s.h/2, m.z + .22); tilt.add(sm); sails.push(sm);
      for (const sd of [1, -1]) ln([sd*s.w*.47, by + s.y, m.z + .3], [sd*hullX(stat(m.z - 1.2), hullTop(stat(m.z - 1.2), rail), rail), hullTop(stat(m.z - 1.2), rail), m.z - 1.2]); });
    // wanty z drabinkami
    for (const sd of [1, -1]) { const top = [0, by + hl - .1, m.z], ft = []; for (let k = 0; k < 3; k++) { const z = m.z - .25 - k*.5, t = stat(z); ft.push([sd*hullX(t, hullTop(t, rail), rail), hullTop(t, rail), z]); ln(top, ft[k]); }
      for (let r = 1; r < 7; r++) { const f = r/7.5, a = ft[0].map((v, q) => lerp(v, top[q], f)), b = ft[2].map((v, q) => lerp(v, top[q], f)); ln(a, b); } }
    if (i > 0) ln([0, ty, m.z], [0, mz[i - 1].q ? QD : H + mz[i - 1].h*.6, mz[i - 1].z]); });
  ln(bt, [0, H + mz[0].h, mz[0].z]); ln(bt, [0, H + mz[0].h*.6, mz[0].z]); ln([0, (aft.q ? QD : H) + aft.h, aft.z], [0, hullTop(-1, rail) + .3, -L/2]);
  if (!A) { // kliwer + bezan
    const m0 = mz[0], jib = foreAftSail([[bt[1] - .1, bt[2] - .2], [H + m0.h*.93, m0.z + .2], [FC + 1.5, m0.z + .9]], stex(''), .5); tilt.add(jib);
    const by = aft.q ? QD : H, yb = by + 1.45, yt = by + aft.h*.56;
    p.push({ g:cg(.06, .08, 3.6, 6), p:[0, yb + .1, aft.z - 1.85], r:[PI/2 - .06, 0, 0], c:wood }, { g:cg(.05, .07, 2.9, 6), p:[0, yt + .5, aft.z - 1.4], r:[PI/2 - .36, 0, 0], c:wood });
    tilt.add(foreAftSail([[yb + .15, aft.z - .25], [yb + .28, aft.z - 3.5], [yt + .98, aft.z - 2.7], [yt, aft.z - .25]], stex(''), -.45)); }
  // działa i furty
  const guns = [], n = o.guns || 0;
  for (let i = 0; i < n; i++) { const z = n === 1 ? .6 : lerp(-L*.17, L*.25, i/(n - 1)), t = stat(z), xi = hullX(t, H + .43, rail), xo = hullX(t, H + .45, rail);
    for (const s of [1, -1]) { const m = cannonParts(p, s*(xi - .78), H, z, s, o.gunCol); guns.push({ side:s, x:m[0], y:m[1], z:m[2] });
      p.push({ g:G.box, p:[s*(xo + .01), H + .44, z], s:[.06, .52, .62], c:0x15110e }, { g:G.box, p:[s*(xo + .22), H + .78, z], s:[.4, .05, .62], r:[0, 0, s*.5], c:o.trim }); } }
  // sprzęt na pokładzie
  if (!A) { p.push({ g:G.box, p:[0, H + .06, 1.2], s:[1.5, .12, 1.3], c:dk }, { g:G.box, p:[0, H + .1, 1.2], s:[1.25, .1, 1.05], c:0x15110e });
    for (let i = -2; i <= 2; i++) p.push({ g:G.box, p:[i*.25, H + .16, 1.2], s:[.05, .03, 1.05], c:wood }, { g:G.box, p:[0, H + .16, 1.2 + i*.22], s:[1.25, .03, .05], c:wood });
    for (const [x, z] of [[1.25, -1.9], [-1.2, 3.2], [-1.3, -2.3]]) { p.push({ g:cg(.3, .3, .7, 10), p:[x, H + .35, z], c:0x9a6b3c }, { g:cg(.26, .26, .72, 10), p:[x, H + .35, z], c:0x7a4a22 }); for (const y of [.14, .56]) p.push({ g:cg(.315, .315, .06, 10), p:[x, H + y, z], c:0x33363b }); }
    p.push({ g:G.box, p:[1.15, H + .28, 3.4], s:[.6, .56, .6], c:0xa9773f }, { g:G.box, p:[1.15, H + .28, 3.4], s:[.64, .08, .64], c:dk }, { g:new T.TorusGeometry(.3, .08, 5, 12), p:[-1.1, H + .08, .2], r:[PI/2, 0, 0], c:0xc9a86a });
    p.push({ g:cg(.22, .3, .5, 8), p:[0, H + .25, -1.2 - (o.masts === 2 ? 1.5 : 0)], c:wood }, { g:cg(.36, .36, .1, 8), p:[0, H + .55, -1.2 - (o.masts === 2 ? 1.5 : 0)], c:dk });
    for (const s of [1, -1]) { const ax = s*(hullX(.74, H + .1, rail) + .08), ay = H + .15, az = L*.37; p.push({ g:cg(.035, .035, .9, 5), p:[ax, ay, az], c:0x33363b }, { g:G.box, p:[ax, ay + .36, az], s:[.06, .06, .5], c:0x33363b }, { g:new T.TorusGeometry(.26, .045, 5, 8, PI), p:[ax, ay - .2, az], r:[0, PI/2, PI], c:0x33363b }); } }
  // balustrada (arena pojedynku): wzdłuż burty o.balu
  if (o.balu) { const s = o.balu, pts = []; for (let i = 0; i <= 26; i++) { const t = lerp(-.44, .64, i/26), top = hullTop(t, rail), x = s*hullX(t, top, rail); pts.push(new T.Vector3(x, top + .62, t*L/2));
      p.push({ g:cg(.045, .06, .62, 6), p:[x, top + .31, t*L/2], c:i % 2 ? o.trim : 0xf4e9d0 }, { g:G.lo, p:[x, top + .2, t*L/2], s:[.085, .1, .085], c:i % 2 ? o.trim : 0xf4e9d0 }); }
    p.push({ g:new T.TubeGeometry(new T.CatmullRomCurve3(pts), 30, .075, 5), c:0xffc93c }); }
  tilt.add(new T.Mesh(mergeC(p), MVC));
  const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lines, 3)); tilt.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color:rope })));
  // bandera + proporczyk
  const mf = mz[mz.length > 2 ? 1 : 0], fy = (mf.q ? QD : H) + mf.h;
  const flag = new T.Mesh(new T.PlaneGeometry(1.9, 1.15, 4, 1).translate(.95, 0, 0), new T.MeshBasicMaterial({ map:flagTex(o.flag || '#16161c', o.flagEmb || ''), side:T.DoubleSide }));
  flag.position.set(0, fy - .5, mf.z); tilt.add(flag);
  // kapitan przy sterze i załoga
  let cap = null;
  if (o.cap) { const hold = grp(tilt, 0, QD, -L*.3 - .55);
    if (MK[o.cap]) { const f = fitPirate(o.cap, o.cap === 'penguin' ? 1.55 : 1.4, 1, o.capStyle == null ? 1 : o.capStyle, o.capAlt ? 0x7a3fd0 : undefined); hold.add(f.g); cap = f.a; }
    else { const hm = mkHuman(o.cap, { alt:o.capAlt }); hm.root.rotation.y = -PI/2; hm.root.scale.setScalar(.82); hold.add(hm.root); } }
  for (const z of o.crew || []) { const hm = mkHuman(pick(['majtek', 'majtek2', 'rudy', 'majtek'])); hm.root.rotation.y = rnd(PI*2); hm.root.scale.setScalar(.68); hm.root.position.set(rnd(-.9, .9), z < -3 ? QD : H, z); tilt.add(hm.root); }
  return { g, tilt, guns, sails, flag, cap }; }
