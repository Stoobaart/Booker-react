import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTestStore } from '../../test/renderWithProviders';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

const { default: useNPCConversation } = await import('./useNPCConversation');

const renderConversation = (store = createTestStore()) => {
  const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
  const hook = renderHook(() => useNPCConversation('derek', 'You are Derek.'), { wrapper });
  return { ...hook, store };
};

describe('useNPCConversation', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('stores the player message and the NPC reply', async () => {
    mockCreate.mockResolvedValue({ content: [{ text: 'Alright, mate.' }] });
    const { result, store } = renderConversation();

    await act(() => result.current.sendMessage('Hello'));

    expect(store.getState().npc.conversations.derek).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Alright, mate.' },
    ]);
    expect(result.current.isThinking).toBe(false);
  });

  it('sends the system prompt and conversation history', async () => {
    mockCreate.mockResolvedValue({ content: [{ text: 'Yeah?' }] });
    const store = createTestStore({
      npc: { conversations: { derek: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'What?' },
      ] } },
    });
    const { result } = renderConversation(store);

    await act(() => result.current.sendMessage('Where is the exit?'));

    const request = mockCreate.mock.calls[0][0];
    expect(request.system[0].text).toMatch(/^You are Derek\./);
    expect(request.system[0].text).toContain('Never describe actions');
    expect(request.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(request.messages.at(-1)).toEqual({ role: 'user', content: 'Where is the exit?' });
  });

  it('only sends the most recent 10 messages', async () => {
    mockCreate.mockResolvedValue({ content: [{ text: 'Hm.' }] });
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      content: `message ${i}`,
    }));
    const { result } = renderConversation(createTestStore({ npc: { conversations: { derek: history } } }));

    await act(() => result.current.sendMessage('latest'));

    expect(mockCreate.mock.calls[0][0].messages).toHaveLength(10);
  });

  it('stores only what the NPC says, without stage directions', async () => {
    mockCreate.mockResolvedValue({ content: [{ text: '*looks up from ticket machine* Alright mate...' }] });
    const { result, store } = renderConversation();

    await act(() => result.current.sendMessage('Hello'));

    expect(store.getState().npc.conversations.derek.at(-1)).toEqual({
      role: 'assistant',
      content: 'Alright mate...',
    });
  });

  it("falls back to '...' when the reply is only a stage direction", async () => {
    mockCreate.mockResolvedValue({ content: [{ text: '*shrugs*' }] });
    const { result, store } = renderConversation();

    await act(() => result.current.sendMessage('Hello'));

    expect(store.getState().npc.conversations.derek.at(-1).content).toBe('...');
  });

  it("falls back to '...' when the API call fails", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreate.mockImplementation(async () => { throw new Error('network down'); });
    const { result, store } = renderConversation();

    await act(() => result.current.sendMessage('Hello'));

    expect(store.getState().npc.conversations.derek.at(-1)).toEqual({ role: 'assistant', content: '...' });
    expect(result.current.isThinking).toBe(false);
  });
});
