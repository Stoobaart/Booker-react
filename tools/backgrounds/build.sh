#!/bin/sh
# Regenerates a scene's background (and its cut-outs) and copies them into the game.
#   ./build.sh <scene>           scenes: street, hallway, living-room, exterior
#   ./build.sh exterior <photo>  the station exterior is built from a photo of the real station
# Working files (including the .full.png / .big.png previews) go in out/, which git ignores.
set -e
cd "$(dirname "$0")"
ROOT=../..
ASSETS=$ROOT/src/assets/images/backgrounds
OUT=out
PY=.venv/bin/python

if [ ! -x "$PY" ]; then
  echo "First run: setting up the Python environment in .venv"
  python3 -m venv .venv
  .venv/bin/pip install -q --disable-pip-version-check -r requirements.txt
fi
mkdir -p "$OUT"

case "$1" in
  street)
    # The street is graded to match the station exterior, and its pavement comes from the
    # original daytime exterior (as it was before db922cb).
    git -C "$ROOT" show "db922cb^:src/assets/images/backgrounds/great-portland-street-exterior.png" > "$OUT/old-exterior.png"
    $PY -I residential-street.py "$OUT/old-exterior.png" "$ASSETS/great-portland-street-exterior.png" \
      "$OUT/street.png" "$OUT/lamps.png"
    cp "$OUT/street.png" "$ASSETS/residential-street.png"
    cp "$OUT/lamps.png" "$ASSETS/residential-street-lamps.png"
    ;;
  hallway)
    $PY -I victims-flat-hallway.py "$OUT/hallway.png" "$OUT/hallway-table.png"
    cp "$OUT/hallway.png" "$ASSETS/victims-flat-hallway.png"
    cp "$OUT/hallway-table.png" "$ASSETS/victims-flat-hallway-table.png"
    ;;
  living-room)
    mkdir -p "$OUT/living-room-cuts"
    # prints the cut-outs' positions, their footprints and the walk area for the scene's data file
    $PY -I victims-flat-living-room.py "$OUT/living-room.png" "$OUT/living-room-cuts" | tee "$OUT/living-room-layout.json"
    cp "$OUT/living-room.png" "$ASSETS/victims-flat-living-room.png"
    for cut in "$OUT"/living-room-cuts/*.png; do
      cp "$cut" "$ASSETS/victims-flat-living-room-$(basename "$cut")"
    done
    ;;
  exterior)
    if [ -z "$2" ]; then
      echo "usage: ./build.sh exterior <photo of Great Portland Street station>" >&2
      exit 1
    fi
    git -C "$ROOT" show "db922cb^:src/assets/images/backgrounds/great-portland-street-exterior.png" > "$OUT/old-exterior.png"
    $PY -I great-portland-street-exterior.py "$2" "$OUT/old-exterior.png" "$OUT/exterior.png"
    cp "$OUT/exterior.png" "$ASSETS/great-portland-street-exterior.png"
    ;;
  *)
    echo "usage: ./build.sh street | hallway | living-room | exterior <photo>" >&2
    exit 1
    ;;
esac
echo "Done. Preview images are in tools/backgrounds/$OUT/"
