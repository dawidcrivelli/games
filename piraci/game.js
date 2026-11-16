'use strict';
// Piraci! Bitwa morska — statki i armaty, potem abordaż i pojedynek na szable.
// Zwierzęta: models/zwierzeta.js (ZOO), morskie: models/morze.js (MORZE), audio/clamp/lerp: lib/*piraci.js
const T=THREE,$=id=>document.getElementById(id);
const {rnd,pick,canvasTex,M,cg,G,mesh,ball,box,grp,mergeC,MK}=ZOO;
ZOO.cfg.cast=false;
const PI=Math.PI,TAU=PI*2;
const angd=(a,b)=>{let d=(a-b)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};
let W=innerWidth,H=innerHeight;

/* ---------- renderer, sky, light ---------- */
const canvas=$('c');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const scene=new T.Scene(),camera=new T.PerspectiveCamera(60,1,.5,1200);
scene.fog=new T.Fog(0xbfe6fb,140,560);
const hemi=new T.HemisphereLight(0xffffff,0x6a8fa8,.75);scene.add(hemi);
const sun=new T.DirectionalLight(0xfff0c8,1);scene.add(sun);
const amb=new T.AmbientLight(0xffffff,.18);scene.add(amb);

const THEMES={
  day:{top:0x2a86e0,hor:0xbfe6fb,deep:0x0a4a86,shal:0x1fa7c4,sun:0xfff0c8,sunI:1,hemi:.8,amp:1,sd:[.45,.55,-.7]},
  tropic:{top:0x1596e6,hor:0xdff8ff,deep:0x067a9c,shal:0x35dcc8,sun:0xffffff,sunI:1.05,hemi:.85,amp:.8,sd:[-.5,.7,-.5]},
  sunset:{top:0x3a3c8c,hor:0xffab73,deep:0x1c2f66,shal:0xc0647a,sun:0xff9a4d,sunI:.95,hemi:.65,amp:1.1,sd:[.2,.16,-.97]},
  storm:{top:0x2c3a48,hor:0x8c9eaa,deep:0x0f2a38,shal:0x3b6f7a,sun:0xcfd8e0,sunI:.55,hemi:.7,amp:1.9,sd:[.3,.6,-.6],rain:1},
  night:{top:0x040c24,hor:0x24407c,deep:0x031228,shal:0x1b4f86,sun:0xbfd4ff,sunI:.55,hemi:.6,amp:1,sd:[-.3,.45,-.85]}
};
let theme=THEMES.day;
const U={uT:{value:0},uAmp:{value:1},uDeep:{value:new T.Color()},uShal:{value:new T.Color()},uSky:{value:new T.Color()},uTop:{value:new T.Color()},
  uSun:{value:new T.Vector3(0,1,0)},uSunC:{value:new T.Color()},uFogN:{value:140},uFogF:{value:560}};
