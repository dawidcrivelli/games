'use strict';
if (!window.THREE) { $('err').style.display = 'flex'; $('menu').hidden = true; throw new Error('brak three.js'); }
const T = THREE;

/* =====================================================================
   USTAWIENIA I STAN
   ===================================================================== */
const S = { ctrl:'joy', cam:0, veh:'car', muted:false, running:false, arcade:false, over:false, started:false, clock:0 };
let best = 0; const GAR = { bank:0, own:['p0', 'h0'], paint:'p0', horn:'h0', jump:0 };
try { const sv = JSON.parse(localStorage.getItem('taxiciuchciowo') || 'null'); if (sv) { S.muted = !!sv.muted; if (sv.ctrl === 'tilt') S.ctrl = 'tilt'; best = sv.best | 0; if (sv.gar && Array.isArray(sv.gar.own)) Object.assign(GAR, sv.gar); } } catch (e) {}
const save = () => { try { localStorage.setItem('taxiciuchciowo', JSON.stringify({ muted:S.muted, ctrl:S.ctrl, best, gar:GAR })); } catch (e) {} };
let seed = (/^#s(\d+)$/.test(location.hash) ? +location.hash.slice(2) : Math.random()*2147483647) | 0;

let time = 0;
const tmpV = new T.Vector3();

/* =====================================================================
   RENDERER, SCENA, ŚWIATŁO, NARZĘDZIA (wspólne z Ciuchcią)
   ===================================================================== */
const renderer = new T.WebGLRenderer({ canvas:$('c'), antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.fog = new T.Fog(0xcfe8f3, 110, 420);
const camera = new T.PerspectiveCamera(55, 1, 0.12, 1500);
scene.add(camera);

const hemi = new T.HemisphereLight(0xdff1ff, 0x7d7040, 0.56); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff1d0, 0.72);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left = -19; sc.right = 19; sc.top = 19; sc.bottom = -19; sc.near = 1; sc.far = 160;
sun.shadow.bias = -0.0006;
scene.add(sun); scene.add(sun.target);
const SUN_DIR = new T.Vector3(26, 46, 20);

sc.left = -32; sc.right = 32; sc.top = 32; sc.bottom = -32; sc.updateProjectionMatrix();

/* ---------- tekstury z canvasu ---------- */

const grassTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#69a84a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) { g.strokeStyle = ['#5c9a40','#78b656','#4f8c38','#86c060'][i&3]; g.globalAlpha = .55;
    const x = rnd()*w, y = rnd()*h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2,2), y - rr(2,6)); g.stroke(); }
}, 190, 190);
const woodTex = tex(128, 128, (g, w, h) => {
  g.fillStyle = '#9b6a3c'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) { g.fillStyle = ['#8c5e33','#a87646','#93633a','#a06e40'][(x/16)&3]; g.fillRect(x + 1, 0, 14, h); g.fillStyle = '#5e3d20'; g.fillRect(x, 0, 1.5, h); }
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(70,40,15,.25)'; g.fillRect(rnd()*w, rnd()*h, 1, rr(4,18)); }
}, 5, 1);

const ballastTex = tex(128, 128, (g, w, h) => {
  g.fillStyle = '#9a9388'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = ['#b3ada2','#7f796f','#a59f93','#8c867b','#c2bcb0'][i%5]; g.globalAlpha = .8; g.beginPath(); g.arc(rnd()*w, rnd()*h, rr(.8, 2.4), 0, 7); g.fill(); }
});

/* ---------- materiały ---------- */

   // lakier odbijający niebo

const M = {
  dark:lam(0x2e3034), matte:lam(0x232527), steel:pho(0x8f989f, { metalness:.7, roughness:.38 }), steelL:pho(0xc7ced3, { metalness:.7, roughness:.3 }), chrome:pho(0xe6eaee, { metalness:.95, roughness:.12, envMapIntensity:1.2 }),
  white:pho(0xf5f1e6), cream:pho(0xeee2c4),
  lBlack:pho(0x17191c, { roughness:.26, metalness:.45, envMapIntensity:1.1 }), lRed:pho(0xcf2a1f), brass:pho(0xdba63f, { metalness:.9, roughness:.22, envMapIntensity:1.2 }),
  cGreen:pho(0x2f6a43), cGreenD:pho(0x24543a), euG:pho(0x1d6f4a), euY:pho(0xf2c21f), pW:pho(0xf4f6f8, { roughness:.2 }), pN:pho(0x1b2f55), pGlass:pho(0x0c1622, { roughness:.05, metalness:.6, envMapIntensity:1.6 }),
  screen:new T.MeshBasicMaterial({ color:0x58d8c4 }), wagonWood:lam(0xffffff, { map:woodTex, color:0xb9794a }), log:lam(0x8a5a33), cut:lam(0xdcbc8c), cRoof:pho(0xb9bdbf, { metalness:.5, roughness:.4 }), coal:lam(0x1b1b1e),
  glass:new T.MeshStandardMaterial({ color:0xbfe6f5, transparent:true, opacity:.26, roughness:.04, metalness:.2, envMapIntensity:1.7, depthWrite:false }),
  skin:lam(0xf1c7a0), hat:lam(0x1c2f52), shirt:lam(0x27457a), pants:lam(0x1f2c44), hair:lam(0x4a3524), boot:lam(0x2a221c), seat:lam(0x23201e),
  wood:lam(0xffffff, { map:woodTex }), woodL:lam(0xc79a63), woodD:lam(0x7d5a36), roof:lam(0xb23a2c), inside:lam(0x1d140d),
  lamp:new T.MeshBasicMaterial({ color:0xfff3b0 }), red:new T.MeshBasicMaterial({ color:0xd81f1f }), fire:new T.MeshBasicMaterial({ color:0xff7a1a }),
  gaugeW:new T.MeshBasicMaterial({ color:0xf6f2e2 }), gaugeR:new T.MeshBasicMaterial({ color:0xe23b2b }),
  win:pho(0x35506e, { roughness:.1, metalness:.4, emissive:0x000000 }), cloud:new T.MeshBasicMaterial({ color:0xffffff, fog:false, transparent:true, opacity:.93 }),
  flagW:lam(0xffffff, { emissive:0x555555 }), flagR:lam(0xdc143c),
  ballast:lam(0xffffff, { map:ballastTex, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }),
  sleeper:lam(0x5b4330), rail:pho(0xa3abb1, { metalness:.85, roughness:.28 }),
  concrete:lam(0xb9b4aa), pad:lam(0x8f8a80, { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }), brick:lam(0xa5513c), stone:lam(0x8d8a84),
  plate:lam(0xffffff, { map:tex(192, 64, (g, w, h) => { g.fillStyle = '#b3241b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8c15a'; g.lineWidth = 5; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#f2d277'; g.font = 'bold 36px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Ol49-7', w/2, h/2 + 2); }) }),
};

/* ---------- pomocnicze budowanie brył ---------- */

/* skleja wiele małych brył w jedną siatkę na materiał (mniej draw calli na telefonie) */

   // elipsoida
                                  // stożek ścięty: r0 dół, r1 góra
const anims = [];                                  // drobne ruchy zwierząt

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

{ // łąka z plamami koloru
  const g = new T.PlaneGeometry(1900, 1900, 90, 90); g.rotateX(-Math.PI/2);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), n = vnoise(x/38 + 9, z/38 + 4)*.6 + vnoise(x/11, z/11)*.4, k = .8 + n*.36;
    col.push(k*(.96 + n*.1), k, k*(.86 + n*.1)); }
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  const ground = new T.Mesh(g, lam(0xffffff, { map:grassTex, vertexColors:true })); ground.receiveShadow = true; scene.add(ground);
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

const turbines = [];
{ const wm = lam(0xf2f2ee);
  [[-260, -270, 1.3], [-150, -310, 1.5], [290, -260, 1.2], [360, -210, 1.4]].forEach(t => { const g = new T.Group(), s = t[2];
    mesh(new T.CylinderGeometry(.8, 1.5, 44, 10), wm, 0, 22, 0, g); box(2, 2, 5, wm, 0, 44.5, .5, g);
    const rot = new T.Group(); rot.position.set(0, 44.5, 3.2); mesh(new T.SphereGeometry(1.1, 10, 8), wm, 0, 0, 0, rot);
    for (let i = 0; i < 3; i++) { const b = new T.Group(); b.rotation.z = i*2.094; const bl = box(1.5, 19, .3, wm, 0, 10, 0, b); bl.rotation.y = .25; rot.add(b); }
    g.add(rot); g.position.set(t[0], 0, t[1]); g.scale.setScalar(s); g.rotation.y = .5; scene.add(g); turbines.push(rot); }); }
let makeCow = null;
{ // krowy na łące za planszą
  const cowTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#f6f3ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#262220'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(rnd()*w, rnd()*h, rr(10, 26), rr(8, 18), rnd()*3, 0, 7); g.fill(); } });
  const sk = lam(0xffffff, { map:cowTex }), wh = lam(0xf6f3ec), bk = lam(0x262220), pk = lam(0xeeb0a8), hn = lam(0xe9e2cf);
  const cow = makeCow = down => { const g = new T.Group(), hd = new T.Group();
    ell(.48, .5, .95, sk, 0, 1.15, 0, g); ell(.2, .14, .22, pk, 0, .72, -.4, g);
    const tl = cone(.02, .03, .75, wh, 0, 1.05, -.98, g, 5); tl.rotation.x = -.15; ell(.06, .1, .06, bk, 0, .66, -1.03, g);
    [-1, 1].forEach(s => [-.6, .6].forEach(z => { cone(.085, .11, .8, wh, s*.27, .42, z, g, 8); cone(.1, .09, .1, bk, s*.27, .05, z, g, 8); }));
    ell(.27, .3, .36, wh, 0, 0, .25, hd); ell(.2, .17, .2, pk, 0, -.12, .53, hd);
    [-1, 1].forEach(s => { ell(.06, .1, .14, bk, s*.3, .15, .15, hd); cone(.035, .01, .2, hn, s*.16, .33, .2, hd, 6); ell(.035, .035, .035, bk, s*.14, .07, .53, hd); ell(.03, .03, .02, bk, s*.08, -.14, .72, hd); });
    hd.position.set(0, 1.45, .8); hd.rotation.x = down ? .95 : .1; g.add(hd); return bake(g); };
}
const RAIL_TOP = .38, GAUGE = 1.5;
const PN = 320, pPos = new Float32Array(PN*3), pCol = new Float32Array(PN*3), pVel = new Float32Array(PN*3), pLife = new Float32Array(PN), pGrav = new Float32Array(PN);
let pNext = 0;
for (let i = 0; i < PN; i++) pPos[i*3 + 1] = -99;
const pGeo = new T.BufferGeometry();
pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(pCol, 3));
const dotTex = tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 2, 16, 16, 15); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.6, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
const points = new T.Points(pGeo, new T.PointsMaterial({ size:.42, map:dotTex, vertexColors:true, transparent:true, opacity:.9, depthWrite:false }));
points.frustumCulled = false; scene.add(points);

const puffs = [];
for (let i = 0; i < 48; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map:dotTex, color:0xffffff, transparent:true, opacity:0, depthWrite:false })); s.visible = false; scene.add(s); puffs.push({ s, life:0, max:1, vx:0, vy:0, vz:0, size:1 }); }
let puffNext = 0;

const AU = { ctx:null };

const sfx = {
  chuff:(strong, vol) => { burst(strong ? 560 : 430, .17, vol*(strong ? 1 : .75), 0, .8, 'lowpass'); burst(1700, .09, vol*.22, 0, .8); },
  clack:() => { burst(1900, .04, .3, 0, 2); tone(150, .05, 'sine', .22, 80); burst(1700, .04, .26, .11, 2); tone(140, .05, 'sine', .2, 75, .11); },
  star:() => [784, 1047, 1319].forEach((f, i) => tone(f, .22, 'triangle', .26, 0, i*.09)),
  moo:() => { tone(150, .75, 'sawtooth', .2, 98); tone(226, .6, 'square', .05, 150, .05); },
  thud:() => tone(130, .25, 'sine', .5, 45),
  pop:n => tone(380 + n*22, .14, 'triangle', .3, 760 + n*22),
  blip:f => tone(f, .12, 'square', .14, f*1.5),
  wipe:() => burst(900, .18, .35, 0, .8),
  no:() => { tone(190, .14, 'square', .14, 150); tone(150, .2, 'square', .14, 110, .13); },
  win:() => [523, 659, 784, 1047].forEach((f, i) => tone(f, .28, 'triangle', .26, 0, i*.13)),
};

Object.assign(M, {
  tire:pho(0x1f1d1c, { roughness:.93, metalness:0, envMapIntensity:.25 }), cRed:pho(0xd8301f), cYel:pho(0xf5c41f), uRed:pho(0xdc452a), uGray:pho(0x5f6367), uCream:pho(0xeee2c4), uRedD:pho(0xb0351f), uGrayD:pho(0x3d4144),
  gaugeG:new T.MeshBasicMaterial({ color:0x49c24f }), amber:new T.MeshBasicMaterial({ color:0xff9a1a }), seatB:lam(0x2f5f9a),
  uPlate:lam(0xffffff, { map:tex(192, 64, (g, w, h) => { g.fillStyle = '#f7f7f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d3f9c'; g.fillRect(0, 0, 22, h); g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#111'; g.font = 'bold 40px Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('CIU 330C', 30, h/2 + 2); }) }),
  badge:lam(0xffffff, { map:tex(160, 48, (g, w, h) => { g.fillStyle = '#eee2c4'; g.fillRect(0, 0, w, h); g.fillStyle = '#b0351f'; g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#eee2c4'; g.font = 'bold 32px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C-330', w/2, h/2 + 2); }) }),
});

const AUTO_CAM = { car:true, chaseYaw:0, followK:5, povK:.16, tilt:0 };

// ---------- nadwozia: boczny zarys auta wyciągnięty na szerokość, z wycięciami na koła

const GLD = new T.MeshStandardMaterial({ color:0x16222e, roughness:.06, metalness:.6, envMapIntensity:1.8, side:T.DoubleSide }), GLT = new T.MeshStandardMaterial({ color:0xbfe6f5, transparent:true, opacity:.26, roughness:.04, metalness:.2, envMapIntensity:1.7, depthWrite:false, side:T.DoubleSide });
const PLA = lam(0x1b1c1f), LAMPO = new T.MeshBasicMaterial({ color:0xffa41c });

const TPL_W = { car:null, bus:null };

const ursus = buildTractor(); Object.assign(ursus, AUTO_CAM, { chase:[9.4, 4.8], lookY:1.6, lamp:new T.Vector3(0, 1.1, 1.9) }); ursus.g.visible = false; ursus.sw = ursus.P.sw;
const AUTOS = {
  taxi:{ car:buildTaxi(), vmax:24, acc:8, off:.5, turn:1, R:2, jobs:2, eng:[60, 5.5], hornF:[420, 524], ico:'🚕', name:'Taksówka', sub:'pasażerowie 🧍' },
  bus:{ car:buildBus(), vmax:17, acc:5, off:.45, turn:.72, R:3, jobs:5, eng:[45, 4.5], hornF:[220, 277], ico:'🚌', name:'Autobus', sub:'grupy 🧍🧍' },
  race:{ car:buildRacer(), vmax:38, acc:13, off:.3, turn:1.1, R:2, jobs:0, eng:[90, 8], hornF:[660, 830], ico:'🏎️', name:'Wyścigówka', sub:'gwiazdki ⭐' },
  ursus:{ car:ursus, vmax:10.5, acc:5, off:.95, turn:1.25, R:2.1, jobs:0, eng:[38, 5], hornF:[392, 494], ico:'🚜', name:'Ursus C-330', sub:'wszędzie 🌾' },
};

const CRANK = .3, R_DRV = .78, AXLE_Y = RAIL_TOP + R_DRV, ROD_L = 2.2;
const WH = { drv:makeRailWheel(R_DRV, 6, true), sm:makeRailWheel(.45, 4), md:makeRailWheel(.5, 4) };

const signMatPKP = signMat('PKP', '#17191c', '#f2d277');

const plateEU = signMat('EU07', '#1d6f4a', '#f2d277');

const steam = buildLoco(), tender = buildTender(), coaches = [buildCoach(), buildCoach(), buildCoach()], wagons = [buildWagon(), buildWagon(), buildWagon()], eu = buildEU07(), pend = [buildPend(1), buildPend(0), buildPend(-1)];
const LEADS = [steam, eu, pend[0]];
const TRAINS = {
  steamP:{ cars:[steam, tender, coaches[0], coaches[1]], kind:'steam', pass:true, vmax:17, acc:2.9, ico:'🚂', name:'Parowóz', sub:'osobowy 🧍' },
  steamF:{ cars:[steam, tender, wagons[0], wagons[1]], kind:'steam', pass:false, vmax:15, acc:2.6, ico:'🚂', name:'Parowóz', sub:'towarowy 📦' },
  euP:{ cars:[eu, coaches[0], coaches[1], coaches[2]], kind:'eu', pass:true, vmax:21, acc:3.6, ico:'🚆', name:'EU07', sub:'osobowy 🧍' },
  euF:{ cars:[eu, wagons[0], wagons[1], wagons[2]], kind:'eu', pass:false, vmax:18, acc:3.2, ico:'🚆', name:'EU07', sub:'towarowy 📦' },
  pend:{ cars:pend, kind:'pend', pass:true, vmax:28, acc:4.6, ico:'🚄', name:'Pendolino', sub:'osobowy 🧍' },
};
let TR = null, TRkey = '', cars = [], lead = steam, TRAIN_L = 27, VMAX = 13;
const VREV = 6;

const starGeo = (() => { const s = new T.Shape(); for (let k = 0; k < 10; k++) { const a = k/10*6.283 + Math.PI/2, r = k % 2 ? .5 : 1.15; if (k) s.lineTo(Math.cos(a)*r, Math.sin(a)*r); else s.moveTo(Math.cos(a)*r, Math.sin(a)*r); }
  const g = new T.ExtrudeGeometry(s, { depth:.3, bevelEnabled:false }); g.translate(0, 0, -.15); return g; })();
const starMat = pho(0xffd21f, { metalness:.5, roughness:.25, emissive:0x8a5c00, emissiveIntensity:.9 });

/* =====================================================================
   MIASTO: losowa siatka szerokich ulic, tory, droga za miastem
   ===================================================================== */
const RW = 7, BL = 46, PITCH = BL + 2*RW, NX = 8, NZ = 7, RAILJ = 3, FLOOR = 3.1, BAY = 3.2;     // ulica ma 14 m: cztery pasy
const X0 = -NX*PITCH/2, Z0 = -NZ*PITCH/2, stX = i => X0 + i*PITCH, stZ = j => Z0 + j*PITCH, ZR = stZ(RAILJ), XMAX = -X0, ZMAX = -Z0;
const HE = [], VE = [];                            // odcinki ulic: poziome HE[j][i], pionowe VE[j][i]
for (let j = 0; j <= NZ; j++) HE.push(new Array(NX).fill(j !== RAILJ));
for (let j = 0; j < NZ; j++) VE.push(new Array(NX + 1).fill(true));
const nbrs = (i, j) => { const o = []; if (i < NX && HE[j][i]) o.push([i + 1, j]); if (i > 0 && HE[j][i - 1]) o.push([i - 1, j]); if (j < NZ && VE[j][i]) o.push([i, j + 1]); if (j > 0 && VE[j - 1][i]) o.push([i, j - 1]); return o; };
function connected() {
  const seen = new Set(['0,0']), q = [[0, 0]];
  while (q.length) { const n = q.pop(); nbrs(n[0], n[1]).forEach(m => { const k = m[0] + ',' + m[1]; if (!seen.has(k)) { seen.add(k); q.push(m); } }); }
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) if (!seen.has(i + ',' + j)) return false; return true;
}
const removed = [];                                // kilka ulic znika: powstają większe kwartały i skrzyżowania w T
{ const cand = [];
  for (let j = 1; j < NZ; j++) if (j !== RAILJ) for (let i = 0; i < NX; i++) cand.push(['H', i, j]);
  for (let j = 0; j < NZ; j++) if (j !== RAILJ - 1 && j !== RAILJ) for (let i = 1; i < NX; i++) cand.push(['V', i, j]);
  for (let k = cand.length - 1; k > 0; k--) { const m = (rnd()*(k + 1)) | 0, t = cand[k]; cand[k] = cand[m]; cand[m] = t; }
  for (let k = 0; k < cand.length && removed.length < 9; k++) { const c = cand[k], A = c[0] === 'H' ? HE : VE; A[c[2]][c[1]] = false;
    const e2 = c[0] === 'H' ? [c[1] + 1, c[2]] : [c[1], c[2] + 1];
    if (nbrs(c[1], c[2]).length < 2 || nbrs(e2[0], e2[1]).length < 2 || !connected()) A[c[2]][c[1]] = true; else removed.push(c); } }

const polyRoads = [];                              // drogi poza siatką: próbki osi co 2,5 m
function onRoad(x, z) {
  const W = RW + .6;
  if (x > X0 - W && x < XMAX + W && z > Z0 - W && z < ZMAX + W) {
    const i = Math.round((x - X0)/PITCH), j = Math.round((z - Z0)/PITCH), dx = Math.abs(x - stX(i)), dz = Math.abs(z - stZ(j));
    if (dx < W && dz < W) return true;
    if (dx < W) { const jj = Math.floor((z - Z0)/PITCH); if (jj >= 0 && jj < NZ && VE[jj][i]) return true; }
    if (dz < W) { const ii = Math.floor((x - X0)/PITCH); if (ii >= 0 && ii < NX && HE[j][ii]) return true; }
  }
  for (let n = 0; n < polyRoads.length; n++) { const p = polyRoads[n]; for (let k = 0; k < p.length; k++) { const q = p[k], ax = x - q.x, az = z - q.z; if (ax*ax + az*az < W*W) return true; } }
  return false;
}

/* ---------- płaskie siatki: asfalt, linie, chodniki ---------- */
const PO = n => ({ polygonOffset:true, polygonOffsetFactor:-n, polygonOffsetUnits:-n });
const roadMat = lam(0xffffff, Object.assign({ map:tex(128, 128, (g, w, h) => { g.fillStyle = '#4d5055'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { g.fillStyle = ['#585b60', '#44474b', '#52555a', '#3e4145'][i & 3]; g.fillRect(rnd()*w, rnd()*h, rr(1, 2.5), rr(1, 2.5)); } }) }, PO(1)));
const lineMat = lam(0xf2efe2, PO(3));
const walkMat = lam(0xffffff, Object.assign({ map:tex(64, 64, (g, w, h) => { g.fillStyle = '#cdc7b8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,80,60,.35)'; g.lineWidth = 1;
  for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k*16, 0); g.lineTo(k*16, h); g.moveTo(0, k*16); g.lineTo(w, k*16); g.stroke(); } }) }, PO(1)));
const INNER = { pave:lam(0xb4aea2, PO(2)), dirt:lam(0xb89c6c, PO(2)), wheat:lam(0xe0b23a, PO(2)), grass:lam(0x74b257, PO(2)), water:pho(0x4f8fb5, Object.assign({ metalness:.55, roughness:.06, envMapIntensity:1.5 }, PO(2))), sand:lam(0xe2cf98, PO(1)), top:lam(0xe8d49a, PO(3)) };
const innerP = { pave:[], dirt:[], wheat:[], grass:[], water:[], sand:[], top:[] };
function quad(P, x0, z0, x1, z1) { P.push(x0, 0, z0, x0, 0, z1, x1, 0, z1, x0, 0, z0, x1, 0, z1, x1, 0, z0); }
function triUp(P, a, b, c) { if ((b.z - a.z)*(c.x - a.x) - (b.x - a.x)*(c.z - a.z) < 0) { const t = b; b = c; c = t; } P.push(a.x, 0, a.z, b.x, 0, b.z, c.x, 0, c.z); }
function flatMesh(P, mat, y) {
  if (!P.length) return null; const g = new T.BufferGeometry(), n = P.length/3, N = new Float32Array(n*3), U = new Float32Array(n*2);
  for (let i = 0; i < n; i++) { N[i*3 + 1] = 1; U[i*2] = P[i*3]/6; U[i*2 + 1] = P[i*3 + 2]/6; }
  g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.BufferAttribute(N, 3)); g.setAttribute('uv', new T.BufferAttribute(U, 2));
  const m = new T.Mesh(g, mat); m.position.y = y; m.receiveShadow = true; scene.add(m); return m;
}
const roadP = [], lineP = [], walkP = [], curbP = [], manP = [];
const arrowXZ = (x, z, fx, fz) => { const px = -fz, pz = fx, P = (a, b) => ({ x:x + fx*a + px*b, z:z + fz*a + pz*b }); triUp(lineP, P(0, -.16), P(0, .16), P(2.2, .16)); triUp(lineP, P(0, -.16), P(2.2, .16), P(2.2, -.16)); triUp(lineP, P(2.2, -.6), P(2.2, .6), P(3.7, 0)); };
for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) if (nbrs(i, j).length) quad(roadP, stX(i) - RW, stZ(j) - RW, stX(i) + RW, stZ(j) + RW);
for (let j = 0; j <= NZ; j++) for (let i = 0; i < NX; i++) if (HE[j][i]) { const x0 = stX(i) + RW, x1 = stX(i + 1) - RW, z = stZ(j);
  quad(roadP, x0, z - RW, x1, z + RW); quad(lineP, x0 + 4.2, z - .26, x1 - 4.2, z - .1); quad(lineP, x0 + 4.2, z + .1, x1 - 4.2, z + .26);
  for (let x = x0 + 5; x < x1 - 7; x += 7) [-3.5, 3.5].forEach(o => quad(lineP, x, z + o - .08, x + 3, z + o + .08));
  for (let o = -RW + .7; o < RW - .5; o += 1.3) { quad(lineP, x0 + .7, z + o, x0 + 3.3, z + o + .65); quad(lineP, x1 - 3.3, z + o, x1 - .7, z + o + .65); }
  [1.75, 5.25].forEach(o => { arrowXZ(x1 - 12, z + o, 1, 0); arrowXZ(x0 + 12, z - o, -1, 0); }); const mx = rr(x0 + 8, x1 - 8), mz = z + rr(-5, 5); quad(manP, mx - .45, mz - .45, mx + .45, mz + .45); }
for (let j = 0; j < NZ; j++) for (let i = 0; i <= NX; i++) if (VE[j][i]) { const z0 = stZ(j) + RW, z1 = stZ(j + 1) - RW, x = stX(i), a = j === RAILJ, b = j + 1 === RAILJ;
  quad(roadP, x - RW, z0, x + RW, z1); quad(lineP, x - .26, z0 + 4.2, x - .1, z1 - 4.2); quad(lineP, x + .1, z0 + 4.2, x + .26, z1 - 4.2);
  for (let z = z0 + 5; z < z1 - 7; z += 7) [-3.5, 3.5].forEach(o => quad(lineP, x + o - .08, z, x + o + .08, z + 3));
  for (let o = -RW + .7; o < RW - .5; o += 1.3) { if (!a) quad(lineP, x + o, z0 + .7, x + o + .65, z0 + 3.3); if (!b) quad(lineP, x + o, z1 - 3.3, x + o + .65, z1 - .7); }
  if (a) quad(lineP, x + .5, z0 + 1.2, x + RW - .4, z0 + 1.8); if (b) quad(lineP, x - RW + .4, z1 - 1.8, x - .5, z1 - 1.2);
  [1.75, 5.25].forEach(o => { if (!b) arrowXZ(x - o, z1 - 12, 0, 1); if (!a) arrowXZ(x + o, z0 + 12, 0, -1); }); const mx = x + rr(-5, 5), mz = rr(z0 + 8, z1 - 8); quad(manP, mx - .45, mz - .45, mx + .45, mz + .45); }     // linia zatrzymania przed torami
function polyRoad(pts) {                           // kręta droga z punktów [x, z]
  const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], 0, p[1]))), sp = curve.getSpacedPoints(Math.ceil(curve.getLength()/2.5)), S2 = sp.map(p => ({ x:p.x, z:p.z }));
  S2.forEach((p, k) => { const a = S2[Math.max(0, k - 1)], b = S2[Math.min(S2.length - 1, k + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; p.tx = (b.x - a.x)/l; p.tz = (b.z - a.z)/l; });
  const off = (p, o) => ({ x:p.x - p.tz*o, z:p.z + p.tx*o }), strip = (P, a, b, o0, o1) => { const A = off(a, o0), B = off(a, o1), C = off(b, o1), D = off(b, o0); triUp(P, A, B, C); triUp(P, A, C, D); };
  for (let k = 0; k < S2.length - 1; k++) { const a = S2[k], b = S2[k + 1]; strip(roadP, a, b, -RW, RW); strip(lineP, a, b, -RW + .35, -RW + .5); strip(lineP, a, b, RW - .5, RW - .35);
    if (k % 4 < 2) strip(lineP, a, b, -.1, .1); }
  polyRoads.push(S2); return S2;
}
const COUNTRY = polyRoad([[XMAX + RW - 1, stZ(1)], [XMAX + 48, stZ(1) - 4], [XMAX + 108 + rr(-10, 10), stZ(1) - 42], [XMAX + 132, Z0 - 28 + rr(-10, 10)], [XMAX + 96 + rr(-8, 8), Z0 - 96],
  [XMAX - 22, Z0 - 122 + rr(-8, 8)], [XMAX - 112, Z0 - 102], [stX(3) + 32, Z0 - 60 + rr(-6, 6)], [stX(3) + 3, Z0 - 28], [stX(3), Z0 - RW + 1]]);
const SPUR = polyRoad([[stX(3), ZMAX + RW - 1], [stX(3), ZMAX + 28], [stX(3), ZMAX + 54]]);
const LAKE = { x:XMAX, z:Z0 - 70, rx:34, rz:24 };
const BND = { x0:X0 - 150, x1:XMAX + 165, z0:Z0 - 150, z1:ZMAX + 95 };      // granica świata: za nią szpaler drzew, dalej nie da się jechać

/* ---------- tory: pętla przez środek miasta i dookoła od południa ---------- */
const RAIL = (() => { const XR = XMAX + 52, ZS = ZMAX + 62, R = 30, P = [];
  const line = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0)); for (let k = 0; k < n; k++) P.push({ x:x0 + (x1 - x0)*k/n, z:z0 + (z1 - z0)*k/n }); };
  const arc = (cx, cz, a0, a1) => { const n = Math.round(Math.abs(a1 - a0)*R); for (let k = 0; k < n; k++) { const a = a0 + (a1 - a0)*k/n; P.push({ x:cx + Math.cos(a)*R, z:cz + Math.sin(a)*R }); } };
  line(-XR + R, ZR, XR - R, ZR); arc(XR - R, ZR + R, -Math.PI/2, 0); line(XR, ZR + R, XR, ZS - R); arc(XR - R, ZS - R, 0, Math.PI/2);
  line(XR - R, ZS, -XR + R, ZS); arc(-XR + R, ZS - R, Math.PI/2, Math.PI); line(-XR, ZS - R, -XR, ZR + R); arc(-XR + R, ZR + R, Math.PI, Math.PI*1.5);
  let acc = 0; P.forEach((p, k) => { const q = P[(k + 1) % P.length]; p.d = acc; p.l = Math.hypot(q.x - p.x, q.z - p.z); acc += p.l; });
  return { P, L:acc, XR, ZS }; })();
