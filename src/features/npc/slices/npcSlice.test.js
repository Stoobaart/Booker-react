import reducer, { addMessage, restoreConversations, clearConversation } from './npcSlice';

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
});
