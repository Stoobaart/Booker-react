import reducer, {
  discoverNote,
  dismissNewNote,
  restoreNotes,
  toggleNotebook,
  openNotebook,
  closeNotebook,
  selectHasDiscoveredNote,
  selectNewNote,
  selectNotebookTabs,
} from './investigationSlice';
import { startNewGame } from '../../game/slices/gameSlice';
import { investigationNotes } from '../data/investigationNotes';

const fresh = { discoveredNoteIds: [], isNotebookOpen: false, newNoteId: null };
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

  it("groups an investigation's notes by room, in the rooms' order", () => {
    const [flat] = selectNotebookTabs(found('flat-bedroom-computer', 'flat-kitchen-sink', 'flat-kitchen-pedal-bin'));
    expect(flat.id).toBe('victims-flat');
    expect(flat.groups.map((g) => g.room.id)).toEqual(['kitchen', 'bedroom']);
    expect(flat.groups[0].notes.map((n) => n.id)).toEqual(['flat-kitchen-sink', 'flat-kitchen-pedal-bin']);
  });

  it('puts notes from no investigation in a General tab, last', () => {
    const tabs = selectNotebookTabs(found('newspaper-sacked-tube-worker'));
    expect(tabs.at(-1).id).toBe('general');
    expect(tabs.at(-1).groups).toEqual([{ room: null, notes: [investigationNotes['newspaper-sacked-tube-worker']] }]);
    expect(tabs[0].groups).toEqual([]);
  });

  it('skips ids a save has that no longer have a note', () => {
    const tabs = selectNotebookTabs(found('gone', 'flat-hallway-post'));
    expect(tabs.flatMap((t) => t.groups.flatMap((g) => g.notes)).map((n) => n.id)).toEqual(['flat-hallway-post']);
  });

  it('gives every tab, even with nothing found', () => {
    expect(selectNotebookTabs({}).map((t) => t.id)).toEqual(['victims-flat', 'general']);
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
