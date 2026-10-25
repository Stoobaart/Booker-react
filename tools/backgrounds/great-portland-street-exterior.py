"""Great Portland Street exterior: photo -> cleaned, night-lit, pixelated 1920x980 background."""
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PHOTO, CURRENT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
rng = np.random.default_rng(7)
SUP = '/System/Library/Fonts/Supplemental/'

photo = cv2.imread(PHOTO)  # BGR
cur = cv2.imread(CURRENT)
img = photo.copy()


# ============ A. Clean-up and rebuild, in photo coordinates ============
def tile(src, dst):
    sx0, sy0, sx1, sy1 = src
    dx0, dy0, dx1, dy1 = dst
    patch = img[sy0:sy1, sx0:sx1].copy()
    ph, pw = patch.shape[:2]
    for y in range(dy0, dy1, ph):
        for x in range(dx0, dx1, pw):
            h, w = min(ph, dy1 - y), min(pw, dx1 - x)
            img[y:y + h, x:x + w] = patch[:h, :w]


def mirror(src_x0, src_x1, y0, y1, dst_x0):
    patch = img[y0:y1, src_x0:src_x1][:, ::-1].copy()
    img[y0:y1, dst_x0:dst_x0 + patch.shape[1]] = patch


def median(rect, im=None):
    x0, y0, x1, y1 = rect
    return np.median((img if im is None else im)[y0:y1, x0:x1].reshape(-1, 3), axis=0)


def rect(r, colour, noise=0.03):
    x0, y0, x1, y1 = r
    n = 1 + rng.normal(0, noise, (y1 - y0, x1 - x0, 1))
    img[y0:y1, x0:x1] = np.clip(np.array(colour) * n, 0, 255)


def hline(x0, x1, y, colour):
    img[y, x0:x1] = colour


def vline(x, y0, y1, colour):
    img[y0:y1, x] = colour


stone = (median((255, 440, 400, 500)) + median((540, 440, 668, 500))) / 2
mortar = stone * 0.8


