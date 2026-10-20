import { createSplash, splashesToSpawn, splashPixels, SPLASH_FRAME_MS, SPLASH_LIFETIME_MS } from './rainSplashes';

describe('rainSplashes', () => {
  it('spawns `rate` splashes a second on average, scaled by how much screen they cover', () => {
    expect(splashesToSpawn(120, 1000, 1, () => 0)).toBe(120);
    expect(splashesToSpawn(120, 1000, 0.5, () => 0)).toBe(60);
    // a fraction of a splash this frame becomes one some of the time
    expect(splashesToSpawn(120, 5, 1, () => 0.3)).toBe(0);
    expect(splashesToSpawn(120, 5, 1, () => 0.5)).toBe(1);
  });

  it('places a splash in the visible stretch of ground, deeper towards the front', () => {
    const back = createSplash({ left: 3840, width: 1920, height: 400 }, 0, () => 0);
    expect(back).toEqual({ x: 3840, y: 0, depth: 0, born: 0 });
    const front = createSplash({ left: 3840, width: 1920, height: 400 }, 50, () => 1);
    expect(front).toEqual({ x: 5760, y: 400, depth: 1, born: 50 });
  });

  it('draws bigger, stronger splashes at the front than at the back', () => {
    const back = splashPixels({ x: 100, y: 10, depth: 0, born: 0 }, 0);
    const front = splashPixels({ x: 100, y: 390, depth: 1, born: 0 }, 0);
    expect(back.size).toBe(2);
    expect(front.size).toBe(4);
    expect(front.alpha).toBeGreaterThan(back.alpha);
    expect(back.blocks).toContainEqual([100, 10]);
  });

  it('spreads out as it goes and is gone once its frames have played', () => {
    const splash = { x: 100, y: 100, depth: 0.5, born: 1000 };
    const width = (now) => {
      const xs = splashPixels(splash, now).blocks.map(([x]) => x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width(1000 + 3 * SPLASH_FRAME_MS)).toBeGreaterThan(width(1000));
    expect(splashPixels(splash, 1000 + SPLASH_LIFETIME_MS)).toBeNull();
    expect(splashPixels(splash, 999)).toBeNull();
  });
});
