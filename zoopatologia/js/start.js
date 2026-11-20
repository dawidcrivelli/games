/* ================= start ================= */
let last=performance.now();
function frame(now){
  let dt=Math.min(.1,(now-last)/1000); last=now;
  if(running&&!OPT.paused&&G&&!G.over){for(let i=0;i<OPT.speed;i++) update(dt);}
  if(G) fxUpdate(dt);
  if(blink>0) blink-=dt;
  render(now/1000);
  hudT-=dt; if(G&&hudT<=0){hudT=.2; hud();}
  requestAnimationFrame(frame);
}
resize();
newGame(Math.max(0,Math.min(getUnl(),LEVELS.length-1))); initCam(); showIntro();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{panelSig='';});
requestAnimationFrame(frame);
