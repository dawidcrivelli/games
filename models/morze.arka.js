// morze — wspólne dla: arka
// wymaga z gry: C3, PI, T, mix3, mul3
'use strict';
function rMerge(list){let n=0;const gs=list.map(g=>{const q=g.index?g.toNonIndexed():g;if(!q.attributes.normal)q.computeVertexNormals();n+=q.attributes.position.count;return q;});
  const Pp=new Float32Array(n*3),N=new Float32Array(n*3),K=new Float32Array(n*3).fill(1);let o=0;
  for(const g of gs){const c=g.attributes.position.count;Pp.set(g.attributes.position.array.subarray(0,c*3),o*3);N.set(g.attributes.normal.array.subarray(0,c*3),o*3);if(g.attributes.color)K.set(g.attributes.color.array.subarray(0,c*3),o*3);o+=c;}
  const out=new T.BufferGeometry();out.setAttribute('position',new T.BufferAttribute(Pp,3));out.setAttribute('normal',new T.BufferAttribute(N,3));out.setAttribute('color',new T.BufferAttribute(K,3));return out;}
function rFlat(pts,cIn,cOut){let cz=0,cy=0;pts.forEach(p=>{cz+=p[0];cy+=p[1];});cz/=pts.length;cy/=pts.length;const Pp=[],K=[],N=[];
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];Pp.push(0,cy,cz,0,a[1],a[0],0,b[1],b[0]);K.push(...cIn,...cOut,...cOut);N.push(1,0,0,1,0,0,1,0,0);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(Pp,3));g.setAttribute('color',new T.Float32BufferAttribute(K,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));return g;}
const rBall=(r,c,x,y,z,ws=8,hs=6,sx=1,sy=1,sz=1)=>tf(setCol(new T.SphereGeometry(r,ws,hs),c),x,y,z,0,0,0,sx,sy,sz);
function fishGeo(o){const L=o.L,h=o.h,w=o.w,hl=L/2,parts=[],taper=o.taper==null?.35:o.taper,nose=o.nose||0;
  const k=zn=>zn<0?1-taper*(-zn):1-nose*zn*zn;
  const body=new T.SphereGeometry(1,o.sw||10,o.sh||7);body.rotateX(PI/2);
  const p=body.attributes.position,col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),kk=k(z),c=o.col(z,y,x);col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];p.setXYZ(i,x*w*kk,y*h*kk,z*hl);}
  body.setAttribute('color',new T.BufferAttribute(col,3));body.computeVertexNormals();parts.push(body);
  const top=zn=>h*Math.sqrt(Math.max(0,1-zn*zn))*k(zn);
  const fc=o.finC,fe=o.finE||o.finC,tl=o.tail||{},tz=-hl*.9,ts=tl.s==null?h*1.1:tl.s,tlen=tl.l==null?L*.28:tl.l,r0=top(-.9);
  let tp;
  if(tl.t==='shark')tp=[[tz,r0],[tz-tlen,ts*1.55],[tz-tlen*.45,.02],[tz-tlen*.7,-ts*.75],[tz,-r0]];
  else tp=[[tz,r0],[tz-tlen,ts],[tz-tlen*.5,0],[tz-tlen,-ts],[tz,-r0]];
  {const tg=rFlat(tp,tl.c||fc,tl.e||fe);if(tl.fluke)tg.rotateZ(PI/2);parts.push(tg);}
  if(o.dorsal){const d=o.dorsal,pk=lerp(d.a,d.b,d.pk==null?.35:d.pk),q=lerp(pk,d.b,.55);parts.push(rFlat([[d.a*hl,top(d.a)*.8],[pk*hl,top(pk)+d.h],[q*hl,top(q)+d.h*.72],[d.b*hl,top(d.b)*.8]],d.c||fc,d.e||fe));}
  if(o.anal){const d=o.anal,pk=lerp(d.a,d.b,.4);parts.push(rFlat([[d.a*hl,-top(d.a)*.8],[d.b*hl,-top(d.b)*.8],[pk*hl,-top(pk)-d.h]],d.c||fc,d.e||fe));}
  if(o.pect){const s=o.pect,zz=hl*(o.pectZ==null?.22:o.pectZ);for(const sd of [-1,1])parts.push(tf(rFlat([[0,.1*s],[-.9*s,.5*s],[-1.1*s,-.1*s],[-.7*s,-.45*s],[0,-.12*s]],fc,fe),sd*w*.82,-h*.3,zz,0,sd*-.55,sd*.5));}
  const e=o.eye||0;
  if(e){const zn=o.eyeZ==null?.56:o.eyeZ,yn=o.eyeY==null?.2:o.eyeY,sx=w*k(zn)*Math.sqrt(Math.max(.05,1-zn*zn-yn*yn));for(const sd of [-1,1])parts.push(rBall(e,[.02,.02,.03],sd*sx*.9,yn*h,zn*hl,5,3,.6,1,1));}
  return rMerge(parts);}
