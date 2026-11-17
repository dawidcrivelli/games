// silnik — wspólne dla: ciuchcia, taxi
// wymaga z gry: AU, M, S, SUN_DIR, T, WX, envGround, envRT, envScene, envSun, headLamp, hemi, keys, moon, pmrem, puffNext, puffs, rain, renderer, scene, stars, sun, sunBall, uWind
'use strict';

// --- three
function signMat(txt, bg, fg) {                    // emaliowana tablica z napisem
  return lam(0xffffff, { map:tex(256, 64, (g, w, h) => { g.fillStyle = bg || '#1f4e8c'; g.fillRect(0, 0, w, h); g.strokeStyle = fg || '#fff'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = fg || '#fff'; g.font = 'bold 34px Arial, sans-serif'; const tw = g.measureText(txt).width; if (tw > 226) g.font = 'bold ' + Math.floor(34*226/tw) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w/2, h/2 + 2); }) });
}
const ell = (rx, ry, rz, mat, x, y, z, p, seg) => { const m = mesh(new T.SphereGeometry(1, seg || 14, 10), mat, x, y, z, p); m.scale.set(rx, ry, rz); return m; };
const cone = (r0, r1, h, mat, x, y, z, p, seg) => mesh(new T.CylinderGeometry(r1, r0, h, seg || 10), mat, x, y, z, p);
function cloneTpl(tpl, shadow) {                   // tania kopia sklejonej bryły (wspólna geometria)
  const g = new T.Group();
  tpl.children.forEach(m => { const c = new T.Mesh(m.geometry, m.material); c.castShadow = !!shadow && !m.material.transparent; c.receiveShadow = true; g.add(c); });
  return g;
}

// --- scena
function applyWeather(w) {
  WX = w; setSky(w.top, w.hor); scene.fog.color.setHex(w.fog); scene.fog.near = w.fn; scene.fog.far = w.ff;
  sun.color.setHex(w.sun); sun.intensity = w.si; SUN_DIR.set(w.sd[0], w.sd[1], w.sd[2]); sun.position.copy(sun.target.position).add(SUN_DIR);
  hemi.color.setHex(w.hs); hemi.groundColor.setHex(w.hg); hemi.intensity = w.hi;
  M.cloud.color.setHex(w.cloud); M.cloud.opacity = w.co;
  sunBall.visible = !!w.sunVis; sunBall.position.copy(SUN_DIR).normalize().multiplyScalar(600); sunBall.material.color.setHex(w.sunCol || 0xfff6c4);
  moon.visible = stars.visible = !!w.moon; rain.visible = !!w.rain; uWind.value = w.wind; headLamp.intensity = w.lamp*1.25;
  M.win.emissive.setHex(w.lamp >= .5 ? 0xffc45a : 0x000000); M.win.emissiveIntensity = Math.min(1, w.lamp);
  try { if (!pmrem) pmrem = new T.PMREMGenerator(renderer);
    envGround.material.color.setHex(w.moon ? 0x10151c : w.rain ? 0x5a6455 : 0x7a9a50); envSun.visible = !!w.sunVis; envSun.position.copy(sunBall.position);
    const rt = pmrem.fromScene(envScene, 0, .1, 1500); scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt; } catch (e) {}
  $('wx').textContent = w.ico;
}
function puff(x, y, z, vx, vy, vz, life, size, gray, a) {
  const p = puffs[puffNext]; puffNext = (puffNext + 1) % puffs.length;
  p.s.position.set(x, y, z); p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.size = size; p.a = a || 1; p.s.material.color.setScalar(gray); p.s.visible = true;
}
function updatePuffs(dt) {
  for (let i = 0; i < puffs.length; i++) { const p = puffs[i]; if (p.life <= 0) continue;
    p.life -= dt; if (p.life <= 0) { p.s.visible = false; continue; }
    const t = 1 - p.life/p.max; p.vy *= 1 - dt*.6; p.vx += (.9*WX.wind - p.vx)*dt*.5;
    p.s.position.x += p.vx*dt; p.s.position.y += p.vy*dt; p.s.position.z += p.vz*dt;
    p.s.scale.setScalar(p.size*(.45 + t*2.4)); p.s.material.opacity = ((1 - t)*(1 - t)*.8 + (1 - t)*.1)*p.a; }
}
function burst(freq, dur, vol, delay, q, type) { const c = AU.ctx; if (!c) return; const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + (delay || 0);
  s.buffer = AU.noiseBuf; f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1.4; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random()*1.5, dur + .05); }