def ashlar(x0, y0, x1, y1, row_h=12, block_w=34, oy=466, colour=None, joint=None):
    colour = stone if colour is None else colour
    joint = colour * 0.8 if joint is None else joint
    for y in range(y0, y1):
        r = (y - oy) // row_h
        off = (block_w // 2) * (r % 2)
        for x in range(x0, x1):
            bi = (x + off) // block_w
            if (y - oy) % row_h == 0 or (x + off) % block_w == 0:
                img[y, x] = joint
            elif (y - oy) % row_h == 1:
                img[y, x] = np.clip(colour * 1.1, 0, 255)
            elif (y - oy) % row_h == row_h - 1 or (x + off) % block_w == block_w - 1:
                img[y, x] = colour * 0.9
            else:
                shade = 1 + ((hash((r, bi)) % 9) - 4) * 0.03
                img[y, x] = np.clip(colour * (shade + rng.normal(0, 0.025)), 0, 255)


# keep these lamp brackets from the photo while the wall round them is rebuilt
lamp_l = photo[478:500, 328:372].copy()
lamp_r = photo[478:500, 576:604].copy()

# --- Station frontage (x 252-668, arch 425-512) ---
ashlar(262, 466, 396, 598)
ashlar(540, 466, 668, 598)
ashlar(396, 500, 425, 598)
ashlar(512, 500, 540, 598)
# arch: pole and parking sign on its right edge -> mirror the left side
mirror(392, 436, 372, 500, 500)
mirror(425, 436, 500, 656, 501)
# plinth course and a two-course dark base, only under the station
plinth_c, base_c = stone * 1.04, stone * 0.5
for x0, x1 in [(262, 425), (512, 668)]:
    ashlar(x0, 598, x1, 620, row_h=22, block_w=46, oy=598, colour=plinth_c)
    ashlar(x0, 620, x1, 656, row_h=18, block_w=58, oy=620, colour=base_c)
    hline(x0, x1, 598, stone * 0.6)
    hline(x0, x1, 599, stone * 1.15)     # lit top edge of the plinth
weather = cv2.GaussianBlur(rng.normal(0, 1, (190, 420)).astype(np.float32), (0, 0), 2.5)
weather = 1 + 0.07 * weather / weather.std()
for x0, x1 in [(262, 425), (512, 668)]:
    seg = img[466:656, x0:x1].astype(np.float32) * weather[:, x0 - 252:x1 - 252, None]
    seg *= np.linspace(1.0, 0.85, 190)[:, None, None]          # grime toward the pavement
    img[466:656, x0:x1] = np.clip(seg, 0, 255)
# pilaster between the minicab office and the station, down to the pavement
pil = median((252, 440, 262, 500))
rect((252, 500, 262, 656), pil)
vline(261, 500, 656, pil * 0.75)
img[495:512, 442:498] = median((440, 560, 500, 600))   # little box hanging in the arch

# --- Cafe (x 25-170): restore the front, door down to the step ---
frame = median((40, 530, 66, 600))
img[575:612, 150:172] = img[518:555, 150:172]          # where the pedestrian stood
tile((25, 560, 45, 588), (0, 588, 45, 656))            # corner pilaster / left edge
rect((40, 608, 116, 650), frame * 0.8)                 # stall riser
for px0, px1 in [(44, 76), (80, 112)]:                 # its two panels
    rect((px0, 613, px1, 645), frame * 0.55)
    hline(px0, px1, 645, frame * 1.0)
    vline(px1 - 1, 613, 646, frame * 1.0)
rect((116, 600, 166, 650), frame * 0.85)               # door: frame + bottom rail
rect((120, 604, 162, 646), frame * 0.62)               # kick panel
hline(120, 162, 604, frame * 0.4)
vline(141, 535, 646, frame * 0.5)                      # split of the double door
rect((166, 520, 172, 650), frame * 0.9)                # right-hand jamb
rect((36, 650, 172, 656), stone * 0.85)                # door step / sill

# --- Minicab office (x 172-252): deep doorway to the pavement ---
recess = median((215, 520, 248, 560))
rect((172, 506, 252, 650), recess, 0.06)
rect((182, 520, 244, 650), recess * 0.6, 0.06)         # door inside the recess
rect((188, 528, 238, 604), (120, 150, 150), 0.04)   # door glass (lit later)
vline(212, 525, 650, recess * 1.5)
rect((176, 650, 252, 656), stone * 0.8)

# awning lettering off
img[510:524, 42:166] = median((50, 503, 160, 512))

# --- Jeweller (x 710-845) ---
tile((718, 500, 752, 514), (718, 514, 752, 531))       # OPEN sign
tile((765, 578, 790, 610), (790, 578, 840, 610))       # window bottom (planter)
tile((765, 610, 790, 628), (790, 610, 846, 628))       # teal stall riser
tile((715, 628, 765, 656), (765, 628, 870, 656))       # step / ground line

# --- Right-hand columns (copy the pair left of the jeweller) and the deli ---
img[495:656, 845:881] = img[495:656, 668:704]
dframe = np.array([40, 48, 40], np.float64)            # dark green deli front
rect((881, 530, 924, 650), dframe)
rect((886, 536, 903, 600), (90, 120, 140))             # door glass (lit later)
rect((886, 602, 903, 646), dframe * 0.7)               # door panel
rect((907, 536, 924, 606), (90, 120, 140))             # window (lit later)
rect((907, 610, 924, 646), dframe * 0.75)              # stall riser
rect((881, 650, 924, 656), stone * 0.8)                # step

# --- Signs are repainted later; flatten the old ones so nothing shows through ---
def poly(pts, bgr):
    cv2.fillPoly(img, [np.array(pts, np.int32)], bgr)

poly([(366, 391), (553, 391), (553, 423), (366, 423)], (110, 30, 30))
poly([(292, 405), (343, 392), (343, 428), (292, 440)], (105, 28, 28))
poly([(556, 392), (650, 400), (650, 440), (556, 425)], (105, 28, 28))

# ============ B. Crop + scale into the layout, then night grade ============
X0, X1, Y0, BASE = 10, 924, 380, 656
W, BASE_Y = 1920, 572
SX, SY = W / (X1 - X0), BASE_Y / (BASE - Y0)
facade = cv2.resize(img[Y0:BASE, X0:X1], (W, BASE_Y), interpolation=cv2.INTER_AREA)


def R(x0, y0, x1, y1):
    return (int((x0 - X0) * SX), int((y0 - Y0) * SY), int((x1 - X0) * SX), int((y1 - Y0) * SY))


def lab(i):
    return cv2.cvtColor(i, cv2.COLOR_BGR2LAB).astype(np.float32)


src, ref = lab(facade), lab(cur[150:560])
out = np.empty_like(src)
for ch in range(3):
    out[..., ch] = ((src[..., ch] - src[..., ch].mean()) / (src[..., ch].std() + 1e-6)
                    * ref[..., ch].std() * (1.0 if ch == 0 else 0.5) + ref[..., ch].mean())
night = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)