function SM(o){const m=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.4});const uPh={value:0};m.userData.uPh=uPh;let an='';const fl=n=>Number(n).toFixed(4);
  if(o.wig)an+=`{ float wz = clamp((${fl(o.wig[1]*.25)} - transformed.z)/${fl(o.wig[1])}, 0.0, 1.0); transformed.x += sin(transformed.z*${fl(4/o.wig[1])} + uPh)*${fl(o.wig[0])}*(0.12 + wz*wz*1.3); }`;
  if(o.wigY)an+=`{ float wz = clamp((${fl(o.wigY[1]*.25)} - transformed.z)/${fl(o.wigY[1])}, 0.0, 1.0); transformed.y += sin(transformed.z*${fl(4/o.wigY[1])} + uPh)*${fl(o.wigY[0])}*(0.12 + wz*wz*1.3); }`;
  if(o.flap)an+=`{ float ax = abs(transformed.x); transformed.y += sin(uPh - ax*1.1)*pow(ax, 1.5)*${fl(o.flap)}; }`;
  m.customProgramCacheKey=()=>'sea'+an;
  m.onBeforeCompile=sh=>{sh.uniforms.uPh=uPh;sh.vertexShader='uniform float uPh;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+an);};return m;}
function makeDolphin(){const g=new T.Group(),gr=C3(0x6d93b8),mat=SM({wigY:[.13,2.3]});
  const geo=rMerge([fishGeo({L:2.3,h:.27,w:.25,taper:.62,nose:.3,col:(zn,yn)=>mix3([.95,.97,1],gr,sstep(-.35,.05,yn)),tail:{fluke:1,s:.42,l:.38},dorsal:{a:.02,b:-.28,h:.3,pk:.75},pect:.4,pectZ:.3,eye:.032,eyeZ:.6,eyeY:.05,finC:gr,finE:mul3(gr,.7),sw:18,sh:11}),rBall(.075,gr,0,-.05,1.18,8,6,.85,.65,2.4)]);
  const m=new T.Mesh(geo,mat);m.frustumCulled=false;g.add(m);return {g,swim(ph){mat.userData.uPh.value=ph;}};}
function makeWhale(){const g=new T.Group(),top=C3(0x2c5275),mat=SM({wigY:[.55,14]});
  const m=new T.Mesh(fishGeo({L:14,h:1.55,w:1.45,taper:.74,nose:.3,col:(zn,yn,xn)=>yn<-.3&&zn>-.25?(Math.sin(xn*24)>.15?[.94,.96,1]:[.62,.68,.76]):mix3(top,mul3(top,.55),vnoise(zn*7+2,yn*7)*.7),
    tail:{fluke:1,s:2.4,l:2},dorsal:{a:-.32,b:-.52,h:.4},pect:2.3,pectZ:.32,eye:.1,eyeZ:.58,eyeY:-.12,finC:top,finE:[.85,.9,.95],sw:24,sh:14}),mat);m.frustumCulled=false;g.add(m);return {g,swim(ph){mat.userData.uPh.value=ph;}};}
function makeShark(){const g=new T.Group(),gr=C3(0x5d7890),mat=SM({wig:[.22,3.4]});
  const m=new T.Mesh(fishGeo({L:3.4,h:.36,w:.3,taper:.55,nose:.55,col:(zn,yn)=>mix3([.96,.97,1],gr,sstep(-.25,.1,yn)),tail:{t:'shark',s:.42,l:.75},dorsal:{a:.15,b:-.2,h:.48,pk:.75},anal:{a:-.45,b:-.62,h:.12},pect:.6,pectZ:.25,eye:.035,eyeZ:.72,eyeY:.15,finC:gr,finE:mul3(gr,.7),sw:18,sh:12}),mat);
  m.frustumCulled=false;g.add(m);return {g,swim(ph){mat.userData.uPh.value=ph;}};}
function makeManta(){const g=new T.Group(),top=C3(0x0c1838),mark=C3(0xdfe9f5);
  const b=new T.SphereGeometry(1,30,12),p=b.attributes.position,col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.abs(x),ch=Math.pow(Math.max(0,1-a),.7);col.set(y<-.02?[.95,.97,1]:(a>.12&&a<.42&&z>.15&&z<.75)?mark:top,i*3);p.setXYZ(i,x*2.1,y*.13*ch*(1+1.6*Math.pow(1-a,3)),z*ch*.95-a*a*.75+(1-a)*.1);}
  b.setAttribute('color',new T.BufferAttribute(col,3));b.computeVertexNormals();
  const parts=[b,setCol(tf(new T.CylinderGeometry(.006,.05,2.7,5).rotateX(-PI/2),0,0,-2.0),top)];for(const sd of [-1,1])parts.push(rBall(.035,[.02,.02,.03],sd*.47,.03,.78,6,5));
  const mat=SM({flap:.2}),m=new T.Mesh(rMerge(parts),mat);m.frustumCulled=false;g.add(m);return {g,swim(ph){mat.userData.uPh.value=ph;}};}
