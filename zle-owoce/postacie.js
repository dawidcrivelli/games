// Złe Owoce — owoce (BASES), części (PARTS), przeciwnicy, tła
"use strict";
/* ---------- owoce ---------- */
const BASES={
 truskawka:{name:'Truskawka',lock:0,col:'#ee4354',pts:[[0,-52],[38,-58],[62,-30],[58,5],[38,38],[12,60],[0,64],[-12,60],[-38,38],[-58,5],[-62,-30],[-38,-58]],
  inn(){[[-36,-30],[34,-34],[-46,0],[46,-2],[-28,34],[26,36],[0,52],[-12,-46],[14,-44],[-10,10],[16,14]].forEach(q=>P(C(q[0],q[1],2.6,4.4,6),'#ffe27a',{ns:1,a:.6}))},
  out(){P(ST(0,-54,6,30,11,.26),'#57b85a',{lw:4})}},
 borowka:{name:'Borówka',lock:0,col:'#5a72e0',pts:C(0,2,56,54,12),
  inn(){P(C(-26,-28,13,7,7),'rgba(255,255,255,.3)',{ns:1})},out(){P(ST(0,-52,5,16,7,-1.57),'#2f3d8f',{lw:3.5,s:1})}},
 banan:{name:'Banan',lock:0,col:'#ffd94a',pts:[[-22,-66],[4,-62],[30,-36],[40,0],[32,36],[8,62],[-14,68],[-24,58],[-6,34],[2,0],[-6,-30],[-30,-50],[-32,-62]],
  inn(){g.fillStyle='#8a5a2b';g.fillRect(-44,-74,30,15);g.fillRect(-30,56,36,16)},out(){}},
 cytryna:{name:'Cytryna',lock:0,col:'#ffe84a',pts:[[-70,0],[-52,-22],[-28,-44],[0,-50],[28,-44],[52,-22],[70,0],[52,22],[28,44],[0,50],[-28,44],[-52,22]],
  inn(){P(C(-24,-26,14,6,7),'rgba(255,255,255,.45)',{ns:1})},out(){P([[4,-48],[16,-62],[30,-56],[18,-46]],'#57b85a',{lw:3.5})}},
 jablko:{name:'Jabłko',lock:1,col:'#d93a3a',pts:[[0,-44],[22,-56],[50,-44],[62,-12],[54,26],[30,54],[8,56],[0,50],[-8,56],[-30,54],[-54,26],[-62,-12],[-50,-44],[-22,-56]],
  inn(){P(C(-30,-26,12,18,7),'rgba(255,255,255,.25)',{ns:1})},out(){L(0,-46,6,-66,5);P([[8,-62],[24,-76],[38,-66],[22,-56]],'#57b85a',{lw:3.5})}},
 gruszka:{name:'Gruszka',lock:0,col:'#bcd94a',pts:[[0,-66],[18,-60],[24,-38],[30,-14],[50,10],[54,38],[36,60],[0,66],[-36,60],[-54,38],[-50,10],[-30,-14],[-24,-38],[-18,-60]],
  inn(){[[-30,30],[26,40],[0,-40],[-14,50]].forEach(q=>dot(q[0],q[1],2,'#8fae2c'))},out(){L(0,-66,-6,-82,5)}},
 arbuz:{name:'Arbuz',lock:4,col:'#5fbf63',pts:C(0,2,64,58,12),
  inn(){[-44,-15,15,44].forEach(x=>{const z=[];for(let y=-64,i=0;y<=66;y+=13,i++)z.push([x+(i%2?6:-6),y]);P(z,null,{open:1,s:1,lw:9,st:'#2b7a3c'})})},
  out(){P([[0,-56],[4,-70],[16,-72]],null,{open:1,lw:4})}},
 ananas:{name:'Ananas',lock:0,col:'#f2b632',pts:C(0,8,48,58,12),
  inn(){for(let i=-140;i<=140;i+=24){L(i,-70,i+90,80,2.5,'#c98a1b');L(i,-70,i-90,80,2.5,'#c98a1b')}},
  out(){[-.9,.9,-.45,.45,0].forEach(a=>{g.save();g.translate(0,-46);g.rotate(a);P([[-10,0],[0,-46],[10,0]],'#57b85a',{lw:3.5});g.restore()})}},
 grzyb:{name:'Prawdziwek',lock:0,col:'#f3e4c2',pts:[[-62,-10],[-50,-40],[-20,-58],[20,-58],[50,-40],[62,-10],[40,-2],[26,0],[30,40],[20,62],[-20,62],[-30,40],[-26,0],[-40,-2]],
  inn(){P([[-72,-2],[-58,-46],[-22,-68],[22,-68],[58,-46],[72,-2],[34,5],[0,7],[-34,5]],'#9a6230',{ns:1});P([[-72,-2],[-34,5],[0,7],[34,5],[72,-2],[60,-14],[0,-6],[-60,-14]],'rgba(60,25,10,.25)',{ns:1});P(C(-24,-42,15,7,7),'rgba(255,255,255,.28)',{ns:1})},
  out(){P([[-56,-5],[-28,1],[0,3],[28,1],[56,-5]],null,{open:1,lw:3.5})}},
 malina:{name:'Malina',lock:0,col:'#e0407a',pts:[[0,-50],[30,-54],[54,-34],[58,-4],[44,30],[20,54],[0,60],[-20,54],[-44,30],[-58,-4],[-54,-34],[-30,-54]],
  inn(){for(let r=0;r<7;r++)for(let k=0;k<7;k++)P(C(-60+k*20+(r%2?10:0),-56+r*18,11,11,7),'#ee6298',{lw:2,st:'#a82458',a:.6})},
  out(){P(ST(0,-53,6,24,9,.26),'#57b85a',{lw:4})}}
};
function drawBody(id){const B=BASES[id];shaded(B.pts,B.col,B.inn);B.out()}

