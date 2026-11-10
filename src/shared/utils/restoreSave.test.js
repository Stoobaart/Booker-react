import { createTestStore } from '../../test/renderWithProviders';
import { restoreSave, routeForScene } from './restoreSave';

const save = {
  game: { currentScene: 'residential-street', playerPosition: null, playerDirection: null, storyProgress: { leftStation: true } },
  inventory: { items: [{ id: 'banana-1', name: 'Banana', quantity: 1 }] },
  investigation: { discoveredNoteIds: ['ticket-barrier-rejected'], openedInvestigationIds: ['great-portland-street'] },
  dialogue: { heardTalkOptions: { 'station-worker': ['barriers'] } },
  deduction: { boards: {}, madeDeductionIds: ['derek-knew-sacked-worker'] },
  tutorial: { skipped: true },
};

describe('restoreSave', () => {
  it("replaces the game in the store with the save's", () => {
    const store = createTestStore({
      investigation: { discoveredNoteIds: ['derek-fears-blame'], openedInvestigationIds: ['victims-flat'] },
      dialogue: { heardTalkOptions: { neighbour: ['placeholder'] }, openChats: 0 },
    });
    restoreSave(store.dispatch, save);
    const state = store.getState();
    expect(state.game.currentScene).toBe('residential-street');
    expect(state.game.storyProgress).toMatchObject({ leftStation: true, barrierReleased: false });
    expect(state.inventory.items).toEqual(save.inventory.items);
    expect(state.investigation.discoveredNoteIds).toEqual(['ticket-barrier-rejected']);
    expect(state.investigation.openedInvestigationIds).toEqual(['great-portland-street']);
    expect(state.dialogue.heardTalkOptions).toEqual({ 'station-worker': ['barriers'] });
    expect(state.deduction.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);
    expect(state.tutorial.skipped).toBe(true);
  });
});

describe('routeForScene', () => {
  it("is the scene's route", () => {
    expect(routeForScene('victims-flat-hallway')).toBe('/victims-flat-hallway');
  });

  it('is the platform for an unknown scene', () => {
    expect(routeForScene('nowhere')).toBe('/great-portland-street');
  });
});
