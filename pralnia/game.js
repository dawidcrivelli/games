'use strict';
// zwierzęta i helpery 3D: models/animals.js

let W=innerWidth,H=innerHeight;

/* ---------- renderer ---------- */
const canvas=$('c');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});

renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
let pixelRatio=Math.min(window.devicePixelRatio||1,2);
const scene=new T.Scene();scene.autoUpdate=false;
scene.fog=new T.Fog(0xc9eefb,70,190);
const camera=new T.PerspectiveCamera(42,1,.5,420);
const camT=new T.PerspectiveCamera(42,1,.5,420);

scene.background=canvasTex(8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#4fb7ec');gr.addColorStop(.55,'#a8e4fa');gr.addColorStop(1,'#e6f9ff');g.fillStyle=gr;g.fillRect(0,0,w,h);})||new T.Color(0x9fe3f5);

/* ---------- geometry & material helpers ---------- */

/* ---------- textures ---------- */
const texCroc=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#63b04d';g.fillRect(0,0,w,h);g.strokeStyle='#4a9340';g.lineWidth=2;for(let y=0;y<9;y++)for(let x=0;x<9;x++){g.beginPath();g.arc(x*16+(y%2?8:0),y*16,7,0,PI);g.stroke();}},{repeat:[4,2]});
const tileTex=(rx,ry)=>canvasTex(64,64,(g)=>{g.fillStyle='#ffffff';g.fillRect(0,0,64,64);g.fillStyle='#eef4f7';g.fillRect(3,3,58,58);g.strokeStyle='#c4d3dc';g.lineWidth=3;g.strokeRect(0,0,64,64);},{repeat:[rx,ry]});
const stripeTex=(n)=>canvasTex(64,64,(g)=>{g.fillStyle='#fff';g.fillRect(0,0,64,64);g.fillStyle='#b8b8b8';g.fillRect(0,0,32,64);},{repeat:[n,1]});
const emojiTex=(em,bg,em2)=>canvasTex(128,128,(g)=>{g.fillStyle=bg;g.beginPath();g.arc(64,64,62,0,7);g.fill();g.lineWidth=7;g.strokeStyle='#fff';g.stroke();g.textAlign='center';g.textBaseline='middle';g.font='70px serif';g.fillText(em,64,em2?58:70);if(em2){g.font='38px serif';g.fillText(em2,98,100);}});

/* ---------- lights ---------- */
scene.add(new T.HemisphereLight(0xffffff,0xb9d8a0,.62));
const sun=new T.DirectionalLight(0xfff3d6,.6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
const sc=sun.shadow.camera;sc.left=-24;sc.right=24;sc.top=24;sc.bottom=-24;sc.near=1;sc.far=120;sun.shadow.bias=-.0015;
scene.add(sun);scene.add(sun.target);

/* ---------- particles ---------- */
const dum=new T.Object3D();
class PS{constructor(mat,cap){this.im=new T.InstancedMesh(G.lo,mat,cap);this.im.frustumCulled=false;this.im.count=0;this.cap=cap;this.a=[];scene.add(this.im);}
  add(x,y,z,vx,vy,vz,s,life,g,e){if(this.a.length>=this.cap)return;this.a.push({x,y,z,vx,vy,vz,s,life,g:g||0,e,t:0});}
  up(dt){const a=this.a;let n=0;for(let i=0;i<a.length;i++){const p=a[i];p.t+=dt;if(p.t>=p.life)continue;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const k=p.t/p.life,sc=p.s*(k<.2?k/.2:1-(k-.2)/.8);
      dum.position.set(p.x,p.y,p.z);if(p.e)dum.scale.set(sc*p.e[0],sc*p.e[1],sc*p.e[2]);else dum.scale.set(sc,sc,sc);dum.updateMatrix();this.im.setMatrixAt(n,dum.matrix);a[n++]=p;}
    a.length=n;this.im.count=n;this.im.instanceMatrix.needsUpdate=true;}}
const P={
  foam:new PS(new T.MeshStandardMaterial({color:0xffffff,roughness:.35}),140),
  water:new PS(new T.MeshStandardMaterial({color:0x5cc6ff,roughness:.1,transparent:true,opacity:.8}),140),
  spark:new PS(new T.MeshStandardMaterial({color:0xffe066,emissive:0xffb300,emissiveIntensity:1}),110),
  wind:new PS(new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55}),120),
  puff:new PS(new T.MeshStandardMaterial({color:0xff9ad5,transparent:true,opacity:.6,roughness:.9}),70),
  bubble:new PS(new T.MeshStandardMaterial({color:0xe8fbff,transparent:true,opacity:.42,roughness:.05,metalness:.2}),60)
};
function burst(kind,p,n,sp,s,life,g){for(let i=0;i<n;i++)P[kind].add(p.x+rnd(-.1,.1),p.y+rnd(-.1,.1),p.z+rnd(0,.2),rnd(-sp,sp),rnd(-sp*.3,sp),rnd(-sp*.3,sp),rnd(s*.6,s*1.2),rnd(life*.6,life),g);}

/* ---------- audio ---------- */
let master=null,muted=false;const loops={};   // AC, nbuf, sfx, mus: lib/audio/music.js
function initAudio(){if(AC)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();}catch(e){AC=null;return;}
  master=AC.createGain();master.gain.value=muted?0:1;master.connect(AC.destination);
  sfx=AC.createGain();sfx.gain.value=.9;sfx.connect(master);mus=AC.createGain();mus.gain.value=.15;mus.connect(master);
  nbuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  loops.scrub=nloop('bandpass',2600,1.4);loops.dry=nloop('lowpass',1200,.5);loops.mach=nloop('lowpass',450,.7);
  const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=58;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=240;o.connect(f);f.connect(loops.mach.g);o.start();
  startMusic();}

function setLoop(n,v){const l=loops[n];if(l&&AC)l.g.gain.setTargetAtTime(v,AC.currentTime,.07);}

const snd={
  pop(){tone(rnd(500,900),.09,'sine',.16,1500);},
  squeak(){tone(rnd(900,1300),.07,'triangle',.05,rnd(1500,1900));},
  coin(){tone(988,.09,'square',.07);tone(1319,.3,'square',.07,0,.08);},
  done(){[523,659,784,1047].forEach((f,i)=>tone(f,.24,'triangle',.15,0,i*.07));},
  buy(){[392,523,659,784,1047].forEach((f,i)=>tone(f,.26,'square',.06,0,i*.09));nz(.5,.06,3000,'highpass',8000,.3);},
  no(){tone(180,.18,'sawtooth',.07,120);},
  tap(){tone(660,.06,'sine',.1,880);},
  star(){tone(pick([1319,1568,1760,2093]),.3,'sine',.09);},
  alert(){tone(880,.1,'sine',.07);tone(1175,.15,'sine',.07,0,.1);},
  voice(type,v){v=v||1;
    if(type==='elephant')sw('sawtooth',[[0,320],[.25,640],[.6,560],[1,380]],.8,.11*v,2200,30);
    else if(type==='lion')roar(v);
    else if(type==='hippo'){sw('square',[[0,85],[1,60]],.25,.15*v,400);sw('square',[[0,80],[1,55]],.3,.15*v,400,0,.3);}
    else if(type==='zebra')sw('square',[[0,1000],[.2,1300],[1,600]],.5,.045*v,2600,14);
    else if(type==='giraffe'){tone(294,.2,'sine',.12*v);tone(370,.3,'sine',.12*v,0,.2);}
    else if(type==='tiger')roar(v*.85);
    else if(type==='panda')sw('sine',[[0,500],[.5,720],[1,450]],.35,.12*v,2000);
    else if(type==='penguin'){sw('square',[[0,430],[1,380]],.16,.06*v,1500);sw('square',[[0,460],[1,390]],.2,.06*v,1500,0,.2);}
    else if(type==='kangaroo'){tone(95,.12,'sine',.25*v,60);tone(95,.12,'sine',.25*v,60,.22);nz(.05,.08*v,2500,'highpass',0,.1);}
    else{nz(.4,.1*v,3500,'highpass');tone(140,.05,'square',.14*v);tone(140,.05,'square',.14*v,0,.12);}}
};

function startMusic(){const step=60/116/2;let nt=AC.currentTime+.1,i=0;
  const A=[4,7,12,7,4,7,12,-1,5,9,12,9,5,9,12,-1,7,11,14,11,7,11,14,-1,12,7,4,7,0,-1,0,-1];
  const B=[12,-1,7,9,12,-1,16,-1,17,-1,12,14,17,-1,12,-1,14,11,7,11,14,-1,19,-1,16,14,12,7,12,-1,-1,-1];
  const ROOT=[0,5,7,0];
  setInterval(()=>{if(!AC||AC.state!=='running')return;if(nt<AC.currentTime)nt=AC.currentTime+.05;
    while(nt<AC.currentTime+.4){const s=i%32,bar=(i>>3)%4,m=((i>>5)%2?B:A)[s];
      if(m>=0)mnote(nt,523.25*Math.pow(2,m/12),step*.9,'triangle',.5);
      const b=s%8;if(b===0||b===4)mnote(nt,130.81*Math.pow(2,ROOT[bar]/12),step*1.6,'sine',.9);if(b===2||b===6)mnote(nt,196*Math.pow(2,ROOT[bar]/12),step*.8,'sine',.4);
      i++;nt+=step;}},120);}

