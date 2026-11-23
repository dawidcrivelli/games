# Gry

Gry dla dzieci (3D: three.js r128; 2D: canvas), wcześniej artefakty Claude — teraz wspólny kod.

**Launcher:** https://dawidcrivelli.github.io/games/ · gra bezpośrednio: `…/games/<id>/`, np. [ciuchcia](https://dawidcrivelli.github.io/games/ciuchcia/), [taxi](https://dawidcrivelli.github.io/games/taxi/), [zniwa](https://dawidcrivelli.github.io/games/zniwa/), [pralnia](https://dawidcrivelli.github.io/games/pralnia/), [arka](https://dawidcrivelli.github.io/games/arka/), [rafa](https://dawidcrivelli.github.io/games/rafa/), [piraci](https://dawidcrivelli.github.io/games/piraci/), [zle-owoce](https://dawidcrivelli.github.io/games/zle-owoce/) (2D), [bryki](https://dawidcrivelli.github.io/games/bryki/), [klinika](https://dawidcrivelli.github.io/games/klinika/), [kosmopatologia](https://dawidcrivelli.github.io/games/kosmopatologia/) (2D), [zoopatologia](https://dawidcrivelli.github.io/games/zoopatologia/) (2D).

**Galeria modeli 3D:** https://dawidcrivelli.github.io/games/galeria/ — wszystkie warianty zwierząt, pojazdów, pociągów obok siebie (obrót, zoom). Zakładka „dźwięki”: klaksony i silniki z `lib/` do odsłuchania. Lista w `galeria/modele.js`; model budowany w ukrytej ramce z jego grą.

## Struktura

```mermaid
flowchart LR
  T[three.js CDN] --> L[lib/&lt;obszar&gt;/&lt;nazwa&gt;.js<br>common, 3d, audio, input, ui]
  L --> M[models/&lt;kategoria&gt;.js<br>zwierzęta, auta, pociągi…]
  M --> G[&lt;gra&gt;/game.js<br>+ pliki tylko tej gry]
  G --> H[&lt;gra&gt;/index.html]
  H -. tools/build.mjs .-> D[dist/&lt;gra&gt;.html<br>jeden plik → artefakt]
```

