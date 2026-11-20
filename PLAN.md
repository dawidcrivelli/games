# Plan: biblioteki wg funkcji zamiast wg gier

Stan: 2026-11-20. Wykonuje jeden agent, w jednej serii commitów, **gdy nikt inny nie zmienia gier**
(etap 2 dotyka każdego `game.js`, więc równoległa praca dałaby konflikty).

## Decyzje

- Pliki wspólne: `lib/<area>/<name>.js` (po angielsku). **Bez nazw gier w nazwach plików.**
  Kto używa pliku: `node tools/deps.mjs` (z tagów `<script>`), nie z nazwy.
- Nazwy gier zostają po polsku (`ciuchcia/`, `zniwa/`…).
- **Modele i brzmienie bez zmian.** Dwa warianty bryły / dźwięku mogą żyć obok siebie
  (np. `buildTractor` z ciuchci i ze żniw → `buildTractor` + `buildTractorBig`, oba w `models/farm.js`).
  Unifikacja wariantów to osobna praca, każda do obejrzenia w galerii / odsłuchania.
- Egzorcysta i łowcy zostają w swoich repo. Patologie przeniesione do `kosmopatologia/`, `zoopatologia/`.

## Problem, poza nazwami

Pliki `lib/` i `models/` czytają zmienne zdefiniowane w `game.js` (`node tools/deps.mjs`: 193 nazwy,
np. `models/pociagi.ciuchcia-taxi.js` 19, `lib/ciuchcia-taxi.js` 24). Dlatego nowa gra nie może po prostu
dołączyć pliku. Do tego `T`, `PI`, `$`, `clamp`, `rnd`, `pick` są zdefiniowane w wielu grach osobno — a
skrypty dzielą jeden zasięg, więc wspólne `const T` w `lib/` + `const T` w `game.js` = błąd składni.

## Struktura docelowa

```
lib/common/   core.js     T PI TAU V3 $ clamp lerp rnd rr pick           (2D i 3D)
              noise.js    hash2 vnoise
              ui.js       tap toast holdBtn
              screen.js   resize-helper, goFS, obrotInit (z obrot…)
              storage.js  save/load z kluczem gry
lib/audio/    synth.js    tone, noise, nz, sw, master/mute                (warianty obok siebie)
              music.js    nloop mnote roar startMusic
              horns.js    (klaksony)   engine.js (silnik)   diesel.js
lib/input/    tilt.js     (przechylanie)   keys.js (readInput – warianty)
lib/3d/       geometry.js tex lam pho mesh box cylX/Y/Z rboxGeo rbox hose mergeGeos bake signMat ell cone cloneTpl canvasTex
              sky.js      setSky updateRain updateBirds applyWeather
              particles.js emit updateParticles puff updatePuffs burst
              camera.js   nextCam
lib/2d/       (gdy wspólne: piksele, kreska, bfs z patologii)
models/       animals.js (ZOO)  sea.js (MORZE)  reef.js  people.js  buildings.js  vehicles.js
              cars.js  trains.js  farm.js  ships.js  weapons.js  pirates.js  accessories.js  nature.js
              bryki.js (pojazdy-zwierzęta)
<gra>/        game.js + to, czego nikt inny nie użyje (np. bryki/tracks.js, bryki/sounds.js)
```

Mapowanie starych plików (podział mieszanych wg funkcji z tabeli w README):

| stary | nowy |
|---|---|
| `lib/ciuchcia-taxi-zniwa-pralnia-arka-rafa-piraci.js`, `lib/pralnia-arka-rafa-piraci.js`, `lib/ciuchcia-taxi-zniwa-rafa.js` | `lib/common/core.js` (+ `tap` → `ui.js`) |
| `lib/ciuchcia-taxi-zniwa-arka-rafa.js` | `lib/common/noise.js` |
| `lib/ciuchcia-taxi-zniwa.js` | `lib/3d/geometry.js`, `sky.js`, `particles.js`, `lib/audio/synth.js` (tone), `lib/common/screen.js` (resize) |
| `lib/ciuchcia-taxi.js` | `lib/3d/geometry.js`, `sky.js` (applyWeather), `particles.js`, `lib/audio/synth.js` (initAudio, syncSnd), `lib/common/ui.js` (holdBtn) |
| `lib/ciuchcia-zniwa.js` | `lib/3d/camera.js` |
| `lib/pralnia-arka-piraci.js` | `lib/audio/music.js`, `lib/common/screen.js` (goFS) |
| `lib/klaksony.*`, `silnik.*`, `diesel.*`, `przechylanie.*`, `obrot.*` | `lib/audio/horns.js`, `engine.js`, `diesel.js`, `lib/input/tilt.js`, `lib/common/screen.js` |
| `models/<kat>.<gry>.js` | `models/<category>.js` (warianty w jednym pliku, różne nazwy funkcji) |
| `models/trasy.bryki.js` | `bryki/tracks.js` (tylko ta gra) |

