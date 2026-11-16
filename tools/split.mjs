// One-off migration: orig/<game>.html (single-file artifact, one IIFE) → <game>/index.html + <game>/game.js,
// with declarations moved to shared catalogs: lib/<cat>.<games>.js (engine) and models/<cat>.<games>.js (3D models).
// <games> = the games whose copy is token-identical, so differing copies stay side by side as variants.
// Usage: node tools/split.mjs
import fs from 'node:fs';
import { GAMES, parts, analyze } from './analyze.mjs';

// Category per declaration name. Unlisted names stay in game.js unless identical in ≥2 games (→ lib/wspolne).
const CATS = {
  'lib/util': 'rnd rr clamp lerp pick wrap hash2 vnoise fbm sstep mix3 mul3 C V $',
  'lib/three': 'tex lam pho signMat mesh box cylY cylX cylZ rboxGeo rbox hose mergeGeos bake ell cone cloneTpl canvasTex M MT ball grp merge mergeC flat setCol tf cg sweep fl emojiTex',
  'lib/scena': 'setSky applyWeather updateRain updateBirds emit updateParticles puff updatePuffs burst',
  'lib/audio': 'initAudio tone nloop setLoop nz sw roar mnote startMusic',
  'lib/ui': 'tap press holdBtn goFS enableTilt resize syncSnd',
  'models/zwierzeta': 'mkElephant mkGiraffe mkZebra mkHippo mkCroc mkLion mkTiger mkPanda mkPenguin mkKangaroo buildGiraffe buildElephant ratGeo whiskers loft val cr base eye finish LEGS4 legs chickIM',
  'models/akcesoria': 'mkHat',
  'models/morze': 'fishGeo makeDolphin makeWhale makeShark makeManta hexCell makeTurtle makeClown makePuffer seahorseGeo makeCrab makeOcto jellyGeos makeMoray speciesGeo speciesMat band clownCol skin flip k top SM rMerge rFlat rBall',
  'models/rafa': 'branchGeo brainGeo tableGeo tubesGeo platesGeo pillarsGeo anemoneGeo kelpGeo grassGeo nubGeo rockGeo urchinGeo clamGeo starGeo shellGeo makeWreck makeChest wc cc',
  'models/ludzie': 'makeFarmer pedGroup pedMats',
  'models/pojazdy': 'makeWheel makeSteeringWheel gaugeNeedle mkAuto autoWheels autoSW paint profGeo pane sideWin autoWheelTpl carFace carSides aiModel wheels buildTaxi buildBus buildRacer buildPolice planeBody buildPlane',
  'models/rolnicze': 'buildTractor buildCombine makeScrew addScrew buildPlough buildSeeder buildBaler buildBigTractor buildTrailer buildKombajn',
  'models/pociagi': 'makeRailWheel addWheels coupler buffers mkCar buildLoco buildTender buildCoach buildWagon buildEU07 buildPend setConsist',
  'models/budynki': 'gableHouse nameBoard groundPad ramp roofPrism barn house shop bldg buildLandmarks',
  'models/przyroda': 'tree palm duck tuftGeo',
};
const CAT = Object.fromEntries(Object.entries(CATS).flatMap(([c, ns]) => ns.split(' ').map(n => [n, c])));
const ORDER = Object.keys(CATS).concat('lib/wspolne');
const catOf = names => names.map(n => CAT[n]).find(Boolean);

const src = Object.fromEntries(GAMES.map(g => [g, parts(fs.readFileSync(`orig/${g}.html`, 'utf8'))]));
const decls = Object.fromEntries(GAMES.map(g => [g, analyze(src[g].body)]));

// Who shares each exact (names, text) declaration
const sharers = {};
for (const g of GAMES) for (const d of decls[g]) if (d.kind === 'fn') (sharers[d.names + '|' + d.norm] ??= []).push(g);

// Pick moved declarations: catalogued names, or identical fn in ≥2 games
const files = {}; // path → {games, strict[], decls[]}
const moved = Object.fromEntries(GAMES.map(g => [g, []]));
for (const g of GAMES) for (const d of decls[g]) {
  if (d.kind !== 'fn') continue;
  const gs = sharers[d.names + '|' + d.norm];
  // Models always move (catalog); engine helpers only when shared, one lib file per set of sharing games
  const cat = catOf(d.names) ?? 'lib/wspolne';
  const model = cat.startsWith('models/');
  if (!model && gs.length < 2) continue;
  const path = model ? `${cat}.${gs.join('-')}.js` : `lib/${gs.join('-')}.js`;
  const f = files[path] ??= { cat: model ? cat : 'lib/wspolne', games: gs, decls: [] };
  if (gs[0] === g) f.decls.push({ ...d, sec: cat });
  moved[g].push(path);
  d.moved = true;
}

// Names a catalog file still takes from game.js: deps not defined in any shared file of that game
const sharedNames = g => new Set(decls[g].filter(d => d.moved).flatMap(d => d.names));
const needs = f => { const s = sharedNames(f.games[0]); return [...new Set(f.decls.flatMap(d => d.deps))].filter(n => !s.has(n)).sort(); };
const HDR = f => `// ${f.cat.startsWith('lib') ? 'silnik' : f.cat.split('/')[1]} — wspólne dla: ${f.games.join(', ')}\n`
  + (needs(f).length ? `// wymaga z gry: ${needs(f).join(', ')}\n` : '') + (f.games.every(g => src[g].strict) ? "'use strict';\n" : '');
fs.rmSync('lib', { recursive: true, force: true }); fs.rmSync('models', { recursive: true, force: true });
for (const [p, f] of Object.entries(files)) {
  fs.mkdirSync(p.split('/')[0], { recursive: true });
  fs.writeFileSync(p, HDR(f) + f.decls.sort((a, b) => ORDER.indexOf(a.sec) - ORDER.indexOf(b.sec)).map((d, i, a) => (d.sec !== a[i - 1]?.sec && f.cat.startsWith('lib') ? `\n// --- ${d.sec.split('/')[1]}\n` : '') + d.src).join('\n') + '\n');
}

// Game: body minus moved declarations; index.html loads three, catalogs, game.js
for (const g of GAMES) {
  const { before, after, body, strict } = src[g];
  let out = '', pos = 0;
  for (const d of decls[g]) if (d.moved) { out += body.slice(pos, d.start); pos = d.end; }
  // Top-level `return` (no three.js) was legal only inside the IIFE
  out = (strict ? "'use strict';\n" : '') + (out + body.slice(pos)).replace(/(if \(!window\.THREE\) \{[^}]*?)return; \}/, "$1throw new Error('brak three.js'); }")
    .replace(/(catch \(e\) \{ \$\('err'\)[^}]*?)return; \}/, "$1throw e; }").replace(/\n{3,}/g, '\n\n').trim() + '\n';
  fs.mkdirSync(g, { recursive: true });
  fs.writeFileSync(`${g}/game.js`, out);
  const libs = [...new Set(moved[g])].sort((a, b) => a.split('/')[0].localeCompare(b.split('/')[0]) || files[b].games.length - files[a].games.length || a.localeCompare(b));
  const tags = libs.concat('game.js').map(p => `<script src="${p === 'game.js' ? p : '../' + p}"></script>`).join('\n');
  fs.writeFileSync(`${g}/index.html`, before + tags + after);
  console.log(g.padEnd(9), 'game.js', out.split('\n').length, 'lines,', libs.length, 'shared files');
}
console.log(Object.keys(files).sort().join('\n'));
