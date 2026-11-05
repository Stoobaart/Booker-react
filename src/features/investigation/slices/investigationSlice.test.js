import reducer, {
  discoverNote,
  dismissNewNote,
  restoreNotes,
  openInvestigation,
  dismissNewInvestigation,
  restoreOpenedInvestigations,
  toggleNotebook,
  openNotebook,
  closeNotebook,
  selectHasDiscoveredNote,
  selectNewNote,
  selectNewInvestigation,
  selectNotebookTabs,
} from './investigationSlice';
import { startNewGame } from '../../game/slices/gameSlice';
import { investigationNotes } from '../data/investigationNotes';

const fresh = {
  discoveredNoteIds: [],
  openedInvestigationIds: ['great-portland-street'],
  isNotebookOpen: false,
  notebookTabId: null,
  newNoteId: null,
  newInvestigationId: null,
};
const asRoot = (investigation) => ({ investigation });

describe('investigationSlice', () => {
  it('starts with no notes and the notebook shut', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(fresh);
  });

  it('adds a note and shows it as new', () => {
    const state = reducer(undefined, discoverNote('flat-kitchen-pedal-bin'));
    expect(state.discoveredNoteIds).toEqual(['flat-kitchen-pedal-bin']);
    expect(state.newNoteId).toBe('flat-kitchen-pedal-bin');
  });

  it('keeps notes in the order they were found', () => {
    let state = reducer(undefined, discoverNote('flat-kitchen-sink'));
    state = reducer(state, discoverNote('flat-hallway-post'));
    expect(state.discoveredNoteIds).toEqual(['flat-kitchen-sink', 'flat-hallway-post']);
  });

  it("ignores a note already found, and doesn't show it as new again", () => {
    let state = reducer(undefined, discoverNote('flat-kitchen-sink'));
    state = reducer(state, dismissNewNote());
    state = reducer(state, discoverNote('flat-kitchen-sink'));
    expect(state.discoveredNoteIds).toEqual(['flat-kitchen-sink']);
    expect(state.newNoteId).toBeNull();
  });

  it('ignores an id with no note', () => {
    expect(reducer(undefined, discoverNote('no-such-note'))).toEqual(fresh);
    expect(reducer(undefined, discoverNote(undefined))).toEqual(fresh);
  });

  it('restores the notes from a save, or none from an old save', () => {
    const state = reducer(undefined, discoverNote('flat-kitchen-sink'));
    expect(reducer(state, restoreNotes(['flat-hallway-post'])).discoveredNoteIds).toEqual(['flat-hallway-post']);
    expect(reducer(state, restoreNotes(undefined)).discoveredNoteIds).toEqual([]);
  });

  it('opens an investigation once, announcing it, and ignores unknown ones', () => {
    let state = reducer(undefined, openInvestigation('victims-flat'));
    expect(state.openedInvestigationIds).toEqual(['great-portland-street', 'victims-flat']);
    expect(state.newInvestigationId).toBe('victims-flat');
    state = reducer(state, dismissNewInvestigation());
    state = reducer(state, openInvestigation('victims-flat'));
    expect(state.newInvestigationId).toBeNull();
    expect(reducer(undefined, openInvestigation('nowhere'))).toEqual(fresh);
  });

  it('restores the investigations opened, or those open at the start for an old save', () => {
    const state = reducer(undefined, openInvestigation('victims-flat'));
    expect(reducer(state, restoreOpenedInvestigations(['victims-flat'])).openedInvestigationIds).toEqual(['victims-flat']);
    expect(reducer(state, restoreOpenedInvestigations(undefined)).openedInvestigationIds).toEqual(['great-portland-street']);
  });

  it('opens the notebook on a tab asked for, and forgets it on closing', () => {
    let state = reducer(undefined, openNotebook('victims-flat'));
    expect(state.notebookTabId).toBe('victims-flat');
    state = reducer(state, closeNotebook());
    expect(state.notebookTabId).toBeNull();
  });

  it('opens, closes and toggles the notebook', () => {
    let state = reducer(undefined, openNotebook());
    expect(state.isNotebookOpen).toBe(true);
    state = reducer(state, closeNotebook());
    expect(state.isNotebookOpen).toBe(false);
    state = reducer(state, toggleNotebook());
    expect(state.isNotebookOpen).toBe(true);
  });

  it('forgets everything on a new game', () => {
    let state = reducer(undefined, discoverNote('flat-kitchen-sink'));
    state = reducer(state, openNotebook());
    state = reducer(state, openInvestigation('victims-flat'));
    expect(reducer(state, startNewGame())).toEqual(fresh);
  });
});

