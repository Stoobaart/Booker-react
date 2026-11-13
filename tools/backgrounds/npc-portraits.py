"""Talking portraits for the SOCO and the neighbour, like Frank's and Derek's: 15 frames of 80x96 in a strip, the
head and shoulders on the dark red circle, facing left towards Frank's. Only the mouth moves (the SOCO's mask, with
his jaw), and frame 5 blinks, in the same order as Derek's strip.
The circle is the existing portraits' own pixels where any of them shows it, and fitted ellipses under their heads.
Frank's angry strip had no blink, so it gets one: frame 5 with its eyes shut like his regular strip's, under his
angry brows.
Prints where each strip's eyes are (what changes in frame 5), for the game's blinking (`eyes` in its data).
Usage: npc-portraits.py <the existing portraits' folder> <out folder>"""
import json
import sys
import numpy as np
from PIL import Image, ImageDraw

SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 80, 96
# mouth shape per frame: closed, half, wide, small; frame 5 blinks
MOUTHS = ['closed', 'half', 'wide', 'small', 'half', 'half', 'wide', 'small',
          'closed', 'wide', 'small', 'half', 'wide', 'small', 'half']
BLINK = 5

RINGS = [(34, 0, 0), (58, 0, 0), (75, 0, 0), (97, 0, 0)]   # inside out
Y, X = np.mgrid[0:H, 0:W] + 0.5


def ellipse(cx, cy, rx, ry):
    return ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2 <= 1


def circle():
    """The ring index (0 inside .. 3 the rim, -1 outside) of every pixel."""
    rings = np.full((H, W), -1)
    for k, (sx, sy) in enumerate([(0, 0), (1.5, 0.5), (4, 2), (7, 5.5)]):
        cy = 61.5 - (0.5 if k else 0)
        rings[ellipse(40, cy, 41 - sx, 34.5 - sy)] = 3 - k
    shown = [np.asarray(Image.open(f'{SRC}/{name}.png').convert('RGBA'))[:, :W]
             for name in ('portrait-derek', 'portrait-frank-regular', 'portrait-frank-angry')]
    # where it ends from Frank's: Derek's is cut away under his cap's brim
    for a in shown[1:]:
        rings[a[..., 3] == 0] = -1
    for a in shown:
        for k, c in enumerate(RINGS):
            rings[(a[..., :3] == c).all(-1) & (a[..., 3] > 0)] = k
    return rings


RING = circle()
# the figure shows inside the rim's two outer rings, and above them only where its head is
SHOWS = (RING >= 0) & (RING < 2) | (Y < 46)


class Canvas:
    def __init__(self):
        self.im = Image.new('RGBA', (W, H))
        self.d = ImageDraw.Draw(self.im)

    def poly(self, pts, c):
        self.d.polygon(pts, fill=c)

    def line(self, pts, c):
        self.d.line(pts, fill=c, width=1)

    def px(self, pts, c):
        for p in pts:
            self.d.point(p, fill=c)

    def rect(self, x0, y0, x1, y1, c):
        self.d.rectangle((x0, y0, x1, y1), fill=c)


# ---------------------------------------------------------------------------------------------------------------
# The neighbour: long auburn hair down over her ears, a cream fisherman's jumper, lipstick

N = dict(
    hair_dk=(73, 35, 23), hair=(116, 59, 35), hair_md=(163, 89, 54), hair_lt=(209, 121, 76),
    skin_lt=(240, 202, 170), skin=(224, 178, 140), skin_sh=(192, 140, 106), skin_dk=(156, 104, 78),
    knit_lt=(249, 234, 210), knit=(232, 210, 178), knit_sh=(202, 172, 138), knit_dk=(164, 132, 102),
    line=(48, 24, 18), white=(236, 224, 210), iris=(92, 118, 84), lid=(170, 120, 120),
    lip=(184, 86, 88), lip_dk=(124, 48, 54), mouth=(70, 22, 26), teeth=(236, 224, 210),
    paper=(240, 236, 228), paper_sh=(196, 190, 182), filter=(214, 150, 84), filter_sh=(170, 110, 58),
    ash=(132, 126, 122), ember=(196, 64, 36), ember_lt=(246, 132, 52), ember_hot=(255, 214, 128),
    smoke_lt=(226, 228, 232), smoke=(184, 188, 198),
)


