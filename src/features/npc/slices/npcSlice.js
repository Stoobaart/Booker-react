import { createSlice } from '@reduxjs/toolkit';

const npcSlice = createSlice({
  name: 'npc',
  initialState: {
    conversations: {},
  },
  reducers: {
    addMessage: (state, action) => {
      const { npcId, message } = action.payload;
      if (!state.conversations[npcId]) {
        state.conversations[npcId] = [];
      }
      state.conversations[npcId].push(message);
    },
    clearConversation: (state, action) => {
      delete state.conversations[action.payload.npcId];
    },
  },
});

export const { addMessage, clearConversation } = npcSlice.actions;
export default npcSlice.reducer;
