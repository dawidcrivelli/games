/* ================= goście ================= */
const SKIN=['#f2c9a0','#e0ac80','#c68650','#8d5a34','#ffd9b8'], HAIR=['#2b1a10','#5a3a22','#c9a24a','#e0e0e0','#b23a2a','#1d1d1d','#ff6fb0'], SHIRT=['#e53950','#3d6fb6','#ffd23f','#2fd39a','#ff8c1a','#9b59d6','#ffffff','#2f9e4b'], PANTS=['#3b4a6b','#2b2b2b','#6b4423','#4a6b3b'];
function spawnVisitor(vip){
  const pens=G.plots.map((p,i)=>i).filter(i=>G.plots[i].k==='pen');
  const v={x:GX*TS+8,y:28*TS+12,face:1,ph:0,mv:false,h:.55,ti:0,st:'walk',wait:0,emo:null,emoT:0,ox:ri(-4,4),oy:ri(-3,3),chk:Math.random()*.5,done:false,fled:false,vip:!!vip,
    lk:{skin:pick(SKIN),hair:pick(HAIR),shirt:pick(SHIRT),pants:pick(PANTS),hat:Math.random()<.25?pick(['#e53950','#3d6fb6','#ffd23f','#2f9e4b','#ffffff']):null,gl:Math.random()<.15,ice:Math.random()<.15},kid:!vip&&Math.random()<.25,bal:!vip&&Math.random()<.12?pick(['#ff4f8b','#3d9bff','#ffd23f']):null,targets:[]};
  const n=vip?Math.min(5,pens.length):ri(3,5);
  for(let k=0;k<n;k++){const pi=pens.length?pick(pens):ri(0,G.plots.length-1), pl=G.plots[pi]; v.targets.push({tx:pl.tx+ri(1,5),ty:pl.ty+5,pi});}
  v.targets.push({tx:GX,ty:28,pi:-1});
  const t=v.targets[0]; v.path=bfs(GX,28,t.tx,t.ty)||[];
  if(!vip){G.money+=TICKET; G.visits++; snd('cash');}
  V.push(v); return v;
}
function lookAt(v,pi){
  const pl=G.plots[pi]; if(!pl||pl.k!=='pen'){v.h-=.05; emote(v,'q'); return;}
  const an=G.animals.filter(a=>a.pen===pi&&a.st==='pen');
  if(!an.length){v.h-=.1; emote(v,'q'); return;}
  let d=0, best=null, bw=0;
  const healthy=an.filter(a=>!a.dis.length), hy=healthy.filter(a=>a.hy).length, babies=healthy.filter(a=>a.baby).length;
  d+=Math.min(.45,healthy.length*.1*SPEC[pl.sp].a/2.5)+hy*.15+babies*.06;
  if(hy){best='star'; bw=.2;} else if(babies){best='heart'; bw=.1;}
  const W={zyrafodyl:[-.2,'bang'],kratka:[-.15,'dizzy'],gadul:[-.15,'dots'],toster:[-.15,'bang'],laser:[-.2,'bang'],gigant:[-.25,'bang'],teleport:[-.1,'q'],odwrot:[-.1,'q'],balon:[.05,'q'],klon:[-.05,'q'],disco:[.25,'heart'],lod:[-.05,'dots'],mini:[-.08,'q'],plask:[.02,'q'],wielogl:[-.05,'q'],robot:[.05,'q'],szkielet:[-.2,'bang'],niewidz:[-.1,'q'],skrzyd:[.1,'heart'],ogien:[-.2,'bang'],grzyb:[-.12,'dizzy'],rakieta:[-.1,'bang'],magnes:[-.15,'bang'],kosmita:[-.05,'q']};
  an.forEach(a=>a.dis.forEach(x=>{const w=W[x.id]; d+=w[0]; if(Math.abs(w[0])>bw){bw=Math.abs(w[0]); best=w[1];}}));
  v.h+=d; emote(v,best||(d>0?'heart':'q'));
}
function leave(v){v.done=true; G.rep+=(v.h-.5)*.9; if(v.vip) inspect(v);}
function updateVisitor(v,dt){
  v.mv=false; if(v.emoT>0) v.emoT-=dt;
  if(v.st==='walk'){
    if(stepPath(v,dt,v.fled?44:(v.vip?16:20))){
      const tg=v.targets[v.ti];
      if(!tg||tg.pi===-1){leave(v); return;}
      v.st='look'; v.wait=v.vip?4:rnd(2,3.5); lookAt(v,tg.pi);
    }
  } else if(v.st==='look'){
    v.wait-=dt; if(v.wait<=0){v.ti++; const tg=v.targets[v.ti]; const c=nearestWalk(v.x,v.y); v.path=tg?(bfs(c.tx,c.ty,tg.tx,tg.ty)||[]):[]; v.st='walk';}
  }
  v.chk-=dt;
  if(v.chk<=0){v.chk=.5;
    if(!v.fled){for(const a of G.animals){if(a.st==='loose'&&Math.hypot(a.x-v.x,a.y-v.y)<46){v.h-=.3; emote(v,'bang'); flee(v); break;}}}
    let lc=0; for(const l of G.litter) if(Math.abs(l.x-v.x)<20&&Math.abs(l.y-v.y)<20) lc++; v.h-=.008*lc;
    if(!v.vip&&Math.random()<.004){const t=tileOf(v.x,v.y); if(walk[t.ty*MW+t.tx]&&G.litter.length<60) G.litter.push({id:G.uid++,x:v.x+rnd(-4,4),y:v.y+rnd(-2,2),k:'trash',c:0});}
  }
  v.h=clamp(v.h,0,1);
}
function flee(v){v.fled=true; v.targets=[{tx:GX,ty:28,pi:-1}]; v.ti=0; const c=nearestWalk(v.x,v.y); v.path=bfs(c.tx,c.ty,GX,28)||[]; v.st='walk';}
function inspect(v){
  const tot=G.animals.length||1, sick=G.animals.filter(a=>a.dis.length).length, loose=G.animals.filter(a=>a.st==='loose').length;
  const score=1-(sick/tot)*.9-Math.min(.4,G.litter.length*.03)-loose*.15;
  if(score>.55){G.money+=1500; G.rep+=8; ticker('Inspektor zachwycony! Dotacja +1500 zł, sława rośnie.','good'); snd('win');}
  else{G.money-=600; G.rep-=10; ticker('Inspektor oburzony! Kara −600 zł i fatalna prasa.','alarm'); snd('lose');}
}

