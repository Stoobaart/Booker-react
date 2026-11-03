import { clampToBoard, innerBox, isInside, toFraction, toLocal } from './boardMath';

// A 1000x500 element drawn at half size, 100px in and 50px down the page
const rect = { left: 100, top: 50, width: 500, height: 250 };

describe('boardMath', () => {
  it('gives a pointer as fractions of the box', () => {
    expect(toFraction(350, 175, rect)).toEqual({ x: 0.5, y: 0.5 });
    expect(toFraction(100, 50, rect)).toEqual({ x: 0, y: 0 });
    expect(toFraction(50, 300, rect)).toEqual({ x: -0.1, y: 1 });
  });

  it("gives a pointer in the element's own unscaled px", () => {
    expect(toLocal(350, 175, rect, 1000)).toEqual({ x: 500, y: 250 });
    expect(toLocal(350, 175, { ...rect, width: 1000 }, 1000)).toEqual({ x: 250, y: 125 });
  });

  it('gives the box inside the border, scaled', () => {
    const el = { offsetWidth: 1000, clientLeft: 10, clientTop: 20, clientWidth: 980, clientHeight: 460 };
    expect(innerBox(rect, el)).toEqual({ left: 105, top: 60, width: 490, height: 230 });
  });

  it('knows when a point is on the board', () => {
    expect(isInside({ x: 0, y: 1 })).toBe(true);
    expect(isInside({ x: 0.5, y: 0.5 })).toBe(true);
    expect(isInside({ x: -0.01, y: 0.5 })).toBe(false);
    expect(isInside({ x: 0.5, y: 1.2 })).toBe(false);
  });

  it('keeps a node wholly on the board', () => {
    const node = { width: 100, height: 50 };
    const board = { width: 1000, height: 500 };
    expect(clampToBoard({ x: 0.5, y: 0.5 }, node, board)).toEqual({ x: 0.5, y: 0.5 });
    expect(clampToBoard({ x: -1, y: 2 }, node, board)).toEqual({ x: 0.05, y: 0.95 });
    expect(clampToBoard({ x: 0.99, y: 0.01 }, node, board)).toEqual({ x: 0.95, y: 0.05 });
  });

  it('centres a node too big for the board', () => {
    expect(clampToBoard({ x: 0.1, y: 0.9 }, { width: 2000, height: 1000 }, { width: 1000, height: 500 })).toEqual({ x: 0.5, y: 0.5 });
  });
});