function railAt(d, o) {
  const P = RAIL.P, n = P.length; d = ((d % RAIL.L) + RAIL.L) % RAIL.L; let k = Math.min(n - 1, (d/RAIL.L*n) | 0);
  while (k > 0 && P[k].d > d) k--; while (k < n - 1 && P[k].d + P[k].l < d) k++;
  const p = P[k], q = P[(k + 1) % n], t = (d - p.d)/p.l; o.x = p.x + (q.x - p.x)*t; o.z = p.z + (q.z - p.z)*t; o.tx = (q.x - p.x)/p.l; o.tz = (q.z - p.z)/p.l; return o;
}
const railD = (x, z) => { let b = 0, bd = 1e9; RAIL.P.forEach(p => { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p.d; } }); return b; };
const nearRail = (x, z, m) => { for (let k = 0; k < RAIL.P.length; k += 3) { const p = RAIL.P[k]; if (Math.abs(p.x - x) < m && Math.abs(p.z - z) < m) return true; } return false; };
{ // podsypka, szyny, podkłady
  const P = RAIL.P, n = P.length, bal = [], rl = [], T3 = (arr, a, b, c) => arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const at = (k, o, y) => { const p = P[k % n], q = P[(k + 1) % n], tx = (q.x - p.x)/p.l, tz = (q.z - p.z)/p.l; return [p.x - tz*o, y, p.z + tx*o]; };
  const Q = (arr, k, o0, y0, o1, y1) => { const A = at(k, o0, y0), B = at(k, o1, y1), C = at(k + 1, o1, y1), D = at(k + 1, o0, y0); T3(arr, A, B, C); T3(arr, A, C, D); T3(arr, A, C, B); T3(arr, A, D, C); };
  for (let k = 0; k < n; k++) { Q(bal, k, -1.65, .07, 1.65, .07); [-1, 1].forEach(s => { const c = s*GAUGE/2; Q(rl, k, c - .065, RAIL_TOP, c + .065, RAIL_TOP); Q(rl, k, c - .065, .2, c - .065, RAIL_TOP); Q(rl, k, c + .065, .2, c + .065, RAIL_TOP); }); }
  const mk = (arr, mat, uv) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); g.computeVertexNormals();
    if (uv) { const U = new Float32Array(arr.length/3*2); for (let i = 0; i < arr.length/3; i++) { U[i*2] = arr[i*3]/3.5; U[i*2 + 1] = arr[i*3 + 2]/3.5; } g.setAttribute('uv', new T.BufferAttribute(U, 2)); }
    const m = new T.Mesh(g, mat); m.receiveShadow = true; scene.add(m); };
  mk(bal, lam(0xffffff, Object.assign({ map:ballastTex, side:T.DoubleSide }, PO(2))), true); mk(rl, pho(0xa3abb1, { metalness:.85, roughness:.28, side:T.DoubleSide }));
  const ns = Math.floor(RAIL.L/.8), sl = new T.InstancedMesh(new T.BoxGeometry(2.5, .14, .3), M.sleeper, ns), d = new T.Object3D(), o = {};
  for (let k = 0; k < ns; k++) { railAt(k*.8, o); d.position.set(o.x, .13, o.z); d.rotation.y = Math.atan2(o.tx, o.tz); d.updateMatrix(); sl.setMatrixAt(k, d.matrix); }
  sl.frustumCulled = false; sl.receiveShadow = true; scene.add(sl);
}

/* ---------- fasady, szyldy, markizy ---------- */
const FAC = [['#eadfc6', '#8fb3cc'], ['#e7b9a6', '#9cc0d6'], ['#b9c6cf', '#7fa6c0'], ['#f0d27a', '#86aecb'], ['#b5654a', '#a9cbe0'], ['#cfd2d0', '#8db1c9', 'p'], ['#d9cdb8', '#8db1c9', 'p']].map((s, n) => {
  const map = tex(256, 256, (g, w, h) => { g.fillStyle = s[0]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1100; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'; g.fillRect(rnd()*w, rnd()*h, rr(2, 10), rr(1, 3)); }
    if (n === 4) { g.strokeStyle = 'rgba(60,20,10,.4)'; g.lineWidth = 1; for (let y = 4; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y/8 % 2)*8; x < w; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } } }
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const x = a*128, y = b*128, v = (a + b*2 + n) % 4;
      if (s[2]) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, 125, 125); }
      else { g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(x + 30, y + 12, 68, 7); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 30, y + 10, 68, 2); }
      g.fillStyle = '#f7f3e8'; g.fillRect(x + 34, y + 20, 60, 70); const gr = g.createLinearGradient(x, y + 25, x, y + 85); gr.addColorStop(0, s[1]); gr.addColorStop(1, '#5d7f99'); g.fillStyle = gr; g.fillRect(x + 39, y + 25, 50, 60);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x + 39, y + 25); g.lineTo(x + 66, y + 25); g.lineTo(x + 39, y + 58); g.fill();
      if (v % 2) { g.fillStyle = ['rgba(255,255,255,.75)', 'rgba(255,214,170,.8)'][v >> 1]; g.fillRect(x + 39, y + 25, 13, 60); g.fillRect(x + 76, y + 25, 13, 60); }
      g.fillStyle = '#f7f3e8'; g.fillRect(x + 62, y + 25, 4, 60); g.fillRect(x + 39, y + 46, 50, 3);
      g.fillStyle = '#fbf8ef'; g.fillRect(x + 30, y + 90, 68, 6); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 30, y + 96, 68, 3);
      if (!s[2] && v === 2) { g.fillStyle = '#7a4a2a'; g.fillRect(x + 36, y + 84, 56, 8); ['#e5332a', '#f5c41f', '#e86aa8', '#e5332a', '#fff'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(x + 42 + k*11, y + 82, 4.5, 0, 7); g.fill(); }); }
      if (s[2]) { g.fillStyle = ['#e0703a', '#3f8fd0', '#e8c23a', '#5fae5a'][v]; g.fillRect(x + 20, y + 82, 88, 32); g.fillStyle = 'rgba(0,0,0,.28)'; for (let k = 0; k < 12; k++) g.fillRect(x + 22 + k*7.6, y + 84, 1.5, 28); g.fillRect(x + 20, y + 80, 88, 3); g.fillRect(x + 20, y + 113, 88, 4); }
      g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(x, y + 124, 128, 4); } });
  const em = tex(128, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); [[0, 0], [1, 1], [1, 0], [0, 1]].forEach((q, k) => { if ((k + n) % 3) { g.fillStyle = k % 2 ? '#ffd98a' : '#ffe9b8'; g.fillRect(q[0]*64 + 19.5, q[1]*64 + 12.5, 25, 30); } }); });
  return lam(0xffffff, { map, emissiveMap:em, emissive:0x000000 }); });
