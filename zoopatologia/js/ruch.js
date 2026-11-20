/* ================= ruch ================= */
function moveTo(a,gx,gy,dt,spd){
  const dx=gx-a.x, dy=gy-a.y, d=Math.hypot(dx,dy), m=spd*dt;
  if(d<=m||d<.01){a.x=gx;a.y=gy;return true;}
  a.x+=dx/d*m; a.y+=dy/d*m; if(Math.abs(dx)>.3) a.face=dx>0?1:-1; a.mv=true; a.ph+=dt*9; return false;
}
function stepPath(a,dt,spd){
  if(!a.path||!a.path.length) return true;
  const [tx,ty]=a.path[0]; const gx=tx*TS+8+(a.ox||0), gy=ty*TS+12+(a.oy||0);
  if(moveTo(a,gx,gy,dt,spd)){a.path.shift();}
  return !a.path.length;
}

