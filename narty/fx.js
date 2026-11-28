'use strict';
// Narty — efekty obrazu: niebo ze słońcem i chmurami (shader), przezroczysty lód na trasie, migoczący śnieg, pudrowy śnieg zza nart,
// promienie słońca i flary (nakładka CSS #sunfx). Same funkcje (bez sceny przy ładowaniu); gra woła je z game.js.
// wymaga: lib/3d/three.js (T, PI), lib/common/math.js (clamp), slope.js (groundY, CRS), lib/common/random.js (rr, rnd)

/* ---------- niebo: gradient, słońce z poświatą, chmury ---------- */
const SKY_VS = 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }';
const SKY_FS = `uniform vec3 uSun; uniform float uTime; varying vec3 vDir;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a*noise(p); p *= 2.03; a *= 0.5; } return s; }
void main(){
  vec3 d = normalize(vDir); float h = d.y;
  vec3 hor = vec3(0.86, 0.92, 0.96), mid = vec3(0.50, 0.73, 0.94), top = vec3(0.20, 0.45, 0.82);
  vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, h)); c = mix(c, top, smoothstep(0.15, 0.85, h)); if (h < 0.0) c = hor;
  float sd = max(dot(d, uSun), 0.0);
  c = mix(c, vec3(1.0, 0.74, 0.42), clamp(pow(sd, 5.0)*0.55 + pow(sd, 30.0)*0.5, 0.0, 0.85)); c += vec3(1.0, 0.8, 0.5)*pow(sd, 220.0)*0.9;
  if (h > 0.02) { vec2 p = d.xz/(h + 0.28)*1.7 + vec2(uTime*0.012, 0.0);
    float cl = smoothstep(0.52, 0.86, fbm(p))*smoothstep(0.02, 0.24, h);
    vec3 cc = mix(vec3(0.97, 0.98, 1.0), vec3(1.0, 0.9, 0.74), pow(sd, 5.0)); c = mix(c, cc, cl*0.72); }
  c = mix(c, vec3(1.0, 0.98, 0.92), smoothstep(0.99962, 0.99986, sd));
  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);   // bez wartości > 1 (mapa środowiska jest LDR)
}`;
function skyDome(sunDir, radius) {
  const mat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: sunDir }, uTime: { value: 0 } }, vertexShader: SKY_VS, fragmentShader: SKY_FS });
  const m = new T.Mesh(new T.SphereGeometry(radius, 32, 18), mat); m.renderOrder = -10; m.frustumCulled = false; return m;
}
// odbicia nieba na lodzie: jednorazowy rzut kopuły na sześcian (zwykła mapa odbić — bez PMREM, działa na każdym GPU)
function skyEnv(renderer, sunDir) {
  const sc = new T.Scene(), mat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { uSun: { value: sunDir }, uTime: { value: 8 } }, vertexShader: SKY_VS, fragmentShader: SKY_FS });
  sc.add(new T.Mesh(new T.SphereGeometry(50, 32, 18), mat));
  const rt = new T.WebGLCubeRenderTarget(128), cc = new T.CubeCamera(.1, 100, rt); cc.update(renderer, sc); return rt.texture;
}

