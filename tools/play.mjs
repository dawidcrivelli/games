// Gameplay smoke test: opens each game, presses start, drives a few seconds, reports JS errors,
// saves shots/<id>.jpg (launcher tile). External games from gry.json: screenshot only.
// Usage: node tools/play.mjs [--orig|--dist] [id...]   --orig/--dist: test <dir>/<game>.html, shots to tmp/.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { launch, newPage, saveJpeg } from './chrome.mjs';
import { GAMES } from './analyze.mjs';

const TILE_W = 640;
const URL_OF = Object.fromEntries(JSON.parse(fs.readFileSync('gry.json', 'utf8')).map(g => [g.id, g.url]));

const PORT = 8767, PLAY_MS = 4000, VIEW = { width: 960, height: 600 };
const START = { ciuchcia: '#bGo', taxi: '#bGo', zniwa: '#bGo', pralnia: '#bPlay', arka: '#bKid', rafa: '#bGo', piraci: '#bKid', 'zle-owoce': '#play', bryki: '#bGo', klinika: '#pick button', ogrodek: '#bGo' };
const args = process.argv.slice(2), orig = ['--orig', '--dist'].find(f => args.includes(f))?.slice(2);
const ids = args.filter(a => !a.startsWith('--'));
const games = ids.length ? ids : orig ? GAMES : Object.keys(URL_OF);

fs.mkdirSync('tmp', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', PORT], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const browser = await launch(['--autoplay-policy=no-user-gesture-required']);
let fail = 0;
for (const g of games) {
  const page = await newPage(browser), errs = [];
  await page.setViewport(VIEW);
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errs.push(m.text()));
  page.on('response', r => r.status() >= 400 && !r.url().endsWith('favicon.ico') && errs.push(`${r.status()} ${r.url()}`));
  await page.goto(URL_OF[g] ?? `http://localhost:${PORT}/${orig ? `${orig}/${g}.html` : `${g}/`}`, { waitUntil: 'load' });
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {});   // networkidle0 hangs with request interception
  await new Promise(r => setTimeout(r, PLAY_MS / 4));
  if (START[g]) {
    await page.click(START[g]).catch(e => errs.push('start: ' + e.message));
    // Drive: hold forward, tap the 3D view
    await page.keyboard.down('ArrowUp');
    await page.mouse.click(VIEW.width / 2, VIEW.height * 0.6);
    await new Promise(r => setTimeout(r, PLAY_MS));
    await page.keyboard.up('ArrowUp');
  }
  const png = `tmp/${orig ? orig + '-' : ''}${g}.png`;
  await page.screenshot({ path: png });
  if (!orig) await saveJpeg(browser, png, `shots/${g}.jpg`, TILE_W);
  console.log(errs.length ? '✗' : '✓', g, errs.slice(0, 3).join(' | '));
  fail ||= errs.length;
  await page.close();
}
await browser.close(); srv.kill();
process.exit(fail ? 1 : 0);
