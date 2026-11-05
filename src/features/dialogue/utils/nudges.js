import { investigationNotes } from '../../investigation/data/investigationNotes';
import { deductionsById } from '../../deduction/data/deductions';
import { allNPCs } from '../data/npcs';
import { isTalkOptionAvailable } from './talkOptions';

const frank = (line) => [{ character: 'frank', mood: 'regular', line }];

// The deduction behind a talk option Frank can now say and hasn't yet
const deductionWithSomethingToSay = ({ storyProgress, madeDeductionIds, heardTalkOptions }) => {
  for (const npc of allNPCs) {
    const heardOptionIds = heardTalkOptions?.[npc.id] ?? [];
    const option = (npc.talkOptions ?? []).find((o) =>
      o.requiresDeduction &&
      !heardOptionIds.includes(o.id) &&
      isTalkOptionAvailable(o, { storyProgress, madeDeductionIds, heardOptionIds }));
    if (option) return deductionsById[option.requiresDeduction];
  }
  return null;
};

// What Frank says once, to teach the board then the dialogue it opens: { flag, lines, overBoard? } or null
export const nextNudge = ({ storyProgress, discoveredNoteIds = [], madeDeductionIds = [], heardTalkOptions = {} }) => {
  if (!storyProgress?.talkNudged) {
    const deduction = deductionWithSomethingToSay({ storyProgress, madeDeductionIds, heardTalkOptions });
    if (deduction?.talkTo) {
      return { flag: 'talkNudged', lines: frank(`I should ask ${deduction.talkTo} about that.`), overBoard: true };
    }
  }

  const pinnable = discoveredNoteIds.filter((id) => investigationNotes[id] && investigationNotes[id].pinnable !== false);
  if (pinnable.length >= 2 && madeDeductionIds.length === 0 && !storyProgress?.boardNudged) {
    return { flag: 'boardNudged', lines: frank("I should pin what I've found on my deductions board.") };
  }
  return null;
};