def neighbour(mouth, blink=False, eyes=None, hand=None, glow=0, smoke=None):
    """Her portrait. For a drag on her cigarette: `eyes` 'half' while she draws on it, `hand` how far (right, down) her
    hand is from her lips (None: not up), `glow` how bright the cigarette's end burns, `smoke` how far the puff she breathes
    out has drifted."""
    eyes = eyes or ('shut' if blink else 'open')
    c = Canvas()
    p = N
    # hair behind her head and shoulders: shows past her face on both sides, down to her shoulders
    c.poly([(16, 22), (28, 11), (48, 9), (62, 16), (68, 30), (70, 50), (71, 70), (68, 86), (60, 90), (54, 76),
            (26, 72), (20, 84), (12, 86), (9, 74), (10, 54), (12, 36)], p['hair'])
    for pts in ([(14, 40), (12, 50), (14, 60), (11, 70), (13, 80)],          # waves down the far side
                [(18, 46), (16, 56), (18, 66), (16, 76), (18, 84)]):
        c.line(pts, p['hair_dk'])
    c.line([(13, 44), (11, 52), (12, 58)], p['hair_md'])
    c.line([(12, 66), (10, 72)], p['hair_md'])
    for pts in ([(62, 30), (66, 42), (64, 54), (67, 66), (65, 78)],          # and behind her ear
                [(58, 50), (60, 62), (58, 72)]):
        c.line(pts, p['hair_dk'])
    c.line([(66, 34), (68, 46), (66, 56)], p['hair_md'])

    # jumper: sloping shoulders, cables down the front
    c.poly([(0, 96), (2, 88), (12, 80), (24, 76), (52, 76), (64, 80), (76, 88), (80, 96)], p['knit'])
    c.poly([(56, 77), (64, 80), (76, 88), (80, 96), (60, 96), (58, 86)], p['knit_sh'])
    for x, y0 in ((10, 84), (18, 82), (30, 88), (44, 88), (66, 86)):
        for y in range(y0, 96, 4):
            c.px([(x, y), (x + 1, y + 1), (x + 1, y + 2), (x, y + 3)], p['knit_sh'] if x < 56 else p['knit_dk'])
            c.px([(x + 3, y), (x + 2, y + 1), (x + 2, y + 2), (x + 3, y + 3)], p['knit_sh'] if x < 56 else p['knit_dk'])

    # crew neck: its back, inside, shows either side of her neck
    c.d.ellipse((25, 72, 51, 86), fill=p['knit_sh'])
    c.d.ellipse((28, 74, 48, 84), fill=p['knit_dk'])
    # neck, going down into it; in her jaw's shadow at the top
    c.poly([(30, 62), (46, 60), (48, 82), (28, 82)], p['skin'])
    c.poly([(41, 60), (46, 60), (48, 82), (42, 82)], p['skin_sh'])
    c.poly([(29, 70), (38, 70), (44, 64), (47, 64), (47, 70), (39, 75), (29, 75)], p['skin_sh'])
    c.poly([(41, 71), (47, 66), (47, 73), (42, 75)], p['skin_dk'])
    # the collar's front: a thick ribbed band round the front of her neck, in shade where it folds in
    c.d.arc((25, 72, 51, 86), 0, 180, fill=p['knit_lt'], width=4)
    for x in range(28, 50, 2):
        top = 79 + round(4 * (1 - ((x - 38) / 13) ** 2) ** 0.5)
        c.px([(x, top), (x, top + 1)], p['knit'])
    c.d.arc((28, 75, 48, 83), 10, 170, fill=p['knit_sh'], width=1)
    c.d.arc((25, 72, 51, 86), 0, 45, fill=p['knit_sh'], width=4)

    # face. Her far side on the left: forehead, brow, cheek, chin; then the jaw back under her hair
    c.poly([(30, 25), (46, 26), (50, 32), (52, 44), (51, 54), (48, 60), (44, 65), (38, 69), (32, 71), (26, 71),
            (23, 68), (21, 63), (20, 57), (19, 50), (20, 44), (20, 38), (21, 33), (23, 28)], p['skin'])
    # shade: the side of her face by the hair
    c.poly([(46, 28), (50, 32), (52, 44), (51, 54), (48, 60), (46, 60), (47, 52), (48, 42)], p['skin_sh'])
    # nose, between her eyes like Frank's: a shade down its far side, its tip, the nostrils and a shadow under it
    c.px([(27, 44), (26, 45), (26, 46), (26, 47), (26, 48), (25, 49), (25, 50), (25, 51), (25, 52), (24, 53)],
         p['skin_sh'])
    c.px([(27, 47), (27, 48), (26, 49), (26, 50), (26, 51), (26, 52)], p['skin_lt'])
    c.px([(28, 53), (29, 53), (30, 54)], p['skin_sh'])
    c.px([(23, 54), (24, 54), (25, 55), (26, 55), (27, 55), (28, 55), (29, 55)], p['skin_dk'])
    c.px([(22, 55), (23, 55), (24, 55)], p['skin_sh'])
    c.px([(26, 66), (27, 66), (28, 67)], p['skin_sh'])                            # under the lip

    # the hair's shadow: a soft band under the fringe, darker against it with a few strand tips; and down her cheek
    fringe = [(48, 20), (46, 27), (40, 30), (32, 32), (26, 35), (22, 40), (19, 46)]
    for dy, colour in ((4, 'skin_sh'), (3, 'skin_sh'), (2, 'skin_sh'), (1, 'skin_dk')):
        c.line([(x, y + dy) for x, y in fringe], p[colour])
    c.px([(43, 30), (43, 31), (36, 33), (36, 34), (29, 35), (29, 36), (24, 39), (24, 40)], p['skin_dk'])
    c.px([(45, 33), (38, 35), (33, 37), (27, 38)], p['skin_sh'])
    c.line([(47, 30), (47, 36), (48, 46), (48, 56), (46, 64)], p['skin_dk'])
    c.line([(46, 32), (46, 36), (47, 44)], p['skin_dk'])
    c.px([(45, 38), (46, 48), (46, 49), (45, 58)], p['skin_sh'])

    # hair over the top of her head, and down over her ear on the near side to her shoulder
    c.poly([(15, 40), (15, 30), (19, 21), (27, 14), (38, 10), (50, 11), (59, 16), (64, 24), (66, 36), (67, 50),
            (66, 64), (63, 76), (58, 84), (52, 80), (49, 72), (47, 64), (49, 56), (49, 46), (48, 36), (44, 28),
            (36, 28), (28, 29), (23, 33), (21, 38), (19, 44)], p['hair_md'])
    c.poly([(50, 11), (59, 16), (64, 24), (66, 36), (67, 50), (66, 64), (63, 76), (58, 84), (60, 70), (60, 52),
            (58, 34), (56, 22)], p['hair'])
    # the sweep of her fringe: from a parting over her near eye, across her forehead, round past her far temple
    c.poly([(47, 12), (48, 20), (46, 27), (40, 30), (32, 32), (26, 35), (22, 40), (19, 46), (16, 46), (15, 38),
            (17, 28), (22, 20), (30, 14), (40, 10)], p['hair_md'])
    c.poly([(40, 11), (44, 14), (40, 18), (32, 22), (25, 28), (20, 36), (18, 42), (16, 40), (17, 30), (22, 21),
            (30, 14)], p['hair_lt'])
    for pts in ([(46, 14), (45, 21), (40, 26), (32, 29), (25, 33), (21, 39)],      # strands in the sweep
                [(42, 13), (38, 20), (30, 25), (24, 31), (20, 37)],
                [(38, 12), (31, 16), (25, 22), (21, 28)]):
        c.line(pts, p['hair'])
    c.line([(47, 21), (44, 26), (38, 29), (30, 31), (24, 35), (21, 41)], p['hair_dk'])   # its edge, over her brow
    c.px([(46, 11), (47, 12), (48, 13)], p['hair_dk'])                            # the parting
    for pts in ([(51, 16), (54, 26), (53, 38), (55, 48), (53, 58), (55, 68), (54, 78)],     # waves down the near side
                [(56, 18), (59, 28), (58, 40), (61, 52), (59, 64), (61, 74)],
                [(61, 22), (64, 34), (63, 46), (65, 58)]):
        c.line(pts, p['hair_dk'])
    for pts in ([(49, 30), (51, 40), (50, 50), (52, 60), (51, 70)], [(57, 34), (56, 44), (58, 56)]):
        c.line(pts, p['hair_lt'])
    c.line([(48, 46), (48, 56), (47, 62)], p['hair_dk'])                                 # its edge against her cheek

    # and so it meets the hair everywhere: any skin straight under hair on her forehead is in its shadow
    under_hair(c, [p[k] for k in ('hair_dk', 'hair', 'hair_md', 'hair_lt')],
               [p[k] for k in ('skin_lt', 'skin', 'skin_sh')], p['skin_dk'], p['skin_sh'], bottom=46)

    # brows and eyes
    c.line([(21, 40), (24, 39)], p['hair'])
    c.line([(31, 40), (34, 39), (38, 39), (40, 40)], p['hair'])
    if eyes == 'shut':
        c.line([(21, 45), (25, 45)], p['line'])
        c.line([(32, 45), (39, 45)], p['line'])
    elif eyes == 'half':                                         # lids lowered, savouring it
        c.line([(21, 42), (25, 42)], p['lid'])
        c.line([(21, 43), (25, 43)], p['lid'])
        c.line([(21, 44), (25, 44)], p['line'])
        c.line([(21, 45), (25, 45)], p['white'])
        c.px([(22, 45), (24, 45)], p['iris'])
        c.px([(23, 45)], p['line'])
        c.line([(32, 42), (38, 42)], p['lid'])
        c.line([(31, 43), (39, 43)], p['lid'])
        c.line([(31, 44), (39, 44)], p['line'])
        c.line([(32, 45), (38, 45)], p['white'])
        c.px([(34, 45), (36, 45)], p['iris'])
        c.px([(35, 45)], p['line'])
    else:
        c.line([(21, 43), (25, 43)], p['line'])                  # far eye: as tall as the near one, narrower
        c.line([(21, 44), (25, 44)], p['white'])
        c.line([(21, 45), (25, 45)], p['white'])
        c.px([(22, 44), (24, 44), (22, 45), (24, 45)], p['iris'])  # the same pupil as the near eye's
        c.px([(23, 44), (23, 45)], p['line'])
        c.line([(21, 42), (25, 42)], p['lid'])
        c.line([(31, 43), (39, 43)], p['line'])                  # near eye
        c.line([(32, 44), (38, 44)], p['white'])
        c.line([(32, 45), (38, 45)], p['white'])
        c.px([(34, 44), (35, 44), (36, 44), (34, 45), (36, 45)], p['iris'])
        c.px([(35, 44), (35, 45)], p['line'])
        c.px([(39, 44)], p['line'])                              # lashes at the corner
        c.line([(32, 42), (38, 42)], p['lid'])                   # a little eyeshadow
    c.line([(33, 46), (38, 46)], p['skin_sh'])
    c.line([(21, 46), (25, 46)], p['skin_sh'])
    lips_neighbour(c, mouth)
    if hand is not None:
        arm = Image.new('RGBA', (W, H))
        arm.alpha_composite(cigarette_hand(glow, wisp=hand != (0, 0)), hand)
        cast_shadow(c, np.asarray(arm)[..., 3] > 0)
        c.im.alpha_composite(arm)
    if smoke is not None:
        exhaled(c, smoke)
    return c.im


