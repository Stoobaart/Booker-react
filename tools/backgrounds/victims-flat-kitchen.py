"""The victim's kitchen. The window's panes are left transparent for the game's rain, with the view
out written separately. Prints the layout numbers the scene needs.
Usage: victims-flat-kitchen.py <out.png> <cut-out dir> <window view.png>"""
import sys
import json
import numpy as np
import cv2
from PIL import Image

OUT, CUT_DIR, VIEW_OUT = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 1920, 980
F, CX, CY, EYE = 900.0, 960.0, 360.0, 1.6           # the living room's camera, so Frank sizes match
HW, CEIL, END = 1.35, 2.45, 5.0                     # half-width, ceiling height, end wall depth (m)
COUNTER, TOP_Y = 0.6, 0.9                           # worktop depth and height
UP_Y0, UP_Y1, UP_D = 1.45, 2.2, 0.35                # wall cupboards: bottom, top, depth
WIN = (-0.62, 0.62, 1.12, 2.12)                     # the window in the end wall: x0, x1, y0, y1
rng = np.random.default_rng(12)


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

# ---- walls ----
wm = (which == 2) | (which == 3) | (which == 4)
paint = C(132, 128, 96) * (0.85 + 0.25 * fbm(A, Y, 7, 2))[..., None]
nicotine = np.clip((Y - 1.6) / 0.9, 0, 1) * (0.6 + 0.4 * fbm(A, Y, 9, 1.2))
paint = paint * (1 - 0.35 * nicotine[..., None]) + C(96, 76, 40) * 0.35 * nicotine[..., None]
soot = (which == 2) * np.exp(-((Z - 3.2) / 0.45) ** 2) * np.clip((Y - 0.9) / 1.2, 0, 1)
paint *= (1 - 0.55 * soot)[..., None]
tile_band = (Y > TOP_Y) & (Y < UP_Y0)
ta, ty = A / 0.15, (Y - TOP_Y) / 0.15
grout = (np.abs(ta - np.round(ta)) < 0.05) | (np.abs(ty - np.round(ty)) < 0.05)
tcol = C(150, 146, 124) * (0.92 + 0.12 * noise(3, 13))[..., None]
cell = (np.floor(ta) * 7 + np.floor(ty) * 13) % 23
tcol = np.where((cell == 3)[..., None], tcol * 0.8, tcol)                     # odd mismatched tiles
tcol = np.where((cell == 11)[..., None] & (np.abs((ta % 1) - (ty % 1)) < 0.04)[..., None], tcol * 0.5, tcol)  # cracks
tcol = np.where(grout[..., None], C(88, 80, 60), tcol)
col = np.where(tile_band[..., None], tcol, paint)
albedo[wm] = col[wm]
# ---- the window frame ----
x0w, x1w, y0w, y1w = WIN
on_end = which == 4
in_win = on_end & (X > x0w) & (X < x1w) & (Y > y0w) & (Y < y1w)
FR = 0.055
pane = in_win & (X > x0w + FR) & (X < x1w - FR) & (Y > y0w + FR) & (Y < y1w - FR) & \
    (np.abs(X) > 0.025) & (np.abs(Y - 1.8) > 0.022)
frame = in_win & ~pane
albedo[frame] = (C(150, 144, 120) * (0.85 + 0.2 * noise(2, 17))[..., None])[frame]
albedo[on_end & ~in_win & (X > x0w - 0.04) & (X < x1w + 0.04) & (Y > y0w - 0.04) & (Y < y1w + 0.04)] = C(110, 104, 84)
# ---- ceiling: yellowed, with a brown water stain ----
cm = which == 1
ceil_c = C(126, 118, 90) * (0.85 + 0.2 * fbm(X, Z, 21, 3))[..., None]
stain = np.clip(1 - np.hypot(X - 0.7, Z - 4.4) / 0.5 + 0.2 * fbm(X, Z, 23, 5), 0, 1)
ring = np.exp(-((np.hypot(X - 0.7, Z - 4.4) - 0.42) / 0.03) ** 2)
ceil_c = ceil_c * (1 - 0.3 * stain[..., None]) + C(90, 64, 30) * (0.3 * stain + 0.4 * ring)[..., None]
albedo[cm] = ceil_c[cm]
# ---- floor ----
fm = which == 0
fa, fb = (X % 0.3) / 0.3, (Z % 0.3) / 0.3
dia = np.abs(fa - 0.5) + np.abs(fb - 0.5)
lino = np.where((dia < 0.32)[..., None], C(150, 132, 92), C(132, 118, 86))
lino = np.where(((dia > 0.32) & (dia < 0.37))[..., None], C(104, 82, 56), lino)
lino = np.where((dia < 0.1)[..., None], C(112, 92, 62), lino)
lino = np.where(((np.minimum(fa, 1 - fa) < 0.02) | (np.minimum(fb, 1 - fb) < 0.02))[..., None], C(96, 80, 56), lino)
lino *= (0.85 + 0.2 * fbm(X, Z, 31, 2.5))[..., None]
worn = np.exp(-(X / 0.35) ** 2)
lino = lino * (1 - 0.3 * worn[..., None]) + C(120, 116, 104) * 0.3 * worn[..., None]
dirt = np.clip((np.abs(X) - 0.5) / 0.3, 0, 1) * (0.6 + 0.4 * fbm(X, Z, 33, 6))
lino *= (1 - 0.45 * dirt)[..., None]
albedo[fm] = lino[fm]

# ---------------- lighting: one fluorescent tube down the middle of the ceiling ----------------
TUBE_Z0, TUBE_Z1, TUBE_Y = 2.9, 4.1, CEIL - 0.09
TUBE = [(np.array([0, TUBE_Y, tz], np.float32), 1.0 if tz < 3.9 else 0.45) for tz in np.linspace(TUBE_Z0 + 0.1, TUBE_Z1 - 0.1, 7)]
COLD = np.array([0.8, 0.97, 0.9], np.float32)      # greenish-white
AMBIENT = np.array([0.05, 0.06, 0.09], np.float32)  # a little of the night through the window

