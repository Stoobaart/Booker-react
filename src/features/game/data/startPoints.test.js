import { createTestStore } from '../../../test/renderWithProviders';
import { restoreSave, routeForScene } from '../../../shared/utils/restoreSave';
import { investigationNotes } from '../../investigation/data/investigationNotes';
import { deductionsById } from '../../deduction/data/deductions';
import { selectBoardNodes, selectHasMadeDeduction } from '../../deduction/slices/deductionSlice';
import { selectTutorialStep } from '../../tutorial/slices/tutorialSlice';
import { tutorialStepIds } from '../../tutorial/data/tutorialSteps';
import ticketHallNPCs from '../../scenes/greatPortlandStreetTicketHall/data/greatPortlandStreetTicketHallNPCs';
import startPoints from './startPoints';

const talkOptionIds = Object.fromEntries(ticketHallNPCs.map((npc) => [npc.id, npc.talkOptions.map((o) => o.id)]));

describe.each(startPoints)('start point $id', ({ save }) => {
  it('only names notes, deductions, talk options and tutorial steps that exist', () => {
    save.investigation.discoveredNoteIds.forEach((id) => expect(investigationNotes[id], id).toBeDefined());
    save.deduction.madeDeductionIds.forEach((id) => expect(deductionsById[id], id).toBeDefined());
    Object.entries(save.dialogue.heardTalkOptions).forEach(([npcId, ids]) =>
      ids.forEach((id) => expect(talkOptionIds[npcId], `${npcId}: ${id}`).toContain(id)),
    );
    if (save.tutorial.doneStepId) expect(tutorialStepIds).toContain(save.tutorial.doneStepId);
  });

  it('starts in a scene with a route', () => {
    expect(routeForScene(save.game.currentScene)).toBe(`/${save.game.currentScene}`);
  });

  it('keeps its board as saved when restored', () => {
    const store = createTestStore();
    restoreSave(store.dispatch, save);
    Object.entries(save.deduction.boards).forEach(([boardId, board]) => {
      const nodeIds = selectBoardNodes(store.getState(), boardId).map((n) => n.id);
      board.nodes.forEach((node) => expect(nodeIds).toContain(node.id));
      expect(store.getState().deduction.boards[boardId].connections).toHaveLength(board.connections.length);
    });
  });
});

describe('the flat hallway, first arrival', () => {
  const { save } = startPoints.find((point) => point.id === 'flat-hallway-first-arrival');

  it("has Derek's deductions made and pinned, the tutorial done and the flat's case still to open", () => {
    const store = createTestStore();
    restoreSave(store.dispatch, save);
    const state = store.getState();
    expect(state.game.currentScene).toBe('victims-flat-hallway');
    expect(state.game.playerPosition).toBeNull();
    ['derek-knew-sacked-worker', 'derek-fears-ending-up-like-clive'].forEach((id) => {
      expect(selectHasMadeDeduction(state, id)).toBe(true);
      expect(selectBoardNodes(state, 'great-portland-street').map((n) => n.id)).toContain(`deduction:${id}`);
    });
    expect(selectTutorialStep(state)).toBeFalsy();
    expect(state.investigation.openedInvestigationIds).not.toContain('victims-flat');
  });
});