/* ---------- części ---------- */
const PARTS={},ORDER={oczy:[],buzia:[],twarz:[],rece:[],nogi:[],dod:[]};
function A(cat,id,name,pow,lock,d,x){PARTS[id]=Object.assign({id,cat,name,pow,lock,d},x||{});ORDER[cat].push(id)}
const CATS={
 oczy:{th:[0,-2,26],defs:[[-20,-14],[20,-14],[0,-36],[-38,-30],[38,-30]],m:'f',inv:1},
 buzia:{th:[0,8,44],defs:[[0,26],[0,44]]},
 rece:{th:[26,-44,68],defs:[[50,4],[-50,4],[40,-34],[-40,-34],[48,34],[-48,34]],m:'r',back:1},
 nogi:{th:[30,-6,38],defs:[[22,54],[-22,54],[46,40],[-46,40]],m:'r',back:1},
 twarz:{th:[0,0,24],defs:[[30,-28],[-32,8],[0,4],[-30,-34]]},
 dod:{th:[0,-18,46],defs:[[0,-52]]}};
const eb=(r,pr,px,py,fill)=>{P(C(0,0,r,r*1.08,10),fill||EYE);if(pr)dot(px||2,py||1,pr)};
const brow=()=>P([[-20,-19],[15,-6],[15,-13],[-17,-27]],INK,{s:1,ns:1,a:1});
// oczy
A('oczy','zle','Złe oko',2,0,()=>{eb(14,4,3,2);brow()});
A('oczy','wylup','Wyłupiaste',2,0,()=>{eb(19,2.6,3,1);P([[-16,14],[0,21],[16,14]],null,{open:1,lw:2.5})});
A('oczy','zmruz','Podejrzliwe',2,0,()=>{P([[-15,0],[15,0],[11,10],[0,14],[-11,10]],EYE);dot(3,6,3.5);L(-17,-1,17,-1,6)});
A('oczy','kocie','Kocie',3,0,()=>{eb(15,0,0,0,'#ffe14a');P([[0,-11],[4,0],[0,11],[-4,0]],INK,{ns:1,a:.6})});
A('oczy','zylki','Niewyspane',3,1,()=>{eb(16);L(-14,-5,-6,-2,1.6,'#e0364a');L(-13,6,-5,3,1.6,'#e0364a');L(13,-7,7,-3,1.6,'#e0364a');L(12,8,6,4,1.6,'#e0364a');P(C(2,1,7),'#7fc4e8',{lw:2});dot(2,1,3)});
A('oczy','spirala','Hipnoza',4,3,()=>{eb(17);const z=[];for(let i=0;i<15;i++)z.push([Math.cos(i*.9)*i*1.05,Math.sin(i*.9)*i*1.05]);P(z,null,{open:1,lw:2.5,a:.5})});
A('oczy','cyklop','Oko cyklopa',5,2,()=>{eb(26);P(C(4,2,12),'#6fcf6a',{lw:3});dot(5,2,5);P([[-30,-36],[0,-26],[30,-36],[30,-43],[0,-34],[-30,-43]],INK,{ns:1,s:1})},{th:[0,-4,36]});
A('oczy','laser','Laserowe',8,5,()=>{g.save();g.shadowColor='#ff2a2a';g.shadowBlur=20;eb(14,0,0,0,'#ff2a2a');g.restore();dot(1,1,5,'#ffe94a');brow()});
// buzie
const G=[[-34,-10],[0,-4],[34,-10],[30,12],[14,22],[0,24],[-14,22],[-30,12]];
const TRI=(x,y,w,h)=>P([[x-w,y],[x+w,y],[x,y+h]],EYE,{s:1,lw:2.5});
A('buzia','zebiska','Zębiska',2,0,()=>{P(G,EYE);[-18,-6,6,18].forEach(x=>L(x,-6,x,21,2.5));L(-30,7,30,7,2.5)});
A('buzia','usmieszek','Uśmieszek',2,0,()=>{P([[-24,2],[-4,10],[16,6],[30,-10]],null,{open:1,lw:6});P([[10,6],[20,1],[18,16]],EYE,{s:1,lw:3})});
A('buzia','szczerbaty','Szczerbaty',2,0,()=>{P(G,DARK);P(R(-20,-8,13,13),EYE,{s:1,lw:3});P(R(9,-7,13,13),EYE,{s:1,lw:3})});
A('buzia','aparat','Aparat',3,0,()=>{P(G,EYE);[-18,-6,6,18].forEach(x=>L(x,-6,x,21,2.5));L(-31,4,31,4,2.5,'#7c8a99');[-24,-12,0,12,24].forEach(x=>P(R(x-3,1,6,6),'#9fd0ff',{s:1,lw:1.5}))});
A('buzia','wasy','Wąsy',3,0,()=>P([[0,-4],[16,-12],[40,-6],[52,-18],[46,4],[22,8],[0,2],[-22,8],[-46,4],[-52,-18],[-40,-6],[-16,-12]],'#3a2618'),{def:[0,12],th:[0,-4,54]});
A('buzia','kly','Kły',4,1,()=>{P(G,DARK);TRI(-11,-6,7,20);TRI(11,-6,7,20)});
A('buzia','broda','Broda',4,2,()=>P([[-34,-6],[-16,2],[0,-2],[16,2],[34,-6],[32,22],[18,30],[14,46],[0,40],[-6,56],[-16,36],[-30,26]],'#7a4a22',{s:1,a:2.5}),{def:[0,48],th:[0,22,44]});
A('buzia','jezor','Jęzor',4,2,()=>{P(G,DARK);P([[-10,6],[10,6],[14,40],[0,52],[-14,40]],'#ff7a9c');L(0,12,0,40,2)},{th:[0,18,46]});
A('buzia','rekin','Paszcza rekina',6,3,()=>{P([[-44,-8],[0,-14],[44,-8],[38,16],[0,26],[-38,16]],DARK);
  const u=[[-40,-9]],d=[[-34,16]];for(let x=-40,i=0;x<40;x+=10,i++){u.push([x+5,3],[x+10,-10+ (i===3?-1:0)])}for(let x=-34;x<34;x+=9.7)d.push([x+5,6],[x+9.7,17]);
  P(u,EYE,{s:1,lw:2.5});P(d,EYE,{s:1,lw:2.5})},{th:[0,6,50]});
