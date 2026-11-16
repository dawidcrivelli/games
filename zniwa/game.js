'use strict';
if (!window.THREE) { $('err').style.display = 'flex'; $('menu').hidden = true; throw new Error('brak three.js'); }
const T = THREE;

/* =====================================================================
   USTAWIENIA I STAN
   ===================================================================== */
const S = { crop:'wheat', ctrl:'arrows', cam:0, active:'combine', muted:false, running:false, menu:'start' };
try {
  const sv = JSON.parse(localStorage.getItem('zniwa') || 'null');
  if (sv) { if (sv.crop==='corn'||sv.crop==='wheat') S.crop = sv.crop; if (sv.ctrl==='tilt'||sv.ctrl==='arrows') S.ctrl = sv.ctrl; S.muted = !!sv.muted; }
} catch (e) {}
const save = () => { try { localStorage.setItem('zniwa', JSON.stringify({crop:S.crop, ctrl:S.ctrl, muted:S.muted})); } catch (e) {} };

const FW = 56, FD = 36, CELLS = FW*FD;        // pole w metrach (1 komórka = 1 m)
const X0 = -FW/2, Z0 = -FD/2;
const WORLD = { x:46, zMin:-23, zMax:32 };
const BARN_X = 14, BARN_DOOR = new T.Vector3(BARN_X, 2.2, -30.2);
const CELLS_PER_BALE = 40, TRAILER_CAP = 16;

let seed = 12345;

/* =====================================================================
   RENDERER, SCENA, ŚWIATŁO
   ===================================================================== */
const renderer = new T.WebGLRenderer({ canvas:$('c'), antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.fog = new T.Fog(0xcfe8f3, 110, 420);
const camera = new T.PerspectiveCamera(55, 1, 0.12, 900);
scene.add(camera);

const hemi = new T.HemisphereLight(0xdff1ff, 0x7d7040, 0.56); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff1d0, 0.72);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left = -19; sc.right = 19; sc.top = 19; sc.bottom = -19; sc.near = 1; sc.far = 160;
sun.shadow.bias = -0.0006;
scene.add(sun); scene.add(sun.target);
const SUN_DIR = new T.Vector3(26, 46, 20);

/* ---------- tekstury z canvasu ---------- */

const grassTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#69a84a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { g.strokeStyle = ['#5c9a40','#78b656','#4f8c38','#86c060'][i&3]; g.globalAlpha = .55;
    const x = rnd()*w, y = rnd()*h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2,2), y - rr(2,6)); g.stroke(); }
}, 90, 90);
const soilTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#a17c45'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) { g.fillStyle = 'rgba(236,214,150,.6)'; g.fillRect(0, r*32 + 10, w, 9); g.fillStyle = 'rgba(110,80,40,.35)'; g.fillRect(0, r*32 + 24, w, 5); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = ['#e9cf86','#8f6c38','#d7b565','#c29a55'][i&3]; g.globalAlpha = .6; g.fillRect(rnd()*w, rnd()*h, rr(2,7), 1.5); }
}, FW/4, FD/4);
const strawTex = tex(128, 128, (g, w, h) => {
  g.fillStyle = '#e3b643'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { g.strokeStyle = ['#f3d06a','#c9982c','#eec455','#b98722'][i&3]; g.globalAlpha = .8;
    const x = rnd()*w, y = rnd()*h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(4,16), y + rr(-2,2)); g.stroke(); }
  g.globalAlpha = 1; g.fillStyle = '#8a5a14'; g.fillRect(0, 36, w, 5); g.fillRect(0, 88, w, 5);
});
const woodTex = tex(128, 128, (g, w, h) => {
  g.fillStyle = '#9b6a3c'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) { g.fillStyle = ['#8c5e33','#a87646','#93633a','#a06e40'][(x/16)&3]; g.fillRect(x + 1, 0, 14, h); g.fillStyle = '#5e3d20'; g.fillRect(x, 0, 1.5, h); }
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(70,40,15,.25)'; g.fillRect(rnd()*w, rnd()*h, 1, rr(4,18)); }
}, 5, 1);

/* ---------- materiały ---------- */

   // lakier odbijający niebo
