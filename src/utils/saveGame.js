const SAVE_KEY = 'booker-save';

export const saveGame = (state) => {
  try {
    const saveData = {
      game: state.game,
      inventory: { items: state.inventory.items },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    // localStorage full or unavailable
  }
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
