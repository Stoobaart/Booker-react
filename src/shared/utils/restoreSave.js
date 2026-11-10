import { restoreGameState, startNewGame } from '../../features/game/slices/gameSlice';
import { restoreInventory } from '../../features/inventory/slices/inventorySlice';
import { restoreHeardTalkOptions } from '../../features/dialogue/slices/dialogueSlice';
import { restoreNotes, restoreOpenedInvestigations } from '../../features/investigation/slices/investigationSlice';
import { restoreBoards, restoreMadeDeductions } from '../../features/deduction/slices/deductionSlice';
import { restoreTutorial } from '../../features/tutorial/slices/tutorialSlice';

const sceneRoutes = {
  'great-portland-street': '/great-portland-street',
  'great-portland-street-ticket-hall': '/great-portland-street-ticket-hall',
  'great-portland-street-exterior': '/great-portland-street-exterior',
  'residential-street': '/residential-street',
  'victims-flat-hallway': '/victims-flat-hallway',
  'victims-flat-living-room': '/victims-flat-living-room',
  'victims-flat-kitchen': '/victims-flat-kitchen',
  'victims-flat-bedroom': '/victims-flat-bedroom',
  beginnings: '/beginnings',
};

export const routeForScene = (scene) => sceneRoutes[scene] ?? '/great-portland-street';

// Replaces the whole game with a save's (Continue, or a start point)
export const restoreSave = (dispatch, save) => {
  dispatch(startNewGame());
  dispatch(restoreGameState(save.game));
  dispatch(restoreInventory(save.inventory?.items));
  dispatch(restoreNotes(save.investigation?.discoveredNoteIds));
  dispatch(restoreOpenedInvestigations(save.investigation?.openedInvestigationIds));
  dispatch(restoreHeardTalkOptions(save.dialogue?.heardTalkOptions));
  // Before the boards, which add the post-its of deductions not made yet
  dispatch(restoreMadeDeductions(save.deduction?.madeDeductionIds));
  dispatch(restoreBoards(save.deduction?.boards));
  dispatch(restoreTutorial(save.tutorial));
};
