// Obróć telefon poziomo + pełny ekran — wspólne dla gier 3D (wzór: Egzorcysta vs Chołota).
// Telefon w pionie: ciemna plansza, żółty zarys telefonu przechyla się do poziomu, napis „Obróć telefon poziomo”.
// Pierwsze dotknięcie (i dotknięcie planszy): pełny ekran i blokada poziomu, tylko na ekranach dotykowych.
// Użycie: <script src="../lib/obrot….js"></script><script>obrotInit()</script> na końcu <body>.
function obrotInit(opt = {}) {
  if (document.getElementById('obrot')) return;
  const css = document.createElement('style');
  css.textContent = `#obrot{position:fixed;inset:0;z-index:99999;background:#1d140b;color:#ffd66a;display:none;flex-direction:column;align-items:center;justify-content:center;gap:34px;
  font:900 22px/1.2 "Baloo 2","Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif;text-align:center;padding:20px;touch-action:none;user-select:none;-webkit-user-select:none}
#obrot i{display:block;width:66px;height:114px;border:6px solid #ffd66a;border-radius:13px;box-sizing:border-box;animation:obrot 3.14s ease-in-out infinite}
@keyframes obrot{0%,100%{transform:rotate(0)}50%{transform:rotate(-57deg)}}
@media (orientation:portrait) and (max-width:${opt.maxW || 700}px){#obrot{display:flex}}`;
  document.head.append(css);
  const d = document.createElement('div'); d.id = 'obrot'; d.innerHTML = '<i></i><div>Obróć telefon poziomo</div>';
  document.body.append(d);
  d.addEventListener('pointerdown', obrotPelny);
  addEventListener('pointerdown', obrotPelny, { once: true, capture: true });
}
function obrotPelny() {
  if (!matchMedia('(pointer:coarse)').matches) return;
  try {
    const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
    if (rq && !(document.fullscreenElement || document.webkitFullscreenElement)) {
      const p = rq.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(() => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
    }
  } catch (e) {}
}
