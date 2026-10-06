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
