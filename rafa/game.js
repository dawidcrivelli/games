'use strict';
if (!window.THREE) { $('err').style.display = 'flex'; $('load').hidden = true; throw new Error('brak three.js'); }
const T = THREE, V3 = T.Vector3, TAU = Math.PI*2;
// zwierzęta morskie, materiał podwodny i helpery geometrii: models/morze.js
const { U, GL_WATER, SUN, C, mix3, mul3, M, fl, merge, sweep, flat, ball, setCol, tf, sstep, hexCell, setAT, K, SP, fishMat, fishGeoC, fishGeo, speciesGeo, speciesMat, makeClown, makeTurtle, makeManta, makeShark, makePuffer, seahorseGeo, makeCrab, makeOcto, jellyGeos, makeWhale, makeDolphin, makeMoray } = MORZE;

/* =====================================================================
   USTAWIENIA I STAN
   ===================================================================== */
const S = { mood:'day', who:'clown', ctrl:'arrows', cam:1, muted:false, running:false, menu:'start', seed:1 };
try {
  const sv = JSON.parse(localStorage.getItem('rafa') || 'null');
  if (sv) { if (sv.who === 'turtle' || sv.who === 'clown') S.who = sv.who; if (sv.ctrl === 'tilt' || sv.ctrl === 'arrows') S.ctrl = sv.ctrl; S.muted = !!sv.muted; if (sv.seed > 0) S.seed = sv.seed|0; if (['day', 'sunset', 'night'].includes(sv.mood)) S.mood = sv.mood; }
} catch (e) {}
const save = () => { try { localStorage.setItem('rafa', JSON.stringify({who:S.who, ctrl:S.ctrl, muted:S.muted, seed:S.seed, mood:S.mood})); } catch (e) {} };

const SURF = 18, EDGE = 66, START = { x:0, y:5.5, z:27 };
const N_PEARL_TOPS = 9, N_CLAMS = 7, N_SHELLS = 10;

let seed = 1;

const pick = a => a[Math.floor(rnd()*a.length) % a.length];

const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

const fbm = (x, y) => vnoise(x, y)*.55 + vnoise(x*2.1 + 5, y*2.1 + 9)*.3 + vnoise(x*4.3 + 1, y*4.3 + 7)*.15;

/* =====================================================================
   RENDERER, ŚWIATŁO, WSPÓLNE SHADERY
   ===================================================================== */
const cv = $('c');
let renderer;
try { renderer = new T.WebGLRenderer({ canvas:cv, antialias:true, powerPreference:'high-performance' }); }
catch (e) { $('err').textContent = 'To urządzenie nie obsługuje grafiki 3D (WebGL).'; $('err').style.display = 'flex'; $('load').hidden = true; throw e; }
renderer.outputEncoding = T.sRGBEncoding;
let PR = Math.min(window.devicePixelRatio || 1, 2);
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, .12, 600);
U.uCam.value = camera.position;
const hemi = new T.HemisphereLight(0xc8f6ff, 0x2a6ea6, .78); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff3d6, .6); sun.position.copy(SUN).multiplyScalar(50); scene.add(sun);

/* =====================================================================
   POMOCNICY GEOMETRII
   ===================================================================== */
const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new V3(), _v2 = new V3(), UP = new V3(0, 1, 0);

/* ryba: przód = +Z. o: L,h,w,col(zn,yn,xn),tail{t,s,l},dorsal{a,b,h,pk},anal{a,b,h},pect,eye,eyeZ,dot,finC,finE,sw,sh,taper,nose */

/* =====================================================================
   WODA: KOPUŁA, POWIERZCHNIA, SNOPY ŚWIATŁA, DROBINKI, BĄBELKI
   ===================================================================== */
const dome = new T.Mesh(new T.SphereGeometry(400, 24, 16), new T.ShaderMaterial({ side:T.BackSide, depthWrite:false, depthTest:false, uniforms:U,
  vertexShader:'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
  fragmentShader:GL_WATER + 'varying vec3 vD; void main(){ gl_FragColor = vec4(waterCol(normalize(vD)), 1.0); }' }));
dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

const surface = new T.Mesh(new T.PlaneGeometry(900, 900).rotateX(Math.PI/2), new T.ShaderMaterial({ uniforms:U,
  vertexShader:'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
  fragmentShader:'uniform float uTime; uniform sampler2D uCaus; uniform vec3 uSkyC;\n' + GL_WATER + `
    varying vec3 vW;
    void main(){
      vec3 d = normalize(vW - cameraPosition);
      vec2 p = vW.xz*0.05;
      float n1 = texture2D(uCaus, p + uTime*vec2(0.012, 0.008)).r, n2 = texture2D(uCaus, p*0.61 - uTime*vec2(0.009, 0.011)).r;
      float n = n1 + n2;
      float win = smoothstep(0.60, 0.80, d.y + (n - 0.25)*0.10);
      vec3 sky = uSkyC + uSunC*2.8*pow(max(dot(d, uSun), 0.0), 24.0);
      vec3 refl = waterCol(vec3(d.x, -d.y*0.6 - 0.1, d.z))*1.15 + vec3(0.05, 0.16, 0.2);
      vec3 col = mix(refl, sky, win) + uSkyC*1.15*(min(n1, n2)*1.6 + n*0.12)*(0.25 + win);
      gl_FragColor = vec4(applyFog(col, vW, 0.35), 1.0);
    }` }));
surface.position.y = SURF; surface.frustumCulled = false; scene.add(surface);

/* snopy światła: billboardy zawijane wokół kamery */
(() => {
  const n = 30, pos = new Float32Array(n*12), off = new Float32Array(n*12), q = new Float32Array(n*8), wd = new Float32Array(n*4), idx = [];
  for (let i = 0; i < n; i++) { const ox = Math.random()*70, oz = Math.random()*70, ph = Math.random(), w = 1.5 + Math.random()*3.2;
    for (let k = 0; k < 4; k++) { off.set([ox, oz, ph], (i*4 + k)*3); q.set([k % 2 ? 1 : -1, k < 2 ? 0 : 1], (i*4 + k)*2); wd[i*4 + k] = w; }
    idx.push(i*4, i*4 + 2, i*4 + 1, i*4 + 1, i*4 + 2, i*4 + 3); }
  const g = new T.BufferGeometry(); g.setIndex(idx);
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aOff', new T.BufferAttribute(off, 3));
  g.setAttribute('aQ', new T.BufferAttribute(q, 2)); g.setAttribute('aW', new T.BufferAttribute(wd, 1));
  const m = new T.ShaderMaterial({ uniforms:U, transparent:true, depthWrite:false, blending:T.AdditiveBlending, side:T.DoubleSide,
    vertexShader:`uniform float uTime; uniform vec3 uSun; attribute vec3 aOff; attribute vec2 aQ; attribute float aW; varying vec2 vQ; varying float vF;
      void main(){
        vec2 b = mod(aOff.xy - cameraPosition.xz + 35.0, 70.0) - 35.0;
        vec3 dir = -uSun; vec3 p = vec3(cameraPosition.x + b.x, ${fl(SURF)}, cameraPosition.z + b.y) + dir*24.0*aQ.y;
        vec3 right = normalize(cross(dir, normalize(cameraPosition - p) + vec3(0.001)));
        p += right*aQ.x*aW*(0.55 + aQ.y);
        float dc = length(p - cameraPosition);
        vF = (1.0 - smoothstep(24.0, 34.0, length(b)))*(0.5 + 0.5*sin(uTime*0.6 + aOff.z*6.283))*smoothstep(1.5, 7.0, dc)*exp(-dc*dc*0.0007);
        vQ = aQ; gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
      }`,
    fragmentShader:`uniform vec3 uRayC; varying vec2 vQ; varying float vF;
      void main(){ float a = pow(1.0 - abs(vQ.x), 2.0)*(1.0 - vQ.y)*smoothstep(0.0, 0.06, vQ.y); gl_FragColor = vec4(uRayC*a*vF*0.5, 1.0); }` });
  const rays = new T.Mesh(g, m); rays.frustumCulled = false; rays.renderOrder = 5; scene.add(rays);
})();

/* drobinki planktonu: drobny pył i duże, nieostre plamki tuż przy kamerze */
function plankton(n, B, s0, s1, near, far, alpha, bokeh) {
  const pos = new Float32Array(n*3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i*3] = Math.random()*B; pos[i*3 + 1] = Math.random()*B; pos[i*3 + 2] = Math.random()*B; ph[i] = Math.random()*TAU; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aPh', new T.BufferAttribute(ph, 1));
  const m = new T.ShaderMaterial({ uniforms:U, transparent:true, depthWrite:false, blending:T.AdditiveBlending,
    vertexShader:`uniform float uTime; uniform float uPx; attribute float aPh; varying float vA;
      void main(){ vec3 p = position + vec3(sin(uTime*0.23 + aPh)*0.7, uTime*0.07 + sin(uTime*0.31 + aPh*2.0)*0.4, cos(uTime*0.19 + aPh)*0.7);
        p = mod(p - cameraPosition + ${fl(B/2)}, ${fl(B)}) - ${fl(B/2)} + cameraPosition;
        vec4 mv = viewMatrix*vec4(p, 1.0); float d = -mv.z;
        vA = smoothstep(${fl(near)}, ${fl(near*3)}, d)*(1.0 - smoothstep(${fl(far*.6)}, ${fl(far)}, d))*(0.5 + 0.5*sin(uTime*1.3 + aPh*5.0));
        gl_PointSize = clamp((${fl(s0)} + ${fl(s1)}*sin(aPh*7.0))*uPx/max(d, 0.1), 1.0, ${bokeh ? '90.0' : '14.0'}); gl_Position = projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 uRayC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5)*2.0;
      float s = ${bokeh ? '(1.0 - smoothstep(0.82, 1.0, d))*(0.55 + 0.45*smoothstep(0.55, 0.9, d))' : '1.0 - smoothstep(0.2, 1.0, d)'};
      gl_FragColor = vec4(uRayC*s*vA*${fl(alpha)}, 1.0); }` });
  const pts = new T.Points(g, m); pts.frustumCulled = false; scene.add(pts);
}
plankton(420, 26, .035, .03, .4, 13, .7, false); plankton(46, 16, .2, .1, .5, 7, .085, true);

const GL_BUBBLE_F = GL_WATER + `varying float vA; varying vec3 vW;
  void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c)*2.0; if (d > 1.0) discard;
    float ring = smoothstep(0.55, 0.95, d); float hl = smoothstep(0.32, 0.0, length(c - vec2(-0.17, -0.19)));
    float a = (0.14 + ring*0.6 + hl*0.9)*vA*(1.0 - smoothstep(0.93, 1.0, d));
    gl_FragColor = vec4(applyFog(vec3(0.82, 0.98, 1.0) + hl*0.3, vW, 0.6), a); }`;
