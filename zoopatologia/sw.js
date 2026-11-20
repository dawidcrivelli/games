/* Offline: pliki gry z pamięci podręcznej, w tle odświeżane z sieci (stale-while-revalidate).
   Zmień VERSION przy wydaniu, żeby wyczyścić stare pliki. */
const VERSION = 'zoopat-v1';
const CORE = ["./", "index.html", "css/app.css", "js/stale.js", "js/stan.js", "js/siatka.js", "js/ruch.js", "js/dzwiek.js", "js/mapa_statyczna_2.js", "js/rysowanie_pikseli.js", "js/budynki_z_zewnatrz.js", "js/budynki_przekroj_z.js", "js/portrety.js", "js/wiadomosci.js", "js/choroby.js", "js/rozmnazanie_i_hybrydy.js", "js/zwierzeta.js", "js/budynki_logika.js", "js/badania.js", "js/goscie.js", "js/personel.js", "js/zdarzenia.js", "js/petla.js", "js/kamera_i_render.js", "js/wejscie_dotykowe.js", "js/panele.js", "js/hud.js", "js/kampania_i_modal.js", "js/zapis.js", "js/start.js", "manifest.json", "icon.svg"];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
