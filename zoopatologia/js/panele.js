/* ================= panele ================= */
const panel=$('#panel'); let panelSig='';
let panelT=0;
function select(t,id){SEL={t,id}; panelSig=''; panelT=performance.now(); panel.classList.remove('hide'); renderPanel();}
function openUI(k){SEL={t:k}; panelSig=''; panel.classList.remove('hide'); if(k==='research') $('#resBtn').classList.remove('hot'); renderPanel();}
function closePanel(){SEL=null; panel.classList.add('hide'); panelSig='';}
const money=n=>`${Math.round(n)} zł`;
function animalStatus(a){
  switch(a.st){case 'pen':return a.baby?'Maluch na wybiegu':'Na wybiegu'; case 'walk':return a.goal==='bld'?`Idzie do: ${G.plots[a.dest]&&BLD[G.plots[a.dest].b]?BLD[G.plots[a.dest].b].n:'budynku'}`:'Wraca na wybieg';
    case 'queue':return 'Czeka w kolejce'; case 'in':return 'W trakcie leczenia'; case 'loose':return 'Uciekł! Straszy gości'; case 'abduct':return 'Porywany przez UFO!'; case 'rocket':return 'Leci na rakiecie!'; default:return '';}
}
function renderPanel(){
  if(!SEL||!G) return;
  let sig='', html='';
  const X='<button class="x px" data-act="close" aria-label="Zamknij">✕</button>';
  if(SEL.t==='a'){
    const a=byId(SEL.id); if(!a){closePanel(); return;}
    sig='a'+a.id+a.st+a.baby+JSON.stringify(a.dis)+G.plots.filter(p=>p.k==='bld').length+Math.round(a.alt/5)+G.animals.filter(o=>o.dis.length&&['pen','loose'].includes(o.st)).length;
    if(sig===panelSig) return;
    let dh='';
    if(a.hy) dh+=`<div class="dis k2"><b>Hybryda!</b> Przyciąga trzy razy więcej gości, ale częściej łapie mutacje.</div>`;
    if(!a.dis.length) dh+='<div class="dis k2">Zdrowy jak ryba. Albo jak żyrafa.</div>';
    a.dis.forEach(d=>{const D=DIS[d.id];
      if(d.know===2) dh+=`<div class="dis k2"><b>${D.n}</b><br>Leczenie: ${BLD[D.b].n}</div>`;
      else if(d.know===1) dh+=`<div class="dis">Weterynarz zgaduje: <b>${DIS[d.guess].n}</b><br><span class="sub">Objawy: ${D.sym}</span></div>`;
      else dh+=`<div class="dis"><b>Nieznana mutacja</b><br><span class="sub">Objawy: ${D.sym}</span></div>`;});
    if(has(a,'balon')) dh+=`<div class="sub">Wysokość: ${Math.round(a.alt)} / 40. Zaraz odleci!</div>`;
    const blds=MACH.filter(b=>G.plots.some(p=>p.k==='bld'&&p.b===b));
    const sug=new Set(a.dis.map(d=>d.know===2?DIS[d.id].b:d.know===1?DIS[d.guess].b:'skaner'));
    const can=['pen','loose','walk'].includes(a.st);
    let acts='';
    if(a.dis.length){
      if(!blds.length) acts='<div class="sub">Nie masz jeszcze żadnej kliniki. Postaw ją na pustej działce.</div>';
      else acts='<div class="sub" style="margin-top:6px">Wyślij do (★ = zalecane):</div><div class="acts">'+blds.map(b=>`<button class="act ${sug.has(b)?'go':''}" data-act="send" data-b="${b}" ${can?'':'disabled'}>${sug.has(b)?'★ ':''}${BLD[b].n}</button>`).join('')+'</div>';
      a.dis.filter(d=>d.know===2&&blds.includes(DIS[d.id].b)).forEach(d=>{const n=G.animals.filter(o=>o.dis.some(x=>x.id===d.id&&x.know===2)&&['pen','loose'].includes(o.st)).length;
        if(n>1) acts+=`<div class="acts"><button class="act go" data-act="sendAll" data-d="${d.id}">Wyślij wszystkich z: ${DIS[d.id].n} (${n})</button></div>`;});
    }
    if(a.st==='walk'&&a.goal==='bld') acts+=`<div class="acts"><button class="act" data-act="home">Zawróć na wybieg</button></div>`;
    html=`<div class="ph"><img class="por" src="${portrait(a)}" alt=""><div class="t"><h2>${a.name}</h2><div class="sub">${spName(a)}${a.baby?' (maluch)':''} · ${animalStatus(a)}</div></div>${X}</div>${dh}${acts}`;
  }
  else if(SEL.t==='p'){
    const pl=G.plots[SEL.id];
    if(pl.k===null){
      sig='pe'+SEL.id+Math.floor(G.money/50)+Object.keys(G.disc).length+(SEL.pick||''); if(sig===panelSig) return;
      const pk=(t,k)=>SEL.pick===t+k, prc=(t,k,p)=>pk(t,k)?'Tapnij znowu: kup!':money(p);
      const sc=SPK.map(k=>{const s=SPEC[k]; return `<button class="card px ${G.money<s.p?'poor':''} ${pk('buyPen',k)?'pick':''}" data-act="buyPen" data-k="${k}"><img src="${spPortrait(k)}" alt=""><span class="nm">${s.pl}</span><span class="sub">para · ${{ice:'lód',swamp:'bagno',sav:'sawanna',jungle:'dżungla',desert:'pustynia'}[s.hab]}</span><span class="pr">${prc('buyPen',k,s.p)}</span></button>`;}).join('');
      const bc=BLD_IDS.map(k=>{const b=BLD[k]; let txt;
        if(k==='skaner') txt='Pewna diagnoza'; else if(k==='lab') txt='Badania i szczepionki';
        else {const cures=DIS_IDS.filter(d=>DIS[d].b===k&&LV().pool.includes(d)); const known=cures.filter(d=>G.disc[d]).map(d=>DIS[d].n); const unk=cures.length-known.length; txt='Leczy: '+[...known,...(unk?[`??? ×${unk}`]:[])].join(', ');}
        return `<button class="card px ${G.money<b.p?'poor':''} ${pk('buyBld',k)?'pick':''}" data-act="buyBld" data-k="${k}"><img class="bth" src="${bldThumb(k)}" alt=""><span class="nm">${b.n}</span><span class="sub">${txt}</span><span class="pr">${prc('buyBld',k,b.p)}</span></button>`;}).join('');
      html=`<div class="ph"><div class="t"><h2>Wolna działka</h2><div class="sub">Postaw wybieg albo budynek.</div></div>${X}</div><h3>Wybiegi</h3><div class="cards">${sc}</div><h3>Budynki</h3><div class="cards">${bc}</div>`;
    } else if(pl.k==='ruin'){
      sig='pr'+SEL.id+Math.floor(G.money/50); if(sig===panelSig) return;
      html=`<div class="ph"><div class="t"><h2>Gruzowisko</h2><div class="sub">Tu stała ${BLD[pl.b].n}. Stała.</div></div>${X}</div><div class="acts"><button class="act go" data-act="clear" ${G.money<300?'disabled':''}>Uprzątnij gruz (300 zł)</button></div>`;
    } else if(pl.k==='pen'){
      const an=G.animals.filter(a=>a.pen===SEL.id), s=SPEC[pl.sp], ad=an.filter(a=>a.st==='pen'&&!a.baby).length;
      const left=Math.max(0,Math.ceil((BREED-(pl.bt||0))/(G.res.done.fert?2:1)));
      const bre=an.length>=CAP?'Wybieg pełny, młodych nie będzie.':ad<2?'Potrzeba dwóch dorosłych na wybiegu.':`Następne młode za około ${left} s.`;
      sig='pp'+SEL.id+an.map(a=>a.id+a.dis.length+a.st+a.baby).join()+Math.floor(G.money/50)+Math.floor(left/5); if(sig===panelSig) return;
      const list=an.map(a=>`<button class="card px" data-act="selA" data-id="${a.id}"><img src="${portrait(a)}" alt=""><span class="nm">${a.name}</span><span class="sub">${a.hy?hybName(a.sp,a.hy)+' · ':''}${a.baby?'maluch · ':''}${a.dis.length?(a.dis.some(d=>d.know===0)?'chory: ???':'chory'):'zdrowy'}</span></button>`).join('');
      const price=Math.round(s.p/2);
      html=`<div class="ph"><div class="t"><h2>Wybieg: ${s.pl}</h2><div class="sub">${an.length} / ${CAP} zwierząt · ${bre}</div></div>${X}</div>
        <div class="acts"><button class="act go" data-act="addA" ${an.length>=CAP||G.money<price?'disabled':''}>Dokup zwierzę (${money(price)})</button>${an.length?'':`<button class="act danger" data-act="demo">Zburz (+${money(s.p/2)})</button>`}</div><div class="cards">${list}</div>`;
    } else {
      const B=BLD[pl.b]; sig='pb'+SEL.id+pl.queue.length+(pl.cur?1:0)+Object.keys(G.disc).length+Math.floor(pl.wear/5)+Math.floor(G.money/50)+(pl.b==='lab'?labStaff(pl).length:''); if(sig===panelSig) return;
      let info;
      if(pl.b==='lab') info=`<div class="row">Naukowcy w środku: ${labStaff(pl).length} / 3 · Projekt: ${G.res.cur?projects().find(p=>p.id===G.res.cur)?.n||'w toku':'brak'}</div>`;
      else{const cures=DIS_IDS.filter(d=>DIS[d].b===pl.b&&LV().pool.includes(d)); const known=cures.filter(d=>G.disc[d]).map(d=>DIS[d].n);
        info=`<div class="row">${pl.b==='skaner'?'Diagnozuje wszystkie mutacje.':'Leczy: '+(known.length?known.join(', '):'')+(cures.length>known.length?` + ${cures.length-known.length} nieznane`:'')}</div>
         <div class="row">W środku: ${pl.cur?(byId(pl.cur)?.name||'pacjent'):'nikt'} · Kolejka: ${pl.queue.length}${G.res.done['turbo:'+pl.b]?' · Turbo':''}</div>
         <div class="row"><div class="grow">Zużycie: <b>${Math.round(pl.wear)}%</b>${pl.wear>85?' · zaraz wybuchnie!':''}<div class="gbar"><i style="width:${pl.wear}%;background:${pl.wear>85?'var(--bad)':pl.wear>60?'var(--warn)':'var(--accent2)'}"></i></div></div></div>`;}
      html=`<div class="ph"><div class="t"><h2>${B.n}</h2><div class="sub">${B.d}</div></div>${X}</div>${info}
       <div class="acts">${pl.b!=='lab'?`<button class="act go" data-act="service" ${G.money<150||pl.wear<1?'disabled':''}>Serwis zewnętrzny (150 zł)</button>`:''}<button class="act danger" data-act="demo">Zburz (+${money(B.p/2)})</button></div>`;
    }
  }
  else if(SEL.t==='staff'){
    sig='st'+G.staff.map(s=>s.role).join()+Math.floor(G.money/50); if(sig===panelSig) return;
    html=`<div class="ph"><div class="t"><h2>Personel</h2><div class="sub">Pensje płacisz codziennie.</div></div>${X}</div>`+
      Object.keys(STAFF).map(k=>{const s=STAFF[k], n=G.staff.filter(x=>x.role===k).length;
        return `<div class="row"><img class="por" style="width:56px;height:56px;background:#cdb594" src="${staffPortrait(k)}" alt=""><div class="grow"><b>${s.n} × ${n}</b><div class="sub">${s.d}<br>Pensja ${s.pay} zł/dzień</div></div>
         <div style="display:flex;flex-direction:column;gap:6px"><button class="act go" data-act="hire" data-k="${k}" ${G.money<s.hire?'disabled':''}>Zatrudnij ${s.hire} zł</button><button class="act" data-act="fire" data-k="${k}" ${n?'':'disabled'}>Zwolnij</button></div></div>`;}).join('');
  }
  else if(SEL.t==='research'){
    const pr=projects(), lab=G.plots.some(p=>p.k==='bld'&&p.b==='lab'), sci=G.staff.filter(s=>s.role==='sci').length, inl=sciInLab();
    sig='r'+(G.res.cur||'')+Math.floor(G.res.pts)+pr.length+Object.keys(G.disc).join()+lab+sci+inl; if(sig===panelSig) return;
    let head='';
    if(!lab) head='<div class="dis">Postaw <b>Laboratorium</b> na wolnej działce i zatrudnij naukowców.</div>';
    else if(!sci) head='<div class="dis">Laboratorium stoi puste. Zatrudnij <b>naukowców</b> w zakładce Personel.</div>';
    const cur=G.res.cur?pr.find(p=>p.id===G.res.cur):null;
    if(cur) head+=`<div class="row"><div class="grow">Teraz: <b>${cur.n}</b> · ${inl} naukowców w labie<div class="gbar"><i style="width:${clamp(G.res.pts/G.res.cost,0,1)*100}%"></i></div></div></div>`;
    const list=pr.map(p=>`<div class="proj"><div class="grow"><b>${p.n}</b><br><span class="sub">${p.d}</span></div><button class="act ${G.res.cur===p.id?'':'go'}" data-act="resSel" data-k="${p.id}" ${G.res.cur===p.id?'disabled':''}>${G.res.cur===p.id?'W toku':p.c+' pkt'}</button></div>`).join('');
    const un=LV().pool;
    const book=un.map(k=>G.disc[k]?`<div class="dis k2"><b>${DIS[k].n}</b> → ${BLD[DIS[k].b].n}${G.res.done['vac:'+k]?' · zaszczepione':''}<br><span class="sub">${DIS[k].d}</span></div>`:(disOn(k)?`<div class="dis"><b>???</b><br><span class="sub">Objawy: ${DIS[k].sym}</span></div>`:'')).join('');
    const hidden=un.filter(k=>!G.disc[k]&&!disOn(k)).length;
    html=`<div class="ph"><div class="t"><h2>Badania</h2><div class="sub">Każdy naukowiec w labie daje 1 punkt na sekundę.</div></div>${X}</div>${head}${list}
      <h3>Księga mutacji</h3>${book}${hidden?`<div class="sub" style="margin-top:8px">+ ${hidden} mutacji jeszcze nie dotarło w okolicę. Prognoza może je odkryć wcześniej.</div>`:''}`;
  }
  else if(SEL.t==='bank'){
    sig='b'+G.loan+Math.floor(G.money/50); if(sig===panelSig) return;
    const max=LV().loanMax;
    html=`<div class="ph"><div class="t"><h2>Bank Spółdzielczy „Mutant”</h2><div class="sub">Odsetki 2% dziennie od kredytu. Cel liczy gotówkę minus kredyt.</div></div>${X}</div>
     <div class="row"><div class="grow">Kredyt: <b>${money(G.loan)}</b> / ${money(max)}<div class="gbar"><i style="width:${G.loan/max*100}%;background:var(--warn)"></i></div></div></div>
     <div class="row">Odsetki: <b>${money(G.loan*.02)}</b> dziennie</div>
     <div class="acts"><button class="act go" data-act="loan" ${G.loan+2000>max?'disabled':''}>Weź 2000 zł</button><button class="act" data-act="repay" ${G.loan<2000||G.money<2000?'disabled':''}>Spłać 2000 zł</button></div>`;
  }
  else if(SEL.t==='goals'){
    sig='g'+activeGoals().map(g=>goalVal(g.k)).join(); if(sig===panelSig) return;
    html=`<div class="ph"><div class="t"><h2>${LV().n}: cele</h2><div class="sub">Spełnij wszystkie naraz. Przegrywasz przy długu ponad 1000 zł albo sławie 0.</div></div>${X}</div>`+
      activeGoals().map(g=>{const v=goalVal(g.k), p=clamp(v/g.need,0,1); return `<div class="row"><div class="grow">${g.n}: <b>${v}${g.u}</b> / ${g.need}${g.u}<div class="gbar"><i style="width:${p*100}%"></i></div></div></div>`;}).join('');
  }
  else if(SEL.t==='menu'){
    sig='m'+OPT.snd+OPT.mus+(SEL.conf?1:0); if(sig===panelSig) return;
    html=`<div class="ph"><div class="t"><h2>Menu</h2><div class="sub">${LV().n} · gra zapisuje się sama.</div></div>${X}</div>
     <div class="acts"><button class="act" data-act="snd">Dźwięk: ${OPT.snd?'tak':'nie'}</button><button class="act" data-act="mus">Muzyka: ${OPT.mus?'tak':'nie'}</button><button class="act" data-act="help">Jak grać</button>
     ${SEL.conf?'<button class="act danger" data-act="quitYes">Tak, wyjdź do mapy kampanii</button><button class="act" data-act="newNo">Anuluj</button>':'<button class="act danger" data-act="quit">Mapa kampanii</button>'}</div>`;
  }
  panelSig=sig; panel.innerHTML=html;
}
setInterval(()=>{if(SEL) renderPanel();},400);
panel.addEventListener('click',e=>{
  if(performance.now()-panelT<450) return;
  const b=e.target.closest('[data-act]'); if(!b||b.disabled) return; ac(); const act=b.dataset.act; snd('click');
  const re=()=>{panelSig=''; renderPanel();};
  if(act==='close') return closePanel();
  if(act==='send'){const a=byId(SEL.id); const bi=findBld(b.dataset.b); if(a&&bi>=0&&sendTo(a,bi)) floatW(a.x,a.y-30,'W drogę!','#9dffcb'); return closePanel();}
  if(act==='sendAll'){const id=b.dataset.d; let n=0; G.animals.forEach(o=>{if(o.dis.some(x=>x.id===id&&x.know===2)&&['pen','loose'].includes(o.st)&&sendTo(o,findBld(DIS[id].b))){n++; floatW(o.x,o.y-30,'W drogę!','#9dffcb');}}); if(n) ticker(`${n} pacjentów z: ${DIS[id].n} idzie do: ${BLD[DIS[id].b].n}.`,'good'); return closePanel();}
  if(act==='home'){const a=byId(SEL.id); if(a) sendHome(a); return re();}
  if(act==='selA') return select('a',+b.dataset.id);
  if(act==='buyPen'||act==='buyBld'){if(SEL.pick!==act+b.dataset.k){SEL.pick=act+b.dataset.k; return re();}}
  if(act==='buyPen'){const k=b.dataset.k, s=SPEC[k]; if(G.money<s.p){snd('bad'); return;} G.money-=s.p; setPen(SEL.id,k,2); rebuildStatic(); snd('cure'); ticker(`Nowy wybieg: ${s.pl}!`,'good'); blink=0; return re();}
  if(act==='buyBld'){const k=b.dataset.k, B=BLD[k]; if(G.money<B.p){snd('bad'); return;} G.money-=B.p; const pl=G.plots[SEL.id]; Object.assign(pl,{k:'bld',b:k,queue:[],cur:null,wear:0,warn:0,mc:0}); rebuildStatic(); snd('cure'); ticker(`Otwarto: ${B.n}!`,'good'); blink=0;
    if(k==='lab') hint('lab','Laboratorium gotowe. Zatrudnij naukowców i wybierz projekt w zakładce Badania.'); return re();}
  if(act==='clear'){const pl=G.plots[SEL.id]; if(G.money<300) return; G.money-=300; Object.assign(pl,{k:null,b:null,wear:0}); rebuildStatic(); return re();}
  if(act==='service'){const pl=G.plots[SEL.id]; if(G.money<150) return; G.money-=150; pl.wear=0; pl.warn=0; sparkle(pl.tx*TS+56,pl.ty*TS+50,'#ffe14d'); snd('fix'); return re();}
  if(act==='addA'){const pl=G.plots[SEL.id], s=SPEC[pl.sp], price=Math.round(s.p/2); if(G.money<price) return; G.money-=price; const a=mkAnimal(pl.sp,SEL.id); G.animals.push(a); sparkle(a.x,a.y,'#ffe27a'); return re();}
  if(act==='demo'){const pl=G.plots[SEL.id];
    if(pl.k==='pen'){if(G.animals.some(a=>a.pen===SEL.id)) return; G.money+=SPEC[pl.sp].p/2;}
    else{G.money+=BLD[pl.b].p/2; [...pl.queue,pl.cur].filter(Boolean).forEach(id=>{const a=byId(id); if(a) sendHome(a);});}
    Object.assign(pl,{k:null,sp:null,b:null,queue:[],cur:null,wear:0}); rebuildStatic(); snd('crash'); return re();}
  if(act==='hire'){const k=b.dataset.k; if(G.money<STAFF[k].hire) return; G.money-=STAFF[k].hire; G.staff.push(mkStaff(k)); ticker(`Zatrudniono: ${STAFF[k].n}.`,'good'); return re();}
  if(act==='fire'){const k=b.dataset.k; const i=G.staff.map(s=>s.role).lastIndexOf(k); if(i>=0){const s=G.staff[i];
      if(s.tgt!=null){const a=byId(s.tgt); if(a&&(s.role==='vet'||s.role==='guard')){a.vc=0;a.gc=0;} const l=G.litter.find(x=>x.id===s.tgt); if(l&&s.role==='jan') l.c=0; if(s.role==='mech'&&G.plots[s.tgt]) G.plots[s.tgt].mc=0;}
      G.staff.splice(i,1);} return re();}
  if(act==='resSel'){const p=projects().find(x=>x.id===b.dataset.k); if(!p) return; G.res.cur=p.id; G.res.cost=p.c; G.res.pts=0; return re();}
  if(act==='loan'){if(G.loan+2000>LV().loanMax) return; G.loan+=2000; G.money+=2000; snd('cash'); return re();}
  if(act==='repay'){if(G.loan<2000||G.money<2000) return; G.loan-=2000; G.money-=2000; return re();}
  if(act==='snd'){OPT.snd=!OPT.snd; saveOpt(); return re();}
  if(act==='mus'){OPT.mus=!OPT.mus; saveOpt(); return re();}
  if(act==='help'){closePanel(); showHelp(); return;}
  if(act==='quit'){SEL.conf=1; return re();}
  if(act==='newNo'){SEL.conf=0; return re();}
  if(act==='quitYes'){save(); closePanel(); running=false; showIntro(); return;}
});
document.querySelectorAll('[data-ui]').forEach(b=>b.addEventListener('click',()=>{
  if(!G) return; ac(); snd('click'); const k=b.dataset.ui;
  if(SEL&&SEL.t===k){closePanel(); return;}
  if(k==='build'){closePanel(); blink=5; const e=G.plots.findIndex(p=>p.k===null||p.k==='ruin');
    if(e<0){ticker('Brak wolnych działek. Zburz coś, żeby zrobić miejsce.'); return;}
    ticker('Tapnij migającą działkę, żeby coś na niej postawić.','good');
    const pl=G.plots[e]; cam.x=pl.tx*TS+56-VW/2/cam.z; cam.y=pl.ty*TS+40-VH/2/cam.z; clampCam(); return;}
  openUI(k);
}));
$('#speedBtn').onclick=()=>{ac(); OPT.speed=OPT.speed===1?2:OPT.speed===2?3:1; $('#speedBtn').textContent=OPT.speed+'×'; snd('click');};
$('#pauseBtn').onclick=()=>{ac(); OPT.paused=!OPT.paused; $('#pauseBtn').textContent=OPT.paused?'▶':'❚❚'; snd('click');};

