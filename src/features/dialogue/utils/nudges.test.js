import { nextNudge } from './nudges';
import { allNPCs } from '../data/npcs';
import { deductionsById } from '../../deduction/data/deductions';

const twoNotes = ['newspaper-sacked-tube-worker', 'derek-station-worker'];

describe('nextNudge', () => {
  it('says nothing with fewer than two notes for the board', () => {
    expect(nextNudge({ storyProgress: {}, discoveredNoteIds: ['newspaper-sacked-tube-worker'] })).toBeNull();
  });

  it("doesn't count notes kept off the board", () => {
    expect(nextNudge({ storyProgress: {}, discoveredNoteIds: ['derek-station-worker', 'derek-opened-barrier'] })).toBeNull();
  });

  it('points Frank at the board once he has two notes for it', () => {
    const nudge = nextNudge({ storyProgress: {}, discoveredNoteIds: twoNotes });
    expect(nudge.flag).toBe('boardNudged');
    expect(nudge.lines[0]).toMatchObject({ character: 'frank', line: "I should pin what I've found on my deductions board." });
  });

  it('only points at the board once, and not after a deduction is made', () => {
    expect(nextNudge({ storyProgress: { boardNudged: true }, discoveredNoteIds: twoNotes })).toBeNull();
    expect(nextNudge({
      storyProgress: { talkNudged: true },
      discoveredNoteIds: twoNotes,
      madeDeductionIds: ['derek-knew-sacked-worker'],
    })).toBeNull();
  });

  it('sends Frank to whoever a deduction gives him something to say to, once', () => {
    const made = { discoveredNoteIds: twoNotes, madeDeductionIds: ['derek-knew-sacked-worker'] };
    const nudge = nextNudge({ storyProgress: { boardNudged: true }, ...made });
    expect(nudge.flag).toBe('talkNudged');
    expect(nudge.lines[0].line).toBe('I should ask Derek about that.');
    expect(nextNudge({ storyProgress: { boardNudged: true, talkNudged: true }, ...made })).toBeNull();
  });

  it("says nothing when the deduction's option isn't open to Frank yet", () => {
    // "What would Clive do?" also needs Derek's Clive story heard first
    expect(nextNudge({ storyProgress: { boardNudged: true }, madeDeductionIds: ['derek-fears-ending-up-like-clive'] })).toBeNull();
  });

  it("says nothing about an option Frank has already talked through", () => {
    expect(nextNudge({
      storyProgress: { boardNudged: true },
      madeDeductionIds: ['derek-knew-sacked-worker'],
      heardTalkOptions: { 'station-worker': ['ask-about-clive'] },
    })).toBeNull();
  });

  it('knows who to ask about every deduction that opens up dialogue', () => {
    allNPCs.flatMap((npc) => npc.talkOptions ?? []).filter((o) => o.requiresDeduction).forEach((option) => {
      expect(deductionsById[option.requiresDeduction]?.talkTo).toBeTruthy();
    });
  });
});
