// Złe Owoce — silnik „ręcznej kreski” (canvas 2D): P C R L ST LB shaded dot
"use strict";
const INK='#2b1b14';   // $: lib/common/dom.js
const cv=$('c'), c=cv.getContext('2d'); c.scale(2,2);
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- silnik „ręcznej kreski” ---------- */
let g=c,BO=1,SC=0;
function hs(n){const x=Math.sin(n*127.1+BO*311.7)*43758.5453;return x-Math.floor(x)}
function P(pts,fill,o){o=o||{};const a=o.a===undefined?1.5:o.a,sd=(SC+=7.31),n=pts.length,q=[],p=new Path2D();
 for(let i=0;i<n;i++)q.push([pts[i][0]+(hs(sd+i)-.5)*2*a,pts[i][1]+(hs(sd+i+.5)-.5)*2*a]);
 const mid=(u,v)=>[(u[0]+v[0])/2,(u[1]+v[1])/2];
 if(o.s||n<3){p.moveTo(q[0][0],q[0][1]);for(let i=1;i<n;i++)p.lineTo(q[i][0],q[i][1]);if(!o.open)p.closePath()}
 else if(o.open){p.moveTo(q[0][0],q[0][1]);for(let i=1;i<n-1;i++){const m=mid(q[i],q[i+1]);p.quadraticCurveTo(q[i][0],q[i][1],m[0],m[1])}p.lineTo(q[n-1][0],q[n-1][1])}
 else{let m=mid(q[n-1],q[0]);p.moveTo(m[0],m[1]);for(let i=0;i<n;i++){m=mid(q[i],q[(i+1)%n]);p.quadraticCurveTo(q[i][0],q[i][1],m[0],m[1])}p.closePath()}
 if(fill){g.fillStyle=fill;g.fill(p)}
 if(!o.ns){g.lineWidth=(o.lw||4.2)*(.86+hs(sd+99)*.28);if(o.st)g.strokeStyle=o.st;g.stroke(p);if(o.st)g.strokeStyle=INK}
 return p}
function C(x,y,rx,ry,n){ry=ry===undefined?rx:ry;n=n||10;const r=[];for(let i=0;i<n;i++)r.push([x+Math.cos(i/n*6.2832)*rx,y+Math.sin(i/n*6.2832)*ry]);return r}
function R(x,y,w,h){return[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]}
function L(x1,y1,x2,y2,lw,st){P([[x1,y1],[(x1+x2)/2,(y1+y2)/2],[x2,y2]],null,{open:1,lw:lw||3,st})}
function ST(x,y,n,r1,r2,rot){const r=[];for(let i=0;i<n*2;i++){const a=(rot||0)+i*Math.PI/n,k=i%2?r2:r1;r.push([x+Math.cos(a)*k,y+Math.sin(a)*k])}return r}
function LB(x1,y1,x2,y2,w,fill){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,nx=-dy/l*w,ny=dx/l*w;P([[x1+nx,y1+ny],[(x1+x2)/2+nx,(y1+y2)/2+ny],[x2+nx,y2+ny],[x2-nx,y2-ny],[(x1+x2)/2-nx,(y1+y2)/2-ny],[x1-nx,y1-ny]],fill)}
function pen(){g.strokeStyle=INK;g.lineJoin=g.lineCap='round'}
function shaded(pts,col,inner,lw){const p=P(pts,col,{ns:1});g.save();g.clip(p);g.fillStyle='rgba(70,20,40,.2)';g.fillRect(-200,-200,400,400);
 P(pts.map(q=>[q[0]-8,q[1]-9]),col,{ns:1});if(inner)inner();g.restore();g.lineWidth=lw||5.2;g.stroke(p)}
const EYE='#fffdf2',SK='#f6d3a6',WOOD='#b06f33',STEEL='#cfd8e3',DARK='#4a1830',GOLD='#ffd23f';
const dot=(x,y,r,col)=>P(C(x,y,r,r,7),col||INK,{ns:1,a:.5});

