import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from '../features/inventory/slices/inventorySlice';
import gameReducer from '../features/game/slices/gameSlice';
import { loadGame } from '../shared/utils/saveGame';

const savedState = loadGame();

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    game: gameReducer,
  },
  preloadedState: savedState || undefined,
});