# what blocks the tube: the wall cupboards (by side: z ranges), the hood, the fridge
BLOCKERS = {-1: [(0.3, 2.85), (3.55, END)], 1: [(0.3, 1.95), (2.9, END)]}


def tube_light(Pt, Nt):
    tot = np.zeros(Pt.shape[:-1], np.float32)
    ax = np.abs(Pt[..., 0])
    side = np.sign(Pt[..., 0])
    for Lp, k in TUBE:
        L = Lp - Pt
        d = np.sqrt((L ** 2).sum(-1)) + 1e-6
        lam = np.clip((Nt * L).sum(-1) / d, 0, 1)
        down = 0.25 + 0.75 * np.clip(L[..., 1] / d, 0, 1)          # the diffuser throws light downwards
        lit = k * lam * down / (1 + d * d * 0.22)
        # shadows of the wall cupboards: where the ray to the tube crosses their front face
        s = 1 - (HW - UP_D) / np.maximum(ax, 1e-3)
        cy = Pt[..., 1] + s * (Lp[1] - Pt[..., 1])
        cz = Pt[..., 2] + s * (Lp[2] - Pt[..., 2])
        blocked = np.zeros_like(lit, bool)
        for sgn, ranges in BLOCKERS.items():
            for z0, z1 in ranges:
                blocked |= (side == sgn) & (ax > HW - UP_D + 0.01) & (cy > UP_Y0) & (cy < UP_Y1) & (cz > z0) & (cz < z1)
        tot += np.where(blocked, lit * 0.12, lit)
        tot += k * 0.07 / (1 + d * d * 0.3)                        # light bounced off every surface
    return tot * 0.8


P = np.stack([X, Y, Z], -1)
N = np.zeros((H, W, 3), np.float32)
for i, n in enumerate(names):
    N[which == i] = normals[n]
edge = np.minimum.reduce([np.abs(X + HW), np.abs(X - HW), Y, np.abs(CEIL - Y), np.abs(END - Z) + 9 * (which != 4)])
ao = 0.45 + 0.55 * np.clip(edge / 0.35, 0, 1)
img = albedo * ((tube_light(P, N)[..., None] * COLD + AMBIENT) * ao[..., None])


# ---------------- furniture (depth-buffered) ----------------
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
    img[ys, xs] = col if emissive else col * (tube_light(Pt, Nt)[..., None] * COLD + AMBIENT)


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


def box(name, x0, x1, y0, y1, z0, z1, colour, top=None):
    """An axis-aligned box from its extents."""
    c = [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]
    for i in range(4):
        (ax_, az_), (bx_, bz_) = c[i], c[(i + 1) % 4]
        poly3(name, [(ax_, y0, az_), (bx_, y0, bz_), (bx_, y1, bz_), (ax_, y1, az_)], colour)
    poly3(name, [(x_, y1, z_) for x_, z_ in c], colour if top is None else top)
    poly3(name, [(x_, y0, z_) for x_, z_ in c], colour)


def vcyl(name, cx, cz, r, y0, y1, colour, top=None, emissive=False):
    """An upright cylinder (bin, kettle, mug, bottle)."""
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
    put(name, ys[ok], xs[ok], t[ok], Pt[ok], Nt[ok], colour, emissive)
    ang = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    poly3(name, [(cx + r * np.cos(q), y1, cz + r * np.sin(q)) for q in ang], colour if top is None else top, emissive)


def face(name, axis, at, a0, a1, y0, y1, colour, emissive=False):
    """A flat rectangle on the plane x=at (axis 'x', spanning z a0..a1) or z=at (spanning x a0..a1)."""
    if axis == 'x':
        poly3(name, [(at, y0, a0), (at, y0, a1), (at, y1, a1), (at, y1, a0)], colour, emissive)
    else:
        poly3(name, [(a0, y0, at), (a1, y0, at), (a1, y1, at), (a0, y1, at)], colour, emissive)


OAK, OAK_DK = C(118, 78, 36), C(70, 44, 20)
WORKTOP = C(118, 110, 86)
ENAMEL = C(176, 172, 150)
BRASS = C(150, 120, 60)


def doors(name, axis, at, toward, start, end, y0, y1, n, knob='top'):
    """A run of panelled oak doors on a cupboard front: frames, a raised panel, a gap between each."""
    w = (end - start) / n
    for i in range(n):
        a0, a1 = start + i * w + 0.006, start + (i + 1) * w - 0.006
        face(name, axis, at + toward * 0.004, a0, a1, y0 + 0.006, y1 - 0.006, OAK * 0.85)
        pw, ph = (a1 - a0) * 0.14, (y1 - y0) * 0.1
        face(name, axis, at + toward * 0.008, a0 + pw, a1 - pw, y0 + ph, y1 - ph, OAK)
        face(name, axis, at + toward * 0.006, a0 + pw - 0.012, a0 + pw, y0 + ph, y1 - ph, OAK_DK)   # panel shadow
        ka = a1 - 0.05 if i % 2 == 0 else a0 + 0.05
        ky = y1 - 0.08 if knob == 'top' else y0 + 0.08
        face(name, axis, at + toward * 0.016, ka - 0.012, ka + 0.012, ky - 0.012, ky + 0.012, BRASS)


L_FRONT, R_FRONT, E_FRONT = -HW + COUNTER, HW - COUNTER, END - COUNTER


