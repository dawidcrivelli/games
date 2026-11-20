/* ================= budynki: z zewnątrz ================= */
function signText(B,X,Y){C.fillStyle='#2b2036'; C.font='bold 6px "Nunito", sans-serif'; C.textAlign='center'; C.textBaseline='middle'; C.fillText(B.s,X,Y,56);}
function drawExterior(pl,t){
  const B=BLD[pl.b], sh=pl.cur?(Math.sin(t*45)>0?1:0):0, X=pl.tx*TS+sh, Y=pl.ty*TS; FL=1;
  const r=(x,y,w,h,c)=>{C.fillStyle=c;C.fillRect(X+x,Y+y,w,h);};
  r(11,19,90,54,OUT); r(12,20,88,52,B.w);
  if(HD) for(let k=0;k<10;k++) r(12,24+k*5,88,.5,shade(B.w));
  for(let k=0;k<4;k++){r(6+k*4,15-k*4,100-k*8,5,k%2?shade(B.r):B.r); if(HD) for(let i=0;i<100-k*8;i+=4) r(6+k*4+i,15-k*4+4.5,2,.5,shade(B.r));}
  r(6,19,100,2,OUT);
  const busy=pl.cur||(pl.b==='lab'&&labStaff(pl).length);
  r(46,49,20,23,OUT); r(47,50,18,22,busy?'#ffe9a3':'#4a3426'); r(55,50,2,22,OUT); r(52,60,1,2,'#ffd23f'); r(59,60,1,2,'#ffd23f');
  r(26,23,60,10,OUT); r(27,24,58,8,'#fff7e0'); signText(B,X+56,Y+28.5);
  const glass='#9fd8f0', win=(x)=>{r(x,38,22,16,OUT); r(x+1,39,20,14,glass); r(x+1,45,20,1,OUT); r(x+10,39,1,14,OUT); if(HD){r(x+2,40,4,.5,'#e6f7ff'); r(x+2,40,.5,3,'#e6f7ff');}};
  if(pl.b==='skaner'){
    r(17,38,22,16,OUT); r(18,39,20,14,'#163a2a'); const sx=Math.floor((t*30)%20); for(let i=0;i<20;i++) r(18+i,45+Math.round(Math.sin(i*.9+t*6)*3),1,1,'#4dff9a'); r(18+sx,39,1,14,'#9dffcb');
    win(73); r(76,-6,14,4,'#e8e8e8'); r(74,-8,18,2,'#cfcfcf'); r(82,-2,2,6,'#888'); if(Math.floor(t*3)%2) r(82,-10,2,2,'#ff3a3a');
  } else if(pl.b==='pralnia'){
    ellipseC(X+28,Y+46,10,10,OUT); ellipseC(X+28,Y+46,9,9,'#b9c0cc'); ellipseC(X+28,Y+46,6,6,'#5fc3ff');
    const sp=pl.cur?12:2; for(let i=0;i<6;i++){const an=t*sp+i; r(Math.round(28+Math.cos(an)*4)-1,Math.round(46+Math.sin(an)*4)-1,2,2,i%2?'#ff6fb0':'#ffffff');}
    win(73); for(let i=0;i<14;i++){r(40+i*2,Math.round(-4+Math.sin(i*.7+t*3)*3),2,2,'#ff6fb0'); r(40+i*2,Math.round(-4-Math.sin(i*.7+t*3)*3),2,2,'#4aa8ff');}
  } else if(pl.b==='kompresor'){
    r(88,-8,8,30,OUT); r(89,-7,6,29,'#7d868f'); r(87,-9,10,3,'#59636e');
    ellipseC(X+28,Y+45,9,9,OUT); ellipseC(X+28,Y+45,8,8,'#f4f1e8'); const an=pl.cur?t*8:Math.sin(t)*.3-1;
    for(let k=0;k<6;k++) r(Math.round(28+Math.cos(an)*k)-1,Math.round(45+Math.sin(an)*k)-1,2,2,'#e53950');
    win(73); r(12,64,88,3,'#59636e');
  } else if(pl.b==='agd'){
    r(42,-6,28,14,OUT); r(43,-5,26,12,'#c3c9d1'); r(47,-5,7,2,'#2b2b2b'); r(58,-5,7,2,'#2b2b2b');
    const pop=pl.cur?Math.abs(Math.sin(t*6))*6:0; r(47,Math.round(-9-pop),7,5,'#d9a35b'); r(58,Math.round(-8-pop*.7),7,4,'#d9a35b');
    win(17); r(21,42,14,3,'#555'); r(26,42,4,9,'#555'); win(73);
  } else if(pl.b==='terapia'){
    r(17,38,22,16,OUT); r(18,39,20,14,'#ffeaa7'); r(20,46,16,4,'#8b3a3a'); r(20,43,4,3,'#8b3a3a');
    win(73); if(pl.cur&&Math.floor(t*2)%2){C.fillStyle='#7d4fd0'; C.font='bold 8px "Nunito", sans-serif'; C.fillText('?',X+60,Y-10);}
  } else if(pl.b==='stabil'){
    win(17); win(73);
    const sp=pl.cur?6:1.2; for(let i=0;i<24;i++){const an=i/24*Math.PI*2;
      r(Math.round(56+Math.cos(an)*14),Math.round(-6+Math.sin(an)*4*Math.cos(t*sp)),2,2,'#1f8f7a');
      r(Math.round(56+Math.cos(an)*5*Math.sin(t*sp)),Math.round(-6+Math.sin(an)*12),2,2,'#ffd23f');}
    r(54,-8,4,4,'#e53950');
  } else if(pl.b==='pompa'){
    win(73); ellipseC(X+28,Y+46,9,9,OUT); ellipseC(X+28,Y+46,8,8,'#fff7e0'); const an=pl.cur?-2.4+Math.abs(Math.sin(t*3))*2:-2.2; for(let k=0;k<6;k++) r(Math.round(28+Math.cos(an)*k)-1,Math.round(46+Math.sin(an)*k)-1,2,2,'#2f9e4b');
    const py=pl.cur?Math.abs(Math.sin(t*5))*6:0; r(50,-10,8,18,OUT); r(51,-9,6,16,'#d9822b'); r(53,Math.round(-16+py),2,8,'#555'); r(46,Math.round(-17+py),10,2,OUT);
    r(58,2,14,2,'#333'); r(70,2,2,10,'#333');
  } else if(pl.b==='malarnia'){
    win(73); win(17); [[16,58,'#e53950'],[30,64,'#3d9bff'],[84,60,'#ffd23f'],[92,66,'#2fd39a'],[40,40,'#ff6fb0']].forEach(([x,y,c])=>{r(x,y,4,3,c); r(x+1,y+3,1,2,c);});
    [['#e53950',38],['#3d9bff',50],['#ffd23f',62]].forEach(([c,x],i)=>{r(x,-6,9,10,OUT); r(x+1,-5,7,8,'#c9ced6'); r(x+1,-5,7,2,c); if(pl.cur&&Math.random()<.2) PT.push({x:X+x+4,y:Y-6,vx:rnd(-10,10),vy:-18,life:.6,max:.6,c,s:1});});
  } else if(pl.b==='sauna'){
    for(let k=0;k<10;k++) r(12,22+k*5,88,1,'#a36a3a');
    r(17,38,22,16,OUT); r(18,39,20,14,pl.cur?'#ffb36b':'#ffd59a'); r(82,-8,8,26,OUT); r(83,-7,6,25,'#59636e');
    if(Math.random()<(pl.cur?.4:.1)) PT.push({x:X+86,y:Y-9,vx:rnd(-4,4),vy:rnd(-16,-8),life:1.6,max:1.6,c:'rgba(255,255,255,.7)',s:3});
    r(72,40,20,6,OUT); r(73,41,18,4,'#8b4a22'); r(74,42,16,1,'#c48a52');
  } else if(pl.b==='gasnica'){
    r(16,36,26,34,OUT); r(17,37,24,33,'#c9c9c9'); for(let k=0;k<6;k++) r(17,39+k*5,24,1,'#9a9a9a');
    win(73); const on=Math.floor(t*(pl.cur?8:2))%2; r(50,-8,12,6,OUT); r(51,-7,5,4,on?'#ff3030':'#7a1a1a'); r(56,-7,5,4,on?'#3070ff':'#1a2a7a');
    ellipseC(X+86,Y+62,5,5,OUT); ellipseC(X+86,Y+62,4,4,'#d32f2f'); ellipseC(X+86,Y+62,2,2,'#ffd23f');
  } else if(pl.b==='neutral'){
    win(17); win(73);
    for(const cx of [34,78]){for(let k=0;k<4;k++){r(cx-4+k,-2-k*4,8-k*2,3,OUT); r(cx-3+k,-1-k*4,6-k*2,1,'#c9b8ff');} r(cx-1,-18,3,3,'#9b59d6');}
    if(pl.cur||Math.random()<.05){C.strokeStyle=Math.random()<.5?'#e8dcff':'#b48cff'; C.lineWidth=.8; C.beginPath(); C.moveTo(X+35,Y-17); for(let i=1;i<8;i++) C.lineTo(X+35+i*6,Y-17+rnd(-5,5)); C.lineTo(X+79,Y-17); C.stroke(); if(pl.cur&&Math.random()<.1) snd('zzap');}
  } else if(pl.b==='lab'){
    win(17); win(73);
    for(let i=0;i<3;i++){const bx=38+i*14; r(bx,-6,6,10,OUT); r(bx+1,-5,4,8,'#cfe3ff'); r(bx+1,-1,4,4,['#7dff6a','#ff6fb0','#4aa8ff'][i]);
      if(busy&&Math.random()<.15) PT.push({x:X+bx+3,y:Y-7,vx:rnd(-3,3),vy:-10,life:.8,max:.8,c:['#7dff6a','#ff6fb0','#4aa8ff'][i],s:1});}
  }
}
function wearFx(pl,t){
  if(pl.k!=='bld'||!MACH.includes(pl.b)) return;
  const X=pl.tx*TS, Y=pl.ty*TS;
  if(pl.wear>60&&Math.random()<.12) PT.push({x:X+20+Math.random()*70,y:Y+18,vx:rnd(-4,4),vy:rnd(-16,-8),life:1.4,max:1.4,c:'rgba(70,70,70,.6)',s:3});
  if(pl.wear>85){if(Math.random()<.2) PT.push({x:X+20+Math.random()*70,y:Y+30+Math.random()*30,vx:rnd(-30,30),vy:rnd(-40,-10),life:.4,max:.4,c:'#ffe14d',s:1});
    if(Math.floor(t*4)%2) drawIcon('bang',X+56,Y-14);}
  else if(pl.wear>60&&Math.floor(t*2)%2) drawIcon('wrench',X+56,Y-14);
  if(pl.cur){const p=1-pl.ct/pl.cmax; C.fillStyle=OUT; C.fillRect(X+30,Y+4,52,4); C.fillStyle='#4dff9a'; C.fillRect(X+31,Y+5,50*p,2);}
}

