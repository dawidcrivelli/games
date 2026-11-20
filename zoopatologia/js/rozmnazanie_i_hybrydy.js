/* ================= rozmnażanie i hybrydy ================= */
function updateBreed(pl,pi,dt){
  const an=G.animals.filter(a=>a.pen===pi), ad=an.filter(a=>a.st==='pen'&&!a.baby);
  if(ad.length<2||an.length>=CAP||G.animals.length>=MAXA){pl.bt=0; return;}
  pl.bt=(pl.bt||0)+dt*(G.res.done.fert?2:1);
  if(pl.bt>BREED-6&&Math.random()<dt*3){const p=pick(ad); PT.push({x:p.x+rnd(-4,4),y:p.y-animalHeight(p),vx:rnd(-4,4),vy:-12,life:1,max:1,c:'#ff4d7a',s:2,heart:1});}
  if(pl.bt>=BREED){pl.bt=0; birth(pl,pi,ad);}
}
function birth(pl,pi,ad){
  const p1=pick(ad), sick=ad.some(a=>a.dis.length);
  const ch=(sick?.45:.06)*(G.res.done.fert?1.5:1);
  const b=mkAnimal(pl.sp,pi); b.baby=true; b.age=0; b.x=p1.x+rnd(-5,5); b.y=p1.y+rnd(-2,2); b.wx=b.x; b.wy=b.y;
  if(p1.hy&&Math.random()<.5) b.hy=p1.hy;
  else if(Math.random()<ch) b.hy=pick(SPK.filter(k=>k!==pl.sp));
  G.animals.push(b); snd('baby');
  for(let i=0;i<8;i++) PT.push({x:b.x+rnd(-8,8),y:b.y-rnd(4,14),vx:rnd(-10,10),vy:rnd(-20,-8),life:1,max:1,c:'#ff4d7a',s:2,heart:1});
  if(b.hy&&!p1.hy){G.hyb++; G.rep+=3; ticker(`Urodził się hybryd: ${hybName(b.sp,b.hy)}! Tłumy szaleją.`,'good'); sparkle(b.x,b.y,'#ffe27a');
    hint('hyb','Hybrydy przyciągają trzy razy więcej gości, ale częściej łapią mutacje.');}
  else ticker(`Narodziny! Mały ${spName(b).toLowerCase()} ${b.name} przyszedł na świat.`,'good');
}

