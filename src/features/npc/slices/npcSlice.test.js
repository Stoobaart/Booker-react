import reducer, {
  addMessage,
  restoreConversations,
  discoverFacts,
  restoreDiscoveredFacts,
  clearConversation,
  selectHasDiscoveredFact,
} from './npcSlice';
import { startNewGame } from '../../game/slices/gameSlice';

const hello = { role: 'user', content: 'Hello' };
const reply = { role: 'assistant', content: 'Alright, mate.' };

describe('npcSlice', () => {
  it('appends messages per NPC', () => {
    let state = reducer(undefined, addMessage({ npcId: 'derek', message: hello }));
    state = reducer(state, addMessage({ npcId: 'derek', message: reply }));
    state = reducer(state, addMessage({ npcId: 'other', message: hello }));
    expect(state.conversations.derek).toEqual([hello, reply]);
    expect(state.conversations.other).toEqual([hello]);
  });

  it('forgets every conversation on a new game', () => {
    const state = reducer(undefined, addMessage({ npcId: 'derek', message: hello }));
    expect(reducer(state, startNewGame())).toEqual({ conversations: {}, discoveredFacts: {} });
  });

  it('clears one NPC conversation', () => {
    let state = reducer(undefined, addMessage({ npcId: 'derek', message: hello }));
    state = reducer(state, clearConversation({ npcId: 'derek' }));
    expect(state.conversations).toEqual({});
  });

  it('restoreConversations replaces all conversations', () => {
    let state = reducer(undefined, addMessage({ npcId: 'other', message: hello }));
    state = reducer(state, restoreConversations({ derek: [hello, reply] }));
    expect(state.conversations).toEqual({ derek: [hello, reply] });
  });

  it('restoreConversations falls back to empty for old saves without npc data', () => {
    expect(reducer(undefined, restoreConversations(undefined)).conversations).toEqual({});
  });

  it('records discovered facts per NPC, once each', () => {
    let state = reducer(undefined, discoverFacts({ npcId: 'derek', factIds: ['barrier_is_faulty'] }));
    state = reducer(state, discoverFacts({ npcId: 'derek', factIds: ['barrier_is_faulty', 'derek_fears_blame'] }));
    expect(state.discoveredFacts).toEqual({ derek: ['barrier_is_faulty', 'derek_fears_blame'] });
  });

  it('keeps discovered facts when later messages reveal nothing', () => {
    let state = reducer(undefined, discoverFacts({ npcId: 'derek', factIds: ['derek_fears_blame'] }));
    state = reducer(state, discoverFacts({ npcId: 'derek', factIds: [] }));
    state = reducer(state, addMessage({ npcId: 'derek', message: hello }));
    expect(state.discoveredFacts.derek).toEqual(['derek_fears_blame']);
  });

  it('records facts on an old save that has no discoveredFacts', () => {
    const state = reducer({ conversations: {} }, discoverFacts({ npcId: 'derek', factIds: ['derek_fears_blame'] }));
    expect(state.discoveredFacts).toEqual({ derek: ['derek_fears_blame'] });
  });

  it('forgets discovered facts on a new game', () => {
    const state = reducer(undefined, discoverFacts({ npcId: 'derek', factIds: ['derek_fears_blame'] }));
    expect(reducer(state, startNewGame()).discoveredFacts).toEqual({});
  });

  it('restoreDiscoveredFacts replaces all facts, or empties them for old saves', () => {
    let state = reducer(undefined, discoverFacts({ npcId: 'other', factIds: ['x'] }));
    state = reducer(state, restoreDiscoveredFacts({ derek: ['derek_fears_blame'] }));
    expect(state.discoveredFacts).toEqual({ derek: ['derek_fears_blame'] });
    expect(reducer(state, restoreDiscoveredFacts(undefined)).discoveredFacts).toEqual({});
  });

  it('selectHasDiscoveredFact reads a fact, including from old saves', () => {
    const npc = reducer(undefined, discoverFacts({ npcId: 'derek', factIds: ['derek_fears_blame'] }));
    expect(selectHasDiscoveredFact({ npc }, 'derek', 'derek_fears_blame')).toBe(true);
    expect(selectHasDiscoveredFact({ npc }, 'derek', 'barrier_is_faulty')).toBe(false);
    expect(selectHasDiscoveredFact({ npc: { conversations: {} } }, 'derek', 'derek_fears_blame')).toBe(false);
  });
});
