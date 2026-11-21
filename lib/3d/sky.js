// Niebo i pogoda dla gier „z miastem” (Ciuchcia, Taxi, Żniwa): kopuła z gradientem, słońce, księżyc, gwiazdy,
// deszcz, reflektor po zmroku, scena otoczenia (envScene) do odbić. Stan pogody należy do tego pliku (WX, rain, sunBall…),
// gra go czyta i ustawia przez applyWeather (lib/3d/weather.js) albo własną funkcję pogody.
// skyInit(scene, pogoda) raz przy budowie świata (zużywa rnd() — w tym samym miejscu co wcześniej, ten sam świat z ziarna);
// setSky(góra, horyzont) · updateRain(dt, camera) · updateBirds(t, birds) co klatkę.
// wymaga: THREE (T: lib/3d/three.js), rnd/rr (lib/common/random.js), clamp (lib/common/math.js)
'use strict';
let WX = null, skyGeo, skyMat, sunGeo, sunBall, moon, stars, rain, headLamp, pmrem = null, envRT = null, envScene, envGround, envSun;
const uWind = { value:1 };
const RAIN_N = 700, rainOff = new Float32Array(RAIN_N*3);
function skyInit(scene, weather) {
  WX = weather;
  skyGeo = new T.SphereGeometry(700, 24, 14); skyMat = new T.MeshBasicMaterial({ vertexColors:true, side:T.BackSide, fog:false, depthWrite:false });
  skyGeo.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(skyGeo.attributes.position.count*3), 3));
  scene.add(new T.Mesh(skyGeo, skyMat));

  sunGeo = new T.SphereGeometry(22, 16, 12);
  sunBall = new T.Mesh(sunGeo, new T.MeshBasicMaterial({ color:0xfff6c4, fog:false })); scene.add(sunBall);
  moon = new T.Mesh(new T.SphereGeometry(15, 16, 12), new T.MeshBasicMaterial({ color:0xf4f1dc, fog:false })); moon.position.set(-190, 380, -420); scene.add(moon);
  stars = (() => { const n = 380, a = new Float32Array(n*3); for (let i = 0; i < n; i++) { const th = rnd()*6.283, ph = Math.acos(rr(.06, 1)); a[i*3] = Math.sin(ph)*Math.cos(th)*660; a[i*3+1] = Math.cos(ph)*660; a[i*3+2] = Math.sin(ph)*Math.sin(th)*660; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(a, 3)); const s = new T.Points(g, new T.PointsMaterial({ color:0xffffff, size:2.2, sizeAttenuation:false, fog:false })); scene.add(s); return s; })();
  rain = (() => { for (let i = 0; i < RAIN_N; i++) { rainOff[i*3] = rr(-24, 24); rainOff[i*3+1] = rr(0, 26); rainOff[i*3+2] = rr(-24, 24); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(RAIN_N*6), 3));
    const l = new T.LineSegments(g, new T.LineBasicMaterial({ color:0xdbe8f0, transparent:true, opacity:.55 })); l.frustumCulled = false; l.visible = false; scene.add(l); return l; })();

  headLamp = new T.SpotLight(0xfff0cc, 0, 60, .6, .65, 1.1); scene.add(headLamp); scene.add(headLamp.target);     // reflektory po zmroku, w deszczu i we mgle
  envScene = new T.Scene();
  envGround = new T.Mesh(new T.CircleGeometry(690, 20), new T.MeshBasicMaterial({ color:0x7a9a50 })); envGround.rotation.x = -Math.PI/2; envGround.position.y = -3;
  envSun = new T.Mesh(sunGeo, new T.MeshBasicMaterial({ color:0xffffff })); envSun.scale.setScalar(2.2);
  envScene.add(new T.Mesh(skyGeo, skyMat)); envScene.add(envGround); envScene.add(envSun);
}
function setSky(topHex, horHex) { const p = skyGeo.attributes.position, c = skyGeo.attributes.color, top = new T.Color(topHex), hor = new T.Color(horHex), k = new T.Color();
  for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i)/700, 0, 1); k.copy(hor).lerp(top, Math.pow(t, .55)); c.setXYZ(i, k.r, k.g, k.b); } c.needsUpdate = true; }
function updateRain(dt, camera) { if (!rain.visible) return; const p = rain.geometry.attributes.position.array, cx = camera.position.x, cz = camera.position.z;
  for (let i = 0; i < RAIN_N; i++) { let y = rainOff[i*3+1] - 32*dt; if (y < 0) y += 26; rainOff[i*3+1] = y; const x = cx + rainOff[i*3], z = cz + rainOff[i*3+2], o = i*6;
    p[o] = x; p[o+1] = y; p[o+2] = z; p[o+3] = x + .3; p[o+4] = y + 1.2; p[o+5] = z; }
  rain.geometry.attributes.position.needsUpdate = true; }
function updateBirds(t, birds) { birds.forEach(b => { const a = b.ph + t*b.sp; b.g.position.set(b.cx + Math.sin(a)*b.r, b.y + Math.sin(t*.6 + b.ph)*1.5, b.cz + Math.cos(a)*b.r);
  b.g.rotation.y = a + (b.sp > 0 ? Math.PI/2 : -Math.PI/2); const f = Math.sin(t*7 + b.ph)*.75; b.L.rotation.z = f; b.R.rotation.z = -f; }); }