const M = {
  tire:pho(0x1f1d1c, { roughness:.93, metalness:0, envMapIntensity:.25 }), dark:lam(0x2e3034), steel:pho(0x8f989f, { metalness:.7, roughness:.38 }), steelL:pho(0xc7ced3, { metalness:.7, roughness:.3 }), chrome:pho(0xe6eaee, { metalness:.95, roughness:.12, envMapIntensity:1.2 }),
  cBlue:pho(0xa6c21a), cBlueD:pho(0x7f9712), cRed:pho(0xd8301f), cYel:pho(0xf5c41f), white:pho(0xf5f1e6),
  uRed:pho(0xdc452a), uGray:pho(0x5f6367), uCream:pho(0xeee2c4),
  glass:new T.MeshStandardMaterial({ color:0xbfe6f5, transparent:true, opacity:.26, roughness:.04, metalness:.2, envMapIntensity:1.7, depthWrite:false }),
  skin:lam(0xf1c7a0), hat:lam(0xe8c56a), shirt:lam(0x3c8a4a), pants:lam(0x34446a),
  wood:lam(0xffffff, { map:woodTex }), woodL:lam(0xc79a63), roof:lam(0xb23a2c), inside:lam(0x1d140d),
  trGreen:pho(0x3f8a3c), bedWood:lam(0xb98a55), grain:lam(0xf0c040),
  lamp:new T.MeshBasicMaterial({ color:0xfff3b0 }), beacon:new T.MeshBasicMaterial({ color:0xffa200 }),
  gaugeW:new T.MeshBasicMaterial({ color:0xf6f2e2 }), gaugeR:new T.MeshBasicMaterial({ color:0xe23b2b }), gaugeG:new T.MeshBasicMaterial({ color:0x49c24f }),
  cRedD:pho(0xa82f20), uRedD:pho(0xb0351f), uGrayD:pho(0x3d4144), trGreenD:pho(0x2f6a2d), woodD:lam(0x7d5a36), seat:lam(0x23201e), hair:lam(0x4a3524), boot:lam(0x2a221c),
  red:new T.MeshBasicMaterial({ color:0xd81f1f }), amber:new T.MeshBasicMaterial({ color:0xff9a1a }),
  hazardY:lam(0xffffff, { map:tex(64, 64, (g, w, h) => { g.fillStyle = '#f2c21f'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1c1c'; for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i*32, 0); g.lineTo(i*32 + 16, 0); g.lineTo(i*32 + 80, 64); g.lineTo(i*32 + 64, 64); g.fill(); } }) }),
  hazard:lam(0xffffff, { map:tex(64, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d6201f'; for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i*32, 0); g.lineTo(i*32 + 16, 0); g.lineTo(i*32 + 80, 64); g.lineTo(i*32 + 64, 64); g.fill(); } }) }),
  plate:lam(0xffffff, { map:tex(192, 64, (g, w, h) => { g.fillStyle = '#f7f7f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d3f9c'; g.fillRect(0, 0, 22, h); g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#111'; g.font = 'bold 40px Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('ZNI 330C', 30, h/2 + 2); }) }),
  badge:lam(0xffffff, { map:tex(160, 48, (g, w, h) => { g.fillStyle = '#eee2c4'; g.fillRect(0, 0, w, h); g.fillStyle = '#b0351f'; g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#eee2c4'; g.font = 'bold 32px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C-330', w/2, h/2 + 2); }) }),
  monitor:new T.MeshBasicMaterial({ map:tex(180, 124, (g, w, h) => { g.fillStyle = '#10201a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9b33a'; g.fillRect(10, 12, 96, 70);
    g.fillStyle = '#7a8a3a'; for (let i = 0; i < 5; i++) g.fillRect(10, 12 + i*14, 96 - i*11, 9); g.fillStyle = '#e8402c'; g.fillRect(66, 60, 10, 14);
    [['#58d06a', 52], ['#f2c230', 34], ['#58a8f0', 44]].forEach((b, i) => { g.fillStyle = '#243a30'; g.fillRect(118 + i*20, 14, 14, 66); g.fillStyle = b[0]; g.fillRect(118 + i*20, 80 - b[1], 14, b[1]); });
    g.fillStyle = '#cfe8d8'; g.font = 'bold 22px Arial, sans-serif'; g.fillText('5.6 km/h', 10, 110); }) }),
  soil:lam(0xffffff, { map:soilTex }), win:pho(0x35506e, { roughness:.1, metalness:.4, emissive:0x000000 }), cloud:new T.MeshBasicMaterial({ color:0xffffff, fog:false, transparent:true, opacity:.93 }),
  bale:lam(0xffffff, { map:strawTex }), flagW:lam(0xffffff, { emissive:0x555555 }), flagR:lam(0xdc143c),
};

/* ---------- pomocnicze budowanie brył ---------- */

/* skleja wiele małych brył w jedną siatkę na materiał (mniej draw calli na telefonie) */

/* =====================================================================
   KRAJOBRAZ
   ===================================================================== */
// ---------- niebo, pogoda dnia i mapa odbić (lakier i szyby odbijają niebo)
const WEATHERS = [
  { id:'sun',   p:.28, ico:'☀️', top:0x4f9fe6, hor:0xe2f3f8, fog:0xcfe8f3, fn:110, ff:420, sun:0xfff1d0, si:.74, sd:[26, 46, 20],  hs:0xdff1ff, hg:0x7d7040, hi:.56, cloud:0xffffff, co:.93, sunVis:1, wind:1,   lamp:0 },
  { id:'gold',  p:.2,  ico:'🌅', top:0x5d86c4, hor:0xffc98a, fog:0xf1cc9c, fn:90,  ff:380, sun:0xffab5e, si:.88, sd:[-50, 16, 24], hs:0xffe0bd, hg:0x7a5a38, hi:.42, cloud:0xffd2ae, co:.9,  sunVis:1, sunCol:0xffb04a, wind:.8, lamp:.5 },
  { id:'cloud', p:.15, ico:'☁️', top:0x8e9aa6, hor:0xd5dadd, fog:0xc9d0d4, fn:80,  ff:330, sun:0xffffff, si:.26, sd:[20, 50, 10],  hs:0xe6ecf0, hg:0x777060, hi:.84, cloud:0xb4bac0, co:.97, sunVis:0, wind:1.5, lamp:0 },
  { id:'rain',  p:.12, ico:'🌧️', top:0x5f6b78, hor:0xa9b2b8, fog:0x9aa5ab, fn:45,  ff:210, sun:0xdfe8f0, si:.16, sd:[20, 50, 10],  hs:0xcfd8de, hg:0x60605a, hi:.74, cloud:0x79828a, co:.97, sunVis:0, wind:2,   lamp:.9, rain:1 },
  { id:'fog',   p:.1,  ico:'🌫️', top:0xbfd0da, hor:0xe6ecef, fog:0xe1e8eb, fn:12,  ff:92,  sun:0xfff4dc, si:.4,  sd:[40, 30, 20],  hs:0xf0f4f6, hg:0x8a8670, hi:.7,  cloud:0xffffff, co:.4,  sunVis:0, wind:.4,  lamp:.8 },
  { id:'night', p:.15, ico:'🌙', top:0x0a1430, hor:0x25355a, fog:0x1b2843, fn:60,  ff:300, sun:0x9db8ff, si:.34, sd:[-20, 45, -25], hs:0x5b70aa, hg:0x1c2230, hi:.44, cloud:0x36435f, co:.7,  sunVis:0, moon:1, wind:.6, lamp:2 },
];
let WX = WEATHERS[0];
const uWind = { value:1 };
const skyGeo = new T.SphereGeometry(700, 24, 14), skyMat = new T.MeshBasicMaterial({ vertexColors:true, side:T.BackSide, fog:false, depthWrite:false });
skyGeo.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(skyGeo.attributes.position.count*3), 3));
scene.add(new T.Mesh(skyGeo, skyMat));

const sunGeo = new T.SphereGeometry(22, 16, 12);
const sunBall = new T.Mesh(sunGeo, new T.MeshBasicMaterial({ color:0xfff6c4, fog:false })); scene.add(sunBall);
const moon = new T.Mesh(new T.SphereGeometry(15, 16, 12), new T.MeshBasicMaterial({ color:0xf4f1dc, fog:false })); moon.position.set(-190, 380, -420); scene.add(moon);
const stars = (() => { const n = 380, a = new Float32Array(n*3); for (let i = 0; i < n; i++) { const th = rnd()*6.283, ph = Math.acos(rr(.06, 1)); a[i*3] = Math.sin(ph)*Math.cos(th)*660; a[i*3+1] = Math.cos(ph)*660; a[i*3+2] = Math.sin(ph)*Math.sin(th)*660; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(a, 3)); const s = new T.Points(g, new T.PointsMaterial({ color:0xffffff, size:2.2, sizeAttenuation:false, fog:false })); scene.add(s); return s; })();
const RAIN_N = 700, rainOff = new Float32Array(RAIN_N*3);
const rain = (() => { for (let i = 0; i < RAIN_N; i++) { rainOff[i*3] = rr(-24, 24); rainOff[i*3+1] = rr(0, 26); rainOff[i*3+2] = rr(-24, 24); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(RAIN_N*6), 3));
  const l = new T.LineSegments(g, new T.LineBasicMaterial({ color:0xdbe8f0, transparent:true, opacity:.55 })); l.frustumCulled = false; l.visible = false; scene.add(l); return l; })();

const headLamp = new T.SpotLight(0xfff0cc, 0, 60, .6, .65, 1.1); scene.add(headLamp); scene.add(headLamp.target);     // reflektory po zmroku, w deszczu i we mgle
let pmrem = null, envRT = null; const envScene = new T.Scene();
const envGround = new T.Mesh(new T.CircleGeometry(690, 20), new T.MeshBasicMaterial({ color:0x7a9a50 })); envGround.rotation.x = -Math.PI/2; envGround.position.y = -3;
const envSun = new T.Mesh(sunGeo, new T.MeshBasicMaterial({ color:0xffffff })); envSun.scale.setScalar(2.2);
envScene.add(new T.Mesh(skyGeo, skyMat)); envScene.add(envGround); envScene.add(envSun);
function applyWeather(w) {
  WX = w; setSky(w.top, w.hor); scene.fog.color.setHex(w.fog); scene.fog.near = w.fn; scene.fog.far = w.ff;
  sun.color.setHex(w.sun); sun.intensity = w.si; SUN_DIR.set(w.sd[0], w.sd[1], w.sd[2]); sun.position.copy(sun.target.position).add(SUN_DIR);
  hemi.color.setHex(w.hs); hemi.groundColor.setHex(w.hg); hemi.intensity = w.hi;
  M.cloud.color.setHex(w.cloud); M.cloud.opacity = w.co;
  sunBall.visible = !!w.sunVis; sunBall.position.copy(SUN_DIR).normalize().multiplyScalar(600); sunBall.material.color.setHex(w.sunCol || 0xfff6c4);
  moon.visible = stars.visible = !!w.moon; rain.visible = !!w.rain; uWind.value = w.wind; headLamp.intensity = w.lamp*1.25;
  M.win.emissive.setHex(w.lamp >= .5 ? 0xffc45a : 0x000000); M.win.emissiveIntensity = Math.min(1, w.lamp);
  M.soil.color.setHex(w.rain ? 0xb9b3aa : 0xffffff);
  try { if (!pmrem) pmrem = new T.PMREMGenerator(renderer);
    envGround.material.color.setHex(w.moon ? 0x10151c : w.rain ? 0x5a6455 : 0x7a9a50); envSun.visible = !!w.sunVis; envSun.position.copy(sunBall.position);
    const rt = pmrem.fromScene(envScene, 0, .1, 1500); scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt; } catch (e) {}
  $('wx').textContent = w.ico;
}
{ // łąka z plamami koloru
  const g = new T.PlaneGeometry(900, 900, 70, 70); g.rotateX(-Math.PI/2);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), n = vnoise(x/38 + 9, z/38 + 4)*.6 + vnoise(x/11, z/11)*.4, k = .8 + n*.36;
    col.push(k*(.96 + n*.1), k, k*(.86 + n*.1)); }
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  const ground = new T.Mesh(g, lam(0xffffff, { map:grassTex, vertexColors:true })); ground.receiveShadow = true; scene.add(ground);
}
const fieldPlane = mesh(new T.PlaneGeometry(FW + 1.2, FD + 1.2), M.soil, 0, .02, 0, scene);
fieldPlane.rotation.x = -Math.PI/2; fieldPlane.receiveShadow = true;
{ // polna droga i podwórko
  const roadTex = tex(128, 64, (g, w, h) => { g.fillStyle = '#b59c6e'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(95,140,60,.55)'; g.fillRect(0, 27, w, 10); g.fillStyle = 'rgba(120,95,60,.5)'; g.fillRect(0, 10, w, 9); g.fillRect(0, 45, w, 9);
    for (let i = 0; i < 700; i++) { g.fillStyle = ['#c8b183','#9c8558','#bda677','#8f7a50'][i&3]; g.fillRect(rnd()*w, rnd()*h, rr(1, 4), 1.5); } }, 60, 1);
  const road = mesh(new T.PlaneGeometry(700, 5.5), lam(0xffffff, { map:roadTex }), 0, .012, -25.6, scene); road.rotation.x = -Math.PI/2; road.receiveShadow = true;
  const yard = mesh(new T.PlaneGeometry(30, 7), lam(0xb59c6e), BARN_X, .016, -27.2, scene); yard.rotation.x = -Math.PI/2; yard.receiveShadow = true;
}

{ // stodoła
  const b = new T.Group();
  const gm = lam(0xffffff, { map:woodTex.clone(), side:T.DoubleSide }); gm.map.repeat.set(.36, .2); gm.map.needsUpdate = true;
  gableHouse(b, 14, 6, 8, M.wood, M.roof, .6, gm);
  box(4.8, 4.8, .1, M.inside, 0, 2.4, 4.02, b);
  const d1 = box(2.4, 4.8, .14, M.woodL, 2.4 + Math.cos(1)*1.2, 2.4, 4.05 + Math.sin(1)*1.2, b); d1.rotation.y = -1;
  const d2 = box(2.4, 4.8, .14, M.woodL, -2.4 - Math.cos(1)*1.2, 2.4, 4.05 + Math.sin(1)*1.2, b); d2.rotation.y = 1;
  box(4.9, .25, .16, M.white, 0, 4.9, 4.05, b);
  box(1.2, 1.2, .1, M.inside, 0, 7.6, 4.03, b); box(1.4, .12, .14, M.white, 0, 8.25, 4.05, b); box(1.4, .12, .14, M.white, 0, 6.95, 4.05, b);
  box(14.3, .5, 8.3, lam(0x8d8a84), 0, .25, 0, b);                                   // podmurówka
  // bocianie gniazdo
  cylY(.9, .3, lam(0x6b4a2a), -4.2, 9.1, 0, b, 10);
  const st = mesh(new T.SphereGeometry(.4, 10, 8), M.flagW, -4.2, 10.2, 0, b); st.scale.set(.7, .7, 1.3);
  box(.3, .3, .5, M.dark, -4.2, 10.25, -.45, b);
  cylY(.07, .7, M.flagW, -4.2, 10.6, .45, b, 6); mesh(new T.SphereGeometry(.14, 8, 6), M.flagW, -4.2, 11, .5, b);
  box(.05, .05, .5, M.flagR, -4.2, 10.97, .82, b);
  cylY(.03, .8, M.flagR, -4.3, 9.6, 0, b, 5); cylY(.03, .8, M.flagR, -4.1, 9.6, .1, b, 5);
  const bk = bake(b); bk.position.set(BARN_X, 0, -34); scene.add(bk);
  const f = new T.Group();
  cylY(.06, 7.4, M.steelL, 0, 3.7, 0, f, 8); box(1.5, .45, .04, M.flagW, .8, 6.9, 0, f); box(1.5, .45, .04, M.flagR, .8, 6.45, 0, f);
  const fk = bake(f); fk.position.set(BARN_X + 9.5, 0, -29.5); scene.add(fk);
}
const SILO = { x:BARN_X - 12, z:-33.5 };
{ const g = new T.Group(), sm = pho(0xbfc6cc, { metalness:.8, roughness:.3 });
  mesh(new T.CylinderGeometry(2.3, 2.3, 8, 20), sm, 0, 4.6, 0, g); mesh(new T.ConeGeometry(2.5, 1.6, 20), sm, 0, 9.4, 0, g); cylY(2.4, .6, lam(0x8d8a84), 0, .3, 0, g, 20);
  for (let i = 0; i < 6; i++) mesh(new T.TorusGeometry(2.31, .04, 5, 24), M.steel, 0, 1.4 + i*1.3, 0, g).rotation.x = Math.PI/2;
  box(.06, 8, .06, M.steel, .25, 4.6, 2.36, g); box(.06, 8, .06, M.steel, -.25, 4.6, 2.36, g); for (let i = 0; i < 16; i++) box(.5, .04, .04, M.steel, 0, 1 + i*.48, 2.36, g);
  const p = cylY(.14, 4, M.steel, 1.2, 8.6, 2.6, g, 8); p.rotation.x = .5;
  const b = bake(g); b.position.set(SILO.x, 0, SILO.z); scene.add(b); }
{ // dom
  const b = new T.Group(), wall = lam(0xf2ead8), tile = lam(0xa6432f), win = M.win;
  gableHouse(b, 7, 3.3, 10, wall, tile, .75, lam(0xf2ead8, { side:T.DoubleSide }));
  box(7.2, .5, 10.2, lam(0x8d8a84), 0, .25, 0, b);
  [-3, 0, 3].forEach(z => { box(.08, 1.3, 1.1, win, 3.52, 1.9, z, b); box(.1, 1.45, .1, M.white, 3.53, 1.9, z, b); box(.1, .1, 1.25, M.white, 3.53, 1.9, z, b);
    box(.12, .1, 1.3, M.white, 3.53, 1.2, z, b); box(.3, .25, 1.1, lam(0xc94b3a), 3.62, 1.05, z, b); });
  box(1.1, 2.1, .1, M.woodL, 0, 1.3, 5.03, b); box(1.5, .2, .9, lam(0x8d8a84), 0, .35, 5.4, b);
  [-2, 2].forEach(x => { box(1.0, 1.2, .08, win, x, 1.9, 5.02, b); box(1.15, .1, .1, M.white, x, 1.9, 5.03, b); box(.1, 1.3, .1, M.white, x, 1.9, 5.03, b); });
  box(.7, 1.6, .7, lam(0x9a4a3a), -1.2, 6.2, -2, b);
  const hk = bake(b); hk.position.set(-26, 0, -38); hk.rotation.y = -.25; scene.add(hk);
}
{ // płot i słupy
  const f = new T.Group(), fm = lam(0x8f6f48);
  const run = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), n = Math.round(L/3.2), a = Math.atan2(x2 - x1, z2 - z1);
    for (let i = 0; i <= n; i++) { const t = i/n; box(.15, 1.35, .15, fm, x1 + (x2 - x1)*t, .67, z1 + (z2 - z1)*t, f); }
    [.5, 1.05].forEach(y => { const r = box(.06, .13, L, fm, (x1 + x2)/2, y, (z1 + z2)/2, f); r.rotation.y = a; }); };
  run(-55, 40, 55, 40); run(-55, -21, -55, 40); run(55, -21, 55, 40);
  const pm = lam(0x5d4a36);
  for (let x = -160; x <= 160; x += 40) { cylY(.16, 9, pm, x, 4.5, 46, f, 6); box(2.2, .14, .14, pm, x, 8.4, 46, f);
    if (x < 160) [-1, 1].forEach(s => box(40, .035, .035, M.dark, x + 20, 8.45, 46 + s, f)); }
  const fk = bake(f); fk.children.forEach(m => { m.castShadow = false; }); scene.add(fk);
}
{ // maki i chabry przy miedzy
  const N = 420, fl = new T.InstancedMesh(new T.SphereGeometry(.065, 6, 4), lam(0xffffff), N), d = new T.Object3D(), c = new T.Color();
  for (let i = 0; i < N; i++) { const side = (rnd()*4) | 0, o = rr(.7, 2.6); let x, z;
    if (side === 0) { x = rr(X0 - 2, -X0 + 2); z = Z0 - o; } else if (side === 1) { x = rr(X0 - 2, -X0 + 2); z = -Z0 + o; }
    else if (side === 2) { x = X0 - o; z = rr(Z0 - 2, -Z0 + 2); } else { x = -X0 + o; z = rr(Z0 - 2, -Z0 + 2); }
    d.position.set(x, rr(.2, .42), z); d.scale.set(1, .6, 1); d.updateMatrix(); fl.setMatrixAt(i, d.matrix);
    const k = rnd(); c.setHex(k < .5 ? 0xe5332a : k < .85 ? 0x3d63d8 : 0xf6f1e3); fl.setColorAt(i, c); }
  scene.add(fl);
}
{ // drzewa liściaste, świerki, wzgórza
  const N = 84, trunks = new T.InstancedMesh(new T.CylinderGeometry(.26, .42, 3, 6), lam(0x6d4b2c), N),
        crowns = new T.InstancedMesh(new T.IcosahedronGeometry(2, 1), lam(0xffffff), N*3),
        firs = new T.InstancedMesh(new T.ConeGeometry(2, 3, 7), lam(0xffffff), N*3), d = new T.Object3D(), c = new T.Color();
  let n = 0, nc = 0, nf = 0, guard = 0;
  while (n < N && guard++ < 5000) {
    const x = rr(-170, 170), z = rr(-150, 130);
    if (Math.abs(x) < 59 && z > -42 && z < 50) continue;
    if (Math.abs(x - BARN_X) < 19 && z > -46 && z < -24) continue;
    if (Math.abs(x + 26) < 10 && z > -48 && z < -28) continue;
    if (x > 58 && x < 96 && z > -46 && z < 38) continue; if (x < -58 && x > -84 && z > 4 && z < 28) continue;
    const s = rr(.8, 1.7), fir = rnd() < .28;
    d.rotation.set(0, 0, 0); d.position.set(x, 1.5*s, z); d.scale.set(s*(fir ? .7 : 1), s, s*(fir ? .7 : 1)); d.updateMatrix(); trunks.setMatrixAt(n++, d.matrix);
    if (fir) for (let k = 0; k < 3; k++) { d.position.set(x, (2.6 + k*1.7)*s, z); const q = s*(1.15 - k*.3); d.scale.set(q, s*1.05, q); d.rotation.set(0, rnd()*6, 0); d.updateMatrix();
      firs.setMatrixAt(nf, d.matrix); c.setHSL(rr(.36, .4), rr(.4, .5), rr(.17, .24)); firs.setColorAt(nf++, c); }
    else { const hue = rr(.25, .34), lt = rr(.24, .33);
      for (let k = 0; k < 3; k++) { const a = k*2.1 + rnd(), o = k ? 1.05*s : 0;
        d.position.set(x + Math.sin(a)*o, (4.3 + (k ? rr(-.5, .5) : .9))*s, z + Math.cos(a)*o); d.scale.set(s*rr(.8, 1.05), s*rr(.75, 1), s*rr(.8, 1.05)); d.rotation.set(rnd(), rnd()*6, 0); d.updateMatrix();
        crowns.setMatrixAt(nc, d.matrix); c.setHSL(hue + rr(-.015, .015), rr(.45, .6), lt + rr(-.03, .03)); crowns.setColorAt(nc++, c); } }
  }
  trunks.count = n; crowns.count = nc; firs.count = nf;
  scene.add(trunks); scene.add(crowns); scene.add(firs);
  const hm = lam(0x6aa55a);
  [[-260,-300,90],[40,-340,120],[300,-260,100],[-330,60,110],[340,90,120],[0,330,130],[-220,280,90],[240,300,100]].forEach(h => {
    const m = mesh(new T.SphereGeometry(1, 14, 8), hm, h[0], -8, h[1], scene); m.scale.set(h[2]*1.6, h[2]*.38, h[2]); });
}
const clouds = [];
{ const cm = M.cloud;
  for (let i = 0; i < 10; i++) { const g = new T.Group();
    for (let k = 0; k < 6; k++) { const m = mesh(new T.SphereGeometry(rr(7, 13), 9, 7), cm, k*8 - 20 + rr(-3, 3), rr(-2, 3), rr(-5, 5), g); m.scale.y = .5; }
    const b = bake(g); b.children.forEach(m => { m.castShadow = false; m.receiveShadow = false; });
    b.position.set(rr(-380, 380), rr(95, 150), rr(-380, 80)); scene.add(b); clouds.push(b); } }
const birds = [];
{ const bm = new T.MeshBasicMaterial({ color:0x2a2a2e, side:T.DoubleSide }), wg = new T.PlaneGeometry(1.1, .4); wg.translate(.55, 0, 0); wg.rotateX(-Math.PI/2);
  for (let i = 0; i < 6; i++) { const g = new T.Group(), L = new T.Mesh(wg, bm), R = new T.Mesh(wg, bm); R.scale.x = -1;
    g.add(L); g.add(R); box(.14, .1, .6, bm, 0, 0, 0, g); scene.add(g);
    birds.push({ g, L, R, r:rr(28, 70), y:rr(16, 34), sp:rr(.12, .22)*(i%2 ? 1 : -1), ph:rnd()*6.28, cx:rr(-25, 25), cz:rr(-20, 20) }); } }

// ---------- dodatki krajobrazu: wiatraki, krowy, staw z kaczkami, strach na wróble, kępy trawy
const turbines = [];
{ const wm = lam(0xf2f2ee);
  [[-150, -210, 1], [-95, -245, 1.2], [185, -200, .9], [250, -150, 1.1]].forEach(t => { const g = new T.Group(), s = t[2];
    mesh(new T.CylinderGeometry(.8, 1.5, 44, 10), wm, 0, 22, 0, g); box(2, 2, 5, wm, 0, 44.5, .5, g);
    const rot = new T.Group(); rot.position.set(0, 44.5, 3.2); mesh(new T.SphereGeometry(1.1, 10, 8), wm, 0, 0, 0, rot);
    for (let i = 0; i < 3; i++) { const b = new T.Group(); b.rotation.z = i*2.094; const bl = box(1.5, 19, .3, wm, 0, 10, 0, b); bl.rotation.y = .25; rot.add(b); }
    g.add(rot); g.position.set(t[0], 0, t[1]); g.scale.setScalar(s); g.rotation.y = .5; scene.add(g); turbines.push(rot); }); }
{ const cw = lam(0xf4f1ea), cb = lam(0x26221f), pk = lam(0xe6a8a0);
  const cow = () => { const g = new T.Group();
    box(.75, .85, 1.9, cw, 0, 1.15, 0, g); box(.76, .5, .7, cb, 0, 1.3, .3, g); box(.77, .4, .5, cb, 0, 1.0, -.6, g);
    box(.42, .45, .6, cw, 0, 1.2, 1.2, g); box(.44, .3, .25, cb, 0, 1.3, 1.05, g); box(.34, .22, .2, pk, 0, 1.08, 1.5, g);
    [-.25, .25].forEach(x => { box(.14, .1, .06, cb, x*1.2, 1.42, 1.05, g); [-.7, .7].forEach(z => box(.16, .75, .16, cw, x, .38, z, g)); });
    box(.3, .16, .3, pk, 0, .68, -.45, g); box(.05, .7, .05, cw, 0, 1.2, -.98, g); return bake(g); };
  [[70, 8, .4], [78, 14, 2.2], [66, 22, -1], [84, -2, 3.5], [74, 30, 1.2], [-68, 12, 1.9], [-76, 20, -.4]].forEach(p => { const c = cow(); c.position.set(p[0], 0, p[1]); c.rotation.y = p[2]; scene.add(c); });
  // staw
  const pond = mesh(new T.CircleGeometry(8, 28), pho(0x4f8fb5, { metalness:.55, roughness:.06, envMapIntensity:1.5 }), 76, .035, -32, scene); pond.rotation.x = -Math.PI/2; pond.scale.set(1.3, 1, 1);
  const shore = mesh(new T.RingGeometry(7.6, 9, 28), lam(0xb7a273), 76, .03, -32, scene); shore.rotation.x = -Math.PI/2; shore.scale.set(1.3, 1, 1);
  const pg = new T.Group(), dk = lam(0xfaf8f0), or = lam(0xf29a1f), rd = lam(0x4f7d32);
  [[-2, 1, .5], [1.5, -1.5, 2], [3.5, 2, 4]].forEach(d => { const k = new T.Group(); const b = mesh(new T.SphereGeometry(.3, 10, 8), dk, 0, .12, 0, k); b.scale.set(.8, .6, 1.2);
    mesh(new T.SphereGeometry(.14, 8, 6), dk, 0, .42, .3, k); box(.08, .04, .14, or, 0, .4, .46, k); k.position.set(d[0], 0, d[1]); k.rotation.y = d[2]; pg.add(k); });
  for (let i = 0; i < 26; i++) { const a = rr(2.2, 4.6), r = rr(7.6, 9.2); cylY(.03, rr(1, 1.9), rd, Math.cos(a)*r*1.3, .7, Math.sin(a)*r, pg, 4); }
  const pk2 = bake(pg); pk2.position.set(76, 0, -32); scene.add(pk2);
  // strach na wróble
  const sg = new T.Group(), wd = lam(0x7a5a38);
  cylY(.06, 2.6, wd, 0, 1.3, 0, sg, 6); const arm = cylX(.05, 1.9, wd, 0, 1.9, 0, sg, 6);
  box(.7, .8, .3, lam(0xc23b2e), 0, 1.75, 0, sg); box(1.7, .22, .24, lam(0xc23b2e), 0, 1.92, 0, sg);
  mesh(new T.SphereGeometry(.24, 10, 8), lam(0xe2c58a), 0, 2.45, 0, sg); cylY(.42, .04, M.hat, 0, 2.62, 0, sg, 12); mesh(new T.ConeGeometry(.24, .34, 10), M.hat, 0, 2.8, 0, sg);
  const sk = bake(sg); sk.position.set(-31.5, 0, 20.5); sk.rotation.y = .6; scene.add(sk);
}
{ // kępy trawy wokół pola (widać je z kabiny i z grzbietu żyrafy)
  const parts = []; for (let i = 0; i < 6; i++) { const c = new T.ConeGeometry(.045, rr(.35, .6), 3, 1, true).toNonIndexed(); c.translate(0, .22, 0);
    c.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(rr(-.5, .5), rnd()*6, rr(-.5, .5)))); c.translate(rr(-.12, .12), 0, rr(-.12, .12)); parts.push(c); }
  const N = 3200, gm = new T.InstancedMesh(mergeGeos(parts), lam(0xffffff, { side:T.DoubleSide }), N), d = new T.Object3D(), c = new T.Color(); let n = 0, guard = 0;
  while (n < N && guard++ < 20000) { const x = rr(-54, 54), z = rr(-22, 39);
    if (Math.abs(x) < FW/2 + .8 && Math.abs(z) < FD/2 + .8) continue;
    d.position.set(x, 0, z); d.rotation.y = rnd()*6; const s = rr(.7, 1.5); d.scale.set(s, s*rr(.8, 1.3), s); d.updateMatrix(); gm.setMatrixAt(n, d.matrix);
    c.setHSL(rr(.24, .31), rr(.45, .62), rr(.3, .44)); gm.setColorAt(n++, c); }
  gm.count = n; gm.receiveShadow = true; scene.add(gm);
}

const barnArrow = new T.Group();
{ const am = new T.MeshBasicMaterial({ color:0xffd21f });
  const c = mesh(new T.ConeGeometry(1.5, 2.6, 4), am, 0, 0, 0, barnArrow); c.rotation.x = Math.PI;
  cylY(.6, 2.2, am, 0, 2.3, 0, barnArrow, 8);
  barnArrow.position.set(BARN_X, 13, -29); barnArrow.visible = false; scene.add(barnArrow); }

/* =====================================================================
   ŁAN: zboże / kukurydza (InstancedMesh, jedna kępka na komórkę)
   ===================================================================== */
const uTime = { value:0 };

const cropMat = new T.MeshLambertMaterial({ vertexColors:true, side:T.DoubleSide });
cropMat.onBeforeCompile = sh => {
  sh.uniforms.uTime = uTime; sh.uniforms.uWind = uWind;
  sh.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>',
    `#include <begin_vertex>
     #ifdef USE_INSTANCING
       float sy = length(instanceMatrix[1].xyz);
       float ph = instanceMatrix[3].x*0.33 + instanceMatrix[3].z*0.27;
       float gust = 0.6 + 0.4*sin(uTime*0.5 + instanceMatrix[3].x*0.06 - instanceMatrix[3].z*0.045);
       float sw = (sin(uTime*1.7 + ph)*0.06 + sin(uTime*3.3 + ph*1.9)*0.022)*gust*uWind;
       float bend = position.y*min(position.y, 1.4)*0.8*sy;
       transformed.x += sw*bend;
       transformed.z += sw*0.6*bend;
     #endif`);
};
let crop = null, fieldCrop = 'wheat', vehReady = false;
const dummy = new T.Object3D(), tmpC = new T.Color();
// ---------- pole dnia: kształt, odcień łanu, kwiaty w zbożu (losowane z daty i numeru pola)
const dayN = Math.floor((Date.now() - new Date().getTimezoneOffset()*60000)/864e5);
let fieldNo = 0, totalCells = CELLS, obstacles = [];
const inField = new Uint8Array(CELLS).fill(1);
function fieldRng() { let s = (dayN*2654435761 + fieldNo*40503 + 99) >>> 0;
  return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
const TONES = [[1, 1, 1], [1.06, 1.04, .9], [.93, 1.03, .84], [1.04, .95, .82], [.9, .9, .84]];
const HOLE = { cx:(FW*.63) | 0, cz:(FD*.45) | 0 };
function makeMask(variant) {
  for (let i = 0; i < CELLS; i++) { const cx = i % FW, cz = (i / FW) | 0; let ok = 1;
    if (variant === 1) { const a = (cx + .5 - FW/2)/(FW/2), b = (cz + .5 - FD/2)/(FD/2); ok = a*a + b*b <= 1.03; }
    else if (variant === 2) ok = !(cx >= FW - 22 && cz < 13);
    else if (variant === 3) ok = (cx - (FW - 28))/28 <= cz/22 + .02;
    else if (variant === 4) ok = Math.hypot(cx - HOLE.cx, cz - HOLE.cz) > 3.3;
    else if (variant === 5) ok = !(cx >= 26 && cx <= 28) && !(cz >= 17 && cz <= 18 && cx > 28);
    inField[i] = ok ? 1 : 0; }
}
const coverCv = document.createElement('canvas'); coverCv.width = FW*8; coverCv.height = FD*8;
const maskCv = document.createElement('canvas'); maskCv.width = FW; maskCv.height = FD;
const coverTex = new T.CanvasTexture(coverCv);
const cover = mesh(new T.PlaneGeometry(FW, FD), lam(0xffffff, { map:coverTex, transparent:true, alphaTest:.5 }), 0, .03, 0, scene); cover.rotation.x = -Math.PI/2; cover.receiveShadow = true;
function updateCover() {
  const mg = maskCv.getContext('2d'), im = mg.createImageData(FW, FD);
  for (let i = 0; i < CELLS; i++) { im.data[i*4] = im.data[i*4+1] = im.data[i*4+2] = 255; im.data[i*4+3] = inField[i] ? 0 : 255; }
  mg.putImageData(im, 0, 0);
  const g = coverCv.getContext('2d'), w = coverCv.width, h = coverCv.height;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); g.fillStyle = '#62a046'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = ['#58963e', '#70ae52', '#4f8c38', '#7cb85a'][i & 3]; g.fillRect(Math.random()*w, Math.random()*h, 2, 5); }
  g.globalCompositeOperation = 'destination-in'; g.imageSmoothingEnabled = true; g.drawImage(maskCv, 0, 0, w, h);
  coverTex.needsUpdate = true;
}
const fieldTree = (() => { const g = new T.Group(), lf = lam(0x4f9a3c), lf2 = lam(0x3f8530);
  cylY(.3, 3.2, lam(0x6d4b2c), 0, 1.6, 0, g, 8).scale.set(1, 1, 1);
  [[0, 5, 0, 2.3], [1.3, 4.3, .4, 1.6], [-1.2, 4.4, -.5, 1.7], [.2, 4.2, -1.3, 1.5], [-.3, 4.4, 1.3, 1.5]].forEach((c, i) => { const m = mesh(new T.IcosahedronGeometry(c[3], 1), i % 2 ? lf2 : lf, c[0], c[1], c[2], g); m.scale.y = .85; });
  for (let i = 0; i < 14; i++) { const a = rnd()*6.28, r = rr(1.2, 2.4); mesh(new T.SphereGeometry(.12, 6, 5), lam(0xd9c545), Math.sin(a)*r, rr(3.2, 4.2), Math.cos(a)*r, g); }   // gruszki
  const b = bake(g); b.position.set(X0 + HOLE.cx + .5, 0, Z0 + HOLE.cz + .5); b.visible = false; scene.add(b); return b; })();
const FLOWER_N = 170, fieldFlowers = new T.InstancedMesh(new T.SphereGeometry(.075, 6, 4), lam(0xffffff), FLOWER_N), flowerAt = new Map();
fieldFlowers.frustumCulled = false; scene.add(fieldFlowers);
function rollField(wheat) {
  const fr = fieldRng(); let acc = 0; const wr = fr(), w = WEATHERS.find(q => (acc += q.p) > wr) || WEATHERS[0], variant = (fr()*6) | 0, tone = TONES[(fr()*TONES.length) | 0];
  makeMask(variant); updateCover(); applyWeather(w);
  fieldTree.visible = variant === 4; obstacles = variant === 4 ? [{ x:fieldTree.position.x, z:fieldTree.position.z, r:1.2 }] : [];
  totalCells = 0; for (let i = 0; i < CELLS; i++) totalCells += inField[i];
  flowerAt.clear(); let n = 0; const want = wheat ? 60 + ((fr()*110) | 0) : 0;
  for (let k = 0; k < want*3 && n < want; k++) { const i = (fr()*CELLS) | 0; if (!inField[i] || flowerAt.has(i)) continue;
    dummy.position.set(X0 + (i % FW) + .2 + fr()*.6, .98 + fr()*.12, Z0 + ((i / FW) | 0) + .2 + fr()*.6); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, .6, 1); dummy.updateMatrix(); fieldFlowers.setMatrixAt(n, dummy.matrix);
    tmpC.setHex(fr() < .6 ? 0xe5332a : 0x3d63d8); fieldFlowers.setColorAt(n, tmpC); flowerAt.set(i, n++); }
  fieldFlowers.count = n; fieldFlowers.instanceMatrix.needsUpdate = true; if (fieldFlowers.instanceColor) fieldFlowers.instanceColor.needsUpdate = true;
  return tone;
}

const cut = new Uint8Array(CELLS), rotA = new Float32Array(CELLS), hs = new Float32Array(CELLS), jx = new Float32Array(CELLS), jz = new Float32Array(CELLS);
let cutCount = 0, sinceBale = 0, cropDirty = false;
// ---------- stany pola przez cały rok: ściernisko → orka → siew → wzrost
const cst = new Uint8Array(CELLS), ripeC = new Float32Array(CELLS*3);
let ploughed = 0, sown = 0, growing = 0, year = 1, sinceRound = 0, stDirty = false, growTick = 0, workFx = 0;
const stCv = document.createElement('canvas'); stCv.width = FW*8; stCv.height = FD*8; const stG = stCv.getContext('2d'), stTex = new T.CanvasTexture(stCv);
const stPlane = mesh(new T.PlaneGeometry(FW, FD), lam(0xffffff, { map:stTex, transparent:true, alphaTest:.5 }), 0, .038, 0, scene); stPlane.rotation.x = -Math.PI/2; stPlane.receiveShadow = true;
function paintCell(i, k) { const x = (i % FW)*8, y = ((i / FW) | 0)*8;
  if (k === 1) { stG.fillStyle = '#5b3f26'; stG.fillRect(x, y, 8, 8); stG.fillStyle = '#3f2a18'; stG.fillRect(x, y + 1, 8, 2); stG.fillRect(x, y + 5, 8, 2); stG.fillStyle = '#77563b'; stG.fillRect(x, y + 3, 8, 1); stG.fillRect(x, y + 7, 8, 1); }
  else { stG.fillStyle = '#7d5d3e'; stG.fillRect(x, y, 8, 8); stG.fillStyle = '#6a4a2f'; stG.fillRect(x, y + 2, 8, 1); stG.fillRect(x, y + 6, 8, 1);
    stG.fillStyle = '#bfe070'; stG.fillRect(x + 1, y + 2, 1, 1); stG.fillRect(x + 5, y + 2, 1, 1); stG.fillRect(x + 3, y + 6, 1, 1); stG.fillRect(x + 7, y + 6, 1, 1); }
  stDirty = true; }
function clearStates() { cst.fill(0); ploughed = sown = 0; sinceRound = 0; stG.clearRect(0, 0, stCv.width, stCv.height); stDirty = true; }
function setCell(i, isCut) {
  if (!inField[i] || (!growing && (cst[i] & 1))) { dummy.position.set(0, -9, 0); dummy.scale.set(0, 0, 0); dummy.updateMatrix(); crop.setMatrixAt(i, dummy.matrix); return; }
  if (growing > 0) { const g = growing, w = .35 + .65*g; dummy.position.set(X0 + (i % FW) + .5 + jx[i], .03, Z0 + ((i / FW) | 0) + .5 + jz[i]); dummy.rotation.set(0, rotA[i], 0);
    dummy.scale.set(w, hs[i]*Math.max(.04, g), w); dummy.updateMatrix(); crop.setMatrixAt(i, dummy.matrix); return; }
  const wheat = fieldCrop === 'wheat';   // po skoszeniu kępka chowa się tuż pod ściernisko, zostają krótkie źdźbła
  dummy.position.set(X0 + (i % FW) + .5 + jx[i], isCut ? (wheat ? -.13 : -.02) : .03, Z0 + ((i / FW) | 0) + .5 + jz[i]);
  dummy.rotation.set(0, rotA[i], 0);
  dummy.scale.set(1, isCut ? (wheat ? .16 : .05) : hs[i], 1);
  dummy.updateMatrix(); crop.setMatrixAt(i, dummy.matrix);
}
function buildField(kind, regrow) {
  if (crop) { scene.remove(crop); crop.geometry.dispose(); }
  if (!regrow) { growing = 0; year = 1; clearStates(); }
  fieldCrop = kind; const wheat = kind === 'wheat', tone = regrow ? [1, 1, 1] : rollField(wheat);
  crop = new T.InstancedMesh(tuftGeo(kind), cropMat, CELLS);
  crop.frustumCulled = false; crop.receiveShadow = true;
  const ox = rnd()*50, oz = rnd()*50;
  for (let i = 0; i < CELLS; i++) { const cx = i % FW, cz = (i / FW) | 0;
    cut[i] = inField[i] && !regrow ? 0 : 1; hs[i] = rr(.9, 1.1);
    if (wheat) { rotA[i] = rnd()*6.283; jx[i] = rr(-.1, .1); jz[i] = rr(-.1, .1); } else { rotA[i] = rnd() < .5 ? 0 : Math.PI; jx[i] = rr(-.03, .03); jz[i] = 0; }
    setCell(i, false);
    const n = vnoise(cx/7 + ox, cz/7 + oz), n2 = vnoise(cx/3 + oz, cz/3 + ox), k = .86 + n*.2 + n2*.07;
    if (wheat) tmpC.setRGB(k*1.04*tone[0], k*(.96 + n2*.07)*tone[1], k*(.82 + n*.12)*tone[2]); else tmpC.setRGB(k*(.92 + n2*.14)*tone[1], k*1.03*tone[0], k*.9*tone[2]);
    ripeC[i*3] = tmpC.r; ripeC[i*3+1] = tmpC.g; ripeC[i*3+2] = tmpC.b; crop.setColorAt(i, tmpC); }
  scene.add(crop); cutCount = regrow ? totalCells : 0; sinceBale = 0;
  M.grain.color.setHex(wheat ? 0xe9bd4a : 0xf7d223);
  if (vehReady) applyHeader();
}

/* =====================================================================
   CZĄSTKI (plewy, dym, konfetti)
   ===================================================================== */
const PN = 320, pPos = new Float32Array(PN*3), pCol = new Float32Array(PN*3), pVel = new Float32Array(PN*3), pLife = new Float32Array(PN), pGrav = new Float32Array(PN);
let pNext = 0;
for (let i = 0; i < PN; i++) pPos[i*3 + 1] = -99;
const pGeo = new T.BufferGeometry();
pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(pCol, 3));
const dotTex = tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 2, 16, 16, 15); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.6, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
const points = new T.Points(pGeo, new T.PointsMaterial({ size:.42, map:dotTex, vertexColors:true, transparent:true, opacity:.9, depthWrite:false }));
points.frustumCulled = false; scene.add(points);

/* =====================================================================
   KOMBAJN
   ===================================================================== */

function applyHeader() { const P = veh.combine.P, corn = fieldCrop === 'corn'; P.cornHead.visible = corn; P.grainHead.visible = P.reel.visible = P.knife.visible = !corn; }
const lugDummy = new T.Object3D();
function updateLugs(P, t) { let i = 0;
  for (let gi = 0; gi < 6; gi++) for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 6; k++) {
    lugDummy.position.set(-2.5 + gi + s*.19, .58, 4.3 + (1 - ((t*1.3 + k/6) % 1))*1.5); lugDummy.updateMatrix(); P.lugs.setMatrixAt(i++, lugDummy.matrix); }
  P.lugs.instanceMatrix.needsUpdate = true; }