// --- audio
function initAudio() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const ctx = AU.ctx = new C();
  AU.master = ctx.createGain(); AU.master.gain.value = S.muted ? 0 : .7;
  const comp = ctx.createDynamicsCompressor(); AU.master.connect(comp); comp.connect(ctx.destination);
  const nb = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
  AU.noiseBuf = nb;
  const loop = (type, freq, q) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q || .7;
    g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AU.master); s.start(); return g; };
  AU.rainG = loop('highpass', 2200); AU.roll = loop('lowpass', 240); AU.hiss = loop('bandpass', 5200, .5);
  { const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); o1.type = 'sawtooth'; o2.type = 'square'; lp.type = 'lowpass'; lp.frequency.value = 700; g.gain.value = 0;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(AU.master); o1.start(); o2.start(); AU.mot = g; AU.motO = [o1, o2, lp]; }      // silniki elektryczne
}

// --- ui
function holdBtn(id, k) { const b = $(id), set = x => { keys[k] = x; b.classList.toggle('on', !!x); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} set(1); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => set(0))); }
function syncSnd() { $('sndIco').textContent = S.muted ? '🔇' : '🔊'; }

// --- klaksony: wspólna biblioteka dźwięków pojazdów (brzmienie klaksonu z Taxi). Trzymany gra, puszczony cichnie (min. ćwierć sekundy).
function hornKind(kind) {                          // częstotliwości dwutonów; ciuchcia i taxi biorą je stąd
  return { taxi:[415, 523], police:[415, 523], race:[620, 784], bus:[185, 233], ursus:[340, 428], plane:[500, 630], eu:[311, 370], pend:[349, 440] }[kind] || [415, 523];
}
function hornStart(kind, vol) {                    // dwuton: piły + kwadraty, lekko rozstrojone, z „blaszanym” podbiciem 2,3 kHz
  initAudio(); const c = AU.ctx; if (!c) return null; const t = c.currentTime, F = Array.isArray(kind) ? kind : hornKind(kind), low = F[0] < 330;
  const out = c.createGain(), hp = c.createBiquadFilter(), hl = c.createBiquadFilter(), oscs = [];
  hp.type = 'peaking'; hp.frequency.value = low ? 1500 : 2300; hp.Q.value = 1; hp.gain.value = 9; hl.type = 'lowpass'; hl.frequency.value = low ? 3000 : 4200;
  [['sawtooth', 0, .5, 1], ['sawtooth', 1, .5, 1], ['square', 0, .16, 1.003], ['square', 1, .16, 1.003]].forEach(q => { const o = c.createOscillator(), g = c.createGain();
    o.type = q[0]; o.frequency.value = F[q[1]]*q[3]; g.gain.value = q[2]; o.connect(g); g.connect(hp); o.start(t); oscs.push(o); });
  hp.connect(hl); hl.connect(out); out.connect(AU.master); out.gain.setValueAtTime(0, t); out.gain.setTargetAtTime(vol || .17, t, .012);
  return { out, oscs, t0:t, rel:.035 };
}
function whistleStart(vol) {                       // gwizdek parowozu: akord trzech piszczałek, syk pary i krótki „podjazd” tonu
  initAudio(); const c = AU.ctx; if (!c) return null; const t = c.currentTime, out = c.createGain(), oscs = [];
  [[622, .15], [784, .13], [932, .09]].forEach(q => [['triangle', 1, q[1]], ['sine', 1.006, q[1]*.6]].forEach(w => { const o = c.createOscillator(), g = c.createGain(); o.type = w[0];
    o.frequency.setValueAtTime(q[0]*w[1]*.94, t); o.frequency.exponentialRampToValueAtTime(q[0]*w[1], t + .12); g.gain.value = w[2]; o.connect(g); g.connect(out); o.start(t); oscs.push(o); }));
  const s = c.createBufferSource(), f = c.createBiquadFilter(), ng = c.createGain(); s.buffer = AU.noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = .9; ng.gain.value = .12;
  s.connect(f); f.connect(ng); ng.connect(out); s.start(t); oscs.push(s);
  out.connect(AU.master); out.gain.setValueAtTime(0, t); out.gain.setTargetAtTime((vol || 1)*.9, t, .02); return { out, oscs, t0:t, rel:.08 };
}
function trainHornStart(kind) { return kind === 'steam' ? whistleStart() : hornStart(kind === 'eu' ? 'eu' : 'pend', .15); }
function hornStop(v, minDur) {                     // puszczony klakson: wycisz po minimalnym czasie i zwolnij generatory
  if (!v || v.done || !AU.ctx) return; v.done = true; const c = AU.ctx, t = Math.max(c.currentTime, v.t0 + (minDur || .26));
  v.out.gain.cancelScheduledValues(t); v.out.gain.setTargetAtTime(0, t, v.rel); v.oscs.forEach(o => o.stop(t + v.rel*8));
}
function hornTap(v, dur) { if (v) hornStop(v, dur); return v; }    // krótkie trąbnięcie bez trzymania