class Hinged:
    """A door on a vertical hinge at (hx, hz) in a side wall's front. Closed, it runs along z (s: the way its free
    edge lies) with its face outwards (o: +1 on the left side, -1 on the right); opening swings the free edge out
    into the aisle. Points on it are (u: from the hinge, y, w: out from its back)."""

    def __init__(self, name, hx, hz, s, o, deg):
        q = np.radians(deg)
        self.name, self.h = name, np.array([hx, hz], np.float32)
        a0, n0 = np.array([0, s], np.float32), np.array([o, 0], np.float32)
        self.a, self.n = a0 * np.cos(q) + n0 * np.sin(q), n0 * np.cos(q) - a0 * np.sin(q)

    def pt(self, u, y, w):
        x_, z_ = self.h + u * self.a + w * self.n
        return (float(x_), y, float(z_))

    def face(self, u0, u1, y0, y1, w, colour, emissive=False):
        poly3(self.name, [self.pt(u0, y0, w), self.pt(u1, y0, w), self.pt(u1, y1, w), self.pt(u0, y1, w)], colour, emissive)

    def slab(self, u0, u1, y0, y1, w0, w1, colour, emissive=False):
        for w in (w0, w1):
            self.face(u0, u1, y0, y1, w, colour, emissive)
        for u in (u0, u1):
            poly3(self.name, [self.pt(u, y0, w0), self.pt(u, y0, w1), self.pt(u, y1, w1), self.pt(u, y1, w0)], colour, emissive)
        for y in (y0, y1):
            poly3(self.name, [self.pt(u0, y, w0), self.pt(u1, y, w0), self.pt(u1, y, w1), self.pt(u0, y, w1)], colour, emissive)
# ---- left run: cupboards, then the cooker, then cupboards to the corner ----
for z0, z1, n in [(0.3, 2.9, 5), (3.5, E_FRONT, 2)]:
    box('units', -HW, L_FRONT, 0.1, TOP_Y - 0.04, z0, z1, OAK_DK)
    box('units', -HW, L_FRONT - 0.05, 0, 0.1, z0, z1, C(30, 22, 14))                       # plinth, set back
    doors('units', 'x', L_FRONT, 1, z0, z1, 0.12, TOP_Y - 0.06, n)
box('units', -HW, L_FRONT + 0.03, TOP_Y - 0.04, TOP_Y, 0.3, END, WORKTOP)
# the cooker: white enamel gone grey, a dark oven window, four rings, a backguard of knobs
CK0, CK1 = 2.9, 3.5
box('cooker', -HW, L_FRONT + 0.01, 0, TOP_Y - 0.02, CK0, CK1, ENAMEL)
face('cooker', 'x', L_FRONT + 0.015, CK0 + 0.06, CK1 - 0.06, 0.12, 0.62, ENAMEL * 0.85)
face('cooker', 'x', L_FRONT + 0.02, CK0 + 0.12, CK1 - 0.12, 0.22, 0.5, C(16, 14, 12))       # oven window
face('cooker', 'x', L_FRONT + 0.022, CK0 + 0.1, CK1 - 0.1, 0.56, 0.585, C(120, 120, 116))   # handle
face('cooker', 'x', L_FRONT + 0.015, CK0 + 0.06, CK1 - 0.06, 0.68, 0.84, ENAMEL * 0.8)     # grill
box('cooker', -HW, L_FRONT + 0.01, TOP_Y - 0.02, TOP_Y, CK0, CK1, ENAMEL * 0.9)
for (rx_, rz_) in [(-0.95, 3.05), (-0.95, 3.35), (-1.17, 3.05), (-1.17, 3.35)]:
    poly3('cooker', [(rx_ + 0.075 * np.cos(q), TOP_Y + 0.003, rz_ + 0.075 * np.sin(q)) for q in np.linspace(0, 2 * np.pi, 16, endpoint=False)], C(26, 24, 22))
box('cooker', -HW, -HW + 0.08, TOP_Y, TOP_Y + 0.2, CK0, CK1, ENAMEL * 0.9)
for kz in np.linspace(CK0 + 0.08, CK1 - 0.08, 5):
    face('cooker', 'x', -HW + 0.085, kz - 0.018, kz + 0.018, TOP_Y + 0.07, TOP_Y + 0.12, C(40, 38, 36))
box('cooker', -1.25, -1.1, TOP_Y, TOP_Y + 0.07, 3.28, 3.42, C(60, 58, 56))                 # a pan left on it
# grease down the cooker's front
grease = (idbuf == OBJ['cooker']) & (noise(3, 61) > 0.62)
img[grease] *= 0.75
# ---- right run: cupboards, the fridge, more cupboards ----
box('units', R_FRONT, HW, 0.1, TOP_Y - 0.04, 0.3, 1.95, OAK_DK)
box('units', R_FRONT + 0.05, HW, 0, 0.1, 0.3, 1.95, C(30, 22, 14))
doors('units', 'x', R_FRONT, -1, 0.3, 1.95, 0.12, TOP_Y - 0.06, 3)
box('units', R_FRONT - 0.03, HW, TOP_Y - 0.04, TOP_Y, 0.3, 1.95, WORKTOP)
FR0, FR1, FR_TOP = 1.95, 2.8, 1.78
FR_IN = 1.2                                          # the fridge below, the freezer above
box('fridge', R_FRONT - 0.02, HW, FR_IN, FR_TOP, FR0, FR1, ENAMEL * 0.95)
box('fridge', R_FRONT - 0.02, HW, 0, 0.06, FR0, FR1, ENAMEL * 0.95)
for z0_, z1_ in ((FR0, FR0 + 0.03), (FR1 - 0.03, FR1)):
    box('fridge', R_FRONT - 0.02, HW, 0.06, FR_IN, z0_, z1_, ENAMEL * 0.95)
box('fridge', HW - 0.03, HW, 0.06, FR_IN, FR0, FR1, ENAMEL * 0.95)
face('fridge', 'x', R_FRONT - 0.025, FR0 + 0.01, FR1 - 0.01, FR_IN + 0.02, FR_TOP - 0.01, ENAMEL)  # freezer door
face('fridge', 'x', R_FRONT - 0.035, FR0 + 0.03, FR0 + 0.05, 1.3, 1.6, C(150, 150, 146))           # its handle
face('fridge', 'x', R_FRONT - 0.03, FR0 + 0.6, FR0 + 0.78, 1.3, 1.6, C(170, 60, 50))              # takeaway menu
# inside, lit by its bulb: white liner, two glass shelves, and a boutique birthday cake on its gold board
FR_BULB = np.array([1.1, 1.08, 2.45], np.float32)


def fridge_lit(colour):
    def shade(Pt):
        d2 = ((Pt - FR_BULB) ** 2).sum(-1)
        return np.array(colour, np.float32) * (0.45 + 0.8 * np.exp(-d2 / 0.35))[:, None]
    return shade


