import { createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';

const initialState = {
  // { [npcId]: [optionId, ...] }, options Frank has talked through to the end
  heardTalkOptions: {},
};

const dialogueSlice = createSlice({
  name: 'dialogue',
  initialState,
  reducers: {
    markTalkOptionHeard: (state, action) => {
      const { npcId, optionId } = action.payload;
      const heard = state.heardTalkOptions[npcId] ?? [];
      if (!heard.includes(optionId)) state.heardTalkOptions[npcId] = [...heard, optionId];
    },
    restoreHeardTalkOptions: (state, action) => {
      state.heardTalkOptions = action.payload ?? {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const { markTalkOptionHeard, restoreHeardTalkOptions } = dialogueSlice.actions;
export const selectHeardTalkOptions = (state, npcId) => state.dialogue?.heardTalkOptions?.[npcId];
export default dialogueSlice.reducer;
