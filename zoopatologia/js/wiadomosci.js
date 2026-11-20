/* ================= wiadomości ================= */
const tq=[]; let tCur=null, tT=0;
function ticker(text,cls){tq.push({text,cls:cls||''}); if(tq.length>4) tq.shift();}
setInterval(()=>{
  const el=$('#ticker');
  if(tCur&&performance.now()-tT<3200) return;
  if(!tq.length){el.classList.remove('on'); tCur=null; return;}
  tCur=tq.shift(); tT=performance.now(); el.textContent=tCur.text; el.className='px on '+tCur.cls;
},200);
function floatW(x,y,text,c){FT.push({x,y,text,c:c||'#fff',life:1.6});}
function hint(k,text){if(G.hint[k]) return; G.hint[k]=1; ticker(text,'good');}

