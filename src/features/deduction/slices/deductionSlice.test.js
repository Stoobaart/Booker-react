import reducer, {
  toggleBoard,
  openBoard,
  closeBoard,
  placeNode,
  moveNode,
  removeNode,
  connectNodes,
  disconnectNodes,
  restoreBoards,
  restoreMadeDeductions,
  selectBoardNodes,
  selectHasMadeDeduction,
  selectBoardConnections,
} from './deductionSlice';
import { startNewGame } from '../../game/slices/gameSlice';

const fresh = reducer(undefined, { type: 'init' });
const STATION = 'great-portland-street';
const place = (state, kind, refId, x = 0.5, y = 0.5) =>
  reducer(state, placeNode({ boardId: STATION, kind, refId, x, y }));

describe('deductionSlice', () => {
  it('starts shut with nothing pinned', () => {
    expect(fresh).toEqual({ isBoardOpen: false, boards: {}, madeDeductionIds: [] });
  });

  it('opens, closes and toggles', () => {
    expect(reducer(fresh, openBoard()).isBoardOpen).toBe(true);
    expect(reducer(reducer(fresh, openBoard()), closeBoard()).isBoardOpen).toBe(false);
    expect(reducer(fresh, toggleBoard()).isBoardOpen).toBe(true);
  });

  it('pins notes and items to a board, each only once', () => {
    let state = place(fresh, 'note', 'derek-station-worker', 0.2, 0.3);
    state = place(state, 'item', 'key');
    state = place(state, 'note', 'derek-station-worker', 0.9, 0.9);
    expect(state.boards[STATION].nodes).toEqual([
      { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.2, y: 0.3 },
      { id: 'item:key', kind: 'item', refId: 'key', x: 0.5, y: 0.5 },
    ]);
  });

  it('keeps a note and an item with the same id apart', () => {
    const state = place(place(fresh, 'note', 'key'), 'item', 'key');
    expect(state.boards[STATION].nodes.map((n) => n.id)).toEqual(['note:key', 'item:key']);
  });

  it('moves a node, ignoring ones not on the board', () => {
    let state = place(fresh, 'item', 'key');
    state = reducer(state, moveNode({ boardId: STATION, nodeId: 'item:key', x: 0.1, y: 0.8 }));
    state = reducer(state, moveNode({ boardId: STATION, nodeId: 'item:gone', x: 0, y: 0 }));
    state = reducer(state, moveNode({ boardId: 'elsewhere', nodeId: 'item:key', x: 0, y: 0 }));
    expect(state.boards[STATION].nodes).toEqual([{ id: 'item:key', kind: 'item', refId: 'key', x: 0.1, y: 0.8 }]);
  });

  it('puts a moved node last, so it is drawn on top', () => {
    let state = place(place(place(fresh, 'item', 'key'), 'item', 'lighter'), 'note', 'derek-station-worker');
    state = reducer(state, moveNode({ boardId: STATION, nodeId: 'item:key', x: 0.3, y: 0.3 }));
    expect(state.boards[STATION].nodes.map((n) => n.id)).toEqual(['item:lighter', 'note:derek-station-worker', 'item:key']);
  });

  it('takes a node off the board, so it can be pinned again', () => {
    let state = place(place(fresh, 'item', 'key'), 'item', 'lighter');
    state = reducer(state, removeNode({ boardId: STATION, nodeId: 'item:key' }));
    state = reducer(state, removeNode({ boardId: 'elsewhere', nodeId: 'item:lighter' }));
    expect(state.boards[STATION].nodes.map((n) => n.id)).toEqual(['item:lighter']);
    state = place(state, 'item', 'key', 0.1, 0.1);
    expect(state.boards[STATION].nodes.map((n) => n.id)).toEqual(['item:lighter', 'item:key']);
  });

  it("only pins a note on its own investigation's board, and evidence on any", () => {
    let state = place(fresh, 'note', 'flat-kitchen-sink');
    expect(state.boards[STATION]).toBeUndefined();
    state = reducer(state, placeNode({ boardId: 'victims-flat', kind: 'note', refId: 'flat-kitchen-sink', x: 0.5, y: 0.5 }));
    state = reducer(state, placeNode({ boardId: 'victims-flat', kind: 'item', refId: 'key', x: 0.5, y: 0.5 }));
    state = place(state, 'item', 'key');
    expect(state.boards['victims-flat'].nodes.map((n) => n.id)).toEqual(['note:flat-kitchen-sink', 'item:key']);
    expect(state.boards[STATION].nodes.map((n) => n.id)).toEqual(['item:key']);
  });

  it("sends a note saved on another investigation's board back to the sidebar, with its strings", () => {
    const state = reducer(fresh, restoreBoards({
      [STATION]: {
        nodes: [
          { id: 'note:flat-kitchen-sink', kind: 'note', refId: 'flat-kitchen-sink', x: 0.2, y: 0.2 },
          { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.5, y: 0.5 },
          { id: 'item:key', kind: 'item', refId: 'key', x: 0.8, y: 0.8 },
        ],
        connections: [
          { id: 'note:derek-station-worker~note:flat-kitchen-sink', from: 'note:flat-kitchen-sink', to: 'note:derek-station-worker' },
          { id: 'item:key~note:derek-station-worker', from: 'item:key', to: 'note:derek-station-worker' },
        ],
      },
    }));
    expect(state.boards[STATION].nodes.map((n) => n.id)).toEqual(['note:derek-station-worker', 'item:key']);
    expect(state.boards[STATION].connections.map((c) => c.id)).toEqual(['item:key~note:derek-station-worker']);
  });

  describe('connections', () => {
    const connect = (state, from, to) => reducer(state, connectNodes({ boardId: STATION, from, to }));
    const pinned = place(place(place(fresh, 'item', 'key'), 'item', 'lighter'), 'note', 'derek-station-worker');

    it('records a string between two nodes, once whichever way round', () => {
      let state = connect(pinned, 'item:key', 'note:derek-station-worker');
      state = connect(state, 'note:derek-station-worker', 'item:key');
      expect(state.boards[STATION].connections).toEqual([
        { id: 'item:key~note:derek-station-worker', from: 'item:key', to: 'note:derek-station-worker' },
      ]);
    });

    it('chains a node to more than one other', () => {
      let state = connect(pinned, 'item:key', 'item:lighter');
      state = connect(state, 'item:lighter', 'note:derek-station-worker');
      expect(selectBoardConnections({ deduction: state }, STATION).map((c) => [c.from, c.to])).toEqual([
        ['item:key', 'item:lighter'],
        ['item:lighter', 'note:derek-station-worker'],
      ]);
    });

    it("ignores a node to itself, and one that isn't on the board", () => {
      let state = connect(pinned, 'item:key', 'item:key');
      state = connect(state, 'item:key', 'item:banana');
      expect(state.boards[STATION].connections).toEqual([]);
    });

    it('cuts a string', () => {
      let state = connect(connect(pinned, 'item:key', 'item:lighter'), 'item:key', 'note:derek-station-worker');
      state = reducer(state, disconnectNodes({ boardId: STATION, connectionId: 'item:key~item:lighter' }));
      expect(state.boards[STATION].connections.map((c) => c.id)).toEqual(['item:key~note:derek-station-worker']);
    });

    it("cuts a node's strings when it comes off the board", () => {
      let state = connect(connect(pinned, 'item:key', 'item:lighter'), 'item:lighter', 'note:derek-station-worker');
      state = reducer(state, removeNode({ boardId: STATION, nodeId: 'item:key' }));
      expect(state.boards[STATION].connections.map((c) => c.id)).toEqual(['item:lighter~note:derek-station-worker']);
    });

    it('copes with a board saved before strings', () => {
      const old = { ...fresh, boards: { [STATION]: { nodes: pinned.boards[STATION].nodes } } };
      expect(connect(old, 'item:key', 'item:lighter').boards[STATION].connections).toHaveLength(1);
      expect(reducer(old, removeNode({ boardId: STATION, nodeId: 'item:key' })).boards[STATION].connections).toEqual([]);
      expect(selectBoardConnections({ deduction: old }, STATION)).toEqual([]);
    });
  });

  describe('deductions', () => {
    const BOARD = 'great-portland-street';
    const PAPER = 'note:newspaper-sacked-tube-worker';
    const DEREK = 'note:derek-station-worker';
    const POST_IT = 'deduction:derek-knew-sacked-worker';
    const STRING = 'note:derek-station-worker~note:newspaper-sacked-tube-worker';
    const on = (state, kind, refId, x, y) => reducer(state, placeNode({ boardId: BOARD, kind, refId, x, y }));
    const connect = (state, from, to) => reducer(state, connectNodes({ boardId: BOARD, from, to }));
    const cut = (state, connectionId) => reducer(state, disconnectNodes({ boardId: BOARD, connectionId }));
    const pinned = on(on(on(fresh, 'note', 'newspaper-sacked-tube-worker', 0.2, 0.3), 'note', 'derek-station-worker', 0.6, 0.5), 'item', 'key', 0.8, 0.2);
    const nodeIds = (state) => state.boards[BOARD].nodes.map((n) => n.id);

    it('puts a post-it below the middle of the string that makes it, and remembers it was made', () => {
      const state = connect(pinned, DEREK, PAPER);
      const postIt = state.boards[BOARD].nodes.at(-1);
      expect(postIt).toMatchObject({ id: POST_IT, kind: 'deduction', refId: 'derek-knew-sacked-worker', x: 0.4 });
      expect(postIt.y).toBeCloseTo(0.6);
      expect(selectHasMadeDeduction({ deduction: state }, 'derek-knew-sacked-worker')).toBe(true);
    });

    it('puts it above the string when there is no room below', () => {
      const low = on(on(fresh, 'note', 'newspaper-sacked-tube-worker', 0.05, 0.8), 'note', 'derek-station-worker', 0.15, 0.8);
      const postIt = connect(low, PAPER, DEREK).boards[BOARD].nodes.at(-1);
      expect(postIt.x).toBe(0.1);
      expect(postIt.y).toBeCloseTo(0.6);
    });

    it('makes nothing of any other string', () => {
      const state = connect(connect(pinned, DEREK, 'item:key'), PAPER, 'item:key');
      expect(nodeIds(state)).not.toContain(POST_IT);
      expect(state.madeDeductionIds).toEqual([]);
    });

    it('takes the post-it, and any string tied to it, off when its string is cut, but still remembers it', () => {
      let state = connect(connect(pinned, DEREK, PAPER), POST_IT, 'item:key');
      state = cut(state, STRING);
      expect(nodeIds(state)).toEqual([PAPER, DEREK, 'item:key']);
      expect(state.boards[BOARD].connections).toEqual([]);
      expect(state.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);
    });

    it('takes it off when either card comes off, and puts it back, recorded once, when they are tied again', () => {
      let state = reducer(connect(pinned, DEREK, PAPER), removeNode({ boardId: BOARD, nodeId: DEREK }));
      expect(nodeIds(state)).toEqual([PAPER, 'item:key']);
      state = connect(on(state, 'note', 'derek-station-worker', 0.5, 0.5), PAPER, DEREK);
      expect(nodeIds(state)).toContain(POST_IT);
      expect(state.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);
    });

    describe('built on another post-it', () => {
      const AFRAID = 'note:derek-fears-blame';
      const SECOND = 'deduction:derek-fears-ending-up-like-clive';
      const chained = () => connect(on(connect(pinned, DEREK, PAPER), 'note', 'derek-fears-blame', 0.8, 0.8), POST_IT, AFRAID);

      it('makes the next deduction from a string between the first post-it and a note', () => {
        const state = chained();
        expect(nodeIds(state)).toContain(SECOND);
        expect(state.madeDeductionIds).toEqual(['derek-knew-sacked-worker', 'derek-fears-ending-up-like-clive']);
      });

      it('takes both post-its off when the first one\'s string is cut, but remembers both', () => {
        const state = cut(chained(), STRING);
        expect(nodeIds(state)).toEqual([PAPER, DEREK, 'item:key', AFRAID]);
        expect(state.boards[BOARD].connections).toEqual([]);
        expect(state.madeDeductionIds).toEqual(['derek-knew-sacked-worker', 'derek-fears-ending-up-like-clive']);
      });

      it('takes only the second off when its own string is cut', () => {
        const state = cut(chained(), [POST_IT, AFRAID].sort().join('~'));
        expect(nodeIds(state)).toContain(POST_IT);
        expect(nodeIds(state)).not.toContain(SECOND);
      });
    });

    it("can't be taken off the board by itself", () => {
      const state = reducer(connect(pinned, DEREK, PAPER), removeNode({ boardId: BOARD, nodeId: POST_IT }));
      expect(nodeIds(state)).toContain(POST_IT);
    });

    it('pins the post-it to a board saved with its string but before post-its', () => {
      const saved = connect(pinned, DEREK, PAPER).boards[BOARD];
      const older = { nodes: saved.nodes.filter((n) => n.id !== POST_IT), connections: saved.connections };
      const state = reducer(fresh, restoreBoards({ [BOARD]: older }));
      expect(nodeIds(state)).toContain(POST_IT);
      expect(state.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);
    });

    it('restores the deductions made, replacing any', () => {
      const made = connect(pinned, DEREK, PAPER);
      expect(reducer(made, restoreMadeDeductions(['other'])).madeDeductionIds).toEqual(['other']);
      expect(reducer(made, restoreMadeDeductions(undefined)).madeDeductionIds).toEqual([]);
    });

    it('treats a store without any as none made', () => {
      expect(selectHasMadeDeduction({}, 'derek-knew-sacked-worker')).toBe(false);
      expect(selectHasMadeDeduction({ deduction: { boards: {} } }, 'derek-knew-sacked-worker')).toBe(false);
    });
  });

  describe('restoreBoards', () => {
    const saved = {
      [STATION]: {
        nodes: [{ id: 'item:key', kind: 'item', refId: 'key', x: 0.1, y: 0.2 }],
        connections: [],
      },
    };

    it('replaces the boards with the saved ones, leaving the board shut', () => {
      const state = reducer(place(reducer(fresh, openBoard()), 'item', 'lighter'), restoreBoards(saved));
      expect(state.boards).toEqual(saved);
      expect(state.isBoardOpen).toBe(true);
      expect(reducer(fresh, restoreBoards(saved)).isBoardOpen).toBe(false);
    });

    it('gives a board saved before strings an empty set of them', () => {
      const state = reducer(fresh, restoreBoards({ [STATION]: { nodes: saved[STATION].nodes } }));
      expect(state.boards[STATION].connections).toEqual([]);
    });

    it('restores no boards from a save without any', () => {
      expect(reducer(place(fresh, 'item', 'key'), restoreBoards(undefined)).boards).toEqual({});
    });
  });

  it('is cleared by a new game', () => {
    expect(reducer(place(reducer(fresh, openBoard()), 'item', 'key'), startNewGame())).toEqual(fresh);
  });

  it("selects a board's nodes, or none", () => {
    const state = { deduction: place(fresh, 'item', 'key') };
    expect(selectBoardNodes(state, STATION).map((n) => n.id)).toEqual(['item:key']);
    expect(selectBoardNodes(state, 'elsewhere')).toEqual([]);
    expect(selectBoardNodes({}, STATION)).toEqual([]);
  });
});
