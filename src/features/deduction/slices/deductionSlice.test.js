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
  selectBoardNodes,
  selectBoardConnections,
} from './deductionSlice';
import { startNewGame } from '../../game/slices/gameSlice';

const fresh = reducer(undefined, { type: 'init' });
const place = (state, kind, refId, x = 0.5, y = 0.5) =>
  reducer(state, placeNode({ boardId: 'station', kind, refId, x, y }));

describe('deductionSlice', () => {
  it('starts shut with nothing pinned', () => {
    expect(fresh).toEqual({ isBoardOpen: false, boards: {} });
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
    expect(state.boards.station.nodes).toEqual([
      { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.2, y: 0.3 },
      { id: 'item:key', kind: 'item', refId: 'key', x: 0.5, y: 0.5 },
    ]);
  });

  it('keeps a note and an item with the same id apart', () => {
    const state = place(place(fresh, 'note', 'key'), 'item', 'key');
    expect(state.boards.station.nodes.map((n) => n.id)).toEqual(['note:key', 'item:key']);
  });

  it('moves a node, ignoring ones not on the board', () => {
    let state = place(fresh, 'item', 'key');
    state = reducer(state, moveNode({ boardId: 'station', nodeId: 'item:key', x: 0.1, y: 0.8 }));
    state = reducer(state, moveNode({ boardId: 'station', nodeId: 'item:gone', x: 0, y: 0 }));
    state = reducer(state, moveNode({ boardId: 'elsewhere', nodeId: 'item:key', x: 0, y: 0 }));
    expect(state.boards.station.nodes).toEqual([{ id: 'item:key', kind: 'item', refId: 'key', x: 0.1, y: 0.8 }]);
  });

  it('puts a moved node last, so it is drawn on top', () => {
    let state = place(place(place(fresh, 'item', 'key'), 'item', 'lighter'), 'note', 'derek-station-worker');
    state = reducer(state, moveNode({ boardId: 'station', nodeId: 'item:key', x: 0.3, y: 0.3 }));
    expect(state.boards.station.nodes.map((n) => n.id)).toEqual(['item:lighter', 'note:derek-station-worker', 'item:key']);
  });

  it('takes a node off the board, so it can be pinned again', () => {
    let state = place(place(fresh, 'item', 'key'), 'item', 'lighter');
    state = reducer(state, removeNode({ boardId: 'station', nodeId: 'item:key' }));
    state = reducer(state, removeNode({ boardId: 'elsewhere', nodeId: 'item:lighter' }));
    expect(state.boards.station.nodes.map((n) => n.id)).toEqual(['item:lighter']);
    state = place(state, 'item', 'key', 0.1, 0.1);
    expect(state.boards.station.nodes.map((n) => n.id)).toEqual(['item:lighter', 'item:key']);
  });

  describe('connections', () => {
    const connect = (state, from, to) => reducer(state, connectNodes({ boardId: 'station', from, to }));
    const pinned = place(place(place(fresh, 'item', 'key'), 'item', 'lighter'), 'note', 'derek-station-worker');

    it('records a string between two nodes, once whichever way round', () => {
      let state = connect(pinned, 'item:key', 'note:derek-station-worker');
      state = connect(state, 'note:derek-station-worker', 'item:key');
      expect(state.boards.station.connections).toEqual([
        { id: 'item:key~note:derek-station-worker', from: 'item:key', to: 'note:derek-station-worker' },
      ]);
    });

    it('chains a node to more than one other', () => {
      let state = connect(pinned, 'item:key', 'item:lighter');
      state = connect(state, 'item:lighter', 'note:derek-station-worker');
      expect(selectBoardConnections({ deduction: state }, 'station').map((c) => [c.from, c.to])).toEqual([
        ['item:key', 'item:lighter'],
        ['item:lighter', 'note:derek-station-worker'],
      ]);
    });

    it("ignores a node to itself, and one that isn't on the board", () => {
      let state = connect(pinned, 'item:key', 'item:key');
      state = connect(state, 'item:key', 'item:banana');
      expect(state.boards.station.connections).toEqual([]);
    });

    it('cuts a string', () => {
      let state = connect(connect(pinned, 'item:key', 'item:lighter'), 'item:key', 'note:derek-station-worker');
      state = reducer(state, disconnectNodes({ boardId: 'station', connectionId: 'item:key~item:lighter' }));
      expect(state.boards.station.connections.map((c) => c.id)).toEqual(['item:key~note:derek-station-worker']);
    });

    it("cuts a node's strings when it comes off the board", () => {
      let state = connect(connect(pinned, 'item:key', 'item:lighter'), 'item:lighter', 'note:derek-station-worker');
      state = reducer(state, removeNode({ boardId: 'station', nodeId: 'item:key' }));
      expect(state.boards.station.connections.map((c) => c.id)).toEqual(['item:lighter~note:derek-station-worker']);
    });

    it('copes with a board saved before strings', () => {
      const old = { ...fresh, boards: { station: { nodes: pinned.boards.station.nodes } } };
      expect(connect(old, 'item:key', 'item:lighter').boards.station.connections).toHaveLength(1);
      expect(reducer(old, removeNode({ boardId: 'station', nodeId: 'item:key' })).boards.station.connections).toEqual([]);
      expect(selectBoardConnections({ deduction: old }, 'station')).toEqual([]);
    });
  });

  describe('restoreBoards', () => {
    const saved = {
      station: {
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
      const state = reducer(fresh, restoreBoards({ station: { nodes: saved.station.nodes } }));
      expect(state.boards.station.connections).toEqual([]);
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
    expect(selectBoardNodes(state, 'station').map((n) => n.id)).toEqual(['item:key']);
    expect(selectBoardNodes(state, 'elsewhere')).toEqual([]);
    expect(selectBoardNodes({}, 'station')).toEqual([]);
  });
});
