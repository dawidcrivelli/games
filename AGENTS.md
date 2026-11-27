# Agents

- Klasyczne skrypty, wspólny zasięg globalny; kolejność `<script>` w `<gra>/index.html` ma znaczenie. Pliki `lib/`, `models/` zawierają deklaracje (funkcje, stałe, materiały) — bez DOM, `scene.add` ani `rnd()` przy ładowaniu; to robią funkcje `*Init()` wołane przez grę.
- Biblioteki wg funkcji, nie wg gier: `lib/<area>/<name>.js` (`common`, `3d`, `audio`, `input`, `ui`), `models/<category>.js` — po angielsku, **bez nazw gier**. Gra, która zaczyna używać pliku, dodaje tylko `<script>`; nazwy pliku się nie zmienia. Kod tylko jednej gry → `<gra>/`.
- Plik wspólny nie bierze nic z gry poza kontraktem 3D (`scene`, paleta `M`); resztę przez parametry albo stan w samym pliku. Nagłówek pliku: co zawiera, użycie, `wymaga:`.
- Wariant dla jednej gry: parametr / opcja albo druga funkcja obok (inna nazwa); nie kopiuj funkcji do gry. Nie zmieniaj istniejących modeli i dźwięków przy okazji; scalenie wariantów sprawdź `node tools/modelhash.mjs` (przed/po).
- Po zmianie plików wspólnych lub listy `<script>`: `node tools/deps.mjs` (0 ukrytych zależności, kluczy `M`, kolizji), `node tools/play.mjs` (wszystkie gry), `node tools/catalog.mjs` (katalog w README). Duplikaty: `node tools/dups.mjs`.
- Test: `node tools/play.mjs [id]` (zero błędów JS), zrzut w `shots/`.
- Szybkie testy (headless Chrome bez GPU = SwiftShader, ~1 s na klatkę): gra obsługuje `?test` — bez pętli rAF, `window.TEST = { step(s), render(), … }`
  (logika liczona bez rysowania, obraz tylko na zrzut), a przy SwiftShader sama włącza słabą grafikę (bez cieni, mniej pikseli). Wtedy:
  `node tools/quick.mjs <gra> "<js>" [zrzut.png] [szer wys]` — cały scenariusz w kilka sekund (wzór: `ogrodek/game.js`, koniec pliku).
  Opóźnienia w grze przez czas gry (kolejka), nie `setTimeout`, żeby `TEST.step` je obejmował. Telefon poziomo do sprawdzenia: 986×388 i 844×390.
- `orig/` tylko do odczytu; `tools/split.mjs` nie uruchamiać ponownie (nadpisałby zmiany).
- `tmp/`, `dist/`: wyniki, poza repo.