A('buzia','ryk','Ryk',7,4,()=>{P(C(0,6,26,22),DARK);P(C(0,18,13,8),'#ff7a9c',{lw:3});[-12,0,12].forEach(x=>TRI(x,-13,5,11))});
// bronie (trzonek w dłoni, czubek w górę)
const W={
 patelnia(){P(R(-4,-40,8,50),'#3a3350',{s:1});P(C(0,-68,30),'#4b4466');P(C(0,-68,21),'#6b6390',{ns:1});P(C(-3,-66,12,10,8),'#fffdf2',{lw:2});dot(-3,-66,5,'#ffb02e')},
 pila(){const z=[[11,-16],[14,-94],[-7,-94]];for(let y=-90;y>=-18;y-=9)z.push([-17,y+4.5],[-7,y]);P(z,STEEL,{s:1,lw:3.5});P(R(-10,-15,21,27),WOOD)},
 ryba(){P([[0,-20],[15,-40],[17,-72],[0,-102],[-17,-72],[-15,-40]],'#7fc4e8');P([[0,-24],[15,0],[0,-8],[-15,0]],'#5aa6d0',{s:1});P(C(5,-84,5.5),EYE,{lw:2});dot(6,-84,2);L(-8,-50,8,-50,2);L(-9,-62,9,-62,2)},
 walek(){P(R(-4,-104,8,116),WOOD,{s:1});P(R(-11,-90,22,64),'#ecc590')},
 siekiera(){P(R(-4,-90,8,102),WOOD,{s:1});P([[4,-86],[34,-100],[45,-68],[34,-38],[4,-54]],STEEL,{s:1})},
 kaktus(){P(R(-14,-12,28,22),'#c8693a',{s:1});P([[-12,-10],[-14,-82],[0,-100],[14,-82],[12,-10]],'#5fbf63');P([[12,-46],[30,-48],[31,-76],[21,-76],[20,-58],[12,-58]],'#5fbf63');
  [[-14,-30],[-15,-55],[-13,-78],[14,-25],[15,-88],[31,-64]].forEach(q=>L(q[0],q[1],q[0]+(q[0]<0?-8:8),q[1]-3,2))},
 mlot(){P(R(-4,-84,8,96),WOOD,{s:1});P(R(-29,-106,58,33),'#9aa6b8');L(-20,-99,-20,-82,3,'#fff')},
 miecz(){P([[-7,-96],[0,-116],[7,-96],[7,-12],[-7,-12]],'#e6eef7',{s:1});L(0,-100,0,-20,1.5,'#9fb0c4');P(R(-20,-15,40,9),GOLD,{s:1});P(R(-4,-6,8,18),WOOD,{s:1})},
 lizak(){P(R(-3,-60,6,72),'#fff',{s:1,lw:3});P(C(0,-80,27),'#ff5fa2');const z=[];for(let i=2;i<17;i++)z.push([Math.cos(i*.8)*i*1.4,-80+Math.sin(i*.8)*i*1.4]);P(z,null,{open:1,lw:3,st:'#fff',a:.5})},
 widelec(){P(R(-4,-62,8,74),STEEL,{s:1});P(R(-19,-74,38,12),STEEL,{s:1});[-15,0,15].forEach(x=>P([[x-4,-72],[x-4,-102],[x,-112],[x+4,-102],[x+4,-72]],STEEL,{s:1,lw:3}))},
 maczuga(){P([[-5,12],[-16,-78],[0,-100],[16,-78],[5,12]],WOOD);[[-17,-72,-1],[17,-72,1],[-14,-46,-1],[14,-46,1],[0,-100,0]].forEach(s=>s[2]?P([[s[0],s[1]-6],[s[0]+s[2]*14,s[1]],[s[0],s[1]+6]],'#fff',{s:1,lw:2.5}):P([[-6,-96],[0,-112],[6,-96]],'#fff',{s:1,lw:2.5}))},
 pilam(){P(R(-9,-106,18,78),STEEL,{s:1});for(let y=-100;y<-32;y+=11){P(R(-15,y,6,6),INK,{ns:1,s:1});P(R(9,y+5,6,6),INK,{ns:1,s:1})}P(R(-17,-32,34,42),'#ff8a2a');P(C(0,-11,7),GOLD,{lw:2.5})},
 kotwica(){P(R(-4,-92,8,104),'#6c7a8c',{s:1});P([[-38,-60],[-26,-64],[-20,-82],[0,-92],[20,-82],[26,-64],[38,-60],[34,-90],[0,-110],[-34,-90]],'#8a98aa');P(R(-14,-40,28,7),'#6c7a8c',{s:1})},
 trojzab(){P(R(-4,-72,8,86),GOLD,{s:1});P([[-24,-70],[24,-70],[24,-104],[30,-104],[21,-120],[13,-104],[17,-104],[17,-80],[5,-80],[5,-108],[10,-108],[0,-126],[-10,-108],[-5,-108],[-5,-80],[-17,-80],[-17,-104],[-13,-104],[-21,-120],[-30,-104],[-24,-104]],GOLD,{s:1,lw:3.5})}
};
const ARM=w=>an=>{P([[0,-7],[22,-9],[46,-7],[46,7],[22,9],[0,7]],SK);L(13,-9,11,-17,2);L(24,-9,23,-18,2);L(33,9,32,17,2);
 if(w){g.save();g.translate(48,0);g.rotate((an.w||0)*1.5);w();g.restore()}P(C(48,0,11,11,8),SK);L(45,-5,53,-5,2);L(45,1,54,1,2)};
A('rece','reka','Łapa',3,0,ARM(),{th:[30,0,38]});
[['patelnia','Patelnia',6,0],['pila','Piła',8,0],['ryba','Śledź',7,0],['walek','Wałek',8,1],['siekiera','Siekiera',10,1],['kaktus','Kaktus',9,2],['mlot','Młot',12,3],['miecz','Miecz',14,4],['lizak','Lizak gigant',11,4],
 ['widelec','Widelec gigant',15,6],['maczuga','Maczuga',17,7],['pilam','Piła turbo',22,8],['kotwica','Kotwica',19,9],['trojzab','Trójząb',24,10]].forEach(a=>A('rece',a[0],a[1],a[2],a[3],ARM(W[a[0]]),{wp:1}));
