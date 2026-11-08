import { createSlice } from '@reduxjs/toolkit';
import { startNewGame } from '../../game/slices/gameSlice';
import { tutorialStepIds } from '../data/tutorialSteps';
import { currentStep } from '../utils/tutorial';

// doneStepId: the furthest step done; every step before it counts as done too
const initialState = {
  doneStepId: null,
  skipped: false,
};

const tutorialSlice = createSlice({
  name: 'tutorial',
  initialState,
  reducers: {
    // Ignores unknown ids and steps behind the furthest done
    completeTutorialStep: (state, action) => {
      const index = tutorialStepIds.indexOf(action.payload);
      if (index > tutorialStepIds.indexOf(state.doneStepId)) state.doneStepId = action.payload;
    },
    skipTutorial: (state) => {
      state.skipped = true;
    },
    restoreTutorial: (state, action) => ({ ...initialState, ...action.payload }),
  },
  extraReducers: (builder) => {
    builder.addCase(startNewGame, () => initialState);
  },
});

export const { completeTutorialStep, skipTutorial, restoreTutorial } = tutorialSlice.actions;

// For things only a component knows about (a menu opening, a click on the floor): completes the step waiting for it
export const reportTutorialAction = (name) => (dispatch, getState) => {
  const step = currentStep(getState());
  if (step?.doneOn === name) dispatch(completeTutorialStep(step.id));
};

export const selectTutorialStep = (state) => currentStep(state);
export const selectTutorialHoldsToast = (state) => Boolean(currentStep(state)?.holdsToast);

export default tutorialSlice.reducer;
