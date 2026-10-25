"""The evidence box (inventory). The box, lid and propped-open lid share one canvas so the game
can stack them; the row arrow points right and the game flips it.

usage: evidence-box.py <out dir>
"""
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 116, 122
OUTLINE = (26, 16, 10, 255)
FONT = os.path.join(os.path.dirname(__file__), "../../src/assets/fonts/PressStart2P-Regular.ttf")

FRONT, FRONT_SPECK = (200, 147, 90, 255), (184, 132, 78, 255)
SIDE, SIDE_SPECK = (160, 112, 62, 255), (146, 100, 54, 255)
RIM = (226, 186, 132, 255)
INSIDE_LIT, INSIDE = (96, 64, 34, 255), (52, 34, 18, 255)
CUT_EDGE = (120, 84, 46, 255)
LID_TOP, LID_TOP_SPECK = (214, 164, 106, 255), (198, 150, 94, 255)
LID_LIP = (206, 153, 96, 255)
STAMP = (150, 36, 28, 255)
LABEL, LABEL_INK = (230, 224, 206, 255), (96, 92, 120, 255)

# Where the box sits on the canvas: the lid propped behind needs the room above it
TOP = 58  # the front's top edge
BOTTOM = 113
LEFT, RIGHT = 4, 95
DEPTH = (12, -6)  # how far the back edges are from the front ones, on the canvas


def new():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def speckle(image, polygon, colour, chance, seed):
    """Flecks of a darker kraft over a face, the same every run."""
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    rng = random.Random(seed)
    for y in range(H):
        for x in range(W):
            if mask.getpixel((x, y)) and rng.random() < chance:
                image.putpixel((x, y), colour)


def outline(image):
    alpha = image.getchannel("A")
    out = image.copy()
    for y in range(H):
        for x in range(W):
            if alpha.getpixel((x, y)):
                continue
            if any(
                0 <= x + dx < W and 0 <= y + dy < H and alpha.getpixel((x + dx, y + dy)) == 255
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))
            ):
                out.putpixel((x, y), OUTLINE)
    return out


