'use strict';
// Dzikie Bryki — dźwięki syntezowane w Web Audio (bez plików).
// Klocki (audTone, audNoise, audMetal) w lib/audio/aud.js.
// snd('chap') — efekty; audVoice('rekin') → silnik z charakterem auta: v.set(obroty 0..1, turbo, głośność, pan)
audSetup('bryki-dzwiek');

const audPsst = (vol = .3, delay = 0) => audNoise(.16, vol, 6000, 2500, .7, delay, 'highpass');   // syk pneumatyki

function snd(name) {
  if (!AUD.ctx || !AUD.on) return;
  const T = audTone, N = audNoise, M = audMetal;
  switch (name) {
    // ataki
    case 'chap': audPsst(.25); M(260, .25, .35, .08); T(160, 45, .2, 'square', .3, .08); N(.12, .45, 1400, 300, 1.5, .09); M(180, .2, .25, .2); N(.1, .3, 900, 250, 2, .2); break;
    case 'dziob': for (let i = 0; i < 3; i++) { audPsst(.12, i * .09); M(1100, .07, .2, i * .09 + .02); } T(950, 620, .28, 'sawtooth', .12, .3, [28, 60]); break;
    case 'tusz': T(380, 70, .22, 'sine', .45); T(90, 50, .3, 'square', .12, .02); N(.45, .45, 900, 140, .8, .12, 'lowpass'); [1300, 1100, 1500].forEach((f, i) => T(f, f * .7, .07, 'sine', .14, .35 + i * .09)); break;
    case 'szczyp': T(260, 1100, .2, 'sawtooth', .08); audPsst(.18, .18); M(1600, .1, .3, .22); N(.06, .35, 5000, 3000, 3, .22); M(1900, .08, .22, .34); break;
    case 'pisk': for (const d of [0, .14, .26]) T(2600, 4200, .32, 'sine', .22 / (1 + d * 6), d, [90, 900]); N(.4, .12, 7000, 9000, 4, 0, 'bandpass'); break;
    // moce
    case 'plum': N(.5, .55, 1800, 150, .8, 0, 'lowpass'); T(500, 90, .3, 'sine', .3); for (let i = 0; i < 8; i++) T(300 + Math.random() * 700, 900 + Math.random() * 600, .06, 'sine', .12, .25 + i * .07); break;
    case 'trzepot': for (let i = 0; i < 6; i++) { N(.08, .35, 1100, 500, 2, i * .11); M(420, .06, .08, i * .11); } T(700, 1100, .3, 'sawtooth', .07, .6, [25, 80]); break;
    case 'slurp': T(160, 900, .35, 'sawtooth', .14, 0, [18, 40]); N(.35, .3, 300, 2000, 3); T(900, 200, .2, 'sine', .2, .35); break;
    case 'klang': M(196, 1.2, .4); M(392, .8, .18, .05); N(.5, .3, 8000, 4000, 2, .05, 'highpass'); [1, 2, 3].forEach(i => T(3000 + i * 600, 3400 + i * 600, .12, 'sine', .08, .2 + i * .08)); break;
    case 'roj': for (let i = 0; i < 16; i++) T(3000 + Math.random() * 2500, 4500 + Math.random() * 2500, .05, 'sine', .1, i * .045); N(.8, .2, 1200, 600, 3); break;
    case 'jezyk': T(250, 2200, .12, 'sine', .25); N(.08, .3, 3000, 1500, 2, .02); N(.12, .45, 900, 300, 1.5, .14, 'lowpass'); T(500, 180, .1, 'sine', .25, .16); break;   // fiut-MLASK
    case 'sprezyna': for (let i = 0; i < 3; i++) T(180 + i * 120, 700 + i * 200, .35, 'sine', .2, i * .12, [24, 60]); M(500, .2, .1); break;                                  // bzzoing-oing
    case 'lubudu': N(.6, .7, 700, 50, .7, 0, 'lowpass'); T(90, 30, .5, 'sine', .55); M(110, .5, .3, .03); M(160, .4, .2, .18); N(.3, .3, 300, 80, 1, .18, 'lowpass'); break;
    // trafienia, przeszkody
    case 'kabum': N(1.2, .8, 1500, 40, .6, 0, 'lowpass'); T(70, 25, .9, 'sine', .6); M(90, .8, .35, .02); for (let i = 0; i < 6; i++) M(300 + Math.random() * 900, .3, .12, .1 + i * .07); N(.6, .3, 4000, 800, 1, .15); break;   // auto wypada (KO)
    case 'bum': N(.4, .6, 900, 70, .7, 0, 'lowpass'); T(110, 38, .35, 'sine', .45); M(150, .3, .12, .02); break;
    case 'boing': T(170, 560, .1, 'sine', .3); T(560, 140, .45, 'sine', .3, .1, [11, 40]); M(330, .2, .12); break;
    case 'bonk': M(240, .25, .3); T(140, 90, .15, 'square', .15); break;
    case 'trzask': for (let i = 0; i < 4; i++) N(.06, .45, 1800 + i * 300, 900, 3, i * .035); T(130, 60, .18, 'sine', .3); break;
    case 'lup': N(.3, .5, 700, 90, 1, 0, 'lowpass'); M(120, .35, .25); break;
    // ruch
    case 'turbo': N(.9, .5, 250, 3000, 1.1); T(90, 300, .7, 'sawtooth', .14); N(.6, .25, 120, 400, 1, .2, 'lowpass'); break;
    case 'skok': T(260, 980, .3, 'sine', .25, 0, [14, 30]); M(600, .12, .1); break;
    case 'lad': N(.18, .5, 600, 120, 1, 0, 'lowpass'); T(90, 50, .15, 'sine', .3); M(140, .2, .1); break;
    case 'poslizg': T(820, 380, .6, 'sawtooth', .07, 0, [9, 30]); N(.6, .25, 3200, 1400, 4); break;
    case 'jajo': T(1100, 300, .25, 'sine', .12); break;
    case 'pip': T(1500, 2200, .08, 'square', .12); T(1500, 2400, .1, 'square', .12, .12); T(2400, 900, .3, 'sine', .14, .26); break;   // pingwin
    case 'swist': T(2400, 300, 1.1, 'sine', .12, 0, [7, 30]); N(1.1, .15, 4000, 600, 2); break;                                        // spadający meteor
    case 'chlup': N(.3, .4, 1600, 300, 1); T(420, 120, .2, 'sine', .25); break;
    case 'gwiazda': [1047, 1319, 1568, 2093].forEach((f, i) => T(f, f, .16, 'triangle', .16, i * .05)); break;
    case 'moc': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, f * 1.01, .2, 'square', .09, i * .05)); break;
    case 'beep': T(660, 660, .2, 'square', .16); break;
    case 'start': T(1320, 1320, .5, 'square', .18); T(660, 660, .5, 'square', .1); break;
    case 'meta': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => T(f, f, .22, 'square', .12, i * .12)); break;
    case 'klik': T(1300, 900, .03, 'square', .08); break;
    // klaksony: każde auto po swojemu
    case 'klakson_rekin': T(200, 300, .25, 'sawtooth', .2, 0, [6, 6]); T(300, 300, .35, 'sawtooth', .2, .25); break;              // „a-uuu-ga”
    case 'klakson_ptak': [784, 988, 1175, 1568].forEach((f, i) => T(f, f * (i === 3 ? .8 : 1.05), i === 3 ? .4 : .12, 'square', .13, i * .12)); break;   // kukuryku
    case 'klakson_osmiornica': T(98, 92, .7, 'sawtooth', .25, 0, [5, 4]); T(147, 140, .7, 'sawtooth', .12, 0, [5, 4]); break;      // tuba
    case 'klakson_krab': M(2100, .5, .25); M(2100, .5, .25, .18); break;                                                             // dzwonek
    case 'klakson_zaba': for (const d of [0, .3]) { T(110, 90, .22, 'square', .22, d, [24, 30]); N(.2, .2, 700, 500, 5, d); } break;   // kum-kum
    case 'klakson_nietoperz': T(3000, 4200, .12, 'sine', .2); T(3000, 4600, .14, 'sine', .2, .16); break;                            // pi-pi
  }
}

