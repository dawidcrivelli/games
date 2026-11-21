'use strict';
if (!window.THREE) { $('err').style.display = 'flex'; $('menu').hidden = true; throw new Error('brak three.js'); }
const T = THREE;

/* =====================================================================
   USTAWIENIA I STAN
   ===================================================================== */
const S = { cam:1, mode:'drive', tool:'draw', kind:'track', veh:'train', muted:false, running:false, menu:'start' };
const TS = 14, GW = 30, GH = 20;                   // kratka 14 m, plansza 30 × 20 kratek
const RV = 20, RH = 7;                             // drogi: pionowa w kolumnie RV, pozioma w wierszu RH
const HALF_X = GW*TS/2, HALF_Z = GH*TS/2;
const DX = [0, 1, 0, -1], DZ = [-1, 0, 1, 0];      // strony kratki: 0 północ, 1 wschód, 2 południe, 3 zachód
const tileX = i => (i - (GW - 1)/2)*TS, tileZ = j => (j - (GH - 1)/2)*TS;
const inGrid = (i, j) => i >= 0 && j >= 0 && i < GW && j < GH;
let grid = new Uint8Array(GW*GH);                  // bity połączeń z sąsiadami
const blocked = new Uint8Array(GW*GH);             // kratki zajęte przez budynki
// [kolumna, wiersz, strona z rampą/peronem]
const PLACES = { station:[5, 3, 2], mine:[14, 3, 2], town:[24, 3, 2], housesA:[23, 3, 2], housesB:[25, 3, 2], power:[27, 10, 3], zoo:[22, 16, 0], sawmill:[8, 16, 0], forest:[7, 16, 0], pond:[13, 14, 2] };
Object.keys(PLACES).forEach(k => { blocked[PLACES[k][1]*GW + PLACES[k][0]] = 1; });
let road = new Uint8Array(GW*GH);                  // bity połączeń dróg, tak jak w torach
const roadType = idx => { const r = road[idx]; return r === 5 ? 1 : r === 10 ? 2 : r ? 3 : 0; };   // 1 prosta północ–południe, 2 wschód–zachód, 3 zakręt, skrzyżowanie albo koniec

let savedGrid = null, savedStars = 0, savedTrain = null, savedRoads = null, savedAuto = null;
try {
  const sv = JSON.parse(localStorage.getItem('ciuchcia') || 'null');
  if (sv) { S.muted = !!sv.muted; savedStars = sv.stars | 0; savedTrain = sv.train || null; savedAuto = sv.auto || null; if (Array.isArray(sv.roads) && sv.roads.length === GW*GH) savedRoads = sv.roads; if (Array.isArray(sv.grid) && sv.grid.length === GW*GH) savedGrid = sv.grid; }
} catch (e) {}
const save = () => { try { localStorage.setItem('ciuchcia', JSON.stringify({ muted:S.muted, grid:Array.from(grid), stars:score, train:TRkey, roads:Array.from(road), auto:S.veh === 'car' ? AK : null })); } catch (e) {} };

let seed = 12345;

let time = 0;
const tmpV = new T.Vector3();

/* =====================================================================
   RENDERER, SCENA, ŚWIATŁO
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

{ // łąka z plamami koloru
  const g = new T.PlaneGeometry(1900, 1900, 90, 90); g.rotateX(-Math.PI/2);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), n = vnoise(x/38 + 9, z/38 + 4)*.6 + vnoise(x/11, z/11)*.4, k = .8 + n*.36;
    col.push(k*(.96 + n*.1), k, k*(.86 + n*.1)); }
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  const ground = new T.Mesh(g, lam(0xffffff, { map:grassTex, vertexColors:true })); ground.receiveShadow = true; scene.add(ground);
}

{ // drzewa liściaste, świerki, wzgórza
  const N = 300, trunks = new T.InstancedMesh(new T.CylinderGeometry(.26, .42, 3, 6), lam(0x6d4b2c), N),
        crowns = new T.InstancedMesh(new T.IcosahedronGeometry(2, 1), lam(0xffffff), N*3),
        firs = new T.InstancedMesh(new T.ConeGeometry(2, 3, 7), lam(0xffffff), N*3), d = new T.Object3D(), c = new T.Color();
  let n = 0, nc = 0, nf = 0, guard = 0;
  while (n < N && guard++ < 20000) {
    const x = rr(-HALF_X - 170, HALF_X + 170), z = rr(-HALF_Z - 170, HALF_Z + 150);
    if ((Math.abs(x) < HALF_X + 10 && Math.abs(z) < HALF_Z + 10) || Math.abs(x - tileX(RV)) < 7 || Math.abs(z - tileZ(RH)) < 7) continue;
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
  [[-500,-520,140],[80,-600,180],[560,-460,150],[-640,100,170],[660,160,180],[0,560,190],[-420,500,140],[460,540,150]].forEach(h => {
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
  [[18, 8, .4, 1], [26, 14, 2.2, 0], [15, 24, -1, 1], [30, -4, 3.5, 0], [-17, 12, 1.9, 1], [-26, 20, -.4, 0], [-19, -14, 2.8, 1]].forEach(p => { const c = cow(p[3]); c.position.set(p[0] + Math.sign(p[0])*HALF_X, 0, p[1]); c.rotation.y = p[2]; c.scale.setScalar(1.15); scene.add(c); });
}
{ // maki, chabry i rumianki na całej łące
  const N = 1700, fl = new T.InstancedMesh(new T.SphereGeometry(.075, 6, 4), lam(0xffffff), N), d = new T.Object3D(), c = new T.Color();
  for (let i = 0; i < N; i++) { d.position.set(rr(-HALF_X - 14, HALF_X + 14), rr(.16, .34), rr(-HALF_Z - 12, HALF_Z + 12)); d.scale.set(1, .6, 1); d.updateMatrix(); fl.setMatrixAt(i, d.matrix);
    const k = rnd(); c.setHex(k < .45 ? 0xe5332a : k < .75 ? 0x3d63d8 : k < .9 ? 0xf6f1e3 : 0xf5c41f); fl.setColorAt(i, c); }
  scene.add(fl);
}
{ // kępy trawy dookoła planszy
  const parts = []; for (let i = 0; i < 6; i++) { const c = new T.ConeGeometry(.045, rr(.35, .6), 3, 1, true).toNonIndexed(); c.translate(0, .22, 0);
    c.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(rr(-.5, .5), rnd()*6, rr(-.5, .5)))); c.translate(rr(-.12, .12), 0, rr(-.12, .12)); parts.push(c); }
  const N = 2400, gm = new T.InstancedMesh(mergeGeos(parts), lam(0xffffff, { side:T.DoubleSide }), N), d = new T.Object3D(), c = new T.Color(); let n = 0, guard = 0;
  while (n < N && guard++ < 20000) { const x = rr(-HALF_X - 16, HALF_X + 16), z = rr(-HALF_Z - 16, HALF_Z + 16);
    if ((Math.abs(x) < HALF_X + .5 && Math.abs(z) < HALF_Z + .5) || Math.abs(x - tileX(RV)) < 4.5 || Math.abs(z - tileZ(RH)) < 4.5) continue;
    d.position.set(x, 0, z); d.rotation.y = rnd()*6; const s = rr(.7, 1.5); d.scale.set(s, s*rr(.8, 1.3), s); d.updateMatrix(); gm.setMatrixAt(n, d.matrix);
    c.setHSL(rr(.24, .31), rr(.45, .62), rr(.3, .44)); gm.setColorAt(n++, c); }
  gm.count = n; gm.receiveShadow = true; scene.add(gm);
}

/* =====================================================================
   MIEJSCA NA PLANSZY: dworzec, kopalnia, tartak, las, zoo, staw
   (stoją na stałe; w kolejnym etapie będą celami przewozów)
   ===================================================================== */
const spinners = [], ROT = [Math.PI, Math.PI/2, 0, -Math.PI/2];      // obrót budynku według strony z rampą
function placeAt(g, key, keep) {                   // przód budynku (+Z) zwrócony do swojej rampy
  const p = PLACES[key], out = keep ? g : bake(g);
  out.position.set(tileX(p[0]), 0, tileZ(p[1])); out.rotation.y = ROT[p[2]]; scene.add(out); return out;
}

