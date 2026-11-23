// Ekran telefonu: goFS() — pełny ekran; obrotInit({ pion }) — plansza „Obróć telefon poziomo/pionowo” + pełny ekran
// i blokada orientacji przy pierwszym dotknięciu (tylko ekrany dotykowe). Wywołaj obrotInit() na końcu <body>.
// obrotUstaw({ pion | oba }) — zmiana orientacji w trakcie gry (np. menu w obu, tryb w pionie); obrotZly() — plansza teraz widoczna?
'use strict';
function goFS(){const el=document.documentElement,f=el.requestFullscreen||el.webkitRequestFullscreen;if(f&&!document.fullscreenElement&&!document.webkitFullscreenElement){try{const p=f.call(el,{navigationUI:'hide'});if(p&&p.catch)p.catch(()=>{});}catch(e){}}
  try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(()=>{});}catch(e){}}
// Obróć telefon poziomo (albo pionowo) + pełny ekran — wspólne dla gier 3D (wzór: Egzorcysta vs Chołota).
// Telefon trzymany „źle”: ciemna plansza, żółty zarys telefonu obraca się do właściwej pozycji, napis „Obróć telefon poziomo/pionowo”.
// Pierwsze dotknięcie (i dotknięcie planszy): pełny ekran i blokada orientacji, tylko na ekranach dotykowych.
// Użycie: <script src="../lib/obrot….js"></script><script>obrotInit()</script> na końcu <body>; gra pionowa: obrotInit({ pion: true }).
// opt.maxW / opt.maxH: do jakiej szerokości (poziomo) / wysokości (pionowo) ekranu to telefon — komputer nie dostaje planszy.
// opt.oba: obie orientacje — bez planszy i bez blokady (np. menu gry, w której tryby mają różne orientacje).
function obrotInit(opt = {}) {
  if (document.getElementById('obrot')) return;
  const css = document.createElement('style'); css.id = 'obrotCss';
  document.head.append(css);
  const d = document.createElement('div'); d.id = 'obrot';
  document.body.append(d);
  d.addEventListener('pointerdown', obrotPelny);
  addEventListener('pointerdown', obrotPelny, { once: true, capture: true });
  obrotUstaw(opt);
}
// Zmiana wymaganej orientacji w trakcie gry: obrotUstaw({ pion: true }) / obrotUstaw({}) / obrotUstaw({ oba: true }).
// Plansza i napis od razu; w pełnym ekranie (dotyk) blokada nowej orientacji, przy { oba } zdjęcie blokady.
function obrotUstaw(opt = {}) {
  const css = document.getElementById('obrotCss'), d = document.getElementById('obrot'); if (!css) return obrotInit(opt);
  obrotInit.opt = opt;
  css.textContent = `#obrot{position:fixed;inset:0;z-index:99999;background:#1d140b;color:#ffd66a;display:none;flex-direction:column;align-items:center;justify-content:center;gap:34px;
  font:900 22px/1.2 "Baloo 2","Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif;text-align:center;padding:20px;touch-action:none;user-select:none;-webkit-user-select:none}
#obrot i{display:block;width:66px;height:114px;border:6px solid #ffd66a;border-radius:13px;box-sizing:border-box;animation:obrot 3.14s ease-in-out infinite}
@keyframes obrot{0%,100%{transform:rotate(0)}50%{transform:rotate(-57deg)}}
@keyframes obrotP{0%,100%{transform:rotate(-90deg)}50%{transform:rotate(-33deg)}}
${opt.oba ? '' : opt.pion ? `#obrot i{animation-name:obrotP}
@media (orientation:landscape) and (max-height:${opt.maxH || 500}px){#obrot{display:flex}}`
    : `@media (orientation:portrait) and (max-width:${opt.maxW || 700}px){#obrot{display:flex}}`}`;
  d.innerHTML = `<i></i><div>Obróć telefon ${opt.pion ? 'pionowo' : 'poziomo'}</div>`;
  const kier = opt.oba ? null : opt.pion ? 'portrait' : 'landscape';
  try { const o = screen.orientation, fs = document.fullscreenElement || document.webkitFullscreenElement; if (fs && o && !kier && o.unlock) o.unlock(); if (kier && o && o.lock && fs) o.lock(kier).catch(() => {}); } catch (e) {}
}
// Czy plansza „Obróć telefon” jest teraz na ekranie (gra może wtedy wstrzymać odliczanie)
function obrotZly() { const d = document.getElementById('obrot'); return !!d && getComputedStyle(d).display !== 'none'; }
function obrotPelny() {
  if (!matchMedia('(pointer:coarse)').matches) return;
  const opt = obrotInit.opt || {}, kier = opt.oba ? null : opt.pion ? 'portrait' : 'landscape';
  try {
    const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
    if (rq && !(document.fullscreenElement || document.webkitFullscreenElement)) {
      const p = rq.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(() => { try { const o = screen.orientation; if (kier && o && o.lock) o.lock(kier).catch(() => {}); } catch (e) {} }).catch(() => {});
    }
  } catch (e) {}
}
