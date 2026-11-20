/* ================= zapis ================= */
function save(){
  if(!G||G.over) return;
  try{const g={...G,ufo:null,rain:0}; g.animals=G.animals.map(a=>({...a,path:null,pre:null,post:null}));
    g.staff=G.staff.map(s=>({role:s.role,lk:s.lk})); localStorage.setItem(SAVEKEY,JSON.stringify(g));}catch(e){}
}
function load(){
  try{const r=localStorage.getItem(SAVEKEY); if(!r) return false; const g=JSON.parse(r); if(!g||g.v!==3) return false;
    G=g; V=[];PT=[];FT=[];BB=[];BM=[];PR=[];
    G.staff=(g.staff||[]).map(s=>{const n=mkStaff(s.role); if(s.lk) n.lk=s.lk; return n;});
    G.plots.forEach(pl=>{pl.queue=[]; pl.cur=null; pl.mc=0;});
    G.animals=G.animals.filter(a=>a.st!=='gone'&&a.st!=='fly');
    G.animals.forEach(a=>{a.vc=0;a.gc=0; if(a.st!=='loose'){const p=randInPen(G.plots[a.pen]); a.x=p.x;a.y=p.y;a.wx=p.x;a.wy=p.y;a.st='pen';if(!has(a,'balon'))a.alt=0;}});
    G.litter.forEach(l=>l.c=0); G.over=false; G.ufo=null;
    rebuildStatic(); return true;}catch(e){return false;}
}
function saveOpt(){try{localStorage.setItem(SAVEKEY+'-opt',JSON.stringify({snd:OPT.snd,mus:OPT.mus}));}catch(e){}}
try{const o=JSON.parse(localStorage.getItem(SAVEKEY+'-opt')||'null'); if(o){OPT.snd=!!o.snd; OPT.mus=!!o.mus;}}catch(e){}
setInterval(()=>{if(running) save();},10000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running) save();});
window.addEventListener('pagehide',()=>{if(running) save();});