f = facade.astype(np.float32)
bmask = ((f[..., 0] > f[..., 2] + 40) & (f[..., 0] > 60)).astype(np.float32)
bmask = cv2.GaussianBlur(bmask, (0, 0), 1.5)[..., None]
night = night * (1 - bmask) + f * 0.7 * bmask
facade_gray = cv2.cvtColor(facade, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255

# ============ C. Lights ============
WARM = np.array([70, 165, 235], np.float32)
PALE = np.array([120, 200, 235], np.float32)


def lit_window(r, colour, lo=0.15, hi=0.75, k=0.75, shelves=False):
    x0, y0, x1, y1 = R(*r)
    g = facade_gray[y0:y1, x0:x1][..., None]
    g = (g - g.min()) / (g.max() - g.min() + 1e-6)
    v = np.linspace(1.0, 0.7, y1 - y0)[:, None, None]      # brighter near the ceiling lights
    lit = colour * (lo + (hi - lo) * g ** 1.3) * v
    if shelves:
        for sy in range(y0 + 14, y1, 22):
            lit[sy - y0:sy - y0 + 3] *= 0.45
    night[y0:y1, x0:x1] = lit * k + night[y0:y1, x0:x1] * (1 - k)


lit_window((70, 527, 112, 607), WARM)                      # cafe window
lit_window((120, 538, 162, 600), WARM, 0.1, 0.6)           # cafe door glass
lit_window((764, 516, 837, 608), PALE, shelves=True)       # jeweller window
lit_window((726, 540, 758, 610), PALE, 0.08, 0.45)         # jeweller door
lit_window((188, 528, 238, 604), np.array([170, 215, 210], np.float32), 0.35, 0.55, shelves=True)  # minicab office
lit_window((886, 536, 903, 600), WARM, 0.35, 0.6)          # deli door
lit_window((907, 536, 924, 606), WARM, 0.4, 0.8, shelves=True)  # deli window

# arch: open doors onto the lit ticket hall (after the real entrance), drawn in perspective
ax0, ay0, ax1, ay1 = R(426, 470, 512, 656)
ly, lx = np.mgrid[ay0:ay1, ax0:ax1]
acx, spring, rx = (ax0 + ax1) / 2, ay0 + 95, (ax1 - ax0) / 2 - 2
inside = (np.abs(lx - acx) < rx) & ((ly > spring) | (((lx - acx) / rx) ** 2 + ((ly - spring) / 92.0) ** 2 < 1))
hall = Image.new('RGB', (ax1 - ax0, ay1 - ay0))
hd = ImageDraw.Draw(hall)
U, VP, EYE, CEIL = rx, (ay1 - ay0) - 2.07 * rx, 2.07, 4.6   # px per unit at the threshold; eye height


def S(X, Y, d):
    return (acx - ax0 + X * U / d, VP + (EYE - Y) * U / d)


def quad(pts, fill):
    hd.polygon([S(*p) for p in pts], fill=fill)


CREAM, TILE, BROWN, DARK = (150, 135, 105), (135, 122, 96), (70, 40, 28), (28, 22, 20)
hd.rectangle([0, 0, hall.width, hall.height], fill=(92, 82, 64))           # ceiling
for d in (1.7, 3.2):                                                          # ceiling beams
    quad([(-3, CEIL, d), (3, CEIL, d), (3, CEIL - 0.25, d), (-3, CEIL - 0.25, d)], (95, 84, 66))
quad([(-3, 0, 1), (3, 0, 1), (3, 0, 5.5), (-3, 0, 5.5)], TILE)                    # floor
for X in (-0.95, 0.95):                                                       # border lines
    quad([(X - 0.06, 0, 1), (X + 0.06, 0, 1), (X + 0.06, 0, 5.5), (X - 0.06, 0, 5.5)], BROWN)
for d in (1.45, 3.3):
    quad([(-3, 0, d), (3, 0, d), (3, 0, d + 0.12), (-3, 0, d + 0.12)], BROWN)
quad([(0, 0, 1.7), (0.6, 0, 2.3), (0, 0, 2.9), (-0.6, 0, 2.3)], BROWN)        # floor diamond
quad([(0, 0, 1.9), (0.35, 0, 2.3), (0, 0, 2.7), (-0.35, 0, 2.3)], CREAM)
quad([(0, 0, 2.1), (0.13, 0, 2.3), (0, 0, 2.5), (-0.13, 0, 2.3)], BROWN)
quad([(-3, 0, 5.5), (3, 0, 5.5), (3, CEIL, 5.5), (-3, CEIL, 5.5)], (140, 128, 102))  # back wall, white tiles
quad([(-3, 0, 5.5), (3, 0, 5.5), (3, 1.0, 5.5), (-3, 1.0, 5.5)], BROWN)
for X in (-0.75, 0.75):                                                       # passages to the platforms
    quad([(X - 0.35, 0, 5.5), (X + 0.35, 0, 5.5), (X + 0.35, 2.3, 5.5), (X - 0.35, 2.3, 5.5)], DARK)
for X in (-0.55, 0, 0.55):                                                    # ticket gates
    quad([(X - 0.13, 0, 3.9), (X + 0.13, 0, 3.9), (X + 0.13, 1.2, 3.9), (X - 0.13, 1.2, 3.9)], (95, 98, 100))
    quad([(X - 0.13, 1.0, 3.9), (X + 0.13, 1.0, 3.9), (X + 0.13, 1.2, 3.9), (X - 0.13, 1.2, 3.9)], (60, 62, 66))


def pillar(X, d, w=0.42):
    quad([(X - w / 2, 0, d), (X + w / 2, 0, d), (X + w / 2, CEIL, d), (X - w / 2, CEIL, d)], (160, 146, 116))
    quad([(X - w / 2, 0, d), (X + w / 2, 0, d), (X + w / 2, 0.6, d), (X - w / 2, 0.6, d)], BROWN)
    for y in (1.5, 2.7):
        quad([(X - w / 2, y, d), (X + w / 2, y, d), (X + w / 2, y + 0.18, d), (X - w / 2, y + 0.18, d)], BROWN)
    quad([(X - w * 0.7, CEIL - 0.45, d), (X + w * 0.7, CEIL - 0.45, d), (X + w * 0.7, CEIL - 0.2, d),
          (X - w * 0.7, CEIL - 0.2, d)], BROWN)                               # capital
    quad([(X + w / 2 - 0.08, 0.6, d), (X + w / 2, 0.6, d), (X + w / 2, CEIL - 0.45, d),
          (X + w / 2 - 0.08, CEIL - 0.45, d)], (110, 98, 78))                # shaded side


for d in (3.2, 1.7):                                                          # back to front
    pillar(-1.1, d, 0.5)
    pillar(1.1, d, 0.5)
glows = []
for d, ly_ in ((4.2, 3.2), (2.0, 3.8)):                                      # globe lamps
    cx_, cy_ = S(0, ly_, d)
    r = 0.26 * U / d
    hd.line([S(0, CEIL, d), (cx_, cy_)], fill=(60, 54, 44), width=2)
    hd.ellipse([cx_ - r, cy_ - r, cx_ + r, cy_ + r], fill=(235, 228, 200))
    glows.append((cx_, cy_, r))
hall_a = np.array(hall)[..., ::-1].astype(np.float32)
hh, hw = hall_a.shape[:2]
gyy, gxx = np.mgrid[0:hh, 0:hw].astype(np.float32)
for gx, gy, r in glows:
    hall_a += np.exp(-(((gxx - gx) ** 2 + (gyy - gy) ** 2) / (2 * (r * 1.8) ** 2)))[..., None] * np.array([25, 45, 60], np.float32)
# doormat grille at the threshold
for y in range(int(S(0, 0, 1.18)[1]), hh):
    hall_a[y] = (26, 26, 28) if y % 4 else (12, 12, 14)
hall_a *= 0.46 * np.linspace(0.75, 1.0, hh)[:, None, None]   # dimmed to the night palette
# the doors stand open against the jambs: blue leaves with yellow edges
for side in (-1, 1):
    ex = int(acx - ax0 + side * (rx - 1))
    xs = sorted([ex, ex - side * 14])
    hall_a[int(spring - 40):, xs[0]:xs[1]] = (110, 60, 30)
    e = xs[1] - 3 if side < 0 else xs[0]
    hall_a[int(spring - 40):, e:e + 3] = (40, 150, 170)
night[ay0:ay1, ax0:ax1][inside] = hall_a[inside]
# soft shadow just inside the arch so it reads as a deep opening
edge = cv2.GaussianBlur((~inside).astype(np.float32), (0, 0), 7)
night[ay0:ay1, ax0:ax1] *= np.where(inside, 1 - 0.55 * edge, 1)[..., None]

yy = np.mgrid[0:BASE_Y, 0:W][0].astype(np.float32)
night = np.clip(night * np.clip(0.75 + 0.25 * (yy / BASE_Y), 0, 1)[..., None], 0, 255)


# ============ D. Signs, painted into the scene before pixelation ============
def font(file, index, size):
    return ImageFont.truetype(SUP + file, size, index=index)


def fit(file, index, text, max_w, max_h):
    for size in range(120, 6, -1):
        fnt = font(file, index, size)
        x0, y0, x1, y1 = fnt.getbbox(text)
        if x1 - x0 <= max_w and y1 - y0 <= max_h:
            return fnt
    return fnt


def paint_sign(w, h, fill, lines, border=None, glow=0.0, light=(1.15, 0.8), grime=8):
    """Returns a float BGR sign image: panel, lettering, top-down sign lighting, grime."""
    panel = Image.new('RGB', (w, h), tuple(int(c) for c in fill[::-1]))
    d = ImageDraw.Draw(panel)
    if border is not None:
        bw, bc = border
        d.rectangle([0, 0, w - 1, h - 1], outline=tuple(int(c) for c in bc[::-1]), width=bw)
    text_mask = Image.new('L', (w, h), 0)
    tm = ImageDraw.Draw(text_mask)
    for text, fnt, colour, cy in lines:
        x0, y0, x1, y1 = fnt.getbbox(text)
        tx = (w - (x1 - x0)) // 2 - x0
        ty = int(cy * h - (y1 - y0) / 2 - y0)
        d.text((tx, ty + 2), text, font=fnt, fill=(0, 0, 0))     # cast shadow of raised letters
        d.text((tx, ty), text, font=fnt, fill=tuple(int(c) for c in colour[::-1]))
        tm.text((tx, ty), text, font=fnt, fill=255)
    a = np.array(panel)[..., ::-1].astype(np.float32)
    if glow and lines:
        halo = np.array(text_mask.filter(ImageFilter.GaussianBlur(5)), np.float32)[..., None] / 255
        a += halo * glow * np.array(lines[0][2], np.float32)
    a *= np.linspace(light[0], light[1], h)[:, None, None]
    a += rng.normal(0, grime, (h, w, 1))
    return np.clip(a, 0, 255)


def place(sign, x, y):
    h, w = sign.shape[:2]
    x1, y1 = min(W, x + w), min(BASE_Y, y + h)
    night[y:y1, x:x1] = sign[:y1 - y, :x1 - x]


def place_quad(sign, quad):
    h, w = sign.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32(quad))
    warped = cv2.warpPerspective(sign, M, (W, BASE_Y), flags=cv2.INTER_LINEAR)
    mask = cv2.warpPerspective(np.ones((h, w), np.float32), M, (W, BASE_Y))[..., None]
    night[:] = night * (1 - mask) + warped * mask


