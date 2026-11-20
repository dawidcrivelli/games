/* ================= mapa statyczna (2× szczegółów) ================= */
const MS=2;
const mapC=document.createElement('canvas'); mapC.width=MW*TS*MS; mapC.height=MH*TS*MS;
function hsh(x,y,k){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(k+1,2246822519); n=Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967295;}
function rebuildStatic(){
  const m=mapC.getContext('2d'); m.setTransform(MS,0,0,MS,0,0);
  const r=(x,y,w,h,c)=>{m.fillStyle=c;m.fillRect(x,y,w,h);};
  const T=THEMES[LV().theme];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const t=grid[y*MW+x], X=x*TS, Y=y*TS;
    if(t===T_GRASS||t===T_TREE||t===T_PLOT){
      r(X,Y,16,16,T.g);
      for(let k=0;k<6;k++) r(X+Math.floor(hsh(x,y,k)*15),Y+Math.floor(hsh(x,y,k+9)*14),1,2,k%2?T.g1:T.g2);
      for(let k=0;k<10;k++){const bx=X+hsh(x,y,k+30)*15, by=Y+hsh(x,y,k+50)*14; r(bx,by,.5,1.5,k%2?T.g1:T.g2); r(bx+.5,by-.5,.5,.5,T.g2);}
      if(hsh(x,y,77)<.1){const fc=T.tree==='cactus'?'#e86a5a':(hsh(x,y,78)<.5?'#ffe066':'#ffffff'); r(X+6,Y+7,2,2,fc); r(X+6.5,Y+7.5,1,1,'#ffb000'); r(X+7,Y+9,.5,2,T.g1);}
    } else if(t===T_PATH){
      r(X,Y,16,16,T.tree==='cactus'?'#cfa86a':'#d8b878');
      for(let k=0;k<3;k++) r(X+Math.floor(hsh(x,y,k)*14),Y+Math.floor(hsh(x,y,k+5)*14),2,1,'#c19f62');
      for(let k=0;k<6;k++) r(X+hsh(x,y,k+20)*15,Y+hsh(x,y,k+40)*15,.5,.5,k%2?'#b8955a':'#e6cc96');
    } else {
      r(X,Y,16,16,'#cdb594'); r(X,Y,16,1,'#b9a07c'); r(X,Y,1,16,'#b9a07c'); r(X+8,Y+8,8,1,'#c2a985');
      r(X+1,Y+1,15,.5,'#dcc6a6'); r(X+1,Y+1,.5,15,'#dcc6a6');
    }
  }
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const t=grid[y*MW+x]; if(t!==T_PATH) continue; const X=x*TS,Y=y*TS;
    const nb=(dx,dy)=>{const g=grid[(y+dy)*MW+x+dx]; return g===T_PATH||g===T_PLAZA||g===T_GATE;};
    if(!nb(0,-1)) r(X,Y,16,1,'#b8955a'); if(!nb(0,1)) r(X,Y+15,16,1,'#b8955a');
    if(!nb(-1,0)) r(X,Y,1,16,'#b8955a'); if(!nb(1,0)) r(X+15,Y,1,16,'#b8955a');
  }
  G.plots.forEach(pl=>drawPlotStatic(r,pl,T));
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    if(grid[y*MW+x]!==T_TREE) continue; const X=x*TS+8, Y=y*TS+12, v=hsh(x,y,3);
    if(T.tree==='cactus'){
      if(v<.45){r(X-6,Y-1,12,2,'rgba(0,0,0,.15)'); continue;}
      r(X-2,Y-14,5,15,T.c1); r(X-1,Y-14,2,15,T.c2); r(X-.5,Y-13,.5,13,T.c3);
      r(X-6,Y-9,4,2,T.c1); r(X-6,Y-13,2,5,T.c1); r(X+3,Y-7,4,2,T.c1); r(X+5,Y-11,2,5,T.c1);
      for(let k=0;k<6;k++) r(X-2+((k*3)%5),Y-13+k*2,.5,.5,'#f4efe0');
      if(v>.85){r(X-1,Y-16,3,2,'#ff6fb0'); r(X-.5,Y-15.5,1,1,'#ffd23f');}
      continue;
    }
    r(X-2,Y-4,4,7,'#6b4423'); r(X-1.5,Y-4,.5,7,'#8a5a32');
    const R=7+Math.floor(v*2);
    for(let dy=-R;dy<=R;dy++){const w=Math.floor(Math.sqrt(R*R-dy*dy)); r(X-w,Y-9+dy,w*2,1,T.c1);}
    for(let dy=-R+2;dy<=R-3;dy++){const w=Math.floor(Math.sqrt((R-2)*(R-2)-dy*dy)); r(X-w-1,Y-10+dy,w*2,1,T.c2);}
    r(X-3,Y-15,3,2,T.c3);
    for(let k=0;k<14;k++){const a=hsh(x,y,k+60)*6.28, d=hsh(x,y,k+80)*(R-1); r(X+Math.cos(a)*d-1,Y-10+Math.sin(a)*d,.5,.5,k%3?T.c3:T.c1);}
    if(T.tree==='willow') for(let k=0;k<7;k++) r(X-R+1+k*2.2,Y-6,.5,4+hsh(x,y,k+90)*4,T.c1);
  }
  r(32,396,64,30,'#1a1226'); r(33,397,62,28,'#b5835a'); for(let k=0;k<4;k++) r(31+k*2,388+k*2,66-k*4,2,'#8b3a3a');
  for(let k=0;k<30;k++) r(33+k*2.1,397,.5,28,'#a77650');
  r(58,410,12,15,'#4a3426'); r(38,404,12,8,'#9fd8f0'); r(78,404,12,8,'#9fd8f0'); r(39,405,4,.5,'#e6f7ff'); r(79,405,4,.5,'#e6f7ff');
  const BX=(GX+2)*TS; r(BX,420,32,20,'#1a1226'); r(BX+1,421,30,18,'#e05a7a'); r(BX+5,425,22,8,'#9fd8f0'); r(BX-1,416,34,5,'#ffd23f');
  for(let k=0;k<8;k++) r(BX-1+k*4.5,416,2,5,'#ff8c1a');
  LAMPS.forEach(l=>{r(l.x,l.y-12,1,12,'#2b2b33'); r(l.x-1,l.y-14,3,2,'#444'); r(l.x,l.y-12,1,1,'#ffe9a3'); r(l.x-1,l.y,3,1,'rgba(0,0,0,.2)');});
}
function drawPlotStatic(r,pl,T){
  const X=pl.tx*TS, Y=pl.ty*TS, W=112, H=80;
  if(pl.k===null){
    r(X+2,Y+2,W-4,H-4,T.empty); for(let k=6;k<H-4;k+=6){r(X+6,Y+k,W-12,1,'rgba(0,0,0,.12)'); r(X+6,Y+k+1,W-12,.5,'rgba(255,255,255,.12)');}
    r(X+55,Y+40,3,18,'#6b4423'); r(X+42,Y+28,28,14,'#1a1226'); r(X+43,Y+29,26,12,'#f1e3b8');
    r(X+54,Y+30,4,10,'#2f9e4b'); r(X+51,Y+33,10,4,'#2f9e4b'); r(X+54.5,Y+30.5,1,3,'#6fe08f');
    return;
  }
  if(pl.k==='bld'){r(X+2,Y+2,W-4,H-4,'#b9ab95'); r(X+2,Y+H-6,W-4,4,'#a39580'); return;}
  if(pl.k==='ruin'){
    r(X+2,Y+2,W-4,H-4,'#8a7a66');
    for(let k=0;k<40;k++){const x=X+8+hsh(pl.tx,pl.ty,k)*92, y=Y+10+hsh(pl.tx,pl.ty,k+50)*60, s=1+hsh(pl.tx,pl.ty,k+99)*5;
      r(x,y,s,s*.7,k%3===0?'#5b4f42':k%3===1?'#a89a86':BLD[pl.b].r);}
    r(X+20,Y+20,6,30,'#1a1226'); r(X+21,Y+21,4,28,BLD[pl.b].w); r(X+80,Y+30,6,22,'#1a1226'); r(X+81,Y+31,4,20,BLD[pl.b].w);
    for(let k=0;k<8;k++) r(X+30+k*7,Y+50+(k%3),5,.5,'#2b2036');
    return;
  }
  const hab=SPEC[pl.sp].hab;
  const base={ice:'#e3f4fb',swamp:'#5f8f48',jungle:'#4c8a3a',desert:'#e6c27a'}[hab]||'#d6bf6c';
  r(X+2,Y+2,W-4,H-4,base);
  for(let k=0;k<26;k++){const x=X+6+Math.floor(hsh(pl.tx,pl.ty,k)*(W-14)), y=Y+10+Math.floor(hsh(pl.tx,pl.ty,k+40)*(H-20));
    r(x,y,hab==='ice'?3:1,hab==='ice'?1:2,hab==='ice'?'#c2e4f1':hab==='swamp'?'#4c7a38':'#b9a14e');}
  for(let k=0;k<40;k++){const x=X+6+hsh(pl.tx,pl.ty,k+200)*(W-14), y=Y+10+hsh(pl.tx,pl.ty,k+240)*(H-20);
    r(x,y,.5,hab==='ice'?.5:1.5,hab==='ice'?'#ffffff':hab==='swamp'?'#6fa556':'#c8b05a');}
  if(hab==='ice'){ellipse(r,X+86,Y+28,12,6,'#5fb3d6'); ellipse(r,X+86,Y+27,9,3,'#8fd0ea'); r(X+80,Y+25,5,.5,'#ffffff');}
  if(hab==='swamp'){ellipse(r,X+30,Y+30,16,7,'#3d7f8f'); ellipse(r,X+30,Y+29,12,4,'#5aa0ad'); r(X+24,Y+27,6,.5,'#bfe9ff'); for(let k=0;k<5;k++){r(X+12+k*4,Y+22,1,6,'#2e5e2a'); r(X+12+k*4,Y+21,1,2,'#7a5a2a');}}
  if(hab==='sav'){r(X+84,Y+20,10,6,'#a89a86'); r(X+86,Y+18,6,2,'#bdb09b'); r(X+86,Y+19,3,.5,'#d8ccb8');}
  if(hab==='jungle'){[[18,18,9],[90,22,10],[60,16,7],[24,58,7],[94,60,8]].forEach(([x,y,R],i)=>{ellipse(r,X+x,Y+y,R,Math.round(R*.7),'#2f6a2a'); ellipse(r,X+x-1,Y+y-1,R-2,Math.round(R*.5),'#3f8a36'); r(X+x-2,Y+y-2,2,.5,'#7cc46a');});
    for(let k=0;k<6;k++) r(X+10+k*17,Y+9,.5,8+(k%3)*3,'#2e5e2a');}
  if(hab==='desert'){for(let k=0;k<5;k++) r(X+8,Y+20+k*11,W-16,.5,'#d4ad62'); ellipse(r,X+28,Y+30,14,4,'#ecd08e'); ellipse(r,X+80,Y+56,16,4,'#ecd08e');
    r(X+90,Y+20,3,10,'#3f8a4a'); r(X+87,Y+23,3,1.5,'#3f8a4a'); r(X+87,Y+21,1.5,3,'#3f8a4a'); r(X+92,Y+25,3,1.5,'#3f8a4a'); r(X+94,Y+22,1.5,4,'#3f8a4a');}
  const post='#6a3f1c', rail='#a8743f';
  r(X,Y+3,W,1,rail); r(X,Y+7,W,1,rail); r(X,Y+H-9,W,1,rail); r(X,Y+H-5,W,1,rail);
  r(X,Y+3,W,.5,'#c99560'); r(X,Y+H-9,W,.5,'#c99560');
  r(X+1,Y,1,H-2,rail); r(X+5,Y,1,H-2,rail); r(X+W-2,Y,1,H-2,rail); r(X+W-6,Y,1,H-2,rail);
  for(let i=0;i<W;i+=8){r(X+i,Y+1,2,9,post); r(X+i,Y+H-11,2,9,post); r(X+i,Y+1,.5,9,'#8a5a32'); r(X+i,Y+H-11,.5,9,'#8a5a32');}
  for(let i=0;i<H-4;i+=8){r(X,Y+i,7,2,post); r(X+W-7,Y+i,7,2,post);}
  r(X+48,Y+H-12,16,10,base); r(X+49,Y+H-11,14,8,'#c08a4a'); r(X+49,Y+H-8,14,1,'#7a4b22'); r(X+55,Y+H-11,2,8,'#7a4b22');
}
function ellipse(r,cx,cy,rx,ry,c){for(let dy=-ry;dy<=ry;dy++){const w=Math.round(rx*Math.sqrt(1-(dy*dy)/(ry*ry))); r(cx-w,cy+dy,w*2,1,c);}}

