// Added to every NPC persona: the chat shows only what the NPC says out loud
export const SPOKEN_ONLY_RULE =
  'Reply with only the words you say out loud. Never describe actions, gestures, expressions or tone of voice: no stage directions and nothing wrapped in *asterisks*.';

// Removes *stage directions* the model adds anyway, e.g. "*looks up* Alright mate" -> "Alright mate"
export const stripStageDirections = (text) => {
  return text
    .replace(/\*+[^*]*\*+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/ ([,.!?;:])/g, '$1')
    .trim();
};