function buildStation(key, name, wallC, roofC) {
  const b = new T.Group(), hb = new T.Group(), wall = lam(wallC);
  gableHouse(hb, 5.6, 4.1, 10.6, wall, lam(roofC), .72, lam(wallC, { side:T.DoubleSide })); hb.rotation.y = Math.PI/2; hb.position.set(0, .4, 1.4); b.add(hb);
  box(11.2, .5, 6.2, M.stone, 0, .25, 1.4, b); box(.8, 1.5, .8, M.brick, 3.2, 7.2, 1.4, b);
  box(1.3, 2.3, .1, M.woodL, 0, 1.7, 4.23, b); box(1.5, .14, .14, M.white, 0, 2.9, 4.24, b);
  [-3.6, -1.9, 1.9, 3.6].forEach(x => { box(1.05, 1.25, .08, M.win, x, 2.6, 4.22, b); box(1.2, .1, .1, M.white, x, 2.6, 4.24, b); box(.1, 1.35, .1, M.white, x, 2.6, 4.24, b); box(1.3, .12, .16, M.white, x, 1.92, 4.25, b); });
  [-3.6, 0, 3.6].forEach(x => { box(1.05, 1.25, .08, M.win, x, 2.6, -1.42, b); });
  groundPad(b, M.pad, 13, 4.2, 7.1);
  ramp(b, 13);
  // wiata nad peronem
  [-4.5, 0, 4.5].forEach(x => cylY(.08, 2.9, M.steel, x, 2.0, 8.3, b, 8));
  const cn = box(11.5, .14, 3.6, lam(roofC), 0, 3.5, 8.6, b); cn.rotation.x = .1;
  // ławka, lampy, zegar
  box(2.2, .1, .5, M.woodL, -2.6, 1.05, 7.6, b); box(2.2, .5, .08, M.woodL, -2.6, 1.4, 7.38, b); [-3.5, -1.7].forEach(x => box(.1, .5, .45, M.dark, x, .8, 7.6, b));
  [-5.9, 5.9].forEach(x => { cylY(.07, 3.6, M.dark, x, 2.35, 10.6, b, 8); mesh(new T.SphereGeometry(.26, 10, 8), M.lamp, x, 4.25, 10.6, b); cylY(.3, .06, M.dark, x, 4.5, 10.6, b, 10); });
  cylY(.07, 3.2, M.dark, 3.4, 2.15, 10.9, b, 8); cylX(.52, .22, M.dark, 3.4, 3.9, 10.9, b, 18); cylX(.45, .24, M.gaugeW, 3.4, 3.9, 10.9, b, 18);
  [-1, 1].forEach(s => { box(.02, .34, .05, M.dark, 3.4 + s*.125, 4.04, 10.9, b); const h = box(.02, .05, .24, M.dark, 3.4 + s*.125, 3.9, 10.99, b); h.rotation.x = .2; });
  nameBoard(b, name, -3.6, 10.9);
  placeAt(b, key);
}
buildStation('station', 'CIUCHCIOWO', 0xf3e6c8, 0xa6432f); buildStation('town', 'BOCIANOWO', 0xe8eef2, 0x3f6f9a);
['housesA', 'housesB'].forEach((key, n) => {       // domki Bocianowa
  const b = new T.Group(), cols = [[0xf6d9a8, 0x9a4a36], [0xd9e8c8, 0x5a6f7a], [0xf2c9c0, 0x7a4a36], [0xe6e0f2, 0xa6432f]];
  [[-3.2, -2.5, 0], [3, -3, 1], [n ? -2.6 : 2.6, 3.2, 2]].forEach((q, k) => { const h = new T.Group(), c = cols[(k + n*2) % 4];
    gableHouse(h, 4.6, 3, 5.2, lam(c[0]), lam(c[1]), .75, lam(c[0], { side:T.DoubleSide })); box(.9, 1.7, .08, M.woodL, 0, .85, 2.63, h); [-1.4, 1.4].forEach(x => box(.9, .9, .08, M.win, x, 1.8, 2.63, h)); box(.6, 1.2, .6, M.brick, 1.2, 4.6, -1, h);
    h.position.set(q[0], 0, q[1]); h.rotation.y = q[2]*.5 - .3; b.add(h); });
  for (let k = 0; k < 4; k++) { const x = rr(-6, 6), z = rr(-6, 6); cone(.2, .14, 1.6, lam(0x6d4b2c), x, .8, z, b, 6); ell(1.1, 1.2, 1.1, lam(k % 2 ? 0x4f9a48 : 0x6fae49), x, 2.3, z, b, 10); }
  if (n) { const nest = new T.Group(); cylY(.12, 6, M.woodD, 5.2, 3, 4.8, nest, 6); cylY(.7, .25, lam(0x8a6a3a), 5.2, 6.1, 4.8, nest, 10); ell(.22, .3, .4, M.flagW, 5.2, 6.6, 4.8, nest, 8); cone(.03, .03, .5, lam(0xd8301f), 5.2, 6.3, 4.8, nest, 4); ell(.09, .09, .09, M.flagW, 5.2, 6.95, 5.1, nest, 6); const bk = cone(.03, .005, .4, lam(0xd8301f), 5.2, 6.9, 5.35, nest, 4); bk.rotation.x = Math.PI/2; b.add(nest); }   // bocian na gnieździe
  placeAt(b, key);
});
{ // kopalnia
  const b = new T.Group(), st = pho(0x4a5560, { metalness:.5, roughness:.5 });
  groundPad(b, M.pad, 13.4, -6.8, 12);
  box(6, 4.2, 5, M.brick, -3.4, 2.1, -1.5, b); box(6.5, .3, 5.5, M.dark, -3.4, 4.35, -1.5, b);
  [-5, -3.4, -1.8].forEach(x => box(.9, 1.3, .08, M.win, x, 2.6, 1.02, b)); box(.9, .9, .9, M.brick, -5.2, 5, -2.6, b);
  box(4.3, .85, .1, signMat('KOPALNIA', '#1c1c1e', '#f2c230'), -3.4, 3.72, 1.04, b);
  // wieża szybowa
  const tx = 2.6, tz = -2.2;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => box(.32, 10, .32, st, tx + p[0]*1.25, 5, tz + p[1]*1.25, b));
  [2.6, 5.4, 8.2].forEach(y => { [-1, 1].forEach(s => { box(2.8, .2, .2, st, tx, y, tz + s*1.25, b); box(.2, .2, 2.8, st, tx + s*1.25, y, tz, b); });
    const d = box(.16, 3.9, .16, st, tx, y - 1.4, tz + 1.25, b); d.rotation.z = .73; });
  box(3.4, .25, 3.4, st, tx, 10.1, tz, b); box(3.9, .2, 3.9, lam(0x7a2f25), tx, 12.9, tz, b); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => box(.16, 2.7, .16, st, tx + p[0]*1.5, 11.5, tz + p[1]*1.5, b));
  const strut = box(.34, 11.6, .34, st, tx - 3.1, 5.2, tz, b); strut.rotation.z = -.56;
  // zasobnik węgla nad rampą i hałda
  [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(p => box(.26, 3.7, .26, st, 3.2 + p[0], 2.4, 9 + p[1], b));
  box(3.2, 2.2, 3.2, st, 3.2, 5.2, 9, b); const ch = box(1.1, .16, 2.4, st, 3.2, 3.7, 11.2, b); ch.rotation.x = .5;
  const cv = box(.9, .3, 9.4, M.dark, 3, 3.5, 3.6, b); cv.rotation.x = -.58;
  const heap = mesh(new T.ConeGeometry(3.3, 2.8, 9), M.coal, -3.3, 1.4, 7.6, b); heap.rotation.y = .4;
  mesh(new T.ConeGeometry(1.6, 1.3, 7), M.coal, -.6, .65, 9.6, b);
  box(13.4, .55, 2.4, M.concrete, 0, .275, 10.8, b);
  placeAt(b, 'mine');
  const p = PLACES.mine;
  [-.55, .55].forEach(o => { const w = new T.Group(); const t = mesh(new T.TorusGeometry(1.05, .1, 6, 22), st, 0, 0, 0, w); t.castShadow = true;
    for (let i = 0; i < 3; i++) { const s = box(2, .1, .08, st, 0, 0, 0, w); s.rotation.z = i*Math.PI/3; }
    w.position.set(tileX(p[0]) + tx, 11.5, tileZ(p[1]) + tz + o); scene.add(w); spinners.push({ m:w, ax:'z', sp:o > 0 ? 1.1 : -1.1 }); });
}
{ // tartak
  const b = new T.Group(), log = lam(0x8a5a33), cut = lam(0xdcbc8c), rf = lam(0x4d7a4a);
  groundPad(b, lam(0xc2a877, { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }), 13.4, -6.8, 12);
  [[-4.4, -4.6], [4.4, -4.6], [-4.4, .6], [4.4, .6]].forEach(p => box(.34, 3.8, .34, M.woodD, p[0], 1.9, p[1], b));
  const r = box(10.4, .26, 7, rf, 0, 4.1, -2, b); r.rotation.x = .13; box(9.2, 2.6, .16, M.wood, 0, 2.2, -4.7, b);
  box(3.6, .95, 1.5, M.woodL, -1, .5, -2, b);
  for (let i = 0; i < 3; i++) box(2.4, .16, .8, cut, 3.1, .12 + i*.18, -2 + (i%2)*.1, b); for (let i = 0; i < 4; i++) box(2.4, .16, .8, cut, 3.1, .66 + i*.17, -2.1 + (i%2)*.12, b);
  box(4.3, .85, .1, signMat('TARTAK', '#2f6a43', '#fff'), 0, 3.4, 1.05, b); box(9.2, .3, .3, M.woodD, 0, 3.6, .6, b);
  // stosy kłód przy rampie
  const pile = (x, z) => { [[0, 0], [.8, 0], [1.6, 0], [.4, .68], [1.2, .68], [.8, 1.36]].forEach(q => { cylX(.38, 5, log, x, .4 + q[1], z + q[0], b, 10); cylX(.33, 5.03, cut, x, .4 + q[1], z + q[0], b, 10); }); };
  pile(-3.4, 4.2); pile(3.4, 3.4);
  box(13.4, .55, 4.4, M.concrete, 0, .275, 9.8, b); box(13.4, .03, .28, M.flagW, 0, .56, 11.7, b);
  [[-3, 8.6], [-3, 9.4], [-3, 10.2], [-3, 9], [-3, 9.8]].forEach((q, i) => { cylX(.36, 4.6, log, q[0], .95 + (i > 2 ? .64 : 0), q[1], b, 10); cylX(.31, 4.63, cut, q[0], .95 + (i > 2 ? .64 : 0), q[1], b, 10); });
  placeAt(b, 'sawmill');
  const p = PLACES.sawmill, saw = new T.Group(); cylX(.95, .05, M.steelL, 0, 0, 0, saw, 20); for (let i = 0; i < 10; i++) { const tt = box(.05, .16, .16, M.steelL, 0, Math.cos(i*.628)*.95, Math.sin(i*.628)*.95, saw); tt.rotation.x = i*.628 + .8; }
  const sk = bake(saw); sk.position.set(tileX(p[0]) + 1, 1.05, tileZ(p[1]) + 2); scene.add(sk); spinners.push({ m:sk, ax:'x', sp:9 });
}
{ // las
  const b = new T.Group(), tr = lam(0x6d4b2c), f1 = lam(0x2f6b3a), f2 = lam(0x3d7d44), f3 = lam(0x275c33);
  for (let i = 0; i < 17; i++) { const x = rr(-5.8, 5.8), z = rr(-5.8, 5.8), s = rr(.75, 1.35), fm = [f1, f2, f3][i%3];
    mesh(new T.CylinderGeometry(.2*s, .34*s, 2.4*s, 6), tr, x, 1.2*s, z, b);
    for (let k = 0; k < 3; k++) { const c = mesh(new T.ConeGeometry((1.9 - k*.45)*s, 2.6*s, 7), fm, x, (2.6 + k*1.5)*s, z, b); c.rotation.y = rnd()*6; } }
  for (let i = 0; i < 9; i++) { const m = mesh(new T.SphereGeometry(rr(.14, .22), 7, 5), lam(0xc8382c), rr(-6, 6), .2, rr(-6, 6), b); m.scale.y = .7; cylY(.05, .2, M.flagW, m.position.x, .08, m.position.z, b, 5); }
  placeAt(b, 'forest');
}
{ // zoo
  const b = new T.Group(), PO = { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }, PO2 = { polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 };
  const COL = [0xe8452f, 0xf2a81f, 0x2f7fd8, 0x3f9a4a, 0x8e4fc2], wht = lam(0xfafafa), grn = lam(0x3f9a4a);
  groundPad(b, lam(0xe2cf98, PO), 13.4, -6.8, 7);
  [[-3.3, -1.6, 3.2, 0x7fbf5a], [3.3, -1.9, 3.1, 0x8cc765], [0, -5, 1.9, 0xc9b27c]].forEach(q => { const c = mesh(new T.CircleGeometry(q[2], 22), lam(q[3], PO2), q[0], .045, q[1], b); c.rotation.x = -Math.PI/2; });
  // brama: pasiaste słupy, tablica z uszami, chorągiewki i balony
  const zooSign = lam(0xffffff, { map:tex(512, 128, (g, w, h) => { g.fillStyle = '#fff4d6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3f9a4a'; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16);
    g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = 'bold 96px "Arial Rounded MT Bold", Arial, sans-serif'; ['Z', 'O', 'O'].forEach((c, k) => { g.fillStyle = ['#e8452f', '#f2a81f', '#2f7fd8'][k]; g.fillText(c, w/2 + (k - 1)*96, h/2 + 6); });
    g.font = '64px sans-serif'; g.fillText('🦁', 70, h/2 + 4); g.fillText('🐘', w - 70, h/2 + 4); }) });
  [-3.1, 3.1].forEach(x => { for (let k = 0; k < 5; k++) cone(.5, .5, .9, k % 2 ? wht : lam(0xe8452f), x, .45 + k*.9, 5.6, b, 16); ell(.62, .62, .62, lam(0xf2c230), x, 4.95, 5.6, b); ell(.52, .52, .16, lam(0xf2c230), x*.95, 6.75, 5.6, b); });
  box(7.4, 1.75, .3, zooSign, 0, 5.75, 5.6, b);
  for (let k = 0; k < 9; k++) { const f = mesh(new T.ConeGeometry(.24, .55, 3), lam(COL[k % 5]), -2.2 + k*.55, 4.5 - Math.sin(k/8*Math.PI)*.3, 5.6, b); f.rotation.x = Math.PI; f.scale.z = .2; }
  [[-4.0, 0], [-4.6, 2], [4.0, 1], [4.6, 4]].forEach((q, k) => { const y = 3.3 + (k % 2)*.6; ell(.4, .48, .4, pho(COL[q[1]], { roughness:.25 }), q[0], y, 5.9, b); cylY(.014, y - 1.2, M.dark, q[0], (y - 1.2)/2 + .8, 5.9, b, 4); });
  // biały płotek z zielonymi poprzeczkami
  const fence = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), n = Math.round(L/.5), a = Math.atan2(x2 - x1, z2 - z1);
    for (let i = 0; i <= n; i++) { const u = i/n, p = box(.2, .95, .07, wht, x1 + (x2 - x1)*u, .55, z1 + (z2 - z1)*u, b); p.rotation.y = a + Math.PI/2; const c = mesh(new T.ConeGeometry(.14, .2, 4), wht, x1 + (x2 - x1)*u, 1.12, z1 + (z2 - z1)*u, b); c.rotation.y = a + Math.PI/4; c.scale.z = .4; }
    [.35, .8].forEach(y => { const r = box(.06, .1, L, grn, (x1 + x2)/2, y, (z1 + z2)/2, b); r.rotation.y = a; }); };
  fence(-6.6, 5.6, -3.8, 5.6); fence(3.8, 5.6, 6.6, 5.6); fence(-6.6, -6.5, -6.6, 5.6); fence(6.6, -6.5, 6.6, 5.6); fence(-6.6, -6.5, 6.6, -6.5);
  // akacja, palmy, skałki, basen pingwinów
  cone(.3, .2, 3.4, lam(0x7a5a38), -5.3, 1.7, -4.6, b, 8); ell(2.2, .55, 2.2, lam(0x5f9a3e), -5.3, 3.7, -4.6, b); ell(1.4, .4, 1.4, lam(0x6fae49), -4.6, 4.15, -4.2, b);
  const palm = (x, z, h, lean) => { for (let k = 0; k < 5; k++) cone(.22 - k*.02, .2 - k*.02, h/5 + .05, lam(k % 2 ? 0x8a6a3a : 0x9a7a46), x + lean*k*k*.05, h/10 + k*h/5, z, b, 8);
    const tx = x + lean*.8; for (let i = 0; i < 7; i++) { const a = i/7*6.283, lf = ell(.3, .06, 1.25, lam(i % 2 ? 0x3f9a4a : 0x4fae52), tx + Math.sin(a)*1.0, h - .15, z + Math.cos(a)*1.0, b, 8); lf.rotation.set(-.45, a, 0, 'YXZ'); }
    [0, 2.1, 4.2].forEach(a => ell(.14, .14, .14, lam(0x6b4a2a), tx + Math.sin(a)*.2, h - .2, z + Math.cos(a)*.2, b, 8)); };
  palm(5.4, -5, 4.6, -1); palm(-1.6, 3.6, 3.6, 1);
  [[0, .5, -5, 1.5, .9], [-1.1, .35, -4.6, .9, .6], [1.2, .4, -5.3, 1, .7], [.2, .25, -3.9, .7, .4]].forEach(q => { const r = mesh(new T.IcosahedronGeometry(1, 1), lam(0x9a968e), q[0], q[1], q[2], b); r.scale.set(q[3], q[4], q[3]*.9); r.rotation.y = q[0]*2; });
  { const pl = mesh(new T.CircleGeometry(1.7, 20), pho(0x5fb6dd, Object.assign({ metalness:.5, roughness:.08, envMapIntensity:1.5 }, PO2)), 4.1, .06, 2.9, b); pl.rotation.x = -Math.PI/2; pl.scale.set(1.2, 1, 1);
    const ic = mesh(new T.IcosahedronGeometry(1, 0), lam(0xf4fbff), 5.3, .25, 3.9, b); ic.scale.set(1.1, .4, .9); }
  ramp(b, 11); groundPad(b, M.pad, 5.4, 5, 7.1);
  placeAt(b, 'zoo');
  // zwierzęta stoją osobno, bo się ruszają
  const P = PLACES.zoo, zx = tileX(P[0]), zz = tileZ(P[1]), put = (g, x, z, ry, sc) => { g.position.set(zx - x, 0, zz - z); g.rotation.y = Math.PI + ry; if (sc) g.scale.setScalar(sc); scene.add(g); };
  { // żyrafa
    const gTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#f3c456'; g.fillRect(0, 0, w, h); g.fillStyle = '#a8621f';
      for (let i = 0; i < 30; i++) { const x = rnd()*w, y = rnd()*h, r = rr(7, 13); g.beginPath(); for (let k = 0; k < 6; k++) { const a = k/6*6.283 + rr(-.3, .3), q = r*rr(.7, 1.1); g.lineTo(x + Math.cos(a)*q, y + Math.sin(a)*q); } g.fill(); } }, 2, 2);
    const gy = lam(0xffffff, { map:gTex }), gd = lam(0xa8621f), cr = lam(0xf7e3a8), G = new T.Group(), st = new T.Group(), nk = new T.Group(), neck = new T.Group();
    ell(.5, .55, 1.0, gy, 0, 2.75, 0, st);
    [[-.27, -.62], [.27, -.62], [-.27, .62], [.27, .62]].forEach(q => { cone(.085, .13, 2.35, gy, q[0], 1.25, q[1], st, 8); cone(.11, .1, .14, gd, q[0], .07, q[1], st, 8); });
    const tl = cone(.02, .035, 1.2, gy, 0, 2.4, -1.1, st, 5); tl.rotation.x = -.25; ell(.07, .14, .07, gd, 0, 1.8, -1.27, st);
    G.add(bake(st));
    cone(.3, .17, 2.7, gy, 0, 1.25, 0, nk, 10); box(.05, 2.4, .12, gd, 0, 1.3, -.22, nk);
    ell(.21, .23, .42, gy, 0, 2.72, .22, nk); ell(.15, .14, .2, cr, 0, 2.66, .56, nk);
    [-1, 1].forEach(s => { cone(.03, .03, .3, gd, s*.1, 3.02, .1, nk, 6); ell(.055, .055, .055, gd, s*.1, 3.19, .1, nk, 8); ell(.05, .09, .14, gy, s*.26, 2.86, .02, nk, 8); ell(.04, .045, .04, M.dark, s*.19, 2.8, .36, nk, 8); ell(.02, .02, .02, M.dark, s*.07, 2.68, .75, nk, 6); });
    neck.add(bake(nk)); neck.position.set(0, 3.0, .75); G.add(neck);
    anims.push(t => { neck.rotation.x = .32 + Math.sin(t*.7)*.1; neck.rotation.z = Math.sin(t*.45)*.05; });
    put(G, -3.3, -1.6, .6);
  }
  { // słoń
    const ge = lam(0x9aa3ad), geD = lam(0x7f8891), E = new T.Group(), es = new T.Group(), trunk = new T.Group(), tr = new T.Group();
    ell(1.0, .95, 1.45, ge, 0, 1.9, 0, es); ell(.72, .75, .7, ge, 0, 2.3, 1.5, es);
    [[-.55, -.8], [.55, -.8], [-.55, .75], [.55, .75]].forEach(q => { cone(.3, .3, 1.3, ge, q[0], .65, q[1], es, 12); cone(.33, .31, .14, geD, q[0], .07, q[1], es, 12); });
    [-1, 1].forEach(s => { const tk = cone(.085, .02, .8, M.flagW, s*.34, 1.8, 2.2, es, 8); tk.rotation.x = Math.PI/2 - .3; ell(.06, .07, .05, M.dark, s*.45, 2.55, 2.05, es, 8); });
    const tl = cone(.02, .04, .9, geD, 0, 1.75, -1.5, es, 5); tl.rotation.x = -.2;
    E.add(bake(es));
    [-1, 1].forEach(s => { const ear = new T.Group(), eg = new T.Group(); ell(.09, .75, .6, ge, s*.5, -.1, -.15, eg); ell(.05, .55, .42, lam(0xc9a9a6), s*.5, -.12, -.09, eg);
      ear.add(bake(eg)); ear.position.set(s*.55, 2.5, 1.3); E.add(ear); anims.push(t => { ear.rotation.y = s*(.35 + Math.sin(t*1.3 + s)*.28); }); });
    { let y = 0, z = 0; for (let k = 0; k < 13; k++) { const r = .27 - k*.014; ell(r, r, r, ge, 0, y, z, tr, 10); if (k < 8) { y -= r*.75; z += .03; } else { y -= r*.3; z += r*.7; } } }
    trunk.add(bake(tr)); trunk.position.set(0, 2.2, 2.1); E.add(trunk); anims.push(t => { trunk.rotation.x = Math.sin(t*.9)*.2 - .05; trunk.rotation.z = Math.sin(t*.6)*.08; });
    put(E, 3.3, -1.9, -.5);
  }
  { // lew na skałkach
    const tan = lam(0xdba54a), mane = lam(0x9a5a1e), cr = lam(0xf3ddb0), L = new T.Group(), ls = new T.Group(), hd = new T.Group(), hg = new T.Group(), tail = new T.Group(), tg = new T.Group();
    ell(.45, .38, .9, tan, 0, .4, 0, ls); [-1, 1].forEach(s => { ell(.13, .1, .32, tan, s*.25, .12, .95, ls); ell(.16, .18, .3, tan, s*.36, .22, -.5, ls); });
    L.add(bake(ls));
    ell(.56, .56, .42, mane, 0, 0, 0, hg); ell(.34, .34, .3, tan, 0, 0, .25, hg); ell(.17, .13, .15, cr, 0, -.09, .5, hg); ell(.06, .045, .04, M.dark, 0, -.02, .63, hg, 8);
    [-1, 1].forEach(s => { ell(.1, .1, .06, tan, s*.3, .34, .1, hg, 8); ell(.04, .045, .03, M.dark, s*.13, .08, .52, hg, 8); });
    hd.add(bake(hg)); hd.position.set(0, .82, .78); L.add(hd);
    const tc = cone(.035, .03, 1, tan, 0, .5, 0, tg, 5); ell(.09, .13, .09, mane, 0, 1.05, 0, tg, 8); tail.add(bake(tg)); tail.position.set(0, .45, -.85); tail.rotation.x = -1; L.add(tail);
    anims.push(t => { hd.rotation.y = Math.sin(t*.5)*.5; tail.rotation.z = Math.sin(t*2.2)*.35; });
    put(L, 0, -5, 0, 1.15); L.position.y = 1.32;
  }
  { // pingwiny
    const bk = lam(0x1f2328), wh = lam(0xfafafa), og = lam(0xf29a1f), pg = new T.Group();
    ell(.2, .33, .2, bk, 0, .36, 0, pg); ell(.16, .27, .12, wh, 0, .33, .1, pg); ell(.15, .15, .15, bk, 0, .74, 0, pg); ell(.09, .08, .05, wh, 0, .72, .12, pg, 8);
    const bkk = mesh(new T.ConeGeometry(.045, .16, 6), og, 0, .72, .2, pg); bkk.rotation.x = Math.PI/2;
    [-1, 1].forEach(s => { ell(.04, .2, .1, bk, s*.21, .38, 0, pg, 8); ell(.08, .03, .12, og, s*.09, .03, .07, pg, 8); ell(.022, .022, .022, wh, s*.06, .78, .13, pg, 6); });
    const tp = bake(pg);
    [[3.2, 4.3, .4], [5.2, 3.8, -1.2], [4.6, 1.5, 2.6], [5.6, 2.3, -2]].forEach((q, k) => { const g = new T.Group(), c = cloneTpl(tp, true); g.add(c); put(g, q[0], q[1], q[2], 1.35); if (k === 1) g.position.y = .42;
      anims.push(t => { c.rotation.z = Math.sin(t*4.5 + k*1.9)*.13; c.position.y = Math.abs(Math.sin(t*4.5 + k*1.9))*.03; }); });
  }
}
{ // staw z kaczkami
  const g = new T.Group();
  const pond = mesh(new T.CircleGeometry(5.3, 28), pho(0x4f8fb5, { metalness:.55, roughness:.06, envMapIntensity:1.5, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }), 0, .035, 0, g); pond.rotation.x = -Math.PI/2; pond.scale.set(1.15, 1, 1);
  const shore = mesh(new T.RingGeometry(5, 6, 28), lam(0xb7a273, { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }), 0, .03, 0, g); shore.rotation.x = -Math.PI/2; shore.scale.set(1.15, 1, 1);
  const pg = new T.Group(), dk = lam(0xfaf8f0), or = lam(0xf29a1f), rd = lam(0x4f7d32);
  [[-2, 1, .5], [1.5, -1.5, 2], [2.6, 1.8, 4]].forEach(d => { const k = new T.Group(); const bd = mesh(new T.SphereGeometry(.3, 10, 8), dk, 0, .12, 0, k); bd.scale.set(.8, .6, 1.2);
    mesh(new T.SphereGeometry(.14, 8, 6), dk, 0, .42, .3, k); box(.08, .04, .14, or, 0, .4, .46, k); k.position.set(d[0], 0, d[1]); k.rotation.y = d[2]; pg.add(k); });
  for (let i = 0; i < 24; i++) { const a = rr(2.2, 4.8), r = rr(5, 6); cylY(.03, rr(1, 1.9), rd, Math.cos(a)*r*1.15, .7, Math.sin(a)*r, pg, 4); }
  g.add(bake(pg)); placeAt(g, 'pond', true);
}

