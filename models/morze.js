// Zwierzęta morskie (z Rafy koralowej) — samodzielny moduł: geometria, materiał z animacją wierzchołków.
// Każde make*() → {g: Object3D, swim(ph)}; animację napędza MORZE.U.uTime.value = czas (s).
// Ustawienia przed załadowaniem: window.MORZE_CFG = {water: false (bez kaustyk i mgły wodnej — nad wodą), srgb: false (renderer bez sRGB)}.
const MORZE = (() => {
'use strict';
const T = THREE, V3 = T.Vector3, TAU = Math.PI*2, cfg = Object.assign({ water:true, srgb:true }, window.MORZE_CFG);
const hash2 = (x, y) => { const s = Math.sin(x*127.1 + y*311.7)*43758.5453; return s - Math.floor(s); };
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a)*u + (c - a)*v + (a - b - c + d)*u*v; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function setCol(g,fn){const p=g.attributes.position,n=p.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){const c=typeof fn==='function'?fn(p.getX(i),p.getY(i),p.getZ(i),i):fn;a[i*3]=c[0];a[i*3+1]=c[1];a[i*3+2]=c[2];}g.setAttribute('color',new T.BufferAttribute(a,3));return g;}
function tf(g,px=0,py=0,pz=0,rx=0,ry=0,rz=0,sx=1,sy,sz){if(sy===undefined)sy=sx;if(sz===undefined)sz=sx;_m4.compose(_v.set(px,py,pz),_q.setFromEuler(_e.set(rx,ry,rz)),_v2.set(sx,sy,sz));g.applyMatrix4(_m4);return g;}
const C = hex => { const c = new T.Color(hex); if (cfg.srgb) c.convertSRGBToLinear(); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
const mul3 = (a, k) => [a[0]*k, a[1]*k, a[2]*k];
const SUN = new V3(.32, 1, .22).normalize();
/* tekstura kaustyki (światło załamane na falach) — kafelkowalna, liczona raz */
function makeCaustics() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data, tt = 3.1;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x/N*TAU - 250, py = y/N*TAU - 250; let ix = px, iy = py, cc = 1; const inten = .005;
    for (let n = 0; n < 5; n++) { const t = tt*(1 - 3.5/(n + 1));
      const nx = px + Math.cos(t - ix) + Math.sin(t + iy), ny = py + Math.sin(t - iy) + Math.cos(t + ix); ix = nx; iy = ny;
      cc += 1/Math.hypot(px/(Math.sin(ix + t)/inten), py/(Math.cos(iy + t)/inten)); }
    cc /= 5; cc = 1.17 - Math.pow(cc, 1.4); const v = clamp(Math.pow(Math.abs(cc), 8), 0, 1)*255, o = (y*N + x)*4;
    d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255; }
  g.putImageData(im, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
const U = {
  uTime:{ value:0 }, uCaus:{ value:cfg.water ? makeCaustics() : null }, uFogD:{ value:.03 }, uCausI:{ value:1.5 },
  uDeep:{ value:new V3(.0, .09, .27) }, uMid:{ value:new V3(.02, .43, .72) }, uShal:{ value:new V3(.30, .82, .90) },
  uSun:{ value:SUN }, uPx:{ value:600 }, uCam:{ value:new V3() }, uGlowK:{ value:1 },
  uSunC:{ value:new V3(.30, .34, .26) }, uRayC:{ value:new V3(.72, 1, .93) }, uSkyC:{ value:new V3(.55, .93, 1) }, uRimC:{ value:new V3(.35, .8, .95) }
};
const GL_WATER = `
uniform vec3 uDeep; uniform vec3 uMid; uniform vec3 uShal; uniform vec3 uSun; uniform vec3 uSunC; uniform float uFogD; uniform vec3 uCam;
vec3 waterCol(vec3 d){
  vec3 c = mix(uMid, uShal, smoothstep(0.0, 0.8, d.y));
  c = mix(c, uDeep, 1.0 - smoothstep(-0.75, 0.02, d.y));
  c += pow(max(dot(d, uSun), 0.0), 7.0)*uSunC;
  return c;
}
vec3 applyFog(vec3 col, vec3 wpos, float k){
  vec3 vd = wpos - uCam; float fd = length(vd); float ff = 1.0 - exp(-uFogD*uFogD*fd*fd*k);
  return mix(col, waterCol(vd/max(fd, 0.001)), ff);
}`;
const fl = n => Number(n).toFixed(4);

/* Materiał z kaustyką, mgłą wodną i animacją wierzchołków.
   o: phong, glow, phase:'attr'|'inst'|undefined, sway, wig:[amp,len,speed], flap:[amp,speed], pulse:[amp,height], wave:[amp,k], waveY:[amp,k] */
function M(o = {}) {
  const p = { vertexColors:o.vc !== false, side:o.side || T.FrontSide };
  if (o.color != null) p.color = o.color; if (o.map) p.map = o.map; if (o.alphaTest) p.alphaTest = o.alphaTest;
  if (o.opacity != null) { p.transparent = true; p.opacity = o.opacity; p.depthWrite = false; }
  if (o.phong) { p.shininess = o.shin || 50; p.specular = new T.Color(o.spec || 0x555555); }
  const m = new (o.phong ? T.MeshPhongMaterial : T.MeshLambertMaterial)(p);
  const uPh = { value:o.ph || 0 }; m.userData.uPh = uPh;
  const PH = o.phase === 'attr' ? 'aPh' : o.phase === 'inst' ? '(instanceMatrix[3].x*1.7 + instanceMatrix[3].z*2.3)' : 'uPh';
  let an = '';
  if (o.sway) an += `{ float sh = max(transformed.y, 0.0); float ph = ${PH};
    transformed.x += sin(uTime*1.4 + ph + transformed.y*1.3)*${fl(o.sway)}*sh;
    transformed.z += cos(uTime*1.1 + ph*1.3 + transformed.y*1.1)*${fl(o.sway*.7)}*sh; }`;
  if (o.wig) an += `{ float wz = clamp((${fl(o.wig[1]*.25)} - transformed.z)/${fl(o.wig[1])}, 0.0, 1.0);
    transformed.x += sin(transformed.z*${fl(4/o.wig[1])} + uTime*${fl(o.wig[2])} + ${PH})*${fl(o.wig[0])}*(0.12 + wz*wz*1.3); }`;
  if (o.wigY) an += `{ float wz = clamp((${fl(o.wigY[1]*.25)} - transformed.z)/${fl(o.wigY[1])}, 0.0, 1.0);
    transformed.y += sin(transformed.z*${fl(4/o.wigY[1])} + uTime*${fl(o.wigY[2])} + ${PH})*${fl(o.wigY[0])}*(0.12 + wz*wz*1.3); }`;
  if (o.flap) an += `{ float ax = abs(transformed.x);
    transformed.y += sin(uTime*${fl(o.flap[1])} + ${PH} - ax*1.1)*pow(ax, 1.5)*${fl(o.flap[0])}; }`;
  if (o.pulse) an += `{ float pu = sin(uTime*2.3 + ${PH}); float k = 1.0 - clamp(transformed.y/${fl(o.pulse[1])}, 0.0, 1.0);
    transformed.xz *= 1.0 + pu*${fl(o.pulse[0])}*k; transformed.y += pu*${fl(o.pulse[0]*.25)}*k; }`;
  if (o.wave) an += `{ float ph = ${PH};
    transformed.x += sin(aT*${fl(o.wave[1])} - uTime*2.0 + ph)*${fl(o.wave[0])}*aT;
    transformed.z += cos(aT*${fl(o.wave[1]*.8)} - uTime*1.6 + ph*1.7)*${fl(o.wave[0])}*aT; }`;
  if (o.waveY) an += `{ float ph = ${PH} + position.x*2.0 + position.z*3.0;
    transformed.y += (sin(aT*${fl(o.waveY[1])} - uTime*1.7 + ph)*0.5 + 0.5)*${fl(o.waveY[0])}*aT*aT;
    transformed.x += cos(aT*${fl(o.waveY[1])} - uTime*1.3 + ph)*${fl(o.waveY[0]*.6)}*aT*aT; }`;
  const glow = fl(o.glow == null ? .2 : o.glow), det = o.det ? 1 : 0, rimK = fl(o.rim == null ? .5 : o.rim), spK = fl(o.spec2 == null ? .9 : o.spec2);
  const key = 'rf' + JSON.stringify([cfg.water, det, rimK, spK, o.phong ? 1 : 0, glow, o.phase, o.sway, o.wig, o.wigY, o.flap, o.pulse, o.wave, o.waveY]);
  m.customProgramCacheKey = () => key;
  m.onBeforeCompile = sh => {
    for (const k in U) sh.uniforms[k] = U[k]; sh.uniforms.uPh = uPh;
    sh.vertexShader = 'varying vec3 vWPos; varying vec3 vWN; uniform float uTime; uniform float uPh; attribute float aPh; attribute float aT;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + an)
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 wP = vec4(transformed, 1.0); vec3 wN = objectNormal;
        #ifdef USE_INSTANCING
          wP = instanceMatrix*wP; wN = mat3(instanceMatrix)*wN;
        #endif
          vWPos = (modelMatrix*wP).xyz; vWN = normalize(mat3(modelMatrix)*wN); }`);
    if (!cfg.water) return;
    sh.fragmentShader = 'varying vec3 vWPos; varying vec3 vWN; uniform float uTime; uniform sampler2D uCaus; uniform float uCausI; uniform float uGlowK; uniform vec3 uRimC;\n' + GL_WATER + '\n' +
      sh.fragmentShader.replace('#include <tonemapping_fragment>', `
        { vec3 nW = normalize(vWN); if (!gl_FrontFacing) nW = -nW;
          vec3 vV = normalize(uCam - vWPos);
          vec2 cuv = (vWPos.xz - vWPos.y*uSun.xz*0.55)*0.085;
          float c1 = texture2D(uCaus, cuv + uTime*vec2(0.031, 0.017)).r;
          float c2 = texture2D(uCaus, cuv*1.37 + uTime*vec2(-0.023, 0.029)).r;
          float ca = min(c1, c2) + c1*c2*0.6;
          float up = clamp(nW.y*0.8 + 0.45, 0.0, 1.0);
          float dep = smoothstep(-6.0, 16.0, vWPos.y);
          vec3 alb = diffuseColor.rgb;
          ${det ? 'float dtl = texture2D(uCaus, vWPos.xz*0.63 + vWPos.y*0.47).r + texture2D(uCaus, vWPos.zy*0.57 + vWPos.x*0.41).r; alb *= 0.84 + 0.42*dtl; gl_FragColor.rgb *= 0.88 + 0.3*dtl;' : ''}
          gl_FragColor.rgb *= mix(vec3(0.60, 0.80, 0.96), vec3(1.06, 1.03, 1.0), dep)*mix(vec3(0.60, 0.72, 0.96), vec3(1.0), smoothstep(-1.0, 0.65, nW.y));
          float rim = pow(1.0 - abs(dot(nW, vV)), 3.0);
          float spc = pow(max(dot(reflect(-uSun, nW), vV), 0.0), 26.0);
          gl_FragColor.rgb += alb*(ca*up*uCausI*(0.45 + dep)*vec3(1.0, 0.97, 0.80) + ${glow}*uGlowK) + uRimC*rim*${rimK}*(0.3 + 0.7*up) + uSunC*spc*${spK};
          gl_FragColor.rgb = gl_FragColor.rgb/(1.0 + max(gl_FragColor.rgb - 0.72, 0.0)*1.15); }
        #include <tonemapping_fragment>`)
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb = applyFog(gl_FragColor.rgb, vWPos, 1.0);');
  };
  return m;
}
const tmpC = new T.Color(), _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new V3(), _v2 = new V3(), UP = new V3(0, 1, 0);