/* ---------- animals ---------- */

const TYPES=Object.keys(MK),VAL={elephant:6,giraffe:6,hippo:5,zebra:4,lion:4,crocodile:4,tiger:5,panda:5,penguin:3,kangaroo:5},NSP={elephant:10,giraffe:9,hippo:9,zebra:8,lion:8,crocodile:7,tiger:8,panda:8,penguin:6,kangaroo:8};

/* ---------- spots (flat dirt, drops, stars) ---------- */

const blob=(cx,cy,r,w)=>{const sh=new T.Shape(),n=9,pts=[];for(let i=0;i<n;i++){const an=i/n*6.283,rr=r*(1+rnd(-w,w));pts.push(new T.Vector2(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr));}sh.moveTo(pts[0].x,pts[0].y);sh.splineThru(pts.slice(1).concat([pts[0]]));return sh;};
const mudG=[0,1,2].map(()=>{const sh=[blob(0,0,1,.35)];for(let i=0;i<4;i++){const an=rnd(6.28),d=rnd(1.25,1.6);sh.push(blob(Math.cos(an)*d,Math.sin(an)*d,rnd(.12,.26),.2));}const g=new T.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.1,bevelSize:.1,bevelSegments:2,curveSegments:6});g.translate(0,0,.1);return g;});
const mudM=[0x6b4423,0x7d5230,0x59391c].map(c=>new T.MeshStandardMaterial({color:c,roughness:.5,side:T.DoubleSide}));
const leafG=(()=>{const sh=new T.Shape();sh.moveTo(-1,0);sh.quadraticCurveTo(-.1,.78,1,0);sh.quadraticCurveTo(-.1,-.78,-1,0);const lf=new T.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:1,curveSegments:8});lf.translate(0,0,.05);const ps=[{g:lf,c:0x63c24c},{g:G.box,p:[0,0,.2],s:[1.9,.09,.08],c:0x2f7a2c},{g:G.box,p:[-1.2,0,.1],s:[.45,.1,.14],c:0x2f7a2c}];
  for(const x of [-.35,.2])for(const s of [1,-1])ps.push({g:G.box,p:[x+.15,s*.17,.2],s:[.45,.05,.06],r:[0,0,s*.8],c:0x2f7a2c});return mergeC(ps);})();
const leafM=[0xffffff,0xfff07a,0xffa25a].map(c=>new T.MeshStandardMaterial({color:c,vertexColors:true,roughness:.7,side:T.DoubleSide}));
const twigG=merge([{g:G.box,p:[0,0,.09],s:[1.9,.17,.17]},{g:G.box,p:[.4,.27,.09],s:[.8,.13,.14],r:[0,0,.7]},{g:G.box,p:[-.3,-.2,.09],s:[.6,.12,.13],r:[0,0,-2.5]},{g:G.box,p:[.95,0,.09],s:[.2,.2,.16],r:[0,0,.78]}]);
const twigM=M(0x7a5230,{roughness:.9});
const dropM=new T.MeshStandardMaterial({color:0x5cc6ff,roughness:.05,transparent:true,opacity:.85});
const starShape=new T.Shape();for(let i=0;i<10;i++){const r=i%2?.45:1,an=i/10*6.283+PI/2,x=Math.cos(an)*r,y=Math.sin(an)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}starShape.closePath();
const starG=new T.ExtrudeGeometry(starShape,{depth:.3,bevelEnabled:false});starG.translate(0,0,-.15);
const starGrey=M(0xb9c2cc,{roughness:.5}),starGold=new T.MeshStandardMaterial({color:0xffd23f,emissive:0xffa000,emissiveIntensity:.7,metalness:.5,roughness:.3});
const ray=new T.Raycaster(),rO=V(),rD=V(0,0,-1),nq=new T.Quaternion(),nm3=new T.Matrix3(),nv=V(),ZAX=V(0,0,1);
function setSpotScale(s,mul){const k=s.base*(.45+.55*s.hp)*(mul||1);if(s.k==='drop')s.m.scale.set(k,k*1.35,k*.6);else s.m.scale.set(k,k,s.k==='star'?k*.5:k*.7);}
function addSpots(a,kind,n){a.root.updateMatrixWorld(true);const pts=[];let tries=0;const rs=a.root.scale.x,minD=kind==='drop'?.3:.55;
  while(a.spots.length<n&&tries++<n*16){rO.set(a.root.position.x+rnd(a.dims.x0,a.dims.x1),a.root.position.y+rnd(.25,a.dims.h),14);ray.set(rO,rD);const hit=ray.intersectObjects(a.hit,false)[0];if(!hit||!hit.face)continue;
    nv.copy(hit.face.normal).applyMatrix3(nm3.getNormalMatrix(hit.object.matrixWorld)).normalize();if(nv.z<.3)continue;
    if(pts.some(p=>p.distanceTo(hit.point)<minD))continue;pts.push(hit.point.clone());const par=hit.object.parent,lp=par.worldToLocal(hit.point.clone().addScaledVector(nv,.035));par.getWorldQuaternion(nq).invert();nv.applyQuaternion(nq);
    let m,bs;if(kind==='mud'){const r=Math.random();if(r<.5){m=new T.Mesh(pick(mudG),pick(mudM));bs=rnd(.24,.31);}else if(r<.82){m=new T.Mesh(leafG,pick(leafM));bs=rnd(.27,.34);}else{m=new T.Mesh(twigG,twigM);bs=rnd(.3,.38);}}
    else if(kind==='drop'){m=new T.Mesh(G.lo,dropM);bs=rnd(.11,.16);}else{m=new T.Mesh(starG,starGrey);bs=.2;}
    m.userData.nd=1;m.position.copy(lp);if(kind!=='drop'){m.quaternion.setFromUnitVectors(ZAX,nv);m.rotateZ(kind==='star'?rnd(-.4,.4):rnd(6.28));}par.add(m);const s={m,hp:1,k:kind,base:bs/rs*clamp(a.dims.h/2.8,.65,1),wx:hit.point.x};setSpotScale(s);a.spots.push(s);}
  a.spots.sort((p,q)=>p.wx-q.wx);a.nSpots=a.spots.length;}
const tv=V();
function damage(a,s,amt){if(s.hp<=0)return;s.hp-=amt;a.tickle=1;
  if(s.hp<=0){s.hp=0;s.m.getWorldPosition(tv);
    if(s.k==='star'){s.m.material=starGold;s.m.scale.multiplyScalar(1.25);snd.star();burst('spark',tv,6,2.2,.1,.6,-2);}
    else{if(s.m.parent)s.m.parent.remove(s.m);snd.pop();if(s.k==='mud')burst('foam',tv,7,1.6,.16,.8,-1.5);else burst('water',tv,4,1.6,.08,.4,-6);}}
  else setSpotScale(s);}
function clearSpots(a){for(const s of a.spots)if(s.m.parent)s.m.parent.remove(s.m);a.spots=[];}

/* ---------- world ---------- */
const SX=[0,20,40],QX0=-8,QGAP=5.6;
let cashX=9,cash=null,belt=null,beltTex=null;
const stations=SX.map((x,i)=>({i,x,owned:i===0,auto:0,animal:null,g:null,t:0,lot:null,wait:[]}));
const animals=[],queue=[];
const sway=[],clouds=[];