LINER = C(215, 220, 215)
face('fridge-inside', 'z', FR0 + 0.031, R_FRONT - 0.02, HW - 0.03, 0.06, FR_IN, fridge_lit(LINER), emissive=True)
face('fridge-inside', 'z', FR1 - 0.031, R_FRONT - 0.02, HW - 0.03, 0.06, FR_IN, fridge_lit(LINER), emissive=True)
face('fridge-inside', 'x', HW - 0.031, FR0 + 0.03, FR1 - 0.03, 0.06, FR_IN, fridge_lit(LINER * 0.92), emissive=True)
poly3('fridge-inside', [(R_FRONT - 0.02, 0.061, FR0), (HW, 0.061, FR0), (HW, 0.061, FR1), (R_FRONT - 0.02, 0.061, FR1)], fridge_lit(LINER * 0.9), emissive=True)
poly3('fridge-inside', [(R_FRONT - 0.02, FR_IN - 0.001, FR0), (HW, FR_IN - 0.001, FR0), (HW, FR_IN - 0.001, FR1), (R_FRONT - 0.02, FR_IN - 0.001, FR1)], fridge_lit(LINER), emissive=True)
for sy in (0.45, 0.8):
    poly3('fridge-inside', [(R_FRONT + 0.06, sy, FR0 + 0.03), (HW - 0.03, sy, FR0 + 0.03), (HW - 0.03, sy, FR1 - 0.03), (R_FRONT + 0.06, sy, FR1 - 0.03)],
          fridge_lit(C(170, 195, 200)), emissive=True)
    poly3('fridge-inside', [(R_FRONT + 0.06, sy - 0.008, FR0 + 0.03), (R_FRONT + 0.06, sy, FR0 + 0.03), (R_FRONT + 0.06, sy, FR1 - 0.03), (R_FRONT + 0.06, sy - 0.008, FR1 - 0.03)],
          fridge_lit(C(120, 160, 170)), emissive=True)
CAKE_X, CAKE_Z = 0.86, 2.64                         # far enough in that the fridge's near side doesn't hide it
vcyl('cake', CAKE_X, CAKE_Z, 0.108, 0.45, 0.46, fridge_lit(C(210, 170, 70)), emissive=True)          # gold board
vcyl('cake', CAKE_X, CAKE_Z, 0.088, 0.46, 0.55, fridge_lit(C(245, 240, 232)), emissive=True)          # bottom tier, white
vcyl('cake', CAKE_X, CAKE_Z, 0.09, 0.475, 0.5, fridge_lit(C(210, 40, 110)), emissive=True)            # its ribbon
vcyl('cake', CAKE_X, CAKE_Z, 0.092, 0.54, 0.555, fridge_lit(C(250, 250, 245)), emissive=True)         # piping
vcyl('cake', CAKE_X, CAKE_Z, 0.06, 0.555, 0.625, fridge_lit(C(230, 90, 150)), emissive=True)         # top tier, pink
vcyl('cake', CAKE_X, CAKE_Z, 0.063, 0.617, 0.63, fridge_lit(C(250, 250, 245)), emissive=True)
for k, q in enumerate(np.linspace(0, 2 * np.pi, 6, endpoint=False)):                                         # candles
    vcyl('cake', CAKE_X + 0.035 * np.cos(q), CAKE_Z + 0.035 * np.sin(q), 0.006, 0.63, 0.68,
         fridge_lit([C(120, 170, 240), C(250, 220, 90)][k % 2]), emissive=True)
box('units', R_FRONT, HW, 0.1, TOP_Y - 0.04, FR1, E_FRONT, OAK_DK)
box('units', R_FRONT + 0.05, HW, 0, 0.1, FR1, E_FRONT, C(30, 22, 14))
doors('units', 'x', R_FRONT, -1, FR1, E_FRONT, 0.12, TOP_Y - 0.06, 3)
box('units', R_FRONT - 0.03, HW, TOP_Y - 0.04, TOP_Y, FR1, END, WORKTOP)
# ---- the end run under the window, with the sink ----
box('units', -HW, HW, 0.1, TOP_Y - 0.04, E_FRONT, END, OAK_DK)
box('units', -HW, HW, 0, 0.1, E_FRONT + 0.05, END, C(30, 22, 14))
doors('units', 'z', E_FRONT, -1, L_FRONT, R_FRONT, 0.12, TOP_Y - 0.06, 3)
box('units', -HW, HW, TOP_Y - 0.04, TOP_Y, E_FRONT - 0.03, END, WORKTOP)
poly3('sink', [(-0.42, TOP_Y + 0.001, 4.48), (0.42, TOP_Y + 0.001, 4.48), (0.42, TOP_Y + 0.001, 4.92), (-0.42, TOP_Y + 0.001, 4.92)], C(90, 92, 94))
poly3('sink', [(-0.36, TOP_Y + 0.002, 4.52), (0.0, TOP_Y + 0.002, 4.52), (0.0, TOP_Y + 0.002, 4.86), (-0.36, TOP_Y + 0.002, 4.86)], C(20, 20, 22))
poly3('sink', [(0.04, TOP_Y + 0.002, 4.52), (0.38, TOP_Y + 0.002, 4.52), (0.38, TOP_Y + 0.002, 4.86), (0.04, TOP_Y + 0.002, 4.86)], C(70, 72, 74))
vcyl('sink', -0.18, 4.93, 0.018, TOP_Y, TOP_Y + 0.26, C(140, 140, 140))                   # tap
box('sink', -0.19, -0.17, TOP_Y + 0.22, TOP_Y + 0.25, 4.78, 4.93, C(140, 140, 140))
for k in range(5):                                                                     # dirty plates stacked in the sink
    poly3('sink', [(-0.18 + 0.12 * np.cos(q), TOP_Y + 0.02 + k * 0.018, 4.69 + 0.12 * np.sin(q)) for q in np.linspace(0, 2 * np.pi, 16, endpoint=False)], C(170, 168, 150) * (0.9 - 0.05 * k))
