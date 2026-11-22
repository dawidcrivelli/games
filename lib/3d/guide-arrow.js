// Strzałka „jak w Crazy Taxi” (Taxi, Piraci): płaska, z ciemnym obrysem, zawsze na wierzchu (bez testu głębi), nad pojazdem.
// const a = guideArrow(0x35e04a); scene.add(a);  a.userData.m — materiał (kolor), a.userData.dial — część obracana do celu,
// a.userData.dial.children: [obrys, strzałka]. Ustawienie co klatkę: guideArrowAim(a, x, y, z, camHd, tx, tz, pochylenie, skala)
// — grupa obrócona jak kamera i pochylona do niej (płaska strzałka widoczna z góry), dial wskazuje cel (tx, tz).
// wymaga: lib/3d/three.js (T)
'use strict';
function guideArrow(color) {
  const s = new T.Shape(); [[0, 2.5], [1.5, .5], [.55, .5], [.55, -1.9], [-.55, -1.9], [-.55, .5], [-1.5, .5]].forEach((p, i) => { if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]); });
  const geo = new T.ExtrudeGeometry(s, { depth:.4, bevelEnabled:false }); geo.rotateX(Math.PI/2);
  const arrow = new T.Group(), m = new T.MeshBasicMaterial({ color, fog:false, depthTest:false, transparent:true }), edge = new T.MeshBasicMaterial({ color:0x1c1c1e, fog:false, depthTest:false, transparent:true });
  const dial = new T.Group(), e = new T.Mesh(geo, edge); e.scale.set(1.2, 1, 1.12); e.position.y = -.14; e.renderOrder = 9; dial.add(e); const a = new T.Mesh(geo, m); a.renderOrder = 10; dial.add(a);
  arrow.add(dial); arrow.userData.m = m; arrow.userData.dial = dial; arrow.rotation.order = 'YXZ'; arrow.visible = false; return arrow;
}
function guideArrowAim(arrow, x, y, z, camHd, tx, tz, tilt, scale) {
  arrow.position.set(x, y, z); arrow.rotation.set(tilt, camHd, 0); arrow.userData.dial.rotation.y = Math.atan2(tx - x, tz - z) - camHd; arrow.scale.setScalar(scale);
}
