import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentScene: null,
  playerPosition: null,
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
  },
});

export const { setCurrentScene, setPlayerPosition } = gameSlice.actions;
export const selectCurrentScene = (state) => state.game.currentScene;
export const selectPlayerPosition = (state) => state.game.playerPosition;
export default gameSlice.reducer;
