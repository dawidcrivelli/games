// zwierzeta — wspólne dla: pralnia, arka
// wymaga z gry: PI
'use strict';
const LEGS4=(fx,bx,z)=>[[fx,z,0],[fx,-z,PI],[bx,z,PI],[bx,-z,0]];
function legs(a,b,pos,y,build){for(const [x,z,ph] of pos){const p=grp(b,x,y,z);build(p,Math.sign(z),x>0);a.legs.push({p,ph});}}
