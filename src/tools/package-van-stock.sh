#!/usr/bin/env bash
# Copies the Van Stock app from a checkout of 89solutions/vans into a folder ready to upload
# to the server as private/apps/van-stock/.
# Usage: src/tools/package-van-stock.sh /path/to/vans [output-dir]
set -euo pipefail
SRC="${1:?Path to the vans repo}"
OUT="${2:-dist/apps/van-stock}"
FILES=(index.html stylesheet.css store.js starters.js scanner.js app.js sw.js manifest.webmanifest favicon.svg images vendor)
rm -rf "$OUT"; mkdir -p "$OUT"
for f in "${FILES[@]}"; do cp -R "$SRC/$f" "$OUT/"; done
echo "Van Stock packaged in $OUT ($(du -sh "$OUT" | cut -f1)). Upload its contents to private/apps/van-stock/ on the server."
