// Liczby: clamp(v, a, b) — przytnij do [a, b]; lerp(a, b, t) — interpolacja liniowa.
'use strict';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp=(a,b,t)=>a+(b-a)*t;
