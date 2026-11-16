'use strict';
const T=THREE,$=id=>document.getElementById(id);

const PI=Math.PI;
let W=innerWidth,H=innerHeight;

/* ---------- renderer ---------- */
const canvas=$('c');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
let pixelRatio=Math.min(window.devicePixelRatio||1,2);
const scene=new T.Scene();
scene.fog=new T.Fog(0xbfe3f5,170,620);
const camera=new T.PerspectiveCamera(42,1,.5,700);

const skyTex=cols=>canvasTex(8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);cols.forEach((c,i)=>gr.addColorStop(i/(cols.length-1),c));g.fillStyle=gr;g.fillRect(0,0,w,h);});
const SKY={sun:skyTex(['#3fa9ea','#9adcf8','#e8f8ff']),rain:skyTex(['#6d8ba6','#a9c3d3','#d5e3ea'])};

/* ---------- geometry & material helpers ---------- */
const mats={};

const G={sph:new T.SphereGeometry(1,22,16),lo:new T.SphereGeometry(1,10,8),box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,14)};
const cgC={};
function mesh(g,m,par,x,y,z,sx,sy,sz){const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);if(sx!==undefined)o.scale.set(sx,sy===undefined?sx:sy,sz===undefined?sx:sz);if(par)par.add(o);return o;}

const MVC=new T.MeshStandardMaterial({vertexColors:true,roughness:.8});

/* ---------- textures ---------- */
const texGir=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#f7e3b1';g.fillRect(0,0,w,h);g.fillStyle='#b8672a';for(let gy=0;gy<6;gy++)for(let gx=0;gx<6;gx++){const cx=(gx+.5+(gy%2?.5:0))*w/6+rnd(-5,5),cy=(gy+.5)*h/6+rnd(-5,5);g.beginPath();for(let i=0;i<7;i++){const an=i/7*6.283+rnd(-.25,.25),r=rnd(13,18);const px=cx+Math.cos(an)*r,py=cy+Math.sin(an)*r;i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();}},{repeat:[1,1]});
const texZeb=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#fbfbfb';g.fillRect(0,0,w,h);g.fillStyle='#1d1d24';for(let i=0;i<8;i++){const y0=i*h/8;g.beginPath();g.moveTo(0,y0+3);for(let x=0;x<=w;x+=16)g.lineTo(x,y0+3+Math.sin(x/w*6.283*2+i)*4);for(let x=w;x>=0;x-=16)g.lineTo(x,y0+h/16+5+Math.sin(x/w*6.283*3+i*2)*3);g.closePath();g.fill();}},{repeat:[1,1]});
const texTig=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#1b1410';for(let i=0;i<9;i++){const y0=i*h/9;for(let k=0;k<3;k++){const x0=rnd(w),len=rnd(60,150),bend=rnd(-4,4);for(const off of [0,-w]){g.beginPath();g.moveTo(x0+off,y0+6);g.quadraticCurveTo(x0+off+len/2,y0-2+bend,x0+off+len,y0+7);g.quadraticCurveTo(x0+off+len/2,y0+16,x0+off,y0+6);g.fill();}}}},{repeat:[1,1]});
const plankTex=(base,line,rep)=>canvasTex(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<8;i++){g.fillStyle='rgba(60,30,5,'+rnd(.02,.14)+')';g.fillRect(0,i*32,w,32);g.fillStyle=line;g.fillRect(0,i*32,w,3);const x=rnd(w);g.fillRect(x,i*32,3,32);g.fillRect((x+130)%w,i*32,3,32);}for(let i=0;i<60;i++){g.fillStyle='rgba(50,25,5,.12)';g.fillRect(rnd(w),rnd(h),rnd(20,60),1.5);}},{repeat:rep});
const emojiTex=(em,bg)=>canvasTex(128,128,(g)=>{g.fillStyle=bg;g.beginPath();g.arc(64,64,62,0,7);g.fill();g.lineWidth=7;g.strokeStyle='#fff';g.stroke();g.textAlign='center';g.textBaseline='middle';g.font='74px serif';g.fillText(em,64,70);});

/* ---------- lights ---------- */
const hemi=new T.HemisphereLight(0xffffff,0xb08a5a,.7);scene.add(hemi);
const sun=new T.DirectionalLight(0xfff3d6,.75);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.bias=-.002;
scene.add(sun);scene.add(sun.target);

/* ---------- particles ---------- */
const dum=new T.Object3D();
class PS{constructor(mat,cap){this.im=new T.InstancedMesh(G.lo,mat,cap);this.im.frustumCulled=false;this.im.count=0;this.cap=cap;this.a=[];scene.add(this.im);}
  add(x,y,z,vx,vy,vz,s,life,g){if(this.a.length>=this.cap)return;this.a.push({x,y,z,vx,vy,vz,s,life,g:g||0,t:0});}
  up(dt){const a=this.a;let n=0;for(let i=0;i<a.length;i++){const p=a[i];p.t+=dt;if(p.t>=p.life)continue;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const k=p.t/p.life,sc=p.s*(k<.2?k/.2:1-(k-.2)/.8);
      dum.position.set(p.x,p.y,p.z);dum.scale.set(sc,sc,sc);dum.updateMatrix();this.im.setMatrixAt(n,dum.matrix);a[n++]=p;}
    a.length=n;this.im.count=n;this.im.instanceMatrix.needsUpdate=true;}}
const P={
  water:new PS(new T.MeshStandardMaterial({color:0xcfefff,roughness:.1,transparent:true,opacity:.85}),160),
  dust:new PS(new T.MeshStandardMaterial({color:0xc79a5e,roughness:.9}),100),
  spark:new PS(new T.MeshStandardMaterial({color:0xffe066,emissive:0xffb300,emissiveIntensity:1}),120),
  puff:new PS(new T.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.7,roughness:.9}),120),
  magic:new PS(new T.MeshStandardMaterial({color:0xc77dff,emissive:0x9d4edd,emissiveIntensity:1}),90)
};
function burst(kind,x,y,z,n,sp,s,life,g){for(let i=0;i<n;i++)P[kind].add(x+rnd(-.2,.2),y+rnd(0,.3),z+rnd(-.2,.2),rnd(-sp,sp),rnd(sp*.2,sp*1.2),rnd(-sp,sp),rnd(s*.6,s*1.3),rnd(life*.6,life),g);}

/* ---------- audio ---------- */
let AC=null,master=null,sfx=null,mus=null,nbuf=null,muted=false;const loops={};
function initAudio(){if(AC)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();}catch(e){AC=null;return;}
  master=AC.createGain();master.gain.value=muted?0:1;master.connect(AC.destination);
  sfx=AC.createGain();sfx.gain.value=.9;sfx.connect(master);mus=AC.createGain();mus.gain.value=.13;mus.connect(master);
  nbuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  loops.sea=nloop('lowpass',500,.4);loops.rain=nloop('highpass',5000,.3);loops.sea.g.gain.value=.1;
  const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=.16;lg.gain.value=220;l.connect(lg);lg.connect(loops.sea.f.frequency);l.start();
  startMusic();}

function setLoop(n,v){const l=loops[n];if(l&&AC)l.g.gain.setTargetAtTime(v,AC.currentTime,.3);}

const snd={
  squeak(){tone(rnd(1900,2600),.08,'square',.035,rnd(2700,3300));},
  plop(){tone(320,.2,'sine',.22,80);nz(.3,.14,1400,'lowpass',300);},
  boing(){sw('sine',[[0,170],[.3,560],[1,240]],.38,.22,3000);},
  boom(){nz(.7,.45,500,'lowpass',60);tone(95,.5,'sine',.4,40);nz(.3,.22,2500,'highpass',7000,.25);sw('square',[[0,900],[1,300]],.25,.06,2500,0,.25);},
  meow(){sw('sawtooth',[[0,520],[.3,800],[1,430]],.5,.07,1900);},
  hoot(){tone(392,.25,'sine',.16);tone(330,.45,'sine',.16,0,.3);},
  drill(){nz(.12,.09,rnd(700,1100),'bandpass');tone(rnd(140,180),.1,'sawtooth',.05);},
  portal(){sw('sine',[[0,200],[1,1300]],.6,.1,4000);sw('sine',[[0,300],[1,1900]],.6,.06,5000,0,.1);},
  heart(){tone(880,.1,'sine',.09);tone(1175,.18,'sine',.09,0,.1);},
  place(){tone(520,.07,'triangle',.14,720);},
  tap(){tone(660,.06,'sine',.1,880);},
  no(){tone(180,.18,'sawtooth',.07,120);},
  got(){tone(1319,.08,'sine',.05);},
  baby(){tone(1500,.07,'sine',.07,2100);tone(1800,.07,'sine',.07,2400,.08);},
  win(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,.28,'triangle',.16,0,i*.11));},
  lose(){[392,349,311,262].forEach((f,i)=>tone(f,.35,'sawtooth',.08,0,i*.22));},
  voice(type,v){v=v||1;
    if(type==='elephant')sw('sawtooth',[[0,320],[.25,640],[.6,560],[1,380]],.8,.11*v,2200,30);
    else if(type==='lion')roar(v);
    else if(type==='tiger')roar(v*.85);
    else if(type==='hippo'){sw('square',[[0,85],[1,60]],.25,.15*v,400);sw('square',[[0,80],[1,55]],.3,.15*v,400,0,.3);}
    else if(type==='zebra')sw('square',[[0,1000],[.2,1300],[1,600]],.5,.045*v,2600,14);
    else if(type==='giraffe'){tone(294,.2,'sine',.12*v);tone(370,.3,'sine',.12*v,0,.2);}
    else if(type==='panda')sw('sine',[[0,500],[.5,720],[1,450]],.35,.12*v,2000);
    else if(type==='penguin'){sw('square',[[0,430],[1,380]],.16,.06*v,1500);sw('square',[[0,460],[1,390]],.2,.06*v,1500,0,.2);}
    else if(type==='kangaroo'){tone(95,.12,'sine',.25*v,60);tone(95,.12,'sine',.25*v,60,.22);nz(.05,.08*v,2500,'highpass',0,.1);}
    else if(type==='crocodile'){nz(.4,.1*v,3500,'highpass');tone(140,.05,'square',.14*v);tone(140,.05,'square',.14*v,0,.12);}}
};

