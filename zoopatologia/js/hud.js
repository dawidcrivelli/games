/* ================= HUD ================= */
let hudT=0;
function hud(){
  $('#money').textContent=Math.round(G.money); $('#moneyBox').classList.toggle('bad',G.money<0);
  $('#rep').textContent=Math.round(G.rep); $('#repBar').style.width=G.rep+'%'; $('#repMeter').classList.toggle('low',G.rep<25);
  $('#day').textContent=G.day;
}