{ // przystanek Staw
  const b = new T.Group(); ramp(b, 9);
  [-2.6, 2.6].forEach(x => cylY(.08, 2.5, M.steel, x, 1.8, 7.7, b, 8)); const rf = box(6.4, .12, 2.2, lam(0x2f7fd8), 0, 3.1, 8.2, b); rf.rotation.x = .12; box(5.2, 1.5, .08, M.glass, 0, 1.6, 7.6, b);
  box(2.4, .1, .5, M.woodL, 0, 1.05, 8, b); [-1, 1].forEach(x => box(.1, .5, .45, M.dark, x, .8, 8, b));
  nameBoard(b, 'STAW', 0, 11);
  placeAt(b, 'pond');
}
{ // elektrownia
  const b = new T.Group(), st = pho(0x6f7a84, { metalness:.5, roughness:.5 }), rd = lam(0xc8382c);
  groundPad(b, M.pad, 13.4, -6.8, 12);
  box(7.4, 5.6, 5.6, M.brick, -2.6, 2.8, -3.2, b); box(7.8, .3, 6, M.dark, -2.6, 5.75, -3.2, b);
  [-5.2, -3.5, -1.8, -.1].forEach(x => box(.95, 2.4, .08, M.win, x, 3, -.38, b));
  box(5.4, .9, .1, signMat('ELEKTROWNIA', '#f2c230', '#1c1c1e'), -2.6, 5, -.36, b);
  for (let k = 0; k < 6; k++) cylY(.82 - k*.045, 2.3, k % 2 ? M.flagW : rd, 4.2, 1.15 + k*2.3, -4.4, b, 14);                // komin w pasy
  { const pts = []; for (let k = 0; k <= 10; k++) { const u = k/10; pts.push(new T.Vector2(1.75 + (u - .68)*(u - .68)*3.1, u*7.6)); }
    mesh(new T.LatheGeometry(pts, 22), lam(0xd3d6d3, { side:T.DoubleSide }), 3.3, 0, 1.2, b); }                               // chłodnia kominowa
  [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(q => box(.24, 2.6, .24, st, -3.6 + q[0], 1.85, 8.6 + q[1], b));
  box(3, 1.6, 3, st, -3.6, 3.9, 8.6, b); const cv = box(.9, .28, 7.6, M.dark, -3.6, 4.4, 3.4, b); cv.rotation.x = .2;
  mesh(new T.ConeGeometry(2, 1.6, 8), M.coal, .9, .8, 6.3, b);
  box(.26, 8.5, .26, st, -6, 4.25, 3.4, b); [6.4, 7.8].forEach(y => box(.2, .2, 3.4, st, -6, y, 3.4, b));
  box(13.4, .55, 2.4, M.concrete, 0, .275, 10.8, b);
  placeAt(b, 'power');
}

/* =====================================================================
   TORY: szablony odcinków i kratki
   ===================================================================== */
const RAIL_TOP = .38, GAUGE = 1.5;
function tplStraight(len, z0, stop) {              // tor wzdłuż osi Z od z0
  const g = new T.Group(), bg = new T.PlaneGeometry(3.3, len); bg.rotateX(-Math.PI/2); bg.translate(0, 0, z0 + len/2);
  { const p = bg.attributes.position, uv = bg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i)/3.5, p.getZ(i)/3.5); }
  mesh(bg, M.ballast, 0, 0, 0, g);
  const n = Math.round(len/.78); for (let k = 0; k < n; k++) box(2.5, .14, .3, M.sleeper, 0, .09, z0 + (k + .5)*len/n, g);
  [-1, 1].forEach(s => box(.13, .17, len, M.rail, s*GAUGE/2, .245, z0 + len/2, g));
  if (stop) { [-1, 1].forEach(s => { box(.2, 1.05, .2, M.dark, s*.75, .68, z0 + len + .25, g); const d = box(.16, 1.3, .16, M.dark, s*.75, .6, z0 + len + .75, g); d.rotation.x = -.7; });
    box(2.5, .42, .24, M.lRed, 0, 1.25, z0 + len + .2, g); box(.5, .43, .25, M.flagW, 0, 1.25, z0 + len + .2, g); }
  return bake(g);
}
function tplCurve() {                              // łuk z północy na wschód, promień pół kratki
  const g = new T.Group(), R = TS/2, cx = R, cz = -R, pt = (f, r) => [cx - Math.cos(f)*r, cz + Math.sin(f)*r];
  const P = [], N = [], U = [], n = 16, hw = 1.65;
  const tri = (a, b, c) => { if ((b[1] - a[1])*(c[0] - a[0]) - (b[0] - a[0])*(c[1] - a[1]) < 0) { const t = b; b = c; c = t; }
    [a, b, c].forEach(p => { P.push(p[0], 0, p[1]); N.push(0, 1, 0); U.push(p[0]/3.5, p[1]/3.5); }); };
  for (let k = 0; k < n; k++) { const f0 = k/n*Math.PI/2, f1 = (k + 1)/n*Math.PI/2, a = pt(f0, R - hw), b = pt(f0, R + hw), c = pt(f1, R + hw), d = pt(f1, R - hw); tri(a, b, c); tri(a, c, d); }
  const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(P, 3)); bg.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); bg.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
  mesh(bg, M.ballast, 0, 0, 0, g);
  const ns = 14; for (let k = 0; k < ns; k++) { const f = (k + .5)/ns*Math.PI/2, p = pt(f, R), s = box(2.5, .14, .3, M.sleeper, p[0], .09, p[1], g); s.rotation.y = f; }
  [-1, 1].forEach(sd => { const r = R + sd*GAUGE/2, nr = 18, L = r*Math.PI/2/nr*1.04;
    for (let k = 0; k < nr; k++) { const f = (k + .5)/nr*Math.PI/2, p = pt(f, r), s = box(.13, .17, L, M.rail, p[0], .245, p[1], g); s.rotation.y = f; } });
  return bake(g);
}
const TPL = { straight:tplStraight(TS, -TS/2), curve:tplCurve(), half:tplStraight(TS/2, -TS/2, true) };
const trackRoot = new T.Group(); scene.add(trackRoot);
// ---------- ozdoby łąki na pustych kratkach (znikają, gdy na kratce powstaje tor)
const noDeco = new Uint8Array(GW*GH);
Object.keys(PLACES).forEach(k => { const p = PLACES[k]; noDeco[p[1]*GW + p[0]] = 1; const i = p[0] + DX[p[2]], j = p[1] + DZ[p[2]]; if (inGrid(i, j)) noDeco[j*GW + i] = 1; });
const deco = (() => {
  const parts = []; for (let i = 0; i < 6; i++) { const c = new T.ConeGeometry(.045, rr(.35, .6), 3, 1, true).toNonIndexed(); c.translate(0, .22, 0);
    c.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(rr(-.5, .5), rnd()*6, rr(-.5, .5)))); c.translate(rr(-.12, .12), 0, rr(-.12, .12)); parts.push(c); }
  const PER = 6, tuft = new T.InstancedMesh(mergeGeos(parts), lam(0xffffff, { side:T.DoubleSide }), GW*GH*PER), bush = new T.InstancedMesh(new T.IcosahedronGeometry(.8, 0), lam(0xffffff, { flatShading:true }), GW*GH);
  const d = new T.Object3D(), c = new T.Color(), mt = [], mb = [], ZERO = new T.Matrix4().makeScale(0, 0, 0);
  for (let idx = 0; idx < GW*GH; idx++) { const cx = tileX(idx % GW), cz = tileZ((idx / GW) | 0);
    for (let k = 0; k < PER; k++) { d.position.set(cx + rr(-6.7, 6.7), 0, cz + rr(-6.7, 6.7)); d.rotation.set(0, rnd()*6, 0); const s = rr(1, 2); d.scale.set(s, s*rr(.8, 1.4), s); d.updateMatrix(); mt.push(d.matrix.clone());
      c.setHSL(rr(.24, .31), rr(.45, .62), rr(.3, .44)); tuft.setColorAt(idx*PER + k, c); }
    { const s = rnd() < .5 ? rr(.5, 1.3) : 0; d.position.set(cx + rr(-5.5, 5.5), s*.45, cz + rr(-5.5, 5.5)); d.rotation.set(rnd(), rnd()*6, 0); d.scale.set(s, s*.75, s); d.updateMatrix(); mb.push(d.matrix.clone());
      c.setHSL(rr(.26, .36), rr(.4, .6), rr(.24, .36)); bush.setColorAt(idx, c); } }
  tuft.receiveShadow = true; tuft.frustumCulled = bush.frustumCulled = false; scene.add(tuft); scene.add(bush);
  return { set(idx, show) { for (let k = 0; k < PER; k++) tuft.setMatrixAt(idx*PER + k, show ? mt[idx*PER + k] : ZERO); bush.setMatrixAt(idx, show ? mb[idx] : ZERO);
    tuft.instanceMatrix.needsUpdate = bush.instanceMatrix.needsUpdate = true; } };
})();
const swArrowGeo = (() => { const s = new T.Shape(); s.moveTo(0, 2.3); s.lineTo(1.35, .5); s.lineTo(.5, .5); s.lineTo(.5, -1.9); s.lineTo(-.5, -1.9); s.lineTo(-.5, .5); s.lineTo(-1.35, .5); s.lineTo(0, 2.3);
  const g = new T.ShapeGeometry(s).toNonIndexed(); g.rotateX(Math.PI/2); return g; })();
const swArrowMat = new T.MeshBasicMaterial({ color:0xffd21f, side:T.DoubleSide, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3 });
const deckGeo = new T.BoxGeometry(6.4, .3, 3.3).toNonIndexed(), deckMat = lam(0x4a4d52);       // nawierzchnia przejazdu między szynami
// Tory są sklejane w kawałki po 5 × 5 kratek: mało rysowań nawet na dużej planszy.
const CH = 5, CW = Math.ceil(GW/CH), CN = CW*Math.ceil(GH/CH), TPLG = {};
Object.keys(TPL).forEach(k => { TPLG[k] = TPL[k].children.map(m => ({ g:m.geometry, m:m.material })); });
const chunkGroups = [], chunkDirty = new Uint8Array(CN), _m4 = new T.Matrix4();
for (let c = 0; c < CN; c++) { const g = new T.Group(); trackRoot.add(g); chunkGroups.push(g); }
function buildChunk(c) {
  const grp = chunkGroups[c]; while (grp.children.length) { const m = grp.children[0]; m.geometry.dispose(); grp.remove(m); }
  const by = new Map(), put = (mat, geo) => { const g = geo.clone(); g.applyMatrix4(_m4); let a = by.get(mat); if (!a) by.set(mat, a = []); a.push(g); };
  const i0 = (c % CW)*CH, j0 = ((c / CW) | 0)*CH;
  for (let j = j0; j < Math.min(GH, j0 + CH); j++) for (let i = i0; i < Math.min(GW, i0 + CH); i++) { const idx = j*GW + i, m = grid[idx], rd = road[idx]; if (!m && !rd) continue;
    const cx = tileX(i), cz = tileZ(j), bits = []; for (let k = 0; k < 4; k++) if (m >> k & 1) bits.push(k);
    if (rd) { const rb = []; for (let k = 0; k < 4; k++) if (rd >> k & 1) rb.push(k);                 // asfalt; linie tylko poza skrzyżowaniami
      const addR = (key, rot) => { _m4.makeRotationY(-rot*Math.PI/2).setPosition(cx, .03, cz); put(roadMat, RT[key].road); if (rb.length < 3) { _m4.makeRotationY(-rot*Math.PI/2).setPosition(cx, .05, cz); put(lineMat, RT[key].line); } };
      if (rb.length === 1) addR('half', rb[0]);
      else for (let x = 0; x < rb.length; x++) for (let y = x + 1; y < rb.length; y++) { const a = rb[x], b = rb[y]; if (b - a === 2) addR('straight', a); else if (b - a === 1) addR('curve', a); else addR('curve', 3); } }
    let n = 0; const add = (key, rot) => { _m4.makeRotationY(-rot*Math.PI/2).setPosition(cx, .05 + n*.004, cz); TPLG[key].forEach(q => put(q.m, q.g)); n++; };
    if (bits.length === 1) add('half', bits[0]);
    else for (let x = 0; x < bits.length; x++) for (let y = x + 1; y < bits.length; y++) { const a = bits[x], b = bits[y];
      if (b - a === 2) add('straight', a); else if (b - a === 1) add('curve', a); else add('curve', 3); }
    if (bits.length > 2) bits.forEach(e => {               // żółta strzałka przy każdym wjeździe na zwrotnicę: dokąd pojedzie pociąg
      const x = pickExit(optionsAt(idx, e), (e + 2) % 4, idx, e), px = DX[e]*4.3, pz = DZ[e]*4.3;
      _m4.makeRotationY(Math.atan2(DX[x]*7 - px, DZ[x]*7 - pz)).setPosition(cx + px, .47, cz + pz); put(swArrowMat, swArrowGeo); });
    const rt = roadType(idx); if (m && (rt === 1 || rt === 2)) { _m4.makeRotationY(rt === 2 ? Math.PI/2 : 0).setPosition(cx, .2, cz); put(deckMat, deckGeo); }
  }
  by.forEach((list, mat) => { const m = new T.Mesh(mergeGeos(list), mat); m.receiveShadow = true; grp.add(m); list.forEach(g => g.dispose()); });
}
function flushChunks() { for (let c = 0; c < CN; c++) if (chunkDirty[c]) { chunkDirty[c] = 0; buildChunk(c); } }
function rebuildTile(idx) {
  chunkDirty[(((idx / GW) | 0) / CH | 0)*CW + ((idx % GW) / CH | 0)] = 1;
  deco.set(idx, !grid[idx] && !road[idx] && !noDeco[idx]); syncXing(idx);
}
function rebuildAll() { for (let i = 0; i < GW*GH; i++) rebuildTile(i); flushChunks(); }

// ---------- zmiany w torach
function connectTiles(i1, j1, i2, j2) {            // 1 nowy tor, 0 już był, -1 nie da się
  if (!inGrid(i1, j1) || !inGrid(i2, j2)) return -1;
  const a = j1*GW + i1, b = j2*GW + i2; if (blocked[a] || blocked[b]) return -1;
  { const s = i1 === i2 ? 0 : 1, bad = q => road[q] && (road[q] !== (s ? 5 : 10) || (grid[q] & (s ? 5 : 10))); if (bad(a) || bad(b)) return -2; }   // przez drogę tylko prosto, w poprzek
  let k = -1; for (let s = 0; s < 4; s++) if (i1 + DX[s] === i2 && j1 + DZ[s] === j2) k = s; if (k < 0) return -1;
  if (grid[a] >> k & 1) return 0;
  grid[a] |= 1 << k; grid[b] |= 1 << ((k + 2) % 4); return 1;
}
function defaultGrid() {
  grid = new Uint8Array(GW*GH);
  const line = (i1, j1, i2, j2) => { let i = i1, j = j1; while (i !== i2 || j !== j2) { const ni = i + Math.sign(i2 - i), nj = j + Math.sign(j2 - j); connectTiles(i, j, ni, nj); i = ni; j = nj; } };
  line(3, 4, 26, 4); line(26, 4, 26, 15); line(26, 15, 3, 15); line(3, 15, 3, 4);        // wielka pętla przez wszystkie stacje
  line(10, 4, 10, 15); line(18, 4, 18, 15); line(3, 10, 26, 10);                          // skróty przez środek
  line(12, 4, 12, 1); line(12, 1, 16, 1); line(16, 1, 16, 4);                             // pętla za kopalnią
  line(15, 15, 15, 18); line(15, 18, 19, 18); line(19, 18, 19, 15);                       // pętla na południu
  line(3, 8, 1, 8); line(1, 8, 1, 12); line(1, 12, 3, 12);                                // pętla na zachodzie
}
function loadGrid(arr) {                           // zapisany układ: tylko poprawne, symetryczne połączenia
  grid = new Uint8Array(GW*GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const m = arr[j*GW + i] | 0; for (let k = 0; k < 2; k++) if (m >> k & 1) { const i2 = i + DX[k], j2 = j + DZ[k]; if (inGrid(i2, j2) && (arr[j2*GW + i2] >> ((k + 2) % 4) & 1)) connectTiles(i, j, i2, j2); }
    for (let k = 2; k < 4; k++) if (m >> k & 1) { const i2 = i + DX[k], j2 = j + DZ[k]; if (inGrid(i2, j2) && (arr[j2*GW + i2] >> ((k + 2) % 4) & 1)) connectTiles(i, j, i2, j2); } }
}

/* =====================================================================
   TRASA: odcinki, po których jedzie pociąg
   ===================================================================== */
const segLen = (a, b) => a < 0 || b < 0 ? TS/2 : ((a + 2) % 4 === b ? TS : Math.PI*TS/4);
const mkSeg = (i, j, a, b, junc) => ({ i, j, a, b, len:segLen(a, b), junc:!!junc });
function segPoint(sg, s, o) {                      // punkt i kierunek jazdy w odległości s od początku odcinka
  const cx = tileX(sg.i), cz = tileZ(sg.j), a = sg.a, b = sg.b, R = TS/2;
  if (a < 0) { o.x = cx + DX[b]*s; o.z = cz + DZ[b]*s; o.tx = DX[b]; o.tz = DZ[b]; }
  else if (b < 0 || (a + 2) % 4 === b) { o.x = cx + DX[a]*(R - s); o.z = cz + DZ[a]*(R - s); o.tx = -DX[a]; o.tz = -DZ[a]; }
  else { const f = s/R, c = Math.cos(f), n = Math.sin(f), kx = cx + (DX[a] + DX[b])*R, kz = cz + (DZ[a] + DZ[b])*R;
    o.x = kx - (DX[b]*c + DX[a]*n)*R; o.z = kz - (DZ[b]*c + DZ[a]*n)*R; o.tx = DX[b]*n - DX[a]*c; o.tz = DZ[b]*n - DZ[a]*c; }
}
const sw = new Int8Array(GW*GH*4).fill(-1);       // ustawienie zwrotnicy: dla każdego wjazdu wybrany wyjazd
function optionsAt(idx, e) { const m = grid[idx], o = []; for (let k = 0; k < 4; k++) if (k !== e && (m >> k & 1)) o.push(k); return o; }
function pickExit(opts, dir, idx, e) {             // dir: strona, którą wyjeżdża się jadąc prosto
  if (!opts.length) return -1; if (opts.length === 1) return opts[0];
  const s = sw[idx*4 + e]; if (opts.includes(s)) return s;
  return opts.includes(dir) ? dir : opts[0];
}
function nextSeg(sg) {
  if (sg.b < 0) return null; const i = sg.i + DX[sg.b], j = sg.j + DZ[sg.b]; if (!inGrid(i, j)) return null;
  const e = (sg.b + 2) % 4, idx = j*GW + i; if (!(grid[idx] >> e & 1)) return null;
  const opts = optionsAt(idx, e); return mkSeg(i, j, e, pickExit(opts, sg.b, idx, e), opts.length > 1);
}
function prevSeg(sg) {
  if (sg.a < 0) return null; const i = sg.i + DX[sg.a], j = sg.j + DZ[sg.a]; if (!inGrid(i, j)) return null;
  const e = (sg.a + 2) % 4, idx = j*GW + i; if (!(grid[idx] >> e & 1)) return null;
  const opts = optionsAt(idx, e); return mkSeg(i, j, pickExit(opts, sg.a, idx, e), e, opts.length > 1);
}
function cycleSwitch(idx, e, quiet) {              // przestaw zwrotnicę dla wjazdu e: prosto → w prawo → w lewo
  const opts = optionsAt(idx, e); if (opts.length < 2) return false;
  const d = (e + 2) % 4, order = [d, (d + 1) % 4, (d + 3) % 4].filter(k => opts.includes(k)), cur = pickExit(opts, d, idx, e);
  sw[idx*4 + e] = order[(order.indexOf(cur) + 1) % order.length]; rebuildTile(idx);
  if (!quiet) { sfx.blip(560); tone(120, .08, 'square', .12, 90, .05); } return true;
}

/* =====================================================================
   CZĄSTKI (iskry) I KŁĘBY PARY
   ===================================================================== */
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

/* =====================================================================
   PAROWÓZ, TENDER, WAGONY
   ===================================================================== */

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

// ---------- strzałki nad zwrotnicami na trasie: pokazują, dokąd pojedzie pociąg; można je stuknąć
const turnArrows = [];
{ const am = new T.MeshBasicMaterial({ color:0xffd21f });
  for (let k = 0; k < 3; k++) { const a = new T.Group(), c = mesh(new T.ConeGeometry(1.5, 2.6, 4), am, 0, 0, 2.4, a); c.rotation.x = Math.PI/2;
    const s = cylY(.55, 2.6, am, 0, 0, 0, a, 8); s.rotation.x = Math.PI/2; a.scale.setScalar(k ? .7 : 1); a.visible = false; scene.add(a); turnArrows.push(a); } }

/* =====================================================================
   DŹWIĘK (Web Audio, wszystko syntetyczne)
   ===================================================================== */
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

/* =====================================================================
   STEROWANIE: do przodu i do tyłu; zwrotnice stuka się na torach
   ===================================================================== */
const keys = { fwd:0, back:0, left:0, right:0 };                    // puszczenie przycisku hamuje, jak w aucie elektrycznym

holdBtn('pFwd', 'fwd'); holdBtn('pBack', 'back'); holdBtn('cGo', 'fwd'); holdBtn('cBk', 'back'); holdBtn('cL', 'left'); holdBtn('cR', 'right');
const KEYMAP = { ArrowUp:'fwd', w:'fwd', ArrowDown:'back', s:'back', ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right' };
addEventListener('keydown', e => { const k = KEYMAP[e.key]; if (k) { keys[k] = 1; e.preventDefault(); }
  else if (S.running && !e.repeat) { if (S.mode === 'drive') { if (e.key === ' ') { e.preventDefault(); hornDown(); } else if (e.key === 'c') nextCam(); else if (e.key === 't') switchNext(); else if (e.key === 'v') $('pick').hidden = !$('pick').hidden; else if (e.key === 'b') setMode('build'); }
    else if (e.key === 'b' || e.key === 'Enter') setMode('drive'); } });
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = 0; else if (e.key === ' ' && hornV) hornUp(); });
addEventListener('blur', () => { keys.fwd = keys.back = keys.left = keys.right = 0; });
document.addEventListener('touchmove', e => { if (S.running) e.preventDefault(); }, { passive:false });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

