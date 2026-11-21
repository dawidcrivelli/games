import fs from 'node:fs'; import * as walk from 'acorn-walk';
import { OWN_GAMES, scriptsOf, read, topNames, freeNames, tokens } from './code.mjs';
const users={}; for (const g of OWN_GAMES) for (const f of scriptsOf(g)) if (/^(lib|models)\//.test(f)) (users[f]??=[]).push(g);
const declOf = {}; // game -> name -> {kind, tok}
for (const g of OWN_GAMES) { declOf[g]={}; for (const f of scriptsOf(g)) { if(/^(lib|models)\//.test(f)) continue; const {src,ast}=read(f);
  for (const n of ast.body) { if (n.type==='FunctionDeclaration') declOf[g][n.id.name]={kind:'fn',tok:tokens(src.slice(n.start,n.end)),f};
    else if (n.type==='VariableDeclaration') for (const d of n.declarations) if (d.id.type==='Identifier') declOf[g][d.id.name]={kind:n.kind,tok:tokens(src.slice(d.start,d.end)),f}; } } }
const lib = new Set(Object.keys(users).flatMap(f=>topNames(read(f).ast)));
const out={};
for (const f of Object.keys(users).sort()) { const free=freeNames(read(f).ast).filter(x=>!lib.has(x));
  for (const x of free) { const ds=users[f].map(g=>declOf[g][x]); if (ds.every(d=>!d)) continue;
    const toks=new Set(ds.map(d=>d?.tok)); const kinds=[...new Set(ds.map(d=>d?.kind))].join('/');
    (out[f]??=[]).push(`${x}:${kinds}${ds.some(d=>!d)?'?':''}${toks.size>1?'≠':'='}`); } }
for (const [f,xs] of Object.entries(out)) console.log(f, '\n   ', xs.join('  '));
