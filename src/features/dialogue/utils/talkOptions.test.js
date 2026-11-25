import { applyEffect, chooseOutcome, conversationLines, isTalkOptionAvailable, meetsStanding } from './talkOptions';

const nothingDone = { storyProgress: {}, madeDeductionIds: [], heardOptionIds: [] };

describe('isTalkOptionAvailable', () => {
  it('offers a plain option always', () => {
    expect(isTalkOptionAvailable({ id: 'hi' }, nothingDone)).toBe(true);
    expect(isTalkOptionAvailable({ id: 'hi' }, {})).toBe(true);
  });

  it('requiresStoryFlag waits for the flag', () => {
    const option = { requiresStoryFlag: 'triedBarrier' };
    expect(isTalkOptionAvailable(option, nothingDone)).toBe(false);
    expect(isTalkOptionAvailable(option, { ...nothingDone, storyProgress: { triedBarrier: true } })).toBe(true);
  });

  it('hiddenByStoryFlag goes once the flag is set', () => {
    const option = { hiddenByStoryFlag: 'barrierReleased' };
    expect(isTalkOptionAvailable(option, nothingDone)).toBe(true);
    expect(isTalkOptionAvailable(option, { ...nothingDone, storyProgress: { barrierReleased: true } })).toBe(false);
  });

  it('requiresDeduction waits for the deduction to have been made', () => {
    const option = { requiresDeduction: 'derek-knew-sacked-worker' };
    expect(isTalkOptionAvailable(option, nothingDone)).toBe(false);
    expect(isTalkOptionAvailable(option, { ...nothingDone, madeDeductionIds: ['derek-knew-sacked-worker'] })).toBe(true);
  });

  it('requiresNote waits for Frank to have found the note', () => {
    const option = { requiresNote: 'flat-living-room-prescription' };
    expect(isTalkOptionAvailable(option, nothingDone)).toBe(false);
    expect(isTalkOptionAvailable(option, { ...nothingDone, discoveredNoteIds: ['flat-living-room-prescription'] })).toBe(true);
  });

  it('requiresItem waits for Frank to be carrying it', () => {
    const option = { requiresItem: 'pill-bottle' };
    expect(isTalkOptionAvailable(option, nothingDone)).toBe(false);
    expect(isTalkOptionAvailable(option, { ...nothingDone, carriedItemIds: ['pill-bottle'] })).toBe(true);
  });

  it('requiresHeard waits for another option to have been played to the end', () => {
    const option = { requiresHeard: 'ask-about-clive' };
    expect(isTalkOptionAvailable(option, nothingDone)).toBe(false);
    expect(isTalkOptionAvailable(option, { ...nothingDone, heardOptionIds: ['ask-about-clive'] })).toBe(true);
  });

  it('requiresHeard can wait for several', () => {
    const option = { requiresHeard: ['work', 'family'] };
    expect(isTalkOptionAvailable(option, { ...nothingDone, heardOptionIds: ['work'] })).toBe(false);
    expect(isTalkOptionAvailable(option, { ...nothingDone, heardOptionIds: ['family', 'work'] })).toBe(true);
  });
});

describe('standing', () => {
  it('applyEffect adds rapport and defensiveness on, from nothing', () => {
    expect(applyEffect(undefined, { rapport: 1 })).toEqual({ rapport: 1, defensiveness: 0 });
    expect(applyEffect({ rapport: 2, defensiveness: 1 }, { defensiveness: 1 })).toEqual({ rapport: 2, defensiveness: 2 });
    expect(applyEffect({ rapport: 2, defensiveness: 1 }, undefined)).toEqual({ rapport: 2, defensiveness: 1 });
  });

  it('meetsStanding checks the least rapport and the most defensiveness', () => {
    const when = { minRapport: 2, maxDefensiveness: 1 };
    expect(meetsStanding(when, { rapport: 2, defensiveness: 1 })).toBe(true);
    expect(meetsStanding(when, { rapport: 1, defensiveness: 0 })).toBe(false);
    expect(meetsStanding(when, { rapport: 3, defensiveness: 2 })).toBe(false);
    expect(meetsStanding(undefined, undefined)).toBe(true);
  });

  it('chooseOutcome takes the first the standing meets', () => {
    const outcomes = [{ id: 'opens-up', when: { minRapport: 3 } }, { id: 'shuts-down' }];
    expect(chooseOutcome(outcomes, { rapport: 3, defensiveness: 0 }).id).toBe('opens-up');
    expect(chooseOutcome(outcomes, { rapport: 2, defensiveness: 0 }).id).toBe('shuts-down');
  });
});

describe('conversationLines', () => {
  it('is Frank\'s line then each reply', () => {
    expect(conversationLines({ line: 'Hi', replies: ['Evening', 'Sir'] })).toEqual([
      { speaker: 'frank', text: 'Hi' },
      { speaker: 'npc', text: 'Evening' },
      { speaker: 'npc', text: 'Sir' },
    ]);
  });

  it('keeps or drops each line by its when and unless on the standing', () => {
    const lines = [
      { speaker: 'npc', text: 'On edge.' },
      { speaker: 'npc', text: 'Jumpy, miles away.', when: { minRapport: 1 } },
      { speaker: 'npc', text: 'Said it was nothing.', unless: { minRapport: 1 } },
    ];
    const said = (standing) => conversationLines({ lines }, standing).map((line) => line.text);
    expect(said({ rapport: 1, defensiveness: 0 })).toEqual(['On edge.', 'Jumpy, miles away.']);
    expect(said(undefined)).toEqual(['On edge.', 'Said it was nothing.']);
  });

  it('takes a script\'s lines as they are', () => {
    const lines = [{ speaker: 'npc', text: 'Between us.' }];
    expect(conversationLines({ lines })).toEqual(lines);
  });
});
