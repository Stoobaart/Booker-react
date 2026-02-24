import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentScene: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentScene: (state, action) => {
      state.currentScene = action.payload;
    },
  },
});

export const { setCurrentScene } = gameSlice.actions;
export const selectCurrentScene = (state) => state.game.currentScene;
export default gameSlice.reducer;
