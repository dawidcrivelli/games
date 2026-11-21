// Pomocniki 3D z modułu ZOO (models/animals.js) jako nazwy globalne — styl „słodziaków”: Pralnia, Arka, Piraci, Klinika.
// emojiTex(emoji, tło, emoji2) — okrągła plakietka z emoji (tekstura); M(kolor, opcje) → materiał, mesh(geo, mat, rodzic, x, y, z, sx, sy, sz), ball, box, cg (sklejanie), grp, G (wspólne geometrie)…
// Ładuj po models/animals.js. Konflikt nazw z lib/3d/shapes.js (inne mesh/box, M = paleta) — nie ładować obu naraz.
'use strict';
const { rnd, pick, V, canvasTex, M, MT, cg, G, mesh, ball, box, grp, merge, flat, mergeC, mW, mK, MV, MK } = ZOO;
const emojiTex=(em,bg,em2)=>canvasTex(128,128,(g)=>{g.fillStyle=bg;g.beginPath();g.arc(64,64,62,0,7);g.fill();g.lineWidth=7;g.strokeStyle='#fff';g.stroke();g.textAlign='center';g.textBaseline='middle';g.font='70px serif';g.fillText(em,64,em2?58:70);if(em2){g.font='38px serif';g.fillText(em2,98,100);}});
