import { createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';

const initialState = {
  // { [npcId]: [optionId, ...] }, options Frank has talked through to the end
  heardTalkOptions: {},
  // NPC chats on screen; not saved
  openChats: 0,
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
    chatOpened: (state) => {
      state.openChats += 1;
    },
    chatClosed: (state) => {
      state.openChats = Math.max(0, state.openChats - 1);
    },
    restoreHeardTalkOptions: (state, action) => {
      state.heardTalkOptions = action.payload ?? {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const { markTalkOptionHeard, chatOpened, chatClosed, restoreHeardTalkOptions } = dialogueSlice.actions;
export const selectIsChatOpen = (state) => (state.dialogue?.openChats ?? 0) > 0;
export const selectHeardTalkOptions = (state, npcId) => state.dialogue?.heardTalkOptions?.[npcId];
export default dialogueSlice.reducer;