- Zwykłe skrypty, wspólny zasięg globalny; kolejność `<script>` w `<gra>/index.html`: three.js → `lib/` → `models/` → pliki gry → `game.js` → `lib/common/screen.js`.
- **Biblioteki wg funkcji, nie wg gier.** `lib/<obszar>/<nazwa>.js` (`common` — DOM, liczby, losowanie, szum, ekran; `3d` — bryły, niebo, cząsteczki, widok; `audio`; `input`; `ui`), `models/<kategoria>.js`. Nazwy plików po angielsku i bez nazw gier: gra, która zaczyna używać pliku, dodaje tylko `<script>`. Kto używa czego — katalog niżej (`node tools/catalog.mjs`).
- Kod tylko jednej gry leży w jej katalogu (`bryki/tracks.js`, `klinika/patients.js`, `rafa/reef.js`, `taxi/town.js`…).
- Pliki wspólne nie biorą nic z gry poza **kontraktem 3D**: `scene` i paleta materiałów `M` (modele „miasta” są barwione paletą gry). Reszta przez parametry (`applyWeather(w, świat)`, `updateRain(dt, camera)`, `fitView(renderer, camera)`) albo stan w samym pliku (`skyInit`, `particlesInit`, `smokeInit`, `trainsInit`; `AU` w `lib/audio/synth.js`, `seed` w `lib/common/random.js`, `tilt` w `lib/input/tilt.js`). Sprawdza to `node tools/deps.mjs` (też klucze `M` i kolizje nazw).
- Nagłówek każdego pliku: co zawiera, sposób użycia, `wymaga:` (inne pliki, kontrakt).
- Dwa zestawy pomocników 3D z tymi samymi nazwami (`mesh`, `box`, `M`) — nie łączyć w jednej grze: `lib/3d/shapes.js` (Ciuchcia, Taxi, Żniwa; `M` = paleta) i `lib/3d/zoo-kit.js` (pomocniki `ZOO`: Pralnia, Arka, Piraci, Klinika; `M()` = materiał). Podobnie `tone` w `lib/audio/synth.js` i `lib/audio/music.js`, warianty `mkHat` (`models/hats.js`, `models/pirates.js`).
- Moduły samodzielne (własne helpery, jeden obiekt globalny): `models/animals.js` → `ZOO`, `models/sea.js` → `MORZE` (`MORZE_CFG={water:false}` nad wodą).
- `klinika/` — weterynarz dla 4–6 lat, tylko poziomo (`obrotInit()`): pacjent przychodzi ulicą do kliniki (3D, kamera idzie za nim), rentgen lupą (warstwa kamery 1 w kole lupy), zabiegi palcem w 2.5D — zwierzęta z boku (żyrafa, słoń, tygrys, lew), wyprostowani (Pan Doktor, pingwin) od przodu. Jak w „Operacji”, ale łagodnie: trasy od startu do celu z kilkoma losowymi zakrętami, bez pętli (połknięta rzecz przełykiem do buzi albo przez brzuch do pupy, organy po jednym na swoje miejsce, uciekła kość do łapy + gips), układanki kości z liczeniem (szyja i ogon żyrafy, ogony słonia, tygrysa i lwa, palce doktora, żebra pingwina). Bez rentgena (`klinika/zabiegi3d.js`): drzazga, stetoskop, termometr i syrop, pchły, bandaż z gazy owijany kręceniem palca (łapa, szyja żyrafy, cała mumia), mycie kłów / zębów / dzioba (każdy pacjent; zoom na pysk). Wizyta = 3 losowe zabiegi z rentgenem + 1 bez + plasterki; test konkretnych: `?zabiegi=organ,kosc,pchly`. Bez przegranej; lektor = polska synteza mowy przeglądarki.
- `zle-owoce/` — gra 2D (canvas, bez three.js): `kreska.js` (silnik ręcznej kreski), `postacie.js` (owoce, części, przeciwnicy, tła), `game.js` (zapis, dźwięk, kreator, walka); z `lib/` tylko `common/dom.js`.
- `kosmopatologia/`, `zoopatologia/` — gry 2D (canvas, pikselowa grafika) przeniesione z osobnych repo (stan z 2026-11-08: kosmopatologia `c5066df`, zoopatologia `7a5440b`; historia zostaje tam). `index.html`, `css/app.css`, `js/*.js` w kolejności z `index.html`; PWA: `manifest.json` + `sw.js` (offline). Nowy plik w `js/` → dopisz do `CORE` w `sw.js` i zmień `VERSION`.
- `orig/` — oryginalne artefakty (tylko do odczytu); `tools/split.mjs` zrobił z nich pierwszy podział (jednorazowo).

## Katalog