/* bąbelki z dna: tor liczony w shaderze */
let vents = null;
function buildVents(list) {
  if (vents) { scene.remove(vents); vents.geometry.dispose(); }
  const per = 9, n = list.length*per, pos = new Float32Array(n*3), a = new Float32Array(n*3);
  list.forEach((v, i) => { for (let k = 0; k < per; k++) { const j = i*per + k; pos.set([v.x, v.y, v.z], j*3); a.set([Math.random(), .9 + Math.random()*1.1, .05 + Math.random()*.09], j*3); } });
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aB', new T.BufferAttribute(a, 3));
  vents = new T.Points(g, new T.ShaderMaterial({ uniforms:U, transparent:true, depthWrite:false,
    vertexShader:`uniform float uTime; uniform float uPx; attribute vec3 aB; varying float vA; varying vec3 vW;
      void main(){ float hgt = ${fl(SURF)} - position.y; float t = fract(uTime*aB.y/hgt*1.0 + aB.x); float y = t*hgt;
        vec3 p = position + vec3(sin(y*1.7 + aB.x*40.0)*0.16*(1.0 + y*0.12), y, cos(y*1.3 + aB.x*23.0)*0.16*(1.0 + y*0.12));
        vW = p; vec4 mv = viewMatrix*vec4(p, 1.0); vA = smoothstep(0.0, 0.03, t)*(1.0 - smoothstep(0.93, 1.0, t));
        gl_PointSize = clamp(aB.z*(1.0 + y*0.09)*uPx/max(-mv.z, 0.1), 1.5, 90.0); gl_Position = projectionMatrix*mv; }`,
    fragmentShader:GL_BUBBLE_F }));
  vents.frustumCulled = false; scene.add(vents);
}
/* pule cząstek sterowane z CPU: bąbelki, iskierki, obłoczki piasku */
function makePool(n, kind) {
  const pos = new Float32Array(n*3), sz = new Float32Array(n), al = new Float32Array(n), vel = new Float32Array(n*3), life = new Float32Array(n), max = new Float32Array(n), s0 = new Float32Array(n);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aS', new T.BufferAttribute(sz, 1)); g.setAttribute('aA', new T.BufferAttribute(al, 1));
  const m = new T.ShaderMaterial({ uniforms:U, transparent:true, depthWrite:false, blending:kind === 'spark' ? T.AdditiveBlending : T.NormalBlending,
    vertexShader:`uniform float uPx; attribute float aS; attribute float aA; varying float vA; varying vec3 vW;
      void main(){ vW = position; vec4 mv = viewMatrix*vec4(position, 1.0); vA = aA;
        gl_PointSize = clamp(aS*uPx/max(-mv.z, 0.1), 0.0, 170.0); gl_Position = projectionMatrix*mv; }`,
    fragmentShader:kind === 'spark' ? `varying float vA; varying vec3 vW;
      void main(){ vec2 c = abs(gl_PointCoord - 0.5)*2.0; float d = length(c); float s = max(0.0, 1.0 - d)*0.6 + max(0.0, 1.0 - (c.x*c.y*22.0 + d*0.9));
        gl_FragColor = vec4(vec3(1.0, 0.92, 0.6)*s*vA, 1.0); }`
      : kind === 'dust' ? GL_WATER + `varying float vA; varying vec3 vW;
      void main(){ float d = length(gl_PointCoord - 0.5)*2.0; gl_FragColor = vec4(applyFog(vec3(0.90, 0.82, 0.62), vW, 0.6), (1.0 - smoothstep(0.1, 1.0, d))*vA); }` : GL_BUBBLE_F });
  const pts = new T.Points(g, m); pts.frustumCulled = false; scene.add(pts); let cur = 0;
  return {
    emit(x, y, z, vx, vy, vz, size, lf) { const i = cur; cur = (cur + 1) % n; pos[i*3] = x; pos[i*3 + 1] = y; pos[i*3 + 2] = z; vel[i*3] = vx; vel[i*3 + 1] = vy; vel[i*3 + 2] = vz; life[i] = max[i] = lf; s0[i] = size; },
    update(dt) { for (let i = 0; i < n; i++) { if (life[i] <= 0) { sz[i] = 0; al[i] = 0; continue; } life[i] -= dt; const k = life[i]/max[i];
        pos[i*3] += vel[i*3]*dt; pos[i*3 + 1] += vel[i*3 + 1]*dt; pos[i*3 + 2] += vel[i*3 + 2]*dt; al[i] = 1;
        if (kind === 'spark') { vel[i*3 + 1] -= 1.2*dt; sz[i] = s0[i]*clamp(k*1.6, 0, 1); }
        else if (kind === 'dust') { const dm = 1 - 1.6*dt; vel[i*3] *= dm; vel[i*3 + 1] *= dm; vel[i*3 + 2] *= dm; sz[i] = s0[i]*(.5 + 1.7*(1 - k)); al[i] = .42*k; }
        else { vel[i*3] *= 1 - 2*dt; vel[i*3 + 2] *= 1 - 2*dt; vel[i*3 + 1] += (1.6 - vel[i*3 + 1])*dt*2; sz[i] = pos[i*3 + 1] > SURF - .1 ? 0 : s0[i]*clamp(k*4, 0, 1); } }
      g.attributes.position.needsUpdate = true; g.attributes.aS.needsUpdate = true; g.attributes.aA.needsUpdate = true; }
  };
}
const bubbles = makePool(200, 'bubble'), sparks = makePool(140, 'spark'), dust = makePool(60, 'dust');
/* błyski nad perłami i muszlami — widać je z daleka */
let glints = null;
function buildGlints(items) {
  if (glints) { scene.remove(glints); glints.geometry.dispose(); }
  const n = items.length, pos = new Float32Array(n*3), a = new Float32Array(n*2);
  items.forEach((it, i) => { pos.set([it.x, it.y, it.z], i*3); a[i*2] = it.kind === 'pearl' ? 1.5 : 1.1; a[i*2 + 1] = Math.random()*TAU; });
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aG', new T.BufferAttribute(a, 2));
  glints = new T.Points(g, new T.ShaderMaterial({ uniforms:U, transparent:true, depthWrite:false, depthTest:true, blending:T.AdditiveBlending,
    vertexShader:`uniform float uTime; uniform float uPx; uniform float uFogD; attribute vec2 aG; varying float vA;
      void main(){ vec4 mv = viewMatrix*vec4(position, 1.0); float d = -mv.z; float tw = 0.75 + 0.25*sin(uTime*3.0 + aG.y);
        vA = tw*exp(-uFogD*uFogD*d*d*0.3); gl_PointSize = clamp(aG.x*tw*uPx/max(d, 0.1), 0.0, 140.0); gl_Position = projectionMatrix*mv; }`,
    fragmentShader:`varying float vA; void main(){ vec2 c = abs(gl_PointCoord - 0.5)*2.0; float d = length(c);
      float s = pow(max(0.0, 1.0 - d), 2.0)*0.55 + max(0.0, 1.0 - (c.x*c.y*40.0 + d))*0.9; gl_FragColor = vec4(vec3(1.0, 0.97, 0.85)*s*vA, 1.0); }` }));
  glints.frustumCulled = false; glints.renderOrder = 6; scene.add(glints);
}
function hideGlint(i) { glints.geometry.attributes.aG.setX(i, 0); glints.geometry.attributes.aG.needsUpdate = true; }

/* =====================================================================
   TEKSTURY PROCEDURALNE
   ===================================================================== */
function canvasTex(N, draw, rep) { const c = document.createElement('canvas'); c.width = c.height = N; draw(c.getContext('2d'), N);
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; } t.anisotropy = 4; return t; }
const texSand = canvasTex(256, (g, N) => { const im = g.createImageData(N, N), d = im.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x/N*TAU, v = y/N*TAU;
    const rip = Math.sin(v*13 + Math.sin(u*2)*1.9 + Math.sin(u*5 + v*2)*.7)*.5 + .5, sp = hash2(x*1.3, y*1.7);
    const k = 222 + rip*24 + (sp > .95 ? -40 : sp < .05 ? 9 : 0) + (hash2(x, y) - .5)*12, o = (y*N + x)*4;
    d[o] = d[o + 1] = d[o + 2] = clamp(k, 0, 255); d[o + 3] = 255; } g.putImageData(im, 0, 0); }, true);
const texBrain = canvasTex(256, (g, N) => { const im = g.createImageData(N, N), d = im.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x/N, v = y/N;
    const wx = Math.sin(v*TAU*2 + Math.sin(u*TAU*3)*1.2)*.9 + Math.sin(u*TAU*5 + v*TAU)*.5, wy = Math.cos(u*TAU*2 + Math.sin(v*TAU*4))*.9;
    const s = Math.sin(u*TAU*11 + wx*2.6 + Math.sin(v*TAU*9 + wy*2.4)*1.7);
    const k = 105 + 150*sstep(-.5, .75, s), o = (y*N + x)*4; d[o] = d[o + 1] = d[o + 2] = k; d[o + 3] = 255; } g.putImageData(im, 0, 0); }, true);
const texFan = canvasTex(256, (g, N) => { g.clearRect(0, 0, N, N); g.strokeStyle = '#fff'; g.lineCap = 'round'; let s = 7;
  const r = () => { s = (s*16807) % 2147483647; return s/2147483647; };
  (function br(x, y, a, len, w, lv) { const x2 = x + Math.sin(a)*len, y2 = y - Math.cos(a)*len;
    g.lineWidth = w; g.globalAlpha = 1; g.strokeStyle = lv > 3 ? '#fff' : '#cfcfcf'; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (lv >= 6 || y2 < 6) return; const nk = lv < 2 ? 3 : 2;
    for (let i = 0; i < nk; i++) br(x2, y2, a + (i - (nk - 1)/2)*(.55 + r()*.25) + (r() - .5)*.25, len*(.74 + r()*.12), Math.max(2.6, w*.74), lv + 1);
  })(N/2, N - 2, 0, N*.2, 9, 0); });

/* =====================================================================
   DNO I RAFA
   ===================================================================== */
const GN = 121, CELL = 1.5, GH = (GN - 1)*CELL/2;
let Hgrid = new Float32Array(GN*GN), Rgrid = new Float32Array(GN*GN), mounds = [];
function gsample(G, x, z) { const fx = clamp((x + GH)/CELL, 0, GN - 1.001), fz = clamp((z + GH)/CELL, 0, GN - 1.001), ix = fx | 0, iz = fz | 0, u = fx - ix, v = fz - iz, i = iz*GN + ix;
  return G[i]*(1 - u)*(1 - v) + G[i + 1]*u*(1 - v) + G[i + GN]*(1 - u)*v + G[i + GN + 1]*u*v; }
const Hg = (x, z) => gsample(Hgrid, x, z), Rg = (x, z) => gsample(Rgrid, x, z);

let world = null, colliders = [], schools = [], movers = [], discover = [], items = [], fishIM = [], anemPos = [], ventList = [];
const dummy = new T.Object3D(), tmpC = new T.Color();

function buildTerrain() {
  mounds = [{ x:0, z:-5, h:7.6, r:9.5 }];
  let tries = 0;
  while (mounds.length < 13 && tries++ < 600) { const a = rnd()*TAU, d = rr(19, 57), m = { x:Math.cos(a)*d, z:Math.sin(a)*d, h:rr(2.8, 6.6), r:rr(4.6, 8.8) };
    if (Math.hypot(m.x - START.x, m.z - START.z) < m.r + 7) continue;
    if (mounds.some(o => Math.hypot(o.x - m.x, o.z - m.z) < (o.r + m.r)*1.05)) continue; mounds.push(m); }
  const n1 = seed*.013;
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = i*CELL - GH, z = j*CELL - GH;
    let h = fbm(x*.04 + 7 + n1, z*.04 + 3)*2.0 + vnoise(x*.22, z*.22)*.22, rk = 0;
    for (const m of mounds) { const dx = x - m.x, dz = z - m.z, e = Math.exp(-(dx*dx + dz*dz)/(m.r*m.r)); if (e < .003) continue;
      h += m.h*Math.pow(e, .75)*(.72 + .56*vnoise(x*.33 + m.x, z*.33 + m.z)); rk += e*1.7; }
    const r = Math.hypot(x, z); if (r > 70) h -= Math.pow(r - 70, 1.35)*.4;
    Hgrid[j*GN + i] = h; Rgrid[j*GN + i] = Math.min(1, rk); }
  const pos = new Float32Array(GN*GN*3), col = new Float32Array(GN*GN*3), uv = new Float32Array(GN*GN*2), idx = [];
  const sandA = C(0xf2e0b0), sandB = C(0xd9c08a), rockA = C(0x8a7a8c), rockB = C(0xc98ab0), alga = C(0x6fae7a), enc = [C(0xe88a5a), C(0x58c2b2), C(0xd96aa8), C(0xd8c25a)];
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const k = j*GN + i, x = i*CELL - GH, z = j*CELL - GH, rk = Rgrid[k];
    pos[k*3] = x; pos[k*3 + 1] = Hgrid[k]; pos[k*3 + 2] = z; uv[k*2] = x/4; uv[k*2 + 1] = z/4;
    let c = mix3(sandA, sandB, vnoise(x*.15, z*.15));
    const rc = mix3(mix3(rockA, rockB, vnoise(x*.4 + 3, z*.4)), alga, sstep(.55, .8, vnoise(x*.23 + 9, z*.23 + 4))*.6);
    const pv = vnoise(x*.55 + 20, z*.55 + 11), rc2 = pv > .62 ? mix3(rc, enc[Math.floor(vnoise(x*.12 + 5, z*.12)*3.99)], sstep(.62, .75, pv)*.8) : rc;
    c = mix3(c, rc2, sstep(.18, .5, rk)); col.set(c, k*3);
    if (i < GN - 1 && j < GN - 1) idx.push(k, k + GN, k + 1, k + 1, k + GN, k + GN + 1); }
  const g = new T.BufferGeometry(); g.setIndex(idx);
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const mesh = new T.Mesh(g, M({ map:texSand, glow:.16, rim:0, spec2:.3 })); mesh.frustumCulled = false; world.add(mesh);
}