/* =====================================================================
   PRZEWOZY: pasażerowie między przystankami, drewno i węgiel
   ===================================================================== */
function placePt(key, x, y, z, out) { const p = PLACES[key], a = ROT[p[2]], c = Math.cos(a), s = Math.sin(a); return out.set(tileX(p[0]) + x*c + z*s, y, tileZ(p[1]) - x*s + z*c); }
const INFO = { station:{ name:'Ciuchciowo', ico:'🏠' }, town:{ name:'Bocianowo', ico:'🏡' }, zoo:{ name:'Zoo', ico:'🦒' }, pond:{ name:'Staw', ico:'🦆' }, sawmill:{ name:'Tartak', ico:'🌲' }, mine:{ name:'Kopalnia', ico:'⛏️' }, power:{ name:'Elektrownia', ico:'⚡' } };
const PSTOPS = ['station', 'town', 'zoo', 'pond'], FSTOPS = ['sawmill', 'mine', 'power'], STOPS = {};
Object.keys(INFO).forEach(key => {                 // punkt zatrzymania na torze i tabliczka nad peronem
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const tx = new T.CanvasTexture(cv), sp = new T.Sprite(new T.SpriteMaterial({ map:tx, transparent:true, fog:false, depthWrite:false }));
  sp.scale.set(9, 4.5, 1); placePt(key, 0, 8.5, 10, sp.position); sp.visible = false; scene.add(sp);
  STOPS[key] = { key, P:placePt(key, 0, 0, 14, new T.Vector3()), sp, cv, tx, txt:null, hot:false, people:[] };
});
function setLabel(key, txt, hot) {
  const st = STOPS[key]; st.hot = !!hot; if (st.txt === txt) return; st.txt = txt; st.sp.visible = !!txt; if (!txt) return;
  const g = st.cv.getContext('2d'); g.clearRect(0, 0, 256, 128); g.fillStyle = '#fff4d6'; g.strokeStyle = '#c9a35a'; g.lineWidth = 8;
  g.beginPath(); const r = 30; g.moveTo(8 + r, 8); g.arcTo(248, 8, 248, 120, r); g.arcTo(248, 120, 8, 120, r); g.arcTo(8, 120, 8, 8, r); g.arcTo(8, 8, 248, 8, r); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#3b2a17'; g.font = 'bold 60px "Baloo 2", Arial, sans-serif'; const w = g.measureText(txt).width; if (w > 212) g.font = 'bold ' + Math.floor(60*212/w) + 'px "Baloo 2", Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 68); st.tx.needsUpdate = true;
}
{ // ludziki na peronach
  const tpl = [0xd8452f, 0x2f7fd8, 0xf2b632, 0x3f9a4a, 0x8e4fc2, 0xf08a2a].map(c => { const g = new T.Group(); cylY(.22, .68, lam(c), 0, .72, 0, g, 8); mesh(new T.SphereGeometry(.2, 10, 8), M.skin, 0, 1.27, 0, g);
    [-.1, .1].forEach(x => box(.14, .4, .16, M.pants, x, .2, 0, g)); return bake(g); });
  PSTOPS.forEach((key, n) => { for (let k = 0; k < 6; k++) { const p = cloneTpl(tpl[(k + n*2) % 6], true); placePt(key, -3.75 + k*1.5, .55, 10.1 + (k % 2)*.75, p.position); p.scale.setScalar(1.25); p.visible = false; scene.add(p); STOPS[key].people.push(p); } });
}
const waiting = { station:['zoo', 'town', 'zoo'], town:['zoo', 'station'], zoo:['station', 'pond'], pond:['town'] };
let onboard = [], score = savedStars, spawnT = 0, svcT = 0, boardT = -9;
const PLANT = [placePt('power', 3.3, 8, 1.2, new T.Vector3()), placePt('power', 4.2, 14.4, -4.4, new T.Vector3())];
const paxCap = () => cars.filter(c => c.pax).length*4;
function near(key, list) { const P = STOPS[key].P; for (let k = 0; k < list.length; k++) if (Math.hypot(list[k].x - P.x, list[k].z - P.z) < 9.5) return true; return false; }
function addScore(n) { score += n; $('stars').textContent = score; save(); }
const MISS = { star:'⭐ zbierz', taxi:'🚕 zawieź', pax:'🧍 dowieź', cargo:'📦 dowieź', cow:'🐄 przegoń', xing:'🚧 zamknij' };
let mission = null;
function showMission() { $('miss').textContent = mission ? '🎯 ' + MISS[mission.kind] + ' ' + mission.got + '/' + mission.need : '🎉'; }
function newMission() { const pool = S.veh === 'car' ? (AV.jobs ? ['star', 'taxi'] : ['star']) : TR.pass ? ['star', 'pax', 'cow', 'xing'] : ['star', 'cargo', 'cow', 'xing'], last = mission ? mission.kind : ''; let k; do k = pool[(Math.random()*pool.length) | 0]; while (k === last && pool.length > 1);
  mission = { kind:k, need:k === 'star' ? 6 : k === 'cow' ? 2 : 3, got:0 }; showMission(); }
function progress(kind) {                          // zadanie wykonane: fanfara, konfetti i premia
  if (!mission || mission.kind !== kind || mission.done) return; mission.got++; showMission(); if (mission.got < mission.need) return;
  mission.done = true; $('miss').textContent = '🎉 brawo!'; sfx.win(); addScore(3); toast('Zadanie wykonane! 🎉 +3 ⭐');
  for (let i = 0; i < 60; i++) { const c = cars[i % cars.length], k = i % 4; emit(c.x, 3.5, c.z, rr(-5, 5), rr(5, 12), rr(-5, 5), 1.6, k === 0 ? 1 : k === 1 ? .3 : .95, k === 2 ? .35 : .8, k === 3 ? 1 : .25, 12); }
  setTimeout(newMission, 2600);
}
function star(c) {
  addScore(1); sfx.star(); progress(TR.pass ? 'pax' : 'cargo');
  for (let i = 0; i < 16; i++) { const k = i % 3; emit(c.x, 3.4, c.z, rr(-3.5, 3.5), rr(3, 8), rr(-3.5, 3.5), 1.1, k === 0 ? 1 : .3, k === 1 ? .85 : .5, k === 2 ? 1 : .2, 11); }
}
function refreshLabels() {
  const ws = cars.filter(c => c.cargo !== undefined), empty = ws.some(c => c.cargo === 0), hasW = ws.some(c => c.cargo === 1), hasC = ws.some(c => c.cargo === 2);
  PSTOPS.forEach(key => { const n = onboard.filter(d => d === key).length, w = waiting[key];
    if (!TR.pass) setLabel(key, null); else if (n) setLabel(key, '⬇️ ' + INFO[key].ico + ' ×' + n, true); else if (w.length) setLabel(key, '🧍→' + w.slice(0, 4).map(d => INFO[d].ico).join(''), !onboard.length); else setLabel(key, null);
    STOPS[key].people.forEach((p, k) => { p.visible = k < w.length; }); });
  if (TR.pass) FSTOPS.forEach(key => setLabel(key, null));
  else { setLabel('sawmill', empty ? '🌲 ⬆️' : null, !hasW && !hasC); setLabel('mine', hasW ? '⬇️ 🌲' : empty ? '⚫ ⬆️' : null, hasW); setLabel('power', hasC ? '⬇️ ⚫' : null, true); }
  if (S.veh !== 'car') $('load').textContent = TR.pass ? '🧍 ' + onboard.length + (onboard.length ? ' → ' + onboard.slice(0, 6).map(d => INFO[d].ico).join('') : '') : ws.map(c => c.cargo === 1 ? '🌲' : c.cargo === 2 ? '⚫' : '▫️').join(' ');
}
function service(dt) {                             // pociąg stoi przy peronie albo rampie: wysiadanie, wsiadanie, ładunek
  if (Math.abs(v) > .15) { svcT = 0; return; } svcT += dt; if (svcT < (TR.pass ? .42 : .8)) return; svcT = 0;
  if (TR.pass) { const cs = cars.filter(c => c.pax);
    for (let n = 0; n < PSTOPS.length; n++) { const key = PSTOPS[n]; if (!near(key, cars)) continue;
      const i = onboard.indexOf(key); if (i >= 0) { onboard.splice(i, 1); star(cs[0]); refreshLabels(); return; }
      const w = waiting[key]; if (w.length && onboard.length < paxCap()) { onboard.push(w.shift()); sfx.pop(onboard.length); refreshLabels();
        if (time - boardT > 4) { boardT = time; toast('Wsiadamy! Jedziemy do: ' + Array.from(new Set(onboard)).map(d => INFO[d].ico + ' ' + INFO[d].name).join(', ')); } }
      return; } }
  else { const ws = cars.filter(c => c.cargo !== undefined); let c;
    if (near('sawmill', cars)) { c = ws.find(q => q.cargo === 0 && q.shown === 0); if (c) { c.cargo = 1; sfx.thud(); refreshLabels(); if (time - boardT > 6) { boardT = time; toast('Kłody załadowane. Zawieź je do kopalni ⛏️'); } } }
    else if (near('mine', cars)) { c = ws.find(q => q.cargo === 1); if (c) { c.cargo = 0; star(c); refreshLabels(); }
      else { c = ws.find(q => q.cargo === 0 && q.shown === 0); if (c) { c.cargo = 2; sfx.thud(); refreshLabels(); if (time - boardT > 6) { boardT = time; toast('Węgiel załadowany. Zawieź go do elektrowni ⚡'); } } } }
    else if (near('power', cars)) { c = ws.find(q => q.cargo === 2); if (c) { c.cargo = 0; star(c); refreshLabels(); } } }
}
function updateTasks(dt) {
  spawnT += dt; if (spawnT > 5.5) { spawnT = 0; const key = PSTOPS[(Math.random()*PSTOPS.length) | 0]; if (waiting[key].length < 5) { const o = PSTOPS.filter(k => k !== key); waiting[key].push(o[(Math.random()*o.length) | 0]); refreshLabels(); } }
  for (const key in STOPS) { const st = STOPS[key]; if (st.sp.visible) st.sp.position.y = 8.5 + (st.hot ? Math.abs(Math.sin(time*3.2))*1.2 : 0);
    for (let k = 0; k < st.people.length; k++) if (st.people[k].visible) st.people[k].position.y = .55 + Math.abs(Math.sin(time*2.6 + k*1.7))*.09; }
  wagons.forEach(c => { if (c.shown !== c.cargo) { c.fill -= dt*2.2; if (c.fill <= 0) { c.fill = 0; c.shown = c.cargo; } } else if (c.shown && c.fill < 1) c.fill = Math.min(1, c.fill + dt*1.6);
    c.wood.visible = c.shown === 1 && c.fill > .02; c.coalG.visible = c.shown === 2 && c.fill > .02; c.wood.scale.y = c.coalG.scale.y = Math.max(.02, c.fill); });
}

/* =====================================================================
   POCIĄG NA TORACH
   ===================================================================== */
let path = [], pos = 0, total = 0, v = 0, odo = 0, travel = 1;
function tryPlace(i, j, a, b) {
  const m = grid[j*GW + i]; if (!(m >> a & 1) || !(m >> b & 1) || a === b) return false;
  const p = [mkSeg(i, j, a, b)]; let tot = p[0].len, guard = 0;
  while (tot < TRAIN_L + .5 && guard++ < 12) { const q = prevSeg(p[0]); if (!q) break; p.unshift(q); tot += q.len; }
  if (tot < TRAIN_L + .5) return false;
  path = p; total = tot; pos = tot; v = 0; return true;
}
function placeTrain() {
  if (tryPlace(7, 4, 3, 1)) return true;
  for (let idx = 0; idx < GW*GH; idx++) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (tryPlace(idx % GW, (idx / GW) | 0, a, b)) return true;
  return false;
}
function trimPath() {
  while (path.length > 1 && pos < total - path[path.length - 1].len - .02) total -= path.pop().len;
  while (path.length > 1 && pos - TRAIN_L > path[0].len + .02) { const s = path.shift(); total -= s.len; pos -= s.len; }
}
function fitTrain() {                              // po zmianie składu: dołóż trasę pod dłuższy pociąg
  let g = 0; while (pos - TRAIN_L < 0 && g++ < 12) { const p = prevSeg(path[0]); if (!p) break; path.unshift(p); total += p.len; pos += p.len; }
  if (pos - TRAIN_L < 0) { pos = TRAIN_L; g = 0; while (pos > total && g++ < 12) { const n = nextSeg(path[path.length - 1]); if (!n) return false; path.push(n); total += n.len; } if (pos > total) return false; }
  trimPath(); return true;
}
function refreshEnds() {                           // po przebudowie: ślepy koniec mógł dostać dalszy ciąg
  const l = path[path.length - 1];
  if (l.b < 0) { const idx = l.j*GW + l.i, o = optionsAt(idx, l.a); if (o.length) { const n = mkSeg(l.i, l.j, l.a, pickExit(o, (l.a + 2) % 4, idx, l.a), o.length > 1); total += n.len - l.len; path[path.length - 1] = n; } }
  const f = path[0];
  if (f.a < 0) { const idx = f.j*GW + f.i, o = optionsAt(idx, f.b); if (o.length) { const n = mkSeg(f.i, f.j, pickExit(o, (f.b + 2) % 4, idx, f.b), f.b, o.length > 1); total += n.len - f.len; pos += n.len - f.len; path[0] = n; } }
}
function occupied(idx) { for (let k = 0; k < path.length; k++) if (path[k].j*GW + path[k].i === idx) return true; return false; }
let endToastT = -9;
function moveTrain(dt) {
  if (!v) return; const d = v*dt; pos += d; odo += d; let hitEnd = false;
  while (pos > total) { const n = nextSeg(path[path.length - 1]); if (!n) { odo -= pos - total; pos = total; hitEnd = true; break; } path.push(n); total += n.len; }
  while (pos - TRAIN_L < 0) { const p = prevSeg(path[0]); if (!p) { odo += TRAIN_L - pos; pos = TRAIN_L; hitEnd = true; break; } path.unshift(p); total += p.len; pos += p.len; }
  trimPath();
  if (hitEnd) { const hard = Math.abs(v) > 1.5, A = v >= 0 ? lead : cars[cars.length - 1]; v = 0; if (hard) { sfx.thud(); for (let i = 0; i < 10; i++) emit(A.x, 1.2, A.z, rr(-3, 3), rr(1, 4), rr(-3, 3), .5, 1, .8, .3, 9); }
    if (time - endToastT > 5) { endToastT = time; toast('Koniec toru! Jedź w drugą stronę albo dołóż tory 🛤️'); } }
}
const sA = {}, sB = {};
function sample(d, o) { d = clamp(d, 0, total); let k = 0; while (k < path.length - 1 && d > path[k].len) { d -= path[k].len; k++; } segPoint(path[k], Math.min(d, path[k].len), o); }
function placeCars() {
  for (let n = 0; n < cars.length; n++) { const c = cars[n]; sample(pos - c.off, sA); sample(pos - c.off - c.wb, sB);
    c.x = (sA.x + sB.x)/2; c.z = (sA.z + sB.z)/2; c.h = Math.atan2(sA.x - sB.x, sA.z - sB.z); c.g.position.set(c.x, 0, c.z); c.g.rotation.y = c.h;
    c.steer = wrap(Math.atan2(sA.tx, sA.tz) - c.h);
    for (let k = 0; k < c.wheels.length; k++) { const w = c.wheels[k]; w.w.rotation.x = odo/w.r + w.ph; }
    if (TR.kind === 'pend') { c.tilt += (-c.steer*.5*Math.min(1, Math.abs(v)/8) - c.tilt)*.12; c.inner.rotation.z = c.tilt; } }   // Pendolino przechyla się w łukach
  if (TR.kind !== 'steam') return;
  const th = odo/R_DRV;
  steam.rods.forEach(o => { const a = th + o.ph, py = AXLE_Y + CRANK*Math.cos(a), pz = CRANK*Math.sin(a);
    o.cpl.position.y = py; o.cpl.position.z = .15 + pz;
    const zp = .15 + pz, dy = py - AXLE_Y, zc = zp + Math.sqrt(ROD_L*ROD_L - dy*dy);
    o.main.position.y = (py + AXLE_Y)/2; o.main.position.z = (zp + zc)/2; o.main.rotation.x = Math.asin(dy/ROD_L);
    o.head.position.z = zc; o.pist.position.z = zc + .5; });
  const k = Math.abs(v)/VMAX; steam.inner.rotation.z = Math.sin(time*8.5)*.006*k; steam.inner.position.y = Math.sin(time*17)*.012*k;
}
const routeJ = [], aheadIdx = [];
function scanAhead() {                             // kratki na trasie tuż przed pociągiem
  aheadIdx.length = 0; let sg = travel > 0 ? path[path.length - 1] : path[0]; aheadIdx.push(sg.j*GW + sg.i);
  for (let n = 0; n < 8; n++) { const nx = travel > 0 ? nextSeg(sg) : prevSeg(sg); if (!nx) break; aheadIdx.push(nx.j*GW + nx.i); sg = nx; }
}
function predict() {                               // zwrotnice na trasie przed pociągiem
  routeJ.length = 0; let sg = travel > 0 ? path[path.length - 1] : path[0];
  for (let n = 0; n < 14 && routeJ.length < 3; n++) { const nx = travel > 0 ? nextSeg(sg) : prevSeg(sg); if (!nx) break;
    if (nx.junc) routeJ.push({ idx:nx.j*GW + nx.i, i:nx.i, j:nx.j, e:travel > 0 ? nx.a : nx.b, exit:travel > 0 ? nx.b : nx.a }); sg = nx; }
}
function switchNext() { if (routeJ.length) cycleSwitch(routeJ[0].idx, routeJ[0].e); }
function tapSwitch(e) {                            // stuknięcie w zwrotnicę albo w strzałkę nad nią
  ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera);
  let best = null, bd = 1e9;
  for (let k = 0; k < routeJ.length; k++) { const a = turnArrows[k]; if (!a.visible) continue; const d = ray.ray.distanceToPoint(a.position), far = camera.position.distanceTo(a.position); if (d < 2.6 + far*.02 && far < bd) { bd = far; best = routeJ[k]; } }
  if (best) { cycleSwitch(best.idx, best.e); return; }
  if (!ray.ray.intersectPlane(groundPlane, hitV)) return;
  const i = Math.floor((hitV.x + HALF_X)/TS), j = Math.floor((hitV.z + HALF_Z)/TS); if (!inGrid(i, j)) return;
  const idx = j*GW + i, m = grid[idx]; let n = 0; for (let k = 0; k < 4; k++) n += m >> k & 1; if (n < 3) return;
  const rj = routeJ.find(r => r.idx === idx); if (rj) { cycleSwitch(idx, rj.e); return; }
  const lx = hitV.x - tileX(i), lz = hitV.z - tileZ(j); let be = -1, bs = -1e9;
  for (let k = 0; k < 4; k++) if (m >> k & 1) { const s = DX[k]*lx + DZ[k]*lz; if (s > bs) { bs = s; be = k; } }
  cycleSwitch(idx, be);
}
let hornPulse = false, chuffAcc = 0, chuffN = 0, idleT = 0, clackAcc = 0, lastChuffT = 0, plantT = 0, swBtn = null;
function update(dt) {
  time += dt;
  if (S.mode === 'drive' && S.veh === 'train') {
    const want = keys.fwd ? 1 : keys.back ? -1 : 0, brk = a => { v -= Math.sign(v)*Math.min(Math.abs(v), a*dt); };
    if (!want) brk(Math.abs(v) > .2 && (TR.pass ? PSTOPS : FSTOPS).some(k => near(k, cars)) ? 14 : 5.5);   // przy peronie pociąg sam mocniej hamuje
    else if (v*want < -.05) brk(9); else v = want > 0 ? Math.min(VMAX, v + TR.acc*dt) : Math.max(-VREV, v - 2.6*dt);
    if (Math.abs(v) > .01) travel = Math.sign(v); else if (want) travel = want;
    scanAhead(); extras(dt); crossings(dt, true); signals(dt); moveTrain(dt); service(dt);
  } else { v = 0; crossings(dt, false); for (let k = 0; k < 3; k++) sigs[k].g.visible = false; }
  traffic(dt); if (S.veh === 'car') { if (S.mode === 'drive') driveCar(dt); carExtras(dt); }
  placeCars(); updateTasks(dt);
  if (S.mode === 'drive' && S.veh === 'train') predict(); else routeJ.length = 0;
  for (let k = 0; k < 3; k++) { const a = turnArrows[k], r = routeJ[k]; a.visible = !!r;
    if (r) { const x = r.exit; a.position.set(tileX(r.i) + DX[x]*2.2, 5.2 + Math.sin(time*4 + k)*.35, tileZ(r.j) + DZ[x]*2.2); a.rotation.y = Math.atan2(DX[x], DZ[x]); } }
  { const has = routeJ.length > 0; if (has !== swBtn) { swBtn = has; $('pSw').disabled = !has; } }
  // para, dym, stukot, silniki
  const sp = Math.abs(v), work = !!(keys.fwd || keys.back), drive = S.mode === 'drive', pa = S.cam === 2 && drive ? .3 : 1;
  if (TR.kind === 'steam') {
    steam.g.updateMatrixWorld(); steam.inner.localToWorld(tmpV.copy(steam.chim));
    if (sp > .2) { chuffAcc += sp*dt; const step = 2*Math.PI*R_DRV/4;
      if (chuffAcc > step) { chuffAcc = 0; chuffN++;
        puff(tmpV.x, tmpV.y, tmpV.z, rr(-.4, .4), work ? 5.2 : 3.2, rr(-.4, .4), work ? 2.3 : 1.6, work ? 1.7 : 1.15, work ? .82 : .96, pa);
        if (time - lastChuffT > .095) { lastChuffT = time; sfx.chuff(chuffN % 4 === 0, (work ? .5 : .22)*(1 - sp/VMAX*.35)); }
        if (work && sp < 3.5 && chuffN % 2 === 0) [-1, 1].forEach(s => { steam.inner.localToWorld(tmpV.set(s*1.5, 1.1, 3.6)); puff(tmpV.x, tmpV.y, tmpV.z, Math.cos(steam.h)*s*2.2, .6, -Math.sin(steam.h)*s*2.2, .9, .9, 1); }); }
    } else { idleT += dt; if (idleT > 1.3) { idleT = 0; puff(tmpV.x, tmpV.y, tmpV.z, rr(-.2, .2), 2.2, rr(-.2, .2), 2.2, .9, .95, pa); } }
  }
  if (sp > .2) { clackAcc += sp*dt; if (clackAcc > TS) { clackAcc = 0; sfx.clack(); } }
  plantT += dt; if (plantT > 1.2) { plantT = 0; puff(PLANT[0].x, PLANT[0].y, PLANT[0].z, rr(-.2, .2), 2.6, rr(-.2, .2), 3.6, 2.4, 1); puff(PLANT[1].x, PLANT[1].y, PLANT[1].z, rr(-.1, .1), 3, rr(-.1, .1), 3, 1.1, .6); }
  if (AU.ctx) { const t = AU.ctx.currentTime, st = TR.kind === 'steam', pd = TR.kind === 'pend';
    AU.roll.gain.setTargetAtTime(drive ? sp/VMAX*.5 : 0, t, .15); AU.hiss.gain.setTargetAtTime(st ? (drive && sp < .3 ? .035 : .008) : 0, t, .3); AU.rainG.gain.setTargetAtTime(WX.rain ? .11 : 0, t, .3);
    AU.mot.gain.setTargetAtTime(!st && drive ? .035 + sp/VMAX*(work ? .11 : .06) : 0, t, .12); const f = (pd ? 120 : 70) + sp*(pd ? 17 : 13);
    AU.motO[0].frequency.setTargetAtTime(f, t, .1); AU.motO[1].frequency.setTargetAtTime(f*2.01, t, .1); AU.motO[2].frequency.setTargetAtTime(500 + sp*60, t, .1); }
  { const hp = (tcow.on && tcow.told && !tcow.leave) || !!(xPrompt && xPrompt.told); if (hp !== hornPulse) { hornPulse = hp; $('bHorn').classList.toggle('pulse', hp); } }
  if (S.veh === 'car') { const s2 = Math.abs(pc.v);                                            // silnik auta
    if (AU.ctx) { const t = AU.ctx.currentTime, f = AV.eng[0] + s2*AV.eng[1]; AU.mot.gain.setTargetAtTime(drive ? .045 + s2/AV.vmax*.06 + (keys.fwd ? .03 : 0) : 0, t, .1);
      AU.motO[0].frequency.setTargetAtTime(f, t, .08); AU.motO[1].frequency.setTargetAtTime(f*1.5, t, .08); AU.motO[2].frequency.setTargetAtTime(420 + s2*45, t, .1); AU.roll.gain.setTargetAtTime(drive ? Math.min(.3, s2/40*.3) : 0, t, .15); }
    $('spd').textContent = Math.round(s2*3.6); }
  else $('spd').textContent = Math.round(sp*3.6);
}