/* =====================================================================
   ŻYRAFA (trzeci „pojazd”: zjada łan, jedzie się na grzbiecie)
   ===================================================================== */

const uncutAt = (x, z) => { const cx = Math.floor(x - X0), cz = Math.floor(z - Z0); return cx >= 0 && cz >= 0 && cx < FW && cz < FD && !cut[cz*FW + cx]; };
function updateGiraffe(dt) {
  const G = veh.giraffe, a = G.a, on = S.active === 'giraffe', sp = Math.abs(G.v), amt = Math.min(1, sp/1.5);
  G.walk += sp*dt*1.5; a.moving = amt > .1; a.gait = sp*3;
  const stepN = Math.floor(G.walk/Math.PI); if (stepN !== G.stepN) { G.stepN = stepN; if (on && amt > .2) sfx.step(); }
  ZOO.anim(a, dt);
  let want = 0;                                    // czy przed pyskiem coś rośnie?
  if (on) { const sh = Math.sin(G.h), ch = Math.cos(G.h);
    const R = 5.4; let best = 1e9;                 // szuka najbliższej rośliny dookoła, nie tylko z przodu
    for (let dz = -R; dz <= R; dz += 1) for (let dx = -R; dx <= R; dx += 1) { const wx = Math.floor(G.x + dx) + .5, wz = Math.floor(G.z + dz) + .5, ex = wx - G.x, ez = wz - G.z, d = Math.hypot(ex, ez);
      if (d > R || d < 1.3 || !uncutAt(wx, wz)) continue; const an = wrap(Math.atan2(ex, ez) - G.h); if (Math.abs(an) > 2.7) continue;
      const sc = d + Math.abs(an)*.9; if (sc < best) { best = sc; want = 1; G.tx = wx; G.tz = wz; G.ta = an; G.td = d; } } }
  G.eat += (want - G.eat)*Math.min(1, dt*6);
  G.yaw += ((want ? G.ta : 0) - G.yaw)*Math.min(1, dt*7); const near = 1 - clamp((G.td - 1.5)/3, 0, 1);
  // szyja w dół, do najbliższej rośliny (ZOO.anim ustawia tylko pochylenie bazowe)
  a.neck.rotation.z -= G.eat*(1.6 + near*.5); a.neck.rotation.y = G.yaw*G.eat + Math.sin(time*5)*.07*G.eat; a.head.rotation.z += G.eat*1.1;
  if (on && want && G.eat > .7 && Math.abs(G.yaw - G.ta) < .6) {
    const hx = G.tx, hz = G.tz, before = cutCount;
    for (let a = -1.1; a <= 1.11; a += 1.1) for (let b = -1.1; b <= 1.11; b += 1.1) harvestAt(hx + a, hz + b);
    if (cutCount > before) { G.chew = 1; if (time - G.lastCrunch > .14) { G.lastCrunch = time; sfx.crunch(); } } }
  G.chew = Math.max(0, G.chew - dt*1.1);
  a.open = Math.max(a.open, Math.abs(Math.sin(time*11))*Math.min(1, G.chew*3));
}