/* ---------- geometrie koralowców (odcienie szarości × kolor instancji) ---------- */

/* =====================================================================
   ZWIERZĘTA
   ===================================================================== */

/* --- błazenek gracza (dokładniejszy model) --- */

/* --- żółw morski --- */

/* --- nowe zwierzęta i miejsca --- */

/* =====================================================================
   BUDOWA ŚWIATA
   ===================================================================== */
const MAT = {};
function mats() {
  if (MAT.coral) return;
  MAT.coral = M({ side:T.DoubleSide, glow:.3, det:1 });
  MAT.soft = M({ side:T.DoubleSide, glow:.34, sway:.035, phase:'inst', det:1 });
  MAT.brain = M({ map:texBrain, glow:.26 });
  MAT.fan = M({ map:texFan, alphaTest:.45, side:T.DoubleSide, glow:.42, sway:.07, phase:'inst' });
  MAT.anem = M({ glow:.38, sway:.16, phase:'inst' });
  MAT.kelp = M({ side:T.DoubleSide, glow:.22, sway:.11, phase:'inst' });
  MAT.grass = M({ side:T.DoubleSide, glow:.22, sway:.22, phase:'inst' });
  MAT.rock = M({ glow:.14, det:1, rim:.3 });
  MAT.pearl = M({ phong:true, shin:120, spec:0xffffff, glow:.75, vc:false, color:0xfff4fb });
  MAT.shell = M({ phong:true, shin:60, spec:0x888888, glow:.45 });
  MAT.star = M({ glow:.34 });
  MAT.horse = M({ side:T.DoubleSide, glow:.34 });
  MAT.bell = M({ side:T.DoubleSide, glow:.75, rim:1.1, opacity:.62, pulse:[.2, .42], phase:'attr' });
  MAT.tent = M({ glow:.75, opacity:.7, wave:[.13, 6], phase:'attr' });
  MAT.pearlGeo = new T.SphereGeometry(.2, 14, 10); MAT.shellGeo = shellGeo(); MAT.horseGeo = seahorseGeo(); MAT.starGeo = starGeo(); MAT.jelly = jellyGeos();
  [MAT.pearlGeo, MAT.shellGeo, MAT.horseGeo, MAT.starGeo, MAT.jelly[0], MAT.jelly[1]].forEach(g => { g.userData.keep = true; });
}
const PAL = {
  hard:[0xff4fa3, 0xff7a1a, 0xffd21f, 0xa24dff, 0x18d6c0, 0xff5148, 0x4d7dff, 0xb9f22e, 0xff8ad1],
  soft:[0xff5fb0, 0xff3b6b, 0xc86bff, 0xffa63d, 0xff7fd0],
  brain:[0xd6c24a, 0x7fd66a, 0xe89a4a, 0xd98ad0, 0x6fd0c4],
  fan:[0xff3b4e, 0xb44dff, 0xff8a1f, 0xff5fc0, 0xffd43b],
  anem:[0xff7fc4, 0x6dffb0, 0xc59bff, 0xffd08a],
  rock:[0x8f8597, 0xa08f86, 0x7f8f9a, 0xa58aa6],
  star:[0xff5a1f, 0xff2f4e, 0x3f7bff, 0xffb81f, 0xc04dff],
  jelly:[0xff9ad8, 0x9ad4ff, 0xc9a8ff, 0xa6ffe6]
};
const lin = h => tmpC.set(h).convertSRGBToLinear();
function scatter(geo, mat, n, o) {
  const im = new T.InstancedMesh(geo, mat, n), out = []; let k = 0, tries = 0;
  while (k < n && tries++ < n*60) { const a = rnd()*TAU, r = Math.sqrt(rnd())*(o.at ? o.at.r : (o.rmax || 64)), x = Math.cos(a)*r + (o.at ? o.at.x : 0), z = Math.sin(a)*r + (o.at ? o.at.z : 0), rk = Rg(x, z);
    if (rk < o.rock[0] || rk > o.rock[1]) continue; if (Math.hypot(x - START.x, z - START.z) < 3.5) continue;
    if (o.gap && out.some(p => Math.hypot(p.x - x, p.z - z) < o.gap)) continue;
    if (o.avoid && o.avoid.some(p => Math.hypot(p.x - x, p.z - z) < (o.avoidR || 2))) continue;
    const s = rr(o.s[0], o.s[1]), y = Hg(x, z) - (o.sink || 0)*s, tl = o.tilt == null ? .18 : o.tilt;
    dummy.position.set(x, y, z); dummy.rotation.set(rr(-tl, tl), rnd()*TAU, rr(-tl, tl)); dummy.scale.setScalar(s); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix);
    im.setColorAt(k, o.cols ? lin(pick(o.cols)) : tmpC.setRGB(1, 1, 1));
    if (o.coll) colliders.push({ x, z, r:o.coll*s, y0:y - 1, y1:y + (o.collH || 1)*s });
    out.push({ x, y, z, s }); k++; }
  im.count = k; im.frustumCulled = false; world.add(im); return out;
}
let pearlIM, shellIM, jellyIM = null;
function orbiter(obj, o) { let th = o.th == null ? rnd()*TAU : o.th, ph = 0; const d = o.dir || 1;
  return { p:obj.g.position, upd(dt, t) { th += d*o.sp/o.R*dt; ph += dt*o.sp*(o.phK || 1.2);
      const x = o.cx + Math.cos(th)*o.R, z = o.cz + Math.sin(th)*o.R*(o.ecc || 1); let y = o.y + Math.sin(th*(o.yF || 2) + 1)*(o.yA || 0); const fl = Hg(x, z) + (o.clear || 2.5); if (y < fl) y = fl; if (y > SURF - .9) y = SURF - .9;
      const vx = -Math.sin(th)*d, vz = Math.cos(th)*(o.ecc || 1)*d, vy = (y - obj.g.position.y);
      obj.g.position.set(x, y, z); obj.g.rotation.set(-clamp(vy*(o.pK || 8), -.6, .6), Math.atan2(vx, vz), d*-(o.bank || 0), 'YXZ'); obj.swim(ph, 1); } };
}
function buildWorld(sd) {
  mats();
  if (world) { scene.remove(world); world.traverse(o => { if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose(); }); }
  world = new T.Group(); scene.add(world);
  colliders = []; schools = []; movers = []; discover = []; items = []; fishIM = []; anemPos = []; ventList = [];
  seed = (sd*7919 + 13) | 0;
  buildTerrain();

  /* ukwiały — pierwszy tuż przed startem */
  const an = []; for (let z = 20; z > -4; z -= .5) if (Rg(1.5, z) > .5) { an.push({ x:1.5, z }); break; }
  let tr = 0; while (an.length < 9 && tr++ < 2000) { const a = rnd()*TAU, r = rr(8, 58), x = Math.cos(a)*r, z = Math.sin(a)*r, rk = Rg(x, z);
    if (rk > .5 && rk < .95 && !an.some(p => Math.hypot(p.x - x, p.z - z) < 13)) an.push({ x, z }); }
  const anIM = new T.InstancedMesh(anemoneGeo(), MAT.anem, an.length);
  an.forEach((p, i) => { p.s = rr(1.1, 1.5); p.y = Hg(p.x, p.z) - .08; dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, rnd()*TAU, 0); dummy.scale.setScalar(p.s); dummy.updateMatrix();
    anIM.setMatrixAt(i, dummy.matrix); anIM.setColorAt(i, lin(PAL.anem[i % PAL.anem.length])); anemPos.push(p); });
  anIM.frustumCulled = false; world.add(anIM);

  /* koralowce */
  const av = { avoid:an, avoidR:1.7 };
  scatter(branchGeo({ depth:3, kids:2, len:.5, rad:.085, spread:.75 }), MAT.coral, 52, { rock:[.35, 1], s:[1, 2.1], cols:PAL.hard, ...av });
  scatter(branchGeo({ depth:3, kids:2, len:.42, rad:.07, spread:.95 }), MAT.coral, 46, { rock:[.3, 1], s:[1.1, 2.3], cols:PAL.hard, ...av });
  scatter(branchGeo({ depth:3, kids:2, len:.45, rad:.1, spread:.7, tips:2.3 }), MAT.soft, 38, { rock:[.3, 1], s:[.9, 1.8], cols:PAL.soft, ...av });
  scatter(brainGeo(), MAT.brain, 46, { rock:[.35, 1], s:[.6, 1.7], cols:PAL.brain, sink:.2, coll:.95, collH:1.1, tilt:.1, ...av });
  scatter(tableGeo(), MAT.coral, 48, { rock:[.4, 1], s:[.8, 1.7], cols:PAL.hard, tilt:.12, ...av });
  scatter(tubesGeo(), MAT.coral, 56, { rock:[.3, 1], s:[.9, 1.8], cols:[0xb44dff, 0xffd21f, 0xff4fa3, 0x2fe0ff, 0xff8a1f], ...av });
  scatter(platesGeo(), MAT.coral, 50, { rock:[.35, 1], s:[.9, 1.9], cols:PAL.hard, ...av });
  scatter(nubGeo(), MAT.coral, 230, { rock:[.3, 1], s:[.8, 2], cols:PAL.hard, tilt:.3, ...av });
  scatter(pillarsGeo(), MAT.coral, 42, { rock:[.45, 1], s:[.9, 1.8], cols:[0xffd98a, 0xff9a6b, 0xd8ff7a, 0xffb3e0, 0x9ad4ff], coll:.5, collH:1.6, tilt:.08, ...av });
  const fans = scatter(setCol(new T.PlaneGeometry(1.7, 1.7, 1, 5).translate(0, .85, 0), [1, 1, 1]), MAT.fan, 50, { rock:[.3, 1], s:[.8, 1.9], cols:PAL.fan, tilt:.1, ...av });
  scatter(kelpGeo(), MAT.kelp, 46, { rock:[.06, .3], s:[.7, 1.4], tilt:.05 });
  scatter(grassGeo(), MAT.grass, 620, { rock:[0, .2], s:[.7, 1.6], tilt:.1 });
  scatter(rockGeo(), MAT.rock, 90, { rock:[.08, .7], s:[.3, 1.3], cols:PAL.rock, sink:.25, tilt:.5 });
  scatter(urchinGeo(), MAT.rock, 20, { rock:[.2, .7], s:[.7, 1.3], cols:[0x3a1f5c, 0x1c1c2c, 0x6a2a4a], tilt:.1 });
  const clams = scatter(clamGeo(), MAT.coral, N_CLAMS, { rock:[.3, .75], s:[.9, 1.4], tilt:.08, gap:14, sink:.15, coll:.8, collH:.6, ...av });
  const stars = scatter(MAT.starGeo, MAT.star, 14, { rock:[0, .45], s:[.28, .48], cols:PAL.star, tilt:.05, gap:6, sink:-.05 });
  stars.forEach(p => discover.push({ k:'star', r:3.6, p }));
  [0, 3, 6, 9, 12].forEach(i => { if (fans[i]) ventList.push({ x:fans[i].x + 1, y:fans[i].y, z:fans[i].z + 1 }); });
  for (let i = 0; i < 9; i++) { const a = rnd()*TAU, r = rr(6, 60), x = Math.cos(a)*r, z = Math.sin(a)*r; ventList.push({ x, y:Hg(x, z), z }); }

  /* wrak, skrzynia, las wodorostów */
  const spots = [], sandSpot = (r0, r1) => { let best = null, bs = 9; for (let i = 0; i < 260; i++) { const a = rnd()*TAU, r = rr(r0, r1), x = Math.cos(a)*r, z = Math.sin(a)*r; let s = Rg(x, z);
      for (let k = 0; k < 6; k++) s = Math.max(s, Rg(x + Math.cos(k)*7, z + Math.sin(k)*7)); if (spots.some(p => Math.hypot(p.x - x, p.z - z) < 24)) s += 2; if (Math.hypot(x - START.x, z - START.z) < 14) s += 2;
      if (s < bs) { bs = s; best = { x, z }; } } spots.push(best); return best; };
  const wk = sandSpot(30, 46), wreck = makeWreck(), wyaw = rnd()*TAU; wreck.position.set(wk.x, Hg(wk.x, wk.z) - 1.0, wk.z); wreck.rotation.set(.06, wyaw, .3); world.add(wreck);
  const cpx = wk.x + Math.cos(-wyaw)*4.6, cpz = wk.z + Math.sin(-wyaw)*4.6, chest = makeChest(), cpy = Hg(cpx, cpz) - .06; chest.g.position.set(cpx, cpy, cpz); chest.g.rotation.y = wyaw + 1.2; chest.g.scale.setScalar(1.25); world.add(chest.g);
  items.push({ kind:'pearl', x:cpx, y:cpy + .92, z:cpz }); ventList.push({ x:wk.x, y:Hg(wk.x, wk.z) + 1, z:wk.z });
  movers.push({ upd(dt) { if (chest.upd(Math.hypot(P.x - cpx, P.y - cpy, P.z - cpz) < 5, dt) && S.running) { sfx.chest(); toast('Skarb! Skrzynia się otworzyła'); for (let i = 0; i < 40; i++) sparks.emit(cpx, cpy + .8, cpz, (Math.random() - .5)*5, 1 + Math.random()*4, (Math.random() - .5)*5, .08 + Math.random()*.1, 1 + Math.random()); } } });
  const kf = sandSpot(26, 44); scatter(kelpGeo(), MAT.kelp, 64, { rock:[0, .4], s:[2.2, 3.7], tilt:.04, at:{ x:kf.x, z:kf.z, r:11 } });
  for (let i = 0; i < 3; i++) ventList.push({ x:kf.x + rr(-6, 6), y:Hg(kf.x, kf.z), z:kf.z + rr(-6, 6) });
  buildVents(ventList);

  /* perły i muszle */
  clams.forEach(c => items.push({ kind:'pearl', x:c.x, y:c.y + .78*c.s, z:c.z }));
  mounds.forEach(m => { let bx = m.x, bz = m.z, bh = -9; for (let i = 0; i < 40; i++) { const x = m.x + rr(-3, 3), z = m.z + rr(-3, 3), h = Hg(x, z); if (h > bh) { bh = h; bx = x; bz = z; } } m.top = { x:bx, y:bh, z:bz }; });
  mounds.slice().sort((a, b) => b.h - a.h).slice(0, N_PEARL_TOPS).forEach(m => items.push({ kind:'pearl', x:m.top.x + 1.8, y:m.top.y + 2.6, z:m.top.z }));
  tr = 0; const sh = []; while (sh.length < N_SHELLS && tr++ < 4000) { const a = rnd()*TAU, r = rr(8, 60), x = Math.cos(a)*r, z = Math.sin(a)*r;
    if (Rg(x, z) < .08 && !sh.some(p => Math.hypot(p.x - x, p.z - z) < 13)) { sh.push({ x, z }); items.push({ kind:'shell', x, y:Hg(x, z) + .12, z }); } }
  const np = items.filter(i => i.kind === 'pearl').length, ns = items.length - np;
  pearlIM = new T.InstancedMesh(MAT.pearlGeo, MAT.pearl, np); shellIM = new T.InstancedMesh(MAT.shellGeo, MAT.shell, ns); pearlIM.frustumCulled = shellIM.frustumCulled = false;
  let a = 0, b = 0; items.forEach(it => { it.got = false; it.rot = rnd()*TAU; it.idx = it.kind === 'pearl' ? a++ : b++; }); world.add(pearlIM, shellIM);
  buildGlints(items);

  /* ławice */
  const spec = [], cruise = (k, n, m, o = {}) => spec.push({ k, n, type:0, home:new V3(m.x, Math.max(m.top ? m.top.y : m.h, 2) + (o.up || rr(1.5, 4)), m.z), A:m.r + rr(1.5, 6), B:rr(1, 3), yA:rr(.5, 1.6), spd:o.spd || rr(1.3, 2.1), spread:o.spread || 1.1, disc:o.disc, dir:rnd() < .5 ? 1 : -1 });
  const hover = (k, n, x, y, z, spread, wob, disc) => spec.push({ k, n, type:1, home:new V3(x, y, z), spread, wob, disc });
  const M0 = mounds[0], ms = mounds.slice(1).sort(() => rnd() - .5); for (let i = 0; ms.length < 12; i++) ms.push(ms[i] || M0);
  cruise('blue', 12, M0, { disc:'blue', up:2.2 }); cruise('blue', 12, ms[0], { disc:'blue' });
  cruise('yellow', 14, ms[1], { disc:'yellow' }); cruise('yellow', 14, ms[2], { disc:'yellow' }); cruise('yellow', 10, M0, { disc:'yellow', up:4 });
  cruise('serg', 13, ms[3]); cruise('serg', 13, ms[4]); cruise('serg', 13, ms[5]);
  for (let i = 0; i < 4; i++) cruise('butt', 3, ms[6 + i], { spread:.5, up:1.2 });
  cruise('parrot', 1, M0, { up:1.6, spd:1.2 }); cruise('parrot', 1, ms[2], { up:1.5, spd:1.2 }); cruise('parrot', 1, ms[7], { up:1.5, spd:1.2 });
  [M0, ms[0], ms[3], ms[6], ms[9]].forEach(m => { if (m) hover('chrom', 16, m.top.x - 2, m.top.y + 1.6, m.top.z + 1, 1.5, .3); });
  [M0, ms[1], ms[4], ms[8], ms[10]].forEach(m => { if (m) hover('anth', 13, m.top.x + 2.5, m.top.y + .6, m.top.z - 1.5, 1.3, .25); });
  { let bb = null, bs = 9; for (let i = 0; i < 40; i++) { const a = rnd()*TAU, r = rr(16, 30), x = Math.cos(a)*r, z = Math.sin(a)*r, s = Rg(x, z); if (s < bs) { bs = s; bb = { x, z }; } }
    spec.push({ k:'sard', n:230, type:2, home:new V3(bb.x, Hg(bb.x, bb.z) + 6.5, bb.z), spread:3 }); }
  hover('anth', 14, wk.x, Hg(wk.x, wk.z) + 3.6, wk.z, 2.2, .3); hover('chrom', 14, kf.x, Hg(kf.x, kf.z) + 5, kf.z, 3.5, .35);
  an.forEach(p => hover('clown', 3, p.x, p.y + .95*p.s, p.z, .34*p.s, .22, 'clown'));
  const byK = {}; spec.forEach(s => { (byK[s.k] = byK[s.k] || []).push(s); });
  for (const k in byK) { const tot = byK[k].reduce((n, s) => n + s.n, 0), geo = speciesGeo(k).clone(), ph = new Float32Array(tot); geo.userData = {};
    for (let i = 0; i < tot; i++) ph[i] = rnd()*TAU; geo.setAttribute('aPh', new T.InstancedBufferAttribute(ph, 1));
    const im = new T.InstancedMesh(geo, speciesMat(k), tot); for (let i = 0; i < tot; i++) { const b = rr(.9, 1.12); im.setColorAt(i, tmpC.setRGB(b, b, b)); } im.frustumCulled = false; world.add(im); fishIM.push(im); let st = 0;
    byK[k].forEach(s => { s.im = im; s.start = st; st += s.n; s.off = new Float32Array(s.n*3); s.fl = new Float32Array(s.n*3); s.lag = new Float32Array(s.n); s.sc = new Float32Array(s.n);
      s.c = s.home.clone(); s.yaw = rnd()*TAU; s.fr = k === 'parrot' ? 2 : 2.6; s.p1 = rnd()*TAU; s.p2 = rnd()*TAU; s.p3 = rnd()*TAU; s.w2 = rr(.25, .5);
      for (let i = 0; i < s.n; i++) { s.off[i*3] = rr(-1, 1)*s.spread; s.off[i*3 + 1] = rr(-1, 1)*s.spread*.6; s.off[i*3 + 2] = rr(-1, 1)*s.spread; s.lag[i] = rr(0, s.n*.11); s.sc[i] = rr(.82, 1.2);
        if (s.type === 2) { const hh = rr(-1, 1)*s.spread*.72; s.off[i*3] = s.spread*Math.sqrt(Math.max(.05, 1 - Math.pow(hh/(s.spread*.78), 2)))*rr(.5, 1); s.off[i*3 + 1] = hh; s.off[i*3 + 2] = rnd()*TAU; s.lag[i] = rr(.75, 1.25); } }
      schools.push(s); if (s.disc) discover.push({ k:s.disc, r:s.disc === 'clown' ? 4.2 : 5.5, p:s.c }); }); }

  /* pojedyncze zwierzęta */
  const far = () => { const a = rnd()*TAU; return [Math.cos(a), Math.sin(a)]; };
  for (let i = 0; i < 2; i++) { const t = makeTurtle(); if (i) t.g.scale.setScalar(.8); world.add(t.g); const m = i ? ms[5] : M0;
    const o = orbiter(t, { cx:m.x, cz:m.z, R:m.r + 7 + i*3, y:m.h + 3 + i*2, yA:1.6, sp:1.5, phK:2.2, dir:i ? -1 : 1, bank:.12, ecc:.85 }); movers.push(o); discover.push({ k:'turtle', r:7, p:o.p }); }
  for (let i = 0; i < 2; i++) { const t = makeManta(); world.add(t.g); const o = orbiter(t, { cx:rr(-8, 8), cz:rr(-8, 8), R:26 + i*13, y:10.5 + i*2, yA:2, sp:2.6, phK:.75, dir:i ? -1 : 1, bank:.2, clear:4 }); movers.push(o); discover.push({ k:'manta', r:9, p:o.p }); }
  { const t = makeShark(); world.add(t.g); const o = orbiter(t, { cx:0, cz:0, R:47, y:8.5, yA:2.5, sp:3.2, phK:1.4, bank:.1, clear:3.5 }); movers.push(o); discover.push({ k:'shark', r:11, p:o.p }); }
  for (let i = 0; i < 2; i++) { const t = makePuffer(), m = ms[3 + i*4] || M0, g = t.g; world.add(g); let th = rnd()*TAU;
    movers.push({ p:g.position, upd(dt, tt) { th += dt*.12; const x = m.x + Math.cos(th)*(m.r + 1.5), z = m.z + Math.sin(th)*(m.r + 1.5), y = Hg(x, z) + 1.8 + Math.sin(tt*.6 + i)*.4;
        g.position.set(x, y, z); g.rotation.y = Math.atan2(-Math.sin(th), Math.cos(th)); t.puff(Math.hypot(P.x - x, P.y - y, P.z - z) < 3.6 ? 1 : 0, dt); } });
    discover.push({ k:'puffer', r:4.6, p:g.position }); }
  { const t = makeWhale(), wp = t.g.position; world.add(t.g); const o = orbiter(t, { cx:0, cz:0, R:57, y:10, yA:2, sp:2.1, phK:.85, dir:-1, bank:.05, clear:5, pK:3 }); let nx = 0;
    movers.push({ p:wp, upd(dt, tt) { o.upd(dt, tt); if (S.running && tt > nx && Math.hypot(P.x - wp.x, P.z - wp.z) < 36) { nx = tt + 13; sfx.whale(); } } }); discover.push({ k:'whale', r:15, p:wp }); }
  { const th0 = rnd()*TAU; for (let i = 0; i < 3; i++) { const t = makeDolphin(); if (i) t.g.scale.setScalar(.85); world.add(t.g);
      const o = orbiter(t, { cx:0, cz:0, R:30 + i*1.6, y:SURF - 2.5, yA:1.3, yF:7, sp:4.6, phK:2.2, th:th0 - i*.11, bank:.15, clear:2, pK:14 }); movers.push(o); discover.push({ k:'dolphin', r:8.5, p:o.p }); } }
  [ms[1], ms[4]].forEach((m, i) => { let bx = m.x, bz = m.z; for (let k = 0; k < 60; k++) { const a = rnd()*TAU, x = m.x + Math.cos(a)*m.r*.75, z = m.z + Math.sin(a)*m.r*.75, rk = Rg(x, z); if (rk > .45 && rk < .9) { bx = x; bz = z; break; } }
    const o = makeMoray(), gp = o.g.position; gp.set(bx, Hg(bx, bz) - .04, bz); o.g.rotation.y = Math.atan2(bx - m.x, bz - m.z); o.g.scale.setScalar(1.3); world.add(o.g);
    movers.push({ p:gp, upd(dt, t) { o.upd(Math.hypot(P.x - gp.x, P.y - gp.y, P.z - gp.z) < 7.5, dt, t + i*2); } }); discover.push({ k:'moray', r:4.6, p:gp }); });
  { const hs = [fans[1], fans[14], fans[27], fans[40]].filter(Boolean), im = new T.InstancedMesh(MAT.horseGeo, MAT.horse, hs.length); im.frustumCulled = false; world.add(im);
    hs.forEach((f, i) => { im.setColorAt(i, lin([0xffffff, 0xffd0e8, 0xd6ffd0, 0xffe0b0][i])); f.hp = { x:f.x + .6, y:f.y + 1.3, z:f.z + .5 }; discover.push({ k:'horse', r:4.2, p:f.hp }); });
    movers.push({ upd(dt, t) { hs.forEach((f, i) => { dummy.position.set(f.hp.x + Math.sin(t*.4 + i)*.25, f.hp.y + Math.sin(t*.9 + i*2)*.18, f.hp.z); dummy.rotation.set(Math.sin(t*.7 + i)*.12, t*.25 + i*2, 0); dummy.scale.setScalar(1.25); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }); im.instanceMatrix.needsUpdate = true; } }); }
  tr = 0; let nc = 0; while (nc < 4 && tr++ < 3000) { const a = rnd()*TAU, r = rr(6, 56), x0 = Math.cos(a)*r, z0 = Math.sin(a)*r, rk = Rg(x0, z0); if (rk < .04 || rk > .2) continue; nc++;
    const c = makeCrab(), dir = rnd()*TAU, ph = rnd()*9; world.add(c.g); const pp = c.g.position;
    movers.push({ p:pp, upd(dt, t) { const s = Math.sin(t*.35 + ph)*3, x = x0 + Math.cos(dir)*s, z = z0 + Math.sin(dir)*s; pp.set(x, Hg(x, z) - .03, z); c.g.rotation.y = -dir + Math.PI/2*0; c.walk(t*9*Math.abs(Math.cos(t*.35 + ph)) + ph); } });
    c.g.rotation.y = -dir; discover.push({ k:'crab', r:4, p:pp }); }
  [M0, ms[2]].forEach((m, i) => { const o = makeOcto(), tp = m.top; o.g.position.set(tp.x - 1.2, Hg(tp.x - 1.2, tp.z + .4) - .04, tp.z + .4); o.g.rotation.y = i*2 + .6; o.g.scale.setScalar(1.1); world.add(o.g);
    movers.push({ p:o.g.position, upd(dt, t) { o.react(Math.hypot(P.x - o.g.position.x, P.y - o.g.position.y, P.z - o.g.position.z) < 6.5, dt, t + i*3); } }); discover.push({ k:'octo', r:5.2, p:o.g.position }); });
  { const n = 9, [fx, fz] = far(), cx = fx*36, cz = fz*36, bg = MAT.jelly[0].clone(), tg = MAT.jelly[1].clone(), ph = new Float32Array(n); for (let i = 0; i < n; i++) ph[i] = rnd()*TAU;
    bg.userData = {}; tg.userData = {}; bg.setAttribute('aPh', new T.InstancedBufferAttribute(ph, 1)); tg.setAttribute('aPh', new T.InstancedBufferAttribute(ph, 1));
    const bi = new T.InstancedMesh(bg, MAT.bell, n), ti = new T.InstancedMesh(tg, MAT.tent, n); bi.frustumCulled = ti.frustumCulled = false; bi.renderOrder = 3; ti.renderOrder = 2; world.add(ti, bi);
    const js = []; for (let i = 0; i < n; i++) { const j = { x:cx + rr(-6, 6), z:cz + rr(-6, 6), y:rr(7, 13), s:rr(.8, 1.7), p:new V3() }; js.push(j); lin(PAL.jelly[i % 4]); bi.setColorAt(i, tmpC); ti.setColorAt(i, tmpC); discover.push({ k:'jelly', r:5.5, p:j.p }); }
    movers.push({ upd(dt, t) { js.forEach((j, i) => { j.p.set(j.x + Math.sin(t*.13 + i)*1.5, j.y + Math.sin(t*.35 + ph[i])*1.4, j.z + Math.cos(t*.11 + i*2)*1.5);
        dummy.position.copy(j.p); dummy.rotation.set(Math.sin(t*.3 + i)*.15, i, Math.cos(t*.27 + i)*.15); dummy.scale.setScalar(j.s); dummy.updateMatrix(); bi.setMatrixAt(i, dummy.matrix); ti.setMatrixAt(i, dummy.matrix); });
        bi.instanceMatrix.needsUpdate = ti.instanceMatrix.needsUpdate = true; } }); }
}

