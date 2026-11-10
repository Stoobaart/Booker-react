"""Redraws the eyes on an NPC's sprite sheet in Frank's pattern: a dark pupil with a pale pixel either side, and a
brow, a line three pixels wide, straight over each (where the face shows there: a hat brim or hair already is one).
The sheets in sources/eyes/ are the NPCs' sprites as they were drawn; this writes the game's copy.
Usage: npc-eyes.py <source sheet> <out> <columns> <rows> <brow colour as r,g,b>"""
import sys
import numpy as np
from PIL import Image

SRC, OUT, COLS, ROWS, BROW = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
BROW = tuple(int(c) for c in BROW.split(','))
PUPIL, WHITE = (36, 30, 28), (234, 224, 214)


def skin(f):
    r, g, b = (f[..., i].astype(int) for i in range(3))
    return (r > 140) & (r > g + 12) & (g > b) & (f[..., 3] > 0)


def pupil(f):
    r, g, b = (f[..., i].astype(int) for i in range(3))
    dark = r + g + b < 240
    cyan = (b > r + 80) & (g > r + 60)                     # a few frames came out with glowing eyes
    return (dark | cyan) & (f[..., 3] > 0)


def top(f):
    return np.nonzero(f[..., 3])[0].min()


def find(f):
    """The two pupils: dark (or cyan) pixels a few apart on one row with skin between, high up the figure."""
    s, p = skin(f), pupil(f)
    t = top(f)
    for gap in (4, 3):
        for y in range(t + 3, t + 24):
            for x in range(1, f.shape[1] - gap - 2):
                if p[y, x] and p[y, x + gap] and s[y, x + 2] and not p[y, x + 2] and \
                        (s[y, x - 1] or s[y, x + 1]) and (s[y, x + gap - 1] or s[y, x + gap + 1]):
                    return y - t, (x, x + gap)
    return None


def draw(f, y, xs):
    s = skin(f)
    for x in xs:
        if not (s[y, x] or pupil(f)[y, x]):
            return                                      # the borrowed place isn't on her face here
    for x in xs:
        f[y, x, :3] = PUPIL
        for wx in (x - 1, x + 1):
            if s[y, wx] and wx not in xs:
                f[y, wx, :3] = WHITE
        for bx in (x - 1, x, x + 1):
            if s[y - 1, bx]:
                f[y - 1, bx, :3] = BROW


sheet = np.asarray(Image.open(SRC).convert('RGBA')).copy()
fh, fw = sheet.shape[0] // ROWS, sheet.shape[1] // COLS
for r in range(ROWS):
    frames = [sheet[r * fh:(r + 1) * fh, c * fw:(c + 1) * fw] for c in range(COLS)]
    frames = [f for f in frames if f[..., 3].any()]
    found = [find(f) for f in frames]
    for i, f in enumerate(frames):
        eyes = found[i]
        if eyes is None:                                # mid-move, no eyes drawn: the nearest frame's, moved with the head
            near = [j for j in sorted(range(len(frames)), key=lambda j: abs(j - i)) if found[j]]
            if not near:
                continue
            eyes = found[near[0]]
        dy, xs = eyes
        draw(f, top(f) + dy, xs)
        # what's left of glowing eyes: pale beside a pupil, otherwise the skin next to it
        r_, g_, b_ = (f[..., k].astype(int) for k in range(3))
        for y, x in zip(*np.nonzero((b_ > r_ + 80) & (g_ > r_ + 60) & (f[..., 3] > 0))):
            beside = [f[y, x + d, :3] for d in (-1, 1, -2, 2) if 0 <= x + d < fw and skin(f[y:y + 1, x + d:x + d + 1])[0, 0]]
            f[y, x, :3] = WHITE if any((f[y, x + d, :3] == PUPIL).all() for d in (-1, 1)) else (beside[0] if beside else WHITE)
Image.fromarray(sheet).save(OUT, optimize=True)
print(f'{OUT}: eyes redrawn')
