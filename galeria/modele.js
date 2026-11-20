// Galeria: co pokazać. Model budowany w ukrytej ramce z grą `gra` (jej silnik, materiały),
// `js` = wyrażenie zwracające Object3D, {g|root}, geometrię albo tablicę. `typ` grupuje warianty obok siebie.
// kategoria → prefiks pliku w models/
const KAT_PLIK = { 'zwierzęta': 'zwierzeta', pozy: 'zwierzeta', morze: 'morze', ludzie: 'ludzie', pojazdy: 'pojazdy', rolnicze: 'rolnicze', 'pociągi': 'pociagi', piraci: 'piraci', statki: 'statki', 'broń': 'bron', bryki: 'pojazdy', trasy: 'trasy', pacjenci: 'pacjenci', anatomia: 'anatomia' };
const KATEGORIE = Object.keys(KAT_PLIK);
const ZOO = [['słoń', 'elephant'], ['żyrafa', 'giraffe'], ['zebra', 'zebra'], ['hipopotam', 'hippo'], ['krokodyl', 'crocodile'],
  ['lew', 'lion'], ['tygrys', 'tiger'], ['panda', 'panda'], ['pingwin', 'penguin'], ['kangur', 'kangaroo']];
const RAFA_RYBY = ['clown', 'blue', 'yellow', 'serg', 'chrom', 'anth', 'butt', 'parrot'];
const MORZE = [['delfin', 'Dolphin'], ['wieloryb', 'Whale'], ['rekin', 'Shark'], ['manta', 'Manta'], ['żółw', 'Turtle']];

