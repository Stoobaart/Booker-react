"""The victim's living room. Writes the furniture cut-outs and prints the layout numbers the scene needs."""
import sys
import json
import numpy as np
import cv2
from PIL import Image

OUT, CUT_DIR = sys.argv[1], sys.argv[2]
W, H = 1920, 980
F, CX, CY, EYE = 900.0, 960.0, 360.0, 1.6
HW, CEIL, END = 2.5, 2.6, 5.5
rng = np.random.default_rng(9)


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
A = np.where((which == 2) | (which == 3), Z, X)

# ---- walls: dusty rose 70s floral paper floor to picture rail, faded and stained; skirting ----
wm = (which == 2) | (which == 3) | (which == 4)
a, y = A, Y
pa, pb = (a % 0.3) / 0.3, (y % 0.36) / 0.36
pa = np.where(((y // 0.36) % 2) == 1, (pa + 0.5) % 1, pa)
r = np.hypot(pa - 0.5, (pb - 0.5) * 1.2)
petals = (np.cos(np.arctan2(pb - 0.5, pa - 0.5) * 5) * 0.5 + 0.5) * np.clip(1 - r / 0.32, 0, 1)
motif = np.clip(petals * 1.6 + np.exp(-(r / 0.06) ** 2), 0, 1)
trellis = np.exp(-((np.abs((pa + pb) % 1 - 0.5) - 0.5) / 0.03) ** 2) * 0.4
paper = C(74, 50, 52) * (1 - motif[..., None]) + C(118, 84, 74) * motif[..., None]
paper = paper * (1 - trellis[..., None]) + C(96, 72, 60) * trellis[..., None]
paper = np.where((np.abs(a % 0.53) < 0.006)[..., None], paper * 1.3, paper)          # seams
damp = np.clip(fbm(a, y, 7, 1.5) * 1.6 - 0.85 + (y - 2.0) * 0.6, 0, 1)
paper = paper * (1 - 0.45 * damp[..., None]) + C(80, 64, 36) * 0.45 * damp[..., None]
paper *= (0.85 + 0.3 * fbm(a, y, 11, 6))[..., None]
col = paper
col = np.where(((y > 2.3) & (y < 2.34))[..., None], C(70, 46, 30), col)              # picture rail
col = np.where((y >= 2.34)[..., None], C(120, 108, 84) * (0.9 + 0.1 * fbm(a, y, 3, 4))[..., None], col)   # frieze above it
skirt = y < 0.15
col = np.where(skirt[..., None], C(110, 100, 84) * np.where(y > 0.135, 1.2, 0.85)[..., None], col)
albedo[wm] = col[wm]
# ---- ceiling, yellowed ----
cm = which == 1
albedo[cm] = (C(120, 110, 84) * (0.85 + 0.2 * fbm(X, Z, 21, 3))[..., None])[cm]
# ---- carpet: dark beige, worn into paths from the door to the sofa and the armchairs ----
fm = which == 0
carpet = C(92, 78, 58) * (0.82 + 0.3 * noise(2, 5))[..., None]
carpet *= (0.9 + 0.15 * fbm(X, Z, 17, 1.2))[..., None]
path = np.exp(-(((X + 1.6) * 0.8 - (Z - 3.0) * 0.3) / 0.35) ** 2) * (Z < 4.6)
carpet = carpet * (1 - 0.25 * path[..., None]) + C(108, 96, 76) * 0.25 * path[..., None]
stains = np.clip(fbm(X, Z, 31, 2.0) * 2 - 1.25, 0, 1)
carpet *= (1 - 0.45 * stains[..., None])
albedo[fm] = carpet[fm]

# ---- the door, as in the hallway: two panels, greyed cream paint, brass knob ----
DOOR_Z, DOOR_W, DOOR_H = 3.03, 0.86, 2.1
on = which == names.index('left')
lo, hi = DOOR_Z - DOOR_W / 2, DOOR_Z + DOOR_W / 2
frame = on & (A > lo - 0.07) & (A < hi + 0.07) & (Y < DOOR_H + 0.07)
leaf = on & (A > lo) & (A < hi) & (Y < DOOR_H)
albedo[frame & ~leaf] = (C(96, 88, 70) * (0.9 + 0.15 * noise(2, 41)[..., None]))[frame & ~leaf]
la, ly = (A - lo) / DOOR_W, Y / DOOR_H                  # 0 at its near edge, 1 at the far one
dcol = C(88, 80, 64) * (0.9 + 0.12 * fbm(A * 3, Y * 3, 51, 4))[..., None]
for (x0, x1, y0, y1) in [(0.18, 0.82, 0.55, 0.9), (0.18, 0.82, 0.12, 0.45)]:
    inside = (la > x0) & (la < x1) & (ly > y0) & (ly < y1)
    e = inside & ~((la > x0 + 0.03) & (la < x1 - 0.03) & (ly > y0 + 0.015) & (ly < y1 - 0.015))
    tl_ = e & ((la < x0 + 0.03) | (ly > y1 - 0.015))
    dcol = np.where((e & tl_)[..., None], dcol * 0.45, dcol)
    dcol = np.where((e & ~tl_)[..., None], dcol * 1.4, dcol)
albedo[leaf] = dcol[leaf]
kr = np.hypot((la - 0.88) * DOOR_W, (ly - 0.47) * DOOR_H)       # knob on the far side, the hinges near us
albedo[leaf & (kr < 0.062)] = C(60, 44, 22)
knob = leaf & (kr < 0.043)
albedo[knob] = C(176, 134, 60)
gap = leaf & (Y < 0.012)

# ---------------- lighting: the table lamp to the left of the sofa ----------------
LAMPS = [np.array([-1.52, 1.0, 5.2], np.float32)]                 # the left-hand table lamp only
P = np.stack([X, Y, Z], -1)
N = np.zeros((H, W, 3), np.float32)
for i, n in enumerate(names):
    N[which == i] = normals[n]


def lamp_light(Pt, Nt):
    tot = 0
    for Lp in LAMPS:
        L = Lp - Pt
        d2 = (L ** 2).sum(-1)
        lam = np.clip((Nt * (L / np.sqrt(d2)[..., None])).sum(-1), 0, 1)
        # the shades send light down and up more than sideways
        vert = np.abs(L[..., 1]) / np.sqrt(d2)
        tot = tot + 2.9 * lam * (0.5 + 0.5 * vert) / (1 + d2 * 0.3)
    return tot


edge = np.minimum.reduce([np.abs(X + HW), np.abs(X - HW), Y, np.abs(CEIL - Y), np.abs(END - Z) + 9 * (which != 4)])
ao = 0.5 + 0.5 * np.clip(edge / 0.4, 0, 1)
WARM = np.array([1.0, 0.78, 0.5], np.float32)
img = albedo * ((lamp_light(P, N)[..., None] * WARM + 0.1) * ao[..., None])
img[gap] = 0.01
img[knob] += np.array([0.04, 0.03, 0.01], np.float32)

def face_pt(x, y, z):
    return tuple(int(t) for t in project(x, y, z))


# frames above the sofa: prints, a landscape, and the son's school photos
frames = [(-1.75, 1.45, 0.34, 0.42, 'print'), (-0.95, 1.55, 0.3, 0.38, 'son'), (-0.25, 1.4, 0.42, 0.32, 'landscape'),
          (0.5, 1.55, 0.3, 0.38, 'son'), (1.2, 1.45, 0.36, 0.3, 'print'), (1.85, 1.6, 0.26, 0.32, 'son')]
for fx, fy, fw, fh, kind in frames:
    zz = END - 0.01
    k = float(lamp_light(np.array([[fx, fy, zz]], np.float32), np.array([[0, 0, -1]], np.float32))[0]) + 0.05
    outer = (face_pt(fx - fw / 2, fy + fh / 2, zz), face_pt(fx + fw / 2, fy - fh / 2, zz))
    cv2.rectangle(img, outer[0], outer[1], tuple(float(c) * k for c in (0.25, 0.17, 0.08)), -1)
    i0, i1 = face_pt(fx - fw / 2 + 0.035, fy + fh / 2 - 0.035, zz), face_pt(fx + fw / 2 - 0.035, fy - fh / 2 + 0.035, zz)
    w_, h_ = i1[0] - i0[0], i1[1] - i0[1]
    if w_ < 4 or h_ < 4:
        continue
    gy_, gx_ = np.mgrid[0:h_, 0:w_].astype(np.float32)
    if kind == 'son':          # a school portrait: blue backdrop, brown hair, red jumper, white collar
        pic = np.zeros((h_, w_, 3), np.float32) + np.array([0.28, 0.42, 0.62], np.float32)
        cx_, hy, hr = w_ * 0.5, h_ * 0.42, w_ * 0.22
        pic[(gy_ > h_ * 0.66) & (np.abs(gx_ - cx_) < w_ * 0.42)] = (0.62, 0.18, 0.18)
        pic[(gy_ > h_ * 0.64) & (gy_ < h_ * 0.74) & (np.abs(gx_ - cx_) < w_ * 0.14)] = (0.9, 0.9, 0.88)
        head = ((gx_ - cx_) / hr) ** 2 + ((gy_ - hy) / (hr * 1.2)) ** 2 < 1
        pic[head] = (0.84, 0.68, 0.58)
        pic[(head & (gy_ < hy - hr * 0.3)) | ((((gx_ - cx_) / (hr * 1.08)) ** 2 + ((gy_ - (hy - hr * 0.35)) / (hr * 0.8)) ** 2 < 1) & (gy_ < hy - hr * 0.1))] = (0.42, 0.27, 0.15)
    elif kind == 'landscape':
        pic = np.zeros((h_, w_, 3), np.float32)
        pic[gy_ < h_ * 0.55] = (0.45, 0.5, 0.42)
        pic[gy_ >= h_ * 0.55] = (0.25, 0.32, 0.18)
    else:
        pic = np.zeros((h_, w_, 3), np.float32) + np.array([0.75, 0.7, 0.6], np.float32)
        pic[(np.abs(gx_ - w_ / 2) < w_ * 0.25) & (np.abs(gy_ - h_ / 2) < h_ * 0.25)] = (0.3, 0.25, 0.3)
    img[i0[1]:i1[1], i0[0]:i1[0]] = pic * k
# ---------------- furniture (depth-buffered) ----------------
OBJ = {}
zbuf = z.copy()                                     # the room's own depth
idbuf = np.zeros((H, W), np.uint8)
ORIGIN = np.array([0, EYE, 0], np.float32)


def oid(name):
    return OBJ.setdefault(name, len(OBJ) + 1)


def shade_px(colour, Pt, Nt, emissive=False):
    if emissive:
        return np.broadcast_to(np.array(colour, np.float32), Pt.shape).copy()
    return np.array(colour, np.float32) * (lamp_light(Pt, Nt)[..., None] * WARM + 0.1)


def put(name, ys, xs, t, Pt, Nt, colour, emissive=False):
    keep = t < zbuf[ys, xs]
    ys, xs, t, Pt, Nt = ys[keep], xs[keep], t[keep], Pt[keep], Nt[keep]
    zbuf[ys, xs] = t
    idbuf[ys, xs] = oid(name)
    img[ys, xs] = shade_px(colour, Pt, Nt, emissive)


def poly3(name, pts3, colour, emissive=False):
    """A flat polygon in 3D."""
    pts3 = np.array(pts3, np.float32)
    n = np.cross(pts3[1] - pts3[0], pts3[2] - pts3[0])
    if np.linalg.norm(n) < 1e-9:
        return
    n /= np.linalg.norm(n)
    if np.dot(n, pts3[0] - ORIGIN) > 0:
        n = -n                                       # face the camera
    pts2 = np.array([project(*q) for q in pts3])
    if (pts3[:, 2] <= 0.05).any():
        return
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


def box(name, cx, cz, w, d, y0, y1, colour, rot=0.0):
    ca, sa = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    def pt(ox, oz, yy):
        return (cx + ox * ca - oz * sa, yy, cz + ox * sa + oz * ca)
    hx, hz = w / 2, d / 2
    corners = [(-hx, -hz), (hx, -hz), (hx, hz), (-hx, hz)]
    for i in range(4):
        a0, a1 = corners[i], corners[(i + 1) % 4]
        poly3(name, [pt(*a0, y0), pt(*a1, y0), pt(*a1, y1), pt(*a0, y1)], colour)
    poly3(name, [pt(*c_, y1) for c_ in corners], colour)


def cylinder(name, axis, c0, c1, r, lo, hi, colour):
    """A round bolster: axis 'x' (centre y=c0, z=c1) or 'z' (centre x=c0, y=c1), running lo..hi."""
    if axis == 'x':
        corners = [(xx_, c0 + sy_ * r, c1 + sz_ * r) for xx_ in (lo, hi) for sy_ in (-1, 1) for sz_ in (-1, 1)]
    else:
        corners = [(c0 + sx_ * r, c1 + sy_ * r, zz_) for zz_ in (lo, hi) for sx_ in (-1, 1) for sy_ in (-1, 1)]
    pr = np.array([project(*q) for q in corners])
    x0, x1 = int(max(0, pr[:, 0].min() - 2)), int(min(W, pr[:, 0].max() + 3))
    y0, y1 = int(max(0, pr[:, 1].min() - 2)), int(min(H, pr[:, 1].max() + 3))
    ys, xs = np.mgrid[y0:y1, x0:x1]
    ys, xs = ys.ravel(), xs.ravel()
    ddx, ddy = dx[ys, xs], dy[ys, xs]
    if axis == 'x':
        a = ddy ** 2 + 1
        b = 2 * (ddy * (EYE - c0) - c1)
        c = (EYE - c0) ** 2 + c1 ** 2 - r * r
    else:
        a = ddx ** 2 + ddy ** 2
        b = 2 * (-ddx * c0 + ddy * (EYE - c1))
        c = c0 ** 2 + (EYE - c1) ** 2 - r * r
    disc_ = b * b - 4 * a * c
    ok = disc_ >= 0
    t = (-b - np.sqrt(np.clip(disc_, 0, None))) / (2 * a)
    Pt = np.stack([t * ddx, EYE + t * ddy, t], -1)
    along = Pt[:, 0] if axis == 'x' else Pt[:, 2]
    ok &= (along >= lo) & (along <= hi) & (t > 0)
    if axis == 'x':
        Nt = np.stack([np.zeros_like(t), Pt[:, 1] - c0, Pt[:, 2] - c1], -1) / r
    else:
        Nt = np.stack([Pt[:, 0] - c0, Pt[:, 1] - c1, np.zeros_like(t)], -1) / r
    put(name, ys[ok], xs[ok], t[ok], Pt[ok], Nt[ok], colour)
    # flat ends
    ang = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    for e in (lo, hi):
        if axis == 'x':
            poly3(name, [(e, c0 + r * np.sin(q), c1 + r * np.cos(q)) for q in ang], colour)
        else:
            poly3(name, [(c0 + r * np.cos(q), c1 + r * np.sin(q), e) for q in ang], colour)


MUSTARD, WOOD, GREEN = C(118, 92, 42), C(70, 42, 24), C(40, 70, 62)
# ---- the sofa: soft and rounded, against the back wall ----
for lx in (-1.1, 1.1):
    for lz in (4.75, 5.4):
        box('sofa', lx, lz, 0.05, 0.05, 0, 0.09, WOOD * 0.6)
box('sofa', 0, 5.1, 1.9, 0.7, 0.08, 0.36, MUSTARD * 0.8)                       # base, under the cushions
box('sofa', 0, 5.35, 1.9, 0.2, 0.36, 0.78, MUSTARD * 0.9)                      # back
cylinder('sofa', 'x', 0.78, 5.35, 0.11, -0.95, 0.95, MUSTARD * 0.9)            # its rounded top
for cxs in (-0.475, 0.475):                                                    # back cushions, plump
    cylinder('sofa', 'x', 0.58, 5.22, 0.13, cxs - 0.45, cxs + 0.45, MUSTARD * 0.96)
for cxs in (-0.475, 0.475):                                                    # seat cushions with rounded fronts
    box('sofa', cxs, 5.0, 0.93, 0.5, 0.36, 0.47, MUSTARD)
    cylinder('sofa', 'x', 0.415, 4.76, 0.065, cxs - 0.46, cxs + 0.46, MUSTARD)
for ax in (-1.06, 1.06):                                                       # arms, rolled over at the top
    box('sofa', ax, 5.08, 0.22, 0.74, 0.08, 0.52, MUSTARD * 0.88)
    cylinder('sofa', 'z', ax, 0.52, 0.12, 4.71, 5.45, MUSTARD * 0.88)
# ---- side tables; a lamp on the left-hand one only ----
for sx in (-1.52, 1.52):
    box('side', sx, 5.2, 0.44, 0.44, 0, 0.55, WOOD)
box('lamp', -1.52, 5.2, 0.1, 0.1, 0.55, 0.82, C(60, 90, 80))
for Lp in LAMPS:
    sx, _, sz = Lp
    poly3('lamp', [(sx - 0.13, 1.17, sz - 0.2), (sx + 0.13, 1.17, sz - 0.2), (sx + 0.19, 0.84, sz - 0.2), (sx - 0.19, 0.84, sz - 0.2)], (0.95, 0.72, 0.38), emissive=True)
# ---- coffee table: round top with a thick edge, on three legs ----
TCX, TCZ, TR, TTOP = 0, 3.9, 0.42, 0.4
for q in (0.3, 2.4, 4.5):
    box('coffee-table', TCX + 0.25 * np.cos(q), TCZ + 0.25 * np.sin(q), 0.04, 0.04, 0, TTOP - 0.03, WOOD * 0.8)
ang = np.linspace(0, 2 * np.pi, 48, endpoint=False)
ring = [(TCX + TR * np.cos(q), TCZ + TR * np.sin(q)) for q in ang]
for i in range(len(ring)):
    (ax_, az_), (bx_, bz_) = ring[i], ring[(i + 1) % len(ring)]
    poly3('coffee-table', [(ax_, TTOP - 0.035, az_), (bx_, TTOP - 0.035, bz_), (bx_, TTOP, bz_), (ax_, TTOP, az_)], WOOD * 0.85)
poly3('coffee-table', [(x_, TTOP, z_) for x_, z_ in ring], WOOD * 1.1)
# ---- two armchairs, angled in towards the table ----
CHAIRS = [('armchair-left', -1.3, 3.25, -40), ('armchair-right', 1.6, 2.85, 40)]
for name, cx, cz, rot in CHAIRS:
    ca, sa = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    loc = lambda ox, oz: (cx + ox * ca - oz * sa, cz + ox * sa + oz * ca)
    for ox, oz in [(-0.3, -0.3), (0.3, -0.3), (-0.3, 0.3), (0.3, 0.3)]:
        box(name, *loc(ox, oz), 0.04, 0.04, 0, 0.3, WOOD * 0.8, rot)
    box(name, *loc(0, 0.04), 0.72, 0.66, 0.28, 0.44, GREEN, rot)
    box(name, *loc(0, -0.33), 0.7, 0.1, 0.3, 0.98, GREEN * 0.85, rot)
    for ox in (-0.38, 0.38):
        box(name, *loc(ox, 0), 0.05, 0.72, 0.44, 0.62, WOOD, rot)
# ---- TV on its cabinet (off), and the bookshelf, along the right-hand wall ----
box('tv', 2.2, 3.7, 0.5, 0.8, 0, 0.5, WOOD)
box('tv', 2.22, 3.7, 0.46, 0.52, 0.5, 0.98, C(40, 38, 36))
poly3('tv', [(1.985, 0.58, 3.5), (1.985, 0.58, 3.9), (1.985, 0.92, 3.9), (1.985, 0.92, 3.5)], C(14, 16, 16))
box('shelf', 2.32, 4.85, 0.36, 1.1, 0, 1.45, WOOD * 0.9)
for sy in (0.05, 0.4, 0.75, 1.1):
    zz = 4.32
    while zz < 5.36:
        bw = rng.uniform(0.03, 0.07)
        bh = rng.uniform(0.22, 0.3)
        colour = np.array(rng.choice([[0.5, 0.15, 0.1], [0.15, 0.25, 0.45], [0.55, 0.5, 0.35], [0.2, 0.35, 0.2], [0.45, 0.3, 0.15]]), np.float32)
        poly3('shelf', [(2.135, sy, zz), (2.135, sy, zz + bw), (2.135, sy + bh, zz + bw), (2.135, sy + bh, zz)], colour)
        zz += bw + 0.005

for Lp in LAMPS:
    gx, gy = project(Lp[0], 1.0, Lp[2] - 0.2)
    img += (np.exp(-(((u - gx) / 160) ** 2 + ((v - gy) / 130) ** 2)) * 0.18)[..., None] * WARM
# ceiling lights, off
for cx_ in (-1.2, 1.2):
    c0 = face_pt(cx_, CEIL - 0.02, 3.4)
    cv2.ellipse(img, c0, (int(0.16 * F / 3.4), int(0.04 * F / 3.4)), 0, 0, 360, (0.11, 0.1, 0.08), -1)
# shadows under the furniture on the carpet
sh = np.zeros((H, W), np.float32)
for (cx_, cz_, rx, rz) in [(0, 5.05, 1.2, 0.45), (0, 3.9, 0.45, 0.45), (-1.3, 3.25, 0.42, 0.42), (1.6, 2.85, 0.42, 0.42), (2.2, 3.7, 0.3, 0.45)]:
    pts = np.array([project(cx_ + rx * np.cos(q), 0, cz_ + rz * np.sin(q)) for q in np.linspace(0, 2 * np.pi, 24)], np.int32)
    cv2.fillPoly(sh, [pts], 1)
sh = cv2.GaussianBlur(sh, (0, 0), 10) * (idbuf == 0)
img *= (1 - 0.5 * sh)[..., None]


vig = np.clip(1 - (np.hypot((u - CX) / 1500, (v - 470) / 950)) ** 2.2, 0.4, 1)
img *= vig[..., None]
img = 1 - np.exp(-np.clip(img, 0, None) * 1.5)
full = (np.clip(img, 0, 1)[..., ::-1] * 255).astype(np.uint8)
cv2.imwrite(OUT + '.full.png', full)

# ---------------- pixelate like the hallway ----------------
LW, LH, K = W // 4, H // 4, 48
sharp = cv2.addWeighted(full, 1.4, cv2.GaussianBlur(full, (0, 0), 2), -0.4, 0)
low = cv2.resize(sharp, (LW, LH), interpolation=cv2.INTER_AREA)
data = low.reshape(-1, 3).astype(np.float32)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, labels, centers = cv2.kmeans(data, K, None, crit, 3, cv2.KMEANS_PP_CENTERS)
low = centers.astype(np.uint8)[labels.flatten()].reshape(low.shape)
big = cv2.resize(low, (W, H), interpolation=cv2.INTER_NEAREST)
cv2.imwrite(OUT + '.big.png', big)
half = cv2.resize(big, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
Image.fromarray(half[..., ::-1]).quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(OUT, optimize=True)

# ---------------- cut-outs: exactly the pixels each piece owns ----------------
info = {}
for name in ('coffee-table', 'armchair-left', 'armchair-right'):
    m = (idbuf == OBJ[name]).astype(np.float32)
    m = cv2.resize(cv2.resize(m, (LW, LH), interpolation=cv2.INTER_AREA), (W, H), interpolation=cv2.INTER_NEAREST) > 0.5
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([big, m * 255]).astype(np.uint8)[y0:y1, x0:x1]
    rgba[rgba[..., 3] == 0] = 0
    Image.fromarray(rgba[..., [2, 1, 0, 3]]).save(f'{CUT_DIR}/{name}.png', optimize=True)
    info[name] = {'x': int(x0), 'y': int(y0)}


def floor_box(cx_, cz_, rx, rz):
    pts = [project(cx_ + ox, 0, cz_ + oz) for ox in (-rx, rx) for oz in (-rz, rz)]
    xs_, ys_ = [p_[0] for p_ in pts], [p_[1] for p_ in pts]
    return {'left': int(min(xs_)), 'right': int(max(xs_)), 'top': int(min(ys_)), 'bottom': int(max(ys_))}


info['footprints'] = {
    'coffee-table': floor_box(0, 3.9, 0.42, 0.42), 'armchair-left': floor_box(-1.3, 3.25, 0.45, 0.45),
    'armchair-right': floor_box(1.6, 2.85, 0.45, 0.45), 'tv': floor_box(2.2, 3.7, 0.25, 0.4),
}
walk = [project(*q) for q in [(-2.3, 0, 4.55), (1.85, 0, 4.55), (1.85, 0, 2.35), (-2.3, 0, 2.35)]]
info['walk_pct'] = ', '.join(f'{x_ / W * 100:.3f}% {y_ / H * 100:.3f}%' for x_, y_ in walk)
info['walk_px'] = [[int(x_), int(y_)] for x_, y_ in walk]
d0, d1 = project(-HW, 0, DOOR_Z - DOOR_W / 2), project(-HW, DOOR_H, DOOR_Z + DOOR_W / 2)
info['door'] = [int(d0[0]), int(project(-HW, DOOR_H, DOOR_Z - DOOR_W / 2)[1]), int(d1[0]), int(d0[1])]
info['arrive_feet'] = [int(t) for t in project(-1.95, 0, 3.0)]
print(json.dumps(info))