const sky=new T.Mesh(new T.SphereGeometry(1000,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:U,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uSky,uTop,uSun,uSunC;varying vec3 vD;void main(){vec3 d=normalize(vD);vec3 c=mix(uSky,uTop,pow(max(d.y,0.),.55));
    float s=max(dot(d,uSun),0.);c+=uSunC*(pow(s,900.)*3.+pow(s,24.)*.28+pow(s,4.)*.1);gl_FragColor=vec4(c,1.);}`}));
sky.renderOrder=-2;sky.frustumCulled=false;scene.add(sky);

/* ---------- sea: fale liczone tak samo w JS (kołysanie statków) i w GLSL ---------- */
const WV=[[.8,.6,40,.9,.5],[-.35,.94,23,1.25,.3],[.94,-.34,13,1.8,.15]];           // kierunek x,z, długość, omega, amplituda
const RP=[[.6,-.8,5.5,2.6,.05],[-.9,.44,3.4,3.3,.03],[.2,.98,2.1,4.1,.018]];       // drobne zmarszczki (tylko normalna)
let seaT=0,seaAmp=1;
function seaH(x,z){let h=0;for(const w of WV)h+=w[4]*Math.sin((w[0]*x+w[1]*z)*TAU/w[2]+w[3]*seaT);return h*seaAmp;}
const f4=n=>Number(n).toFixed(4);
const water=new T.Mesh(new T.PlaneGeometry(1000,1000,200,200).rotateX(-PI/2),new T.ShaderMaterial({uniforms:U,fog:false,
  vertexShader:`uniform float uT,uAmp;varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);float h=0.;
    ${WV.map(w=>`h+=${f4(w[4])}*sin(dot(w.xz,vec2(${f4(w[0])},${f4(w[1])}))*${f4(TAU/w[2])}+uT*${f4(w[3])});`).join('')}
    w.y+=h*uAmp;vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float uT,uAmp,uFogN,uFogF;uniform vec3 uDeep,uShal,uSky,uSun,uSunC;varying vec3 vW;
    void main(){vec2 p=vW.xz;float h=0.,a;vec2 d=vec2(0.);
    ${WV.map(w=>`a=dot(p,vec2(${f4(w[0])},${f4(w[1])}))*${f4(TAU/w[2])}+uT*${f4(w[3])};h+=${f4(w[4])}*sin(a);d+=${f4(w[4]*TAU/w[2])}*cos(a)*vec2(${f4(w[0])},${f4(w[1])});`).join('')}
    ${RP.map(w=>`a=dot(p,vec2(${f4(w[0])},${f4(w[1])}))*${f4(TAU/w[2])}+uT*${f4(w[3])};d+=${f4(w[4]*TAU/w[2])}*cos(a)*vec2(${f4(w[0])},${f4(w[1])});`).join('')}
    d*=uAmp;vec3 n=normalize(vec3(-d.x,1.,-d.y));vec3 v=normalize(cameraPosition-vW);float dd=length(vW-cameraPosition);
    float fr=pow(1.-max(dot(n,v),0.),4.);float hh=clamp(h*.55+.5,0.,1.);
    vec3 col=mix(uDeep,uShal,hh*.8+.08);col=mix(col,uSky,.12+fr*.6);
    float s=max(dot(reflect(-uSun,n),v),0.);col+=uSunC*(pow(s,140.)*1.6+pow(s,14.)*.14);
    float foam=smoothstep(.66,.97,hh)*(.55+.45*sin(p.x*1.7+uT)*sin(p.y*2.1-uT*.7));col=mix(col,vec3(1.),clamp(foam,0.,1.)*.5*smoothstep(260.,60.,dd));
    col=mix(col,uSky,smoothstep(uFogN,uFogF,dd));gl_FragColor=vec4(col,1.);}`}));
water.frustumCulled=false;scene.add(water);

function setTheme(n){theme=THEMES[n]||THEMES.day;const t=theme;U.uDeep.value.set(t.deep);U.uShal.value.set(t.shal);U.uSky.value.set(t.hor);U.uTop.value.set(t.top);
  U.uSun.value.set(t.sd[0],t.sd[1],t.sd[2]).normalize();U.uSunC.value.set(t.sun);seaAmp=U.uAmp.value=t.amp;
  scene.fog.color.set(t.hor);hemi.color.set(t.hor).lerp(new T.Color(0xffffff),.5);hemi.groundColor.set(t.deep).lerp(new T.Color(0xffffff),.25);hemi.intensity=t.hemi;
  sun.color.set(t.sun);sun.intensity=t.sunI;sun.position.copy(U.uSun.value).multiplyScalar(100);rainIM.visible=!!t.rain;cloudM.color.set(t.hor).lerp(new T.Color(0xffffff),t.rain?.15:.75);}

// chmury
const cloudM=new T.MeshBasicMaterial({color:0xffffff,fog:false});
{const p=[];for(let i=0;i<14;i++){const a=rnd(TAU),r=rnd(260,620),x=Math.cos(a)*r,z=Math.sin(a)*r,y=rnd(70,150),s=rnd(14,30);
  for(let j=0;j<5;j++)p.push({g:G.lo,p:[x+(j-2)*s*.8+rnd(-4,4),y+rnd(-3,3),z+rnd(-8,8)],s:[s*rnd(.7,1.1),s*rnd(.35,.5),s*rnd(.6,.9)],c:0xffffff});}
  const m=new T.Mesh(mergeC(p),cloudM);m.frustumCulled=false;scene.add(m);}
// deszcz
const dum=new T.Object3D();
const rainIM=new T.InstancedMesh(G.box,new T.MeshBasicMaterial({color:0xcfe3f0,transparent:true,opacity:.55}),260);rainIM.frustumCulled=false;rainIM.visible=false;scene.add(rainIM);
const rainA=[];for(let i=0;i<260;i++)rainA.push([rnd(-40,40),rnd(0,40),rnd(-40,40)]);
let boltT=8,flash=0;

/* ---------- cząsteczki ---------- */
class PS{constructor(mat,cap,geo){this.im=new T.InstancedMesh(geo||G.lo,mat,cap);this.im.frustumCulled=false;this.im.count=0;this.cap=cap;this.a=[];scene.add(this.im);}
  add(x,y,z,vx,vy,vz,s,life,g,grow,fy){if(this.a.length>=this.cap)return;this.a.push({x,y,z,vx,vy,vz,s,life,g:g||0,gr:grow||0,fy:fy||1,t:0});}
  up(dt){const a=this.a;let n=0;for(let i=0;i<a.length;i++){const p=a[i];p.t+=dt;if(p.t>=p.life)continue;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const k=p.t/p.life,sc=p.s*(1+p.gr*k)*(k<.12?k/.12:1-(k-.12)/.88);
      dum.position.set(p.x,p.y,p.z);dum.rotation.set(0,0,0);dum.scale.set(sc,sc*p.fy,sc);dum.updateMatrix();this.im.setMatrixAt(n,dum.matrix);a[n++]=p;}
    a.length=n;this.im.count=n;this.im.instanceMatrix.needsUpdate=true;}}
const P_={
  water:new PS(new T.MeshLambertMaterial({color:0xe6f6ff}),260),
  foam:new PS(new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false}),420,new T.SphereGeometry(1,14,6)),
  smoke:new PS(new T.MeshLambertMaterial({color:0x3a3f47,transparent:true,opacity:.7,depthWrite:false}),200),
  puff:new PS(new T.MeshLambertMaterial({color:0xf0f0f0,transparent:true,opacity:.75,depthWrite:false}),160),
  fire:new PS(new T.MeshBasicMaterial({color:0xff8a1e}),140),
  spark:new PS(new T.MeshBasicMaterial({color:0xffe066}),160),
  wood:new PS(new T.MeshLambertMaterial({color:0x8a5a2b}),120,G.box),
  magic:new PS(new T.MeshBasicMaterial({color:0x7df9ff}),120)
};
function burst(kind,x,y,z,n,sp,s,life,g,grow){for(let i=0;i<n;i++)P_[kind].add(x+rnd(-.3,.3),y+rnd(0,.3),z+rnd(-.3,.3),rnd(-sp,sp),rnd(sp*.2,sp*1.3),rnd(-sp,sp),rnd(s*.6,s*1.3),rnd(life*.6,life),g,grow);}
function splash(x,z,k){k=k||1;burst('water',x,seaH(x,z),z,Math.round(12*k),4*k,.45*k,.9,-16);for(let i=0;i<4;i++)P_.foam.add(x+rnd(-1,1),seaH(x,z)+.1,z+rnd(-1,1),rnd(-1,1),0,rnd(-1,1),1.2*k,1.6,0,2,.12);}

/* ---------- audio ---------- */
let AC=null,master=null,sfx=null,mus=null,nbuf=null,muted=false;const loops={};
function initAudio(){if(AC)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();}catch(e){AC=null;return;}
  master=AC.createGain();master.gain.value=muted?0:1;master.connect(AC.destination);
  sfx=AC.createGain();sfx.gain.value=.9;sfx.connect(master);mus=AC.createGain();mus.gain.value=.12;mus.connect(master);
  nbuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  loops.sea=nloop('lowpass',520,.4);loops.sea.g.gain.value=.11;
  const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=.17;lg.gain.value=230;l.connect(lg);lg.connect(loops.sea.f.frequency);l.start();
  startMusic();}
const snd={
  cannon(v){v=v||1;nz(.55,.42*v,650,'lowpass',70);tone(105,.38,'sine',.36*v,42);},
  splash(){nz(.35,.1,1700,'lowpass',400);},
  plusk(){tone(300,.25,'sine',.22,70);nz(.6,.25,1500,'lowpass',250);},
  wood(){nz(.2,.32,900,'bandpass',280);tone(160,.14,'square',.09,70);},
  clang(){tone(1900,.25,'triangle',.15,1500);tone(2700,.2,'sine',.08,2300);nz(.05,.16,5000,'highpass');},
  swish(){nz(.14,.11,1100,'bandpass',3300);},
  hit(){nz(.13,.32,700,'lowpass',180);tone(230,.13,'sawtooth',.1,90);},
  slap(){nz(.09,.38,2400,'bandpass',900);tone(320,.09,'sine',.16,120);},
  coin(){tone(1319,.08,'sine',.1);tone(1760,.18,'sine',.1,0,.07);},
  tap(){tone(660,.06,'sine',.1,880);},
  no(){tone(180,.18,'sawtooth',.07,120);},
  charge(k){tone(300+k*9,.09,'triangle',.05,340+k*9);},
  ready(){[784,988,1319].forEach((f,i)=>tone(f,.14,'triangle',.12,0,i*.06));},
  special(){sw('sine',[[0,300],[1,1500]],.45,.13,5000);},
  boing(){sw('sine',[[0,170],[.3,560],[1,240]],.38,.2,3000);},
  boom(){nz(.8,.5,480,'lowpass',55);tone(90,.55,'sine',.42,36);},
  warn(){tone(880,.1,'square',.06);tone(880,.1,'square',.06,0,.16);},
  wind(){nz(.9,.16,500,'bandpass',2400);},
  thunder(){nz(1.8,.4,220,'lowpass',50);},
  win(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,.28,'triangle',.16,0,i*.11));},
  lose(){[392,349,311,262].forEach((f,i)=>tone(f,.35,'sawtooth',.08,0,i*.22));}
};
function startMusic(){let nt=AC.currentTime+.1,i=0;const R=99;   // własna szanta 6/8 w d-moll
  const A=[0,R,0,3,R,5, 7,R,5,3,R,0, -2,R,-2,2,R,5, 3,2,0,-2,R,R, 0,R,0,3,R,5, 7,R,8,7,R,5, 3,5,3,2,R,-2, 0,R,R,0,R,R];
  const ROOT=[0,0,-2,-2,0,0,-2,0];
  setInterval(()=>{if(!AC||AC.state!=='running')return;const step=60/(mode==='duel'?136:104)/3;if(nt<AC.currentTime)nt=AC.currentTime+.05;
    while(nt<AC.currentTime+.4){const s=i%48,bar=(i/6|0)%8,m=A[s];
      if(m!==R)mnote(nt,587.33*Math.pow(2,m/12),step*1.1,'triangle',.5);
      const b=s%6,r=146.83*Math.pow(2,ROOT[bar]/12);if(b===0)mnote(nt,r,step*2.4,'sine',.9);if(b===3)mnote(nt,r*1.5,step*1.4,'sine',.5);
      if(mode==='duel'&&(b===2||b===5))mnote(nt,r*2,step*.6,'square',.12);
      i++;nt+=step;}},120);}

/* ---------- modele: kapelusz, pirat-ludzik, broń ---------- */
const MVC=new T.MeshLambertMaterial({vertexColors:true}),MVC2=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
function mkHat(){const g=new T.Group(),bk=M(0x1d1d24),go=M(0xffc93c),wh=M(0xffffff);
  mesh(cg(.5,.5,.06,14),bk,g,0,.03,0);ball(bk,g,0,.1,0,.3,.24,.3);mesh(cg(.31,.31,.05,14),go,g,0,.1,0);
  for(const a of [0,2.1,4.2])ball(bk,g,Math.cos(a)*.36,.13,Math.sin(a)*.36,.2,.12,.2);
  ball(wh,g,.3,.2,0,.075);mesh(G.cone,M(0xff4a3d),g,-.12,.42,.22,.05,.45,.09).rotation.x=.5;return g;}
const HUM={
  human:{coat:0xd63b3b,pants:0x2b3a67,skin:0xf2c39a,hair:0x5a3418,band:0xffc93c},
  rudy:{coat:0x2f8f4e,pants:0x3b2a1a,skin:0xf0b890,hair:0xe0701c,beard:1,hat:1},
  baska:{coat:0x7a3fa8,pants:0x222233,skin:0xf4cfae,hair:0x1b1b22,long:1,hat:1,patch:1},
  czarny:{coat:0x23232b,pants:0x4a1f1f,skin:0xd9a47c,hair:0x111116,beard:1,hat:1,patch:1}
};
// ludzik: przód +x, stopy w y=0, wysokość ~1.9
function mkHuman(kind){const o=HUM[kind]||HUM.human,root=new T.Group(),body=grp(root),sk=M(o.skin),co=M(o.coat),pa=M(o.pants),bk=M(0x1d1d24),hr=M(o.hair);
  for(const s of [1,-1]){mesh(cg(.1,.09,.5,8),pa,body,0,.3,s*.13);ball(bk,body,.05,.07,s*.13,.15,.08,.11);ball(sk,body,.02,.78,s*.36,.09);}
  ball(co,body,0,.85,0,.3,.38,.27);mesh(cg(.29,.29,.07,12),bk,body,0,.6,0);box(M(0xffc93c),body,.28,.6,0,.05,.1,.12);
  const head=grp(body,0,1.38,0);ball(sk,head,0,0,0,.25);ball(sk,head,.25,-.03,0,.05);
  for(const s of [1,-1])ball(bk,head,.215,.05,s*.09,.035);
  if(o.patch){ball(bk,head,.21,.05,.09,.06,.06,.05);box(bk,head,.02,.12,0,.5,.03,.52);}
  if(o.beard)ball(hr,head,.1,-.17,0,.2,.16,.2);else ball(M(0xb5524a),head,.22,-.11,0,.03,.02,.06);
  if(o.long)ball(hr,head,-.1,-.12,0,.22,.34,.26);
  if(o.hat){const h=mkHat();h.position.y=.19;h.scale.setScalar(.72);head.add(h);}
  else{ball(M(o.band),head,-.01,.07,0,.257,.2,.257);ball(M(o.band),head,-.26,.02,.1,.07,.1,.05);}
  return {root,body,head,human:true,dims:{h:1.9,len:.7,hw:.3},cx:0,t:rnd(9)};}
function addHat(top,a,maxW){if(!a.head||a.human)return;top.updateMatrixWorld(true);const b=new T.Box3().setFromObject(a.head),c=b.getCenter(new T.Vector3()),sz=b.getSize(new T.Vector3());
  const hat=mkHat(),ws=a.head.getWorldScale(new T.Vector3()).x,w=clamp(Math.min(sz.x,sz.z)*.7,maxW*.4,maxW);
  hat.position.copy(a.head.worldToLocal(new T.Vector3(c.x,b.max.y-sz.y*.05,c.z)));hat.scale.setScalar(w/ws);
  hat.quaternion.copy(a.head.getWorldQuaternion(new T.Quaternion()).invert());a.head.add(hat);}
const WEAPONS=[
  {id:'wood',e:'🪵',n:'Drewniany miecz',dmg:8,cost:0},
  {id:'saber',e:'🗡️',n:'Szabla',dmg:11,cost:70},
  {id:'rapier',e:'🤺',n:'Rapier',dmg:14,cost:160},
  {id:'anchor',e:'⚓',n:'Kotwica',dmg:18,cost:300},
  {id:'trident',e:'🔱',n:'Trójząb Neptuna',dmg:22,cost:480},
  {id:'swordfish',e:'🐟',n:'Ryba-miecz',dmg:27,cost:750}
];
// broń: rękojeść w (0,0,0), ostrze wzdłuż +y
function mkWeapon(id){const g=new T.Group(),st=M(0xdfe6ee,{metalness:.6,roughness:.3}),go=M(0xffc93c,{metalness:.5,roughness:.35}),wd=M(0x8a5a2b),gr=M(0x6b7480,{metalness:.5,roughness:.4});
  mesh(cg(.05,.05,.34,8),M(0x3b2414),g,0,0,0);
  if(id==='wood'){box(wd,g,0,.2,0,.34,.07,.09);box(M(0xc9975a),g,0,.9,0,.13,1.35,.06);}
  else if(id==='saber'){ball(go,g,0,.2,0,.17,.07,.1);for(let i=0;i<4;i++){const m=box(st,g,i*i*.022,.42+i*.36,0,.11-i*.012,.4,.035);m.rotation.z=-i*.11;}}
  else if(id==='rapier'){ball(go,g,0,.2,0,.16,.1,.16);mesh(cg(.012,.035,1.8,6),st,g,0,1.12,0);}
  else if(id==='anchor'){mesh(cg(.06,.06,1.5,8),gr,g,0,.9,0);mesh(new T.TorusGeometry(.42,.07,6,12,PI),gr,g,0,1.72,0);box(gr,g,0,.5,0,.6,.08,.08);
    for(const s of [1,-1])mesh(G.cone,gr,g,s*.42,1.8,0,.12,.28,.12).rotation.z=s*.5;}
  else if(id==='trident'){mesh(cg(.045,.045,1.5,8),go,g,0,.85,0);box(go,g,0,1.5,0,.62,.07,.07);for(const s of [-1,0,1])mesh(G.cone,go,g,s*.27,1.78+(s?0:.12),0,.06,.55,.06);}
  else{const bl=M(0x3f8fd6);ball(bl,g,0,.72,0,.15,.5,.11);ball(M(0xe8f4ff),g,.06,.7,0,.1,.42,.09);mesh(G.cone,M(0xcfd8e0),g,0,1.75,0,.035,1.15,.035);
    for(const s of [1,-1])mesh(G.cone,bl,g,s*.14,.2,0,.07,.36,.03).rotation.z=PI+s*-.5;mesh(G.cone,bl,g,-.2,.8,0,.05,.4,.03).rotation.z=1.1;ball(M(0x111111),g,.11,1.05,.08,.03);}
  return g;}
function starGeo(){const s=new T.Shape();for(let i=0;i<10;i++){const a=i/10*TAU,r=i%2?.2:.5;s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:1});g.translate(0,0,-.07);return g;}
let _starG=null;
function mkStar(){return new T.Mesh(_starG||(_starG=starGeo()),M(0xff7a3d,{roughness:.6}));}

/* ---------- statek ---------- */
const SH={L:13,W:4.4,D:1.3,H:1.5};
const hullW=t=>t>0?1-Math.pow(t,2.6):1-.22*t*t,sheer=t=>.5*t*t*(t>0?1.4:1);
const hullX=(t,y,rail)=>{const top=SH.H+rail+sheer(t),u=clamp((y+SH.D)/(top+SH.D),0,1);return hullW(t)*SH.W/2*(1-Math.pow(1-u,2.4));};
function hullGeo(rail,cH,cT,cB){const {L,D,H}=SH,NS=22,NR=6,pos=[],col=[],idx=[],C=[cB,cH,cT].map(c=>new T.Color(c)),row=NR+1;
  for(let i=0;i<=NS;i++){const t=-1+2*i/NS,top=H+rail+sheer(t);
    for(const sd of [1,-1])for(let j=0;j<=NR;j++){const u=j/NR,y=-D+(top+D)*u;pos.push(sd*hullX(t,y,rail),y,t*L/2);const c=u>.8?C[2]:y<.3?C[0]:C[1];col.push(c.r,c.g,c.b);}}
  for(let i=0;i<NS;i++)for(let s=0;s<2;s++)for(let j=0;j<NR;j++){const a=i*row*2+s*row+j,b=a+row*2;idx.push(a,b,a+1,b,b+1,a+1);}
  for(let j=0;j<NR;j++){const a=j,b=row+j;idx.push(a,b,a+1,b,b+1,a+1);}
  const d0=pos.length/3,cd=new T.Color(0xd2a05f);
  for(let i=0;i<=NS;i++){const t=-1+2*i/NS,x=hullX(t,H,rail)*.99,k=i%2?1:.86;for(const sd of [1,-1]){pos.push(sd*x,H,t*L/2);col.push(cd.r*k,cd.g*k,cd.b*k);}}
  for(let i=0;i<NS;i++){const a=d0+i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
const sailTexC={};
function sailTex(col,stripe,emb){const k=col+'|'+stripe+'|'+emb;return sailTexC[k]||(sailTexC[k]=canvasTex(128,128,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);
  if(stripe){g.fillStyle=stripe;for(let i=0;i<4;i++)g.fillRect(i*32+16,0,16,h);}g.fillStyle='rgba(0,0,0,.07)';for(let i=1;i<4;i++)g.fillRect(0,i*32,w,2);
  if(emb){g.textAlign='center';g.textBaseline='middle';g.font='78px serif';g.fillText(emb,64,70);}}));}
function sailMesh(w,h,tex){const g=new T.PlaneGeometry(w,h,6,4),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)/(w/2),y=p.getY(i)/(h/2);p.setZ(i,.75*(1-x*x)*(1-.5*y*y));}
  g.computeVertexNormals();return new T.Mesh(g,new T.MeshLambertMaterial({map:tex,color:tex?0xffffff:0xeeeeee,side:T.DoubleSide}));}
// o: {hull,trim,bot,sail,stripe,emb,guns,masts,rail,flag,cap}
function buildShip(o){const {L,W,H}=SH,rail=o.rail==null?.55:o.rail,g=new T.Group(),tilt=grp(g),p=[],wood=0x7a4a22,dk=0x2b2420;
  tilt.add(new T.Mesh(hullGeo(rail,o.hull,o.trim,o.bot||0x7a2a22),MVC2));
  p.push({g:G.box,p:[0,H+.45,-L*.34],s:[W*.74,.9,L*.26],c:o.hull},{g:G.box,p:[0,H+.93,-L*.34],s:[W*.8,.08,L*.27],c:0xc9975a},{g:G.box,p:[0,H+1.3,-L*.47],s:[W*.8,.08,.08],c:o.trim});
  for(const x of [-1,0,1])p.push({g:G.box,p:[x*.95,H+.35,-L*.47-.03],s:[.55,.42,.06],c:0xffe27a});
  for(const s of [1,-1])p.push({g:G.box,p:[s*W*.39,H+1.3,-L*.34],s:[.08,.08,L*.27],c:o.trim},{g:G.box,p:[s*W*.39,H+1.1,-L*.22],s:[.08,.45,.08],c:o.trim},{g:G.box,p:[s*W*.39,H+1.1,-L*.46],s:[.08,.45,.08],c:o.trim});
  p.push({g:cg(.06,.06,.8,6),p:[0,H+1.35,-L*.25],c:dk},{g:new T.TorusGeometry(.36,.05,6,12),p:[0,H+1.8,-L*.25+.08],c:wood});
  p.push({g:cg(.09,.13,4.2,6),p:[0,H+1.2,L*.5+.9],r:[1.15,0,0],c:wood});
  const mz=o.masts===3?[{z:3.7,h:9},{z:.2,h:10},{z:-3.1,h:7.5}]:o.masts===1?[{z:1,h:8.5}]:[{z:2.7,h:9.5},{z:-1.6,h:8.5}],sails=[];
  mz.forEach((m,i)=>{p.push({g:cg(.12,.19,m.h,8),p:[0,H+m.h/2,m.z],c:wood},{g:cg(.5,.38,.4,8),p:[0,H+m.h*.74,m.z],c:wood});
    const sl=[{y:2.1,w:W*1.22,h:m.h*.4},{y:2.3+m.h*.42,w:W*.86,h:m.h*.26}];
    sl.forEach((s,j)=>{p.push({g:cg(.07,.07,s.w+.5,6),p:[0,H+s.y+s.h,m.z+.12],r:[0,0,PI/2],c:wood});
      const sm=sailMesh(s.w,s.h,sailTex(o.sail,o.stripe,i===0&&j===0?o.emb:''));sm.position.set(0,H+s.y+s.h/2,m.z+.2);tilt.add(sm);sails.push(sm);});});
  const guns=[],n=o.guns;
  for(let i=0;i<n;i++){const z=n===1?0:lerp(-L*.2,L*.24,i/(n-1)),xg=hullX(z/(L/2),H+.4,rail);
    for(const s of [1,-1]){if(s===o.noSide)continue;p.push({g:cg(.15,.2,1.25,8),p:[s*(xg-.1),H+.4,z],r:[0,0,PI/2],c:0x23272d},{g:G.box,p:[s*(xg-.6),H+.2,z],s:[.6,.35,.5],c:wood});guns.push({side:s,x:s*(xg+.6),y:H+.4,z});}}
  tilt.add(new T.Mesh(mergeC(p),MVC));
  const m0=mz[mz.length>1?1:0],flag=new T.Mesh(new T.PlaneGeometry(1.6,.9).translate(.8,0,0),new T.MeshBasicMaterial({color:o.flag||0x111111,side:T.DoubleSide}));
  flag.position.set(0,H+m0.h+.1,m0.z);tilt.add(flag);
  let cap=null;
  if(o.cap){const hold=grp(tilt,0,H+.97,-L*.33);
    if(MK[o.cap]){const f=ZOO.fit(o.cap,o.cap==='penguin'?1.5:1.35);hold.add(f.g);addHat(g,f.a,.75);cap=f.a;}
    else{const hm=mkHuman(o.cap);hm.root.rotation.y=-PI/2;hm.root.scale.setScalar(.85);hold.add(hm.root);}}
  for(const z of o.crew||[]){const hm=mkHuman(pick(['rudy','czarny','human','baska']));hm.root.rotation.y=rnd(TAU);hm.root.scale.setScalar(.62);hm.root.position.set(rnd(-.9,.9),H,z);tilt.add(hm.root);}
  return {g,tilt,guns,sails,flag,cap};}

/* ---------- zapis, dane gry ---------- */
const SPECIALS=[
  {id:'fish',e:'🐟',n:'Plask wielką rybą',cost:0},
  {id:'star',e:'⭐',n:'Rozgwiazdy-shurikeny',cost:80},
  {id:'octo',e:'🐙',n:'Ośmiornica na głowę',cost:170},
  {id:'crab',e:'🦀',n:'Krab szczypawka',cost:260},
  {id:'puffer',e:'🐡',n:'Rozdymka-bomba',cost:400},
  {id:'shark',e:'🦈',n:'Rekin z wody!',cost:650}
];
const HEROES=[
  {id:'human',e:'🧒',n:'Pirat Junior',cost:0},{id:'penguin',e:'🐧',n:'Pingwin',cost:90},{id:'panda',e:'🐼',n:'Panda',cost:150},
  {id:'tiger',e:'🐯',n:'Tygrys',cost:220},{id:'kangaroo',e:'🦘',n:'Kangur',cost:300},{id:'lion',e:'🦁',n:'Lew',cost:400}
];
const UPS=[
  {k:'dmg',e:'💣',n:'Mocniejsze kule',max:5,c:45},{k:'guns',e:'💥',n:'Więcej armat',max:3,c:90},
  {k:'hull',e:'🛡️',n:'Gruby kadłub',max:5,c:40},{k:'sail',e:'⛵',n:'Lepsze żagle',max:5,c:35}
];
const EMO={penguin:'🐧',crocodile:'🐊',kangaroo:'🦘',panda:'🐼',tiger:'🐯',hippo:'🦛',lion:'🦁',elephant:'🐘',zebra:'🦓',rudy:'🧔',baska:'👩',czarny:'🏴‍☠️',human:'🧒'};
const LV=[
  {th:'day',cap:'penguin',name:'Kapitan Lodowy Dziób',flag:'sloop',esc:[]},
  {th:'tropic',cap:'rudy',name:'Rudobrody Rysiek',flag:'brig',esc:[]},
  {th:'sunset',cap:'crocodile',name:'Kapitan Kłapacz',flag:'brig',esc:['sloop']},
  {th:'day',cap:'kangaroo',name:'Skoczny Kuba',flag:'brig',esc:['sloop','sloop']},
  {th:'storm',cap:'baska',name:'Czarna Baśka',flag:'galleon',esc:['sloop']},
  {th:'tropic',cap:'panda',name:'Bambusowy Bolo',flag:'galleon',esc:['brig']},
  {th:'sunset',cap:'tiger',name:'Pręgowany Pazur',flag:'galleon',esc:['sloop','brig']},
  {th:'night',cap:'hippo',name:'Admirał Hipcio',flag:'galleon',esc:['brig','brig']},
  {th:'storm',cap:'czarny',name:'Czarnobrody Zbój',flag:'galleon',esc:['sloop','sloop','brig']},
  {th:'night',cap:'lion',name:'Król Mórz Lew Grzywa',flag:'galleon',esc:['brig','brig','sloop']},
  {th:'storm',cap:'elephant',name:'Wielki Trąbal',flag:'galleon',esc:['galleon','brig']}
];
const TYPES={
  sloop:{S:.78,hp:34,guns:2,dmg:4,sp:13.5,turn:1.15,masts:1},
  brig:{S:1,hp:60,guns:3,dmg:5,sp:12,turn:.95,masts:2},
  galleon:{S:1.28,hp:105,guns:4,dmg:6,sp:10.5,turn:.8,masts:3}
};
const KEY='piraci-v1',fresh=()=>({lvl:1,gold:0,up:{dmg:0,guns:0,hull:0,sail:0},wp:['wood'],wpSel:'wood',sp:['fish'],spSel:'fish',hero:['human'],heroSel:'human'});
let SAVE={kid:fresh(),dad:fresh()},kid=true,S=SAVE.kid;
try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d)for(const m of ['kid','dad'])if(d[m])SAVE[m]=Object.assign(fresh(),d[m],{up:Object.assign(fresh().up,d[m].up)});}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SAVE));}catch(e){}}
const lvDef=n=>LV[(n-1)%LV.length],lvQ=n=>1+.11*(n-1);

/* ---------- stan ---------- */
let mode='menu',paused=false,time=0,shake=0,hitStop=0;
let ships=[],balls=[],loot=[],islands=[],timers=[],P=null,flagship=null;
const ballPool=[],WORLD=250;
const worldG=grp(scene);                       // wyspy, łupy (ukrywane w pojedynku)
const later=(t,fn)=>timers.push({t,fn});
const cam={hd:0,fov:60,x:0,y:14,z:-20};
const _v=new T.Vector3();
function toScreen(x,y,z){_v.set(x,y,z).project(camera);return _v.z>1?null:[(_v.x*.5+.5)*W,(-_v.y*.5+.5)*H];}
function floater(txt,x,y,cls){const d=document.createElement('div');d.className='fl '+(cls||'');d.textContent=txt;d.style.left=x+'px';d.style.top=y+'px';$('floaters').appendChild(d);setTimeout(()=>d.remove(),900);}
function floatAt(txt,x,y,z,cls){const s=toScreen(x,y,z);if(s)floater(txt,s[0],s[1],cls);}
let msgT=0;
function msg(big,small,dur){const m=$('msg');m.hidden=false;m.innerHTML=(big?'<big>'+big+'</big>':'')+(small||'');m.style.animation='none';void m.offsetWidth;m.style.animation='';msgT=dur||3;}
function fadeTo(fn){const f=$('fade');f.style.opacity=1;setTimeout(()=>{fn();f.style.opacity=0;},360);}

/* ---------- wyspy ---------- */
function mkIsland(x,z,r){const p=[];p.push({g:G.lo,p:[0,-.4,0],s:[r,r*.2,r],c:0xf2d99a},{g:G.lo,p:[0,.5,0],s:[r*.62,r*.27,r*.62],c:0x58b24a});
  for(let i=0;i<4;i++){const a=rnd(TAU),s=rnd(1,2.4);p.push({g:G.lo,p:[Math.cos(a)*r*.86,.3,Math.sin(a)*r*.86],s:[s,s*.7,s],c:0x7f8790});}
  const n=2+(r/5|0);for(let i=0;i<n;i++){const a=rnd(TAU),d=rnd(0,r*.42),px=Math.cos(a)*d,pz=Math.sin(a)*d,h=rnd(4.5,6.5),by=r*.24;
    p.push({g:cg(.2,.32,h,6),p:[px,by+h/2,pz],r:[rnd(-.12,.12),0,rnd(-.12,.12)],c:0x9a6b3c});
    for(let j=0;j<6;j++){const b=j/6*TAU+a;p.push({g:G.lo,p:[px+Math.cos(b)*1.35,by+h-.15,pz+Math.sin(b)*1.35],s:[1.6,.13,.5],r:[0,-b,-.3],c:j%2?0x3f9e3a:0x2f8a34});}
    p.push({g:G.lo,p:[px+.2,by+h-.3,pz+.1],s:.22,c:0x5a3a1a});}
  const m=new T.Mesh(mergeC(p),MVC);m.position.set(x,0,z);worldG.add(m);islands.push({x,z,r:r*.92,m});}

/* ---------- okręty ---------- */
function mkShipEnt(o){const b=buildShip(o),S_=o.S||1;b.g.scale.setScalar(S_);scene.add(b.g);
  const e=Object.assign(b,{S:S_,x:o.x||0,z:o.z||0,hd:o.hd||0,vx:0,vz:0,sp:0,tr:0,heel:0,kick:0,boost:0,boostCd:0,sink:0,
    hp:o.hp,max:o.hp,dmg:o.dmg,spMax:o.sp,turn:o.turn,rl:[0,0],rlT:o.rlT||1.5,team:o.team,flagship:!!o.flagship,name:o.name||'',rng:o.rng||28,spread:o.spread||.03,
    L:SH.L*S_,W:SH.W*S_,smokeT:0,wakeT:0,side:pick([1,-1])});
  ships.push(e);return e;}
function shipPhys(s,thr,turn,dt){const mx=s.spMax*(s.boost>0?1.9:1);
  s.sp+=(thr*mx-s.sp)*Math.min(1,dt*(s.boost>0?2.6:.75));
  const tr=turn*s.turn*(.3+.7*Math.min(1,Math.abs(s.sp)/(s.spMax*.6)));s.tr=tr;s.hd-=tr*dt;
  const fx=Math.sin(s.hd),fz=Math.cos(s.hd),g=Math.min(1,dt*1.7);
  s.vx+=(fx*s.sp-s.vx)*g;s.vz+=(fz*s.sp-s.vz)*g;s.x+=s.vx*dt;s.z+=s.vz*dt;
  s.heel+=(tr*s.sp*.028-s.heel)*Math.min(1,dt*3);s.kick*=Math.exp(-dt*5);
  if(s.boost>0)s.boost-=dt;if(s.boostCd>0)s.boostCd-=dt;s.rl[0]-=dt;s.rl[1]-=dt;
  // wyspy
  for(const i of islands){const dx=s.x-i.x,dz=s.z-i.z,d=Math.hypot(dx,dz),m=i.r+s.W*.6;if(d<m){const k=(m-d)/d;s.x+=dx*k;s.z+=dz*k;if(Math.abs(s.sp)>5){hurtShip(s,3,s.x,1.5,s.z);if(s===P){shake=.4;}}s.sp*=.5;s.vx*=.4;s.vz*=.4;}}
  // kilwater
  s.wakeT-=dt*Math.abs(s.sp);if(s.wakeT<0){s.wakeT=.9;const y=seaH(s.x,s.z)+.12;
    for(const sd of [1,-1])P_.foam.add(s.x-fx*s.L*.42+fz*sd*s.W*.3,y,s.z-fz*s.L*.42-fx*sd*s.W*.3,fz*sd*1.2-fx,0,-fx*sd*1.2-fz,.6*s.S,2.4,0,2.6,.08);
    if(s.sp>7||s.boost>0)P_.water.add(s.x+fx*s.L*.46,y+.3,s.z+fz*s.L*.46,rnd(-2,2),rnd(2,4),rnd(-2,2),.35*s.S,.5,-14);}
}
function shipPose(s,dt){const fx=Math.sin(s.hd),fz=Math.cos(s.hd),a=s.L*.33,b=s.W*.4;
  const hb=seaH(s.x+fx*a,s.z+fz*a),hs=seaH(s.x-fx*a,s.z-fz*a),hl=seaH(s.x+fz*b,s.z-fx*b),hr=seaH(s.x-fz*b,s.z+fx*b);
  s.y=(hb+hs+hl+hr)/4*.8-s.sink;s.g.position.set(s.x,s.y,s.z);s.g.rotation.y=s.hd;
  s.tilt.rotation.x=-(hb-hs)/(a*2)*.8+(s.sinkRot||0);s.tilt.rotation.z=(hl-hr)/(b*2)*.5+s.heel+s.kick;
  const bl=.75+.35*Math.min(1,Math.abs(s.sp)/s.spMax)+(s.boost>0?.35:0);for(const m of s.sails)m.scale.z=bl+Math.sin(time*3+m.position.y)*.05;
  s.flag.rotation.y=PI/2+Math.sin(time*6+s.x)*.35;if(s.cap)ZOO.anim(s.cap,dt);
  // dym / ogień przy uszkodzeniach
  const k=s.hp/s.max;if(k<.55&&!s.gone){s.smokeT-=dt;if(s.smokeT<0){s.smokeT=k<.25?.07:.18;const ox=rnd(-1,1)*s.S,oz=rnd(-3,3)*s.S;
    P_.smoke.add(s.x+ox,s.y+3*s.S,s.z+oz,rnd(-.5,.5),rnd(2,4),rnd(-.5,.5),1*s.S,2.2,0,2.5);if(k<.3)P_.fire.add(s.x+ox,s.y+2.2*s.S,s.z+oz,rnd(-.6,.6),rnd(2,4),rnd(-.6,.6),.55*s.S,.5);}}}
function fire(s,side){const k=side>0?0:1;if(s.rl[k]>0||s.dead||s.disabled)return false;s.rl[k]=s.rlT;
  const nx=side*Math.cos(s.hd),nz=-side*Math.sin(s.hd);let tg=null,bd=1e9;
  for(const o of ships){if(o===s||o.dead||o.team===s.team||o.disabled)continue;const dx=o.x-s.x,dz=o.z-s.z,d=Math.hypot(dx,dz);if(d>78)continue;if((dx*nx+dz*nz)/d>.7&&d<bd){bd=d;tg=o;}}
  s.guns.filter(g=>g.side===side).forEach((g,i)=>later(i*.09+rnd(.04),()=>shoot(s,g,tg,nx,nz)));s.kick-=side*.1;return true;}
const GR=24,VH=46;
function shoot(s,g,tg,nx,nz){if(s.dead)return;const c=Math.cos(s.hd),sn=Math.sin(s.hd),x=s.x+(g.x*c+g.z*sn)*s.S,z=s.z+(-g.x*sn+g.z*c)*s.S,y=s.y+g.y*s.S;
  let dx=nx,dz=nz,d=40;
  if(tg){const t0=Math.hypot(tg.x-x,tg.z-z)/VH,ld=s===P?.95:(s.lead||.6),ax=tg.x+tg.vx*t0*ld-x,az=tg.z+tg.vz*t0*ld-z;d=Math.hypot(ax,az);dx=ax/d;dz=az/d;}
  const a=rnd(-s.spread,s.spread),ca=Math.cos(a),sa=Math.sin(a),ex=dx*ca-dz*sa,ez=dx*sa+dz*ca;d*=1+rnd(-s.spread,s.spread)*1.5;
  const t=Math.max(.25,d/VH),vy=GR*t/2+(s.y+1.3-y)/t;
  const m=ballPool.pop()||new T.Mesh(G.lo,M(0x16181c,{roughness:.5}));m.scale.setScalar(.3);scene.add(m);
  balls.push({m,x,y,z,vx:ex*VH,vy,vz:ez*VH,own:s,dmg:s.dmg,tr:0});
  for(let i=0;i<5;i++)P_.puff.add(x+ex*.8,y,z+ez*.8,ex*rnd(3,8)+rnd(-1,1),rnd(.5,2),ez*rnd(3,8)+rnd(-1,1),.7,1.1,0,2);
  P_.fire.add(x+ex*.6,y,z+ez*.6,ex*4,0,ez*4,.8,.14);
  const dd=Math.hypot(x-camera.position.x,z-camera.position.z);snd.cannon(clamp(1.2-dd/90,.15,1));if(s===P)shake=Math.max(shake,.25);}
function hurtShip(s,dmg,x,y,z){if(s.dead||s.disabled||mode!=='sea')return;if(s===P)dmg*=kid?.5:1;s.hp-=dmg;
  burst('wood',x,y,z,7,5,.22,.8,-16);burst('spark',x,y,z,4,4,.2,.3);
  if(s!==P)floatAt('-'+Math.round(dmg),x,y+2,z);else{shake=Math.max(shake,.5);}
  if(s.hp<=0){s.hp=0;if(s===P)playerSunk();else if(s.flagship)disableFlag(s);else sinkShip(s);}}
function sinkShip(s){s.dead=true;s.sinkT=0;snd.boom();burst('fire',s.x,s.y+2,s.z,16,6,.9,.7);burst('smoke',s.x,s.y+2,s.z,10,3,1.4,2,0,2);
  const gold=Math.round((14+6*S.lvl)*(.8+Math.random()*.4));later(1.2,()=>addLoot('chest',s.x,s.z,gold));if(Math.random()<.7)later(1.4,()=>addLoot('barrel',s.x+rnd(-5,5),s.z+rnd(-5,5)));
  msg('🫧 Zatopiony!','',1.6);if(s.el)s.el.hidden=true;}
function disableFlag(s){s.disabled=true;s.flag.material.color.set(0xffffff);snd.boom();burst('fire',s.x,s.y+2,s.z,14,6,.9,.7);
  for(const o of ships)if(o.team===1&&o!==s&&!o.dead)o.flee=true;
  msg('🏳️ Okręt kapitana pokonany!','Podpłyń do niego — ABORDAŻ! ⚔️',6);}
function playerSunk(){P.dead=true;P.sinkT=0;snd.boom();snd.lose();burst('fire',P.x,P.y+2,P.z,16,6,.9,.7);
  later(2.6,()=>showOver('🫧 Statek zatonął!','Kapitan '+lvDef(S.lvl).name+' śmieje się na cały ocean. Spróbuj jeszcze raz!','⛵ Jeszcze raz',()=>startLevel()));}

/* ---------- łupy ---------- */
function addLoot(kind,x,z,gold){const g=grp(worldG,x,0,z);
  if(kind==='chest'){box(M(0x8a5a2b),g,0,.35,0,1.5,.8,1);box(M(0xffc93c),g,0,.5,0,1.56,.14,1.06);ball(M(0xffc93c),g,0,.35,.52,.13);const l=mesh(cg(.5,.5,1.5,10,1),M(0x6e4220),g,0,.75,0);l.rotation.z=PI/2;l.scale.y=1;}
  else{mesh(cg(.6,.6,1.3,10),M(0x9a6b3c),g,0,.3,0).rotation.z=PI/2;for(const s of [-.4,.4])mesh(cg(.63,.63,.1,10),M(0x44474d),g,s,.3,0).rotation.z=PI/2;}
  g.scale.setScalar(1.3);loot.push({g,kind,x,z,gold:gold||0,ph:rnd(9)});}
function gainGold(n,x,y,z){S.gold+=n;save();snd.coin();floatAt('+'+n+' 🪙',x,y,z,'big');$('goldN').textContent=S.gold;}

/* ---------- zwierzęta morskie w tle ---------- */
const seaLife=[];
{const add=(o,q)=>{o.g.scale.setScalar(q.s);scene.add(o.g);seaLife.push(Object.assign(q,{o,th:rnd(TAU),ph:rnd(9),py:0}));};
  for(let i=0;i<3;i++)add(MORZE.makeDolphin(),{s:1.5,R:16+i*7,sp:10,leap:3,lf:3,y:-1.1});
  for(let i=0;i<3;i++)add(MORZE.makeShark(),{s:1.25,R:30+i*16,sp:5,y:-.42,dir:-1});
  add(MORZE.makeWhale(),{s:1,R:95,sp:3.5,y:-1.25});}
let lifeX=0,lifeZ=0;
function updLife(dt,cx,cz,vis){lifeX+=(cx-lifeX)*Math.min(1,dt*.6);lifeZ+=(cz-lifeZ)*Math.min(1,dt*.6);
  for(const q of seaLife){q.o.g.visible=vis;if(!vis)continue;const d=q.dir||1;q.th+=d*q.sp/q.R*dt;const x=lifeX+Math.cos(q.th)*q.R,z=lifeZ+Math.sin(q.th)*q.R;
    const lp=q.leap?Math.max(0,Math.sin(q.th*q.lf+q.ph))*q.leap:0,y=seaH(x,z)+q.y+lp,g=q.o.g;
    if(q.leap&&(q.py>.5)!==(lp>.5))splash(x,z,.7);q.py=lp;
    g.rotation.set(0,Math.atan2(-Math.sin(q.th)*d,Math.cos(q.th)*d),0);g.rotation.order='YXZ';g.rotation.x=q.leap?-Math.cos(q.th*q.lf+q.ph)*(lp>0?.7:0)*d:0;g.position.set(x,y,z);
    if(q.o.swim)q.o.swim(time*5+q.ph);}}

/* ---------- poziom ---------- */
function clearLevel(){for(const s of ships){scene.remove(s.g);if(s.el)s.el.remove();}ships=[];for(const b of balls){scene.remove(b.m);ballPool.push(b.m);}balls=[];
  for(const l of loot)worldG.remove(l.g);loot=[];for(const i of islands)worldG.remove(i.m);islands=[];timers=[];flagship=null;}
function mkPlayer(){const u=S.up;
  return mkShipEnt({hull:0x9a6230,trim:0xffc93c,bot:0x8a2a22,sail:'#fff6dc',stripe:'#e2483d',emb:(HEROES.find(h=>h.id===S.heroSel)||HEROES[0]).e,flag:0xe2483d,
    guns:2+u.guns,masts:2,cap:S.heroSel,crew:[1,3.4],hp:100+35*u.hull,dmg:9+3*u.dmg,sp:15+1.4*u.sail,turn:1.15+.06*u.sail,team:0,rlT:1.45,spread:.035});}
function startLevel(){clearLevel();const n=S.lvl,L_=lvDef(n),q=lvQ(n);setTheme(L_.th);mode='sea';paused=false;
  let seed=n*7.31;const sr=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
  for(let i=0;i<7;i++){const a=i/7*TAU+sr(),r=75+sr()*130;mkIsland(Math.cos(a)*r,Math.sin(a)*r,8+sr()*9);}
  P=mkPlayer();cam.hd=P.hd;
  const mk=(type,flag,i)=>{const t=TYPES[type],a=rnd(TAU),r=flag?105:rnd(70,120);let x=Math.cos(a)*r,z=Math.sin(a)*r;
    for(const il of islands)if(Math.hypot(x-il.x,z-il.z)<il.r+12){x+=24;z+=24;}
    const e=mkShipEnt({S:t.S*(flag?1.08:1),hull:flag?0x2b2622:0x5a4636,trim:flag?0xb02a2a:0x8a8f96,bot:0x3a1f1a,sail:flag?'#2a2a31':'#b9b3a6',stripe:flag?'#8a1f1f':'',emb:flag?'☠️':'',flag:0x111111,
      guns:t.guns+(flag&&n>6?1:0),masts:t.masts,cap:flag?L_.cap:null,crew:flag?[]:[1],hp:t.hp*q*(flag?1.25:1)*(kid?.8:1),dmg:t.dmg*q,sp:t.sp*(kid?.85:1),turn:t.turn,team:1,flagship:flag,name:flag?L_.name:'',
      x,z,hd:rnd(TAU),rlT:(kid?4.6:3.1)-Math.min(1,n*.08),rng:flag?27:24,spread:kid?.11:.06});
    e.lead=kid?.35:.75;e.type=type;
    const el=document.createElement('div');el.className='eb';el.innerHTML=(flag?'☠️ '+L_.name+' '+(EMO[L_.cap]||''):'')+'<div class="bar"><i></i></div>';$('ebs').appendChild(el);e.el=el;e.elBar=el.querySelector('i');return e;};
  flagship=mk(L_.flag,true);L_.esc.forEach((t,i)=>mk(t,false,i));
  for(let i=0;i<4;i++){const a=rnd(TAU),r=rnd(40,150);addLoot(i<3?'barrel':'chest',Math.cos(a)*r,Math.sin(a)*r,15+5*n);}
  $('ui').hidden=false;$('duel').hidden=true;$('start').hidden=true;$('lvlN').textContent=n;$('goldN').textContent=S.gold;showSea(true);
  msg('Poziom '+n,(EMO[L_.cap]||'🏴‍☠️')+' '+L_.name+(L_.esc.length?' i '+L_.esc.length+' okręt'+(L_.esc.length>1?'y':'')+' eskorty':'')+'<br>Zatop eskortę, pokonaj okręt ☠️ i wejdź na pokład!',5);}
function showSea(v){for(const s of ships)s.g.visible=v&&!s.gone;worldG.visible=v;$('ebs').style.display=v?'':'none';if(!v)$('arrow').hidden=true;}

/* ---------- sterowanie ---------- */
const keys={},inp={jx:0,jy:0,jid:null,jx0:0,jy0:0,charge:false};
addEventListener('keydown',e=>{if(e.repeat)return;keys[e.code]=1;
  if(mode==='sea'&&!paused){if(e.code==='KeyQ'||e.code==='KeyZ')doFire(1);if(e.code==='KeyE'||e.code==='KeyX'||e.code==='KeyC')doFire(-1);if(e.code==='Space'||e.code==='ShiftLeft')doBoost();}
  if(mode==='duel'&&!paused){if(e.code==='ArrowUp'||e.code==='KeyW')pAttack('hi');if(e.code==='ArrowDown'||e.code==='KeyS')pAttack('lo');if(e.code==='Enter'||e.code==='KeyF')pSpecial();if(e.code==='Tab'){e.preventDefault();swapSpecial();}}
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();});
addEventListener('keyup',e=>{keys[e.code]=0;});
const jz=$('jz'),joy=$('joy'),knob=joy.firstElementChild;
function joySet(x,y){const dx=x-inp.jx0,dy=y-inp.jy0,d=Math.hypot(dx,dy),m=52,k=d>m?m/d:1;inp.jx=dx*k/m;inp.jy=-dy*k/m;knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;}
jz.addEventListener('pointerdown',e=>{if(inp.jid!==null)return;inp.jid=e.pointerId;inp.jx0=e.clientX;inp.jy0=e.clientY;joy.style.left=e.clientX+'px';joy.style.top=e.clientY+'px';joySet(e.clientX,e.clientY);initAudio();});
addEventListener('pointermove',e=>{if(e.pointerId===inp.jid)joySet(e.clientX,e.clientY);});
const joyEnd=e=>{if(e.pointerId!==inp.jid)return;inp.jid=null;inp.jx=inp.jy=0;knob.style.transform='';joy.style.left=joy.style.top='';};
addEventListener('pointerup',joyEnd);addEventListener('pointercancel',joyEnd);
function press(id,fn,up){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();el.classList.add('dn');fn(e);});
  const u=()=>{el.classList.remove('dn');if(up)up();};el.addEventListener('pointerup',u);el.addEventListener('pointercancel',u);el.addEventListener('pointerleave',u);}
function doFire(side){if(mode!=='sea'||paused||!P||P.dead)return;if(!fire(P,side))snd.no();}
function doBoost(){if(mode!=='sea'||paused||!P||P.dead||P.boostCd>0)return;P.boost=1.7;P.boostCd=6;snd.wind();}
press('bL',()=>doFire(1));press('bR',()=>doFire(-1));press('bBoost',doBoost);
press('dHi',()=>pAttack('hi'));press('dLo',()=>pAttack('lo'));press('dSp',()=>pSpecial());press('dCh',()=>{inp.charge=true;},()=>{inp.charge=false;});press('dSw',()=>swapSpecial());
addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- bitwa morska ---------- */
function aiShip(e,dt){if(e.dead)return;if(e.disabled){shipPhys(e,0,0,dt);return;}
  const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz),brg=Math.atan2(dx,dz);let want,thr=.85;
  if(e.flee)want=brg+PI;
  else if(d>e.rng+14)want=brg;
  else{const a1=brg+PI/2,a2=brg-PI/2,k=clamp((d-e.rng)/14,-1,1)*.75;if(Math.abs(angd(a1,e.hd))<Math.abs(angd(a2,e.hd)))want=a1-k;else want=a2+k;thr=.7;}
  for(const i of islands){const ix=i.x-e.x,iz=i.z-e.z,id=Math.hypot(ix,iz);if(id<i.r+26){const ib=Math.atan2(ix,iz),df=angd(ib,e.hd);if(Math.abs(df)<1.2)want=e.hd-(df>=0?1:-1)*1.3;}}
  if(Math.hypot(e.x,e.z)>WORLD-25)want=Math.atan2(-e.x,-e.z);
  for(const o of ships)if(o!==e&&!o.dead&&o.team===1){const ox=o.x-e.x,oz=o.z-e.z,od=Math.hypot(ox,oz);if(od<16&&od>0){const df=angd(Math.atan2(ox,oz),e.hd);if(Math.abs(df)<1.3)want=e.hd-(df>=0?1:-1)*1.1;}}
  shipPhys(e,thr,-clamp(angd(want,e.hd)*2,-1,1),dt);
  if(!e.flee&&!P.dead&&d<e.rng+20)for(const sd of [1,-1]){const na=Math.atan2(sd*Math.cos(e.hd),-sd*Math.sin(e.hd));if(Math.abs(angd(brg,na))<.32)fire(e,sd);}}
function seaUpdate(dt){
  const menu=mode==='menu';
  // gracz
  if(P&&!P.dead){let jx=inp.jx,jy=inp.jy;if(keys.ArrowLeft||keys.KeyA)jx=-1;if(keys.ArrowRight||keys.KeyD)jx=1;if(keys.ArrowUp||keys.KeyW)jy=1;if(keys.ArrowDown||keys.KeyS)jy=-1;
    let thr=0;const act=Math.abs(jx)>.08||Math.abs(jy)>.08;if(act)thr=jy<-.45?-.25:clamp(.55+jy*.55,.45,1);if(P.boost>0)thr=1;
    if(menu){thr=.6;jx=.22;}
    shipPhys(P,thr,Math.abs(jx)<.08?0:jx,dt);
    const r=Math.hypot(P.x,P.z);if(r>WORLD){const k=(r-WORLD)/r;P.x-=P.x*k;P.z-=P.z*k;P.hd+=angd(Math.atan2(-P.x,-P.z),P.hd)*Math.min(1,dt*2);if(msgT<=0&&!menu)msg('','🌫️ Tam żyją smoki morskie… zawracamy!',2);}
    if(P.boost>0)P_.foam.add(P.x-Math.sin(P.hd)*6+rnd(-1.5,1.5),seaH(P.x,P.z)+.15,P.z-Math.cos(P.hd)*6+rnd(-1.5,1.5),0,0,0,.8,1.4,0,2.4,.08);}
  if(!menu)for(const e of ships)if(e.team===1)aiShip(e,dt);
  // zderzenia okrętów
  for(let i=0;i<ships.length;i++)for(let j=i+1;j<ships.length;j++){const a=ships[i],b=ships[j];if(a.dead||b.dead)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1,m=(a.L+b.L)*.3;
    if(d<m){const k=(m-d)/d*.5;a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k;const rv=Math.hypot(a.vx-b.vx,a.vz-b.vz);
      if(rv>5&&!(a.ramT>time)){a.ramT=b.ramT=time+.8;const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;snd.wood();
        if(a===P&&P.boost>0){hurtShip(b,14+rv*.6,mx,2,mz);hurtShip(a,2,mx,2,mz);floatAt('TARAN!',mx,5,mz,'big');}else{hurtShip(a,rv*.35,mx,2,mz);hurtShip(b,rv*.35,mx,2,mz);}
        a.sp*=.5;b.sp*=.5;if(a===P||b===P)shake=.6;}}}
  // zatapianie
  for(const s of ships){if(s.dead&&!s.gone){s.sinkT+=dt;s.sink=s.sinkT*s.sinkT*.55;s.sinkRot=Math.min(.5,s.sinkT*.13);s.sp*=.97;s.vx*=.97;s.vz*=.97;if(Math.random()<.4)P_.water.add(s.x+rnd(-3,3),seaH(s.x,s.z),s.z+rnd(-3,3),0,rnd(2,5),0,.4,.6,-10);
      if(s.sinkT>4.2){s.gone=true;s.g.visible=false;splash(s.x,s.z,2);}}
    if(!s.gone)shipPose(s,dt);}
  // kule
  for(let i=balls.length-1;i>=0;i--){const b=balls[i];b.vy-=GR*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.m.position.set(b.x,b.y,b.z);let done=false;
    b.tr-=dt;if(b.tr<0){b.tr=.035;P_.puff.add(b.x,b.y,b.z,0,0,0,.28,.35,0,1);}
    for(const s of ships){if(s===b.own||s.gone||s.team===b.own.team)continue;const dx=b.x-s.x,dz=b.z-s.z;if(Math.abs(dx)+Math.abs(dz)>s.L)continue;
      const c=Math.cos(s.hd),sn=Math.sin(s.hd),lx=dx*c-dz*sn,lz=dx*sn+dz*c;
      if(Math.abs(lx)<s.W*.5+.5&&Math.abs(lz)<s.L*.5+.4&&b.y<s.y+4.4*s.S&&b.y>s.y-1.2){done=true;snd.wood();hurtShip(s,b.dmg*rnd(.85,1.15),b.x,b.y,b.z);s.kick+=(lx>0?-1:1)*.06;break;}}
    if(!done)for(const il of islands)if(Math.hypot(b.x-il.x,b.z-il.z)<il.r&&b.y<3){done=true;burst('puff',b.x,b.y,b.z,6,3,.6,.8,0,2);break;}
    if(!done&&b.y<seaH(b.x,b.z)){done=true;splash(b.x,b.z,1.1);if(Math.hypot(b.x-P.x,b.z-P.z)<45)snd.splash();}
    if(done){scene.remove(b.m);ballPool.push(b.m);balls.splice(i,1);}}
  // łupy
  for(let i=loot.length-1;i>=0;i--){const l=loot[i];l.g.position.y=seaH(l.x,l.z)-.1;l.g.rotation.z=Math.sin(time*1.3+l.ph)*.18;l.g.rotation.y+=dt*.3;
    if(P&&!P.dead&&!menu&&Math.hypot(P.x-l.x,P.z-l.z)<P.L*.5+1.5){worldG.remove(l.g);loot.splice(i,1);
      if(l.kind==='chest')gainGold(l.gold||20,l.x,3,l.z);else{const h=Math.round(P.max*.3);P.hp=Math.min(P.max,P.hp+h);snd.ready();floatAt('+'+h+' ❤️',l.x,3,l.z,'big');}}}
  if(menu||!P)return;
  // abordaż
  if(flagship&&flagship.disabled&&!P.dead&&Math.hypot(P.x-flagship.x,P.z-flagship.z)<flagship.L*.5+P.L*.5+3){beginBoard();return;}
  // HUD
  $('hpP').style.width=clamp(P.hp/P.max*100,0,100)+'%';$('hpP').style.background=P.hp/P.max<.3?'linear-gradient(#ff9a8a,#e03a2a)':'';
  const hot=[false,false];
  for(const e of ships){if(e.team!==1||!e.el)continue;if(e.dead){e.el.hidden=true;continue;}const sc=toScreen(e.x,e.y+11*e.S,e.z);e.el.hidden=!sc;if(sc){e.el.style.left=sc[0]+'px';e.el.style.top=Math.max(48,sc[1])+'px';}
    e.elBar.style.width=clamp(e.hp/e.max*100,0,100)+'%';if(e.disabled){e.elBar.parentNode.hidden=true;}
    if(!e.disabled){const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d<78)for(const sd of [1,-1])if((dx*sd*Math.cos(P.hd)-dz*sd*Math.sin(P.hd))/d>.7)hot[sd>0?0:1]=true;}}
  [['bL',0],['bR',1]].forEach(([id,k])=>{const el=$(id);el.classList.toggle('hot',hot[k]&&P.rl[k]<=0);el.lastElementChild.style.height=clamp(P.rl[k]/P.rlT*100,0,100)+'%';});
  $('bBoost').lastElementChild.style.height=clamp(P.boostCd/6*100,0,100)+'%';
  // strzałka do celu
  let tg=flagship&&!flagship.dead?flagship:null;if(tg&&!tg.disabled){let bd=1e9;for(const e of ships)if(e.team===1&&!e.dead&&!e.flee){const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<bd){bd=d;tg=e;}}}
  const ar=$('arrow');if(tg){const sc=toScreen(tg.x,tg.y+4,tg.z),on=sc&&sc[0]>30&&sc[0]<W-30&&sc[1]>30&&sc[1]<H-30;ar.hidden=!!on;
    if(!on){const a=angd(Math.atan2(tg.x-P.x,tg.z-P.z),cam.hd),sx=-Math.sin(a),sy=-Math.cos(a),k=Math.min((W/2-40)/Math.abs(sx||1e-6),(H/2-60)/Math.abs(sy||1e-6));
      ar.style.left=W/2+sx*k+'px';ar.style.top=H/2+sy*k+'px';ar.style.transform=`rotate(${Math.atan2(sy,sx)}rad)`;ar.textContent=tg.disabled?'⚔️':'➤';if(tg.disabled)ar.style.transform='';}}else ar.hidden=true;
}
function seaCamera(dt){if(!P)return;const menu=mode==='menu';
  cam.hd+=angd(P.hd,cam.hd)*Math.min(1,dt*2.2);const hd=menu?time*.12:cam.hd,back=menu?30:28,up=menu?9:16,fx=Math.sin(hd),fz=Math.cos(hd);
  const tx=P.x-fx*back,tz=P.z-fz*back,k=Math.min(1,dt*5);cam.x+=(tx-cam.x)*k;cam.z+=(tz-cam.z)*k;cam.y+=(up+P.y*.5-cam.y)*k;
  camera.position.set(cam.x+rnd(-shake,shake),cam.y+rnd(-shake,shake),cam.z+rnd(-shake,shake));camera.lookAt(P.x+fx*6,2.5,P.z+fz*6);
  const fv=(menu?50:60)+(P.boost>0?9:0);if(Math.abs(camera.fov-fv)>.1){camera.fov+=(fv-camera.fov)*Math.min(1,dt*4);camera.updateProjectionMatrix();}}

/* ---------- pojedynek ---------- */
let D=null;const duelG=grp(scene);duelG.visible=false;
function mkFighter(kind,side,weapon){const g=new T.Group(),body=grp(g);let a,k;
  if(MK[kind]){a=MK[kind]();k=Math.min(3/a.dims.h,3.8/a.dims.len);const w=grp(body);w.scale.setScalar(k);w.add(a.root);a.root.position.x=-a.cx;addHat(g,a,.8);}
  else{a=mkHuman(kind);k=2.8/1.9;a.root.scale.setScalar(k);body.add(a.root);}
  const h=a.dims.h*k,len=a.dims.len*k,sw=grp(g);sw.add(mkWeapon(weapon));ball(M(0xf2c39a),sw,0,0,0,.13);
  if(side<0)g.rotation.y=PI;
  return {g,body,a,sw,h,len,side,swx:len*.28+.1,swz:side*(a.dims.hw*k+.28),bx:-side*(1.25+len/2),lx:0,py:.7,rz:-.4,px:0,tilt:0,st:'idle',t:0,guard:'hi',atk:'hi',en:0,kind};}
function beginBoard(){mode='board';snd.special();msg('⚔️ ABORDAŻ!','',2);fadeTo(startDuel);}
function startDuel(){const n=S.lvl,L_=lvDef(n),q=lvQ(n);while(duelG.children.length)duelG.remove(duelG.children[0]);
  mode='duel';paused=false;showSea(false);$('ui').hidden=true;$('duel').hidden=false;$('msg').hidden=true;
  const fx=flagship?flagship.x:0,fz=flagship?flagship.z:0;duelG.position.set(fx,0,fz);duelG.visible=true;
  const t=TYPES[L_.flag],ar=buildShip({hull:0x2b2622,trim:0xb02a2a,bot:0x3a1f1a,sail:'#2a2a31',stripe:'#8a1f1f',emb:'☠️',flag:0xffffff,guns:t.guns,masts:2,rail:.16,noSide:-1});
  ar.g.scale.setScalar(2.2);ar.g.rotation.y=PI/2;duelG.add(ar.g);
  const mine=buildShip({hull:0x9a6230,trim:0xffc93c,bot:0x8a2a22,sail:'#fff6dc',stripe:'#e2483d',emb:(HEROES.find(h=>h.id===S.heroSel)||HEROES[0]).e,flag:0xe2483d,guns:2+S.up.guns,masts:2,crew:[1,3.4,-1]});
  mine.g.position.set(3,0,-15);mine.g.rotation.y=PI/2+.12;mine.g.scale.setScalar(1.5);duelG.add(mine.g);
  const ring=grp(duelG,0,SH.H*2.2,2.3),wp=WEAPONS.find(w=>w.id===S.wpSel)||WEAPONS[0];
  const p=mkFighter(S.heroSel,1,wp.id),e=mkFighter(L_.cap,-1,['saber','rapier','anchor','trident'][(n-1)%4]);ring.add(p.g,e.g);
  p.hp=p.max=100;p.dmg=wp.dmg;e.hp=e.max=Math.round((72+24*n)*(kid?.7:1));e.dmg=(7+1.5*n)*(kid?.55:1);
  e.tele=kid?Math.max(.75,1.2-.03*n):Math.max(.42,.78-.035*n);e.cdA=kid?1.7:Math.max(.7,1.3-.05*n);e.cdB=kid?3:Math.max(1.3,2.2-.07*n);e.cd=2;e.gt=1.5;
  e.gA=kid?1.6:Math.max(.6,1.2-.05*n);e.react=kid?0:Math.min(.5,.08*n);e.hasSp=n>=3;
  D={p,e,ring,ar,mine,fx:[],time:0,over:false,name:L_.name,cap:L_.cap,swung:-9,chT:0,full:false};
  $('pName').textContent=(HEROES.find(h=>h.id===S.heroSel)||HEROES[0]).e+' Ty';$('eName').textContent=L_.name+' '+(EMO[L_.cap]||'');$('dSpE').textContent=(SPECIALS.find(s=>s.id===S.spSel)||SPECIALS[0]).e;
  $('dSw').hidden=S.sp.length<2;camera.fov=H>W?62:38;camera.updateProjectionMatrix();
  if(L_.cap==='lion'||L_.cap==='tiger')roar(.8);msg('⚔️ '+L_.name,'Bij tam, gdzie się nie zasłania. Strzałka nad wrogiem = wciśnij to samo (parada)!',3.2);}
const fSet=(f,st)=>{f.st=st;f.t=0;};
function headPos(f){return [f.g.position.x+f.side*f.len*.28,f.h*.92,0];}
function ringW(x,y,z){return _v.set(x,y,z).applyMatrix4(D.ring.matrixWorld);}
function dFloat(txt,f,cls){const w=ringW(f.g.position.x,f.h+.9,0);floatAt(txt,w.x,w.y,w.z,cls);}
function dBurst(kind,x,y,n,sp,s,life,g){const w=ringW(x,y,0);burst(kind,w.x,w.y,w.z,n,sp,s,life,g);}
function pAttack(type){if(!D||D.over||mode!=='duel'||paused)return;const p=D.p;if(p.st!=='idle'&&p.st!=='charge'&&!(p.st==='strike'&&p.t>.14))return;p.atk=type;p.wd=.14;fSet(p,'wind');snd.swish();
  const e=D.e;if(e.st==='idle'&&e.guard!==type&&Math.random()<e.react){e.guard=type;e.gt=e.gA;}}
function pSpecial(){if(!D||D.over||mode!=='duel'||paused)return;const p=D.p;if(p.en<100||(p.st!=='idle'&&p.st!=='charge')){snd.no();return;}p.en=0;D.full=false;fSet(p,'cast');snd.special();dFloat((SPECIALS.find(s=>s.id===S.spSel)||SPECIALS[0]).n+'!',p,'big');}
function swapSpecial(){if(S.sp.length<2)return;const own=SPECIALS.filter(s=>S.sp.includes(s.id)),i=own.findIndex(s=>s.id===S.spSel);S.spSel=own[(i+1)%own.length].id;save();$('dSpE').textContent=own[(i+1)%own.length].e;snd.tap();}
function damage(def,dmg,stag){if(D.over)return;const p=D.p;dmg=Math.round(dmg);def.hp-=dmg;hitStop=.06;shake=Math.max(shake,.25);snd.hit();dFloat('-'+dmg,def,def===p?'bad':'');
  dBurst('spark',def.g.position.x,def.h*.6,8,4,.16,.35);
  if(def.hp<=0){def.hp=0;koFighter(def);return;}
  if(stag){fSet(def,'stag');def.stagT=stag;}else if(!(def===D.e&&(def.st==='wind'||def.st==='tele'||def.st==='stag')))fSet(def,'hurt');
  if(def===D.e&&Math.random()<.6)def.guard=def.guard==='hi'?'lo':'hi';}
function resolve(att,def,type){if(D.over||def.st==='ko')return;const p=D.p,e=D.e;if(att===p)D.swung=D.time;
  const parry=()=>{snd.clang();dBurst('spark',0,p.h*.7,14,5,.18,.4);hitStop=.08;shake=.3;fSet(e,'stag');e.stagT=kid?1.5:1.1;p.en=Math.min(100,p.en+18);dFloat('PARADA!',p,'big');};
  if(att===p&&def.st==='wind'&&def.atk===type){parry();return;}
  if(att===e&&def.st==='wind'&&def.atk===type){parry();return;}
  if(att===e&&def.st==='strike'&&def.atk===type&&def.t<.2){parry();return;}
  if(def===e&&def.st==='idle'&&def.guard===type&&!e.noGuard){snd.clang();dBurst('spark',e.g.position.x-1,e.h*(type==='hi'?.8:.35),6,3,.14,.3);fSet(att,'block');att.en=Math.min(100,att.en+3);dFloat('blok',e);return;}
  let dm=att.dmg*rnd(.9,1.1);if(def.st==='charge')dm*=1.5;if(def.st==='stag')dm*=1.25;att.en=Math.min(100,att.en+7);damage(def,dm);}
function koFighter(f){D.over=true;fSet(f,'ko');f.vy=9;snd.boing();$('tele').hidden=true;hitStop=.15;shake=.6;
  later(1.5,()=>{const w=ringW(f.g.position.x,0,0);splash(w.x,w.z+6,2.2);snd.plusk();});
  later(2.6,()=>endDuel(f===D.e));}
function endDuel(win){const n=S.lvl;
  if(win){const g=40+22*n;S.gold+=g;S.lvl=n+1;save();snd.win();const nx=lvDef(n+1);
    showOver('🏆 Zwycięstwo!',D.name+' robi PLUSK! 💦<br>Łup: <b>+'+g+' 🪙</b><br>Następny: '+(EMO[nx.cap]||'')+' '+nx.name,'🏝️ Do portu',openShop,null);}
  else{snd.lose();showOver('💦 Plusk!',D.name+' wyrzucił cię za burtę. Rewanż?','⚔️ Rewanż!',()=>fadeTo(startDuel));}}
function fUpdate(f,dt){f.t+=dt;const p=D.p,e=D.e,o=f===p?e:p;
  switch(f.st){
    case 'wind':if(f.t>=f.wd){fSet(f,'strike');if(f===e)snd.swish();resolve(f,o,f.atk);}break;
    case 'strike':if(f.t>=.24)fSet(f,'idle');break;
    case 'block':if(f.t>=.4)fSet(f,'idle');break;
    case 'hurt':if(f.t>=.3)fSet(f,'idle');break;
    case 'stag':if(f.t>=f.stagT)fSet(f,'idle');break;
    case 'cast':if(f.t>=.3){fSet(f,'idle');launch(S.spSel);}break;
    case 'tele':if(f.t>=f.wd){fSet(f,'idle');enemyThrow();}break;
    case 'charge':f.en=Math.min(100,f.en+(f===p?52:38)*dt);if(Math.random()<dt*14)dBurst('magic',f.g.position.x+rnd(-.6,.6),rnd(0,f.h),1,1.5,.14,.6,3);
      if(f===p){D.chT-=dt;if(D.chT<0){D.chT=.11;snd.charge(f.en);}if(!inp.charge&&!keys.Space)fSet(f,'idle');}else if(f.t>=f.chT)fSet(f,'idle');break;
    case 'ko':f.vy-=20*dt;f.g.position.y+=f.vy*dt;f.g.position.x-=f.side*5*dt;f.g.position.z+=4*dt;f.g.rotation.z+=dt*9*f.side;return;
  }
  // poza
  let lx=0,py,rz,px=0,tl=0,sq=1;const hi=f.st==='idle'?f.guard==='hi':f.atk==='hi';
  switch(f.st){
    case 'wind':{const k=Math.min(1,f.t/Math.min(f.wd,.3));lx=-.3*k;if(hi){py=.98;rz=.95*k;}else{py=.3;rz=-PI/2;px=-.5*k;}if(f===e)tl=Math.sin(f.t*40)*.03+.08;break;}
    case 'strike':lx=1.05;if(hi){py=.62;rz=-2;}else{py=.3;rz=-PI/2;px=.75;}tl=-.12;break;
    case 'block':lx=-.25;py=.7;rz=.5;tl=.15;break;
    case 'hurt':lx=-.55;py=.6;rz=.3;tl=.3;break;
    case 'stag':lx=-.35;py=.35;rz=-2.7;tl=.18+Math.sin(f.t*13)*.12;break;
    case 'charge':py=.95;rz=Math.sin(f.t*20)*.12;sq=1+Math.sin(f.t*18)*.05;break;
    case 'cast':py=1;rz=1.1-f.t*8;lx=.3;break;
    case 'tele':py=1;rz=1.1;lx=-.3;tl=.1+Math.sin(f.t*40)*.03;break;
    default:py=hi?.8:.34;rz=hi?-.45:-1.95;lx=Math.sin(D.time*2.2+f.side)*.07;
  }
  const k1=Math.min(1,dt*(f.st==='strike'?32:16));f.lx+=(lx-f.lx)*k1;f.py+=(py-f.py)*k1;f.rz+=(rz-f.rz)*k1;f.px+=(px-f.px)*k1;f.tilt+=(tl-f.tilt)*Math.min(1,dt*14);
  f.g.position.x=f.bx+f.side*f.lx;f.g.position.y=f.st==='strike'&&hi?Math.sin(Math.min(1,f.t/.24)*PI)*.35:Math.abs(Math.sin(D.time*2.2+f.side))*.04;
  f.body.rotation.z=f.tilt;f.body.scale.set(1/sq,sq,1/sq);f.sw.position.set(f.swx+f.px,f.py*f.h*.8,f.swz);f.sw.rotation.z=f.rz;
  if(f.a.human){f.a.t+=dt;f.a.head.rotation.z=Math.sin(f.a.t*2)*.05;}else{f.a.moving=f.st==='strike'||f.st==='wind';ZOO.anim(f.a,dt);}}
function enemyAI(dt){const e=D.e,p=D.p;if(e.st!=='idle')return;e.gt-=dt;if(e.gt<0){e.gt=rnd(e.gA,e.gA*1.8);e.guard=e.guard==='hi'?'lo':'hi';}
  e.cd-=dt;if(e.cd>0)return;e.cd=rnd(e.cdA,e.cdB);const r=Math.random();
  if(e.en>=100&&e.hasSp){e.en=0;e.wd=kid?1.2:.9;fSet(e,'tele');snd.warn();}
  else if(r<(e.hasSp?.2:.12)&&e.en<100){e.chT=1.4;fSet(e,'charge');}
  else{e.atk=Math.random()<.5?'hi':'lo';e.wd=e.tele;fSet(e,'wind');snd.warn();}}
// lot po łuku w układzie ringu
function arc(o,a,b,k,hgt){o.position.set(lerp(a[0],b[0],k),lerp(a[1],b[1],k)+Math.sin(k*PI)*hgt,lerp(a[2],b[2],k));}
function enemyThrow(){const e=D.e,p=D.p,o=MORZE.makeCrab();o.g.scale.setScalar(2.2);D.ring.add(o.g);const a=[e.g.position.x-1,e.h*.9,0];let t=0,back=false,T_=kid?1.15:.8;
  D.fx.push(dt=>{t+=dt;const k=t/T_;o.g.rotation.x+=dt*12;
    if(!back){arc(o.g,a,[p.g.position.x,p.h*.55,0],Math.min(1,k),2);
      if(k>.45&&D.time-D.swung<.22){back=true;t=0;T_=.4;snd.clang();dFloat('ODBITE!',p,'big');dBurst('spark',p.g.position.x+1,p.h*.6,10,4,.16,.35);return false;}
      if(k>=1){D.ring.remove(o.g);if(!D.over){damage(p,e.dmg*1.6,.8);dFloat('🦀 Au!',p,'bad');}return true;}}
    else{arc(o.g,[p.g.position.x+1,p.h*.6,0],[e.g.position.x,e.h*.6,0],Math.min(1,k),1.2);if(k>=1){D.ring.remove(o.g);if(!D.over)damage(e,p.dmg*1.6,1.2);return true;}}
    return false;});}
function launch(id){const p=D.p,e=D.e,R=D.ring,base=p.dmg*1.6+6,from=[p.g.position.x+1,p.h*.95,0],tgt=()=>[e.g.position.x,e.h*.6,0],hd=()=>{const h=headPos(e);h[1]=e.h*.98;return h;};let t=0;
  if(id==='fish'){const o=MORZE.makeClown();o.g.scale.setScalar(5.5);R.add(o.g);let n=0;
    D.fx.push(dt=>{t+=dt;if(o.swim)o.swim(t*20,1);if(t<.3){arc(o.g,from,hd(),t/.3,1.5);o.g.rotation.y=PI/2;}
      else{const k=(t-.3)/.26,ph=Math.sin(k*PI);const h=hd();o.g.position.set(h[0]-1.2+ph*1.2,h[1]-.3,(n%2?-1:1)*(1-ph)*1.4);o.g.rotation.y=PI/2+(n%2?-1:1)*(1-ph)*1.2;
        if(k>=.5&&!o.hit){o.hit=1;snd.slap();if(!D.over)damage(e,base*.5,1.6);dFloat('PLASK!',e,'big');}if(k>=1){n++;o.hit=0;t=.3;}}
      if(n>=3||D.over&&t>.6){R.remove(o.g);return true;}return false;});}
  else if(id==='star'){for(let i=0;i<3;i++){const o=mkStar();o.scale.setScalar(1.3);o.visible=false;R.add(o);let tt=-i*.2;
      D.fx.push(dt=>{tt+=dt;if(tt<0)return false;o.visible=true;o.rotation.z-=dt*25;const k=tt/.28;const b=tgt();arc(o,from,[b[0],e.h*(.4+i*.2),0],Math.min(1,k),.3);
        if(k>=1){R.remove(o);snd.clang();if(!D.over)damage(e,base*.5,.5);return true;}return false;});}}
  else if(id==='octo'){const o=MORZE.makeOcto();o.g.scale.setScalar(1.25);R.add(o.g);
    D.fx.push(dt=>{t+=dt;o.react(true,dt,D.time);if(t<.5){arc(o.g,from,hd(),t/.5,2.5);o.g.rotation.z-=dt*10;}
      else{if(!o.hit){o.hit=1;o.g.rotation.z=0;snd.slap();if(!D.over){damage(e,base*.7,3.6);dFloat('🐙 Nic nie widzę!',e,'big');}}const h=hd();o.g.position.set(h[0],h[1]-.5+Math.sin(t*9)*.05,0);o.g.rotation.y=Math.sin(t*5)*.3;
        if(!D.over&&e.st==='stag'&&Math.random()<dt*4)dBurst('water',h[0],h[1],2,2,.15,.5,-9);}
      if(t>4.1||D.over&&t>1){R.remove(o.g);return true;}return false;});}
  else if(id==='crab'){const o=MORZE.makeCrab();o.g.scale.setScalar(2.4);R.add(o.g);let tick=0;e.noGuard=true;
    D.fx.push(dt=>{t+=dt;o.walk(t*14);if(t<.45){arc(o.g,from,tgt(),t/.45,2);o.g.rotation.x+=dt*14;}
      else{o.g.rotation.x=0;const b=tgt();o.g.position.set(b[0]-e.side*-.2,e.h*.45+Math.abs(Math.sin(t*10))*.15,.5);
        if(t-.45>tick*.7&&tick<6){tick++;snd.tap();if(!D.over){damage(e,base*.3);dFloat('SZCZYP!',e);e.g.position.y+=.3;}}}
      if(tick>=6&&t>4.9||D.over&&t>1){R.remove(o.g);e.noGuard=false;return true;}return false;});}
  else if(id==='puffer'){const o=MORZE.makePuffer();o.g.scale.setScalar(3);o.g.rotation.y=PI/2;R.add(o.g);
    D.fx.push(dt=>{t+=dt;const k=t/.75;o.puff(1,dt);arc(o.g,from,tgt(),Math.min(1,k),2.2);o.g.rotation.z+=dt*6;
      if(k>=1){R.remove(o.g);snd.boom();const b=tgt();dBurst('spark',b[0],b[1],26,8,.25,.6);dBurst('puff',b[0],b[1],12,4,.8,.9);shake=.8;if(!D.over){damage(e,base*2.1,1.3);dFloat('BUM!',e,'big');}return true;}return false;});}
  else{const o=MORZE.makeShark();o.g.scale.setScalar(1.7);o.g.rotation.order='YXZ';R.add(o.g);const dk=-SH.H*2.2;
    {const w=ringW(e.g.position.x,dk,-9);later(.01,()=>{splash(w.x,w.z,2.5);snd.plusk();});}
    D.fx.push(dt=>{t+=dt;const k=t/1.15;o.swim(t*14);o.g.position.set(e.g.position.x,lerp(dk-1,dk-1,k)+Math.sin(k*PI)*(-dk+e.h*.9),lerp(-9,8,k));o.g.rotation.x=-Math.cos(k*PI)*1;
      if(k>=.5&&!o.hit){o.hit=1;snd.hit();shake=1;if(!D.over){damage(e,base*2.8,1.6);dFloat('🦈 CHAPS!',e,'big');}}
      if(k>=1){R.remove(o.g);const w=ringW(e.g.position.x,dk,8);splash(w.x,w.z,2.5);snd.plusk();return true;}return false;});}}
function duelUpdate(dt){const p=D.p,e=D.e;D.time+=dt;
  duelG.position.y=Math.sin(time*.9)*.25;duelG.rotation.z=Math.sin(time*.7)*.02;
  D.mine.g.position.y=Math.sin(time*1.1+2)*.3;D.mine.g.rotation.z=Math.sin(time*.8)*.03;
  for(const s of [D.ar,D.mine]){for(const m of s.sails)m.scale.z=.7+Math.sin(time*2+m.position.y)*.06;s.flag.rotation.y=PI/2+Math.sin(time*6)*.35;}
  if(!D.over){if((inp.charge||keys.Space)&&p.st==='idle'&&p.en<100)fSet(p,'charge');enemyAI(dt);}
  fUpdate(p,dt);fUpdate(e,dt);D.ring.updateMatrixWorld(true);
  for(let i=D.fx.length-1;i>=0;i--)if(D.fx[i](dt))D.fx.splice(i,1);
  // HUD
  $('pHp').style.width=p.hp/p.max*100+'%';$('eHp').style.width=e.hp/e.max*100+'%';$('pEn').style.width=p.en+'%';$('eEn').style.width=e.en+'%';
  const full=p.en>=100;if(full&&!D.full)snd.ready();D.full=full;$('pEnB').classList.toggle('full',full);$('eEnB').classList.toggle('full',e.en>=100);$('dSp').classList.toggle('off',!full);$('dSp').classList.toggle('hot',full);
  const tl=$('tele'),warn=!D.over&&(e.st==='wind'||e.st==='tele');tl.hidden=!warn;
  if(warn){const h=headPos(e),w=ringW(h[0],e.h+1.1,0),sc=toScreen(w.x,w.y,w.z);if(sc){tl.style.left=sc[0]+'px';tl.style.top=sc[1]+'px';}tl.textContent=e.st==='tele'?'❗':e.atk==='hi'?'⬆️':'⬇️';}
  $('dHi').classList.toggle('hot',kid&&warn&&e.st==='wind'&&e.atk==='hi');$('dLo').classList.toggle('hot',kid&&warn&&e.st==='wind'&&e.atk==='lo');
  // kamera
  const wide=W/H,dist=wide>1.5?11.5:wide>1?15:24;_v.set(rnd(-shake,shake),SH.H*2.2+3+rnd(-shake,shake),dist).add(duelG.position);camera.position.copy(_v);camera.lookAt(duelG.position.x,SH.H*2.2+1.9,duelG.position.z+2);}

/* ---------- port (sklep) i ekrany ---------- */
function showOver(t,p,a,fa,fb){paused=true;$('ovT').innerHTML=t;$('ovP').innerHTML=p;$('ovA').innerHTML=a;$('ovA').onclick=()=>{$('over').hidden=true;paused=false;fa();};
  const b=$('ovB');b.hidden=fb===null;b.onclick=()=>{$('over').hidden=true;openShop();};$('over').hidden=false;}
function openShop(){paused=true;mode='menu';duelG.visible=false;D=null;$('duel').hidden=true;$('ui').hidden=true;$('tele').hidden=true;clearLevel();P=mkPlayer();setTheme(lvDef(S.lvl).th);showSea(true);
  camera.fov=50;camera.updateProjectionMatrix();renderShop();$('shop').hidden=false;}
function renderShop(){$('shopGold').textContent=S.gold;$('shopLvl').textContent=S.lvl;const g=$('shopG');let h='<h3>⛵ Statek</h3>';
  for(const u of UPS){const l=S.up[u.k],mx=l>=u.max,c=u.c*(l+1);h+=`<button class="it ${mx?'max':S.gold<c?'no':''}" data-t="up" data-id="${u.k}"><big>${u.e}</big>${u.n}<small>poziom ${l}/${u.max}</small><u>${mx?'MAX':c+' 🪙'}</u></button>`;}
  const sec=(title,list,own,sel,t)=>{h+='<h3>'+title+'</h3>';for(const w of list){const o=S[own].includes(w.id),s=S[sel]===w.id;
    h+=`<button class="it ${s?'sel':!o&&S.gold<w.cost?'no':''}" data-t="${t}" data-id="${w.id}"><big>${w.e}</big>${w.n}${w.dmg?'<small>siła '+w.dmg+'</small>':''}<u>${s?'✔ wybrane':o?'wybierz':w.cost+' 🪙'}</u></button>`;}};
  sec('⚔️ Broń do pojedynków',WEAPONS,'wp','wpSel','wp');sec('🐙 Morskie zwierzaki (atak specjalny)',SPECIALS,'sp','spSel','sp');sec('🏴‍☠️ Kapitan',HEROES,'hero','heroSel','hero');g.innerHTML=h;}
$('shopG').addEventListener('click',e=>{const b=e.target.closest('.it');if(!b)return;initAudio();const t=b.dataset.t,id=b.dataset.id;
  if(t==='up'){const u=UPS.find(x=>x.k===id),l=S.up[id],c=u.c*(l+1);if(l>=u.max||S.gold<c){snd.no();return;}S.gold-=c;S.up[id]++;snd.coin();}
  else{const list=t==='wp'?WEAPONS:t==='sp'?SPECIALS:HEROES,w=list.find(x=>x.id===id),own=t,sel=t+'Sel';
    if(!S[own].includes(id)){if(S.gold<w.cost){snd.no();return;}S.gold-=w.cost;S[own].push(id);snd.coin();}else snd.tap();S[sel]=id;}
  save();renderShop();if(t==='up'||t==='hero'){clearLevel();P=mkPlayer();}});
$('bSail').onclick=()=>{initAudio();goFS();$('shop').hidden=true;fadeTo(startLevel);};
function begin(k){kid=k;S=SAVE[k?'kid':'dad'];initAudio();goFS();try{screen.orientation.lock('landscape').catch(()=>{});}catch(e){}
  $('start').hidden=true;if(S.lvl>1||S.gold>0)openShop();else{startLevel();if(!localStorage.getItem(KEY+'-help')){try{localStorage.setItem(KEY+'-help','1');}catch(e){}}}}
$('bKid').onclick=()=>begin(true);$('bDad').onclick=()=>begin(false);
$('sKid').textContent='poziom '+SAVE.kid.lvl;$('sDad').textContent='poziom '+SAVE.dad.lvl;
let helpWas=false;
$('bHelp').onclick=()=>{helpWas=paused;paused=true;$('help').hidden=false;};$('bHelpX').onclick=()=>{$('help').hidden=true;paused=helpWas;};
$('bMus').onclick=()=>{initAudio();muted=!muted;if(master)master.gain.value=muted?0:1;$('bMus').textContent=muted?'🔇':'🔊';};
$('bFs').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else goFS();};

/* ---------- pętla ---------- */
function resize(){W=innerWidth;H=innerHeight;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
let last=performance.now();
function frame(now){const raw=(now-last)/1000;last=now;let dt=Math.min(.05,Math.max(0,raw));time+=dt;seaT+=dt;U.uT.value=seaT;MORZE.U.uTime.value=time;
  shake*=Math.exp(-dt*7);if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').hidden=true;}
  let gdt=dt;if(hitStop>0){hitStop-=dt;gdt=0;}
  if(!paused||mode==='menu'){
    for(let i=timers.length-1;i>=0;i--){const t=timers[i];t.t-=gdt;if(t.t<=0){timers.splice(i,1);t.fn();}}
    if(mode==='sea'||mode==='menu'||mode==='board'){if(mode!=='board')seaUpdate(gdt);seaCamera(dt);}
    else if(mode==='duel'&&D)duelUpdate(gdt);}
  updLife(dt,mode==='duel'?duelG.position.x:P?P.x:0,mode==='duel'?duelG.position.z-30:P?P.z:0,true);
  for(const k in P_)P_[k].up(dt);
  // deszcz, błyskawice
  if(theme.rain){const c=camera.position;for(let i=0;i<rainA.length;i++){const r=rainA[i];r[1]-=dt*55;if(r[1]<0){r[1]=rnd(30,42);r[0]=rnd(-40,40);r[2]=rnd(-40,40);}dum.position.set(c.x+r[0],r[1],c.z+r[2]);dum.rotation.set(0,0,.15);dum.scale.set(.05,1.6,.05);dum.updateMatrix();rainIM.setMatrixAt(i,dum.matrix);}rainIM.instanceMatrix.needsUpdate=true;
    boltT-=dt;if(boltT<0){boltT=rnd(6,15);flash=1;if(AC)snd.thunder();}}
  if(flash>0){flash-=dt*4;amb.intensity=.18+Math.max(0,flash)*2.2;}else amb.intensity=.18;
  const c=camera.position;sky.position.copy(c);water.position.set(Math.round(c.x/5)*5,0,Math.round(c.z/5)*5);
  renderer.render(scene,camera);requestAnimationFrame(frame);}
setTheme(lvDef(S.lvl).th);P=mkPlayer();cam.x=P.x;cam.z=P.z-30;
requestAnimationFrame(frame);
