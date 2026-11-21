// Pogoda „miasta” (Ciuchcia, Taxi, Żniwa): applyWeather(w, świat) ustawia niebo, mgłę, słońce, światło nieba, chmury, okna nocą,
// księżyc i gwiazdy, deszcz, wiatr, reflektor i mapę otoczenia; w = wpis z tablicy pogód gry (top, hor, fog, sun, si, sd…).
// świat = { scene, renderer, sun, hemi, sunDir, cloud, win } (cloud, win: materiały chmur i okien).
// wymaga: lib/3d/sky.js (WX, sunBall, moon, stars, rain, uWind, headLamp, env*), $ (lib/common/dom.js); ikona #wx w HTML — jeśli jest
'use strict';
function applyWeather(w, { scene, renderer, sun, hemi, sunDir:SUN_DIR, cloud, win }) {
  WX = w; setSky(w.top, w.hor); scene.fog.color.setHex(w.fog); scene.fog.near = w.fn; scene.fog.far = w.ff;
  sun.color.setHex(w.sun); sun.intensity = w.si; SUN_DIR.set(w.sd[0], w.sd[1], w.sd[2]); sun.position.copy(sun.target.position).add(SUN_DIR);
  hemi.color.setHex(w.hs); hemi.groundColor.setHex(w.hg); hemi.intensity = w.hi;
  cloud.color.setHex(w.cloud); cloud.opacity = w.co;
  sunBall.visible = !!w.sunVis; sunBall.position.copy(SUN_DIR).normalize().multiplyScalar(600); sunBall.material.color.setHex(w.sunCol || 0xfff6c4);
  moon.visible = stars.visible = !!w.moon; rain.visible = !!w.rain; uWind.value = w.wind; headLamp.intensity = w.lamp*1.25;
  win.emissive.setHex(w.lamp >= .5 ? 0xffc45a : 0x000000); win.emissiveIntensity = Math.min(1, w.lamp);
  try { if (!pmrem) pmrem = new T.PMREMGenerator(renderer);
    envGround.material.color.setHex(w.moon ? 0x10151c : w.rain || w.storm ? 0x5a6455 : 0x7a9a50); envSun.visible = !!w.sunVis; envSun.position.copy(sunBall.position);
    const rt = pmrem.fromScene(envScene, 0, .1, 1500); scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt; } catch (e) {}
  const ico = $('wx'); if (ico) ico.textContent = w.ico;          // ikona pogody, jeśli gra ją ma
}
