/* ================= siatka ================= */
const T_GRASS=0,T_PATH=1,T_PLOT=2,T_TREE=3,T_PLAZA=4,T_GATE=5;
const grid=new Uint8Array(MW*MH), walk=new Uint8Array(MW*MH);
(function buildGrid(){
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    let t=T_GRASS;
    if(x===0||x===MW-1||y===0||y===MH-1) t=T_TREE;
    const vp=VPATH.includes(x)&&y>=1&&y<=24, hp=HPATH.includes(y)&&x>=1&&x<=MW-2;
    if(vp||hp) t=T_PATH;
    if(y>=25&&y<=27&&x>=1&&x<=MW-2) t=T_PLAZA;
    if(x===GX&&y===MH-1) t=T_GATE;
    grid[y*MW+x]=t;
  }
  for(const py of PLOT_Y)for(const px of PLOT_X)for(let y=py;y<py+5;y++)for(let x=px;x<px+7;x++) grid[y*MW+x]=T_PLOT;
  for(let i=0;i<MW*MH;i++) walk[i]=(grid[i]===T_PATH||grid[i]===T_PLAZA||grid[i]===T_GATE)?1:0;
  for(const py of PLOT_Y)for(const px of PLOT_X) walk[(py+4)*MW+px+3]=1;
  for(let x=2;x<=5;x++) walk[25*MW+x]=0;
  walk[27*MW+GX+2]=0; walk[27*MW+GX+3]=0;
})();
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const LAMPS=[]; VPATH.forEach(vx=>HPATH.forEach(hy=>LAMPS.push({x:vx*TS+14,y:hy*TS+3})));
function bfs(sx,sy,tx,ty){
  if(sx===tx&&sy===ty) return [];
  const N=MW*MH, prev=new Int16Array(N).fill(-1), q=new Int16Array(N); let h=0,t=0;
  const s=sy*MW+sx, g=ty*MW+tx; if(s<0||s>=N||g<0||g>=N) return null;
  prev[s]=s; q[t++]=s;
  while(h<t){const c=q[h++]; if(c===g) break; const cx=c%MW, cy=(c/MW)|0;
    for(const[dx,dy] of DIRS){const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=MW||ny>=MH) continue; const n=ny*MW+nx; if(prev[n]!==-1||!walk[n]) continue; prev[n]=c; q[t++]=n;}}
  if(prev[g]===-1) return null;
  const path=[]; let c=g; while(c!==s){path.push([c%MW,(c/MW)|0]); c=prev[c];}
  return path.reverse();
}
const tileOf=(x,y)=>({tx:clamp(Math.floor(x/TS),0,MW-1),ty:clamp(Math.floor(y/TS),0,MH-1)});
function nearestWalk(x,y){
  const t=tileOf(x,y); if(walk[t.ty*MW+t.tx]) return t;
  for(let r=1;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
    const nx=t.tx+dx, ny=t.ty+dy; if(nx<0||ny<0||nx>=MW||ny>=MH) continue; if(walk[ny*MW+nx]) return{tx:nx,ty:ny};
  }
  return{tx:GX,ty:26};
}
function randomWalkNear(tx,ty,r){for(let k=0;k<30;k++){const x=tx+ri(-r,r), y=ty+ri(-r,r); if(x>0&&y>0&&x<MW&&y<MH&&walk[y*MW+x]&&grid[y*MW+x]!==T_PLOT) return{tx:x,ty:y};} return{tx,ty};}
const gateTile=pl=>({tx:pl.tx+3,ty:pl.ty+4});
const gatePt=pl=>({x:(pl.tx+3)*TS+8,y:(pl.ty+4)*TS+10});
const frontTile=pl=>({tx:pl.tx+3,ty:pl.ty+5});
const queuePos=(pl,i)=>({x:(pl.tx+3)*TS+8+i*13,y:(pl.ty+5)*TS+12});
function plotAt(x,y){const t=tileOf(x,y); for(let i=0;i<G.plots.length;i++){const p=G.plots[i]; if(t.tx>=p.tx&&t.tx<p.tx+7&&t.ty>=p.ty&&t.ty<p.ty+5) return i;} return -1;}

