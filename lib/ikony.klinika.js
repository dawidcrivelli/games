// Ikony z prawdziwych modeli 3D (zamiast emoji): osobny mały renderer z przezroczystym tłem, kamera dopasowana do bryły.
// ikonaModelu(obiekt, {ry, rx, rz}) → dataURL PNG 160×160 (widać warstwę 0 = zwykły wygląd; rentgen pomijany)
// SVG_IKONY: proste rysunki przycisków sterujących (dom, głośnik, dalej)
// wymaga: THREE

function ikonaModelu(obj, o = {}) {
  const S = 160, R = ikonaModelu.r || (ikonaModelu.r = (() => {
    const c = document.createElement('canvas'); c.width = c.height = S;
    const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(S, S, false); r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene(), d = new THREE.DirectionalLight(0xfff3d6, .85);
    d.position.set(3, 6, 8); sc.add(new THREE.HemisphereLight(0xffffff, 0xb08a5a, .8), d);
    return { r, sc, c, cam: new THREE.PerspectiveCamera(26, 1, .01, 500) };
  })());
  const g = new THREE.Group(); g.add(obj); g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); R.sc.add(g); g.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
  const dist = Math.max(s.x, s.y) * .5 * 1.12 / Math.tan(13 * Math.PI / 180) + s.z * .5;
  R.cam.position.set(c.x, c.y, c.z + dist); R.cam.near = dist / 50; R.cam.far = dist * 4; R.cam.updateProjectionMatrix(); R.cam.lookAt(c);
  R.r.render(R.sc, R.cam); const url = R.c.toDataURL('image/png');
  R.sc.remove(g); return url;
}
const SVG_IKONY = {
  dom: '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z" fill="#ff7e5f" stroke="#3a2412" stroke-width="1.7" stroke-linejoin="round"/><rect x="10" y="15" width="4" height="6" fill="#fff3d6"/></svg>',
  glos: '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#35c2a1" stroke="#3a2412" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 8.5q2.5 3.5 0 7M18.5 6q4.5 6 0 12" fill="none" stroke="#3a2412" stroke-width="1.8" stroke-linecap="round"/></svg>',
  cisza: '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#b0bec5" stroke="#3a2412" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 9l5 6M21 9l-5 6" stroke="#e8574a" stroke-width="2.2" stroke-linecap="round"/></svg>',
  dalej: '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M3 9h10V4l8 8-8 8v-5H3z" fill="#fff" stroke="#9c2a18" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};