function buildWorld(){
  const gt=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#7fd15c';g.fillRect(0,0,w,h);for(let i=0;i<260;i++){g.fillStyle=pick(['#6fc24f','#8bdc66','#74c955','#95e070']);g.fillRect(rnd(w),rnd(h),rnd(2,5),rnd(4,9));}},{repeat:[50,50]});
  const gr=new T.Mesh(new T.PlaneGeometry(420,420),MT(gt,0x7fd15c,{roughness:1}));gr.rotation.x=-PI/2;gr.receiveShadow=true;scene.add(gr);
  const pt=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#f0d9a8';g.fillRect(0,0,w,h);for(let i=0;i<26;i++){g.fillStyle=pick(['#e6cb92','#f7e6bf','#e0c184']);g.beginPath();g.ellipse(rnd(w),rnd(h),rnd(6,13),rnd(5,9),rnd(3),0,7);g.fill();}},{repeat:[32,1]});
  const pa=box(MT(pt,0xf0d9a8,{roughness:.95}),scene,12,.05,0,134,.1,4.6);pa.castShadow=false;pa.receiveShadow=true;
  for(const z of [-2.4,2.4]){const e=box(M(0xd7b98a),scene,12,.09,z,134,.18,.25);e.castShadow=false;}
  // fence
  const fp=[];for(let x=-52;x<=80;x+=2.6)fp.push({g:G.box,p:[x,.7,-9.5],s:[.2,1.4,.2]});mesh(merge(fp),M(0xfff3d6),scene);for(const y of [.5,1.05])box(M(0xfff3d6),scene,14,y,-9.5,134,.12,.1);
  // hills, trees
  for(const [x,sx] of [[-70,44],[-10,56],[45,40],[95,50]]){const hl=ball(M(0x8bd66a,{roughness:1}),scene,x,-9,-85,sx,24,26);hl.castShadow=false;}
  [[-26,-13,1.2],[-17,-16,1.5],[-6,-12.5,1.1],[5.5,-15,1.6],[16.5,-12.5,1.2],[28,-15,1.5],[37,-12,1.1],[-36,-18,1.7],[46,-17,1.6],[-46,-12,1.3],[56,-13,1.3],[66,-16,1.6],[74,-12,1.2]].forEach(t=>tree(t[0],t[1],t[2]));
  [[-11.5,-11.5,1.3],[11,-11.5,1.5],[22.5,-12,1.25],[33,-11.5,1.4],[-22,-11,1.2],[51,-11.5,1.3],[61,-11.5,1.4]].forEach(t=>palm(t[0],t[1],t[2]));
  for(let i=0;i<15;i++){const bx=-44+i*8+rnd(-2,2);ball(M(pick([0x55c26f,0x4caf50,0x7ccf5a])),scene,bx,.5,-8.6+rnd(-.3,.3),rnd(.8,1.3),rnd(.6,.9),rnd(.7,1));}
  // clouds
  const cm=new T.MeshBasicMaterial({color:0xffffff,fog:false});for(let i=0;i<7;i++){const c=grp(scene,-90+i*30+rnd(-8,8),rnd(30,46),rnd(-110,-70));for(let k=0;k<5;k++){const b=new T.Mesh(G.lo,cm);b.position.set(k*3.2-6,rnd(-.6,.6),rnd(-1,1));b.scale.set(rnd(3,4.6),rnd(2,2.8),rnd(2,3));c.add(b);}clouds.push(c);}
  // flowers
  const fl=new T.InstancedMesh(G.lo,new T.MeshStandardMaterial({roughness:.6}),190),col=new T.Color();for(let i=0;i<190;i++){const z=Math.random()<.55?rnd(3.4,12):rnd(-9,-4.6);dum.position.set(rnd(-48,76),.16,z);dum.scale.set(.16,.12,.16);dum.updateMatrix();fl.setMatrixAt(i,dum.matrix);col.set(pick([0xff5c9a,0xffd23f,0xffffff,0x9b6bff,0xff8f1c]));fl.setColorAt(i,col);}scene.add(fl);
  // entrance arch
  const ar=grp(scene,-33,0,0),am=M(0xff7eb6);for(const z of [-3.2,3.2]){mesh(cg(.35,.4,6,12),am,ar,0,3,z);ball(M(0xffd23f),ar,0,6.2,z,.5);}
  box(M(0x35b6e8),ar,0,6.3,0,.5,1.5,6.6);
  const st=canvasTex(512,128,(g)=>{g.fillStyle='#fdfcf7';g.fillRect(0,0,512,128);g.fillStyle='#173a5e';g.font='bold 62px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('🫧 PRALNIA ZOO 🫧',256,68);});
  for(const s of [1,-1]){const sg=mesh(new T.PlaneGeometry(6,1.15),new T.MeshBasicMaterial({map:st,color:st?0xffffff:0xfdfcf7}),ar,s*.27,6.3,0);sg.rotation.y=s*PI/2;sg.castShadow=false;}
  [[0xff5c5c,-3.2,7.6],[0xffd23f,-2.6,8.3],[0x35c2a1,3.2,7.7],[0x9b6bff,2.7,8.4]].forEach(q=>{const b=ball(M(q[0],{roughness:.25}),ar,0,q[2],q[1],.45,.55,.45);sway.push({o:b,ax:'p',b:q[2]});});
  // clothesline with silly laundry
  const cl=grp(scene,0,0,-6.4),pm=M(0x8d6e63);for(const x of [-5,49])mesh(cg(.12,.14,5.2,8),pm,cl,x,2.6,0);const ln=mesh(cg(.025,.025,54,5),M(0xffffff),cl,22,5,0);ln.rotation.z=PI/2;
  const item=(x,build)=>{const g=grp(cl,x,5,0);build(g);sway.push({o:g,ax:'x'});};
  item(6,g=>{const w=M(0xffffff),r=M(0xff5c9a);box(w,g,0,-.5,0,1.7,.6,.06);box(w,g,-.55,-1.1,0,.6,.7,.06);box(w,g,.55,-1.1,0,.6,.7,.06);for(const p of [[-.5,-.5],[0,-.45],[.5,-.5],[-.55,-1.1],[.55,-1.1]])ball(r,g,p[0],p[1],.04,.12,.12,.03);});
  item(9,g=>{const c=MT(stripeTex(1),0xff8f1c,{color:0xff8f1c});c.map&&(c.map.rotation=PI/2);box(c,g,0,-.75,0,.42,1.4,.08);box(c,g,.25,-1.35,0,.8,.38,.08);});
  item(10.2,g=>{const c=M(0x35c2a1);box(c,g,0,-.75,0,.42,1.4,.08);box(c,g,.25,-1.35,0,.8,.38,.08);});
  item(13,g=>{box(M(0xffd23f),g,0,-.9,0,1.5,1.7,.06);box(M(0xff8f1c),g,0,-.4,.01,1.5,.2,.06);box(M(0xff8f1c),g,0,-1.4,.01,1.5,.2,.06);});
  item(28,g=>{const c=M(0x9b6bff);box(c,g,0,-.85,0,1.2,1.5,.06);box(c,g,-.8,-.4,0,.6,.5,.06);box(c,g,.8,-.4,0,.6,.5,.06);ball(M(0xffd23f),g,0,-.8,.04,.3,.3,.03);});
  item(32.5,g=>{box(M(0x5cc6ff),g,0,-1.2,0,2.4,2.2,.06);for(let i=0;i<4;i++)ball(M(0xffffff),g,-.8+i*.55,-.7-(i%2)*.8,.04,.2,.2,.03);});
  duck(scene,-4.5,.1,3.6,1.1);duck(scene,15.5,.1,4.2,.9).rotation.y=2;
  for(const [x,c] of [[5.2,0xff5c5c],[16.6,0x35b6e8]]){mesh(cg(.42,.32,.62,14),M(c),scene,x,.41,3.3);const hn=mesh(new T.TorusGeometry(.36,.03,6,16,PI),M(0xcfd8dc,{metalness:.7,roughness:.3}),scene,x,.7,3.3);}
}
function fan(par,x,y,z,r,rx){const g=grp(par,x,y,z);g.rotation.x=rx||0;mesh(new T.TorusGeometry(r,.13,8,28),M(0x37474f,{metalness:.5,roughness:.4}),g);const bk=mesh(cg(r,r,.1,24),M(0x263238),g,0,0,-.22);bk.rotation.x=PI/2;
  const ht=mesh(new T.TorusGeometry(r*.6,.05,6,24),new T.MeshStandardMaterial({color:0xff7043,emissive:0xff3d00,emissiveIntensity:.9}),g,0,0,-.12);ht.castShadow=false;
  const bl=grp(g);for(let i=0;i<4;i++){const b=box(M(0xeceff1,{metalness:.3,roughness:.4}),bl,0,0,0,r*1.8,.3,.05);b.rotation.z=i*PI/4;}ball(M(0xffd23f),bl,0,0,.05,.16);return bl;}
function buildStation(st){const i=st.i,g=st.g=grp(scene,st.x,0,0),col=[0x35b6e8,0xff9f43,0xe667af][i],light=[0xd9f3ff,0xffecd1,0xffdff0][i],cm=M(col);
  const pl=mesh(cg(3.7,3.8,.14,44),MT(tileTex(8,8),light,{color:light,roughness:.4}),g,0,.05,0);pl.receiveShadow=true;pl.castShadow=false;
  const rim=mesh(new T.TorusGeometry(3.72,.1,8,48),cm,g,0,.1,0);rim.rotation.x=PI/2;mesh(cg(.4,.4,.02,16),M(0x37474f,{metalness:.6,roughness:.4}),g,0,.125,0).castShadow=false;
  box(MT(tileTex(10,3.5),light,{color:light,roughness:.4}),g,0,1.3,-3.7,7.6,2.6,.3).receiveShadow=true;box(cm,g,0,2.68,-3.7,7.9,.2,.5);for(const s of [-1,1])box(cm,g,s*3.85,1.4,-3.7,.35,2.8,.5);
  const tx=emojiTex(['🧽','💨','✨'][i],'#'+col.toString(16).padStart(6,'0'));mesh(cg(.07,.07,.6,8),M(0x8d6e63),g,0,3.05,-3.7);
  const sg=mesh(new T.CircleGeometry(.9,32),new T.MeshBasicMaterial({map:tx,color:tx?0xffffff:col}),g,0,4.1,-3.6);sg.castShadow=false;mesh(cg(.95,.95,.12,32),M(0xffffff),g,0,4.1,-3.68).rotation.x=PI/2;
  const mt=M(0xcfd8dc,{metalness:.8,roughness:.25});
  if(i>0){for(const wx of [-6.4,-11.6]){const wm=mesh(cg(2.3,2.3,.03,32),M(light),g,wx,.115,0);wm.castShadow=false;wm.receiveShadow=true;const wr=mesh(new T.TorusGeometry(2.3,.06,6,40),cm,g,wx,.12,0);wr.rotation.x=PI/2;wr.castShadow=false;}
    mesh(cg(.07,.07,2.6,8),M(0x8d6e63),g,-9,1.3,-2.9);const wt=emojiTex('⏳','#fdfcf7');mesh(new T.CircleGeometry(.7,28),new T.MeshBasicMaterial({map:wt,color:wt?0xffffff:0xffd23f}),g,-9,2.9,-2.85).castShadow=false;box(M(0xb07a4a),g,-9,.55,-3.1,3,.14,.6);for(const bx of [-10.3,-7.7])box(M(0x8d6e63),g,bx,.28,-3.1,.14,.5,.5);}
  if(i===0){box(M(0x8d6e63),g,-1.9,1.9,-3.4,2.3,.1,.5);[[0xff5c8a,-2.7],[0x7ed957,-2.2],[0xffd23f,-1.7],[0x9b6bff,-1.2]].forEach(q=>{mesh(cg(.16,.18,.5,12),M(q[0],{roughness:.3}),g,q[1],2.2,-3.4);mesh(cg(.07,.07,.16,8),M(0xffffff),g,q[1],2.53,-3.4);});
    duck(g,2,2.78,-3.6,.9);mesh(cg(.08,.08,5.6,10),mt,g,-2.2,2.8,-3.1);const arm=mesh(cg(.07,.07,2.2,10),mt,g,-2.2,5.6,-2.05);arm.rotation.x=PI/2;mesh(G.cone,mt,g,-2.2,5.4,-1,.5,.4,.5);st.shower=V(st.x-2.2,5.2,-1);
    mesh(cg(.95,.8,.9,18),M(0xb07a4a),g,2.8,.55,-2.5);for(const y of [.35,.8]){const t=mesh(new T.TorusGeometry(.9,.04,6,24),M(0x5d4037),g,2.8,y,-2.5);t.rotation.x=PI/2;}
    const fg=merge([...Array(9)].map(()=>({g:G.lo,p:[rnd(-.55,.55),rnd(0,.3),rnd(-.55,.55)],s:rnd(.22,.4)})));mesh(fg,M(0xffffff,{roughness:.3}),g,2.8,1.02,-2.5);
    box(M(0xffd23f),g,3.3,.3,-1.3,.7,.4,.5);box(M(0xff8f1c),g,3.25,.62,-1.3,.6,.25,.45);}
  if(i===1){for(const x of [1.7,3.5])mesh(cg(.06,.06,2.2,8),mt,g,x,1.1,-2.6);const bar=mesh(cg(.05,.05,2,8),mt,g,2.6,2.2,-2.6);bar.rotation.z=PI/2;[[0xff5c8a,2.05],[0x5fd3e6,2.6],[0xffd23f,3.15]].forEach(q=>{box(M(q[0]),g,q[1],1.6,-2.6,.46,1.2,.12);});
    mesh(cg(.5,.6,.2,16),M(0x455a64),g,-2.9,.2,-2.5);mesh(cg(.08,.08,3,8),mt,g,-2.9,1.7,-2.5);const dr=grp(g,-2.9,3.3,-2.5);dr.rotation.y=.9;const bd=mesh(cg(.42,.42,1,16),M(0xff7eb6,{roughness:.35}),dr,0,0,0);bd.rotation.x=PI/2;const nzl=mesh(cg(.3,.4,.5,16),M(0x455a64),dr,0,0,.7);nzl.rotation.x=PI/2;
    const lm=new T.MeshStandardMaterial({color:0xffb74d,emissive:0xff6d00,emissiveIntensity:.8});for(const x of [-2.2,0,2.2])box(lm,g,x,2.15,-3.5,1.3,.22,.1);}
  if(i===2){const cp=mesh(cg(2.9,2.9,.03,40),M(0xd32f4f),g,0,.135,0);cp.castShadow=false;cp.receiveShadow=true;box(M(0xffc93c,{metalness:.6,roughness:.3}),g,0,1.45,-3.5,2.7,2,.12);box(M(0xcdeeff,{metalness:.9,roughness:.08}),g,0,1.45,-3.47,2.35,1.65,.1);
    const bs=[];for(let k=0;k<14;k++){const an=k/14*6.283;bs.push({g:G.lo,p:[Math.cos(an)*1.5,1.45+Math.sin(an)*1.1,-3.38],s:.1});}mesh(merge(bs),new T.MeshStandardMaterial({color:0xfff8d6,emissive:0xffe082,emissiveIntensity:1}),g).castShadow=false;
    mesh(cg(.6,.5,.95,16),M(0xffffff),g,2.9,.5,-2.4);[[0xff5c9a,2.7],[0x9b6bff,3.15]].forEach(q=>{ball(M(q[0],{roughness:.15}),g,q[1],1.17,-2.4,.2);mesh(cg(.05,.05,.2,8),M(0xffc93c,{metalness:.7,roughness:.3}),g,q[1],1.42,-2.4);});
    mesh(cg(.35,.28,.6,12),M(0x35b6e8),g,-3,.4,-2.4);mesh(cg(.04,.04,1.3,6),M(0x43a047),g,-3,1.3,-2.4);for(let k=0;k<6;k++){const an=k/6*6.283;ball(M(0xffd23f),g,-3+Math.cos(an)*.24,2+Math.sin(an)*.24,-2.4,.16,.16,.06);}ball(M(0xff8f1c),g,-3,2,-2.38,.15,.15,.08);}
}
function buildLot(st){const g=st.lot=grp(scene,st.x,0,0);mesh(cg(.08,.08,2.4,8),M(0x8d6e63),g,0,1.2,-2.4);box(M(0xfff3d6),g,0,2.6,-2.4,1.9,1.6,.12);
  const tx=emojiTex(['🧽','💨','✨'][st.i],'#fff3d6','🔒');const sg=mesh(new T.PlaneGeometry(1.5,1.5),new T.MeshBasicMaterial({map:tx,color:tx?0xffffff:0xffd23f,transparent:true}),g,0,2.6,-2.33);sg.castShadow=false;
  for(const [x,z] of [[-2.2,2.6],[2.2,2.6],[-2.2,-2.8],[2.2,-2.8]]){mesh(G.cone,M(0xff7043),g,x,.45,z,.25,.7,.25);mesh(cg(.32,.32,.06,12),M(0xff7043),g,x,.13,z);ball(M(0xffffff),g,x,.5,z,.18,.06,.18);}}
function brushMesh(par,r,h,c1,c2){const g=grp(par);mesh(cg(r*.55,r*.55,h,12),M(c1),g);for(let i=0;i<6;i++){const f=box(M(i%2?c1:c2,{roughness:.9}),g,0,0,0,r*2,h*.96,.1);f.rotation.y=i*PI/6;}return g;}
function buildAutoWash(st){const m=grp(st.g),bl=M(0x2979ff,{roughness:.4}),ye=M(0xffd23f);for(const z of [-3.05,3.05]){const r=box(M(0x78909c,{metalness:.6,roughness:.4}),m,0,.14,z,9.5,.1,.14);r.castShadow=false;}
  const gan=st.gan=grp(m,-4.2,0,0);for(const s of [1,-1]){box(bl,gan,0,3.6,s*3.05,.6,7.2,.5);box(ye,gan,0,.35,s*3.05,1.3,.5,.7);}box(bl,gan,0,7.3,0,.8,.55,6.7);
  st.lamp=new T.MeshStandardMaterial({color:0xff5252,emissive:0xff1744,emissiveIntensity:1});for(const z of [-2.2,0,2.2])ball(st.lamp,gan,.42,7.3,z,.14);
  st.br=[];for(const s of [1,-1]){const b=grp(gan,0,0,s*2.3);brushMesh(b,.5,5.4,0x35b6e8,0xff5c9a).position.y=2.9;box(M(0x455a64),b,0,5.8,s*.3,.25,.25,1.2);st.br.push(b);}
  st.tb=grp(gan,0,6.4,0);st.tbs=grp(st.tb);const tm=brushMesh(st.tbs,.45,3.4,0xffd23f,0x35c2a1);tm.rotation.x=PI/2;
  box(M(0x455a64),m,-3.9,.9,-3.2,.8,1.8,.5);for(let k=0;k<3;k++)ball(M([0x4cd964,0xffd23f,0xff5252][k],{emissive:[0x1b8f2f,0x9c7a00,0x9c1c1c][k]}),m,-3.9,1.4-k*.3,-2.92,.09);}
function buildAutoDry(st){const m=grp(st.g),or=M(0xff9f43,{roughness:.4});for(const s of [1,-1])box(or,m,0,3.7,s*3.15,.7,7.4,.5);box(or,m,0,7.5,0,.9,.6,6.8);box(M(0x455a64),m,0,3,-3.35,5.6,5.2,.25);
  st.fans=[fan(m,-1.45,1.9,-3.05,1.15),fan(m,1.45,1.9,-3.05,1.15),fan(m,0,4.2,-3.05,1.25),fan(m,0,7.1,0,1.3,PI/2)];
  st.lamp=new T.MeshStandardMaterial({color:0xffd23f,emissive:0xff9100,emissiveIntensity:1});ball(st.lamp,m,0,8,3.15,.22);ball(st.lamp,m,0,8,-3.15,.22);}
function buildAutoGlam(st){const m=grp(st.g),me=M(0xb0bec5,{metalness:.8,roughness:.25}),pk=M(0xe667af,{roughness:.4});st.arms=[];
  for(const s of [-1,1]){const bx=s*2.9;mesh(cg(.6,.7,.5,16),pk,m,bx,.35,-1.9);const tur=grp(m,bx,.6,-1.9);mesh(cg(.35,.4,.4,14),me,tur,0,.2,0);const sh=grp(tur,0,.5,0);ball(pk,sh,0,0,0,.3);mesh(cg(.14,.17,2.3,10),me,sh,0,1.15,0);
    const el=grp(sh,0,2.3,0);ball(pk,el,0,0,0,.24);mesh(cg(.1,.13,2,10),me,el,0,1,0);const tool=grp(el,0,2,0);let spin=null;
    if(s<0){spin=grp(tool);mesh(cg(.5,.5,.22,18),M(0xff9ad5,{roughness:1}),spin,0,.12,0);for(let k=0;k<8;k++){const an=k/8*6.283;ball(M(0xffc4e6,{roughness:1}),spin,Math.cos(an)*.42,.14,Math.sin(an)*.42,.14);}}
    else{ball(M(0x9b6bff,{roughness:.15}),tool,0,.2,0,.3);mesh(cg(.07,.07,.25,8),M(0xffc93c,{metalness:.7,roughness:.3}),tool,0,.55,0);ball(M(0xffc93c,{metalness:.7,roughness:.3}),tool,0,.72,0,.1);}
    st.arms.push({s,tur,sh,el,tool,spin});}
  st.lamp=new T.MeshStandardMaterial({color:0xff7eb6,emissive:0xff2d95,emissiveIntensity:1});for(const s of [-1,1])ball(st.lamp,m,s*2.9,.72,-1.4,.1);}
function buildBelt(){beltTex=canvasTex(64,64,g=>{g.fillStyle='#37474f';g.fillRect(0,0,64,64);g.strokeStyle='#ffd23f';g.lineWidth=8;g.lineCap='round';g.beginPath();g.moveTo(16,10);g.lineTo(40,32);g.lineTo(16,54);g.stroke();},{repeat:[67,1]});
  belt=grp(scene);const b=box(MT(beltTex,0x37474f,{roughness:.6}),belt,12,.13,0,134,.06,2.7);b.castShadow=false;b.receiveShadow=true;for(const z of [-1.45,1.45])box(M(0x90a4ae,{metalness:.7,roughness:.3}),belt,12,.16,z,134,.14,.16).castShadow=false;}
function buildCash(){const g=cash=grp(scene,cashX,0,-3.2),wd=M(0xb07a4a);box(M(0x35c2a1),g,0,.7,0,2.6,1.3,1.3);box(M(0xfff3d6),g,0,1.4,.1,2.9,.12,1.6);for(const x of [-1.3,1.3]){mesh(cg(.07,.07,2.3,8),wd,g,x,2.5,.75);mesh(cg(.07,.07,2.6,8),wd,g,x,2.65,-.6);}
  const at=stripeTex(6),aw=box(MT(at,0xff5c5c,{color:0xff5c5c}),g,0,3.85,.1,3.3,.12,2.2);aw.rotation.x=.22;
  box(M(0x455a64),g,.75,1.7,.2,.7,.45,.5);box(M(0x90a4ae),g,.75,2.02,.05,.5,.22,.1);
  cash.coin=mesh(cg(.5,.5,.1,24),M(0xffc93c,{metalness:.7,roughness:.25}),g,0,4.9,.2);cash.coin.rotation.x=PI/2;
  const p=cash.pen=grp(g,-.45,1.46,-.1),bk=M(0x23262f),wh=M(0xffffff);ball(bk,p,0,.6,0,.45,.62,.42);ball(wh,p,0,.52,.14,.34,.48,.32);ball(bk,p,0,1.3,0,.34);ball(wh,p,0,1.25,.17,.24,.21,.2);
  const bkk=mesh(G.cone,M(0xff9f1c),p,0,1.24,.4,.09,.26,.09);bkk.rotation.x=PI/2;for(const s of [1,-1]){ball(bk,p,s*.11,1.34,.33,.045);}
  cash.fl=[];for(const s of [1,-1]){const f=grp(p,s*.42,.92,0);ball(bk,f,0,-.3,0,.09,.34,.2);cash.fl.push({f,s});}const bw=M(0xe23b4e);for(const s of [1,-1]){const c=mesh(G.cone,bw,p,s*.12,1.0,.3,.08,.2,.05);c.rotation.z=s*PI/2;}cash.wave=0;}

/* ---------- save / state ---------- */
const KEY='pralniaZoo.v1';
const S={coins:0,served:0,lv:{dry:0,autoWash:0,glam:0,autoDry:0,autoGlam:0,ad:0,belt:0,t0:0,t1:0,t2:0}};
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d){S.coins=d.coins|0;S.served=d.served|0;for(const k in S.lv)if(d.lv&&d.lv[k])S.lv[k]=d.lv[k]|0;}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
const SHOP=[{id:'dry',a:'💨',b:'🖐️',p:[40]},{id:'autoWash',a:'🧽',b:'🤖',p:[100]},{id:'glam',a:'✨',b:'🖐️',p:[160],req:'dry'},{id:'autoDry',a:'💨',b:'🤖',p:[260],req:'dry'},{id:'autoGlam',a:'✨',b:'🤖',p:[400],req:'glam'},
  {id:'ad',a:'📣',b:'🐾',p:[120,300,650]},{id:'belt',a:'🛼',b:'⏩',p:[350]},{id:'t0',a:'🧽',b:'⚡',p:[200,450,900],req:'autoWash'},{id:'t1',a:'💨',b:'⚡',p:[250,500,1000],req:'autoDry'},{id:'t2',a:'✨',b:'⚡',p:[300,600,1200],req:'autoGlam'}];
const AUTO=['autoWash','autoDry','autoGlam'],ICON=['🧽','💨','✨'];
function applyOwn(){stations[1].owned=!!S.lv.dry;stations[2].owned=!!S.lv.glam;let lx=0;
  stations.forEach((st,i)=>{if(st.owned&&!st.g)buildStation(st);if(st.lot)st.lot.visible=!st.owned;if(st.owned&&S.lv[AUTO[i]]&&!st.hasM){st.hasM=1;st.auto=1;[buildAutoWash,buildAutoDry,buildAutoGlam][i](st);}if(st.owned)lx=st.x;});
  cashX=lx+9;if(S.lv.belt&&!belt)buildBelt();buildNav();}

/* ---------- game flow ---------- */
let time=0,spawnT=1.5,lastType='',running=false,view=0;const servedT=[];
const groundY=()=>belt?.16:.1;
function spawn(){let type;do{type=pick(TYPES);}while(type===lastType);lastType=type;const a=MK[type]();a.root.position.set(-46,groundY(),0);addSpots(a,'mud',NSP[type]+Math.min(3,S.served/15|0));
  const fg=a.flies=grp(a.root,a.cx/a.root.scale.x,(a.dims.h+.5)/a.root.scale.x,0);for(let i=0;i<3;i++){const f=ball(mK,fg,0,0,0,.05/a.root.scale.x);f.castShadow=false;}
  scene.add(a.root);animals.push(a);queue.push(a);a.state='queue';}
function finishStage(st,a){clearSpots(a);a.done++;a.state='done';a.jumpT=1;snd.done();if(view===st.i||view<0)snd.voice(a.type,.8);
  tv.set(st.x,a.dims.h*.6,a.dims.hw+.3);burst('spark',tv,14,3.5,.13,.9,-3);
  if(st.i===0){if(a.flies){a.root.remove(a.flies);a.flies=null;}a.wet=true;burst('foam',tv,12,3,.2,1,-2);if(stations[1].owned)addSpots(a,'drop',NSP[a.type]+2);}
  if(st.i===1){a.wet=false;burst('puff',tv,6,2,.3,.8,0);}
  if(st.i===2){a.hatM=mkHat(Math.random()*6|0);a.hat.add(a.hatM);a.hatPop=0;a.hatM.scale.setScalar(.01);}}
function pay(a){const c=Math.max(1,Math.ceil(VAL[a.type]*a.done*(.4+.6*a.patience)));S.coins+=c;S.served++;servedT.push(time);snd.coin();cash.wave=1;floater('+'+c+' 🪙',cashX,3.2,0);
  tv.set(cashX,4.9,-3);burst('spark',tv,8,2.5,.12,.7,-6);updCoins(true);save();}
function nextFor(a){for(let k=a.st+1;k<3;k++)if(stations[k].owned)return stations[k];return null;}
const SPAWN_I=[8.5,6.5,4.8,3.4],MAXQ=[3,4,4,5],AUTO_T=[6,4.6,3.4,2.4];
function flow(dt){
  spawnT-=dt;if(spawnT<=0&&queue.length<MAXQ[S.lv.ad]){spawn();spawnT=SPAWN_I[S.lv.ad]*rnd(.8,1.2);}
  for(let k=2;k>=0;k--){const st=stations[k],a=st.animal;
    if(st.owned&&!st.animal&&st.wait.length){const w=st.wait.shift();st.animal=w;w.st=st.i;w.state='go';w.tx=st.x;}
    if(a&&a.state==='done'&&a.jumpT<=.2){const n=nextFor(a);if(!n){st.animal=null;a.state='pay';a.tx=cashX;}else if(!n.animal&&!n.wait.length){st.animal=null;n.animal=a;a.st=n.i;a.state='go';a.tx=n.x;}else if(n.wait.length<2){st.animal=null;n.wait.push(a);a.state='wait';}else a.patience=Math.max(0,a.patience-dt/55);}
    st.wait.forEach((w,i)=>{w.tx=st.x-6.4-i*5.2;});}
  if(!stations[0].animal&&queue.length){const a=queue.shift();stations[0].animal=a;a.st=0;a.state='go';a.tx=0;}
  queue.forEach((a,i)=>{a.tx=QX0-i*QGAP;});
  const speed=belt?7:3.7,gy=groundY();
  for(let i=animals.length-1;i>=0;i--){const a=animals[i];a.root.position.y=gy;a.slide=!!belt;const dx=a.tx-a.cx-a.root.position.x;
    if(Math.abs(dx)>.02){a.root.position.x+=Math.sign(dx)*Math.min(Math.abs(dx),speed*dt);a.moving=true;}
    else{a.moving=false;
      if(a.state==='queue')a.patience=Math.max(0,a.patience-dt/55);
      else if(a.state==='wait')a.patience=Math.max(0,a.patience-dt/160);
      else if(a.state==='go'){const st=stations[a.st];a.state='work';st.t=0;{const kind=a.st===0?'mud':a.st===1?'drop':'star';if(!(a.spots.length&&a.spots[0].k===kind)){clearSpots(a);addSpots(a,kind,a.st===1?NSP[a.type]+2:a.st===2?6:NSP[a.type]);}}if(view===a.st)snd.voice(a.type,.6);if(!st.auto&&view!==a.st)snd.alert();}
      else if(a.state==='pay'){pay(a);a.state='leave';a.tx=cashX+17;}
      else if(a.state==='leave'){scene.remove(a.root);animals.splice(i,1);continue;}}
    anim(a,dt);}
  // stations
  let machOn=0,dryOn=0;
  for(const st of stations){if(!st.owned)continue;const a=st.animal,work=a&&a.state==='work';
    if(work){if(st.auto){st.t+=dt/AUTO_T[S.lv['t'+st.i]];const n=a.nSpots||1,idx=Math.floor(st.t/.85*n);for(let k=0;k<a.spots.length&&k<idx;k++)damage(a,a.spots[k],9);if(st.t>=1)finishStage(st,a);}
      else if(a.spots.every(s=>s.hp<=0))finishStage(st,a);}
    const run=!!(st.auto&&work);if(run&&(view===st.i||view<0)){if(st.i===1)dryOn=1;else machOn=1;}
    machine(st,a,run,dt);}
  setLoop('mach',machOn?.16:0);if(!manualDry)setLoop('dry',dryOn?.22:0);
}
const tri=u=>u<1?u:2-u;
function machine(st,a,run,dt){const len=a?a.dims.len:4,hw=a?a.dims.hw:1.6,hh=a?a.dims.h:5;
  if(st.lamp)st.lamp.emissiveIntensity=run?(Math.sin(time*14)>0?1.4:.2):.35;
  if(st.gan){const gx=run?lerp(-len/2-.4,len/2+.4,tri(clamp(st.t,0,1)*2)):-4.2;st.gan.position.x+=(gx-st.gan.position.x)*Math.min(1,dt*(run?7:2));
    st.br.forEach((b,i)=>{const s=i?-1:1,bz=run?hw+.5:2.3;b.position.z+=(s*bz-b.position.z)*Math.min(1,dt*4);b.children[0].rotation.y+=dt*(run?15:1.2)*s;});
    const ty=run?Math.min(6.4,hh+.45):6.4;st.tb.position.y+=(ty-st.tb.position.y)*Math.min(1,dt*4);st.tbs.rotation.z+=dt*(run?15:1.2);
    if(run){a.tickle=Math.max(a.tickle,.5);const wx=st.x+st.gan.position.x;for(let k=0;k<2;k++)P.water.add(wx+rnd(-.3,.3),7,rnd(-hw,hw),rnd(-.5,.5),-7,0,.09,.8,-6,[1,2.2,1]);
      if(Math.random()<dt*40)P.foam.add(wx+rnd(-.5,.5),rnd(.4,hh),(Math.random()<.5?1:-1)*(hw+.2),rnd(-1,1),rnd(.5,2),rnd(-.6,.6),rnd(.12,.24),rnd(.5,1),-1.5);}}
  if(st.fans){st.fans.forEach((f,i)=>{f.rotation.z+=dt*(run?26:1.5)*(i%2?1:-1);});
    if(run){a.blowT=.25;for(let k=0;k<2;k++){if(Math.random()<.6)P.wind.add(st.x+rnd(-2.3,2.3),rnd(.6,5),-2.7,0,0,rnd(7,10),.05,.6,0,[1,1,9]);else P.wind.add(st.x+rnd(-1.2,1.2),6.6,rnd(-1,1),0,-rnd(7,10),0,.05,.6,0,[1,9,1]);}
      if(Math.random()<dt*10)P.water.add(st.x+rnd(-len/2,len/2),rnd(.5,hh),hw,0,1,rnd(3,6),.07,.5,-4);}}
  if(st.arms){for(const ar of st.arms){const s=ar.s,tt=time*(run?1:.4)+(s>0?1.7:0),k=Math.min(1,dt*5);
      const ty=run?s*(.6+.35*Math.sin(tt*1.5)):s*.25,ts=run?s*(.45+.25*Math.sin(tt*2.1)):s*.1,te=run?s*(1.25+.4*Math.sin(tt*2.7+1)):s*2.3;
      ar.tur.rotation.y+=(ty-ar.tur.rotation.y)*k;ar.sh.rotation.z+=(ts-ar.sh.rotation.z)*k;ar.el.rotation.z+=(te-ar.el.rotation.z)*k;if(ar.spin)ar.spin.rotation.y+=dt*(run?20:1);
      if(run&&Math.random()<dt*14){ar.tool.getWorldPosition(tv);if(s>0)P.puff.add(tv.x,tv.y,tv.z,rnd(-2.5,-.5),rnd(-1,.5),rnd(.5,2),rnd(.2,.35),.8,0);else P.spark.add(tv.x,tv.y,tv.z,rnd(-1,1),rnd(.5,2),rnd(-1,1),.09,.5,-3);}}
    if(run){a.tickle=Math.max(a.tickle,.3);if(Math.random()<dt*10)P.spark.add(st.x+rnd(-len/2,len/2),rnd(.5,hh+.5),rnd(-hw,hw+.3),0,rnd(.3,1.2),0,.1,.7,0);}}
}
// wspólna animacja (ZOO) + pralnia: muchy, czapka, kapiąca woda
function anim(a,dt){ZOO.anim(a,dt);
  if(a.flies){const c=a.flies.children;for(let i=0;i<c.length;i++){const an=a.t*(3+i)+i*2;c[i].position.set(Math.cos(an)*(.7+i*.25),Math.sin(an*1.7)*.3,Math.sin(an)*(.5+i*.2));}}
  if(a.hatM&&a.hatPop<1){a.hatPop=Math.min(1,a.hatPop+dt*2.5);a.hatM.scale.setScalar(a.hatS*(1+Math.sin(a.hatPop*PI)*.6)*Math.min(1,a.hatPop*3));}
  if(a.wet&&Math.random()<dt*7)P.water.add(a.root.position.x+rnd(a.dims.x0,a.dims.x1),rnd(.4,a.dims.h*.7),rnd(-a.dims.hw,a.dims.hw),0,0,0,.07,.5,-9,[1,1.6,1]);
}

/* ---------- manual tools & input ---------- */
const ptr={down:false,x:0,y:0,px:0,py:0,idle:9};let manualDry=false;
const tools=[];(function(){
  const sp=grp(scene);box(M(0xffd23f,{roughness:.9}),sp,0,0,0,.95,.6,.32);box(M(0x35c2a1,{roughness:.9}),sp,0,0,-.2,.95,.6,.1);for(let i=0;i<6;i++)ball(M(0xe0b000),sp,rnd(-.35,.35),rnd(-.2,.2),.16,.05);
  const dr=grp(scene),pk=M(0xff7eb6,{roughness:.35});const bd=mesh(cg(.3,.34,.8,16),pk,dr,0,0,.2);bd.rotation.x=PI/2;const nzl=mesh(cg(.26,.2,.35,16),M(0x455a64),dr,0,0,-.35);nzl.rotation.x=PI/2;const hd=box(pk,dr,0,-.55,.35,.2,.8,.24);hd.rotation.x=.2;
  const wd=grp(scene);const stc=mesh(cg(.04,.04,1,8),M(0xffffff),wd,.25,-.5,0);stc.rotation.z=.45;const stt=new T.Mesh(starG,starGold);stt.scale.setScalar(.34);wd.add(stt);
  for(const t of [sp,dr,wd]){t.visible=false;t.traverse(o=>{o.castShadow=false;});tools.push(t);}})();
canvas.addEventListener('pointerdown',e=>{ptr.down=true;ptr.tap=true;ptr.sx=e.clientX;ptr.sy=e.clientY;ptr.sCan=canNow();ptr.x=ptr.px=e.clientX;ptr.y=ptr.py=e.clientY;ptr.idle=0;try{canvas.setPointerCapture(e.pointerId);}catch(_){};e.preventDefault();});
canvas.addEventListener('pointermove',e=>{if(ptr.down){ptr.x=e.clientX;ptr.y=e.clientY;}});
const pUp=()=>{if(ptr.down&&!ptr.sCan){const dx=ptr.x-ptr.sx,dy=ptr.y-ptr.sy;if(Math.abs(dx)>Math.max(50,W*.12)&&Math.abs(dx)>1.3*Math.abs(dy))stepView(dx<0?1:-1);else if(view<0&&Math.hypot(dx,dy)<18)tapStation();}ptr.down=false;};
function tapStation(){pv.set(ptr.x/W*2-1,-(ptr.y/H*2-1),.5).unproject(camera).sub(camera.position).normalize();if(pv.y>=-.01)return;const t=-(camera.position.y-1.5)/pv.y,x=camera.position.x+pv.x*t;let best=null,bd=9;for(const st of stations){const d=Math.abs(x-(st.x-(st.i?3:0)));if(d<bd){bd=d;best=st;}}if(!best)return;if(best.owned)setView(best.i);else{renderShop();$('shop').hidden=false;snd.tap();}}
let whT=0;canvas.addEventListener('wheel',e=>{e.preventDefault();const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(d)>30&&performance.now()-whT>450){whT=performance.now();stepView(d>0?1:-1);}},{passive:false});canvas.addEventListener('pointerup',pUp);canvas.addEventListener('pointercancel',pUp);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
const pv=V();let sqT=0;
function manual(dt){const st=view>=0?stations[view]:null,a=st&&st.animal,can=!!(st&&st.owned&&!st.auto&&a&&a.state==='work'),act=can&&ptr.down;
  tools.forEach((t,i)=>{t.visible=act&&i===st.i;});ptr.idle+=dt;
  $('hint').hidden=!(can&&ptr.idle>2.5&&!ptr.down);
  const pr=$('prog');if(can){pr.hidden=false;$('progIc').textContent=ICON[st.i];let sum=0;for(const s of a.spots)sum+=s.hp;$('progB').style.width=((1-sum/(a.nSpots||1))*100|0)+'%';}else pr.hidden=true;
  if(can){const mul=ptr.idle>2?1+.3*Math.abs(Math.sin(time*6)):1;if(mul!==1||a._pl){for(const s of a.spots)if(s.hp>0)setSpotScale(s,mul);a._pl=mul!==1;}}
  if(!act){setLoop('scrub',0);manualDry=false;return;}
  ptr.sCan=true;
  ptr.idle=0;const mv=Math.hypot(ptr.x-ptr.px,ptr.y-ptr.py);ptr.px=ptr.x;ptr.py=ptr.y;const R=Math.min(W,H)*.11+26;
  pv.set(ptr.x/W*2-1,-(ptr.y/H*2-1),.5).unproject(camera).sub(camera.position).normalize();const zp=a.dims.hw+.6,tt=(zp-camera.position.z)/pv.z,tool=tools[st.i];
  tool.position.copy(camera.position).addScaledVector(pv,tt);const tp=tool.position;
  const amt=(st.i===1?dt*2.6+mv/(R*8):mv/(R*(st.i===0?3:2.4)))+(ptr.tap?.55:0);ptr.tap=false;
  for(const s of a.spots){if(s.hp<=0)continue;tv.setFromMatrixPosition(s.m.matrixWorld).project(camera);const dx=(tv.x+1)/2*W-ptr.x,dy=(1-tv.y)/2*H-ptr.y;if(dx*dx+dy*dy<R*R)damage(a,s,amt);}
  if(st.i===0){tool.rotation.z=Math.sin(time*18)*.3;setLoop('scrub',Math.min(.3,mv/50));if(mv>2){a.tickle=Math.max(a.tickle,.6);if(Math.random()<.5)P.foam.add(tp.x+rnd(-.3,.3),tp.y+rnd(-.3,.3),tp.z-.3,rnd(-.6,.6),rnd(.2,1.2),rnd(0,.5),rnd(.1,.2),rnd(.5,1),-1);sqT-=dt;if(sqT<0){snd.squeak();sqT=rnd(.15,.4);}}
    if(st.shower&&Math.random()<.5)P.water.add(st.shower.x+rnd(-.3,.3),st.shower.y,st.shower.z+rnd(-.3,.3),0,-5,0,.06,.9,-6,[1,2,1]);manualDry=false;}
  else if(st.i===1){manualDry=true;setLoop('scrub',0);setLoop('dry',.3);a.blowT=.2;tool.rotation.z=Math.sin(time*40)*.03;for(let k=0;k<2;k++)P.wind.add(tp.x+rnd(-.25,.25),tp.y+rnd(-.25,.25),tp.z-.6,0,0,-rnd(6,9),.045,.25,0,[1,1,8]);}
  else{manualDry=false;setLoop('scrub',Math.min(.12,mv/90));tool.rotation.z=Math.sin(time*10)*.3;if(mv>2&&Math.random()<.6)P.spark.add(tp.x+rnd(-.3,.3),tp.y+rnd(-.3,.3),tp.z-.2,rnd(-1,1),rnd(.3,1.5),0,.08,.5,-2);}
}

