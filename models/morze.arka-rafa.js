// morze — wspólne dla: arka, rafa
'use strict';
function hexCell(x,z,f){const px=x*f,pz=z*f;let d1=9,d2=9;const j0=Math.round(pz/.866);for(let j=j0-1;j<=j0+1;j++){const off=(j&1)*.5,i0=Math.round(px-off);for(let i=i0-1;i<=i0+1;i++){const d=Math.hypot(px-i-off,pz-j*.866);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}}return [d2-d1,d1];}
