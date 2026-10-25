"""The HUD buttons' icons, and the mouse cursors.

usage: ui-icons.py <evidence-box-icon.png> <notebook.png> <cursor dir>
"""
import sys

from PIL import Image

SIZE = 32
OUTLINE = (26, 16, 10, 255)


def canvas(size=SIZE):
    return [[None] * size for _ in range(size)]


def rect(px, top, left, bottom, right, colour):
    """Fills rows top..bottom and columns left..right, inclusive."""
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            px[y][x] = colour


def dot(px, y, x, colour):
    px[y][x] = colour


def line(px, y0, x0, y1, x1, colour, thickness=1):
    """A pixel line from (y0, x0) to (y1, x1), thickened sideways."""
    steps = max(abs(y1 - y0), abs(x1 - x0))
    for i in range(steps + 1):
        y = round(y0 + (y1 - y0) * i / steps)
        x = round(x0 + (x1 - x0) * i / steps)
        for t in range(thickness):
            px[y][x + t] = colour


def outlined(px):
    size = len(px)
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for y in range(size):
        for x in range(size):
            if px[y][x]:
                image.putpixel((x, y), px[y][x])
            elif any(
                0 <= y + dy < size and 0 <= x + dx < size and px[y + dy][x + dx]
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1))
            ):
                image.putpixel((x, y), OUTLINE)
    return image


def outline_and_save(px, path):
    outlined(px).save(path)


def evidence_box(path):
    """The inventory: a cardboard archive box with its lid on, like the big one it opens."""
    lid_top, lid_lip, front, speck = (214, 164, 106, 255), (206, 153, 96, 255), (200, 147, 90, 255), (180, 128, 74, 255)
    side, rim, stamp, label, ink = (160, 112, 62, 255), (232, 194, 140, 255), (160, 40, 30, 255), (230, 224, 206, 255), (96, 92, 120, 255)
    px = canvas()

    # The box, its right side turned towards us a little
    rect(px, 13, 4, 27, 24, front)
    rect(px, 27, 4, 27, 24, speck)
    for x, (top, bottom) in zip(range(25, 29), ((13, 27), (12, 26), (11, 25), (10, 24))):
        rect(px, top, x, bottom, x, side)
    # The hand-hole in its side
    rect(px, 16, 26, 17, 26, OUTLINE)
    rect(px, 15, 27, 16, 27, OUTLINE)

    # The lid on top: its top seen from just above, its lip round the front and side
    for y, (left, right) in zip(range(6, 9), ((7, 29), (6, 28), (4, 27))):
        rect(px, y, left, y, right, lid_top)
    rect(px, 8, 4, 8, 26, rim)
    rect(px, 9, 3, 12, 26, lid_lip)
    for x, (top, bottom) in zip(range(27, 30), ((8, 12), (7, 11), (6, 10))):
        rect(px, top, x, bottom, x, side)

    # The red EVIDENCE stamp, too small to read at this size, and the label under it
    rect(px, 15, 7, 19, 21, stamp)
    rect(px, 16, 8, 18, 20, front)
    rect(px, 17, 9, 17, 19, stamp)
    rect(px, 21, 10, 24, 18, label)
    rect(px, 22, 11, 22, 17, ink)

    outline_and_save(px, path)


def notebook(path):
    paper, paper_shade, rule, margin = (232, 223, 200, 255), (196, 180, 142, 255), (124, 146, 186, 255), (176, 52, 44, 255)
    cover, cover_light = (110, 14, 14, 255), (150, 30, 26, 255)
    wire, wire_shine = (150, 150, 158, 255), (220, 220, 228, 255)
    px = canvas()

    # The notebook as it opens: the red cover showing behind the pages at the right and bottom
    rect(px, 7, 9, 27, 28, cover)
    rect(px, 7, 27, 27, 28, cover_light)
    rect(px, 5, 7, 25, 26, paper)
    rect(px, 5, 26, 25, 26, paper_shade)
    rect(px, 25, 7, 25, 26, paper_shade)
    for y in range(9, 25, 3):
        rect(px, y, 13, y, 25, rule)
    rect(px, 6, 13, 24, 13, margin)

    # The spiral binding down the left: each coil round the edge of the page into its hole
    for y in range(7, 24, 3):
        rect(px, y, 4, y + 1, 9, wire)
        rect(px, y, 4, y, 9, wire_shine)
        dot(px, y, 10, OUTLINE)
        dot(px, y + 1, 10, OUTLINE)

    # A pencil laid across it
    wood, lead, rubber, ferrule = (222, 184, 132, 255), (40, 40, 44, 255), (220, 120, 130, 255), (180, 180, 186, 255)
    line(px, 12, 28, 25, 15, (218, 168, 32, 255), thickness=2)
    line(px, 13, 28, 25, 16, (176, 130, 20, 255))
    rect(px, 10, 29, 11, 30, rubber)
    rect(px, 11, 28, 12, 29, ferrule)
    dot(px, 26, 14, wood)
    dot(px, 26, 15, wood)
    dot(px, 27, 13, lead)

    outline_and_save(px, path)


CURSOR_PAPER, CURSOR_SHADE = (232, 223, 200, 255), (196, 180, 142, 255)

# The tip at (1, 1) of the 32px image
CURSOR_ARROW = """
o
.W
.WW
.WWW
.WWWW
.WWWWW
.WWWWWW
.WWWWWWW
.WWWWWWWS
.WWWWSSS
.WWSWWS
.WS.WWS
.S...WWS
.....WWS
......SS
"""

# The fingertip at (9, 1) of the 32px image
CURSOR_HAND = """

....WS
....WS
....WS
....WS
....WSoWSoWS
....WSoWSoWSoWS
.WS.WWWWWWWWWWS
.WWWWWWWWWWWWWS
..WWWWWWWWWWWWS
..WWWWWWWWWWWWS
...WWWWWWWWWWS
....WWWWWWWWWS
....SSSSSSSSS
"""


def cursor(art, path_1x, path_2x):
    """A 16px cursor drawn from a text map, saved at 2x (32px) and 4x for Retina screens."""
    colours = {"W": CURSOR_PAPER, "S": CURSOR_SHADE}
    px = canvas(16)
    for y, row in enumerate(art.split("\n")[1:]):
        for x, ch in enumerate(row):
            px[y][x] = colours.get(ch)
    image = outlined(px)
    for y, row in enumerate(art.split("\n")[1:]):
        for x, ch in enumerate(row):
            if ch == "o":
                image.putpixel((x, y), OUTLINE)
    image.resize((32, 32), Image.NEAREST).save(path_1x)
    image.resize((64, 64), Image.NEAREST).save(path_2x)


if __name__ == "__main__":
    evidence_box(sys.argv[1])
    notebook(sys.argv[2])
    out = sys.argv[3]
    cursor(CURSOR_ARROW, f"{out}/cursor-arrow.png", f"{out}/cursor-arrow@2x.png")
    cursor(CURSOR_HAND, f"{out}/cursor-hand.png", f"{out}/cursor-hand@2x.png")