/* ---------- camera ---------- */
const camPos=V(0,6,22),camLook=V(0,2,0),tgtPos=V(0,6,22),tgtLook=V(0,2,0),fd=V(),fv=V();
function fit(pts,look,yaw,pitch){camT.aspect=camera.aspect;camT.updateProjectionMatrix();fd.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));const yTop=1-150/H,yBot=-1+200/H;let lo=3,hi=300;
  for(let i=0;i<20;i++){const mid=(lo+hi)/2;camT.position.copy(look).addScaledVector(fd,mid);camT.lookAt(look);camT.updateMatrixWorld();let ok=true;for(const p of pts){fv.copy(p).project(camT);if(Math.abs(fv.x)>.93||fv.y>yTop||fv.y<yBot||fv.z>1){ok=false;break;}}if(ok)hi=mid;else lo=mid;}
  return look.clone().addScaledVector(fd,hi);}
function retarget(){const pts=[],port=camera.aspect<1;let look,yaw,pitch;
  if(view<0){const x0=QX0-QGAP*(MAXQ[S.lv.ad]-1)-3,x1=cashX+4;for(const x of [x0,x1])for(const y of [0,6])for(const z of [-3.5,3])pts.push(V(x,y,z));look=V((x0+x1)/2,1.5,0);yaw=port?1.12:.3;pitch=port?.5:.4;}
  else{const st=stations[view],a=st.animal&&st.animal.state!=='go'?st.animal:null;let w=3.4,h=4.6;if(a){w=Math.max(2.6,a.dims.len/2+.6);h=Math.max(3,a.dims.h+.9);}if(st.hasM){w=Math.max(w,4.4);h=Math.max(h,st.i===2?5:7.9);}
    for(const x of [-w,w])for(const y of [0,h])for(const z of [-1.2,1.5])pts.push(V(st.x+x,y,z));look=V(st.x,h*.45,0);yaw=port?.2:.34;pitch=.2;}
  tgtLook.copy(look);tgtPos.copy(fit(pts,look,yaw,pitch));}
