// Shared files (lib/, models/): which games load them and what they take from the global scope.
// Allowed: other shared files, and the 3D game contract (CONTRACT: scene, palette M) — for M it checks that
// every game loading the file defines all M keys the file uses. Anything else taken from a game is a hidden
// dependency (exit code 1). Also: top-level name collisions between scripts of one game.
// Usage: node tools/deps.mjs [file-substring]   e.g. node tools/deps.mjs lib/   or   trains
import * as walk from 'acorn-walk';
import { OWN_GAMES, scriptsOf, read, topNames, freeNames } from './code.mjs';

export const CONTRACT = ['scene', 'M'];
const filter = process.argv[2] ?? '';
const users = {}, provides = {};
for (const g of OWN_GAMES) for (const f of scriptsOf(g)) {
  if (/^(lib|models)\//.test(f)) (users[f] ??= []).push(g);
  provides[f] ??= topNames(read(f).ast);
}
const providerOf = (name, game) => scriptsOf(game).filter(f => provides[f].includes(name));

// M keys: `M.key` reads in a file; keys of `const M = {…}`, `Object.assign(M, {…})`, `M.key = …` in a game's own scripts
const mUses = ast => { const k = new Set(); walk.simple(ast, { MemberExpression(n) { if (n.object.type === 'Identifier' && n.object.name === 'M' && !n.computed) k.add(n.property.name); } }); return k; };
// M keys needed by game g from file f: only top-level functions of f that g (or another used function of f) calls
function usedMKeys(f, ast, g) {
  const fns = {}, ids = n => { const s = new Set(); walk.full(n, x => x.type === 'Identifier' && s.add(x.name)); return s; };
  for (const n of ast.body) for (const x of topNames({ body: [n] })) fns[x] = { ids: ids(n), m: mUses(n) };
  const outside = new Set(scriptsOf(g).filter(o => o !== f).flatMap(o => [...ids(read(o).ast)]));
  const used = new Set(Object.keys(fns).filter(x => outside.has(x)));
  for (let grew = true; grew;) { grew = false; for (const x of [...used]) for (const y of fns[x].ids) if (fns[y] && !used.has(y)) { used.add(y); grew = true; } }
  return new Set([...used].flatMap(x => [...fns[x].m]));
}
const mKeys = {};
function gameMKeys(g) {
  if (mKeys[g]) return mKeys[g];
  const k = new Set();
  for (const f of scriptsOf(g).filter(f => !/^(lib|models)\//.test(f))) walk.simple(read(f).ast, {
    VariableDeclarator(n) { if (n.id.name === 'M' && n.init?.type === 'ObjectExpression') n.init.properties.forEach(p => p.key && k.add(p.key.name ?? p.key.value)); },
    AssignmentExpression(n) { const l = n.left; if (l.type === 'MemberExpression' && l.object.name === 'M' && !l.computed) k.add(l.property.name); },
    CallExpression(n) {               // Object.assign(M, {…})
      const [t, o] = n.arguments; if (n.callee.property?.name === 'assign' && t?.name === 'M' && o?.type === 'ObjectExpression') o.properties.forEach(p => p.key && k.add(p.key.name ?? p.key.value)); },
  });
  return mKeys[g] = k;
}

let hidden = 0, bad = 0;
for (const f of Object.keys(users).sort()) {
  if (!f.includes(filter)) continue;
  const { ast } = read(f), free = freeNames(ast);
  const fromShared = {}, fromGame = {}, contract = [], missing = [];
  for (const x of free) {
    const per = users[f].map(g => [g, providerOf(x, g).filter(p => p !== f)]);
    const shared = per.flatMap(([, ps]) => ps).filter(p => /^(lib|models)\//.test(p));
    if (shared.length) (fromShared[[...new Set(shared)].join(',')] ??= []).push(x);
    else if (per.some(([, ps]) => ps.length)) (CONTRACT.includes(x) ? contract : (fromGame[per.filter(([, ps]) => ps.length).map(([g]) => g).join(',')] ??= [])).push(x);
    else missing.push(x);
  }
  const nGame = Object.values(fromGame).flat().length;
  hidden += nGame;
  console.log(`\n${f}  [${users[f].join(' ')}]${nGame ? `  ← ukryte z gry: ${nGame}` : ''}`);
  for (const [p, xs] of Object.entries(fromShared)) console.log(`  z ${p}: ${xs.join(' ')}`);
  if (contract.length) {
    let line = `  kontrakt gry: ${contract.join(' ')}`;
    if (contract.includes('M')) {
      const need = [...mUses(ast)].sort();
      line += ` (M: ${need.join(' ')})`;
      for (const g of users[f]) { const lack = [...usedMKeys(f, ast, g)].filter(k => !gameMKeys(g).has(k)).sort(); if (lack.length) { bad++; line += `\n  ✗ ${g}: brak M.${lack.join(', M.')}`; } }
    }
    console.log(line);
  }
  for (const [g, xs] of Object.entries(fromGame)) console.log(`  ✗ z gry (${g}): ${xs.join(' ')}`);
  if (missing.length) console.log(`  ? nieznane (wywołania zwrotne / zmienne przeglądarki): ${missing.join(' ')}`);
}

// top-level lexical names declared twice in one game = SyntaxError; functions declared twice = silent override
let coll = 0;
for (const g of OWN_GAMES) {
  const seen = {};
  for (const f of scriptsOf(g)) for (const x of topNames(read(f).ast)) {
    if (seen[x] && seen[x] !== f) { coll++; console.log(`✗ kolizja w ${g}: ${x} w ${seen[x]} i ${f}`); }
    seen[x] ??= f;
  }
}
console.log(`\nukryte zależności od gier: ${hidden} · brakujące klucze M: ${bad} · kolizje nazw: ${coll}`);
process.exit(hidden || bad || coll ? 1 : 0);
