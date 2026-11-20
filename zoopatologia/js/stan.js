/* ================= stan ================= */
let CLOUDS=[0,1,2,3,4,5].map(i=>({x:i*170+rnd(0,60),y:rnd(30,420),rx:rnd(40,70),ry:rnd(16,26),v:rnd(4,8)})), BIRDS=[], BIRDT=15;
function nightF(){if(!G) return 0; const c=(G.time%120)/120; if(c<.55) return 0; if(c<.65) return (c-.55)/.1; if(c<.88) return 1; return 1-(c-.88)/.12;}
let G=null, V=[], PT=[], FT=[], BB=[], BM=[], PR=[], spawnAcc=0, SEL=null, running=false, HD=false;
const OPT={snd:true,mus:true,speed:1,paused:false};
const LV=()=>LEVELS[G.lvl];
function makePlots(){const a=[]; for(let r=0;r<4;r++) for(let c=0;c<6;c++) a.push({tx:PLOT_X[c],ty:PLOT_Y[r],k:null,sp:null,b:null,queue:[],cur:null,ct:0,cmax:1,wear:0,bt:0,warn:0,mc:0}); return a;}
function newGame(lvl){
  G={v:3,lvl,time:0,day:1,money:LEVELS[lvl].money,rep:50,cured:0,lost:0,visits:0,hyb:0,loan:0,disc:{},plots:makePlots(),animals:[],staff:[],litter:[],uid:1,
     nextDis:20/LEVELS[lvl].rate,nextEv:85,hint:{},cn:{},ufo:null,rain:0,shake:0,over:false,res:{cur:null,cost:0,pts:0,done:{}}};
  V=[];PT=[];FT=[];BB=[];BM=[];PR=[];
  LEVELS[lvl].start.forEach(([pi,sp,n])=>setPen(pi,sp,n));
  rebuildStatic();
}
function setPen(pi,sp,n){const pl=G.plots[pi]; pl.k='pen'; pl.sp=sp; pl.bt=0; for(let i=0;i<n;i++) G.animals.push(mkAnimal(sp,pi));}
function mkAnimal(sp,pi){
  const p=randInPen(G.plots[pi]);
  return {id:G.uid++,sp,name:pick(NAMES),pen:pi,x:p.x,y:p.y,face:Math.random()<.5?1:-1,st:'pen',path:null,pre:null,post:null,goal:null,dest:-1,
    dis:[],alt:0,tm:{},wx:p.x,wy:p.y,wait:rnd(0,2),ph:Math.random()*9,mv:false,chomp:0,vc:0,gc:0,noB:-99,fire:0,baby:false,age:99,hy:null};
}
function randInPen(pl){return{x:pl.tx*TS+22+Math.random()*68,y:pl.ty*TS+30+Math.random()*40};}
const byId=id=>G.animals.find(a=>a.id===id);
const has=(a,k)=>a.dis.some(d=>d.id===k);
const disOn=k=>LV().pool.includes(k)&&G.day>=Math.max(1,Math.round(DIS[k].day*LV().dayMul));

