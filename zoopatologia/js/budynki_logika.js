/* ================= budynki: logika ================= */
function findBld(kind){let best=-1,bq=1e9; G.plots.forEach((pl,i)=>{if(pl.k==='bld'&&pl.b===kind){const q=pl.queue.length+(pl.cur?1:0); if(q<bq){bq=q;best=i;}}}); return best;}
function updateBld(pl,pi,dt){
  if(pl.b==='lab') return;
  if(pl.cur){
    pl.ct-=dt; pl.wear+=dt*(G.res.done['turbo:'+pl.b]?.6:1.2);
    if(pl.wear>=85&&!pl.warn){pl.warn=1; ticker(`${BLD[pl.b].n} trzeszczy! Wezwij mechanika, zanim wybuchnie.`,'alarm'); snd('bad');}
    if(pl.wear>=100){explode(pl,pi); return;}
    if(pl.ct<=0){const a=byId(pl.cur); pl.cur=null; if(a) treat(pl,a);}
  }
  else if(pl.queue.length){
    const a=byId(pl.queue[0]); if(!a||a.st!=='queue'){pl.queue.shift(); return;}
    if(dist(a,queuePos(pl,0))<3){pl.queue.shift(); pl.cur=a.id; a.st='in';
      pl.cmax=(pl.b==='skaner'?4:6.5)*(G.res.done['turbo:'+pl.b]?.55:1); pl.ct=pl.cmax; snd('bld');}
  }
}
function explode(pl,pi){
  const X=pl.tx*TS+56, Y=pl.ty*TS+40;
  G.shake=1; snd('boom'); G.rep-=6;
  for(let i=0;i<60;i++) PT.push({x:X+rnd(-30,30),y:Y+rnd(-20,20),vx:rnd(-90,90),vy:rnd(-110,-20),life:1.4,max:1.4,c:pick(['#ff6a2a','#ffd23f','#59636e',BLD[pl.b].r,'#1a1226']),s:3});
  if(pl.cur){const a=byId(pl.cur); if(a){a.x=X; a.y=(pl.ty+5)*TS+12; a.st='loose'; a.path=null; a.wait=.2; const nd=pickDisease(); if(nd) addDis(a,nd);}}
  pl.queue.forEach(id=>{const a=byId(id); if(a) sendHome(a);});
  ticker(`BUM! ${BLD[pl.b].n} wybuchła. Pacjent wyleciał przez dach z nową mutacją.`,'alarm');
  hint('mech','Maszyny się zużywają. Mechanik albo serwis zewnętrzny zapobiegną wybuchom.');
  pl.k='ruin'; pl.queue=[]; pl.cur=null; pl.wear=0; pl.warn=0; rebuildStatic();
  if(SEL&&SEL.t==='p'&&SEL.id===pi) panelSig='';
}
function discover(id,quiet){if(!G.disc[id]){G.disc[id]=1; G.animals.forEach(o=>o.dis.forEach(d=>{if(d.id===id) d.know=2;})); if(!quiet) ticker(`Nowa mutacja w Księdze: ${DIS[id].n}. Kolejne przypadki rozpoznasz od razu.`,'good');}}
function treat(pl,a){
  const q=queuePos(pl,0); a.x=q.x; a.y=q.y+2; a.st='walk'; a.path=[]; a.pre=null;
  if(pl.b==='skaner'){
    a.dis.forEach(d=>{d.know=2; discover(d.id);});
    floatW(a.x,a.y-30,'Diagnoza!','#9dffcb'); snd('click');
    if(a.dis.length){const bi=findBld(DIS[a.dis[0].id].b); if(bi>=0&&sendTo(a,bi)) return;
      ticker(`Brak budynku do leczenia: ${DIS[a.dis[0].id].n} (${BLD[DIS[a.dis[0].id].b].n}).`);}
    sendHome(a); return;
  }
  const d=a.dis.find(d=>DIS[d.id].b===pl.b);
  if(d){
    removeDis(a,d.id); discover(d.id); G.cured++; G.money+=200; G.rep+=2; snd('cure'); sparkle(a.x,a.y,'#7dffb2');
    floatW(a.x,a.y-30,'Wyleczony! +200 zł','#7dffb2');
    ticker(`${a.name} wyleczony z: ${DIS[d.id].n}. Grant +200 zł.`,'good');
    if(a.dis.length&&a.dis[0].know===2){const bi=findBld(DIS[a.dis[0].id].b); if(bi>=0&&sendTo(a,bi)) return;}
  } else {
    a.dis.forEach(x=>{if(x.know===1) x.know=0;});
    if(Math.random()<.5&&a.dis.length<2){const nd=pickDisease(); if(nd&&!has(a,nd)){addDis(a,nd);
      floatW(a.x,a.y-30,'Efekt uboczny!','#ff8a8a'); ticker(`Zły budynek! ${a.name} dostaje gratis nową mutację.`,'alarm'); snd('bad');}}
    else{floatW(a.x,a.y-30,'Bez zmian…','#ffd23f'); snd('bad');}
  }
  sendHome(a);
}

