/* ================= portrety ================= */
const porCache=new Map();
function portrait(a){
  const dis=a.dis.map(d=>d.id), key=a.sp+'|'+(a.hy||'')+'|'+(a.baby?1:0)+'|'+dis.join(',');
  if(porCache.has(key)) return porCache.get(key);
  const c=document.createElement('canvas'); c.width=56; c.height=56; const prev=C, ph=HD; C=c.getContext('2d'); HD=false;
  const fake={id:7,sp:a.sp,hy:a.hy,baby:false,face:1,mv:false,ph:0,dis:dis.map(id=>({id})),alt:0,tm:{},chomp:0,fire:0};
  const h=animalHeight(fake), sc=Math.min(1.8,48/h);
  C.save(); C.translate(28,52); C.scale(sc,sc); drawAnimal(fake,0,0,0,true); C.restore();
  C=prev; HD=ph; const url=c.toDataURL(); porCache.set(key,url); return url;
}
const spPortrait=sp=>portrait({sp,dis:[],hy:null});
function staffPortrait(role){
  const key='staff|'+role; if(porCache.has(key)) return porCache.get(key);
  const c=document.createElement('canvas'); c.width=32; c.height=32; const prev=C, ph=HD; C=c.getContext('2d'); HD=false;
  C.save(); C.translate(16,29); C.scale(1.4,1.4); drawPerson({x:0,y:0,face:1,role,lk:{skin:'#f2c9a0',hair:'#5a3a22',pants:'#3b4a6b',shirt:'#fff'},mv:false,ph:0},0); C.restore();
  C=prev; HD=ph; const url=c.toDataURL(); porCache.set(key,url); return url;
}
function bldThumb(k){
  const key='bld|'+k; if(porCache.has(key)) return porCache.get(key);
  const c=document.createElement('canvas'); c.width=112; c.height=78; const prev=C, ph=HD, pt=PT.length; C=c.getContext('2d'); HD=false;
  C.translate(0,-6); drawCutaway({tx:0,ty:0,b:k,cur:null,ct:0,cmax:1,wear:0,queue:[]},1);
  C=prev; HD=ph; PT.length=pt; const url=c.toDataURL(); porCache.set(key,url); return url;
}
function bldSwatch(b){return `<span class="sw" style="background:linear-gradient(${BLD[b].r} 0 35%,${BLD[b].w} 35%)"></span>`;}

