// Łakome Zwierzaki — dane: karty roślin, gatunki (zachowanie), 5 dni (fale zwierzaków, nowe karty, deszcz, lektor).
'use strict';

// cat: 'bean' daje fasolki, 'crop' plon do kosza (i fasolki przy zbiorze), 'guard' obrona (płoszy, kłuje, straszy)
// cost — fasolki, cd — odnowienie karty (s), grow — wzrost (s), hp — życie, crop — do kosza, beans — fasolki przy zbiorze
const CARDS = [
  { k: 'beanstalk', cat: 'bean',  cost: 1, cd: 3, grow: 12, hp: 6, crop: 0, beans: 0, name: 'magiczna fasola' },
  { k: 'carrot',    cat: 'crop',  cost: 1, cd: 1.5, grow: 14, hp: 4, crop: 1, beans: 1, name: 'marchewka' },
  { k: 'wheat',     cat: 'crop',  cost: 2, cd: 3, grow: 22, hp: 7, crop: 3, beans: 1, name: 'pszenica' },
  { k: 'tree',      cat: 'crop',  cost: 3, cd: 8, grow: 40, hp: 10, crop: 0, beans: 0, name: 'jabłonka' },
  { k: 'onion',     cat: 'guard', cost: 2, cd: 6, grow: 6, hp: 8, crop: 0, name: 'cebula' },
  { k: 'thorns',    cat: 'guard', cost: 2, cd: 6, grow: 5, hp: 12, crop: 0, name: 'kolczasty krzak' },
  { k: 'scarecrow', cat: 'guard', cost: 3, cd: 9, grow: 0, hp: 99, crop: 0, name: 'strach na wróble' },
  { k: 'lion',      cat: 'guard', cost: 4, cd: 14, grow: 0, hp: 99, crop: 0, name: 'lew' },
  { k: 'mouse',     cat: 'guard', cost: 1, cd: 8, grow: 0, hp: 99, crop: 0, name: 'mysz na słonie' },
];
const CARD = Object.fromEntries(CARDS.map(c => [c.k, c]));

// Gatunki: h — wysokość w świecie (m), sp — prędkość (m/s), bite — zjadanie (życia/s), brave — ile szturchnięć, full — ile roślin zje,
// jump — przeskakuje krzaki, smell — boi się cebuli (bez smell: zjada cebulę), young — je tylko młode rośliny, thorns — je kolce,
// trees — je duże drzewa, under — pod ziemią (kret), boss — szef (lew odbiera mniej), saw — piła mechaniczna, bird — strach go od razu przegania,
// mouseFear — ucieka przed myszą
const SPECIES = {
  rabbit:   { h: 1.4, sp: 1.5, bite: 1.3, brave: 2, full: 3, smell: 1, name: 'królik', bub: 'Chrup!' },
  chicken:  { h: 1.1, sp: 1.0, bite: .8, brave: 2, full: 2, smell: 1, jump: 1, young: 1, bird: 1, name: 'kura', bub: 'Ko-ko!' },
  deer:     { h: 2.4, sp: 2.0, bite: 1.3, brave: 2, full: 2, smell: 1, jump: 1, name: 'sarenka', bub: 'Mniam!' },
  mole:     { h: .74, sp: 1.7, bite: 1.0, brave: 2, full: 2, smell: 1, under: 1, name: 'kret', bub: 'Chrup!' },
  cow:      { h: 2.6, sp: .7, bite: 2.2, brave: 4, full: 3, name: 'krowa', bub: 'Muuu!' },
  goat:     { h: 1.9, sp: 1.2, bite: 1.6, brave: 3, full: 3, thorns: 1, name: 'koza', bub: 'Meee!' },
  beaver:   { h: 1.4, sp: 1.0, bite: 3.2, brave: 6, full: 3, thorns: 1, trees: 1, boss: 1, saw: 1, name: 'bóbr', bub: 'Brrrzzz!' },
  mouse:    { h: .47, sp: 1.8, bite: .6, brave: 1, full: 1, smell: 1, name: 'mysz', bub: 'Pi-pi!' },
  elephant: { h: 3.4, sp: .65, bite: 3, brave: 5, full: 4, thorns: 1, trees: 1, mouseFear: 1, name: 'słoń', bub: 'Tru-tu-tu!' },
  giraffe:  { h: 4.6, sp: 1.0, bite: 2, brave: 3, full: 3, trees: 1, jump: 1, name: 'żyrafa', bub: 'Mniam!' },
  zebra:    { h: 2.7, sp: 1.7, bite: 1.5, brave: 2, full: 2, smell: 1, name: 'zebra', bub: 'Iha!' },
  hippo:    { h: 2.4, sp: .6, bite: 2.5, brave: 5, full: 3, name: 'hipopotam', bub: 'Mlask!' },
  panda:    { h: 2.3, sp: .8, bite: 1.5, brave: 3, full: 3, name: 'panda', bub: 'Mniam!' },
  kangaroo: { h: 2.7, sp: 1.8, bite: 1.2, brave: 2, full: 2, jump: 1, name: 'kangur', bub: 'Hop!' },
  penguin:  { h: 1.5, sp: .9, bite: .8, brave: 2, full: 2, smell: 1, name: 'pingwin', bub: 'Kłak!' },
};

