// Single-file build (e.g. for a Claude artifact): inlines local <script src> and <link rel="stylesheet"> into dist/<game>.html.
// Usage: node tools/build.mjs [game...]
import fs from 'node:fs';
import { GAMES } from './analyze.mjs';

const LOCAL_SCRIPT = /<script src="((?!https?:)[^"]+)"><\/script>/g;
const LOCAL_CSS = /<link rel="stylesheet" href="((?!https?:)[^"]+)">/g;
fs.mkdirSync('dist', { recursive: true });
for (const g of process.argv.slice(2).length ? process.argv.slice(2) : GAMES) {
  const html = fs.readFileSync(`${g}/index.html`, 'utf8')
    .replace(LOCAL_CSS, (_, href) => `<style>\n${fs.readFileSync(`${g}/${href}`, 'utf8')}</style>`)
    .replace(LOCAL_SCRIPT, (_, src) => `<script>\n${fs.readFileSync(`${g}/${src}`, 'utf8').replaceAll('</script', '<\\/script')}</script>`);
  fs.writeFileSync(`dist/${g}.html`, html);
  console.log(`dist/${g}.html`, html.length);
}