// nogi (wzdłuż osi x, czubek buta w stronę -y)
const shin=col=>P([[0,-6],[20,-7],[38,-6],[38,6],[20,7],[0,6]],col||SK);
A('nogi','noga','Noga w bucie',3,0,()=>{shin();L(12,-7,10,-14,2);P([[32,9],[32,-10],[38,-28],[50,-30],[55,-20],[55,9]],'#e2343f')});
A('nogi','kogut','Kurza łapka',3,0,()=>{P(R(0,-3,40,6),'#f5b021');P([[38,-4],[56,-20],[45,1]],'#f5b021',{s:1,lw:3});P([[40,-3],[62,0],[40,4]],'#f5b021',{s:1,lw:3});P([[38,3],[55,18],[36,8]],'#f5b021',{s:1,lw:3})});
A('nogi','sprezyna','Sprężyna',4,1,()=>{const z=[];for(let i=0;i<9;i++)z.push([i*5,i%2?9:-9]);P(z,null,{open:1,s:1,lw:4});P(R(40,-16,9,32),'#9aa6b8')});
A('nogi','kolo','Kółko',4,2,()=>{P(R(0,-4,30,8),'#9aa6b8',{s:1});P(C(42,0,18),'#3a3340');P(C(42,0,7),'#cfd8e3',{lw:2.5})});
A('nogi','robot','Noga robota',5,3,()=>{P(R(0,-7,36,14),'#9aa6b8',{s:1});P(C(18,0,5),GOLD,{lw:2.5});P(R(34,-24,15,34),'#6c7a8c',{s:1})});
A('nogi','macka','Macka',6,4,()=>{P([[0,-10],[20,-12],[40,-4],[56,-12],[63,-24],[57,-6],[44,7],[22,3],[0,10]],'#9a5fd6');[[12,3],[26,5],[40,6]].forEach(q=>dot(q[0],q[1],3,'#ffb3d9'))});
A('nogi','kolcbut','But z kolcem',7,5,()=>{shin();P([[32,9],[32,-10],[38,-28],[50,-30],[55,-20],[55,9]],'#4a3f5c');P([[40,-28],[46,-48],[52,-28]],'#fff',{s:1,lw:2.5})});
A('nogi','rakieta','Rakieta',9,7,an=>{P([[44,-9],[68+Math.sin((an.t||0)*30)*6,0],[44,9]],'#ffb02e',{a:3,lw:3});P([[0,-10],[34,-13],[47,0],[34,13],[0,10]],'#e2343f');P(R(8,-11,7,22),'#fff',{s:1,lw:2.5})});
// dodatki
A('dod','rog','Róg',4,0,()=>{P([[-12,8],[12,8],[23,-18],[19,-50],[5,-24],[-10,-8]],'#fff1c9');L(-2,-6,14,-8,2);L(6,-22,19,-26,2)},{m:'f',def:[28,-46],th:[4,-20,34]});
A('twarz','plaster','Plaster',2,0,()=>{g.save();g.rotate(-.5);P(R(-14,-6,28,12),'#f3c9a0',{lw:3});P(R(-4,-4,8,8),'#d9a878',{ns:1,s:1});g.restore()},{def:[-36,18],th:[0,0,18]});
A('twarz','okulary','Ciemne okulary',5,0,()=>{[-1,1].forEach(k=>P([[k*40,-10],[k*5,-10],[k*7,8],[k*22,14],[k*37,8]],'#1b1210'));L(-6,-7,6,-7,5);L(-32,-4,-22,4,2,'#fff');L(12,-4,22,4,2,'#fff')},{def:[0,-14],th:[0,0,42]});
A('dod','peleryna','Peleryna',4,0,()=>P([[-28,-30],[30,-30],[62,80],[22,70],[-10,84],[-50,72],[-72,86]],'#c81e3a',{a:3}),{back:1,def:[0,0],th:[-5,28,64]});
A('twarz','tatuaz','Tatuaż',3,0,()=>{P([[0,10],[-13,-4],[-8,-14],[0,-8],[8,-14],[13,-4]],'#e2343f',{lw:2.5});P(R(-16,-3,32,9),'#fffdf2',{lw:2,s:1});g.fillStyle=INK;g.font='8px "Patrick Hand",sans-serif';g.textAlign='center';g.fillText('MAMA',0,4.5)},{def:[34,24],th:[0,0,18]});
A('twarz','opaska','Opaska pirata',4,1,()=>{L(-40,-14,40,8,3.5);P(C(0,0,16,17,8),INK)},{def:[20,-14],th:[0,0,34]});
A('dod','irokez','Irokez',5,2,()=>P([[-30,8],[-25,-30],[-12,-4],[-3,-44],[8,-6],[19,-32],[28,8]],'#ff3fa4',{s:1,a:2}),{th:[0,-16,36]});
A('dod','czapka','Czapka z daszkiem',5,2,()=>{P([[-34,8],[-32,-16],[-12,-32],[14,-30],[32,-12],[34,8]],'#3b7de0');P([[28,-2],[66,2],[64,12],[30,10]],'#2a5cb0');dot(0,-32,4,'#fff')},{th:[10,-10,50]});
A('dod','kolec','Kolec',5,3,()=>P([[-2,-12],[40,0],[-2,12]],'#e9eef5',{s:1}),{m:'r',back:1,def:[30,-46],th:[18,0,26]});
A('dod','helm','Hełm wikinga',7,3,()=>{[-1,1].forEach(k=>P([[k*34,-8],[k*62,-36],[k*42,6]],'#fff',{s:1}));P([[-40,8],[-38,-18],[-18,-36],[18,-36],[38,-18],[40,8]],'#b9c2d0');P(R(-44,2,88,11),GOLD)},{th:[0,-12,62]});
A('dod','cylinder','Cylinder',6,4,()=>{P([[-22,4],[-25,-52],[25,-52],[22,4]],'#3a3340');P(R(-24,-14,48,10),'#c81e3a',{s:1,lw:2.5});P(R(-38,2,76,10),'#3a3340')},{th:[0,-22,46]});
A('dod','lancuch','Złoty łańcuch',6,5,()=>{for(let i=0;i<9;i++){const a=.35+i*.3;P(C(Math.cos(a)*40,Math.sin(a)*34-10,5.5,5.5,6),GOLD,{lw:2.5})}P(ST(0,34,5,13,6,-1.57),GOLD,{lw:2.5,s:1})},{def:[0,24],th:[0,8,46]});
A('dod','ogon','Diabelski ogon',6,6,()=>P([[0,-5],[22,-12],[42,-4],[50,-14],[46,-26],[68,-8],[52,4],[40,9],[20,0],[0,6]],'#c81e3a'),{m:'r',back:1,def:[-44,36],th:[34,-8,40]});
A('dod','skrzydlo','Skrzydło',8,7,an=>{g.scale(1,1+Math.sin((an.t||0)*8)*.12);P([[0,-10],[30,-34],[82,-54],[70,-22],[94,0],[60,4],[66,30],[30,14],[0,12]],'#7a4fe0',{s:1,a:2})},{m:'r',back:1,def:[46,-12],th:[46,-10,56]});
A('dod','plomien','Płomienie',8,8,()=>{P([[-34,20],[-46,-20],[-24,-10],[-20,-62],[0,-30],[12,-84],[26,-28],[42,-42],[36,20],[0,34]],'#ff8a2a',{a:5});P([[-18,20],[-22,-10],[-8,-4],[2,-44],[14,-8],[22,-14],[18,20]],GOLD,{a:4,ns:1})},{back:1,def:[0,-40],th:[0,-24,62]});
A('dod','korona','Korona',10,9,()=>{P([[-28,8],[-33,-28],[-15,-10],[0,-38],[15,-10],[33,-28],[28,8]],GOLD,{s:1});dot(0,-6,5,'#e2343f');dot(-18,0,3.5,'#3b7de0');dot(18,0,3.5,'#3b7de0')},{th:[0,-14,40]});

