import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import inventoryReducer from '../features/inventory/slices/inventorySlice';
import gameReducer from '../features/game/slices/gameSlice';
import npcReducer from '../features/npc/slices/npcSlice';
import PlayerContext from '../features/player/context/PlayerContext';

export const createTestStore = (preloadedState) =>
  configureStore({
    reducer: { inventory: inventoryReducer, game: gameReducer, npc: npcReducer },
    preloadedState,
  });

// Player actions run their callback immediately, standing in for "Frank arrived"
export const createMockPlayer = (overrides = {}) => ({
  walk: vi.fn(),
  walkTo: vi.fn((x, y, callback) => callback?.()),
  teleport: vi.fn(),
  pickupItem: vi.fn((x, y, callback) => callback?.()),
  hasArrived: true,
  ...overrides,
});

export const renderWithProviders = (
  ui,
  { preloadedState, store = createTestStore(preloadedState), player = createMockPlayer() } = {}
) => {
  const result = render(
    <Provider store={store}>
      <PlayerContext.Provider value={player}>{ui}</PlayerContext.Provider>
    </Provider>
  );
  return { ...result, store, player };
};