<!-- KATALOG: node tools/catalog.mjs -->
| plik | linie | gry | co zawiera |
|---|---|---|---|
| `lib/3d/comic.js` | 64 | bryki klinika | Styl „komiks”: kreskówkowe cieniowanie (toon) + czarny kontur odwróconą skorupą, bryły wyciągane z obrysu 2D. |
| `lib/3d/guide-arrow.js` | 16 | taxi piraci | Strzałka „jak w Crazy Taxi” (Taxi, Piraci): płaska, z ciemnym obrysem, zawsze na wierzchu (bez testu głębi), nad pojazdem. |
| `lib/3d/icons.js` | 27 | klinika | Ikony z prawdziwych modeli 3D (zamiast emoji): osobny mały renderer z przezroczystym tłem, kamera dopasowana do bryły. |
| `lib/3d/particles.js` | 28 | ciuchcia taxi zniwa | Cząsteczki (iskry, kurz, krople, plewy): jedna chmura punktów w scenie, bufor cykliczny. |
| `lib/3d/shapes.js` | 59 | ciuchcia taxi zniwa | Bryły „miasta” (Ciuchcia, Taxi, Żniwa): tex(w, h, rysuj) — tekstura z płótna, lam/pho — materiały, mesh/box/cylX/Y/Z/rbox/ell/cone |
| `lib/3d/sky.js` | 39 | ciuchcia taxi zniwa | Niebo i pogoda dla gier „z miastem” (Ciuchcia, Taxi, Żniwa): kopuła z gradientem, słońce, księżyc, gwiazdy, |
| `lib/3d/smoke.js` | 20 | ciuchcia taxi | Dym i para (kłęby z komina, rury wydechowej): 48 duszków, rosną i bledną, znosi je wiatr z pogody (WX.wind). |
| `lib/3d/three.js` | 4 | ciuchcia taxi zniwa pralnia arka rafa piraci bryki klinika | Skróty three.js wspólne dla gier 3D i plików lib/3d, models/: T = THREE, PI, TAU = 2π. |
| `lib/3d/view.js` | 6 | ciuchcia taxi zniwa | Dopasowanie widoku do okna: const resize = fitView(renderer, camera); addEventListener('resize', resize) |
| `lib/3d/weather.js` | 18 | ciuchcia taxi zniwa | Pogoda „miasta” (Ciuchcia, Taxi, Żniwa): applyWeather(w, świat) ustawia niebo, mgłę, słońce, światło nieba, chmury, okna nocą, |
| `lib/3d/zoo-kit.js` | 6 | pralnia arka piraci klinika | Pomocniki 3D z modułu ZOO (models/animals.js) jako nazwy globalne — styl „słodziaków”: Pralnia, Arka, Piraci, Klinika. |
| `lib/audio/ambience.js` | 19 | ciuchcia taxi | Dźwięk gier z pojazdami (Ciuchcia, Taxi): initAudio() zakłada AU (kontekst, kompresor, bufor szumu) i stałe pętle: |
| `lib/audio/aud.js` | 43 | bryki klinika | Dźwięki syntezowane w Web Audio (bez plików) — klocki z własnym stanem AUD (styl Dzikich Bryk). |
| `lib/audio/diesel.js` | 29 | taxi zniwa | Niski, klekoczący silnik diesla (traktor, kombajn): dieselProfile, dieselCreate, dieselSet(obroty, gaz). |
| `lib/audio/engine.js` | 50 | taxi | Silnik spalinowy z biegami: stałe generatory sterowane obrotami, strzały z wydechu, pisk opon, syrena. |
| `lib/audio/horns.js` | 31 | ciuchcia taxi | Klaksony i gwizdki pojazdów: hornKind, hornStart (trzymany klakson), whistleStart, trainHornStart, hornStop, hornTap. |
| `lib/audio/music.js` | 32 | pralnia arka piraci | Dźwięk w stylu Pralni / Arki / Piratów: musicInit zakłada AC (AudioContext), master, sfx i mus (efekty, muzyka), nbuf (szum). |
| `lib/audio/synth.js` | 15 | ciuchcia taxi zniwa | Syntezator na wspólnym stanie AU (Web Audio): tone(częstotliwość, czas, fala, głośność, f2, opóźnienie) — ton ze zjazdem, |
| `lib/common/angle.js` | 3 | ciuchcia taxi zniwa | Kąty: wrap(a) → a w przedziale [-π, π] (różnica kierunków, skręcanie najkrótszą drogą). |
| `lib/common/dom.js` | 4 | ciuchcia taxi zniwa pralnia arka rafa piraci bryki klinika zle-owoce | DOM: $(id) → element; tap(id, fn) — kliknięcie / dotknięcie przycisku (bez domyślnej akcji). |
| `lib/common/math.js` | 4 | ciuchcia taxi zniwa pralnia arka rafa piraci | Liczby: clamp(v, a, b) — przytnij do [a, b]; lerp(a, b, t) — interpolacja liniowa. |
| `lib/common/noise.js` | 5 | ciuchcia taxi zniwa arka rafa | Szum wartości 2D: hash2(x, y) → [0, 1), vnoise(x, y) — gładki szum (plamy na łące, piasek, fale). |
| `lib/common/random.js` | 6 | ciuchcia taxi zniwa rafa | Losowanie z ziarnem (ten sam świat dla tego samego seed): rnd() → [0, 1), rr(a, b) → [a, b). |
| `lib/common/screen.js` | 49 | ciuchcia taxi zniwa pralnia arka rafa piraci bryki klinika | Ekran telefonu: goFS() — pełny ekran; obrotInit({ pion }) — plansza „Obróć telefon poziomo/pionowo” + pełny ekran |
| `lib/input/tilt.js` | 31 | taxi zniwa rafa | Przechylanie telefonu (żyroskop) jako sterowanie: stan tilt = {on, x, y, …} (x w prawo, y od siebie, od -1 do 1). |
| `lib/ui/comic.css` | 26 | bryki klinika | Styl „komiks”: tabliczki-przyciski, okienka, komiksowe napisy w gwieździe, konfetti — Dzikie Bryki, Klinika Zoo. |
| `lib/ui/comic.js` | 8 | bryki klinika | Komiksowy napis w gwieździe (CSS .bub z lib/ui/comic.css) w punkcie ekranu X, Y; znika sam |
| `lib/ui/controls.js` | 8 | ciuchcia taxi | Przyciski sterowania: holdBtn(id, klucz, keys) — trzymany przycisk ustawia keys[klucz] = 1 (klasa .on); |
| `lib/ui/toast.js` | 6 | ciuchcia taxi zniwa rafa | Krótki komunikat: toast(tekst, ms = 3200) — wstawia tekst do #toast i dodaje klasę .show na ms milisekund |
| `models/anatomy.js` | 358 | klinika | Klinika Zoo — wnętrze pacjenta w rentgenie: kości (świecące, z niebieską poświatą), organy (kreskówkowe, kolorowe), |
| `models/animal-rides.js` | 33 | zniwa | Zwierzęta jako pojazdy (Żniwa): saddle (siodło), rideAnimal (zwierzak z ZOO + siedzisko i kierowca), buildGiraffe, buildElephant. |
| `models/animals.js` | 231 | taxi zniwa pralnia arka piraci klinika | Zwierzęta „słodziaki” (z Pralni Zoo) — samodzielny moduł z własnymi helperami, działa w każdej grze z three.js. |
| `models/buildings.js` | 19 | ciuchcia taxi zniwa | Budynki: gableHouse (dom z dwuspadowym dachem), groundPad (płyta), ramp (peron/rampa), nameBoard (tablica z nazwą na słupkach). |
| `models/cab.js` | 39 | ciuchcia taxi | Taksówka i radiowóz: carFace (światła, zderzaki, atrapa, tablice), buildTaxi, buildPolice. |
| `models/cars.js` | 89 | ciuchcia taxi | Auta: mkAuto (podwozie, koła, kierownica, kamera), nadwozie z bocznego zarysu (profGeo), szyby, autobus, wyścigówka, auta AI. |
| `models/farm.js` | 287 | zniwa | Maszyny rolnicze (Żniwa): makeScrew (ślimak), buildCombine (kombajn z hederem zbożowym / do kukurydzy), buildPlough, buildSeeder, |
| `models/grass.js` | 48 | zniwa | Kępki trawy i zboża: tuftGeo(rodzaj) → geometria do InstancedMesh (pszenica, kukurydza, trawa…). |
| `models/hats.js` | 10 | pralnia | Czapki dla zwierzaków (Pralnia): mkHat(rodzaj) → Group. Wariant mkHat w models/pirates.js — nie ładować obu. |
| `models/landmarks.js` | 210 | ciuchcia taxi | Budynki Ciuchciowa: dworce (CIUCHCIOWO, BOCIANOWO), domki, kopalnia, tartak, las, zoo, staw z przystankiem, elektrownia. |
| `models/nature.js` | 7 | pralnia klinika | Przyroda w stylu „słodziaków”: duck (kaczka), tree (drzewo), palm (palma) — (rodzic, x, y, z, skala). |
| `models/people.js` | 19 | ciuchcia taxi zniwa | Ludzie: makeFarmer(ręka w górze) — rolnik/kierowca w kapeluszu; pedGroup, pedMats — piesi na chodniku. |
| `models/pirates.js` | 91 | piraci klinika | Piraci: ludziki (mkHuman), czapki, opaski, wojownicy (mkFighter: zwierzak z ZOO lub ludzik + broń). |
| `models/plane.js` | 13 | taxi | Samolot (Taxi): planeBody(kolor) — kadłub ze skrzydłami i śmigłem, buildPlane — samolot jako pojazd (mkAuto). |
| `models/sea.js` | 354 | arka rafa piraci | Zwierzęta morskie (z Rafy koralowej) — samodzielny moduł: geometria, materiał z animacją wierzchołków. |
| `models/ships.js` | 141 | piraci | Okręty: kadłub (hullGeo, wymiary SH), deski, działa (mkCannon), żagle, flagi, buildShip(opcje) — maszty, wanty, załoga. |
| `models/tractor.js` | 90 | ciuchcia taxi zniwa | Ursus C-330: kabina, maska, koła z bieżnikiem, światła, kierowca, tablica rejestracyjna (M.uPlate). |
| `models/trains.js` | 166 | ciuchcia taxi | Pociągi: parowóz z tendrem, wagony osobowe i towarowe, EU07, Pendolino; koła szynowe, sprzęgi, zderzaki. |
| `models/vehicle-parts.js` | 27 | ciuchcia taxi zniwa | Części pojazdów: makeWheel (koło z felgą i bieżnikiem), makeSteeringWheel (kierownica), gaugeNeedle (wskazówka zegara). |
| `models/weapons.js` | 39 | piraci | Broń biała i pociski (Piraci): bladeGeo, mkWeapon(rodzaj) — szabla, miecz, rapier, katana, topór, łuk, kotwica, trójząb…, |
| `models/wild-cars.js` | 442 | bryki | Bryki — groźne pojazdy inspirowane zwierzętami, „zespawane” z blach, z nitami i spawami. Bez zwierząt w środku. |
<!-- /KATALOG -->