def cast_shadow(c, shape):
    """The shadow her hand throws on her face, the light being on the left: just to its right and below it."""
    p = N
    a = np.asarray(c.im)
    face = np.any([(a[..., :3] == p[k]).all(-1) for k in ('skin_lt', 'skin')], axis=0)
    shadow = np.zeros_like(shape)
    for dx, dy in ((1, 0), (2, 0), (1, 1), (2, 1)):
        shadow[dy:, dx:] |= shape[:H - dy, :W - dx]
    for y, x in zip(*np.nonzero(shadow & ~shape & face)):
        c.d.point((int(x), int(y)), fill=p['skin_sh'])


def cigarette_hand(glow, wisp):
    """Her right hand at her lips, as in a photo of a woman smoking: the first two fingers long and straight up side
    by side, the cigarette between them below their tips, angled up and out from her lips (behind the near finger,
    in front of the far one); the other two curled in below, the thumb curving up along her jaw; her sleeve down to
    the bottom of the circle. Smooth skin, lit down its near edges and shaded down the far ones, outlined like the
    portraits' other contours so it stands out from her face. Moved down and right to raise or lower it, up out of the middle of the circle."""
    c = Canvas()
    p = N
    lit, base, shade = p['skin_lt'], p['skin'], p['skin_sh']
    # sleeve, up out of the bottom of the circle to a ribbed cuff; edged in shade against her jumper
    c.poly([(8, 96), (10, 91), (26, 91), (29, 96)], p['knit'])
    c.poly([(22, 91), (26, 91), (29, 96), (23, 96)], p['knit_sh'])
    c.poly([(11, 86), (25, 86), (26, 91), (10, 91)], p['knit_lt'])
    for x in range(12, 26, 2):
        c.px([(x, 87), (x, 88), (x, 89), (x, 90)], p['knit'])
    c.line([(10, 91), (26, 91)], p['knit_dk'])
    c.line([(11, 85), (25, 85)], p['knit_dk'])
    c.line([(26, 86), (26, 91)], p['knit_dk'])
    # the back of her hand, broad at the knuckles, narrowing to the wrist
    c.poly([(12, 70), (23, 69), (25, 73), (24, 80), (22, 85), (14, 85), (12, 80), (11, 74)], base)
    c.poly([(12, 71), (16, 70), (15, 78), (13, 84), (12, 80), (11, 74)], lit)      # the light down its far side
    c.poly([(20, 70), (23, 69), (25, 73), (24, 80), (22, 85), (19, 85), (21, 78)], shade)
    # the two fingers she isn't using, curled in below the others on the far side
    c.poly([(10, 64), (13, 63), (14, 66), (14, 70), (11, 71), (9, 68)], shade)
    c.poly([(10, 70), (13, 70), (14, 74), (11, 75), (9, 73)], shade)
    c.px([(11, 64), (12, 64), (10, 65), (11, 70), (12, 70)], base)
    # the thumb, curving up along her jaw
    c.poly([(22, 79), (24, 75), (26, 72), (28, 71), (29, 72), (27, 75), (25, 79), (23, 81)], shade)
    c.px([(27, 71), (28, 71)], base)
    # the first two fingers, long and straight up, rounded at the tips
    c.poly([(14, 56), (15, 55), (16, 55), (17, 56), (17, 71), (14, 71)], base)
    c.line([(14, 56), (14, 70)], lit)
    c.poly([(18, 58), (19, 57), (20, 57), (21, 58), (21, 71), (18, 71)], base)
    c.line([(21, 59), (21, 70)], shade)
    c.line([(19, 58), (19, 70)], lit)
    c.line([(17, 57), (17, 70)], shade)
    c.line([(18, 58), (18, 71)], p['skin_dk'])                                      # where they meet
    # the cigarette, from her lips up and out between the fingers
    line = [(25 - i, 61 - round(i * 9 / 17)) for i in range(18)]
    for i, (x, y) in enumerate(line):
        if 18 <= x <= 21:
            continue                                                                # behind the near finger
        top, under = ('filter', 'filter_sh') if i < 3 else ('paper', 'paper_sh')
        c.px([(x, y)], p[top])
        c.px([(x, y + 1)], p[under])
    end = {0: ('ash', 'ash'), 1: ('ember', 'ash'), 2: ('ember_lt', 'ember'), 3: ('ember_hot', 'ember_lt')}[glow]
    x, y = line[-1][0] - 1, line[-1][1]
    c.px([(x, y)], p[end[0]])
    c.px([(x, y + 1)], p[end[1]])
    if glow >= 2:
        c.px([(x - 1, y), (x - 1, y + 1)], p['ember'])
    if wisp:                                                     # a thread of smoke off the end as it moves
        c.px([(x, y - 2), (x - 1, y - 3), (x, y - 4), (x + 1, y - 5), (x, y - 6)], p['smoke'])
    # an outline: dark on its shadow side (right and below), softer on its lit side
    a = np.asarray(c.im)
    solid = a[..., 3] > 0
    skin = np.any([(a[..., :3] == col).all(-1) for col in (lit, base, shade)], axis=0)
    dark, soft = np.zeros_like(solid), np.zeros_like(solid)
    dark[:-1] |= skin[:-1] & ~solid[1:]
    dark[:, :-1] |= skin[:, :-1] & ~solid[:, 1:]
    soft[1:] |= skin[1:] & ~solid[:-1]
    soft[:, 1:] |= skin[:, 1:] & ~solid[:, :-1]
    for mask, colour in ((soft & ~dark, shade), (dark, p['skin_dk'])):
        for y, x in zip(*np.nonzero(mask)):
            c.d.point((int(x), int(y)), fill=colour)
    return c.im


