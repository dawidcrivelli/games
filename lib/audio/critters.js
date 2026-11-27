// Odgłosy zwierzaków i ogródka (syntezowane, bez plików) na wspólnym stanie AU z lib/audio/synth.js.
// critAudioInit() — przy pierwszym dotknięciu: zakłada AU.ctx, AU.master, AU.noiseBuf (jeśli gra nie zrobiła tego sama).
// SFX.chomp() chrup · SFX.burp() beknięcie-pierd · SFX.fart() pierd (smród cebuli) · SFX.call(gatunek) głos zwierzaka (rabbit, chicken,
// cow, goat, deer, mole, beaver, mouse, lion, tiger, elephant, giraffe, zebra…) · SFX.poke() „boing” wideł · SFX.ouch() „auć” (kolce)
// · SFX.yuck() „fuj” · SFX.plant() sadzenie · SFX.seed() zebrana fasolka · SFX.harvest() zbiór · SFX.slap() klaps ogonem
// · SFX.whoosh() ręka z nieba · SFX.win() fanfara · SFX.drum() bębny „uwaga, idą!” · SFX.roar() ryk lwa · SFX.scare() strach na wróble
// · SFX.timber() trzask padającego drzewa · const piła = SFX.chainsaw() → { set(0..1), stop() } — piła mechaniczna (bobry), dwusuw z łańcuchem.
// Głosy: źródło (piła/prostokąt) przez filtry formantów (jak samogłoski), vibrato, obwiednia — „muuu”, „meee”, „ko-ko”.
// wymaga: lib/audio/synth.js (AU)
'use strict';
function critAudioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const c = AU.ctx = new C(), comp = c.createDynamicsCompressor(); AU.master = c.createGain(); AU.master.gain.value = AU.muted() ? 0 : .8;
  comp.threshold.value = -14; comp.ratio.value = 4; AU.master.connect(comp); comp.connect(c.destination);
  const n = c.sampleRate*2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random()*2 - 1; AU.noiseBuf = b;
}
const SFX = (() => {
  const ok = () => AU.ctx && AU.noiseBuf && !AU.muted(), C = () => AU.ctx, now = d => AU.ctx.currentTime + (d || 0);
  const R = (a, b) => a + Math.random()*(b - a);
  // ---------- klocki
  function gainEnv(t, a, peak, hold, rel) { const g = C().createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(.0008, t + a + hold + rel); return g; }
  function filt(type, f, q) { const x = C().createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q || 1; return x; }
  let shCurve = null; function shaper(k) { const s = C().createWaveShaper(); if (!shCurve) { const n = 1024, a = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i/(n - 1)*2 - 1; a[i] = Math.tanh(x*4); } shCurve = a; } s.curve = shCurve; return s; }
  function noiseSrc(t, dur) { const s = C().createBufferSource(); s.buffer = AU.noiseBuf; s.loop = true; s.start(t, Math.random()*1.5); s.stop(t + dur + .05); return s; }
  function lfo(t, dur, rate, depth, param, type) { const l = C().createOscillator(), g = C().createGain(); l.type = type || 'sine'; l.frequency.value = rate; g.gain.value = depth; l.connect(g); g.connect(param); l.start(t); l.stop(t + dur + .05); return l; }
  // głos z formantami: o = { f0, f1 (koniec), dur, type, form: [[f, Q, gain]…] (albo f0f: [[fStart, fEnd, Q, gain]]), vib: [szybkość, głębokość], vol, delay, a (narastanie) }
  function voice(o) {
    const t = now(o.delay), dur = o.dur, s = C().createOscillator(), env = gainEnv(t, o.a || .04, o.vol || .3, dur*.55, dur*.45), sum = C().createGain(); sum.gain.value = 1;
    s.type = o.type || 'sawtooth'; s.frequency.setValueAtTime(o.f0, t); if (o.fMid) s.frequency.linearRampToValueAtTime(o.fMid, t + dur*.35); s.frequency.exponentialRampToValueAtTime(o.f1 || o.f0, t + dur);
    if (o.vib) lfo(t, dur, o.vib[0], o.vib[1], s.frequency);
    for (const f of o.form) { const b = filt('bandpass', f[0], f[f.length === 4 ? 2 : 1]), g = C().createGain(); g.gain.value = f[f.length - 1];
      if (f.length === 4) { b.frequency.setValueAtTime(f[0], t); b.frequency.linearRampToValueAtTime(f[1], t + dur*.6); }
      s.connect(b); b.connect(g); g.connect(sum); }
    sum.connect(env); env.connect(AU.master); s.start(t); s.stop(t + dur + .05);
  }
  function noiseHit(t, f, q, vol, a, rel, type) { const s = noiseSrc(t, a + rel), x = filt(type || 'bandpass', f, q), g = gainEnv(t, a, vol, 0, rel); s.connect(x); x.connect(g); g.connect(AU.master); return x; }
  function blip(t, f0, f1, dur, type, vol) { const o = C().createOscillator(), g = gainEnv(t, .006, vol, 0, dur); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + .05); return o; }

  // ---------- zwierzaki
  const CALLS = {
    rabbit: () => { for (let i = 0; i < 3; i++) voice({ f0: R(1300, 1500), f1: 1900, dur: .07, type: 'triangle', form: [[2000, 3, 1], [3500, 4, .5]], vol: .22, delay: i*.09 }); },
    mouse: () => { for (let i = 0; i < 3; i++) voice({ f0: 2600, fMid: 3600, f1: 2900, dur: .09, type: 'triangle', form: [[3200, 2, 1]], vol: .2, delay: i*.11 }); },
    chicken: () => { for (let i = 0; i < 3; i++) voice({ f0: R(560, 620), f1: 430, dur: .11, type: 'square', form: [[900, 4, 1.2], [1800, 6, .6], [2900, 8, .3]], vol: .22, delay: i*.17, a: .01 });
      voice({ f0: 520, fMid: 900, f1: 700, dur: .45, type: 'square', form: [[1000, 1300, 4, 1.2], [2000, 6, .5]], vol: .22, delay: .55, vib: [9, 25] }); },
    cow: () => voice({ f0: 115, fMid: 150, f1: 105, dur: 1.4, type: 'sawtooth', form: [[260, 650, 3, 1.4], [700, 1100, 5, .7], [2400, 8, .15]], vol: .42, a: .25, vib: [5, 3] }),
    goat: () => voice({ f0: 430, f1: 380, dur: .9, type: 'sawtooth', form: [[600, 5, 1], [1800, 7, 1], [2600, 8, .4]], vol: .3, a: .05, vib: [7.5, 35] }),
    deer: () => { voice({ f0: 820, fMid: 1100, f1: 700, dur: .32, type: 'sawtooth', form: [[1200, 5, 1], [2600, 7, .5]], vol: .38, vib: [16, 30] }); },
    mole: () => { noiseHit(now(), 400, .8, .35, .02, .3, 'lowpass'); voice({ f0: 1600, f1: 2100, dur: .1, type: 'triangle', form: [[2200, 3, 1]], vol: .15, delay: .25 }); },
    beaver: () => { for (let i = 0; i < 5; i++) noiseHit(now(i*.055), 3500, 2, .7, .003, .04, 'bandpass'); voice({ f0: 700, f1: 600, dur: .25, type: 'square', form: [[1300, 5, 1]], vol: .12, delay: .3, vib: [20, 40] }); },
    elephant: () => { voice({ f0: 380, fMid: 720, f1: 600, dur: 1.1, type: 'sawtooth', form: [[900, 3, 1.2], [1800, 5, .8], [3000, 6, .3]], vol: .35, a: .06, vib: [6, 30] }); noiseHit(now(), 1400, 1, .12, .1, .8); },
    giraffe: () => voice({ f0: 280, f1: 240, dur: .5, type: 'triangle', form: [[500, 3, 1]], vol: .2, vib: [5, 8] }),
    zebra: () => { for (let i = 0; i < 4; i++) voice({ f0: 700 - i*60, f1: 500, dur: .14, type: 'sawtooth', form: [[1100, 5, 1], [2400, 6, .4]], vol: .2, delay: i*.15, vib: [25, 50] }); },
    hippo: () => voice({ f0: 90, f1: 70, dur: .8, type: 'sawtooth', form: [[300, 3, 1.5]], vol: .4, vib: [12, 6] }),
    panda: () => voice({ f0: 500, f1: 420, dur: .3, type: 'triangle', form: [[900, 4, 1]], vol: .18 }),
    kangaroo: () => { noiseHit(now(), 200, 1, .3, .01, .2, 'lowpass'); noiseHit(now(.25), 200, 1, .3, .01, .2, 'lowpass'); },
    penguin: () => voice({ f0: 700, f1: 500, dur: .35, type: 'square', form: [[1000, 5, 1]], vol: .15, vib: [18, 40] }),
    lion: () => roar(), tiger: () => roar(),
  };
  function roar() { if (!ok()) return; const t = now(), dur = 1.3, s = C().createOscillator(), sh = shaper(), lp = filt('lowpass', 700, 2), env = gainEnv(t, .12, .5, .6, .6);
    s.type = 'sawtooth'; s.frequency.setValueAtTime(95, t); s.frequency.linearRampToValueAtTime(140, t + .3); s.frequency.exponentialRampToValueAtTime(65, t + dur);
    lfo(t, dur, 23, 18, s.frequency, 'square'); lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(1400, t + .3); lp.frequency.exponentialRampToValueAtTime(300, t + dur);
    s.connect(sh); sh.connect(lp); lp.connect(env); env.connect(AU.master); s.start(t); s.stop(t + dur + .1);
    noiseHit(t, 600, .7, .35, .1, 1.1, 'lowpass'); }
  // pierd: niski brzęczyk z „trzepotaniem” (losowe vibrato prostokątem), filtr dolnoprzepustowy
  function fart(len) { if (!ok()) return; const t = now(), dur = len || R(.45, .8), s = C().createOscillator(), lp = filt('lowpass', 520, 3), env = gainEnv(t, .02, .45, dur*.6, dur*.4), g2 = C().createGain();
    s.type = 'sawtooth'; const f = R(75, 105); s.frequency.setValueAtTime(f*1.25, t); s.frequency.exponentialRampToValueAtTime(f*.8, t + dur);
    lfo(t, dur, R(22, 32), 18, s.frequency, 'square'); lfo(t, dur, R(7, 11), .3, g2.gain); g2.gain.value = .7;
    s.connect(lp); lp.connect(g2); g2.connect(env); env.connect(AU.master); s.start(t); s.stop(t + dur + .05);
    noiseHit(t, 250, 1, .12, .02, dur, 'lowpass'); }
  // piła mechaniczna: dwusuw (piła + prostokąt przez przester, z „pyrkaniem”), świst łańcucha, chrzęst drewna przy cięciu
  function chainsaw() {
    if (!ok()) return { set() {}, stop() {} };
    const c = C(), t = c.currentTime, e1 = c.createOscillator(), e2 = c.createOscillator(), pre = c.createGain(), sh = shaper(), lp = filt('lowpass', 2400, 1), out = c.createGain(),
      am = c.createGain(), amL = c.createOscillator(), amG = c.createGain(), ch = noiseSrc(t, 60), chF = filt('bandpass', 3800, 2.5), chG = c.createGain(),
      wd = noiseSrc(t, 60), wdF = filt('bandpass', 1100, 1.5), wdG = c.createGain(), wdL = c.createOscillator(), wdLG = c.createGain();
    e1.type = 'sawtooth'; e2.type = 'square'; e1.frequency.value = 38; e2.frequency.value = 76; pre.gain.value = 1.6;
    e1.connect(pre); e2.connect(pre); pre.connect(sh); sh.connect(lp); lp.connect(am); am.gain.value = .75;
    amL.type = 'square'; amL.frequency.value = 19; amG.gain.value = .25; amL.connect(amG); amG.connect(am.gain);          // pyrkanie dwusuwu
    am.connect(out); ch.connect(chF); chF.connect(chG); chG.gain.value = .05; chG.connect(out);
    wd.connect(wdF); wdF.connect(wdG); wdG.gain.value = 0; wdL.type = 'square'; wdL.frequency.value = 13; wdLG.gain.value = 0; wdL.connect(wdLG); wdLG.connect(wdG.gain); wdG.connect(out);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(.34, t + .08); out.connect(AU.master);
    // rozruch: pyr-pyr-pyr i wkręcenie na obroty
    e1.frequency.setValueAtTime(30, t); e1.frequency.linearRampToValueAtTime(36, t + .35); e1.frequency.linearRampToValueAtTime(95, t + .7);
    e2.frequency.setValueAtTime(60, t); e2.frequency.linearRampToValueAtTime(72, t + .35); e2.frequency.linearRampToValueAtTime(190, t + .7);
    amL.frequency.setValueAtTime(15, t); amL.frequency.linearRampToValueAtTime(47, t + .7);
    [e1, e2, amL, wdL].forEach(n => n.start(t));
    let k0 = -1;
    return {
      set(k) { if (Math.abs(k - k0) < .05) return; k0 = k; const n = c.currentTime, f = 78 + k*55 - (Math.random() < .25 ? 18 : 0);        // przy cięciu obroty siadają
        e1.frequency.setTargetAtTime(f, n, .05); e2.frequency.setTargetAtTime(f*2.01, n, .05); amL.frequency.setTargetAtTime(f/2, n, .05);
        lp.frequency.setTargetAtTime(1800 + k*2200, n, .08); chG.gain.setTargetAtTime(.05 + k*.12, n, .08); wdLG.gain.setTargetAtTime(k*.22, n, .1); },
      stop() { const n = c.currentTime; out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n);
        e1.frequency.setTargetAtTime(30, n, .15); out.gain.setTargetAtTime(0, n + .15, .12); [e1, e2, amL, wdL].forEach(x => { try { x.stop(n + .8); } catch (e) {} }); }
    };
  }
  return {
    chomp: () => { if (!ok()) return; const t = now(); for (let i = 0; i < 2; i++) { noiseHit(t + i*.09, R(1800, 2600), .9, .9, .003, .07); noiseHit(t + i*.09, 320, 1, .7, .003, .06, 'lowpass'); } noiseHit(t + .2, 900, 1.5, .35, .01, .08); },
    burp: () => fart(.7), fart,
    call: k => { if (ok() && CALLS[k]) CALLS[k](); },
    poke: () => { if (!ok()) return; const t = now(), o = blip(t, 180, 420, .45, 'sine', .5); lfo(t, .45, 18, 60, o.frequency); noiseHit(t, 3000, 1.2, .4, .003, .05); },
    ouch: () => { if (!ok()) return; voice({ f0: 520, fMid: 640, f1: 330, dur: .38, type: 'sawtooth', form: [[700, 900, 4, 1.2], [1200, 5, .7]], vol: .4, a: .01 }); noiseHit(now(), 4000, 2, .2, .002, .04); },
    yuck: () => { if (!ok()) return; voice({ f0: 260, f1: 180, dur: .5, type: 'sawtooth', form: [[500, 4, 1.2], [1500, 6, .5]], vol: .22, vib: [11, 15] }); },
    plant: () => { if (!ok()) return; const t = now(); noiseHit(t, 380, 1, .7, .01, .18, 'lowpass'); noiseHit(t + .06, 700, 1, .35, .01, .12, 'lowpass'); blip(t + .08, 300, 900, .12, 'sine', .18); },
    seed: () => { if (!ok()) return; const t = now(); blip(t, 1175, 1180, .12, 'triangle', .2); blip(t + .07, 1568, 1570, .22, 'triangle', .2); blip(t + .07, 3136, 3140, .18, 'sine', .05); },
    harvest: () => { if (!ok()) return; const t = now(); blip(t, 160, 520, .1, 'sine', .35); [784, 988, 1175, 1568].forEach((f, i) => blip(t + .08 + i*.06, f, f, .18, 'triangle', .14)); },
    slap: () => { if (!ok()) return; const t = now(); noiseHit(t, 900, .6, 1.4, .002, .12); noiseHit(t, 160, 1, 1.2, .002, .15, 'lowpass'); },
    timber: () => { if (!ok()) return; const t = now(); for (let i = 0; i < 6; i++) noiseHit(t + i*.07 + Math.random()*.03, R(1500, 3000), 1.5, .6, .002, .05); noiseHit(t + .6, 120, 1, 1.4, .005, .5, 'lowpass'); noiseHit(t + .6, 600, 1, .6, .005, .3); },
    whoosh: () => { if (!ok()) return; const t = now(), x = noiseHit(t, 300, 1.2, .7, .12, .18); x.frequency.setValueAtTime(300, t); x.frequency.exponentialRampToValueAtTime(2200, t + .25); },
    scare: () => { if (!ok()) return; voice({ f0: 220, fMid: 330, f1: 200, dur: .9, type: 'sawtooth', form: [[400, 700, 4, 1], [1100, 5, .4]], vol: .2, a: .1, vib: [5, 20] }); for (let i = 0; i < 4; i++) noiseHit(now(i*.12), 2500, 1, .12, .005, .08); },
    win: () => { if (!ok()) return; const t = now(); [[523, 0], [659, .14], [784, .28], [1046, .42], [784, .62], [1046, .76]].forEach(([f, d], i) => { blip(t + d, f, f, i > 4 ? .7 : .2, 'square', .07); blip(t + d, f*2, f*2, i > 4 ? .6 : .15, 'triangle', .06); }); },
    drum: () => { if (!ok()) return; const t = now(); for (let i = 0; i < 8; i++) { const d = i*.16 + (i > 5 ? (i - 5)*.05 : 0); blip(t + d, i % 2 ? 110 : 150, 60, .25, 'sine', .5); noiseHit(t + d, 2500, .7, .08, .002, .06); } noiseHit(t + 1.4, 6000, .5, .2, .01, 1, 'highpass'); },
    roar, chainsaw,
  };
})();
