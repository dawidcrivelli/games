// Komiksowy napis w gwieździe (CSS .bub z lib/ui/comic.css) w punkcie ekranu X, Y; znika sam
const KOMIKS_KOLORY = ['#ffd23f', '#ff4d3a', '#3ad1ff', '#ff7ae0', '#7dff6a'];
function komiksDymek(par, txt, X, Y, cls = '', col) {
  const d = document.createElement('div');
  d.className = 'bub ' + cls; d.innerHTML = `<i></i><b>${txt}</b>`;
  d.style.cssText = `left:${X}px;top:${Y}px;--c:${col || KOMIKS_KOLORY[Math.random() * KOMIKS_KOLORY.length | 0]};--r:${(Math.random() * 28 - 14).toFixed(0)}deg`;
  par.append(d); setTimeout(() => d.remove(), 1050); return d;
}