def exhaled(c, stage):
    """The puff she breathes out: a few round clouds from her lips, out in front and up, spreading and thinning."""
    p = N
    rng = np.random.default_rng(stage)
    clouds = [  # (x, y, radius) per stage
        [(23, 62, 1)],
        [(21, 61, 2), (23, 62, 1)],
        [(18, 59, 2), (21, 58, 2), (16, 61, 1)],
        [(15, 56, 3), (19, 54, 2), (13, 59, 2)],
        [(12, 52, 3), (17, 50, 3), (11, 56, 2)],
    ][stage]
    thin = [0, 0, 0.15, 0.35, 0.55][stage]
    for cx, cy, r in clouds:
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r and rng.random() >= thin:
                    lit = y < cy or stage >= 4
                    c.d.point((x, y), fill=p['smoke_lt'] if lit else p['smoke'])


def under_hair(c, hair, skin, dark, shade, bottom):
    """Skin right under hair, above row `bottom`, takes the dark shade, and plain skin under that the lighter one."""
    a = np.asarray(c.im)[..., :3]
    def match(cols):
        return np.any([(a == col).all(-1) for col in cols], axis=0)
    is_hair, is_skin = match(hair), match(skin)
    first = np.zeros_like(is_skin)
    first[1:bottom] = is_skin[1:bottom] & is_hair[:bottom - 1]
    second = np.zeros_like(is_skin)
    second[1:bottom] = first[:bottom - 1] & is_skin[1:bottom]
    second &= ~match([shade])
    for (y, x) in zip(*np.nonzero(first)):
        c.d.point((int(x), int(y)), fill=dark)
    for (y, x) in zip(*np.nonzero(second)):
        c.d.point((int(x), int(y)), fill=shade)


