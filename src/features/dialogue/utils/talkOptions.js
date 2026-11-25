const asList = (value) => (value === undefined ? [] : [].concat(value));

// Whether an NPC's talk option is offered, given what Frank has done, found and said
export const isTalkOptionAvailable = (option, { storyProgress, madeDeductionIds, heardOptionIds, discoveredNoteIds, carriedItemIds }) =>
  (!option.requiresStoryFlag || Boolean(storyProgress?.[option.requiresStoryFlag])) &&
  (!option.hiddenByStoryFlag || !storyProgress?.[option.hiddenByStoryFlag]) &&
  (!option.requiresDeduction || Boolean(madeDeductionIds?.includes(option.requiresDeduction))) &&
  asList(option.requiresHeard).every((id) => Boolean(heardOptionIds?.includes(id))) &&
  (!option.requiresNote || Boolean(discoveredNoteIds?.includes(option.requiresNote))) &&
  (!option.requiresItem || Boolean(carriedItemIds?.includes(option.requiresItem)));

export const NO_STANDING = { rapport: 0, defensiveness: 0 };

// How Frank's approach leaves an NPC: { rapport, defensiveness } added on
export const applyEffect = (standing, effect) => ({
  rapport: (standing?.rapport ?? 0) + (effect?.rapport ?? 0),
  defensiveness: (standing?.defensiveness ?? 0) + (effect?.defensiveness ?? 0),
});

// { minRapport, maxDefensiveness }: both must hold; none means always
export const meetsStanding = (when, standing) =>
  (when?.minRapport === undefined || (standing?.rapport ?? 0) >= when.minRapport) &&
  (when?.maxDefensiveness === undefined || (standing?.defensiveness ?? 0) <= when.maxDefensiveness);

// Frank opens with the option's line, then the NPC gives each reply; or the lines are given directly,
// each kept or dropped by its `when` / `unless` on the NPC's standing
export const conversationLines = (option, standing = NO_STANDING) =>
  (
    option.lines ?? [
      ...(option.line ? [{ speaker: 'frank', text: option.line }] : []),
      ...(option.replies ?? []).map((text) => ({ speaker: 'npc', text })),
    ]
  ).filter((line) => (!line.when || meetsStanding(line.when, standing)) && (!line.unless || !meetsStanding(line.unless, standing)));

// The first of a beat's outcomes the standing meets
export const chooseOutcome = (outcomes, standing) => outcomes.find((outcome) => meetsStanding(outcome.when, standing));
