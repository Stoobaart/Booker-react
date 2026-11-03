// Pointer positions from client coords, which already include the game's scale

// As fractions of the element's box: 0..1 inside it
export const toFraction = (clientX, clientY, rect) => ({
  x: (clientX - rect.left) / rect.width,
  y: (clientY - rect.top) / rect.height,
});

// In the element's own unscaled px, for placing something inside it
export const toLocal = (clientX, clientY, rect, layoutWidth) => {
  const scale = layoutWidth ? rect.width / layoutWidth : 1;
  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
};

// The on-screen box inside an element's border, which absolutely placed children are measured from
export const innerBox = (rect, { offsetWidth, clientLeft, clientTop, clientWidth, clientHeight }) => {
  const scale = offsetWidth ? rect.width / offsetWidth : 1;
  return {
    left: rect.left + clientLeft * scale,
    top: rect.top + clientTop * scale,
    width: clientWidth * scale,
    height: clientHeight * scale,
  };
};

export const isInside = ({ x, y }) => x >= 0 && x <= 1 && y >= 0 && y <= 1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Keeps a node of nodeSize (px) wholly on a board of boardSize (px), its centre at pos
export const clampToBoard = (pos, nodeSize, boardSize) => {
  const marginX = Math.min(0.5, nodeSize.width / 2 / boardSize.width);
  const marginY = Math.min(0.5, nodeSize.height / 2 / boardSize.height);
  return { x: clamp(pos.x, marginX, 1 - marginX), y: clamp(pos.y, marginY, 1 - marginY) };
};
