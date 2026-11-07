import reducer, {
  completeTutorialStep,
  reportTutorialAction,
  restoreTutorial,
  selectTutorialHoldsToast,
  skipTutorial,
} from './tutorialSlice';
import { startNewGame } from '../../game/slices/gameSlice';
import { createTestStore } from '../../../test/renderWithProviders';

const initial = { doneStepId: null, skipped: false };

describe('tutorialSlice', () => {
  it('starts with nothing done', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  it('remembers the furthest step done', () => {
    const state = reducer(initial, completeTutorialStep('walk'));
    expect(state.doneStepId).toBe('walk');
    expect(reducer(state, completeTutorialStep('welcome')).doneStepId).toBe('walk');
    expect(reducer(state, completeTutorialStep('no-such-step')).doneStepId).toBe('walk');
  });

  it('skips', () => {
    expect(reducer(initial, skipTutorial()).skipped).toBe(true);
  });

  it('restores a save, and starts afresh for one without a tutorial', () => {
    expect(reducer(initial, restoreTutorial({ doneStepId: 'walk', skipped: true }))).toEqual({ doneStepId: 'walk', skipped: true });
    expect(reducer({ doneStepId: 'walk', skipped: true }, restoreTutorial(undefined))).toEqual(initial);
  });

  it('starts again with a new game', () => {
    expect(reducer({ doneStepId: 'finish', skipped: true }, startNewGame())).toEqual(initial);
  });
});

describe('reportTutorialAction', () => {
  it('completes the step waiting for that action', () => {
    const store = createTestStore({ tutorial: { doneStepId: 'welcome', skipped: false } });
    store.dispatch(reportTutorialAction('walk'));
    expect(store.getState().tutorial.doneStepId).toBe('walk');
  });

  it('ignores an action the step is not waiting for', () => {
    const store = createTestStore();
    store.dispatch(reportTutorialAction('walk'));
    store.dispatch(reportTutorialAction('menu:newspaper-1'));
    expect(store.getState().tutorial.doneStepId).toBeNull();
  });
});

describe('selectTutorialHoldsToast', () => {
  it('holds the toast while a step points at it, and not once skipped', () => {
    const store = createTestStore({ tutorial: { doneStepId: 'inspect-newspaper', skipped: false } });
    expect(selectTutorialHoldsToast(store.getState())).toBe(true);
    store.dispatch(skipTutorial());
    expect(selectTutorialHoldsToast(store.getState())).toBe(false);
  });
});
