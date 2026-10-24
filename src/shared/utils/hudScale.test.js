import { describe, it, expect } from 'vitest';
import { hudIconScale, HUD_ICON_PX, MIN_HUD_TAP_PX } from './hudScale';

describe('hudIconScale', () => {
  it('shows the icons at 2x on a full-size screen', () => {
    expect(hudIconScale(1)).toBe(2);
  });

  it('never goes under 2x, even when the game is drawn larger than 1920px', () => {
    expect(hudIconScale(1.5)).toBe(2);
  });

  it('scales them up by a whole number on a phone, so they are big enough to tap', () => {
    const phoneLandscape = Math.min(844 / 1920, 390 / 980);
    const scale = hudIconScale(phoneLandscape);
    expect(Number.isInteger(scale)).toBe(true);
    expect(HUD_ICON_PX * scale * phoneLandscape).toBeGreaterThanOrEqual(MIN_HUD_TAP_PX);
    expect(HUD_ICON_PX * (scale - 1) * phoneLandscape).toBeLessThan(MIN_HUD_TAP_PX);
  });
});
