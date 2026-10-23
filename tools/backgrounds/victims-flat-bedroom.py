"""The victim's bedroom, built in 3D like the other rooms in the flat (laid out after a reference
picture, not traced from it): a plain flat ceiling, posters, pennants and a dartboard on the walls,
the bed under a big window with its venetian blind pulled right up, fairy lights round the window,
and in the back right-hand corner a top-of-the-range 1997 PC on a corner desk (full tower, 17" CRT
with a starfield screensaver, speakers, inkjet printer, CD-ROMs, office chair). Night: lit by the
bedside lamp, the fairy lights and the monitor's glow.

The window's panes are left transparent, so the game can show the night and its rain through them;
the view out (the houses across the street) is written as its own image to sit behind the hole.
Writes the bed as a cut-out (nothing gets behind the corner desk or its chair), and prints the layout numbers the scene needs.
The fairy lights are drawn unlit; the bulbs' positions and colours are written as JSON so the game
can light them over the top and make them twinkle.
Usage: victims-flat-bedroom.py <out.png> <cut-out dir> <window view.png> <fairy lights.json>"""
import sys
import json
import numpy as np
import cv2
from PIL import Image

OUT, CUT_DIR, VIEW_OUT, LIGHTS_OUT = sys.argv[1:5]
W, H = 1920, 980
F, CX, CY, EYE = 900.0, 960.0, 360.0, 1.6           # the living room's camera, so Frank sizes match
HW, CEIL, END = 2.0, 2.5, 4.6                       # half-width, ceiling height, back wall depth (m)
WIN = (-0.55, 1.05, 0.95, 2.1)                      # the window in the back wall: x0, x1, y0, y1
rng = np.random.default_rng(21)


def project(x, y, z):
    return CX + x * F / z, CY - (y - EYE) * F / z


v, u = np.mgrid[0:H, 0:W].astype(np.float32)
dx, dy = (u - CX) / F, -(v - CY) / F
inf = np.float32(1e9)
cands = {
    'floor': np.where(dy < 0, -EYE / np.minimum(dy, -1e-6), inf),
    'ceil': np.where(dy > 0, (CEIL - EYE) / np.maximum(dy, 1e-6), inf),
    'left': np.where(dx < 0, -HW / np.minimum(dx, -1e-6), inf),
    'right': np.where(dx > 0, HW / np.maximum(dx, 1e-6), inf),
    'end': np.full((H, W), END, np.float32),
}
names = list(cands)
stack = np.stack([cands[n] for n in names])
which = stack.argmin(0)
z = stack.min(0)
X, Y, Z = dx * z, EYE + dy * z, z
normals = {'floor': (0, 1, 0), 'ceil': (0, -1, 0), 'left': (1, 0, 0), 'right': (-1, 0, 0), 'end': (0, 0, -1)}


