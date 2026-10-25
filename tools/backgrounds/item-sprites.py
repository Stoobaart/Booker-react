"""Sprites for things Frank can carry, shown in the evidence box: a can of beer, a toy car, a
cassette tape, a door key and a lighter. Also the folded newspaper left on the platform's bench,
which stays in the scene, drawn 4x like the backgrounds.

Small pixel art, drawn from character maps, then given the dark outline wherever an empty pixel
touches the drawing, as the icons are.

usage: item-sprites.py <out dir>
"""
import os
import sys

from PIL import Image

OUTLINE = (26, 16, 10, 255)


def outline_and_save(rows, palette, path):
    """rows: equal-length strings, a palette character per pixel, '.' for empty. Draws them with
    a pixel of room all round for the outline."""
    width, height = len(rows[0]) + 2, len(rows) + 2
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    filled = set()
    for y, row in enumerate(rows):
        for x, char in enumerate(row):
            if char != ".":
                image.putpixel((x + 1, y + 1), palette[char])
                filled.add((x + 1, y + 1))
    for y in range(height):
        for x in range(width):
            if (x, y) not in filled and any((x + dx, y + dy) in filled for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))):
                image.putpixel((x, y), OUTLINE)
    image.save(path)


def shade(colour, factor):
    return tuple(min(255, round(c * factor)) for c in colour[:3]) + (255,)


def beer(path):
    """A can of lager: silver top and bottom, gold can with a red label round the middle,
    lit from the left (each column shaded by how it faces the light)."""
    columns = [0.72, 1.18, 1.1, 1.0, 1.0, 1.0, 1.0, 0.94, 0.88, 0.82, 0.76, 0.7]
    silver, gold, red, white = (176, 178, 186), (214, 172, 64), (186, 34, 30), (238, 232, 216)
    # What each row is made of; the label's middle row has the brand's lettering dotted in white
    bands = (
        [("rim", silver, 0.8)] + [("top", silver, 1.0)] + [("seam", silver, 0.7)]
        + [("can", gold, 1.0)] * 4 + [("label", red, 1.0)] * 2 + [("lettering", red, 1.0)]
        + [("label", red, 1.0)] * 3 + [("can", gold, 1.0)] * 6 + [("rim", silver, 0.75)]
    )
    rows, palette = [], {}
    for kind, colour, brightness in bands:
        row = ""
        for x, column in enumerate(columns):
            if kind == "rim" and x in (0, len(columns) - 1):
                row += "."
                continue
            pixel = white if kind == "lettering" and 2 <= x <= 9 and x % 2 == 0 else colour
            rgba = shade(pixel, brightness * column)
            char = next((c for c, value in palette.items() if value == rgba), None)
            if char is None:
                char = chr(0x100 + len(palette))
                palette[char] = rgba
            row += char
        rows.append(row)
    outline_and_save(rows, palette, path)


def toy_car(path):
    """A little red die-cast car, side on, facing right."""
    # The wheels sit over the body's bottom edge
    rows = [
        "......RRRRRRR.......",
        ".....rbbbbrbbbbr....",
        "....rrbbbbrbbbbrr...",
        "..rrrrrrrrrrrrrrrrr.",
        ".rRRRRRRRRRRRRRRRRRy",
        "rrrrrrrrrrrrrrrrrrrr",
        "ddkkkkdddddddkkkkddd",
        "..kggk.......kggk...",
        "..kggk.......kggk...",
        "...kk.........kk....",
    ]
    palette = {
        "r": (196, 40, 36, 255),
        "R": (232, 92, 80, 255),
        "d": (130, 24, 22, 255),
        "b": (150, 190, 210, 255),
        "y": (250, 220, 90, 255),
        "k": (30, 30, 34, 255),
        "g": (170, 170, 176, 255),
    }
    outline_and_save(rows, palette, path)