const EMO = {}, emo = i => EMO[i] || (EMO[i] = lam(0xffffff, { map:tex(64, 64, (g, w, h) => { g.fillStyle = '#fff7e0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3b2a17'; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6); g.font = '38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i, w/2, h/2 + 3); }) }));
const ROOF2 = lam(0x5a626b), DISP = [0xe5332a, 0xf5c41f, 0x3d63d8, 0x3f9a4a, 0xf08a2a].map(c => lam(c)), BILL = ['CIUCHCIOWO WITA!', 'LODY U ZDZICHA', 'KOLEJ NA KOLEJ', 'MLEKO PROSTO OD KROWY', 'TAXI 9-1-9', 'BIZON: KOSI WSZYSTKO'];

const SG = {}, sgn = (t, bg, fg) => SG[t + bg] || (SG[t + bg] = signMat(t, bg, fg));
const AWN = [['#d8452f', '#fff7e6'], ['#2f7fd8', '#fff7e6'], ['#3f9a4a', '#fff7e6'], ['#f2a81f', '#fff7e6']].map(c => lam(0xffffff, { map:tex(64, 16, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = c[k % 2]; g.fillRect(k*8, 0, 8, h); } }) }));
const ROTK = [Math.PI, Math.PI/2, 0, -Math.PI/2], SNX = [0, 1, 0, -1], SNZ = [-1, 0, 1, 0];       // strony kwartału: 0 północ, 1 wschód, 2 południe, 3 zachód
const sidePt = (B, k, u, v) => ({ x:B.cx + SNX[k]*(BL/2 - v) - SNZ[k]*u, z:B.cz + SNZ[k]*(BL/2 - v) + SNX[k]*u });

const solids = [], circles = [], treesAt = [], propsAt = [], POIS = [], pedPaths = [], chickHomes = [], cowHomes = [], ramps = [], slowZones = [], mapIcons = [], blocks = [], PLOTS = {};
const cityG = []; for (let k = 0; k < 6; k++) cityG.push(new T.Group());
const outG = new T.Group();
const addProp = (type, x, z, ry) => propsAt.push({ type, x, z, ry:ry === undefined ? rnd()*6.28 : ry });
const addTree = (x, z, s, fir) => { treesAt.push({ x, z, s:s || rr(.8, 1.4), fir:!!fir }); circles.push({ x, z, r:.6, tree:1 }); };
const addSolid = (x0, z0, x1, z1, h) => solids.push({ x0:Math.min(x0, x1), x1:Math.max(x0, x1), z0:Math.min(z0, z1), z1:Math.max(z0, z1), h:h || 9 });

function addPOI(B, k, u, name, ico) {
  if (!B.st[k]) { k = [0, 1, 2, 3].find(q => B.st[q]); if (k === undefined) return null; u = 0; }
  const a = sidePt(B, k, u, -3.6), b = sidePt(B, k, u, 1.3), p = { name, ico, x:a.x, z:a.z, px:b.x, pz:b.z, h:Math.atan2(-SNZ[k], SNX[k]) }; POIS.push(p); mapIcons.push({ x:b.x + SNX[k]*-6, z:b.z + SNZ[k]*-6, ico }); return p;
}
function freePOI(x, z, px, pz, h, name, ico) { POIS.push({ name, ico, x, z, px, pz, h }); mapIcons.push({ x:px, z:pz, ico }); }
function lotAt(key, x, z, s, bx) {                 // działka budynku z Ciuchci; bx: [x0, x1, z0, z1] bryły w układzie działki
  PLOTS[key] = [x, z, s]; if (!bx) return; const a = ROTK[s], c = Math.cos(a), n = Math.sin(a), W = (lx, lz) => [x + lx*c + lz*n, z - lx*n + lz*c], p = W(bx[0], bx[2]), q = W(bx[1], bx[3]); addSolid(p[0], p[1], q[0], q[1], 11);
}
const lotW = (key, lx, lz) => { const p = PLOTS[key], a = ROTK[p[2]], c = Math.cos(a), n = Math.sin(a); return { x:p[0] + lx*c + lz*n, z:p[1] - lx*n + lz*c }; };
function addRamp(x, z, h) { ramps.push({ x, z, h, fx:Math.sin(h), fz:Math.cos(h), L:7, H:2.3, w:4.6 }); }

const HMAT = [[0xf6d9a8, 0x9a4a36], [0xd9e8c8, 0x5a6f7a], [0xf2c9c0, 0x7a4a36], [0xe6e0f2, 0xa6432f], [0xfff1c9, 0x3f6f9a]].map(c => [lam(c[0]), lam(c[1]), lam(c[0], { side:T.DoubleSide })]);

const SHOPS = [['PIEKARNIA', '🥐'], ['LODY', '🍦'], ['WARZYWA', '🥕'], ['KWIATY', '🌷'], ['ZABAWKI', '🧸'], ['PIZZA', '🍕'], ['APTEKA', '💊'], ['FRYZJER', '💈'], ['KSIĘGARNIA', '📚'], ['CUKIERNIA', '🍰'], ['ROWERY', '🚲'], ['PĄCZKI', '🍩'],
  ['BAR MLECZNY', '🥛'], ['KINO', '🎬'], ['POCZTA', '📮'], ['SZKOŁA', '🏫'], ['STRAŻ', '🚒'], ['BASEN', '🏊'], ['PRZEDSZKOLE', '🎈'], ['MUZEUM', '🦕']];
for (let k = SHOPS.length - 1; k > 0; k--) { const m = (rnd()*(k + 1)) | 0, t = SHOPS[k]; SHOPS[k] = SHOPS[m]; SHOPS[m] = t; }
const nice = s => s.charAt(0) + s.slice(1).toLowerCase();
function rowAlong(B, g, k, from, to, depth, maxFl) {
  let u = from; while (u < to - 6) { let w = rr(9, 15); if (to - (u + w) < 7) w = to - u; const st = (rnd()*5) | 0, fl = 2 + ((rnd()*rnd()*(maxFl || 6)) | 0), p = sidePt(B, k, u + w/2, 2.6 + depth/2), hz = k % 2 === 0;
    bldg(g, p.x, p.z, hz ? w : depth, hz ? depth : w, fl, st);
    if (B.st[k] && rnd() < .8) { const f = sidePt(B, k, u + w/2, 2.6), sh = SHOPS.length && rnd() < .6 ? SHOPS.pop() : null; shop(g, f.x, f.z, w - 1.6, k, sh && sh[0], sh && sh[1]);
      if (sh) { addPOI(B, k, u + w/2, nice(sh[0]), sh[1]); if (sh[0] === 'WARZYWA') [-1.5, 0, 1.5].forEach(o => { const q = sidePt(B, k, u + w/2 + o, 1.7); addProp('crate', q.x, q.z); }); } }
    u += w + (rnd() < .3 ? rr(1.5, 3.5) : 0); }
}
function furniture(B) {                            // latarnie, kosze, znaki, hydranty na chodniku; trasy przechodniów
  for (let k = 0; k < 4; k++) { if (!B.st[k]) continue;
    [-17, 17].forEach(u => { const p = sidePt(B, k, u, .8); addProp('lamp', p.x, p.z, ROTK[k]); });
    if (rnd() < .5) { const p = sidePt(B, k, rr(-12, 12), .9); addProp('bin', p.x, p.z); }
    if (rnd() < .35) { const p = sidePt(B, k, rr(-12, 12), .9); addProp('hydrant', p.x, p.z); }
    if (rnd() < .55) { const p = sidePt(B, k, rr(-14, 14), .7); addProp(rnd() < .5 ? 'sign' : 'signT', p.x, p.z, ROTK[k] + Math.PI/2); }
    if (rnd() < .3) { const p = sidePt(B, k, rr(-10, 10), 1.6); addProp('bench', p.x, p.z, ROTK[k]); }
    if (rnd() < .45) { const p = sidePt(B, k, rr(-15, 15), 1.9); addProp('planter', p.x, p.z, ROTK[k]); }
    if (rnd() < .2) { const p = sidePt(B, k, rr(-15, 15), 1.0); addProp('mailbox', p.x, p.z, ROTK[k]); }
    if (rnd() < .22) { const u = rr(-12, 12); for (let n = 0; n < 4; n++) { const p = sidePt(B, k, u + n*1.6, -1.6 - (n % 2)*.5); addProp('cone', p.x, p.z); } }       // roboty drogowe
    const a = sidePt(B, k, -21, 1.5), b = sidePt(B, k, 21, 1.5); pedPaths.push({ ax:a.x, az:a.z, bx:b.x, bz:b.z, nx:-SNX[k], nz:-SNZ[k] }); }
}
const inner = (B, kind, m) => quad(innerP[kind], B.x0 + (m || 2.4), B.z0 + (m || 2.4), B.x1 - (m || 2.4), B.z1 - (m || 2.4));
const TENT = k => rr(-1, 1) > 0 ? ROTK[k] : ROTK[k] + Math.PI;
const BUILD = {
  downtown(B, g) { inner(B, 'pave'); rowAlong(B, g, 0, -20.4, 20.4, 11); rowAlong(B, g, 2, -20.4, 20.4, 11); rowAlong(B, g, 1, -8, 8, 11); rowAlong(B, g, 3, -8, 8, 11);
    addTree(B.cx + rr(-4, 4), B.cz + rr(-4, 4)); addProp('trzepak', B.cx + rr(-5, 5), B.cz + 5); if (rnd() < .7) addProp('pcar' + ((rnd()*3) | 0), B.cx + rr(-5, 5), B.cz - 4, rr(0, 6)); },
  bloki(B, g) { inner(B, 'grass'); const hz = rnd() < .5, st = 5 + ((rnd()*2) | 0);
    [-12.5, 12.5].forEach(o => { const fl = 7 + ((rnd()*5) | 0), bx = hz ? B.cx : B.cx + o, bz = hz ? B.cz + o : B.cz; bldg(g, bx, bz, hz ? 34 : 10.5, hz ? 10.5 : 34, fl, st, M.concrete);
      for (let f = 1; f < fl; f++) [-1, 1].forEach(sd => { box(hz ? 31 : 1.2, .14, hz ? 1.2 : 31, M.concrete, bx + (hz ? 0 : sd*5.8), f*FLOOR + .25, bz + (hz ? sd*5.8 : 0), g); box(hz ? 31 : .07, .9, hz ? .07 : 31, DISP[(f + (sd > 0 ? 2 : 0)) % 5], bx + (hz ? 0 : sd*6.35), f*FLOOR + .75, bz + (hz ? sd*6.35 : 0), g); });
      [-9, 9].forEach(e => box(hz ? 3 : 2, .2, hz ? 2 : 3, M.dark, bx + (hz ? e : -Math.sign(o)*6.2), 2.7, bz + (hz ? -Math.sign(o)*6.2 : e), g)); });
    addProp('pcar' + ((rnd()*3) | 0), B.cx + (hz ? 9 : -2), B.cz + (hz ? -2 : 9), hz ? Math.PI/2 : 0); addProp('pcar' + ((rnd()*3) | 0), B.cx + (hz ? 14 : 2), B.cz + (hz ? 2 : 14), hz ? Math.PI/2 : 0);
    addProp('trzepak', B.cx - 4, B.cz); addProp('bench', B.cx + 4, B.cz + 1); addProp('bin', B.cx + 6, B.cz - 1); quad(innerP.top, B.cx - 1.5, B.cz - 2, B.cx + 2, B.cz + 2);
    [[-17, 0], [17, 0], [0, 0]].forEach(q => addTree(B.cx + (hz ? q[0] : q[1]) + rr(-1, 1), B.cz + (hz ? q[1] : q[0]) + rr(-1, 1)));
    addPOI(B, hz ? 0 : 3, 0, 'Bloki', '🏢'); },
  houses(B, g) { inner(B, 'grass'); [-14, 0, 14].forEach(x => { house(g, B.cx + x, B.cz - 12.5, 0); house(g, B.cx + x, B.cz + 12.5, 2); addTree(B.cx + x + 7, B.cz + rr(-3, 3)); });
    for (let u = -19; u <= 19; u += 2) if (Math.abs(u % 14) > 2.5) { addProp('fence', B.cx + u, B.z0 + 3.2, 0); addProp('fence', B.cx + u, B.z1 - 3.2, 0); }
    for (let n = 0; n < 3; n++) chickHomes.push({ x:B.cx + rr(-15, 15), z:B.cz + rr(-3, 3) });
    addProp('pcar' + ((rnd()*3) | 0), B.cx + 7, B.cz + rr(-2, 2), Math.PI/2); addPOI(B, 0, 7, 'Osiedle', '🏡'); },
  villas(B, g) { inner(B, 'grass'); lotAt('housesA', B.cx - 9.5, B.cz, 2); lotAt('housesB', B.cx + 9.5, B.cz, 2);
    ['housesA', 'housesB'].forEach((key, n) => [[-3.2, -2.5], [3, -3], [n ? -2.6 : 2.6, 3.2]].forEach(q => { const p = lotW(key, q[0], q[1]); circles.push({ x:p.x, z:p.z, r:3.3 }); }));
    [[-17, -17], [17, -17], [-17, 17], [17, 17], [0, 17], [0, -17]].forEach(q => addTree(B.cx + q[0] + rr(-2, 2), B.cz + q[1] + rr(-2, 2)));
    addPOI(B, 2, 0, 'Bocianie Gniazdo', '🪺'); },
  pond(B, g) { inner(B, 'grass'); const k = [0, 1, 2, 3].find(q => B.st[q]) || 0, c = sidePt(B, k, 0, 13); lotAt('pond', c.x, c.z, k); slowZones.push({ x:c.x, z:c.z, r:5.4 });
    for (let n = 0; n < 9; n++) { const x = B.cx + rr(-19, 19), z = B.cz + rr(-19, 19); if (Math.hypot(x - c.x, z - c.z) > 9) addTree(x, z); }
    addRamp(c.x - SNZ[k]*-15, c.z + SNX[k]*-15, Math.atan2(-SNZ[k], SNX[k])); addProp('bench', B.cx - SNX[k]*6, B.cz - SNZ[k]*6); addPOI(B, k, 12, 'Staw', '🦆'); },
  forest(B, g) { inner(B, 'grass'); lotAt('forest', B.cx, B.cz, 0, [-5.3, 5.3, -5.3, 5.3]);
    for (let n = 0; n < 12; n++) { const x = B.cx + rr(-19, 19), z = B.cz + rr(-19, 19); if (Math.max(Math.abs(x - B.cx), Math.abs(z - B.cz)) > 8.5) addTree(x, z, 0, rnd() < .5); }
    addRamp(B.cx + 14, B.cz - 13, rnd() < .5 ? 0 : Math.PI/2); addProp('bench', B.cx - 12, B.cz + 14); addProp('bin', B.cx - 10, B.cz + 14); addPOI(B, 2, -6, 'Park', '🌳'); },
  market(B, g) { inner(B, 'pave'); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const x = B.cx + a*11, z = B.cz + b*11; addProp('stall', x, z, (a + b) % 2 ? 0 : Math.PI/2);
      addProp(rnd() < .5 ? 'crate' : 'pumpkin', x + 2.2, z + rr(-1, 1)); if (rnd() < .5) addProp('barrel', x - 2.2, z + rr(-1, 1)); }
    cylY(2.6, .7, M.stone, B.cx, .35, B.cz, g, 18); cylY(2.2, .1, INNER.water, B.cx, .72, B.cz, g, 18); cylY(.3, 1.8, M.stone, B.cx, 1.2, B.cz, g, 10); circles.push({ x:B.cx, z:B.cz, r:2.9 });
    addPOI(B, 1, 0, 'Targ', '🧺'); },
  farm(B, g) { inner(B, 'dirt'); barn(g, B.cx - 11, B.cz - 9, 2); quad(innerP.wheat, B.cx + 1, B.cz - 19, B.cx + 20, B.cz - 2); addProp('scarecrow', B.cx + 10, B.cz - 10, 0);
    for (let n = 0; n < 7; n++) addProp('bale', B.cx + rr(-18, 18), B.cz + rr(4, 19)); for (let n = 0; n < 4; n++) addProp('pumpkin', B.cx + rr(-18, -3), B.cz + rr(2, 8));
    for (let u = -19; u <= 19; u += 2) addProp('fence', B.cx + u, B.z1 - 3, 0);
    for (let n = 0; n < 6; n++) chickHomes.push({ x:B.cx + rr(-16, 16), z:B.cz + rr(0, 14) }); cowHomes.push({ x:B.cx + rr(4, 16), z:B.cz + rr(6, 16) }); cowHomes.push({ x:B.cx - 14, z:B.cz + 12 });
    addRamp(B.cx + 6, B.cz + 10, Math.PI/2); addPOI(B, 3, -6, 'Stodoła', '🐄'); },
  land(B, g, key, bx, name, ico, extra) { inner(B, key === 'mine' ? 'dirt' : 'grass'); const k = [0, 1, 2, 3].find(q => B.st[q]) || 0, c = sidePt(B, k, 0, 13); lotAt(key, c.x, c.z, k, bx);
    for (let n = 0; n < 7; n++) { const x = B.cx + rr(-19, 19), z = B.cz + rr(-19, 19); if (Math.max(Math.abs(x - c.x), Math.abs(z - c.z)) > 11) { if (extra && n < 4) addProp(extra, x, z); else addTree(x, z); } }
    addPOI(B, k, 13, name, ico); },
  power(B, g) { BUILD.land(B, g, 'power', [-6.6, 5.4, -6.4, 3], 'Elektrownia', '⚡', 'barrel'); },
  mine(B, g) { BUILD.land(B, g, 'mine', [-6.6, 4.3, -4.3, 1.3], 'Kopalnia', '⛏️', 'barrel'); },
  sawmill(B, g) { BUILD.land(B, g, 'sawmill', [-4.9, 4.9, -5, 1], 'Tartak', '🌲', 'crate'); },
  station(B, g, key) { inner(B, 'pave'); lotAt(key, B.cx, ZR - 14, 2, [-5.7, 5.7, -1.8, 4.6]); rowAlong(B, g, 0, -20.4, -3, 10, 3); [[-16, 4], [16, 4], [-16, 12], [16, 12]].forEach(q => addTree(B.cx + q[0], B.cz + q[1]));
    addProp('bench', B.cx + 9, B.cz - 5); addProp('bin', B.cx + 11, B.cz - 5); addProp('pcar' + ((rnd()*3) | 0), B.cx + 8, B.cz - 14, 0); addProp('pcar' + ((rnd()*3) | 0), B.cx + 13, B.cz - 14, 0); addProp('pcar' + ((rnd()*3) | 0), B.cx + 18, B.cz - 14, 0);
    addPOI(B, 0, 10, key === 'station' ? 'Dworzec Ciuchciowo' : 'Dworzec Bocianowo', '🚉'); },
};
{ // przydział kwartałów
  const all = []; for (let bj = 0; bj < NZ; bj++) for (let bi = 0; bi < NX; bi++) { const B = { bi, bj, cx:stX(bi) + PITCH/2, cz:stZ(bj) + PITCH/2, type:'downtown' };
    B.x0 = B.cx - BL/2; B.x1 = B.cx + BL/2; B.z0 = B.cz - BL/2; B.z1 = B.cz + BL/2; B.st = [HE[bj][bi], VE[bj][bi + 1], HE[bj + 1][bi], VE[bj][bi]]; blocks.push(B); all.push(B); }
  const at = (bi, bj) => blocks[bj*NX + bi]; at(1, RAILJ - 1).type = 'station'; at(4, RAILJ - 1).type = 'town';
  const free = all.filter(B => B.type === 'downtown'); for (let k = free.length - 1; k > 0; k--) { const m = (rnd()*(k + 1)) | 0, t = free[k]; free[k] = free[m]; free[m] = t; }
  ['power', 'mine', 'sawmill', 'pond', 'forest', 'villas', 'market', 'market', 'farm', 'farm', 'bloki', 'bloki', 'bloki', 'bloki', 'houses', 'houses', 'houses', 'houses'].forEach((t, k) => { free[k].type = t; });
  blocks.forEach(B => { quad(walkP, B.x0, B.z0, B.x1, B.z1); quad(curbP, B.x0, B.z0, B.x1, B.z0 + .38); quad(curbP, B.x0, B.z1 - .38, B.x1, B.z1); quad(curbP, B.x0, B.z0, B.x0 + .38, B.z1); quad(curbP, B.x1 - .38, B.z0, B.x1, B.z1); const g = cityG[Math.min(2, (B.bi*3/NX) | 0) + (B.bj < NZ/2 ? 0 : 3)];
    if (B.type === 'station' || B.type === 'town') BUILD.station(B, g, B.type); else BUILD[B.type](B, g); furniture(B); });
  removed.forEach(c => {                           // w miejscu usuniętej ulicy: zielony skrót ze skocznią albo belami siana
    const hz = c[0] === 'H', x = hz ? stX(c[1]) + PITCH/2 : stX(c[1]), z = hz ? stZ(c[2]) : stZ(c[2]) + PITCH/2, h = hz ? Math.PI/2 : 0;
    if (rnd() < .6) addRamp(x, z, h); else for (let n = 0; n < 6; n++) addProp('bale', x + (hz ? rr(-14, 14) : rr(-5, 5)), z + (hz ? rr(-5, 5) : rr(-14, 14)));
    [-17, 17].forEach(o => { addTree(x + (hz ? o : -5), z + (hz ? -5 : o)); addTree(x + (hz ? o*.6 : 5), z + (hz ? 5 : o*.6)); });
    for (let n = 0; n < 3; n++) chickHomes.push({ x:x + rr(-4, 4), z:z + rr(-4, 4) }); });
}
{ // skocznie na ulicach: środkiem jezdni, jedna tuż przed torami
  let n = 0; for (let t = 0; t < 80 && n < 8; t++) { const j = (rnd()*(NZ + 1)) | 0, i = (rnd()*NX) | 0; if (!HE[j][i]) continue; const x = stX(i) + PITCH/2 + rr(-6, 6), z = stZ(j);
    if (ramps.some(r => Math.hypot(r.x - x, r.z - z) < 70)) continue; addRamp(x, z, Math.PI/2); n++; }
  const i = 1 + ((rnd()*(NX - 1)) | 0); addRamp(stX(i), ZR - 17, 0); addRamp(stX(i === 3 ? 4 : 3), ZR + 17, 0);
  cowHomes.push({ x:stX(2) + 3, z:stZ(1) + 2 }); cowHomes.push({ x:stX(4) - 2, z:stZ(4) - 3 });                           // krowy na skrzyżowaniach
}
for (let j = 0; j <= NZ; j++) if (j !== RAILJ) for (let i = 0; i <= NX; i++) if (nbrs(i, j).length > 2) { addProp('tlight', stX(i) - RW - .9, stZ(j) - RW - .9, 0); addProp('tlight', stX(i) + RW + .9, stZ(j) + RW + .9, Math.PI); }      // sygnalizatory
const HALTS = [];                                  // przystanki kolejowe poza dworcami: pociąg ma blisko od stacji do stacji
function halt(x, z, nx, nz, name, ico) {
  const b = new T.Group(); box(12, .55, 3, M.concrete, 0, .275, 0, b); box(12, .03, .28, M.flagW, 0, .56, 1.3, b); [-3, 3].forEach(px => cylY(.08, 2.5, M.steel, px, 1.8, -.9, b, 8));
  const rf = box(7.4, .12, 2.2, lam(0x2f7fd8), 0, 3.1, -.5, b); rf.rotation.x = .12; box(6, 1.5, .08, M.glass, 0, 1.6, -1.1, b); box(2.4, .1, .5, M.woodL, 0, 1.05, -.6, b);
  [-1.9, 1.9].forEach(o => cylY(.07, 2.6, M.steel, o, 2.6, -1.25, b, 8)); box(4.3, 1.05, .1, sgn(name, '#1f4e8c', '#fff'), 0, 3.9, -1.25, b);
  b.position.set(x + nx*3.5, 0, z + nz*3.5); b.rotation.y = Math.atan2(-nx, -nz); outG.add(b); HALTS.push({ name, ico, x, z }); mapIcons.push({ x:x + nx*9, z:z + nz*9, ico:'🚏' });
}
halt(RAIL.XR, (ZR + RAIL.ZS)/2, 1, 0, 'Łąki', '🌼'); halt(118, RAIL.ZS, 0, -1, 'Sad', '🍎'); halt(-118, RAIL.ZS, 0, -1, 'Pastwisko', '🐄'); halt(-RAIL.XR, (ZR + RAIL.ZS)/2, -1, 0, 'Młyn', '🌾');
/* ---------- za miastem: zoo, jezioro, gospodarstwo, pola ---------- */
lotAt('zoo', stX(3), RAIL.ZS + 14, 0, [-6.8, 6.8, -6.7, 5.8]);
freePOI(stX(3) - 3.5, ZMAX + 46, stX(3) - 9, ZMAX + 46, 0, 'Zoo', '🦒'); mapIcons.push({ x:stX(3), z:RAIL.ZS + 14, ico:'🦁' });
{ const P = innerP.water, n = 28; for (let k = 0; k < n; k++) { const a = k/n*6.283, b = (k + 1)/n*6.283; triUp(P, { x:LAKE.x, z:LAKE.z }, { x:LAKE.x + Math.cos(a)*LAKE.rx, z:LAKE.z + Math.sin(a)*LAKE.rz }, { x:LAKE.x + Math.cos(b)*LAKE.rx, z:LAKE.z + Math.sin(b)*LAKE.rz });
    const o = 1.1; triUp(innerP.sand, { x:LAKE.x, z:LAKE.z }, { x:LAKE.x + Math.cos(a)*LAKE.rx*o, z:LAKE.z + Math.sin(a)*LAKE.rz*o }, { x:LAKE.x + Math.cos(b)*LAKE.rx*o, z:LAKE.z + Math.sin(b)*LAKE.rz*o }); }
  const near = (x, z) => { let b = COUNTRY[0], bd = 1e9; COUNTRY.forEach(p => { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p; } }); return b; };
  let p = near(LAKE.x, LAKE.z - 50); freePOI(p.x + p.tz*3.5, p.z - p.tx*3.5, p.x + p.tz*9, p.z - p.tx*9, Math.atan2(-p.tx, -p.tz), 'Jezioro', '🏖️'); addProp('bench', p.x + p.tz*11, p.z - p.tx*11); addRamp(LAKE.x, LAKE.z - LAKE.rz - 9, 0);
  const FX = XMAX + 78, FZ = Z0 - 22; barn(outG, FX, FZ, 3); quad(innerP.wheat, FX - 26, FZ + 12, FX + 14, FZ + 40); quad(innerP.dirt, FX - 12, FZ - 12, FX + 14, FZ + 10); addProp('scarecrow', FX - 6, FZ + 26, 0);
  for (let n = 0; n < 12; n++) addProp('bale', FX + rr(-40, 10), FZ + rr(-34, -12)); for (let n = 0; n < 6; n++) addProp('pumpkin', FX + rr(-10, 12), FZ + rr(-10, 8)); for (let u = -10; u <= 12; u += 2) addProp('fence', FX + u, FZ + 11, 0);
  for (let n = 0; n < 7; n++) chickHomes.push({ x:FX + rr(-10, 12), z:FZ + rr(-9, 8) }); for (let n = 0; n < 3; n++) cowHomes.push({ x:FX + rr(-36, -12), z:FZ + rr(-30, -6) });
  p = near(FX + 30, FZ); freePOI(p.x + p.tz*3.5, p.z - p.tx*3.5, p.x + p.tz*9, p.z - p.tx*9, Math.atan2(-p.tx, -p.tz), 'Gospodarstwo', '🌾'); mapIcons.push({ x:FX, z:FZ, ico:'🚜' });
  [[-XMAX - 130, -90, -XMAX - 75, -20], [-XMAX - 130, 80, -XMAX - 75, 150], [XMAX + 90, 80, XMAX + 160, 160], [-90, Z0 - 110, -10, Z0 - 50]].forEach(q => quad(innerP.wheat, q[0], q[1], q[2], q[3]));
  for (let n = 0; n < 10; n++) addProp('bale', rr(-88, -12), Z0 - rr(52, 108));
  COUNTRY.forEach((q, k) => { if (k % 28 === 14) addRamp(q.x, q.z, Math.atan2(q.tx, q.tz)); if (k % 16 === 5) { addProp('lamp', q.x - q.tz*8, q.z + q.tx*8, Math.atan2(q.tx, q.tz) - Math.PI/2); } });
  for (let x = BND.x0 - 4; x <= BND.x1 + 4; x += rr(6, 9)) [BND.z0 - 4, BND.z1 + 4].forEach(z => addTree(x, z + rr(-2, 2), rr(1.3, 1.9), rnd() < .5));     // szpaler na granicy
  for (let z = BND.z0 - 4; z <= BND.z1 + 4; z += rr(6, 9)) [BND.x0 - 4, BND.x1 + 4].forEach(x => addTree(x + rr(-2, 2), z, rr(1.3, 1.9), rnd() < .5));
  let nt = 0, guard = 0; while (nt < 140 && guard++ < 6000) { const x = rr(BND.x0 + 6, BND.x1 - 6), z = rr(BND.z0 + 6, BND.z1 - 6);
    if ((x > X0 - 16 && x < XMAX + 16 && z > Z0 - 16 && z < ZMAX + 16) || onRoad(x, z) || nearRail(x, z, 7) || Math.hypot((x - LAKE.x)/(LAKE.rx + 6), (z - LAKE.z)/(LAKE.rz + 6)) < 1) continue;
    if (Math.abs(x - stX(3)) < 16 && z > ZMAX) continue; if (COUNTRY.some(q => Math.abs(q.x - x) < 11 && Math.abs(q.z - z) < 11) || solids.some(s => x > s.x0 - 4 && x < s.x1 + 4 && z > s.z0 - 4 && z < s.z1 + 4)) continue;
    if (innerInWheat(x, z)) continue; addTree(x, z, rr(.9, 1.8), rnd() < .3); nt++; }
}
function innerInWheat(x, z) { const P = innerP.wheat; for (let k = 0; k < P.length; k += 18) if (x > P[k] - 3 && x < P[k + 6] + 3 && z > P[k + 2] - 3 && z < P[k + 5] + 3) return true; return false; }
slowZones.push({ x:LAKE.x, z:LAKE.z, r:LAKE.rz - 1, lake:1 });

flatMesh(roadP, roadMat, .03); flatMesh(walkP, walkMat, .04); flatMesh(lineP, lineMat, .055); flatMesh(curbP, lam(0xf0ebdd, PO(2)), .05); flatMesh(manP, lam(0x2f3236, PO(3)), .056); Object.keys(innerP).forEach(k => flatMesh(innerP[k], INNER[k], k === 'sand' ? .045 : k === 'top' ? .085 : .065));
{ // łan zboża: niska złota bryła nad polem
  const g = new T.Group(), P = innerP.wheat; for (let k = 0; k < P.length; k += 18) box(P[k + 6] - P[k], .55, P[k + 5] - P[k + 2], INNER.wheat, (P[k] + P[k + 6])/2, .3, (P[k + 2] + P[k + 5])/2, g); const b = bake(g); b.children.forEach(m => { m.castShadow = false; }); scene.add(b); }
const spinners = buildLandmarks(PLOTS);
cityG.forEach(g => scene.add(bake(g))); scene.add(bake(outG));

{ // kwiaty na trawnikach
  const pts = []; blocks.forEach(B => { if (['houses', 'villas', 'pond', 'forest', 'bloki'].includes(B.type)) for (let n = 0; n < 38; n++) pts.push([B.cx + rr(-20, 20), B.cz + rr(-20, 20)]); });
  for (let n = 0; n < 260; n++) pts.push([rr(X0 - 60, XMAX + 60), rr(Z0 - 60, ZMAX + 50)]);
  const ok = pts.filter(p => !onRoad(p[0], p[1]) && (p[0] < X0 - 8 || p[0] > XMAX + 8 || p[1] < Z0 - 8 || p[1] > ZMAX + 8 || blocks.some(B => p[0] > B.x0 + 3 && p[0] < B.x1 - 3 && p[1] > B.z0 + 3 && p[1] < B.z1 - 3)));
  const fl = new T.InstancedMesh(new T.SphereGeometry(.11, 6, 4), lam(0xffffff), Math.max(1, ok.length)), d = new T.Object3D(), c = new T.Color();
  ok.forEach((p, i) => { d.position.set(p[0], rr(.14, .3), p[1]); d.scale.set(1, .6, 1); d.updateMatrix(); fl.setMatrixAt(i, d.matrix); const k = rnd(); c.setHex(k < .4 ? 0xe5332a : k < .65 ? 0x3d63d8 : k < .85 ? 0xf6f1e3 : 0xf5c41f); fl.setColorAt(i, c); }); fl.frustumCulled = false; scene.add(fl); }