function canNow(){const st=view>=0?stations[view]:null,a=st&&st.animal;return !!(st&&st.owned&&!st.auto&&a&&a.state==='work');}
function stepView(d){const l=stations.filter(q=>q.owned).map(q=>q.i);l.push(-1);const i=l.indexOf(view);setView(l[(i+d+l.length)%l.length]);}
function setView(v){view=v;retarget();buildNav();snd.tap();}

/* ---------- HUD ---------- */
const moodsEl=$('moods'),moodEls=[];
function newMood(){const d=document.createElement('div');d.className='mood';d.innerHTML='<span></span><i><b></b></i>';moodsEl.appendChild(d);moodEls.push(d);return d;}
function hud(){let n=0;for(const a of animals){if(!(a.state==='queue'||a.state==='done'||a.state==='wait'))continue;fv.set(a.root.position.x+a.cx,a.dims.h+.5,0).project(camera);if(fv.z>1||Math.abs(fv.x)>1.05||Math.abs(fv.y)>1.05)continue;
    const el=moodEls[n]||newMood();n++;el.style.transform='translate('+((fv.x+1)/2*W).toFixed(1)+'px,'+((1-fv.y)/2*H).toFixed(1)+'px) translate(-50%,-100%)';const f=a.patience>.6?'😀':a.patience>.3?'😐':'😠';if(el._f!==f){el._f=f;el.firstChild.textContent=f;}
    const b=el.lastChild.firstChild;b.style.width=(a.patience*100|0)+'%';b.style.background=a.patience>.6?'#4cd964':a.patience>.3?'#ffb300':'#ff5252';el.hidden=false;}
  for(let i=n;i<moodEls.length;i++)moodEls[i].hidden=true;}
