// Whether an NPC's talk option is offered, given what Frank has done, found and said
export const isTalkOptionAvailable = (option, { storyProgress, madeDeductionIds, heardOptionIds }) =>
  (!option.requiresStoryFlag || Boolean(storyProgress?.[option.requiresStoryFlag])) &&
  (!option.hiddenByStoryFlag || !storyProgress?.[option.hiddenByStoryFlag]) &&
  (!option.requiresDeduction || Boolean(madeDeductionIds?.includes(option.requiresDeduction))) &&
  (!option.requiresHeard || Boolean(heardOptionIds?.includes(option.requiresHeard)));

// Frank opens with the option's line, then the NPC gives each reply; a script gives its lines directly
export const conversationLines = (option) =>
  option.lines ?? [
    { speaker: 'frank', text: option.line },
    ...(option.replies ?? []).map((text) => ({ speaker: 'npc', text })),
  ];
