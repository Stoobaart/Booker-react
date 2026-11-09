"""The SOCO in the victim's living room: lays PixelLab's frames (sources/soco/) out as the NPC's sprite sheet,
simplified to Frank's style: no outline, a small shared palette, flat colour.
Row 0 takes a photo (raises the camera, holds it at the eye, lowers it), row 1 walks, row 2 stands still.
The walk was drawn by PixelLab from this sheet's still frame, so it already has its eye; it loops contact to contact."""
import sys
import numpy as np
import cv2
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
SCALE = 0.875                                   # so they're Frank's height at his pixel size
W, H = round(64 * SCALE), round(104 * SCALE)
HOLD = 3                                        # frames at the eye, round the shutter

def load(name):
    f = np.asarray(Image.open(f'{SRC}/{name}.png').convert('RGBA')).astype(np.float32) / 255
    # drop whole rows and columns rather than averaging, so it stays crisp
    return cv2.resize(f, (W, H), interpolation=cv2.INTER_NEAREST)
def head_x(f):
    xs = np.nonzero(f[:H // 6, :, 3] > 0.5)[1]
    return xs.mean()


def in_place(f, ref):
    """Shifted so its head is over the still pose's: the scene moves them, not the frames."""
    return np.roll(f, round(head_x(ref) - head_x(f)), axis=1)


raise_ = [load('still'), *[load(f'raise-{i}') for i in range(1, 7)]]
rows = [
    [*raise_, *[raise_[-1]] * (HOLD - 1), *raise_[-2:0:-1]],
    [(in_place(load(f'walk-{i}'), load('still')), 'drawn') for i in range(1, 7)],
    [load('still')],
]
frames = [f[0] if isinstance(f, tuple) else f for row in rows for f in row]

# drop the dark outline round each silhouette
for f in frames:
    alpha = f[..., 3] > 0.5
    inner = cv2.erode(alpha.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    f[alpha & ~inner & (f[..., :3].max(-1) < 0.3), 3] = 0

# a few flat colours, like Frank
PALETTE = np.array([
    (232, 238, 238), (188, 200, 208), (132, 146, 160),    # suit: lit, mid, shadow
    (92, 104, 118),                                       # suit in deep shadow
    (24, 28, 32),                                         # camera, strap and eye
    (88, 58, 40),                                         # eyebrows
    (172, 118, 88),                                       # skin
    (96, 196, 228), (44, 124, 204), (28, 78, 150),        # mask, gloves and shoe covers
], np.float32) / 255
GREYS, COLOURED = slice(0, 5), slice(6, 10)
DARK, BROW, SKIN = 4, 5, 6


def draw_eye(idx):
    """The eye and its brow, in the skin showing between hood and mask (facing right), if the face is in view."""
    rows = np.nonzero((idx[:H // 4] == SKIN).any(1))[0]
    if len(rows) < 2:
        return
    y = rows[min(len(rows) // 3 + 1, len(rows) - 1)]
    xs = np.nonzero(idx[y] == SKIN)[0]
    x = xs[-1] - 1 if len(xs) > 1 else xs[-1]
    idx[y, x] = DARK
    brow = np.nonzero(idx[y - 1] == SKIN)[0]
    for bx in brow[(brow >= x - 1) & (brow <= x + 1)]:
        idx[y - 1, bx] = BROW


def flatten(f, drawn=False):
    alpha = f[..., 3] > 0.5
    # the suit's shadows are bluish: only clearly coloured pixels become skin or blue
    rgb = f[..., :3]
    sat = rgb.max(-1) - rgb.min(-1)
    near = lambda part: ((rgb[..., None, :] - PALETTE[part]) ** 2).sum(-1).argmin(-1)
    idx = np.where(sat > 0.28, near(COLOURED) + COLOURED.start, near(GREYS))
    idx[~alpha] = -1
    # specks take their neighbours' colour, twice over: flat areas, like Frank
    out = idx
    for _ in range(2):
        prev, out = out, out.copy()
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                if prev[y, x] < 0:
                    continue
                around = prev[y - 1:y + 2, x - 1:x + 2].ravel()
                around = around[around >= 0]
                if (around == prev[y, x]).sum() <= 3:
                    out[y, x] = np.bincount(around).argmax()
    if not drawn:
        draw_eye(out)
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[out >= 0, :3] = (PALETTE[out[out >= 0]] * 255).astype(np.uint8)
    rgba[out >= 0, 3] = 255
    return rgba


columns = max(len(row) for row in rows)
sheet = Image.new('RGBA', (W * columns, H * len(rows)))
for r, row in enumerate(rows):
    for c, f in enumerate(row):
        f, drawn = f if isinstance(f, tuple) else (f, False)
        sheet.alpha_composite(Image.fromarray(flatten(f, drawn)), (c * W, r * H))
sheet.save(OUT, optimize=True)
print(f'{columns} columns; photo row {len(rows[0])} frames, shutter at frame {len(raise_) - 1}')
