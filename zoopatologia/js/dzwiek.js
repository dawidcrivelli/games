/* ================= dźwięk ================= */
let AC=null, MG=null; const lastS={};
function ac(){
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)(); MG=AC.createGain(); MG.gain.value=.55; MG.connect(AC.destination);}catch(e){AC=null;}}
  if(AC&&AC.state==='suspended'){try{AC.resume();}catch(e){}}
  return AC;
}
function tone(f,d,type='square',v=.05,sl=0,dl=0){
  if(!OPT.snd) return; const a=ac(); if(!a) return;
  try{const t=a.currentTime+dl, o=a.createOscillator(), g=a.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t); if(sl) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g); g.connect(MG); o.start(t); o.stop(t+d+.03);}catch(e){}
}
function noise(d,v=.08,f=900,dl=0){
  if(!OPT.snd) return; const a=ac(); if(!a) return;
  try{const len=Math.floor(a.sampleRate*d), buf=a.createBuffer(1,len,a.sampleRate), ch=buf.getChannelData(0);
    for(let i=0;i<len;i++) ch[i]=(Math.random()*2-1)*(1-i/len);
    const s=a.createBufferSource(), fl=a.createBiquadFilter(), g=a.createGain(); s.buffer=buf; fl.type='lowpass'; fl.frequency.value=f; g.gain.value=v;
    s.connect(fl); fl.connect(g); g.connect(MG); s.start(a.currentTime+dl);}catch(e){}
}
function snd(k){
  const n=performance.now(); if(lastS[k]&&n-lastS[k]<140) return; lastS[k]=n;
  switch(k){
    case 'cash': tone(1046,.06,'square',.025); tone(1568,.1,'square',.025,0,.05); break;
    case 'sick': tone(520,.18,'square',.05,-260); tone(380,.25,'square',.05,-200,.15); break;
    case 'cure': [523,659,784,1046,1318].forEach((f,i)=>tone(f,.12,'square',.04,0,i*.07)); break;
    case 'chomp': noise(.08,.12,1400); tone(140,.06,'square',.05,-60); break;
    case 'pew': tone(1600,.18,'sawtooth',.04,-1300); break;
    case 'pop': tone(300,.08,'triangle',.12,500); break;
    case 'boing': tone(200,.3,'triangle',.12,600); break;
    case 'tele': tone(400,.25,'sine',.1,1600); break;
    case 'crash': noise(.5,.18,700); tone(90,.4,'square',.06,-40); break;
    case 'boom': noise(1.2,.3,500); tone(70,.9,'square',.08,-40); break;
    case 'ufo': for(let i=0;i<6;i++) tone(600+(i%2)*200,.12,'sine',.06,0,i*.12); break;
    case 'zap': tone(900,.1,'square',.05,-600); noise(.08,.06,3000); break;
    case 'click': tone(800,.04,'square',.03); break;
    case 'bad': tone(300,.2,'triangle',.08,-120); tone(200,.3,'triangle',.08,-80,.15); break;
    case 'bld': tone(220,.08,'square',.03,40); tone(260,.08,'square',.03,40,.1); break;
    case 'baby': [784,988,1175].forEach((f,i)=>tone(f,.15,'sine',.08,0,i*.1)); break;
    case 'res': [659,784,988,1318].forEach((f,i)=>tone(f,.14,'triangle',.07,0,i*.09)); break;
    case 'fix': for(let i=0;i<3;i++) tone(1200,.04,'square',.03,-400,i*.12); break;
    case 'quake': noise(1.8,.25,200); break;
    case 'fire': noise(.4,.14,1800); tone(120,.3,'sawtooth',.03,-50); break;
    case 'rocket': noise(.9,.16,2500); tone(200,.8,'sawtooth',.04,900); break;
    case 'beep': tone(1400,.05,'square',.03); tone(1800,.05,'square',.03,0,.07); break;
    case 'spray': noise(.25,.06,4000); break;
    case 'zzap': for(let i=0;i<4;i++) tone(rnd(600,2000),.05,'square',.03,-300,i*.05); break;
    case 'win': [523,659,784,1046,784,1046,1318].forEach((f,i)=>tone(f,.18,'square',.05,0,i*.13)); break;
    case 'lose': [400,350,300,200].forEach((f,i)=>tone(f,.35,'triangle',.08,-20,i*.3)); break;
  }
}
let musStep=0, musNext=0;
const BASS=[45,45,57,45, 41,41,53,41, 48,48,60,48, 43,43,55,47];
const ARP=[69,72,76,72, 65,69,72,69, 67,72,76,79, 67,71,74,71];
const mtof=m=>440*Math.pow(2,(m-69)/12);
setInterval(()=>{
  if(!OPT.mus||!OPT.snd||!running||OPT.paused||!AC||document.hidden) return;
  const step=60/138/2;
  if(musNext<AC.currentTime) musNext=AC.currentTime+.05;
  while(musNext<AC.currentTime+.25){
    const i=musStep%16, bar=Math.floor(musStep/16)%4, tr=[0,0,3,-2][bar]+(G?[0,2,-3,5][G.lvl]:0), dl=musNext-AC.currentTime;
    tone(mtof(BASS[i]+tr-12),step*.9,'triangle',.05,0,dl);
    if(musStep%2===0) tone(mtof(ARP[(i+bar*3)%16]+tr),step*.5,'square',.012,0,dl);
    if(i%4===2) noise(.03,.03,5000,dl);
    musStep++; musNext+=step;
  }
},80);

