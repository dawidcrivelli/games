// Function inventory for refactors: every named function (any depth) of this repo's games, as
// name → token text. `node tools/fnsnap.mjs > a.json`, refactor, `node tools/fnsnap.mjs --diff a.json`
// lists functions whose code changed, vanished or appeared (moving a function between files is no change).
import fs from 'node:fs';
import * as walk from 'acorn-walk';
import { OWN_GAMES, scriptsOf, read, tokens } from './code.mjs';

const snap = {};
for (const f of [...new Set(OWN_GAMES.flatMap(scriptsOf))].sort()) {
  const { src, ast } = read(f);
  const add = (name, node) => { const t = tokens(src.slice(node.start, node.end)); (snap[name] ??= {})[t] = [...(snap[name]?.[t] ?? []), f]; };
  walk.full(ast, n => {
    if (n.type === 'FunctionDeclaration') add(n.id.name, n);
    else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && /Function/.test(n.init?.type ?? '')) add(n.id.name, n.init);
  });
}
const i = process.argv.indexOf('--diff');
if (i < 0) { console.log(JSON.stringify(snap)); process.exit(0); }
const old = JSON.parse(fs.readFileSync(process.argv[i + 1], 'utf8'));
let n = 0;
for (const name of [...new Set([...Object.keys(old), ...Object.keys(snap)])].sort()) {
  const a = old[name] ?? {}, b = snap[name] ?? {};
  const gone = Object.keys(a).filter(t => !b[t]), added = Object.keys(b).filter(t => !a[t]);
  const fewer = Object.keys(a).filter(t => b[t] && b[t].length < a[t].length);
  if (!gone.length && !added.length && !fewer.length) continue;
  n++;
  const fl = (m, ts) => ts.map(t => m[t].join('+')).join(' | ');
  console.log(name.padEnd(18), gone.length ? `- ${fl(a, gone)}` : '', added.length ? `+ ${fl(b, added)}` : '', fewer.length ? `kopie: ${fewer.map(t => `${a[t].length}→${b[t].length}`).join(' ')}` : '');
}
console.log(`\n${n} funkcji zmienionych / usuniętych / nowych / mniej kopii`);
