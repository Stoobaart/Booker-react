export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 980;

export const getGameScale = () => {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--game-scale')) || 1;
};

// How far a side-scrolling scene has panned right, in game px; 0 in a scene that fits the screen.
// Game coords are positions in the scene, so they include it.
let cameraX = 0;
export const getCameraX = () => cameraX;
export const setCameraX = (x) => {
  cameraX = x;
};

// Converts page coords to game coords, accounting for the scaled, centred canvas and the camera
export const screenToGame = (screenX, screenY) => {
  const scale = getGameScale();
  const offsetX = (window.innerWidth - GAME_WIDTH * scale) / 2;
  const offsetY = (window.innerHeight - GAME_HEIGHT * scale) / 2;
  return [(screenX - offsetX) / scale + cameraX, (screenY - offsetY) / scale];
};

// Where the camera sits to keep Frank (at playerX in the scene) centred, without showing past
// either end of a scene worldWidth wide
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

// Frank is drawn smaller at the back of the walk area and larger at the front, for a sense of depth
export const DEPTH_SCALE_BACK = 0.7;
export const DEPTH_SCALE_FRONT = 1.4;

// depth: 0 at the back edge of the walk area, 1 at the front. A scene with a shallow walk area can
// raise backScale so he doesn't shrink so sharply walking away.
export const getDepthScale = (depth, baseScale = 1, backScale = DEPTH_SCALE_BACK) => {
  const clamped = Math.max(0, Math.min(depth, 1));
  return baseScale * (backScale + (DEPTH_SCALE_FRONT - backScale) * clamped);
};

// Which way Frank should look, standing at fromX, to face something at toX
export const getFacingDirection = (fromX, toX) => {
  return parseInt(toX) < parseInt(fromX) ? 'left' : 'right';
};

// Obstacles are floor footprints ({ left, right, top, bottom }) that Frank's feet can't cross.
// They are widened by this much each side, so his body doesn't overlap the obstacle beside it.
export const PLAYER_CLEARANCE = 60;

// Where Frank's feet go to reach an item drawn at (x, y): just in front of it and a little to its right
export const itemStandSpot = (x, y) => [parseInt(x) + 26, parseInt(y) + 74];

const widen = (rect) => ({ ...rect, left: rect.left - PLAYER_CLEARANCE, right: rect.right + PLAYER_CLEARANCE });

const isInside = ([x, y], rect) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;

// Whether the segment passes through the inside of the rect (running along an edge doesn't count)
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

// The nearest point just outside any obstacle the point is inside
export const moveOutOfObstacles = (point, obstacles = []) => {
  const rect = obstacles.map(widen).find((r) => isInside(point, r));
  if (!rect) return point;
  const [x, y] = point;
  const exits = [
    [rect.left - 1, y],
    [rect.right + 1, y],
    [x, rect.top - 1],
    [x, rect.bottom + 1],
  ];
  return exits.reduce((best, p) => (Math.hypot(p[0] - x, p[1] - y) < Math.hypot(best[0] - x, best[1] - y) ? p : best));
};

// Feet positions to walk through, in order, to get from start to end without crossing an obstacle:
// the shortest route via the obstacles' corners. The last one is the end, moved out of any obstacle.
// With `bounds` ({ top, bottom }, the walk area's edges), corners off the floor aren't used, so he
// never goes round the back of something standing against a wall by walking up the wall.
export const planPath = (start, end, obstacles = [], bounds = null) => {
  // An obstacle he is already standing in (from an old save, say) doesn't trap him
  const rects = obstacles.map(widen).filter((r) => !isInside(start, r));
  const target = moveOutOfObstacles(end, obstacles);
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

  // Dijkstra over the corners that can see each other
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

  // No way round: walk straight there rather than not at all
  if (distance[1] === Infinity) return [target];
  const path = [];
  for (let i = 1; i !== 0; i = previous[i]) path.unshift(nodes[i]);
  return path;
};