def box(path):
    image = new()
    draw = ImageDraw.Draw(image)
    dx, dy = DEPTH
    front = [(LEFT, TOP), (RIGHT, TOP), (RIGHT, BOTTOM), (LEFT, BOTTOM)]
    side = [(RIGHT + 1, TOP), (RIGHT + 1 + dx, TOP + dy), (RIGHT + 1 + dx, BOTTOM + dy), (RIGHT + 1, BOTTOM)]
    opening = [(LEFT, TOP), (LEFT + dx, TOP + dy), (RIGHT + 1 + dx, TOP + dy), (RIGHT + 1, TOP)]

    draw.polygon(front, fill=FRONT)
    speckle(image, front, FRONT_SPECK, 0.07, 1)
    draw.polygon(side, fill=SIDE)
    speckle(image, side, SIDE_SPECK, 0.07, 2)
    # The box's bottom edge, turned away from the light
    draw.line([(LEFT, BOTTOM), (RIGHT, BOTTOM)], fill=FRONT_SPECK)

    # Into the box: the inside of the back wall catches the light, the rest is in shadow
    draw.polygon(opening, fill=INSIDE)
    draw.polygon([(LEFT + dx, TOP + dy), (RIGHT + 1 + dx, TOP + dy), (RIGHT + 1 + dx - 3, TOP + dy + 3), (LEFT + dx + 3, TOP + dy + 3)], fill=INSIDE_LIT)
    # The cardboard's cut edges round the top
    draw.line([(LEFT, TOP), (RIGHT + 1, TOP)], fill=RIM)
    draw.line([(LEFT + dx, TOP + dy), (RIGHT + 1 + dx, TOP + dy)], fill=RIM)
    draw.line([(LEFT, TOP), (LEFT + dx, TOP + dy)], fill=RIM)
    draw.line([(RIGHT + 1, TOP), (RIGHT + 1 + dx, TOP + dy)], fill=RIM)

    # The hand-hole in the side, slanting with it, its cut edge showing along the bottom
    for x in range(RIGHT + 3, RIGHT + 12):
        centre = TOP + 15 + (x - RIGHT - 1) * dy / dx
        top, bottom = round(centre - 2), round(centre + 2)
        if x in (RIGHT + 3, RIGHT + 11):
            top, bottom = top + 1, bottom - 1
        draw.line([(x, top), (x, bottom)], fill=OUTLINE)
        image.putpixel((x, bottom + 1), CUT_EDGE)

    # EVIDENCE stamped on the front in red, unevenly inked, in a ruled box
    font = ImageFont.truetype(FONT, 8)
    stamp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    stamp_draw = ImageDraw.Draw(stamp)
    text_w = stamp_draw.textlength("EVIDENCE", font=font)
    text_x = round((LEFT + RIGHT) / 2 - text_w / 2)
    stamp_draw.text((text_x, TOP + 10), "EVIDENCE", font=font, fill=STAMP)
    stamp_draw.rectangle([text_x - 3, TOP + 7, text_x + text_w + 2, TOP + 20], outline=STAMP)
    rng = random.Random(3)
    for y in range(H):
        for x in range(W):
            if stamp.getpixel((x, y))[3] and rng.random() > 0.07:
                image.putpixel((x, y), STAMP)

    # A label for the case number, filled in by hand
    label_left, label_top = round((LEFT + RIGHT) / 2) - 20, TOP + 28
    draw.rectangle([label_left, label_top, label_left + 40, label_top + 14], fill=LABEL)
    rng = random.Random(4)
    for row, (start, end) in enumerate(((label_left + 3, label_left + 36), (label_left + 3, label_left + 24))):
        y = label_top + 4 + row * 5
        draw.line([(label_left + 2, y + 2), (label_left + 38, y + 2)], fill=(200, 194, 178, 255))
        x = start
        while x < end:
            run = rng.randint(2, 5)
            for i in range(run):
                if x + i < end:
                    image.putpixel((x + i, y + (1 if (x + i) % 3 == 0 else 0)), LABEL_INK)
            x += run + 1

    image = outline(image)

    # Its shadow on the floor, drawn after the outline so it doesn't get one
    shadow = (0, 0, 0, 90)
    for y, (left, right) in zip(range(BOTTOM + 2, BOTTOM + 6), ((LEFT + 2, RIGHT + dx + 3), (LEFT + 1, RIGHT + dx + 2), (LEFT + 3, RIGHT + dx), (LEFT + 6, RIGHT + dx - 4))):
        for x in range(left, right + 1):
            if not image.getpixel((x, y))[3]:
                image.putpixel((x, y), shadow)
    image.save(path)


def lid(path):
    image = new()
    draw = ImageDraw.Draw(image)
    dx, dy = DEPTH
    lip_top, lip_bottom = TOP - 4, TOP + 6
    left, right = LEFT - 2, RIGHT + 2
    top_face = [(left, lip_top), (left + dx, lip_top + dy), (right + 1 + dx, lip_top + dy), (right + 1, lip_top)]
    lip = [(left, lip_top), (right, lip_top), (right, lip_bottom), (left, lip_bottom)]
    side_lip = [(right + 1, lip_top), (right + 1 + dx, lip_top + dy), (right + 1 + dx, lip_bottom + dy), (right + 1, lip_bottom)]

    draw.polygon(top_face, fill=LID_TOP)
    speckle(image, top_face, LID_TOP_SPECK, 0.07, 5)
    draw.line([(left, lip_top), (right + 1, lip_top)], fill=RIM)
    draw.polygon(lip, fill=LID_LIP)
    speckle(image, lip, FRONT_SPECK, 0.07, 6)
    draw.polygon(side_lip, fill=SIDE)
    speckle(image, side_lip, SIDE_SPECK, 0.07, 7)

    # Two finger slots in the front of the lip, as on the real thing
    for centre in (round(left + (right - left) * 0.3), round(left + (right - left) * 0.7)):
        draw.line([(centre - 4, lip_top + 4), (centre + 4, lip_top + 4)], fill=OUTLINE)
        draw.line([(centre - 3, lip_top + 5), (centre + 3, lip_top + 5)], fill=CUT_EDGE)

    image = outline(image)

    # The lip's shadow on the box just under it
    for x in range(left + 1, right + dx + 1):
        y = lip_bottom + 2 + (min(0, round((x - right - 1) * dy / dx)) if x > right else 0)
        if not image.getpixel((x, y))[3]:
            image.putpixel((x, y), (0, 0, 0, 70))
    image.save(path)