/* =====================================================================
   DUŻY TRAKTOR Z NARZĘDZIAMI (pług, siewnik, prasa) I SŁOŃ
   ===================================================================== */
Object.assign(M, { bBlue:pho(0x1f5fb8), bBlueD:pho(0x174a90), blanket:lam(0xc23b2e),
  imp:pho(0xd8301f), impY:pho(0xf2c21f), soilP:lam(0x4e3520) });

const TOOLS = ['plough', 'seeder', 'baler'], TOOL_Z = { plough:-4.3, seeder:-4.0, baler:-3.3 }, TOOL_LBL = { plough:['🟤', 'Pług'], seeder:['🌱', 'Siewnik'], baler:['🌀', 'Prasa'] };

// uniesienie trąby (ZOO a.lift) w fazach chwytania beli: sięga w dół, podnosi, wraca
const TRUNK = { rest:0, reach:-.6, lift:2.2 };
function updateElephant(dt) {
  const E = veh.elephant, a = E.a, on = S.active === 'elephant', sp = Math.abs(E.v), amt = Math.min(1, sp/1.5);
  E.walk += sp*dt*1.15; a.moving = amt > .1; a.gait = sp*2.3;
  const stepN = Math.floor(E.walk/Math.PI); if (stepN !== E.stepN) { E.stepN = stepN; if (on && amt > .2) sfx.estep(); }
  E.grab = Math.max(0, E.grab - dt*1.3); const p = E.grab > 0 ? 1 - E.grab : 1;
  const lerp = T.MathUtils.lerp;
  a.lift = p < .3 ? lerp(TRUNK.rest, TRUNK.reach, p/.3) : p < .65 ? lerp(TRUNK.reach, TRUNK.lift, (p - .3)/.35) : lerp(TRUNK.lift, TRUNK.rest, Math.min(1, (p - .65)/.35));
  ZOO.anim(a, dt);
}

