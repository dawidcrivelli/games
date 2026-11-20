/* ================= personel ================= */
function mkStaff(role){return{id:G.uid++,role,x:4*TS+8,y:26*TS+12,st:'idle',path:null,tgt:null,wt:0,face:1,ph:0,mv:false,think:Math.random(),lab:-1,lk:{skin:pick(SKIN),hair:pick(HAIR),pants:'#3b4a6b',shirt:'#fff'}};}
function staffHome(s){const c=nearestWalk(s.x,s.y); s.path=bfs(c.tx,c.ty,4,26)||[]; s.st='home';}
function updateStaff(s,dt){
  s.mv=false; const spd=s.role==='guard'?34:28;
  if(s.st==='home'){if(stepPath(s,dt,spd)) s.st='idle'; return;}
  if(s.st==='in'){
    const pl=G.plots[s.lab];
    if(!pl||pl.k!=='bld'||pl.b!=='lab'){const f=pl?frontTile(pl):{tx:4,ty:26}; s.x=f.tx*TS+8; s.y=f.ty*TS+12; s.st='idle'; s.lab=-1;}
    return;
  }
  if(s.st==='idle'){
    s.think-=dt; if(s.think>0) return; s.think=.6;
    if(s.role==='vet'){
      let best=null,bd=1e9; for(const a of G.animals){if(a.st!=='pen'||!a.dis.length||a.vc||G.time-a.noB<12) continue; const d=Math.hypot(a.x-s.x,a.y-s.y); if(d<bd){bd=d;best=a;}}
      if(best){best.vc=s.id; s.tgt=best.id; const c=nearestWalk(s.x,s.y), f=frontTile(G.plots[best.pen]); s.path=bfs(c.tx,c.ty,f.tx,f.ty)||[]; s.st='go'; return;}
    } else if(s.role==='jan'){
      let best=null,bd=1e9; for(const l of G.litter){if(l.c) continue; const d=Math.hypot(l.x-s.x,l.y-s.y); if(d<bd){bd=d;best=l;}}
      if(best){best.c=s.id; s.tgt=best.id; const c=nearestWalk(s.x,s.y), f=nearestWalk(best.x,best.y); s.path=bfs(c.tx,c.ty,f.tx,f.ty)||[]; s.st='go'; return;}
    } else if(s.role==='guard'){
      let best=null,bd=1e9; for(const a of G.animals){if(a.st!=='loose'||a.gc) continue; const d=Math.hypot(a.x-s.x,a.y-s.y); if(d<bd){bd=d;best=a;}}
      if(best){best.gc=s.id; s.tgt=best.id; s.rp=0; s.st='go'; return;}
    } else if(s.role==='mech'){
      let best=-1,bw=34; G.plots.forEach((pl,i)=>{if(pl.k==='bld'&&MACH.includes(pl.b)&&!pl.mc&&pl.wear>bw){bw=pl.wear;best=i;}});
      if(best>=0){const pl=G.plots[best]; pl.mc=s.id; s.tgt=best; const c=nearestWalk(s.x,s.y), f=frontTile(pl); s.path=bfs(c.tx,c.ty,f.tx,f.ty)||[]; s.st='go'; return;}
    } else if(s.role==='sci'){
      {let best=-1; G.plots.forEach((pl,i)=>{if(pl.k==='bld'&&pl.b==='lab'&&labStaff(pl).length+G.staff.filter(x=>x.role==='sci'&&x.st==='go'&&x.tgt===i).length<3) best=i;});
        if(best>=0){s.tgt=best; const c=nearestWalk(s.x,s.y), f=frontTile(G.plots[best]); s.path=bfs(c.tx,c.ty,f.tx,f.ty)||[]; s.st='go'; return;}}
    }
    if(Math.hypot(s.x-(4*TS+8),s.y-(26*TS+12))>20) staffHome(s);
    return;
  }
  if(s.role==='vet'){
    const a=byId(s.tgt); if(!a||a.st!=='pen'||!a.dis.length){if(a) a.vc=0; s.tgt=null; s.st='idle'; return;}
    if(s.st==='go'){if(stepPath(s,dt,spd)){s.st='work'; s.wt=a.dis.every(d=>d.know===2)?.8:2.5; s.face=1;}}
    else if(s.st==='work'){s.wt-=dt; if(Math.random()<dt*3) PT.push({x:s.x,y:s.y-20,vx:0,vy:-12,life:.6,max:.6,c:'#e53950',s:2}); if(s.wt<=0){a.vc=0; s.tgt=null; s.st='idle'; vetDecide(a);}}
  } else if(s.role==='jan'){
    const l=G.litter.find(x=>x.id===s.tgt); if(!l){s.tgt=null; s.st='idle'; return;}
    if(s.st==='go'){if(stepPath(s,dt,spd)){if(!moveTo(s,l.x,l.y,dt,spd)){s.path=[]; return;} s.st='work'; s.wt=.8;}}
    else if(s.st==='work'){s.wt-=dt; if(s.wt<=0){G.litter=G.litter.filter(x=>x!==l); s.tgt=null; s.st='idle'; sparkle(l.x,l.y+6,'#ffffff');}}
  } else if(s.role==='guard'){
    const a=byId(s.tgt); if(!a||a.st!=='loose'){if(a) a.gc=0; s.tgt=null; s.st='idle'; return;}
    s.rp-=dt; if(s.rp<=0||!s.path||!s.path.length){s.rp=1.2; const c=nearestWalk(s.x,s.y), f=nearestWalk(a.x,a.y); s.path=bfs(c.tx,c.ty,f.tx,f.ty)||[];}
    stepPath(s,dt,spd);
    if(Math.hypot(a.x-s.x,a.y-s.y)<14){a.gc=0; s.tgt=null; s.st='idle'; floatW(a.x,a.y-24,'Mam cię!','#ffd23f'); snd('click'); if(has(a,'gigant')) a.tm.g=0; sendHome(a);}
  } else if(s.role==='mech'){
    const pl=G.plots[s.tgt]; if(!pl||pl.k!=='bld'){if(pl) pl.mc=0; s.tgt=null; s.st='idle'; return;}
    if(s.st==='go'){if(stepPath(s,dt,spd)){s.st='work'; s.wt=3;}}
    else if(s.st==='work'){s.wt-=dt; s.face=Math.floor(s.wt*4)%2?1:-1; if(Math.random()<dt*8) PT.push({x:s.x+rnd(-4,4),y:s.y-12,vx:rnd(-30,30),vy:rnd(-30,-5),life:.35,max:.35,c:'#ffe14d',s:1});
      if(Math.random()<dt*3) snd('fix');
      if(s.wt<=0){pl.wear=0; pl.warn=0; pl.mc=0; s.tgt=null; s.st='idle'; floatW(s.x,s.y-24,'Naprawione!','#9dffcb');}}
  } else if(s.role==='sci'){
    const pl=G.plots[s.tgt]; if(!pl||pl.k!=='bld'||pl.b!=='lab'){s.tgt=null; s.st='idle'; return;}
    if(stepPath(s,dt,spd)){s.st='in'; s.lab=s.tgt; s.tgt=null;}
  }
}
function vetDecide(a){
  const sk=findBld('skaner'), unk=a.dis.filter(d=>d.know===0);
  if(unk.length&&sk>=0){if(sendTo(a,sk)){floatW(a.x,a.y-30,'Do skanera!','#9dffcb'); return;}}
  const acc=G.res.done.diag?.95:.75;
  unk.forEach(d=>{d.know=1; const o=unlockedDis().filter(k=>k!==d.id); d.guess=(Math.random()<acc||!o.length)?d.id:pick(o);});
  for(const d of a.dis){const bel=d.know===2?d.id:d.guess; const bi=findBld(DIS[bel].b); if(bi>=0&&sendTo(a,bi)){floatW(a.x,a.y-30,'Na leczenie!','#9dffcb'); return;}}
  a.noB=G.time; const d=a.dis[0], bel=d.know===2?d.id:d.guess;
  floatW(a.x,a.y-30,'Brak budynku!','#ff8a8a');
  ticker(`Weterynarz: „To chyba ${DIS[bel].n}. Potrzebny budynek: ${BLD[DIS[bel].b].n}”.`);
}

