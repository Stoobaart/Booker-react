import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './inventorySlice';
import gameReducer from './gameSlice';
import { loadGame } from '../utils/saveGame';

const savedState = loadGame();

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    game: gameReducer,
  },
  preloadedState: savedState || undefined,
});
