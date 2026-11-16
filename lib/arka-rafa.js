// silnik — wspólne dla: arka, rafa
// wymaga z gry: T, _e, _m4, _q, _v, _v2
'use strict';

// --- util
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

// --- three
function setCol(g,fn){const p=g.attributes.position,n=p.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){const c=typeof fn==='function'?fn(p.getX(i),p.getY(i),p.getZ(i),i):fn;a[i*3]=c[0];a[i*3+1]=c[1];a[i*3+2]=c[2];}g.setAttribute('color',new T.BufferAttribute(a,3));return g;}
function tf(g,px=0,py=0,pz=0,rx=0,ry=0,rz=0,sx=1,sy,sz){if(sy===undefined)sy=sx;if(sz===undefined)sz=sx;_m4.compose(_v.set(px,py,pz),_q.setFromEuler(_e.set(rx,ry,rz)),_v2.set(sx,sy,sz));g.applyMatrix4(_m4);return g;}
