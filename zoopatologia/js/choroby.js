/* ================= choroby ================= */
function unlockedDis(){return DIS_IDS.filter(disOn);}
function addDis(a,id){if(has(a,id)||a.dis.length>=2) return false; a.dis.push({id,know:(G.res.done['vac:'+id]||G.disc[id])?2:0,guess:null}); a.tm[id]=rnd(2,5); if(id==='gigant') a.tm.g=0; if(id==='mini') a.tm.m=0; return true;}
function removeDis(a,id){a.dis=a.dis.filter(d=>d.id!==id); delete a.tm[id]; if(id==='balon') a.alt=0; if(id==='toster') a.tm.tr=0;}
function pickDisease(){
  const pool=unlockedDis(); if(!pool.length) return null;
  const w=pool.map(k=>G.res.done['vac:'+k]?.15:1), tot=w.reduce((s,x)=>s+x,0); let r=Math.random()*tot;
  for(let i=0;i<pool.length;i++){r-=w[i]; if(r<=0) return pool[i];} return pool[pool.length-1];
}
function infectRandom(n){
  let c=[]; G.animals.forEach(a=>{if(a.st==='pen'&&!a.dis.length&&!a.baby){c.push(a); if(a.hy) c.push(a);}});
  for(let k=0;k<(n||1)&&c.length;k++){
    const a=pick(c), id=pickDisease(); if(!id) return; c=c.filter(b=>b!==a); addDis(a,id);
    ticker(`${a.name} (${spName(a).toLowerCase()}) zachowuje się dziwnie!`,'alarm'); snd('sick');
    for(let i=0;i<10;i++) PT.push({x:a.x,y:a.y-10,vx:rnd(-20,20),vy:rnd(-30,-5),life:.8,max:.8,c:'#7dff6a',s:2});
  }
  hint('sick','Tapnij zwierzę ze znakiem ?, żeby zobaczyć objawy i wysłać je na leczenie.');
}
function scare(x,y,r,amt,ic){V.forEach(v=>{if(Math.hypot(v.x-x,v.y-y)<r){v.h-=amt; emote(v,ic);}});}
function emote(v,ic){v.emo=ic; v.emoT=1.6;}
function effects(a,dt){
  if(a.fire>0) a.fire-=dt; if(a.chomp>0) a.chomp-=dt;
  for(const d of a.dis.slice()){
    const id=d.id; a.tm[id]=(a.tm[id]??3)-dt;
    switch(id){
      case 'zyrafodyl': if(a.tm[id]<=0){a.tm[id]=rnd(2.5,4); a.chomp=.4; snd('chomp'); scare(a.x,a.y-10,36,.15,'bang');} break;
      case 'toster': a.tm.tr=a.tm[id]<1.2?1:0; if(a.tm[id]<=0){a.tm[id]=rnd(5,8); shootToast(a);} break;
      case 'laser': if(a.tm[id]<=0){a.tm[id]=rnd(4,7); fireLaser(a);} break;
      case 'disco': if(Math.random()<dt*2.5) PT.push({x:a.x+rnd(-8,8),y:a.y-animalHeight(a),vx:rnd(-6,6),vy:-14,life:1.2,max:1.2,c:`hsl(${Math.random()*360},90%,60%)`,s:2,note:1});
        if(a.tm[id]<=0){a.tm[id]=rnd(16,22); spreadDisco(a);} break;
      case 'gadul': if(a.tm[id]<=0){a.tm[id]=rnd(6,9); BB.push({a:a.id,text:pick(LINES),life:3.6}); scare(a.x,a.y,52,.08,'dots');} break;
      case 'teleport': if(a.tm[id]<=0){a.tm[id]=rnd(7,11); if(a.st==='pen'||a.st==='loose') teleport(a);} break;
      case 'balon': a.alt+=dt*.55; if(a.alt>40){flyAway(a); return;} break;
      case 'gigant': a.tm.g=(a.tm.g||0)+dt; if(a.st==='pen'&&a.tm.g>25){a.tm.g=0; breakOut(a);} break;
      case 'klon': if(a.tm[id]<=0){a.tm[id]=rnd(35,45); clone(a);} break;
      case 'skrzyd': if(a.tm[id]<=0){a.tm[id]=rnd(20,30); if(a.st==='pen') flyOut(a);} break;
      case 'ogien': if(a.tm[id]<=0){a.tm[id]=rnd(5,7); breathFire(a);} break;
      case 'grzyb': if(Math.random()<dt*1.5) PT.push({x:a.x+rnd(-6,6),y:a.y-animalHeight(a)+2,vx:rnd(-5,5),vy:-6,life:1.2,max:1.2,c:pick(['#ff6fb0','#ffd23f','#7dff6a','#4aa8ff']),s:1,heart:0,rain:0,float:1});
        if(a.tm[id]<=0){a.tm[id]=rnd(22,28); spreadIn(a,'grzyb','Grzybica się szerzy!');} break;
      case 'rakieta': if(a.st==='pen'&&Math.random()<dt*5) PT.push({x:a.x-a.face*8,y:a.y-8,vx:rnd(-6,6),vy:rnd(2,10),life:.4,max:.4,c:'#ffb000',s:1});
        if(a.tm[id]<=0){a.tm[id]=rnd(16,22); if(a.st==='pen') launch(a);} break;
      case 'magnes': for(const l of G.litter){if(l.c) continue; const dx=a.x-l.x, dy=a.y-l.y, d=Math.hypot(dx,dy); if(d<50&&d>6){l.x+=dx/d*12*dt; l.y+=dy/d*12*dt;}}
        if(a.tm[id]<=0){a.tm[id]=rnd(7,10); magnet(a);} break;
      case 'wielogl': if(a.tm[id]<=0){a.tm[id]=rnd(7,10); BB.push({a:a.id,text:pick(ARGUE),life:2.6});} break;
      case 'robot': if(a.tm[id]<=0){a.tm[id]=rnd(4,8); snd('beep'); PT.push({x:a.x+rnd(-6,6),y:a.y-animalHeight(a),vx:0,vy:-8,life:.5,max:.5,c:'#ffe14d',s:1});} break;
      case 'kosmita': if(Math.random()<dt*2) PT.push({x:a.x+rnd(-8,8),y:a.y-rnd(4,20),vx:0,vy:-6,life:.8,max:.8,c:'#b6ff8a',s:1}); break;
      case 'mini': a.tm.m=(a.tm.m||0)+dt; if(a.tm.m>90&&a.st==='pen'){lostTiny(a); return;} break;
    }
  }
}
function shootToast(a){
  const t=tileOf(a.x,a.y), tg=randomWalkNear(t.tx,t.ty,3);
  PR.push({x0:a.x,y0:a.y-14,x1:tg.tx*TS+rnd(3,13),y1:tg.ty*TS+rnd(4,14),t:0,dur:.7}); snd('pop');
}
function fireLaser(a){
  const hp=headPos(a); const x1=hp.x+a.face*rnd(30,70), y1=a.y+rnd(-24,24);
  BM.push({x0:hp.x,y0:hp.y,x1,y1,life:.35}); a.fire=.4; snd('pew');
  const t=tileOf(x1,y1); if(walk[t.ty*MW+t.tx]&&G.litter.length<80) G.litter.push({id:G.uid++,x:x1,y:y1,k:'scorch',c:0});
  scare(x1,y1,16,.2,'bang');
}
function spreadIn(a,id,msg){
  if(a.st!=='pen') return; const c=G.animals.filter(b=>b.pen===a.pen&&b.st==='pen'&&!b.dis.length);
  if(c.length){const b=pick(c); addDis(b,id); ticker(`${msg} ${b.name} też to ma.`);}
}
function flyOut(a){
  clearClaims(a); const g=gatePt(G.plots[a.pen]); a.x=g.x; a.y=g.y+8; a.st='loose'; a.path=null; a.wait=.5;
  for(let i=0;i<12;i++) PT.push({x:a.x+rnd(-8,8),y:a.y-rnd(6,20),vx:rnd(-20,20),vy:rnd(-20,0),life:1.2,max:1.2,c:'#ffffff',s:2});
  ticker(`${a.name} przefruwa nad płotem!`,'alarm'); snd('boing');
}
function breathFire(a){
  const hp=headPos(a); snd('fire');
  for(let i=0;i<18;i++) PT.push({x:hp.x,y:hp.y+2,vx:a.face*rnd(40,90),vy:rnd(-12,12),life:rnd(.3,.6),max:.6,c:pick(['#ffd23f','#ff8c1a','#ff3a2a','#fff3a0']),s:2,rain:1});
  const tx=hp.x+a.face*36, ty=hp.y+12; scare(tx,ty,30,.2,'bang');
  const t=tileOf(tx,a.y+rnd(-6,10)); if(walk[t.ty*MW+t.tx]&&G.litter.length<80) G.litter.push({id:G.uid++,x:t.tx*TS+rnd(3,13),y:t.ty*TS+rnd(4,14),k:'scorch',c:0});
}
function launch(a){
  clearClaims(a); let tg; for(let k=0;k<40;k++){tg={tx:ri(1,MW-2),ty:ri(1,27)}; if(walk[tg.ty*MW+tg.tx]&&grid[tg.ty*MW+tg.tx]!==T_PLOT) break;}
  a.rk={x0:a.x,y0:a.y,x1:tg.tx*TS+8,y1:tg.ty*TS+12,t:0}; a.st='rocket'; snd('rocket'); ticker(`${a.name} odpala rakietę!`,'alarm');
}
function magnet(a){
  let n=0; for(const v of V){if(n>=3) break; if(Math.hypot(v.x-a.x,v.y-a.y)<64){n++; v.h-=.1; emote(v,'bang');
    for(let i=0;i<3;i++) PT.push({x:v.x,y:v.y-10,vx:(a.x-v.x)*1.5+rnd(-8,8),vy:(a.y-v.y)*1.5-10,life:.6,max:.6,c:'#ffd23f',s:2,rain:1});}}
  if(n){G.money-=10*n; floatW(a.x,a.y-26,`−${10*n} zł`,'#ffd23f'); snd('cash');}
}
function lostTiny(a){clearClaims(a); a.st='gone'; G.lost++; G.rep-=3; ticker(`${a.name} był tak mały, że zgubił się w trawie.`,'alarm'); snd('bad');}
function spreadDisco(a){
  if(a.st!=='pen') return;
  const c=G.animals.filter(b=>b.pen===a.pen&&b.st==='pen'&&!b.dis.length);
  if(c.length){const b=pick(c); addDis(b,'disco'); ticker(`Disco się szerzy! ${b.name} też tańczy.`);}
}
function sparkle(x,y,c){for(let i=0;i<14;i++) PT.push({x:x+rnd(-8,8),y:y-rnd(0,18),vx:rnd(-25,25),vy:rnd(-25,10),life:.7,max:.7,c:c||'#bff6ff',s:2});}
function teleport(a){
  sparkle(a.x,a.y); snd('tele'); clearClaims(a);
  if(Math.random()<.5){const p=randInPen(G.plots[a.pen]); a.x=p.x; a.y=p.y; a.st='pen'; a.wx=p.x; a.wy=p.y;}
  else{let t; for(let k=0;k<40;k++){t={tx:ri(1,MW-2),ty:ri(1,27)}; if(walk[t.ty*MW+t.tx]&&grid[t.ty*MW+t.tx]!==T_PLOT) break;}
    a.x=t.tx*TS+8; a.y=t.ty*TS+12; a.st='loose'; a.path=null; a.wait=1;
    hint('loose','Zwierzę na wolności straszy gości! Tapnij je, żeby złapać, albo zatrudnij ochroniarza.');}
  sparkle(a.x,a.y);
}
function clearClaims(a){
  G.plots.forEach(pl=>{if(pl.k==='bld'){pl.queue=pl.queue.filter(id=>id!==a.id);}});
  G.staff.forEach(s=>{if((s.role==='vet'||s.role==='guard')&&s.tgt===a.id){s.tgt=null; s.st='idle'; s.path=null;}});
  a.vc=0; a.gc=0;
}
function flyAway(a){
  clearClaims(a); a.st='fly'; a.fly=2.5; G.lost++; G.rep-=4;
  ticker(`${a.name} odlatuje w stratosferę! Żegnaj.`,'alarm'); snd('bad');
  if(SEL&&SEL.t==='a'&&SEL.id===a.id) closePanel();
}
function breakOut(a){
  clearClaims(a); const g=gatePt(G.plots[a.pen]); a.x=g.x; a.y=g.y+6; a.st='loose'; a.path=null; a.wait=.3; G.shake=.5;
  ticker(`${a.name} rozwala płot i idzie na spacer!`,'alarm'); snd('crash');
  for(let i=0;i<16;i++) PT.push({x:g.x,y:g.y,vx:rnd(-40,40),vy:rnd(-50,-10),life:.8,max:.8,c:'#a8743f',s:3});
  hint('loose','Zwierzę na wolności straszy gości! Tapnij je, żeby złapać, albo zatrudnij ochroniarza.');
}
function clone(a){
  if(G.animals.length>=MAXA) return;
  const first=a.name.split(' ')[0]; G.cn[first]=(G.cn[first]||0)+1;
  const b=mkAnimal(a.sp,a.pen); b.name=first+' '+ROMAN[Math.min(G.cn[first]-1,ROMAN.length-1)]; b.hy=a.hy;
  b.dis=[{id:'klon',know:G.disc.klon?2:0,guess:null}]; b.tm={klon:rnd(35,45)};
  const cnt=G.animals.filter(x=>x.pen===a.pen).length, loose=G.animals.filter(x=>x.st==='loose').length;
  if(a.st==='pen'&&cnt<CAP){b.x=a.x+rnd(-6,6); b.y=a.y+rnd(-3,3);}
  else if(loose<3){const g=gatePt(G.plots[a.pen]); b.x=g.x; b.y=g.y+8; b.st='loose';}
  else return;
  G.animals.push(b); sparkle(b.x,b.y,'#ffe27a'); snd('boing');
  ticker(`${a.name} ma kopię zapasową: ${b.name}.`);
}