function startMusic(){const step=60/104/3;let nt=AC.currentTime+.1,i=0;
  // sea-shanty-ish 6/8 in D dorian
  const A=[2,-1,5,9,-1,5, 7,-1,5,2,-1,-1, 0,-1,4,7,-1,4, 5,4,2,0,-1,-1, 2,-1,5,9,-1,12, 14,-1,12,9,-1,-1, 7,9,7,5,-1,4, 2,-1,-1,2,-1,-1];
  const ROOT=[2,2,0,0,2,2,-3,2];
  setInterval(()=>{if(!AC||AC.state!=='running')return;if(nt<AC.currentTime)nt=AC.currentTime+.05;
    while(nt<AC.currentTime+.4){const s=i%48,bar=(i/6|0)%8,m=A[s];
      if(m>=0)mnote(nt,293.66*Math.pow(2,(m-2)/12)*2,step*1.1,'triangle',.5);
      const b=s%6;if(b===0)mnote(nt,73.42*Math.pow(2,(ROOT[bar]-2)/12)*2,step*2.4,'sine',.9);if(b===3)mnote(nt,110*Math.pow(2,(ROOT[bar]-2)/12)*2,step*1.4,'sine',.5);
      i++;nt+=step;}},120);}

/* ---------- animals (models from Pralnia Zoo) ---------- */
const mW=M(0xffffff,{roughness:.3}),mK=M(0x16161d,{roughness:.3});
const MV=new T.MeshStandardMaterial({vertexColors:true,roughness:.8});
const lgC={};

const SC=.78;

let giMat=null;

let zeMat=null;

let crScute=null,crTU=null,crTL=null;

let liTuft=null,liWh=null;

let whG=null;
const FOOT=[[-.15,0],[-.05,.14],[.2,.2],[.42,.17],[.24,.1],[.5,.05],[.28,0],[.5,-.05],[.24,-.1],[.42,-.17],[.2,-.2],[-.05,-.14]];
let tiMat=null;

const MK={elephant:mkElephant,giraffe:mkGiraffe,zebra:mkZebra,hippo:mkHippo,crocodile:mkCroc,lion:mkLion,tiger:mkTiger,panda:mkPanda,penguin:mkPenguin,kangaroo:mkKangaroo};
function anim(a,dt){a.t+=dt;const walk=a.moving;if(walk)a.ph+=dt*a.gait;
  for(const L of a.legs){const tg=walk?Math.sin(a.ph+L.ph)*a.swing:0;L.p.rotation.z+=(tg-L.p.rotation.z)*Math.min(1,dt*14);}
  a.tickle=Math.max(0,a.tickle-dt*2.5);
  let y=walk?Math.abs(Math.sin(a.ph))*(a.hopH||.05):Math.sin(a.t*2.2)*.015;const happy=a.jumpT>0;if(happy){a.jumpT-=dt*1.1;y+=Math.abs(Math.sin(a.jumpT*PI*2))*.5;}
  a.body.position.y=y;a.body.rotation.x=Math.sin(a.t*28)*.035*a.tickle+(walk&&a.waddle?Math.sin(a.ph)*a.waddle:0);a.body.rotation.z=Math.sin(a.t*23)*.02*a.tickle;
  const wag=happy?2.2:1;if(a.tail)a.tail.rotation.x=Math.sin(a.t*5*wag+a.seed)*.35*wag;
  for(const e of a.ears){const f=Math.sin(a.t*(e.fast||3)+a.seed+e.s)*.12+a.tickle*.2;if(e.ax==='x')e.p.rotation.x=(e.bx||0)+e.s*f*1.2;else e.p.rotation.y=e.base+e.s*f;}
  a.eatK+=((a.eat&&!walk&&!happy?1:0)-a.eatK)*Math.min(1,dt*3);const ek=a.eatK*(.75+.25*Math.sin(a.t*5+a.seed));
  if(a.head){a.head.rotation.z=a.headBase+Math.sin(a.t*1.3+a.seed)*.04+(happy?.15:0)-ek*(a.neck?.25:.45);a.head.rotation.y+=(Math.sin(a.t*.7+a.seed)*.25-a.head.rotation.y)*Math.min(1,dt*4);a.head.rotation.x=Math.sin(a.t*25)*.05*a.tickle;}
  if(a.neck)a.neck.rotation.z=a.neckBase+Math.sin(a.t*.9+a.seed)*.04-ek*(a.type==='giraffe'?1.05:.55);
  a.blink-=dt;if(a.blink<-.12)a.blink=rnd(2,5);const by=(a.blink<0||a.tickle>.6)?.15:1;for(const e of a.eyes)e.scale.y=by;
  const op=happy?1:(a.tickle>.3?.6:(Math.sin(a.t*.5+a.seed)>.93?.8:0));a.open+=(op-a.open)*Math.min(1,dt*8);if(a.jaw)a.jaw.rotation.z=-a.open*.55;
  for(let i=0;i<a.trunk.length;i++){const g=a.trunk[i],lift=happy?(i===0?.5:i<5?.38:.1):0;g.rotation.z+=(g.userData.b+lift+Math.sin(a.t*1.8+i*.5)*.05+a.tickle*Math.sin(a.t*20+i)*.04-g.rotation.z)*Math.min(1,dt*8);}
  for(let i=0;i<a.ctail.length;i++)a.ctail[i].rotation.y=Math.sin(a.t*2.2-i*.6)*.13*(walk?1.6:1)*(happy?2:1);}

/* ---------- layout: side cross-section, 3 floors x 4 rooms ---------- */
const NF=3,NR=4,RW=9,RH=5.2,NC=24,CW=1.5,X0=-18,LZ=4.6,WATER=-.7;
const FY=f=>f*RH,cx=c=>X0+CW*(c+.5),key=(f,c)=>f*100+c,valid=c=>c>=0&&c<NC;
const ALLC=[];for(let f=0;f<NF;f++)for(let c=0;c<NC;c++)ALLC.push([f,c]);

/* ---------- sea animals (models from Rafa koralowa) ---------- */
const TAU=PI*2,C3=h=>{const c=new T.Color(h);return [c.r,c.g,c.b];};
const mix3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],mul3=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];

const _m4=new T.Matrix4(),_q=new T.Quaternion(),_e=new T.Euler(),_v=V(),_v2=V();

const uT={value:0};

const sea=[];
function seaAdd(obj,o){scene.add(obj.g);if(o.s)obj.g.scale.setScalar(o.s);let th=o.th==null?rnd(TAU):o.th,ph=rnd(9),py=WATER+o.y;const d=o.dir||1;
  sea.push(dt=>{th+=d*o.sp/o.R*dt;ph+=dt*o.sp*(o.phK||1.2);const x=Math.cos(th)*o.R,z=(o.cz||0)+Math.sin(th)*o.Rz;
    const y=WATER+o.y+(o.leap?Math.max(0,Math.sin(th*o.lf+(o.off||0)))*o.leap:Math.sin(th*4+ph*.1)*(o.bob||.12));
    const vy=(y-py)/Math.max(dt,.001),vx=-Math.sin(th)*o.R*d,vz=Math.cos(th)*o.Rz*d;
    if(o.leap&&(py-WATER)*(y-WATER)<0&&Math.hypot(x-camC.tx,z)<90){for(let i=0;i<10;i++)P.water.add(x+rnd(-.5,.5),WATER+.2,z+rnd(-.5,.5),rnd(-2,2),rnd(3,7),rnd(-2,2),.28*(o.s||1),.8,-12);if(o.plop&&running&&Math.hypot(x-camC.tx,z)<45)snd.plop();}
    py=y;obj.g.position.set(x,y,z);obj.g.rotation.set(-clamp(Math.atan2(vy,o.sp),-1.1,1.1),Math.atan2(vx,vz),0,'YXZ');obj.swim(ph);
    if(o.spout){o.st=(o.st||rnd(4,9))-dt;if(o.st<1.2&&Math.random()<.7)P.water.add(x+vx/o.R*3,WATER+.6,z+vz/o.R*3,rnd(-1,1),rnd(8,12),rnd(-1,1),.4,1.2,-12);if(o.st<0)o.st=rnd(9,16);}});}

