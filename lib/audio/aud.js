// Dźwięki syntezowane w Web Audio (bez plików) — klocki z własnym stanem AUD (styl Dzikich Bryk).
// audSetup(klucz) · audInit() przy pierwszym dotknięciu · audMute(on) · audTone(f0, f1, czas, fala, głośność, opóźnienie, vib)
// audNoise(czas, głośność, f0, f1, q, opóźnienie, filtr) · audMetal(f, czas, głośność, opóźnienie)

const AUD = { ctx: null, out: null, on: true, key: 'dzwiek', noise: null, voices: {} };
// Klucz w localStorage dla włącznika dźwięku danej gry (wywołuje gra przy starcie)
function audSetup(key) { AUD.key = key; AUD.on = localStorage.getItem(key) !== '0'; }

function audInit() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  AUD.ctx = new C();
  const comp = AUD.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(AUD.ctx.destination);
  AUD.out = AUD.ctx.createGain(); AUD.out.gain.value = AUD.on ? .7 : 0; AUD.out.connect(comp);
  const n = AUD.ctx.createBuffer(1, AUD.ctx.sampleRate * 2, AUD.ctx.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  AUD.noise = n;
}
function audMute(on) { AUD.on = on; localStorage.setItem(AUD.key, on ? '1' : '0'); if (AUD.out) AUD.out.gain.value = on ? .7 : 0; }

/* --- klocki: ton, szum, metaliczne uderzenie --- */
// ton f0 → f1 (wykładniczo), kształt fali, głośność, opóźnienie, vib = [częstotliwość, głębokość] drgania
function audTone(f0, f1, dur, type = 'square', vol = .2, delay = 0, vib = null, dest = null) {
  const A = AUD.ctx; if (!A) return;
  const t = A.currentTime + delay, o = A.createOscillator(), g = A.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  if (vib) { const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = vib[0]; lg.gain.value = vib[1]; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + .05); }
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(dest || AUD.out); o.start(t); o.stop(t + dur + .05);
}
// szum przez filtr (bandpass/lowpass/highpass) f0 → f1
function audNoise(dur, vol, f0, f1, q = 1, delay = 0, type = 'bandpass') {
  const A = AUD.ctx; if (!A) return;
  const t = A.currentTime + delay, s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain();
  s.buffer = AUD.noise; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(AUD.out); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
}
// blacha: kilka nieharmonicznych tonów naraz (jak uderzenie w metal)
function audMetal(f, dur, vol, delay = 0) {
  [1, 2.76, 5.4, 8.93].forEach((m, i) => audTone(f * m, f * m * .98, dur / (1 + i * .5), 'triangle', vol / (1 + i), delay));
}
