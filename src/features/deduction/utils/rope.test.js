import { createRope, nudgeRope, ropeMiddle, ropePath, slackLength, stepRope } from './rope';

const settle = (points, a, b, length, frames = 400) => {
  for (let i = 0; i < frames; i++) stepRope(points, a, b, length);
  return points;
};

describe('rope', () => {
  it('starts as a straight line between its ends', () => {
    const rope = createRope({ x: 0, y: 0 }, { x: 100, y: 50 }, 5);
    expect(rope.map(({ x, y }) => [x, y])).toEqual([[0, 0], [25, 12.5], [50, 25], [75, 37.5], [100, 50]]);
  });

  it('keeps its ends on their anchors', () => {
    const a = { x: 10, y: 20 };
    const b = { x: 300, y: 40 };
    const rope = settle(createRope(a, b), a, b, slackLength(a, b));
    expect(rope[0]).toMatchObject(a);
    expect(rope.at(-1)).toMatchObject(b);
  });

  it('sags below a level gap when slack, and settles still', () => {
    const a = { x: 0, y: 100 };
    const b = { x: 300, y: 100 };
    const rope = settle(createRope(a, b), a, b, slackLength(a, b));
    expect(ropeMiddle(rope).y).toBeGreaterThan(110);
    rope.forEach((p) => {
      expect(Math.abs(p.y - p.py)).toBeLessThan(0.01);
    });
  });

  it('follows an anchor that moves', () => {
    const a = { x: 0, y: 0 };
    let b = { x: 100, y: 0 };
    const rope = settle(createRope(a, b), a, b, slackLength(a, b));
    b = { x: 400, y: 200 };
    settle(rope, a, b, slackLength(a, b));
    expect(rope.at(-1)).toMatchObject(b);
    expect(ropeMiddle(rope).x).toBeGreaterThan(150);
  });

  it('hangs straight down from one anchor with its other end free', () => {
    const a = { x: 50, y: 0 };
    const rope = settle(createRope(a, { x: 50, y: 120 }), a, null, 120);
    expect(rope.at(-1).x).toBeCloseTo(50, 0);
    expect(rope.at(-1).y).toBeCloseTo(120, -1);
  });

  it('swings when nudged, then settles back', () => {
    const a = { x: 50, y: 0 };
    const rope = settle(createRope(a, { x: 50, y: 120 }), a, null, 120);
    nudgeRope(rope, 10);
    stepRope(rope, a, null, 120);
    expect(rope.at(-1).x).toBeGreaterThan(55);
    settle(rope, a, null, 120, 1000);
    expect(rope.at(-1).x).toBeCloseTo(50, 0);
  });

  it('draws as a path through whole pixels', () => {
    expect(ropePath([{ x: 0.4, y: 1.6 }, { x: 10.5, y: 3 }])).toBe('M0 2 L11 3');
  });
});
