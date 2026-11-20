/* ================= zdarzenia ================= */
function randomEvent(){
  const ok={rain:3,vip:4,ufo:5,quake:6};
  const ev=LV().ev.filter(e=>G.day>=ok[e]); if(G.animals.some(a=>has(a,'kosmita'))) ev.push('ufo','ufo'); if(!ev.length) return;
  const e=pick(ev);
  if(e==='rain'){G.rain=4; ticker('Mutagenny deszcz! Chowajcie zwierzęta… a, nie da się.','alarm'); snd('sick');}
  else if(e==='vip'){spawnVisitor(true); ticker('Inspektor Ministerstwa Normalności wchodzi do zoo!','alarm'); snd('bad');}
  else if(e==='quake'){G.shake=2.2; snd('quake'); G.plots.forEach(pl=>{if(pl.k==='bld'&&MACH.includes(pl.b)) pl.wear=Math.min(99,pl.wear+25);}); ticker('Trzęsienie ziemi! Maszyny się rozklekotały.','alarm');}
  else spawnUfo();
}
function spawnUfo(){
  if(G.ufo) return; const c=G.animals.filter(a=>a.st==='pen'); if(!c.length) return; const km=c.filter(a=>has(a,'kosmita')); const a=km.length?pick(km):pick(c);
  G.ufo={x:a.x-220,y:a.y-180,a:a.id,st:'in',hp:7,bt:0};
  ticker('UFO nad zoo! Tapnij spodek kilka razy, żeby go przegonić!','alarm'); snd('ufo');
}
function updateUfo(dt){
  const u=G.ufo; if(!u) return; const a=byId(u.a);
  if(u.st==='in'){if(!a||a.st!=='pen'){u.st='out'; return;} const gx=a.x, gy=a.y-64, dx=gx-u.x, dy=gy-u.y, d=Math.hypot(dx,dy);
    if(d<3){u.st='beam'; u.bt=0; a.st='abduct'; clearClaims(a); snd('ufo');} else {u.x+=dx/d*Math.min(d,90*dt); u.y+=dy/d*Math.min(d,90*dt);}}
  else if(u.st==='beam'){if(!a||a.st!=='abduct'){u.st='out'; return;} u.bt+=dt; u.x=a.x+Math.sin(u.bt*4)*3;
    if(u.bt>8){a.st='gone'; G.lost++; G.rep-=3; ticker(`Kosmici porwali: ${a.name}!`,'alarm'); snd('bad'); u.st='out';}}
  else {u.y-=dt*140; u.x+=dt*70; if(u.y<-200) G.ufo=null;}
}
function hitUfo(){
  const u=G.ufo; u.hp--; snd('zap'); G.shake=.15; sparkle(u.x,u.y,'#ffd23f');
  if(u.hp<=0&&u.st!=='out'){const a=byId(u.a); if(a&&a.st==='abduct'){a.st='pen'; a.alt=has(a,'balon')?a.alt:0; a.wait=1;} u.st='out'; G.money+=300; G.rep+=3; ticker('Kosmici przegonieni! Nagroda +300 zł.','good'); snd('cure');}
}

