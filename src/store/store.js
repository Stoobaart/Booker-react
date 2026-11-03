import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from '../features/inventory/slices/inventorySlice';
import gameReducer from '../features/game/slices/gameSlice';
import investigationReducer from '../features/investigation/slices/investigationSlice';
import dialogueReducer from '../features/dialogue/slices/dialogueSlice';
import deductionReducer from '../features/deduction/slices/deductionSlice';
import { loadGame } from '../shared/utils/saveGame';

const savedState = loadGame();

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    game: gameReducer,
    investigation: investigationReducer,
    dialogue: dialogueReducer,
    deduction: deductionReducer,
  },
  preloadedState: savedState || undefined,
});