/* ---------- skocznie ---------- */
{ const s = new T.Shape(); s.moveTo(-7, 0); s.lineTo(7, 0); s.lineTo(0, 2.3); s.lineTo(-7, 0);
  const geo = new T.ExtrudeGeometry(s, { depth:4.6, bevelEnabled:false }); geo.translate(0, 0, -2.3); geo.rotateY(Math.PI/2);
  const mat = lam(0xffffff, { map:tex(64, 64, (g, w, h) => { g.fillStyle = '#f5c41f'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1c1e'; for (let k = -2; k < 6; k++) { g.beginPath(); g.moveTo(k*16, 0); g.lineTo(k*16 + 8, 0); g.lineTo(k*16 + 40, h); g.lineTo(k*16 + 32, h); g.fill(); } }, .25, .25) });
  const im = new T.InstancedMesh(geo, mat, ramps.length), d = new T.Object3D(); ramps.forEach((r, k) => { d.position.set(r.x, .02, r.z); d.rotation.y = r.h; d.updateMatrix(); im.setMatrixAt(k, d.matrix); });
  im.castShadow = im.receiveShadow = true; im.frustumCulled = false; scene.add(im); }
function groundH(x, z) {
  let h = 0; for (let k = 0; k < ramps.length; k++) { const r = ramps[k], dx = x - r.x, dz = z - r.z; if (Math.abs(dx) > 8 || Math.abs(dz) > 8) continue;
    const al = dx*r.fx + dz*r.fz, la = Math.abs(dz*r.fx - dx*r.fz); if (la < r.w/2 && Math.abs(al) < r.L) h = Math.max(h, r.H*(1 - Math.abs(al)/r.L)); } return h;
}

/* ---------- drzewa ---------- */
{ const N = treesAt.length, trunks = new T.InstancedMesh(new T.CylinderGeometry(.26, .42, 3, 6), lam(0x6d4b2c), N), crowns = new T.InstancedMesh(new T.IcosahedronGeometry(2, 1), lam(0xffffff), N*3),
    firs = new T.InstancedMesh(new T.ConeGeometry(2, 3, 7), lam(0xffffff), N*3), d = new T.Object3D(), c = new T.Color(); let nc = 0, nf = 0;
  treesAt.forEach((t, n) => { const x = t.x, z = t.z, s = t.s, fir = t.fir;
    d.rotation.set(0, 0, 0); d.position.set(x, 1.5*s, z); d.scale.set(s*(fir ? .7 : 1), s, s*(fir ? .7 : 1)); d.updateMatrix(); trunks.setMatrixAt(n, d.matrix);
    if (fir) for (let k = 0; k < 3; k++) { d.position.set(x, (2.6 + k*1.7)*s, z); const q = s*(1.15 - k*.3); d.scale.set(q, s*1.05, q); d.rotation.set(0, rnd()*6, 0); d.updateMatrix(); firs.setMatrixAt(nf, d.matrix); c.setHSL(rr(.36, .4), rr(.4, .5), rr(.17, .24)); firs.setColorAt(nf++, c); }
    else { const hue = rr(.25, .34), lt = rr(.24, .33); for (let k = 0; k < 3; k++) { const a = k*2.1 + rnd(), o = k ? 1.05*s : 0;
      d.position.set(x + Math.sin(a)*o, (4.3 + (k ? rr(-.5, .5) : .9))*s, z + Math.cos(a)*o); d.scale.set(s*rr(.8, 1.05), s*rr(.75, 1), s*rr(.8, 1.05)); d.rotation.set(rnd(), rnd()*6, 0); d.updateMatrix();
      crowns.setMatrixAt(nc, d.matrix); c.setHSL(hue + rr(-.015, .015), rr(.45, .6), lt + rr(-.03, .03)); crowns.setColorAt(nc++, c); } } });
  crowns.count = nc; firs.count = nf; [trunks, crowns, firs].forEach(m => { m.castShadow = true; m.frustumCulled = false; scene.add(m); }); }

/* =====================================================================
   REKWIZYTY DO PRZEWRACANIA: pachołki, latarnie, bele, stragany…
   ===================================================================== */
function bakeVC(src, cy) {                         // jedna siatka z kolorami w wierzchołkach (do InstancedMesh)
  src.updateMatrixWorld(true); const P = [], N = [], C = [], n3 = new T.Matrix3(), v = new T.Vector3();
  src.traverse(o => { if (!o.isMesh) return; const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, p = g.attributes.position, nn = g.attributes.normal, col = o.material.color; n3.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); P.push(v.x, v.y - cy, v.z); v.fromBufferAttribute(nn, i).applyMatrix3(n3).normalize(); N.push(v.x, v.y, v.z); C.push(col.r, col.g, col.b); } });
  const G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); G.setAttribute('color', new T.Float32BufferAttribute(C, 3)); return G;
}
const K = c => ({ color:new T.Color(c) }), PT = {}, propMat = lam(0xffffff, { vertexColors:true });
function defProp(name, h, r, m, lay, fx, build) { const g = new T.Group(); build(g); PT[name] = { name, geo:bakeVC(g, h/2), h, r, m, lay, fx, list:[] }; }
{ const OR = K(0xf2701f), WH = K(0xf7f4ea), DK = K(0x2e3034), ST = K(0x8f989f), WD = K(0xa9763f), WDD = K(0x7d5a36), RD = K(0xd8301f), GR = K(0x2f7a45), BLU = K(0x2f6fd0), YL = K(0xf5c41f), STR = K(0xe0b84a), STRD = K(0xb58a2a);
  defProp('cone', .75, .45, .01, .2, 0, g => { cone(.26, .04, .7, OR, 0, .4, 0, g, 10); box(.6, .06, .6, OR, 0, .03, 0, g); cone(.185, .14, .14, WH, 0, .43, 0, g, 10); });
  defProp('bin', 1, .5, .03, .3, 0, g => { cylY(.3, .9, GR, 0, .5, 0, g, 10); cylY(.33, .08, DK, 0, .98, 0, g, 10); });
  defProp('sign', 2.9, .4, .03, .1, 0, g => { cylY(.05, 2.4, ST, 0, 1.2, 0, g, 6); cylZ(.42, .06, BLU, 0, 2.5, 0, g, 16); box(.12, .5, .08, WH, 0, 2.5, 0, g); box(.36, .12, .08, WH, 0, 2.62, 0, g); });
  defProp('signT', 2.9, .4, .03, .1, 0, g => { cylY(.05, 2.4, ST, 0, 1.2, 0, g, 6); const t = cylZ(.5, .06, RD, 0, 2.45, 0, g, 3); t.rotation.z = Math.PI/2; const u = cylZ(.3, .08, YL, 0, 2.45, 0, g, 3); u.rotation.z = Math.PI/2; });
  defProp('lamp', 5.3, .45, .09, .12, 0, g => { cone(.11, .07, 5.2, DK, 0, 2.6, 0, g, 8); box(.08, .08, 1.7, DK, 0, 5.15, .8, g); box(.32, .12, .62, K(0xfff3b0), 0, 5.06, 1.4, g); cylY(.16, .3, DK, 0, .15, 0, g, 8); });
  defProp('bale', 1.6, 1.0, .07, .8, 1, g => { cylX(.8, 1.2, STR, 0, .8, 0, g, 14); [-.35, .35].forEach(x => cylX(.81, .07, STRD, x, .8, 0, g, 14)); });
  defProp('crate', .55, .55, .02, .2, 2, g => { box(.72, .4, .5, WD, 0, .2, 0, g); for (let i = 0; i < 6; i++) ell(.1, .1, .1, i % 3 ? RD : K(0x8fc23a), -.24 + (i % 3)*.24, .44, -.1 + ((i/3) | 0)*.22, g, 6); });
  defProp('stall', 2.3, 1.5, .1, .5, 2, g => { [[-1.1, -.8], [1.1, -.8], [-1.1, .8], [1.1, .8]].forEach(q => cylY(.04, 2.1, WDD, q[0], 1.05, q[1], g, 5)); box(2.3, .1, 1.5, WD, 0, .9, 0, g);
    for (let i = 0; i < 6; i++) box(.44, .1, 2, i % 2 ? WH : RD, -1.1 + i*.44, 2.15, 0, g); for (let i = 0; i < 8; i++) ell(.16, .16, .16, [RD, YL, OR, K(0x8fc23a)][i % 4], -.8 + (i % 4)*.5, 1.08, -.3 + ((i/4) | 0)*.6, g, 6); });
  defProp('bench', 1, .9, .04, .25, 0, g => { box(1.8, .08, .5, WD, 0, .5, 0, g); box(1.8, .45, .07, WD, 0, .82, -.22, g); [-.75, .75].forEach(x => box(.08, .5, .45, DK, x, .25, 0, g)); });
  defProp('hydrant', .75, .4, .03, .15, 3, g => { cylY(.14, .6, RD, 0, .3, 0, g, 10); ell(.15, .12, .15, RD, 0, .62, 0, g, 8); cylX(.07, .44, RD, 0, .4, 0, g, 8); cylY(.19, .06, RD, 0, .03, 0, g, 10); });
  defProp('fence', 1, 1.0, .015, .1, 0, g => { [.35, .75].forEach(y => box(1.95, .09, .05, WH, 0, y, 0, g)); for (let i = 0; i < 6; i++) box(.13, .95, .04, WH, -.8 + i*.32, .5, .04, g); });
  defProp('scarecrow', 2.3, .6, .03, .2, 1, g => { cylY(.05, 2.2, WDD, 0, 1.1, 0, g, 6); box(1.7, .08, .08, WDD, 0, 1.55, 0, g); box(.62, .7, .3, K(0xc8382c), 0, 1.3, 0, g); ell(.22, .22, .22, STR, 0, 1.92, 0, g, 8); cone(.36, .05, .3, DK, 0, 2.2, 0, g, 10); cylY(.36, .03, DK, 0, 2.06, 0, g, 10); });
  defProp('barrel', 1, .5, .05, .36, 0, g => { cylY(.36, 1, BLU, 0, .5, 0, g, 12); [.2, .8].forEach(y => cylY(.375, .06, DK, 0, y, 0, g, 12)); });
  defProp('pumpkin', .6, .45, .01, .28, 0, g => { ell(.36, .28, .36, OR, 0, .28, 0, g, 10); cylY(.04, .14, GR, 0, .58, 0, g, 5); });
  defProp('tlight', 3.9, .45, .06, .14, 0, g => { cylY(.07, 3.2, DK, 0, 1.6, 0, g, 6); box(.36, .95, .3, DK, 0, 3.4, 0, g); [[RD, 3.7], [YL, 3.4], [K(0x35d04a), 3.1]].forEach(q => ell(.11, .11, .06, q[0], 0, q[1], .16, g, 8)); box(.44, .06, .4, DK, 0, 3.9, 0, g); });
  defProp('planter', .9, .7, .03, .25, 2, g => { box(1.3, .45, .6, WDD, 0, .22, 0, g); ell(.6, .28, .28, GR, 0, .55, 0, g, 8); [RD, YL, K(0xe86aa8), WH, RD].forEach((c, i) => ell(.09, .09, .09, c, -.44 + i*.22, .78, (i % 2)*.14 - .07, g, 6)); });
  defProp('mailbox', 1.3, .4, .02, .2, 0, g => { cylY(.05, .8, DK, 0, .4, 0, g, 6); box(.42, .5, .34, RD, 0, 1.03, 0, g); box(.3, .05, .02, YL, 0, 1.12, .18, g); });
  [0xd8452f, 0x2f7fd8, 0x9aa3ad].forEach((c, k) => { const g = aiModel(c, k); PT['pcar' + k] = { name:'pcar', geo:bakeVC(g, .75), h:1.5, r:1.9, m:.2, lay:.75, fx:0, list:[] }; });
  defProp('trzepak', 2, 1.1, .05, .1, 0, g => { [-1.1, 1.1].forEach(x => cylY(.045, 2, ST, x, 1, 0, g, 6)); [2, 1.2].forEach(y => cylX(.045, 2.2, ST, 0, y, 0, g, 6)); });
}
const props = [], pdum = new T.Object3D(), fountains = [];
const vc = g => { const m = new T.Mesh(bakeVC(g, 0), propMat); m.castShadow = true; return m; };       // cała bryła jako jedna siatka: mniej rysowań
function setProp(p) { pdum.position.set(p.x, p.y, p.z); pdum.rotation.set(p.ex, p.ey, p.ez); pdum.updateMatrix(); p.d.im.setMatrixAt(p.i, pdum.matrix); p.d.im.instanceMatrix.needsUpdate = true; }
propsAt.forEach(q => { if (!onRoad(q.x, q.z) || q.type === 'cone') PT[q.type].list.push(q); });
Object.keys(PT).forEach(name => { const d = PT[name]; if (!d.list.length) return; d.im = new T.InstancedMesh(d.geo, propMat, d.list.length); d.im.castShadow = true; d.im.frustumCulled = false; scene.add(d.im);
  d.list.forEach((q, i) => { const p = { d, i, hx:q.x, hz:q.z, hr:q.ry, x:q.x, y:d.h/2, z:q.z, ex:0, ey:q.ry, ez:0, vx:0, vy:0, vz:0, wx:0, wy:0, wz:0, st:0, t:0 }; props.push(p); setProp(p); }); });

/* =====================================================================
   LUDZIE I ZWIERZĘTA: przechodnie odskakują, kury uciekają, krowy się nie spieszą
   ===================================================================== */

const PEDC = [0xd8452f, 0x2f7fd8, 0xf2b632, 0x3f9a4a, 0x8e4fc2], PEDN = 35, peds = [];
{ const ims = PEDC.map(c => { const im = new T.InstancedMesh(bakeVC(pedGroup(K(c), K(0xf1c7a0), K(0x1f2c44), K([0x4a3524, 0x1c1c1e, 0xc9953c, 0x7a2f1c, 0x8a8a8a][PEDC.indexOf(c)])), 0), propMat, PEDN/5); im.castShadow = true; im.frustumCulled = false; scene.add(im); return im; });
  for (let k = 0; k < PEDN; k++) { const p = pedPaths[(rnd()*pedPaths.length) | 0]; peds.push({ im:ims[k % 5], i:(k/5) | 0, p, t:rnd(), dir:rnd() < .5 ? 1 : -1, sp:rr(1, 1.9), j:0, x:0, z:0, len:Math.hypot(p.bx - p.ax, p.bz - p.az) }); } }
for (let n = 0; n < 9; n++) { const p = pedPaths[(rnd()*pedPaths.length) | 0], t = rnd(); chickHomes.push({ x:p.ax + (p.bx - p.ax)*t, z:p.az + (p.bz - p.az)*t }); }       // kury spacerują też po mieście
const chicks = chickHomes.slice(0, 44).map(h => ({ hx:h.x, hz:h.z, x:h.x, z:h.z, y:0, vy:0, h:rnd()*6.28, tx:h.x, tz:h.z, st:0, t:rnd()*3, spin:0 }));
const chickIM = (() => { const g = new T.Group(), W = K(0xfaf8f0), R = K(0xd8301f), O = K(0xf29a1f); ell(.2, .2, .28, W, 0, .36, 0, g, 8); ell(.11, .12, .11, W, 0, .6, .2, g, 8); box(.04, .1, .12, R, 0, .73, .2, g);
  const b = cone(.04, .005, .12, O, 0, .6, .34, g, 5); b.rotation.x = Math.PI/2; const t = box(.05, .22, .16, W, 0, .5, -.27, g); t.rotation.x = -.5; [-.07, .07].forEach(x => cylY(.02, .2, O, x, .1, 0, g, 4));
  const im = new T.InstancedMesh(bakeVC(g, 0), propMat, Math.max(1, chicks.length)); im.castShadow = true; im.frustumCulled = false; scene.add(im); return im; })();
const cowTpl = [makeCow(0), makeCow(1)];
const cows = cowHomes.map((h, k) => { const g = cloneTpl(cowTpl[k % 2], true); g.scale.setScalar(1.25); scene.add(g); return { g, x:h.x, z:h.z, hx:h.x, hz:h.z, tx:h.x, tz:h.z, h:rnd()*6.28, hop:0, mooT:0, away:0 }; });

/* =====================================================================
   RUCH ULICZNY: auta, autobus, kombajn i traktor na prawym pasie
   ===================================================================== */

const traffic = [];
{ const cols = [0xd8452f, 0x2f7fd8, 0xf4f4f0, 0x3f9a4a, 0x8e4fc2, 0x20b2aa, 0xff8a3d, 0x9aa3ad, 0x2f7fd8, 0xf4f4f0, 0xd8452f, 0x25262b, 0xf5c41f];
  cols.forEach((c, n) => traffic.push({ g:vc(aiModel(c, n % 3)), R:1.8, vmax:rr(8, 12) })); traffic.push({ g:vc(aiModel(0xd8452f, 3)), R:3, vmax:8 }); traffic.push({ g:buildKombajn(), R:3.3, vmax:4.5, wide:1 });
  const tr = buildTractor(), trm = vc(tr.g); scene.remove(tr.g); traffic.push({ g:trm, R:2.1, vmax:6 });
  traffic.forEach(c => { scene.add(c.g); Object.assign(c, { v:0, x:0, z:0, h:0, hx:0, hz:1, lane:5.25, mode:0, a:null, b:null, fx:0, fz:1, turn:null, spin:0, honk:0 }); trafStart(c); }); }
function trafStart(c) {
  for (;;) { const i = (Math.random()*(NX + 1)) | 0, j = (Math.random()*(NZ + 1)) | 0, nb = nbrs(i, j); if (!nb.length) continue; c.a = [i, j]; c.b = nb[(Math.random()*nb.length) | 0]; break; }
  c.fx = c.b[0] - c.a[0]; c.fz = c.b[1] - c.a[1]; c.hx = c.fx; c.hz = c.fz; c.h = Math.atan2(c.fx, c.fz); const t = RW + (PITCH - 2*RW)*(.2 + Math.random()*.6);
  c.x = stX(c.a[0]) + c.fx*t - c.fz*c.lane; c.z = stZ(c.a[1]) + c.fz*t + c.fx*c.lane; c.mode = 0; c.v = c.vmax;
}
function trafNext(c) {
  const B = c.b, opts = nbrs(B[0], B[1]).filter(n => n[0] !== c.a[0] || n[1] !== c.a[1]); let nx = opts.length ? opts[(Math.random()*opts.length) | 0] : c.a;
  const st = opts.find(n => n[0] - B[0] === c.fx && n[1] - B[1] === c.fz); if (st && Math.random() < .5) nx = st;
  if (c.smart && opts.length > 1) { let bd = -1; opts.forEach(o => { const d = Math.hypot(stX(o[0]) - pc.x, stZ(o[1]) - pc.z); if (d > bd) { bd = d; nx = o; } }); }      // sprytny uciekinier skręca tam, gdzie dalej od gracza
  const f2x = nx[0] - B[0], f2z = nx[1] - B[1], bx = stX(B[0]), bz = stZ(B[1]), L = c.lane, p0 = { x:c.x, z:c.z }, p2 = { x:bx + f2x*RW - f2z*L, z:bz + f2z*RW + f2x*L };
  const q = (f2x === c.fx && f2z === c.fz) ? { x:(p0.x + p2.x)/2, z:(p0.z + p2.z)/2 } : (f2x === -c.fx && f2z === -c.fz) ? { x:bx + c.fx*RW, z:bz + c.fz*RW } : { x:bx - c.fz*L - f2z*L, z:bz + c.fx*L + f2x*L };
  c.turn = { p0, q, p2, t:0, len:Math.hypot(q.x - p0.x, q.z - p0.z) + Math.hypot(p2.x - q.x, p2.z - q.z) }; c.a = B; c.b = nx; c.fx = f2x; c.fz = f2z; c.mode = 1;
}

/* =====================================================================
   POCIĄG: jeździ sam po pętli, a po przesiadce prowadzi go gracz
   ===================================================================== */
Object.assign(TRAINS.steamP, { vmax:22, acc:4.5 }); Object.assign(TRAINS.euP, { vmax:26, acc:5.2 }); Object.assign(TRAINS.pend, { vmax:34, acc:6.5 });
setConsist(['steamP', 'euP', 'pend'][(Math.random()*3) | 0]);
const TSTOPS = [{ name:'Ciuchciowo', ico:'🚉', d:railD(stX(1) + PITCH/2, ZR), wait:3 }, { name:'Bocianowo', ico:'🚉', d:railD(stX(4) + PITCH/2, ZR), wait:4 }, { name:'Zoo', ico:'🦒', d:railD(stX(3), RAIL.ZS), wait:2 }].concat(HALTS.map(h => ({ name:h.name, ico:h.ico, d:railD(h.x, h.z), wait:2 })));
let tPos = TSTOPS[0].d + 20, tV = 0, tOdo = 0, tHold = 6, tLeave = 0, tOnboard = 0, tSvc = 0, chuffAcc = 0, chuffN = 0, idleT = 0;
const sA = {}, sB = {};
function placeTrain() {
  for (let n = 0; n < cars.length; n++) { const c = cars[n]; railAt(tPos - c.off, sA); railAt(tPos - c.off - c.wb, sB);
    c.x = (sA.x + sB.x)/2; c.z = (sA.z + sB.z)/2; c.h = Math.atan2(sA.x - sB.x, sA.z - sB.z); c.g.position.set(c.x, 0, c.z); c.g.rotation.y = c.h; c.steer = wrap(Math.atan2(sA.tx, sA.tz) - c.h);
    for (let k = 0; k < c.wheels.length; k++) { const w = c.wheels[k]; w.w.rotation.x = tOdo/w.r + w.ph; }
    if (TR.kind === 'pend') { c.tilt += (-c.steer*.5*Math.min(1, Math.abs(tV)/8) - c.tilt)*.12; c.inner.rotation.z = c.tilt; } }
  if (TR.kind !== 'steam') return; const th = tOdo/R_DRV;
  steam.rods.forEach(o => { const a = th + o.ph, py = AXLE_Y + CRANK*Math.cos(a), pz = CRANK*Math.sin(a); o.cpl.position.y = py; o.cpl.position.z = .15 + pz;
    const zp = .15 + pz, dy = py - AXLE_Y, zc = zp + Math.sqrt(ROD_L*ROD_L - dy*dy); o.main.position.y = (py + AXLE_Y)/2; o.main.position.z = (zp + zc)/2; o.main.rotation.x = Math.asin(dy/ROD_L); o.head.position.z = zc; o.pist.position.z = zc + .5; });
}
const stopDist = s => (((s.d + TRAIN_L/2 - tPos) % RAIL.L) + RAIL.L) % RAIL.L;
let tNext = TSTOPS[0], tAt = null;
function trainStep(dt) {
  const mine = S.veh === 'train'; let nd = 1e9; tAt = null; TSTOPS.forEach(s => { const d = stopDist(s); if (d < nd) { nd = d; tNext = s; } if (d < 6 || d > RAIL.L - 6) tAt = s; });
  if (mine) { const want = keys.fwd ? 1 : keys.back ? -1 : 0, brk = a => { tV -= Math.sign(tV)*Math.min(Math.abs(tV), a*dt); };
    if (!want) { if (tV > 0 && nd < 90) { const vt = Math.sqrt(9*Math.max(0, nd - .5)); if (tV > vt) tV = Math.max(vt, tV - 14*dt); else brk(nd < 1.5 ? 13 : .8); } else brk(tAt ? 13 : 5.5); } else if (tV*want < -.05) brk(9); else tV = want > 0 ? Math.min(VMAX, tV + TR.acc*dt) : Math.max(-VREV, tV - 2.6*dt);
    if (!tAt) tSvc = 0; if (tAt && Math.abs(tV) < .4 && tSvc !== tAt) { tSvc = tAt; const out = tOnboard, inn = tAt.wait; tOnboard = inn; tAt.wait = 2 + ((Math.random()*4) | 0);
      if (out) { addScore(out); sfx.star(); bigText('+' + out + ' ⭐'); } sfx.pop(3); toast(tAt.ico + ' ' + tAt.name + ': wysiada ' + out + ', wsiada ' + inn + ' 🧍'); }
  } else { let tg = 14; tLeave -= dt; if (tHold > 0) { tHold -= dt; tg = 0; if (tHold <= 0) tLeave = 9; } else if (tLeave <= 0) { if (nd < 60) tg = Math.max(1.2, Math.min(14, nd*.25)); if (nd < 1.3) tHold = 5; }
    tV += clamp(tg - tV, -6*dt, 2.4*dt); }
  tPos += tV*dt; tOdo += tV*dt; placeTrain();
  const sp = Math.abs(tV), nearCam = Math.hypot(lead.x - camera.position.x, lead.z - camera.position.z) < 140;
  if (TR.kind === 'steam' && nearCam) { steam.g.updateMatrixWorld(); steam.inner.localToWorld(tmpV.copy(steam.chim));
    if (sp > .2) { chuffAcc += sp*dt; if (chuffAcc > 2*Math.PI*R_DRV/4) { chuffAcc = 0; chuffN++; puff(tmpV.x, tmpV.y, tmpV.z, rr(-.4, .4), 4.4, rr(-.4, .4), 2, 1.5, .88, mine && S.cam === 2 ? .3 : 1); if (mine) sfx.chuff(chuffN % 4 === 0, .4*(1 - sp/VMAX*.35)); } }
    else { idleT += dt; if (idleT > 1.3) { idleT = 0; puff(tmpV.x, tmpV.y, tmpV.z, rr(-.2, .2), 2.2, rr(-.2, .2), 2.2, .9, .95); } } }
}

/* ---------- przejazdy kolejowe: szlabany, światła, dzwonek ---------- */
const xings = [];
{ const st = new T.Group(), deckM = lam(0x4a4d52), redOn = new T.MeshBasicMaterial({ color:0xff2a1a }), wm = lam(0xf4f4f0), rm = lam(0xd8301f);
  for (let i = 0; i <= NX; i++) { const x = stX(i), o = { x, closed:false, k:1, arms:[], lights:[] }; box(14, .3, 3.4, deckM, x, .21, ZR, st);
    [[-1, -1], [1, 1]].forEach(q => { const px = x + q[0]*(RW + .7), pz = ZR + q[1]*5.2; box(.3, 1.3, .3, wm, px, .65, pz, st); cylY(.06, 3.4, M.steel, px, 1.7, pz + q[1]*.6, st, 6);
      [-.5, .5].forEach(a => { const b = box(1.5, .2, .06, wm, px, 3.1, pz + q[1]*.6, st); b.rotation.z = a; }); box(.9, .4, .1, M.dark, px, 2.3, pz + q[1]*.6, st);
      [-.25, .25].forEach((a, n) => { const l = mesh(new T.SphereGeometry(.15, 8, 6), redOn, px + a, 2.3, pz + q[1]*.6 - q[1]*.08, scene); l.visible = false; o.lights.push(l); });
      const piv = new T.Group(), ag = new T.Group(); piv.position.set(px, 1.15, pz); for (let n = 0; n < 5; n++) box(1.5, .14, .14, n % 2 ? wm : rm, -q[0]*(.75 + n*1.5), 0, 0, ag); piv.add(vc(ag)); scene.add(piv); o.arms.push({ piv, s:-q[0] }); });
    xings.push(o); }
  scene.add(bake(st)); }
let bellT = 0;
function crossingsStep(dt) {
  let mn = 1e9, mx = -1e9; cars.forEach(c => { if (Math.abs(c.z - ZR) < 3) { mn = Math.min(mn, c.x); mx = Math.max(mx, c.x); } });
  const P = S.veh === 'train' ? lead : pc; let ring = false;
  xings.forEach(o => { o.closed = o.x > mn - 42 && o.x < mx + 42; o.k += ((o.closed ? 0 : 1) - o.k)*Math.min(1, dt*2.2); o.arms.forEach(a => { a.piv.rotation.z = a.s*o.k*1.35; });
    const on = o.closed && (time*2.5 % 1) < .5; o.lights.forEach((l, n) => { l.visible = o.closed && (n % 2 ? on : !on); }); if (o.closed && Math.abs(P.x - o.x) + Math.abs(P.z - ZR) < 70) ring = true; });
  if (ring) { bellT -= dt; if (bellT <= 0) { bellT = .42; tone(880, .2, 'triangle', .12); tone(1320, .12, 'sine', .06); } }
}

/* =====================================================================
   STEROWANIE
   ===================================================================== */
const keys = { fwd:0, back:0, left:0, right:0 };

holdBtn('cGo', 'fwd'); holdBtn('cBk', 'back');
const JOY = { on:false, id:-1, x:0, y:0, st:0, fwd:0, back:false, idle:0 };          // joystick: w bok skręca (i trochę dodaje gazu), w górę gaz, w dół hamulec i wsteczny
{ const j = $('joy'), k = $('joyK'), ar = { u:j.querySelector('.u'), d:j.querySelector('.d'), l:j.querySelector('.l'), r:j.querySelector('.r') };
  const set = e => { const b = j.getBoundingClientRect(), R = b.width/2; let x = (e.clientX - b.left - R)/(R*.62), y = (e.clientY - b.top - R)/(R*.62); const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    JOY.x = x; JOY.y = y; k.style.transform = `translate(${x*62}%, ${y*62}%)`;
    const dz = v => Math.abs(v) < .2 ? 0 : (Math.abs(v) - .2)/.8*Math.sign(v);
    JOY.st = -dz(x); JOY.fwd = Math.max(0, -dz(y)); JOY.back = y > .45;
    ar.u.classList.toggle('on', JOY.fwd > 0); ar.d.classList.toggle('on', JOY.back); ar.l.classList.toggle('on', JOY.st > 0); ar.r.classList.toggle('on', JOY.st < 0); };
  const end = e => { if (e.pointerId !== JOY.id) return; JOY.on = false; JOY.id = -1; JOY.x = JOY.y = JOY.st = JOY.fwd = 0; JOY.back = false; JOY.idle = 0; k.style.transform = ''; Object.values(ar).forEach(a => a.classList.remove('on')); };
  j.addEventListener('pointerdown', e => { e.preventDefault(); try { j.setPointerCapture(e.pointerId); } catch (_) {} JOY.on = true; JOY.id = e.pointerId; j.classList.remove('hint'); initAudio(); set(e); });
  j.addEventListener('pointermove', e => { if (JOY.on && e.pointerId === JOY.id) set(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => j.addEventListener(ev, end)); }
/* sterowanie złożone z joysticka, przycisków i klawiatury. Sam skręt dodaje trochę gazu (STEER_GAS), żeby auto nie stało w miejscu i nie utykało
   przy ścianie: dziecko, które tylko skręca, i tak pojedzie. Przy pasażerze (nearStop) bez dodatkowego gazu, żeby dało się zatrzymać w kole. */
const STEER_GAS = .5, IN = { st:0, fwd:0, back:false, gas:0 };
/* przechylanie telefonu (lib/przechylanie.taxi-zniwa-rafa.js, jak w Żniwach): w bok skręca, od siebie gaz, do siebie hamulec; włącza się tylko w menu.
   Krzywa: drobne drgania rąk nic nie robią, średni przechył to już pełny skręt (tilt.x = 1 przy 17°). */
const TILT_DEAD = .25, TILT_FULL = .8;
const tilt = { on:false, x:0, y:0, cal:true, r0:0, f0:0, events:0, listening:false };
function onTilt(e) { tiltFromEvent(e, 17); }
addEventListener('orientationchange', () => { tilt.cal = true; });
function readInput(dt) {
  let tx = 0, ty = 0; if (tilt.on) { tx = tiltCurve(tilt.x, TILT_DEAD, TILT_FULL); ty = tiltCurve(tilt.y, TILT_DEAD + .05, TILT_FULL); }      // ~4° nic, ~14° pełny skręt
  IN.st = clamp((keys.left ? 1 : 0) - (keys.right ? 1 : 0) + JOY.st - tx, -1, 1); IN.back = !!keys.back || JOY.back || ty < -.5; IN.fwd = Math.max(keys.fwd ? 1 : 0, JOY.fwd, ty);
  IN.gas = IN.back ? 0 : Math.max(IN.fwd, nearStop ? 0 : STEER_GAS*Math.abs(IN.st));
  if (JOY.on || IN.gas || IN.back || tilt.on) JOY.idle = 0; else if ((JOY.idle += dt) > 7) $('joy').classList.add('hint');     // nikt nie steruje: kółko znów pokazuje, co robić
}
const KEYMAP = { ArrowUp:'fwd', w:'fwd', ArrowDown:'back', s:'back', ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right' };
addEventListener('keydown', e => { const k = KEYMAP[e.key]; if (k) { keys[k] = 1; e.preventDefault(); }
  else if (S.running && !e.repeat) { if (e.key === ' ') { e.preventDefault(); hornOn(); } else if (e.key === 'c') nextCam(); else if (e.key === 'x' || e.key === 'Shift') turbo(); else if (e.key === 'v') togglePick(); else if (e.key === 'm') toggleMap(); } });
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = 0; else if (e.key === ' ') hornOff(); });
addEventListener('blur', () => { keys.fwd = keys.back = keys.left = keys.right = 0; });
document.addEventListener('touchmove', e => { if (S.running) e.preventDefault(); }, { passive:false });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

/* =====================================================================
   JAZDA: gaz, poślizg, skoki, turbo, zderzenia
   ===================================================================== */

AUTOS.police = { car:buildPolice(), vmax:30, acc:11, off:.7, turn:1, R:2, grip:9.5, jobs:1, ico:'🚓', name:'Radiowóz', sub:'łap poszukiwanych 🚨' };
AUTOS.plane = { car:buildPlane(), vmax:34, acc:9, off:1, turn:1, R:2.4, grip:9, jobs:1, ico:'🛩️', name:'Samolot', sub:'ląduje po pasażera' };
let sirenOn = false;
Object.assign(AUTOS.taxi, { vmax:27, acc:10, off:.72, grip:9 }); Object.assign(AUTOS.race, { vmax:40, acc:15, off:.55, grip:10, jobs:1, sub:'najszybsza ⚡' });
Object.assign(AUTOS.bus, { vmax:20, acc:6.5, off:.6, grip:10, sub:'3 pasażerów 🧍🧍🧍' }); Object.assign(AUTOS.ursus, { vmax:14, acc:7, off:1, grip:14, jobs:1, sub:'wszędzie 🌾' });
Object.keys(AUTOS).forEach(k => Object.assign(AUTOS[k].car, { vx:0, vz:0, y:0, vy:0, air:false, tilt:0, pitch:0 }));
let stuckT = 0, unstuckT = 0, unstuckS = 1;
let AK = 'taxi', AV = AUTOS.taxi, pc = AV.car, offK = 0, bumpT = -9, turboT = 0, turboCD = 0, airT = 0, driftT = 0, shake = 0, hornT = 0, nearStop = false, splashT = 0, leafT = 0;
let score = 0, chaos = 0, chaosStar = 0;
function addScore(n) { score += n; $('score').textContent = score; if (n) { GAR.bank += n; save(); } }
function chaosAdd(n) { chaos += n; $('chaos').textContent = chaos; if (chaos - chaosStar >= 12) { chaosStar = chaos; addScore(1); toast(['Demolka! +1 ⭐', 'Łubudu! +1 ⭐', 'Ale bałagan! +1 ⭐', 'Totalna rozróba! +1 ⭐'][(Math.random()*4) | 0]); sfx.star(); } }
let toastT = 0, bigT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function bigText(msg) { const b = $('big'); b.textContent = msg; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
sfx.crash = v => { burst(900, .22, .3*v, 0, .6); burst(240, .3, .4*v, 0, .8, 'lowpass'); tone(110, .22, 'sine', .35*v, 50); };
sfx.cluck = () => { [0, .09, .2].forEach((d, i) => tone(820 + i*140 + Math.random()*80, .07, 'square', .07, 500, d)); };
sfx.boing = () => tone(180, .35, 'sine', .3, 620);
sfx.cash = () => { [1319, 1568, 2093].forEach((f, i) => tone(f, .16, 'triangle', .2, 0, i*.07)); };
sfx.splash = () => burst(1200, .4, .3, 0, .5);
sfx.oj = () => tone(700 + Math.random()*200, .12, 'triangle', .12, 1100);
sfx.trumpet = () => { tone(330, .5, 'sawtooth', .16, 660); tone(660, .45, 'sawtooth', .12, 440, .45); tone(335, .5, 'square', .05, 665); };
sfx.roar = () => { tone(110, .9, 'sawtooth', .22, 55); burst(260, .9, .3, 0, .7, 'lowpass'); tone(73, .9, 'square', .08, 40); };
sfx.peep = () => { [0, .14, .28].forEach(d => tone(1100, .1, 'square', .07, 800, d)); };
sfx.hum = () => { tone(196, .5, 'sine', .25, 262); tone(294, .5, 'triangle', .1, 392, .1); };
/* ---------- silnik z biegami (lib/silnik.taxi.js) i klakson (lib/klaksony.ciuchcia-taxi.js) ---------- */
let EN = null, hornV = null, hornHeld = false, hornAt = 0, popFlash = 0, jx = 0, jz = 0, overTrain = false;
function initEngine() { if (!EN && AU.ctx) EN = engineCreate(); }
function engineSound(dt, vf, air, skid, tb) {
  if (!EN) return; if (engineStep(EN, dt, { kind:AK, fr:Math.abs(vf)/(AV.vmax*(tb ? 1.5 : 1)), vf, thr:IN.gas > .3 || tb, air, skid, siren:sirenOn && AK === 'police' })) popFlash = .09;
  AU.roll.gain.setTargetAtTime(air ? 0 : Math.min(.3, Math.abs(vf)/40*.3), AU.ctx.currentTime, .15);
}
function engineOff() { engineMute(EN); hornOff(); }
function hornOn() {
  initAudio(); initEngine(); hornStop(hornV); if (S.veh === 'train') { hornHeld = true; hornV = trainHornStart(TR.kind); return; }      // klaksony z biblioteki lib/klaksony.ciuchcia-taxi.js
  if (AK === 'police') { sirenOn = !sirenOn; toast(sirenOn ? '🚨 Syrena włączona: wszyscy z drogi!' : 'Syrena wyłączona'); return; }
  if (GAR.horn !== 'h0') { hornT = 1.2; if (performance.now() - hornAt > 900) { hornAt = performance.now(); melody(GAR.horn); } return; }
  hornHeld = true; hornAt = performance.now(); hornT = .7; hornV = hornStart(AK);
}
function hornOff() { if (!hornHeld) return; hornHeld = false; hornStop(hornV, S.veh === 'train' ? .5 : .26); hornV = null; }
function placePlayer() {
  const c = pc; for (let j = 1; j <= NZ; j++) for (let i = 2; i < NX; i++) if (HE[j][i] && !c.placed) { c.x = stX(i) + PITCH/2 - 14; c.z = stZ(j) + 3.5; c.h = Math.PI/2; c.placed = 1; }
  c.vx = c.vz = c.vy = 0; c.y = 0; c.air = false;
}
function collide(c) {
  let hit = 0; const r = 1.15, wall = (nx, nz) => { const vn = c.vx*nx + c.vz*nz; if (vn < 0) { c.vx -= vn*1.3*nx; c.vz -= vn*1.3*nz; hit = Math.max(hit, -vn); } };
  for (let n = 0; n < solids.length; n++) { const q = solids[n]; if (c.x > q.x0 - r && c.x < q.x1 + r && c.z > q.z0 - r && c.z < q.z1 + r && c.y < q.h - .8) {
    const a = c.x - q.x0 + r, b = q.x1 + r - c.x, e = c.z - q.z0 + r, f = q.z1 + r - c.z, m = Math.min(a, b, e, f);
    if (m === a) { c.x = q.x0 - r; wall(-1, 0); } else if (m === b) { c.x = q.x1 + r; wall(1, 0); } else if (m === e) { c.z = q.z0 - r; wall(0, -1); } else { c.z = q.z1 + r; wall(0, 1); } } }
  const push = (ox, oz, rad) => { const dx = c.x - ox, dz = c.z - oz; if (Math.abs(dx) > rad || Math.abs(dz) > rad) return false; const d = Math.hypot(dx, dz); if (d < rad && d > .001) { c.x = ox + dx/d*rad; c.z = oz + dz/d*rad; wall(dx/d, dz/d); return true; } return false; };
  if (c.y < 2.5) for (let n = 0; n < circles.length; n++) { const q = circles[n]; if (push(q.x, q.z, q.r + r) && q.tree && time - leafT > .3) { leafT = time; for (let i = 0; i < 10; i++) emit(q.x + rr(-1, 1), rr(3, 5), q.z + rr(-1, 1), rr(-2, 2), rr(0, 2), rr(-2, 2), 1.2, .3, .62, .22, 5); } }
  if (c.y < 3.4) for (let n = 0; n < cars.length; n++) { const k = cars[n], sx = Math.sin(k.h), cz = Math.cos(k.h), q = k.len*.27; push(k.x + sx*q, k.z + cz*q, 1.9 + AV.R*.6); push(k.x - sx*q, k.z - cz*q, 1.9 + AV.R*.6); }
  else if (c.air) for (let n = 0; n < cars.length; n++) if (Math.abs(cars[n].x - c.x) < 4.5 && Math.abs(cars[n].z - c.z) < 4.5) overTrain = true;
  if (c.y < 2) for (let n = 0; n < traffic.length; n++) { const q = traffic[n], sp = Math.hypot(c.vx, c.vz); if (q.off) continue; if (push(q.x, q.z, q.R + AV.R*.6)) { if (q.sus && !q.caught && q.spin <= 0 && sp > 4) { catchSus(); continue; } if (q.thief && !q.caught && sp > 4) { catchThief(); continue; } q.v = 0; if (sp > 9 && q.spin <= 0) { q.spin = 1.2; chaosAdd(2); } else if (time - q.honk > 1.5) { q.honk = time; tone(q.R > 2.5 ? 233 : 466, .35, 'square', .1); } } }
  if (c.y < 1.5) for (let n = 0; n < cows.length; n++) { const q = cows[n]; if (push(q.x, q.z, 1.5 + AV.R*.5)) { const s = Math.sign((q.x - c.x)*Math.cos(c.h) - (q.z - c.z)*Math.sin(c.h)) || 1; q.tx = q.x + Math.cos(c.h)*s*5; q.tz = q.z - Math.sin(c.h)*s*5; q.hop = .5; q.away = 12; if (time - q.mooT > 1) { q.mooT = time; sfx.moo(); chaosAdd(1); } } }
  if (c.x < BND.x0) { c.x = BND.x0; wall(1, 0); } else if (c.x > BND.x1) { c.x = BND.x1; wall(-1, 0); } if (c.z < BND.z0) { c.z = BND.z0; wall(0, 1); } else if (c.z > BND.z1) { c.z = BND.z1; wall(0, -1); }
  return hit;
}
function driveCar(dt) {
  const A = AV, c = pc, st = IN.st; turboT -= dt; turboCD -= dt; const tb = turboT > 0;
  offK += ((onRoad(c.x, c.z) ? 0 : 1) - offK)*Math.min(1, dt*3);
  let slow = 1; if (c.y < .4) for (let n = 0; n < slowZones.length; n++) { const q = slowZones[n], ax = (c.x - q.x)/(q.lake ? LAKE.rx/LAKE.rz : 1), az = c.z - q.z; if (ax*ax + az*az < q.r*q.r) { slow = .45;
    if (Math.hypot(c.vx, c.vz) > 3) { for (let i = 0; i < 3; i++) emit(c.x + rr(-1, 1), .3, c.z + rr(-1, 1), rr(-3, 3), rr(3, 8), rr(-3, 3), .7, .7, .88, 1, 14); if (time - splashT > .5) { splashT = time; sfx.splash(); if (airT > .3) chaosAdd(2); } } } }
  const vmax = A.vmax*(tb ? 1.5 : 1)*(1 - offK*(1 - A.off))*slow;
  const stW = unstuckT > 0 ? (st || unstuckS) : st;
  if (!c.air) c.steer += (stW - c.steer)*Math.min(1, dt*(stW ? 5 : 9));
  let fx = Math.sin(c.h), fz = Math.cos(c.h), vf = c.vx*fx + c.vz*fz;
  c.h = wrap(c.h + c.steer*A.turn*vf*.2/(1 + Math.abs(vf)*.09)*dt*(c.air ? .35 : 1));
  fx = Math.sin(c.h); fz = Math.cos(c.h); vf = c.vx*fx + c.vz*fz; let vl = -c.vx*fz + c.vz*fx;
  if (!c.air) {
    if (unstuckT > 0) { unstuckT -= dt; vf = Math.max(-5, vf - 14*dt); }                                   // samo cofa spod ściany
    else if (IN.back) { if (vf > .3) vf = Math.max(0, vf - 26*dt); else vf = Math.max(-7, vf - 6*dt); }
    else if (IN.gas || tb) { const g = tb ? 1 : IN.gas; if (vf < -.3) vf = Math.min(0, vf + 26*dt); else vf += A.acc*(tb ? 2 : 1)*g*(1 - .6*Math.max(0, vf)/Math.max(4, vmax*(tb ? 1 : .55 + .45*g)))*dt; }
    else { const d = (nearStop ? 18 : 3 + Math.abs(vf)*.3)*dt; vf -= Math.sign(vf)*Math.min(Math.abs(vf), d); }
    if (vf > vmax) vf = Math.max(vmax, vf - 14*dt);
    vl *= Math.exp(-A.grip*(IN.back && Math.abs(vf) > 5 ? .3 : 1)*(WX.rain ? .7 : 1)*dt);
  }
  c.vx = fx*vf - fz*vl; c.vz = fz*vf + fx*vl; c.x += c.vx*dt; c.z += c.vz*dt;
  const hit = collide(c);
  if (!c.air && unstuckT <= 0 && (IN.gas > .3 || tb) && Math.abs(vf) < 1.2) { stuckT += dt; if (stuckT > 1.1) { stuckT = 0; unstuckT = 1.2; unstuckS = st ? -Math.sign(st) : (Math.random() < .5 ? 1 : -1); toast('🔙 Cofamy spod ściany!'); } } else stuckT = 0;
  if (hit > 4 && time - bumpT > .35) { bumpT = time; sfx.crash(Math.min(1, hit/16)); shake = Math.min(.6, hit*.03); for (let i = 0; i < 8; i++) emit(c.x + fx*2, .8, c.z + fz*2, rr(-4, 4), rr(2, 6), rr(-4, 4), .5, 1, .8, .3, 12); }
  // góra–dół: skocznie i lot
  const gy = groundH(c.x, c.z);
  if (c.air) { c.vy -= 24*dt; c.y += c.vy*dt; airT += dt; if (c.y <= gy) { c.y = gy; c.air = false; c.vy = 0;
      if (airT > .45) { const len = Math.round(Math.hypot(c.x - jx, c.z - jz)); chaosAdd(3); sfx.thud(); shake = .35; rideCheer();
        if (overTrain) { addScore(5); bigText('NAD POCIĄGIEM! +5 ⭐'); sfx.win(); } else if (len > GAR.jump) { GAR.jump = len; save(); addScore(1); bigText('REKORD SKOKU: ' + len + ' m!'); } else bigText((airT > 1.1 ? 'MEGA SKOK ' : 'SKOK ') + len + ' m'); for (let i = 0; i < 14; i++) emit(c.x + rr(-1.5, 1.5), .2, c.z + rr(-1.5, 1.5), rr(-4, 4), rr(1, 4), rr(-4, 4), .6, .75, .72, .62, 6); } } }
  else { const nv = (gy - c.y)/dt; if (nv < c.vy - 3 || gy < c.y - .3) { c.air = true; airT = 0; jx = c.x; jz = c.z; overTrain = false; if (c.vy > 3) sfx.boing(); c.vy -= 24*dt; c.y += c.vy*dt; } else { c.vy = clamp(nv, -20, 17); c.y = gy; } }
  // poślizg
  const skid = !c.air && Math.abs(vl) > 4 && Math.abs(vf) > 7;
  if (skid) { driftT += dt; if (Math.random() < .6) puff(c.x - fx*1.6 + rr(-.8, .8), .3, c.z - fz*1.6 + rr(-.8, .8), rr(-.5, .5), 1, rr(-.5, .5), .7, .8, .92, .5); }
  else { if (driftT > .8) { chaosAdd(2); bigText('DRIFT!'); rideCheer(); } driftT = 0; }
  if (tb && Math.random() < .9) emit(c.x - fx*2.2 + rr(-.4, .4), .5 + c.y, c.z - fz*2.2 + rr(-.4, .4), -fx*6 + rr(-1, 1), rr(0, 2), -fz*6 + rr(-1, 1), .35, 1, rr(.4, .8), .1, -2);
  for (let k = 0; k < c.wheels.length; k++) c.wheels[k].n.rotation.x += vf*dt/c.wheels[k].r;
  c.tilt += (c.steer*vf*.004 + vl*.01 - c.tilt)*Math.min(1, dt*6); c.pitch += ((c.air ? -clamp(c.vy*.035, -.45, .45) : -Math.atan2(c.vy, Math.max(6, Math.abs(vf)))) - c.pitch)*Math.min(1, dt*8);
  c.inner.rotation.z = c.tilt; c.inner.rotation.x = c.pitch; c.inner.position.y = offK*Math.min(1, Math.abs(vf)/6)*.05*Math.sin(time*33);
  if (offK > .5 && !c.air && Math.abs(vf) > 4 && Math.random() < .5) emit(c.x - fx*A.R*.8 + rr(-.7, .7), .3, c.z - fz*A.R*.8 + rr(-.7, .7), rr(-1, 1), rr(1, 3), rr(-1, 1), .5, .45, .62, .25, 6);
  if (c.P && c.P.fan) c.P.fan.rotation.z += dt*(18 + Math.abs(vf)*3);
  c.v = vf; syncAuto();
  engineSound(dt, vf, c.air, skid, tb); if (popFlash > 0) { popFlash -= dt; for (let i = 0; i < 3; i++) emit(c.x - fx*2.3 + rr(-.3, .3), .45 + c.y, c.z - fz*2.3 + rr(-.3, .3), -fx*5 + rr(-1, 1), rr(0, 1.5), -fz*5 + rr(-1, 1), .22, 1, rr(.5, .9), .15, -1); }
}
function flyPlane(dt) {                           // gaz: rozpędza się i wznosi; puszczony gaz: opada i ląduje (także na dachach)
  const A = AV, c = pc, st = IN.st, gas = IN.fwd > .2; turboT -= dt; turboCD -= dt; const tb = turboT > 0, vmax = A.vmax*(tb ? 1.4 : 1);
  let gy = groundH(c.x, c.z); for (let n = 0; n < solids.length; n++) { const q = solids[n]; if (c.x > q.x0 && c.x < q.x1 && c.z > q.z0 && c.z < q.z1 && c.y >= q.h - .8) gy = Math.max(gy, q.h + .4); }
  const grounded = c.y <= gy + .05; let v = c.v || 0;
  if (gas || tb) v = Math.min(vmax, v + A.acc*dt); else if (grounded && IN.gas) v = Math.min(vmax*.3, v + A.acc*.6*dt); else if (IN.back) v = grounded ? Math.max(-4, v - 16*dt) : Math.max(9, v - 12*dt); else v -= Math.sign(v)*Math.min(Math.abs(v), (grounded ? (nearStop ? 20 : 7) : nearStop ? 9 : 3)*dt);
  if (v > vmax) v = Math.max(vmax, v - 10*dt);
  c.steer += (st - c.steer)*Math.min(1, dt*4); c.h = wrap(c.h + c.steer*(grounded ? Math.min(1, Math.abs(v)/6)*Math.sign(v || 1) : 1)*1.05*dt);
  // z gazem wznosi się zawsze, także bez rozpędu (z ciasnego podwórka między blokami): wolno w miejscu, szybciej z prędkością
  const want = gas || tb ? (c.y < 46 ? 3.5 + 5.5*clamp(v/15, 0, 1) : 0) : grounded ? 0 : IN.back ? -13 : nearStop ? -11 : -5.5; c.vy += (want - c.vy)*Math.min(1, dt*2.2); if (c.y >= 46 && c.vy > 0) c.vy *= .9;
  const fx = Math.sin(c.h), fz = Math.cos(c.h); c.vx = fx*v; c.vz = fz*v; c.x += c.vx*dt; c.z += c.vz*dt; c.y += c.vy*dt;
  const hit = collide(c); if (hit > 3) { v = c.vx*fx + c.vz*fz; if (time - bumpT > .35) { bumpT = time; sfx.crash(Math.min(1, hit/16)); shake = Math.min(.5, hit*.03); } }
  if (c.y <= gy) { if (c.vy < -7 && time - bumpT > .4) { bumpT = time; sfx.thud(); shake = .3; } if (!grounded && c.vy < -1) for (let i = 0; i < 8; i++) emit(c.x + rr(-1, 1), gy + .2, c.z + rr(-1, 1), rr(-3, 3), rr(1, 3), rr(-3, 3), .5, .75, .72, .62, 6); c.y = gy; if (c.vy < 0) c.vy = 0; }
  c.air = c.y > gy + .25; c.v = v; if (c.air) airT += dt; else airT = 0;
  c.tilt += ((c.air ? -c.steer*.55 : 0) - c.tilt)*Math.min(1, dt*4); c.pitch += ((c.air || c.vy > 1 ? -clamp(c.vy*.035, -.4, .4) : 0) - c.pitch)*Math.min(1, dt*5); c.inner.rotation.z = c.tilt; c.inner.rotation.x = c.pitch; c.prop.rotation.z += dt*(12 + Math.abs(v)*2 + (gas ? 30 : 0));
  if (tb && Math.random() < .9) emit(c.x - fx*3.5, 1.3 + c.y, c.z - fz*3.5, -fx*6 + rr(-1, 1), rr(-1, 1), -fz*6 + rr(-1, 1), .35, 1, rr(.4, .8), .1, -1);
  c.g.position.set(c.x, c.y, c.z); c.g.rotation.y = c.h; engineSound(dt, v, false, false, tb);
}
function syncAuto() { const c = pc; c.g.position.set(c.x, c.y, c.z); c.g.rotation.y = c.h; for (let k = 0; k < c.steerNodes.length; k++) c.steerNodes[k].n.rotation.y = c.steer*.5*c.steerNodes[k].s; if (c.sw) c.sw.rotation.y = c.steer*1.7; }
function turbo() { if (S.veh !== 'car' || turboCD > 0 || !S.running) return; const lv = turboLv(); turboT = [2.2, 3, 4][lv]; turboCD = [7, 5.5, 4][lv]; $('cTurbo').classList.add('cd'); setTimeout(() => $('cTurbo').classList.remove('cd'), turboCD*1000); tone(120, .9, 'sawtooth', .2, 520); burst(700, .8, .25, 0, .5); bigText('TURBO!'); }
function horn() { hornOn(); setTimeout(hornOff, 320); }

/* ---------- rekwizyty w ruchu ---------- */
function hitProp(p, c, sp) {
  const d = p.d; p.st = 1; p.t = 0; p.vx = c.vx*rr(.9, 1.3) + rr(-3, 3); p.vz = c.vz*rr(.9, 1.3) + rr(-3, 3); p.vy = 4 + sp*rr(.2, .4); p.wx = rr(-9, 9); p.wy = rr(-5, 5); p.wz = rr(-9, 9);
  c.vx *= 1 - d.m; c.vz *= 1 - d.m; chaosAdd(1); sfx.crash(Math.min(1, .25 + d.m*6)); shake = Math.max(shake, d.m*2.5);
  const col = d.fx === 1 ? [.9, .75, .3] : d.fx === 2 ? [.9, .25, .15] : d.fx === 3 ? [.6, .8, 1] : [.8, .78, .7];
  for (let i = 0; i < 8; i++) emit(p.x, d.h*.5, p.z, c.vx*.3 + rr(-4, 4), rr(2, 7), c.vz*.3 + rr(-4, 4), .8, col[0], col[1], col[2], 12);
  if (d.fx === 3 && p.x === p.hx) fountains.push({ x:p.hx, z:p.hz, t:7 });
}
function propsStep(dt) {
  const c = pc, sp = Math.hypot(c.vx, c.vz), drive = S.veh === 'car' && sp > 2.5 && c.y < 1.3, cr = AV.R*.55, k = sp > .1 ? 1.4/sp : 0, fx = c.x + c.vx*k, fz = c.z + c.vz*k;
  for (let n = 0; n < props.length; n++) { const p = props[n];
    if (p.st !== 1) { if (drive) { const dx = p.x - fx, dz = p.z - fz; if (Math.abs(dx) < 4 && Math.abs(dz) < 4) { const rr2 = (p.d.r + cr)*(p.d.r + cr), ex = p.x - c.x, ez = p.z - c.z; if (dx*dx + dz*dz < rr2 || ex*ex + ez*ez < rr2) hitProp(p, c, sp); } }
      if (p.st === 2) { p.t += dt; if (p.t > 45 && Math.abs(p.x - c.x) + Math.abs(p.z - c.z) > 110) { p.st = 0; p.x = p.hx; p.z = p.hz; p.y = p.d.h/2; p.ex = p.ez = 0; p.ey = p.hr; setProp(p); } }
      continue; }
    p.vy -= 22*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt; p.ex += p.wx*dt; p.ey += p.wy*dt; p.ez += p.wz*dt; p.t += dt;
    if (p.y < p.d.lay) { p.y = p.d.lay; if (p.vy < -3) { p.vy = -p.vy*.38; p.vx *= .7; p.vz *= .7; p.wx *= .6; p.wz *= .6; } else { p.vy = 0; const f = 1 - Math.min(1, dt*4); p.vx *= f; p.vz *= f; p.wx *= f; p.wy *= f; p.wz *= f;
        if (Math.abs(p.vx) + Math.abs(p.vz) < .5 || p.t > 6) { p.st = 2; p.t = 0; if (p.d.name === 'pcar') { p.ex = p.ez = 0; } else if (p.d.name !== 'bale' && p.d.name !== 'pumpkin') { p.ex = Math.PI/2; p.ez = 0; } } } }
    setProp(p); }
  for (let n = fountains.length - 1; n >= 0; n--) { const f = fountains[n]; f.t -= dt; for (let i = 0; i < 2; i++) emit(f.x + rr(-.1, .1), .3, f.z + rr(-.1, .1), rr(-1.2, 1.2), rr(9, 13), rr(-1.2, 1.2), 1.4, .6, .82, 1, 14); if (f.t <= 0) fountains.splice(n, 1); }
}

/* ---------- przechodnie, kury, krowy ---------- */
let ojT = 0, cluckT = 0;
function actorsStep(dt) {
  const c = pc, drive = S.veh === 'car', sp = Math.hypot(c.vx, c.vz); hornT -= dt; if (hornHeld || (sirenOn && AK === 'police' && drive)) hornT = .3;
  if (AK === 'police') { const on = sirenOn && (time*4 % 1) < .5; pc.lights[0].visible = !sirenOn || on; pc.lights[1].visible = !sirenOn || !on; pc.lights.forEach(l => l.scale.setScalar(sirenOn ? 1.25 : 1)); }
  for (let n = 0; n < peds.length; n++) { const p = peds[n]; p.t += p.dir*p.sp*dt/p.len; if (p.t > 1) { p.t = 1; p.dir = -1; } else if (p.t < 0) { p.t = 0; p.dir = 1; }
    let x = p.p.ax + (p.p.bx - p.p.ax)*p.t, z = p.p.az + (p.p.bz - p.p.az)*p.t, y = 0; const d = Math.abs(x - c.x) + Math.abs(z - c.z);
    if (p.j <= 0 && drive && ((d < 7 && sp > 4) || (hornT > 0 && d < 16))) { p.j = .9; if (d < 4.5 && sp > 8) { chaosAdd(1); rideCheer(); } if (time - ojT > .25) { ojT = time; sfx.oj(); } }
    if (p.j > 0) { p.j -= dt; const q = Math.sin(Math.PI*clamp(1 - p.j/.9, 0, 1)); x += p.p.nx*3*q; z += p.p.nz*3*q; y = q*1.1; }
    pdum.position.set(x, y + Math.abs(Math.sin(time*7 + n))*.06, z); pdum.rotation.set(0, Math.atan2((p.p.bx - p.p.ax)*p.dir, (p.p.bz - p.p.az)*p.dir), 0); pdum.scale.setScalar(1.3); pdum.updateMatrix(); p.im.setMatrixAt(p.i, pdum.matrix); p.im.instanceMatrix.needsUpdate = true; }
  for (let n = 0; n < chicks.length; n++) { const q = chicks[n], dx = q.x - c.x, dz = q.z - c.z, d = Math.hypot(dx, dz); q.t -= dt;
    if (q.st === 2) { q.vy -= 20*dt; q.y += q.vy*dt; q.x += q.vx*dt; q.z += q.vz*dt; q.spin += dt*14; if (q.y <= 0) { q.y = 0; q.st = 1; q.t = 1; q.spin = 0; } }
    else { if (drive && d < 1.9 && sp > 3 && c.y < 1) { q.st = 2; q.vy = 9 + sp*.25; q.vx = c.vx*.7 + rr(-2, 2); q.vz = c.vz*.7 + rr(-2, 2); chaosAdd(2); sfx.cluck(); bigText('🐔 Ko-ko-ko!'); for (let i = 0; i < 8; i++) emit(q.x, .5, q.z, rr(-3, 3), rr(2, 6), rr(-3, 3), 1.2, 1, 1, .95, 5); }
      else if (drive && ((d < 8 && sp > 2) || (hornT > 0 && d < 18))) { if (q.st !== 1 && time - cluckT > .3) { cluckT = time; sfx.cluck(); } q.st = 1; q.t = 1.1; q.h = Math.atan2(dx, dz) + rr(-.5, .5); }
      if (q.st === 1) { q.x += Math.sin(q.h)*7*dt; q.z += Math.cos(q.h)*7*dt; q.y = Math.abs(Math.sin(time*22 + n))*.3; if (q.t <= 0) { q.st = 0; q.y = 0; q.t = rr(1, 4); q.tx = q.x; q.tz = q.z; } }
      else { if (q.t <= 0) { q.t = rr(2, 5); const far = Math.hypot(q.x - q.hx, q.z - q.hz) > 14; q.tx = (far ? q.hx : q.x) + rr(-3, 3); q.tz = (far ? q.hz : q.z) + rr(-3, 3); }
        const ax = q.tx - q.x, az = q.tz - q.z, l = Math.hypot(ax, az); if (l > .3) { q.h = Math.atan2(ax, az); q.x += ax/l*1.1*dt; q.z += az/l*1.1*dt; } } }
    pdum.position.set(q.x, q.y, q.z); pdum.rotation.set(q.st === 0 ? Math.max(0, Math.sin(time*3 + n*2))*.7 : q.spin, q.h, 0); pdum.scale.setScalar(1.5); pdum.updateMatrix(); chickIM.setMatrixAt(n, pdum.matrix); }
  chickIM.instanceMatrix.needsUpdate = true; pdum.scale.setScalar(1);
  for (let n = 0; n < cows.length; n++) { const q = cows[n], d = Math.abs(q.x - c.x) + Math.abs(q.z - c.z);
    if (drive && hornT > 0 && d < 16 && q.away < 10) { q.away = 12; const a = Math.atan2(q.x - c.x, q.z - c.z); q.tx = q.x + Math.sin(a)*7; q.tz = q.z + Math.cos(a)*7; if (time - q.mooT > 1) { q.mooT = time; sfx.moo(); } }
    if (q.away > 0) { q.away -= dt; if (q.away <= 0) { q.tx = q.hx; q.tz = q.hz; } }
    const ax = q.tx - q.x, az = q.tz - q.z, l = Math.hypot(ax, az); if (l > .3) { const v = q.hop > 0 ? 7 : 2; q.h += wrap(Math.atan2(ax, az) - q.h)*Math.min(1, dt*4); q.x += ax/l*Math.min(l, v*dt); q.z += az/l*Math.min(l, v*dt); }
    q.hop -= dt; q.g.position.set(q.x, q.hop > 0 ? Math.sin(q.hop/.5*Math.PI)*.7 : 0, q.z); q.g.rotation.y = q.h; }
}
function trafStep(dt) {
  const P = S.veh === 'car' ? pc : null;
  for (let n = 0; n < traffic.length; n++) { const c = traffic[n]; if (c.off) continue;
    if (c.spin > 0) { c.spin -= dt; c.g.rotation.y = c.h + (1.2 - c.spin)*10.47; c.g.position.y = Math.sin((1.2 - c.spin)/1.2*Math.PI)*.8; if (c.spin <= 0) { c.g.rotation.y = c.h; c.g.position.y = 0; if (c.caught) { c.caught = false; c.off = true; c.g.visible = false; } } continue; }
    let want = c.vmax; const blk = (ox, oz, R) => { const ax = ox - c.x, az = oz - c.z, ah = ax*c.hx + az*c.hz; if (ah > 0 && ah < c.R + R + 6 && Math.abs(az*c.hx - ax*c.hz) < 2.6) want = 0; };
    if (!c.flee) { if (P) blk(P.x, P.z, 2); for (let m = 0; m < traffic.length; m++) if (m !== n && !traffic[m].off) blk(traffic[m].x, traffic[m].z, traffic[m].R); for (let m = 0; m < cows.length; m++) blk(cows[m].x, cows[m].z, 1.5); }
    const sirN = P && sirenOn && AK === 'police' && !c.flee && Math.abs(P.x - c.x) + Math.abs(P.z - c.z) < 45; if (sirN) want = 0; c.side = (c.side || 0) + ((sirN ? 1.6 : 0) - (c.side || 0))*Math.min(1, dt*3);
    if (c.mode === 0) { const ex = stX(c.b[0]) - c.fx*RW - c.fz*c.lane, ez = stZ(c.b[1]) - c.fz*RW + c.fx*c.lane, dist = (ex - c.x)*c.fx + (ez - c.z)*c.fz;
      if (c.b[1] === RAILJ && xings[c.b[0]].closed && dist < 6) want = 0; if (dist < 12) want = Math.min(want, 6);
      c.v += clamp(want - c.v, -16*dt, 5*dt); c.x += c.fx*c.v*dt; c.z += c.fz*c.v*dt; c.hx = c.fx; c.hz = c.fz; c.h = Math.atan2(c.fx, c.fz); if (dist <= c.v*dt + .05) trafNext(c); }
    else { const tr = c.turn; c.v += clamp(Math.min(want, 6) - c.v, -16*dt, 5*dt); tr.t = Math.min(1, tr.t + c.v*dt/tr.len); const t = tr.t, u = 1 - t;
      c.x = u*u*tr.p0.x + 2*u*t*tr.q.x + t*t*tr.p2.x; c.z = u*u*tr.p0.z + 2*u*t*tr.q.z + t*t*tr.p2.z; const dx = u*(tr.q.x - tr.p0.x) + t*(tr.p2.x - tr.q.x), dz = u*(tr.q.z - tr.p0.z) + t*(tr.p2.z - tr.q.z), l = Math.hypot(dx, dz) || 1;
      c.hx = dx/l; c.hz = dz/l; c.h = Math.atan2(dx, dz); if (t >= 1) c.mode = 0; }
    c.g.position.set(c.x - c.hz*c.side, 0, c.z + c.hx*c.side); c.g.rotation.y = c.h; if (c.g.userData.reel) c.g.userData.reel.rotation.x += dt*3; if (c.wheels) c.wheels.forEach(w => { w.n.rotation.x += c.v*dt/w.r; }); }
}

/* =====================================================================
   KURSY: pasażerowie czekają w mieście, strzałka prowadzi do nich i do celu
   ===================================================================== */
const VALC = [0x35d04a, 0xf5d21f, 0xff8a1a, 0xf0413a], custs = [];

for (let k = 0; k < 4; k++) { const g = new T.Group(), body = pedMats(PEDC[k]); body.scale.setScalar(1.45); g.add(body);
  const mm = new T.MeshBasicMaterial({ color:0xffffff, fog:false }), bm = new T.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.2, depthWrite:false, fog:false });
  const mk = mesh(new T.ConeGeometry(.9, 1.7, 4), mm, 0, 4.2, 0, g); mk.rotation.x = Math.PI;
  const zone = new T.Group(); const ring = mesh(new T.RingGeometry(3, 3.7, 28), mm, 0, .14, 0, zone); ring.rotation.x = -Math.PI/2; const beam = mesh(new T.CylinderGeometry(3.3, 3.3, 14, 18, 1, true), bm, 0, 7, 0, zone); beam.renderOrder = 3; g.add(zone);
  g.visible = false; scene.add(g); custs.push({ g, body, mk, zone, mm, bm, on:false, poi:null, dest:null, val:1, dist:0, hop:0 }); }
const beacon = new T.Group(), outP = pedMats(0xf08a2a), arrow = new T.Group();
{ const mm = new T.MeshBasicMaterial({ color:0xffd21f, fog:false }), bm = new T.MeshBasicMaterial({ color:0xffd21f, transparent:true, opacity:.24, depthWrite:false, fog:false });
  const ring = mesh(new T.RingGeometry(3.4, 4.3, 30), mm, 0, .14, 0, beacon); ring.rotation.x = -Math.PI/2; const col = mesh(new T.CylinderGeometry(3.8, 3.8, 22, 20, 1, true), bm, 0, 11, 0, beacon); col.renderOrder = 3;
  const tip = mesh(new T.ConeGeometry(1.7, 3.2, 4), mm, 0, 16, 0, beacon); tip.rotation.x = Math.PI; beacon.userData.tip = tip; beacon.visible = false; scene.add(beacon);
  outP.scale.setScalar(1.45); outP.visible = false; scene.add(outP);
  const s = new T.Shape(); [[0, 2.5], [1.5, .5], [.55, .5], [.55, -1.9], [-.55, -1.9], [-.55, .5], [-1.5, .5]].forEach((p, i) => { if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]); });
  const geo = new T.ExtrudeGeometry(s, { depth:.4, bevelEnabled:false }); geo.rotateX(Math.PI/2);
  arrow.userData.m = new T.MeshBasicMaterial({ color:0x35e04a, fog:false, depthTest:false, transparent:true }); const edge = new T.MeshBasicMaterial({ color:0x1c1c1e, fog:false, depthTest:false, transparent:true });
  const dial = new T.Group(), e = new T.Mesh(geo, edge); e.scale.set(1.2, 1, 1.12); e.position.y = -.14; e.renderOrder = 9; dial.add(e); const a = new T.Mesh(geo, arrow.userData.m); a.renderOrder = 10; dial.add(a); arrow.add(dial); arrow.userData.dial = dial; arrow.rotation.order = 'YXZ'; arrow.visible = false; scene.add(arrow); }