/* ---------- world ---------- */
const ark=grp(scene);
const HWM=6.6,HL=31,HB=-3.6;
const hw=t=>HWM*Math.sqrt(Math.max(0,1-Math.pow(Math.abs(t),3.5)));
const rimY=t=>11.5+3.2*t*t*t*t;
const hullZ=(t,y)=>{const r=rimY(t),s=Math.pow(clamp((r-y)/(r-HB),0,1),1/.7);return hw(t)*Math.pow(Math.sqrt(Math.max(0,1-s*s)),.3);};
let shell=null,closed=false,shellOp=0,introT=0,camK=6;const shellM=[];
function setShell(op){const o=op>.97?1:op;for(const m of shellM){m.opacity=o;m.transparent=o<1;}shell.visible=op>.01;}
let water=null,waterP=null,rainIM=null,rainA=[],rainbow=null,noah=null,dove=null;
const clouds=[],rooms=[],zoo=[];
const ROOMS=[['hippo','crocodile','penguin','store'],['lion','tiger','panda','hay'],['giraffe','elephant','zebra','kangaroo']];
const PEN_EM={giraffe:'🦒',elephant:'🐘',zebra:'🦓',kangaroo:'🦘',lion:'🦁',penguin:'🐧',hippo:'🦛',crocodile:'🐊',panda:'🐼',tiger:'🐯',store:'🧀',hay:'🌾'};
const PEN_COL={giraffe:0xe6cf8e,elephant:0xd8c59c,zebra:0xcfe08a,kangaroo:0xe7b77a,lion:0xe9d28a,penguin:0xeef8ff,hippo:0x9cc97f,crocodile:0x8fc27a,panda:0x9ad77a,tiger:0x86c46a,store:0xc49a6c,hay:0xe8d27c};
const WALL_COL={giraffe:0xffe2a8,elephant:0xcfe3f2,zebra:0xd8f0c0,kangaroo:0xffd0a6,lion:0xffe9a6,penguin:0xbfe6ff,hippo:0xc6ecd6,crocodile:0xb8e0b0,panda:0xd9f2c4,tiger:0xc2e6b4,store:0xe9cfa6,hay:0xf4e4a6};
function buildWorld(){
  const wg=new T.PlaneGeometry(900,900,70,70);wg.rotateX(-PI/2);waterP=wg.attributes.position;
  water=new T.Mesh(wg,new T.MeshStandardMaterial({color:0x2f8fc0,roughness:.28,metalness:.15,flatShading:true,transparent:true,opacity:.86}));water.position.y=WATER;water.receiveShadow=true;water.renderOrder=2;scene.add(water);
  for(const [x,z,s] of [[-190,-260,1.3],[-120,-300,.9],[210,-250,1],[280,-200,.7],[60,-320,.8]]){const g=grp(scene,x,WATER,z);mesh(G.cone,M(0x7d8a8f,{roughness:1}),g,0,26*s,0,40*s,60*s,40*s);mesh(G.cone,M(0xffffff,{roughness:1}),g,0,46*s,0,13.6*s,20.4*s,13.6*s);}
  const cm=new T.MeshBasicMaterial({color:0xffffff,fog:false,transparent:true,opacity:.92});for(let i=0;i<9;i++){const c=grp(scene,-260+i*62+rnd(-15,15),rnd(45,85),rnd(-260,-120));for(let k=0;k<5;k++){const b=new T.Mesh(G.lo,cm);b.position.set(k*7-14,rnd(-1.5,1.5),rnd(-2,2));b.scale.set(rnd(7,10),rnd(4,6),rnd(5,7));c.add(b);}clouds.push(c);}
  rainbow=grp(scene,0,WATER-8,-230);[0xff4d4d,0xff9f1c,0xffe14d,0x5fd35f,0x4da6ff,0x8b5cf6].forEach((c,i)=>{rainbow.add(new T.Mesh(new T.TorusGeometry(125-i*4.2,2.1,6,48,PI),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.55,fog:false})));});
  rainIM=new T.InstancedMesh(G.box,new T.MeshBasicMaterial({color:0xe8f4ff,transparent:true,opacity:.45}),260);rainIM.frustumCulled=false;scene.add(rainIM);for(let i=0;i<260;i++)rainA.push([rnd(-55,55),rnd(0,50),rnd(-15,40)]);
  // sea life
  for(let i=0;i<3;i++)seaAdd(makeDolphin(),{R:44+i*2,Rz:19+i*1.5,y:-1.5,leap:4.6,lf:5,off:i*.9,sp:7,phK:1.6,th:1.2-i*.14,s:1.25-(i?.15:0),plop:1});
  seaAdd(makeDolphin(),{R:60,Rz:34,y:-1.5,leap:4.2,lf:7,sp:7.5,phK:1.6,dir:-1,s:1.1});
  seaAdd(makeWhale(),{R:105,Rz:42,cz:-34,y:-1.25,bob:.35,sp:3,phK:.8,dir:-1,spout:1});
  seaAdd(makeShark(),{R:52,Rz:27,y:-.62,sp:4,phK:1.5,s:1.7,bob:.05});
  seaAdd(makeTurtle(),{R:38,Rz:13,y:-.28,sp:1.3,phK:4,s:2.2,dir:-1,bob:.06});
  seaAdd(makeManta(),{R:66,Rz:25,y:-1.6,leap:5.5,lf:3,sp:5,phK:.9,s:1.4,plop:1});
  // hull: far side whole, near side cut away above the lowest floor
  const NI=46,NJ=18,pos=[],uv=[],idx=[];
  for(let i=0;i<=NI;i++){const t=-1+2*i/NI,w=hw(t)+.02,r=rimY(t),D=r-HB,th0=Math.asin(Math.pow((r-.25)/D,1/.7));
    for(let j=0;j<=NJ;j++){const th=th0+(PI-th0)*j/NJ,c=Math.cos(th),s=Math.sin(th);pos.push(t*HL,r-D*Math.pow(s,.7),w*Math.sign(c)*Math.pow(Math.abs(c),.3));uv.push(i/NI*9,j/NJ*6);}}
  for(let i=0;i<NI;i++)for(let j=0;j<NJ;j++){const a=i*(NJ+1)+j,b=a+1,c=a+NJ+1,d=c+1;idx.push(a,c,b,b,c,d);}
  const hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(pos,3));hg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));hg.setIndex(idx);hg.computeVertexNormals();
  const hull=new T.Mesh(hg,MT(plankTex('#a8703d','rgba(50,25,5,.55)',[1,1]),0xa8703d,{side:T.DoubleSide,roughness:.85}));hull.receiveShadow=true;hull.castShadow=true;ark.add(hull);
  {const pts=[];for(let i=0;i<=30;i++){const t=-1+2*i/30;pts.push(V(t*HL,rimY(t)+.1,-hw(t)));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,.3,7),M(0x6e4220),ark);}
  {const pts=[];for(let i=0;i<=30;i++){const t=-1+2*i/30;pts.push(V(t*HL,.3,hullZ(t,.25)));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,.22,6),M(0x6e4220),ark);}
  // removable shell: near hull side, near roof slope, front wall of the house
  shell=grp(ark);const sm=m=>{m.transparent=true;shellM.push(m);return m;};
  {const NK=10,p2=[],u2=[],i2=[];for(let i=0;i<=NI;i++){const t=-1+2*i/NI,w=hw(t)+.02,r=rimY(t),D=r-HB,th0=Math.asin(Math.pow((r-.25)/D,1/.7));
      for(let j=0;j<=NK;j++){const th=th0*j/NK,c=Math.cos(th),s=Math.sin(th);p2.push(t*HL,r-D*Math.pow(s,.7),w*Math.pow(Math.abs(c),.3));u2.push(i/NI*9,j/NK*3);}}
    for(let i=0;i<NI;i++)for(let j=0;j<NK;j++){const a=i*(NK+1)+j,b=a+1,c=a+NK+1,d=c+1;i2.push(a,c,b,b,c,d);}
    const g2=new T.BufferGeometry();g2.setAttribute('position',new T.Float32BufferAttribute(p2,3));g2.setAttribute('uv',new T.Float32BufferAttribute(u2,2));g2.setIndex(i2);g2.computeVertexNormals();
    mesh(g2,sm(MT(plankTex('#a8703d','rgba(50,25,5,.55)',[1,1]),0xa8703d,{side:T.DoubleSide,roughness:.85})),shell);
    const pts=[];for(let i=0;i<=30;i++){const t=-1+2*i/30;pts.push(V(t*HL,rimY(t)+.1,hw(t)));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,.3,7),sm(new T.MeshStandardMaterial({color:0x6e4220})),shell);
    const ry2=FY(2)+RH-.2,wm=sm(new T.MeshStandardMaterial({color:0xf3e2c2,side:T.DoubleSide})),win=sm(new T.MeshStandardMaterial({color:0x5b7fa6,roughness:.2}));
    box(wm,shell,0,FY(2)+(RH-.3)/2,5.5,36.3,RH-.3,.2);for(let q=0;q<4;q++){box(win,shell,X0+RW*(q+.5),FY(2)+2.9,5.62,2.6,1.7,.08);box(sm(new T.MeshStandardMaterial({color:0x6e4220})),shell,X0+RW*(q+.5),FY(2)+2.9,5.6,3,2.1,.06);}
    const rf=mesh(G.box,sm(MT(plankTex('#b5483a','rgba(60,10,5,.5)',[6,1.5]),0xb5483a,{roughness:.8})),shell,0,ry2+1.7,3.15,39.4,.25,7.4);rf.rotation.x=.5;
    for(const s of [-1,1]){const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(5.6,0);sh.lineTo(0,3.5);const g=new T.ShapeGeometry(sh);g.rotateY(-PI/2);mesh(g,wm,shell,s*18,ry2,0);}
    setShell(0);}
  // floor slabs (cut edge visible at the front)
  const slab=(y,near,mat)=>{const sh=new T.Shape(),p=[];for(let i=0;i<=40;i++){const t=-.985+1.97*i/40;p.push([t*HL,hullZ(t,y)*.985]);}for(let i=40;i>=0;i--){const t=-.985+1.97*i/40;p.push([t*HL,-Math.min(hullZ(t,y)*.985,near)]);}
    sh.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)sh.lineTo(p[i][0],p[i][1]);const g=new T.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:false});g.rotateX(-PI/2);const m=mesh(g,mat,ark,0,y-.3,0);m.receiveShadow=true;m.castShadow=true;return m;};
  const fm=MT(plankTex('#d9a765','rgba(70,35,8,.5)',[.11,.11]),0xd9a765,{roughness:.9});
  slab(FY(0),99,fm);slab(FY(1),5.5,fm);slab(FY(2),5.5,fm);
  // walls, back walls, room floors, props
  const fp=[],WC=0xf3e2c2;
  for(let f=0;f<NF;f++){const y=FY(f),h=RH-.3;
    for(let w=0;w<=NR;w++){const x=X0+w*RW;if(w===0||w===NR)fp.push({g:G.box,p:[x,y+h/2,0],s:[.3,h,11],c:WC});
      else{fp.push({g:G.box,p:[x,y+h/2,-.9],s:[.3,h,9.2],c:WC});fp.push({g:G.box,p:[x,y+1.35+(h-1.35)/2,4.6],s:[.3,h-1.35,1.8],c:WC});fp.push({g:G.box,p:[x,y+1.38,4.6],s:[.42,.12,1.8],c:0x6e4220});}}
    for(let r=0;r<NR;r++){const type=ROOMS[f][r],x=X0+RW*(r+.5),room={f,r,x,type,animals:[]};rooms.push(room);
      fp.push({g:G.box,p:[x,y+h/2,-5.45],s:[RW-.3,h,.14],c:WALL_COL[type]});fp.push({g:G.box,p:[x,y+.35,-5.36],s:[RW-.3,.7,.1],c:0xb98a55});
      fp.push({g:G.box,p:[x,y+.04,-.9],s:[RW-.7,.08,8.6],c:PEN_COL[type]});
      if(type==='penguin'||type==='hippo'||type==='crocodile'){const pool=mesh(cg(1,1,.06,24),M(type==='penguin'?0x8fd8ff:0x4fb3e8,{roughness:.15}),ark,x,y+.11,z0(-2.2),3.4,1,2);pool.receiveShadow=true;if(type==='penguin')for(const q of [[-3,-4,1],[3.2,-3.6,.8],[2.6,1.6,.5]])fp.push({g:G.lo,p:[x+q[0],y+.3*q[2],q[1]],s:[q[2],q[2]*.6,q[2]],c:0xffffff});}
      else if(type==='panda')for(let q=0;q<9;q++)fp.push({g:cg(.07,.07,1,6),p:[x+3.2+rnd(-.6,.6),y+1.3,-4.2+rnd(-.7,.7)],s:[1,rnd(2,3.2),1],c:pick([0x5fae4a,0x7cc65a])});
      else if(type==='store'){for(const q of [[-2.8,-4],[-1.4,-4.2],[-2.1,-3],[2.4,-4],[3.2,-2.6],[.4,-4.3],[-3,1.5]])fp.push({g:G.lo,p:[x+q[0],y+.55,q[1]],s:[.75,.6,.6],c:pick([0xe7d3a8,0xd8c18f])});
        fp.push({g:cg(1,1,.7,3),p:[x+.6,y+.45,-1.4],s:[1.4,1,1.4],c:0xffd23f});fp.push({g:cg(1,1,.7,3),p:[x+2.4,y+.45,.6],s:[1,1,1],r:[0,1,0],c:0xffc21f});fp.push({g:cg(1,1,.6,16),p:[x-1.2,y+.4,.4],s:[1.1,1,1.1],c:0xffdf6b});
        for(const q of [[-3.4,-1],[3.4,-4.4]])fp.push({g:cg(.6,.55,1.2,10),p:[x+q[0],y+.65,q[1]],c:0x8a5a2b});}
      else if(type==='hay'){for(const q of [[-2.8,-4,0],[-1.2,-4.1,0],[-2,-4,1],[2.4,-3.8,0],[3.2,-1.6,0],[.6,-4.2,0],[-3,.8,0],[1.2,.2,0],[1.4,-4,1]])fp.push({g:G.box,p:[x+q[0],y+.5+q[2]*.9,q[1]],s:[1.5,.9,1],r:[0,rnd(-.2,.2),0],c:pick([0xe9c84c,0xdcb93e])});}
      else{fp.push({g:G.box,p:[x+3.2,y+.3,-4.6],s:[1.6,.5,.7],c:0x8a5a2b});fp.push({g:G.box,p:[x+3.2,y+.52,-4.6],s:[1.4,.1,.5],c:0x5cc6ff});fp.push({g:G.box,p:[x-3.3,y+.45,-4.5],s:[1.3,.8,.9],c:0xe9c84c});}
      const tx=emojiTex(PEN_EM[type],'#fff8e8');mesh(new T.CircleGeometry(.62,24),new T.MeshBasicMaterial({map:tx,color:tx?0xffffff:0xffd23f}),ark,x,y+h-.9,-5.3);fp.push({g:G.box,p:[x,y+h-.9,-5.36],s:[1.5,1.5,.08],c:0x6e4220});
      if(MK[type])for(const s of [-1,1]){const a=MK[type]();a.room=room;a.hx=x+s*2.1;a.hz=-1.2;a.root.position.set(a.hx,y+.08,FEEDZ);a.face=-PI/2+rnd(-.35,.35);a.root.rotation.y=a.face;{const ft=type==='lion'||type==='tiger'||type==='crocodile'?0xc8554d:type==='penguin'?0x9fc4dc:type==='panda'?0x6fbf55:0xe9c84c;fp.push({g:G.lo,p:[a.hx,y+.12,3.25],s:[.85,.3,.5],c:ft});if(ft!==0xe9c84c&&ft!==0x6fbf55)fp.push({g:cg(.95,.8,.2,14),p:[a.hx,y+.1,3.25],s:[1,1,.62],c:0x8a5a2b});}a.tx=a.root.position.x;a.tz=a.root.position.z;ark.add(a.root);room.animals.push(a);zoo.push(a);}
    }}
  // end compartments + decks
  for(const q of [[-21.5,0,-1],[-20.5,0,1.5],[21,0,-.5],[20.6,RH,0],[-20.8,RH,-1.2],[-21.8,RH,1]])fp.push({g:cg(.8,.7,1.5,12),p:[q[0],q[1]+.75,q[2]],c:0x8a5a2b});
  for(const q of [[22.5,0,1.2],[-22.8,0,.2],[22,RH,-1.5]])fp.push({g:G.box,p:[q[0],q[1]+.6,q[2]],s:[1.3,1.2,1.3],r:[0,.4,0],c:0xb07a4a});
  // house roof over the top floor: far slope only, rafters where the near slope was
  const ry=FY(2)+RH-.2;
  for(const x of [X0,X0+RW,0,X0+3*RW,-X0]){fp.push({g:G.box,p:[x,ry+1.75,3],s:[.3,.3,7],r:[.53,0,0],c:0x6e4220});}
  fp.push({g:G.box,p:[0,ry+3.5,0],s:[38.6,.4,.4],c:0x6e4220});fp.push({g:G.box,p:[0,ry-.05,5.6],s:[38.6,.3,.3],c:0x6e4220});
  const am=mesh(mergeC(fp),MVC,ark);am.castShadow=true;am.receiveShadow=true;
  const roof=mesh(G.box,MT(plankTex('#b5483a','rgba(60,10,5,.5)',[6,1.5]),0xb5483a,{roughness:.8}),ark,0,ry+1.7,-3.15,39.4,.25,7.4);roof.rotation.x=-.5;roof.castShadow=true;
  for(const s of [-1,1]){const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(5.6,0);sh.lineTo(0,3.5);const g=new T.ShapeGeometry(sh);g.rotateY(PI/2);mesh(g,new T.MeshStandardMaterial({color:WC,side:T.DoubleSide}),ark,s*18,ry,0);}
  // Noah on the bow deck, lantern on the stern, dove
  noah=grp(ark,23.4,FY(2),.6);mesh(cg(.45,.8,2.3,12),M(0x8a5f3a),noah,0,1.15,0).castShadow=true;ball(M(0xf1c9a5),noah,0,2.6,0,.42);ball(M(0xffffff),noah,0,2.36,.14,.38,.5,.36);ball(M(0xffffff),noah,0,2.82,-.1,.42,.25,.4);
  for(const s of [1,-1])ball(mK,noah,s*.15,2.68,.38,.05);noah.arm=grp(noah,.55,2,0);mesh(cg(.12,.12,1,8),M(0x8a5f3a),noah.arm,0,.5,0);ball(M(0xf1c9a5),noah.arm,0,1.05,0,.15);mesh(cg(.07,.07,3.2,6),M(0x5a3413),noah,-.7,1.6,.2);
  const lan=grp(ark,-23.6,FY(2),0);mesh(cg(.12,.14,3,8),M(0x5a3413),lan,0,1.5,0);ball(new T.MeshStandardMaterial({color:0xffe9a0,emissive:0xffc400,emissiveIntensity:1}),lan,0,3.3,0,.5);
  dove=grp(ark,0,9,0);ball(M(0xffffff),dove,0,0,0,.5,.3,.28);ball(M(0xffffff),dove,.45,.2,0,.2);mesh(G.cone,M(0xff9f1c),dove,.72,.2,0,.06,.2,.06).rotation.z=-PI/2;dove.w=[];for(const s of [1,-1]){const w=grp(dove,0,.1,s*.15);ball(M(0xf2f6fa),w,0,0,s*.5,.3,.04,.5);dove.w.push({w,s});}ball(M(0x4caf50),dove,.85,.12,0,.22,.05,.1);
}
function z0(z){return z;}
const FEEDZ=1.5;
function updWorld(dt){
  for(let i=0;i<waterP.count;i++){const x=waterP.getX(i),z=waterP.getZ(i);waterP.setY(i,Math.sin(x*.07+time*1.1)*.2+Math.sin(z*.09+time*1.5)*.18+Math.sin((x+z)*.04+time*.7)*.16);}waterP.needsUpdate=true;
  ark.rotation.z=Math.sin(time*.6)*.012;ark.rotation.x=Math.sin(time*.47)*.008;ark.position.y=Math.sin(time*.8)*.14;
  for(const c of clouds){c.position.x+=dt*1.4;if(c.position.x>300)c.position.x=-300;}
  if(raining){for(let i=0;i<rainA.length;i++){const r=rainA[i];r[1]-=dt*46;if(r[1]<WATER){r[1]=rnd(35,50);r[0]=rnd(-55,55);r[2]=rnd(-15,40);}dum.position.set(camC.tx+r[0],r[1],r[2]);dum.scale.set(.05,1.3,.05);dum.rotation.set(0,0,.12);dum.updateMatrix();rainIM.setMatrixAt(i,dum.matrix);}dum.rotation.set(0,0,0);rainIM.instanceMatrix.needsUpdate=true;}
  for(const s of sea)s(dt);
  noah.arm.rotation.z=-.4+Math.sin(time*3)*.3;
  const da=time*.35;dove.position.set(Math.cos(da)*30,21+Math.sin(time*.9)*1.5,Math.sin(da)*11);dove.rotation.y=-da-PI/2;for(const w of dove.w)w.w.rotation.x=w.s*Math.sin(time*11)*.7;
  for(const a of zoo){a.wt-=dt;if(!a.moving&&a.wt<0){a.eat=Math.random()<.65;if(a.eat){a.tx=a.hx+rnd(-.3,.3);a.tz=FEEDZ;}else{a.tx=a.hx+rnd(-1.2,1.2);a.tz=a.hz+rnd(-2.4,2);}a.moving=true;}
    if(!a.moving){let df=a.face-a.root.rotation.y;df=Math.atan2(Math.sin(df),Math.cos(df));a.root.rotation.y+=df*Math.min(1,dt*2.5);}
    if(a.moving){const dx=a.tx-a.root.position.x,dz=a.tz-a.root.position.z,dl=Math.hypot(dx,dz);if(dl<.08){a.moving=false;a.wt=a.eat?rnd(5,11):rnd(2,5);a.face=-PI/2+rnd(-.45,.45);}else{const sp=a.type==='penguin'?.45:.7,want=Math.atan2(-dz,dx);let df=want-a.root.rotation.y;df=Math.atan2(Math.sin(df),Math.cos(df));a.root.rotation.y+=df*Math.min(1,dt*3);if(Math.abs(df)<.6){a.root.position.x+=dx/dl*sp*dt;a.root.position.z+=dz/dl*sp*dt;}}}
    anim(a,dt);}
}

