"""The SOCO in the victim's living room: lays PixelLab's frames (sources/soco/) out as the NPC's sprite sheet,
simplified to Frank's style: no outline, a small shared palette, flat colour.
Row 0 takes a photo (raises the camera, holds it at the eye, lowers it), row 1 walks, row 2 stands still.
The legs are drawn here, the same in every frame: under each pose's top half, standing or posed for each of the
walk's 12 frames. Its eye is on the
silhouette's edge, so the outline goes with it: every frame has its eye drawn back, Frank's way."""
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw

SRC, OUT = sys.argv[1], sys.argv[2]
SCALE = 0.875                                   # so they're Frank's height at his pixel size
W, H = round(64 * SCALE), round(104 * SCALE)
HOLD = 3                                        # frames at the eye, round the shutter

def load(name):
    f = np.asarray(Image.open(f'{SRC}/{name}.png').convert('RGBA')).astype(np.float32) / 255
    # drop whole rows and columns rather than averaging, so it stays crisp
    return cv2.resize(f, (W, H), interpolation=cv2.INTER_NEAREST)


raise_ = [load('still'), *[load(f'raise-{i}') for i in range(1, 7)]]
SHUT_FROM = 4                                   # from raise-4 the camera's at his face: he shuts the other eye
photo = [*range(len(raise_)), *[len(raise_) - 1] * (HOLD - 1), *range(len(raise_) - 2, 0, -1)]
rows = [
    [(raise_[i], i >= SHUT_FROM) for i in photo],
    [(load('still'), False)],
]
frames = [f for row in rows for f, _ in row]

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
    (234, 224, 214),                                      # the whites of the eye, either side of the pupil, like Frank's
], np.float32) / 255
GREYS, COLOURED = slice(0, 5), slice(6, 10)
DARK, BROW, SKIN, WHITE = 4, 5, 6, 10


EYE_DROP = 7                                    # the eye's rows below the top of his hood


def draw_eye(idx, shut=False):
    """Frank's pattern, in profile (facing right): the pupil with a pale pixel either side, a brow straight above
    three pixels wide; shut, a short dark lid instead. Always the same height on his head, in the skin showing
    between hood and mask; none where the camera's in front of it."""
    y = np.nonzero((idx >= 0).any(1))[0].min() + EYE_DROP
    xs = np.nonzero(idx[y] == SKIN)[0]
    if not len(xs):
        return
    x = xs[-1] - 1 if len(xs) > 1 else xs[-1]
    on_skin = lambda cols: [c for c in cols if 0 <= c < W and idx[y, c] == SKIN]
    if shut:
        # the last two pixels of face before the camera: squinting, his hood comes down to the eye
        for c in on_skin((xs[-1] - 1, xs[-1])):
            idx[y, c] = DARK
    else:
        for c in on_skin((x - 1, x + 1)):
            idx[y, c] = WHITE
        idx[y, x] = DARK
    for c in range(x - 1, x + 2):
        if 0 <= c < W and idx[y - 1, c] == SKIN:
            idx[y - 1, c] = BROW


def flatten(f, shut=False):
    """Palette indices, -1 where it's clear."""
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
    draw_eye(out, shut)
    return out


# The walk: a loop of two steps in 12 frames. His route between spots is 2080ms (474 game px), which he walks in
# three steps: 158 game px, 30px here at 5.25x, so the planted foot goes back 30px a step and doesn't slide.
# The planted leg stays straight, so the hips rise over it and drop as the other heel lands.
HIP_Y, ANKLE_Y = 47, 83                         # rows where the legs join the suit and the ankles are, standing
THIGH, SHIN = 18, 18                            # together, straight from hip to ankle
WAIST_Y = 50                                    # each pose down to here rides on the legs
FAR_HIP, NEAR_HIP = 24, 28                      # x of each hip
WALK_FRAMES, HALF_STRIDE, LIFT = 12, 15, 5


def gait(t):
    """A leg at t through the loop (0 = its heel lands in front): its ankle's x from the hip, how high the foot is
    lifted and how far its heel is raised."""
    if t < 0.5:                                 # planted, going back; the heel comes up just before it leaves
        return HALF_STRIDE * (1 - 4 * t), 0, round(max(0, t - 0.36) * 20)
    u = (t - 0.5) * 2                           # swinging through, toe down at first
    x = -HALF_STRIDE + HALF_STRIDE * (1 - np.cos(np.pi * u))
    return x, round(LIFT * np.sin(np.pi * u)), round(3 * max(0, 1 - 2 * u))


LIT, MID, SHADE, DEEP = 0, 1, 2, 3
SHOE_LIGHT, SHOE, SHOE_DARK = 7, 8, 9


def knee(hip, ankle):
    """Where the knee goes: thigh and shin meet, bending forward (to the right)."""
    d = np.subtract(ankle, hip)
    dist = min(np.hypot(*d), THIGH + SHIN - 1e-3)
    along = (THIGH ** 2 + dist ** 2 - SHIN ** 2) / (2 * dist)
    across = np.sqrt(max(THIGH ** 2 - along ** 2, 0))
    u = d / np.hypot(*d)
    n = np.array([-u[1], u[0]])
    if n[0] < 0:
        n = -n
    return np.array(hip) + u * along + n * across


