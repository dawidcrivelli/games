// Lektor: krótkie polskie zdania mową syntetyczną przeglądarki (dla dzieci, które jeszcze nie czytają).
// lektor(tekst, { pilne }) — mówi, jeśli głos jest włączony; pilne przerywa poprzednie zdanie, zwykłe czeka w kolejce (max 2).
// lektorWl(true|false) — włącz / wyłącz (np. razem z dźwiękiem). Bez głosu polskiego — mówi domyślnym.
// wymaga: nic
'use strict';
let lektorGlos = null, lektorOn = true;
function lektorSzukaj() { if (!window.speechSynthesis) return; const v = speechSynthesis.getVoices().filter(v => /^pl/i.test(v.lang)); lektorGlos = v.find(v => /natural|google|zosia|paulina/i.test(v.name)) || v[0] || null; }
function lektorWl(on) { lektorOn = on; if (!on && window.speechSynthesis) speechSynthesis.cancel(); }
function lektor(txt, o = {}) {
  if (!lektorOn || !window.speechSynthesis) return;
  if (!lektorGlos) lektorSzukaj();
  if (o.pilne) speechSynthesis.cancel(); else if (speechSynthesis.pending) return;
  const u = new SpeechSynthesisUtterance(txt); u.lang = 'pl-PL'; if (lektorGlos) u.voice = lektorGlos; u.rate = 1.02; u.pitch = 1.15;
  speechSynthesis.speak(u);
}
