// Zwierzęta „słodziaki” (z Pralni Zoo) — samodzielny moduł z własnymi helperami, działa w każdej grze z three.js.
// ZOO.MK.elephant() → a = {root, body, head, legs, ears, …} (głowa w +x); ZOO.anim(a, dt) animuje (a.moving = idzie).
// ZOO.cfg: scale (skala wszystkich), cast (cienie; false = tylko bryły ciała).
const ZOO = (() => {
'use strict';
const T=THREE,PI=Math.PI,cfg={scale:1,cast:true};
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const pick=a=>a[Math.random()*a.length|0];
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
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
const mats={};
const G={sph:new T.SphereGeometry(1,22,16),lo:new T.SphereGeometry(1,10,8),box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,14)};
G.sphX=new T.SphereGeometry(1,22,16);G.sphX.rotateZ(PI/2);
const cgC={};
function mesh(g,m,par,x,y,z,sx,sy,sz){const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);if(sx!==undefined)o.scale.set(sx,sy===undefined?sx:sy,sz===undefined?sx:sz);o.castShadow=cfg.cast;if(par)par.add(o);return o;}
const texGir=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#f7e3b1';g.fillRect(0,0,w,h);g.fillStyle='#b8672a';for(let gy=0;gy<6;gy++)for(let gx=0;gx<6;gx++){const cx=(gx+.5+(gy%2?.5:0))*w/6+rnd(-5,5),cy=(gy+.5)*h/6+rnd(-5,5);g.beginPath();for(let i=0;i<7;i++){const an=i/7*6.283+rnd(-.25,.25),r=rnd(13,18);const px=cx+Math.cos(an)*r,py=cy+Math.sin(an)*r;i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();}},{repeat:[1,1]});
const texZeb=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#fbfbfb';g.fillRect(0,0,w,h);g.fillStyle='#1d1d24';for(let i=0;i<8;i++){const y0=i*h/8;g.beginPath();g.moveTo(0,y0+3);for(let x=0;x<=w;x+=16)g.lineTo(x,y0+3+Math.sin(x/w*6.283*2+i)*4);for(let x=w;x>=0;x-=16)g.lineTo(x,y0+h/16+5+Math.sin(x/w*6.283*3+i*2)*3);g.closePath();g.fill();}},{repeat:[1,1]});
const mW=M(0xffffff,{roughness:.3}),mK=M(0x16161d,{roughness:.3});
const MV=new T.MeshStandardMaterial({vertexColors:true,roughness:.8});
const lgC={};
let giMat=null;
let zeMat=null;
let crScute=null,crTU=null,crTL=null;
let liTuft=null,liWh=null;
const texTig=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#1b1410';for(let i=0;i<9;i++){const y0=i*h/9;for(let k=0;k<3;k++){const x0=rnd(w),len=rnd(60,150),bend=rnd(-4,4);for(const off of [0,-w]){g.beginPath();g.moveTo(x0+off,y0+6);g.quadraticCurveTo(x0+off+len/2,y0-2+bend,x0+off+len,y0+7);g.quadraticCurveTo(x0+off+len/2,y0+16,x0+off,y0+6);g.fill();}}}},{repeat:[1,1]});
const FOOT=[[-.15,0],[-.05,.14],[.2,.2],[.42,.17],[.24,.1],[.5,.05],[.28,0],[.5,-.05],[.24,-.1],[.42,-.17],[.2,-.2],[-.05,-.14]];
let whG=null;
let tiMat=null;
const LEGS4=(fx,bx,z)=>[[fx,z,0],[fx,-z,PI],[bx,z,PI],[bx,-z,0]];
function legs(a,b,pos,y,build){for(const [x,z,ph] of pos){const p=grp(b,x,y,z);build(p,Math.sign(z),x>0);a.legs.push({p,ph});}}

