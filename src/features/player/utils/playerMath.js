export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 980;

export const getGameScale = () => {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--game-scale')) || 1;
};

// Converts page coords to game coords, accounting for the scaled, centred canvas
export const screenToGame = (screenX, screenY) => {
  const scale = getGameScale();
  const offsetX = (window.innerWidth - GAME_WIDTH * scale) / 2;
  const offsetY = (window.innerHeight - GAME_HEIGHT * scale) / 2;
  return [(screenX - offsetX) / scale, (screenY - offsetY) / scale];
};

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

// depth: 0 at the back edge of the walk area, 1 at the front
export const getDepthScale = (depth, baseScale = 1) => {
  const clamped = Math.max(0, Math.min(depth, 1));
  return baseScale * (DEPTH_SCALE_BACK + (DEPTH_SCALE_FRONT - DEPTH_SCALE_BACK) * clamped);
};

// Which way Frank should look, standing at fromX, to face something at toX
export const getFacingDirection = (fromX, toX) => {
  return parseInt(toX) < parseInt(fromX) ? 'left' : 'right';
};
