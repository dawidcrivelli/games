// Gallery test: loads galeria/, waits for all models, lists build errors, screenshots each category to tmp/galeria-<kat>.png.
// Usage: node tools/galeria.mjs [kategoria…]   (bez argumentów: wszystkie)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { launch, newPage } from './chrome.mjs';

const PORT = 8769, TIMEOUT_MS = 120000;
fs.mkdirSync('tmp', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', PORT], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const browser = await launch();
const page = await newPage(browser), errs = [];
await page.setViewport({ width: 1280, height: 900 });
page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://localhost:${PORT}/galeria/`);
await page.waitForFunction(() => /modeli/.test(document.getElementById('st').textContent), { timeout: TIMEOUT_MS });
console.log(await page.$eval('#st', e => e.textContent));
for (const m of await page.evaluate(() => MODELE.filter(m => m.err).map(m => `${m.gra} ${m.js}: ${m.err}`))) console.log('✗', m);
const KATS = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => KATEGORIE.filter(k => k !== 'dźwięki'));
for (const k of KATS) {
  await page.click(`button[data-k="${k}"]`); await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `tmp/galeria-${k}.png`, fullPage: false });
}
await page.click('button[data-k="zwierzęta"]'); await page.click('.card');
await new Promise(r => setTimeout(r, 400)); await page.screenshot({ path: 'tmp/galeria-big.png' });
if (errs.length) console.log('JS:', errs.slice(0, 5).join(' | '));
await browser.close(); srv.kill();
