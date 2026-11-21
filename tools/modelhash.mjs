// Fingerprint of every gallery model (geometry, materials, transforms) — to prove a refactor or a merge of two
// model variants changed nothing. Usage:
//   node tools/modelhash.mjs [--root DIR] > a.json      (DIR: another checkout, e.g. a git worktree of an older commit)
//   node tools/modelhash.mjs --diff a.json b.json        → models whose fingerprint differs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { launch, newPage } from './chrome.mjs';

const args = process.argv.slice(2);
if (args[0] === '--diff') {
  const [a, b] = args.slice(1).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  let n = 0;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) { n++; console.log('≠', k, a[k] ?? '—', b[k] ?? '—'); }
  console.log(`${Object.keys(b).length} modeli, różnych: ${n}`);
  process.exit(n ? 1 : 0);
}
const root = args.includes('--root') ? args[args.indexOf('--root') + 1] : '.';
const PORT = 8771;
const srv = spawn('python3', ['-m', 'http.server', PORT], { stdio: 'ignore', cwd: root });
await new Promise(r => setTimeout(r, 800));
const browser = await launch();
const page = await newPage(browser);
// stałe ziarno Math.random w każdej ramce: modele z losowymi detalami też są porównywalne
await page.evaluateOnNewDocument(() => { let s = 1234567; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; });
await page.goto(`http://localhost:${PORT}/galeria/`);
await page.waitForFunction(() => /modeli/.test(document.getElementById('st').textContent), { timeout: 180000 });
const out = await page.evaluate(() => {
  const r = x => Math.round(x * 1000) / 1000;
  const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  const res = {};
  for (const m of MODELE) {
    const key = `${m.kat}|${m.typ}|${m.gra}|${m.js}`;
    if (!m.view) { res[key] = 'brak: ' + (m.err || '?'); continue; }
    const parts = [];
    m.view.pivot.updateMatrixWorld(true);
    m.view.pivot.traverse(o => {
      if (!o.isMesh && !o.isPoints && !o.isLine) return;
      const g = o.geometry, p = g.attributes.position.array; let s = 0;
      for (let i = 0; i < p.length; i++) s += p[i] * ((i % 7) + 1);
      const mats = [].concat(o.material).map(t => [t.type, t.color ? t.color.getHexString() : '', t.emissive ? t.emissive.getHexString() : '', r(t.opacity), t.map ? 'map' : '', t.vertexColors ? 'vc' : ''].join(':'));
      parts.push([p.length, r(s), g.index ? g.index.count : 0, o.count || 1, mats.join(','), o.matrixWorld.elements.map(r).join(',')].join(';'));
    });
    res[key] = fnv(parts.join('|')) + ` (${parts.length} siatek)`;
  }
  return res;
});
console.log(JSON.stringify(out, null, 1));
await browser.close(); srv.kill();