/* ---------- pests ---------- */
const MODES={kid:{sp:.9,preg:9,kids:2,grow:20,cap:22,lose:0,tool:3.2},dad:{sp:1.35,preg:6,kids:3,grow:12,cap:80,lose:45,tool:5.5}};
let mode='kid',MD=MODES.kid,day=1,phase='idle',phaseT=0,time=0,raining=false,running=false;
let rats=[],cats=[],flyers=[],flung=[];const items={};
const PINK=0xf5a6b8;

const RG=[ratGeo(0x8794a6,0xb7c0cc,false),ratGeo(0xc9a27e,0xe6cdb0,true),ratGeo(0xe6e9ef,0xffffff,false)];
const hatG=mergeC([{g:G.cone,p:[.5,1.05,0],s:[.3,.8,.3],c:0x7b2cbf},{g:cg(.45,.45,.05,12),p:[.5,.68,0],c:0x7b2cbf},{g:G.lo,p:[.5,1.48,0],s:.1,c:0xffe14d}]);
const catG=mergeC([{g:G.lo,p:[0,.75,0],s:[.9,.5,.45],c:0xf59a3c},{g:G.lo,p:[.95,1.15,0],s:[.42,.4,.4],c:0xf59a3c},{g:G.lo,p:[1.22,1.05,0],s:[.2,.16,.24],c:0xffffff},{g:G.lo,p:[1.4,1.1,0],s:.06,c:0xff6f91},
  {g:G.cone,p:[.9,1.6,.22],s:[.14,.3,.14],c:0xf59a3c},{g:G.cone,p:[.9,1.6,-.22],s:[.14,.3,.14],c:0xf59a3c},{g:G.lo,p:[1.22,1.25,.17],s:.07,c:0x2e7d32},{g:G.lo,p:[1.22,1.25,-.17],s:.07,c:0x2e7d32},
  {g:cg(.08,.06,1.2,6),p:[-.95,1.25,0],r:[0,0,.5],c:0xd97c1f},{g:cg(.1,.1,.6,6),p:[.5,.3,.22],c:0xf59a3c},{g:cg(.1,.1,.6,6),p:[.5,.3,-.22],c:0xf59a3c},{g:cg(.1,.1,.6,6),p:[-.5,.3,.22],c:0xf59a3c},{g:cg(.1,.1,.6,6),p:[-.5,.3,-.22],c:0xf59a3c},
  {g:G.box,p:[-.2,1.02,0],s:[.2,.5,.9],c:0xd97c1f},{g:G.box,p:[.25,1.02,0],s:[.2,.5,.9],c:0xd97c1f}]);
