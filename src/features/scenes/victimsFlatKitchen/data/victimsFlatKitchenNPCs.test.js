import { chooseOutcome } from '../../../dialogue/utils/talkOptions';
import victimsFlatKitchenNPCs from './victimsFlatKitchenNPCs';

const neighbour = victimsFlatKitchenNPCs.find((npc) => npc.id === 'neighbour');
const outcomes = neighbour.talkOptions.find((option) => option.id === 'show-pill-bottle').then.then.outcomes;
const namesSam = (rapport, defensiveness) => chooseOutcome(outcomes, { rapport, defensiveness }).noteId === 'flat-kitchen-son-sam';

describe("the neighbour letting slip the son's name", () => {
  it('needs at least three nice approaches', () => {
    expect(namesSam(5, 0)).toBe(true);
    expect(namesSam(3, 0)).toBe(true);
    expect(namesSam(2, 0)).toBe(false);
  });

  it('allows up to two pressing ones', () => {
    expect(namesSam(3, 2)).toBe(true);
    expect(namesSam(4, 3)).toBe(false);
    expect(namesSam(2, 3)).toBe(false);
  });
});
