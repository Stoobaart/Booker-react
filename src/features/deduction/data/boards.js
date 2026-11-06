import { investigations } from "../../investigation/data/investigations";
import { investigationNotes } from "../../investigation/data/investigationNotes";

// One board per investigation, sharing its id
export const boards = investigations.map(({ id, name, scenes }) => ({ id, name, scenes }));

// The board that opens in a scene: its investigation's, else the first of those available
export const boardForScene = (scene, available = boards) =>
  available.find((board) => board.scenes?.includes(scene)) ?? available[0] ?? boards[0];

// A note only goes on its own investigation's board (one with no investigation goes on any); evidence goes on any
export const canPinOn = (boardId, kind, refId) => {
  const investigationId = kind === 'note' && investigationNotes[refId]?.investigationId;
  return !investigationId || investigationId === boardId;
};
