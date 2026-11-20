// Shared helpers for code-analysis tools: which games load which local scripts, parsing,
// top-level declarations, free identifiers (what a file takes from the global scope).
import fs from 'node:fs';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export const OWN_GAMES = JSON.parse(fs.readFileSync('gry.json', 'utf8')).filter(g => !g.url).map(g => g.id);

// Local scripts of a game, in load order, as repo-relative paths (e.g. 'lib/x.js', 'taxi/game.js')
export function scriptsOf(game) {
  const html = fs.readFileSync(`${game}/index.html`, 'utf8');
  return [...html.matchAll(/<script src="((?!https?:)[^"]+)"/g)]
    .map(([, src]) => new URL(src, `file:///${game}/`).pathname.slice(1));
}

export const parse = src => acorn.parse(src, { ecmaVersion: 'latest', allowReturnOutsideFunction: true });
export const tokens = src => [...acorn.tokenizer(src, { ecmaVersion: 'latest' })].map(t => t.value ?? t.type.label).join(' ');

// Top-level names a classic script adds to the shared scope
export function topNames(ast) {
  const out = [];
  for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') out.push(n.id.name);
    else if (n.type === 'VariableDeclaration') for (const d of n.declarations) out.push(...patternNames(d.id));
  }
  return out;
}

function patternNames(p) {
  if (!p) return [];
  switch (p.type) {
    case 'Identifier': return [p.name];
    case 'ObjectPattern': return p.properties.flatMap(q => patternNames(q.type === 'RestElement' ? q.argument : q.value));
    case 'ArrayPattern': return p.elements.flatMap(patternNames);
    case 'AssignmentPattern': return patternNames(p.left);
    case 'RestElement': return patternNames(p.argument);
  }
  return [];
}

// Browser / JS globals that are never "taken from a game"
const BUILTIN = new Set(Object.getOwnPropertyNames(globalThis).concat(
  'window document navigator location localStorage sessionStorage screen performance requestAnimationFrame cancelAnimationFrame',
  'innerWidth innerHeight devicePixelRatio matchMedia getComputedStyle addEventListener removeEventListener',
  'AudioContext webkitAudioContext OfflineAudioContext Image HTMLCanvasElement DOMMatrix Path2D alert confirm prompt',
  'DeviceOrientationEvent DeviceMotionEvent KeyboardEvent PointerEvent TouchEvent ResizeObserver Audio',
  'THREE arguments undefined',
).join(' ').split(/\s+/));

// Identifiers a file reads but never declares anywhere (over-approximation of scoping:
// any declaration of a name anywhere in the file counts as local)
export function freeNames(ast) {
  const declared = new Set(), used = new Set();
  walk.fullAncestor(ast, (n, _, anc) => {
    const p = anc[anc.length - 2];
    if (n.type === 'VariableDeclarator') patternNames(n.id).forEach(x => declared.add(x));
    else if (/Function|Class/.test(n.type) && n.id) declared.add(n.id.name);
    if (/Function/.test(n.type)) n.params.flatMap(patternNames).forEach(x => declared.add(x));
    if (n.type === 'CatchClause' && n.param) patternNames(n.param).forEach(x => declared.add(x));
    if (n.type !== 'Identifier' || !p) return;
    if (p.type === 'MemberExpression' && p.property === n && !p.computed) return;
    if ((p.type === 'Property' || p.type === 'MethodDefinition' || p.type === 'PropertyDefinition') && p.key === n && !p.computed && !p.shorthand) return;
    if (/Label/.test(p.type)) return;
    used.add(n.name);
  });
  return [...used].filter(x => !declared.has(x) && !BUILTIN.has(x)).sort();
}

export function read(file) {
  const src = fs.readFileSync(file, 'utf8');
  return { src, ast: parse(src) };
}