/* =====================================================================
   ATRAKCJE NA TRASIE: gwiazdki do zebrania i krowa, którą trzeba przegonić gwizdkiem
   ===================================================================== */
const starGeo = (() => { const s = new T.Shape(); for (let k = 0; k < 10; k++) { const a = k/10*6.283 + Math.PI/2, r = k % 2 ? .5 : 1.15; if (k) s.lineTo(Math.cos(a)*r, Math.sin(a)*r); else s.moveTo(Math.cos(a)*r, Math.sin(a)*r); }
  const g = new T.ExtrudeGeometry(s, { depth:.3, bevelEnabled:false }); g.translate(0, 0, -.15); return g; })();
const starMat = pho(0xffd21f, { metalness:.5, roughness:.25, emissive:0x8a5c00, emissiveIntensity:.9 });
const tstars = [];
for (let k = 0; k < 9; k++) { const m = new T.Mesh(starGeo, starMat); m.visible = false; m.castShadow = true; scene.add(m); tstars.push({ m, on:false, idx:0, a:0, b:0, x:0, z:0 }); }
const tcow = { g:makeCow(0), on:false, idx:-1, a:0, b:0, x:0, z:0, px:0, pz:0, leave:0, age:0, told:false, d:999 };
tcow.g.scale.setScalar(1.5); tcow.g.visible = false; scene.add(tcow.g);
let tstarT = 0, combo = 0, comboT = 0, cowT = 14;
const sC = {};
function spawnTStar() {
  const s = tstars.find(q => !q.on); if (!s) return;
  const cand = []; for (let q = 0; q < GW*GH; q++) if (grid[q] && Math.hypot(tileX(q % GW) - lead.x, tileZ((q / GW) | 0) - lead.z) < 170) cand.push(q); if (!cand.length) return;
  for (let tries = 0; tries < 30; tries++) { const idx = cand[(Math.random()*cand.length) | 0], m = grid[idx], bits = []; for (let k = 0; k < 4; k++) if (m >> k & 1) bits.push(k);
    if (bits.length < 2 || occupied(idx) || tstars.some(q => q.on && q.idx === idx) || (tcow.on && tcow.idx === idx)) continue;
    const a = bits[(Math.random()*bits.length) | 0]; let b; do b = bits[(Math.random()*bits.length) | 0]; while (b === a);
    const sg = mkSeg(idx % GW, (idx / GW) | 0, a, b); segPoint(sg, sg.len/2, sC); if (Math.hypot(sC.x - lead.x, sC.z - lead.z) < 24) continue;
    s.rd = false; s.on = true; s.idx = idx; s.a = a; s.b = b; s.x = sC.x; s.z = sC.z; s.m.position.set(sC.x, 2.7, sC.z); s.m.scale.setScalar(.05); s.m.visible = true; return; }
}
function spawnCow() {                              // krowa staje kilka kratek przed pociągiem
  let sg = travel > 0 ? path[path.length - 1] : path[0]; const n = 3 + ((Math.random()*3) | 0);
  for (let k = 0; k < n; k++) { const nx = travel > 0 ? nextSeg(sg) : prevSeg(sg); if (!nx) return; sg = nx; }
  const idx = sg.j*GW + sg.i; if (sg.a < 0 || sg.b < 0 || occupied(idx)) return; segPoint(sg, sg.len/2, sC);
  Object.assign(tcow, { on:true, idx, a:sg.a, b:sg.b, x:sC.x, z:sC.z, px:-sC.tz, pz:sC.tx, leave:0, age:0, told:false, d:999 });
  tcow.g.position.set(sC.x, .12, sC.z); tcow.g.rotation.y = Math.atan2(tcow.px, tcow.pz); tcow.g.visible = true;
}
function cowOff() { tcow.on = false; tcow.g.visible = false; cowT = 0; }
function shooCow() { if (!tcow.on || tcow.leave || tcow.d > 75) return false; tcow.leave = .001; sfx.moo(); return true; }
function checkExtras() {                           // po zmianie torów: nic nie może wisieć nad trawą
  tstars.forEach(s => { if (s.on && !(((s.rd ? road : grid)[s.idx] >> s.a & 1) && ((s.rd ? road : grid)[s.idx] >> s.b & 1))) { s.on = false; s.m.visible = false; } });
  if (tcow.on && !((grid[tcow.idx] >> tcow.a & 1) && (grid[tcow.idx] >> tcow.b & 1))) cowOff();
}
function extras(dt) {
  comboT -= dt; if (comboT <= 0) combo = 0;
  tstarT += dt; if (tstarT > 1.5) { tstarT = 0; if (tstars.filter(q => q.on).length < 8) spawnTStar(); }
  for (let n = 0; n < tstars.length; n++) { const s = tstars[n]; if (!s.on) continue;
    s.m.rotation.y = time*2.4 + n; s.m.position.y = 2.7 + Math.sin(time*3 + n)*.25; if (s.m.scale.x < 1) s.m.scale.setScalar(Math.min(1, s.m.scale.x + dt*3));
    for (let k = 0; k < cars.length; k++) if (Math.hypot(cars[k].x - s.x, cars[k].z - s.z) < 3.6) { s.on = false; s.m.visible = false; combo++; comboT = 4;
      tone(620 + Math.min(combo, 8)*95, .18, 'triangle', .28, 1240 + Math.min(combo, 8)*120); for (let i = 0; i < 12; i++) emit(s.x, 2.7, s.z, rr(-4, 4), rr(2, 7), rr(-4, 4), .8, 1, .85, .2, 10);
      addScore(1); progress('star'); break; } }
  if (!tcow.on) { if (Math.abs(v) > 2) cowT += dt; if (cowT > (mission && mission.kind === 'cow' ? 7 : 28)) { cowT = 0; spawnCow(); } return; }
  tcow.age += dt;
  if (tcow.leave) { tcow.leave += dt; const u = tcow.leave/2.2; tcow.g.position.set(tcow.x + tcow.px*u*9, .12 + Math.abs(Math.sin(u*12))*.3, tcow.z + tcow.pz*u*9); if (u >= 1) cowOff(); return; }
  if (tcow.age > 70) { cowOff(); return; }
  sample(travel > 0 ? pos : pos - TRAIN_L, sC); const dx = tcow.x - sC.x, dz = tcow.z - sC.z, d = Math.hypot(dx, dz), ahead = (dx*sC.tx + dz*sC.tz)*travel > 0 && aheadIdx.includes(tcow.idx);
  tcow.d = d;
  if (ahead && d < 36) { if (!tcow.told) { tcow.told = true; toast('Krowa na torach! Zatrąb 📯'); sfx.moo(); }
    const mv = Math.max(0, (d - 7)*1.3); if (Math.abs(v) > mv) v = Math.sign(v)*mv; }           // pociąg sam zwalnia i staje przed krową
}

/* =====================================================================
   DROGI, AUTA, PRZEJAZDY ZE SZLABANAMI I SEMAFORY
   ===================================================================== */
