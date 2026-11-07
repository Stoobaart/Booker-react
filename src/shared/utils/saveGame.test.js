import { saveGame, loadGame, hasSaveGame, buildSaveData } from './saveGame';

const state = {
  game: {
    currentScene: 'great-portland-street',
    playerPosition: { x: '1px', y: '2px' },
    playerDirection: 'down',
    storyProgress: { arrivedAtStation: true },
  },
  inventory: { items: [{ id: 'banana-1', quantity: 1 }], isOpen: true },
  investigation: { discoveredNoteIds: ['flat-kitchen-sink'], isNotebookOpen: true, newNoteId: 'flat-kitchen-sink' },
  dialogue: { heardTalkOptions: { 'station-worker': ['barriers'] } },
  deduction: {
    isBoardOpen: true,
    boards: {
      'great-portland-street': {
        nodes: [
          { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.2, y: 0.3 },
          { id: 'item:key', kind: 'item', refId: 'key', x: 0.6, y: 0.7 },
        ],
        connections: [{ id: 'item:key~note:derek-station-worker', from: 'note:derek-station-worker', to: 'item:key' }],
      },
    },
    madeDeductionIds: ['derek-knew-sacked-worker'],
  },
};

describe('saveGame / loadGame', () => {
  it('reports no save initially', () => {
    expect(hasSaveGame()).toBe(false);
    expect(loadGame()).toBeNull();
  });

  it('round-trips game, inventory items, the notes found, the talk options heard and the deductions boards', () => {
    saveGame(state);
    expect(hasSaveGame()).toBe(true);
    expect(loadGame()).toEqual({
      game: state.game,
      inventory: { items: state.inventory.items },
      investigation: { discoveredNoteIds: ['flat-kitchen-sink'] },
      dialogue: state.dialogue,
      deduction: { boards: state.deduction.boards, madeDeductionIds: ['derek-knew-sacked-worker'] },
    });
  });

  it('does not persist inventory open/closed UI state', () => {
    saveGame(state);
    expect(loadGame().inventory).not.toHaveProperty('isOpen');
  });

  it('drops the AI chat history old saves have', () => {
    localStorage.setItem('booker-save', JSON.stringify({ game: state.game, npc: { conversations: {} } }));
    expect(loadGame()).toEqual({ game: state.game });
  });

  it('returns null for corrupt save data', () => {
    localStorage.setItem('booker-save', '{not json');
    expect(loadGame()).toBeNull();
  });
});

describe('buildSaveData', () => {

  it('falls back to Redux position/direction when Frank is not on screen', () => {
    const data = buildSaveData(state);
    expect(data.game.playerPosition).toEqual({ x: '1px', y: '2px' });
    expect(data.game.playerDirection).toBe('down');
  });

  it("reads Frank's live position and direction from the DOM", () => {
    const containerEl = document.createElement('div');
    containerEl.style.left = '300px';
    containerEl.style.top = '400px';
    const spriteEl = document.createElement('div');
    spriteEl.className = 'walk left';

    const data = buildSaveData(state, { containerEl, spriteEl });
    expect(data.game.playerPosition).toEqual({ x: '300px', y: '400px' });
    expect(data.game.playerDirection).toBe('left');
  });

  it('keeps the Redux direction when the sprite has no direction class', () => {
    const spriteEl = document.createElement('div');
    spriteEl.className = 'pickup-right';
    expect(buildSaveData(state, { spriteEl }).game.playerDirection).toBe('down');
  });

  it("keeps the notes found, but not whether the notebook is open or a note is being announced", () => {
    expect(buildSaveData(state).investigation).toEqual({ discoveredNoteIds: ['flat-kitchen-sink'] });
  });

  it('keeps the investigations opened', () => {
    const opened = { ...state, investigation: { ...state.investigation, openedInvestigationIds: ['great-portland-street', 'victims-flat'] } };
    expect(buildSaveData(opened).investigation.openedInvestigationIds).toEqual(['great-portland-street', 'victims-flat']);
  });

  it('saves no notes for a store without investigation state', () => {
    const { investigation: _, ...older } = state;
    expect(buildSaveData(older).investigation).toEqual({ discoveredNoteIds: [] });
  });

  it("keeps the boards' cards, their positions and order, their strings and the deductions made, but not whether the board is open", () => {
    expect(buildSaveData(state).deduction).toEqual({ boards: state.deduction.boards, madeDeductionIds: ['derek-knew-sacked-worker'] });
  });

  it('saves the talk options heard, and none for a store without dialogue state', () => {
    expect(buildSaveData(state).dialogue).toEqual(state.dialogue);
    const { dialogue: _, ...older } = state;
    expect(buildSaveData(older).dialogue).toEqual({ heardTalkOptions: {} });
  });

  it('saves no boards for a store without deduction state', () => {
    const { deduction: _, ...older } = state;
    expect(buildSaveData(older).deduction).toEqual({ boards: {}, madeDeductionIds: [] });
  });

  it('keeps how far the tutorial got', () => {
    const tutorial = { doneStepId: 'try-barrier', skipped: false };
    saveGame(buildSaveData({ ...state, tutorial }));
    expect(loadGame().tutorial).toEqual(tutorial);
  });

  it('survives a full save → load round trip', () => {
    saveGame(buildSaveData(state));
    expect(loadGame().deduction.boards).toEqual(state.deduction.boards);
    expect(loadGame().deduction.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);
  });
});
