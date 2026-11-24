// Odgłosy zwierzaków i ogródka (syntezowane, bez plików) na wspólnym stanie AU z lib/audio/synth.js.
// critAudioInit() — przy pierwszym dotknięciu: zakłada AU.ctx, AU.master, AU.noiseBuf (jeśli gra nie zrobiła tego sama).
// SFX.chomp() chrup · SFX.burp() beknięcie · SFX.call(gatunek) głos zwierzaka (rabbit, chicken, cow, goat, deer, mole, beaver, mouse,
// lion, tiger, elephant…) · SFX.poke() szturchnięcie widłami · SFX.ouch() „auć” (kolce) · SFX.yuck() „fuj” (smród) · SFX.plant() sadzenie
// · SFX.seed() zebrane ziarenko · SFX.harvest() zbiór · SFX.slap() klaps ogonem · SFX.whoosh() ręka z nieba · SFX.win() fanfara
// · SFX.drum() werbel „uwaga, idą!” · SFX.roar() ryk lwa · const piła = SFX.chainsaw() → { set(0..1), stop() } — piła mechaniczna (bobry).
// wymaga: lib/audio/synth.js (AU, tone, burst)
'use strict';
function critAudioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const c = AU.ctx = new C(), comp = c.createDynamicsCompressor(); AU.master = c.createGain(); AU.master.gain.value = AU.muted() ? 0 : .8;
  AU.master.connect(comp); comp.connect(c.destination);
  const n = c.sampleRate*2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random()*2 - 1; AU.noiseBuf = b;
}
const SFX = (() => {
  const ok = () => AU.ctx && AU.noiseBuf && !AU.muted();
  // ton z vibrato (beczenie, muczenie)
  function wob(f, f2, dur, type, vol, rate, depth, delay, lp) { if (!ok()) return; const c = AU.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .05); g.gain.setValueAtTime(vol, t + dur*.7); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    let out = g; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; g.connect(f); out = f; }
    o.connect(g); out.connect(AU.master); o.start(t); l.start(t); o.stop(t + dur + .05); l.stop(t + dur + .05); }
  const CALLS = {
    rabbit: () => { tone(1400, .08, 'sine', .12, 2100); tone(1600, .07, 'sine', .1, 2300, .1); },
    mouse: () => { tone(2600, .06, 'sine', .1, 3400); tone(2800, .05, 'sine', .08, 3600, .08); tone(2700, .05, 'sine', .08, 3500, .15); },
    chicken: () => { for (let i = 0; i < 3; i++) { tone(620 - i*20, .09, 'square', .06, 430, i*.14); burst(1200, .05, .05, i*.14, 3); } tone(700, .22, 'square', .06, 900, .45); },
    cow: () => wob(170, 120, 1.2, 'sawtooth', .22, 5, 4, 0, 700),
    goat: () => wob(520, 470, .7, 'sawtooth', .12, 14, 30, 0, 2200),
    deer: () => wob(900, 700, .35, 'triangle', .14, 18, 40),
    mole: () => { tone(1800, .05, 'sine', .08, 1500); burst(500, .2, .2, .05, 1); },
    beaver: () => { for (let i = 0; i < 4; i++) burst(3000, .04, .2, i*.06, 4, 'highpass'); },
    elephant: () => wob(420, 680, .9, 'sawtooth', .18, 7, 25, 0, 1800),
    giraffe: () => wob(300, 260, .4, 'triangle', .1, 6, 10),
    zebra: () => { for (let i = 0; i < 3; i++) wob(700, 500, .15, 'sawtooth', .08, 20, 40, i*.17, 2000); },
    lion: () => roar(), tiger: () => roar(),
  };
  function roar() { if (!ok()) return; burst(180, 1.1, .5, 0, .8, 'lowpass'); wob(110, 70, 1.1, 'sawtooth', .3, 9, 12, 0, 500); }
  function chainsaw() {
    if (!ok()) return { set() {}, stop() {} };
    const c = AU.ctx, t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), s = c.createBufferSource(), sg = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = 70; o2.frequency.value = 141; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .8;
    l.frequency.value = 22; lg.gain.value = .35; l.connect(lg); lg.connect(g.gain);
    s.buffer = AU.noiseBuf; s.loop = true; sg.gain.value = .12;
    o.connect(f); o2.connect(f); s.connect(sg); sg.connect(f); f.connect(g); g.connect(AU.master); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .2);
    [o, o2, s, l].forEach(n => n.start(t));
    return { set(k) { const now = c.currentTime; o.frequency.setTargetAtTime(70 + k*90, now, .08); o2.frequency.setTargetAtTime(141 + k*180, now, .08); f.frequency.setTargetAtTime(900 + k*1600, now, .1); },
      stop() { const now = c.currentTime; g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(0, now, .08); [o, o2, s, l].forEach(n => { try { n.stop(now + .5); } catch (e) {} }); } };
  }
  return {
    chomp: () => { if (!ok()) return; burst(1800, .06, .25, 0, 2); burst(900, .07, .2, .07, 2); },
    burp: () => { if (!ok()) return; wob(95, 70, .45, 'sawtooth', .25, 30, 8, 0, 600); },
    call: k => { if (ok() && CALLS[k]) CALLS[k](); },
    poke: () => { if (!ok()) return; tone(260, .16, 'sine', .25, 620); tone(520, .1, 'triangle', .12, 900, .05); burst(2500, .08, .15, 0, 2); },
    ouch: () => { if (!ok()) return; tone(950, .18, 'triangle', .15, 560); },
    yuck: () => { if (!ok()) return; wob(240, 150, .5, 'sawtooth', .12, 12, 20, 0, 1200); },
    plant: () => { if (!ok()) return; burst(400, .12, .25, 0, 1, 'lowpass'); tone(520, .12, 'sine', .15, 780, .05); },
    seed: () => { if (!ok()) return; tone(880, .09, 'sine', .15); tone(1320, .14, 'sine', .15, 0, .07); },
    harvest: () => { if (!ok()) return; [523, 659, 784, 1046].forEach((f, i) => tone(f, .16, 'triangle', .15, 0, i*.07)); burst(600, .1, .2, 0, 1, 'lowpass'); },
    slap: () => { if (!ok()) return; burst(320, .12, .5, 0, .7); burst(1800, .05, .2, 0, 2); },
    whoosh: () => { if (!ok()) return; const c = AU.ctx, t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = AU.noiseBuf; f.type = 'bandpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1800, t + .25);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .1); g.gain.exponentialRampToValueAtTime(.001, t + .3); s.connect(f); f.connect(g); g.connect(AU.master); s.start(t); s.stop(t + .35); },
    win: () => { if (!ok()) return; [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, i === 5 ? .5 : .18, 'square', .08, 0, i*.15)); },
    drum: () => { if (!ok()) return; for (let i = 0; i < 6; i++) { burst(180, .12, .45, i*.13, .8, 'lowpass'); burst(2000, .05, .1, i*.13, 1); } },
    roar, chainsaw,
  };
})();
