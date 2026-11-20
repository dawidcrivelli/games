/* ================= pętla ================= */
function attraction(){let s=0; for(const a of G.animals){if(a.st!=='pen') continue; const m=(a.hy?3:1)*(a.baby?1.5:1); if(!a.dis.length) s+=SPEC[a.sp].a*m; else if(has(a,'disco')) s+=SPEC[a.sp].a*m+1;} return s;}
function dayTick(){
  const interest=Math.round(G.loan*.02);
  const cost=G.animals.length*6+G.staff.reduce((s,x)=>s+STAFF[x.role].pay,0)+interest;
  G.money-=cost;
  const nu=LV().pool.filter(k=>Math.max(1,Math.round(DIS[k].day*LV().dayMul))===G.day&&G.day>1);
  ticker(nu.length?`Dzień ${G.day}: w okolicy krążą nowe mutacje!`:`Dzień ${G.day}: pensje, karma${interest?' i odsetki':''} −${cost} zł.`,nu.length?'alarm':'');
}
function update(dt){
  G.time+=dt;
  const day=1+Math.floor(G.time/DAYLEN); if(day!==G.day){G.day=day; dayTick();}
  G.nextDis-=dt; if(G.nextDis<=0){G.nextDis=Math.max(5,22-G.day*.4)/LV().rate*rnd(.7,1.3); infectRandom(1);}
  G.nextEv-=dt; if(G.nextEv<=0){G.nextEv=rnd(70,110); randomEvent();}
  if(G.rain>0){G.rain-=dt; for(let i=0;i<4;i++) PT.push({x:cam.x+Math.random()*VW/cam.z,y:cam.y-10+Math.random()*30,vx:-20,vy:160,life:1.2,max:1.2,c:'rgba(125,255,106,.8)',s:1,rain:1}); if(G.rain<=0) infectRandom(3);}
  const rate=(.1+.025*attraction())*(.3+G.rep/100)*(1-.45*nightF()); spawnAcc+=rate*dt;
  CLOUDS.forEach(c=>{c.x+=c.v*dt; if(c.x>MW*TS+80) c.x=-80;});
  BIRDT-=dt; if(BIRDT<=0){BIRDT=rnd(18,40); if(nightF()<.3){const y=rnd(40,MH*TS-120), dir=Math.random()<.5?1:-1, n=ri(3,6); for(let i=0;i<n;i++) BIRDS.push({x:dir>0?-20-i*10:MW*TS+20+i*10,y:y+Math.abs(i-n/2)*6,v:dir*rnd(40,55),ph:Math.random()*6});}}
  BIRDS.forEach(b=>{b.x+=b.v*dt; b.ph+=dt*10;}); BIRDS=BIRDS.filter(b=>b.x>-100&&b.x<MW*TS+100);
  while(spawnAcc>=1){spawnAcc-=1; if(V.length<MAXV&&G.plots.some(p=>p.k==='pen')) spawnVisitor(false);}
  for(const a of G.animals) updateAnimal(a,dt);
  if(G.animals.some(a=>a.st==='gone')){G.animals=G.animals.filter(a=>a.st!=='gone');}
  for(const v of V) updateVisitor(v,dt); V=V.filter(v=>!v.done);
  for(const s of G.staff) updateStaff(s,dt);
  G.plots.forEach((pl,i)=>{if(pl.k==='bld') updateBld(pl,i,dt); else if(pl.k==='pen') updateBreed(pl,i,dt);});
  updateResearch(dt); updateUfo(dt);
  for(const p of PR){p.t+=dt; if(p.t>=p.dur){p.done=1; if(G.litter.length<80) G.litter.push({id:G.uid++,x:p.x1,y:p.y1,k:'toast',c:0}); scare(p.x1,p.y1,14,.2,'bang');}} PR=PR.filter(p=>!p.done);
  BM.forEach(b=>b.life-=dt); BM=BM.filter(b=>b.life>0);
  BB.forEach(b=>b.life-=dt); BB=BB.filter(b=>b.life>0&&byId(b.a));
  const loose=G.animals.filter(a=>a.st==='loose').length; G.rep-=.04*loose*dt;
  G.rep=clamp(G.rep,0,100); if(G.shake>0) G.shake-=dt;
  checkEnd();
}
function fxUpdate(dt){
  PT.forEach(p=>{p.x+=p.vx*dt; p.y+=p.vy*dt; if(!p.rain&&!p.heart) p.vy+=30*dt; p.life-=dt;}); PT=PT.filter(p=>p.life>0); if(PT.length>600) PT.splice(0,PT.length-600);
  FT.forEach(f=>{f.y-=14*dt; f.life-=dt;}); FT=FT.filter(f=>f.life>0);
}
function goalVal(k){return k==='rep'?Math.round(G.rep):k==='cured'?G.cured:k==='animals'?G.animals.length:k==='hyb'?G.hyb:Math.round(G.money-G.loan);}
function activeGoals(){const g=LV().goals; return GOALDEF.filter(d=>g[d.k]>0).map(d=>({...d,need:g[d.k]}));}
function checkEnd(){
  if(G.over) return;
  if(G.money<-1000) return endGame(false,'Bankructwo','Komornik zabrał nawet żyrafodyla. Zoo zamknięte.');
  if(G.rep<=0) return endGame(false,'Zamknięte przez sanepid','Sława spadła do zera. Ostatni gość uciekł z krzykiem.');
  if(activeGoals().every(g=>goalVal(g.k)>=g.need)) return endGame(true,'Zoo Roku!',`${LV().n} zdobywa order Ministerstwa Normalności. Nikt nie wie dlaczego.`);
}
function endGame(win,title,text){
  G.over=true; running=false; snd(win?'win':'lose'); try{localStorage.removeItem(SAVEKEY);}catch(e){}
  const m=Math.floor(G.time/60), last=G.lvl>=LEVELS.length-1;
  if(win) setUnl(G.lvl+1);
  const btn=win?(last?`<p><b>Kampania ukończona!</b> Twoje imperium zoopatologiczne obejmuje cztery zoo i jedną bazę kosmiczną.</p><button class="act go" data-m="menu">Menu główne</button>`
    :`<button class="act go" data-m="lvl" data-l="${G.lvl+1}">Następne zoo: ${LEVELS[G.lvl+1].n}</button><button class="act" data-m="menu">Menu główne</button>`)
    :`<button class="act go" data-m="lvl" data-l="${G.lvl}">Spróbuj jeszcze raz</button><button class="act" data-m="menu">Menu główne</button>`;
  showModal(`<div class="title" style="font-size:44px">${title}</div><p>${text}</p>
   <p class="sub">Czas: ${m} min · Dzień ${G.day}<br>Wyleczonych: ${G.cured} · Utraconych: ${G.lost} · Hybryd: ${G.hyb} · Gości: ${G.visits}</p>${btn}`);
}

