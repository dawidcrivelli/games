# Agents

- Klasyczne skrypty, wspólny zasięg globalny; kolejność `<script>` w `<gra>/index.html` ma znaczenie. Pliki `lib/`, `models/` zawierają tylko deklaracje funkcji (bez kodu wykonywanego przy ładowaniu).
- Biblioteki wg funkcji, nie wg gier — przebudowa w toku, patrz `PLAN.md`. Nowy plik wspólny: `lib/<area>/<name>.js` / `models/<category>.js` (po angielsku, bez nazw gier). Gra zaczyna używać istniejącego pliku z nazwami gier w nazwie → tylko dodaj `<script>`, **nie zmieniaj nazwy pliku**.
- Kto używa pliku i co bierze z gry: `node tools/deps.mjs`; duplikaty: `node tools/dups.mjs`. Zmiana pliku współdzielonego → test wszystkich gier: `node tools/play.mjs`.
- Wariant dla jednej gry: parametr / opcja albo druga funkcja obok (inna nazwa) w tym samym pliku; kod tylko jednej gry → `<gra>/`. Nie zmieniaj istniejących modeli i dźwięków przy okazji.
- Test: `node tools/play.mjs [id]` (zero błędów JS), zrzut w `shots/`.
- `orig/` tylko do odczytu; `tools/split.mjs` nie uruchamiać ponownie (nadpisałby zmiany).
- `tmp/`, `dist/`: wyniki, poza repo.
