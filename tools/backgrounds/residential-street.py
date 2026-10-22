"""Residential street: a 3-screen (5760x980) night-time terrace, smart on the right, run down on the left.
The houses are drawn in daylight colours at 1/S scale, night-graded to match the station exterior, lit,
scaled up so they're big next to Frank, then the pavement layer (lamps, litter, mattress, tape) goes on
and it's all pixelated the same way. The street lamps are also written out as a separate cut-out."""
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

OLD, EXT, OUT, LAMPS_OUT = sys.argv[1:5]
rng = np.random.default_rng(11)
SUP = '/System/Library/Fonts/Supplemental/'
W, H, BASE = 5760, 980, 572
S = 1.5                                            # houses drawn at 1/S, then scaled up
VW = int(W / S)                                    # virtual (facade) width
VTOP = int(BASE - BASE / S)                        # first virtual row that ends up on screen
img = np.zeros((BASE, VW, 3), np.float32)          # facade, RGB, daylight colours, virtual coords
lights = []                                        # drawn after the night grade (virtual coords)
rail_mask = np.zeros((BASE, VW), np.uint8)         # railing bars, redrawn over anything put behind them
fine = np.zeros((H, W), np.uint8)                  # areas pixelated on the 2x grid (lettering)


def sx(v):
    return int(round(v * S))


def sy(v):
    return int(round(BASE - (BASE - v) * S))


def C(*rgb):
    return np.array(rgb, np.float32)


def noise(h, w, amp):
    return rng.normal(0, amp, (h, w, 1)).astype(np.float32)


def fill(x0, y0, x1, y1, col, amp=4):
    x0, x1 = max(0, x0), min(VW, x1)
    if x1 <= x0 or y1 <= y0:
        return
    img[y0:y1, x0:x1] = col + noise(y1 - y0, x1 - x0, amp)


def shade(x0, y0, x1, y1, k):
    img[y0:y1, max(0, x0):min(VW, x1)] *= k


def mix(a, b, t):
    return a * (1 - t) + b * t


def brick(x0, y0, x1, y1, base, d):
    """London stock brick: courses of 12px, bricks 36px, sooty with wear."""
    x0, x1 = max(0, x0), min(VW, x1)
    ys, xs = np.mgrid[y0:y1, x0:x1]
    course = ys // 12
    bx = (xs + (course % 2) * 18) // 36
    joint = (ys % 12 == 0) | ((xs + (course % 2) * 18) % 36 == 0)
    h = (np.sin(course * 12.9898 + bx * 78.233) * 43758.5453) % 1
    tone = 0.82 + 0.3 * h[..., None]
    col = base * tone + noise(y1 - y0, x1 - x0, 5)
    col[joint] = base * (0.62 - 0.1 * d)
    streak = cv2.GaussianBlur(rng.random((1, x1 - x0)).astype(np.float32), (0, 0), 6)[0]
    col *= (1 - (0.15 + 0.25 * d) * streak[None, :, None] * np.linspace(0.4, 1, y1 - y0)[:, None, None])
    img[y0:y1, x0:x1] = col


def stains(x0, y0, x1, y1, d):
    """Rain streaks and damp down a painted wall."""
    for _ in range(int(d * (x1 - x0) / 25)):
        px = int(rng.integers(x0, x1 - 6))
        py = int(rng.integers(y0, max(y0 + 1, y1 - 40)))
        ln = int(rng.integers(30, 160))
        w = int(rng.integers(3, 10))
        sl = img[py:min(y1, py + ln), px:px + w]
        sl *= (1 - 0.25 * d * np.linspace(1, 0.2, sl.shape[0]))[:, None, None]