// twarz: blizny i inne ciekawostki
const SCAR='#a8324a';
A('twarz','blizna','Blizna',3,0,()=>{L(-16,-12,16,12,4.5,SCAR);[[-8,-6],[0,0],[8,6]].forEach(q=>L(q[0]-4,q[1]+6,q[0]+4,q[1]-6,2.5))},{m:'f',def:[30,-28]});
A('twarz','szwy','Szwy',3,0,()=>{L(-26,0,26,0,3);for(let x=-20;x<=20;x+=10)L(x,-6,x,6,2.5)},{def:[0,-40],th:[0,0,30]});
A('twarz','piegi','Piegi',2,0,()=>[[-10,-4],[0,3],[10,-3],[-5,7],[6,8],[-15,5],[15,6]].forEach(q=>dot(q[0],q[1],2.2,'#a8562a')),{def:[0,4]});
A('twarz','brodawka','Brodawka z włosem',3,0,()=>{P(C(0,0,6,6,7),'#c98a5a',{lw:2.5});P([[0,-5],[4,-14],[-2,-21]],null,{open:1,lw:2})},{def:[32,10]});
A('twarz','nos','Czerwony nos',3,0,()=>{P(C(0,0,11,10,8),'#e2343f');dot(-3,-3,3,'#fff')},{def:[0,6]});
A('twarz','limo','Limo',3,0,()=>P(C(0,0,19,14,9),'rgba(110,60,150,.5)',{ns:1}),{def:[-20,-4]});
A('twarz','monobrew','Monobrew',4,0,()=>P([[-34,-2],[-16,-10],[0,-4],[16,-10],[34,-2],[16,0],[0,6],[-16,0]],'#3a2618'),{def:[0,-34],th:[0,0,36]});
A('twarz','bliznax','Blizna X',4,1,()=>{L(-12,-12,12,12,4.5,SCAR);L(12,-12,-12,12,4.5,SCAR)},{def:[-32,-30]});
A('twarz','zylka','Żyłka złości',4,1,()=>{L(-9,-3,-3,-9,3.5,'#e2343f');L(3,-9,9,-3,3.5,'#e2343f');L(9,3,3,9,3.5,'#e2343f');L(-3,9,-9,3,3.5,'#e2343f')},{def:[34,-40]});
A('twarz','barwy','Barwy wojenne',5,2,()=>{P([[-14,-8],[14,-4],[14,2],[-14,-2]],'#e2343f',{lw:2.5});P([[-14,4],[14,8],[14,14],[-14,10]],'#3b7de0',{lw:2.5})},{m:'f',def:[36,2]});
A('twarz','kolczyk','Kolczyk',4,2,()=>{P(C(0,6,9,10,8),null,{lw:7,a:.4});P(C(0,6,9,10,8),null,{lw:3.5,st:GOLD,a:.4})},{def:[0,10]});
A('twarz','zamek','Zamek błyskawiczny',5,3,()=>{L(-28,0,28,0,7,'#9aa6b8');for(let x=-24;x<=24;x+=6)L(x,-5,x,5,2);P(R(26,-5,8,15),GOLD,{s:1,lw:2.5})},{def:[0,26],th:[2,2,36]});
A('twarz','zlotyzab','Złoty ząb',5,4,()=>{P([[-6,-7],[6,-7],[7,5],[0,9],[-7,5]],GOLD,{lw:2.5});L(-2,-4,-2,2,1.5,'#fff')},{def:[8,22],th:[0,0,14]});
const meta=(D,k)=>D[k]!==undefined?D[k]:CATS[D.cat][k];
function drawPart(pt,an){const D=PARTS[pt.id];if(!D)return;const m=meta(D,'m');g.save();g.translate(pt.x,pt.y);
 if(m==='r'){let a=Math.atan2(pt.y,pt.x);if(D.cat==='nogi'&&an.k)a-=an.k*1.1;if(D.cat==='rece'&&an.w)a+=an.w*.5*(pt.x<0?1:-1);g.rotate(a);
  if(D.cat==='rece'&&an.c)g.translate(an.c*20,0);if(D.cat==='nogi'&&an.k)g.translate(an.k*14,0);if(pt.x<0)g.scale(1,-1)}
 else if(m==='f'){if((pt.x<0)===!meta(D,'inv'))g.scale(-1,1)}
 D.d(an);g.restore()}
