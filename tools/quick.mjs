// Szybki test gry w headless Chrome bez GPU: otwiera <gra>/?test (gra bez pętli rAF — logikę liczy TEST.step, obraz TEST.render),
// wykonuje kod JS w stronie (ciało funkcji async, wynik `return` wypisuje), robi zrzut i zgłasza błędy JS / 404.
// Klatka w SwiftShader kosztuje ~1 s, więc gra w trybie ?test symuluje sekundy bez rysowania i rysuje tylko na zrzut: cały dzień gry w ~3 s.
// Użycie: node tools/quick.mjs <gra> "<js>" [zrzut.png] [szer wys] [--q "parametry"]
//   np. node tools/quick.mjs ogrodek "TEST.startGame(0); TEST.step(30); TEST.render(); return TEST.G.basket" tmp/a.png 986 388
// Kontrakt gry (opcjonalny): ?test → window.TEST = { step(s), render(), …własne }; bez ?test gra działa normalnie.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { launch, newPage } from './chrome.mjs';

const args = process.argv.slice(2), qi = args.indexOf('--q'), extra = qi >= 0 ? args.splice(qi, 2)[1] : '';
const [game, js = 'TEST.render(); return 1', out = `tmp/${args[0]}-quick.png`, W = 986, H = 444] = args;
if (!game) { console.log('node tools/quick.mjs <gra> "<js>" [zrzut.png] [szer wys] [--q "a=1&b=2"]'); process.exit(1); }
const PORT = 8793, t0 = Date.now(), lg = m => console.log(((Date.now() - t0)/1000).toFixed(1) + 's', m);
fs.mkdirSync('tmp', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', PORT], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));
const b = await launch(['--autoplay-policy=no-user-gesture-required']);
const p = await newPage(b); await p.setViewport({ width: +W, height: +H });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text()) && errs.push(m.text()));
p.on('response', r => r.status() >= 400 && !r.url().endsWith('favicon.ico') && errs.push(r.status() + ' ' + r.url()));
await p.goto(`http://localhost:${PORT}/${game}/?test${extra ? '&' + extra : ''}`, { waitUntil: 'load' });
await p.waitForFunction(() => window.TEST, { timeout: 30000 }).catch(() => errs.push('brak window.TEST (gra nie obsługuje ?test?)'));
lg('gotowe');
const res = await p.evaluate(async s => { try { return await eval('(async () => {' + s + '})()'); } catch (e) { return 'BŁĄD ' + e.stack; } }, js);
lg('wynik: ' + JSON.stringify(res));
await p.screenshot({ path: out }); lg('zrzut: ' + out);
console.log(errs.length ? '✗ ' + errs.slice(0, 6).join(' | ') : '✓ bez błędów');
await b.close(); srv.kill();
process.exit(errs.length || /^BŁĄD/.test(String(res)) ? 1 : 0);