const _a = new V3(), _b = new V3();
function pathAt(s, t, out) { const a = t/s.A*s.dir + s.p1, b = t*s.w2 + s.p2;
  out.set(s.home.x + s.A*Math.sin(a) + s.B*Math.sin(b), s.home.y + s.yA*Math.sin(t*.21 + s.p3), s.home.z + s.A*Math.cos(a) + s.B*Math.cos(b*1.3)); }
function updSchools(dt, t) {
  const dec = Math.exp(-dt*.9);
  for (const s of schools) { const im = s.im, fr = s.fr, fr2 = fr*fr;
    if (s.type === 0) { pathAt(s, t*s.spd, s.c); const f = Hg(s.c.x, s.c.z) + 1; if (s.c.y < f) s.c.y = f; }
    else if (s.type === 2) s.c.set(s.home.x + Math.sin(t*.07 + s.p1)*6, s.home.y + Math.sin(t*.11 + s.p2)*1.3, s.home.z + Math.cos(t*.06 + s.p3)*6);
    for (let i = 0; i < s.n; i++) { const o = i*3; let x, y, z, yaw, pitch = 0;
      if (s.type === 0) { const tt = t*s.spd - s.lag[i]; pathAt(s, tt, _a); pathAt(s, tt + .15, _b);
        x = _a.x + s.off[o]; y = _a.y + s.off[o + 1] + Math.sin(t*1.3 + i)*.1; z = _a.z + s.off[o + 2];
        const dx = _b.x - _a.x, dy = _b.y - _a.y, dz = _b.z - _a.z; yaw = Math.atan2(dx, dz); pitch = Math.atan2(dy, Math.hypot(dx, dz));
      } else if (s.type === 2) { const a = s.off[o + 2] + t*s.lag[i], r = s.off[o]*(1 + .14*Math.sin(t*.9 + i)); x = s.c.x + Math.cos(a)*r; y = s.c.y + s.off[o + 1] + Math.sin(t*.8 + i)*.15; z = s.c.z + Math.sin(a)*r; yaw = Math.atan2(-Math.sin(a), Math.cos(a));
      } else { const w = t*.6 + i*1.7; x = s.home.x + s.off[o] + Math.sin(w)*s.wob; y = s.home.y + s.off[o + 1] + Math.sin(w*1.3 + i)*s.wob*.6; z = s.home.z + s.off[o + 2] + Math.cos(w*.8 + i)*s.wob;
        yaw = s.yaw + Math.sin(t*.35 + i*2.1)*1.4; }
      let fx = s.fl[o], fy = s.fl[o + 1], fz = s.fl[o + 2];
      const dx = x + fx - P.x, dy = y + fy - P.y, dz = z + fz - P.z, d2 = dx*dx + dy*dy + dz*dz;
      if (d2 < fr2 && d2 > 1e-4) { const d = Math.sqrt(d2), k = (1 - d/fr)*dt*16/d; fx += dx*k; fy += dy*k*.6; fz += dz*k; }
      fx *= dec; fy *= dec; fz *= dec; s.fl[o] = fx; s.fl[o + 1] = fy; s.fl[o + 2] = fz;
      x += fx; y += fy; z += fz; const flr = Hg(x, z) + .3; if (y < flr) y = flr; if (y > SURF - .6) y = SURF - .6;
      const fm = fx*fx + fz*fz; if (fm > .3) yaw = Math.atan2(fx, fz);
      dummy.position.set(x, y, z); dummy.rotation.set(-pitch, yaw, 0, 'YXZ'); dummy.scale.setScalar(s.sc[i]); dummy.updateMatrix(); im.setMatrixAt(s.start + i, dummy.matrix); } }
  for (const im of fishIM) im.instanceMatrix.needsUpdate = true;
}
function updItems(t) {
  for (const it of items) { if (it.got) continue;
    if (it.kind === 'pearl') { dummy.position.set(it.x, it.y + Math.sin(t*1.6 + it.rot)*.07, it.z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); pearlIM.setMatrixAt(it.idx, dummy.matrix); }
    else { dummy.position.set(it.x, it.y + .12 + Math.sin(t*1.2 + it.rot)*.05, it.z); dummy.rotation.set(.3, it.rot + t*.5, .25); dummy.scale.setScalar(1.5); dummy.updateMatrix(); shellIM.setMatrixAt(it.idx, dummy.matrix); } }
  pearlIM.instanceMatrix.needsUpdate = shellIM.instanceMatrix.needsUpdate = true;
}