## Etapy

**0. Narzędzia** (zrobione): `tools/deps.mjs` (kto ładuje plik, co bierze z gry), `tools/dups.mjs`
(duplikaty funkcji, warianty), `tools/code.mjs` (wspólne). Zrzuty bazowe: `node tools/play.mjs`, `node tools/galeria.mjs`.

**1. Przeniesienie + rozcięcie** (skrypt, kod funkcji bez zmian): `git mv`, rozcięcie mieszanych plików,
poprawa `<script src>` we wszystkich `index.html`, `galeria/` (`KAT_PLIK`, ramki), `README.md` (tabela → generowana).

**2. Koniec ukrytych zależności** (każdy `game.js`):
1. `lib/common/core.js` daje `T PI TAU $ clamp lerp rnd pick`; gry usuwają swoje kopie (tylko identyczne!
   `rnd`/`pick` mają warianty — różna sygnatura zostaje pod inną nazwą). `ZOO`/`MORZE` zostają samodzielne
   (moduły z własnym zasięgiem), ale mogą używać `core.js`.
2. Stałe identyczne we wszystkich grach używających modelu → do pliku modelu
   (np. `RAIL_TOP GAUGE CRANK R_DRV AXLE_Y ROD_L WH` w ciuchci i taxi → `models/trains.js`; `GLD PLA LAMPO TPL_W AUTO_CAM` → `models/cars.js`).
3. Stan gry (`scene`, `M`, `cars`, `AU`, `rain`…) → parametry / obiekt opcji, np. `buildTractor(M)`,
   `setSky(ctx)`, `initAudio(AU)`. Materiały `M` różnią się między grami (6 wspólnych kluczy z 16–18),
   więc przekazywane jawnie, nie wspólne.
4. Cel: `node tools/deps.mjs` → `razem nazw brane z gier: 0` (wyjątek: wywołania zwrotne opisane w nagłówku).

**3. Deduplikacja bez zmiany modeli i brzmienia** (tylko kopie identyczne lub różniące się nazwami zmiennych):
- `buildStation placeAt fence palm` — identyczne w `ciuchcia/game.js` i `models/budynki.taxi.js` → jeden plik.
- `clamp $ rnd pick` — lib + bryki, zle-owoce, kosmopatologia, zoopatologia, ZOO, MORZE.
- `hash2 vnoise` — lib + kopia w `models/morze.js`.
- `goFS` + `obrotInit` — jedno `screen.js`.
- `save` (9 wariantów, 1 linia) → `storage.js` z kluczem gry (te same klucze localStorage — zapisy zostają).
- `toast`, `resize` — warianty z opcjami, gdy zachowanie identyczne.

**4. Unifikacja wariantów** (później, każdy osobno, z porównaniem w galerii / odsłuchem):
`buildTractor`, `buildTaxi/carFace`, `mkHat`, `starGeo`, `initAudio` (5), `tone` (6), `startMusic` (3),
`bryki/dzwieki.js` vs `lib/audio/engine.js`, `readInput` (3), `updateCamera` (3), `applyWeather`,
`driveCar/onRoad/placeTrain` (ciuchcia/taxi), `collide` (taxi/bryki).
Nie ruszać: `frame update buildWorld hud showMenu startGame` — ta sama nazwa, inna gra.

## Kontrola, że nic się nie zmieniło (etapy 1–3)

- `node tools/play.mjs` — zero błędów JS we wszystkich grach; zrzuty przed/po.
- `node tools/galeria.mjs` — wszystkie modele się budują; zrzuty przed/po.
- Ciała funkcji przeniesionych: tokenowo identyczne przed/po (`tools/dups.mjs` na obu commitach),
  poza miejscami zmienionymi w 2.3 (parametry zamiast zmiennych gry).
- `node tools/build.mjs` + `node tools/play.mjs --dist`.
