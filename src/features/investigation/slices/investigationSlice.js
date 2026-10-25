import { createSelector, createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';
import { investigationNotes } from '../data/investigationNotes';
import { investigations, GENERAL_TAB } from '../data/investigations';

const initialState = {
  discoveredNoteIds: [],
  isNotebookOpen: false,
  newNoteId: null,
};

const investigationSlice = createSlice({
  name: 'investigation',
  initialState,
  reducers: {
    // Ignores repeats and unknown ids
    discoverNote: (state, action) => {
      const id = action.payload;
      if (!investigationNotes[id] || state.discoveredNoteIds.includes(id)) return;
      state.discoveredNoteIds.push(id);
      state.newNoteId = id;
    },
    dismissNewNote: (state) => {
      state.newNoteId = null;
    },
    restoreNotes: (state, action) => {
      state.discoveredNoteIds = action.payload ?? [];
    },
    toggleNotebook: (state) => {
      state.isNotebookOpen = !state.isNotebookOpen;
    },
    openNotebook: (state) => {
      state.isNotebookOpen = true;
    },
    closeNotebook: (state) => {
      state.isNotebookOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const { discoverNote, dismissNewNote, restoreNotes, toggleNotebook, openNotebook, closeNotebook } =
  investigationSlice.actions;

const NO_IDS = [];
const selectDiscoveredNoteIds = (state) => state.investigation?.discoveredNoteIds ?? NO_IDS;

export const selectHasDiscoveredNote = (state, id) => selectDiscoveredNoteIds(state).includes(id);

export const selectNewNote = (state) => investigationNotes[state.investigation?.newNoteId] ?? null;

// Ids a save has that no longer have a note are skipped
export const selectNotebookTabs = createSelector([selectDiscoveredNoteIds], (ids) => {
  const notes = ids.map((id) => investigationNotes[id]).filter(Boolean);
  const known = new Set(investigations.map((i) => i.id));

  const tabFor = (investigation, tabNotes) => {
    const rooms = investigation.rooms ?? [];
    const groups = [null, ...rooms].map((room) => ({
      room,
      notes: tabNotes.filter((note) => (room ? note.roomId === room.id : !rooms.some((r) => r.id === note.roomId))),
    }));
    return { ...investigation, groups: groups.filter((group) => group.notes.length) };
  };

  return [
    ...investigations.map((investigation) =>
      tabFor(investigation, notes.filter((note) => note.investigationId === investigation.id))),
    tabFor(GENERAL_TAB, notes.filter((note) => !known.has(note.investigationId))),
  ];
});

export default investigationSlice.reducer;
