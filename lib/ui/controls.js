// Przyciski sterowania: holdBtn(id, klucz, keys) — trzymany przycisk ustawia keys[klucz] = 1 (klasa .on);
// syncSnd(wyciszone) — ikona głośnika #sndIco.
// wymaga: $ (lib/common/dom.js)
'use strict';
function holdBtn(id, k, keys) { const b = $(id), set = x => { keys[k] = x; b.classList.toggle('on', !!x); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} set(1); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => set(0))); }
function syncSnd(muted) { $('sndIco').textContent = muted ? '🔇' : '🔊'; }