function makeTurtle(){const g=new T.Group(),inner=new T.Group();g.add(inner);const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.5});
  const sA=C3(0x6b4a16),sB=C3(0xd9a441),sL=C3(0x241505),cream=C3(0xf6e3a1),skA=C3(0x2f6b3a),skB=C3(0xe9e2a8);
  const sh=new T.SphereGeometry(1,34,22),p=sh.attributes.position,col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let c;if(y<-.05)c=cream;else{const [e,d]=hexCell(x,z,2.35),rim=Math.hypot(x,z);c=e<.09?sL:mix3(sB,sA,sstep(0,.5,d)+.25*Math.sin(Math.atan2(z,x)*30)*d);if(rim>.9)c=mix3(c,sB,.5);}
    col.set(c,i*3);const tp=1-.28*sstep(0,1,-z);p.setXYZ(i,x*.5*tp,(y>0?y*.24:y*.1),z*.62);}
  sh.setAttribute('color',new T.BufferAttribute(col,3));sh.computeVertexNormals();
  const skin=(x,y,z,f=9)=>{const [e]=hexCell(x+y*.7,z,f);return y<-.02?cream:e<.12?skB:skA;};
  const head=new T.SphereGeometry(1,16,12);setCol(head,(x,y,z)=>skin(x*.15,y*.12,z*.2,14));tf(head,0,.03,.8,0,0,0,.13,.115,.18);
  const neck=setCol(tf(new T.CylinderGeometry(.09,.11,.22,8,1,true).rotateX(PI/2),0,.0,.64),skA),tail=setCol(tf(new T.ConeGeometry(.05,.2,6).rotateX(-PI/2),0,-.02,-.68),skA);
  const eyes=[];for(const sd of [-1,1])eyes.push(rBall(.042,[1,1,1],sd*.098,.07,.87,10,8),rBall(.027,[.02,.02,.02],sd*.125,.075,.885,8,6));
  const bodyM=new T.Mesh(rMerge([sh,head,neck,tail,...eyes]),mat);bodyM.frustumCulled=false;inner.add(bodyM);
  const flip=(sd,len,wd,front)=>{const f=new T.SphereGeometry(1,14,8),q=f.attributes.position,cc=new Float32Array(q.count*3);
    for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i),u=(x+1)/2;cc.set(skin(x*len,y,z*wd,11),i*3);q.setXYZ(i,sd*(u*len),y*.022*(1.2-u*.6),z*wd*(.5+.6*Math.sin(u*2.6))-(front?u*u*len*.55:u*len*.3));}
    f.setAttribute('color',new T.BufferAttribute(cc,3));f.computeVertexNormals();const m=new T.Mesh(f,mat);m.frustumCulled=false;const pv=new T.Group();pv.add(m);inner.add(pv);return pv;};
  const fl=flip(1,.72,.15,true),frr=flip(-1,.72,.15,true),bl=flip(1,.3,.1,false),brr=flip(-1,.3,.1,false);
  fl.position.set(.36,-.02,.34);frr.position.set(-.36,-.02,.34);bl.position.set(.3,-.03,-.46);brr.position.set(-.3,-.03,-.46);
  return {g,swim(ph){const a=Math.sin(ph*.55),b=Math.cos(ph*.55);fl.rotation.set(0,b*.3-.1,a*.55+.05);frr.rotation.set(0,-b*.3+.1,-a*.55-.05);bl.rotation.set(0,-.5+a*.15,b*.15);brr.rotation.set(0,.5-a*.15,-b*.15);}};}