def limb_mask(points, widths):
    img = Image.new('L', (W, H))
    draw = ImageDraw.Draw(img)
    for (p, wp), (q, wq) in zip(zip(points, widths), zip(points[1:], widths[1:])):
        u = np.subtract(q, p) / max(np.hypot(*np.subtract(q, p)), 1e-6)
        n = np.array([-u[1], u[0]])
        draw.polygon([tuple(p + n * wp / 2), tuple(q + n * wq / 2), tuple(q - n * wq / 2), tuple(p - n * wp / 2)],
                     fill=1)
    for p, w in zip(points[1:-1], widths[1:-1]):
        draw.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=1)
    return np.asarray(img).astype(bool)


def shoe_mask(ax, ay, heel_up):
    img = Image.new('L', (W, H))
    ImageDraw.Draw(img).polygon([(ax - 4, ay - heel_up), (ax + 3, ay), (ax + 8, ay + 3), (ax + 8, ay + 5),
                                 (ax - 4, ay + 5 - heel_up)], fill=1)
    shoe = np.asarray(img).astype(bool)
    # a tilted shoe's toe can end in a lone pixel: trim it
    around = sum(np.roll(np.roll(shoe, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1)) - shoe
    return shoe & (around >= 2)


def shaded(mask, lit, shade, edge):
    """Shadow down the back (left), light over the rest, a mid tone down the front edge."""
    out = np.full(mask.shape, -1)
    out[mask] = shade
    lit_part = mask & np.roll(mask, 2, axis=1)
    out[lit_part] = lit
    out[mask & ~np.roll(mask, -1, axis=1)] = edge
    return out


def with_legs(pose, bob=0, near_step=(0, 0, 0), far_step=(0, 0, 0)):
    """The pose's top half, `bob` rows lower, on legs with each ankle placed as gait() gives it."""
    idx = np.full((H, W), -1)
    rows = np.arange(WAIST_Y)
    idx[rows + bob] = pose[:WAIST_Y]
    # the blotches in the still's hips would stop dead at the legs: smooth them away
    hips = idx[HIP_Y - 5 + bob:WAIST_Y + bob]
    hips[np.isin(hips, (MID, DEEP)) & np.roll(hips >= 0, -1, axis=1)] = LIT
    for hip_x, (ax, lift, heel_up), near in ((FAR_HIP, far_step, False), (NEAR_HIP, near_step, True)):
        hip = (hip_x, HIP_Y + bob)
        ankle = (hip_x + ax, ANKLE_Y - lift)
        leg = limb_mask([hip, knee(hip, ankle), ankle], [12, 10, 9])
        shoe = shoe_mask(hip_x + ax, ANKLE_Y - lift, heel_up)
        leg_px = shaded(leg, LIT if near else SHADE, SHADE if near else DEEP, MID if near else SHADE)
        shoe_px = shaded(shoe, SHOE_LIGHT if near else SHOE, SHOE if near else SHOE_DARK, SHOE if near else SHOE_DARK)
        sole = shoe & ~np.roll(shoe, -1, axis=0)
        shoe_px[sole] = SHOE if near else SHOE_DARK
        # the far leg goes behind the suit; the near one over it, below the waist
        paint = leg & ((idx < 0) | (near & (np.arange(H)[:, None] >= HIP_Y + bob + 2)))
        idx[paint] = leg_px[paint]
        paint = shoe & (near | (idx < 0) | leg)
        idx[paint] = shoe_px[paint]
    return idx


def walk_frame(still, i):
    t = i / WALK_FRAMES
    near, far = gait(t), gait((t + 0.5) % 1)
    planted = near if t < 0.5 else far
    hip_y = ANKLE_Y - np.sqrt((THIGH + SHIN) ** 2 - planted[0] ** 2)
    # no more than 2 rows down: the landing knee gives a little
    return with_legs(still, min(2, round(hip_y - HIP_Y)), near, far)


def to_rgba(out):
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[out >= 0, :3] = (PALETTE[out[out >= 0]] * 255).astype(np.uint8)
    rgba[out >= 0, 3] = 255
    return rgba


columns = max(len(row) for row in rows)
sheet = Image.new('RGBA', (W * columns, H * (len(rows) + 1)))
cells = [[with_legs(flatten(f, shut)) for f, shut in row] for row in rows]
cells.insert(1, [walk_frame(cells[-1][0], i) for i in range(WALK_FRAMES)])
for r, row in enumerate(cells):
    for c, idx in enumerate(row):
        sheet.alpha_composite(Image.fromarray(to_rgba(idx)), (c * W, r * H))
sheet.save(OUT, optimize=True)
print(f'{columns} columns; photo row {len(rows[0])} frames, shutter at frame {len(raise_) - 1}')