function drawFruit(f,x,y,s,o){
 SC=1000;o=o||{};const t=o.t||0,a=o.atk,ev=o.evo||0,p=a?Math.sin(Math.min(a.p,1)*Math.PI):0;
 const an={t,c:a&&a.type==='cios'?p:0,k:a&&a.type==='kop'?p:0,w:a&&(a.type==='bron'||a.type==='super')?p:0};
 g.save();pen();g.translate(x,y+Math.sin(t*3)*3);s*=1+ev*.05;g.scale(s,s);
 if(a)g.translate(p*(a.type==='super'?170:115),a.type==='super'?-p*30:0);
 if(o.hurt){g.translate(-o.hurt*12,0);g.rotate(-o.hurt*.15)}
 if(o.dizzy)g.rotate(Math.sin(t*5)*.25);
 if(a&&a.type==='super')g.rotate(a.p*Math.PI*4);
 if(a&&a.type==='kop')g.rotate(-p*.25);
 if(ev){g.globalAlpha=.8;P(ST(0,0,14,104,78,t*.5),['','#ffd23f','#ff8a2a','#c04dff'][ev],{ns:1,a:3});g.globalAlpha=1}
 f.parts.forEach((pt,i)=>{const D=PARTS[pt.id];if(D&&meta(D,'back')){SC=2000+i*150;drawPart(pt,an)}});
 SC=1500;drawBody(f.base);
 f.parts.forEach((pt,i)=>{const D=PARTS[pt.id];if(D&&!meta(D,'back')){SC=2000+i*150;drawPart(pt,an)}});
 g.restore();
}

/* ---------- przeciwnicy ---------- */
const ENEMIES=[
 {name:'Zły Zając',col:'#c9c4d6',belly:'#f1eef7',ears:'long',x:['buck'],bg:'las',size:.9},
 {name:'Zombiak',col:'#9ad67f',belly:'#c3ecb0',ears:'none',x:['stitches','zombie'],bg:'zamek',size:1},
 {name:'Wściekła Wiewiórka',col:'#ee9044',belly:'#ffe0b5',ears:'point',x:['tail','buck'],bg:'las',size:.9},
 {name:'Dzik Dzikus',col:'#a06a48',belly:'#c79a76',ears:'round',x:['tusks','snout'],bg:'las',size:1.22,boss:1},
 {name:'Wampirek',col:'#e3dcf5',belly:'#e3dcf5',ears:'point',x:['cape','fangs','hair'],bg:'zamek',size:1},
 {name:'Jeż Kolczasty',col:'#c79a6e',belly:'#f0dcc0',ears:'round',x:['spikes','snout'],bg:'las',size:.95},
 {name:'Mumia',col:'#f2e7c8',belly:'#f2e7c8',ears:'none',x:['bandage','zombie'],bg:'zamek',size:1.05},
 {name:'Niedźwiedź Zombie',col:'#8fb078',belly:'#b6d3a2',ears:'round',x:['stitches','fangs','zombie'],bg:'zamek',size:1.35,boss:1},
 {name:'Kościotrupek',col:'#f6f3ea',belly:'#f6f3ea',ears:'none',x:['bones','zombie'],bg:'zamek',size:1},
 {name:'Wilk Łobuz',col:'#8493b8',belly:'#d3daec',ears:'point',x:['tail','fangs'],bg:'las',size:1.08},
 {name:'Ropucha Czarownica',col:'#86c75f',belly:'#dcf2b8',ears:'none',x:['hat','warts'],bg:'las',size:1.08},
 {name:'Smok Zgaga',col:'#e8604a',belly:'#ffdca6',ears:'point',x:['tail','fangs','spikes','horns'],bg:'zamek',size:1.4,boss:1}];
function U(list,fill,lw){const ps=list.map(q=>P(q,null,{ns:1}));g.lineWidth=(lw||4.2)*2;ps.forEach(p=>g.stroke(p));g.fillStyle=fill;ps.forEach(p=>g.fill(p))}
const LP=(x1,y1,x2,y2,w1,w2)=>{const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,m=(w1+w2)/2,mx=(x1+x2)/2,my=(y1+y2)/2;
 return[[x1+nx*w1,y1+ny*w1],[mx+nx*m,my+ny*m],[x2+nx*w2,y2+ny*w2],[x2-nx*w2,y2-ny*w2],[mx-nx*m,my-ny*m],[x1-nx*w1,y1-ny*w1]]};
