export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 980;

export const getGameScale = () => {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--game-scale')) || 1;
};

// How far a side-scrolling scene has panned, in game px. Game coords include it.
let cameraX = 0;
export const getCameraX = () => cameraX;
export const setCameraX = (x) => {
  cameraX = x;
};

export const screenToGame = (screenX, screenY) => {
  const scale = getGameScale();
  const offsetX = (window.innerWidth - GAME_WIDTH * scale) / 2;
  const offsetY = (window.innerHeight - GAME_HEIGHT * scale) / 2;
  return [(screenX - offsetX) / scale + cameraX, (screenY - offsetY) / scale];
};

export const followCamera = (playerX, worldWidth, viewWidth = GAME_WIDTH) =>
  Math.max(0, Math.min(playerX - viewWidth / 2, worldWidth - viewWidth));

export const calculateWalkTime = (xDiff, yDiff) => {
  const distance = Math.abs(xDiff) + Math.abs(yDiff);
  const multiplier = 4;
  return distance * multiplier;
};

export const getWalkDirection = (xDiff, yDiff) => {
  return Math.abs(xDiff) > Math.abs(yDiff)
    ? (xDiff > 0 ? 'right' : 'left')
    : (yDiff > 0 ? 'down' : 'up');
};

export const DEPTH_SCALE_BACK = 0.7;
export const DEPTH_SCALE_FRONT = 1.4;

// depth: 0 at the back of the walk area, 1 at the front
export const getDepthScale = (depth, baseScale = 1, backScale = DEPTH_SCALE_BACK) => {
  const clamped = Math.max(0, Math.min(depth, 1));
  return baseScale * (backScale + (DEPTH_SCALE_FRONT - backScale) * clamped);
};

export const getFacingDirection = (fromX, toX) => {
  return parseInt(toX) < parseInt(fromX) ? 'left' : 'right';
};

// Obstacles are widened by this each side so his body clears them, not just his feet
export const PLAYER_CLEARANCE = 60;

export const itemStandSpot = (x, y) => [parseInt(x) + 26, parseInt(y) + 74];

const widen = (rect) => ({ ...rect, left: rect.left - PLAYER_CLEARANCE, right: rect.right + PLAYER_CLEARANCE });

const isInside = ([x, y], rect) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;

// Running along an edge doesn't count
export const segmentHitsRect = ([x1, y1], [x2, y2], rect) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of [[-dx, x1 - rect.left], [dx, rect.right - x1], [-dy, y1 - rect.top], [dy, rect.bottom - y1]]) {
    if (p === 0) {
      if (q <= 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t >= t1) return false;
      t0 = Math.max(t0, t);
    } else {
      if (t <= t0) return false;
      t1 = Math.min(t1, t);
    }
  }
  return t1 - t0 > 1e-9;
};

// With bounds, never pushes the point off the floor (e.g. behind a bed against the wall)
export const moveOutOfObstacles = (point, obstacles = [], bounds = null) => {
  const rects = obstacles.map(widen);
  const rect = rects.find((r) => isInside(point, r));
  if (!rect) return point;
  const [x, y] = point;
  const all = [
    [rect.left - 1, y],
    [rect.right + 1, y],
    [x, rect.top - 1],
    [x, rect.bottom + 1],
  ];
  const onFloor = all.filter(([, py]) => !bounds || (py >= bounds.top && py <= bounds.bottom));
  const free = onFloor.filter((p) => !rects.some((r) => isInside(p, r)));
  const exits = free.length ? free : onFloor.length ? onFloor : all;
  return exits.reduce((best, p) => (Math.hypot(p[0] - x, p[1] - y) < Math.hypot(best[0] - x, best[1] - y) ? p : best));
};

// Shortest route via the obstacles' corners. With bounds, corners off the floor aren't used.
export const planPath = (start, end, obstacles = [], bounds = null) => {
  // Don't trap him in an obstacle he starts inside (e.g. from an old save)
  const rects = obstacles.map(widen).filter((r) => !isInside(start, r));
  const target = moveOutOfObstacles(end, obstacles, bounds);
  const clear = (a, b) => !rects.some((r) => segmentHitsRect(a, b, r));
  if (clear(start, target)) return [target];

  const corners = rects.flatMap((r) => [
    [r.left - 1, r.top - 1],
    [r.right + 1, r.top - 1],
    [r.left - 1, r.bottom + 1],
    [r.right + 1, r.bottom + 1],
  ]).filter((p) => !rects.some((r) => isInside(p, r)))
    .filter(([, y]) => !bounds || (y >= bounds.top && y <= bounds.bottom));
  const nodes = [start, target, ...corners];

  // Dijkstra over mutually visible corners
  const distance = nodes.map(() => Infinity);
  const previous = nodes.map(() => null);
  const done = nodes.map(() => false);
  distance[0] = 0;
  for (;;) {
    let current = -1;
    nodes.forEach((_, i) => {
      if (!done[i] && distance[i] < Infinity && (current < 0 || distance[i] < distance[current])) current = i;
    });
    if (current < 0 || current === 1) break;
    done[current] = true;
    nodes.forEach((node, i) => {
      if (done[i] || !clear(nodes[current], node)) return;
      const d = distance[current] + Math.hypot(node[0] - nodes[current][0], node[1] - nodes[current][1]);
      if (d < distance[i]) {
        distance[i] = d;
        previous[i] = current;
      }
    });
  }

  // No way round: walk straight there
  if (distance[1] === Infinity) return [target];
  const path = [];
  for (let i = 1; i !== 0; i = previous[i]) path.unshift(nodes[i]);
  return path;
};