// 5 dni. start — karty od rana, stars — kosz na 1/2/3 gwiazdki, hero — zwierzak na przycisku dnia, seeds — fasolki na start.
// Scenariusz (sekundy): spawn: k, n (ile), row (rząd 0–4, inaczej losowy z roślinami), gap (odstęp); unlock: karta; rain: 1/0; horde/boss: napis; say: lektor
const ALL = CARDS.map(c => c.k);
const DAYS = [
  { name: 'Króliki', hero: 'rabbit', len: 170, seeds: 4, start: ['beanstalk', 'carrot'], stars: [12, 26, 40], script: [
    { t: .5, say: 'Dzień dobry! Posadź magiczną fasolę. Da nam fasolki na nowe rośliny.', tut: 1 },
    { t: 24, spawn: 'rabbit', row: 2, say: 'Uwaga, królik! Stuknij go widłami. Dwa razy!' },
    { t: 34, unlock: 'wheat', say: 'Pszenica! Zielone karty to plony do kosza.' },
    { t: 44, spawn: 'rabbit', n: 2, gap: 3 },
    { t: 56, unlock: 'onion', say: 'Cebula! Czerwone karty to obrona. Cebula śmierdzi, ale smrodu starcza tylko na chwilę.' },
    { t: 64, spawn: 'chicken', n: 3, gap: .8, say: 'Kury! Dziobią małe roślinki.' },
    { t: 80, spawn: 'rabbit', n: 3, gap: 2 },
    { t: 92, unlock: 'thorns', say: 'Kolczasty krzak! Kłuje i zatrzymuje zwierzaki, ale się zużywa.' },
    { t: 100, spawn: 'mole', say: 'Kret! Wychodzi spod ziemi! Stuknij kopczyk!' },
    { t: 110, spawn: 'chicken', n: 2, gap: 1 }, { t: 114, spawn: 'rabbit', n: 2, gap: 2 },
    { t: 120, rain: 1, say: 'Pada deszcz! Rośliny rosną szybciej.' }, { t: 136, rain: 0 },
    { t: 130, spawn: 'mole' },
    { t: 142, horde: 'Króliki z lasu!', say: 'Uwaga! Króliki z lasu!' }, { t: 144, spawn: 'rabbit', n: 6, gap: 1.1 }, { t: 148, spawn: 'chicken', n: 3, gap: .8 },
  ] },
  { name: 'Sarenki i krowy', hero: 'cow', len: 195, seeds: 5, start: ['beanstalk', 'carrot', 'wheat', 'onion', 'thorns'], stars: [18, 36, 50], script: [
    { t: .5, unlock: 'scarecrow', say: 'Drugi dzień! Nowy obrońca: strach na wróble. Straszy wszystko dookoła.' },
    { t: 14, spawn: 'rabbit', n: 2, gap: 2 },
    { t: 28, spawn: 'deer', say: 'Sarenka! Skacze przez kolczaste krzaki.' },
    { t: 40, spawn: 'chicken', n: 3, gap: .7 }, { t: 44, spawn: 'rabbit', n: 2, gap: 1.5 },
    { t: 54, unlock: 'tree', say: 'Jabłonka! Rośnie długo, potem daje jabłka.' },
    { t: 62, spawn: 'cow', say: 'Krowa! Duża i uparta, widły ledwo ją ruszą. Cebuli się nie boi. Postaw stracha na wróble!' },
    { t: 78, spawn: 'deer', n: 2, gap: 2 }, { t: 82, spawn: 'mole' },
    { t: 94, rain: 1 }, { t: 112, rain: 0 },
    { t: 98, spawn: 'rabbit', n: 3, gap: 1.5 }, { t: 104, spawn: 'cow' },
    { t: 118, spawn: 'goat', say: 'Koza! Zjada nawet kolce!' },
    { t: 130, spawn: 'deer', n: 2, gap: 2 }, { t: 134, spawn: 'chicken', n: 3, gap: .7 }, { t: 138, spawn: 'mole', n: 2, gap: 3 },
    { t: 150, horde: 'Horda z lasu!', say: 'Uwaga! Horda z lasu!' }, { t: 152, spawn: 'rabbit', n: 5, gap: 1 }, { t: 155, spawn: 'deer', n: 3, gap: 1.5 },
    { t: 160, spawn: 'cow', n: 2, gap: 4 }, { t: 166, spawn: 'goat' },
  ] },
  { name: 'Bobry', hero: 'beaver', len: 205, seeds: 6, start: ['beanstalk', 'carrot', 'wheat', 'tree', 'onion', 'thorns', 'scarecrow'], stars: [20, 42, 60], script: [
    { t: .5, say: 'Trzeci dzień! Posadź jabłonki, zanim przyjdą bobry. Duże jabłonki są bezpieczne… prawie.' },
    { t: 16, spawn: 'rabbit', n: 2, gap: 2 }, { t: 26, spawn: 'chicken', n: 3, gap: .7 },
    { t: 34, unlock: 'lion', say: 'Lew! Ryczy na cały rząd i straszy zwierzaki.' },
    { t: 44, spawn: 'deer', n: 2, gap: 2 }, { t: 52, spawn: 'mole' },
    { t: 66, spawn: 'beaver', boss: 'Bóbr!', say: 'Bóbr! Ma zęby jak piła! Ratuj drzewa! Szturchaj go!' },
    { t: 84, spawn: 'cow' }, { t: 88, spawn: 'rabbit', n: 3, gap: 1.2 },
    { t: 100, rain: 1, say: 'Burza! Rośliny rosną szybciej.' }, { t: 120, rain: 0 },
    { t: 104, spawn: 'goat' }, { t: 110, spawn: 'deer', n: 2, gap: 2 }, { t: 118, spawn: 'beaver' },
    { t: 132, spawn: 'mole', n: 2, gap: 2 }, { t: 136, spawn: 'chicken', n: 3, gap: .6 },
    { t: 148, horde: 'Horda z lasu!', say: 'Uwaga! Horda z lasu!' }, { t: 150, spawn: 'rabbit', n: 5, gap: 1 }, { t: 152, spawn: 'deer', n: 2, gap: 2 }, { t: 158, spawn: 'cow' },
    { t: 172, spawn: 'beaver', n: 3, gap: 4, boss: 'Bobry!', say: 'Bobry! Cała rodzina bobrów!' },
  ] },
  { name: 'Ucieczka z zoo', hero: 'elephant', len: 215, seeds: 7, start: ['beanstalk', 'carrot', 'wheat', 'tree', 'onion', 'thorns', 'scarecrow', 'lion'], stars: [20, 45, 65], script: [
    { t: .5, say: 'Czwarty dzień! Ktoś otworzył zoo! Zwierzaki z zoo idą do ogródka!' },
    { t: 14, spawn: 'zebra', n: 3, gap: 1.2, say: 'Zebry! Chodzą stadem.' },
    { t: 30, spawn: 'kangaroo', say: 'Kangur! Skacze przez krzaki.' },
    { t: 42, spawn: 'rabbit', n: 2, gap: 2 }, { t: 48, spawn: 'panda' },
    { t: 58, unlock: 'mouse', say: 'Mysz! Słonie bardzo boją się myszy!' },
    { t: 70, spawn: 'elephant', say: 'Słoń! Zjada wszystko! Postaw przed nim mysz!' },
    { t: 86, spawn: 'giraffe', say: 'Żyrafa! Zjada liście z jabłonek!' },
    { t: 98, spawn: 'zebra', n: 3, gap: 1 }, { t: 104, spawn: 'hippo', say: 'Hipopotam! Bardzo uparty. Na niego lew!' },
    { t: 112, rain: 1 }, { t: 128, rain: 0 },
    { t: 118, spawn: 'kangaroo', n: 2, gap: 2 }, { t: 126, spawn: 'elephant' },
    { t: 140, spawn: 'penguin', n: 3, gap: 1, say: 'Pingwiny! Też uciekły z zoo!' }, { t: 146, spawn: 'giraffe' },
    { t: 158, horde: 'Całe zoo!', say: 'Uwaga! Całe zoo idzie!' }, { t: 160, spawn: 'zebra', n: 4, gap: 1 }, { t: 164, spawn: 'kangaroo', n: 2, gap: 2 },
    { t: 170, spawn: 'elephant', n: 2, gap: 5 }, { t: 176, spawn: 'hippo' }, { t: 180, spawn: 'giraffe' },
  ] },
  { name: 'Wielka horda', hero: 'farmer', len: 235, seeds: 8, start: ALL, stars: [12, 40, 62], script: [
    { t: .5, say: 'Ostatni dzień! Wszystkie zwierzaki chcą zjeść nasz ogródek. Do dzieła!' },
    { t: 12, spawn: 'rabbit', n: 3, gap: 1.5 }, { t: 22, spawn: 'chicken', n: 4, gap: .6 }, { t: 32, spawn: 'mole', n: 2, gap: 2 },
    { t: 44, spawn: 'deer', n: 2, gap: 2 }, { t: 52, spawn: 'cow' }, { t: 60, spawn: 'zebra', n: 3, gap: 1 },
    { t: 70, horde: 'Horda z lasu!', say: 'Pierwsza horda!' }, { t: 72, spawn: 'rabbit', n: 5, gap: .9 }, { t: 75, spawn: 'goat', n: 2, gap: 3 },
    { t: 90, spawn: 'beaver', boss: 'Bóbr!' }, { t: 96, spawn: 'kangaroo', n: 2, gap: 2 },
    { t: 104, rain: 1 }, { t: 124, rain: 0 },
    { t: 110, spawn: 'elephant' }, { t: 118, spawn: 'giraffe' }, { t: 124, spawn: 'hippo' }, { t: 128, spawn: 'penguin', n: 3, gap: 1 },
    { t: 140, horde: 'Druga horda!', say: 'Druga horda!' }, { t: 142, spawn: 'deer', n: 3, gap: 1.2 }, { t: 145, spawn: 'cow', n: 2, gap: 3 }, { t: 148, spawn: 'chicken', n: 4, gap: .6 },
    { t: 160, spawn: 'panda' }, { t: 166, spawn: 'mole', n: 3, gap: 1.5 },
    { t: 182, horde: 'Wielka horda!', say: 'Wielka horda! Wszyscy naraz!' }, { t: 184, spawn: 'rabbit', n: 6, gap: .8 }, { t: 186, spawn: 'zebra', n: 3, gap: 1 },
    { t: 190, spawn: 'elephant', n: 2, gap: 4 }, { t: 194, spawn: 'beaver', n: 2, gap: 3 }, { t: 198, spawn: 'kangaroo', n: 2, gap: 2 }, { t: 202, spawn: 'giraffe' },
  ] },
];

// liczebniki: 1 warzywo, 2 warzywa, 5 warzyw
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;
