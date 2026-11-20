/* ================= kamera i render ================= */
const cv=$('#cv'), ctx=cv.getContext('2d');
let DPR=1, VW=0, VH=0; const cam={x:0,y:0,z:3};
function clampCam(){
  const vw=VW/cam.z, vh=VH/cam.z, mw=MW*TS, mh=MH*TS, top=64/cam.z, bot=76/cam.z;
  if(vw>=mw) cam.x=(mw-vw)/2; else cam.x=clamp(cam.x,-20,mw-vw+20);
  if(vh-top-bot>=mh) cam.y=mh/2-(top+vh-bot)/2; else cam.y=clamp(cam.y,-top-10,mh-vh+bot+10);
}
function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1); VW=innerWidth; VH=innerHeight;
  cv.width=Math.round(VW*DPR); cv.height=Math.round(VH*DPR); cv.style.width=VW+'px'; cv.style.height=VH+'px'; clampCam();
}
function initCam(){cam.z=clamp(Math.round(VW/(MW*TS)*1.5*2)/2,1.5,4); cam.x=(MW*TS-VW/cam.z)/2; cam.y=MH*TS-VH/cam.z+76/cam.z; clampCam();}
window.addEventListener('resize',resize);

let blink=0;
function render(t){
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#2a1e3a'; ctx.fillRect(0,0,cv.width,cv.height);
  if(!G) return;
  HD=cam.z>=3.2; TT=t;
  const z=cam.z*DPR; let sx=0,sy=0; if(G.shake>0){sx=rnd(-3,3)*DPR; sy=rnd(-3,3)*DPR;}
  ctx.setTransform(z,0,0,z,-cam.x*z+sx,-cam.y*z+sy); ctx.imageSmoothingEnabled=false; C=ctx;
  ctx.drawImage(mapC,0,0,MW*TS,MH*TS);
  const vx0=cam.x-40, vy0=cam.y-60, vx1=cam.x+VW/cam.z+40, vy1=cam.y+VH/cam.z+80;
  const inV=(x,y)=>x>vx0&&x<vx1&&y>vy0&&y<vy1;
  if(blink>0){G.plots.forEach(pl=>{if((pl.k===null||pl.k==='ruin')&&Math.floor(t*4)%2){ctx.fillStyle='rgba(255,79,139,.35)'; ctx.fillRect(pl.tx*TS+2,pl.ty*TS+2,108,76);}});}
  if(SEL&&SEL.t==='p'){const pl=G.plots[SEL.id]; ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2; ctx.strokeRect(pl.tx*TS+1,pl.ty*TS+1,110,78);}
  for(const l of G.litter) if(inV(l.x,l.y)) drawLitter(l);
  const AX=(GX-1)*TS;
  ctx.fillStyle=OUT; ctx.fillRect(AX+2,27*TS-16,6,32); ctx.fillRect(AX+40,27*TS-16,6,32); ctx.fillRect(AX-2,27*TS-22,56,10);
  ctx.fillStyle='#8b5a2b'; ctx.fillRect(AX+3,27*TS-15,4,30); ctx.fillRect(AX+41,27*TS-15,4,30); ctx.fillStyle='#e53950'; ctx.fillRect(AX-1,27*TS-21,54,8);
  for(const fxp of [AX+5,AX+43]){ctx.fillStyle='#3a2a1a'; ctx.fillRect(fxp,27*TS-34,1,13); for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#ffd23f':'#2fd39a'; ctx.fillRect(fxp+1+i,27*TS-34+Math.round(Math.sin(t*6+i*.8)*1.2),1,5);}}
  ctx.fillStyle='#fff'; ctx.font='bold 6px "Nunito", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('ZOOPATOLOGIA',GX*TS+8,27*TS-16.5);
  ctx.fillStyle='#2b2036'; ctx.font='bold 5px "Nunito", sans-serif'; ctx.fillText('PERSONEL',64,393);
  const L=[];
  G.plots.forEach((pl,i)=>{if(pl.k==='bld'&&inV(pl.tx*TS+56,pl.ty*TS+40)) L.push({y:pl.ty*TS+70,f:()=>drawBuilding(pl,t,i)});});
  for(const a of G.animals){if(a.st==='in'||!inV(a.x,a.y)) continue; L.push({y:a.y,f:()=>drawAnimal(a,t,a.x,a.y)});}
  for(const v of V){if(inV(v.x,v.y)) L.push({y:v.y,f:()=>drawPerson(v,t)});}
  for(const s of G.staff){if(s.st!=='in'&&inV(s.x,s.y)) L.push({y:s.y,f:()=>drawPerson(s,t)});}
  L.sort((a,b)=>a.y-b.y); for(const o of L) o.f();
  for(const p of PR){const k=p.t/p.dur, x=p.x0+(p.x1-p.x0)*k, y=p.y0+(p.y1-p.y0)*k-Math.sin(k*Math.PI)*24; drawLitter({x,y,k:'toast'});}
  for(const b of BM){ctx.strokeStyle='#ff2030'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(b.x0,b.y0); ctx.lineTo(b.x1,b.y1); ctx.stroke(); ctx.strokeStyle='#ffd0d0'; ctx.lineWidth=.7; ctx.stroke();}
  for(const p of PT){ctx.fillStyle=p.c; const x=Math.round(p.x), y=Math.round(p.y);
    if(p.note){ctx.fillRect(x,y,2,2); ctx.fillRect(x+1,y-4,1,4);}
    else if(p.heart){ctx.fillRect(x,y,1,1); ctx.fillRect(x+2,y,1,1); ctx.fillRect(x,y+1,3,1); ctx.fillRect(x+1,y+2,1,1);}
    else ctx.fillRect(x,y,p.s,p.rain?4:p.s);}
  ambient(t,inV);
  for(const v of V){if(v.emoT>0&&v.emo) drawIcon(v.emo,v.x,v.y-(v.kid?16:20));}
  for(const a of G.animals){if(a.st==='in'||!a.dis.length) continue; const h=animalHeight(a)+(a.alt||0)+4;
    const ic=a.dis.some(d=>d.know===0)?'q':'cross'; if(a.st==='loose'&&Math.floor(t*4)%2) drawIcon('bang',a.x,a.y-h); else drawIcon(ic,a.x,a.y-h);}
  if(SEL&&SEL.t==='a'){const a=byId(SEL.id); if(a&&a.st!=='in'){const h=animalHeight(a)+(a.alt||0)+14+Math.sin(t*6)*2; ctx.fillStyle='#ffd23f'; for(let i=0;i<4;i++) ctx.fillRect(Math.round(a.x)-3+i,Math.round(a.y-h)+i,7-i*2,1);}}
  if(G.ufo) drawUfo(G.ufo,t);
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.textAlign='center'; ctx.textBaseline='middle';
  const fs=Math.round(clamp(cam.z*4.5,12,18));
  for(const f of FT){const x=(f.x-cam.x)*cam.z, y=(f.y-cam.y)*cam.z; ctx.font=`bold ${fs}px "Nunito", sans-serif`; ctx.globalAlpha=clamp(f.life,0,1);
    ctx.fillStyle='#1a1226'; ctx.fillText(f.text,x+2,y+2); ctx.fillStyle=f.c; ctx.fillText(f.text,x,y); ctx.globalAlpha=1;}
  const bubble=(x,y,text)=>{ctx.font=`${fs-1}px "Nunito", sans-serif`; const w=Math.min(ctx.measureText(text).width+16,280);
    ctx.fillStyle='#1a1226'; ctx.fillRect(x-w/2-2,y-fs-2,w+4,fs*2+4); ctx.fillStyle='#fff'; ctx.fillRect(x-w/2,y-fs,w,fs*2);
    ctx.fillStyle='#2b2036'; ctx.fillText(text,x,y,w-10);};
  for(const b of BB){const a=byId(b.a); if(!a||a.st==='in') continue; bubble((a.x-cam.x)*cam.z,(a.y-a.alt-animalHeight(a)-12-cam.y)*cam.z,b.text);}
  if(HD) G.plots.forEach((pl,i)=>{if(pl.k==='bld'&&pl.b==='terapia'&&pl.cur&&Math.floor(t/3.2)%2===0){const X=pl.tx*TS+85, Y=pl.ty*TS+30; bubble((X-cam.x)*cam.z,(Y-cam.y)*cam.z,THERAPY[Math.floor(t/6.4)%THERAPY.length]);}});
}

function ambient(t,inV){
  const c=ctx;
  // migotanie wody
  G.plots.forEach(pl=>{if(pl.k!=='pen') return; const hab=SPEC[pl.sp].hab, X=pl.tx*TS, Y=pl.ty*TS; if(hab!=='ice'&&hab!=='swamp') return;
    const [cx,cy,rx]=hab==='ice'?[X+86,Y+27,9]:[X+30,Y+29,12]; c.fillStyle='rgba(255,255,255,.8)';
    for(let i=0;i<3;i++){const k=(t*.6+i/3)%1; c.fillRect(Math.round(cx-rx+k*rx*2),Math.round(cy+Math.sin(t*2+i)*1.5),2,.5);}});
  // cienie chmur
  c.fillStyle='rgba(10,10,40,.07)'; CLOUDS.forEach(cl=>{c.beginPath(); c.ellipse(cl.x,cl.y,cl.rx,cl.ry,0,0,Math.PI*2); c.ellipse(cl.x+cl.rx*.6,cl.y-cl.ry*.4,cl.rx*.6,cl.ry*.8,0,0,Math.PI*2); c.fill();});
  // ptaki
  c.fillStyle='#2b2036'; BIRDS.forEach(b=>{const f=Math.sin(b.ph)>0?-1:0, x=Math.round(b.x), y=Math.round(b.y); c.fillRect(x-3,y+f,2,1); c.fillRect(x-1,y+1,2,1); c.fillRect(x+1,y+f,2,1);});
  // noc
  const n=nightF(); if(n<=0) return;
  c.fillStyle=`rgba(14,18,58,${.5*n})`; c.fillRect(cam.x-50,cam.y-50,VW/cam.z+100,VH/cam.z+100);
  c.save(); c.globalCompositeOperation='lighter';
  const glow=(x,y,r,col,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col.replace('A',a)); g.addColorStop(1,col.replace('A',0)); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2);};
  LAMPS.forEach(l=>{if(inV(l.x,l.y)) glow(l.x,l.y-12,28,'rgba(255,190,100,A)',.32*n);});
  glow(GX*TS+8,27*TS-16,40,'rgba(255,120,150,A)',.3*n);
  G.plots.forEach(pl=>{if(pl.k!=='bld') return; const X=pl.tx*TS, Y=pl.ty*TS; if(!inV(X+56,Y+40)) return; glow(X+56,Y+50,46,'rgba(255,220,140,A)',(pl.cur?.35:.18)*n);});
  for(const a of G.animals){if(a.st==='in'||!inV(a.x,a.y)) continue;
    if(has(a,'disco')) glow(a.x,a.y-10,26,`hsla(${(t*260+a.id*57)%360},90%,60%,A)`,.45*n);
    if(has(a,'kosmita')) glow(a.x,a.y-10,22,'rgba(120,255,120,A)',.4*n);
    if(has(a,'ogien')||a.fire>0) glow(a.x,a.y-12,20,'rgba(255,140,40,A)',.35*n);}
  for(const p of PT){if(p.c&&(p.c[1]==='f'&&p.c[2]==='f')) {c.fillStyle=p.c; c.fillRect(p.x-1,p.y-1,p.s+2,p.s+2);}}
  c.restore();
  c.fillStyle=`rgba(255,226,150,${.55*n})`;

}
