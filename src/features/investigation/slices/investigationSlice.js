import { createSelector, createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';
import { investigationNotes } from '../data/investigationNotes';
import { investigations, GENERAL_TAB } from '../data/investigations';

const START_INVESTIGATION_IDS = investigations.filter((i) => i.openAtStart).map((i) => i.id);

const initialState = {
  discoveredNoteIds: [],
  openedInvestigationIds: START_INVESTIGATION_IDS,
  isNotebookOpen: false,
  // The tab the notebook opens on, if not the first with notes
  notebookTabId: null,
  newNoteId: null,
  newInvestigationId: null,
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
    // Ignores repeats and unknown ids
    openInvestigation: (state, action) => {
      const id = action.payload;
      state.openedInvestigationIds ??= [...START_INVESTIGATION_IDS];
      if (!investigations.some((i) => i.id === id) || state.openedInvestigationIds.includes(id)) return;
      state.openedInvestigationIds.push(id);
      state.newInvestigationId = id;
    },
    dismissNewInvestigation: (state) => {
      state.newInvestigationId = null;
    },
    restoreOpenedInvestigations: (state, action) => {
      state.openedInvestigationIds = action.payload ?? [...START_INVESTIGATION_IDS];
    },
    restoreNotes: (state, action) => {
      state.discoveredNoteIds = action.payload ?? [];
    },
    toggleNotebook: (state) => {
      state.isNotebookOpen = !state.isNotebookOpen;
    },
    openNotebook: (state, action) => {
      state.isNotebookOpen = true;
      state.notebookTabId = action?.payload ?? null;
    },
    closeNotebook: (state) => {
      state.isNotebookOpen = false;
      state.notebookTabId = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const {
  discoverNote,
  dismissNewNote,
  restoreNotes,
  openInvestigation,
  dismissNewInvestigation,
  restoreOpenedInvestigations,
  toggleNotebook,
  openNotebook,
  closeNotebook,
} = investigationSlice.actions;

const NO_IDS = [];
const selectDiscoveredNoteIds = (state) => state.investigation?.discoveredNoteIds ?? NO_IDS;
const selectOpenedInvestigationIds = (state) => state.investigation?.openedInvestigationIds ?? START_INVESTIGATION_IDS;

export const selectHasDiscoveredNote = (state, id) => selectDiscoveredNoteIds(state).includes(id);

export const selectNewNote = (state) => investigationNotes[state.investigation?.newNoteId] ?? null;

export const selectNewInvestigation = (state) =>
  investigations.find((i) => i.id === state.investigation?.newInvestigationId) ?? null;

// Ids a save has that no longer have a note are skipped
export const selectNotebookTabs = createSelector([selectDiscoveredNoteIds, selectOpenedInvestigationIds], (ids, openedIds) => {
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
    ...investigations
      .map((investigation) => tabFor(investigation, notes.filter((note) => note.investigationId === investigation.id)))
      .filter((tab) => openedIds.includes(tab.id) || tab.groups.length),
    tabFor(GENERAL_TAB, notes.filter((note) => !known.has(note.investigationId))),
  ];
});

export default investigationSlice.reducer;
