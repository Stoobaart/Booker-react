import { createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';

const initialState = {
  conversations: {},
};

const npcSlice = createSlice({
  name: 'npc',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { npcId, message } = action.payload;
      if (!state.conversations[npcId]) {
        state.conversations[npcId] = [];
      }
      state.conversations[npcId].push(message);
    },
    restoreConversations: (state, action) => {
      state.conversations = action.payload ?? {};
    },
    clearConversation: (state, action) => {
      delete state.conversations[action.payload.npcId];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const { addMessage, restoreConversations, clearConversation } = npcSlice.actions;
export default npcSlice.reducer;
