// Złe Owoce — zapis, dźwięk, kreator, walka, pętla
"use strict";
/* ---------- zapis ---------- */
let S={wins:0,fruit:{base:'truskawka',parts:[]}};
try{const r=JSON.parse(localStorage.getItem('zleowoce2'));if(r&&r.fruit&&r.fruit.parts)S=r;else{const o=JSON.parse(localStorage.getItem('zleowoce1'));if(o&&o.wins)S.wins=o.wins}}catch(e){}
S.fruit.parts=S.fruit.parts.filter(p=>PARTS[p.id]);if(!BASES[S.fruit.base])S.fruit.base='truskawka';
function save(){try{localStorage.setItem('zleowoce2',JSON.stringify(S))}catch(e){}}
const DEMO={base:'truskawka',parts:[{id:'pila',x:50,y:4},{id:'patelnia',x:-50,y:4},{id:'noga',x:22,y:54},{id:'noga',x:-22,y:54},{id:'zle',x:-20,y:-14},{id:'wylup',x:22,y:-16},{id:'zebiska',x:0,y:26},{id:'rog',x:28,y:-46},{id:'rog',x:-28,y:-46}]};
const evo=()=>Math.min(3,Math.floor(S.wins/4));
function strip(){const w=Math.floor(S.wins/4)*4;let r='';for(let i=0;i<4;i++)r+=w+i<S.wins?'✅':i===3?'👑':'⚪';return r}
const maxParts=()=>Math.min(26,8+S.wins);
const count=cat=>S.fruit.parts.filter(p=>PARTS[p.id].cat===cat).length;
function power(){let p=10+evo()*10;S.fruit.parts.forEach(q=>p+=PARTS[q.id].pow);return p}
function fname(){const p=power();return BASES[S.fruit.base].name+' '+(p<24?'Golas':p<45?'Psot':p<75?'Grozy':p<110?'Chaosu':p<160?'Zagłady':'Totalnej Demolki')}

