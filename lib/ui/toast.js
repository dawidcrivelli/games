// Krótki komunikat: toast(tekst, ms = 3200) — wstawia tekst do #toast i dodaje klasę .show na ms milisekund
// (wygląd i animacja .show w CSS gry).
// wymaga: $ (lib/common/dom.js)
'use strict';
let toastT = 0;
function toast(msg, ms = 3200) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
