"""The neighbour in the victim's kitchen: lays PixelLab's frames (sources/neighbour/) out as the NPC's sprite sheet,
simplified to Frank's style: no outline, a small shared palette, flat colour.
Row 0 stands, leaning back, cigarette in hand (PixelLab drew her against a counter: it's taken out, its smoke kept).
Row 1 takes a drag, animated by PixelLab from row 0's frame and ending on it."""
import sys
import numpy as np
import cv2
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
SW, SH = 64, 104                                 # PixelLab's frames
W, H = 52, 84                                    # a touch coarser, like Frank (and shown at 5x)
COLOURS = 14
COUNTER_TOP = 51                                 # the counter's top edge in PixelLab's picture, behind her hips


def load(name):
    return np.asarray(Image.open(f'{SRC}/{name}.png').convert('RGBA')).copy()


def shrink(f):
    # drop whole rows and columns rather than averaging, so it stays crisp
    return cv2.resize(f, (W, H), interpolation=cv2.INTER_NEAREST)


def without_counter(im):
    """Below the counter top only her jeans, trainers and their outline; then her, and the smoke over her hand."""
    f = im.astype(int)
    r, b, a = f[..., 0], f[..., 2], f[..., 3] > 0
    keep = ((b > r + 10) | ((np.abs(r - b) < 30) & (r > 140))) & a
    near = cv2.dilate(keep.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    mask = a.copy()
    mask[COUNTER_TOP:] = (keep | ((f[..., :3].max(-1) < 90) & a & near))[COUNTER_TOP:]
    n, lab = cv2.connectedComponents(mask.astype(np.uint8), connectivity=8)
    her = lab == np.bincount(lab[mask]).argmax()
    smoke = mask & ~her & (np.arange(SH)[:, None] < 20) & (np.abs(f[..., 0] - f[..., 2]) < 30)
    im[~(her | smoke)] = 0
    return im


rows = [[shrink(without_counter(load('pixellab')))], [shrink(load(f'drag-{i}')) for i in range(1, 9)]]
frames = [f for row in rows for f in row]

# drop the dark outline round each silhouette
for f in frames:
    alpha = f[..., 3] > 127
    inner = cv2.erode(alpha.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    f[alpha & ~inner & (f[..., :3].max(-1) < 70), 3] = 0

# one small palette for every frame, so she doesn't shimmer as she moves
pixels = np.concatenate([f[f[..., 3] > 127][:, :3] for f in frames]).astype(np.float32)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, _, PALETTE = cv2.kmeans(pixels, COLOURS, None, crit, 5, cv2.KMEANS_PP_CENTERS)


SKIN = ((PALETTE - (219, 171, 132)) ** 2).sum(-1).argmin()
SHADE = ((PALETTE - (209, 121, 76)) ** 2).sum(-1).argmin()
BROW = ((PALETTE - (73, 35, 23)) ** 2).sum(-1).argmin()
WHITE = len(PALETTE)                             # the whites of her eyes: not in her picture, so added
PALETTE = np.vstack([PALETTE, np.array([[236, 224, 210]], np.float32)])
DARKEST = PALETTE.sum(-1).argmin()


def eyes(idx):
    """Frank's pattern, on a face five pixels wide: two pupils, a pale pixel either side of each (they share the
    middle one), four rows down her face; over each a brow, a line two pixels wide, straight above, with a gap over
    her nose. Her head doesn't move, so the still frame's places do for every frame."""
    ys, xs = np.nonzero(idx[:H // 4] == SKIN)
    eye = ys.min() + 4
    left = xs[ys == eye].min()
    pupils, whites = (left + 1, left + 3), (left, left + 2, left + 4)
    return ([((eye, x), DARKEST, False) for x in pupils] + [((eye, x), WHITE, False) for x in whites]
            + [((eye - 1, x), BROW, True) for x in (left, left + 1, left + 3, left + 4)])


def flatten(f, eye_at=None):
    idx = ((f[..., None, :3].astype(np.float32) - PALETTE[None, None, :WHITE]) ** 2).sum(-1).argmin(-1)
    idx[f[..., 3] <= 127] = -1
    # specks take their neighbours' colour: flat areas, like Frank
    prev, out = idx, idx.copy()
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if prev[y, x] < 0:
                continue
            around = prev[y - 1:y + 2, x - 1:x + 2].ravel()
            around = around[around >= 0]
            if (around == prev[y, x]).sum() <= 2:
                out[y, x] = np.bincount(around).argmax()
    for (y, x), colour, over_hair in eye_at or []:
        if out[y, x] in (SKIN, SHADE) or (over_hair and out[y, x] >= 0):   # her face, lit or in shade
            out[y, x] = colour
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[out >= 0, :3] = PALETTE[out[out >= 0]].astype(np.uint8)
    rgba[out >= 0, 3] = 255
    return rgba


still = flatten(rows[0][0])
still = ((still[..., None, :3].astype(np.float32) - PALETTE[None, None, :WHITE]) ** 2).sum(-1).argmin(-1)
EYES = eyes(still)

columns = max(len(row) for row in rows)
sheet = Image.new('RGBA', (W * columns, H * len(rows)))
for r, row in enumerate(rows):
    for c, f in enumerate(row):
        sheet.alpha_composite(Image.fromarray(flatten(f, EYES)), (c * W, r * H))
sheet.save(OUT, optimize=True)
print(f'{columns} columns, {len(rows)} rows of {W}x{H}; the drag is {len(rows[1])} frames; eyes at {EYES}')
