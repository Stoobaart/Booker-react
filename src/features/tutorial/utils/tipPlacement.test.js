import { TIP_HEIGHT, TIP_WIDTH, tipPlacement } from './tipPlacement';

describe('tipPlacement', () => {
  it('centres a tip with nothing to point at', () => {
    expect(tipPlacement(null)).toEqual({ left: (1920 - TIP_WIDTH) / 2, top: (980 - TIP_HEIGHT) / 2, arrow: null });
  });

  it('goes below a hole near the top, pointing up at it', () => {
    const { top, arrow } = tipPlacement({ left: 800, top: 100, width: 100, height: 100 });
    expect(top).toBeGreaterThan(200);
    expect(arrow.side).toBe('top');
  });

  it('goes above a hole near the bottom', () => {
    const { top, arrow } = tipPlacement({ left: 800, top: 800, width: 100, height: 100 });
    expect(top + TIP_HEIGHT).toBeLessThan(800);
    expect(arrow.side).toBe('bottom');
  });

  it('stays on the canvas for a hole in a corner', () => {
    const { left } = tipPlacement({ left: 1880, top: 20, width: 30, height: 30 });
    expect(left + TIP_WIDTH).toBeLessThanOrEqual(1920);
  });

  it('goes beside a hole too tall to go above or below', () => {
    // The arrow is on the tip's side facing the hole
    expect(tipPlacement({ left: 200, top: 150, width: 300, height: 650 }).arrow.side).toBe('left');
    expect(tipPlacement({ left: 1500, top: 150, width: 300, height: 650 }).arrow.side).toBe('right');
  });

  it('waits in the bottom corner for a hole nearly as big as the canvas', () => {
    expect(tipPlacement({ left: 50, top: 40, width: 1820, height: 900 })).toEqual({
      left: 1920 - TIP_WIDTH - 16,
      top: 980 - TIP_HEIGHT - 16,
      arrow: null,
    });
  });
});
