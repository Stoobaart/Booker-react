import { saveGame, loadGame, hasSaveGame, buildSaveData } from './saveGame';

const state = {
  game: {
    currentScene: 'great-portland-street',
    playerPosition: { x: '1px', y: '2px' },
    playerDirection: 'down',
    storyProgress: { arrivedAtStation: true },
  },
  inventory: { items: [{ id: 'banana-1', quantity: 1 }], isOpen: true },
  npc: { conversations: { derek: [{ role: 'user', content: 'Hi' }] } },
  investigation: { discoveredNoteIds: ['flat-kitchen-sink'], isNotebookOpen: true, newNoteId: 'flat-kitchen-sink' },
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
  },
};

describe('saveGame / loadGame', () => {
  it('reports no save initially', () => {
    expect(hasSaveGame()).toBe(false);
    expect(loadGame()).toBeNull();
  });

  it('round-trips game, inventory items, npc conversations, the notes found and the deductions boards', () => {
    saveGame(state);
    expect(hasSaveGame()).toBe(true);
    expect(loadGame()).toEqual({
      game: state.game,
      inventory: { items: state.inventory.items },
      npc: state.npc,
      investigation: { discoveredNoteIds: ['flat-kitchen-sink'] },
      deduction: { boards: state.deduction.boards },
    });
  });

  it('does not persist inventory open/closed UI state', () => {
    saveGame(state);
    expect(loadGame().inventory).not.toHaveProperty('isOpen');
  });

  it('returns null for corrupt save data', () => {
    localStorage.setItem('booker-save', '{not json');
    expect(loadGame()).toBeNull();
  });
});

describe('buildSaveData', () => {
  it('includes npc conversations so NPC memory survives a reload', () => {
    expect(buildSaveData(state).npc).toEqual(state.npc);
  });

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

  it('saves no notes for a store without investigation state', () => {
    const { investigation: _, ...older } = state;
    expect(buildSaveData(older).investigation).toEqual({ discoveredNoteIds: [] });
  });

  it("keeps the boards' cards, their positions and order, and their strings, but not whether the board is open", () => {
    expect(buildSaveData(state).deduction).toEqual({ boards: state.deduction.boards });
  });

  it('saves no boards for a store without deduction state', () => {
    const { deduction: _, ...older } = state;
    expect(buildSaveData(older).deduction).toEqual({ boards: {} });
  });

  it('survives a full save → load round trip', () => {
    saveGame(buildSaveData(state));
    expect(loadGame().npc).toEqual(state.npc);
    expect(loadGame().deduction.boards).toEqual(state.deduction.boards);
  });
});