// zwierzęta z Pralni (models/zwierzeta.js), dopasowane wysokością; ruch przez anims
const zoo = (type, h) => { const { g, a } = ZOO.fit(type, h); let last = 0; anims.push(t => { ZOO.anim(a, Math.min(.1, t - last)); last = t; }); return g; };
const ZOOA = [{ name:'Żyrafa', ico:'🦒', g:zoo('giraffe', 6.2), s:.8, rs:.4, top:5.6, snd:'hum' }, { name:'Słoń', ico:'🐘', g:zoo('elephant', 3.15), s:.75, rs:.36, top:3.4, snd:'trumpet' }, { name:'Lew', ico:'🦁', g:zoo('lion', 1.4), s:1.15, rs:.62, top:2.2, snd:'roar' },
  { name:'Pingwin', ico:'🐧', g:zoo('penguin', .9), s:1.9, rs:1.1, top:2.4, snd:'peep' }, { name:'Krowa', ico:'🐄', g:cloneTpl(cowTpl[0], true), s:1.1, rs:.55, top:2.6, snd:'moo' }];
ZOOA.forEach(a => { a.g.visible = false; a.busy = false; scene.add(a.g); });
const ROOF = { taxi:[1.74, -.35], race:[1.2, -1.75], bus:[2.98, -.5], ursus:[1.22, .75], police:[1.74, -1.1], plane:[2.3, .6] };
function mountAnimal(a, i) { const r = ROOF[AK]; pc.inner.add(a.g); a.g.position.set(0, r[0], r[1] + (AK === 'bus' ? ((i || 0) - 1)*2.6 : 0)); a.g.rotation.set(0, 0, 0); a.g.scale.setScalar(a.rs/(AK === 'ursus' ? 1.35 : 1)); a.g.visible = true; }
function freeAnimal(a) { if (!a) return; scene.add(a.g); a.g.visible = false; a.busy = false; }
const rides = [], CAP = () => AK === 'bus' ? 3 : 1, outFxs = [];
let custT = .5, jobHold = 0, hudT = 0, cheerT = 0;
const CHEER = ['Juhuu!', 'Ale jazda!', 'Jeszcze raz!', 'Łaaał!', 'Szybciej!', 'Trzymam się!', 'Mamo, lecimy!'];
const KINDS = { granny:{ ico:'👵', say:'Tylko powolutku, kochanieńki!' }, stunt:{ ico:'🤸', say:'Płacę tylko za skoki i drifty!' }, rush:{ ico:'⏰', say:'Szybko, bo się spóźnię!' } }, KTEX = {};
Object.keys(KINDS).forEach(k => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.font = '50px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(KINDS[k].ico, 32, 36); KTEX[k] = new T.CanvasTexture(cv); });
custs.forEach(q => { q.tag = new T.Sprite(new T.SpriteMaterial({ transparent:true, fog:false, depthWrite:false })); q.tag.scale.set(2.4, 2.4, 1); q.tag.position.y = 6.3; q.tag.visible = false; q.g.add(q.tag); });
const beacons = [beacon, beacon.clone(), beacon.clone()], outPs = [outP, outP.clone(), outP.clone()]; beacons.slice(1).forEach(b => scene.add(b)); outPs.slice(1).forEach(p => { p.visible = false; scene.add(p); });
const rIco = r => r.an ? r.an.ico : r.kind ? KINDS[r.kind].ico : '🧍';
function rideCheer() { if (!rides.length || time - cheerT < 4) return; cheerT = time; toast(rides.some(r => r.kind === 'granny') ? '👵 „Ojej! Wolniej, wolniej!”' : '🧍 „' + CHEER[(Math.random()*CHEER.length) | 0] + '”'); }
function remount() { rides.forEach((r, i) => { if (r.an) mountAnimal(r.an, i); }); }
function endRides() { rides.forEach(r => freeAnimal(r.an)); rides.length = 0; beacons.forEach(b => { b.visible = false; }); hudT = 0; }
function spawnCust(q) {
  let bp = null, bs = 1e9; for (let t = 0; t < 10; t++) { const p = POIS[(Math.random()*POIS.length) | 0]; if (custs.some(o => o.on && o.poi === p) || rides.some(r => r.dest === p)) continue;
    const d = Math.hypot(p.x - pc.x, p.z - pc.z); if (d < 40) continue; const s = Math.abs(d - 120) + Math.random()*60; if (s < bs) { bs = s; bp = p; } }
  if (!bp) return; let dest = null, dd = 0; for (let t = 0; t < 14; t++) { const p = POIS[(Math.random()*POIS.length) | 0], d = Math.hypot(p.x - bp.x, p.z - bp.z); if (p !== bp && d > 85) { dest = p; dd = d; if (Math.random() < .5) break; } }
  if (!dest) return; const zoo = POIS.find(p => p.name === 'Zoo'), an = Math.random() < .4 ? ZOOA.filter(a => !a.busy)[(Math.random()*5) | 0] : null; q.an = an || null;
  if (an) { an.busy = true; if (zoo && bp !== zoo && Math.random() < .6) { dest = zoo; dd = Math.hypot(zoo.x - bp.x, zoo.z - bp.z); } scene.add(an.g); an.g.position.set(bp.px, 0, bp.pz); an.g.scale.setScalar(an.s); an.g.rotation.set(0, 0, 0); an.g.visible = true; }
  q.kind = !an && Math.random() < .38 ? ['granny', 'stunt', 'rush'][(Math.random()*3) | 0] : null; q.tag.visible = !!q.kind; if (q.kind) { q.tag.material.map = KTEX[q.kind]; q.tag.material.needsUpdate = true; }
  q.body.visible = !an; q.mkY = an ? an.top*an.s + 1.4 : 4.4;
  q.on = true; q.poi = bp; q.dest = dest; q.dist = dd; q.val = clamp(Math.round(dd/120), 1, 4); q.g.position.set(bp.px, 0, bp.pz); q.zone.position.set(bp.x - bp.px, 0, bp.z - bp.pz);
  q.mm.color.setHex(VALC[q.val - 1]); q.bm.color.setHex(VALC[q.val - 1]); q.body.position.set(0, 0, 0); q.zone.visible = q.mk.visible = true; q.g.visible = true;
}
function pickup(q) {
  const an = q.an, kind = q.kind, dn = q.dest.ico + ' ' + q.dest.name; let T0 = q.dist/(AV.vmax*.5) + 10; if (kind === 'granny') T0 *= 2; else if (kind === 'rush') T0 *= .7; if (AK === 'bus') T0 *= 1.7;
  rides.push({ dest:q.dest, val:q.val, T:T0, t:T0, c0:chaos, an, kind }); q.on = false; q.hop = an ? 0 : .5; q.zone.visible = q.mk.visible = q.tag.visible = false; jobHold = 0;
  if (an) { q.g.visible = false; q.an = null; mountAnimal(an, rides.length - 1); sfx[an.snd](); bigText(an.ico + ' na dachu!'); }
  sfx.pop(4); tone(660, .15, 'triangle', .2, 990, .1); toast(an ? an.ico + ' ' + an.name + ' jedzie do: ' + dn + '!' : kind ? KINDS[kind].ico + ' „' + KINDS[kind].say + '” → ' + dn : 'Kurs: ' + dn + '!');
  if (S.arcade) { S.clock += Math.round(T0*.75); if (!an) bigText('+' + Math.round(T0*.75) + ' s'); } hudT = 0;
}
function deliver(r) {
  const frac = r.t/r.T, dc = chaos - r.c0, c = pc; let n, msg;
  if (r.kind === 'granny') { n = r.val + (dc === 0 ? 3 : 0); msg = dc === 0 ? '👵 „Co za miły kierowca!” +3 ⭐' : '👵 „Ale mnie wytrzęsło…”'; }
  else if (r.kind === 'stunt') { n = clamp(Math.round(dc/3), 1, 9); msg = '🤸 Kaskader policzył triki: ' + n + ' ⭐'; }
  else if (r.kind === 'rush') { n = frac > 0 ? r.val*2 + 2 : 1; msg = frac > 0 ? '⏰ „Zdążyłem, dziękuję!” Podwójna zapłata' : '⏰ „No i się spóźniłem…”'; }
  else { const tip = Math.min(3, (dc/5) | 0), bonus = frac > .45 ? 2 : frac > 0 ? 1 : 0; n = r.val + bonus + tip; msg = (bonus === 2 ? 'Błyskawicznie! ' : bonus ? 'Na czas! ' : 'Dowiezione! ') + (tip ? 'Napiwek za szaloną jazdę +' + tip + ' ⭐' : r.dest.ico + ' ' + r.dest.name); }
  if (r.an) n++; if (rides.length > 1) { n++; msg += ' · autobus +1'; }
  addScore(n); sfx.cash(); sfx.win(); bigText('+' + n + ' ⭐'); toast(msg);
  for (let i = 0; i < 26; i++) { const k = i % 3; emit(c.x, 2.6, c.z, rr(-5, 5), rr(4, 9), rr(-5, 5), 1.2, k === 0 ? 1 : .3, k === 1 ? .85 : .5, k === 2 ? 1 : .2, 11); }
  if (S.arcade) S.clock += 3 + r.val*2; const o = r.an ? r.an.g : outPs.find(p => !p.visible) || outP; if (r.an) { scene.add(o); o.scale.setScalar(r.an.s); o.rotation.set(0, c.h, 0); sfx[r.an.snd](); }
  o.visible = true; outFxs.push({ t:0, x0:c.x, z0:c.z, x1:r.dest.px, z1:r.dest.pz, o, an:r.an }); rides.splice(rides.indexOf(r), 1); remount(); custT = .4; jobHold = 0; hudT = 0;
}
function jobsStep(dt) {
  if (AK === 'police' && S.veh === 'car') { policeStep(dt); return; }
  const c = pc, sp = Math.hypot(c.vx, c.vz), drive = S.veh === 'car', room = rides.length < CAP(); nearStop = false;
  custT -= dt; if (custT <= 0) { custT = 1.2; const f = custs.find(q => !q.on && q.hop <= 0); if (f && POIS.length > 2) spawnCust(f); }
  let near = null, nd = 1e9;
  custs.forEach((q, k) => { if (q.hop > 0) { q.hop -= dt; const u = 1 - q.hop/.5; q.body.position.set((c.x - q.g.position.x)*u, Math.sin(u*Math.PI)*1.6, (c.z - q.g.position.z)*u); if (q.hop <= 0) q.g.visible = false; return; }
    if (!q.on) return; q.zone.visible = room; q.body.position.y = Math.abs(Math.sin(time*5 + k))*.4; q.body.rotation.y = Math.atan2(c.x - q.poi.px, c.z - q.poi.pz); q.mk.position.y = q.mkY + Math.sin(time*4 + k)*.3; q.tag.position.y = q.mkY + 2 + Math.sin(time*4 + k)*.3;
    if (q.an) { q.an.g.position.y = Math.abs(Math.sin(time*4 + k))*.35; q.an.g.rotation.y += wrap(q.body.rotation.y - q.an.g.rotation.y)*Math.min(1, dt*3); } q.mk.rotation.y = time*2;
    const d = Math.hypot(c.x - q.poi.x, c.z - q.poi.z); if (d < nd) { nd = d; near = q; } });
  for (let n = outFxs.length - 1; n >= 0; n--) { const o = outFxs[n]; o.t += dt; const u = Math.min(1, o.t/.7); o.o.position.set(o.x0 + (o.x1 - o.x0)*u, u < 1 ? Math.sin(u*Math.PI)*1.5 : Math.abs(Math.sin(time*6))*.35, o.z0 + (o.z1 - o.z0)*u); if (o.t > 3.5) { outFxs.splice(n, 1); o.o.visible = false; if (o.an) o.an.busy = false; } }
  let rd = null, rdist = 1e9;
  if (drive) for (let n = rides.length - 1; n >= 0; n--) { const r = rides[n]; r.t -= dt; const d = Math.hypot(c.x - r.dest.x, c.z - r.dest.z); if (d < rdist) { rdist = d; rd = r; }
    if (r.t <= 0 && S.arcade) { toast('😠 Za wolno! ' + rIco(r) + ' wysiada.'); sfx.no(); freeAnimal(r.an); rides.splice(n, 1); remount(); hudT = 0; if (rd === r) { rd = null; rdist = 1e9; } } }
  beacons.forEach((b, i) => { const r = rides[i]; b.visible = !!r && drive; if (r) { b.position.set(r.dest.x, 0, r.dest.z); b.children[2].position.y = 16 + Math.sin(time*3 + i)*1.2; b.children[2].rotation.y = time*2; } });
  const toDest = !!rd && (!room || !near || rdist <= nd), tg = !drive ? null : toDest ? rd.dest : room && near ? near.poi : null, td = toDest ? rdist : nd;
  if (drive && rd && rdist < 13) nearStop = true; if (drive && room && near && nd < 13) nearStop = true;
  if (drive && rd && rdist < 9 && sp < 3 && !c.air && c.y < 1.5) { jobHold += dt; if (jobHold > .3) deliver(rd); }
  else if (drive && room && near && nd < 8.5 && sp < 3 && !c.air && c.y < 1.5) { jobHold += dt; if (jobHold > .3) pickup(near); } else jobHold = 0;
  arrow.visible = !!tg && td > 22 && drive && S.running;
  if (arrow.visible) { const pov = S.cam === 2, cy = pov ? c.h : camH, ax = c.x + Math.sin(c.h)*(pov ? 8 : 1.5), az = c.z + Math.cos(c.h)*(pov ? 8 : 1.5); arrow.position.set(ax, c.y + (pov ? c.eye.y*(c === ursus ? 1.35 : 1) + 1.6 : c.lookY + (S.cam ? 4.5 : 2.2)) + Math.sin(time*5)*.12, az);
    arrow.rotation.set(pov ? -1.25 : S.cam ? -.5 : -.95, cy, 0); arrow.userData.dial.rotation.y = wrap(Math.atan2(tg.x - ax, tg.z - az) - cy); arrow.userData.m.color.setHex(toDest ? 0xffd21f : 0x35e04a); arrow.scale.setScalar(pov ? .5 : S.cam ? 1.2 : .58); }
  hudT -= dt; if (hudT <= 0) { hudT = .2; const bar = $('jobBar'), on = rides.map(rIco).join('');
    if (!drive) { $('jobTxt').textContent = '🚂 → ' + tNext.ico + ' ' + tNext.name + ' · ' + Math.round(stopDist(tNext)) + ' m · 🧍 ' + tOnboard; bar.hidden = true; }
    else if (toDest) { $('jobTxt').textContent = on + ' → ' + tg.ico + ' ' + tg.name + ' · ' + Math.round(td) + ' m'; bar.hidden = false; const f = clamp(rd.t/rd.T, 0, 1), i = bar.firstElementChild; i.style.width = (f*100) + '%'; i.style.background = f > .45 ? '#3f9a4a' : f > .15 ? '#f2a81f' : '#d9432a'; }
    else { $('jobTxt').textContent = (on ? on + ' + ' : '') + (near ? (near.an ? near.an.ico : near.kind ? KINDS[near.kind].ico : '🙋') + ' ' + near.poi.ico + ' ' + near.poi.name + ' · ' + Math.round(nd) + ' m' : '🙋 Szukam pasażerów…'); bar.hidden = true; } }
}

/* ---------- gwiazdki: na ulicach i nad skoczniami ---------- */
const pstars = [];
for (let k = 0; k < 12 + ramps.length; k++) { const m = new T.Mesh(starGeo, starMat); m.castShadow = true; scene.add(m); const s = { m, x:0, y:2.2, z:0, on:true, t:0, ramp:k >= 12 ? ramps[k - 12] : null }; pstars.push(s); placeStar(s); }
function placeStar(s) {
  if (s.ramp) { s.x = s.ramp.x; s.z = s.ramp.z; s.y = 5.4; }
  else for (let t = 0; t < 30; t++) { const hz = Math.random() < .5, j = (Math.random()*(hz ? NZ + 1 : NZ)) | 0, i = (Math.random()*(hz ? NX : NX + 1)) | 0; if (!(hz ? HE[j][i] : VE[j][i])) continue;
    const u = RW + 4 + Math.random()*(BL - 8), o = [-5.25, -1.75, 1.75, 5.25][(Math.random()*4) | 0]; s.x = hz ? stX(i) + u : stX(i) + o; s.z = hz ? stZ(j) + o : stZ(j) + u; s.y = 2.2; break; }
  s.on = true; s.m.visible = true; s.m.position.set(s.x, s.y, s.z); s.m.scale.setScalar(.05);
}
function starsStep(dt) {
  const c = pc; for (let n = 0; n < pstars.length; n++) { const s = pstars[n]; if (!s.on) { s.t -= dt; if (s.t <= 0) placeStar(s); continue; }
    s.m.rotation.y = time*2.4 + n; s.m.position.y = s.y + Math.sin(time*3 + n)*.25; if (s.m.scale.x < 1) s.m.scale.setScalar(Math.min(1, s.m.scale.x + dt*3));
    if (S.veh === 'car' && Math.abs(c.x - s.x) < 3.2 && Math.abs(c.z - s.z) < 3.2 && Math.abs(c.y + 1 - s.y) < 3.4) { s.on = false; s.m.visible = false; s.t = s.ramp ? 14 : 3; addScore(s.ramp ? 2 : 1); tone(700, .18, 'triangle', .28, 1400);
      for (let i = 0; i < 12; i++) emit(s.x, s.y, s.z, rr(-4, 4), rr(2, 7), rr(-4, 4), .8, 1, .85, .2, 10); } }
}

/* =====================================================================
   KAMERA
   ===================================================================== */
const camPos = new T.Vector3(0, 40, 60), camLook = new T.Vector3(), wantPos = new T.Vector3(), wantLook = new T.Vector3();
let camH = Math.PI/2, camSnap = true, menuT = 0, camLift = 0;
function camBlocked(p, tx, ty, tz) {                // czy budynek zasłania auto widziane z punktu p
  const dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, m = .8;
  for (let n = 0; n < solids.length; n++) { const q = solids[n]; let t0 = 0, t1 = .9, a, b;
    if (Math.abs(dx) < 1e-5) { if (p.x < q.x0 - m || p.x > q.x1 + m) continue; } else { a = (q.x0 - m - p.x)/dx; b = (q.x1 + m - p.x)/dx; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); if (t0 > t1) continue; }
    if (Math.abs(dz) < 1e-5) { if (p.z < q.z0 - m || p.z > q.z1 + m) continue; } else { a = (q.z0 - m - p.z)/dz; b = (q.z1 + m - p.z)/dz; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); if (t0 > t1) continue; }
    if (Math.abs(dy) < 1e-5) { if (p.y > q.h + 1) continue; } else { a = (-1 - p.y)/dy; b = (q.h + 1 - p.y)/dy; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); if (t0 > t1) continue; }
    return true; }
  return false;
}
function updateCamera(dt) {
  const w = innerWidth, h = innerHeight, portrait = h > w, A = S.veh === 'car' ? pc : lead, ay = A.y || 0; let fov = 55;
  if (!S.started) { menuT += dt*.12; wantPos.set(A.x + Math.sin(menuT)*26, 12, A.z + Math.cos(menuT)*26); wantLook.set(A.x, 2.5, A.z); camPos.copy(wantPos); camLook.copy(wantLook); fov = portrait ? 72 : 54; }
  else if (S.cam < 2) { camH += wrap(A.h - camH)*Math.min(1, dt*(A.followK || 2.6)); const k = (portrait ? 1.3 : 1)*(S.cam ? 2.3 : 1), ca = camH + (A.chaseYaw || 0), sp = S.veh === 'car' ? Math.abs(pc.v || 0)/AV.vmax : 0;
    const fl = A === AUTOS.plane.car; wantPos.set(A.x - Math.sin(ca)*A.chase[0]*k, ay*(fl ? 1 : .7) + A.chase[1]*k*(S.cam ? 2.1 : 1) + (fl ? Math.min(3, ay*.2) : 0), A.z - Math.cos(ca)*A.chase[0]*k); wantLook.set(A.x + Math.sin(A.h)*(fl ? 8 : 3), ay*(fl ? 1 : .8) + A.lookY - (fl ? Math.min(3, ay*.2) : 0), A.z + Math.cos(A.h)*(fl ? 8 : 3));
    let need = 0; const bx = wantPos.x, by = wantPos.y, bz = wantPos.z;          // budynek zasłania: kamera podjeżdża bliżej i wyżej, aż zobaczy auto
    for (let it = 0; it < 9; it++) { const u = Math.max(0, 1 - need*.11); wantPos.set(A.x + (bx - A.x)*u, by + need*(S.cam ? 5 : 2.2), A.z + (bz - A.z)*u); if (!camBlocked(wantPos, A.x, ay + 1.4, A.z)) break; need++; }
    camLift += (need - camLift)*Math.min(1, dt*(need > camLift ? 9 : 1.5)); const u = Math.max(0, 1 - camLift*.11); wantPos.set(A.x + (bx - A.x)*u, by + camLift*(S.cam ? 5 : 2.2), A.z + (bz - A.z)*u);
    fov = (portrait ? 68 : 56) + sp*9 + (turboT > 0 ? 9 : 0); }
  else { A.g.updateMatrixWorld(); A.inner.localToWorld(wantPos.copy(A.eye)); A.inner.localToWorld(wantLook.copy(A.look)); fov = portrait ? 88 : 72; camSnap = true; }
  if (camSnap) { camPos.copy(wantPos); camLook.copy(wantLook); camH = A.h; camSnap = false; } else { const k = 1 - Math.exp(-dt*7); camPos.lerp(wantPos, k); camLook.lerp(wantLook, k); }
  if (A.driver) A.driver.visible = A === steam || !(S.cam === 2 && S.started);
  sun.target.position.set(A.x, 0, A.z); sun.position.copy(sun.target.position).add(SUN_DIR);
  if (headLamp.intensity > 0) { A.inner.localToWorld(headLamp.position.copy(A.lamp)); A.inner.localToWorld(headLamp.target.position.set(0, .5, A.lamp.z + 18)); }
  if (Math.abs(camera.fov - fov) > .05) { camera.fov += (fov - camera.fov)*Math.min(1, dt*5); camera.updateProjectionMatrix(); }
  camera.position.copy(camPos); if (shake > .01) { camera.position.x += rr(-1, 1)*shake; camera.position.y += rr(-1, 1)*shake*.6; shake *= Math.exp(-dt*7); }
  if (camera.position.y < .6) camera.position.y = .6; camera.lookAt(camLook);
}

addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 250)); resize();

/* =====================================================================
   MINIMAPA
   ===================================================================== */
const MM = { x0:BND.x0 - 12, z0:BND.z0 - 12, x1:BND.x1 + 12, z1:BND.z1 + 12, s:1.3 }, mapCv = document.createElement('canvas'), mctx = $('mini').getContext('2d'); let bigMap = false, mapN = 0;
{ mapCv.width = (MM.x1 - MM.x0)*MM.s; mapCv.height = (MM.z1 - MM.z0)*MM.s; const g = mapCv.getContext('2d'), s = MM.s, X = x => (x - MM.x0)*s, Z = z => (z - MM.z0)*s;
  g.fillStyle = '#84bd62'; g.fillRect(0, 0, mapCv.width, mapCv.height);
  g.fillStyle = '#e3bb4a'; for (let k = 0, P = innerP.wheat; k < P.length; k += 18) g.fillRect(X(P[k]), Z(P[k + 2]), (P[k + 6] - P[k])*s, (P[k + 5] - P[k + 2])*s);
  g.fillStyle = '#58a6d6'; g.beginPath(); g.ellipse(X(LAKE.x), Z(LAKE.z), LAKE.rx*s, LAKE.rz*s, 0, 0, 7); g.fill();
  const BC = { downtown:'#d9c9b0', bloki:'#c9cdd2', houses:'#a8d48a', villas:'#a8d48a', pond:'#8fcf73', forest:'#5da552', market:'#e9d7a8', farm:'#c9a86a', power:'#b9b4aa', mine:'#a39a8c', sawmill:'#b8a070', station:'#e0d4bc', town:'#e0d4bc' };
  blocks.forEach(B => { g.fillStyle = BC[B.type] || '#ccc'; g.fillRect(X(B.x0), Z(B.z0), BL*s, BL*s); });
  g.fillStyle = 'rgba(70,60,50,.55)'; solids.forEach(q => g.fillRect(X(q.x0), Z(q.z0), (q.x1 - q.x0)*s, (q.z1 - q.z0)*s));
  g.fillStyle = '#3f8a3a'; treesAt.forEach(t => { g.beginPath(); g.arc(X(t.x), Z(t.z), 2.2, 0, 7); g.fill(); });
  g.strokeStyle = '#5a5d63'; g.lineWidth = 14*s; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let j = 0; j <= NZ; j++) for (let i = 0; i < NX; i++) if (HE[j][i]) { g.beginPath(); g.moveTo(X(stX(i)), Z(stZ(j))); g.lineTo(X(stX(i + 1)), Z(stZ(j))); g.stroke(); }
  for (let j = 0; j < NZ; j++) for (let i = 0; i <= NX; i++) if (VE[j][i]) { g.beginPath(); g.moveTo(X(stX(i)), Z(stZ(j))); g.lineTo(X(stX(i)), Z(stZ(j + 1))); g.stroke(); }
  polyRoads.forEach(p => { g.beginPath(); p.forEach((q, k) => { if (k) g.lineTo(X(q.x), Z(q.z)); else g.moveTo(X(q.x), Z(q.z)); }); g.stroke(); });
  g.fillStyle = '#f5c41f'; ramps.forEach(r => { g.beginPath(); g.arc(X(r.x), Z(r.z), 4, 0, 7); g.fill(); });
  const rail = (col, lw, dash) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'butt'; g.setLineDash(dash); g.beginPath(); RAIL.P.forEach((q, k) => { if (k) g.lineTo(X(q.x), Z(q.z)); else g.moveTo(X(q.x), Z(q.z)); }); g.closePath(); g.stroke(); };
  rail('#2b2b2e', 5, []); rail('#f4f1e6', 2.6, [7, 7]); g.setLineDash([]); }
