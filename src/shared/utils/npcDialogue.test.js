import { stripStageDirections } from './npcDialogue';

describe('stripStageDirections', () => {
  it('leaves plain speech alone', () => {
    expect(stripStageDirections('Alright mate. Mind the gap.')).toBe('Alright mate. Mind the gap.');
  });

  it.each([
    ['*looks up from ticket machine* Alright mate...', 'Alright mate...'],
    ['Alright mate. *sighs* Circle line is delayed.', 'Alright mate. Circle line is delayed.'],
    ['Exit is up the stairs, son. *goes back to his paper*', 'Exit is up the stairs, son.'],
    ['Twenty-two years *shakes head*, and for what?', 'Twenty-two years, and for what?'],
    ['*sighs*\nAlright mate.', 'Alright mate.'],
    ['**leans on the barrier** Yeah?', 'Yeah?'],
  ])('%s → %s', (reply, spoken) => {
    expect(stripStageDirections(reply)).toBe(spoken);
  });

  it('returns an empty string when the reply was only a stage direction', () => {
    expect(stripStageDirections('*shrugs*')).toBe('');
  });
});