/* ---------- dźwięk ---------- */
let ac=null,mg=null,muted=false,song=null,stepN=0,nextT=0,nbuf=null;
function audio(){if(ac){if(ac.state==='suspended')ac.resume();return}
 try{ac=new (window.AudioContext||window.webkitAudioContext)();mg=ac.createGain();mg.gain.value=.55;mg.connect(ac.destination);nextT=ac.currentTime+.1;
  nbuf=ac.createBuffer(1,ac.sampleRate*.3,ac.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch(e){ac=null}}
function tone(m,t,d,type,v,slide){if(!ac||muted)return;const o=ac.createOscillator(),gn=ac.createGain(),f=440*Math.pow(2,(m-69)/12);o.type=type;
 o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(f*slide,t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);
 o.connect(gn);gn.connect(mg);o.start(t);o.stop(t+d+.03)}
function noise(t,d,v){if(!ac||muted)return;const s=ac.createBufferSource(),gn=ac.createGain();s.buffer=nbuf;gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(gn);gn.connect(mg);s.start(t);s.stop(t+d+.02)}
const SONGS={
 make:{bpm:108,bass:[36,0,43,0,36,0,43,0,41,0,48,0,43,0,47,0],lead:[72,0,76,79,0,76,72,0,77,0,81,77,0,74,71,0]},
 fight:{bpm:148,bass:[33,33,0,33,36,36,0,36,31,31,0,31,40,40,38,35],lead:[69,0,72,76,0,72,69,0,67,0,71,74,0,71,76,80]}};
setInterval(()=>{if(!ac||!song)return;const s=SONGS[song],d=60/s.bpm/4;if(nextT<ac.currentTime)nextT=ac.currentTime+.05;
 while(nextT<ac.currentTime+.15){const i=stepN%16;if(s.bass[i])tone(s.bass[i],nextT,d*1.8,'triangle',.22);if(s.lead[i])tone(s.lead[i],nextT,d*1.4,'square',.045);
  if(i%2===0)noise(nextT,.03,i%4?.03:.07);nextT+=d;stepN++}},40);
const now=()=>ac?ac.currentTime:0;
const SFX={
 pick(){tone(76,now(),.07,'square',.09);tone(83,now()+.06,.09,'square',.09)},
 stick(){tone(52,now(),.1,'sine',.4,.5);noise(now(),.05,.15)},
 nope(){tone(50,now(),.15,'sawtooth',.08,.7)},
 swing(){noise(now(),.09,.08)},
 hit(big){tone(big?36:43,now(),.18,'sine',.6,.4);noise(now(),big?.16:.08,big?.4:.25)},
 ouch(){tone(58,now(),.22,'sawtooth',.12,.5)},
 sup(){tone(48,now(),.5,'sawtooth',.14,4)},
 win(){[72,76,79,84,88].forEach((m,i)=>tone(m,now()+i*.11,.25,'square',.1))},
 lose(){[64,60,57,52].forEach((m,i)=>tone(m,now()+i*.18,.3,'triangle',.2))}};
function toggleMute(){muted=!muted;$('mute').textContent=$('mute2').textContent=muted?'🔇':'🔊'}

/* ---------- kreator ---------- */
let mode='title',T=0,tab='oczy',pop=0,F=null,drag=null,msgT=0;
const TABS=[['base','🍓','Owoc'],['oczy','👀','Oczy'],['buzia','👄','Buzia'],['twarz','🩹','Twarz'],['rece','🪓','Ręce'],['nogi','🦵','Nogi'],['dod','👑','Dodatki']];
const FX=150,FY=215,FS=1.1;
function show(id){['title','creator','fight','result'].forEach(s=>$(s).hidden=s!==id)}
function openCreator(){mode='creator';show('creator');song='make';renderCreator()}
function sp(e){const r=$('stage').getBoundingClientRect();return[(e.clientX-r.left)/r.width*800,(e.clientY-r.top)/r.height*450]}
const loc=p=>[(p[0]-FX)/FS,(p[1]-FY)/FS];
function say(t){$('msg').textContent=t;$('msg').hidden=false;msgT=2.2}
function thumb(fn,th){const k=document.createElement('canvas');k.width=124;k.height=104;const x=k.getContext('2d'),og=g,ob=BO;g=x;BO=3;
 x.scale(2,2);x.translate(31,26);const s=23/th[2];x.scale(s,s);x.translate(-th[0],-th[1]);pen();fn();g=og;BO=ob;return k}
function renderCreator(){
 const tb=$('tabs');tb.innerHTML='';
 TABS.forEach(t=>{const b=document.createElement('button');b.innerHTML='<span>'+t[1]+'</span>'+t[2];if(t[0]===tab)b.className='on';b.onclick=()=>{tab=t[0];SFX.pick();renderCreator()};tb.appendChild(b)});
 const gr=$('grid');gr.innerHTML='';
 if(tab==='base')Object.keys(BASES).forEach(id=>{const B=BASES[id],lk=B.lock>S.wins,b=document.createElement('button');
  b.className='it'+(S.fruit.base===id?' on':'')+(lk?' lock':'');b.setAttribute('aria-label',B.name+(lk?', zablokowane':''));
  b.appendChild(thumb(()=>drawBody(id),[0,0,74]));if(lk){const l=document.createElement('b');l.textContent='🔒 🏆'+B.lock;b.appendChild(l)}
  b.onclick=()=>{if(lk){SFX.nope();say('Wygraj '+B.lock+' walk, żeby odblokować');return}S.fruit.base=id;pop=1;SFX.pick();save();renderCreator()};gr.appendChild(b)});
 else ORDER[tab].forEach(id=>{const D=PARTS[id],lk=D.lock>S.wins,b=document.createElement('button');
  b.className='it'+(lk?' lock':'');b.setAttribute('aria-label',D.name+(lk?', zablokowane':''));b.title=D.name;
  b.appendChild(thumb(()=>D.d({}),meta(D,'th')));const l=document.createElement('b');l.textContent=lk?'🔒 🏆'+D.lock:'+'+D.pow;b.appendChild(l);
  b.addEventListener('pointerdown',e=>{e.preventDefault();audio();if(lk){SFX.nope();say('Wygraj '+D.lock+' walk, żeby odblokować');return}
   const p=sp(e);drag={id,old:false,x:p[0],y:p[1],sx:p[0],sy:p[1],moved:false,off:0};SFX.pick()});
  gr.appendChild(b)});
 info();
}
function info(){const p=power();$('nm').textContent=fname();$('pwn').textContent=p;$('pwf').style.width=Math.min(100,p/2)+'%';
 $('wn').textContent='⭐ '+(S.stars||0)+'   '+strip();$('slots').textContent='Części '+S.fruit.parts.length+' / '+maxParts()}
function addPart(id,x,y){if(S.fruit.parts.length>=maxParts()){SFX.nope();say('Pełno! Wygraj walkę, a dostaniesz więcej miejsca');return}
 S.fruit.parts.push({id,x:Math.round(x),y:Math.round(y)});pop=1;SFX.stick();save();info()}
$('creator').addEventListener('pointerdown',e=>{if(drag||e.target.closest('button'))return;audio();
 const l=loc(sp(e)),ps=S.fruit.parts;let hit=-1;
 for(let pass=0;pass<2&&hit<0;pass++)for(let i=ps.length-1;i>=0;i--){const D=PARTS[ps[i].id],bk=!!meta(D,'back');if(bk!==!!pass)continue;
  let px=ps[i].x,py=ps[i].y;if(meta(D,'m')==='r'){const d=Math.hypot(px,py)||1;px+=px/d*28;py+=py/d*28}
  if(Math.hypot(l[0]-px,l[1]-py)<30||Math.hypot(l[0]-ps[i].x,l[1]-ps[i].y)<22){hit=i;break}}
 if(hit>=0){const pt=ps[hit],p=sp(e);drag={id:pt.id,old:true,idx:hit,x:p[0],y:p[1],sx:p[0],sy:p[1],moved:false,off:0};SFX.pick()}});
addEventListener('pointermove',e=>{if(!drag)return;const p=sp(e);drag.x=p[0];drag.y=p[1];if(!drag.moved&&Math.hypot(p[0]-drag.sx,p[1]-drag.sy)>10){drag.moved=true;if(drag.old){S.fruit.parts.splice(drag.idx,1);$('bin').hidden=false;info()}}});
let lastTap={t:0,i:-1};
function drop(){if(!drag)return;const d=drag;drag=null;$('bin').hidden=true;const l=loc([d.x,d.y-(d.off||0)]),inside=Math.hypot(l[0],l[1])<128;
 if(d.old&&!d.moved){const n=performance.now();if(n-lastTap.t<500&&lastTap.i===d.idx){S.fruit.parts.splice(d.idx,1);lastTap={t:0,i:-1};SFX.swing();pop=1;save();info()}else lastTap={t:n,i:d.idx};return}
 if(!d.moved){const D=PARTS[d.id],defs=D.def?[D.def]:CATS[D.cat].defs,n=count(D.cat),q=defs[n%defs.length];
  let x=q[0],y=q[1];if(D.def&&n%2&&Math.abs(x)>8)x=-x;addPart(d.id,x+(Math.random()-.5)*5,y+(Math.random()-.5)*5)}
 else if(inside)addPart(d.id,l[0],l[1]);
 else{SFX.swing();save();info()}}
addEventListener('pointerup',drop);addEventListener('pointercancel',drop);
$('clr').onclick=()=>{S.fruit.parts=[];SFX.swing();save();info()};
function randomFruit(){const pick=a=>a[Math.random()*a.length|0],jit=k=>(Math.random()-.5)*k,used={};
 S.fruit.base=pick(Object.keys(BASES).filter(id=>BASES[id].lock<=S.wins));S.fruit.parts=[];
 ['oczy','oczy','buzia','rece','rece','nogi','nogi','dod','twarz','rece','dod','twarz','oczy','rece','nogi','dod','twarz','rece','nogi','dod','oczy','rece','twarz','dod','rece','nogi'].slice(0,maxParts()).forEach(cat=>{
  const id=pick(ORDER[cat].filter(i=>PARTS[i].lock<=S.wins)),D=PARTS[id],n=used[cat]=(used[cat]||0)+1,defs=D.def?[D.def]:CATS[cat].defs,q=defs[(n-1)%defs.length];
  let x=q[0],y=q[1];if(D.def&&n%2===0&&Math.abs(x)>8)x=-x;const j=defs.length===1&&n>1?44:n>defs.length?30:8;
  S.fruit.parts.push({id,x:Math.round(x+jit(j)),y:Math.round(y+jit(j))})});pop=1}
let rolling=false;
$('rnd').onclick=()=>{if(rolling)return;rolling=true;let n=0;const go=()=>{randomFruit();SFX.pick();info();if(++n<7)setTimeout(go,90);else{rolling=false;SFX.win();save();renderCreator()}};go()};

/* ---------- walka ---------- */
const CD={cios:.42,kop:1.3,bron:2.4,super:.5}, DUR={cios:.28,kop:.42,bron:.52,super:.8};
const WORDS=['BAM!','ŁUP!','TRACH!','BUM!','PAC!','ZONK!','BĘC!'];
function startFight(pity){
 const n=S.wins,base=ENEMIES[n%ENEMIES.length],tier=Math.floor(n/ENEMIES.length),k=Math.pow(.82,pity||0);
 const E=Object.assign({},base,{name:(tier?'Mega ':'')+base.name,size:base.size+tier*.08});
 const pw=power(),pm=100+pw*.4,em=(130+85*n)*(E.boss?1.4:1)*k;
 F={E,n,pity:pity||0,php:pm,pmax:pm,ehp:em,emax:em,dmg:Math.min(18,6+n)*k,teleD:Math.max(.5,.85-n*.03),teleT:1,gap:Math.max(.8,1.5-n*.05),
  arms:count('rece'),legs:count('nogi'),wp:S.fruit.parts.reduce((s,p)=>s+(PARTS[p.id].wp?PARTS[p.id].pow:0),0),
  atk:null,cd:{cios:0,kop:0,bron:0,super:0},sup:0,est:'idle',et:1,ep:0,edone:false,floats:[],parts:[],shake:0,phurt:0,ehurt:0,over:null,ot:0,mult:1+pw/90,
  intro:1.9,drops:[],dropT:9,combo:0,best:0,rage:false,big:false,nAtk:0,stop:0,stars:0};
 $('hpPn').textContent=fname();$('hpEn').textContent=(E.boss?'👑 ':'')+E.name;$('lvl').textContent='Poziom '+(n+1)+(E.boss?' – boss':'');
 $('bB').lastChild.textContent=F.wp?'Broń':'Główka';$('bB').firstChild.textContent=F.wp?'🪓':'🤕';
 mode='fight';show('fight');song='fight';bars();
}
function act(type){audio();if(!F||F.over||F.atk||F.intro>0)return;if(type==='super'&&F.sup<100){SFX.nope();return}if(F.cd[type]>0)return;
 F.atk={type,p:0,hit:false};F.cd[type]=CD[type];if(type==='super'){F.sup=0;SFX.sup()}else SFX.swing()}
function floatTxt(txt,x,y,col,size,b){F.floats.push({txt,x,y,col,size:size||40,life:1,rot:(Math.random()-.5)*.5,b})}
function burst(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*7,v=120+Math.random()*220;F.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,life:1,r:6+Math.random()*7,col:['#ffd23f','#fff','#ff8a2a'][i%3]})}}
function landHit(type){
 let d,big=false;
 if(type==='cios')d=2.5+F.arms*.4;else if(type==='kop')d=4.5+F.legs*.7;
 else if(type==='bron'){d=5+F.wp*.28;big=true}else{d=24;big=true}
 F.combo++;F.best=Math.max(F.best,F.combo);
 d*=F.mult*(1+Math.min(F.combo,10)*.05);let word=null;
 if(F.est==='guard'){if(big){F.est='stun';F.et=.9;word='PRZEBITE!'}else{d*=.2;word='BLOK!';F.combo=0}}
 F.ehp=Math.max(0,F.ehp-d);F.ehurt=1;F.shake=big?12:5;SFX.hit(big);if(big&&!RM)F.stop=.07;
 F.sup=Math.min(100,F.sup+(type==='cios'?8:type==='kop'?12:type==='bron'?16:0));
 floatTxt(word||(type==='super'?'SUPER!':WORDS[Math.random()*WORDS.length|0]),450+Math.random()*60,160+Math.random()*60,word==='BLOK!'?'#9fb7d9':big?'#e8404f':'#ffd23f',big?58:42,word!=='BLOK!');
 burst(480,250,big?16:7);
 if((type==='kop'||type==='super')&&F.est==='tele'){if(F.et<.5||type==='super'){F.est='stun';F.et=F.big?1.5:1;floatTxt('KONTRA!',400,125,'#6fcf6a',48);F.sup=Math.min(100,F.sup+15)}else floatTxt('ZA WCZEŚNIE!',400,125,'#fff',34)}
 if(!F.rage&&F.ehp>0&&F.ehp<F.emax*.35){F.rage=true;F.gap*=.8;floatTxt('WŚCIEKŁY!',560,120,'#e8404f',44)}
 if(F.ehp<=0){const r=F.php/F.pmax;F.stars=r>.66?3:r>.33?2:1;S.stars=(S.stars||0)+F.stars;
  F.over='win';F.ot=0;F.est='ko';S.wins++;save();SFX.win();song=null;burst(540,250,30)}
}
function bars(){const f=F;$('hpPf').style.width=(f.php/f.pmax*100)+'%';$('hpEf').style.width=(f.ehp/f.emax*100)+'%';
 [['bC','cios'],['bK','kop'],['bB','bron']].forEach(b=>$(b[0]).style.setProperty('--cd',f.cd[b[1]]/CD[b[1]]));
 $('bS').style.setProperty('--cd',1-f.sup/100);$('bS').classList.toggle('ready',f.sup>=100)}
