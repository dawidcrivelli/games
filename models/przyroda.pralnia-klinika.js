// przyroda — wspólne dla: pralnia, klinika
// wymaga z gry: mK, mesh, scene
'use strict';
function duck(par,x,y,z,s){const g=grp(par,x,y,z);g.scale.setScalar(s);const ye=M(0xffd23f,{roughness:.4});ball(ye,g,0,.24,0,.3,.24,.24);ball(ye,g,.2,.5,0,.17);ball(M(0xff8f1c),g,.37,.48,0,.1,.04,.08);for(const q of [1,-1])ball(mK,g,.28,.55,q*.1,.03);ball(ye,g,-.28,.32,0,.1,.08,.12);return g;}
function tree(x,z,s){const g=grp(scene,x,0,z);g.scale.setScalar(s);mesh(cg(.25,.36,2.2,8),M(0x8d5a3b),g,0,1.1,0);ball(M(0x4caf50),g,0,3,0,1.5,1.4,1.5);ball(M(0x66bb6a),g,.8,2.5,.3,1.0);ball(M(0x43a047),g,-.8,2.6,-.2,1.1);ball(M(0x7ccf5a),g,.1,3.7,.4,.8);}
function palm(x,z,s){const g=grp(scene,x,0,z);g.scale.setScalar(s);let par=g;for(let i=0;i<6;i++){const q=grp(par,0,i?.7:0,0);q.rotation.z=.07;mesh(cg(.2-i*.012,.23-i*.012,.74,8),M(i%2?0xa9794f:0x966a43),q,0,.35,0);par=q;}
  const top=grp(par,0,.7,0);for(let i=0;i<7;i++){const l=grp(top);l.rotation.y=i/7*6.283;const lf=ball(M(i%2?0x3fa55a:0x55c26f),l,1.1,-.1,0,1.2,.07,.3);lf.rotation.z=-.4;}ball(M(0x7a4a2a),top,.2,-.1,.1,.18);ball(M(0x7a4a2a),top,-.15,-.12,-.1,.18);}
