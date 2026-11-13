# Background generators

Each scene background is drawn by a Python script, so a location can be changed and redrawn
rather than repainted. No 3D software or AI image generation is involved (except the victim's body and the SOCO, which start from PixelLab sprites): NumPy does the maths,
OpenCV and Pillow do the image work.

| Script | Makes | How it's drawn |
|---|---|---|
| `victims-flat-hallway.py` | `victims-flat-hallway.png`, `-table.png` | 3D ray-cast corridor; textures, one bulb |
| `victims-flat-living-room.py` | `victims-flat-living-room.png`, `-coffee-table.png`, `-armchair-left.png`, `-armchair-right.png`, `-glass.png`, `-pill-bottle.png`, `-bedding.png` | 3D ray-cast room plus furniture drawn with a depth buffer; one table lamp. The glass, pill bottle and bedding are drawn on a layer of their own, left out of the background and cut out as sprites in its palette, so the scene can take them away |
| `victims-flat-kitchen.py` | `victims-flat-kitchen.png` (panes transparent), `-window.png` (the view out), `-bin.png`, `-fridge-inside.png`, `-fridge-door.png`, `-cupboards-inside.png`, `-cupboards-door.png` | 3D ray-cast galley plus units drawn with a depth buffer; one fluorescent tube, with the wall cupboards' shadows; a calendar on a cupboard door. The fridge and two wall cupboards are rendered again at each angle of their doors' swing: what changes from the closed room is cut out as sprite sheets, the door in one and what it uncovers (the lit fridge with its cake, the near-empty cupboard) in the other, with a few extra colours for what the closed room doesn't have |
| `victims-flat-bedroom.py` | `victims-flat-bedroom.png` (panes transparent), `-window.png` (the view out), `-bed.png`, `-schoolwork.png` | 3D ray-cast room plus furniture drawn with a depth buffer; posters, a certificate and crayon drawings mapped onto the walls; the schoolwork on the bed drawn on a layer of its own and cut out as a sprite, like the living room's props; lit by a lamp, fairy lights and a monitor. Also writes the fairy lights' bulbs (unlit in the background) to the scene's `data/fairyLights.json`, for the game to light and twinkle |
| `residential-street.py` | `residential-street.png`, `-lamps.png` | 2D: a 5760px terrace, night-graded to match the station exterior |
| `great-portland-street-exterior.py` | `great-portland-street-exterior.png` | From a photo of the real station: cleaned up, relit for night, signs redrawn |
| `ui-icons.py` | `ui/evidence-box-icon.png`, `ui/notebook.png`, `ui/cursor-{arrow,hand}{,@2x}.png` | 2D: the HUD buttons' 32px icons, filled in a palette and auto-outlined; the mouse cursors, drawn from text maps at 16px and saved at 2x and 4x |
| `item-sprites.py` | `objects/beer.png`, `toy-car.png`, `cassette.png`, `key.png`, `lighter.png`, `newspaper.png` | 2D: small sprites of things Frank can carry (and the platform's newspaper), from character maps, auto-outlined |
| `victim-body.py` | `objects/victim-body.png` | From a PixelLab sprite (`sources/victim-body-pixellab.png`, its head made smaller by hand): outline dropped, skin greyed, lit by the living room's lamp, a shadow on the sofa, scaled up 5x to match Frank |
| `soco-sprite.py` | `sprites/soco.png` | The living room's SOCO: PixelLab's frames (`sources/soco/`) shrunk to Frank's size and simplified to his style (no outline, a few flat hand-picked colours, eyes drawn in), laid out as a sprite sheet: taking a photo, walking, standing still. The legs and shoe covers are drawn by the script, the same in every frame: standing, or posed for each of the walk's 12 frames (the planted leg straight, the hips rising over it; three strides to the route between the two spots) |
| `neighbour-sprite.py` | `sprites/neighbour.png` | The neighbour in the kitchen: PixelLab's picture of her (`sources/neighbour/pixellab.png`, with the counter it drew behind her taken out and its smoke kept) and the drag on her cigarette it animated from that frame (`drag-1..8.png`), shrunk to 52x84 (dropping rows and columns, so it stays crisp), outline dropped, flattened to a small shared palette and given eyes and brows in Frank's pattern, laid out as a sheet: leaning, then the drag |
| `npc-portraits.py` | `portraits/portrait-soco.png`, `portraits/portrait-neighbour.png` | The SOCO's and the neighbour's talking portraits, drawn from shapes: 15 frames of 80x96 like Frank's and Derek's, facing left, the mouth (the SOCO's mask, moving with his jaw) changing in the same order as Derek's strip and a blink on frame 5. The red circle is the existing portraits' own pixels where they show it, and fitted ellipses under their heads. Also gives Frank's angry strip (`portraits/portrait-frank-angry.png`) a blink on frame 5, his regular lids under his angry brows, and prints where each strip's eyes are for the game's blinking. Draws the neighbour's drag on her cigarette too (`portraits/portrait-neighbour-drag.png`, 20 frames): her hand up out of the middle of the circle, the end glowing as she draws on it, then the smoke she blows out |
| `npc-eyes.py` | `sprites/derek.png`, `sprites/constable.png` | Redraws Derek's and the constable's eyes in Frank's pattern (a dark pupil, a pale pixel either side, a three-pixel brow straight above wherever the face shows there), from their sheets as drawn in `sources/eyes/`. Finds the pupils in each frame; frames mid-move with none borrow the nearest frame's |
| `evidence-box.py` | `ui/evidence-box.png`, `-lid.png`, `-lid-open.png` | 2D: the inventory's archive box, open, its lid on, and its lid propped up behind it, on one canvas so they stack; auto-outlined, stamped in the game's pixel font |

## Running

```bash
tools/backgrounds/build.sh living-room   # or: hallway, kitchen, bedroom, street, exterior <photo>, icons, items, body, soco, neighbour, eyes, portraits
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
