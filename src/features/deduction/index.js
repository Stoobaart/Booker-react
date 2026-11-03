export { default as DeductionBoard } from './components/DeductionBoard';
export { default as DeductionBoardButton } from './components/DeductionBoardButton';
export {
  toggleBoard,
  openBoard,
  closeBoard,
  placeNode,
  moveNode,
  removeNode,
  restoreBoards,
  restoreMadeDeductions,
  selectHasMadeDeduction,
  nodeIdFor,
  selectBoardNodes,
} from './slices/deductionSlice';
export { default as deductionReducer } from './slices/deductionSlice';
export { boards, CURRENT_BOARD_ID } from './data/boards';
export { default as deductions, deductionsById } from './data/deductions';
