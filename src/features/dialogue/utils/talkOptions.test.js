import { conversationLines, isTalkOptionAvailable } from './talkOptions';

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

  it('requiresHeard waits for another option to have been played to the end', () => {
    const option = { requiresHeard: 'ask-about-clive' };
    expect(isTalkOptionAvailable(option, nothingDone)).toBe(false);
    expect(isTalkOptionAvailable(option, { ...nothingDone, heardOptionIds: ['ask-about-clive'] })).toBe(true);
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

  it('takes a script\'s lines as they are', () => {
    const lines = [{ speaker: 'npc', text: 'Between us.' }];
    expect(conversationLines({ lines })).toBe(lines);
  });
});