describe('investigation selectors', () => {
  const found = (...ids) => asRoot({ ...fresh, discoveredNoteIds: ids });

  it('says whether a note has been found, even on an old save with no investigation state', () => {
    expect(selectHasDiscoveredNote(found('flat-kitchen-sink'), 'flat-kitchen-sink')).toBe(true);
    expect(selectHasDiscoveredNote(found(), 'flat-kitchen-sink')).toBe(false);
    expect(selectHasDiscoveredNote({}, 'flat-kitchen-sink')).toBe(false);
  });

  it('gives the new note for the toast', () => {
    expect(selectNewNote(asRoot({ ...fresh, newNoteId: 'flat-kitchen-sink' }))).toBe(investigationNotes['flat-kitchen-sink']);
    expect(selectNewNote(asRoot(fresh))).toBeNull();
    expect(selectNewNote({})).toBeNull();
  });

  it('gives the newly opened investigation for the toast', () => {
    expect(selectNewInvestigation(asRoot({ ...fresh, newInvestigationId: 'victims-flat' })).name).toBe("The victim's flat");
    expect(selectNewInvestigation(asRoot(fresh))).toBeNull();
  });

  it("groups an investigation's notes by room, in the rooms' order", () => {
    const [, flat] = selectNotebookTabs(found('flat-bedroom-computer', 'flat-kitchen-sink', 'flat-kitchen-pedal-bin'));
    expect(flat.id).toBe('victims-flat');
    expect(flat.groups.map((g) => g.room.id)).toEqual(['kitchen', 'bedroom']);
    expect(flat.groups[0].notes.map((n) => n.id)).toEqual(['flat-kitchen-sink', 'flat-kitchen-pedal-bin']);
  });

  it('files the station notes under Great Portland St, first, by room', () => {
    const tabs = selectNotebookTabs(found('derek-station-worker', 'newspaper-sacked-tube-worker'));
    const [station] = tabs;
    expect(station.id).toBe('great-portland-street');
    expect(station.groups.map((g) => [g.room.id, g.notes.map((n) => n.id)])).toEqual([
      ['platform', ['newspaper-sacked-tube-worker']],
      ['ticket-hall', ['derek-station-worker']],
    ]);
    expect(tabs.map((t) => t.id)).toEqual(['great-portland-street', 'general']);
  });

  it('skips ids a save has that no longer have a note', () => {
    const tabs = selectNotebookTabs(found('gone', 'flat-hallway-post'));
    expect(tabs.flatMap((t) => t.groups.flatMap((g) => g.notes)).map((n) => n.id)).toEqual(['flat-hallway-post']);
  });

  it("only gives an investigation's tab once it's opened, or has a note", () => {
    expect(selectNotebookTabs({}).map((t) => t.id)).toEqual(['great-portland-street', 'general']);
    const opened = asRoot({ ...fresh, openedInvestigationIds: ['great-portland-street', 'victims-flat'] });
    expect(selectNotebookTabs(opened).map((t) => t.id)).toEqual(['great-portland-street', 'victims-flat', 'general']);
    expect(selectNotebookTabs(found('flat-kitchen-sink')).map((t) => t.id)).toEqual(['great-portland-street', 'victims-flat', 'general']);
  });

  it('every note belongs to a known room of its investigation, or none', () => {
    // A typo in a note's investigationId or roomId would quietly file it in the wrong tab
    const tabs = selectNotebookTabs(found(...Object.keys(investigationNotes)));
    const general = tabs.at(-1).groups.flatMap((g) => g.notes);
    expect(general.every((note) => !note.investigationId)).toBe(true);
    tabs.slice(0, -1).forEach((tab) => {
      expect(tab.groups.every((g) => g.room)).toBe(true);
    });
  });
});