function floater(txt,x,y,z){fv.set(x,y,z).project(camera);const d=document.createElement('div');d.className='fl';d.textContent=txt;d.style.left=clamp((fv.x+1)/2*W,50,W-50)+'px';d.style.top=clamp((1-fv.y)/2*H,110,H-150)+'px';$('floaters').appendChild(d);setTimeout(()=>d.remove(),1200);}
function updCoins(bump){$('coins').textContent=S.coins;if(bump){const p=$('coinP');p.classList.remove('bump');void p.offsetWidth;p.classList.add('bump');}
  $('bShop').classList.toggle('pulse',SHOP.some(it=>canBuy(it)));}
function price(it){return it.p[S.lv[it.id]];}
function canBuy(it){return S.lv[it.id]<it.p.length&&(!it.req||S.lv[it.req])&&S.coins>=price(it);}
function renderShop(){const c=$('cards');c.innerHTML='';for(const it of SHOP){const lv=S.lv[it.id],max=lv>=it.p.length,lock=it.req&&!S.lv[it.req],b=document.createElement('button');
    b.className='card '+(max?'max':lock?'lock':canBuy(it)?'ok':'poor');const pips=it.p.length>1?'●'.repeat(lv)+'○'.repeat(it.p.length-lv):'';
    b.innerHTML='<span class="ia">'+it.a+'</span><span class="ib">'+it.b+'</span><span class="pips">'+pips+'</span><span class="pr">'+(max?'✅':lock?'🔒':'🪙 '+price(it))+'</span>';
    b.onclick=()=>buy(it);c.appendChild(b);}}
