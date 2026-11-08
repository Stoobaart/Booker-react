import { GAME_HEIGHT, GAME_WIDTH } from '../../player/utils/playerMath';

export const TIP_WIDTH = 560;
export const TIP_HEIGHT = 190;
const TIP_GAP = 36;
const EDGE = 16;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Below the hole if it fits, else above, else beside it; kept on the canvas
export const tipPlacement = (hole) => {
  if (!hole) return { left: (GAME_WIDTH - TIP_WIDTH) / 2, top: (GAME_HEIGHT - TIP_HEIGHT) / 2, arrow: null };
  const centreX = hole.left + hole.width / 2;
  const centreY = hole.top + hole.height / 2;
  const left = clamp(centreX - TIP_WIDTH / 2, EDGE, GAME_WIDTH - TIP_WIDTH - EDGE);
  const arrowX = clamp(centreX - left, 24, TIP_WIDTH - 24);
  const below = hole.top + hole.height + TIP_GAP;
  if (below + TIP_HEIGHT <= GAME_HEIGHT - EDGE) return { left, top: below, arrow: { side: 'top', offset: arrowX } };
  const above = hole.top - TIP_GAP - TIP_HEIGHT;
  if (above >= EDGE) return { left, top: above, arrow: { side: 'bottom', offset: arrowX } };

  const top = clamp(centreY - TIP_HEIGHT / 2, EDGE, GAME_HEIGHT - TIP_HEIGHT - EDGE);
  const arrowY = clamp(centreY - top, 24, TIP_HEIGHT - 24);
  const right = hole.left + hole.width + TIP_GAP;
  if (right + TIP_WIDTH <= GAME_WIDTH - EDGE) return { left: right, top, arrow: { side: 'left', offset: arrowY } };
  const beside = hole.left - TIP_GAP - TIP_WIDTH;
  if (beside >= EDGE) return { left: beside, top, arrow: { side: 'right', offset: arrowY } };
  // A hole nearly as big as the canvas (the board): the tip waits in the bottom corner
  return { left: GAME_WIDTH - TIP_WIDTH - EDGE, top: GAME_HEIGHT - TIP_HEIGHT - EDGE, arrow: null };
};