function eIdle(f,t){if(f.n>=1&&!f.wg&&Math.random()<.3){f.est='guard';f.et=1.3;f.wg=true}else{f.est='idle';f.et=t;f.wg=false}}
function updateFight(dt){
 const f=F;if(!f)return;
 if(f.intro>0){f.intro-=dt;return}
 if(f.stop>0){f.stop-=dt;return}
 for(const k in f.cd)f.cd[k]=Math.max(0,f.cd[k]-dt);
 f.phurt=Math.max(0,f.phurt-dt*3);f.ehurt=Math.max(0,f.ehurt-dt*4);f.shake=Math.max(0,f.shake-dt*40);
 if(f.atk){f.atk.p+=dt/DUR[f.atk.type];if(f.atk.p>=.5&&!f.atk.hit&&!f.over){f.atk.hit=true;landHit(f.atk.type)}if(f.atk&&f.atk.p>=1)f.atk=null}
 if(!f.over){
  if(f.est==='idle'){f.et-=dt;if(f.et<=0){f.est='tele';f.big=!!f.E.boss&&(f.nAtk++%2===1);f.teleT=f.et=f.teleD*(f.big?1.6:1)}}
  else if(f.est==='tele'){f.et-=dt;if(f.et<=0){f.est='strike';f.ep=0;f.edone=false}}
  else if(f.est==='strike'){f.ep+=dt/.4;
   if(f.ep>=.5&&!f.edone){f.edone=true;f.php=Math.max(0,f.php-f.dmg*(f.big?1.8:1));f.phurt=1;f.shake=f.big?14:8;f.combo=0;SFX.ouch();floatTxt(f.big?'ŁUBUDU!':'AUĆ!',250,130,'#fff',f.big?52:40);
    if(f.php<=0){f.over='lose';f.ot=0;SFX.lose();song=null}}
   if(f.ep>=1){if(f.n>=1&&!f.dbl&&Math.random()<.3){f.dbl=true;f.big=false;f.est='tele';f.teleT=f.et=.45}else{f.dbl=false;eIdle(f,f.gap+Math.random()*.5)}}}
  else if(f.est==='stun'){f.et-=dt;if(f.et<=0){f.est='idle';f.et=.8}}
  else if(f.est==='guard'){f.et-=dt;if(f.et<=0){f.est='idle';f.et=f.gap*.5}}
  f.dropT-=dt;if(f.dropT<=0&&f.drops.length<2){f.dropT=9+Math.random()*4;f.drops.push({x:340+Math.random()*130,y:-30,type:'bolt',rest:0})}
  f.drops.forEach(d=>{if(d.y<322)d.y+=dt*85;else d.rest+=dt});f.drops=f.drops.filter(d=>d.rest<3.2);
 }else{f.ot+=dt;if(f.ot>1.3&&!f.shown){f.shown=true;showResult()}}
 f.floats.forEach(o=>{o.life-=dt*1.3;o.y-=dt*50});f.floats=f.floats.filter(o=>o.life>0);
 f.parts.forEach(o=>{o.life-=dt*1.6;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=500*dt});f.parts=f.parts.filter(o=>o.life>0);
 bars();
}
function drawFight(){
 const f=F;g.save();if(f.shake&&!RM)g.translate((Math.random()-.5)*f.shake,(Math.random()-.5)*f.shake);
 drawBg(f.E.bg,T);pen();
 P(C(250,372,72,11),'rgba(70,40,15,.18)',{ns:1});if(f.over!=='win')P(C(555,372,70*f.E.size,11),'rgba(70,40,15,.18)',{ns:1});
 drawEnemy(f.E,555,275,1.1,{t:T,tele:f.est==='tele'?Math.min(1,(f.teleT-f.et)/.25):0,strike:f.est==='strike'?f.ep:0,hurt:f.ehurt,stun:f.est==='stun',guard:f.est==='guard',hot:f.est==='tele'&&f.et<.5,rage:f.rage,big:f.big,ko:f.over==='win'?Math.min(1,f.ot/1.1):0});
 drawFruit(S.fruit,250,268,.95,{t:T,atk:f.atk,hurt:f.phurt,evo:evo(),dizzy:f.over==='lose'});
 pen();SC=9300;if(!f.over)f.drops.forEach(d=>{if(d.rest>2.2&&Math.floor(T*10)%2)return;g.save();g.translate(d.x,d.y+Math.sin(T*5+d.x)*4);
  P(C(0,0,31,31,12),'rgba(255,255,255,.6)',{lw:3});
  if(d.type==='heart')P([[0,15],[-17,-2],[-12,-15],[0,-7],[12,-15],[17,-2]],'#e8404f',{lw:3});
  else if(d.type==='bolt')P([[4,-19],[-11,2],[-1,2],[-5,19],[11,-4],[1,-4]],'#ffd23f',{s:1,lw:3});
  else P(ST(0,0,5,18,8,-1.57),'#ffd23f',{s:1,lw:3});g.restore()});
 pen();SC=9500;f.parts.forEach(o=>{g.globalAlpha=Math.max(0,o.life);P(ST(o.x,o.y,5,o.r,o.r*.45,o.life*6),o.col,{lw:2,s:1,a:.5})});g.globalAlpha=1;
 f.floats.forEach((o,i)=>{g.globalAlpha=Math.min(1,o.life*2);if(o.b){pen();SC=9600+i*30;P(ST(o.x,o.y,9,o.size*1.45,o.size*.9,o.rot),'#fffdf2',{s:1,lw:3,a:2})}comic(o.txt,o.x,o.y,o.size*(1+(1-o.life)*.3),o.col,o.rot)});g.globalAlpha=1;
 if(f.combo>=3&&!f.over)comic('COMBO x'+f.combo,400,98,28+Math.min(f.combo,10)*2,'#ffd23f',-.05);
 if(f.intro>0){g.globalAlpha=Math.max(0,Math.min(1,f.intro*3,(1.9-f.intro)*6));pen();SC=9800;P(R(-20,150,840,135),'#fffaf0',{s:1,lw:5});
  comic('Poziom '+(f.n+1),400,180,32,'#fff');comic(f.E.name+(f.E.boss?' – BOSS!':''),400,236,f.E.name.length>16?42:54,f.E.boss?'#e8404f':'#ffd23f',-.03);g.globalAlpha=1}
 g.restore();
}
function showResult(){
 const win=F.over==='win';let h;
 if(win){const news=[];for(const id in PARTS)if(PARTS[id].lock===S.wins)news.push(PARTS[id].name);for(const id in BASES)if(BASES[id].lock===S.wins)news.push(BASES[id].name);
  const ev=S.wins%4===0&&S.wins<=12;
  h='<h2>Wygrana!</h2><p style="font-size:38px;line-height:1.1">'+'⭐'.repeat(F.stars)+'☆'.repeat(3-F.stars)+'</p>'+
   '<p>'+F.E.name+' ucieka, gdzie pieprz rośnie'+(F.best>=3?'. Najlepsze combo: x'+F.best:'')+'</p>'+
   (F.E.boss?'<p class="new">👑 Boss pokonany!</p>':'')+
   (ev?'<p class="new">⚡ Ewolucja! Twój owoc urósł w siłę</p>':'')+
   '<p class="new">'+(maxParts()<26?'+1 miejsce na części. ':'')+(news.length?'Nowe: '+news.join(', '):'')+'</p>'+
   '<p>'+strip()+'</p>'+
   '<div><button class="big alt" id="rA">Ulepsz owoca</button><button class="big" id="rB">Następna walka</button></div>';
 }else h='<h2>Ojej!</h2><p>'+F.E.name+' tym razem był szybszy.<br>Teraz jest zmęczony. Dołóż części i spróbuj jeszcze raz!</p>'+
   '<div><button class="big alt" id="rA">Ulepsz owoca</button><button class="big" id="rB">Jeszcze raz</button></div>';
 $('card').innerHTML=h;$('result').hidden=false;
 const pity=win?0:F.pity+1;
 $('rA').onclick=()=>{SFX.pick();openCreator()};$('rB').onclick=()=>{SFX.pick();startFight(pity)};
}