def shadow_below(x0, x1, y, depth=14, k=0.45):
    for i in range(depth):
        night[y + i, x0:x1] *= 1 - k * (1 - i / depth)


BLUE = np.array([120, 34, 28], np.float32)
WHITE = np.array([235, 232, 228], np.float32)
COND = 'Avenir Next Condensed.ttc'
STN = ('/System/Library/Fonts/' + COND, 2)    # Demi Bold

# The real canopy sign: front reads GREAT PORTLAND | STREET STATION, both ends GREAT PORTLAND STREET
JOHN = (SUP + 'GillSans.ttc', 4)              # Gill Sans SemiBold: close to the Underground's Johnston


def lettered(w, h, lines, fill, frac=0.5, pad=0.07):
    n = len(lines)
    for size in range(160, 6, -1):
        fnt = ImageFont.truetype(JOHN[0], size, index=JOHN[1])
        boxes = [fnt.getbbox(t) for t in lines]
        if max(b[2] - b[0] for b in boxes) <= w * (1 - 2 * pad) and size * n <= h * frac * 1.25:
            break
    rows = [(t, fnt, WHITE, 0.5 + (i - (n - 1) / 2) * 0.34) for i, t in enumerate(lines)]
    s = paint_sign(w, h, fill, rows, border=(4, fill * 0.45), glow=0.2,
                   light=(1.1, 0.85), grime=6)
    s[7:10, 7:-7] = s[7:10, 7:-7] * 0.35 + WHITE * 0.55          # thin white inner frame
    s[-10:-7, 7:-7] = s[-10:-7, 7:-7] * 0.35 + WHITE * 0.55
    s[7:-7, 7:10] = s[7:-7, 7:10] * 0.35 + WHITE * 0.55
    s[7:-7, -10:-7] = s[7:-7, -10:-7] * 0.35 + WHITE * 0.55
    return s