/* =====================================================================
   URSUS C-330 + PRZYCZEPA
   ===================================================================== */

const HITCH_L = 4.1;

const veh = { combine:buildCombine(), tractor:buildTractor(), giraffe:buildGiraffe(), big:buildBigTractor(), elephant:buildElephant() };
const ORDER = ['combine', 'tractor', 'big', 'giraffe', 'elephant'];
const trailer = buildTrailer();
vehReady = true; applyHeader(); updateLugs(veh.combine.P, 0);
const slotPos = i => { const j = i % 8, L = (i / 8) | 0; return new T.Vector3(j % 2 ? .56 : -.56, 1.47 + L*.61, -1.65 + ((j / 2) | 0)*1.1); };

/* =====================================================================
   KOSTKI SŁOMY
   ===================================================================== */
const baleGeo = rboxGeo(1.05, .6, 1.05, .07), roundGeo = new T.CylinderGeometry(.62, .62, 1.15, 18).rotateZ(Math.PI/2);
let bales = [], stored = 0, unloadT = 0;
const TANK_CAP = 320, TR_GRAIN_CAP = 900; let tank = 0, siloGrain = 0, pipeA = 0, tankToast = false;
const CAR = {                                        // kto może wozić słomę: przyczepa Ursusa i kosz na grzbiecie słonia
  tractor:{ node:trailer.g, bales:[], cap:TRAILER_CAP, slot:slotPos, v:veh.tractor },
  elephant:{ node:veh.elephant.P.basket, bales:[], cap:10, slot:i => new T.Vector3(i % 2 ? .56 : -.56, .36 + ((i / 4) | 0)*.62, (i >> 1) % 2 ? .56 : -.56), v:veh.elephant } };
const carrier = () => CAR[S.active] || null;
const tankBar = new T.Group();                       // delikatny pasek napełnienia zbiornika nad kombajnem
{ const bg = new T.Mesh(new T.PlaneGeometry(1.7, .17), new T.MeshBasicMaterial({ color:0x2b2118, transparent:true, opacity:.45, depthTest:false })); bg.renderOrder = 5; tankBar.add(bg);
  const fg = new T.Mesh(new T.PlaneGeometry(1.6, .09), new T.MeshBasicMaterial({ color:0xf2c230, transparent:true, opacity:.9, depthTest:false })); fg.renderOrder = 6; fg.position.z = .01; tankBar.add(fg);
  tankBar.userData.fg = fg; scene.add(tankBar); }
function spawnBale(round) {
  const c = round ? veh.big : veh[S.active === 'giraffe' ? 'giraffe' : 'combine'], m = new T.Mesh(round ? roundGeo : baleGeo, M.bale); m.castShadow = true; m.receiveShadow = true;
  const from = c.g.localToWorld(round ? new T.Vector3(0, 1.3, -5.3) : c.baleFrom.clone()), to = c.g.localToWorld(round ? new T.Vector3(0, .62, -6.9) : c.baleTo.clone());
  to.x = clamp(to.x, -WORLD.x, WORLD.x); to.z = clamp(to.z, WORLD.zMin + 4, WORLD.zMax);
  m.position.copy(from); m.rotation.y = c.h; scene.add(m);
  bales.push({ m, st:'drop', t:0, from, to, round:!!round }); sfx.thud(); if (c === veh.giraffe || round) tone(300, .22, 'triangle', .25, 620, .05);
  for (let i = 0; i < 10; i++) emit(from.x + rr(-.5, .5), 1.4, from.z + rr(-.5, .5), rr(-1, 1), rr(.5, 2), rr(-1, 1), rr(.5, 1), .95, .8, .35, 6);
}
function updateBales(dt) {
  const car = carrier();
  for (let i = bales.length - 1; i >= 0; i--) { const b = bales[i];
    if (b.st === 'drop') { b.t = Math.min(1, b.t + dt*2.2); const e = b.t;
      b.m.position.lerpVectors(b.from, b.to, e); b.m.position.y = b.from.y + (b.to.y - b.from.y)*e*e + Math.sin(e*Math.PI)*.4;
      b.m.rotation.x = (1 - e)*-.9; if (b.t >= 1) { b.st = 'field'; b.m.rotation.x = 0; } }
    else if (b.st === 'field') {
      if (car && car.bales.length < car.cap) { const px = b.m.position.x, pz = b.m.position.z;
        let near = Math.hypot(px - car.v.x, pz - car.v.z) < (car === CAR.elephant ? 6.5 : 3.1); if (car === CAR.tractor && Math.hypot(px - trailer.x, pz - trailer.z) < 3.1) near = true;
        if (near) { car.node.attach(b.m); b.st = 'fly'; b.t = 0; b.from = b.m.position.clone(); b.to = car.slot(car.bales.length);
          b.r0 = b.m.rotation.y; car.bales.push(b); sfx.pop(car.bales.length); if (car === CAR.elephant) veh.elephant.grab = 1; hud(); } } }
    else if (b.st === 'fly') { b.t = Math.min(1, b.t + dt*2.6); const e = b.t*b.t*(3 - 2*b.t);
      b.m.position.lerpVectors(b.from, b.to, e); b.m.position.y += Math.sin(b.t*Math.PI)*1.6;
      b.m.rotation.set(0, b.r0*(1 - e), 0); if (b.t >= 1) b.st = 'trailer'; }
    else if (b.st === 'unload') { b.t = Math.min(1, b.t + dt*1.9); const e = b.t;
      b.m.position.lerpVectors(b.from, BARN_DOOR, e); b.m.position.y += Math.sin(e*Math.PI)*3; b.m.rotation.x += dt*5;
      if (b.t >= 1) { scene.remove(b.m); bales.splice(i, 1); stored++; hud(); checkWin(); } }
  }
  // rozładunek pod stodołą
  if (car && car.bales.length && car.v.z < -18.5 && Math.abs(car.v.x - BARN_X) < 10) {
    unloadT -= dt;
    if (unloadT <= 0) { const b = car.bales[car.bales.length - 1];
      if (b.st === 'trailer') { car.bales.pop(); scene.attach(b.m); b.st = 'unload'; b.t = 0; b.from = b.m.position.clone(); unloadT = .16; sfx.blip(520 + stored*14); hud(); } } }
}
// ---------- ziarno: kombajn → przyczepa → silos (dodatek, nie trzeba tego robić)
function updateGrain(dt) {
  const c = veh.combine, t = veh.tractor, dx = trailer.x - c.x, dz = trailer.z - c.z;
  const pour = (S.active === 'combine' || S.active === 'tractor') && Math.hypot(dx, dz) < 8.5 && tank > 0 && trailer.grain < TR_GRAIN_CAP;
  pipeA += ((pour ? 1 : 0) - pipeA)*Math.min(1, dt*3);
  const side = dx*Math.cos(c.h) - dz*Math.sin(c.h) < 0 ? 1 : -1; if (pipeA < .05) c.pipeSide = side;
  c.P.pipe.rotation.y = pipeA*Math.PI/2*(c.pipeSide || 1);
  if (pour && pipeA > .8) { const q = Math.min(tank, 80*dt); tank -= q; trailer.grain += q; AU.thrLevel = Math.max(AU.thrLevel, .5); c.P.grain.position.y = 3.05 + .8*(tank/TANK_CAP);
    c.P.pipe.localToWorld(tmpV.set(-.15, -.25, -3.45));
    for (let i = 0; i < 3; i++) emit(tmpV.x + rr(-.1, .1), tmpV.y, tmpV.z + rr(-.1, .1), (trailer.x - tmpV.x)*.9 + rr(-.4, .4), -1, (trailer.z - tmpV.z)*.9 + rr(-.4, .4), .7, .96, .78, .25, 9); }
  if (S.active === 'tractor' && trailer.grain > 0 && t.z < -18.5 && Math.abs(t.x - BARN_X) < 14) { const q = Math.min(trailer.grain, 160*dt); trailer.grain -= q; siloGrain += q;
    for (let i = 0; i < 2; i++) emit(trailer.x + rr(-1, 1), 1.6, trailer.z + rr(-1, 1), (SILO.x - trailer.x)*.5, rr(6, 9), (SILO.z - trailer.z)*.5, 1.1, .96, .78, .25, 9);
    if (Math.random() < .2) sfx.blip(700); }
  const hp = trailer.grain/TR_GRAIN_CAP; trailer.heap.visible = hp > .003; trailer.heap.scale.y = .04 + hp*.42; trailer.heap.position.y = 1.17 + trailer.heap.scale.y/2;
  $('grainN').textContent = Math.floor(siloGrain/20);
  { const f = tank/TANK_CAP, fg = tankBar.userData.fg; tankBar.visible = !(S.cam === 2 && S.active === 'combine'); tankBar.position.set(c.x, 5.9, c.z); tankBar.quaternion.copy(camera.quaternion);
    fg.scale.x = Math.max(.001, f); fg.position.x = -.8*(1 - f); fg.material.color.setHex(f >= 1 ? 0xe8402c : 0xf2c230); }
}