def lips_neighbour(c, mouth):
    p = N
    if mouth == 'closed':
        c.px([(26, 61), (27, 61), (29, 61), (30, 61)], p['lip'])
        c.line([(25, 62), (32, 62)], p['lip_dk'])
        c.line([(26, 63), (31, 63)], p['lip'])
    elif mouth == 'small':
        c.px([(26, 61), (27, 61), (29, 61), (30, 61)], p['lip'])
        c.line([(25, 62), (32, 62)], p['lip_dk'])
        c.line([(27, 63), (30, 63)], p['mouth'])
        c.line([(26, 64), (31, 64)], p['lip'])
    elif mouth == 'half':
        c.px([(26, 61), (27, 61), (29, 61), (30, 61)], p['lip'])
        c.line([(25, 62), (32, 62)], p['lip_dk'])
        c.line([(26, 63), (31, 63)], p['teeth'])
        c.line([(26, 64), (31, 64)], p['mouth'])
        c.line([(26, 65), (31, 65)], p['lip'])
    elif mouth == 'pursed':                                      # round the filter
        c.line([(25, 61), (29, 61)], p['lip'])
        c.line([(25, 62), (30, 62)], p['lip_dk'])
        c.line([(25, 63), (29, 63)], p['lip'])
        c.px([(26, 64), (27, 64)], p['lip'])
    elif mouth == 'puff':                                        # a small round O, blowing it out
        c.line([(25, 61), (29, 61)], p['lip'])
        c.px([(25, 62), (29, 62), (25, 63), (29, 63)], p['lip'])
        c.px([(26, 62), (27, 62), (28, 62), (26, 63), (27, 63), (28, 63)], p['mouth'])
        c.line([(25, 64), (29, 64)], p['lip'])
    else:   # wide
        c.px([(26, 60), (27, 60), (29, 60), (30, 60)], p['lip'])
        c.line([(25, 61), (32, 61)], p['lip_dk'])
        c.line([(26, 62), (31, 62)], p['teeth'])
        c.rect(25, 63, 32, 65, p['mouth'])
        c.line([(26, 66), (31, 66)], p['lip'])
        c.px([(25, 66), (32, 66)], p['lip_dk'])


