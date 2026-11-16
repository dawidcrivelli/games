// Gallery test: loads galeria/, waits for all models, lists build errors, screenshots each category to tmp/galeria-<kat>.png.
// Usage: node tools/galeria.mjs
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const PORT = 8769, TIMEOUT_MS = 120000, KATS = ['zwierzęta', 'morze', 'ludzie', 'pojazdy', 'rolnicze', 'pociągi'];
const srv = spawn('python3', ['-m', 'http.server', PORT], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage(), errs = [];
await page.setViewport({ width: 1280, height: 900 });
page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://localhost:${PORT}/galeria/`);
await page.waitForFunction(() => /modeli/.test(document.getElementById('st').textContent), { timeout: TIMEOUT_MS });
console.log(await page.$eval('#st', e => e.textContent));
for (const m of await page.evaluate(() => MODELE.filter(m => m.err).map(m => `${m.gra} ${m.js}: ${m.err}`))) console.log('✗', m);
for (const k of KATS) {
  await page.click(`button[data-k="${k}"]`); await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `tmp/galeria-${k}.png`, fullPage: false });
}
await page.click('button[data-k="zwierzęta"]'); await page.click('.card');
await new Promise(r => setTimeout(r, 400)); await page.screenshot({ path: 'tmp/galeria-big.png' });
if (errs.length) console.log('JS:', errs.slice(0, 5).join(' | '));
await browser.close(); srv.kill();