// ---------- drogi: kratki z drogą mają bity połączeń jak tory; kawałki asfaltu skleja buildChunk
const RW = 3.2;                                    // połowa szerokości asfaltu
const roadMat = lam(0x565a60, { polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 }), lineMat = lam(0xf2efe6, { polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 });
function flatGeo(pts) {                            // płaska siatka z trójkątów o wierzchołkach [x, z]
  const P = [], N = [], U = [];
  for (let k = 0; k < pts.length; k += 3) { const a = pts[k]; let b = pts[k + 1], c = pts[k + 2]; if ((b[1] - a[1])*(c[0] - a[0]) - (b[0] - a[0])*(c[1] - a[1]) < 0) { const t = b; b = c; c = t; }
    [a, b, c].forEach(p => { P.push(p[0], 0, p[1]); N.push(0, 1, 0); U.push(p[0]/7, p[1]/7); }); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); return g;
}
const quad = (a, b, c, d) => [a, b, c, a, c, d];
const RT = (() => {                                // prosta (północ–południe), łuk (północ–wschód) i ślepy koniec (od północy)
  const o = {}, pt = (f, r) => [7 - Math.cos(f)*r, -7 + Math.sin(f)*r], dash = (z0, z1) => quad([-.11, z0], [.11, z0], [.11, z1], [-.11, z1]);
  o.straight = { road:flatGeo(quad([-RW, -7], [RW, -7], [RW, 7], [-RW, 7])), line:flatGeo(dash(-5, -2).concat(dash(2, 5))) };
  let A = [], L = [];
  for (let k = 0; k < 10; k++) { const f0 = k/10*Math.PI/2, f1 = (k + 1)/10*Math.PI/2; A = A.concat(quad(pt(f0, 7 - RW), pt(f0, 7 + RW), pt(f1, 7 + RW), pt(f1, 7 - RW))); }
  [[.09, .36], [.64, .91]].forEach(d => { for (let k = 0; k < 3; k++) { const f0 = (d[0] + (d[1] - d[0])*k/3)*Math.PI/2, f1 = (d[0] + (d[1] - d[0])*(k + 1)/3)*Math.PI/2; L = L.concat(quad(pt(f0, 6.89), pt(f0, 7.11), pt(f1, 7.11), pt(f1, 6.89))); } });
  o.curve = { road:flatGeo(A), line:flatGeo(L) };
  A = quad([-RW, -7], [RW, -7], [RW, 0], [-RW, 0]);
  for (let k = 0; k < 8; k++) { const t0 = k/8*Math.PI, t1 = (k + 1)/8*Math.PI; A.push([0, 0], [RW*Math.cos(t0), RW*Math.sin(t0)], [RW*Math.cos(t1), RW*Math.sin(t1)]); }
  o.half = { road:flatGeo(A), line:flatGeo(dash(-5, -2)) };
  return o;
})();
{ // główne drogi biegną dalej poza planszę
  const x = tileX(RV), z = tileZ(RH), E = 260; let A = [], L = [];
  A = A.concat(quad([x - RW, -HALF_Z - E], [x + RW, -HALF_Z - E], [x + RW, -HALF_Z], [x - RW, -HALF_Z]), quad([x - RW, HALF_Z], [x + RW, HALF_Z], [x + RW, HALF_Z + E], [x - RW, HALF_Z + E]),
    quad([-HALF_X - E, z - RW], [-HALF_X, z - RW], [-HALF_X, z + RW], [-HALF_X - E, z + RW]), quad([HALF_X, z - RW], [HALF_X + E, z - RW], [HALF_X + E, z + RW], [HALF_X, z + RW]));
  for (let s = 2; s < E; s += 7) { L = L.concat(quad([x - .11, -HALF_Z - s - 3], [x + .11, -HALF_Z - s - 3], [x + .11, -HALF_Z - s], [x - .11, -HALF_Z - s]), quad([x - .11, HALF_Z + s], [x + .11, HALF_Z + s], [x + .11, HALF_Z + s + 3], [x - .11, HALF_Z + s + 3]),
    quad([-HALF_X - s - 3, z - .11], [-HALF_X - s, z - .11], [-HALF_X - s, z + .11], [-HALF_X - s - 3, z + .11]), quad([HALF_X + s, z - .11], [HALF_X + s + 3, z - .11], [HALF_X + s + 3, z + .11], [HALF_X + s, z + .11])); }
  const a = new T.Mesh(flatGeo(A), roadMat); a.position.y = .03; a.receiveShadow = true; scene.add(a); const l = new T.Mesh(flatGeo(L), lineMat); l.position.y = .05; l.receiveShadow = true; scene.add(l);
}
function roadOk(t, k) {                            // czy na kratce t może powstać droga w stronę k: tor wolno przeciąć tylko prosto, w poprzek
  if (blocked[t]) return -1;
  if (grid[t] && (grid[t] !== (k % 2 ? 5 : 10) || (road[t] & ~((1 << k) | (1 << ((k + 2) % 4)))))) return -2;
  return 1;
}
function connectRoad(i1, j1, i2, j2) {             // 1 nowa droga, 0 już była, -1 nie da się, -2 koliduje z torem
  if (!inGrid(i1, j1) || !inGrid(i2, j2)) return -1; const a = j1*GW + i1, b = j2*GW + i2;
  let k = -1; for (let s = 0; s < 4; s++) if (i1 + DX[s] === i2 && j1 + DZ[s] === j2) k = s; if (k < 0) return -1;
  if (road[a] >> k & 1) return 0;
  const ra = roadOk(a, k), rb = roadOk(b, (k + 2) % 4); if (ra < 0 || rb < 0) return Math.min(ra, rb);
  road[a] |= 1 << k; road[b] |= 1 << ((k + 2) % 4); return 1;
}
function defaultRoads() {                          // drogi układane same na początku
  road = new Uint8Array(GW*GH);
  const line = (i1, j1, i2, j2) => { let i = i1, j = j1; while (i !== i2 || j !== j2) { const ni = i + Math.sign(i2 - i), nj = j + Math.sign(j2 - j); connectRoad(i, j, ni, nj); i = ni; j = nj; } };
  line(RV, 0, RV, GH - 1); line(0, RH, GW - 1, RH);                                         // dwie główne drogi
  [[RV, 0, 0], [RV, GH - 1, 2], [0, RH, 3], [GW - 1, RH, 1]].forEach(q => { const t = q[1]*GW + q[0]; if (road[t]) road[t] |= 1 << q[2]; });   // …wybiegają poza planszę
  line(4, 2, 25, 2); line(6, 17, 24, 17); line(12, 13, RV, 13); line(28, RH, 28, 11);       // ulice do stacji, zoo, stawu, tartaku i elektrowni
}
function loadRoads(arr) {                          // zapisane drogi: tylko poprawne połączenia, zgodne z torami
  road = new Uint8Array(GW*GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const t = j*GW + i, m = arr[t] | 0; for (let k = 0; k < 4; k++) if (m >> k & 1) { const i2 = i + DX[k], j2 = j + DZ[k];
    if (!inGrid(i2, j2)) { if (!blocked[t] && !grid[t]) road[t] |= 1 << k; } else if (k < 2 && (arr[j2*GW + i2] >> ((k + 2) % 4) & 1)) connectRoad(i, j, i2, j2); } }
}
// ---------- przejazdy: powstają same tam, gdzie tor przecina drogę
const stripeMat = lam(0xffffff, { map:tex(64, 16, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#ffffff' : '#d8301f'; g.fillRect(k*8, 0, 8, h); } }) });
const xLampOn = new T.MeshBasicMaterial({ color:0xff2a1a }), xLampOff = new T.MeshBasicMaterial({ color:0x3a0a08 });
const xings = new Map();
function syncXing(idx) {
  const rt = roadType(idx), need = (rt === 1 || rt === 2) && grid[idx], have = xings.get(idx);
  if (!need) { if (have) { scene.remove(have.g); xings.delete(idx); } return; } if (have) return;
  const g = new T.Group(), st = new T.Group(), x = { idx, g, o:rt, cx:tileX(idx % GW), cz:tileZ((idx / GW) | 0), arms:[], lamps:[], closed:0, want:false, told:false, train:false, clearT:0 };
  [[-1, -1], [1, 1]].forEach(q => { const sx = q[0]*3.75, sz = q[1]*3.5;                        // słupek po prawej stronie każdego pasa
    cylY(.09, 3.2, M.dark, sx, 1.6, sz, st, 8); box(.5, .7, .5, M.dark, sx, .55, sz, st); box(.78, .36, .14, M.dark, sx, 2.35, sz, st);
    [-.6, .6].forEach(r => { const c = box(1.6, .17, .05, stripeMat, sx, 3.15, sz, st); c.rotation.z = r; });
    [-.19, .19].forEach(o => { const l = cylZ(.12, .05, xLampOff, sx + o, 2.35, sz + q[1]*.09, g, 10); x.lamps.push(l); });
    const arm = new T.Group(), bar = box(3.95, .14, .1, stripeMat, -q[0]*1.97, 0, 0, arm); bar.castShadow = true; arm.position.set(sx, 1.05, sz); g.add(arm); x.arms.push({ g:arm, s:q[0] }); });
  g.add(bake(st)); g.position.set(x.cx, 0, x.cz); g.rotation.y = rt === 2 ? Math.PI/2 : 0; scene.add(g); xings.set(idx, x);
}
// ---------- auta jeżdżą same po drogach: prawym pasem, losowo skręcają, na ślepym końcu zawracają
const roadCars = [], sR = {}, PC4 = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4], ULEN = 10 + Math.PI*1.6;
const rOpts = (idx, e) => { const m = road[idx], o = []; for (let k = 0; k < 4; k++) if (k !== e && (m >> k & 1)) o.push(k); return o; };
function carSpawn(c, anywhere) {                   // nowe auto wjeżdża główną drogą spoza planszy
  const ent = [];
  if (!anywhere) { for (let i = 0; i < GW; i++) { if (road[i] & 1) ent.push([i, 0, 0]); if (road[(GH - 1)*GW + i] & 4) ent.push([i, GH - 1, 2]); }
    for (let j = 0; j < GH; j++) { if (road[j*GW] & 8) ent.push([0, j, 3]); if (road[j*GW + GW - 1] & 2) ent.push([GW - 1, j, 1]); } }
  c.s = 0; c.v = c.vmax;
  if (ent.length) { const e = ent[(Math.random()*ent.length) | 0], k = e[2];
    c.seg = { o:1, x0:tileX(e[0]) + DX[k]*127, z0:tileZ(e[1]) + DZ[k]*127, dx:-DX[k], dz:-DZ[k], len:120, i:e[0], j:e[1], a:k }; c.g.visible = true; return; }
  const cand = []; for (let idx = 0; idx < GW*GH; idx++) if (road[idx]) cand.push(idx);
  if (!cand.length) { c.seg = null; c.g.visible = false; return; }
  const idx = cand[(Math.random()*cand.length) | 0], i = idx % GW, j = (idx / GW) | 0, bits = []; for (let k = 0; k < 4; k++) if (road[idx] >> k & 1) bits.push(k);
  if (bits.length < 2) c.seg = { i, j, a:bits[0], b:bits[0], u:1, len:ULEN };
  else { const a = bits[(Math.random()*bits.length) | 0]; let b; do b = bits[(Math.random()*bits.length) | 0]; while (b === a); c.seg = mkSeg(i, j, a, b); }
  c.s = Math.random()*c.seg.len*.8; c.g.visible = true;
}
function resetTraffic() { roadCars.forEach(c => carSpawn(c, true)); }
function carNext(c) {
  const sg = c.seg; c.s -= sg.len;
  if (sg.o === 2) { carSpawn(c); return; }
  let i, j, e;
  if (sg.o === 1) { i = sg.i; j = sg.j; e = sg.a; }
  else { const b = sg.b; i = sg.i + DX[b]; j = sg.j + DZ[b]; e = (b + 2) % 4;
    if (!inGrid(i, j)) { c.seg = { o:2, x0:tileX(sg.i) + DX[b]*7, z0:tileZ(sg.j) + DZ[b]*7, dx:DX[b], dz:DZ[b], len:120 }; return; } }
  const idx = j*GW + i; if (!(road[idx] >> e & 1)) { carSpawn(c); return; }
  const o = rOpts(idx, e); if (!o.length) { c.seg = { i, j, a:e, b:e, u:1, len:ULEN }; return; }
  const st = (e + 2) % 4; c.seg = mkSeg(i, j, e, o.includes(st) && Math.random() < .6 ? st : o[(Math.random()*o.length) | 0]);
}
function carPt(c) {
  const sg = c.seg, s = c.s; let x, z, tx, tz;
  if (sg.o) { x = sg.x0 + sg.dx*s; z = sg.z0 + sg.dz*s; tx = sg.dx; tz = sg.dz; }
  else if (sg.u) {                                 // zawracanie na ślepym końcu
    const dx = -DX[sg.a], dz = -DZ[sg.a], nx = -dz, nz = dx, mx = tileX(sg.i) + DX[sg.a]*7, mz = tileZ(sg.j) + DZ[sg.a]*7, arc = Math.PI*1.6;
    if (s < 5) { c.x = mx + dx*s + nx*1.6; c.z = mz + dz*s + nz*1.6; c.dx = dx; c.dz = dz; }
    else if (s < 5 + arc) { const f = (s - 5)/1.6, co = Math.cos(f), si = Math.sin(f); c.x = mx + dx*5 + nx*1.6*co + dx*1.6*si; c.z = mz + dz*5 + nz*1.6*co + dz*1.6*si; c.dx = -nx*si + dx*co; c.dz = -nz*si + dz*co; }
    else { const q = 5 - (s - 5 - arc); c.x = mx + dx*q - nx*1.6; c.z = mz + dz*q - nz*1.6; c.dx = -dx; c.dz = -dz; }
    return; }
  else { segPoint(sg, s, sR); x = sR.x; z = sR.z; tx = sR.tx; tz = sR.tz; }
  c.x = x - tz*1.6; c.z = z + tx*1.6; c.dx = tx; c.dz = tz;                                   // prawy pas
}
function traffic(dt) {
  const me = S.veh === 'car' ? pc : null;
  for (let n = 0; n < roadCars.length; n++) { const c = roadCars[n], sg = c.seg;
    if (!sg) { c.wait += dt; if (c.wait > 3) { c.wait = 0; carSpawn(c); } continue; }
    if (!sg.o) { const m = road[sg.j*GW + sg.i]; if (!(m >> sg.a & 1) || !(m >> sg.b & 1)) { carSpawn(c); continue; } }   // drogę spod kół zabrała gumka
    let lim = c.vmax;
    if (!sg.o && !sg.u) { const i = sg.i + DX[sg.b], j = sg.j + DZ[sg.b];
      if (inGrid(i, j)) { const idx = j*GW + i, x = xings.get(idx), gap = sg.len - c.s;
        if (x && (x.want || x.closed > .05 || x.train)) lim = Math.min(lim, Math.max(0, (gap - 1.2)*1.4));               // stań przed zamkniętym przejazdem
        else if (PC4[road[idx]] > 2 && roadCars.some(q => q !== c && q.seg && !q.seg.o && q.seg.i === i && q.seg.j === j)) lim = Math.min(lim, Math.max(0, (gap - 1.5)*1.4)); } }   // na skrzyżowaniu ustąp
    const ahead = (ox, oz, keep) => { const rx = ox - c.x, rz = oz - c.z, ah = rx*c.dx + rz*c.dz; if (ah > .5 && ah < 18 && Math.abs(rz*c.dx - rx*c.dz) < 2.2) lim = Math.min(lim, Math.max(0, (ah - keep)*1.2)); };
    for (let k = 0; k < roadCars.length; k++) { const q = roadCars[k]; if (q !== c && q.seg) ahead(q.x, q.z, q.bus || c.bus ? 10 : 7.5); }
    if (me) ahead(me.x, me.z, 8.5);
    c.v += clamp(lim - c.v, -12*dt, 3*dt); c.s += c.v*dt; let g = 0; while (c.seg && c.s >= c.seg.len && g++ < 4) carNext(c);
    if (!c.seg) continue;
    carPt(c); c.g.position.set(c.x, 0, c.z); c.g.rotation.y = Math.atan2(c.dx, c.dz); }
}
let xPrompt = null, xBellT = 0;
const sX = {};
function crossings(dt, drive) {                    // szlabany: zamyka je gwizdek, otwierają się same za pociągiem
  sample(travel > 0 ? pos : pos - TRAIN_L, sX); xPrompt = null; let best = 1e9, bell = false;
  xings.forEach(x => { const dx = x.cx - sX.x, dz = x.cz - sX.z, d = Math.hypot(dx, dz), ahead = drive && (dx*sX.tx + dz*sX.tz)*travel > 0 && aheadIdx.includes(x.idx);
    let on = false; for (let k = 0; k < cars.length; k++) if (Math.hypot(cars[k].x - x.cx, cars[k].z - x.cz) < 9) { on = true; break; }
    x.train = on || (ahead && d < 22 && Math.abs(v) > .3); if (on) x.want = true;
    if (drive && ahead && d < 80 && !on) { x.clearT = 0;
      if (!x.want && d < best) { best = d; xPrompt = x; }
      const busy = roadCars.some(c => c.seg && Math.hypot(c.x - x.cx, c.z - x.cz) < 5.4);
      if (!(x.want && x.closed > .9 && !busy)) { const mv = Math.max(0, (d - 11)*1.2); if (Math.abs(v) > mv) v = Math.sign(v)*mv; } }   // pociąg czeka, aż szlaban opadnie
    else if (!on) { if (x.want) { x.clearT += dt; if (x.clearT > 1.2) x.want = false; } x.told = false; }
    x.closed += clamp((x.want ? 1 : 0) - x.closed, -dt*1.1, dt*1.1);
    for (let k = 0; k < 2; k++) x.arms[k].g.rotation.z = -x.arms[k].s*(1 - x.closed)*1.4;
    const act = x.want || x.closed > .02, ph = ((time*2.4) | 0) % 2; for (let k = 0; k < 4; k++) x.lamps[k].material = act && k % 2 === ph ? xLampOn : xLampOff;
    if (x.want && d < 110) bell = true; });
  if (xPrompt && best < 62 && !xPrompt.told) { xPrompt.told = true; toast('Przejazd! Zatrąb 📯 i zamknij szlaban'); }
  if (bell && drive) { xBellT -= dt; if (xBellT <= 0) { xBellT = .42; tone(((time*2.4) | 0) % 2 ? 1180 : 940, .16, 'square', .045); } }
}
// ---------- semafory przy zwrotnicach na trasie; czasem zapala się czerwone
const sigs = [];
for (let k = 0; k < 3; k++) { const g = new T.Group(), st = new T.Group(), lamps = [];
  cylY(.09, 4.4, M.dark, 0, 2.2, 0, st, 8); box(.3, .9, .3, stripeMat, 0, .45, 0, st); box(.62, 1.7, .3, M.matte, 0, 4.6, 0, st); box(.9, 1.95, .06, M.matte, 0, 4.6, -.12, st);
  g.add(bake(st)); [5.15, 4.6, 4.05].forEach(y => { const l = cylZ(.19, .06, new T.MeshBasicMaterial({ color:0x222222 }), 0, y, .17, g, 12); lamps.push(l); });
  g.visible = false; scene.add(g); sigs.push({ g, lamps, state:-1 }); }
const SIG_ON = [0xff2a1a, 0xffc21f, 0x35e04a], SIG_OFF = [0x3a0a08, 0x3a2c06, 0x0a3410];
function setSig(s, state) { if (s.state === state) return; s.state = state; for (let k = 0; k < 3; k++) s.lamps[k].material.color.setHex(k === state ? SIG_ON[k] : SIG_OFF[k]); }
let redSig = null, lastJKey = -1, lastRedT = -99;
function signals(dt) {
  const r0 = routeJ[0], key = r0 ? r0.idx*4 + r0.e : -1;
  sample(travel > 0 ? pos : pos - TRAIN_L, sX);
  const dist = r => Math.hypot(tileX(r.i) + DX[r.e]*7 - sX.x, tileZ(r.j) + DZ[r.e]*7 - sX.z);
  if (key !== lastJKey) { lastJKey = key;
    if (r0 && !redSig && !tcow.on && !xPrompt && time - lastRedT > 55 && Math.abs(v) > 5 && dist(r0) > 38 && Math.random() < .35) redSig = { key, phase:0, t:0, told:false }; }
  if (redSig) { const r = routeJ.find(q => q.idx*4 + q.e === redSig.key);
    if (!r) { redSig = null; lastRedT = time; }
    else if (redSig.phase < 2) { const d = dist(r), mv = Math.max(0, (d - 9)*1.3); if (Math.abs(v) > mv) v = Math.sign(v)*mv;                // pociąg sam staje przed czerwonym
      if (d < 45 && !redSig.told) { redSig.told = true; toast('Czerwone światło! Poczekaj na zielone 🚦'); tone(440, .25, 'square', .1); }
      if (d < 17 && Math.abs(v) < 1.5) { redSig.t += dt; if (redSig.phase === 0 && redSig.t > 1.2) { redSig.phase = 1; tone(440, .2, 'square', .12); }
        else if (redSig.phase === 1 && redSig.t > 2.3) { redSig.phase = 2; tone(880, .6, 'square', .14); lastRedT = time; } } } }
  for (let k = 0; k < 3; k++) { const s = sigs[k], r = routeJ[k]; s.g.visible = !!r; if (!r) continue; const e = r.e;
    s.g.position.set(tileX(r.i) + DX[e]*7 + DZ[e]*3.4, 0, tileZ(r.j) + DZ[e]*7 - DX[e]*3.4); s.g.rotation.y = Math.atan2(DX[e], DZ[e]);
    setSig(s, redSig && redSig.key === r.idx*4 + r.e ? redSig.phase : 2); }
}

/* =====================================================================
   TRYB AUTO: taksówka, autobus, wyścigówka i Ursus; kursy z pasażerami i gwiazdki na drogach
   ===================================================================== */
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
{ const cols = [0xd8452f, 0x2f7fd8, 0xf2c230, 0xf4f4f0, 0x3f9a4a, 0x8e4fc2, 0x20b2aa, 0xff8a3d, 0x9aa3ad, 0x2f9a6a];                    // auta w ruchu ulicznym
  for (let n = 0; n < 10; n++) { const bus = n === 9, g = aiModel(cols[n], bus ? 3 : n % 3); g.visible = false; scene.add(g); roadCars.push({ g, bus, seg:null, s:0, v:0, vmax:rr(7, 11), x:0, z:0, dx:0, dz:1, wait:0 }); } }
let AK = 'taxi', AV = AUTOS.taxi, pc = AV.car, offK = 0, bumpT = -9;

// ---------- czy auto jest na asfalcie
function onRoad(x, z) {
  const i = Math.floor((x + HALF_X)/TS), j = Math.floor((z + HALF_Z)/TS), W = RW + .8;
  if (!inGrid(i, j)) return (Math.abs(x - tileX(RV)) < W && Math.abs(z) > HALF_Z) || (Math.abs(z - tileZ(RH)) < W && Math.abs(x) > HALF_X);
  const m = road[j*GW + i]; if (!m) return false; const lx = x - tileX(i), lz = z - tileZ(j); let n = 0, one = 0;
  for (let a = 0; a < 4; a++) if (m >> a & 1) { n++; one = a; for (let b = a + 1; b < 4; b++) if (m >> b & 1) {
    if (b - a === 2) { if (Math.abs(a ? lz : lx) < W) return true; }
    else if (Math.abs(Math.hypot(lx - (DX[a] + DX[b])*7, lz - (DZ[a] + DZ[b])*7) - 7) < W) return true; } }
  return n === 1 && lx*DX[one] + lz*DZ[one] > -W && Math.abs(lx*DZ[one] - lz*DX[one]) < W;
}
// ---------- przeszkody: budynki, pociąg, inne auta
const SOLID = Object.keys(PLACES).map(k => { const p = PLACES[k], x = tileX(p[0]), z = tileZ(p[1]), s = p[2], e = 5.2;
  return { x0:x - 7 - (s === 3 ? e : 0), x1:x + 7 + (s === 1 ? e : 0), z0:z - 7 - (s === 0 ? e : 0), z1:z + 7 + (s === 2 ? e : 0) }; });
function hitSolids(c) {
  let hit = false; const r = 1.1;
  for (let n = 0; n < SOLID.length; n++) { const q = SOLID[n]; if (c.x > q.x0 - r && c.x < q.x1 + r && c.z > q.z0 - r && c.z < q.z1 + r) {
    const a = c.x - q.x0 + r, b = q.x1 + r - c.x, e = c.z - q.z0 + r, f = q.z1 + r - c.z, m = Math.min(a, b, e, f);
    if (m === a) c.x = q.x0 - r; else if (m === b) c.x = q.x1 + r; else if (m === e) c.z = q.z0 - r; else c.z = q.z1 + r; hit = true; } }
  const push = (ox, oz, rad) => { const dx = c.x - ox, dz = c.z - oz, d = Math.hypot(dx, dz); if (d < rad && d > .001) { c.x = ox + dx/d*rad; c.z = oz + dz/d*rad; hit = true; return true; } return false; };
  for (let n = 0; n < cars.length; n++) { const k = cars[n], sx = Math.sin(k.h), cz = Math.cos(k.h), q = k.len*.27; push(k.x + sx*q, k.z + cz*q, 1.9 + AV.R*.6); push(k.x - sx*q, k.z - cz*q, 1.9 + AV.R*.6); }
  for (let n = 0; n < roadCars.length; n++) { const q = roadCars[n]; if (q.seg && push(q.x, q.z, (q.bus ? 2.6 : 1.7) + AV.R*.6)) q.v = 0; }
  const BX = HALF_X + 150, BZ = HALF_Z + 150; if (Math.abs(c.x) > BX) { c.x = Math.sign(c.x)*BX; hit = true; } if (Math.abs(c.z) > BZ) { c.z = Math.sign(c.z)*BZ; hit = true; }
  return hit;
}
function syncAuto() {
  const c = pc; c.g.position.set(c.x, 0, c.z); c.g.rotation.y = c.h;
  for (let k = 0; k < c.steerNodes.length; k++) c.steerNodes[k].n.rotation.y = c.steer*.5*c.steerNodes[k].s;
  if (c.sw) c.sw.rotation.y = c.steer*1.7;
}
function placeAuto() {                             // auto staje na drodze najbliżej pociągu
  let best = -1, bd = 1e9;
  for (let pass = 0; pass < 2 && best < 0; pass++) for (let idx = 0; idx < GW*GH; idx++) { const rt = roadType(idx); if (!rt || (!pass && rt === 3) || xings.has(idx)) continue;
    const d = Math.hypot(tileX(idx % GW) - lead.x, tileZ((idx / GW) | 0) - lead.z); if (d > 12 && d < bd) { bd = d; best = idx; } }
  pc.v = 0; pc.steer = 0;
  if (best < 0) { pc.x = lead.x + 9; pc.z = lead.z + 9; pc.h = 0; return; }
  let a = 0; while (!(road[best] >> a & 1)) a++;
  pc.h = Math.atan2(DX[a], DZ[a]); pc.x = tileX(best % GW) - DZ[a]*1.6; pc.z = tileZ((best / GW) | 0) + DX[a]*1.6;
}

// ---------- kursy: strzałka prowadzi do pasażera, potem do celu
const CSTOP = {};
[['station', 5, 2, 0, 1], ['town', 24, 2, 0, 1], ['mine', 14, 2, 0, 1], ['zoo', 22, 17, 0, -1], ['sawmill', 8, 17, 0, -1], ['pond', 13, 13, 0, 1], ['power', 28, 10, -1, 0]].forEach(q => {
  CSTOP[q[0]] = { key:q[0], x:tileX(q[1]), z:tileZ(q[2]), sx:q[3], sz:q[4] }; });
const JOBK = Object.keys(CSTOP), jobPeople = [];
{ const st = new T.Group(), blue = lam(0x2f6fd0), wh = lam(0xfafafa);                    // znaki przystanków przy drodze
  JOBK.forEach(k => { const s = CSTOP[k], x = s.x + s.sx*4.1 + Math.abs(s.sz)*3.2, z = s.z + s.sz*4.1 + Math.abs(s.sx)*3.2;
    cylY(.06, 2.6, M.steel, x, 1.3, z, st, 6); const d = cylZ(.42, .06, blue, x, 2.5, z, st, 16); d.rotation.y = s.sx ? Math.PI/2 : 0; const w = box(.5, .2, .08, wh, x, 2.5, z, st); w.rotation.y = s.sx ? Math.PI/2 : 0; });
  scene.add(bake(st));
  [0xd8452f, 0x2f7fd8, 0xf2b632, 0x3f9a4a, 0x8e4fc2].forEach(c => { const g = new T.Group(); cylY(.22, .68, lam(c), 0, .72, 0, g, 8); mesh(new T.SphereGeometry(.2, 10, 8), M.skin, 0, 1.27, 0, g);
    [-.1, .1].forEach(x => box(.14, .4, .16, M.pants, x, .2, 0, g)); const p = bake(g); p.scale.setScalar(1.25); p.visible = false; scene.add(p); jobPeople.push(p); });
}
const beacon = new T.Group(), guide = new T.Group();
{ const bm = new T.MeshBasicMaterial({ color:0xffd21f, transparent:true, opacity:.22, depthWrite:false, fog:false }), cm = new T.MeshBasicMaterial({ color:0xffd21f, fog:false });
  const col = mesh(new T.CylinderGeometry(3.6, 3.6, 16, 20, 1, true), bm, 0, 8, 0, beacon); col.renderOrder = 3;
  const tip = mesh(new T.ConeGeometry(1.6, 3, 4), cm, 0, 15, 0, beacon); tip.rotation.x = Math.PI; beacon.userData.tip = tip; beacon.visible = false; scene.add(beacon);
  const gm = new T.MeshBasicMaterial({ color:0x35e04a, fog:false }), c = mesh(new T.ConeGeometry(.75, 1.4, 4), gm, 0, 0, 1.3, guide); c.rotation.x = Math.PI/2; c.scale.x = 1.5;
  const s = box(.7, .3, 1.5, gm, 0, 0, 0, guide); guide.visible = false; scene.add(guide); }
let job = null, jobHold = 0, jobWait = .5, lastTo = '';
function showJob() {
  const s = CSTOP[job.phase ? job.to : job.from], i = INFO[s.key];
  $('load').textContent = job.phase ? '🧍×' + job.n + ' → ' + i.ico : '🧍×' + job.n + ' czeka: ' + i.ico;
  jobPeople.forEach((p, k) => { p.visible = !job.phase && k < job.n; if (p.visible) { const o = (k - (job.n - 1)/2)*1.15; p.position.set(s.x + s.sx*4.5 + Math.abs(s.sz)*o, 0, s.z + s.sz*4.5 + Math.abs(s.sx)*o); } });
  toast(job.phase ? 'Jedziemy do: ' + i.ico + ' ' + i.name : (job.n > 1 ? job.n + ' pasażerów czeka: ' : 'Pasażer czeka: ') + i.ico + ' ' + i.name);
}
function newJob() {
  if (!AV.jobs) { job = null; jobPeople.forEach(p => { p.visible = false; }); $('load').textContent = '⭐ zbieraj gwiazdki'; return; }
  const last = lastTo; let a, b; do a = JOBK[(Math.random()*JOBK.length) | 0]; while (a === last); do b = JOBK[(Math.random()*JOBK.length) | 0]; while (b === a);
  if (Math.random() < .5) { const st = Math.random() < .5 ? 'station' : 'town'; if (Math.random() < .65) { if (a !== st) b = st; } else if (b !== st && last !== st) a = st; }   // co drugi kurs: na dworzec albo z dworca
  job = { from:a, to:b, phase:0, n:AV.jobs > 2 ? 2 + ((Math.random()*(AV.jobs - 1)) | 0) : 1 + (Math.random() < .3 ? 1 : 0) }; showJob();
}
function jobStep(dt) {
  if (!AV.jobs) return; if (!job) { jobWait -= dt; if (jobWait <= 0) newJob(); return; }
  const c = pc, s = CSTOP[job.phase ? job.to : job.from];
  if (Math.hypot(c.x - s.x, c.z - s.z) < 9.5 && Math.abs(c.v) < 1.5) { jobHold += dt; if (jobHold < .45) return; jobHold = 0;
    if (!job.phase) { job.phase = 1; sfx.pop(4); showJob(); return; }
    addScore(job.n); sfx.star(); progress('taxi');
    for (let i = 0; i < 24; i++) { const k = i % 3; emit(c.x, 2.6, c.z, rr(-4, 4), rr(3, 8), rr(-4, 4), 1.1, k === 0 ? 1 : .3, k === 1 ? .85 : .5, k === 2 ? 1 : .2, 11); }
    if (waiting[job.to]) { const o = PSTOPS.filter(k => k !== job.to); for (let i = 0; i < job.n && waiting[job.to].length < 5; i++) waiting[job.to].push(o[(Math.random()*o.length) | 0]); refreshLabels();   // dowiezieni na dworzec czekają na pociąg
      toast('Dowiezieni! Teraz czekają na pociąg 🚂 +' + job.n + ' ⭐'); } else toast('Dowiezieni! +' + job.n + ' ⭐');
    lastTo = job.to; job = null; jobWait = 1.6; $('load').textContent = '🧍 …'; jobPeople.forEach(p => { p.visible = false; });
  } else jobHold = 0;
}
// ---------- gwiazdki na drogach
function spawnRStar() {
  const s = tstars.find(q => !q.on); if (!s) return; const cand = [];
  for (let idx = 0; idx < GW*GH; idx++) if (road[idx] && Math.hypot(tileX(idx % GW) - pc.x, tileZ((idx / GW) | 0) - pc.z) < 190) cand.push(idx); if (!cand.length) return;
  for (let tries = 0; tries < 20; tries++) { const idx = cand[(Math.random()*cand.length) | 0], i = idx % GW, j = (idx / GW) | 0, bits = []; for (let k = 0; k < 4; k++) if (road[idx] >> k & 1) bits.push(k);
    if (tstars.some(q => q.on && q.idx === idx)) continue; let a = bits[0], b = bits[0], x, z;
    if (bits.length < 2) { x = tileX(i) + DX[a]*3; z = tileZ(j) + DZ[a]*3; }
    else { a = bits[(Math.random()*bits.length) | 0]; do b = bits[(Math.random()*bits.length) | 0]; while (b === a); const sg = mkSeg(i, j, a, b); segPoint(sg, sg.len/2, sR); x = sR.x; z = sR.z; }
    if (Math.hypot(x - pc.x, z - pc.z) < 22) continue;
    Object.assign(s, { on:true, rd:true, idx, a, b, x, z }); s.m.position.set(x, 2.2, z); s.m.scale.setScalar(.05); s.m.visible = true; return; }
}
function clearExtras() { tstars.forEach(s => { s.on = false; s.m.visible = false; }); if (tcow.on) cowOff(); redSig = null; }
function carExtras(dt) {
  const c = pc; comboT -= dt; if (comboT <= 0) combo = 0;
  tstarT += dt; if (tstarT > 1.2) { tstarT = 0; if (tstars.filter(q => q.on).length < 8) spawnRStar(); }
  let ns = null, nd = 1e9;
  for (let n = 0; n < tstars.length; n++) { const s = tstars[n]; if (!s.on) continue;
    s.m.rotation.y = time*2.4 + n; s.m.position.y = 2.2 + Math.sin(time*3 + n)*.25; if (s.m.scale.x < 1) s.m.scale.setScalar(Math.min(1, s.m.scale.x + dt*3));
    const d = Math.hypot(c.x - s.x, c.z - s.z);
    if (d < AV.R + 2) { s.on = false; s.m.visible = false; combo++; comboT = 4; tone(620 + Math.min(combo, 8)*95, .18, 'triangle', .28, 1240 + Math.min(combo, 8)*120);
      for (let i = 0; i < 12; i++) emit(s.x, 2.2, s.z, rr(-4, 4), rr(2, 7), rr(-4, 4), .8, 1, .85, .2, 10); addScore(1); progress('star'); }
    else if (d < nd) { nd = d; ns = s; } }
  jobStep(dt);
  const tg = job ? CSTOP[job.phase ? job.to : job.from] : ns;
  beacon.visible = !!job; if (job) { beacon.position.set(tg.x, 0, tg.z); beacon.userData.tip.position.y = 15 + Math.sin(time*3)*1.2; beacon.userData.tip.rotation.y = time*2; }
  const far = tg && Math.hypot(tg.x - c.x, tg.z - c.z) > 13; guide.visible = !!far && S.mode === 'drive';
  if (guide.visible) { const gx = c.x + Math.sin(c.h)*(AV.R + 5), gz = c.z + Math.cos(c.h)*(AV.R + 5); guide.position.set(gx, (c.eye.y*(c === ursus ? 1.35 : 1)) + 1.5 + Math.sin(time*5)*.12, gz); guide.rotation.y = Math.atan2(tg.x - gx, tg.z - gz); }
}
// ---------- jazda: gaz, hamulec i kierownica
function driveCar(dt) {
  const A = AV, c = pc, st = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
  offK += ((onRoad(c.x, c.z) ? 0 : 1) - offK)*Math.min(1, dt*3);
  const vmax = A.vmax*(1 - offK*(1 - A.off)), tg = job ? CSTOP[job.phase ? job.to : job.from] : null, nearT = tg && Math.hypot(tg.x - c.x, tg.z - c.z) < 13;
  if (keys.back) { if (c.v > .3) c.v = Math.max(0, c.v - 22*dt); else c.v = Math.max(-6, c.v - 5*dt); }
  else if (keys.fwd) { if (c.v < -.3) c.v = Math.min(0, c.v + 22*dt); else c.v += A.acc*(1 - .6*Math.max(0, c.v)/A.vmax)*dt; }
  else { const d = (nearT ? 16 : 3 + Math.abs(c.v)*.35)*dt; c.v -= Math.sign(c.v)*Math.min(Math.abs(c.v), d); }          // przy przystanku auto samo mocniej hamuje
  if (c.v > vmax) c.v = Math.max(vmax, c.v - 12*dt);
  c.steer += (st - c.steer)*Math.min(1, dt*(st ? 5 : 9));
  c.h = wrap(c.h + c.steer*A.turn*c.v*.2/(1 + Math.abs(c.v)*.05)*dt);
  c.x += Math.sin(c.h)*c.v*dt; c.z += Math.cos(c.h)*c.v*dt;
  if (hitSolids(c)) { if (Math.abs(c.v) > 4 && time - bumpT > .5) { bumpT = time; sfx.thud(); } c.v *= 1 - Math.min(1, dt*8); }
  for (let k = 0; k < c.wheels.length; k++) c.wheels[k].n.rotation.x += c.v*dt/c.wheels[k].r;
  c.tilt += (c.steer*c.v*.002 - c.tilt)*Math.min(1, dt*6); c.inner.rotation.z = c.tilt; c.inner.position.y = offK*Math.min(1, Math.abs(c.v)/6)*.05*Math.sin(time*33);
  if (offK > .5 && Math.abs(c.v) > 4 && Math.random() < .5) emit(c.x - Math.sin(c.h)*A.R*.8 + rr(-.7, .7), .3, c.z - Math.cos(c.h)*A.R*.8 + rr(-.7, .7), rr(-1, 1), rr(1, 3), rr(-1, 1), .5, .45, .62, .25, 6);
  if (c.P && c.P.fan) c.P.fan.rotation.z += dt*(18 + Math.abs(c.v)*3);
  syncAuto();
}
function carHorn() { tone(AV.hornF[0], .5, 'square', .13); tone(AV.hornF[1], .5, 'square', .11); if (AK === 'race') { tone(AV.hornF[0], .2, 'square', .1, 0, .55); tone(AV.hornF[1], .2, 'square', .1, 0, .55); } }
const CAR_HELP = 'Trzymaj ▲ gaz, skręcaj ◀ ▶. Zielona strzałka prowadzi do celu.';
function exitCar() {
  S.veh = 'train'; pc.g.visible = false; pc.v = 0; document.body.classList.remove('car'); clearExtras(); job = null; jobPeople.forEach(p => { p.visible = false; }); beacon.visible = guide.visible = false; $('spdIco').textContent = '🚂';
}
function selectAuto(key) {
  $('pick').hidden = true; const was = S.veh === 'car'; if (was && key === AK) return;
  const ox = pc.x, oz = pc.z, oh = pc.h; pc.g.visible = false; AK = key; AV = AUTOS[key]; pc = AV.car; pc.v = 0; pc.steer = 0; offK = 0;
  if (was) { pc.x = ox; pc.z = oz; pc.h = oh; } else { S.veh = 'car'; v = 0; clearExtras(); placeAuto(); document.body.classList.add('car'); }
  pc.g.visible = true; syncAuto(); camSnap = true; lookA.yaw = lookA.pitch = 0; job = null; newJob(); newMission(); $('spdIco').textContent = AV.ico; hud(); save(); carHorn();
  if (!AV.jobs) toast(AV.name + ': zbieraj gwiazdki ⭐ na drogach');
}

/* =====================================================================
   UKŁADANIE TORÓW
   ===================================================================== */
const gridLines = (() => { const P = [];
  for (let i = 0; i <= GW; i++) P.push(-HALF_X + i*TS, .09, -HALF_Z, -HALF_X + i*TS, .09, HALF_Z);
  for (let j = 0; j <= GH; j++) P.push(-HALF_X, .09, -HALF_Z + j*TS, HALF_X, .09, -HALF_Z + j*TS);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  const l = new T.LineSegments(g, new T.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:.5, fog:false })); l.visible = false; scene.add(l); return l; })();
