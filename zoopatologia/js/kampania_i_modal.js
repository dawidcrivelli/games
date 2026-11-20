/* ================= kampania i modal ================= */
const modal=$('#modal');
function showModal(html){$('#mbox').innerHTML=html; modal.classList.add('open');}
function hideModal(){modal.classList.remove('open');}
function getUnl(){try{return JSON.parse(localStorage.getItem(CAMPKEY)||'{"u":0}').u||0;}catch(e){return 0;}}
function setUnl(n){try{const u=Math.max(getUnl(),Math.min(n,LEVELS.length-1)); localStorage.setItem(CAMPKEY,JSON.stringify({u}));}catch(e){}}
function savedLvl(){try{const r=localStorage.getItem(SAVEKEY); if(!r) return -1; const g=JSON.parse(r); return g&&g.v===3?g.lvl:-1;}catch(e){return -1;}}
function showIntro(){
  const unl=getUnl(), sv=savedLvl();
  const cards=LEVELS.map((L,i)=>{const gl=GOALDEF.filter(d=>L.goals[d.k]>0).map(d=>`${d.n.toLowerCase()} ${L.goals[d.k]}${d.u}`).join(', ');
    return `<button class="lvl px" data-m="lvl" data-l="${i}" ${i>unl?'disabled':''}><span class="num">${i>unl?'🔒':i+1}</span><span class="grow"><b>${L.n}</b><br><span class="sub">${L.d}</span><br><span class="sub">Cel: ${gl}.</span></span></button>`;}).join('');
  showModal(`<div class="title">ZOO<br>PATOLOGIA</div>
   <p>Meteor z mutagenem spadł obok twojego pierwszego zoo. Potem obok drugiego. To już nie jest przypadek.</p>
   ${sv>=0?`<button class="act go" data-m="cont">Kontynuuj: ${LEVELS[sv].n}</button>`:''}
   ${cards}
   <button class="act" data-m="help">Jak grać</button>`);
}
function showHelp(){
  showModal(`<div class="title" style="font-size:40px">Jak grać</div>
   <ul class="tips">
    <li>Zwierzę ze znakiem <b>?</b> łapie mutację. Tapnij je i wyślij do kliniki. <b>Weterynarz</b> zgaduje diagnozę, <b>Skaner</b> zna ją na pewno. Raz zdiagnozowana mutacja trafia do Księgi i kolejne przypadki są rozpoznawane od razu. Zły budynek daje gratis nową mutację.</li>
    <li>Maszyny się <b>zużywają</b>. Przy 100% wybuchają. Zatrudnij <b>mechanika</b> albo zamów serwis.</li>
    <li><b>Laboratorium</b> z naukowcami daje szczepionki, turbo dla klinik i prognozy nadchodzących mutacji.</li>
    <li>Zwierzęta same się <b>rozmnażają</b>. Młode chorych rodziców bywają <b>hybrydami</b>: gwiazdami zoo, ale delikatnymi.</li>
    <li>Brakuje kasy? <b>Bank</b> pożyczy, ale liczy odsetki.</li>
    <li>Przybliż mapę, żeby zajrzeć do budynków i zobaczyć leczenie. Tapnięcie budynku też pokazuje wnętrze.</li>
    <li>Uciekinierów i <b>UFO</b> tapnij. Mapę przesuwasz palcem, przybliżasz dwoma.</li>
   </ul>
   <button class="act go" data-m="${running?'close':'menu'}">${running?'Wracam do gry':'Dalej'}</button>`);
}
modal.addEventListener('click',e=>{
  const b=e.target.closest('[data-m]'); if(!b||b.disabled) return; ac(); snd('click'); const m=b.dataset.m;
  if(m==='close'){hideModal(); return;}
  if(m==='menu'){showIntro(); return;}
  if(m==='help'){showHelp(); return;}
  if(m==='lvl') startLevel(+b.dataset.l);
  if(m==='cont') startLoad();
});
function startLevel(l){newGame(l); hideModal(); initCam(); running=true; OPT.paused=false; $('#pauseBtn').textContent='❚❚'; ticker(`${LEVELS[l].n}. Na razie jest spokojnie…`,'good'); save();}
function startLoad(){if(!load()){startLevel(0); return;} hideModal(); initCam(); running=true; ticker('Wracasz do swojego zoo. Coś tu dziwnie pachnie.','good');}