CAP = np.array([48, 52, 44], np.float32)
for cap in [(345, 391, 369, 424), (566, 391, 588, 424)]:
    cx0, cy0, cx1, cy1 = R(*cap)
    night[cy0:cy1, cx0:cx1] = CAP * np.linspace(1.1, 0.75, cy1 - cy0)[:, None, None]
    night[cy0:cy1, cx0:cx0 + 3] = CAP * 0.6
fx0, fy0, fx1, fy1 = R(369, 391, 566, 424)
mid = R(471, 0, 0, 0)[0]
place(lettered(mid - fx0, fy1 - fy0, ["GREAT PORTLAND"], BLUE), fx0, fy0)
place(lettered(fx1 - mid, fy1 - fy0, ["STREET STATION"], BLUE), mid, fy0)
side = lettered(300, 160, ["GREAT PORTLAND", "STREET"], BLUE * 0.85, frac=0.62)
place_quad(side, [R(291, 409, 0, 0)[:2], R(345, 395, 0, 0)[:2], R(345, 421, 0, 0)[:2], R(291, 439, 0, 0)[:2]])
side = lettered(300, 160, ["GREAT PORTLAND", "STREET"], BLUE * 0.7, frac=0.62)
place_quad(side, [R(588, 391, 0, 0)[:2], R(655, 407, 0, 0)[:2], R(655, 438, 0, 0)[:2], R(588, 424, 0, 0)[:2]])
sign_mask = np.zeros((980, W), np.float32)
for poly_pts in [[(291, 409), (345, 395), (345, 421), (291, 439)], [(345, 391), (588, 391), (588, 424), (345, 424)],
                 [(588, 391), (655, 407), (655, 438), (588, 424)]]:
    cv2.fillPoly(sign_mask, [np.array([R(x, y, 0, 0)[:2] for x, y in poly_pts], np.int32)], 1.0)