const cursor = mesh(new T.RingGeometry(TS*.36, TS*.47, 4, 1, Math.PI/4), new T.MeshBasicMaterial({ color:0xffd21f, transparent:true, opacity:.9, fog:false, depthTest:false }), 0, .2, 0, scene);
cursor.rotation.x = -Math.PI/2; cursor.visible = false; cursor.renderOrder = 5;
const ray = new T.Raycaster(), ndc = new T.Vector2(), groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0), hitV = new T.Vector3();
function tileAt(e) {
  ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(groundPlane, hitV)) return null;
  const i = Math.floor((hitV.x + HALF_X)/TS), j = Math.floor((hitV.z + HALF_Z)/TS); return inGrid(i, j) ? { i, j } : null;
}
let laid = 0, noT = -9;
function refuse(msg) { if (time - noT < 1.2) return; noT = time; sfx.no(); toast(msg); }
function eraseTile(i, j) { eraseTrackTile(i, j); }
function eraseTrackTile(i, j) {
  const idx = j*GW + i; if (!grid[idx]) return;
  if (occupied(idx)) { refuse('Tu stoi pociąg. Najpierw nim odjedź.'); return; }
  for (let k = 0; k < 4; k++) if (grid[idx] >> k & 1) { const n = (j + DZ[k])*GW + i + DX[k]; grid[n] &= ~(1 << ((k + 2) % 4)); rebuildTile(n); }
  grid[idx] = 0; rebuildTile(idx); checkExtras(); sfx.wipe(); save();
}
function layTrack(i1, j1, i2, j2) {
  const r = connectTiles(i1, j1, i2, j2);
  if (r > 0) { rebuildTile(j1*GW + i1); rebuildTile(j2*GW + i2); sfx.pop(laid++ % 12); save(); }
  else if (r === -2) refuse('Przez drogę tor biegnie tylko prosto, w poprzek.');
  else if (r < 0 && inGrid(i2, j2) && blocked[j2*GW + i2]) refuse('Tu nie da się położyć toru. Omiń bokiem.');
}
function cutTrack(i1, j1, i2, j2) {                 // zabierz jedno połączenie między kratkami
  if (!inGrid(i1, j1) || !inGrid(i2, j2)) return; const a = j1*GW + i1, b = j2*GW + i2;
  let k = -1; for (let s = 0; s < 4; s++) if (i1 + DX[s] === i2 && j1 + DZ[s] === j2) k = s; if (k < 0 || !(grid[a] >> k & 1)) return;
  if (occupied(a) || occupied(b)) { refuse('Tu stoi pociąg. Najpierw nim odjedź.'); return; }
  grid[a] &= ~(1 << k); grid[b] &= ~(1 << ((k + 2) % 4)); rebuildTile(a); rebuildTile(b); checkExtras(); sfx.wipe(); save();
}
const hasTrack = (i1, j1, i2, j2) => { if (!inGrid(i1, j1) || !inGrid(i2, j2)) return false; for (let s = 0; s < 4; s++) if (i1 + DX[s] === i2 && j1 + DZ[s] === j2) return !!(grid[j1*GW + i1] >> s & 1); return false; };
const draw = { id:null, i:-1, j:-1, cut:null };
function setCursor(i, j) { cursor.visible = i >= 0; if (i >= 0) cursor.position.set(tileX(i), .2, tileZ(j)); }
function buildDown(e) {
  draw.id = e.pointerId; draw.cut = null; const t = tileAt(e); if (!t) { draw.i = -1; return; }
  draw.i = t.i; draw.j = t.j; setCursor(t.i, t.j); if (S.tool === 'erase') eraseTile(t.i, t.j);
}
function buildMove(e) {
  if (e.pointerId !== draw.id) return; const t = tileAt(e); if (!t) return;
  if (draw.i < 0) { draw.i = t.i; draw.j = t.j; setCursor(t.i, t.j); if (S.tool === 'erase') eraseTile(t.i, t.j); return; }
  let guard = 0;
  while ((draw.i !== t.i || draw.j !== t.j) && guard++ < 24) { const di = t.i - draw.i, dj = t.j - draw.j, hor = Math.abs(di) >= Math.abs(dj), ni = draw.i + (hor ? Math.sign(di) : 0), nj = draw.j + (hor ? 0 : Math.sign(dj));
    if (S.tool === 'erase') eraseTile(ni, nj);
    else { if (draw.cut === null) draw.cut = hasTrack(draw.i, draw.j, ni, nj);        // pierwszy ruch decyduje: po torze = zabieranie, po trawie = układanie
      if (draw.cut) cutTrack(draw.i, draw.j, ni, nj); else layTrack(draw.i, draw.j, ni, nj); }
    draw.i = ni; draw.j = nj; }
  setCursor(draw.i, draw.j);
}
function buildUp(e) { if (e.pointerId === draw.id) { draw.id = null; draw.i = -1; cursor.visible = false; } }