function drawMini() {
  const g = mctx, W = 300, c = S.veh === 'car' ? pc : lead, pulse = .5 + .5*Math.sin(time*6); g.clearRect(0, 0, W, W); let P;
  if (bigMap) { const k = W/(MM.x1 - MM.x0)*1.02; g.fillStyle = '#84bd62'; g.fillRect(0, 0, W, W); const oy = (W - (MM.z1 - MM.z0)*k)/2; g.drawImage(mapCv, 0, oy, (MM.x1 - MM.x0)*k, (MM.z1 - MM.z0)*k); P = (x, z) => [(x - MM.x0)*k, oy + (z - MM.z0)*k, 1]; }
  else { const R = 120, k = 150/R, th = c.h - Math.PI, cs = Math.cos(th), sn = Math.sin(th); g.save(); g.beginPath(); g.arc(150, 150, 150, 0, 7); g.clip(); g.fillStyle = '#84bd62'; g.fillRect(0, 0, W, W);
    g.translate(150, 150); g.rotate(th); g.scale(k/MM.s, k/MM.s); g.drawImage(mapCv, -(c.x - MM.x0)*MM.s, -(c.z - MM.z0)*MM.s); g.restore();
    P = (x, z) => { const dx = x - c.x, dz = z - c.z; let mx = (dx*cs - dz*sn)*k, my = (dx*sn + dz*cs)*k; const l = Math.hypot(mx, my), inside = l < 134; if (!inside) { mx *= 134/l; my *= 134/l; } return [150 + mx, 150 + my, inside]; }; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = (bigMap ? 15 : 22) + 'px sans-serif';
  mapIcons.forEach(q => { const p = P(q.x, q.z); if (p[2]) g.fillText(q.ico, p[0], p[1]); });
  const dot = (x, z, r, col, ring) => { const p = P(x, z); g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = ring || '#fff'; g.stroke(); return p; };
  { const p = P(lead.x, lead.z); if (p[2]) { g.font = '22px sans-serif'; g.fillText('🚂', p[0], p[1]); } }
  if (S.veh === 'car') { custs.forEach(q => { if (q.on && rides.length < CAP()) { const p = dot(q.poi.x, q.poi.z, bigMap ? 7 : 10 + pulse*2, '#' + VALC[q.val - 1].toString(16).padStart(6, '0')); if (q.an) { g.font = (bigMap ? 13 : 19) + 'px sans-serif'; g.fillText(q.an.ico, p[0], p[1] - 1); } } });
    if (AK === 'police' && POL.on) { const p = dot(sus.x, sus.z, 11 + pulse*4, '#ff2a1a'); g.font = (bigMap ? 14 : 20) + 'px sans-serif'; g.fillText('🚨', p[0], p[1]); }
    rides.forEach(r => { const p = dot(r.dest.x, r.dest.z, (bigMap ? 8 : 12) + pulse*4, '#ffd21f', '#1c1c1e'); g.font = (bigMap ? 14 : 20) + 'px sans-serif'; g.fillText('🏁', p[0], p[1] - 1); });
    { g.font = (bigMap ? 15 : 22) + 'px sans-serif'; const p = P(plane.position.x, plane.position.z); if (p[2]) g.fillText('✈️', p[0], p[1]); if (GIFT.on) { const q = dot(GIFT.x, GIFT.z, 10 + pulse*3, '#fff'); g.fillText('🎁', q[0], q[1]); } }
    if (ev) { g.font = (bigMap ? 15 : 22) + 'px sans-serif'; if (ev.k === 'zoo') evPeng.forEach(q => { if (q.on) { const p = P(q.x, q.z); g.fillText('🐧', p[0], p[1]); } }); else if (ev.k === 'thief') { const p = dot(thief.x, thief.z, 11 + pulse*3, '#ff2a1a'); g.fillText('🍦', p[0], p[1]); } else { const p = dot(ev.x, ev.z, 10 + pulse*3, '#fff'); g.fillText('🌟', p[0], p[1]); } } }
  const p = bigMap ? P(c.x, c.z) : [150, 150]; g.save(); g.translate(p[0], p[1]); if (bigMap) g.rotate(Math.PI - c.h); g.beginPath(); g.moveTo(0, -15); g.lineTo(10, 11); g.lineTo(0, 5); g.lineTo(-10, 11); g.closePath(); g.fillStyle = '#f7c81a'; g.fill(); g.lineWidth = 3.5; g.strokeStyle = '#1c1c1e'; g.stroke(); g.restore();
}
function toggleMap() { bigMap = !bigMap; $('mini').classList.toggle('big', bigMap); }
$('mini').addEventListener('click', toggleMap);

/* =====================================================================
   HUD, MENU, POJAZDY
   ===================================================================== */
const press = (el, fn) => { el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };

/* =====================================================================
   OBRĘCZE NAD SKOCZNIAMI
   ===================================================================== */
const hoops = []; ramps.forEach(r => [-1, 1].forEach(s => hoops.push({ x:r.x + r.fx*9*s, z:r.z + r.fz*9*s, fx:r.fx, fz:r.fz, h:r.h, cd:0, pa:0, dim:false })));
const hoopIM = new T.InstancedMesh(new T.TorusGeometry(2.35, .2, 8, 26), new T.MeshBasicMaterial({ color:0xffffff }), Math.max(1, hoops.length)), HC = [new T.Color(0xff7a1a), new T.Color(0x8a8f96)];
hoops.forEach((h, i) => { pdum.position.set(h.x, 4.3, h.z); pdum.rotation.set(0, h.h, 0); pdum.scale.setScalar(1); pdum.updateMatrix(); hoopIM.setMatrixAt(i, pdum.matrix); hoopIM.setColorAt(i, HC[0]); }); hoopIM.frustumCulled = false; scene.add(hoopIM);
function hoopsStep(dt) {
  const c = pc; for (let i = 0; i < hoops.length; i++) { const h = hoops[i]; if (h.cd > 0) { h.cd -= dt; if (h.cd <= 0) { hoopIM.setColorAt(i, HC[0]); hoopIM.instanceColor.needsUpdate = true; } }
    const dx = c.x - h.x, dz = c.z - h.z; if (Math.abs(dx) > 14 || Math.abs(dz) > 14) { h.pa = 0; continue; } const al = dx*h.fx + dz*h.fz;
    if (h.pa*al < 0 && h.cd <= 0 && S.veh === 'car' && Math.abs(dz*h.fx - dx*h.fz) < 2.2 && Math.abs(c.y + .8 - 4.3) < 2.2) { h.cd = 8; hoopIM.setColorAt(i, HC[1]); hoopIM.instanceColor.needsUpdate = true; addScore(2); chaosAdd(1); bigText('OBRĘCZ! +2 ⭐'); sfx.star();
      for (let k = 0; k < 14; k++) emit(h.x, 4.3, h.z, rr(-5, 5), rr(-2, 5), rr(-5, 5), .8, 1, .6, .15, 8); }
    h.pa = al; }
}

/* =====================================================================
   WYDARZENIA W MIEŚCIE: ucieczka pingwinów, złodziej lodów, deszcz gwiazdek
   ===================================================================== */
const evPeng = [], evStars = [];
for (let k = 0; k < 6; k++) { const g = zoo('penguin', .9); g.scale.setScalar(2.1); g.visible = false; scene.add(g); evPeng.push({ g, on:false, x:0, z:0, h:0 }); }
for (let k = 0; k < 18; k++) { const m = new T.Mesh(starGeo, starMat); m.visible = false; scene.add(m); evStars.push({ m, on:false, x:0, z:0 }); }
const thief = { g:vc(aiModel(0x8e3fc2, 2)), R:2, vmax:13.5, thief:true, off:true };
{ const pk = new T.MeshBasicMaterial({ color:0xff8fc8 }), wf = new T.MeshBasicMaterial({ color:0xe0a85a }), rd = new T.MeshBasicMaterial({ color:0xff2a1a, fog:false });
  const cn = mesh(new T.ConeGeometry(.55, 1.4, 10), wf, 0, 2.7, -.6, thief.g); cn.rotation.x = Math.PI; mesh(new T.SphereGeometry(.62, 10, 8), pk, 0, 3.6, -.6, thief.g); const mk = mesh(new T.ConeGeometry(.9, 1.7, 4), rd, 0, 6.2, 0, thief.g); mk.rotation.x = Math.PI;
  scene.add(thief.g); thief.g.visible = false; Object.assign(thief, { v:0, x:0, z:-9999, h:0, hx:0, hz:1, lane:1.75, mode:0, a:null, b:null, fx:0, fz:1, turn:null, spin:0, honk:0 }); traffic.push(thief); }
let ev = null, evT = 40, evN = (Math.random()*3) | 0, evHud = 0, evD = 0;
const arrow2 = new T.Group();                      // druga, mniejsza strzałka: prowadzi do wydarzenia albo paczki z samolotu
{ const src = arrow.userData.dial.children, dial = new T.Group(), m = new T.MeshBasicMaterial({ color:0xff3b2a, fog:false, depthTest:false, transparent:true }), e = new T.Mesh(src[0].geometry, src[0].material), a = new T.Mesh(src[0].geometry, m);
  e.scale.set(1.2, 1, 1.12); e.position.y = -.14; e.renderOrder = 9; a.renderOrder = 10; dial.add(e); dial.add(a); arrow2.add(dial); arrow2.userData.dial = dial; arrow2.userData.m = m; arrow2.rotation.order = 'YXZ'; arrow2.visible = false; scene.add(arrow2); }
function evArrow() {
  const c = pc; let tx = 0, tz = 0, bd = 1e9, col = 0xff3b2a; const tryP = (x, z) => { const d = Math.hypot(x - c.x, z - c.z); if (d < bd) { bd = d; tx = x; tz = z; } };
  if (S.veh === 'car' && S.running) { if (ev) { if (ev.k === 'thief') tryP(thief.x, thief.z); else if (ev.k === 'zoo') evPeng.forEach(p => { if (p.on) tryP(p.x, p.z); }); else evStars.forEach(s => { if (s.on) tryP(s.x, s.z); }); } else if (GIFT.on) { tryP(GIFT.x, GIFT.z); col = 0x3fb6ff; } }
  evD = bd; arrow2.visible = bd < 1e8 && bd > 12; if (!arrow2.visible) return;
  const pov = S.cam === 2, cy = pov ? c.h : camH, ax = c.x + Math.sin(c.h)*(pov ? 8 : 1.5), az = c.z + Math.cos(c.h)*(pov ? 8 : 1.5);
  arrow2.position.set(ax, c.y + (pov ? c.eye.y*(c === ursus ? 1.35 : 1) + 2.5 : c.lookY + (S.cam ? 7.5 : 3.9)) + Math.sin(time*7)*.1, az); arrow2.rotation.set(pov ? -1.25 : S.cam ? -.5 : -.95, cy, 0);
  arrow2.userData.dial.rotation.y = wrap(Math.atan2(tx - ax, tz - az) - cy); arrow2.userData.m.color.setHex(col); arrow2.scale.setScalar((pov ? .3 : S.cam ? .75 : .36)*(1 + Math.sin(time*7)*.06));
}
function roadPt(minD, maxD) { for (let t = 0; t < 80; t++) { const hz = Math.random() < .5, j = (Math.random()*(hz ? NZ + 1 : NZ)) | 0, i = (Math.random()*(hz ? NX : NX + 1)) | 0; if (!(hz ? HE[j][i] : VE[j][i])) continue;
  const u = RW + 4 + Math.random()*(BL - 8), o = [-5.25, -1.75, 1.75, 5.25][(Math.random()*4) | 0], x = hz ? stX(i) + u : stX(i) + o, z = hz ? stZ(j) + o : stZ(j) + u, d = Math.hypot(x - pc.x, z - pc.z); if (d > minD && d < maxD) return { x, z, hz, i, j }; } return null; }
function startEvent() {
  const k = ['zoo', 'thief', 'rain'][evN++ % 3];
  if (k === 'zoo') { let n = 0; evPeng.forEach(p => { const q = roadPt(50, 230); p.on = !!q; p.g.visible = p.on; if (q) { p.x = q.x; p.z = q.z; p.h = Math.random()*6.28; n++; } }); if (!n) return;
    ev = { k, t:80, left:n, n, ico:'🐧' }; bigText('UCIECZKA Z ZOO!'); toast('🐧 Pingwiny uciekły! Podjedź do każdego, żeby go złapać.'); sfx.peep(); }
  else if (k === 'thief') { for (let t = 0; t < 14; t++) { trafStart(thief); if (Math.hypot(thief.x - pc.x, thief.z - pc.z) > 70) break; } thief.off = false; thief.caught = false; thief.spin = 0; thief.g.visible = true;
    ev = { k, t:100, ico:'🍦' }; bigText('ZŁODZIEJ LODÓW!'); toast('🍦 Czerwona strzałka prowadzi do złodzieja. Staranuj fioletową furgonetkę!'); sfx.no(); }
  else { const q = roadPt(40, 200); if (!q) return; evStars.forEach((s, n) => { const u = RW + 3 + (n >> 1)*(BL - 6)/8, o = n % 2 ? 1.75 : -1.75; s.x = q.hz ? stX(q.i) + u : stX(q.i) + o; s.z = q.hz ? stZ(q.j) + o : stZ(q.j) + u; s.on = true; s.m.visible = true; s.m.position.set(s.x, 2.2, s.z); });
    ev = { k, t:40, left:evStars.length, ico:'🌟', x:evStars[9].x, z:evStars[9].z }; bigText('DESZCZ GWIAZDEK!'); toast('🌟 Cała ulica gwiazdek! Zbierz je, zanim znikną.'); sfx.star(); }
}
function endEvent(quiet) {
  if (!ev) return; evPeng.forEach(p => { p.on = false; p.g.visible = false; }); evStars.forEach(s => { s.on = false; s.m.visible = false; }); if (!thief.caught) { thief.off = true; thief.g.visible = false; }
  if (!quiet) toast(ev.ico + ' Koniec wydarzenia.'); ev = null; evT = 50 + Math.random()*35; $('evBox').hidden = true;
}
function catchThief() { thief.caught = true; thief.spin = 1.2; addScore(6); chaosAdd(2); sfx.win(); bigText('ZŁAPANY! +6 ⭐'); toast('🍦 Lody wracają do lodziarni!'); endEvent(true); }
function eventStep(dt) {
  const c = pc; if (S.veh !== 'car') return; if (!ev) { evT -= dt; if (evT <= 0) { evT = 15; startEvent(); } return; }
  ev.t -= dt;
  if (ev.k === 'zoo') { evPeng.forEach((p, n) => { if (!p.on) return; p.h += Math.sin(time*.7 + n*2)*dt*1.5; p.x += Math.sin(p.h)*1.3*dt; p.z += Math.cos(p.h)*1.3*dt; p.g.position.set(p.x, Math.abs(Math.sin(time*6 + n))*.25, p.z); p.g.rotation.y = p.h;
      if (Math.abs(p.x - c.x) < 3.6 && Math.abs(p.z - c.z) < 3.6 && c.y < 2.5) { p.on = false; p.g.visible = false; ev.left--; addScore(2); sfx.peep(); bigText('🐧 +2 ⭐'); for (let i = 0; i < 10; i++) emit(p.x, 1, p.z, rr(-3, 3), rr(2, 6), rr(-3, 3), .8, 1, 1, 1, 8); } });
    if (ev.left <= 0) { addScore(5); bigText('WSZYSTKIE W ZOO! +5 ⭐'); sfx.win(); endEvent(true); return; } }
  else if (ev.k === 'rain') { evStars.forEach((s, n) => { if (!s.on) return; s.m.rotation.y = time*3 + n; s.m.position.y = 2.2 + Math.sin(time*4 + n)*.3;
      if (Math.abs(s.x - c.x) < 3.2 && Math.abs(s.z - c.z) < 3.2 && c.y < 3) { s.on = false; s.m.visible = false; ev.left--; addScore(1); tone(700 + (18 - ev.left)*40, .15, 'triangle', .25, 1400); } }); if (ev.left <= 0) { bigText('WSZYSTKIE! 🌟'); endEvent(true); return; } }
  if (ev.t <= 0) { endEvent(false); return; }
  evHud -= dt; if (evHud <= 0) { evHud = .25; const b = $('evBox'); b.hidden = false; b.textContent = ev.ico + ' ' + (ev.k === 'zoo' ? (ev.n - ev.left) + '/' + ev.n : ev.k === 'rain' ? 'zostało ' + ev.left : 'goń go!') + (evD < 1e8 ? ' · ' + Math.round(evD) + ' m' : '') + ' · ' + Math.ceil(ev.t) + ' s'; }
}

/* =====================================================================
   POLICJA POSZUKUJE: w radiowozie zamiast pasażerów są zgłoszenia o uciekinierach
   ===================================================================== */
const SUSC = [['czerwone', 0xd8301f], ['zielone', 0x2f9a4a], ['czarne', 0x25262b], ['pomarańczowe', 0xff8a1a], ['białe', 0xf4f4f0], ['niebieskie', 0x2f7fd8]];
const susG = SUSC.map((q, k) => { const m = vc(aiModel(q[1], k % 3)), mk = mesh(new T.ConeGeometry(.9, 1.7, 4), new T.MeshBasicMaterial({ color:0xff2a1a, fog:false }), 0, 5.4, 0, m); mk.rotation.x = Math.PI; m.visible = false; scene.add(m); return m; });
const sus = { g:susG[0], R:2, vmax:12, sus:true, flee:true, off:true }; Object.assign(sus, { v:0, x:0, z:-9999, h:0, hx:0, hz:1, lane:1.75, mode:0, a:null, b:null, fx:0, fz:1, turn:null, spin:0, honk:0 }); traffic.push(sus); thief.flee = true;
const POL = { L:1, on:false, wait:2, t:0, T:75, hp:1, col:'' };
function polReset(full) { sus.off = true; sus.caught = false; sus.spin = 0; sus.g.visible = false; POL.on = false; POL.wait = 2; if (full) POL.L = 1; }
function polCall() {
  const k = (POL.L - 1) % SUSC.length; sus.g.visible = false; sus.g = susG[k]; for (let t = 0; t < 16; t++) { trafStart(sus); const d = Math.hypot(sus.x - pc.x, sus.z - pc.z); if (d > 80 && d < 260) break; }
  sus.vmax = Math.min(25, 10.5 + POL.L*1.4); sus.v = sus.vmax; sus.smart = POL.L >= 3; sus.off = false; sus.caught = false; sus.spin = 0; sus.g.visible = true; POL.on = true; POL.t = POL.T = 80; POL.hp = POL.L >= 5 ? 2 : 1; POL.col = SUSC[k][0];
  let p = POIS[0], bd = 1e9; POIS.forEach(q => { const d = Math.hypot(q.x - sus.x, q.z - sus.z); if (d < bd) { bd = d; p = q; } });
  [0, .12, .24].forEach(d => tone(1250, .07, 'square', .08, 0, d)); burst(2400, .25, .08, .3, 2); bigText('POSZUKIWANY nr ' + POL.L + '!'); toast('📻 Ucieka ' + POL.col + ' auto, ostatnio widziane: ' + p.ico + ' ' + p.name + (sirenOn ? '' : '. Włącz syrenę 🚨') + (POL.hp > 1 ? ' · trzeba trafić 2 razy' : '')); hudT = 0;
}
function catchSus() {
  if (--POL.hp > 0) { sus.spin = .6; sus.vmax += 2; bigText('TRAFIONY! Jeszcze raz!'); sfx.crash(1); chaosAdd(1); return; }
  const n = 2 + Math.ceil(POL.L/2) + (sirenOn ? 1 : 0); sus.caught = true; sus.spin = 1.2; POL.on = false; POL.wait = 3.5; addScore(n); chaosAdd(2); sfx.win(); bigText('ZATRZYMANY! +' + n + ' ⭐'); toast('🚓 Poszukiwany nr ' + POL.L + ' złapany' + (sirenOn ? ' · na sygnale +1 ⭐' : '') + '!'); POL.L++; if (S.arcade) S.clock += 15; hudT = 0;
}
function policeStep(dt) {
  const c = pc, bar = $('jobBar'); nearStop = false; beacons.forEach(b => { b.visible = false; });
  if (!POL.on) { POL.wait -= dt; if (POL.wait <= 0) polCall(); arrow.visible = false; hudT -= dt; if (hudT <= 0) { hudT = .3; $('jobTxt').textContent = '📻 Czekam na zgłoszenie…'; bar.hidden = true; } return; }
  POL.t -= dt; if (POL.t <= 0) { toast('💨 Uciekł! Następnego złapiemy.'); sfx.no(); polReset(false); return; }
  const d = Math.hypot(sus.x - c.x, sus.z - c.z); arrow.visible = d > 12 && S.running;
  if (arrow.visible) { const pov = S.cam === 2, cy = pov ? c.h : camH, ax = c.x + Math.sin(c.h)*(pov ? 8 : 1.5), az = c.z + Math.cos(c.h)*(pov ? 8 : 1.5); arrow.position.set(ax, c.y + (pov ? c.eye.y + 1.6 : c.lookY + (S.cam ? 4.5 : 2.2)) + Math.sin(time*5)*.12, az);
    arrow.rotation.set(pov ? -1.25 : S.cam ? -.5 : -.95, cy, 0); arrow.userData.dial.rotation.y = wrap(Math.atan2(sus.x - ax, sus.z - az) - cy); arrow.userData.m.color.setHex(0xff3b2a); arrow.scale.setScalar(pov ? .5 : S.cam ? 1.2 : .58); }
  hudT -= dt; if (hudT <= 0) { hudT = .2; $('jobTxt').textContent = '🚨 Poszukiwany nr ' + POL.L + ' · ' + POL.col + ' · ' + Math.round(d) + ' m'; bar.hidden = false; const f = clamp(POL.t/POL.T, 0, 1), i = bar.firstElementChild; i.style.width = (f*100) + '%'; i.style.background = f > .45 ? '#3f9a4a' : f > .15 ? '#f2a81f' : '#d9432a'; }
}
function clearCusts() { custs.forEach(q => { q.on = false; q.g.visible = false; q.hop = 0; if (q.an) { freeAnimal(q.an); q.an = null; } }); endRides(); outFxs.forEach(o => { o.o.visible = false; if (o.an) o.an.busy = false; }); outFxs.length = 0; custT = .5; }

/* =====================================================================
   SAMOLOT: krąży nad miastem z banerem i czasem zrzuca paczkę na spadochronie
   ===================================================================== */
const plane = new T.Group(), gift = new T.Group(), GIFT = { on:false, y:0, x:0, z:0, t:25 };
{ const pb = planeBody(0xd8301f); pb.children[0].children.forEach(m => { m.castShadow = false; }); plane.add(pb); plane.userData.prop = pb.userData.prop;
  const bm = signMat('TAXI CIUCHCIOWO', '#f7c81a', '#1c1c1e'); box(.04, 1.7, 9.5, bm, 0, -.2, -12, plane); box(.03, .03, 5, M.dark, 0, -.2, -5.5, plane); plane.scale.setScalar(1.5); scene.add(plane);
  box(1.1, 1.1, 1.1, lam(0xd8301f), 0, .55, 0, gift); box(1.14, 1.14, .22, lam(0xf5c41f), 0, .55, 0, gift); box(.22, 1.14, 1.14, lam(0xf5c41f), 0, .55, 0, gift);
  const ch = mesh(new T.SphereGeometry(1.7, 12, 6, 0, 6.3, 0, 1.4), lam(0xffffff, { side:T.DoubleSide }), 0, 3.4, 0, gift); gift.userData.ch = ch; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => { const l = box(.03, 2.4, .03, M.dark, q[0]*.7, 2.2, q[1]*.7, gift); l.rotation.set(q[1]*.3, 0, -q[0]*.3); gift.userData['l' + q] = l; });
  gift.visible = false; scene.add(gift); }