/* ---------- pętla ---------- */
let last=performance.now();
function frame(nowT){
 const dt=Math.min(.05,(nowT-last)/1000);last=nowT;T+=dt;BO=1;SC=0;g=c;c.clearRect(0,0,800,450);
 if(mode==='title'){drawBg('las',T);drawFruit(S.fruit.parts.length?S.fruit:DEMO,180,300,.95,{t:T,evo:evo()});drawEnemy(ENEMIES[1],630,300,1,{t:T})}
 else if(mode==='creator'){pop=Math.max(0,pop-dt*4);if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').hidden=true}
  drawBg('papier',T);drawFruit(S.fruit,FX,FY,FS*(1+pop*.1),{t:0,evo:evo()});
  if(drag&&drag.moved){drag.off=Math.min(62,drag.off+dt*450);const l=loc([drag.x,drag.y-drag.off]);g.save();pen();g.translate(FX,FY);g.scale(FS*1.08,FS*1.08);g.globalAlpha=Math.hypot(l[0],l[1])<128?1:.7;SC=9000;drawPart({id:drag.id,x:l[0]/1.08,y:l[1]/1.08},{t:T});g.restore()}}
 else{updateFight(dt);drawFight()}
 requestAnimationFrame(frame);
}
function fit(){const w=$('fit'),cs=getComputedStyle(w),W=w.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),H=w.clientHeight;
 const s=Math.min(W/800,H/450);$('stage').style.transform='translate(-50%,-50%) scale('+s+')'}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));fit();