function buy(it){if(!canBuy(it)){snd.no();return false;}S.coins-=price(it);S.lv[it.id]++;snd.buy();save();applyOwn();updCoins(true);$('shop').hidden=true;
  const m={dry:1,autoDry:1,t1:1,glam:2,autoGlam:2,t2:2,autoWash:0,t0:0};setView(it.id in m?m[it.id]:-1);const p=V(tgtLook.x,3,1);burst('spark',p,24,5,.16,1.2,-4);return true;}
let navState='';
function buildNav(){const nav=$('nav');nav.innerHTML='';const add=(v,ic,rob)=>{const b=document.createElement('button');b.className='nb'+(view===v?' on':'');b.dataset.v=v;b.innerHTML=ic+(rob?'<span class="rob">🤖</span>':'');b.onclick=()=>setView(v);nav.appendChild(b);};
  stations.forEach(st=>{if(st.owned)add(st.i,ICON[st.i],st.auto);});add(-1,'👀');const cs=view>=0?stations[view]:null;if(cs&&cs.hasM){const b=document.createElement('button');b.className='nb mode';b.textContent=cs.auto?'🤖':'🖐️';b.setAttribute('aria-label','Automat albo ręcznie');b.onclick=()=>{cs.auto=cs.auto?0:1;snd.tap();buildNav();};nav.appendChild(b);}navState='';}
