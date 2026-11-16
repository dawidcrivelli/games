#!/bin/bash
# Smoke test: each game in headless Chrome — JS console errors + screenshot shots/<game>.png (launcher tiles).
# Usage: tools/check.sh [game...]   (default: all dirs with game.js)
cd "$(dirname "$0")/.."; mkdir -p tmp shots; PORT=${PORT:-8766}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
python3 -m http.server $PORT >/dev/null 2>&1 & SP=$!; trap "kill $SP" EXIT; sleep 1
GAMES=${@:-$(ls -d */game.js | xargs -n1 dirname)}; FAIL=0
for g in $GAMES; do
  ERR=$("$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --user-data-dir="$PWD/tmp/chrome-prof" \
    --enable-logging=stderr --v=0 --window-size=800,500 --virtual-time-budget=5000 --screenshot="$PWD/${SHOTS:-shots}/${g//\//_}.png" \
    "http://localhost:$PORT/$g$([[ $g == *.html ]] || echo /)" 2>&1 | grep -E 'CONSOLE|Uncaught' | grep -v 'GL Driver Message')
  [ -n "$ERR" ] && { echo "✗ $g"; echo "$ERR" | head -5; FAIL=1; } || echo "✓ $g"
done
exit $FAIL
