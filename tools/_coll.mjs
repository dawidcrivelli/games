import { OWN_GAMES, scriptsOf, read } from './code.mjs';
for (const g of OWN_GAMES) { const seen = {};
  for (const f of scriptsOf(g)) { const { ast } = read(f);
    for (const n of ast.body) { let xs = [];
      if (n.type === 'FunctionDeclaration') xs = [[n.id.name, 'fn']];
      else if (n.type === 'ClassDeclaration') xs = [[n.id.name, 'let']];
      else if (n.type === 'VariableDeclaration') xs = n.declarations.flatMap(d => d.id.type === 'Identifier' ? [[d.id.name, n.kind]] : (d.id.properties || []).map(p => [p.value?.name ?? p.key?.name, n.kind]));
      for (const [x, k] of xs) { if (seen[x] && seen[x][0] !== f) console.log(g, x, seen[x].join(':'), '/', f + ':' + k); seen[x] ??= [f, k]; } } } }
