import { currentStep, currentStepIndex, pickTarget } from './tutorial';
import tutorialSteps from '../data/tutorialSteps';

const stateWith = ({ tutorial, storyProgress = {}, notes = [], heard = [], deductions = [], scene = 'great-portland-street' } = {}) => ({
  tutorial: { doneStepId: null, skipped: false, ...tutorial },
  game: { currentScene: scene, storyProgress },
  investigation: { discoveredNoteIds: notes },
  dialogue: { heardTalkOptions: { 'station-worker': heard }, openChats: 0 },
  deduction: { boards: {}, madeDeductionIds: deductions, isBoardOpen: false },
});

const idAt = (state) => currentStep(state)?.id;

describe('currentStep', () => {
  it('starts with the welcome', () => {
    expect(idAt(stateWith())).toBe('welcome');
  });

  it('goes on from the furthest step done', () => {
    expect(idAt(stateWith({ tutorial: { doneStepId: 'walk' } }))).toBe('click-newspaper');
  });

  it('jumps past a step a lasting fact says is done, and every step before it', () => {
    expect(idAt(stateWith({ notes: ['newspaper-sacked-tube-worker'] }))).toBe('note-toast');
    expect(idAt(stateWith({ storyProgress: { triedBarrier: true }, scene: 'great-portland-street-ticket-hall' }))).toBe('click-derek');
  });

  it("picks up a save made in the ticket hall, before the tutorial, where the player had got to", () => {
    const state = stateWith({
      scene: 'great-portland-street-ticket-hall',
      storyProgress: { triedBarrier: true },
      notes: ['newspaper-sacked-tube-worker', 'derek-station-worker', 'derek-fears-blame'],
      heard: ['barriers'],
      deductions: ['derek-knew-sacked-worker'],
    });
    expect(idAt(state)).toBe('post-it');
  });

  it('never goes back behind the furthest step done', () => {
    expect(idAt(stateWith({ tutorial: { doneStepId: 'open-board' } }))).toBe('board-sidebar');
  });

  it('is over once skipped', () => {
    expect(currentStepIndex(stateWith({ tutorial: { skipped: true } }))).toBe(-1);
    expect(currentStep(stateWith({ tutorial: { skipped: true } }))).toBeNull();
  });

  it('is over once the last step is done', () => {
    expect(currentStep(stateWith({ tutorial: { doneStepId: 'finish' } }))).toBeNull();
  });

  it('is over for a save from before the tutorial that is already past the gate', () => {
    expect(currentStep(stateWith({ storyProgress: { triedBarrier: true, barrierReleased: true } }))).toBeNull();
  });

  it('waits for Derek to finish speaking once the gate opens in the tutorial', () => {
    const state = stateWith({ tutorial: { doneStepId: 'chain-deduction' }, storyProgress: { barrierReleased: true } });
    expect(idAt(state)).toBe('persuade-derek');
  });

  it('is over once Frank has left the station', () => {
    expect(currentStep(stateWith({ tutorial: { doneStepId: 'try-barrier' }, storyProgress: { leftStation: true } }))).toBeNull();
  });
});

describe('pickTarget', () => {
  const step = {
    targets: [
      { selector: '.a', text: 'a', when: (state) => state.ready },
      { selector: '.b', text: 'b', unless: '.busy' },
      { selector: '.c', text: 'c' },
    ],
  };

  it('takes the first target whose condition passes and that is on screen', () => {
    expect(pickTarget(step, { ready: true }, () => true).text).toBe('a');
    expect(pickTarget(step, { ready: false }, (s) => s !== '.busy').text).toBe('b');
  });

  it('skips one whose `unless` is on screen', () => {
    expect(pickTarget(step, { ready: false }, () => true).text).toBe('c');
  });

  it('gives nothing when none is on screen', () => {
    expect(pickTarget(step, { ready: true }, () => false)).toBeNull();
  });

  it('takes a target with no selector as it is', () => {
    expect(pickTarget({ targets: [{ text: 'hi' }] }, {}, () => false).text).toBe('hi');
  });
});

describe('tutorialSteps', () => {
  it('has unique ids, a scene and some words for every target', () => {
    expect(new Set(tutorialSteps.map((s) => s.id)).size).toBe(tutorialSteps.length);
    tutorialSteps.forEach((step) => {
      expect(step.scene).toBeTruthy();
      expect(['info', 'action']).toContain(step.kind);
      step.targets.forEach((target) => expect(target.text).toBeTruthy());
    });
  });

  it('gives every action step a way to finish', () => {
    tutorialSteps
      .filter((step) => step.kind === 'action')
      .forEach((step) => expect(Boolean(step.doneWhen || step.doneOn || step.passedWhen)).toBe(true));
  });
});