/* =====================================================================
   ALBUM: miniatury z modeli 3D
   ===================================================================== */
const ANIMALS = [
  ['clown', 'Błazenek', 'Mieszka w ukwiale'], ['turtle', 'Żółw morski', 'Pływa powoli nad rafą'], ['manta', 'Płaszczka', 'Szybuje wysoko jak ptak'],
  ['octo', 'Ośmiornica', 'Siedzi na czubku skały'], ['shark', 'Rekin', 'Krąży daleko. Jest łagodny'], ['jelly', 'Meduza', 'Świeci w toni'],
  ['blue', 'Pokolec niebieski', 'Pływa w gromadce'], ['yellow', 'Pokolec żółty', 'Żółty jak cytryna'], ['star', 'Rozgwiazda', 'Leży na piasku'],
  ['crab', 'Krab', 'Chodzi bokiem po dnie'], ['horse', 'Konik morski', 'Chowa się przy wachlarzach'], ['puffer', 'Najeżka', 'Nadyma się, gdy podpłyniesz'],
  ['whale', 'Wieloryb', 'Wielki cień daleko od rafy'], ['dolphin', 'Delfin', 'Pędzi tuż pod powierzchnią'], ['moray', 'Murena', 'Wygląda z dziury w skale']
];
const thumbs = {}, found = {};
function makeThumbs() {
  mats();
  const sc = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .05, 100), fog0 = U.uFogD.value, t0 = U.uTime.value;
  sc.background = new T.Color(0x18a5cc); sc.add(new T.HemisphereLight(0xdffaff, 0x2a78a8, 1.05)); const dl = new T.DirectionalLight(0xfff6e0, .8); dl.position.set(2, 4, 3); sc.add(dl);
  U.uFogD.value = 1e-4; U.uTime.value = 2.2;
  const one = (g, m, c) => { const im = new T.InstancedMesh(g, m, 1); im.setMatrixAt(0, new T.Matrix4()); im.setColorAt(0, c ? lin(c) : tmpC.setRGB(1, 1, 1)); im.frustumCulled = false; return im; };
  const mk = { clown:() => { const o = makeClown(); o.swim(1, 1); return o.g; }, turtle:() => { const o = makeTurtle(); o.swim(.8, 1); return o.g; }, manta:() => { const o = makeManta(); o.swim(1.2); return o.g; },
    octo:() => { const o = makeOcto(); o.react(true, 1, 0); o.react(true, .2, 0); return o.g; }, shark:() => { const o = makeShark(); o.swim(.5); return o.g; },
    jelly:() => { const g = new T.Group(); g.add(one(MAT.jelly[1], MAT.tent, PAL.jelly[0]), one(MAT.jelly[0], MAT.bell, PAL.jelly[0])); return g; },
    blue:() => one(speciesGeo('blue'), speciesMat('blue')), yellow:() => one(speciesGeo('yellow'), speciesMat('yellow')),
    star:() => { const m = one(MAT.starGeo, MAT.star, PAL.star[0]); m.rotation.x = 1.0; return m; }, crab:() => makeCrab().g,
    horse:() => { const m = one(MAT.horseGeo, MAT.horse, 0xffffff); m.rotation.y = -1.2; return m; }, puffer:() => { const o = makePuffer(); o.puff(1, 1); o.puff(1, 1); return o.g; },
    whale:() => makeWhale().g, dolphin:() => makeDolphin().g, moray:() => { const o = makeMoray(); o.upd(true, 5, 0); o.upd(true, 5, 0); return o.g; } };
  renderer.setPixelRatio(1); renderer.setSize(160, 160, false);
  const box = new T.Box3(), sp = new T.Sphere();
  for (const [k] of ANIMALS) { const o = mk[k](); sc.add(o); o.updateMatrixWorld(true); box.makeEmpty();
    o.traverse(ch => { if (ch.geometry) { ch.geometry.computeBoundingBox(); box.union(ch.geometry.boundingBox.clone().applyMatrix4(ch.matrixWorld)); } });
    box.getBoundingSphere(sp); const d = sp.radius*(k === 'manta' ? 2.9 : 3.5);
    const dir = k === 'star' || k === 'crab' || k === 'octo' ? _a.set(.25, .6, 1) : k === 'jelly' ? _a.set(.3, .1, 1) : k === 'manta' ? _a.set(.5, .75, 1) : _a.set(1, .28, .75);
    cam.position.copy(sp.center).addScaledVector(dir.normalize(), d); cam.lookAt(sp.center); renderer.render(sc, cam);
    thumbs[k] = cv.toDataURL('image/jpeg', .86); sc.remove(o); o.traverse(ch => { if (ch.geometry && !ch.geometry.userData.keep) ch.geometry.dispose(); }); }
  U.uFogD.value = fog0; U.uTime.value = t0;
}

