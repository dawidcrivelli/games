// Duplicate-code report: named functions (any depth, also inside ZOO/MORZE modules) defined in more
// than one file of this repo's games, grouped into identical-text variants. Same name ≠ same job:
// check before merging. Usage: node tools/dups.mjs [--all]   (--all: also names used in one game only)
import { OWN_GAMES, scriptsOf, read, tokens } from './code.mjs';
import * as walk from 'acorn-walk';

const all = process.argv.includes('--all');
const files = [...new Set(OWN_GAMES.flatMap(scriptsOf))];
const gamesOf = f => OWN_GAMES.filter(g => scriptsOf(g).includes(f));
const byName = {};
for (const f of files) {
  const { src, ast } = read(f);
  const add = (name, node) => (byName[name] ??= []).push({ f, norm: tokens(src.slice(node.start, node.end)), lines: src.slice(node.start, node.end).split('\n').length });
  walk.full(ast, n => {
    if (n.type === 'FunctionDeclaration') add(n.id.name, n);
    else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && /Function/.test(n.init?.type ?? '')) add(n.id.name, n.init);
  });
}

const rows = [];
for (const [name, defs] of Object.entries(byName)) {
  const inFiles = new Set(defs.map(d => d.f));
  if (inFiles.size < 2) continue;
  const games = new Set(defs.flatMap(d => gamesOf(d.f)));
  if (games.size < 2 && !all) continue;
  const v = {};
  for (const d of defs) (v[d.norm] ??= { files: [], lines: d.lines }).files.push(d.f);
  const variants = Object.values(v);
  rows.push({ name, variants, games: games.size, waste: defs.reduce((s, d) => s + d.lines, 0) - Math.max(...variants.map(x => x.lines)) });
}
rows.sort((a, b) => b.waste - a.waste || a.name.localeCompare(b.name));
for (const r of rows) {
  const kind = r.variants.length === 1 ? 'IDENT' : `VAR${r.variants.length}`;
  console.log(`${r.name.padEnd(16)} ${kind.padEnd(5)} ~${String(r.waste).padStart(3)} l.  ` +
    r.variants.map(x => `${x.files.map(f => f.replace(/\/game\.js$/, '')).join('+')}(${x.lines})`).join(' | '));
}
console.log(`\n${rows.length} nazw w ≥2 plikach; ~${rows.reduce((s, r) => s + r.waste, 0)} linii ponad najdłuższy wariant (górna granica: część to inne funkcje o tej samej nazwie)`);
