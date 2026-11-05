// A string as a chain of points (Verlet integration), in board px.
// Its ends are held to anchors; a null end hangs free.

export const ROPE_POINTS = 14;

// Laid straight from a to b; a rope that will hang free starts with b where its loose end goes
export const createRope = (a, b, count = ROPE_POINTS) =>
  Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    return { x, y, px: x, py: y };
  });

// Always a little longer than the gap, so it sags
export const slackLength = (a, b) => Math.hypot(b.x - a.x, b.y - a.y) * 1.01 + 6;

export const stepRope = (points, a, b, length, { gravity = 0.45, damping = 0.96, iterations = 16 } = {}) => {
  points.forEach((p) => {
    const vx = (p.x - p.px) * damping;
    const vy = (p.y - p.py) * damping;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + gravity;
  });

  const last = points.length - 1;
  const segment = length / last;
  const pin = () => {
    Object.assign(points[0], { x: a.x, y: a.y });
    if (b) Object.assign(points[last], { x: b.x, y: b.y });
  };

  for (let n = 0; n < iterations; n++) {
    pin();
    for (let i = 0; i < last; i++) {
      const p = points[i];
      const q = points[i + 1];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const distance = Math.hypot(dx, dy) || 1;
      const pull = (distance - segment) / distance;
      // A held end doesn't move, so the other point takes all of the correction
      const pFixed = i === 0;
      const qFixed = b && i + 1 === last;
      const share = pFixed || qFixed ? 1 : 0.5;
      if (!pFixed) {
        p.x += dx * pull * share;
        p.y += dy * pull * share;
      }
      if (!qFixed) {
        q.x -= dx * pull * share;
        q.y -= dy * pull * share;
      }
    }
  }
  pin();
  return points;
};

// Shakes it, as if flicked
export const nudgeRope = (points, strength) => {
  points.forEach((p, i) => {
    p.px -= strength * (i / (points.length - 1));
  });
};

// Whole px, so it's drawn like pixel art
export const ropePath = (points) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p.x)} ${Math.round(p.y)}`).join(' ');

// Halfway between the middle two points when there's an even number
export const ropeMiddle = (points) => {
  const after = points[Math.floor(points.length / 2)];
  const before = points[Math.ceil(points.length / 2) - 1];
  return { x: (before.x + after.x) / 2, y: (before.y + after.y) / 2 };
};
