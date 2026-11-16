// silnik — wspólne dla: pralnia, arka
// wymaga z gry: AC, G, P, T, cgC, lgC, mats, mesh, mus, nbuf, sfx
'use strict';

// --- util
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const pick=a=>a[Math.random()*a.length|0];
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);

// --- three
function canvasTex(w,h,draw,o){o=o||{};try{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');if(!g)return null;draw(g,w,h);const t=new T.CanvasTexture(cv);if(o.repeat){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(o.repeat[0],o.repeat[1]);}t.anisotropy=4;return t;}catch(e){return null;}}
function M(c,o){const k=c+(o?JSON.stringify(o):'');return mats[k]||(mats[k]=new T.MeshStandardMaterial(Object.assign({color:c,roughness:.78,metalness:0},o||{})));}
function MT(tex,fallback,o){return new T.MeshStandardMaterial(Object.assign({color:tex?0xffffff:fallback,map:tex,roughness:.8},o||{}));}
function cg(rt,rb,h,seg){seg=seg||14;const k=rt+','+rb+','+h+','+seg;return cgC[k]||(cgC[k]=new T.CylinderGeometry(rt,rb,h,seg));}
const ball=(m,par,x,y,z,sx,sy,sz)=>mesh(G.sph,m,par,x,y,z,sx,sy,sz);
const box=(m,par,x,y,z,sx,sy,sz)=>mesh(G.box,m,par,x,y,z,sx,sy,sz);
function grp(par,x,y,z){const g=new T.Group();g.position.set(x||0,y||0,z||0);if(par)par.add(g);return g;}
function merge(parts){const pos=[],nor=[],uv=[],m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),nm=new T.Matrix3(),v=V();
  for(const p of parts){const g=p.g.index?p.g.toNonIndexed():p.g;const r=p.r||[0,0,0];e.set(r[0],r[1],r[2]);q.setFromEuler(e);const s=p.s===undefined?[1,1,1]:(typeof p.s==='number'?[p.s,p.s,p.s]:p.s);const t=p.p||[0,0,0];
    m.compose(V(t[0],t[1],t[2]),q,V(s[0],s[1],s[2]));nm.getNormalMatrix(m);const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;
    for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);if(U)uv.push(U.getX(i),U.getY(i));else uv.push(0,0);}}
  const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(pos,3));out.setAttribute('normal',new T.Float32BufferAttribute(nor,3));out.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return out;}
function flat(key,pts,depth,bev,poly){if(lgC[key])return lgC[key];const sh=new T.Shape();sh.moveTo(pts[0][0],pts[0][1]);if(poly){for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);sh.closePath();}else sh.splineThru(pts.slice(1).concat([pts[0]]).map(p=>new T.Vector2(p[0],p[1])));
  const g=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:!!bev,bevelThickness:bev||0,bevelSize:bev||0,bevelSegments:2,curveSegments:10});g.translate(0,0,-depth/2);return lgC[key]=g;}
function mergeC(parts){const g=merge(parts),col=[];for(const p of parts){const n=p.g.index?p.g.index.count:p.g.attributes.position.count,c=new T.Color(p.c);for(let i=0;i<n;i++)col.push(c.r,c.g,c.b);}g.setAttribute('color',new T.Float32BufferAttribute(col,3));return g;}

// --- audio
function nloop(type,fr,q){const s=AC.createBufferSource();s.buffer=nbuf;s.loop=true;const f=AC.createBiquadFilter();f.type=type;f.frequency.value=fr;f.Q.value=q;const g=AC.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(sfx);s.start();return {g,f};}
function tone(f,d,type,v,f2,dl){if(!AC)return;const t=AC.currentTime+(dl||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(sfx);o.start(t);o.stop(t+d+.05);}
function nz(d,v,fr,type,f2,dl){if(!AC)return;const t=AC.currentTime+(dl||0),s=AC.createBufferSource();s.buffer=nbuf;s.loop=true;const f=AC.createBiquadFilter();f.type=type||'bandpass';f.frequency.setValueAtTime(fr,t);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+d);const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(sfx);s.start(t);s.stop(t+d+.05);}
function sw(type,pts,d,v,lp,trem,dl){if(!AC)return;const t=AC.currentTime+(dl||0),o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type=type;f.type='lowpass';f.frequency.value=lp;o.frequency.setValueAtTime(pts[0][1],t);for(const p of pts)o.frequency.linearRampToValueAtTime(p[1],t+p[0]*d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.05);g.gain.setValueAtTime(v,t+d*.7);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(f);f.connect(g);
  if(trem){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=trem;lg.gain.value=v*.5;l.connect(lg);lg.connect(g.gain);l.start(t);l.stop(t+d);}
  g.connect(sfx);o.start(t);o.stop(t+d+.05);}
function roar(v){if(!AC)return;const t=AC.currentTime,d=1.7,out=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(500,t);lp.frequency.linearRampToValueAtTime(1500,t+.45);lp.frequency.exponentialRampToValueAtTime(350,t+d);
  const ws=AC.createWaveShaper(),cv=new Float32Array(256);for(let i=0;i<256;i++)cv[i]=Math.tanh((i/128-1)*4);ws.curve=cv;const pre=AC.createGain();pre.gain.value=.5;
  for(const q of [['sawtooth',1,.5],['sawtooth',1.51,.25],['square',.5,.4]]){const o=AC.createOscillator(),og=AC.createGain();o.type=q[0];o.frequency.setValueAtTime(72*q[1],t);o.frequency.linearRampToValueAtTime(118*q[1],t+.4);o.frequency.exponentialRampToValueAtTime(52*q[1],t+d);og.gain.value=q[2];o.connect(og);og.connect(pre);o.start(t);o.stop(t+d+.1);}
  const ns=AC.createBufferSource();ns.buffer=nbuf;ns.loop=true;const nf=AC.createBiquadFilter();nf.type='bandpass';nf.frequency.value=700;nf.Q.value=.8;const ng=AC.createGain();ng.gain.value=.5;ns.connect(nf);nf.connect(ng);ng.connect(pre);ns.start(t);ns.stop(t+d+.1);
  const fl=AC.createGain();fl.gain.value=.65;const lfo=AC.createOscillator(),lg=AC.createGain();lfo.type='sawtooth';lfo.frequency.setValueAtTime(34,t);lfo.frequency.linearRampToValueAtTime(20,t+d);lg.gain.value=.35;lfo.connect(lg);lg.connect(fl.gain);lfo.start(t);lfo.stop(t+d+.1);
  pre.connect(ws);ws.connect(fl);fl.connect(lp);const f1=AC.createBiquadFilter();f1.type='peaking';f1.frequency.value=620;f1.Q.value=1.2;f1.gain.value=9;lp.connect(f1);f1.connect(out);
  out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(.3*v,t+.35);out.gain.setValueAtTime(.3*v,t+.8);out.gain.exponentialRampToValueAtTime(.0001,t+d);out.connect(sfx);}
function mnote(t,f,d,type,v){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(mus);o.start(t);o.stop(t+d+.03);}

// --- ui
function goFS(){const el=document.documentElement,f=el.requestFullscreen||el.webkitRequestFullscreen;if(f&&!document.fullscreenElement&&!document.webkitFullscreenElement){try{const p=f.call(el,{navigationUI:'hide'});if(p&&p.catch)p.catch(()=>{});}catch(e){}}
  try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(()=>{});}catch(e){}}
