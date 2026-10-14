import {
  stripStageDirections,
  buildPuzzleFactsRule,
  buildPuzzleResponseFormat,
  parsePuzzleResponse,
  mentionsAnyWord,
} from './npcDialogue';

const facts = [
  { id: 'barrier_is_faulty', description: 'Derek said the barriers are broken.' },
  { id: 'derek_fears_blame', description: 'Derek said he fears being blamed.' },
];
const resolution = { description: 'Derek agrees to open the barrier now.' };

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

describe('buildPuzzleFactsRule', () => {
  it('lists every fact id with its definition', () => {
    const rule = buildPuzzleFactsRule(facts);
    expect(rule).toContain('- barrier_is_faulty: Derek said the barriers are broken.');
    expect(rule).toContain('- derek_fears_blame: Derek said he fears being blamed.');
    expect(rule).not.toContain('"resolved"');
  });

  it('describes the resolution when there is one', () => {
    expect(buildPuzzleFactsRule(facts, resolution)).toContain('"resolved": true only if');
    expect(buildPuzzleFactsRule(facts, resolution)).toContain('Derek agrees to open the barrier now.');
  });
});

describe('buildPuzzleResponseFormat', () => {
  it('only allows dialogue plus ids from the fact list', () => {
    const { type, schema } = buildPuzzleResponseFormat(facts);
    expect(type).toBe('json_schema');
    expect(schema.properties.revealedFacts.items.enum).toEqual(['barrier_is_faulty', 'derek_fears_blame']);
    expect(schema.required).toEqual(['dialogue', 'revealedFacts']);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties).not.toHaveProperty('resolved');
  });

  it('adds a required resolved flag when there is a resolution', () => {
    const { schema } = buildPuzzleResponseFormat(facts, resolution);
    expect(schema.properties.resolved).toEqual({ type: 'boolean' });
    expect(schema.required).toContain('resolved');
  });
});

describe('parsePuzzleResponse', () => {
  const reply = (data) => parsePuzzleResponse(JSON.stringify(data), facts);

  it('returns the dialogue and the facts it revealed', () => {
    expect(reply({ dialogue: "It'll be my neck on the line.", revealedFacts: ['derek_fears_blame'] })).toEqual({
      dialogue: "It'll be my neck on the line.",
      revealedFacts: ['derek_fears_blame'],
      resolved: false,
    });
  });

  it('reads resolved only when a resolution was asked for', () => {
    const text = JSON.stringify({ dialogue: 'Go on then.', revealedFacts: [], resolved: true });
    expect(parsePuzzleResponse(text, facts, resolution).resolved).toBe(true);
    expect(parsePuzzleResponse(text, facts).resolved).toBe(false);
  });

  it.each([
    ['missing', { dialogue: 'Go on then.', revealedFacts: [] }],
    ['a string', { dialogue: 'Go on then.', revealedFacts: [], resolved: 'true' }],
  ])('rejects a reply whose resolved flag is %s when one was asked for', (_name, data) => {
    expect(parsePuzzleResponse(JSON.stringify(data), facts, resolution)).toBeNull();
  });

  it('returns no facts for an empty list', () => {
    expect(reply({ dialogue: 'Mind the gap.', revealedFacts: [] }).revealedFacts).toEqual([]);
  });

  it('drops unknown ids, non-strings and duplicates', () => {
    const revealedFacts = ['barrier_open', 'derek_fears_blame', 7, null, 'derek_fears_blame', '__proto__'];
    expect(reply({ dialogue: 'Hm.', revealedFacts }).revealedFacts).toEqual(['derek_fears_blame']);
  });

  it.each([
    ['plain prose', 'Alright mate. revealedFacts: derek_fears_blame'],
    ['truncated JSON', '{"dialogue": "Alright mate", "revealedFacts": ["derek_fears_bl'],
    ['a JSON string', '"derek_fears_blame"'],
    ['null', 'null'],
    ['a missing dialogue', JSON.stringify({ revealedFacts: ['derek_fears_blame'] })],
    ['a non-string dialogue', JSON.stringify({ dialogue: 5, revealedFacts: [] })],
    ['missing facts', JSON.stringify({ dialogue: 'Hm.' })],
    ['facts that are not a list', JSON.stringify({ dialogue: 'Hm.', revealedFacts: 'derek_fears_blame' })],
  ])('rejects %s', (_name, text) => {
    expect(parsePuzzleResponse(text, facts)).toBeNull();
  });
});

describe('mentionsAnyWord', () => {
  const name = ['Clive', 'Hargreaves'];

  it.each([
    'Shame about Clive Hargreaves.',
    'i read about hargreaves',
    'CLIVE was a good man',
    "Clive's sacking was a disgrace",
    'Hargreaves',
    '"Hargreaves", the paper said',
  ])('finds a word in: %s', (text) => {
    expect(mentionsAnyWord(text, name)).toBe(true);
  });

  it.each([
    '',
    'Open the gate',
    'Your mate Terry got sacked',
    'Clived Hargreavesy',
    'Is this Cliveden?',
  ])('finds nothing in: %s', (text) => {
    expect(mentionsAnyWord(text, name)).toBe(false);
  });

  it('treats the words as plain text, not patterns', () => {
    expect(mentionsAnyWord('anything', ['.*'])).toBe(false);
    expect(mentionsAnyWord('he said .* once', ['.*'])).toBe(true);
  });
});