# cafe: maroon fascia, cream serif lettering
x0, y0, x1, y1 = R(64, 457, 172, 499)
cafe = paint_sign(x1 - x0, y1 - y0, np.array([45, 40, 85], np.float32), [
    ("Cafe Roma", fit('Didot.ttc', 1, "Cafe Roma", x1 - x0 - 30, 46), np.array([170, 215, 235], np.float32), 0.4),
    ("TRATTORIA", fit('GillSans.ttc', 4, "TRATTORIA", x1 - x0 - 90, 16), np.array([120, 180, 210], np.float32), 0.8),
], border=(4, np.array([30, 40, 50], np.float32)), light=(1.05, 0.6), grime=10) * 0.85
place(cafe, x0, y0)
shadow_below(x0, x1, y1)

# minicab office: back-lit yellow box
x0, y0, x1, y1 = R(176, 458, 252, 503)
cab = paint_sign(x1 - x0, y1 - y0, np.array([45, 185, 225], np.float32), [
    ("MINICABS", fit('Futura.ttc', 4, "MINICABS", x1 - x0 - 24, 34), np.array([25, 25, 30], np.float32), 0.38),
    ("24 HOURS", fit('Futura.ttc', 2, "24 HOURS", x1 - x0 - 60, 16), np.array([30, 30, 40], np.float32), 0.78),
], border=(4, np.array([20, 30, 35], np.float32)), light=(1.0, 0.8), grime=8) * 0.9
place(cab, x0, y0)
shadow_below(x0, x1, y1, 10, 0.3)

# jeweller: dark teal fascia with gold lettering
x0, y0, x1, y1 = R(712, 469, 836, 499)
jew = paint_sign(x1 - x0, y1 - y0, np.array([55, 58, 30], np.float32), [
    ("HARLOW", fit('Copperplate.ttc', 2, "HARLOW", x1 - x0 - 60, 26), np.array([70, 175, 215], np.float32), 0.36),
    ("JEWELLERS", fit('Copperplate.ttc', 0, "JEWELLERS", x1 - x0 - 90, 14), np.array([60, 150, 190], np.float32), 0.78),
], border=(3, np.array([40, 45, 15], np.float32)), light=(1.05, 0.65), grime=10) * 0.85
place(jew, x0, y0)
shadow_below(x0, x1, y1, 10)

# deli: dark green fascia over the awning, running off the right edge
x0, y0, x1, y1 = R(881, 452, 960, 480)
deli = paint_sign(x1 - x0, y1 - y0, np.array([38, 50, 32], np.float32), [
    ("DELI", ImageFont.truetype(SUP + 'GillSans.ttc', 46, index=4), np.array([160, 210, 230], np.float32), 0.5),
], border=(3, np.array([25, 35, 20], np.float32)), light=(1.0, 0.6), grime=10) * 0.8
place(deli, x0, y0)


# ============ D2. Framed posters on the station walls ============
def rgb(bgr):
    return tuple(int(c) for c in bgr[::-1])


def poster(x0, y0, x1, y1, art, frame=(46, 44, 42), dim=0.4):
    w, h = x1 - x0, y1 - y0
    im = Image.new('RGB', (w, h), rgb(frame))
    d = ImageDraw.Draw(im)
    art(im.crop((0, 0, w - 16, h - 16)), d, 8, 8, w - 8, h - 8)
    d.rectangle([0, 0, w - 1, h - 1], outline=rgb(np.array(frame) * 0.6), width=2)
    d.line([(2, 2), (w - 3, 2)], fill=rgb(np.clip(np.array(frame) * 1.8, 0, 255)), width=2)  # lit top edge
    a = np.array(im)[..., ::-1].astype(np.float32)
    gx = np.arange(w)[None, :] + np.arange(h)[:, None] * 0.6                # diagonal glint on the glass
    a[8:-8, 8:-8] += (np.abs((gx - w * 0.9) % (w * 1.6) - w * 0.3) < 6)[8:-8, 8:-8, None] * 18
    a = a * 0.75 + a.mean(-1, keepdims=True) * 0.25                          # muted under the street lights
    a *= dim * np.linspace(1.05, 0.8, h)[:, None, None]
    a += rng.normal(0, 5, (h, w, 1))
    night[y0:y1, x0:x1] = np.clip(a, 0, 255)
    shadow_below(x0 + 4, x1 + 4, y1, 8, 0.4)
    POSTERS.append((x0, y0, x1, y1))


def text_c(d, cx, y, text, fnt, fill):
    bx0, by0, bx1, by1 = fnt.getbbox(text)
    d.text((cx - (bx1 - bx0) / 2 - bx0, y - by0), text, font=fnt, fill=fill)


