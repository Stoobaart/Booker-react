import { useState, useCallback, useRef } from 'react';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const useNPCConversation = (systemPrompt) => {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesRef = useRef([]);

  const sendMessage = useCallback(async (userText) => {
    const userMessage = { role: 'user', content: userText };
    const updatedMessages = [...messagesRef.current, userMessage];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: updatedMessages,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.content[0]?.text ?? '...',
      };
      messagesRef.current = [...updatedMessages, assistantMessage];
      setMessages(messagesRef.current);
    } catch (err) {
      console.error('NPC conversation error:', err);
      const errorMessage = { role: 'assistant', content: '...' };
      messagesRef.current = [...updatedMessages, errorMessage];
      setMessages(messagesRef.current);
    } finally {
      setIsThinking(false);
    }
  }, [systemPrompt]);

  const reset = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
    setIsThinking(false);
  }, []);

  return { messages, isThinking, sendMessage, reset };
};

export default useNPCConversation;
