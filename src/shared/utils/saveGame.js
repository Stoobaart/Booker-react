const SAVE_KEY = 'booker-save';

export const saveGame = (state) => {
  try {
    const saveData = {
      game: state.game,
      inventory: { items: state.inventory.items },
      npc: state.npc,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    // localStorage full or unavailable
  }
};

const DIRECTIONS = ['left', 'right', 'up', 'down'];

// Builds the save payload, reading Frank's live position/direction from the DOM when he's on screen
export const buildSaveData = (state, { containerEl, spriteEl } = {}) => {
  const playerPosition = containerEl
    ? { x: containerEl.style.left, y: containerEl.style.top }
    : state.game.playerPosition;

  const playerDirection = spriteEl
    ? DIRECTIONS.find((d) => spriteEl.classList.contains(d)) ?? state.game.playerDirection
    : state.game.playerDirection;

  return {
    game: { ...state.game, playerPosition, playerDirection },
    inventory: state.inventory,
    npc: state.npc,
  };
};

export const loadGame = () => {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const hasSaveGame = () => {
  return localStorage.getItem(SAVE_KEY) !== null;
};
