/* ================= stałe ================= */
const TS=16, MW=51, MH=29, GX=25, DAYLEN=30, TICKET=20, CAP=6, MAXV=70, MAXA=70, BREED=80, ADULT=45;
const PLOT_X=[2,10,18,26,34,42], PLOT_Y=[1,7,13,19]; const VPATH=[1,9,17,25,33,41,49], HPATH=[6,12,18,24];
const SAVEKEY='zoopatologia-v3', CAMPKEY='zoopatologia-v2-camp';
const $=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const NAMES=['Zenek','Grażyna','Mietek','Jadzia','Bożenka','Ziutek','Halinka','Kazik','Wiesia','Tadek','Danusia','Rysiek','Stefcia','Bogdan','Lucynka','Heniek','Gienia','Waldek','Krysia','Edek','Jola','Mirek','Zdzisia','Leszek','Basia','Józek','Teresa','Czesio','Irenka','Stasiek','Wacek','Ula'];
const ROMAN=['II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

const SPEC={
 zyrafa:{n:'Żyrafa',pl:'Żyrafy',p:900,hab:'sav',a:3,d:{t:'q',bw:16,bh:8,bc:'#e9b949',pat:'spots',pc:'#9a5b22',ll:11,lw:2,lc:'#e2b043',nl:16,nw:3,head:'gir',tail:'thin'}},
 zebra:{n:'Zebra',pl:'Zebry',p:600,hab:'sav',a:2,d:{t:'q',bw:16,bh:8,bc:'#f4f1e8',pat:'stripes',pc:'#2b2b2b',ll:9,lw:2,lc:'#e8e4d8',nl:5,nw:3,head:'zeb',tail:'thin'}},
 pingwin:{n:'Pingwin',pl:'Pingwiny',p:500,hab:'ice',a:2,d:{t:'u',bw:11,bh:15,bc:'#22252e',ll:0,head:'peng'}},
 lew:{n:'Lew',pl:'Lwy',p:1200,hab:'sav',a:4,d:{t:'q',bw:18,bh:8,bc:'#d9a441',ll:6,lw:3,lc:'#cf9a38',nl:0,head:'lion',tail:'tuft'}},
 kroko:{n:'Krokodyl',pl:'Krokodyle',p:1000,hab:'swamp',a:3,d:{t:'q',bw:20,bh:5,bc:'#4f9a3c',pat:'scales',pc:'#3a7a2b',ll:3,lw:2,lc:'#3f8a30',nl:0,head:'croc',tail:'croc'}},
 slon:{n:'Słoń',pl:'Słonie',p:1400,hab:'sav',a:5,d:{t:'q',bw:22,bh:12,bc:'#9aa3ab',ll:6,lw:4,lc:'#8a929a',nl:0,head:'ele',tail:'thin'}},
 tygrys:{n:'Tygrys',pl:'Tygrysy',p:1300,hab:'jungle',a:5,d:{t:'q',bw:18,bh:8,bc:'#e8892b',pat:'stripes',pc:'#2b2b2b',ll:6,lw:3,lc:'#d97a22',nl:0,head:'tiger',tail:'tiger'}},
 tapir:{n:'Tapir',pl:'Tapiry',p:800,hab:'jungle',a:3,d:{t:'q',bw:18,bh:9,bc:'#2f3038',pat:'saddle',pc:'#e9e6df',ll:5,lw:3,lc:'#2a2b32',nl:0,head:'tapir',tail:'stub'}},
 wielblad:{n:'Wielbłąd',pl:'Wielbłądy',p:900,hab:'desert',a:3,d:{t:'q',bw:18,bh:7,bc:'#c9a066',ll:12,lw:2,lc:'#bd935a',nl:8,nw:3,head:'camel',tail:'thin',hump:2}},
 hipo:{n:'Hipopotam',pl:'Hipopotamy',p:1500,hab:'swamp',a:5,d:{t:'q',bw:22,bh:11,bc:'#8f7f9e',ll:4,lw:4,lc:'#83748f',nl:0,head:'hippo',tail:'stub'}},
 flaming:{n:'Flaming',pl:'Flamingi',p:700,hab:'swamp',a:3,d:{t:'q',bw:10,bh:6,bc:'#f58fb0',ll:13,lw:1,lc:'#e8708f',nl:11,nw:2,head:'flam',tail:'feather',l2:true}}
};
const SPK=Object.keys(SPEC);
const PRE={zyrafa:'Żyra',zebra:'Ze',pingwin:'Pin',lew:'Lwo',kroko:'Kroko',slon:'Sło',tygrys:'Tygry',tapir:'Ta',wielblad:'Wiel',hipo:'Hipo',flaming:'Fla'};
const SUF={zyrafa:'rafa',zebra:'zebra',pingwin:'gwin',lew:'lew',kroko:'dyl',slon:'słoń',tygrys:'grys',tapir:'pir',wielblad:'błąd',hipo:'potam',flaming:'ming'};
const hybName=(sp,hy)=>PRE[sp]+SUF[hy];
const spName=a=>a.hy?hybName(a.sp,a.hy):SPEC[a.sp].n;
const DIS={
 zyrafodyl:{n:'Żyrafodyl',b:'pralnia',day:1,sym:'Szyja żyrafy, paszcza krokodyla. Kłapie na gości.',d:'Mutacja hybrydowa. Pacjent nie wie, czy jest roślinożercą, więc na wszelki wypadek gryzie wszystko.'},
 kratka:{n:'Kratkowica',b:'pralnia',day:1,sym:'Zwierzę wygląda jak koc piknikowy.',d:'Wzór w szkocką kratę. Goście dostają oczopląsu.'},
 balon:{n:'Balonoza',b:'kompresor',day:1,sym:'Napompowany, unosi się coraz wyżej.',d:'Pacjent odlatuje. Dosłownie. Nieleczony znika w stratosferze.'},
 toster:{n:'Tosteryzm',b:'agd',day:3,sym:'Zamiast zwierzęcia stoi toster na nogach.',d:'Strzela grzankami w gości. Grzanki trzeba potem sprzątać.'},
 disco:{n:'Disco-gorączka',b:'terapia',day:3,sym:'Mieni się kolorami i nie przestaje tańczyć.',d:'Goście są zachwyceni, ale rytm zaraża resztę stada.'},
 gigant:{n:'Gigantyzm',b:'kompresor',day:6,sym:'Rośnie. I rośnie. Płot zaczyna się bać.',d:'Po chwili pacjent rozwala płot i idzie na spacer między gości.'},
 gadul:{n:'Gadulstwo egzystencjalne',b:'terapia',day:6,sym:'Wygłasza monologi o sensie istnienia.',d:'Goście słuchają, poważnieją i przestają się dobrze bawić.'},
 teleport:{n:'Teleportoza',b:'stabil',day:9,sym:'Znika i pojawia się w losowych miejscach.',d:'Czasem ląduje w kolejce po lody. Goście nie są na to gotowi.'},
 odwrot:{n:'Odwrotność',b:'stabil',day:9,sym:'Chodzi do góry nogami, jakby obraził się na podłogę.',d:'Grawitacja działa w drugą stronę. Goście są zdezorientowani.'},
 laser:{n:'Laserowzrok',b:'agd',day:12,sym:'Z oczu strzelają czerwone promienie.',d:'Wypala dziury w alejkach. Fajne, ale skrajnie nielegalne.'},
 klon:{n:'Klonoza',b:'pralnia',day:12,sym:'Co jakiś czas obok pojawia się identyczna kopia.',d:'Każda kopia uważa, że to ona jest oryginałem. Kopie też chorują.'},
 lod:{n:'Zamrożenie',b:'sauna',day:4,sym:'Stoi zamknięty w bryle lodu.',d:'Nie rusza się i nie bawi gości. Sam z siebie nie odtaje.'},
 mini:{n:'Miniaturyzacja',b:'pompa',day:5,sym:'Skurczył się do rozmiarów chomika.',d:'Goście go nie widzą. Nieleczony zgubi się w trawie.'},
 plask:{n:'Naleśnikoza',b:'pompa',day:7,sym:'Płaski jak naleśnik.',d:'Ktoś na nim usiadł. Albo przejechał walec. Pacjent nie chce o tym mówić.'},
 wielogl:{n:'Dwugłowie',b:'terapia',day:8,sym:'Ma dwie głowy, które się kłócą.',d:'Głowy nie mogą się dogadać, w którą stronę iść. Pomaga terapia par.'},
 robot:{n:'Roboteza',b:'agd',day:10,sym:'Metaliczny, z anteną. Piszczy.',d:'Twierdzi, że jest kalkulatorem. Goście są raczej rozbawieni.'},
 szkielet:{n:'Szkieletoza',b:'malarnia',day:11,sym:'Widać wszystkie kości, jak na rentgenie.',d:'Pacjent zgubił piksele skóry. Goście uciekają z piskiem.'},
 niewidz:{n:'Niewidzialność',b:'malarnia',day:13,sym:'Miga i prawie znika.',d:'Goście płacą za bilet i nic nie widzą. Składają reklamacje.'},
 kosmita:{n:'Kosmitoza',b:'neutral',day:13,sym:'Zielony, z czułkami. Świeci.',d:'Wysyła sygnały w kosmos. UFO przylatuje po swoich.'},
 skrzyd:{n:'Skrzydlica',b:'stabil',day:14,sym:'Wyrosły mu skrzydła.',d:'Co chwilę przefruwa nad płotem. Goście są zachwyceni, ochrona mniej.'},
 ogien:{n:'Smoczy oddech',b:'gasnica',day:15,sym:'Zieje ogniem.',d:'Przypala alejki i brwi gości.'},
 grzyb:{n:'Grzybica tęczowa',b:'sauna',day:16,sym:'Na grzbiecie rosną muchomory.',d:'Zarodniki zarażają resztę stada.'},
 rakieta:{n:'Rakietoza',b:'gasnica',day:17,sym:'Na plecach ma silnik rakietowy.',d:'Co jakiś czas odpala i ląduje w losowym miejscu zoo.'},
 magnes:{n:'Magnetyzm',b:'neutral',day:18,sym:'Na głowie wyrósł magnes.',d:'Przyciąga śmieci i wyciąga monety z kieszeni gości.'}
};
const DIS_IDS=Object.keys(DIS);
const BLD={
 skaner:{n:'Skaner Dziwności',s:'SKANER',p:800,w:'#d6e8f7',r:'#3d6fb6',f:['#e8eef5','#d3dce6'],d:'Stawia pewną diagnozę. Weterynarz bez skanera tylko zgaduje.'},
 pralnia:{n:'Pralnia Genów',s:'PRALNIA GENÓW',p:1400,w:'#ffd6e7',r:'#d94f87',f:['#ffe6f0','#f6cfe0'],d:'Pierze DNA w 90 stopniach.'},
 kompresor:{n:'Kompresor',s:'KOMPRESOR',p:1200,w:'#c2c9d0',r:'#59636e',f:['#aeb6be','#9aa3ac'],d:'Wypuszcza powietrze i nadmiar zwierzęcia.'},
 agd:{n:'Serwis AGD',s:'SERWIS AGD',p:1300,w:'#ffd9a3',r:'#e07b1f',f:['#e8d2b0','#d9bf98'],d:'Naprawia wszystko, co ma wtyczkę albo lasery.'},
 terapia:{n:'Gabinet Terapii',s:'TERAPIA',p:1000,w:'#e6d6ff',r:'#7d4fd0',f:['#b98a5a','#a97a4c'],d:'Kozetka, chusteczki i poważne rozmowy.'},
 stabil:{n:'Stabilizator Grawitacji',s:'STABILIZATOR',p:1600,w:'#c3f2e8',r:'#1f8f7a',f:['#2b3b44','#33464f'],d:'Przypina pacjenta do rzeczywistości.'},
 pompa:{n:'Pompa Rozmiarów',s:'POMPA',p:1100,w:'#ffe3c2',r:'#d9822b',f:['#f2dcc0','#e6cba8'],d:'Dopompowuje to, czego brakuje.'},
 malarnia:{n:'Malarnia Pikseli',s:'MALARNIA',p:1200,w:'#fff6d6',r:'#e84393',f:['#ffffff','#f1ecdf'],d:'Domalowuje brakujące piksele.'},
 sauna:{n:'Sauna Termiczna',s:'SAUNA',p:1000,w:'#d9a46a',r:'#8b4a22',f:['#c48a52','#b67c46'],d:'Rozmraża, wysusza i relaksuje.'},
 gasnica:{n:'Remiza Gaśnicza',s:'REMIZA',p:1300,w:'#ffd0cc',r:'#d32f2f',f:['#d9d9d9','#c9c9c9'],d:'Gasi ogień, smoki i rakiety.'},
 neutral:{n:'Neutralizator Pól',s:'NEUTRALIZATOR',p:1500,w:'#e5dcff',r:'#4b2a9a',f:['#2a2140','#332a4c'],d:'Kasuje magnetyzm i kosmiczne fale.'},
 lab:{n:'Laboratorium',s:'LABORATORIUM',p:1200,w:'#eef3ff',r:'#5a6fd6',f:['#f4f6fb','#e1e6f0'],d:'Naukowcy prowadzą tu badania: szczepionki, ulepszenia, prognozy.'}
};
const BLD_IDS=Object.keys(BLD);
const MACH=['skaner','pralnia','kompresor','agd','terapia','stabil','pompa','malarnia','sauna','gasnica','neutral'];
const STAFF={
 vet:{n:'Weterynarz',hire:300,pay:40,d:'Bada chorych i wysyła ich na leczenie.'},
 jan:{n:'Sprzątacz',hire:150,pay:20,d:'Zbiera śmieci, grzanki i przypalenia.'},
 guard:{n:'Ochroniarz',hire:250,pay:30,d:'Łapie zwierzęta, które uciekły.'},
 mech:{n:'Mechanik',hire:250,pay:35,d:'Naprawia zużyte maszyny, zanim wybuchną.'},
 sci:{n:'Naukowiec',hire:350,pay:45,d:'Pracuje w laboratorium nad badaniami.'}
};
const LINES=['Czy jestem żyrafą, czy tylko długą myślą?','Płot to stan umysłu.','Kto karmi karmiciela?','Wszystko jest pikselem.','A może to wy jesteście w zoo?','Zjadłem trawę. Trawa zjadła czas.','Po co mi szyja, skoro nie mam celu?','Bilet ulgowy na egzystencję, poproszę.','Czy grzanka marzy o tosterze?','Jutro też będzie wtorek.'];
const ARGUE=['To moja trawa!','Nie, moja!','Idziemy w lewo!','W prawo!','Ty zawsze tak!','Przestań mnie przedrzeźniać!','Jestem tą mądrzejszą głową.'];
const THERAPY=['A jak się pan z tym czuje?','Proszę opowiedzieć o mamie.','To nie pana wina, że pan toster.','Hmm. Ciekawe.'];
const ALL=DIS_IDS.slice();
const LEVELS=[
 {n:'Kozłów Dolny',d:'Wiejskie zoo za stodołą. Meteor spadł prosto do szamba.',theme:'green',money:5000,rate:.75,dayMul:1.2,loanMax:8000,
  start:[[19,'pingwin',3],[20,'zyrafa',2],[21,'zebra',2]],pool:['zyrafodyl','kratka','balon','toster','disco','gigant','gadul','lod','mini'],ev:['rain','vip'],
  goals:{rep:60,cured:12,animals:15,net:6000,hyb:0}},
 {n:'Zoo Pod Kominem',d:'Miejskie zoo obok elektrowni. Smog podsuwa zwierzętom nowe pomysły.',theme:'city',money:5000,rate:1,dayMul:1,loanMax:10000,
  start:[[19,'lew',2],[20,'zyrafa',2],[21,'zebra',2]],pool:['zyrafodyl','kratka','balon','toster','disco','gigant','gadul','lod','mini','teleport','odwrot','laser','plask','wielogl','robot','szkielet','skrzyd'],ev:['rain','vip','ufo','quake'],
  goals:{rep:70,cured:25,animals:20,net:10000,hyb:1}},
 {n:'Safari Na Bagnach',d:'Mgła, komary i krokodyle, które wiedzą za dużo.',theme:'swamp',money:5000,rate:1.1,dayMul:.85,loanMax:12000,
  start:[[19,'kroko',2],[20,'hipo',2],[21,'flaming',3]],pool:ALL,ev:['rain','vip','ufo','quake','quake'],
  goals:{rep:75,cured:35,animals:25,net:15000,hyb:3}},
 {n:'Strefa 51',d:'Pustynna baza wojskowa. Kosmici bywają tu częściej niż goście.',theme:'desert',money:4500,rate:1.3,dayMul:.7,loanMax:15000,
  start:[[19,'wielblad',2],[20,'lew',2],[21,'tygrys',2]],pool:ALL,ev:['rain','vip','ufo','ufo','ufo','quake'],
  goals:{rep:80,cured:45,animals:30,net:20000,hyb:5}}
];
const GOALDEF=[{k:'rep',n:'Sława',u:''},{k:'cured',n:'Wyleczone przypadki',u:''},{k:'animals',n:'Zwierzęta w zoo',u:''},{k:'net',n:'Gotówka minus kredyt',u:' zł'},{k:'hyb',n:'Urodzone hybrydy',u:''}];
const THEMES={
 green:{g:'#5aa83e',g1:'#4b9433',g2:'#69b84a',tree:'round',c1:'#2e6e2f',c2:'#3f8f3a',c3:'#5fae4f',empty:'#9c7f55'},
 city:{g:'#679a4c',g1:'#58873f',g2:'#78a95a',tree:'round',c1:'#355f36',c2:'#467a43',c3:'#5e9450',empty:'#8f7a5c'},
 swamp:{g:'#467a44',g1:'#3a6839',g2:'#568c50',tree:'willow',c1:'#23522c',c2:'#2f6a38',c3:'#4b8a4e',empty:'#6e6a48'},
 desert:{g:'#dcb76d',g1:'#caa056',g2:'#e8c987',tree:'cactus',c1:'#3f8a4a',c2:'#56a35e',c3:'#7cc27f',empty:'#c49a58'}
};