def peel(x0, y0, x1, y1, d, brick_col):
    """Patches where the render has come away, showing brick."""
    for _ in range(int(d * d * (x1 - x0) / 60)):
        pw, ph = int(rng.integers(20, 60)), int(rng.integers(14, 40))
        if x1 - pw <= x0 or y1 - ph <= y0:
            continue
        px, py = int(rng.integers(x0, x1 - pw)), int(rng.integers(y0, y1 - ph))
        save = img[py:py + ph, px:px + pw].copy()
        brick(px, py, px + pw, py + ph, brick_col, d)
        m = np.zeros((ph, pw), np.uint8)
        cv2.ellipse(m, (pw // 2, ph // 2), (pw // 2 - 1, ph // 2 - 1), 0, 0, 360, 1, -1)
        img[py:py + ph, px:px + pw] = np.where(m[..., None] > 0, img[py:py + ph, px:px + pw], save)


def tag(x0, y0, x1, y1):
    """A graffiti tag: a few looping strokes."""
    im = Image.new('L', (x1 - x0, y1 - y0), 0)
    dr = ImageDraw.Draw(im)
    col = [C(200, 60, 160), C(60, 170, 210), C(230, 200, 60), C(235, 235, 235), C(90, 200, 90)][int(rng.integers(5))]
    pts = []
    for i in range(int(rng.integers(6, 12))):
        pts.append((rng.uniform(0, x1 - x0), rng.uniform((y1 - y0) * 0.15, (y1 - y0) * 0.85)))
    pts.sort()
    dr.line(pts, fill=255, width=int(rng.integers(3, 5)), joint='curve')
    m = np.array(im, np.float32)[..., None] / 255 * 0.8
    reg = img[y0:y1, x0:x1]
    img[y0:y1, x0:x1] = reg * (1 - m) + col * m


def window(x, y, w, h, state, surround, frame=C(225, 222, 212)):
    """A sash window: 'lit', 'dark', 'boarded', 'broken'. Lit glass goes to `lights`."""
    fill(x - 12, y - 14, x + w + 12, y, surround)             # head
    fill(x - 12, y, x - 4, y + h, surround)
    fill(x + w + 4, y, x + w + 12, y + h, surround)
    fill(x - 16, y + h, x + w + 16, y + h + 10, surround * 1.05)  # sill
    shade(x - 16, y + h + 10, x + w + 16, y + h + 18, 0.6)
    fill(x - 4, y, x + w + 4, y + h, C(40, 38, 40))           # reveal
    gx0, gy0, gx1, gy1 = x + 4, y + 4, x + w - 4, y + h - 4
    if state == 'boarded':
        fill(x - 4, y - 2, x + w + 4, y + h + 2, C(150, 118, 78), 8)
        for yy in range(y, y + h, 40):
            img[yy:yy + 2, x - 4:x + w + 4] *= 0.6
        for yy in range(y + 10, y + h, 40):
            for xx in (x + 6, x + w - 8):
                img[yy:yy + 3, xx:xx + 3] = C(40, 35, 30)
        return
    fill(gx0, gy0, gx1, gy1, C(28, 32, 40), 3)                 # glass, unlit
    if state == 'lit':
        lights.append(('window', gx0, gy0, gx1, gy1))
    if state == 'broken':
        im = Image.new('L', (gx1 - gx0, gy1 - gy0), 0)
        dr = ImageDraw.Draw(im)
        cx, cy = rng.uniform(0.3, 0.7) * (gx1 - gx0), rng.uniform(0.2, 0.5) * (gy1 - gy0)
        for a in rng.uniform(0, 6.28, 7):
            dr.line([(cx, cy), (cx + np.cos(a) * 80, cy + np.sin(a) * 80)], fill=255, width=2)
        m = np.array(im, np.float32)[..., None] / 255
        img[gy0:gy1, gx0:gx1] = img[gy0:gy1, gx0:gx1] * (1 - m) + C(120, 125, 130) * m
    for (a, b) in [(gx0 - 4, gx0), (gx1, gx1 + 4)]:
        img[gy0:gy1, a:b] = frame
    img[gy0 - 4:gy0, gx0:gx1] = frame
    img[gy1:gy1 + 4, gx0:gx1] = frame
    mid = (gy0 + gy1) // 2
    img[mid - 3:mid + 3, gx0:gx1] = frame
    cx = (gx0 + gx1) // 2
    img[gy0:gy1, cx - 2:cx + 2] = frame


def panels(x, y, rects):
    """Fielded panels: shadowed top/left, catching the light bottom/right."""
    for (px0, py0, px1, py1) in rects:
        shade(x + px0, y + py0, x + px1, y + py0 + 4, 0.45)
        shade(x + px0, y + py0, x + px0 + 4, y + py1, 0.45)
        img[y + py1 - 4:y + py1, x + px0:x + px1] *= 1.5
        img[y + py0:y + py1, x + px1 - 4:x + px1] *= 1.3


BRASS, DULL, CHROME = C(190, 160, 70), C(80, 75, 60), C(175, 178, 182)


def door(x, y, w, h, col, style, surround, fan_lit, d, sunburst):
    """Front door under a fanlight. Styles: panel4, panel6, glazed (glass upper panes), flush (a 70s
    replacement), upvc (white plastic, frosted arch), ledged (boards), steel (council security door)."""
    fill(x - 18, y - 70, x + w + 18, y + h, surround)          # pilasters + head
    shade(x - 18, y - 70, x - 12, y + h, 0.8)
    fill(x - 22, y - 78, x + w + 22, y - 66, surround * 1.08)  # cornice over the door
    shade(x - 22, y - 66, x + w + 22, y - 60, 0.7)
    m = np.zeros((60, w), np.uint8)
    cv2.ellipse(m, (w // 2, 58), (w // 2 - 2, 52), 0, 180, 360, 1, -1)
    reg = img[y - 64:y - 4, x:x + w]
    reg[m > 0] = C(30, 32, 40)
    lights.append(('fan', x, y - 64, x + w, y - 4, m, fan_lit and style != 'steel', sunburst))
    tired = d > 0.4
    amp = 9 if tired else 4
    k = 0.75 if tired else 1.0
    if style == 'steel':
        fill(x - 4, y - 66, x + w + 4, y + h, C(110, 112, 115), 6)   # sheeted right over the fanlight
        for yy in range(y - 56, y + h, 30):
            for xx in range(x + 4, x + w - 4, 24):
                img[yy:yy + 3, xx:xx + 3] = C(70, 72, 75)
        lights[-1] = ('fan', x, y - 64, x + w, y - 4, np.zeros_like(m), False, False)
        return
    if style == 'upvc':
        fill(x, y, x + w, y + h, C(222, 222, 214) * (1 - 0.35 * d), 3)
        img[y:y + h, x:x + 4] *= 0.8
        img[y:y + h, x + w - 4:x + w] *= 0.8
        gx0, gy0, gx1, gy1 = x + 14, y + 16, x + w - 14, y + h // 2 + 6
        gw = gx1 - gx0
        gm = np.zeros((gy1 - gy0, gw), np.uint8)
        cv2.rectangle(gm, (0, gw // 2), (gw, gy1 - gy0), 1, -1)
        cv2.ellipse(gm, (gw // 2, gw // 2), (gw // 2 - 1, gw // 2 - 1), 0, 180, 360, 1, -1)
        img[gy0:gy1, gx0:gx1][gm > 0] = C(60, 66, 74)
        lights.append(('glass', gx0, gy0, gx1, gy1, gm, fan_lit, 0.35))
        panels(x, y, [(14, h // 2 + 22, w - 14, h - 16)])
        img[y + h // 2 + 30:y + h // 2 + 36, x + w // 2 - 16:x + w // 2 + 16] = CHROME
        img[y + h // 2 - 6:y + h // 2, x + w - 26:x + w - 8] = CHROME          # lever handle
        return
    fill(x, y, x + w, y + h, col * k, amp)
    if style == 'panel4':
        panels(x, y, [(8, 10, w // 2 - 4, h // 2 - 8), (w // 2 + 4, 10, w - 8, h // 2 - 8),
                      (8, h // 2 + 8, w // 2 - 4, h - 12), (w // 2 + 4, h // 2 + 8, w - 8, h - 12)])
    elif style == 'panel6':
        r = (h - 20) // 3
        panels(x, y, [(px0, 10 + i * r + 4, px1, 10 + (i + 1) * r - 4)
                      for i in range(3) for (px0, px1) in [(8, w // 2 - 4), (w // 2 + 4, w - 8)]])
    elif style == 'glazed':
        for (px0, px1) in [(10, w // 2 - 5), (w // 2 + 5, w - 10)]:
            gm = np.ones((h // 2 - 22, px1 - px0), np.uint8)
            img[y + 12:y + h // 2 - 10, x + px0:x + px1] = C(30, 34, 42)
            lights.append(('glass', x + px0, y + 12, x + px1, y + h // 2 - 10, gm, fan_lit, 0.5))
            lights.append(('bar', x + px0, y + 12 + (h // 2 - 22) // 2 - 2, x + px1, y + 12 + (h // 2 - 22) // 2 + 2))
        panels(x, y, [(8, h // 2 + 8, w // 2 - 4, h - 12), (w // 2 + 4, h // 2 + 8, w - 8, h - 12)])
    elif style == 'flush':
        img[y:y + h, x:x + w] = col * k * 0.85 + C(20, 14, 6) + noise(h, w, 3)
        gx = x + int(w * 0.62)
        img[y + 20:y + h - 70, gx:gx + 14] = C(30, 34, 42)                    # reeded glass strip
        lights.append(('glass', gx, y + 20, gx + 14, y + h - 70, np.ones((h - 90, 14), np.uint8), fan_lit, 0.3))
        img[y + h - 46:y + h - 40, x + 14:x + w // 2] = CHROME                 # letterbox low down
        img[y + h // 2 - 4:y + h // 2 + 2, x + 10:x + 26] = CHROME             # handle
        if tired:
            peel(x + 2, y + 2, x + w - 2, y + h - 2, 0.5, col * 0.5)
        return
    elif style == 'ledged':
        img[y:y + h, x:x + w] = col * 0.55 + C(40, 30, 20) + noise(h, w, 8)
        for xx in range(x + 10, x + w, 12):
            img[y:y + h, xx:xx + 2] *= 0.55                                    # board joints
        for yy in (y + 16, y + h // 2, y + h - 30):
            img[yy:yy + 10, x:x + w] *= 1.15                                   # ledges
            img[yy + 10:yy + 12, x:x + w] *= 0.6
        img[y + h // 2 - 30:y + h // 2 - 22, x + w - 30:x + w - 6] = C(60, 58, 55)  # hasp and padlock
        return
    # letterbox and knocker
    img[y + h // 2 - 5:y + h // 2 + 1, x + w // 2 - 14:x + w // 2 + 14] = DULL if tired else BRASS
    if not tired:
        img[y + h // 2 - 40:y + h // 2 - 24, x + w // 2 - 4:x + w // 2 + 4] = C(210, 180, 80)
    else:
        peel(x + 2, y + 2, x + w - 2, y + h - 2, 0.6, col * 0.5)


def door_style(d, r):
    if d < 0.3:
        return 'panel4' if r < 0.45 else 'panel6' if r < 0.8 else 'glazed'
    if d < 0.62:
        return ['panel4', 'glazed', 'flush', 'upvc', 'panel6', 'upvc'][int(r * 6)]
    if d < 0.85:
        return ['flush', 'upvc', 'ledged', 'panel4'][int(r * 4)]
    return ['steel', 'ledged', 'flush', 'steel'][int(r * 4)]


def steps(x0, x1, top):
    n = 3
    sh = (BASE - top) // n
    for i in range(n):
        y = top + i * sh
        fill(x0 - i * 8, y, x1 + i * 8, y + sh, C(185, 180, 170) * (1 - 0.06 * i))
        img[y:y + 3, x0 - i * 8:x1 + i * 8] *= 1.2


def railings(x0, x1, top, d):
    fill(x0, top, x1, BASE, C(18, 18, 22))                    # the dark basement well behind
    img[top + 6:top + 10, x0:x1] = C(30, 30, 34)
    img[BASE - 10:BASE - 6, x0:x1] = C(30, 30, 34)
    rail_mask[top + 6:top + 10, x0:x1] = 1
    rail_mask[BASE - 10:BASE - 6, x0:x1] = 1
    for bx in range(x0 + 4, x1 - 4, 14):
        if rng.random() < d * 0.35:
            continue                                          # a missing bar
        lean = int(rng.integers(-3, 4) * d)
        for yy in range(top - 8, BASE - 4):
            t = (yy - top) / (BASE - top)
            xx = bx + int(lean * (1 - t))
            img[yy, xx:xx + 4] = C(26, 26, 30)
            img[yy, xx:xx + 1] = C(70, 70, 76)
            rail_mask[yy, xx:xx + 4] = 1
        img[top - 14:top - 8, bx + lean - 1:bx + lean + 5] = C(26, 26, 30)   # finial


# ---------------- Layout (virtual coords) ----------------
ALLEY_X1, SHOP_X0, SHOP_X1, VDOOR_X0, VDOOR_X1, HOUSES_X0 = 70, 90, 400, 412, 512, 530
VDOOR_TOP = 330
N_HOUSES = 9
house_w = (VW - HOUSES_X0) / N_HOUSES
houses = [(int(HOUSES_X0 + i * house_w), int(HOUSES_X0 + (i + 1) * house_w)) for i in range(N_HOUSES)]
UP_Y, UP_H, BAND_Y, GW_Y, GW_H, DOOR_Y, DOOR_H = 84, 156, 252, 310, 160, 346, 176


def decay(vx):
    t = 1 - (vx - HOUSES_X0) / (VW - HOUSES_X0)           # 0 at the right, 1 at the left
    return float(np.clip(t, 0, 1) ** 1.4)


BRICK = C(150, 128, 96)
STUCCO = C(214, 206, 188)
DOORS = [C(20, 22, 26), C(30, 70, 50), C(130, 30, 35), C(30, 50, 100), C(70, 40, 70)]

for (x0, x1) in houses:
    d = decay((x0 + x1) / 2)
    hr = np.random.default_rng(x0)
    painted = d < 0.75
    surround = mix(STUCCO, C(150, 145, 130), d)
    brick(x0, 0, x1, BASE, mix(BRICK, C(115, 100, 82), d), d)
    if painted:                                            # rendered ground floor
        fill(x0, BAND_Y, x1, BASE, surround, 5)
        for yy in range(BAND_Y + 14, BASE, 26):            # rusticated lines
            img[yy:yy + 2, x0:x1] *= 0.82
        stains(x0, BAND_Y, x1, BASE, d)
        peel(x0, BAND_Y + 10, x1, BASE - 60, d, BRICK)
        fill(x0, BAND_Y - 8, x1, BAND_Y + 4, surround * 1.08)
        shade(x0, BAND_Y + 4, x1, BAND_Y + 10, 0.7)
    hw = x1 - x0
    # first floor: the bottoms of two windows show at the top of the screen
    for wx in (x0 + int(hw * 0.17), x0 + int(hw * 0.6)):
        r = hr.random()
        st = 'boarded' if r < d * 0.5 else 'broken' if r < d * 0.65 else 'lit' if hr.random() > 0.35 + 0.55 * d else 'dark'
        window(wx, UP_Y, int(hw * 0.24), UP_H, st, surround)
        if d < 0.25:                                       # little iron balconies on the smart end
            bw = int(hw * 0.24)
            fill(wx - 14, UP_Y + UP_H - 18, wx + bw + 14, UP_Y + UP_H - 14, C(26, 26, 30))
            for bx in range(wx - 12, wx + bw + 12, 10):
                img[UP_Y + UP_H - 14:UP_Y + UP_H + 8, bx:bx + 3] = C(26, 26, 30)
            fill(wx - 14, UP_Y + UP_H + 8, wx + bw + 14, UP_Y + UP_H + 12, C(26, 26, 30))
    # ground floor: big window on the left, door on the right
    r = hr.random()
    st = 'boarded' if r < d * 0.55 else 'broken' if r < d * 0.7 else 'lit' if hr.random() > 0.25 + 0.6 * d else 'dark'
    window(x0 + int(hw * 0.1), GW_Y, int(hw * 0.36), GW_H, st, surround)
    dx, dw = x0 + int(hw * 0.62), int(hw * 0.24)
    style = door_style(d, hr.random())
    fan_lit = hr.random() > 0.3 + 0.45 * d                 # not everyone has the hall light on
    door(dx, DOOR_Y, dw, DOOR_H, DOORS[int(hr.integers(len(DOORS)))], style, surround, fan_lit, d,
         sunburst=hr.random() < 0.5)
    steps(dx - 6, dx + dw + 6, DOOR_Y + DOOR_H)
    railings(x0 + 6, dx - 30, 490, d)
    railings(dx + dw + 30, x1 - 6, 490, d)
    if d > 0.45:
        for _ in range(int(hr.integers(1, 3))):
            gx = int(hr.integers(x0 + 10, x1 - 100))
            gy = int(hr.integers(BAND_Y + 30, 420))
            tag(gx, gy, gx + int(hr.integers(60, 100)), gy + 45)
    # downpipe between houses
    fill(x1 - 4, 0, x1 + 4, BASE, C(40, 40, 45))
    img[0:BASE, x1 - 4:x1 - 2] *= 1.6

# a "TO LET" board, taken off its pole and left leaning against the railings of a middle house
tx0, tx1 = houses[5]
TOLET_X = (tx0 + 6 + tx0 + int((tx1 - tx0) * 0.62) - 30) // 2   # middle of the left-hand railings

# ---------------- The shop and the victim's door, at the run-down end ----------------
brick(0, 0, HOUSES_X0, BASE, C(110, 96, 80), 1.0)
for wx, st in [(130, 'broken'), (250, 'dark'), (420, 'boarded')]:
    window(wx, UP_Y, 70, UP_H, st, C(140, 135, 122))
# shopfront: fascia (lettered later) over a full-width roller shutter, pulled down and locked
FASCIA_Y0, FASCIA_Y1, SHUT_Y0 = 246, 290, 300
fill(SHOP_X0 - 10, 238, SHOP_X1 + 6, BASE, C(55, 55, 60))       # frame
fill(SHOP_X0, FASCIA_Y0, SHOP_X1 - 4, FASCIA_Y1, C(30, 40, 90))
fill(SHOP_X0 - 2, FASCIA_Y1 + 2, SHOP_X1, SHUT_Y0 + 6, C(80, 82, 86), 3)   # shutter box
shade(SHOP_X0 - 2, SHUT_Y0 + 6, SHOP_X1, SHUT_Y0 + 9, 0.6)
fill(SHOP_X0 + 2, SHUT_Y0 + 9, SHOP_X1 - 4, BASE - 3, C(126, 128, 132), 5)
for yy in range(SHUT_Y0 + 12, BASE - 3, 5):
    img[yy:yy + 1, SHOP_X0 + 2:SHOP_X1 - 4] *= 0.62
    img[yy + 1:yy + 2, SHOP_X0 + 2:SHOP_X1 - 4] *= 1.12
for gx in (SHOP_X0 + 2, SHOP_X1 - 10):                           # guide rails
    fill(gx, SHUT_Y0 + 9, gx + 6, BASE - 3, C(70, 72, 76))
fill(SHOP_X0 + 2, BASE - 10, SHOP_X1 - 4, BASE - 3, C(85, 86, 90))   # bottom rail
for px in (SHOP_X0 + 40, SHOP_X1 - 50):
    fill(px, BASE - 18, px + 8, BASE - 8, C(150, 130, 60))           # padlocks
# rust and grime at the foot, tags across the middle
for _ in range(10):
    rx = int(rng.integers(SHOP_X0 + 8, SHOP_X1 - 30))
    ry = int(rng.integers(BASE - 90, BASE - 30))
    img[ry:BASE - 10, rx:rx + int(rng.integers(2, 5))] *= C(1.0, 0.92, 0.85)
tag(SHOP_X0 + 16, 330, SHOP_X0 + 140, 390)
tag(SHOP_X0 + 120, 400, SHOP_X0 + 230, 460)
tag(SHOP_X0 + 30, 470, SHOP_X0 + 150, 520)
# the victim's door: narrow, shabby, straight off the pavement
fill(VDOOR_X0 - 10, VDOOR_TOP - 14, VDOOR_X1 + 10, BASE, C(120, 115, 105))
shade(VDOOR_X0 - 10, VDOOR_TOP - 14, VDOOR_X0 - 4, BASE, 0.8)
fill(VDOOR_X0, VDOOR_TOP, VDOOR_X1, BASE - 8, C(70, 48, 36), 10)
peel(VDOOR_X0 + 2, VDOOR_TOP + 2, VDOOR_X1 - 2, BASE - 12, 0.8, C(50, 35, 28))
for (px0, py0, px1, py1) in [(12, 16, VDOOR_X1 - VDOOR_X0 - 12, 108), (12, 126, VDOOR_X1 - VDOOR_X0 - 12, 224)]:
    shade(VDOOR_X0 + px0, VDOOR_TOP + py0, VDOOR_X0 + px1, VDOOR_TOP + py0 + 3, 0.6)
    shade(VDOOR_X0 + px0, VDOOR_TOP + py0, VDOOR_X0 + px0 + 3, VDOOR_TOP + py1, 0.6)
img[446:452, VDOOR_X0 + 30:VDOOR_X1 - 30] = C(90, 85, 70)            # letterbox
img[410:416, VDOOR_X0 + 10:VDOOR_X0 + 18] = C(90, 85, 70)               # Yale lock
fill(VDOOR_X1 + 3, 380, VDOOR_X1 + 9, 410, C(150, 145, 130))           # bell push panel
fill(VDOOR_X0, BASE - 8, VDOOR_X1, BASE, C(150, 146, 138))             # step
# the far end: a dark alley mouth behind a chain-link fence
fill(0, 0, ALLEY_X1, BASE, C(22, 22, 26))
for xx in range(4, ALLEY_X1 - 4, 9):
    img[290:BASE, xx:xx + 1] = C(70, 72, 78)
for yy in range(290, BASE, 9):
    img[yy:yy + 1, 0:ALLEY_X1 - 2] = C(60, 62, 68)
fill(0, 286, ALLEY_X1 - 2, 291, C(80, 82, 88))

# ---------------- Night grade (match the station exterior's facade) ----------------
ext = cv2.imread(EXT)
facade = cv2.cvtColor(np.clip(img, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)


def lab(i):
    return cv2.cvtColor(i, cv2.COLOR_BGR2LAB).astype(np.float32)


src, ref = lab(facade), lab(ext[150:560])
vis = src[VTOP:]                                   # match only what is on screen
out = np.empty_like(src)
for ch in range(3):
    out[..., ch] = ((src[..., ch] - vis[..., ch].mean()) / (vis[..., ch].std() + 1e-6)
                    * ref[..., ch].std() * (1.0 if ch == 0 else 0.6) + ref[..., ch].mean())
night = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
night *= np.clip(0.8 + 0.2 * np.linspace(0, 1, BASE), 0, 1)[:, None, None]

# ---------------- Lights ----------------
WARM = np.array([70, 165, 235], np.float32)       # BGR
FRAME_NIGHT = (60, 62, 66)
glow_mask = np.zeros((H, W), np.float32)          # where light falls on the pavement (screen coords)


def pool(x0, x1, k):
    glow_mask[BASE + 10:BASE + 150, max(0, sx(x0) - 40):sx(x1) + 40] += k


for L in lights:
    kind, x0, y0, x1, y1 = L[:5]
    h, w = y1 - y0, x1 - x0
    if kind == 'window':
        warm = WARM * rng.uniform(0.6, 1.0)
        night[y0:y1, x0:x1] = np.linspace(1.0, 0.7, h)[:, None, None] * warm
        cw = int(w * rng.uniform(0.15, 0.3))                    # curtains
        ccol = [np.array([40, 40, 120], np.float32), np.array([50, 90, 50], np.float32),
                np.array([90, 110, 140], np.float32)][int(rng.integers(3))]
        night[y0:y1, x0:x0 + cw] = ccol * np.linspace(1.1, 0.7, cw)[None, :, None]
        night[y0:y1, x1 - cw:x1] = ccol * np.linspace(0.7, 1.1, cw)[None, :, None]
        mid, cx = (y0 + y1) // 2, (x0 + x1) // 2
        night[mid - 3:mid + 3, x0:x1] = FRAME_NIGHT
        night[y0:y1, cx - 2:cx + 2] = FRAME_NIGHT
        pool(x0, x1, 0.5 if y0 > BAND_Y else 0.12)
    elif kind == 'fan':
        m, lit, sunburst = L[5:8]
        if lit:
            night[y0:y1, x0:x1][m > 0] = WARM * rng.uniform(0.55, 0.75)
            pool(x0, x1, 0.15)
        if sunburst and m.any():                                 # glazing bars fanning out
            cx, cy = w // 2, h - 2
            fan = night[y0:y1, x0:x1].copy()
            for a in np.linspace(np.pi * 1.12, np.pi * 1.88, 5):
                cv2.line(fan, (cx, cy), (int(cx + np.cos(a) * w), int(cy + np.sin(a) * w)), FRAME_NIGHT, 2)
            cv2.ellipse(fan, (cx, cy), (w // 6, w // 6), 0, 180, 360, FRAME_NIGHT, 2)
            night[y0:y1, x0:x1][m > 0] = fan[m > 0]
    elif kind == 'glass':
        m, lit, k = L[5:8]
        if lit:
            g = np.linspace(1.0, 0.75, h)[:, None, None] * WARM * k
            night[y0:y1, x0:x1][m > 0] = np.broadcast_to(g, (h, w, 3))[m > 0]
for L in lights:
    if L[0] == 'bar':
        night[L[2]:L[4], L[1]:L[3]] = FRAME_NIGHT

# ---------------- Scale the houses up to street size ----------------
big_facade = cv2.resize(night, (W, int(round(BASE * S))), interpolation=cv2.INTER_LINEAR)
facade_screen = big_facade[-BASE:]

# ---------------- Ground: the station's pavement and road, carried on ----------------
old = cv2.imread(OLD)
ground = old[BASE:H].copy()
gm = np.zeros(ground.shape[:2], np.uint8)
for gx0, gy0, gx1, gy1 in [(400, 548, 600, 600), (1290, 555, 1380, 590), (1390, 540, 1620, 585),
                           (405, 722, 470, 742), (1260, 726, 1330, 750), (1640, 728, 1675, 744),
                           (95, 735, 120, 750), (1575, 870, 1675, 918), (1740, 860, 1845, 882),
                           (1375, 892, 1425, 912), (1440, 903, 1495, 922), (600, 572, 1300, 600)]:
    gm[max(0, gy0 - BASE):gy1 - BASE, gx0:gx1] = 255
ground = cv2.inpaint(ground, gm, 5, cv2.INPAINT_TELEA).astype(np.float32)
ground = np.hstack([ground, ground[:, ::-1], ground])
comp = np.vstack([facade_screen, ground])
for i in range(12):                                # contact shadow along the foot of the terrace
    comp[BASE + i] *= 1 - 0.4 * (1 - i / 12)

pl = cv2.GaussianBlur(glow_mask, (0, 0), 40)[..., None]
comp += pl * WARM * 0.25


def dscreen(x):
    return decay(x / S)


# ---------------- Shop fascia lettering ----------------
fx0, fy0, fx1, fy1 = sx(SHOP_X0), sy(FASCIA_Y0), sx(SHOP_X1 - 4), sy(FASCIA_Y1)
sign = Image.new('RGB', (fx1 - fx0, fy1 - fy0), (100, 35, 30))
dr = ImageDraw.Draw(sign)
fnt = ImageFont.truetype(SUP + 'Futura.ttc', 44, index=4)
text = "NEWS  &  WINE"
bx0, by0, bx1, by1 = fnt.getbbox(text)
dr.text(((fx1 - fx0 - (bx1 - bx0)) / 2 - bx0, (fy1 - fy0 - (by1 - by0)) / 2 - by0), text, font=fnt, fill=(235, 220, 120))
s = np.array(sign)[..., ::-1].astype(np.float32)
s[:, 300:370] *= 0.35                                    # half its strip lights have gone
comp[fy0:fy1, fx0:fx1] = s * 0.6
fine[fy0:fy1, fx0:fx1] = 1

# ---------------- 3x5 pixel font, drawn in 2x2 blocks ----------------
FONT = {
    'A': ["010", "101", "111", "101", "101"], 'C': ["011", "100", "100", "100", "011"],
    'D': ["110", "101", "101", "101", "110"], 'E': ["111", "100", "110", "100", "111"],
    'F': ["111", "100", "110", "100", "100"], 'H': ["101", "101", "111", "101", "101"],
    'I': ["111", "010", "010", "010", "111"], 'L': ["100", "100", "100", "100", "111"],
    'O': ["010", "101", "101", "101", "010"], 'P': ["110", "101", "110", "100", "100"],
    'R': ["110", "101", "110", "101", "101"], 'S': ["011", "100", "010", "001", "110"],
    'T': ["111", "010", "010", "010", "010"], 'U': ["101", "101", "101", "101", "011"],
}


def text_w(s, cell=2):
    return sum((2 if c == ' ' else 4) for c in s) * cell - cell


def draw_text(canvas, s, x, y, colour, cell=2):
    x, y = x - x % 2, y - y % 2                      # on the 2x grid, or the letters smear
    for c in s:
        if c == ' ':
            x += 2 * cell
            continue
        for r, row in enumerate(FONT[c]):
            for col, bit in enumerate(row):
                if bit == '1':
                    canvas[y + r * cell:y + (r + 1) * cell, x + col * cell:x + (col + 1) * cell] = colour
        x += 4 * cell



# ---------------- The ATM, through a square cut in the shutter ----------------
ax0, ay0, ax1, ay1 = 452, 296, 572, 436                  # even, so the 2x grid lines up
comp[ay0:ay1, ax0:ax1] = (14, 14, 16)                    # the recess behind the cut
comp[ay0 + 8:ay1, ax0 + 8:ax1 - 4] = (58, 56, 54)        # the machine's steel fascia, set back
comp[ay0 + 8:ay0 + 14, ax0 + 8:ax1 - 4] *= 0.45          # in the shadow of the shutter above
comp[ay0 + 8:ay1, ax0 + 8:ax0 + 12] *= 0.6
comp[ay1:ay1 + 2, ax0:ax1 + 2] = (112, 112, 112)         # the raw cut edge of the slats, catching the light
comp[ay0:ay1 + 2, ax1:ax1 + 2] = (100, 100, 100)
comp[ay0 - 2:ay0, ax0:ax1] = (40, 40, 42)
comp[ay0:ay1, ax0 - 2:ax0] = (40, 40, 42)
comp[ay0 + 14:ay0 + 30, ax0 + 8:ax1 - 4] = (110, 40, 20)  # lit header
draw_text(comp, "CASH", (ax0 + ax1) // 2 - text_w("CASH") // 4 * 2 + 2, ay0 + 18, (230, 225, 220))
scx0, scy0, scx1, scy1 = ax0 + 26, ay0 + 40, ax1 - 20, ay0 + 94
comp[scy0 - 4:scy1 + 4, scx0 - 4:scx1 + 4] = (30, 30, 32)    # bezel
comp[scy0:scy1, scx0:scx1] = (150, 105, 40)                  # blue screen glow
for by in (scy0 + 8, scy0 + 24, scy0 + 40):                  # buttons either side of the screen
    comp[by:by + 6, ax0 + 14:ax0 + 20] = (120, 118, 115)
    comp[by:by + 6, ax1 - 14:ax1 - 8] = (120, 118, 115)
# the note stuck over the screen
nx0, ny0, nx1, ny1 = scx0 + 4, scy0 + 6, scx1 - 4, scy1 - 2
comp[ny0:ny1, nx0:nx1] = (200, 214, 222)
comp[ny1 - 2:ny1, nx0 + 2:nx1] = (150, 160, 166)
for tx in (nx0 - 2, nx1 - 6):                                # sellotape at the top corners
    comp[ny0 - 2:ny0 + 4, tx:tx + 8] = (175, 185, 190)
draw_text(comp, "OUT OF", (nx0 + nx1) // 2 - text_w("OUT OF") // 4 * 2, ny0 + 8, (40, 30, 30))
draw_text(comp, "ORDER", (nx0 + nx1) // 2 - text_w("ORDER") // 4 * 2, ny0 + 24, (40, 30, 30))
# keypad, card slot and cash slot
kx0, ky0 = (ax0 + ax1) // 2 - 20, scy1 + 10
for r in range(4):
    for c in range(3):
        comp[ky0 + r * 8:ky0 + r * 8 + 6, kx0 + c * 10:kx0 + c * 10 + 8] = (150, 148, 145)
comp[ky0:ky0 + 6, kx0 + 34:kx0 + 44] = (40, 40, 160)
comp[ky0 + 8:ky0 + 14, kx0 + 34:kx0 + 44] = (40, 150, 200)
comp[ky0 + 16:ky0 + 22, kx0 + 34:kx0 + 44] = (40, 140, 40)
comp[ky0 + 2:ky0 + 6, ax1 - 30:ax1 - 12] = (10, 10, 12)       # card slot
comp[ky0 + 8:ky0 + 10, ax1 - 26:ax1 - 16] = (60, 200, 60)    # its little green light
comp[ay1 - 10:ay1 - 6, ax0 + 30:ax1 - 30] = (10, 10, 12)     # cash slot
fine[ay0 - 4:ay1 + 4, ax0 - 4:ax1 + 4] = 1
glow = np.zeros((H, W), np.float32)
glow[scy0:scy1, scx0:scx1] = 1
glow = cv2.GaussianBlur(glow, (0, 0), 14)[..., None]
glow[ay0 - 4:ay1 + 4, ax0 - 4:ax1 + 4] *= 0.4
comp[ay0:ay1, ax0:ax1] *= 0.68
comp += glow * np.array([150, 90, 30], np.float32) * 0.3

# ---------------- Litter at the run-down end ----------------


def bin_bag(cx, base, w=96, h=74):
    m = np.zeros((h, w), np.uint8)
    cv2.ellipse(m, (w // 2, h // 2 + 6), (w // 2 - 2, h // 2 - 7), 0, 0, 360, 1, -1)
    cv2.ellipse(m, (w // 2 + 4, 10), (9, 11), 0, 0, 360, 1, -1)       # the tied neck
    reg = comp[base - h:base, cx - w // 2:cx + w // 2]
    sh = np.linspace(1.5, 0.65, w)[None, :, None] * np.linspace(1.3, 0.75, h)[:, None, None]
    reg[m > 0] = (np.array([20, 20, 24], np.float32) * sh + noise(h, w, 3))[m > 0]
    for _ in range(3):                                                # wet highlights
        hx, hy = int(rng.integers(12, w - 20)), int(rng.integers(14, h - 14))
        if m[hy, hx]:
            reg[hy:hy + 2, hx:hx + int(rng.integers(6, 14))] = (90, 100, 110)


def can(x, y, col):
    comp[y:y + 8, x:x + 14] = col
    comp[y:y + 2, x:x + 14] = np.array(col) * 1.6
    comp[y:y + 8, x:x + 2] = (150, 150, 155)


def packet(x, y, col):
    pts = np.array([[x, y + 2], [x + 16, y], [x + 18, y + 10], [x + 2, y + 12]], np.int32)
    cv2.fillPoly(comp, [pts], col)
    comp[y + 4:y + 6, x + 4:x + 12] = (200, 200, 200)


def newspaper(x, y, w=56):
    pts = np.array([[x, y + 4], [x + w, y], [x + w + 8, y + 14], [x + 6, y + 20]], np.int32)
    cv2.fillPoly(comp, [pts], (120, 128, 130))
    for i in range(4):                                                  # columns of print
        cv2.line(comp, (x + 8, y + 6 + i * 3), (x + w - 4, y + 3 + i * 3), (80, 84, 86), 1)
    cv2.line(comp, (x + w // 2, y + 2), (x + w // 2 + 4, y + 18), (90, 96, 98), 2)   # soggy fold


def bottle(x, y):
    cv2.line(comp, (x, y), (x + 26, y + 4), (30, 70, 30), 7)
    cv2.line(comp, (x + 26, y + 4), (x + 36, y + 6), (30, 70, 30), 3)
    comp[y - 2:y, x + 4:x + 18] = (110, 160, 110)


def glass(x, y):
    for _ in range(9):
        gx, gy = x + int(rng.integers(0, 40)), y + int(rng.integers(0, 12))
        comp[gy:gy + 2, gx:gx + 3] = (120, 170, 120)


def box(x, base, w=70, h=50):
    """A soggy cardboard box, slumping."""
    pts = np.array([[x, base], [x + 4, base - h], [x + w - 6, base - h + 6], [x + w, base]], np.int32)
    cv2.fillPoly(comp, [pts], (40, 70, 95))
    top = np.array([[x + 4, base - h], [x + 22, base - h - 12], [x + w + 10, base - h - 4], [x + w - 6, base - h + 6]], np.int32)
    cv2.fillPoly(comp, [top], (55, 90, 120))
    cv2.line(comp, (x + 4, base - h), (x + w - 6, base - h + 6), (30, 50, 70), 2)
    comp[base - h // 2:base, x + 2:x + w - 2] *= 0.8                     # soaked from the bottom


def takeaway(x, y):
    comp[y:y + 8, x:x + 22] = (125, 130, 132)
    comp[y - 6:y, x + 2:x + 20] = (105, 110, 112)                         # the lid hanging open
    comp[y + 2:y + 5, x + 4:x + 18] = (50, 90, 120)


for bx in [1990, 2070, 2030, 1260, 1010, 960, 2560, 2640, 2950, 220, 300]:
    bin_bag(bx, BASE + 18)
bin_bag(1050, BASE + 22, 70, 56)
box(2120, BASE + 26)
box(2700, BASE + 30, 60, 44)

# the TO LET board, dumped in the basement well behind the railings and leaning over at an angle
def to_let_board():
    bw, bh = 150, 104
    tr = np.random.default_rng(21)
    tex = np.empty((bh, bw, 3), np.float32)
    tex[:] = (120, 126, 130)                                          # sun-bleached white correx at night
    tex += tr.normal(0, 4, (bh, bw, 1))
    tex[:, ::4] *= 0.9                                                # the flutes of the corrugated plastic
    tex[:14] = np.array([34, 36, 112], np.float32) * tr.uniform(0.85, 1.1, (14, bw, 1))   # faded red header
    draw_text(tex, "TO LET", bw // 2 - text_w("TO LET", 5) // 2, 24, (34, 36, 112), cell=5)
    for i, w in enumerate([46, 30, 38]):                              # the agent's name and phone number
        tex[66:70, 18 + i * 52:18 + i * 52 + w] = (60, 62, 64)
    tex[76:80, 40:110] = (60, 62, 64)
    for _ in range(18):                                               # rain streaks running down it
        x, y = int(tr.integers(2, bw - 3)), int(tr.integers(10, bh - 20))
        tex[y:y + int(tr.integers(10, 40)), x:x + 2] *= 0.82
    for _ in range(3):                                                # scuffs and boot marks
        x, y = int(tr.integers(4, bw - 24)), int(tr.integers(40, bh - 10))
        cv2.ellipse(tex, (x, y), (int(tr.integers(6, 14)), int(tr.integers(3, 6))), float(tr.integers(0, 180)), 0, 360, (72, 76, 80), -1)
    dirt = np.linspace(0, 1, bh)[:, None, None] ** 2.2                # mud splashed up from the well
    dirt = dirt * tr.uniform(0.6, 1.0, (bh, bw, 1))
    tex = tex * (1 - 0.6 * dirt) + np.array([34, 48, 58], np.float32) * 0.6 * dirt
    tex[:, :2] *= 0.6; tex[:, -2:] *= 0.6; tex[:2] *= 0.7; tex[-2:] *= 0.6
    alpha = np.ones((bh, bw), np.float32)
    cv2.fillPoly(alpha, [np.array([[bw - 22, 0], [bw, 0], [bw, 16]], np.int32)], 0)   # a corner snapped off
    tex[18:30, bw - 30:bw - 4] *= 0.75                                # and the crease where it bent
    # lean it over
    ang = 10
    tex *= 0.82                                                       # down in the shadow of the well
    pad = 40
    big_t = np.zeros((bh + 2 * pad, bw + 2 * pad, 3), np.float32)
    big_a = np.zeros((bh + 2 * pad, bw + 2 * pad), np.float32)
    big_t[pad:pad + bh, pad:pad + bw] = tex
    big_a[pad:pad + bh, pad:pad + bw] = alpha
    M = cv2.getRotationMatrix2D((pad + bw / 2, pad + bh / 2), ang, 1)
    rt = cv2.warpAffine(big_t, M, big_t.shape[1::-1], flags=cv2.INTER_NEAREST)
    ra = cv2.warpAffine(big_a, M, big_a.shape[1::-1], flags=cv2.INTER_NEAREST)
    ys, xs = np.nonzero(ra > 0.5)
    rt, ra = rt[ys.min():ys.max() + 1, xs.min():xs.max() + 1], ra[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    hh, ww = ra.shape
    cx = sx(TOLET_X) // 2 * 2 + 10                                   # so the bars fall between the letters
    x0, y0 = cx - ww // 2, BASE - 4 - hh
    before = comp.copy()
    sh = np.zeros((H, W), np.float32)                                 # its shadow on the wall of the well
    sh[y0 - 6:y0 - 6 + hh, x0 + 10:x0 + 10 + ww] = ra
    sh = cv2.GaussianBlur(sh, (0, 0), 5)[..., None]
    comp[:] = comp * (1 - 0.45 * sh)
    reg = comp[y0:y0 + hh, x0:x0 + ww]
    m = ra[..., None] > 0.5
    comp[y0:y0 + hh, x0:x0 + ww] = np.where(m, rt, reg)
    fine[y0:y0 + hh, x0:x0 + ww][ra > 0.5] = 1
    # the railings stay in front of it
    rm = cv2.resize(rail_mask, (W, int(round(BASE * S))), interpolation=cv2.INTER_NEAREST)[-BASE:] > 0
    area = np.zeros((H, W), bool)
    area[y0 - 10:y0 + hh, x0 - 10:x0 + ww + 10] = True
    keep = np.zeros((H, W), bool)
    keep[:BASE] = rm
    keep &= area
    comp[keep] = before[keep]
    fine[keep] = 0


to_let_board()
lit_rng = np.random.default_rng(5)
for _ in range(70):                                            # scattered along the pavement and gutter
    x = int(lit_rng.integers(120, 3200))
    if lit_rng.random() > dscreen(x) * 1.3:
        continue
    y = int(lit_rng.choice([lit_rng.integers(BASE + 20, 640), lit_rng.integers(682, 704)]))
    kind = lit_rng.choice([0, 0, 1, 1, 1, 2, 2, 3, 4, 5])
    if kind == 0:
        can(x, y, [(40, 40, 170), (160, 120, 40), (50, 140, 50), (170, 170, 175)][int(lit_rng.integers(4))])
    elif kind == 1:
        packet(x, y, [(40, 160, 220), (60, 40, 160), (160, 60, 40), (40, 120, 40)][int(lit_rng.integers(4))])
    elif kind == 2:
        newspaper(x, y)
    elif kind == 3:
        bottle(x, y)
    elif kind == 4:
        glass(x, y)
    else:
        takeaway(x, y)

# ---------------- The mattress: dumped flat against the railings, folded in the middle, soaked ----------------


def mattress(x0, x1, yg):
    """Lying on its side-on long edge to us: thick, folded in the middle so both halves bow up, soaked."""
    L = x1 - x0
    D, T, um = 28, 55, 0.5                                           # top face depth, thickness, fold
    cols = np.arange(x0, x1)
    u = (cols - x0) / L
    a = np.abs(u - um) / um                                          # 0 at the fold, 1 at the ends
    rise = 21 * a ** 2                                               # the halves bow up towards the ends
    fold = 13 * np.exp(-((u - um) / 0.04) ** 2)                      # and the top sinks into the fold
    e = np.minimum(cols - x0, x1 - 1 - cols).astype(np.float32)
    rnd = 8 - np.sqrt(np.clip(64 - (8 - np.minimum(e, 8)) ** 2, 0, None))   # rounded corners
    bot = yg - rise * 0.45 - rnd * 0.6
    topf = bot - T + fold - rise * 0.25 + rnd
    topb = topf - D + rnd * 0.6
    sh = np.zeros((H, W), np.float32)                                # shadow and puddle underneath
    cv2.ellipse(sh, ((x0 + x1) // 2, int(yg) + 1), (L // 2 + 24, 12), 0, 0, 360, 1, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), 5)[..., None]
    comp[:] = comp * (1 - 0.6 * sh)
    puddle = np.zeros((H, W), np.float32)
    cv2.ellipse(puddle, (x0 + int(L * 0.45), int(yg) + 10), (L // 2 + 30, 10), 0, 0, 360, 1, -1)
    puddle = cv2.GaussianBlur(puddle, (0, 0), 2)[..., None]
    comp[:] = comp * (1 - 0.45 * puddle) + puddle * np.array([78, 70, 64], np.float32) * 0.45
    top_c = np.array([114, 112, 110], np.float32)                    # BGR: grubby off-white
    side_c = np.array([96, 94, 92], np.float32)
    stripe_c = np.array([104, 86, 76], np.float32)                  # faded blue ticking on the border
    wet = cv2.GaussianBlur(np.random.default_rng(3).random((H // 6, L // 6 + 2)).astype(np.float32), (0, 0), 1.6)
    wet = cv2.resize(wet, (L + 12, H), interpolation=cv2.INTER_CUBIC)
    water = np.array([58, 54, 50], np.float32)
    for i, x in enumerate(cols):
        tb, tf, bt = int(round(topb[i])), int(round(topf[i])), int(round(bot[i]))
        # the fold: the left side of it turns away from the light, the right catches it
        du = u[i] - um
        fs = 1 - 0.5 * np.exp(-((du + 0.012) / 0.014) ** 2) + 0.22 * np.exp(-((du - 0.016) / 0.014) ** 2)
        for y in range(tb, tf):
            v = (y - tb) / max(1, tf - tb)
            c = top_c * (0.8 + 0.25 * v) * fs
            if abs(((i + 20) % 40) - 20) < 2 and abs(v - 0.5) < 0.18:   # tufted buttons
                c = c * 0.62
            comp[y, x] = c
        for y in range(tf, bt):
            v = (y - tf) / max(1, bt - tf)
            base_c = stripe_c if (x // 5) % 2 == 0 else side_c
            comp[y, x] = base_c * (1.08 - 0.5 * v ** 1.6) * fs              # rounded, bulging border
        comp[tf:tf + 2, x] = top_c * 1.2 * fs                                # piping
        comp[max(tb, 0):tb + 1, x] = top_c * 0.95 * fs
        comp[bt - 2:bt, x] = side_c * 0.45
        # soaked: blotches, and the water wicking up from the pavement
        n = bt - tb
        wv = wet[tb:bt, i]
        k = np.clip((wv - 0.5) * 4, 0, 1) * 0.45 + 0.4 * np.linspace(0, 1, n) ** 2
        comp[tb:bt, x] = comp[tb:bt, x] * (1 - k[:, None]) + water * k[:, None]
    # creases running out from the fold across the top
    xm = x0 + L // 2
    for dx, dy in [(-34, 6), (-60, 14), (30, 8), (54, 16)]:
        y0 = int(topb[L // 2] + 4)
        cv2.line(comp, (xm, y0), (xm + dx, y0 + dy), tuple(float(v) for v in top_c * 0.55), 2)
    # an old stain, and streetlight glinting off the wet
    st = np.zeros((H, W), np.float32)
    cv2.ellipse(st, (x0 + int(L * 0.74), int(topf[int(L * 0.74)] + 10)), (30, 11), 4, 0, 360, 1, -1)
    st = cv2.GaussianBlur(st, (0, 0), 3)[..., None]
    comp[:] = comp * (1 - 0.35 * st) + np.array([50, 95, 125], np.float32) * 0.35 * st
    gl = np.random.default_rng(8)
    for _ in range(10):
        i = int(gl.integers(10, L - 30))
        y = int(gl.integers(int(topb[i]) + 3, int(topf[i]) - 2))
        comp[y:y + 2, x0 + i:x0 + i + int(gl.integers(6, 16))] = (165, 172, 178)


MATT_X0, MATT_X1, MATT_Y = 1490, 1910, 612
mattress(MATT_X0, MATT_X1, MATT_Y)

# ---------------- Police tape: one strip across the victim's door ----------------


def police_tape(xa, ya, xb, yb, sag=6):
    """Met tape: white, POLICE in blue, between blocks of blue and white diagonal stripes."""
    th = 20
    L = xb - xa
    tex = np.full((th, L, 3), (205, 205, 200), np.float32)
    x = 0
    while x < L:
        block = 18 if x + 70 <= L else L - x                         # stripes, to the end if no room for a word
        for dx in range(block):
            for y in range(th):
                if ((dx + y) // 4) % 2 == 0:
                    tex[y, x + dx] = (170, 80, 20)
        x += block
        if x + 50 <= L:
            draw_text(tex, "POLICE", x + 2, 5, (170, 80, 20))
        x += 52
    for i in range(L):
        t = i / L
        yc = ya + (yb - ya) * t + sag * np.sin(np.pi * t)
        yt = int(round(yc / 2)) * 2 - th // 2
        comp[yt:yt + th, xa + i] = tex[:, i] * (0.9 + 0.1 * np.sin(i / 23.0))
        fine[yt:yt + th, xa + i] = 1
    return tex


VD0, VD1 = sx(VDOOR_X0), sx(VDOOR_X1)
TAPE_Y = 416
police_tape(VD0 - 22, TAPE_Y, VD1 + 22, TAPE_Y + 6)
for (kx, ky) in [(VD0 - 24, TAPE_Y - 12), (VD1 + 18, TAPE_Y - 6)]:   # knotted round the frame at each end
    comp[ky:ky + 22, kx:kx + 8] = (190, 190, 186)
    comp[ky + 6:ky + 10, kx:kx + 8] = (160, 75, 20)
    fine[ky:ky + 22, kx:kx + 8] = 1
tail = np.array([[VD1 + 22, TAPE_Y + 8], [VD1 + 30, TAPE_Y + 8], [VD1 + 40, TAPE_Y + 52], [VD1 + 32, TAPE_Y + 54]], np.int32)
cv2.fillPoly(comp, [tail], (195, 195, 190))                       # a loose end hanging off the knot
cv2.line(comp, (VD1 + 27, TAPE_Y + 18), (VD1 + 33, TAPE_Y + 40), (160, 75, 20), 3)
fine[TAPE_Y + 6:TAPE_Y + 56, VD1 + 20:VD1 + 42] = 1

# ---------------- Street lamps along the kerb ----------------
LAMPS = [5400, 4600, 3800, 3000, 2200, 1340, 860]
LAMP_FOOT = 702
lamp_mask = np.zeros((H, W), np.float32)
POST = np.array([24, 24, 28], np.float32)


def part(x0, y0, x1, y1, col=POST, hl=True):
    comp[y0:y1, x0:x1] = col
    if hl:
        comp[y0:y1, x0:x0 + max(2, (x1 - x0) // 4)] = col * 2.4
    lamp_mask[y0:y1, x0:x1] = 1


for lx in LAMPS:
    working = dscreen(lx) < 0.55
    if working:
        Y, X = np.mgrid[0:H, max(0, lx - 520):min(W, lx + 520)].astype(np.float32)
        halo = np.exp(-(((X - lx) / 110) ** 2 + ((Y - 92) / 110) ** 2))
        cpool = np.exp(-(((X - lx) / 280) ** 2 + ((Y - 660) / 70) ** 2))
        comp[:, max(0, lx - 520):min(W, lx + 520)] += (halo * 0.35 + cpool * 0.3)[..., None] * WARM
    # base, post, ladder bar, lantern
    part(lx - 24, LAMP_FOOT - 10, lx + 24, LAMP_FOOT)
    part(lx - 18, LAMP_FOOT - 76, lx + 18, LAMP_FOOT - 10)
    part(lx - 21, LAMP_FOOT - 82, lx + 21, LAMP_FOOT - 74)
    part(lx - 13, LAMP_FOOT - 110, lx + 13, LAMP_FOOT - 82)
    part(lx - 8, 140, lx + 8, LAMP_FOOT - 110)
    part(lx - 11, 380, lx + 11, 390)
    part(lx - 34, 150, lx + 34, 156, hl=False)
    part(lx - 38, 146, lx - 30, 156, hl=False)
    part(lx + 30, 146, lx + 38, 156, hl=False)
    part(lx - 10, 128, lx + 10, 142)
    part(lx - 20, 122, lx + 20, 130, hl=False)                        # lantern tray
    m = np.zeros((64, 60), np.uint8)
    cv2.fillPoly(m, [np.array([[0, 0], [59, 0], [48, 63], [11, 63]], np.int32)], 1)
    reg = comp[58:122, lx - 30:lx + 30]
    reg[m > 0] = (WARM * 1.15) if working else (40, 45, 50)
    if not working:
        comp[70:96, lx - 16:lx - 2] = (70, 75, 80)                       # cracked pane
    lamp_mask[58:122, lx - 30:lx + 30][m > 0] = 1
    part(lx - 2, 58, lx + 2, 122, hl=False)                           # glazing bars
    part(lx - 30, 58, lx + 30, 62, hl=False)
    part(lx - 36, 46, lx + 36, 58)                                    # cap
    part(lx - 22, 36, lx + 22, 46)
    part(lx - 6, 18, lx + 6, 36)                                      # finial
    part(lx - 2, 10, lx + 2, 18, hl=False)

comp = np.clip(comp, 0, 255).astype(np.uint8)
cv2.imwrite(OUT + '.full.png', comp)

# ---------------- Pixelate, like the station exterior ----------------
LW, LH, K = W // 4, H // 4, 64
blur = cv2.GaussianBlur(comp, (0, 0), 2)
sharp = cv2.addWeighted(comp, 1.4, blur, -0.4, 0)
low = cv2.resize(sharp, (LW, LH), interpolation=cv2.INTER_AREA)
data = low.reshape(-1, 3).astype(np.float32)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, labels, centers = cv2.kmeans(data, K, None, crit, 3, cv2.KMEANS_PP_CENTERS)
low = centers.astype(np.uint8)[labels.flatten()].reshape(low.shape)
big = cv2.resize(low, (W, H), interpolation=cv2.INTER_NEAREST)
mid = cv2.resize(comp, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
sel = cv2.resize(fine, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST) > 0
pix = mid[sel].astype(np.float32)
mid[sel] = centers.astype(np.uint8)[((pix[:, None] - centers[None]) ** 2).sum(-1).argmin(1)]
mid = cv2.resize(mid, (W, H), interpolation=cv2.INTER_NEAREST)
big = np.where(cv2.resize(sel.astype(np.uint8), (W, H), interpolation=cv2.INTER_NEAREST)[..., None] > 0, mid, big)
cv2.imwrite(OUT + '.big.png', big)
half = cv2.resize(big, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
Image.fromarray(half[..., ::-1]).quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(OUT, optimize=True)

# the lamps on their own, on the same 4px grid, for drawing over Frank as he passes behind them
lm = cv2.resize(lamp_mask, (LW, LH), interpolation=cv2.INTER_AREA) > 0.5
lm = cv2.resize(lm.astype(np.uint8), (W, H), interpolation=cv2.INTER_NEAREST)
rgba = np.dstack([big, lm * 255]).astype(np.uint8)
rgba[lm == 0] = 0
lh = cv2.resize(rgba[:LAMP_FOOT + 2], (W // 2, (LAMP_FOOT + 2) // 2), interpolation=cv2.INTER_NEAREST)
Image.fromarray(lh[..., [2, 1, 0, 3]]).quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(LAMPS_OUT, optimize=True)
print('lamps', LAMPS, 'foot', LAMP_FOOT, 'mattress', MATT_X0, MATT_X1, MATT_Y)
