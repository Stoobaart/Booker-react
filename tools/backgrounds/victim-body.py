"""The victim on the living room sofa: grades PixelLab's sprite into the room's lamplight and scales it to game pixels."""
import sys
import numpy as np
import cv2
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
ART = 5                                         # a touch coarser than the room's 4px blocks, so he's to scale with Frank
WARM = np.array([1.0, 0.78, 0.5], np.float32)   # the table lamp, as in victims-flat-living-room.py

im = np.asarray(Image.open(SRC).convert('RGBA')).astype(np.float32) / 255
rgb, alpha = im[..., :3], im[..., 3] > 0.5

# the room has no outlines: drop the dark rim round the silhouette
inner = cv2.erode(alpha.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
rim = alpha & ~inner & (rgb.max(-1) < 0.25)
alpha &= ~rim

# pale and dead: take the colour out of the skin
grey = rgb.mean(-1, keepdims=True)
skin = (rgb[..., 0] > rgb[..., 2] + 0.04) & (grey[..., 0] > 0.3)
rgb = np.where(skin[..., None], grey * 0.85 + rgb * 0.15 + np.array([0.0, 0.02, 0.03]), rgb)

# lit by the lamp up to his left: brighter on that side and towards his head
h, w = alpha.shape
ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
light = 0.95 - 0.45 * (xs / w) - 0.35 * (ys / h)
light = np.clip(light, 0.18, 1)[..., None]
lit = rgb * (light * WARM + 0.08)
lit = 1 - np.exp(-lit * 1.5)                    # the room's tone curve

# his shadow on the sofa, cast away from the lamp; it seats him in the cushions
shadow = cv2.GaussianBlur(np.roll(alpha.astype(np.float32), (1, 3), (0, 1)), (0, 0), 1.6) * 0.55
shadow = np.round(shadow * 4) / 4               # a few flat steps, like the room's palette
a = np.where(alpha, 1.0, shadow)
out = np.dstack([np.where(alpha[..., None], np.clip(lit, 0, 1), 0.02), a]).astype(np.float32)
out[a == 0] = 0
img = Image.fromarray((out * 255).astype(np.uint8))
img.resize((w * ART, h * ART), Image.NEAREST).save(OUT, optimize=True)
ys_, xs_ = np.nonzero(alpha)
print(f'figure: x {xs_.min() * ART}-{(xs_.max() + 1) * ART}, y {ys_.min() * ART}-{(ys_.max() + 1) * ART} of {w * ART}x{h * ART}')
