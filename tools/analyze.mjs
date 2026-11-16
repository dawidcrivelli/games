// Parses orig/<game>.html: top-level declarations of the game's IIFE, their deps and
// token-normalized text, so identical code across games can be detected.
// Usage: node tools/analyze.mjs  → tmp/decls.json + summary on stdout
import fs from 'node:fs';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export const GAMES = ['ciuchcia', 'taxi', 'zniwa', 'pralnia', 'arka', 'rafa'];

// Split the artifact HTML into head/css/body/js parts
export function parts(html) {
  const s = html.lastIndexOf('<script>'), e = html.lastIndexOf('</script>');
  const js = html.slice(s + 8, e);
  const open = js.match(/^\s*\(\s*\(\s*\)\s*=>\s*\{\s*('use strict';)?/);
  const close = js.match(/\}\s*\)\s*\(\s*\)\s*;?\s*$/);
  if (!open || !close) throw new Error('no IIFE wrapper');
  return { before: html.slice(0, s), after: html.slice(e + 9), body: js.slice(open[0].length, close.index), strict: !!open[1] };
}

const tokensOf = src => [...acorn.tokenizer(src, { ecmaVersion: 'latest' })].map(t => t.value ?? t.type.label).join(' ');

// Top-level statements → {names, src, kind, deps}
export function analyze(body) {
  const ast = acorn.parse(body, { ecmaVersion: 'latest', allowReturnOutsideFunction: true });
  const stmts = ast.body.map(n => {
    const src = body.slice(n.start, n.end);
    let names = [], kind = 'stmt';
    if (n.type === 'FunctionDeclaration') { names = [n.id.name]; kind = 'fn'; }
    else if (n.type === 'VariableDeclaration') {
      names = n.declarations.flatMap(d => d.id.type === 'Identifier' ? [d.id.name] : []);
      const fnInit = n.declarations.every(d => d.id.type === 'Identifier' && /^(Arrow)?FunctionExpression$/.test(d.init?.type));
      kind = n.kind === 'const' && fnInit ? 'fn' : n.kind;
    }
    const ids = new Set();
    walk.full(n, x => { if (x.type === 'Identifier') ids.add(x.name); });
    return { names, kind, start: n.start, end: n.end, src, ids: [...ids], norm: tokensOf(src) };
  });
  const top = new Set(stmts.flatMap(s => s.names));
  for (const s of stmts) s.deps = s.ids.filter(i => top.has(i) && !s.names.includes(i));
  return stmts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = {}, byName = {};
  for (const g of GAMES) {
    const p = parts(fs.readFileSync(`orig/${g}.html`, 'utf8'));
    out[g] = analyze(p.body).map(({ ids, src, ...r }) => r);
    for (const s of out[g]) if (s.kind === 'fn') for (const n of s.names) (byName[n] ??= []).push([g, s.norm]);
  }
  fs.writeFileSync('tmp/decls.json', JSON.stringify(out, null, 1));
  // Report: names present in >1 game, grouped into identical-text variants
  for (const [n, list] of Object.entries(byName).sort()) {
    if (list.length < 2) continue;
    const v = {};
    for (const [g, norm] of list) (v[norm] ??= []).push(g);
    console.log(n.padEnd(18), Object.values(v).map(gs => gs.join('+')).join(' | '));
  }
}
