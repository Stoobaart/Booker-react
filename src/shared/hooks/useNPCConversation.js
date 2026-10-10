import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Anthropic from '@anthropic-ai/sdk';
import { addMessage } from '../../features/npc/slices/npcSlice';
import { SPOKEN_ONLY_RULE, stripStageDirections } from '../utils/npcDialogue';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const HISTORY_WINDOW = 10; // max message pairs sent to the API
const NO_MESSAGES = [];

const useNPCConversation = (npcId, systemPrompt) => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.npc.conversations[npcId] ?? NO_MESSAGES);
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useCallback(async (userText) => {
    const userMessage = { role: 'user', content: userText };
    dispatch(addMessage({ npcId, message: userMessage }));
    setIsThinking(true);

    const recentMessages = [...messages, userMessage].slice(-HISTORY_WINDOW);

    // Mark the last historical message for caching so the API caches everything
    // up to and including it. The new user message is excluded — it changes every request.
    const messagesForAPI = recentMessages.map((msg, i) => {
      const isLastHistorical = i === recentMessages.length - 2;
      if (isLastHistorical) {
        return {
          ...msg,
          content: [{ type: 'text', text: msg.content, cache_control: { type: 'ephemeral' } }],
        };
      }
      return msg;
    });

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: [{ type: 'text', text: `${systemPrompt}\n\n${SPOKEN_ONLY_RULE}`, cache_control: { type: 'ephemeral' } }],
        messages: messagesForAPI,
      });

      const assistantMessage = {
        role: 'assistant',
        content: stripStageDirections(response.content[0]?.text ?? '') || '...',
      };
      dispatch(addMessage({ npcId, message: assistantMessage }));
    } catch (err) {
      console.error('NPC conversation error:', err);
      dispatch(addMessage({ npcId, message: { role: 'assistant', content: '...' } }));
    } finally {
      setIsThinking(false);
    }
  }, [dispatch, npcId, systemPrompt, messages]);

  return { messages, isThinking, sendMessage };
};

export default useNPCConversation;
