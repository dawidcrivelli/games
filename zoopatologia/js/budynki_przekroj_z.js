/* ================= budynki: przekrój z animacją leczenia ================= */
function drawPatient(a,t,x,y,sc,rot){
  const sa=a.alt, sf=a.face, sm=a.mv; a.alt=0; a.face=1; a.mv=false;
  C.save(); C.translate(x,y); if(rot) C.rotate(rot); C.scale(sc,sc); drawAnimal(a,t,0,0,true); C.restore();
  a.alt=sa; a.face=sf; a.mv=sm;
}
function labStaff(pl){const i=G.plots.indexOf(pl); return G.staff.filter(s=>s.role==='sci'&&s.st==='in'&&s.lab===i);}
function drawCutaway(pl,t){
  const B=BLD[pl.b], X=pl.tx*TS, Y=pl.ty*TS; FL=1;
  const r=(x,y,w,h,c)=>{C.fillStyle=c;C.fillRect(X+x,Y+y,w,h);};
  r(7,11,98,64,OUT);
  r(8,12,96,4,B.r); r(8,16,96,10,B.w); r(8,25,96,1,shade(B.w));
  for(let j=0;j<7;j++)for(let i=0;i<12;i++){const x=10+i*8; r(x,26+j*7,Math.min(8,102-x),7,(i+j)%2?B.f[0]:B.f[1]);}
  for(let i=0;i<24;i++) r(10+i*4,26,.5,48,'rgba(0,0,0,.05)');
  r(8,16,3,58,shade(B.w)); r(101,16,3,58,shade(B.w));
  r(8,71,38,4,B.w); r(66,71,38,4,B.w); r(8,71,38,1,OUT); r(66,71,38,1,OUT);
  r(28,16,56,9,OUT); r(29,17,54,7,'#fff7e0'); signText(B,X+56,Y+20.7);
  r(12,17,12,7,'#9fd8f0'); r(12.5,17.5,3,.5,'#e6f7ff'); r(88,17,12,7,'#9fd8f0');
  if(pl.wear>60) for(let k=0;k<5;k++) r(14+k*19,18+k%2*3,.5,6,OUT);
  const a=pl.cur?byId(pl.cur):null, p=pl.cur?1-pl.ct/pl.cmax:0;
  const bub=(x,y,c)=>{if(Math.random()<.3) PT.push({x:X+x+rnd(-6,6),y:Y+y,vx:rnd(-4,4),vy:rnd(-14,-6),life:.9,max:.9,c,s:1});};
  switch(pl.b){
  case 'skaner':{
    r(26,22,52,2,'#666'); r(28,52,46,5,OUT); r(29,53,44,3,'#dfe6ee'); r(31,57,3,10,'#888'); r(69,57,3,10,'#888');
    r(86,30,14,12,OUT); r(87,31,12,10,'#163a2a'); for(let i=0;i<12;i++) r(87+i,36+Math.round(Math.sin(i*.9+t*8)*(a?3:1)),1,1,'#4dff9a');
    if(a) drawPatient(a,t,X+51,Y+53,Math.min(1,26/animalHeight(a)));
    const sx=28+(Math.sin(t*(a?3:.8))*.5+.5)*44; r(sx-3,22,7,4,'#4dff9a');
    if(a){C.fillStyle='rgba(80,255,160,.3)'; C.fillRect(X+sx-2,Y+26,5,28); if(Math.floor(t*5)%2) r(sx,26,1,28,'#bfffdc');}
    break;}
  case 'pralnia':{
    r(33,27,46,44,OUT); r(34,28,44,42,'#eef1f5'); r(34,28,44,6,'#c9ced6'); for(let i=0;i<4;i++) r(38+i*5,30,3,2,i===Math.floor(t*4)%4&&a?'#4dff9a':'#888');
    ellipseC(X+56,Y+51,16,16,OUT); ellipseC(X+56,Y+51,15,15,'#9aa3ae'); ellipseC(X+56,Y+51,12,12,'#5fc3ff');
    if(a){C.save(); C.beginPath(); C.arc(X+56,Y+51,12,0,Math.PI*2); C.clip(); const h=animalHeight(a), sc=Math.min(.7,18/h);
      C.translate(X+56,Y+51); C.rotate(t*7); drawPatient(a,t,0,h*sc/2,sc); C.restore();
      for(let i=0;i<6;i++){const an=-t*5+i; r(Math.round(56+Math.cos(an)*9),Math.round(51+Math.sin(an)*9),1,1,'#ffffff');}
      bub(56,40,'#ffffff'); bub(56,40,'#ff9ccd');}
    else for(let i=0;i<3;i++){const an=t+i*2; r(Math.round(56+Math.cos(an)*8),Math.round(51+Math.sin(an)*8),1,1,'#e6f7ff');}
    r(48,44,4,3,'rgba(255,255,255,.5)');
    break;}
  case 'kompresor':{
    const sq=a?Math.abs(Math.sin(t*2.6))*10:2;
    r(28,26,5,46,OUT); r(29,27,3,44,'#59636e'); r(80,26,5,46,OUT); r(81,27,3,44,'#59636e');
    r(54,25,5,4+sq,OUT); r(55,25,3,4+sq,'#b8c0c8');
    r(31,28+sq,52,5,OUT); r(32,29+sq,50,3,'#7d868f'); r(32,29+sq,50,.5,'#aeb6be');
    r(31,64,52,5,OUT); r(32,65,50,3,'#7d868f');
    ellipseC(X+94,Y+40,6,6,OUT); ellipseC(X+94,Y+40,5,5,'#f4f1e8'); const an=-1.5+sq/10*2.5; for(let k=0;k<5;k++) r(Math.round(94+Math.cos(an)*k),Math.round(40+Math.sin(an)*k),1,1,'#e53950');
    if(a){const h=animalHeight(a), sc=Math.min(.95,30/h); C.save(); C.translate(X+57,Y+64); C.scale(1+sq*.03,1-sq*.035); drawPatient(a,t,0,0,sc); C.restore();
      if(sq>8){bub(30,60,'rgba(240,240,255,.9)'); bub(84,60,'rgba(240,240,255,.9)');}}
    break;}
  case 'agd':{
    r(30,58,52,6,OUT); r(31,59,50,4,'#8b5a2b'); r(31,59,50,.5,'#b07a42'); r(33,63,3,9,'#6b4423'); r(76,63,3,9,'#6b4423');
    r(86,62,14,8,OUT); r(87,63,12,6,'#e53950'); r(90,61,6,2,'#888');
    const ax1=44+Math.sin(t*5)*4, ay1=44+Math.cos(t*4)*3, ax2=68+Math.cos(t*5)*4, ay2=42+Math.sin(t*4.4)*3;
    C.strokeStyle=OUT; C.lineWidth=3; C.beginPath(); C.moveTo(X+11,Y+30); C.lineTo(X+24,Y+38); C.lineTo(X+ax1,Y+ay1); C.moveTo(X+101,Y+30); C.lineTo(X+88,Y+36); C.lineTo(X+ax2,Y+ay2); C.stroke();
    C.strokeStyle='#9aa1aa'; C.lineWidth=1.6; C.stroke();
    r(22,36,4,4,'#ffd23f'); r(86,34,4,4,'#ffd23f'); r(ax1-2,ay1-2,4,4,'#555'); r(ax2-2,ay2-2,4,4,'#555');
    if(a){drawPatient(a,t,X+56,Y+59,Math.min(.9,30/animalHeight(a)));
      for(let i=0;i<2;i++) if(Math.random()<.6) PT.push({x:X+(i?ax2:ax1),y:Y+(i?ay2:ay1)+2,vx:rnd(-30,30),vy:rnd(-30,5),life:.35,max:.35,c:Math.random()<.5?'#ffe14d':'#ffffff',s:1});}
    break;}
  case 'terapia':{
    ellipseC(X+50,Y+60,30,8,'#c98ad6'); ellipseC(X+50,Y+60,26,6,'#d9a0e6');
    r(22,44,7,20,OUT); r(23,45,5,18,'#8b3a3a'); r(22,52,40,10,OUT); r(23,53,38,8,'#a64545'); r(23,53,38,.5,'#c96060');
    r(78,56,14,8,OUT); r(79,57,12,6,'#6b4423'); r(94,40,6,12,'#2f9e4b'); r(95,52,4,6,'#c97a3a');
    ellipseC(X+86,Y+22,3,3,OUT); ellipseC(X+86,Y+22,2,2,'#fff'); r(86,21,1,2,OUT);
    drawPerson({x:X+85,y:Y+64,face:-1,role:'doc',lk:{skin:'#f2c9a0',hair:'#888',pants:'#3b4a6b',shirt:'#fff'},mv:false,ph:0,inside:1},t);
    if(a){drawPatient(a,t,X+42,Y+54,Math.min(.8,24/animalHeight(a)));
      const ph=Math.floor(t/1.6)%3; if(ph===0) drawIcon('dots',X+85,Y+44); else if(ph===1) drawIcon('q',X+42,Y+54-Math.min(24,animalHeight(a)*.8)-6); else drawIcon('heart',X+42,Y+54-Math.min(24,animalHeight(a)*.8)-6);}
    break;}
  case 'stabil':{
    ellipseC(X+56,Y+64,22,5,OUT); ellipseC(X+56,Y+64,21,4,'#1f8f7a'); ellipseC(X+56,Y+64,16,2,'#4be3b0');
    const sp=a?5:1, fy=a?Math.abs(Math.sin(t*2))*8:0;
    for(let i=0;i<40;i++){const an=i/40*Math.PI*2;
      r(Math.round(56+Math.cos(an)*22),Math.round(46+Math.sin(an)*7*Math.cos(t*sp)),1.5,1.5,'#4be3b0');
      r(Math.round(56+Math.cos(an)*9*Math.sin(t*sp)),Math.round(46+Math.sin(an)*18),1.5,1.5,'#ffd23f');}
    if(a){drawPatient(a,t,X+56,Y+58-fy,Math.min(.85,28/animalHeight(a))); bub(56,40,'#bff6ff');}
    break;}
  case 'pompa':{
    const py=a?Math.abs(Math.sin(t*4))*10:0;
    r(18,40,10,30,OUT); r(19,41,8,28,'#d9822b'); r(19,41,8,1,'#f2a35a'); r(22,Math.round(28+py),2,14,'#555'); r(16,Math.round(26+py),14,3,OUT); r(17,Math.round(27+py),12,1,'#888');
    C.strokeStyle=OUT; C.lineWidth=2; C.beginPath(); C.moveTo(X+27,Y+64); C.quadraticCurveTo(X+38,Y+74,X+48,Y+62); C.stroke(); C.strokeStyle='#2b2b2b'; C.lineWidth=1; C.stroke();
    ellipseC(X+92,Y+34,7,7,OUT); ellipseC(X+92,Y+34,6,6,'#fff7e0'); const an=-2.6+p*2.4; for(let k=0;k<5;k++) r(Math.round(92+Math.cos(an)*k),Math.round(34+Math.sin(an)*k),1,1,'#2f9e4b');
    r(40,64,40,5,OUT); r(41,65,38,3,'#9aa1aa');
    if(a){const pulse=1+.15*Math.sin(t*8)+p*.6; const h=animalHeight(a); drawPatient(a,t,X+60,Y+65,Math.min(1.2,26/Math.max(8,h))*pulse);}
    break;}
  case 'malarnia':{
    for(let k=0;k<26;k++){const x=12+hsh(pl.tx,pl.ty,k)*88, y=28+hsh(pl.tx,pl.ty,k+30)*44; r(x,y,2+hsh(pl.tx,pl.ty,k+60)*3,1.5,['#e53950','#3d9bff','#ffd23f','#2fd39a','#ff6fb0'][k%5]);}
    ellipseC(X+56,Y+66,18,4,OUT); ellipseC(X+56,Y+66,17,3,'#c9ced6');
    const g1=[20,34+Math.sin(t*3)*6], g2=[92,34+Math.cos(t*3)*6];
    [g1,g2].forEach(([gx,gy],i)=>{r(gx-3,gy-2,7,5,OUT); r(gx-2,gy-1,5,3,i?'#3d9bff':'#e53950'); r(i?gx-5:gx+3,gy,3,1,'#333');
      if(a) for(let k=0;k<3;k++) PT.push({x:X+gx+(i?-5:5),y:Y+gy,vx:(i?-1:1)*rnd(40,70),vy:rnd(5,25),life:.5,max:.5,c:pick(['#e53950','#3d9bff','#ffd23f','#2fd39a','#ff6fb0']),s:1,rain:1});});
    if(a){const sa=a.face; a.face=Math.sin(t*2)>0?1:-1; const f=a.face; drawPatient(a,t,X+56,Y+65,Math.min(.9,30/animalHeight(a))); a.face=sa; if(Math.random()<.3) snd('spray');}
    break;}
  case 'sauna':{
    r(12,46,88,5,OUT); r(13,47,86,3,'#c48a52'); r(12,58,88,5,OUT); r(13,59,86,3,'#b07440'); r(13,47,86,.5,'#e0a868');
    r(80,60,16,12,OUT); r(81,61,14,10,'#555'); for(let i=0;i<5;i++) r(82+i*3,58+(i%2),3,3,Math.floor(t*4+i)%2?'#ff6a2a':'#ffb000');
    r(96,28,3,16,OUT); r(97,29,1,14,'#fff'); r(97,Math.round(43-(a?p*12:2)),1,Math.round(a?p*12+1:3),'#e53950');
    r(22,64,8,7,OUT); r(23,65,6,5,'#8b5a2b');
    for(let i=0;i<(a?3:1);i++) if(Math.random()<.5) PT.push({x:X+rnd(14,98),y:Y+70,vx:rnd(-4,4),vy:rnd(-22,-10),life:1.4,max:1.4,c:'rgba(255,255,255,.55)',s:3});
    if(a){drawPatient(a,t,X+46,Y+47,Math.min(.85,24/animalHeight(a))); if(Math.random()<.2) PT.push({x:X+46+rnd(-6,6),y:Y+36,vx:0,vy:20,life:.6,max:.6,c:'#9fd8ff',s:1});}
    break;}
  case 'gasnica':{
    ellipseC(X+58,Y+67,24,4,'#7fb6d9'); ellipseC(X+58,Y+67,18,2,'#a8d4f0');
    r(14,46,10,22,OUT); r(15,47,8,20,'#d32f2f'); r(15,47,8,2,'#ff6a5a'); r(17,44,4,3,'#333');
    drawPerson({x:X+30,y:Y+70,face:1,role:'fire',lk:{skin:'#f2c9a0',hair:'#5a3a22',pants:'#2b2b2b',shirt:'#fff'},mv:false,ph:0,inside:1},t);
    if(a){drawPatient(a,t,X+68,Y+66,Math.min(.9,30/animalHeight(a)));
      C.fillStyle='#7fd0ff'; for(let i=0;i<14;i++){const k=i/14, x=X+34+k*30, y=Y+58-Math.sin(k*Math.PI)*12+Math.sin(t*20+i)*.6; C.fillRect(x,y,1.5,1.5);}
      for(let k=0;k<2;k++) PT.push({x:X+64+rnd(-4,4),y:Y+52,vx:rnd(-20,20),vy:rnd(-20,0),life:.5,max:.5,c:'#bfe9ff',s:1});}
    break;}
  case 'neutral':{
    for(const cx of [20,92]){for(let k=0;k<5;k++){r(cx-5+k,64-k*6,10-k*2,4,OUT); r(cx-4+k,65-k*6,8-k*2,2,'#c9b8ff');} ellipseC(X+cx,Y+33,4,4,OUT); ellipseC(X+cx,Y+33,3,3,'#9b59d6');}
    ellipseC(X+56,Y+66,14,3,'#4b2a9a');
    if(a){const fy=Math.abs(Math.sin(t*2))*4; drawPatient(a,t,X+56,Y+64-fy,Math.min(.85,28/animalHeight(a)));
      for(const cx of [20,92]){C.strokeStyle=Math.random()<.5?'#ffffff':'#c9a0ff'; C.lineWidth=.9; C.beginPath(); C.moveTo(X+cx,Y+33); for(let i=1;i<6;i++) C.lineTo(X+cx+(56-cx)*i/6,Y+33+(14*i/6)+rnd(-5,5)); C.lineTo(X+56,Y+50-fy); C.stroke();}
      if(Math.random()<.15) snd('zzap');}
    break;}
  case 'lab':{
    const benches=[[14,44],[66,44]];
    benches.forEach(([bx,by],k)=>{r(bx,by,32,6,OUT); r(bx+1,by+1,30,4,'#dfe6ee'); r(bx+2,by+5,2,10,'#888'); r(bx+28,by+5,2,10,'#888');
      for(let i=0;i<3;i++){const fx=bx+5+i*9; r(fx,by-7,5,7,OUT); r(fx+1,by-6,3,5,'#cfe3ff'); const lv=2+Math.round(Math.sin(t*3+i+k)*1); r(fx+1,by-1-lv,3,lv+1,['#7dff6a','#ff6fb0','#4aa8ff'][i]); bub(fx+2-0,by-8,['#7dff6a','#ff6fb0','#4aa8ff'][i]);}});
    r(40,27,32,10,OUT); r(41,28,30,8,'#163a2a');
    const pr=G.res.cur?clamp(G.res.pts/G.res.cost,0,1):0; r(43,33,26,2,'#2b5a3a'); r(43,33,26*pr,2,'#4dff9a');
    if(G.res.cur&&Math.floor(t*2)%2) r(43,30,3,1,'#4dff9a');
    const st=labStaff(pl), pos=[[26,62],[80,62],[54,68]];
    st.slice(0,3).forEach((s,i)=>{drawPerson({x:X+pos[i][0],y:Y+pos[i][1],face:i%2?-1:1,role:'sci',lk:s.lk,mv:Math.floor(t*2+i)%2===0,ph:t*4,inside:1},t);});
    break;}
  }
  if(a&&pl.b!=='pralnia'&&Math.random()<.05) sparkleRaw(X+56,Y+50);
}
function sparkleRaw(x,y){PT.push({x:x+rnd(-14,14),y:y+rnd(-14,4),vx:0,vy:-10,life:.6,max:.6,c:'#ffffff',s:1});}
function drawBuilding(pl,t,i){
  const cut=true;
  if(cut) drawCutaway(pl,t); else drawExterior(pl,t);
  wearFx(pl,t);
}
function drawLitter(l){
  const x=Math.round(l.x), y=Math.round(l.y); C.fillStyle=OUT;
  if(l.k==='toast'){C.fillRect(x-3,y-3,7,6); C.fillStyle='#8a5a2b'; C.fillRect(x-2,y-2,5,4); C.fillStyle='#e8c07a'; C.fillRect(x-1,y-1,3,2);}
  else if(l.k==='scorch'){C.fillStyle='rgba(30,20,20,.55)'; C.fillRect(x-4,y-2,9,4); C.fillRect(x-2,y-3,5,6); C.fillStyle='#ff6a2a'; if(Math.random()<.3) C.fillRect(x,y-1,1,1);}
  else {C.fillRect(x-2,y-2,5,5); C.fillStyle='#f4f4f4'; C.fillRect(x-1,y-1,3,3); C.fillStyle='#c9c9c9'; C.fillRect(x,y-1,1,1);}
}
function drawUfo(u,t){
  const x=Math.round(u.x), y=Math.round(u.y+Math.sin(t*3)*2);
  if(u.st==='beam'){const a=byId(u.a); if(a){C.fillStyle='rgba(255,240,120,.28)'; C.beginPath(); C.moveTo(x-6,y+4); C.lineTo(x+6,y+4); C.lineTo(a.x+16,a.y); C.lineTo(a.x-16,a.y); C.closePath(); C.fill();}}
  C.fillStyle=OUT; C.fillRect(x-15,y-1,30,7); C.fillRect(x-7,y-7,14,7);
  C.fillStyle='#9aa3b5'; C.fillRect(x-14,y,28,5); C.fillStyle='#bfe9ff'; C.fillRect(x-6,y-6,12,6); C.fillStyle='#4ccf6a'; C.fillRect(x-2,y-4,4,3);
  if(HD){C.fillStyle='#111'; C.fillRect(x-1,y-3.5,.5,.5); C.fillRect(x+.5,y-3.5,.5,.5); C.fillStyle='#e6f7ff'; C.fillRect(x-5,y-5.5,3,.5);}
  for(let i=0;i<5;i++){C.fillStyle=(Math.floor(t*6)+i)%2?'#ffd23f':'#ff4f8b'; C.fillRect(x-12+i*6,y+2,2,2);}
}