const EBODY=[[0,-60],[30,-56],[48,-30],[52,6],[46,40],[24,58],[-24,58],[-46,40],[-52,6],[-48,-30],[-30,-56]];
function drawEnemy(E,x,y,s,o){
 SC=7000;o=o||{};const t=o.t||0,has=k=>E.x.includes(k),tele=o.tele||0,sp=o.strike?Math.sin(o.strike*Math.PI):0,ko=o.ko||0,animal=!has('zombie')&&!has('cape')&&!has('hat');
 g.save();pen();g.translate(x+ko*320,y+Math.sin(t*2.5+1)*3-ko*420+ko*ko*160);g.rotate(ko*9);
 s*=E.size;g.scale(-s,s);g.translate(-18*tele+sp*170,0);g.rotate(-.2*tele);g.scale(1+Math.sin(t*2.5)*.012,1-Math.sin(t*2.5)*.018);
 if(o.hurt){g.translate(-o.hurt*14,0);g.rotate(-o.hurt*.14)}
 if(o.rage&&!ko)g.translate(Math.sin(t*40)*1.5,0);
 if(has('cape'))P([[-30,-64],[-78,-80],[-92,74],[-60,60],[-36,76],[-6,62],[20,-30]],'#8a1638',{a:2});
 if(has('tail')){P([[-40,24],[-70,22],[-92,-6],[-90,-44],[-68,-66],[-52,-50],[-64,-30],[-56,-6]],E.col);P([[-86,-46],[-68,-64],[-55,-52],[-66,-40]],E.belly,{ns:1})}
 if(has('spikes'))P([[-28,-52],[-54,-68],[-44,-36],[-72,-34],[-52,-12],[-78,2],[-52,14],[-70,38],[-40,40]],'#7a5232',{s:1});
 if(has('horns')){P([[-28,-48],[-36,-84],[-10,-56]],'#fff1c9',{s:1});P([[16,-56],[34,-86],[38,-48]],'#fff1c9',{s:1})}
 if(E.ears==='long'){P([[-26,-48],[-32,-100],[-19,-126],[-8,-100],[-8,-48]],E.col);P([[4,-50],[10,-104],[23,-124],[30,-98],[22,-50]],E.col);
  P([[-21,-60],[-24,-98],[-18,-112],[-13,-98],[-13,-60]],'#ffb3c7',{ns:1});P([[11,-60],[14,-100],[21,-110],[24,-96],[18,-60]],'#ffb3c7',{ns:1})}
 if(E.ears==='round')[-36,36].forEach(k=>{P(C(k,-50,18),E.col);P(C(k,-50,9),E.belly,{ns:1})});
 if(E.ears==='point')[-1,1].forEach(k=>{P([[k*40,-26],[k*47,-84],[k*10,-54]],E.col,{s:1});P([[k*36,-40],[k*41,-70],[k*22,-54]],E.belly,{ns:1,s:1})});
 if(animal&&E.ears!=='long')P([[-12,-54],[-6,-74],[0,-60],[7,-76],[12,-54]],E.col,{s:1,lw:3.5});
 SC=7100;[-20,20].forEach(k=>{U([LP(k,38,k,78,9,8),C(k+7,82,16,9,8)],E.col);L(k+13,79,k+13,87,2);L(k+19,80,k+19,87,2)});
 U([LP(-36,2,-60,24,8,6.5),C(-63,27,10,10,8)],E.col);
 SC=7200;let hx=68,hy=24,pr=10;if(has('zombie')){hx=80;hy=2+Math.sin(t*3)*3}if(tele){hx=56;hy=24-80*tele;pr=14}if(sp){hx=70+sp*26;hy=4;pr=14}if(o.guard){hx=60;hy=-8;pr=12}
 U([LP(36,4,hx,hy,8,6.5),C(hx,hy,pr,pr,8)],E.col);
 SC=7300;shaded(EBODY,E.col,()=>{P(C(6,30,30,30),E.belly,{ns:1});
  if(has('bandage'))for(let i=-60;i<70;i+=15)L(-60,i,60,i+(i%2?10:-8),2.5,'#b9a878');
  if(has('bones')){[16,28,40].forEach(y=>L(-12,y,30,y,3));L(9,8,9,46,3)}
  if(has('warts'))[[-30,10],[-22,-36],[34,36],[-34,34]].forEach(q=>dot(q[0],q[1],4,'#5a9a3e'));
  if(has('hair'))P([[-64,-74],[64,-74],[64,-30],[30,-46],[8,-26],[-16,-46],[-64,-30]],INK,{ns:1})});
 SC=7600;const dz=o.hurt>.3||o.stun||ko;
 [[-8,13],[27,has('zombie')?18:13]].forEach(e=>{
  if(dz){L(e[0]-8,-25,e[0]+8,-10,4);L(e[0]+8,-25,e[0]-8,-10,4)}
  else if(!tele&&(t*1.3+E.size*9)%4<.14)L(e[0]-e[1],-15,e[0]+e[1],-15,4);
  else{P(C(e[0],-17,e[1],e[1]*1.1),tele||o.rage?'#ffd6d6':EYE);dot(e[0]+4,-15,3.2,tele?'#e0162b':INK);dot(e[0]+5.5,-17,1.1,'#fff')}});
 if(!dz){P([[-28,-40],[3,-27],[3,-34],[-25,-48]],INK,{s:1,ns:1});P([[48,-40],[17,-27],[17,-34],[45,-48]],INK,{s:1,ns:1})}
 if(animal){P(C(-26,4,7,5,7),'rgba(255,110,130,.3)',{ns:1});P(C(44,4,6,5,7),'rgba(255,110,130,.3)',{ns:1})}
 if(has('hat')){P([[-48,-42],[46,-52],[40,-60],[14,-62],[0,-120],[-18,-58],[-44,-52]],'#4a3f5c');L(-16,-60,13,-64,5,GOLD)}
 if(has('stitches')){L(-26,-48,8,-44,2.5);for(let i=0;i<4;i++)L(-22+i*9,-52+i,-22+i*9,-41+i,2.5)}
 if(has('snout')){P(C(16,6,17,12),'#f0a6a0');dot(10,6,3);dot(22,6,3)}
 const my=has('snout')?30:22;
 if(animal&&!has('snout')){P([[5,-2],[19,-2],[12,7]],E.ears==='long'?'#ff8fab':INK,{lw:2});L(12,8,12,my-4,2)}
 if(tele||sp)P(C(12,my+4,16,12),DARK);else P([[-8,my+8],[12,my-5],[32,my+8]],null,{open:1,lw:4.5});
 if(has('fangs')){TRI(3,my-1,5,15);TRI(21,my-1,5,15)}
 if(has('buck')){P(R(4,my-2,8,12),EYE,{s:1,lw:2.5});P(R(12,my-2,8,12),EYE,{s:1,lw:2.5})}
 if(has('tusks'))[[-8,-1],[34,1]].forEach(k=>P([[k[0]-5,my+6],[k[0]+k[1]*9,my-8],[k[0]+k[1]*4,my-26],[k[0]-k[1]*1,my-6],[k[0]+6,my+6]],EYE,{lw:2.5}));
 if(o.guard&&!ko){P([[52,-44],[70,-38],[90,-44],[92,4],[72,34],[50,4]],'#9fb7d9');L(71,-34,71,24,3,'#fff');L(56,-12,88,-12,3,'#fff')}
 if(o.stun&&!ko)for(let i=0;i<3;i++)P(ST(Math.cos(t*6+i*2.1)*34,-78+Math.sin(t*6+i*2.1)*8,5,9,4,t*3),GOLD,{lw:2.5,s:1});
 g.restore();
 if(tele&&!ko)comic(o.big?'!!':'!',x+10,y-98*s,o.hot?64:50,o.hot?'#ff2a3a':'#ffd23f',Math.sin(t*30)*.1);
}
function comic(txt,x,y,size,col,rot){
 g.save();g.translate(x,y);g.rotate(rot||0);g.font='800 '+size+'px "Baloo 2","Arial Rounded MT Bold",sans-serif';g.textAlign='center';g.textBaseline='middle';
 g.lineJoin='round';g.lineWidth=size*.22;g.strokeStyle=INK;g.strokeText(txt,0,0);g.fillStyle=col;g.fillText(txt,0,0);g.restore()}

