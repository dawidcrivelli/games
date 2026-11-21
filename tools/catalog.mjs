// README catalog of shared files: lib/**, models/** — lines, games that load them (from <script> tags), description
// (first header comment line). Rewrites the part of README.md between the KATALOG markers.
// Usage: node tools/catalog.mjs        (run after adding / changing a shared file or a game's <script> list)
import fs from 'node:fs';
import { OWN_GAMES, scriptsOf } from './code.mjs';

const START = '<!-- KATALOG: node tools/catalog.mjs -->', END = '<!-- /KATALOG -->';
const users = {};
for (const g of OWN_GAMES) {
  for (const f of scriptsOf(g)) (users[f] ??= []).push(g);
  for (const [, href] of fs.readFileSync(`${g}/index.html`, 'utf8').matchAll(/<link rel="stylesheet" href="\.\.\/([^"]+)"/g)) (users[href] ??= []).push(g);
}
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? files(`${dir}/${d.name}`) : [`${dir}/${d.name}`]);
const rows = ['| plik | linie | gry | co zawiera |', '|---|---|---|---|'];
for (const f of [...files('lib'), ...files('models')].filter(f => /\.(js|css)$/.test(f)).sort()) {
  const src = fs.readFileSync(f, 'utf8'), desc = (src.match(/^(?:\/\/|\/\*) ?(.*)/) ?? ['', '—'])[1].replace(/\|/g, '\\|');
  rows.push(`| \`${f}\` | ${src.split('\n').length - 1} | ${(users[f] ?? []).join(' ') || '—'} | ${desc} |`);
}
const readme = fs.readFileSync('README.md', 'utf8'), a = readme.indexOf(START), b = readme.indexOf(END);
if (a < 0 || b < 0) throw new Error(`README.md: brak znaczników ${START} … ${END}`);
fs.writeFileSync('README.md', readme.slice(0, a + START.length) + '\n' + rows.join('\n') + '\n' + readme.slice(b));
console.log(`README.md: ${rows.length - 2} plików`);