const trapG=mergeC([{g:G.box,p:[0,.08,0],s:[1.3,.16,.9],c:0x8a5a2b},{g:G.box,p:[.1,.5,0],s:[1.4,.1,.16],r:[0,0,.5],c:0xcfd8dc},{g:G.lo,p:[.7,.82,0],s:[.3,.12,.3],c:0xcfd8dc},{g:cg(1,1,.3,3),p:[-.35,.32,0],s:[.3,1,.3],c:0xffd23f},{g:G.box,p:[-.45,.3,.36],s:[.1,.5,.1],c:0x6e4220},{g:G.box,p:[-.45,.3,-.36],s:[.1,.5,.1],c:0x6e4220}]);
const owlG=mergeC([{g:cg(.12,.14,1.8,8),p:[0,.9,0],c:0x6e4220},{g:G.box,p:[0,1.8,0],s:[.9,.12,.2],c:0x6e4220},{g:G.lo,p:[0,2.45,0],s:[.5,.62,.45],c:0x8d6e4a},{g:G.lo,p:[0,2.4,.2],s:[.36,.45,.34],c:0xe6d2ac},{g:G.lo,p:[0,3.05,.1],s:[.44,.4,.46],c:0x8d6e4a},
  {g:G.lo,p:[.18,3.1,.42],s:.16,c:0xffe14d},{g:G.lo,p:[-.18,3.1,.42],s:.16,c:0xffe14d},{g:G.lo,p:[.18,3.1,.56],s:.07,c:0x111111},{g:G.lo,p:[-.18,3.1,.56],s:.07,c:0x111111},{g:G.cone,p:[0,2.96,.56],s:[.07,.2,.07],r:[PI/2,0,0],c:0xff9f1c},
  {g:G.cone,p:[.28,3.45,.05],s:[.1,.25,.1],c:0x6d4c2f},{g:G.cone,p:[-.28,3.45,.05],s:[.1,.25,.1],c:0x6d4c2f}]);
function spawnRat(f,c,sex,age,wiz){const m=new T.Mesh(RG[sex],MVC);m.castShadow=true;ark.add(m);const r={f,c,nc:c,pc:-9,t:0,sex,age,preg:0,cd:rnd(2,5),tp:0,busy:0,wiz:!!wiz,m,ph:rnd(6),lz:rnd(-.5,.5)};
  if(wiz)r.hat=mesh(hatG,MVC,m);ratPos(r,m.position);rats.push(r);return r;}
function ratPos(r,out){out.set(lerp(cx(r.c),cx(r.nc),r.t),FY(r.f)+.02,LZ+(r.lz||0));return out;}
function choose(r,chase){const o=[r.c+1,r.c-1].filter(c=>valid(c)&&!(items[key(r.f,c)]&&items[key(r.f,c)].type==='stop'));
  if(!o.length){r.nc=r.c;return;}let q;
  if(chase){let best=1e9,tg=null;for(const rr of rats)if(rr.f===r.f&&!rr.dead){const d=Math.abs(rr.c-r.c);if(d<best){best=d;tg=rr;}}if(tg&&tg.c!==r.c){const w=r.c+Math.sign(tg.c-r.c);if(o.includes(w))q=w;}}
  if(q===undefined){const fwd=o.filter(c=>c!==r.pc);q=fwd.length&&Math.random()>.07?fwd[0]:pick(o);}
  r.nc=q;r.t=0;}
const tv=V(),tv2=V();
function fling(m,why){ark.add(m);const x0=m.position.x;flung.push({m,x0,y0:m.position.y,z0:m.position.z,x1:x0+rnd(-6,6),z1:rnd(11,19),t:0,dur:rnd(1,1.4)});if(why!=='quiet')snd.squeak();}
function killRat(r,why){r.dead=true;fling(r.m,why);}
function addItem(type,f,c){const it={type,f,c,g:grp(ark,cx(c),FY(f),LZ),t:0};items[key(f,c)]=it;return it;}
function delItem(it){if(it.g.parent)it.g.parent.remove(it.g);if(items[key(it.f,it.c)]===it)delete items[key(it.f,it.c)];}
function makeHole(f,c){if(f<1||items[key(f,c)]||items[key(f-1,c)])return;const a=addItem('hole',f,c),b=addItem('rope',f-1,c);a.pair=b;b.pair=a;
  mesh(cg(.62,.62,.34,16),M(0x1a0f06,{roughness:1}),a.g,0,-.14,0);const r=mesh(new T.TorusGeometry(.62,.12,6,16),M(0xa8703d),a.g,0,.05,0);r.rotation.x=PI/2;
  mesh(cg(.05,.05,RH-.3,5),M(0xd9c08a),b.g,0,(RH-.3)/2,0);for(let q=0;q<5;q++)box(M(0xb98a55),b.g,0,.6+q*.9,0,.5,.08,.12);mesh(cg(.62,.62,.05,16),M(0x1a0f06,{roughness:1}),b.g,0,RH-.32,0);
  burst('dust',cx(c),FY(f)+.2,LZ,10,2.5,.16,.7,-6);if(announceOnce('hole'))say('🕳️','Szczury wiercą podłogę! Zatkaj deską 🪵');}
function makePortal(f,c){const free=ALLC.filter(q=>!items[key(q[0],q[1])]&&(q[0]!==f||Math.abs(q[1]-c)>5));if(!free.length||items[key(f,c)])return;const q=pick(free),A=addItem('portal',f,c),B=addItem('portal',q[0],q[1]);A.pair=B;B.pair=A;
  for(const it of [A,B]){it.ring=mesh(new T.TorusGeometry(.85,.15,8,24),new T.MeshStandardMaterial({color:0xc77dff,emissive:0x9d4edd,emissiveIntensity:1.2}),it.g,0,1.2,0);it.disc=mesh(new T.CircleGeometry(.75,20),new T.MeshBasicMaterial({color:0x5a189a,transparent:true,opacity:.7,side:T.DoubleSide}),it.g,0,1.2,0);it.ring.rotation.y=it.disc.rotation.y=PI/2-.5;}
  snd.portal();if(announceOnce('portal'))say('🌀','Szczur-czarodziej zrobił portal! Deska 🪵 go zamknie');}
