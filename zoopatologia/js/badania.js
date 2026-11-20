/* ================= badania ================= */
function projects(){
  const L=[], pool=LV().pool;
  if(pool.some(d=>!G.disc[d])) L.push({id:'prog',n:'Prognoza mutacji',d:'Odkrywa kolejną mutację, zanim tu dotrze: nazwę i budynek.',c:50});
  if(!G.res.done.diag) L.push({id:'diag',n:'Lepsza diagnoza',d:'Weterynarz trafia w 95% zamiast 75%.',c:70});
  if(!G.res.done.fert) L.push({id:'fert',n:'Inkubator miłości',d:'Dwa razy szybsze rozmnażanie i częstsze hybrydy.',c:70});
  pool.filter(d=>G.disc[d]&&!G.res.done['vac:'+d]).forEach(d=>L.push({id:'vac:'+d,n:'Szczepionka: '+DIS[d].n,d:'Ta mutacja trafia się o 85% rzadziej, a nowe przypadki są od razu zdiagnozowane.',c:80}));
  MACH.filter(b=>!G.res.done['turbo:'+b]).forEach(b=>L.push({id:'turbo:'+b,n:'Turbo: '+BLD[b].n,d:'Leczenie o 45% szybsze, zużycie o połowę wolniejsze.',c:100}));
  return L;
}
function sciInLab(){return G.staff.filter(s=>s.role==='sci'&&s.st==='in').length;}
function updateResearch(dt){
  if(!G.res.cur&&sciInLab()>0){const pr=projects(); const p=pr.find(x=>x.id==='prog')||pr[0]; if(p){G.res.cur=p.id; G.res.cost=p.c; G.res.pts=0; ticker(`Naukowcy zaczynają badanie: ${p.n}. Zmienisz je w zakładce Badania.`,'good'); if(SEL&&SEL.t==='research') panelSig='';}}
  if(!G.res.cur) return;
  G.res.pts+=sciInLab()*dt;
  if(G.res.pts>=G.res.cost){
    const id=G.res.cur; G.res.cur=null; G.res.pts=0; snd('res'); $('#resBtn').classList.add('hot');
    if(id==='prog'){const nd=LV().pool.slice().sort((x,y)=>DIS[x].day-DIS[y].day).find(d=>!G.disc[d]); if(nd){discover(nd,true); ticker(`Prognoza: nadchodzi ${DIS[nd].n}. Leczy ją: ${BLD[DIS[nd].b].n}.`,'good');}}
    else{G.res.done[id]=1; const p=id.split(':'); ticker(`Badania zakończone: ${p[0]==='vac'?'szczepionka na '+DIS[p[1]].n:p[0]==='turbo'?'turbo dla '+BLD[p[1]].n:id==='diag'?'lepsza diagnoza':'inkubator miłości'}!`,'good');}
    if(SEL&&SEL.t==='research') panelSig='';
  }
}