/* ---------- lód: półprzezroczysta tafla z pęknięciami i połyskiem (MeshStandard + mapa nieba) ---------- */
let iceTexC = null;
function iceTex() {
  if (iceTexC) return iceTexC;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), R = Math.random;
  g.beginPath(); for (let k = 0; k <= 56; k++) { const a = k/56*6.2832, r = 108 + 7*Math.sin(a*3 + 1) + 5*Math.sin(a*5 + 2) + R()*3; k ? g.lineTo(128 + Math.cos(a)*r, 128 + Math.sin(a)*r) : g.moveTo(128 + Math.cos(a)*r, 128 + Math.sin(a)*r); } g.closePath();
  const gr = g.createRadialGradient(104, 100, 8, 128, 128, 116); gr.addColorStop(0, 'rgba(170,228,255,.8)'); gr.addColorStop(.5, 'rgba(105,185,245,.86)'); gr.addColorStop(.88, 'rgba(60,140,225,.92)'); gr.addColorStop(1, 'rgba(225,245,255,.96)');
  g.fillStyle = gr; g.fill(); g.save(); g.clip();
  for (let i = 0; i < 16; i++) { const x = R()*256, y = R()*256, a = R()*6.28, l = 40 + R()*90; g.strokeStyle = 'rgba(25,95,175,.45)'; g.lineWidth = 3 + R()*4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); g.stroke(); }
  for (let i = 0; i < 34; i++) { let x = R()*256, y = R()*256, a = R()*6.28; g.strokeStyle = `rgba(255,255,255,${.5 + R()*.45})`; g.lineWidth = 1 + R()*2; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { a += R()*1.2 - .6; const l = 12 + R()*34; x += Math.cos(a)*l; y += Math.sin(a)*l; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${.25 + R()*.6})`; g.beginPath(); g.arc(R()*256, R()*256, .8 + R()*2.8, 0, 6.28); g.fill(); }
  g.restore(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
  const t = new T.CanvasTexture(c); t.anisotropy = 4; return iceTexC = t;
}
function iceMesh(p) {
  const NI = 12, NJ = 10, k = 1.18, pos = [], uv = [], idx = [];
  for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) { const s = p.s + (i/NI - .5)*2*p.rz*k, x = p.x + (j/NJ - .5)*2*p.rx*k; pos.push(x, groundY(s, x) + .07, s); uv.push(j/NJ, i/NI); }
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const a = i*(NJ + 1) + j, b = a + 1, c = a + NJ + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, ICE_MAT); m.renderOrder = 2; return m;
}
const ICE_MAT = new T.MeshPhongMaterial({ color: 0xbcd8f2, emissive: 0x0c3a6e, specular: 0xffffff, shininess: 160, reflectivity: .35, combine: T.MixOperation, transparent: true, opacity: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
function iceInit(env) { ICE_MAT.map = iceTex(); ICE_MAT.envMap = env; ICE_MAT.needsUpdate = true; }

/* ---------- migoczący śnieg: gwiazdki rozsypane nad trasą, każda błyska w swoim rytmie (additive) ---------- */
function glitterPoints(n, uScale) {
  const pos = new Float32Array(n*3), ph = new Float32Array(n), sz = new Float32Array(n), L = CRS.L;
  for (let i = 0; i < n; i++) { const s = rr(-10, L + 90), x = centerX(s) + rr(-16, 16); pos[i*3] = x; pos[i*3 + 1] = groundY(s, x) + .08 + rnd()*.18; pos[i*3 + 2] = s; ph[i] = rnd(); sz[i] = .35 + rnd()*.55; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aPh', new T.BufferAttribute(ph, 1)); g.setAttribute('aSz', new T.BufferAttribute(sz, 1));
  const mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uTime: { value: 0 }, uScale: uScale },
    vertexShader: `attribute float aPh; attribute float aSz; uniform float uTime; uniform float uScale; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mv; float tw = pow(0.5 + 0.5*sin(uTime*(2.0 + aPh*3.0) + aPh*40.0), 8.0);
        gl_PointSize = aSz*(0.25 + tw)*uScale/(-mv.z); vA = tw*(1.0 - smoothstep(60.0, 170.0, -mv.z)); }`,
    fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c)*2.0; float core = pow(max(1.0 - d, 0.0), 2.5);
      float cross = max((1.0 - smoothstep(0.0, 0.09, abs(c.x)))*(1.0 - abs(c.y)*2.0), (1.0 - smoothstep(0.0, 0.09, abs(c.y)))*(1.0 - abs(c.x)*2.0));
      gl_FragColor = vec4(vec3(1.0, 0.96, 0.85)*(core + cross*0.8)*vA, 1.0); }` });
  const p = new T.Points(g, mat); p.frustumCulled = false; return p;
}

