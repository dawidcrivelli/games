// Szum wartości 2D: hash2(x, y) → [0, 1), vnoise(x, y) — gładki szum (plamy na łące, piasek, fale).
'use strict';
const hash2 = (x, y) => { const s = Math.sin(x*127.1 + y*311.7)*43758.5453; return s - Math.floor(s); };
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a)*u + (c - a)*v + (a - b - c + d)*u*v; }
