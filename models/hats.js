'use strict';
function mkHat(k){const g=new T.Group();
  if(k===0){const bk=M(0x23232e);mesh(cg(.55,.55,.06,20),bk,g,0,.03,0);mesh(cg(.32,.34,.6,20),bk,g,0,.36,0);mesh(cg(.345,.35,.13,20),M(0xe23b4e),g,0,.14,0);}
  else if(k===1){const gd=M(0xffc93c,{metalness:.7,roughness:.25});mesh(cg(.36,.32,.26,16),gd,g,0,.13,0);for(let i=0;i<6;i++){const an=i/6*6.283;mesh(G.cone,gd,g,Math.cos(an)*.33,.38,Math.sin(an)*.33,.09,.26,.09);ball(M(i%2?0xe23b4e:0x35b6e8,{roughness:.2}),g,Math.cos(an)*.36,.14,Math.sin(an)*.36,.06);}}
  else if(k===2){const pk=M(0xff5c9a);for(const s of [-1,1]){const c=mesh(G.cone,pk,g,0,.22,s*.3,.26,.5,.14);c.rotation.x=-s*PI/2;}ball(pk,g,0,.22,0,.13);}
  else if(k===3){mesh(G.cone,M(0x35c2a1),g,0,.45,0,.3,.9,.3);ball(M(0xffd23f),g,0,.93,0,.11);for(let i=0;i<3;i++){const r=mesh(new T.TorusGeometry(.26-i*.07,.035,6,16),M(0xff5c9a),g,0,.15+i*.22,0);r.rotation.x=PI/2;}}
  else{const c=[0xff5c9a,0xffd23f,0x9b6bff][k%3];for(let i=0;i<6;i++){const an=i/6*6.283;ball(M(c),g,Math.cos(an)*.24,.14,Math.sin(an)*.24,.16,.07,.16);}ball(M(0xffa000),g,0,.17,0,.15,.1,.15);}
  g.traverse(o=>{o.userData.nd=1;});return g;}
