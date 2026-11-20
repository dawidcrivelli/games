// Single-file build (e.g. for a Claude artifact): inlines local <script src> and <link rel="stylesheet">
// into dist/<game>.html; drops PWA bits (manifest, icon, service worker), useless in one file.
// Usage: node tools/build.mjs [game...]   (default: all games of this repo from gry.json)
import fs from 'node:fs';

const LOCAL = /^(?!https?:)/;
const LOCAL_SCRIPT = /<script src="((?!https?:)[^"]+)"><\/script>/g;
const LOCAL_CSS = /<link rel="stylesheet" href="((?!https?:)[^"]+)">/g;
const OWN = JSON.parse(fs.readFileSync('gry.json', 'utf8')).filter(g => !g.url).map(g => g.id);
fs.mkdirSync('dist', { recursive: true });
for (const g of process.argv.slice(2).length ? process.argv.slice(2) : OWN) {
  const read = src => fs.readFileSync(`${g}/${src}`, 'utf8');
  const html = fs.readFileSync(`${g}/index.html`, 'utf8')
    .replace(LOCAL_SCRIPT, (_, src) => `<script>\n${read(src).replaceAll('</script', '<\\/script')}</script>`)
    .replace(LOCAL_CSS, (_, src) => `<style>\n${read(src)}</style>`)
    .replace(/<link rel="(manifest|icon)" href="([^"]+)">\n?/g, (m, _, href) => LOCAL.test(href) ? '' : m)
    .replace(/<script>if\('serviceWorker'.*<\/script>\n?/, '');
  fs.writeFileSync(`dist/${g}.html`, html);
  console.log(`dist/${g}.html`, html.length);
}
