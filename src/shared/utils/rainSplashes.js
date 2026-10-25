export const SPLASH_FRAME_MS = 70;

// In blocks from where the drop lands
const FRAMES = [
  [[0, -2], [0, -1], [0, 0]],
  [[-1, -1], [1, -1], [-2, 0], [0, 0], [2, 0]],
  [[-2, -2], [2, -2], [-3, 0], [-2, 0], [2, 0], [3, 0]],
  [[-4, 0], [-3, 0], [3, 0], [4, 0]],
];
const FRAME_ALPHA = [0.7, 0.65, 0.5, 0.3];

export const SPLASH_LIFETIME_MS = FRAMES.length * SPLASH_FRAME_MS;

// rate: per second across a whole screen; share: the fraction of a screen this covers
export const splashesToSpawn = (rate, dtMs, share, random = Math.random) => {
  const expected = (rate * dtMs * share) / 1000;
  return Math.floor(expected + random());
};

export const createSplash = ({ left, width, height }, now, random = Math.random) => {
  const y = Math.round(random() * height);
  const depth = height > 0 ? y / height : 0;
  return { x: Math.round(left + random() * width), y, depth, born: now };
};

// null once it's over
export const splashPixels = (splash, now) => {
  const frame = Math.floor((now - splash.born) / SPLASH_FRAME_MS);
  if (frame < 0 || frame >= FRAMES.length) return null;
  const size = Math.round(2 + 2 * splash.depth);
  return {
    size,
    alpha: FRAME_ALPHA[frame] * (0.6 + 0.4 * splash.depth),
    blocks: FRAMES[frame].map(([dx, dy]) => [splash.x + dx * size, splash.y + dy * size]),
  };
};