/* =====================================================================
   DŹWIĘK (Web Audio, wszystko syntetyczne)
   ===================================================================== */
const AU = { ctx:null, thrLevel:0 };
function initAudio() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const ctx = AU.ctx = new C();
  AU.master = ctx.createGain(); AU.master.gain.value = S.muted ? 0 : .7;
  const comp = ctx.createDynamicsCompressor(); AU.master.connect(comp); comp.connect(ctx.destination);
  const nb = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
  AU.noiseBuf = nb;
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; s.start(); return s; };
  const mkEngine = p => {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator(), lfo = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square'; o3.type = 'sawtooth'; lfo.type = p.lfoType || 'sine';
    const g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain(), lp = ctx.createBiquadFilter(), amp = ctx.createGain(), lg = ctx.createGain(), out = ctx.createGain();
    g1.gain.value = .5; g2.gain.value = .35; g3.gain.value = .22; lp.type = 'lowpass'; lp.frequency.value = p.lp; lp.Q.value = 1.2;
    amp.gain.value = 1 - p.depth*.5; lg.gain.value = p.depth*.5; out.gain.value = 0;
    o1.connect(g1); o2.connect(g2); o3.connect(g3); g1.connect(lp); g2.connect(lp); g3.connect(lp); lp.connect(amp); amp.connect(out); out.connect(AU.master);
    lfo.connect(lg); lg.connect(amp.gain);
    const rumble = noise(), rf = ctx.createBiquadFilter(), rg = ctx.createGain(); rf.type = 'bandpass'; rf.frequency.value = p.lp*.6; rf.Q.value = .7; rg.gain.value = .25;
    rumble.connect(rf); rf.connect(rg); rg.connect(amp);
    [o1, o2, o3, lfo].forEach(o => o.start());
    return { o1, o2, o3, lfo, lp, out, p };
  };
  AU.eng = { big:mkEngine({ f0:54, f1:112, c0:10, c1:21, depth:.5, lp:640, vol:.38 }), combine:mkEngine({ f0:62, f1:122, c0:12, c1:24, depth:.35, lp:760, vol:.34 }),
             tractor:mkEngine({ f0:44, f1:98, c0:7, c1:16, depth:.8, lp:560, vol:.4 }) };
  // omłot (szum pasmowy) i terkot maszyny
  const tn = noise(), tf = ctx.createBiquadFilter(); tf.type = 'bandpass'; tf.frequency.value = 1500; tf.Q.value = .8;
  AU.thr = ctx.createGain(); AU.thr.gain.value = 0; tn.connect(tf); tf.connect(AU.thr); AU.thr.connect(AU.master);
  const mn = noise(), mf = ctx.createBiquadFilter(); mf.type = 'bandpass'; mf.frequency.value = 380; mf.Q.value = 2;
  const ma = ctx.createGain(); ma.gain.value = .5; const ml = ctx.createOscillator(); ml.type = 'square'; ml.frequency.value = 9; const mlg = ctx.createGain(); mlg.gain.value = .5;
  ml.connect(mlg); mlg.connect(ma.gain); ml.start();
  { const rn = noise(), rf = ctx.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 2200; AU.rainG = ctx.createGain(); AU.rainG.gain.value = 0; rn.connect(rf); rf.connect(AU.rainG); AU.rainG.connect(AU.master); }
  AU.mach = ctx.createGain(); AU.mach.gain.value = 0; mn.connect(mf); mf.connect(ma); ma.connect(AU.mach); AU.mach.connect(AU.master);
}
function setEngine(name, rpm, on) {
  if (!AU.ctx) return; const e = AU.eng[name], p = e.p, t = AU.ctx.currentTime, f = p.f0 + (p.f1 - p.f0)*rpm;
  e.o1.frequency.setTargetAtTime(f, t, .08); e.o2.frequency.setTargetAtTime(f/2, t, .08); e.o3.frequency.setTargetAtTime(f*1.5 + 1.5, t, .08);
  e.lfo.frequency.setTargetAtTime(p.c0 + (p.c1 - p.c0)*rpm, t, .08);
  e.lp.frequency.setTargetAtTime(p.lp*(1 + rpm*.9), t, .1);
  e.out.gain.setTargetAtTime(on ? p.vol*(.7 + rpm*.5) : 0, t, .12);
}

function noiseBurst(freq, dur, vol) { const c = AU.ctx; if (!c) return; const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
  s.buffer = AU.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.4; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random()*1.5, dur + .05); }
const sfx = {
  trumpet:() => { tone(310, .22, 'sawtooth', .2, 640); tone(640, .55, 'sawtooth', .22, 540, .2); tone(645, .5, 'square', .07, 548, .22); }, estep:() => tone(58, .17, 'sine', .5, 30),
  crunch:() => noiseBurst(1900 + Math.random()*1200, .1, .7), step:() => tone(85, .11, 'sine', .32, 42),
  giraffe:() => { tone(210, .45, 'sawtooth', .13, 340); tone(340, .4, 'triangle', .2, 560, .2); tone(560, .25, 'triangle', .16, 420, .5); },
  thud:() => tone(130, .25, 'sine', .5, 45),
  pop:n => tone(380 + n*22, .14, 'triangle', .35, 760 + n*22),
  blip:f => tone(f, .12, 'square', .16, f*1.5),
  horn:tr => { if (tr) { tone(392, .55, 'square', .16); tone(494, .55, 'square', .14); } else { tone(196, .7, 'sawtooth', .2); tone(247, .7, 'sawtooth', .18); } },
  win:() => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, .32, 'triangle', .3, 0, i*.15)),
};

/* =====================================================================
   STEROWANIE
   ===================================================================== */
const keys = { up:0, down:0, left:0, right:0 };
const ARROW = '<svg viewBox="0 0 40 40" width="56%" height="56%" aria-hidden="true"><path d="M20 6 L35 30 Q36 33 32 33 L8 33 Q4 33 5 30 Z" fill="currentColor"/></svg>';
[['pU', 0], ['pR', 90], ['pD', 180], ['pL', 270]].forEach(([id, rot]) => {
  const b = $(id); b.innerHTML = ARROW; b.firstChild.style.transform = 'rotate(' + rot + 'deg)';
  const k = b.dataset.k, set = v => { keys[k] = v; b.classList.toggle('on', !!v); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} set(1); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => set(0)));
});
const KEYMAP = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right' };
addEventListener('keydown', e => { const k = KEYMAP[e.key]; if (k) { keys[k] = 1; e.preventDefault(); }
  else if (S.running && !e.repeat) { if (e.key === ' ') horn(); else if (e.key === 'c') nextCam(); else if (e.key === 'v') selectVehicle(ORDER[(ORDER.indexOf(S.active) + 1) % ORDER.length]); else if (e.key === 't' && S.active === 'big') nextTool(); } });
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = 0; });
addEventListener('blur', () => { keys.up = keys.down = keys.left = keys.right = 0; });
document.addEventListener('touchmove', e => { if (S.running) e.preventDefault(); }, { passive:false });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

/* przechylanie telefonu */
const tilt = { on:false, x:0, y:0, cal:true, r0:0, f0:0, events:0, listening:false };
function onTilt(e) {
  if (e.beta == null || e.gamma == null) return; tilt.events++;
  const so = screen.orientation, ang = so && typeof so.angle === 'number' ? so.angle : (window.orientation || 0);
  let right, fwd;                      // stopnie: w prawo / do przodu (górna krawędź ekranu od siebie)
  if (ang === 90) { right = e.beta; fwd = e.gamma; }
  else if (ang === 270 || ang === -90) { right = -e.beta; fwd = -e.gamma; }
  else if (ang === 180) { right = -e.gamma; fwd = e.beta; }
  else { right = e.gamma; fwd = -e.beta; }
  if (tilt.cal) { tilt.r0 = right; tilt.f0 = fwd; tilt.cal = false; }
  tilt.x = clamp((right - tilt.r0)/17, -1, 1); tilt.y = clamp((fwd - tilt.f0)/17, -1, 1);
}

addEventListener('orientationchange', () => { tilt.cal = true; });
$('bCal').addEventListener('click', () => { tilt.cal = true; toast('Środek ustawiony'); });

function readInput() {
  let x = keys.right - keys.left, y = keys.up - keys.down;
  if (tilt.on) { let tx = tilt.x, ty = tilt.y; if (Math.hypot(tx, ty) < .2) tx = ty = 0; x += tx; y += ty; }
  return [clamp(x, -1, 1), clamp(y, -1, 1)];
}

/* =====================================================================
   LOGIKA JAZDY
   ===================================================================== */
function place(v, x, z, h) { v.x = x; v.z = z; v.h = h; v.v = 0; v.steer = 0; v.g.position.set(x, 0, z); v.g.rotation.y = h; v.g.updateMatrixWorld(true); }
function resetTrailer() { const t = veh.tractor, hp = t.inner.localToWorld(t.hitch.clone());
  trailer.h = t.h; trailer.x = hp.x - Math.sin(t.h)*HITCH_L; trailer.z = hp.z - Math.cos(t.h)*HITCH_L;
  trailer.g.position.set(trailer.x, 0, trailer.z); trailer.g.rotation.y = trailer.h; }