function merge(list, withT) {
  let n = 0; const gs = list.map(g => { const q = g.index ? g.toNonIndexed() : g; if (!q.attributes.normal) q.computeVertexNormals(); n += q.attributes.position.count; return q; });
  const P = new Float32Array(n*3), N = new Float32Array(n*3), K = new Float32Array(n*3).fill(1), A = withT ? new Float32Array(n) : null; let o = 0;
  for (const g of gs) { const c = g.attributes.position.count;
    P.set(g.attributes.position.array.subarray(0, c*3), o*3); N.set(g.attributes.normal.array.subarray(0, c*3), o*3);
    if (g.attributes.color) K.set(g.attributes.color.array.subarray(0, c*3), o*3);
    if (A && g.attributes.aT) A.set(g.attributes.aT.array.subarray(0, c), o); o += c; }
  const out = new T.BufferGeometry();
  out.setAttribute('position', new T.BufferAttribute(P, 3)); out.setAttribute('normal', new T.BufferAttribute(N, 3)); out.setAttribute('color', new T.BufferAttribute(K, 3));
  if (A) out.setAttribute('aT', new T.BufferAttribute(A, 1));
  return out;
}
/* rura o zmiennym promieniu wzdłuż krzywej; aT = 0..1 wzdłuż długości */
function sweep(pts, radFn, segs, radial, colFn) {
  const curve = new T.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new V3(p[0], p[1], p[2]))), fr = curve.computeFrenetFrames(segs, false);
  const pos = [], col = [], at = [], idx = [];
  for (let i = 0; i <= segs; i++) { const t = i/segs, c = curve.getPointAt(t), r = radFn(t), Nn = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= radial; j++) { const a = j/radial*TAU, x = Math.cos(a), y = Math.sin(a);
      pos.push(c.x + r*(x*Nn.x + y*B.x), c.y + r*(x*Nn.y + y*B.y), c.z + r*(x*Nn.z + y*B.z)); at.push(t);
      const cc = colFn ? colFn(t, a) : [1, 1, 1]; col.push(cc[0], cc[1], cc[2]); } }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i*(radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new T.BufferGeometry(); g.setIndex(idx);
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('aT', new T.Float32BufferAttribute(at, 1));
  g.computeVertexNormals(); return g;
}
/* płaska płetwa w płaszczyźnie YZ: pts = [[z,y],...], wachlarz od środka */
function flat(pts, cIn, cOut) {
  let cz = 0, cy = 0; pts.forEach(p => { cz += p[0]; cy += p[1]; }); cz /= pts.length; cy /= pts.length;
  const P = [], K = [], N = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length];
    P.push(0, cy, cz, 0, a[1], a[0], 0, b[1], b[0]); K.push(...cIn, ...cOut, ...cOut); N.push(1, 0, 0, 1, 0, 0, 1, 0, 0); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T.Float32BufferAttribute(K, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
  return g;
}
const ball = (r, c, x, y, z, ws = 8, hs = 6, sx = 1, sy = 1, sz = 1) => tf(setCol(new T.SphereGeometry(r, ws, hs), c), x, y, z, 0, 0, 0, sx, sy, sz);
const fishMat = {}, fishGeoC = {};
function setAT(g, v) { const q = g.index ? g.toNonIndexed() : g; q.setAttribute('aT', new T.BufferAttribute(new Float32Array(q.attributes.position.count).fill(v), 1)); return q; }
function hexCell(x,z,f){const px=x*f,pz=z*f;let d1=9,d2=9;const j0=Math.round(pz/.866);for(let j=j0-1;j<=j0+1;j++){const off=(j&1)*.5,i0=Math.round(px-off);for(let i=i0-1;i<=i0+1;i++){const d=Math.hypot(px-i-off,pz-j*.866);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}}return [d2-d1,d1];}
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
// gatunki ryb (używają clownCol z modeli powyżej)
const K = { or:C(0xff6a00), wh:[1, 1, 1], bk:[.015, .015, .02], blue:C(0x0a3cff), yel:C(0xffd400), navy:C(0x061a4a) };

