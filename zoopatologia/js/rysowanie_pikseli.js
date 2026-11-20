/* ================= rysowanie pikseli ================= */
let C=null, MODE='f', FL=1, TT=0;
const OUT='#1a1226';
let CF=null; const cfCache=new Map();
function hexRGB(c){if(c[0]!=='#') return null; let h=c.slice(1); if(h.length===3) h=h.split('').map(x=>x+x).join(''); if(h.length>6) h=h.slice(0,6); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255];}
const toHex=(r,g,b)=>'#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
function mkCF(kind){return c=>{const k=kind+c; let v=cfCache.get(k); if(v) return v; const rgb=hexRGB(c);
  if(!rgb) v=c; else {const L=.3*rgb[0]+.59*rgb[1]+.11*rgb[2];
    if(kind==='x') v=L>150?'#eef0ff':(L>70?'#4a4f6a':'#16182a');
    else if(kind==='r'){const g=55+L*.62; v=toHex(g,g+5,g+14);}
    else v=toHex(rgb[0]*.3+20,rgb[1]*.65+80,rgb[2]*.3+30);}
  cfCache.set(k,v); return v;};}
const CF_X=mkCF('x'), CF_R=mkCF('r'), CF_K=mkCF('k');
function rr(x,y,w,h,c){C.fillStyle=CF?CF(c):c; C.fillRect(FL===1?x:-x-w,y,w,h);}
function S(x,y,w,h,c){if(MODE==='o') rr(x-1,y-1,w+2,h+2,OUT); else rr(x,y,w,h,c);}
function D(x,y,w,h,c){if(MODE==='f') rr(x,y,w,h,c);}
function H(x,y,w,h,c){if(MODE==='f'&&HD) rr(x,y,w,h,c);}
function shade(c){if(c[0]!=='#') return c; const n=parseInt(c.slice(1),16); const f=v=>Math.max(0,Math.floor(v*.8)); return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('');}
function light(c){if(c[0]!=='#') return 'rgba(255,255,255,.35)'; const n=parseInt(c.slice(1),16); const f=v=>Math.min(255,Math.floor(v+(255-v)*.35)); return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('');}
function eye(x,y,a){
  const red=a.fire>0, blink=!red&&((TT*.8+a.id*1.7)%4)<.13;
  if(!HD){D(x,y,1,1,red?'#ff2030':'#111'); return;}
  if(blink){D(x-.5,y+.5,1.5,.5,'#111'); return;}
  D(x-.5,y-.5,1.5,1.5,'#fff'); D(x,y-.25,1,1.25,red?'#ff2030':'#111'); D(x,y-.25,.5,.5,'#fff');
}

function effSpec(a,t){
  const s={...SPEC[a.sp].d};
  if(a.hy){const o=SPEC[a.hy].d; s.head=o.t==='u'?'peng':o.head; if(o.nl){s.nl=o.nl; s.nw=o.nw||3;} else if(s.t==='u'&&s.head!=='peng'){s.nl=3; s.nw=3;} if(o.pat){s.pat=o.pat; s.pc=o.pc;} if(o.t==='u'&&s.t==='q'){s.pat=null;} s.hyb=true;}
  if(has(a,'zyrafodyl')){s.head='croc'; s.nl=Math.max(s.nl||0,15); s.nw=3; s.mut=true;}
  if(has(a,'kratka')){s.pat='plaid'; s.bc='#c0392b'; s.lc='#a93226';}
  if(has(a,'szkielet')) s.pat='ribs';
  if(has(a,'disco')){const h=(t*260+a.id*57)%360; s.bc=`hsl(${h},90%,62%)`; s.lc=`hsl(${(h+70)%360},90%,55%)`; s.pc=`hsl(${(h+180)%360},90%,45%)`; s.belly=`hsl(${(h+120)%360},90%,80%)`;}
  s.toaster=has(a,'toster');
  return s;
}
function animalHeight(a){
  const s=SPEC[a.sp].d; let nl=s.nl||0; if(a.hy&&SPEC[a.hy].d.nl) nl=Math.max(nl,SPEC[a.hy].d.nl);
  let h=s.t==='u'?s.bh+3+(a.hy?nl+6:0):(s.ll+s.bh+nl+7);
  if(has(a,'zyrafodyl')) h=Math.max(h,(s.t==='u'?s.bh:s.ll+s.bh)+21);
  if(has(a,'gigant')) h*=2; if(has(a,'balon')) h*=1.5; if(a.baby) h*=.6; if(has(a,'mini')) h*=.45; if(has(a,'plask')) h*=.4; if(has(a,'skrzyd')||has(a,'kosmita')||has(a,'magnes')||has(a,'robot')) h+=4; return h;}