function planeStep(dt) {
  const a = time*.15, px = Math.cos(a)*150, pz = Math.sin(a)*105 - 8, py = 58 + Math.sin(time*.3)*6, tx = -Math.sin(a)*150, tz = Math.cos(a)*105;
  plane.position.set(px, py, pz); plane.rotation.set(0, Math.atan2(tx, tz), 0); plane.rotateZ(.22); plane.userData.prop.rotation.z += dt*40;
  const c = pc; GIFT.t -= dt;
  if (!GIFT.on && GIFT.t <= 0 && S.running && S.veh === 'car' && onRoad(px, pz) && Math.abs(px) < XMAX && Math.abs(pz) < ZMAX && !solids.some(q => px > q.x0 - 2 && px < q.x1 + 2 && pz > q.z0 - 2 && pz < q.z1 + 2)) { GIFT.on = true; GIFT.x = px; GIFT.z = pz; GIFT.y = py - 3; GIFT.t = 60; gift.visible = true; gift.userData.ch.visible = true; toast('🎁 Samolot zrzucił paczkę! Szukaj jej na mapie.'); }
  if (GIFT.on) { if (GIFT.y > 0) { GIFT.y = Math.max(0, GIFT.y - 7*dt); if (GIFT.y === 0) { gift.userData.ch.visible = false; sfx.thud(); } } else if (GIFT.t <= 0) { GIFT.on = false; gift.visible = false; GIFT.t = 30; }
    gift.position.set(GIFT.x + (GIFT.y > 0 ? Math.sin(time*1.5)*1.2 : 0), GIFT.y, GIFT.z); gift.rotation.y = GIFT.y > 0 ? time : 0; Object.keys(gift.userData).forEach(k => { if (k[0] === 'l') gift.userData[k].visible = GIFT.y > 0; });
    if (S.veh === 'car' && Math.abs(c.x - GIFT.x) < 3.6 && Math.abs(c.z - GIFT.z) < 3.6 && Math.abs(c.y - GIFT.y) < 4) { GIFT.on = false; gift.visible = false; GIFT.t = 35; const air = GIFT.y > 0; addScore(air ? 6 : 3); sfx.win(); bigText(air ? 'PACZKA W LOCIE! +6 ⭐' : '🎁 +3 ⭐'); for (let i = 0; i < 18; i++) emit(GIFT.x, GIFT.y + 1, GIFT.z, rr(-5, 5), rr(3, 8), rr(-5, 5), 1, 1, rr(.3, .9), .2, 10); } }
}

/* =====================================================================
   GARAŻ: lakiery, klaksony i turbo za zebrane gwiazdki
   ===================================================================== */
const PAINTS = [['p0', 'Żółta', 0xf7c81a, 0], ['p1', 'Różowa', 0xff6fb5, 8], ['p2', 'Zielona', 0x35c26a, 8], ['p3', 'Czarna', 0x25262b, 8], ['p4', 'Tęczowa', -1, 20]];
const HORNS = [['h0', 'Zwykły', 0], ['h1', 'La Cucaracha', 10], ['h2', 'Muuu!', 10], ['h3', 'Kwa-kwa', 10], ['h4', 'Syrena', 10]], TURBOS = [['t1', 'Turbo+', 12], ['t2', 'Turbo MAX', 25]];
let taxiPaint = null; AUTOS.taxi.car.inner.traverse(m => { if (m.isMesh && m.material.isMeshStandardMaterial && m.material.color.getHex() === 0xf7c81a) taxiPaint = m.material; });
function applyPaint() { const p = PAINTS.find(q => q[0] === GAR.paint) || PAINTS[0]; if (taxiPaint && p[2] >= 0) taxiPaint.color.setHex(p[2]); }
const turboLv = () => GAR.own.includes('t2') ? 2 : GAR.own.includes('t1') ? 1 : 0;
function melody(id) {
  if (id === 'h1') [[392, 0], [392, .13], [392, .26], [523, .39], [659, .65], [392, .95], [392, 1.08], [392, 1.21], [523, 1.34], [659, 1.6]].forEach(q => { tone(q[0], .2, 'sawtooth', .11, 0, q[1]); tone(q[0]*2, .2, 'square', .03, 0, q[1]); });
  else if (id === 'h2') { sfx.moo(); tone(140, 1.1, 'sawtooth', .2, 95, .15); }
  else if (id === 'h3') [0, .22, .44].forEach(d => { tone(520, .14, 'square', .12, 300, d); burst(1200, .12, .15, d, 2); });
  else for (let k = 0; k < 2; k++) { tone(650, .35, 'sawtooth', .1, 950, k*.7); tone(950, .35, 'sawtooth', .1, 650, k*.7 + .35); }
}
function drawGarage() {
  const el = $('gList'); el.innerHTML = ''; $('gBank').textContent = GAR.bank; $('gJump').textContent = GAR.jump ? 'Rekord skoku: ' + GAR.jump + ' m' : '';
  const sec = (title, items, kind) => { const h = document.createElement('div'); h.className = 'gh'; h.textContent = title; el.appendChild(h); const row = document.createElement('div'); row.className = 'gr'; el.appendChild(row);
    items.forEach((it, n) => { const price = it[it.length - 1], own = GAR.own.includes(it[0]), sel = kind === 'p' ? GAR.paint === it[0] : kind === 'h' ? GAR.horn === it[0] : false, lock = kind === 't' && n === 1 && !GAR.own.includes('t1');
      const b = document.createElement('button'); b.className = 'btn'; b.setAttribute('aria-pressed', String(sel || (kind === 't' && own))); b.innerHTML = it[1] + '<small>' + (sel ? 'wybrane ✓' : own ? (kind === 't' ? 'masz ✓' : 'wybierz') : lock ? 'najpierw Turbo+' : price + ' ⭐') + '</small>';
      b.addEventListener('click', () => { initAudio(); if (!own) { if (lock || GAR.bank < price) { sfx.no(); return; } GAR.bank -= price; GAR.own.push(it[0]); sfx.cash(); }
        if (kind === 'p') { GAR.paint = it[0]; applyPaint(); } else if (kind === 'h') { GAR.horn = it[0]; if (it[0] !== 'h0') melody(it[0]); } save(); drawGarage(); }); row.appendChild(b); }); };
  sec('Lakier taksówki', PAINTS, 'p'); sec('Klakson', HORNS, 'h'); sec('Turbo', TURBOS, 't');
}
tap('bGar', () => { $('garage').hidden = false; drawGarage(); }); tap('gBack', () => { $('garage').hidden = true; $('bGarN').textContent = GAR.bank; });
applyPaint();

function nextCam() { S.cam = (S.cam + 1) % 3; camSnap = S.cam === 2; toast(['Kamera: za autem', 'Kamera: z góry', 'Kamera: zza kierownicy'][S.cam]); }
const PICKS = [['taxi', AUTOS.taxi], ['plane', AUTOS.plane], ['police', AUTOS.police], ['race', AUTOS.race], ['bus', AUTOS.bus], ['ursus', AUTOS.ursus]];
function togglePick() { const p = $('pick'); if (!p.hidden) { p.hidden = true; return; } p.innerHTML = '';
  PICKS.forEach(q => { const b = document.createElement('button'); b.className = 'btn'; b.setAttribute('aria-pressed', String(S.veh === 'car' ? q[0] === AK : q[0] === TRkey)); b.innerHTML = '<span class="em">' + q[1].ico + '</span>' + q[1].name + '<small>' + q[1].sub + '</small>';
    b.addEventListener('click', () => selectVeh(q[0])); p.appendChild(b); }); p.hidden = false; }
function selectVeh(key) {
  $('pick').hidden = true; camSnap = true;
  if (AUTOS[key]) { const o = pc, was = S.veh === 'car'; if (was && key === AK) return; sirenOn = false; if (key === 'police' || AK === 'police') { clearCusts(); polReset(false); } o.g.visible = false; AK = key; AV = AUTOS[key]; pc = AV.car;
    if (was) Object.assign(pc, { x:o.x, z:o.z, h:o.h, y:o.y, vx:0, vz:0, vy:0, air:false, v:0 });
    else { let b = POIS[0], bd = 1e9; POIS.forEach(p => { const d = Math.hypot(p.x - lead.x, p.z - lead.z); if (d < bd) { bd = d; b = p; } }); Object.assign(pc, { x:b.x, z:b.z, h:b.h, y:0, vx:0, vz:0, vy:0, air:false }); S.veh = 'car'; document.body.classList.remove('train'); tV = 0; }
    pc.g.visible = true; pc.steer = 0; offK = 0; syncAuto(); if (AU.ctx) AU.mot.gain.setTargetAtTime(0, AU.ctx.currentTime, .1); if (rides.length > CAP()) { rides.splice(CAP()).forEach(r => freeAnimal(r.an)); toast('Do tego auta mieści się tylko jeden pasażer 🙂'); } remount(); if (key === 'police') { sirenOn = true; toast('🚓 Zamiast pasażerów dostaniesz zgłoszenia. Czerwona strzałka prowadzi do uciekiniera. Trąbka wyłącza syrenę.'); } else horn(); if (key === 'plane') toast('🛩️ Trzymaj gaz, żeby lecieć. Puść, a samolot sam opadnie i wyląduje.'); }
  else { if (rides.length) { endRides(); toast('Pasażerowie poczekają na następną taksówkę 🙂'); } S.veh = 'train'; setConsist(key); document.body.classList.add('train'); pc.vx = pc.vz = 0; tHold = 0; arrow.visible = false; horn(); toast('Puść gaz przed stacją, a pociąg sam stanie przy peronie 🚉');
    engineOff(); if (AU.ctx) { const t = AU.ctx.currentTime; AU.mot.gain.setTargetAtTime(0, t, .1); AU.roll.gain.setTargetAtTime(0, t, .1); } }
  const ico = (PICKS.find(q => q[0] === key) || PICKS[0])[1].ico; $('spdIco').textContent = ico; $('swapIco').textContent = ico; hudT = 0;
}
{ const b = $('bHorn'); b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} hornOn(); }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, hornOff)); } press($('cTurbo'), turbo); tap('bCam', nextCam); tap('bSwap', togglePick);
$('c').addEventListener('pointerdown', () => { $('pick').hidden = true; if (bigMap) toggleMap(); });

tap('bSnd', () => { S.muted = !S.muted; initAudio(); if (AU.master) AU.master.gain.value = S.muted ? 0 : .7; syncSnd(); save(); });
function showMenu(kind) {
  S.running = false; arrow2.visible = false; $('menu').hidden = false; $('hud').hidden = !S.started; keys.fwd = keys.back = keys.left = keys.right = 0;
  $('bBack').hidden = !(S.started && !S.over); $('bGarN').textContent = GAR.bank; $('bestTxt').textContent = best ? 'rekord: ' + best + ' ⭐' : 'zdąż przed zegarem';
  if (kind === 'over') { $('mTitle').textContent = 'Koniec czasu!'; $('mSub').textContent = 'Wynik: ' + score + ' ⭐' + (score >= best && score > 0 ? ' · nowy rekord! 🏆' : best ? ' · rekord: ' + best : ''); }
  else { $('mTitle').textContent = 'Taxi Ciuchciowo!'; $('mSub').textContent = S.started ? 'Przerwa na lody 🍦' : 'Miasto, wieś, kury i pociągi'; }
  if (AU.ctx) { const t = AU.ctx.currentTime; [AU.mot, AU.hiss, AU.roll].forEach(n => n.gain.setTargetAtTime(0, t, .1)); } engineOff();
}
function syncTilt() { const on = S.ctrl === 'tilt'; $('bTilt').setAttribute('aria-pressed', on); $('tiltLbl').textContent = on ? 'wł.' : 'wył.'; }
tap('bTilt', () => { S.ctrl = S.ctrl === 'tilt' ? 'joy' : 'tilt'; syncTilt(); save(); });
tap('bCal', () => { tilt.cal = true; toast('🎯 Środek ustawiony'); });
syncTilt();
async function useTilt() {                        // przed jazdą: włącz albo wyłącz żyroskop (iPhone pyta o zgodę przy dotknięciu)
  if (S.ctrl === 'tilt') { const ok = await enableTilt(); tilt.on = ok; if (!ok) { S.ctrl = 'joy'; syncTilt(); save(); setTimeout(() => toast('Przechylanie tu nie działa. Wracam do kółka.'), 300); } else setTimeout(() => toast('📱 Przechylaj telefon: w bok skręca, od siebie gaz. 🎯 ustawia środek.'), 2800); }
  else tilt.on = false;
  document.body.classList.toggle('tilt', tilt.on);
}
function startGame(arcade) {
  initAudio(); initEngine(); useTilt(); const fresh = !S.started || S.over || arcade !== S.arcade; S.arcade = arcade; S.over = false; S.started = true; S.running = true; $('menu').hidden = true; $('hud').hidden = false; $('clockBox').hidden = !arcade; camSnap = true;
  if (fresh) { score = 0; chaos = 0; chaosStar = 0; addScore(0); chaosAdd(0); S.clock = 75; endRides(); outFxs.forEach(o => { o.o.visible = false; }); outFxs.length = 0; custs.forEach(q => { q.on = false; q.g.visible = false; q.hop = 0; q.an = null; }); ZOOA.forEach(freeAnimal); endEvent(true); evT = 40; polReset(true); custT = .3; hudT = 0;
    toast(arcade ? 'Zdąż z pasażerami, zanim skończy się czas!' : 'Przesuń żółte kółko ▲ ◀ ▶, żeby jechać. Zielona strzałka: pasażer.'); }
}
tap('bGo', () => startGame(false)); tap('bArc', () => startGame(true)); tap('bBack', () => { initAudio(); initEngine(); useTilt(); S.running = true; $('menu').hidden = true; }); tap('bMenu', () => showMenu('pause'));
tap('bNew', () => { try { location.reload(); } catch (e) { toast('Odśwież stronę, żeby wylosować nowe miasto'); } });
syncSnd();

/* =====================================================================
   START I PĘTLA
   ===================================================================== */
{ const pool = WEATHERS.filter(w => w.id !== 'fog'), tot = pool.reduce((a, w) => a + w.p, 0); let r = Math.random()*tot, w = pool[0]; for (const q of pool) { r -= q.p; if (r <= 0) { w = q; break; } }
  applyWeather(w); FAC.forEach(m => { m.emissive.setHex(w.lamp >= .5 ? 0xffffff : 0); m.emissiveIntensity = Math.min(1, w.lamp)*.85; }); }
placePlayer(); pc.g.visible = true; syncAuto(); placeTrain();
let plantT = 0;
function update(dt) {
  time += dt;
  readInput(dt); if (S.veh === 'car') { if (AK === 'plane') flyPlane(dt); else driveCar(dt); }
  trainStep(dt); crossingsStep(dt); trafStep(dt); actorsStep(dt); propsStep(dt); jobsStep(dt); starsStep(dt); hoopsStep(dt); eventStep(dt); evArrow();
  if (GAR.paint === 'p4' && taxiPaint) taxiPaint.color.setHSL(time*.3 % 1, .85, .55);
  plantT += dt; if (plantT > 1.2 && PLOTS.power) { plantT = 0; const a = lotW('power', 3.3, 1.2), b = lotW('power', 4.2, -4.4); puff(a.x, 8, a.z, rr(-.2, .2), 2.6, rr(-.2, .2), 3.6, 2.4, 1); puff(b.x, 14.4, b.z, rr(-.1, .1), 3, rr(-.1, .1), 3, 1.1, .6); }
  if (S.veh === 'train' && AU.ctx) { const t = AU.ctx.currentTime, sp = Math.abs(tV), st = TR.kind === 'steam', pd = TR.kind === 'pend'; AU.roll.gain.setTargetAtTime(sp/VMAX*.5, t, .15);
    AU.mot.gain.setTargetAtTime(!st ? .035 + sp/VMAX*.08 : 0, t, .12); const f = (pd ? 120 : 70) + sp*(pd ? 17 : 13); AU.motO[0].frequency.setTargetAtTime(f, t, .1); AU.motO[1].frequency.setTargetAtTime(f*2.01, t, .1); }
  if (AU.ctx) AU.rainG.gain.setTargetAtTime(WX.rain ? .11 : 0, AU.ctx.currentTime, .3);
  $('spd').textContent = Math.round(Math.abs(S.veh === 'car' ? pc.v || 0 : tV)*3.6);
  if (S.arcade) { S.clock -= dt; const s = Math.max(0, Math.ceil(S.clock)); $('clock').textContent = s; $('clockBox').classList.toggle('low', s <= 10);
    if (S.clock <= 0) { S.over = true; if (score > best) { best = score; save(); } sfx.no(); showMenu('over'); } }
  if (++mapN % 2 === 0) drawMini();
}
let last = performance.now(), lastRaw = last, qAcc = 0, qN = 0, qLevel = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last)/1000); last = now;
  updateBirds(now/1000);
  if (S.running && now - lastRaw < 400) { qAcc += now - lastRaw; if (++qN >= 90) { const avg = qAcc/qN; qAcc = 0; qN = 0;
    if (avg > 38 && qLevel < 2) { qLevel++; if (qLevel === 1) { renderer.setPixelRatio(1); resize(); } else sun.castShadow = false; } } }
  lastRaw = now;
  updateRain(dt); turbines.forEach(t => { t.rotation.z += dt*.9; });
  spinners.forEach(s => { s.m.rotation[s.ax] += dt*s.sp; }); for (let k = 0; k < anims.length; k++) anims[k](now/1000);
  clouds.forEach(c => { c.position.x += dt*1.6; if (c.position.x > 400) c.position.x = -400; });
  planeStep(dt);
  if (S.running) update(dt); else if (!S.started) { time += dt; trainStep(dt); crossingsStep(dt); trafStep(dt); actorsStep(dt); }
  updateParticles(dt); updatePuffs(dt); updateCamera(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