const MODELE = [
  ...ZOO.map(([typ, f]) => ({ kat: 'zwierzęta', typ, gra: 'pralnia', plik: '', js: `ZOO.MK.${f}()` })),
  // pozy z ZOO.pose — te same dla wszystkich gier
  ...['rear', 'pounce', 'crouch', 'swipe', 'headbutt', 'kick', 'hurt', 'dizzy', 'cheer', 'sit'].flatMap(pz => ['lion', 'elephant', 'kangaroo', 'penguin']
    .map(f => ({ kat: 'pozy', typ: pz, gra: 'pralnia', plik: '', js: `(() => { const a = ZOO.MK.${f}(); ZOO.pose(a, '${pz}'); ZOO.anim(a, 1); ZOO.anim(a, 1); return a; })()` }))),
  // pojazdy w żniwach: ten sam model + siedzisko
  { kat: 'zwierzęta', typ: 'słoń', gra: 'zniwa', js: 'buildElephant()' },
  { kat: 'zwierzęta', typ: 'żyrafa', gra: 'zniwa', js: 'buildGiraffe()' },
  { kat: 'zwierzęta', typ: 'szczur', gra: 'arka', js: 'ratGeo(0x8794a6, 0xb7c0cc, false)' },
  { kat: 'zwierzęta', typ: 'szczur', gra: 'arka', js: 'ratGeo(0xc9a27e, 0xe6cdb0, true)' },

  ...MORZE.map(([typ, f]) => ({ kat: 'morze', typ, gra: 'rafa', plik: '', js: `make${f}()` })),
  ...['Clown', 'Puffer', 'Crab', 'Octo', 'Moray'].map(f => ({ kat: 'morze', typ: f.toLowerCase(), gra: 'rafa', plik: '', js: `make${f}()` })),
  { kat: 'morze', typ: 'konik morski', gra: 'rafa', plik: '', js: 'seahorseGeo()' },
  { kat: 'morze', typ: 'meduza', gra: 'rafa', plik: '', js: 'jellyGeos()' },
  ...RAFA_RYBY.map(k => ({ kat: 'morze', typ: 'ryba ' + k, gra: 'rafa', plik: '', js: `speciesGeo('${k}')` })),

  { kat: 'ludzie', typ: 'rolnik', gra: 'ciuchcia', plik: 'ciuchcia-taxi-zniwa', js: 'makeFarmer()' },

  { kat: 'pojazdy', typ: 'taxi', gra: 'ciuchcia', js: 'buildTaxi()' },
  { kat: 'pojazdy', typ: 'taxi', gra: 'taxi', js: 'buildTaxi()' },
  { kat: 'pojazdy', typ: 'autobus', gra: 'ciuchcia', plik: 'ciuchcia-taxi', js: 'buildBus()' },
  { kat: 'pojazdy', typ: 'wyścigówka', gra: 'ciuchcia', plik: 'ciuchcia-taxi', js: 'buildRacer()' },
  ...[0, 1, 2, 3].map(k => ({ kat: 'pojazdy', typ: 'auto ' + k, gra: 'ciuchcia', plik: 'ciuchcia-taxi', js: `aiModel(0x3a7bd5, ${k})` })),
  { kat: 'pojazdy', typ: 'policja', gra: 'taxi', js: 'buildPolice()' },
  { kat: 'pojazdy', typ: 'samolot', gra: 'taxi', js: 'buildPlane()' },

  { kat: 'rolnicze', typ: 'traktor', gra: 'ciuchcia', plik: 'ciuchcia-taxi', js: 'buildTractor()' },
  { kat: 'rolnicze', typ: 'traktor', gra: 'zniwa', js: 'buildTractor()' },
  { kat: 'rolnicze', typ: 'duży traktor', gra: 'zniwa', js: 'buildBigTractor()' },
  { kat: 'rolnicze', typ: 'kombajn', gra: 'zniwa', js: 'buildCombine()' },
  { kat: 'rolnicze', typ: 'kombajn', gra: 'taxi', js: 'buildKombajn()' },
  { kat: 'rolnicze', typ: 'pług', gra: 'zniwa', js: 'buildPlough()' },
  { kat: 'rolnicze', typ: 'siewnik', gra: 'zniwa', js: 'buildSeeder()' },
  { kat: 'rolnicze', typ: 'prasa', gra: 'zniwa', js: 'buildBaler({})' },
  { kat: 'rolnicze', typ: 'beczkowóz', gra: 'zniwa', js: 'buildSlurryTank({})' },
  { kat: 'rolnicze', typ: 'przyczepa', gra: 'zniwa', js: 'buildTrailer()' },

  ...[['parowóz', 'buildLoco()'], ['tender', 'buildTender()'], ['wagon osobowy', 'buildCoach()'], ['wagon towarowy', 'buildWagon()'],
    ['EU07', 'buildEU07()'], ['pendolino czoło', 'buildPend(1)'], ['pendolino środek', 'buildPend(0)'], ['pendolino tył', 'buildPend(-1)']]
    .map(([typ, js]) => ({ kat: 'pociągi', typ, gra: 'ciuchcia', plik: 'ciuchcia-taxi', js })),

  // Piraci! — wojownicy z bronią (zwierzaki z ZOO + czapka), ludziki, czapki
  ...[['pirat junior', 'human', 'wood'], ['piratka ania', 'ania', 'rapier'], ['rudobrody', 'rudy', 'sword'], ['czarna baśka', 'baska', 'katana'], ['czarnobrody', 'czarny', 'axe'], ['kapitan hak', 'wilk', 'sword'], ['majtek', 'majtek', 'saber'], ['majtek', 'majtek2', 'bow']]
    .map(([typ, k, w]) => ({ kat: 'piraci', typ, gra: 'piraci', js: `mkFighter('${k}', 1, '${w}')` })),
  ...[['rudobrody', 'rudy', 'sword'], ['czarna baśka', 'baska', 'katana'], ['czarnobrody', 'czarny', 'axe']].map(([typ, k, w]) => ({ kat: 'piraci', typ, gra: 'piraci', js: `mkFighter('${k}', -1, '${w}')` })),
  ...ZOO.map(([typ, f], i) => ({ kat: 'piraci', typ: 'pirat ' + typ, gra: 'piraci', js: `mkFighter('${f}', 1, '${['saber', 'sword', 'axe', 'rapier', 'katana', 'bow', 'anchor', 'trident', 'wood', 'swordfish'][i]}')` })),
  ...[['lew', 'lion'], ['pingwin', 'penguin'], ['tygrys', 'tiger']].map(([typ, f]) => ({ kat: 'piraci', typ: 'pirat ' + typ, gra: 'piraci', js: `mkFighter('${f}', -1, 'saber')` })),
  ...['trójgraniasta', 'kapitańska', 'marynarska'].map((typ, i) => ({ kat: 'piraci', typ: 'czapka ' + typ, gra: 'piraci', js: `mkHat(${i})` })),

  { kat: 'statki', typ: 'okręt gracza', gra: 'piraci', js: `buildShip({ ...PSHIP(), guns: 3, masts: 2, cap: 'human', crew: [.4, 3.6] })` },
  ...[['slup', 1, 2], ['bryg', 2, 3], ['galeon', 3, 4]].map(([typ, masts, guns]) =>
    ({ kat: 'statki', typ, gra: 'piraci', js: `buildShip({ hull: 0x33302f, trim: 0xb02a2a, bot: 0x7a2a22, sail: '#2a2a31', stripe: '#8a1f1f', emb: '☠️', flagEmb: '☠️', fig: 'skull', guns: ${guns}, masts: ${masts}, cap: 'crocodile', crew: [1] })` })),
  { kat: 'statki', typ: 'eskorta', gra: 'piraci', js: `buildShip({ hull: 0x5a4636, trim: 0x9aa0a8, bot: 0xcfc7b4, sail: '#b9b3a6', flagEmb: '☠️', fig: 'skull', guns: 2, masts: 1, crew: [1] })` },
  { kat: 'statki', typ: 'pokład pojedynku', gra: 'piraci', js: `buildShip({ hull: 0x33302f, trim: 0xb02a2a, bot: 0x7a2a22, sail: '#2a2a31', stripe: '#8a1f1f', emb: '☠️', fig: 'skull', guns: 0, arena: 1, rail: .16, balu: 1 })` },
  { kat: 'statki', typ: 'armata', gra: 'piraci', js: 'mkCannon()' },
  { kat: 'statki', typ: 'armata', gra: 'piraci', js: 'mkCannon(0xb8862b)' },

  ...['wood', 'saber', 'bow', 'sword', 'rapier', 'axe', 'katana', 'anchor', 'trident', 'swordfish'].map(id => ({ kat: 'broń', typ: id, gra: 'piraci', js: `mkWeapon('${id}')` })),
  // Dzikie Bryki: każdy pojazd w pozach jazda / atak / moc / oberwał (brykaPose)
  ...[['rekin', 'rekin'], ['ptak', 'ptak'], ['ośmiornica', 'osmiornica'], ['krab', 'krab'], ['nietoperz', 'nietoperz'], ['żaba', 'zaba']].flatMap(([typ, k]) => ['jazda', 'atak', 'moc', 'oberwal']
    .map(pz => ({ kat: 'bryki', typ, gra: 'bryki', js: `(() => { const b = buildBryka('${k}'); brykaPose(b, '${pz}', 1); return b.g; })()` }))),

  // Dzikie Bryki — trasy: przeszkody na pasach i rekwizyty przy drodze (models/trasy.bryki.js)
  ...['glaz', 'beczki', 'opony', 'wrak', 'bryla', 'skrzynia', 'balwan', 'pacholki', 'olej', 'lod', 'lawa', 'rampa', 'turbo', 'gwiazda', 'biegacz', 'glaz_tocz', 'sniezka', 'beczka_tocz', 'pingwin', 'kula_burzaca', 'meteor']
    .map(t => ({ kat: 'trasy', typ: 'przeszkody', gra: 'bryki', js: `brObst('${t}')` })),
  ...['kaktus', 'kamien', 'opony', 'beczka', 'zlom', 'wrak', 'skala', 'dym', 'sosna', 'balwan', 'lodblok']
    .map(t => ({ kat: 'trasy', typ: 'przy drodze', gra: 'bryki', js: `brProp('${t}')` })),
  ...['plaskowyz', 'dzwig', 'fabryka', 'wulkan', 'gora'].map(t => ({ kat: 'trasy', typ: 'w oddali', gra: 'bryki', js: `brProp('${t}')` })),
  { kat: 'trasy', typ: 'meta', gra: 'bryki', js: 'brMeta(12.6)' },
  { kat: 'trasy', typ: 'tunel i most', gra: 'bryki', js: 'brTunel(30, 0xc07a48, 12.6)' },
  { kat: 'trasy', typ: 'tunel i most', gra: 'bryki', js: 'brMost(32, 1.8, 12.6, 0x3aa0d0, 0, 0xd8342a)' },

  // Klinika Zoo: pacjenci (skóra; rentgen to warstwa 1 kamery) i wnętrze — organy, kości, połknięte rzeczy, gips
  ...[['żyrafa', 'zyrafa'], ['słoń', 'slon'], ['pingwin', 'pingwin'], ['doktor', 'doktor']].map(([typ, k]) => ({ kat: 'pacjenci', typ, gra: 'klinika', js: `klPacjent('${k}').g` })),
  ...['serce', 'pluca', 'zoladek', 'jelita', 'mozg'].map(n => ({ kat: 'anatomia', typ: 'organy', gra: 'klinika', js: `anOrgan('${n}', 1)` })),
  { kat: 'anatomia', typ: 'kości', gra: 'klinika', js: 'anKosc(1, .08)' },
  { kat: 'anatomia', typ: 'kości', gra: 'klinika', js: 'anKreg(.2)' },
  { kat: 'anatomia', typ: 'kości', gra: 'klinika', js: 'anZebraBok(0, .8, .7, .7, 5)' },
  ...['kaczka', 'budzik', 'skarpetka', 'klucz', 'rybka', 'pilka', 'klocek', 'lod'].map(k => ({ kat: 'anatomia', typ: 'połknięte', gra: 'klinika', js: `anRzecz('${k}', 1.5)` })),
  { kat: 'anatomia', typ: 'gips', gra: 'klinika', js: 'anGips(.9, .25, 0x3ab0ff)' },
  { kat: 'anatomia', typ: 'nagrody', gra: 'klinika', js: 'anLizak(1)' },
  { kat: 'anatomia', typ: 'nagrody', gra: 'klinika', js: 'anGuz(.3)' },
  { kat: 'anatomia', typ: 'nagrody', gra: 'klinika', js: 'anPlaster(.3, 0xff8fb1)' },

  { kat: 'broń', typ: 'strzała', gra: 'piraci', js: 'mkArrow()' },
  { kat: 'broń', typ: 'rozgwiazda', gra: 'piraci', js: 'mkStar()' },
];