def theatre(_, d, x0, y0, x1, y1):            # a West End show: black, red and gold
    d.rectangle([x0, y0, x1, y1], fill=(18, 14, 16))
    cx = (x0 + x1) / 2
    d.ellipse([cx - 26, y0 + 12, cx + 26, y0 + 64], fill=(230, 200, 90))       # moon
    d.ellipse([cx - 14, y0 + 6, cx + 34, y0 + 56], fill=(18, 14, 16))
    text_c(d, cx, y0 + 68, "NIGHT", ImageFont.truetype(SUP + 'Impact.ttf', 32), (215, 40, 35))
    text_c(d, cx, y0 + 100, "TRAIN", ImageFont.truetype(SUP + 'Impact.ttf', 22), (235, 225, 210))
    d.rectangle([x0 + 10, y1 - 8, x1 - 10, y1 - 5], fill=(200, 170, 80))


def travel(_, d, x0, y0, x1, y1):             # a railway travel poster: sunset over the park
    for i in range(y1 - y0):
        t = i / (y1 - y0)
        d.line([(x0, y0 + i), (x1, y0 + i)], fill=(int(240 - 60 * t), int(150 + 20 * t), int(70 + 60 * t)))
    cx = (x0 + x1) / 2
    d.ellipse([cx - 18, y0 + 34, cx + 18, y0 + 70], fill=(250, 225, 140))
    d.polygon([(x0, y1 - 40), (cx - 20, y0 + 58), (cx + 30, y1 - 52), (x1, y0 + 66), (x1, y1), (x0, y1)], fill=(60, 110, 70))
    d.polygon([(x0, y1 - 22), (cx, y1 - 46), (x1, y1 - 26), (x1, y1), (x0, y1)], fill=(40, 80, 50))
    d.rectangle([x0, y0, x1, y0 + 30], fill=(235, 230, 215))
    text_c(d, cx, y0 + 5, "KEW", ImageFont.truetype(SUP + 'GillSans.ttc', 24, index=1), (40, 60, 120))


def gig(_, d, x0, y0, x1, y1):                # a gig poster: purple, pink and white
    d.rectangle([x0, y0, x1, y1], fill=(70, 35, 110))
    cx = (x0 + x1) / 2
    for r in range(60, 0, -12):
        d.ellipse([cx - r, y0 + 70 - r, cx + r, y0 + 70 + r], outline=(230, 90, 170), width=4)
    text_c(d, cx, y0 + 8, "MOONDOG", ImageFont.truetype(SUP + 'Futura.ttc', 20, index=4), (245, 240, 230))
    text_c(d, cx, y1 - 32, "LIVE", ImageFont.truetype(SUP + 'Impact.ttf', 26), (250, 220, 80))


def newsboard(_, d, x0, y0, x1, y1):          # the evening paper's headline bill
    d.rectangle([x0, y0, x1, y1], fill=(225, 222, 210))
    d.rectangle([x0, y0, x1, y0 + 22], fill=(170, 30, 35))
    cx = (x0 + x1) / 2
    text_c(d, cx, y0 + 4, "EVENING POST", ImageFont.truetype(SUP + 'GillSans.ttc', 11, index=1), (245, 240, 230))
    fnt = ImageFont.truetype(SUP + 'Impact.ttf', 24)
    for i, line in enumerate(["TUBE", "STRIKE", "LATEST"]):
        text_c(d, cx, y0 + 30 + i * 28, line, fnt, (20, 20, 22))


POSTERS = []
poster(572, 252, 676, 398, theatre)
poster(716, 272, 816, 398, travel)
poster(1108, 252, 1212, 398, gig, frame=(110, 60, 35))      # blue frame, like the real one by the arch
poster(1252, 272, 1352, 398, newsboard)

# ============ E. The building curves away on the left: bend its lower courses ============
CURVE_X = R(262, 0, 0, 0)[0]          # where the frontage starts to wrap round
TOP = R(0, 560, 0, 0)[1]               # bend everything below this line
gap = np.zeros(W, int)
bent = night.copy()
for x in range(CURVE_X):
    k = 0.2 * ((CURVE_X - x) / CURVE_X) ** 1.6
    ys = np.arange(TOP, BASE_Y, dtype=np.float32)
    src_y = TOP + (ys - TOP) / (1 - k)
    ok = src_y <= BASE_Y - 1
    bent[TOP:BASE_Y, x][ok] = night[np.round(src_y[ok]).astype(int), x]
    gap[x] = int((~ok).sum())
night = bent