def cassette(path):
    """A cassette tape, face on: black shell, a cream label with a hand-written line, the two
    spools showing through the window."""
    rows = [
        "kkkkkkkkkkkkkkkkkkkk",
        "kwwwwwwwwwwwwwwwwwwk",
        "kwiiiiiiiiwwwwwwwwwk",
        "kwwwwwwwwwwwwwwwwwwk",
        "kwwkkkkkkkkkkkkkkwwk",
        "kwwkgggkddddkgggkwwk",
        "kwwkgogkddddkgogkwwk",
        "kwwkgggkddddkgggkwwk",
        "kwwkkkkkkkkkkkkkkwwk",
        "kkkkkkkkkkkkkkkkkkkk",
        "kkkksskkkkkkkksskkkk",
        ".kkkkkkkkkkkkkkkkkk.",
    ]
    palette = {
        "k": (40, 40, 46, 255),
        "w": (226, 218, 196, 255),
        "i": (60, 70, 140, 255),
        "g": (120, 84, 50, 255),
        "o": (200, 200, 206, 255),
        "d": (90, 64, 40, 255),
        "s": (110, 110, 118, 255),
    }
    outline_and_save(rows, palette, path)


def key(path):
    """A brass Yale-type door key, upright: round bow with a hole, toothed blade."""
    rows = [
        "..bbbb..",
        ".bBBBBb.",
        "bBB..BBb",
        "bB....Bb",
        "bB....Bb",
        "bBB..BBb",
        ".bBBBBb.",
        "..bbbb..",
        "...bb...",
        "...bBb..",
        "...bB...",
        "...bBbb.",
        "...bB...",
        "...bBb..",
        "...bBbb.",
        "...bB...",
        "...bb...",
    ]
    palette = {"b": (164, 124, 40, 255), "B": (222, 184, 86, 255)}
    outline_and_save(rows, palette, path)


def lighter(path):
    """A disposable lighter: steel top and wheel, see-through blue body with the fuel in it."""
    rows = [
        "..ss....",
        ".sSSs...",
        "sSssSkk.",
        "sssssskk",
        "dddddddd",
        "bBbbbbbb",
        "bBbbbbbb",
        "bBbbbbbb",
        "fFffffff",
        "fFffffff",
        "fFffffff",
        "fFffffff",
        "fFffffff",
        ".ffffff.",
    ]
    palette = {
        "s": (150, 150, 158, 255),
        "S": (214, 214, 222, 255),
        "k": (50, 50, 56, 255),
        "d": (70, 70, 78, 255),
        "b": (60, 110, 190, 255),
        "B": (130, 170, 230, 255),
        "f": (40, 80, 160, 255),
        "F": (100, 140, 210, 255),
    }
    outline_and_save(rows, palette, path)


def newspaper(path):
    """A folded newspaper lying flat, seen from slightly above."""
    surface = [
        "wwwwwwwwwwwwwwwwwwwwww",
        "wkkkkkkkkkkkkwwwrrrrrw",
        "wwwwwwwwwwwwwwwwwwwwww",
        "wggggggwwddddddwgggggw",
        "wwwwwwwwwddddddwwwwwww",
        "wggggggwwddddddwggggww",
        "wwwwwwwwwwwwwwwwwwwwww",
        "wgggggwggggggwwgggggww",
    ]
    edges = [
        "ffffffffffffffffffffff",
        "eseseseseseseseseseses",
    ]
    lean = [3, 3, 2, 2, 2, 1, 1, 1, 1, 0]  # perspective
    width = len(surface[0]) + max(lean)
    rows = []
    for offset, row in zip(lean, surface + edges):
        rows.append("." * offset + row + "." * (width - offset - len(row)))
    paper = (226, 218, 196, 255)
    palette = {
        "w": paper,
        "k": (40, 40, 46, 255),
        "r": (186, 34, 30, 255),
        "g": (138, 132, 120, 255),
        "d": (92, 92, 100, 255),
        "f": shade(paper, 0.82),
        "e": shade(paper, 0.7),
        "s": shade(paper, 0.55),
    }
    outline_and_save(rows, palette, path)


if __name__ == "__main__":
    out = sys.argv[1]
    beer(os.path.join(out, "beer.png"))
    toy_car(os.path.join(out, "toy-car.png"))
    cassette(os.path.join(out, "cassette.png"))
    key(os.path.join(out, "key.png"))
    lighter(os.path.join(out, "lighter.png"))
    newspaper(os.path.join(out, "newspaper.png"))
