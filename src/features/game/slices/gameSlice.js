import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentScene: null,
  playerPosition: null,
  playerDirection: null,
  storyProgress: {
    arrivedAtStation: false,
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
    restoreGameState: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { setCurrentScene, setPlayerPosition, setPlayerDirection, setStoryProgress, restoreGameState } = gameSlice.actions;
export const selectCurrentScene = (state) => state.game.currentScene;
export const selectPlayerPosition = (state) => state.game.playerPosition;
export default gameSlice.reducer;
