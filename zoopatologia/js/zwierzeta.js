/* ================= zwierzęta ================= */
function sendTo(a,pi){
  if(!['pen','loose','walk','in'].includes(a.st)) return false;
  const pl=G.plots[pi]; if(!pl||pl.k!=='bld') return false;
  clearClaims(a);
  let st;
  if(a.st==='pen'){a.pre=gatePt(G.plots[a.pen]); st=gateTile(G.plots[a.pen]);} else {a.pre=null; st=nearestWalk(a.x,a.y);}
  const ft=frontTile(pl); const p=bfs(st.tx,st.ty,ft.tx,ft.ty);
  if(!p) return false;
  a.path=p; a.post=null; a.goal='bld'; a.dest=pi; a.st='walk'; return true;
}
function sendHome(a){
  clearClaims(a);
  const pl=G.plots[a.pen], st=nearestWalk(a.x,a.y), g=gateTile(pl);
  const p=bfs(st.tx,st.ty,g.tx,g.ty);
  a.pre=null; a.goal='pen'; a.dest=-1; a.st='walk'; a.post=randInPen(pl);
  if(!p){const q=a.post; a.x=q.x; a.y=q.y; a.st='pen'; a.wx=q.x; a.wy=q.y; a.post=null; return;}
  a.path=p;
}
function arrive(a){
  if(a.goal==='bld'){const pl=G.plots[a.dest]; if(!pl||pl.k!=='bld'){sendHome(a); return;} if(!pl.queue.includes(a.id)) pl.queue.push(a.id); a.st='queue';}
  else{a.st='pen'; a.wait=rnd(.5,2); const p=randInPen(G.plots[a.pen]); a.wx=p.x; a.wy=p.y;}
}
function updateAnimal(a,dt){
  a.mv=false;
  if(a.baby){a.age+=dt; if(a.age>=ADULT){a.baby=false; floatW(a.x,a.y-20,'Dorosły!','#ffe27a');}}
  if(a.st==='abduct'){a.alt+=dt*5; return;}
  if(a.st==='rocket'){const r=a.rk; r.t+=dt/1.8; const k=Math.min(1,r.t); a.x=r.x0+(r.x1-r.x0)*k; a.y=r.y0+(r.y1-r.y0)*k; a.alt=Math.sin(k*Math.PI)*70; a.face=r.x1>r.x0?1:-1;
    for(let i=0;i<2;i++) PT.push({x:a.x-a.face*6,y:a.y-a.alt-4,vx:rnd(-10,10),vy:rnd(10,30),life:.5,max:.5,c:pick(['#ffb000','#ff6a2a','#cccccc']),s:2});
    if(k>=1){a.alt=0; a.st='loose'; a.path=null; a.wait=.6; G.shake=.3; for(let i=0;i<12;i++) PT.push({x:a.x,y:a.y,vx:rnd(-30,30),vy:rnd(-30,-5),life:.6,max:.6,c:'#c9b089',s:2});
      hint('loose','Zwierzę na wolności straszy gości! Tapnij je, żeby złapać, albo zatrudnij ochroniarza.');}
    return;}
  if(a.st==='fly'){a.alt+=dt*45; a.fly-=dt; if(a.fly<=0) a.st='gone'; return;}
  if(a.st==='in') return;
  const spd=has(a,'gigant')?24:has(a,'lod')?6:has(a,'balon')||has(a,'mini')?12:a.baby?14:18;
  if(a.st==='pen'){if(has(a,'lod')) {effects(a,dt); return;} a.wait-=dt; if(a.wait<=0&&moveTo(a,a.wx,a.wy,dt,spd*.5)){a.wait=rnd(1,4); const p=randInPen(G.plots[a.pen]); a.wx=p.x; a.wy=p.y;}}
  else if(a.st==='walk'){
    if(a.pre){if(moveTo(a,a.pre.x,a.pre.y,dt,spd)) a.pre=null;}
    else if(a.path&&a.path.length) stepPath(a,dt,spd);
    else if(a.post){if(moveTo(a,a.post.x,a.post.y,dt,spd)){a.post=null; arrive(a);}}
    else arrive(a);
  }
  else if(a.st==='queue'){const pl=G.plots[a.dest]; if(!pl||pl.k!=='bld'){sendHome(a);} else {const qi=Math.max(0,pl.queue.indexOf(a.id)); const q=queuePos(pl,qi); moveTo(a,q.x,q.y,dt,spd);}}
  else if(a.st==='loose'){
    if(!a.path||!a.path.length){a.wait-=dt; if(a.wait<=0){const t0=nearestWalk(a.x,a.y), tg=randomWalkNear(t0.tx,t0.ty,6); a.path=bfs(t0.tx,t0.ty,tg.tx,tg.ty)||[]; a.wait=rnd(.4,1.5);}}
    else stepPath(a,dt,spd*1.1);
  }
  effects(a,dt);
}