/* --- silniki: każdy rodzaj auta inaczej --- */
function audVoice(kind) {
  const A = AUD.ctx; if (!A) return null;
  if (AUD.voices[kind]) return AUD.voices[kind];
  const out = A.createGain(); out.gain.value = 0;
  const pan = A.createStereoPanner ? A.createStereoPanner() : null;
  if (pan) out.connect(pan).connect(AUD.out); else out.connect(AUD.out);
  const osc = (type, f) => { const o = A.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; };
  const gain = v => { const g = A.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, q) => { const x = A.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
  const noise = () => { const s = A.createBufferSource(); s.buffer = AUD.noise; s.loop = true; s.start(); return s; };
  const lfo = (f, depth, target) => { const l = osc('sine', f), g = gain(depth); l.connect(g).connect(target); return l; };
  const V = { kind, out, pan, set: null };
  if (kind === 'rekin') {                    // V8: dwie piły lekko rozstrojone + sub, „blub-blub” (tremolo) jak duży silnik na wolnych obrotach
    const o1 = osc('sawtooth', 40), o2 = osc('sawtooth', 40), sub = osc('sine', 20), f = filt('lowpass', 500, 4), tr = gain(.7);
    o1.connect(f); o2.connect(f); sub.connect(gain(.6)).connect(f); f.connect(tr).connect(out);
    const l = lfo(10, .35, tr.gain);
    V.set = (r, tu) => { const b = 34 + 62 * r, t = A.currentTime;
      o1.frequency.setTargetAtTime(b, t, .06); o2.frequency.setTargetAtTime(b * 1.012, t, .06); sub.frequency.setTargetAtTime(b / 2, t, .06);
      l.frequency.setTargetAtTime(b / 4, t, .06); f.frequency.setTargetAtTime(280 + 900 * r + (tu ? 900 : 0), t, .08); };
  }
  if (kind === 'ptak') {                     // dwusuw na wysokich obrotach: kwadrat + oktawa, rezonansowy filtr, szybkie drganie
    const o1 = osc('square', 100), o2 = osc('sawtooth', 200), f = filt('bandpass', 1500, 3), wh = osc('sine', 800);
    o1.connect(f); o2.connect(gain(.4)).connect(f); f.connect(gain(1.6)).connect(out); wh.connect(gain(.025)).connect(out);
    lfo(8, 5, o1.frequency);
    V.set = (r, tu) => { const b = 85 + 170 * r, t = A.currentTime;
      o1.frequency.setTargetAtTime(b, t, .04); o2.frequency.setTargetAtTime(b * 2.01, t, .04); wh.frequency.setTargetAtTime(b * 7, t, .05);
      f.frequency.setTargetAtTime(900 + 1600 * r + (tu ? 1200 : 0), t, .06); };
  }
  if (kind === 'osmiornica') {               // bulgoczący diesel: niski kwadrat, filtr „wah” falujący nierówno + bąbelki z szumu
    const o1 = osc('square', 30), o2 = osc('triangle', 45), f = filt('lowpass', 400, 9), bub = filt('bandpass', 450, 6);
    o1.connect(f); o2.connect(gain(.5)).connect(f); f.connect(out);
    lfo(7.3, 180, f.frequency); lfo(11.9, 120, f.frequency);
    const n = noise(), ng = gain(.0); n.connect(bub).connect(ng).connect(out); lfo(6, .25, ng.gain);
    V.set = (r, tu) => { const b = 28 + 42 * r, t = A.currentTime;
      o1.frequency.setTargetAtTime(b, t, .07); o2.frequency.setTargetAtTime(b * 1.5, t, .07);
      f.frequency.setTargetAtTime(250 + 500 * r + (tu ? 700 : 0), t, .1); bub.frequency.setTargetAtTime(300 + 400 * r, t, .1); };
  }
  if (kind === 'krab') {                     // mechaniczny: trójkąt + piła, do tego klekot (szum bramkowany prostokątem)
    const o1 = osc('triangle', 50), o2 = osc('sawtooth', 75), f = filt('lowpass', 700, 2);
    o1.connect(f); o2.connect(gain(.45)).connect(f); f.connect(gain(1.3)).connect(out);
    const n = noise(), hp = filt('highpass', 2600, 1), gate = gain(0); n.connect(hp).connect(gate).connect(out);
    const sq = osc('square', 8), sg = gain(.12); sq.connect(sg).connect(gate.gain);
    V.set = (r, tu) => { const b = 42 + 70 * r, t = A.currentTime;
      o1.frequency.setTargetAtTime(b, t, .06); o2.frequency.setTargetAtTime(b * 1.5, t, .06); sq.frequency.setTargetAtTime(5 + 14 * r, t, .1);
      f.frequency.setTargetAtTime(450 + 800 * r + (tu ? 800 : 0), t, .08); };
  }
  if (kind === 'nietoperz') {                // turbina: wysoki gwizd + niski pomruk + syk powietrza
    const w1 = osc('sine', 600), w2 = osc('sine', 900), o = osc('sawtooth', 50), f = filt('lowpass', 500, 3);
    w1.connect(gain(.18)).connect(out); w2.connect(gain(.06)).connect(out); o.connect(f).connect(out);
    const n = noise(), hp = filt('highpass', 3500, .7), ng = gain(.06); n.connect(hp).connect(ng).connect(out);
    lfo(.7, 15, w1.frequency);
    V.set = (r, tu) => { const t = A.currentTime;
      w1.frequency.setTargetAtTime(500 + 1400 * r + (tu ? 600 : 0), t, .15); w2.frequency.setTargetAtTime((500 + 1400 * r) * 1.51, t, .15);
      o.frequency.setTargetAtTime(45 + 55 * r, t, .08); f.frequency.setTargetAtTime(300 + 600 * r, t, .1); ng.gain.setTargetAtTime(.04 + .1 * r + (tu ? .12 : 0), t, .1); };
  }
  if (kind === 'zaba') {                     // rechot: niski kwadrat przez dwa formanty, przerywany jak „kum-kum”
    const o1 = osc('square', 40), f1 = filt('bandpass', 700, 5), f2 = filt('bandpass', 1500, 6), tr = gain(.6);
    o1.connect(f1); o1.connect(f2); f1.connect(gain(2.2)).connect(tr); f2.connect(gain(1.2)).connect(tr); tr.connect(out);
    const l = lfo(16, .4, tr.gain);
    V.set = (r, tu) => { const b = 38 + 55 * r, t = A.currentTime;
      o1.frequency.setTargetAtTime(b, t, .06); l.frequency.setTargetAtTime(12 + 14 * r, t, .1);
      f1.frequency.setTargetAtTime(600 + 400 * r + (tu ? 500 : 0), t, .08); f2.frequency.setTargetAtTime(1300 + 700 * r, t, .08); };
  }
  const setFn = V.set;
  V.set = (r, tu, vol, p = 0) => { const t = A.currentTime; setFn(r, tu); out.gain.setTargetAtTime(vol, t, .08); if (pan) pan.pan.setTargetAtTime(p, t, .08); };
  AUD.voices[kind] = V; return V;
}
function audEnginesOff() { for (const k in AUD.voices) AUD.voices[k].out.gain.setTargetAtTime(0, AUD.ctx.currentTime, .1); }
