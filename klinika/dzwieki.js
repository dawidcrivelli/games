'use strict';
// Klinika Zoo — dźwięki (klocki w lib/audio/aud.js) i głos lektora (synteza mowy przeglądarki, po polsku).
// snd('bek') — efekty · mow('Serce!') — lektor + napis na dole ekranu (gdy dźwięk włączony)
audSetup('klinika-dzwiek');

function snd(name) {
  if (!AUD.ctx || !AUD.on) return;
  const T = audTone, N = audNoise, M = audMetal;
  switch (name) {
    case 'klik': T(1300, 900, .03, 'square', .08); break;
    case 'pyk': T(500, 1300, .09, 'sine', .3); N(.04, .25, 3000, 2000, 2, .02); break;                                   // coś wskoczyło na miejsce
    case 'hik': T(320, 950, .07, 'sine', .35); N(.05, .3, 1800, 900, 3); T(700, 400, .08, 'triangle', .15, .08); break;   // czkawka
    case 'chichot': [880, 700, 920, 720, 960, 760].forEach((f, i) => T(f, f * 1.1, .08, 'sine', .16, i * .09, [30, 25])); break;
    case 'bek': T(105, 72, .8, 'sawtooth', .32, 0, [13, 14]); T(150, 95, .7, 'square', .1, .02, [11, 10]); N(.75, .35, 700, 180, 1.2, 0, 'lowpass'); break;   // BEEEK!
    case 'kwa': T(1500, 2300, .13, 'sine', .25, 0, [40, 120]); T(2300, 1400, .1, 'sine', .18, .12); break;          // gumowa kaczka
    case 'dzwon': for (let i = 0; i < 10; i++) M(2300, .06, .14, i * .055); break;                                     // budzik w brzuchu
    case 'bum': T(70, 40, .16, 'sine', .55); T(65, 38, .14, 'sine', .4, .2); break;                                     // bicie serca
    case 'wdech': N(.7, .25, 300, 1400, .8, 0, 'bandpass'); N(.7, .2, 1400, 300, .8, .75, 'bandpass'); break;
    case 'bulg': for (let i = 0; i < 5; i++) T(140 + Math.random() * 120, 260 + Math.random() * 200, .09, 'sine', .25, i * .1 + Math.random() * .05); break;
    case 'mysl': [1568, 2093, 2637, 3136].forEach((f, i) => T(f, f, .12, 'triangle', .1, i * .07)); break;
    case 'znalazl': T(880, 880, .1, 'triangle', .22); T(1320, 1320, .18, 'triangle', .22, .1); break;               // „!” w rentgenie
    case 'skan': T(1200, 1250, .05, 'sine', .05); break;
    case 'rtg': T(200, 900, .8, 'sawtooth', .07, 0, [6, 20]); N(.8, .15, 500, 3000, 1); break;                          // włączenie rentgena
    case 'chrup': N(.08, .5, 2500, 900, 2); T(180, 90, .15, 'square', .2, .03); T(900, 1500, .1, 'sine', .2, .12); break;   // kość wskakuje na miejsce
    case 'gips': N(.35, .45, 900, 200, .8, 0, 'lowpass'); T(300, 200, .2, 'sine', .15, .05); break;
    case 'stuk': T(520, 480, .06, 'triangle', .3); N(.03, .25, 2500, 1500, 3); break;                                    // krąg na miejscu
    case 'krok': T(90, 50, .1, 'sine', .25); N(.06, .15, 400, 150, 1, 0, 'lowpass'); break;
    case 'krok_slon': T(60, 32, .25, 'sine', .55); N(.15, .35, 300, 80, 1, 0, 'lowpass'); break;
    case 'trab': T(380, 720, .25, 'sawtooth', .22, 0, [7, 25]); T(720, 520, .55, 'sawtooth', .22, .25, [6, 30]); N(.7, .1, 2000, 1200, 2); break;   // trąbienie słonia
    case 'mruk': T(140, 110, .5, 'sine', .3, 0, [5, 6]); T(280, 220, .5, 'triangle', .08); break;                       // żyrafa mruczy
    case 'pingwin': for (const d of [0, .22]) T(620, 880, .16, 'sawtooth', .14, d, [28, 50]); T(900, 500, .3, 'sawtooth', .12, .45, [20, 40]); break;   // kwaa-kwaa-kwaaa
    case 'ryk': T(170, 120, .55, 'sawtooth', .22, 0, [9, 14]); T(85, 60, .55, 'square', .1, 0, [9, 10]); N(.5, .2, 900, 300, 1, 0, 'lowpass'); T(260, 180, .25, 'sawtooth', .12, .45, [12, 20]); break;   // tygrys: rrrau!
    case 'ryk_lew': T(120, 80, .9, 'sawtooth', .26, 0, [7, 18]); T(60, 42, .9, 'square', .12, 0, [7, 12]); N(.8, .25, 700, 200, 1, 0, 'lowpass'); break;   // lew: ROOAAR!
    case 'skok': T(900, 1800, .07, 'sine', .14); break;                                                                    // pchła skacze
    case 'zlap': T(1200, 600, .08, 'square', .12); T(1500, 2000, .1, 'sine', .2, .06); break;                            // złapana pchła
    case 'syrop': for (let i = 0; i < 3; i++) T(400 + i * 120, 250 + i * 100, .12, 'sine', .2, i * .12); break;          // glu-glu-glu
    case 'czlap': N(.08, .3, 1500, 600, 2); T(220, 120, .06, 'sine', .15); break;                                      // płetwa o podłogę
    case 'mniam': [0, .16, .32].forEach(d => { T(300, 520, .1, 'sine', .25, d); N(.05, .15, 1500, 800, 3, d + .05); }); T(523, 1047, .3, 'triangle', .14, .5); break;
    case 'prrt': T(95, 70, .7, 'sawtooth', .3, 0, [22, 18]); N(.7, .35, 500, 160, 1, 0, 'lowpass'); T(140, 210, .18, 'square', .1, .55, [30, 25]); break;   // PRRT!
    case 'chlup': N(.25, .35, 1400, 400, 1.5); T(500, 180, .18, 'sine', .22, .05); T(700, 300, .14, 'sine', .15, .2); break;
    case 'plum': T(300, 900, .15, 'sine', .3); break;
    case 'lad': T(160, 80, .12, 'sine', .3); M(400, .15, .1); break;
    case 'oj': T(500, 300, .25, 'sine', .2, 0, [8, 30]); break;
    case 'sukces': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => T(f, f, .2, 'triangle', .18, i * .11)); break;
    case 'gwiazda': [1047, 1319, 1568, 2093].forEach((f, i) => T(f, f, .16, 'triangle', .16, i * .05)); break;
  }
}

/* --- lektor: polski głos przeglądarki (na każdym telefonie brzmi trochę inaczej) --- */
let MOWA_GLOS = null;
function mowGlos() {
  if (!window.speechSynthesis) return null;
  const v = speechSynthesis.getVoices().filter(v => /^pl/i.test(v.lang));
  return v.find(v => /zosia|ewa|paulina|female|kobie/i.test(v.name)) || v[0] || null;
}
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { MOWA_GLOS = mowGlos(); };
function mow(txt, napis = true) {
  if (napis) { const el = document.getElementById('napis'); el.textContent = txt; el.classList.add('on'); clearTimeout(mow.t); mow.t = setTimeout(() => el.classList.remove('on'), 3200); }
  if (!AUD.on || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'pl-PL'; u.rate = 1.12; u.pitch = 1.15;
    MOWA_GLOS = MOWA_GLOS || mowGlos(); if (MOWA_GLOS) u.voice = MOWA_GLOS;
    speechSynthesis.speak(u);
  } catch (e) {}
}