/* ---------- puder: duże miękkie półprzezroczyste kłęby śniegu zza nart ---------- */
function powderInit(scene, n, uScale) {
  const pos = new Float32Array(n*3), vel = new Float32Array(n*3), age = new Float32Array(n).fill(9), life = new Float32Array(n).fill(1), s0 = new Float32Array(n), sz = new Float32Array(n), al = new Float32Array(n);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aSize', new T.BufferAttribute(sz, 1)); g.setAttribute('aAlpha', new T.BufferAttribute(al, 1));
  const mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uScale },
    vertexShader: 'attribute float aSize; attribute float aAlpha; uniform float uScale; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mv; gl_PointSize = aSize*uScale/(-mv.z); vA = aAlpha; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5)*2.0; float a = smoothstep(1.0, 0.0, d); a *= a; gl_FragColor = vec4(vec3(0.97, 0.985, 1.0), a*vA); }' });
  const pts = new T.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 3; scene.add(pts); let nx = 0;
  return { pts,
    emit(x, y, z, vx, vy, vz, lf, size) { const i = nx; nx = (nx + 1)%n; pos[i*3] = x; pos[i*3 + 1] = y; pos[i*3 + 2] = z; vel[i*3] = vx; vel[i*3 + 1] = vy; vel[i*3 + 2] = vz; age[i] = 0; life[i] = lf; s0[i] = size; },
    update(dt) { for (let i = 0; i < n; i++) { if (age[i] >= life[i]) { al[i] = 0; continue; } age[i] += dt; const k = age[i]/life[i], d = Math.pow(.93, dt*60);
      vel[i*3] *= d; vel[i*3 + 1] = vel[i*3 + 1]*d + 1.2*dt; vel[i*3 + 2] *= d; pos[i*3] += vel[i*3]*dt; pos[i*3 + 1] += vel[i*3 + 1]*dt; pos[i*3 + 2] += vel[i*3 + 2]*dt;
      sz[i] = s0[i]*(.5 + k*1.8); al[i] = .42*(1 - k)*Math.min(1, k*8); }
      g.attributes.position.needsUpdate = g.attributes.aSize.needsUpdate = g.attributes.aAlpha.needsUpdate = true; } };
}

/* ---------- promienie słońca i flary: nakładka CSS (mix-blend-mode: screen) ustawiana na rzucie słońca na ekran ---------- */
const SUNFX = { el: null, glow: null, rays: null, fl: [], v: null, f: null };
function sunFxInit() {
  const el = SUNFX.el = document.getElementById('sunfx'); if (!el) return; SUNFX.glow = el.querySelector('#sGlow'); SUNFX.rays = el.querySelector('#sRays'); SUNFX.fl = [...el.querySelectorAll('.fl')];
  SUNFX.v = new T.Vector3(); SUNFX.f = new T.Vector3();
}
function sunFxUpdate(camera, sunDir) {
  const e = SUNFX; if (!e.el) return; camera.getWorldDirection(e.f); const dp = e.f.dot(sunDir);
  if (dp < .05) { e.el.style.opacity = 0; return; }
  e.v.copy(camera.position).addScaledVector(sunDir, 900).project(camera);
  const W = innerWidth, H = innerHeight, sx = (e.v.x*.5 + .5)*W, sy = (-e.v.y*.5 + .5)*H, k = clamp((dp - .3)/.45, 0, 1);
  e.el.style.opacity = k.toFixed(3);
  const at = (n, x, y) => { n.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`; };
  at(e.glow, sx, sy); at(e.rays, sx, sy);
  const cx = W/2, cy = H/2;
  e.fl.forEach((n, i) => { const t = [.32, .62, 1.12, 1.55][i]; at(n, sx + (cx - sx)*t, sy + (cy - sy)*t); });
}
