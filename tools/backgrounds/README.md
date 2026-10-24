# Background generators

Each scene background is drawn by a Python script, so a location can be changed and redrawn
rather than repainted. No 3D software or AI image generation is involved: NumPy does the maths,
OpenCV and Pillow do the image work.

| Script | Makes | How it's drawn |
|---|---|---|
| `victims-flat-hallway.py` | `victims-flat-hallway.png`, `-table.png` | 3D ray-cast corridor; textures, one bulb |
| `victims-flat-living-room.py` | `victims-flat-living-room.png`, `-coffee-table.png`, `-armchair-left.png`, `-armchair-right.png` | 3D ray-cast room plus furniture drawn with a depth buffer; one table lamp |
| `victims-flat-kitchen.py` | `victims-flat-kitchen.png` (panes transparent), `-window.png` (the view out), `-bin.png` | 3D ray-cast galley plus units drawn with a depth buffer; one fluorescent tube, with the wall cupboards' shadows |
| `victims-flat-bedroom.py` | `victims-flat-bedroom.png` (panes transparent), `-window.png` (the view out), `-bed.png` | 3D ray-cast room plus furniture drawn with a depth buffer; posters mapped onto the walls; lit by a lamp, fairy lights and a monitor. Also writes the fairy lights' bulbs (unlit in the background) to the scene's `data/fairyLights.json`, for the game to light and twinkle |
| `residential-street.py` | `residential-street.png`, `-lamps.png` | 2D: a 5760px terrace, night-graded to match the station exterior |
| `great-portland-street-exterior.py` | `great-portland-street-exterior.png` | From a photo of the real station: cleaned up, relit for night, signs redrawn |
| `ui-icons.py` | `ui/evidence-box-icon.png`, `ui/notebook.png` | 2D: the HUD buttons' 32px icons, filled in a palette and auto-outlined |
| `item-sprites.py` | `objects/beer.png`, `toy-car.png`, `cassette.png`, `key.png`, `lighter.png` | 2D: small sprites of things Frank can carry, from character maps, auto-outlined |
| `evidence-box.py` | `ui/evidence-box.png`, `-lid.png`, `-lid-open.png` | 2D: the inventory's archive box, open, its lid on, and its lid propped up behind it, on one canvas so they stack; auto-outlined, stamped in the game's pixel font |

## Running

```bash
tools/backgrounds/build.sh living-room   # or: hallway, kitchen, bedroom, street, exterior <photo>, icons, items
```

The first run sets up a Python environment in `tools/backgrounds/.venv` (needs `python3`). Each
run writes its files to `tools/backgrounds/out/` (git-ignored), including full-size `.full.png`
and `.big.png` previews from before pixelation, then copies the finished images into
`src/assets/images/backgrounds/`. The output is deterministic: an unchanged script reproduces
the committed images exactly.

The street and exterior need the original daytime exterior; `build.sh` takes it from git
(the version before commit `db922cb`). The exterior also needs the photo of the station it
was built from, which isn't in the repo.

The scripts use macOS system fonts (`/System/Library/Fonts`) for signs.

## How the 3D rooms work

1. **Room:** for every pixel, the ray from a virtual camera is intersected with the room's
   walls, floor and ceiling, giving perspective, a surface and a depth.
2. **Furniture:** built from flat polygons, boxes and cylinders, projected and drawn against
   a depth buffer, so the nearest surface wins at each pixel.
3. **Surfaces and light:** wallpaper, carpet and wood come from layered noise; lighting is
   per pixel from point lights (the lamp or bulb), with fall-off into the corners.
4. **Pixel art:** the render is shrunk 4x, reduced to a palette chosen by k-means, and saved
   at half size; the game scales it up with `image-rendering: pixelated`.
5. **Cut-outs:** every pixel records which object it belongs to, so furniture Frank walks
   behind is written out as transparent PNGs for the scene's `Occluder`s.

The kitchen's and bedroom's window panes come out transparent in the background, so the scene can put the
night and its rain behind them; the script draws the view out as a separate image and prints
where the hole is.

The living room, kitchen and bedroom scripts also print their cut-outs' positions, suggested
footprints and the walk area's corners (saved to `out/<room>-layout.json`). These are a starting point: the scene's `data/` file holds the
tuned values, so compare before copying numbers across.