def noise(scale, seed, shape=(H, W)):
    r = np.random.default_rng(seed).random((shape[0] // scale + 2, shape[1] // scale + 2)).astype(np.float32)
    return cv2.resize(r, (shape[1] + scale, shape[0] + scale), interpolation=cv2.INTER_CUBIC)[:shape[0], :shape[1]]


def fbm(a, b, seed, freq=4.0):
    g = cv2.GaussianBlur(np.random.default_rng(seed).random((256, 256)).astype(np.float32), (0, 0), 1.2)
    out = np.zeros_like(a)
    amp = 1.0
    for o in range(4):
        fa = np.mod(a * freq * 2 ** o, 255).astype(np.float32)
        fb = np.mod(b * freq * 2 ** o, 255).astype(np.float32)
        out += cv2.remap(g, fa, fb, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * amp
        amp *= 0.5
    return out / 1.875


C = lambda *rgb: np.array(rgb, np.float32) / 255
albedo = np.zeros((H, W, 3), np.float32)
A = np.where((which == 2) | (which == 3), Z, X)      # position along each wall
on_left, on_right, on_end = which == 2, which == 3, which == 4

# ---- walls: magnolia emulsion, scuffed; skirting ----
wm = on_left | on_right | on_end
paint = C(150, 140, 120) * (0.88 + 0.2 * fbm(A, Y, 7, 2))[..., None]
paint = np.where((Y < 0.12)[..., None], C(150, 144, 128) * np.where(Y > 0.105, 1.15, 0.85)[..., None], paint)
albedo[wm] = paint[wm]
# ---- ceiling: flat, plain, with a ceiling rose and a bare fitting ----
cm = which == 1
albedo[cm] = (C(150, 144, 128) * (0.9 + 0.12 * fbm(X, Z, 21, 3))[..., None])[cm]
albedo[cm & (np.hypot(X - 0, Z - 3.1) < 0.12)] = C(160, 154, 138)
# ---- carpet: oatmeal, a bit grubby ----
fm = which == 0
carpet = C(110, 98, 80) * (0.82 + 0.3 * noise(2, 5))[..., None] * (0.9 + 0.15 * fbm(X, Z, 17, 1.2))[..., None]
albedo[fm] = carpet[fm]


# ---- posters, pennants and the dartboard: small pictures mapped onto the walls ----
def tex(h, w):
    ty, tx = np.mgrid[0:h, 0:w].astype(np.float32)
    return np.zeros((h, w, 4), np.float32) + np.array([0, 0, 0, 1], np.float32), ty / h, tx / w


def poster_football():
    t, ty, tx = tex(80, 60)
    t[..., :3] = np.where((ty > 0.62)[..., None], (0.15, 0.45, 0.2), (0.35, 0.5, 0.7))
    body = (np.abs(tx - 0.5) < 0.13) & (ty > 0.3) & (ty < 0.56)
    t[body, :3] = (0.75, 0.1, 0.1)                                 # red shirt
    t[(np.abs(tx - 0.5) < 0.12) & (ty >= 0.56) & (ty < 0.66), :3] = (0.92, 0.92, 0.9)
    t[(np.abs(tx - 0.45) < 0.035) & (ty >= 0.66) & (ty < 0.85), :3] = (0.8, 0.6, 0.5)
    t[(np.abs(tx - 0.57) < 0.035) & (ty >= 0.66) & (ty < 0.8), :3] = (0.8, 0.6, 0.5)
    t[((tx - 0.5) / 0.08) ** 2 + ((ty - 0.24) / 0.06) ** 2 < 1, :3] = (0.75, 0.55, 0.42)
    t[((tx - 0.72) / 0.06) ** 2 + ((ty - 0.84) / 0.045) ** 2 < 1, :3] = (0.95, 0.95, 0.95)
    t[ty < 0.1, :3] = (0.9, 0.85, 0.2)
    t[(ty < 0.08) & (ty > 0.03) & ((tx * 12) % 1 < 0.6) & (np.abs(tx - 0.5) < 0.4), :3] = (0.2, 0.1, 0.1)
    return t


def poster_band():
    t, ty, tx = tex(80, 56)
    glow = np.exp(-(((tx - 0.5) / 0.35) ** 2 + ((ty - 0.45) / 0.4) ** 2))
    t[..., :3] = np.array([0.06, 0.03, 0.08]) + glow[..., None] * np.array([0.5, 0.15, 0.5])
    fig = (((tx - 0.5) / 0.07) ** 2 + ((ty - 0.3) / 0.06) ** 2 < 1) | ((np.abs(tx - 0.5) < 0.12) & (ty > 0.36) & (ty < 0.8))
    t[fig, :3] = (0.04, 0.02, 0.04)
    t[(np.abs((tx - 0.35) - (ty - 0.5) * 0.9) < 0.03) & (ty > 0.45) & (ty < 0.7), :3] = (0.6, 0.5, 0.2)   # guitar neck
    t[(ty > 0.86) & (ty < 0.95) & ((tx * 9) % 1 < 0.7) & (np.abs(tx - 0.5) < 0.42), :3] = (0.9, 0.9, 0.85)
    return t


def poster_film():
    t, ty, tx = tex(80, 56)
    t[..., :3] = np.array([0.1, 0.07, 0.05]) + (ty[..., None] ** 2) * np.array([0.55, 0.3, 0.05])
    for k, fx in enumerate((0.2, 0.35, 0.5, 0.65, 0.8)):
        hy = 0.48 + 0.04 * (k % 2)
        t[((tx - fx) / 0.05) ** 2 + ((ty - hy) / 0.035) ** 2 < 1, :3] = (0.7, 0.5, 0.4)
        t[(np.abs(tx - fx) < 0.055) & (ty > hy + 0.03) & (ty < hy + 0.2), :3] = [(0.5, 0.2, 0.15), (0.2, 0.3, 0.5), (0.4, 0.4, 0.2)][k % 3]
    t[((tx - 0.5) / 0.12) ** 2 + ((ty - 0.82) / 0.07) ** 2 < 1, :3] = (0.85, 0.82, 0.7)             # a skull in the gold
    t[(ty > 0.05) & (ty < 0.17) & (np.abs(tx - 0.5) < 0.42), :3] = (0.95, 0.75, 0.2)
    return t


def poster_space():
    t, ty, tx = tex(60, 80)
    t[..., :3] = (0.03, 0.04, 0.12)
    stars = np.random.default_rng(4).random(ty.shape) > 0.96
    t[stars, :3] = (0.9, 0.9, 0.95)
    t[((tx - 0.3) / 0.22) ** 2 + ((ty - 0.6) / 0.29) ** 2 < 1, :3] = (0.7, 0.4, 0.2)
    t[((tx - 0.3) / 0.22) ** 2 + ((ty - 0.6) / 0.29) ** 2 < 1, :3] *= (0.6 + 0.4 * tx[((tx - 0.3) / 0.22) ** 2 + ((ty - 0.6) / 0.29) ** 2 < 1] / 0.5)[:, None]
    t[(np.abs(ty - 0.3 - (tx - 0.7) * -0.6) < 0.04) & (tx > 0.6) & (tx < 0.85), :3] = (0.85, 0.85, 0.85)
    return t


def pennant(colour, stripe):
    t, ty, tx = tex(30, 80)
    inside = np.abs(ty - 0.5) < 0.5 * (1 - tx)
    t[..., :3] = colour
    t[(np.abs(ty - 0.5) < 0.08) & (tx > 0.15) & (tx < 0.8), :3] = stripe
    t[tx < 0.06, :3] = (0.85, 0.85, 0.8)
    t[~inside, 3] = 0
    return t


def dartboard():
    t, ty, tx = tex(64, 64)
    r = np.hypot(tx - 0.5, ty - 0.5) * 2
    ang = np.arctan2(ty - 0.5, tx - 0.5)
    seg = (np.floor((ang + np.pi) / (2 * np.pi) * 20) % 2).astype(bool)
    t[..., :3] = np.where(seg[..., None], (0.08, 0.08, 0.08), (0.85, 0.8, 0.6))
    ring = ((r > 0.58) & (r < 0.64)) | ((r > 0.9) & (r < 0.97))
    t[ring, :3] = np.where(seg[ring][:, None], (0.7, 0.1, 0.1), (0.1, 0.5, 0.2))
    t[r < 0.08, :3] = (0.1, 0.5, 0.2)
    t[r < 0.04, :3] = (0.7, 0.1, 0.1)
    t[(r >= 0.97) & (r < 1), :3] = (0.05, 0.05, 0.05)
    t[r >= 1, 3] = 0
    return t


# (wall, a0, a1, y0, y1, picture): along the wall, a runs with z on the side walls and x on the back
PICTURES = [
    ('left', 2.0, 2.5, 1.2, 1.9, poster_football()),
    ('left', 2.68, 3.08, 1.25, 1.65, dartboard()),
    ('left', 3.4, 3.88, 1.3, 1.95, poster_band()),
    ('left', 4.0, 4.45, 1.35, 1.8, poster_football()),
    ('left', 2.0, 2.7, 2.03, 2.28, pennant((0.1, 0.12, 0.35), (0.9, 0.75, 0.2))),
    ('left', 2.95, 3.65, 2.06, 2.31, pennant((0.55, 0.08, 0.08), (0.95, 0.95, 0.9))),
    ('end', -1.75, -1.0, 1.3, 2.05, poster_film()),
    ('end', 1.25, 1.85, 1.38, 1.83, poster_space()),
    ('right', 2.85, 3.25, 1.3, 1.85, poster_band()),
]
for wall, a0, a1, y0, y1, pic in PICTURES:
    on = {'left': on_left, 'right': on_right, 'end': on_end}[wall]
    m = on & (A >= a0) & (A <= a1) & (Y >= y0) & (Y <= y1)
    # as seen facing the wall: on the left wall further back is to the right, on the right wall to the left
    s = (A - a0) / (a1 - a0) if wall != 'right' else (a1 - A) / (a1 - a0)
    tv_ = (y1 - Y) / (y1 - y0)
    ph, pw = pic.shape[:2]
    py = np.clip((tv_ * ph).astype(int), 0, ph - 1)
    px = np.clip((s * pw).astype(int), 0, pw - 1)
    sample = pic[py, px]
    m &= sample[..., 3] > 0.5
    albedo[m] = sample[m][:, :3] * 0.8

# ---- the window: white frame, a mullion and top lights; the blind pulled up into a stack of slats ----
x0w, x1w, y0w, y1w = WIN
in_win = on_end & (X > x0w) & (X < x1w) & (Y > y0w) & (Y < y1w)
FR = 0.06
MID = (x0w + x1w) / 2
BLIND_Y = y1w - FR - 0.2                                          # the bottom of the stack of slats
pane = in_win & (X > x0w + FR) & (X < x1w - FR) & (Y > y0w + FR) & (Y < BLIND_Y) & \
    (np.abs(X - MID) > 0.03) & (np.abs(Y - 1.78) > 0.025)
blind = in_win & (X > x0w + FR) & (X < x1w - FR) & (Y >= BLIND_Y) & (Y < y1w - FR)
cords = in_win & (np.abs(X - (x1w - FR - 0.06)) < 0.006) & (Y > 1.35) & (Y < BLIND_Y)
pane &= ~cords
frame = in_win & ~pane & ~blind & ~cords
albedo[frame] = C(165, 160, 150)
slats = ((BLIND_Y - Y) * 55 % 1 < 0.55)
albedo[blind] = np.where(slats[..., None], C(170, 164, 150), C(120, 114, 100))[blind]
albedo[cords] = C(160, 156, 140)
albedo[blind & (Y < BLIND_Y + 0.012)] = C(110, 104, 92)

# ---------------- lights: the bedside lamp, the monitor, the fairy lights round the window ----------------
LAMP_POS = np.array([-1.78, 1.0, 3.05], np.float32)
WARM = np.array([1.0, 0.72, 0.42], np.float32)
MON_C, MON_ROT = (1.62, 4.22), -45.0                              # the monitor in the corner, facing the room
mca, msa = np.cos(np.radians(MON_ROT)), np.sin(np.radians(MON_ROT))
MON_FACE = np.array([MON_C[0] + 0.25 * msa, 0.98, MON_C[1] - 0.25 * mca], np.float32)
LIGHTS = [(LAMP_POS, WARM, 2.2), (MON_FACE, np.array([0.45, 0.6, 1.0], np.float32), 0.9)]
BULBS = []
FAIRY = [np.array(c, np.float32) for c in [(1, 0.2, 0.2), (0.2, 1, 0.3), (0.3, 0.45, 1), (1, 0.8, 0.2), (1, 0.35, 0.8)]]
path = [(x0w - 0.06, y0w - 0.04), (x0w - 0.06, y1w + 0.05), (x1w + 0.06, y1w + 0.05), (x1w + 0.06, y0w - 0.04)]
k = 0
for (ax_, ay_), (bx_, by_) in zip(path, path[1:]):
    n = int(np.hypot(bx_ - ax_, by_ - ay_) / 0.075)
    for t_ in np.linspace(0, 1, n, endpoint=False):
        sag = 0.025 * np.sin(np.pi * ((t_ * n) % 4) / 4) if ay_ == by_ else 0
        BULBS.append((np.array([ax_ + (bx_ - ax_) * t_, ay_ + (by_ - ay_) * t_ - sag, END - 0.02], np.float32), FAIRY[k % 5]))
        k += 1
for bp, bc in BULBS:
    LIGHTS.append((bp + np.array([0, 0, -0.05], np.float32), bc, 0.035))


def light(Pt, Nt):
    tot = np.zeros(Pt.shape, np.float32)
    for Lp, col, I in LIGHTS:
        L = Lp - Pt
        d2 = (L ** 2).sum(-1)
        lam = np.clip((Nt * L).sum(-1) / np.sqrt(d2 + 1e-9), 0, 1)
        tot += (I * (lam + 0.12) / (1 + d2 * 0.35))[..., None] * col      # plus light bounced round the room
    return tot


AMBIENT = np.array([0.035, 0.04, 0.06], np.float32)
P = np.stack([X, Y, Z], -1)
N = np.zeros((H, W, 3), np.float32)
for i, n in enumerate(names):
    N[which == i] = normals[n]
edge = np.minimum.reduce([np.abs(X + HW), np.abs(X - HW), Y, np.abs(CEIL - Y), np.abs(END - Z) + 9 * (which != 4)])
ao = 0.5 + 0.5 * np.clip(edge / 0.4, 0, 1)
img = albedo * ((light(P, N) + AMBIENT) * ao[..., None])

# ---------------- furniture: drawn with a depth buffer, so each piece covers exactly what's behind it ----------------
OBJ = {}
zbuf = z.copy()
idbuf = np.zeros((H, W), np.uint8)
ORIGIN = np.array([0, EYE, 0], np.float32)


def oid(name):
    return OBJ.setdefault(name, len(OBJ) + 1)


def put(name, ys, xs, t, Pt, Nt, colour, emissive=False):
    keep = t < zbuf[ys, xs]
    ys, xs, t, Pt, Nt = ys[keep], xs[keep], t[keep], Pt[keep], Nt[keep]
    zbuf[ys, xs] = t
    idbuf[ys, xs] = oid(name)
    col = colour(Pt) if callable(colour) else np.broadcast_to(np.array(colour, np.float32), Pt.shape)
    img[ys, xs] = col if emissive else col * (light(Pt, Nt) + AMBIENT)


def poly3(name, pts3, colour, emissive=False):
    """A flat polygon in 3D."""
    pts3 = np.array(pts3, np.float32)
    n = np.cross(pts3[1] - pts3[0], pts3[2] - pts3[0])
    if np.linalg.norm(n) < 1e-9 or (pts3[:, 2] <= 0.05).any():
        return
    n /= np.linalg.norm(n)
    if np.dot(n, pts3[0] - ORIGIN) > 0:
        n = -n
    pts2 = np.array([project(*q) for q in pts3])
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.round(pts2).astype(np.int32)], 1)
    ys, xs = np.nonzero(m)
    if not len(ys):
        return
    r = np.stack([dx[ys, xs], dy[ys, xs], np.ones(len(ys), np.float32)], -1)
    denom = r @ n
    ok = np.abs(denom) > 1e-6
    ys, xs, r, denom = ys[ok], xs[ok], r[ok], denom[ok]
    t = (np.dot(n, pts3[0] - ORIGIN)) / denom
    Pt = ORIGIN + r * t[:, None]
    put(name, ys, xs, t, Pt, np.broadcast_to(n, Pt.shape), colour, emissive)


def rbox(name, cx, cz, w, d, y0, y1, colour, rot=0.0, top=None, front=None):
    """A box turned rot degrees about the vertical; front is the colour of its -z face (local)."""
    ca, sa = np.cos(np.radians(rot)), np.sin(np.radians(rot))

    def pt(ox, oz, yy):
        return (cx + ox * ca - oz * sa, yy, cz + ox * sa + oz * ca)
    hx, hz = w / 2, d / 2
    corners = [(-hx, -hz), (hx, -hz), (hx, hz), (-hx, hz)]
    for i in range(4):
        a0, a1 = corners[i], corners[(i + 1) % 4]
        col = front if (front is not None and i == 0) else colour
        poly3(name, [pt(*a0, y0), pt(*a1, y0), pt(*a1, y1), pt(*a0, y1)], col)
    poly3(name, [pt(*c_, y1) for c_ in corners], colour if top is None else top)


def box(name, x0, x1, y0, y1, z0, z1, colour, top=None):
    rbox(name, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, colour, top=top)


def vcyl(name, cx, cz, r, y0, y1, colour, top=None):
    """An upright cylinder."""
    corners = [(cx + sx * r, yy, cz + sz * r) for yy in (y0, y1) for sx in (-1, 1) for sz in (-1, 1)]
    pr = np.array([project(*q) for q in corners])
    px0, px1 = int(max(0, pr[:, 0].min() - 2)), int(min(W, pr[:, 0].max() + 3))
    py0, py1 = int(max(0, pr[:, 1].min() - 2)), int(min(H, pr[:, 1].max() + 3))
    ys, xs = np.mgrid[py0:py1, px0:px1]
    ys, xs = ys.ravel(), xs.ravel()
    ddx, ddy = dx[ys, xs], dy[ys, xs]
    a = ddx ** 2 + 1
    b = -2 * (ddx * cx + cz)
    c = cx ** 2 + cz ** 2 - r * r
    disc = b * b - 4 * a * c
    ok = disc >= 0
    t = (-b - np.sqrt(np.clip(disc, 0, None))) / (2 * a)
    Pt = np.stack([t * ddx, EYE + t * ddy, t], -1)
    ok &= (Pt[:, 1] >= y0) & (Pt[:, 1] <= y1) & (t > 0)
    Nt = np.stack([Pt[:, 0] - cx, np.zeros_like(t), Pt[:, 2] - cz], -1) / r
    put(name, ys[ok], xs[ok], t[ok], Pt[ok], Nt[ok], colour)
    ang = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    poly3(name, [(cx + r * np.cos(q), y1, cz + r * np.sin(q)) for q in ang], colour if top is None else top)


def zcyl(name, cx, cy, r, z0, z1, colour):
    """A cylinder lying along z (pillows, the turned-down duvet)."""
    corners = [(cx + sx * r, cy + sy * r, zz) for zz in (z0, z1) for sx in (-1, 1) for sy in (-1, 1)]
    pr = np.array([project(*q) for q in corners])
    px0, px1 = int(max(0, pr[:, 0].min() - 2)), int(min(W, pr[:, 0].max() + 3))
    py0, py1 = int(max(0, pr[:, 1].min() - 2)), int(min(H, pr[:, 1].max() + 3))
    ys, xs = np.mgrid[py0:py1, px0:px1]
    ys, xs = ys.ravel(), xs.ravel()
    ddx, ddy = dx[ys, xs], dy[ys, xs]
    a = ddx ** 2 + ddy ** 2
    b = 2 * (-ddx * cx + ddy * (EYE - cy))
    c = cx ** 2 + (EYE - cy) ** 2 - r * r
    disc = b * b - 4 * a * c
    ok = disc >= 0
    t = (-b - np.sqrt(np.clip(disc, 0, None))) / (2 * a)
    Pt = np.stack([t * ddx, EYE + t * ddy, t], -1)
    ok &= (Pt[:, 2] >= z0) & (Pt[:, 2] <= z1) & (t > 0)
    Nt = np.stack([Pt[:, 0] - cx, Pt[:, 1] - cy, np.zeros_like(t)], -1) / r
    put(name, ys[ok], xs[ok], t[ok], Pt[ok], Nt[ok], colour)
    ang = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    for e in (z0, z1):
        poly3(name, [(cx + r * np.cos(q), cy + r * np.sin(q), e) for q in ang], colour)


PINE, PINE_DK = C(150, 100, 52), C(96, 62, 30)
BEIGE, BEIGE_DK = C(176, 170, 146), C(130, 124, 104)


def plaid(Pt):
    """The duvet: navy with a thin white check."""
    g = 0.11
    line = (np.abs(((Pt[:, 0] + 5) % g) - g / 2) > g / 2 - 0.008) | (np.abs(((Pt[:, 2] + 5) % g) - g / 2) > g / 2 - 0.008) | \
        (np.abs(((Pt[:, 1] + 5) % g) - g / 2) > g / 2 - 0.008)
    return np.where(line[:, None], C(150, 150, 160), C(36, 40, 70))


# ---- the bed: head against the left wall, under the window's left half; pine frame with turned posts ----
BZ0, BZ1, BX0, BX1 = 3.25, 4.45, -2.0, -0.05
box('bed', BX0, BX0 + 0.06, 0, 1.0, BZ0, BZ1, PINE)                                       # headboard
box('bed', BX1 - 0.06, BX1, 0, 0.72, BZ0, BZ1, PINE)                                      # footboard
for px_, ph_ in [(BX0 + 0.03, 1.08), (BX1 - 0.03, 0.82)]:
    for pz_ in (BZ0 + 0.03, BZ1 - 0.03):
        vcyl('bed', px_, pz_, 0.04, 0, ph_, PINE_DK)
        vcyl('bed', px_, pz_, 0.055, ph_, ph_ + 0.07, PINE_DK)
box('bed', BX0 + 0.06, BX1 - 0.06, 0.12, 0.32, BZ0, BZ0 + 0.04, PINE)                    # side rail
box('bed', BX0 + 0.06, BX1 - 0.06, 0.32, 0.5, BZ0 + 0.04, BZ1 - 0.04, C(200, 196, 186))  # mattress
box('bed', BX0 + 0.5, BX1 - 0.05, 0.28, 0.6, BZ0 + 0.01, BZ1 - 0.02, plaid)              # duvet, hanging over the side
zcyl('bed', BX0 + 0.55, 0.62, 0.075, BZ0 + 0.01, BZ1 - 0.02, plaid)                       # its turned-down edge
for pz0, pz1 in [(BZ0 + 0.1, 3.84), (3.86, BZ1 - 0.1)]:
    box('bed', BX0 + 0.1, BX0 + 0.44, 0.5, 0.64, pz0, pz1, C(190, 186, 176))               # pillows
    zcyl('bed', BX0 + 0.44, 0.57, 0.07, pz0, pz1, C(190, 186, 176))
# a magazine and a game box on the duvet
rbox('bed', -0.9, 3.75, 0.3, 0.22, 0.6, 0.605, C(200, 60, 40), rot=20)
rbox('bed', -0.6, 3.95, 0.14, 0.19, 0.6, 0.63, C(40, 40, 120), rot=-10)
# ---- bedside table with the lamp, in front of the bed's head ----
box('bedside', -2.0, -1.55, 0, 0.58, 2.83, 3.2, PINE)
box('bedside', -1.552, -1.548, 0.36, 0.52, 2.88, 3.15, PINE_DK)
vcyl('bedside', -1.78, 3.05, 0.05, 0.58, 0.82, C(150, 110, 60))
poly3('lamp', [(-1.92, 1.1, 2.96), (-1.64, 1.1, 2.96), (-1.58, 0.82, 2.96), (-1.98, 0.82, 2.96)], (0.95, 0.75, 0.45), emissive=True)
vcyl('bedside', -1.62, 2.95, 0.035, 0.58, 0.68, C(150, 140, 120))                         # a mug
box('bedside', -1.95, -1.82, 0.58, 0.68, 3.08, 3.18, C(30, 30, 30))                       # radio alarm clock
# ---- chest of drawers, near on the right, with a boombox and a pile of tapes ----
box('chest', 1.55, 2.0, 0, 0.8, 1.95, 2.75, PINE)
for k in range(3):
    poly3('chest', [(1.545, 0.08 + k * 0.24, 2.0), (1.545, 0.08 + k * 0.24, 2.7), (1.545, 0.28 + k * 0.24, 2.7), (1.545, 0.28 + k * 0.24, 2.0)], PINE * 1.08)
    box('chest', 1.535, 1.545, 0.16 + k * 0.24, 0.2 + k * 0.24, 2.3, 2.4, C(60, 50, 30))
box('chest', 1.7, 1.92, 0.8, 0.95, 2.1, 2.45, C(40, 40, 44))
for sz in (2.18, 2.37):
    poly3('chest', [(1.695, 0.87 + 0.045 * np.sin(q), sz + 0.045 * np.cos(q)) for q in np.linspace(0, 2 * np.pi, 16, endpoint=False)], C(20, 20, 22))
box('chest', 1.65, 1.78, 0.8, 0.86, 2.55, 2.68, C(150, 40, 40))
# a shelf above it with boxed games and a trophy
box('chest', 1.8, 2.0, 1.6, 1.62, 2.0, 2.75, PINE_DK)
for k, sz in enumerate(np.arange(2.05, 2.5, 0.07)):
    box('chest', 1.84, 1.98, 1.62, 1.62 + 0.15 + 0.03 * (k % 2), sz, sz + 0.06, [C(160, 40, 40), C(40, 80, 150), C(200, 170, 40), C(60, 120, 60)][k % 4])
vcyl('chest', 1.9, 2.62, 0.025, 1.62, 1.8, C(190, 150, 50))
# ---- the computer, in the back right-hand corner ----
DESK_Y = 0.74
desk = [(2.0, 3.3), (1.35, 3.3), (1.35, 3.72), (1.12, 3.95), (0.95, 3.95), (0.95, 4.6), (2.0, 4.6)]
poly3('desk', [(x_, DESK_Y, z_) for x_, z_ in desk], C(170, 160, 140))                     # light oak-effect top
for (ax_, az_), (bx_, bz_) in zip(desk[:-1], desk[1:]):
    if ax_ == 2.0 and bx_ == 2.0:
        continue
    poly3('desk', [(ax_, DESK_Y - 0.03, az_), (bx_, DESK_Y - 0.03, bz_), (bx_, DESK_Y, bz_), (ax_, DESK_Y, az_)], C(150, 140, 120))
box('desk', 1.37, 2.0, 0, DESK_Y - 0.03, 3.3, 3.33, C(140, 130, 112))                    # end panel
box('desk', 0.95, 0.98, 0, DESK_Y - 0.03, 3.95, 4.6, C(140, 130, 112))
box('desk', 1.4, 1.95, 0.05, DESK_Y - 0.06, 4.5, 4.58, C(50, 46, 40))                    # modesty panel, in shadow
# the monitor: a 17" CRT, beige, its deep back towards the corner, a starfield screensaver on


def monitor_loc(ox, oz):
    return MON_C[0] + ox * mca - oz * msa, MON_C[1] + ox * msa + oz * mca


rbox('desk', *monitor_loc(0, 0.12), 0.3, 0.32, 0.86, 1.08, BEIGE_DK, rot=MON_ROT)        # the tube's back
rbox('desk', *monitor_loc(0, -0.08), 0.44, 0.12, 0.76, 1.2, BEIGE, rot=MON_ROT)          # bezel
rbox('desk', *monitor_loc(0, 0.0), 0.22, 0.2, DESK_Y, 0.78, BEIGE_DK, rot=MON_ROT)        # stand


def starfield(Pt):
    h_ = np.sin(np.floor(Pt[:, 0] * 160) * 12.9898 + np.floor(Pt[:, 1] * 160) * 78.233 + np.floor(Pt[:, 2] * 160) * 37.719) * 43758.5
    star = (h_ - np.floor(h_)) > 0.93
    return np.where(star[:, None], np.array([0.9, 0.92, 1.0], np.float32), np.array([0.03, 0.04, 0.14], np.float32))


sx0, sz0 = monitor_loc(-0.18, -0.142)
sx1, sz1 = monitor_loc(0.18, -0.142)
poly3('desk', [(sx0, 0.82, sz0), (sx1, 0.82, sz1), (sx1, 1.14, sz1), (sx0, 1.14, sz0)], starfield, emissive=True)
lx_, lz_ = monitor_loc(0.17, -0.145)
box('desk', lx_ - 0.006, lx_ + 0.006, 0.785, 0.795, lz_ - 0.006, lz_ + 0.006, C(60, 255, 90))   # power light
# speakers either side, the keyboard and mouse in front, a stack of CD-ROMs, the inkjet on the back wing
for ox in (-0.36, 0.36):
    rbox('desk', *monitor_loc(ox, -0.02), 0.11, 0.13, DESK_Y, 0.98, BEIGE, rot=MON_ROT, front=BEIGE_DK)
rbox('desk', *monitor_loc(0, -0.38), 0.46, 0.16, DESK_Y, DESK_Y + 0.03, BEIGE, rot=MON_ROT, top=C(150, 146, 126))
rbox('desk', *monitor_loc(0.33, -0.38), 0.2, 0.17, DESK_Y, DESK_Y + 0.004, C(30, 40, 90), rot=MON_ROT)
rbox('desk', *monitor_loc(0.33, -0.38), 0.05, 0.08, DESK_Y, DESK_Y + 0.03, BEIGE, rot=MON_ROT)
for k in range(6):                                                                          # CD-ROMs by the tower
    box('desk', 1.3, 1.44, DESK_Y + k * 0.012, DESK_Y + (k + 1) * 0.012 - 0.002, 4.12, 4.26, C(60, 60, 70) if k % 2 else C(150, 160, 175))
box('desk', 1.55, 1.95, DESK_Y, DESK_Y + 0.16, 3.36, 3.66, BEIGE, top=C(120, 116, 100))    # inkjet printer
box('desk', 1.6, 1.9, DESK_Y + 0.16, DESK_Y + 0.17, 3.45, 3.6, C(220, 218, 210))
vcyl('desk', 1.82, 3.62, 0.04, DESK_Y, DESK_Y + 0.05, C(30, 30, 30))                        # joystick
vcyl('desk', 1.82, 3.62, 0.012, DESK_Y + 0.05, DESK_Y + 0.2, C(30, 30, 30))
# the full tower on the desk's back wing: drive bays, a turbo display, the power light
TX, TZ = 1.12, 4.3
TY = DESK_Y
box('desk', TX - 0.11, TX + 0.11, TY, TY + 0.66, TZ - 0.22, TZ + 0.22, BEIGE)
poly3('desk', [(TX - 0.1, TY + 0.62, TZ - 0.222), (TX + 0.1, TY + 0.62, TZ - 0.222), (TX + 0.1, TY + 0.44, TZ - 0.222), (TX - 0.1, TY + 0.44, TZ - 0.222)], BEIGE_DK)
for by in (TY + 0.585, TY + 0.545, TY + 0.505, TY + 0.465):
    poly3('desk', [(TX - 0.085, by, TZ - 0.224), (TX + 0.085, by, TZ - 0.224), (TX + 0.085, by + 0.03, TZ - 0.224), (TX - 0.085, by + 0.03, TZ - 0.224)], BEIGE * 1.05)
poly3('desk', [(TX - 0.06, TY + 0.40, TZ - 0.224), (TX + 0.06, TY + 0.40, TZ - 0.224), (TX + 0.06, TY + 0.415, TZ - 0.224), (TX - 0.06, TY + 0.415, TZ - 0.224)], C(30, 30, 30))   # floppy
poly3('desk', [(TX - 0.08, TY + 0.3, TZ - 0.224), (TX - 0.02, TY + 0.3, TZ - 0.224), (TX - 0.02, TY + 0.34, TZ - 0.224), (TX - 0.08, TY + 0.34, TZ - 0.224)], (0.9, 0.15, 0.1), emissive=True)  # "300" MHz display
poly3('desk', [(TX + 0.04, TY + 0.32, TZ - 0.224), (TX + 0.055, TY + 0.32, TZ - 0.224), (TX + 0.055, TY + 0.335, TZ - 0.224), (TX + 0.04, TY + 0.335, TZ - 0.224)], (0.2, 1.0, 0.3), emissive=True)
# ---- the office chair, swung round towards the room ----
CHX, CHZ, CHR = 1.08, 3.62, -30
for q in np.linspace(0, 2 * np.pi, 5, endpoint=False):
    rbox('chair', CHX + 0.15 * np.cos(q), CHZ + 0.15 * np.sin(q), 0.3, 0.035, 0.03, 0.06, C(25, 25, 28), rot=np.degrees(q))   # a leg of the star
    vcyl('chair', CHX + 0.28 * np.cos(q), CHZ + 0.28 * np.sin(q), 0.025, 0, 0.04, C(20, 20, 20))
vcyl('chair', CHX, CHZ, 0.025, 0.06, 0.42, C(60, 60, 64))
rbox('chair', CHX, CHZ, 0.46, 0.44, 0.42, 0.5, C(36, 38, 46), rot=CHR)
cca, csa = np.cos(np.radians(CHR)), np.sin(np.radians(CHR))
# the back, at the rear edge of the seat (the seat faces the room, so its rear is towards the desk)
rbox('chair', CHX - 0.2 * csa, CHZ + 0.2 * cca, 0.4, 0.06, 0.58, 0.98, C(52, 54, 66), rot=CHR)
vcyl('chair', CHX - 0.2 * csa, CHZ + 0.2 * cca, 0.02, 0.45, 0.58, C(60, 60, 64))
# the fairy lights' bulbs, unlit (the game lights them and makes them twinkle), with a faint glow
# for the average of their twinkling; the lamp's glow; the monitor's glow
fairy = []
for bp, bc in BULBS:
    gx, gy = project(*bp)
    if 0 <= int(gy) < H and 0 <= int(gx) < W and zbuf[int(gy), int(gx)] > bp[2] - 0.05:
        cv2.circle(img, (int(gx), int(gy)), 4, tuple(float(c) * 0.3 for c in bc), -1)
        img += (np.exp(-(((u - gx) ** 2 + (v - gy) ** 2) / (2 * 14 ** 2))) * 0.05)[..., None] * bc
        fairy.append({'x': int(gx) // 4 * 4 - 4, 'y': int(gy) // 4 * 4 - 4,
                      'colour': '#' + ''.join(f'{int(min(1, c) * 255):02x}' for c in bc)})
gx, gy = project(-1.78, 0.98, 2.96)
img += (np.exp(-(((u - gx) / 150) ** 2 + ((v - gy) / 120) ** 2)) * 0.15)[..., None] * WARM
gx, gy = project(*MON_FACE)
img += (np.exp(-(((u - gx) / 110) ** 2 + ((v - gy) / 90) ** 2)) * 0.1)[..., None] * np.array([0.45, 0.6, 1.0], np.float32)

# shadows on the carpet under the bed, the furniture and the chair
sh = np.zeros((H, W), np.float32)
for pts3 in [[(BX0, BZ0 - 0.05), (BX1 + 0.05, BZ0 - 0.05), (BX1 + 0.05, BZ1), (BX0, BZ1)],
             [(-2.0, 2.75), (-1.5, 2.75), (-1.5, 3.25), (-2.0, 3.25)], [(1.3, 3.25), (2.0, 3.25), (2.0, 4.6), (0.9, 4.6), (0.9, 3.9)],
             [(CHX - 0.32, CHZ - 0.32), (CHX + 0.32, CHZ - 0.32), (CHX + 0.32, CHZ + 0.32), (CHX - 0.32, CHZ + 0.32)]]:
    cv2.fillPoly(sh, [np.array([project(x_, 0, z_) for x_, z_ in pts3], np.int32)], 1)
sh = cv2.GaussianBlur(sh, (0, 0), 10) * (idbuf == 0)
img *= (1 - 0.55 * sh)[..., None]

vig = np.clip(1 - (np.hypot((u - CX) / 1500, (v - 470) / 950)) ** 2.2, 0.4, 1)
img *= vig[..., None]
img = 1 - np.exp(-np.clip(img, 0, None) * 1.5)
full = (np.clip(img, 0, 1)[..., ::-1] * 255).astype(np.uint8)
pane_mask = pane & (idbuf == 0)
full_show = full.copy()
full_show[pane_mask] = (40, 20, 10)
cv2.imwrite(OUT + '.full.png', full_show)

# ---------------- pixelate like the other rooms; the panes come out transparent ----------------
LW, LH, K = W // 4, H // 4, 56
sharp = cv2.addWeighted(full, 1.4, cv2.GaussianBlur(full, (0, 0), 2), -0.4, 0)
low = cv2.resize(sharp, (LW, LH), interpolation=cv2.INTER_AREA)
bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16 - 0.5
low = np.clip(low + np.tile(bayer, (LH // 4 + 1, LW // 4 + 1))[:LH, :LW, None] * 7, 0, 255).astype(np.uint8)
low_pane = cv2.resize(pane_mask.astype(np.float32), (LW, LH), interpolation=cv2.INTER_AREA) > 0.5
data = low[~low_pane].reshape(-1, 3).astype(np.float32)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, labels, centers = cv2.kmeans(data, K, None, crit, 3, cv2.KMEANS_PP_CENTERS)
low_q = low.copy()
low_q[~low_pane] = centers.astype(np.uint8)[labels.flatten()]
big = cv2.resize(low_q, (W, H), interpolation=cv2.INTER_NEAREST)
pane_big = cv2.resize(low_pane.astype(np.uint8), (W, H), interpolation=cv2.INTER_NEAREST) > 0
preview = big.copy()
preview[pane_big] = (40, 20, 10)
cv2.imwrite(OUT + '.big.png', preview)
half = cv2.resize(big, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
half_alpha = np.where(cv2.resize(pane_big.astype(np.uint8), (W // 2, H // 2), interpolation=cv2.INTER_NEAREST) > 0, 0, 255).astype(np.uint8)
rgba = np.dstack([half[..., ::-1], half_alpha])
rgba[half_alpha == 0, :3] = 0
Image.fromarray(rgba).save(OUT, optimize=True)

# ---------------- the view out of the window: the houses across the street, at night ----------------
ys_, xs_ = np.nonzero(pane_big)
wx0, wx1, wy0, wy1 = int(xs_.min()), int(xs_.max()) + 1, int(ys_.min()), int(ys_.max()) + 1
vw, vh = wx1 - wx0, wy1 - wy0
vy, vx = np.mgrid[0:vh, 0:vw].astype(np.float32)
view = np.zeros((vh, vw, 3), np.float32)
sky = np.clip(vy / (vh * 0.35), 0, 1) ** 1.5
view[:] = np.array([0.06, 0.06, 0.11], np.float32) * (1 - sky[..., None]) + np.array([0.3, 0.2, 0.13], np.float32) * sky[..., None]
roof = vh * 0.3 + 3 * np.sign(np.sin(vx / 21.0))
houses = vy > roof
brick = np.array([0.08, 0.06, 0.055], np.float32) * (0.8 + 0.3 * noise(3, 91, (vh, vw)))[..., None]
view[houses] = brick[houses]
for cxs in (vw * 0.1, vw * 0.42, vw * 0.74):
    stack_ = (np.abs(vx - cxs) < vw * 0.03) & (vy > roof - vh * 0.08) & ~houses
    view[stack_] = (0.05, 0.04, 0.04)
for k, fx0 in enumerate(np.arange(0.04, 0.96, 0.16)):                                    # two rows of sash windows
    for row, fy0 in enumerate((0.42, 0.66)):
        lit = [(0.5, 0.36, 0.15), (0.03, 0.03, 0.04), (0.03, 0.03, 0.04), (0.15, 0.22, 0.36), (0.03, 0.03, 0.04), (0.45, 0.3, 0.12)][(k + row * 2) % 6]
        win_ = (vx > vw * fx0) & (vx < vw * (fx0 + 0.07)) & (vy > vh * fy0) & (vy < vh * (fy0 + 0.13))
        view[win_] = lit
        view[win_ & (np.abs(vy - vh * (fy0 + 0.065)) < 1.2)] = (0.05, 0.04, 0.04)
lamp_g = np.exp(-(((vx - vw * 0.62) / (vw * 0.1)) ** 2 + ((vy - vh * 0.8) / (vh * 0.15)) ** 2))
view += lamp_g[..., None] * np.array([0.35, 0.22, 0.08], np.float32)                      # a street lamp below the sill
view[(np.abs(vx - vw * 0.62) < 1.5) & (vy > vh * 0.8)] = (0.04, 0.04, 0.04)
view[vy > vh * 0.9] = np.array([0.1, 0.08, 0.07], np.float32)                               # the parked cars' roofs
view *= 0.85
vlow = cv2.resize((np.clip(view, 0, 1)[..., ::-1] * 255).astype(np.uint8), (max(1, vw // 4), max(1, vh // 4)), interpolation=cv2.INTER_AREA)
vhalf = cv2.resize(vlow, (vw // 2, vh // 2), interpolation=cv2.INTER_NEAREST)
cv2.imwrite(VIEW_OUT, vhalf)

# ---------------- cut-outs: exactly the pixels each piece owns ----------------
info = {}
for name in ('bed',):
    m = (idbuf == OBJ[name]).astype(np.float32)
    m = cv2.resize(cv2.resize(m, (LW, LH), interpolation=cv2.INTER_AREA), (W, H), interpolation=cv2.INTER_NEAREST) > 0.5
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cut = np.dstack([big, m * 255]).astype(np.uint8)[y0:y1, x0:x1]
    cut[cut[..., 3] == 0] = 0
    Image.fromarray(cut[..., [2, 1, 0, 3]]).save(f'{CUT_DIR}/{name}.png', optimize=True)
    info[name] = {'x': int(x0), 'y': int(y0)}


def floor_box(x0_, x1_, z0_, z1_):
    pts = [project(x_, 0, z_) for x_ in (x0_, x1_) for z_ in (z0_, z1_)]
    xs_, ys_ = [p_[0] for p_ in pts], [p_[1] for p_ in pts]
    return {'left': int(min(xs_)), 'right': int(max(xs_)), 'top': int(min(ys_)), 'bottom': int(max(ys_))}


info['footprints'] = {
    'bed': floor_box(BX0, BX1 + 0.04, BZ0 - 0.04, BZ1), 'desk': floor_box(0.95, 2.0, 3.3, 4.6),
    'chair': floor_box(CHX - 0.3, CHX + 0.3, CHZ - 0.3, CHZ + 0.3),
}
info['base_y'] = {'bed': int(project(0, 0, BZ0)[1]), 'chair': int(project(0, 0, CHZ)[1])}
WALK_Z0, WALK_Z1 = 4.35, 2.06
walk = [project(*q) for q in [(-1.45, 0, WALK_Z0), (1.3, 0, WALK_Z0), (1.3, 0, WALK_Z1), (-1.3, 0, WALK_Z1)]]
info['walk_px'] = [[round(x_), round(y_)] for x_, y_ in walk]
info['walk_pct'] = ', '.join(f'{x_ / W * 100:.3f}% {(y_ - walk[0][1]) / (walk[2][1] - walk[0][1]) * 100:.0f}%' for x_, y_ in walk)
info['window'] = {'x': wx0, 'y': wy0, 'width': vw, 'height': vh}
with open(LIGHTS_OUT, 'w') as f:
    json.dump(fairy, f)
print(json.dumps(info))
