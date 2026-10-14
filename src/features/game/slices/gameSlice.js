import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentScene: null,
  playerPosition: null,
  playerDirection: null,
  storyProgress: {
    arrivedAtStation: false,
    // Derek agreed to let Frank through the faulty ticket barrier
    barrierReleased: false,
    // The player has named Derek's sacked colleague, from the newspaper
    namedDereksFriend: false,
  },
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentScene: (state, action) => {
      state.currentScene = action.payload;
    },
    setPlayerPosition: (state, action) => {
      state.playerPosition = action.payload;
    },
    setPlayerDirection: (state, action) => {
      state.playerDirection = action.payload;
    },
    setStoryProgress: (state, action) => {
      state.storyProgress[action.payload] = true;
    },
    // Wipes the game back to a fresh start; the inventory and NPC slices reset on it too
    startNewGame: () => initialState,
    restoreGameState: (state, action) => {
      return {
        ...state,
        ...action.payload,
        storyProgress: { ...state.storyProgress, ...action.payload?.storyProgress },
      };
    },
  },
});

export const { setCurrentScene, setPlayerPosition, setPlayerDirection, setStoryProgress, startNewGame, restoreGameState } = gameSlice.actions;
export const selectCurrentScene = (state) => state.game.currentScene;
export const selectPlayerPosition = (state) => state.game.playerPosition;
export default gameSlice.reducer;