# ---- wall cupboards: both sides, and either side of the window; the cooker hood ----
CB_W = (2.85 - 0.3) / 5
CB0, CB1 = 0.3 + 3 * CB_W, 2.85                     # the last two doors before the hood open (drawn with the states)
for z0, z1, n in [(0.3, CB0, 3), (3.55, END, 3)]:
    box('wall-units', -HW, -HW + UP_D, UP_Y0, UP_Y1, z0, z1, OAK_DK)
    doors('wall-units', 'x', -HW + UP_D, 1, z0, z1, UP_Y0 + 0.01, UP_Y1 - 0.01, n, knob='bottom')
# behind them, hollow: a shelf, and next to nothing on it
box('wall-units', -HW, -HW + UP_D, UP_Y0, UP_Y0 + 0.02, CB0, CB1, OAK_DK)
box('wall-units', -HW, -HW + UP_D, UP_Y1 - 0.02, UP_Y1, CB0, CB1, OAK_DK)
box('wall-units', -HW, -HW + UP_D, UP_Y0, UP_Y1, CB1 - 0.02, CB1, OAK_DK)
face('cupboard-inside', 'x', -HW + 0.005, CB0, CB1, UP_Y0, UP_Y1, C(150, 132, 100))
box('cupboard-inside', -HW, -HW + UP_D - 0.03, 1.81, 1.83, CB0, CB1 - 0.02, OAK)
vcyl('cupboard-inside', -1.15, 2.3, 0.038, UP_Y0 + 0.02, UP_Y0 + 0.13, C(70, 110, 170), top=C(150, 150, 150))   # a tin of beans
box('cupboard-inside', -1.25, -1.1, UP_Y0 + 0.02, UP_Y0 + 0.16, 2.55, 2.68, C(180, 40, 40))                   # teabags
vcyl('cupboard-inside', -1.14, 2.2, 0.04, 1.83, 1.95, C(150, 110, 60), top=C(200, 60, 40))                   # a jar of jam
box('wall-units', HW - UP_D, HW, UP_Y0, UP_Y1, FR1 + 0.1, END, OAK_DK)
box('wall-units', HW - UP_D, HW, UP_Y0, UP_Y1, 0.3, FR0, OAK_DK)
doors('wall-units', 'x', HW - UP_D, -1, 0.3, FR0, UP_Y0 + 0.01, UP_Y1 - 0.01, 3, knob='bottom')
# a calendar hung on the cupboard door nearest the fridge: a picture over the month, one date ringed in red
CAL = (1.5, 1.85, 1.6, 2.12)                        # z0, z1, y0, y1


def calendar(Pt):
    s_ = (CAL[1] - Pt[:, 2]) / (CAL[1] - CAL[0])     # left to right, seen from the room
    t_ = (CAL[3] - Pt[:, 1]) / (CAL[3] - CAL[2])
    col = np.zeros(Pt.shape, np.float32) + C(225, 222, 210)
    pic = t_ < 0.45
    col[pic] = np.where((t_[pic] > 0.28 - 0.06 * np.sin(s_[pic] * 5))[:, None], C(70, 130, 60), C(110, 160, 220))
    col[(t_ > 0.46) & (t_ < 0.55)] = C(160, 40, 40)                                 # the month
    grid = (t_ >= 0.58) & (t_ < 0.97)
    row, cl = (t_ - 0.58) / 0.39 * 5, s_ * 7
    lines = grid & (((row % 1) < 0.12) | ((cl % 1) < 0.1))
    col[lines] = C(150, 146, 136)
    ring = grid & (np.floor(row) == 2) & (np.floor(cl) == 4) & (((row % 1) < 0.25) | ((row % 1) > 0.85) | ((cl % 1) < 0.22) | ((cl % 1) > 0.85))
    col[ring] = C(200, 30, 30)
    col[t_ < 0.025] = C(60, 60, 60)                                               # the wire binding
    return col


face('calendar', 'x', HW - UP_D - 0.02, CAL[0], CAL[1], CAL[2], CAL[3], calendar)
box('wall-units', HW - UP_D, HW, FR_TOP + 0.08, UP_Y1, FR0, FR1 + 0.1, OAK_DK)
doors('wall-units', 'x', HW - UP_D, -1, FR0, FR1 + 0.1, FR_TOP + 0.09, UP_Y1 - 0.01, 2, knob='bottom')
doors('wall-units', 'x', HW - UP_D, -1, FR1 + 0.1, END, UP_Y0 + 0.01, UP_Y1 - 0.01, 3, knob='bottom')
box('wall-units', -HW, HW, UP_Y1 - 0.02, CEIL, END - 0.04, END, C(120, 116, 88))           # the bulkhead over the window
for x0_, x1_ in [(-HW + UP_D, -0.75), (0.75, HW - UP_D)]:
    box('wall-units', x0_, x1_, UP_Y0, UP_Y1, END - UP_D, END, OAK_DK)
    doors('wall-units', 'z', END - UP_D, -1, x0_, x1_, UP_Y0 + 0.01, UP_Y1 - 0.01, 1, knob='bottom')
box('hood', -HW, -HW + 0.48, 1.55, 1.68, 2.85, 3.55, C(110, 106, 92))
box('hood', -HW, -HW + 0.48, 1.53, 1.55, 2.86, 3.54, C(50, 46, 38))
# ---- the window sill, and the clutter: kettle, mugs, an ashtray, empty bottles, a dish rack ----
box('clutter', x0w - 0.04, x1w + 0.04, y0w - 0.03, y0w, END - 0.1, END, C(140, 134, 110))
vcyl('clutter', -1.05, 4.05, 0.09, TOP_Y, TOP_Y + 0.2, C(150, 146, 136), top=C(80, 78, 74))  # kettle
box('clutter', -1.0, -0.95, TOP_Y + 0.12, TOP_Y + 0.16, 3.98, 4.12, C(30, 30, 30))
for mx, mz, mc in [(-0.98, 4.35, C(150, 40, 30)), (-1.12, 4.42, C(200, 196, 180)), (0.6, 4.7, C(40, 80, 60))]:
    vcyl('clutter', mx, mz, 0.04, TOP_Y, TOP_Y + 0.1, mc, top=C(30, 20, 12))