/* =====================================================================
   KAMERA
   ===================================================================== */
const camPos = new T.Vector3(0, 40, 60), camLook = new T.Vector3(), wantPos = new T.Vector3(), wantLook = new T.Vector3();
let camH = Math.PI, camSnap = true, menuT = 0;
const lookA = { yaw:0, pitch:0, id:null, x:0, y:0, idle:0 }, tapS = { id:null, x:0, y:0, t:0 };
const bcam = { x:0, z:0, tx:0, tz:0, h:0, far:false, upp:.3, portrait:false }, bptr = new Map();   // kamera nad planszą: przesuwana i z dwoma przybliżeniami
function panBy(sx, sy) { if (bcam.portrait) { bcam.tz += sx; bcam.tx -= sy; } else { bcam.tx += sx; bcam.tz += sy; } }   // w prawo i w dół ekranu, w metrach          // rozglądanie się palcem
{ const cv = $('c');
  cv.addEventListener('pointerdown', e => { if (!S.running) return;
    if (S.mode === 'build') { try { cv.setPointerCapture(e.pointerId); } catch (_) {} bptr.set(e.pointerId, { x:e.clientX, y:e.clientY });
      if (bptr.size > 1 || S.tool === 'pan') { draw.id = null; draw.i = -1; cursor.visible = false; } else buildDown(e); return; }
    tapS.id = e.pointerId; tapS.x = e.clientX; tapS.y = e.clientY; tapS.t = performance.now(); $('pick').hidden = true;
    if (S.cam === 0 || lookA.id !== null) return; lookA.id = e.pointerId; lookA.x = e.clientX; lookA.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener('pointermove', e => { if (S.mode === 'build') { const q = bptr.get(e.pointerId);
      if (q && (bptr.size > 1 || S.tool === 'pan')) { const f = bptr.size > 1 ? 2 : 1; panBy(-(e.clientX - q.x)*bcam.upp/f, -(e.clientY - q.y)*bcam.upp/f); q.x = e.clientX; q.y = e.clientY; }   // dwa palce albo ✋ jeden palec przesuwa planszę
      else if (S.running) buildMove(e); return; } if (e.pointerId !== lookA.id) return;
    lookA.yaw = clamp(lookA.yaw + (e.clientX - lookA.x)*.007, -2.7, 2.7); lookA.pitch = clamp(lookA.pitch + (e.clientY - lookA.y)*.005, -.5, .6);
    lookA.x = e.clientX; lookA.y = e.clientY; lookA.idle = 0; });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => cv.addEventListener(ev, e => { bptr.delete(e.pointerId); buildUp(e); if (e.pointerId === lookA.id) lookA.id = null;
    if (ev === 'pointerup' && e.pointerId === tapS.id && S.running && S.mode === 'drive' && S.veh === 'train' && Math.hypot(e.clientX - tapS.x, e.clientY - tapS.y) < 14 && performance.now() - tapS.t < 500) tapSwitch(e);
    if (e.pointerId === tapS.id) tapS.id = null; })); }
const lookDir = new T.Vector3();
function updateCamera(dt) {
  const w = innerWidth, h = innerHeight, portrait = h > w;
  let fov = 55; camera.up.set(0, 1, 0);
  const A = S.veh === 'car' ? pc : lead;
  if (S.menu === 'start') {                        // ekran startowy: powolny oblot planszy
    menuT += dt*.1; wantPos.set(A.x + Math.sin(menuT)*30, 13, A.z + 8 + Math.cos(menuT)*30); wantLook.set(A.x, 2.5, A.z);
    camPos.copy(wantPos); camLook.copy(wantLook); fov = portrait ? 70 : 52;
  } else if (S.mode === 'build') {                 // cała plansza z lotu ptaka; w pionie obrócona, żeby kratki były duże
    fov = 50; const tn = Math.tan(fov/2*Math.PI/180), padR = portrait ? 0 : 136, padT = portrait ? 62 : 0, padB = portrait ? 100 : 0, uw = w - padR, uh = h - padT - padB;
    const vx = bcam.far ? HALF_X : 6.6*TS, vz = bcam.far ? HALF_Z : 4.6*TS;                // połowa widocznego kawałka planszy
    const nv = (portrait ? vx : vz) + 3, nw = (portrait ? vz : vx) + 3, H = Math.max(nv/tn*h/uh, nw/(tn*w/h)*w/uw), upp = bcam.upp = 2*H*tn/h;
    bcam.tx = clamp(bcam.tx, -(HALF_X - vx), HALF_X - vx); bcam.tz = clamp(bcam.tz, -(HALF_Z - vz), HALF_Z - vz); bcam.portrait = portrait;
    const kk = Math.min(1, dt*9); bcam.x += (bcam.tx - bcam.x)*kk; bcam.z += (bcam.tz - bcam.z)*kk; bcam.h += (H - bcam.h)*(bcam.h ? kk : 1);
    const ox = padR/2*upp, oy = (padT - padB)/2*upp;                    // środek widoku trafia w środek wolnego miejsca
    if (portrait) { camera.up.set(1, 0, 0); camPos.set(bcam.x + oy, bcam.h, bcam.z + ox); } else { camera.up.set(0, 0, -1); camPos.set(bcam.x + ox, bcam.h, bcam.z - oy); }
    camLook.set(camPos.x, 0, camPos.z);
  } else {
    if (lookA.id === null) { lookA.idle += dt; if (lookA.idle > .7) { const k = Math.exp(-dt*3); lookA.yaw *= k; lookA.pitch *= k; } }
    if (S.cam === 0 && A.car) { camH += wrap(A.h - camH)*Math.min(1, dt*3); const H = portrait ? 36 : 27; wantPos.set(A.x - Math.sin(camH)*H*.8, H, A.z - Math.cos(camH)*H*.8); wantLook.set(A.x + Math.sin(camH)*7, 0, A.z + Math.cos(camH)*7); fov = 52; }
    else if (S.cam === 0) { const H = portrait ? 62 : 44; wantPos.set(A.x, H, A.z + H*.55); wantLook.set(A.x, 0, A.z - 2); fov = 52; }
    else if (S.cam === 1) { camH += wrap(A.h - camH)*Math.min(1, dt*(A.followK || 2.6)); const k = portrait ? 1.3 : 1;
      const ca = camH + lookA.yaw + A.chaseYaw, hk = clamp(1 - lookA.pitch*1.2, .35, 1.7);
      wantPos.set(A.x - Math.sin(ca)*A.chase[0]*k, A.chase[1]*k*hk, A.z - Math.cos(ca)*A.chase[0]*k);
      wantLook.set(A.x + Math.sin(A.h)*2, A.lookY, A.z + Math.cos(A.h)*2); fov = portrait ? 66 : 55; }
    else { A.inner.localToWorld(wantPos.copy(A.eye));
      lookDir.copy(A.look).sub(A.eye); const yw = Math.atan2(lookDir.x, lookDir.z) + lookA.yaw + A.steer*(A.povK || .9), pt = Math.atan2(lookDir.y, lookDir.z) + lookA.pitch, cp = Math.cos(pt);
      tmpV.set(A.eye.x + Math.sin(yw)*cp*6, A.eye.y + Math.sin(pt)*6, A.eye.z + Math.cos(yw)*cp*6); A.inner.localToWorld(wantLook.copy(tmpV)); fov = portrait ? 88 : 70; camSnap = true; }
    if (camSnap) { camPos.copy(wantPos); camLook.copy(wantLook); camH = A.h; camSnap = false; }
    else { const k = 1 - Math.exp(-dt*6); camPos.lerp(wantPos, k); camLook.lerp(wantLook, k); }
  }
  A.driver.visible = A === steam || !(S.cam === 2 && S.mode === 'drive' && S.menu !== 'start');
  sun.target.position.set(A.x, 0, A.z); sun.position.copy(sun.target.position).add(SUN_DIR);
  if (headLamp.intensity > 0) { A.inner.localToWorld(headLamp.position.copy(A.lamp)); A.inner.localToWorld(headLamp.target.position.set(0, .5, A.lamp.z + 18)); }
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.copy(camPos); camera.lookAt(camLook);
}

addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 250)); resize();

/* =====================================================================
   HUD, MENU, TRYBY
   ===================================================================== */
const CAM_NAMES = ['z góry', 'z tyłu', 'kabina'];
function hud() {
  const car = S.veh === 'car'; $('camLbl').textContent = car ? (S.cam === 2 ? 'kierownica' : CAM_NAMES[S.cam]) : S.cam === 2 && TR.kind === 'steam' ? 'przy kominie' : CAM_NAMES[S.cam]; $('swapIco').textContent = car ? AV.ico : TR.ico;
  const tl = TOOLS[S.tool] || TOOLS.draw; $('toolIco').textContent = tl[0]; $('toolLbl').textContent = tl[1]; $('tTool').dataset.tool = S.tool;
  document.querySelectorAll('#pick [data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === (S.veh === 'car' ? AK : TRkey)));
  document.body.classList.toggle('build', S.mode === 'build');
}
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3600); }
let hornV = null;                                   // klakson i gwizdek z biblioteki lib/audio/horns.js: gra, dopóki trzymasz
function hornUp() { hornStop(hornV, S.veh !== 'car' && TR.kind === 'steam' ? .5 : .3); hornV = null; }
function horn() { hornDown(); setTimeout(hornUp, 350); }
function hornDown() {
  hornStop(hornV); if (S.veh === 'car') { hornV = hornStart(AK); return; }
  if (shooCow()) { addScore(1); progress('cow'); toast('Muuu! Krowa zeszła z torów 🐄'); }
  if (xPrompt && S.mode === 'drive') { xPrompt.want = true; xPrompt = null; addScore(1); progress('xing'); }
  hornV = trainHornStart(TR.kind); if (TR.kind !== 'steam') return;
  steam.g.updateMatrixWorld(); steam.inner.localToWorld(tmpV.set(.3, 4.45, -.85)); for (let i = 0; i < 3; i++) puff(tmpV.x, tmpV.y, tmpV.z, rr(-.5, .5), 4 + i, rr(-.5, .5), 1.1, .7, 1);
}

let dayWX = null;
function setMode(m) {
  if (S.mode === m && m === 'drive') { hud(); return; }
  S.mode = m; v = 0; pc.v = 0; keys.fwd = keys.back = keys.left = keys.right = 0; $('pFwd').classList.remove('on'); $('pBack').classList.remove('on'); $('pick').hidden = true; camSnap = true; lookA.yaw = lookA.pitch = 0;
  gridLines.visible = m === 'build'; cursor.visible = false; draw.id = null;
  clouds.forEach(c => { c.visible = m !== 'build'; }); birds.forEach(b => { b.g.visible = m !== 'build'; });
  if (m === 'build') { bptr.clear(); bcam.far = false; { const q = S.veh === 'car' ? pc : lead; bcam.x = bcam.tx = q.x; bcam.z = bcam.tz = q.z; } bcam.h = 0; $('zoomLbl').textContent = 'cała mapa'; trimPath(); if (WX !== WEATHERS[0]) applyWeather(WEATHERS[0]); scene.fog.near = 700; scene.fog.far = 1700;   // nad planszą zawsze jasno i bez mgły
    S.kind = 'track'; S.tool = 'draw'; toast('Rysuj tor palcem po trawie. Przycisk ✏️ zmienia na 🧽 gumkę i ✋ przesuwanie planszy.'); }
  else { refreshEnds(); applyWeather(dayWX); tone(70, .5, 'sawtooth', .16, 150); }
  hud();
}
function selectTrain(key) {
  if (AUTOS[key]) { selectAuto(key); return; }
  $('pick').hidden = true; const fromCar = S.veh === 'car'; if (fromCar) exitCar();
  if (key === TRkey) { if (fromCar) { camSnap = true; refreshLabels(); newMission(); hud(); save(); horn(); } return; }
  const old = TRkey, bak = { path:path.slice(), pos, total }; v = 0; setConsist(key);
  if (!fitTrain() && !placeTrain()) { setConsist(old); path = bak.path; pos = bak.pos; total = bak.total; sfx.no(); toast('Za mało torów na ten pociąg. Dołóż tory 🛤️'); placeCars(); return; }
  placeCars(); camSnap = true; refreshLabels(); hud(); save(); horn(); if (!mission || (mission.kind === 'pax' && !TR.pass) || (mission.kind === 'cargo' && TR.pass) || mission.kind === 'taxi') newMission();
  toast(TR.pass ? TR.name + ': stań przy peronie 🧍, pasażerowie wsiądą sami' : TR.name + ': zabierz kłody z tartaku 🌲 do kopalni ⛏️, a węgiel do elektrowni ⚡');
}
const press = (el, fn) => { el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); el.addEventListener('click', e => { if (e.detail === 0) fn(); }); };   // działa też, gdy drugi palec trzyma gaz
const VEH = Object.assign({}, TRAINS);                // w Ciuchci tylko pociągi; auta do prowadzenia są w Taxi Ciuchciowo
$('pick').innerHTML = Object.keys(VEH).map(k => '<button class="btn" data-t="' + k + '"><span class="em">' + VEH[k].ico + '</span><small>' + VEH[k].name + '<br>' + VEH[k].sub + '</small></button>').join('');
document.querySelectorAll('#pick [data-t]').forEach(b => press(b, () => selectTrain(b.dataset.t)));

{ const b = $('bHorn'); b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} hornDown(); }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { if (hornV) hornUp(); })); } press($('bCam'), nextCam); press($('bBuild'), () => setMode('build')); press($('bDrive'), () => setMode('drive')); tap('bMenu', () => showMenu('pause'));
press($('bSwap'), () => { $('pick').hidden = !$('pick').hidden; }); press($('pSw'), switchNext);
const TOOLS = { draw:['✏️', 'rysuj', 'Rysuj tor palcem po trawie'], erase:['🧽', 'kasuj', 'Gumka: przeciągnij po torze, żeby go zabrać'], pan:['✋', 'przesuń', 'Przesuwaj planszę palcem'] };
press($('tTool'), () => { S.tool = S.tool === 'draw' ? 'erase' : S.tool === 'erase' ? 'pan' : 'draw'; S.kind = 'track'; draw.id = null; draw.i = -1; cursor.visible = false; hud(); toast(TOOLS[S.tool][2]); }); press($('bZoom'), () => { bcam.far = !bcam.far; $('zoomLbl').textContent = bcam.far ? 'bliżej' : 'cała mapa'; });


tap('bSnd', () => { S.muted = !S.muted; if (AU.ctx) AU.master.gain.value = S.muted ? 0 : .7; syncSnd(); save(); });

let newArmed = 0;
function showMenu(kind) {
  S.menu = kind; S.running = false; keys.fwd = keys.back = 0; v = 0; $('pick').hidden = true;
  if (AU.ctx) { const t = AU.ctx.currentTime; [AU.roll, AU.hiss, AU.rainG, AU.mot].forEach(g => g.gain.setTargetAtTime(0, t, .05)); }
  $('mTitle').textContent = kind === 'pause' ? 'Przerwa' : 'Ciuchcia!';
  $('mSub').textContent = kind === 'pause' ? 'Pojazd czeka' : 'Pociągi, tory i drogi';
  $('bGo').textContent = kind === 'pause' ? 'Gramy dalej' : 'Jedziemy!';
  $('bLay').hidden = kind === 'pause' && S.mode === 'build';
  $('bNew').hidden = kind === 'start'; $('bNew').textContent = 'Mapa od nowa'; newArmed = 0;
  $('menu').hidden = false; $('hud').hidden = true; syncSnd();
}
function startGame(mode) {
  initAudio();
  const first = S.menu === 'start';
  $('menu').hidden = true; $('hud').hidden = false; S.menu = 'play'; S.running = true; camSnap = true;
  if (mode) { if (mode === 'drive' && S.mode === 'drive') { hud(); tone(70, .5, 'sawtooth', .16, 150); } else setMode(mode); } else hud();
  if (first && S.mode === 'drive') { horn(); setTimeout(() => toast(S.veh === 'car' ? CAR_HELP : TR.pass ? 'Trzymaj „do przodu”. Gdy puścisz, pociąg sam zahamuje. Stań przy peronie 🧍' : 'Trzymaj „do przodu”. Gdy puścisz, pociąg sam zahamuje. Zabierz kłody z tartaku 🌲'), 500); }
}
tap('bGo', () => startGame(S.menu === 'start' ? 'drive' : null)); tap('bLay', () => startGame('build'));
tap('bNew', () => {
  if (performance.now() - newArmed > 3500) { newArmed = performance.now(); $('bNew').textContent = 'Na pewno? Stuknij jeszcze raz'; return; }
  road.fill(0); defaultGrid(); defaultRoads(); sw.fill(-1); rebuildAll(); checkExtras(); resetTraffic(); placeTrain(); placeCars(); if (S.veh === 'car') { placeAuto(); syncAuto(); } save(); startGame(S.mode); sfx.win(); toast('Mapa ułożona od nowa');
});
document.addEventListener('visibilitychange', () => { if (!AU.ctx) return; if (document.hidden) AU.ctx.suspend(); else if (S.running) AU.ctx.resume(); });

/* =====================================================================
   START
   ===================================================================== */
setConsist(TRAINS[savedTrain] ? savedTrain : 'steamP');
if (savedGrid) loadGrid(savedGrid); else defaultGrid();
if (!placeTrain()) { defaultGrid(); if (!placeTrain()) { setConsist('steamP'); placeTrain(); } }
if (savedRoads) loadRoads(savedRoads); else defaultRoads();
rebuildAll(); resetTraffic(); placeCars(); refreshLabels(); $('stars').textContent = score; newMission();
{ let r = Math.random(), k = 0; while (k < WEATHERS.length - 1 && r > WEATHERS[k].p) { r -= WEATHERS[k].p; k++; } dayWX = WEATHERS[k]; applyWeather(dayWX); }
syncSnd(); hud();
let last = performance.now(), lastRaw = last, qAcc = 0, qN = 0, qLevel = 0;   // gdy telefon nie nadąża: mniej pikseli, potem bez cieni
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last)/1000); last = now;
  updateBirds(now/1000);
  if (S.running && now - lastRaw < 400) { qAcc += now - lastRaw; if (++qN >= 90) { const avg = qAcc/qN; qAcc = 0; qN = 0;
    if (avg > 38 && qLevel < 2) { qLevel++; if (qLevel === 1) { renderer.setPixelRatio(1); resize(); } else sun.castShadow = false; } } }
  lastRaw = now;
  updateRain(dt);
  turbines.forEach(t => { t.rotation.z += dt*.9; });
  spinners.forEach(s => { s.m.rotation[s.ax] += dt*s.sp; }); for (let k = 0; k < anims.length; k++) anims[k](now/1000);
  clouds.forEach(c => { c.position.x += dt*1.6; if (c.position.x > 400) c.position.x = -400; });
  if (S.running) update(dt);
  flushChunks(); updateParticles(dt); updatePuffs(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
