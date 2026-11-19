// Shared headless browser for tools: finds Chrome on macOS / Linux, serves three.js r128 from
// node_modules when the CDN is unreachable (offline, sandbox), saves JPEG tiles without `sips`.
// Override the browser with CHROME=/path/to/chrome.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/opt/pw-browsers/chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);
const THREE_CDN = /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js$/;
const THREE_LOCAL = 'node_modules/three/build/three.min.js';      // npm i (devDependency three@0.128.0)

export function chromePath() {
  const p = CANDIDATES.find(c => fs.existsSync(c));
  if (!p) throw new Error('Nie znaleziono Chrome; ustaw CHROME=/ścieżka/do/chrome');
  return p;
}

export async function launch(extraArgs = []) {
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...extraArgs];
  if (process.platform === 'linux') args.push('--no-sandbox');
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;     // sandboxed sessions: Chrome ignores the env var
  if (proxy) args.push('--proxy-server=' + proxy);
  return puppeteer.launch({ executablePath: chromePath(), args });
}

// New page with local three.js fallback
export async function newPage(browser) {
  const page = await browser.newPage();
  if (fs.existsSync(THREE_LOCAL)) {
    await page.setRequestInterception(true);
    page.on('request', r => THREE_CDN.test(r.url())
      ? r.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(THREE_LOCAL) })
      : r.continue());
  }
  return page;
}

// Resize a PNG to `width` and save as JPEG, using the browser itself (no sips / ImageMagick)
export async function saveJpeg(browser, png, out, width, quality = .75) {
  const page = await browser.newPage();
  const b64 = await page.evaluate(async (src, w, q) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = Object.assign(document.createElement('canvas'), { width: w, height: Math.round(img.height * w / img.width) });
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q).split(',')[1];
  }, 'data:image/png;base64,' + fs.readFileSync(png).toString('base64'), width, quality);
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  await page.close();
}