def lid_open(path):
    """The lid propped up behind the box, inside facing us."""
    image = new()
    draw = ImageDraw.Draw(image)
    dx, dy = DEPTH
    # Runs well down behind the box, so there's no gap while it drops into place
    left, right, top, bottom = LEFT + dx - 2, RIGHT + 1 + dx + 2, 10, TOP + dy + 12
    wall_left, wall_top, wall_right = 5, 3, 2
    panel = (left + wall_left + 1, top + wall_top + 1, right - wall_right - 1, bottom)

    draw.rectangle(panel, fill=LID_TOP)
    speckle(image, [(panel[0], panel[1]), (panel[2], panel[1]), (panel[2], panel[3]), (panel[0], panel[3])], LID_TOP_SPECK, 0.07, 8)
    for step, colour in enumerate(((150, 106, 60, 255), (168, 120, 70, 255), (184, 134, 80, 255), (198, 148, 92, 255))):
        draw.rectangle([panel[0], panel[1] + step * 3, panel[2], panel[1] + step * 3 + 2], fill=colour)
        draw.rectangle([panel[2] - step * 3 - 2, panel[1] + step * 3, panel[2] - step * 3, panel[3]], fill=colour)
    speckle(image, [(panel[0], panel[1]), (panel[2], panel[1]), (panel[2], panel[3]), (panel[0], panel[3])], LID_TOP_SPECK, 0.04, 11)

    # The creases where the walls meet the panel
    crease = (150, 104, 58, 255)
    draw.line([(panel[0] - 1, panel[1] - 1), (panel[0] - 1, panel[3])], fill=crease)
    draw.line([(panel[0] - 1, panel[1] - 1), (panel[2] + 1, panel[1] - 1)], fill=crease)

    left_wall = [(left, top), (left + wall_left, top + wall_top), (left + wall_left, bottom), (left, bottom)]
    draw.polygon(left_wall, fill=(220, 172, 114, 255))
    speckle(image, left_wall, LID_TOP_SPECK, 0.07, 10)
    # The top wall's inside, turned down away from the light
    draw.polygon([(left, top), (right, top), (right - wall_right, top + wall_top), (left + wall_left, top + wall_top)], fill=(184, 134, 80, 255))
    # The right wall: only its edge, in shadow
    draw.polygon([(right, top), (right, bottom), (right - wall_right, bottom), (right - wall_right, top + wall_top)], fill=SIDE)

    # The cut edge along the top and down the left, catching the light
    draw.line([(left, top), (right, top)], fill=RIM)
    draw.line([(left, top), (left, bottom)], fill=RIM)

    image = outline(image)
    image.save(path)


def arrow(path):
    """A small cream arrow, pointing right, lit along its top edge, outlined dark like the rest."""
    width, height = 7, 9
    image = Image.new("RGBA", (width + 2, height + 2), (0, 0, 0, 0))
    paper, paper_shade, paper_light = (232, 223, 200, 255), (196, 180, 142, 255), (250, 246, 232, 255)
    for y in range(height):
        reach = min(y, height - 1 - y) + 1
        for x in range(reach * 7 // 5):
            colour = paper_light if y < 2 else paper_shade if y > height // 2 else paper
            image.putpixel((x + 1, y + 1), colour)
    alpha = image.getchannel("A")
    out = image.copy()
    for y in range(height + 2):
        for x in range(width + 2):
            if not alpha.getpixel((x, y)) and any(
                0 <= x + dx < width + 2 and 0 <= y + dy < height + 2 and alpha.getpixel((x + dx, y + dy))
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))
            ):
                out.putpixel((x, y), OUTLINE)
    out.save(path)


if __name__ == "__main__":
    out = sys.argv[1]
    box(os.path.join(out, "evidence-box.png"))
    lid(os.path.join(out, "evidence-box-lid.png"))
    lid_open(os.path.join(out, "evidence-box-lid-open.png"))
    arrow(os.path.join(out, "evidence-box-arrow.png"))
