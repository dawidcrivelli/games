/* ================= wejście dotykowe ================= */
const ptrs=new Map(); let pan=null, pinch=null;
cv.addEventListener('pointerdown',e=>{
  ac(); cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1) pan={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,moved:false,t:performance.now()};
  else if(ptrs.size===2){const [p1,p2]=[...ptrs.values()]; pinch={d:Math.hypot(p1.x-p2.x,p1.y-p2.y),z:cam.z,mx:(p1.x+p2.x)/2,my:(p1.y+p2.y)/2,cx:cam.x,cy:cam.y}; if(pan) pan.moved=true;}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size>=2){const [p1,p2]=[...ptrs.values()]; const d=Math.hypot(p1.x-p2.x,p1.y-p2.y);
    const nz=clamp(pinch.z*d/pinch.d,1.2,7); const wx=pinch.cx+pinch.mx/pinch.z, wy=pinch.cy+pinch.my/pinch.z;
    const mx=(p1.x+p2.x)/2, my=(p1.y+p2.y)/2; cam.z=nz; cam.x=wx-mx/nz; cam.y=wy-my/nz; clampCam(); return;}
  if(pan){const dx=e.clientX-pan.x, dy=e.clientY-pan.y; if(!pan.moved&&Math.hypot(dx,dy)>9) pan.moved=true;
    if(pan.moved){cam.x=pan.cx-dx/cam.z; cam.y=pan.cy-dy/cam.z; clampCam();}}
});
function ptrEnd(e){
  if(!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
  if(ptrs.size<2) pinch=null;
  if(ptrs.size===0){if(pan&&!pan.moved&&e.type==='pointerup') tap(e.clientX,e.clientY); pan=null;}
  else if(ptrs.size===1){const p=[...ptrs.values()][0]; pan={x:p.x,y:p.y,cx:cam.x,cy:cam.y,moved:true};}
}
cv.addEventListener('pointerup',ptrEnd); cv.addEventListener('pointercancel',ptrEnd);
cv.addEventListener('wheel',e=>{e.preventDefault(); zoomAt(e.clientX,e.clientY,e.deltaY<0?1.15:1/1.15);},{passive:false});
function zoomAt(sx,sy,f){const wx=cam.x+sx/cam.z, wy=cam.y+sy/cam.z; cam.z=clamp(cam.z*f,1.2,7); cam.x=wx-sx/cam.z; cam.y=wy-sy/cam.z; clampCam();}
$('#zin').onclick=()=>zoomAt(VW/2,VH/2,1.25); $('#zout').onclick=()=>zoomAt(VW/2,VH/2,.8);

function animalHit(a,wx,wy){
  if(a.st==='in') return false; const h=animalHeight(a), w=(SPEC[a.sp].d.t==='u'?14:SPEC[a.sp].d.bw+10)*(has(a,'gigant')?2:1)*(a.baby?.6:1);
  const top=a.y-(a.alt||0)-h-6, bot=a.y-(a.alt||0)+4;
  return wx>a.x-w/2-5&&wx<a.x+w/2+5&&wy>top&&wy<bot;
}
function tap(sx,sy){
  if(!G||G.over) return;
  const wx=cam.x+sx/cam.z, wy=cam.y+sy/cam.z;
  if(G.ufo&&G.ufo.st!=='out'&&Math.hypot(G.ufo.x-wx,G.ufo.y-wy)<22){hitUfo(); return;}
  const loose=G.animals.filter(a=>a.st==='loose'&&animalHit(a,wx,wy));
  if(loose.length){const a=loose[0]; sparkle(a.x,a.y); const p=randInPen(G.plots[a.pen]); clearClaims(a); a.x=p.x; a.y=p.y; a.st='pen'; a.wx=p.x; a.wy=p.y; a.path=null; if(has(a,'gigant')) a.tm.g=0;
    sparkle(a.x,a.y); floatW(a.x,a.y-30,'Złapany!','#ffd23f'); snd('click'); select('a',a.id); return;}
  const li=G.litter.find(l=>Math.abs(l.x-wx)<8&&Math.abs(l.y-wy)<8);
  if(li){G.litter=G.litter.filter(l=>l!==li); G.staff.forEach(s=>{if(s.role==='jan'&&s.tgt===li.id){s.tgt=null;s.st='idle';}}); sparkle(li.x,li.y+6,'#fff'); snd('click'); return;}
  const hits=G.animals.filter(a=>animalHit(a,wx,wy)).sort((a,b)=>b.y-a.y);
  if(hits.length){select('a',hits[0].id); snd('click'); return;}
  const pi=plotAt(wx,wy);
  if(pi>=0){select('p',pi); snd('click'); return;}
  closePanel();
}

