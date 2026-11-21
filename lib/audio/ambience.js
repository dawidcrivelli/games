'use strict';
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
