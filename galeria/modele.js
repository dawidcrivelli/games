// Galeria: co pokazać. Model budowany w ukrytej ramce z grą `gra` (jej silnik, materiały),
// `js` = wyrażenie zwracające Object3D, {g|root}, geometrię albo tablicę. `typ` grupuje warianty obok siebie.
// kategoria → prefiks pliku w models/
const KAT_PLIK = { 'zwierzęta': 'zwierzeta', morze: 'morze', ludzie: 'ludzie', pojazdy: 'pojazdy', rolnicze: 'rolnicze', 'pociągi': 'pociagi' };
const KATEGORIE = Object.keys(KAT_PLIK);
const ZOO = [['słoń', 'Elephant'], ['żyrafa', 'Giraffe'], ['zebra', 'Zebra'], ['hipopotam', 'Hippo'], ['krokodyl', 'Croc'],
  ['lew', 'Lion'], ['tygrys', 'Tiger'], ['panda', 'Panda'], ['pingwin', 'Penguin'], ['kangur', 'Kangaroo']];
const RAFA_RYBY = ['clown', 'blue', 'yellow', 'serg', 'chrom', 'anth', 'butt', 'parrot'];
const MORZE = [['delfin', 'Dolphin'], ['wieloryb', 'Whale'], ['rekin', 'Shark'], ['manta', 'Manta'], ['żółw', 'Turtle']];

const MODELE = [
  ...['pralnia', 'arka'].flatMap(gra => ZOO.map(([typ, f]) => ({ kat: 'zwierzęta', typ, gra, js: `mk${f}()` }))),
  ...['Elephant', 'Giraffe', 'Lion', 'Penguin'].map(f => ({ kat: 'zwierzęta', typ: ZOO.find(z => z[1] === f)[0], gra: 'taxi', js: `mk${f}()` })),
  { kat: 'zwierzęta', typ: 'słoń', gra: 'zniwa', js: 'buildElephant()' },
  { kat: 'zwierzęta', typ: 'żyrafa', gra: 'zniwa', js: 'buildGiraffe()' },
  { kat: 'zwierzęta', typ: 'szczur', gra: 'arka', js: 'ratGeo(0x8794a6, 0xb7c0cc, false)' },
  { kat: 'zwierzęta', typ: 'szczur', gra: 'arka', js: 'ratGeo(0xc9a27e, 0xe6cdb0, true)' },

  ...['arka', 'rafa'].flatMap(gra => MORZE.map(([typ, f]) => ({ kat: 'morze', typ, gra, js: `make${f}()` }))),
  ...['Clown', 'Puffer', 'Crab', 'Octo', 'Moray'].map(f => ({ kat: 'morze', typ: f.toLowerCase(), gra: 'rafa', js: `make${f}()` })),
  { kat: 'morze', typ: 'konik morski', gra: 'rafa', js: 'seahorseGeo()' },
  { kat: 'morze', typ: 'meduza', gra: 'rafa', js: 'jellyGeos()' },
  ...RAFA_RYBY.map(k => ({ kat: 'morze', typ: 'ryba ' + k, gra: 'rafa', js: `speciesGeo('${k}')` })),

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
  { kat: 'rolnicze', typ: 'przyczepa', gra: 'zniwa', js: 'buildTrailer()' },

  ...[['parowóz', 'buildLoco()'], ['tender', 'buildTender()'], ['wagon osobowy', 'buildCoach()'], ['wagon towarowy', 'buildWagon()'],
    ['EU07', 'buildEU07()'], ['pendolino czoło', 'buildPend(1)'], ['pendolino środek', 'buildPend(0)'], ['pendolino tył', 'buildPend(-1)']]
    .map(([typ, js]) => ({ kat: 'pociągi', typ, gra: 'ciuchcia', plik: 'ciuchcia-taxi', js })),
];