const SP = {
  clown:  { L:.36, h:.11, w:.066, col:clownCol, tail:{ t:'round', s:.085, l:.1 }, dorsal:{ a:.35, b:-.6, h:.05 }, anal:{ a:-.2, b:-.6, h:.04 }, pect:.07, eye:.022, finC:K.or, finE:K.bk, sw:12, sh:8, wig:.03 },
  blue:   { L:.5, h:.17, w:.06, col:(zn, yn) => (yn > .1 && zn < .45 && zn > -.8 && Math.abs(yn - (.62 - .35*zn*zn)) < .2) || (zn < -.82) ? (zn < -.82 ? K.yel : K.navy) : K.blue,
            tail:{ s:.13, l:.13, c:K.yel, e:K.navy }, dorsal:{ a:.4, b:-.75, h:.035, pk:.5, c:K.blue, e:K.navy }, anal:{ a:-.1, b:-.75, h:.03, c:K.blue, e:K.navy }, pect:.07, eye:.022, finC:K.yel, finE:K.yel, wig:.035 },
  yellow: { L:.42, h:.18, w:.05, nose:.25, col:(zn, yn) => zn < -.78 && Math.abs(yn) < .2 ? K.wh : mix3(K.yel, C(0xfff06a), yn*.5 + .5),
            tail:{ s:.11, l:.1 }, dorsal:{ a:.45, b:-.75, h:.09, pk:.6 }, anal:{ a:.1, b:-.75, h:.08 }, pect:.06, eye:.02, finC:K.yel, finE:C(0xffb000), wig:.03 },
  serg:   { L:.34, h:.13, w:.05, col:(zn, yn) => Math.sin(zn*8.5 + .6) > .5 && zn < .5 ? K.bk : mix3([.9, .95, 1], K.yel, sstep(.1, .8, yn)),
            dorsal:{ a:.35, b:-.6, h:.04 }, anal:{ a:-.1, b:-.6, h:.03 }, pect:.05, eye:.018, finC:[.75, .8, .85], finE:K.bk, wig:.025 },
  chrom:  { L:.22, h:.075, w:.034, col:(zn, yn) => mix3(C(0x38ffd0), C(0x1f7bff), sstep(-.3, .9, yn)), tail:{ s:.07, l:.08 }, dorsal:{ a:.3, b:-.6, h:.025 }, eye:.014, dot:1, finC:C(0x7dfff0), sw:8, sh:6, wig:.018 },
  anth:   { L:.24, h:.07, w:.034, col:(zn, yn) => mix3(C(0xff3d7f), C(0xff9a1f), sstep(-.6, .6, yn + zn*.3)), tail:{ s:.09, l:.11, c:C(0xc94dff), e:C(0xff5fa8) }, dorsal:{ a:.4, b:-.6, h:.04, c:C(0xffa040), e:C(0xc94dff) }, eye:.014, dot:1, finC:C(0xff7ab0), sw:8, sh:6, wig:.02 },
  butt:   { L:.34, h:.17, w:.04, nose:.5, col:(zn, yn) => Math.abs(zn - .52) < .08 ? K.bk : zn < -.45 ? K.yel : (yn > .45 && zn < -.1 && zn > -.4) ? K.bk : [1, 1, .96],
            tail:{ t:'round', s:.07, l:.07, c:K.yel, e:K.wh }, dorsal:{ a:.35, b:-.7, h:.07, pk:.7, c:K.yel, e:K.yel }, anal:{ a:0, b:-.7, h:.06, c:K.yel, e:K.yel }, pect:.04, eye:.016, dot:1, finC:K.yel, wig:.02 },
  parrot: { L:.85, h:.2, w:.12, taper:.45, col:(zn, yn, xn) => { const n = vnoise(zn*7 + 3, yn*7); return zn > .55 ? mix3(C(0xff6fa5), C(0x20d6c7), n) : yn < -.35 ? mix3(C(0xffd86a), C(0xff7fb0), n) : mix3(C(0x12c9b0), C(0x1a8bff), n*.9); },
            tail:{ s:.2, l:.2, c:C(0x1a8bff), e:C(0xff6fa5) }, dorsal:{ a:.3, b:-.7, h:.06, pk:.5, c:C(0xff6fa5), e:C(0x1a8bff) }, anal:{ a:-.15, b:-.7, h:.05, c:C(0xff6fa5), e:C(0x1a8bff) }, pect:.13, eye:.036, finC:C(0x1a8bff), finE:C(0xff6fa5), sw:14, sh:9, wig:.06 }
};
SP.sard = { L:.2, h:.036, w:.02, col:(zn, yn) => yn > .35 ? [.25, .42, .6] : [1.5, 1.6, 1.75], tail:{ s:.04, l:.05 }, finC:[.8, .9, 1], sw:6, sh:5, wig:.016 };
return { cfg, U, GL_WATER, SUN, C, mix3, mul3, M, fl, merge, sweep, flat, ball, setCol, tf, sstep, hexCell, setAT, K, SP, fishMat, fishGeoC, fishGeo, speciesGeo, speciesMat,
  makeClown, makeTurtle, makeManta, makeShark, makePuffer, seahorseGeo, makeCrab, makeOcto, jellyGeos, makeWhale, makeDolphin, makeMoray };
})();