function loft(key,secs,top,belly,o){if(lgC[key])return lgC[key];o=o||{};const sub=o.sub||4,seg=o.seg||16,n=secs.length,us=o.uvs||[1,1];
  const val=(s,j)=>j===4?(s[4]===undefined?s[2]:s[4]):s[j];
  const cr=(a,b,c,d,t)=>.5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t*t+(3*b-a-3*c+d)*t*t*t);
  const Pp=[];for(let i=0;i<n-1;i++){const s0=secs[Math.max(0,i-1)],s1=secs[i],s2=secs[i+1],s3=secs[Math.min(n-1,i+2)];for(let k=0;k<sub;k++){const t=k/sub,r=[];for(let j=0;j<5;j++)r.push(cr(val(s0,j),val(s1,j),val(s2,j),val(s3,j),t));Pp.push(r);}}
  Pp.push([0,1,2,3,4].map(j=>val(secs[n-1],j)));
  const N=Pp.length,pos=[],uv=[],col=[],idx=[],ct=new T.Color(top===undefined?0xffffff:top),cb=new T.Color(belly===undefined?(top===undefined?0xffffff:top):belly),R=seg+1;
  for(let i=0;i<N;i++){const a=Pp[Math.max(0,i-1)],b=Pp[Math.min(N-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;const nx=-ty,ny=tx,p=Pp[i];
    for(let j=0;j<=seg;j++){const th=j/seg*6.2832,c=Math.cos(th),s=Math.sin(th),r=Math.max(.001,c>0?p[2]:p[4])*c;pos.push(p[0]+nx*r,p[1]+ny*r,Math.max(.001,p[3])*s);uv.push(j/seg*us[0],i/(N-1)*us[1]);const w=clamp((-c-.2)/.5,0,1);col.push(lerp(ct.r,cb.r,w),lerp(ct.g,cb.g,w),lerp(ct.b,cb.b,w));}}
  for(let i=0;i<N-1;i++)for(let j=0;j<seg;j++){const a=i*R+j,b=a+1,c=a+R,d=c+1;idx.push(a,c,b,b,c,d);}
  for(const e of [0,N-1]){const ci=pos.length/3,p=Pp[e];pos.push(p[0],p[1],0);uv.push(.5*us[0],e?us[1]:0);col.push(ct.r,ct.g,ct.b);for(let j=0;j<seg;j++){const a=e*R+j;if(e)idx.push(a,ci,a+1);else idx.push(a,a+1,ci);}}
  // make sure faces point outwards
  {const i=N>>1,j=seg>>2,a=i*R+j,b=a+1,c=a+R,A=V(pos[a*3],pos[a*3+1],pos[a*3+2]),B=V(pos[c*3],pos[c*3+1],pos[c*3+2]),C=V(pos[b*3],pos[b*3+1],pos[b*3+2]);const nz=B.sub(A).cross(C.sub(A)).z;if(nz<0)for(let k=0;k<idx.length;k+=3){const t=idx[k+1];idx[k+1]=idx[k+2];idx[k+2]=t;}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const nn=g.attributes.normal;for(let i=0;i<N;i++){const a=i*R,b=a+seg,x=nn.getX(a)+nn.getX(b),y=nn.getY(a)+nn.getY(b),z=nn.getZ(a)+nn.getZ(b),l=Math.hypot(x,y,z)||1;nn.setXYZ(a,x/l,y/l,z/l);nn.setXYZ(b,x/l,y/l,z/l);}
  return lgC[key]=g;}
function base(type){const root=new T.Group(),body=grp(root);return {type,root,body,legs:[],ears:[],eyes:[],trunk:[],ctail:[],spots:[],t:rnd(10),ph:0,seed:rnd(6),gait:9,swing:.45,jumpT:0,tickle:0,blown:0,blowT:0,open:0,blink:rnd(1,4),patience:1,state:'new',st:-1,done:0,hatPop:1,headBase:0,moving:false,eat:false,eatK:0,lookA:.12};}
function eye(a,par,x,y,z,r,o){o=o||{};const s=Math.sign(z)||1,g=grp(par,x,y,z);ball(o.col?M(o.col,{roughness:.3}):mW,g,0,0,0,r);const pz=s*r*.55,px=r*.5;
  if(o.slit)box(mK,g,px*1.3,0,pz*1.25,r*.3,r*1.3,r*.45);else{ball(mK,g,px,0,pz,r*.62);ball(mW,g,px+r*.32,r*.3,pz+s*r*.36,r*.2);}
  if(o.lash)for(let i=0;i<3;i++){const l=mesh(cg(.014,.014,r*1.1,5),mK,g,-r*.25+i*r*.45,r*1.05,s*r*.55);l.rotation.z=.5-i*.5;l.rotation.x=s*.5;}
  g.traverse(q=>{q.userData.nd=1;});a.eyes.push(g);return g;}
function finish(a,s){a.root.scale.setScalar(s*cfg.scale);a.root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(a.root);a.dims={x0:b.min.x,x1:b.max.x,h:b.max.y,hw:b.max.z,len:b.max.x-b.min.x};a.cx=(b.min.x+b.max.x)/2;a.hit=[];a.root.traverse(o=>{if(!o.isMesh)return;if(!o.userData.nd)a.hit.push(o);if(!cfg.cast)o.castShadow=!!o.material.vertexColors;});return a;}
function mkElephant(){const a=base('elephant'),C=0x93a0b8,Cb=0xaab6ca,sk=M(C,{roughness:.8}),dk=M(0x7b88a0),pk=M(0xf0b3c0),nl=M(0xe6ebf2),b=a.body;
  mesh(loft('elB',[[-1.95,2.15,.05,.05],[-1.8,2.2,.75,.7],[-1.2,2.3,1.05,1.0,1.1],[-.3,2.3,1.1,1.1,1.25],[.6,2.35,1.1,1.05,1.15],[1.2,2.45,.95,.9,.95],[1.6,2.5,.6,.6],[1.75,2.5,.05,.05]],C,Cb),MV,b);
  const lg=loft('elL',[[0,.3,.05,.05],[0,.1,.5,.45],[0,-.5,.42,.4],[0,-1.0,.36,.36],[0,-1.4,.4,.4],[0,-1.58,.44,.44],[0,-1.62,.05,.05]],C);
  legs(a,b,LEGS4(.95,-1.15,.6),1.62,p=>{mesh(lg,MV,p);for(let i=-1;i<=1;i++)ball(nl,p,.38,-1.5,i*.2,.1,.1,.09);});
  const h=a.head=grp(b,1.6,2.75,0);
  mesh(loft('elH',[[-.5,.1,.05,.05],[-.35,.15,.7,.62],[.15,.2,.85,.72],[.55,-.05,.7,.6],[.8,-.4,.45,.42],[.9,-.7,.36,.36]],C),MV,h);
  ball(pk,h,.5,-.8,0,.26,.12,.24);
  const eg=flat('elE',[[0,.5],[-.5,.78],[-1.05,.5],[-1.22,-.1],[-1.0,-.75],[-.55,-1.05],[-.15,-.7],[.02,-.2]],.08,.04);
  const tg=loft('elT',[[0,0,.1,.1],[.25,-.3,.1,.1],[.6,-.45,.08,.08],[.95,-.38,.05,.05],[1.12,-.22,.012,.012]],0xfff4d6,undefined,{seg:8});
  for(const s of [1,-1]){const e=grp(h,-.15,.3,s*.66);e.rotation.y=-s*.35;mesh(eg,sk,e,0,0,s*.06);mesh(eg,pk,e,-.06,-.02,-s*.03,.82,.82,.5);a.ears.push({p:e,base:-s*.35,s});
    mesh(tg,MV,h,.62,-.5,s*.4);eye(a,h,.5,.2,s*.56,.12,{lash:1});}
  let par=h,r=.35;for(let i=0;i<9;i++){const g=grp(par,i?0:.9,i?.32:-.7,0);g.userData.b=i===0?-2.6:(i<5?-.1:.3);g.rotation.z=g.userData.b;const r2=r*.9;mesh(cg(r2,r,.32,12),sk,g,0,.16,0);ball(sk,g,0,.32,0,r2);a.trunk.push(g);par=g;r=r2;}
  a.tail=grp(b,-1.9,2.5,0);a.tail.rotation.z=-.3;mesh(cg(.05,.035,1.1,6),dk,a.tail,0,-.55,0);ball(M(0x4a5266),a.tail,0,-1.15,0,.09,.2,.05);
  a.hat=grp(h,.1,1.02,0);a.hatS=1.05;a.gait=6.5;a.swing=.32;return finish(a,.95);}
function mkGiraffe(){const a=base('giraffe');giMat=giMat||MT(texGir,0xe3ad55,{vertexColors:true});giMat.userData.tx='gir';const Cc=0xf7e3b1,W=undefined,tan=M(0xdca04c),cream=M(Cc),br=M(0x8a4f1f),dk=M(0x4a3222),b=a.body;
  mesh(loft('giB',[[-1.25,2.75,.05,.05],[-1.1,2.8,.5,.42],[-.6,2.9,.72,.58,.75],[0,3.0,.78,.62,.85],[.6,3.15,.8,.6,.85],[1.0,3.3,.6,.5,.6],[1.2,3.4,.05,.05]],W,Cc,{uvs:[2,1.2]}),giMat,b);
  const l1=loft('giL1',[[0,.25,.05,.05],[0,.05,.26,.2],[0,-.6,.17,.14],[0,-1.25,.115,.1],[0,-1.4,.14,.12],[0,-1.5,.05,.05]],W,W,{uvs:[.5,.8]}),l2=loft('giL2',[[0,-1.3,.05,.05],[0,-1.4,.135,.115],[0,-1.55,.1,.09],[0,-2.3,.085,.08],[0,-2.5,.1,.1],[0,-2.55,.05,.05]],Cc);
  legs(a,b,LEGS4(.75,-.85,.3),2.7,p=>{mesh(l1,giMat,p);mesh(l2,MV,p);mesh(cg(.11,.14,.2),dk,p,0,-2.6,0);});
  const nk=a.neck=grp(b,.9,3.45,0);a.neckBase=-.38;nk.rotation.z=-.38;
  mesh(loft('giN',[[0,-.75,.05,.05],[0,-.5,.5,.42],[0,0,.46,.38],[0,.8,.34,.28],[0,1.6,.27,.22],[0,2.3,.23,.2],[0,2.55,.18,.17]],W,W,{uvs:[1,1.6]}),giMat,nk);
  mesh(flat('giM',[[-.44,0],[-.56,0],[-.44,.8],[-.37,1.6],[-.33,2.4],[-.2,2.4],[-.24,1.6],[-.3,.8],[-.4,0]],.07,0,1),br,nk);
  const h=a.head=grp(nk,0,2.45,0);a.headBase=.22;
  mesh(loft('giH',[[-.3,.05,.05,.05],[-.2,.08,.28,.25],[.1,.1,.32,.27,.28],[.4,.03,.24,.21,.22],[.7,-.03,.2,.19,.18],[.9,-.05,.17,.17,.15],[.98,-.05,.04,.04]],W,W,{uvs:[1,.5]}),giMat,h);
  mesh(loft('giZ',[[.5,-.02,.05,.05],[.6,-.02,.235,.215,.2],[.75,-.04,.21,.2,.18],[.92,-.05,.175,.175,.155],[1.0,-.05,.04,.04]],Cc),MV,h);
  const eg=flat('leafE',[[0,0],[-.18,.12],[-.42,.1],[-.2,-.06]],.04,.02);
  for(const s of [1,-1]){ball(dk,h,.97,.04,s*.07,.03);mesh(cg(.05,.06,.3,8),br,h,-.02,.5,s*.12);ball(dk,h,-.02,.67,s*.12,.08);const e=grp(h,-.12,.24,s*.2);e.rotation.y=s*.8;mesh(eg,tan,e,0,0,0);a.ears.push({p:e,base:s*.8,s});eye(a,h,.18,.14,s*.22,.085,{lash:1});}
  a.tail=grp(b,-1.2,2.95,0);a.tail.rotation.z=-.3;mesh(cg(.05,.035,1.2,6),tan,a.tail,0,-.6,0);ball(dk,a.tail,0,-1.3,0,.08,.24,.05);
  a.hat=grp(h,-.02,.72,0);a.hatS=.62;a.gait=6;a.swing=.38;return finish(a,.86);}
function mkZebra(){const a=base('zebra');zeMat=zeMat||MT(texZeb,0xf2f2f2,{vertexColors:true});zeMat.userData.tx='zeb';const W=undefined,wh=M(0xfafafa),bk=M(0x1d1d24),b=a.body;
  mesh(loft('zeB',[[-1.3,1.85,.05,.05],[-1.15,1.9,.55,.45],[-.7,1.95,.72,.6,.72],[0,1.85,.66,.6,.75],[.6,1.9,.7,.58,.78],[1.0,2.0,.55,.45,.6],[1.2,2.05,.05,.05]],W,W,{uvs:[1,1.3]}),zeMat,b);
  const lg=loft('zeL',[[0,.25,.05,.05],[0,.05,.28,.2],[0,-.5,.18,.15],[0,-.8,.13,.12],[0,-.9,.125,.11],[0,-1.3,.09,.085],[0,-1.42,.11,.105],[0,-1.46,.05,.05]],W,W,{uvs:[1,.9]});
  legs(a,b,LEGS4(.75,-.85,.3),1.6,p=>{mesh(lg,zeMat,p);mesh(cg(.12,.15,.18),bk,p,0,-1.51,0);});
  const nk=a.neck=grp(b,.85,2.2,0);a.neckBase=-.7;nk.rotation.z=-.7;
  mesh(loft('zeN',[[0,-.6,.05,.05],[0,-.35,.5,.4],[0,0,.46,.36],[0,.5,.34,.27],[0,1.0,.28,.24],[0,1.25,.22,.2]],W,W,{uvs:[1,.7]}),zeMat,nk);
  mesh(flat('zeM',[[-.42,-.1],[-.62,0],[-.52,.5],[-.44,1.0],[-.38,1.35],[-.2,1.3],[-.26,1.0],[-.32,.5],[-.42,0]],.08,0,1),bk,nk);
  const h=a.head=grp(nk,0,1.15,0);a.headBase=.1;
  mesh(loft('zeH',[[-.32,.05,.05,.05],[-.2,.06,.3,.26],[.1,.08,.33,.27,.3],[.45,.02,.25,.22],[.75,-.02,.2,.2],[.95,-.03,.19,.2],[1.02,-.03,.05,.05]],W,W,{uvs:[1,.6]}),zeMat,h);
  mesh(loft('zeZ',[[.68,-.02,.05,.05],[.78,-.02,.205,.205],[.95,-.03,.2,.21],[1.05,-.03,.05,.05]],0x1d1d24),MV,h);ball(bk,h,-.02,.36,0,.12,.12,.08);
  const eg=flat('zeE',[[0,0],[.1,.2],[.02,.42],[-.1,.2]],.04,.02);
  for(const s of [1,-1]){const e=grp(h,-.12,.28,s*.18);e.rotation.x=s*.35;mesh(eg,wh,e);a.ears.push({p:e,base:0,bx:s*.35,s,ax:'x'});eye(a,h,.15,.12,s*.23,.085,{lash:1});}
  a.tail=grp(b,-1.3,2.0,0);a.tail.rotation.z=-.4;mesh(cg(.05,.04,.6,6),wh,a.tail,0,-.3,0);ball(bk,a.tail,0,-.85,0,.08,.3,.05);
  a.hat=grp(h,-.02,.42,0);a.hatS=.66;a.gait=10;return finish(a,.9);}
function mkHippo(){const a=base('hippo'),C=0xa18bb0,Cp=0xf2b8c6,sk=M(C,{roughness:.8}),pk=M(Cp),dk=M(0x7d6a8c),iv=M(0xfff4d6,{roughness:.35}),b=a.body;
  mesh(loft('hiB',[[-1.8,1.45,.05,.05],[-1.65,1.45,.7,.7],[-1.0,1.5,1.0,1.05,1.0],[0,1.45,1.02,1.1,1.05],[.9,1.5,.98,1.02,1.0],[1.5,1.55,.75,.8,.75],[1.75,1.55,.05,.05]],C,Cp),MV,b);
  const lg=loft('hiL',[[0,.3,.05,.05],[0,.1,.45,.42],[0,-.4,.38,.36],[0,-.75,.36,.36],[0,-.86,.4,.4],[0,-.9,.05,.05]],C);
  legs(a,b,LEGS4(.95,-1.0,.58),.9,p=>{mesh(lg,MV,p);for(let i=-1;i<=1;i++)ball(pk,p,.34,-.8,i*.18,.08,.08,.07);});
  const h=a.head=grp(b,1.55,1.7,0);
  mesh(loft('hiH',[[-.6,0,.05,.05],[-.45,.02,.6,.62],[0,.05,.72,.74,.65],[.5,0,.6,.7,.5],[.95,-.05,.52,.78,.38],[1.3,-.05,.5,.8,.35],[1.5,-.08,.3,.6,.25],[1.56,-.08,.05,.05]],C),MV,h);
  for(const s of [1,-1]){ball(sk,h,1.32,.36,s*.32,.16);ball(dk,h,1.4,.47,s*.32,.055);ball(sk,h,-.05,.6,s*.4,.2);eye(a,h,.03,.68,s*.48,.1,{lash:1});
    const e=grp(h,-.4,.62,s*.42);ball(sk,e,0,.1,0,.11,.17,.09);ball(pk,e,.05,.1,0,.06,.11,.07);a.ears.push({p:e,base:0,s,fast:9});}
  const j=a.jaw=grp(h,.1,-.3,0);mesh(loft('hiJ',[[0,-.05,.05,.05],[.2,-.08,.2,.6,.28],[.8,-.1,.16,.74,.3],[1.3,-.1,.14,.74,.28],[1.45,-.1,.05,.05]],C,Cp),MV,j);ball(M(0xd9667c),j,.8,.03,0,.6,.05,.62);for(const s of [1,-1])mesh(cg(.07,.09,.3,8),iv,j,1.2,.18,s*.4);
  a.tail=grp(b,-1.75,1.75,0);a.tail.rotation.z=-.4;mesh(cg(.07,.05,.4,6),sk,a.tail,0,-.2,0);ball(dk,a.tail,0,-.45,0,.04,.12,.12);
  a.hat=grp(h,-.05,.78,0);a.hatS=.9;a.gait=7.5;a.swing=.35;return finish(a,.92);}
function mkCroc(){const a=base('crocodile'),C=0x5fae4a,Cb=0xeee7a8,gr=M(C,{roughness:.8}),dk=M(0x3f7a35),b=a.body;
  mesh(loft('crB',[[-1.5,.62,.3,.4,.28],[-1.3,.62,.4,.52,.34],[-.6,.64,.46,.66,.4],[.2,.62,.44,.64,.4],[.9,.62,.38,.52,.34],[1.3,.64,.3,.42,.28],[1.5,.64,.05,.05]],C,Cb),MV,b);
  if(!crScute){const ps=[];for(let i=0;i<10;i++)for(const z of [-.18,.18]){const x=-1.3+i*.28,y=.62+.46*Math.sqrt(Math.max(.25,1-(x/1.9)*(x/1.9)))-.05;ps.push({g:G.cone,p:[x,y+.06,z],s:[.09,.2,.09]});}crScute=merge(ps);
    const tu=[],tl=[];for(const s of [1,-1]){for(let i=0;i<7;i++){const x=.55+i*.19;tu.push({g:G.cone,p:[x,-.17,s*(.3-i*.012)],s:[.032,.13,.032],r:[PI,0,0]});}for(let i=0;i<6;i++){const x=.6+i*.2;tl.push({g:G.cone,p:[x,.0,s*(.26-i*.01)],s:[.03,.12,.03]});}}crTU=merge(tu);crTL=merge(tl);}
  mesh(crScute,dk,b);
  const lg=loft('crL',[[0,.12,.05,.05],[0,0,.2,.18],[0,-.3,.16,.15],[0,-.5,.12,.12],[0,-.54,.04,.04]],C,C,{seg:10}),fg=flat('crF',[[-.15,0],[-.05,.14],[.2,.2],[.42,.17],[.24,.1],[.5,.05],[.28,0],[.5,-.05],[.24,-.1],[.42,-.17],[.2,-.2],[-.05,-.14]],.05,.02,1);
  legs(a,b,LEGS4(.9,-.9,.5),.52,(p,s)=>{const t=grp(p);t.rotation.x=-s*.7;mesh(lg,MV,t);const f=mesh(fg,dk,p,.05,-.47,s*.36);f.rotation.x=-PI/2;});
  let par=grp(b,-1.42,.62,0),k0=1;for(let i=0;i<7;i++){const g=i?grp(par,-.42,0,0):par,k1=1-(i+1)*.13;mesh(loft('crT'+i,[[.1,0,.32*k0+.02,.4*k0*k0+.02,.28*k0+.02],[-.2,0,.32*(k0+k1)/2+.02,.4*(k0*k0+k1*k1)/2+.02,.28*(k0+k1)/2+.02],[-.44,0,.32*k1+.02,.4*k1*k1+.02,.28*k1+.02]],C,Cb,{seg:10,sub:2}),MV,g);mesh(G.cone,dk,g,-.2,.32*(k0+k1)/2,0,.07,.24,.05);a.ctail.push(g);par=g;k0=k1;}
  const h=a.head=grp(b,1.4,.68,0),iw=M(0xffffff);
  mesh(loft('crH',[[-.45,0,.05,.05],[-.3,0,.34,.44,.2],[.1,.04,.36,.46,.18],[.5,-.02,.2,.34,.12],[1.1,-.04,.15,.28,.1],[1.6,-.04,.15,.27,.1],[1.8,-.05,.1,.2,.08],[1.86,-.05,.03,.05]],C),MV,h);
  for(const s of [1,-1]){ball(gr,h,1.7,.1,s*.1,.07);ball(gr,h,.05,.34,s*.24,.17);eye(a,h,.1,.4,s*.29,.1,{col:0xffe45c,slit:1});}
  mesh(crTU,iw,h);const j=a.jaw=grp(h,.05,-.1,0);mesh(loft('crJ',[[0,-.1,.05,.05],[.2,-.12,.08,.38,.14],[.6,-.12,.07,.3,.12],[1.6,-.1,.06,.25,.1],[1.8,-.1,.03,.05]],Cb),MV,j);ball(M(0xf08fa0),j,.9,-.06,0,.7,.02,.2);mesh(crTL,iw,j);
  a.hat=grp(h,.05,.42,0);a.hatS=.75;a.gait=11;a.swing=.5;return finish(a,.84);}
function mkLion(){const a=base('lion'),C=0xe3ab4d,Cl=0xf6dca6,Cm=0x7d4317,tw=M(C,{roughness:.8}),lt=M(Cl),mn2=M(0xa85c22),ns=M(0x5a2f22),b=a.body;
  mesh(loft('liB',[[-1.3,1.6,.05,.05],[-1.15,1.6,.5,.42],[-.7,1.62,.62,.52,.6],[0,1.6,.55,.5,.55],[.6,1.65,.68,.56,.72],[1.0,1.75,.55,.48,.6],[1.2,1.8,.05,.05]],C,Cl),MV,b);
  const lg=loft('liL',[[0,.3,.05,.05],[0,.1,.3,.22],[0,-.4,.2,.17],[0,-.75,.15,.14],[0,-1.05,.14,.14],[0,-1.17,.16,.16],[0,-1.2,.05,.05]],C);
  legs(a,b,LEGS4(.75,-.85,.3),1.3,p=>{mesh(lg,MV,p);ball(tw,p,.12,-1.19,0,.27,.12,.21);for(let i=-1;i<=1;i++)ball(lt,p,.34,-1.2,i*.11,.07,.07,.06);});
  const h=a.head=grp(b,1.25,2.3,0);
  mesh(loft('liMn',[[-.85,-.12,.05,.05],[-.7,-.12,.6,.55,.75],[-.3,-.05,.84,.76,.98],[0,0,.8,.74,.92],[.12,0,.62,.6,.7],[.17,0,.05,.05]],Cm),MV,h);
  if(!liTuft){const ps=[];for(let i=0;i<15;i++){const an=i/15*6.283+.2,r=.74+(i%2)*.06;ps.push({g:G.cone,p:[-.08-(i%2)*.12,Math.sin(an)*r,Math.cos(an)*r*.92],s:[.17,.46,.17],r:[PI/2-an,0,0]});}liTuft=merge(ps);
    const ws=[];for(const s of [1,-1])for(let i=0;i<3;i++)ws.push({g:G.box,p:[.74,-.16-i*.04,s*.34],s:[.012,.012,.4],r:[s*(i-1)*.25,0,0]});liWh=merge(ws);}
  mesh(liTuft,mn2,h);
  mesh(loft('liH',[[-.3,0,.05,.05],[-.15,0,.46,.46],[.15,.02,.5,.48,.46],[.45,-.04,.36,.36],[.62,-.1,.26,.3,.24],[.76,-.12,.2,.26,.2],[.83,-.12,.05,.05]],C,Cl),MV,h);
  ball(ns,h,.84,-.06,0,.07,.07,.12);mesh(liWh,M(0xffffff),h).userData.nd=1;ball(M(Cm),h,.1,.52,0,.2,.14,.16);
  for(const s of [1,-1]){ball(lt,h,.72,-.2,s*.12,.15,.13,.15);const e=grp(h,-.02,.5,s*.36);ball(tw,e,0,.05,0,.15,.16,.07);ball(ns,e,.03,.05,s*.01,.09,.1,.06);a.ears.push({p:e,base:0,s,fast:7});eye(a,h,.44,.17,s*.21,.11);}
  a.tail=grp(b,-1.25,1.75,0);mesh(loft('liT',[[0,0,.07,.07],[-.3,-.35,.06,.06],[-.5,-.8,.05,.05],[-.62,-1.15,.05,.05],[-.85,-1.32,.045,.045],[-1.05,-1.2,.04,.04]],C,C,{seg:8}),MV,a.tail);ball(M(Cm),a.tail,-1.14,-1.12,0,.14,.2,.1).rotation.z=-.7;
  a.hat=grp(h,.1,.66,0);a.hatS=.72;a.gait=9;return finish(a,.95);}
function whiskers(par,x,y){if(!whG){const ws=[];for(const s of [1,-1])for(let i=0;i<3;i++)ws.push({g:G.box,p:[0,-i*.04,s*.34],s:[.012,.012,.4],r:[s*(i-1)*.25,0,0]});whG=merge(ws);}mesh(whG,M(0xffffff),par,x,y,0).userData.nd=1;}
function mkTiger(){const a=base('tiger');tiMat=tiMat||MT(texTig,0xf08a2c,{vertexColors:true});tiMat.userData.tx='zeb';const C=0xf08a2c,Cl=0xfff3e0,or=M(C,{roughness:.8}),lt=M(Cl),b=a.body;
  mesh(loft('tiB',[[-1.45,1.5,.05,.05],[-1.3,1.5,.48,.42],[-.8,1.52,.6,.52,.58],[0,1.48,.55,.5,.58],[.7,1.52,.62,.54,.66],[1.1,1.6,.5,.45,.55],[1.3,1.65,.05,.05]],C,Cl,{uvs:[1,1.4]}),tiMat,b);
  const lg=loft('tiL',[[0,.3,.05,.05],[0,.1,.3,.22],[0,-.4,.21,.18],[0,-.75,.16,.15],[0,-.98,.15,.15],[0,-1.1,.17,.17],[0,-1.13,.05,.05]],C,C,{uvs:[1,.8]});
  legs(a,b,LEGS4(.8,-.95,.3),1.22,p=>{mesh(lg,tiMat,p);ball(lt,p,.12,-1.11,0,.27,.12,.21);});
  const h=a.head=grp(b,1.4,2.0,0),rf=flat('tiR',[[0,.25],[-.2,.3],[-.5,.1],[-.42,-.05],[-.58,-.2],[-.38,-.28],[-.44,-.48],[-.1,-.4],[.05,-.1]],.07,.02,1);
  mesh(loft('tiH',[[-.32,0,.05,.05],[-.18,0,.44,.44],[.12,.02,.47,.47,.44],[.42,-.04,.36,.37],[.6,-.1,.26,.3,.24],[.72,-.12,.2,.26,.2],[.79,-.12,.05,.05]],C,Cl,{uvs:[1,.5]}),tiMat,h);
  ball(M(0xd9667c),h,.8,-.06,0,.07,.06,.11);whiskers(h,.72,-.16);
  for(const s of [1,-1]){mesh(rf,lt,h,.12,-.02,s*.4);ball(lt,h,.68,-.2,s*.12,.15,.13,.15);const e=grp(h,-.05,.46,s*.34);ball(or,e,0,.05,0,.15,.16,.07);ball(lt,e,.03,.05,s*.01,.08,.09,.06);a.ears.push({p:e,base:0,s,fast:7});eye(a,h,.42,.15,s*.21,.1,{col:0xfff2a8});}
  a.tail=grp(b,-1.4,1.65,0);mesh(loft('tiT',[[0,0,.08,.08],[-.35,-.3,.07,.07],[-.65,-.75,.065,.065],[-.8,-1.1,.06,.06],[-1.05,-1.25,.06,.06],[-1.3,-1.1,.055,.055],[-1.38,-.95,.02,.02]],C,C,{seg:8,uvs:[1,1.2]}),tiMat,a.tail);
  a.hat=grp(h,.1,.54,0);a.hatS=.72;a.gait=9;return finish(a,.95);}
function mkPanda(){const a=base('panda'),Wc=0xfafaf5,K=0x24242c,wh=M(Wc,{roughness:.85}),bk=M(K,{roughness:.85}),b=a.body;
  mesh(loft('paB',[[-1.25,1.35,.05,.05],[-1.1,1.35,.6,.6],[-.6,1.4,.85,.82,.8],[0,1.4,.85,.85],[.6,1.45,.8,.8],[1.0,1.5,.6,.6],[1.15,1.5,.05,.05]],Wc),MV,b);
  mesh(loft('paV',[[.12,1.42,.05,.05],[.3,1.43,.87,.87],[.6,1.45,.85,.85],[.95,1.5,.68,.68],[1.06,1.5,.05,.05]],K),MV,b);
  const lg=loft('paL',[[0,.3,.05,.05],[0,.1,.4,.34],[0,-.4,.32,.3],[0,-.75,.3,.3],[0,-.88,.34,.34],[0,-.92,.05,.05]],K);
  legs(a,b,LEGS4(.7,-.75,.5),.95,p=>{mesh(lg,MV,p);});
  const h=a.head=grp(b,1.25,2.0,0);
  mesh(loft('paH',[[-.5,0,.05,.05],[-.35,0,.55,.58],[0,.03,.66,.68,.62],[.35,-.02,.56,.6,.52],[.58,-.1,.34,.4,.3],[.7,-.14,.22,.3,.2],[.76,-.14,.05,.05]],Wc),MV,h);
  ball(bk,h,.77,-.08,0,.07,.06,.1);
  for(const s of [1,-1]){const e=grp(h,-.15,.58,s*.48);ball(bk,e,0,.06,0,.22,.22,.12);a.ears.push({p:e,base:0,s,fast:6});const pt=ball(bk,h,.47,.08,s*.44,.15,.22,.12);pt.rotation.z=.5;pt.rotation.y=s*.5;eye(a,h,.55,.1,s*.47,.075);}
  a.tail=grp(b,-1.2,1.6,0);ball(wh,a.tail,-.05,-.1,0,.18,.18,.16);
  a.hat=grp(h,0,.68,0);a.hatS=.9;a.gait=7;a.swing=.35;return finish(a,.95);}
function mkPenguin(){const a=base('penguin'),K=0x23262f,bk=M(K),or=M(0xff9f1c),ye=M(0xffd23f),b=a.body;
  mesh(loft('peB',[[0,.12,.05,.05],[0,.25,.45,.5],[0,.8,.6,.62],[0,1.4,.52,.52],[0,1.85,.38,.38],[0,2.05,.05,.05]],K,0xffffff),MV,b);ball(ye,b,.4,1.62,0,.1,.2,.28);
  const fg=flat('crF',FOOT,.05,.02,1);for(const s of [1,-1]){const p=grp(b,.05,.3,s*.25);const f=mesh(fg,or,p,0,-.27,0,1.3);f.rotation.x=-PI/2;a.legs.push({p,ph:s>0?0:PI});}
  const h=a.head=grp(b,0,1.95,0);mesh(loft('peH',[[0,-.3,.05,.05],[0,-.12,.38,.38],[0,.2,.42,.42],[0,.5,.3,.3],[0,.62,.05,.05]],K),MV,h);
  mesh(loft('peK',[[.3,.12,.05,.05],[.38,.12,.1,.1],[.6,.1,.07,.07],[.85,.06,.02,.03]],0x2b2b33,0xff9f1c,{seg:8}),MV,h);
  const wg=flat('peW',[[0,0],[.12,-.5],[.05,-1.0],[-.08,-1.05],[-.14,-.5],[-.1,0]],.06,.03);
  for(const s of [1,-1]){ball(M(0xfff6d0),h,.08,.05,s*.33,.2,.24,.1);eye(a,h,.28,.26,s*.26,.07);const e=grp(b,0,1.6,s*.5);e.rotation.x=s*.3;mesh(wg,bk,e);a.ears.push({p:e,base:0,bx:s*.3,s,ax:'x',fast:4});}
  a.tail=grp(b,-.5,.35,0);ball(bk,a.tail,-.1,0,0,.25,.06,.15);
  a.waddle=.14;a.hat=grp(h,0,.6,0);a.hatS=.7;a.gait=12;a.swing=.5;return finish(a,.9);}
function mkKangaroo(){const a=base('kangaroo'),C=0xc98a55,Cl=0xf3dcc0,tn=M(C,{roughness:.8}),lt=M(Cl),dk=M(0x5a3a24),b=a.body;
  mesh(loft('kaB',[[-.75,.95,.05,.05],[-.6,1.1,.5,.48],[-.3,1.45,.72,.62,.7],[.1,2.0,.55,.5],[.4,2.5,.42,.4],[.55,2.8,.3,.3],[.62,2.95,.05,.05]],C,Cl),MV,b);
  const lg=loft('kaL',[[-.1,.2,.05,.05],[0,0,.45,.25],[.3,-.4,.32,.2],[.45,-.7,.2,.15],[.2,-.95,.14,.12],[-.05,-1.15,.12,.11],[.1,-1.27,.1,.12],[.6,-1.28,.08,.13],[1.0,-1.3,.06,.1],[1.1,-1.3,.02,.04]],C),ag=loft('kaA',[[0,.05,.04,.04],[0,0,.13,.11],[.15,-.35,.09,.08],[.35,-.55,.07,.07],[.42,-.6,.03,.03]],C,C,{seg:8});
  for(const s of [1,-1]){const p=grp(b,-.25,1.35,s*.42);mesh(lg,MV,p);a.legs.push({p,ph:0});const q=grp(b,.45,2.35,s*.32);mesh(ag,MV,q);a.legs.push({p:q,ph:PI});}
  ball(lt,b,.3,1.55,0,.3,.32,.4);const jo=grp(b,.5,1.85,0);ball(tn,jo,0,0,0,.17,.16,.15);ball(tn,jo,.14,-.04,0,.1,.08,.09);ball(dk,jo,.23,-.03,0,.03);for(const s of [1,-1]){ball(tn,jo,-.05,.2,s*.09,.05,.14,.04);ball(mK,jo,.1,.05,s*.1,.03);}jo.traverse(o=>{o.userData.nd=1;});
  a.tail=grp(b,-.6,1.1,0);mesh(loft('kaT',[[.1,.05,.3,.28],[-.3,-.3,.24,.22],[-.8,-.75,.17,.16],[-1.3,-.98,.12,.11],[-1.8,-1.0,.07,.07],[-2.0,-.98,.02,.02]],C,Cl,{seg:10}),MV,a.tail);
  const h=a.head=grp(b,.62,3.02,0);mesh(loft('kaH',[[-.3,0,.05,.05],[-.18,.02,.3,.27],[.1,.05,.32,.28],[.4,-.02,.22,.2],[.65,-.08,.16,.16],[.75,-.1,.05,.05]],C,Cl),MV,h);ball(dk,h,.75,-.07,0,.06,.05,.08);
  const eg=flat('kaE',[[0,0],[.14,.25],[.04,.6],[-.12,.28]],.05,.02);
  for(const s of [1,-1]){const e=grp(h,-.12,.26,s*.17);e.rotation.x=s*.3;mesh(eg,tn,e);mesh(eg,lt,e,.02,.03,-s*.02,.6,.7,.6);a.ears.push({p:e,base:0,bx:s*.3,s,ax:'x',fast:5});eye(a,h,.2,.12,s*.22,.08,{lash:1});}
  a.hopH=.4;a.hat=grp(h,-.02,.4,0);a.hatS=.6;a.gait=7;a.swing=.3;return finish(a,.85);}

// Wspólna animacja: nogi (a.moving), oddech, ogon, uszy, głowa, mruganie, pysk, trąba. a.eat: skubie trawę; a.blowT: suszarka; a.state 'work'/'done': myjnia
function anim(a,dt){a.t+=dt;const walk=a.moving&&!a.slide;if(walk)a.ph+=dt*a.gait;
  for(const L of a.legs){const tg=walk?Math.sin(a.ph+L.ph)*a.swing:0;L.p.rotation.z+=(tg-L.p.rotation.z)*Math.min(1,dt*14);}
  a.tickle=Math.max(0,a.tickle-dt*2.5);a.blowT-=dt;a.blown+=((a.blowT>0?1:0)-a.blown)*Math.min(1,dt*5);
  let y=walk?Math.abs(Math.sin(a.ph))*(a.hopH||.05):Math.sin(a.t*2.2)*.015;const happy=a.jumpT>0;if(happy){a.jumpT-=dt*1.1;y+=Math.abs(Math.sin(a.jumpT*PI*2))*.5;}
  a.body.position.y=y;a.body.rotation.x=Math.sin(a.t*28)*.035*a.tickle+a.blown*.06+(walk&&a.waddle?Math.sin(a.ph)*a.waddle:0);a.body.rotation.z=Math.sin(a.t*23)*.02*a.tickle;
  const wag=(a.state==='done'||happy)?2.2:1;if(a.tail)a.tail.rotation.x=Math.sin(a.t*5*wag+a.seed)*.35*wag+a.blown*Math.sin(a.t*30)*.5;
  for(const e of a.ears){const f=Math.sin(a.t*(e.fast||3)+a.seed+e.s)*.12+a.blown*Math.sin(a.t*26+e.s)*.4+a.tickle*.2;if(e.ax==='x')e.p.rotation.x=(e.bx||0)+e.s*f*1.2;else e.p.rotation.y=e.base+e.s*f;}
  a.eatK+=((a.eat&&!walk&&!happy?1:0)-a.eatK)*Math.min(1,dt*3);const ek=a.eatK*(.75+.25*Math.sin(a.t*5+a.seed));
  if(a.head){a.head.rotation.z=a.headBase+Math.sin(a.t*1.3+a.seed)*.04+(happy?.15:0)-ek*(a.neck?.25:.45);const look=a.state==='work'?-.28:0;a.head.rotation.y+=(look+Math.sin(a.t*.7+a.seed)*a.lookA-a.head.rotation.y)*Math.min(1,dt*4);a.head.rotation.x=Math.sin(a.t*25)*.05*a.tickle;}
  if(a.neck)a.neck.rotation.z=a.neckBase+Math.sin(a.t*.9+a.seed)*.04+a.blown*.08-ek*(a.type==='giraffe'?1.05:.55);
  a.blink-=dt;if(a.blink<-.12)a.blink=rnd(2,5);const by=(a.blink<0||a.tickle>.6)?.15:1;for(const e of a.eyes)e.scale.y=by;
  const op=happy?1:(a.tickle>.3?.6:(Math.sin(a.t*.5+a.seed)>.93?.8:0));a.open+=(op-a.open)*Math.min(1,dt*8);if(a.jaw)a.jaw.rotation.z=-a.open*.55;
  for(let i=0;i<a.trunk.length;i++){const g=a.trunk[i],lift=(happy?1:a.lift||0)*(i===0?.5:i<5?.38:.1);g.rotation.z+=(g.userData.b+lift+Math.sin(a.t*1.8+i*.5)*.05+a.tickle*Math.sin(a.t*20+i)*.04-g.rotation.z)*Math.min(1,dt*8);}
  for(let i=0;i<a.ctail.length;i++)a.ctail[i].rotation.y=Math.sin(a.t*2.2-i*.6)*.13*(walk?1.6:1)*(happy?2:1);}
const MK={elephant:mkElephant,giraffe:mkGiraffe,zebra:mkZebra,hippo:mkHippo,crocodile:mkCroc,lion:mkLion,tiger:mkTiger,panda:mkPanda,penguin:mkPenguin,kangaroo:mkKangaroo};
// model dla innych gier: przód +Z, środek długości w 0, wysokość h; k = skala świata
function fit(type,h){const a=MK[type](),g=new T.Group(),w=grp(g),k=h/a.dims.h;w.add(a.root);a.root.position.x=-a.cx;w.rotation.y=-PI/2;w.scale.setScalar(k);return {g,a,k:k*a.root.scale.x};}
return {cfg,MK,fit,anim,rnd,pick,V,canvasTex,M,MT,cg,G,mesh,ball,box,grp,merge,flat,mergeC,mW,mK,MV,texGir,texZeb,texTig};
})();