/* =====================================================================
   DŹWIĘK (wszystko syntetyczne)
   ===================================================================== */
const AU = { ctx:null, master:null, mus:null, next:0 };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try {
    const c = AU.ctx = new AC(); AU.master = c.createGain(); AU.master.gain.value = S.muted ? 0 : .85; AU.master.connect(c.destination);
    const len = c.sampleRate*4, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .02*(Math.random()*2 - 1))/1.02; d[i] = last*3.5; }
    for (let i = 0; i < 4000; i++) { const k = i/4000; d[len - 4000 + i] = d[len - 4000 + i]*(1 - k) + d[i]*k; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const g = c.createGain(); g.gain.value = .55; src.connect(lp); lp.connect(g); g.connect(AU.master); src.start();
    const lfo = c.createOscillator(); lfo.frequency.value = .09; const lg = c.createGain(); lg.gain.value = 150; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const dly = c.createDelay(1); dly.delayTime.value = .44; const fb = c.createGain(); fb.gain.value = .4; dly.connect(fb); fb.connect(dly);
    const dg = c.createGain(); dg.gain.value = .55; dly.connect(dg); dg.connect(AU.master);
    AU.mus = c.createGain(); AU.mus.gain.value = .5; AU.mus.connect(AU.master); AU.mus.connect(dly);
  } catch (e) { AU.ctx = null; }
}
function tone(f, dur, type, vol, f2, when = 0, atk = .01, dest) {
  const c = AU.ctx; if (!c || S.muted) return; const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AU.master); o.start(t); o.stop(t + dur + .05);
}
const SCALE = [196, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784];
function music(t) { if (!AU.ctx || t < AU.next) return; AU.next = t + .7 + Math.random()*1.8;
  const f = SCALE[Math.floor(Math.random()*SCALE.length)]; tone(f, 2.6, 'sine', .11, 0, 0, .25, AU.mus); if (Math.random() < .35) tone(f*1.5, 2.2, 'triangle', .04, 0, .3, .3, AU.mus);
  if (Math.random() < .2) tone(98, 4, 'sine', .1, 0, 0, 1, AU.mus); }
const sfx = {
  blip() { const f = 500 + Math.random()*500; tone(f, .09, 'sine', .05, f*2); },
  pearl() { [1318, 1760, 2093, 2637].forEach((f, i) => tone(f, .35, 'triangle', .12, 0, i*.07, .01, AU.mus)); },
  shell() { [784, 1047, 1568].forEach((f, i) => tone(f, .3, 'sine', .14, 0, i*.08, .01, AU.mus)); },
  found() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .5, 'triangle', .13, 0, i*.11, .02, AU.mus)); tone(2093, .9, 'sine', .06, 0, .6, .05, AU.mus); },
  dash() { tone(320, .5, 'sine', .14, 90); for (let i = 0; i < 5; i++) { const f = 600 + Math.random()*700; tone(f, .08, 'sine', .05, f*1.8, i*.06); } },
  whale() { tone(170, 2.8, 'sine', .17, 82, 0, .7, AU.mus); tone(310, 2, 'sine', .07, 520, 1.3, .6, AU.mus); tone(120, 2.4, 'sine', .12, 190, 3, .8, AU.mus); },
  dolphin() { for (let i = 0; i < 6; i++) tone(2100 + Math.random()*900, .13, 'sine', .06, 3700, i*.09, .01, AU.mus); },
  chest() { [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .7, 'triangle', .13, 0, i*.09, .02, AU.mus)); },
  win() { [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .6, 'triangle', .13, 0, i*.16, .02, AU.mus)); }
};

/* =====================================================================
   GRACZ, STEROWANIE
   ===================================================================== */
const P = { x:START.x, y:START.y, z:START.z, yaw:Math.PI, v:0, vy:0, pitch:0, roll:0, ph:0, dash:0, auto:true, who:null, m:null, spec:null };
function setPlayer(who) {
  if (P.m) { scene.remove(P.m.g); P.m.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  P.m = who === 'turtle' ? makeTurtle() : makeClown(); P.who = who; scene.add(P.m.g);
  P.spec = who === 'turtle' ? { maxF:4.4, maxR:1.2, turn:1.8, vy:2.7, rad:.5, grab:2.1 } : { maxF:5.4, maxR:1.6, turn:2.5, vy:3.3, rad:.3, grab:1.8 };
}
function resetPlayer() { P.x = START.x; P.z = START.z; P.y = Math.max(START.y, Hg(START.x, START.z) + 2.5); P.yaw = Math.PI; P.v = P.vy = P.pitch = P.roll = 0; P.auto = true; camH = P.yaw; camSnap = true; }

const keys = { up:0, down:0, left:0, right:0, rise:0, dive:0 };
const ARROW = '<svg viewBox="0 0 40 40" width="56%" height="56%" aria-hidden="true"><path d="M20 6 L35 30 Q36 33 32 33 L8 33 Q4 33 5 30 Z" fill="currentColor"/></svg>';
[['pU', 0], ['pR', 90], ['pD', 180], ['pL', 270]].forEach(([id, r]) => { $(id).innerHTML = ARROW; $(id).firstChild.style.transform = `rotate(${r}deg)`; });
$('pUp').innerHTML = ARROW + '<small>góra</small>'; $('pDn').innerHTML = ARROW + '<small>dół</small>'; $('pDn').firstChild.style.transform = 'rotate(180deg)';
['pUp', 'pDn'].forEach(id => { $(id).firstChild.setAttribute('width', '44%'); $(id).firstChild.setAttribute('height', '44%'); });
document.querySelectorAll('[data-k]').forEach(b => { const k = b.dataset.k;
  const dn = e => { e.preventDefault(); keys[k] = 1; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) {} };
  const up = () => { keys[k] = 0; b.classList.remove('on'); };
  b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up); });
const KEYMAP = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', a:'left', d:'right', w:'rise', s:'dive', q:'rise', e:'dive', PageUp:'rise', PageDown:'dive' };
addEventListener('keydown', e => { const k = KEYMAP[e.key]; if (k) { keys[k] = 1; e.preventDefault(); }
  else if (S.running && !e.repeat) { if (e.key === ' ') { e.preventDefault(); dash(); } else if (e.key === 'c') nextCam(); else if (e.key === 'm') openAlbum(); } });
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = 0; });
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });
document.addEventListener('touchmove', e => { if (S.running) e.preventDefault(); }, { passive:false });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

/* przechylanie telefonu */
const tilt = { on:false, x:0, y:0, cal:true, r0:0, f0:0, events:0, listening:false };
function onTilt(e) {
  if (e.beta == null || e.gamma == null) return; tilt.events++;
  const so = screen.orientation, ang = so && typeof so.angle === 'number' ? so.angle : (window.orientation || 0);
  let right, fwd;
  if (ang === 90) { right = e.beta; fwd = e.gamma; }
  else if (ang === 270 || ang === -90) { right = -e.beta; fwd = -e.gamma; }
  else if (ang === 180) { right = -e.gamma; fwd = e.beta; }
  else { right = e.gamma; fwd = -e.beta; }
  if (tilt.cal) { tilt.r0 = right; tilt.f0 = fwd; tilt.cal = false; }
  tilt.x = clamp((right - tilt.r0)/18, -1, 1); tilt.y = clamp((fwd - tilt.f0)/18, -1, 1);
}

addEventListener('orientationchange', () => { tilt.cal = true; });
function readInput() {
  let x = keys.right - keys.left, y = keys.up - keys.down, v = keys.rise - keys.dive;
  if (tilt.on) { let tx = tilt.x, ty = tilt.y; if (Math.abs(tx) < .18) tx = 0; if (Math.abs(ty) < .18) ty = 0;
    if (S.cam === 0) { x += tx; y += ty; } else { x += tx; v -= ty; if (P.auto) y += 1; } }
  return [clamp(x, -1, 1), clamp(y, -1, 1), clamp(v, -1, 1)];
}
function dash() { if (!S.running || P.dash > -.6) return; P.dash = .9; sfx.dash();
  for (let i = 0; i < 26; i++) bubbles.emit(P.x + (Math.random() - .5)*.6, P.y + (Math.random() - .5)*.5, P.z + (Math.random() - .5)*.6, (Math.random() - .5)*2 - Math.sin(P.yaw)*2, Math.random()*1.5, (Math.random() - .5)*2 - Math.cos(P.yaw)*2, .05 + Math.random()*.1, 1.2 + Math.random()); }

let dustT = 0;
const shadow = new T.Mesh(new T.CircleGeometry(1, 20).rotateX(-Math.PI/2), new T.MeshBasicMaterial({ transparent:true, depthWrite:false, color:0x00122a, opacity:.4,
  map:canvasTex(64, (g, N) => { const gr = g.createRadialGradient(N/2, N/2, 0, N/2, N/2, N/2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, N, N); }) }));
shadow.renderOrder = 1; scene.add(shadow);
const MOODS = {
  day:   { deep:[0, .09, .27], mid:[.02, .43, .72], shal:[.30, .82, .90], sunC:[.30, .34, .26], ray:[.72, 1, .93], sky:[.55, .93, 1], hemi:[0xc8f6ff, 0x2a6ea6, .78], sun:[0xfff3d6, .6], caus:1.5, glow:1, fog:.03 },
  sunset:{ deep:[.05, .04, .2], mid:[.24, .27, .55], shal:[1, .6, .38], sunC:[.75, .36, .12], ray:[1, .7, .42], sky:[1, .74, .48], hemi:[0xffd4b8, 0x3a4f96, .7], sun:[0xffa860, .6], caus:1.4, glow:1.2, fog:.031 },
  night: { deep:[0, .01, .05], mid:[.01, .06, .2], shal:[.05, .2, .42], sunC:[.12, .17, .28], ray:[.4, .58, 1], sky:[.22, .38, .75], hemi:[0x8fb0ff, 0x0a1840, .3], sun:[0xbcd0ff, .16], caus:.6, glow:2.1, fog:.034 }
};
function setMood(k) { const m = MOODS[k] || MOODS.day; U.uDeep.value.fromArray(m.deep); U.uMid.value.fromArray(m.mid); U.uShal.value.fromArray(m.shal); U.uSunC.value.fromArray(m.sunC); U.uRayC.value.fromArray(m.ray); U.uSkyC.value.fromArray(m.sky);
  hemi.color.set(m.hemi[0]); hemi.groundColor.set(m.hemi[1]); hemi.intensity = m.hemi[2]; sun.color.set(m.sun[0]); sun.intensity = m.sun[1]; U.uCausI.value = m.caus; U.uGlowK.value = m.glow; U.uFogD.value = m.fog;
  const x = { day:[[.3, .7, .85], .42, .8], sunset:[[.9, .55, .36], .5, .74], night:[[.22, .4, .95], .75, .6] }[k] || [[.3, .7, .85], .42, .8]; U.uRimC.value.fromArray(x[0]); POST.set(x[1], x[2]); }