for bx_, bc in [(0.8, C(40, 70, 40)), (0.9, C(60, 40, 20)), (0.97, C(40, 70, 40)), (1.05, C(140, 140, 120))]:
    vcyl('clutter', bx_, 4.82, 0.035, TOP_Y, TOP_Y + 0.3, bc)
    vcyl('clutter', bx_, 4.82, 0.013, TOP_Y + 0.3, TOP_Y + 0.38, bc)
vcyl('clutter', 0.62, 3.6, 0.06, TOP_Y, TOP_Y + 0.025, C(80, 80, 80), top=C(50, 48, 46))   # ashtray
for k in range(6):                                                                   # dish rack beside the sink
    poly3('clutter', [(0.46, TOP_Y, 4.55 + k * 0.05), (0.72, TOP_Y, 4.55 + k * 0.05), (0.72, TOP_Y + 0.2, 4.55 + k * 0.05), (0.46, TOP_Y + 0.2, 4.55 + k * 0.05)],
          C(150, 150, 140) if k % 2 else C(130, 120, 100))
box('clutter', -1.3, -1.12, TOP_Y, TOP_Y + 0.22, 4.6, 4.75, C(150, 120, 40))              # cornflakes
# ---- the pedal bin on the floor, overflowing ----
BIN_X, BIN_Z, BIN_R, BIN_H = 0.48, 3.75, 0.15, 0.5
vcyl('bin', BIN_X, BIN_Z, BIN_R, 0.0, BIN_H, C(140, 140, 136), top=C(40, 40, 42))
vcyl('bin', BIN_X, BIN_Z, BIN_R + 0.012, BIN_H - 0.03, BIN_H + 0.04, C(120, 120, 116), top=C(110, 110, 106))
for k, (ox, oz, rr, hh, cc) in enumerate([(-0.03, 0.01, 0.08, 0.1, C(190, 186, 170)), (0.05, -0.04, 0.05, 0.13, C(160, 40, 30)),
                                           (-0.06, -0.05, 0.05, 0.08, C(60, 60, 64))]):
    vcyl('bin', BIN_X + ox, BIN_Z + oz, rr, BIN_H + 0.04, BIN_H + 0.04 + hh, cc)
# ---- the fluorescent fitting ----
box('fitting', -0.12, 0.12, CEIL - 0.09, CEIL, TUBE_Z0, TUBE_Z1, C(120, 116, 96))
TUBE_COL = np.array([0.88, 1.0, 0.93], np.float32)
poly3('fitting', [(-0.1, CEIL - 0.095, TUBE_Z0 + 0.03), (0.1, CEIL - 0.095, TUBE_Z0 + 0.03), (0.1, CEIL - 0.095, TUBE_Z1 - 0.03), (-0.1, CEIL - 0.095, TUBE_Z1 - 0.03)], TUBE_COL, emissive=True)
fit = idbuf == OBJ['fitting']
dim_end = fit & (zbuf > 3.85)                                                    # depth along the ray is z
img[dim_end] *= np.array([0.45, 0.42, 0.36], np.float32)                                       # the blackened end
flies = fit & (noise(2, 71) > 0.8)
img[flies] *= 0.4
# ---------------- the doors that open: the fridge's and the cupboards' before the hood ----------------
FRIDGE_ANGLES, CUPBOARD_ANGLES = (25, 55, 85, 110), (25, 50, 75, 90)


def fridge_door(deg):
    d = Hinged('fridge-door', R_FRONT - 0.02, FR1 - 0.005, -1, -1, deg)
    L = FR1 - FR0 - 0.01                                                   # u runs from the hinge to the handle
    d.slab(0.005, L, 0.02, FR_IN, 0, 0.04, ENAMEL)
    d.face(0.005, L, 0.02, FR_IN, 0.041, ENAMEL)
    at = lambda a_: L + 0.005 - a_                                         # where a point FR0 + a_ along used to be
    d.face(at(0.05), at(0.03), 0.75, 1.12, 0.05, C(150, 150, 146))         # handle
    d.face(at(0.55), at(0.25), 0.72, 1.02, 0.044, C(200, 196, 180))        # the son's drawing under magnets
    for (a0_, a1_, y0_, y1_, cc) in [(0.3, 0.4, 0.75, 0.85, C(40, 120, 40)), (0.42, 0.5, 0.86, 0.96, C(200, 170, 30)),
                                     (0.32, 0.46, 0.9, 0.93, C(30, 60, 160)), (0.36, 0.39, 0.85, 0.9, C(150, 40, 30))]:
        d.face(at(a1_), at(a0_), y0_, y1_, 0.047, cc)
    # inside it: a grey liner, two door shelves, and half a pint of milk
    d.face(0.04, L - 0.04, 0.06, FR_IN - 0.04, -0.001, fridge_lit(C(200, 204, 198)), emissive=True)
    for y0_ in (0.25, 0.7):
        d.slab(0.06, L - 0.06, y0_, y0_ + 0.07, -0.08, -0.002, fridge_lit(C(150, 175, 185)), emissive=True)
    mx, _, mz = d.pt(0.2, 0, -0.045)
    vcyl('fridge-door', mx, mz, 0.03, 0.32, 0.5, fridge_lit(C(235, 235, 228)), top=fridge_lit(C(40, 140, 60)), emissive=True)


def cupboard_doors(deg):
    ph, pw = (UP_Y1 - UP_Y0 - 0.02) * 0.1, (CB_W - 0.012) * 0.14
    for k in range(2):
        d = Hinged('cupboard-doors', -HW + UP_D, CB0 + (k + 1) * CB_W, -1, 1, deg)
        u0, u1, y0, y1 = 0.006, CB_W - 0.006, UP_Y0 + 0.016, UP_Y1 - 0.016
        d.slab(u0, u1, y0, y1, 0, 0.02, OAK * 0.85)
        d.face(u0 + pw, u1 - pw, y0 + ph, y1 - ph, 0.024, OAK)
        d.face(u1 - pw, u1 - pw + 0.012, y0 + ph, y1 - ph, 0.022, OAK_DK)
        d.face(u1 - 0.062, u1 - 0.038, y0 + 0.068, y0 + 0.092, 0.032, BRASS)   # knob, by the free edge


