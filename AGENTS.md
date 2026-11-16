# Agents

- Klasyczne skrypty, wspólny zasięg globalny; kolejność `<script>` w `<gra>/index.html` ma znaczenie. Pliki `lib/`, `models/` zawierają tylko deklaracje funkcji (bez kodu wykonywanego przy ładowaniu).
- Zmiana pliku współdzielonego (`lib/a-b.js`, `models/x.a-b.js`) dotyczy wszystkich gier z nazwy pliku → test wszystkich: `node tools/play.mjs`.
- Wariant tylko dla jednej gry: skopiuj funkcję do pliku z samą tą grą w nazwie, nie psuj innych.
- Test: `node tools/play.mjs [id]` (zero błędów JS), zrzut w `shots/`.
- `orig/` tylko do odczytu; `tools/split.mjs` nie uruchamiać ponownie (nadpisałby zmiany).
- `tmp/`, `dist/`: wyniki, poza repo.