function newField(kind) {
  bales.forEach(b => { if (b.m.parent) b.m.parent.remove(b.m); }); bales = []; CAR.tractor.bales.length = 0; CAR.elephant.bales.length = 0; stored = 0; won = false; winT = 0; fieldNo++; tank = 0; siloGrain = 0; trailer.grain = 0; tankToast = false;
  buildField(kind);
  place(veh.combine, -24.5, 25, Math.PI); place(veh.tractor, 2, 26.5, Math.PI/2); place(veh.giraffe, -36, 22, Math.PI); place(veh.big, 24, 27.5, Math.PI/2); place(veh.elephant, -41, 6, Math.PI); resetTrailer();
  S.active = 'combine'; camSnap = true; hud();
}
function harvestAt(x, z) {
  const cx = Math.floor(x - X0), cz = Math.floor(z - Z0); if (cx < 0 || cz < 0 || cx >= FW || cz >= FD) return;
  const i = cz*FW + cx; if (cut[i]) return;
  { const fi = flowerAt.get(i); if (fi !== undefined) { dummy.position.set(0, -9, 0); dummy.scale.set(0, 0, 0); dummy.updateMatrix(); fieldFlowers.setMatrixAt(fi, dummy.matrix); fieldFlowers.instanceMatrix.needsUpdate = true; } }
  cut[i] = 1; setCell(i, true); tmpC.setRGB(.92, .86, .68); crop.setColorAt(i, tmpC); cropDirty = true; cutCount++; sinceBale++;
  AU.thrLevel = Math.min(1, AU.thrLevel + .22);
  if (S.active === 'combine') { tank = Math.min(TANK_CAP, tank + 1); if (tank >= TANK_CAP && !tankToast) { tankToast = true; toast('Zbiornik pełny! Podjedź pod przyczepę Ursusa, to przesypiesz ziarno.'); } }
  const corn = fieldCrop === 'corn';
  for (let k = 0; k < 2; k++) emit(x + rr(-.4, .4), rr(.5, 1.3), z + rr(-.4, .4), rr(-1.5, 1.5), rr(1.5, 4), rr(-1.5, 1.5), rr(.5, 1.1), corn ? .55 : .96, corn ? .75 : .82, corn ? .25 : .36, 7);
  if (sinceBale >= CELLS_PER_BALE || cutCount === totalCells) { sinceBale = 0; spawnBale(); }
}
function workAt(x, z, tool) {                       // duży traktor: pług, siewnik albo prasa
  const cx = Math.floor(x - X0), cz = Math.floor(z - Z0); if (cx < 0 || cz < 0 || cx >= FW || cz >= FD) return;
  const i = cz*FW + cx; if (!inField[i] || !cut[i] || growing > 0) return;
  if (tool === 'plough') { if (cst[i] & 1) return; cst[i] |= 1; ploughed++; paintCell(i, 1); setCell(i, true); cropDirty = true; workFx = 1;
    if (Math.random() < .5) emit(x, .2, z, rr(-1, 1), rr(1, 2.6), rr(-1, 1), rr(.4, .8), .34, .23, .14, 7); }
  else if (tool === 'seeder') { if (!(cst[i] & 1) || (cst[i] & 2)) return; cst[i] |= 2; sown++; paintCell(i, 2); workFx = 1; if (sown >= totalCells) startGrow(); }
  else { if (cst[i] & 5) return; cst[i] |= 4; workFx = 1; if (Math.random() < .4) emit(x, .3, z, rr(-1, 1), rr(1, 2.5), rr(-1, 1), rr(.4, .8), .95, .8, .36, 7);
    if (++sinceRound >= 70) { sinceRound = 0; spawnBale(true); } }
}
function startGrow() { growing = .001; if (S.crop !== fieldCrop) buildField(S.crop, true); clearStates(); sfx.win(); toast('Wszystko posiane! Rośnie nowy łan 🌱'); }
function updateGrow(dt) {
  if (!growing) return; growing = Math.min(1, growing + dt/13); if (++growTick % 3 && growing < 1) return;
  const q = growing*growing, done = growing >= 1; if (done) growing = 0;
  for (let i = 0; i < CELLS; i++) { if (!inField[i]) continue; if (done) cut[i] = 0; setCell(i, !done);
    tmpC.setRGB(.42 + (ripeC[i*3] - .42)*q, .8 + (ripeC[i*3+1] - .8)*q, .3 + (ripeC[i*3+2] - .3)*q); crop.setColorAt(i, tmpC); }
  cropDirty = true;
  if (done) { cutCount = 0; sinceBale = 0; won = false; year++; let acc = 0; const r = Math.random(); applyWeather(WEATHERS.find(w => (acc += w.p) > r) || WEATHERS[0]); applyHeader();
    toast('Rok ' + year + ': łan dojrzał, można kosić!'); hud(); }
}
const tmpV = new T.Vector3();
let smokeT = 0, hudT = 0, won = false, winT = 0, time = 0, lastWork = 0;
function update(dt) {
  time += dt;
  const A = veh[S.active], [ix, iy] = readInput(), rel = S.cam !== 0;
  let thr = 0, steerT = 0;
  if (!rel) {                                   // widok z góry: jedziesz tam, gdzie wskazuje strzałka
    const m = Math.hypot(ix, iy);
    if (m > .2) { const d = wrap(Math.atan2(ix, -iy) - A.h); A.h += clamp(d, -A.turnRate*dt, A.turnRate*dt);
      thr = Math.min(1, m)*(Math.abs(d) > 1.5 ? .35 : 1); steerT = clamp(d*1.3, -.55, .55); }
  } else {                                      // z tyłu / z kabiny: jak auto
    steerT = -ix*.55; thr = Math.abs(iy) > .15 ? iy : (Math.abs(ix) > .2 ? .8 : 0);   // sam skręt też jedzie do przodu: sterowanie jednym palcem
  }
  A.steer += (steerT - A.steer)*Math.min(1, dt*7);
  const tv = thr > 0 ? thr*A.maxF : thr*A.maxR;
  A.v += (tv - A.v)*Math.min(1, dt*(thr ? 2.2 : 3.2));
  if (rel) A.h = wrap(A.h + A.steer*A.v*A.turnK*dt);
  A.x += Math.sin(A.h)*A.v*dt; A.z += Math.cos(A.h)*A.v*dt;
  A.x = clamp(A.x, -WORLD.x, WORLD.x); A.z = clamp(A.z, WORLD.zMin, WORLD.zMax);
  ORDER.forEach(n => { const O = veh[n]; if (O === A) return; O.rpm = 0;          // nie wjeżdżaj w pozostałych
    const dx = A.x - O.x, dz = A.z - O.z, d = Math.hypot(dx, dz), min = A.radius + O.radius;
    if (d < min && d > .001) { A.x = O.x + dx/d*min; A.z = O.z + dz/d*min; A.v *= .9; } });
  obstacles.forEach(o => { const dx = A.x - o.x, dz = A.z - o.z, d = Math.hypot(dx, dz), min = A.radius*.6 + o.r; if (d < min && d > .001) { A.x = o.x + dx/d*min; A.z = o.z + dz/d*min; A.v *= .9; } });
  A.g.position.set(A.x, 0, A.z); A.g.rotation.y = A.h; A.g.updateMatrixWorld(true);
  A.wheels.forEach(w => { w.n.rotation.x += A.v*dt/w.r; });
  A.steerNodes.forEach(s => { s.n.rotation.y = A.steer*s.s; });
  if (A.P.sw) { A.P.sw.rotation.y = A.steer*3.2;
  A.P.needles[0].rotation.y = 1.2 - Math.abs(A.v)/A.maxF*2.4; A.P.needles[1].rotation.y = 1.2 - A.rpm*2.2 + Math.sin(time*31)*.03; }
  const rpmT = .12 + .88*Math.max(Math.abs(thr), Math.abs(A.v)/A.maxF);
  A.rpm += (rpmT - A.rpm)*Math.min(1, dt*4);
  updateGiraffe(dt); updateElephant(dt);

  // ----- kombajn pracuje
  const c = veh.combine, P = c.P;
  if (S.active === 'combine') {
    const k = 1 + Math.abs(c.v)*.25;
    const cornHead = fieldCrop === 'corn';
    P.auger.rotation.x += dt*9; P.screen.rotation.x += dt*5;
    if (cornHead) { P.screws.forEach(s => { s.n.rotation.y += dt*13*s.dir; }); updateLugs(P, time); }
    else { P.reel.rotation.x += dt*3.2*k; P.knife.position.x = Math.sin(time*42)*.07; }
    P.walkers.forEach((w, i) => { const a = time*11 + i*Math.PI/2; w.position.y = 1.5 + Math.sin(a)*.09; w.position.z = -3.3 + Math.cos(a)*.12; });
    P.pulleys.forEach(p => { p.rotation.x += dt*10*p.userData.k; }); P.spreaders.forEach(sp => { sp.rotation.y += dt*17*sp.userData.d; });
    M.beacon.color.setHex(Math.sin(time*9) > 0 ? 0xffb300 : 0x7a4300);
    const sh = Math.sin(c.h), ch = Math.cos(c.h);
    const z0 = cornHead ? 5.0 : 4.3, hw = cornHead ? 2.95 : 2.7;
    for (let lz = z0; lz <= z0 + .7; lz += .65) for (let lx = -hw; lx <= hw + .01; lx += .42) harvestAt(c.x + sh*lz + ch*lx, c.z + ch*lz - sh*lx);
    P.grain.position.y = 3.05 + .8*(tank/TANK_CAP);
    if (Math.abs(c.v) > .5 && AU.thrLevel > .2 && Math.random() < .5) { c.g.localToWorld(tmpV.set(rr(-.9, .9), 1.5, -4.0));
      emit(tmpV.x, tmpV.y, tmpV.z, rr(-.6, .6), rr(.2, 1.2), rr(-.6, .6), rr(.6, 1.2), .9, .78, .42, 3); }
  } else M.beacon.color.setHex(S.active === 'big' && Math.sin(time*9) > 0 ? 0xffb300 : 0x7a4300);
  if (cropDirty) { crop.instanceMatrix.needsUpdate = true; crop.instanceColor.needsUpdate = true; cropDirty = false; }

  // ----- przyczepa jedzie za Ursusem
  const t = veh.tractor;
  if (S.active === 'tractor') {
    const hp = t.inner.localToWorld(tmpV.copy(t.hitch)); let dx = hp.x - trailer.x, dz = hp.z - trailer.z;
    let th = Math.atan2(dx, dz); const relA = wrap(th - t.h); if (Math.abs(relA) > 1.15) th = t.h + Math.sign(relA)*1.15;
    const nx = hp.x - Math.sin(th)*HITCH_L, nz = hp.z - Math.cos(th)*HITCH_L;
    const moved = (nx - trailer.x)*Math.sin(th) + (nz - trailer.z)*Math.cos(th);
    trailer.x = nx; trailer.z = nz; trailer.h = th; trailer.g.position.set(nx, 0, nz); trailer.g.rotation.y = th;
    trailer.wheels.forEach(w => { w.rotation.x += moved/.5; });
    trailer.g.updateMatrixWorld(true);
  }
  if (S.active === 'tractor') t.P.fan.rotation.z += dt*(18 + t.rpm*40);
  // ----- kurz spod kół
  if (Math.abs(A.v) > 1.2 && Math.random() < Math.abs(A.v)/A.maxF*.7) { const d = A.dust[(Math.random()*2) | 0];
    A.inner.localToWorld(tmpV.set(d[0], .12, d[1])); const k = .62 + Math.random()*.12;
    emit(tmpV.x + rr(-.2, .2), .15, tmpV.z + rr(-.2, .2), rr(-.5, .5), rr(.4, 1.1), rr(-.5, .5), rr(.5, 1), k, k*.9, k*.68, -.3); }
  // ----- dym z komina
  smokeT -= dt;
  if (smokeT <= 0 && A.walk !== undefined) smokeT = .2;
  if (smokeT <= 0) { smokeT = .09 - A.rpm*.05;
    if (A.exhaust) A.inner.localToWorld(tmpV.copy(A.exhaust)); else c.g.localToWorld(tmpV.set(.85, 5.0, -2.28));
    const g = .32 + Math.random()*.15; emit(tmpV.x, tmpV.y, tmpV.z, rr(-.3, .3), rr(1.2, 2.2), rr(-.3, .3), rr(.6, 1.1), g, g, g, -.6); }

  // ----- duży traktor: narzędzie pracuje, gdy jedziesz do przodu
  const B = veh.big;
  if (S.active === 'big') { if (B.tool === 'baler') B.P.pick.rotation.x += dt*9;
    if (B.v > .4) { const sh = Math.sin(B.h), ch = Math.cos(B.h), z0 = TOOL_Z[B.tool]; for (let lx = -1.75; lx <= 1.76; lx += .4) workAt(B.x + sh*z0 + ch*lx, B.z + ch*z0 - sh*lx, B.tool); } }
  if (workFx > 0) { workFx -= dt*4; if (time - lastWork > .16) { lastWork = time; noiseBurst(B.tool === 'seeder' ? 2600 : 420, .12, .35); } }
  updateGrow(dt); updateGrain(dt);
  updateBales(dt);

  // ----- dźwięk
  setEngine('combine', c.rpm, S.active === 'combine'); setEngine('tractor', t.rpm, S.active === 'tractor'); setEngine('big', B.rpm, S.active === 'big');
  AU.thrLevel = Math.max(0, AU.thrLevel - dt*1.6);
  if (AU.ctx) { const now = AU.ctx.currentTime; AU.thr.gain.setTargetAtTime(S.active === 'combine' ? AU.thrLevel*.3 : 0, now, .08);
    AU.mach.gain.setTargetAtTime(S.active === 'combine' ? .1 + c.rpm*.08 : 0, now, .1); AU.rainG.gain.setTargetAtTime(WX.rain ? .1 : 0, now, .4); }

  // ----- podpowiedzi
  hudT -= dt;
  if (hudT <= 0) { hudT = .3;
    const onField = bales.some(b => !b.round && (b.st === 'field' || b.st === 'drop')), car = carrier(), loaded = CAR.tractor.bales.length + CAR.elephant.bales.length;
    $('bSwap').classList.toggle('pulse', !car && !won && cutCount === totalCells && (onField || loaded > 0));
    barnArrow.visible = !!car && ((car.bales.length > 0 && (car.bales.length >= car.cap || !onField)) || (car === CAR.tractor && trailer.grain > 20 && !onField));
    let pct = cutCount/totalCells, ico = fieldCrop === 'corn' ? '🌽' : '🌾', col = '';
    if (growing > 0) { pct = growing; ico = '🌱'; } else if (cutCount === totalCells && ploughed > 0) { if (ploughed < totalCells) { pct = ploughed/totalCells; ico = '🟤'; col = '#7a5230'; } else { pct = sown/totalCells; ico = '🌱'; } }
    $('barFill').style.width = (pct*100).toFixed(1) + '%'; $('barFill').style.background = col; $('cropIco').textContent = ico;
    if (stDirty) { stTex.needsUpdate = true; stDirty = false; }
  }
  if (barnArrow.visible) { barnArrow.position.y = 13 + Math.sin(time*5)*1.2; barnArrow.rotation.y = time*2; }
  if (winT > 0) { winT -= dt; for (let i = 0; i < 4; i++) { tmpC.setHSL(Math.random(), .9, .58);
    emit(A.x + rr(-7, 7), rr(5, 9), A.z + rr(-7, 7), rr(-2, 2), rr(1, 5), rr(-2, 2), rr(1, 2), tmpC.r, tmpC.g, tmpC.b, 5); } }
}
function checkWin() {
  if (won || cutCount < totalCells || bales.some(b => !b.round)) return;
  won = true; winT = 3; sfx.win(); setTimeout(() => { if (won) showMenu('win'); }, 2600);
}

/* =====================================================================
   KAMERA
   ===================================================================== */
