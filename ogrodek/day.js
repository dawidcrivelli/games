// Łakome Zwierzaki — dane: karty roślin, gatunki (zachowanie), scenariusz dnia (fale zwierzaków, nowe karty, deszcz, lektor).
'use strict';

// Karty u góry ekranu: koszt w ziarenkach (kropki), odnowienie karty (s), czas wzrostu (s), życie, plon do kosza po zbiorze
const CARDS = [
  { k: 'sunflower', cost: 1, cd: 3, grow: 12, hp: 6, crop: 0, name: 'słonecznik' },
  { k: 'carrot',    cost: 1, cd: 1.5, grow: 15, hp: 4, crop: 1, name: 'marchewka' },
  { k: 'cabbage',   cost: 2, cd: 3, grow: 24, hp: 8, crop: 3, name: 'kapusta' },
  { k: 'onion',     cost: 2, cd: 5, grow: 8, hp: 6, crop: 0, name: 'cebula' },
  { k: 'thorns',    cost: 2, cd: 5, grow: 6, hp: 14, crop: 0, name: 'kolczasty krzak' },
  { k: 'tree',      cost: 3, cd: 8, grow: 40, hp: 10, crop: 0, name: 'jabłonka' },
  { k: 'lion',      cost: 4, cd: 12, grow: 0, hp: 99, crop: 0, name: 'lew' },
];
const CARD = Object.fromEntries(CARDS.map(c => [c.k, c]));

// Gatunki: h — wysokość w świecie (m), sp — prędkość (m/s), bite — zjadanie (życia/s), brave — ile szturchnięć, full — ile roślin zje,
// jump — przeskakuje krzaki, smell — ucieka przed cebulą, young — je tylko młode rośliny, thorns — je kolce, trees — je duże drzewa,
// under — chodzi pod ziemią (kret), boss — szef (lew go nie przegoni od razu), saw — piła mechaniczna przy jedzeniu
const SPECIES = {
  rabbit:   { h: 1.4, sp: 1.5, bite: 1.3, brave: 1, full: 3, smell: 1, name: 'królik', bub: 'Chrup!' },
  chicken:  { h: 1.1, sp: 1.0, bite: .8, brave: 1, full: 2, smell: 1, jump: 1, young: 1, name: 'kura', bub: 'Ko-ko!' },
  deer:     { h: 2.4, sp: 2.0, bite: 1.3, brave: 1, full: 2, smell: 1, jump: 1, name: 'sarenka', bub: 'Mniam!' },
  mole:     { h: 0.74, sp: 1.7, bite: 1.0, brave: 1, full: 2, smell: 1, under: 1, name: 'kret', bub: 'Chrup!' },
  cow:      { h: 2.6, sp: .7, bite: 2.2, brave: 3, full: 3, name: 'krowa', bub: 'Muuu!' },
  goat:     { h: 1.9, sp: 1.2, bite: 1.6, brave: 2, full: 3, thorns: 1, name: 'koza', bub: 'Meee!' },
  beaver:   { h: 1.4, sp: 1.0, bite: 3.2, brave: 5, full: 3, thorns: 1, trees: 1, boss: 1, saw: 1, name: 'bóbr', bub: 'Brrrzzz!' },
  mouse:    { h: 0.47, sp: 1.8, bite: .6, brave: 1, full: 1, smell: 1, name: 'mysz', bub: 'Pi-pi!' },
  // zwierzęta z zoo (models/animals.js) — na następne dni; ?zw=elephant,giraffe w adresie, żeby je zobaczyć od razu
  elephant: { h: 4.3, sp: .7, bite: 3, brave: 4, full: 4, thorns: 1, trees: 1, name: 'słoń', bub: 'Tru-tu-tu!' },
  giraffe:  { h: 5.7, sp: 1.0, bite: 2, brave: 3, full: 3, trees: 1, name: 'żyrafa', bub: 'Mniam!' },
  zebra:    { h: 2.7, sp: 1.6, bite: 1.5, brave: 2, full: 2, smell: 1, name: 'zebra', bub: 'Iha!' },
  hippo:    { h: 2.4, sp: .6, bite: 2.5, brave: 4, full: 3, name: 'hipopotam', bub: 'Mlask!' },
  panda:    { h: 2.3, sp: .8, bite: 1.5, brave: 2, full: 3, name: 'panda', bub: 'Mniam!' },
  kangaroo: { h: 2.7, sp: 1.8, bite: 1.2, brave: 2, full: 2, jump: 1, name: 'kangur', bub: 'Hop!' },
  penguin:  { h: 1.5, sp: .9, bite: .8, brave: 1, full: 2, smell: 1, name: 'pingwin', bub: 'Kłak!' },
};

// Scenariusz dnia 1 (sekundy). spawn: k, n (ile), row (rząd 0–4, inaczej losowy z roślinami), gap (odstęp)
const DAY_LEN = 215;
const SCRIPT = [
  { t: .5, say: 'Dzień dobry! Posadź słonecznik. Da nam ziarenka.', tut: 1 },
  { t: 26, spawn: 'rabbit', say: 'Uwaga, królik! Stuknij go, a ręka z widłami go przegoni!', first: 1 },
  { t: 30, unlock: 'cabbage', say: 'Nowa roślina: kapusta! Daje dużo do kosza.' },
  { t: 42, spawn: 'rabbit', n: 2, gap: 3 },
  { t: 50, unlock: 'onion', say: 'Cebula śmierdzi! Zwierzaki przed nią uciekają.' },
  { t: 58, spawn: 'chicken', n: 3, gap: .8, say: 'Kury! Dziobią małe roślinki.' },
  { t: 70, spawn: 'rabbit', n: 3, gap: 2 },
  { t: 76, unlock: 'thorns', say: 'Kolczasty krzak! Zatrzyma zwierzaki.' },
  { t: 84, spawn: 'mole', say: 'Kret! Wychodzi spod ziemi!' },
  { t: 94, spawn: 'deer', say: 'Sarenka! Skacze przez krzaki.' },
  { t: 100, unlock: 'tree', say: 'Jabłonka! Rośnie długo, ale potem daje jabłka.' },
  { t: 106, spawn: 'rabbit', n: 2, gap: 2 }, { t: 108, spawn: 'chicken', n: 3, gap: 1 },
  { t: 112, rain: 1, say: 'Pada deszcz! Rośliny rosną szybciej.' },
  { t: 120, spawn: 'cow', say: 'Krowa! Trzeba ją szturchnąć trzy razy.' },
  { t: 128, unlock: 'lion', say: 'Lew! Ryczy i straszy zwierzaki.' },
  { t: 131, rain: 0 },
  { t: 136, spawn: 'deer', n: 2, gap: 3 }, { t: 139, spawn: 'rabbit', n: 2, gap: 2 },
  { t: 146, spawn: 'mole', n: 2, gap: 3 },
  { t: 154, spawn: 'cow' }, { t: 156, spawn: 'chicken', n: 2, gap: 1 },
  { t: 166, horde: 1, say: 'Uwaga! Horda z lasu!' },
  { t: 168, spawn: 'rabbit', n: 6, gap: 1 }, { t: 170, spawn: 'chicken', n: 3, gap: .7 }, { t: 173, spawn: 'goat', say: 'Koza! Zjada nawet kolce!' },
  { t: 175, spawn: 'deer', n: 2, gap: 2 },
  { t: 190, spawn: 'beaver', n: 2, gap: 4, boss: 1, say: 'Bobry! Mają zęby jak piły! Ratuj drzewa!' },
];

// liczebniki: 1 warzywo, 2 warzywa, 5 warzyw
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;