const FSE=document.documentElement,canFS=!!((FSE.requestFullscreen||FSE.webkitRequestFullscreen)&&(document.fullscreenEnabled||document.webkitFullscreenEnabled));
function goFS(){try{if(document.fullscreenElement||document.webkitFullscreenElement)return;const r=FSE.requestFullscreen||FSE.webkitRequestFullscreen,p=r.call(FSE);
 if(p&&p.then)p.then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}setTimeout(fit,300)}).catch(()=>{})}catch(e){}}
if(canFS){$('fs').hidden=false;$('fs').onclick=goFS}
$('play').onclick=()=>{audio();if(canFS)goFS();SFX.pick();openCreator()};
$('go').onclick=()=>{audio();SFX.pick();startFight(0)};
$('quit').onclick=()=>openCreator();
$('mute').onclick=$('mute2').onclick=toggleMute;
function grab(d){SFX.pick();burst(d.x,d.y,10);
 if(d.type==='heart'){F.php=Math.min(F.pmax,F.php+F.pmax*.25);floatTxt('+ŻYCIE!',d.x,d.y-34,'#6fcf6a',40)}
 else if(d.type==='bolt'){F.sup=100;floatTxt('SUPER GOTOWY!',d.x,d.y-34,'#a878e8',38)}
 else{F.ehp=Math.max(1,F.ehp-F.emax*.12);F.ehurt=1;F.shake=8;SFX.hit(true);floatTxt('BONUS BAM!',d.x,d.y-34,'#ffd23f',40)}}
$('fight').addEventListener('pointerdown',e=>{if(!F||F.over||F.intro>0||e.target.closest('button'))return;const p=sp(e);
 for(let i=F.drops.length-1;i>=0;i--){const d=F.drops[i];if(Math.hypot(p[0]-d.x,p[1]-d.y)<50){F.drops.splice(i,1);grab(d);break}}});
[['bC','cios'],['bK','kop'],['bB','bron'],['bS','super']].forEach(b=>$(b[0]).addEventListener('pointerdown',e=>{e.preventDefault();act(b[1])}));
document.addEventListener('pointerdown',audio,{once:true});
requestAnimationFrame(frame);
