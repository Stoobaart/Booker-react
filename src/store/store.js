import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './inventorySlice';
import gameReducer from './gameSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    game: gameReducer,
  },
});
