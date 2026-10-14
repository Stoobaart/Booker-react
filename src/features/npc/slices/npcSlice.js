import { createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';

const initialState = {
  conversations: {},
  // Puzzle facts each NPC has disclosed in conversation: { [npcId]: [factId, ...] }
  discoveredFacts: {},
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
    // Callers pass ids already checked against the NPC's puzzleFacts
    discoverFacts: (state, action) => {
      const { npcId, factIds } = action.payload;
      // Old saves have no discoveredFacts
      state.discoveredFacts ??= {};
      const known = state.discoveredFacts[npcId] ?? [];
      const newIds = factIds.filter((id) => !known.includes(id));
      if (newIds.length) {
        state.discoveredFacts[npcId] = [...known, ...newIds];
      }
    },
    restoreDiscoveredFacts: (state, action) => {
      state.discoveredFacts = action.payload ?? {};
    },
    clearConversation: (state, action) => {
      delete state.conversations[action.payload.npcId];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const { addMessage, restoreConversations, discoverFacts, restoreDiscoveredFacts, clearConversation } = npcSlice.actions;
export const selectHasDiscoveredFact = (state, npcId, factId) =>
  state.npc.discoveredFacts?.[npcId]?.includes(factId) ?? false;
export default npcSlice.reducer;