base = img.copy(), zbuf.copy(), idbuf.copy()


def render(fridge_deg=0, cupboard_deg=0):
    """The room with the doors at these angles, toned like the background."""
    global img, zbuf, idbuf
    img, zbuf, idbuf = (b.copy() for b in base)
    fridge_door(fridge_deg)
    cupboard_doors(cupboard_deg)
    # the fridge's light spilling out across the floor and the units opposite, as the door opens
    fx, fy = project(0.5, 0.2, 2.45)
    img += (np.exp(-(((u - fx) / 150) ** 2 + ((v - fy) / 120) ** 2)) * 0.06 * np.sin(np.radians(min(fridge_deg, 90))))[..., None] * C(230, 240, 235)
    # a glow round the tube, the light's haze in the air
    gx0, gy0 = project(0, TUBE_Y, TUBE_Z0)
    gx1, gy1 = project(0, TUBE_Y, TUBE_Z1)
    for t_ in np.linspace(0, 1, 9):
        gx, gy = gx0 + (gx1 - gx0) * t_, gy0 + (gy1 - gy0) * t_
        img += (np.exp(-(((u - gx) / 120) ** 2 + ((v - gy) / 60) ** 2)) * (0.03 if t_ < 0.8 else 0.012))[..., None] * COLD

    # shadows on the floor round the bin and under the units
    sh = np.zeros((H, W), np.float32)
    for (cx_, cz_, rx, rz) in [(BIN_X, BIN_Z, 0.2, 0.2)]:
        pts = np.array([project(cx_ + rx * np.cos(q), 0, cz_ + rz * np.sin(q)) for q in np.linspace(0, 2 * np.pi, 24)], np.int32)
        cv2.fillPoly(sh, [pts], 1)
    under = (which == 0) & ((np.abs(X) > HW - COUNTER - 0.08) | (Z > E_FRONT - 0.08))
    sh = np.maximum(cv2.GaussianBlur(sh, (0, 0), 8), cv2.GaussianBlur(under.astype(np.float32), (0, 0), 6))
    sh *= idbuf == 0
    img *= (1 - 0.55 * sh)[..., None]

    vig = np.clip(1 - (np.hypot((u - CX) / 1250, (v - 420) / 820)) ** 2.0, 0.3, 1)
    img *= vig[..., None]
    img = 1 - np.exp(-np.clip(img, 0, None) * 1.15)
    full = (np.clip(img, 0, 1)[..., ::-1] * 255).astype(np.uint8)
    return full


full = render()
pane_mask = pane & (idbuf == 0)
full_show = full.copy()
full_show[pane_mask] = (40, 20, 10)
cv2.imwrite(OUT + '.full.png', full_show)

# ---------------- pixelate like the other rooms; the panes come out transparent ----------------
LW, LH, K = W // 4, H // 4, 48
sharp = cv2.addWeighted(full, 1.4, cv2.GaussianBlur(full, (0, 0), 2), -0.4, 0)
low = cv2.resize(sharp, (LW, LH), interpolation=cv2.INTER_AREA)
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

# ---------------- the view out of the window ----------------
ys_, xs_ = np.nonzero(pane_big)
wx0, wx1, wy0, wy1 = int(xs_.min()), int(xs_.max()) + 1, int(ys_.min()), int(ys_.max()) + 1
vw, vh = wx1 - wx0, wy1 - wy0
vy, vx = np.mgrid[0:vh, 0:vw].astype(np.float32)
view = np.zeros((vh, vw, 3), np.float32)
sky = np.clip(vy / (vh * 0.45), 0, 1) ** 1.5                                           # street-light glow on the cloud
view[:] = (np.array([0.07, 0.07, 0.12], np.float32) * (1 - sky[..., None]) + np.array([0.3, 0.2, 0.13], np.float32) * sky[..., None])
roof = vh * 0.42 + 6 * np.sin(vx / 37.0)
houses = vy > roof
brick = np.array([0.06, 0.045, 0.045], np.float32) * (0.8 + 0.3 * noise(3, 81, (vh, vw)))[..., None]
view[houses] = brick[houses]
for cxs in (vw * 0.18, vw * 0.62, vw * 0.9):                                            # chimney stacks and pots
    stack_ = (np.abs(vx - cxs) < vw * 0.05) & (vy > roof - vh * 0.12) & ~houses
    view[stack_] = (0.05, 0.04, 0.04)
    for po in (-0.025, 0.02):
        pot = (np.abs(vx - (cxs + vw * po)) < vw * 0.012) & (vy > roof - vh * 0.17) & (vy <= roof - vh * 0.12)
        view[pot] = (0.07, 0.05, 0.04)
for (fx0, fy0, fw, fh, colour) in [(0.12, 0.58, 0.14, 0.16, (0.55, 0.38, 0.16)), (0.66, 0.55, 0.12, 0.18, (0.16, 0.24, 0.38)),
                                   (0.42, 0.78, 0.12, 0.14, (0.05, 0.05, 0.06))]:
    lit_ = (vx > vw * fx0) & (vx < vw * (fx0 + fw)) & (vy > vh * fy0) & (vy < vh * (fy0 + fh))
    view[lit_] = colour
    view[lit_ & ((np.abs(vx - vw * (fx0 + fw / 2)) < 1.5) | (np.abs(vy - vh * (fy0 + fh / 2)) < 1.5))] = (0.06, 0.05, 0.05)
