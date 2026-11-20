// Shared files (lib/, models/): which games load them and what they take from the global scope —
// from another shared file, or from the game itself (the hidden coupling to remove).
// Usage: node tools/deps.mjs [file-substring]   e.g. node tools/deps.mjs lib/   or   pociagi
import { OWN_GAMES, scriptsOf, read, topNames, freeNames } from './code.mjs';

const filter = process.argv[2] ?? '';
const users = {};                         // shared file → games
const provides = {};                      // file → top-level names
for (const g of OWN_GAMES) for (const f of scriptsOf(g)) {
  if (/^(lib|models)\//.test(f)) (users[f] ??= []).push(g);
  provides[f] ??= topNames(read(f).ast);
}
const providerOf = (name, game) => scriptsOf(game).filter(f => provides[f].includes(name));

let total = 0;
for (const f of Object.keys(users).sort()) {
  if (!f.includes(filter)) continue;
  const free = freeNames(read(f).ast);
  const fromShared = {}, fromGame = {}, missing = [];
  for (const x of free) {
    const per = users[f].map(g => [g, providerOf(x, g).filter(p => p !== f)]);
    const shared = per.flatMap(([, ps]) => ps).filter(p => !p.endsWith('/game.js') && /^(lib|models)\//.test(p));
    if (shared.length) (fromShared[[...new Set(shared)].join(',')] ??= []).push(x);
    else if (per.some(([, ps]) => ps.length)) (fromGame[per.filter(([, ps]) => ps.length).map(([g]) => g).join(',')] ??= []).push(x);
    else missing.push(x);
  }
  const nGame = Object.values(fromGame).flat().length;
  total += nGame;
  console.log(`\n${f}  [${users[f].join(' ')}]  ← z gry: ${nGame}`);
  for (const [p, xs] of Object.entries(fromShared)) console.log(`  z ${p}: ${xs.join(' ')}`);
  for (const [g, xs] of Object.entries(fromGame)) console.log(`  z gry (${g}): ${xs.join(' ')}`);
  if (missing.length) console.log(`  ? nieznane (wywołania zwrotne / zmienne przeglądarki): ${missing.join(' ')}`);
}
console.log(`\nrazem nazw brane z gier: ${total}`);