const camPos = new T.Vector3(0, 40, 60), camLook = new T.Vector3(), wantPos = new T.Vector3(), wantLook = new T.Vector3();
let camH = Math.PI, camSnap = true, menuT = 0;
const lookA = { yaw:0, pitch:0, id:null, x:0, y:0, idle:0 };          // rozglądanie się palcem
{ const cv = $('c');
  cv.addEventListener('pointerdown', e => { if (!S.running || S.cam === 0 || lookA.id !== null) return; lookA.id = e.pointerId; lookA.x = e.clientX; lookA.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener('pointermove', e => { if (e.pointerId !== lookA.id) return;
    lookA.yaw = clamp(lookA.yaw + (e.clientX - lookA.x)*.007, -2.7, 2.7); lookA.pitch = clamp(lookA.pitch + (e.clientY - lookA.y)*.005, -.5, .6);
    lookA.x = e.clientX; lookA.y = e.clientY; lookA.idle = 0; });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => cv.addEventListener(ev, e => { if (e.pointerId === lookA.id) lookA.id = null; })); }
const lookDir = new T.Vector3();
function updateCamera(dt) {
  const w = innerWidth, h = innerHeight, portrait = h > w;
  let fov = 55;
  if (!S.running && S.menu !== 'pause') {         // ekran startowy: powolny oblot pola
    menuT += dt*.12; wantPos.set(Math.sin(menuT)*52, 20, 30 + Math.cos(menuT)*26); wantLook.set(-8, 2, 6);
    camPos.copy(wantPos); camLook.copy(wantLook); fov = portrait ? 70 : 52;
  } else {
    const A = veh[S.active];
    if (lookA.id === null) { lookA.idle += dt; if (lookA.idle > .7) { const k = Math.exp(-dt*3); lookA.yaw *= k; lookA.pitch *= k; } }
    if (S.cam === 0) { const H = portrait ? 31 : 21; wantPos.set(A.x, H, A.z + H*.62); wantLook.set(A.x, 0, A.z - 1.5); fov = 52; }
    else if (S.cam === 1) { camH += wrap(A.h - camH)*Math.min(1, dt*3.5); const k = portrait ? 1.3 : 1;
      const ca = camH + lookA.yaw, hk = clamp(1 - lookA.pitch*1.2, .35, 1.7);
      wantPos.set(A.x - Math.sin(ca)*A.chase[0]*k, A.chase[1]*k*hk, A.z - Math.cos(ca)*A.chase[0]*k);
      wantLook.set(A.x + Math.sin(A.h)*4, A.lookY || 1.6, A.z + Math.cos(A.h)*4); fov = portrait ? 66 : 55; }
    else { A.inner.localToWorld(wantPos.copy(A.eye)); wantPos.y += A.walk !== undefined ? 0 : Math.sin(time*38)*.006*(.4 + A.rpm);
      lookDir.copy(A.look).sub(A.eye); const yw = lookA.yaw + A.steer*.3, pt = Math.atan2(lookDir.y, lookDir.z) + lookA.pitch, cp = Math.cos(pt);
      tmpV.set(A.eye.x + Math.sin(yw)*cp*6, A.eye.y + Math.sin(pt)*6, A.eye.z + Math.cos(yw)*cp*6); A.inner.localToWorld(wantLook.copy(tmpV)); fov = portrait ? 88 : 68; camSnap = true; }
    if (camSnap) { camPos.copy(wantPos); camLook.copy(wantLook); camH = A.h; camSnap = false; }
    else { const k = 1 - Math.exp(-dt*6); camPos.lerp(wantPos, k); camLook.lerp(wantLook, k); }
    ORDER.forEach(n => { veh[n].driver.visible = !(S.cam === 2 && S.active === n); });
    sun.target.position.set(A.x, 0, A.z); sun.position.copy(sun.target.position).add(SUN_DIR);
    if (headLamp.intensity > 0) { A.inner.localToWorld(headLamp.position.copy(A.eye).add(tmpV.set(0, .3, .9))); A.inner.localToWorld(headLamp.target.position.copy(A.eye).add(tmpV.set(0, -2.6, 15))); }
  }
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.copy(camPos); camera.lookAt(camLook);
}

addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 250)); resize();

/* =====================================================================
   HUD, MENU
   ===================================================================== */
const ICO_TRACTOR = '<svg viewBox="0 0 48 32" width="46" height="30" aria-hidden="true"><rect x="20" y="10" width="20" height="9" rx="2" fill="#d9432a"/><rect x="10" y="6" width="12" height="14" rx="2" fill="#d9432a"/><rect x="33" y="3" width="2.5" height="8" fill="#333"/><circle cx="14" cy="21" r="9" fill="#262321"/><circle cx="14" cy="21" r="4" fill="#eee2c4"/><circle cx="38" cy="25" r="5" fill="#262321"/><circle cx="38" cy="25" r="2" fill="#eee2c4"/></svg>';
const ICO_COMBINE = '<svg viewBox="0 0 48 32" width="46" height="30" aria-hidden="true"><rect x="4" y="8" width="24" height="13" rx="2" fill="#a6c21a"/><rect x="22" y="3" width="10" height="11" rx="2" fill="#a9d8ee" stroke="#55651a" stroke-width="1.5"/><path d="M30 17 L38 22 L46 22 L46 29 L36 29 Z" fill="#7f9712"/><circle cx="41" cy="20" r="5" fill="none" stroke="#d8301f" stroke-width="2"/><circle cx="20" cy="23" r="7" fill="#262321"/><circle cx="20" cy="23" r="3" fill="#d8301f"/><circle cx="7" cy="26" r="4" fill="#262321"/></svg>';
const CAM_NAMES = ['z góry', 'z tyłu', 'kabina'];
const ICO_BIG = ICO_TRACTOR.replace(/#d9432a/g, '#1f5fb8').replace(/#eee2c4/g, '#ffffff');
const VEH_UI = { combine:[ICO_COMBINE, 'Kombajn'], tractor:[ICO_TRACTOR, 'Ursus'], big:[ICO_BIG, 'Duży traktor'], giraffe:['<span class="em">🦒</span>', 'Żyrafa'], elephant:['<span class="em">🐘</span>', 'Słoń'] };
function hud() {
  const car = carrier() || CAR.tractor; $('trailerN').textContent = car.bales.length; $('trailerCap').textContent = '/' + car.cap; $('barnN').textContent = stored;
  $('swapIco').innerHTML = VEH_UI[S.active][0]; $('swapLbl').textContent = 'zmień';
  $('camLbl').textContent = S.cam === 2 && veh[S.active].walk !== undefined ? 'grzbiet' : CAM_NAMES[S.cam];
  const big = S.active === 'big'; $('bTool').hidden = !big; if (big) { const t = TOOL_LBL[veh.big.tool]; $('toolIco').textContent = t[0]; $('toolLbl').textContent = t[1]; }
  document.querySelectorAll('#pick [data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === S.active));
}
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }
function horn() { if (S.active === 'giraffe') sfx.giraffe(); else if (S.active === 'elephant') sfx.trumpet(); else sfx.horn(S.active === 'tractor'); }

function selectVehicle(n) { $('pick').hidden = true; if (n === S.active) return; veh[S.active].v = 0; veh[S.active].rpm = 0; S.active = n;
  veh[n].rpm = .9; camSnap = S.cam === 2; camH = veh[n].h; lookA.yaw = lookA.pitch = 0; hud();
  if (n === 'giraffe') sfx.giraffe(); else if (n === 'elephant') sfx.trumpet(); else tone(90, .35, 'sawtooth', .18, 160); }
function swapVehicle() { $('pick').hidden = !$('pick').hidden; }
function nextTool() { const B = veh.big; B.tool = TOOLS[(TOOLS.indexOf(B.tool) + 1) % 3]; TOOLS.forEach(k => { B.P.tools[k].visible = k === B.tool; }); tone(180, .12, 'square', .12, 260); hud(); }
$('pick').innerHTML = ORDER.map(n => '<button class="btn" data-v="' + n + '">' + VEH_UI[n][0] + '<small>' + VEH_UI[n][1] + '</small></button>').join('');
document.querySelectorAll('#pick [data-v]').forEach(b => b.addEventListener('click', () => selectVehicle(b.dataset.v)));

tap('bHorn', horn); tap('bCam', nextCam); tap('bSwap', swapVehicle); tap('bTool', nextTool); tap('bMenu', () => showMenu('pause'));

function syncPicks() {
  document.querySelectorAll('[data-crop]').forEach(b => b.setAttribute('aria-pressed', b.dataset.crop === S.crop));
  document.querySelectorAll('[data-ctrl]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ctrl === S.ctrl));
  $('sndIco').textContent = S.muted ? '🔇' : '🔊';
}
document.querySelectorAll('[data-crop]').forEach(b => b.addEventListener('click', () => { S.crop = b.dataset.crop; syncPicks(); save();
  if (S.menu === 'start' && S.crop !== fieldCrop) buildField(S.crop); }));
document.querySelectorAll('[data-ctrl]').forEach(b => b.addEventListener('click', () => { S.ctrl = b.dataset.ctrl; syncPicks(); save(); }));
tap('bSnd', () => { S.muted = !S.muted; if (AU.ctx) AU.master.gain.value = S.muted ? 0 : .7; syncPicks(); save(); });

function showMenu(kind) {
  S.menu = kind; S.running = false; keys.up = keys.down = keys.left = keys.right = 0;
  setEngine('combine', 0, false); setEngine('tractor', 0, false); setEngine('big', 0, false); $('pick').hidden = true;
  if (AU.ctx) { AU.thr.gain.setTargetAtTime(0, AU.ctx.currentTime, .05); AU.mach.gain.setTargetAtTime(0, AU.ctx.currentTime, .05); AU.rainG.gain.setTargetAtTime(0, AU.ctx.currentTime, .05); }
  $('mTitle').textContent = kind === 'win' ? 'Brawo!' : kind === 'pause' ? 'Przerwa' : 'Żniwa!';
  $('mSub').textContent = kind === 'win' ? 'Pole zebrane, słoma w stodole 🎉' : kind === 'pause' ? 'Silnik czeka' : 'Żniwa, orka, siew i zwierzaki';
  $('bGo').hidden = false; $('bGo').textContent = kind === 'win' ? 'Zostajemy: orka i siew' : kind === 'pause' ? 'Gramy dalej' : 'Jedziemy!';
  $('bNew').hidden = kind === 'start';
  $('menu').hidden = false; $('hud').hidden = true; syncPicks();
}
async function startGame(fresh) {
  initAudio();
  if (S.ctrl === 'tilt') { const ok = await enableTilt(); tilt.on = ok;
    if (!ok) { S.ctrl = 'arrows'; syncPicks(); setTimeout(() => toast('Przechylanie tu nie działa. Włączam strzałki.'), 300); } }
  else tilt.on = false;
  document.body.classList.toggle('tilt', tilt.on);
  if (fresh || S.menu === 'start') { if (fresh || fieldCrop !== S.crop) newField(S.crop); else { S.active = 'combine'; camSnap = true; } }
  $('menu').hidden = true; $('hud').hidden = false; S.menu = 'play'; S.running = true; camSnap = true; hud();
  veh[S.active].rpm = .9; tone(70, .5, 'sawtooth', .2, 150);
  if (won && !growing) setTimeout(() => toast('Duży traktor: najpierw pług 🟤, potem siewnik 🌱'), 400);
  if (tilt.on) toast('Trzymaj telefon wygodnie i przechylaj. 🎯 ustawia środek.');
}
tap('bGo', () => startGame(false)); tap('bNew', () => startGame(true));
document.addEventListener('visibilitychange', () => { if (!AU.ctx) return; if (document.hidden) AU.ctx.suspend(); else if (S.running) AU.ctx.resume(); });

/* =====================================================================
   START
   ===================================================================== */
buildField(S.crop);
place(veh.combine, -24.5, 25, Math.PI); place(veh.tractor, 2, 26.5, Math.PI/2); place(veh.giraffe, -36, 22, Math.PI); place(veh.big, 24, 27.5, Math.PI/2); place(veh.elephant, -41, 6, Math.PI); resetTrailer();
syncPicks(); hud();
let last = performance.now(), lastRaw = last, qAcc = 0, qN = 0, qLevel = 0;   // gdy telefon nie nadąża: mniej pikseli, potem bez cieni
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last)/1000); last = now;
  uTime.value += dt; updateBirds(uTime.value);
  if (S.running && now - lastRaw < 400) { qAcc += now - lastRaw; if (++qN >= 90) { const avg = qAcc/qN; qAcc = 0; qN = 0;
    if (avg > 38 && qLevel < 2) { qLevel++; if (qLevel === 1) { renderer.setPixelRatio(1); resize(); } else sun.castShadow = false; } } }
  lastRaw = now;
  updateRain(dt);
  turbines.forEach(t => { t.rotation.z += dt*.9; });
  clouds.forEach(c => { c.position.x += dt*1.6; if (c.position.x > 400) c.position.x = -400; });
  if (S.running) update(dt);
  updateParticles(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