fence = vy > vh * 0.86
view[fence] = (np.array([0.07, 0.06, 0.05], np.float32) * (0.8 + 0.4 * ((vx // 14) % 2))[..., None])[fence]
view *= 0.8
vlow = cv2.resize((view[..., ::-1] * 255).astype(np.uint8), (max(1, vw // 4), max(1, vh // 4)), interpolation=cv2.INTER_AREA)
vhalf = cv2.resize(vlow, (vw // 2, vh // 2), interpolation=cv2.INTER_NEAREST)
cv2.imwrite(VIEW_OUT, vhalf)

# ---------------- cut-out: exactly the pixels the bin owns ----------------
info = {}
for name in ('bin',):
    m = (idbuf == OBJ[name]).astype(np.float32)
    m = cv2.resize(cv2.resize(m, (LW, LH), interpolation=cv2.INTER_AREA), (W, H), interpolation=cv2.INTER_NEAREST) > 0.5
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cut = np.dstack([big, m * 255]).astype(np.uint8)[y0:y1, x0:x1]
    cut[cut[..., 3] == 0] = 0
    Image.fromarray(cut[..., [2, 1, 0, 3]]).save(f'{CUT_DIR}/{name}.png', optimize=True)
    info[name] = {'x': int(x0), 'y': int(y0)}


def floor_box(cx_, cz_, rx, rz):
    pts = [project(cx_ + ox, 0, cz_ + oz) for ox in (-rx, rx) for oz in (-rz, rz)]
    xs_, ys_ = [p_[0] for p_ in pts], [p_[1] for p_ in pts]
    return {'left': int(min(xs_)), 'right': int(max(xs_)), 'top': int(min(ys_)), 'bottom': int(max(ys_))}


# ---------------- the opening doors: per state, what's under Frank (inside) and the door itself ----------------
def lowres(full_):
    sharp_ = cv2.addWeighted(full_, 1.4, cv2.GaussianBlur(full_, (0, 0), 2), -0.4, 0)
    return cv2.resize(sharp_, (LW, LH), interpolation=cv2.INTER_AREA).astype(np.float32)


def nearest(low_, palette):
    return palette.astype(np.uint8)[((low_.reshape(-1, 1, 3) - palette[None]) ** 2).sum(-1).argmin(1)].reshape(LH, LW, 3)


closed = lowres(full)
states = []
for name, door, angles, args in (('fridge', 'fridge-door', FRIDGE_ANGLES, lambda a_: (a_, 0)),
                                 ('cupboards', 'cupboard-doors', CUPBOARD_ANGLES, lambda a_: (0, a_))):
    for a_ in angles:
        low_ = lowres(render(*args(a_)))
        door_m = cv2.resize((idbuf == OBJ[door]).astype(np.float32), (LW, LH), interpolation=cv2.INTER_AREA) > 0.5
        changed = (np.abs(low_ - closed).max(-1) > 3) & ~low_pane
        cake_m = cv2.resize((idbuf == OBJ['cake']).astype(np.float32), (LW, LH), interpolation=cv2.INTER_AREA) > 0.5
        states.append((name, low_, changed & ~door_m, door_m, changed & cake_m))
# what opening shows (a pink cake, the fridge's light) isn't in the closed room's colours: a few more for it
shown = np.concatenate([l_[i_ | d_] for _, l_, i_, d_, _ in states])
_, _, extra = cv2.kmeans(shown, 10, None, crit, 3, cv2.KMEANS_PP_CENTERS)
_, _, cake_cols = cv2.kmeans(np.concatenate([l_[c_] for _, l_, _, _, c_ in states]), 6, None, crit, 3, cv2.KMEANS_PP_CENTERS)
palette = np.vstack([centers, extra, cake_cols])
for name, angles in (('fridge', FRIDGE_ANGLES), ('cupboards', CUPBOARD_ANGLES)):
    frames = [(nearest(l_, palette), i_, d_) for n_, l_, i_, d_, _ in states if n_ == name]
    ys, xs = np.nonzero(np.any([i_ | d_ for _, i_, d_ in frames], 0))
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    for layer, k in (('inside', 1), ('door', 2)):
        sheet = np.hstack([np.dstack([f[0][..., ::-1], f[k] * 255])[y0:y1, x0:x1] for f in frames]).astype(np.uint8)
        sheet[sheet[..., 3] == 0] = 0
        Image.fromarray(sheet).resize((sheet.shape[1] * 4, sheet.shape[0] * 4), Image.NEAREST).save(f'{CUT_DIR}/{name}-{layer}.png', optimize=True)
    info[name] = {'x': int(x0) * 4, 'y': int(y0) * 4, 'width': int(x1 - x0) * 4, 'height': int(y1 - y0) * 4, 'frames': len(angles)}

fd = Hinged('fridge-door', R_FRONT - 0.02, FR1 - 0.005, -1, -1, FRIDGE_ANGLES[-1])
corners = [fd.pt(u_, 0, w_) for u_ in (0, FR1 - FR0) for w_ in (-0.08, 0.05)]
info['fridge']['footprint'] = {'left': int(min(project(x_, 0, z_)[0] for x_, _, z_ in corners)),
                               'right': int(max(project(x_, 0, z_)[0] for x_, _, z_ in corners)),
                               'top': int(min(project(x_, 0, z_)[1] for x_, _, z_ in corners)),
                               'bottom': int(max(project(x_, 0, z_)[1] for x_, _, z_ in corners))}
info['fridge']['baseY'] = int(project(0, 0, FR1)[1])
info['cupboards']['baseY'] = int(project(0, 0, (CB0 + CB1) / 2 + CB_W / 2)[1])
cz0, cz1 = project(HW - UP_D, CAL[3], CAL[1]), project(HW - UP_D, CAL[2], CAL[0])
info['calendar'] = [int(cz0[0]), int(cz0[1]), int(cz1[0]), int(cz1[1])]

info['footprints'] = {'bin': floor_box(BIN_X, BIN_Z, 0.17, 0.17)}
info['bin_base_y'] = int(project(BIN_X, 0, BIN_Z - BIN_R)[1])
WALK_X, WALK_Z0, WALK_Z1 = 0.55, E_FRONT - 0.2, 2.06
walk = [project(*q) for q in [(-WALK_X, 0, WALK_Z0), (WALK_X, 0, WALK_Z0), (WALK_X, 0, WALK_Z1), (-WALK_X, 0, WALK_Z1)]]
info['walk_px'] = [[round(x_), round(y_)] for x_, y_ in walk]
info['window'] = {'x': wx0, 'y': wy0, 'width': vw, 'height': vh}
print(json.dumps(info))
