// ludzie — wspólne dla: taxi
// wymaga z gry: M, T
'use strict';
function pedGroup(body, skin, pants, hair) { const g = new T.Group(); cone(.24, .17, .68, body, 0, .74, 0, g, 8); mesh(new T.SphereGeometry(.2, 10, 8), skin, 0, 1.3, 0, g); const hh = mesh(new T.SphereGeometry(.215, 10, 6, 0, 6.3, 0, 1.5), hair, 0, 1.33, -.02, g);
  [-.1, .1].forEach(x => { box(.14, .42, .16, pants, x, .22, 0, g); box(.15, .08, .26, hair, x, .04, .04, g); const a = box(.1, .5, .12, body, x*3, .8, 0, g); a.rotation.z = x*2; ell(.065, .065, .065, skin, x*3.6, .56, 0, g, 6); }); [-.07, .07].forEach(x => ell(.025, .03, .02, hair, x, 1.33, .19, g, 5)); return g; }
const pedMats = c => bake(pedGroup(lam(c), M.skin, M.pants, M.hair));
