// Dopasowanie widoku do okna: const resize = fitView(renderer, camera); addEventListener('resize', resize)
// (rozmiar płótna bez zmiany pixelRatio, proporcje kamery).
'use strict';
function fitView(renderer, camera) {
  return function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix(); };
}