# ---------------------------------------------------------------------------------------------------------------
# The SOCO: the white suit's hood drawn tight round his face, a blue mask over his nose and mouth, the camera's strap

S = dict(
    suit_lt=(232, 238, 238), suit=(188, 200, 208), suit_sh=(132, 146, 160), suit_dk=(92, 104, 118),
    skin_lt=(198, 142, 108), skin=(172, 118, 88), skin_sh=(140, 92, 66), skin_dk=(108, 68, 48),
    brow=(60, 38, 26), line=(24, 28, 32), white=(234, 224, 214), iris=(70, 46, 32),
    mask_lt=(96, 196, 228), mask=(44, 124, 204), mask_sh=(28, 78, 150), strap=(24, 28, 32), strap_lt=(64, 70, 78),
)


def soco(mouth, blink):
    c = Canvas()
    p = S
    drop = {'closed': 0, 'small': 1, 'half': 1, 'wide': 2}[mouth]
    # suit: shoulders, the zip, the camera's strap across his chest
    c.poly([(2, 96), (4, 84), (16, 76), (30, 72), (50, 72), (64, 78), (76, 86), (78, 96)], p['suit_lt'])
    c.poly([(48, 74), (64, 78), (76, 86), (78, 96), (58, 96), (54, 84)], p['suit'])
    c.poly([(66, 82), (76, 86), (78, 96), (70, 96)], p['suit_sh'])
    c.line([(38, 78), (38, 96)], p['suit_sh'])
    c.line([(39, 78), (39, 96)], p['suit'])
    c.line([(14, 84), (18, 92)], p['suit'])                     # creases
    c.line([(26, 80), (28, 88)], p['suit'])
    c.poly([(54, 72), (60, 74), (30, 96), (22, 96)], p['strap'])
    c.line([(55, 73), (25, 96)], p['strap_lt'])
    # hood: round his head, back down to his shoulders
    c.poly([(20, 30), (24, 16), (34, 10), (48, 10), (60, 16), (66, 28), (68, 44), (66, 62), (60, 74), (48, 78),
            (30, 76), (20, 70), (16, 56), (16, 42)], p['suit_lt'])
    c.poly([(48, 12), (60, 16), (66, 28), (68, 44), (66, 62), (60, 74), (48, 78), (56, 64), (60, 44), (58, 26)],
           p['suit'])
    c.poly([(62, 40), (68, 44), (66, 62), (60, 74), (54, 76), (60, 62)], p['suit_sh'])
    c.line([(50, 30), (54, 44), (52, 58)], p['suit'])          # a fold down the side of the hood
    # face, in the hood's opening
    c.poly([(23, 32), (30, 27), (42, 26), (48, 30), (50, 40), (50, 56), (46, 66), (36, 70), (28, 70), (22, 66),
            (20, 58), (19, 50), (21, 40)], p['skin'])
    c.poly([(40, 28), (48, 30), (50, 40), (50, 56), (46, 50), (44, 38)], p['skin_sh'])
    c.poly([(23, 33), (31, 29), (32, 37), (24, 39)], p['skin_lt'])
    # the hood's elastic edge
    c.line([(23, 31), (30, 26), (42, 25), (49, 29), (51, 40), (51, 56), (47, 67), (36, 71), (27, 71), (21, 67),
            (19, 58), (18, 50), (20, 40), (23, 31)], p['suit_sh'])
    c.line([(24, 30), (30, 25), (42, 24), (50, 28)], p['suit'])
    # nose bridge, above the mask, between his eyes like Frank's
    c.px([(28, 43), (28, 44), (27, 45), (27, 46)], p['skin_sh'])
    # mask: over his nose and mouth, his face turned a little to the left: from his far cheek, round the front of his
    # face, to his near cheek, where its straps cross to the hood and go under it; it moves with his jaw
    top, bottom = 48, 69 + drop
    c.poly([(20, top + 1), (24, top), (27, top - 1), (31, top), (36, top + 1), (40, top + 2), (41, top + 7),
            (41, bottom - 9), (39, bottom - 3), (34, bottom), (28, bottom + 1), (23, bottom - 1), (20, bottom - 6),
            (19, top + 7)], p['mask'])
    c.poly([(20, top + 1), (23, top + 1), (22, top + 8), (22, bottom - 4), (20, bottom - 6), (19, top + 7)],
           p['mask_lt'])                                                         # the far side, in the light
    c.poly([(37, top + 2), (40, top + 2), (41, top + 7), (41, bottom - 9), (39, bottom - 3), (36, bottom - 1),
            (38, bottom - 8), (38, top + 7)], p['mask_sh'])                      # turning away on his near cheek
    c.line([(20, top + 1), (24, top), (27, top - 1), (31, top), (36, top + 1), (40, top + 2)], p['mask_sh'])
    c.px([(27, top), (26, top + 2), (26, top + 3), (25, top + 5)], p['mask_lt'])  # his nose under it
    c.px([(25, top + 6), (26, top + 7), (27, top + 7), (28, top + 7)], p['mask_sh'])
    # pleats, sloping with his face; they open out as his jaw drops
    gap = 4 + drop
    for y in (top + 9, top + 9 + gap):
        c.line([(23, y), (30, y), (37, y + 1)], p['mask_sh'])
    if mouth == 'wide':
        c.line([(26, bottom - 5), (31, bottom - 4)], p['mask_sh'])            # his mouth open, under the cloth
    # the elastic straps, across his cheek and under the hood, with a little shadow under each
    for (x0, y0), (x1, y1) in (((41, top + 3), (50, top - 1)), ((40, bottom - 6), (49, bottom - 10))):
        c.line([(x0, y0 + 1), (x1, y1 + 1)], p['skin_sh'])
        c.line([(x0, y0), (x1, y1)], (232, 236, 240))
    # brows and eyes
    c.line([(21, 39), (25, 38)], p['brow'])
    c.line([(31, 38), (39, 38)], p['brow'])
    c.px([(31, 39), (38, 37)], p['brow'])
    if blink:
        c.line([(22, 43), (25, 43)], p['line'])
        c.line([(32, 43), (38, 43)], p['line'])
    else:
        c.line([(22, 41), (25, 41)], p['line'])
        c.px([(22, 42), (25, 42)], p['white'])
        c.px([(23, 42), (24, 42)], p['iris'])
        c.px([(23, 43), (24, 43)], p['line'])
        c.line([(31, 41), (38, 41)], p['line'])
        c.line([(32, 42), (37, 42)], p['white'])
        c.line([(32, 43), (37, 43)], p['white'])
        c.px([(34, 42), (35, 42), (34, 43)], p['iris'])
        c.px([(35, 43)], p['line'])
        c.px([(38, 42)], p['line'])
    c.line([(32, 44), (37, 44)], p['skin_sh'])
    return c.im


