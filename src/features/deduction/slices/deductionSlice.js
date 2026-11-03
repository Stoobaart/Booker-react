import { createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';

// A node is a note or an item pinned to a board; x and y are its centre, as fractions of the board.
// A connection is a string between two nodes' pins; it has no direction.
const initialState = {
  isBoardOpen: false,
  boards: {},
};

export const nodeIdFor = (kind, refId) => `${kind}:${refId}`;

export const connectionIdFor = (a, b) => [a, b].sort().join('~');

const boardFor = (state, boardId) => {
  state.boards[boardId] ??= { nodes: [], connections: [] };
  state.boards[boardId].connections ??= [];
  return state.boards[boardId];
};

const deductionSlice = createSlice({
  name: 'deduction',
  initialState,
  reducers: {
    toggleBoard: (state) => {
      state.isBoardOpen = !state.isBoardOpen;
    },
    openBoard: (state) => {
      state.isBoardOpen = true;
    },
    closeBoard: (state) => {
      state.isBoardOpen = false;
    },
    // Ignores something already on the board
    placeNode: (state, action) => {
      const { boardId, kind, refId, x, y } = action.payload;
      const board = boardFor(state, boardId);
      const id = nodeIdFor(kind, refId);
      if (board.nodes.some((node) => node.id === id)) return;
      board.nodes.push({ id, kind, refId, x, y });
    },
    // Brings it to the end, so the last node dropped is drawn on top
    moveNode: (state, action) => {
      const { boardId, nodeId, x, y } = action.payload;
      const nodes = state.boards[boardId]?.nodes;
      const index = nodes?.findIndex((n) => n.id === nodeId) ?? -1;
      if (index === -1) return;
      const [node] = nodes.splice(index, 1);
      nodes.push({ ...node, x, y });
    },
    // Off the board, so it's back in the sidebar, and its strings with it
    removeNode: (state, action) => {
      const { boardId, nodeId } = action.payload;
      const board = state.boards[boardId];
      if (!board) return;
      board.nodes = board.nodes.filter((n) => n.id !== nodeId);
      board.connections = (board.connections ?? []).filter((c) => c.from !== nodeId && c.to !== nodeId);
    },
    // Ignores a node to itself, one not on the board, and a pair already connected
    connectNodes: (state, action) => {
      const { boardId, from, to } = action.payload;
      const board = boardFor(state, boardId);
      const id = connectionIdFor(from, to);
      const onBoard = (nodeId) => board.nodes.some((n) => n.id === nodeId);
      if (from === to || !onBoard(from) || !onBoard(to) || board.connections.some((c) => c.id === id)) return;
      board.connections.push({ id, from, to });
    },
    disconnectNodes: (state, action) => {
      const { boardId, connectionId } = action.payload;
      const board = state.boards[boardId];
      if (board?.connections) board.connections = board.connections.filter((c) => c.id !== connectionId);
    },
    // Replaces every board with the saved ones; a board saved before strings gets none
    restoreBoards: (state, action) => {
      const saved = action.payload ?? {};
      state.boards = Object.fromEntries(
        Object.entries(saved).map(([id, board]) => [
          id,
          { nodes: board?.nodes ?? [], connections: board?.connections ?? [] },
        ]),
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const {
  toggleBoard,
  openBoard,
  closeBoard,
  placeNode,
  moveNode,
  removeNode,
  connectNodes,
  disconnectNodes,
  restoreBoards,
} = deductionSlice.actions;

const NO_NODES = [];
const NO_CONNECTIONS = [];
export const selectBoardNodes = (state, boardId) => state.deduction?.boards?.[boardId]?.nodes ?? NO_NODES;
export const selectBoardConnections = (state, boardId) =>
  state.deduction?.boards?.[boardId]?.connections ?? NO_CONNECTIONS;

export default deductionSlice.reducer;
