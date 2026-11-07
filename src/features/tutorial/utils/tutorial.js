import tutorialSteps from '../data/tutorialSteps';

// Past the furthest step done, or the last one a lasting fact says the player is past; -1 once it's over or skipped
export const currentStepIndex = (state, steps = tutorialSteps) => {
  const tutorial = state.tutorial;
  if (tutorial?.skipped) return -1;
  let start = steps.findIndex((step) => step.id === tutorial?.doneStepId) + 1;
  steps.forEach((step, index) => {
    if (index >= start && step.passedWhen?.(state)) start = index + 1;
  });
  return start < steps.length ? start : -1;
};

export const currentStep = (state, steps = tutorialSteps) => steps[currentStepIndex(state, steps)] ?? null;

// The step done once, in the state as it is now
export const isStepDone = (step, state) => Boolean(step.passedWhen?.(state) || step.doneWhen?.(state));

// The first target whose `when` passes; `isShown(selector)` says whether it's on screen
export const pickTarget = (step, state, isShown) =>
  step.targets.find((target) =>
    (!target.when || target.when(state)) &&
    (!target.selector || isShown(target.selector)) &&
    (!target.unless || !isShown(target.unless))) ?? null;