function _unused(){
}
function headPos(a){const h=animalHeight(a); return{x:a.x+a.face*8,y:a.y-(a.alt||0)-h+4};}

function drawAnimal(a,t,x,y,portrait){
  const s=effSpec(a,t);
  if(has(a,'kosmita')&&!portrait){C.fillStyle='rgba(120,255,120,.18)'; C.beginPath(); C.ellipse(x,y-8,16,10,0,0,Math.PI*2); C.fill();}
  const dance=has(a,'disco')?Math.abs(Math.sin(t*9+a.id))*3:0;
  const lift=(a.alt||0)+dance;
  C.save();
  if(!portrait){
    C.fillStyle='rgba(0,0,0,.22)'; const sw=(s.t==='u'?12:s.bw)*(has(a,'gigant')?2:1)*(a.baby?.6:1);
    C.fillRect(Math.round(x-sw/2),Math.round(y-1),Math.round(sw),2);
    if(has(a,'balon')&&a.alt>2){C.fillStyle='#ffffff'; C.fillRect(Math.round(x),Math.round(y-lift),1,Math.round(lift));}
  }
  C.translate(Math.round(x),Math.round(y-lift));
  CF=has(a,'szkielet')?CF_X:has(a,'robot')?CF_R:has(a,'kosmita')?CF_K:null;
  if(has(a,'niewidz')) C.globalAlpha=.1+.32*(Math.sin(t*3+a.id)*.5+.5);
  if(a.baby) C.scale(.6,.6);
  if(has(a,'mini')) C.scale(.45,.45);
  if(has(a,'plask')) C.scale(1.45,.4);
  if(has(a,'gigant')) C.scale(2,2);
  if(has(a,'balon')){C.translate(0,-8); C.scale(1.35,1.6); C.translate(0,8);}
  if(has(a,'odwrot')){const hh=s.t==='u'?s.bh+2:s.ll+s.bh+2; C.translate(0,-hh-4); C.scale(1,-1);}
  FL=a.face||1; TT=t;
  for(const md of ['o','f']){MODE=md; if(s.toaster) partsT(s,a); else if(s.t==='u') partsU(s,a,t); else partsQ(s,a,t);}
  CF=null; C.globalAlpha=1;
  if(has(a,'lod')){const ih=(s.t==='u'?s.bh+5:s.ll+s.bh+(s.nl||0)+9), iw=(s.t==='u'?17:s.bw+12);
    C.fillStyle='rgba(170,225,255,.5)'; C.fillRect(-iw/2,-ih,iw,ih); C.fillStyle='rgba(255,255,255,.75)'; C.fillRect(-iw/2,-ih,iw,1); C.fillRect(-iw/2,-ih,1,ih);
    C.fillRect(-iw/2+2,-ih+2,1,ih*.4); C.fillRect(-iw/2+4,-ih+2,.5,ih*.25); C.strokeStyle='rgba(60,120,170,.8)'; C.lineWidth=.6; C.strokeRect(-iw/2,-ih,iw,ih);}
  if(s.hyb&&!portrait){MODE='f'; const sp=Math.floor(t*4+a.id)%3===0; if(sp){C.fillStyle='#fff7a0'; C.fillRect(FL*-6,-animalHeight(a)/(a.baby?.6:1)+2,1,1);}}
  MODE='f'; FL=1;
  C.restore();
}
function legs(s,a,bx,bw){
  const lw=s.lw, ll=s.ll, lift=a.mv?(Math.floor(a.ph)%2):0;
  if(s.l2){for(let i=0;i<2;i++){const x=i?1:-2, up=a.mv?(i===lift?2:0):(i===1?Math.floor(ll/2):0); S(x,-ll+up,1,ll-up,i?shade(s.lc):s.lc); D(x-1,-1-(a.mv?0:up),3,1,s.lc);
    if(!a.mv&&i===1) S(x-2,-ll+up,3,1,shade(s.lc));} return;}
  const xs=[bx+1,bx+lw+2,bx+bw-lw*2-2,bx+bw-lw-1];
  for(let i=0;i<4;i++){const up=(i%2===lift)?1:0; const c=(i%2)?shade(s.lc):s.lc; S(xs[i],-ll+up,lw,ll-up,c); D(xs[i],-1,lw,1,'#3a2a1a'); H(xs[i],-1,.5,.5,'#8a7a6a'); H(xs[i]+lw-.5,-ll+up,.5,ll-up-1,shade(c)); H(xs[i],-ll+up,.5,ll-up-1,light(c));
    if(ll>=5){H(xs[i],-Math.round(ll/2),lw,.5,shade(c));} if(lw>=4){H(xs[i]+.5,-2.5,lw-1,.5,shade(c)); H(xs[i]+.5,-4,lw-1,.5,shade(c));}}
}
function pattern(s,bx,by,bw,bh){
  if(MODE!=='f') return;
  const pc=s.pc||'#000';
  if(s.pat==='spots'){[[2,1],[7,3],[11,1],[4,5],[13,4],[9,6],[1,5]].forEach(([u,v])=>{if(u<bw-2&&v<bh-1){D(bx+1+u,by+v,2,2,pc); H(bx+1.5+u,by+v+.5,1,1,light(pc));}});}
  else if(s.pat==='stripes'){for(let k=bx+2;k<bx+bw-1;k+=3){D(k,by,1,bh,pc); H(k+.5,by+1,.5,bh-2,'#555');}}
  else if(s.pat==='scales'){for(let k=bx+1;k<bx+bw-1;k+=2) D(k,by+(k%4?0:1),1,1,pc); for(let k=bx+1.5;k<bx+bw-1;k+=2) H(k,by+2.5,.5,.5,pc);}
  else if(s.pat==='saddle'){D(bx+Math.round(bw*.38),by,Math.round(bw*.5),bh-1,pc); D(bx+Math.round(bw*.38)+1,by+bh-1,Math.round(bw*.5)-2,1,pc); H(bx+Math.round(bw*.38),by,Math.round(bw*.5),.5,'#ffffff');}
  else if(s.pat==='ribs'){D(bx+1,by+1,bw-2,1,'#ffffff'); for(let k=bx+2;k<bx+bw-2;k+=2) D(k,by+2,1,bh-3,'#ffffff'); H(bx+1,by+bh-2,bw-2,.5,'#ffffff');}
  else if(s.pat==='plaid'){for(let k=bx+1;k<bx+bw;k+=4) D(k,by,1,bh,'#1e5e3a'); for(let j=by+1;j<by+bh;j+=3) D(bx,j,bw,1,'#f2c94c'); for(let k=bx+2.5;k<bx+bw;k+=4) H(k,by,.5,bh,'#ffffff55');}
}
function tail(s,bx,by,a,t){
  const sw=Math.floor(t*3+a.id)%2;
  if(s.tail==='thin'){S(bx-3,by+1,3,1,s.bc); D(bx-4,by+1+sw,1,3,'#3a2a1a');}
  else if(s.tail==='tuft'){S(bx-5,by+1,5,1,s.bc); S(bx-7,by+sw,2,3,'#a3561c'); H(bx-6.5,by+sw+.5,.5,2,'#c97a3a');}
  else if(s.tail==='tiger'){S(bx-7,by+1+sw,7,1,s.bc); D(bx-3,by+1+sw,1,1,'#2b2b2b'); D(bx-6,by+1+sw,1,1,'#2b2b2b'); S(bx-9,by+sw,2,2,'#2b2b2b');}
  else if(s.tail==='stub'){S(bx-2,by+1,2,2,s.bc);}
  else if(s.tail==='feather'){S(bx-3,by,3,2,s.bc); D(bx-3,by+1,2,1,'#2b2b2b');}
  else if(s.tail==='croc'){S(bx-7,by+1,7,3,s.bc); S(bx-12,by+2-sw,5,2,s.bc); H(bx-11,by+2-sw,4,.5,light(s.bc));}
}
function partsQ(s,a,t){
  const breathe=HD?Math.sin(t*2.2+a.id)*.25:0;
  const bw=s.bw, bh=s.bh, bx=-(bw>>1), by=-s.ll-bh;
  tail(s,bx,by,a,t); legs(s,a,bx,bw);
  if(s.hump){S(bx+3,by-4,5,6,s.bc); H(bx+4,by-4,3,.5,light(s.bc)); if(s.hump>1){S(bx+10,by-4,5,6,s.bc); H(bx+11,by-4,3,.5,light(s.bc));}}
  S(bx+1,by-breathe,bw-2,bh+breathe,s.bc); S(bx,by+1,bw,bh-2,s.bc);
  if(HD&&MODE==='f'){const lc=light(s.bc), dc=shade(s.bc);
    H(bx+1,by-breathe,bw-2,1,lc); H(bx+1,by+bh-1,bw-2,1,dc); H(bx,by+1,.5,bh-2,dc); H(bx+bw-.5,by+1,.5,bh-3,lc);
    for(let i=1;i<bw-1;i+=2) H(bx+i+.5,by+1.5+((i*5)%3)*.5,.5,1,dc);
    for(let i=2;i<bw-2;i+=3) H(bx+i,by+bh-2,.5,.5,dc);}
  pattern(s,bx,by,bw,bh);
  H(bx+1,by-breathe,bw-2,.5,'rgba(255,255,255,.35)');
  let ay=by+1;
  if(s.nl>0){const nx=bx+bw-s.nw-1; S(nx,by-s.nl,s.nw,s.nl+2,s.bc); if(MODE==='f'){
      if(s.pat==='spots') for(let k=by-s.nl+2;k<by;k+=5) D(nx+1,k,1,2,s.pc);
      if(s.pat==='stripes') for(let k=by-s.nl+1;k<by;k+=3) D(nx,k,s.nw,1,s.pc);
      if(s.pat==='plaid') for(let k=by-s.nl+1;k<by;k+=3) D(nx,k,s.nw,1,'#f2c94c');
      if(s.head==='zeb') D(nx-1,by-s.nl,1,s.nl,'#2b2b2b');
      H(nx,by-s.nl,.5,s.nl,light(s.bc)); H(nx+s.nw-.5,by-s.nl,.5,s.nl,shade(s.bc)); if(s.head==='gir'||(s.pat==='spots')) H(nx-.5,by-s.nl+1,.5,s.nl-1,'#9a5b22');}
    ay=by-s.nl;}
  if(HD) ay+=Math.round(Math.sin(t*1.6+a.id*2)*1)/2;
  head(s.head,bx+bw-1,ay,s,a,t);
  if(has(a,'wielogl')){const pf=FL; FL=-FL; if(s.nl>0) S(bx+bw-s.nw-1,by-s.nl,s.nw,s.nl+2,s.bc); head(s.head,bx+bw-1,ay,s,a,t); FL=pf;}
  extras(a,t,bx,by,bw,bh,bx+bw-1,ay);
}
function extras(a,t,bx,by,bw,bh,ax,ay){
  if(has(a,'skrzyd')){const f=Math.sin(t*14+a.id)>0?0:3, wx=bx+(bw>>1)-4;
    S(wx,by-6+f,8,4+(f?0:2),'#ffffff'); S(wx-3,by-9+f*1.5,6,3,'#ffffff'); D(wx,by-2+f,8,1,'#d8e2ee'); H(wx+1,by-5+f,6,.5,'#c9d6e6'); H(wx-2,by-8+f*1.5,4,.5,'#c9d6e6');}
  if(has(a,'grzyb')){[[2,0],[7,1],[12,0]].forEach(([u,k])=>{if(u<bw-3){const mx=bx+u; S(mx+1,by-2-k,1,2+k,'#f4f1e8'); S(mx,by-4-k,4,2,'#e53950'); D(mx+1,by-4-k,1,1,'#fff'); D(mx+3,by-3-k,1,.5,'#fff'); H(mx+.5,by-4-k,3,.5,'#ff8a8a');}});}
  if(has(a,'rakieta')){S(bx+1,by-5,4,7,'#9aa1aa'); D(bx+2,by-5,1,7,'#d9dee4'); S(bx+1,by-7,4,2,'#e53950'); if(MODE==='f'){const fl=2+((TT*20|0)%3); rr(bx+1,by+2,4,fl,'#ffb000'); rr(bx+2,by+2,2,fl+1,'#ff6a2a');}}
  if(has(a,'magnes')){S(ax-3,ay-10,1,4,'#e53950'); S(ax+1,ay-10,1,4,'#e53950'); S(ax-3,ay-11,5,1,'#e53950'); D(ax-3,ay-7,1,1,'#ddd'); D(ax+1,ay-7,1,1,'#ddd');}
  if(has(a,'robot')){S(ax-1,ay-10,1,5,'#9aa1aa'); D(ax-1,ay-11,1,1,Math.floor(TT*3)%2?'#ff3030':'#ffd23f'); for(let i=bx+2;i<bx+bw-1;i+=4) D(i,by+1,1,1,'#ffffff');}
  if(has(a,'kosmita')){S(ax-3,ay-9,1,4,'#4ccf6a'); S(ax+1,ay-10,1,5,'#4ccf6a'); S(ax-4,ay-10,2,2,'#b6ff8a'); S(ax+1,ay-11,2,2,'#b6ff8a');}
}
function partsU(s,a,t){
  const bw=s.bw, bh=s.bh, bx=-(bw>>1), top=-bh-1, lift=a.mv?(Math.floor(a.ph)%2):0;
  S(-4,-2-(lift?1:0),3,2,'#f29a2e'); S(1,-2-(lift?0:1),3,2,'#f29a2e');
  H(-4,-1-(lift?1:0),.5,.5,'#c46a10'); H(-2.5,-1-(lift?1:0),.5,.5,'#c46a10');
  S(bx+1,top,bw-2,bh,s.bc); S(bx,top+2,bw,bh-3,s.bc);
  const fl=a.mv?Math.floor(a.ph)%2:Math.floor(t*1.5+a.id)%4===0?1:0;
  S(bx-1-fl,top+5,2,6,shade(s.bc));
  if(s.pat==='plaid') pattern(s,bx,top,bw,bh); else{D(bx+3,top+4,bw-5,bh-6,s.belly||'#f4f1e8'); H(bx+3,top+bh-3,bw-5,.5,'#d8d2c4'); H(bx+3.5,top+4,.5,bh-7,'#ffffff');}
  H(bx+1,top,bw-2,.5,light(s.bc));
  const drawH=()=>{if(s.nl>0){S(1,top-s.nl,3,s.nl+2,s.bc); head(s.head,4,top-s.nl,s,a,t);}
    else{eye(3,top+3,a); H(1.5,top+5,1,.5,'#ff8fa8'); S(bw/2|0,top+3,3,2,'#f29a2e'); H((bw/2|0)+.5,top+3,2,.5,'#ffc070');}};
  drawH(); if(has(a,'wielogl')){const pf=FL; FL=-FL; drawH(); FL=pf;}
  extras(a,t,bx,top+3,bw,bh-4,s.nl>0?4:3,s.nl>0?top-s.nl:top+3);
}
function partsT(s,a){
  const ll=s.t==='u'?2:Math.max(3,s.ll), lift=a.mv?(Math.floor(a.ph)%2):0;
  if(s.t==='u'){S(-5,-2,3,2,'#f29a2e'); S(2,-2,3,2,'#f29a2e');}
  else for(let i=0;i<4;i++){const up=(i%2===lift)?1:0; S(-8+i*5,-ll+up,2,ll-up,s.lc);}
  if(a.tm.tr) S(-6,-ll-14,5,3,'#d9a35b');
  S(-9,-ll-11,18,11,'#c3c9d1'); D(-8,-ll-10,16,1,'#eef1f5'); D(-8,-ll-2,16,1,'#9aa1aa');
  H(-8,-ll-9,.5,6,'#ffffff'); H(-7,-ll-9,3,.5,'#ffffff'); H(6,-ll-10,.5,8,'#8a919a');
  D(-6,-ll-11,5,1,'#2b2b2b'); D(1,-ll-11,5,1,'#2b2b2b'); S(9,-ll-8,2,3,'#555');
  eye(-4,-ll-7,a); eye(3,-ll-7,a); D(-1,-ll-4,3,1,'#111'); D(-6,-ll-5,2,1,'#f29aa0'); D(5,-ll-5,2,1,'#f29aa0');
}
function head(k,ax,ay,s,a,t){
  switch(k){
  case 'gir': S(ax-3,ay-4,6,5,'#e9b949'); S(ax+2,ay-3,3,3,'#d9a03c'); S(ax-2,ay-7,1,3,'#8a5a2b'); S(ax,ay-7,1,3,'#8a5a2b');
    eye(ax-1,ay-3,a); D(ax-4,ay-3,1,1,'#e9b949'); H(ax+3.5,ay-2.5,.5,.5,'#5a3a1a'); H(ax-2,ay-7,1,.5,'#5a3a1a'); H(ax,ay-7,1,.5,'#5a3a1a'); H(ax+1,ay-1,.5,.5,'#f2a0a0'); break;
  case 'zeb': S(ax-3,ay-3,5,4,'#f4f1e8'); S(ax+2,ay-2,3,3,'#2b2b2b'); S(ax-3,ay-5,1,2,'#f4f1e8'); D(ax-2,ay-3,1,4,'#2b2b2b');
    eye(ax,ay-2,a); H(ax+3.5,ay-1.5,.5,.5,'#888'); H(ax-3,ay-4.5,.5,1,'#f2a0a0'); break;
  case 'lion': S(ax-7,ay-5,9,11,'#a3561c'); S(ax-6,ay-6,7,13,'#a3561c');
    if(HD) for(let i=0;i<8;i++) H(ax-6+i,ay-5+(i%2)*2,.5,9,'#8a4514');
    S(ax-3,ay-2,6,6,'#e8b85a'); H(ax-3,ay-2,6,.5,'#f6d48a'); H(ax+3,ay+1,2,.25,'#ffffff'); H(ax+3,ay+2,2,.25,'#ffffff'); D(ax+2,ay,1,1,'#3a2a1a'); eye(ax,ay-1,a); D(ax+1,ay+3,2,1,'#7a3a1a'); H(ax-2,ay+2,1,.5,'#f2a07a'); H(ax+1,ay+1.5,.5,.5,'#fff'); break;
  case 'ele': S(ax-7,ay-2,5,8,'#7f8890'); H(ax-6,ay-1,3,6,'#d9a0a8'); S(ax-4,ay-3,8,9,'#9aa3ab'); S(ax+2,ay+5,3,7,'#9aa3ab'); S(ax+3,ay+11,3,2,'#9aa3ab');
    eye(ax+1,ay,a); D(ax-1,ay+5,3,1,'#fff'); if(HD) for(let i=0;i<4;i++) H(ax+2,ay+6+i*1.5,3,.5,'#7f8890'); H(ax-3,ay-3,6,.5,'#b8c0c8'); break;
  case 'croc':{const o=a.chomp>0?2:0;
    S(ax-2,ay-1,12,3,'#4f9a3c'); S(ax-2,ay+2+o,11,2,'#3f8a30'); S(ax-1,ay-3,3,2,'#4f9a3c');
    if(o) D(ax-1,ay+2,10,o,'#a8323a');
    for(let i=0;i<5;i++){D(ax+i*2,ay+2,1,1,'#fff'); D(ax+1+i*2,ay+1+o,1,1,'#fff'); H(ax+i*2,ay+2,.5,.5,'#cfe8ff');}
    D(ax,ay-3,1,1,a.fire>0?'#ff2030':'#ffd23f'); D(ax+1,ay-3,1,1,'#111'); H(ax+.5,ay-3,.5,.5,'#fff'); D(ax+9,ay-1,1,1,'#222');
    if(HD) for(let i=0;i<5;i++) H(ax+i*2+.5,ay-1,.5,.5,'#3a7a2b'); break;}
  case 'tiger': S(ax-4,ay-5,2,2,'#e8892b'); S(ax,ay-5,2,2,'#e8892b'); S(ax-4,ay-3,7,6,'#e8892b'); S(ax+2,ay,4,3,'#f4f1e8');
    D(ax-3,ay-3,1,2,'#2b2b2b'); D(ax-1,ay-3,1,1,'#2b2b2b'); D(ax+1,ay-3,1,1,'#2b2b2b'); D(ax-4,ay,2,1,'#2b2b2b'); D(ax+5,ay,1,1,'#3a2a1a'); eye(ax+1,ay-1,a);
    D(ax-4,ay-5,1,1,'#f4c8a0'); H(ax+4,ay+1.5,2,.25,'#fff'); H(ax+4,ay+2.5,2,.25,'#fff'); D(ax+2,ay+2,3,1,'#f4f1e8'); break;
  case 'tapir': S(ax-4,ay-2,6,5,'#2f3038'); S(ax+2,ay,3,3,'#2f3038'); S(ax+4,ay+2,1,3,'#2f3038'); S(ax-4,ay-4,2,2,'#2f3038'); D(ax-4,ay-4,2,1,'#e9e6df');
    eye(ax,ay-1,a); H(ax+3,ay+1,.5,.5,'#888'); break;
  case 'camel': S(ax-3,ay-3,7,4,'#c9a066'); S(ax+3,ay-1,2,3,'#b38a52'); S(ax-3,ay-5,1,2,'#c9a066'); eye(ax,ay-2,a); H(ax-.5,ay-3,1.5,.25,'#3a2a1a'); D(ax+4,ay+1,1,1,'#8a6a3a'); break;
  case 'hippo': S(ax-4,ay-3,7,7,'#8f7f9e'); S(ax+2,ay-1,5,7,'#a493b3'); S(ax-4,ay-5,2,2,'#8f7f9e'); S(ax,ay-5,2,2,'#8f7f9e'); D(ax+5,ay,1,1,'#3a2a3a'); D(ax+3,ay,1,1,'#3a2a3a');
    eye(ax,ay-2,a); D(ax+3,ay+5,1,1,'#fff'); D(ax+5,ay+5,1,1,'#fff'); H(ax-4,ay-5,1,1,'#f2a0b8'); H(ax+2,ay+3,4,.5,'#c9a0c0'); break;
  case 'flam': S(ax-2,ay-3,4,3,'#f58fb0'); S(ax+2,ay-2,3,2,'#f4f1e8'); S(ax+4,ay-1,1,2,'#111'); eye(ax,ay-2,a); H(ax-1,ay-3,2,.5,'#ffc0d4'); break;
  case 'peng': S(ax-3,ay-5,6,6,'#22252e'); D(ax-1,ay-4,3,3,'#f4f1e8'); eye(ax,ay-3,a); S(ax+3,ay-3,3,2,'#f29a2e'); H(ax+3.5,ay-3,2,.5,'#ffc070'); break;
  }
}
function drawPerson(p,t){
  const x=Math.round(p.x), y=Math.round(p.y);
  if(!p.inside){C.fillStyle='rgba(0,0,0,.2)'; C.fillRect(x-3,y-1,7,2);}
  C.save(); C.translate(x,y); if(p.kid) C.scale(.8,.8); FL=p.face||1;
  const lk=p.lk, lift=p.mv?(Math.floor(p.ph)%2):0;
  for(const md of ['o','f']){MODE=md;
    if(p.bal){D(2,-28,1,14,'#ddd'); S(0,-34,5,6,p.bal); H(1,-33,1,1.5,'#ffffff');}
    S(-3,-5+lift,2,5-lift,lk.pants); S(1,-5+(1-lift),2,4+lift,lk.pants);
    let shirt=lk.shirt; const ROLE={vet:'#f4f4f4',jan:'#3fa35a',guard:'#2d3e8c',sci:'#f4f4f4',mech:'#ff8c1a',doc:'#7d4fd0',fire:'#d32f2f'}; if(ROLE[p.role]) shirt=ROLE[p.role]; if(p.vip) shirt='#2b2b3b';
    S(-3,-11,6,6,shirt); S(-2,-16,5,5,lk.skin);
    if(p.role==='guard') S(-3,-18,6,2,'#1c2a6b'); else if(p.role==='mech'||p.role==='fire') S(-3,-18,6,2,'#ffd23f'); else if(!p.role&&lk.hat){S(-2,-18,5,2,lk.hat); S(-2,-17,7,1,lk.hat);} else if(p.vip){S(-2,-21,5,4,'#111'); S(-3,-17,7,1,'#111');} else S(-2,-17,5,2,lk.hair);
    D(-3,-16,1,3,lk.hair); D(1,-14,1,1,'#111');
    H(1,-14,.5,.5,'#fff'); H(0,-12.5,1.5,.5,'#8a3a3a'); H(-2,-11,.5,6,shade(shirt)); H(-1.5,-16,3,.5,light(lk.skin));
    if(p.role==='vet'){D(-1,-10,1,3,'#e53950'); D(-2,-9,3,1,'#e53950');}
    if(p.role==='sci'){D(-2,-15,5,1,'#3d9bff'); H(-1,-15,1,.5,'#bfe4ff');}
    if(p.role==='doc'){D(0,-14,3,1,'#111'); S(3,-10,3,4,'#fff');}
    if(p.role==='jan'){S(3,-14,1,13,'#8b5a2b'); S(2,-2,4,2,'#e0c060');}
    if(p.role==='mech'){S(3,-9,1,6,'#9aa1aa'); S(2,-10,3,1,'#9aa1aa'); D(-3,-8,6,1,'#c25f00');}
    if(p.vip){S(3,-7,4,4,'#6b4423'); D(2,-15,1,1,'#ffd23f');}
    if(!p.role&&!p.vip){if(lk.gl) D(0,-14,3,1,'#111'); if(lk.ice){S(3,-9,2,3,'#d9a35b'); S(3,-11,2,2,'#ff9ccd'); H(3,-11,1,.5,'#fff');}}
  }
  MODE='f'; FL=1; C.restore();
}
const ICONS={
 heart:{c:'#ff4d7a',b:['.x.x.','xxxxx','xxxxx','.xxx.','..x..']},
 bang:{c:'#ff3030',b:['..x..','..x..','..x..','.....','..x..']},
 q:{c:'#ffb000',b:['.xxx.','...x.','..x..','.....','..x..']},
 dizzy:{c:'#b56cff',b:['.xxx.','x...x','x.x.x','x..x.','.xx..']},
 dots:{c:'#6d5f7a',b:['.....','.....','.....','.....','x.x.x']},
 cross:{c:'#e53950',b:['..x..','..x..','xxxxx','..x..','..x..']},
 wrench:{c:'#59636e',b:['x...x','xx.xx','.xxx.','..x..','..x..']},
 star:{c:'#ffb000',b:['..x..','xxxxx','.xxx.','.x.x.','x...x']}
};
function drawIcon(k,x,y){const ic=ICONS[k]; if(!ic) return; x=Math.round(x)-4; y=Math.round(y)-9;
  C.fillStyle=OUT; C.fillRect(x-1,y-1,9,9); C.fillStyle='#fff'; C.fillRect(x,y,7,7);
  C.fillStyle=ic.c; ic.b.forEach((row,j)=>{for(let i=0;i<5;i++) if(row[i]==='x') C.fillRect(x+1+i,y+1+j,1,1);});}
function ellipseC(cx,cy,rx,ry,c){C.fillStyle=c; for(let dy=-ry;dy<=ry;dy++){const w=Math.round(rx*Math.sqrt(1-(dy*dy)/(ry*ry))); C.fillRect(cx-w,cy+dy,w*2,1);}}