# ---------------------------------------------------------------------------------------------------------------

def frame(figure):
    out = np.zeros((H, W, 4), np.uint8)
    for k, colour in enumerate(RINGS):
        out[RING == k] = (*colour, 255)
    fig = np.asarray(figure)
    on = (fig[..., 3] > 0) & SHOWS
    out[on] = fig[on]
    return out


for name, draw in (('soco', soco), ('neighbour', neighbour)):
    strip = np.concatenate([frame(draw(m, i == BLINK)) for i, m in enumerate(MOUTHS)], axis=1)
    Image.fromarray(strip).save(f'{OUT}/portrait-{name}.png')
    # a big preview: the first frames, the blink and each mouth
    big = Image.fromarray(np.concatenate([strip[:, i * W:(i + 1) * W] for i in (0, 1, 2, 3, BLINK)], axis=1))
    bg = Image.new('RGBA', big.size, (60, 60, 60, 255))
    bg.alpha_composite(big)
    bg.resize((big.width * 4, big.height * 4), Image.NEAREST).save(f'{OUT}/portrait-{name}.big.png')


def frank_angry_blink():
    """Frame 5 of his angry strip with his eyes shut: the lids from his regular blink, the whites and pupil that his
    angry eyes show above them closed over too."""
    reg = np.asarray(Image.open(f'{SRC}/portrait-frank-regular.png').convert('RGBA'))
    strip = np.asarray(Image.open(f'{SRC}/portrait-frank-angry.png').convert('RGBA')).copy()
    shut, opened = reg[:, BLINK * W:(BLINK + 1) * W], reg[:, :W]
    f = strip[:, BLINK * W:(BLINK + 1) * W]
    lids = (shut != opened).any(-1)
    lids[:42] = lids[44:] = False
    f[lids] = shut[lids]
    lid = (197, 164, 149, 255)
    for y in (40, 41):
        for x in range(36, 66):
            r, g, b, _ = f[y, x]
            if r == g == b and r in (197, 219):
                f[y, x] = lid
    f[41, 59] = f[41, 60] = lid                                 # his far pupil
    return strip


