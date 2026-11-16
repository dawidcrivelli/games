// Gameplay smoke test: opens each game, presses start, drives a few seconds, reports JS errors,
// saves a screenshot (launcher tile). Usage: node tools/play.mjs [--orig] [game...]
// --orig tests orig/<game>.html (baseline) and writes shots to tmp/.
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { GAMES } from './analyze.mjs';

const PORT = 8767, PLAY_MS = 4000, VIEW = { width: 960, height: 600 };
const START = { ciuchcia: '#bGo', taxi: '#bGo', zniwa: '#bGo', pralnia: '#bPlay', arka: '#bKid', rafa: '#bGo' };
const args = process.argv.slice(2), orig = args.includes('--orig');
const games = args.filter(a => !a.startsWith('--')).length ? args.filter(a => !a.startsWith('--')) : GAMES;

const srv = spawn('python3', ['-m', 'http.server', PORT], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
let fail = 0;
for (const g of games) {
  const page = await browser.newPage(), errs = [];
  await page.setViewport(VIEW);
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errs.push(m.text()));
  page.on('response', r => r.status() >= 400 && !r.url().endsWith('favicon.ico') && errs.push(`${r.status()} ${r.url()}`));
  await page.goto(`http://localhost:${PORT}/${orig ? `orig/${g}.html` : `${g}/`}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.click(START[g]).catch(e => errs.push('start: ' + e.message));
  // Drive: hold forward, tap the 3D view
  await page.keyboard.down('ArrowUp');
  await page.mouse.click(VIEW.width / 2, VIEW.height * 0.6);
  await new Promise(r => setTimeout(r, PLAY_MS));
  await page.keyboard.up('ArrowUp');
  await page.screenshot({ path: `${orig ? 'tmp/orig-' : 'shots/'}${g}.png` });
  console.log(errs.length ? '✗' : '✓', g, errs.slice(0, 3).join(' | '));
  fail ||= errs.length;
  await page.close();
}
await browser.close(); srv.kill();
process.exit(fail ? 1 : 0);
