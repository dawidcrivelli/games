// Pomocniki 3D z modułu ZOO (models/animals.js) jako nazwy globalne — styl „słodziaków”: Pralnia, Arka, Piraci, Klinika.
// M(kolor, opcje) → materiał, mesh(geo, mat, rodzic, x, y, z, sx, sy, sz), ball, box, cg (sklejanie), grp, G (wspólne geometrie)…
// Ładuj po models/animals.js. Konflikt nazw z lib/3d/shapes.js (inne mesh/box, M = paleta) — nie ładować obu naraz.
'use strict';
const { rnd, pick, V, canvasTex, M, MT, cg, G, mesh, ball, box, grp, merge, flat, mergeC, mW, mK, MV, MK } = ZOO;
