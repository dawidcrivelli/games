// Ludzie: makeFarmer(ręka w górze) — rolnik/kierowca w kapeluszu; pedGroup, pedMats — piesi na chodniku.
// wymaga: lib/3d/three.js, lib/3d/shapes.js; od gry: paleta M
'use strict';
function makeFarmer(armUp) {
  const g = new T.Group(), u = armUp || .6;
  box(.42, .5, .26, M.shirt, 0, .3, 0, g); box(.43, .1, .27, M.pants, 0, .05, 0, g);
  box(.05, .46, .02, M.pants, -.1, .32, .135, g); box(.05, .46, .02, M.pants, .1, .32, .135, g);          // szelki
  mesh(new T.SphereGeometry(.16, 14, 10), M.skin, 0, .72, 0, g); mesh(new T.SphereGeometry(.035, 8, 6), M.skin, 0, .7, .16, g);
  [-.06, .06].forEach(x => mesh(new T.SphereGeometry(.022, 6, 5), M.dark, x, .75, .145, g));
  box(.15, .03, .04, M.hair, 0, .655, .15, g);                                                           // wąsy
  cylY(.3, .03, M.hat, 0, .84, 0, g, 16); cylY(.16, .13, M.hat, 0, .91, 0, g, 12); cylY(.165, .03, M.flagR, 0, .87, 0, g, 12);
  [-.25, .25].forEach(x => { const a = box(.1, .1, .46, M.shirt, x, .45 + Math.sin(u)*.23, Math.cos(u)*.23, g); a.rotation.x = -u;
    mesh(new T.SphereGeometry(.06, 8, 6), M.skin, x*.9, .45 + Math.sin(u)*.48, Math.cos(u)*.48, g); });
  [-.11, .11].forEach(x => { box(.16, .14, .45, M.pants, x, .02, .2, g); box(.14, .4, .14, M.pants, x, -.2, .42, g); box(.15, .1, .27, M.boot, x, -.42, .47, g); });
  return bake(g);
}
function pedGroup(body, skin, pants, hair) { const g = new T.Group(); cone(.24, .17, .68, body, 0, .74, 0, g, 8); mesh(new T.SphereGeometry(.2, 10, 8), skin, 0, 1.3, 0, g); const hh = mesh(new T.SphereGeometry(.215, 10, 6, 0, 6.3, 0, 1.5), hair, 0, 1.33, -.02, g);
  [-.1, .1].forEach(x => { box(.14, .42, .16, pants, x, .22, 0, g); box(.15, .08, .26, hair, x, .04, .04, g); const a = box(.1, .5, .12, body, x*3, .8, 0, g); a.rotation.z = x*2; ell(.065, .065, .065, skin, x*3.6, .56, 0, g, 6); }); [-.07, .07].forEach(x => ell(.025, .03, .02, hair, x, 1.33, .19, g, 5)); return g; }
const pedMats = c => bake(pedGroup(lam(c), M.skin, M.pants, M.hair));
