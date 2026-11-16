# Gry

Gry 3D (three.js r128) dla dzieci, wcześniej artefakty Claude — teraz wspólny kod.

**Launcher:** https://dawidcrivelli.github.io/games/ · gra bezpośrednio: `…/games/<id>/`, np. [ciuchcia](https://dawidcrivelli.github.io/games/ciuchcia/), [taxi](https://dawidcrivelli.github.io/games/taxi/), [zniwa](https://dawidcrivelli.github.io/games/zniwa/), [pralnia](https://dawidcrivelli.github.io/games/pralnia/), [arka](https://dawidcrivelli.github.io/games/arka/), [rafa](https://dawidcrivelli.github.io/games/rafa/).

**Galeria modeli 3D:** https://dawidcrivelli.github.io/games/galeria/ — wszystkie warianty zwierząt, pojazdów, pociągów obok siebie (obrót, zoom). Lista w `galeria/modele.js`; model budowany w ukrytej ramce z jego grą.

## Struktura

```mermaid
flowchart LR
  T[three.js CDN] --> L[lib/&lt;gry&gt;.js<br>silnik: helpery, audio, UI]
  L --> M[models/&lt;kategoria&gt;.&lt;gry&gt;.js<br>zwierzęta, pojazdy, pociągi…]
  M --> G[&lt;gra&gt;/game.js]
  G --> H[&lt;gra&gt;/index.html]
  H -. tools/build.mjs .-> D[dist/&lt;gra&gt;.html<br>jeden plik → artefakt]
```

- Zwykłe skrypty, wspólny zasięg globalny; kolejność w `<gra>/index.html`.
- Nazwa pliku = gry, które go używają. Kod identyczny w kilku grach jest w jednym pliku; różniące się kopie leżą obok siebie jako warianty — do wybrania najlepszego.
- Moduły samodzielne (własne helpery, jeden obiekt globalny): `models/zwierzeta.js` → `ZOO` (pralnia, arka), `models/morze.js` → `MORZE` (rafa, arka; `MORZE_CFG={water:false}` nad wodą).
- `// wymaga z gry:` w nagłówku — zmienne, które plik nadal bierze z `game.js` (materiały, `scene`…).
- `orig/` — oryginalne artefakty; `tools/split.mjs` zrobił z nich obecny podział (jednorazowo, dalej edytujemy pliki gier).

## Katalog

| plik | linie | zawiera |
|---|---|---|
| `lib/ciuchcia-taxi-zniwa-arka-rafa.js` | 8 | hash2 vnoise |
| `lib/ciuchcia-taxi-zniwa-pralnia-arka-rafa.js` | 6 | clamp |
| `lib/ciuchcia-taxi-zniwa-rafa.js` | 11 | $ rnd rr tap |
| `lib/ciuchcia-taxi-zniwa.js` | 85 | wrap tex lam pho mesh box cylY cylX cylZ rboxGeo rbox hose mergeGeos bake setSky updateRain updateBirds emit updateParticles tone resize |
| `lib/ciuchcia-taxi.js` | 68 | signMat ell cone cloneTpl applyWeather puff updatePuffs burst initAudio holdBtn syncSnd |
| `lib/ciuchcia-zniwa.js` | 6 | nextCam |
| `lib/pralnia-arka-rafa.js` | 5 | lerp |
| `lib/pralnia-arka.js` | 23 | nloop tone nz sw roar mnote goFS |
| `lib/zniwa-rafa.js` | 13 |  |
| `models/akcesoria.pralnia.js` | 10 | mkHat |
| `models/budynki.ciuchcia-taxi-zniwa.js` | 12 | gableHouse |
| `models/budynki.ciuchcia.js` | 10 | groundPad ramp nameBoard |
| `models/budynki.taxi.js` | 248 | buildLandmarks spinners placeAt groundPad ramp nameBoard buildStation roofPrism bldg shop barn house |
| `models/ludzie.ciuchcia-taxi-zniwa.js` | 16 | makeFarmer |
| `models/ludzie.taxi.js` | 6 | pedGroup pedMats |
| `models/pociagi.ciuchcia-taxi.js` | 161 | makeRailWheel addWheels coupler buffers mkCar buildLoco buildTender buildCoach buildWagon buildEU07 buildPend setConsist |
| `models/pojazdy.ciuchcia-taxi-zniwa.js` | 27 | makeWheel makeSteeringWheel gaugeNeedle |
| `models/pojazdy.ciuchcia-taxi.js` | 80 | mkAuto autoWheels autoSW paint profGeo pane sideWin autoWheelTpl carSides aiModel buildBus buildRacer |
| `models/pojazdy.ciuchcia.js` | 26 | carFace buildTaxi |
| `models/pojazdy.taxi.js` | 49 | carFace buildTaxi planeBody buildPlane buildPolice |
| `models/morze.js` | 354 | MORZE: M (materiał podwodny) fishGeo speciesGeo makeClown makeTurtle makeManta makeShark makePuffer seahorseGeo makeCrab makeOcto jellyGeos makeWhale makeDolphin makeMoray |
| `models/przyroda.pralnia.js` | 7 | duck tree palm |
| `models/przyroda.zniwa.js` | 48 | tuftGeo |
| `models/rafa.rafa.js` | 118 | branchGeo brainGeo tableGeo tubesGeo platesGeo pillarsGeo anemoneGeo kelpGeo grassGeo nubGeo rockGeo urchinGeo clamGeo starGeo shellGeo makeWreck makeChest |
| `models/rolnicze.ciuchcia-taxi.js` | 89 | buildTractor |
| `models/rolnicze.taxi.js` | 13 | buildKombajn |
| `models/rolnicze.zniwa.js` | 357 | makeScrew buildCombine buildPlough buildSeeder buildBaler buildBigTractor buildTractor buildTrailer |
| `models/zwierzeta.js` | 206 | ZOO: MK.elephant…kangaroo, anim, cfg {scale, cast} |
| `models/zwierzeta.taxi.js` | 50 | mkGiraffe mkElephant mkLion mkPenguin |
| `models/zwierzeta.zniwa.js` | 65 | buildGiraffe buildElephant |

## Narzędzia

- `npm i` (puppeteer-core, acorn; Chrome z /Applications).
- `node tools/play.mjs [id…]` — każda gra: start, kilka sekund jazdy, błędy JS, zrzut `shots/<id>.jpg` (kafelki launchera). `--orig` / `--dist` testuje `orig/` / `dist/`.
- `node tools/galeria.mjs` — galeria: błędy budowania modeli, zrzuty `tmp/galeria-*.png`.
- `node tools/build.mjs [gra…]` — `dist/<gra>.html`, jeden plik (artefakt Claude).
- Lokalnie: `python3 -m http.server` → http://localhost:8000/.

Nowa gra: katalog `<id>/` z `index.html` + `game.js`, wpis w `gry.json` (+ `START` w `tools/play.mjs`), `node tools/play.mjs <id>`.
