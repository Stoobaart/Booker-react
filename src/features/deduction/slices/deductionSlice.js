import { createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';
import deductions from '../data/deductions';
import { canPinOn } from '../data/boards';

// A node is a note or an item pinned to a board; x and y are its centre, as fractions of the board.
// A connection is a string between two nodes' pins; it has no direction.
// madeDeductionIds: every deduction Frank has made, kept even once its post-it comes off the board.
const initialState = {
  isBoardOpen: false,
  boards: {},
  madeDeductionIds: [],
};

export const nodeIdFor = (kind, refId) => `${kind}:${refId}`;

export const connectionIdFor = (a, b) => [a, b].sort().join('~');

const boardFor = (state, boardId) => {
  state.boards[boardId] ??= { nodes: [], connections: [] };
  state.boards[boardId].connections ??= [];
  return state.boards[boardId];
};

// How far below its string a new post-it goes, as a fraction of the board
const POST_IT_DROP = 0.2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const postItSpot = (board, { from, to }) => {
  const [a, b] = [from, to].map((id) => board.nodes.find((n) => n.id === id));
  const x = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;
  const below = y + POST_IT_DROP;
  return { x: clamp(x, 0.1, 0.9), y: below <= 0.85 ? below : Math.max(0.15, y - POST_IT_DROP) };
};

// A deduction's post-it is on the board exactly while its string is; it goes with any strings tied to it
const syncDeductions = (state, boardId) => {
  const board = state.boards[boardId];
  if (!board) return;
  state.madeDeductionIds ??= [];
  let changed = true;
  while (changed) {
    changed = false;
    deductions
      .filter((deduction) => deduction.boardId === boardId)
      .forEach((deduction) => {
        const nodeId = nodeIdFor('deduction', deduction.id);
        const tied = board.connections.some((c) => c.id === connectionIdFor(deduction.from, deduction.to));
        const pinned = board.nodes.some((n) => n.id === nodeId);
        if (tied && !pinned) {
          board.nodes.push({ id: nodeId, kind: 'deduction', refId: deduction.id, ...postItSpot(board, deduction) });
          if (!state.madeDeductionIds.includes(deduction.id)) state.madeDeductionIds.push(deduction.id);
        } else if (!tied && pinned) {
          board.nodes = board.nodes.filter((n) => n.id !== nodeId);
          board.connections = board.connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
          changed = true;
        }
      });
  }
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
    // Ignores something already on the board, and a note from another investigation
    placeNode: (state, action) => {
      const { boardId, kind, refId, x, y } = action.payload;
      if (!canPinOn(boardId, kind, refId)) return;
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
    // Off the board, so it's back in the sidebar, and its strings with it. A post-it only comes off with its string.
    removeNode: (state, action) => {
      const { boardId, nodeId } = action.payload;
      const board = state.boards[boardId];
      if (!board || nodeId.startsWith('deduction:')) return;
      board.nodes = board.nodes.filter((n) => n.id !== nodeId);
      board.connections = (board.connections ?? []).filter((c) => c.from !== nodeId && c.to !== nodeId);
      syncDeductions(state, boardId);
    },
    // Ignores a node to itself, one not on the board, and a pair already connected
    connectNodes: (state, action) => {
      const { boardId, from, to } = action.payload;
      const board = boardFor(state, boardId);
      const id = connectionIdFor(from, to);
      const onBoard = (nodeId) => board.nodes.some((n) => n.id === nodeId);
      if (from === to || !onBoard(from) || !onBoard(to) || board.connections.some((c) => c.id === id)) return;
      board.connections.push({ id, from, to });
      syncDeductions(state, boardId);
    },
    disconnectNodes: (state, action) => {
      const { boardId, connectionId } = action.payload;
      const board = state.boards[boardId];
      if (!board?.connections) return;
      board.connections = board.connections.filter((c) => c.id !== connectionId);
      syncDeductions(state, boardId);
    },
    // Replaces every board with the saved ones; a board saved before strings gets none.
    // A note saved on another investigation's board (from before there was one each) goes back to the sidebar.
    // Restore the deductions made first: a board saved before post-its gets them here, and they're recorded.
    restoreBoards: (state, action) => {
      const saved = action.payload ?? {};
      state.boards = Object.fromEntries(
        Object.entries(saved).map(([id, board]) => {
          const nodes = (board?.nodes ?? []).filter((node) => canPinOn(id, node.kind, node.refId));
          const kept = new Set(nodes.map((node) => node.id));
          const connections = (board?.connections ?? []).filter((c) => kept.has(c.from) && kept.has(c.to));
          return [id, { nodes, connections }];
        }),
      );
      Object.keys(state.boards).forEach((id) => syncDeductions(state, id));
    },
    restoreMadeDeductions: (state, action) => {
      state.madeDeductionIds = action.payload ?? [];
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
  restoreMadeDeductions,
} = deductionSlice.actions;

const NO_NODES = [];
const NO_CONNECTIONS = [];
export const selectBoardNodes = (state, boardId) => state.deduction?.boards?.[boardId]?.nodes ?? NO_NODES;
export const selectBoardConnections = (state, boardId) =>
  state.deduction?.boards?.[boardId]?.connections ?? NO_CONNECTIONS;

// For the dialogue to offer what Frank has worked out
export const selectHasMadeDeduction = (state, deductionId) =>
  Boolean(state.deduction?.madeDeductionIds?.includes(deductionId));

export default deductionSlice.reducer;
