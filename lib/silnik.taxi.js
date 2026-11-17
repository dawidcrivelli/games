// silnik spalinowy z biegami: stałe generatory sterowane obrotami, strzały z wydechu, pisk opon, syrena — wspólne dla: taxi (i galeria dźwięków)
// wymaga: AU (initAudio z lib/ciuchcia-taxi.js), tone, burst, rr, clamp
'use strict';

function engineProfile(kind) {                     // idle/top: Hz na wolnych i maksymalnych obrotach, g: biegi, br: jasność, tr: „klekot”, nz: szum wydechu
  return { taxi:{ idle:21, top:75, g:4, br:1, tr:.3, nz:.07 }, race:{ idle:78, top:330, g:5, br:2.2, tr:.12, nz:.03, pops:4 }, bus:{ idle:15, top:48, g:4, br:.75, tr:.45, nz:.15 },
    ursus:{ idle:13, top:44, g:3, br:.9, tr:.9, nz:.1, lfo1:1 }, police:{ idle:24, top:86, g:4, br:1.1, tr:.28, nz:.07 }, plane:{ idle:48, top:112, g:1, br:1.3, tr:.6, nz:.16 } }[kind] || engineProfile('taxi');
}
function engineCreate() {                          // generatory chodzą stale, głośność 0; zwraca stan silnika
  if (!AU.ctx) return null; const c = AU.ctx, osc = (t, f) => { const o = c.createOscillator(); o.type = t; o.frequency.value = f || 60; o.start(); return o; }, G = v => { const g = c.createGain(); g.gain.value = v; return g; };
  const o1 = osc('sawtooth'), o2 = osc('sawtooth'), o3 = osc('square'), g2 = G(.9), g3 = G(.22), mix = G(.55), sh = c.createWaveShaper(), lp = c.createBiquadFilter(), trem = G(1), out = G(0), lfo = osc('sine'), lg = G(0);
  const cv = new Float32Array(256); for (let i = 0; i < 256; i++) cv[i] = Math.tanh((i/127.5 - 1)*2.6); sh.curve = cv; lp.type = 'lowpass'; lp.Q.value = 1.6;
  o1.connect(mix); o2.connect(g2); g2.connect(mix); o3.connect(g3); g3.connect(mix); mix.connect(sh); sh.connect(lp); lp.connect(trem); trem.connect(out); out.connect(AU.master); lfo.connect(lg); lg.connect(trem.gain);
  const nz = (type, f, q) => { const s = c.createBufferSource(), b = c.createBiquadFilter(), g = G(0); s.buffer = AU.noiseBuf; s.loop = true; b.type = type; b.frequency.value = f; b.Q.value = q; s.connect(b); b.connect(g); s.start(); return { g, b }; };
  const ex = nz('bandpass', 260, .8); ex.g.connect(trem); const skid = nz('bandpass', 1750, 7); skid.g.connect(AU.master); const sk2 = nz('bandpass', 2450, 9); sk2.g.connect(AU.master);
  const so = osc('sawtooth', 660), so2 = osc('square', 660), sl = c.createBiquadFilter(), sg = G(0); sl.type = 'bandpass'; sl.frequency.value = 1100; sl.Q.value = .6; so.connect(sl); const s2g = G(.35); so2.connect(s2g); s2g.connect(sl); sl.connect(sg); sg.connect(AU.master);
  return { o1, o2, o3, lp, trem, out, lfo, lg, ex, skid, sk2, so, so2, sg, rpm:0, gear:0, prevThr:0, popN:0, popT:0, t:0 };
}
function engineBang() { burst(170, .07, .6, 0, .7, 'lowpass'); burst(1500, .04, .22, 0, 1); tone(95, .06, 'square', .28, 45); }
// jeden krok: o = { kind, fr: prędkość/max (0..1), vf: prędkość m/s (ujemna = wstecz), thr: gaz 0/1, air, skid, siren }; zwraca true, gdy strzelił wydech
function engineStep(EN, dt, o) {
  if (!EN) return false; const t = AU.ctx.currentTime, E = engineProfile(o.kind), fr = clamp(o.fr, 0, 1), thr = o.thr ? 1 : 0, vf = o.vf || 0; EN.t += dt;
  const gi = Math.min(E.g - 1, (Math.pow(fr, .8)*E.g) | 0), lo = Math.pow(gi/E.g, 1.25), hi = Math.pow((gi + 1)/E.g, 1.25);
  let tg = gi ? .3 + .7*(fr - lo)/(hi - lo) : .08 + .92*fr/hi; if (o.air && thr) tg = 1; if (vf < -.3) tg = .15 + Math.min(.6, -vf/7);
  if (EN.prevThr && !thr && EN.rpm > .5 && !o.air) EN.popN = E.pops || 2 + ((Math.random()*2) | 0); else if (gi > EN.gear && thr && Math.random() < (E.pops ? 1 : .5)) EN.popN = 1; EN.prevThr = thr;      // strzały z wydechu: po puszczeniu gazu i przy zmianie biegu
  let bang = false; EN.popT -= dt; if (EN.popN > 0 && EN.popT <= 0) { EN.popN--; EN.popT = .07 + Math.random()*.13; engineBang(); bang = true; }
  EN.rpm += (tg - EN.rpm)*Math.min(1, dt*(gi !== EN.gear ? 30 : 7)); EN.gear = gi; const rpm = EN.rpm, f = E.idle + (E.top - E.idle)*rpm + Math.sin(EN.t*31)*.6;
  EN.o1.frequency.setTargetAtTime(f, t, .03); EN.o2.frequency.setTargetAtTime(f*.5, t, .03); EN.o3.frequency.setTargetAtTime(f*2.01, t, .03); EN.lfo.frequency.setTargetAtTime(E.lfo1 ? f : f*.5, t, .03);
  EN.lp.frequency.setTargetAtTime((260 + rpm*1300 + thr*900)*E.br, t, .05); EN.trem.gain.setTargetAtTime(1 - E.tr/2, t, .1); EN.lg.gain.setTargetAtTime(E.tr/2, t, .1);
  EN.out.gain.setTargetAtTime(.05 + rpm*.045 + thr*.05, t, .06); EN.ex.g.gain.setTargetAtTime(E.nz*(.5 + rpm + thr*.6), t, .08); EN.ex.b.frequency.setTargetAtTime(180 + rpm*500, t, .08);
  EN.skid.g.gain.setTargetAtTime(o.skid ? .22 : 0, t, .05); EN.sk2.g.gain.setTargetAtTime(o.skid ? .12 : 0, t, .05);
  const sf = (EN.t*1.5 % 1) < .5 ? 880 : 660; EN.sg.gain.setTargetAtTime(o.siren ? .1 : 0, t, .03); if (o.siren) { EN.so.frequency.setTargetAtTime(sf, t, .012); EN.so2.frequency.setTargetAtTime(sf, t, .012); }
  return bang;
}
function engineMute(EN) { if (!EN) return; const t = AU.ctx.currentTime; [EN.out, EN.ex.g, EN.skid.g, EN.sk2.g, EN.sg].forEach(g => g.gain.setTargetAtTime(0, t, .08)); EN.popN = 0; }
