#!/bin/sh
# Regenerates a scene's background (and its cut-outs) and copies them into the game.
#   ./build.sh <scene>           scenes: street, hallway, living-room, kitchen, bedroom, exterior
#   ./build.sh exterior <photo>  the station exterior is built from a photo of the real station
#   ./build.sh icons             the HUD buttons' icons (evidence box and notepad), the evidence box
#                                and the mouse cursors
#   ./build.sh items             sprites for things Frank can carry (beer, toy car, cassette, key, lighter)
#                                and the newspaper on the platform's bench
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
    # Its pavement comes from the daytime exterior as it was before db922cb
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
  kitchen)
    mkdir -p "$OUT/kitchen-cuts"
    # prints the bin's position and footprint, the walk area and where the window's hole is
    $PY -I victims-flat-kitchen.py "$OUT/kitchen.png" "$OUT/kitchen-cuts" "$OUT/kitchen-window.png" | tee "$OUT/kitchen-layout.json"
    cp "$OUT/kitchen.png" "$ASSETS/victims-flat-kitchen.png"
    cp "$OUT/kitchen-window.png" "$ASSETS/victims-flat-kitchen-window.png"
    for cut in "$OUT"/kitchen-cuts/*.png; do
      cp "$cut" "$ASSETS/victims-flat-kitchen-$(basename "$cut")"
    done
    ;;
  bedroom)
    mkdir -p "$OUT/bedroom-cuts"
    # prints the layout; the fairy lights go straight into the scene's data
    $PY -I victims-flat-bedroom.py "$OUT/bedroom.png" "$OUT/bedroom-cuts" "$OUT/bedroom-window.png" \
      "$ROOT/src/features/scenes/victimsFlatBedroom/data/fairyLights.json" | tee "$OUT/bedroom-layout.json"
    cp "$OUT/bedroom.png" "$ASSETS/victims-flat-bedroom.png"
    cp "$OUT/bedroom-window.png" "$ASSETS/victims-flat-bedroom-window.png"
    for cut in "$OUT"/bedroom-cuts/*.png; do
      cp "$cut" "$ASSETS/victims-flat-bedroom-$(basename "$cut")"
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
  icons)
    mkdir -p "$OUT/ui"
    $PY -I ui-icons.py "$OUT/ui/evidence-box-icon.png" "$OUT/ui/notebook.png" "$OUT/ui"
    $PY -I evidence-box.py "$OUT/ui"
    mkdir -p "$ROOT/src/assets/images/ui"
    cp "$OUT"/ui/*.png "$ROOT/src/assets/images/ui/"
    ;;
  items)
    mkdir -p "$OUT/items"
    $PY -I item-sprites.py "$OUT/items"
    cp "$OUT"/items/*.png "$ROOT/src/assets/images/objects/"
    ;;
  *)
    echo "usage: ./build.sh street | hallway | living-room | kitchen | bedroom | exterior <photo> | icons | items" >&2
    exit 1
    ;;
esac
echo "Done. Preview images are in tools/backgrounds/$OUT/"
