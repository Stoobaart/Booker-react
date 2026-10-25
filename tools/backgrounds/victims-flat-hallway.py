"""The victim's hallway, ray-cast against the corridor's box. Also writes the hall table cut-out."""
import sys
import numpy as np
import cv2
from PIL import Image

OUT, TABLE_OUT = sys.argv[1], sys.argv[2]
W, H = 1920, 980
F, CX, CY, EYE = 1100.0, 960.0, 330.0, 1.65       # focal length (px), vanishing point, eye height (m)
HW, CEIL, END = 0.85, 3.0, 6.7                     # half-width, ceiling height, end wall depth (m)
rng = np.random.default_rng(3)


def project(x, y, z):
    return CX + x * F / z, CY - (y - EYE) * F / z


# ---------------- ray cast the box ----------------
v, u = np.mgrid[0:H, 0:W].astype(np.float32)
dx, dy = (u - CX) / F, -(v - CY) / F             # ray direction (dx, dy, 1): t is depth z
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
    """Smooth value noise in plane coords (metres)."""
    g = np.random.default_rng(seed).random((256, 256)).astype(np.float32)
    g = cv2.GaussianBlur(g, (0, 0), 1.2)
    out = np.zeros_like(a)
    amp = 1.0
    for o in range(4):
        fa = np.mod(a * freq * 2 ** o, 255).astype(np.float32)
        fb = np.mod(b * freq * 2 ** o, 255).astype(np.float32)
        out += cv2.remap(g, fa, fb, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP) * amp
        amp *= 0.5
    return out / 1.875


albedo = np.zeros((H, W, 3), np.float32)        # RGB 0..1
C = lambda *rgb: np.array(rgb, np.float32) / 255

# plane coordinates: (a along the surface horizontally, b up)
A = np.where((which == 2) | (which == 3), Z, X)
B = np.where((which == 0) | (which == 1), Z, Y)


