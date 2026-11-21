// Klaksony i gwizdki pojazdów: hornKind, hornStart (trzymany klakson), whistleStart, trainHornStart, hornStop, hornTap.
// wymaga: lib/audio/synth.js (AU), lib/audio/ambience.js (initAudio)
'use strict';

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
