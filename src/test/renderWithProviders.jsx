import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import inventoryReducer from '../features/inventory/slices/inventorySlice';
import gameReducer from '../features/game/slices/gameSlice';
import investigationReducer from '../features/investigation/slices/investigationSlice';
import dialogueReducer from '../features/dialogue/slices/dialogueSlice';
import deductionReducer from '../features/deduction/slices/deductionSlice';
import tutorialReducer from '../features/tutorial/slices/tutorialSlice';
import PlayerContext from '../features/player/context/PlayerContext';

export const createTestStore = (preloadedState) =>
  configureStore({
    reducer: { inventory: inventoryReducer, game: gameReducer, investigation: investigationReducer, dialogue: dialogueReducer, deduction: deductionReducer, tutorial: tutorialReducer },
    preloadedState,
  });

export const createMockPlayer = (overrides = {}) => ({
  walk: vi.fn(),
  walkTo: vi.fn((x, y, callback) => callback?.()),
  teleport: vi.fn(),
  pickupItem: vi.fn((x, y, callback) => callback?.()),
  hasArrived: true,
  setObstacles: vi.fn(),
  setMovingObstacle: vi.fn(),
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