# ---- walls: faded damask paper above a dado rail, grubby anaglypta below, skirting ----
def walls(mask, a, y):
    # damask: a repeating medallion, drop-matched
    pa, pb = (a % 0.26) / 0.26, (y % 0.34) / 0.34
    pa = np.where(((y // 0.34) % 2) == 1, (pa + 0.5) % 1, pa)
    m = np.cos((pa - 0.5) * np.pi * 2) * 0.5 + 0.5
    m = m * (np.cos((pb - 0.5) * np.pi * 2) * 0.5 + 0.5)
    stem = np.exp(-((pa - 0.5) / 0.06) ** 2) * (np.sin(pb * np.pi * 6) * 0.5 + 0.5)
    motif = np.clip(m ** 3 * 1.4 + stem * 0.5, 0, 1)
    paper = C(46, 52, 38) * (1 - motif[..., None]) + C(86, 80, 52) * motif[..., None]
    # seams every 53cm, some lifting
    seam = (np.abs((a % 0.53) - 0.0) < 0.006)
    paper = np.where(seam[..., None], paper * 1.35, paper)
    # damp: yellow-brown tide marks spreading down from the ceiling and up from the skirting
    damp = np.clip(fbm(a, y, 7, 1.5) * 1.6 - 0.75 + (y - 1.9) * 0.6, 0, 1)
    paper = paper * (1 - 0.5 * damp[..., None]) + C(70, 58, 30) * 0.5 * damp[..., None]
    paper *= (0.85 + 0.3 * fbm(a, y, 11, 6))[..., None]
    lower = C(128, 118, 96) * (0.8 + 0.25 * (np.sin(a * 90) * np.sin(y * 70) * 0.5 + 0.5))[..., None]
    scuff = np.clip(fbm(a, y, 13, 9) * 2 - 1.15, 0, 1) * np.clip(1.1 - y, 0, 1)
    lower = lower * (1 - 0.45 * scuff[..., None])
    lower *= (0.8 + 0.2 * np.clip(y / 0.9, 0, 1))[..., None]          # grubbier near the floor
    col = np.where((y > 0.94)[..., None], paper, lower)
    rail = (y > 0.88) & (y <= 0.94)
    col = np.where(rail[..., None], C(70, 46, 30) * np.where(y > 0.915, 1.15, 0.8)[..., None], col)
    skirt = y < 0.14
    col = np.where(skirt[..., None], C(120, 112, 96) * np.where(y > 0.125, 1.2, 0.85)[..., None], col)
    cove = y > CEIL - 0.08
    col = np.where(cove[..., None], C(130, 120, 92), col)
    albedo[mask] = col[mask]


wall_mask = (which == 2) | (which == 3) | (which == 4)
walls(wall_mask, A, Y)

# ---- ceiling: nicotine-yellowed, a damp patch ----
cm = which == 1
cc = C(128, 118, 88) * (0.85 + 0.2 * fbm(X, Z, 21, 3))[..., None]
stain = np.clip(1 - np.hypot((X - 0.3) / 0.5, (Z - 5.0) / 0.7), 0, 1) ** 0.7
cc = cc * (1 - 0.45 * stain[..., None]) + C(80, 60, 30) * 0.3 * stain[..., None]
albedo[cm] = cc[cm]

# ---- carpet: brown 70s swirls, worn flat down the middle ----
fm = which == 0
sa, sb = X / 0.22, Z / 0.22
cxs, cys = np.floor(sa) + 0.5, np.floor(sb) + 0.5
r = np.hypot(sa - cxs, sb - cys)
ang = np.arctan2(sb - cys, sa - cxs)
swirl = np.sin(ang * 2 + r * 18) * 0.5 + 0.5
swirl = np.where(r < 0.5, swirl, np.sin((sa + sb) * 9) * 0.5 + 0.5)
carpet = C(46, 24, 20) * (1 - swirl[..., None]) + C(72, 42, 26) * swirl[..., None]
carpet *= (0.85 + 0.25 * noise(2, 5))[..., None]                     # pile
worn = np.exp(-(X / 0.35) ** 2)
carpet = carpet * (1 - 0.35 * worn[..., None]) + C(92, 74, 58) * 0.35 * worn[..., None]
spill = np.clip(fbm(X, Z, 31, 2.5) * 2 - 1.2, 0, 1)
carpet *= (1 - 0.5 * spill[..., None])
albedo[fm] = carpet[fm]

# ---------------- doors ----------------
DOORS = [  # plane, centre along the plane (m), width
    ('left', 2.45, 0.86),      # kitchen
    ('left', 4.45, 0.86),      # living room
    ('end', 0.0, 0.86),        # bedroom
]
DOOR_H = 2.1
door_mask = np.zeros((H, W), bool)
knob_mask = np.zeros((H, W), bool)
knob_hi = np.zeros((H, W), bool)
gap_mask = np.zeros((H, W), bool)
for plane, c, w in DOORS:
    pi = names.index(plane)
    on = which == pi
    a = A if plane != 'end' else X
    lo, hi = c - w / 2, c + w / 2
    frame = on & (a > lo - 0.07) & (a < hi + 0.07) & (Y < DOOR_H + 0.07)
    leaf = on & (a > lo) & (a < hi) & (Y < DOOR_H)
    albedo[frame & ~leaf] = (C(96, 88, 70) * (0.9 + 0.15 * noise(2, 41)[..., None]))[frame & ~leaf]
    la = (a - lo) / w if plane != 'left' else (hi - a) / w     # 0 at the hinge side... either way, 0..1 across
    ly = Y / DOOR_H
    col = C(88, 80, 64) * (0.9 + 0.12 * fbm(a * 3, Y * 3, 51, 4))[..., None]
    # two raised panels: top (arched head like the reference) and bottom
    def panel(x0, x1, y0, y1):
        inside = (la > x0) & (la < x1) & (ly > y0) & (ly < y1)
        edge = inside & ~((la > x0 + 0.03) & (la < x1 - 0.03) & (ly > y0 + 0.015) & (ly < y1 - 0.015))
        top_left = edge & ((la < x0 + 0.03) | (ly > y1 - 0.015))
        return edge & top_left, edge & ~top_left
    for (x0, x1, y0, y1) in [(0.18, 0.82, 0.55, 0.9), (0.18, 0.82, 0.12, 0.45)]:
        dark, light = panel(x0, x1, y0, y1)
        col = np.where(dark[..., None], col * 0.45, col)
        col = np.where(light[..., None], col * 1.4, col)
    grime = np.clip(1 - np.hypot((la - 0.88) / 0.12, (ly - 0.48) / 0.2), 0, 1)   # handled for years
    col = col * (1 - 0.35 * grime[..., None])
    albedo[leaf] = col[leaf]
    door_mask |= leaf
    # knob
    kx = 0.88
    kr = np.hypot((la - kx) * w, (ly - 0.47) * DOOR_H)
    rose = leaf & (kr < 0.062)                                    # the round backplate
    knob = leaf & (kr < 0.043)
    albedo[rose] = C(60, 44, 22)
    albedo[knob] = C(176, 134, 60)
    hi = knob & ((la - kx) * w < -0.01) & ((ly - 0.47) * DOOR_H > 0.01)   # the side facing the bulb
    knob_mask |= knob
    knob_hi |= hi
    # the gap under the door: black, as nothing is lit beyond
    gap_mask |= leaf & (Y < 0.012)

# ---------------- lighting ----------------
P = np.stack([X, Y, Z], -1)
N = np.zeros((H, W, 3), np.float32)
for i, n in enumerate(names):
    N[which == i] = normals[n]
BULB = np.array([0.0, 2.6, 4.0], np.float32)
L = BULB - P
d2 = (L ** 2).sum(-1)
Ln = L / np.sqrt(d2)[..., None]
lam = np.clip((N * Ln).sum(-1), 0, 1)
bulb_light = 2.3 * lam / (1 + d2 * 0.36)
# the lampshade blocks light upwards: the ceiling gets only a dim ring
bulb_light = np.where(which == 1, bulb_light * 0.3 * (1 - np.exp(-d2 * 1.2)), bulb_light)
# the table's shadow on the wall and carpet behind it (from the bulb)
# corners and edges darken (ambient occlusion)
edge = np.minimum.reduce([np.abs(X + HW), np.abs(X - HW), Y, np.abs(CEIL - Y), np.abs(END - Z) + 9 * (which != 4)])
ao = 0.55 + 0.45 * np.clip(edge / 0.35, 0, 1)
# a little cold light from the open front door behind the viewer
street = 0.12 * np.exp(-((Z - 0.5) / 1.6) ** 2) * (0.6 + 0.4 * (which == 0))
light = (bulb_light[..., None] * np.array([1.0, 0.82, 0.55], np.float32)[None, None] +
         street[..., None] * np.array([0.45, 0.55, 0.8], np.float32)[None, None] + 0.035) * ao[..., None]
img = albedo * light
img[gap_mask] = 0.01
img[knob_mask] += np.array([0.05, 0.035, 0.012], np.float32)   # a little brass catching the light
img[knob_hi] += np.array([0.22, 0.17, 0.08], np.float32)
# fog of darkness with distance, and a vignette
img *= np.clip(1.2 - Z / 14, 0.5, 1)[..., None]
vig = np.clip(1 - (np.hypot((u - CX) / 1200, (v - 430) / 760)) ** 2.2, 0.22, 1)
img *= vig[..., None]

# ---------------- the bulb under its dusty fabric shade, on a flex ----------------
def poly(points3d):
    return np.array([project(*p) for p in points3d], np.int32)


bx, by, bz = BULB
cv2.line(img, tuple(map(int, project(0, CEIL, bz))), tuple(map(int, project(0, by + 0.16, bz))), (0.02, 0.02, 0.02), 2)
cv2.ellipse(img, tuple(map(int, project(0, CEIL, bz))), (14, 4), 0, 0, 360, (0.10, 0.09, 0.07), -1)   # ceiling rose
shade = poly([(-0.17, by + 0.16, bz), (0.17, by + 0.16, bz), (0.24, by - 0.06, bz), (-0.24, by - 0.06, bz)])
cv2.fillPoly(img, [shade], (0.30, 0.20, 0.10))
# glow through the fabric, brightest at the bottom rim
sx0, sy0 = project(0, by - 0.06, bz)
glow = np.exp(-(((u - sx0) / 120) ** 2 + ((v - sy0) / 70) ** 2))
img += glow[..., None] * np.array([0.30, 0.22, 0.10], np.float32)
cv2.ellipse(img, (int(sx0), int(sy0)), (int(0.24 * F / bz), 6), 0, 0, 360, (0.95, 0.80, 0.45), -1)

# ---------------- hall table with the post ----------------
table_mask = np.zeros((H, W), np.uint8)
TX0, TX1, TZ0, TZ1, TH = HW - 0.38, HW, 3.0, 3.47, 0.76


def box(x0, x1, y0, y1, z0, z1, col):
    """Draw a box's visible faces (front, top and the side facing the corridor), lit simply."""
    faces = [
        ([(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)], 0.55),     # front
        ([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], 1.0),      # top
        ([(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)], 0.75),     # side facing the corridor
    ]
    for pts, k in faces:
        p = poly(pts)
        cv2.fillPoly(img, [p], tuple(float(c * k) for c in col))
        cv2.fillPoly(table_mask, [p], 1)


# shadow under and behind the table
sh = np.zeros((H, W), np.float32)
cv2.fillPoly(sh, [poly([(TX0 - 0.05, 0, TZ0 - 0.02), (HW, 0, TZ0 - 0.02), (HW, 0, TZ1 + 0.25), (TX0 - 0.05, 0, TZ1 + 0.25)])], 1)
cv2.fillPoly(sh, [poly([(HW, 0, TZ0), (HW, TH, TZ0 + 0.05), (HW, TH, TZ1 + 0.4), (HW, 0, TZ1 + 0.3)])], 1)
sh = cv2.GaussianBlur(sh, (0, 0), 10)
img *= (1 - 0.6 * sh)[..., None]
tl = np.array([TX0, TH, (TZ0 + TZ1) / 2], np.float32)
tlight = float(2.3 / (1 + ((BULB - tl) ** 2).sum() * 0.36) * 0.55 + 0.035)
wood = np.array([0.16, 0.09, 0.05], np.float32) * tlight
for lx in (TX0 + 0.02, TX1 - 0.05):                       # legs
    for lz in (TZ0 + 0.02, TZ1 - 0.05):
        box(lx, lx + 0.035, 0, TH - 0.04, lz, lz + 0.035, wood)
box(TX0, TX1, TH - 0.12, TH - 0.04, TZ0, TZ1, wood * 0.9)  # apron with a drawer
box(TX0 - 0.02, TX1, TH - 0.04, TH, TZ0 - 0.02, TZ1 + 0.02, wood * 1.25)   # top
dk = poly([(TX0 + 0.1, TH - 0.09, TZ0 - 0.001), (TX1 - 0.1, TH - 0.09, TZ0 - 0.001)])
cv2.line(img, tuple(dk[0]), tuple(dk[1]), (0.05, 0.03, 0.02), 2)
kp = project((TX0 + TX1) / 2, TH - 0.08, TZ0 - 0.001)
cv2.circle(img, (int(kp[0]), int(kp[1])), 3, (0.30, 0.22, 0.10), -1)
# the post: a slew of envelopes, some brown, one with a red FINAL DEMAND stripe
post = [(HW - 0.28, 3.10, 0.24, 0.12, 8, (0.62, 0.60, 0.55)), (HW - 0.25, 3.17, 0.22, 0.11, -14, (0.48, 0.38, 0.24)),
        (HW - 0.30, 3.25, 0.23, 0.12, 22, (0.60, 0.58, 0.54)), (HW - 0.22, 3.21, 0.2, 0.1, 3, (0.50, 0.40, 0.25)),
        (HW - 0.26, 3.33, 0.22, 0.11, -30, (0.62, 0.30, 0.25))]
for (px, pz, pw, pd, rot, col) in post:
    ca, sa_ = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    corners = [(px + ca * dxx - sa_ * dzz, TH + 0.003, pz + sa_ * dxx + ca * dzz)
               for dxx, dzz in [(-pw / 2, -pd / 2), (pw / 2, -pd / 2), (pw / 2, pd / 2), (-pw / 2, pd / 2)]]
    p = poly(corners)
    lit = float(tlight * 0.8)
    cv2.fillPoly(img, [p], tuple(c * lit for c in col))
    cv2.polylines(img, [p], True, tuple(c * lit * 0.6 for c in col), 1)
    cv2.fillPoly(table_mask, [p], 1)
# one letter has slid off onto the carpet
p = poly([(HW - 0.48, 0.003, 3.07), (HW - 0.3, 0.003, 3.03), (HW - 0.28, 0.003, 3.15), (HW - 0.46, 0.003, 3.19)])
cv2.fillPoly(img, [p], tuple(float(c) for c in np.array([0.55, 0.53, 0.5]) * tlight * 0.7))

img = 1 - np.exp(-np.clip(img, 0, None) * 1.6)        # soft shoulder, so the bulb doesn't burn out
img = np.clip(img, 0, 1)
full = (img[..., ::-1] * 255).astype(np.uint8)            # BGR
cv2.imwrite(OUT + '.full.png', full)

# ---------------- pixelate like the other backgrounds ----------------
LW, LH, K = W // 4, H // 4, 48
blur = cv2.GaussianBlur(full, (0, 0), 2)
sharp = cv2.addWeighted(full, 1.4, blur, -0.4, 0)
low = cv2.resize(sharp, (LW, LH), interpolation=cv2.INTER_AREA)
data = low.reshape(-1, 3).astype(np.float32)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, labels, centers = cv2.kmeans(data, K, None, crit, 3, cv2.KMEANS_PP_CENTERS)
low = centers.astype(np.uint8)[labels.flatten()].reshape(low.shape)
big = cv2.resize(low, (W, H), interpolation=cv2.INTER_NEAREST)
cv2.imwrite(OUT + '.big.png', big)
half = cv2.resize(big, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
Image.fromarray(half[..., ::-1]).quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(OUT, optimize=True)

# the table on its own, on the same 4px grid, cropped to its box
tm = cv2.resize(table_mask.astype(np.float32), (LW, LH), interpolation=cv2.INTER_AREA) > 0.5
tm = cv2.resize(tm.astype(np.uint8), (W, H), interpolation=cv2.INTER_NEAREST)
ys, xs = np.nonzero(tm)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
rgba = np.dstack([big, tm * 255]).astype(np.uint8)[y0:y1, x0:x1]
rgba[rgba[..., 3] == 0] = 0
Image.fromarray(rgba[..., [2, 1, 0, 3]]).save(TABLE_OUT, optimize=True)
print('table box', x0, y0, x1, y1, 'front base y', int(project(TX0, 0, TZ0)[1]),
      'footprint', [int(t) for t in project(TX0, 0, TZ0)], [int(t) for t in project(TX0, 0, TZ1)], [int(t) for t in project(HW, 0, TZ0)])
for plane, c, w in DOORS:
    if plane == 'end':
        a0, a1 = project(c - w / 2, 0, END), project(c + w / 2, DOOR_H, END)
        print(plane, 'door', int(a0[0]), int(a1[1]), int(a1[0]), int(a0[1]))
    else:
        sgn = -1 if plane == 'left' else 1
        n0, f0 = project(sgn * HW, 0, c - w / 2), project(sgn * HW, DOOR_H, c + w / 2)
        n1 = project(sgn * HW, DOOR_H, c - w / 2)
        print(plane, 'door near-bottom', [int(t) for t in n0], 'near-top', [int(t) for t in n1], 'far-top', [int(t) for t in f0])