let time = 0, bubT = 0, edgeT = 0, checkT = 0, won = false, winT = 0, total = { pearl:0, shell:0 }, got = { pearl:0, shell:0 }, nFound = 0;
function updPlayer(dt) {
  const [ix, iy, iv] = readInput(), sp = P.spec, rel = S.cam !== 0, yaw0 = P.yaw; let thr = 0;
  if (!rel) { const m = Math.hypot(ix, iy);
    if (m > .2) { const d = wrap(Math.atan2(ix, -iy) - P.yaw); P.yaw = wrap(P.yaw + clamp(d, -sp.turn*1.7*dt, sp.turn*1.7*dt)); thr = Math.min(1, m)*(Math.abs(d) > 1.5 ? .35 : 1); }
  } else { P.yaw = wrap(P.yaw - ix*sp.turn*dt); thr = Math.abs(iy) > .15 ? iy : 0; }
  P.dash -= dt; const boost = P.dash > 0; if (boost && thr >= 0) thr = 1;
  const tv = thr > 0 ? thr*sp.maxF*(boost ? 1.9 : 1) : thr*sp.maxR;
  P.v += (tv - P.v)*Math.min(1, dt*(thr ? 2.6 : 1.5)); P.vy += (iv*sp.vy - P.vy)*Math.min(1, dt*4);
  P.x += Math.sin(P.yaw)*P.v*dt; P.z += Math.cos(P.yaw)*P.v*dt; P.y += P.vy*dt;
  const r = Math.hypot(P.x, P.z); if (r > EDGE) { P.x *= EDGE/r; P.z *= EDGE/r; if (time > edgeT) { edgeT = time + 6; toast('Tam jest głębia. Wracamy na rafę!'); } }
  for (const c of colliders) { if (P.y < c.y0 || P.y > c.y1 + sp.rad) continue; const dx = P.x - c.x, dz = P.z - c.z, rr2 = c.r + sp.rad, d2 = dx*dx + dz*dz;
    if (d2 < rr2*rr2 && d2 > 1e-6) { const d = Math.sqrt(d2); P.x = c.x + dx/d*rr2; P.z = c.z + dz/d*rr2; } }
  const f = Hg(P.x, P.z) + sp.rad + .12; if (P.y < f) { P.y = f; if (P.vy < 0) P.vy = 0; if (Math.abs(P.v) > 1.2 && time > dustT && Rg(P.x, P.z) < .3) { dustT = time + .1; dust.emit(P.x, f - sp.rad, P.z, (Math.random() - .5)*.8, .25 + Math.random()*.3, (Math.random() - .5)*.8, .5 + Math.random()*.5, 1.5); } } if (P.y > SURF - 1) { P.y = SURF - 1; if (P.vy > 0) P.vy = 0; }
  P.pitch += (Math.atan2(P.vy, Math.max(Math.abs(P.v), 2.2))*.9 - P.pitch)*Math.min(1, dt*5);
  P.roll += (clamp(wrap(P.yaw - yaw0)/Math.max(dt, .001)*-.22, -.5, .5) - P.roll)*Math.min(1, dt*5);
  const av = Math.abs(P.v); P.ph += dt*(3.5 + av*2.4 + (boost ? 8 : 0));
  if (boost) for (let i = 0; i < 2; i++) bubbles.emit(P.x - Math.sin(P.yaw)*P.m.len*.5 + (Math.random() - .5)*.3, P.y + (Math.random() - .5)*.3, P.z - Math.cos(P.yaw)*P.m.len*.5 + (Math.random() - .5)*.3, (Math.random() - .5)*.6, .3, (Math.random() - .5)*.6, .03 + Math.random()*.06, 1 + Math.random()*.8);
  bubT -= dt*(1 + av); if (bubT < 0 && S.cam !== 2) { bubT = .9; if (av > 1) { bubbles.emit(P.x - Math.sin(P.yaw)*P.m.len*.4, P.y + .05, P.z - Math.cos(P.yaw)*P.m.len*.4, (Math.random() - .5)*.4, .5, (Math.random() - .5)*.4, .03 + Math.random()*.05, 1.6); if (Math.random() < .3) sfx.blip(); } }
  /* zbieranie */
  const g2 = sp.grab*sp.grab;
  for (let i = 0; i < items.length; i++) { const it = items[i]; if (it.got) continue; const dx = it.x - P.x, dy = it.y - P.y, dz = it.z - P.z;
    if (dx*dx + dy*dy + dz*dz < g2) collect(it, i); }
  checkT -= dt; if (checkT < 0) { checkT = .2;
    for (const d of discover) { if (found[d.k]) continue; const dx = d.p.x - P.x, dy = d.p.y - P.y, dz = d.p.z - P.z; if (dx*dx + dy*dy + dz*dz < d.r*d.r) { reveal(d.k); break; } } }
}
function poseP() { const m = P.m; m.swim(P.ph, clamp(.3 + Math.abs(P.v)/P.spec.maxF, 0, 1.4)); m.g.position.set(P.x, P.y, P.z); m.g.rotation.y = P.yaw; m.inner.rotation.set(-P.pitch, 0, P.roll);
  const gy = Hg(P.x, P.z), hh = P.y - gy, ss = m.len*(.75 + hh*.1); shadow.position.set(P.x, gy + .1, P.z); shadow.scale.set(ss, 1, ss); shadow.material.opacity = clamp(.5 - hh*.04, 0, .5)*(S.mood === 'night' ? .4 : 1); }
function collect(it, i) {
  it.got = true; got[it.kind]++; hideGlint(i); dummy.position.set(0, -99, 0); dummy.scale.setScalar(.001); dummy.updateMatrix();
  (it.kind === 'pearl' ? pearlIM : shellIM).setMatrixAt(it.idx, dummy.matrix);
  for (let k = 0; k < 16; k++) { const a = Math.random()*TAU, b = Math.random()*2 - 1, s = Math.sqrt(1 - b*b), v = 1.5 + Math.random()*2; sparks.emit(it.x, it.y, it.z, Math.cos(a)*s*v, b*v + 1, Math.sin(a)*s*v, .08 + Math.random()*.1, .7 + Math.random()*.6); }
  it.kind === 'pearl' ? sfx.pearl() : sfx.shell(); hud(it.kind === 'pearl' ? 'sPearl' : 'sShell'); checkWin();
}
let foundQ = [], foundT = 0;
function reveal(k) { if (found[k]) return; if (k === 'dolphin') sfx.dolphin(); found[k] = true; nFound++; foundQ.push(k); hud('bAlbum'); checkWin(); }
function checkWin() { if (!won && got.pearl >= total.pearl && got.shell >= total.shell && nFound >= ANIMALS.length) { won = true; winT = 0; } }

/* =====================================================================
   KAMERA
   ===================================================================== */
const wantPos = new V3(), wantLook = new V3(), camLook = new V3(0, 4, -5); let camH = Math.PI, camSnap = true, curFov = 0;
const lookA = { id:null, x:0, y:0, yaw:0, pitch:0 };
cv.addEventListener('pointerdown', e => { if (!S.running || S.cam === 0 || lookA.id !== null) return; lookA.id = e.pointerId; lookA.x = e.clientX; lookA.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
cv.addEventListener('pointermove', e => { if (e.pointerId !== lookA.id) return; lookA.yaw = clamp(lookA.yaw - (e.clientX - lookA.x)*.006, -2.4, 2.4); lookA.pitch = clamp(lookA.pitch + (e.clientY - lookA.y)*.005, -.9, .9); lookA.x = e.clientX; lookA.y = e.clientY; });
const lookEnd = e => { if (e.pointerId === lookA.id) lookA.id = null; };
cv.addEventListener('pointerup', lookEnd); cv.addEventListener('pointercancel', lookEnd);
function updCam(dt) {
  const portrait = innerHeight > innerWidth; let fov = 62, kp = Math.min(1, dt*5), kl = Math.min(1, dt*6);
  if (lookA.id === null) { const k = Math.exp(-dt*2.2); lookA.yaw *= k; lookA.pitch *= k; }
  if (S.menu === 'start' && !S.running) { const a = time*.07 + 2.6; wantPos.set(Math.sin(a)*23, 0, -5 + Math.cos(a)*23); wantPos.y = Math.max(8 + Math.sin(a*1.7)*1.5, Hg(wantPos.x, wantPos.z) + 2);
    wantLook.set(0, 5.5, -5); fov = portrait ? 72 : 56; kp = kl = 1; }
  else if (S.cam === 0) { const hh = (portrait ? 12 : 8.5)*(P.who === 'turtle' ? 1.25 : 1); wantPos.set(P.x, Math.min(P.y + hh, SURF - .5), P.z + hh*.55); wantLook.set(P.x, P.y, P.z - .8); fov = 58; }
  else if (S.cam === 1) { camH += wrap(P.yaw - camH)*Math.min(1, dt*3.2); const h = camH + lookA.yaw, back = P.m.camBack*(portrait ? 1.25 : 1);
    wantPos.set(P.x - Math.sin(h)*back, P.y + P.m.camUp + lookA.pitch*2.2 - P.pitch*1.4, P.z - Math.cos(h)*back);
    wantPos.y = clamp(wantPos.y, Hg(wantPos.x, wantPos.z) + .5, SURF - .35);
    wantLook.set(P.x + Math.sin(camH)*1.6, P.y + .25 + P.pitch*1.6, P.z + Math.cos(camH)*1.6); fov = portrait ? 76 : 62; }
  else { const h = P.yaw + lookA.yaw, pt = P.pitch*.85 - lookA.pitch, e = P.m.eye;
    wantPos.set(P.x + Math.sin(P.yaw)*e, P.y + .07, P.z + Math.cos(P.yaw)*e);
    wantLook.set(wantPos.x + Math.sin(h)*Math.cos(pt)*6, wantPos.y + Math.sin(pt)*6, wantPos.z + Math.cos(h)*Math.cos(pt)*6); fov = portrait ? 86 : 74; kp = 1; kl = Math.min(1, dt*16); }
  if (camSnap) { kp = kl = 1; camSnap = false; }
  camera.position.lerp(wantPos, kp); camLook.lerp(wantLook, kl); camera.up.set(0, 1, 0); camera.lookAt(camLook);
  if (S.cam === 2 && S.running) camera.rotateZ(-P.roll*.5);
  if (fov !== curFov) { curFov = fov; camera.fov = fov; camera.updateProjectionMatrix(); setPx(); }
  if (P.m) P.m.g.visible = !(S.cam === 2 && (S.running || S.menu !== 'start'));
  dome.position.copy(camera.position);
}
function setPx() { U.uPx.value = renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360)); }
function resize() { renderer.setPixelRatio(PR); renderer.setSize(innerWidth, innerHeight, false); POST.resize(); camera.aspect = innerWidth/Math.max(1, innerHeight); camera.updateProjectionMatrix(); setPx(); }
addEventListener('resize', resize);

/* =====================================================================
   HUD, MENU, ALBUM
   ===================================================================== */