const nHoles=()=>{let n=0;for(const k in items)if(items[k].type==='hole')n++;return n;};
const nPortals=()=>{let n=0;for(const k in items)if(items[k].type==='portal')n++;return n;};
function arrive(r){const it=items[key(r.f,r.c)];
  if(it){
    if(it.type==='trap'){snd.boing();delItem(it);killRat(r);return true;}
    if(it.type==='potion'&&r.sex===1){r.sex=0;r.preg=0;r.m.geometry=RG[0];floater('💙',r.m.position);}
    if((it.type==='hole'&&r.tp<=0&&Math.random()<.5)||(it.type==='rope'&&r.tp<=0&&Math.random()<.35)){r.f+=it.type==='hole'?-1:1;r.tp=5;r.pc=-9;burst('dust',cx(r.c),FY(r.f)+.3,LZ,5,1.5,.14,.6,-5);}
    else if(it.type==='portal'&&r.tp<=0){const o=it.pair;burst('magic',cx(r.c),FY(r.f)+1,LZ,6,2,.14,.6,0);r.f=o.f;r.c=o.c;r.pc=-9;r.tp=5;burst('magic',cx(r.c),FY(r.f)+1,LZ,6,2,.14,.6,0);snd.portal();}
    return false;}
  if(r.age<MD.grow)return false;
  if(day>=3&&r.f>=1&&!items[key(r.f-1,r.c)]){const n=nHoles();if(n<3&&Math.random()<(n?.012:.05)){r.busy=2.4;return false;}}
  if(r.wiz&&nPortals()<4&&Math.random()<.05){makePortal(r.f,r.c);r.tp=5;}
  return false;}
function explode(it){const x=cx(it.c),y=FY(it.f);snd.boom();burst('puff',x,y+.5,LZ,26,6,.7,1.1,0);burst('spark',x,y+.5,LZ,18,8,.2,.8,-6);floater('🤧',V(x,y+2,LZ));
  for(const r of rats){if(r.dead||r.f!==it.f)continue;if(Math.abs(r.m.position.x-x)<6.2)killRat(r,'quiet');}
  for(const f of flyers)if(!f.dead&&f.m.position.distanceTo(tv.set(x,y+1,LZ))<7.5){f.dead=true;fling(f.m,'quiet');}
  for(const a of zoo)if(a.room.f===it.f&&Math.abs(a.root.position.x-x)<9)a.jumpT=1;
  delItem(it);}
function birth(r){const n=MD.kids+(mode==='dad'&&Math.random()<.4?1:0);for(let q=0;q<n;q++){if(rats.length>=MD.cap)break;const b=spawnRat(r.f,r.c,Math.random()<.5?0:1,0,day>=5&&Math.random()<.2);b.pc=q%2?r.c+1:r.c-1;}r.cd=MD.preg+8;floater('🍼',r.m.position);snd.baby();}
function face(m,dx,dt){if(!dx)return;const want=dx>0?0:PI;let df=want-m.rotation.y;df=Math.atan2(Math.sin(df),Math.cos(df));m.rotation.y+=df*Math.min(1,dt*10);}
function updPests(dt){
  for(const r of rats){if(r.dead)continue;r.age+=dt;r.cd-=dt;r.tp-=dt;r.ph+=dt*12;
    if(r.preg>0){r.preg-=dt;if(r.preg<=0)birth(r);}
    if(r.busy>0){r.busy-=dt;if(Math.random()<dt*14){P.dust.add(cx(r.c)+rnd(-.4,.4),FY(r.f)+.2,LZ+rnd(-.4,.4),rnd(-2,2),rnd(2,4),rnd(-2,2),.13,.5,-9);if(Math.random()<.4)snd.drill();}r.m.rotation.y+=dt*14;if(r.busy<=0)makeHole(r.f,r.c);continue;}
    const sp=MD.sp*(r.age<MD.grow?1.25:1)*(r.preg>0?.7:1);
    if(r.nc===r.c)choose(r);else{r.t+=dt*sp;if(r.t>=1){r.pc=r.c;r.c=r.nc;r.t=0;if(arrive(r))continue;if(r.busy>0)r.nc=r.c;else choose(r);}}
    ratPos(r,r.m.position);r.m.position.y+=Math.abs(Math.sin(r.ph))*.12;face(r.m,r.nc-r.c,dt);
    const g=1.15*clamp(.5+.5*r.age/MD.grow,.5,1);r.m.scale.set(g,g,g*(r.preg>0?1.5:1));}
  for(const c of cats){c.life-=dt;c.ph+=dt*14;if(c.nc===c.c)choose(c,true);else{c.t+=dt*2.6;if(c.t>=1){c.pc=c.c;c.c=c.nc;c.t=0;choose(c,true);}}
    ratPos(c,c.m.position);c.m.position.y+=Math.abs(Math.sin(c.ph))*.15;face(c.m,c.nc-c.c,dt);
    for(const r of rats){if(r.dead||r.f!==c.f)continue;if(Math.abs(r.m.position.x-c.m.position.x)<1.6)killRat(r);}
    for(const f of flyers)if(!f.dead&&f.m.position.distanceTo(c.m.position)<2.2){f.dead=true;fling(f.m);}
    if(c.life<=0){c.dead=true;burst('puff',c.m.position.x,c.m.position.y+.6,c.m.position.z,10,2,.4,.7,0);ark.remove(c.m);}}
  for(const f of flyers){if(f.dead)continue;f.ph+=dt*22;for(const w of f.w)w.w.rotation.x=w.s*(f.st===1?.2:Math.sin(f.ph)*.9);const p=f.m.position;
    if(f.st===1){f.t-=dt;if(f.t<1.3&&!f.gave){f.gave=true;if(rats.length<MD.cap){spawnRat(f.tf,f.tc,Math.random()<.5?0:1,0,false);floater('🎁',p);snd.baby();}}
      if(f.t<=0){f.st=2;}}
    else{const gx=f.st===0?cx(f.tc):cx(f.tc),gy=f.st===0?FY(f.tf)+.25:FY(f.tf)+3,gz=f.st===0?LZ:8.5;
      if(f.st===0&&p.z>8.2&&Math.abs(p.x-gx)>1.5){tv.set(gx,FY(f.tf)+3+Math.sin(time*2+f.ph*.01)*.5,8.6);}else tv.set(gx,gy,gz);
      tv.sub(p);const dl=tv.length();if(dl<.25){if(f.st===0){f.st=1;f.t=2.6;f.gave=false;}else{f.st=0;const q=pick(ALLC);f.tf=q[0];f.tc=q[1];}}else{const stp=Math.min(dl,6*dt);p.addScaledVector(tv,stp/dl);if(Math.abs(tv.x)>.3)f.m.rotation.y=tv.x>0?0:PI;}}}
  for(const k in items){const it=items[k];it.t+=dt;
    if(it.type==='bomb'){it.g.scale.setScalar(1+Math.sin(it.t*18)*.08*it.t);if(Math.random()<.5)P.spark.add(cx(it.c),FY(it.f)+1.25,LZ,rnd(-1,1),rnd(1,3),rnd(-1,1),.08,.3,-5);if(it.t>2.4)explode(it);}
    else if(it.type==='stop'||it.type==='potion'){if(it.t>it.life-3)it.g.visible=Math.sin(it.t*14)>-.3;if(it.t>it.life)delItem(it);else if(it.type==='potion'&&Math.random()<dt*5)P.magic.add(cx(it.c)+rnd(-.6,.6),FY(it.f)+.1,LZ+rnd(-.6,.6),0,rnd(1,2),0,.1,.7,0);}
    else if(it.type==='owl'){it.cd-=dt;it.m.rotation.y=Math.sin(it.t*1.2)*.9;if(it.t>it.life-3)it.g.visible=Math.sin(it.t*14)>-.3;if(it.t>it.life){delItem(it);continue;}
      if(it.cd<=0)for(const f of flyers){if(f.dead)continue;if(Math.hypot(f.m.position.x-cx(it.c),f.m.position.y-FY(it.f)-2)<11){f.dead=true;fling(f.m);snd.hoot();it.cd=1.1;floater('🦉',f.m.position);break;}}}
    else if(it.type==='portal'){it.ring.rotation.z+=dt*3;if(Math.random()<dt*5)P.magic.add(cx(it.c)+rnd(-.3,.3),FY(it.f)+rnd(.5,2),LZ+rnd(-.5,.5),0,rnd(.3,1),0,.09,.6,0);}}
  for(const f of flung){f.t+=dt/f.dur;const t=Math.min(1,f.t);f.m.position.set(lerp(f.x0,f.x1,t),lerp(f.y0,WATER,t)+Math.sin(t*PI)*6,lerp(f.z0,f.z1,t));f.m.rotation.z+=dt*11;f.m.rotation.x+=dt*7;
    if(f.t>=1){ark.remove(f.m);f.done=true;burst('water',f.x1,WATER+.4,f.z1,12,3.2,.3,.9,-11);snd.plop();}}
  if(flung.some(f=>f.done))flung=flung.filter(f=>!f.done);
  if(rats.some(r=>r.dead))rats=rats.filter(r=>!r.dead);if(cats.some(c=>c.dead))cats=cats.filter(c=>!c.dead);if(flyers.some(f=>f.dead))flyers=flyers.filter(f=>!f.dead);
}
let loveT=0,scareT=0;
function social(dt){loveT-=dt;if(loveT<=0){loveT=.3;if(rats.length<MD.cap)for(const f of rats){if(f.sex!==1||f.preg>0||f.cd>0||f.age<MD.grow||f.busy>0)continue;for(const m of rats){if(m.sex!==0||m.f!==f.f||m.cd>0||m.age<MD.grow)continue;if(Math.abs(m.m.position.x-f.m.position.x)<1){f.preg=MD.preg;f.cd=MD.preg;m.cd=9;floater('❤️',f.m.position);snd.heart();break;}}}}
  scareT-=dt;if(scareT<=0){scareT=.6;for(const p of rooms){if(!p.animals.length)continue;let near=false;for(const r of rats){if(r.f===p.f&&Math.abs(r.m.position.x-p.x)<RW/2){near=true;break;}}if(near)for(const a of p.animals)a.tickle=Math.max(a.tickle,.9);}
    if(Math.random()<.25&&rats.length)snd.squeak();}}

