import { toImagePixel, isSpriteHit } from './spriteHitTest';

describe('toImagePixel', () => {
  // A 960x300 sheet drawn 4x bigger, shifted left to show its third frame
  const rect = { left: -380, top: 200, width: 3840, height: 1200 };

  it('maps a pointer position to the pixel under it', () => {
    expect(toImagePixel(rect, 960, 300, 100, 200)).toEqual([120, 0]);
    expect(toImagePixel(rect, 960, 300, 103.9, 203.9)).toEqual([120, 0]);
    expect(toImagePixel(rect, 960, 300, 104, 204)).toEqual([121, 1]);
  });

  it('returns null outside the image', () => {
    expect(toImagePixel(rect, 960, 300, 100, 199)).toBeNull();
    expect(toImagePixel(rect, 960, 300, 100, 1400)).toBeNull();
    expect(toImagePixel({ left: 50, top: 0, width: 100, height: 100 }, 10, 10, 49, 5)).toBeNull();
    expect(toImagePixel({ left: 50, top: 0, width: 100, height: 100 }, 10, 10, 150, 5)).toBeNull();
  });
});

describe('isSpriteHit', () => {
  it('counts the whole rectangle as a hit when the image cannot be read', () => {
    // jsdom never loads images, so naturalWidth stays 0
    expect(isSpriteHit(document.createElement('img'), 5, 5)).toBe(true);
    expect(isSpriteHit(null, 5, 5)).toBe(true);
  });
});
