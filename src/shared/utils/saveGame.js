const SAVE_KEY = 'booker-save';

// Only the notes found and investigations opened, not UI state
const saveInvestigation = (state) => ({
  discoveredNoteIds: state.investigation?.discoveredNoteIds ?? [],
  ...(state.investigation?.openedInvestigationIds && { openedInvestigationIds: state.investigation.openedInvestigationIds }),
});

// The boards' cards and strings and the deductions made, not whether the board is open
const saveDeduction = (state) => ({
  boards: state.deduction?.boards ?? {},
  madeDeductionIds: state.deduction?.madeDeductionIds ?? [],
});

const saveDialogue = (state) => ({
  heardTalkOptions: state.dialogue?.heardTalkOptions ?? {},
});

export const saveGame = (state) => {
  try {
    const saveData = {
      game: state.game,
      inventory: { items: state.inventory.items },
      investigation: saveInvestigation(state),
      dialogue: saveDialogue(state),
      deduction: saveDeduction(state),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch {
    // localStorage full or unavailable
  }
};

const DIRECTIONS = ['left', 'right', 'up', 'down'];

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
    investigation: saveInvestigation(state),
    dialogue: saveDialogue(state),
    deduction: saveDeduction(state),
  };
};

export const loadGame = () => {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    // Old saves also hold the removed AI chat history
    const { npc: _npc, ...save } = JSON.parse(data);
    return save;
  } catch {
    return null;
  }
};

export const hasSaveGame = () => {
  return localStorage.getItem(SAVE_KEY) !== null;
};
