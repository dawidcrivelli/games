// Syntezator na wspólnym stanie AU (Web Audio): tone(częstotliwość, czas, fala, głośność, f2, opóźnienie) — ton ze zjazdem,
// burst(częstotliwość, czas, głośność, opóźnienie, Q, filtr) — szum przez filtr (stuk, syk, chuch). AU.ctx/master/noiseBuf
// zakłada initAudio (lib/audio/ambience.js); AU.muted() — czy wyciszone (gra podstawia swoją funkcję).
// Konflikt nazw: lib/audio/music.js ma inny tone (styl Pralni) — nie ładować obu.
'use strict';
const AU = { ctx:null, muted:() => false };
function tone(f, dur, type, vol, f2, delay) {
  if (!AU.ctx) return; const c = AU.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .3, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + .05);
}
function burst(freq, dur, vol, delay, q, type) { const c = AU.ctx; if (!c) return; const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + (delay || 0);
  s.buffer = AU.noiseBuf; f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1.4; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random()*1.5, dur + .05); }