# ============ F. Pavement + road from the current background, litter removed ============
ground = cur[BASE_Y:980].copy()
gm = np.zeros(ground.shape[:2], np.uint8)
for gx0, gy0, gx1, gy1 in [(400, 548, 600, 600), (1290, 555, 1380, 590), (1390, 540, 1620, 585),
                           (405, 722, 470, 742), (1260, 726, 1330, 750), (1640, 728, 1675, 744),
                           (95, 735, 120, 750), (1575, 870, 1675, 918), (1740, 860, 1845, 882),
                           (1375, 892, 1425, 912), (1440, 903, 1495, 922)]:
    gm[max(0, gy0 - BASE_Y):gy1 - BASE_Y, gx0:gx1] = 255
ground = cv2.inpaint(ground, gm, 5, cv2.INPAINT_TELEA).astype(np.float32)

comp = np.vstack([night, ground])
# pavement continues up to the wall where it curves away
for x in range(CURVE_X):
    g = gap[x]
    if g:
        comp[BASE_Y - g:BASE_Y, x] = ground[6:6 + g, x]
# contact shadow along the foot of the building
for x in range(W):
    foot = BASE_Y - gap[x]
    for i in range(10):
        comp[foot + i, x] *= 1 - 0.35 * (1 - i / 10)


# ============ F2. Litter bins against the station wall ============
def litter_bin(cx, base, w=66, h=112):
    x0, top = cx - w // 2, base - h
    xs = np.arange(w)
    shade = 0.5 + 0.6 * np.clip(np.cos((xs / (w - 1) - 0.38) * np.pi), 0, 1) ** 1.5   # lit from the arch side
    body = np.array([22, 22, 25], np.float32)[None, None] * shade[None, :, None] * np.ones((h, 1, 1))
    body[:, (xs % 9) == 0] *= 0.55                                           # vertical ribs
    body[14:19] = np.array([40, 95, 125], np.float32) * shade[:, None] * 0.7   # gold band
    body[24:34, 10:-10] = (8, 8, 9)                                          # the slot under the lid
    body[:12] *= 1.25                                                        # domed lid
    body[3:5, 14:w // 2] *= 2.2                                              # its highlight
    body[-6:] *= 0.6                                                         # foot
    body += rng.normal(0, 3, body.shape[:2])[..., None]
    lid = (xs[None, :] - w / 2) ** 2 / (w / 2) ** 2 + (np.arange(h)[:, None] - 12) ** 2 / 12 ** 2 > 1
    lid &= np.arange(h)[:, None] < 12
    region = comp[top:base, x0:x0 + w]
    for i in range(14):                                                      # contact shadow on the pavement
        comp[base - 4 + i, x0 - 8:x0 + w + 8] *= 1 - 0.5 * (1 - i / 14)
    region[~lid] = body[~lid]


for cx, base in [(632, 578), (708, 579), (1300, 578)]:
    litter_bin(cx, base)

Y, X = np.mgrid[0:980, 0:W].astype(np.float32)
ex0, _, ex1, _ = R(426, 0, 512, 0)
ecx, erx = (ex0 + ex1) / 2, (ex1 - ex0) * 0.7
comp += (np.exp(-((X - ecx) / erx) ** 2) * np.exp(-((Y - 600) / 70) ** 2))[..., None] * WARM * 0.15
comp = np.clip(comp, 0, 255).astype(np.uint8)
cv2.imwrite(OUT + '.full.png', comp)

# ============ G. Pixelate: 480x245, 64-colour palette, 4x nearest-neighbour ============
LW, LH, K = 480, 245, 64
blur = cv2.GaussianBlur(comp, (0, 0), 2)
sharp = cv2.addWeighted(comp, 1.4, blur, -0.4, 0)
low = cv2.resize(sharp, (LW, LH), interpolation=cv2.INTER_AREA)
data = low.reshape(-1, 3).astype(np.float32)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, labels, centers = cv2.kmeans(data, K, None, crit, 4, cv2.KMEANS_PP_CENTERS)
low = centers.astype(np.uint8)[labels.flatten()].reshape(low.shape)
cv2.imwrite(OUT + '.low.png', low)
big = cv2.resize(low, (LW * 4, LH * 4), interpolation=cv2.INTER_NEAREST)
# the station sign and posters: a 2x pixel grid (same palette) so their lettering stays legible
for px0, py0, px1, py1 in POSTERS:
    sign_mask[py0:py1, px0:px1] = 1
mid = cv2.resize(sharp, (W // 2, 980 // 2), interpolation=cv2.INTER_AREA)
sel = cv2.resize(sign_mask, (W // 2, 980 // 2), interpolation=cv2.INTER_NEAREST) > 0.5
pix = mid[sel].astype(np.float32)
mid[sel] = centers.astype(np.uint8)[((pix[:, None] - centers[None]) ** 2).sum(-1).argmin(1)]
mid = cv2.resize(mid, (W, 980), interpolation=cv2.INTER_NEAREST)
big = np.where(cv2.resize(sel.astype(np.uint8), (W, 980), interpolation=cv2.INTER_NEAREST)[..., None] > 0, mid, big)
cv2.imwrite(OUT, big)