/* ---------- tła ---------- */
const grain=(()=>{const k=document.createElement('canvas');k.width=k.height=256;const x=k.getContext('2d');for(let i=0;i<900;i++){x.fillStyle='rgba(90,55,25,'+(Math.random()*.09)+')';x.beginPath();x.arc(Math.random()*256,Math.random()*256,Math.random()*1.6,0,7);x.fill()}return c.createPattern(k,'repeat')})();
function drawBg(kind,t){
 g.save();pen();SC=10;
 if(kind==='papier'){g.fillStyle='#f3e7cb';g.fillRect(0,0,800,450);g.setLineDash([10,10]);P(C(150,215,142,142,18),'#fbf4e0',{st:'#cdb98a',lw:3,a:1});g.setLineDash([]);P(C(150,338,92,13),'rgba(70,40,15,.14)',{ns:1})}
 else{const las=kind==='las';g.fillStyle=las?'#c5e8d6':'#d4c3ee';g.fillRect(0,0,800,450);
  P(C(las?660:140,84,40,40,12),las?'#fff3b0':'#fffdf2',{lw:3.5});
  for(let i=0;i<3;i++){const x=(i*310+t*7)%940-70,y=58+i*34;P([[x-44,y],[x-32,y-17],[x-8,y-25],[x+14,y-19],[x+38,y-13],[x+46,y],[x,y+7]],las?'#fffdf2':'#efe6fb',{lw:3})}
  if(las){P([[-20,350],[80,250],[200,300],[330,230],[470,300],[600,240],[720,290],[820,250],[820,350]],'#9ed6a6',{lw:3.5});
   [[60,1],[190,.8],[640,1.1],[760,.85],[400,.7]].forEach(q=>{g.save();g.translate(q[0],345);g.scale(q[1],q[1]);P(R(-8,-70,16,72),'#a8703a');P(C(0,-110,48,56,9),'#5fb56a',{a:3});g.restore()})}
  else{P([[500,345],[500,170],[520,170],[520,120],[536,120],[536,138],[552,138],[552,120],[568,120],[568,170],[640,170],[640,120],[656,120],[656,138],[672,138],[672,120],[688,120],[688,170],[720,170],[720,345]],'#9a86c8',{s:1,lw:3.5});
   P([[592,345],[592,290],[610,270],[628,290],[628,345]],'#5b4a86',{lw:3});P(R(532,200,16,24),GOLD,{s:1,lw:2.5});P(R(668,200,16,24),GOLD,{s:1,lw:2.5});
   for(let i=0;i<3;i++){const bx=(i*300+t*40)%900-50,by=80+i*30+Math.sin(t*3+i)*10,f=Math.sin(t*12+i)*7;P([[bx-16,by-f],[bx-6,by+2],[bx,by-3],[bx+6,by+2],[bx+16,by-f]],null,{open:1,lw:3.5})}
   [[90,1],[250,.8],[420,.9]].forEach(q=>P([[q[0]-18,345],[q[0]-18,345-40*q[1]],[q[0],345-56*q[1]],[q[0]+18,345-40*q[1]],[q[0]+18,345]],'#b9aed2',{lw:3}))}
  P([[-20,344],[200,340],[420,346],[640,341],[820,345],[820,470],[-20,470]],las?'#ecdca6':'#e2d8ee',{lw:4});
  for(let i=0;i<7;i++)L(i*120+30,376+(i%3)*22,i*120+70,377+(i%3)*22,2.5,las?'#cdbb80':'#bfb2d2');
  if(las){[[130,362],[330,400],[470,372],[690,366],[610,424],[210,426]].forEach(q=>{const x=q[0],y=q[1];P([[x-9,y],[x-7,y-13],[x-2,y-3],[x,y-17],[x+3,y-3],[x+8,y-12],[x+9,y]],'#7fc47a',{s:1,lw:2.5})});
   [[400,416],[730,412]].forEach(q=>{const x=q[0],y=q[1];P(R(x-4,y-12,8,14),'#fffdf2',{lw:2.5});P([[x-15,y-10],[x-11,y-22],[x,y-27],[x+11,y-22],[x+15,y-10]],'#e8404f',{lw:2.5});dot(x-5,y-17,2.2,'#fff');dot(x+5,y-19,2.2,'#fff')})}
  else{[[140,368],[470,405],[700,372]].forEach(q=>{const x=q[0],y=q[1];P([[x-17,y],[x-12,y-13],[x,y-17],[x+13,y-10],[x+17,y]],'#b9aed2',{lw:2.5})});
   [[330,412],[640,426]].forEach(q=>{const x=q[0],y=q[1];P(R(x-2,y-28,4,7),'#57b85a',{s:1,lw:2});P(C(x,y-10,16,12,9),'#f08a2e',{lw:2.5});L(x,y-21,x,y+1,1.8);L(x-7,y-19,x-8,y,1.8);L(x+7,y-19,x+8,y,1.8)})}}
 g.fillStyle=grain;g.fillRect(0,0,800,450);g.restore();
}

