'use strict';
// Narty — kształt stoku i rozmieszczenie rzeczy na trasie (same dane i funkcje: bez DOM, bez sceny; losowanie z ziarna z lib/common/random.js).
// courseBuild(ziarno) → CRS = { L, ramps, obst, fish, trees, goals }; potem centerX(s), terrainY(s, x), groundY(s, x) (teren + skocznie).
// Układ: zjazd idzie w stronę +z (s = z), x w bok; oś trasy to centerX(s). Wysokość mierzona od Y0 (nigdy poniżej ~10 m — cząsteczki).
// wymaga: lib/common/math.js (clamp), lib/common/random.js (seed, rnd, rr)
const COURSE = { L: 1000, W: 11, HALF: 50, STEP: 2, RUNOUT: 40 };
let CRS = null;
const ss = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };

function centerX(s) {
  const L = COURSE.L, k = ss(0, 80, s)*(1 - ss(L - 230, L - 90, s));
  return k*(Math.sin(s/105)*15 + Math.sin(s/47 + 1.3)*4);
}
// nachylenie stoku: łagodne, potem wypłaszczenie na mecie; baseY[i] = wysokość na s = i metrów
const slopeAt = s => (0.30 + 0.06*Math.sin(s/140))*(1 - ss(COURSE.L - 150, COURSE.L - 50, s));
function baseAt(s) {
  const b = CRS.base, n = b.length - 1;
  if (s <= 0) return b[0] - slopeAt(0)*s;                // za startem teren się wznosi
  if (s >= n) return b[n];
  const i = s | 0, f = s - i; return b[i] + (b[i + 1] - b[i])*f;
}
const bankAt = dx => { const e = Math.max(0, Math.abs(dx) - COURSE.W); return .45*e + .012*e*e; };
const bumpAt = (s, x) => .16*Math.sin(s*.31 + x*.2)*Math.sin(s*.13 - x*.17) + .3*Math.sin(s/17 + x/9)*ss(30, 90, s)*(1 - ss(COURSE.L - 140, COURSE.L - 60, s));
const terrainY = (s, x) => baseAt(s) + bumpAt(s, x) + bankAt(x - centerX(s));
function rampLift(s, x) {
  let h = 0;
  for (const r of CRS.ramps) {
    if (s < r.s0 || s > r.s0 + r.len) continue;
    const wk = clamp((r.wid/2 - Math.abs(x - r.x))/.6, 0, 1); if (!wk) continue;
    h = Math.max(h, r.h*((s - r.s0)/r.len)*wk);
  }
  return h;
}
const groundY = (s, x) => terrainY(s, x) + rampLift(s, x);

function courseBuild(sd) {
  seed = sd|0 || 1; const L = COURSE.L;
  const base = new Float32Array(L + 2); let y = 0; for (let i = 0; i <= L + 1; i++) { base[i] = y; y -= slopeAt(i); }
  const Y0 = 14 - base[L + 1]; for (let i = 0; i <= L + 1; i++) base[i] += Y0;
  CRS = { L, base, ramps: [], obst: [], fish: [], trees: [], seed: sd };
  // skocznie: pierwsza wcześnie, potem co 150–200 m
  for (let s = 150; s < L - 200; s += rr(150, 200)) CRS.ramps.push({ s0: s, x: centerX(s) + rr(-5, 5), len: 5, wid: 4.4, h: 2.3 });
  const nearRamp = (s, x) => CRS.ramps.some(r => s > r.s0 - 10 && s < r.s0 + r.len + 14 && Math.abs(x - r.x) < 5.5);
  // przeszkody: drzewa, kamienie, bałwany — w każdym rzędzie zostaje szeroki wolny pas
  for (let s = 55; s < L - 75; s += rr(10, 18)) {
    const n = rnd() < .45 ? 2 : 1; let dx = rr(-8.5, 8.5);
    for (let k = 0; k < n; k++) {
      const x = centerX(s) + dx, q = rnd(), kind = q < .5 ? 'tree' : q < .78 ? 'rock' : 'snowman';
      if (!nearRamp(s, x)) CRS.obst.push({ k: kind, s, x, r: kind === 'tree' ? .85 : .8, sc: kind === 'tree' ? rr(.6, .85) : rr(.85, 1.25), a: rr(0, TAU), hit: false });
      dx += (dx > 0 ? -1 : 1)*rr(5.5, 9);
      if (Math.abs(dx) > 9) break;
    }
  }
  // rybki: szlaczki po zakosach, a nad skoczniami łuk w powietrzu
  const clash = (s, x) => CRS.obst.some(o => Math.hypot(o.s - s, o.x - x) < o.r + 1.5);
  for (let s0 = 75; s0 < L - 90; s0 += rr(55, 75)) {
    let d0 = rr(-6, 6); if (nearRamp(s0, centerX(s0) + d0)) continue;
    for (let i = 0; i < 5; i++) {
      const s = s0 + i*4.2; let x = centerX(s) + clamp(d0 + Math.sin(i*.8)*2.2, -8, 8);
      if (clash(s, x)) x += x > centerX(s) ? -3.2 : 3.2;
      CRS.fish.push({ s, x, up: 1, got: false });
    }
  }
  for (const r of CRS.ramps) for (let i = 0; i < 4; i++) CRS.fish.push({ s: r.s0 + r.len + 4 + i*3.6, x: r.x, up: 2.6 + Math.sin((i + .5)/4*PI)*2, got: false });
  // drzewa tła: gęsto po bokach doliny
  for (let s = -30; s < L + 80; s += 3.1) for (const side of [-1, 1]) {
    const m = rnd() < .45 ? 2 : 1;
    for (let k = 0; k < m; k++) { const e = COURSE.W + 1.8 + rr(0, 1)**1.6*34, sc = rr(.7, 1.4) + e*.018; if (s > L - 70 && e < COURSE.W + 18 && s < L + 20) continue;
      CRS.trees.push({ s: s + rr(-1.5, 1.5), x: centerX(s) + side*e, sc, a: rr(0, TAU), c: rnd() }); }
  }
  CRS.goals = { start: 0, finish: L - COURSE.RUNOUT };
  CRS.total = CRS.fish.length;
  return CRS;
}