const CAM_NAMES = ['z góry', 'z tyłu', 'oczami'];
let toastT = 0;
function toast(msg, ms = 3200) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function hud(bump) {
  $('nPearl').textContent = got.pearl; $('tPearl').textContent = '/' + total.pearl; $('nShell').textContent = got.shell; $('tShell').textContent = '/' + total.shell; $('nAlbum').textContent = nFound; $('tAlbum').textContent = '/' + ANIMALS.length;
  $('camLbl').textContent = CAM_NAMES[S.cam]; $('stopIco').textContent = P.auto ? '✋' : '🏊'; $('stopLbl').textContent = P.auto ? 'stój' : 'płyń';
  if (bump) { const el = $(bump); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}
function nextCam() { S.cam = (S.cam + 1) % 3; lookA.yaw = lookA.pitch = 0; camSnap = S.cam === 2; camH = P.yaw; hud(); }
function updFound(dt) { foundT -= dt; const el = $('found');
  if (foundT <= 0 && foundQ.length && S.running) { const k = foundQ.shift(), a = ANIMALS.find(x => x[0] === k); $('foundImg').src = thumbs[k] || ''; $('foundName').textContent = a[1]; el.classList.add('show'); foundT = 3.4; sfx.found();
    for (let i = 0; i < 14; i++) sparks.emit(P.x, P.y + .3, P.z, (Math.random() - .5)*5, 1 + Math.random()*3.5, (Math.random() - .5)*5, .07 + Math.random()*.09, 1); }
  else if (foundT <= .4) el.classList.remove('show'); }
function updHint() { const el = $('hint'); let best = null, bd = 1e9;
  if (S.running) for (const it of items) { if (it.got) continue; const d = Math.hypot(it.x - P.x, it.z - P.z); if (d < bd) { bd = d; best = it; } }
  if (!best || bd < 9) { el.classList.remove('show'); return; }
  const dx = best.x - P.x, dz = best.z - P.z; let ang;
  if (S.cam === 0) ang = Math.atan2(dx, -dz); else { const h = S.cam === 1 ? camH + lookA.yaw : P.yaw + lookA.yaw; ang = Math.atan2(-dx*Math.cos(h) + dz*Math.sin(h), dx*Math.sin(h) + dz*Math.cos(h)); }
  const R = Math.min(innerWidth, innerHeight)*.3; el.style.transform = `rotate(${ang}rad) translateY(${-R}px)`; el.classList.add('show'); }
function syncPicks() { document.querySelectorAll('.pick').forEach(b => { const on = b.dataset.who ? b.dataset.who === S.who : b.dataset.ctrl ? b.dataset.ctrl === S.ctrl : b.dataset.mood === S.mood; b.setAttribute('aria-pressed', on); }); $('sndIco').textContent = S.muted ? '🔇' : '🔊'; }
document.querySelectorAll('.pick').forEach(b => b.addEventListener('click', () => { if (b.dataset.who) S.who = b.dataset.who; else if (b.dataset.ctrl) S.ctrl = b.dataset.ctrl; else { S.mood = b.dataset.mood; setMood(S.mood); } syncPicks(); save(); audioInit(); sfx.blip(); }));
$('bSnd').addEventListener('click', () => { S.muted = !S.muted; audioInit(); if (AU.master) AU.master.gain.value = S.muted ? 0 : .85; syncPicks(); save(); });
function showMenu(kind) {
  S.running = false; S.menu = kind; $('hud').hidden = true; $('menu').hidden = false; for (const k in keys) keys[k] = 0;
  $('mTitle').textContent = kind === 'win' ? 'Brawo!' : kind === 'pause' ? 'Przerwa' : 'Rafa koralowa';
  $('mSub').textContent = kind === 'win' ? 'Masz wszystkie perły, muszle i cały album!' : kind === 'pause' ? `Perły ${got.pearl}/${total.pearl}, muszle ${got.shell}/${total.shell}, album ${nFound}/${ANIMALS.length}` : 'Zbieraj perły i muszle, odkrywaj zwierzęta';
  $('bGo').textContent = kind === 'start' ? 'Płyniemy!' : 'Płyniemy dalej'; $('bNew').hidden = kind === 'start'; syncPicks();
}
let firstGo = true;
async function go() {
  audioInit();
  if (S.ctrl === 'tilt') { $('bGo').textContent = 'Chwileczkę…'; const ok = await enableTilt(); tilt.on = ok;
    if (!ok) { S.ctrl = 'arrows'; syncPicks(); toast('Przechylanie nie działa na tym urządzeniu. Włączam strzałki.', 5000); } } else tilt.on = false;
  document.body.classList.toggle('tilt', tilt.on);
  if (P.who !== S.who) setPlayer(S.who);
  if (S.menu === 'start') resetPlayer();
  S.menu = 'play'; S.running = true; $('menu').hidden = true; $('hud').hidden = false; camSnap = true; camH = P.yaw; save(); hud();
  if (firstGo) { firstGo = false; if (!tilt.on) toast('Strzałki: płyń i skręcaj. Żółte guziki: w górę i w dół.', 5200); else toast('Przechyl telefon, żeby skręcać, nurkować i wypływać.', 5200);
    setTimeout(() => reveal(S.who), 2600); }
}
function newReef() { S.seed = (S.seed % 9999) + 1; startWorld(); S.menu = 'start'; go(); }
function startWorld() { buildWorld(S.seed); for (const k in found) delete found[k]; nFound = 0; foundQ = []; won = false; winShown = false; got = { pearl:0, shell:0 };
  total = { pearl:items.filter(i => i.kind === 'pearl').length, shell:items.filter(i => i.kind === 'shell').length }; firstGo = true; resetPlayer(); hud(); }
$('bGo').addEventListener('click', go); $('bNew').addEventListener('click', newReef);
function openAlbum() { if (!S.running) return; S.running = false; for (const k in keys) keys[k] = 0;
  $('grid').innerHTML = ANIMALS.map(([k, n, h]) => `<div class="an${found[k] ? '' : ' lock'}"><img src="${thumbs[k] || ''}" alt=""><b>${found[k] ? n : '???'}</b>${found[k] ? '' : h}</div>`).join('');
  $('album').hidden = false; }
$('bAlbumX').addEventListener('click', () => { $('album').hidden = true; S.running = true; audioInit(); });

tap('bCam', nextCam); tap('bDash', dash); tap('bMenu', () => showMenu('pause')); tap('bAlbum', openAlbum);
tap('bCal', () => { tilt.cal = true; toast('Środek ustawiony'); }); tap('bStop', () => { P.auto = !P.auto; hud(); });
document.addEventListener('visibilitychange', () => { if (AU.ctx) { if (document.hidden) AU.ctx.suspend(); else if (S.running) AU.ctx.resume(); } });

/* =====================================================================
   OBRÓBKA OBRAZU: poświata, kolor, falowanie wody
   ===================================================================== */
const POST = (() => {
  const off = { on:false, render() { renderer.setRenderTarget(null); renderer.render(scene, camera); }, resize() {}, set() {} };
  if (!renderer.capabilities.isWebGL2 || !T.WebGLMultisampleRenderTarget) return off;
  try {
    const main = new T.WebGLMultisampleRenderTarget(4, 4, { depthBuffer:true }); main.samples = 4; main.texture.encoding = T.sRGBEncoding; main.texture.generateMipmaps = false; main.texture.minFilter = main.texture.magFilter = T.LinearFilter;
    const half = () => { const r = new T.WebGLRenderTarget(2, 2, { depthBuffer:false }); r.texture.generateMipmaps = false; r.texture.minFilter = r.texture.magFilter = T.LinearFilter; return r; };
    const a = half(), b = half(), cam2 = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), sc = new T.Scene(), quad = new T.Mesh(new T.PlaneGeometry(2, 2), null); quad.frustumCulled = false; sc.add(quad);
    const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', mk = (u, fs) => new T.ShaderMaterial({ uniforms:u, vertexShader:VS, fragmentShader:fs, depthTest:false, depthWrite:false });
    const mBright = mk({ tD:{ value:null }, uThr:{ value:.66 } }, 'uniform sampler2D tD; uniform float uThr; varying vec2 vUv; void main(){ vec3 c = texture2D(tD, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c*smoothstep(uThr, uThr + 0.28, l), 1.0); }');
    const mBlur = mk({ tD:{ value:null }, uDir:{ value:new T.Vector2() } }, `uniform sampler2D tD; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tD, vUv).rgb*0.227027; c += (texture2D(tD, vUv + uDir*1.3846).rgb + texture2D(tD, vUv - uDir*1.3846).rgb)*0.316216;
        c += (texture2D(tD, vUv + uDir*3.2308).rgb + texture2D(tD, vUv - uDir*3.2308).rgb)*0.070270; gl_FragColor = vec4(c, 1.0); }`);
    const mFinal = mk({ tD:{ value:null }, tB:{ value:null }, uTime:U.uTime, uBloom:{ value:.42 }, uSat:{ value:1.12 }, uWob:{ value:.0011 } }, `uniform sampler2D tD; uniform sampler2D tB; uniform float uTime; uniform float uBloom; uniform float uSat; uniform float uWob; varying vec2 vUv;
      void main(){ vec2 uv = vUv + vec2(sin(vUv.y*17.0 + uTime*1.3), cos(vUv.x*15.0 + uTime*1.1))*uWob; vec2 dc = uv - 0.5; float e = dot(dc, dc);
        vec3 c = vec3(texture2D(tD, uv + dc*e*0.012).r, texture2D(tD, uv).g, texture2D(tD, uv - dc*e*0.012).b);
        c += texture2D(tB, uv).rgb*uBloom; c = clamp(c, 0.0, 1.0);
        float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, uSat);
        c = clamp(c, 0.0, 1.0); c = mix(c, c*c*(3.0 - 2.0*c), 0.4);
        gl_FragColor = vec4(c, 1.0); }`);
    const pass = (m, src, dst) => { quad.material = m; m.uniforms.tD.value = src.texture; renderer.setRenderTarget(dst); renderer.render(sc, cam2); };
    let w4 = 2, h4 = 2;
    return { on:true,
      resize() { const w = renderer.domElement.width, h = renderer.domElement.height; main.setSize(w, h); w4 = Math.max(2, w >> 2); h4 = Math.max(2, h >> 2); a.setSize(w4, h4); b.setSize(w4, h4); },
      set(bloom, thr) { mFinal.uniforms.uBloom.value = bloom; mBright.uniforms.uThr.value = thr; },
      render() { renderer.setRenderTarget(main); renderer.render(scene, camera); pass(mBright, main, a);
        for (const k of [1, 2.3]) { mBlur.uniforms.uDir.value.set(k/w4, 0); pass(mBlur, a, b); mBlur.uniforms.uDir.value.set(0, k/h4); pass(mBlur, b, a); }
        mFinal.uniforms.tB.value = a.texture; pass(mFinal, main, null); } };
  } catch (e) { return off; }
})();

/* =====================================================================
   PĘTLA
   ===================================================================== */
let last = performance.now(), acc = 0, nfr = 0, winShown = false;
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last)/1000; last = now; const dt = Math.min(.05, Math.max(.001, raw)); time += dt; U.uTime.value = time;
  if (S.running) updPlayer(dt);
  poseP(); updSchools(dt, time); for (const m of movers) m.upd(dt, time); updItems(time); bubbles.update(dt); sparks.update(dt);
  if (won && S.running) { winT += dt; if (winT < .05) sfx.win();
    if (winT < 4) for (let i = 0; i < 3; i++) { const a = Math.random()*TAU; sparks.emit(P.x + Math.cos(a)*3, P.y + Math.random()*3 - 1, P.z + Math.sin(a)*3, Math.cos(a)*2, 2 + Math.random()*2, Math.sin(a)*2, .2, 1.2); }
    else if (!winShown) { winShown = true; showMenu('win'); } }
  updFound(dt); updHint(); music(time); updCam(dt);
  POST.render();
  acc += raw; nfr++; if (nfr >= 80) { const avg = acc/nfr; acc = 0; nfr = 0; if (avg > 1/38 && PR > .8) { PR = Math.max(.75, PR - .25); resize(); } }
}

setTimeout(() => {
  try { setPlayer(S.who); startWorld(); makeThumbs(); setMood(S.mood); resize(); }
  catch (e) { $('load').hidden = true; $('err').textContent = 'Nie udało się zbudować rafy: ' + e.message; $('err').style.display = 'flex'; return; }
  $('imClown').src = thumbs.clown; $('imTurtle').src = thumbs.turtle; syncPicks(); hud();
  $('load').hidden = true; $('menu').hidden = false;
  requestAnimationFrame(t => { last = t; frame(t); });
}, 40);