/* ---------- tools ---------- */
const TOOLS=[{id:'trap',ic:'🪤',day:1},{id:'bomb',ic:'💣',day:1},{id:'cat',ic:'🐈',day:2},{id:'stop',ic:'🛑',day:2},{id:'plank',ic:'🪵',day:3},{id:'potion',ic:'🧪',day:3},{id:'owl',ic:'🦉',day:4}];
const inv={};let sel=null,toolT=0;const MAXINV=6;
function buildTools(fresh){const el=$('tools');el.innerHTML='';for(const t of TOOLS){if(day<t.day)continue;const b=document.createElement('button');b.className='tb'+(sel===t.id?' on':'')+(inv[t.id]?'':' zero')+(fresh&&t.day===day&&day>1?' new':'');b.innerHTML=t.ic+'<i>'+(inv[t.id]||0)+'</i>';b.setAttribute('aria-label',t.id);
    b.onclick=()=>{if(!inv[t.id]){snd.no();return;}sel=sel===t.id?null:t.id;snd.tap();buildTools();};el.appendChild(b);}}
function give(id,n){inv[id]=Math.min(MAXINV,(inv[id]||0)+(n||1));}
function toolDrip(dt){toolT-=dt;if(toolT>0)return;toolT=MD.tool;const c=[];for(const t of TOOLS){if(day<t.day||(inv[t.id]||0)>=MAXINV)continue;let w=1;
    if(t.id==='trap')w=3;if(t.id==='bomb')w=1.5;if(t.id==='plank')w=(nHoles()+nPortals()/2>(inv.plank||0))?3:0;if(t.id==='owl')w=flyers.length?2.5:0;if(t.id==='potion')w=.7;for(let q=0;q<w*2;q++)c.push(t.id);}
  if(c.length){give(pick(c));snd.got();buildTools();}}
function place(f,c){const it=items[key(f,c)],x=cx(c),y=FY(f);
  if(sel==='plank'){if(!it||(it.type!=='hole'&&it.type!=='rope'&&it.type!=='portal')){snd.no();return;}
    if(it.type==='portal')burst('magic',cx(it.pair.c),FY(it.pair.f)+1,LZ,10,3,.16,.7,0);
    else{const top=it.type==='hole'?it:it.pair,pg=grp(ark,cx(top.c),FY(top.f),LZ);for(const a of [-.35,.35])box(M(0xc79a5e),pg,a,.07,0,.6,.1,1.7).rotation.y=a;setTimeout(()=>{if(pg.parent)pg.parent.remove(pg);},20000);}
    delItem(it.pair);delItem(it);burst('dust',x,y+.3,LZ,10,2.5,.18,.6,-5);snd.place();snd.drill();}
  else if(sel==='cat'){const m=new T.Mesh(catG,MVC);m.castShadow=true;ark.add(m);const ct={f,c,nc:c,pc:-9,t:0,life:mode==='kid'?22:16,m,ph:0,lz:0};ratPos(ct,m.position);cats.push(ct);snd.meow();burst('puff',x,y+.6,LZ,8,2,.35,.6,0);}
  else{if(it){snd.no();return;}
    const n=addItem(sel,f,c);
    if(sel==='trap'){mesh(trapG,MVC,n.g).castShadow=true;}
    else if(sel==='bomb'){ball(M(0x24242c,{roughness:.35}),n.g,0,.6,0,.55).castShadow=true;mesh(cg(.14,.14,.2,8),M(0x777777),n.g,0,1.15,0);ball(M(0xd32f2f),n.g,0,.7,.42,.14);}
    else if(sel==='stop'){n.life=mode==='kid'?30:22;mesh(cg(.1,.1,2,8),M(0x90a4ae),n.g,0,1,0);const s=mesh(cg(.8,.8,.12,8),M(0xe53935),n.g,0,2.2,0);s.rotation.x=PI/2;s.rotation.z=PI/8;for(const q of [.08,-.08])box(M(0xffffff),n.g,0,2.2,q,1,.26,.02);box(M(0xb07a4a),n.g,0,.6,0,.2,1.2,1.9);}
    else if(sel==='potion'){n.life=mode==='kid'?30:22;mesh(cg(.72,.72,.05,20),new T.MeshStandardMaterial({color:0x4da6ff,transparent:true,opacity:.75,roughness:.1}),n.g,0,.07,0);mesh(cg(.2,.28,.5,10),M(0x90caf9,{roughness:.1}),n.g,.2,.3,.6);mesh(cg(.1,.1,.25,8),M(0x8a5a2b),n.g,.2,.65,.6);}
    else if(sel==='owl'){n.life=mode==='kid'?40:28;n.cd=.5;n.m=mesh(owlG,MVC,n.g);n.m.castShadow=true;snd.hoot();}
    snd.place();}
  inv[sel]--;if(!inv[sel])sel=null;buildTools();}

/* ---------- days ---------- */
const KEY='arka9.v2';let SAVE={kid:1,dad:1,seen:{}};
try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d){SAVE.kid=Math.max(1,d.kid|0);SAVE.dad=Math.max(1,d.dad|0);SAVE.seen=d.seen||{};}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SAVE));}catch(e){}}
function announceOnce(k){if(SAVE.seen[k])return false;SAVE.seen[k]=1;save();return true;}
let msgT=0;function say(big,txt,dur){const m=$('msg');m.innerHTML='<big>'+big+'</big>'+(txt||'');m.hidden=false;m.style.animation='none';void m.offsetWidth;m.style.animation='';msgT=dur||3;}
function clearAll(){for(const l of [rats,cats,flyers,flung])for(const r of l)if(r.m.parent)r.m.parent.remove(r.m);rats=[];cats=[];flyers=[];flung=[];for(const k in items){const it=items[k];if(it.g.parent)it.g.parent.remove(it.g);delete items[k];}}
function setWeather(){raining=day%2===1;scene.background=raining?SKY.rain:SKY.sun;scene.fog.color.set(raining?0xb5ccd9:0xc9ecfa);sun.intensity=raining?.55:.85;hemi.intensity=raining?.78:.72;rainIM.visible=raining;rainbow.visible=!raining;water.material.color.set(raining?0x3d7fa3:0x2f8fc0);$('wIc').textContent=raining?'☔':'🌈';setLoop('rain',raining?.05:0);}
function startDay(){clearAll();MD=MODES[mode];phase='play';sel=null;toolT=MD.tool;
  for(const t of TOOLS)inv[t.id]=day<t.day?0:(t.id==='trap'?3:t.id==='bomb'?(mode==='kid'?2:1):t.id==='plank'||t.id==='owl'?0:1);
  const n=Math.min(mode==='kid'?9:14,(mode==='kid'?3:4)+day);
  for(let q=0;q<n;q++){const c=pick(ALLC);spawnRat(day===1?(q<n/2?2:0):c[0],c[1],q%2,MD.grow+rnd(5),day>=5&&q%4===0);}
  if(day>=4){const nf=Math.min(4,1+((day-4)>>1));for(let q=0;q<nf;q++){const m=new T.Mesh(RG[2],MVC);m.castShadow=true;ark.add(m);m.position.set(rnd(-15,15),rnd(4,14),9);const f={m,w:[],st:0,ph:rnd(6),t:0};for(const s of [1,-1]){const w=grp(m,0,.5,s*.2);ball(M(0xffffff),w,0,0,s*.6,.35,.04,.6);f.w.push({w,s});}const c=pick(ALLC);f.tf=c[0];f.tc=c[1];flyers.push(f);}give('owl',2);}
  if(day>=3)give('plank',1);
  setWeather();$('dayN').textContent=day;buildTools(true);
  const NEW={1:['🐀','Wygoń szczury za burtę! 🪤 💣'],2:['🐈 🛑','Nowe: kot i znak stop'],3:['🕳️ 🪵 🧪','Uwaga, wiercą podłogę!'],4:['🐭🪽 🦉','Latające myszy! Sowa pomoże'],5:['🧙 🌀','Szczury-czarodzieje i portale']}[day];
  if(NEW)say(NEW[0],NEW[1],3.5);else say('☔ '+day,'Dzień '+day+' potopu',2);
  overview();}
function checkEnd(dt){
  if(phase==='play'){const n=rats.length+flyers.length;
    if(n===0&&!flung.length){phase='won';phaseT=4.5;snd.win();say('🕊️🌈','Arka czysta!',4);zoo.forEach((a,i)=>{setTimeout(()=>{a.jumpT=1;},i*90);});snd.voice(pick(zoo).type,.6);for(let q=0;q<40;q++)P.spark.add(rnd(-20,20),rnd(3,16),rnd(5,8),rnd(-2,2),rnd(2,6),rnd(-2,2),.25,1.6,-5);SAVE[mode]=day+1;save();}
    else if(MD.lose&&n>=MD.lose){phase='lost';phaseT=4;snd.lose();say('🐀🐀🐀','Szczury przejęły arkę! Jeszcze raz…',4);}}
  else if(phase==='won'||phase==='lost'){phaseT-=dt;if(phaseT<=0){if(phase==='won')day++;startDay();}}}

