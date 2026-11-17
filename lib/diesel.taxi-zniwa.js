// niski, klekoczący silnik diesla (traktor, kombajn) — wspólne dla: zniwa, taxi (Ursus) i galerii dźwięków
// wymaga: AU (ctx, master, noiseBuf)
'use strict';

function dieselProfile(name) {                     // f0/f1: Hz na wolnych/pełnych obrotach, c0/c1: klekot (Hz), depth: głębokość klekotu, lp: filtr, vol: głośność
  return { big:{ f0:54, f1:112, c0:10, c1:21, depth:.5, lp:640, vol:.38 }, combine:{ f0:62, f1:122, c0:12, c1:24, depth:.35, lp:760, vol:.34 },
    tractor:{ f0:44, f1:98, c0:7, c1:16, depth:.8, lp:560, vol:.4 } }[name];
}
function dieselCreate(p) {
  const ctx = AU.ctx, noise = () => { const s = ctx.createBufferSource(); s.buffer = AU.noiseBuf; s.loop = true; s.start(); return s; };
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
}
function dieselSet(e, rpm, on) {                   // rpm 0..1; on=false wycisza
  if (!AU.ctx || !e) return; const p = e.p, t = AU.ctx.currentTime, f = p.f0 + (p.f1 - p.f0)*rpm;
  e.o1.frequency.setTargetAtTime(f, t, .08); e.o2.frequency.setTargetAtTime(f/2, t, .08); e.o3.frequency.setTargetAtTime(f*1.5 + 1.5, t, .08);
  e.lfo.frequency.setTargetAtTime(p.c0 + (p.c1 - p.c0)*rpm, t, .08);
  e.lp.frequency.setTargetAtTime(p.lp*(1 + rpm*.9), t, .1);
  e.out.gain.setTargetAtTime(on ? p.vol*(.7 + rpm*.5) : 0, t, .12);
}