def eyes(strip):
    """A box round each eye: the pixels that change in frame 5, grouped by the gap between the eyes."""
    changed = (strip[:, BLINK * W:(BLINK + 1) * W] != strip[:, :W]).any(-1)
    changed[H // 2 + 8:] = False                                # the mouth's below
    cols = np.nonzero(changed.any(0))[0]
    groups = []
    for x in cols:
        if groups and x - groups[-1][-1] <= 2:
            groups[-1].append(x)
        else:
            groups.append([x])
    boxes = []
    for g in groups:
        rows = np.nonzero(changed[:, g[0]:g[-1] + 1].any(1))[0]
        boxes.append(dict(x=int(g[0]), y=int(rows.min()), width=int(g[-1] - g[0] + 1),
                          height=int(rows.max() - rows.min() + 1)))
    return boxes


angry = frank_angry_blink()
Image.fromarray(angry).save(f'{OUT}/portrait-frank-angry.png')
print(json.dumps({name: eyes(np.asarray(Image.open(f'{OUT}/portrait-{name}.png').convert('RGBA')))
                  for name in ('soco', 'neighbour', 'frank-angry')}, indent=1))

# The neighbour's drag on her cigarette, played now and then when she isn't talking: her hand comes up from the
# bottom of the circle, she draws on it (the end glowing, her eyes half shut), lowers it, and blows the smoke out.
# It starts and ends on her portrait's first frame, so it goes back to that without a jump.
DRAG = [
    dict(mouth='closed'),
    dict(mouth='closed', hand=(14, 30), glow=0),
    dict(mouth='closed', hand=(9, 20), glow=0),
    dict(mouth='closed', hand=(4, 11), glow=0),
    dict(mouth='closed', hand=(1, 4), glow=0),
    dict(mouth='pursed', hand=(0, 0), glow=1),
    dict(mouth='pursed', hand=(0, 0), glow=2, eyes='half'),
    dict(mouth='pursed', hand=(0, 0), glow=3, eyes='half'),
    dict(mouth='pursed', hand=(0, 0), glow=3, eyes='half'),
    dict(mouth='pursed', hand=(0, 0), glow=2, eyes='half'),
    dict(mouth='closed', hand=(1, 4), glow=1),
    dict(mouth='closed', hand=(4, 11), glow=1),
    dict(mouth='closed', hand=(9, 20), glow=0),
    dict(mouth='closed', hand=(14, 30), glow=0),
    dict(mouth='puff', smoke=0),
    dict(mouth='puff', smoke=1),
    dict(mouth='small', smoke=2),
    dict(mouth='closed', smoke=3),
    dict(mouth='closed', smoke=4),
    dict(mouth='closed'),
]
drag = np.concatenate([frame(neighbour(**f)) for f in DRAG], axis=1)
Image.fromarray(drag).save(f'{OUT}/portrait-neighbour-drag.png')