## Narzędzia

- `npm i` (puppeteer-core, acorn; Chrome z /Applications).
- `tools/chrome.mjs` — wspólny Chrome dla narzędzi: macOS/Linux (`CHROME=` ścieżka), proxy, three.js z `node_modules` gdy CDN niedostępny.
- `node tools/play.mjs [id…]` — każda gra: start, kilka sekund jazdy, błędy JS, zrzut `shots/<id>.jpg` (kafelki launchera). `--orig` / `--dist` testuje `orig/` / `dist/`.
- `node tools/galeria.mjs [kategoria…]` — galeria: błędy budowania modeli, zrzuty `tmp/galeria-*.png`.
- `node tools/build.mjs [gra…]` — `dist/<gra>.html`, jeden plik (artefakt Claude): wkleja lokalne skrypty i CSS, usuwa PWA.
- `node tools/deps.mjs [fragment]` — pliki `lib/`, `models/`: które gry je ładują, co biorą z innych plików, kontrakt gry (`scene`, klucze `M`), ukryte zależności i kolizje nazw (kod wyjścia 1, gdy coś jest nie tak).
- `node tools/catalog.mjs` — katalog plików wspólnych w README (linie, gry, opis z nagłówka).
- `node tools/dups.mjs [--all]` — funkcje o tej samej nazwie w kilku plikach, pogrupowane w identyczne warianty (kandydaci do deduplikacji).
- `node tools/fnsnap.mjs > a.json`, potem `--diff a.json` — które funkcje zmieniły treść (przeniesienie między plikami to nie zmiana).
- `node tools/modelhash.mjs [--root DIR] > a.json`, `--diff a.json b.json` — odcisk każdego modelu galerii (geometria, materiały); dowód, że przebudowa lub scalenie wariantów nic nie zmieniło (`DIR`: np. `git worktree` starszego commitu).
- Lokalnie: `python3 -m http.server` → http://localhost:8000/.

Nowa gra: katalog `<id>/` z `index.html` + `game.js`, wpis w `gry.json` (+ `START` w `tools/play.mjs`); potrzebne pliki z `lib/`, `models/` dołącz tagami `<script>` (nagłówek pliku mówi, czego wymaga); `node tools/deps.mjs`, `node tools/play.mjs <id>`, `node tools/catalog.mjs`.