/* ---------- camera & input (side view) ---------- */
const camC={tx:0,ty:8,dist:80,yaw:.15,pitch:.17},camG={tx:0,ty:8,dist:80,yaw:.15,pitch:.17};
const tanV=()=>Math.tan(camera.fov*PI/360);
function fitDist(){const port=camera.aspect<1;return 1.06*Math.max((port?19.5:33)/(tanV()*camera.aspect),13/tanV());}
const fullFit=()=>1.12*Math.max(33/(tanV()*camera.aspect),14/tanV());
const maxDist=()=>closed?fullFit()*2.4:fitDist()*(camera.aspect<1?1.9:1.3);
function setClosed(c){closed=c;$('bShip').classList.toggle('on',c);camG.pitch=c?.3:.17;if(c){camG.tx=0;camG.ty=8;camG.dist=fullFit();}else{camC.yaw=Math.atan2(Math.sin(camC.yaw),Math.cos(camC.yaw));overview();}}
function overview(){camG.tx=0;camG.ty=7.6;camG.dist=fitDist();camG.yaw=.15;}
function updCam(dt){const k=1-Math.exp(-dt*camK);for(const q of ['tx','ty','dist','yaw','pitch'])camC[q]+=(camG[q]-camC[q])*k;
  shellOp+=((closed?1:0)-shellOp)*Math.min(1,dt*3.5);setShell(shellOp);
  const cp=Math.cos(camC.pitch);camera.position.set(camC.tx+Math.sin(camC.yaw)*cp*camC.dist,camC.ty+Math.sin(camC.pitch)*camC.dist,Math.cos(camC.yaw)*cp*camC.dist);camera.lookAt(camC.tx,camC.ty,0);camera.updateMatrixWorld();}
const ptrs=new Map();let gest=null;
const ray=new T.Raycaster(),inv4=new T.Matrix4();
function hitLane(px,py){ray.setFromCamera({x:px/W*2-1,y:-(py/H*2-1)},camera);ark.updateMatrixWorld();inv4.copy(ark.matrixWorld).invert();const o=ray.ray.origin.clone().applyMatrix4(inv4),d=ray.ray.direction.clone().transformDirection(inv4);if(d.z>-.01)return null;return o.addScaledVector(d,(LZ-o.z)/d.z);}
function onTap(px,py){if(closed){introT=0;camK=6;setClosed(false);snd.tap();return;}if(phase!=='play'&&phase!=='won')return;const p=hitLane(px,py);if(!p)return;const f=Math.floor((p.y+.3)/RH),c=Math.floor((p.x-X0)/CW);if(f<0||f>=NF||!valid(c))return;
  const it=items[key(f,c)];
  if(sel&&phase==='play')place(f,c);
  else if(!sel&&it&&(it.type==='hole'||it.type==='rope'||it.type==='portal')&&inv.plank&&phase==='play'){sel='plank';place(f,c);}
  else{const room=rooms.find(q=>q.f===f&&q.r===Math.floor(c/6));camG.tx=room.x;camG.ty=FY(f)+2.5;camG.dist=Math.min(camG.dist,Math.max(15,5.6/(tanV()*camera.aspect)));room.animals.forEach((a,n)=>{setTimeout(()=>{a.jumpT=1;},n*200);});if(room.animals.length)snd.voice(room.type,.8);else snd.tap();}}
canvas.addEventListener('pointerdown',e=>{try{canvas.setPointerCapture(e.pointerId);}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1)gest={tap:true,sx:e.clientX,sy:e.clientY,t0:performance.now(),lx:e.clientX,ly:e.clientY,rot:e.button===2||e.shiftKey};
  else if(ptrs.size===2){const a=[...ptrs.values()];gest={tap:false,d0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),a0:Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),z0:camG.dist,y0:camG.yaw};}e.preventDefault();});
canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p||!gest)return;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===1){if(gest.d0!==undefined)return;if(Math.hypot(e.clientX-gest.sx,e.clientY-gest.sy)>12)gest.tap=false;if(!gest.tap){const dx=e.clientX-gest.lx,dy=e.clientY-gest.ly;
      if(closed)camG.yaw-=dx*.006;else if(gest.rot)camG.yaw=clamp(camG.yaw-dx*.006,-.9,.9);else{const kk=2*camC.dist*tanV()/H;camG.tx=clamp(camG.tx-dx*kk,-30,30);camG.ty=clamp(camG.ty+dy*kk,-2,20);camC.tx=camG.tx;camC.ty=camG.ty;}}
    gest.lx=e.clientX;gest.ly=e.clientY;}
  else if(ptrs.size===2&&gest.d0){const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),an=Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x);camG.dist=clamp(gest.z0*gest.d0/Math.max(20,d),12,maxDist());camG.yaw=closed?gest.y0+(an-gest.a0):clamp(gest.y0+(an-gest.a0),-.9,.9);}});
const pUp=e=>{if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);if(gest&&gest.tap&&ptrs.size===0&&performance.now()-gest.t0<450)onTap(e.clientX,e.clientY);if(ptrs.size===0)gest=null;else if(ptrs.size===1){const a=[...ptrs.values()][0];gest={tap:false,sx:a.x,sy:a.y,lx:a.x,ly:a.y,t0:0};}};
canvas.addEventListener('pointerup',pUp);canvas.addEventListener('pointercancel',pUp);canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();camG.dist=clamp(camG.dist*Math.exp(e.deltaY*.0012),12,maxDist());},{passive:false});

/* ---------- HUD ---------- */
const fv=V();
function floater(txt,p){fv.copy(p);ark.localToWorld(fv);fv.project(camera);if(fv.z>1||Math.abs(fv.x)>1.1||Math.abs(fv.y)>1.1)return;const d=document.createElement('div');d.className='fl';d.textContent=txt;d.style.left=((fv.x+1)/2*W)+'px';d.style.top=((1-fv.y)/2*H-20)+'px';$('floaters').appendChild(d);setTimeout(()=>d.remove(),1100);}
let hudT=0;
function hud(dt){hudT-=dt;if(hudT>0)return;hudT=.2;const n=rats.length+flyers.length;$('ratN').textContent=n;$('ratBar').style.width=MD.lose?Math.min(100,n/MD.lose*100)+'%':'0';}

/* ---------- main loop ---------- */
let last=performance.now(),fAcc=0,fN=0,qStep=0;
function update(dt){time+=dt;updWorld(dt);if(introT>0){introT-=dt;if(introT<=0){camK=6;setClosed(false);}}
  if(closed){}else if(phase==='play'){updPests(dt);social(dt);toolDrip(dt);}else if(phase==='won'||phase==='lost'){updPests(dt);}
  checkEnd(dt);if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').hidden=true;}
  updCam(dt);for(const k in P)P[k].up(dt);hud(dt);}
function frame(now){const raw=(now-last)/1000;last=now;const dt=Math.min(.05,Math.max(0,raw));
  if(running){update(dt);fAcc+=raw;fN++;if(fAcc>4){const fps=fN/fAcc;if(fps<27&&qStep<2){qStep++;if(qStep===1){pixelRatio=Math.min(pixelRatio,1.25);resize();}else{renderer.shadowMap.enabled=false;sun.castShadow=false;scene.traverse(o=>{if(o.material&&o.material.isMaterial)o.material.needsUpdate=true;});}}fAcc=0;fN=0;}}
  else{time+=dt;updWorld(dt);closed=true;shellOp=1;camG.pitch=.3;camG.dist=fullFit()*1.15;camG.yaw+=dt*.12;updCam(dt);for(const k in P)P[k].up(dt);}
  renderer.render(scene,camera);requestAnimationFrame(frame);}
function resize(){W=innerWidth;H=innerHeight;renderer.setPixelRatio(pixelRatio);renderer.setSize(W,H,false);const wasFit=camG.dist>=camera.userData.fit*.98;camera.aspect=W/H;camera.fov=W<H?46:40;camera.updateProjectionMatrix();const f=fitDist();if(wasFit||!camera.userData.fit)overview();camG.dist=Math.min(camG.dist,maxDist());camera.userData.fit=f;}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));

document.addEventListener('visibilitychange',()=>{if(!AC)return;if(document.hidden)AC.suspend();else AC.resume();last=performance.now();});

/* ---------- boot ---------- */
sun.position.set(16,30,52);sun.target.position.set(0,7,0);{const sc=sun.shadow.camera;sc.left=-36;sc.right=36;sc.top=22;sc.bottom=-22;sc.far=170;sc.updateProjectionMatrix();}
buildWorld();scene.background=SKY.sun;rainIM.visible=false;camera.userData.fit=0;resize();overview();camC.dist=camG.dist;
$('sKid').textContent='dzień '+SAVE.kid;$('sDad').textContent='dzień '+SAVE.dad;
function begin(m){mode=m;day=SAVE[m];initAudio();if(AC&&AC.state==='suspended')AC.resume();goFS();$('start').remove();$('ui').hidden=false;running=true;last=performance.now();startDay();setClosed(true);shellOp=1;camG.dist=fitDist();camG.ty=7.6;camG.yaw=.15;camC.dist=fullFit()*2.6;camC.yaw=-1.5;camC.ty=16;camC.pitch=.3;camK=.85;introT=4.6;setTimeout(resize,400);}
$('bKid').onclick=()=>begin('kid');$('bDad').onclick=()=>begin('dad');
$('bAll').onclick=()=>{if(closed){introT=0;camK=6;setClosed(false);}else overview();snd.tap();};
$('bShip').onclick=()=>{introT=0;camK=6;setClosed(!closed);snd.tap();};
$('bMus').onclick=()=>{muted=!muted;if(master)master.gain.value=muted?0:1;$('bMus').textContent=muted?'🔇':'🔊';};
$('bHelp').onclick=()=>{$('help').hidden=false;};$('bHelpX').onclick=()=>{$('help').hidden=true;};
{const elr=document.documentElement;if(!(elr.requestFullscreen||elr.webkitRequestFullscreen))$('bFs').hidden=true;}
$('bFs').onclick=()=>{if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);}else goFS();};
window.__t={setClosed,get closed(){return closed;},zoo,begin,step:update,get rats(){return rats;},get flyers(){return flyers;},items,inv,place,setSel(s){sel=s;},setDay(d){day=d;startDay();},cam:camG,get phase(){return phase;},killAll(){for(const r of rats)killRat(r,'quiet');for(const f of flyers){f.dead=true;fling(f.m,'quiet');}},makeHole,makePortal,overview};
requestAnimationFrame(frame);