function navAlerts(){let s='';const bs=$('nav').children;for(const b of bs){const v=+b.dataset.v;if(!(v>=0))continue;const st=stations[v],need=!st.auto&&st.animal&&st.animal.state==='work'&&view!==v;b.classList.toggle('alert',!!need);s+=need?1:0;}navState=s;}
function updRate(){while(servedT.length&&servedT[0]<time-60)servedT.shift();const span=Math.min(60,Math.max(15,time));$('rate').textContent=Math.round(servedT.length/span*3600/10)*10;}

/* ---------- main loop ---------- */
let uiT=0,fAcc=0,fN=0,qStep=0;
function update(dt){time+=dt;flow(dt);
  // camera
  uiT-=dt;if(uiT<=0){uiT=.25;retarget();navAlerts();updRate();if(cash)cash.position.x+=(cashX-cash.position.x)*.5;}
  const k=1-Math.exp(-dt*4);camPos.lerp(tgtPos,k);camLook.lerp(tgtLook,k);camera.position.copy(camPos);camera.lookAt(camLook);camera.updateMatrixWorld();
  {const fd0=camPos.distanceTo(camLook);scene.fog.near=fd0+50;scene.fog.far=fd0+240;}
  sun.position.set(camLook.x+18,40,24);sun.target.position.set(camLook.x,0,0);
  // ambience
  for(const c of clouds){c.position.x+=dt*.8;if(c.position.x>130)c.position.x=-130;}
  for(const s of sway){if(s.ax==='p')s.o.position.y=s.b+Math.sin(time*1.5+s.b*3)*.12;else s.o.rotation.x=Math.sin(time*1.6+s.o.position.x)*.12;}
  if(cash){cash.coin.rotation.z+=dt*2;cash.wave=Math.max(0,cash.wave-dt);for(const f of cash.fl)f.f.rotation.z=f.s*(.25+cash.wave*Math.abs(Math.sin(time*16))*1.6);cash.pen.position.y=1.46+cash.wave*Math.abs(Math.sin(time*12))*.15;}
  if(beltTex)beltTex.offset.x-=dt*7*.5;
  if(Math.random()<dt*3){const st=stations[Math.random()*3|0];if(st.owned)P.bubble.add(st.x+rnd(-3,3),rnd(.5,2),rnd(-3,1),rnd(-.3,.3),rnd(.6,1.2),rnd(-.2,.2),rnd(.12,.3),rnd(3,5),0);}
  scene.updateMatrixWorld();manual(dt);hud();for(const kx in P)P[kx].up(dt);}
let last=performance.now();
function frame(now){const raw=(now-last)/1000;last=now;const dt=Math.min(.05,Math.max(0,raw));
  if(running){update(dt);fAcc+=raw;fN++;if(fAcc>4){const fps=fN/fAcc;if(fps<27&&qStep<2){qStep++;if(qStep===1){pixelRatio=Math.min(pixelRatio,1.25);resize();}else{renderer.shadowMap.enabled=false;sun.castShadow=false;scene.traverse(o=>{if(o.material&&o.material.isMaterial)o.material.needsUpdate=true;});}}fAcc=0;fN=0;}}
  else{scene.updateMatrixWorld();}
  renderer.render(scene,camera);requestAnimationFrame(frame);}
function resize(){W=innerWidth;H=innerHeight;renderer.setPixelRatio(pixelRatio);renderer.setSize(W,H,false);camera.aspect=W/H;camera.fov=W<H?46:40;camera.updateProjectionMatrix();camT.fov=camera.fov;retarget();}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));

document.addEventListener('visibilitychange',()=>{if(!AC)return;if(document.hidden)AC.suspend();else AC.resume();last=performance.now();});

/* ---------- boot ---------- */
load();buildWorld();buildStation(stations[0]);buildLot(stations[1]);buildLot(stations[2]);applyOwn();buildCash();
resize();camPos.copy(tgtPos);camLook.copy(tgtLook);camera.position.copy(camPos);camera.lookAt(camLook);sun.position.set(18,40,24);updCoins();
$('bPlay').onclick=()=>{initAudio();if(AC&&AC.state==='suspended')AC.resume();goFS();$('start').remove();$('ui').hidden=false;running=true;last=performance.now();snd.buy();setTimeout(resize,400);};
$('bShop').onclick=()=>{renderShop();$('shop').hidden=false;snd.tap();};
$('bClose').onclick=()=>{$('shop').hidden=true;snd.tap();};
$('shop').addEventListener('pointerdown',e=>{if(e.target===$('shop'))$('shop').hidden=true;});
$('bMus').onclick=()=>{muted=!muted;if(master)master.gain.value=muted?0:1;$('bMus').textContent=muted?'🔇':'🔊';};
const elr=document.documentElement;if(!(elr.requestFullscreen||elr.webkitRequestFullscreen))$('bFs').hidden=true;
$('bFs').onclick=()=>{if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);}else goFS();};
let armT=0;$('bReset').onclick=()=>{const b=$('bReset');if(!b.classList.contains('arm')){b.classList.add('arm');clearTimeout(armT);armT=setTimeout(()=>b.classList.remove('arm'),2500);return;}try{localStorage.removeItem(KEY);}catch(e){}location.reload();};
window.__t={stepView,MK,addSpots,T,S,stations,animals,queue,step:update,buy:id=>buy(SHOP.find(i=>i.id===id)),setView,scrub(){for(const st of stations){const a=st.animal;if(a&&a.state==='work'&&!st.auto)for(const s of a.spots)damage(a,s,9);}},start(){running=true;}};
requestAnimationFrame(frame);
