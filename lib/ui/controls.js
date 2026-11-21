'use strict';
function holdBtn(id, k) { const b = $(id), set = x => { keys[k] = x; b.classList.toggle('on', !!x); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} set(1); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => set(0))); }
function syncSnd() { $('sndIco').textContent = S.muted ? '🔇' : '🔊'; }
