# Plan: biblioteki wg funkcji zamiast wg gier

## Zrobione (2026-11-21)

1. **Pliki wg funkcji** — `lib/<area>/<name>.js`, `models/<category>.js`, bez nazw gier; kod jednej gry w jej katalogu.
   Przeniesienie bez zmiany kodu funkcji (`tools/fnsnap.mjs`: 0 różnic).
2. **Bez ukrytych zależności** — `node tools/deps.mjs`: 0 nazw branych z gier (było 196), poza kontraktem 3D
   (`scene`, paleta `M`, klucze sprawdzane). `T/PI/TAU` w `lib/3d/three.js`, pomocniki ZOO w `lib/3d/zoo-kit.js`;
   niebo/deszcz/gwiazdy (`skyInit`), cząsteczki, dym, `AU`, `seed`, `tilt` — stan w bibliotekach; reszta przez parametry.
3. **Deduplikacja bez zmiany modeli** — budynki Ciuchciowa (202 linie w ciuchci i taxi) → `models/landmarks.js`;
   jeden `buildTractor(plateMat)`; `$`, `T`, `PI`, `TAU`, pomocniki ZOO, stałe aut i pociągów w jednym miejscu.
   `tools/modelhash.mjs`: 228 deterministycznych modeli galerii identycznych jak przed przebudową.

## Do zrobienia: unifikacja wariantów (każdy osobno, z `tools/modelhash.mjs` / odsłuchem)

Lista z `node tools/dups.mjs` — ta sama nazwa, inny kod:

- Dwa zestawy pomocników 3D z kolidującymi nazwami: `lib/3d/shapes.js` (`mesh(geo, mat, x, y, z, rodzic)`, `M` = paleta)
  i `lib/3d/zoo-kit.js` (`mesh(geo, mat, rodzic, x, y, z…)`, `M()` = materiał) — dziś nie da się ich użyć w jednej grze.
  Rozwiązanie: przestrzenie nazw (np. `KIT.mesh`) albo zmiana nazw w jednym zestawie.
- Modele: `carFace`/`buildTaxi` (`models/cab.js` vs `models/cab-simple.js`), `mkHat` (`models/hats.js` vs `models/pirates.js`),
  `starGeo` (`models/weapons.js` vs `rafa/reef.js`).
- Dźwięk: `tone` (`lib/audio/synth.js`, `lib/audio/music.js`, rafa, złe owoce), `initAudio` (5 wariantów),
  `startMusic` (pralnia, arka, piraci), `bryki/dzwieki.js` + `lib/audio/aud.js` vs `lib/audio/engine.js`.
- Logika podobna, do parametryzacji: `readInput` (taxi, żniwa, rafa), `updateCamera` (ciuchcia, taxi, żniwa),
  `applyWeather` (lib vs żniwa), `driveCar/onRoad/placeTrain` (ciuchcia, taxi), `collide` (taxi, bryki),
  `resize` (pralnia, arka, piraci, rafa — z pixelRatio), `clamp` w brykach i klinice (`Math.max/min` — inny wynik
  przy odwróconych granicach), `toast`, `save`.
- Rafa ma własne pomocniki geometrii (`tf`, `setCol`, `ball`, `merge`, `sweep`) podobne do wnętrza `MORZE` —
  można wystawić je z `models/sea.js` jako `lib/3d/vertex-color.js`.
- Patologie (`kosmopatologia/`, `zoopatologia/`) mają własne `clamp`/`rnd`/`pick`/`$` (część identyczna z `lib/common`);
  podpięcie `lib/` wymaga dopisania plików do `CORE` w ich `sw.js`.
- Nie ruszać: `frame update buildWorld hud showMenu startGame` — ta sama nazwa, inna gra.
